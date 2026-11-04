-- =====================================================================
--  PhysiquePro · étape 24 : les élèves voient si le professeur est en ligne
-- =====================================================================
create or replace function public.pp_statut_prof() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'vu', max(s.vu_le),
    'actif', coalesce(bool_or(s.visible and s.vu_le > now() - interval '2 minutes'), false),
    'maintenant', now())
  from public.sessions_ouvertes s join public.profiles p on p.id = s.user_id
  where p.role = 'prof';
$$;
revoke all on function public.pp_statut_prof() from public, anon;
grant execute on function public.pp_statut_prof() to authenticated;
select 'PhysiquePro : étape 24 installée ✓' as resultat;
