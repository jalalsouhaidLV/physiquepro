-- =====================================================================
-- PhysiquePro · script 49 · bouton « élèves actifs » (14/11/2026)
-- ---------------------------------------------------------------------
-- Demande de Jalal : à côté de « élèves connectés », voir les élèves qui
-- utilisent le site EN CE MOMENT (téléphone ou ordinateur).
-- Actif = une session ouverte (pas déconnectée par le prof)
--         · dont la page est à l'écran (visible, signal reçu il y a < 90 s)
--         · avec un geste (toucher, défilement, clic, clavier) il y a < 2 min
--           (délai choisi par Jalal le 14/11/2026).
-- Aucune nouvelle donnée : le signal envoyé toutes les 30 s par pp_presence2
-- contient déjà « visible » et « actif_le ». Aucune nouvelle table.
-- pp_eleves_actifs : la liste (une ligne par élève). pp_stats_visites gagne la
-- clé « actifs » (le chiffre du bouton). Le prof n'est jamais compté.
-- Droits : authenticated seulement (est_prof() vérifié), jamais anon.
-- =====================================================================
create or replace function public.pp_session_active(s public.sessions_ouvertes) returns boolean
language sql stable set search_path = public as $$
  select not s.deconnecter and s.visible
     and s.vu_le > now() - interval '90 seconds'
     and s.actif_le > now() - interval '2 minutes'
$$;
revoke all on function public.pp_session_active(public.sessions_ouvertes) from public, anon;
grant execute on function public.pp_session_active(public.sessions_ouvertes) to authenticated;

create or replace function public.pp_eleves_actifs() returns json
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.est_prof() then raise exception 'Réservé au professeur.'; end if;
  return coalesce((select json_agg(x order by x.nom) from (
    select p.email,
           coalesce((select i.nom from public.inscriptions i where lower(i.email) = lower(p.email) limit 1), p.nom, p.email) as nom,
           (select string_agg(distinct c.nom, ' · ') from public.inscriptions i join public.classes c on c.id = i.classe_id
             where lower(i.email) = lower(p.email) and not coalesce(c.archive, false)) as classes,
           string_agg(distinct s.appareil, ', ') as appareils,
           max(s.actif_le) as actif_le
      from public.sessions_ouvertes s join public.profiles p on p.id = s.user_id
     where coalesce(p.role, 'eleve') <> 'prof' and public.pp_session_active(s)
     group by p.id, p.email, p.nom) x), '[]'::json);
end $$;
revoke all on function public.pp_eleves_actifs() from public, anon;
grant execute on function public.pp_eleves_actifs() to authenticated;

create or replace function public.pp_stats_visites() returns json
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.est_prof() then raise exception 'Réservé au professeur.'; end if;
  return json_build_object(
    'comptes',  (select count(*) from public.profiles where coalesce(role, 'eleve') <> 'prof'),
    'eleves',   (select count(*) from public.profiles where coalesce(role, 'eleve') <> 'prof'),
    'visites',  (select coalesce(sum(visites), 0) from public.profiles where coalesce(role, 'eleve') <> 'prof'),
    'enligne',  (select count(distinct s.user_id) from public.sessions_ouvertes s join public.profiles p on p.id = s.user_id
                  where coalesce(p.role, 'eleve') <> 'prof' and not s.deconnecter and s.vu_le > now() - interval '7 days'),
    'actifs',   (select count(distinct s.user_id) from public.sessions_ouvertes s join public.profiles p on p.id = s.user_id
                  where coalesce(p.role, 'eleve') <> 'prof' and public.pp_session_active(s)),
    'noms',     '[]'::json,
    'aujourdhui', (select count(*) from public.profiles where coalesce(role, 'eleve') <> 'prof' and derniere_visite >= date_trunc('day', now()))
  );
end $$;
revoke all on function public.pp_stats_visites() from public, anon;
grant execute on function public.pp_stats_visites() to authenticated;

select 'etape 49 OK' as resultat;
