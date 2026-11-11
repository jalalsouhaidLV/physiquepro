/* =====================================================================
   31 · Le site sur téléphone (iPhone et Android), 11/11/2026
   A. Réponses gardées · zoom iPhone (CSS) · envoi fiable · « C'est rendu ! »
      · « Ce n'est pas moi » · gros QCM (CSS) · clavier de physique
   B. Installation guidée · « Mon téléphone est-il prêt ? » · rappel la veille
      (fonction pp-rappels, étape 39) · prochain travail · visite guidée
      · image au doigt · tirer pour actualiser · « Ajouter à mon agenda »
   C. Une question par écran · mode concentration · pastille de l'icône
      · cases à cocher des consignes · question avec photo · reprise de lecture
      · simulations en plein écran
   D. Hors connexion · économie de données · WhatsApp · capture de simulation
      · « Partager vers PhysiquePro » · raccourcis de l'icône (manifest.json)
   ===================================================================== */
IC.phone = IC.phone || '<rect x="7" y="2.5" width="10" height="19" rx="2.2"/><path d="M11 18.5h2"/>';
IC.share = IC.share || '<path d="M12 3v12M8 7l4-4 4 4"/><path d="M6 11H5v10h14V11h-1"/>';
IC.dots = IC.dots || '<circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/>';
IC.wifi = IC.wifi || '<path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19.3" r="1"/>';
IC.full = IC.full || '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>';
IC.photo = IC.photo || '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/>';
IC.leaf = IC.leaf || '<path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15"/><path d="M5 19l7-7"/>';

const tactile = () => !!(window.matchMedia && matchMedia("(pointer:coarse)").matches);
const petitEcran = () => window.innerWidth <= 600;
const surTelephone = () => telephone() || (tactile() && petitEcran());
const enLigne = () => navigator.onLine !== false;
const appliInstallee = () => (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
const estAndroid = () => /Android/i.test(navigator.userAgent);
const estIPhone = () => /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
function lireLS(k){ try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (_) { return null; } }
function ecrireLS(k, v){ try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} }
const cleTel = k => "pp_tel_" + (S.user ? S.user.id : "x") + "_" + k;
const attendre = ms => new Promise(r => setTimeout(r, ms));
const vibrer = m => { try { if (navigator.vibrate) navigator.vibrate(m); } catch (_) {} };

/* petite base IndexedDB (fichiers choisis, données hors connexion, partages reçus) */
let _idb = null;
function idb(){
  if (_idb) return _idb;
  _idb = new Promise((ok, ko) => { try { const o = indexedDB.open("pp-telephone", 1); o.onupgradeneeded = () => { o.result.createObjectStore("kv"); }; o.onsuccess = () => ok(o.result); o.onerror = () => ko(o.error); } catch (e) { ko(e); } });
  _idb.catch(() => { _idb = null; });
  return _idb;
}
async function idbGet(k){ try { const db = await idb(); return await new Promise((ok, ko) => { const r = db.transaction("kv").objectStore("kv").get(k); r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error); }); } catch (_) { return undefined; } }
async function idbSet(k, v){ try { const db = await idb(); await new Promise((ok, ko) => { const t = db.transaction("kv", "readwrite"); t.objectStore("kv").put(v, k); t.oncomplete = ok; t.onerror = () => ko(t.error); }); return true; } catch (_) { return false; } }
async function idbDel(k){ try { const db = await idb(); await new Promise(ok => { const t = db.transaction("kv", "readwrite"); t.objectStore("kv").delete(k); t.oncomplete = ok; t.onerror = ok; }); } catch (_) {} }

/* ---------------------------------------------------------------- A1. Ne plus perdre ses réponses
   Questionnaire : réponses gardées dans le téléphone (localStorage) jusqu'à l'envoi.
   Devoir : fichiers choisis, lien et réponse gardés (IndexedDB) jusqu'au rendu. */
const BR = { vu: null, pret: false, sig: "", qvu: null };
const sigTravail = () => S.files.map(f => f.name + ":" + f.size).join("|") + "#" + (S.reponse || "") + "#" + (S.lien || "");
function oublierBrouillonQuiz(qid){ ecrireLS(cleTel("q" + qid), null); }
async function gererBrouillonDevoir(did){
  const d = S.devoirs.find(x => String(x.id) === String(did)); if (!d || S.prof || !S.user) return;
  const k = cleTel("d" + d.id);
  if (BR.vu !== String(d.id)) {
    BR.vu = String(d.id); BR.pret = false;
    const b = await idbGet(k);
    if (route().v !== "devoir" || route().a !== String(d.id)) { BR.vu = null; return; }
    if (b && renduDe(d, moi())) { await idbDel(k); BR.sig = sigTravail(); BR.pret = true; return; }
    if (b && !S.files.length && !S.reponse && !S.lien) {
      S.files = (b.files || []).map(x => x instanceof File ? x : new File([x.blob || x], x.name || "fichier", { type: x.type || "" }));
      S.reponse = b.reponse || ""; S.lien = b.lien || ""; if (S.lien) S.lienOpen = true;
      BR.sig = sigTravail(); BR.pret = true;
      if (S.files.length || S.reponse || S.lien) { render(); toast("Ton travail pas encore envoyé a été retrouvé ✓"); }
      return;
    }
    BR.sig = sigTravail(); BR.pret = true; return;
  }
  if (!BR.pret) return;
  const s = sigTravail(); if (s === BR.sig) return; BR.sig = s;
  if (!S.files.length && !S.reponse && !S.lien) await idbDel(k);
  else await idbSet(k, { files: S.files.slice(), reponse: S.reponse || "", lien: S.lien || "", le: Date.now() });
}
function restaurerQuiz(qid){
  if (BR.qvu === String(qid)) return; BR.qvu = String(qid);
  const q = S.quiz.find(x => String(x.id) === String(qid)); if (!q || S.prof) return;
  const k = cleTel("q" + q.id), b = lireLS(k); if (!b) return;
  if (q.mode === "note" && resultatDe(q, S.user.id)) { ecrireLS(k, null); return; }
  if (S.quizRes[q.id]) return;
  const cur = S.quizRep[q.id]; if (cur && Object.keys(cur).length) return;
  S.quizRep[q.id] = b; render(); toast("Tes réponses ont été retrouvées ✓");
}
const surSaisie = e => {
  const t = e.target; if (!t || !t.dataset || S.prof || !S.user) return;
  if (["anstxt", "ans", "anscase"].includes(t.dataset.act)) setTimeout(() => { const id = t.dataset.q; ecrireLS(cleTel("q" + id), S.quizRep[id] || null); }, 0);
  if (t.id === "repQ" || t.id === "lien" || t.dataset.act === "repchoix") setTimeout(() => { const r = route(); if (r.v === "devoir") gererBrouillonDevoir(r.a); }, 0);
};
document.addEventListener("input", surSaisie);
document.addEventListener("change", surSaisie);
window.addEventListener("hashchange", () => { BR.vu = null; BR.qvu = null; });

/* ---------------------------------------------------------------- A3. Envoi fiable en 4G */
const estErreurReseau = e => !!e && (e.name === "TypeError" || /Failed to fetch|NetworkError|Load failed|network|fetch|timeout|ECONN|connexion/i.test(String(e.message || e)));
/* rejoue un envoi quand le réseau a coupé (3 essais) ; un « déjà existant » après un nouvel essai veut dire que le 1er essai était passé */
async function envoiAvecEssais(fn, surEssai){
  let res = null;
  for (let n = 1; n <= 3; n++) {
    try { res = await fn(); } catch (e) { res = { error: e }; }
    if (!res || !res.error) return res || {};
    if (!estErreurReseau(res.error)) {
      const m = String(res.error.message || "") + " " + (res.error.code || "") + " " + (res.error.statusCode || "");
      if (n > 1 && /duplicate|already exists|23505|409/i.test(m)) return { data: res.data, error: null };
      return res;
    }
    if (n < 3) { if (surEssai) surEssai(n + 1); await attendre(1500 * n); }
  }
  return res;
}
/* photo trop lourde : réduite à 2000 px de côté, en JPEG (une photo de 8 Mo passe à moins de 1 Mo) */
async function alleger(f){
  try {
    if (!f || !/^image\/(jpeg|png|webp|heic|heif)$/i.test(f.type || "") || f.size < 1.2e6) return f;
    const url = URL.createObjectURL(f);
    const img = await new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = url; });
    let blob = null;
    for (const [max, q] of [[2000, .82], [2000, .7], [1600, .7], [1280, .65]]) {   /* on vise moins de 1,2 Mo, sans rendre l'écriture illisible */
      const r = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement("canvas"); c.width = Math.round(img.naturalWidth * r); c.height = Math.round(img.naturalHeight * r);
      const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
      blob = await new Promise(ok => c.toBlob(ok, "image/jpeg", q));
      if (blob && blob.size < 1.2e6) break;
    }
    URL.revokeObjectURL(url);
    if (!blob || blob.size >= f.size) return f;
    return new File([blob], f.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch (_) { return f; }
}
/* fenêtre d'envoi : fichier i sur n, barre de progression, nouvel essai si le réseau est faible */
function progressionEnvoi(i, n, frac, nom, essai){
  let o = document.getElementById("ppEnvoi");
  if (i == null) { if (o) o.remove(); return; }
  if (!o) { o = document.createElement("div"); o.id = "ppEnvoi"; o.setAttribute("role", "status"); document.body.appendChild(o); }
  const p = Math.max(3, Math.min(100, Math.round((frac || 0) * 100)));
  o.innerHTML = `<div class="envbox"><b>${icon("upload")} Envoi de ton travail…</b>
    <div class="envbar"><i style="width:${p}%"></i></div>
    <span>${n > 1 ? `Fichier ${i} sur ${n}` : nom ? "1 fichier" : "Presque fini"}${nom ? " · " + esc(nom) : ""} · ${p} %</span>
    ${essai ? `<span class="enverr">${icon("wifi")} Le réseau est faible : nouvel essai (${essai}/3)…</span>` : ""}
    <small>Ne ferme pas l'application pendant l'envoi.</small></div>`;
}

