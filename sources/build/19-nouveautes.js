/* =====================================================================
   Nouveautés : compétences · copies annotées et vocal ·
                alertes décrochage · rappels · rendez-vous
   ===================================================================== */
IC.flask = '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3"/><path d="M7.5 15h9"/>';
IC.rdv = '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/><path d="M9.5 15l2 2 3.5-4"/>';
IC.pen = '<path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 6l3 3"/>';
IC.mic = '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>';
IC.alerte = '<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.1"/>';
IC.print = '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>';

/* 1. (Demande de matériel au préparateur : retirée le 14/11/2026 à la demande de Jalal) */

/* ---------------------------------------------------------------- 2. Compétences */
const COMP = [["APP", "S'approprier"], ["ANA", "Analyser – Raisonner"], ["REA", "Réaliser"], ["VAL", "Valider"], ["COM", "Communiquer"]];
const NIV = { A: "Très bonne maîtrise", B: "Maîtrise satisfaisante", C: "Maîtrise fragile", D: "Maîtrise insuffisante" };
const blocCompetences = cr => { const v = (cr && cr.competences) || {};
  return `<details class="compbloc" ${Object.keys(v).length ? "open" : ""}><summary><b>Compétences</b> <span class="muted">(facultatif · A très bonne maîtrise … D insuffisante)</span></summary><div class="comprow">${COMP.map(([k, l]) => `<label title="${esc(l)}"><span>${k}</span><select id="comp-${k}" aria-label="${esc(l)}"><option value="">–</option>${"ABCD".split("").map(n => `<option ${v[k] === n ? "selected" : ""}>${n}</option>`).join("")}</select></label>`).join("")}</div></details>`; };
const lireCompetences = () => { const o = {}; COMP.forEach(([k]) => { const x = (document.getElementById("comp-" + k) || {}).value; if (x) o[k] = x; }); return Object.keys(o).length ? o : null; };
const badgesCompetences = v => v && Object.keys(v).length ? `<div class="compbadges">${COMP.filter(([k]) => v[k]).map(([k, l]) => `<span class="cb n${v[k]}" title="${esc(l)} : ${NIV[v[k]]}"><b>${k}</b>${v[k]}</span>`).join("")}</div>` : "";
/* profil : niveau le plus fréquent (à égalité, le plus récent) */
function profilCompetences(cid, email){
  const L = S.devoirs.filter(d => d.classe_id === cid && !d.brouillon).map(d => { const r = renduDe(d, email), c = correctionDe(r); return c && c.publiee && c.competences ? { t: D(c.modifie_le || d.publie_le), v: c.competences } : null; }).filter(Boolean).sort((a, b) => a.t - b.t);
  const res = {}; COMP.forEach(([k]) => { const vals = L.map(x => x.v[k]).filter(Boolean); if (!vals.length) return; const n = {}; vals.forEach(x => n[x] = (n[x] || 0) + 1); const max = Math.max(...Object.values(n));
    res[k] = { niv: [...vals].reverse().find(x => n[x] === max), nb: vals.length, hist: vals }; });
  return res;
}
const tableCompetencesEleve = (cid, email) => { const p = profilCompetences(cid, email); if (!Object.keys(p).length) return "";
  return `<section class="edcard"><h2 style="font-size:1.1rem">Mes compétences</h2><p class="muted" style="margin:0;font-size:.85rem">Niveau le plus fréquent sur tes travaux corrigés (A très bonne maîtrise · B satisfaisante · C fragile · D insuffisante).</p>
    <div class="complist">${COMP.map(([k, l]) => p[k] ? `<div class="compl"><span class="cb n${p[k].niv}"><b>${k}</b>${p[k].niv}</span><span>${esc(l)}</span><span class="muted mono" title="Historique">${p[k].hist.join(" ")}</span></div>` : `<div class="compl"><span class="cb"><b>${k}</b>–</span><span>${esc(l)}</span><span class="muted">pas encore évaluée</span></div>`).join("")}</div></section>`; };
function tableCompetencesClasse(c){
  const el = inscritsDe(c.id); if (!el.length) return "";
  const lignes = el.map(e => ({ e, p: profilCompetences(c.id, e.email) })).filter(x => Object.keys(x.p).length);
  if (!lignes.length) return `<section class="edcard"><h2 style="font-size:1.1rem">Compétences</h2><p class="muted" style="margin:0">Aucune compétence évaluée dans ce cours. Quand tu notes un travail, ouvre « Compétences » sous la note pour cocher A, B, C ou D.</p></section>`;
  return `<section class="edcard"><h2 style="font-size:1.1rem">Compétences de la démarche scientifique</h2><p class="muted" style="margin:0;font-size:.85rem">Niveau le plus fréquent de chaque élève sur les travaux rendus.</p>
    <div class="tablewrap" tabindex="0" role="region" aria-label="Tableau"><table class="admtable"><thead><tr><th class="first">Élève</th>${COMP.map(([k, l]) => `<th title="${esc(l)}">${k}</th>`).join("")}</tr></thead><tbody>
    ${lignes.map(({ e, p }) => `<tr><td class="first">${esc(e.nom)}</td>${COMP.map(([k]) => `<td>${p[k] ? `<span class="cb n${p[k].niv}" title="${p[k].hist.join(" ")}">${p[k].niv}</span>` : "–"}</td>`).join("")}</tr>`).join("")}</tbody></table></div></section>`;
}

