/* ---------- connexion ---------- */
function vLogin(message, info){
  app.innerHTML = `<div class="login"><div class="card">
    <div class="brand" style="cursor:default;padding:0">${logoSVG}<b>Physique<span>Pro</span></b></div>
    <div><h2 style="font-size:1.4rem">Connexion</h2><p class="muted" style="margin:.3rem 0 0">Utilise ton compte Microsoft 365 du lycée.</p></div>
    ${message ? `<div class="${info ? "notice" : "err"}">${message}</div>` : ""}
    <div class="field"><label for="mail">Adresse Microsoft 365</label><input id="mail" type="email" placeholder="prenom.nom@${esc(CFG.domaine)}" autocomplete="username"></div>
    <div id="mailErr" class="err" hidden></div>
    <button class="btn" id="loginBtn">Se connecter</button>
    <p class="muted" style="margin:0;font-size:.82rem">Tu passeras par la page Microsoft habituelle pour taper ton mot de passe, puis tu reviendras ici.</p>
    ${logos.replace('class="logos"', 'class="logos" style="justify-content:center;border-top:1px solid var(--line);padding-top:14px"')}
    ${S.public ? `<a href="#/" data-act="pubretour" class="linkbtn" style="justify-self:center">${icon("left")} Retour à l'accueil</a>` : ""}
  </div></div>`;
  const btn = document.getElementById("loginBtn"), inp = document.getElementById("mail");
  const lancer = async () => {
    const m = inp.value.trim().toLowerCase(), err = document.getElementById("mailErr");
    if (m && !m.endsWith("@" + CFG.domaine)) { err.hidden = false; err.textContent = "Cette adresse n'appartient pas au lycée. Utilise ton adresse en @" + CFG.domaine + "."; return; }
    btn.disabled = true; btn.textContent = "Redirection vers Microsoft…";
    try { localStorage.setItem("pp_fresh", "1"); } catch (_) {}
    const { error } = await sb.auth.signInWithOAuth({ provider: "azure", options: { scopes: "openid email profile", redirectTo: ICI, queryParams: m ? { login_hint: m } : { prompt: "select_account" } } });
    if (error) { btn.disabled = false; btn.textContent = "Se connecter"; err.hidden = false; err.textContent = "La connexion n'a pas pu démarrer : " + error.message; }
  };
  btn.onclick = lancer; inp.onkeydown = e => { if (e.key === "Enter") lancer(); };
}
const messageErreur = desc => /Database error saving new user|non autoris/i.test(desc) ? "Cette adresse n'est pas autorisée : seules les adresses @" + esc(CFG.domaine) + " peuvent se connecter." : "La connexion a échoué : " + esc(desc);

/* ---------- barre du haut ---------- */
const LOGOS_RAPIDES = { "logo-pronote": "logo-pronote.png", "logo-lycee": "logo-lycee.png", "logo-pix": "logo-pix.png", "logo-outlook": "logo-outlook.png", "logo-onedrive": "logo-onedrive.png" };
function quickIcon(k){
  if (LOGOS_RAPIDES[k]) return `<img class="qlogo" src="${LOGOS_RAPIDES[k]}" alt="">`;
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
    <nav class="quick" aria-label="Liens rapides">${R().liensUtiles.map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener" class="${l.principal ? "main" : ""}" style="--q:${esc(l.couleur)}"><span class="qi">${quickIcon(l.icone)}</span><span class="ql">${esc(l.nom)}</span></a>`).join("")}</nav>
    ${cloche()}
    <div class="dd ddplus"><button class="ib" data-act="dd" title="${S.prof ? "Créer un cours" : "Rejoindre un cours"}" aria-label="${S.prof ? "Créer un cours" : "Rejoindre un cours"}" aria-expanded="${S.dd}">${icon("plus")}</button>
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
    ${S.prof ? `<a class="it" href="#/suivi" ${cur("suivi")}>${icon("grade")}<span class="lbl">Suivi des élèves</span></a>` : ""}
    ${actives().map(c => `<a class="it" href="#/classe/${esc(c.id)}" ${r.v === "classe" && r.a === c.id ? 'aria-current="page"' : ""}><span class="ini" style="--bb:var(${C(c.couleur).b})">${esc((c.symbole || c.nom).slice(0, 3))}</span><span class="lbl">${esc(c.nom)}<small>${S.prof ? nbTxt(S.nbEleves[c.id]) : esc(c.section)}</small></span></a>`).join("")}
    <hr>${arch && S.prof ? `<a class="it" href="#/archives" ${cur("archives")}>${icon("archive")}<span class="lbl">Cours archivés</span></a>` : ""}
    <a class="it" href="#/outils" ${cur("outils")}>${icon("tools")}<span class="lbl">Boîte à outils</span></a>
    <a class="it" href="#/admin/profil" ${cur("admin")}>${icon("gear")}<span class="lbl">Paramètres</span></a>
  </nav>${S.drawer && window.innerWidth < 1100 ? `<div class="scrim" data-act="drawer"></div>` : ""}`;
}
const nbTxt = n => (n || 0) + " élève" + ((n || 0) > 1 ? "s" : "");
const pageHead = () => `<div class="foot headband"><span><b>PhysiquePro</b> · site de M. ${esc(R().prof.nom)}${R().prof.titre ? " · " + esc(R().prof.titre) : ""}</span>${logos}</div>`;
const pageFoot = () => `<div class="foot"><span><b>PhysiquePro</b> · site de M. ${esc(R().prof.nom)}${R().prof.titre ? " · " + esc(R().prof.titre) : ""}</span>${logos}</div>`;
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
  const menuEleve = !S.prof && !archivee ? `<div class="dd kebab"><button class="ib" data-act="menu" data-m="c${esc(c.id)}" aria-label="Options du cours">${icon("more")}</button>${S.menu === "c" + c.id ? `<div class="dd-menu">${deplacerMenu(c)}</div>` : ""}</div>` : "";
  const menu = !S.prof ? menuEleve : `<div class="dd kebab"><button class="ib" data-act="menu" data-m="c${esc(c.id)}" aria-label="Options du cours">${icon("more")}</button>${S.menu === "c" + c.id ? `<div class="dd-menu">
      ${archivee ? `<a href="#" data-act="archiver" data-c="${esc(c.id)}" data-on="0">${icon("restore")} Restaurer</a><a href="#" data-act="supprclasse" data-c="${esc(c.id)}" style="color:var(--bad)">${icon("trash")} Supprimer</a>`
        : `${c.code ? `<a href="#" data-act="copylien" data-code="${esc(c.code)}">${icon("links")} Copier le lien d'invitation</a>` : ""}<a href="#/classe/${esc(c.id)}/parametres">${icon("edit")} Modifier</a>${deplacerMenu(c)}<a href="#" data-act="copiercours" data-c="${esc(c.id)}">${icon("copy")} Copier</a><a href="#" data-act="archiver" data-c="${esc(c.id)}" data-on="1">${icon("archive")} Archiver</a>`}</div>` : ""}</div>`;
  return `<article class="ccard${archivee ? " archived" : " movable"}" data-cid="${esc(c.id)}" style="--bb:var(${k.b})">
    <div style="position:relative">
      <a class="banner" href="#/classe/${esc(c.id)}">${bannerArt(c)}<h2>${esc(c.nom)}</h2>${c.section ? `<p>${esc(c.section)}</p>` : ""}<span class="teacher">${S.prof ? nbTxt(S.nbEleves[c.id]) : esc(R().prof.nom)}</span></a>
      ${S.prof ? "" : avatarP(R().prof.nom, "lg ph")}
    </div>
    <div class="body">${body}</div>
    <div class="cfoot">
      ${S.prof ? `<a class="ib" href="#/classe/${esc(c.id)}/notes" title="Notes" aria-label="Notes de ${esc(c.nom)}">${icon("grade")}</a>` : `<a class="ib" href="#/todo" title="Mes travaux" aria-label="Mes travaux">${icon("todo")}</a>`}
      ${c.dossier_onedrive ? `<a class="ib" href="${esc(c.dossier_onedrive)}" target="_blank" rel="noopener" title="Dossier OneDrive du cours" aria-label="Dossier OneDrive de ${esc(c.nom)}">${icon("folder")}</a>` : ""}
      ${menu}
    </div></article>`;
}
function deplacerMenu(c){
  const l = actives(), i = l.findIndex(x => x.id === c.id);
  return `${i > 0 ? `<a href="#" data-act="deplacer" data-c="${esc(c.id)}" data-pos="0">${icon("up")} Placer en premier</a><a href="#" data-act="deplacer" data-c="${esc(c.id)}" data-pos="${i - 1}">${icon("left")} Déplacer avant</a>` : ""}${i < l.length - 1 ? `<a href="#" data-act="deplacer" data-c="${esc(c.id)}" data-pos="${i + 1}">${icon("right")} Déplacer après</a>` : ""}`;
}
function vAccueil(){
  const list = actives();
  if (!list.length) return `<div class="page">${S.prof ? `<div class="emptystate"><b>Aucun cours actif.</b><span>Crée ton premier cours avec le bouton + en haut de la page.</span><div><button class="btn" data-act="newclass">${icon("plus")} Créer un cours</button></div></div>` :
    `<div class="emptystate"><b>Tu n'es inscrit dans aucun cours pour l'instant.</b><span>Demande le code du cours à ton professeur, puis rejoins-le.</span><div><button class="btn" data-act="join">${icon("plus")} Rejoindre un cours</button></div></div>`}${pageFoot()}</div>`;
  return `<div class="page wide home">${blocRecent()}
    <section class="homepanel"><div class="homehead"><h1>Cours</h1><button class="linkbtn" data-act="${S.prof ? "newclass" : "join"}">${icon("plus")} ${S.prof ? "Ajouter un cours" : "Rejoindre un cours"}</button></div>
    <div class="cards">${list.map(c => carte(c, false)).join("")}</div></section>${pageFoot()}</div>`;
}
/* « À rendre récemment » (en haut de l'accueil, comme Classroom) */
function blocRecent(){
  const t = now(), avant = new Date(t - 7 * 864e5), apres = new Date(+t + 7 * 864e5);
  const dans = d => d.date_limite && D(d.date_limite) >= avant && D(d.date_limite) <= apres;
  const ok = o => !o.brouillon && D(o.publie_le) <= t && cls(o.classe_id) && !cls(o.classe_id).archive;
  let items = [...S.devoirs.filter(d => ok(d) && dans(d)).map(d => ({k:"devoir", o:d})), ...S.quiz.filter(q => ok(q) && dans(q) && q.mode === "note").map(q => ({k:"quiz", o:q}))];
  if (!S.prof) items = items.filter(it => it.k === "devoir" ? etat(it.o, moi()).t !== "Noté" : !resultatDe(it.o, S.user.id));
  items.sort((a, b) => D(a.o.date_limite) - D(b.o.date_limite));
  const ligne = it => { const o = it.o, c = cls(o.classe_id);
    let droite = "";
    if (S.prof && it.k === "devoir") { const el = elevesDuDevoir(o, inscritsDe(o.classe_id)); droite = `<span class="muted">${el.filter(e => renduDe(o, e.email)).length} rendu(s) / ${el.length}</span>`; }
    else if (!S.prof && it.k === "devoir") { const e = etat(o, moi()); droite = `<span class="pill ${e.k}">${e.t}</span>`; }
    return `<a class="recentrow" href="#/${it.k}/${o.id}" style="--c:var(${C(c.couleur).c})"><span class="ico">${icon(it.k === "devoir" && o.type === "question" ? "question" : it.k, "")}</span><span class="tt">${esc(o.titre)}<small>${esc(c.nom)} · ${dueTxt(D(o.date_limite)).replace("Échéance : ", "")}</small></span>${droite}</a>`; };
  return `<section class="recent${S.recent ? " open" : ""}"><div class="recenthead"><h2>${S.prof ? "À rendre récemment" : "À faire bientôt"}</h2>
      <button class="ib" data-act="recent" title="${S.recent ? "Réduire" : "Développer"}" aria-label="${S.recent ? "Réduire" : "Développer"}" aria-expanded="${S.recent}">${icon(S.recent ? "up" : "expand")}</button></div>
    ${S.recent ? (items.length ? `<div class="recentlist">${items.slice(0, 10).map(ligne).join("")}</div>` : `<p class="muted" style="margin:0">Aucun travail avec une date limite cette semaine ou la semaine dernière.</p>`) : ""}</section>`;
}
function vArchives(){
  const list = S.classes.filter(c => c.archive);
  return `<div class="page wide"><div class="homehead"><h1>Cours archivés</h1></div>
    <p class="muted" style="margin:0">Les cours archivés n'apparaissent plus sur l'accueil. Tu peux les restaurer ou les supprimer définitivement.</p>
    ${list.length ? `<div class="cards">${list.map(c => carte(c, true)).join("")}</div>` : `<div class="emptystate"><b>Aucun cours archivé.</b></div>`}${pageFoot()}</div>`;
}