/* ---------------------------------------------------------------- A4. Confirmation géante « C'est rendu ! » */
function confirmationRendu(o, titre, ligne){
  vibrer([60, 40, 60]);
  const t = now(), x = document.createElement("div");
  x.id = "ppRendu"; x.setAttribute("role", "alertdialog"); x.setAttribute("aria-label", titre);
  x.innerHTML = `<div class="rendubox"><svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24"/><path d="M14 27l8 8 16-17"/></svg>
    <h2>${esc(titre === "Devoir rendu !" ? "C'est rendu !" : titre)}</h2><p><b>${esc(o.titre || "")}</b></p>
    ${ligne ? `<p class="rendunote">${ligne}</p>` : ""}<p>Envoyé le ${fmtShort(t)} à ${fmtT(t)}. Ton professeur le voit déjà.</p>
    <button class="btn" data-rendu-ok="1">OK</button></div>`;
  document.getElementById("ppRendu")?.remove();
  document.body.appendChild(x);
  x.addEventListener("click", e => { if (e.target.closest("[data-rendu-ok]") || e.target === x) { x.remove(); if (o && o.questions) { window.scrollTo(0, 0); document.querySelector(".quizbilan")?.focus({ preventScroll: true }); } } });
  setTimeout(() => x.querySelector("button")?.focus(), 50);
  setTimeout(() => { if (x.isConnected) x.classList.add("fin"); }, 7000);
  setTimeout(() => x.remove(), 7500);
}

/* ---------------------------------------------------------------- A5. Téléphone partagé : « Ce n'est pas moi » */
function quiRend(){
  if (S.prof || !S.user) return "";
  return `<p class="quirend">${icon("people")}<span>Tu rends en tant que <b>${esc(S.nom)}</b>. <a href="#" data-act="pasmoi">Ce n'est pas moi</a></span></p>`;
}
VUES_MODAL.pasmoi = () => ({ foot: false, body: `<h2>${icon("people")} Ce n'est pas toi ?</h2>
  <p style="margin:0">Ce téléphone est connecté avec le compte de <b>${esc(S.nom)}</b> (${esc(moi())}).</p>
  <p style="margin:0">Pour rendre <b>ton</b> travail, déconnecte ce compte, puis connecte-toi avec <b>ta propre adresse</b> du lycée. Ce qui n'est pas encore envoyé reste dans le compte de ${esc(S.nom.split(" ")[0])}.</p>
  <div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap"><button class="btn ghost" data-act="mclose">C'est bien moi</button><button class="btn danger" data-act="logout">${icon("logout")} Changer de compte</button></div>` });
ACTIONS_PLUS.pasmoi = (a, e) => { e.preventDefault(); S.modal = { kind: "pasmoi" }; render(); };

/* ---------------------------------------------------------------- A7. Clavier de physique (réponses numériques) */
const TOUCHES_PHY = [["−", "-"], [",", ","], ["×10^", "×10^"], ["⌫", "⌫"]];
const UNITES_PHY = ["m/s", "N", "J", "W", "V", "A", "Ω", "kg", "g", "s", "mol/L", "g/L", "Hz", "Pa"];
function clavierPhysique(qid, i){
  if (!tactile() && !petitEcran()) return "";
  const b = (l, v, cl = "") => `<button type="button" class="kp${cl}" data-act="clavphy" data-q="${esc(qid)}" data-i="${i}" data-v="${esc(v)}" data-keepfocus="1" aria-label="${v === "⌫" ? "Effacer" : "Écrire " + esc(l)}">${esc(l)}</button>`;
  return `<div class="clavphy" role="toolbar" aria-label="Clavier de physique">${TOUCHES_PHY.map(([l, v]) => b(l, v, v === "⌫" ? " efface" : "")).join("")}
    <details class="kpunites"><summary>Unités</summary><div>${UNITES_PHY.map(u => b(u, " " + u, " unite")).join("")}</div></details></div>`;
}
ACTIONS_PLUS.clavphy = (a, e) => {
  e.preventDefault();
  const inp = document.querySelector(`input[data-act="anstxt"][data-q="${CSS.escape(a.dataset.q)}"][data-i="${CSS.escape(a.dataset.i)}"]`); if (!inp || inp.disabled) return;
  const v = inp.value, s = inp.selectionStart ?? v.length, f = inp.selectionEnd ?? v.length;
  let nv, pos;
  if (a.dataset.v === "⌫") { if (s !== f) { nv = v.slice(0, s) + v.slice(f); pos = s; } else { nv = v.slice(0, Math.max(0, s - 1)) + v.slice(s); pos = Math.max(0, s - 1); } }
  else { nv = v.slice(0, s) + a.dataset.v + v.slice(f); pos = s + a.dataset.v.length; }
  inp.value = nv; try { inp.setSelectionRange(pos, pos); } catch (_) {}
  inp.dispatchEvent(new Event("input", { bubbles: true })); vibrer(8);
};

/* ---------------------------------------------------------------- rendu de chaque page : crochets */
APRES_RENDU.push(() => {
  if (!S.user || S.public) return;
  const r = route();
  if (!S.prof && r.v === "devoir") gererBrouillonDevoir(r.a);
  if (!S.prof && r.v === "quiz") restaurerQuiz(r.a);
});

/* ================================================================ B. guider et prévenir */
/* liste des travaux à faire de l'élève (devoirs et questionnaires), du plus urgent au moins urgent */
function travauxAFaire(){
  if (S.prof || !S.user) return [];
  const t = now(), vis = o => !o.brouillon && (!o.publie_le || D(o.publie_le) <= t) && cls(o.classe_id) && !cls(o.classe_id).archive;
  const dv = S.devoirs.filter(d => vis(d) && depotOuvert(d) && !renduDe(d, moi())).map(d => ({ o: d, k: "devoir", lim: d.date_limite ? D(d.date_limite) : null }));
  const qz = S.quiz.filter(q => vis(q) && !resultatDe(q, S.user.id) && (!q.date_limite || D(q.date_limite) > t) && (q.mode === "note" || q.date_limite)).map(q => ({ o: q, k: "quiz", lim: q.date_limite ? D(q.date_limite) : null }));
  return [...dv, ...qz].sort((a, b) => (a.lim ? +a.lim : 9e15) - (b.lim ? +b.lim : 9e15));
}
function urgenceDe(lim){
  if (!lim) return { cl: "calme", txt: "Pas de date limite" };
  const j = Math.floor((new Date(lim).setHours(0, 0, 0, 0) - new Date(now()).setHours(0, 0, 0, 0)) / 864e5);
  const h = `à ${fmtT(lim)}`;
  if (j <= 0) return { cl: "rouge", txt: "Aujourd'hui " + h };
  if (j === 1) return { cl: "rouge", txt: "Demain " + h };
  if (j <= 3) return { cl: "orange", txt: lim.toLocaleDateString("fr-FR", { weekday: "long" }) + " " + h };
  return { cl: "vert", txt: "Le " + fmtShort(lim) + " " + h };
}

/* ---------------------------------------------------------------- B12. Accueil élève : « Ton prochain travail » */
function blocProchain(){
  const L = travauxAFaire(), x = L[0];
  const qui = `<p class="telqui">${icon("people")} Connecté : <b>${esc(S.nom)}</b> · <a href="#" data-act="pasmoi">Ce n'est pas moi</a></p>`;
  if (!x) return `<section class="tel-prochain fini"><div class="tpico">${icon("check")}</div><div class="tptxt"><small>Ton prochain travail</small><b>Bravo, tu n'as rien à rendre !</b>${qui}</div></section>`;
  const u = urgenceDe(x.lim), c = cls(x.o.classe_id), href = (x.k === "quiz" ? "#/quiz/" : "#/devoir/") + x.o.id;
  return `<section class="tel-prochain ${u.cl}"><small>Ton prochain travail</small>
    <b class="tptitre">${esc(x.o.titre)}</b>
    <span class="tpcours">${esc(c ? c.nom : "")}${x.k === "quiz" ? " · Questionnaire" : ""}</span>
    <span class="tpdate">${icon("clock")} ${esc(u.txt)}</span>
    <a class="btn tpgo" href="${href}">Commencer</a>
    ${L.length > 1 ? `<a class="tpautres" href="#/todo">+ ${L.length - 1} autre${L.length > 2 ? "s" : ""} ${L.length > 2 ? "travaux" : "travail"} à faire</a>` : ""}${qui}</section>`;
}
const _vAccueilTel = vAccueil;
vAccueil = function(){
  const h = _vAccueilTel.apply(this, arguments);
  if (S.prof || !actives().length) return h;
  return h.replace('<div class="page wide home">', '<div class="page wide home">' + blocProchain());
};

