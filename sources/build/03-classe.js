/* ---------- page de cours : onglets ---------- */
function fluxVisible(c){ return S.prof || c.flux_mode !== "masque"; }
function peutPublier(c){ return S.prof || c.flux_mode === "eleves"; }
function peutCommenter(c){ return S.prof || c.flux_mode === "prof" || c.flux_mode === "eleves"; }
function teamsVisible(c){ return c.teams_url && (S.prof || c.teams_visible); }

function classTabs(c, tab){
  const T = []; if (fluxVisible(c)) T.push(["flux", "Flux"]);
  T.push(["travaux", "Travaux<span class=\"tl\"> et devoirs</span>"], ["personnes", "Personnes"]); T.push(["notes", S.prof ? "Notes" : "<span class=\"tl\">Mes notes</span><span class=\"tc\">Notes</span>"]);
  if (S.prof) T.push(["corriger", "À corriger"]);
  return `<div class="tabsbar" style="--c:var(${C(c.couleur).c})"><div class="tabs" role="tablist">${T.map(([k, l]) => `<a role="tab" aria-selected="${tab === k}" href="#/classe/${esc(c.id)}/${k}">${l}</a>`).join("")}</div>
    <div class="tabicons">
      ${teamsVisible(c) ? `<a class="ib" href="${esc(c.teams_url)}" target="_blank" rel="noopener" title="Visio Teams de la classe" aria-label="Visio Teams de la classe">${icon("video")}</a>` : ""}
      <a class="ib" href="#/agenda/${esc(c.id)}" title="Agenda du cours" aria-label="Agenda du cours">${icon("cal")}</a>
      ${S.prof && c.dossier_onedrive ? `<a class="ib" href="${esc(c.dossier_onedrive)}" target="_blank" rel="noopener" title="Dossier OneDrive du cours" aria-label="Dossier OneDrive du cours">${icon("folder")}</a>` : ""}
      ${S.prof ? `<button class="ib vueel" data-act="vueeleve" data-c="${esc(c.id)}" title="Afficher en tant qu'élève" aria-label="Afficher en tant qu'élève">${icon("eye")}</button>` : ""}
      ${S.prof ? `<a class="ib" href="#/classe/${esc(c.id)}/parametres" title="Paramètres du cours" aria-label="Paramètres du cours">${icon("gear")}</a>` : ""}
    </div></div>`;
}
/* vidéos YouTube : titre récupéré automatiquement + miniature */
const ytId = u => { const m = String(u || "").match(/(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/|\/live\/)([\w-]{11})/); return m ? m[1] : null; };
const YT = {}, ytEnCours = new Set();
async function titreYoutube(u){
  const id = ytId(u); if (!id) return null; if (YT[id]) return YT[id];
  const w = "https://www.youtube.com/watch?v=" + id;
  for (const api of ["https://www.youtube.com/oembed?format=json&url=", "https://noembed.com/embed?url="]) {
    try { const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 5000);
      const r = await fetch(api + encodeURIComponent(w), { signal: ctl.signal }); clearTimeout(t);
      if (r.ok) { const j = await r.json(); if (j && j.title) return YT[id] = j.title; } } catch (_) {}
  }
  return null;
}
const libelleGenerique = l => !l || /^(youtube|lien|vidéo youtube|chargement…)$/i.test(String(l).trim());
/* ---------- pièces jointes : cartes comme dans Google Classroom ---------- */
const TYPE_RES = { doc:["Microsoft Word","#185ABD","W"], xls:["Microsoft Excel","#107C41","X"], ppt:["Microsoft PowerPoint","#C43E1C","P"], pdf:["PDF","#D93025","PDF"], img:["Image","#1E8E3E","IMG"], vid:["Vidéo","#7B1FA2","▶"], zip:["Archive","#5F6368","ZIP"], txt:["Texte","#5F6368","TXT"] };
function familleRes(nom){
  const x = extDe(nom);
  if (/^(doc|dot|rtf|odt)/.test(x)) return "doc"; if (/^(xls|ods|csv)/.test(x)) return "xls"; if (/^(ppt|pps|odp)/.test(x)) return "ppt";
  if (x === "pdf") return "pdf"; if (/^(png|jpe?g|gif|webp|bmp|svg|heic)$/.test(x)) return "img"; if (/^(mp4|mov|avi|mkv|webm|mp3|wav|m4a)$/.test(x)) return "vid";
  if (/^(zip|rar|7z)$/.test(x)) return "zip"; if (/^(txt|md|py|html?|js|css)$/.test(x)) return "txt"; return "";
}
const domaineDe = u => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch (_) { return ""; } };
const MINI = {};          // vignettes déjà trouvées (id → url)
function vignetteRes(r, fam){
  const t = TYPE_RES[fam];
  const glyphe = t ? `<span class="rglyph" style="--g:${t[1]}">${t[2]}</span>` : r.url && domaineDe(r.url) ? `<img class="rfav" src="https://www.google.com/s2/favicons?domain=${encodeURIComponent(domaineDe(r.url))}&sz=64" alt="" loading="lazy" onerror="this.outerHTML='<span class=rglyph style=--g:#5F6368>URL</span>'">` : `<span class="rglyph" style="--g:#5F6368">${icon("links")}</span>`;
  let img = "";
  if (r.od && r.od.id) { const v = MINI["od:" + r.od.id]; if (v) img = v; else vignetteOD(r.od.id); }
  else if (!r.path && !fam && /^https?:/.test(r.url || "")) img = "https://s.wordpress.com/mshots/v1/" + encodeURIComponent(r.url) + "?w=320&h=240";
  else if (r.path && fam === "img" && (r.bucket || "documents") === "documents") { const v = (S.urls || {})[r.path]; if (v) img = v; else if (!MINI["p:" + r.path]) { MINI["p:" + r.path] = 1; urlsSignees([r.path]).then(() => { if ((S.urls || {})[r.path]) render(); }); } }
  return `<span class="rthumb${img ? " img" : ""}">${glyphe}${img ? `<img class="rimg" src="${esc(img)}" alt="" loading="lazy" onerror="this.parentNode.classList.remove('img');this.remove()">` : ""}</span>`;
}
function carteRes(r, ctx = {}){
  if (!r.path && ytId(r.url)) {
    const id = ytId(r.url), titre = !libelleGenerique(r.label) ? r.label : YT[id] || "Vidéo YouTube";
    if (libelleGenerique(r.label) && !YT[id] && !ytEnCours.has(id)) { ytEnCours.add(id); titreYoutube(r.url).then(t => { if (t) render(); }); }
    return `<div class="rcard"><a class="rtxt" href="${esc(r.url)}" target="_blank" rel="noopener"><b>${esc(titre)}</b><small>Vidéo YouTube</small></a><a class="rthumb img yt" href="${esc(r.url)}" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true"><img src="https://i.ytimg.com/vi/${id}/mqdefault.jpg" alt="" loading="lazy"><span class="ytplay">▶</span></a></div>`;
  }
  const nom = r.label || r.path || r.url || "", fam = familleRes(r.od || r.path ? nom : (r.label && /\.\w{2,5}$/.test(r.label) ? r.label : ""));
  const sous = fam ? TYPE_RES[fam][0] : r.url ? String(r.url).replace(/^https?:\/\//, "") : "Fichier";
  const tip = appOffice(nom) ? `title="Ouvrir dans ${appOffice(nom)} en ligne"` : `title="${esc(nom)}"`;
  const office = !S.prof && appOffice(nom) && r.od, copie = office ? copieDe(r, ctx) : null, tel = telephone();
  let lien = r.path ? `href="#" data-act="openfile" data-bucket="${esc(r.bucket || "documents")}" data-path="${esc(r.path)}"` : `href="${esc(S.prof && r.od && r.od.web ? r.od.web : r.url)}" target="_blank" rel="noopener"`;
  let tip2 = tip, etat = office ? " · à lire seulement" : "";
  if (copie) {
    /* téléphone : Word en ligne n'y permet que la lecture → fenêtre d'aide qui ouvre la copie dans l'appli Word */
    lien = tel ? `href="#" data-act="wordtel" data-copie="${esc(copie.id)}" data-devoir="${esc(ctx.devoir || "")}"` : `href="${esc(copie.web)}" target="_blank" rel="noopener"`;
    tip2 = `title="Ouvrir ta copie pour écrire dedans (${appOffice(nom)})"`; etat = " · ta copie : " + (tel ? "touche" : "clique") + " pour écrire dedans";
  }
  const dl = copie ? (copie.fichier && !tel ? `<a class="dlbtn" href="${esc(copie.fichier + "?download=1")}" target="_blank" rel="noopener" title="Télécharger ta copie" aria-label="Télécharger ta copie de ${esc(nom)}">${icon("down")}</a>` : "")
    : r.path ? btnDl(r.bucket || "documents", r.path, r.label) : r.url && /sharepoint\.com/i.test(r.url) && fam ? `<a class="dlbtn" href="${esc(r.url + (r.url.includes("?") ? "&" : "?") + "download=1")}" target="_blank" rel="noopener" title="Télécharger pour modifier sur l'ordinateur" aria-label="Télécharger ${esc(nom)}">${icon("down")}</a>` : "";
  return `<div class="rcard${copie ? " macopie" : ""}"><a class="rtxt" ${lien} ${tip2}><b>${esc(nom)}</b><small>${esc(sous)}${etat}</small></a>${dl}<a class="rthumb-l" ${lien} tabindex="-1" aria-hidden="true">${vignetteRes(r, fam)}</a></div>`;
}
const carteYoutube = r => carteRes(r);
function ressources(list, ctx = {}, cls = ""){
  if (!list || !list.length) return "";
  return `<div class="att rcards${cls ? " " + cls : ""}">${list.map(r => carteRes(r, ctx)).join("")}</div>`;
}
/* cartes pendant la rédaction (éditeur, annonce, dépôt élève) : aperçu + nom + type, bouton Retirer */
function carteEdit(r, act, i, note = ""){
  const id = !r.path && !r.pending && ytId(r.url);
  const nom = id ? (!libelleGenerique(r.label) ? r.label : YT[id] || "Vidéo YouTube") : r.label || r.path || r.url || "";
  if (id && libelleGenerique(r.label) && !YT[id] && !ytEnCours.has(id)) { ytEnCours.add(id); titreYoutube(r.url).then(t => { if (t) render(); }); }
  const fam = id ? "" : familleRes(r.od || r.path || r.pending ? nom : (r.label && /\.\w{2,5}$/.test(r.label) ? r.label : ""));
  const sous = id ? "Vidéo YouTube" : fam ? TYPE_RES[fam][0] : r.url ? domaineDe(r.url) || "Lien" : r.type && r.type !== "Fichier" ? r.type : "Fichier";
  const vign = id ? `<span class="rthumb img yt"><img src="https://i.ytimg.com/vi/${id}/mqdefault.jpg" alt="" loading="lazy"><span class="ytplay">▶</span></span>` : vignetteRes(r, fam);
  return `<div class="rcard redit"><span class="rtxt"><b title="${esc(nom)}">${esc(nom)}</b><small>${esc(sous)}${note}</small></span><button type="button" class="rrm" data-act="${act}" data-i="${i}" aria-label="Retirer ${esc(nom)}" title="Retirer">✕</button><span class="rthumb-l">${vign}</span></div>`;
}
const cartesEdit = (list, act, note) => list.length ? `<div class="att rcards">${list.map((x, i) => carteEdit(x, act, i, note ? note(x) : "")).join("")}</div>` : "";
const banniere = (c) => `<div class="banner bigbanner" style="--bb:var(${C(c.couleur).b})">${bannerArt(c)}${S.prof ? `<a class="btn ghost sm custom" href="#/classe/${esc(c.id)}/parametres">${icon("edit")} Personnaliser</a>` : ""}<h1>${esc(c.nom)}</h1><span>${esc(c.section)}</span>${c.description ? `<p class="bdesc">${esc(c.description)}</p>` : ""}</div>`;

function asideClasse(c){
  const up = S.devoirs.filter(d => d.classe_id === c.id && d.date_limite && ouvert(d) && !d.brouillon && (S.prof || !renduDe(d, moi()))).slice(0, 3);
  return `<aside class="caside">
    ${(c.liens && c.liens.length) || S.prof ? `<div class="box"><div class="boxhead"><h3>${S.prof ? "Liens de la classe" : "Liens utiles pour toi"}</h3>${S.prof ? `<button class="ib sm" data-act="editliens" data-c="${esc(c.id)}" aria-label="Modifier les liens" title="Modifier les liens">${icon("edit")}</button>` : ""}</div>
      <div class="classlinks">${(c.liens || []).map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${icon("links")}<span>${esc(l.nom)}</span></a>`).join("")}</div>
      ${S.prof && !(c.liens || []).length ? `<span class="muted" style="font-size:.82rem">Ajoute des liens utiles : manuel, simulateur, Capytale…</span>` : ""}</div>` : ""}
    <div class="box"><h3>À venir</h3>${up.length ? up.map(d => `<span class="muted" style="font-size:.8rem">${dueOf(d).replace("Échéance : ", "")}</span><a href="#/devoir/${d.id}" class="uplink">${esc(d.titre)}</a>`).join("") : `<span class="muted">Aucun devoir à remettre dans les jours qui viennent</span>`}<a class="linkbtn" href="${S.prof ? `#/classe/${esc(c.id)}/corriger` : "#/todo"}">Tout afficher</a></div>
    ${!S.prof && c.moyenne_visible ? `<div class="box"><h3>Ma moyenne</h3><span class="grade">${moyenneEleve(c) == null ? "–" : fmtNote(moyenneEleve(c))}<small>/20</small></span><span class="muted" style="font-size:.78rem">Calculée sur les notes rendues par ton professeur.</span></div>` : ""}
    ${teamsVisible(c) ? `<div class="box"><div class="boxhead"><h3>${icon("video")} Visio Teams</h3></div><a class="btn ghost" href="${esc(c.teams_url)}" target="_blank" rel="noopener" style="text-decoration:none">Rejoindre</a>${S.prof ? `<span class="muted" style="font-size:.78rem">${icon("eye")} ${c.teams_visible ? "Visible par les élèves" : "Masqué aux élèves"}</span>` : ""}</div>`
      : S.prof ? `<div class="box"><div class="boxhead"><h3>${icon("video")} Visio Teams</h3></div><a class="linkbtn" href="#/classe/${esc(c.id)}/parametres">Ajouter le lien de la visio</a></div>` : ""}
    ${S.prof ? `<div class="box"><div class="boxhead"><h3>Code du cours</h3><div class="dd kebab"><button class="ib sm" data-act="menu" data-m="code" aria-label="Options du code">${icon("more")}</button>${S.menu === "code" ? `<div class="dd-menu">
        <a href="#" data-act="showcode" data-code="${esc(c.code || "")}">${icon("qr")} QR code à projeter</a>
        <a href="#" data-act="copylien" data-code="${esc(c.code || "")}">${icon("links")} Copier le lien d'invitation</a>
        <a href="#" data-act="copycode" data-code="${esc(c.code || "")}">${icon("copy")} Copier le code</a>
        <a href="#" data-act="resetcode" data-c="${esc(c.id)}">${icon("key")} Réinitialiser</a>
        <a href="#" data-act="togglecode" data-c="${esc(c.id)}" data-on="${c.code_actif ? "0" : "1"}">${icon(c.code_actif ? "x" : "check")} ${c.code_actif ? "Désactiver" : "Activer"}</a></div>` : ""}</div></div>
      ${c.code_actif ? `<button class="codebig" data-act="showcode" data-code="${esc(c.code)}" title="Afficher en grand">${esc(c.code)} ${icon("expand")}</button>` : `<span class="muted">Désactivé</span>`}</div>` : ""}
  </aside>`;
}

/* ---------- Flux ---------- */
function vFlux(c, data){
  const items = data.annonces.filter(a => S.prof || D(a.publie_le || a.cree_le) <= now()).map(a => ({k:"annonce", date:D(a.publie_le || a.cree_le), a, pin:!!a.epingle}));
  if (c.flux_devoirs) {
    S.devoirs.filter(d => d.classe_id === c.id && !d.brouillon && D(d.publie_le) <= now()).forEach(d => items.push({k:"devoir", date:D(d.publie_le), o:d}));
    data.supports.filter(s => !s.brouillon && D(s.publie_le) <= now()).forEach(s => items.push({k:"support", date:D(s.publie_le), o:s}));
    S.quiz.filter(q => q.classe_id === c.id && !q.brouillon && D(q.publie_le) <= now()).forEach(q => items.push({k:"quiz", date:D(q.publie_le), o:q}));
  }
  items.sort((x, y) => (y.pin ? 1 : 0) - (x.pin ? 1 : 0) || y.date - x.date);
  const A = S.annonce && S.annonce.classe === c.id ? S.annonce : null;
  const composer = !peutPublier(c) ? "" : A ? `<section class="post composer">
      <div class="field"><label>${A.id ? "Modifier l'annonce" : "Pour : " + esc(c.nom) + " · tous les élèves"}</label>
      <div class="rte"><div id="anHtml" class="rtebody" contenteditable="true" role="textbox" aria-multiline="true" data-ph="Annoncez quelque chose à la classe">${rich(A.html)}</div>
      <div class="rtebar">${fmtBar()}</div></div></div>
      ${cartesEdit(A.ressources, "anrm")}
      ${S.prof && !A.id && actives().length > 1 ? `<details class="aussi"><summary>Publier aussi dans d'autres cours${(A.aussi || []).length ? " (" + A.aussi.length + ")" : ""}</summary>${actives().filter(x => x.id !== c.id).map(x => `<label class="check"><input type="checkbox" class="anAussi" value="${esc(x.id)}" ${(A.aussi || []).includes(x.id) ? "checked" : ""}> ${esc(x.nom)}</label>`).join("")}</details>` : ""}
      ${S.prof ? `<details class="aussi" ${A.quandD ? "open" : ""}><summary>${icon("clock")} Programmer la publication${A.quandD ? " (" + esc(new Date(A.quandD + "T" + (A.quandH || "08:00")).toLocaleString("fr-FR", {weekday:"short", day:"numeric", month:"short", hour:"2-digit", minute:"2-digit"})) + ")" : ""}</summary>
        <div class="dt2"><input id="anDate" type="date" class="anQuand" value="${esc(A.quandD || "")}" aria-label="Date de publication"><input id="anHeure" type="time" class="anQuand" value="${esc(A.quandH || "08:00")}" aria-label="Heure de publication"></div>
        <span class="muted" style="font-size:.8rem">Laisse la date vide pour publier tout de suite.${A.quandD ? ` <a href="#" data-act="anquandx">Retirer la date</a>` : ""}</span></details>` : ""}
      ${A.linkMode ? `<div class="linkform"><div class="field"><label for="anLinkUrl">Lien</label><input id="anLinkUrl" type="url" placeholder="https://…"></div><div class="field"><label for="anLinkLabel">Nom affiché <span class="muted">(facultatif)</span></label><input id="anLinkLabel"></div><div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn ghost sm" data-act="anlinkcancel">Annuler</button><button class="btn sm" data-act="anlinkadd">Ajouter</button></div></div>` : ""}
      <div class="composerfoot"><div style="display:flex;gap:4px">
        <button class="ib" data-act="anlink" title="Ajouter un lien OneDrive, YouTube ou site" aria-label="Ajouter un lien">${icon("links")}</button>
        ${S.prof ? `<button class="ib" data-act="anupload" title="Importer un fichier" aria-label="Importer un fichier">${icon("upload")}</button><input type="file" id="anFile" multiple hidden>` : ""}</div>
        <span class="spacer"></span><button class="btn ghost" data-act="ancancel">Annuler</button><button class="btn" data-act="anpost" ${A.busy ? "disabled" : ""}>${A.busy ? "Enregistrement…" : A.id ? "Enregistrer" : quandAnnonce(A) ? "Programmer" : "Publier"}</button></div>
    </section>` : `<button class="post annoncer" data-act="annoncer" data-c="${esc(c.id)}">${avatarP(S.nom)}<span>Annoncez quelque chose à la classe</span></button>`;
  const fluxMasque = S.prof && c.flux_mode === "masque" ? `<div class="notice">${icon("eye")} Le flux est actuellement <b>masqué aux élèves</b>. Tu peux changer ce réglage dans les <a href="#/classe/${esc(c.id)}/parametres">paramètres du cours</a>.</div>` : "";
  return `<div class="page" style="--c:var(${C(c.couleur).c})">${banniere(c)}
    <div class="classgrid">${asideClasse(c)}
      <div class="stream">${fluxMasque}${composer}
        ${items.length ? items.map(it => it.k === "annonce" ? vAnnonce(c, it.a, data) : vNotif(it)).join("") : `<section class="post emptyflux"><div><h3>C'est ici que vous pourrez communiquer avec ${S.prof ? "votre classe" : "ta classe"}</h3><p class="muted">${S.prof ? "Publie des annonces, et les nouveaux devoirs et documents apparaîtront ici." : "Les annonces de ton professeur apparaîtront ici."}</p>${S.prof ? `<a class="btn ghost sm" href="#/classe/${esc(c.id)}/parametres">${icon("gear")} Paramètres du flux</a>` : ""}</div></section>`}
      </div></div>${pageFoot()}</div>`;
}
function vNotif(it){
  const o = it.o, isQ = it.k === "devoir" && o.type === "question", href = it.k === "devoir" ? "#/devoir/" + o.id : it.k === "quiz" ? "#/quiz/" + o.id : "#/classe/" + o.classe_id + "/travaux";
  const lib = isQ ? "Nouvelle question" : it.k === "devoir" ? "Nouveau devoir" : it.k === "quiz" ? "Nouveau questionnaire" : "Nouveau support";
  return `<a class="post notif" href="${href}"><span class="ico">${icon(isQ ? "question" : it.k, "")}</span><span class="tt"><span class="nlib">${lib}</span>${esc(o.titre)}<small>${fmtQuand(it.date)} · ${esc(R().prof.nom)}</small></span></a>`;
}
function vAnnonce(c, a, data){
  const coms = data.coms.filter(x => x.annonce_id === a.id), mien = S.prof || a.auteur === S.user.id;
  const open = S.open === "an" + a.id || coms.length <= 2;
  const shown = open ? coms : coms.slice(-1);
  return `<section class="post${a.epingle ? " epingle" : ""}">
    <div class="posthead">${avatarP(a.auteur_nom)}<div style="flex:1;min-width:0"><b>${esc(a.auteur_nom)}</b><small class="muted">${fmtQuand(D(a.publie_le || a.cree_le))}</small>${a.epingle ? `<span class="tagpost pin">${icon("pin")} Épinglée</span>` : ""}${S.prof && a.publie_le && D(a.publie_le) > now() ? `<span class="tagpost prog">${icon("clock")} Programmée · ${esc(D(a.publie_le).toLocaleString("fr-FR", {weekday:"short", day:"numeric", month:"short", hour:"2-digit", minute:"2-digit"}))}</span>` : ""}</div>
      ${mien ? `<div class="dd kebab"><button class="ib sm" data-act="menu" data-m="a${a.id}" aria-label="Options de l'annonce">${icon("more")}</button>${S.menu === "a" + a.id ? `<div class="dd-menu"><a href="#" data-act="editannonce" data-id="${a.id}" data-c="${esc(c.id)}">${icon("edit")} Modifier</a>${S.prof ? `<a href="#" data-act="epingler" data-id="${a.id}" data-c="${esc(c.id)}" data-on="${a.epingle ? "0" : "1"}">${icon("pin")} ${a.epingle ? "Désépingler" : "Épingler en haut du flux"}</a>` : ""}<a href="#" data-act="copiertexte" data-id="${a.id}" data-c="${esc(c.id)}">${icon("copy")} Copier le texte</a><a href="#" data-act="supprannonce" data-id="${a.id}" data-c="${esc(c.id)}" style="color:var(--bad)">${icon("trash")} Supprimer</a></div>` : ""}</div>` : ""}</div>
    <div class="richtext" id="an-${a.id}">${rich(a.texte)}</div>${texteUtile(a.texte) ? `<div class="consignehead">${btnEcouter("an-" + a.id, "", true)}</div>` : ""}${ressources(a.ressources, { classe: a.classe_id })}
    <div class="coms">${coms.length ? `${!open ? `<button class="linkbtn" data-act="opencoms" data-id="${a.id}">${icon("people")} ${coms.length} commentaires sur le cours</button>` : `<span class="muted" style="font-size:.85rem">${icon("people")} ${coms.length} commentaire${coms.length > 1 ? "s" : ""} sur le cours</span>`}` : ""}
      ${shown.map(x => `<div class="com">${avatarP(x.auteur_nom, "sm")}<div style="flex:1;min-width:0"><b>${esc(x.auteur_nom)}</b> <small class="muted">${fmtQuand(D(x.cree_le))}</small><div>${linkify(x.texte)}</div></div>${S.prof || x.auteur === S.user.id ? `<button class="ib sm" data-act="supprcom" data-id="${x.id}" data-c="${esc(c.id)}" aria-label="Supprimer le commentaire" title="Supprimer">${icon("x")}</button>` : ""}</div>`).join("")}
      ${peutCommenter(c) ? `<div class="comform">${avatarP(S.nom, "sm")}<input id="cm-${a.id}" placeholder="${petitEcran() ? "Commenter…" : "Écrire un commentaire…"}" aria-label="Commentaire pour le cours"><button class="ib" data-act="comment" data-id="${a.id}" data-c="${esc(c.id)}" aria-label="Envoyer">${icon("send")}</button></div>` : ""}
    </div></section>`;
}
const fmtBar = () => [["bold","<b>G</b>","Gras"],["italic","<i>I</i>","Italique"],["underline","<u>S</u>","Souligné"],["superscript","x²","Exposant"],["subscript","x₂","Indice"],["insertUnorderedList","•≡","Liste à puces"],["removeFormat","✕","Effacer la mise en forme"]].map(([cmd, l, t]) => `<button class="ib sm" data-act="fmt" data-cmd="${cmd}" data-keepfocus="1" title="${t}" aria-label="${t}">${l}</button>`).join("")
  + `<button class="ib sm" data-act="symb" data-keepfocus="1" title="Symboles scientifiques" aria-label="Symboles scientifiques" aria-pressed="${!!S.symb}">Ω</button>` + (S.symb && !S.ed ? paletteSymb() : "");

/* ---------- Travaux et devoirs ---------- */
function itemsDuTheme(c, data, themeId){
  const items = [];
  data.supports.filter(s => (s.theme_id ?? null) === themeId).forEach(s => items.push({k:"support", id:"s" + s.id, titre:s.titre, date:D(s.publie_le), s}));
  S.devoirs.filter(d => d.classe_id === c.id && (d.theme_id ?? null) === themeId).forEach(d => items.push({k:"devoir", q2:d.type === "question", id:"d" + d.id, titre:d.titre, date:D(d.publie_le), d}));
  S.quiz.filter(q => q.classe_id === c.id && (q.theme_id ?? null) === themeId).forEach(q => items.push({k:"quiz", id:"q" + q.id, titre:q.titre, date:D(q.publie_le), q}));
  const pos = it => (it.s || it.d || it.q).position;
  return items.sort((a, b) => { const pa = pos(a), pb = pos(b);
    if (pa == null && pb == null) return b.date - a.date; if (pa == null) return -1; if (pb == null) return 1; return pa - pb; });
}
function workItem(it){
  const op = S.open === it.id, obj = it.s || it.d || it.q, draft = obj.brouillon, prog = !draft && D(obj.publie_le) > now();
  let right = "", detail = "";
  const cible = obj.eleves ? `<span class="pill">${obj.eleves.length} élève${obj.eleves.length > 1 ? "s" : ""}</span>` : "";
  if (it.k === "support") {
    right = `<span class="dt">Publié le ${fmtShort(it.date)}</span>`;
    detail = `${texteUtile(obj.description) ? `<div class="richtext wkdesc">${rich(obj.description)}</div>` : ""}${ressources(obj.ressources, { classe: obj.classe_id, support: obj.id }) || (texteUtile(obj.description) ? "" : `<span class="muted">Aucun fichier joint.</span>`)}`;
  } else if (it.k === "devoir") {
    const d = obj;
    right = S.prof ? `<span class="dt">${d.date_limite ? dueOf(d).replace("Échéance : ", "") : "Publié le " + fmtShort(it.date)}</span>` : `<span class="dt">${etat(d, moi()).t === "Manquant" ? `<span style="color:var(--bad)">Manquant</span>` : etat(d, moi()).t === "Noté" ? fmtNote(etat(d, moi()).note) + "/" + d.points : d.date_limite ? dueOf(d).replace("Échéance : ", "") : ""}</span>`;
    const st = etat(d, moi());
    detail = `<div class="wkhead"><div class="wkdl"><b>${d.date_limite ? "Date limite : " + fmtShort(D(d.date_limite)) + " " + fmtT(D(d.date_limite)) : "Aucune date limite"}</b><small>${it.q2 ? (d.question && d.question.format === "choix" ? "Question à choix multiples" : "Question à réponse courte") : d.mode === "binome" ? "Un rendu par binôme" : "Individuel"} · ${pts(d)}</small></div>
        ${S.prof ? statsDevoir(d) : `<span class="wkright"><span class="wkst ${st.k}">${libEtat(st.t)}</span><a class="wklink wkopen" href="#/devoir/${d.id}">${it.q2 ? "Afficher la question" : "Afficher le devoir"} ${icon("right")}</a></span>`}</div>
      ${texteUtile(d.consigne) ? `<div class="richtext wkdesc">${rich(d.consigne)}</div>` : ""}${ressources(d.ressources, { classe: d.classe_id, devoir: d.id })}
      ${S.prof ? `<div class="wkfoot"><a class="wklink" href="#/devoir/${d.id}">Afficher les instructions</a><a class="btn tonal" href="#/devoir/${d.id}">${it.q2 ? "Voir les réponses" : "Évaluer le travail"}</a></div>` : it.q2 && !renduDe(d, moi()) && depotOuvert(d) ? `<div class="wkfoot"><span></span><a class="btn tonal" href="#/devoir/${d.id}">Répondre</a></div>` : ""}`;
  } else {
    const q = obj, r = resultatDe(q, S.user.id);
    right = `<span class="dt">${!S.prof && r ? fmtNote(noteQuiz(q, r)) + "/" + q.points : q.date_limite ? dueTxt(D(q.date_limite)).replace("Échéance : ", "") : q.mode === "note" ? "Questionnaire noté" : "Entraînement"}</span>`;
    detail = `<div class="wkhead"><div class="wkdl"><b>${q.date_limite ? "Date limite : " + fmtShort(D(q.date_limite)) + " " + fmtT(D(q.date_limite)) : "Aucune date limite"}</b><small>${(q.questions || []).length} questions · ${q.mode === "note" ? "noté sur " + q.points + ", une seule tentative" : "entraînement, recommençable"}</small></div>${!S.prof ? `<span class="wkst ${r ? "ok" : ""}">${r ? "Fait" : "Attribué"}</span>` : ""}</div>
      ${texteUtile(q.consigne) ? `<div class="richtext wkdesc">${rich(q.consigne)}</div>` : ""}
      <div class="wkfoot"><a class="wklink" href="#/quiz/${q.id}">Afficher le questionnaire</a><a class="btn tonal" href="#/quiz/${q.id}">${S.prof ? "Voir les résultats" : r ? "Voir mon résultat" : "Commencer"}</a></div>`;
  }
  if (S.prof && draft) right = `<span class="dt draft">Brouillon</span>`;
  else if (S.prof && prog) right = `<span class="dt draft">Programmé · ${fmtShort(D(obj.publie_le))} ${fmtT(D(obj.publie_le))}</span>`;
  const typ = it.k === "support" ? "documentation" : it.k === "quiz" ? "questionnaire" : it.q2 ? "question" : "devoir", rid = it.id.slice(1);
  const menu = S.prof ? `<div class="dd kebab"><button class="ib" data-act="menu" data-m="i${it.id}" aria-label="Options">${icon("more")}</button>${S.menu === "i" + it.id ? `<div class="dd-menu">
      <a href="#/editer/${typ}/${rid}">${icon("edit")} Modifier</a>
      ${draft || prog ? `<a href="#" data-act="publier" data-k="${it.k}" data-id="${rid}">${icon("check")} Publier maintenant</a>` : ""}
      <a href="#" data-act="moveitem" data-wk="${it.k}:${rid}" data-to="first">${icon("up")} Placer en premier</a>
      <a href="#" data-act="moveitem" data-wk="${it.k}:${rid}" data-to="-1">${icon("up")} Monter</a>
      <a href="#" data-act="moveitem" data-wk="${it.k}:${rid}" data-to="1">${icon("down")} Descendre</a>
      <a href="#" data-act="moveitem" data-wk="${it.k}:${rid}" data-to="last">${icon("down")} Placer en dernier</a>
      <a href="#" data-act="dupliquer" data-k="${it.k}" data-id="${rid}">${icon("copy")} Dupliquer</a>
      <a href="#" data-act="reutiliser" data-k="${it.k}" data-id="${rid}">${icon("reuse")} Réutiliser dans un autre cours</a>
      <a href="#" data-act="suppr" data-k="${it.k}" data-id="${rid}" data-titre="${esc(it.titre)}" style="color:var(--bad)">${icon("trash")} Supprimer</a></div>` : ""}</div>` : "";
  return `<div class="work${draft ? " isdraft" : ""}"${S.prof ? ` data-wk="${it.k}:${rid}"` : ""}><div class="workrow"><button data-act="toggle" data-id="${it.id}" aria-expanded="${op}"><span class="ico ${it.k === "support" ? "pale" : ""}">${icon(it.q2 ? "question" : it.k, "")}</span><span class="tt">${esc(it.titre)}</span>${S.prof ? cible : ""}${right}</button>${menu}</div>${op ? `<div class="workd">${detail}</div>` : ""}</div>`;
}
function statsDevoir(d, lien = true){
  const el = elevesDuDevoir(d, inscritsDe(d.classe_id)), n = el.filter(e => renduDe(d, e.email)).length;
  const an = aCorriger(d);
  const bloc = (nb, txt, f) => lien ? `<a href="#/devoir/${d.id}" data-act="voirstat" data-d="${d.id}" data-f="${f}" title="Voir les élèves : ${txt.toLowerCase()}"><b>${nb}</b><small>${txt}</small></a>` : `<div><b>${nb}</b><small>${txt}</small></div>`;
  return `<span class="stats crstats">${bloc(n, "Remis", "remis")}${bloc(el.length - n, ouvert(d) ? "Attribués" : "Manquants", "attribues")}${an ? bloc(an, "À noter", "anoter") : ""}</span>`;
}
/* vrai texte (pas seulement « … » ou des espaces) */
function texteUtile(h){ return !!String(h || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;|&hellip;/g, " ").replace(/[\s.…·-]+/g, "").length;
}
function vTravaux(c, data){
  const groupes = data.themes.map((t, i) => ({t, i, titre:t.titre, items:itemsDuTheme(c, data, t.id)}));
  const sans = itemsDuTheme(c, data, null); if (sans.length) groupes.unshift({t:null, titre:"Aucun thème", items:sans});
  const visibles = groupes.filter(g => (S.prof || g.items.length) && (!S.prof || !S.filtreTheme || (g.t ? String(g.t.id) : "none") === S.filtreTheme));
  const themeMenu = g => !S.prof || !g.t ? "" : `<div class="dd kebab"><button class="ib" data-act="menu" data-m="t${g.t.id}" aria-label="Options du thème">${icon("more")}</button>${S.menu === "t" + g.t.id ? `<div class="dd-menu">
    <a href="#" data-act="renomtheme" data-id="${g.t.id}" data-titre="${esc(g.t.titre)}">${icon("edit")} Renommer</a>
    <a href="#" data-act="placertheme" data-id="${g.t.id}" data-titre="${esc(g.t.titre)}" data-c="${esc(c.id)}">${icon("reuse")} Déplacer avant / après…</a>
    ${g.i > 0 ? `<a href="#" data-act="movetheme" data-id="${g.t.id}" data-to="0" data-c="${esc(c.id)}">${icon("up")} Placer en premier</a><a href="#" data-act="movetheme" data-id="${g.t.id}" data-dir="-1" data-c="${esc(c.id)}">${icon("up")} Monter</a>` : ""}
    ${g.i < data.themes.length - 1 ? `<a href="#" data-act="movetheme" data-id="${g.t.id}" data-dir="1" data-c="${esc(c.id)}">${icon("down")} Descendre</a><a href="#" data-act="movetheme" data-id="${g.t.id}" data-to="999" data-c="${esc(c.id)}">${icon("down")} Placer en dernier</a>` : ""}
    <a href="#" data-act="supprtheme" data-id="${g.t.id}" data-titre="${esc(g.t.titre)}" data-c="${esc(c.id)}" style="color:var(--bad)">${icon("trash")} Supprimer</a></div>` : ""}</div>`;
  const gid = g => g.t ? String(g.t.id) : "none";
  const head = `<div class="travhead">
    ${S.prof ? `<div class="dd"><button class="btn" data-act="menu" data-m="create">${icon("plus")} Créer</button>${S.menu === "create" ? `<div class="dd-menu" style="left:0;right:auto">
      <a href="#/editer/devoir/new/${esc(c.id)}">${icon("devoir")} Devoir</a>
      <a href="#/editer/questionnaire/new/${esc(c.id)}">${icon("quiz")} Questionnaire</a>
      <a href="#/editer/question/new/${esc(c.id)}">${icon("question")} Question</a>
      <a href="#/editer/documentation/new/${esc(c.id)}">${icon("support")} Documentation</a>
      <a href="#" data-act="reutiliserdepuis" data-c="${esc(c.id)}">${icon("reuse")} Réutiliser un post</a>
      <hr><a href="#" data-act="newtheme" data-c="${esc(c.id)}">${icon("theme")} Thème</a></div>` : ""}</div>` : ""}
    ${S.prof && groupes.length > 1 ? `<div class="field filt"><label for="filtreTheme">Filtre thématique</label><select id="filtreTheme" data-f="filtre"><option value="">Tous les thèmes</option>${groupes.map(g => `<option value="${gid(g)}" ${S.filtreTheme === gid(g) ? "selected" : ""}>${esc(g.titre)}</option>`).join("")}</select></div>` : ""}
    <span class="spacer"></span>${groupes.length ? `<button class="linkbtn" data-act="toutreduire">${S.reduits.size ? "Tout développer" : "Tout réduire"}</button>` : ""}</div>`;
  return `<div class="page" style="--c:var(${C(c.couleur).c})">${head}
    ${visibles.length ? visibles.map(g => `<section class="theme${S.prof ? " movable" : ""}" data-tid="${gid(g)}"><div class="themehead">${S.prof && g.t ? `<span class="grip" title="Glisser pour déplacer" aria-hidden="true">⋮⋮</span>` : ""}<h2>${esc(g.titre)}</h2><button class="ib sm" data-act="reduire" data-id="${gid(g)}" aria-label="${S.reduits.has(gid(g)) ? "Développer" : "Réduire"}">${icon(S.reduits.has(gid(g)) ? "chevdown" : "chevup")}</button>${themeMenu(g)}</div>
      ${S.reduits.has(gid(g)) ? "" : g.t ? etapesChapitre(g, c) : g.items.length ? g.items.map(workItem).join("") : `<p class="empty">${S.prof ? "Aucun élément. Utilise « Créer » pour ajouter un devoir, un questionnaire ou une documentation." : "Rien pour l'instant."}</p>`}</section>`).join("")
      : `<div class="emptystate"><b>${S.prof ? "Crée ton premier élément" : "Aucun travail pour l'instant."}</b><span>${S.prof ? "Crée un thème (par exemple « Chapitre 1 »), puis ajoute des devoirs, des questionnaires et des documentations." : "Ton professeur n'a encore rien publié dans ce cours."}</span></div>`}
    ${pageFoot()}</div>`;
}

/* ---------- Personnes ---------- */
function vPersonnes(c, data){
  const el = data.eleves, selN = el.filter(e => S.pick.has(e.email)).length;
  return `<div class="page" style="max-width:820px;--c:var(${C(c.couleur).c})">
    <section class="people"><h2>Enseignants</h2><div class="person">${`<div class="avatar">${initials(R().prof.nom)}</div>`}<span>${esc(R().prof.nom)}</span></div></section>
    <section class="people"><h2>Élèves <small>${el.length} élève${el.length > 1 ? "s" : ""}${S.prof ? ` <button class="ib sm" data-act="ajouteleves" data-c="${esc(c.id)}" title="Ajouter des élèves" aria-label="Ajouter des élèves">${icon("invite")}</button>` : ""}</small></h2>
    ${S.prof ? `<div class="invitebar"><button class="btn ghost sm" data-act="ajouteleves" data-c="${esc(c.id)}">${icon("invite")} Ajouter des élèves</button>${c.code ? `<button class="btn ghost sm" data-act="copylien" data-code="${esc(c.code)}">${icon("links")} Copier le lien d'invitation</button><button class="btn ghost sm" data-act="showcode" data-code="${esc(c.code)}">${icon("expand")} Afficher le code</button>` : ""}</div>` : ""}
    ${S.prof && el.length ? `<div class="person" style="gap:12px;flex-wrap:wrap"><input type="checkbox" data-act="pickall" data-c="${esc(c.id)}" ${selN === el.length ? "checked" : ""} aria-label="Tout sélectionner"><div class="dd"><button class="btn ghost sm" data-act="menu" data-m="actions" ${selN ? "" : "disabled"}>Actions ▾</button>${S.menu === "actions" ? `<div class="dd-menu" style="left:0;right:auto"><a href="#" data-act="compose">${icon("mail")} Envoyer un e-mail</a><a href="#" data-act="autrescours" data-c="${esc(c.id)}">${icon("plus")} Ajouter à un autre cours</a><a href="#" data-act="retirersel" data-c="${esc(c.id)}" style="color:var(--bad)">${icon("trash")} Retirer de la classe</a></div>` : ""}</div><span class="muted" style="font-size:.85rem">${selN ? selN + " sélectionné" + (selN > 1 ? "s" : "") : ""}</span></div>` : ""}
    ${S.prof && S.compose ? composeBox(el.filter(e => S.pick.has(e.email))) : ""}
    ${el.length ? el.map(e => `<div class="person">${S.prof ? `<input type="checkbox" data-act="pick" data-e="${esc(e.email)}" ${S.pick.has(e.email) ? "checked" : ""} aria-label="Sélectionner ${esc(e.nom)}">` : ""}${avatarP(e.nom)}<span style="flex:1;min-width:0">${esc(e.nom)}${S.prof ? `<small class="muted" style="display:block;overflow-wrap:anywhere">${esc(e.email)}</small>` : ""}</span>${S.prof ? `<div class="dd kebab"><button class="ib sm" data-act="menu" data-m="p${esc(e.email)}" aria-label="Options">${icon("more")}</button>${S.menu === "p" + e.email ? `<div class="dd-menu"><a href="#" data-act="maileleve" data-e="${esc(e.email)}">${icon("mail")} Envoyer un e-mail</a><a href="#" data-act="renomeleve" data-e="${esc(e.email)}" data-n="${esc(e.nom)}">${icon("edit")} Modifier le nom</a><a href="#" data-act="autrescours" data-c="${esc(c.id)}" data-e="${esc(e.email)}">${icon("plus")} Ajouter à un autre cours</a><a href="#" data-act="retirer" data-e="${esc(e.email)}" data-n="${esc(e.nom)}" data-c="${esc(c.id)}" style="color:var(--bad)">${icon("trash")} Retirer de la classe</a></div>` : ""}</div>` : ""}</div>`).join("")
      : `<p class="empty">${S.prof ? "Aucun élève inscrit. Ajoute-les en collant ta liste (bouton « Ajouter des élèves »), ou envoie-leur le lien d'invitation." : "Aucun élève."}</p>`}
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
    if (col.k === "q") { const uid = uidDe(e.email), r = uid && resultatDe(col.o, uid); return r ? `<td class="cell"><span class="nv">${fmtNote(noteQuiz(col.o, r))}</span><span class="muted">/${col.o.points}</span></td>` : (col.o.date_limite && D(col.o.date_limite) > now() ? `<td class="cell"><span class="s muted">À faire</span></td>` : `<td class="cell"><span class="s" style="color:var(--bad)">Non fait</span></td>`); }
    const d = col.o; if (d.eleves && !d.eleves.includes(e.email)) return `<td class="cell na"></td>`;
    const r = renduDe(d, e.email), cr = correctionDe(r);
    if (!r) return `<td class="cell">${ouvert(d) ? "" : `<span class="s" style="color:var(--bad)">Manquant</span>`}</td>`;
    return `<td class="cell"><input class="gin" data-act="note" data-rendu="${r.id}" data-max="${d.points}" value="${cr && cr.note != null ? fmtNote(cr.note) : ""}" placeholder="__" aria-label="Note de ${esc(e.nom)}"><span class="muted">/${d.points}</span><span class="s ${cr && cr.publiee ? "" : "draftnote"}">${cr && cr.note != null ? (cr.publiee ? "" : "Brouillon") : "Rendu"}</span></td>`;
  };
  const moyEleve = e => moyenneDe(c, e.email, uidDe(e.email), false).moy;
  const moyCol = col => { const v = el.map(e => { if (col.k === "q") { const uid = uidDe(e.email), r = uid && resultatDe(col.o, uid); return r ? noteQuiz(col.o, r) : null; } const cr = correctionDe(renduDe(col.o, e.email)); return cr && cr.note != null ? Number(cr.note) : null; }).filter(x => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
  return `<div class="page wide" style="--c:var(${C(c.couleur).c})"><div class="homehead"><span></span><button class="btn ghost sm" data-act="exportnotes" data-c="${esc(c.id)}">${icon("down")} Exporter les notes (Excel)</button></div><div class="tablewrap"><table class="gradebook">
    <thead><tr><th class="first"><span class="muted">Élèves (${el.length})</span></th>${cols.map(col => `<th><small class="muted">${col.o.date_limite ? fmtShort(D(col.o.date_limite)) : "Aucune date limite"}</small><a href="${col.k === "d" ? "#/devoir/" + col.o.id : "#/quiz/" + col.o.id}">${esc(col.o.titre)}</a><small class="muted">sur ${col.o.points}${col.o.categorie ? " · " + esc(col.o.categorie) : ""}</small>
      ${col.k === "d" ? `<div class="dd kebab"><button class="ib sm" data-act="menu" data-m="g${col.o.id}" aria-label="Options de la colonne">${icon("more")}</button>${S.menu === "g" + col.o.id ? `<div class="dd-menu"><a href="#" data-act="rendretout" data-d="${col.o.id}">${icon("send")} Rendre toutes les notes</a><a href="#/devoir/${col.o.id}">${icon("devoir")} Ouvrir le devoir</a></div>` : ""}</div>` : ""}</th>`).join("")}<th>Moyenne<small class="muted">sur 20${(c.categories || []).length ? " · pondérée" : ""}</small></th></tr></thead>
    <tbody><tr class="avg"><td class="first">${icon("people")} Moyenne de la classe</td>${cols.map(col => `<td class="cell">${fmtNote(moyCol(col) == null ? null : Math.round(moyCol(col) * 10) / 10)}</td>`).join("")}<td class="cell"></td></tr>
    ${el.map(e => `<tr><td class="first"><span class="who2">${avatarP(e.nom, "sm")}${esc(e.nom)}</span></td>${cols.map(col => cell(col, e)).join("")}<td class="cell"><b>${fmtNote(moyEleve(e) == null ? null : Math.round(moyEleve(e) * 10) / 10)}</b></td></tr>`).join("")}
    </tbody></table></div>
    <p class="muted" style="margin:0;font-size:.85rem">Saisis une note directement dans une case : elle reste en <b>brouillon</b> (invisible pour l'élève) jusqu'à ce que tu cliques sur ⋮ → <b>Rendre toutes les notes</b> en haut de la colonne, ou sur « Rendre » dans le devoir.</p>${pageFoot()}</div>`;
}

/* ---------- Mes notes (élève) ---------- */
function vMesNotes(c){
  const lignes = [
    ...S.devoirs.filter(d => d.classe_id === c.id && !d.brouillon).map(d => { const e = etat(d, moi()); return { date: D(d.publie_le), titre: d.titre, href: "#/devoir/" + d.id, ic: d.type === "question" ? "question" : "devoir",
      statut: e.t === "Rendu" && d.type === "question" ? "Envoyée" : libEtat(e.t), k: e.k, note: e.t === "Noté" && e.note != null && d.points != null ? fmtNote(e.note) + "/" + d.points : d.points == null ? "Non noté" : "—", com: e.t === "Noté" && e.c ? e.c.commentaire : "", due: d.date_limite ? dueOf(d).replace("Échéance : ", "") : "" }; }),
    ...S.quiz.filter(q => q.classe_id === c.id && !q.brouillon && q.mode === "note").map(q => { const r = resultatDe(q, S.user.id), ferme = q.date_limite && D(q.date_limite) <= now();
      return { date: D(q.publie_le), titre: q.titre, href: "#/quiz/" + q.id, ic: "quiz", statut: r ? "Noté" : libEtat(ferme ? "Manquant" : "Attribué"), k: r ? "ok" : ferme ? "bad" : "", note: r ? fmtNote(noteQuiz(q, r)) + "/" + q.points : "—", com: "", due: q.date_limite ? dueTxt(D(q.date_limite)).replace("Échéance : ", "") : "" }; })
  ].sort((a, b) => b.date - a.date);
  const moy = c.moyenne_visible ? moyenneEleve(c) : null, md = c.moyenne_visible ? moyenneDe(c, moi(), S.user.id, true) : { parCat: [] };
  return `<div class="page" style="max-width:860px;--c:var(${C(c.couleur).c})">
    <div class="mesnotes-head"><div class="who2">${avatarP(S.nom, "lg")}<div><b style="font-size:1.2rem">${esc(S.nom)}</b><small class="muted" style="display:block">${esc(moi())}</small></div></div>
      ${c.moyenne_visible ? `<div class="grade">${moy == null ? "–" : fmtNote(moy)}<small>/20</small></div>` : ""}</div>
    ${md.parCat.length ? `<div class="chips">${md.parCat.map(x => `<span class="chip static">${esc(x.nom)} · coef ${fmtNote(x.coef)} : <b>${fmtNote(arrondi1(x.moy))}</b>/20</span>`).join("")}</div>` : ""}
    ${lignes.length ? `<section class="group">${lignes.map(l => `<div class="work"><a class="workrow" href="${l.href}" style="padding:12px 18px;gap:16px"><span class="ico">${icon(l.ic, "")}</span><span class="tt">${esc(l.titre)}<br><small class="muted" style="font-weight:400">${l.due ? esc(l.due) + " · " : ""}<span class="pill ${l.k}">${esc(l.statut)}</span></small>${l.com ? `<small class="muted" style="display:block;font-weight:400">${icon("comment")} ${esc(l.com)}</small>` : ""}</span><span class="dt mono">${esc(l.note)}</span></a></div>`).join("")}</section>`
      : `<div class="emptystate"><b>Aucun travail pour l'instant.</b><span>Tes devoirs, questions et questionnaires notés apparaîtront ici avec tes notes.</span></div>`}
    ${tableCompetencesEleve(c.id, moi())}
    ${pageFoot()}</div>`;
}
function vClasse(r, data){
  const c = cls(r.a); if (!c) return `<div class="page"><div class="emptystate"><b>Cours introuvable.</b><a href="#/">Retour à l'accueil</a></div></div>`;
  let tab = ["flux", "travaux", "personnes", "notes"].concat(S.prof ? ["corriger"] : []).includes(r.t) ? r.t : (fluxVisible(c) ? "flux" : "travaux");
  if (tab === "flux" && !fluxVisible(c)) tab = "travaux";
  const inner = tab === "flux" ? vFlux(c, data) : tab === "personnes" ? vPersonnes(c, data) : tab === "notes" ? (S.prof ? vNotes(c, data) : vMesNotes(c)) : tab === "corriger" ? vCorrigerClasse(c) : vTravaux(c, data);
  return classTabs(c, tab) + inner;
}
