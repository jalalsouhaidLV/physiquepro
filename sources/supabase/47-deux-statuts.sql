-- =====================================================================
-- PhysiquePro · script 47 · panneau « Élèves connectés » : 2 statuts (12/11/2026)
-- ---------------------------------------------------------------------
-- Choix de Jalal : seulement Connecté (vert) ou Déconnecté (rouge).
--   Connecté    = au moins un appareil avec une session ouverte (vue il y a
--                 moins de 7 jours et pas déconnectée par le prof), même sans
--                 activité en ce moment.
--   Déconnecté  = aucun appareil dans ce cas (jamais venu, s'est déconnecté,
--                 déconnecté par le prof, ou session de plus de 7 jours).
-- pp_eleves_deconnectes renvoie désormais TOUS les élèves inscrits sans
-- session ouverte (avant : seulement ceux sans aucune ligne, ce qui oubliait
-- les élèves déconnectés par le prof et les vieilles lignes de plus de 7 jours).
-- pp_stats_visites : « enligne » compte les élèves connectés (même définition) ;
-- la clé « inactifs » disparaît. Mêmes droits : authenticated seulement, jamais anon.
-- =====================================================================
create or replace function public.pp_eleves_deconnectes() returns json
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.est_prof() then raise exception 'Réservé au professeur.'; end if;
  return coalesce((select json_agg(x order by x.nom) from (
    select lower(i.email) as email, min(i.nom) as nom,
           string_agg(distinct c.nom, ' · ') as classes,
           (select greatest(max(p.derniere_visite), max(s.vu_le))
              from public.profiles p left join public.sessions_ouvertes s on s.user_id = p.id
             where lower(p.email) = min(lower(i.email))) as derniere_visite
      from public.inscriptions i join public.classes c on c.id = i.classe_id
     where not coalesce(c.archive, false)
       and lower(i.email) <> lower(coalesce((select p.email from public.profiles p where p.role = 'prof' limit 1), ''))
       and not exists (select 1 from public.sessions_ouvertes s join public.profiles p on p.id = s.user_id
                        where lower(p.email) = lower(i.email)
                          and not s.deconnecter and s.vu_le > now() - interval '7 days')
     group by lower(i.email)) x), '[]'::json);
end $$;
revoke all on function public.pp_eleves_deconnectes() from public, anon;
grant execute on function public.pp_eleves_deconnectes() to authenticated;

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
    'noms',     '[]'::json,
    'aujourdhui', (select count(*) from public.profiles where coalesce(role, 'eleve') <> 'prof' and derniere_visite >= date_trunc('day', now()))
  );
end $$;
revoke all on function public.pp_stats_visites() from public, anon;
grant execute on function public.pp_stats_visites() to authenticated;
