/* ---------- page d'accueil publique (visiteur non connecté) ---------- */
const PUB = { classes: [], charge: false };
const ROUTES_PUBLIQUES = ["accueil", "outils", "simulations", "physique"];
async function chargerPublic(){
  try {
    const { data, error } = await sb.rpc("pp_accueil_public");
    if (error) throw error;
    PUB.classes = (data && data.classes) || [];
    const g = (data && data.reglages) || {};
    appliquerReglages({ prof: g.prof || {}, liensUtiles: g.liensUtiles, outils: g.outils });
  } catch (_) { PUB.classes = []; appliquerReglages(); }
  PUB.charge = true;
}
/* bouton « Se connecter » : directement la page Microsoft, puis retour sur la page demandée */
async function connecter(suite){
  try { localStorage.setItem("pp_fresh", "1"); if (suite) localStorage.setItem("pp_next", suite); else localStorage.removeItem("pp_next"); } catch (_) {}
  document.querySelectorAll('[data-act="pubconnect"]').forEach(b => { b.disabled = true; b.textContent = "Redirection vers Microsoft…"; });
  const { error } = await sb.auth.signInWithOAuth({ provider: "azure", options: { scopes: "openid email profile", redirectTo: ICI, queryParams: { prompt: "select_account" } } });
  if (error) { toast("La connexion n'a pas pu démarrer : " + error.message); renderPublic(); }
}
const btnConnexion = (txt = "Se connecter", cls2 = "") => `<button class="btn ${cls2}" data-act="pubconnect">${icon("logout")} ${txt}</button>`;
function topbarPublic(){
  return `<header class="topbar pubtop">
    <div class="crumbs"><a class="brand" href="#/" style="text-decoration:none;color:inherit">${logoSVG}<span class="brandtx"><b>Physique<span>Pro</span></b><small>site de M. ${esc(nomProfSans())}</small></span></a></div>
    <span class="spacer topmid"><img class="toplogo" src="logo-verdun-haut.png?v=2" alt="Lycée franco-libanais Verdun" width="81" height="48"></span>
    <nav class="quick pubquick" aria-label="Liens rapides">${R().liensUtiles.filter(l => !l.prof).slice(0, 12).map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener" class="${l.principal ? "main" : ""}${l.ordi ? " qordi" : ""}${COTE_A_COTE[l.icone] ? " qside" + (SP.cle === l.icone ? " on" : "") : ""}" data-cle="${esc(l.icone || "")}" style="--q:${esc(l.couleur)}"><span class="qi">${quickIcon(l.icone)}</span><span class="ql">${esc(l.nom)}</span></a>`).join("")}</nav>
  </header>`;
}
function cartePublique(c){
  return `<article class="ccard pubcard" style="--bb:var(${C(c.couleur).b})">
    <div style="position:relative">
      <a class="banner" href="#/classe/${esc(c.id)}" data-act="pubcours" data-c="${esc(c.id)}">${bannerArt(c)}<h2>${esc(c.nom)}</h2>${c.section ? `<p>${esc(c.section)}</p>` : ""}<span class="teacher">${esc(R().prof.nom)}</span></a>
      ${avatarP(R().prof.nom, "lg ph")}
    </div>
    <div class="body"><span class="muted">Connecte-toi pour ouvrir ce cours.</span></div>
  </article>`;
}
const blocOutils = () => R().outils.map(g => `<section class="theme" style="--c:var(--${esc(g.couleur)})"><div class="themehead"><h2>${esc(g.matiere)}</h2></div>${g.liens.map(([n, d, u]) => `<div class="work"><a class="workrow" href="${esc(u)}" target="_blank" rel="noopener" style="padding:10px 8px;gap:16px"><span class="ico pale">${icon("links", "")}</span><span class="tt">${esc(n)}<br><small class="muted" style="font-weight:400">${esc(d)}</small></span><span class="muted">↗</span></a></div>`).join("")}</section>`).join("");
function vPublic(r){
  if (r.v === "simulations" || r.v === "physique") return VUES_PRO[r.v]().replace('<div class="homehead"><h1>', `<div class="homehead"><a class="linkbtn" href="#/">${icon("left")} Accueil</a></div><div class="homehead"><h1>`);
  if (r.v === "outils") return `<div class="page"><div class="homehead"><h1 style="font-size:1.6rem">Boîte à outils</h1><span style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><a class="linkbtn" href="#/">${icon("left")} Accueil</a>${btnConnexion("Se connecter avec Microsoft 365")}</span></div>${blocOutils()}${pageFoot()}</div>`;
  return `<div class="page wide home">
    <section class="pubhero">
      <div><h1>Bienvenue sur l'espace de cours de M. ${esc(nomProfSans())}</h1>
      <p class="muted">Cours, documents, devoirs et ressources de Physique-Chimie, SNT (Sciences Numériques et Technologie), SI (Sciences de l'Ingénieur), et Technologie. Connecte-toi avec ton compte Microsoft 365 du lycée (@${esc(CFG.domaine)}) pour accéder à tes cours.</p></div>
      <button class="btn pubbig pubm365" data-act="pubconnect"><img src="logo-m365-carre.png" alt="" width="26" height="26"> Se connecter avec Microsoft 365</button>
    </section>
    <nav class="pubres"><a href="#/simulations">${icon("atom")}<span><b>Simulations</b><small>Toutes les simulations PhET du programme, à côté de la page</small></span></a><a href="#/physique">${icon("ruler")}<span><b>Outils Scientifiques Importants</b><small>Unités, éléments, formules, chimie, SNT, SI…</small></span></a><a href="#/outils">${icon("tools")}<span><b>Boîte à outils</b><small>Les sites utiles par matière</small></span></a></nav>
    ${blocScientifique()}
    ${blocDecouvertes()}
    <section class="homepanel"><div class="homehead"><h1>Boîte à outils</h1><a class="linkbtn" href="#/outils">Tout voir ${icon("ext")}</a></div><div class="puboutils">${blocOutils()}</div></section>
    ${pageFoot()}</div>`;
}
function renderPublic(){
  const r = route();
  if (!ROUTES_PUBLIQUES.includes(r.v)) { demanderConnexion(location.hash); return; }
  app.innerHTML = topbarPublic() + `<div class="shell pubshell"><main class="content">${vPublic(r)}</main></div>`;
  const pg = app.querySelector("main.content > .page"); if (pg) pg.insertAdjacentHTML("afterbegin", pageHead());
  document.title = (r.v === "outils" ? "Boîte à outils · " : "") + "PhysiquePro";
}
/* page protégée demandée sans être connecté : on garde l'adresse pour y revenir après la connexion */
function demanderConnexion(suite){
  try { if (suite && suite !== "#/" && suite !== "#") localStorage.setItem("pp_next", suite); } catch (_) {}
  vLogin("Connecte-toi avec ton compte Microsoft 365 du lycée pour ouvrir cette page.", true);
}
