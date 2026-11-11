/* ---------- éditeur plein écran : devoir, documentation, questionnaire ---------- */
const typeDeLien = (u, mode) => mode === "youtube" || /youtu\.?be/i.test(u) ? "YouTube" : mode === "onedrive" || /sharepoint\.com|onedrive|1drv\.ms/i.test(u) ? "OneDrive" : "Lien";
const extType = n => { const e = (n.split(".").pop() || "").toUpperCase(); return e.length && e.length <= 5 ? e : "Fichier"; };

async function initEditeur(r){
  const type = ["documentation", "questionnaire", "question"].includes(r.a) ? r.a : "devoir", key = location.hash;
  if (S.ed && S.ed.key === key) return;
  let rec = null, classe = r.x, bonnes = [];
  if (r.t !== "new") {
    if (type === "devoir" || type === "question") rec = S.devoirs.find(d => String(d.id) === r.t);
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
    html: rec ? (type === "documentation" ? rec.description : rec.consigne) || "" : "", ressources: rec ? (rec.ressources || []).filter(x => !x.pending || x.pending instanceof Blob) : [], fantomes: rec ? (rec.ressources || []).filter(x => x.pending && !(x.pending instanceof Blob)).map(x => x.label) : [],
    theme_id: rec && rec.theme_id ? String(rec.theme_id) : (S.edTheme || ""), points: rec ? (rec.points == null ? "none" : String(rec.points)) : "20",
    hasDate: rec ? !!rec.date_limite : type !== "documentation", date: ymd(lim), heure: hm(lim), mode: rec ? rec.mode : (type === "questionnaire" ? "note" : "individuel"), formats: rec ? rec.formats || "" : "",
    eleves: rec && rec.eleves ? rec.eleves.slice() : null, montrer: rec ? rec.montrer_correction !== false : true,
    questions: type === "questionnaire" ? (rec ? (rec.questions || []).map((x, i) => { const t = x.t || "choix", b = bonnes[i] ?? null;
      return { q: x.q, t, img: x.img || null, o: t === "courte" || t === "num" ? ["", ""] : (x.o || []).slice(), a: t === "courte" || t === "num" ? null : b, acc: t === "courte" && Array.isArray(b) ? b.join(" ; ") : "",
        num: t === "num" && b && typeof b === "object" ? { v: b.v ?? "", tol: b.tol ?? "5" } : { v: "", tol: "5" } }; }) : [{ q: "", t: "choix", o: ["", ""], a: null, acc: "" }]) : [],
    qformat: rec && rec.question ? rec.question.format || "courte" : "courte", qoptions: rec && rec.question && rec.question.options ? rec.question.options.slice() : ["", ""],
    aussi: [], categorie: rec ? rec.categorie || "" : "", grille: rec && rec.grille ? clone(rec.grille) : [], retard: rec ? !!rec.retard_ok : false, melanger: rec ? !!rec.melanger : false,
    qvoir: rec && rec.question ? !!rec.question.voir : false, qmodif: rec && rec.question ? rec.question.modifier !== false : true,
    aDesResultats: type === "questionnaire" && rec ? S.resultats.some(x => x.quiz_id === rec.id) : false,
    publie: rec ? !rec.brouillon && D(rec.publie_le) <= now() : false, linkMode: null, uploaded: [], toDelete: [], busy: false, err: "" };
  S.edTheme = null;
}

