/* =====================================================================
   30 · Fonctions inspirées de Google Classroom (11/11/2026)
   1. Scanner un travail papier (photos → un seul PDF)
   2. Commentaires de classe sous chaque devoir (table commentaires_devoirs, étape 38)
   4. QR code du cours (rejoindre sans taper de code)
   6. Fiche PDF ou image annotée au doigt par l'élève
   7. « Afficher en tant qu'élève » (aperçu en lecture seule, côté prof)
   9. Lecture à voix haute des consignes
   (3. Annonces programmées et épinglées : 03-classe.js, 05-editeurs.js)
   ===================================================================== */
IC.clock = IC.clock || '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>';
IC.pin = IC.pin || '<path d="M9 4h6l-1 6 3 3v1H7v-1l3-3z"/><path d="M12 14v6"/>';
IC.speaker = IC.speaker || '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>';
IC.camera = IC.camera || '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>';
IC.qr = IC.qr || '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z"/><path d="M14 14h2v2h-2zM18 14h2M14 18h2M18 18h2v2"/>';

/* petits registres utilisés par 08-fenetres.js et 09-evenements.js */
const VUES_MODAL = {}, OK_MODAL = {}, ACTIONS_PLUS = {};
const APRES_RENDU = [];
function apresRenduPlus(){ for (const f of APRES_RENDU) { try { f(); } catch (e) { console.warn(e); } } }

/* ---------------------------------------------------------------- 9. Lecture à voix haute */
const voixOk = () => typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance === "function";
const LECT = { id: null };
/* bouton « Écouter » : lit le texte de l'élément #cible, ou le texte donné */
function btnEcouter(cible, texte, petit){
  if (!voixOk()) return "";
  const id = cible || "t" + Math.abs([...String(texte || "")].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) | 0, 7));
  const actif = LECT.id === id;
  return `<button type="button" class="ecoute${petit ? " sm" : ""}${actif ? " on" : ""}" data-act="ecouter" data-id="${esc(id)}" ${cible ? `data-cible="${esc(cible)}"` : `data-texte="${esc(texte || "")}"`} aria-label="${actif ? "Arrêter la lecture" : "Écouter à voix haute"}" title="${actif ? "Arrêter la lecture" : "Écouter à voix haute"}">${icon("speaker")}${petit ? "" : `<span>${actif ? "Arrêter" : "Écouter"}</span>`}</button>`;
}
function textePourVoix(t){
  return String(t || "").replace(/\s+/g, " ")
    .replace(/×\s*10\^?\s*(-?\d+)/g, " fois 10 puissance $1 ").replace(/\^(-?\d+)/g, " puissance $1 ")
    .replace(/²/g, " au carré").replace(/³/g, " au cube").replace(/→/g, " donne ").replace(/≈/g, " environ ")
    .replace(/\bm\/s\b/g, "mètres par seconde").replace(/\bkm\/h\b/g, "kilomètres par heure").trim();
}
function lireAVoixHaute(a){
  const ss = window.speechSynthesis, id = a.dataset.id;
  if (LECT.id === id) { ss.cancel(); LECT.id = null; render(); return; }
  ss.cancel();
  let t = a.dataset.texte || "";
  if (a.dataset.cible) { const el = document.getElementById(a.dataset.cible); t = el ? el.innerText || el.textContent : ""; }
  t = textePourVoix(t.replace(/<[^>]*>/g, " "));
  if (!t) { toast("Rien à lire."); return; }
  const u = new SpeechSynthesisUtterance(t); u.lang = "fr-FR"; u.rate = .95;
  const v = (ss.getVoices() || []).find(x => /^fr(-|_)FR/i.test(x.lang)) || (ss.getVoices() || []).find(x => /^fr/i.test(x.lang)); if (v) u.voice = v;
  u.onend = u.onerror = () => { if (LECT.id === id) { LECT.id = null; render(); } };
  LECT.id = id; ss.speak(u); render();
}
ACTIONS_PLUS.ecouter = (a, e) => { e.preventDefault(); lireAVoixHaute(a); };
window.addEventListener("hashchange", () => { if (LECT.id && voixOk()) { window.speechSynthesis.cancel(); LECT.id = null; } });

