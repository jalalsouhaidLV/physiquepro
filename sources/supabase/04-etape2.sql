-- =====================================================================
--  PhysiquePro · étape 2 : brouillons et documents de cours
--  À exécuter UNE FOIS dans Supabase : SQL Editor > New query > coller > Run
--  (si Supabase propose « Run and enable RLS », choisir ce bouton vert)
-- =====================================================================

-- 1. Brouillons : un élément en brouillon n'est visible que par le professeur
alter table public.supports add column if not exists brouillon boolean not null default false;
alter table public.devoirs  add column if not exists brouillon boolean not null default false;
alter table public.quiz     add column if not exists brouillon boolean not null default false;

drop policy if exists supports_lecture on public.supports;
create policy supports_lecture on public.supports for select to authenticated
  using (public.est_prof() or (public.dans_classe(classe_id) and not brouillon and publie_le <= now()));

drop policy if exists devoirs_lecture on public.devoirs;
create policy devoirs_lecture on public.devoirs for select to authenticated
  using (public.est_prof() or (public.dans_classe(classe_id) and not brouillon and publie_le <= now()));

drop policy if exists quiz_lecture on public.quiz;
create policy quiz_lecture on public.quiz for select to authenticated
  using (public.est_prof() or (public.dans_classe(classe_id) and not brouillon and publie_le <= now()));

-- un élève ne peut pas rendre un devoir encore en brouillon
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
  if d.mode = 'individuel' and p is not null then return false; end if;
  if d.mode = 'binome' then
    if p is null or p = moi then return false; end if;
    if not exists (select 1 from inscriptions where classe_id = d.classe_id and email = p) then return false; end if;
  end if;
  if exists (select 1 from rendus r where r.devoir_id = did
             and (r.auteur_email in (moi, coalesce(p, moi)) or r.binome_email in (moi, coalesce(p, moi)))) then
    return false;
  end if;
  return true;
end $$;

-- 2. Documents de cours déposés par le professeur (50 Mo max par fichier)
--    Chemin : <id de la classe>/<nom du fichier>
insert into storage.buckets (id, name, public, file_size_limit)
values ('documents', 'documents', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = 52428800;

drop policy if exists "documents : prof"    on storage.objects;
drop policy if exists "documents : lecture" on storage.objects;

create policy "documents : prof" on storage.objects for all to authenticated
  using (bucket_id = 'documents' and public.est_prof())
  with check (bucket_id = 'documents' and public.est_prof());

create policy "documents : lecture" on storage.objects for select to authenticated
  using (bucket_id = 'documents' and public.dans_classe((storage.foldername(name))[1]));


-- 3. Devoirs sans date limite et devoirs non notés (comme dans Classroom)
alter table public.devoirs alter column date_limite drop not null;
alter table public.devoirs alter column points drop not null;

create or replace function public.devoir_ouvert(did bigint) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select date_limite is null or date_limite > now() from devoirs where id = did), false)
$$;

select 'PhysiquePro : étape 2 installée ✓' as resultat;
