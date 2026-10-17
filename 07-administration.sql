-- =====================================================================
--  PhysiquePro · étape 7 : tout gérer depuis le site
--  - réglages du site (nom, titre, liens rapides, boîte à outils)
--  - liste des fichiers stockés (pour la page Administration > Fichiers)
--  Le script peut être relancé sans danger.
-- =====================================================================

-- 1. Réglages du site : une seule ligne (id = 1), lisible par tous les connectés
create table if not exists public.reglages (
  id         int primary key default 1 check (id = 1),
  data       jsonb not null default '{}',
  modifie_le timestamptz not null default now()
);
insert into public.reglages (id) values (1) on conflict (id) do nothing;

alter table public.reglages enable row level security;
drop policy if exists reglages_lecture on public.reglages;
drop policy if exists reglages_prof    on public.reglages;
create policy reglages_lecture on public.reglages for select to authenticated using (true);
create policy reglages_prof    on public.reglages for all    to authenticated
  using (public.est_prof()) with check (public.est_prof());
revoke all on public.reglages from anon;
grant select, insert, update on public.reglages to authenticated;

-- 2. Liste des fichiers stockés (documents du prof + travaux rendus), réservée au prof
create or replace function public.pp_fichiers()
returns table (bucket text, chemin text, taille bigint, cree_le timestamptz)
language plpgsql stable security definer set search_path = public, storage as $$
begin
  if not public.est_prof() then raise exception 'Réservé au professeur.'; end if;
  return query
    select o.bucket_id::text, o.name::text,
           coalesce((o.metadata ->> 'size')::bigint, 0), o.created_at
    from storage.objects o
    where o.bucket_id in ('documents', 'rendus')
    order by o.created_at desc;
end $$;
revoke all on function public.pp_fichiers() from public, anon;
grant execute on function public.pp_fichiers() to authenticated;

-- 3. Rejoindre un cours : refuser les cours archivés
create or replace function public.rejoindre_classe(p_code text, p_nom text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  e text := public.mon_email();
  c classes%rowtype;
begin
  if auth.uid() is null then raise exception 'Connexion requise.'; end if;
  if e not like '%@' || public.domaine_autorise() then raise exception 'Adresse non autorisée.'; end if;
  select * into c from classes where lower(code) = lower(trim(p_code));
  if not found then raise exception 'Code de cours introuvable. Vérifie le code donné par ton professeur.'; end if;
  if not c.code_actif or c.archive then raise exception 'Ce code de cours est désactivé. Demande à ton professeur.'; end if;
  insert into inscriptions (classe_id, email, nom)
  values (c.id, e, coalesce(nullif(trim(p_nom), ''), e))
  on conflict (classe_id, email) do nothing;
  return jsonb_build_object('id', c.id, 'nom', c.nom);
end $$;
revoke all on function public.rejoindre_classe(text, text) from anon;


-- 4. Post « Question » (comme Classroom) : un devoir de type question, réponse écrite par l'élève
alter table public.devoirs add column if not exists type text not null default 'devoir';
alter table public.devoirs drop constraint if exists devoirs_type_check;
alter table public.devoirs add constraint devoirs_type_check check (type in ('devoir', 'question'));
alter table public.devoirs add column if not exists question jsonb;   -- {format:'courte'|'choix', options:[…], voir:bool, modifier:bool}
alter table public.rendus  add column if not exists reponse text;

-- L'élève voit les réponses de ses camarades si le prof l'autorise, une fois qu'il a lui-même répondu
create or replace function public.reponses_visibles(did bigint) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from devoirs d where d.id = did and d.type = 'question'
                   and coalesce((d.question ->> 'voir')::boolean, false)
                   and not d.brouillon and d.publie_le <= now() and public.dans_classe(d.classe_id))
     and exists (select 1 from rendus r where r.devoir_id = did and r.auteur = auth.uid())
