-- =====================================================================
--  PhysiquePro · étape 13 : copies modifiables des documents pour chaque élève
--  Créées par le professeur dans SON OneDrive et partagées en modification avec l'élève
--  (comme « Faire une copie pour chaque élève » dans Google Classroom)
-- =====================================================================
create table if not exists public.copies (
  id          bigint generated always as identity primary key,
  classe_id   text   not null references public.classes(id) on delete cascade,
  objet       text   not null check (objet in ('devoir','support')),
  objet_id    bigint not null,
  source      text   not null,            -- identifiant OneDrive du document du professeur
  eleve_email text   not null,
  nom         text   not null,
  od_id       text   not null,            -- identifiant OneDrive de la copie
  web         text   not null,            -- lien d'ouverture de la copie
  cree_le     timestamptz not null default now(),
  unique (objet, objet_id, source, eleve_email)
);
create index if not exists copies_eleve_idx on public.copies(eleve_email);
alter table public.copies enable row level security;
drop policy if exists copies_lecture on public.copies;
create policy copies_lecture on public.copies for select to authenticated
  using (public.est_prof() or eleve_email = public.mon_email());
drop policy if exists copies_prof on public.copies;
create policy copies_prof on public.copies for all to authenticated
  using (public.est_prof()) with check (public.est_prof());
grant select, insert, update, delete on public.copies to authenticated;
select 'PhysiquePro : copies élèves installées ✓' as resultat;
