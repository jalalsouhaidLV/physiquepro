/* =====================================================================
   PhysiquePro · test des fonctions « téléphone » (module 31, 11/11/2026)
   ---------------------------------------------------------------------
   En ÉLÈVE, sur un iPhone et un Android simulés (Playwright + faux Supabase,
   données fictives), vérifie une par une les 29 améliorations pour téléphone.
   Lancer depuis la racine du dépôt :  node sources/tests/test-telephone.js
   Options : --voir (navigateur visible), --captures (sources/tests/captures/telephone/)
   ===================================================================== */
"use strict";
const path = require("path"), fs = require("fs");
const { demarrer } = require("./serveur");
const { chromium, devices } = require("playwright");

const VOIR = process.argv.includes("--voir"), CAPTURES = process.argv.includes("--captures");
const DOSSIER = path.join(__dirname, "captures", "telephone");
const UID = "00000000-0000-4000-8000-000000000002";
const res = [];
const verif = (n, ok, detail = "") => { res.push({ n, ok: !!ok, detail }); console.log((ok ? "OK    " : "ÉCHEC ") + n + (detail ? "  (" + detail + ")" : "")); };

let base, nav;
async function contexte(appareil, o = {}) {
  const dev = devices[appareil];
  const ctx = await nav.newContext({ ...(dev || {}), ...(o.vue ? { viewport: o.vue } : {}), locale: "fr-FR", serviceWorkers: o.sw ? "allow" : "block", acceptDownloads: true });
  await ctx.addInitScript(([uid, flags, extra]) => {
    window.__PP_ROLE = extra.role || "eleve";
    try { if (!sessionStorage.getItem("pp_test_init")) { sessionStorage.setItem("pp_test_init", "1"); for (const [k, v] of Object.entries(flags)) localStorage.setItem("pp_tel_" + uid + "_" + k, v); } } catch (_) {}
    window.__BADGE = null; navigator.setAppBadge = n => { window.__BADGE = n; return Promise.resolve(); }; navigator.clearAppBadge = () => { window.__BADGE = 0; return Promise.resolve(); };
    if (extra.standalone) Object.defineProperty(navigator, "standalone", { get: () => true });
  }, [UID, o.flags || { visite: "1", installvu: "1" }, { standalone: !!o.standalone, role: o.role }]);
  await ctx.route("**/*", r => {
    const u = new URL(r.request().url());
    if (u.hostname === "127.0.0.1" || u.protocol === "data:" || u.protocol === "blob:") return r.continue();
    if (u.hostname === "s.wordpress.com") return r.fulfill({ status: 200, contentType: "image/png", body: fs.readFileSync(path.join(__dirname, "..", "..", "icon-192.png")) });   /* aperçu d'un site joint */
    return r.fulfill({ status: 200, contentType: /fonts\.googleapis/.test(u.hostname) ? "text/css" : "text/html", body: "" });
  });
  const page = await ctx.newPage(); page.erreurs = [];
  page.on("pageerror", e => page.erreurs.push(String(e.message || e)));
  page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) page.erreurs.push(m.text()); });
  page.on("dialog", d => d.dismiss().catch(() => {}));
  return { ctx, page };
}
const aller = async (page, h, ms = 700) => { await page.evaluate(x => { location.hash = x; }, h); await page.waitForTimeout(ms); };
const ouvrir = async (page, h = "#/accueil") => { await page.goto(base + "/" + h, { waitUntil: "load" }); await page.waitForSelector("#app > :not(.loading)", { timeout: 15000 }); await page.waitForTimeout(600); };
const capture = async (page, nom) => { if (!CAPTURES) return; fs.mkdirSync(DOSSIER, { recursive: true }); await page.screenshot({ path: path.join(DOSSIER, nom + ".png") }); };
const appels = page => page.evaluate(() => window.__PP_APPELS.slice());
/* une grande photo (JPEG ~ 5 Mo) créée dans la page, pour tester l'allègement */
const grossePhoto = page => page.evaluate(async () => {
  const c = document.createElement("canvas"); c.width = 3000; c.height = 2200; const g = c.getContext("2d");
  const im = g.createImageData(3000, 2200); for (let i = 0; i < im.data.length; i++) im.data[i] = (Math.random() * 255) | 0; g.putImageData(im, 0, 0);
  const b = await new Promise(r => c.toBlob(r, "image/jpeg", 1)); const t = new DataTransfer(); t.items.add(new File([b], "photo-cahier.jpg", { type: "image/jpeg" })); return b.size;
});
async function choisirFichier(page, sel, nom, mime, octets) {
  await page.evaluate(([sel, nom, mime, octets]) => {
    const i = document.querySelector(sel); const t = new DataTransfer();
    let f;
    if (mime === "image/jpeg" && octets > 1e6) {
      const c = document.createElement("canvas"); c.width = 3000; c.height = 2200; const g = c.getContext("2d");
      const im = g.createImageData(3000, 2200); for (let k = 0; k < im.data.length; k++) im.data[k] = (k % 4 === 3) ? 255 : (Math.random() * 255) | 0; g.putImageData(im, 0, 0);
      return new Promise(ok => c.toBlob(b => { f = new File([b], nom, { type: mime }); t.items.add(f); i.files = t.files; i.dispatchEvent(new Event("change", { bubbles: true })); ok(); }, "image/jpeg", 1));
    }
    f = new File([new Uint8Array(octets || 2000)], nom, { type: mime || "application/pdf" }); t.items.add(f); i.files = t.files; i.dispatchEvent(new Event("change", { bubbles: true }));
  }, [sel, nom, mime, octets]);
  await page.waitForTimeout(500);
}