function vEditer(){
  const e = S.ed, c = cls(e.classe_id), k = C(c && c.couleur), data = S.cache[e.classe_id] || {themes:[], eleves:[]};
  const label = {devoir:"Devoir", documentation:"Documentation", questionnaire:"Questionnaire", question:"Question"}[e.type];
  const main = e.publie ? "Enregistrer" : e.type === "devoir" ? "Publier le devoir" : e.type === "questionnaire" ? "Publier le questionnaire" : e.type === "question" ? "Poser la question" : "Publier";
  const isQ = e.type === "question";
  const lm = e.linkMode, lmLabel = {onedrive:"Lien de partage OneDrive", youtube:"Lien de la vidéo YouTube", lien:"Adresse du site"}[lm];
  const nCible = e.eleves ? e.eleves.length : null;
  const dateField = `<div class="field"><label for="edHasDate">Date limite</label><select id="edHasDate" data-f="hasDate"><option value="0" ${e.hasDate ? "" : "selected"}>Aucune date limite</option><option value="1" ${e.hasDate ? "selected" : ""}>Choisir une date</option></select>
      ${e.hasDate ? `<div class="dt2"><input id="edDate" type="date" data-f="date" value="${e.date}" aria-label="Date"><input id="edHeure" type="time" data-f="heure" value="${e.heure}" aria-label="Heure"></div><span class="muted" style="font-size:.78rem">${e.type === "questionnaire" ? "Le questionnaire se fermera à cette heure." : "Le dépôt se fermera automatiquement à cette heure."}</span>` : ""}</div>`;
  return `<div class="edtop" style="--c:var(${k.c})">
    <button class="ib" data-act="edclose" aria-label="Fermer">${icon("x")}</button>
    <span class="ico">${icon(e.type === "devoir" ? "devoir" : e.type === "questionnaire" ? "quiz" : isQ ? "question" : "support", "")}</span><h1>${label}</h1><span class="spacer"></span>
    <button class="btn ghost sm" data-act="symb" data-keepfocus="1" aria-pressed="${!!S.symb}" title="Symboles scientifiques">Ω<span class="lbl"> Symboles</span></button>
    <div class="split dd"><button class="btn" data-act="edsave" data-mode="publish" ${e.busy ? "disabled" : ""}>${e.busy ? "Enregistrement…" : main}</button><button class="btn caret" data-act="menu" data-m="edsave" aria-label="Autres options" ${e.busy ? "disabled" : ""}>▾</button>
      ${S.menu === "edsave" ? `<div class="dd-menu">${e.publie ? "" : `<a href="#" data-act="edprog">Programmer…</a>`}<a href="#" data-act="edsave" data-mode="draft">${e.publie ? "Repasser en brouillon" : "Enregistrer le brouillon"}</a></div>` : ""}</div>
  </div>
  ${S.symb ? `<div class="symbsticky">${paletteSymb()}</div>` : ""}
  <div class="edgrid" style="--c:var(${k.c})">
    <div class="edmain">
      ${e.err ? `<div class="notice" style="background:var(--bad-bg);color:var(--bad)">${esc(e.err)}</div>` : ""}
      ${(e.fantomes || []).length ? `<div class="notice">${e.fantomes.length > 1 ? "Ces fichiers n'avaient" : "Ce fichier n'avait"} pas été envoyé${e.fantomes.length > 1 ? "s" : ""} correctement : <b>${e.fantomes.map(esc).join(", ")}</b>. ${e.fantomes.length > 1 ? "Ils ont été retirés" : "Il a été retiré"} : ajoute-${e.fantomes.length > 1 ? "les" : "le"} à nouveau si besoin.</div>` : ""}
      ${e.aDesResultats ? `<div class="notice">Des élèves ont déjà répondu à ce questionnaire : modifier les questions ou les bonnes réponses ne recalcule pas leurs notes.</div>` : ""}
      <section class="edcard">
        <div class="field"><label for="edTitre">${isQ ? "Question *" : "Titre *"}</label><input id="edTitre" data-f="titre" value="${esc(e.titre)}" placeholder="${e.type === "devoir" ? "ex. Compte rendu du TP titrage" : e.type === "questionnaire" ? "ex. QCM · Les acides et les bases" : isQ ? "ex. Quelle est l'unité de la quantité de matière ?" : "ex. Cours · Les acides et les bases"}"></div>
        <div class="field"><label>${e.type === "documentation" ? "Description" : "Instructions"} <span class="muted">(facultatif)</span></label>
          <div class="rte"><div id="edHtml" class="rtebody" contenteditable="true" role="textbox" aria-multiline="true" aria-label="Consignes pour les élèves" data-ph="Ajoute les consignes pour les élèves…">${rich(e.html)}</div><div class="rtebar">${fmtBar()}</div></div></div>
      </section>
      ${e.type === "questionnaire" ? vQuestionsEditeur(e) : ""}
      ${isQ && e.qformat === "choix" ? `<section class="edcard"><h3>Options de réponse</h3><div class="qopts" style="padding:0">${e.qoptions.map((o, j) => `<div class="qopt"><span class="muted mono">${j + 1}</span><input class="otext qoinput" data-qo="${j}" value="${esc(o)}" placeholder="Option ${j + 1}" aria-label="Option ${j + 1}">${e.qoptions.length > 2 ? `<button class="ib sm" data-act="rmqo" data-i="${j}" aria-label="Supprimer l'option">${icon("x")}</button>` : ""}</div>`).join("")}</div>
        <div><button class="linkbtn" data-act="addqo">${icon("plus")} Ajouter une option</button></div></section>` : ""}
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
          <div class="field"><label for="edLinkLabel">Nom affiché <span class="muted">(facultatif${lm === "youtube" ? " : le titre de la vidéo s'affiche tout seul" : ""})</span></label><input id="edLinkLabel" placeholder="${lm === "youtube" ? "Laisse vide pour le titre de la vidéo" : "ex. Fiche de TP"}"></div>
          <div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn ghost sm" data-act="edlinkcancel">Annuler</button><button class="btn sm" data-act="edlinkadd">Ajouter</button></div>
          ${lm === "onedrive" ? `<p class="muted" style="margin:0;font-size:.8rem">Dans OneDrive : clic droit sur le fichier, « Partager », « Copier le lien ». Vérifie que le lien est accessible aux personnes du lycée.</p>` : ""}</div>` : ""}
        ${cartesEdit(e.ressources, "rmres", x => x.pending ? " · ira dans OneDrive à l'enregistrement" : x.od ? " · OneDrive" : "")}
      </section>`}
      ${e.type === "devoir" ? `<section class="edcard"><h3>Grille d'évaluation <span class="muted" style="font-weight:400">(facultatif)</span></h3>
        <p class="muted" style="margin:0;font-size:.85rem">Ajoute des critères notés : la note du devoir sera la somme des critères.</p>
        ${e.grille.map((g, i) => `<div class="adrow cat"><input data-gr2="${i}" data-k="c" value="${esc(g.c)}" placeholder="Critère (ex. Rédaction, unités)" aria-label="Critère ${i + 1}"><input data-gr2="${i}" data-k="p" type="number" min="0" step="0.5" value="${esc(g.p)}" aria-label="Points du critère ${i + 1}"><button class="ib sm" data-act="rmgr" data-i="${i}" aria-label="Supprimer le critère">${icon("x")}</button></div>`).join("")}
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button class="linkbtn" data-act="addgr">${icon("plus")} Ajouter un critère</button>${e.grille.length ? `<span class="muted" style="font-size:.85rem">Total : <b>${fmtNote(e.grille.reduce((a, g) => a + (Number(g.p) || 0), 0))}</b> points</span>` : ""}</div></section>` : ""}
    </div>
    <aside class="edside">
      <div class="field"><label for="edClasse">Pour</label><select id="edClasse" data-f="classe_id" ${e.id ? "disabled" : ""}>${actives().map(x => `<option value="${esc(x.id)}" ${x.id === e.classe_id ? "selected" : ""}>${esc(x.nom)}</option>`).join("")}</select></div>
      ${!e.id && actives().length > 1 ? `<details class="aussi" ${e.aussi.length ? "open" : ""}><summary>Publier aussi dans d'autres cours${e.aussi.length ? " (" + e.aussi.length + ")" : ""}</summary>${actives().filter(x => x.id !== e.classe_id).map(x => `<label class="check"><input type="checkbox" class="edAussi" value="${esc(x.id)}" ${e.aussi.includes(x.id) ? "checked" : ""}> ${esc(x.nom)}</label>`).join("")}<small class="muted">Une copie est créée dans chaque cours coché (sans thème, pour tous les élèves).</small></details>` : ""}
      <div class="field"><label>Attribuer à</label><button class="btn ghost" data-act="cible">${icon("people")} ${nCible == null ? "Tous les élèves" : nCible + " élève" + (nCible > 1 ? "s" : "")}</button></div>
      ${isQ ? `<div class="field"><label for="edQformat">Type de question</label><select id="edQformat" data-f="qformat"><option value="courte" ${e.qformat === "courte" ? "selected" : ""}>Réponse courte</option><option value="choix" ${e.qformat === "choix" ? "selected" : ""}>Choix multiple</option></select></div>` : ""}
      ${e.type === "devoir" && e.grille.length ? `<div class="field"><label>Points</label><input value="${fmtNote(e.grille.reduce((a, g) => a + (Number(g.p) || 0), 0))} (grille)" disabled></div>${dateField}` : ""}
      ${(e.type === "devoir" && !e.grille.length) || isQ ? `<div class="field"><label for="edPoints">Points</label><select id="edPoints" data-f="points">${["20","10","100","none"].map(p => `<option value="${p}" ${e.points === p ? "selected" : ""}>${p === "none" ? "Non noté" : p}</option>`).join("")}</select></div>${dateField}` : ""}
      ${e.type === "questionnaire" ? `<div class="field"><label for="edMode">Type</label><select id="edMode" data-f="mode"><option value="note" ${e.mode === "note" ? "selected" : ""}>Noté · une seule tentative</option><option value="entrainement" ${e.mode === "entrainement" ? "selected" : ""}>Entraînement · recommençable</option></select></div>
        ${e.mode === "note" ? `<div class="field"><label for="edPoints">Noté sur</label><select id="edPoints" data-f="points">${["20","10","100"].map(p => `<option value="${p}" ${e.points === p ? "selected" : ""}>${p}</option>`).join("")}</select></div>
        <label class="check"><input type="checkbox" id="edMontrer" ${e.montrer ? "checked" : ""}> Montrer la correction à l'élève après l'envoi</label>` : ""}${dateField}` : ""}
      ${isQ ? `<label class="check"><input type="checkbox" id="edVoir" ${e.qvoir ? "checked" : ""}> Les élèves peuvent voir les réponses de la classe</label><label class="check"><input type="checkbox" id="edModif" ${e.qmodif ? "checked" : ""}> Les élèves peuvent modifier leur réponse</label>` : ""}
      ${(e.type !== "documentation") && (c && (c.categories || []).length) ? `<div class="field"><label for="edCat">Catégorie de note</label><select id="edCat" data-f="categorie"><option value="">Aucune catégorie</option>${c.categories.map(x => `<option value="${esc(x.nom)}" ${e.categorie === x.nom ? "selected" : ""}>${esc(x.nom)} · coef ${fmtNote(x.coef)}</option>`).join("")}</select></div>` : ""}
      ${e.type === "devoir" && e.hasDate ? `<label class="check"><input type="checkbox" id="edRetard" ${e.retard ? "checked" : ""}> Accepter les rendus en retard (marqués « en retard »)</label>` : ""}
      ${e.type === "questionnaire" ? `<label class="check"><input type="checkbox" id="edMelanger" ${e.melanger ? "checked" : ""}> Mélanger l'ordre des questions et des réponses pour chaque élève</label>` : ""}
      <div class="field"><label for="edTheme">Thème</label><select id="edTheme" data-f="theme_id"><option value="">Aucun thème</option>${data.themes.map(t => `<option value="${t.id}" ${String(t.id) === e.theme_id ? "selected" : ""}>${esc(t.titre)}</option>`).join("")}<option value="__new">+ Créer un thème…</option></select></div>
      ${e.type === "devoir" ? `<div class="field"><label for="edMode">Type de rendu</label><select id="edMode" data-f="mode"><option value="individuel" ${e.mode === "individuel" ? "selected" : ""}>Individuel</option><option value="binome" ${e.mode === "binome" ? "selected" : ""}>Un rendu par binôme</option></select></div>
      <div class="field"><label for="edFormats">Formats attendus <span class="muted">(facultatif)</span></label><input id="edFormats" data-f="formats" value="${esc(e.formats)}" placeholder="PDF, photos, Python…"></div>` : ""}
    </aside>
  </div>${S.modal ? vModal() : ""}`;
}

function vQuestionsEditeur(e){
  const TYPES = [["choix", "Choix unique"], ["cases", "Cases à cocher"], ["courte", "Réponse courte"], ["num", "Réponse numérique"]];
  return `${e.questions.map((q, i) => { const t = q.t || "choix", bon = j => t === "cases" ? (q.a || []).includes(j) : q.a === j;
    const aide = t === "courte" ? "" : t === "cases" ? ((q.a || []).length ? (q.a || []).length + " bonne(s) réponse(s) cochée(s)" : "Coche toutes les bonnes réponses") : q.a == null ? "Coche la bonne réponse" : "Bonne réponse : option " + (q.a + 1);
    return `<section class="edcard qcard">
      <div class="qhead"><span class="qnum">${i + 1}</span><textarea class="qtext" data-qi="${i}" data-qk="q" rows="2" placeholder="Question" aria-label="Énoncé de la question ${i + 1}">${esc(q.q)}</textarea>
        <select class="qtype" data-qt="${i}" aria-label="Type de la question ${i + 1}">${TYPES.map(([v, l]) => `<option value="${v}" ${t === v ? "selected" : ""}>${l}</option>`).join("")}</select></div>
      ${q.img ? `<div class="qimg"><img src="${esc(S.urls[q.img] || "")}" alt="Image de la question ${i + 1}"><button class="ib sm" data-act="rmqimg" data-qi="${i}" title="Retirer l'image" aria-label="Retirer l'image">${icon("x")}</button></div>` : ""}
      ${t === "num" ? `<div class="qopts"><div class="two"><div class="field"><label>Valeur attendue</label><input class="qacc" data-qnum="${i}" data-k="v" value="${esc(q.num.v)}" placeholder="ex. 2,4 × 10^-3"></div><div class="field"><label>Tolérance (%)</label><input class="qacc" data-qnum="${i}" data-k="tol" type="number" min="0" step="0.5" value="${esc(q.num.tol)}"></div></div>
          <span class="muted" style="font-size:.8rem">L'élève peut écrire 0,0024 ou 2,4×10^-3 ou 2,4e-3 ; l'unité écrite après le nombre est ignorée.</span></div>`
      : t === "courte" ? `<div class="qopts"><div class="field"><label>Réponses acceptées <span class="muted">(sépare-les par ;)</span></label><input class="qacc" data-qacc="${i}" value="${esc(q.acc || "")}" placeholder="ex. mol ; mole ; moles"></div>
          <span class="muted" style="font-size:.8rem">Les majuscules, les accents et les espaces en trop ne comptent pas.</span></div>`
        : `<div class="qopts">${q.o.map((o, j) => `<div class="qopt ${bon(j) ? "good" : ""}"><input type="${t === "cases" ? "checkbox" : "radio"}" name="bonne${i}" data-act="${t === "cases" ? "bonnecase" : "bonne"}" data-qi="${i}" data-oi="${j}" ${bon(j) ? "checked" : ""} aria-label="Bonne réponse : option ${j + 1}" title="Bonne réponse"><input class="otext" data-qi="${i}" data-oi="${j}" value="${esc(o)}" placeholder="Option ${j + 1}" aria-label="Option ${j + 1} de la question ${i + 1}">${q.o.length > 2 ? `<button class="ib sm" data-act="rmopt" data-qi="${i}" data-oi="${j}" aria-label="Supprimer l'option">${icon("x")}</button>` : ""}</div>`).join("")}</div>`}
      <div class="qfoot">${t === "courte" || t === "num" ? "" : `<button class="linkbtn" data-act="addopt" data-qi="${i}">${icon("plus")} Ajouter une option</button>`}<button class="linkbtn" data-act="qimg" data-qi="${i}">${icon("upload")} ${q.img ? "Changer l'image" : "Image"}</button><span class="spacer"></span>
        <span class="muted" style="font-size:.8rem">${aide}</span>
        <button class="ib sm" data-act="dupq" data-qi="${i}" title="Dupliquer" aria-label="Dupliquer la question">${icon("copy")}</button>
        ${e.questions.length > 1 ? `<button class="ib sm" data-act="rmq" data-qi="${i}" title="Supprimer" aria-label="Supprimer la question">${icon("trash")}</button>` : ""}</div>
    </section>`; }).join("")}
    <div><button class="btn ghost" data-act="addq">${icon("plus")} Ajouter une question</button></div><input type="file" id="qimgFile" accept="image/*" hidden>`;
}
/* lecture d'un nombre écrit par un élève : 0,0024 · 2,4×10^-3 · 2.4e-3 · « 2,4 mol » */
function nombre(t){
  let s = String(t ?? "").toLowerCase().replace(/[\s\u00a0]/g, "").replace(/,/g, ".").replace(/[−–]/g, "-");
  s = s.replace(/(×|x|\*|·)10\^?/, "e").replace(/[⁻]/g, "-").replace(/[^0-9e.+-].*$/, "");
  return /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/.test(s) ? Number(s) : null;
}
const accDe = q => String(q.acc || "").split(/[;\n]/).map(x => x.trim()).filter(Boolean);

async function uploadFichiers(files, cible){
  const classe = cible === "annonce" ? S.annonce.classe : S.ed.classe_id, dest = cible === "annonce" ? S.annonce : S.ed;
  if (odActif()) {
    for (const f of files) {
      if (cible !== "annonce") { dest.ressources.push({ type: extType(f.name), label: f.name, pending: f }); continue; }
      try { toast("Envoi dans OneDrive : « " + f.name + " »…"); const o = await odEnvoyer([(cls(classe) || {}).nom || classe, "Annonces", ymd(now()), f.name], f); dest.ressources.push(ressourceOD(o, f.name)); toast("« " + f.name + " » rangé dans OneDrive"); }
      catch (e) { toast("OneDrive : " + (e.message || e) + ". Fichier non ajouté."); }
    }
    return render();
  }
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
    for (let i = 0; i < e.questions.length; i++) {
      const q = e.questions[i], t = q.t || "choix";
      if (!q.q.trim()) { e.err = "La question " + (i + 1) + " n'a pas d'énoncé."; return render(); }
      if (t === "courte") { if (!accDe(q).length) { e.err = "Indique au moins une réponse acceptée pour la question " + (i + 1) + "."; return render(); } continue; }
      if (t === "num") { if (nombre(q.num.v) == null) { e.err = "La valeur attendue de la question " + (i + 1) + " n'est pas un nombre."; return render(); } continue; }
      if (q.o.length < 2 || q.o.some(x => !x.trim())) { e.err = "La question " + (i + 1) + " doit avoir au moins deux options, toutes remplies."; return render(); }
      if (t === "cases" ? !(q.a || []).length : q.a == null) { e.err = (t === "cases" ? "Coche au moins une bonne réponse" : "Coche la bonne réponse") + " de la question " + (i + 1) + "."; return render(); }
    }
  }
  if (e.type === "question" && e.qformat === "choix" && (e.qoptions.length < 2 || e.qoptions.some(x => !x.trim()))) { e.err = "Donne au moins deux options de réponse, toutes remplies."; return render(); }
  if (e.eleves && !e.eleves.length) { e.err = "Choisis au moins un élève, ou « Tous les élèves »."; return render(); }
  const row = { classe_id: e.classe_id, theme_id: e.theme_id ? Number(e.theme_id) : null, titre: e.titre.trim(), ressources: e.ressources, eleves: e.eleves };
  const grille = e.grille.map(g => ({ c: String(g.c || "").trim(), p: Number(String(g.p).replace(",", ".")) || 0 })).filter(g => g.c && g.p > 0);
  if (e.type === "devoir" && e.grille.length && grille.length !== e.grille.length) { e.err = "Chaque critère de la grille doit avoir un nom et des points."; return render(); }
  if (e.type === "devoir") Object.assign(row, { consigne: e.html, date_limite: limite ? limite.toISOString() : null, mode: e.mode, formats: e.formats.trim(),
    points: grille.length ? grille.reduce((a, g) => a + g.p, 0) : e.points === "none" ? null : Number(e.points), grille: grille.length ? grille : null, retard_ok: !!(e.retard && limite), categorie: e.categorie || null });
  else if (e.type === "question") Object.assign(row, { categorie: e.categorie || null, type: "question", consigne: e.html, date_limite: limite ? limite.toISOString() : null, mode: "individuel", formats: "", points: e.points === "none" ? null : Number(e.points),
    question: { format: e.qformat, options: e.qformat === "choix" ? e.qoptions.map(x => x.trim()) : [], voir: e.qvoir, modifier: e.qmodif } });
  else if (e.type === "questionnaire") Object.assign(row, { categorie: e.categorie || null, melanger: !!e.melanger, consigne: e.html, date_limite: limite ? limite.toISOString() : null, mode: e.mode, points: Number(e.points === "none" ? 20 : e.points), montrer_correction: e.montrer,
    questions: e.questions.map(q => { const t = q.t || "choix", base = (t === "courte" || t === "num") ? { q: q.q.trim(), t, o: [] } : { q: q.q.trim(), t, o: q.o.map(x => x.trim()) }; if (q.img) base.img = q.img; return base; }) });
  else row.description = e.html;
  if (e.type === "questionnaire") delete row.ressources;
  if (mode === "draft") row.brouillon = true;
  else if (mode === "schedule") { row.brouillon = false; row.publie_le = programme.toISOString(); }
  else { row.brouillon = false; if (!e.publie) row.publie_le = now().toISOString(); }
  Object.keys(row).forEach(k => row[k] === undefined && delete row[k]);
  e.busy = true; S.menu = null; render();
  if (e.ressources.some(x => x.pending)) {
    try { await envoyerEnAttente(e); } catch (er) { e.busy = false; e.err = "Envoi dans OneDrive impossible : " + (er.message || er) + ". Réessaie, ou désactive OneDrive dans Paramètres › Site."; return render(); }
    if (row.ressources) row.ressources = e.ressources;
  }
  if (row.ressources) row.ressources = row.ressources.filter(x => !x.pending);
  const table = e.type === "devoir" || e.type === "question" ? "devoirs" : e.type === "questionnaire" ? "quiz" : "supports";
  const q = e.id ? sb.from(table).update(row).eq("id", e.id).select("id").single() : sb.from(table).insert(row).select("id").single();
  const { data, error } = await q;
  if (error) { e.busy = false; e.err = "Enregistrement impossible : " + error.message; return render(); }
  const bonnesQ = e.type === "questionnaire" ? e.questions.map(x => (x.t || "choix") === "courte" ? accDe(x) : x.t === "num" ? { v: String(nombre(x.num.v)), tol: String(Math.max(0, Number(String(x.num.tol).replace(",", ".")) || 0)) } : x.t === "cases" ? (x.a || []).slice().sort((p, q) => p - q) : x.a) : null;
  if (e.type === "questionnaire") {
    const r2 = await sb.from("quiz_solutions").upsert({ quiz_id: data.id, bonnes: bonnesQ });
    if (r2.error) { e.busy = false; e.err = "Les bonnes réponses n'ont pas pu être enregistrées : " + r2.error.message; e.id = data.id; return render(); }
  }
  if (e.toDelete.length) await sb.storage.from("documents").remove(e.toDelete);
  const aussi = e.id ? [] : e.aussi.filter(x => x !== e.classe_id), kk = e.type === "questionnaire" ? "quiz" : e.type === "documentation" ? "support" : "devoir";
  if (mode === "schedule") progAjoute(e.type === "questionnaire" ? "quiz" : e.type === "documentation" ? "support" : "devoir", data.id);
  const classe = e.classe_id, nouveau = !e.id, typ = e.type; S.ed = null;
  await rafraichir(classe);
  if (aussi.length) { const n = await publierAussi(kk, aussi, row, bonnesQ); await rafraichir(); toast("Aussi publié dans " + n + " autre" + (n > 1 ? "s" : "") + " cours"); }
  else toast(mode === "draft" ? "Brouillon enregistré" : mode === "schedule" ? "Publication programmée" : !nouveau ? "Modifications enregistrées" : ({devoir:"Devoir publié", questionnaire:"Questionnaire publié", documentation:"Documentation publiée", question:"Question publiée"})[typ]);
  go("/classe/" + classe + "/travaux");
  setTimeout(async () => { await synchroPartages(true); if (mode !== "draft") await genererCopies(true); }, 800);
}

/* ---------- annonces du flux ---------- */
/* date de publication choisie (annonce programmée), ou null pour tout de suite */
function quandAnnonce(A){
  if (!A || !A.quandD) return null;
  const d = new Date(A.quandD + "T" + (A.quandH || "08:00"));
  return isNaN(d) || d <= now() ? null : d;
}
async function publierAnnonce(){
  const A = S.annonce, el = document.getElementById("anHtml"); if (el) A.html = el.innerHTML;
  if (A.quandD && !quandAnnonce(A)) { toast("Choisis une date de publication dans le futur, ou retire la date."); return; }
  const quand = quandAnnonce(A), pub = S.prof ? { publie_le: (quand || (A.id && A.publieAvant && D(A.publieAvant) > now() ? now() : null)) } : {};
  if (pub.publie_le) pub.publie_le = pub.publie_le.toISOString(); else delete pub.publie_le;
  const txt = (A.html || "").replace(/<[^>]*>/g, "").trim();
  if (!txt && !A.ressources.length) { toast("Écris un message avant de publier."); return; }
  A.busy = true; render();
  const { error } = A.id ? await sb.from("annonces").update({ texte: A.html, ressources: A.ressources, ...pub }).eq("id", A.id)
    : await sb.from("annonces").insert({ classe_id: A.classe, auteur_nom: S.nom, texte: A.html, ressources: A.ressources, ...pub });
  if (error) { A.busy = false; render(); toast("Enregistrement impossible : " + error.message); return; }
  if (A.toDelete && A.toDelete.length) await sb.storage.from("documents").remove(A.toDelete);
  for (const cid of (!A.id && A.aussi) || []) { await sb.from("annonces").insert({ classe_id: cid, auteur_nom: S.nom, texte: A.html, ressources: await copierRessources(A.ressources, cid), ...pub }); delete S.cache[cid]; }
  const c = A.classe, modif = !!A.id; S.annonce = null; delete S.cache[c]; render();
  toast(quand ? "Annonce programmée : " + quand.toLocaleString("fr-FR", {weekday:"long", day:"numeric", month:"long", hour:"2-digit", minute:"2-digit"}) : modif ? "Annonce modifiée" : "Annonce publiée");
}
