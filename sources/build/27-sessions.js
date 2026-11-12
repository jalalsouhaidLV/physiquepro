/* =====================================================================
   Élèves connectés (professeur) : deux statuts seulement, une ligne par élève
   Connecté (vert)   : session ouverte sur au moins un appareil (téléphone ou
                       ordinateur), même si l'élève ne travaille pas en ce moment.
   Déconnecté (rouge) : aucun appareil connecté. Pas de déconnexion automatique :
                       le prof déconnecte à la main (choix de Jalal).
   ===================================================================== */
const SES = { liste: null, deco: null, err: "", q: "", t: null, arme: null };
const ilYa = d => { const m = Math.round((Date.now() - new Date(d)) / 60000); return m < 1 ? "à l'instant" : m >= 1440 ? `il y a ${Math.round(m / 1440)} jour${Math.round(m / 1440) > 1 ? "s" : ""}` : m < 60 ? `il y a ${m} min` : `il y a ${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}`; };
const jsonRpc = d => typeof d === "string" ? JSON.parse(d) : (d || []);
async function chargerSessions(){
  const [r1, r2] = await Promise.all([sb.rpc("pp_sessions"), sb.rpc("pp_eleves_deconnectes")]);
  if (r1.error) { SES.err = /pp_sessions|function/i.test(r1.error.message) ? "La liste détaillée n'est pas encore installée (étape 23 de la base de données)." : r1.error.message; SES.liste = []; SES.deco = []; dessinerSessions(); return; }
  SES.err = "";
  /* une ligne par élève : ses appareils encore connectés (une seule entrée par appareil, la plus récente) */
  const eleves = new Map();
  jsonRpc(r1.data).filter(x => x.role !== "prof").sort((a, b) => new Date(b.vu_le) - new Date(a.vu_le)).forEach(x => {
    const k = (x.email || x.id).toLowerCase();
    if (!eleves.has(k)) eleves.set(k, { cle: k, email: x.email, nom: x.nom && !x.nom.includes("@") ? x.nom : nomDepuisEmail(x.email || "?"), classes: x.classes || "", app: new Map(), vu: x.vu_le });
    const e = eleves.get(k);
    if (!x.deconnecter && !e.app.has(x.appareil)) e.app.set(x.appareil, x);
  });
  SES.liste = [...eleves.values()].filter(e => e.app.size).map(e => ({ ...e, app: [...e.app.values()], actif: [...e.app.values()].reduce((m, x) => Math.max(m, new Date(x.actif_le || x.vu_le)), 0) }))
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  /* déconnectés : élèves des cours sans aucune session ouverte (étape 47) + ceux que le prof vient de déconnecter s'ils ne sont inscrits dans aucun cours */
  const connectes = new Set(SES.liste.map(e => e.cle)), deco = new Map();
  (r2.error ? [] : jsonRpc(r2.data)).forEach(x => { const k = (x.email || "").toLowerCase(); if (!connectes.has(k)) deco.set(k, { nom: x.nom || nomDepuisEmail(x.email), classes: x.classes || "", vu: x.derniere_visite }); });
  eleves.forEach((e, k) => { if (!connectes.has(k) && !deco.has(k)) deco.set(k, { nom: e.nom, classes: e.classes, vu: e.vu }); });
  SES.deco = [...deco.values()].sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  dessinerSessions();
}
const sesTrouve = (x, q) => !q || sansAccent([x.nom, x.email, x.classes, ...(x.app || []).map(a => a.appareil)].join(" ")).includes(q);
function ligneConnecte(e){
  const appareils = e.app.map(a => a.appareil || "Appareil inconnu").join(" + ");
  return `<div class="sesl">${avatarP(e.nom, "")}<div class="sesinfo"><b>${esc(e.nom)}</b><small>${esc(e.classes || "Aucun cours")}</small><small class="muted sesapp">${esc(appareils)} · dernière activité ${ilYa(e.actif)}</small></div><span class="sest on">Connecté</span><button class="btn sm ${SES.arme === e.cle ? "danger" : "ghost"}" data-act="sesdeco" data-id="${esc(e.cle)}">${icon("logout")} ${SES.arme === e.cle ? "Confirmer ?" : "Déconnecter"}</button></div>`;
}
const ligneDeconnecte = x => `<div class="sesl">${avatarP(x.nom, "")}<div class="sesinfo"><b>${esc(x.nom)}</b><small>${esc(x.classes || "Aucun cours")}</small><small class="muted">${x.vu ? `Dernière visite ${ilYa(x.vu)}` : "Jamais connecté"}</small></div><span class="sest off">Déconnecté</span></div>`;
function dessinerSessions(){
  const z = document.querySelector("#sesPanel .sescorps"); if (!z) return;
  if (!SES.liste) { z.innerHTML = `<p class="muted">Chargement…</p>`; return; }
  if (SES.err) { z.innerHTML = `<p class="ores err">${esc(SES.err)}</p>`; return; }
  const q = sansAccent(SES.q), on = SES.liste.filter(x => sesTrouve(x, q)), off = SES.deco.filter(x => sesTrouve(x, q)), nb = SES.liste.length;
  z.innerHTML = `<section><h4><i class="pt vert"></i>Connectés · ${on.length}</h4>${on.map(ligneConnecte).join("") || `<p class="muted">Aucun élève connecté.</p>`}</section>
    <section><h4><i class="pt rouge"></i>Déconnectés · ${off.length}</h4>${off.map(ligneDeconnecte).join("") || `<p class="muted">Aucun.</p>`}</section>`;
  const tous = document.querySelector('#sesPanel [data-act="sesdecotous"]'); if (tous) { tous.disabled = !nb; tous.className = "btn sm " + (SES.arme === "tous" ? "danger" : "ghost"); tous.innerHTML = `${icon("logout")} ${SES.arme === "tous" ? `Confirmer : déconnecter ${nb} élève${nb > 1 ? "s" : ""} ?` : "Déconnecter tous les élèves"}`; }
}
function ouvrirSessions(){
  if (document.getElementById("sesPanel")) return;
  const p = document.createElement("div"); p.id = "sesPanel"; p.className = "sesfond";
  p.innerHTML = `<div class="sesboite" role="dialog" aria-modal="true" aria-label="Élèves connectés"><header>${icon("people")}<b>Élèves connectés</b><button class="ib" data-act="sesfermer" aria-label="Fermer">${icon("x")}</button></header>
    <div class="sesbarre"><input type="search" id="sesQ" placeholder="Chercher un nom, une classe…" aria-label="Chercher"><button class="btn sm ghost" data-act="sesdecotous">${icon("logout")} Déconnecter tous les élèves</button></div>
    <p class="muted sesaide"><b>Connecté</b> : l'élève a le site ouvert sur son téléphone ou un ordinateur, même s'il ne travaille pas en ce moment. <b>Déconnecté</b> : aucun appareil. « Déconnecter » ferme toutes ses sessions en moins de 30 secondes (et la session Microsoft de l'appareil).</p>
    <div class="sescorps"></div></div>`;
  document.body.appendChild(p);
  p.addEventListener("click", e => { if (e.target === p) fermerSessions(); });
  p.querySelector("#sesQ").addEventListener("input", e => { SES.q = e.target.value; dessinerSessions(); });
  SES.liste = null; SES.arme = null; dessinerSessions(); chargerSessions();
  clearInterval(SES.t); SES.t = setInterval(chargerSessions, 15000);
}
function fermerSessions(){ document.getElementById("sesPanel")?.remove(); clearInterval(SES.t); }
let sesArmeT = null;
const armer = id => { SES.arme = id; dessinerSessions(); clearTimeout(sesArmeT); sesArmeT = setTimeout(() => { SES.arme = null; dessinerSessions(); }, 5000); };
document.addEventListener("click", async e => {
  const a = e.target.closest && e.target.closest('[data-act="enligne"],[data-act="sesfermer"],[data-act="sesdeco"],[data-act="sesdecotous"]'); if (!a) return; e.preventDefault(); e.stopPropagation();
  const act = a.dataset.act;
  if (act === "enligne") { if (S.prof) ouvrirSessions(); return; }
  if (act === "sesfermer") { fermerSessions(); return; }
  const id = act === "sesdecotous" ? "tous" : a.dataset.id;
  if (SES.arme !== id) { armer(id); return; }
  SES.arme = null; clearTimeout(sesArmeT); a.disabled = true;
  /* un élève = tous ses appareils : pp_deconnecter ferme toutes les lignes d'un même appareil */
  const el = id === "tous" ? null : (SES.liste || []).find(x => x.cle === id);
  const ids = id === "tous" ? [null] : el ? el.app.map(x => x.id) : [];
  let err = null; for (const sid of ids) { const r = await sb.rpc("pp_deconnecter", { p_session: sid }); if (r.error) { err = r.error; break; } }
  const nb = id === "tous" ? (SES.liste || []).length : 1;
  if (err) toast("Déconnexion impossible : " + err.message);
  else toast(id === "tous" ? `${nb} élève${nb > 1 ? "s" : ""} ${nb > 1 ? "vont être déconnectés" : "va être déconnecté"} dans les 30 secondes` : `${el ? el.nom : "L'élève"} va être déconnecté dans les 30 secondes`);
  chargerSessions();
}, true);
document.addEventListener("keydown", e => { if (e.key === "Escape" && document.getElementById("sesPanel")) fermerSessions(); });
/* message affiché à l'élève après une déconnexion à distance */
try { if (sessionStorage.getItem("pp_kick")) { sessionStorage.removeItem("pp_kick"); setTimeout(() => toast("Tu as été déconnecté par ton professeur. Pense à te déconnecter quand tu quittes un ordinateur du lycée."), 1500); } } catch (_) {}

/* ---------- Pour les élèves : le professeur est-il en ligne ? ---------- */
const STP = { d: null, t: null };
function statutProf(){
  if (S.prof || !S.user) return "";
  const d = STP.d; if (!d) return `<span class="statprof"></span>`;
  const ok = !!d.actif;
  return `<span class="statprof"><span class="stp ${ok ? "vert" : "rouge"}" title="${ok ? "Ton professeur est connecté et utilise le site en ce moment." : "Ton professeur n'est pas disponible sur le site en ce moment."}"><i></i>${ok ? "Disponible" : "Indisponible"}</span></span>`;
}
async function chargerStatutProf(){
  if (S.prof || !S.user) return;
  const { data, error } = await sb.rpc("pp_statut_prof"); if (error) return;
  STP.d = typeof data === "string" ? JSON.parse(data) : data;
  document.querySelectorAll(".statprof").forEach(z => z.outerHTML = statutProf());
}
const _demarrerPresence = demarrerPresence;
demarrerPresence = function(){ _demarrerPresence(); if (!S.prof && !STP.t) { chargerStatutProf(); STP.t = setInterval(chargerStatutProf, 15000); document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") chargerStatutProf(); }); } };
