/* =====================================================================
   « Pour s'entraîner » : le professeur relie simulations et outils aux chapitres
   + nom court des cours dans le menu
   ===================================================================== */
function nomCourtCours(nom){
  let n = String(nom || "");
  if (n.length <= 24) return n;
  return n.replace(/\bTerminale\b/gi, "Tle").replace(/Première/gi, "1re").replace(/\bSeconde\b/gi, "2nde")
    .replace(/spécialité/gi, "spé").replace(/\bPhysique[- ]Chimie\b/gi, "PC").replace(/\bTechnologie\b/gi, "Techno")
    .replace(/\bSciences de l'ingénieur\b/gi, "SI").replace(/\bSciences numériques et technologie\b/gi, "SNT").replace(/\s+/g, " ").trim();
}
const PR_ONG = [["unites", "Convertisseur d'unités"], ["tableau", "Tableau périodique"], ["formules", "Éditeur de formules"], ["mesures", "Mesures et incertitudes"], ["constantes", "Constantes"], ["courbes", "Traceur de courbes"], ["snt", "Bits et octets (SNT)"]];
function cataloguePratique(){
  const L = [];
  SIMS.forEach(g => g.l.forEach(x => L.push({ k: "s:" + x.url, t: x.t, type: "Simulation", sous: g.cat + (x.niv ? " · " + x.niv : ""), ic: "atom" })));
  (R().simulations || []).forEach(x => L.push({ k: "s:" + x.url, t: x.t, type: "Simulation", sous: "Ajoutée par toi", ic: "atom" }));
  F_PHY.forEach(t => L.push({ k: "f:phy:" + t[0], t: t[3], type: "Outil de physique", sous: t[4] + " · " + t[2], ic: "pendule" }));
  F_CHI.forEach(t => L.push({ k: "f:chi:" + t[0], t: t[3], type: "Outil de chimie", sous: t[4] + " · " + t[2], ic: "flask" }));
  PR_ONG.forEach(([k, t]) => L.push({ k: "o:" + k, t, type: "Outil", sous: "Outils Scientifiques Importants", ic: "ruler" }));
  return L;
}
const elemPratique = k => { const c = cataloguePratique().find(x => x.k === k); if (c) return c; if (k.startsWith("s:")) return { k, t: "Simulation", type: "Simulation", ic: "atom" }; return null; };
function blocPratique(tid){
  const L = ((R().pratique || {})[tid] || []).map(elemPratique).filter(Boolean);
  if (!L.length && !S.prof) return "";
  return `<div class="pratique"><span class="prlbl">${icon("flask")} Pour s'entraîner</span>${L.map(x => `<span class="prchip"><button data-act="prouvrir" data-k="${esc(x.k)}" title="${esc(x.type)}">${icon(x.ic)}${esc(x.t)}</button>${S.prof ? `<button class="prx" data-act="prretire" data-tid="${esc(tid)}" data-k="${esc(x.k)}" aria-label="Retirer">×</button>` : ""}</span>`).join("")}${S.prof ? `<button class="prplus" data-act="prajout" data-tid="${esc(tid)}">${icon("plus")} ${L.length ? "Ajouter" : "Ajouter une simulation ou un outil"}</button>` : ""}</div>`;
}
async function sauverPratique(tid, liste){
  const p = { ...(R().pratique || {}) }; if (liste.length) p[tid] = liste; else delete p[tid];
  const data = { ...reglagesData(), pratique: p };
  const { error } = await sb.from("reglages").upsert({ id: 1, data, modifie_le: now().toISOString() });
  if (error) { toast("Enregistrement impossible : " + error.message); return false; }
  appliquerReglages(data); return true;
}
const PR = { tid: null, q: "" };
function dessinerChoixPratique(){
  const z = document.querySelector("#prPanel .prliste"); if (!z) return;
  const deja = new Set((R().pratique || {})[PR.tid] || []), q = sansAccent(PR.q);
  const L = cataloguePratique().filter(x => !q || sansAccent(x.t + " " + x.type + " " + (x.sous || "")).includes(q)).slice(0, 80);
  z.innerHTML = L.map(x => `<button class="prl${deja.has(x.k) ? " on" : ""}" data-act="prbascule" data-k="${esc(x.k)}">${icon(x.ic)}<span><b>${esc(x.t)}</b><small>${esc(x.type)}${x.sous ? " · " + esc(x.sous) : ""}</small></span><i>${deja.has(x.k) ? "✓ Ajouté" : "+ Ajouter"}</i></button>`).join("") || `<p class="muted">Aucun résultat.</p>`;
}
function ouvrirChoixPratique(tid){
  PR.tid = tid; PR.q = "";
  const p = document.createElement("div"); p.id = "prPanel"; p.className = "sesfond";
  p.innerHTML = `<div class="sesboite" role="dialog" aria-modal="true" aria-label="Pour s'entraîner"><header>${icon("flask")}<b>Pour s'entraîner : simulations et outils du chapitre</b><button class="ib" data-act="prfermer" aria-label="Fermer">${icon("x")}</button></header>
    <div class="sesbarre"><input type="search" id="prQ" placeholder="Chercher : pendule, pH, dilution, lentille, circuit…" aria-label="Chercher"></div>
    <p class="muted sesaide">Clique pour ajouter ou retirer. Les élèves verront ces liens en haut du chapitre et les ouvriront en un clic.</p>
    <div class="sescorps prliste"></div></div>`;
  document.body.appendChild(p);
  p.addEventListener("click", e => { if (e.target === p) fermerChoixPratique(); });
  p.querySelector("#prQ").addEventListener("input", e => { PR.q = e.target.value; dessinerChoixPratique(); });
  dessinerChoixPratique(); setTimeout(() => p.querySelector("#prQ").focus(), 50);
}
function fermerChoixPratique(){ document.getElementById("prPanel")?.remove(); render(); }
function ouvrirPratique(k){
  if (k.startsWith("s:")) { const x = elemPratique(k); ouvrirSimu(x.t, k.slice(2)); return; }
  if (k.startsWith("o:")) { S.phyOng = k.slice(2); go("/physique"); return; }
  const [, dom, id] = k.split(":"), t = (dom === "phy" ? F_PHY : F_CHI).find(x => x[0] === id);
  S.phyOng = dom === "phy" ? "phys" : "chimie"; OV["fniv_" + dom] = "tout"; OV["fQ_" + dom] = t ? t[3] : ""; FOPEN.add(dom + ":" + id); go("/physique");
}
document.addEventListener("click", async e => {
  const a = e.target.closest && e.target.closest('[data-act="prouvrir"],[data-act="prretire"],[data-act="prajout"],[data-act="prfermer"],[data-act="prbascule"]'); if (!a) return; e.preventDefault(); e.stopPropagation();
  const act = a.dataset.act;
  if (act === "prouvrir") ouvrirPratique(a.dataset.k);
  else if (act === "prajout") { if (S.prof) ouvrirChoixPratique(a.dataset.tid); }
  else if (act === "prfermer") fermerChoixPratique();
  else if (act === "prretire") { const L = ((R().pratique || {})[a.dataset.tid] || []).filter(k => k !== a.dataset.k); if (await sauverPratique(a.dataset.tid, L)) render(); }
  else if (act === "prbascule") { const L = ((R().pratique || {})[PR.tid] || []).slice(), i = L.indexOf(a.dataset.k); if (i >= 0) L.splice(i, 1); else L.push(a.dataset.k); if (await sauverPratique(PR.tid, L)) dessinerChoixPratique(); }
}, true);
document.addEventListener("keydown", e => { if (e.key === "Escape" && document.getElementById("prPanel")) fermerChoixPratique(); });

/* ---------- Échéance en temps restant (pastille colorée) ---------- */
function relEch(date, fait){
  if (!date || fait) return "";
  const d = D(date), t = now(), j0 = new Date(t); j0.setHours(0, 0, 0, 0); const jd = new Date(d); jd.setHours(0, 0, 0, 0);
  const jours = Math.round((jd - j0) / 864e5);
  if (d < t) return `<span class="rel retard">En retard</span>`;
  const [txt, cl] = jours === 0 ? ["Aujourd'hui", "urgent"] : jours === 1 ? ["Demain", "urgent"] : jours <= 3 ? ["Dans " + jours + " jours", "bientot"] : ["Dans " + jours + " jours", "large"];
  return `<span class="rel ${cl}">${txt}</span>`;
}

/* ---------- Chapitre en 3 étapes : Comprendre → S'entraîner → Vérifier ---------- */
function etapeDe(it){ if (it.k === "support") return 0; if (it.q || it.k === "quiz") return 2; const o = it.d || it.s || it.q; return o && o.type === "question" ? 2 : 1; }
function etapesChapitre(g, c){
  const tid = String(g.t.id), E = [[], [], []]; g.items.forEach(it => E[etapeDe(it)].push(it));
  const pr = blocPratique(tid), fc = (typeof FC !== "undefined" && FC.cours && FC.cours[c.id] && FC.cours[c.id].l) ? FC.cours[c.id].l.filter(x => String(x.theme_id) === tid).length : 0;
  if (!g.items.length && !pr && !fc) return `<p class="empty">${S.prof ? "Aucun élément. Utilise « Créer » pour ajouter un devoir, un questionnaire ou une documentation." : "Rien pour l'instant."}</p>`;
  const T = [["1", "Comprendre", "Cours et documents"], ["2", "S'entraîner", "Simulations, outils et exercices"], ["3", "Vérifier", "Questions, questionnaires et révisions"]];
  return T.map(([n, titre, sous], i) => {
    const extra = i === 1 ? pr : i === 2 && fc ? `<div class="pratique"><span class="prlbl">${icon("cards")} Révisions</span><span class="prchip"><button data-act="prreviser" data-c="${esc(c.id)}">${icon("cards")}${fc} carte${fc > 1 ? "s" : ""} à réviser</button></span></div>` : "";
    if (!E[i].length && !extra) return "";
    return `<div class="etape"><div class="etapeh"><span class="etn">${n}</span><b>${titre}</b><small>${sous}</small></div>${extra}${E[i].map(workItem).join("")}</div>`;
  }).join("");
}
document.addEventListener("click", e => { const a = e.target.closest && e.target.closest('[data-act="prreviser"]'); if (!a) return; e.preventDefault(); e.stopPropagation(); S.fcCours = a.dataset.c; go("/revisions"); }, true);
