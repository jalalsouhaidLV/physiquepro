-- =====================================================================
--  PhysiquePro · étape 8 : page Paramètres (profil, notifications)
--  Le script peut être relancé sans danger.
-- =====================================================================
alter table public.profiles add column if not exists prefs  jsonb not null default '{}';
alter table public.profiles add column if not exists vu_le  timestamptz;

-- Chacun modifie uniquement SES préférences et SA date de lecture des notifications
create or replace function public.pp_prefs(p jsonb) returns void
language sql security definer set search_path = public as $$
  update profiles set prefs = coalesce(p, '{}'::jsonb) where id = auth.uid()
$$;
create or replace function public.pp_vu() returns timestamptz
language sql security definer set search_path = public as $$
  update profiles set vu_le = now() where id = auth.uid() returning vu_le
$$;
revoke all on function public.pp_prefs(jsonb) from public, anon;
revoke all on function public.pp_vu() from public, anon;
grant execute on function public.pp_prefs(jsonb) to authenticated;
grant execute on function public.pp_vu() to authenticated;

select 'PhysiquePro : notifications installées ✓' as resultat;
