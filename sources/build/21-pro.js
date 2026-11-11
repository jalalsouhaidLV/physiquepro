/* =====================================================================
   PhysiquePro · améliorations « pro » (barre d'applications, recherche,
   tableau de bord, semaine, correction rapide, thème, etc.)
   ===================================================================== */

/* ---------- #2 Barre du haut : favoris + lanceur « Applications » ---------- */
IC.apps = '<circle cx="5" cy="5" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="12" cy="19" r="2"/><circle cx="19" cy="19" r="2"/>';
IC.star = '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>';
/* Lot H (4e évaluation, 11/11/2026, choix de Jalal) : logos montrés en haut tant que la personne n'a pas choisi ses favoris (étoile dans Applications) */
const FAVORIS_DEFAUT_ELEVE = ["Pronote Verdun", "PIX", "WhatsApp Web", "E-mail Outlook", "OneDrive", "NumWorks"];
const FAVORIS_DEFAUT_PROF = ["Pronote Verdun", "PIX Orga", "WhatsApp Web", "E-mail Outlook", "OneDrive", "Atena", "Calendrier"];
const FAVORIS_MAX = 24;
const cleFavoris = () => "pp_favoris3_" + (S.user && S.user.id);
const liensVisibles = () => R().liensUtiles.filter(l => l.nom && (!l.prof || S.prof));
function favorisNoms(){
  let f = null; try { f = JSON.parse(localStorage.getItem(cleFavoris()) || "null"); } catch (_) {}
  const noms = liensVisibles().map(l => l.nom);
  if (!Array.isArray(f)) f = S.prof ? FAVORIS_DEFAUT_PROF : FAVORIS_DEFAUT_ELEVE;
  return f.filter(n => noms.includes(n));
}
const liensFavoris = () => { const f = favorisNoms(); return liensVisibles().filter(l => f.includes(l.nom)); };
function basculerFavori(nom){
  let f = favorisNoms();
  if (f.includes(nom)) f = f.filter(n => n !== nom);
  else { if (f.length >= FAVORIS_MAX) { toast(`${FAVORIS_MAX} favoris au maximum : retire d'abord une étoile.`); return; } f.push(nom); }
  try { localStorage.setItem(cleFavoris(), JSON.stringify(f)); } catch (_) {}
}
const classesLien = l => `${l.principal ? "main" : ""}${l.prof ? " qprof" : ""}${l.ordi ? " qordi" : ""}${COTE_A_COTE[l.icone] ? " qside" + (SP.cle === l.icone ? " on" : "") : ""}`;
const lienRapide = l => `<a href="${esc(l.url)}" target="_blank" rel="noopener" class="${classesLien(l)}" data-cle="${esc(l.icone || "")}" style="--q:${esc(l.couleur)}" title="${esc(l.nom)}"><span class="qi">${quickIcon(l.icone)}</span><span class="ql">${esc(l.nom)}</span></a>`;
function lanceurApps(){
  const L = liensVisibles(), f = favorisNoms();
  return `<div class="dd apps"><button class="ib appsbtn" data-act="apps" title="Toutes les applications" aria-label="Toutes les applications" aria-expanded="${!!S.apps}">${icon("apps")}</button>
    ${S.apps ? `<div class="dd-menu appsmenu" role="menu"><div class="appstete"><b>Applications</b><small>★ = affichée dans la barre du haut</small></div>
      <div class="appsgrille">${L.map(l => `<div class="apptuile${f.includes(l.nom) ? " fav" : ""}"><a href="${esc(l.url)}" target="_blank" rel="noopener" class="${classesLien(l).replace("qordi", "")}" data-cle="${esc(l.icone || "")}" style="--q:${esc(l.couleur)}"><span class="qi">${quickIcon(l.icone)}</span><span class="ql">${esc(l.nom)}</span></a>
        <button class="appetoile" data-act="favori" data-nom="${esc(l.nom)}" title="${f.includes(l.nom) ? "Retirer de la barre du haut" : "Afficher dans la barre du haut"}" aria-label="${f.includes(l.nom) ? "Retirer " : "Ajouter "}${esc(l.nom)} ${f.includes(l.nom) ? "de" : "à"} la barre du haut" aria-pressed="${f.includes(l.nom)}">${icon("star")}</button></div>`).join("")}</div></div>` : ""}</div>`;
}
document.addEventListener("click", e => { if (e.target.closest && e.target.closest(".appsmenu a")) setTimeout(() => { if (S.apps) { S.apps = false; render(); } }, 50); });

/* ---------- #8 Tableau de bord (accueil) ---------- */
IC.search = '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>';
IC.flask = IC.flask || '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3"/>';
IC.week = '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M9 5v14M15 5v14"/>';
const premierPrenom = () => { const n = String(S.nom || "").trim().split(/\s+/); const p = n.find(x => x !== x.toUpperCase()) || n[0] || ""; return p; };
const salut = () => { const h = now().getHours(); return h < 5 ? "Bonne nuit" : h < 18 ? "Bonjour" : "Bonsoir"; };
let tdbCharge = false;
function chargerPourTableau(){
  sauvegardeAuto();
  if (tdbCharge) return; tdbCharge = true;
  const L = [];
  if (!S.rdv && typeof chargerRdv === "function") L.push(chargerRdv().catch(() => {}));
  if (S.prof && !S.demandes && typeof chargerDemandes === "function") L.push(chargerDemandes().catch(() => {}));
  if (L.length) Promise.all(L).then(() => { if (route().v === "accueil" && !S.modal) render(); });
}
const tuile = (href, ic, n, lib, ton, sous) => n === 0 ? "" : `<a class="kpi ${ton || ""}" href="${href}"><span class="kpiic">${icon(ic)}</span><span class="kpitxt"><b>${n}</b><span>${lib}</span>${sous ? `<small>${sous}</small>` : ""}</span></a>`;
function blocTableauDeBord(){
  chargerPourTableau();
  const t = now(), dans7 = new Date(+t + 7 * 864e5), aujourdhui = d => sameDay(D(d), t);
  const vis = o => !o.brouillon && cls(o.classe_id) && !cls(o.classe_id).archive;
  let tuiles = "";
  if (S.prof) {
    const dvs = S.devoirs.filter(vis), acor = dvs.reduce((a, d) => a + aCorriger(d), 0);
    const premier = actives().find(c => dvs.some(d => d.classe_id === c.id && aCorriger(d) > 0));
    const urg = typeof nbUrgents === "function" ? nbUrgents() : 0, alertes = typeof alertesEleves === "function" ? alertesEleves().length : 0;
    const crs = S.rdv ? S.rdv.creneaux.filter(c => aujourdhui(c.debut)) : [], rdvJour = S.rdv ? S.rdv.resa.filter(r => crs.some(c => c.id === r.creneau_id)).length : null;
    const tps = (S.demandes || []).filter(x => x.date_tp && D(x.date_tp) >= new Date(+t - 864e5 / 2) && D(x.date_tp) <= dans7);
    const prochain = dvs.filter(d => d.date_limite && D(d.date_limite) > t).sort((a, b) => D(a.date_limite) - D(b.date_limite))[0];
    tuiles = tuile(premier ? `#/classe/${esc(premier.id)}/corriger` : "#/todo", "check", acor, acor > 1 ? "copies à corriger" : "copie à corriger", acor ? "warn" : "ok", premier && acor ? esc(premier.nom) : acor ? "" : "Tout est corrigé")
      + tuile("#/urgences", "urgent", urg, urg > 1 ? "messages urgents" : "message urgent", urg ? "bad" : "ok", urg ? "non lu" + (urg > 1 ? "s" : "") : "Rien de nouveau")
      + tuile("#/rendezvous", "rdv", rdvJour == null ? "…" : rdvJour, "rendez-vous aujourd'hui", rdvJour ? "info" : "", crs.length ? crs.length + " créneau" + (crs.length > 1 ? "x" : "") + " prévu" + (crs.length > 1 ? "s" : "") : "")
      + tuile("#/suivi", "alerte", alertes, alertes > 1 ? "élèves à surveiller" : "élève à surveiller", alertes ? "warn" : "ok", alertes ? "décrochage possible" : "Tout va bien")
      + tuile("#/preparateur", "flask", S.demandes ? tps.length : "…", "TP cette semaine", tps.some(x => x.statut === "brouillon") ? "warn" : "", tps.length ? tps.filter(x => x.statut === "prete").length + " prêt(s) · " + tps.filter(x => x.statut === "brouillon").length + " à envoyer" : "")
      + (() => { const n = [...S.devoirs, ...S.quiz].filter(o => !o.brouillon && o.publie_le && D(o.publie_le) > t).length; return n ? tuile("#/programmes", "cal", n, n > 1 ? "publications programmées" : "publication programmée", "info", "apparaîtront automatiquement") : ""; })()
      + (prochain ? tuile(`#/devoir/${prochain.id}`, "cal", fmtShort(D(prochain.date_limite)), "prochaine échéance", "", esc(prochain.titre)) : "");
  } else {
    const dvs = S.devoirs.filter(d => vis(d) && D(d.publie_le) <= t);
    const semaine = dvs.filter(d => d.date_limite && D(d.date_limite) > t && D(d.date_limite) <= dans7 && etat(d, moi()).t === "Attribué").length;
    const manq = dvs.filter(d => etat(d, moi()).t === "Manquant").length;
    const notes = dvs.filter(d => { const e = etat(d, moi()); return e.t === "Noté" && e.c && D(e.c.modifie_le || e.c.cree_le || 0) > new Date(+t - 7 * 864e5); }).length;
    const rep = typeof reponsesNonVues === "function" ? reponsesNonVues() : 0;
    const maResa = S.rdv ? S.rdv.resa.filter(r => r.eleve === S.user.id).map(r => S.rdv.creneaux.find(c => c.id === r.creneau_id)).filter(c => c && D(c.debut) > t).sort((a, b) => D(a.debut) - D(b.debut))[0] : null;
    tuiles = tuile("#/semaine", "week", semaine, "à rendre cette semaine", semaine ? "info" : "ok", semaine ? "" : "Rien d'urgent")
      + tuile("#/todo", "alerte", manq, manq > 1 ? "travaux manquants" : "travail manquant", manq ? "bad" : "ok", manq ? "à rattraper" : "Aucun retard")
      + tuile("#/todo", "grade", notes, notes > 1 ? "nouvelles notes" : "nouvelle note", notes ? "info" : "", "ces 7 derniers jours")
      + (rep ? tuile("#", "urgent", rep, rep > 1 ? "réponses de " + esc(nomProfCourt()) : "réponse de " + esc(nomProfCourt()), "bad", "Message urgent").replace('href="#"', 'href="#" data-act="urgchoix"') : "")
      + (maResa ? tuile("#/rendezvous", "rdv", fmtShort(D(maResa.debut)), "prochain rendez-vous", "info", fmtT(D(maResa.debut))) : "");
  }
  return `<section class="tdb"><div class="tdbhead"><div><h1>${salut()} ${esc(premierPrenom())}</h1><p>${esc(fmtD(t).replace(/^./, m => m.toUpperCase()))}</p></div>
      <button class="tdbsearch" data-act="recherche" aria-label="Rechercher (Ctrl+K)">${icon("search")}<span>Rechercher un cours, un devoir${S.prof ? ", un élève" : ""}…</span><kbd>Ctrl K</kbd></button></div>
    ${tuiles ? `<div class="kpis">${tuiles}</div>` : `<div class="kpiok">${icon("check")}<span><b>Tout est à jour</b><small>${S.prof ? "Aucune copie à corriger, aucun message urgent, aucun élève à surveiller." : "Rien à rendre cette semaine, aucun retard."}</small></span></div>`}</section>`;
}

/* ---------- #7 Recherche universelle (Ctrl+K) ---------- */
function indexRecherche(){
  const L = [], t = now();
  const pages = [["#/", "home", "Accueil"], ["#/agenda", "cal", "Agenda"], ["#/semaine", "week", "Ma semaine"], [S.prof ? "#/todo" : "#/todo", "todo", S.prof ? "Toutes les copies à corriger" : "À faire"], ["#/rendezvous", "rdv", "Rendez-vous"],
    ["#/outils", "tools", "Boîte à outils"], ["#/physique", "flask", "Outils Scientifiques Importants (unités, éléments, formules, chimie, SNT, SI…)"], ["#/simulations", "eye", "Simulations (PhET, GeoGebra…)"], ["#/revisions", "quiz", "Fiches de révision et flashcards"], ["#/admin/profil", "gear", "Paramètres"]];
  if (S.prof) pages.push(["#/programmes", "cal", "Publications programmées"], ["#/suivi", "grade", "Suivi des élèves"], ["#/urgences", "urgent", "Messagerie d'urgence"], ["#/preparateur", "flask", "Demande de matériel au préparateur"], ["#/archives", "archive", "Cours archivés"]);
  pages.forEach(([h, ic, n]) => L.push({ t: "Page", ic, n, h }));
  L.push({ t: "Action", ic: "note", n: "Ouvrir le Coin Perso", act: "coinperso" });
  if (S.prof) { L.push({ t: "Action", ic: "plus", n: "Créer un cours", act: "newclass" }); actives().forEach(c => { L.push({ t: "Action", ic: "devoir", n: "Nouveau devoir · " + c.nom, h: `#/editer/devoir/new/${c.id}` }); L.push({ t: "Action", ic: "support", n: "Nouvelle documentation · " + c.nom, h: `#/editer/documentation/new/${c.id}` }); }); }
  else L.push({ t: "Action", ic: "plus", n: "Rejoindre un cours", act: "join" });
  S.classes.forEach(c => L.push({ t: c.archive ? "Cours archivé" : "Cours", ic: "people", n: c.nom, s: c.section, h: `#/classe/${c.id}`, c: c.couleur }));
  S.devoirs.filter(d => S.prof || (!d.brouillon && D(d.publie_le) <= t)).forEach(d => { const c = cls(d.classe_id); L.push({ t: d.brouillon ? "Brouillon" : d.type === "question" ? "Question" : "Devoir", ic: d.type === "question" ? "question" : "devoir", n: d.titre, s: c ? c.nom : "", h: `#/devoir/${d.id}`, c: c && c.couleur }); });
  S.quiz.filter(q => S.prof || !q.brouillon).forEach(q => { const c = cls(q.classe_id); L.push({ t: "Questionnaire", ic: "quiz", n: q.titre, s: c ? c.nom : "", h: `#/quiz/${q.id}`, c: c && c.couleur }); });
  Object.entries(S.cache).forEach(([cid, data]) => (data.supports || []).forEach(s => { const c = cls(cid); L.push({ t: "Documentation", ic: "support", n: s.titre, s: c ? c.nom : "", h: `#/classe/${cid}/travaux`, c: c && c.couleur }); }));
  if (S.prof) (S.toutesInscriptions || []).forEach(e => { const c = cls(e.classe_id); if (c && !c.archive) L.push({ t: "Élève", ic: "people", n: e.nom || nomDepuisEmail(e.email), s: c.nom + " · " + e.email, eleve: e.email, cid: c.id, c: c.couleur }); });
  liensVisibles().forEach(l => L.push({ t: "Application", ic: "links", n: l.nom, url: l.url, cle: l.icone, logo: LOGOS_RAPIDES[l.icone] }));
  return L;
}
const RCH = { L: [], i: 0, res: [] };
function ouvrirRecherche(){
  if (document.getElementById("rechBox")) return;
  RCH.L = indexRecherche(); RCH.i = 0;
  const box = document.createElement("div"); box.id = "rechBox";
  box.innerHTML = `<div class="rechvoile"></div><div class="rech" role="dialog" aria-modal="true" aria-label="Recherche">
    <div class="rechin">${icon("search")}<input type="search" placeholder="Rechercher un cours, un devoir${S.prof ? ", un élève" : ""}, une page, une application…" aria-label="Rechercher" autocomplete="off" spellcheck="false"><kbd>Échap</kbd></div>
    <div class="rechres" role="listbox"></div>
    <div class="rechpied"><span><kbd>↑</kbd><kbd>↓</kbd> naviguer</span><span><kbd>Entrée</kbd> ouvrir</span><span><kbd>Ctrl</kbd><kbd>K</kbd> partout sur le site</span></div></div>`;
  document.body.appendChild(box);
  const inp = box.querySelector("input"), zone = box.querySelector(".rechres");
  const dessiner = () => {
    const q = sansAccent(inp.value.trim()), mots = q.split(/\s+/).filter(Boolean);
    let res = mots.length ? RCH.L.map(x => { const h = sansAccent(x.n + " " + (x.s || "") + " " + x.t); if (!mots.every(m => h.includes(m))) return null; const n = sansAccent(x.n); return { x, sc: (n.startsWith(mots[0]) ? 0 : 10) + (x.t === "Page" || x.t === "Cours" ? 0 : 3) + n.length / 100 }; }).filter(Boolean).sort((a, b) => a.sc - b.sc).map(o => o.x)
      : RCH.L.filter(x => x.t === "Cours" || x.t === "Page").slice(0, 14);
    RCH.res = res.slice(0, 40); RCH.i = Math.min(RCH.i, Math.max(0, RCH.res.length - 1));
    zone.innerHTML = RCH.res.length ? RCH.res.map((x, i) => `<button class="rechit${i === RCH.i ? " sel" : ""}" data-i="${i}" role="option" aria-selected="${i === RCH.i}" ${x.c ? `style="--c:var(${C(x.c).c})"` : ""}>
        <span class="rechic">${x.logo ? `<img src="${esc(x.logo)}" alt="">` : icon(x.ic)}</span><span class="rechtx"><b>${esc(x.n)}</b>${x.s ? `<small>${esc(x.s)}</small>` : ""}</span><span class="rechtype">${esc(x.t)}</span></button>`).join("")
      : `<p class="rechvide">Aucun résultat pour « ${esc(inp.value)} ».</p>`;
    const s = zone.querySelector(".sel"); if (s) s.scrollIntoView({ block: "nearest" });
  };
  const choisir = i => { const x = RCH.res[i]; if (!x) return; fermerRecherche();
    if (x.url) { const a = document.querySelector(`.quick a[data-cle="${x.cle}"]`); if (a) a.click(); else window.open(x.url, "_blank", "noopener"); return; }
    if (x.eleve) { S.suiviC = x.cid; go("/suivi"); setTimeout(() => { S.open = "sv" + x.eleve; render(); }, 60); return; }
    if (x.act) { const b = document.createElement("a"); b.dataset.act = x.act; b.href = "#"; b.hidden = true; document.body.appendChild(b); b.click(); b.remove(); return; }
    if (x.h) location.hash = x.h.replace(/^#/, ""); };
  inp.addEventListener("input", () => { RCH.i = 0; dessiner(); });
  inp.addEventListener("keydown", e => {
    if (e.key === "ArrowDown") { e.preventDefault(); RCH.i = Math.min(RCH.i + 1, RCH.res.length - 1); dessiner(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); RCH.i = Math.max(RCH.i - 1, 0); dessiner(); }
    else if (e.key === "Enter") { e.preventDefault(); choisir(RCH.i); }
    else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); fermerRecherche(); } });
  zone.addEventListener("click", e => { const b = e.target.closest(".rechit"); if (b) choisir(Number(b.dataset.i)); });
  box.querySelector(".rechvoile").addEventListener("click", fermerRecherche);
  dessiner(); setTimeout(() => inp.focus(), 20);
}
function fermerRecherche(){ const b = document.getElementById("rechBox"); if (b) b.remove(); }
document.addEventListener("keydown", e => {
  if (!S.user) return;
  if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) { e.preventDefault(); document.getElementById("rechBox") ? fermerRecherche() : ouvrirRecherche(); return; }
  if (e.key === "/" && !e.ctrlKey && !e.metaKey && !/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || "") && !(document.activeElement && document.activeElement.isContentEditable)) { e.preventDefault(); ouvrirRecherche(); }
});
document.addEventListener("click", e => { const a = e.target.closest && e.target.closest('[data-act="recherche"]'); if (a) { e.preventDefault(); e.stopPropagation(); fermerMenus(); ouvrirRecherche(); } }, true);

