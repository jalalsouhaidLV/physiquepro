# Fiche projet — PhysiquePro

*Site de cours de M. Jalal SOUHAID, Lycée franco-libanais Verdun (MLF, Liban). Fiche à jour au 11 novembre 2026. Copie dans le dépôt : `sources/FICHE-PHYSIQUEPRO.md`.*

---

## 1. À coller dans les « Instructions » du projet Claude

*Texte identique aux instructions du projet (version du 11/11/2026, recopiée à l'identique lors de l'audit du 11/11).*

> # PhysiquePro : instructions du projet
> Fiche à jour au 11/11/2026. Copie complète dans le dépôt : sources/FICHE-PHYSIQUEPRO.md (la lire pour les détails, notamment §11 Inventaire et §12 Savoir-faire). En cas de doute, l'état réel du dépôt et de Supabase fait foi.
>
> ## 1. Rôle
> Tu travailles sur PhysiquePro, le site de cours de Jalal SOUHAID (professeur de physique-chimie, SNT, SI, Technologie, PIX au Lycée franco-libanais Verdun). Réponds toujours en français.
> Jalal veut que tu fasses tout toi-même : modifier le code, construire, tester, mettre en ligne (git push sur main), exécuter le SQL dans Supabase, puis vérifier en ligne.
>
> ## 2. Règles absolues
> - Ne code rien d'important avant que Jalal ait choisi, quand tu proposes plusieurs options.
> - Ne jamais taper de mot de passe ni manipuler de clé secrète (service_role, secret Entra). Jalal se connecte lui-même à ses comptes.
> - Ne jamais donner l'accès « anon » aux tables. Depuis le 30/10/2026 : toute nouvelle table reçoit ses grant et ses règles RLS écrits explicitement.
> - NE JAMAIS PUBLIER SUR NETLIFY SANS LA DEMANDE EXPLICITE DE JALAL (consigne du 11/11/2026). Seule la publication automatique du dimanche est permise.
> - Avant chaque mise en ligne : node sources/tests/test-site.js sans erreur, puis vérification sur le site publié.
> - Quand un fil attend une réponse de Jalal pour continuer : alerte dans le chat du projet, entourée de triangles rouges 🔺, avec un lien vers le fil (consigne du 6/11/2026).
> - Une tâche planifiée annoncée doit exister vraiment : le vérifier dans la liste des tâches planifiées avant de l'annoncer.
> - Tout changement important (nouveau script SQL, nouvelle procédure, nouveau réglage) met à jour sources/FICHE-PHYSIQUEPRO.md dans le même envoi, et ces instructions si besoin, pour qu'elles ne se contredisent jamais.
> - Le site sert aussi à des collégiens, surtout sur téléphone : tout doit rester très simple.
>
> ## 3. Choix de Jalal
> - Tout en français, « gras mesuré ».
> - Le prof n'est jamais compté dans les stats ni les listes.
> - PAS de déconnexion automatique : statuts En ligne / Inactif ; Jalal déconnecte à la main (bouton « Déconnecter » du panneau Élèves connectés).
> - Netlify publié une fois par semaine (dimanche), jamais autrement sauf demande de Jalal.
> - Calendrier = lien Google Drive.
> - Pas d'intervention de l'admin réseau du lycée.
>
> ## 4. Procédure de travail
> 1. Cloner le dépôt jalalsouhaidLV/physiquepro (ou git pull).
> 2. Modifier sources/build/*.js, lancer ./sources/build/build.sh, changer ?v= dans index.html.
> 3. Tester : node sources/tests/test-site.js (56 pages visiteur / élève / prof, données fictives ; dans le conteneur : NODE_PATH=$(npm root -g)). Nouvelle page ou nouvelle fonction pp_… : l'ajouter à PAGES (test-site.js) et à RPC (faux-supabase.js).
> 4. git push sur main : GitHub Pages en 1-2 min. Netlify : uniquement le dimanche 18 h UTC (automatique), ou via Actions > « Publication Netlify du dimanche » > Run workflow UNIQUEMENT si Jalal le demande.
> 5. SQL : nouveau script numéroté dans sources/supabase/ (01 à 37 existaient au 11/11/2026 ; vérifier le dernier numéro dans le dossier avant d'en créer un), exécuté par le connecteur Supabase. Une requête qui commence par drop ou delete y est bloquée (ne pas contourner) : ouvrir Remote Control sur le PC de Jalal (dossier Downloads), coller le script dans l'éditeur SQL de son Chrome, et Jalal clique lui-même sur Run. Si droits ou RLS changent : relancer 29-test-intrusion.sql et 30-test-fichiers.sql.
> 6. Vérifier la publication : le conteneur n'atteint ni github.io ni netlify.app. Vérifier le run GitHub Actions (pages-build-deployment), puis le site avec ?r= dans le Chrome de Jalal par Remote Control. Répondre en français.
>
> ## 5. Construction technique
> - Site statique (HTML/CSS/JS sans framework) sur GitHub Pages, à la racine du dépôt.
> - app.js est assemblé, ne pas l'éditer : modifier sources/build/*.js ; build.sh met 09-evenements.js en dernier et n'écrit app.js que si node --check réussit.
> - config.js = liens et icônes du haut, nom/email du prof, URL Supabase et clé publishable.
> - Anti-cache : ?v=AAAAMMJJHHMM dans index.html (lire la valeur actuelle dans index.html et la remplacer par la date-heure du jour).
> - supabase-js 2.117.2 et msal-browser 3.28.1 via jsDelivr avec SRI.
> - Connexion Microsoft 365 via Supabase Auth (Azure), domaine @lycee-verdun.edu.lb ; prof = jalal.souhaid@lycee-verdun.edu.lb.
> - Toutes les tables avec RLS, aucune lisible par anon ; est_prof() pour les fonctions prof ; pp_accueil_public est la seule fonction ouverte aux visiteurs (voulu).
> - Stockage privé : documents (prof, dossier prof/ jamais purgé) et rendus.
> - OneDrive : chaque activité a « Copies élèves » (copie Word modifiable par élève) et « Travaux rendus » (rendus des élèves + corrections du prof, seul exemplaire). Notifications push (fonction pp-push) et e-mail via Microsoft Graph.
>
> ## 6. Adresses
> - Site : https://jalalsouhaidlv.github.io/physiquepro/
> - Copie Netlify : https://physiquepro.netlify.app/ (branche netlify, copiée de main chaque dimanche 18 h UTC par netlify-dimanche.yml)
> - Dépôt : jalalsouhaidLV/physiquepro
> - Supabase : zycuykixcjgmdbeoflsb
> - Netlify : équipe jalal-souhaid-6s-pa6e (300 crédits/mois, période du 30 au 29)
> - Calendrier Drive : 1YXfbYl-v3lrAA1VUjQO4WGC1NTR_SYRe
>
> ## 7. Réglages externes
> - Comptes : GitHub jalalsouhaidLV, Netlify (facturation jalal.souhaid@mlf-liban.org), Supabase, Microsoft 365, Google. Jalal se connecte lui-même.
> - Supabase Auth : Site URL https://physiquepro.netlify.app/ ; Redirect URLs github.io/physiquepro/** et physiquepro.netlify.app/**.
> - MSAL (15-onedrive.js) : app f52213ef-d098-49cc-ac22-944c23bcab61, tenant 4bd4c77d-938d-4bd2-99ae-3ca7e4de49e6, retour auth.html.
> - GitHub Actions : netlify-dimanche.yml, supabase-actif.yml (ping tous les 2 jours), pages-build-deployment (automatique, sans fichier).
> - Racine : _headers (Netlify seulement), _redirects (cache sur Netlify sources/*, verification.html, test-connexion.html, README.md), 404.html, sw.js, manifest.json, auth.html, verification.html, test-connexion.html, README.md.
>
> ## 8. Sécurité : état et limites
> - Tests 29 (84/84 au 11/11/2026) et 30 (13/13).
> - Piège : la règle rendus_lecture garde auth.uid() direct (une sous-requête provoque « infinite recursion ») ; c'est la seule alerte de performance Supabase restante, et elle est voulue.
> - Limites : pas d'en-têtes HTTP sur GitHub Pages ; MFA/Entra relèvent du lycée ; un code de classe permet à tout compte du lycée de rejoindre.
>
> ## 9. À surveiller
> - Mise à jour du dépôt avant l'été (GitHub met les Actions en pause après 60 jours sans modification).
> - Crédits Netlify le 30 de chaque mois.
> - SECRET CLIENT Entra de l'app « PhysiquePro » (f52213ef-d098-49cc-ac22-944c23bcab61), utilisé par Supabase Auth > Azure : EXPIRE LE 16/10/2028. Rappel planifié le 15/09/2028 à 7 h (Beyrouth), vérifié existant. Après expiration plus personne ne peut se connecter : Jalal crée un nouveau secret dans Entra (Certificats et secrets) et le colle dans Supabase > Authentication > Providers > Azure.
>
> ## 10. Savoir-faire
> - Éditeur SQL : Run, accepter « Run without RLS » ; finir par raise exception pour tout annuler.
> - storage.objects : set local storage.allow_delete_query='true' dans une transaction annulée.
> - Anciens bouchons Playwright (sources/tests/, LISEZMOI-tests.md) : servir index.html sans integrity, remplacer rpc:async n=>. Le test complet test-site.js le fait tout seul.
> - Ménage du 4/11/2026 : doublons de la racine supprimés, récupérables dans l'historique Git.

---

## 2. Adresses

| Quoi | Adresse |
|---|---|
| Site (toujours à jour) | https://jalalsouhaidlv.github.io/physiquepro/ |
| Site, adresse courte (copie publiée chaque dimanche à 20 h) | https://physiquepro.netlify.app/ |
| Dépôt GitHub | https://github.com/jalalsouhaidLV/physiquepro (compte `jalalsouhaidLV`) |
| Base de données Supabase | projet `zycuykixcjgmdbeoflsb` — https://supabase.com/dashboard/project/zycuykixcjgmdbeoflsb |
| Netlify | équipe `jalal-souhaid-6s-pa6e`, projet `physiquepro` (offre gratuite, 300 crédits/mois, période du 30 au 29) |
| Calendrier dynamique (direction) | Google Drive, fichier `1YXfbYl-v3lrAA1VUjQO4WGC1NTR_SYRe` (« calendrier dynamique 2026-2027.xlsx ») |

---

## 3. Comment le site est construit

- **Site statique** (HTML + CSS + JavaScript sans framework) hébergé sur GitHub Pages, à la racine du dépôt : `index.html`, `app.js` (assemblé, ne pas modifier à la main), `app.css`, `config.js`, `logos.js`, logos `logo-*.png/svg`, icônes `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`.
- **`config.js`** est le seul fichier à modifier pour changer un lien, une icône du haut, le nom ou l'email du prof : il contient aussi l'adresse Supabase et la clé *publishable* (publique par nature, sans danger).
- **Code source découpé** dans `sources/build/` (34 modules, liste en section 11). `sources/build/build.sh` fonctionne directement dans le dépôt : il assemble les modules dans `app.js` à la racine (09-evenements.js toujours en dernier) puis vérifie avec `node --check`.
- **Anti-cache** : après chaque modification, changer le numéro `?v=AAAAMMJJHHMM` dans `index.html` (actuellement `202611111330`).
- **Bibliothèques** chargées depuis jsDelivr avec vérification d'intégrité (SRI) : supabase-js 2.117.2 et msal-browser 3.28.1.
- **Connexion** : Microsoft 365 du lycée via Supabase Auth (Azure). Seule restriction : adresse en `@lycee-verdun.edu.lb` (élèves `lv.prenom.nom@…`, profs `prenom.nom@…`). Le prof est `jalal.souhaid@lycee-verdun.edu.lb` (rôle « prof » donné automatiquement).
- **Base de données** Supabase (PostgreSQL) : toutes les tables ont des règles RLS ; les visiteurs non connectés n'ont aucun accès direct ; les fonctions réservées au prof vérifient `est_prof()`.
- **Fichiers** : espaces de stockage privés `documents` (prof) et `rendus` (élèves). Le calendrier n'y est plus : c'est un lien Google Drive.

---

## 4. Mettre en ligne (procédure utilisée)

1. Modifier `sources/build/*.js` (et `app.css` si besoin), lancer `sources/build/build.sh`, changer le `?v=` dans `index.html`.
2. Tester localement avec Playwright (bouchons dans `sources/tests/`, mode d'emploi `sources/tests/LISEZMOI-tests.md`).
3. Mettre en ligne par `git push` sur `main` (dépôt relié au projet). Secours si le push est impossible : page « Upload files » de GitHub dans le Chrome de Jalal.
4. Attendre 1 à 2 minutes, recharger le site avec `?r=…` et vérifier le `?v=` publié.
5. **Netlify** : ne publie que la branche `netlify`. La GitHub Action `.github/workflows/netlify-dimanche.yml` copie `main` dans `netlify` chaque dimanche à 18 h UTC (20 h à Beyrouth, 21 h en heure d'été). Publication immédiate : seulement sur demande de Jalal (GitHub > Actions > « Publication Netlify du dimanche » > Run workflow).
6. **SQL** : scripts numérotés dans `sources/supabase/` (étapes 01 à 38). Chaque nouvelle modification = un nouveau script numéroté, ajouté au dépôt. Exécution : connecteur Supabase du projet. Une requête qui commence par `drop` ou `delete` y est bloquée : Remote Control sur le PC de Jalal (dossier Downloads), le script est collé dans l'éditeur SQL de son Chrome, et Jalal clique lui-même sur Run.

---

## 5. Fonctions principales du site

- Cours par classe (Tle spé PC, 1re spé PC, SNT, Option SI, Technologie 3e, PIX), chapitres en 3 étapes (Comprendre / S'entraîner / Vérifier), devoirs, questionnaires, notation sur 20, flashcards, annonces, commentaires.
- Élèves : « Message urgent à M. SOUHAID » avec voyant **Disponible / Indisponible** à côté du nom, rendez-vous, Coin Perso, À faire.
- Prof : compteur d'élèves (en ligne / inactifs) et panneau « Élèves connectés » avec déconnexion à distance ; corbeille 30 jours, sauvegardes, onglet Fichiers.
- Outils Scientifiques Importants : formules physique/chimie, éditeur de formules, convertisseur d'unités, tableau périodique, bits et octets, raccourcis AZERTY.
- Pièces jointes en **cartes** partout (choix de Jalal du 11/11/2026, modèle Google Classroom sans en copier les visuels) : aperçu ou icône de couleur par type (Word, Excel, PowerPoint, PDF, image, vidéo, lien) + nom + type. Dans les publications, l'éditeur (bloc « Joindre »), le rédacteur d'annonce, le dépôt de l'élève (« Votre travail », cartes compactes) et la correction côté prof. Code : carteRes / carteEdit / cartesEdit dans 03-classe.js, styles `.att.rcards` (et `.mini`) dans app.css.
- Simulations PhysiquePro animées : dosage pH-métrique, tir parabolique, onde progressive, décroissance radioactive, atome et couches, binaire et octets (+ simulations PhET).
- Icônes du haut : s'affichent dans un panneau à côté (NumWorks, Pronote, M@gistère, calendrier) ou dans un nouvel onglet Chrome (ChatGPT, Copilot, Gemini, Notebook, Claude, YouTube, WhatsApp, Atena, Orion).

---

## 6. Choix déjà faits par Jalal

- Réponses et site entièrement en français ; texte en « gras mesuré ».
- Le prof n'est jamais compté dans les statistiques ni les listes.
- **Pas de déconnexion automatique** des élèves (refusée) : statuts En ligne / Inactif uniquement ; Jalal déconnecte à la main.
- Netlify publié **une seule fois par semaine** pour économiser les crédits ; GitHub Pages reste la version toujours à jour.
- Le calendrier dynamique est **un lien** vers le fichier Google Drive de la direction (pas un fichier envoyé).
- Pas d'intervention de l'administrateur réseau du lycée.

---

## 7. Sécurité (vérifiée le 20 octobre 2026, test d'intrusion relancé le 11 novembre 2026 : 84/84)

- Test d'intrusion « élève contre élève » : **84/84** tentatives bloquées (lecture, modification, usurpation, fonctions du prof, commentaires de classe, annonces programmées ou épinglées).
- Test sur les fichiers déposés : **13/13** tentatives bloquées.
- Scripts de test réutilisables : `sources/supabase/29-test-intrusion.sql` et `30-test-fichiers.sql` (tout est annulé à la fin).
- Limites connues : GitHub Pages n'applique pas d'en-têtes de sécurité HTTP ; MFA et réglages Entra relèvent du lycée ; un code de classe permet à tout compte du lycée de rejoindre la classe.
- Supabase : depuis le 30 octobre 2026, toute nouvelle table doit recevoir ses `grant` explicitement (jamais à `anon`).

---

## 8. À surveiller

- **Publication Netlify du dimanche 8/11/2026** : vérifiée le 9/11 (run GitHub Actions réussi à 18 h 27 UTC, publication Netlify « ready » du commit b1c34e1). L'email annoncé pour le 9/11 n'est jamais parti : la tâche planifiée n'avait pas été créée.
- **Connexion sur physiquepro.netlify.app** : vérifiée — Jalal a testé lui-même la connexion élève et la reconnexion le 4/11/2026 (« ça marche »). Point clos.
- **Été** : GitHub met en pause les tâches automatiques (publication du dimanche, tâche « Garder Supabase actif ») après 60 jours sans modification du dépôt — faire une petite mise à jour avant l'été.
- **Crédits Netlify** : vérifier en début de période (le 30 de chaque mois) qu'il reste de la marge.
- **Secret client Microsoft Entra** : le secret de l'application Entra « PhysiquePro » (`f52213ef-d098-49cc-ac22-944c23bcab61`), utilisé par Supabase Auth > Azure, **expire le 16/10/2028**. Une tâche planifiée rappellera Jalal le 15/09/2028. Après expiration, plus personne ne peut se connecter : créer un nouveau secret dans Entra (Secrets client), puis le coller dans Supabase > Authentication > Providers > Azure.
- **Tâches planifiées** : rappel du secret Entra le 15/09/2028 à 7 h (Beyrouth), recréé le 9/11/2026 (il n'existait pas) ; il ouvre un nouveau fil dans le projet PhysiquePro. Pour vérifier qu'une tâche existe vraiment : liste des tâches planifiées de claude.ai.

---

## 9. Accès, comptes et réglages externes

- **Comptes utilisés** (Jalal se connecte lui-même, Claude ne tape jamais de mot de passe) : GitHub `jalalsouhaidLV` ; Netlify (compte de facturation jalal.souhaid@mlf-liban.org) ; Supabase ; Microsoft 365 du lycée ; Google (calendrier sur Drive).
- **Supabase Auth > URL Configuration** : Site URL `https://physiquepro.netlify.app/` ; Redirect URLs `https://jalalsouhaidlv.github.io/physiquepro/**` et `https://physiquepro.netlify.app/**`. Fournisseur de connexion : Azure.
- **OneDrive (MSAL, dans 15-onedrive.js)** : application Entra `f52213ef-d098-49cc-ac22-944c23bcab61`, locataire `4bd4c77d-938d-4bd2-99ae-3ca7e4de49e6`, page de retour `auth.html`.
- **Netlify** : branche de production `netlify` ; seules les publications de production sont construites ; aperçus de déploiement désactivés.
- **GitHub Actions** : « Publication Netlify du dimanche » (`netlify-dimanche.yml`), « Garder Supabase actif » (empêche la mise en pause du projet gratuit après 7 jours), pages-build-deployment.
- **Fichiers spéciaux à la racine** : `_headers` (Netlify seulement), `_redirects` (cache sur Netlify `sources/*`, `verification.html`, `test-connexion.html`, `README.md`), `404.html`, `sw.js`, `manifest.json`, `auth.html`.
- **Sauvegarde du code** : `sources/build/` (34 modules + build.sh), `sources/supabase/` (scripts 01 à 38), `sources/tests/` (bouchons Playwright), `sources/LISEZMOI.md`, `sources/FICHE-PHYSIQUEPRO.md` (cette fiche).

## 10. Travailler depuis le projet (procédure)

- **État au 4 novembre 2026** : dépôt `jalalsouhaidLV/physiquepro` relié au projet (Paramètres > Environnement), application Claude GitHub installée, droit d'écriture vérifié. Connecteur Supabase disponible dans le projet.
1. Au début d'un fil : cloner le dépôt (ou `git pull`).
2. Modifier, assembler avec `sources/build/build.sh`, tester avec Playwright (`sources/tests/`), changer le `?v=`.
3. `git push` sur `main` → GitHub Pages se met à jour en 1 à 2 minutes. Netlify suit le dimanche.
4. SQL : nouveau script numéroté dans `sources/supabase/`, exécuté par le connecteur Supabase (ou l'éditeur SQL dans Chrome), puis relancer `29-test-intrusion.sql` si les droits ou règles RLS changent.
5. Vérifier la publication : le conteneur n'atteint ni github.io ni netlify.app. Vérifier le run GitHub Actions, puis le site (avec `?r=`) dans le Chrome de Jalal par Remote Control. Répondre à Jalal en français.
6. Chrome (extension Claude) n'est nécessaire que pour : vérifier le site visuellement, l'éditeur SQL de Supabase, les réglages Netlify / Supabase Auth.

---

## 11. Inventaire

**Modules du site (`sources/build/`)** : 01-core · 02-coque (menu, en-tête) · 03-classe · 04-devoirs · 05-editeurs · 06-questionnaires · 07-parametres · 08-fenetres · 09-evenements (toujours en dernier) · 10-admin (fichiers, purge, sauvegardes) · 11-deplacer · 12-notifs · 13-notation · 14-outils · 15-onedrive (MSAL) · 16-import · 17-public (accueil visiteurs) · 18-urgences (messages urgents, nom du prof) · 19-nouveautes · 20-coinperso (icônes du haut, panneau latéral) · 21-pro (espace prof, calendrier, compteur) · 22-scientifiques · 23-outils-sciences · 24-decouvertes · 25-formulaires · 26-azerty · 27-sessions (élèves connectés, statuts) · 28-pratique · 29-animations · 29-labo (dosage, tir) · 29-labo2 (onde, radioactivité, atome, binaire) · 29-presence (activité réelle des élèves) · 29-push (notifications) · 30-classroom (idées « Classroom » du 11/11 : scanner, commentaires de classe, QR code, fiche à annoter, aperçu élève, lecture à voix haute).

**Tables (27 + les 2 tables push du script 37, toutes avec RLS)** : classes, inscriptions, profiles, reglages, supports, themes, annonces, commentaires, commentaires_prives, devoirs, rendus, copies, corrections, quiz, quiz_solutions, resultats_quiz, flashcards, notes_perso, messages_urgents, rdv_series, rdv_creneaux, rdv_reservations, demandes_materiel, corbeille, sauvegardes, sessions_ouvertes, commentaires_devoirs (script 38). (`reseaux_lycee` supprimée à l'étape 33.)

**Fonctions principales** : droits (`est_prof`, `dans_classe`, `domaine_autorise`, `mon_email`, `peut_rendre`, `devoir_ouvert`, `reponses_visibles`, `reponse_modifiable`), élèves (`rejoindre_classe`, `soumettre_quiz`, `pp_quitter_cours`, `pp_reserver`, `pp_annuler_rdv`, `pp_supprimer_compte`), présence (`pp_presence2`, `pp_presence`, `pp_statut_session`, `pp_sessions`, `pp_deconnecter`, `pp_fin_session`, `pp_stats_visites`, `pp_visite`, `pp_statut_prof`), prof (`pp_fichiers`, `pp_vers_corbeille`, `pp_restaurer`, `pp_menage_corbeille`, `pp_sauvegarde`, `pp_verrou_remise`), public (`pp_accueil_public`, seule ouverte aux visiteurs, sans données d'élèves), `pp_ping`. Définitions : `sources/supabase/`.

**Stockage** : `documents` (prof ; dossier `prof/` = fichiers privés, jamais purgés) et `rendus` (un dossier par élève).

**Scripts récents** : 31 compteur en ligne · 32 activité réelle · 33 sans déconnexion automatique · 34 corrections des alertes Supabase (search_path, index, RLS — appliqué le 4/11 par le connecteur) · 35 fusion des règles RLS en double (appliqué le 4/11 dans l'éditeur SQL, test 29 : 77/77) · 36 copies.fichier · 37 notifications push (tables pp_push_abonnements et pp_push_cles, fonctions pp_push_abonner / pp_push_desabonner) · 38 annonces programmées et épinglées (annonces.publie_le, annonces.epingle, déclencheur annonces_regles) et table commentaires_devoirs.

**Animations ajoutées (dossier `simulations/`)** : `simulations/ch12/` = labo Terminale du chapitre 12 « Mouvement dans un champ uniforme » (sommaire + 7 animations HTML autonomes, FR/EN/arabe), listé en tête de la page Simulations (constante `CH12` dans 21-pro.js). Chaque page a été vérifiée avant ajout : aucun script ni appel réseau externe, polices Google retirées, et une règle CSP en `<meta>` qui interdit tout chargement extérieur (`default-src 'none'`, `connect-src 'none'`). Pour un nouveau chapitre : même méthode, un dossier `simulations/chNN/`.

**Autres fichiers à la racine** : `qrcode.js` (bibliothèque qrcode-generator 1.4.4, licence MIT, pour le QR code du cours), `verification.html` et `test-connexion.html` (pages de diagnostic, cachées sur Netlify par `_redirects`), `README.md`, `.github/workflows/netlify-dimanche.yml`, `.github/workflows/supabase-actif.yml`.

---

## 12. Savoir-faire et historique utiles

- **Éditeur SQL Supabase (Chrome)** : coller le script dans l'éditeur, « Run », accepter « Run without RLS » / « Run query ». Pour lire un long résultat sans rien garder : terminer par une erreur volontaire (`raise exception`), ce qui annule tout.
- **Fichiers en SQL** : Supabase interdit d'effacer directement dans `storage.objects` ; pour un test, `set local storage.allow_delete_query = 'true'` dans une transaction annulée.
- **Tests Playwright** : servir `index.html` sans les attributs `integrity` (sinon SRI bloque les bouchons), remplacer `rpc:async n=>` pour simuler les fonctions.
- **20 octobre 2026** : le fichier du calendrier a été effacé par le bouton « Supprimer les fichiers inutilisés ». Corrigé : les fichiers du dossier `prof/` ne sont plus jamais comptés comme inutilisés, et le calendrier est devenu un lien Google Drive.
- **Ménage du 4 novembre 2026** : anciens doublons supprimés de la racine du dépôt (16 scripts SQL 06 à 22, dossiers `build/`, `site/`, `supabase/` du 18 octobre) — les bonnes versions sont dans `sources/`. Récupérables dans l'historique Git si besoin.
- **Cloche des notifications (11 novembre 2026)** : chaque notification non lue a une coche « Marquer comme lu », et l'ouvrir la marque aussi comme lue. Les notifications lues une à une sont gardées dans `profiles.prefs.lus` (enregistré par `pp_prefs`, donc pareil sur tous les appareils, pas de nouveau script SQL) ; « Tout marquer comme lu » garde `pp_vu` (date `vu_le`). Sur téléphone (≤ 600 px), le menu prend toute la largeur de l'écran : avant, il dépassait à gauche et le texte paraissait coupé.
- **Notifications quand le prof rend une note (11 novembre 2026, script 37)** : (1) **push** : l'élève touche « Activer les notifications sur cet appareil » (Profil > Notifications, module 29-push.js) ; l'abonnement est rangé par `pp_push_abonner` dans `pp_push_abonnements` (aucun droit direct, chacun ne lit que ses appareils). À chaque note rendue (« Rendre » ou « Rendre toutes les notes saisies »), le navigateur du prof appelle la **fonction Supabase `pp-push`** (Edge Function, code dans `sources/supabase/fonctions/pp-push/`, verify_jwt, réservée au prof pour l'envoi), qui envoie la notification Web Push et efface les abonnements périmés ; `sw.js` l'affiche et ouvre le devoir au toucher. Les clés VAPID sont créées par la fonction elle-même la première fois et rangées dans `pp_push_cles` (rôle service seulement) : personne ne les copie. iPhone : iOS 16.4+, site ajouté à l'écran d'accueil et ouvert depuis l'icône ; Android : Chrome suffit. (2) **e-mail** : envoyé depuis l'Outlook du prof par Microsoft Graph (`/me/sendMail`, permission déléguée Mail.Send, élèves en copie cachée, un e-mail par devoir) ; interrupteur « Envoyer aussi un e-mail » dans Profil du prof (préférence `mail_notes`).
- **Documents Word des élèves sur téléphone (11 novembre 2026, script 36)** : Microsoft ne permet que la lecture de Word / Excel / PowerPoint dans le navigateur d'un téléphone. Sur téléphone, la carte de la copie de l'élève ouvre une fenêtre « Écrire dans ta copie » : bouton « Ouvrir dans l'appli Word » (lien `ms-word:ofe|u|` + adresse directe du fichier, colonne `copies.fichier`), aide pour installer l'appli et se connecter avec le compte du lycée, « Juste la lire », rappel « photo + Joindre ». Sur ordinateur, la carte verte « ta copie : clique pour écrire dedans » ouvre Word en ligne ; la flèche télécharge la copie de l'élève. Les élèves ayant le droit d'écrire peuvent créer un lien « Tout le monde » (email SharePoint « anonymous access link » au prof) : toutes les 6 h, le navigateur du prof retire tout lien de partage des copies élèves (`entretienCopies`, 15-onedrive.js) et complète `copies.fichier`.
- **Idées « Classroom » (11 novembre 2026, script 38, module 30-classroom.js)** : Jalal a demandé les idées 1, 2, 3, 4, 6, 7 et 9. (1) **Scanner mon travail papier** (élève, zone « Votre travail ») : photos ou galerie, rotation, filtre « Rendre plus lisible », un seul PDF A4 ajouté au travail (jsPDF) ; pas de recadrage automatique. (2) **Commentaires de la classe** sous chaque devoir (table `commentaires_devoirs`, mêmes règles que le flux : masqué = rien, « prof seul » = lecture seule). (3) **Annonces programmées** (« Programmer la publication », date et heure) et **épinglées** (menu ⋮ « Épingler en haut du flux ») : un élève ne voit l'annonce qu'à la date prévue, et ne peut ni épingler ni programmer (déclencheur `annonces_regles`). (4) **QR code du cours** : menu « Code du cours » > « QR code à projeter », il ouvre la page Rejoindre avec le code. (6) **Écrire sur la fiche** : l'élève annote au doigt une fiche PDF ou image déposée sur le site (pas les fichiers OneDrive / Word), le résultat est ajouté à son travail en PDF. (7) **Aperçu élève** : bouton œil dans les onglets du cours (prof), bandeau jaune « Quitter l'aperçu » ; brouillons, devoirs programmés ou ciblés et annonces futures sont cachés. (9) **Écouter** : bouton haut-parleur sur les consignes, questions de questionnaire et annonces (voix française du navigateur).
- **Audit complet (11 novembre 2026)** : Supabase sans faille trouvée (aucune table lisible par anon, buckets privés, seules `pp_accueil_public` et `pp_ping` ouvertes aux visiteurs ; les fonctions SECURITY DEFINER sensibles vérifient `est_prof()` ou `auth.uid()` ; la fonction `pp-rappels` sans jeton est protégée par la clé `x-pp-cle`). Corrigé sur téléphone : titres des travaux coupés (« À faire », « Travaux », « Mes notes », « À faire bientôt » de l'accueil) ; bouton « Écouter » des questions étiré sur toute la largeur ; champ de commentaire raccourci (« Écrire un commentaire… »). §1 de cette fiche recopié à l'identique des instructions du projet du 11/11.
