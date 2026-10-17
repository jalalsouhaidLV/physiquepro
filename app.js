/* =====================================================================
   PhysiquePro · application (partie 1)
   Connexion Microsoft, accueil, classes, travaux, personnes,
   à faire / à corriger, agenda, boîte à outils.
   ===================================================================== */
(function () {
"use strict";
const CFG = window.PHYSIQUEPRO;
const app = document.getElementById("app");

/* ---------- utilitaires ---------- */
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const now = () => new Date();
const D = s => new Date(s);
const fmtD = d => d.toLocaleDateString("fr-FR", {weekday:"long", day:"numeric", month:"long"});
const fmtShort = d => d.toLocaleDateString("fr-FR", {day:"numeric", month:"short"});
const fmtT = d => d.toLocaleTimeString("fr-FR", {hour:"2-digit", minute:"2-digit"});
const fmtNote = n => n == null ? "" : String(Number(n)).replace(".", ",");
const sameDay = (a, b) => a.toDateString() === b.toDateString();
const initials = n => String(n || "?").split(/[\s.\-]+/).filter(Boolean).map(x => x[0]).join("").slice(0, 2).toUpperCase();
const nomDepuisEmail = e => String(e || "").split("@")[0].split(".").map(x => x.split("-").map(y => y.charAt(0).toUpperCase() + y.slice(1)).join("-")).join(" ");
const dueTxt = d => {
  const t = now(); if (sameDay(d, t)) return "Aujourd'hui, " + fmtT(d);
  const y = new Date(t); y.setDate(t.getDate() + 1); if (sameDay(d, y)) return "Demain, " + fmtT(d);
  return "Échéance : " + fmtD(d) + ", " + fmtT(d);
};
let toastT;
const toast = m => { const t = document.getElementById("toast"); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 3200); };

const IC = {
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>', home:'<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>',
  cal:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  todo:'<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>',
  check:'<path d="M5 12l5 5 9-10"/>', tools:'<path d="M14 6a4 4 0 0 0 5 5l-8 8a2 2 0 0 1-3-3z"/><path d="M5 5l4 4"/>',
  links:'<path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1"/><path d="M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1"/>',
  devoir:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  support:'<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>',
  quiz:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14"/><path d="M12 17.5h.01"/>',
  folder:'<path d="M3 7h6l2 2h10v10H3z"/>', grade:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  left:'<path d="M15 6l-6 6 6 6"/>', right:'<path d="M9 6l6 6-6 6"/>', x:'<path d="M6 6l12 12M18 6L6 18"/>',
  mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>', logout:'<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>'
};
const icon = (k, cls = "i") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${IC[k]}</svg>`;
const logoSVG = `<svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true"><rect x="1" y="1" width="28" height="28" rx="6" fill="none" stroke="var(--accent)" stroke-width="2"/><path d="M6 20 Q10 6 15 15 T24 10" fill="none" stroke="var(--accent)" stroke-width="2.2" stroke-linecap="round"/><circle cx="24" cy="10" r="2.4" fill="var(--accent)"/></svg>`;
const logos = `<span class="logos"><img src="img/logo-lfl.jpg" alt="Lycée franco-libanais Verdun"><img src="img/logo-mlf.png" alt="Réseau mlfmonde"></span>`;
const C = k => ({c:"--" + (k || "pc"), b:"--b-" + (k || "pc")});

/* ---------- Supabase ---------- */
if (!window.supabase) { app.innerHTML = `<div class="loading"><div class="notice">Impossible de charger PhysiquePro. Vérifie ta connexion Internet puis recharge la page.</div></div>`; return; }
const sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey, { auth: { flowType: "pkce", detectSessionInUrl: true, persistSession: true } });
const ICI = location.origin + location.pathname;

