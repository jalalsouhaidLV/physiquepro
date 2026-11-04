# Sources de PhysiquePro

Ce dossier est une **sauvegarde des fichiers de travail** du site. Le site publié ne l'utilise pas.

- `build/` : le code du site découpé en morceaux (`01-core.js` … `29-presence.js`, `09-evenements.js` toujours en dernier).
  `build.sh` les assemble dans `app.js` (à la racine du dépôt) puis vérifie la syntaxe avec `node --check`.
- `supabase/` : les scripts SQL de la base de données, dans l'ordre de leur installation (étapes 01 à 35).
  Les fichiers `29-test-intrusion.sql` et `30-test-fichiers.sql` sont des tests de sécurité : ils annulent tout à la fin et ne modifient rien.
- `tests/` : les bouchons Playwright (faux client Supabase) et des exemples de scripts de test. Mode d'emploi : `tests/LISEZMOI-tests.md`.
- `FICHE-PHYSIQUEPRO.md` : la fiche complète du projet (adresses, construction, mise en ligne, choix de Jalal, sécurité, réglages externes).

Pour reconstruire `app.js` : depuis la racine du dépôt, lancer `./sources/build/build.sh` (ou `./build.sh` depuis `sources/build/`). Le script écrit directement `app.js` à la racine du dépôt ; si `node --check` trouve une erreur, `app.js` n'est pas modifié. Changer ensuite le numéro `?v=` dans `index.html` si `app.js` a changé.

Publication : GitHub Pages publie la branche `main` à chaque envoi ; Netlify publie la branche `netlify`, copiée depuis `main` chaque dimanche à 18 h UTC par `.github/workflows/netlify-dimanche.yml`.

Le dossier `sources/` est masqué sur Netlify par `_redirects` (`/sources/*` renvoie 404).