/* ---------------------------------------------------------------- 4. QR code du cours */
const lienInvitation = code => ICI + "#/rejoindre/" + encodeURIComponent(code || "");
APRES_RENDU.push(async () => {
  const z = document.getElementById("qrCours"); if (!z || z.dataset.fait) return;
  z.dataset.fait = "1";
  try {
    await chargerScript("qrcode.js?v=1", () => window.qrcode);
    const qr = window.qrcode(0, "M"); qr.addData(z.dataset.lien); qr.make();
    z.innerHTML = qr.createSvgTag({ cellSize: 8, margin: 2, scalable: true });
  } catch (_) { z.innerHTML = `<span class="muted">QR code indisponible : donne le code ci-dessus.</span>`; }
});

/* ---------------------------------------------------------------- 2. Commentaires de classe sous un devoir */
async function chargerComsDevoir(did){
  S.comsDv = S.comsDv || {};
  try { const { data, error } = await sb.from("commentaires_devoirs").select("*").eq("devoir_id", did).order("cree_le"); S.comsDv[did] = error ? [] : data || []; }
  catch (_) { S.comsDv[did] = []; }
}
function blocComsDevoir(d, c){
  if (!c || (!S.prof && !fluxVisible(c))) return "";
  const L = (S.comsDv || {})[d.id] || [], ouvert = S.open === "dv" + d.id || L.length <= 3, vus = ouvert ? L : L.slice(-2);
  return `<section class="dvcoms"><h3>${icon("people")} Commentaires de la classe${L.length ? ` <span class="muted">(${L.length})</span>` : ""}</h3>
    ${!L.length ? `<p class="muted" style="margin:0;font-size:.85rem">${S.prof ? "Les élèves peuvent poser ici une question que toute la classe verra." : "Une question sur ce travail ? Pose-la ici : toute la classe verra la réponse."}</p>` : ""}
    ${!ouvert ? `<button class="linkbtn" data-act="dvcomsouvrir" data-id="${d.id}">Voir les ${L.length} commentaires</button>` : ""}
    ${vus.map(x => `<div class="com">${avatarP(x.auteur_nom, "sm")}<div style="flex:1;min-width:0"><b>${esc(x.auteur_nom)}</b> <small class="muted">${fmtQuand(D(x.cree_le))}</small><div>${linkify(x.texte)}</div></div>${S.prof || x.auteur === S.user.id ? `<button class="ib sm" data-act="dvcomx" data-id="${x.id}" data-d="${d.id}" aria-label="Supprimer le commentaire" title="Supprimer">${icon("x")}</button>` : ""}</div>`).join("")}
    ${peutCommenter(c) ? `<div class="comform">${avatarP(S.nom, "sm")}<input id="dvcom-${d.id}" placeholder="Écrire un commentaire…" aria-label="Commentaire pour la classe" maxlength="2000" enterkeyhint="send"><button class="ib" data-act="dvcom" data-id="${d.id}" aria-label="Envoyer">${icon("send")}</button></div>` : ""}
  </section>`;
}
ACTIONS_PLUS.dvcomsouvrir = (a, e) => { e.preventDefault(); S.open = "dv" + a.dataset.id; render(); };
ACTIONS_PLUS.dvcom = async a => {
  const did = Number(a.dataset.id), inp = document.getElementById("dvcom-" + did), t = inp ? inp.value.trim() : ""; if (!t) return;
  a.disabled = true;
  const { error } = await sb.from("commentaires_devoirs").insert({ devoir_id: did, auteur_nom: S.nom, texte: t });
  if (error) { a.disabled = false; toast("Commentaire impossible : " + error.message); return; }
  await chargerComsDevoir(did); S.open = "dv" + did; render();
};
ACTIONS_PLUS.dvcomx = async a => {
  const { error } = await sb.from("commentaires_devoirs").delete().eq("id", a.dataset.id);
  if (error) { toast("Suppression impossible : " + error.message); return; }
  await chargerComsDevoir(Number(a.dataset.d)); render();
};
/* Entrée dans le champ = Envoyer (pratique sur téléphone) */
document.addEventListener("keydown", e => {
  const t = e.target; if (e.key !== "Enter" || !t || !t.id || !/^dvcom-\d+$/.test(t.id)) return;
  e.preventDefault(); const b = t.parentElement && t.parentElement.querySelector('[data-act="dvcom"]'); if (b) b.click();
});