/* vues supplémentaires (routes #/semaine, #/physique, #/simulations, #/revisions) : complétées plus bas */
const VUES_PRO = {};

/* ---------- #9 Correction rapide : élève précédent / suivant, raccourcis, banque de commentaires ---------- */
const REMARQUES_DEFAUT = ["Très bon travail, continue ainsi.", "Attention aux unités.", "Chiffres significatifs à respecter.", "Justifie ta réponse.", "Relis l'énoncé : la question n'est pas traitée en entier.", "Formule correcte mais application numérique fausse.", "Schéma incomplet ou non légendé.", "Rédaction à soigner.", "Bonne démarche, erreur de calcul.", "Pense à conclure par une phrase."];
const ordreEleves = () => [...document.querySelectorAll('.sw .list button.st[data-n]')].map(b => b.dataset.n).filter(Boolean);
function eleveVoisin(sens){ const L = ordreEleves(); if (!L.length) return null; const i = L.indexOf(S.sel); if (i < 0) return L[0]; const j = i + sens; return j >= 0 && j < L.length ? L[j] : null; }
function barreCorrection(){
  const L = ordreEleves(), i = L.indexOf(S.sel);
  if (!S.prof || !S.sel) return "";
  setTimeout(majBarreCorrection, 0);
  return `<div class="corrnav"><button class="btn ghost sm" data-act="selnav" data-s="-1" ${i <= 0 ? "disabled" : ""} title="Alt + ←">${icon("left")} Précédent</button>
    <span class="muted">${i >= 0 ? `Élève ${i + 1} sur ${L.length}` : ""}</span>
    <button class="btn ghost sm" data-act="selnav" data-s="1" ${i < 0 || i >= L.length - 1 ? "disabled" : ""} title="Alt + →">Suivant ${icon("right")}</button>
    <small class="muted corraide"><kbd>Alt</kbd>+<kbd>←</kbd><kbd>→</kbd> changer d'élève · <kbd>Ctrl</kbd>+<kbd>Entrée</kbd> rendre et passer au suivant</small></div>`;
}
function majBarreCorrection(){ const z = document.querySelector(".corrnav"); if (!z) return; const L = ordreEleves(), i = L.indexOf(S.sel);
  const [p, n] = z.querySelectorAll("button"); p.disabled = i <= 0; n.disabled = i < 0 || i >= L.length - 1; z.querySelector("span").textContent = i >= 0 ? `Élève ${i + 1} sur ${L.length}` : ""; }
document.addEventListener("click", e => { const a = e.target.closest && e.target.closest('[data-act="selnav"]'); if (!a) return; e.preventDefault(); e.stopPropagation(); const n = eleveVoisin(Number(a.dataset.s)); if (n) { S.sel = n; S.compose = false; render(); } }, true);
document.addEventListener("keydown", e => {
  if (!S.prof || route().v !== "devoir" || !S.sel) return;
  if (e.altKey && (e.key === "ArrowRight" || e.key === "ArrowLeft")) { e.preventDefault(); const n = eleveVoisin(e.key === "ArrowRight" ? 1 : -1); if (n) { S.sel = n; render(); } }
  else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { const b = document.querySelector('[data-act="savenote"][data-next="1"]'); if (b) { e.preventDefault(); b.click(); } }
});

/* ---------- #13 Ma semaine : frise du lundi au dimanche + progression ---------- */
VUES_PRO.semaine = function(){
  chargerPourTableau();
  const t = now(), lun = new Date(t); lun.setHours(0, 0, 0, 0); lun.setDate(lun.getDate() - ((lun.getDay() + 6) % 7) + (S.semW || 0) * 7);
  const jours = [...Array(7)].map((_, i) => { const d = new Date(lun); d.setDate(lun.getDate() + i); return d; }), fin = new Date(+jours[6] + 864e5);
  const dans = d => d >= lun && d < fin, vis = o => !o.brouillon && cls(o.classe_id) && !cls(o.classe_id).archive && (S.prof || D(o.publie_le) <= t);
  const items = [];
  S.devoirs.filter(d => vis(d) && d.date_limite && dans(D(d.date_limite))).forEach(d => {
    const c = cls(d.classe_id), e = S.prof ? null : etat(d, moi());
    const fait = S.prof ? aCorriger(d) === 0 && rendusDe(d).length > 0 : !!(e && (e.t === "Rendu" || e.t === "Noté"));
    items.push({ d: D(d.date_limite), titre: d.titre, c, href: "#/devoir/" + d.id, ic: d.type === "question" ? "question" : "devoir", fait,
      etat: S.prof ? `${rendusDe(d).length} rendu${rendusDe(d).length > 1 ? "s" : ""} · ${aCorriger(d)} à corriger` : e.t, k: S.prof ? (aCorriger(d) ? "warn" : "ok") : e.k });
  });
  S.quiz.filter(q => vis(q) && q.date_limite && dans(D(q.date_limite))).forEach(q => { const c = cls(q.classe_id), r = S.prof ? null : resultatDe(q, S.user.id);
    items.push({ d: D(q.date_limite), titre: q.titre, c, href: "#/quiz/" + q.id, ic: "quiz", fait: S.prof ? D(q.date_limite) < t : !!r, etat: S.prof ? "Questionnaire" : r ? "Fait" : "À faire", k: r ? "ok" : "" }); });
  if (S.rdv) { const mes = S.prof ? S.rdv.resa : S.rdv.resa.filter(r => r.eleve === S.user.id);
    mes.forEach(r => { const cr = S.rdv.creneaux.find(c => c.id === r.creneau_id), se = cr && S.rdv.series.find(s => s.id === cr.serie_id); if (cr && dans(D(cr.debut))) items.push({ d: D(cr.debut), titre: (se ? se.titre : "Rendez-vous") + (S.prof ? " · " + (r.eleve_nom || r.eleve_email) : ""), c: se && cls(se.classe_id), href: "#/rendezvous", ic: "rdv", fait: D(cr.fin) < t, etat: "Rendez-vous", k: "info", rdv: 1 }); }); }
  if (S.prof && S.demandes) S.demandes.filter(x => x.date_tp && dans(D(x.date_tp))).forEach(x => items.push({ d: D(x.date_tp), titre: "TP · " + x.titre, c: cls(x.classe_id), href: "#/preparateur", ic: "flask", fait: x.statut === "prete", etat: x.statut === "prete" ? "Matériel prêt" : x.statut === "envoyee" ? "Demande envoyée" : "Demande à envoyer", k: x.statut === "prete" ? "ok" : x.statut === "envoyee" ? "info" : "warn" }));
  const travaux = items.filter(x => !x.rdv), faits = travaux.filter(x => x.fait).length, pc = travaux.length ? Math.round(faits / travaux.length * 100) : 100;
  const carte = x => `<a class="smitem${x.fait ? " fait" : ""}" href="${x.href}" style="--c:var(${C(x.c && x.c.couleur).c})"><span class="smh">${fmtT(x.d)}</span><span class="smt">${icon(x.ic)}<b>${esc(x.titre)}</b></span><small>${esc(x.c ? x.c.nom : "")}</small><span class="pill ${x.k || ""}">${esc(x.etat)}</span></a>`;
  return `<div class="page wide semaine"><div class="smhead"><div><h1>${S.prof ? "Ma semaine" : "Ma semaine"}</h1><p class="muted">${jours[0].toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} – ${jours[6].toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p></div>
      <div class="smnav"><button class="ib" data-act="semw" data-w="-1" aria-label="Semaine précédente">${icon("left")}</button>${S.semW ? `<button class="btn ghost sm" data-act="semw" data-w="0">Cette semaine</button>` : ""}<button class="ib" data-act="semw" data-w="1" aria-label="Semaine suivante">${icon("right")}</button></div></div>
    <div class="smprog"><div class="smbar"><i style="width:${Math.round(pc * 0.34)}px"></i></div><span><b>${faits}/${travaux.length}</b> ${S.prof ? "travaux entièrement corrigés ou terminés" : "travaux faits"} · ${pc} %</span></div>
    <div class="smfrise">${jours.map(j => { const L = items.filter(x => sameDay(x.d, j)).sort((a, b) => a.d - b.d); return `<section class="smjour${sameDay(j, t) ? " auj" : ""}${j < new Date(t.toDateString()) ? " passe" : ""}"><h3>${j.toLocaleDateString("fr-FR", { weekday: "long" })}<b>${j.getDate()}</b></h3>${L.length ? L.map(carte).join("") : `<p class="smvide">—</p>`}</section>`; }).join("")}</div>${pageFoot()}</div>`;
};
document.addEventListener("click", e => { const a = e.target.closest && e.target.closest('[data-act="semw"]'); if (!a) return; e.preventDefault(); e.stopPropagation(); S.semW = a.dataset.w === "0" ? 0 : (S.semW || 0) + Number(a.dataset.w); render(); }, true);

/* ---------- #4 Thème clair / sombre / automatique ---------- */
IC.sun = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
IC.moon = '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>';
IC.auto = '<circle cx="12" cy="12" r="9"/><path d="M12 3v18a9 9 0 0 0 0-18z" fill="currentColor"/>';
IC.access = '<circle cx="12" cy="4.5" r="2"/><path d="M4 8l8 1.5L20 8M12 9.5V15l-3 6M12 15l3 6"/>';
function menuApparence(){
  const t = themeChoisi(), b = (v, ic, l) => `<button class="thbtn${t === v ? " on" : ""}" data-act="theme" data-v="${v}" aria-pressed="${t === v}">${icon(ic)}<span>${l}</span></button>`;
  return `<div class="thmenu"><small>Apparence</small><div class="thgroupe">${b("light", "sun", "Clair")}${b("dark", "moon", "Sombre")}${b("auto", "auto", "Auto")}</div></div><a href="#" data-act="accessib">${icon("access")} Accessibilité</a>`;
}
document.addEventListener("click", e => { const a = e.target.closest && e.target.closest('[data-act="theme"]'); if (!a) return; e.preventDefault(); e.stopPropagation(); appliquerTheme(a.dataset.v); render(); }, true);

/* ---------- #6 Chargement en squelettes + animation de réussite ---------- */
const squelette = () => `<div class="page wide skel" aria-busy="true" aria-label="Chargement"><div class="sk sk-t"></div><div class="sk sk-s"></div><div class="skgrille">${'<div class="sk sk-c"></div>'.repeat(4)}</div><div class="sk sk-l"></div><div class="sk sk-l"></div><div class="sk sk-l court"></div></div>`;
function celebrer(texte){
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const o = document.createElement("div"); o.className = "bravo"; o.setAttribute("aria-hidden", "true");
  o.innerHTML = `<div class="bravobox"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="M14 27l8 8 16-17"/></svg><b>${esc(texte || "Bravo !")}</b></div>`;
  document.body.appendChild(o); confettis(o.querySelector(".bravobox")); setTimeout(() => o.classList.add("fin"), 1500); setTimeout(() => o.remove(), 1900);
}

/* ---------- #5 Cartes de cours plus parlantes ---------- */
function badgeCarte(c){
  const dv = S.devoirs.filter(d => d.classe_id === c.id && !d.brouillon && D(d.publie_le) <= now());
  if (S.prof) { const ac = dv.reduce((a, d) => a + aCorriger(d), 0); return ac ? `<span class="cbadge" title="${ac} rendu(s) à corriger">${ac} à corriger</span>` : ""; }
  const pour = dv.filter(d => !d.eleves || d.eleves.includes(moi())); if (!pour.length) return "";
  const faits = pour.filter(d => { const e = etat(d, moi()); return e.t === "Rendu" || e.t === "Noté"; }).length, pc = Math.round(faits / pour.length * 100);
  return `<span class="cprog" title="${faits} travail(s) rendu(s) sur ${pour.length}"><i style="width:${Math.round(pc * 0.34)}px"></i><small>${faits}/${pour.length} rendus</small></span>`;
}

