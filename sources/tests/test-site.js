/* =====================================================================
   PhysiquePro · test automatique du site (Playwright)
   ---------------------------------------------------------------------
   Charge le site avec le faux Supabase, en visiteur, en élève et en
   professeur, ouvre les pages principales et ÉCHOUE (code de sortie 1)
   si une erreur apparaît :
     - erreur dans la console du navigateur ;
     - erreur JavaScript non attrapée ;
     - fichier du site introuvable (404) ;
     - message « Impossible de charger … » affiché dans la page ;
     - requête qui tenterait de joindre Supabase.

   Lancer depuis la racine du dépôt :
     node sources/tests/test-site.js
   Options :
     --voir        ouvre un vrai navigateur visible
     --captures    enregistre une capture de chaque page dans sources/tests/captures/
   ===================================================================== */
"use strict";
const path = require("path"), fs = require("fs");
const { demarrer } = require("./serveur");

let chromium;
try { ({ chromium } = require("playwright")); }
catch (_) { console.error("Playwright n'est pas installé. Dans sources/tests : npm install, puis npx playwright install chromium"); process.exit(2); }

const VOIR = process.argv.includes("--voir"), CAPTURES = process.argv.includes("--captures");
const DOSSIER_CAPTURES = path.join(__dirname, "captures");

/* pages ouvertes pour chaque rôle (adresse après le #) */
const PAGES = {
  visiteur: ["/accueil", "/outils", "/simulations", "/physique"],
  eleve: ["/accueil", "/classe/tle", "/classe/tle/flux", "/classe/tle/travaux", "/classe/tle/personnes", "/classe/tle/notes", "/classe/snt",
    "/devoir/1", "/devoir/2", "/devoir/3", "/quiz/1", "/todo", "/agenda", "/semaine", "/revisions", "/outils", "/simulations", "/physique",
    "/rendezvous", "/admin/profil"],
  prof: ["/accueil", "/classe/tle", "/classe/tle/flux", "/classe/tle/travaux", "/classe/tle/personnes", "/classe/tle/notes", "/classe/tle/corriger",
    "/classe/tle/parametres", "/classe/snt", "/devoir/1", "/devoir/2", "/quiz/1", "/todo", "/agenda", "/semaine", "/revisions", "/programmes",
    "/corbeille", "/suivi", "/urgences", "/preparateur", "/rendezvous", "/outils", "/simulations", "/physique",
    "/admin/profil", "/admin/site", "/admin/cours", "/admin/eleves", "/admin/fichiers", "/admin/import", "/admin/sauvegarde"]
};
/* ce que la page doit montrer pour être considérée comme chargée */
const PRET = "#app > :not(.loading)";

async function testerRole(navigateur, base, role) {
  const erreurs = [], note = m => erreurs.push(m);
  const contexte = await navigateur.newContext({ serviceWorkers: "block", viewport: { width: 1280, height: 860 }, locale: "fr-FR" });
  await contexte.addInitScript(r => { window.__PP_ROLE = r; }, role);
  const page = await contexte.newPage();

  /* rien ne sort de l'ordinateur : Supabase est interdit, le reste (polices, images externes) reçoit une réponse vide */
  await page.route("**/*", route => {
    const u = new URL(route.request().url());
    if (u.hostname === "127.0.0.1" || u.hostname === "localhost" || u.protocol === "data:" || u.protocol === "blob:") return route.continue();
    if (/supabase\.(co|in)$/.test(u.hostname)) { note("requête vers Supabase (le bouchon n'est pas utilisé) : " + u.href); return route.abort(); }
    const css = /fonts\.googleapis\.com/.test(u.hostname);
    return route.fulfill({ status: 200, contentType: css ? "text/css" : "text/plain", body: "" });
  });
  page.on("console", m => { if (m.type() === "error") note("console : " + m.text() + (m.location() && m.location().url ? " (" + m.location().url + ":" + m.location().lineNumber + ")" : "")); });
  page.on("pageerror", e => note("erreur JavaScript : " + (e.stack || e.message || e)));
  page.on("response", r => { if (r.status() >= 400 && new URL(r.url()).hostname === "127.0.0.1") note("fichier introuvable (" + r.status() + ") : " + r.url()); });
  page.on("dialog", d => d.dismiss().catch(() => {}));

  await page.goto(base + "/#/accueil", { waitUntil: "load" });
  await page.waitForSelector(PRET, { timeout: 15000 }).catch(() => note("la page d'accueil ne s'affiche pas"));
  const roleVu = await page.evaluate(() => window.__PP_BOUCHON && window.__PP_BOUCHON.role);
  if (roleVu !== role) note("le faux Supabase n'est pas chargé (rôle vu : " + roleVu + ")");

  for (const p of PAGES[role]) {
    const avant = erreurs.length;
    await page.evaluate(h => { location.hash = h; }, "#" + p);
    await page.waitForTimeout(700);
    await page.waitForSelector(PRET, { timeout: 8000 }).catch(() => note(p + " : la page ne s'affiche pas"));
    const texte = await page.evaluate(() => { const z = document.querySelector("#app"); return z ? z.innerText : ""; });
    const pb = texte.match(/Impossible de charger[^\n]*(\n[^\n]*)?/);
    if (pb) note(p + " : la page affiche « " + pb[0].replace(/\n/g, " ").trim() + " »");
    if (!texte.trim()) note(p + " : la page est vide");
    if (CAPTURES) { fs.mkdirSync(DOSSIER_CAPTURES, { recursive: true }); await page.screenshot({ path: path.join(DOSSIER_CAPTURES, role + p.replace(/\//g, "_") + ".png"), fullPage: false }); }
    for (let i = avant; i < erreurs.length; i++) if (!erreurs[i].startsWith(p)) erreurs[i] = p + " → " + erreurs[i];
  }
  /* laisse tourner les minuteries (présence, statut du prof, notifications) */
  await page.waitForTimeout(1500);
  const inconnus = await page.evaluate(() => window.__PP_INCONNUS || []);
  await contexte.close();
  return { erreurs, inconnus };
}

(async () => {
  const serveur = await demarrer(0), base = "http://127.0.0.1:" + serveur.address().port;
  const navigateur = await chromium.launch({ headless: !VOIR });
  let total = 0;
  try {
    for (const role of ["visiteur", "eleve", "prof"]) {
      const { erreurs, inconnus } = await testerRole(navigateur, base, role);
      total += erreurs.length;
      console.log((erreurs.length ? "ÉCHEC " : "OK    ") + role.padEnd(9) + " " + PAGES[role].length + " pages, " + erreurs.length + " erreur" + (erreurs.length > 1 ? "s" : ""));
      erreurs.forEach(e => console.log("        - " + e));
      if (inconnus.length) console.log("        (à compléter dans faux-supabase.js : " + inconnus.join(", ") + ")");
    }
  } finally { await navigateur.close(); serveur.close(); }
  console.log(total ? "\nRésultat : " + total + " erreur(s)." : "\nRésultat : aucune erreur.");
  process.exit(total ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