/* ---------------------------------------------------------------- B13. Visite guidée (1re connexion, revoir dans le Profil) */
const ETAPES_VISITE = [
  { sel: ".tel-prochain .tpgo, .tel-prochain", t: "Ton prochain travail", x: "Ici, tu vois toujours le travail le plus urgent. Touche « Commencer » pour l'ouvrir, le faire et le rendre." },
  { sel: '.navbas a[href="#/todo"], .drawer a[href="#/todo"]', t: "Tous tes devoirs", x: "Ici, la liste de tout ce que tu as à faire, avec les dates limites." },
  { sel: ".bellwrap .ib", t: "Les nouveautés", x: "La cloche te prévient d'une nouvelle annonce, d'un nouveau devoir ou d'une note." },
  { sel: '.navbas [data-act="drawer"], .menubtn', t: "Le menu", x: "Dans le menu : tes cours, tes notes, les simulations et les réglages." },
  { sel: '.topbar .avatar[data-act="me"]', t: "Ton compte", x: "Ici, ton nom. Vérifie toujours que c'est bien toi avant de rendre un travail." }
];
const VIS = { i: 0, on: false };
function lancerVisite(){ VIS.i = 0; VIS.on = true; fermerMenus(); if (typeof ajouterCouche === "function") ajouterCouche(); if (route().v !== "accueil") { go("/"); setTimeout(etapeVisite, 600); } else etapeVisite(); }
function finirVisite(){ VIS.on = false; ecrireLS(cleTel("visite"), 1); document.getElementById("ppVisite")?.remove(); }
function etapeVisite(){
  if (!VIS.on) return;
  let el = null, E = null;
  while (VIS.i < ETAPES_VISITE.length) { E = ETAPES_VISITE[VIS.i]; el = [...document.querySelectorAll(E.sel)].find(x => x.offsetParent !== null || getComputedStyle(x).position === "fixed"); if (el) break; VIS.i++; }
  if (!el) { finirVisite(); return; }
  el.scrollIntoView({ block: "center", behavior: "instant" in document.documentElement.style ? "instant" : "auto" });
  const r = el.getBoundingClientRect(), m = 6, n = ETAPES_VISITE.length;
  let o = document.getElementById("ppVisite");
  if (!o) { o = document.createElement("div"); o.id = "ppVisite"; document.body.appendChild(o); }
  const bas = r.top + r.height / 2 < window.innerHeight / 2;
  o.innerHTML = `<div class="vtrou" style="left:${r.left - m}px;top:${r.top - m}px;width:${r.width + 2 * m}px;height:${r.height + 2 * m}px"></div>
    <div class="vbulle" role="dialog" aria-label="Visite guidée" style="${bas ? `top:${Math.min(window.innerHeight - 220, r.bottom + 14)}px` : `bottom:${Math.min(window.innerHeight - 220, window.innerHeight - r.top + 14)}px`}">
      <small>Étape ${VIS.i + 1} sur ${n}</small><b>${esc(E.t)}</b><p>${esc(E.x)}</p>
      <div class="vbtns"><button class="btn ghost" data-vis="passer">Passer la visite</button><button class="btn" data-vis="suivant">${VIS.i + 1 >= n ? "C'est compris !" : "Suivant"}</button></div></div>`;
  o.onclick = e => { const b = e.target.closest("[data-vis]"); if (!b) return; if (b.dataset.vis === "passer") finirVisite(); else { VIS.i++; if (VIS.i >= n) finirVisite(); else etapeVisite(); } };
  setTimeout(() => o.querySelector('[data-vis="suivant"]')?.focus(), 30);
}
window.addEventListener("resize", () => { if (VIS.on) etapeVisite(); });
/* Lot N (4e évaluation) : la visite montre l'accueil ; si l'élève change de page (notification, lien, Retour), elle s'arrête au lieu d'entourer un autre élément */
window.addEventListener("hashchange", () => { if (VIS.on && route().v !== "accueil") finirVisite(); });
ACTIONS_PLUS.visite = (a, e) => { e.preventDefault(); S.modal = null; lancerVisite(); };

/* ---------------------------------------------------------------- B9. Installation guidée à la 1re connexion */
const navigateurIOS = () => { const u = navigator.userAgent; return /CriOS/.test(u) ? "Chrome" : /FxiOS/.test(u) ? "Firefox" : /EdgiOS/.test(u) ? "Edge" : /FBAN|FBAV|Instagram|Line\/|GSA\/|Snapchat|TikTok|WhatsApp/i.test(u) ? "appli" : "Safari"; };
const dansAppli = () => /FBAN|FBAV|Instagram|Line\/|Snapchat|TikTok|; wv\)|WhatsApp/i.test(navigator.userAgent);
const svgPartage = `<svg viewBox="0 0 24 24" class="vsvg" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M6 11H5v10h14V11h-1"/></svg>`;
const svgPoints = `<svg viewBox="0 0 24 24" class="vsvg" aria-hidden="true"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>`;
const svgPlusCarre = `<svg viewBox="0 0 24 24" class="vsvg" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/></svg>`;
const svgIcone = `<span class="vappico"><img src="icon-192.png" alt=""></span>`;
function etapesInstall(){
  if (appliInstallee()) return `<p class="telok">${icon("check")} PhysiquePro est déjà installé sur ce téléphone.</p>`;
  if (estIPhone()) {
    if (dansAppli() || navigateurIOS() === "appli") return `<ol class="vetapes"><li><span class="vnum">1</span><span>Tu es dans une autre appli (WhatsApp, Instagram…). Touche ${svgPoints} ou ${svgPartage} puis <b>« Ouvrir dans Safari »</b>.</span></li><li><span class="vnum">2</span><span>Dans Safari, reviens sur cette page pour installer PhysiquePro.</span></li></ol>`;
    return `<ol class="vetapes"><li><span class="vnum">1</span><span>Touche le bouton <b>Partager</b> ${svgPartage} ${navigateurIOS() === "Safari" ? "en bas de Safari" : "dans la barre de " + navigateurIOS()}.</span></li>
      <li><span class="vnum">2</span><span>Fais défiler, puis touche <b>« Sur l'écran d'accueil »</b> ${svgPlusCarre}</span></li>
      <li><span class="vnum">3</span><span>Touche <b>« Ajouter »</b>, puis ouvre PhysiquePro depuis son icône ${svgIcone}</span></li></ol>`;
  }
  if (typeof invitationInstall !== "undefined" && invitationInstall) return `<p style="margin:0">Un seul toucher suffit :</p><button class="btn tpgo" data-act="installer">${icon("install")} Installer PhysiquePro</button>`;
  return `<ol class="vetapes"><li><span class="vnum">1</span><span>Touche ${svgPoints} en haut à droite de Chrome.</span></li>
    <li><span class="vnum">2</span><span>Touche <b>« Installer l'application »</b> ou <b>« Ajouter à l'écran d'accueil »</b>.</span></li>
    <li><span class="vnum">3</span><span>Ouvre ensuite PhysiquePro depuis son icône ${svgIcone}</span></li></ol>`;
}
VUES_MODAL.installtel = () => ({ foot: false, body: `<h2>${icon("phone")} Installe PhysiquePro sur ton téléphone</h2>
  <p class="muted" style="margin:0">Il s'ouvrira comme une vraie application, en plein écran.${estIPhone() ? " Sur iPhone, c'est aussi obligatoire pour recevoir les notifications." : ""}</p>
  ${etapesInstall()}
  <div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap"><a class="btn ghost" href="#/telephone" data-act="mclose2">Vérifier mon téléphone</a><button class="btn" data-act="mclose">Plus tard</button></div>` });
ACTIONS_PLUS.mclose2 = () => { S.modal = null; };
function proposerInstall(){
  if (S.prof || S.modal || VIS.on || !surTelephone() || appliInstallee() || route().v !== "accueil") return;
  if (!lireLS(cleTel("visite"))) { if (document.querySelector(".tel-prochain")) setTimeout(() => { if (!S.modal && route().v === "accueil" && !VIS.on && !lireLS(cleTel("visite"))) lancerVisite(); }, 700); return; }
  if (lireLS(cleTel("installvu"))) return;
  ecrireLS(cleTel("installvu"), Date.now()); S.modal = { kind: "installtel" }; render();
}