async function testsIPhone() {
  console.log("\n— iPhone 13 (Safari simulé), élève —");
  const { ctx, page } = await contexte("iPhone 13");
  await ouvrir(page);

  /* B12 */
  const pr = await page.evaluate(() => { const s = document.querySelector(".tel-prochain"); return s && { titre: s.querySelector(".tptitre")?.textContent, go: s.querySelector(".tpgo")?.getAttribute("href"), cl: s.className, qui: !!s.querySelector('[data-act="pasmoi"]') }; });
  verif("B12 Accueil : carte « Ton prochain travail » (le plus urgent en premier)", pr && pr.titre === "Entraînement : célérité" && pr.go === "#/quiz/2" && /rouge/.test(pr.cl), pr && pr.titre + " · " + pr.cl);
  await capture(page, "B12-accueil");
  /* C19 */
  await page.waitForTimeout(1000);
  const badge = await page.evaluate(() => window.__BADGE);
  verif("C19 Pastille de l'icône = nombre de travaux à faire (2 devoirs + 2 questionnaires)", badge === 4, "pastille " + badge);
  /* A2 */
  await aller(page, "#/devoir/3");
  const fs16 = await page.evaluate(() => parseFloat(getComputedStyle(document.getElementById("repQ")).fontSize));
  verif("A2 Pas de zoom iPhone : texte des cases ≥ 16 px", fs16 >= 16, fs16 + " px");
  /* A5 */
  const qui = await page.evaluate(() => document.querySelector(".quirend")?.textContent || "");
  verif("A5 « Tu rends en tant que … » au-dessus du bouton Rendre", /Élève Test/.test(qui) && /Ce n'est pas moi/.test(qui));
  await page.click('.quirend [data-act="pasmoi"]'); await page.waitForTimeout(300);
  const pm = await page.evaluate(() => document.querySelector(".modal")?.innerText || "");
  verif("A5 « Ce n'est pas moi » : fenêtre avec « Changer de compte »", /Changer de compte/.test(pm) && /Élève Test/.test(pm));
  await capture(page, "A5-pas-moi");
  await page.click('.modal [data-act="mclose"]'); await page.waitForTimeout(300);
  /* A1 réponse texte (devoir « question ») gardée après rechargement */
  await page.fill("#repQ", "Un routeur relie des réseaux."); await page.waitForTimeout(600);
  await page.reload({ waitUntil: "load" }); await page.waitForSelector("#repQ"); await page.waitForTimeout(900);
  const rq = await page.inputValue("#repQ");
  verif("A1 Réponse écrite gardée si la page se recharge", rq === "Un routeur relie des réseaux.", JSON.stringify(rq));
  /* A4 */
  await page.click('[data-act="submit"]'); await page.waitForTimeout(900);
  const rendu = await page.evaluate(() => { const x = document.getElementById("ppRendu"); return x && getComputedStyle(x).position === "fixed" ? x.innerText : ""; });
  verif("A4 Écran vert « Réponse envoyée ! » après l'envoi", /Réponse envoyée/.test(rendu) && /Envoyé le/.test(rendu), rendu.replace(/\n+/g, " · ").slice(0, 90));
  await capture(page, "A4-rendu");
  await page.click("#ppRendu [data-rendu-ok]"); await page.waitForTimeout(200);

  /* A1 fichier choisi gardé + A3 allègement / progression / nouvel essai */
  await aller(page, "#/devoir/1", 900);
  await choisirFichier(page, "#fileIn", "photo-cahier.jpg", "image/jpeg", 5e6); await page.waitForTimeout(500);
  const taille0 = await page.evaluate(() => document.querySelector(".att.rcards.mini")?.innerText || "");
  await page.reload({ waitUntil: "load" }); await page.waitForTimeout(1500);
  const apres = await page.evaluate(() => document.querySelector(".att.rcards.mini")?.innerText || "");
  verif("A1 Fichier choisi (pas encore rendu) retrouvé après rechargement", /photo-cahier\.jpg/.test(apres), (taille0.match(/[\d,]+ Mo/) || [""])[0]);
  /* C20 cases à cocher */
  const nbc = await page.$$eval(".dvbody .richtext .etapecase", l => l.length);
  verif("C20 Les étapes de la consigne ont des cases à cocher", nbc === 3, nbc + " cases");
  await page.click('.etapecase[data-etape="1"]'); await page.waitForTimeout(200);
  await capture(page, "C20-A1-devoir");
  /* B14 zoom */
  await page.click('.rcard a.rtxt[data-path="tle/schema.png"]'); await page.waitForTimeout(600);
  const zm = await page.$("#ppZoom img");
  verif("B14 Toucher une image jointe l'ouvre en grand dans le site (zoom au doigt)", !!zm);
  await capture(page, "B14-zoom");
  await page.click("#ppZoom .zx"); await page.waitForTimeout(200);
  /* A3 */
  await page.evaluate(() => { window.__PP_PANNE = 1; window.__VU_ENVOI = false; window.__VU_ESSAI = false;
    new MutationObserver(() => { const o = document.getElementById("ppEnvoi"); if (o) { window.__VU_ENVOI = true; if (/nouvel essai/.test(o.innerText)) window.__VU_ESSAI = true; } }).observe(document.body, { childList: true, subtree: true }); });
  await page.click('[data-act="submit"]'); await page.waitForTimeout(5000);
  const A = await appels(page), up = A.filter(x => x.op === "upload"), panne = A.filter(x => x.op === "upload-panne").length;
  const vu = await page.evaluate(() => ({ e: window.__VU_ENVOI, s: window.__VU_ESSAI }));
  verif("A3 Photo allégée avant l'envoi (moins de 1,2 Mo)", up.length && up[up.length - 1].taille < 1.2e6 && up[up.length - 1].type === "image/jpeg", up.length ? Math.round(up[up.length - 1].taille / 1e3) + " Ko envoyés" : "aucun envoi");
  verif("A3 Barre de progression pendant l'envoi", vu.e);
  verif("A3 Réseau coupé : nouvel essai automatique, puis envoi réussi", panne === 1 && vu.s && up.length >= 1);
  const rendu2 = await page.evaluate(() => document.getElementById("ppRendu")?.innerText || "");
  verif("A4 Écran vert « C'est rendu ! » après un devoir", /C'est rendu/.test(rendu2));
  await page.evaluate(() => document.getElementById("ppRendu")?.remove());
  /* C20 bis : la case reste cochée */
  await aller(page, "#/accueil"); await aller(page, "#/devoir/1", 900);
  const coche = await page.evaluate(() => document.querySelector('.etapecase[data-etape="1"]')?.checked);
  verif("C20 Une étape cochée reste cochée quand on revient", coche === true);
  /* A3 bis : hors connexion */
  await aller(page, "#/devoir/3", 900);
  await page.evaluate(() => document.querySelector('[data-act="unsubmit"]')?.click()); await page.waitForTimeout(700);
  await ctx.setOffline(true);
  if (await page.$("#repQ")) { await page.fill("#repQ", "Réponse hors connexion"); await page.click('[data-act="submit"]'); await page.waitForTimeout(500); }
  const hl = await page.evaluate(() => (document.getElementById("depErr")?.textContent || "") + " | " + (document.getElementById("ppHorsLigne")?.innerText || ""));
  verif("A3 Sans réseau : message clair, le travail reste gardé", /Pas de connexion Internet/.test(hl), hl.slice(0, 80));
  verif("D24 Bandeau « Hors connexion » quand le réseau coupe", /Hors connexion/.test(hl));
  await ctx.setOffline(false); await page.waitForTimeout(300);

  /* B16 agenda (.ics sur iPhone) + D26 WhatsApp */
  await aller(page, "#/devoir/1", 900);
  const wa = await page.getAttribute(".teloutils a.wa", "href");
  verif("D26 « Prévenir un camarade » ouvre WhatsApp avec le lien du devoir", /^https:\/\/wa\.me\/\?text=/.test(wa || "") && decodeURIComponent(wa).includes("#/devoir/1"));
  const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 5000 }).catch(() => null), page.click('[data-act="agendatel"]')]);
  let ics = ""; if (dl) { const p = await dl.path(); ics = fs.readFileSync(p, "utf8"); }
  verif("B16 « Ajouter à mon agenda » : fichier .ics avec rappels la veille et 2 h avant", /BEGIN:VEVENT/.test(ics) && /TRIGGER:-P1D/.test(ics) && /TRIGGER:-PT2H/.test(ics) && /Exercices sur les ondes/.test(ics), dl ? dl.suggestedFilename() : "pas de téléchargement");
  await capture(page, "B16-D26-outils");
  /* C21 photo dans un commentaire privé */
  await choisirFichier(page, 'input[data-cpphoto="1"]', "exercice.jpg", "image/jpeg", 3000); await page.waitForTimeout(1200);
  const cp = await page.evaluate(() => ({ img: !!document.querySelector("img.cpphoto"), ins: (window.__PP_BOUCHON.DB.commentaires_prives || []).slice(-1)[0] }));
  verif("C21 Question au professeur avec une photo", cp.img && cp.ins && cp.ins.photo && /\/question-\d+-exercice\.jpg$/.test(cp.ins.photo.chemin), cp.ins && cp.ins.photo ? cp.ins.photo.chemin : "");
  /* C22 reprise de lecture */
  await page.evaluate(() => { document.body.style.paddingBottom = "1500px"; window.scrollTo(0, 700); }); await page.waitForTimeout(700);
  await aller(page, "#/accueil"); await aller(page, "#/devoir/1", 1200);
  const y = await page.evaluate(() => window.scrollY);
  verif("C22 Une page longue se rouvre là où on s'était arrêté", y > 400, "scrollY = " + Math.round(y));
  await page.evaluate(() => { document.body.style.paddingBottom = ""; });

  /* C17 + C18 + A6 + A7 + A1 (questionnaire) */
  await aller(page, "#/quiz/2", 900);
  const q1 = await page.evaluate(() => ({ vis: [...document.querySelectorAll("section.uneq > .q")].filter(x => getComputedStyle(x).display !== "none").length, txt: document.querySelector(".qnavtop")?.innerText || "", conc: document.documentElement.classList.contains("concentre"), top: getComputedStyle(document.querySelector(".topbar")).display }));
  verif("C17 Questionnaire : une seule question par écran, « Question 1 sur 3 »", q1.vis === 1 && /Question 1 sur 3/.test(q1.txt), q1.vis + " visible(s)");
  verif("C18 Mode concentration : barres du haut et du bas cachées", q1.conc && q1.top === "none");
  await capture(page, "C17-question-1");
  /* A7 */
  await page.click("input.qans"); await page.keyboard.type("1,5");
  await page.click('.kp[data-v="×10^"]'); await page.keyboard.type("3");
  const v = await page.inputValue("input.qans");
  verif("A7 Clavier de physique : ×10^ s'insère dans la réponse", v === "1,5×10^3", JSON.stringify(v));
  await capture(page, "A7-clavier");
  await page.click('[data-qnav="1"]'); await page.waitForTimeout(300);
  const q2 = await page.evaluate(() => document.querySelector(".qnavtop")?.innerText || "");
  verif("C17 « Suivante » passe à la question 2", /Question 2 sur 3/.test(q2));
  const h = await page.evaluate(() => { const o = [...document.querySelectorAll("section.uneq > .q:not([hidden]) .opt")][0]; return o ? o.getBoundingClientRect().height : 0; });
  verif("A6 Gros boutons de réponse (au moins 48 px de haut)", h >= 48, Math.round(h) + " px");
  await page.click("section.uneq > .q:not([hidden]) .opt"); await page.waitForTimeout(400);
  await page.reload({ waitUntil: "load" }); await page.waitForTimeout(1500);
  const garde = await page.evaluate(() => ({ txt: document.querySelector(".qnavtop")?.innerText || "", ck: !!document.querySelector("section.uneq > .q:not([hidden]) input:checked"), v: document.querySelector("input.qans")?.value }));
  verif("A1 Questionnaire : réponses et question en cours retrouvées après rechargement", /Question 2 sur 3/.test(garde.txt) && garde.ck && garde.v === "1,5×10^3", garde.v);
  await page.click("#ppConc"); await page.waitForTimeout(300);
  const sortie = await page.evaluate(() => getComputedStyle(document.querySelector(".topbar")).display);
  verif("C18 « Quitter le plein écran » remet les barres", sortie !== "none");
  await page.click('[data-qnav="=2"]'); await page.waitForTimeout(300);
  await page.click("section.uneq > .q:not([hidden]) .opt"); await page.waitForTimeout(200);
  await page.click('[data-act="valider"]'); await page.waitForTimeout(900);
  const fin = await page.evaluate(() => ({ grade: !!document.querySelector(".grade"), uneq: !!document.querySelector("section.uneq"), ls: Object.keys(localStorage).filter(k => /_q2$/.test(k)).length }));
  verif("C17 Après l'envoi : correction complète affichée, brouillon effacé", fin.grade && !fin.uneq && fin.ls === 0);

  /* B10 */
  await aller(page, "#/telephone", 2000);
  const t = await page.evaluate(() => document.querySelector("main")?.innerText || "");
  verif("B10 « Mon téléphone est-il prêt ? » : système, navigateur, installation, notifications", /iOS 15/.test(t) || /iOS \d+/.test(t), (t.match(/iOS [\d.]+/) || [""])[0]);
  verif("B10 Conseils clairs pour ce qui manque (installer, mettre à jour)", /Pas encore/.test(t) && /Installe PhysiquePro/.test(t));
  await capture(page, "B10-telephone");
  /* B9 */
  await page.evaluate(uid => { localStorage.removeItem("pp_tel_" + uid + "_installvu"); }, UID);
  await aller(page, "#/accueil", 1200);
  const inst = await page.evaluate(() => document.querySelector(".modal")?.innerText || "");
  verif("B9 1re connexion : installation guidée pas à pas (iPhone)", /Sur l'écran d'accueil/.test(inst) && /Partager/.test(inst));
  await capture(page, "B9-installation-iphone");
  await page.click('.modal [data-act="mclose"]').catch(() => {});
  /* D25 économie de données */
  await page.evaluate(() => localStorage.setItem("pp_eco", "1"));
  await aller(page, "#/admin/profil", 800);
  const eco = await page.evaluate(() => !!document.querySelector('input[data-eco="1"]:checked'));
  await aller(page, "#/devoir/1", 1500);
  const vign = await page.$$eval("img.rimg, .rthumb.yt img", l => l.length);
  verif("D25 Économie de données (réglage du Profil) : pas d'aperçus d'images à télécharger", eco && vign === 0, vign + " aperçu(s)");
  await page.evaluate(() => localStorage.removeItem("pp_eco")); await aller(page, "#/accueil"); await aller(page, "#/devoir/1", 1500);
  const vign2 = await page.evaluate(() => (document.querySelector("main")?.innerHTML.match(/mshots|i\.ytimg/g) || []).length + document.querySelectorAll("img.rimg").length);
  verif("D25 Sans économie de données : les aperçus reviennent", vign2 > 0, vign2 + " aperçu(s)");
  await page.evaluate(() => localStorage.removeItem("pp_eco"));
  /* C23 + D27 : simulation dans le site, en plein écran, capture jointe */
  await aller(page, "#/simulations", 900);
  await page.click('[data-act="simu"][data-u="simulations/ch12/lancer.html"]').catch(() => {});
  await page.waitForTimeout(1500);
  const sim = await page.evaluate(() => ({ o: !!document.getElementById("ppSimu"), rot: document.querySelector("#ppSimu .simtelrot") && getComputedStyle(document.querySelector("#ppSimu .simtelrot")).display !== "none" }));
  verif("C23 Simulation ouverte en plein écran dans le site (plus de nouvel onglet)", sim.o);
  verif("C23 Message « Tourne ton téléphone » en portrait", sim.rot);
  await capture(page, "C23-simulation");
  await page.click('[data-simtel="joindre"]'); await page.waitForTimeout(800);
  const jt = await page.evaluate(() => document.querySelector(".modal")?.innerText || "");
  verif("D27 « Joindre à mon devoir » : image de la simulation + choix du devoir", /simulation-/.test(jt) && /Exercices sur les ondes/.test(jt));
  await capture(page, "D27-joindre");
  await page.click('.modal [data-act="joindrevers"][data-id="1"]').catch(() => {}); await page.waitForTimeout(2000);
  const ajout = await page.evaluate(() => (location.hash) + " " + (document.querySelector(".att.rcards.mini")?.innerText || ""));
  verif("D27 L'image arrive dans le travail du devoir, prête à rendre", /#\/devoir\/1/.test(ajout) && /simulation-/.test(ajout), ajout.slice(0, 70));
  /* D29 */
  await aller(page, "#/mesnotes", 900);
  verif("D29 Raccourci « Mes notes » : la page existe", /Mes notes/.test(await page.evaluate(() => document.querySelector("main")?.innerText || "")));
  verif("Aucune erreur JavaScript (iPhone)", !page.erreurs.length, page.erreurs.slice(0, 3).join(" | "));
  await ctx.close();
}

