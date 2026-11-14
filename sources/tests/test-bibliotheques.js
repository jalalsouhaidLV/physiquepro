/* =====================================================================
   PhysiquePro · test des bibliothèques rangées dans le site (14/11/2026)
   ---------------------------------------------------------------------
   Les outils du site qui ont besoin d'une bibliothèque (dossier
   bibliotheques/) sont essayés pour de vrai, dans le site assemblé, avec
   sa règle de sécurité (CSP), le faux Supabase et des données fictives :
     - éditeur de formules : KaTeX + mhchem, puis « Télécharger en image » (html-to-image) ;
     - prof : « Bilan PDF » d'un élève (jsPDF) ;
     - prof : « Annoter la copie » PDF d'un élève (lecteur pdf.js et son worker), puis « Enregistrer pour l'élève » (jsPDF) ;
     - prof : import d'un .zip de Google Drive (JSZip) ;
     - élève : « Écrire sur la fiche » PDF (pdf.js), puis « Ajouter à mon travail » (jsPDF) ;
     - élève : « Scanner mon travail papier » (jsPDF) ;
     - avec le service worker : les fichiers passent par lui et y sont gardés.
   ÉCHOUE (code de sortie 1) si un outil ne marche pas, si une erreur sort dans la
   console, si un fichier du site manque, ou si un programme, une feuille de style
   ou une police est demandé à un autre site (cdnjs…).

   Lancer depuis la racine du dépôt :  node sources/tests/test-bibliotheques.js
   Options : --voir (navigateur visible), --captures (sources/tests/captures/bibliotheques/)
   À relancer à chaque changement de version d'une bibliothèque.
   Le PDF d'essai (fiche-test.pdf, 2 pages, contenu fictif) a été imprimé par Chromium.
   ===================================================================== */
"use strict";
const path = require("path"), fs = require("fs"), crypto = require("crypto");
const { demarrer } = require("./serveur");
let chromium;
try { ({ chromium } = require("playwright")); }
catch (_) { console.error("Playwright n'est pas installé. Dans sources/tests : npm install, puis npx playwright install chromium"); process.exit(2); }

const VOIR = process.argv.includes("--voir"), CAPTURES = process.argv.includes("--captures");
const RACINE = path.resolve(__dirname, "..", ".."), DOSSIER = path.join(__dirname, "captures", "bibliotheques");
const PRET = "#app > :not(.loading)";
const res = [];
const verif = (n, ok, detail = "") => { res.push({ n, ok: !!ok, detail }); console.log((ok ? "OK    " : "ÉCHEC ") + n + (detail ? "  (" + detail + ")" : "")); };
const FORMULE = "\\vec{F} = m \\vec{a} \\quad \\sum_{i=1}^{n} \\frac{\\sqrt{x_i}}{2} \\quad \\ce{CH4 + 2O2 -> CO2 + 2H2O}";

/* ---------- un petit .zip (sans compression) fabriqué ici, pour l'import ---------- */
function crc32(b) { let crc = 0xFFFFFFFF; for (let n = 0; n < b.length; n++) { let c = (crc ^ b[n]) & 0xFF; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; } return (crc ^ 0xFFFFFFFF) >>> 0; }
function zipDeTest(fichiers) {
  const locaux = [], centraux = []; let pos = 0;
  for (const f of fichiers) {
    const nom = Buffer.from(f.nom, "utf8"), d = Buffer.from(f.contenu), crc = crc32(d);
    const l = Buffer.alloc(30); l.writeUInt32LE(0x04034b50, 0); l.writeUInt16LE(20, 4); l.writeUInt16LE(0x0800, 6); l.writeUInt16LE(0x21, 12); l.writeUInt32LE(crc, 14); l.writeUInt32LE(d.length, 18); l.writeUInt32LE(d.length, 22); l.writeUInt16LE(nom.length, 26);
    const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x0800, 8); c.writeUInt16LE(0x21, 14); c.writeUInt32LE(crc, 16); c.writeUInt32LE(d.length, 20); c.writeUInt32LE(d.length, 24); c.writeUInt16LE(nom.length, 28); c.writeUInt32LE(pos, 42);
    locaux.push(l, nom, d); centraux.push(c, nom); pos += 30 + nom.length + d.length;
  }
  const cd = Buffer.concat(centraux), fin = Buffer.alloc(22); fin.writeUInt32LE(0x06054b50, 0); fin.writeUInt16LE(fichiers.length, 8); fin.writeUInt16LE(fichiers.length, 10); fin.writeUInt32LE(cd.length, 12); fin.writeUInt32LE(pos, 16);
  return Buffer.concat([...locaux, cd, fin]);
}

