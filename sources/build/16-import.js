/* ---------- import depuis Google Classroom ---------- */
const MOIS_FR = { janv: 0, "févr": 1, fevr: 1, mars: 2, avr: 3, mai: 4, juin: 5, juil: 6, "août": 7, aout: 7, sept: 8, oct: 9, nov: 10, "déc": 11, dec: 11 };
const META_CR = /^(Aucune date limite|Date limite.*|À rendre.*|Échéance.*|\d+|Remis|Rendus?|Attribués?|Notés?|Afficher les instructions|Afficher le support|Afficher le devoir|Afficher la question|Modifier le support|Modifier le devoir|Modifier la question|PDF|Microsoft Word|Microsoft Excel|Microsoft PowerPoint|Google (Docs|Sheets|Slides|Forms|Drive|Dessins)|Formulaires Google|Image|Vidéo|YouTube|Vidéo YouTube.*|Lien|Dossier|\d+ minutes?|\d+:\d+)$/i;
function dateCR(lignes){
  const l = (lignes || []).find(x => /^(Date limite|À rendre)/i.test(x)); if (!l) return null;
  const m = l.match(/(\d{1,2})\s+([a-zéû]+)\.?(?:\s+(\d{4}))?(?:,?\s*(\d{1,2}):(\d{2}))?/i); if (!m) return null;
  const mo = MOIS_FR[m[2].toLowerCase().replace(/\.$/, "")]; if (mo == null) return null;
  const an = m[3] ? Number(m[3]) : (mo >= 7 ? 2026 : 2027);
  return new Date(an, mo, Number(m[1]), m[4] ? Number(m[4]) : 23, m[5] ? Number(m[5]) : 59);
}
function texteCR(it){
  const titres = new Set((it.liens || []).flatMap(l => [l.t, l.u]));
  const lignes = (it.corps || []).filter(x => x.trim() && !META_CR.test(x.trim()) && !titres.has(x.trim()) && !/^https?:\/\//.test(x.trim()));
  let html = "", liste = false;
  for (const x of lignes) {
    const puce = /^\s/.test(x) || /^[•\-–]\s/.test(x.trim());
    if (puce && !liste) { html += "<ul>"; liste = true; }
    if (!puce && liste) { html += "</ul>"; liste = false; }
    html += puce ? "<li>" + esc(x.trim().replace(/^[•\-–]\s*/, "")) + "</li>" : "<p>" + esc(x.trim()) + "</p>";
  }
  return html + (liste ? "</ul>" : "");
}
function ressourcesCR(it){
  return (it.liens || []).map(l => { const u = l.u, t = (l.t || "").trim();
    const type = /youtu/.test(u) ? "YouTube" : /docs\.google\.com\/document/.test(u) ? "Docs" : /spreadsheets/.test(u) ? "Sheets" : /presentation/.test(u) ? "Slides" : /forms/.test(u) ? "Forms" : /drive\.google/.test(u) ? (extType(t) !== "Fichier" ? extType(t) : "Drive") : "Lien";
    return { type, label: type === "YouTube" && /^(youtube|vidéo)/i.test(t) ? "YouTube" : t || u, url: u, cr: /google\.com/.test(u) ? 1 : 0 }; });
}
const coursAuto = nom => { const n = " " + sansAccent(nom).replace(/[^a-z0-9]+/g, " ") + " ";
  return /\s(ter|tle|tale|terminale|terminales)\s/.test(n) ? "tle" : /\s(1ere|1re|1eres|premiere|premieres)\s/.test(n) ? "1re" : /\ssnt\s/.test(n) ? "snt" : /\s(si|option si|sciences de l ingenieur)\s/.test(n) ? "si" : /\s(3eme|3e|3eme a b|techno|technologie)\s/.test(n) ? "3e" : /\spix\s/.test(n) ? "pix" : ""; };

function admImport(){
  const I = S.imp || (S.imp = { texte: "", data: null, map: {}, brouillons: true, log: [], busy: false });
  let liste = "";
  if (I.data) liste = I.data.map((c, k) => `<div class="setrow"><span><b>${esc(c.cours.replace(/^Travaux et devoirs de\s*/, "").replace(/\s*-\s*Classroom$/, ""))}</b><small class="muted">${c.items.length} éléments · ${new Set(c.items.map(i => i.topic)).size} thèmes · ${c.items.filter(i => /Brouillon/.test(i.statut)).length} brouillons</small></span>
      <select data-impmap="${k}" class="agsel"><option value="">Ne pas importer</option>${actives().map(x => `<option value="${esc(x.id)}" ${I.map[k] === x.id ? "selected" : ""}>${esc(x.nom)}</option>`).join("")}</select></div>`).join("");
  return `<section class="edcard"><h2>${icon("upload")} Importer depuis Google Classroom</h2>
      <p class="muted" style="margin:0;font-size:.88rem">Étape 1 : colle ici les données lues dans ton Classroom (Claude s'en charge). Étape 2 : choisis le cours PhysiquePro de destination. Étape 3 : importe. Les thèmes, documentations, devoirs, descriptions, liens et vidéos sont recréés. Un élément déjà présent (même titre) n'est pas recréé.</p>
      <textarea id="impTexte" class="adtext" rows="4" placeholder="Données Classroom (JSON)">${esc(I.texte)}</textarea>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn ghost sm" data-act="impanalyse">Analyser</button></div>
      ${I.data ? `<h3>Cours trouvés</h3>${liste}
        <label class="check"><input type="checkbox" id="impBrouillons" ${I.brouillons ? "checked" : ""}> Importer aussi les brouillons (en brouillon)</label>
        <div><button class="btn" data-act="impgo" ${I.busy ? "disabled" : ""}>${I.busy ? "Import en cours…" : "Importer"}</button></div>` : ""}
      ${I.log.length ? `<div class="implog">${I.log.map(l => `<div>${esc(l)}</div>`).join("")}</div>` : ""}
    </section>
    <section class="edcard"><h2>${icon("folder")} Fichiers Google Drive</h2>
      <p class="muted" style="margin:0;font-size:.88rem">Tes élèves n'ont pas de compte Google : les fichiers Drive doivent être copiés. Dans Google Drive, télécharge le dossier <b>Classroom</b> (clic droit › Télécharger), puis choisis le fichier .zip ici. Chaque fichier est rangé ${odActif() ? "dans ton OneDrive (classe › thème › activité)" : "dans PhysiquePro"} et remplace le lien Drive.</p>
      <div><button class="btn ghost sm" data-act="impzip" ${I.busy ? "disabled" : ""}>${icon("upload")} Choisir le .zip de Google Drive</button><input type="file" id="impZip" accept=".zip" multiple hidden></div>
    </section>`;
}
function analyserImport(){
  const I = S.imp; I.log = [];
  try { let d = JSON.parse(I.texte); if (!Array.isArray(d)) d = [d]; d = d.filter(c => c && Array.isArray(c.items)); if (!d.length) throw new Error("aucun cours");
    I.data = d; I.map = {}; d.forEach((c, k) => { I.map[k] = coursAuto(c.cours); }); }
  catch (e) { I.data = null; I.log = ["Données illisibles : " + (e.message || e)]; }
}
async function lancerImport(){
  const I = S.imp; if (!I || !I.data) return; I.busy = true; I.log = []; const log = m => { I.log.push(m); const z = document.querySelector(".implog"); if (z) z.insertAdjacentHTML("beforeend", "<div>" + esc(m) + "</div>"); else render(); };
  render();
  for (let k = 0; k < I.data.length; k++) {
    const cid = I.map[k]; if (!cid) continue; const C = I.data[k], c = cls(cid);
    log("— " + c.nom + " —");
    const data = await chargerClasse(cid, true), themes = data.themes.slice();
    const existants = new Set([...S.devoirs.filter(d => d.classe_id === cid).map(d => d.titre), ...data.supports.map(s => s.titre), ...S.quiz.filter(q => q.classe_id === cid).map(q => q.titre)].map(sansAccent));
    const ordreTopics = [...new Set([...(C.topics || []), ...C.items.map(i => i.topic)])];
    let ordre = themes.reduce((a, t) => Math.max(a, t.ordre || 0), 0);
    const idTheme = {};
    for (const nom of ordreTopics) {
      if (!nom) continue; const ex = themes.find(t => sansAccent(t.titre) === sansAccent(nom));
      if (ex) { idTheme[nom] = ex.id; continue; }
      const r = await sb.from("themes").insert({ classe_id: cid, titre: nom, ordre: ++ordre }).select("id").single();
      if (r.error) { log("Thème « " + nom + " » : " + r.error.message); continue; } idTheme[nom] = r.data.id; log("Thème créé : " + nom);
    }
    /* même ordre des thèmes que dans Classroom (les autres thèmes passent après) */
    const ids = ordreTopics.map(t => idTheme[t]).filter(Boolean), autres = themes.filter(t => !ids.includes(t.id)).map(t => t.id);
    await Promise.all([...ids, ...autres].map((id, k2) => sb.from("themes").update({ ordre: k2 + 1 }).eq("id", id)));
    const base = Date.now(); let n = 0, saut = 0;
    for (let i = 0; i < C.items.length; i++) {
      const it = C.items[i], brouillon = /Brouillon/i.test(it.statut);
      if (brouillon && !I.brouillons) continue;
      if (existants.has(sansAccent(it.titre))) { saut++; continue; }
      const commun = { classe_id: cid, theme_id: idTheme[it.topic] || null, titre: it.titre, ressources: ressourcesCR(it), brouillon, publie_le: new Date(base - i * 60000).toISOString() };
      let r;
      if (it.kind === "book") r = await sb.from("supports").insert({ ...commun, description: texteCR(it) });
      else { const lim = dateCR(it.corps), isQ = /help/.test(it.kind);
        r = await sb.from("devoirs").insert({ ...commun, consigne: texteCR(it), date_limite: lim ? lim.toISOString() : null, mode: "individuel", formats: "", points: 20,
          ...(isQ ? { type: "question", question: { format: "courte", options: [], voir: false, modifier: true } } : {}) }); }
      if (r.error) log("« " + it.titre + " » : " + r.error.message); else n++;
    }
    log(n + " élément" + (n > 1 ? "s importés" : " importé") + (saut ? " · " + saut + " déjà présent(s)" : ""));
    delete S.cache[cid];
  }
  await rafraichir(); I.busy = false; log("Import terminé."); render();
}
/* fichiers du zip Google Drive → OneDrive (ou PhysiquePro), à la place des liens Drive */
async function importerZip(files){
  const I = S.imp || (S.imp = { texte: "", data: null, map: {}, brouillons: true, log: [], busy: false });
  if (!window.JSZip) { await new Promise((ok, ko) => { const s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"; s.onload = ok; s.onerror = ko; document.head.appendChild(s); }); }
  I.busy = true; I.log = []; render();
  const log = m => { I.log.push(m); const z = document.querySelector(".implog"); if (z) z.insertAdjacentHTML("beforeend", "<div>" + esc(m) + "</div>"); else render(); };
  /* index des fichiers du zip : nom → [{entrée, cours}] (le cours vient du dossier Classroom « Ter. G1… », « 1ere G3… ») */
  const index = new Map(), cle = n => sansAccent(String(n).split("/").pop().replace(/\.[a-z0-9]{2,5}$/i, "")).replace(/[^a-z0-9]+/g, "");
  for (const f of files) { const z = await window.JSZip.loadAsync(f); z.forEach((p, e) => { if (e.dir) return;
    let cid = ""; for (const seg of p.split("/").slice(0, -1)) { cid = coursAuto(seg); if (cid) break; }
    const k = cle(p); if (!index.has(k)) index.set(k, []); index.get(k).push({ e, cid, p }); }); }
  log(index.size + " fichiers trouvés dans le zip.");
  { const parCours = {}, sans = new Set(); index.forEach(l => l.forEach(x => { parCours[x.cid || "?"] = (parCours[x.cid || "?"] || 0) + 1; if (!x.cid) sans.add(x.p.split("/").slice(0, -1).slice(0, 3).join(" / ") || "(racine du zip)"); }));
    log("Fichiers par cours : " + Object.entries(parCours).map(([k, v]) => (k === "?" ? "cours non reconnu" : ((cls(k) || {}).nom || k)) + " " + v).join(" · "));
    if (sans.size) log("Dossiers sans cours reconnu : " + [...sans].slice(0, 6).join(" | ")); }
  { let nd = 0; index.forEach(l => { if (new Set(l.map(x => x.cid)).size > 1) nd++; }); log(nd + " nom" + (nd > 1 ? "s" : "") + " de fichier présent" + (nd > 1 ? "s" : "") + " dans plusieurs cours."); }
  const choisir = (label, cid) => { const l = index.get(cle(label)); if (!l) return null; return l.find(x => x.cid === cid) || (l.length === 1 ? l[0] : null); };
  const doublon = label => { const l = index.get(cle(label)); return l && new Set(l.map(x => x.cid)).size > 1; };
  for (const c of S.classes) await chargerClasse(c.id, true);
  const lots = [...S.devoirs.map(d => ({ table: "devoirs", o: d })), ...S.classes.flatMap(c => (S.cache[c.id] || { supports: [] }).supports.map(s => ({ table: "supports", o: s })))]
    .filter(x => (x.o.ressources || []).some(r => r.cr || (r.od && doublon(r.label))));
  let n = 0, corr = 0;
  for (const lot of lots) {
    const res = []; let chg = false;
    for (const r of lot.o.ressources) {
      const aRefaire = r.od && doublon(r.label), x = (r.cr || aRefaire) ? choisir(r.label, lot.o.classe_id) : null;
      if (!x || (aRefaire && r.od.src === x.p)) { res.push(r); continue; }
      try {
        const blob = await x.e.async("blob"), nom = x.e.name.split("/").pop();
        let nouv;
        if (odActif()) { const o = await odEnvoyer([...dossierTravail(lot.o.classe_id, lot.o.theme_id, lot.o.titre), nom], blob); nouv = ressourceOD(o, nom); nouv.od.src = x.p; }
        else { const path = lot.o.classe_id + "/" + Date.now() + "-" + safeName(nom); const up = await sb.storage.from("documents").upload(path, blob); if (up.error) throw up.error; nouv = { type: extType(nom), label: nom, path }; }
        if (aRefaire && r.od.id) { try { await graph("/me/drive/items/" + r.od.id, { method: "DELETE" }); } catch (_) {} corr++; log("↻ corrigé : " + nom + " → " + lot.o.titre); }
        else { n++; log("✓ " + nom + " → " + lot.o.titre); }
        res.push(nouv); chg = true;
      } catch (er) { res.push(r); log("✗ " + r.label + " : " + (er.message || er)); }
    }
    if (chg) await sb.from(lot.table).update({ ressources: res }).eq("id", lot.o.id);
  }
  if (corr) log(corr + " fichier" + (corr > 1 ? "s" : "") + " portant le même nom dans plusieurs cours ont été remplacés par la version du bon cours.");
  S.cache = {}; await rafraichir(); I.busy = false; log(n + " fichier" + (n > 1 ? "s" : "") + " copiés. Les liens Drive restants n'ont pas été trouvés dans le zip."); render();
}
