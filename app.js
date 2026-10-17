/* =====================================================================
   PhysiquePro · application
   Organisation : 01 noyau · 02 coque · 03 classe · 04 devoirs · 05 éditeurs
                  06 questionnaires · 07 paramètres · 08 fenêtres · 09 événements
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
const fmtQuand = d => sameDay(d, now()) ? fmtT(d) : fmtShort(d) + (d.getFullYear() !== now().getFullYear() ? " " + d.getFullYear() : "");
const fmtNote = n => n == null || n === "" ? "" : String(Math.round(Number(n) * 100) / 100).replace(".", ",");
const sameDay = (a, b) => a.toDateString() === b.toDateString();
const initials = n => String(n || "?").split(/[\s.\-]+/).filter(Boolean).map(x => x[0]).join("").slice(0, 2).toUpperCase();
const nomDepuisEmail = e => String(e || "").split("@")[0].split(".").map(x => x.split("-").map(y => y.charAt(0).toUpperCase() + y.slice(1)).join("-")).join(" ");
const dueTxt = d => {
  const t = now(); if (sameDay(d, t)) return "Aujourd'hui, " + fmtT(d);
  const y = new Date(t); y.setDate(t.getDate() + 1); if (sameDay(d, y)) return "Demain, " + fmtT(d);
  return "Échéance : " + fmtD(d) + ", " + fmtT(d);
};
const ouvert = d => !d.date_limite || D(d.date_limite) > now();
const dueOf = d => d.date_limite ? dueTxt(D(d.date_limite)) : "Aucune date limite";
const pts = d => d.points == null ? "Non noté" : d.points + " points";
const pad = n => String(n).padStart(2, "0");
const ymd = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
const hm = d => pad(d.getHours()) + ":" + pad(d.getMinutes());
let toastT;
const toast = m => { const t = document.getElementById("toast"); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 3500); };

const IC = {
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>', home:'<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>',
  cal:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  todo:'<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>',
  check:'<path d="M5 12l5 5 9-10"/>', tools:'<path d="M14 6a4 4 0 0 0 5 5l-8 8a2 2 0 0 1-3-3z"/><path d="M5 5l4 4"/>',
  links:'<path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1"/><path d="M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1"/>',
  devoir:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  support:'<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>',
  quiz:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8.5 8l1 1 2-2M8.5 13l1 1 2-2M13.5 8.5h2M13.5 13.5h2"/>',
  folder:'<path d="M3 7h6l2 2h10v10H3z"/>', grade:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  left:'<path d="M15 6l-6 6 6 6"/>', right:'<path d="M9 6l6 6-6 6"/>', x:'<path d="M6 6l12 12M18 6L6 18"/>',
  mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>', logout:'<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
  plus:'<path d="M12 5v14M5 12h14"/>', more:'<circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/>',
  theme:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M8 10v9"/>', edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  trash:'<path d="M5 7h14M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>', up:'<path d="M12 19V5M6 11l6-6 6 6"/>', down:'<path d="M12 5v14M6 13l6 6 6-6"/>',
  upload:'<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>', ecole:'<path d="M3 10l9-5 9 5-9 5z"/><path d="M7 12v5c3 2 7 2 10 0v-5"/>',
  nuage:'<path d="M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 9a4.5 4.5 0 0 0 1 9z"/>',
  copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  key:'<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7 7 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z"/>',
  video:'<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/>', archive:'<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v11h14V9M10 13h4"/>',
  restore:'<path d="M4 12a8 8 0 1 0 3-6.2"/><path d="M4 4v4h4"/>', send:'<path d="M4 12l16-8-6 16-2-7z"/>', comment:'<path d="M4 5h16v11H9l-5 4z"/>',
  people:'<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14c2.8 0 5 2.2 5 5"/>',
  reuse:'<path d="M17 2l4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  file:'<path d="M6 3h8l4 4v14H6z"/>', expand:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>', eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'
};
const icon = (k, cls = "i") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${IC[k] || IC.links}</svg>`;
const logoSVG = `<svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true"><rect x="1" y="1" width="28" height="28" rx="6" fill="none" stroke="var(--accent)" stroke-width="2"/><path d="M6 20 Q10 6 15 15 T24 10" fill="none" stroke="var(--accent)" stroke-width="2.2" stroke-linecap="round"/><circle cx="24" cy="10" r="2.4" fill="var(--accent)"/></svg>`;
const LOGOS = window.PP_LOGOS || {};
const logos = `<span class="logos">${LOGOS.lfl ? `<img src="${LOGOS.lfl}" alt="Lycée franco-libanais Verdun">` : ""}${LOGOS.mlf ? `<img src="${LOGOS.mlf}" alt="Réseau mlfmonde">` : ""}</span>`;
const C = k => ({c:"--" + (k || "pc"), b:"--b-" + (k || "pc")});

/* texte mis en forme : on ne garde que des balises sûres */
function rich(html){
  if (!html) return "";
  if (!/[<>]/.test(html) || typeof DOMParser === "undefined") return esc(html).replace(/\n/g, "<br>");
  const root = new DOMParser().parseFromString("<div>" + html + "</div>", "text/html").body.firstChild;
  const ok = new Set(["B","STRONG","I","EM","U","UL","OL","LI","BR","P","DIV"]);
  [...root.querySelectorAll("*")].reverse().forEach(el => {
    if (["SCRIPT","STYLE","IFRAME","OBJECT"].includes(el.tagName)) el.remove();
    else if (!ok.has(el.tagName)) el.replaceWith(...el.childNodes);
    else [...el.attributes].forEach(a => el.removeAttribute(a.name));
  });
  return root.innerHTML;
}
const linkify = t => esc(t).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>').replace(/\n/g, "<br>");

/* ---------- Supabase ---------- */
if (!window.supabase) { app.innerHTML = `<div class="loading"><div class="notice">Impossible de charger PhysiquePro. Vérifie ta connexion Internet puis recharge la page.</div></div>`; return; }
const sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey, { auth: { flowType: "pkce", detectSessionInUrl: true, persistSession: true } });
const ICI = location.origin + location.pathname;