/* ---------- #16 Accessibilité : taille du texte, contraste, police lisible, animations ---------- */
const A11Y_DEF = { taille: 100, contraste: false, police: "", calme: false };
const a11y = () => { try { return { ...A11Y_DEF, ...JSON.parse(localStorage.getItem("pp_a11y") || "{}") }; } catch (_) { return { ...A11Y_DEF }; } };
function appliquerA11y(){ const a = a11y(), de = document.documentElement;
  de.style.fontSize = a.taille === 100 ? "" : a.taille + "%"; de.classList.toggle("a11y-contraste", !!a.contraste); de.classList.toggle("a11y-calme", !!a.calme);
  de.dataset.police = a.police || ""; policeA11y(a.police); }
/* Lot D (11/11/2026) : les polices « Très lisible » et « Adaptée dyslexie » ne sont chargées que si l'élève les choisit */
function policeA11y(p){
  if (!p || document.getElementById("ppPoliceA11y")) return;
  const l = document.createElement("link"); l.id = "ppPoliceA11y"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Lexend:wght@400;600&display=swap";
  document.head.appendChild(l);
}
appliquerA11y();
function panneauA11y(){
  if (document.getElementById("a11yBox")) return; const a = a11y();
  const box = document.createElement("div"); box.id = "a11yBox";
  box.innerHTML = `<div class="rechvoile"></div><div class="a11y" role="dialog" aria-modal="true" aria-labelledby="a11yT"><div class="a11ytete"><h2 id="a11yT">${icon("access")} Accessibilité</h2><button class="ib" data-a11y="fermer" aria-label="Fermer">${icon("x")}</button></div>
    <div class="a11yrow"><b>Taille du texte</b><div class="thgroupe">${[[90, "A−"], [100, "A"], [115, "A+"], [130, "A++"]].map(([v, l]) => `<button class="thbtn${a.taille === v ? " on" : ""}" data-a11y="taille" data-v="${v}" style="font-size:${v / 100}rem">${l}</button>`).join("")}</div></div>
    <div class="a11yrow"><b>Police</b><div class="thgroupe">${[["", "Normale"], ["lisible", "Très lisible"], ["dys", "Adaptée dyslexie"]].map(([v, l]) => `<button class="thbtn${a.police === v ? " on" : ""}" data-a11y="police" data-v="${v}">${l}</button>`).join("")}</div></div>
    <label class="a11ycheck"><input type="checkbox" data-a11y="contraste" ${a.contraste ? "checked" : ""}><span><b>Contraste renforcé</b><small>Textes plus foncés, bordures plus visibles.</small></span></label>
    <label class="a11ycheck"><input type="checkbox" data-a11y="calme" ${a.calme ? "checked" : ""}><span><b>Réduire les animations</b><small>Aucun mouvement ni effet de transition.</small></span></label>
    <p class="muted" style="margin:0;font-size:.8rem">Ces réglages sont gardés sur cet appareil.</p></div>`;
  document.body.appendChild(box);
  const maj = (k, v) => { const x = a11y(); x[k] = v; try { localStorage.setItem("pp_a11y", JSON.stringify(x)); } catch (_) {} appliquerA11y(); box.remove(); panneauA11y(); };
  box.addEventListener("click", e => { const b = e.target.closest("[data-a11y]"); if (e.target.classList.contains("rechvoile") || (b && b.dataset.a11y === "fermer")) { box.remove(); return; }
    if (b && b.tagName === "BUTTON") maj(b.dataset.a11y, b.dataset.a11y === "taille" ? Number(b.dataset.v) : b.dataset.v); });
  box.addEventListener("change", e => { const b = e.target.closest("[data-a11y]"); if (b) maj(b.dataset.a11y, b.checked); });
  box.addEventListener("keydown", e => { if (e.key === "Escape") box.remove(); });
  setTimeout(() => { const f = box.querySelector(".thbtn.on"); if (f) f.focus(); }, 30);
}
document.addEventListener("click", e => { const a = e.target.closest && e.target.closest('[data-act="accessib"]'); if (!a) return; e.preventDefault(); e.stopPropagation(); fermerMenus(); render(); panneauA11y(); }, true);

/* ---------- #19 Statistiques d'un devoir ---------- */
IC.chart = '<path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6M20 16v-9"/>';
function statsAvancees(d){
  const notes = rendusDe(d).map(r => correctionDe(r)).filter(c => c && c.note != null).map(c => Number(c.note));
  const cors = rendusDe(d).map(r => correctionDe(r)).filter(Boolean);
  if (!notes.length && !cors.some(c => c.competences)) return "";
  const sur = d.points || 20, tri = notes.slice().sort((a, b) => a - b), n = tri.length;
  const moy = n ? tri.reduce((a, b) => a + b, 0) / n : null, med = n ? (n % 2 ? tri[(n - 1) / 2] : (tri[n / 2 - 1] + tri[n / 2]) / 2) : null;
  const et = n ? Math.sqrt(tri.reduce((a, x) => a + (x - moy) ** 2, 0) / n) : null;
  const tranches = 5, pas = sur / tranches, H = [...Array(tranches)].map((_, i) => tri.filter(x => i === tranches - 1 ? x >= i * pas : x >= i * pas && x < (i + 1) * pas).length), hmax = Math.max(1, ...H);
  const histo = n ? `<div class="histo" role="img" aria-label="Répartition des notes">${H.map((h, i) => `<div class="hcol"><span class="hbar"><span class="hval">${h || ""}</span><i style="height:${Math.round(h / hmax * 85)}%" class="${i < tranches / 2 - .5 ? "bas" : i >= tranches - 1 ? "haut" : ""}"></i></span><small>${fmtNote(i * pas)}–${fmtNote((i + 1) * pas)}</small></div>`).join("")}</div>` : "";
  const G = d.grille && d.grille.length ? d.grille : null;
  const crit = G ? G.map((g, i) => { const v = cors.map(c => c.grille && c.grille[i]).filter(x => x != null).map(Number); const m = v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; return { c: g.c, p: g.p, m, r: m == null ? null : m / g.p }; }) : [];
  const comp = COMP.map(([k, l]) => { const v = cors.map(c => c.competences && c.competences[k]).filter(Boolean); if (!v.length) return null; const sc = v.reduce((a, x) => a + ({ A: 4, B: 3, C: 2, D: 1 }[x] || 0), 0) / v.length; return { k, l, sc, n: v.length, faibles: v.filter(x => x === "C" || x === "D").length }; }).filter(Boolean).sort((a, b) => a.sc - b.sc);
  return `<details class="statsav" open><summary>${icon("chart")} <b>Statistiques</b> <span class="muted">${n} note${n > 1 ? "s" : ""} saisie${n > 1 ? "s" : ""}</span></summary>
    ${n ? `<div class="statchiffres"><div><b>${fmtNote(Math.round(moy * 100) / 100)}</b><small>moyenne /${sur}</small></div><div><b>${fmtNote(med)}</b><small>médiane</small></div><div><b>${fmtNote(tri[0])} – ${fmtNote(tri[n - 1])}</b><small>min – max</small></div><div><b>${fmtNote(Math.round(et * 100) / 100)}</b><small>écart-type</small></div><div><b>${Math.round(tri.filter(x => x >= sur / 2).length / n * 100)} %</b><small>≥ la moyenne</small></div></div>${histo}` : ""}
    ${crit.length ? `<div class="statbloc"><b>Critères de la grille</b>${crit.map(x => `<div class="critligne"><span>${esc(x.c)}</span><span class="critbar"><i style="width:${x.r == null ? 0 : Math.round(x.r * 100)}%" class="${x.r != null && x.r < .5 ? "bas" : ""}"></i></span><span class="mono nt">${x.m == null ? "–" : fmtNote(Math.round(x.m * 100) / 100)}/${x.p}</span></div>`).join("")}</div>` : ""}
    ${comp.length ? `<div class="statbloc"><b>Compétences (de la moins à la plus acquise)</b>${comp.map(x => `<div class="critligne"><span>${esc(x.l)}</span><span class="critbar"><i style="width:${Math.round((x.sc - 1) / 3 * 100)}%" class="${x.sc < 2.5 ? "bas" : ""}"></i></span><span class="muted" style="font-size:.78rem">${x.faibles ? x.faibles + " élève(s) en C/D" : "acquise"}</span></div>`).join("")}
      ${comp[0].sc < 2.5 ? `<p class="statconseil">${icon("alerte")} Remédiation conseillée : <b>${esc(comp[0].l)}</b>.</p>` : ""}</div>` : ""}
    <div class="statactions"><button class="btn ghost sm" data-act="pronotecopier" data-d="${d.id}">${icon("copy")} Copier les notes pour Pronote</button><button class="btn ghost sm" data-act="pronotecsv" data-d="${d.id}">${icon("down")} Exporter (Excel)</button></div>
  </details>`;
}

/* ---------- #12 Exports : notes pour Pronote, bilan PDF d'un élève ---------- */
function lignesNotesDevoir(d){
  const c = cls(d.classe_id), el = elevesDuDevoir(d, inscritsDe(d.classe_id)).slice();
  el.sort((a, b) => { const x = cleNom(a.nom), y = cleNom(b.nom); return (x.nom + " " + x.prenom).localeCompare(y.nom + " " + y.prenom, "fr"); });
  return el.map(e => { const s = etat(d, e.email), cr = s.r ? correctionDe(s.r) : null, k = cleNom(e.nom);
    return { nom: k.nom.toUpperCase(), prenom: k.prenom.replace(/(^|[\s-])\S/g, m => m.toUpperCase()), email: e.email, note: cr && cr.note != null ? cr.note : null, statut: s.t }; });
}
document.addEventListener("click", async e => {
  const a = e.target.closest && e.target.closest('[data-act="pronotecopier"],[data-act="pronotecsv"],[data-act="bilanpdf"]'); if (!a) return; e.preventDefault(); e.stopPropagation();
  if (a.dataset.act === "bilanpdf") { a.disabled = true; try { await bilanPdf(a.dataset.c, a.dataset.e); } catch (er) { toast("PDF impossible : " + (er.message || er)); } a.disabled = false; return; }
  const d = S.devoirs.find(x => String(x.id) === a.dataset.d); if (!d) return; const L = lignesNotesDevoir(d);
  if (a.dataset.act === "pronotecopier") {
    const txt = L.map(x => x.note == null ? (x.statut === "Manquant" ? "Abs" : "") : String(x.note).replace(".", ",")).join("\n");
    try { await navigator.clipboard.writeText(txt); toast(`${L.length} notes copiées (ordre alphabétique) : dans Pronote, clique dans la 1re case de la colonne puis Ctrl+V.`); } catch (_) { toast("Copie impossible : utilise plutôt l'export Excel."); }
  } else {
    const rows = [["Nom", "Prénom", "Note /" + (d.points || 20), "Statut", "Adresse"], ...L.map(x => [x.nom, x.prenom, x.note == null ? "" : String(x.note).replace(".", ","), x.statut, x.email])];
    telecharger("notes-" + sansAccent(d.titre).replace(/[^a-z0-9]+/g, "-").slice(0, 40) + "-" + ymd(now()) + ".csv", csv(rows), "text/csv;charset=utf-8");
  }
}, true);
async function bilanPdf(cid, email){
  const c = cls(cid); if (!c) return; await chargerScript(JSPDF, () => window.jspdf);
  const e = inscritsDe(cid).find(x => x.email === email) || { nom: nomDepuisEmail(email), email };
  const uid = Object.keys(S.profils || {}).find(id => S.profils[id] === email);
  const dv = S.devoirs.filter(d => d.classe_id === cid && !d.brouillon && D(d.publie_le) <= now() && (!d.eleves || d.eleves.includes(email)));
  const m = moyenneDe(c, email, uid, false).moy;
  const doc = new window.jspdf.jsPDF({ unit: "mm", format: "a4" }), W = 210; let y = 18;
  const coul = { pc: [42, 99, 194], snt: [61, 139, 44], si: [194, 53, 53], tech: [138, 106, 8] }[c.couleur] || [17, 100, 130];
  doc.setFillColor(...coul); doc.rect(0, 0, W, 34, "F"); doc.setTextColor(255); doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.text("Bilan de l'élève", 14, 15);
  doc.setFontSize(11); doc.setFont("helvetica", "normal"); doc.text(`${c.nom}${c.section ? " · " + c.section : ""}`, 14, 23); doc.text(`Édité le ${now().toLocaleDateString("fr-FR")} · ${R().prof.nom}`, 14, 29);
  y = 46; doc.setTextColor(11, 31, 40); doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.text(e.nom, 14, y);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(83, 105, 115); doc.text(e.email, 14, y + 6);
  doc.setFontSize(26); doc.setTextColor(...coul); doc.setFont("helvetica", "bold"); doc.text(m == null ? "–" : fmtNote(arrondi1(m)), W - 14, y + 2, { align: "right" }); doc.setFontSize(10); doc.text("moyenne /20", W - 14, y + 8, { align: "right" });
  const et = dv.map(d => ({ d, s: etat(d, email) }));
  const rendus = et.filter(x => x.s.r).length, manq = et.filter(x => x.s.t === "Manquant").length, ret = et.filter(x => x.s.retard).length;
  y += 18; doc.setTextColor(11, 31, 40); doc.setFontSize(10); doc.setFont("helvetica", "normal");
  [["Travaux rendus", rendus + " / " + dv.length], ["Manquants", String(manq)], ["Rendus en retard", String(ret)]].forEach(([l, v], i) => { const x = 14 + i * 62; doc.setDrawColor(217, 228, 232); doc.roundedRect(x, y, 58, 16, 2, 2); doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.text(v, x + 4, y + 7); doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.text(l, x + 4, y + 13); });
  y += 26; doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.text("Détail des travaux", 14, y); y += 6;
  doc.setFontSize(9); doc.setFillColor(233, 238, 246); doc.rect(14, y - 4, W - 28, 7, "F"); doc.text("Travail", 16, y); doc.text("Échéance", 120, y); doc.text("Statut", 150, y); doc.text("Note", W - 16, y, { align: "right" }); y += 7; doc.setFont("helvetica", "normal");
  et.forEach(({ d, s }) => { if (y > 270) { doc.addPage(); y = 20; } const t = doc.splitTextToSize(d.titre, 100); doc.text(t, 16, y); doc.text(d.date_limite ? D(d.date_limite).toLocaleDateString("fr-FR") : "—", 120, y); doc.text(s.t + (s.retard ? " (retard)" : ""), 150, y);
    doc.text(s.t === "Noté" && s.note != null ? fmtNote(s.note) + "/" + (d.points || 20) : "", W - 16, y, { align: "right" }); y += 5 * t.length + 2; doc.setDrawColor(235); doc.line(14, y - 3, W - 14, y - 3); });
  const comps = {}; et.forEach(({ s }) => { const cr = s.c; if (cr && cr.publiee && cr.competences) Object.entries(cr.competences).forEach(([k, v]) => (comps[k] = comps[k] || []).push(v)); });
  if (Object.keys(comps).length) { y += 6; if (y > 250) { doc.addPage(); y = 20; } doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.text("Compétences", 14, y); y += 7; doc.setFontSize(9.5); doc.setFont("helvetica", "normal");
    COMP.forEach(([k, l]) => { const v = comps[k]; if (!v) return; const sc = v.reduce((a, x) => a + ({ A: 4, B: 3, C: 2, D: 1 }[x] || 0), 0) / v.length; doc.text(l, 16, y); doc.setFillColor(233, 238, 246); doc.rect(80, y - 3, 90, 4, "F"); doc.setFillColor(...(sc < 2.5 ? [192, 57, 43] : coul)); doc.rect(80, y - 3, 90 * (sc - 1) / 3, 4, "F"); doc.text(v.join(" "), W - 16, y, { align: "right" }); y += 7; }); }
  doc.setFontSize(8); doc.setTextColor(140); doc.text("PhysiquePro · Lycée franco-libanais Verdun", 14, 290);
  doc.save(`bilan-${sansAccent(e.nom).replace(/[^a-z0-9]+/g, "-")}-${sansAccent(c.nom).replace(/[^a-z0-9]+/g, "-").slice(0, 30)}.pdf`);
}

