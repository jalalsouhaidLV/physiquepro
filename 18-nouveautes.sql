-- =====================================================================
--  PhysiquePro · étape 18 : préparateur, compétences, copies annotées,
--  dernière visite (alertes décrochage), prise de rendez-vous
-- =====================================================================

-- 1. Compétences, copie annotée et commentaire vocal dans la correction
alter table public.corrections add column if not exists competences jsonb;   -- {"APP":"A","ANA":"B",…}
alter table public.corrections add column if not exists annotations jsonb;   -- [{nom, od:{id,web}} | {nom, chemin}]
alter table public.corrections add column if not exists audio       jsonb;   -- [{nom, od:{id,web}} | {nom, chemin}]

-- le prof peut déposer des fichiers (copies corrigées, commentaires vocaux) dans le dossier de l'élève
drop policy if exists "rendus : prof" on storage.objects;
create policy "rendus : prof" on storage.objects for all to authenticated
  using (bucket_id = 'rendus' and public.est_prof()) with check (bucket_id = 'rendus' and public.est_prof());

-- 2. Dernière visite (pour repérer les élèves qui ne se connectent plus)
alter table public.profiles add column if not exists derniere_visite timestamptz;
create or replace function public.pp_visite() returns void
language sql security definer set search_path = public as $$
  update public.profiles set derniere_visite = now() where id = auth.uid();
$$;
revoke all on function public.pp_visite() from public, anon;
grant execute on function public.pp_visite() to authenticated;

-- 3. Demandes de matériel au préparateur (réservées au prof)
create table if not exists public.demandes_materiel (
  id         bigint generated always as identity primary key,
  classe_id  text references public.classes(id) on delete set null,
  devoir_id  bigint references public.devoirs(id) on delete set null,
  titre      text not null,
  date_tp    timestamptz,
  salle      text not null default '',
  postes     int,
  solutions  text not null default '',
  materiel   text not null default '',
  remarques  text not null default '',
  statut     text not null default 'brouillon' check (statut in ('brouillon','envoyee','prete')),
  cree_le    timestamptz not null default now(),
  envoye_le  timestamptz
);
alter table public.demandes_materiel enable row level security;
drop policy if exists dm_prof on public.demandes_materiel;
create policy dm_prof on public.demandes_materiel for all to authenticated using (public.est_prof()) with check (public.est_prof());
revoke all on public.demandes_materiel from anon;
grant select, insert, update, delete on public.demandes_materiel to authenticated;

-- 4. Prise de rendez-vous : séries de créneaux créées par le prof, réservées par les élèves
create table if not exists public.rdv_series (
  id         bigint generated always as identity primary key,
  classe_id  text not null references public.classes(id) on delete cascade,
  titre      text not null,
  lieu       text not null default '',
  consigne   text not null default '',
  cree_le    timestamptz not null default now()
);
create table if not exists public.rdv_creneaux (
  id         bigint generated always as identity primary key,
  serie_id   bigint not null references public.rdv_series(id) on delete cascade,
  debut      timestamptz not null,
  fin        timestamptz not null,
  capacite   int not null default 1 check (capacite between 1 and 40)
);
create table if not exists public.rdv_reservations (
  creneau_id  bigint not null references public.rdv_creneaux(id) on delete cascade,
  serie_id    bigint not null references public.rdv_series(id) on delete cascade,
  eleve       uuid not null references public.profiles(id) on delete cascade,
  eleve_email text not null,
  eleve_nom   text not null default '',
  cree_le     timestamptz not null default now(),
  primary key (serie_id, eleve)
);
alter table public.rdv_series enable row level security;
alter table public.rdv_creneaux enable row level security;
alter table public.rdv_reservations enable row level security;
drop policy if exists rdvs_lecture on public.rdv_series;
drop policy if exists rdvs_prof on public.rdv_series;
drop policy if exists rdvc_lecture on public.rdv_creneaux;
drop policy if exists rdvc_prof on public.rdv_creneaux;
drop policy if exists rdvr_lecture on public.rdv_reservations;
drop policy if exists rdvr_prof on public.rdv_reservations;
create policy rdvs_lecture on public.rdv_series for select to authenticated using (public.est_prof() or public.dans_classe(classe_id));
create policy rdvs_prof on public.rdv_series for all to authenticated using (public.est_prof()) with check (public.est_prof());
create policy rdvc_lecture on public.rdv_creneaux for select to authenticated
  using (public.est_prof() or exists (select 1 from public.rdv_series s where s.id = serie_id and public.dans_classe(s.classe_id)));
create policy rdvc_prof on public.rdv_creneaux for all to authenticated using (public.est_prof()) with check (public.est_prof());
-- un élève ne voit que SA réservation ; le nombre de places prises passe par pp_places (sans les noms)
create policy rdvr_lecture on public.rdv_reservations for select to authenticated
  using (public.est_prof() or eleve = auth.uid());
create policy rdvr_prof on public.rdv_reservations for all to authenticated using (public.est_prof()) with check (public.est_prof());
revoke all on public.rdv_series, public.rdv_creneaux, public.rdv_reservations from anon;
grant select, insert, update, delete on public.rdv_series, public.rdv_creneaux, public.rdv_reservations to authenticated;

-- réserver (ou changer de) créneau : vérifie la place restante, un seul créneau par série
create or replace function public.pp_reserver(p_creneau bigint) returns void
language plpgsql security definer set search_path = public as $$
declare c record; pris int; moi text := public.mon_email(); nm text;
begin
  select cr.*, s.classe_id into c from public.rdv_creneaux cr join public.rdv_series s on s.id = cr.serie_id where cr.id = p_creneau;
  if not found then raise exception 'Créneau introuvable.'; end if;
  if not public.dans_classe(c.classe_id) then raise exception 'Tu n''es pas inscrit dans ce cours.'; end if;
  if c.debut <= now() then raise exception 'Ce créneau est déjà passé.'; end if;
  perform 1 from public.rdv_creneaux where id = p_creneau for update;
  select count(*) into pris from public.rdv_reservations where creneau_id = p_creneau and eleve <> auth.uid();
  if pris >= c.capacite then raise exception 'Ce créneau vient d''être pris. Choisis-en un autre.'; end if;
  select coalesce((select nom from public.inscriptions where email = moi limit 1), moi) into nm;
  delete from public.rdv_reservations where serie_id = c.serie_id and eleve = auth.uid();
  insert into public.rdv_reservations (creneau_id, serie_id, eleve, eleve_email, eleve_nom) values (p_creneau, c.serie_id, auth.uid(), moi, nm);
end $$;
create or replace function public.pp_annuler_rdv(p_serie bigint) returns void
language sql security definer set search_path = public as $$
  delete from public.rdv_reservations where serie_id = p_serie and eleve = auth.uid()
    and creneau_id in (select id from public.rdv_creneaux where debut > now());
$$;
create or replace function public.pp_places() returns table(creneau_id bigint, pris int)
language sql stable security definer set search_path = public as $$
  select r.creneau_id, count(*)::int from public.rdv_reservations r
  join public.rdv_series s on s.id = r.serie_id
  where public.est_prof() or public.dans_classe(s.classe_id)
  group by r.creneau_id;
$$;
revoke all on function public.pp_reserver(bigint), public.pp_annuler_rdv(bigint), public.pp_places() from public, anon;
grant execute on function public.pp_reserver(bigint), public.pp_annuler_rdv(bigint), public.pp_places() to authenticated;

select 'PhysiquePro : étape 18 installée ✓' as resultat;
