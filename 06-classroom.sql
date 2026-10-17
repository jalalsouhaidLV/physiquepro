-- =====================================================================
--  PhysiquePro · fonctions Classroom : paramètres du cours, flux,
--  commentaires, archives, attribution ciblée, questionnaires
-- =====================================================================

-- 1. Paramètres du cours
alter table public.classes add column if not exists description text not null default '';
alter table public.classes add column if not exists niveau  text not null default '';
alter table public.classes add column if not exists matiere text not null default '';
alter table public.classes add column if not exists salle   text not null default '';
alter table public.classes add column if not exists archive boolean not null default false;
alter table public.classes add column if not exists flux_mode text not null default 'prof';
alter table public.classes add column if not exists flux_devoirs boolean not null default true;
alter table public.classes add column if not exists teams_url text;
alter table public.classes add column if not exists teams_visible boolean not null default true;
alter table public.classes add column if not exists moyenne_visible boolean not null default false;
alter table public.classes drop constraint if exists classes_flux_mode_check;
alter table public.classes add constraint classes_flux_mode_check check (flux_mode in ('masque','prof','prof_seul','eleves'));
-- masque    : le flux n'est pas visible par les élèves
-- prof      : seuls les enseignants publient, les élèves peuvent commenter
-- prof_seul : seuls les enseignants publient et commentent
-- eleves    : les élèves peuvent publier et commenter

-- 2. Attribuer à certains élèves seulement (null = toute la classe)
alter table public.devoirs  add column if not exists eleves text[];
alter table public.supports add column if not exists eleves text[];
alter table public.quiz     add column if not exists eleves text[];
alter table public.quiz     add column if not exists consigne text not null default '';
alter table public.quiz     add column if not exists points int not null default 20;
alter table public.quiz     add column if not exists montrer_correction boolean not null default true;

create or replace function public.cible_moi(liste text[]) returns boolean
language sql stable as $$ select liste is null or public.mon_email() = any(liste) $$;

drop policy if exists supports_lecture on public.supports;
create policy supports_lecture on public.supports for select to authenticated
  using (public.est_prof() or (public.dans_classe(classe_id) and not brouillon and publie_le <= now() and public.cible_moi(eleves)));
drop policy if exists devoirs_lecture on public.devoirs;
create policy devoirs_lecture on public.devoirs for select to authenticated
  using (public.est_prof() or (public.dans_classe(classe_id) and not brouillon and publie_le <= now() and public.cible_moi(eleves)));
drop policy if exists quiz_lecture on public.quiz;
create policy quiz_lecture on public.quiz for select to authenticated
  using (public.est_prof() or (public.dans_classe(classe_id) and not brouillon and publie_le <= now() and public.cible_moi(eleves)));