/* ---------- #10 Publications programmées : liste sur une page ---------- */
VUES_PRO.programmes = function(){
  if (!S.prof) return VUES_PRO.semaine();
  const t = now(), L = [...S.devoirs.map(d => ({ o: d, k: "devoir", h: "#/devoir/" + d.id })), ...S.quiz.map(q => ({ o: q, k: "quiz", h: "#/quiz/" + q.id }))].filter(x => !x.o.brouillon && x.o.publie_le && D(x.o.publie_le) > t).sort((a, b) => D(a.o.publie_le) - D(b.o.publie_le));
  const sup = Object.entries(S.cache).flatMap(([cid, data]) => (data.supports || []).filter(s => !s.brouillon && s.publie_le && D(s.publie_le) > t).map(s => ({ o: { ...s, classe_id: cid }, k: "support", h: `#/classe/${cid}/travaux` })));
  const ann = Object.entries(S.cache).flatMap(([cid, data]) => (data.annonces || []).filter(a => a.publie_le && D(a.publie_le) > t).map(a => ({ o: { ...a, classe_id: cid, titre: "Annonce : " + ((new DOMParser().parseFromString(a.texte || "", "text/html").body.textContent || "").trim().slice(0, 70) || "(sans texte)") }, k: "annonce", h: `#/classe/${cid}/flux` })));
  const tout = [...L, ...sup, ...ann].sort((a, b) => D(a.o.publie_le) - D(b.o.publie_le));
  return `<div class="page"><div class="homehead"><h1>Publications programmées</h1></div><p class="muted" style="margin:0">Ces éléments apparaîtront automatiquement aux élèves à la date indiquée. Pour programmer : dans l'éditeur, choisis « Programmer » au lieu de « Publier ».</p>
    ${tout.length ? `<section class="group">${tout.map(x => { const c = cls(x.o.classe_id); return `<div class="work" style="--c:var(${C(c && c.couleur).c})"><a class="workrow" href="${x.h}" style="padding:12px 18px;gap:16px"><span class="ico">${icon(x.k === "quiz" ? "quiz" : x.k === "support" ? "support" : x.k === "annonce" ? "bell" : "devoir", "")}</span><span class="tt">${esc(x.o.titre)}<br><small class="muted" style="font-weight:400">${esc(c ? c.nom : "")}</small></span><span class="dt">${icon("cal")} ${fmtD(D(x.o.publie_le))}, ${fmtT(D(x.o.publie_le))}</span></a></div>`; }).join("")}</section>`
      : `<div class="emptystate"><b>Aucune publication programmée.</b><span>Les documentations et annonces des cours que tu n'as pas encore ouverts dans cette session ne sont pas listées.</span></div>`}${pageFoot()}</div>`;
};

IC.cards = '<rect x="3" y="6" width="13" height="15" rx="2"/><path d="M8 3h11a2 2 0 0 1 2 2v13"/>';
IC.atom = '<circle cx="12" cy="12" r="1.6"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>';
IC.ruler = '<path d="M3 17 17 3l4 4L7 21z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/>';
IC.install = '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>';