$$;
-- L'élève peut annuler / modifier sa réponse sauf si le prof l'a interdit
create or replace function public.reponse_modifiable(did bigint) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select d.type <> 'question' or coalesce((d.question ->> 'modifier')::boolean, true)
                   from devoirs d where d.id = did), false)
$$;
drop policy if exists rendus_camarades on public.rendus;
create policy rendus_camarades on public.rendus for select to authenticated
  using (public.reponses_visibles(devoir_id));
drop policy if exists rendus_annuler on public.rendus;
create policy rendus_annuler on public.rendus for delete to authenticated
  using (public.est_prof() or (auteur = auth.uid() and public.devoir_ouvert(devoir_id)
         and public.reponse_modifiable(devoir_id)
         and not exists (select 1 from public.corrections c where c.rendu_id = rendus.id and c.publiee)));

-- 5. Questionnaires : choix unique, cases à cocher, réponse courte
--    questions[i].t = 'choix' (défaut) | 'cases' | 'courte'
--    bonnes[i] = index | [index, …] | ["réponse acceptée", …]
create or replace function public.pp_norm(t text) returns text
language sql immutable as $$
  select btrim(regexp_replace(translate(lower(coalesce(t, '')), 'àâäáãéèêëíìîïóòôöõúùûüçñ''’', 'aaaaaeeeeiiiiooooouuuucn  '), '\s+', ' ', 'g'))
$$;
create or replace function public.pp_juste(t text, rep jsonb, bon jsonb) returns boolean
language plpgsql immutable as $$
begin
  if rep is null or rep = 'null'::jsonb or bon is null then return false; end if;
  if t = 'cases' then
    if jsonb_typeof(rep) <> 'array' or jsonb_typeof(bon) <> 'array' then return false; end if;
    return coalesce((select jsonb_agg(x order by x) from (select distinct x from jsonb_array_elements(rep) x) a), '[]')
         = coalesce((select jsonb_agg(x order by x) from (select distinct x from jsonb_array_elements(bon) x) b), '[]');
  elsif t = 'courte' then
    if jsonb_typeof(bon) <> 'array' or public.pp_norm(rep #>> '{}') = '' then return false; end if;
    return exists (select 1 from jsonb_array_elements_text(bon) a where public.pp_norm(a) = public.pp_norm(rep #>> '{}'));
  else
    return (rep #>> '{}') = (bon #>> '{}');
  end if;
end $$;

create or replace function public.soumettre_quiz(qid bigint, reponses jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  q quiz%rowtype; sol jsonb; n int; s int := 0; i int;
begin
  if auth.uid() is null then raise exception 'Connexion requise.'; end if;
  select * into q from quiz where id = qid;
  if not found or q.brouillon or q.publie_le > now() or not public.dans_classe(q.classe_id)
     or (q.eleves is not null and not (public.mon_email() = any(q.eleves))) then raise exception 'Questionnaire introuvable.'; end if;
  if q.date_limite is not null and q.date_limite <= now() then raise exception 'La date limite de ce questionnaire est passée.'; end if;
  if q.mode = 'note' and exists (select 1 from resultats_quiz where quiz_id = qid and eleve = auth.uid()) then
    raise exception 'Tu as déjà répondu à ce questionnaire.';
  end if;
  select bonnes into sol from quiz_solutions where quiz_id = qid;
  n := jsonb_array_length(coalesce(sol, '[]'));
  for i in 0 .. n - 1 loop
    if public.pp_juste(coalesce(q.questions -> i ->> 't', 'choix'), reponses -> i, sol -> i) then s := s + 1; end if;
  end loop;
  if q.mode = 'note' then
    insert into resultats_quiz (quiz_id, eleve, reponses, score, sur) values (qid, auth.uid(), reponses, s, n);
  end if;
  return jsonb_build_object('score', s, 'sur', n,
    'bonnes', case when q.mode = 'entrainement' or q.montrer_correction then sol else null end);
end $$;

-- 6. Illustration du bandeau de cours (choisie dans les paramètres du cours)
alter table public.classes add column if not exists illustration text;

select 'PhysiquePro : administration installée ✓' as resultat;
