-- PhysiquePro · étape 27 : « Disponible » = site ouvert (même en arrière-plan) et utilisé dans les 15 dernières minutes
create or replace function public.pp_statut_prof() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'vu', (select max(s.vu_le) from public.sessions_ouvertes s join public.profiles p on p.id = s.user_id where p.role = 'prof'),
    'actif', exists (select 1 from public.sessions_ouvertes s join public.profiles p on p.id = s.user_id
                      where p.role = 'prof' and s.vu_le > now() - interval '2 minutes' and p.derniere_visite > now() - interval '15 minutes'),
    'maintenant', now());
$$;
revoke all on function public.pp_statut_prof() from public, anon;
grant execute on function public.pp_statut_prof() to authenticated;