/* ---------- état ---------- */
const S = {
  user:null, profil:null, prof:false, nom:"",
  classes:[], devoirs:[], rendus:[], corrections:[], quiz:[], nbEleves:{},
  cache:{}, // données par classe : themes, supports, inscriptions
  drawer: window.innerWidth >= 1100, dd:false, open:null, todoTab:"attribues", week:0,
  pick:new Set(), compose:false, cSub:"", cBody:""
};
const route = () => { const h = location.hash.replace(/^#\/?/, "").split("/"); return {v: h[0] || "accueil", a: h[1] || null, t: h[2] || null}; };
const go = hash => { location.hash = hash; };

/* ---------- connexion ---------- */
function vLogin(message){
  app.innerHTML = `<div class="login"><div class="card">
    <div class="brand" style="cursor:default;padding:0">${logoSVG}<b>Physique<span>Pro</span></b></div>
    <div><h2 style="font-size:1.4rem">Connexion</h2><p class="muted" style="margin:.3rem 0 0">Utilise ton compte Microsoft 365 du lycée.</p></div>
    ${message ? `<div class="err">${message}</div>` : ""}
    <div class="field"><label for="mail">Adresse Microsoft 365</label><input id="mail" type="email" placeholder="prenom.nom@${esc(CFG.domaine)}" autocomplete="username"></div>
    <div id="mailErr" class="err" hidden></div>
    <button class="btn" id="loginBtn">Se connecter</button>
    <p class="muted" style="margin:0;font-size:.82rem">Tu passeras par la page Microsoft habituelle pour taper ton mot de passe, puis tu reviendras ici.</p>
    <div class="logos">${logos.replace(/<\/?span[^>]*>/g, "")}</div>
  </div></div>`;
  const btn = document.getElementById("loginBtn"), inp = document.getElementById("mail");
  const go = async () => {
    const m = inp.value.trim().toLowerCase(), err = document.getElementById("mailErr");
    if (m && !m.endsWith("@" + CFG.domaine)) { err.hidden = false; err.textContent = "Cette adresse n'appartient pas au lycée. Utilise ton adresse en @" + CFG.domaine + "."; return; }
    btn.disabled = true; btn.textContent = "Redirection vers Microsoft…";
    const qp = m ? { login_hint: m } : { prompt: "select_account" };
    const { error } = await sb.auth.signInWithOAuth({ provider: "azure", options: { scopes: "openid email profile", redirectTo: ICI, queryParams: qp } });
    if (error) { btn.disabled = false; btn.textContent = "Se connecter"; err.hidden = false; err.textContent = "La connexion n'a pas pu démarrer : " + error.message; }
  };
  btn.onclick = go; inp.onkeydown = e => { if (e.key === "Enter") go(); };
}
function messageErreur(desc){
  if (/Database error saving new user|non autoris/i.test(desc)) return "Cette adresse n'est pas autorisée : seules les adresses @" + esc(CFG.domaine) + " peuvent se connecter.";
  return "La connexion a échoué : " + esc(desc);
}

/* ---------- chargement des données ---------- */
async function chargerTout(){
  const [cl, dv, rd, co, qz] = await Promise.all([
    sb.from("classes").select("*").order("ordre"),
    sb.from("devoirs").select("*").order("date_limite"),
    sb.from("rendus").select("id, devoir_id, auteur, auteur_email, binome_email, rendu_le"),
    sb.from("corrections").select("rendu_id, note, publiee"),
    sb.from("quiz").select("id, classe_id, theme_id, titre, mode, date_limite, publie_le")
  ]);
  for (const r of [cl, dv, rd, co, qz]) if (r.error) throw r.error;
  S.classes = cl.data; S.devoirs = dv.data; S.rendus = rd.data; S.corrections = co.data; S.quiz = qz.data;
  if (S.prof) {
    const { data, error } = await sb.from("inscriptions").select("classe_id");
    if (error) throw error;
    S.nbEleves = {}; data.forEach(x => S.nbEleves[x.classe_id] = (S.nbEleves[x.classe_id] || 0) + 1);
  }
}
async function chargerClasse(id, force){
  if (S.cache[id] && !force) return S.cache[id];
  const [th, su, ins] = await Promise.all([
    sb.from("themes").select("*").eq("classe_id", id).order("ordre"),
    sb.from("supports").select("*").eq("classe_id", id).order("publie_le", {ascending:false}),
    sb.from("inscriptions").select("email, nom").eq("classe_id", id).order("nom")
  ]);
  for (const r of [th, su, ins]) if (r.error) throw r.error;
  return S.cache[id] = { themes: th.data, supports: su.data, eleves: ins.data };
}

/* ---------- logique ---------- */
const cls = id => S.classes.find(c => c.id === id);
const moi = () => S.profil.email;
const renduDe = (d, email) => S.rendus.find(r => r.devoir_id === d.id && (r.auteur_email === email || r.binome_email === email));
const correctionDe = r => r && S.corrections.find(c => c.rendu_id === r.id);
const rendusDe = d => S.rendus.filter(r => r.devoir_id === d.id);
const aCorriger = d => rendusDe(d).filter(r => !(correctionDe(r) || {}).publiee).length;
function etat(d, email){
  const r = renduDe(d, email), c = correctionDe(r);
  if (r && c && c.publiee) return {t:"Noté", k:"ok", note:c.note};
  if (r) return {t:"Rendu", k:"info"};
  return D(d.date_limite) < now() ? {t:"Manquant", k:"bad"} : {t:"Attribué", k:""};
}

/* ---------- coque ---------- */
function topbar(r){
  let crumb = "";
  const c = r.v === "classe" ? cls(r.a) : r.v === "devoir" ? cls((S.devoirs.find(d => String(d.id) === r.a) || {}).classe_id) : null;
  if (c) crumb = `<span class="sep">›</span><span class="cur">${esc(c.nom)}</span>`;
  return `<header class="topbar">
    <button class="ib" data-act="drawer" aria-label="Menu principal">${icon("menu")}</button>
    <div class="crumbs"><a class="brand" href="#/" style="text-decoration:none;color:inherit">${logoSVG}<b>Physique<span>Pro</span></b></a>${crumb}</div>
    <span class="spacer"></span>
    <div class="dd"><button class="ib" data-act="dd" aria-label="Liens utiles" aria-expanded="${S.dd}" title="Liens utiles">${icon("links")}</button>
      ${S.dd ? `<div class="dd-menu">${CFG.liensUtiles.map(l => `<a href="${esc(l.url || (S.prof ? l.prof : l.eleve))}" target="_blank" rel="noopener">${esc(l.nom)} <small>${esc(l.detail)}</small></a>`).join("")}</div>` : ""}</div>
    <div class="dd"><button class="avatar" data-act="me" title="${esc(S.nom)}" style="border:0;cursor:pointer">${initials(S.nom)}</button>
      ${S.me ? `<div class="dd-menu"><div style="padding:8px 10px"><b>${esc(S.nom)}</b><br><small class="muted">${esc(moi())}</small></div><a href="#" data-act="logout">${icon("logout")} Se déconnecter</a></div>` : ""}</div>
  </header>`;
}
function drawer(r){
  const cur = v => r.v === v ? 'aria-current="page"' : "";
  return `<nav class="drawer" ${S.drawer ? "" : "hidden"} aria-label="Menu principal">
    <a class="it" href="#/" ${cur("accueil")} style="text-decoration:none">${icon("home")}<span class="lbl">Accueil</span></a>
    <a class="it" href="#/agenda" ${cur("agenda")} style="text-decoration:none">${icon("cal")}<span class="lbl">Agenda</span></a>
    <hr><div class="sect">${S.prof ? "Enseignement" : "Inscrit"}</div>
    <a class="it" href="#/todo" ${cur("todo")} style="text-decoration:none">${icon(S.prof ? "check" : "todo")}<span class="lbl">${S.prof ? "À corriger" : "À faire"}</span></a>
    ${S.classes.map(c => `<a class="it" href="#/classe/${esc(c.id)}" ${r.v === "classe" && r.a === c.id ? 'aria-current="page"' : ""} style="text-decoration:none"><span class="ini" style="--bb:var(${C(c.couleur).b})">${esc(c.symbole)}</span><span class="lbl">${esc(c.nom)}<small>${esc(c.section)}</small></span></a>`).join("")}
    <hr><a class="it" href="#/outils" ${cur("outils")} style="text-decoration:none">${icon("tools")}<span class="lbl">Boîte à outils</span></a>
  </nav>${S.drawer && window.innerWidth < 1100 ? `<div class="scrim" data-act="drawer"></div>` : ""}`;
}
const pageFoot = () => `<div class="foot"><span><b>PhysiquePro</b> · ${esc(CFG.prof.nom)} · ${esc(CFG.prof.titre)}</span>${logos}</div>`;
const bientot = txt => `<div class="emptystate"><b>Bientôt disponible</b><span>${txt}</span></div>`;

/* ---------- accueil ---------- */
function vAccueil(){
  if (!S.classes.length) return `<div class="page">${S.prof ? bientot("Aucune classe n'est encore créée.") :
    `<div class="emptystate"><b>Tu n'es inscrit dans aucune classe pour l'instant.</b><span>Ton professeur doit t'ajouter à la liste de ta classe. Si le problème persiste, écris-lui depuis Outlook à ${esc(CFG.prof.email)}.</span></div>`}${pageFoot()}</div>`;
  return `<div class="page wide"><div class="cards">${S.classes.map(c => {
    const k = C(c.couleur), dv = S.devoirs.filter(d => d.classe_id === c.id);
    let body;
    if (S.prof) {
      const ac = dv.reduce((a, d) => a + aCorriger(d), 0);
      const next = dv.filter(d => D(d.date_limite) > now()).slice(0, 2);
      body = `${ac ? `<span><b>${ac}</b> rendu${ac > 1 ? "s" : ""} à corriger</span>` : `<span class="due">Rien à corriger</span>`}
        ${next.map(d => `<span class="due">${dueTxt(D(d.date_limite))}</span><a href="#/devoir/${d.id}" style="color:var(--ink);text-decoration:none">${esc(d.titre)}</a>`).join("")}`;
    } else {
      const due = dv.filter(d => D(d.date_limite) > now() && !renduDe(d, moi())).slice(0, 3);
      body = due.length ? due.map(d => `<span class="due">${dueTxt(D(d.date_limite))}</span><a href="#/devoir/${d.id}" style="color:var(--ink);text-decoration:none">${esc(d.titre)}</a>`).join("") : `<span class="due">Aucun travail à rendre bientôt</span>`;
    }
    return `<article class="ccard" style="--bb:var(${k.b})">
      <div style="position:relative">
        <a class="banner" href="#/classe/${esc(c.id)}" style="text-decoration:none"><span class="sym">${esc(c.symbole)}</span><h2>${esc(c.nom)}</h2><p>${esc(c.section)}</p><span class="teacher">${S.prof ? (S.nbEleves[c.id] || 0) + " élève" + ((S.nbEleves[c.id] || 0) > 1 ? "s" : "") : esc(CFG.prof.nom)}</span></a>
        <div class="avatar lg ph" style="background:var(--surface-2);color:var(--ink)">${initials(CFG.prof.nom)}</div>
      </div>
      <div class="body">${body}</div>
      <div class="foot" style="border-top:1px solid var(--line);padding:6px 8px;justify-content:flex-end">
        ${S.prof ? "" : `<a class="ib" href="#/todo" title="Mes travaux" aria-label="Mes travaux">${icon("todo")}</a>`}
        ${c.dossier_onedrive ? `<a class="ib" href="${esc(c.dossier_onedrive)}" target="_blank" rel="noopener" title="Dossier OneDrive de la classe" aria-label="Dossier OneDrive de ${esc(c.nom)}">${icon("folder")}</a>` : ""}
      </div></article>`;
  }).join("")}</div>${pageFoot()}</div>`;
}

/* ---------- page de classe ---------- */
function classTabs(c, tab){
  const T = [["travaux", "Travaux et devoirs"], ["personnes", "Personnes"]]; if (S.prof) T.push(["notes", "Notes"]);
  return `<div class="tabs" role="tablist" style="--c:var(${C(c.couleur).c})">${T.map(([k, l]) => `<a role="tab" aria-selected="${tab === k}" href="#/classe/${esc(c.id)}/${k}" style="text-decoration:none;background:none;border:0;border-bottom:3px solid ${tab === k ? "var(--c)" : "transparent"};padding:14px 18px 11px;color:${tab === k ? "var(--c)" : "var(--muted)"};font-weight:500;white-space:nowrap">${l}</a>`).join("")}</div>`;
}
function ressources(list){
  if (!list || !list.length) return "";
  return `<div class="att">${list.map(r => `<a href="${esc(r.url)}" target="_blank" rel="noopener"><span class="k">${esc(r.type || "lien")}</span>${esc(r.label || r.url)}</a>`).join("")}</div>`;
}
function itemsDuTheme(c, data, themeId){
  const items = [];
  data.supports.filter(s => (s.theme_id ?? null) === themeId).forEach(s => items.push({k:"support", id:"s" + s.id, titre:s.titre, date:D(s.publie_le), s}));
  S.devoirs.filter(d => d.classe_id === c.id && (d.theme_id ?? null) === themeId).forEach(d => items.push({k:"devoir", id:"d" + d.id, titre:d.titre, date:D(d.publie_le), d}));
  S.quiz.filter(q => q.classe_id === c.id && (q.theme_id ?? null) === themeId).forEach(q => items.push({k:"quiz", id:"q" + q.id, titre:q.titre, date:D(q.publie_le), q}));
  return items.sort((a, b) => b.date - a.date);
}
function workItem(it){
  const op = S.open === it.id; let right = "", detail = "";
  if (it.k === "support") {
    right = `<span class="dt">Publié le ${fmtShort(it.date)}</span>`;
    detail = `${it.s.description ? `<div>${esc(it.s.description)}</div>` : ""}${ressources(it.s.ressources) || `<span class="muted">Aucun fichier joint.</span>`}`;
  } else if (it.k === "devoir") {
    const d = it.d, dl = D(d.date_limite);
    right = S.prof ? `<span class="dt">${rendusDe(d).length} rendu${rendusDe(d).length > 1 ? "s" : ""}</span>` : `<span class="dt">${etat(d, moi()).t === "Manquant" ? `<span style="color:var(--bad)">Manquant</span>` : dueTxt(dl).replace("Échéance : ", "")}</span>`;
    detail = `<div class="row muted">Publié le ${fmtShort(it.date)} · ${d.mode === "binome" ? "un rendu par binôme" : "individuel"} · ${d.points} points</div>${d.consigne ? `<div>${esc(d.consigne)}</div>` : ""}
      <div class="row">${S.prof ? "" : `<span class="pill ${etat(d, moi()).k}">${etat(d, moi()).t}</span>`}<span style="flex:1"></span><a class="btn ghost sm" href="#/devoir/${d.id}" style="text-decoration:none">${S.prof ? "Voir les travaux" : "Afficher le devoir"}</a></div>`;
  } else {
    const q = it.q;
    right = `<span class="dt">${q.date_limite ? dueTxt(D(q.date_limite)).replace("Échéance : ", "") : "Entraînement"}</span>`;
    detail = `<div class="row muted">${q.mode === "note" ? "Quiz noté, une seule tentative" : "Entraînement, recommençable"}</div>${bientot("Les quiz arrivent à une prochaine étape.")}`;
  }
  return `<div class="work"><button data-act="toggle" data-id="${it.id}" aria-expanded="${op}"><span class="ico ${it.k === "support" ? "pale" : ""}">${icon(it.k, "")}</span><span class="tt">${esc(it.titre)}</span>${right}</button>${op ? `<div class="workd">${detail}</div>` : ""}</div>`;
}
function vClasse(r, data){
  const c = cls(r.a); if (!c) return `<div class="page"><div class="emptystate"><b>Classe introuvable.</b><a href="#/">Retour à l'accueil</a></div></div>`;
  const tab = ["travaux", "personnes", "notes"].includes(r.t) ? r.t : "travaux", k = C(c.couleur);
  let inner;
  if (tab === "personnes") {
    const el = data.eleves, selN = el.filter(e => S.pick.has(e.email)).length;
    inner = `<div class="page" style="max-width:800px;--c:var(${k.c})"><section class="people"><h2>Enseignants</h2><div class="person"><div class="avatar">${initials(CFG.prof.nom)}</div><span>${esc(CFG.prof.nom)}</span></div></section>
      <section class="people"><h2>Élèves <small>${el.length} élève${el.length > 1 ? "s" : ""}</small></h2>
      ${S.prof && el.length ? `<div class="person" style="gap:12px;flex-wrap:wrap"><label style="display:flex;gap:10px;align-items:center;cursor:pointer"><input type="checkbox" data-act="pickall" data-c="${esc(c.id)}" ${selN === el.length ? "checked" : ""}> Tout sélectionner</label><span style="flex:1"></span><button class="btn sm" data-act="compose" ${selN ? "" : "disabled"}>${icon("mail")} Envoyer un e-mail${selN ? " (" + selN + ")" : ""}</button></div>` : ""}
      ${S.prof && S.compose ? composeBox(el.filter(e => S.pick.has(e.email))) : ""}
      ${el.length ? el.map(e => `<div class="person">${S.prof ? `<input type="checkbox" data-act="pick" data-e="${esc(e.email)}" ${S.pick.has(e.email) ? "checked" : ""} aria-label="Sélectionner ${esc(e.nom)}">` : ""}<div class="avatar" style="background:var(--surface-2);color:var(--ink)">${initials(e.nom)}</div><span style="flex:1;min-width:0">${esc(e.nom)}${S.prof ? `<small class="muted" style="display:block;overflow-wrap:anywhere">${esc(e.email)}</small>` : ""}</span></div>`).join("")
        : `<p class="empty">${S.prof ? "Aucun élève inscrit. L'import des listes de classe arrive à une prochaine étape." : "Aucun élève."}</p>`}
      </section>${pageFoot()}</div>`;
  } else if (tab === "notes" && S.prof) {
    inner = `<div class="page">${bientot("Le tableau des notes arrive à l'étape 4.")}${pageFoot()}</div>`;
  } else {
    const up = S.devoirs.filter(d => d.classe_id === c.id && D(d.date_limite) > now() && (S.prof || !renduDe(d, moi()))).slice(0, 3);
    const groupes = data.themes.map(t => ({titre:t.titre, items:itemsDuTheme(c, data, t.id)}));
    const sansTheme = itemsDuTheme(c, data, null); if (sansTheme.length) groupes.push({titre:"Autres", items:sansTheme});
    inner = `<div class="page" style="--c:var(${k.c});--bb:var(${k.b})">
      <div class="banner bigbanner"><span class="sym">${esc(c.symbole)}</span><h1>${esc(c.nom)}</h1><span>${esc(c.section)}</span></div>
      <div class="classgrid">
        <aside style="display:grid;gap:16px">
          <div class="box"><h3>À venir</h3>${up.length ? up.map(d => `<span class="muted" style="font-size:.8rem">${dueTxt(D(d.date_limite)).replace("Échéance : ", "")}</span><a href="#/devoir/${d.id}" style="color:var(--ink);text-decoration:none;font-weight:500">${esc(d.titre)}</a>`).join("") : `<span class="muted">Aucun devoir à rendre bientôt.</span>`}<a class="linkbtn" href="#/todo" style="text-decoration:none">Tout afficher</a></div>
          ${c.dossier_onedrive ? `<a class="btn ghost" href="${esc(c.dossier_onedrive)}" target="_blank" rel="noopener" style="text-decoration:none">${icon("folder")} Dossier OneDrive</a>` : ""}
        </aside>
        <div style="display:grid;gap:32px;min-width:0">${groupes.length && groupes.some(g => g.items.length) ? groupes.map(g => `<section class="theme"><h2>${esc(g.titre)}</h2>${g.items.length ? g.items.map(workItem).join("") : `<p class="empty">Rien pour l'instant.</p>`}</section>`).join("")
          : `<div class="emptystate"><b>Aucun travail pour l'instant.</b><span>${S.prof ? "La création de thèmes, supports et devoirs arrive à l'étape 2." : "Ton professeur n'a encore rien publié dans cette classe."}</span></div>`}</div>
      </div>${pageFoot()}</div>`;
  }
  return classTabs(c, tab) + inner;
}
function composeBox(list){
  const link = outlookLink(list.map(e => e.email), S.cSub, S.cBody);
  return `<div class="box" style="margin:12px 0"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><h3>Nouvel e-mail</h3><button class="ib" data-act="closecompose" aria-label="Fermer">${icon("x")}</button></div>
    <div class="field"><label>À (${list.length})</label><div class="att">${list.map(e => `<span class="f">${esc(e.nom)}</span>`).join("")}</div></div>
    <div class="field"><label for="cSub">Objet</label><input id="cSub" value="${esc(S.cSub)}"></div>
    <div class="field"><label for="cBody">Message</label><textarea id="cBody">${esc(S.cBody)}</textarea></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><a class="btn" id="olk" href="${esc(link)}" target="_blank" rel="noopener" style="text-decoration:none">${icon("mail")} Ouvrir dans Outlook</a><button class="btn ghost" data-act="copymails">Copier les adresses</button></div>
    <p class="muted" style="margin:0;font-size:.8rem">Outlook s'ouvre avec les destinataires, l'objet et le message remplis : tu vérifies et tu cliques sur Envoyer.</p></div>`;
}
const outlookLink = (mails, sub, body) => "https://outlook.office.com/mail/deeplink/compose?to=" + encodeURIComponent(mails.join(";")) + "&subject=" + encodeURIComponent(sub || "") + "&body=" + encodeURIComponent(body || "");

/* ---------- devoir (lecture) ---------- */
function vDevoir(r){
  const d = S.devoirs.find(x => String(x.id) === r.a);
  if (!d) return `<div class="page"><div class="emptystate"><b>Devoir introuvable.</b><a href="#/">Retour à l'accueil</a></div></div>`;
  const c = cls(d.classe_id), k = C(c && c.couleur), dl = D(d.date_limite), e = S.prof ? null : etat(d, moi());
  return `<div class="page wide" style="--c:var(${k.c})"><div class="dv">
    <div style="display:grid;gap:16px;min-width:0">
      <div class="dvhead"><span class="ico">${icon("devoir", "")}</span><div style="flex:1;min-width:0"><h1>${esc(d.titre)}</h1>
        <div class="muted" style="font-size:.88rem;margin-top:4px">${esc(CFG.prof.nom)} · ${fmtShort(D(d.publie_le))} · ${esc(c ? c.nom : "")}</div>
        <div class="dvmeta"><b>${d.points} points</b><span>${dueTxt(dl)}</span></div></div></div>
      <div style="padding-left:52px;display:grid;gap:14px">${d.consigne ? `<p style="margin:0;white-space:pre-line">${esc(d.consigne)}</p>` : ""}
        <p class="muted" style="margin:0;font-size:.85rem">${d.mode === "binome" ? "Un seul rendu par binôme : la note s'applique aux deux élèves." : "Travail individuel."}${d.formats ? " Formats : " + esc(d.formats) + "." : ""}</p>${ressources(d.ressources)}</div>
    </div>
    <aside><div class="yourwork"><header><h2>${S.prof ? "Travaux des élèves" : "Votre travail"}</h2>${e ? `<span class="pill ${e.k}">${e.t}${e.note != null ? " · " + fmtNote(e.note) + "/20" : ""}</span>` : `<span class="pill info">${rendusDe(d).length} rendu${rendusDe(d).length > 1 ? "s" : ""}</span>`}</header>
      <p class="muted" style="margin:0">${S.prof ? "La correction (notes et commentaires) arrive à l'étape 4." : "Le dépôt des fichiers arrive à l'étape 3."}</p></div></aside>
  </div>${pageFoot()}</div>`;
}

/* ---------- à faire / à corriger ---------- */
function vTodo(){
  if (S.prof) {
    const parClasse = S.classes.map(c => ({c, ds:S.devoirs.filter(d => d.classe_id === c.id).slice().reverse()})).filter(x => x.ds.length);
    return `<div class="page"><h1 style="font-size:1.6rem">À corriger</h1>${parClasse.length ? `<div class="todo">${parClasse.map(({c, ds}) => `<section class="group" style="--c:var(${C(c.couleur).c})"><header><span style="color:var(--c)">${esc(c.nom)}</span><span class="muted mono">${ds.reduce((a, d) => a + aCorriger(d), 0)} à corriger</span></header>
      ${ds.map(d => `<div class="work"><a href="#/devoir/${d.id}" style="display:flex;gap:16px;align-items:center;padding:12px 18px;text-decoration:none;color:inherit"><span class="ico">${icon("devoir", "")}</span><span class="tt">${esc(d.titre)}<br><small class="muted" style="font-weight:400">${dueTxt(D(d.date_limite))}</small></span><span class="stats" style="gap:18px"><div><b style="font-size:1.3rem">${aCorriger(d)}</b><small>À noter</small></div><div><b style="font-size:1.3rem">${rendusDe(d).length}</b><small>Rendus</small></div></span></a></div>`).join("")}</section>`).join("")}</div>` : `<div class="emptystate"><b>Aucun devoir pour l'instant.</b><span>Les devoirs que tu créeras apparaîtront ici avec le nombre de copies à corriger.</span></div>`}${pageFoot()}</div>`;
  }
  const groups = {
    attribues: S.devoirs.filter(d => etat(d, moi()).t === "Attribué"),
    manquants: S.devoirs.filter(d => etat(d, moi()).t === "Manquant"),
    termines: S.devoirs.filter(d => ["Rendu", "Noté"].includes(etat(d, moi()).t))
  };
  const L = {attribues:"Attribués", manquants:"Manquants", termines:"Terminés"}, list = groups[S.todoTab];
  return `<div class="tabs" role="tablist" style="--c:var(--accent)">${Object.keys(L).map(k => `<button role="tab" aria-selected="${S.todoTab === k}" data-act="todotab" data-t="${k}">${L[k]} <span class="muted mono">${groups[k].length}</span></button>`).join("")}</div>
  <div class="page" style="max-width:820px"><section class="group">${list.length ? list.map(d => { const c = cls(d.classe_id), e = etat(d, moi()); return `<div class="work" style="--c:var(${C(c && c.couleur).c})"><a href="#/devoir/${d.id}" style="display:flex;gap:16px;align-items:center;padding:12px 18px;text-decoration:none;color:inherit"><span class="ico">${icon("devoir", "")}</span><span class="tt">${esc(d.titre)}<br><small class="muted" style="font-weight:400">${esc(c ? c.nom : "")}</small></span><span class="dt">${e.t === "Noté" ? `<span class="mono" style="color:var(--ink);font-size:.95rem">${fmtNote(e.note)}/20</span>` : e.t === "Rendu" ? "Rendu" : dueTxt(D(d.date_limite)).replace("Échéance : ", "")}</span></a></div>`; }).join("")
    : `<p class="empty" style="padding:24px 18px;margin:0">${S.todoTab === "attribues" ? "Aucun travail à rendre pour le moment." : S.todoTab === "manquants" ? "Aucun travail manquant." : "Aucun travail terminé."}</p>`}</section>${pageFoot()}</div>`;
}

/* ---------- agenda ---------- */
function vAgenda(){
  const t = now(), mon = new Date(t); mon.setHours(0, 0, 0, 0); mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7) + S.week * 7);
  const days = [...Array(7)].map((_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return d; });
  const evts = [...S.devoirs.map(d => ({d:D(d.date_limite), t:d.titre, c:cls(d.classe_id), href:"#/devoir/" + d.id})),
                ...S.quiz.filter(q => q.date_limite).map(q => ({d:D(q.date_limite), t:"Quiz · " + q.titre, c:cls(q.classe_id), href:"#/classe/" + q.classe_id}))].filter(e => e.c);
  return `<div class="page wide"><div class="weekbar"><button class="ib" data-act="week" data-w="-1" aria-label="Semaine précédente">${icon("left")}</button><button class="ib" data-act="week" data-w="1" aria-label="Semaine suivante">${icon("right")}</button>
    <h2>${mon.toLocaleDateString("fr-FR", {day:"numeric", month:"short"})} – ${days[6].toLocaleDateString("fr-FR", {day:"numeric", month:"short", year:"numeric"})}</h2>${S.week ? `<button class="btn ghost sm" data-act="week" data-w="0">Cette semaine</button>` : ""}</div>
    <div style="overflow-x:auto"><div class="week">${days.map(d => `<div class="day"><div class="dh ${sameDay(d, t) ? "today" : ""}">${d.toLocaleDateString("fr-FR", {weekday:"short"})}<b>${d.getDate()}</b></div>
      ${evts.filter(e => sameDay(e.d, d)).sort((a, b) => a.d - b.d).map(e => `<a class="ev" style="--bb:var(${C(e.c.couleur).b});text-decoration:none" href="${e.href}">${esc(e.t)}<small>${esc(e.c.nom)} · ${fmtT(e.d)}</small></a>`).join("")}</div>`).join("")}</div></div>${pageFoot()}</div>`;
}

/* ---------- outils ---------- */
function vOutils(){
  return `<div class="page"><h1 style="font-size:1.6rem">Boîte à outils</h1>${CFG.outils.map(g => `<section class="theme" style="--c:var(--${esc(g.couleur)})"><h2>${esc(g.matiere)}</h2>${g.liens.map(([n, d, u]) => `<div class="work"><a href="${esc(u)}" target="_blank" rel="noopener" style="display:flex;gap:16px;align-items:center;padding:10px 8px;text-decoration:none;color:inherit;border-radius:8px"><span class="ico pale">${icon("links", "")}</span><span class="tt">${esc(n)}<br><small class="muted" style="font-weight:400">${esc(d)}</small></span><span class="muted">↗</span></a></div>`).join("")}</section>`).join("")}${pageFoot()}</div>`;
}

/* ---------- rendu ---------- */
let renderId = 0;
async function render(){
  const id = ++renderId, r = route();
  let content;
  try {
    if (r.v === "classe") {
      if (!S.cache[r.a]) app.innerHTML = topbar(r) + `<div class="shell">${drawer(r)}<main class="content"><div class="loading"><div><div class="spin"></div>Chargement…</div></div></main></div>`;
      const data = cls(r.a) ? await chargerClasse(r.a) : null;
      if (id !== renderId) return;
      content = vClasse(r, data);
    } else content = ({agenda:vAgenda, todo:vTodo, outils:vOutils, devoir:vDevoir})[r.v]?.(r) ?? vAccueil();
  } catch (e) { content = `<div class="page"><div class="emptystate"><b>Impossible de charger cette page.</b><span>${esc(e.message || e)}</span><button class="btn ghost" data-act="reload">Réessayer</button></div></div>`; }
  app.innerHTML = topbar(r) + `<div class="shell">${drawer(r)}<main class="content">${content}</main></div>`;
}

/* ---------- événements ---------- */
document.addEventListener("click", async e => {
  const a = e.target.closest("[data-act]");
  if (!a) {
    if ((S.dd || S.me) && !e.target.closest(".dd")) { S.dd = false; S.me = false; render(); }
    if (S.drawer && window.innerWidth < 1100 && e.target.closest(".drawer a")) S.drawer = false;
    return;
  }
  const act = a.dataset.act;
  switch (act) {
    case "drawer": S.drawer = !S.drawer; render(); return;
    case "dd": S.dd = !S.dd; S.me = false; render(); return;
    case "me": S.me = !S.me; S.dd = false; render(); return;
    case "logout": e.preventDefault(); await sb.auth.signOut(); location.replace(ICI); return;
    case "toggle": S.open = S.open === a.dataset.id ? null : a.dataset.id; render(); return;
    case "todotab": S.todoTab = a.dataset.t; render(); return;
    case "week": S.week = a.dataset.w === "0" ? 0 : S.week + Number(a.dataset.w); render(); return;
    case "reload": S.cache = {}; await chargerTout().catch(() => {}); render(); return;
    case "pick": { const m = a.dataset.e; S.pick.has(m) ? S.pick.delete(m) : S.pick.add(m); if (!S.pick.size) S.compose = false; render(); return; }
    case "pickall": { const el = (S.cache[a.dataset.c] || {eleves:[]}).eleves, all = el.every(x => S.pick.has(x.email)); S.pick = all ? new Set() : new Set(el.map(x => x.email)); if (!S.pick.size) S.compose = false; render(); return; }
    case "compose": S.compose = true; render(); return;
    case "closecompose": S.compose = false; S.cSub = ""; S.cBody = ""; render(); return;
    case "copymails": { const txt = [...S.pick].join("; "); try { navigator.clipboard.writeText(txt).then(() => toast("Adresses copiées"), () => toast(txt)); } catch (_) { toast(txt); } return; }
  }
});
document.addEventListener("input", e => {
  if (e.target.id === "cSub" || e.target.id === "cBody") { S[e.target.id] = e.target.value; const l = document.getElementById("olk"); if (l) l.href = outlookLink([...S.pick], S.cSub, S.cBody); }
});
document.addEventListener("keydown", e => { if (e.key === "Escape" && (S.dd || S.me || (S.drawer && window.innerWidth < 1100))) { S.dd = false; S.me = false; if (window.innerWidth < 1100) S.drawer = false; render(); } });
window.addEventListener("hashchange", () => { S.open = null; S.dd = false; S.me = false; S.compose = false; S.pick = new Set(); S.cSub = ""; S.cBody = ""; if (window.innerWidth < 1100) S.drawer = false; window.scrollTo(0, 0); render(); });
let lastW = window.innerWidth;
window.addEventListener("resize", () => { const w = window.innerWidth; if ((lastW >= 1100) !== (w >= 1100)) { S.drawer = w >= 1100; if (S.profil) render(); } lastW = w; });

/* ---------- démarrage ---------- */
(async function start(){
  const p = new URLSearchParams(location.search + "&" + location.hash.replace(/^#/, ""));
  const errDesc = p.get("error_description");
  if (errDesc) { history.replaceState(null, "", ICI); vLogin(messageErreur(errDesc)); return; }
  const { data: { session } } = await sb.auth.getSession();
  if (location.search) history.replaceState(null, "", ICI + location.hash);
  if (!session) { vLogin(); return; }
  S.user = session.user;
  const { data: profil, error } = await sb.from("profiles").select("email, nom, role").eq("id", S.user.id).maybeSingle();
  if (error || !profil) { vLogin("Ton profil n'a pas pu être chargé. Déconnecte-toi puis reconnecte-toi."); await sb.auth.signOut(); return; }
  S.profil = profil; S.prof = profil.role === "prof";
  if (S.prof) S.nom = CFG.prof.nom;
  else {
    const { data: ins } = await sb.from("inscriptions").select("nom").eq("email", profil.email).limit(1);
    S.nom = (ins && ins[0] && ins[0].nom) || (profil.nom && !profil.nom.includes("@") ? profil.nom : nomDepuisEmail(profil.email));
  }
  try { await chargerTout(); } catch (e) { app.innerHTML = `<div class="loading"><div class="notice">Impossible de charger tes données : ${esc(e.message)}</div></div>`; return; }
  render();
  sb.auth.onAuthStateChange(ev => { if (ev === "SIGNED_OUT") location.replace(ICI); });
})();
})();
