-- =====================================================================
--  PhysiquePro · structure de la base de données (Supabase / PostgreSQL)
--  À exécuter UNE FOIS dans Supabase : SQL Editor > New query > coller > Run
--  Le script peut être relancé sans danger (il recrée les fonctions et règles).
-- =====================================================================

-- ---------- 0. Réglages ----------------------------------------------
-- Domaine autorisé et adresse du professeur (en minuscules)
create or replace function public.domaine_autorise() returns text
language sql immutable as $$ select 'lycee-verdun.edu.lb'::text $$;

create or replace function public.email_prof() returns text
language sql immutable as $$ select 'jalal.souhaid@lycee-verdun.edu.lb'::text $$;

-- ---------- 1. Tables -------------------------------------------------

-- Profil créé automatiquement à la première connexion Microsoft
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null unique,
  nom        text not null,
  role       text not null default 'eleve' check (role in ('eleve','prof')),
  cree_le    timestamptz not null default now()
);

create table if not exists public.classes (
  id       text primary key,                 -- ex. 'tle', 'snt'
  nom      text not null,
  section  text not null default '',
  couleur  text not null default 'pc',       -- pc, snt, si, tech, pix
  symbole  text not null default '',
  ordre    int  not null default 0,
  dossier_onedrive text                      -- lien du dossier OneDrive de la classe
);

-- Listes de classe (importées depuis les listes de l'administration)
create table if not exists public.inscriptions (
  classe_id text not null references public.classes(id) on delete cascade,
  email     text not null check (email = lower(email)),
  nom       text not null,
  primary key (classe_id, email)
);

create table if not exists public.themes (
  id        bigint generated always as identity primary key,
  classe_id text not null references public.classes(id) on delete cascade,
  titre     text not null,
  ordre     int  not null default 0
);

-- Supports de cours (liens vers OneDrive)
create table if not exists public.supports (
  id         bigint generated always as identity primary key,
  classe_id  text not null references public.classes(id) on delete cascade,
  theme_id   bigint references public.themes(id) on delete set null,
  titre      text not null,
  description text not null default '',
  ressources jsonb not null default '[]',    -- [{type:'PDF', label:'Cours', url:'https://…'}]
  publie_le  timestamptz not null default now()
);

create table if not exists public.devoirs (
  id          bigint generated always as identity primary key,
  classe_id   text not null references public.classes(id) on delete cascade,
  theme_id    bigint references public.themes(id) on delete set null,
  titre       text not null,
  consigne    text not null default '',
  ressources  jsonb not null default '[]',
  date_limite timestamptz not null,
  mode        text not null default 'individuel' check (mode in ('individuel','binome')),
  formats     text not null default '',
  points      int  not null default 20,
  publie_le   timestamptz not null default now()
);

-- Rendus des élèves
create table if not exists public.rendus (
  id           bigint generated always as identity primary key,
  devoir_id    bigint not null references public.devoirs(id) on delete cascade,
  auteur       uuid   not null references public.profiles(id) on delete cascade,
  auteur_email text   not null,
  binome_email text,                         -- partenaire (devoir en binôme)
  fichiers     jsonb  not null default '[]', -- [{chemin, nom, taille}]
  lien         text,                         -- lien OneDrive (vidéo)
  rendu_le     timestamptz not null default now(),
  unique (devoir_id, auteur)
);

-- Corrections (séparées des rendus pour que l'élève ne voie la note qu'une fois publiée)
create table if not exists public.corrections (
  rendu_id    bigint primary key references public.rendus(id) on delete cascade,
  note        numeric(5,2) check (note >= 0),
  commentaire text not null default '',
  publiee     boolean not null default false,
  modifie_le  timestamptz not null default now()
);

-- Quiz : les questions sont visibles, les bonnes réponses ne le sont pas
create table if not exists public.quiz (
  id          bigint generated always as identity primary key,
  classe_id   text not null references public.classes(id) on delete cascade,
  theme_id    bigint references public.themes(id) on delete set null,
  titre       text not null,
  mode        text not null default 'entrainement' check (mode in ('entrainement','note')),
  questions   jsonb not null default '[]',   -- [{q:'…', o:['…','…']}]
  date_limite timestamptz,
  publie_le   timestamptz not null default now()
);

create table if not exists public.quiz_solutions (
  quiz_id bigint primary key references public.quiz(id) on delete cascade,
  bonnes  jsonb not null default '[]'        -- [1, 2, 0, …] index de la bonne réponse
);

create table if not exists public.resultats_quiz (
  quiz_id  bigint not null references public.quiz(id) on delete cascade,
  eleve    uuid   not null references public.profiles(id) on delete cascade,
  reponses jsonb  not null,
  score    int    not null,
  sur      int    not null,
  fait_le  timestamptz not null default now(),
  primary key (quiz_id, eleve)
);

create index if not exists rendus_devoir_idx   on public.rendus(devoir_id);
create index if not exists rendus_binome_idx   on public.rendus(binome_email);
create index if not exists inscriptions_email_idx on public.inscriptions(email);
create index if not exists devoirs_classe_idx  on public.devoirs(classe_id);

-- ---------- 2. Fonctions utilitaires ---------------------------------

create or replace function public.mon_email() returns text
language sql stable as $$ select lower(coalesce(auth.jwt() ->> 'email', '')) $$;

create or replace function public.est_prof() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'prof')
$$;

