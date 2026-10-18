-- =====================================================================
--  PhysiquePro · étape 22 : compteur de visites et personnes en ligne
-- =====================================================================
alter table public.profiles add column if not exists visites int not null default 0;

-- appelée à l'ouverture du site puis toutes les minutes : une nouvelle visite est comptée après 30 min d'absence
create or replace function public.pp_visite() returns void
language sql security definer set search_path = public as $$
  update public.profiles
     set visites = visites + case when derniere_visite is null or derniere_visite < now() - interval '30 minutes' then 1 else 0 end,
         derniere_visite = now()
   where id = auth.uid();
$$;
revoke all on function public.pp_visite() from public, anon;
grant execute on function public.pp_visite() to authenticated;

-- chiffres pour le professeur
create or replace function public.pp_stats_visites() returns json
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.est_prof() then raise exception 'Réservé au professeur.'; end if;
  return json_build_object(
    'comptes',  (select count(*) from public.profiles),
    'eleves',   (select count(*) from public.profiles where coalesce(role, 'eleve') <> 'prof'),
    'visites',  (select coalesce(sum(visites), 0) from public.profiles),
    'enligne',  (select count(*) from public.profiles where derniere_visite > now() - interval '3 minutes'),
    'noms',     (select coalesce(json_agg(coalesce(nullif(nom, ''), email) order by derniere_visite desc), '[]'::json) from public.profiles where derniere_visite > now() - interval '3 minutes'),
    'aujourdhui', (select count(*) from public.profiles where derniere_visite >= date_trunc('day', now()))
  );
end $$;
revoke all on function public.pp_stats_visites() from public, anon;
grant execute on function public.pp_stats_visites() to authenticated;

select 'PhysiquePro : étape 22 installée ✓' as resultat;