create or replace function public.peut_rendre(did bigint, partenaire text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare
  d  devoirs%rowtype;
  moi text := public.mon_email();
  p  text := lower(nullif(trim(partenaire), ''));
begin
  select * into d from devoirs where id = did;
  if not found or d.brouillon or (d.date_limite is not null and d.date_limite <= now()) or d.publie_le > now() then return false; end if;
  if not exists (select 1 from inscriptions where classe_id = d.classe_id and email = moi) then return false; end if;
  if d.eleves is not null and not (moi = any(d.eleves)) then return false; end if;
  if d.mode = 'individuel' and p is not null then return false; end if;
  if d.mode = 'binome' then
    if p is null or p = moi then return false; end if;
    if not exists (select 1 from inscriptions where classe_id = d.classe_id and email = p) then return false; end if;
    if d.eleves is not null and not (p = any(d.eleves)) then return false; end if;
  end if;
  if exists (select 1 from rendus r where r.devoir_id = did
             and (r.auteur_email in (moi, coalesce(p, moi)) or r.binome_email in (moi, coalesce(p, moi)))) then
    return false;
  end if;
  return true;
end $$;

-- Questionnaire : correction côté serveur, réponses cachées si le prof le souhaite
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
    if (reponses -> i) is not null and (reponses ->> i) = (sol ->> i) then s := s + 1; end if;
  end loop;
  if q.mode = 'note' then
    insert into resultats_quiz (quiz_id, eleve, reponses, score, sur) values (qid, auth.uid(), reponses, s, n);
  end if;
  return jsonb_build_object('score', s, 'sur', n,
    'bonnes', case when q.mode = 'entrainement' or q.montrer_correction then sol else null end);
end $$;

-- 3. Flux : annonces et commentaires
create or replace function public.flux_mode_de(cid text) returns text
language sql stable security definer set search_path = public as $$ select flux_mode from classes where id = cid $$;

create table if not exists public.annonces (
  id         bigint generated always as identity primary key,
  classe_id  text not null references public.classes(id) on delete cascade,
  auteur     uuid references public.profiles(id) on delete set null,
  auteur_nom text not null default '',
  texte      text not null default '',
  ressources jsonb not null default '[]',
  cree_le    timestamptz not null default now()
);
create table if not exists public.commentaires (
  id         bigint generated always as identity primary key,
  annonce_id bigint not null references public.annonces(id) on delete cascade,
  auteur     uuid references public.profiles(id) on delete set null,
  auteur_nom text not null default '',
  texte      text not null,
  cree_le    timestamptz not null default now()
);
create table if not exists public.commentaires_prives (
  id          bigint generated always as identity primary key,
  devoir_id   bigint not null references public.devoirs(id) on delete cascade,
  eleve_email text not null,
  auteur      uuid references public.profiles(id) on delete set null,
  auteur_nom  text not null default '',
  texte       text not null,
  cree_le     timestamptz not null default now()
);
create index if not exists annonces_classe_idx on public.annonces(classe_id);
create index if not exists commentaires_annonce_idx on public.commentaires(annonce_id);
create index if not exists cprives_devoir_idx on public.commentaires_prives(devoir_id, eleve_email);

create or replace function public.classe_de_annonce(aid bigint) returns text
language sql stable security definer set search_path = public as $$ select classe_id from annonces where id = aid $$;

-- Auteur et nom affiché fixés par le serveur (impossible d'écrire au nom de quelqu'un d'autre)
create or replace function public.fixer_auteur() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.auteur := auth.uid();
  if public.est_prof() then
    new.auteur_nom := coalesce(nullif(new.auteur_nom, ''), 'Professeur');
  else
    new.auteur_nom := coalesce((select nom from inscriptions where email = public.mon_email() limit 1), public.mon_email());
  end if;
  return new;
end $$;
drop trigger if exists annonces_auteur on public.annonces;
create trigger annonces_auteur before insert on public.annonces for each row execute function public.fixer_auteur();
drop trigger if exists commentaires_auteur on public.commentaires;
create trigger commentaires_auteur before insert on public.commentaires for each row execute function public.fixer_auteur();
drop trigger if exists cprives_auteur on public.commentaires_prives;
create trigger cprives_auteur before insert on public.commentaires_prives for each row execute function public.fixer_auteur();

alter table public.annonces enable row level security;
alter table public.commentaires enable row level security;
alter table public.commentaires_prives enable row level security;

drop policy if exists annonces_lecture on public.annonces;
drop policy if exists annonces_ajout on public.annonces;
drop policy if exists annonces_modif on public.annonces;
drop policy if exists annonces_suppr on public.annonces;
create policy annonces_lecture on public.annonces for select to authenticated
  using (public.est_prof() or (public.dans_classe(classe_id) and public.flux_mode_de(classe_id) <> 'masque'));
create policy annonces_ajout on public.annonces for insert to authenticated
  with check (public.est_prof() or (public.dans_classe(classe_id) and public.flux_mode_de(classe_id) = 'eleves'));
create policy annonces_modif on public.annonces for update to authenticated
  using (public.est_prof() or auteur = auth.uid()) with check (public.est_prof() or auteur = auth.uid());
create policy annonces_suppr on public.annonces for delete to authenticated
  using (public.est_prof() or auteur = auth.uid());

drop policy if exists commentaires_lecture on public.commentaires;
drop policy if exists commentaires_ajout on public.commentaires;
drop policy if exists commentaires_suppr on public.commentaires;
create policy commentaires_lecture on public.commentaires for select to authenticated
  using (public.est_prof() or (public.dans_classe(public.classe_de_annonce(annonce_id)) and public.flux_mode_de(public.classe_de_annonce(annonce_id)) <> 'masque'));
create policy commentaires_ajout on public.commentaires for insert to authenticated
  with check (public.est_prof() or (public.dans_classe(public.classe_de_annonce(annonce_id)) and public.flux_mode_de(public.classe_de_annonce(annonce_id)) in ('prof','eleves')));
create policy commentaires_suppr on public.commentaires for delete to authenticated
  using (public.est_prof() or auteur = auth.uid());

drop policy if exists cprives_lecture on public.commentaires_prives;
drop policy if exists cprives_ajout on public.commentaires_prives;
drop policy if exists cprives_suppr on public.commentaires_prives;
create policy cprives_lecture on public.commentaires_prives for select to authenticated
  using (public.est_prof() or eleve_email = public.mon_email());
create policy cprives_ajout on public.commentaires_prives for insert to authenticated
  with check (public.est_prof() or (eleve_email = public.mon_email() and public.dans_classe(public.classe_du_devoir(devoir_id))));
create policy cprives_suppr on public.commentaires_prives for delete to authenticated
  using (public.est_prof() or auteur = auth.uid());

revoke all on public.annonces, public.commentaires, public.commentaires_prives from anon;

select 'PhysiquePro : fonctions Classroom installées ✓' as resultat;