/* ---------------------------------------------------------------- B10. Page « Mon téléphone est-il prêt ? » */
function versionIOS(){ const m = navigator.userAgent.match(/OS (\d+)[_.](\d+)/); return m && estIPhone() ? [Number(m[1]), Number(m[2])] : null; }
function versionAndroid(){ const m = navigator.userAgent.match(/Android (\d+(?:\.\d+)?)/); return m ? Number(m[1]) : null; }
const TEL = { res: {} };
function lignesTelephone(){
  const L = [], v = versionIOS(), va = versionAndroid(), ios = estIPhone();
  const ligne = (id, ic, t, etat, txt, faire) => L.push({ id, ic, t, etat, txt, faire });
  if (ios) ligne("sys", "phone", "Système", v && (v[0] > 16 || (v[0] === 16 && v[1] >= 4)) ? "ok" : "warn", v ? "iOS " + v.join(".") : "iPhone ou iPad", v && (v[0] < 16 || (v[0] === 16 && v[1] < 4)) ? "Mets à jour l'iPhone (Réglages › Général › Mise à jour logicielle) : il faut iOS 16.4 ou plus récent pour les notifications." : "");
  else if (va) ligne("sys", "phone", "Système", va >= 9 ? "ok" : "warn", "Android " + va, va < 9 ? "Ton Android est ancien : certaines fonctions peuvent manquer." : "");
  else ligne("sys", "phone", "Système", "ok", /Windows/.test(navigator.userAgent) ? "Windows" : /Mac/.test(navigator.userAgent) ? "Mac" : "Ordinateur", "");
  const nav = ios ? navigateurIOS() : /SamsungBrowser/.test(navigator.userAgent) ? "Samsung Internet" : /Edg\//.test(navigator.userAgent) ? "Edge" : /Firefox/.test(navigator.userAgent) ? "Firefox" : /Chrome/.test(navigator.userAgent) ? "Chrome" : "Autre";
  if (dansAppli()) ligne("nav", "links", "Navigateur", "bad", "Ouvert dans une autre appli", ios ? "Ouvre le site dans Safari (menu ⋯ › « Ouvrir dans Safari »)." : "Ouvre le site dans Chrome (menu ⋮ › « Ouvrir dans Chrome »).");
  else ligne("nav", "links", "Navigateur", (ios && nav !== "Safari") || (!ios && telephone() && !["Chrome", "Samsung Internet", "Edge"].includes(nav)) ? "warn" : "ok", nav, ios && nav !== "Safari" ? "Safari est conseillé sur iPhone pour installer l'appli et recevoir les notifications." : !ios && telephone() && !["Chrome", "Samsung Internet", "Edge"].includes(nav) ? "Chrome est conseillé sur Android." : "");
  ligne("app", "install", "Application installée", appliInstallee() ? "ok" : telephone() ? "warn" : "ok", appliInstallee() ? "Oui" : telephone() ? "Pas encore" : "Inutile sur ordinateur", appliInstallee() || !telephone() ? "" : "Installe PhysiquePro : <a href=\"#\" data-act=\"installguide\">voir comment</a>.");
  const pp = typeof pushPossible === "function" && pushPossible(), perm = typeof Notification !== "undefined" ? Notification.permission : "absent";
  const sub = TEL.res.sub;
  ligne("notif", "bell", "Notifications", perm === "denied" ? "bad" : !pp ? "warn" : sub ? "ok" : "warn",
    perm === "denied" ? "Refusées" : !pp ? (ios && !appliInstallee() ? "Possibles après l'installation" : "Impossibles avec ce navigateur") : sub ? "Activées" : sub === undefined ? "Vérification…" : "Pas activées",
    perm === "denied" ? (ios ? "Réglages › Notifications › PhysiquePro › Autoriser." : "Touche le cadenas à côté de l'adresse › Autorisations › Notifications.") : pp && sub === null ? "<a href=\"#/admin/profil\">Profil › Notifications</a> › « Activer »." : "");
  const cx = navigator.connection || {}, eff = cx.effectiveType;
  ligne("net", "wifi", "Connexion Internet", !enLigne() ? "bad" : eff && /2g/.test(eff) ? "bad" : eff === "3g" ? "warn" : "ok", !enLigne() ? "Aucune" : eff ? eff.toUpperCase().replace("SLOW-", "très lente ") + (cx.saveData ? " · économie de données" : "") : "Oui", !enLigne() ? "Active le Wi-Fi ou les données mobiles." : eff && /2g|3g/.test(eff) ? "Réseau lent : envoie de préférence en Wi-Fi. Les photos sont allégées avant l'envoi." : "");
  let ls = true; try { localStorage.setItem("pp_t", "1"); localStorage.removeItem("pp_t"); } catch (_) { ls = false; }
  ligne("ls", "key", "Mémoire du site", ls ? "ok" : "bad", ls ? "Autorisée" : "Bloquée", ls ? "" : "Désactive la navigation privée : sinon, tu es déconnecté et tes réponses ne sont pas gardées.");
  const st = TEL.res.stock;
  ligne("stock", "folder", "Espace libre", st == null ? "ok" : st < 200e6 ? "warn" : "ok", st == null ? "Vérification…" : tailleTxt(st), st != null && st < 200e6 ? "Ton téléphone est presque plein : libère de la place (photos, vidéos) pour pouvoir envoyer tes travaux." : "");
  const ec = TEL.res.ecart;
  ligne("heure", "clock", "Date et heure", ec == null ? "ok" : Math.abs(ec) > 300e3 ? "warn" : "ok", ec == null ? "Vérification…" : Math.abs(ec) > 300e3 ? "Décalées de " + Math.round(Math.abs(ec) / 60e3) + " min" : "Justes", ec != null && Math.abs(ec) > 300e3 ? "Règle la date et l'heure en automatique dans les réglages du téléphone : sinon les dates limites peuvent mal s'afficher." : "");
  ligne("ecran", "expand", "Écran", "ok", window.innerWidth + " × " + window.innerHeight + (window.innerWidth > window.innerHeight ? " (paysage)" : " (portrait)"), "");
  return L;
}
async function verifsAsync(){
  if (TEL.enCours) return; TEL.enCours = true;
  try { TEL.res.sub = typeof abonnementPush === "function" ? (await abonnementPush()) || null : null; } catch (_) { TEL.res.sub = null; }
  try { if (navigator.storage && navigator.storage.estimate) { const e = await navigator.storage.estimate(); TEL.res.stock = e.quota != null ? Math.max(0, e.quota - (e.usage || 0)) : null; } } catch (_) {}
  try { const t0 = Date.now(), r = await fetch("manifest.json?t=" + t0, { method: "HEAD", cache: "no-store" }), dh = r.headers.get("date"); if (dh) TEL.res.ecart = Date.now() - (Date.parse(dh) + (Date.now() - t0) / 2); } catch (_) {}
  TEL.enCours = false; TEL.fait = true; if (route().v === "telephone") render();
}
VUES_PRO.telephone = function(){
  if (!TEL.fait) setTimeout(verifsAsync, 0);
  const L = lignesTelephone(), nb = L.filter(x => x.etat !== "ok").length, rouge = L.some(x => x.etat === "bad");
  return `<div class="page"><div class="homehead"><h1>${icon("phone")} Mon téléphone est-il prêt ?</h1></div>
    <section class="tel-bilan ${rouge ? "bad" : nb ? "warn" : "ok"}">${icon(rouge || nb ? "alerte" : "check")}<b>${rouge ? "À corriger avant de travailler" : nb ? nb + " point" + (nb > 1 ? "s" : "") + " à améliorer" : "Tout est prêt !"}</b></section>
    <section class="card telverifs">${L.map(x => `<div class="tvl ${x.etat}"><span class="tvp" aria-hidden="true"></span>${icon(x.ic)}<div><b>${esc(x.t)}</b><span>${esc(x.txt)}</span>${x.faire ? `<small>${x.faire}</small>` : ""}</div></div>`).join("")}</section>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-act="telcopier">${icon("copy")} Copier le résumé pour mon professeur</button><button class="btn ghost" data-act="telrefaire">Refaire le test</button>${S.prof ? "" : `<button class="btn ghost" data-act="visite">Revoir la visite guidée</button>`}</div>
    ${pageFoot()}</div>`;
};
ACTIONS_PLUS.telrefaire = (a, e) => { e.preventDefault(); TEL.res = {}; TEL.fait = false; render(); };
ACTIONS_PLUS.telcopier = async (a, e) => {
  e.preventDefault();
  const txt = "PhysiquePro · test du téléphone de " + S.nom + " (" + new Date().toLocaleString("fr-FR") + ")\n" + lignesTelephone().map(x => (x.etat === "ok" ? "✓ " : x.etat === "warn" ? "! " : "✗ ") + x.t + " : " + x.txt).join("\n") + "\n" + navigator.userAgent;
  try { await navigator.clipboard.writeText(txt); toast("Résumé copié : colle-le dans un message à ton professeur"); } catch (_) { S.modal = { kind: "confirm", titre: "Résumé du test", texte: txt, ok: "Fermer", action: "rien" }; render(); }
};
ACTIONS_PLUS.installguide = (a, e) => { e.preventDefault(); S.modal = { kind: "installtel" }; render(); };

/* ---------------------------------------------------------------- B14. Agrandir une image au doigt */
const ZM = { s: 1, x: 0, y: 0, pts: new Map(), d0: 0, s0: 1, p0: null, tap: 0 };
function ouvrirZoom(src, alt){
  fermerZoom();
  const o = document.createElement("div"); o.id = "ppZoom"; o.setAttribute("role", "dialog"); o.setAttribute("aria-label", "Image agrandie");
  o.innerHTML = `<img src="${esc(src)}" alt="${esc(alt || "")}" draggable="false"><button class="ib zx" aria-label="Fermer">${icon("x")}</button><span class="zaide">Écarte deux doigts pour zoomer · touche deux fois pour agrandir</span>`;
  document.body.appendChild(o); document.body.classList.add("zoomouvert");
  Object.assign(ZM, { s: 1, x: 0, y: 0, pts: new Map() });
  const img = o.querySelector("img"), maj = () => { img.style.transform = `translate(${ZM.x}px,${ZM.y}px) scale(${ZM.s})`; };
  o.querySelector(".zx").onclick = fermerZoom;
  o.addEventListener("pointerdown", e => { if (e.target.closest(".zx")) return; o.setPointerCapture(e.pointerId); ZM.pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ZM.pts.size === 2) { const [a, b] = [...ZM.pts.values()]; ZM.d0 = Math.hypot(a.x - b.x, a.y - b.y); ZM.s0 = ZM.s; } else { ZM.p0 = { x: e.clientX - ZM.x, y: e.clientY - ZM.y }; }
    const t = Date.now(); if (ZM.pts.size === 1 && t - ZM.tap < 300) { ZM.s = ZM.s > 1 ? 1 : 2.5; if (ZM.s === 1) { ZM.x = 0; ZM.y = 0; } maj(); ZM.tap = 0; } else ZM.tap = t; });
  o.addEventListener("pointermove", e => { if (!ZM.pts.has(e.pointerId)) return; ZM.pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ZM.pts.size === 2) { const [a, b] = [...ZM.pts.values()]; ZM.s = Math.max(1, Math.min(6, ZM.s0 * Math.hypot(a.x - b.x, a.y - b.y) / (ZM.d0 || 1))); }
    else if (ZM.s > 1 && ZM.p0) { ZM.x = e.clientX - ZM.p0.x; ZM.y = e.clientY - ZM.p0.y; }
    maj(); });
  const fin = e => { ZM.pts.delete(e.pointerId); if (ZM.pts.size === 1) { const [a] = [...ZM.pts.values()]; ZM.p0 = { x: a.x - ZM.x, y: a.y - ZM.y }; } if (ZM.s <= 1.02) { ZM.s = 1; ZM.x = 0; ZM.y = 0; maj(); } };
  o.addEventListener("pointerup", fin); o.addEventListener("pointercancel", fin);
  o.addEventListener("wheel", e => { e.preventDefault(); ZM.s = Math.max(1, Math.min(6, ZM.s * (e.deltaY < 0 ? 1.15 : 1 / 1.15))); if (ZM.s === 1) { ZM.x = 0; ZM.y = 0; } maj(); }, { passive: false });
  o.querySelector(".zx").focus();
}
function fermerZoom(){ document.getElementById("ppZoom")?.remove(); document.body.classList.remove("zoomouvert"); }
document.addEventListener("click", e => {
  const img = e.target.closest && e.target.closest(".richtext img, img.qpic, img.cpphoto, .annbody img, .dvbody img");
  if (!img || img.closest("a") || img.closest("#ppZoom") || img.dataset.eco) return;
  e.preventDefault(); ouvrirZoom(img.currentSrc || img.src, img.alt);
}, true);
document.addEventListener("keydown", e => { if (e.key === "Escape" && document.getElementById("ppZoom")) fermerZoom(); });
/* image jointe à un devoir ou une annonce : sur téléphone, elle s'ouvre directement en grand (au lieu d'un nouvel onglet) */
document.addEventListener("click", async e => {
  const a = e.target.closest && e.target.closest('[data-act="openfile"]');
  if (!a || !surTelephone() || !/\.(png|jpe?g|gif|webp)$/i.test(a.dataset.path || "")) return;
  e.preventDefault(); e.stopPropagation();
  const { data, error } = await sb.storage.from(a.dataset.bucket || "documents").createSignedUrl(a.dataset.path, 3600);
  if (error || !data) { toast("Fichier introuvable ou accès refusé."); return; }
  ouvrirZoom(data.signedUrl, (a.dataset.path.split("/").pop() || "").replace(/^\d+-/, ""));
}, true);

