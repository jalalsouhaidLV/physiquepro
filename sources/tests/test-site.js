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
  visiteur: ["/accueil", "/outils", "/simulations", "/physique", "/donnees"],
  eleve: ["/accueil", "/classe/tle", "/classe/tle/flux", "/classe/tle/travaux", "/classe/tle/personnes", "/classe/tle/notes", "/classe/snt",
    "/devoir/1", "/devoir/2", "/devoir/3", "/quiz/1", "/todo", "/agenda", "/semaine", "/revisions", "/outils", "/simulations", "/physique",
    "/rendezvous", "/admin/profil", "/donnees"],
  prof: ["/accueil", "/classe/tle", "/classe/tle/flux", "/classe/tle/travaux", "/classe/tle/personnes", "/classe/tle/notes", "/classe/tle/corriger",
    "/classe/tle/parametres", "/classe/snt", "/devoir/1", "/devoir/2", "/quiz/1", "/todo", "/agenda", "/semaine", "/revisions", "/programmes",
    "/corbeille", "/suivi", "/urgences", "/preparateur", "/rendezvous", "/outils", "/simulations", "/physique",
    "/admin/profil", "/admin/site", "/admin/cours", "/admin/eleves", "/admin/fichiers", "/admin/import", "/admin/sauvegarde", "/donnees"]
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
  /* panneau « Élèves connectés » : deux groupes seulement, une ligne par élève, bouton Déconnecter */
  if (role === "prof") {
    const avant = erreurs.length;
    await page.evaluate(() => { location.hash = "#/accueil"; }); await page.waitForTimeout(700);
    await page.click('[data-act="enligne"]').catch(() => note("panneau Élèves connectés : bouton du compteur introuvable"));
    await page.waitForSelector("#sesPanel .sescorps section", { timeout: 8000 }).catch(() => note("panneau Élèves connectés : ne s'affiche pas"));
    const vu = await page.evaluate(() => ({ titres: [...document.querySelectorAll("#sesPanel .sescorps h4")].map(h => h.textContent.trim()),
      noms: [...document.querySelectorAll("#sesPanel .sesl b")].map(b => b.textContent.trim()) }));
    if (vu.titres.length !== 2 || !/^Connectés · \d+$/.test(vu.titres[0]) || !/^Déconnectés · \d+$/.test(vu.titres[1])) note("panneau Élèves connectés : groupes inattendus " + JSON.stringify(vu.titres));
    if (new Set(vu.noms).size !== vu.noms.length) note("panneau Élèves connectés : un élève apparaît deux fois " + JSON.stringify(vu.noms));
    const b = await page.$('#sesPanel [data-act="sesdeco"]');
    if (!b) note("panneau Élèves connectés : aucun bouton Déconnecter");
    else { await b.click(); await page.waitForTimeout(200); await page.click('#sesPanel [data-act="sesdeco"].danger'); await page.waitForTimeout(800); }
    if (CAPTURES) await page.screenshot({ path: path.join(DOSSIER_CAPTURES, "prof_eleves-connectes.png") });
    await page.keyboard.press("Escape");
    for (let i = avant; i < erreurs.length; i++) if (!erreurs[i].startsWith("panneau")) erreurs[i] = "panneau Élèves connectés → " + erreurs[i];
  }
  /* message d'urgence du prof : « Toute la classe » (une case) ou quelques élèves cochés */
  if (role === "prof") {
    const avant = erreurs.length;
    await page.evaluate(() => { location.hash = "#/urgences"; }); await page.waitForTimeout(700);
    await page.click('[data-act="urgecrire"]').catch(() => note("message d'urgence : bouton « Écrire aux élèves » introuvable"));
    await page.waitForSelector(".modal #upTexte", { timeout: 5000 }).catch(() => note("message d'urgence : la fenêtre ne s'ouvre pas"));
    const n = await page.$$eval(".modal .upEl", L => L.length);
    if (!n) note("message d'urgence : aucune case élève dans la fenêtre");
    else {
      await page.fill("#upTexte", "Test à plusieurs élèves");
      await page.check("#upTous");
      const tous = await page.$$eval(".modal .upEl", L => L.every(x => x.checked));
      if (!tous) note("message d'urgence : « Toute la classe » ne coche pas tous les élèves");
      if (n > 1) { await page.uncheck(".modal .upEl >> nth=0"); if (await page.isChecked("#upTous")) note("message d'urgence : « Toute la classe » reste cochée après avoir décoché un élève"); }
      if ((await page.inputValue("#upTexte")) !== "Test à plusieurs élèves") note("message d'urgence : le texte tapé s'efface quand on coche");
      const choisis = await page.$$eval(".modal .upEl:checked", L => L.length);
      await page.click('.modal [data-act="mok"]'); await page.waitForTimeout(1200);
      const t = await page.evaluate(() => (document.getElementById("toast") || {}).textContent || "");
      if (!/Message d'urgence envoyé/.test(t)) note("message d'urgence : pas de confirmation après l'envoi (« " + t + " »)");
      const nb = await page.$$eval(".urgcard.envoye", L => L.filter(x => x.textContent.includes("Test à plusieurs élèves")).length);
      if (nb !== choisis) note("message d'urgence : " + nb + " message(s) enregistré(s) pour " + choisis + " élève(s) coché(s)");
    }
    if (CAPTURES) await page.screenshot({ path: path.join(DOSSIER_CAPTURES, "prof_urgence-plusieurs.png") });
    await page.keyboard.press("Escape");
    for (let i = avant; i < erreurs.length; i++) if (!erreurs[i].startsWith("message d'urgence")) erreurs[i] = "message d'urgence → " + erreurs[i];
  }
  /* UNE SEULE alerte par message urgent (12/11/2026) : appareil abonné aux notifications push → la page reste silencieuse ;
     sinon site au premier plan → grande alerte + bip, site en arrière-plan → une notification du navigateur et rien d'autre */
  if (role === "prof" || role === "eleve") {
    const r = await page.evaluate(() => {
      const res = []; let notifs = 0, bips0 = 0; const T = window.__ppTest; if (!T) return ["accès de test absent"]; const S = T.etat();
      const N = function () { notifs++; }; N.permission = "granted"; N.requestPermission = async () => "granted";
      const avantN = window.Notification, avantFocus = document.hasFocus;
      try {
        window.Notification = N;
        const essai = (nom, pushOn, devant, attendu) => {
          const ov = document.getElementById("urgCentre"); if (ov) ov.remove(); notifs = 0; bips0 = T.bips();
          S.pushVerifie = true; S.pushOn = pushOn; document.hasFocus = () => devant;
          T.notifier("⚠ Message urgent · Test", "Texte", () => {}, "De : Test", "Cours", "Texte", undefined, "urgprof-999", "./#/urgences");
          const obtenu = [notifs, T.bips() - bips0, document.getElementById("urgCentre") ? 1 : 0].join("/");
          if (obtenu !== attendu) res.push(nom + " : notification/bip/alerte = " + obtenu + " au lieu de " + attendu);
        };
        essai("appareil abonné, site devant", true, true, S.prof ? "0/0/0" : "0/0/1");
        essai("appareil abonné, site derrière", true, false, S.prof ? "0/0/0" : "0/0/1");
        essai("appareil non abonné, site devant", false, true, "0/1/1");
        essai("appareil non abonné, site derrière", false, false, "1/0/0");
      } catch (e) { res.push("erreur " + (e && e.message)); }
      const ov = document.getElementById("urgCentre"); if (ov) ov.remove();
      window.Notification = avantN; document.hasFocus = avantFocus; S.pushVerifie = false; S.pushOn = false;
      return res;
    });
    r.forEach(x => note("une seule alerte → " + x));
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