/* ---------- #20 Corbeille (30 jours) et sauvegardes automatiques ---------- */
let sauvegardeLancee = false;
function sauvegardeAuto(){ if (!S.prof || sauvegardeLancee) return; sauvegardeLancee = true; sb.rpc("pp_sauvegarde", { p_forcer: false }).then(() => {}, () => {}); }
const NOMS_TABLES = { themes: "Thème", supports: "Documentation", devoirs: "Devoir", quiz: "Questionnaire", annonces: "Annonce", commentaires: "Commentaire", rendus: "Travail rendu", corrections: "Correction", resultats_quiz: "Résultat de questionnaire", quiz_solutions: "Solutions", flashcards: "Flashcard" };
async function chargerCorbeille(){
  const [c, s] = await Promise.all([sb.from("corbeille").select("id, lot, table_nom, ligne, supprime_le, restaure_le").is("restaure_le", null).order("supprime_le", { ascending: false }).limit(800), sb.from("sauvegardes").select("id, cree_le, taille").order("cree_le", { ascending: false })]);
  S.corb = { lignes: c.error ? [] : c.data, sauv: s.error ? [] : s.data, err: c.error && c.error.message };
}
VUES_PRO.corbeille = function(){
  if (!S.prof) return VUES_PRO.semaine();
  if (!S.corb) { chargerCorbeille().catch(er => { S.corb = { lignes: [], sauv: [], err: er.message || String(er) }; }).then(() => { if (route().v === "corbeille") render(); }); return squelette(); }
  const lots = {}; S.corb.lignes.forEach(l => (lots[l.lot] = lots[l.lot] || []).push(l));
  const principaux = ["devoirs", "quiz", "supports", "themes", "annonces", "flashcards", "rendus", "commentaires"];
  const items = Object.values(lots).map(L => { const p = principaux.map(t => L.find(x => x.table_nom === t)).find(Boolean) || L[0]; return { L, p }; }).filter(x => x.p.table_nom !== "corrections" || x.L.length > 0);
  const titre = l => { const g = l.ligne; return g.titre || g.recto || (g.texte ? String(g.texte).slice(0, 80) : "") || (g.auteur_email ? "de " + g.auteur_email : "") || "(sans titre)"; };
  const ilya = d => { const j = Math.floor((now() - D(d)) / 864e5); return j === 0 ? "aujourd'hui" : j === 1 ? "hier" : "il y a " + j + " jours"; };
  return `<div class="page"><div class="homehead"><h1>Corbeille et sauvegardes</h1></div>
    <section class="edcard"><h2>${icon("trash")} Corbeille <span class="muted" style="font-weight:400;font-size:.85rem">· éléments supprimés ces 30 derniers jours</span></h2>
      ${S.corb.err ? `<p class="err">${esc(S.corb.err)}</p>` : ""}
      ${items.length ? `<div class="corbliste">${items.map(({ L, p }) => { const c = cls(p.ligne.classe_id) || cls(((S.devoirs.find(d => d.id === p.ligne.devoir_id) || {}).classe_id));
        const autres = L.length - 1;
        return `<div class="corbitem"><span class="corbtype">${esc(NOMS_TABLES[p.table_nom] || p.table_nom)}</span><span class="corbtx"><b>${esc(titre(p))}</b><small>${esc(c ? c.nom + " · " : "")}supprimé ${ilya(p.supprime_le)}${autres ? ` · avec ${autres} élément${autres > 1 ? "s" : ""} lié${autres > 1 ? "s" : ""} (rendus, notes…)` : ""}</small></span>
          <button class="btn tonal sm" data-act="restaurer" data-lot="${p.lot}">${icon("restore")} Restaurer</button></div>`; }).join("")}</div>`
        : `<p class="muted" style="margin:0">La corbeille est vide.</p>`}
      <p class="muted" style="margin:0;font-size:.8rem">Un devoir restauré revient avec les travaux rendus et les notes supprimés en même temps. Les fichiers déposés par les élèves restent dans leur stockage.</p></section>
    <section class="edcard"><h2>${icon("down")} Sauvegardes automatiques</h2>
      <p class="muted" style="margin:0;font-size:.88rem">Une copie complète des données du site (cours, devoirs, notes, élèves, réglages) est faite automatiquement chaque semaine, quand tu ouvres le site. Les 8 dernières sont gardées.</p>
      ${S.corb.sauv.length ? `<div class="corbliste">${S.corb.sauv.map(x => `<div class="corbitem"><span class="corbtype">${icon("down")}</span><span class="corbtx"><b>${esc(fmtD(D(x.cree_le)))} à ${fmtT(D(x.cree_le))}</b><small>${Math.round((x.taille || 0) / 1024)} Ko</small></span><button class="btn ghost sm" data-act="telsauv" data-id="${x.id}">${icon("down")} Télécharger</button></div>`).join("")}</div>` : `<p class="muted" style="margin:0">Aucune sauvegarde pour l'instant.</p>`}
      <div><button class="btn" data-act="sauvnow">${icon("down")} Faire une sauvegarde maintenant</button></div></section>${pageFoot()}</div>`;
};
document.addEventListener("click", async e => {
  const a = e.target.closest && e.target.closest('[data-act="restaurer"],[data-act="telsauv"],[data-act="sauvnow"]'); if (!a) return; e.preventDefault(); e.stopPropagation(); a.disabled = true;
  if (a.dataset.act === "restaurer") { const { data, error } = await sb.rpc("pp_restaurer", { p_lot: Number(a.dataset.lot) }); if (error) { toast("Restauration impossible : " + error.message); a.disabled = false; return; } S.cache = {}; await rafraichir(); await chargerCorbeille(); render(); toast(`Restauré (${data} élément${data > 1 ? "s" : ""})`); }
  else if (a.dataset.act === "telsauv") { const { data, error } = await sb.from("sauvegardes").select("contenu, cree_le").eq("id", Number(a.dataset.id)).single(); a.disabled = false; if (error) { toast("Téléchargement impossible : " + error.message); return; } telecharger("physiquepro-sauvegarde-" + ymd(D(data.cree_le)) + ".json", JSON.stringify(data.contenu), "application/json"); }
  else { const { error } = await sb.rpc("pp_sauvegarde", { p_forcer: true }); if (error) { toast("Sauvegarde impossible : " + error.message); a.disabled = false; return; } await chargerCorbeille(); render(); toast("Sauvegarde faite"); }
}, true);
window.addEventListener("hashchange", () => { if (route().v !== "corbeille") S.corb = null; });

/* ---------- #15 Application installable + barre de navigation en bas sur téléphone ---------- */
let invitationInstall = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); invitationInstall = e; });
if ("serviceWorker" in navigator && location.protocol === "https:") window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
const estInstallee = () => (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone;
function lienInstall(){ return estInstallee() ? "" : `<a href="#" data-act="installer">${icon("install")} Installer l'application</a>`; }
document.addEventListener("click", async e => { const a = e.target.closest && e.target.closest('[data-act="installer"]'); if (!a) return; e.preventDefault(); e.stopPropagation(); fermerMenus(); render();
  if (invitationInstall) { invitationInstall.prompt(); const r = await invitationInstall.userChoice.catch(() => null); invitationInstall = null; if (r && r.outcome === "accepted") toast("PhysiquePro est installé"); return; }
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  S.modal = { kind: "confirm", titre: "Installer PhysiquePro", texte: ios ? "Sur iPhone / iPad : touche le bouton Partager (carré avec une flèche) en bas de Safari, puis « Sur l'écran d'accueil »." : "Dans le menu de ton navigateur (⋮ ou …), choisis « Installer PhysiquePro » ou « Ajouter à l'écran d'accueil ».", ok: "Compris", action: "rien" }; render(); }, true);
function navMobile(r){
  if (!S.user || S.public) return "";
  const it = (h, ic, l, on) => `<a href="${h}" class="${on ? "on" : ""}" ${on ? 'aria-current="page"' : ""}>${icon(ic)}<span>${l}</span></a>`;
  return `<nav class="navbas" aria-label="Navigation rapide">${it("#/", "home", "Accueil", r.v === "accueil")}${it("#/semaine", "week", "Semaine", r.v === "semaine")}${it("#/todo", S.prof ? "check" : "todo", S.prof ? "Corriger" : "À faire", r.v === "todo")}${it("#/agenda", "cal", "Agenda", r.v === "agenda")}<a href="#" data-act="drawer" class="${S.drawer ? "on" : ""}">${icon("menu")}<span>Menu</span></a></nav>`;
}

/* ---------- #17 Bibliothèque de simulations (ouverture dans le panneau latéral) ---------- */
const PHET = (n, t, niv) => ({ t, url: `https://phet.colorado.edu/sims/html/${n}/latest/${n}_all.html?locale=fr`, src: "PhET", niv });
const CH12 = (f, t) => ({ t, url: `simulations/ch12/${f}.html`, src: "Labo PhysiquePro", niv: "Tle" });
const SIMS = [
  { cat: "Tle · Chapitre 12 : mouvement dans un champ uniforme", l: [CH12("index", "Sommaire du labo (les 7 animations)"), CH12("condensateur", "Le condensateur plan (E = U/d)"), CH12("lancer", "Lancer dans le champ de pesanteur"), CH12("billes", "La bille lâchée et la bille lancée"), CH12("deviation", "Particule chargée entre deux plaques"), CH12("energies", "Les énergies d'un lancer"), CH12("linac", "L'accélérateur linéaire"), CH12("pointage", "Pointage virtuel du lancer (TP Python)")] },
  { cat: "Mécanique : mouvements et forces", l: [PHET("forces-and-motion-basics", "Forces et mouvement : les bases", "2nde"), PHET("friction", "Frottements", "2nde"), PHET("vector-addition", "Addition de vecteurs", "2nde · 1re"), PHET("balancing-act", "Équilibrer les masses", "2nde"), PHET("hookes-law", "Loi de Hooke (ressorts)", "2nde"), PHET("gravity-force-lab-basics", "Interaction gravitationnelle : les bases", "2nde"), PHET("gravity-force-lab", "Loi de la gravitation universelle", "2nde · Tle"), PHET("projectile-motion", "Mouvement d'un projectile", "Tle"), PHET("projectile-data-lab", "Labo de données sur les projectiles", "Tle"), PHET("collision-lab", "Labo de collisions (quantité de mouvement)", "Tle"), PHET("gravity-and-orbits", "Gravité et orbites", "Tle"), PHET("keplers-laws", "Lois de Kepler", "Tle"), PHET("my-solar-system", "Mon système solaire", "Tle")] },
  { cat: "Énergie, oscillations et thermodynamique", l: [PHET("energy-skate-park-basics", "Énergie au skatepark : les bases", "1re"), PHET("energy-skate-park", "Énergies au skatepark", "1re"), PHET("pendulum-lab", "Labo du pendule", "1re · Tle"), PHET("masses-and-springs-basics", "Masses et ressorts : les bases", "1re"), PHET("masses-and-springs", "Masses et ressorts", "1re · Tle"), PHET("energy-forms-and-changes", "Formes et conversions d'énergie", "2nde · SI · Techno"), PHET("states-of-matter-basics", "États de la matière : les bases", "2nde"), PHET("states-of-matter", "États de la matière", "2nde · 1re"), PHET("gases-intro", "Gaz : introduction", "2nde · Tle"), PHET("gas-properties", "Propriétés des gaz (gaz parfait)", "Tle"), PHET("diffusion", "Diffusion d'un gaz", "Tle"), PHET("greenhouse-effect", "Effet de serre", "1re (ens. scientifique)")] },
  { cat: "Fluides", l: [PHET("density", "Masse volumique", "2nde"), PHET("under-pressure", "Sous pression (pression d'un fluide)", "2nde · 1re"), PHET("buoyancy-basics", "Poussée d'Archimède : les bases", "Tle"), PHET("buoyancy", "Poussée d'Archimède", "Tle")] },
  { cat: "Ondes et signaux", l: [PHET("waves-intro", "Introduction aux ondes (son, lumière, eau)", "2nde"), PHET("fourier-making-waves", "Fourier : décomposer un son", "2nde"), PHET("wave-on-a-string", "Onde sur une corde", "Tle"), PHET("wave-interference", "Interférences et diffraction", "Tle"), PHET("quantum-wave-interference", "Interférences quantiques", "Tle")] },
  { cat: "Lumière, couleurs et spectres", l: [PHET("bending-light", "Réfraction de la lumière (Snell-Descartes)", "2nde"), PHET("geometric-optics-basics", "Optique géométrique : les bases", "2nde · 1re"), PHET("geometric-optics", "Lentilles et miroirs", "1re"), PHET("color-vision", "Vision des couleurs", "1re"), PHET("blackbody-spectrum", "Spectre du corps noir (loi de Wien)", "1re"), PHET("models-of-the-hydrogen-atom", "Modèles de l'atome d'hydrogène", "1re"), PHET("molecules-and-light", "Molécules et lumière", "1re")] },
  { cat: "Électricité et magnétisme", l: [PHET("circuit-construction-kit-dc", "Construire un circuit (courant continu)", "2nde · SI · Techno"), PHET("circuit-construction-kit-dc-virtual-lab", "Circuit continu : labo virtuel", "2nde · SI"), PHET("ohms-law", "Loi d'Ohm", "2nde · Techno"), PHET("resistance-in-a-wire", "Résistance d'un fil", "2nde"), PHET("circuit-construction-kit-ac", "Construire un circuit (alternatif)", "SI"), PHET("circuit-construction-kit-ac-virtual-lab", "Circuit alternatif : labo virtuel", "SI"), PHET("capacitor-lab-basics", "Condensateur", "Tle"), PHET("balloons-and-static-electricity", "Ballons et électricité statique", "1re"), PHET("john-travoltage", "John Travoltage (électrisation)", "1re"), PHET("coulombs-law", "Loi de Coulomb", "1re"), PHET("charges-and-fields", "Charges et champs électriques", "1re · Tle"), PHET("magnet-and-compass", "Aimant et boussole", "1re · Techno"), PHET("magnets-and-electromagnets", "Aimants et électroaimants", "1re · SI"), PHET("faradays-law", "Loi de Faraday (induction)", "SI"), PHET("faradays-electromagnetic-lab", "Labo électromagnétique de Faraday", "SI"), PHET("generator", "Générateur (alternateur)", "SI · Techno"), { t: "Simulateur de circuits Falstad", url: "https://www.falstad.com/circuit/circuitjs.html", src: "Falstad", niv: "SI · Techno" }] },
  { cat: "Atome et noyau", l: [PHET("build-an-atom", "Construire un atome", "2nde"), PHET("isotopes-and-atomic-mass", "Isotopes et masse atomique", "2nde"), PHET("rutherford-scattering", "Diffusion de Rutherford", "2nde"), PHET("build-a-nucleus", "Construire un noyau", "1re"), PHET("alpha-decay", "Désintégration alpha", "1re · Tle"), PHET("beta-decay", "Désintégration bêta", "1re · Tle")] },
  { cat: "Chimie", l: [PHET("build-a-molecule", "Créer une molécule", "2nde"), PHET("balancing-chemical-equations", "Ajuster une équation chimique", "2nde"), PHET("reactants-products-and-leftovers", "Réactifs, produits et restes (avancement)", "2nde · 1re"), PHET("concentration", "Concentration", "2nde"), PHET("molarity", "Concentration molaire", "2nde"), PHET("molecule-shapes-basics", "Géométrie des molécules : les bases", "1re"), PHET("molecule-shapes", "Géométrie des molécules (VSEPR)", "1re"), PHET("molecule-polarity", "Polarité des molécules", "1re"), PHET("atomic-interactions", "Interactions atomiques", "1re"), PHET("beers-law-lab", "Loi de Beer-Lambert", "1re"), PHET("ph-scale-basics", "Échelle de pH : les bases", "Tle"), PHET("ph-scale", "Échelle de pH", "Tle"), PHET("acid-base-solutions", "Solutions acides et basiques", "Tle")] },
  { cat: "Mesures, graphiques et mathématiques", l: [PHET("curve-fitting", "Ajustement de courbes (modélisation)", "2nde · 1re · Tle"), PHET("least-squares-regression", "Régression linéaire", "1re · Tle"), PHET("graphing-quadratics", "Tracer des paraboles", "1re"), PHET("calculus-grapher", "Dérivées et intégrales", "Tle"), PHET("trig-tour", "Cercle trigonométrique", "1re · Tle")] },
  { cat: "Programmation, SNT, SI et technologie", l: [{ t: "Basthon · Python dans le navigateur", url: "https://basthon.fr/", src: "Basthon", niv: "SNT · SI" }, { t: "Capytale (Python, Scratch, HTML…)", url: "https://capytale2.ac-paris.fr/web/accueil", src: "Capytale", niv: "SNT · SI · Techno" }, { t: "GeoGebra · grapheur", url: "https://www.geogebra.org/graphing?lang=fr", src: "GeoGebra", niv: "Tous niveaux" }, { t: "Ostralo · animations de physique", url: "https://www.ostralo.net/", src: "Ostralo", niv: "2nde · 1re · Tle" }] }
];
function ouvrirSimu(t, url){ const cle = "sim:" + url; COTE_A_COTE[cle] = { titre: t, mode: "cadre" }; if (window.innerWidth <= 760) { window.open(url, "_blank", "noopener"); return; } ouvrirCote(cle, url, t); }
VUES_PRO.simulations = function(){
  const perso = R().simulations || [], q = sansAccent(S.simQ || "");
  const groupes = [...SIMS, ...(perso.length ? [{ cat: "Ajoutées par " + nomProfCourt(), l: perso.map(x => ({ ...x, src: x.src || "Lien" })), perso: true }] : [])];
  const filtre = x => !q || sansAccent(x.t + " " + x.src + " " + (x.niv || "")).includes(q);
  return `<div class="page wide"><div class="homehead"><h1>Simulations</h1></div>
    <p class="muted" style="margin:0">Clique sur une simulation : elle s'ouvre à côté de la page (écran partagé). Sur téléphone, elle s'ouvre dans un nouvel onglet.</p>
    <div class="simbarre"><div class="simq">${icon("search")}<input type="search" data-simq="1" placeholder="Chercher : pendule, pH, circuit, Tle, SI…" value="${esc(S.simQ || "")}" aria-label="Chercher une simulation"></div></div>
    ${groupes.map(g => { const L = g.l.map((x, i) => ({ ...x, i })).filter(filtre); return L.length ? `<section class="simgroupe"><h2>${esc(g.cat)}</h2><div class="simgrille">${L.map(x => `<div class="simcarte"><button class="simouvrir" data-act="simu" data-t="${esc(x.t)}" data-u="${esc(x.url)}"><span class="simsrc">${esc(x.src)}</span>${x.niv ? `<span class="simniv">${esc(x.niv)}</span>` : ""}<b>${esc(x.t)}</b><span class="simgo">${icon("expand")} Ouvrir à côté</span></button>${g.perso && S.prof ? `<button class="ib sm simsuppr" data-act="simsuppr" data-i="${x.i}" title="Retirer" aria-label="Retirer ${esc(x.t)}">${icon("trash")}</button>` : ""}</div>`).join("")}</div></section>` : ""; }).join("") || `<div class="emptystate"><b>Aucune simulation ne correspond.</b></div>`}
    ${S.prof ? `<section class="edcard"><h2>${icon("plus")} Ajouter une simulation</h2><div class="simajout"><input id="simT" placeholder="Titre (ex. Chute libre)" aria-label="Titre"><input id="simU" type="url" placeholder="https://…" aria-label="Adresse"><button class="btn" data-act="simajout">${icon("plus")} Ajouter</button></div><p class="muted" style="margin:0;font-size:.8rem">Certains sites (Scratch, Tinkercad…) refusent de s'afficher à côté : utilise alors le bouton ↗ du panneau pour les ouvrir dans un onglet.</p></section>` : ""}
    ${pageFoot()}</div>`;
};
document.addEventListener("input", e => { if (e.target.dataset && e.target.dataset.simq) { S.simQ = e.target.value; const pos = e.target.selectionStart; render(); const i = document.querySelector("[data-simq]"); if (i) { i.focus(); i.setSelectionRange(pos, pos); } } });
document.addEventListener("click", async e => {
  const a = e.target.closest && e.target.closest('[data-act="simu"],[data-act="simajout"],[data-act="simsuppr"]'); if (!a) return; e.preventDefault(); e.stopPropagation();
  if (a.dataset.act === "simu") { ouvrirSimu(a.dataset.t, a.dataset.u); return; }
  let L = (R().simulations || []).slice();
  if (a.dataset.act === "simajout") { const t = (document.getElementById("simT").value || "").trim(), u = (document.getElementById("simU").value || "").trim(); if (!t || !/^https:\/\/\S+\.\S+/.test(u)) { toast("Indique un titre et une adresse commençant par https://"); return; } L.push({ t, url: u }); }
  else L.splice(Number(a.dataset.i), 1);
  const data = { ...reglagesData(), simulations: L };
  const { error } = await sb.from("reglages").upsert({ id: 1, data, modifie_le: now().toISOString() }); if (error) { toast("Enregistrement impossible : " + error.message); return; }
  appliquerReglages(data); render(); toast(a.dataset.act === "simajout" ? "Simulation ajoutée" : "Simulation retirée");
}, true);

/* ---------- #18 Outils de physique : unités, tableau périodique, constantes, courbes ---------- */
const ELEM = "H,Hydrogène,1.008,nm|He,Hélium,4.0026,ng|Li,Lithium,6.94,al|Be,Béryllium,9.0122,at|B,Bore,10.81,md|C,Carbone,12.011,nm|N,Azote,14.007,nm|O,Oxygène,15.999,nm|F,Fluor,18.998,ha|Ne,Néon,20.180,ng|Na,Sodium,22.990,al|Mg,Magnésium,24.305,at|Al,Aluminium,26.982,pt|Si,Silicium,28.085,md|P,Phosphore,30.974,nm|S,Soufre,32.06,nm|Cl,Chlore,35.45,ha|Ar,Argon,39.948,ng|K,Potassium,39.098,al|Ca,Calcium,40.078,at|Sc,Scandium,44.956,tr|Ti,Titane,47.867,tr|V,Vanadium,50.942,tr|Cr,Chrome,51.996,tr|Mn,Manganèse,54.938,tr|Fe,Fer,55.845,tr|Co,Cobalt,58.933,tr|Ni,Nickel,58.693,tr|Cu,Cuivre,63.546,tr|Zn,Zinc,65.38,tr|Ga,Gallium,69.723,pt|Ge,Germanium,72.630,md|As,Arsenic,74.922,md|Se,Sélénium,78.971,nm|Br,Brome,79.904,ha|Kr,Krypton,83.798,ng|Rb,Rubidium,85.468,al|Sr,Strontium,87.62,at|Y,Yttrium,88.906,tr|Zr,Zirconium,91.224,tr|Nb,Niobium,92.906,tr|Mo,Molybdène,95.95,tr|Tc,Technétium,98,tr|Ru,Ruthénium,101.07,tr|Rh,Rhodium,102.91,tr|Pd,Palladium,106.42,tr|Ag,Argent,107.87,tr|Cd,Cadmium,112.41,tr|In,Indium,114.82,pt|Sn,Étain,118.71,pt|Sb,Antimoine,121.76,md|Te,Tellure,127.60,md|I,Iode,126.90,ha|Xe,Xénon,131.29,ng|Cs,Césium,132.91,al|Ba,Baryum,137.33,at|La,Lanthane,138.91,ln|Ce,Cérium,140.12,ln|Pr,Praséodyme,140.91,ln|Nd,Néodyme,144.24,ln|Pm,Prométhium,145,ln|Sm,Samarium,150.36,ln|Eu,Europium,151.96,ln|Gd,Gadolinium,157.25,ln|Tb,Terbium,158.93,ln|Dy,Dysprosium,162.50,ln|Ho,Holmium,164.93,ln|Er,Erbium,167.26,ln|Tm,Thulium,168.93,ln|Yb,Ytterbium,173.05,ln|Lu,Lutécium,174.97,ln|Hf,Hafnium,178.49,tr|Ta,Tantale,180.95,tr|W,Tungstène,183.84,tr|Re,Rhénium,186.21,tr|Os,Osmium,190.23,tr|Ir,Iridium,192.22,tr|Pt,Platine,195.08,tr|Au,Or,196.97,tr|Hg,Mercure,200.59,tr|Tl,Thallium,204.38,pt|Pb,Plomb,207.2,pt|Bi,Bismuth,208.98,pt|Po,Polonium,209,pt|At,Astate,210,ha|Rn,Radon,222,ng|Fr,Francium,223,al|Ra,Radium,226,at|Ac,Actinium,227,ac|Th,Thorium,232.04,ac|Pa,Protactinium,231.04,ac|U,Uranium,238.03,ac|Np,Neptunium,237,ac|Pu,Plutonium,244,ac|Am,Américium,243,ac|Cm,Curium,247,ac|Bk,Berkélium,247,ac|Cf,Californium,251,ac|Es,Einsteinium,252,ac|Fm,Fermium,257,ac|Md,Mendélévium,258,ac|No,Nobélium,259,ac|Lr,Lawrencium,266,ac|Rf,Rutherfordium,267,tr|Db,Dubnium,268,tr|Sg,Seaborgium,269,tr|Bh,Bohrium,270,tr|Hs,Hassium,277,tr|Mt,Meitnérium,278,in|Ds,Darmstadtium,281,in|Rg,Roentgenium,282,in|Cn,Copernicium,285,tr|Nh,Nihonium,286,in|Fl,Flérovium,289,in|Mc,Moscovium,290,in|Lv,Livermorium,293,in|Ts,Tennesse,294,in|Og,Oganesson,294,in"
  .split("|").map((x, i) => { const [s, n, m, k] = x.split(","); return { z: i + 1, s, n, m: Number(m), k }; });
const CAT_EL = { nm: "Non-métal", ng: "Gaz noble", al: "Métal alcalin", at: "Métal alcalino-terreux", md: "Métalloïde", ha: "Halogène", pt: "Métal pauvre", tr: "Métal de transition", ln: "Lanthanide", ac: "Actinide", in: "Propriétés inconnues" };
function posElement(z){
  if (z === 1) return [1, 1]; if (z === 2) return [1, 18];
  const P = [[3, 10, 2], [11, 18, 3], [19, 36, 4], [37, 54, 5], [55, 86, 6], [87, 118, 7]];
  for (const [a, b, p] of P) if (z >= a && z <= b) {
    const k = z - a;
    if (p <= 3) return [p, k < 2 ? k + 1 : k + 11];
    if (p <= 5) return [p, k + 1];
    if ((p === 6 && z >= 57 && z <= 71) || (p === 7 && z >= 89 && z <= 103)) return [p === 6 ? 9 : 10, 3 + (z - (p === 6 ? 57 : 89))];
    return [p, k < 2 ? k + 1 : k - 14 + 1 + (k >= 17 ? 0 : 0)];
  }
}
function configElec(z){
  const O = ["1s", "2s", "2p", "3s", "3p", "4s", "3d", "4p", "5s", "4d", "5p", "6s", "4f", "5d", "6p", "7s", "5f", "6d", "7p"], cap = { s: 2, p: 6, d: 10, f: 14 };
  let r = z; const out = []; for (const o of O) { if (r <= 0) break; const n = Math.min(cap[o[1]], r); out.push([o, n]); r -= n; }
  const ex = { 24: [["4s", 1], ["3d", 5]], 29: [["4s", 1], ["3d", 10]], 42: [["5s", 1], ["4d", 5]], 47: [["5s", 1], ["4d", 10]], 79: [["6s", 1], ["5d", 10]], 46: [["5s", 0], ["4d", 10]] };
  if (ex[z]) ex[z].forEach(([o, n]) => { const x = out.find(y => y[0] === o); if (x) x[1] = n; });
  return out.filter(x => x[1] > 0).map(([o, n]) => o + "<sup>" + n + "</sup>").join(" ");
}
const CONSTANTES = [["Vitesse de la lumière dans le vide", "c", "2,998 × 10⁸", "m·s⁻¹", "299792458"], ["Intensité de la pesanteur (Terre)", "g", "9,81", "N·kg⁻¹", "9.81"], ["Constante de gravitation universelle", "G", "6,674 × 10⁻¹¹", "N·m²·kg⁻²", "6.674e-11"], ["Constante d'Avogadro", "Nₐ", "6,022 × 10²³", "mol⁻¹", "6.022e23"], ["Charge élémentaire", "e", "1,602 × 10⁻¹⁹", "C", "1.602e-19"], ["Constante de Planck", "h", "6,626 × 10⁻³⁴", "J·s", "6.626e-34"], ["Masse de l'électron", "mₑ", "9,109 × 10⁻³¹", "kg", "9.109e-31"], ["Masse du proton", "mₚ", "1,673 × 10⁻²⁷", "kg", "1.673e-27"], ["Masse du neutron", "mₙ", "1,675 × 10⁻²⁷", "kg", "1.675e-27"], ["Constante de Boltzmann", "k_B", "1,381 × 10⁻²³", "J·K⁻¹", "1.381e-23"], ["Constante des gaz parfaits", "R", "8,314", "J·mol⁻¹·K⁻¹", "8.314"], ["Constante de Coulomb", "k", "8,988 × 10⁹", "N·m²·C⁻²", "8.988e9"], ["Permittivité du vide", "ε₀", "8,854 × 10⁻¹²", "F·m⁻¹", "8.854e-12"], ["Perméabilité du vide", "μ₀", "1,257 × 10⁻⁶", "H·m⁻¹", "1.257e-6"], ["Volume molaire (0 °C, 1 bar)", "Vₘ", "22,7", "L·mol⁻¹", "22.7"], ["Volume molaire (20 °C, 1 atm)", "Vₘ", "24,0", "L·mol⁻¹", "24.0"], ["Pression atmosphérique normale", "P₀", "1,013 × 10⁵", "Pa", "101325"], ["Masse volumique de l'eau", "ρ", "1,00 × 10³", "kg·m⁻³", "1000"], ["Capacité thermique massique de l'eau", "c", "4,18 × 10³", "J·kg⁻¹·K⁻¹", "4180"], ["Électronvolt", "eV", "1,602 × 10⁻¹⁹", "J", "1.602e-19"], ["Unité astronomique", "ua", "1,496 × 10¹¹", "m", "1.496e11"], ["Année-lumière", "a.l.", "9,461 × 10¹⁵", "m", "9.461e15"], ["Masse de la Terre", "M_T", "5,972 × 10²⁴", "kg", "5.972e24"], ["Rayon de la Terre", "R_T", "6,371 × 10⁶", "m", "6.371e6"], ["Masse du Soleil", "M_S", "1,989 × 10³⁰", "kg", "1.989e30"], ["Produit ionique de l'eau (25 °C)", "Kₑ", "1,0 × 10⁻¹⁴", "", "1e-14"], ["Vitesse du son dans l'air (20 °C)", "v", "343", "m·s⁻¹", "343"]];
const UNITES = {
  "Longueur": { base: "m", u: [["km", 1e3], ["m", 1], ["dm", .1], ["cm", .01], ["mm", 1e-3], ["µm", 1e-6], ["nm", 1e-9], ["pm", 1e-12], ["Å (angström)", 1e-10], ["ua", 1.496e11], ["a.l.", 9.461e15], ["mile", 1609.344], ["pouce", .0254]] },
  "Masse": { base: "kg", u: [["t", 1e3], ["kg", 1], ["g", 1e-3], ["mg", 1e-6], ["µg", 1e-9], ["u (unité de masse atomique)", 1.6605e-27], ["livre (lb)", .45359]] },
  "Volume": { base: "m³", u: [["m³", 1], ["dm³", 1e-3], ["L", 1e-3], ["dL", 1e-4], ["cL", 1e-5], ["mL", 1e-6], ["cm³", 1e-6], ["mm³", 1e-9], ["µL", 1e-9]] },
  "Temps": { base: "s", u: [["an", 3.15576e7], ["jour", 86400], ["h", 3600], ["min", 60], ["s", 1], ["ms", 1e-3], ["µs", 1e-6], ["ns", 1e-9]] },
  "Vitesse": { base: "m/s", u: [["m/s", 1], ["km/h", 1 / 3.6], ["km/s", 1e3], ["nœud", .514444], ["c (vitesse de la lumière)", 299792458]] },
  "Pression": { base: "Pa", u: [["Pa", 1], ["hPa", 100], ["kPa", 1e3], ["MPa", 1e6], ["bar", 1e5], ["mbar", 100], ["atm", 101325], ["mmHg", 133.322]] },
  "Énergie": { base: "J", u: [["J", 1], ["kJ", 1e3], ["MJ", 1e6], ["Wh", 3600], ["kWh", 3.6e6], ["cal", 4.184], ["kcal", 4184], ["eV", 1.602177e-19], ["MeV", 1.602177e-13]] },
  "Puissance": { base: "W", u: [["W", 1], ["mW", 1e-3], ["kW", 1e3], ["MW", 1e6], ["GW", 1e9], ["ch (cheval-vapeur)", 735.499]] },
  "Concentration molaire": { base: "mol/L", u: [["mol/L", 1], ["mmol/L", 1e-3], ["µmol/L", 1e-6], ["mol/m³", 1e-3]] },
  "Concentration en masse": { base: "g/L", u: [["g/L", 1], ["mg/L", 1e-3], ["kg/m³", 1], ["g/mL", 1e3], ["µg/mL", 1e-3]] },
  "Angle": { base: "rad", u: [["rad", 1], ["°", Math.PI / 180], ["tour", 2 * Math.PI]] },
  "Quantité de données": { base: "o", u: [["o", 1], ["bit", 1 / 8], ["kbit", 125], ["Mbit", 125e3], ["Gbit", 125e6], ["ko", 1e3], ["Mo", 1e6], ["Go", 1e9], ["To", 1e12], ["Kio", 1024], ["Mio", 1024 ** 2], ["Gio", 1024 ** 3], ["Tio", 1024 ** 4]] },
  "Température": { temp: true, u: [["°C"], ["K"], ["°F"]] }
};
const versK = (v, u) => u === "K" ? v : u === "°C" ? v + 273.15 : (v - 32) * 5 / 9 + 273.15, depuisK = (k, u) => u === "K" ? k : u === "°C" ? k - 273.15 : (k - 273.15) * 9 / 5 + 32;
const fmtSci = x => { if (!isFinite(x)) return "—"; if (x === 0) return "0"; const a = Math.abs(x); if (a >= 1e-3 && a < 1e6) return String(Math.round(x * 1e6) / 1e6).replace(".", ","); const e = Math.floor(Math.log10(a)), m = x / 10 ** e; return (Math.round(m * 1000) / 1000).toString().replace(".", ",") + " × 10" + String(e).replace(/[-\d]/g, c => "⁻⁰¹²³⁴⁵⁶⁷⁸⁹"["-0123456789".indexOf(c)]); };
VUES_PRO.physique = function(){
  const ong = S.phyOng || "phys", O = [["unites", "Convertisseur d'unités", "ruler"], ["tableau", "Tableau périodique", "atom"], ["phys", "Physique", "pendule"], ["chimie", "Chimie", "flask"], ["formules", "Éditeur de formules", "edit"], ["mesures", "Mesures et incertitudes", "grade"], ["constantes", "Constantes", "key"], ["courbes", "Traceur de courbes", "chart"], ["snt", "SNT · bits et octets", "codeb"]];
  let corps = "";
  if (ong === "unites") {
    const g = S.phyG || "Longueur", G = UNITES[g], de = S.phyDe || G.u[0][0], vers = S.phyVers || (G.u[1] || G.u[0])[0], v = S.phyV ?? "1";
    const x = Number(String(v).replace(",", ".").replace(/\s/g, ""));
    let r = NaN; if (isFinite(x)) { if (G.temp) r = depuisK(versK(x, de), vers); else { const f1 = (G.u.find(u => u[0] === de) || [0, 1])[1], f2 = (G.u.find(u => u[0] === vers) || [0, 1])[1]; r = x * f1 / f2; } }
    corps = `<div class="convbloc"><div class="field"><label for="phyG">Grandeur</label><select id="phyG" data-phy="G">${Object.keys(UNITES).map(k => `<option ${k === g ? "selected" : ""}>${k}</option>`).join("")}</select></div>
      <div class="conv"><div class="convcote"><input id="phyV" data-phy="V" value="${esc(v)}" inputmode="decimal" aria-label="Valeur"><select data-phy="De" aria-label="Unité de départ">${G.u.map(u => `<option ${u[0] === de ? "selected" : ""}>${u[0]}</option>`).join("")}</select></div>
        <button class="ib" data-act="physwap" title="Inverser" aria-label="Inverser les unités">${icon("swap")}</button>
        <div class="convcote res"><output>${fmtSci(r)}</output><select data-phy="Vers" aria-label="Unité d'arrivée">${G.u.map(u => `<option ${u[0] === vers ? "selected" : ""}>${u[0]}</option>`).join("")}</select></div></div>
      ${!G.temp && isFinite(r) ? `<div class="convtous">${G.u.map(u => `<span><b>${fmtSci(x * (G.u.find(y => y[0] === de) || [0, 1])[1] / u[1])}</b> ${u[0]}</span>`).join("")}</div>` : ""}</div>`;
  } else if (ong === "tableau") {
    const sel = ELEM.find(e => e.z === (S.phyEl || 6)), q = sansAccent(S.phyElQ || "");
    corps = `<div class="ptq"><input type="search" data-phy="ElQ" placeholder="Chercher un élément (nom, symbole, Z)…" value="${esc(S.phyElQ || "")}" aria-label="Chercher un élément"></div>
      <div class="ptwrap"><div class="ptable">${ELEM.map(e => { const [r, c] = posElement(e.z), on = !q || sansAccent(e.n + " " + e.s).includes(q) || String(e.z) === q;
        return `<button class="pel k-${e.k}${e.z === sel.z ? " sel" : ""}${on ? "" : " off"}" style="grid-row:${r};grid-column:${c}" data-act="phyel" data-z="${e.z}" title="${esc(e.n)}"><small>${e.z}</small><b>${e.s}</b></button>`; }).join("")}
        <div class="ptlegende">${Object.entries(CAT_EL).map(([k, l]) => `<span class="k-${k}">${l}</span>`).join("")}</div>
        <div class="ptfiche k-${sel.k}"><div class="ptgros"><small>${sel.z}</small><b>${sel.s}</b><span>${fmtNote(sel.m)}</span></div><div><h3>${esc(sel.n)}</h3><p>${CAT_EL[sel.k]}</p><p>Numéro atomique <b>Z = ${sel.z}</b> · Masse molaire <b>${fmtNote(sel.m)} g·mol⁻¹</b></p><p>Configuration électronique : <span class="mono">${configElec(sel.z)}</span></p><p class="muted" style="font-size:.8rem">Période ${posElement(sel.z)[0] > 7 ? (sel.k === "ln" ? 6 : 7) : posElement(sel.z)[0]}${posElement(sel.z)[0] <= 7 ? " · Colonne " + posElement(sel.z)[1] : ""}</p></div></div>
      </div></div>`;
  } else if (ong === "constantes") {
    corps = `<div class="tablewrap"><table class="admtable consttab"><thead><tr><th class="first">Grandeur</th><th>Symbole</th><th>Valeur</th><th>Unité</th><th></th></tr></thead><tbody>${CONSTANTES.map(([n, s, v, u, brut]) => `<tr><td class="first">${n}</td><td class="mono"><b>${s}</b></td><td class="mono">${v}</td><td>${u}</td><td><button class="ib sm" data-act="phycopie" data-v="${brut}" title="Copier la valeur" aria-label="Copier ${esc(n)}">${icon("copy")}</button></td></tr>`).join("")}</tbody></table></div>`;
  } else if (OUTILS_PLUS[ong]) corps = OUTILS_PLUS[ong](); else corps = vueCourbes();
  return `<div class="page wide"><div class="homehead"><h1>Outils Scientifiques Importants</h1></div>
    <div class="phyongs" role="tablist">${O.map(([k, l, ic]) => `<button role="tab" aria-selected="${ong === k}" data-act="phyong" data-o="${k}">${icon(ic)}<span>${l}</span></button>`).join("")}</div>
    <section class="phycorps">${corps}</section>${pageFoot()}</div>`;
};
/* traceur de courbes : tableau de mesures → points, modèle (linéaire, affine, parabole, exponentielle), R² */
const CB = () => S.cb || (S.cb = { x: "x", y: "y", ux: "", uy: "", pts: [["0", "0"], ["1", "2.1"], ["2", "3.9"], ["3", "6.2"], ["4", "7.9"], ["", ""]], mod: "lineaire" });
function ajuster(P, mod){
  const n = P.length; if (n < 2) return null;
  const sx = P.reduce((a, p) => a + p[0], 0), sy = P.reduce((a, p) => a + p[1], 0), sxx = P.reduce((a, p) => a + p[0] * p[0], 0), sxy = P.reduce((a, p) => a + p[0] * p[1], 0);
  let f, txt, k = [];
  if (mod === "lineaire") { const a = sxy / sxx; f = x => a * x; txt = `y = ${fmtSci(a)} × x`; k = [a]; }
  else if (mod === "affine") { const a = (n * sxy - sx * sy) / (n * sxx - sx * sx), b = (sy - a * sx) / n; f = x => a * x + b; txt = `y = ${fmtSci(a)} × x ${b < 0 ? "−" : "+"} ${fmtSci(Math.abs(b))}`; k = [a, b]; }
  else if (mod === "parabole") { if (n < 3) return null; const S4 = [0, 1, 2, 3, 4].map(e => P.reduce((a, p) => a + p[0] ** e, 0)), T = [0, 1, 2].map(e => P.reduce((a, p) => a + p[0] ** e * p[1], 0));
    const M = [[S4[4], S4[3], S4[2], T[2]], [S4[3], S4[2], S4[1], T[1]], [S4[2], S4[1], S4[0], T[0]]];
    for (let i = 0; i < 3; i++) { const piv = M[i][i]; if (!piv) return null; for (let j = i; j < 4; j++) M[i][j] /= piv; for (let r = 0; r < 3; r++) if (r !== i) { const fct = M[r][i]; for (let j = i; j < 4; j++) M[r][j] -= fct * M[i][j]; } }
    const [a, b, c] = [M[0][3], M[1][3], M[2][3]]; f = x => a * x * x + b * x + c; txt = `y = ${fmtSci(a)} x² ${b < 0 ? "−" : "+"} ${fmtSci(Math.abs(b))} x ${c < 0 ? "−" : "+"} ${fmtSci(Math.abs(c))}`; }
  else { const Q = P.filter(p => p[1] > 0); if (Q.length < 2) return null; const r = ajuster(Q.map(p => [p[0], Math.log(p[1])]), "affine"); const A = Math.exp(r.k[1]), kk = r.k[0]; f = x => A * Math.exp(kk * x); txt = `y = ${fmtSci(A)} × e^(${fmtSci(kk)} x)`; }
  const my = sy / n, ssr = P.reduce((a, p) => a + (p[1] - f(p[0])) ** 2, 0), sst = P.reduce((a, p) => a + (p[1] - my) ** 2, 0);
  return { f, txt, r2: sst ? 1 - ssr / sst : 1, k };
}
function vueCourbes(){
  const c = CB();
  return `<div class="cbgrille"><div class="cbdonnees">
      <div class="cbaxes"><label>Abscisse <input data-cb="x" value="${esc(c.x)}" aria-label="Nom de l'abscisse"></label><label>unité <input data-cb="ux" value="${esc(c.ux)}" aria-label="Unité de l'abscisse" placeholder="s"></label>
        <label>Ordonnée <input data-cb="y" value="${esc(c.y)}" aria-label="Nom de l'ordonnée"></label><label>unité <input data-cb="uy" value="${esc(c.uy)}" aria-label="Unité de l'ordonnée" placeholder="m"></label></div>
      <table class="cbtab"><thead><tr><th>${esc(c.x)}</th><th>${esc(c.y)}</th><th></th></tr></thead><tbody>${c.pts.map((p, i) => `<tr><td><input data-cbp="${i}" data-c="0" value="${esc(p[0])}" inputmode="decimal"></td><td><input data-cbp="${i}" data-c="1" value="${esc(p[1])}" inputmode="decimal"></td><td><button class="ib sm" data-act="cbsuppr" data-i="${i}" aria-label="Supprimer la ligne">${icon("x")}</button></td></tr>`).join("")}</tbody></table>
      <div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn ghost sm" data-act="cbligne">${icon("plus")} Ligne</button><button class="btn ghost sm" data-act="cbvider">Vider</button></div>
      <p class="muted" style="font-size:.78rem;margin:0">Astuce : copie deux colonnes depuis Excel ou Regressi et colle-les dans la première case (Ctrl+V).</p></div>
    <div class="cbgraphe"><div class="cbmod">${[["lineaire", "Linéaire y = a·x"], ["affine", "Affine y = a·x + b"], ["parabole", "Parabole"], ["expo", "Exponentielle"]].map(([k, l]) => `<button class="thbtn${c.mod === k ? " on" : ""}" data-act="cbmod" data-m="${k}">${l}</button>`).join("")}</div>
      <canvas id="cbCanvas" width="760" height="460" aria-label="Graphique des mesures"></canvas><div id="cbRes" class="cbres"></div>
      <button class="btn ghost sm" data-act="cbpng">${icon("down")} Télécharger l'image</button></div></div>`;
}
function dessinerCourbe(){
  const cv = document.getElementById("cbCanvas"); if (!cv) return; const c = CB(), g = cv.getContext("2d"), W = cv.width, H = cv.height, m = { l: 64, r: 20, t: 20, b: 48 };
  const valides = c.pts.filter(p => String(p[0]).trim() !== "" && String(p[1]).trim() !== "").map(p => [Number(String(p[0]).replace(",", ".")), Number(String(p[1]).replace(",", "."))]).filter(p => isFinite(p[0]) && isFinite(p[1]));
  const st = getComputedStyle(document.documentElement), ink = st.getPropertyValue("--ink").trim() || "#0B1F28", mut = st.getPropertyValue("--muted").trim() || "#536973", line = st.getPropertyValue("--line").trim() || "#D9E4E8", acc = st.getPropertyValue("--accent").trim() || "#116482";
  g.clearRect(0, 0, W, H); g.fillStyle = st.getPropertyValue("--surface").trim() || "#fff"; g.fillRect(0, 0, W, H);
  const res = document.getElementById("cbRes");
  if (!valides.length) { g.fillStyle = mut; g.font = "15px sans-serif"; g.fillText("Saisis des mesures dans le tableau.", m.l, H / 2); if (res) res.innerHTML = ""; return; }
  let x0 = Math.min(0, ...valides.map(p => p[0])), x1 = Math.max(...valides.map(p => p[0])), y0 = Math.min(0, ...valides.map(p => p[1])), y1 = Math.max(...valides.map(p => p[1]));
  if (x1 === x0) x1 = x0 + 1; if (y1 === y0) y1 = y0 + 1; const px = (x1 - x0) * .06, py = (y1 - y0) * .08; x1 += px; y1 += py; if (x0 < 0) x0 -= px; if (y0 < 0) y0 -= py;
  const X = x => m.l + (x - x0) / (x1 - x0) * (W - m.l - m.r), Y = y => H - m.b - (y - y0) / (y1 - y0) * (H - m.t - m.b);
  const pas = (a, b) => { const r = (b - a) / 6, p = 10 ** Math.floor(Math.log10(r)), n = r / p; return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * p; };
  g.font = "12px sans-serif"; g.lineWidth = 1;
  const sx = pas(x0, x1), sy = pas(y0, y1);
  for (let v = Math.ceil(x0 / sx) * sx; v <= x1; v += sx) { g.strokeStyle = line; g.beginPath(); g.moveTo(X(v), m.t); g.lineTo(X(v), H - m.b); g.stroke(); g.fillStyle = mut; g.textAlign = "center"; g.fillText(fmtSci(Math.round(v / sx) * sx), X(v), H - m.b + 16); }
  for (let v = Math.ceil(y0 / sy) * sy; v <= y1; v += sy) { g.strokeStyle = line; g.beginPath(); g.moveTo(m.l, Y(v)); g.lineTo(W - m.r, Y(v)); g.stroke(); g.fillStyle = mut; g.textAlign = "right"; g.fillText(fmtSci(Math.round(v / sy) * sy), m.l - 6, Y(v) + 4); }
  g.strokeStyle = ink; g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(m.l, Y(Math.min(Math.max(0, y0), y1))); g.lineTo(W - m.r, Y(Math.min(Math.max(0, y0), y1))); g.moveTo(X(Math.min(Math.max(0, x0), x1)), m.t); g.lineTo(X(Math.min(Math.max(0, x0), x1)), H - m.b); g.stroke();
  g.fillStyle = ink; g.textAlign = "center"; g.font = "600 13px sans-serif"; g.fillText(c.x + (c.ux ? " (" + c.ux + ")" : ""), (m.l + W - m.r) / 2, H - 10);
  g.save(); g.translate(16, (m.t + H - m.b) / 2); g.rotate(-Math.PI / 2); g.fillText(c.y + (c.uy ? " (" + c.uy + ")" : ""), 0, 0); g.restore();
  const fit = ajuster(valides, c.mod);
  if (fit) { g.strokeStyle = "#E8710A"; g.lineWidth = 2; g.beginPath(); let d = false; for (let i = 0; i <= 200; i++) { const x = x0 + (x1 - x0) * i / 200, y = fit.f(x); if (!isFinite(y) || y < y0 - (y1 - y0) || y > y1 + (y1 - y0)) { d = false; continue; } d ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)); d = true; } g.stroke(); }
  g.fillStyle = acc; valides.forEach(p => { g.beginPath(); g.moveTo(X(p[0]) - 5, Y(p[1])); g.lineTo(X(p[0]) + 5, Y(p[1])); g.moveTo(X(p[0]), Y(p[1]) - 5); g.lineTo(X(p[0]), Y(p[1]) + 5); g.strokeStyle = acc; g.lineWidth = 2; g.stroke(); });
  if (res) res.innerHTML = fit ? `<b>Modèle :</b> <span class="mono">${esc(fit.txt.replace(/\by\b/, c.y).replace(/\bx\b/g, c.x))}</span> · <b>R²</b> = <span class="mono">${fit.r2.toFixed(4).replace(".", ",")}</span>${fit.r2 > .99 ? " <span class=\"pill ok\">très bon accord</span>" : fit.r2 > .95 ? " <span class=\"pill\">accord correct</span>" : " <span class=\"pill bad\">modèle peu adapté</span>"}` : `<span class="muted">Pas assez de points pour ce modèle.</span>`;
}
document.addEventListener("click", async e => {
  const a = e.target.closest && e.target.closest('[data-act^="phy"],[data-act^="cb"]'); if (!a) return; const act = a.dataset.act; e.preventDefault(); e.stopPropagation(); const c = CB();
  if (act === "phyong") S.phyOng = a.dataset.o;
  else if (act === "physwap") { const g = UNITES[S.phyG || "Longueur"], de = S.phyDe || g.u[0][0], v = S.phyVers || (g.u[1] || g.u[0])[0]; S.phyDe = v; S.phyVers = de; }
  else if (act === "phyel") S.phyEl = Number(a.dataset.z);
  else if (act === "phycopie") { try { await navigator.clipboard.writeText(a.dataset.v); toast("Valeur copiée : " + a.dataset.v); } catch (_) {} return; }
  else if (act === "cbmod") c.mod = a.dataset.m;
  else if (act === "cbligne") c.pts.push(["", ""]);
  else if (act === "cbsuppr") { c.pts.splice(Number(a.dataset.i), 1); if (!c.pts.length) c.pts.push(["", ""]); }
  else if (act === "cbvider") c.pts = [["", ""], ["", ""], ["", ""]];
  else if (act === "cbpng") { const cv = document.getElementById("cbCanvas"); const l = document.createElement("a"); l.download = "courbe-" + sansAccent(c.y + "-" + c.x).replace(/[^a-z0-9]+/g, "-") + ".png"; l.href = cv.toDataURL("image/png"); l.click(); return; }
  else return;
  render();
}, true);
document.addEventListener("change", e => { const d = e.target.dataset || {}; if (!d.phy) return;
  if (d.phy === "G") { S.phyG = e.target.value; S.phyDe = S.phyVers = null; } else if (d.phy === "De") S.phyDe = e.target.value; else if (d.phy === "Vers") S.phyVers = e.target.value; else return; render(); });
