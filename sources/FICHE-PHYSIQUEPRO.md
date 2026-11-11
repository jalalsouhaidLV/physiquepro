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
- **Code source découpé** dans `sources/build/` (35 modules, liste en section 11). `sources/build/build.sh` fonctionne directement dans le dépôt : il assemble les modules dans `app.js` à la racine (09-evenements.js toujours en dernier) puis vérifie avec `node --check`.
- **Anti-cache** : après chaque modification, changer le numéro `?v=AAAAMMJJHHMM` dans `index.html` (actuellement `202611111400`).
- **Bibliothèques** chargées depuis jsDelivr avec vérification d'intégrité (SRI) : supabase-js 2.117.2 et msal-browser 3.28.1.
- **Connexion** : Microsoft 365 du lycée via Supabase Auth (Azure). Seule restriction : adresse en `@lycee-verdun.edu.lb` (élèves `lv.prenom.nom@…`, profs `prenom.nom@…`). Le prof est `jalal.souhaid@lycee-verdun.edu.lb` (rôle « prof » donné automatiquement).
- **Base de données** Supabase (PostgreSQL) : toutes les tables ont des règles RLS ; les visiteurs non connectés n'ont aucun accès direct ; les fonctions réservées au prof vérifient `est_prof()`.
- **Fichiers** : espaces de stockage privés `documents` (prof) et `rendus` (élèves). Le calendrier n'y est plus : c'est un lien Google Drive.

---

## 4. Mettre en ligne (procédure utilisée)

