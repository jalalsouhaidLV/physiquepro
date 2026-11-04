# Tests Playwright de PhysiquePro

**Pour tester le site aujourd'hui, utiliser `test-site.js`** (avec `faux-supabase.js`, `faux-msal.js` et `serveur.js`) : il charge le site en visiteur, élève et professeur et échoue à la moindre erreur. Mode d'emploi dans `sources/LISEZMOI.md`. Les fichiers ci-dessous sont les bouchons d'origine de l'ancien chat, gardés comme modèles.

Le site est testé hors ligne avec Playwright (Chromium) : la vraie bibliothèque Supabase est remplacée par un **bouchon** qui simule la base avec des élèves fictifs.

- `W_stubE.js` : bouchon « élève » (Sara K, Lina H — comptes fictifs).
- `W_stub2.js` : bouchon « professeur ».
- `stubP.js` : bouchon « visiteur non connecté ».
- `FC_stubE.js` : bouchon élève avec flashcards.
- `an1.js`, `an2.js`, `pres.js` : exemples de scripts de test (simulations, animations, présence).

Principe d'un test :
1. intercepter `cdn.jsdelivr.net` et renvoyer le bouchon à la place de supabase-js ;
2. servir `index.html` **sans les attributs `integrity`** (sinon la vérification SRI bloque le bouchon) ;
3. ouvrir `file:///…/site/index.html#/…`, cliquer, lire le DOM, prendre des captures ;
4. vérifier qu'aucune erreur `pageerror` n'apparaît.

Pour simuler une réponse précise d'une fonction (RPC), remplacer `rpc:async n=>` dans le bouchon par une fonction qui renvoie la réponse voulue (voir `pres.js`).
Les chemins (`/home/claude/github/site/…`, `/opt/pw-browsers/chromium`) sont ceux de l'espace de travail de Claude : à adapter.

**Attention : `pres.js` est un exemple historique.** Il teste un ancien avertissement d'inactivité avec déconnexion automatique, refusé par Jalal et retiré du site (seuls les statuts En ligne / Inactif existent). Il sert seulement de modèle pour simuler une RPC et un appareil ; il ne passera pas sur le site actuel.
