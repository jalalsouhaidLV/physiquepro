/* ---------- visionneuse des travaux rendus (prof) ---------- */
/* Word, Excel et PowerPoint s'ouvrent dans Office en ligne (Microsoft 365) */
const OFFICE = ["doc", "docx", "dot", "dotx", "rtf", "odt", "xls", "xlsx", "xlsm", "csv", "ods", "ppt", "pptx", "pps", "ppsx", "odp"];
const estOffice = n => OFFICE.includes(String(n || "").split(".").pop().toLowerCase());
const lienOffice = (nom, url) => estOffice(nom) && !/\.csv$/i.test(nom) ? "https://view.officeapps.live.com/op/view.aspx?src=" + encodeURIComponent(url) : url;
/* téléphone (pas tablette ni ordinateur) : Word / Excel / PowerPoint en ligne n'y servent qu'à lire */
const telephone = () => { const u = navigator.userAgent || ""; return /iPhone|iPod/.test(u) || (/Android/.test(u) && /Mobile/.test(u)); };
const STORE_OFFICE = { Word: ["com.microsoft.office.word", "id586447913"], Excel: ["com.microsoft.office.excel", "id586683407"], PowerPoint: ["com.microsoft.office.powerpoint", "id586449534"] };
const SCHEMA_OFFICE = { Word: "ms-word", Excel: "ms-excel", PowerPoint: "ms-powerpoint" };
const appOffice = n => { const x = String(n || "").split(".").pop().toLowerCase(); return /^(doc|dot|rtf|odt)/.test(x) ? "Word" : /^(xls|ods)/.test(x) ? "Excel" : /^(ppt|pps|odp)/.test(x) ? "PowerPoint" : ""; };
const btnDl = (bucket, path, nom) => `<button class="dlbtn" data-act="dlfile" data-bucket="${esc(bucket)}" data-path="${esc(path)}" data-nom="${esc(nom || "")}" title="Télécharger pour modifier sur l'ordinateur" aria-label="Télécharger ${esc(nom || "")}">${icon("down")}</button>`;
const extDe = n => (String(n || "").split(".").pop() || "").toLowerCase();
const cleF = f => f.chemin || ("od:" + (f.od && f.od.id));
const TYPES = { pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp", svg: "image/svg+xml", mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime", mp3: "audio/mpeg", wav: "audio/wav", m4a: "audio/mp4", txt: "text/plain;charset=utf-8", py: "text/plain;charset=utf-8", csv: "text/plain;charset=utf-8", md: "text/plain;charset=utf-8", json: "text/plain;charset=utf-8" };
async function urlRendu(f){
  if (typeof f === "string") f = { chemin: f };
  S.vurl = S.vurl || {}; const k = cleF(f);
  if (S.vurl[k]) return S.vurl[k];
  if (f.chemin) { const { data } = await sb.storage.from("rendus").createSignedUrl(f.chemin, 3600); return S.vurl[k] = data ? data.signedUrl : null; }
  try {
    if (appOffice(f.nom)) { const p = await graph("/me/drive/items/" + encodeURIComponent(f.od.id) + "/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }); return S.vurl[k] = p.getUrl || f.od.web; }
    const it = await graph("/me/drive/items/" + encodeURIComponent(f.od.id)), b = await (await fetch(it["@microsoft.graph.downloadUrl"])).blob();
    return S.vurl[k] = URL.createObjectURL(new Blob([b], { type: TYPES[extDe(f.nom)] || b.type || "application/octet-stream" }));
  } catch (e) { return S.vurl[k] = null; }
}
function rendusOrdonnes(d){
  const el = elevesDuDevoir(d, inscritsDe(d.classe_id));
  return el.filter(e => renduDe(d, e.email));
}
async function preparerViewer(){
  const V = S.viewer, d = S.devoirs.find(x => x.id === V.did); if (!d) { S.viewer = null; return; }
  await chargerClasse(d.classe_id);
  const rd = renduDe(d, V.email), f = rd && (rd.fichiers || [])[V.fi || 0];
  if (f) await urlRendu(f);
  await chargerCP(d.id, V.email);
}
function apercuFichier(f){
  const u = S.vurl && S.vurl[cleF(f)], x = extDe(f.nom);
  if (!u) return `<div class="vempty">Fichier introuvable.${f.od ? `<a class="btn" href="${esc(f.od.web)}" target="_blank" rel="noopener">Ouvrir dans OneDrive</a>` : ""}</div>`;
  if (f.od && ["doc", "docx", "ppt", "pptx", "xls", "xlsx"].includes(x)) return `<iframe class="vframe" src="${esc(u)}" title="${esc(f.nom)}"></iframe>`;
  if (["png", "jpg", "jpeg", "gif", "webp", "bmp", "heic", "svg"].includes(x)) return `<img class="vimg" src="${esc(u)}" alt="${esc(f.nom)}">`;
  if (x === "pdf") return `<iframe class="vframe" src="${esc(u)}" title="${esc(f.nom)}"></iframe>`;
  if (["mp4", "webm", "mov", "m4v"].includes(x)) return `<video class="vimg" src="${esc(u)}" controls></video>`;
  if (["mp3", "wav", "m4a", "ogg"].includes(x)) return `<audio src="${esc(u)}" controls style="width:min(520px,90%)"></audio>`;
  if (["doc", "docx", "ppt", "pptx", "xls", "xlsx"].includes(x)) return `<iframe class="vframe" src="https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(u)}" title="${esc(f.nom)}"></iframe>`;
  if (["txt", "py", "csv", "md", "html", "js", "json"].includes(x)) return `<iframe class="vframe blanc" src="${esc(u)}" title="${esc(f.nom)}"></iframe>`;
  return `<div class="vempty"><b>${esc(f.nom)}</b><span>Aperçu impossible pour ce type de fichier.</span><a class="btn" href="${esc(u)}" target="_blank" rel="noopener">Télécharger</a></div>`;
}
function vViewer(){
  const V = S.viewer, d = S.devoirs.find(x => x.id === V.did), c = cls(d.classe_id), k = C(c && c.couleur);
  const liste = rendusOrdonnes(d), i = liste.findIndex(e => e.email === V.email), e = liste[i] || { nom: nomDe(d.classe_id, V.email), email: V.email };
  const rd = renduDe(d, V.email), cr = correctionDe(rd), fs = (rd && rd.fichiers) || [], fi = Math.min(V.fi || 0, Math.max(0, fs.length - 1));
  const prec = liste[i - 1], suiv = liste[i + 1];
  return `<div class="edtop" style="--c:var(${k.c})"><button class="ib" data-act="vclose" aria-label="Fermer">${icon("x")}</button>
      <div style="min-width:0"><h1 style="font-size:1.15rem">${esc(e.nom)}</h1><small class="muted">${esc(d.titre)} · ${i + 1}/${liste.length} rendus</small></div><span class="spacer"></span>
      <button class="btn ghost sm" data-act="vgo" data-e="${prec ? esc(prec.email) : ""}" ${prec ? "" : "disabled"} title="Élève précédent (←)">${icon("left")} Précédent</button>
      <button class="btn ghost sm" data-act="vgo" data-e="${suiv ? esc(suiv.email) : ""}" ${suiv ? "" : "disabled"} title="Élève suivant (→)">Suivant ${icon("right")}</button></div>
    <div class="viewer">
      <div class="vmain">${fs.length > 1 ? `<div class="vtabs">${fs.map((f, j) => `<button class="${j === fi ? "on" : ""}" data-act="vfile" data-i="${j}">${esc(f.nom)}</button>`).join("")}</div>` : ""}
        <div class="vbody">${fs.length ? apercuFichier(fs[fi]) : rd && rd.reponse ? `<div class="reponse" style="max-width:640px;margin:24px">${linkify(rd.reponse)}</div>` : `<div class="vempty">${rd ? "Rendu sans fichier." : "Aucun rendu."}${rd && rd.lien ? `<a class="btn" href="${esc(rd.lien)}" target="_blank" rel="noopener">Ouvrir le lien rendu</a>` : ""}</div>`}</div>
        ${fs.length && peutAnnoter(fs[fi]) ? `<div class="vfoot"><button class="btn sm" data-act="annoter" data-id="${rd.id}">${icon("pen")} Annoter cette copie</button></div>` : ""}
        ${fs.length && fs[fi].od ? `<div class="vfoot"><a href="${esc(fs[fi].od.web)}" target="_blank" rel="noopener">${icon("expand")} Ouvrir dans OneDrive</a></div>` : ""}
        ${fs.length && fs[fi].chemin && S.vurl && S.vurl[fs[fi].chemin] ? `<div class="vfoot"><a href="${esc(lienOffice(fs[fi].nom, S.vurl[fs[fi].chemin]))}" target="_blank" rel="noopener">${icon("expand")} ${appOffice(fs[fi].nom) ? "Ouvrir dans " + appOffice(fs[fi].nom) + " en ligne" : "Ouvrir dans un nouvel onglet"}</a><a href="#" data-act="dlfile" data-bucket="rendus" data-path="${esc(fs[fi].chemin)}" data-nom="${esc(fs[fi].nom)}">${icon("down")} Télécharger</a></div>` : ""}</div>
      <aside class="vside">${rd ? `<p class="muted" style="margin:0;font-size:.85rem">Rendu le ${fmtD(D(rd.rendu_le))} à ${fmtT(D(rd.rendu_le))}${enRetard(d, rd) ? ` <span class="pill bad">en retard</span>` : ""}</p>
        ${rd.lien ? `<a href="${esc(rd.lien)}" target="_blank" rel="noopener">${icon("links")} Lien rendu</a>` : ""}${blocNotation(d, rd, cr)}` : ""}
        ${vCP(d.id, V.email)}</aside></div>`;
}

/* ---------- suivi des élèves (prof) ---------- */
function vSuivi(){
  const act = actives(); if (!act.length) return `<div class="page"><div class="emptystate"><b>Aucun cours actif.</b></div></div>`;
  const c = cls(S.suiviC) && !cls(S.suiviC).archive ? cls(S.suiviC) : act[0], el = inscritsDe(c.id);
  const uidDe = email => Object.keys(S.profils).find(id => S.profils[id] === email);
  const dv = S.devoirs.filter(d => d.classe_id === c.id && !d.brouillon && D(d.publie_le) <= now());
  const lignes = el.map(e => { const ds = dv.filter(d => !d.eleves || d.eleves.includes(e.email)), et = ds.map(d => ({ d, s: etat(d, e.email) }));
    const rendus = et.filter(x => x.s.r), dernier = rendus.map(x => D(x.s.r.rendu_le)).sort((a, b) => b - a)[0];
    return { e, moy: moyenneDe(c, e.email, uidDe(e.email), false).moy, n: ds.length, rendus: rendus.length, manq: et.filter(x => x.s.t === "Manquant").length, retard: et.filter(x => x.s.retard).length, dernier, et }; })
    .sort((a, b) => (b.manq - a.manq) || ((a.moy ?? 99) - (b.moy ?? 99)));
  return `<div class="page wide"><div class="homehead"><h1>Suivi des élèves</h1>
      <div class="travhead" style="gap:10px"><div class="field filt"><label for="suiviC">Cours</label><select id="suiviC" data-suivi="1">${act.map(x => `<option value="${esc(x.id)}" ${x.id === c.id ? "selected" : ""}>${esc(x.nom)}</option>`).join("")}</select></div>
      <button class="btn ghost sm" data-act="exportsuivi" data-c="${esc(c.id)}">${icon("down")} Exporter (Excel)</button></div></div>
    ${blocAlertes(true)}
    <p class="muted" style="margin:0;font-size:.85rem">Les élèves avec des travaux manquants apparaissent en premier. Clique sur un élève pour voir le détail.</p>
    ${lignes.length ? `<div class="tablewrap" tabindex="0" role="region" aria-label="Tableau"><table class="admtable"><thead><tr><th class="first">Élève</th><th>Moyenne /20</th><th>Rendus</th><th>Manquants</th><th>En retard</th><th>Dernier rendu</th></tr></thead><tbody>
      ${lignes.map(l => `<tr class="suivirow ${l.manq ? "alerte" : ""}" data-act="toggle" data-id="sv${esc(l.e.email)}"><td class="first"><span class="who2">${avatarP(l.e.nom, "sm")}<b>${esc(l.e.nom)}</b></span></td>
        <td class="mono"><b>${l.moy == null ? "–" : fmtNote(arrondi1(l.moy))}</b></td><td>${l.rendus}/${l.n}</td><td>${l.manq ? `<span class="pill bad">${l.manq}</span>` : "0"}</td><td>${l.retard ? `<span class="pill">${l.retard}</span>` : "0"}</td><td class="muted">${l.dernier ? fmtShort(l.dernier) : "—"}</td></tr>
        ${S.open === "sv" + l.e.email ? `<tr><td colspan="6" class="suividetail">${l.et.length ? l.et.map(x => `<a href="#/devoir/${x.d.id}"><span class="pill ${x.s.k}">${x.s.t}${x.s.retard ? " · retard" : ""}</span> ${esc(x.d.titre)} ${x.s.t === "Noté" && x.s.note != null ? `<b class="mono nt">${fmtNote(x.s.note)}/${x.d.points}</b>` : ""}</a>`).join("") : `<span class="muted">Aucun devoir.</span>`}
          <a href="${esc(outlookLink([l.e.email], "", ""))}" target="_blank" rel="noopener">${icon("mail")} Écrire à l'élève</a><a href="#" data-act="bilanpdf" data-c="${esc(c.id)}" data-e="${esc(l.e.email)}">${icon("down")} Bilan PDF</a></td></tr>` : ""}`).join("")}
    </tbody></table></div>` : `<div class="emptystate"><b>Aucun élève dans ce cours.</b></div>`}${tableCompetencesClasse(c)}${pageFoot()}</div>`;
}
function exporterSuivi(cid){
  const c = cls(cid), el = inscritsDe(cid), uidDe = email => Object.keys(S.profils).find(id => S.profils[id] === email);
  const dv = S.devoirs.filter(d => d.classe_id === cid && !d.brouillon && D(d.publie_le) <= now());
  const rows = [["Élève", "Adresse", "Moyenne /20", "Rendus", "Attribués", "Manquants", "En retard"]];
  el.forEach(e => { const ds = dv.filter(d => !d.eleves || d.eleves.includes(e.email)), et = ds.map(d => etat(d, e.email)), m = moyenneDe(c, e.email, uidDe(e.email), false).moy;
    rows.push([e.nom, e.email, m == null ? "" : fmtNote(arrondi1(m)), et.filter(x => x.r).length, ds.length, et.filter(x => x.t === "Manquant").length, et.filter(x => x.retard).length]); });
  telecharger("suivi-" + sansAccent(c.nom).replace(/[^a-z0-9]+/g, "-") + "-" + ymd(now()) + ".csv", csv(rows), "text/csv;charset=utf-8");
}

/* ---------- apparence : clair / sombre ---------- */
function themeChoisi(){ try { return localStorage.getItem("pp_theme") || "auto"; } catch (_) { return "auto"; } }
function appliquerTheme(v){
  try { if (v === "auto") localStorage.removeItem("pp_theme"); else localStorage.setItem("pp_theme", v); } catch (_) {}
  const de = document.documentElement; if (!de || !de.dataset) return;
  if (v === "auto") delete de.dataset.theme; else de.dataset.theme = v;
}
appliquerTheme(themeChoisi());

/* ---------- publier aussi dans d'autres cours ---------- */
async function publierAussi(k, cibles, row, bonnes){
  let ok = 0; const table = k === "quiz" ? "quiz" : k === "support" ? "supports" : "devoirs";
  for (const cid of cibles) {
    const r2 = { ...row, classe_id: cid, theme_id: null, eleves: null };
    if (row.ressources) r2.ressources = await copierRessources(row.ressources, cid);
    if (k === "quiz") { r2.questions = []; for (const x of row.questions || []) { if (x.img) { const [cp] = await copierRessources([{ path: x.img }], cid); r2.questions.push({ ...x, img: cp.path }); } else r2.questions.push(x); } }
    const ins = await sb.from(table).insert(r2).select("id").single();
    if (ins.error) continue;
    if (k === "quiz") { const s2 = await sb.from("quiz_solutions").insert({ quiz_id: ins.data.id, bonnes: bonnes || [] }); if (s2.error) continue; }
    ok++; delete S.cache[cid];
  }
  return ok;
}
