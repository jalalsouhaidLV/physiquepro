# Sources de PhysiquePro

Ce dossier est une **sauvegarde des fichiers de travail** du site. Le site publié ne l'utilise pas.

- `build/` : le code du site découpé en morceaux (`01-core.js` … `29-presence.js`, `09-evenements.js` toujours en dernier).
  `build.sh` les assemble dans `app.js` (à la racine du dépôt) puis vérifie la syntaxe avec `node --check`.
- `supabase/` : les scripts SQL de la base de données, dans l'ordre de leur installation (étapes 01 à 35).
  Les fichiers `29-test-intrusion.sql` et `30-test-fichiers.sql` sont des tests de sécurité : ils annulent tout à la fin et ne modifient rien.
- `tests/` : le test automatique du site (`test-site.js` + `faux-supabase.js`, prêt à lancer, voir plus bas), et les bouchons d'origine de l'ancien chat avec leurs exemples (`tests/LISEZMOI-tests.md`).
- `FICHE-PHYSIQUEPRO.md` : la fiche complète du projet (adresses, construction, mise en ligne, choix de Jalal, sécurité, réglages externes).

Pour reconstruire `app.js` : depuis la racine du dépôt, lancer `./sources/build/build.sh` (ou `./build.sh` depuis `sources/build/`). Le script écrit directement `app.js` à la racine du dépôt ; si `node --check` trouve une erreur, `app.js` n'est pas modifié. Changer ensuite le numéro `?v=` dans `index.html` si `app.js` a changé.

Publication : GitHub Pages publie la branche `main` à chaque envoi ; Netlify publie la branche `netlify`, copiée depuis `main` chaque dimanche à 18 h UTC par `.github/workflows/netlify-dimanche.yml`.

Le dossier `sources/` est masqué sur Netlify par `_redirects` (`/sources/*` renvoie 404).

## Tester le site avant une mise en ligne (`tests/test-site.js`)

Le test ouvre le site dans Chrome (sans fenêtre) en **visiteur**, en **élève** puis en **professeur**, parcourt les pages principales (accueil, cours, devoirs, questionnaire, À faire, agenda, outils, simulations, administration…) et **échoue** s'il voit une erreur dans la console, une erreur JavaScript, un fichier introuvable ou le message « Impossible de charger… ».

Il ne touche jamais à la vraie base : `faux-supabase.js` remplace supabase-js et garde des données **fictives** en mémoire (deux cours, trois devoirs, un questionnaire, des comptes « Élève Test » et « Professeur Test »). Aucune clé, aucun mot de passe.

- `faux-supabase.js` : le faux client Supabase (tables, fonctions `pp_…` simulées, stockage, connexion).
- `faux-msal.js` : faux OneDrive (MSAL), aucune connexion Microsoft.
- `serveur.js` : petit serveur local ; il sert une **copie d'index.html** transformée à la volée (attributs `integrity` retirés, supabase-js et msal-browser remplacés par les deux bouchons). Le vrai `index.html` n'est pas modifié, donc la copie suit toujours le bon `?v=`.
- `test-site.js` : le test Playwright.

Première fois (Node.js installé), dans `sources/tests/` :

    npm install
    npx playwright install chromium

Ensuite, depuis `sources/tests/` : `npm test` (ou, depuis la racine du dépôt : `node sources/tests/test-site.js`).
Le résultat affiche `OK` ou `ÉCHEC` pour chaque rôle, avec la liste des erreurs ; le code de sortie vaut 1 en cas d'erreur.
Options : `--voir` (navigateur visible), `--captures` (une capture par page dans `sources/tests/captures/`).

Pour regarder le site avec les fausses données : `npm run serveur`, puis ouvrir http://localhost:8123/?role=eleve (ou `?role=prof`, `?role=visiteur`).

Quand une nouvelle page ou une nouvelle fonction `pp_…` est ajoutée au site : ajouter la page à la liste `PAGES` de `test-site.js` et la fonction à `RPC` dans `faux-supabase.js`. Le test signale ce qui manque au bouchon par la ligne « à compléter dans faux-supabase.js ».