document.addEventListener("input", e => { const d = e.target.dataset || {}, c = S.cb;
  if (d.phy === "V") { S.phyV = e.target.value; const o = document.querySelector(".convcote.res output"); const G = UNITES[S.phyG || "Longueur"], de = S.phyDe || G.u[0][0], vers = S.phyVers || (G.u[1] || G.u[0])[0], x = Number(String(S.phyV).replace(",", ".").replace(/\s/g, ""));
    if (o) o.textContent = !isFinite(x) ? "—" : fmtSci(G.temp ? depuisK(versK(x, de), vers) : x * (G.u.find(u => u[0] === de) || [0, 1])[1] / (G.u.find(u => u[0] === vers) || [0, 1])[1]);
    const t = document.querySelector(".convtous"); if (t && !G.temp && isFinite(x)) t.innerHTML = G.u.map(u => `<span><b>${fmtSci(x * (G.u.find(y => y[0] === de) || [0, 1])[1] / u[1])}</b> ${u[0]}</span>`).join(""); return; }
  if (d.phy === "ElQ") { S.phyElQ = e.target.value; const q = sansAccent(S.phyElQ); document.querySelectorAll(".pel").forEach(b => { const el = ELEM[Number(b.dataset.z) - 1]; b.classList.toggle("off", !!q && !sansAccent(el.n + " " + el.s).includes(q) && String(el.z) !== q); }); return; }
  if (d.cb && c) { c[d.cb] = e.target.value; dessinerCourbe(); return; }
  if (d.cbp != null && c) { c.pts[Number(d.cbp)][Number(d.c)] = e.target.value; if (Number(d.cbp) === c.pts.length - 1 && e.target.value) { c.pts.push(["", ""]); const tb = document.querySelector(".cbtab tbody"); if (tb) tb.insertAdjacentHTML("beforeend", `<tr><td><input data-cbp="${c.pts.length - 1}" data-c="0" inputmode="decimal"></td><td><input data-cbp="${c.pts.length - 1}" data-c="1" inputmode="decimal"></td><td><button class="ib sm" data-act="cbsuppr" data-i="${c.pts.length - 1}" aria-label="Supprimer la ligne">${icon("x")}</button></td></tr>`); } dessinerCourbe(); }
});
document.addEventListener("paste", e => { const t = e.target; if (!t.dataset || t.dataset.cbp == null) return; const txt = (e.clipboardData || {}).getData ? e.clipboardData.getData("text") : ""; if (!/[\t;\n]/.test(txt)) return;
  e.preventDefault(); const L = txt.trim().split(/\r?\n/).map(l => l.split(/\t|;/).map(x => x.trim())).filter(l => l.length >= 2 && l[0] !== "");
  const debut = L.length && isNaN(Number(L[0][0].replace(",", "."))) ? L.shift() : null; const c = CB(); if (debut) { c.x = debut[0]; c.y = debut[1]; }
  c.pts = [...L.map(l => [l[0], l[1]]), ["", ""]]; render(); });
