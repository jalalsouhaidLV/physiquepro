-- =====================================================================
--  PhysiquePro · étape 14 : le professeur peut mettre à jour les rendus
--  (remplacer le fichier stocké dans PhysiquePro par sa copie OneDrive)
-- =====================================================================
drop policy if exists rendus_prof_maj on public.rendus;
create policy rendus_prof_maj on public.rendus for update to authenticated
  using (public.est_prof()) with check (public.est_prof());
select 'PhysiquePro : transfert des rendus vers OneDrive installé ✓' as resultat;