/* ---------- état ---------- */
const S = {
  user:null, profil:null, prof:false, nom:"",
  classes:[], devoirs:[], rendus:[], corrections:[], quiz:[], resultats:[], profils:{}, nbEleves:{},
  cache:{},
  drawer: window.innerWidth >= 1100, dd:false, me:false, menu:null, open:null, todoTab:"attribues", week:0,
  pick:new Set(), compose:false, cSub:"", cBody:"", modal:null, ed:null, sel:null, ptab:"travaux",
  files:[], lien:"", partenaire:"", quizRep:{}, quizRes:{}, annonce:null, filtreTheme:"", reduits:new Set(), settings:null
};
const route = () => { const h = location.hash.replace(/^#\/?/, "").split("/").map(decodeURIComponent); return {v: h[0] || "accueil", a: h[1] || null, t: h[2] || null, x: h[3] || null}; };
const go = hash => { location.hash = hash; };

/* ---------- chargement des données ---------- */
async function chargerTout(){
  const reqs = [
    sb.from("classes").select("*").order("ordre"),
    sb.from("devoirs").select("*").order("date_limite", {ascending:true, nullsFirst:false}),
    sb.from("rendus").select("*"),
    sb.from("corrections").select("*"),
    sb.from("quiz").select("*"),
    sb.from("resultats_quiz").select("quiz_id, eleve, score, sur, fait_le")
  ];
  if (S.prof) reqs.push(sb.from("inscriptions").select("classe_id, email, nom"), sb.from("profiles").select("id, email"));
  const res = await Promise.all(reqs);
  for (const r of res) if (r.error) throw r.error;
  [S.classes, S.devoirs, S.rendus, S.corrections, S.quiz, S.resultats] = res.slice(0, 6).map(r => r.data);
  if (S.prof) {
    S.nbEleves = {}; S.toutesInscriptions = res[6].data;
    res[6].data.forEach(x => S.nbEleves[x.classe_id] = (S.nbEleves[x.classe_id] || 0) + 1);
    S.profils = {}; res[7].data.forEach(p => S.profils[p.id] = p.email);
  }
}
async function chargerClasse(id, force){
  if (S.cache[id] && !force) return S.cache[id];
  const [th, su, ins, an] = await Promise.all([
    sb.from("themes").select("*").eq("classe_id", id).order("ordre"),
    sb.from("supports").select("*").eq("classe_id", id).order("publie_le", {ascending:false}),
    sb.from("inscriptions").select("email, nom").eq("classe_id", id).order("nom"),
    sb.from("annonces").select("*").eq("classe_id", id).order("cree_le", {ascending:false})
  ]);
  for (const r of [th, su, ins]) if (r.error) throw r.error;
  const annonces = an.error ? [] : an.data;
  let coms = [];
  if (annonces.length) { const r = await sb.from("commentaires").select("*").in("annonce_id", annonces.map(a => a.id)).order("cree_le"); if (!r.error) coms = r.data; }
  return S.cache[id] = { themes: th.data, supports: su.data, eleves: ins.data, annonces, coms };
}
async function rafraichir(classe){ if (classe) delete S.cache[classe]; else S.cache = {}; await chargerTout(); }

/* ---------- logique ---------- */
const cls = id => S.classes.find(c => c.id === id);
const actives = () => S.classes.filter(c => !c.archive);
const moi = () => S.profil.email;
const renduDe = (d, email) => S.rendus.find(r => r.devoir_id === d.id && (r.auteur_email === email || r.binome_email === email));
const correctionDe = r => r && S.corrections.find(c => c.rendu_id === r.id);
const rendusDe = d => S.rendus.filter(r => r.devoir_id === d.id);
const aCorriger = d => rendusDe(d).filter(r => !(correctionDe(r) || {}).publiee).length;
const elevesDuDevoir = (d, liste) => d.eleves ? liste.filter(e => d.eleves.includes(e.email)) : liste;
const inscritsDe = cid => (S.cache[cid] && S.cache[cid].eleves) || (S.toutesInscriptions || []).filter(x => x.classe_id === cid);
function etat(d, email){
  const r = renduDe(d, email), c = correctionDe(r);
  if (r && c && c.publiee) return {t:"Noté", k:"ok", note:c.note, r, c};
  if (r) return {t:"Rendu", k:"info", r, c};
  return !ouvert(d) ? {t:"Manquant", k:"bad"} : {t:"Attribué", k:""};
}
const resultatDe = (q, uid) => S.resultats.find(x => x.quiz_id === q.id && x.eleve === uid);
const noteQuiz = (q, r) => r ? Math.round(r.score / Math.max(1, r.sur) * (q.points || 20) * 100) / 100 : null;
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
    ${logos.replace('class="logos"', 'class="logos" style="justify-content:center;border-top:1px solid var(--line);padding-top:14px"')}
  </div></div>`;
  const btn = document.getElementById("loginBtn"), inp = document.getElementById("mail");
  const lancer = async () => {
    const m = inp.value.trim().toLowerCase(), err = document.getElementById("mailErr");
    if (m && !m.endsWith("@" + CFG.domaine)) { err.hidden = false; err.textContent = "Cette adresse n'appartient pas au lycée. Utilise ton adresse en @" + CFG.domaine + "."; return; }
    btn.disabled = true; btn.textContent = "Redirection vers Microsoft…";
    const { error } = await sb.auth.signInWithOAuth({ provider: "azure", options: { scopes: "openid email profile", redirectTo: ICI, queryParams: m ? { login_hint: m } : { prompt: "select_account" } } });
    if (error) { btn.disabled = false; btn.textContent = "Se connecter"; err.hidden = false; err.textContent = "La connexion n'a pas pu démarrer : " + error.message; }
  };
  btn.onclick = lancer; inp.onkeydown = e => { if (e.key === "Enter") lancer(); };
}
const messageErreur = desc => /Database error saving new user|non autoris/i.test(desc) ? "Cette adresse n'est pas autorisée : seules les adresses @" + esc(CFG.domaine) + " peuvent se connecter." : "La connexion a échoué : " + esc(desc);

/* ---------- barre du haut ---------- */
function quickIcon(k){
  if (k === "pronote") return `<b class="qp">P</b>`;
  if (k === "pix") return `<b class="qp" style="font-size:.72rem;letter-spacing:.02em">PIX</b>`;
  return icon(k === "ecole" ? "ecole" : k === "mail" ? "mail" : k === "nuage" ? "nuage" : "links");
}
function topbar(r){
  let crumb = "";
  const c = r.v === "classe" ? cls(r.a) : r.v === "devoir" ? cls((S.devoirs.find(d => String(d.id) === r.a) || {}).classe_id) : r.v === "quiz" ? cls((S.quiz.find(q => String(q.id) === r.a) || {}).classe_id) : null;
  if (c) crumb = `<span class="sep">›</span><a class="cur" href="#/classe/${esc(c.id)}" style="color:inherit;text-decoration:none">${esc(c.nom)}<small>${esc(c.section)}</small></a>`;
  return `<header class="topbar">
    <button class="ib" data-act="drawer" aria-label="Menu principal">${icon("menu")}</button>
    <div class="crumbs"><a class="brand" href="#/" style="text-decoration:none;color:inherit">${logoSVG}<b>Physique<span>Pro</span></b></a>${crumb}</div>
    <span class="spacer"></span>
    <nav class="quick" aria-label="Liens rapides">${CFG.liensUtiles.map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener" class="${l.principal ? "main" : ""}" style="--q:${esc(l.couleur)}"><span class="qi">${quickIcon(l.icone)}</span><span class="ql">${esc(l.nom)}</span></a>`).join("")}</nav>
    <div class="dd"><button class="ib" data-act="dd" title="${S.prof ? "Créer un cours" : "Rejoindre un cours"}" aria-label="${S.prof ? "Créer un cours" : "Rejoindre un cours"}" aria-expanded="${S.dd}">${icon("plus")}</button>
      ${S.dd ? `<div class="dd-menu"><a href="#" data-act="${S.prof ? "newclass" : "join"}">${icon("plus")} ${S.prof ? "Créer un cours" : "Rejoindre un cours"}</a></div>` : ""}</div>
    <div class="dd"><button class="avatar" data-act="me" title="${esc(S.nom)}" style="border:0;cursor:pointer">${initials(S.nom)}</button>
      ${S.me ? `<div class="dd-menu"><div style="padding:8px 10px"><b>${esc(S.nom)}</b><br><small class="muted">${esc(moi())}</small></div><a href="#" data-act="logout">${icon("logout")} Se déconnecter</a></div>` : ""}</div>
  </header>`;
}
function drawer(r){
  const cur = v => r.v === v ? 'aria-current="page"' : "";
  const arch = S.classes.some(c => c.archive);
  return `<nav class="drawer" ${S.drawer ? "" : "hidden"} aria-label="Menu principal">
    <a class="it" href="#/" ${cur("accueil")}>${icon("home")}<span class="lbl">Accueil</span></a>
    <a class="it" href="#/agenda" ${cur("agenda")}>${icon("cal")}<span class="lbl">Agenda</span></a>
    <hr><div class="sect">${icon("people")} ${S.prof ? "Cours enseignés" : "Cours suivis"}</div>
    <a class="it" href="#/todo" ${cur("todo")}>${icon(S.prof ? "check" : "todo")}<span class="lbl">${S.prof ? "À corriger" : "À faire"}</span></a>
    ${actives().map(c => `<a class="it" href="#/classe/${esc(c.id)}" ${r.v === "classe" && r.a === c.id ? 'aria-current="page"' : ""}><span class="ini" style="--bb:var(${C(c.couleur).b})">${esc((c.symbole || c.nom).slice(0, 3))}</span><span class="lbl">${esc(c.nom)}<small>${esc(c.section)}</small></span></a>`).join("")}
    <hr>${arch && S.prof ? `<a class="it" href="#/archives" ${cur("archives")}>${icon("archive")}<span class="lbl">Cours archivés</span></a>` : ""}
    <a class="it" href="#/outils" ${cur("outils")}>${icon("tools")}<span class="lbl">Boîte à outils</span></a>
  </nav>${S.drawer && window.innerWidth < 1100 ? `<div class="scrim" data-act="drawer"></div>` : ""}`;
}
const pageFoot = () => `<div class="foot"><span><b>PhysiquePro</b> · ${esc(CFG.prof.nom)} · ${esc(CFG.prof.titre)}</span>${logos}</div>`;
const bientot = txt => `<div class="emptystate"><b>Bientôt disponible</b><span>${txt}</span></div>`;
const avatarP = (nom, cls2 = "") => `<div class="avatar ${cls2}" style="background:var(--surface-2);color:var(--ink)">${initials(nom)}</div>`;

/* ---------- accueil : cartes de cours ---------- */
function carte(c, archivee){
  const k = C(c.couleur), dv = S.devoirs.filter(d => d.classe_id === c.id && !d.brouillon);
  let body = "";
  if (!archivee) {
    if (S.prof) {
      const ac = dv.reduce((a, d) => a + aCorriger(d), 0), next = dv.filter(d => d.date_limite && ouvert(d)).slice(0, 2);
      body = `${ac ? `<span><b>${ac}</b> rendu${ac > 1 ? "s" : ""} à corriger</span>` : ""}${next.map(d => `<span class="due">${dueOf(d)}</span><a href="#/devoir/${d.id}">${esc(d.titre)}</a>`).join("")}`;
    } else {
      const due = dv.filter(d => ouvert(d) && !renduDe(d, moi())).slice(0, 3);
      body = due.map(d => `<span class="due">${dueOf(d)}</span><a href="#/devoir/${d.id}">${esc(d.titre)}</a>`).join("");
    }
  }
  const menu = S.prof ? `<div class="dd kebab"><button class="ib" data-act="menu" data-m="c${esc(c.id)}" aria-label="Options du cours">${icon("more")}</button>${S.menu === "c" + c.id ? `<div class="dd-menu">
      ${archivee ? `<a href="#" data-act="archiver" data-c="${esc(c.id)}" data-on="0">${icon("restore")} Restaurer</a><a href="#" data-act="supprclasse" data-c="${esc(c.id)}" style="color:var(--bad)">${icon("trash")} Supprimer</a>`
        : `<a href="#/classe/${esc(c.id)}/parametres">${icon("edit")} Modifier</a>${c.code ? `<a href="#" data-act="copycode" data-code="${esc(c.code)}">${icon("copy")} Copier le code d'invitation</a>` : ""}<a href="#" data-act="archiver" data-c="${esc(c.id)}" data-on="1">${icon("archive")} Archiver</a>`}</div>` : ""}</div>` : "";
  return `<article class="ccard${archivee ? " archived" : ""}" style="--bb:var(${k.b})">
    <div style="position:relative">
      <a class="banner" href="#/classe/${esc(c.id)}"><span class="sym">${esc(c.symbole)}</span><h2>${esc(c.nom)}</h2><p>${esc(c.section)}</p><span class="teacher">${S.prof ? (S.nbEleves[c.id] || 0) + " élève" + ((S.nbEleves[c.id] || 0) > 1 ? "s" : "") : esc(CFG.prof.nom)}</span></a>
      ${avatarP(CFG.prof.nom, "lg ph")}
    </div>
    <div class="body">${body}</div>
    <div class="cfoot">
      ${S.prof ? `<a class="ib" href="#/classe/${esc(c.id)}/notes" title="Notes" aria-label="Notes de ${esc(c.nom)}">${icon("grade")}</a>` : `<a class="ib" href="#/todo" title="Mes travaux" aria-label="Mes travaux">${icon("todo")}</a>`}
      ${c.dossier_onedrive ? `<a class="ib" href="${esc(c.dossier_onedrive)}" target="_blank" rel="noopener" title="Dossier OneDrive du cours" aria-label="Dossier OneDrive de ${esc(c.nom)}">${icon("folder")}</a>` : ""}
      ${menu}
    </div></article>`;
}
function vAccueil(){
  const list = actives();
  if (!list.length) return `<div class="page">${S.prof ? `<div class="emptystate"><b>Aucun cours actif.</b><span>Crée ton premier cours avec le bouton + en haut de la page.</span><div><button class="btn" data-act="newclass">${icon("plus")} Créer un cours</button></div></div>` :
    `<div class="emptystate"><b>Tu n'es inscrit dans aucun cours pour l'instant.</b><span>Demande le code du cours à ton professeur, puis rejoins-le.</span><div><button class="btn" data-act="join">${icon("plus")} Rejoindre un cours</button></div></div>`}${pageFoot()}</div>`;
  return `<div class="page wide"><div class="homehead"><h1>Cours</h1><button class="btn ghost sm" data-act="${S.prof ? "newclass" : "join"}">${icon("plus")} ${S.prof ? "Créer un cours" : "Rejoindre un cours"}</button></div>
    <div class="cards">${list.map(c => carte(c, false)).join("")}</div>${pageFoot()}</div>`;
}
function vArchives(){
  const list = S.classes.filter(c => c.archive);
  return `<div class="page wide"><div class="homehead"><h1>Cours archivés</h1></div>
    <p class="muted" style="margin:0">Les cours archivés n'apparaissent plus sur l'accueil. Tu peux les restaurer ou les supprimer définitivement.</p>
    ${list.length ? `<div class="cards">${list.map(c => carte(c, true)).join("")}</div>` : `<div class="emptystate"><b>Aucun cours archivé.</b></div>`}${pageFoot()}</div>`;
}
/* ---------- page de cours : onglets ---------- */
function fluxVisible(c){ return S.prof || c.flux_mode !== "masque"; }
function peutPublier(c){ return S.prof || c.flux_mode === "eleves"; }
function peutCommenter(c){ return S.prof || c.flux_mode === "prof" || c.flux_mode === "eleves"; }
function teamsVisible(c){ return c.teams_url && (S.prof || c.teams_visible); }

function classTabs(c, tab){
  const T = []; if (fluxVisible(c)) T.push(["flux", "Flux"]);
  T.push(["travaux", "Travaux et devoirs"], ["personnes", "Personnes"]); if (S.prof) T.push(["notes", "Notes"]);
  return `<div class="tabsbar" style="--c:var(${C(c.couleur).c})"><div class="tabs" role="tablist">${T.map(([k, l]) => `<a role="tab" aria-selected="${tab === k}" href="#/classe/${esc(c.id)}/${k}">${l}</a>`).join("")}</div>
    <div class="tabicons">
      ${teamsVisible(c) ? `<a class="ib" href="${esc(c.teams_url)}" target="_blank" rel="noopener" title="Visio Teams de la classe" aria-label="Visio Teams de la classe">${icon("video")}</a>` : ""}
      <a class="ib" href="#/agenda" title="Agenda" aria-label="Agenda">${icon("cal")}</a>
      ${c.dossier_onedrive ? `<a class="ib" href="${esc(c.dossier_onedrive)}" target="_blank" rel="noopener" title="Dossier OneDrive du cours" aria-label="Dossier OneDrive du cours">${icon("folder")}</a>` : ""}
      ${S.prof ? `<a class="ib" href="#/classe/${esc(c.id)}/parametres" title="Paramètres du cours" aria-label="Paramètres du cours">${icon("gear")}</a>` : ""}
    </div></div>`;
}
function ressources(list){
  if (!list || !list.length) return "";
  return `<div class="att">${list.map(r => r.path
    ? `<a href="#" data-act="openfile" data-bucket="${esc(r.bucket || "documents")}" data-path="${esc(r.path)}"><span class="k">${esc(r.type || "fichier")}</span>${esc(r.label || r.path)}</a>`
    : `<a href="${esc(r.url)}" target="_blank" rel="noopener"><span class="k">${esc(r.type || "lien")}</span>${esc(r.label || r.url)}</a>`).join("")}</div>`;
}
const banniere = (c) => `<div class="banner bigbanner" style="--bb:var(${C(c.couleur).b})"><span class="sym">${esc(c.symbole)}</span>${S.prof ? `<a class="btn ghost sm custom" href="#/classe/${esc(c.id)}/parametres">${icon("edit")} Personnaliser</a>` : ""}<h1>${esc(c.nom)}</h1><span>${esc(c.section)}</span>${c.description ? `<p class="bdesc">${esc(c.description)}</p>` : ""}</div>`;

function asideClasse(c){
  const up = S.devoirs.filter(d => d.classe_id === c.id && d.date_limite && ouvert(d) && !d.brouillon && (S.prof || !renduDe(d, moi()))).slice(0, 3);
  return `<aside class="caside">
    ${teamsVisible(c) ? `<div class="box"><div class="boxhead"><h3>${icon("video")} Visio Teams</h3></div><a class="btn ghost" href="${esc(c.teams_url)}" target="_blank" rel="noopener" style="text-decoration:none">Rejoindre</a>${S.prof ? `<span class="muted" style="font-size:.78rem">${icon("eye")} ${c.teams_visible ? "Visible par les élèves" : "Masqué aux élèves"}</span>` : ""}</div>`
      : S.prof ? `<div class="box"><div class="boxhead"><h3>${icon("video")} Visio Teams</h3></div><a class="linkbtn" href="#/classe/${esc(c.id)}/parametres">Ajouter le lien de la visio</a></div>` : ""}
    ${S.prof ? `<div class="box"><div class="boxhead"><h3>Code du cours</h3><div class="dd kebab"><button class="ib sm" data-act="menu" data-m="code" aria-label="Options du code">${icon("more")}</button>${S.menu === "code" ? `<div class="dd-menu">
        <a href="#" data-act="copycode" data-code="${esc(c.code || "")}">${icon("copy")} Copier le code</a>
        <a href="#" data-act="resetcode" data-c="${esc(c.id)}">${icon("key")} Réinitialiser</a>
        <a href="#" data-act="togglecode" data-c="${esc(c.id)}" data-on="${c.code_actif ? "0" : "1"}">${icon(c.code_actif ? "x" : "check")} ${c.code_actif ? "Désactiver" : "Activer"}</a></div>` : ""}</div></div>
      ${c.code_actif ? `<button class="codebig" data-act="showcode" data-code="${esc(c.code)}" title="Afficher en grand">${esc(c.code)} ${icon("expand")}</button>` : `<span class="muted">Désactivé</span>`}</div>` : ""}
    ${!S.prof && c.moyenne_visible ? `<div class="box"><h3>Ma moyenne</h3><span class="grade">${moyenneEleve(c) == null ? "–" : fmtNote(moyenneEleve(c))}<small>/20</small></span><span class="muted" style="font-size:.78rem">Calculée sur les notes rendues par ton professeur.</span></div>` : ""}
    <div class="box"><h3>À venir</h3>${up.length ? up.map(d => `<span class="muted" style="font-size:.8rem">${dueOf(d).replace("Échéance : ", "")}</span><a href="#/devoir/${d.id}" class="uplink">${esc(d.titre)}</a>`).join("") : `<span class="muted">Aucun devoir à remettre dans les jours qui viennent</span>`}<a class="linkbtn" href="#/todo">Tout afficher</a></div>
    ${(c.liens && c.liens.length) || S.prof ? `<div class="box"><div class="boxhead"><h3>Liens de la classe</h3>${S.prof ? `<button class="ib sm" data-act="editliens" data-c="${esc(c.id)}" aria-label="Modifier les liens" title="Modifier les liens">${icon("edit")}</button>` : ""}</div>
      <div class="classlinks">${(c.liens || []).map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${icon("links")}<span>${esc(l.nom)}</span></a>`).join("")}</div>
      ${S.prof && !(c.liens || []).length ? `<span class="muted" style="font-size:.82rem">Ajoute des liens utiles : manuel, simulateur, Capytale…</span>` : ""}</div>` : ""}
  </aside>`;
}

/* ---------- Flux ---------- */
function vFlux(c, data){
  const items = data.annonces.map(a => ({k:"annonce", date:D(a.cree_le), a}));
  if (c.flux_devoirs) {
    S.devoirs.filter(d => d.classe_id === c.id && !d.brouillon && D(d.publie_le) <= now()).forEach(d => items.push({k:"devoir", date:D(d.publie_le), o:d}));
    data.supports.filter(s => !s.brouillon && D(s.publie_le) <= now()).forEach(s => items.push({k:"support", date:D(s.publie_le), o:s}));
    S.quiz.filter(q => q.classe_id === c.id && !q.brouillon && D(q.publie_le) <= now()).forEach(q => items.push({k:"quiz", date:D(q.publie_le), o:q}));
  }
  items.sort((x, y) => y.date - x.date);
  const A = S.annonce && S.annonce.classe === c.id ? S.annonce : null;
  const composer = !peutPublier(c) ? "" : A ? `<section class="post composer">
      <div class="field"><label>Pour : ${esc(c.nom)} · tous les élèves</label>
      <div class="rte"><div id="anHtml" class="rtebody" contenteditable="true" role="textbox" aria-multiline="true" data-ph="Annoncez quelque chose à la classe">${rich(A.html)}</div>
      <div class="rtebar">${fmtBar()}</div></div></div>
      ${A.ressources.length ? `<ul class="files">${A.ressources.map((x, i) => `<li><span><span class="k mono muted">${esc(x.type)}</span> ${esc(x.label)}</span><button data-act="anrm" data-i="${i}" aria-label="Retirer">✕</button></li>`).join("")}</ul>` : ""}
      ${A.linkMode ? `<div class="linkform"><div class="field"><label for="anLinkUrl">Lien</label><input id="anLinkUrl" type="url" placeholder="https://…"></div><div class="field"><label for="anLinkLabel">Nom affiché <span class="muted">(facultatif)</span></label><input id="anLinkLabel"></div><div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn ghost sm" data-act="anlinkcancel">Annuler</button><button class="btn sm" data-act="anlinkadd">Ajouter</button></div></div>` : ""}
      <div class="composerfoot"><div style="display:flex;gap:4px">
        <button class="ib" data-act="anlink" title="Ajouter un lien OneDrive, YouTube ou site" aria-label="Ajouter un lien">${icon("links")}</button>
        ${S.prof ? `<button class="ib" data-act="anupload" title="Importer un fichier" aria-label="Importer un fichier">${icon("upload")}</button><input type="file" id="anFile" multiple hidden>` : ""}</div>
        <span class="spacer"></span><button class="btn ghost" data-act="ancancel">Annuler</button><button class="btn" data-act="anpost" ${A.busy ? "disabled" : ""}>${A.busy ? "Publication…" : "Publier"}</button></div>
    </section>` : `<button class="post annoncer" data-act="annoncer" data-c="${esc(c.id)}">${avatarP(S.nom)}<span>Annoncez quelque chose à la classe</span></button>`;
  const fluxMasque = S.prof && c.flux_mode === "masque" ? `<div class="notice">${icon("eye")} Le flux est actuellement <b>masqué aux élèves</b>. Tu peux changer ce réglage dans les <a href="#/classe/${esc(c.id)}/parametres">paramètres du cours</a>.</div>` : "";
  return `<div class="page" style="--c:var(${C(c.couleur).c})">${banniere(c)}
    <div class="classgrid">${asideClasse(c)}
      <div class="stream">${fluxMasque}${composer}
        ${items.length ? items.map(it => it.k === "annonce" ? vAnnonce(c, it.a, data) : vNotif(it)).join("") : `<section class="post emptyflux"><div><h3>C'est ici que vous pourrez communiquer avec ${S.prof ? "votre classe" : "ta classe"}</h3><p class="muted">${S.prof ? "Publie des annonces, et les nouveaux devoirs et documents apparaîtront ici." : "Les annonces de ton professeur apparaîtront ici."}</p>${S.prof ? `<a class="btn ghost sm" href="#/classe/${esc(c.id)}/parametres">${icon("gear")} Paramètres du flux</a>` : ""}</div></section>`}
      </div></div>${pageFoot()}</div>`;
}
function vNotif(it){
  const o = it.o, href = it.k === "devoir" ? "#/devoir/" + o.id : it.k === "quiz" ? "#/quiz/" + o.id : "#/classe/" + o.classe_id + "/travaux";
  const lib = it.k === "devoir" ? "un nouveau devoir" : it.k === "quiz" ? "un nouveau questionnaire" : "un nouveau support";
  return `<a class="post notif" href="${href}"><span class="ico">${icon(it.k, "")}</span><span class="tt">${esc(CFG.prof.nom)} a publié ${lib} : ${esc(o.titre)}<small>${fmtQuand(it.date)}</small></span></a>`;
}
function vAnnonce(c, a, data){
  const coms = data.coms.filter(x => x.annonce_id === a.id), mien = S.prof || a.auteur === S.user.id;
  const open = S.open === "an" + a.id || coms.length <= 2;
  const shown = open ? coms : coms.slice(-1);
  return `<section class="post">
    <div class="posthead">${avatarP(a.auteur_nom)}<div style="flex:1;min-width:0"><b>${esc(a.auteur_nom)}</b><small class="muted">${fmtQuand(D(a.cree_le))}</small></div>
      ${mien ? `<div class="dd kebab"><button class="ib sm" data-act="menu" data-m="a${a.id}" aria-label="Options de l'annonce">${icon("more")}</button>${S.menu === "a" + a.id ? `<div class="dd-menu"><a href="#" data-act="supprannonce" data-id="${a.id}" data-c="${esc(c.id)}" style="color:var(--bad)">${icon("trash")} Supprimer</a></div>` : ""}</div>` : ""}</div>
    <div class="richtext">${rich(a.texte)}</div>${ressources(a.ressources)}
    <div class="coms">${coms.length ? `${!open ? `<button class="linkbtn" data-act="opencoms" data-id="${a.id}">${icon("people")} ${coms.length} commentaires sur le cours</button>` : `<span class="muted" style="font-size:.85rem">${icon("people")} ${coms.length} commentaire${coms.length > 1 ? "s" : ""} sur le cours</span>`}` : ""}
      ${shown.map(x => `<div class="com">${avatarP(x.auteur_nom, "sm")}<div style="flex:1;min-width:0"><b>${esc(x.auteur_nom)}</b> <small class="muted">${fmtQuand(D(x.cree_le))}</small><div>${linkify(x.texte)}</div></div>${S.prof || x.auteur === S.user.id ? `<button class="ib sm" data-act="supprcom" data-id="${x.id}" data-c="${esc(c.id)}" aria-label="Supprimer le commentaire" title="Supprimer">${icon("x")}</button>` : ""}</div>`).join("")}
      ${peutCommenter(c) ? `<div class="comform">${avatarP(S.nom, "sm")}<input id="cm-${a.id}" placeholder="Ajouter un commentaire pour le cours…" aria-label="Commentaire pour le cours"><button class="ib" data-act="comment" data-id="${a.id}" data-c="${esc(c.id)}" aria-label="Envoyer">${icon("send")}</button></div>` : ""}
    </div></section>`;
}
const fmtBar = () => [["bold","<b>G</b>","Gras"],["italic","<i>I</i>","Italique"],["underline","<u>S</u>","Souligné"],["insertUnorderedList","•≡","Liste à puces"],["removeFormat","✕","Effacer la mise en forme"]].map(([cmd, l, t]) => `<button class="ib sm" data-act="fmt" data-cmd="${cmd}" title="${t}" aria-label="${t}">${l}</button>`).join("");

/* ---------- Travaux et devoirs ---------- */
function itemsDuTheme(c, data, themeId){
  const items = [];
  data.supports.filter(s => (s.theme_id ?? null) === themeId).forEach(s => items.push({k:"support", id:"s" + s.id, titre:s.titre, date:D(s.publie_le), s}));
  S.devoirs.filter(d => d.classe_id === c.id && (d.theme_id ?? null) === themeId).forEach(d => items.push({k:"devoir", id:"d" + d.id, titre:d.titre, date:D(d.publie_le), d}));
  S.quiz.filter(q => q.classe_id === c.id && (q.theme_id ?? null) === themeId).forEach(q => items.push({k:"quiz", id:"q" + q.id, titre:q.titre, date:D(q.publie_le), q}));
  return items.sort((a, b) => b.date - a.date);
}
function workItem(it){
  const op = S.open === it.id, obj = it.s || it.d || it.q, draft = obj.brouillon, prog = !draft && D(obj.publie_le) > now();
  let right = "", detail = "";
  const cible = obj.eleves ? `<span class="pill">${obj.eleves.length} élève${obj.eleves.length > 1 ? "s" : ""}</span>` : "";
  if (it.k === "support") {
    right = `<span class="dt">Publié le ${fmtShort(it.date)}</span>`;
    detail = `${obj.description ? `<div class="richtext">${rich(obj.description)}</div>` : ""}${ressources(obj.ressources) || (obj.description ? "" : `<span class="muted">Aucun fichier joint.</span>`)}`;
  } else if (it.k === "devoir") {
    const d = obj;
    right = S.prof ? `<span class="dt">${d.date_limite ? dueOf(d).replace("Échéance : ", "") : "Publié le " + fmtShort(it.date)}</span>` : `<span class="dt">${etat(d, moi()).t === "Manquant" ? `<span style="color:var(--bad)">Manquant</span>` : etat(d, moi()).t === "Noté" ? fmtNote(etat(d, moi()).note) + "/" + d.points : d.date_limite ? dueOf(d).replace("Échéance : ", "") : ""}</span>`;
    detail = `<div class="row muted">Publié le ${fmtShort(it.date)} · ${d.mode === "binome" ? "un rendu par binôme" : "individuel"} · ${pts(d)}</div>${d.consigne ? `<div class="richtext">${rich(d.consigne)}</div>` : ""}${ressources(d.ressources)}
      <div class="row">${S.prof ? statsDevoir(d) : `<span class="pill ${etat(d, moi()).k}">${etat(d, moi()).t}</span>`}<span style="flex:1"></span><a class="btn ghost sm" href="#/devoir/${d.id}">${S.prof ? "Voir le devoir" : "Afficher le devoir"}</a></div>`;
  } else {
    const q = obj, r = resultatDe(q, S.user.id);
    right = `<span class="dt">${!S.prof && r ? fmtNote(noteQuiz(q, r)) + "/" + q.points : q.date_limite ? dueTxt(D(q.date_limite)).replace("Échéance : ", "") : q.mode === "note" ? "Questionnaire noté" : "Entraînement"}</span>`;
    detail = `<div class="row muted">${(q.questions || []).length} questions · ${q.mode === "note" ? "noté sur " + q.points + ", une seule tentative" : "entraînement, recommençable"}</div>${q.consigne ? `<div class="richtext">${rich(q.consigne)}</div>` : ""}<div class="row"><span style="flex:1"></span><a class="btn ghost sm" href="#/quiz/${q.id}">${S.prof ? "Voir les résultats" : r ? "Voir mon résultat" : "Commencer"}</a></div>`;
  }
  if (S.prof && draft) right = `<span class="dt draft">Brouillon</span>`;
  else if (S.prof && prog) right = `<span class="dt draft">Programmé · ${fmtShort(D(obj.publie_le))} ${fmtT(D(obj.publie_le))}</span>`;
  const typ = it.k === "support" ? "documentation" : it.k === "quiz" ? "questionnaire" : "devoir", rid = it.id.slice(1);
  const menu = S.prof ? `<div class="dd kebab"><button class="ib" data-act="menu" data-m="i${it.id}" aria-label="Options">${icon("more")}</button>${S.menu === "i" + it.id ? `<div class="dd-menu">
      <a href="#/editer/${typ}/${rid}">${icon("edit")} Modifier</a>
      ${draft || prog ? `<a href="#" data-act="publier" data-k="${it.k}" data-id="${rid}">${icon("check")} Publier maintenant</a>` : ""}
      <a href="#" data-act="reutiliser" data-k="${it.k}" data-id="${rid}">${icon("reuse")} Réutiliser dans un autre cours</a>
      <a href="#" data-act="suppr" data-k="${it.k}" data-id="${rid}" data-titre="${esc(it.titre)}" style="color:var(--bad)">${icon("trash")} Supprimer</a></div>` : ""}</div>` : "";
  return `<div class="work${draft ? " isdraft" : ""}"><div class="workrow"><button data-act="toggle" data-id="${it.id}" aria-expanded="${op}"><span class="ico ${it.k === "support" ? "pale" : ""}">${icon(it.k, "")}</span><span class="tt">${esc(it.titre)}</span>${S.prof ? cible : ""}${right}</button>${menu}</div>${op ? `<div class="workd">${detail}</div>` : ""}</div>`;
}
function statsDevoir(d){
  const el = elevesDuDevoir(d, inscritsDe(d.classe_id)), n = el.filter(e => renduDe(d, e.email)).length;
  return `<span class="stats" style="gap:22px"><div><b>${n}</b><small>Rendus</small></div><div><b>${el.length - n}</b><small>${ouvert(d) ? "Attribués" : "Manquants"}</small></div><div><b>${aCorriger(d)}</b><small>À noter</small></div></span>`;
}
function vTravaux(c, data){
  const groupes = data.themes.map((t, i) => ({t, i, titre:t.titre, items:itemsDuTheme(c, data, t.id)}));
  const sans = itemsDuTheme(c, data, null); if (sans.length) groupes.unshift({t:null, titre:"Aucun thème", items:sans});
  const visibles = groupes.filter(g => (S.prof || g.items.length) && (!S.filtreTheme || (g.t ? String(g.t.id) : "none") === S.filtreTheme));
  const themeMenu = g => !S.prof || !g.t ? "" : `<div class="dd kebab"><button class="ib" data-act="menu" data-m="t${g.t.id}" aria-label="Options du thème">${icon("more")}</button>${S.menu === "t" + g.t.id ? `<div class="dd-menu">
    <a href="#" data-act="renomtheme" data-id="${g.t.id}" data-titre="${esc(g.t.titre)}">${icon("edit")} Renommer</a>
    ${g.i > 0 ? `<a href="#" data-act="movetheme" data-id="${g.t.id}" data-dir="-1" data-c="${esc(c.id)}">${icon("up")} Monter</a>` : ""}
    ${g.i < data.themes.length - 1 ? `<a href="#" data-act="movetheme" data-id="${g.t.id}" data-dir="1" data-c="${esc(c.id)}">${icon("down")} Descendre</a>` : ""}
    <a href="#" data-act="supprtheme" data-id="${g.t.id}" data-titre="${esc(g.t.titre)}" data-c="${esc(c.id)}" style="color:var(--bad)">${icon("trash")} Supprimer</a></div>` : ""}</div>`;
  const gid = g => g.t ? String(g.t.id) : "none";
  const head = `<div class="travhead">
    ${S.prof ? `<div class="dd"><button class="btn" data-act="menu" data-m="create">${icon("plus")} Créer</button>${S.menu === "create" ? `<div class="dd-menu" style="left:0;right:auto">
      <a href="#/editer/devoir/new/${esc(c.id)}">${icon("devoir")} Devoir</a>
      <a href="#/editer/questionnaire/new/${esc(c.id)}">${icon("quiz")} Questionnaire</a>
      <a href="#/editer/documentation/new/${esc(c.id)}">${icon("support")} Documentation</a>
      <a href="#" data-act="reutiliserdepuis" data-c="${esc(c.id)}">${icon("reuse")} Réutiliser un post</a>
      <hr><a href="#" data-act="newtheme" data-c="${esc(c.id)}">${icon("theme")} Thème</a></div>` : ""}</div>` : ""}
    ${groupes.length > 1 ? `<div class="field filt"><label for="filtreTheme">Filtre thématique</label><select id="filtreTheme" data-f="filtre"><option value="">Tous les thèmes</option>${groupes.map(g => `<option value="${gid(g)}" ${S.filtreTheme === gid(g) ? "selected" : ""}>${esc(g.titre)}</option>`).join("")}</select></div>` : ""}
    <span class="spacer"></span>${groupes.length ? `<button class="linkbtn" data-act="toutreduire">${S.reduits.size ? "Tout développer" : "Tout réduire"}</button>` : ""}</div>`;
  return `<div class="page" style="--c:var(${C(c.couleur).c})">${head}
    ${visibles.length ? visibles.map(g => `<section class="theme"><div class="themehead"><h2>${esc(g.titre)}</h2><button class="ib sm" data-act="reduire" data-id="${gid(g)}" aria-label="${S.reduits.has(gid(g)) ? "Développer" : "Réduire"}">${icon(S.reduits.has(gid(g)) ? "down" : "up")}</button>${themeMenu(g)}</div>
      ${S.reduits.has(gid(g)) ? "" : g.items.length ? g.items.map(workItem).join("") : `<p class="empty">${S.prof ? "Aucun élément. Utilise « Créer » pour ajouter un devoir, un questionnaire ou une documentation." : "Rien pour l'instant."}</p>`}</section>`).join("")
      : `<div class="emptystate"><b>${S.prof ? "Crée ton premier élément" : "Aucun travail pour l'instant."}</b><span>${S.prof ? "Crée un thème (par exemple « Chapitre 1 »), puis ajoute des devoirs, des questionnaires et des documentations." : "Ton professeur n'a encore rien publié dans ce cours."}</span></div>`}
    ${pageFoot()}</div>`;
}

/* ---------- Personnes ---------- */
function vPersonnes(c, data){
  const el = data.eleves, selN = el.filter(e => S.pick.has(e.email)).length;
  return `<div class="page" style="max-width:820px;--c:var(${C(c.couleur).c})">
    <section class="people"><h2>Enseignants</h2><div class="person">${`<div class="avatar">${initials(CFG.prof.nom)}</div>`}<span>${esc(CFG.prof.nom)}</span></div></section>
    <section class="people"><h2>Élèves <small>${el.length} élève${el.length > 1 ? "s" : ""}${S.prof && c.code ? ` <button class="ib sm" data-act="showcode" data-code="${esc(c.code)}" title="Inviter des élèves" aria-label="Inviter des élèves">${icon("people")}</button>` : ""}</small></h2>
    ${S.prof && el.length ? `<div class="person" style="gap:12px;flex-wrap:wrap"><input type="checkbox" data-act="pickall" data-c="${esc(c.id)}" ${selN === el.length ? "checked" : ""} aria-label="Tout sélectionner"><div class="dd"><button class="btn ghost sm" data-act="menu" data-m="actions" ${selN ? "" : "disabled"}>Actions ▾</button>${S.menu === "actions" ? `<div class="dd-menu" style="left:0;right:auto"><a href="#" data-act="compose">${icon("mail")} Envoyer un e-mail</a><a href="#" data-act="retirersel" data-c="${esc(c.id)}" style="color:var(--bad)">${icon("trash")} Retirer de la classe</a></div>` : ""}</div><span class="muted" style="font-size:.85rem">${selN ? selN + " sélectionné" + (selN > 1 ? "s" : "") : ""}</span></div>` : ""}
    ${S.prof && S.compose ? composeBox(el.filter(e => S.pick.has(e.email))) : ""}
    ${el.length ? el.map(e => `<div class="person">${S.prof ? `<input type="checkbox" data-act="pick" data-e="${esc(e.email)}" ${S.pick.has(e.email) ? "checked" : ""} aria-label="Sélectionner ${esc(e.nom)}">` : ""}${avatarP(e.nom)}<span style="flex:1;min-width:0">${esc(e.nom)}${S.prof ? `<small class="muted" style="display:block;overflow-wrap:anywhere">${esc(e.email)}</small>` : ""}</span>${S.prof ? `<div class="dd kebab"><button class="ib sm" data-act="menu" data-m="p${esc(e.email)}" aria-label="Options">${icon("more")}</button>${S.menu === "p" + e.email ? `<div class="dd-menu"><a href="#" data-act="maileleve" data-e="${esc(e.email)}">${icon("mail")} Envoyer un e-mail</a><a href="#" data-act="retirer" data-e="${esc(e.email)}" data-n="${esc(e.nom)}" data-c="${esc(c.id)}" style="color:var(--bad)">${icon("trash")} Retirer de la classe</a></div>` : ""}</div>` : ""}</div>`).join("")
      : `<p class="empty">${S.prof ? "Aucun élève inscrit. Donne le code du cours à tes élèves : ils le saisiront avec le bouton + en haut de la page." : "Aucun élève."}</p>`}
    </section>${pageFoot()}</div>`;
}
function composeBox(list){
  return `<div class="box" style="margin:12px 0"><div class="boxhead"><h3>Nouvel e-mail</h3><button class="ib" data-act="closecompose" aria-label="Fermer">${icon("x")}</button></div>
    <div class="field"><label>À (${list.length})</label><div class="att">${list.map(e => `<span class="f">${esc(e.nom)}</span>`).join("")}</div></div>
    <div class="field"><label for="cSub">Objet</label><input id="cSub" value="${esc(S.cSub)}"></div>
    <div class="field"><label for="cBody">Message</label><textarea id="cBody">${esc(S.cBody)}</textarea></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><a class="btn" id="olk" href="${esc(outlookLink(list.map(e => e.email), S.cSub, S.cBody))}" target="_blank" rel="noopener">${icon("mail")} Ouvrir dans Outlook</a><button class="btn ghost" data-act="copymails">Copier les adresses</button></div>
    <p class="muted" style="margin:0;font-size:.8rem">Outlook s'ouvre avec les destinataires, l'objet et le message remplis : tu vérifies et tu cliques sur Envoyer.</p></div>`;
}
const outlookLink = (mails, sub, body) => "https://outlook.office.com/mail/deeplink/compose?to=" + encodeURIComponent(mails.join(";")) + "&subject=" + encodeURIComponent(sub || "") + "&body=" + encodeURIComponent(body || "");

/* ---------- Notes (carnet de notes) ---------- */
function vNotes(c, data){
  const cols = [
    ...S.devoirs.filter(d => d.classe_id === c.id && d.points != null && !d.brouillon).map(d => ({k:"d", o:d, date:D(d.publie_le)})),
    ...S.quiz.filter(q => q.classe_id === c.id && q.mode === "note" && !q.brouillon).map(q => ({k:"q", o:q, date:D(q.publie_le)}))
  ].sort((a, b) => b.date - a.date);
  const el = data.eleves;
  if (!cols.length || !el.length) return `<div class="page">${`<div class="emptystate"><b>${!el.length ? "Aucun élève dans ce cours." : "Aucun travail noté pour l'instant."}</b><span>${!el.length ? "Les élèves apparaîtront ici dès qu'ils auront rejoint le cours avec le code." : "Les devoirs notés et les questionnaires notés apparaîtront ici en colonnes."}</span></div>`}${pageFoot()}</div>`;
  const uidDe = email => Object.keys(S.profils).find(id => S.profils[id] === email);
  const cell = (col, e) => {
    if (col.k === "q") { const uid = uidDe(e.email), r = uid && resultatDe(col.o, uid); return r ? `<td class="cell"><span class="nv">${fmtNote(noteQuiz(col.o, r))}</span><span class="muted">/${col.o.points}</span></td>` : `<td class="cell"><span class="s muted">Non fait</span></td>`; }
    const d = col.o; if (d.eleves && !d.eleves.includes(e.email)) return `<td class="cell na"></td>`;
    const r = renduDe(d, e.email), cr = correctionDe(r);
    if (!r) return `<td class="cell">${ouvert(d) ? "" : `<span class="s" style="color:var(--bad)">Manquant</span>`}</td>`;
    return `<td class="cell"><input class="gin" data-act="note" data-rendu="${r.id}" data-max="${d.points}" value="${cr && cr.note != null ? fmtNote(cr.note) : ""}" placeholder="__" aria-label="Note de ${esc(e.nom)}"><span class="muted">/${d.points}</span><span class="s ${cr && cr.publiee ? "" : "draftnote"}">${cr && cr.note != null ? (cr.publiee ? "" : "Brouillon") : "Rendu"}</span></td>`;
  };
  const moyEleve = e => { const v = cols.map(col => { if (col.k === "q") { const uid = uidDe(e.email), r = uid && resultatDe(col.o, uid); return r ? noteQuiz(col.o, r) / col.o.points * 20 : null; } const cr = correctionDe(renduDe(col.o, e.email)); return cr && cr.note != null ? cr.note / col.o.points * 20 : null; }).filter(x => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
  const moyCol = col => { const v = el.map(e => { if (col.k === "q") { const uid = uidDe(e.email), r = uid && resultatDe(col.o, uid); return r ? noteQuiz(col.o, r) : null; } const cr = correctionDe(renduDe(col.o, e.email)); return cr && cr.note != null ? Number(cr.note) : null; }).filter(x => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
  return `<div class="page wide" style="--c:var(${C(c.couleur).c})"><div class="tablewrap"><table class="gradebook">
    <thead><tr><th class="first"><span class="muted">Élèves (${el.length})</span></th>${cols.map(col => `<th><small class="muted">${col.o.date_limite ? fmtShort(D(col.o.date_limite)) : "Aucune date limite"}</small><a href="${col.k === "d" ? "#/devoir/" + col.o.id : "#/quiz/" + col.o.id}">${esc(col.o.titre)}</a><small class="muted">sur ${col.o.points}</small>
      ${col.k === "d" ? `<div class="dd kebab"><button class="ib sm" data-act="menu" data-m="g${col.o.id}" aria-label="Options de la colonne">${icon("more")}</button>${S.menu === "g" + col.o.id ? `<div class="dd-menu"><a href="#" data-act="rendretout" data-d="${col.o.id}">${icon("send")} Rendre toutes les notes</a><a href="#/devoir/${col.o.id}">${icon("devoir")} Ouvrir le devoir</a></div>` : ""}</div>` : ""}</th>`).join("")}<th>Moyenne<small class="muted">sur 20</small></th></tr></thead>
    <tbody><tr class="avg"><td class="first">${icon("people")} Moyenne de la classe</td>${cols.map(col => `<td class="cell">${fmtNote(moyCol(col) == null ? null : Math.round(moyCol(col) * 10) / 10)}</td>`).join("")}<td class="cell"></td></tr>
    ${el.map(e => `<tr><td class="first"><span class="who2">${avatarP(e.nom, "sm")}${esc(e.nom)}</span></td>${cols.map(col => cell(col, e)).join("")}<td class="cell"><b>${fmtNote(moyEleve(e) == null ? null : Math.round(moyEleve(e) * 10) / 10)}</b></td></tr>`).join("")}
    </tbody></table></div>
    <p class="muted" style="margin:0;font-size:.85rem">Saisis une note directement dans une case : elle reste en <b>brouillon</b> (invisible pour l'élève) jusqu'à ce que tu cliques sur ⋮ → <b>Rendre toutes les notes</b> en haut de la colonne, ou sur « Rendre » dans le devoir.</p>${pageFoot()}</div>`;
}

function vClasse(r, data){
  const c = cls(r.a); if (!c) return `<div class="page"><div class="emptystate"><b>Cours introuvable.</b><a href="#/">Retour à l'accueil</a></div></div>`;
  let tab = ["flux", "travaux", "personnes", "notes"].includes(r.t) ? r.t : (fluxVisible(c) ? "flux" : "travaux");
  if (tab === "flux" && !fluxVisible(c)) tab = "travaux";
  if (tab === "notes" && !S.prof) tab = "travaux";
  const inner = tab === "flux" ? vFlux(c, data) : tab === "personnes" ? vPersonnes(c, data) : tab === "notes" ? vNotes(c, data) : vTravaux(c, data);
  return classTabs(c, tab) + inner;
}
/* ---------- commentaires privés ---------- */
const cpKey = (did, email) => did + "|" + email;
async function chargerCP(did, email, force){
  const k = cpKey(did, email); S.cp = S.cp || {};
  if (S.cp[k] && !force) return S.cp[k];
  const { data, error } = await sb.from("commentaires_prives").select("*").eq("devoir_id", did).eq("eleve_email", email).order("cree_le");
  return S.cp[k] = error ? [] : data;
}
function vCP(did, email){
  const list = (S.cp || {})[cpKey(did, email)] || [];
  return `<div class="yourwork"><header><h2 style="font-size:1rem">${icon("comment")} Commentaires privés</h2></header>
    ${list.map(x => `<div class="com">${avatarP(x.auteur_nom, "sm")}<div style="flex:1;min-width:0"><b>${esc(x.auteur_nom)}</b> <small class="muted">${fmtQuand(D(x.cree_le))}</small><div>${linkify(x.texte)}</div></div></div>`).join("") || `<span class="muted" style="font-size:.85rem">${S.prof ? "Aucun échange avec cet élève." : "Pose une question à ton professeur : seul lui verra ce message."}</span>`}
    <div class="comform"><input id="cpIn" placeholder="${S.prof ? "Ajouter un commentaire privé…" : "Ajouter un commentaire privé…"}" aria-label="Commentaire privé"><button class="ib" data-act="cpsend" data-d="${did}" data-e="${esc(email)}" aria-label="Envoyer">${icon("send")}</button></div></div>`;
}

/* ---------- devoir côté élève ---------- */
function vDevoir(r){
  const d = S.devoirs.find(x => String(x.id) === r.a);
  if (!d) return `<div class="page"><div class="emptystate"><b>Devoir introuvable.</b><a href="#/">Retour à l'accueil</a></div></div>`;
  const c = cls(d.classe_id), k = C(c && c.couleur);
  if (S.prof) return vDevoirProf(d, c);
  const e = etat(d, moi()), rd = e.r, open = ouvert(d);
  let work;
  if (rd) {
    work = `<ul class="files">${(rd.fichiers || []).map(f => `<li><a href="#" data-act="openfile" data-bucket="rendus" data-path="${esc(f.chemin)}">${icon("file")} ${esc(f.nom)}</a></li>`).join("")}${rd.lien ? `<li><a href="${esc(rd.lien)}" target="_blank" rel="noopener">${icon("links")} ${esc(rd.lien)}</a></li>` : ""}</ul>
      ${rd.binome_email ? `<p style="margin:0;font-size:.85rem">Rendu en binôme avec <b>${esc(nomDe(c.id, rd.auteur_email === moi() ? rd.binome_email : rd.auteur_email))}</b></p>` : ""}
      <p class="muted" style="margin:0;font-size:.8rem">Rendu le ${fmtShort(D(rd.rendu_le))} à ${fmtT(D(rd.rendu_le))}</p>
      ${e.t === "Noté" ? `<div class="grade">${fmtNote(e.note)}<small>/${d.points}</small></div>` : ""}
      ${e.t !== "Noté" && open && rd.auteur === S.user.id ? `<button class="btn ghost" data-act="unsubmit" data-id="${rd.id}">Annuler l'envoi</button>` : ""}`;
  } else if (!open) {
    work = `<p style="margin:0" class="muted">La date limite est passée : le dépôt est fermé. Écris un commentaire privé à ton professeur si besoin.</p>`;
  } else {
    const cam = (S.cache[c.id] ? S.cache[c.id].eleves : []).filter(x => x.email !== moi());
    work = `${d.mode === "binome" ? `<div class="field"><label for="partenaire">Mon binôme</label><select id="partenaire"><option value="">Choisir…</option>${cam.map(x => `<option value="${esc(x.email)}" ${S.partenaire === x.email ? "selected" : ""}>${esc(x.nom)}</option>`).join("")}</select></div>` : ""}
      ${S.files.length ? `<ul class="files">${S.files.map((f, i) => `<li><span>${esc(f.name)}</span><span><span class="mono muted">${tailleTxt(f.size)}</span> <button data-act="rmfile" data-i="${i}" aria-label="Retirer ${esc(f.name)}">✕</button></span></li>`).join("")}</ul>` : ""}
      ${S.lienOpen ? `<div class="field"><label for="lien">Lien (OneDrive, vidéo…)</label><input id="lien" type="url" placeholder="https://…" value="${esc(S.lien)}"></div>` : ""}
      <div class="dd"><button class="btn ghost" data-act="menu" data-m="ajouter" style="width:100%">${icon("plus")} Ajouter ou créer</button>${S.menu === "ajouter" ? `<div class="dd-menu" style="left:0;right:auto;width:100%"><a href="#" data-act="pickfile">${icon("upload")} Fichier</a><a href="#" data-act="lienopen">${icon("links")} Lien</a></div>` : ""}</div>
      <input type="file" id="fileIn" multiple hidden>
      <div id="depErr" class="err" hidden></div>
      <button class="btn" data-act="submit" data-id="${d.id}" ${S.sending ? "disabled" : ""}>${S.sending ? "Envoi en cours…" : (S.files.length || S.lien ? "Rendre" : "Marquer comme terminé")}</button>
      <p class="muted" style="margin:0;font-size:.78rem">50 Mo maximum par fichier${d.formats ? " · " + esc(d.formats) : ""}</p>`;
  }
  return `<div class="page wide" style="--c:var(${k.c})"><div class="dv">
    <div style="display:grid;gap:16px;min-width:0">
      <div class="dvhead"><span class="ico">${icon("devoir", "")}</span><div style="flex:1;min-width:0"><h1>${esc(d.titre)}</h1>
        <div class="muted" style="font-size:.88rem;margin-top:4px">${esc(CFG.prof.nom)} · ${fmtShort(D(d.publie_le))}</div>
        <div class="dvmeta"><b>${pts(d)}</b><span>${dueOf(d)}</span></div></div></div>
      <div class="dvbody">${d.consigne ? `<div class="richtext">${rich(d.consigne)}</div>` : ""}
        <p class="muted" style="margin:0;font-size:.85rem">${d.mode === "binome" ? "Un seul rendu par binôme : la note s'applique aux deux élèves." : "Travail individuel."}</p>${ressources(d.ressources)}</div>
    </div>
    <aside style="display:grid;gap:16px;align-content:start">
      <div class="yourwork"><header><h2>Votre travail</h2><span class="pill ${e.k}">${e.t}</span></header>${work}</div>
      ${vCP(d.id, moi())}
    </aside></div>${pageFoot()}</div>`;
}
const tailleTxt = b => b > 1e6 ? (b / 1e6).toFixed(1).replace(".", ",") + " Mo" : Math.max(1, Math.round(b / 1e3)) + " Ko";
const safeName = n => n.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9._-]+/g, "_").slice(-80);
const nomDe = (cid, email) => ((inscritsDe(cid).find(x => x.email === email) || {}).nom) || nomDepuisEmail(email);