new MutationObserver(() => { if (document.getElementById("cbCanvas") && !document.getElementById("cbCanvas").dataset.ok) { document.getElementById("cbCanvas").dataset.ok = 1; dessinerCourbe(); } }).observe(document.documentElement, { childList: true, subtree: true });

/* ---------- #14 Révisions : flashcards par chapitre (thème), mode « révision » ---------- */
const FC = { cours: {}, rev: null };
async function chargerFlash(cid, force){ if (FC.cours[cid] && !force) return FC.cours[cid]; const [r] = await Promise.all([sb.from("flashcards").select("*").eq("classe_id", cid).order("ordre").order("id"), chargerClasse(cid)]); FC.cours[cid] = r.error ? { err: r.error.message, l: [] } : { l: r.data }; return FC.cours[cid]; }
const scoresFC = () => { try { return JSON.parse(localStorage.getItem("pp_fc_" + (S.user && S.user.id)) || "{}"); } catch (_) { return {}; } };
const memoScore = (id, ok) => { const s = scoresFC(); const v = s[id] || { ok: 0, ko: 0 }; ok ? v.ok++ : v.ko++; v.d = Date.now(); s[id] = v; try { localStorage.setItem("pp_fc_" + S.user.id, JSON.stringify(s)); } catch (_) {} };
VUES_PRO.revisions = function(r){
  const act = actives(); if (!act.length) return `<div class="page"><div class="emptystate"><b>Aucun cours.</b></div></div>`;
  const cid = cls(S.fcCours) && !cls(S.fcCours).archive ? S.fcCours : act[0].id, c = cls(cid);
  const d = FC.cours[cid]; if (!d) { chargerFlash(cid).then(() => { if (route().v === "revisions") render(); }); return squelette(); }
  if (FC.rev && FC.rev.cid === cid) return vueRevision(c);
  const data = S.cache[cid] || { themes: [], supports: [] }, sc = scoresFC();
  const groupes = [...data.themes.map(t => ({ id: t.id, titre: t.titre })), { id: null, titre: "Sans chapitre" }].map(g => ({ ...g, cartes: d.l.filter(x => (x.theme_id ?? null) === g.id), docs: data.supports.filter(s => (s.theme_id ?? null) === g.id && !s.brouillon && D(s.publie_le) <= now()) })).filter(g => g.cartes.length || g.docs.length || (S.prof && g.id != null));
  const maitrise = L => { const v = L.map(x => sc[x.id]).filter(Boolean); if (!L.length) return 0; return Math.round(L.filter(x => sc[x.id] && sc[x.id].ok > sc[x.id].ko).length / L.length * 100); };
  return `<div class="page wide" style="--c:var(${C(c.couleur).c})"><div class="homehead"><h1>Révisions et flashcards</h1>
      <div class="field filt"><label for="fcC">Cours</label><select id="fcC" data-fcc="1">${act.map(x => `<option value="${esc(x.id)}" ${x.id === cid ? "selected" : ""}>${esc(x.nom)}</option>`).join("")}</select></div></div>
    <p class="muted" style="margin:0">${S.prof ? "Crée des cartes question/réponse pour chaque chapitre : les élèves les révisent, les cartes ratées reviennent jusqu'à ce qu'elles soient sues." : "Choisis un chapitre et révise : retourne la carte, puis dis si tu savais. Les cartes ratées reviennent jusqu'à ce que tu les saches."}</p>
    ${d.err ? `<p class="err">${esc(d.err)}</p>` : ""}
    ${d.l.length ? `<div><button class="btn" data-act="fcrev" data-t="tout">${icon("cards")} Réviser tout le cours (${d.l.length} carte${d.l.length > 1 ? "s" : ""})</button></div>` : ""}
    <div class="fcgrille">${groupes.filter(g => S.prof || g.cartes.length).map(g => { const m = maitrise(g.cartes); return `<section class="fcchap"><div class="fcchaph"><h2>${esc(g.titre)}</h2>${g.cartes.length ? `<span class="fcmaitr" title="Cartes sues"><i style="width:${m}%"></i></span><small>${m} %</small>` : ""}</div>
        <p class="muted" style="margin:0;font-size:.85rem">${g.cartes.length} carte${g.cartes.length > 1 ? "s" : ""}${g.docs.length ? ` · ${g.docs.length} fiche${g.docs.length > 1 ? "s" : ""} de cours` : ""}</p>
        ${g.docs.length ? `<div class="fcdocs">${g.docs.slice(0, 4).map(s => `<a href="#/classe/${esc(cid)}/travaux">${icon("support")} ${esc(s.titre)}</a>`).join("")}</div>` : ""}
        <div class="fcact">${g.cartes.length ? `<button class="btn tonal sm" data-act="fcrev" data-t="${g.id ?? "none"}">${icon("cards")} Réviser</button>` : ""}${S.prof ? `<button class="btn ghost sm" data-act="fcedit" data-t="${g.id ?? "none"}">${icon("edit")} ${g.cartes.length ? "Modifier les cartes" : "Créer des cartes"}</button>` : ""}</div>
        ${S.prof && String(S.fcEdit) === String(g.id ?? "none") ? editeurCartes(cid, g) : ""}</section>`; }).join("") || `<div class="emptystate"><b>Pas encore de cartes de révision dans ce cours.</b></div>`}</div>${pageFoot()}</div>`;
};
function editeurCartes(cid, g){
  return `<div class="fcedit"><div class="fcliste">${g.cartes.map(x => `<div class="fcligne"><span><b>${esc(x.recto)}</b><small>${esc(x.verso)}</small></span><button class="ib sm" data-act="fcsuppr" data-id="${x.id}" aria-label="Supprimer la carte">${icon("trash")}</button></div>`).join("")}</div>
    <div class="field"><label for="fcNew">Ajouter des cartes : une par ligne, sous la forme <b>question ; réponse</b></label><textarea id="fcNew" rows="5" placeholder="Unité de la quantité de matière ; la mole (mol)&#10;Formule de la concentration en masse ; Cm = m / V"></textarea></div>
    <div style="display:flex;gap:8px"><button class="btn" data-act="fcajout" data-c="${esc(cid)}" data-t="${g.id ?? "none"}">${icon("plus")} Ajouter</button><button class="btn ghost" data-act="fcedit" data-t="">Fermer</button></div></div>`;
}
function vueRevision(c){
  const R2 = FC.rev, carte = R2.file[0];
  if (!carte) return `<div class="page" style="--c:var(${C(c.couleur).c})"><div class="fcfin"><svg viewBox="0 0 52 52" class="fcok"><circle cx="26" cy="26" r="24"/><path d="M14 27l8 8 16-17"/></svg><h2>Révision terminée !</h2>
    <p>${R2.total} carte${R2.total > 1 ? "s" : ""} · <b>${R2.premierCoup}</b> sue${R2.premierCoup > 1 ? "s" : ""} du premier coup${R2.total - R2.premierCoup ? `, ${R2.total - R2.premierCoup} revue${R2.total - R2.premierCoup > 1 ? "s" : ""} plusieurs fois` : ""}.</p>
    <div style="display:flex;gap:8px;justify-content:center"><button class="btn" data-act="fcrev" data-t="${R2.t}">${icon("restore")} Recommencer</button><button class="btn ghost" data-act="fcquitter">Retour aux chapitres</button></div></div>${pageFoot()}</div>`;
  const fait = R2.total - R2.file.length;
  return `<div class="page" style="--c:var(${C(c.couleur).c})"><div class="fcrevtete"><button class="btn ghost sm" data-act="fcquitter">${icon("left")} Chapitres</button><span class="fcprog"><i style="width:${Math.round(fait / R2.total * 100)}%"></i></span><small class="muted">${fait}/${R2.total}</small></div>
    <button class="fccarte${R2.retournee ? " retournee" : ""}" data-act="fcflip" aria-label="Retourner la carte (Espace)"><span class="fcface fcrecto"><small>Question</small><b>${esc(carte.recto)}</b><em>Clique ou appuie sur Espace pour voir la réponse</em></span><span class="fcface fcverso"><small>Réponse</small><b>${esc(carte.verso)}</b></span></button>
    ${R2.retournee ? `<div class="fcrep"><button class="btn danger" data-act="fcnon">${icon("x")} À revoir <kbd>1</kbd></button><button class="btn" data-act="fcoui">${icon("check")} Je savais <kbd>2</kbd></button></div>` : `<div class="fcrep"><button class="btn tonal" data-act="fcflip">Voir la réponse <kbd>Espace</kbd></button></div>`}${pageFoot()}</div>`;
}
document.addEventListener("change", e => { if (e.target.dataset && e.target.dataset.fcc) { S.fcCours = e.target.value; FC.rev = null; S.fcEdit = null; render(); } });
document.addEventListener("click", async e => {
  const a = e.target.closest && e.target.closest('[data-act^="fc"]'); if (!a) return; const act = a.dataset.act; e.preventDefault(); e.stopPropagation();
  const cid = cls(S.fcCours) && !cls(S.fcCours).archive ? S.fcCours : (actives()[0] || {}).id, d = FC.cours[cid];
  if (act === "fcrev") { const L = d.l.filter(x => a.dataset.t === "tout" || String(x.theme_id ?? "none") === a.dataset.t); const sc = scoresFC();
    const file = L.slice().sort((x, y) => ((sc[y.id] || {}).ko || 0) - ((sc[x.id] || {}).ko || 0) || Math.random() - .5);
    FC.rev = { cid, t: a.dataset.t, file, total: file.length, rate: new Set(), premierCoup: 0, retournee: false }; }
  else if (act === "fcflip") { if (!FC.rev) return; FC.rev.retournee = !FC.rev.retournee; const k = document.querySelector(".fccarte"), z = document.querySelector(".fcrep");
    if (k && z) { k.classList.toggle("retournee", FC.rev.retournee); z.innerHTML = FC.rev.retournee ? `<button class="btn danger" data-act="fcnon">${icon("x")} À revoir <kbd>1</kbd></button><button class="btn" data-act="fcoui">${icon("check")} Je savais <kbd>2</kbd></button>` : `<button class="btn tonal" data-act="fcflip">Voir la réponse <kbd>Espace</kbd></button>`; return; } }
  else if (act === "fcoui" || act === "fcnon") { sortieCarte(act === "fcoui" ? 1 : -1); const R2 = FC.rev, x = R2.file.shift(); memoScore(x.id, act === "fcoui");
    if (act === "fcoui") { if (!R2.rate.has(x.id)) R2.premierCoup++; } else { R2.rate.add(x.id); R2.file.splice(Math.min(R2.file.length, 3), 0, x); } R2.retournee = false; if (!R2.file.length) celebrer("Révision terminée !"); }
  else if (act === "fcquitter") FC.rev = null;
  else if (act === "fcedit") S.fcEdit = a.dataset.t || null;
  else if (act === "fcajout") { const lignes = ((document.getElementById("fcNew") || {}).value || "").split(/\r?\n/).map(l => l.split(/\s*[;|]\s*|\t/)).filter(p => p.length >= 2 && p[0].trim() && p.slice(1).join(" ; ").trim());
    if (!lignes.length) { toast("Écris au moins une ligne « question ; réponse »."); return; }
    const t = a.dataset.t === "none" ? null : Number(a.dataset.t), base = d.l.length;
    const { error } = await sb.from("flashcards").insert(lignes.map((p, i) => ({ classe_id: a.dataset.c, theme_id: t, recto: p[0].trim(), verso: p.slice(1).join(" ; ").trim(), ordre: base + i })));
    if (error) { toast("Ajout impossible : " + error.message); return; } await chargerFlash(a.dataset.c, true); toast(lignes.length + " carte" + (lignes.length > 1 ? "s ajoutées" : " ajoutée")); }
  else if (act === "fcsuppr") { const { error } = await sb.from("flashcards").delete().eq("id", Number(a.dataset.id)); if (error) { toast("Suppression impossible : " + error.message); return; } await chargerFlash(cid, true); }
  render();
}, true);
document.addEventListener("keydown", e => { if (!FC.rev || route().v !== "revisions" || /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || "")) return;
  const clic = s => { const b = document.querySelector(`[data-act="${s}"]`); if (b) { e.preventDefault(); b.click(); } };
  if (e.key === " ") clic("fcflip"); else if (e.key === "1" && FC.rev.retournee) clic("fcnon"); else if (e.key === "2" && FC.rev.retournee) clic("fcoui"); });

