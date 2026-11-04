-- =====================================================================
--  PhysiquePro · étape 25 : le professeur n'est plus compté dans les statistiques
--  (comptes, visites, aujourd'hui, en ligne, liste des sessions)
-- =====================================================================
create or replace function public.pp_stats_visites() returns json
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.est_prof() then raise exception 'Réservé au professeur.'; end if;
  return json_build_object(
    'comptes',  (select count(*) from public.profiles where coalesce(role, 'eleve') <> 'prof'),
    'eleves',   (select count(*) from public.profiles where coalesce(role, 'eleve') <> 'prof'),
    'visites',  (select coalesce(sum(visites), 0) from public.profiles where coalesce(role, 'eleve') <> 'prof'),
    'enligne',  (select count(*) from public.profiles where coalesce(role, 'eleve') <> 'prof' and derniere_visite > now() - interval '3 minutes'),
    'noms',     (select coalesce(json_agg(coalesce(nullif(nom, ''), email) order by derniere_visite desc), '[]'::json) from public.profiles where coalesce(role, 'eleve') <> 'prof' and derniere_visite > now() - interval '3 minutes'),
    'aujourdhui', (select count(*) from public.profiles where coalesce(role, 'eleve') <> 'prof' and derniere_visite >= date_trunc('day', now()))
  );
end $$;

create or replace function public.pp_sessions() returns json
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.est_prof() then raise exception 'Réservé au professeur.'; end if;
  return coalesce((select json_agg(x order by x.en_ligne desc, x.nom) from (
    select s.id, s.appareil, s.debut, s.vu_le, s.visible, s.deconnecter, false as moi,
           s.vu_le > now() - interval '3 minutes' as en_ligne, p.role, p.email,
           coalesce((select i.nom from public.inscriptions i where i.email = p.email limit 1), p.nom, p.email) as nom,
           (select string_agg(c.nom, ' · ' order by c.ordre) from public.inscriptions i join public.classes c on c.id = i.classe_id where i.email = p.email) as classes
      from public.sessions_ouvertes s join public.profiles p on p.id = s.user_id
     where s.vu_le > now() - interval '18 hours' and coalesce(p.role, 'eleve') <> 'prof') x), '[]'::json);
end $$;

-- le compteur de visites du professeur est remis à zéro
update public.profiles set visites = 0 where role = 'prof';
select 'PhysiquePro : étape 25 installée ✓' as resultat;