async function rendreDevoir(d){
  const err = document.getElementById("depErr"), fail = m => { S.sending = false; render().then(() => { const x = document.getElementById("depErr"); if (x) { x.hidden = false; x.textContent = m; } }); };
  if (!ouvert(d)) return fail("La date limite est passée.");
  if (d.mode === "binome" && !S.partenaire) return fail("Choisis ton binôme avant de rendre.");
  if (S.lien && !/^https:\/\//.test(S.lien)) return fail("Le lien doit commencer par https://");
  S.sending = true; render();
  const fichiers = [];
  for (const f of S.files) {
    const chemin = d.id + "/" + S.user.id + "/" + Date.now() + "-" + safeName(f.name);
    const { error } = await sb.storage.from("rendus").upload(chemin, f);
    if (error) { if (fichiers.length) await sb.storage.from("rendus").remove(fichiers.map(x => x.chemin)); return fail("Envoi de « " + f.name + " » impossible : " + error.message); }
    fichiers.push({ chemin, nom: f.name, taille: f.size });
  }
  const { error } = await sb.from("rendus").insert({ devoir_id: d.id, auteur: S.user.id, auteur_email: moi(), binome_email: d.mode === "binome" ? S.partenaire : null, fichiers, lien: S.lien || null });
  if (error) { if (fichiers.length) await sb.storage.from("rendus").remove(fichiers.map(x => x.chemin)); return fail(/row-level|policy/i.test(error.message) ? "Rendu impossible : le dépôt est fermé, ou ton binôme a déjà rendu ce devoir." : "Rendu impossible : " + error.message); }
  S.files = []; S.lien = ""; S.lienOpen = false; S.partenaire = ""; S.sending = false;
  await rafraichir(); render(); toast("Devoir rendu");
}

/* ---------- devoir côté professeur ---------- */
function vDevoirProf(d, c){
  const k = C(c && c.couleur), ptab = S.ptab || "travaux";
  const el = elevesDuDevoir(d, (S.cache[c.id] || {eleves:[]}).eleves);
  const sel = S.sel && el.some(e => e.email === S.sel) ? S.sel : null;
  const tabs = `<div class="tabsbar" style="--c:var(${k.c})"><div class="tabs" role="tablist"><button role="tab" aria-selected="${ptab === "instructions"}" data-act="ptab" data-t="instructions">Instructions</button><button role="tab" aria-selected="${ptab === "travaux"}" data-act="ptab" data-t="travaux">Travaux des élèves</button></div>
    <div class="tabicons"><a class="ib" href="#/editer/devoir/${d.id}" title="Modifier le devoir" aria-label="Modifier le devoir">${icon("edit")}</a></div></div>`;
  if (ptab === "instructions") {
    return tabs + `<div class="page wide" style="--c:var(${k.c})"><div class="dvhead"><span class="ico">${icon("devoir", "")}</span><div style="flex:1;min-width:0"><h1>${esc(d.titre)}</h1>
      <div class="muted" style="font-size:.88rem;margin-top:4px">${esc(CFG.prof.nom)} · ${fmtShort(D(d.publie_le))}${d.brouillon ? " · <i>Brouillon</i>" : ""}${d.eleves ? " · attribué à " + d.eleves.length + " élève" + (d.eleves.length > 1 ? "s" : "") : ""}</div>
      <div class="dvmeta"><b>${pts(d)}</b><span>${dueOf(d)}</span></div></div></div>
      <div class="dvbody">${d.consigne ? `<div class="richtext">${rich(d.consigne)}</div>` : ""}<p class="muted" style="margin:0;font-size:.85rem">${d.mode === "binome" ? "Un rendu par binôme." : "Individuel."}${d.formats ? " Formats : " + esc(d.formats) + "." : ""}</p>${ressources(d.ressources)}</div>${pageFoot()}</div>`;
  }
  const rendusE = el.filter(e => renduDe(d, e.email)), autres = el.filter(e => !renduDe(d, e.email));
  const noteDe = e => { const cr = correctionDe(renduDe(d, e.email)); return cr && cr.note != null ? fmtNote(cr.note) : "__"; };
  const row = e => { const s = etat(d, e.email), cr = correctionDe(renduDe(d, e.email)); return `<button class="st" data-act="sel" data-n="${esc(e.email)}" aria-current="${sel === e.email}">${avatarP(e.nom, "sm")}<span class="nm">${esc(e.nom)}<small style="color:var(--${s.k === "bad" ? "bad" : s.k === "info" ? "accent" : "muted"})">${cr && cr.note != null && !cr.publiee ? "Brouillon" : s.t}</small></span>${d.points != null ? `<span class="nt">${noteDe(e)}<span class="muted">/${d.points}</span></span>` : ""}</button>`; };
  let detail;
  if (!sel) {
    detail = `<h2 style="font-size:1.3rem">${esc(d.titre)}</h2>${statsDevoir(d)}
      <p class="muted" style="margin:0">${d.date_limite ? (ouvert(d) ? "Dépôt ouvert jusqu'au " + fmtD(D(d.date_limite)) + " à " + fmtT(D(d.date_limite)) + "." : "Dépôt fermé depuis le " + fmtD(D(d.date_limite)) + ".") : "Aucune date limite."}</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap">${d.points != null && aCorriger(d) ? `<button class="btn" data-act="rendretout" data-d="${d.id}">${icon("send")} Rendre toutes les notes saisies</button>` : ""}
      ${autres.length ? `<button class="btn ghost" data-act="mailmissing" data-d="${d.id}">${icon("mail")} Écrire aux ${autres.length} élève${autres.length > 1 ? "s" : ""} qui n'${autres.length > 1 ? "ont" : "a"} pas rendu</button>` : ""}</div>
      ${S.compose ? composeBox(el.filter(e => S.pick.has(e.email))) : ""}
      <p style="margin:0">Choisis un élève dans la liste pour ouvrir son travail et le noter.</p>`;
  } else {
    const e = el.find(x => x.email === sel), rd = renduDe(d, sel), cr = correctionDe(rd);
    detail = `<div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center"><h2 style="font-size:1.35rem">${esc(e.nom)}${rd && rd.binome_email ? ` <span class="muted" style="font-size:.95rem">avec ${esc(nomDe(c.id, rd.auteur_email === sel ? rd.binome_email : rd.auteur_email))}</span>` : ""}</h2><span class="pill ${etat(d, sel).k}">${etat(d, sel).t}</span></div>
      ${rd ? `<p class="muted" style="margin:0;font-size:.85rem">Rendu le ${fmtD(D(rd.rendu_le))} à ${fmtT(D(rd.rendu_le))}</p>
        <div class="att">${(rd.fichiers || []).map(f => `<a href="#" data-act="openfile" data-bucket="rendus" data-path="${esc(f.chemin)}"><span class="k">${esc((f.nom.split(".").pop() || "").slice(0, 5))}</span>${esc(f.nom)}</a>`).join("")}${rd.lien ? `<a href="${esc(rd.lien)}" target="_blank" rel="noopener"><span class="k">lien</span>${esc(rd.lien.replace(/^https?:\/\//, "").slice(0, 40))}</a>` : ""}${!(rd.fichiers || []).length && !rd.lien ? `<span class="muted">Marqué comme terminé, sans fichier joint.</span>` : ""}</div>
        ${d.points != null ? `<div class="gradeline"><label for="note">Note</label><input id="note" type="number" min="0" max="${d.points}" step="0.25" inputmode="decimal" value="${cr && cr.note != null ? cr.note : ""}"><span class="muted">/${d.points}</span></div>` : ""}
        <div id="noteErr" class="err" hidden></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">${d.points != null ? `<button class="btn ghost" data-act="savenote" data-id="${rd.id}" data-pub="0">Enregistrer le brouillon</button>` : ""}<button class="btn" data-act="savenote" data-id="${rd.id}" data-pub="1">${cr && cr.publiee ? "Mettre à jour" : "Rendre"}</button></div>
        <p class="muted" style="margin:0;font-size:.8rem">${rd.binome_email ? "La note s'affiche pour les deux élèves du binôme." : "Seul l'élève voit sa note, une fois rendue."}</p>`
      : `<p class="muted" style="margin:0">${ouvert(d) ? "Cet élève n'a pas encore rendu son travail." : "Cet élève n'a rien rendu avant la date limite."}</p>`}
      ${vCP(d.id, sel)}`;
  }
  return tabs + `<div class="page wide" style="--c:var(${k.c})">
    <div class="sw"><div class="list"><button class="st" data-act="sel" data-n="" aria-current="${!sel}"><span class="nm"><b>Tous les élèves</b></span></button>
      <h4>Rendus (${rendusE.length})</h4>${rendusE.map(row).join("") || `<p class="empty" style="padding:4px 16px">Aucun</p>`}
      <h4>${ouvert(d) ? "Attribués" : "Manquants"} (${autres.length})</h4>${autres.map(row).join("") || `<p class="empty" style="padding:4px 16px">Aucun</p>`}</div>
    <div class="detail">${detail}</div></div>${pageFoot()}</div>`;
}

/* ---------- à faire / à corriger ---------- */
function vTodo(){
  if (S.prof) {
    const parClasse = actives().map(c => ({c, ds:S.devoirs.filter(d => d.classe_id === c.id && !d.brouillon).slice().reverse()})).filter(x => x.ds.length);
    return `<div class="page"><h1 style="font-size:1.6rem">À corriger</h1>${parClasse.length ? `<div class="todo">${parClasse.map(({c, ds}) => `<section class="group" style="--c:var(${C(c.couleur).c})"><header><span style="color:var(--c)">${esc(c.nom)}</span><span class="muted mono">${ds.reduce((a, d) => a + aCorriger(d), 0)} à corriger</span></header>
      ${ds.map(d => `<div class="work"><a class="workrow" href="#/devoir/${d.id}" style="padding:12px 18px;gap:16px"><span class="ico">${icon("devoir", "")}</span><span class="tt">${esc(d.titre)}<br><small class="muted" style="font-weight:400">${dueOf(d)}</small></span>${statsDevoir(d)}</a></div>`).join("")}</section>`).join("")}</div>` : `<div class="emptystate"><b>Aucun devoir pour l'instant.</b></div>`}${pageFoot()}</div>`;
  }
  const q = S.quiz.filter(x => x.mode === "note" && cls(x.classe_id) && !cls(x.classe_id).archive);
  const dv = S.devoirs.filter(d => cls(d.classe_id) && !cls(d.classe_id).archive);
  const groups = {
    attribues: [...dv.filter(d => etat(d, moi()).t === "Attribué").map(d => ({d})), ...q.filter(x => !resultatDe(x, S.user.id) && (!x.date_limite || D(x.date_limite) > now())).map(x => ({q:x}))],
    manquants: [...dv.filter(d => etat(d, moi()).t === "Manquant").map(d => ({d})), ...q.filter(x => !resultatDe(x, S.user.id) && x.date_limite && D(x.date_limite) <= now()).map(x => ({q:x}))],
    termines: [...dv.filter(d => ["Rendu", "Noté"].includes(etat(d, moi()).t)).map(d => ({d})), ...q.filter(x => resultatDe(x, S.user.id)).map(x => ({q:x}))]
  };
  const L = {attribues:"Attribués", manquants:"Manquants", termines:"Terminés"}, list = groups[S.todoTab];
  const ligne = it => { const o = it.d || it.q, c = cls(o.classe_id); let right;
    if (it.d) { const e = etat(o, moi()); right = e.t === "Noté" ? `<span class="mono" style="color:var(--ink)">${fmtNote(e.note)}/${o.points}</span>` : e.t === "Rendu" ? "Rendu" : dueOf(o).replace("Échéance : ", ""); }
    else { const r = resultatDe(o, S.user.id); right = r ? `<span class="mono" style="color:var(--ink)">${fmtNote(noteQuiz(o, r))}/${o.points}</span>` : o.date_limite ? dueTxt(D(o.date_limite)).replace("Échéance : ", "") : "Aucune date limite"; }
    return `<div class="work" style="--c:var(${C(c && c.couleur).c})"><a class="workrow" href="${it.d ? "#/devoir/" : "#/quiz/"}${o.id}" style="padding:12px 18px;gap:16px"><span class="ico">${icon(it.d ? "devoir" : "quiz", "")}</span><span class="tt">${esc(o.titre)}<br><small class="muted" style="font-weight:400">${esc(c ? c.nom : "")}</small></span><span class="dt">${right}</span></a></div>`; };
  return `<div class="tabsbar" style="--c:var(--accent)"><div class="tabs" role="tablist">${Object.keys(L).map(k => `<button role="tab" aria-selected="${S.todoTab === k}" data-act="todotab" data-t="${k}">${L[k]} <span class="muted mono">${groups[k].length}</span></button>`).join("")}</div></div>
  <div class="page" style="max-width:820px"><section class="group">${list.length ? list.map(ligne).join("") : `<p class="empty" style="padding:24px 18px;margin:0">${S.todoTab === "attribues" ? "Aucun travail à rendre pour le moment." : S.todoTab === "manquants" ? "Aucun travail manquant." : "Aucun travail terminé."}</p>`}</section>${pageFoot()}</div>`;
}

/* ---------- agenda ---------- */
function vAgenda(){
  const t = now(), mon = new Date(t); mon.setHours(0, 0, 0, 0); mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7) + S.week * 7);
  const days = [...Array(7)].map((_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return d; });
  const evts = [...S.devoirs.filter(d => d.date_limite && !d.brouillon).map(d => ({d:D(d.date_limite), t:d.titre, c:cls(d.classe_id), href:"#/devoir/" + d.id})),
                ...S.quiz.filter(q => q.date_limite && !q.brouillon).map(q => ({d:D(q.date_limite), t:"Questionnaire · " + q.titre, c:cls(q.classe_id), href:"#/quiz/" + q.id}))].filter(e => e.c && !e.c.archive);
  return `<div class="page wide"><div class="weekbar"><button class="ib" data-act="week" data-w="-1" aria-label="Semaine précédente">${icon("left")}</button><button class="ib" data-act="week" data-w="1" aria-label="Semaine suivante">${icon("right")}</button>
    <h2>${mon.toLocaleDateString("fr-FR", {day:"numeric", month:"short"})} – ${days[6].toLocaleDateString("fr-FR", {day:"numeric", month:"short", year:"numeric"})}</h2>${S.week ? `<button class="btn ghost sm" data-act="week" data-w="0">Cette semaine</button>` : ""}</div>
    <div style="overflow-x:auto"><div class="week">${days.map(d => `<div class="day"><div class="dh ${sameDay(d, t) ? "today" : ""}">${d.toLocaleDateString("fr-FR", {weekday:"short"})}<b>${d.getDate()}</b></div>
      ${evts.filter(e => sameDay(e.d, d)).sort((a, b) => a.d - b.d).map(e => `<a class="ev" style="--bb:var(${C(e.c.couleur).b})" href="${e.href}">${esc(e.t)}<small>${esc(e.c.nom)} · ${fmtT(e.d)}</small></a>`).join("")}</div>`).join("")}</div></div>${pageFoot()}</div>`;
}
function vOutils(){
  return `<div class="page"><h1 style="font-size:1.6rem">Boîte à outils</h1>${CFG.outils.map(g => `<section class="theme" style="--c:var(--${esc(g.couleur)})"><div class="themehead"><h2>${esc(g.matiere)}</h2></div>${g.liens.map(([n, d, u]) => `<div class="work"><a class="workrow" href="${esc(u)}" target="_blank" rel="noopener" style="padding:10px 8px;gap:16px"><span class="ico pale">${icon("links", "")}</span><span class="tt">${esc(n)}<br><small class="muted" style="font-weight:400">${esc(d)}</small></span><span class="muted">↗</span></a></div>`).join("")}</section>`).join("")}${pageFoot()}</div>`;
}
/* ---------- éditeur plein écran : devoir, documentation, questionnaire ---------- */
const typeDeLien = (u, mode) => mode === "youtube" || /youtu\.?be/i.test(u) ? "YouTube" : mode === "onedrive" || /sharepoint\.com|onedrive|1drv\.ms/i.test(u) ? "OneDrive" : "Lien";
const extType = n => { const e = (n.split(".").pop() || "").toUpperCase(); return e.length && e.length <= 5 ? e : "Fichier"; };

async function initEditeur(r){
  const type = ["documentation", "questionnaire"].includes(r.a) ? r.a : "devoir", key = location.hash;
  if (S.ed && S.ed.key === key) return;
  let rec = null, classe = r.x, bonnes = [];
  if (r.t !== "new") {
    if (type === "devoir") rec = S.devoirs.find(d => String(d.id) === r.t);
    else if (type === "questionnaire") {
      rec = S.quiz.find(q => String(q.id) === r.t);
      if (rec) { const { data } = await sb.from("quiz_solutions").select("bonnes").eq("quiz_id", rec.id).maybeSingle(); bonnes = (data && data.bonnes) || []; }
    } else { for (const c of S.classes) { const data = await chargerClasse(c.id); rec = data.supports.find(x => String(x.id) === r.t); if (rec) break; } }
    if (!rec) throw new Error("Élément introuvable.");
    classe = rec.classe_id;
  }
  if (!cls(classe)) classe = (actives()[0] || S.classes[0] || {}).id;
  await chargerClasse(classe);
  const lim = rec && rec.date_limite ? D(rec.date_limite) : (() => { const x = new Date(); x.setDate(x.getDate() + 7); x.setHours(23, 59, 0, 0); return x; })();
  S.ed = { key, type, id: rec ? rec.id : null, classe_id: classe, titre: rec ? rec.titre : "",
    html: rec ? (type === "documentation" ? rec.description : rec.consigne) || "" : "", ressources: rec ? (rec.ressources || []).slice() : [],
    theme_id: rec && rec.theme_id ? String(rec.theme_id) : (S.edTheme || ""), points: rec ? (rec.points == null ? "none" : String(rec.points)) : "20",
    hasDate: rec ? !!rec.date_limite : type !== "documentation", date: ymd(lim), heure: hm(lim), mode: rec ? rec.mode : (type === "questionnaire" ? "note" : "individuel"), formats: rec ? rec.formats || "" : "",
    eleves: rec && rec.eleves ? rec.eleves.slice() : null, montrer: rec ? rec.montrer_correction !== false : true,
    questions: type === "questionnaire" ? (rec ? (rec.questions || []).map((x, i) => ({ q: x.q, o: (x.o || []).slice(), a: bonnes[i] ?? null })) : [{ q: "", o: ["", ""], a: null }]) : [],
    aDesResultats: type === "questionnaire" && rec ? S.resultats.some(x => x.quiz_id === rec.id) : false,
    publie: rec ? !rec.brouillon && D(rec.publie_le) <= now() : false, linkMode: null, uploaded: [], toDelete: [], busy: false, err: "" };
  S.edTheme = null;
}

function vEditer(){
  const e = S.ed, c = cls(e.classe_id), k = C(c && c.couleur), data = S.cache[e.classe_id] || {themes:[], eleves:[]};
  const label = {devoir:"Devoir", documentation:"Documentation", questionnaire:"Questionnaire"}[e.type];
  const main = e.publie ? "Enregistrer" : e.type === "devoir" ? "Publier le devoir" : e.type === "questionnaire" ? "Publier le questionnaire" : "Publier";
  const lm = e.linkMode, lmLabel = {onedrive:"Lien de partage OneDrive", youtube:"Lien de la vidéo YouTube", lien:"Adresse du site"}[lm];
  const nCible = e.eleves ? e.eleves.length : null;
  const dateField = `<div class="field"><label for="edHasDate">Date limite</label><select id="edHasDate" data-f="hasDate"><option value="0" ${e.hasDate ? "" : "selected"}>Aucune date limite</option><option value="1" ${e.hasDate ? "selected" : ""}>Choisir une date</option></select>
      ${e.hasDate ? `<div class="dt2"><input id="edDate" type="date" data-f="date" value="${e.date}" aria-label="Date"><input id="edHeure" type="time" data-f="heure" value="${e.heure}" aria-label="Heure"></div><span class="muted" style="font-size:.78rem">${e.type === "questionnaire" ? "Le questionnaire se fermera à cette heure." : "Le dépôt se fermera automatiquement à cette heure."}</span>` : ""}</div>`;
  return `<div class="edtop" style="--c:var(${k.c})">
    <button class="ib" data-act="edclose" aria-label="Fermer">${icon("x")}</button>
    <span class="ico">${icon(e.type === "devoir" ? "devoir" : e.type === "questionnaire" ? "quiz" : "support", "")}</span><h1>${label}</h1><span class="spacer"></span>
    <div class="split dd"><button class="btn" data-act="edsave" data-mode="publish" ${e.busy ? "disabled" : ""}>${e.busy ? "Enregistrement…" : main}</button><button class="btn caret" data-act="menu" data-m="edsave" aria-label="Autres options" ${e.busy ? "disabled" : ""}>▾</button>
      ${S.menu === "edsave" ? `<div class="dd-menu">${e.publie ? "" : `<a href="#" data-act="edprog">Programmer…</a>`}<a href="#" data-act="edsave" data-mode="draft">${e.publie ? "Repasser en brouillon" : "Enregistrer le brouillon"}</a></div>` : ""}</div>
  </div>
  <div class="edgrid" style="--c:var(${k.c})">
    <div class="edmain">
      ${e.err ? `<div class="notice" style="background:var(--bad-bg);color:var(--bad)">${esc(e.err)}</div>` : ""}
      ${e.aDesResultats ? `<div class="notice">Des élèves ont déjà répondu à ce questionnaire : modifier les questions ou les bonnes réponses ne recalcule pas leurs notes.</div>` : ""}
      <section class="edcard">
        <div class="field"><label for="edTitre">Titre *</label><input id="edTitre" data-f="titre" value="${esc(e.titre)}" placeholder="${e.type === "devoir" ? "ex. Compte rendu du TP titrage" : e.type === "questionnaire" ? "ex. QCM · Les acides et les bases" : "ex. Cours · Les acides et les bases"}"></div>
        <div class="field"><label>${e.type === "documentation" ? "Description" : "Instructions"} <span class="muted">(facultatif)</span></label>
          <div class="rte"><div id="edHtml" class="rtebody" contenteditable="true" role="textbox" aria-multiline="true" data-ph="Ajoute les consignes pour les élèves…">${rich(e.html)}</div><div class="rtebar">${fmtBar()}</div></div></div>
      </section>
      ${e.type === "questionnaire" ? vQuestionsEditeur(e) : ""}
      ${e.type === "questionnaire" ? "" : `<section class="edcard">
        <h3>Joindre</h3>
        <div class="joindre">
          <button data-act="edlink" data-mode="onedrive"><span class="jic" style="color:#0364B8">${icon("nuage")}</span>OneDrive</button>
          <button data-act="edlink" data-mode="youtube"><span class="jic" style="color:#E62117">▶</span>YouTube</button>
          <button data-act="edupload"><span class="jic">${icon("upload")}</span>Importer</button>
          <button data-act="edlink" data-mode="lien"><span class="jic">${icon("links")}</span>Lien</button>
        </div>
        <input type="file" id="edFile" multiple hidden>
        ${lm ? `<div class="linkform"><div class="field"><label for="edLinkUrl">${lmLabel}</label><input id="edLinkUrl" type="url" placeholder="https://…"></div>
          <div class="field"><label for="edLinkLabel">Nom affiché <span class="muted">(facultatif)</span></label><input id="edLinkLabel" placeholder="ex. Fiche de TP"></div>
          <div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn ghost sm" data-act="edlinkcancel">Annuler</button><button class="btn sm" data-act="edlinkadd">Ajouter</button></div>
          ${lm === "onedrive" ? `<p class="muted" style="margin:0;font-size:.8rem">Dans OneDrive : clic droit sur le fichier, « Partager », « Copier le lien ». Vérifie que le lien est accessible aux personnes du lycée.</p>` : ""}</div>` : ""}
        ${e.ressources.length ? `<ul class="files">${e.ressources.map((x, i) => `<li><span><span class="k mono muted">${esc(x.type)}</span> ${esc(x.label)}</span><button data-act="rmres" data-i="${i}" aria-label="Retirer ${esc(x.label)}">✕</button></li>`).join("")}</ul>` : ""}
      </section>`}
    </div>
    <aside class="edside">
      <div class="field"><label for="edClasse">Pour</label><select id="edClasse" data-f="classe_id" ${e.id ? "disabled" : ""}>${actives().map(x => `<option value="${esc(x.id)}" ${x.id === e.classe_id ? "selected" : ""}>${esc(x.nom)}</option>`).join("")}</select></div>
      <div class="field"><label>Attribuer à</label><button class="btn ghost" data-act="cible">${icon("people")} ${nCible == null ? "Tous les élèves" : nCible + " élève" + (nCible > 1 ? "s" : "")}</button></div>
      ${e.type === "devoir" ? `<div class="field"><label for="edPoints">Points</label><select id="edPoints" data-f="points">${["20","10","100","none"].map(p => `<option value="${p}" ${e.points === p ? "selected" : ""}>${p === "none" ? "Non noté" : p}</option>`).join("")}</select></div>${dateField}` : ""}
      ${e.type === "questionnaire" ? `<div class="field"><label for="edMode">Type</label><select id="edMode" data-f="mode"><option value="note" ${e.mode === "note" ? "selected" : ""}>Noté · une seule tentative</option><option value="entrainement" ${e.mode === "entrainement" ? "selected" : ""}>Entraînement · recommençable</option></select></div>
        ${e.mode === "note" ? `<div class="field"><label for="edPoints">Noté sur</label><select id="edPoints" data-f="points">${["20","10","100"].map(p => `<option value="${p}" ${e.points === p ? "selected" : ""}>${p}</option>`).join("")}</select></div>
        <label class="check"><input type="checkbox" id="edMontrer" ${e.montrer ? "checked" : ""}> Montrer la correction à l'élève après l'envoi</label>` : ""}${dateField}` : ""}
      <div class="field"><label for="edTheme">Thème</label><select id="edTheme" data-f="theme_id"><option value="">Aucun thème</option>${data.themes.map(t => `<option value="${t.id}" ${String(t.id) === e.theme_id ? "selected" : ""}>${esc(t.titre)}</option>`).join("")}<option value="__new">+ Créer un thème…</option></select></div>
      ${e.type === "devoir" ? `<div class="field"><label for="edMode">Type de rendu</label><select id="edMode" data-f="mode"><option value="individuel" ${e.mode === "individuel" ? "selected" : ""}>Individuel</option><option value="binome" ${e.mode === "binome" ? "selected" : ""}>Un rendu par binôme</option></select></div>
      <div class="field"><label for="edFormats">Formats attendus <span class="muted">(facultatif)</span></label><input id="edFormats" data-f="formats" value="${esc(e.formats)}" placeholder="PDF, photos, Python…"></div>` : ""}
    </aside>
  </div>${S.modal ? vModal() : ""}`;
}

function vQuestionsEditeur(e){
  return `${e.questions.map((q, i) => `<section class="edcard qcard">
      <div class="qhead"><span class="qnum">${i + 1}</span><textarea class="qtext" data-qi="${i}" data-qk="q" rows="2" placeholder="Question" aria-label="Énoncé de la question ${i + 1}">${esc(q.q)}</textarea></div>
      <div class="qopts">${q.o.map((o, j) => `<div class="qopt ${q.a === j ? "good" : ""}"><input type="radio" name="bonne${i}" data-act="bonne" data-qi="${i}" data-oi="${j}" ${q.a === j ? "checked" : ""} aria-label="Bonne réponse : option ${j + 1}" title="Cocher la bonne réponse"><input class="otext" data-qi="${i}" data-oi="${j}" value="${esc(o)}" placeholder="Option ${j + 1}" aria-label="Option ${j + 1} de la question ${i + 1}">${q.o.length > 2 ? `<button class="ib sm" data-act="rmopt" data-qi="${i}" data-oi="${j}" aria-label="Supprimer l'option">${icon("x")}</button>` : ""}</div>`).join("")}</div>
      <div class="qfoot"><button class="linkbtn" data-act="addopt" data-qi="${i}">${icon("plus")} Ajouter une option</button><span class="spacer"></span>
        <span class="muted" style="font-size:.8rem">${q.a == null ? "Coche la bonne réponse" : "Bonne réponse : option " + (q.a + 1)}</span>
        <button class="ib sm" data-act="dupq" data-qi="${i}" title="Dupliquer" aria-label="Dupliquer la question">${icon("copy")}</button>
        ${e.questions.length > 1 ? `<button class="ib sm" data-act="rmq" data-qi="${i}" title="Supprimer" aria-label="Supprimer la question">${icon("trash")}</button>` : ""}</div>
    </section>`).join("")}
    <div><button class="btn ghost" data-act="addq">${icon("plus")} Ajouter une question</button></div>`;
}

async function uploadFichiers(files, cible){
  const classe = cible === "annonce" ? S.annonce.classe : S.ed.classe_id, dest = cible === "annonce" ? S.annonce : S.ed;
  for (const f of files) {
    if (f.size > 50 * 1024 * 1024) { toast("« " + f.name + " » dépasse 50 Mo : mets-le dans OneDrive et ajoute le lien."); continue; }
    toast("Envoi de « " + f.name + " »…");
    const path = classe + "/" + Date.now() + "-" + safeName(f.name);
    const { error } = await sb.storage.from("documents").upload(path, f, { upsert: false });
    if (error) { toast("Échec de l'envoi de « " + f.name + " » : " + error.message); continue; }
    dest.ressources.push({ type: extType(f.name), label: f.name, path }); dest.uploaded.push(path);
    toast("« " + f.name + " » ajouté");
  }
  render();
}

async function enregistrer(mode, programme){
  const e = S.ed; e.err = "";
  if (!e.titre.trim()) { e.err = "Donne un titre."; return render(); }
  let limite = null;
  if (e.type !== "documentation" && e.hasDate) {
    if (!e.date) { e.err = "Choisis la date limite, ou « Aucune date limite »."; return render(); }
    limite = new Date(e.date + "T" + (e.heure || "23:59"));
    if (mode !== "draft" && limite <= (programme || now())) { e.err = "La date limite doit être après la publication."; return render(); }
  }
  if (e.type === "questionnaire") {
    const qs = e.questions.map(q => ({ q: q.q.trim(), o: q.o.map(x => x.trim()), a: q.a }));
    for (let i = 0; i < qs.length; i++) {
      if (!qs[i].q) { e.err = "La question " + (i + 1) + " n'a pas d'énoncé."; return render(); }
      if (qs[i].o.filter(Boolean).length < 2 || qs[i].o.some(x => !x)) { e.err = "La question " + (i + 1) + " doit avoir au moins deux options, toutes remplies."; return render(); }
      if (qs[i].a == null) { e.err = "Coche la bonne réponse de la question " + (i + 1) + "."; return render(); }
    }
  }
  if (e.eleves && !e.eleves.length) { e.err = "Choisis au moins un élève, ou « Tous les élèves »."; return render(); }
  const row = { classe_id: e.classe_id, theme_id: e.theme_id ? Number(e.theme_id) : null, titre: e.titre.trim(), ressources: e.ressources, eleves: e.eleves };
  if (e.type === "devoir") Object.assign(row, { consigne: e.html, date_limite: limite ? limite.toISOString() : null, mode: e.mode, formats: e.formats.trim(), points: e.points === "none" ? null : Number(e.points) });
  else if (e.type === "questionnaire") Object.assign(row, { consigne: e.html, date_limite: limite ? limite.toISOString() : null, mode: e.mode, points: Number(e.points === "none" ? 20 : e.points), montrer_correction: e.montrer, questions: e.questions.map(q => ({ q: q.q.trim(), o: q.o.map(x => x.trim()) })) });
  else row.description = e.html;
  if (e.type === "questionnaire") delete row.ressources;
  if (mode === "draft") row.brouillon = true;
  else if (mode === "schedule") { row.brouillon = false; row.publie_le = programme.toISOString(); }
  else { row.brouillon = false; if (!e.publie) row.publie_le = now().toISOString(); }
  Object.keys(row).forEach(k => row[k] === undefined && delete row[k]);
  e.busy = true; S.menu = null; render();
  const table = e.type === "devoir" ? "devoirs" : e.type === "questionnaire" ? "quiz" : "supports";
  const q = e.id ? sb.from(table).update(row).eq("id", e.id).select("id").single() : sb.from(table).insert(row).select("id").single();
  const { data, error } = await q;
  if (error) { e.busy = false; e.err = "Enregistrement impossible : " + error.message; return render(); }
  if (e.type === "questionnaire") {
    const r2 = await sb.from("quiz_solutions").upsert({ quiz_id: data.id, bonnes: e.questions.map(x => x.a) });
    if (r2.error) { e.busy = false; e.err = "Les bonnes réponses n'ont pas pu être enregistrées : " + r2.error.message; e.id = data.id; return render(); }
  }
  if (e.toDelete.length) await sb.storage.from("documents").remove(e.toDelete);
  const classe = e.classe_id, nouveau = !e.id, typ = e.type; S.ed = null;
  await rafraichir(classe);
  toast(mode === "draft" ? "Brouillon enregistré" : mode === "schedule" ? "Publication programmée" : !nouveau ? "Modifications enregistrées" : ({devoir:"Devoir publié", questionnaire:"Questionnaire publié", documentation:"Documentation publiée"})[typ]);
  go("/classe/" + classe + "/travaux");
}

/* ---------- annonces du flux ---------- */
async function publierAnnonce(){
  const A = S.annonce, el = document.getElementById("anHtml"); if (el) A.html = el.innerHTML;
  const txt = (A.html || "").replace(/<[^>]*>/g, "").trim();
  if (!txt && !A.ressources.length) { toast("Écris un message avant de publier."); return; }
  A.busy = true; render();
  const { error } = await sb.from("annonces").insert({ classe_id: A.classe, auteur_nom: S.nom, texte: A.html, ressources: A.ressources });
  if (error) { A.busy = false; render(); toast("Publication impossible : " + error.message); return; }
  const c = A.classe; S.annonce = null; delete S.cache[c]; render(); toast("Annonce publiée");
}
/* ---------- questionnaire (QCM) ---------- */
async function chargerResultatsQuiz(q, force){
  S.qr = S.qr || {};
  if (S.qr[q.id] && !force) return S.qr[q.id];
  const [r1, r2] = await Promise.all([
    sb.from("resultats_quiz").select("eleve, reponses, score, sur, fait_le").eq("quiz_id", q.id),
    sb.from("quiz_solutions").select("bonnes").eq("quiz_id", q.id).maybeSingle()
  ]);
  return S.qr[q.id] = { res: r1.data || [], bonnes: (r2.data && r2.data.bonnes) || [] };
}
function vQuiz(r){
  const q = S.quiz.find(x => String(x.id) === r.a);
  if (!q) return `<div class="page"><div class="emptystate"><b>Questionnaire introuvable.</b><a href="#/">Retour à l'accueil</a></div></div>`;
  const c = cls(q.classe_id), k = C(c && c.couleur), qs = q.questions || [];
  const head = `<div class="dvhead"><span class="ico">${icon("quiz", "")}</span><div style="flex:1;min-width:0"><h1>${esc(q.titre)}</h1>
    <div class="muted" style="font-size:.88rem;margin-top:4px">${esc(CFG.prof.nom)} · ${fmtShort(D(q.publie_le))}${S.prof && q.brouillon ? " · <i>Brouillon</i>" : ""}</div>
    <div class="dvmeta"><b>${q.mode === "note" ? "Noté sur " + q.points + " · une seule tentative" : "Entraînement · recommençable"}</b><span>${q.date_limite ? dueTxt(D(q.date_limite)) : "Aucune date limite"}</span></div></div>
    ${S.prof ? `<a class="ib" href="#/editer/questionnaire/${q.id}" title="Modifier" aria-label="Modifier le questionnaire">${icon("edit")}</a>` : ""}</div>
    ${q.consigne ? `<div class="dvbody"><div class="richtext">${rich(q.consigne)}</div></div>` : ""}`;
  if (S.prof) {
    const data = S.qr && S.qr[q.id], el = elevesDuDevoir(q, (S.cache[q.classe_id] || {eleves:[]}).eleves);
    if (!data) return `<div class="page" style="--c:var(${k.c})">${head}<div class="loading"><div><div class="spin"></div>Chargement des résultats…</div></div></div>`;
    const parEmail = {}; data.res.forEach(x => parEmail[S.profils[x.eleve]] = x);
    const moy = data.res.length ? data.res.reduce((a, x) => a + noteQuiz(q, x), 0) / data.res.length : null;
    return `<div class="page" style="--c:var(${k.c})">${head}
      ${q.mode === "note" ? `<div class="stats"><div><b>${data.res.length}/${el.length}</b><small>Réponses</small></div><div><b>${moy == null ? "–" : fmtNote(Math.round(moy * 10) / 10)}</b><small>Moyenne /${q.points}</small></div></div>
      <div class="tablewrap"><table><thead><tr><th class="first">Élève</th><th>Envoyé le</th><th>Bonnes réponses</th><th>Note /${q.points}</th></tr></thead><tbody>
      ${el.map(e => { const x = parEmail[e.email]; return `<tr><td class="first">${esc(e.nom)}</td><td class="muted">${x ? fmtShort(D(x.fait_le)) + " " + fmtT(D(x.fait_le)) : ""}</td><td class="mono">${x ? x.score + "/" + x.sur : ""}</td><td class="mono">${x ? fmtNote(noteQuiz(q, x)) : `<span class="pill">Non fait</span>`}</td></tr>`; }).join("") || `<tr><td colspan="4" class="muted">Aucun élève dans ce cours.</td></tr>`}</tbody></table></div>`
        : `<div class="notice">Questionnaire d'entraînement : les réponses des élèves ne sont pas enregistrées.</div>`}
      <section class="card">${qs.map((x, i) => { const ok = q.mode === "note" && data.res.length ? Math.round(data.res.filter(r2 => r2.reponses && Number(r2.reponses[i]) === Number(data.bonnes[i])).length / data.res.length * 100) : null;
        return `<div class="q"><b>${i + 1}. ${esc(x.q)}</b>${x.o.map((o, j) => `<div class="opt ${data.bonnes[i] === j ? "good" : ""}">${data.bonnes[i] === j ? icon("check") : `<span style="width:22px"></span>`} ${esc(o)}</div>`).join("")}${ok != null ? `<span class="muted" style="font-size:.82rem">${ok} % de bonnes réponses</span>` : ""}</div>`; }).join("")}</section>${pageFoot()}</div>`;
  }
  const deja = resultatDe(q, S.user.id), res = S.quizRes[q.id], rep = S.quizRep[q.id] || {};
  const ferme = q.date_limite && D(q.date_limite) <= now();
  if (q.mode === "note" && deja && !res) return `<div class="page" style="--c:var(${k.c})">${head}<section class="yourwork"><header><h2>Questionnaire envoyé</h2><span class="pill ok">${fmtNote(noteQuiz(q, deja))}/${q.points}</span></header><p class="muted" style="margin:0">Tu as répondu le ${fmtShort(D(deja.fait_le))} à ${fmtT(D(deja.fait_le))} : ${deja.score} bonne${deja.score > 1 ? "s" : ""} réponse${deja.score > 1 ? "s" : ""} sur ${deja.sur}.</p></section>${pageFoot()}</div>`;
  if (ferme && !res) return `<div class="page" style="--c:var(${k.c})">${head}<section class="yourwork"><header><h2>Questionnaire fermé</h2><span class="pill bad">Date limite passée</span></header></section>${pageFoot()}</div>`;
  const b = res && res.bonnes;
  return `<div class="page" style="--c:var(${k.c})">${head}
    <section class="card">${qs.map((x, i) => `<div class="q"><b>${i + 1}. ${esc(x.q)}</b>${x.o.map((o, j) => { let cl = ""; if (res && b) { if (j === b[i]) cl = "good"; else if (rep[i] === j) cl = "wrong"; } return `<label class="opt ${cl}"><input type="radio" name="q${i}" data-act="ans" data-q="${q.id}" data-i="${i}" data-j="${j}" ${rep[i] === j ? "checked" : ""} ${res ? "disabled" : ""}> ${esc(o)}</label>`; }).join("")}</div>`).join("")}
      <div class="q">${res ? `<div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap"><span class="grade">${res.score}<small>/${res.sur}</small></span>${q.mode === "note" ? `<span>Note : <b>${fmtNote(Math.round(res.score / Math.max(1, res.sur) * q.points * 100) / 100)}/${q.points}</b></span>` : `<button class="btn ghost" data-act="retry" data-q="${q.id}">Recommencer</button>`}${!b ? `<span class="muted">La correction n'est pas affichée pour ce questionnaire.</span>` : ""}</div>`
        : `<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button class="btn" data-act="valider" data-q="${q.id}" ${S.sending ? "disabled" : ""}>${S.sending ? "Envoi…" : "Envoyer"}</button>${q.mode === "note" ? `<span class="muted" style="font-size:.85rem">Une seule tentative : vérifie tes réponses avant d'envoyer.</span>` : ""}</div>`}</div>
    </section>${pageFoot()}</div>`;
}
async function envoyerQuiz(qid){
  const q = S.quiz.find(x => x.id === qid), rep = S.quizRep[qid] || {}, n = (q.questions || []).length;
  if (Object.keys(rep).length < n) { toast("Réponds à toutes les questions avant d'envoyer."); return; }
  S.sending = true; render();
  const { data, error } = await sb.rpc("soumettre_quiz", { qid, reponses: [...Array(n)].map((_, i) => rep[i] ?? null) });
  S.sending = false;
  if (error) { render(); toast(error.message); return; }
  S.quizRes[qid] = data;
  if (q.mode === "note") await rafraichir();
  render();
}
/* ---------- paramètres du cours ---------- */
function initParametres(c){
  if (S.settings && S.settings.id === c.id) return;
  S.settings = { id:c.id, nom:c.nom || "", description:c.description || "", section:c.section || "", niveau:c.niveau || "", matiere:c.matiere || "", salle:c.salle || "",
    symbole:c.symbole || "", couleur:c.couleur || "pc", code_actif:c.code_actif !== false, flux_mode:c.flux_mode || "prof", flux_devoirs:c.flux_devoirs !== false,
    teams_url:c.teams_url || "", teams_visible:c.teams_visible !== false, dossier_onedrive:c.dossier_onedrive || "", moyenne_visible:!!c.moyenne_visible, busy:false, err:"" };
}
function vParametres(c){
  initParametres(c);
  const s = S.settings, k = C(s.couleur);
  const f = (key, label, ph = "", type = "text") => `<div class="field"><label for="s_${key}">${label}</label><input id="s_${key}" type="${type}" data-s="${key}" value="${esc(s[key])}" placeholder="${esc(ph)}"></div>`;
  const sw = (key, label, aide = "") => `<label class="switch"><span><b>${label}</b>${aide ? `<small class="muted">${aide}</small>` : ""}</span><input type="checkbox" data-s="${key}" ${s[key] ? "checked" : ""}><i aria-hidden="true"></i></label>`;
  return `<div class="edtop" style="--c:var(${k.c})"><a class="ib" href="#/classe/${esc(c.id)}" aria-label="Fermer">${icon("x")}</a><h1>Paramètres du cours</h1><span class="spacer"></span>
      <button class="btn" data-act="savesettings" ${s.busy ? "disabled" : ""}>${s.busy ? "Enregistrement…" : "Enregistrer"}</button></div>
    <div class="settings">
      ${s.err ? `<div class="notice" style="background:var(--bad-bg);color:var(--bad)">${esc(s.err)}</div>` : ""}
      <section class="edcard"><h2>Informations sur la classe</h2>
        ${f("nom", "Nom du cours *")}
        <div class="field"><label for="s_description">Description du cours</label><textarea id="s_description" data-s="description" rows="3">${esc(s.description)}</textarea></div>
        ${f("section", "Section", "ex. Spécialité physique-chimie")}
        <div class="two">${f("niveau", "Niveau(x)", "ex. Terminale")}${f("matiere", "Matière", "ex. Physique-Chimie")}</div>
        ${f("salle", "Salle", "ex. Labo 2")}
        <div class="two">${f("symbole", "Symbole sur le bandeau", "ex. Tle")}
          <div class="field"><label for="s_couleur">Couleur du bandeau</label><select id="s_couleur" data-s="couleur">${[["pc","Bleu"],["snt","Vert"],["si","Rouge"],["tech","Ocre"],["pix","Bleu pétrole"]].map(([v, l]) => `<option value="${v}" ${s.couleur === v ? "selected" : ""}>${l}</option>`).join("")}</select></div></div>
        <div class="banner bigbanner preview" style="--bb:var(${k.b})"><span class="sym">${esc(s.symbole)}</span><h1>${esc(s.nom || "Nom du cours")}</h1><span>${esc(s.section)}</span></div>
      </section>
      <section class="edcard"><h2>Général</h2>
        <h3>Codes d'invitation</h3>
        <div class="setrow"><span><b>Gérer les codes d'invitation</b><small class="muted">Les élèves rejoignent le cours avec ce code (bouton + en haut de PhysiquePro).</small></span><select data-s="code_actif" aria-label="Codes d'invitation"><option value="1" ${s.code_actif ? "selected" : ""}>Activé</option><option value="0" ${s.code_actif ? "" : "selected"}>Désactivé</option></select></div>
        <div class="setrow"><span><b>Code du cours</b></span><span class="mono" style="font-size:1.1rem;color:var(--accent)">${esc(c.code || "")}</span></div>
        <div class="setrow"><span><b>Actions</b></span><span style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end"><button class="btn ghost sm" data-act="showcode" data-code="${esc(c.code || "")}">${icon("expand")} Afficher le code</button><button class="btn ghost sm" data-act="copycode" data-code="${esc(c.code || "")}">${icon("copy")} Copier</button><button class="btn ghost sm" data-act="resetcode" data-c="${esc(c.id)}">${icon("key")} Réinitialiser</button></span></div>
        <h3>Flux, et travaux et devoirs</h3>
        <div class="setrow"><span><b>Flux</b><small class="muted">Qui peut voir et publier dans le flux du cours.</small></span><select data-s="flux_mode" aria-label="Réglage du flux">
          <option value="eleves" ${s.flux_mode === "eleves" ? "selected" : ""}>Les élèves peuvent publier et commenter</option>
          <option value="prof" ${s.flux_mode === "prof" ? "selected" : ""}>Les élèves peuvent uniquement commenter</option>
          <option value="prof_seul" ${s.flux_mode === "prof_seul" ? "selected" : ""}>Seuls les enseignants peuvent publier et commenter</option>
          <option value="masque" ${s.flux_mode === "masque" ? "selected" : ""}>Masquer le flux aux élèves</option></select></div>
        <div class="setrow"><span><b>Travaux et devoirs sur le flux</b></span><select data-s="flux_devoirs" aria-label="Travaux et devoirs sur le flux"><option value="1" ${s.flux_devoirs ? "selected" : ""}>Afficher des notifications condensées</option><option value="0" ${s.flux_devoirs ? "" : "selected"}>Masquer les notifications</option></select></div>
      </section>
      <section class="edcard"><h2>${icon("video")} Visio Microsoft Teams</h2>
        ${f("teams_url", "Lien de la réunion Teams de la classe", "https://teams.microsoft.com/l/meetup-join/…", "url")}
        ${sw("teams_visible", "Visible par les élèves", "Les élèves voient le bouton « Rejoindre » sur la page du cours.")}
        <details class="aide"><summary>Comment obtenir un lien Teams permanent pour la classe ?</summary>
          <ol><li>Ouvre <b>Teams</b> (ou Outlook) → <b>Calendrier</b> → <b>Nouvelle réunion</b>.</li><li>Titre : le nom du cours (ex. « ${esc(s.nom)} · visio »). Choisis une date, puis <b>Répéter : chaque semaine</b>, sans date de fin.</li><li>N'invite personne, puis <b>Enregistrer</b>.</li><li>Rouvre la réunion, clique sur <b>Copier le lien</b> et colle-le ici.</li></ol>
          <p class="muted">Le même lien reste valable toute l'année : un clic sur « Rejoindre » ouvre la visio de cette classe. Selon les réglages du lycée, les élèves peuvent passer par la salle d'attente.</p></details>
      </section>
      <section class="edcard"><h2>${icon("folder")} Dossier OneDrive du cours</h2>
        ${f("dossier_onedrive", "Lien de partage du dossier OneDrive", "https://lyceeverdun-my.sharepoint.com/…", "url")}
        <details class="aide"><summary>Organisation conseillée</summary>
          <p>Dans ton OneDrive, un dossier principal <b>ONEDRIVE SITE PHYSIQUEPRO</b>, puis un sous-dossier par cours (ex. <b>${esc(s.nom)}</b>). Partage le sous-dossier avec « Personnes de MLF disposant du lien » en lecture, puis colle le lien ici. Le bouton dossier apparaîtra sur la carte et la page du cours.</p></details>
      </section>
      <section class="edcard"><h2>Notation</h2>
        ${sw("moyenne_visible", "Montrer la moyenne aux élèves", "Chaque élève voit sa moyenne sur 20 (notes rendues uniquement) sur la page du cours.")}
      </section>
      <section class="edcard danger"><h2>Archiver ou supprimer</h2>
        <div class="setrow"><span><b>${c.archive ? "Restaurer le cours" : "Archiver le cours"}</b><small class="muted">${c.archive ? "Le cours réapparaîtra sur l'accueil." : "Le cours disparaît de l'accueil et du menu. Tu pourras le restaurer depuis « Cours archivés »."}</small></span><button class="btn ghost sm" data-act="archiver" data-c="${esc(c.id)}" data-on="${c.archive ? "0" : "1"}">${icon(c.archive ? "restore" : "archive")} ${c.archive ? "Restaurer" : "Archiver"}</button></div>
        ${c.archive ? `<div class="setrow"><span><b>Supprimer définitivement</b><small class="muted">Supprime le cours, ses devoirs, les travaux rendus, les notes et les annonces.</small></span><button class="btn sm danger" data-act="supprclasse" data-c="${esc(c.id)}">${icon("trash")} Supprimer</button></div>` : `<p class="muted" style="margin:0;font-size:.85rem">Pour supprimer un cours, archive-le d'abord (comme dans Classroom).</p>`}
      </section>
    </div>${S.modal ? vModal() : ""}`;
}
async function enregistrerParametres(){
  const s = S.settings; s.err = "";
  if (!s.nom.trim()) { s.err = "Le nom du cours est obligatoire."; return render(); }
  for (const [k2, l] of [["teams_url", "Le lien Teams"], ["dossier_onedrive", "Le lien OneDrive"]]) if (s[k2].trim() && !/^https:\/\//.test(s[k2].trim())) { s.err = l + " doit commencer par https://"; return render(); }
  s.busy = true; render();
  const { error } = await sb.from("classes").update({ nom:s.nom.trim(), description:s.description.trim(), section:s.section.trim(), niveau:s.niveau.trim(), matiere:s.matiere.trim(), salle:s.salle.trim(),
    symbole:s.symbole.trim() || s.nom.trim().slice(0, 3), couleur:s.couleur, code_actif:s.code_actif, flux_mode:s.flux_mode, flux_devoirs:s.flux_devoirs,
    teams_url:s.teams_url.trim() || null, teams_visible:s.teams_visible, dossier_onedrive:s.dossier_onedrive.trim() || null, moyenne_visible:s.moyenne_visible }).eq("id", s.id);
  if (error) { s.busy = false; s.err = "Enregistrement impossible : " + error.message; return render(); }
  const id = s.id; S.settings = null; await rafraichir(id); toast("Paramètres enregistrés"); go("/classe/" + id);
}
function moyenneEleve(c){
  const notes = [];
  S.devoirs.filter(d => d.classe_id === c.id && d.points != null).forEach(d => { const e = etat(d, moi()); if (e.t === "Noté" && e.note != null) notes.push(e.note / d.points * 20); });
  S.quiz.filter(q => q.classe_id === c.id && q.mode === "note").forEach(q => { const r = resultatDe(q, S.user.id); if (r) notes.push(noteQuiz(q, r) / q.points * 20); });
  return notes.length ? Math.round(notes.reduce((a, b) => a + b, 0) / notes.length * 10) / 10 : null;
}
/* ---------- fenêtres ---------- */
function vModal(){
  const m = S.modal; let body = "", ok = "Enregistrer", foot = true;
  if (m.kind === "theme") { body = `<h2>${m.id ? "Renommer le thème" : "Ajouter un thème"}</h2><div class="field"><label for="mTitre">Nom du thème</label><input id="mTitre" value="${esc(m.titre || "")}" placeholder="ex. Chapitre 1 · Mouvements"></div>`; ok = m.id ? "Renommer" : "Ajouter"; }
  else if (m.kind === "prog") { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(8, 0, 0, 0);
    body = `<h2>Programmer la publication</h2><p class="muted" style="margin:0">Les élèves verront cet élément à partir de cette date.</p><div class="dt2"><input id="mDate" type="date" value="${ymd(d)}" aria-label="Date"><input id="mHeure" type="time" value="08:00" aria-label="Heure"></div>`; ok = "Programmer"; }
  else if (m.kind === "join") { body = `<h2>Rejoindre un cours</h2><p class="muted" style="margin:0">Demande le code du cours à ton professeur, puis saisis-le ici.</p><div class="field"><label for="mCode">Code du cours</label><input id="mCode" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="ex. k7m4pqr" style="font-family:var(--mono);font-size:1.2rem;letter-spacing:.08em"></div>`; ok = "Rejoindre"; }
  else if (m.kind === "newclass") { body = `<h2>Créer un cours</h2>
    <div class="field"><label for="mNom">Nom du cours *</label><input id="mNom" placeholder="ex. Ter. G2 SPE SPC 26-27"></div>
    <div class="field"><label for="mSection">Section</label><input id="mSection" placeholder="ex. Spécialité physique-chimie"></div>
    <div class="two"><div class="field"><label for="mSym">Symbole</label><input id="mSym" maxlength="4" placeholder="ex. Tle"></div>
    <div class="field"><label for="mCouleur">Couleur</label><select id="mCouleur"><option value="pc">Bleu</option><option value="snt">Vert</option><option value="si">Rouge</option><option value="tech">Ocre</option><option value="pix">Bleu pétrole</option></select></div></div>`; ok = "Créer"; }
  else if (m.kind === "liens") { body = `<h2>Liens de la classe</h2><p class="muted" style="margin:0">Ces liens apparaissent sur la page du cours, pour les élèves de ce cours uniquement.</p>
    <div class="linkedit">${m.liens.map((l, i) => `<div class="lrow"><input data-li="${i}" data-k="nom" value="${esc(l.nom)}" placeholder="Nom" aria-label="Nom du lien ${i + 1}"><input data-li="${i}" data-k="url" value="${esc(l.url)}" placeholder="https://…" aria-label="Adresse du lien ${i + 1}"><button class="ib sm" data-act="rmlien" data-i="${i}" aria-label="Supprimer ce lien">${icon("x")}</button></div>`).join("")}</div>
    <div><button class="btn ghost sm" data-act="addlien">${icon("plus")} Ajouter un lien</button></div>`; }
  else if (m.kind === "code") { body = `<h2>Code du cours</h2><div class="codehuge">${esc(m.code)}</div><p class="muted" style="margin:0">Les élèves cliquent sur <b>+</b> en haut de PhysiquePro, puis sur « Rejoindre un cours », et saisissent ce code.</p>
    <div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn ghost" data-act="copycode" data-code="${esc(m.code)}">${icon("copy")} Copier</button><button class="btn" data-act="mclose">Fermer</button></div>`; foot = false; }
  else if (m.kind === "cible") {
    const el = (S.cache[S.ed.classe_id] || {eleves:[]}).eleves, sel = new Set(m.sel || el.map(e => e.email));
    body = `<h2>Attribuer à</h2>${el.length ? `<label class="check"><input type="checkbox" data-act="cibletous" ${m.sel == null ? "checked" : ""}> <b>Tous les élèves</b></label>
      <div class="ciblelist">${el.map(e => `<label class="check"><input type="checkbox" data-act="cibleun" data-e="${esc(e.email)}" ${sel.has(e.email) ? "checked" : ""}> ${esc(e.nom)}</label>`).join("")}</div>`
      : `<p class="muted" style="margin:0">Aucun élève n'a encore rejoint ce cours : l'élément sera attribué à tous les élèves.</p>`}`; ok = "Valider"; }
  else if (m.kind === "reutiliser") {
    const autres = actives().filter(c => m.k === "depuis" || c.id !== m.classe);
    body = `<h2>${m.k === "depuis" ? "Réutiliser un post" : "Réutiliser dans un autre cours"}</h2>
      ${m.k === "depuis" ? `<p class="muted" style="margin:0">Choisis un élément d'un autre cours : il sera copié en <b>brouillon</b> dans ce cours.</p>
        <div class="field"><label for="mSource">Élément à copier</label><select id="mSource">${actives().filter(c => c.id !== m.classe).map(c => {
          const its = [...S.devoirs.filter(d => d.classe_id === c.id).map(d => ["devoir", d.id, d.titre]), ...S.quiz.filter(q => q.classe_id === c.id).map(q => ["quiz", q.id, "QCM · " + q.titre])];
          return its.length ? `<optgroup label="${esc(c.nom)}">${its.map(([k2, id, t]) => `<option value="${k2}:${id}">${esc(t)}</option>`).join("")}</optgroup>` : ""; }).join("")}</select></div>
        <p class="muted" style="margin:0;font-size:.82rem">Les documentations se réutilisent depuis le menu ⋮ de l'élément, dans son cours d'origine.</p>`
      : `<p class="muted" style="margin:0">Une copie sera créée en <b>brouillon</b> dans les cours choisis : tu pourras la relire avant de la publier.</p>
        <div class="ciblelist">${autres.map(c => `<label class="check"><input type="checkbox" class="mDest" value="${esc(c.id)}"> ${esc(c.nom)}</label>`).join("") || `<span class="muted">Aucun autre cours actif.</span>`}</div>`}`; ok = "Copier"; }
  else if (m.kind === "supprclasse") { body = `<h2>Supprimer « ${esc(m.nom)} » ?</h2><p style="margin:0">Le cours, ses devoirs, questionnaires, documentations, annonces, les travaux rendus et les notes seront <b>définitivement supprimés</b>.</p><div class="field"><label for="mConfirm">Pour confirmer, tape le nom du cours</label><input id="mConfirm" autocomplete="off" placeholder="${esc(m.nom)}"></div>`; ok = "Supprimer"; }
  else if (m.kind === "confirm") { body = `<h2>${esc(m.titre)}</h2><p style="margin:0">${esc(m.texte)}</p>`; ok = m.ok || "Supprimer"; }
  const danger = m.kind === "confirm" || m.kind === "supprclasse";
  return `<div class="modalbg" data-act="mclose"></div><div class="modal" role="dialog" aria-modal="true">${body}${m.err ? `<div class="err">${esc(m.err)}</div>` : ""}
    ${foot ? `<div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn ghost" data-act="mclose">Annuler</button><button class="btn${danger ? " danger" : ""}" data-act="mok" ${m.busy ? "disabled" : ""}>${ok}</button></div>` : ""}</div>`;
}

async function copierRessources(list, versClasse){
  const out = [];
  for (const r of list || []) {
    if (!r.path) { out.push(r); continue; }
    const to = versClasse + "/" + Date.now() + "-" + r.path.split("/").pop().replace(/^\d+-/, "");
    const { error } = await sb.storage.from("documents").copy(r.path, to);
    out.push(error ? r : { ...r, path: to });
  }
  return out;
}
async function reutiliser(k, id, versClasse){
  if (k === "devoir") { const d = S.devoirs.find(x => String(x.id) === String(id)); const { id: _i, publie_le, theme_id, eleves, ...rest } = d;
    return sb.from("devoirs").insert({ ...rest, classe_id: versClasse, theme_id: null, eleves: null, brouillon: true, ressources: await copierRessources(d.ressources, versClasse) }); }
  if (k === "support") { let s = null; for (const c of S.classes) { const data = S.cache[c.id]; if (data) { s = data.supports.find(x => String(x.id) === String(id)); if (s) break; } }
    const { id: _i, publie_le, theme_id, eleves, ...rest } = s;
    return sb.from("supports").insert({ ...rest, classe_id: versClasse, theme_id: null, eleves: null, brouillon: true, ressources: await copierRessources(s.ressources, versClasse) }); }
  const q = S.quiz.find(x => String(x.id) === String(id)); const { id: _i, publie_le, theme_id, eleves, ...rest } = q;
  const ins = await sb.from("quiz").insert({ ...rest, classe_id: versClasse, theme_id: null, eleves: null, brouillon: true }).select("id").single();
  if (ins.error) return ins;
  const sol = await sb.from("quiz_solutions").select("bonnes").eq("quiz_id", q.id).maybeSingle();
  return sb.from("quiz_solutions").insert({ quiz_id: ins.data.id, bonnes: (sol.data && sol.data.bonnes) || [] });
}

async function modalOk(){
  const m = S.modal, val = id => (document.getElementById(id) || {}).value || "";
  const done = async (msg, classe) => { S.modal = null; await rafraichir(classe); toast(msg); render(); };
  const stop = msg => { m.err = msg; m.busy = false; render(); };
  m.busy = true;
  try {
    if (m.kind === "theme") {
      const t = val("mTitre").trim(); if (!t) return stop("Donne un nom au thème.");
      if (m.id) { const { error } = await sb.from("themes").update({ titre: t }).eq("id", m.id); if (error) throw error; return done("Thème renommé", m.classe); }
      const data = await chargerClasse(m.classe), ordre = data.themes.reduce((a, x) => Math.max(a, x.ordre), 0) + 1;
      const { data: ins, error } = await sb.from("themes").insert({ classe_id: m.classe, titre: t, ordre }).select("id").single(); if (error) throw error;
      if (m.fromEditor && S.ed) { delete S.cache[m.classe]; await chargerClasse(m.classe); S.ed.theme_id = String(ins.id); S.modal = null; toast("Thème ajouté"); return render(); }
      return done("Thème ajouté", m.classe);
    }
    if (m.kind === "prog") {
      const d = new Date(val("mDate") + "T" + (val("mHeure") || "08:00"));
      if (isNaN(d) || d <= now()) return stop("Choisis une date dans le futur.");
      S.modal = null; return enregistrer("schedule", d);
    }
    if (m.kind === "join") {
      const code = val("mCode").trim(); if (!code) return stop("Saisis le code du cours.");
      const { data, error } = await sb.rpc("rejoindre_classe", { p_code: code, p_nom: S.nom });
      if (error) return stop(error.message);
      S.modal = null; await rafraichir(); toast("Tu as rejoint « " + data.nom + " »"); go("/classe/" + data.id); return;
    }
    if (m.kind === "newclass") {
      const nom = val("mNom").trim(); if (!nom) return stop("Donne un nom au cours.");
      const base = nom.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "cours";
      const id = base + "-" + Math.random().toString(36).slice(2, 6), ordre = S.classes.reduce((a, x) => Math.max(a, x.ordre || 0), 0) + 1;
      const { error } = await sb.from("classes").insert({ id, nom, section: val("mSection").trim(), symbole: val("mSym").trim() || nom.slice(0, 3), couleur: val("mCouleur") || "pc", ordre }); if (error) throw error;
      S.modal = null; await rafraichir(); toast("Cours créé"); go("/classe/" + id); return;
    }
    if (m.kind === "liens") {
      const liens = m.liens.map(l => ({ nom: l.nom.trim(), url: l.url.trim() })).filter(l => l.nom || l.url);
      if (liens.find(l => !/^https?:\/\//.test(l.url) || !l.nom)) return stop("Chaque lien doit avoir un nom et une adresse qui commence par https://");
      const { error } = await sb.from("classes").update({ liens }).eq("id", m.classe); if (error) throw error;
      return done("Liens enregistrés");
    }
    if (m.kind === "cible") { S.ed.eleves = m.sel == null ? null : m.sel.slice(); S.modal = null; return render(); }
    if (m.kind === "reutiliser") {
      if (m.k === "depuis") { const v = val("mSource"); if (!v) return stop("Aucun élément à copier dans tes autres cours."); const [k2, id] = v.split(":"); const r = await reutiliser(k2, id, m.classe); if (r.error) throw r.error; return done("Copie ajoutée en brouillon", m.classe); }
      const dest = [...document.querySelectorAll(".mDest:checked")].map(x => x.value); if (!dest.length) return stop("Coche au moins un cours.");
      if (m.k === "support") await chargerClasse(m.classe);
      for (const cid of dest) { const r = await reutiliser(m.k, m.id, cid); if (r.error) throw r.error; delete S.cache[cid]; }
      return done("Copie ajoutée en brouillon dans " + dest.length + " cours");
    }
    if (m.kind === "supprclasse") {
      if (val("mConfirm").trim() !== m.nom) return stop("Le nom saisi ne correspond pas.");
      const docs = await sb.storage.from("documents").list(m.id, { limit: 1000 });
      if (docs.data && docs.data.length) await sb.storage.from("documents").remove(docs.data.map(f => m.id + "/" + f.name));
      const rendusFichiers = S.rendus.filter(r => (S.devoirs.find(d => d.id === r.devoir_id) || {}).classe_id === m.id).flatMap(r => (r.fichiers || []).map(f => f.chemin));
      if (rendusFichiers.length) await sb.storage.from("rendus").remove(rendusFichiers);
      const { error } = await sb.from("classes").delete().eq("id", m.id); if (error) throw error;
      S.modal = null; await rafraichir(); toast("Cours supprimé"); go("/archives"); return;
    }
    if (m.kind === "confirm") {
      if (m.action === "suppr") {
        const table = m.k === "devoir" ? "devoirs" : m.k === "support" ? "supports" : "quiz";
        const rec = m.k === "devoir" ? S.devoirs.find(d => String(d.id) === m.id) : m.k === "support" ? ((S.cache[m.classe] || {supports:[]}).supports.find(x => String(x.id) === m.id)) : null;
        const { error } = await sb.from(table).delete().eq("id", m.id); if (error) throw error;
        const paths = ((rec && rec.ressources) || []).filter(x => x.path).map(x => x.path); if (paths.length) await sb.storage.from("documents").remove(paths);
        if (m.k === "devoir") { const f = S.rendus.filter(r => String(r.devoir_id) === m.id).flatMap(r => (r.fichiers || []).map(x => x.chemin)); if (f.length) await sb.storage.from("rendus").remove(f); }
        return done("Élément supprimé", m.classe);
      }
      if (m.action === "supprtheme") { const { error } = await sb.from("themes").delete().eq("id", m.id); if (error) throw error; return done("Thème supprimé", m.classe); }
      if (m.action === "retirer") { const { error } = await sb.from("inscriptions").delete().eq("classe_id", m.classe).in("email", m.emails); if (error) throw error; m.emails.forEach(x => S.pick.delete(x)); return done(m.emails.length > 1 ? "Élèves retirés du cours" : "Élève retiré du cours", m.classe); }
      if (m.action === "supprannonce") { const { error } = await sb.from("annonces").delete().eq("id", m.id); if (error) throw error; return done("Annonce supprimée", m.classe); }
    }
  } catch (err) { stop("Action impossible : " + (err.message || err)); }
}
/* ---------- rendu ---------- */
let renderId = 0;
const chargement = (r) => topbar(r) + `<div class="shell">${drawer(r)}<main class="content"><div class="loading"><div><div class="spin"></div>Chargement…</div></div></main></div>`;
async function render(){
  const id = ++renderId, r = route();
  try {
    if (r.v === "editer") {
      if (!S.prof) { go("/"); return; }
      await initEditeur(r); if (id !== renderId) return;
      const foc = document.activeElement && document.activeElement.id;
      app.innerHTML = vEditer();
      const fi = document.getElementById("edFile"); if (fi) fi.onchange = () => { uploadFichiers([...fi.files], "ed"); fi.value = ""; };
      apresRendu(foc); return;
    }
    if (r.v === "classe" && r.t === "parametres") {
      const c = cls(r.a); if (!S.prof || !c) { go("/"); return; }
      const foc = document.activeElement && document.activeElement.id;
      app.innerHTML = vParametres(c); apresRendu(foc); return;
    }
    let content;
    if (r.v === "classe") {
      if (!S.cache[r.a]) app.innerHTML = chargement(r);
      const data = cls(r.a) ? await chargerClasse(r.a) : null; if (id !== renderId) return;
      content = vClasse(r, data);
    } else if (r.v === "devoir") {
      const d = S.devoirs.find(x => String(x.id) === r.a);
      if (d) { if (!S.cache[d.classe_id]) app.innerHTML = chargement(r); await chargerClasse(d.classe_id); const em = S.prof ? S.sel : moi(); if (em) await chargerCP(d.id, em); }
      if (id !== renderId) return;
      content = vDevoir(r);
    } else if (r.v === "quiz") {
      const q = S.quiz.find(x => String(x.id) === r.a);
      if (q && S.prof) { await chargerClasse(q.classe_id); await chargerResultatsQuiz(q); }
      if (id !== renderId) return;
      content = vQuiz(r);
    } else content = ({agenda:vAgenda, todo:vTodo, outils:vOutils, archives:vArchives})[r.v]?.(r) ?? vAccueil();
    const foc = document.activeElement && document.activeElement.id;
    app.innerHTML = topbar(r) + `<div class="shell">${drawer(r)}<main class="content">${content}</main></div>` + (S.modal ? vModal() : "");
    const fi = document.getElementById("fileIn"); if (fi) fi.onchange = () => { S.files.push(...[...fi.files].filter(f => { if (f.size > 50e6) { toast("« " + f.name + " » dépasse 50 Mo : mets-le dans ton OneDrive et ajoute le lien."); return false; } return true; })); fi.value = ""; render(); };
    const af = document.getElementById("anFile"); if (af) af.onchange = () => { uploadFichiers([...af.files], "annonce"); af.value = ""; };
    apresRendu(foc);
  } catch (e) {
    app.innerHTML = topbar(r) + `<div class="shell">${drawer(r)}<main class="content"><div class="page"><div class="emptystate"><b>Impossible de charger cette page.</b><span>${esc(e.message || e)}</span><button class="btn ghost" data-act="reload">Réessayer</button></div></div></main></div>`;
  }
}
function apresRendu(foc){
  if (S.modal && S.modal.kind !== "liens" && S.modal.kind !== "cible" && S.modal.kind !== "reutiliser") { const f = document.querySelector(".modal input:not([type=checkbox])"); if (f) f.focus(); return; }
  if (foc && document.getElementById(foc) && !["edHtml", "anHtml"].includes(foc)) { const el = document.getElementById(foc); el.focus(); if (el.setSelectionRange && el.type === "text") { const n = el.value.length; el.setSelectionRange(n, n); } }
}
const fermerMenus = () => { S.dd = false; S.me = false; S.menu = null; };

/* ---------- clics ---------- */
document.addEventListener("click", async e => {
  const a = e.target.closest("[data-act]");
  if (!a) {
    if ((S.dd || S.me || S.menu) && !e.target.closest(".dd")) { fermerMenus(); render(); }
    return;
  }
  const act = a.dataset.act, r = route();
  if (["INPUT"].includes(a.tagName) && ["pick", "pickall", "cibletous", "cibleun", "bonne", "ans"].includes(act)) { /* traité par « change » */ if (act !== "pick" && act !== "pickall") return; }
  switch (act) {
    case "drawer": S.drawer = !S.drawer; render(); return;
    case "dd": S.dd = !S.dd; S.me = false; S.menu = null; render(); return;
    case "me": S.me = !S.me; S.dd = false; S.menu = null; render(); return;
    case "logout": e.preventDefault(); await sb.auth.signOut(); location.replace(ICI); return;
    case "menu": e.preventDefault(); S.menu = S.menu === a.dataset.m ? null : a.dataset.m; S.dd = false; S.me = false; render(); return;
    case "reload": S.cache = {}; await chargerTout().catch(() => {}); render(); return;
    case "toggle": S.open = S.open === a.dataset.id ? null : a.dataset.id; render(); return;
    case "todotab": S.todoTab = a.dataset.t; render(); return;
    case "week": S.week = a.dataset.w === "0" ? 0 : S.week + Number(a.dataset.w); render(); return;
    case "toutreduire": { const c = cls(r.a), data = S.cache[r.a]; if (S.reduits.size) S.reduits = new Set(); else { S.reduits = new Set(data.themes.map(t => String(t.id))); S.reduits.add("none"); } render(); return; }
    case "reduire": { const k = a.dataset.id; S.reduits.has(k) ? S.reduits.delete(k) : S.reduits.add(k); render(); return; }

    /* cours */
    case "join": e.preventDefault(); fermerMenus(); S.modal = {kind:"join"}; render(); return;
    case "newclass": e.preventDefault(); fermerMenus(); S.modal = {kind:"newclass"}; render(); return;
    case "showcode": e.preventDefault(); S.menu = null; S.modal = {kind:"code", code:a.dataset.code}; render(); return;
    case "copycode": { e.preventDefault(); S.menu = null; const code = a.dataset.code; try { navigator.clipboard.writeText(code).then(() => toast("Code copié : " + code), () => toast("Code : " + code)); } catch (_) { toast("Code : " + code); } render(); return; }
    case "resetcode": { e.preventDefault(); S.menu = null; const al = "abcdefghjkmnpqrstuvwxyz23456789", code = [...Array(7)].map(() => al[Math.floor(Math.random() * al.length)]).join("");
      const { error } = await sb.from("classes").update({ code, code_actif: true }).eq("id", a.dataset.c); if (error) { toast("Impossible de changer le code : " + error.message); return; }
      if (S.settings) S.settings.code_actif = true; await rafraichir(); render(); toast("Nouveau code : " + code); return; }
    case "togglecode": { e.preventDefault(); S.menu = null; const on = a.dataset.on === "1"; const { error } = await sb.from("classes").update({ code_actif: on }).eq("id", a.dataset.c); if (error) { toast("Action impossible : " + error.message); return; }
      await rafraichir(); render(); toast(on ? "Code activé" : "Code désactivé : plus personne ne peut rejoindre avec ce code"); return; }
    case "archiver": { e.preventDefault(); S.menu = null; const on = a.dataset.on === "1"; const { error } = await sb.from("classes").update({ archive: on }).eq("id", a.dataset.c); if (error) { toast("Action impossible : " + error.message); return; }
      S.settings = null; await rafraichir(); toast(on ? "Cours archivé" : "Cours restauré"); go(on ? "/archives" : "/classe/" + a.dataset.c); render(); return; }
    case "supprclasse": { e.preventDefault(); S.menu = null; const c = cls(a.dataset.c); S.modal = {kind:"supprclasse", id:c.id, nom:c.nom}; render(); return; }
    case "editliens": { const c = cls(a.dataset.c); S.modal = {kind:"liens", classe:c.id, liens:(c.liens || []).map(l => ({...l}))}; if (!S.modal.liens.length) S.modal.liens.push({nom:"", url:""}); render(); return; }
    case "addlien": S.modal.liens.push({nom:"", url:""}); render(); return;
    case "rmlien": S.modal.liens.splice(Number(a.dataset.i), 1); render(); return;
    case "savesettings": enregistrerParametres(); return;

    /* personnes et e-mails */
    case "compose": e.preventDefault(); S.menu = null; S.compose = true; render(); return;
    case "maileleve": e.preventDefault(); S.menu = null; S.pick = new Set([a.dataset.e]); S.compose = true; render(); return;
    case "closecompose": S.compose = false; S.cSub = ""; S.cBody = ""; render(); return;
    case "copymails": { const txt = [...S.pick].join("; "); try { navigator.clipboard.writeText(txt).then(() => toast("Adresses copiées"), () => toast(txt)); } catch (_) { toast(txt); } return; }
    case "retirer": e.preventDefault(); S.menu = null; S.modal = {kind:"confirm", action:"retirer", emails:[a.dataset.e], classe:a.dataset.c, ok:"Retirer", titre:"Retirer " + a.dataset.n + " du cours ?", texte:"L'élève n'aura plus accès à ce cours. Ses travaux déjà rendus sont conservés. Il pourra revenir avec le code du cours."}; render(); return;
    case "retirersel": e.preventDefault(); S.menu = null; S.modal = {kind:"confirm", action:"retirer", emails:[...S.pick], classe:a.dataset.c, ok:"Retirer", titre:"Retirer " + S.pick.size + " élève" + (S.pick.size > 1 ? "s" : "") + " du cours ?", texte:"Ils n'auront plus accès à ce cours. Leurs travaux déjà rendus sont conservés."}; render(); return;
    case "pick": { const m = a.dataset.e; S.pick.has(m) ? S.pick.delete(m) : S.pick.add(m); if (!S.pick.size) S.compose = false; render(); return; }
    case "pickall": { const el = (S.cache[a.dataset.c] || {eleves:[]}).eleves, all = el.every(x => S.pick.has(x.email)); S.pick = all ? new Set() : new Set(el.map(x => x.email)); if (!S.pick.size) S.compose = false; render(); return; }

    /* thèmes et éléments */
    case "newtheme": e.preventDefault(); S.menu = null; S.modal = {kind:"theme", classe:a.dataset.c}; render(); return;
    case "renomtheme": e.preventDefault(); S.menu = null; S.modal = {kind:"theme", id:a.dataset.id, titre:a.dataset.titre, classe:r.a}; render(); return;
    case "supprtheme": e.preventDefault(); S.menu = null; S.modal = {kind:"confirm", action:"supprtheme", id:a.dataset.id, classe:a.dataset.c, titre:"Supprimer le thème « " + a.dataset.titre + " » ?", texte:"Les éléments de ce thème ne sont pas supprimés : ils passent dans « Aucun thème »."}; render(); return;
    case "movetheme": { e.preventDefault(); S.menu = null; const cid = a.dataset.c, th = (await chargerClasse(cid)).themes.slice(), i = th.findIndex(t => String(t.id) === a.dataset.id), j = i + Number(a.dataset.dir);
      if (i < 0 || j < 0 || j >= th.length) return render();
      [th[i], th[j]] = [th[j], th[i]];
      const res = await Promise.all(th.map((t, n) => sb.from("themes").update({ ordre: n + 1 }).eq("id", t.id)));
      if (res.some(x => x.error)) toast("Déplacement impossible."); delete S.cache[cid]; render(); return; }
    case "suppr": e.preventDefault(); S.menu = null; S.modal = {kind:"confirm", action:"suppr", k:a.dataset.k, id:a.dataset.id, classe:r.a, titre:"Supprimer « " + a.dataset.titre + " » ?", texte:a.dataset.k === "devoir" ? "Les travaux rendus par les élèves, leurs notes et les commentaires privés de ce devoir seront aussi supprimés. Cette action est définitive." : a.dataset.k === "quiz" ? "Les réponses des élèves seront aussi supprimées. Cette action est définitive." : "Cette action est définitive."}; render(); return;
    case "publier": { e.preventDefault(); S.menu = null; const table = a.dataset.k === "devoir" ? "devoirs" : a.dataset.k === "support" ? "supports" : "quiz";
      const { error } = await sb.from(table).update({ brouillon: false, publie_le: now().toISOString() }).eq("id", a.dataset.id); if (error) { toast("Publication impossible : " + error.message); return; }
      await rafraichir(r.a); render(); toast("Publié"); return; }
    case "reutiliser": e.preventDefault(); S.menu = null; S.modal = {kind:"reutiliser", k:a.dataset.k, id:a.dataset.id, classe:r.a}; render(); return;
    case "reutiliserdepuis": e.preventDefault(); S.menu = null; S.modal = {kind:"reutiliser", k:"depuis", classe:a.dataset.c}; render(); return;
    case "mclose": if (S.modal && S.modal.busy) return; S.modal = null; render(); return;
    case "mok": modalOk(); return;
    case "openfile": { e.preventDefault(); const w = window.open("about:blank", "_blank");
      const { data, error } = await sb.storage.from(a.dataset.bucket || "documents").createSignedUrl(a.dataset.path, 3600);
      if (error || !data) { if (w) w.close(); toast("Fichier introuvable ou accès refusé."); return; }
      if (w) w.location = data.signedUrl; else location.href = data.signedUrl; return; }

    /* éditeur */
    case "fmt": { e.preventDefault(); const ed = document.getElementById(S.ed ? "edHtml" : "anHtml") || document.getElementById("anHtml"); if (!ed) return; ed.focus(); document.execCommand(a.dataset.cmd, false, null); if (ed.id === "edHtml") S.ed.html = ed.innerHTML; else S.annonce.html = ed.innerHTML; return; }
    case "edlink": S.ed.linkMode = a.dataset.mode; render(); setTimeout(() => { const u = document.getElementById("edLinkUrl"); if (u) u.focus(); }, 0); return;
    case "edlinkcancel": S.ed.linkMode = null; render(); return;
    case "edlinkadd": { const u = document.getElementById("edLinkUrl").value.trim(), l = document.getElementById("edLinkLabel").value.trim();
      if (!/^https?:\/\//.test(u)) { toast("Colle une adresse qui commence par https://"); return; }
      const t = typeDeLien(u, S.ed.linkMode); S.ed.ressources.push({ type: t, label: l || (t === "Lien" ? u.replace(/^https?:\/\/(www\.)?/, "").split("/")[0] : t), url: u }); S.ed.linkMode = null; render(); return; }
    case "edupload": document.getElementById("edFile").click(); return;
    case "rmres": { const x = S.ed.ressources.splice(Number(a.dataset.i), 1)[0];
      if (x && x.path) { if (S.ed.uploaded.includes(x.path)) { sb.storage.from("documents").remove([x.path]); S.ed.uploaded = S.ed.uploaded.filter(p => p !== x.path); } else S.ed.toDelete.push(x.path); }
      render(); return; }
    case "edprog": e.preventDefault(); S.menu = null; S.modal = {kind:"prog"}; render(); return;
    case "edsave": e.preventDefault(); enregistrer(a.dataset.mode); return;
    case "edclose": { const ed = S.ed; if (ed && ed.uploaded.length) sb.storage.from("documents").remove(ed.uploaded); const c = ed ? ed.classe_id : null; S.ed = null; S.modal = null; if (c) go("/classe/" + c + "/travaux"); else history.back(); return; }
    case "cible": S.modal = {kind:"cible", sel: S.ed.eleves ? S.ed.eleves.slice() : null}; render(); return;
    case "addq": S.ed.questions.push({ q: "", o: ["", ""], a: null }); render(); setTimeout(() => { const t = document.querySelectorAll(".qtext"); if (t.length) t[t.length - 1].focus(); }, 0); return;
    case "rmq": S.ed.questions.splice(Number(a.dataset.qi), 1); render(); return;
    case "dupq": { const q = S.ed.questions[Number(a.dataset.qi)]; S.ed.questions.splice(Number(a.dataset.qi) + 1, 0, { q: q.q, o: q.o.slice(), a: q.a }); render(); return; }
    case "addopt": S.ed.questions[Number(a.dataset.qi)].o.push(""); render(); return;
    case "rmopt": { const q = S.ed.questions[Number(a.dataset.qi)], j = Number(a.dataset.oi); q.o.splice(j, 1); if (q.a === j) q.a = null; else if (q.a > j) q.a--; render(); return; }

    /* flux */
    case "annoncer": S.annonce = { classe: a.dataset.c, html: "", ressources: [], uploaded: [], linkMode: null, busy: false }; render(); setTimeout(() => { const x = document.getElementById("anHtml"); if (x) x.focus(); }, 0); return;
    case "ancancel": if (S.annonce && S.annonce.uploaded.length) sb.storage.from("documents").remove(S.annonce.uploaded); S.annonce = null; render(); return;
    case "anpost": publierAnnonce(); return;
    case "anlink": S.annonce.html = (document.getElementById("anHtml") || {}).innerHTML || S.annonce.html; S.annonce.linkMode = "lien"; render(); return;
    case "anlinkcancel": S.annonce.linkMode = null; render(); return;
    case "anlinkadd": { const u = document.getElementById("anLinkUrl").value.trim(), l = document.getElementById("anLinkLabel").value.trim();
      if (!/^https?:\/\//.test(u)) { toast("Colle une adresse qui commence par https://"); return; }
      const t = typeDeLien(u); S.annonce.ressources.push({ type: t, label: l || (t === "Lien" ? u.replace(/^https?:\/\/(www\.)?/, "").split("/")[0] : t), url: u }); S.annonce.linkMode = null; render(); return; }
    case "anupload": S.annonce.html = (document.getElementById("anHtml") || {}).innerHTML || S.annonce.html; document.getElementById("anFile").click(); return;
    case "anrm": { const x = S.annonce.ressources.splice(Number(a.dataset.i), 1)[0]; if (x && x.path) sb.storage.from("documents").remove([x.path]); render(); return; }
    case "comment": { const inp = document.getElementById("cm-" + a.dataset.id), t = inp.value.trim(); if (!t) return;
      a.disabled = true; const { error } = await sb.from("commentaires").insert({ annonce_id: Number(a.dataset.id), auteur_nom: S.nom, texte: t });
      if (error) { a.disabled = false; toast("Commentaire impossible : " + error.message); return; }
      delete S.cache[a.dataset.c]; S.open = "an" + a.dataset.id; render(); return; }
    case "supprcom": { const { error } = await sb.from("commentaires").delete().eq("id", a.dataset.id); if (error) { toast("Suppression impossible : " + error.message); return; } delete S.cache[a.dataset.c]; render(); return; }
    case "supprannonce": e.preventDefault(); S.menu = null; S.modal = {kind:"confirm", action:"supprannonce", id:a.dataset.id, classe:a.dataset.c, titre:"Supprimer cette annonce ?", texte:"L'annonce et ses commentaires seront supprimés."}; render(); return;
    case "opencoms": S.open = "an" + a.dataset.id; render(); return;

    /* devoirs : élève */
    case "pickfile": e.preventDefault(); S.menu = null; document.getElementById("fileIn").click(); render(); return;
    case "lienopen": e.preventDefault(); S.menu = null; S.lienOpen = true; render(); setTimeout(() => { const l = document.getElementById("lien"); if (l) l.focus(); }, 0); return;
    case "rmfile": S.files.splice(Number(a.dataset.i), 1); render(); return;
    case "submit": rendreDevoir(S.devoirs.find(x => String(x.id) === a.dataset.id)); return;
    case "unsubmit": { const rd = S.rendus.find(x => String(x.id) === a.dataset.id); const { error } = await sb.from("rendus").delete().eq("id", a.dataset.id);
      if (error) { toast("Annulation impossible : " + error.message); return; }
      const f = (rd.fichiers || []).map(x => x.chemin); if (f.length) await sb.storage.from("rendus").remove(f);
      await rafraichir(); render(); toast("Envoi annulé : tu peux modifier ton travail et le rendre à nouveau."); return; }
    case "cpsend": { const inp = document.getElementById("cpIn"), t = inp.value.trim(); if (!t) return;
      const { error } = await sb.from("commentaires_prives").insert({ devoir_id: Number(a.dataset.d), eleve_email: a.dataset.e, auteur_nom: S.nom, texte: t });
      if (error) { toast("Commentaire impossible : " + error.message); return; }
      await chargerCP(Number(a.dataset.d), a.dataset.e, true); render(); return; }

    /* devoirs : professeur */
    case "ptab": S.ptab = a.dataset.t; render(); return;
    case "sel": S.sel = a.dataset.n || null; S.compose = false; render(); return;
    case "savenote": { const v = (document.getElementById("note") || {}).value, d = S.devoirs.find(x => x.id === (S.rendus.find(y => String(y.id) === a.dataset.id) || {}).devoir_id);
      const n = v === "" || v == null ? null : Number(String(v).replace(",", ".")), pub = a.dataset.pub === "1";
      if (n != null && (isNaN(n) || n < 0 || (d && d.points != null && n > d.points))) { const x = document.getElementById("noteErr"); x.hidden = false; x.textContent = "La note doit être comprise entre 0 et " + d.points + "."; return; }
      const { error } = await sb.from("corrections").upsert({ rendu_id: Number(a.dataset.id), note: n, publiee: pub, modifie_le: now().toISOString() });
      if (error) { toast("Enregistrement impossible : " + error.message); return; }
      await rafraichir(); render(); toast(pub ? "Travail rendu à l'élève" : "Brouillon enregistré"); return; }
    case "rendretout": { e.preventDefault(); S.menu = null; const d = S.devoirs.find(x => String(x.id) === a.dataset.d);
      const ids = rendusDe(d).filter(rd => { const c = correctionDe(rd); return c && c.note != null && !c.publiee; }).map(rd => rd.id);
      if (!ids.length) { toast("Aucune note en brouillon à rendre pour ce devoir."); render(); return; }
      const { error } = await sb.from("corrections").update({ publiee: true, modifie_le: now().toISOString() }).in("rendu_id", ids);
      if (error) { toast("Action impossible : " + error.message); return; }
      await rafraichir(); render(); toast(ids.length + " note" + (ids.length > 1 ? "s rendues" : " rendue")); return; }
    case "mailmissing": { const d = S.devoirs.find(x => String(x.id) === a.dataset.d), el = elevesDuDevoir(d, (S.cache[d.classe_id] || {eleves:[]}).eleves);
      S.pick = new Set(el.filter(x => !renduDe(d, x.email)).map(x => x.email)); S.compose = true; S.cSub = "Rappel : " + d.titre;
      S.cBody = "Bonjour,\n\nJe n'ai pas encore reçu ton travail « " + d.titre + " ». " + (d.date_limite ? (ouvert(d) ? "La date limite est le " + fmtD(D(d.date_limite)) + " à " + fmtT(D(d.date_limite)) + "." : "La date limite est passée, viens me voir.") : "") + "\n\n" + CFG.prof.nom; render(); return; }

    /* questionnaires : élève */
    case "valider": envoyerQuiz(Number(a.dataset.q)); return;
    case "retry": delete S.quizRep[a.dataset.q]; delete S.quizRes[a.dataset.q]; render(); return;
  }
});

/* ---------- saisie ---------- */
document.addEventListener("input", e => {
  const t = e.target;
  if (t.id === "edHtml" && S.ed) { S.ed.html = t.innerHTML; return; }
  if (t.id === "anHtml" && S.annonce) { S.annonce.html = t.innerHTML; return; }
  if (S.ed && t.dataset.qi != null && t.dataset.qk === "q") { S.ed.questions[Number(t.dataset.qi)].q = t.value; return; }
  if (S.ed && t.classList.contains("otext")) { S.ed.questions[Number(t.dataset.qi)].o[Number(t.dataset.oi)] = t.value; return; }
  if (S.ed && t.dataset.f && t.tagName !== "SELECT") { S.ed[t.dataset.f] = t.value; return; }
  if (S.modal && S.modal.kind === "liens" && t.dataset.li != null) { S.modal.liens[Number(t.dataset.li)][t.dataset.k] = t.value; return; }
  if (S.settings && t.dataset.s && t.tagName !== "SELECT" && t.type !== "checkbox") { S.settings[t.dataset.s] = t.value; if (["nom", "section", "symbole"].includes(t.dataset.s)) { const p = document.querySelector(".preview"); if (p) { p.querySelector("h1").textContent = S.settings.nom || "Nom du cours"; p.querySelector("span:not(.sym)").textContent = S.settings.section; p.querySelector(".sym").textContent = S.settings.symbole; } } return; }
  if (t.id === "cSub" || t.id === "cBody") { S[t.id] = t.value; const l = document.getElementById("olk"); if (l) l.href = outlookLink([...S.pick], S.cSub, S.cBody); return; }
  if (t.id === "lien") { S.lien = t.value; return; }
});
document.addEventListener("change", async e => {
  const t = e.target, r = route();
  if (t.dataset.act === "ans") { const id = t.dataset.q; S.quizRep[id] = S.quizRep[id] || {}; S.quizRep[id][Number(t.dataset.i)] = Number(t.dataset.j); return; }
  if (t.dataset.act === "bonne") { S.ed.questions[Number(t.dataset.qi)].a = Number(t.dataset.oi); render(); return; }
  if (t.dataset.act === "cibletous") { const el = (S.cache[S.ed.classe_id] || {eleves:[]}).eleves; S.modal.sel = t.checked ? null : []; render(); return; }
  if (t.dataset.act === "cibleun") { const el = (S.cache[S.ed.classe_id] || {eleves:[]}).eleves; let s = S.modal.sel == null ? el.map(x => x.email) : S.modal.sel.slice(); s = t.checked ? [...new Set([...s, t.dataset.e])] : s.filter(x => x !== t.dataset.e); S.modal.sel = s.length === el.length ? null : s; render(); return; }
  if (t.dataset.act === "note") {
    const n = t.value.trim() === "" ? null : Number(t.value.replace(",", ".")), max = Number(t.dataset.max);
    if (n != null && (isNaN(n) || n < 0 || n > max)) { toast("La note doit être comprise entre 0 et " + max + "."); t.classList.add("bad"); return; }
    t.classList.remove("bad");
    const old = S.corrections.find(c => c.rendu_id === Number(t.dataset.rendu));
    const { error } = await sb.from("corrections").upsert({ rendu_id: Number(t.dataset.rendu), note: n, publiee: old ? old.publiee : false, modifie_le: now().toISOString() });
    if (error) { toast("Note non enregistrée : " + error.message); return; }
    if (old) old.note = n; else S.corrections.push({ rendu_id: Number(t.dataset.rendu), note: n, publiee: false });
    const s = t.parentElement.querySelector(".s"); if (s) { const pub = old && old.publiee; s.textContent = n == null ? "Rendu" : pub ? "" : "Brouillon"; }
    toast(old && old.publiee ? "Note modifiée (déjà rendue à l'élève)" : "Note enregistrée en brouillon"); return;
  }
  if (t.id === "partenaire") { S.partenaire = t.value; return; }
  if (t.id === "edMontrer" && S.ed) { S.ed.montrer = t.checked; return; }
  if (t.dataset.f === "filtre") { S.filtreTheme = t.value; render(); return; }
  if (S.settings && t.dataset.s) { const k = t.dataset.s; S.settings[k] = t.type === "checkbox" ? t.checked : ["code_actif", "flux_devoirs"].includes(k) ? t.value === "1" : t.value; if (k === "couleur") render(); return; }
  if (!S.ed || !t.dataset.f || t.tagName !== "SELECT") return;
  const f = t.dataset.f, v = t.value;
  if (f === "theme_id" && v === "__new") { t.value = S.ed.theme_id; S.modal = {kind:"theme", classe:S.ed.classe_id, fromEditor:true}; render(); return; }
  if (f === "hasDate") { S.ed.hasDate = v === "1"; render(); return; }
  if (f === "classe_id") { S.ed.classe_id = v; S.ed.theme_id = ""; S.ed.eleves = null; await chargerClasse(v); render(); return; }
  S.ed[f] = v; if (f === "mode") render();
});
document.addEventListener("keydown", e => {
  if (e.key === "Enter" && S.modal && e.target.closest && e.target.closest(".modal") && e.target.tagName === "INPUT" && e.target.type !== "checkbox") { e.preventDefault(); modalOk(); return; }
  if (e.key === "Enter" && e.target.id && e.target.id.startsWith("cm-")) { e.preventDefault(); const b = e.target.parentElement.querySelector('[data-act="comment"]'); if (b) b.click(); return; }
  if (e.key === "Enter" && e.target.id === "cpIn") { e.preventDefault(); const b = e.target.parentElement.querySelector('[data-act="cpsend"]'); if (b) b.click(); return; }
  if (e.key === "Enter" && e.target.dataset && e.target.dataset.act === "note") { e.target.blur(); return; }
  if (e.key === "Escape") { if (S.modal && !S.modal.busy) { S.modal = null; render(); return; } if (S.dd || S.me || S.menu) { fermerMenus(); render(); return; } if (S.drawer && window.innerWidth < 1100) { S.drawer = false; render(); } }
});
window.addEventListener("hashchange", () => {
  const r = route();
  if (r.v !== "editer") S.ed = null;
  if (!(r.v === "classe" && r.t === "parametres")) S.settings = null;
  if (r.v !== "devoir") { S.sel = null; S.ptab = "travaux"; S.files = []; S.lien = ""; S.lienOpen = false; S.partenaire = ""; }
  fermerMenus(); S.modal = null; S.open = null; S.compose = false; S.pick = new Set(); S.cSub = ""; S.cBody = ""; S.annonce = null; S.filtreTheme = "";
  if (window.innerWidth < 1100) S.drawer = false; window.scrollTo(0, 0); render();
});
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
