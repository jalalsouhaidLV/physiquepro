-- =====================================================================
--  PhysiquePro · étape 43 (11/11/2026) : trois statuts, choix de Jalal
--    · En ligne    : l'élève travaille sur le site / l'application (étape 42)
--    · Inactif     : l'élève est encore connecté (ordinateur ou téléphone) mais ne travaille pas
--    · Déconnecté  : l'élève n'a plus aucune connexion ouverte (il a cliqué « Se déconnecter »
--                    partout, ou le professeur l'a déconnecté)
--  1. Une connexion fermée sans « Se déconnecter » reste « Inactif » jusqu'à 7 jours
--     (avant : elle disparaissait de la liste après 18 h, l'élève semblait déconnecté).
--  2. Quand un appareil se signale, les anciennes lignes du même élève sur ce même appareil
--     (application relancée, ancien onglet) silencieuses depuis plus de 2 minutes sont effacées :
--     il ne reste qu'une ligne par appareil.
--  3. pp_eleves_deconnectes : élèves inscrits dans les cours (non archivés) sans aucune
--     connexion ouverte. Réservé au professeur.
-- =====================================================================
create or replace function public.pp_presence2(p_session uuid, p_appareil text, p_visible boolean, p_inactif integer)
returns json language plpgsql security definer set search_path = public as $$
declare act timestamptz := now() - make_interval(secs => greatest(0, least(coalesce(p_inactif, 0), 2592000)));
begin
  if auth.uid() is null then return json_build_object('kick', false); end if;
  if exists (select 1 from public.sessions_ouvertes where user_id = auth.uid() and deconnecter
             and (id = p_session or appareil = left(p_appareil, 80))) then
    delete from public.sessions_ouvertes where user_id = auth.uid() and (id = p_session or (deconnecter and appareil = left(p_appareil, 80)));
    return json_build_object('kick', true);
  end if;
  insert into public.sessions_ouvertes (id, user_id, appareil, visible, actif_le)
    values (p_session, auth.uid(), left(p_appareil, 80), p_visible, act)
    on conflict (id) do update set vu_le = now(), visible = excluded.visible, appareil = excluded.appareil, actif_le = excluded.actif_le
    where public.sessions_ouvertes.user_id = auth.uid();
  delete from public.sessions_ouvertes where user_id = auth.uid() and appareil = left(p_appareil, 80)
     and id <> p_session and not deconnecter and vu_le < now() - interval '2 minutes';
  if p_visible then perform public.pp_visite(); end if;
  delete from public.sessions_ouvertes where vu_le < now() - interval '7 days';
  return json_build_object('kick', false);
end $$;
revoke all on function public.pp_presence2(uuid, text, boolean, int) from public, anon;
grant execute on function public.pp_presence2(uuid, text, boolean, int) to authenticated;

create or replace function public.pp_sessions() returns json
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.est_prof() then raise exception 'Réservé au professeur.'; end if;
  return coalesce((select json_agg(x order by x.ordre, x.nom) from (
    select s.id, s.appareil, s.debut, s.vu_le, s.actif_le, s.visible, s.deconnecter, s.lycee, false as moi,
           public.pp_statut_session(s) as statut,
           public.pp_statut_session(s) = 'actif' as en_ligne,
           case public.pp_statut_session(s) when 'actif' then 0 when 'inactif' then 1 when 'attente' then 2 else 3 end as ordre,
           p.role, p.email,
           coalesce((select i.nom from public.inscriptions i where i.email = p.email limit 1), p.nom, p.email) as nom,
           (select string_agg(c.nom, ' · ' order by c.ordre) from public.inscriptions i join public.classes c on c.id = i.classe_id where i.email = p.email) as classes
      from public.sessions_ouvertes s join public.profiles p on p.id = s.user_id
     where s.vu_le > now() - interval '7 days' and coalesce(p.role, 'eleve') <> 'prof') x), '[]'::json);
end $$;
revoke all on function public.pp_sessions() from public, anon;
grant execute on function public.pp_sessions() to authenticated;

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
                  where coalesce(p.role, 'eleve') <> 'prof' and public.pp_statut_session(s) = 'inactif'
                    and s.appareil !~ '^(iPhone|iPad|Android)'
                    and not exists (select 1 from public.sessions_ouvertes s2 where s2.user_id = s.user_id and public.pp_statut_session(s2) = 'actif')),
    'noms',     '[]'::json,
    'aujourdhui', (select count(*) from public.profiles where coalesce(role, 'eleve') <> 'prof' and derniere_visite >= date_trunc('day', now()))
  );
end $$;
revoke all on function public.pp_stats_visites() from public, anon;
grant execute on function public.pp_stats_visites() to authenticated;

create or replace function public.pp_eleves_deconnectes() returns json
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.est_prof() then raise exception 'Réservé au professeur.'; end if;
  return coalesce((select json_agg(x order by x.nom) from (
    select lower(i.email) as email, min(i.nom) as nom,
           string_agg(distinct c.nom, ' · ') as classes,
           (select p.derniere_visite from public.profiles p where lower(p.email) = lower(i.email) limit 1) as derniere_visite
      from public.inscriptions i join public.classes c on c.id = i.classe_id
     where not coalesce(c.archive, false)
       and lower(i.email) <> lower(coalesce((select p.email from public.profiles p where p.role = 'prof' limit 1), ''))
       and not exists (select 1 from public.sessions_ouvertes s join public.profiles p on p.id = s.user_id
                        where lower(p.email) = lower(i.email))
     group by lower(i.email)) x), '[]'::json);
end $$;
revoke all on function public.pp_eleves_deconnectes() from public, anon;
grant execute on function public.pp_eleves_deconnectes() to authenticated;