create or replace function public.dans_classe(cid text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from inscriptions where classe_id = cid and email = public.mon_email())
$$;

create or replace function public.classe_du_devoir(did bigint) returns text
language sql stable security definer set search_path = public as $$
  select classe_id from devoirs where id = did
$$;

create or replace function public.devoir_ouvert(did bigint) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select date_limite > now() from devoirs where id = did), false)
$$;

-- Toutes les vérifications avant qu'un élève puisse rendre un devoir
create or replace function public.peut_rendre(did bigint, partenaire text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare
  d  devoirs%rowtype;
  moi text := public.mon_email();
  p  text := lower(nullif(trim(partenaire), ''));
begin
  select * into d from devoirs where id = did;
  if not found or d.date_limite <= now() or d.publie_le > now() then return false; end if;
  if not exists (select 1 from inscriptions where classe_id = d.classe_id and email = moi) then return false; end if;
  if d.mode = 'individuel' and p is not null then return false; end if;
  if d.mode = 'binome' then
    if p is null or p = moi then return false; end if;
    if not exists (select 1 from inscriptions where classe_id = d.classe_id and email = p) then return false; end if;
  end if;
  -- ni moi ni mon binôme n'avons déjà rendu ce devoir
  if exists (select 1 from rendus r where r.devoir_id = did
             and (r.auteur_email in (moi, coalesce(p, moi)) or r.binome_email in (moi, coalesce(p, moi)))) then
    return false;
  end if;
  return true;
end $$;

-- ---------- 3. Création automatique du profil ------------------------

create or replace function public.nouvel_utilisateur() returns trigger
language plpgsql security definer set search_path = public as $$
declare e text := lower(new.email);
begin
  if e is null or e not like '%@' || public.domaine_autorise() then
    raise exception 'Adresse non autorisée : seules les adresses @% peuvent se connecter.', public.domaine_autorise();
  end if;
  insert into public.profiles (id, email, nom, role)
  values (new.id, e,
          coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', e),
          case when e = public.email_prof() then 'prof' else 'eleve' end)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.nouvel_utilisateur();

-- ---------- 4. Quiz : envoi et correction côté serveur ----------------

create or replace function public.soumettre_quiz(qid bigint, reponses jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  q quiz%rowtype; sol jsonb; n int; s int := 0; i int;
begin
  if auth.uid() is null then raise exception 'Connexion requise.'; end if;
  select * into q from quiz where id = qid;
  if not found or q.publie_le > now() or not public.dans_classe(q.classe_id) then raise exception 'Quiz introuvable.'; end if;
  if q.date_limite is not null and q.date_limite <= now() then raise exception 'La date limite de ce quiz est passée.'; end if;
  if q.mode = 'note' and exists (select 1 from resultats_quiz where quiz_id = qid and eleve = auth.uid()) then
    raise exception 'Tu as déjà répondu à ce quiz.';
  end if;
  select bonnes into sol from quiz_solutions where quiz_id = qid;
  n := jsonb_array_length(coalesce(sol, '[]'));
  for i in 0 .. n - 1 loop
    if (reponses -> i) is not null and (reponses ->> i) = (sol ->> i) then s := s + 1; end if;
  end loop;
  if q.mode = 'note' then
    insert into resultats_quiz (quiz_id, eleve, reponses, score, sur) values (qid, auth.uid(), reponses, s, n);
  end if;
  return jsonb_build_object('score', s, 'sur', n, 'bonnes', sol);
end $$;

-- ---------- 5. Sécurité : règles d'accès (RLS) -----------------------

alter table public.profiles       enable row level security;
alter table public.classes        enable row level security;
alter table public.inscriptions   enable row level security;
alter table public.themes         enable row level security;
alter table public.supports       enable row level security;
alter table public.devoirs        enable row level security;
alter table public.rendus         enable row level security;
alter table public.corrections    enable row level security;
alter table public.quiz           enable row level security;
alter table public.quiz_solutions enable row level security;
alter table public.resultats_quiz enable row level security;

do $$ declare t text; p record; begin
  foreach t in array array['profiles','classes','inscriptions','themes','supports','devoirs','rendus','corrections','quiz','quiz_solutions','resultats_quiz'] loop
    for p in select policyname from pg_policies where schemaname = 'public' and tablename = t loop
      execute format('drop policy %I on public.%I', p.policyname, t);
    end loop;
  end loop;
end $$;

-- Profils : chacun voit le sien ; le prof voit tout. Personne ne modifie son rôle.
create policy profil_lecture on public.profiles for select to authenticated
  using (id = auth.uid() or public.est_prof());

-- Classes : visibles par le prof et par les élèves inscrits
create policy classes_lecture on public.classes for select to authenticated
  using (public.est_prof() or public.dans_classe(id));
create policy classes_prof on public.classes for all to authenticated
  using (public.est_prof()) with check (public.est_prof());

-- Inscriptions : un élève voit la liste de ses classes (pour l'onglet Personnes et le choix du binôme)
create policy inscriptions_lecture on public.inscriptions for select to authenticated
  using (public.est_prof() or public.dans_classe(classe_id));
create policy inscriptions_prof on public.inscriptions for all to authenticated
  using (public.est_prof()) with check (public.est_prof());

-- Thèmes, supports, devoirs, quiz : lecture par la classe (une fois publiés), écriture par le prof
create policy themes_lecture on public.themes for select to authenticated
  using (public.est_prof() or public.dans_classe(classe_id));
create policy themes_prof on public.themes for all to authenticated
  using (public.est_prof()) with check (public.est_prof());

create policy supports_lecture on public.supports for select to authenticated
  using (public.est_prof() or (public.dans_classe(classe_id) and publie_le <= now()));
create policy supports_prof on public.supports for all to authenticated
  using (public.est_prof()) with check (public.est_prof());

create policy devoirs_lecture on public.devoirs for select to authenticated
  using (public.est_prof() or (public.dans_classe(classe_id) and publie_le <= now()));
create policy devoirs_prof on public.devoirs for all to authenticated
  using (public.est_prof()) with check (public.est_prof());

create policy quiz_lecture on public.quiz for select to authenticated
  using (public.est_prof() or (public.dans_classe(classe_id) and publie_le <= now()));
create policy quiz_prof on public.quiz for all to authenticated
  using (public.est_prof()) with check (public.est_prof());

create policy solutions_prof on public.quiz_solutions for all to authenticated
  using (public.est_prof()) with check (public.est_prof());

create policy resultats_lecture on public.resultats_quiz for select to authenticated
  using (public.est_prof() or eleve = auth.uid());
create policy resultats_prof on public.resultats_quiz for all to authenticated
  using (public.est_prof()) with check (public.est_prof());

-- Rendus : l'élève voit les siens et ceux où il est le binôme ; il rend avant la date limite
create policy rendus_lecture on public.rendus for select to authenticated
  using (public.est_prof() or auteur = auth.uid() or binome_email = public.mon_email());
create policy rendus_depot on public.rendus for insert to authenticated
  with check (auteur = auth.uid() and auteur_email = public.mon_email()
              and public.peut_rendre(devoir_id, binome_email));
create policy rendus_annuler on public.rendus for delete to authenticated
  using (public.est_prof() or (auteur = auth.uid() and public.devoir_ouvert(devoir_id)
         and not exists (select 1 from public.corrections c where c.rendu_id = rendus.id and c.publiee)));

-- Corrections : le prof gère tout ; l'élève (et son binôme) voit seulement une correction publiée
create policy corrections_lecture on public.corrections for select to authenticated
  using (public.est_prof() or (publiee and exists (
         select 1 from public.rendus r where r.id = rendu_id
         and (r.auteur = auth.uid() or r.binome_email = public.mon_email()))));
create policy corrections_prof on public.corrections for all to authenticated
  using (public.est_prof()) with check (public.est_prof());

-- Les visiteurs non connectés n'ont accès à rien
revoke all on all tables in schema public from anon;

-- ---------- 6. Stockage des fichiers rendus --------------------------
-- Dossier privé « rendus », 50 Mo maximum par fichier.
-- Chemin d'un fichier : <id du devoir>/<id de l'élève>/<nom du fichier>

insert into storage.buckets (id, name, public, file_size_limit)
values ('rendus', 'rendus', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = 52428800;

drop policy if exists "rendus : depot eleve"   on storage.objects;
drop policy if exists "rendus : lecture"       on storage.objects;
drop policy if exists "rendus : suppression"   on storage.objects;

create policy "rendus : depot eleve" on storage.objects for insert to authenticated
  with check (bucket_id = 'rendus'
    and (storage.foldername(name))[2] = auth.uid()::text
    and (storage.foldername(name))[1] ~ '^[0-9]+$'
    and public.devoir_ouvert(((storage.foldername(name))[1])::bigint)
    and public.dans_classe(public.classe_du_devoir(((storage.foldername(name))[1])::bigint)));

create policy "rendus : lecture" on storage.objects for select to authenticated
  using (bucket_id = 'rendus' and (
    public.est_prof()
    or (storage.foldername(name))[2] = auth.uid()::text
    or exists (select 1 from public.rendus r
               where r.auteur::text = (storage.foldername(name))[2]
                 and r.devoir_id::text = (storage.foldername(name))[1]
                 and r.binome_email = public.mon_email())));

create policy "rendus : suppression" on storage.objects for delete to authenticated
  using (bucket_id = 'rendus' and (
    public.est_prof()
    or ((storage.foldername(name))[2] = auth.uid()::text
        and (storage.foldername(name))[1] ~ '^[0-9]+$'
        and public.devoir_ouvert(((storage.foldername(name))[1])::bigint))));

-- ---------- 7. Tes classes --------------------------------------------

insert into public.classes (id, nom, section, couleur, symbole, ordre) values
  ('tle', 'Terminale spé PC', 'Spécialité physique-chimie',                    'pc',   'Tle', 1),
  ('1re', '1re spé PC',       'Spécialité physique-chimie',                    'pc',   '1re', 2),
  ('snt', 'SNT',              'Seconde · Sciences numériques et technologie',  'snt',  'SNT', 3),
  ('si',  'Option SI',        'Seconde · Sciences de l''ingénieur',            'si',   'SI',  4),
  ('3e',  'Technologie 3e',   'Collège · Cycle 4',                             'tech', '3e',  5),
  ('pix', 'PIX',              'Compétences numériques',                        'pix',  'PIX', 6)
on conflict (id) do nothing;

-- Fin du script
select 'PhysiquePro : structure installée ✓' as resultat;
