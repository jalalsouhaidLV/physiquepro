-- =====================================================================
--  PhysiquePro · étape 12 : ordre des éléments dans un thème (comme Classroom)
--  position vide = élément récent, affiché en haut ; sinon tri par position croissante
-- =====================================================================
alter table public.supports add column if not exists position double precision;
alter table public.devoirs  add column if not exists position double precision;
alter table public.quiz     add column if not exists position double precision;
select 'PhysiquePro : ordre des éléments installé ✓' as resultat;
