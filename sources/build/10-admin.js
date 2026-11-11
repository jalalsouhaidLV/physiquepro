/* ---------- Paramètres de PhysiquePro (administration, prof uniquement) ---------- */
const ADM_TABS = [["profil", "Profil et notifications"], ["site", "Site"], ["cours", "Cours"], ["eleves", "Élèves"], ["fichiers", "Fichiers"], ["import", "Importer"], ["sauvegarde", "Sauvegarde"]];
const admTab = r => !S.prof ? "profil" : ADM_TABS.some(([k]) => k === r.a) ? r.a : "profil";
const getPath = (o, p) => p.split(".").reduce((x, k) => x == null ? x : x[k], o);
function setPath(o, p, v){ const ks = p.split("."), last = ks.pop(); const t = ks.reduce((x, k) => x[k], o); t[last] = v; }
const sansAccent = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const taille = b => b >= 1e9 ? (b / 1e9).toFixed(2).replace(".", ",") + " Go" : b >= 1e6 ? (b / 1e6).toFixed(1).replace(".", ",") + " Mo" : Math.max(0, Math.round(b / 1e3)) + " Ko";

function telecharger(nom, contenu, type){
  const b = new Blob([contenu], { type }), u = URL.createObjectURL(b), a = document.createElement("a");
  a.href = u; a.download = nom; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 5000);
}
const csv = rows => "﻿" + rows.map(r => r.map(v => { v = v == null ? "" : String(v); return /[";\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(";")).join("\r\n");

function initAdm(){
  if (S.adm) return;
  S.adm = { prof: { nom: R().prof.nom, titre: R().prof.titre }, liensUtiles: clone(R().liensUtiles), outils: clone(R().outils), remarques: R().remarques.join("\n"), onedrive: R().onedrive, busy: false, err: "", modif: false };
}

function vAdmin(r){
  const tab = admTab(r);
  const head = `<div class="tabsbar" style="--c:var(--accent)"><div class="tabs" role="tablist">${ADM_TABS.filter(([k]) => S.prof || k === "profil").map(([k, l]) => `<a role="tab" aria-selected="${tab === k}" href="#/admin/${k}">${l}</a>`).join("")}</div></div>`;
  const body = tab === "profil" ? admProfil() : tab === "site" ? admSite() : tab === "cours" ? admCours() : tab === "eleves" ? admEleves() : tab === "fichiers" ? admFichiers() : tab === "import" ? admImport() : admSauvegarde();
  return head + `<div class="page wide adm${tab === "profil" ? " crpage" : ""}"><div class="homehead"><h1>Paramètres</h1></div>${body}${pageFoot()}</div>`;
}

/* ----- onglet Site : identité, liens rapides, boîte à outils ----- */
function admOutils(){
  initAdm(); const A = S.adm, H = admHelpers(A);
  return `<div class="savebar${A.modif ? " on" : ""}"><span>${A.modif ? "Modifications non enregistrées" : "Ajoute, modifie ou supprime des liens, puis enregistre."}</span><span class="spacer"></span>
      <button class="btn ghost sm" data-act="outilsfin">Terminer</button><button class="btn sm" data-act="admsave" ${A.busy || !A.modif ? "disabled" : ""}>${A.busy ? "Enregistrement…" : "Enregistrer"}</button></div>
    ${A.err ? `<div class="notice" style="background:var(--bad-bg);color:var(--bad)">${esc(A.err)}</div>` : ""}${admOutilsSection(A, H.inp, H.outilsBtns)}`;
}
function admHelpers(A){
  const inp = (path, ph = "", type = "text", lab = "") => `<input type="${type}" data-ad="${path}" value="${esc(getPath(A, path))}" placeholder="${esc(ph)}" aria-label="${esc(lab || ph)}">`;
  const outilsBtns = (path, i, n) => `<span class="adbtns">${i > 0 ? `<button class="ib sm" data-act="admv" data-path="${path}" data-i="${i}" data-dir="-1" title="Monter" aria-label="Monter">${icon("up")}</button>` : ""}${i < n - 1 ? `<button class="ib sm" data-act="admv" data-path="${path}" data-i="${i}" data-dir="1" title="Descendre" aria-label="Descendre">${icon("down")}</button>` : ""}<button class="ib sm" data-act="adrm" data-path="${path}" data-i="${i}" title="Supprimer" aria-label="Supprimer">${icon("x")}</button></span>`;
  return { inp, outilsBtns };
}
function admSite(){
  initAdm(); const A = S.adm;
  const inp = (path, ph = "", type = "text", lab = "") => `<input type="${type}" data-ad="${path}" value="${esc(getPath(A, path))}" placeholder="${esc(ph)}" aria-label="${esc(lab || ph)}">`;
  const outilsBtns = (path, i, n) => `<span class="adbtns">${i > 0 ? `<button class="ib sm" data-act="admv" data-path="${path}" data-i="${i}" data-dir="-1" title="Monter" aria-label="Monter">${icon("up")}</button>` : ""}${i < n - 1 ? `<button class="ib sm" data-act="admv" data-path="${path}" data-i="${i}" data-dir="1" title="Descendre" aria-label="Descendre">${icon("down")}</button>` : ""}<button class="ib sm" data-act="adrm" data-path="${path}" data-i="${i}" title="Supprimer" aria-label="Supprimer">${icon("x")}</button></span>`;
  const quickPreview = `<nav class="quick preview-quick" aria-label="Aperçu des liens rapides">${A.liensUtiles.filter(l => l.nom).map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener" class="${l.principal ? "main" : ""}" style="--q:${esc(l.couleur || "#116482")}"><span class="qi">${quickIcon(l.icone)}</span><span class="ql">${esc(l.nom)}</span></a>`).join("")}</nav>`;
  return `${A.err ? `<div class="notice" style="background:var(--bad-bg);color:var(--bad)">${esc(A.err)}</div>` : ""}
    <div class="savebar${A.modif ? " on" : ""}"><span>${A.modif ? "Modifications non enregistrées" : "Tout est enregistré"}</span><span class="spacer"></span>
      ${A.modif ? `<button class="btn ghost sm" data-act="admreset">Annuler</button>` : ""}<button class="btn sm" data-act="admsave" ${A.busy || !A.modif ? "disabled" : ""}>${A.busy ? "Enregistrement…" : "Enregistrer"}</button></div>
    <section class="edcard"><h2>${icon("people")} Identité</h2>
      <div class="two"><div class="field"><label>Nom affiché</label>${inp("prof.nom", "ex. Jalal SOUHAID", "text", "Nom affiché")}</div>
      <div class="field"><label>Adresse du professeur</label><input value="${esc(R().prof.email)}" disabled aria-label="Adresse du professeur"></div></div>
      <div class="field"><label>Titre (bas de chaque page)</label>${inp("prof.titre", "ex. Professeur de Physique-Chimie", "text", "Titre")}</div>
      <p class="muted" style="margin:0;font-size:.82rem">Ton adresse ne se change pas ici : c'est elle qui te donne les droits de professeur.</p>
    </section>
    <section class="edcard"><h2>${icon("links")} Liens rapides en haut de page</h2>
      <p class="muted" style="margin:0;font-size:.85rem">Visibles par tous (toi et les élèves). Le lien « principal » est mis en avant (comme Pronote).</p>
      <div class="box" style="padding:10px">${quickPreview}</div>
      <div class="adlist">${A.liensUtiles.map((l, i) => `<div class="adrow lien">
        ${inp("liensUtiles." + i + ".nom", "Nom", "text", "Nom du lien " + (i + 1))}
        ${inp("liensUtiles." + i + ".url", "https://…", "url", "Adresse du lien " + (i + 1))}
        <select data-ad="liensUtiles.${i}.icone" aria-label="Icône">${ICONES.map(([v, t]) => `<option value="${v}" ${l.icone === v ? "selected" : ""}>${t}</option>`).join("")}</select>
        <input type="color" data-ad="liensUtiles.${i}.couleur" value="${esc(/^#[0-9a-f]{6}$/i.test(l.couleur || "") ? l.couleur : "#116482")}" aria-label="Couleur" title="Couleur">
        <label class="check" title="Lien principal"><input type="checkbox" data-ad="liensUtiles.${i}.principal" ${l.principal ? "checked" : ""}> Principal</label>
        <label class="check" title="Visible seulement par le professeur"><input type="checkbox" data-ad="liensUtiles.${i}.prof" ${l.prof ? "checked" : ""}> Prof seul</label>
        <label class="check" title="Masqué sur téléphone (place limitée)"><input type="checkbox" data-ad="liensUtiles.${i}.ordi" ${l.ordi ? "checked" : ""}> Ordinateur seul</label>
        ${outilsBtns("liensUtiles", i, A.liensUtiles.length)}</div>`).join("")}</div>
      <div><button class="btn ghost sm" data-act="adadd" data-path="liensUtiles" data-tpl="lien">${icon("plus")} Ajouter un lien rapide</button></div>
    </section>
    ${admOutilsSection(A, inp, outilsBtns)}
    <section class="edcard"><h2>${icon("nuage")} OneDrive</h2>
      <p class="muted" style="margin:0;font-size:.88rem">Activé, chaque document que tu joins est rangé dans ton OneDrive : <b>${OD_RACINE} › classe › thème › activité</b>, et partagé avec le lycée en lecture. Les élèves l'ouvrent dans Word, Excel ou PowerPoint en ligne. Toi, tu peux le modifier directement. Les travaux rendus par les élèves sont copiés dans <b>… › activité › Travaux rendus</b>.</p>
      <div class="setrow"><span><b>Connexion à OneDrive</b><small class="muted">${S.odOk ? "Connecté." : "À faire une fois : Microsoft te demande ton accord."}</small></span><button class="btn ghost sm" data-act="odconnect">${icon("nuage")} ${S.odOk ? "Vérifier" : "Connecter OneDrive"}</button></div>
      <label class="switch"><span><b>Ranger mes documents dans OneDrive</b><small class="muted">Les nouveaux documents joints vont dans OneDrive au lieu du stockage de PhysiquePro.</small></span><input type="checkbox" data-ad="onedrive" ${A.onedrive ? "checked" : ""}><i aria-hidden="true"></i></label>
      <div class="setrow"><span><b>Documents déjà publiés</b><small class="muted">Copie dans OneDrive les documents importés avant l'activation, puis met à jour les liens.</small></span><button class="btn ghost sm" data-act="odmigrer" ${S.odBusy ? "disabled" : ""}>${S.odBusy ? "Copie en cours… " + (S.odN || 0) : "Ranger dans OneDrive"}</button></div>
      <div class="setrow"><span><b>Confidentialité des dossiers</b><small class="muted">Les élèves ne voient jamais tes dossiers OneDrive : seulement les fichiers publiés pour eux sur le site. Les fichiers des brouillons restent privés jusqu'à leur publication. Vérification automatique à chaque ouverture du site.</small></span><button class="btn ghost sm" data-act="odconf">${icon("key")} Vérifier maintenant</button></div>
      <div class="setrow"><span><b>Dossiers des cours</b><small class="muted">Un dossier par cours, au nom actuel du cours : renomme les anciens dossiers, fusionne les doublons et met à jour les liens. Se fait aussi automatiquement quand tu renommes un cours.</small></span><button class="btn ghost sm" data-act="odranger">${icon("folder")} Ranger les dossiers</button></div>
      <div class="setrow"><span><b>Dossiers des cours supprimés</b><small class="muted">Quand tu supprimes un cours, son dossier OneDrive part automatiquement dans la corbeille. Ce bouton fait le ménage pour les cours supprimés avant cette option.</small></span><button class="btn ghost sm" data-act="odorphelins">${icon("trash")} Chercher</button></div>
    </section>
    <section class="edcard"><h2>${icon("comment")} Remarques de correction</h2>
      <p class="muted" style="margin:0;font-size:.85rem">Une remarque par ligne. Elles s'insèrent en un clic quand tu notes un travail.</p>
      <textarea data-ad="remarques" rows="7" class="adtext" aria-label="Remarques de correction">${esc(A.remarques)}</textarea></section>
    <section class="edcard"><h2>${icon("restore")} Valeurs d'origine</h2>
      <div class="setrow"><span><b>Revenir aux réglages d'origine</b><small class="muted">Remet le nom, les liens rapides et la boîte à outils du fichier config.js. Rien n'est enregistré tant que tu ne cliques pas sur « Enregistrer ».</small></span><button class="btn ghost sm" data-act="admdefaut">Rétablir</button></div>
    </section>`;
}
async function admEnregistrer(){
  const A = S.adm; A.err = "";
  const liens = A.liensUtiles.map(l => ({ nom: (l.nom || "").trim(), url: (l.url || "").trim(), icone: l.icone || "links", couleur: l.couleur || "#116482", principal: !!l.principal, prof: !!l.prof, ordi: !!l.ordi })).filter(l => l.nom || l.url);
  const outils = A.outils.map(g => ({ matiere: (g.matiere || "").trim(), couleur: g.couleur || "pc", liens: (g.liens || []).map(x => x.map(v => String(v || "").trim())).filter(x => x[0] || x[2]) })).filter(g => g.matiere || g.liens.length);
  if (!A.prof.nom.trim()) { A.err = "Le nom affiché est obligatoire."; return render(); }
  if (liens.some(l => !l.nom || !/^https?:\/\//.test(l.url))) { A.err = "Chaque lien rapide doit avoir un nom et une adresse qui commence par https://"; return render(); }
  if (outils.some(g => !g.matiere)) { A.err = "Chaque groupe de la boîte à outils doit avoir un nom."; return render(); }
  if (outils.some(g => g.liens.some(x => !x[0] || !/^https?:\/\//.test(x[2])))) { A.err = "Chaque outil doit avoir un nom et une adresse qui commence par https://"; return render(); }
  const data = { prof: { nom: A.prof.nom.trim(), titre: (A.prof.titre || "").trim() }, liensUtiles: liens, outils, remarques: String(A.remarques || "").split("\n").map(x => x.trim()).filter(Boolean), onedrive: !!A.onedrive };
  A.busy = true; render();
  const { error } = await sb.from("reglages").upsert({ id: 1, data, modifie_le: now().toISOString() });
  if (error) { A.busy = false; A.err = /reglages/.test(error.message) ? "La base n'est pas encore à jour (script 07 à exécuter dans Supabase)." : "Enregistrement impossible : " + error.message; return render(); }
  appliquerReglages(data); S.nom = R().prof.nom; S.adm = null; S.outilsEdit = false; toast("Réglages du site enregistrés"); render();
}

function admOutilsSection(A, inp, outilsBtns){
  return `<section class="edcard"><h2>${icon("tools")} Boîte à outils</h2>
      <p class="muted" style="margin:0;font-size:.85rem">Page « Boîte à outils » du menu, visible par les élèves. Un groupe par matière.</p>
      ${A.outils.map((g, i) => `<div class="adgroup" style="--c:var(--${esc(g.couleur || "pc")})">
        <div class="adrow grp">${inp("outils." + i + ".matiere", "Nom du groupe (ex. Physique-Chimie)", "text", "Nom du groupe")}
          <select data-ad="outils.${i}.couleur" aria-label="Couleur du groupe">${COULEURS.map(([v, t]) => `<option value="${v}" ${g.couleur === v ? "selected" : ""}>${t}</option>`).join("")}</select>
          ${outilsBtns("outils", i, A.outils.length)}</div>
        ${(g.liens || []).map((x, j) => `<div class="adrow outil">${inp("outils." + i + ".liens." + j + ".0", "Nom de l'outil", "text", "Nom de l'outil")}${inp("outils." + i + ".liens." + j + ".1", "Description courte", "text", "Description")}${inp("outils." + i + ".liens." + j + ".2", "https://…", "url", "Adresse")}<button class="ib sm" data-act="adrm" data-path="outils.${i}.liens" data-i="${j}" title="Supprimer" aria-label="Supprimer l'outil">${icon("x")}</button></div>`).join("")}
        <div><button class="linkbtn" data-act="adadd" data-path="outils.${i}.liens" data-tpl="outil">${icon("plus")} Ajouter un outil</button></div></div>`).join("")}
      <div><button class="btn ghost sm" data-act="adadd" data-path="outils" data-tpl="groupe">${icon("plus")} Ajouter un groupe</button></div>
    </section>`;
}
/* ----- onglet Cours ----- */
function admCours(){
  const list = [...actives(), ...S.classes.filter(c => c.archive)];
  return `<div class="travhead"><button class="btn" data-act="newclass">${icon("plus")} Créer un cours</button><span class="spacer"></span><span class="muted" style="font-size:.85rem">L'ordre ici est celui de l'accueil et du menu.</span></div>
    <div class="tablewrap"><table class="admtable"><thead><tr><th>Ordre</th><th class="first">Cours</th><th>Élèves</th><th>Code</th><th>Visio</th><th>OneDrive</th><th>Statut</th><th></th></tr></thead><tbody>
    ${list.map(c => { const act = actives(), i = act.indexOf(c);
      return `<tr><td>${c.archive ? "" : `<span class="adbtns">${i > 0 ? `<button class="ib sm" data-act="moveclasse" data-c="${esc(c.id)}" data-dir="-1" aria-label="Monter ${esc(c.nom)}" title="Monter">${icon("up")}</button>` : ""}${i < act.length - 1 ? `<button class="ib sm" data-act="moveclasse" data-c="${esc(c.id)}" data-dir="1" aria-label="Descendre ${esc(c.nom)}" title="Descendre">${icon("down")}</button>` : ""}</span>`}</td>
        <td class="first"><a class="who2" href="#/classe/${esc(c.id)}" style="text-decoration:none;color:inherit"><span class="ini" style="--bb:var(${C(c.couleur).b})">${esc((c.symbole || c.nom).slice(0, 3))}</span><span><b>${esc(c.nom)}</b><small class="muted" style="display:block">${esc(c.section)}</small></span></a></td>
        <td><a href="#/classe/${esc(c.id)}/personnes">${nbTxt(S.nbEleves[c.id])}</a></td>
        <td class="mono">${c.code ? esc(c.code) + (c.code_actif ? "" : ` <span class="pill">désactivé</span>`) : ""}</td>
        <td>${c.teams_url ? `<a href="${esc(c.teams_url)}" target="_blank" rel="noopener">${icon("video")}</a>` : `<span class="muted">—</span>`}</td>
        <td>${c.dossier_onedrive ? `<a href="${esc(c.dossier_onedrive)}" target="_blank" rel="noopener">${icon("folder")}</a>` : `<span class="muted">—</span>`}</td>
        <td>${c.archive ? `<span class="pill">Archivé</span>` : `<span class="pill ok">Actif</span>`}</td>
        <td><span class="adbtns"><a class="ib sm" href="#/classe/${esc(c.id)}/parametres" title="Paramètres du cours" aria-label="Paramètres de ${esc(c.nom)}">${icon("gear")}</a>
          <button class="ib sm" data-act="archiver" data-c="${esc(c.id)}" data-on="${c.archive ? "0" : "1"}" data-stay="1" title="${c.archive ? "Restaurer" : "Archiver"}" aria-label="${c.archive ? "Restaurer" : "Archiver"} ${esc(c.nom)}">${icon(c.archive ? "restore" : "archive")}</button>
          ${c.archive ? `<button class="ib sm" data-act="supprclasse" data-c="${esc(c.id)}" title="Supprimer" aria-label="Supprimer ${esc(c.nom)}" style="color:var(--bad)">${icon("trash")}</button>` : ""}</span></td></tr>`; }).join("")}
    </tbody></table></div>`;
}

/* ----- onglet Élèves ----- */
function tousLesEleves(){
  const M = new Map();
  (S.toutesInscriptions || []).forEach(x => { const e = M.get(x.email) || { email: x.email, nom: x.nom, classes: new Set(), compte: false }; e.classes.add(x.classe_id); M.set(x.email, e); });
  (S.comptes || []).filter(p => p.role !== "prof").forEach(p => { const e = M.get(p.email) || { email: p.email, nom: p.nom && !p.nom.includes("@") ? p.nom : nomDepuisEmail(p.email), classes: new Set() }; e.compte = true; e.depuis = p.cree_le; M.set(p.email, e); });
  return [...M.values()].sort((a, b) => sansAccent(a.nom).localeCompare(sansAccent(b.nom)));
}
function admEleves(){
  const tous = tousLesEleves(), act = actives(), q = sansAccent(S.admQ.trim());
  const f = S.admF || "";
  const list = tous.filter(e => (!q || sansAccent(e.nom + " " + e.email).includes(q)) && (!f || (f === "aucun" ? !e.classes.size : f === "jamais" ? !e.compte : e.classes.has(f))));
  return `<div class="travhead">
      <button class="btn" data-act="ajouteleves" data-c="">${icon("plus")} Ajouter des élèves</button>
      <div class="field filt"><label for="admQ">Rechercher</label><input id="admQ" data-adq="1" value="${esc(S.admQ)}" placeholder="Nom ou adresse"></div>
      <div class="field filt"><label for="admF">Afficher</label><select id="admF" data-adf="1"><option value="">Tous les élèves (${tous.length})</option>${act.map(c => `<option value="${esc(c.id)}" ${f === c.id ? "selected" : ""}>${esc(c.nom)}</option>`).join("")}<option value="aucun" ${f === "aucun" ? "selected" : ""}>Inscrits dans aucun cours</option><option value="jamais" ${f === "jamais" ? "selected" : ""}>Jamais connectés</option></select></div>
      <span class="spacer"></span><button class="btn ghost sm" data-act="exporteleves">${icon("down")} Exporter (CSV)</button></div>
    <p class="muted" style="margin:0;font-size:.85rem">Coche une case pour inscrire un élève dans un cours, décoche-la pour le retirer. Tu peux inscrire les élèves avant leur première connexion : il suffit de leur adresse Microsoft 365.</p>
    ${list.length ? `<div class="tablewrap"><table class="admtable"><thead><tr><th class="first">Élève</th>${act.map(c => `<th class="cc" title="${esc(c.nom)}"><span class="ini" style="--bb:var(${C(c.couleur).b})">${esc((c.symbole || c.nom).slice(0, 3))}</span></th>`).join("")}<th>Compte</th><th></th></tr></thead><tbody>
      ${list.map(e => `<tr><td class="first"><span class="who2">${avatarP(e.nom, "sm")}<span style="min-width:0"><b>${esc(e.nom)}</b><small class="muted" style="display:block;overflow-wrap:anywhere">${esc(e.email)}</small></span></span></td>
        ${act.map(c => `<td class="cc"><input type="checkbox" data-act="inscr" data-e="${esc(e.email)}" data-n="${esc(e.nom)}" data-c="${esc(c.id)}" ${e.classes.has(c.id) ? "checked" : ""} aria-label="${esc(e.nom)} inscrit en ${esc(c.nom)}"></td>`).join("")}
        <td>${e.compte ? `<span class="pill ok">Connecté</span>` : `<span class="pill">Jamais connecté</span>`}</td>
        <td><div class="dd kebab"><button class="ib sm" data-act="menu" data-m="ae${esc(e.email)}" aria-label="Options">${icon("more")}</button>${S.menu === "ae" + e.email ? `<div class="dd-menu">
          <a href="#" data-act="renomeleve" data-e="${esc(e.email)}" data-n="${esc(e.nom)}">${icon("edit")} Modifier le nom</a>
          <a href="${esc(outlookLink([e.email], "", ""))}" target="_blank" rel="noopener">${icon("mail")} Envoyer un e-mail</a>
          ${e.classes.size ? `<a href="#" data-act="retirertout" data-e="${esc(e.email)}" data-n="${esc(e.nom)}" style="color:var(--bad)">${icon("trash")} Retirer de tous les cours</a>` : ""}
          <a href="#" data-act="supprcompte" data-e="${esc(e.email)}" data-n="${esc(e.nom)}" style="color:var(--bad)">${icon("trash")} Supprimer l'élève${e.compte ? " et son compte" : ""}</a></div>` : ""}</div></td></tr>`).join("")}
    </tbody></table></div>` : `<div class="emptystate"><b>${tous.length ? "Aucun élève ne correspond." : "Aucun élève pour l'instant."}</b><span>${tous.length ? "Change la recherche ou le filtre." : "Ajoute tes listes de classe avec « Ajouter des élèves », ou donne le code du cours aux élèves."}</span></div>`}`;
}

/* lecture d'une liste collée (Pronote, Excel, e-mails…) */
function analyserListe(txt, classe){
  const out = [], vus = new Set(), dom = "@" + CFG.domaine;
  const norm = x => sansAccent(x).replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  const cap = x => x.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
  String(txt || "").split(/\r?\n/).map(l => l.trim()).filter(Boolean).forEach(l => {
    const m = l.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
    let email = "", nom = "", deduit = false, err = "";
    if (m) { email = m[0].toLowerCase(); nom = l.replace(m[0], " ").replace(/[;,\t<>"()]+/g, " ").replace(/\s+/g, " ").trim() || nomDepuisEmail(email); }
    else {
      const parts = l.replace(/[;,\t]+/g, " ").replace(/\s+/g, " ").trim().split(" ");
      if (parts.length < 2) err = "Indique le nom et le prénom, ou l'adresse e-mail.";
      else {
        const maj = parts.filter(p => p === p.toUpperCase() && /\p{L}/u.test(p) && p.length > 1);
        let nomF, prenom;
        if (maj.length && maj.length < parts.length) { nomF = maj.join(" "); prenom = parts.filter(p => !maj.includes(p)).join(" "); }
        else { prenom = parts[0]; nomF = parts.slice(1).join(" "); }
        email = (CFG.prefixeEleve ?? "lv.") + norm(prenom) + "." + norm(nomF) + dom; nom = cap(prenom) + " " + nomF.toUpperCase(); deduit = true;
      }
    }
    if (email && !email.endsWith(dom)) err = "Adresse hors du lycée (" + dom + ").";
    else if (email && vus.has(email)) err = "En double dans la liste.";
    if (email) vus.add(email);
    const deja = !err && classe && (S.toutesInscriptions || []).some(x => x.classe_id === classe && x.email === email);
    out.push({ ligne: l, email, nom, deduit, err, deja });
  });
  return out;
}
function apercuListe(m){
  const L = analyserListe(m.texte, m.classe), ok = L.filter(x => !x.err && !x.deja);
  if (!L.length) return `<p class="muted" style="margin:0;font-size:.85rem">L'aperçu apparaîtra ici.</p>`;
  return `<div class="apercu"><b>${ok.length} élève${ok.length > 1 ? "s" : ""} à ajouter</b>${L.some(x => x.deduit) ? ` <span class="muted" style="font-size:.8rem">· vérifie les adresses déduites (en orange)</span>` : ""}
    <ul>${L.map(x => `<li class="${x.err ? "bad" : x.deja ? "deja" : x.deduit ? "deduit" : ""}"><span>${esc(x.nom || x.ligne)}</span><small>${x.err ? esc(x.err) : esc(x.email) + (x.deja ? " · déjà inscrit" : x.deduit ? " · adresse déduite" : "")}</small></li>`).join("")}</ul></div>`;
}

/* ----- onglet Fichiers ----- */
async function chargerFichiers(force){
  if (S.fich && !force) return S.fich;
  const [f, su, an] = await Promise.all([sb.rpc("pp_fichiers"), sb.from("supports").select("id, classe_id, titre, ressources"), sb.from("annonces").select("id, classe_id, ressources")]);
  if (f.error) return S.fich = { err: f.error.message };
  return S.fich = { fichiers: f.data || [], supports: su.data || [], annonces: an.data || [] };
}
/* fichiers privés du professeur (calendrier dynamique…) : jamais considérés comme inutilisés */
const estPrive = x => (x.bucket === "documents" && /^prof\//.test(x.chemin)) || (x.bucket === "rendus" && /\/question-/.test(x.chemin));   /* photos jointes aux questions privées (étape 39) */
function analyseFichiers(){
  const F = S.fich, refs = new Map(), heure = new Date(now() - 3600e3);
  const ajoute = (list, k, lib) => (list || []).forEach(o => (o.ressources || []).forEach(x => x.path && refs.set(x.path, { k, o, lib: lib(o) })));
  ajoute(S.devoirs, "devoir", o => "Devoir · " + o.titre); ajoute(F.supports, "support", o => "Documentation · " + o.titre); ajoute(F.annonces, "annonce", o => "Annonce du flux");
  const rendusRefs = new Set(S.rendus.flatMap(r => (r.fichiers || []).map(x => x.chemin)).filter(Boolean));
  const parClasse = {}, orphelins = [];
  const devoirClasse = id => (S.devoirs.find(d => String(d.id) === id) || {}).classe_id;
  F.fichiers.forEach(x => {
    const seg = x.chemin.split("/")[0], cid = x.bucket === "documents" ? seg : devoirClasse(seg) || "?";
    const P = parClasse[cid] = parClasse[cid] || { docs: 0, docsT: 0, rendus: 0, rendusT: 0 };
    if (x.bucket === "documents") { P.docs++; P.docsT += x.taille; } else { P.rendus++; P.rendusT += x.taille; }
    const utilise = x.bucket === "documents" ? refs.has(x.chemin) : rendusRefs.has(x.chemin);
    if (!utilise && !estPrive(x) && D(x.cree_le) < heure) orphelins.push(x);
  });
  return { refs, parClasse, orphelins, total: F.fichiers.reduce((a, x) => a + x.taille, 0) };
}
function admFichiers(){
  const F = S.fich;
  if (!F) return `<div class="loading"><div><div class="spin"></div>Chargement des fichiers…</div></div>`;
  if (F.err) return `<div class="notice" style="background:var(--bad-bg);color:var(--bad)">Liste des fichiers indisponible : ${esc(F.err)}</div>`;
  const A = analyseFichiers(), quota = 1e9, pc = Math.min(100, Math.round(A.total / quota * 100));
  const nomC = id => (cls(id) || {}).nom || (id === "?" ? "Devoirs supprimés" : id === "prof" ? "Fichiers privés du professeur (calendrier…)" : id);
  const gros = F.fichiers.filter(x => x.bucket === "documents").sort((a, b) => b.taille - a.taille).slice(0, 12);
  return `<div class="travhead"><span class="spacer"></span><button class="btn ghost sm" data-act="admfichiers">${icon("restore")} Actualiser</button></div>
    <section class="edcard"><h2>${icon("nuage")} Espace utilisé</h2>
      <div class="jauge"><i style="width:${pc}%"></i></div>
      <p style="margin:0"><b>${taille(A.total)}</b> sur 1 Go (offre gratuite Supabase) · ${F.fichiers.length} fichier${F.fichiers.length > 1 ? "s" : ""}</p>
      <p class="muted" style="margin:0;font-size:.85rem">Les liens OneDrive ne comptent pas : seuls les fichiers importés dans PhysiquePro et les travaux rendus par les élèves occupent cet espace.</p></section>
    <section class="edcard"><h2>${icon("folder")} Par cours</h2>
      <div class="tablewrap"><table class="admtable"><thead><tr><th class="first">Cours</th><th>Documents du prof</th><th>Travaux des élèves</th><th>Total</th></tr></thead><tbody>
      ${Object.entries(A.parClasse).sort((a, b) => (b[1].docsT + b[1].rendusT) - (a[1].docsT + a[1].rendusT)).map(([id, P]) => `<tr><td class="first">${esc(nomC(id))}</td><td>${P.docs} · ${taille(P.docsT)}</td><td>${P.rendus} · ${taille(P.rendusT)}</td><td><b>${taille(P.docsT + P.rendusT)}</b></td></tr>`).join("") || `<tr><td colspan="4" class="muted">Aucun fichier.</td></tr>`}
      </tbody></table></div></section>
    <section class="edcard"><h2>${icon("trash")} Fichiers inutilisés</h2>
      ${A.orphelins.length ? `<p style="margin:0">${A.orphelins.length} fichier${A.orphelins.length > 1 ? "s" : ""} ne ${A.orphelins.length > 1 ? "sont" : "est"} plus utilisé${A.orphelins.length > 1 ? "s" : ""} par aucun devoir, documentation, annonce ou travail rendu (${taille(A.orphelins.reduce((a, x) => a + x.taille, 0))}).</p>
        <ul class="files">${A.orphelins.slice(0, 15).map(x => `<li><a href="#" data-act="openfile" data-bucket="${esc(x.bucket)}" data-path="${esc(x.chemin)}">${icon("file")} ${esc(x.chemin.split("/").pop().replace(/^\d+-/, ""))}</a><span class="mono muted">${taille(x.taille)}</span></li>`).join("")}</ul>
        <div><button class="btn danger sm" data-act="purge">${icon("trash")} Supprimer les fichiers inutilisés</button></div>`
      : `<p class="muted" style="margin:0">Aucun fichier inutilisé : tout est propre.</p>`}</section>
    <section class="edcard"><h2>${icon("file")} Plus gros documents</h2>
      ${gros.length ? `<ul class="files">${gros.map(x => { const ref = A.refs.get(x.chemin); return `<li><a href="#" data-act="openfile" data-bucket="documents" data-path="${esc(x.chemin)}">${icon("file")} ${esc(x.chemin.split("/").pop().replace(/^\d+-/, ""))}</a><span class="muted" style="font-size:.8rem">${esc(nomC(x.chemin.split("/")[0]))}${ref ? " · " + esc(ref.lib) : " · inutilisé"} · <span class="mono">${taille(x.taille)}</span></span></li>`; }).join("")}</ul>` : `<p class="muted" style="margin:0">Aucun document importé.</p>`}
      <p class="muted" style="margin:0;font-size:.82rem">Astuce : pour les vidéos et les gros fichiers, utilise plutôt un lien OneDrive.</p></section>`;
}
async function purgerFichiers(){
  const A = analyseFichiers(), par = {};
  A.orphelins.filter(x => !estPrive(x)).forEach(x => (par[x.bucket] = par[x.bucket] || []).push(x.chemin));
  for (const b of Object.keys(par)) for (let i = 0; i < par[b].length; i += 100) { const { error } = await sb.storage.from(b).remove(par[b].slice(i, i + 100)); if (error) throw error; }
  return A.orphelins.length;
}

/* ----- onglet Sauvegarde ----- */
function admSauvegarde(){
  return `<section class="edcard"><h2>${icon("down")} Sauvegarde complète</h2>
      <p style="margin:0">Télécharge toutes les données du site dans un fichier : cours, thèmes, devoirs, questionnaires, documentations, annonces, listes d'élèves, rendus, notes et réglages.</p>
      <p class="muted" style="margin:0;font-size:.85rem">Les fichiers eux-mêmes (PDF, photos…) ne sont pas dans la sauvegarde : ils restent dans Supabase et dans ton OneDrive. Fais une sauvegarde au moins une fois par trimestre.</p>
      <div><button class="btn" data-act="backup" ${S.backupBusy ? "disabled" : ""}>${S.backupBusy ? "Préparation…" : "Télécharger la sauvegarde"}</button></div></section>
    <section class="edcard"><h2>${icon("grade")} Notes vers Excel ou Pronote</h2>
      <p class="muted" style="margin:0;font-size:.85rem">Un fichier CSV par cours, qui s'ouvre dans Excel : une ligne par élève, une colonne par devoir ou questionnaire noté, et la moyenne sur 20.</p>
      <div class="adbtns" style="flex-wrap:wrap;gap:8px">${actives().map(c => `<button class="btn ghost sm" data-act="exportnotes" data-c="${esc(c.id)}">${esc(c.nom)}</button>`).join("")}</div></section>
    <section class="edcard"><h2>${icon("people")} Listes d'élèves</h2>
      <div><button class="btn ghost sm" data-act="exporteleves">${icon("down")} Exporter tous les élèves (CSV)</button></div></section>
    <section class="edcard"><h2>${icon("gear")} Raccourcis techniques</h2>
      <p class="muted" style="margin:0;font-size:.85rem">Tu n'en as normalement plus besoin : tout se règle depuis cette page. Ils restent utiles en cas de souci.</p>
      <div class="classlinks">
        <a href="https://supabase.com/dashboard/project/${esc((CFG.supabaseUrl.match(/https:\/\/([^.]+)/) || [])[1] || "")}" target="_blank" rel="noopener">${icon("links")}<span>Supabase · base de données et fichiers</span></a>
        <a href="https://github.com/jalalsouhaidlv/physiquepro" target="_blank" rel="noopener">${icon("links")}<span>GitHub · fichiers du site</span></a>
        <a href="https://entra.microsoft.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Credentials/appId/f52213ef-d098-49cc-ac22-944c23bcab61" target="_blank" rel="noopener">${icon("links")}<span>Microsoft Entra · connexion Microsoft 365 (secret valable jusqu'au 16/10/2028)</span></a>
      </div></section>`;
}
async function sauvegarder(){
  const tables = ["reglages", "classes", "themes", "supports", "devoirs", "quiz", "quiz_solutions", "inscriptions", "annonces", "commentaires", "commentaires_prives", "rendus", "corrections", "resultats_quiz", "profiles"];
  const out = { site: "PhysiquePro", exporte_le: now().toISOString(), tables: {} };
  const res = await Promise.all(tables.map(t => sb.from(t).select("*")));
  res.forEach((r, i) => { out.tables[tables[i]] = r.error ? { erreur: r.error.message } : r.data; });
  telecharger("physiquepro-sauvegarde-" + ymd(now()) + ".json", JSON.stringify(out, null, 1), "application/json");
}
async function exporterNotes(cid){
  const c = cls(cid), data = await chargerClasse(cid), el = data.eleves;
  const cols = [...S.devoirs.filter(d => d.classe_id === cid && d.points != null && !d.brouillon).map(d => ({ k: "d", o: d })), ...S.quiz.filter(q => q.classe_id === cid && q.mode === "note" && !q.brouillon).map(q => ({ k: "q", o: q }))]
    .sort((a, b) => D(a.o.publie_le) - D(b.o.publie_le));
  const uidDe = email => Object.keys(S.profils).find(id => S.profils[id] === email);
  const val = (col, e) => { if (col.k === "q") { const uid = uidDe(e.email), r = uid && resultatDe(col.o, uid); return r ? noteQuiz(col.o, r) : null; }
    if (col.o.eleves && !col.o.eleves.includes(e.email)) return null; const cr = correctionDe(renduDe(col.o, e.email)); return cr && cr.note != null ? Number(cr.note) : null; };
  const rows = [["Élève", "Adresse", ...cols.map(col => col.o.titre + " (/" + col.o.points + (col.o.categorie ? " · " + col.o.categorie : "") + ")"), (c.categories || []).length ? "Moyenne pondérée /20" : "Moyenne /20"]];
  el.forEach(e => { const v = cols.map(col => val(col, e)), m = moyenneDe(c, e.email, uidDe(e.email), false).moy;
    rows.push([e.nom, e.email, ...v.map(x => x == null ? "" : fmtNote(x)), m == null ? "" : fmtNote(Math.round(m * 100) / 100)]); });
  telecharger("notes-" + sansAccent(c.nom).replace(/[^a-z0-9]+/g, "-") + "-" + ymd(now()) + ".csv", csv(rows), "text/csv;charset=utf-8");
  toast("Notes exportées : " + c.nom);
}
function exporterEleves(){
  const act = S.classes;
  const rows = [["Nom", "Adresse", "Cours", "Compte"]];
  tousLesEleves().forEach(e => rows.push([e.nom, e.email, [...e.classes].map(id => (act.find(c => c.id === id) || {}).nom || id).join(", "), e.compte ? "connecté" : "jamais connecté"]));
  telecharger("eleves-physiquepro-" + ymd(now()) + ".csv", csv(rows), "text/csv;charset=utf-8");
}

const confirmerPerte = () => { S.modal = { kind: "confirm", action: "perte", titre: "Quitter sans enregistrer ?", texte: "Tes modifications de la boîte à outils seront perdues.", ok: "Quitter" }; render(); return false; };

/* Lot C de l'évaluation (11/11/2026) : sommaire en haut des longues pages de Paramètres (4 rubriques ou plus) */
function sommaireParametres(){
  const pg = document.querySelector("main.content > .page"); if (!pg || pg.querySelector(".sommaire")) return;
  const S2 = [...pg.querySelectorAll("section.edcard > h2")]; if (S2.length < 4) return;
  S2.forEach((h, i) => { h.parentElement.id = "rub" + i; h.parentElement.style.scrollMarginTop = "90px"; });
  const nav = document.createElement("nav"); nav.className = "sommaire"; nav.setAttribute("aria-label", "Sommaire de la page");
  nav.innerHTML = "<b>Aller à :</b>" + S2.map((h, i) => `<button type="button" class="chip" data-somm="${i}">${esc(h.textContent.trim())}</button>`).join("");
  const ancre = pg.querySelector(".savebar") || S2[0].parentElement; ancre.after(nav);
}
document.addEventListener("click", e => { const b = e.target.closest && e.target.closest("[data-somm]"); if (!b) return; e.preventDefault(); document.getElementById("rub" + b.dataset.somm)?.scrollIntoView({ behavior: "smooth", block: "start" }); });
