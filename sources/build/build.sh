#!/bin/sh
# assemble site/app.js à partir des morceaux du dossier build (09-evenements toujours en dernier)
cd "$(dirname "$0")" && B=build && cat $B/01-core.js $B/02-coque.js $B/03-classe.js $B/04-devoirs.js $B/05-editeurs.js $B/06-questionnaires.js $B/07-parametres.js $B/08-fenetres.js $B/1[0-9]*.js $B/2[0-9]*.js $B/09-evenements.js > site/app.js && node --check site/app.js && echo "app.js OK ($(wc -c < site/app.js) octets)"