async function testsVisite() {
  console.log("\n— 1re connexion (visite guidée) —");
  const { ctx, page } = await contexte("iPhone SE", { flags: {} });
  await ouvrir(page); await page.waitForTimeout(1200);
  let n = 0, titres = [];
  while (await page.$("#ppVisite") && n < 8) { titres.push(await page.evaluate(() => document.querySelector("#ppVisite .vbulle b")?.textContent)); if (n === 0) await capture(page, "B13-visite"); await page.click('#ppVisite [data-vis="suivant"]'); await page.waitForTimeout(250); n++; }
  const ls = await page.evaluate(uid => localStorage.getItem("pp_tel_" + uid + "_visite"), UID);
  verif("B13 Visite guidée à la 1re connexion (" + n + " bulles)", n >= 4 && ls === "1", titres.join(" › "));
  await page.waitForTimeout(800);
  await aller(page, "#/agenda"); await aller(page, "#/accueil", 1000);
  const inst = await page.evaluate(() => document.querySelector(".modal")?.innerText || "");
  verif("B9 Après la visite : la carte d'installation s'affiche une seule fois", /Installe PhysiquePro/.test(inst));
  verif("Aucune erreur JavaScript (visite)", !page.erreurs.length, page.erreurs.slice(0, 3).join(" | "));
  await ctx.close();
}

