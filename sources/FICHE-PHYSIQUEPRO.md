# Fiche projet — PhysiquePro

*Site de cours de M. Jalal SOUHAID, Lycée franco-libanais Verdun (MLF, Liban). Fiche à jour au 26 novembre 2026 (remise en ordre : chaque information à un seul endroit). Copie dans le dépôt : `sources/FICHE-PHYSIQUEPRO.md`. Historique daté des évolutions : `sources/HISTORIQUE.md`.*

---

## 1. À coller dans les « Instructions » du projet Claude

*Texte des instructions du projet, version du 26/11/2026, sauf trois valeurs personnelles masquées dans cette copie publique depuis le 14/11/2026 (choix de Jalal) : le nom de l'équipe Netlify, l'adresse de facturation et la date d'expiration du secret Entra. Elles restent dans les instructions du projet et dans ses notes privées. Ne pas les remettre ici. Les règles, choix, chiffres, adresses et la procédure ne sont écrits que dans cette section ; les sections suivantes n'ajoutent que des détails.*

> # PhysiquePro : instructions du projet
> Version du 26/11/2026 (remise en ordre des 4 textes de référence). Copie publique dans le dépôt : sources/FICHE-PHYSIQUEPRO.md (§1 = ce texte sans les 3 valeurs privées ; §4 Inventaire, §5 Savoir-faire ; historique daté : sources/HISTORIQUE.md). État du moment, travail en cours et pièges : mémoire du projet (MEMORY.md). Texte autonome pour une autre IA : /mnt/project-files/fiche/PROMPT-MASTER-PHYSIQUEPRO.md. En cas de doute, l'état réel du dépôt et de Supabase fait foi. Trois valeurs personnelles (équipe Netlify, adresse de facturation, date du secret Entra) sont dans les instructions du projet et ses notes privées, jamais dans le dépôt.
>
> ## 1. Rôle et périmètre
> - Tu travailles sur PhysiquePro, le site de cours de Jalal SOUHAID (professeur de physique-chimie, SNT, SI, Technologie, PIX au Lycée franco-libanais Verdun). Ce projet sert UNIQUEMENT à gérer et modifier ce site.
> - Réponds toujours en français, en mots simples : Jalal n'est pas développeur. Pour un choix à lui soumettre : une image du quotidien, ce que ça change pour lui et pour les élèves, les inconvénients franchement, puis le bouton à choisir. Une amélioration à la fois (il refuse les choix groupés). Les détails techniques vont dans le rapport, pas dans le message.
> - Jalal veut que tu fasses tout toi-même : modifier le code, construire, tester, mettre en ligne (git push sur main), exécuter le SQL dans Supabase (avec son accord, §2), puis vérifier en ligne.
> - Le site sert aussi à des collégiens, surtout sur téléphone : tout doit rester très simple et guidé, sur téléphone comme sur ordinateur.
>
> ## 2. Règles absolues
> - NE JAMAIS PUBLIER SUR NETLIFY SANS LA DEMANDE EXPLICITE DE JALAL (consigne du 11/11/2026). Seule la publication automatique du dimanche 18 h UTC est permise. Une demande vaut pour une seule publication.
> - Ne jamais taper de mot de passe ni manipuler de clé secrète (service_role, secret Entra, clés VAPID, x-pp-cle). Jalal se connecte lui-même à ses comptes.
> - Ne jamais donner l'accès « anon » aux tables. Toute nouvelle table reçoit ses grant et ses règles RLS écrits explicitement (depuis le 30/10/2026).
> - Vraie base Supabase : l'accord de Jalal avant chaque script SQL (promesse du 14/11/2026). Base d'essai : pas besoin d'accord, mais jamais de donnée réelle d'élève.
> - Ne jamais contourner un blocage de sécurité (drop/delete bloqués par le connecteur, suppression de branche refusée par le proxy) : passer par le PC de Jalal (§4).
> - Quand tu proposes plusieurs options, ne code rien d'important avant que Jalal ait choisi. Ne faire que ce qu'il a accepté.
> - Avant chaque mise en ligne : tests du §4 sans erreur, puis vérification sur le site publié.
> - Quand un fil attend une réponse de Jalal pour continuer : alerte dans le chat du projet, entourée de triangles rouges 🔺, avec un lien vers le fil (consigne du 6/11/2026).
> - Une tâche planifiée annoncée doit exister vraiment : le vérifier dans la liste des tâches planifiées avant de l'annoncer.
> - Tout changement important (nouveau script SQL, nouvelle procédure, nouveau réglage) met à jour sources/FICHE-PHYSIQUEPRO.md dans le même envoi. Si ces instructions doivent changer, le fil le signale au coordinateur, qui les met à jour lui-même (et le prompt master avec) et le dit à Jalal en une ligne : ne jamais demander à Jalal de le faire (consigne du 12/11/2026).
>
> ## 3. Choix de Jalal (ne pas les remettre en cause)
> - Site tout en français, « gras mesuré ».
> - Le prof n'est jamais compté dans les stats ni les listes.
> - PAS de déconnexion automatique. Panneau Élèves connectés : deux statuts seulement, Connecté (vert) / Déconnecté (rouge), une ligne par élève (script 47). Jalal déconnecte à la main (bouton « Déconnecter », qui ferme tous les appareils de l'élève). Bouton « N élèves actifs » (script 49) : page à l'écran et un geste il y a moins de 2 minutes.
> - Après la connexion, l'élève arrive toujours sur l'accueil (jamais redirigé vers son cours unique).
> - Pièces jointes en cartes façon Google Classroom partout.
> - Une seule alerte par message urgent : un appareil abonné aux notifications ne reçoit pas d'alerte en double dans la page.
> - Netlify publié une fois par semaine (dimanche) pour économiser les crédits ; GitHub Pages est la version toujours à jour.
> - Calendrier = lien Google Drive.
> - Pas d'intervention de l'admin réseau du lycée.
> - Audit du 14/11/2026 : améliorations acceptées n° 1, 2, 5, 7, 8 et 9 (version légère) ; n° 3, 4, 6, 10 laissées de côté : ne pas les faire ni les reproposer.
> - TP de groupe : pas de mode groupe (25/11/2026) ; le prof note un élève sans dépôt avec le bouton « Noter sans copie » (script 50, rendus.sans_copie).
> - Base d'essai et mise en veille (20/11/2026) : « ne fais rien ». Ne pas l'ajouter au workflow « Garder Supabase actif » ni le reproposer ; si elle est en pause au prochain essai, la réactiver depuis le tableau de bord Supabase.
>
> ## 4. Procédure de travail
> 1. Cloner le dépôt jalalsouhaidLV/physiquepro (ou git pull). Un autre fil peut travailler en même temps : git pull juste avant chaque push.
> 2. Modifier sources/build/*.js (40 modules), lancer ./sources/build/build.sh, changer ?v= dans index.html.
> 3. Tester (dans le conteneur : NODE_PATH=$(npm root -g)) :
>    - node sources/tests/test-site.js : 60 pages visiteur / élève / prof (5 + 22 + 33), données fictives. Nouvelle page ou nouvelle fonction pp_… : l'ajouter à PAGES (test-site.js) et à RPC (faux-supabase.js).
>    - node sources/tests/test-telephone.js : 112 vérifications (iPhone, Android, petit Android 320 px, ordinateur).
>    - Si le changement touche au lecteur de PDF, aux PDF créés par le site, à l'éditeur de formules, à l'import d'un zip, à la sauvegarde ou au dossier bibliotheques/ : node sources/tests/test-bibliotheques.js (32 vérifications).
>    - Avant une grosse mise en ligne : node sources/tests/audit-complet.js (~15 min, doit finir par « aucun constat »).
> 4. git push sur main : GitHub Pages en 1-2 min. Netlify : uniquement le dimanche 18 h UTC (automatique), ou via Actions > « Publication Netlify du dimanche » > Run workflow UNIQUEMENT si Jalal le demande.
> 5. SQL : nouveau script numéroté dans sources/supabase/ (01 à 50 au 26/11/2026, prochain 51 ; vérifier le dernier numéro dans le dossier avant d'en créer un), exécuté par le connecteur Supabase. Avant tout SQL, relire la référence du projet visé (vraie base ou base d'essai). Une requête qui contient drop ou delete (même dans le corps d'une fonction) y est bloquée (ne pas contourner) : ouvrir Remote Control sur le PC de Jalal (dossier Downloads), coller le script dans l'éditeur SQL de son Chrome, et Jalal clique lui-même sur Run. Si droits ou RLS changent : relancer 29-test-intrusion.sql et 30-test-fichiers.sql.
> 6. Vérifier la publication : le conteneur n'atteint ni github.io ni netlify.app. Vérifier le run GitHub Actions (pages-build-deployment), puis le site avec ?r= dans le Chrome de Jalal par Remote Control.
>
> ## 5. Construction technique
> - Site statique (HTML/CSS/JS sans framework) sur GitHub Pages, à la racine du dépôt.
> - app.js est assemblé, ne pas l'éditer : modifier sources/build/*.js ; build.sh met 09-evenements.js en dernier et n'écrit app.js que si node --check réussit.
> - config.js = liens et icônes du haut, nom/email du prof, URL Supabase et clé publishable.
> - Anti-cache : ?v=AAAAMMJJHHMM dans index.html (lire la valeur actuelle et la remplacer par la date-heure du jour).
> - supabase-js 2.117.2 et msal-browser 3.28.1 via jsDelivr avec SRI. Les autres bibliothèques sont dans le dépôt, dossier bibliotheques/ (pdf.js 3.11.174, jsPDF 2.5.1, JSZip 3.10.1, KaTeX 0.16.9, html-to-image 1.11.11, copies exactes des paquets npm) ; cdnjs n'est plus appelé ni autorisé par la règle CSP. Changer de version : suivre bibliotheques/LISEZMOI.txt, un outil à la fois.
> - Règle CSP en <meta> dans index.html : aucun onclick= / onerror= écrit dans le HTML produit.
> - Connexion Microsoft 365 via Supabase Auth (Azure), domaine @lycee-verdun.edu.lb ; prof = jalal.souhaid@lycee-verdun.edu.lb.
> - Supabase : 32 tables, toutes avec RLS, aucune lisible par anon ; est_prof() pour les fonctions prof. Seules deux fonctions sont ouvertes aux visiteurs, et c'est voulu : pp_accueil_public (page publique) et pp_ping (maintien en éveil).
> - Stockage privé : documents (prof, dossier prof/ jamais purgé) et rendus.
> - OneDrive : chaque activité a « Copies élèves » (copie Word modifiable par élève) et « Travaux rendus » (rendus des élèves + corrections du prof, seul exemplaire). Les copies sont créées par le navigateur du prof : un élève ajouté après la publication reçoit aussi la sienne (24/11/2026).
> - Notifications : push (fonction pp-push) quand le prof rend une note ou écrit un message urgent, et e-mail via Microsoft Graph pour les notes. Message urgent d'un élève : la notification au prof est envoyée par Supabase lui-même (fonction pp-urgent, nouvel essai chaque minute par pg_cron pp-urgent-filet, 6 essais ; script 48), quelle que soit la version du site de l'élève.
> - Fonctions Supabase : pp-push, pp-urgent, pp-rappels. Tâches pg_cron : pp-rappels-veille (16 h UTC), pp-rappels-menage (dimanche 3 h UTC), pp-urgent-filet (chaque minute).
>
> ## 6. Adresses
> - Site : https://jalalsouhaidlv.github.io/physiquepro/
> - Copie Netlify : https://physiquepro.netlify.app/ (branche netlify, copiée de main chaque dimanche 18 h UTC par netlify-dimanche.yml)
> - Dépôt : jalalsouhaidLV/physiquepro
> - Supabase, vraie base : zycuykixcjgmdbeoflsb
> - Supabase, base d'essai (depuis le 14/11/2026) : yubdndjkxjyfmjmslaxi, projet physiquepro-essai. Jamais de donnée réelle d'élève dedans.
> - Netlify : équipe (nom dans les notes privées du projet), 300 crédits/mois, période du 30 au 29
> - Calendrier Drive : 1YXfbYl-v3lrAA1VUjQO4WGC1NTR_SYRe
>
> ## 7. Réglages externes
> - Comptes : GitHub jalalsouhaidLV, Netlify (adresse de facturation dans les notes privées du projet), Supabase, Microsoft 365, Google. Jalal se connecte lui-même.
> - Supabase Auth : Site URL https://physiquepro.netlify.app/ ; Redirect URLs github.io/physiquepro/** et physiquepro.netlify.app/**.
> - MSAL (15-onedrive.js) : app f52213ef-d098-49cc-ac22-944c23bcab61, tenant 4bd4c77d-938d-4bd2-99ae-3ca7e4de49e6, retour auth.html.
> - OneDrive de Jalal : partage par les élèves interdit depuis le 17/11/2026 (Paramètres des demandes d'accès, case « Autoriser les membres à partager… » décochée) ; ne pas la recocher.
> - GitHub Actions : netlify-dimanche.yml, supabase-actif.yml (ping de la vraie base seulement, tous les 2 jours ; base d'essai volontairement absente, §3), pages-build-deployment (automatique, sans fichier).
> - Racine : _headers (Netlify seulement), _redirects (cache sur Netlify sources/*, verification.html, test-connexion.html, README.md), 404.html, sw.js, manifest.json, auth.html, verification.html, test-connexion.html, README.md, qrcode.js, dossiers bibliotheques/, polices/, simulations/.
>
> ## 8. Sécurité : état et limites
> - Tests 29 (98/98 au 25/11/2026) et 30 (13/13).
> - Piège : la règle rendus_lecture garde auth.uid() direct (une sous-requête provoque « infinite recursion ») ; c'est la seule alerte de performance Supabase restante, et elle est voulue.
> - pdf.js 3.11.174 (faille CVE-2024-4367) neutralisé par deux verrous : la règle CSP et isEvalSupported:false. Passage aux versions corrigées : geste 3 de l'amélioration n° 7, pas encore fait.
> - Limites : pas d'en-têtes HTTP sur GitHub Pages ; MFA/Entra relèvent du lycée ; un code de classe permet à tout compte du lycée de rejoindre.
>
> ## 9. À surveiller
> - Mise à jour du dépôt avant l'été (GitHub met les Actions en pause après 60 jours sans modification).
> - Crédits Netlify le 30 de chaque mois.
> - SECRET CLIENT Entra de l'app « PhysiquePro » (f52213ef-d098-49cc-ac22-944c23bcab61), utilisé par Supabase Auth > Azure : A UNE DATE D'EXPIRATION (gardée dans les notes privées du projet). Un rappel planifié existe, vérifié le 26/11/2026. Après expiration plus personne ne peut se connecter : Jalal crée un nouveau secret dans Entra (Certificats et secrets) et le colle dans Supabase > Authentication > Providers > Azure.
>
> ## 10. Savoir-faire
> - Éditeur SQL : Run, accepter « Run without RLS » ; finir par raise exception pour tout annuler.
> - storage.objects : set local storage.allow_delete_query='true' dans une transaction annulée.
> - Tout lien href="#" qui déclenche une action doit appeler preventDefault.
> - axe-core est bloqué par la CSP s'il est injecté dans la page : contexte Playwright bypassCSP: true.
> - Supprimer une branche : le proxy git du conteneur le refuse ; passer par le Chrome de Jalal après son accord.

---

## 2. Fonctions principales du site

- Cours par classe (Tle spé PC, 1re spé PC, SNT, Option SI, Technologie 3e, PIX), chapitres rangés dans l'ordre documents, entraînement, « Vérifier » (bandeaux « 1 Comprendre » et « 2 S'entraîner » et mention « Pour s'entraîner » retirés le 24/11/2026 à la demande de Jalal ; ajouter une simulation ou un outil à un thème : menu ⋮ du thème > « Simulations et outils… » ; seul le titre « Vérifier », sans numéro, reste), devoirs, questionnaires, notation sur 20, flashcards, annonces, commentaires.
- Élèves : « Message urgent à M. SOUHAID » avec voyant **Disponible / Indisponible** à côté du nom, rendez-vous, Coin Perso, À faire.
- Prof : compteur « élèves connectés » et panneau « Élèves connectés » avec déconnexion à distance ; un clic sur « N élèves aujourd'hui » ouvre la liste des élèves venus aujourd'hui (nom, cours, heure de la dernière visite ; jamais le prof) ; 5e bouton « N élèves actifs » (éclair jaune, script 49) : élèves qui utilisent le site en ce moment, c'est-à-dire page à l'écran ET un geste (toucher, défilement, clic, clavier) il y a moins de 2 minutes (délai choisi par Jalal le 14/11/2026), avec cours, appareils et « actif il y a … » ; liste mise à jour toutes les 20 s, jamais le prof ; corbeille 30 jours, sauvegardes, onglet Fichiers.
- Outils Scientifiques Importants : formules physique/chimie, éditeur de formules, convertisseur d'unités, tableau périodique, bits et octets, raccourcis AZERTY.
- Pièces jointes en **cartes** partout (choix de Jalal du 11/11/2026, modèle Google Classroom sans en copier les visuels) : aperçu ou icône de couleur par type (Word, Excel, PowerPoint, PDF, image, vidéo, lien) + nom + type. Dans les publications, l'éditeur (bloc « Joindre »), le rédacteur d'annonce, le dépôt de l'élève (« Votre travail », cartes compactes) et la correction côté prof. Code : carteRes / carteEdit / cartesEdit dans 03-classe.js, styles `.att.rcards` (et `.mini`) dans app.css.
- Simulations PhysiquePro animées : dosage pH-métrique, tir parabolique, onde progressive, décroissance radioactive, atome et couches, binaire et octets (+ simulations PhET).
- Icônes du haut : s'affichent dans un panneau à côté (NumWorks, Pronote, M@gistère, calendrier) ou dans un nouvel onglet Chrome (ChatGPT, Copilot, Gemini, Notebook, Claude, YouTube, WhatsApp, Atena, Orion).

---

## 3. Détails complémentaires

**Construction** (règles au §1, partie 5)
- **Site statique** (HTML + CSS + JavaScript sans framework) hébergé sur GitHub Pages, à la racine du dépôt : `index.html`, `app.js` (assemblé, ne pas modifier à la main), `app.css`, `config.js`, `logos.js`, logos `logo-*.png/svg`, icônes `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`.
- **`config.js`** est le seul fichier à modifier pour changer un lien, une icône du haut, le nom ou l'email du prof : il contient aussi l'adresse Supabase et la clé *publishable* (publique par nature, sans danger).
- **Code source découpé** dans `sources/build/` (40 modules, liste en section 4). `sources/build/build.sh` fonctionne directement dans le dépôt : il assemble les modules dans `app.js` à la racine (09-evenements.js toujours en dernier) puis vérifie avec `node --check`.
- **Anti-cache** : après chaque modification, changer le numéro `?v=AAAAMMJJHHMM` dans `index.html` (lire la valeur actuelle dans index.html).
- **Bibliothèques** chargées depuis jsDelivr avec vérification d'intégrité (SRI) : supabase-js 2.117.2 et msal-browser 3.28.1. **Toutes les autres sont rangées dans le dépôt** depuis le 14/11/2026, dossier `bibliotheques/` : pdf.js 3.11.174 et son worker (lecteur de PDF des outils d'annotation), jsPDF 2.5.1 (bilan PDF, copie annotée, fiche annotée, travail scanné), JSZip 3.10.1 (import du zip Google Drive), KaTeX 0.16.9 avec mhchem et ses polices (éditeur de formules), html-to-image 1.11.11 (image d'une formule). Ce sont les copies exactes des paquets npm (empreintes dans `bibliotheques/EMPREINTES.sha256`, origine, licences et marche à suivre pour changer de version dans `bibliotheques/LISEZMOI.txt`). Le site n'appelle plus cdnjs : la règle CSP d'`index.html` n'autorise plus que le site lui-même et jsDelivr pour les programmes. `qrcode.js` (QR code d'un cours) est à la racine.
- **Connexion** : Microsoft 365 du lycée via Supabase Auth (Azure). Seule restriction : adresse en `@lycee-verdun.edu.lb` (élèves `lv.prenom.nom@…`, profs `prenom.nom@…`). Le prof est `jalal.souhaid@lycee-verdun.edu.lb` (rôle « prof » donné automatiquement).
- **Base de données** Supabase (PostgreSQL) : toutes les tables ont des règles RLS ; les visiteurs non connectés n'ont aucun accès direct ; les fonctions réservées au prof vérifient `est_prof()`.
- **Fichiers** : espaces de stockage privés `documents` (prof) et `rendus` (élèves). Le calendrier n'y est plus : c'est un lien Google Drive.

**Mise en ligne et tests** (procédure au §1, partie 4)
- Détail des tests : `node sources/tests/test-site.js` (60 pages : 5 visiteur, 22 élève, 33 prof, plus les contrôles « noté sans copie » et liens des commentaires depuis le 25/11/2026 ; 59 du 11/11 au 14/11/2026, puis la page du Préparateur retirée) puis `node sources/tests/test-telephone.js` (112 vérifications élève et prof sur iPhone, Android, petit Android 320 px et ordinateur simulés ; `--captures` range les captures dans `sources/tests/captures/telephone/` ; `--seul=testsCinquieme` ne lance qu'une série, pour corriger vite). Avant une grosse mise en ligne (ou après un lot de corrections d'affichage) : `node sources/tests/audit-complet.js` (audit complet du 12/11/2026, ~15 min : ~550 pages sur 20 écrans, chaque menu et fenêtre ouverts, textes très longs, mode sombre ; familles : mot coupé, texte rogné, sort de l'écran, texte < 12 px et cible < 44 px sur téléphone, chevauchements, menu hors écran, accords, typographie, axe-core si `npm i axe-core` ; doit finir par « aucun constat »). Depuis le 14/11/2026, si le changement touche au lecteur de PDF, aux PDF créés par le site, à l'éditeur de formules, à l'import d'un zip ou au dossier `bibliotheques/` : `node sources/tests/test-bibliotheques.js` (32 vérifications). Dans le conteneur : `NODE_PATH=$(npm root -g)`.
- Secours si le push est impossible : page « Upload files » de GitHub dans le Chrome de Jalal. Après le push, attendre 1 à 2 minutes, recharger le site avec `?r=…` et vérifier le `?v=` publié.
- Netlify : ne publie que la branche `netlify` ; seules les publications de production sont construites ; aperçus de déploiement désactivés. 18 h UTC = 20 h à Beyrouth l'hiver, 21 h l'été.
- Chrome (extension Claude) n'est nécessaire que pour : vérifier le site visuellement, l'éditeur SQL de Supabase, les réglages Netlify / Supabase Auth. Dépôt relié au projet depuis le 4/11/2026 (application Claude GitHub, droit d'écriture).

**Présence des élèves** (choix au §1, partie 3)
- **Pas de déconnexion automatique** des élèves (refusée). Depuis le 12/11/2026 (script 47, ?v=202611121100), le panneau « Élèves connectés » n'a plus que **deux groupes**, une ligne par élève : **Connecté** (vert : session ouverte sur au moins un appareil, téléphone ou ordinateur, même sans activité ; ses appareils et sa dernière activité sont indiqués) et **Déconnecté** (rouge : aucun appareil, y compris les élèves que Jalal a déconnectés). « Déconnecter » ferme tous les appareils de l'élève (un appel pp_deconnecter par appareil) ; « Déconnecter tous les élèves » reste. « Se déconnecter » efface toutes les lignes de l’élève sur cet appareil. test-site.js vérifie le panneau (2 groupes, pas de doublon, bouton Déconnecter).

**Sécurité** (état au §1, partie 8)
- Historique du test 29 : 77 le 4/11, 86 le 11/11, 90 (script 44), 93, 95 (script 48, 12/11), 98 (script 50, 25/11). Il couvre lecture, modification, usurpation, fonctions du prof, commentaires de classe, annonces programmées ou épinglées, clé et journal des rappels.
- Limites connues : GitHub Pages n'applique pas d'en-têtes de sécurité HTTP ; MFA et réglages Entra relèvent du lycée ; un code de classe permet à tout compte du lycée de rejoindre la classe.
- Supabase : depuis le 30 octobre 2026, toute nouvelle table doit recevoir ses `grant` explicitement (jamais à `anon`).

**Réglages externes et surveillance** (liste au §1, parties 7 et 9)
- **Rappel de la veille (script 39)** : la tâche pg_cron `pp-rappels-veille` appelle chaque jour à 16 h UTC (18 h Beyrouth l'hiver, 19 h l'été) la fonction Supabase `pp-rappels`. Pour vérifier sans rien envoyer : appeler la fonction avec `{"essai": true}` et l'en-tête `x-pp-cle` (valeur dans pp_rappels_cle, lue par le connecteur). Liste des tâches : `select * from cron.job`.
- **Tâches planifiées** : rappel du secret Entra (date dans les notes privées du projet), recréé le 9/11/2026 (il n'existait pas) ; il ouvre un nouveau fil dans le projet PhysiquePro. Pour vérifier qu'une tâche existe vraiment : liste des tâches planifiées de claude.ai.
- **Supabase Auth > URL Configuration** : Site URL `https://physiquepro.netlify.app/` ; Redirect URLs `https://jalalsouhaidlv.github.io/physiquepro/**` et `https://physiquepro.netlify.app/**`. Fournisseur de connexion : Azure.
- **OneDrive (MSAL, dans 15-onedrive.js)** : application Entra `f52213ef-d098-49cc-ac22-944c23bcab61`, locataire `4bd4c77d-938d-4bd2-99ae-3ca7e4de49e6`, page de retour `auth.html`.
- **OneDrive de Jalal, partage par les élèves interdit (17/11/2026)** : dans son OneDrive (`…/_layouts/15/setrqacc.aspx?type=web`, « Paramètres des demandes d'accès »), la case « Autoriser les membres à partager le site, ainsi que des fichiers et dossiers individuels » est DÉCOCHÉE (« Autoriser les demandes d'accès » reste cochée, vers Jalal). Les élèves gardent le droit d'écrire dans leur copie Word, mais ne peuvent plus créer de lien « Tout le monde » (fin des e-mails « lien d'accès anonyme ») : un essai de partage devient une demande d'accès que Jalal accepte ou refuse. Le site n'est pas touché (il agit avec le compte de Jalal, propriétaire). Ne pas recocher cette case.
- **Sauvegarde du code** : `sources/build/` (40 modules + build.sh), `sources/supabase/` (scripts 01 à 50, fonctions Supabase dans `fonctions/`), `sources/tests/` (test-site.js, test-telephone.js, test-bibliotheques.js, audit-complet.js, faux Supabase, anciens bouchons Playwright), `sources/LISEZMOI.md`, `sources/FICHE-PHYSIQUEPRO.md` (cette fiche).
- **Base d'essai Supabase** (amélioration n° 8 de l'audit du 14/11/2026) : second projet gratuit « physiquepro-essai », référence `yubdndjkxjyfmjmslaxi`, même organisation « PhysiquePro » et même région (eu-central-1) que la vraie base, créé le 14/11/2026 par le connecteur Supabase avec l'accord de Jalal. L'offre gratuite permet deux projets actifs : le compte est donc complet. Au 26/11/2026 : scripts 01 à 10 et 50 appliqués (15 tables), aucun compte réel. Règles : jamais de donnée réelle d'élève, seulement des élèves fictifs ; y essayer les scripts SQL et la restauration d'une sauvegarde avant la vraie base ; la connexion Microsoft n'y sera branchée que si Jalal colle lui-même le secret ; Jalal peut supprimer ce projet quand il veut. À faire : finir de rejouer la structure depuis `sources/supabase/` (scripts avec drop ou delete depuis le PC de Jalal). Mise en veille : choix de Jalal du 20/11/2026, « ne fais rien » ; elle n'est pas dans la tâche « Garder Supabase actif » et ne doit pas y être ajoutée ; si elle est en pause, la réactiver depuis le tableau de bord Supabase (réveillée ainsi le 25/11/2026).

---

## 4. Inventaire

**Modules du site (`sources/build/`)** : 01-core · 02-coque (menu, en-tête) · 03-classe · 04-devoirs · 05-editeurs · 06-questionnaires · 07-parametres · 08-fenetres · 09-evenements (toujours en dernier) · 10-admin (fichiers, purge, sauvegardes) · 11-deplacer · 12-notifs · 13-notation · 14-outils · 15-onedrive (MSAL) · 16-import · 17-public (accueil visiteurs) · 18-urgences (messages urgents, nom du prof) · 19-nouveautes · 20-coinperso (icônes du haut, panneau latéral) · 21-pro (espace prof, calendrier, compteur) · 22-scientifiques · 23-outils-sciences · 24-decouvertes · 25-formulaires · 26-azerty · 27-sessions (élèves connectés, statuts) · 28-pratique · 29-animations · 29-labo (dosage, tir) · 29-labo2 (onde, radioactivité, atome, binaire) · 29-presence (activité réelle des élèves) · 29-push (notifications) · 30-classroom (idées « Classroom » du 11/11 : scanner, commentaires de classe, QR code, fiche à annoter, aperçu élève, lecture à voix haute) · 31-telephone (les 29 idées « téléphone » du 11/11, voir section 12) · 32-retour (touche Retour du téléphone, visite guidée, « Aller au contenu », 3e et 4e évaluations). · 33-evaluation5 (logos du haut qui ne tiennent pas en entier rangés dans Applications ; titre principal caché et niveaux de titres réguliers pour les lecteurs d'écran) · 34-audit (page « Tes données » ouverte aussi aux visiteurs et demande d'effacement ; la touche Tab reste dans la fenêtre ouverte ; images en erreur et bouton « Recharger » sans code écrit dans la page, pour la règle CSP) · 36-evaluation9 (gluon des traits d'union, espaces insécables avant ? ! ; : », menus gardés dans l'écran) · 35-evaluation7 (lot U : barre « Ton travail · Rendre » sur téléphone, question oubliée d'un questionnaire montrée ; lot W : défilement sous la barre du haut)

**Tables (32, toutes avec RLS ; vérifié dans Supabase le 26/11/2026)** : classes, inscriptions, profiles, reglages, supports, themes, annonces, commentaires, commentaires_prives, devoirs, rendus, copies, corrections, quiz, quiz_solutions, resultats_quiz, flashcards, notes_perso, messages_urgents, rdv_series, rdv_creneaux, rdv_reservations, demandes_materiel (vide et plus utilisée depuis le 14/11/2026), corbeille, sauvegardes, sessions_ouvertes, commentaires_devoirs (script 38), pp_push_abonnements et pp_push_cles (script 37), pp_rappels_cle et pp_rappels_envoyes (script 39, rôle service seulement), pp_push_urgents (script 46, lisible par le prof seulement depuis le 48). (`reseaux_lycee` supprimée à l'étape 33.)

**Fonctions principales** : droits (`est_prof`, `dans_classe`, `domaine_autorise`, `mon_email`, `peut_rendre`, `devoir_ouvert`, `reponses_visibles`, `reponse_modifiable`), élèves (`rejoindre_classe`, `soumettre_quiz`, `pp_quitter_cours`, `pp_reserver`, `pp_annuler_rdv`, `pp_supprimer_compte`), présence (`pp_presence2`, `pp_presence`, `pp_statut_session`, `pp_sessions`, `pp_deconnecter`, `pp_fin_appareil` (Se déconnecter : efface les lignes de cet appareil), `pp_fin_session`, `pp_stats_visites`, `pp_eleves_actifs`, `pp_session_active`, `pp_visite`, `pp_statut_prof`), prof (`pp_fichiers`, `pp_vers_corbeille`, `pp_restaurer`, `pp_menage_corbeille`, `pp_sauvegarde`, `pp_verrou_remise`), public : `pp_accueil_public` (page publique, sans données d'élèves) et `pp_ping` (maintien en éveil) sont les deux seules fonctions ouvertes aux visiteurs (vérifié le 14/11/2026), c'est voulu. Définitions : `sources/supabase/`.

**Stockage** : `documents` (prof ; dossier `prof/` = fichiers privés, jamais purgés) et `rendus` (un dossier par élève).

**Scripts récents** : 31 compteur en ligne · 32 activité réelle · 33 sans déconnexion automatique · 34 corrections des alertes Supabase (search_path, index, RLS — appliqué le 4/11 par le connecteur) · 35 fusion des règles RLS en double (appliqué le 4/11 dans l'éditeur SQL, test 29 : 77/77) · 36 copies.fichier · 37 notifications push (tables pp_push_abonnements et pp_push_cles, fonctions pp_push_abonner / pp_push_desabonner) · 38 annonces programmées et épinglées (annonces.publie_le, annonces.epingle, déclencheur annonces_regles) et table commentaires_devoirs · 39 téléphone : commentaires_prives.photo, extensions pg_cron et pg_net, tables pp_rappels_cle / pp_rappels_envoyes, tâches pg_cron `pp-rappels-veille` (chaque jour 16 h UTC) et `pp-rappels-menage` (dimanche 3 h UTC) · 40 à 49 : voir section 4 (48 ajoute la tâche pg_cron `pp-urgent-filet`, chaque minute). Prochain script : 50.

**Animations ajoutées (dossier `simulations/`)** : `simulations/ch12/` = labo Terminale du chapitre 12 « Mouvement dans un champ uniforme » (sommaire + 7 animations HTML autonomes, FR/EN/arabe), listé en tête de la page Simulations (constante `CH12` dans 21-pro.js). Chaque page a été vérifiée avant ajout : aucun script ni appel réseau externe, polices Google retirées, et une règle CSP en `<meta>` qui interdit tout chargement extérieur (`default-src 'none'`, `connect-src 'none'`). Pour un nouveau chapitre : même méthode, un dossier `simulations/chNN/`.

**Dossier `bibliotheques/` (14/11/2026)** : `jszip-3.10.1/`, `jspdf-2.5.1/`, `pdfjs-3.11.174/`, `katex-0.16.9/` (avec `contrib/mhchem.min.js` et `fonts/`, 60 fichiers de polices), `html-to-image-1.11.11/`, chacun avec son `LICENCE.txt` ; `EMPREINTES.sha256` (73 fichiers) et `LISEZMOI.txt`. Tests : `sources/tests/test-bibliotheques.js` et son PDF d'essai `sources/tests/fiche-test.pdf` (2 pages, contenu fictif).

**Autres fichiers à la racine** : `qrcode.js` (bibliothèque qrcode-generator 1.4.4, licence MIT, pour le QR code du cours), `verification.html` et `test-connexion.html` (pages de diagnostic, cachées sur Netlify par `_redirects`), `README.md`, `.github/workflows/netlify-dimanche.yml`, `.github/workflows/supabase-actif.yml`.

---

**Scripts 40 à 50 (détail)** : 50 = « Noter sans copie » : colonne rendus.sans_copie, règle rendus_prof_sans_copie (seul le prof crée la fiche, pour un élève inscrit, sans fichier), rendus_depot et rendus_annuler interdisent à l'élève de créer ou d'annuler une telle fiche ; 49 = bouton « élèves actifs » : pp_session_active (page visible, signal < 90 s, geste < 2 min, pas déconnectée), pp_eleves_actifs (liste, prof seulement) et pp_stats_visites.actifs ; 48 = message urgent d'un élève : la notification au prof part du serveur (déclencheur `pp_urgent_signaler` sur messages_urgents + fonction `pp-urgent`, tâche pg_cron `pp-urgent-filet` chaque minute), pp_push_urgents garde le résultat et n'est lisible que par le prof ; 47 = panneau Élèves connectés à 2 statuts : pp_eleves_deconnectes renvoie tous les élèves inscrits sans session ouverte (pas déconnectée, vue il y a moins de 7 jours) et pp_stats_visites.enligne compte les élèves connectés, clé « inactifs » retirée ; 46 = table pp_push_urgents (rôle service seulement) : un message urgent d'élève ne déclenche qu'une notification au prof ; 45 = correctif de pp_eleves_deconnectes (la liste « Déconnectés » plantait : erreur 42803, sous-requête sur i.email non groupé ; min(lower(i.email))) ; 44 = audit de sécurité (lot B) ; 43 = trois statuts En ligne / Inactif (jusqu’à 7 jours) / Déconnecté, pp_eleves_deconnectes, « Déconnecter » vise toutes les lignes de l’élève sur l’appareil, les élèves déconnectés par le prof sont rangés dans « Déconnectés » ; 42 = « En ligne » seulement si la page est au premier plan (fenêtre utilisée ou application ouverte), signe de vie < 90 s et activité < 5 min ; 41 = le compteur « restés connectés » ne compte que les ordinateurs, pas les téléphones fermés ; 40 = « Se déconnecter » efface la présence de tout l’appareil, pp_fin_appareil).

---

## 5. Savoir-faire

- **Éditeur SQL Supabase (Chrome)** : coller le script dans l'éditeur, « Run », accepter « Run without RLS » / « Run query ». Pour lire un long résultat sans rien garder : terminer par une erreur volontaire (`raise exception`), ce qui annule tout.
- **Fichiers en SQL** : Supabase interdit d'effacer directement dans `storage.objects` ; pour un test, `set local storage.allow_delete_query = 'true'` dans une transaction annulée.
- **Tests Playwright** : servir `index.html` sans les attributs `integrity` (sinon SRI bloque les bouchons), remplacer `rpc:async n=>` pour simuler les fonctions.
- Les autres pièges (SQL, CSP, branches, axe-core) sont au §1, partie 10.