/* ---------------------------------------------------------------- 3. Copies annotées et commentaire vocal */
async function chargerScript(url, test){ if (test()) return; await new Promise((ok, ko) => { const s = document.createElement("script"); s.src = url; s.onload = ok; s.onerror = () => ko(new Error("bibliothèque introuvable")); document.head.appendChild(s); }); }
/* bibliothèques rangées dans le site depuis le 14/11/2026 (dossier bibliotheques/, fichiers des paquets npm, voir son LISEZMOI.txt) : plus aucun appel à cdnjs.
   Le numéro de version est dans le nom du dossier ; « ?v=1 » fait garder le fichier par le service worker (copie locale d'abord). */
const PDFJS = "bibliotheques/pdfjs-3.11.174/pdf.min.js?v=1", PDFJS_W = "bibliotheques/pdfjs-3.11.174/pdf.worker.min.js?v=1", JSPDF = "bibliotheques/jspdf-2.5.1/jspdf.umd.min.js?v=1";
/* déposer un fichier du prof pour l'élève : OneDrive (partagé avec l'élève et son binôme) ou, sinon, stockage du site */
async function deposerPourEleve(d, rd, nom, blob){
  if (odActif()) {
    const item = await odPut(cheminOD([OD_RACINE, ...dossierTravail(d.classe_id, d.theme_id, d.titre), "Travaux rendus", nom]), blob);
    const dest = [rd.auteur_email, rd.binome_email].filter(Boolean).map(email => ({ email }));
    await graph("/me/drive/items/" + item.id + "/invite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipients: dest, roles: ["read"], requireSignIn: true, sendInvitation: false }) });
    return { nom, od: { id: item.id, web: item.webUrl } };
  }
  const chemin = d.id + "/" + rd.auteur + "/prof-" + Date.now() + "-" + safeName(nom);
  const { error } = await sb.storage.from("rendus").upload(chemin, blob, { upsert: false, contentType: blob.type }); if (error) throw error;
  return { nom, chemin };
}
async function ajouterACorrection(rdId, champ, f){
  const cr = S.corrections.find(c => c.rendu_id === rdId), liste = [...((cr && cr[champ]) || []), f];
  const r = cr ? await sb.from("corrections").update({ [champ]: liste, modifie_le: now().toISOString() }).eq("rendu_id", rdId)
               : await sb.from("corrections").insert({ rendu_id: rdId, [champ]: liste, publiee: false });
  if (r.error) throw r.error;
  await rafraichir();
}
async function retirerDeCorrection(rdId, champ, i){
  const cr = S.corrections.find(c => c.rendu_id === rdId); if (!cr) return;
  const liste = (cr[champ] || []).filter((_, j) => j !== i);
  const { error } = await sb.from("corrections").update({ [champ]: liste }).eq("rendu_id", rdId); if (error) return toast("Action impossible : " + error.message);
  await rafraichir(); render();
}
const peutAnnoter = f => f && ["png", "jpg", "jpeg", "gif", "webp", "bmp", "pdf"].includes(extDe(f.nom));
/* éditeur d'annotation (fenêtre plein écran, hors du rendu de la page pour garder le dessin) */
const AN = { pages: [], outil: "stylo", couleur: "#d93025", hist: [] };
async function ouvrirAnnotation(){
  const V = S.viewer, d = S.devoirs.find(x => x.id === V.did), rd = renduDe(d, V.email), f = rd && (rd.fichiers || [])[V.fi || 0];
  if (!peutAnnoter(f)) return toast("Annotation possible sur les photos et les PDF.");
  const url = await urlRendu(f); if (!url) return toast("Fichier introuvable.");
  const ov = document.createElement("div"); ov.className = "annot"; ov.innerHTML = `<div class="anbar"><b>${icon("pen")} Annoter · ${esc(f.nom)}</b><span class="spacer"></span>
    <button class="btn sm on" data-o="stylo" style="--x:#d93025">${icon("pen")} Stylo rouge</button><button class="btn sm" data-o="vert" style="--x:#188038">Stylo vert</button><button class="btn sm" data-o="surligneur" style="--x:#fbbc04">Surligneur</button><button class="btn sm" data-o="texte">T Texte</button>
    <button class="btn ghost sm" data-o="annuler">↶ Annuler</button><button class="btn ghost sm" data-o="fermer">Fermer</button><button class="btn sm" data-o="enregistrer">${icon("send")} Enregistrer pour l'élève</button></div>
    <div class="anpages"><div class="vempty">Chargement…</div></div>`;
  document.body.appendChild(ov); document.body.style.overflow = "hidden";
  AN.pages = []; AN.hist = []; AN.outil = "stylo"; AN.couleur = "#d93025"; AN.ctx = { d, rd, f };
  const zone = ov.querySelector(".anpages");
  try {
    const fonds = [];
    if (extDe(f.nom) === "pdf") {
      await chargerScript(PDFJS, () => window.pdfjsLib); window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_W;
      /* isEvalSupported:false = second verrou contre la faille CVE-2024-4367 de pdf.js (avant 4.2.67), en plus de la règle CSP de index.html */
      const pdf = await window.pdfjsLib.getDocument({ url, isEvalSupported: false }).promise, n = Math.min(pdf.numPages, 15);
      for (let i = 1; i <= n; i++) { const p = await pdf.getPage(i), vp0 = p.getViewport({ scale: 1 }), vp = p.getViewport({ scale: Math.min(2, 1400 / vp0.width) });
        const c = document.createElement("canvas"); c.width = vp.width; c.height = vp.height; await p.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise; fonds.push(c); }
      if (pdf.numPages > 15) toast("Seules les 15 premières pages sont annotables.");
    } else {
      const img = await new Promise((ok, ko) => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => ok(i); i.onerror = () => ko(new Error("image illisible")); i.src = url; });
      const k = Math.min(1, 1600 / img.naturalWidth), c = document.createElement("canvas"); c.width = img.naturalWidth * k; c.height = img.naturalHeight * k; c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); fonds.push(c);
    }
    zone.innerHTML = "";
    fonds.forEach((fond, i) => { const w = document.createElement("div"); w.className = "anpage"; const des = document.createElement("canvas"); des.width = fond.width; des.height = fond.height; w.append(fond, des); zone.appendChild(w); AN.pages.push({ fond, des }); brancherDessin(des, i); });
  } catch (e) { zone.innerHTML = `<div class="vempty">Impossible d'ouvrir ce fichier pour l'annoter : ${esc(e.message || e)}</div>`; }
  ov.addEventListener("click", async ev => { const b = ev.target.closest("[data-o]"); if (!b) return; const o = b.dataset.o;
    if (["stylo", "vert", "surligneur", "texte"].includes(o)) { AN.outil = o === "vert" ? "stylo" : o; AN.couleur = o === "vert" ? "#188038" : o === "surligneur" ? "#fbbc04" : "#d93025"; ov.querySelectorAll("[data-o]").forEach(x => x.classList.toggle("on", x === b)); return; }
    if (o === "annuler") { const h = AN.hist.pop(); if (h) { const g = AN.pages[h.i].des.getContext("2d"); g.putImageData(h.img, 0, 0); } return; }
    if (o === "fermer") { if (AN.hist.length && !confirmerFermeture(ov)) return; fermerAnnotation(ov); return; }
    if (o === "enregistrer") { b.disabled = true; b.textContent = "Enregistrement…"; try { await enregistrerAnnotation(); fermerAnnotation(ov); toast("Copie corrigée enregistrée : l'élève la verra quand tu lui rendras le travail."); render(); } catch (e) { b.disabled = false; b.textContent = "Enregistrer pour l'élève"; toast("Enregistrement impossible : " + (e.message || e)); } }
  });
}
function confirmerFermeture(ov){ const bar = ov.querySelector(".anbar"); if (bar.dataset.sure) return true; bar.dataset.sure = "1"; toast("Tes annotations ne sont pas enregistrées : clique encore sur Fermer pour les abandonner."); return false; }
function fermerAnnotation(ov){ ov.remove(); document.body.style.overflow = ""; AN.pages = []; AN.hist = []; }
function brancherDessin(cv, i){
  const g = cv.getContext("2d"); let actif = false, x0 = 0, y0 = 0;
  const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height]; };
  cv.addEventListener("pointerdown", e => { e.preventDefault(); AN.hist.push({ i, img: g.getImageData(0, 0, cv.width, cv.height) }); if (AN.hist.length > 40) AN.hist.shift();
    const [x, y] = pos(e);
    if (AN.outil === "texte") { const t = prompt("Texte à écrire sur la copie :"); if (t) { g.globalCompositeOperation = "source-over"; g.globalAlpha = 1; g.fillStyle = "#d93025"; g.font = `bold ${Math.round(cv.width / 45)}px system-ui, sans-serif`; t.split("\n").forEach((l, k) => g.fillText(l, x, y + k * cv.width / 38)); } else AN.hist.pop(); return; }
    actif = true; x0 = x; y0 = y; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener("pointermove", e => { if (!actif) return; const [x, y] = pos(e); g.lineCap = g.lineJoin = "round";
    if (AN.outil === "surligneur") { g.globalCompositeOperation = "multiply"; g.globalAlpha = .35; g.lineWidth = cv.width / 55; } else { g.globalCompositeOperation = "source-over"; g.globalAlpha = 1; g.lineWidth = Math.max(2.5, cv.width / 450); }
    g.strokeStyle = AN.couleur; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x, y); g.stroke(); x0 = x; y0 = y; });
  const fin = () => { actif = false; }; cv.addEventListener("pointerup", fin); cv.addEventListener("pointercancel", fin);
}
async function enregistrerAnnotation(){
  const { d, rd, f } = AN.ctx; if (!AN.pages.length) throw new Error("rien à enregistrer");
  await chargerScript(JSPDF, () => window.jspdf);
  const fus = AN.pages.map(p => { const c = document.createElement("canvas"); c.width = p.fond.width; c.height = p.fond.height; const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(p.fond, 0, 0); g.drawImage(p.des, 0, 0); return c; });
  const p0 = fus[0], doc = new window.jspdf.jsPDF({ orientation: p0.width > p0.height ? "l" : "p", unit: "px", format: [p0.width, p0.height], compress: true });
  fus.forEach((c, i) => { if (i) doc.addPage([c.width, c.height], c.width > c.height ? "l" : "p"); doc.addImage(c.toDataURL("image/jpeg", .82), "JPEG", 0, 0, c.width, c.height); });
  const nom = nomOD(nomDe(d.classe_id, rd.auteur_email) + " - corrigé - " + f.nom.replace(/\.[^.]+$/, "")) + ".pdf";
  const fic = await deposerPourEleve(d, rd, nom, doc.output("blob"));
  await ajouterACorrection(rd.id, "annotations", fic);
}
/* commentaire vocal */
const VOC = { rec: null, morceaux: [], t0: 0, timer: null };
const blocVocal = (rd, cr) => { const A = (cr && cr.audio) || [], N = (cr && cr.annotations) || [];
  return `<div class="vocal"><b style="font-size:.9rem">Copie corrigée et commentaire vocal</b>
    ${N.map((x, i) => `<div class="pj">${icon("pen")} ${lienFichierProf(x)}<button class="ib sm" data-act="rmannot" data-id="${rd.id}" data-i="${i}" title="Retirer" aria-label="Retirer la copie corrigée">${icon("x")}</button></div>`).join("")}
    ${A.map((x, i) => `<div class="pj">${icon("mic")} ${lienFichierProf(x)}<button class="ib sm" data-act="rmaudio" data-id="${rd.id}" data-i="${i}" title="Retirer" aria-label="Retirer le commentaire vocal">${icon("x")}</button></div>`).join("")}
    <div style="display:flex;gap:8px;flex-wrap:wrap">${(rd.fichiers || []).some(peutAnnoter) ? `<button class="btn ghost sm" data-act="annoter" data-id="${rd.id}">${icon("pen")} Annoter la copie</button>` : ""}
      <button class="btn ghost sm vocbtn" data-act="vocal" data-id="${rd.id}">${icon("mic")} ${VOC.rec ? "Arrêter et enregistrer" : "Commentaire vocal"}</button><span class="muted vocinfo" style="font-size:.8rem;align-self:center"></span></div></div>`; };
