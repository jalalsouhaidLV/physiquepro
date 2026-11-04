#!/bin/sh
# Assemble app.js (à la racine du dépôt) à partir des morceaux de ce dossier.
# 09-evenements.js toujours en dernier. Utilisation : ./build.sh (depuis n'importe où).
set -e
B="$(cd "$(dirname "$0")" && pwd)"
RACINE="$(cd "$B/../.." && pwd)"
TMP="$RACINE/app.tmp.js"
cat "$B"/01-core.js "$B"/02-coque.js "$B"/03-classe.js "$B"/04-devoirs.js "$B"/05-editeurs.js \
    "$B"/06-questionnaires.js "$B"/07-parametres.js "$B"/08-fenetres.js \
    "$B"/1[0-9]*.js "$B"/2[0-9]*.js "$B"/09-evenements.js > "$TMP"
if node --check "$TMP"; then
  mv "$TMP" "$RACINE/app.js"
  echo "app.js OK ($(wc -c < "$RACINE/app.js") octets)"
else
  rm -f "$TMP"
  echo "Erreur de syntaxe : app.js n'a pas été modifié." >&2
  exit 1
fi