/* ---------- une page du site, avec ses mouchards ---------- */
let base, nav;
async function contexte(role, o = {}) {
  const ctx = await nav.newContext({ viewport: { width: 1280, height: 900 }, locale: "fr-FR", serviceWorkers: o.sw ? "allow" : "block", acceptDownloads: true });
  await ctx.addInitScript(r => {
    window.__PP_ROLE = r;
    /* données fictives en plus : une copie PDF rendue par l'élève (devoir 2) et une fiche PDF à compléter (devoir 1) */
    window.__PP_DONNEES = DB => {
      const rd = DB.rendus.find(x => x.id === 1); if (rd) rd.fichiers = [{ nom: "copie fiche-test.pdf", chemin: "2/" + rd.auteur + "/copie-fiche-test.pdf" }];
      const d = DB.devoirs.find(x => x.id === 1); if (d) d.ressources.push({ type: "Fichier", label: "Exercice fiche-test.pdf", path: "tle/exercice-fiche-test.pdf" });
    };
  }, role);
  const page = await ctx.newPage(); page.erreurs = []; page.dehors = []; page.workers_ = []; page.locaux = [];
  await ctx.route("**/*", r => {
    const u = new URL(r.request().url());
    if (u.hostname === "127.0.0.1" || u.protocol === "data:" || u.protocol === "blob:") return r.continue();
    page.dehors.push(r.request().resourceType() + " " + u.href.slice(0, 140));
    return r.fulfill({ status: 200, contentType: "text/plain", body: "" });
  });
  page.on("pageerror", e => page.erreurs.push("erreur JavaScript : " + String(e.message || e)));
  page.on("console", m => { if (m.type() === "error") page.erreurs.push("console : " + m.text().slice(0, 300)); });
  page.on("response", r => { const u = new URL(r.url()); if (u.hostname !== "127.0.0.1") return; if (r.status() >= 400) page.erreurs.push("fichier introuvable (" + r.status() + ") : " + u.pathname); if (u.pathname.startsWith("/bibliotheques/")) page.locaux.push(u.pathname.slice(15)); });
  page.on("worker", w => page.workers_.push(w.url()));
  page.on("dialog", d => d.dismiss().catch(() => {}));
  return { ctx, page };
}
const ouvrir = async (page, h) => { await page.goto(base + "/" + h, { waitUntil: "load" }); await page.waitForSelector(PRET, { timeout: 15000 }); await page.waitForTimeout(600); };
const aller = async (page, h, ms = 800) => { await page.evaluate(x => { location.hash = x; }, h); await page.waitForTimeout(ms); await page.waitForSelector(PRET, { timeout: 8000 }); };
const toast = page => page.evaluate(() => (document.getElementById("toast") || {}).textContent || "");
const capture = async (page, nom) => { if (!CAPTURES) return; fs.mkdirSync(DOSSIER, { recursive: true }); await page.screenshot({ path: path.join(DOSSIER, nom + ".png") }); };
/* bilan d'une série : erreurs de console, fichiers manquants, appels à un autre site */
function bilan(page, nom) {
  verif(nom + " : aucune erreur dans la console, aucun fichier manquant", page.erreurs.length === 0, page.erreurs.slice(0, 4).join(" | "));
  const interdits = page.dehors.filter(x => /^(script|stylesheet|font) /.test(x) || /cdnjs/.test(x));
  verif(nom + " : aucun programme, style ni police demandé à un autre site", interdits.length === 0, interdits.slice(0, 4).join(" | "));
}
/* les pages PDF affichées dans l'outil d'annotation : nombre de pages, part de points non blancs de la page 1 */
const pagesAnnot = page => page.evaluate(() => {
  const P = [...document.querySelectorAll(".annot .anpage")]; if (!P.length) return { pages: 0, encre: 0, msg: (document.querySelector(".annot .vempty") || {}).textContent || "" };
  const c = P[0].querySelector("canvas"), d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data; let n = 0;
  for (let i = 0; i < d.length; i += 4) if (d[i] < 200 || d[i + 1] < 200 || d[i + 2] < 200) n++;
  return { pages: P.length, encre: n / (d.length / 4), larg: c.width, haut: c.height };
});
/* un trait au stylet sur la page 1 */
async function tracer(page) {
  const b = await page.evaluate(() => { const c = document.querySelectorAll(".annot .anpage canvas")[1]; c.scrollIntoView({ block: "start" }); const r = c.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: Math.min(r.height, innerHeight - r.top) }; });
  await page.mouse.move(b.x + b.w * .2, b.y + b.h * .5); await page.mouse.down();
  for (let i = 1; i <= 8; i++) await page.mouse.move(b.x + b.w * (.2 + .06 * i), b.y + b.h * (.5 + .02 * (i % 2 ? 1 : -1)));
  await page.mouse.up();
  return page.evaluate(() => { const c = document.querySelectorAll(".annot .anpage canvas")[1], d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; return n; });
}
/* le dernier fichier ajouté au travail de l'élève : un vrai PDF ? combien de pages ? (relu par pdf.js) */
const dernierFichier = page => page.evaluate(async () => {
  const F = window.__ppTest.etat().files, f = F[F.length - 1]; if (!f) return null;
  const b = new Uint8Array(await f.arrayBuffer()), entete = String.fromCharCode(...b.slice(0, 5));
  let pages = 0; try { pages = (await window.pdfjsLib.getDocument({ data: b, isEvalSupported: false }).promise).numPages; } catch (e) { pages = "illisible : " + (e.message || e); }
  return { nom: f.name, type: f.type, taille: f.size, entete, pages };
});