/* ---------- Compteur de visites (prof) : comptes, visites, personnes en ligne ---------- */
let presenceOn = false, presenceRpc = true;
function idSession(){ const k = "pp_sess_" + (S.user && S.user.id); try { let v = sessionStorage.getItem(k); if (!v) { v = (crypto.randomUUID ? crypto.randomUUID() : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16))); sessionStorage.setItem(k, v); } return v; } catch (_) { return null; } }
function nomAppareil(){
  const u = navigator.userAgent, os = /iPhone/.test(u) ? "iPhone" : /iPad/.test(u) ? "iPad" : /Android/.test(u) ? "Android" : /Windows/.test(u) ? "Windows" : /Mac OS X/.test(u) ? "Mac" : /CrOS/.test(u) ? "Chromebook" : /Linux/.test(u) ? "Linux" : "Appareil";
  const nav = /Edg\//.test(u) ? "Edge" : /OPR\//.test(u) ? "Opera" : /Firefox\//.test(u) ? "Firefox" : /Chrome\//.test(u) ? "Chrome" : /Safari\//.test(u) ? "Safari" : "Navigateur";
  return os + " · " + nav + (window.matchMedia && matchMedia("(display-mode: standalone)").matches ? " (application)" : "");
}
async function signalerPresence(){
  if (!S.user) return;
  const id = idSession();
  if (presenceRpc && id) {
    const { data, error } = await sb.rpc("pp_presence", { p_session: id, p_appareil: nomAppareil(), p_visible: document.visibilityState === "visible" });
    if (!error) { if (data === true) deconnexionForcee(); return; }
    if (/pp_presence|function/i.test(error.message || "")) presenceRpc = false;   // étape 23 pas encore installée
  }
  if (document.visibilityState === "visible") sb.rpc("pp_visite").then(() => {}, () => {});
}
async function deconnexionForcee(){
  try { sessionStorage.removeItem("pp_sess_" + (S.user && S.user.id)); sessionStorage.setItem("pp_kick", "1"); } catch (_) {}
  try { await sb.auth.signOut({ scope: "local" }); } catch (_) {}
  /* on ferme aussi la session Microsoft de ce navigateur, sinon l'élève suivant serait connecté automatiquement */
  location.replace("https://login.microsoftonline.com/common/oauth2/v2.0/logout?post_logout_redirect_uri=" + encodeURIComponent(ICI));
}
function demarrerPresence(){
  if (presenceOn) return; presenceOn = true;
  signalerPresence();
  setInterval(signalerPresence, 30000);
  document.addEventListener("visibilitychange", signalerPresence); window.addEventListener("pagehide", signalerPresence);
  if (S.prof) { chargerStatsVisites(); setInterval(() => { if (document.visibilityState === "visible") chargerStatsVisites(); }, 20000); document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") chargerStatsVisites(); }); }
}
async function chargerStatsVisites(){
  if (!S.prof) return; const { data, error } = await sb.rpc("pp_stats_visites"); if (error || !data) return;
  S.stv = typeof data === "string" ? JSON.parse(data) : data; document.querySelectorAll(".compteur").forEach(z => z.outerHTML = compteurVisites());
}
function compteurVisites(){
  if (!S.prof || !S.stv) return S.prof ? `<div class="compteur"></div>` : "";
  const v = S.stv, noms = (v.noms || []).slice(0, 12);
  return `<div class="compteur"><span class="cpt" title="Élèves qui se sont déjà connectés au site">${icon("people")}<b>${v.comptes}</b> élève${v.comptes > 1 ? "s" : ""} déjà connecté${v.comptes > 1 ? "s" : ""}</span>
    <span class="cpt" title="Visites des élèves (une nouvelle visite après 30 minutes d'absence)">${icon("eye")}<b>${v.visites}</b> visite${v.visites > 1 ? "s" : ""} d'élèves</span>
    <span class="cpt" title="Élèves connectés aujourd'hui">${icon("cal")}<b>${v.aujourdhui}</b> élève${v.aujourdhui > 1 ? "s" : ""} aujourd'hui</span>
    <button class="cpt enligne" data-act="enligne" title="Voir qui est en ligne et déconnecter une session"><i class="pastille"></i><b>${v.enligne}</b> élève${v.enligne > 1 ? "s" : ""} en ligne${v.inactifs ? `<span class="cptinact"><i></i>${v.inactifs} inactif${v.inactifs > 1 ? "s" : ""}</span>` : ""}</button></div>`;
}

/* ---------- Glisser-déposer des cours dans le menu de gauche ---------- */
const DM = { el: null, y0: 0, on: false, pid: null, bloque: false };
document.addEventListener("pointerdown", e => { if (e.button !== 0) return; const it = e.target.closest && e.target.closest(".drawer a.itcours"); if (!it) return; DM.el = it; DM.y0 = e.clientY; DM.on = false; DM.pid = e.pointerId; });
document.addEventListener("pointermove", e => {
  if (!DM.el || e.pointerId !== DM.pid) return;
  if (!DM.on) { if (Math.abs(e.clientY - DM.y0) < 8) return; if (e.pointerType === "touch") { DM.el = null; return; } DM.on = true; DM.el.classList.add("dmplace"); document.body.classList.add("dragging"); }
  e.preventDefault();
  const L = [...document.querySelectorAll(".drawer a.itcours")], cible = L.find(x => { const r = x.getBoundingClientRect(); return e.clientY >= r.top && e.clientY <= r.bottom; });
  if (cible && cible !== DM.el) { const r = cible.getBoundingClientRect(); cible.parentNode.insertBefore(DM.el, e.clientY < r.top + r.height / 2 ? cible : cible.nextSibling); }
});
document.addEventListener("pointerup", e => { if (!DM.el || e.pointerId !== DM.pid) return; const el = DM.el; DM.el = null;
  if (!DM.on) return; DM.on = false; el.classList.remove("dmplace"); document.body.classList.remove("dragging"); DM.bloque = true; setTimeout(() => DM.bloque = false, 60);
  const ids = [...document.querySelectorAll(".drawer a.itcours")].map(x => x.dataset.cid); if (ids.join() !== actives().map(c => c.id).join()) enregistrerOrdre(ids); });
document.addEventListener("click", e => { if (DM.bloque && e.target.closest && e.target.closest(".drawer")) { e.preventDefault(); e.stopPropagation(); } }, true);
document.addEventListener("dragstart", e => { if (e.target.closest && e.target.closest(".drawer a.itcours")) e.preventDefault(); });



/* ---------- Calendrier dynamique (Excel privé du prof, affiché à côté de la page) ---------- */
const CAL_CHEMIN = "prof/calendrier-dynamique.xlsx";
/* lien Google Drive du calendrier partagé par la direction : toujours la dernière version */
const CAL_DRIVE = "1YXfbYl-v3lrAA1VUjQO4WGC1NTR_SYRe";
function lienCalendrier(){
  const l = (R().liensUtiles || []).find(x => x.icone === "logo-calendrier"), u = l && /^https?:\/\//.test(l.url || "") ? l.url : "https://drive.google.com/file/d/" + CAL_DRIVE + "/view";
  const id = (u.match(/\/(?:file|spreadsheets)\/d\/([\w-]{20,})/) || [])[1];
  return id ? { vue: "https://drive.google.com/file/d/" + id + "/preview", ext: "https://docs.google.com/spreadsheets/d/" + id + "/edit" } : { vue: u, ext: u };
}
async function ouvrirCalendrier(forcer){
  if (SP.cle === "logo-calendrier" && !forcer) { fermerCote(); return; }
  { const L = lienCalendrier(), o = COTE_A_COTE["logo-calendrier"]; o.mode = "cadre"; o.remplacer = false; o.lienExt = L.ext; SP.cle = null; ouvrirCote("logo-calendrier", L.vue, "Calendrier"); return; }
  const { data, error } = await sb.storage.from("documents").createSignedUrl(CAL_CHEMIN, 3600);
  if (error || !data || !data.signedUrl) { COTE_A_COTE["logo-calendrier"].mode = "televerser"; SP.cle = null; ouvrirCote("logo-calendrier", "#", "Calendrier"); return; }
  COTE_A_COTE["logo-calendrier"].mode = "cadre"; SP.cle = null;
  ouvrirCote("logo-calendrier", "https://view.officeapps.live.com/op/embed.aspx?src=" + encodeURIComponent(data.signedUrl), "Calendrier");
}
document.addEventListener("click", e => { const a = e.target.closest && e.target.closest('a.qside[data-cle="logo-calendrier"]'); if (!a || e.ctrlKey || e.metaKey) return; e.preventDefault(); e.stopImmediatePropagation(); if (S.apps) { S.apps = false; render(); } ouvrirCalendrier(); }, true);
document.addEventListener("change", async e => { const i = e.target; if (!i.dataset || !i.dataset.calfile || !i.files[0]) return; const f = i.files[0];
  toast("Envoi du calendrier…"); const { error } = await sb.storage.from("documents").upload(CAL_CHEMIN, f, { upsert: true, contentType: f.type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  if (error) { toast("Envoi impossible : " + error.message); return; } toast("Calendrier enregistré"); ouvrirCalendrier(true); });

/* nom du cours sur une seule ligne dans le menu : la taille du texte s'ajuste si le nom est long */
function ajusterNomsCours(){ document.querySelectorAll(".drawer a.itcours .cnom").forEach(n => { n.style.fontSize = ""; const lbl = n.parentElement, max = lbl.clientWidth; if (!max) return; let t = 15; while (n.scrollWidth > max && t > 10) { t -= .5; n.style.fontSize = t + "px"; } }); }
new MutationObserver(() => { if (document.querySelector(".drawer a.itcours .cnom:not([data-ajuste])")) { document.querySelectorAll(".drawer a.itcours .cnom").forEach(n => n.dataset.ajuste = 1); ajusterNomsCours(); } }).observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener("resize", ajusterNomsCours);
