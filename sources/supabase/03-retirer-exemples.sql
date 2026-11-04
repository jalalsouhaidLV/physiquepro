-- =====================================================================
--  PhysiquePro · retirer le contenu d'exemple (tout ce qui commence par [exemple])
-- =====================================================================
delete from public.devoirs  where titre like '[exemple]%';
delete from public.supports where titre like '[exemple]%';
delete from public.quiz     where titre like '[exemple]%';
delete from public.themes   where titre like '[exemple]%';
select 'Contenu d''exemple retiré ✓' as resultat;
