/* ---------- fenêtres ---------- */
function vModal(){
  const m = S.modal; let body = "", ok = "Enregistrer", foot = true;
  if (m.kind === "theme") { body = `<h2>${m.id ? "Renommer le thème" : "Ajouter un thème"}</h2><div class="field"><label for="mTitre">Nom du thème</label><input id="mTitre" value="${esc(m.titre || "")}" placeholder="ex. Chapitre 1 · Mouvements"></div>`; ok = m.id ? "Renommer" : "Ajouter"; }
  else if (m.kind === "copieauth") { body = `<h2>Ouvrir ta copie modifiable</h2><p style="margin:0">Pour modifier ce document en ligne, PhysiquePro en crée <b>une copie dans ton OneDrive</b> (dossier « PhysiquePro »). Le document de ton professeur n'est pas modifié.</p><p class="muted" style="margin:0;font-size:.85rem">La première fois seulement, Microsoft te demande d'autoriser PhysiquePro à accéder à ton OneDrive.</p>`; ok = "Autoriser et ouvrir"; }
  else if (m.kind === "placercours") { const l = actives(), i = l.findIndex(c => c.id === m.id), autres = l.filter(c => c.id !== m.id);
    body = `<h2>Déplacer « ${esc(m.nom)} »</h2><div class="field"><label for="mPos">Nouvelle place du cours</label><select id="mPos" style="width:100%;max-width:100%">
      <option value="0" ${i === 0 ? "selected" : ""}>En premier</option>${autres.map((c, k) => `<option value="${k + 1}" ${i === k + 1 ? "selected" : ""}>Après « ${esc(c.nom)} »</option>`).join("")}</select></div>
      <p class="muted" style="margin:0;font-size:.85rem">${S.prof ? "Les élèves voient les cours dans cet ordre." : "Cet ordre ne concerne que ton accueil."} Tu peux aussi glisser-déposer les cartes sur l'accueil.</p>`; ok = "Déplacer"; }
  else if (m.kind === "placertheme") { const th = ((S.cache[m.classe] || {}).themes || []).filter(t => String(t.id) !== String(m.id));
    body = `<h2>Déplacer « ${esc(m.titre)} »</h2><div class="field"><label for="mOu">Placer ce thème</label><select id="mOu" style="width:100%"><option value="avant">Avant le thème…</option><option value="apres">Après le thème…</option></select></div>
      <div class="field"><label for="mRef">Thème</label><select id="mRef" style="width:100%;max-width:100%;text-overflow:ellipsis">${th.map(t => `<option value="${t.id}">${esc(t.titre.length > 70 ? t.titre.slice(0, 68) + "…" : t.titre)}</option>`).join("")}</select></div>`; ok = "Déplacer"; }
  else if (m.kind === "prog") { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(8, 0, 0, 0);
    body = `<h2>Programmer la publication</h2><p class="muted" style="margin:0">Les élèves verront cet élément à partir de cette date.</p><div class="dt2"><input id="mDate" type="date" value="${ymd(d)}" aria-label="Date"><input id="mHeure" type="time" value="08:00" aria-label="Heure"></div>`; ok = "Programmer"; }
  else if (m.kind === "join") { body = `<h2>Rejoindre un cours</h2><p class="muted" style="margin:0">Tu es connecté avec <b>${esc(moi())}</b>. Saisis le code du cours donné par ton professeur.</p><div class="field"><label for="mCode">Code du cours</label><input id="mCode" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="ex. k7m4pqr" value="${esc(m.code || "")}" style="font-family:var(--mono);font-size:1.2rem;letter-spacing:.08em"></div>`; ok = "Rejoindre"; }
  else if (m.kind === "ajouteleves") { const c = cls(m.classe);
    body = `<h2>Ajouter des élèves${c ? " · " + esc(c.nom) : ""}</h2>
      ${m.fixe ? "" : `<div class="field"><label for="mClasse">Dans le cours</label><select id="mClasse" data-mclasse="1">${actives().map(x => `<option value="${esc(x.id)}" ${x.id === m.classe ? "selected" : ""}>${esc(x.nom)}</option>`).join("")}</select></div>`}
      <div class="field"><label for="mListe">Colle la liste (une ligne par élève)</label><textarea id="mListe" rows="7" placeholder="${esc(CFG.prefixeEleve ?? "lv.")}prenom.nom@${esc(CFG.domaine)}&#10;HADDAD Lina&#10;Karim Saad ; ${esc(CFG.prefixeEleve ?? "lv.")}karim.saad@${esc(CFG.domaine)}">${esc(m.texte || "")}</textarea></div>
      <p class="muted" style="margin:0;font-size:.8rem">Accepté : une adresse, « NOM Prénom » copié depuis Pronote ou Excel (l'adresse ${esc(CFG.prefixeEleve ?? "lv.")}prenom.nom@${esc(CFG.domaine)} est alors déduite), ou les deux sur la même ligne.</p>
      <div id="mApercu">${apercuListe(m)}</div>`; ok = "Ajouter"; }
  else if (m.kind === "renomeleve") { body = `<h2>Modifier le nom</h2><p class="muted" style="margin:0;font-size:.85rem">${esc(m.email)}</p><div class="field"><label for="mNomEl">Nom affiché (dans tous les cours)</label><input id="mNomEl" value="${esc(m.nom)}"></div>`; }
  else if (m.kind === "autrescours") { body = `<h2>Ajouter à un autre cours</h2><p class="muted" style="margin:0">${m.emails.length} élève${m.emails.length > 1 ? "s" : ""} sélectionné${m.emails.length > 1 ? "s" : ""}.</p>
      <div class="ciblelist">${actives().filter(c => c.id !== m.from).map(c => `<label class="check"><input type="checkbox" class="mDest" value="${esc(c.id)}"> ${esc(c.nom)}</label>`).join("") || `<span class="muted">Aucun autre cours actif.</span>`}</div>`; ok = "Ajouter"; }
  else if (m.kind === "copiercours") { body = `<h2>Copier « ${esc(m.nom)} »</h2>
      <div class="field"><label for="mNomCopie">Nom du nouveau cours</label><input id="mNomCopie" value="${esc(/(\d{2})-(\d{2})/.test(m.nom) ? m.nom.replace(/(\d{2})-(\d{2})/, (x, a, b) => String(+a + 1).padStart(2, "0") + "-" + String(+b + 1).padStart(2, "0")) : "Copie de " + m.nom)}"></div>
      <p class="muted" style="margin:0;font-size:.85rem">Comme dans Classroom : les thèmes, devoirs, questions, questionnaires et documentations sont copiés en <b>brouillon</b>. Idéal pour préparer l'année suivante : l'année du nom (ex. 26-27) est avancée d'un an. Les élèves, les annonces, les travaux rendus et les notes ne sont pas copiés.</p>`; ok = "Copier"; }
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
  else if (m.kind === "supprclasse") { body = `<h2>Supprimer « ${esc(m.nom)} » ?</h2><p style="margin:0">Le cours, ses devoirs, questionnaires, documentations, annonces, les travaux rendus et les notes seront <b>définitivement supprimés</b>.${odActif() ? " Son dossier OneDrive et tout son contenu partent dans la corbeille de ton OneDrive (récupérables pendant 93 jours)." : ""}</p><div class="field"><label for="mConfirm">Pour confirmer, tape le nom du cours</label><input id="mConfirm" autocomplete="off" placeholder="${esc(m.nom)}"></div>`; ok = "Supprimer"; }
  else if (m.kind === "demande") { body = modalDemande(m) + `<label class="check"><input type="checkbox" id="dmEnvoi" ${m.x.statut && m.x.statut !== "brouillon" ? "" : "checked"}> Ouvrir Outlook pour l'envoyer au préparateur</label>`; ok = "Enregistrer"; }
  else if (m.kind === "prep") { body = `<h2>${icon("flask")} Adresse du préparateur</h2><p class="muted" style="margin:0">Les demandes de matériel lui seront adressées par Outlook.</p><div class="field"><label for="dmPrep">Adresse e-mail</label><input id="dmPrep" type="email" value="${esc(emailPrep())}" placeholder="prenom.nom@${esc(CFG.domaine)}"></div>`; }
  else if (m.kind === "rdv") { body = modalRdv(); ok = "Créer les créneaux"; }
  else if (m.kind === "urgchoix") { body = `<h2>${icon("urgent")} Message urgent à ${esc(nomProfCourt())}</h2><p class="muted" style="margin:0">Pour quel cours ?</p><div class="urgchoix">${actives().map(c => `<button class="btn tonal" data-act="urgent" data-c="${esc(c.id)}" style="--c:var(${C(c.couleur).c})">${esc(c.nom)}${supUrg(reponsesNonVues(c.id))}</button>`).join("")}</div><div style="display:flex;justify-content:flex-end"><button class="btn ghost" data-act="mclose">Annuler</button></div>`; foot = false; }
  else if (m.kind === "urgent") { body = modalUrgent(m); ok = "Envoyer"; }
  else if (m.kind === "urgprof") { body = modalUrgProf(m); ok = "Envoyer"; }
  else if (m.kind === "confirm") { body = `<h2>${esc(m.titre)}</h2><p style="margin:0">${esc(m.texte)}</p>`; ok = m.ok || "Supprimer"; }
  const danger = (m.kind === "confirm" && m.action !== "rien") || m.kind === "supprclasse";
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
async function reutiliser(k, id, versClasse, themeId = null, extra = {}){
  if (k === "devoir") { const d = S.devoirs.find(x => String(x.id) === String(id)); const { id: _i, publie_le, theme_id, eleves, ...rest } = d;
    return sb.from("devoirs").insert({ ...rest, classe_id: versClasse, theme_id: themeId, eleves: null, brouillon: true, ressources: await copierRessources(d.ressources, versClasse), ...extra }); }
  if (k === "support") { let s = null; for (const c of S.classes) { const data = S.cache[c.id]; if (data) { s = data.supports.find(x => String(x.id) === String(id)); if (s) break; } }
    const { id: _i, publie_le, theme_id, eleves, ...rest } = s;
    return sb.from("supports").insert({ ...rest, classe_id: versClasse, theme_id: themeId, eleves: null, brouillon: true, ressources: await copierRessources(s.ressources, versClasse), ...extra }); }
  const q = S.quiz.find(x => String(x.id) === String(id)); const { id: _i, publie_le, theme_id, eleves, ...rest } = q;
  const qs2 = [];
  for (const x of rest.questions || []) { if (x.img && versClasse !== q.classe_id) { const [cp] = await copierRessources([{ path: x.img }], versClasse); qs2.push({ ...x, img: cp.path }); } else qs2.push(x); }
  const ins = await sb.from("quiz").insert({ ...rest, questions: qs2, classe_id: versClasse, theme_id: themeId, eleves: null, brouillon: true, ...extra }).select("id").single();
  if (ins.error) return ins;
  const sol = await sb.from("quiz_solutions").select("bonnes").eq("quiz_id", q.id).maybeSingle();
  return sb.from("quiz_solutions").insert({ quiz_id: ins.data.id, bonnes: (sol.data && sol.data.bonnes) || [] });
}

const idDeCours = nom => (nom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "cours") + "-" + Math.random().toString(36).slice(2, 6);
async function copierCours(src, nom){
  const c = cls(src), data = await chargerClasse(src, true), id = idDeCours(nom);
  const { code, archive, ...rest } = c;
  const { error } = await sb.from("classes").insert({ ...rest, id, nom, archive: false, teams_url: null, dossier_onedrive: null, ordre: S.classes.reduce((a, x) => Math.max(a, x.ordre || 0), 0) + 1 });
  if (error) throw error;
  const map = {};
  for (const t of data.themes) { const r = await sb.from("themes").insert({ classe_id: id, titre: t.titre, ordre: t.ordre }).select("id").single(); if (r.error) throw r.error; map[t.id] = r.data.id; }
  const th = x => x.theme_id != null && map[x.theme_id] ? map[x.theme_id] : null;
  for (const d of S.devoirs.filter(x => x.classe_id === src)) { const r = await reutiliser("devoir", d.id, id, th(d)); if (r.error) throw r.error; }
  for (const s2 of data.supports) { const r = await reutiliser("support", s2.id, id, th(s2)); if (r.error) throw r.error; }
  for (const q of S.quiz.filter(x => x.classe_id === src)) { const r = await reutiliser("quiz", q.id, id, th(q)); if (r.error) throw r.error; }
  return id;
}
async function modalOk(){
  const m = S.modal, val = id => (document.getElementById(id) || {}).value || "";
  const done = async (msg, classe) => { S.modal = null; await rafraichir(classe); toast(msg); render(); };
  const stop = msg => { m.err = msg; m.busy = false; render(); };
  m.busy = true;
  try {
    if (m.kind === "demande") { const env = (document.getElementById("dmEnvoi") || {}).checked; await enregistrerDemande(m, env); S.modal = null; if (route().v !== "preparateur") go("/preparateur"); render(); if (!env) toast("Demande enregistrée"); return; }
    if (m.kind === "prep") { const v2 = val("dmPrep").trim(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v2)) return stop("Adresse e-mail invalide."); await sauverPrep(v2); const suite = m.ensuite; S.modal = null; render(); toast("Adresse du préparateur enregistrée"); if (suite) { const x = (S.demandes || []).find(y => y.id === suite); if (x) envoyerDemande(x); } return; }
    if (m.kind === "rdv") { const n = await creerRdv(); S.modal = null; S.rdvFrais = true; if (route().v !== "rendezvous") go("/rendezvous"); render(); toast(n + " créneau(x) créé(s)"); return; }
    if (m.kind === "urgprof") { const nom = await envoyerUrgProf(); S.modal = null; render(); toast("Message d'urgence envoyé à " + nom); return; }
    if (m.kind === "urgent") { await envoyerUrgent(m); S.modal = null; render(); toast("Message envoyé à " + nomProfCourt()); return; }
    if (m.kind === "copieauth") { m.busy = false; return copieAutoriser(); }
    if (m.kind === "placercours") { const pos = Number(val("mPos")); S.modal = null; render(); return deplacerA(m.id, pos); }
    if (m.kind === "placertheme") {
      const th = S.cache[m.classe].themes.filter(t => String(t.id) !== String(m.id)), k = th.findIndex(t => String(t.id) === val("mRef"));
      S.modal = null; return placerTheme(m.classe, m.id, k < 0 ? 0 : k + (val("mOu") === "apres" ? 1 : 0));
    }
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
    if (m.kind === "ajouteleves") {
      const cid = m.classe; if (!cls(cid)) return stop("Choisis un cours.");
      const L = analyserListe(m.texte, cid), ok = L.filter(x => !x.err && !x.deja);
      if (!ok.length) return stop(L.length ? "Aucun nouvel élève à ajouter (erreurs ou déjà inscrits)." : "Colle au moins une ligne.");
      const { error } = await sb.from("inscriptions").upsert(ok.map(x => ({ classe_id: cid, email: x.email, nom: x.nom })), { onConflict: "classe_id,email", ignoreDuplicates: true });
      if (error) throw error;
      return done(ok.length + " élève" + (ok.length > 1 ? "s ajoutés" : " ajouté") + " à " + cls(cid).nom, cid);
    }
    if (m.kind === "renomeleve") {
      const n = val("mNomEl").trim(); if (!n) return stop("Le nom ne peut pas être vide.");
      const { error } = await sb.from("inscriptions").update({ nom: n }).eq("email", m.email); if (error) throw error;
      return done("Nom modifié");
    }
    if (m.kind === "autrescours") {
      const dest = [...document.querySelectorAll(".mDest:checked")].map(x => x.value); if (!dest.length) return stop("Coche au moins un cours.");
      const noms = {}; inscritsDe(m.from).forEach(x => noms[x.email] = x.nom);
      const rows = dest.flatMap(cid => m.emails.map(email => ({ classe_id: cid, email, nom: noms[email] || nomDepuisEmail(email) })));
      const { error } = await sb.from("inscriptions").upsert(rows, { onConflict: "classe_id,email", ignoreDuplicates: true }); if (error) throw error;
      return done("Ajouté à " + dest.length + " cours");
    }
    if (m.kind === "copiercours") {
      const nom = val("mNomCopie").trim(); if (!nom) return stop("Donne un nom au nouveau cours.");
      const id = await copierCours(m.id, nom);
      S.modal = null; await rafraichir(); toast("Cours copié : les travaux sont en brouillon"); go("/classe/" + id + "/travaux"); return;
    }
    if (m.kind === "newclass") {
      const nom = val("mNom").trim(); if (!nom) return stop("Donne un nom au cours.");
      const id = idDeCours(nom), ordre = S.classes.reduce((a, x) => Math.max(a, x.ordre || 0), 0) + 1;
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
      const rendusFichiers = S.rendus.filter(r => (S.devoirs.find(d => d.id === r.devoir_id) || {}).classe_id === m.id).flatMap(r => (r.fichiers || []).map(f => f.chemin)).filter(Boolean);
      if (rendusFichiers.length) await sb.storage.from("rendus").remove(rendusFichiers);
      const nomCours = (cls(m.id) || {}).nom || m.nom;
      const { error } = await sb.from("classes").delete().eq("id", m.id); if (error) throw error;
      if (odActif()) supprimerDossierCours(nomCours).then(ok => { if (ok) toast("Dossier OneDrive « " + nomCours + " » mis à la corbeille"); }).catch(e => toast("Dossier OneDrive non supprimé : " + (e.message || e)));
      S.modal = null; await rafraichir(); toast("Cours supprimé"); go("/archives"); return;
    }
    if (m.kind === "confirm") {
      if (m.action === "suppr") {
        const table = m.k === "devoir" ? "devoirs" : m.k === "support" ? "supports" : "quiz";
        const rec = m.k === "devoir" ? S.devoirs.find(d => String(d.id) === m.id) : m.k === "support" ? ((S.cache[m.classe] || {supports:[]}).supports.find(x => String(x.id) === m.id)) : null;
        const { error } = await sb.from(table).delete().eq("id", m.id); if (error) throw error;
        const paths = ((rec && rec.ressources) || []).filter(x => x.path).map(x => x.path); if (paths.length) await sb.storage.from("documents").remove(paths);
        if (m.k === "devoir") { const f = S.rendus.filter(r => String(r.devoir_id) === m.id).flatMap(r => (r.fichiers || []).map(x => x.chemin)).filter(Boolean); if (f.length) await sb.storage.from("rendus").remove(f); }
        return done("Élément supprimé", m.classe);
      }
      if (m.action === "supprtheme") { const { error } = await sb.from("themes").delete().eq("id", m.id); if (error) throw error; return done("Thème supprimé", m.classe); }
      if (m.action === "retirer") { const { error } = await sb.from("inscriptions").delete().eq("classe_id", m.classe).in("email", m.emails); if (error) throw error; m.emails.forEach(x => S.pick.delete(x)); return done(m.emails.length > 1 ? "Élèves retirés du cours" : "Élève retiré du cours", m.classe); }
      if (m.action === "rien") { S.modal = null; render(); return; }
      if (m.action === "perte") { S.modal = null; S.outilsEdit = false; S.adm = null; render(); return; }
      if (m.action === "odorphelins") { let n = 0; for (const id of m.ids) { try { await graph("/me/drive/items/" + encodeURIComponent(id), { method: "DELETE" }, false); n++; } catch (e) { console.warn(e); } }
        S.modal = null; render(); toast(n + " dossier" + (n > 1 ? "s" : "") + " mis à la corbeille OneDrive"); return; }
      if (m.action === "dmsuppr") { const { error } = await sb.from("demandes_materiel").delete().eq("id", m.id); if (error) throw error; await chargerDemandes(); S.modal = null; render(); toast("Demande supprimée"); return; }
      if (m.action === "rdvsuppr") { const { error } = await sb.from("rdv_series").delete().eq("id", m.id); if (error) throw error; await chargerRdv(); S.modal = null; S.rdvFrais = true; render(); toast("Rendez-vous supprimés"); return; }
      if (m.action === "quitter") { const { error } = await sb.rpc("pp_quitter_cours", { p_classe: m.classe }); if (error) throw error;
        const nom = (cls(m.classe) || {}).nom || "le cours"; S.modal = null; delete S.cache[m.classe]; await rafraichir(); go("/"); render(); toast("Tu as quitté " + nom); return; }
      if (m.action === "supprcompte") { const { error } = await sb.rpc("pp_supprimer_compte", { p_email: m.email }); if (error) throw error;
        S.comptes = (S.comptes || []).filter(p => p.email !== m.email); S.toutesInscriptions = (S.toutesInscriptions || []).filter(x => x.email !== m.email);
        return done(m.nom + " a été supprimé"); }
      if (m.action === "retirertout") { const { error } = await sb.from("inscriptions").delete().eq("email", m.email); if (error) throw error; return done(m.nom + " a été retiré de tous les cours"); }
      if (m.action === "purge") { const n = await purgerFichiers(); S.fich = null; S.modal = null; await chargerFichiers(true); toast(n + " fichier" + (n > 1 ? "s supprimés" : " supprimé")); render(); return; }
      if (m.action === "supprannonce") { const { error } = await sb.from("annonces").delete().eq("id", m.id); if (error) throw error; return done("Annonce supprimée", m.classe); }
    }
  } catch (err) { stop("Action impossible : " + (err.message || err)); }
}
