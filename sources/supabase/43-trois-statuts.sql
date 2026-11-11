-- =====================================================================
--  PhysiquePro · étape 43 (11/11/2026) : trois statuts, choix de Jalal
--    · En ligne    : l'élève travaille sur le site / l'application (étape 42)
--    · Inactif     : l'élève est encore connecté (ordinateur ou téléphone) mais ne travaille pas
--    · Déconnecté  : l'élève n'a plus aucune connexion ouverte (il a cliqué « Se déconnecter »
--                    partout, ou le professeur l'a déconnecté)
--  1. Une connexion fermée sans « Se déconnecter » reste « Inactif » jusqu'à 7 jours
--     (avant : elle disparaissait de la liste après 18 h, l'élève semblait déconnecté).
--  2. « Déconnecter » (prof) vise toutes les lignes de l'élève sur ce même appareil.
--  3. pp_eleves_deconnectes : élèves inscrits dans les cours (non archivés) sans aucune
--     connexion ouverte. Réservé au professeur.
-- =====================================================================
-- 2bis. (le ménage dans pp_presence2 n'a pas pu être appliqué : le connecteur demande une confirmation
--       qui n'arrive pas ; il n'est pas indispensable car le panneau ne garde qu'une ligne par appareil)
--       « Déconnecter » (prof) marque toutes les lignes de l'élève sur ce même appareil, pas seulement
--       celle affichée : l'élève ne réapparaît plus en « Inactif » par une ancienne ligne.
create or replace function public.pp_deconnecter(p_session uuid) returns integer
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.est_prof() then raise exception 'Réservé au professeur.'; end if;
  update public.sessions_ouvertes s set deconnecter = true
   where (p_session is null and exists (select 1 from public.profiles p where p.id = s.user_id and p.role <> 'prof'))
      or (p_session is not null and s.user_id <> auth.uid() and exists (
            select 1 from public.sessions_ouvertes c where c.id = p_session and c.user_id = s.user_id and (c.id = s.id or c.appareil = s.appareil)));
  get diagnostics n = row_count; return n;
end $$;
revoke all on function public.pp_deconnecter(uuid) from public, anon;
grant execute on function public.pp_deconnecter(uuid) to authenticated;

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