/* ---------------------------------------------------------------- B15. Tirer vers le bas pour actualiser (application installée) */
const PTR = { y0: null, dy: 0, on: false };
document.addEventListener("touchstart", e => {
  if (!appliInstallee() || !S.user || S.modal || PTR.on || window.scrollY > 0 || e.touches.length !== 1) { PTR.y0 = null; return; }
  if (e.target.closest("textarea, input, select, [contenteditable], .drawer, #ppZoom, #labPanel, #sidePanel, #ppSimu, .modal, #ppVisite")) { PTR.y0 = null; return; }
  PTR.y0 = e.touches[0].clientY; PTR.dy = 0;
}, { passive: true });
document.addEventListener("touchmove", e => {
  if (PTR.y0 == null) return;
  PTR.dy = e.touches[0].clientY - PTR.y0; if (window.scrollY > 0 || PTR.dy < 0) { PTR.dy = 0; return; }
  let o = document.getElementById("ppTirer"); if (!o) { o = document.createElement("div"); o.id = "ppTirer"; o.innerHTML = `${icon("restore")}<span></span>`; document.body.appendChild(o); }
  const p = Math.min(1, PTR.dy / 90); o.style.transform = `translateX(-50%) translateY(${Math.min(90, PTR.dy * .6)}px) rotate(${p * 270}deg)`; o.style.opacity = p;
  o.querySelector("span").textContent = p >= 1 ? "Lâche pour actualiser" : "Tire pour actualiser"; o.classList.toggle("pret", p >= 1);
}, { passive: true });
document.addEventListener("touchend", async () => {
  if (PTR.y0 == null) return; const ok = PTR.dy >= 90; PTR.y0 = null; PTR.dy = 0;
  const o = document.getElementById("ppTirer"); if (!ok) { o?.remove(); return; }
  if (!enLigne()) { o?.remove(); toast("Pas de connexion : impossible d'actualiser pour l'instant."); return; }
  PTR.on = true; if (o) { o.classList.add("tourne"); o.style.transform = "translateX(-50%) translateY(54px)"; o.querySelector("span").textContent = "Actualisation…"; }
  try { await rafraichir(); S.cp = {}; S.comsDv = {}; await render(); vibrer(15); toast("Page à jour ✓"); } catch (_) { toast("Actualisation impossible : vérifie ta connexion."); }
  PTR.on = false; document.getElementById("ppTirer")?.remove();
});

/* ---------------------------------------------------------------- B16. « Ajouter à mon agenda » et D26. WhatsApp */
const lienDe = (o, k) => urlSite() + "index.html#/" + (k === "quiz" ? "quiz/" : "devoir/") + o.id;
function actionsTelDevoir(o, k){
  if (S.prof || !S.user || !o) return "";
  const c = cls(o.classe_id), lim = o.date_limite ? D(o.date_limite) : null;
  const msg = `${k === "quiz" ? "Questionnaire" : "Devoir"} de ${c ? c.nom : "physique"} : « ${o.titre} »${lim ? ", à rendre le " + lim.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) + " à " + fmtT(lim) : ""}.\nIl est sur PhysiquePro (connecte-toi avec ton compte du lycée) :\n${lienDe(o, k)}`;
  return `<section class="teloutils">${lim ? `<button class="btn ghost" data-act="agendatel" data-k="${k}" data-id="${o.id}">${icon("cal")} Ajouter à mon agenda</button>` : ""}
    <a class="btn ghost wa" href="https://wa.me/?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener"><img src="logo-whatsapp.png" alt="" width="20" height="20"> Prévenir un camarade</a></section>`;
}
const icsTxt = s => String(s || "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");
const icsDate = d => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
function fichierIcs(o, k){
  const c = cls(o.classe_id), fin = D(o.date_limite), deb = new Date(+fin - 30 * 60e3), url = lienDe(o, k);
  const L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//PhysiquePro//FR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "BEGIN:VEVENT",
    "UID:pp-" + k + "-" + o.id + "@physiquepro", "DTSTAMP:" + icsDate(new Date()), "DTSTART:" + icsDate(deb), "DTEND:" + icsDate(fin),
    "SUMMARY:" + icsTxt("À rendre : " + o.titre), "DESCRIPTION:" + icsTxt((c ? c.nom + " · " : "") + "PhysiquePro : " + url), "URL:" + url,
    "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", "DESCRIPTION:" + icsTxt("Demain : " + o.titre), "END:VALARM",
    "BEGIN:VALARM", "TRIGGER:-PT2H", "ACTION:DISPLAY", "DESCRIPTION:" + icsTxt("Dans 2 heures : " + o.titre), "END:VALARM",
    "END:VEVENT", "END:VCALENDAR"];
  return L.join("\r\n") + "\r\n";
}
ACTIONS_PLUS.agendatel = async (a, e) => {
  e.preventDefault();
  const k = a.dataset.k, o = (k === "quiz" ? S.quiz : S.devoirs).find(x => String(x.id) === a.dataset.id); if (!o || !o.date_limite) return;
  const fin = D(o.date_limite), deb = new Date(+fin - 30 * 60e3);
  if (estAndroid()) {
    const u = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent("À rendre : " + o.titre) + "&dates=" + icsDate(deb) + "/" + icsDate(fin) + "&details=" + encodeURIComponent("PhysiquePro : " + lienDe(o, k));
    window.open(u, "_blank", "noopener"); return;
  }
  const nom = safeName(o.titre).slice(0, 40) + ".ics", blob = new Blob([fichierIcs(o, k)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob), l = document.createElement("a"); l.href = url; l.download = nom; document.body.appendChild(l); l.click(); l.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60e3);
  toast(estIPhone() ? "Touche « Ajouter à Calendrier » puis « Ajouter tout »" : "Ouvre le fichier pour l'ajouter à ton agenda (rappel la veille et 2 h avant)");
};

/* ================================================================ C. confort de travail */
/* ---------------------------------------------------------------- C17. Questionnaire « une question par écran » + C18. mode concentration */
const POSQ = id => Number(lireLS(cleTel("qp" + id)) || 0);
const qRepondue = el => !![...el.querySelectorAll("input")].some(i => (i.type === "radio" || i.type === "checkbox") ? i.checked : i.value.trim() !== "");
function unParEcran(){
  const r = route(), html = document.documentElement;
  const sortir = () => { html.classList.remove("concentre"); document.getElementById("ppConc")?.remove(); };
  if (S.prof || r.v !== "quiz") return sortir();
  const q = S.quiz.find(x => String(x.id) === r.a), sec = document.querySelector("main.content .page > section.card");
  if (!q || !sec) return sortir();
  sec.querySelectorAll(".qnavtop, .qnavbas").forEach(x => x.remove());
  const qs = [...sec.querySelectorAll(":scope > .q")], N = qs.length - 1;
  const enCours = !S.quizRes[q.id] && !sec.querySelector(".q input:disabled") && N >= 1 && !!sec.querySelector('[data-act="valider"]');
  if (!enCours || !petitEcran()) { sec.classList.remove("uneq"); qs.forEach(x => x.hidden = false); return sortir(); }
  /* C18 : plein écran pour l'exercice, avec un bouton pour sortir */
  if (S.concSortie !== String(q.id)) {
    html.classList.add("concentre");
    if (!document.getElementById("ppConc")) { const b = document.createElement("button"); b.id = "ppConc"; b.className = "btn ghost sm"; b.innerHTML = icon("x") + " Quitter le plein écran"; b.onclick = () => { S.concSortie = String(q.id); unParEcran(); }; document.body.appendChild(b); }
  } else sortir();
  if (S.toutesQ === String(q.id) || N < 2) { sec.classList.remove("uneq"); qs.forEach(x => x.hidden = false); return; }
  const pos = Math.min(N - 1, Math.max(0, POSQ(q.id)));
  sec.classList.add("uneq");
  qs.forEach((el, i) => { el.hidden = i < N ? i !== pos : pos !== N - 1; });
  const haut = document.createElement("div"); haut.className = "qnavtop";
  haut.innerHTML = `<div class="qprogtxt"><b>Question ${pos + 1} sur ${N}</b>${html.classList.contains("concentre") ? "" : `<button class="linkbtn" data-qnav="conc">${icon("full")} Plein écran</button>`}</div>
    <div class="qprog"><i style="width:${Math.round((pos + 1) / N * 100)}%"></i></div>
    <div class="qpuces" role="group" aria-label="Aller à une question">${qs.slice(0, N).map((el, i) => `<button class="qpuce${i === pos ? " ici" : ""}${qRepondue(el) ? " fait" : ""}" data-qnav="=${i}" aria-label="Question ${i + 1}${qRepondue(el) ? " (répondue)" : ""}">${i + 1}</button>`).join("")}</div>`;
  sec.insertBefore(haut, sec.firstChild);
  const bas = document.createElement("div"); bas.className = "qnavbas";
  bas.innerHTML = `<div class="qboutons"><button class="btn ghost" data-qnav="-1" ${pos === 0 ? "disabled" : ""}>‹ Précédente</button>${pos < N - 1 ? `<button class="btn" data-qnav="1">Suivante ›</button>` : ""}</div>
    <button class="linkbtn" data-qnav="tout">Voir toutes les questions</button>`;
  /* 5e évaluation : à la dernière question, le gros bouton « Envoyer » vient juste sous la question, « Précédente » passe dessous */
  sec.classList.toggle("qdernier", pos === N - 1);
  (pos === N - 1 ? qs[N] : qs[pos]).after(bas);
}
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest("[data-qnav]"); if (!b) return; e.preventDefault();
  const r = route(), id = r.a, v = b.dataset.qnav, N = document.querySelectorAll("main.content .page > section.card > .q").length - 1;
  if (v === "tout") { S.toutesQ = id; unParEcran(); return; }
  if (v === "conc") { S.concSortie = null; unParEcran(); return; }
  const p = v[0] === "=" ? Number(v.slice(1)) : POSQ(id) + Number(v);
  ecrireLS(cleTel("qp" + id), Math.max(0, Math.min(N - 1, p))); unParEcran(); vibrer(8);
  document.querySelector("main.content .page > section.card")?.scrollIntoView({ block: "start" }); window.scrollBy(0, -8);
});
document.addEventListener("change", e => { if (e.target.closest && e.target.closest("section.uneq")) setTimeout(majPuces, 0); });
document.addEventListener("input", e => { if (e.target.closest && e.target.closest("section.uneq")) setTimeout(majPuces, 0); });
function majPuces(){ const sec = document.querySelector("section.uneq"); if (!sec) return; const qs = [...sec.querySelectorAll(":scope > .q")]; sec.querySelectorAll(".qpuce").forEach((p, i) => p.classList.toggle("fait", !!qs[i] && qRepondue(qs[i]))); }
/* « Envoyer » avec des questions sans réponse : on montre la première */
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest('[data-act="valider"]'), sec = document.querySelector("section.uneq"); if (!b || !sec) return;
  const qs = [...sec.querySelectorAll(":scope > .q")].slice(0, -1), i = qs.findIndex(x => !qRepondue(x));
  if (i >= 0) setTimeout(() => { ecrireLS(cleTel("qp" + route().a), i); unParEcran(); }, 0);
}, true);
window.addEventListener("hashchange", () => { S.toutesQ = null; S.concSortie = null; });