1. Modifier `sources/build/*.js` (et `app.css` si besoin), lancer `sources/build/build.sh`, changer le `?v=` dans `index.html`.
2. Tester localement : `node sources/tests/test-site.js` (56 pages) puis `node sources/tests/test-telephone.js` (112 vérifications élève et prof sur iPhone, Android, petit Android 320 px et ordinateur simulés ; `--captures` range les captures dans `sources/tests/captures/telephone/` ; `--seul=testsCinquieme` ne lance qu'une série, pour corriger vite). Dans le conteneur : `NODE_PATH=$(npm root -g)`.
3. Mettre en ligne par `git push` sur `main` (dépôt relié au projet). Secours si le push est impossible : page « Upload files » de GitHub dans le Chrome de Jalal.
4. Attendre 1 à 2 minutes, recharger le site avec `?r=…` et vérifier le `?v=` publié.
5. **Netlify** : ne publie que la branche `netlify`. La GitHub Action `.github/workflows/netlify-dimanche.yml` copie `main` dans `netlify` chaque dimanche à 18 h UTC (20 h à Beyrouth, 21 h en heure d'été). Publication immédiate : seulement sur demande de Jalal (GitHub > Actions > « Publication Netlify du dimanche » > Run workflow).
6. **SQL** : scripts numérotés dans `sources/supabase/` (étapes 01 à 39). Chaque nouvelle modification = un nouveau script numéroté, ajouté au dépôt. Exécution : connecteur Supabase du projet. Une requête qui commence par `drop` ou `delete` y est bloquée : Remote Control sur le PC de Jalal (dossier Downloads), le script est collé dans l'éditeur SQL de son Chrome, et Jalal clique lui-même sur Run.

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
- Après la connexion, l'élève arrive **toujours sur l'accueil**, même s'il n'a qu'un seul cours (11/11/2026, ancienne redirection automatique vers le cours unique retirée). Seul un lien direct vers un cours (carte de cours de la page publique, lien partagé, code d'invitation) ouvre ce cours après la connexion.

---

## 7. Sécurité (vérifiée le 20 octobre 2026, test d'intrusion relancé le 11 novembre 2026 : 86/86)

- Test d'intrusion « élève contre élève » : **86/86** tentatives bloquées (lecture, modification, usurpation, fonctions du prof, commentaires de classe, annonces programmées ou épinglées, clé et journal des rappels).
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
- **Rappel de la veille (script 39)** : la tâche pg_cron `pp-rappels-veille` appelle chaque jour à 16 h UTC (18 h Beyrouth l'hiver, 19 h l'été) la fonction Supabase `pp-rappels`. Pour vérifier sans rien envoyer : appeler la fonction avec `{"essai": true}` et l'en-tête `x-pp-cle` (valeur dans pp_rappels_cle, lue par le connecteur). Liste des tâches : `select * from cron.job`.
- **Tâches planifiées** : rappel du secret Entra le 15/09/2028 à 7 h (Beyrouth), recréé le 9/11/2026 (il n'existait pas) ; il ouvre un nouveau fil dans le projet PhysiquePro. Pour vérifier qu'une tâche existe vraiment : liste des tâches planifiées de claude.ai.

---

## 9. Accès, comptes et réglages externes

- **Comptes utilisés** (Jalal se connecte lui-même, Claude ne tape jamais de mot de passe) : GitHub `jalalsouhaidLV` ; Netlify (compte de facturation jalal.souhaid@mlf-liban.org) ; Supabase ; Microsoft 365 du lycée ; Google (calendrier sur Drive).
- **Supabase Auth > URL Configuration** : Site URL `https://physiquepro.netlify.app/` ; Redirect URLs `https://jalalsouhaidlv.github.io/physiquepro/**` et `https://physiquepro.netlify.app/**`. Fournisseur de connexion : Azure.
- **OneDrive (MSAL, dans 15-onedrive.js)** : application Entra `f52213ef-d098-49cc-ac22-944c23bcab61`, locataire `4bd4c77d-938d-4bd2-99ae-3ca7e4de49e6`, page de retour `auth.html`.
- **Netlify** : branche de production `netlify` ; seules les publications de production sont construites ; aperçus de déploiement désactivés.
- **GitHub Actions** : « Publication Netlify du dimanche » (`netlify-dimanche.yml`), « Garder Supabase actif » (empêche la mise en pause du projet gratuit après 7 jours), pages-build-deployment.
- **Fichiers spéciaux à la racine** : `_headers` (Netlify seulement), `_redirects` (cache sur Netlify `sources/*`, `verification.html`, `test-connexion.html`, `README.md`), `404.html`, `sw.js`, `manifest.json`, `auth.html`.
- **Sauvegarde du code** : `sources/build/` (35 modules + build.sh), `sources/supabase/` (scripts 01 à 39), `sources/tests/` (bouchons Playwright), `sources/LISEZMOI.md`, `sources/FICHE-PHYSIQUEPRO.md` (cette fiche).

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

**Modules du site (`sources/build/`)** : 01-core · 02-coque (menu, en-tête) · 03-classe · 04-devoirs · 05-editeurs · 06-questionnaires · 07-parametres · 08-fenetres · 09-evenements (toujours en dernier) · 10-admin (fichiers, purge, sauvegardes) · 11-deplacer · 12-notifs · 13-notation · 14-outils · 15-onedrive (MSAL) · 16-import · 17-public (accueil visiteurs) · 18-urgences (messages urgents, nom du prof) · 19-nouveautes · 20-coinperso (icônes du haut, panneau latéral) · 21-pro (espace prof, calendrier, compteur) · 22-scientifiques · 23-outils-sciences · 24-decouvertes · 25-formulaires · 26-azerty · 27-sessions (élèves connectés, statuts) · 28-pratique · 29-animations · 29-labo (dosage, tir) · 29-labo2 (onde, radioactivité, atome, binaire) · 29-presence (activité réelle des élèves) · 29-push (notifications) · 30-classroom (idées « Classroom » du 11/11 : scanner, commentaires de classe, QR code, fiche à annoter, aperçu élève, lecture à voix haute) · 31-telephone (les 29 idées « téléphone » du 11/11, voir section 12) · 32-retour (touche Retour du téléphone, visite guidée, « Aller au contenu », 3e et 4e évaluations). · 33-evaluation5 (logos du haut qui ne tiennent pas en entier rangés dans Applications ; titre principal caché et niveaux de titres réguliers pour les lecteurs d'écran)

**Tables (27 + les 2 tables push du script 37, toutes avec RLS)** : classes, inscriptions, profiles, reglages, supports, themes, annonces, commentaires, commentaires_prives, devoirs, rendus, copies, corrections, quiz, quiz_solutions, resultats_quiz, flashcards, notes_perso, messages_urgents, rdv_series, rdv_creneaux, rdv_reservations, demandes_materiel, corbeille, sauvegardes, sessions_ouvertes, commentaires_devoirs (script 38), pp_rappels_cle et pp_rappels_envoyes (script 39, rôle service seulement). (`reseaux_lycee` supprimée à l'étape 33.)

**Fonctions principales** : droits (`est_prof`, `dans_classe`, `domaine_autorise`, `mon_email`, `peut_rendre`, `devoir_ouvert`, `reponses_visibles`, `reponse_modifiable`), élèves (`rejoindre_classe`, `soumettre_quiz`, `pp_quitter_cours`, `pp_reserver`, `pp_annuler_rdv`, `pp_supprimer_compte`), présence (`pp_presence2`, `pp_presence`, `pp_statut_session`, `pp_sessions`, `pp_deconnecter`, `pp_fin_session`, `pp_stats_visites`, `pp_visite`, `pp_statut_prof`), prof (`pp_fichiers`, `pp_vers_corbeille`, `pp_restaurer`, `pp_menage_corbeille`, `pp_sauvegarde`, `pp_verrou_remise`), public (`pp_accueil_public`, seule ouverte aux visiteurs, sans données d'élèves), `pp_ping`. Définitions : `sources/supabase/`.

**Stockage** : `documents` (prof ; dossier `prof/` = fichiers privés, jamais purgés) et `rendus` (un dossier par élève).

**Scripts récents** : 31 compteur en ligne · 32 activité réelle · 33 sans déconnexion automatique · 34 corrections des alertes Supabase (search_path, index, RLS — appliqué le 4/11 par le connecteur) · 35 fusion des règles RLS en double (appliqué le 4/11 dans l'éditeur SQL, test 29 : 77/77) · 36 copies.fichier · 37 notifications push (tables pp_push_abonnements et pp_push_cles, fonctions pp_push_abonner / pp_push_desabonner) · 38 annonces programmées et épinglées (annonces.publie_le, annonces.epingle, déclencheur annonces_regles) et table commentaires_devoirs · 39 téléphone : commentaires_prives.photo, extensions pg_cron et pg_net, tables pp_rappels_cle / pp_rappels_envoyes, tâches pg_cron `pp-rappels-veille` (chaque jour 16 h UTC) et `pp-rappels-menage` (dimanche 3 h UTC). Prochain script : 40.

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
- **Notifications quand le prof rend une note (11 novembre 2026, script 37)** : (1) **push** : l'élève touche « Activer les notifications sur cet appareil » (Profil > Notifications, module 29-push.js) ; l'abonnement est rangé par `pp_push_abonner` dans `pp_push_abonnements` (aucun droit direct, chacun ne lit que ses appareils). À chaque note rendue (« Rendre » ou « Rendre toutes les notes saisies »), le navigateur du prof appelle la **fonction Supabase `pp-push`** (Edge Function, code dans `sources/supabase/fonctions/pp-push/`, verify_jwt, réservée au prof pour l'envoi), qui envoie la notification Web Push et efface les abonnements périmés ; `sw.js` l'affiche et ouvre le devoir au toucher. Les clés VAPID sont créées par la fonction elle-même la première fois et rangées dans `pp_push_cles` (rôle service seulement) : personne ne les copie. iPhone : iOS 16.4+, site ajouté à l'écran d'accueil et ouvert depuis l'icône ; Android : Chrome suffit. (2) **e-mail** : envoyé depuis l'Outlook du prof par Microsoft Graph (`/me/sendMail`, permission déléguée Mail.Send, élèves en copie cachée, un e-mail par devoir) ; interrupteur « Envoyer aussi un e-mail » dans Profil du prof (préférence `mail_notes`). (3) **messages d'urgence (11/11/2026, ?v=202611111830)** : quand le prof écrit un message d'urgence à un élève (« Écrire à un élève ») ou répond à son message urgent, `pousserUrgent()` (18-urgences.js) appelle aussi `pp-push` : notification sur le téléphone de l'élève, même site fermé, qui ouvre le cours ; le message de confirmation du prof dit si l'élève a activé les notifications. Avant, l'alerte n'apparaissait que site ouvert. Pour que les élèves activent les notifications (choix de Jalal du 11/11, ?v=202611111900) : carte « Sois prévenu sur ton téléphone » sur l'accueil de l'élève tant que ce n'est pas activé sur l'appareil (bouton « Activer les notifications », ou « Installer PhysiquePro » sur iPhone hors écran d'accueil ; « Plus tard » la cache 3 jours), et bouton « Être prévenu sur ce téléphone la prochaine fois » dans la grande alerte d'urgence (`carteNotifsEleve()`, `pushProposable()` dans 31-telephone.js). Android : `new Notification()` y est refusé (on n'entendait que le bip du site ouvert en arrière-plan) ; `notifier()` passe alors par `registration.showNotification()` du service worker, avec la même étiquette (`urg-<id>`, `urgrep-<id>`) que la notification push, pour n'en afficher qu'une. **Panne du 11/11 au soir (corrigée, ?v=202611112010)** : la déconnexion (« Se déconnecter ») fermait la session sur TOUS les appareils (`signOut()` global) ; le navigateur du prof gardait un jeton encore valable pour la base, mais `pp-push` (getUser) le refusait (401) : aucune notification ne partait. Corrigé : déconnexion de cet appareil seulement (`signOut({ scope: "local" })`), `pp-push` version 2 qui lit le jeton déjà vérifié par la passerelle si la session n'existe plus, 2e essai après renouvellement (`invoquerPush()`, 29-push.js), et le message du prof dit « notification non envoyée » en cas d'échec.
- **Documents Word des élèves sur téléphone (11 novembre 2026, script 36)** : Microsoft ne permet que la lecture de Word / Excel / PowerPoint dans le navigateur d'un téléphone. Sur téléphone, la carte de la copie de l'élève ouvre une fenêtre « Écrire dans ta copie » : bouton « Ouvrir dans l'appli Word » (lien `ms-word:ofe|u|` + adresse directe du fichier, colonne `copies.fichier`), aide pour installer l'appli et se connecter avec le compte du lycée, « Juste la lire », rappel « photo + Joindre ». Sur ordinateur, la carte verte « ta copie : clique pour écrire dedans » ouvre Word en ligne ; la flèche télécharge la copie de l'élève. Les élèves ayant le droit d'écrire peuvent créer un lien « Tout le monde » (email SharePoint « anonymous access link » au prof) : toutes les 6 h, le navigateur du prof retire tout lien de partage des copies élèves (`entretienCopies`, 15-onedrive.js) et complète `copies.fichier`.
- **Idées « Classroom » (11 novembre 2026, script 38, module 30-classroom.js)** : Jalal a demandé les idées 1, 2, 3, 4, 6, 7 et 9. (1) **Scanner mon travail papier** (élève, zone « Votre travail ») : photos ou galerie, rotation, filtre « Rendre plus lisible », un seul PDF A4 ajouté au travail (jsPDF) ; pas de recadrage automatique. (2) **Commentaires de la classe** sous chaque devoir (table `commentaires_devoirs`, mêmes règles que le flux : masqué = rien, « prof seul » = lecture seule). (3) **Annonces programmées** (« Programmer la publication », date et heure) et **épinglées** (menu ⋮ « Épingler en haut du flux ») : un élève ne voit l'annonce qu'à la date prévue, et ne peut ni épingler ni programmer (déclencheur `annonces_regles`). (4) **QR code du cours** : menu « Code du cours » > « QR code à projeter », il ouvre la page Rejoindre avec le code. (6) **Écrire sur la fiche** : l'élève annote au doigt une fiche PDF ou image déposée sur le site (pas les fichiers OneDrive / Word), le résultat est ajouté à son travail en PDF. (7) **Aperçu élève** : bouton œil dans les onglets du cours (prof), bandeau jaune « Quitter l'aperçu » ; brouillons, devoirs programmés ou ciblés et annonces futures sont cachés. (9) **Écouter** : bouton haut-parleur sur les consignes, questions de questionnaire et annonces (voix française du navigateur).
- **Audit complet (11 novembre 2026)** : Supabase sans faille trouvée (aucune table lisible par anon, buckets privés, seules `pp_accueil_public` et `pp_ping` ouvertes aux visiteurs ; les fonctions SECURITY DEFINER sensibles vérifient `est_prof()` ou `auth.uid()` ; la fonction `pp-rappels` sans jeton est protégée par la clé `x-pp-cle`). Corrigé sur téléphone : titres des travaux coupés (« À faire », « Travaux », « Mes notes », « À faire bientôt » de l'accueil) ; bouton « Écouter » des questions étiré sur toute la largeur ; champ de commentaire raccourci (« Écrire un commentaire… »). §1 de cette fiche recopié à l'identique des instructions du projet du 11/11.
- **Le site sur téléphone : 29 idées (11 novembre 2026, script 39, module 31-telephone.js, test `sources/tests/test-telephone.js` 58/58)**. A : réponses gardées sur le téléphone (brouillon devoir dans IndexedDB, questionnaire dans localStorage) ; pas de zoom automatique de l'iPhone (champs à 16 px) ; envoi fiable en 4G (3 essais sans doublon, photos allégées sous 1,2 Mo, barre de progression) ; grand écran vert « C'est rendu ! » ; téléphone partagé : « Ce n'est pas moi » (nom affiché avant Rendre) ; grands boutons de QCM ; clavier physique (−, virgule, ×10^, unités) ; contrôle automatique des écrans (test-telephone.js). B : installation guidée (iPhone : Partager > Sur l'écran d'accueil ; Android : bouton Installer) ; page « Mon téléphone est-il prêt ? » (#/telephone) ; rappel push la veille de la date limite (fonction `pp-rappels`, interrupteur « Rappel la veille » dans Profil, jamais deux fois le même) ; accueil élève simplifié (bloc « À faire maintenant ») ; visite guidée en 5 étapes à la 1re connexion ; zoom des images aux doigts ; tirer pour actualiser (appli installée) ; « Ajouter à mon agenda » (.ics avec rappels la veille et 2 h avant, Google Agenda sur Android). C : une question par écran ; mode concentration ; pastille sur l'icône de l'appli ; cases à cocher dans les consignes en liste ; question au prof avec photo (commentaires_prives.photo, fichier dans rendus/<devoir>/<élève>/question-…) ; reprise de la lecture là où l'élève s'est arrêté ; simulations en plein écran et en paysage (iPhone : pas de plein écran, l'élève tourne le téléphone). D : lecture sans réseau (dernière version gardée, bandeau « Hors connexion ») ; économie de données (Profil) ; WhatsApp à un camarade (lien vers le devoir) ; joindre une capture de simulation ; « Partager vers PhysiquePro » (manifest share_target, Android seulement, page #/partage) ; raccourcis de l'icône (À faire, Agenda, Mes notes #/mesnotes ; Android seulement).
- **Évaluation experte et lots A-D (11 novembre 2026, ?v=202611111520)** : évaluation en 4 modes (prof ordi 7,5/10, élève ordi 8, iPhone 7, Android 7 ; Playwright + axe-core, captures dans `captures/2026-11-11-evaluation/` du projet). Corrigé : (A) questionnaire « une question par écran » qui montrait tout (`.q` est en grid et annulait `hidden` : règle `section.card > .q[hidden]{display:none!important}` ; le test C17 de test-telephone.js vérifie maintenant l'affichage réel), « travailx », « Ton travail / Ta réponse », `escTitre()` (espace insécable avant « : » dans les titres), nom du logo pour lecteurs d'écran ; (B) sur téléphone élève : « Découverte du jour » repliable en bas de l'accueil, plus de bouton menu ni de raccourcis en haut (ils sont dans Applications et dans « Menu » en bas), onglet « Notes » à 320 px, « Autres façons de rendre » repliable quand une copie Word existe, textes ≥ 12 px, cibles ≥ 24 px ; (C) prof : raccourcis du haut en icônes seules (nom au survol), bandeau « PhysiquePro · site de… » + compteurs seulement sur l'accueil, sommaire « Aller à » dans les Paramètres (`sommaireParametres()`, 10-admin.js) ; (D) polices Atkinson et Lexend chargées seulement si l'élève choisit « Très lisible » ou « Dyslexie » (`policeA11y()`, 21-pro.js), preconnect gstatic et jsDelivr, couleurs `--ok`, `--warn`, `--bad`, `--urgent` foncées pour le contraste 4,5:1. Minification de app.js essayée et écartée : 279 → 241 Ko compressés seulement, pour un fichier illisible.
- **2e évaluation et lots E-F-G (11 novembre 2026, ?v=202611111600)** : notes avant correction prof 8, élève ordi 8,5, iPhone 7, Android 6,5 (rapport https://claude.ai/artifact/22jRNTNB5AZ77yS6xgh3uK). E : le bouton « Menu » de la barre du bas (`<a href="#" data-act="drawer">`) changeait l'adresse, ce qui refermait aussitôt le menu ; corrigé par `e.preventDefault()` dans 09-evenements.js. PIÈGE : tout lien `href="#"` à action doit appeler preventDefault. F : à 320 px, date des travaux sous le titre, tuiles de l'accueil sans icône, ligne « Connecté » sur deux lignes, Simulations sans débordement (`.labgrille` min(300px,100%), `.simq input{min-width:0}`). G : carnet de notes « À faire » avant l'échéance et « Non fait » en rouge après, « 1 carte », notes sans les espaces de la police à chasse fixe (classe `nt`), « Quitter le plein écran » en haut de page, message du questionnaire qui nomme les questions sans réponse, icône propre à « Semaine », « Ton message… », menu « Outils Scientifiques », boutons fichier sans aria-label sur label (classe `pp-sr`). test-telephone.js : 74 vérifications (petit Android 320 px, menu du bas, message du questionnaire).
- **3e évaluation et lots I-J-K-L (11 novembre 2026, ?v=202611111700)** : notes avant correction prof 8, élève ordi 8,5, iPhone 8, Android 7,5, aucune régression (rapport https://claude.ai/artifact/FyCS5Q5AdzD8A6TF7a9eck). I : nouveau module `32-retour.js` : ouvrir le menu, la cloche, un menu déroulant ou une fenêtre ajoute une étape à l'historique (même adresse) ; la touche Retour d'Android ou le glissement de l'iPhone la referme sans quitter la page ; si la couche a été fermée autrement, Retour saute cette étape. J : téléphone en paysage (`pointer:coarse` et hauteur ≤ 500 px) : barre du bas gardée, logos du haut et logo Verdun retirés (ils sont dans Applications). K : lien « Aller au contenu » (1er Tab, `data-saut`, ne change pas l'adresse), 3 onglets de « À faire » qui tiennent à 320 px (`.tabs3`), pastille de la cloche au coin, notification élève « Note reçue » / « Correction reçue » (au lieu de « Travail rendu »), liens des cartes de cours et de Révisions à 24 px, compteur « x rendus sur y » aussi pour les questionnaires dans « À rendre récemment » du prof. L : faux Supabase qui remplit `rendu_le`, `fait_le`, `modifie_le` à l'ajout ; `test-telephone.js` 84/84 (ajout `testsTroisieme`). Laissé tel quel : couleur verte d'un cours en texte (voulu). Lot H (logos du haut) toujours en option.
- **4e évaluation et lots M-N (11 novembre 2026, ?v=202611111800)** : notes avant correction prof 8, élève ordi 9, iPhone 8,5, Android 8,5, aucune régression (rapport https://claude.ai/artifact/2DZZSNJaKVVnhj8P1PadGt). M : la règle « téléphone en paysage » s'applique à toutes les largeurs (`pointer:coarse` et hauteur ≤ 500 px, plus de `min-width:761px` : iPhone 750 px, petits Android 658 px), sans logos du haut ni bande de présentation (`.page>.headband`), titre du devoir ou du questionnaire plus petit ; tablette 761-1099 px : logos du haut estompés au bord. N : la visite guidée est une « couche » de `32-retour.js` (`ajouterCouche()`) : Retour la ferme, et elle s'arrête si la page change (hashchange hors accueil) ; travaux listés dans les cartes de cours à 24 px. `test-telephone.js` 90/90 (ajout `testsQuatrieme`). Correctif du même jour (capture de Jalal, Android, ?v=202611111810) : menu du compte (`.ddme`) qui sortait de l'écran à gauche sur téléphone, ligne « Connecté : … » coupée en colonnes quand il n'y a rien à rendre, logos favoris de l'élève de nouveau visibles en haut sur téléphone (icônes seules, 2 à 3 selon la largeur, les autres dans Applications) ; test téléphone 92/92. Lot H (choix de Jalal, ?v=202611111820) : logos du haut par défaut, tant que la personne n'a pas choisi ses favoris avec l'étoile dans Applications (`FAVORIS_DEFAUT_ELEVE` / `FAVORIS_DEFAUT_PROF`, 21-pro.js) : élève Pronote, PIX, WhatsApp, Outlook, OneDrive, NumWorks ; prof Pronote, PIX Orga, WhatsApp, Outlook, OneDrive, Atena, Calendrier ; tous les autres restent dans Applications ; test téléphone 93/93.
- **5e évaluation et lots P-Q-R-S (11 novembre 2026, ?v=202611111915)** : notes avant correction prof 8,5, élève ordi 9, iPhone 8,5, Android 8,5, aucune régression (rapport https://claude.ai/artifact/FBWftuciNsTvtnUK1TYgti, fichier `rapports/evaluation-5-2026-11-11.html` des fichiers du projet). Jalal a choisi les 4 lots. **P (prof)** : 1re tuile de l'accueil toujours « X copies à corriger » (« Tout est corrigé ✓ » sinon, clic sur le premier devoir à corriger) ; liste « Travaux en cours » (avant « À rendre récemment ») avec « 2 rendus sur 2 · 1 à noter / tout noté ✓ » ; questionnaire vu par le prof : barre de réussite par question, « À faire » avant l'échéance (« Non fait » seulement après) ; case de la note en texte avec virgule (15,5) ; cartes de cours terminées par « … ». **Q (élève sur téléphone)** : à la dernière question, grand bouton « Envoyer » sous la question (« Précédente » dessous) ; note écrite sur l'écran vert et résultat en haut de la page après l'envoi (`.quizbilan`) ; page d'un devoir : « Ton travail » avant les commentaires de la classe (≤ 820 px, `.dv.dveleve`) ; « À faire » contient les entraînements datés, triés par date, onglets « À faire / En retard / Terminés » ; côté élève « Attribué » → « À faire » et « Manquant » → « En retard » (fonction `libEtat`, le prof garde les mots de Classroom) ; boutons du haut 44 px (40 px sous 360 px), boutons principaux 48 px, logos de 58 px pour en garder 3 sur iPhone et Pixel, 2 à 320 px. **R (vitesse)** : `sw.js` sert d'abord la copie gardée des fichiers versionnés (`?v=`, une seule version gardée par fichier), la page elle-même reste « réseau d'abord » avec repli sur la copie après 4 s ; msal-browser chargé en `async` (`msalInit` l'attend jusqu'à 10 s) ; `serveur.js` accepte ce `async`. **S (accessibilité)** : titre principal sur chaque page, niveaux de titres réguliers, vert SNT `#357A26` (mode clair), jours passés et travaux faits de « Ma semaine » sans transparence, en-têtes de tableaux nommés, tutoiement dans Paramètres > Profil, « Mon téléphone est-il prêt ? » sur 2 lignes dans le menu, aide courte de Simulations sur téléphone, formules défilables atteignables au clavier. Tests : `test-site.js` 56 pages, `test-telephone.js` 109/109 (série `testsCinquieme`, 18 vérifications). Reste signalé par axe-core et accepté : éditeur plein écran des paramètres du cours hors de `main` ; contraste mesuré pendant l'animation d'entrée des cartes de Simulations (faux positif).
- **6e évaluation et lot T (11 novembre 2026, ?v=202611111930)** : notes avant correction prof 9, élève ordi 9,5, iPhone 9, Android 9 : objectif « au moins 9 partout » atteint, aucune régression (rapport https://claude.ai/artifact/RTqD7uF73PbkYwjVKwD3wr, fichier `rapports/evaluation-6-2026-11-11.html`). Lot T de finitions choisi par Jalal : **T1** logos du haut : `logosQuiTiennent` (33-evaluation5.js) mesure le cadre `.qi` + l'anneau vert de 2 px (`box-shadow`), plus seulement le lien ; ≤ 430 px, cadres de 56 px pour garder 3 logos entiers sur Pixel 7 ; **T2** Paramètres > Cours (`table.admcours`) : colonnes serrées (`width:1%`, `th` sans `min-width:130px`), colonne Actions visible à 1024 px, `.tablewrap{position:relative}` pour que les titres cachés `.vh` ne fassent plus déborder la page ; **T3** « Cours » de l'accueil en `h2.hcours` (un seul h1 par page), nom du cours dans l'aperçu de la bannière en `p.bnom`, `.settings` des paramètres du cours en `role="main"` ; **T4** tutoiement côté élève des réglages de notifications (`NOTIF_TU`, « Tes cours », « t'a mentionné ») ; **T5** menu « Apparence » dans l'écran (`.crrow>*{min-width:0}`), case de commentaire « Commenter… » sur téléphone (`petitEcran()`), titre d'un devoir à 1,45 rem sous 380 px (le « : » ne se retrouve plus seul) ; **T6** zones de toucher de 44 px sur téléphone sans changer la mise en page (`padding-block` + `margin-block` négatif) pour les liens des cartes de cours, « + 3 autres travaux », « Gérer », recherche des simulations, barre du bas en paysage ; **T7** contraste de la carte « Pointage » : faux positif (animation `carteIn`), rien changé ; **T8** cartes de cours de l'accueil : `.ccard .body{grid-template-columns:minmax(0,1fr)}`, le texte finit par « … » au lieu d'être coupé au bord. Tests : 56 pages, `test-telephone.js` 112/112 (3 vérifications « T » ajoutées à `testsCinquieme`). **Correctif du 11/11 (?v=202611111940)** : « Activation impossible : Edge Function returned a non-2xx status code » chez un élève : pp-push répondait 401 parce que `getUser` exige que la session du jeton existe encore (session fermée ailleurs, jeton encore valide). `activerPush` (29-push.js) renouvelle la connexion et réessaie une fois, puis dit en clair « ta connexion a expiré. Déconnecte-toi, reconnecte-toi, puis réessaie » (plus de message technique). La fonction pp-push n'a pas été changée.