/* ---------------------------------------------------------------- 1. Scanner un travail papier */
const SCAN = { pages: [] };
const nomFichierPropre = n => String(n || "fichier").replace(/[\\/:*?"<>|#%]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 90);
function imageDepuisFichier(f){
  return new Promise((ok, ko) => { const u = URL.createObjectURL(f), i = new Image(); i.onload = () => ok(i); i.onerror = () => { URL.revokeObjectURL(u); ko(new Error("photo illisible")); }; i.src = u; });
}
/* dessine la page (rotation, taille max, « améliorer » = fond blanc et écriture foncée) */
function dessinerPage(p, maxCote, ameliorer){
  const w0 = p.img.naturalWidth, h0 = p.img.naturalHeight, k = Math.min(1, maxCote / Math.max(w0, h0));
  const w = Math.round(w0 * k), h = Math.round(h0 * k), tourne = p.rot % 180 !== 0;
  const c = document.createElement("canvas"); c.width = tourne ? h : w; c.height = tourne ? w : h;
  const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
  g.translate(c.width / 2, c.height / 2); g.rotate(p.rot * Math.PI / 180); g.drawImage(p.img, -w / 2, -h / 2, w, h); g.setTransform(1, 0, 0, 1, 0, 0);
  if (ameliorer) {
    const im = g.getImageData(0, 0, c.width, c.height), px = im.data, hist = new Uint32Array(256), n = px.length / 4;
    for (let i = 0; i < px.length; i += 4) { const y = (px[i] * 77 + px[i + 1] * 150 + px[i + 2] * 29) >> 8; px[i] = y; hist[y]++; }
    let s = 0, lo = 0, hi = 255; for (let v = 0; v < 256; v++) { s += hist[v]; if (s >= n * .01) { lo = v; break; } }
    s = 0; for (let v = 255; v >= 0; v--) { s += hist[v]; if (s >= n * .25) { hi = v; break; } }
    if (hi - lo < 40) { lo = Math.max(0, hi - 120); }
    const lut = new Uint8ClampedArray(256); for (let v = 0; v < 256; v++) { const x = (v - lo) / Math.max(1, hi - lo); lut[v] = 255 * Math.pow(Math.min(1, Math.max(0, x)), 1.6); }
    for (let i = 0; i < px.length; i += 4) { const y = lut[px[i]]; px[i] = px[i + 1] = px[i + 2] = y; }
    g.putImageData(im, 0, 0);
  }
  return c;
}
async function ajouterPagesScan(files){
  for (const f of files) {
    if (!/^image\//.test(f.type || "") && !/\.(jpe?g|png|heic|heif|webp)$/i.test(f.name || "")) { toast("« " + (f.name || "fichier") + " » n'est pas une photo."); continue; }
    try { const img = await imageDepuisFichier(f), p = { img, rot: 0 }; p.vign = dessinerPage(p, 260, SCAN.ameliorer !== false).toDataURL("image/jpeg", .7); SCAN.pages.push(p); }
    catch (e) { toast("Photo illisible : " + (e.message || e) + ". Sur iPhone, réglage Appareil photo > Formats > « Le plus compatible »."); }
  }
  render();
}
const majVignettes = () => SCAN.pages.forEach(p => { p.vign = dessinerPage(p, 260, SCAN.ameliorer !== false).toDataURL("image/jpeg", .7); });
VUES_MODAL.scan = m => {
  const P = SCAN.pages;
  return { foot: false, body: `<h2>${icon("camera")} Scanner mon travail</h2>
    <p class="muted" style="margin:0;font-size:.9rem">Prends en photo chaque page, bien à plat, avec de la lumière. Toutes les pages formeront <b>un seul PDF</b>.</p>
    ${P.length ? `<div class="scanpages">${P.map((p, i) => `<div class="scanpage"><img src="${p.vign}" alt="Page ${i + 1}"><span class="scannum">Page ${i + 1}</span>
      <div class="scanbtns"><button type="button" class="ib sm" data-act="scanrot" data-i="${i}" aria-label="Tourner la page ${i + 1}" title="Tourner">↻</button>${i ? `<button type="button" class="ib sm" data-act="scanavant" data-i="${i}" aria-label="Avancer la page ${i + 1}" title="Mettre avant">←</button>` : ""}<button type="button" class="ib sm" data-act="scanrm" data-i="${i}" aria-label="Retirer la page ${i + 1}" title="Retirer">✕</button></div></div>`).join("")}</div>` : ""}
    <div class="scanadd"><label class="btn">${icon("camera")} ${P.length ? "Photo de la page suivante" : "Prendre une photo"}<input type="file" id="scanCam" accept="image/*" capture="environment" hidden></label>
      <label class="btn ghost">${icon("upload")} Choisir dans mes photos<input type="file" id="scanGal" accept="image/*" multiple hidden></label></div>
    <label class="check"><input type="checkbox" id="scanAmel" ${SCAN.ameliorer !== false ? "checked" : ""}> Rendre plus lisible (fond blanc, écriture plus foncée)</label>
    <div class="scanfin">${P.length ? `<button class="btn" data-act="scanpdf" ${m.busy ? "disabled" : ""}>${icon("check")} ${m.busy ? "Création du PDF…" : `C'est fini : ajouter à mon travail (${P.length} page${P.length > 1 ? "s" : ""})`}</button>` : ""}<button class="btn ghost" data-act="mclose">Annuler</button></div>` };
};
ACTIONS_PLUS.scanner = (a, e) => { e.preventDefault(); S.menu = null; SCAN.pages = []; S.modal = { kind: "scan", did: a.dataset.id }; render(); };
ACTIONS_PLUS.scanrot = a => { const p = SCAN.pages[Number(a.dataset.i)]; if (!p) return; p.rot = (p.rot + 90) % 360; p.vign = dessinerPage(p, 260, SCAN.ameliorer !== false).toDataURL("image/jpeg", .7); render(); };
ACTIONS_PLUS.scanrm = a => { SCAN.pages.splice(Number(a.dataset.i), 1); render(); };
ACTIONS_PLUS.scanavant = a => { const i = Number(a.dataset.i); if (i > 0) { const [p] = SCAN.pages.splice(i, 1); SCAN.pages.splice(i - 1, 0, p); } render(); };
ACTIONS_PLUS.scanpdf = async a => {
  const m = S.modal; if (!m || !SCAN.pages.length) return;
  m.busy = true; render();
  try {
    await chargerScript(JSPDF, () => window.jspdf);
    const A4 = [595.28, 841.89]; let doc = null;
    for (const p of SCAN.pages) {
      const c = dessinerPage(p, 1800, SCAN.ameliorer !== false), pay = c.width > c.height, [W, H] = pay ? [A4[1], A4[0]] : A4;
      const k = Math.min(W / c.width, H / c.height), w = c.width * k, h = c.height * k;
      if (!doc) doc = new window.jspdf.jsPDF({ orientation: pay ? "l" : "p", unit: "pt", format: "a4", compress: true }); else doc.addPage("a4", pay ? "l" : "p");
      doc.addImage(c.toDataURL("image/jpeg", .72), "JPEG", (W - w) / 2, (H - h) / 2, w, h);
    }
    const d = S.devoirs.find(x => String(x.id) === String(m.did)), nom = nomFichierPropre("Travail scanné - " + ((d && d.titre) || "devoir")) + ".pdf";
    const f = new File([doc.output("blob")], nom, { type: "application/pdf" });
    if (f.size > 50e6) throw new Error("PDF trop lourd (plus de 50 Mo) : enlève des pages");
    S.files.push(f); SCAN.pages.forEach(p => URL.revokeObjectURL(p.img.src)); SCAN.pages = []; S.modal = null; render();
    toast("PDF ajouté à ton travail. Appuie sur « Rendre » pour l'envoyer.");
  } catch (e) { m.busy = false; m.err = "Création du PDF impossible : " + (e.message || e); render(); }
};
APRES_RENDU.push(() => {
  const cam = document.getElementById("scanCam"), gal = document.getElementById("scanGal"), am = document.getElementById("scanAmel");
  for (const inp of [cam, gal]) if (inp && !inp.onchange) inp.onchange = () => { const f = [...inp.files]; inp.value = ""; if (f.length) ajouterPagesScan(f); };
  if (am && !am.onchange) am.onchange = () => { SCAN.ameliorer = am.checked; majVignettes(); render(); };
});

/* ---------------------------------------------------------------- 6. Fiche annotée au doigt par l'élève */
const ficheAnnotable = r => r && r.path && !r.od && ["png", "jpg", "jpeg", "webp", "gif", "pdf"].includes(extDe(r.label || r.path));
ACTIONS_PLUS.ecrirefiche = async (a, e) => {
  e.preventDefault(); S.menu = null; render();
  const d = S.devoirs.find(x => String(x.id) === a.dataset.id), r = d && (d.ressources || [])[Number(a.dataset.i)]; if (!ficheAnnotable(r)) return;
  const { data, error } = await sb.storage.from("documents").createSignedUrl(r.path, 3600);
  if (error || !data || !data.signedUrl) { toast("Fiche introuvable."); return; }
  ouvrirAnnotEleve(data.signedUrl, r.label || r.path.split("/").pop(), d);
};
async function ouvrirAnnotEleve(url, nom, d){
  const ov = document.createElement("div"); ov.className = "annot annot-eleve";
  ov.innerHTML = `<div class="anbar"><b>${icon("pen")} ${esc(nom)}</b><span class="spacer"></span>
    <button class="btn sm on" data-o="bleu" style="--x:#1a56db">${icon("pen")} Bleu</button><button class="btn sm" data-o="noir" style="--x:#202124">Noir</button><button class="btn sm" data-o="vert" style="--x:#188038">Vert</button><button class="btn sm" data-o="surligneur" style="--x:#fbbc04">Surligneur</button>
    <button class="btn ghost sm" data-o="defiler" aria-pressed="false">✋ Défiler</button><button class="btn ghost sm" data-o="annuler">↶ Annuler</button><button class="btn ghost sm" data-o="fermer">Fermer</button><button class="btn sm" data-o="finir">${icon("check")} Ajouter à mon travail</button></div>
    <p class="anaide">Écris avec le doigt ou le stylet. Pour descendre dans la fiche, appuie sur <b>✋ Défiler</b>, puis de nouveau pour écrire.</p>
    <div class="anpages"><div class="vempty">Chargement…</div></div>`;
  document.body.appendChild(ov); document.body.style.overflow = "hidden";
  AN.pages = []; AN.hist = []; AN.outil = "stylo"; AN.couleur = "#1a56db";
  const zone = ov.querySelector(".anpages");
  try {
    const fonds = [];
    if (extDe(nom) === "pdf" || /\.pdf(\?|$)/i.test(url)) {
      await chargerScript(PDFJS, () => window.pdfjsLib); window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_W;
      const pdf = await window.pdfjsLib.getDocument({ url }).promise, n = Math.min(pdf.numPages, 15);
      for (let i = 1; i <= n; i++) { const p = await pdf.getPage(i), vp0 = p.getViewport({ scale: 1 }), vp = p.getViewport({ scale: Math.min(2, 1400 / vp0.width) });
        const c = document.createElement("canvas"); c.width = vp.width; c.height = vp.height; await p.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise; fonds.push(c); }
      if (pdf.numPages > 15) toast("Seules les 15 premières pages sont modifiables.");
    } else {
      const img = await new Promise((ok, ko) => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => ok(i); i.onerror = () => ko(new Error("image illisible")); i.src = url; });
      const k = Math.min(1, 1600 / img.naturalWidth), c = document.createElement("canvas"); c.width = img.naturalWidth * k; c.height = img.naturalHeight * k; c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); fonds.push(c);
    }
    zone.innerHTML = "";
    fonds.forEach((fond, i) => { const w = document.createElement("div"); w.className = "anpage"; const des = document.createElement("canvas"); des.width = fond.width; des.height = fond.height; w.append(fond, des); zone.appendChild(w); AN.pages.push({ fond, des }); brancherDessin(des, i); });
  } catch (e) { zone.innerHTML = `<div class="vempty">Impossible d'ouvrir cette fiche : ${esc(e.message || e)}</div>`; }
  ov.addEventListener("click", async ev => {
    const b = ev.target.closest("[data-o]"); if (!b) return; const o = b.dataset.o;
    const COUL = { bleu: "#1a56db", noir: "#202124", vert: "#188038", surligneur: "#fbbc04" };
    if (o === "defiler") { const on = ov.classList.toggle("defile"); b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); return; }
    if (COUL[o]) { ov.classList.remove("defile"); ov.querySelector('[data-o="defiler"]').classList.remove("on"); AN.outil = o === "surligneur" ? "surligneur" : "stylo"; AN.couleur = COUL[o]; ov.querySelectorAll(".anbar [data-o]").forEach(x => { if (COUL[x.dataset.o]) x.classList.toggle("on", x === b); }); return; }
    if (o === "annuler") { const h = AN.hist.pop(); if (h) AN.pages[h.i].des.getContext("2d").putImageData(h.img, 0, 0); return; }
    if (o === "fermer") { if (AN.hist.length && !confirmerFermeture(ov)) return; fermerAnnotation(ov); return; }
    if (o === "finir") {
      if (!AN.pages.length) return;
      b.disabled = true; b.textContent = "Préparation…";
      try {
        await chargerScript(JSPDF, () => window.jspdf);
        const fus = AN.pages.map(p => { const c = document.createElement("canvas"); c.width = p.fond.width; c.height = p.fond.height; const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(p.fond, 0, 0); g.drawImage(p.des, 0, 0); return c; });
        const p0 = fus[0], doc = new window.jspdf.jsPDF({ orientation: p0.width > p0.height ? "l" : "p", unit: "px", format: [p0.width, p0.height], compress: true });
        fus.forEach((c, i) => { if (i) doc.addPage([c.width, c.height], c.width > c.height ? "l" : "p"); doc.addImage(c.toDataURL("image/jpeg", .8), "JPEG", 0, 0, c.width, c.height); });
        const base = nomFichierPropre((S.nom || "élève") + " - " + nom.replace(/\.[^.]+$/, ""));
        S.files.push(new File([doc.output("blob")], base + ".pdf", { type: "application/pdf" }));
        fermerAnnotation(ov); render(); toast("Ta fiche est ajoutée à ton travail. Appuie sur « Rendre » pour l'envoyer.");
      } catch (e) { b.disabled = false; b.textContent = "Ajouter à mon travail"; toast("Impossible : " + (e.message || e)); }
    }
  });
}