/* ---------------------------------------------------------------- C19. Pastille sur l'icône de l'application */
let _pastilleT = null;
function majPastille(){
  clearTimeout(_pastilleT);
  _pastilleT = setTimeout(() => { if (S.prof || !S.user || !("setAppBadge" in navigator)) return; const n = travauxAFaire().length;
    try { (n ? navigator.setAppBadge(n) : navigator.clearAppBadge()).catch(() => {}); } catch (_) {} }, 800);
}

/* ---------------------------------------------------------------- C20. Cases à cocher dans les consignes */
function casesConsigne(){
  const r = route(); if (S.prof || r.v !== "devoir") return;
  const z = document.querySelector(".dvbody .richtext"); if (!z) return;
  const k = cleTel("e" + r.a), faites = new Set(lireLS(k) || []); let n = 0;
  z.querySelectorAll("ul, ol").forEach(l => {
    const lis = [...l.children].filter(x => x.tagName === "LI"); if (lis.length < 2) return;
    l.classList.add("etapes");
    lis.forEach(li => { const i = n++; if (li.querySelector(":scope > .etapecase")) return;
      const c = document.createElement("input"); c.type = "checkbox"; c.className = "etapecase"; c.dataset.etape = i; c.setAttribute("aria-label", "Étape faite"); c.checked = faites.has(i);
      li.classList.toggle("faite", c.checked); li.prepend(c); });
  });
}
document.addEventListener("change", e => {
  const c = e.target; if (!c.classList || !c.classList.contains("etapecase")) return;
  const k = cleTel("e" + route().a), s = new Set(lireLS(k) || []), i = Number(c.dataset.etape);
  c.checked ? s.add(i) : s.delete(i); ecrireLS(k, [...s]); c.closest("li").classList.toggle("faite", c.checked); vibrer(10);
});

/* ---------------------------------------------------------------- C21. Poser une question avec une photo (commentaire privé, étape 39) */
function boutonPhotoCP(did, email){
  return `<label class="ib cpphotobtn" title="Joindre une photo">${icon("camera")}<span class="pp-sr">Joindre une photo</span><input type="file" accept="image/*" data-cpphoto="1" data-d="${did}" data-e="${esc(email)}" hidden></label>`;
}
const photoCP = p => p && p.chemin ? `<img class="cpphoto" data-rpath="${esc(p.chemin)}" alt="Photo jointe" loading="lazy">` : "";
async function signerPhotosCP(){
  const imgs = [...document.querySelectorAll("img.cpphoto[data-rpath]:not([src])")]; if (!imgs.length) return;
  S.urlsR = S.urlsR || {};
  const manque = [...new Set(imgs.map(i => i.dataset.rpath))].filter(p => !S.urlsR[p]);
  if (manque.length) { try { const { data } = await sb.storage.from("rendus").createSignedUrls(manque, 3600); (data || []).forEach(x => { if (x.signedUrl) S.urlsR[x.path] = x.signedUrl; }); } catch (_) {} }
  imgs.forEach(i => { const u = S.urlsR[i.dataset.rpath]; if (u && i.isConnected) i.src = u; else if (!u) i.replaceWith(Object.assign(document.createElement("small"), { className: "muted", textContent: "Photo indisponible" })); });
}
document.addEventListener("change", async e => {
  const inp = e.target; if (!inp.dataset || !inp.dataset.cpphoto) return;
  const f0 = inp.files && inp.files[0]; inp.value = ""; if (!f0) return;
  if (!enLigne()) { toast("Pas de connexion : réessaie quand le réseau revient."); return; }
  const did = Number(inp.dataset.d), email = inp.dataset.e, d = S.devoirs.find(x => x.id === did);
  const uid = S.prof ? Object.keys(S.profils || {}).find(id => S.profils[id] === email) : S.user.id;
  if (!uid) { toast("Cet élève ne s'est encore jamais connecté : la photo ne peut pas lui être envoyée."); return; }
  if (!S.prof && d && !depotOuvert(d)) { toast("La date limite est passée : écris ta question sans photo."); return; }
  const f = await alleger(f0), chemin = did + "/" + uid + "/question-" + Date.now() + "-" + safeName(f.name);
  progressionEnvoi(1, 1, .3, f.name);
  const up = await envoiAvecEssais(() => sb.storage.from("rendus").upload(chemin, f), n => progressionEnvoi(1, 1, .3, f.name, n));
  if (up.error) { progressionEnvoi(); toast("Photo non envoyée : " + (estErreurReseau(up.error) ? "le réseau a coupé." : up.error.message)); return; }
  const t = ((document.getElementById("cpIn") || {}).value || "").trim() || "📷 Photo";
  const { error } = await sb.from("commentaires_prives").insert({ devoir_id: did, eleve_email: email, auteur_nom: S.nom, texte: t, photo: { chemin, nom: f.name, taille: f.size } });
  progressionEnvoi();
  if (error) { await sb.storage.from("rendus").remove([chemin]); toast("Photo non envoyée : " + error.message); return; }
  const i = document.getElementById("cpIn"); if (i) i.value = "";
  await chargerCP(did, email, true); render(); toast("Photo envoyée ✓");
});

/* ---------------------------------------------------------------- C22. Reprendre là où on s'était arrêté */
const LEC = { cle: null, pret: false, t: null };
function memoLecture(){
  const r = route(); if (!LEC.pret || !S.user || !["devoir", "quiz"].includes(r.v)) return;
  clearTimeout(LEC.t); LEC.t = setTimeout(() => { const m = lireLS(cleTel("lecture")) || {}; m[location.hash] = Math.round(window.scrollY); const cles = Object.keys(m); if (cles.length > 40) delete m[cles[0]]; ecrireLS(cleTel("lecture"), m); }, 400);
}
window.addEventListener("scroll", memoLecture, { passive: true });
window.addEventListener("hashchange", () => { LEC.pret = false; });
function repriseLecture(){
  const r = route();
  if (LEC.cle === location.hash && LEC.pret) return;
  if (LEC.cle === location.hash && !LEC.pret && LEC.attente) return;
  LEC.cle = location.hash; LEC.pret = false;
  const y = (lireLS(cleTel("lecture")) || {})[location.hash];
  if (!["devoir", "quiz"].includes(r.v) || !(y > 400) || document.querySelector("section.uneq")) { LEC.pret = true; return; }
  LEC.attente = true;
  setTimeout(() => { LEC.attente = false; if (location.hash === LEC.cle && document.documentElement.scrollHeight > y + 300) { window.scrollTo(0, y); toast("Repris là où tu t'étais arrêté"); } LEC.pret = true; }, 200);
}

