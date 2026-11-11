/* =====================================================================
   Personnes en ligne (professeur) : liste détaillée et déconnexion à distance
   ===================================================================== */
const SES = { liste: null, err: "", q: "", t: null, arme: null };
const heureCourte = d => new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
/* téléphone ou tablette : l'élève ferme l'application sans se déconnecter, c'est normal */
const estMobile = x => /^(iPhone|iPad|Android)\b/.test(x.appareil || "");
const ilYa = d => { const m = Math.round((Date.now() - new Date(d)) / 60000); return m < 1 ? "à l'instant" : m >= 1440 ? `il y a ${Math.round(m / 1440)} jour${Math.round(m / 1440) > 1 ? "s" : ""}` : m < 60 ? `il y a ${m} min` : `il y a ${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}`; };
async function chargerSessions(){
  const { data, error } = await sb.rpc("pp_sessions");
  if (error) { SES.err = /pp_sessions|function/i.test(error.message) ? "La liste détaillée n'est pas encore installée (étape 23 de la base de données)." : error.message; SES.liste = []; }
  else { SES.err = ""; const brut = typeof data === "string" ? JSON.parse(data) : (data || []), vus = new Map();
    /* un même navigateur peut avoir plusieurs onglets : on n'en garde qu'un (le plus récent, visible en priorité) */
    brut.sort((a, b) => (b.visible && b.en_ligne) - (a.visible && a.en_ligne) || new Date(b.vu_le) - new Date(a.vu_le)).forEach(x => { const k = x.email + "|" + x.appareil; if (!vus.has(k)) vus.set(k, x); });
    SES.liste = [...vus.values()]; }
  /* élèves des cours sans aucune connexion ouverte (étape 43) */
  try { const r = await sb.rpc("pp_eleves_deconnectes"); SES.deco = r.error ? null : (typeof r.data === "string" ? JSON.parse(r.data) : (r.data || [])); } catch (_) { SES.deco = null; }
  dessinerSessions();
}
function ligneSession(x){
  if (!x.nom || x.nom.includes("@")) x.nom = nomDepuisEmail(x.email || x.nom || "?");
  const st = x.statut || (x.deconnecter ? "attente" : x.en_ligne ? "actif" : "inactif");
  const etat = st === "attente" ? `<span class="sest attente">Déconnexion demandée…</span>` : st === "actif" ? (x.visible ? `<span class="sest on">En ligne</span>` : `<span class="sest fond">En ligne · onglet en arrière-plan</span>`)
    : st === "expiree" ? `<span class="sest exp">Déconnecté automatiquement</span>` : estMobile(x) ? `<span class="sest off">Inactif · dernière activité ${ilYa(x.actif_le || x.vu_le)}</span>` : `<span class="sest inact">Inactif · dernière activité ${ilYa(x.actif_le || x.vu_le)}</span>`;
  const btn = x.moi ? `<span class="muted sesmoi">${x.id === idSession() ? "Toi (cette page)" : "Toi (autre appareil)"}</span>` : x.deconnecter ? "" : `<button class="btn sm ${SES.arme === x.id ? "danger" : "ghost"}" data-act="sesdeco" data-id="${esc(x.id)}">${icon("logout")} ${SES.arme === x.id ? "Confirmer ?" : "Déconnecter"}</button>`;
  return `<div class="sesl${x.en_ligne ? "" : " inactif"}">${avatarP(x.nom || x.email || "?", "")}<div class="sesinfo"><b>${esc(x.nom || x.email)}</b>${x.role === "prof" ? ` <span class="simniv">Professeur</span>` : ""}<small>${esc(x.classes || (x.role === "prof" ? "" : "Aucun cours"))}</small><small class="muted">${esc(x.appareil || "Appareil inconnu")} · connecté depuis ${heureCourte(x.debut)}</small></div>${etat}${btn}</div>`;
}
function dessinerSessions(){
  const z = document.querySelector("#sesPanel .sescorps"); if (!z) return;
  if (!SES.liste) { z.innerHTML = `<p class="muted">Chargement…</p>`; return; }
  if (SES.err) { z.innerHTML = `<p class="ores err">${esc(SES.err)}</p>`; return; }
  const q = sansAccent(SES.q), L = SES.liste.filter(x => !q || sansAccent([x.nom, x.email, x.classes, x.appareil].join(" ")).includes(q));
  const stx = x => x.statut || (x.deconnecter ? "attente" : x.en_ligne ? "actif" : "inactif");
  const on = L.filter(x => stx(x) === "actif"), horsLigne = L.filter(x => stx(x) === "inactif" || stx(x) === "attente"),
    off = horsLigne.filter(x => !estMobile(x)), tel = horsLigne.filter(estMobile), nbEl = SES.liste.filter(x => x.role !== "prof" && !x.deconnecter && stx(x) !== "expiree").length;
  z.innerHTML = `<section><h4><i class="pt vert"></i>En ligne maintenant · ${on.length}</h4><p class="muted sesaide">L'élève travaille sur le site en ce moment : page ouverte devant lui (ordinateur) ou application ouverte (téléphone), avec une activité dans les 5 dernières minutes.</p>${on.map(ligneSession).join("") || `<p class="muted">Personne en ligne.</p>`}</section>
    <section><h4><i class="pt orange"></i>Inactifs sur un ordinateur · ${off.length}</h4><p class="muted sesaide">Toujours connecté sur un ordinateur, mais ne travaille pas sur le site : il a sans doute oublié de se déconnecter (ordinateur du lycée, par exemple). À déconnecter.</p>${off.map(ligneSession).join("") || `<p class="muted">Aucun.</p>`}</section>
    <section><h4><i class="pt gris"></i>Inactifs sur un téléphone ou une tablette · ${tel.length}</h4><p class="muted sesaide">Toujours connecté sur son téléphone, mais l'application est fermée ou en arrière-plan. C'est normal : il n'a pas à se déconnecter, rien à faire.</p>${tel.map(ligneSession).join("") || `<p class="muted">Aucun.</p>`}</section>
    ${SES.deco ? (() => { const D = SES.deco.filter(x => !q || sansAccent([x.nom, x.email, x.classes].join(" ")).includes(q));
      return `<section><details${q ? " open" : ""}><summary style="cursor:pointer"><h4 style="display:inline;margin-left:4px"><i class="pt gris"></i>Déconnectés · ${D.length}</h4></summary><p class="muted sesaide">Élèves de tes cours qui ne sont connectés sur aucun appareil.</p>${D.map(x => `<div class="sesl inactif">${avatarP(x.nom || x.email, "")}<div class="sesinfo"><b>${esc(x.nom || nomDepuisEmail(x.email))}</b><small>${esc(x.classes || "")}</small>${x.derniere_visite ? `<small class="muted">Dernière visite ${ilYa(x.derniere_visite)}</small>` : `<small class="muted">Jamais connecté</small>`}</div><span class="sest off">Déconnecté</span></div>`).join("") || `<p class="muted">Aucun.</p>`}</details></section>`; })() : ""}
`;
  const tous = document.querySelector('#sesPanel [data-act="sesdecotous"]'); if (tous) { tous.disabled = !nbEl; tous.className = "btn sm " + (SES.arme === "tous" ? "danger" : "ghost"); tous.innerHTML = `${icon("logout")} ${SES.arme === "tous" ? `Confirmer : déconnecter ${nbEl} session${nbEl > 1 ? "s" : ""} d'élèves ?` : "Déconnecter tous les élèves"}`; }
}
function ouvrirSessions(){
  if (document.getElementById("sesPanel")) return;
  const p = document.createElement("div"); p.id = "sesPanel"; p.className = "sesfond";
  p.innerHTML = `<div class="sesboite" role="dialog" aria-modal="true" aria-label="Élèves connectés"><header>${icon("people")}<b>Élèves connectés</b><button class="ib" data-act="sesfermer" aria-label="Fermer">${icon("x")}</button></header>
    <div class="sesbarre"><input type="search" id="sesQ" placeholder="Chercher un nom, une classe…" aria-label="Chercher"><button class="btn sm ghost" data-act="sesdecotous">${icon("logout")} Déconnecter tous les élèves</button></div>
    <p class="muted sesaide">La déconnexion prend effet en moins de 30 secondes. Elle ferme aussi la session Microsoft de ce navigateur : l'élève suivant devra entrer son propre mot de passe.</p>
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
  const { data, error } = await sb.rpc("pp_deconnecter", { p_session: id === "tous" ? null : id });
  if (error) toast("Déconnexion impossible : " + error.message);
  else toast(id === "tous" ? `${data || 0} session${data > 1 ? "s" : ""} d'élèves vont être déconnectées` : "La session va être déconnectée dans les 30 secondes");
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
