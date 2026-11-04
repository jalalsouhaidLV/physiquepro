-- =====================================================================
--  PhysiquePro · étape 34 : corrections des alertes Supabase (advisors du 4/11/2026)
--  Aucun changement de droits : mêmes personnes, mêmes accès. Uniquement
--  sécurité des fonctions (search_path) et performance (index, règles RLS).
--  pp_accueil_public() reste ouverte aux visiteurs (voulu : page d'accueil,
--  ni codes de classe ni données d'élèves).
-- =====================================================================
begin;

-- 1. search_path figé (vide) sur les fonctions qui n'en avaient pas.
--    Toutes leurs références sont déjà qualifiées (public.…, auth.…).
alter function public.pp_nombre(text)                          set search_path = '';
alter function public.domaine_autorise()                       set search_path = '';
alter function public.email_prof()                             set search_path = '';
alter function public.mon_email()                              set search_path = '';
alter function public.generer_code()                           set search_path = '';
alter function public.cible_moi(text[])                        set search_path = '';
alter function public.pp_ping()                                set search_path = '';
alter function public.pp_norm(text)                            set search_path = '';
alter function public.pp_juste(text, jsonb, jsonb)             set search_path = '';
alter function public.pp_statut_session(public.sessions_ouvertes) set search_path = '';

-- 2. Index sur les clés étrangères
create index if not exists annonces_auteur_idx            on public.annonces (auteur);
create index if not exists commentaires_auteur_idx        on public.commentaires (auteur);
create index if not exists commentaires_prives_auteur_idx on public.commentaires_prives (auteur);
create index if not exists copies_classe_idx              on public.copies (classe_id);
create index if not exists demandes_materiel_classe_idx   on public.demandes_materiel (classe_id);
create index if not exists demandes_materiel_devoir_idx   on public.demandes_materiel (devoir_id);
create index if not exists devoirs_theme_idx              on public.devoirs (theme_id);
create index if not exists flashcards_classe_idx          on public.flashcards (classe_id);
create index if not exists flashcards_theme_idx           on public.flashcards (theme_id);
create index if not exists messages_urgents_classe_idx    on public.messages_urgents (classe_id);
create index if not exists messages_urgents_eleve_idx     on public.messages_urgents (eleve);
create index if not exists quiz_classe_idx                on public.quiz (classe_id);
create index if not exists quiz_theme_idx                 on public.quiz (theme_id);
create index if not exists rdv_creneaux_serie_idx         on public.rdv_creneaux (serie_id);
create index if not exists rdv_reservations_creneau_idx   on public.rdv_reservations (creneau_id);
create index if not exists rdv_reservations_eleve_idx     on public.rdv_reservations (eleve);
create index if not exists rdv_series_classe_idx          on public.rdv_series (classe_id);
create index if not exists rendus_auteur_idx              on public.rendus (auteur);
create index if not exists resultats_quiz_eleve_idx       on public.resultats_quiz (eleve);
create index if not exists sessions_ouvertes_user_idx     on public.sessions_ouvertes (user_id);
create index if not exists supports_classe_idx            on public.supports (classe_id);
create index if not exists supports_theme_idx             on public.supports (theme_id);
create index if not exists themes_classe_idx              on public.themes (classe_id);

-- 3. auth.uid() calculé une seule fois par requête : (select auth.uid())
alter policy profil_lecture     on public.profiles         using ((id = (select auth.uid())) or public.est_prof());
alter policy resultats_lecture  on public.resultats_quiz   using (public.est_prof() or (eleve = (select auth.uid())));
alter policy rendus_depot       on public.rendus           with check ((auteur = (select auth.uid())) and (auteur_email = public.mon_email()) and public.peut_rendre(devoir_id, binome_email));
alter policy corrections_lecture on public.corrections     using (public.est_prof() or (publiee and exists (select 1 from public.rendus r
                                                              where r.id = corrections.rendu_id and (r.auteur = (select auth.uid()) or r.binome_email = public.mon_email()))));
alter policy commentaires_suppr on public.commentaires     using (public.est_prof() or (auteur = (select auth.uid())));
alter policy annonces_modif     on public.annonces         using (public.est_prof() or (auteur = (select auth.uid())))
                                                           with check (public.est_prof() or (auteur = (select auth.uid())));
alter policy annonces_suppr     on public.annonces         using (public.est_prof() or (auteur = (select auth.uid())));
alter policy cprives_suppr      on public.commentaires_prives using (public.est_prof() or (auteur = (select auth.uid())));
alter policy rendus_annuler     on public.rendus           using (public.est_prof() or ((auteur = (select auth.uid())) and public.devoir_ouvert(devoir_id)
                                                              and public.reponse_modifiable(devoir_id)
                                                              and not exists (select 1 from public.corrections c where c.rendu_id = rendus.id and c.publiee)));
alter policy mu_lecture         on public.messages_urgents using (public.est_prof() or (eleve = (select auth.uid())));
alter policy rdvr_lecture       on public.rdv_reservations using (public.est_prof() or (eleve = (select auth.uid())));
alter policy np_moi             on public.notes_perso      using (id = (select auth.uid())) with check (id = (select auth.uid()));

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
alter policy rendus_lecture on public.rendus using (public.est_prof() or (auteur = (select auth.uid()))
  or (binome_email = public.mon_email()) or public.reponses_visibles(devoir_id));

commit;