/* ---------------------------------------------------------------- C23. Simulations en plein écran (téléphone) + D27. capture jointe au devoir */
const _ouvrirSimuTel = ouvrirSimu;
ouvrirSimu = function(t, url){ if (window.innerWidth <= 760) return ouvrirSimuTel(t, url); return _ouvrirSimuTel.apply(this, arguments); };
function ouvrirSimuTel(t, url){
  document.getElementById("ppSimu")?.remove();
  const local = !/^https?:/i.test(url) || new URL(url, location.href).origin === location.origin;
  const o = document.createElement("div"); o.id = "ppSimu"; o.setAttribute("role", "dialog"); o.setAttribute("aria-label", t);
  o.innerHTML = `<header><b>${esc(t)}</b>
      <button class="ib" data-simtel="plein" aria-label="Plein écran" title="Plein écran">${icon("full")}</button>
      ${S.user && !S.prof ? `<button class="ib" data-simtel="joindre" aria-label="Joindre une image à mon devoir" title="Joindre à mon devoir">${icon("photo")}</button>` : ""}
      <a class="ib" href="${esc(url)}" target="_blank" rel="noopener" aria-label="Ouvrir dans un nouvel onglet" title="Nouvel onglet">${icon("ext")}</a>
      <button class="ib" data-simtel="fermer" aria-label="Fermer">${icon("x")}</button></header>
    <div class="simtelrot">${icon("restore")} Tourne ton téléphone pour voir en grand <button class="linkbtn" data-simtel="okrot">OK</button></div>
    <iframe src="${esc(url)}" title="${esc(t)}" allow="fullscreen; accelerometer; gyroscope" ${local ? "" : 'referrerpolicy="strict-origin-when-cross-origin"'}></iframe>`;
  document.body.appendChild(o); document.body.classList.add("simtelouvert");
  o.dataset.local = local ? "1" : "";
  o.addEventListener("click", async e => {
    const b = e.target.closest("[data-simtel]"); if (!b) return; const a = b.dataset.simtel;
    if (a === "fermer") fermerSimuTel();
    else if (a === "okrot") o.classList.add("rotvu");
    else if (a === "plein") pleinEcran(o);
    else if (a === "joindre") { const f = local ? await captureCanvas(o.querySelector("iframe").contentDocument, t) : null; fermerSimuTel(); demanderJoindre(f, t); }
  });
}
function fermerSimuTel(){ if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); document.getElementById("ppSimu")?.remove(); document.body.classList.remove("simtelouvert"); }
async function pleinEcran(el){
  try {
    if (document.fullscreenElement) { await document.exitFullscreen(); return; }
    if (el.requestFullscreen) { await el.requestFullscreen({ navigationUI: "hide" }); try { await screen.orientation.lock("landscape"); } catch (_) {} return; }
    if (el.webkitRequestFullscreen) { el.webkitRequestFullscreen(); return; }
  } catch (_) {}
  toast(estIPhone() ? "Sur iPhone : tourne le téléphone, la simulation remplit déjà l'écran." : "Plein écran impossible ici : tourne le téléphone.");
}
/* image de la simulation : on assemble ses dessins (canvas), sinon l'élève choisit une capture d'écran */
async function captureCanvas(doc, titre){
  try {
    const cs = [...(doc || document).querySelectorAll("canvas")].filter(c => c.width > 40 && c.height > 40); if (!cs.length) return null;
    const W = Math.max(...cs.map(c => c.width)), H = cs.reduce((a, c) => a + c.height, 0) + 10 * (cs.length - 1);
    const out = document.createElement("canvas"); out.width = W; out.height = H; const g = out.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, W, H);
    let y = 0; for (const c of cs) { g.drawImage(c, 0, y); y += c.height + 10; }
    const blob = await new Promise(ok => out.toBlob(ok, "image/png"));
    return blob ? new File([blob], "simulation-" + safeName(titre || "image").slice(0, 40) + ".png", { type: "image/png" }) : null;
  } catch (_) { return null; }
}
const JT = { files: [], lien: "", titre: "" };
function demanderJoindre(f, titre){ JT.files = f ? [f] : []; JT.lien = ""; JT.titre = titre || ""; S.modal = { kind: "joindretel" }; render(); }
function listeDevoirsOuverts(){ return travauxAFaire().filter(x => x.k === "devoir" && x.o.type !== "question").map(x => x.o); }
VUES_MODAL.joindretel = () => {
  const L = listeDevoirsOuverts(), apercu = JT.files.length ? `<div class="att rcards mini jt">${JT.files.map(f => carteEdit({ label: f.name, pending: f }, "", -1, " · " + tailleTxt(f.size))).join("")}</div>` : "";
  const choix = !JT.files.length && !JT.lien ? `<p style="margin:0">Fais une <b>capture d'écran</b> de la simulation (${estIPhone() ? "bouton latéral + volume haut" : "marche/arrêt + volume bas"}), puis choisis-la :</p>
      <label class="btn tonal">${icon("photo")} Choisir ma capture d'écran<input type="file" accept="image/*" data-jtfile="1" hidden></label>` : "";
  return { foot: false, body: `<h2>${icon("photo")} Joindre à mon devoir</h2>${apercu}${choix}
    ${(JT.files.length || JT.lien) ? (L.length ? `<p class="muted" style="margin:0">Choisis le devoir :</p><div class="jtliste">${L.map(d => `<button class="btn ghost" data-act="joindrevers" data-id="${d.id}"><b>${esc(d.titre)}</b><small>${esc((cls(d.classe_id) || {}).nom || "")}${d.date_limite ? " · " + esc(urgenceDe(D(d.date_limite)).txt) : ""}</small></button>`).join("")}</div>`
      : `<p class="notice" style="margin:0">Tu n'as aucun devoir à rendre en ce moment.</p>${JT.files.length ? `<button class="btn ghost" data-act="jtgarder">${icon("install")} Enregistrer l'image sur le téléphone</button>` : ""}`) : ""}
    <div style="display:flex;justify-content:flex-end"><button class="btn ghost" data-act="mclose">Annuler</button></div>` };
};
document.addEventListener("change", e => { const i = e.target; if (!i.dataset || !i.dataset.jtfile) return; const f = i.files && i.files[0]; i.value = ""; if (f) { JT.files = [f]; render(); } });
ACTIONS_PLUS.joindrevers = async a => {
  const d = S.devoirs.find(x => String(x.id) === a.dataset.id); if (!d) return;
  const k = cleTel("d" + d.id), b = (await idbGet(k)) || { files: [], reponse: "", lien: "" };
  b.files = [...(b.files || []), ...JT.files]; if (JT.lien && !b.lien) b.lien = JT.lien; b.le = Date.now();
  await idbSet(k, b); JT.files = []; JT.lien = ""; S.modal = null;
  if (typeof fermerLab === "function") fermerLab(); fermerSimuTel(); if (PART.data) { await idbDel("partage"); PART.data = null; }
  go("/devoir/" + d.id); setTimeout(() => toast("Ajouté à ton travail : vérifie, puis touche « Rendre »"), 900);
};
ACTIONS_PLUS.jtgarder = () => { const f = JT.files[0]; if (!f) return; const u = URL.createObjectURL(f), l = document.createElement("a"); l.href = u; l.download = f.name; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 60e3); };
/* labo animé (canvas dans la page) : boutons « Plein écran » et « Joindre à mon devoir » */
const _ouvrirLabTel = ouvrirLab;
ouvrirLab = function(id){
  const r = _ouvrirLabTel.apply(this, arguments), p = document.getElementById("labPanel"), h = p && p.querySelector("header");
  if (h && !h.querySelector("[data-labtel]")) {
    const fer = h.querySelector('[data-act="labfermer"]');
    const plus = document.createElement("span"); plus.className = "labtel";
    plus.innerHTML = `<button class="ib" data-labtel="plein" aria-label="Plein écran" title="Plein écran">${icon("full")}</button>${S.user && !S.prof ? `<button class="ib" data-labtel="joindre" aria-label="Joindre une image à mon devoir" title="Joindre à mon devoir">${icon("photo")}</button>` : ""}`;
    h.insertBefore(plus, fer);
    plus.addEventListener("click", async e => { const b = e.target.closest("[data-labtel]"); if (!b) return; e.stopPropagation();
      if (b.dataset.labtel === "plein") pleinEcran(p.querySelector(".labboite"));
      else { const t = (h.querySelector("b") || {}).textContent || "labo"; const f = await captureCanvas(p.querySelector(".labcorps"), t); fermerLab(); demanderJoindre(f, t); } });
  }
  return r;
};

/* ================================================================ D. hors connexion, données, partage */
/* ---------------------------------------------------------------- D24. Lecture sans réseau : dernière version gardée sur le téléphone */
let _snapT = null;
function sauverInstantane(){
  clearTimeout(_snapT);
  _snapT = setTimeout(() => { if (!S.user || !S.profil || S.horsLigne) return;
    const cache = {}; Object.keys(S.cache || {}).forEach(id => { const c = S.cache[id]; if (c) cache[id] = { themes: c.themes, supports: c.supports, eleves: c.eleves, annonces: c.annonces, coms: c.coms }; });
    idbSet("snap_" + S.user.id, { profil: S.profil, nom: S.nom, classes: S.classes, devoirs: S.devoirs, rendus: S.rendus, corrections: S.corrections, quiz: S.quiz, resultats: S.resultats, copies: S.copies || [], R: reglagesData(), cache, le: Date.now() }); }, 1500);
}
const _chargerToutTel = chargerTout;
chargerTout = async function(){ const r = await _chargerToutTel.apply(this, arguments); S.horsLigne = false; sauverInstantane(); return r; };
const _chargerClasseTel = chargerClasse;
chargerClasse = async function(id, force){
  try { const r = await _chargerClasseTel.apply(this, arguments); if (!S.horsLigne) sauverInstantane(); return r; }
  catch (e) { if (S.horsLigne || estErreurReseau(e) || !enLigne()) { const sn = await idbGet("snap_" + (S.user && S.user.id)); if (sn && sn.cache && sn.cache[id]) return S.cache[id] = sn.cache[id]; } throw e; }
};
/* appelée au démarrage quand Internet manque : affiche la dernière version gardée */
async function demarrerHorsLigne(session){
  const sn = await idbGet("snap_" + session.user.id);
  if (!sn) { app.innerHTML = `<div class="loading"><div class="notice" style="display:grid;gap:10px;justify-items:center">${icon("wifi")}<b>Pas de connexion Internet</b><span>Active le Wi-Fi ou les données mobiles, puis touche « Réessayer ».</span><button class="btn" onclick="location.reload()">Réessayer</button></div></div>`; return true; }
  S.user = session.user; S.profil = sn.profil; S.prof = sn.profil.role === "prof"; S.nom = sn.nom;
  [S.classes, S.devoirs, S.rendus, S.corrections, S.quiz, S.resultats] = [sn.classes, sn.devoirs, sn.rendus, sn.corrections, sn.quiz, sn.resultats];
  S.copies = sn.copies || []; S.cache = sn.cache || {}; appliquerReglages(sn.R); S.horsLigne = sn.le;
  if (S.prof) { S.nbEleves = {}; S.profils = {}; }
  render(); return true;
}
function bandeauHorsLigne(){
  let b = document.getElementById("ppHorsLigne");
  const off = !enLigne() || S.horsLigne;
  if (!off) { b?.remove(); return; }
  if (!b) { b = document.createElement("div"); b.id = "ppHorsLigne"; b.setAttribute("role", "status"); document.body.appendChild(b); }
  b.innerHTML = enLigne() && S.horsLigne ? `${icon("wifi")}<span>La connexion est revenue.</span><button class="btn sm" onclick="location.reload()">Actualiser</button>`
    : `${icon("wifi")}<span><b>Hors connexion</b> · ${S.horsLigne ? "version du " + fmtShort(new Date(S.horsLigne)) + " à " + fmtT(new Date(S.horsLigne)) : "tu peux lire, mais pas envoyer"}. Tes réponses sont gardées.</span>`;
}
window.addEventListener("online", bandeauHorsLigne); window.addEventListener("offline", bandeauHorsLigne);

/* ---------------------------------------------------------------- D25. Économie de données */
const ecoActive = () => { const v = lireLS("pp_eco"); return v == null ? !!(navigator.connection && navigator.connection.saveData) : v === 1; };
const boutonEco = (src, cl = "") => `<button type="button" class="ecoimg ${cl}" data-act="ecovoir" data-src="${src}">${icon("photo")} Image : touche pour l'afficher</button>`;
/* aperçus des pièces jointes (captures de sites, miniatures) et vidéos YouTube : remplacés par leur icône */
const _vignetteResTel = vignetteRes;
vignetteRes = function(){ const h = _vignetteResTel.apply(this, arguments); return ecoActive() ? h.replace(/<img class="rimg"[^>]*>/g, "").replace('class="rthumb img"', 'class="rthumb"') : h; };
const _carteResTel = carteRes;
carteRes = function(){ const h = _carteResTel.apply(this, arguments); return ecoActive() ? h.replace(/<img src="https:\/\/i\.ytimg\.com[^>]*>/g, "").replace('class="rthumb img yt"', 'class="rthumb yt"') : h; };
const _richTel = rich;
rich = function(h){
  const out = _richTel.apply(this, arguments); if (!ecoActive() || !out) return out;
  return out.replace(/<img\b[^>]*?\ssrc="([^"]+)"[^>]*>/gi, (m, src) => boutonEco(src))
    .replace(/<iframe\b[^>]*?\ssrc="([^"]+)"[^>]*>\s*<\/iframe>/gi, (m, src) => `<button type="button" class="ecoimg" data-act="ecovoir" data-frame="${src}">${icon("video")} Vidéo : touche pour la charger</button>`);
};
ACTIONS_PLUS.ecovoir = (a, e) => {
  e.preventDefault();
  if (a.dataset.frame) { const f = document.createElement("iframe"); f.src = a.dataset.frame; f.setAttribute("allowfullscreen", ""); f.setAttribute("allow", "fullscreen; encrypted-media; picture-in-picture"); f.className = "ecoframe"; a.replaceWith(f); return; }
  const i = document.createElement("img"); i.src = a.dataset.src; i.alt = ""; if (a.classList.contains("qpic")) i.className = "qpic"; a.replaceWith(i);
};
document.addEventListener("change", e => { if (!e.target.dataset || e.target.dataset.eco !== "1") return; ecrireLS("pp_eco", e.target.checked ? 1 : 0); toast(e.target.checked ? "Économie de données activée sur cet appareil" : "Économie de données désactivée"); render(); });