/* ---------- 1. vérifications sans navigateur ---------- */
function testsFichiers() {
  const index = fs.readFileSync(path.join(RACINE, "index.html"), "utf8"), app = fs.readFileSync(path.join(RACINE, "app.js"), "utf8");
  const csp = (index.match(/Content-Security-Policy" content="([^"]*)"/) || [])[1] || "";
  verif("Règle de sécurité (CSP) : cdnjs n'est plus autorisé, les programmes viennent du site et de jsDelivr seulement", !/cdnjs/.test(index) && /script-src 'self' https:\/\/cdn\.jsdelivr\.net;/.test(csp) && /worker-src 'self' blob:;/.test(csp), (csp.match(/script-src[^;]*/) || [""])[0]);
  verif("app.js ne charge plus rien depuis cdnjs", !/cdnjs\.cloudflare\.com/.test(app));
  const appels = [...new Set((app.match(/bibliotheques\/[A-Za-z0-9._\/-]+/g) || []))];
  const manquants = [...appels.filter(x => /\.[a-z0-9]+$/.test(x)), "bibliotheques/katex-0.16.9/katex.min.js", "bibliotheques/katex-0.16.9/katex.min.css", "bibliotheques/katex-0.16.9/contrib/mhchem.min.js"].filter(x => !fs.existsSync(path.join(RACINE, x)));
  verif("Chaque fichier de bibliothèque appelé par le site existe dans le dépôt", appels.length >= 5 && manquants.length === 0, manquants.join(", ") || appels.length + " adresses");
  /* les fichiers n'ont pas bougé depuis leur copie depuis npm : empreintes SHA-256 du fichier EMPREINTES.sha256 */
  const liste = fs.readFileSync(path.join(RACINE, "bibliotheques", "EMPREINTES.sha256"), "utf8").trim().split("\n").map(l => l.match(/^([0-9a-f]{64})\s+\*?(.+)$/)).filter(Boolean);
  const faux = liste.filter(([, h, f]) => { const p = path.join(RACINE, "bibliotheques", f); return !fs.existsSync(p) || crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex") !== h; }).map(x => x[2]);
  const surDisque = []; (function lire(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) lire(p); else surDisque.push(path.relative(path.join(RACINE, "bibliotheques"), p).split(path.sep).join("/")); } })(path.join(RACINE, "bibliotheques"));
  const horsListe = surDisque.filter(f => !["EMPREINTES.sha256", "LISEZMOI.txt"].includes(f) && !liste.some(x => x[2] === f));
  verif("Fichiers des bibliothèques identiques à leur empreinte (EMPREINTES.sha256)", liste.length >= 70 && !faux.length && !horsListe.length, faux.concat(horsListe).slice(0, 5).join(", ") || liste.length + " fichiers");
}

/* ---------- 2. professeur ---------- */
async function testsProf() {
  const { ctx, page } = await contexte("prof");
  /* éditeur de formules */
  await ouvrir(page, "#/physique");
  await page.click('[data-act="phyong"][data-o="formules"]');
  const vu = await page.waitForSelector("#fmApercu .katex", { timeout: 15000 }).then(() => true, () => false);
  verif("Formules : KaTeX se charge depuis le site et affiche l'aperçu", vu);
  await page.fill("#fmTxt", FORMULE); await page.waitForTimeout(500);
  let e = await page.evaluate(async () => { await document.fonts.ready; const z = document.getElementById("fmApercu"), k = z.querySelector(".katex-display");
    return { err: z.classList.contains("err"), texte: z.textContent, polices: [...new Set([...document.fonts].filter(f => /KaTeX/.test(f.family) && f.status === "loaded").map(f => f.family.replace(/"/g, "")))], larg: k ? Math.ceil(k.getBoundingClientRect().width) : 0, haut: k ? Math.ceil(k.getBoundingClientRect().height) : 0 }; });
  verif("Formules : équation chimique (mhchem) et polices KaTeX du site", !e.err && /CO/.test(e.texte) && e.polices.includes("KaTeX_Main") && e.polices.includes("KaTeX_Math"), e.err ? e.texte.slice(0, 80) : e.polices.join(", "));
  await capture(page, "prof-formules");
  const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 60000 }).catch(() => null), page.click('[data-act="fmpng"]')]);
  if (!dl) verif("Formules : « Télécharger en image » donne un fichier", false);
  else {
    const png = fs.readFileSync(await dl.path()), okPng = png.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), w = okPng ? png.readUInt32BE(16) : 0, h = okPng ? png.readUInt32BE(20) : 0;
    if (CAPTURES) { fs.mkdirSync(DOSSIER, { recursive: true }); fs.writeFileSync(path.join(DOSSIER, "formule.png"), png); }
    verif("Formules : l'image PNG contient toute la formule, avec sa marge (taille = formule + 24 px, × 3)", okPng && dl.suggestedFilename() === "formule.png" && w === (e.larg + 24) * 3 && h === (e.haut + 24) * 3, w + " × " + h + " px pour une formule de " + e.larg + " × " + e.haut);
    const svg = await page.evaluate(async () => { const d = decodeURIComponent(await window.htmlToImage.toSvg(document.querySelector("#fmApercu .katex-display"))); return { regles: (d.match(/@font-face/g) || []).length, katex: /font-family:\s*"?KaTeX_Main/.test(d), incorporees: /KaTeX_Main[^}]*url\(["']?data:/.test(d) }; });
    verif("Formules : les polices KaTeX sont incorporées à l'image (même écriture qu'à l'écran)", svg.katex && svg.incorporees, svg.regles + " polices décrites");
  }
  /* bilan PDF d'un élève (jsPDF) */
  await aller(page, "#/suivi");
  await page.click(".suivirow"); await page.waitForSelector('[data-act="bilanpdf"]', { timeout: 5000 }).catch(() => {});
  const [bl] = await Promise.all([page.waitForEvent("download", { timeout: 30000 }).catch(() => null), page.click('[data-act="bilanpdf"]').catch(() => {})]);
  if (!bl) verif("Bilan PDF : le fichier est créé (jsPDF)", false, await toast(page));
  else { const b = fs.readFileSync(await bl.path()); if (CAPTURES) { fs.mkdirSync(DOSSIER, { recursive: true }); fs.writeFileSync(path.join(DOSSIER, "bilan.pdf"), b); }
    verif("Bilan PDF : le fichier est créé (jsPDF)", b.slice(0, 5).toString() === "%PDF-" && b.length > 2000 && /^bilan-.*\.pdf$/.test(bl.suggestedFilename()), bl.suggestedFilename() + ", " + b.length + " octets"); }
  /* annoter la copie PDF d'un élève (pdf.js), puis l'enregistrer (jsPDF) */
  await aller(page, "#/devoir/2");
  await page.evaluate(() => { const b = [...document.querySelectorAll('[data-act="sel"]')].find(x => /Élève Test/.test(x.textContent)); if (b) b.click(); }); await page.waitForTimeout(700);
  const bouton = await page.waitForSelector('[data-act="annoter"]', { timeout: 6000 }).then(() => true, () => false);
  verif("Copie d'élève : le bouton « Annoter » est proposé pour un PDF", bouton);
  if (bouton) {
    await page.click('[data-act="annoter"]');
    await page.waitForSelector(".annot .anpage canvas, .annot .anpages .vempty:not(:only-child)", { timeout: 30000 }).catch(() => {});
    await page.waitForFunction(() => document.querySelector(".annot .anpage") || /Impossible/.test((document.querySelector(".annot .vempty") || {}).textContent || ""), null, { timeout: 30000 }).catch(() => {});
    e = await pagesAnnot(page);
    verif("Lecteur de PDF (prof) : les 2 pages de la copie s'affichent", e.pages === 2 && e.encre > .01 && e.encre < .6, e.pages ? e.pages + " pages, " + e.larg + " × " + e.haut + ", " + (e.encre * 100).toFixed(1) + " % de points encrés" : e.msg);
    verif("Lecteur de PDF : son worker vient du site", page.workers_.some(u => /\/bibliotheques\/pdfjs-[0-9.]+\/pdf\.worker\.min\.js/.test(u)), page.workers_.map(u => u.replace(base, "")).join(", ") || "aucun worker");
    await capture(page, "prof-annoter");
    if (e.pages) {
      const trait = await tracer(page);
      verif("Annotation (prof) : le stylo écrit sur la copie", trait > 50, trait + " points tracés");
      await page.click('.annot [data-o="enregistrer"]');
      await page.waitForFunction(() => !document.querySelector(".annot"), null, { timeout: 30000 }).catch(() => {});
      const t = await toast(page), envoi = await page.evaluate(() => window.__PP_APPELS.filter(a => a.bucket === "rendus" && a.op === "upload").pop());
      verif("Annotation (prof) : la copie corrigée est enregistrée en PDF (jsPDF)", /Copie corrigée enregistrée/.test(t) && envoi && envoi.type === "application/pdf" && envoi.taille > 5000, envoi ? envoi.chemin.split("/").pop() + ", " + envoi.taille + " octets" : t);
    }
  }
  /* import d'un .zip (JSZip) */
  await aller(page, "#/admin/import");
  await page.setInputFiles("#impZip", { name: "Classroom.zip", mimeType: "application/zip", buffer: zipDeTest([{ nom: "Classroom/Dossier inconnu/Fiche A.txt", contenu: "Contenu fictif A" }, { nom: "Classroom/Dossier inconnu/Fiche B.txt", contenu: "Contenu fictif B" }]) });
  await page.waitForFunction(() => /fichiers trouvés dans le zip/.test((document.querySelector(".implog") || {}).textContent || ""), null, { timeout: 20000 }).catch(() => {});
  await page.waitForFunction(() => { const I = window.__ppTest.etat().imp; return I && !I.busy; }, null, { timeout: 20000 }).catch(() => {});
  e = await page.evaluate(() => ({ journal: (document.querySelector(".implog") || {}).textContent || "", zip: typeof window.JSZip, toast: (document.getElementById("toast") || {}).textContent || "" }));
  verif("Import : le .zip est lu (JSZip)", e.zip === "function" && /2 fichiers trouvés dans le zip/.test(e.journal), e.journal.slice(0, 120) || e.toast);
  await capture(page, "prof-import");
  bilan(page, "Professeur");
  await ctx.close();
}

/* ---------- 3. élève ---------- */
async function ouvrirFiche(page) {
  await aller(page, "#/devoir/1");
  await page.evaluate(() => { const d = document.querySelector("details.autresrendus"); if (d) d.open = true; });
  await page.click('[data-act="ecrirefiche"]:has-text("fiche-test.pdf")');
  await page.waitForFunction(() => document.querySelector(".annot .anpage") || /Impossible/.test((document.querySelector(".annot .vempty") || {}).textContent || ""), null, { timeout: 30000 }).catch(() => {});
  return pagesAnnot(page);
}
async function testsEleve() {
  const { ctx, page } = await contexte("eleve");
  await ouvrir(page, "#/devoir/1");
  let e = await ouvrirFiche(page);
  verif("Lecteur de PDF (élève) : les 2 pages de la fiche s'affichent", e.pages === 2 && e.encre > .01 && e.encre < .6, e.pages ? e.pages + " pages, " + (e.encre * 100).toFixed(1) + " % de points encrés" : e.msg);
  await capture(page, "eleve-fiche");
  if (e.pages) {
    const trait = await tracer(page);
    verif("Fiche (élève) : le stylo écrit sur la fiche", trait > 50, trait + " points tracés");
    await page.click('.annot [data-o="finir"]');
    await page.waitForFunction(() => !document.querySelector(".annot"), null, { timeout: 30000 }).catch(() => {});
    const f = await dernierFichier(page), t = await toast(page);
    verif("Fiche (élève) : « Ajouter à mon travail » crée un PDF de 2 pages (jsPDF)", f && f.entete === "%PDF-" && f.type === "application/pdf" && f.pages === 2 && /ajoutée à ton travail/.test(t), f ? f.nom + ", " + f.taille + " octets, " + f.pages + " pages" : t);
  }
  /* scanner un travail papier : 2 photos, un PDF */
  await page.evaluate(() => { const d = document.querySelector("details.autresrendus"); if (d) d.open = true; });
  await page.click('[data-act="scanner"]'); await page.waitForSelector("#scanGal", { state: "attached", timeout: 5000 });
  await page.setInputFiles("#scanGal", [path.join(RACINE, "icon-512.png"), path.join(RACINE, "icon-192.png")]);
  await page.waitForSelector('[data-act="scanpdf"]', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(500); await capture(page, "eleve-scanner");
  await page.click('[data-act="scanpdf"]').catch(() => {});
  await page.waitForFunction(() => /PDF ajouté à ton travail/.test((document.getElementById("toast") || {}).textContent || ""), null, { timeout: 30000 }).catch(() => {});
  const s = await dernierFichier(page), ts = await toast(page);
  verif("Scanner (élève) : les 2 photos deviennent un PDF de 2 pages (jsPDF)", s && /^Travail scanné/.test(s.nom) && s.entete === "%PDF-" && s.pages === 2 && /PDF ajouté à ton travail/.test(ts), s ? s.nom + ", " + s.taille + " octets, " + s.pages + " pages" : ts);
  bilan(page, "Élève");
  await ctx.close();
}

/* ---------- 4. avec le service worker (comme sur le vrai site) ---------- */
async function testsServiceWorker() {
  const { ctx, page } = await contexte("eleve", { sw: true });
  await ouvrir(page, "#/accueil");
  /* le site n'installe son service worker qu'en https : ici, on l'installe à la main (127.0.0.1 est accepté par le navigateur) */
  await page.evaluate(async () => { await navigator.serviceWorker.register("sw.js"); await navigator.serviceWorker.ready; });
  await page.reload({ waitUntil: "load" }); await page.waitForSelector(PRET, { timeout: 15000 }); await page.waitForTimeout(600);
  verif("Service worker : il contrôle la page", await page.evaluate(() => !!navigator.serviceWorker.controller));
  const e = await ouvrirFiche(page);
  verif("Service worker : le lecteur de PDF et son worker passent par lui", e.pages === 2 && e.encre > .01, e.pages ? e.pages + " pages" : e.msg);
  await page.click('.annot [data-o="fermer"]').catch(() => {});
  await aller(page, "#/physique"); await page.click('[data-act="phyong"][data-o="formules"]');
  const vu = await page.waitForSelector("#fmApercu .katex", { timeout: 15000 }).then(() => true, () => false);
  await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(800);
  verif("Service worker : l'éditeur de formules passe par lui", vu);
  const gardes = await page.evaluate(async () => { const L = []; for (const n of await caches.keys()) for (const r of await (await caches.open(n)).keys()) { const u = new URL(r.url); if (u.pathname.includes("/bibliotheques/")) L.push(u.pathname.split("/bibliotheques/")[1] + u.search); } return L; });
  const attendus = ["pdfjs-3.11.174/pdf.min.js?v=1", "pdfjs-3.11.174/pdf.worker.min.js?v=1", "katex-0.16.9/katex.min.js?v=1", "katex-0.16.9/katex.min.css?v=1", "katex-0.16.9/contrib/mhchem.min.js?v=1"].filter(x => !gardes.includes(x));
  verif("Service worker : les bibliothèques ouvertes sont gardées dans l'appareil", !attendus.length && gardes.some(x => /fonts\/KaTeX_Main-Regular\.woff2$/.test(x)), attendus.length ? "manque : " + attendus.join(", ") : gardes.length + " fichiers gardés");
  /* réseau coupé : le service worker rend encore ces fichiers */
  await ctx.setOffline(true);
  const hors = await page.evaluate(async () => { const R = []; for (const u of ["bibliotheques/pdfjs-3.11.174/pdf.worker.min.js?v=1", "bibliotheques/katex-0.16.9/katex.min.css?v=1", "bibliotheques/katex-0.16.9/fonts/KaTeX_Main-Regular.woff2"]) { try { const r = await fetch(u); R.push(r.status + ":" + (await r.arrayBuffer()).byteLength); } catch (er) { R.push("échec"); } } return R; });
  await ctx.setOffline(false);
  verif("Service worker : réseau coupé, il rend encore ces fichiers", hors.every(x => /^200:[1-9]/.test(x)), hors.join(", "));
  page.erreurs = page.erreurs.filter(x => !/net::ERR_INTERNET_DISCONNECTED|Failed to load resource/.test(x));
  bilan(page, "Service worker");
  await ctx.close();
}

(async () => {
  const srv = await demarrer(0); base = "http://127.0.0.1:" + srv.address().port;
  nav = await chromium.launch({ headless: !VOIR });
  try {
    testsFichiers();
    const SEUL = (process.argv.find(x => x.startsWith("--seul=")) || "").slice(7);   /* ex. --seul=testsEleve */
    const SERIES = { testsProf, testsEleve, testsServiceWorker };
    for (const [nom, f] of Object.entries(SERIES)) if (!SEUL || SEUL === nom) await f();
  } catch (e) { verif("Le test a planté", false, String(e && e.stack || e).slice(0, 500)); }
  finally { await nav.close(); srv.close(); }
  const ko = res.filter(x => !x.ok);
  console.log("\nRésultat : " + (res.length - ko.length) + "/" + res.length + " vérifications réussies.");
  process.exit(ko.length ? 1 : 0);
})();
