-- =====================================================================
-- PhysiquePro · TEST D'INTRUSION « élève contre élève » (aucune modification durable)
-- Tout se passe dans une transaction annulée à la fin (ROLLBACK).
-- Deux élèves fictifs A et B, une classe commune X, une classe Y où A n'est pas inscrit.
-- Connecté comme A, on tente de lire / modifier / supprimer les données de B
-- et d'appeler les fonctions réservées au professeur.
-- =====================================================================
begin;

create temp table t_res (n serial, groupe text, test text, obtenu text, ok boolean);
create temp table t_ids (k text primary key, v text);
grant all on t_res, t_ids to authenticated; grant usage on sequence t_res_n_seq to authenticated;

-- ---------- données de test (en tant qu'administrateur) ----------
do $$
declare a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); d1 bigint; d2 bigint; d3 bigint; r bigint; q bigint; an bigint; s bigint; c bigint; sy bigint;
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  values (a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lv.zz.testa@lycee-verdun.edu.lb', '{"full_name":"ZZ Test A"}', now(), now()),
         (b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lv.zz.testb@lycee-verdun.edu.lb', '{"full_name":"ZZ Test B"}', now(), now());
  insert into profiles (id, email, nom) values (a, 'lv.zz.testa@lycee-verdun.edu.lb', 'ZZ Test A'), (b, 'lv.zz.testb@lycee-verdun.edu.lb', 'ZZ Test B') on conflict (id) do nothing;
  insert into classes (id, nom) values ('zz_x', 'ZZ classe X'), ('zz_y', 'ZZ classe Y');
  insert into inscriptions (classe_id, email, nom) values ('zz_x', 'lv.zz.testa@lycee-verdun.edu.lb', 'ZZ Test A'), ('zz_x', 'lv.zz.testb@lycee-verdun.edu.lb', 'ZZ Test B'), ('zz_y', 'lv.zz.testb@lycee-verdun.edu.lb', 'ZZ Test B');
  insert into devoirs (classe_id, titre, date_limite) values ('zz_x', 'ZZ devoir commun', now() + interval '7 days') returning id into d1;
  insert into devoirs (classe_id, titre, date_limite, eleves) values ('zz_x', 'ZZ devoir réservé à B', now() + interval '7 days', array['lv.zz.testb@lycee-verdun.edu.lb']) returning id into d2;
  insert into devoirs (classe_id, titre, date_limite) values ('zz_y', 'ZZ devoir classe Y', now() + interval '7 days') returning id into d3;
  insert into supports (classe_id, titre) values ('zz_y', 'ZZ support classe Y');
  insert into themes (classe_id, titre) values ('zz_y', 'ZZ chapitre Y');
  insert into rendus (devoir_id, auteur, auteur_email, lien) values (d1, b, 'lv.zz.testb@lycee-verdun.edu.lb', 'https://exemple/copieB') returning id into r;
  insert into corrections (rendu_id, note, commentaire, publiee) values (r, 15, 'Commentaire pour B', true);
  insert into commentaires_prives (devoir_id, eleve_email, auteur, auteur_nom, texte) values (d1, 'lv.zz.testb@lycee-verdun.edu.lb', b, 'ZZ Test B', 'Message privé de B');
  insert into quiz (classe_id, titre, mode, questions) values ('zz_x', 'ZZ quiz', 'note', '[{"q":"1+1","o":["1","2"]}]') returning id into q;
  insert into quiz_solutions (quiz_id, bonnes) values (q, '[1]');
  insert into resultats_quiz (quiz_id, eleve, reponses, score, sur) values (q, b, '[0]', 0, 1);
  insert into annonces (classe_id, auteur, auteur_nom, texte) values ('zz_x', null, 'Professeur', 'ZZ annonce X') returning id into an;
  insert into commentaires (annonce_id, auteur, auteur_nom, texte) values (an, b, 'ZZ Test B', 'Commentaire public de B');
  insert into annonces (classe_id, auteur, auteur_nom, texte) values ('zz_y', null, 'Professeur', 'ZZ annonce Y');
  insert into messages_urgents (classe_id, eleve, eleve_email, eleve_nom, texte) values ('zz_x', b, 'lv.zz.testb@lycee-verdun.edu.lb', 'ZZ Test B', 'Message urgent de B');
  insert into rdv_series (classe_id, titre) values ('zz_x', 'ZZ rdv') returning id into s;
  insert into rdv_creneaux (serie_id, debut, fin) values (s, now() + interval '1 day', now() + interval '1 day 10 minutes') returning id into c;
  insert into rdv_reservations (creneau_id, serie_id, eleve, eleve_email, eleve_nom) values (c, s, b, 'lv.zz.testb@lycee-verdun.edu.lb', 'ZZ Test B');
  insert into notes_perso (id, contenu) values (b, 'Notes perso de B');
  insert into copies (classe_id, objet, objet_id, source, eleve_email, nom, od_id, web) values ('zz_x', 'devoir', d1, 'src', 'lv.zz.testb@lycee-verdun.edu.lb', 'copie B', 'od', 'https://exemple/odB');
  insert into flashcards (classe_id, recto, verso) values ('zz_y', 'Q Y', 'R Y');
  insert into sessions_ouvertes (id, user_id, appareil) values (gen_random_uuid(), b, 'PC test');
  -- étape 38 : commentaires de classe sous les devoirs (B) et annonce programmée
  insert into commentaires_devoirs (devoir_id, auteur_nom, texte) values (d1, 'ZZ Test B', 'Commentaire de classe de B'), (d2, 'ZZ Test B', 'Commentaire sous le devoir réservé à B'), (d3, 'ZZ Test B', 'Commentaire classe Y');
  update commentaires_devoirs set auteur = b where devoir_id in (d1, d2, d3);
  insert into annonces (classe_id, auteur, auteur_nom, texte, publie_le) values ('zz_x', null, 'Professeur', 'ZZ annonce programmée', now() + interval '3 days');
  insert into t_ids values ('A', a), ('B', b), ('D1', d1), ('D2', d2), ('D3', d3), ('R', r), ('Q', q), ('AN', an), ('S', s), ('C', c);
end $$;

-- ---------- outils de test (exécutés en tant qu'élève A) ----------
-- lire : la requête doit renvoyer 0 ligne
create function pg_temp.lire(g text, t text, sql text) returns void language plpgsql as $f$
declare n int; begin
  execute 'select count(*) from (' || sql || ') s' into n;
  insert into t_res (groupe, test, obtenu, ok) values (g, t, n || ' ligne(s) visible(s)', n = 0);
exception when others then insert into t_res (groupe, test, obtenu, ok) values (g, t, 'refusé (' || sqlstate || ') ' || left(sqlerrm, 90), sqlstate in ('42501', 'P0001'));
end $f$;
-- ecrire : la modification doit toucher 0 ligne ou être refusée
create function pg_temp.ecrire(g text, t text, sql text) returns void language plpgsql as $f$
declare n int; begin
  execute sql; get diagnostics n = row_count;
  insert into t_res (groupe, test, obtenu, ok) values (g, t, n || ' ligne(s) touchée(s)', n = 0);
exception when others then insert into t_res (groupe, test, obtenu, ok) values (g, t, 'refusé (' || sqlstate || ') ' || left(sqlerrm, 90), sqlstate in ('42501', 'P0001', '23503', '23505', '23514'));
end $f$;
-- appel : la fonction réservée au professeur doit être refusée
create function pg_temp.appel(g text, t text, sql text) returns void language plpgsql as $f$
begin
  execute sql;
  insert into t_res (groupe, test, obtenu, ok) values (g, t, 'ACCEPTÉ', false);
exception when others then insert into t_res (groupe, test, obtenu, ok) values (g, t, 'refusé (' || sqlstate || ') ' || left(sqlerrm, 90), sqlstate in ('42501', 'P0001'));
end $f$;
grant execute on all functions in schema pg_temp to authenticated;

-- ---------- on devient l'élève A ----------
select set_config('request.jwt.claims', json_build_object('sub', (select v from t_ids where k = 'A'), 'role', 'authenticated', 'email', 'lv.zz.testa@lycee-verdun.edu.lb')::text, true);
set local role authenticated;

-- 1. LIRE les données de B
select pg_temp.lire('Lire', 'Profil de B (e-mail, nom)', $$select * from profiles where email = 'lv.zz.testb@lycee-verdun.edu.lb'$$);
select pg_temp.lire('Lire', 'Copie rendue par B', $$select * from rendus where auteur_email = 'lv.zz.testb@lycee-verdun.edu.lb'$$);
select pg_temp.lire('Lire', 'Note et appréciation de B', $$select * from corrections where rendu_id = (select v::bigint from t_ids where k = 'R')$$);
select pg_temp.lire('Lire', 'Commentaire privé entre B et le prof', $$select * from commentaires_prives where eleve_email = 'lv.zz.testb@lycee-verdun.edu.lb'$$);
select pg_temp.lire('Lire', 'Résultat de B au quiz', $$select * from resultats_quiz where eleve = (select v::uuid from t_ids where k = 'B')$$);
select pg_temp.lire('Lire', 'Bonnes réponses du quiz', $$select * from quiz_solutions$$);
select pg_temp.lire('Lire', 'Message urgent de B au prof', $$select * from messages_urgents where eleve_email = 'lv.zz.testb@lycee-verdun.edu.lb'$$);
select pg_temp.lire('Lire', 'Rendez-vous réservé par B', $$select * from rdv_reservations where eleve_email = 'lv.zz.testb@lycee-verdun.edu.lb'$$);
select pg_temp.lire('Lire', 'Coin Perso (notes privées) de B', $$select * from notes_perso where id = (select v::uuid from t_ids where k = 'B')$$);
select pg_temp.lire('Lire', 'Copie OneDrive de B', $$select * from copies where eleve_email = 'lv.zz.testb@lycee-verdun.edu.lb'$$);
select pg_temp.lire('Lire', 'Sessions / appareils de B', $$select * from sessions_ouvertes where user_id = (select v::uuid from t_ids where k = 'B')$$);
select pg_temp.lire('Lire', 'Devoir réservé à B seul', $$select * from devoirs where id = (select v::bigint from t_ids where k = 'D2')$$);
select pg_temp.lire('Lire', 'Devoirs d''une classe où A n''est pas inscrit', $$select * from devoirs where classe_id = 'zz_y'$$);
select pg_temp.lire('Lire', 'Supports d''une autre classe', $$select * from supports where classe_id = 'zz_y'$$);
select pg_temp.lire('Lire', 'Annonces d''une autre classe', $$select * from annonces where classe_id = 'zz_y'$$);
select pg_temp.lire('Lire', 'Flashcards d''une autre classe', $$select * from flashcards where classe_id = 'zz_y'$$);
select pg_temp.lire('Lire', 'Liste d''élèves d''une autre classe', $$select * from inscriptions where classe_id = 'zz_y'$$);
select pg_temp.lire('Lire', 'Corbeille', $$select * from corbeille$$);
select pg_temp.lire('Lire', 'Sauvegardes', $$select * from sauvegardes$$);
select pg_temp.lire('Lire', 'Demandes de matériel', $$select * from demandes_materiel$$);
select pg_temp.lire('Lire', 'Copies de tous les élèves réels', $$select * from rendus where auteur <> auth.uid()$$);
select pg_temp.lire('Lire', 'Notes de tous les élèves réels', $$select * from corrections$$);
select pg_temp.lire('Lire', 'Commentaire de classe sous le devoir réservé à B', $$select * from commentaires_devoirs where devoir_id = (select v::bigint from t_ids where k = 'D2')$$);
select pg_temp.lire('Lire', 'Commentaires de classe sous un devoir d''une autre classe', $$select * from commentaires_devoirs where devoir_id = (select v::bigint from t_ids where k = 'D3')$$);
select pg_temp.lire('Lire', 'Annonce programmée pas encore publiée', $$select * from annonces where texte = 'ZZ annonce programmée'$$);
select pg_temp.lire('Lire', 'Profils des autres utilisateurs', $$select * from profiles where id <> auth.uid()$$);

-- 2. MODIFIER ou SUPPRIMER les données de B
select pg_temp.ecrire('Modifier', 'Modifier la copie de B', $$update rendus set lien = 'pirate' where auteur_email = 'lv.zz.testb@lycee-verdun.edu.lb'$$);
select pg_temp.ecrire('Modifier', 'Supprimer la copie de B', $$delete from rendus where auteur_email = 'lv.zz.testb@lycee-verdun.edu.lb'$$);
select pg_temp.ecrire('Modifier', 'Changer la note de B', $$update corrections set note = 0 where rendu_id = (select v::bigint from t_ids where k = 'R')$$);
select pg_temp.ecrire('Modifier', 'Supprimer la note de B', $$delete from corrections where rendu_id = (select v::bigint from t_ids where k = 'R')$$);
select pg_temp.ecrire('Modifier', 'Supprimer le commentaire privé de B', $$delete from commentaires_prives where eleve_email = 'lv.zz.testb@lycee-verdun.edu.lb'$$);
select pg_temp.ecrire('Modifier', 'Supprimer le commentaire de classe de B sous un devoir', $$delete from commentaires_devoirs where texte = 'Commentaire de classe de B'$$);
select pg_temp.ecrire('Modifier', 'Écrire sous un devoir d''une autre classe', $$insert into commentaires_devoirs (devoir_id, texte) values ((select v::bigint from t_ids where k = 'D3'), 'pirate')$$);
select pg_temp.ecrire('Modifier', 'Écrire sous le devoir réservé à B', $$insert into commentaires_devoirs (devoir_id, texte) values ((select v::bigint from t_ids where k = 'D2'), 'pirate')$$);
select pg_temp.ecrire('Modifier', 'Publier une annonce épinglée (flux réservé au prof)', $$insert into annonces (classe_id, texte, epingle, publie_le) values ('zz_x', 'pirate', true, now() + interval '1 day')$$);
select pg_temp.ecrire('Modifier', 'Supprimer le commentaire public de B', $$delete from commentaires where texte = 'Commentaire public de B'$$);
select pg_temp.ecrire('Modifier', 'Modifier le résultat de quiz de B', $$update resultats_quiz set score = 1 where eleve = (select v::uuid from t_ids where k = 'B')$$);
select pg_temp.ecrire('Modifier', 'Supprimer le message urgent de B', $$delete from messages_urgents where eleve_email = 'lv.zz.testb@lycee-verdun.edu.lb'$$);
select pg_temp.ecrire('Modifier', 'Annuler le rendez-vous de B', $$delete from rdv_reservations where eleve_email = 'lv.zz.testb@lycee-verdun.edu.lb'$$);
select pg_temp.ecrire('Modifier', 'Effacer le Coin Perso de B', $$update notes_perso set contenu = '' where id = (select v::uuid from t_ids where k = 'B')$$);
select pg_temp.ecrire('Modifier', 'Supprimer la copie OneDrive de B', $$delete from copies where eleve_email = 'lv.zz.testb@lycee-verdun.edu.lb'$$);
select pg_temp.ecrire('Modifier', 'Déconnecter B en modifiant sa session', $$update sessions_ouvertes set deconnecter = true where user_id = (select v::uuid from t_ids where k = 'B')$$);
select pg_temp.ecrire('Modifier', 'Renommer B', $$update profiles set nom = 'pirate' where email = 'lv.zz.testb@lycee-verdun.edu.lb'$$);
select pg_temp.ecrire('Modifier', 'Retirer B de la classe', $$delete from inscriptions where email = 'lv.zz.testb@lycee-verdun.edu.lb'$$);

-- 3. SE FAIRE PASSER POUR B
select pg_temp.ecrire('Usurper', 'Rendre un devoir au nom de B', $$insert into rendus (devoir_id, auteur, auteur_email) values ((select v::bigint from t_ids where k = 'D1'), (select v::uuid from t_ids where k = 'B'), 'lv.zz.testb@lycee-verdun.edu.lb')$$);
select pg_temp.ecrire('Usurper', 'Écrire au prof au nom de B (commentaire privé)', $$insert into commentaires_prives (devoir_id, eleve_email, texte) values ((select v::bigint from t_ids where k = 'D1'), 'lv.zz.testb@lycee-verdun.edu.lb', 'faux')$$);
select pg_temp.ecrire('Usurper', 'Message urgent au nom de B', $$insert into messages_urgents (classe_id, eleve, eleve_email, texte) values ('zz_x', (select v::uuid from t_ids where k = 'B'), 'lv.zz.testb@lycee-verdun.edu.lb', 'faux')$$);
select pg_temp.ecrire('Usurper', 'Réserver un rendez-vous au nom de B', $$insert into rdv_reservations (creneau_id, serie_id, eleve, eleve_email) values ((select v::bigint from t_ids where k = 'C'), (select v::bigint from t_ids where k = 'S'), (select v::uuid from t_ids where k = 'B'), 'x')$$);
select pg_temp.ecrire('Usurper', 'Écrire dans le Coin Perso de B', $$insert into notes_perso (id, contenu) values ((select v::uuid from t_ids where k = 'B'), 'x') on conflict (id) do update set contenu = 'x'$$);

-- 4. TRICHER / DROITS DU PROFESSEUR (tables)
select pg_temp.ecrire('Tricher', 'Se donner le rôle professeur', $$update profiles set role = 'prof' where id = auth.uid()$$);
select pg_temp.ecrire('Tricher', 'Inscrire un résultat de quiz à 100 %', $$insert into resultats_quiz (quiz_id, eleve, reponses, score, sur) values ((select v::bigint from t_ids where k = 'Q'), auth.uid(), '[1]', 1, 1)$$);
select pg_temp.ecrire('Tricher', 'Se mettre une note (créer sa propre correction)', $$insert into corrections (rendu_id, note, publiee) values ((select v::bigint from t_ids where k = 'R'), 20, true)$$);
select pg_temp.ecrire('Tricher', 'S''inscrire seul dans une autre classe', $$insert into inscriptions (classe_id, email, nom) values ('zz_y', 'lv.zz.testa@lycee-verdun.edu.lb', 'A')$$);
select pg_temp.ecrire('Prof', 'Créer un devoir', $$insert into devoirs (classe_id, titre, date_limite) values ('zz_x', 'faux', now())$$);
select pg_temp.ecrire('Prof', 'Modifier un devoir', $$update devoirs set titre = 'pirate' where classe_id = 'zz_x'$$);
select pg_temp.ecrire('Prof', 'Supprimer un devoir', $$delete from devoirs where classe_id = 'zz_x'$$);
select pg_temp.ecrire('Prof', 'Supprimer une classe', $$delete from classes where id = 'zz_x'$$);
select pg_temp.ecrire('Prof', 'Modifier une classe (code, nom)', $$update classes set nom = 'pirate' where id = 'zz_x'$$);
select pg_temp.ecrire('Prof', 'Créer une classe', $$insert into classes (id, nom) values ('zz_pirate', 'pirate')$$);
select pg_temp.ecrire('Prof', 'Modifier une annonce du prof', $$update annonces set texte = 'pirate' where classe_id = 'zz_x'$$);
select pg_temp.ecrire('Prof', 'Supprimer une annonce du prof', $$delete from annonces where classe_id = 'zz_x'$$);
select pg_temp.ecrire('Prof', 'Modifier les réglages du site', $$update reglages set data = '{}'$$);
select pg_temp.ecrire('Prof', 'Ajouter un support', $$insert into supports (classe_id, titre) values ('zz_x', 'faux')$$);
select pg_temp.ecrire('Prof', 'Ajouter un chapitre', $$insert into themes (classe_id, titre) values ('zz_x', 'faux')$$);
select pg_temp.ecrire('Prof', 'Ajouter une flashcard', $$insert into flashcards (classe_id, recto, verso) values ('zz_x', 'a', 'b')$$);
select pg_temp.ecrire('Prof', 'Créer un quiz', $$insert into quiz (classe_id, titre) values ('zz_x', 'faux')$$);
select pg_temp.ecrire('Prof', 'Ajouter une liste d''élèves', $$insert into inscriptions (classe_id, email, nom) values ('zz_x', 'lv.pirate@lycee-verdun.edu.lb', 'pirate')$$);
select pg_temp.ecrire('Prof', 'Créer des créneaux de rendez-vous', $$insert into rdv_series (classe_id, titre) values ('zz_x', 'faux')$$);
select pg_temp.ecrire('Prof', 'Répondre à un message urgent', $$update messages_urgents set reponse = 'faux', lu = true where classe_id = 'zz_x'$$);
select pg_temp.ecrire('Prof', 'Vider la corbeille', $$delete from corbeille$$);
select pg_temp.ecrire('Prof', 'Supprimer les sauvegardes', $$delete from sauvegardes$$);
select pg_temp.ecrire('Prof', 'Écrire une sauvegarde', $$insert into sauvegardes (contenu) values ('{}')$$);
select pg_temp.ecrire('Prof', 'Demande de matériel', $$insert into demandes_materiel (titre) values ('faux')$$);

-- 5. FONCTIONS RÉSERVÉES AU PROFESSEUR
select pg_temp.appel('Fonctions', 'Liste des élèves connectés (pp_sessions)', $$select pp_sessions()$$);
select pg_temp.appel('Fonctions', 'Déconnecter un élève (pp_deconnecter)', $$select pp_deconnecter((select id from sessions_ouvertes limit 1))$$);
select pg_temp.appel('Fonctions', 'Déconnecter tous les élèves (pp_deconnecter null)', $$select pp_deconnecter(null)$$);
select pg_temp.appel('Fonctions', 'Statistiques de visites (pp_stats_visites)', $$select pp_stats_visites()$$);
select pg_temp.appel('Fonctions', 'Vider la corbeille (pp_menage_corbeille)', $$select pp_menage_corbeille()$$);
select pg_temp.appel('Fonctions', 'Restaurer depuis la corbeille (pp_restaurer)', $$select pp_restaurer(1)$$);
select pg_temp.appel('Fonctions', 'Lancer une sauvegarde (pp_sauvegarde)', $$select pp_sauvegarde(true)$$);
select pg_temp.appel('Fonctions', 'Supprimer le compte de B (pp_supprimer_compte)', $$select pp_supprimer_compte('lv.zz.testb@lycee-verdun.edu.lb')$$);
select pg_temp.appel('Fonctions', 'Lister tous les fichiers (pp_fichiers)', $$select pp_fichiers()$$);
select pg_temp.appel('Fonctions', 'Rejoindre une classe avec un faux code', $$select rejoindre_classe('ZZFAUX00', 'A')$$);
select pg_temp.appel('Fonctions', 'Répondre deux fois à un quiz noté', $$select soumettre_quiz((select v::bigint from t_ids where k = 'Q'), '[1]'); select soumettre_quiz((select v::bigint from t_ids where k = 'Q'), '[1]')$$);

-- ---------- résultat : affiché sous forme d'erreur volontaire, ce qui ANNULE tout ----------
reset role;
do $$ begin raise exception E'RESULTAT\n%', (select string_agg(case when ok then 'OK ' else 'XX ' end || '[' || groupe || '] ' || test || ' -> ' || obtenu, E'\n' order by n)
  || E'\nBILAN : ' || count(*) filter (where ok) || ' / ' || count(*) || ' tentatives bloquees' from t_res); end $$;