/* bloc « Sur ce téléphone » de la page Profil */
function blocTelephoneProfil(){
  return `${S.prof ? "" : `<label class="switch crsw"><span><b>Rappel la veille</b><small class="muted" style="display:block">Une notification vers 18 h quand un travail est à rendre le lendemain et que tu ne l'as pas encore rendu (sur les appareils où les notifications sont activées).</small></span><input type="checkbox" data-pref="rappels" ${prefs().rappels !== false ? "checked" : ""}><i aria-hidden="true"></i></label>`}
    <h3 class="crsub">${icon("phone")} Sur ce téléphone</h3>
    <label class="switch crsw"><span><b>Économie de données</b><small class="muted" style="display:block">Les images et les vidéos ne se chargent que si tu les touches.</small></span><input type="checkbox" data-eco="1" ${ecoActive() ? "checked" : ""}><i aria-hidden="true"></i></label>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn ghost sm" href="#/telephone">${icon("phone")} Mon téléphone est-il prêt ?</a>${S.prof ? "" : `<button class="btn ghost sm" data-act="visite">Revoir la visite guidée</button>`}${appliInstallee() ? "" : `<button class="btn ghost sm" data-act="installguide">${icon("install")} Installer l'application</button>`}</div>`;
}

/* ---------------------------------------------------------------- D28. « Partager vers PhysiquePro » (Android) */
const PART = { data: null, lu: false };
VUES_PRO.partage = function(){
  if (!PART.lu) { PART.lu = true; idbGet("partage").then(v => { PART.data = v || null; render(); }); return `<div class="page"><div class="loading"><div><div class="spin"></div>Ouverture du partage…</div></div></div>`; }
  const P = PART.data;
  if (!P || (!(P.files || []).length && !P.lien)) return `<div class="page"><div class="emptystate"><b>Rien à partager.</b><span>Depuis ta galerie, l'appli Word ou un fichier, touche « Partager » puis PhysiquePro : le fichier arrivera ici.</span><a href="#/">Retour à l'accueil</a></div>${pageFoot()}</div>`;
  if (S.prof) return `<div class="page"><div class="emptystate"><b>Le partage vers PhysiquePro sert aux élèves</b><span>Il ajoute un fichier à un devoir à rendre.</span></div></div>`;
  JT.files = P.files || []; JT.lien = P.lien || "";
  const L = listeDevoirsOuverts();
  return `<div class="page"><div class="homehead"><h1>${icon("share")} Ajouter à un devoir</h1></div>
    <section class="card" style="display:grid;gap:12px">${JT.files.length ? `<div class="att rcards mini jt">${JT.files.map(f => carteEdit({ label: f.name, pending: f }, "", -1, " · " + tailleTxt(f.size))).join("")}</div>` : ""}${JT.lien ? `<p style="margin:0">Lien : <b>${esc(JT.lien)}</b></p>` : ""}
    ${L.length ? `<p class="muted" style="margin:0">Choisis le devoir :</p><div class="jtliste">${L.map(d => `<button class="btn ghost" data-act="joindrevers" data-id="${d.id}"><b>${esc(d.titre)}</b><small>${esc((cls(d.classe_id) || {}).nom || "")}${d.date_limite ? " · " + esc(urgenceDe(D(d.date_limite)).txt) : ""}</small></button>`).join("")}</div>` : `<p class="notice" style="margin:0">Tu n'as aucun devoir à rendre en ce moment.</p>`}
    <div><button class="btn ghost" data-act="partoublier">Annuler le partage</button></div></section>${pageFoot()}</div>`;
};
ACTIONS_PLUS.partoublier = async (a, e) => { e.preventDefault(); await idbDel("partage"); PART.data = null; JT.files = []; JT.lien = ""; go("/"); };
window.addEventListener("hashchange", () => { if (route().v === "partage") PART.lu = false; });

/* ---------------------------------------------------------------- D29. « Mes notes » (raccourci de l'icône) */
VUES_PRO.mesnotes = function(){
  const L = actives();
  if (L.length === 1 && !S.prof) { setTimeout(() => go("/classe/" + L[0].id + "/notes"), 0); return `<div class="page"><div class="loading"><div><div class="spin"></div></div></div></div>`; }
  return `<div class="page"><div class="homehead"><h1>${icon("grade")} Mes notes</h1></div><div class="jtliste">${L.map(c => `<a class="btn ghost" href="#/classe/${esc(c.id)}/notes"><b>${esc(c.nom)}</b><small>${esc(c.section || "")}</small></a>`).join("") || `<p class="muted">Aucun cours.</p>`}</div>${pageFoot()}</div>`;
};

/* ---------------------------------------------------------------- crochets de rendu (suite) */
APRES_RENDU.push(() => {
  if (!S.user || S.public) return;
  unParEcran(); casesConsigne(); signerPhotosCP(); repriseLecture(); majPastille(); bandeauHorsLigne(); proposerInstall();
});

/* ---------------------------------------------------------------- Lot B de l'évaluation (11/11/2026) : volets repliables qui restent ouverts au rafraîchissement */
document.addEventListener("toggle", e => {
  const d = e.target; if (!d || !d.matches) return;
  if (d.matches("details.decjour")) S.decOuvert = d.open;
  else if (d.matches("details.autresrendus")) S.autresRendus = d.open;
}, true);

/* ---------------------------------------------------------------- Invitation à activer les notifications (choix de Jalal du 11/11/2026)
   Carte en haut de l'accueil de l'élève tant que les notifications ne sont pas activées sur cet appareil (« Plus tard » la cache 3 jours),
   et bouton « Être prévenu la prochaine fois » dans la grande alerte d'urgence (18-urgences.js). */
const clePushCarte = () => "pp_push_carte_" + (S.user && S.user.id);
const pushCarteMasquee = () => { try { return Number(localStorage.getItem(clePushCarte()) || 0) > Date.now(); } catch (_) { return false; } };
const pushProposable = () => !S.prof && !!S.user && !S.pushOn && !(typeof Notification !== "undefined" && Notification.permission === "denied") && (pushPossible() || (estIOS() && !siteInstalle()));
function carteNotifsEleve(){
  if (S.prof || !S.user || S.pushOn || pushCarteMasquee()) return "";
  if (!S.pushVerifie) { setTimeout(majEtatPush, 0); return ""; }
  if (!pushProposable()) return "";
  const ios = estIOS() && !siteInstalle(), tel = matchMedia("(pointer:coarse)").matches;
  return `<section class="pushcarte" aria-label="Notifications">${icon("bell")}<div class="pctxt"><b>Sois prévenu sur ${tel ? "ton téléphone" : "cet ordinateur"}</b><span>Quand ${esc(nomProfCourt())} t'envoie un message d'urgence ou rend ta note, même si PhysiquePro est fermé.${ios ? " Sur iPhone, installe d'abord PhysiquePro sur l'écran d'accueil." : ""}</span></div>
    <div class="pcbtns">${ios ? `<button class="btn sm" data-act="installguide">${icon("install")} Installer PhysiquePro</button>` : `<button class="btn sm" data-act="pushon">${icon("bell")} Activer les notifications</button>`}<button class="btn ghost sm" data-act="pushplustard">Plus tard</button></div></section>`;
}
ACTIONS_PLUS.pushplustard = (a, e) => { e.preventDefault(); try { localStorage.setItem(clePushCarte(), String(Date.now() + 3 * 864e5)); } catch (_) {} render(); };