const lienFichierProf = x => x.od ? `<a href="${esc(x.od.web)}" target="_blank" rel="noopener">${esc(x.nom)}</a>` : `<a href="#" data-act="dlfile" data-bucket="rendus" data-path="${esc(x.chemin)}" data-nom="${esc(x.nom)}">${esc(x.nom)}</a>`;
async function basculerVocal(a){
  const rd = S.rendus.find(r => String(r.id) === a.dataset.id), d = rd && S.devoirs.find(x => x.id === rd.devoir_id); if (!rd) return;
  if (VOC.rec) { VOC.rec.stop(); return; }
  if (!navigator.mediaDevices || !window.MediaRecorder) return toast("Ce navigateur ne permet pas d'enregistrer le son.");
  let flux; try { flux = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { return toast("Micro refusé : autorise le micro pour ce site dans le navigateur."); }
  const type = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find(t => MediaRecorder.isTypeSupported(t)) || "";
  VOC.morceaux = []; VOC.rec = new MediaRecorder(flux, type ? { mimeType: type } : undefined); VOC.t0 = Date.now();
  VOC.rec.ondataavailable = e => { if (e.data.size) VOC.morceaux.push(e.data); };
  VOC.rec.onstop = async () => { clearInterval(VOC.timer); flux.getTracks().forEach(t => t.stop()); const mt = VOC.rec.mimeType || "audio/webm"; VOC.rec = null; render();
    const blob = new Blob(VOC.morceaux, { type: mt }), ext = /mp4/.test(mt) ? "m4a" : "webm";
    if (blob.size < 2000) return toast("Enregistrement trop court.");
    try { toast("Envoi du commentaire vocal…"); const nom = nomOD(nomDe(d.classe_id, rd.auteur_email) + " - commentaire vocal - " + fmtShort(now()) + " " + hm(now()).replace(":", "h")) + "." + ext;
      await ajouterACorrection(rd.id, "audio", await deposerPourEleve(d, rd, nom, blob)); toast("Commentaire vocal enregistré : l'élève l'écoutera quand tu lui rendras le travail."); render(); }
    catch (e) { toast("Envoi impossible : " + (e.message || e)); } };
  VOC.rec.start(); render();
  VOC.timer = setInterval(() => { const s = Math.round((Date.now() - VOC.t0) / 1000), el = document.querySelector(".vocinfo"); if (el) el.textContent = "● " + s + " s / 120 s"; if (s >= 120 && VOC.rec) VOC.rec.stop(); }, 500);
}
const retourFichiers = c => { if (!c) return ""; const N = c.annotations || [], A = c.audio || []; if (!N.length && !A.length) return "";
  return `<div class="retour"><b>${icon("pen")} Retour de ${esc(R().prof.nom)}</b>${N.map(x => `<div class="pj">${icon("pen")} Copie corrigée : ${lienFichierProf(x)}</div>`).join("")}${A.map(x => `<div class="pj">${icon("mic")} Commentaire vocal : ${lienFichierProf(x)}</div>`).join("")}</div>`; };

/* ---------------------------------------------------------------- 4. Alertes décrochage */
function alertesEleves(){
  if (!S.prof) return [];
  const out = [], t = now(), compte = email => (S.comptes || []).find(p => p.email === email);
  actives().forEach(c => {
    const dv = S.devoirs.filter(d => d.classe_id === c.id && !d.brouillon && D(d.publie_le) <= t);
    const nbFini = dv.filter(d => d.date_limite && D(d.date_limite) < t).length;
    inscritsDe(c.id).forEach(e => {
      const raisons = [];
      const fermes = dv.filter(d => (!d.eleves || d.eleves.includes(e.email)) && d.date_limite && D(d.date_limite) < t).sort((a, b) => D(b.date_limite) - D(a.date_limite));
      let suite = 0; for (const d of fermes) { if (renduDe(d, e.email)) break; suite++; }
      if (suite >= 3) raisons.push({ k: "bad", t: suite + " travaux manquants de suite" });
      const notes = dv.map(d => { const r = renduDe(d, e.email), cr = correctionDe(r); return cr && cr.publiee && cr.note != null && d.points ? { t: D(d.date_limite || d.publie_le), n: cr.note / d.points * 20 } : null; }).filter(Boolean).sort((a, b) => a.t - b.t);
      if (notes.length >= 5) { const fin = notes.slice(-3), deb = notes.slice(0, -3), m = l => l.reduce((s, x) => s + x.n, 0) / l.length; const ecart = m(deb) - m(fin);
        if (ecart >= 4) raisons.push({ k: "", t: "moyenne en baisse de " + fmtNote(arrondi1(ecart)) + " pts (" + fmtNote(arrondi1(m(fin))) + "/20 sur les 3 derniers)" }); }
      const p = compte(e.email), vu = p && p.derniere_visite ? D(p.derniere_visite) : null;
      if (!p && nbFini) raisons.push({ k: "", t: "ne s'est jamais connecté" });
      else if (p && vu && t - vu > 14 * 864e5) raisons.push({ k: "", t: "pas venu sur le site depuis " + Math.floor((t - vu) / 864e5) + " jours" });
      if (raisons.length) out.push({ c, e, raisons });
    });
  });
  return out;
}
function blocAlertes(complet){
  const L = alertesEleves(); if (!L.length) return complet ? `<section class="alertes ok"><b>${icon("check")} Aucun élève à surveiller pour l'instant.</b></section>` : "";
  const ouvert = complet || S.alertesOuv;
  return `<section class="alertes"><div class="recenthead"><h2>${icon("alerte")} Élèves à surveiller <span class="pill bad">${L.length}</span></h2>${complet ? "" : `<button class="ib" data-act="alertesouv" aria-expanded="${!!ouvert}" title="${ouvert ? "Réduire" : "Afficher"}">${icon(ouvert ? "up" : "expand")}</button>`}</div>
    ${ouvert ? `<div class="alist">${L.map(x => `<div class="arow"><span class="ini" style="--bb:var(${C(x.c.couleur).b})">${esc((x.c.symbole || x.c.nom).slice(0, 3))}</span><div style="flex:1;min-width:0"><b>${esc(x.e.nom)}</b> <small class="muted">${esc(x.c.nom)}</small><div class="chips">${x.raisons.map(r => `<span class="pill ${r.k}">${esc(r.t)}</span>`).join("")}</div></div>
      <a class="btn ghost sm" href="${esc(outlookLink([x.e.email], "Suivi · " + x.c.nom, "Bonjour " + x.e.nom.split(" ")[0] + ",\n\n"))}" target="_blank" rel="noopener">${icon("mail")} Écrire</a></div>`).join("")}</div>
      <p class="muted" style="margin:0;font-size:.8rem">Repérés automatiquement : 3 travaux manquants de suite, baisse de moyenne d'au moins 4 points, ou plus de 14 jours sans venir sur le site.</p>` : ""}</section>`;
}

/* ---------------------------------------------------------------- 5. Rappels avant échéance */
function blocRappels(){
  const t = now();
  if (!S.prof) {
    const L = S.devoirs.filter(d => d.date_limite && !d.brouillon && cls(d.classe_id) && !cls(d.classe_id).archive && D(d.date_limite) > t && D(d.date_limite) - t < 864e5 * 1.5 && etat(d, moi()).t === "Attribué").sort((a, b) => D(a.date_limite) - D(b.date_limite));
    if (!L.length) return "";
    return `<section class="rappel">${icon("alerte")}<div><b>À rendre bientôt</b>${L.map(d => `<a href="#/devoir/${d.id}"><b>${esc(d.titre)}</b> · ${esc(cls(d.classe_id).nom)} · ${dueTxt(D(d.date_limite)).replace("Échéance : ", "")}</a>`).join("")}</div></section>`;
  }
  const L = S.devoirs.filter(d => d.date_limite && !d.brouillon && cls(d.classe_id) && !cls(d.classe_id).archive && Math.abs(D(d.date_limite) - t) < 864e5 * 1.5)
    .map(d => ({ d, manq: elevesDuDevoir(d, inscritsDe(d.classe_id)).filter(e => !renduDe(d, e.email)) })).filter(x => x.manq.length).sort((a, b) => D(a.d.date_limite) - D(b.d.date_limite));
  if (!L.length) return "";
  return `<section class="rappel prof">${icon("alerte")}<div style="flex:1;min-width:0"><b>Retardataires · échéances d'hier, d'aujourd'hui et de demain</b>
    ${L.map(x => { const passe = D(x.d.date_limite) < t; return `<div class="rrow"><a href="#/devoir/${x.d.id}"><b>${esc(x.d.titre)}</b> · ${esc(cls(x.d.classe_id).nom)} · ${passe ? "fermé " : ""}${dueTxt(D(x.d.date_limite)).replace("Échéance : ", "")}</a>
      <span class="muted">${x.manq.length} élève${x.manq.length > 1 ? "s" : ""} sans rendu</span>
      <a class="btn ghost sm" href="${esc(outlookLink(x.manq.map(e => e.email), (passe ? "Travail non rendu : " : "Rappel : à rendre ") + x.d.titre, "Bonjour,\n\n" + (passe ? "Je n'ai pas reçu ton travail « " + x.d.titre + " ». Merci de me le rendre au plus vite sur PhysiquePro." : "Petit rappel : le travail « " + x.d.titre + " » est à rendre " + dueTxt(D(x.d.date_limite)).replace("Échéance : ", "").toLowerCase() + " sur PhysiquePro.") + "\n\n" + R().prof.nom))}" target="_blank" rel="noopener">${icon("mail")} Relancer</a></div>`; }).join("")}</div></section>`;
}

/* ---------------------------------------------------------------- 6. Rendez-vous */
async function chargerRdv(){
  const [s, c, r, p] = await Promise.all([sb.from("rdv_series").select("*").order("cree_le", { ascending: false }), sb.from("rdv_creneaux").select("*").order("debut"), sb.from("rdv_reservations").select("*"), sb.rpc("pp_places")]);
  S.rdv = { series: s.error ? [] : s.data, creneaux: c.error ? [] : c.data, resa: r.error ? [] : r.data, places: {} };
  (p.data || []).forEach(x => S.rdv.places[x.creneau_id] = x.pris);
  S.rdvOk = !s.error;
}
function vRendezVous(){
  const R0 = S.rdv || { series: [], creneaux: [], resa: [], places: {} }, t = now();
  const series = R0.series.filter(s => cls(s.classe_id));
  const carte = s => { const c = cls(s.classe_id), cr = R0.creneaux.filter(x => x.serie_id === s.id), moiR = R0.resa.find(x => x.serie_id === s.id && x.eleve === (S.user && S.user.id));
    const jours = [...new Set(cr.map(x => ymd(D(x.debut))))];
    return `<article class="rdvcard" style="--c:var(${C(c.couleur).c})"><header><div style="flex:1;min-width:0"><b>${esc(s.titre)}</b><small class="muted">${esc(c.nom)}${s.lieu ? " · " + esc(s.lieu) : ""}</small></div>
        ${S.prof ? `<button class="ib sm" data-act="rdvsuppr" data-id="${s.id}" title="Supprimer" aria-label="Supprimer ces rendez-vous">${icon("trash")}</button>` : moiR ? `<span class="pill ok">Inscrit</span>` : ""}</header>
      ${s.consigne ? `<p style="margin:0">${linkify(s.consigne)}</p>` : ""}
      ${!S.prof && moiR ? (() => { const x = cr.find(y => y.id === moiR.creneau_id); return x ? `<div class="monrdv">${icon("rdv")} Ton rendez-vous : <b>${fmtD(D(x.debut))} à ${fmtT(D(x.debut))}</b>${D(x.debut) > t ? ` <button class="linkbtn" data-act="rdvannule" data-id="${s.id}">Annuler</button>` : ""}</div>` : ""; })() : ""}
      ${jours.map(j => `<div class="rdvjour"><b>${fmtD(new Date(j + "T12:00"))}</b><div class="slots">${cr.filter(x => ymd(D(x.debut)) === j).map(x => {
        const pris = S.prof ? R0.resa.filter(y => y.creneau_id === x.id).length : (R0.places[x.id] || 0), plein = pris >= x.capacite, mien = moiR && moiR.creneau_id === x.id, passe = D(x.debut) <= t;
        if (S.prof) { const noms = R0.resa.filter(y => y.creneau_id === x.id); return `<div class="slot prof ${noms.length ? "pris" : ""}"><span class="mono">${fmtT(D(x.debut))}</span>${noms.length ? noms.map(y => `<span class="snom">${esc(y.eleve_nom || y.eleve_email)}<button class="ib sm" data-act="rdvretire" data-c="${x.id}" data-e="${esc(y.eleve)}" title="Retirer" aria-label="Retirer ${esc(y.eleve_nom)}">${icon("x")}</button></span>`).join("") : `<span class="muted">libre</span>`}${x.capacite > 1 ? `<small class="muted">${noms.length}/${x.capacite}</small>` : ""}</div>`; }
        return `<button class="slot ${mien ? "mien" : ""}" data-act="rdvresa" data-id="${x.id}" ${plein && !mien || passe ? "disabled" : ""}><span class="mono">${fmtT(D(x.debut))}</span><small>${mien ? "ton créneau" : passe ? "passé" : plein ? "complet" : x.capacite > 1 ? (x.capacite - pris) + " place(s)" : "libre"}</small></button>`; }).join("")}</div></div>`).join("")}
      ${S.prof ? `<p class="muted" style="margin:0;font-size:.82rem">${(n => n + " inscrit" + (n > 1 ? "s" : ""))(R0.resa.filter(y => y.serie_id === s.id).length)} sur ${(n => n + " élève" + (n > 1 ? "s" : ""))(inscritsDe(s.classe_id).length)} · ${cr.length} créneau${cr.length > 1 ? "x" : ""}</p>` : ""}</article>`; };
  return `<div class="page"><div class="homehead"><h1 style="font-size:1.6rem">${icon("rdv")} Rendez-vous</h1>${S.prof ? `<button class="btn" data-act="rdvnew">${icon("plus")} Proposer des créneaux</button>` : ""}</div>
    <p class="muted" style="margin:0">${S.prof ? "Passages d'oral, Grand Oral, soutien : crée des créneaux, chaque élève du cours choisit le sien. Tu vois ici qui est inscrit et quand." : "Choisis un créneau libre pour chaque rendez-vous proposé par ton professeur. Tu peux changer ou annuler tant que le créneau n'est pas passé."}</p>
    ${!S.rdvOk ? `<div class="notice">Les rendez-vous ne sont pas encore activés.</div>` : series.length ? `<div class="urglist">${series.map(carte).join("")}</div>` : `<div class="emptystate"><b>Aucun rendez-vous proposé${S.prof ? "" : " pour l'instant"}.</b></div>`}${pageFoot()}</div>`;
}
function modalRdv(){
  const d = new Date(now()); d.setDate(d.getDate() + 1);
  return `<h2>${icon("rdv")} Proposer des créneaux</h2>
    <div class="field"><label for="rvTitre">Titre</label><input id="rvTitre" placeholder="ex. Passage d'oral · projet SI"></div>
    <div class="two"><div class="field"><label for="rvCours">Cours</label><select id="rvCours">${actives().map(c => `<option value="${esc(c.id)}" ${route().v === "classe" && route().a === c.id ? "selected" : ""}>${esc(c.nom)}</option>`).join("")}</select></div>
      <div class="field"><label for="rvLieu">Lieu</label><input id="rvLieu" placeholder="ex. Salle B12 ou Teams"></div></div>
    <div class="two"><div class="field"><label for="rvDate">Jour</label><input id="rvDate" type="date" value="${ymd(d)}"></div><div class="field"><label for="rvDuree">Durée d'un créneau (min)</label><input id="rvDuree" type="number" min="5" max="240" value="15"></div></div>
    <div class="two"><div class="field"><label for="rvDe">De</label><input id="rvDe" type="time" value="13:00"></div><div class="field"><label for="rvA">À</label><input id="rvA" type="time" value="15:00"></div></div>
    <div class="two"><div class="field"><label for="rvCap">Élèves par créneau</label><input id="rvCap" type="number" min="1" max="40" value="1"></div><div class="field"><label for="rvPause">Pause entre deux (min)</label><input id="rvPause" type="number" min="0" max="60" value="0"></div></div>
    <div class="field"><label for="rvCons">Consigne <span class="muted">(facultatif)</span></label><textarea id="rvCons" rows="2" placeholder="ex. Apporte ta présentation sur clé USB."></textarea></div>
    <p class="muted" style="margin:0;font-size:.82rem">Tu pourras ajouter d'autres jours en recréant des créneaux avec le même titre.</p>`;
}
async function creerRdv(){
  const v = id => ((document.getElementById(id) || {}).value || "").trim();
  const titre = v("rvTitre"), cid = v("rvCours"), jour = v("rvDate"), dur = Number(v("rvDuree")), pause = Number(v("rvPause") || 0), cap = Number(v("rvCap") || 1);
  if (!titre) throw new Error("Donne un titre."); if (!jour || !v("rvDe") || !v("rvA")) throw new Error("Choisis le jour et les heures.");
  if (!(dur >= 5)) throw new Error("Durée d'un créneau : au moins 5 minutes.");
  const deb = new Date(jour + "T" + v("rvDe")), fin = new Date(jour + "T" + v("rvA")); if (fin <= deb) throw new Error("L'heure de fin doit être après l'heure de début.");
  const cr = []; for (let x = new Date(deb); +x + dur * 6e4 <= +fin; x = new Date(+x + (dur + pause) * 6e4)) cr.push({ debut: x.toISOString(), fin: new Date(+x + dur * 6e4).toISOString(), capacite: cap });
  if (!cr.length) throw new Error("Aucun créneau ne tient dans cet horaire."); if (cr.length > 80) throw new Error("Trop de créneaux (80 maximum) : réduis l'horaire ou allonge la durée.");
  let s = (S.rdv && S.rdv.series || []).find(x => x.titre === titre && x.classe_id === cid);
  if (!s) { const r = await sb.from("rdv_series").insert({ titre, classe_id: cid, lieu: v("rvLieu"), consigne: v("rvCons") }).select().single(); if (r.error) throw r.error; s = r.data; }
  const r2 = await sb.from("rdv_creneaux").insert(cr.map(x => ({ ...x, serie_id: s.id }))); if (r2.error) throw r2.error;
  await chargerRdv(); return cr.length;
}
async function actionRdv(act, a){
  if (act === "rdvnew") { S.modal = { kind: "rdv" }; render(); return; }
  if (act === "rdvresa") { const { error } = await sb.rpc("pp_reserver", { p_creneau: Number(a.dataset.id) }); if (error) { toast(error.message); await chargerRdv(); render(); return; } await chargerRdv(); render(); toast("Créneau réservé ✓"); return; }
  if (act === "rdvannule") { const { error } = await sb.rpc("pp_annuler_rdv", { p_serie: Number(a.dataset.id) }); if (error) return toast(error.message); await chargerRdv(); render(); toast("Rendez-vous annulé"); return; }
  if (act === "rdvretire") { const { error } = await sb.from("rdv_reservations").delete().eq("creneau_id", Number(a.dataset.c)).eq("eleve", a.dataset.e); if (error) return toast(error.message); await chargerRdv(); render(); return; }
  if (act === "rdvsuppr") { const s = S.rdv.series.find(x => String(x.id) === a.dataset.id); S.modal = { kind: "confirm", action: "rdvsuppr", id: s.id, titre: "Supprimer « " + s.titre + " » ?", texte: "Tous les créneaux et les inscriptions des élèves sont supprimés.", ok: "Supprimer" }; render(); return; }
}
