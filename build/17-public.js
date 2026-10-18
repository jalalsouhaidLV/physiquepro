/* ---------- page d'accueil publique (visiteur non connecté) ---------- */
const PUB = { classes: [], charge: false };
const ROUTES_PUBLIQUES = ["accueil", "outils"];
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
    <div class="crumbs"><a class="brand" href="#/" style="text-decoration:none;color:inherit">${logoSVG}<b>Physique<span>Pro</span></b></a></div>
    <span class="spacer"></span>
    <nav class="quick" aria-label="Liens rapides">${R().liensUtiles.map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener" class="${l.principal ? "main" : ""}" style="--q:${esc(l.couleur)}"><span class="qi">${quickIcon(l.icone)}</span><span class="ql">${esc(l.nom)}</span></a>`).join("")}</nav>
    ${btnConnexion("Se connecter", "pubbtn")}
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
  if (r.v === "outils") return `<div class="page"><div class="homehead"><h1 style="font-size:1.6rem">Boîte à outils</h1><a class="linkbtn" href="#/">${icon("left")} Accueil</a></div>${blocOutils()}${pageFoot()}</div>`;
  return `<div class="page wide home">
    <section class="pubhero">
      <div><h1>Bienvenue sur l'espace de cours de M. ${esc(R().prof.nom)}</h1>
      <p class="muted">Cours, documents, devoirs et questionnaires de physique-chimie, SNT et sciences de l'ingénieur. Connecte-toi avec ton compte Microsoft 365 du lycée (@${esc(CFG.domaine)}) pour accéder à tes cours.</p></div>
      ${btnConnexion("Se connecter avec Microsoft 365", "pubbig")}
    </section>
    <section class="homepanel"><div class="homehead"><h1>Cours</h1></div>
      ${PUB.classes.length ? `<div class="cards">${PUB.classes.map(cartePublique).join("")}</div>` : `<p class="muted" style="margin:0">Connecte-toi pour voir tes cours.</p>`}</section>
    <section class="homepanel"><div class="homehead"><h1>Boîte à outils</h1></div>${blocOutils()}</section>
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
