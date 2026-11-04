-- =====================================================================
--  PhysiquePro · étape 31 : « élèves en ligne » = sessions réellement ouvertes
--  (un élève qui se déconnecte disparaît tout de suite du compteur ;
--   un onglet fermé sans déconnexion disparaît au bout de 3 minutes)
-- =====================================================================
create or replace function public.pp_stats_visites() returns json
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.est_prof() then raise exception 'Réservé au professeur.'; end if;
  return json_build_object(
    'comptes',  (select count(*) from public.profiles where coalesce(role, 'eleve') <> 'prof'),
    'eleves',   (select count(*) from public.profiles where coalesce(role, 'eleve') <> 'prof'),
    'visites',  (select coalesce(sum(visites), 0) from public.profiles where coalesce(role, 'eleve') <> 'prof'),
    'enligne',  (select count(distinct s.user_id) from public.sessions_ouvertes s join public.profiles p on p.id = s.user_id
                  where coalesce(p.role, 'eleve') <> 'prof' and not s.deconnecter and s.vu_le > now() - interval '3 minutes'),
    'noms',     (select coalesce(json_agg(n), '[]'::json) from (select distinct coalesce(nullif(p.nom, ''), p.email) n from public.sessions_ouvertes s join public.profiles p on p.id = s.user_id
                  where coalesce(p.role, 'eleve') <> 'prof' and not s.deconnecter and s.vu_le > now() - interval '3 minutes') t),
    'aujourdhui', (select count(*) from public.profiles where coalesce(role, 'eleve') <> 'prof' and derniere_visite >= date_trunc('day', now()))
  );
end $$;
revoke all on function public.pp_stats_visites() from public, anon;
grant execute on function public.pp_stats_visites() to authenticated;
select 'PhysiquePro : étape 31 installée ✓' as resultat;
