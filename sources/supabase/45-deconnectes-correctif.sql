-- =====================================================================
-- PhysiquePro · script 45 · correctif de pp_eleves_deconnectes (12/11/2026)
-- ---------------------------------------------------------------------
-- Constat (vérification du site publié, 12/11/2026) : à chaque ouverture du
-- panneau « Élèves connectés », pp_eleves_deconnectes répondait 400 :
--   ERROR 42803 : subquery uses ungrouped column "i.email" from outer query
-- La sous-requête « derniere_visite » utilisait i.email alors que la requête
-- est groupée par lower(i.email). La section « Déconnectés » restait vide.
-- Correctif : min(lower(i.email)) dans la sous-requête. Rien d'autre ne change
-- (mêmes droits : authenticated seulement, jamais anon).
-- =====================================================================
create or replace function public.pp_eleves_deconnectes() returns json
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.est_prof() then raise exception 'Réservé au professeur.'; end if;
  return coalesce((select json_agg(x order by x.nom) from (
    select lower(i.email) as email, min(i.nom) as nom,
           string_agg(distinct c.nom, ' · ') as classes,
           (select p.derniere_visite from public.profiles p where lower(p.email) = min(lower(i.email)) limit 1) as derniere_visite
      from public.inscriptions i join public.classes c on c.id = i.classe_id
     where not coalesce(c.archive, false)
       and lower(i.email) <> lower(coalesce((select p.email from public.profiles p where p.role = 'prof' limit 1), ''))
       and not exists (select 1 from public.sessions_ouvertes s join public.profiles p on p.id = s.user_id
                        where lower(p.email) = lower(i.email))
     group by lower(i.email)) x), '[]'::json);
end $$;
revoke all on function public.pp_eleves_deconnectes() from public, anon;
grant execute on function public.pp_eleves_deconnectes() to authenticated;