/* ---------------------------------------------------------------- 7. « Afficher en tant qu'élève » */
const VUE_ELEVE_OK = new Set(["menu", "opencoms", "dvcomsouvrir", "ecouter", "quittervue", "mclose", "week"]);
/* la page affichée appartient-elle au cours en aperçu ? */
function dansVueEleve(r){
  if (!S.vueEleve || !S.prof) return false;
  if (r.v === "classe") return r.a === S.vueEleve && r.t !== "parametres" && r.t !== "corriger";
  if (r.v === "devoir") { const d = S.devoirs.find(x => String(x.id) === r.a); return !!d && d.classe_id === S.vueEleve; }
  if (r.v === "quiz") { const q = S.quiz.find(x => String(x.id) === r.a); return !!q && q.classe_id === S.vueEleve; }
  return false;
}
const visibleEleve = o => o && !o.brouillon && (!o.publie_le || D(o.publie_le) <= now()) && !(o.eleves && o.eleves.length);
/* exécute f() comme si le prof était un élève sans travail rendu ; tout est remis en place ensuite */
function enVueEleve(f, r){
  if (!dansVueEleve(r)) return f();
  const c = cls(S.vueEleve), garde = { prof: S.prof, devoirs: S.devoirs, quiz: S.quiz, rendus: S.rendus, corrections: S.corrections, resultats: S.resultats, copies: S.copies, cache: S.cache[S.vueEleve], ed: S.ed, annonce: S.annonce };
  try {
    S.prof = false; S.devoirs = S.devoirs.filter(visibleEleve); S.quiz = S.quiz.filter(visibleEleve);
    S.rendus = []; S.corrections = []; S.resultats = []; S.copies = []; S.ed = null; S.annonce = null;
    if (garde.cache) S.cache[S.vueEleve] = { ...garde.cache, supports: (garde.cache.supports || []).filter(visibleEleve), annonces: (garde.cache.annonces || []).filter(a => D(a.publie_le || a.cree_le) <= now()) };
    const masque = c && c.flux_mode === "masque" && r.v === "classe" && (r.t === "flux" || !r.t);
    const html = masque ? `<div class="page"><div class="emptystate"><b>Le flux est masqué aux élèves.</b><a href="#/classe/${esc(c.id)}/travaux">Voir les travaux</a></div></div>` : f();
    return `<div class="vuebar" role="status">${icon("eye")}<span><b>Aperçu élève</b> · tu vois ${c ? "« " + esc(c.nom) + " »" : "ce cours"} comme un élève qui n'a encore rien rendu. Rien n'est modifiable.</span><button class="btn sm" data-act="quittervue">Quitter l'aperçu</button></div>` + html;
  } finally {
    S.prof = garde.prof; S.devoirs = garde.devoirs; S.quiz = garde.quiz; S.rendus = garde.rendus; S.corrections = garde.corrections; S.resultats = garde.resultats; S.copies = garde.copies; S.ed = garde.ed; S.annonce = garde.annonce;
    if (garde.cache) S.cache[S.vueEleve] = garde.cache;
  }
}
/* bloque toute action pendant l'aperçu (sauf lire, ouvrir les menus, quitter) */
function bloqueVueEleve(act, e){
  if (!S.vueEleve || !dansVueEleve(route()) || VUE_ELEVE_OK.has(act)) return false;
  e.preventDefault(); toast("Aperçu élève : les actions sont désactivées. Appuie sur « Quitter l'aperçu » pour revenir."); return true;
}
ACTIONS_PLUS.vueeleve = (a, e) => { e.preventDefault(); S.menu = null; S.vueEleve = a.dataset.c; const r = route(); if (r.v !== "classe" || r.a !== a.dataset.c || r.t === "parametres" || r.t === "corriger") go("/classe/" + a.dataset.c); else render(); window.scrollTo(0, 0); };
ACTIONS_PLUS.quittervue = (a, e) => { e.preventDefault(); S.vueEleve = null; render(); toast("Aperçu élève terminé"); };
window.addEventListener("hashchange", () => { if (S.vueEleve && !dansVueEleve(route())) S.vueEleve = null; });
