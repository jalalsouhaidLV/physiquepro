-- =====================================================================
--  PhysiquePro · étape 41 (11/11/2026) : « inactif » = ordinateur resté connecté
--  Le compteur du professeur ne compte plus comme « inactifs » les téléphones et
--  tablettes (iPhone, iPad, Android) : un élève qui ferme l'application de son
--  téléphone n'a pas à se déconnecter. Seuls les ordinateurs (Windows, Mac,
--  Chromebook, Linux) restés connectés sans activité sont comptés (oubli probable
--  au lycée). Le panneau « Élèves connectés » sépare aussi les deux groupes (app.js).
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
                  where coalesce(p.role, 'eleve') <> 'prof' and public.pp_statut_session(s) = 'actif'),
    'inactifs', (select count(distinct s.user_id) from public.sessions_ouvertes s join public.profiles p on p.id = s.user_id
                  where coalesce(p.role, 'eleve') <> 'prof' and public.pp_statut_session(s) = 'inactif' and s.vu_le > now() - interval '18 hours'
                    and s.appareil !~ '^(iPhone|iPad|Android)'
                    and not exists (select 1 from public.sessions_ouvertes s2 where s2.user_id = s.user_id and public.pp_statut_session(s2) = 'actif')),
    'noms',     '[]'::json,
    'aujourdhui', (select count(*) from public.profiles where coalesce(role, 'eleve') <> 'prof' and derniere_visite >= date_trunc('day', now()))
  );
end $$;
revoke all on function public.pp_stats_visites() from public, anon;
grant execute on function public.pp_stats_visites() to authenticated;
