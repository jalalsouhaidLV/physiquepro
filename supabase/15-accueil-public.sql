-- =====================================================================
--  PhysiquePro · étape 15 : page d'accueil publique (visible sans connexion)
--  Ne rend public QUE : nom, section, couleur, symbole et illustration des cours actifs,
--  le nom/titre du professeur, les liens rapides et la boîte à outils.
--  Aucune table n'est ouverte : documents, devoirs, élèves, notes restent protégés.
-- =====================================================================
create or replace function public.pp_accueil_public() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'classes', coalesce((
      select json_agg(json_build_object('id', c.id, 'nom', c.nom, 'section', c.section, 'couleur', c.couleur,
                                        'symbole', c.symbole, 'illustration', c.illustration) order by c.ordre)
      from public.classes c where not c.archive), '[]'::json),
    'reglages', (
      select json_build_object('prof', json_build_object('nom', r.data->'prof'->'nom', 'titre', r.data->'prof'->'titre'),
                               'liensUtiles', r.data->'liensUtiles', 'outils', r.data->'outils')
      from public.reglages r where r.id = 1)
  );
$$;
revoke all on function public.pp_accueil_public() from public;
grant execute on function public.pp_accueil_public() to anon, authenticated;

select 'PhysiquePro : accueil public installé ✓' as resultat;