async function testsAndroid() {
  console.log("\n— Android (Pixel 7, Chrome), élève —");
  const { ctx, page } = await contexte("Pixel 7");
  await ouvrir(page, "#/devoir/1");
  const [pop] = await Promise.all([ctx.waitForEvent("page", { timeout: 4000 }).catch(() => null), page.click('[data-act="agendatel"]')]);
  verif("B16 Android : « Ajouter à mon agenda » ouvre Google Agenda", pop && /calendar\.google\.com\/calendar\/render\?action=TEMPLATE/.test(pop.url()), pop ? pop.url().slice(0, 70) : "");
  if (pop) await pop.close();
  await aller(page, "#/telephone", 1800);
  const t = await page.evaluate(() => document.querySelector("main")?.innerText || "");
  verif("B10 Android : version et navigateur reconnus", /Android 14/.test(t) && /Chrome/.test(t));
  await page.evaluate(uid => localStorage.removeItem("pp_tel_" + uid + "_installvu"), UID);
  await aller(page, "#/accueil", 1200);
  const inst = await page.evaluate(() => document.querySelector(".modal")?.innerText || "");
  verif("B9 Android : étapes avec le menu ⋮ de Chrome", /Installer l'application/.test(inst));
  await capture(page, "B9-installation-android");
  await page.click('.modal [data-act="mclose"]').catch(() => {});
  /* labo animé : boutons plein écran et joindre */
  await aller(page, "#/simulations", 900);
  await page.click('[data-act="labouvrir"]'); await page.waitForTimeout(900);
  const lab = await page.evaluate(() => ({ p: !!document.querySelector('#labPanel [data-labtel="plein"]'), j: !!document.querySelector('#labPanel [data-labtel="joindre"]') }));
  verif("C23 Labo animé : boutons « Plein écran » et « Joindre à mon devoir »", lab.p && lab.j);
  await page.click('#labPanel [data-labtel="joindre"]'); await page.waitForTimeout(800);
  verif("D27 Labo animé : capture prête à joindre", /simulation-/.test(await page.evaluate(() => document.querySelector(".modal")?.innerText || "")));
  verif("Aucune erreur JavaScript (Android)", !page.erreurs.length, page.erreurs.slice(0, 3).join(" | "));
  await ctx.close();
}

async function testsAppli() {
  console.log("\n— Application installée (service worker actif) —");
  const { ctx, page } = await contexte("Pixel 7", { sw: true, standalone: true });
  await ouvrir(page);
  await page.evaluate(async () => { const r = await navigator.serviceWorker.register("sw.js"); await navigator.serviceWorker.ready; });
  await page.reload({ waitUntil: "load" }); await page.waitForTimeout(1500);
  verif("Service worker actif", await page.evaluate(() => !!navigator.serviceWorker.controller));
  /* B15 tirer pour actualiser */
  const avant = (await appels(page)).length;
  await page.evaluate(async () => {
    const t = document.querySelector("main") || document.body, ev = (type, y) => { const tc = new Touch({ identifier: 1, target: t, clientX: 150, clientY: y }); t.dispatchEvent(new TouchEvent(type, { touches: type === "touchend" ? [] : [tc], changedTouches: [tc], bubbles: true, cancelable: true })); };
    window.scrollTo(0, 0); ev("touchstart", 120); for (let y = 130; y <= 260; y += 20) { ev("touchmove", y); await new Promise(r => setTimeout(r, 16)); } window.__TIRER = document.getElementById("ppTirer")?.innerText; ev("touchend", 260);
  });
  await page.waitForTimeout(1500);
  const apres = (await appels(page)).length, tir = await page.evaluate(() => window.__TIRER);
  verif("B15 Appli installée : tirer vers le bas actualise la page", /Lâche pour actualiser/.test(tir || "") && apres > avant + 3, "requêtes : " + (apres - avant));
  /* D28 partage depuis la galerie (le service worker reçoit le fichier) */
  await page.evaluate(async () => { const fd = new FormData(); fd.append("title", "photo"); fd.append("fichiers", new File([new Uint8Array(5000)], "IMG_2041.jpg", { type: "image/jpeg" })); const r = await fetch("partage", { method: "POST", body: fd, redirect: "manual" }); window.__PART = r.type + " " + r.status; });
  await ouvrir(page, "#/partage"); await page.waitForTimeout(1200);
  const pa = await page.evaluate(() => document.querySelector("main")?.innerText || "");
  verif("D28 « Partager vers PhysiquePro » : le fichier partagé arrive dans le site", /IMG_2041\.jpg/.test(pa) && /Exercices sur les ondes/.test(pa), pa.replace(/\n+/g, " · ").slice(0, 80));
  await page.click('[data-act="joindrevers"][data-id="1"]'); await page.waitForTimeout(1800);
  verif("D28 … puis dans le devoir choisi", /IMG_2041\.jpg/.test(await page.evaluate(() => document.querySelector(".att.rcards.mini")?.innerText || "")));
  /* D24 hors connexion : le site s'ouvre avec la dernière version gardée */
  await aller(page, "#/classe/tle", 1500); await page.waitForTimeout(2000);
  await ctx.setOffline(true);
  await page.reload({ waitUntil: "load" }).catch(() => {}); await page.waitForTimeout(2500);
  const off = await page.evaluate(() => ({ t: document.querySelector("main")?.innerText || document.body.innerText, b: document.getElementById("ppHorsLigne")?.innerText || "" }));
  verif("D24 Sans réseau : le site s'ouvre quand même (dernière version gardée)", /Tle spé PC/.test(off.t) && /Hors connexion/.test(off.b), off.b.slice(0, 70));
  await aller(page, "#/devoir/1", 900);
  verif("D24 Sans réseau : la consigne d'un devoir reste lisible", /Faire les exercices 3 et 4/.test(await page.evaluate(() => document.querySelector("main")?.innerText || "")));
  await ctx.setOffline(false);
  verif("Aucune erreur JavaScript (appli)", !page.erreurs.filter(e => !/Failed to fetch|ERR_INTERNET_DISCONNECTED/.test(e)).length, page.erreurs.slice(0, 3).join(" | "));
  await ctx.close();
}

/* 2e évaluation (11/11/2026) : menu du bas, petit écran de 320 px, message du questionnaire */
async function testsPetitEcran() {
  console.log("\n— Petit Android (320 px) et menu du bas, élève —");
  const { ctx, page } = await contexte("Galaxy S9+");
  for (const h of ["#/accueil", "#/todo"]) {
    await ouvrir(page, h);
    await page.tap('.navbas [data-act="drawer"]'); await page.waitForTimeout(700);
    const m = await page.evaluate(() => { const d = document.querySelector(".drawer"); return { vu: !!d && !d.hidden && d.getBoundingClientRect().width > 100, h: location.hash }; });
    verif("E Menu du bas : il s'ouvre et reste ouvert (" + h + ")", m.vu && m.h === h, m.h);
    await capture(page, "E-menu" + h.replace(/[#/]/g, "-"));
    await page.tap('.drawer a[href="#/revisions"]'); await page.waitForTimeout(700);
    verif("E Menu du bas : un lien du menu ouvre la page et referme le menu (" + h + ")", await page.evaluate(() => location.hash === "#/revisions" && document.querySelector(".drawer").hidden));
  }
  for (const h of ["#/accueil", "#/todo", "#/classe/tle", "#/classe/tle/travaux", "#/devoir/1", "#/quiz/1", "#/simulations", "#/semaine", "#/revisions"]) {
    await aller(page, h, 900);
    const w = await page.evaluate(() => document.documentElement.scrollWidth);
    verif("F 320 px : rien ne dépasse sur le côté (" + h + ")", w <= 320, w + " px");
  }
  await aller(page, "#/todo", 900);
  const tt = await page.evaluate(() => Math.min(...[...document.querySelectorAll(".work .workrow .tt")].map(e => e.getBoundingClientRect().width)));
  verif("F 320 px : « À faire », titres sur une largeur lisible (pas coupés lettre par lettre)", tt >= 160, Math.round(tt) + " px");
  await capture(page, "F-a-faire-320");
  await aller(page, "#/quiz/2", 1200);
  await page.click('[data-qnav="=2"]').catch(() => {}); await page.waitForTimeout(400);
  await page.click('[data-act="valider"]').catch(() => {}); await page.waitForTimeout(500);
  const t = await page.evaluate(() => document.getElementById("toast")?.textContent || "");
  verif("G Questionnaire : le message nomme les questions sans réponse", /question/.test(t) && /\d/.test(t), t);
  verif("Aucune erreur JavaScript (petit écran)", !page.erreurs.length, page.erreurs.slice(0, 3).join(" | "));
  await ctx.close();
}

/* 3e évaluation (11/11/2026) : touche Retour, téléphone en paysage, finitions */
async function testsTroisieme() {
  console.log("\n— 3e évaluation : touche Retour, paysage, finitions —");
  const ouvert = page => page.evaluate(() => ({ h: location.hash, menu: !document.querySelector(".drawer").hidden, cloche: !!document.querySelector(".bellmenu") }));
  let { ctx, page } = await contexte("Pixel 7");
  await ouvrir(page, "#/accueil"); await aller(page, "#/devoir/1", 900);
  await page.tap('.navbas [data-act="drawer"]'); await page.waitForTimeout(600);
  await page.goBack(); await page.waitForTimeout(700);
  let e = await ouvert(page);
  verif("I Retour avec le menu ouvert : le menu se ferme, on reste sur le devoir", !e.menu && e.h === "#/devoir/1", JSON.stringify(e));
  await page.tap('[data-act="bell"]'); await page.waitForTimeout(600);
  await page.goBack(); await page.waitForTimeout(700);
  e = await ouvert(page);
  verif("I Retour avec la cloche ouverte : la cloche se ferme, on reste sur le devoir", !e.cloche && e.h === "#/devoir/1", JSON.stringify(e));
  await page.tap('.navbas [data-act="drawer"]'); await page.waitForTimeout(600);
  await page.touchscreen.tap(400, 420); await page.waitForTimeout(800);
  await page.goBack(); await page.waitForTimeout(800);
  e = await ouvert(page);
  verif("I Menu fermé par le voile, puis Retour : on revient à la page d'avant en un seul appui", e.h === "#/accueil" && !e.menu, JSON.stringify(e));
  await aller(page, "#/devoir/1", 900);
  await page.tap('.navbas [data-act="drawer"]'); await page.waitForTimeout(600);
  await page.tap('.drawer a[href="#/revisions"]'); await page.waitForTimeout(800);
  await page.goBack(); await page.waitForTimeout(800);
  e = await ouvert(page);
  verif("I Lien du menu, puis Retour : on revient au devoir, menu fermé", e.h === "#/devoir/1" && !e.menu, JSON.stringify(e));
  verif("K Notification d'une note : « Note reçue »", await page.evaluate(async () => { document.querySelector('[data-act="bell"]').click(); await new Promise(r => setTimeout(r, 800)); return /Note reçue/.test(document.querySelector(".bellmenu").innerText); }));
  await page.goBack(); await page.waitForTimeout(500);
  await aller(page, "#/devoir/1", 900);
  const termine = page.locator('button:has-text("Marquer comme terminé")');
  if (await termine.count()) { await termine.first().tap(); await page.waitForTimeout(1500); }
  verif("L Faux Supabase : la date du rendu est enregistrée (pas « Invalid Date »)", !(await page.evaluate(() => /Invalid Date/.test(document.body.innerText))));
  await ctx.close();
  ({ ctx, page } = await contexte("Pixel 7 landscape"));
  await ouvrir(page, "#/accueil");
  e = await page.evaluate(() => ({ nb: getComputedStyle(document.querySelector(".navbas")).display, quick: [...document.querySelectorAll(".topbar .quick")].every(q => getComputedStyle(q).display === "none"), w: document.documentElement.scrollWidth - innerWidth }));
  verif("J Téléphone en paysage : barre du bas visible, logos du haut retirés, rien ne dépasse", e.nb !== "none" && e.quick && e.w <= 0, JSON.stringify(e));
  await capture(page, "J-paysage");
  await ctx.close();
  ({ ctx, page } = await contexte("Galaxy S9+"));
  await ouvrir(page, "#/todo");
  e = await page.evaluate(() => Math.round(Math.max(...[...document.querySelectorAll(".tabs3 button")].map(b => b.getBoundingClientRect().right))));
  verif("K 320 px : les 3 onglets de « À faire » tiennent dans l'écran", e <= 320, e + " px");
  await capture(page, "K-onglets-320");
  await ctx.close();
  ({ ctx, page } = await contexte(null, { vue: { width: 1366, height: 768 } }));
  await ouvrir(page, "#/accueil");
  await page.keyboard.press("Tab");
  const t = await page.evaluate(() => document.activeElement.innerText.trim());
  await page.keyboard.press("Enter"); await page.waitForTimeout(300);
  verif("K Clavier : 1er Tab = « Aller au contenu », Entrée place le clavier sur la page", t === "Aller au contenu" && await page.evaluate(() => document.activeElement.matches("main.content") && location.hash === "#/accueil"), t);
  await ctx.close();
  ({ ctx, page } = await contexte(null, { vue: { width: 1366, height: 768 }, role: "prof" }));
  await ouvrir(page, "#/accueil");
  verif("K Prof : le questionnaire de « À rendre récemment » a son compteur de rendus", await page.evaluate(() => [...document.querySelectorAll(".recentrow")].some(a => /\/quiz\//.test(a.getAttribute("href")) && /rendus? sur/.test(a.innerText))));
  await ctx.close();
}

async function testsQuatrieme() {
  console.log("\n— 4e évaluation : paysage étroit, visite guidée —");
  for (const dv of ["iPhone 13 landscape", "Galaxy S9+ landscape"]) {
    const { ctx, page } = await contexte(dv);
    await ouvrir(page, "#/accueil");
    const e = await page.evaluate(() => ({ nb: getComputedStyle(document.querySelector(".navbas")).display, quick: [...document.querySelectorAll(".topbar .quick")].every(q => getComputedStyle(q).display === "none"), bande: [...document.querySelectorAll(".page > .headband")].every(b => getComputedStyle(b).display === "none"), w: document.documentElement.scrollWidth - innerWidth, larg: innerWidth }));
    verif("M " + dv + " : barre du bas, pas de logos ni de bande en haut, rien ne dépasse", e.nb !== "none" && e.quick && e.bande && e.w <= 0, JSON.stringify(e));
    await capture(page, "M-" + dv.replace(/\W+/g, "-"));
    await ctx.close();
  }
  let { ctx, page } = await contexte("Pixel 7", { flags: { installvu: "1" } });
  await ouvrir(page, "#/accueil"); await page.waitForTimeout(1200);
  const vis = () => page.evaluate(() => ({ h: location.hash, v: !!document.getElementById("ppVisite") }));
  let e = await vis();
  verif("N La visite guidée démarre sur l'accueil", e.v && e.h === "#/accueil", JSON.stringify(e));
  await page.goBack(); await page.waitForTimeout(800); e = await vis();
  verif("N Touche Retour pendant la visite : la visite se ferme, on reste sur l'accueil", !e.v && e.h === "#/accueil", JSON.stringify(e));
  await ctx.close();
  ({ ctx, page } = await contexte("Pixel 7", { flags: { installvu: "1" } }));
  await ouvrir(page, "#/accueil"); await page.waitForTimeout(1200);
  await aller(page, "#/devoir/1", 900); e = await vis();
  verif("N Changement de page pendant la visite : la visite s'arrête", !e.v && e.h === "#/devoir/1", JSON.stringify(e));
  await ctx.close();
  ({ ctx, page } = await contexte("iPhone 13"));
  await ouvrir(page, "#/accueil");
  const hmin = await page.evaluate(() => Math.round(Math.min(...[...document.querySelectorAll(".ccard .body > a")].map(a => a.getBoundingClientRect().height))));
  verif("N Travaux des cartes de cours : 24 px de haut au moins", hmin >= 24, hmin + " px");
  const q = await page.evaluate(() => [...document.querySelectorAll(".topbar .quick a")].filter(a => a.offsetWidth).length);
  verif("H Logos par défaut de l'élève : Pronote, PIX, WhatsApp, Outlook, OneDrive, NumWorks", await page.evaluate(() => [...document.querySelectorAll(".topbar .quick a")].map(a => a.title).join(",")) === "Pronote Verdun,PIX,WhatsApp Web,E-mail Outlook,OneDrive,NumWorks");
  verif("H Téléphone : les logos favoris de l'élève sont visibles en haut (3 sur un iPhone 13)", q === 3, q + " logos");
  await page.tap('button[data-act="me"]'); await page.waitForTimeout(500);
  const m = await page.evaluate(() => { const r = document.querySelector(".ddme .dd-menu").getBoundingClientRect(); return { g: Math.round(r.left), d: Math.round(r.right), w: innerWidth }; });
  verif("Menu du compte sur téléphone : entièrement dans l'écran", m.g >= 0 && m.d <= m.w, JSON.stringify(m));
  await ctx.close();
}

async function testsCinquieme() {
  console.log("\n— 5e évaluation : rendre sur téléphone, À faire, accueil du prof, logos —");
  let { ctx, page } = await contexte("iPhone 13");
  await ouvrir(page); await aller(page, "#/quiz/1", 900);
  await page.click('[data-qnav="=1"]'); await page.waitForTimeout(300);
  let e = await page.evaluate(() => { const v = document.querySelector('section.uneq [data-act="valider"]'), p = document.querySelector('section.uneq [data-qnav="-1"]'); if (!v || !p) return null; const rv = v.getBoundingClientRect(), rp = p.getBoundingClientRect(); return { h: Math.round(rv.height), w: Math.round(rv.width), dessus: rv.top < rp.top, vis: getComputedStyle(v).display !== "none" }; });
  verif("Q Dernière question : grand bouton « Envoyer » (toute la largeur, au-dessus de « Précédente »)", e && e.vis && e.h >= 52 && e.w >= 280 && e.dessus, JSON.stringify(e));
  await page.click("section.uneq > .q:not([hidden]) .opt"); await page.click('[data-qnav="=0"]'); await page.waitForTimeout(200);
  await page.click("section.uneq > .q:not([hidden]) .opt"); await page.click('[data-qnav="=1"]'); await page.waitForTimeout(200);
  await page.click('section.uneq [data-act="valider"]'); await page.waitForTimeout(1200);
  const vert = await page.evaluate(() => document.getElementById("ppRendu")?.innerText || "");
  verif("Q Écran vert du questionnaire : la note y est écrite", /Ta note : \d/.test(vert), vert.replace(/\s+/g, " ").slice(0, 80));
  await page.click("#ppRendu [data-rendu-ok]"); await page.waitForTimeout(400);
  e = await page.evaluate(() => { const b = document.querySelector(".quizbilan"); return b && { top: Math.round(b.getBoundingClientRect().top), y: Math.round(scrollY), txt: b.innerText.replace(/\s+/g, " ") }; });
  verif("Q Après l'envoi : le résultat est en haut de la page, visible tout de suite", e && e.top < 500 && e.y < 50 && /Ta note/.test(e.txt), e && e.txt.slice(0, 70));
  await aller(page, "#/devoir/1", 900);
  e = await page.evaluate(() => { const w = [...document.querySelectorAll(".dvside > .yourwork")][0], c = document.querySelector(".dvcoms"); return w && c && { w: Math.round(w.getBoundingClientRect().top), c: Math.round(c.getBoundingClientRect().top) }; });
  verif("Q Page d'un devoir sur téléphone : « Ton travail » avant les commentaires de la classe", e && e.w < e.c, JSON.stringify(e));
  await aller(page, "#/todo", 800);
  e = await page.evaluate(() => ({ onglets: [...document.querySelectorAll(".tabs3 button")].map(b => b.innerText.replace(/\s+\d+$/, "").trim()), titres: [...document.querySelectorAll(".workrow .tt")].map(t => t.firstChild.textContent.trim()) }));
  verif("Q « À faire » : mots simples (À faire, En retard, Terminés)", e.onglets.join(",") === "À faire,En retard,Terminés", e.onglets.join(","));
  verif("Q « À faire » : l'entraînement de demain est en tête (du plus urgent au moins urgent)", e.titres[0] === "Entraînement : célérité", e.titres.join(" / "));
  const pill = await page.evaluate(() => { location.hash = "#/accueil"; return new Promise(ok => setTimeout(() => ok([...document.querySelectorAll(".recentrow .pill")].map(p => p.innerText)), 700)); });
  verif("Q Élève : « À faire » au lieu de « Attribué »", pill.length && !pill.includes("Attribué") && pill.includes("À faire"), pill.join(","));
  e = await page.evaluate(() => [...document.querySelectorAll(".topbar .ib, .topbar .avatar")].filter(b => b.offsetWidth).map(b => Math.round(Math.min(b.getBoundingClientRect().width, b.getBoundingClientRect().height))));
  verif("Q Boutons du haut : 40 px au moins (icônes 44 px)", e.every(x => x >= 40), e.join(","));
  await ctx.close();
  for (const dv of ["Pixel 7", "Galaxy S9+"]) {
    ({ ctx, page } = await contexte(dv)); await ouvrir(page);
    e = await page.evaluate(() => { const n = document.querySelector(".topbar .quick"), r = n.getBoundingClientRect().right; return [...n.querySelectorAll("a")].filter(a => a.offsetWidth).map(a => a.getBoundingClientRect().right <= r + 0.5); });
    verif("P " + dv + " : chaque logo du haut est visible en entier", e.length >= 1 && e.every(Boolean), e.length + " logos");
    await ctx.close();
  }
  ({ ctx, page } = await contexte(null, { vue: { width: 1024, height: 700 }, role: "prof" }));
  await ouvrir(page, "#/accueil");
  e = await page.evaluate(() => { const n = document.querySelector(".topbar .quick"), r = n.getBoundingClientRect().right, L = [...n.querySelectorAll("a")].filter(a => a.offsetWidth); return { n: L.length, entiers: L.every(a => a.getBoundingClientRect().right <= r + 0.5 && a.getBoundingClientRect().left >= n.getBoundingClientRect().left - 0.5) }; });
  verif("P Ordinateur 1024 px : les logos du haut visibles le sont en entier", e.n >= 3 && e.entiers, JSON.stringify(e));
  e = await page.evaluate(() => ({ k: document.querySelector(".kpis .kpi")?.innerText.replace(/\s+/g, " "), h: document.querySelector(".recent h2")?.innerText, r: [...document.querySelectorAll(".recentrow .rrendus")].map(x => x.innerText) }));
  verif("P Accueil du prof : la 1re tuile dit combien de copies sont à corriger", /cop(ie|ies) à corriger/.test(e.k || ""), e.k);
  verif("P « Travaux en cours » : rendus et copies à noter", e.h === "Travaux en cours" && e.r.some(x => /tout noté|à noter/.test(x)), e.r.join(" | "));
  await aller(page, "#/quiz/1", 800);
  e = await page.evaluate(() => [...document.querySelectorAll("td .pill")].map(p => p.innerText));
  verif("P Questionnaire (prof) : « À faire » avant l'échéance, pas « Non fait »", e.length && e.every(x => x === "À faire"), e.join(","));
  await aller(page, "#/devoir/2", 900);
  await page.click("text=Élève Test"); await page.waitForTimeout(700);
  const nv = await page.inputValue("#note").catch(() => "");
  verif("P Case de la note avec une virgule (15,5)", nv === "15,5", nv);
  await aller(page, "#/classe/tle/travaux", 800);
  e = await page.evaluate(() => { const h = [...document.querySelectorAll("main.content h1")]; return h.length + ":" + (h[0] ? h[0].innerText : ""); });
  verif("S Chaque page a un titre principal (onglet Travaux : titre caché pour les lecteurs d'écran)", /^1:/.test(e), e);
  await ctx.close();
}

(async () => {
  const srv = await demarrer(0); base = "http://127.0.0.1:" + srv.address().port;
  nav = await chromium.launch({ headless: !VOIR });
  try {
    const man = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "manifest.json"), "utf8"));
    verif("D29 Raccourcis de l'icône (À faire, Agenda, Mes notes)", (man.shortcuts || []).map(x => x.name).join(",") === "À faire,Agenda,Mes notes");
    verif("D28 L'appli accepte les partages (share_target)", man.share_target && man.share_target.method === "POST" && man.share_target.params.files[0].accept.includes("image/*"));
    const SEUL = (process.argv.find(x => x.startsWith("--seul=")) || "").slice(7);   /* ex. --seul=testsCinquieme : une seule série, pour corriger vite */
    const SERIES = { testsIPhone, testsVisite, testsAndroid, testsPetitEcran, testsTroisieme, testsQuatrieme, testsCinquieme, testsAppli };
    for (const [nom, f] of Object.entries(SERIES)) if (!SEUL || SEUL === nom) await f();
  } catch (e) { verif("Le test a planté", false, String(e && e.stack || e).slice(0, 400)); }
  finally { await nav.close(); srv.close(); }
  const ko = res.filter(x => !x.ok);
  console.log("\nRésultat : " + (res.length - ko.length) + "/" + res.length + " vérifications réussies.");
  process.exit(ko.length ? 1 : 0);
})();
