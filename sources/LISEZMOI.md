# Sources de PhysiquePro

Ce dossier est une **sauvegarde des fichiers de travail** du site. Le site publié ne l'utilise pas.

- `build/` : le code du site découpé en morceaux (`01-core.js` … `29-presence.js`, `09-evenements.js` toujours en dernier).
  `build.sh` les assemble dans `app.js` (à la racine du dépôt) puis vérifie la syntaxe avec `node --check`.
- `supabase/` : les scripts SQL de la base de données, dans l'ordre de leur installation (étapes 01 à 33).
  Les fichiers `29-test-intrusion.sql` et `30-test-fichiers.sql` sont des tests de sécurité : ils annulent tout à la fin et ne modifient rien.

Pour reconstruire `app.js` : copier `build/` et `build.sh` dans un dossier avec un sous-dossier `site/`, lancer `./build.sh`, puis publier `site/app.js` à la racine du dépôt.

Publication : GitHub Pages publie la branche `main` à chaque envoi ; Netlify publie la branche `netlify`, copiée depuis `main` chaque dimanche à 18 h UTC par `.github/workflows/netlify-dimanche.yml`.
