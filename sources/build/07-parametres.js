/* ---------- paramètres du cours ---------- */
function initParametres(c){
  if (S.settings && S.settings.id === c.id) return;
  S.settings = { id:c.id, nom:c.nom || "", description:c.description || "", section:c.section || "", niveau:c.niveau || "", matiere:c.matiere || "", salle:c.salle || "",
    symbole:c.symbole || "", couleur:c.couleur || "pc", illustration:c.illustration || "auto", code_actif:c.code_actif !== false, flux_mode:c.flux_mode || "prof", flux_devoirs:c.flux_devoirs !== false,
    teams_url:c.teams_url || "", teams_visible:c.teams_visible !== false, dossier_onedrive:c.dossier_onedrive || "", moyenne_visible:!!c.moyenne_visible, categories:clone(c.categories || []), busy:false, err:"" };
}
function vParametres(c){
  initParametres(c);
  const s = S.settings, k = C(s.couleur);
  const f = (key, label, ph = "", type = "text") => `<div class="field"><label for="s_${key}">${label}</label><input id="s_${key}" type="${type}" data-s="${key}" value="${esc(s[key])}" placeholder="${esc(ph)}"></div>`;
  const sw = (key, label, aide = "") => `<label class="switch"><span><b>${label}</b>${aide ? `<small class="muted">${aide}</small>` : ""}</span><input type="checkbox" data-s="${key}" ${s[key] ? "checked" : ""}><i aria-hidden="true"></i></label>`;
  return `<header class="edtop" style="--c:var(${k.c})"><a class="ib" href="#/classe/${esc(c.id)}" aria-label="Fermer">${icon("x")}</a><h1>Paramètres du cours</h1><span class="spacer"></span>
      <button class="btn" data-act="savesettings" ${s.busy ? "disabled" : ""}>${s.busy ? "Enregistrement…" : "Enregistrer"}</button></header>
    <div class="settings" role="main">
      ${s.err ? `<div class="notice" style="background:var(--bad-bg);color:var(--bad)">${esc(s.err)}</div>` : ""}
      <section class="edcard"><h2>Informations sur la classe</h2>
        ${f("nom", "Nom du cours *")}
        <div class="field"><label for="s_description">Description du cours</label><textarea id="s_description" data-s="description" rows="3">${esc(s.description)}</textarea></div>
        ${f("section", "Section", "ex. Spécialité physique-chimie")}
        <div class="two">${f("niveau", "Niveau(x)", "ex. Terminale")}${f("matiere", "Matière", "ex. Physique-Chimie")}</div>
        ${f("salle", "Salle", "ex. Labo 2")}
        <div class="two">${f("symbole", "Symbole sur le bandeau", "ex. Tle")}
          <div class="field"><label for="s_couleur">Couleur du bandeau</label><select id="s_couleur" data-s="couleur">${[["pc","Bleu"],["snt","Vert"],["si","Rouge"],["tech","Ocre"],["pix","Bleu pétrole"]].map(([v, l]) => `<option value="${v}" ${s.couleur === v ? "selected" : ""}>${l}</option>`).join("")}</select></div></div>
        <div class="field"><label for="s_illustration">Illustration du bandeau</label><select id="s_illustration" data-s="illustration">${ART_NOMS.map(([v, l]) => `<option value="${v}" ${s.illustration === v ? "selected" : ""}>${l}</option>`).join("")}</select></div>
        <div class="banner bigbanner preview" style="--bb:var(${k.b})">${bannerArt(s)}<p class="bnom">${esc(s.nom || "Nom du cours")}</p><span>${esc(s.section)}</span></div>
      </section>
      <section class="edcard"><h2>Général</h2>
        <h3>Codes d'invitation</h3>
        <div class="setrow"><span><b>Gérer les codes d'invitation</b><small class="muted">Les élèves rejoignent le cours avec ce code (bouton + en haut de PhysiquePro).</small></span><select data-s="code_actif" aria-label="Codes d'invitation"><option value="1" ${s.code_actif ? "selected" : ""}>Activé</option><option value="0" ${s.code_actif ? "" : "selected"}>Désactivé</option></select></div>
        <div class="setrow"><span><b>Lien d'invitation</b><small class="muted">Envoie-le aux élèves (Teams, e-mail, Pronote) : un clic, ils se connectent et rejoignent le cours.</small></span><button class="btn ghost sm" data-act="copylien" data-code="${esc(c.code || "")}">${icon("links")} Copier le lien</button></div>
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
        <h3>Catégories de notes et coefficients</h3>
        <p class="muted" style="margin:0;font-size:.85rem">Ex. TP coef 1, Contrôle coef 2, DM coef 0,5. La moyenne devient pondérée : moyenne de chaque catégorie × son coefficient. Sans catégorie, c'est une moyenne simple. Les travaux sans catégorie comptent avec un coefficient 1.</p>
        <div class="adlist">${s.categories.map((x, i) => `<div class="adrow cat"><input data-cat="${i}" data-k="nom" value="${esc(x.nom || "")}" placeholder="Nom (ex. Contrôle)" aria-label="Nom de la catégorie ${i + 1}"><input data-cat="${i}" data-k="coef" type="number" min="0" step="0.5" value="${esc(x.coef ?? 1)}" aria-label="Coefficient"><button class="ib sm" data-act="rmcat" data-i="${i}" aria-label="Supprimer la catégorie">${icon("x")}</button></div>`).join("")}</div>
        <div><button class="btn ghost sm" data-act="addcat">${icon("plus")} Ajouter une catégorie</button></div>
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
  const ancienNom = (cls(s.id) || {}).nom;
  const { error } = await sb.from("classes").update({ nom:s.nom.trim(), description:s.description.trim(), section:s.section.trim(), niveau:s.niveau.trim(), matiere:s.matiere.trim(), salle:s.salle.trim(),
    symbole:s.symbole.trim() || s.nom.trim().slice(0, 3), couleur:s.couleur, illustration:s.illustration === "auto" ? null : s.illustration, code_actif:s.code_actif, flux_mode:s.flux_mode, flux_devoirs:s.flux_devoirs,
    teams_url:s.teams_url.trim() || null, teams_visible:s.teams_visible, dossier_onedrive:s.dossier_onedrive.trim() || null, moyenne_visible:s.moyenne_visible,
    categories:s.categories.map(x => ({ nom: String(x.nom || "").trim(), coef: Math.max(0, Number(String(x.coef).replace(",", ".")) || 0) })).filter(x => x.nom) }).eq("id", s.id);
  if (error) { s.busy = false; s.err = "Enregistrement impossible : " + error.message; return render(); }
  const id = s.id; S.settings = null; await rafraichir(id); toast("Paramètres enregistrés"); go("/classe/" + id);
  if (odActif() && ancienNom && ancienNom !== s.nom.trim()) setTimeout(() => rangerDossiersClasses({ [id]: ancienNom }), 1200);
}
function moyenneEleve(c){
  return arrondi1(moyenneDe(c, moi(), S.user.id, true).moy);
}
