-- =====================================================================
--  PhysiquePro · étape 35 : fusion des règles RLS en double (performance seulement)
--  Appliqué le 4/11/2026 dans l'éditeur SQL de Supabase (le connecteur bloque les
--  « drop policy »). Ensuite, test d'intrusion 29 : 77/77, tests élève et prof OK.
--  Mêmes droits qu'avant : chaque « …_lecture » contient déjà est_prof().
-- =====================================================================
begin;

-- 4. Règles en double. Chaque « …_lecture » contient déjà est_prof() :
--    la règle « …_prof » (ALL) est remplacée par trois règles ajout / modif / suppression.
do $$
declare r record;
begin
  for r in select * from (values
      ('classes','classes_prof'), ('copies','copies_prof'), ('corrections','corrections_prof'),
      ('devoirs','devoirs_prof'), ('flashcards','fc_prof'), ('inscriptions','inscriptions_prof'),
      ('quiz','quiz_prof'), ('rdv_creneaux','rdvc_prof'), ('rdv_reservations','rdvr_prof'),
      ('rdv_series','rdvs_prof'), ('reglages','reglages_prof'), ('resultats_quiz','resultats_prof'),
      ('supports','supports_prof'), ('themes','themes_prof')) v(t, p)
  loop
    execute format('drop policy if exists %I on public.%I', r.p, r.t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.est_prof())', r.p || '_ajout', r.t);
    execute format('create policy %I on public.%I for update to authenticated using (public.est_prof()) with check (public.est_prof())', r.p || '_maj', r.t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.est_prof())', r.p || '_suppr', r.t);
  end loop;
end $$;

-- messages urgents : envoi élève + prof dans une seule règle d'ajout
drop policy if exists mu_prof on public.messages_urgents;
alter policy mu_envoi on public.messages_urgents with check (public.est_prof() or ((eleve = (select auth.uid())) and (eleve_email = public.mon_email())
  and public.dans_classe(classe_id) and (lu = false) and (reponse is null) and (de_prof = false)));
create policy mu_prof_maj   on public.messages_urgents for update to authenticated using (public.est_prof()) with check (public.est_prof());
create policy mu_prof_suppr on public.messages_urgents for delete to authenticated using (public.est_prof());

-- rendus : lecture (prof, auteur, binôme) et camarades fusionnées
drop policy if exists rendus_camarades on public.rendus;
-- (auth.uid() direct, sans sous-requête : voir l'étape 34)
alter policy rendus_lecture on public.rendus using (public.est_prof() or (auteur = auth.uid())
  or (binome_email = public.mon_email()) or public.reponses_visibles(devoir_id));

commit;
