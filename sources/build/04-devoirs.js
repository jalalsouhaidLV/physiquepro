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
    ${list.map(x => `<div class="com">${avatarP(x.auteur_nom, "sm")}<div style="flex:1;min-width:0"><b>${esc(x.auteur_nom)}</b> <small class="muted">${fmtQuand(D(x.cree_le))}</small><div>${linkify(x.texte)}</div>${x.photo ? photoCP(x.photo) : ""}</div></div>`).join("") || `<span class="muted" style="font-size:.85rem">${S.prof ? "Aucun échange avec cet élève." : "Pose une question à ton professeur : seul lui verra ce message."}</span>`}
    <div class="comform"><input id="cpIn" placeholder="${S.prof ? "Écrire à l'élève…" : "Ton message…"}" aria-label="Commentaire privé">${boutonPhotoCP(did, email)}<button class="ib" data-act="cpsend" data-d="${did}" data-e="${esc(email)}" aria-label="Envoyer">${icon("send")}</button></div></div>`;
}

/* ---------- devoir côté élève ---------- */
function vDevoir(r){
  const d = S.devoirs.find(x => String(x.id) === r.a);
  if (!d) return `<div class="page"><div class="emptystate"><b>Devoir introuvable.</b><a href="#/">Retour à l'accueil</a></div></div>`;
  const c = cls(d.classe_id), k = C(c && c.couleur);
  if (S.prof) return vDevoirProf(d, c);
  const e = etat(d, moi()), rd = e.r, open = depotOuvert(d), isQ = d.type === "question", Q = d.question || {};
  let work;
  if (isQ) work = travailQuestion(d, c, e, rd, open, Q);
  else if (rd) {
    work = `${ressources([...(rd.fichiers || []).map(f => f.od ? { label: f.nom, url: f.od.web } : { label: f.nom, path: f.chemin, bucket: "rendus" }), ...(rd.lien ? [{ label: rd.lien, url: rd.lien }] : [])], {}, "mini")}
      ${rd.binome_email ? `<p style="margin:0;font-size:.85rem">Rendu en binôme avec <b>${esc(nomDe(c.id, rd.auteur_email === moi() ? rd.binome_email : rd.auteur_email))}</b></p>` : ""}
      <p class="muted" style="margin:0;font-size:.8rem">Rendu le ${fmtShort(D(rd.rendu_le))} à ${fmtT(D(rd.rendu_le))}</p>
      ${e.t === "Noté" ? `<div class="grade">${fmtNote(e.note)}<small>/${d.points}</small></div>` : ""}${retourProf(e, d)}
      ${e.t !== "Noté" && open && rd.auteur === S.user.id ? `<button class="btn ghost" data-act="unsubmit" data-id="${rd.id}">Annuler l'envoi</button>` : ""}`;
  } else if (!open) {
    work = `<p style="margin:0" class="muted">${d.accepte === false ? "Ton professeur n'accepte plus de devoirs pour ce travail : le dépôt est verrouillé." : "La date limite est passée : le dépôt est fermé."} Écris un commentaire privé à ton professeur si besoin.</p>`;
  } else {
    const cam = (S.cache[c.id] ? S.cache[c.id].eleves : []).filter(x => x.email !== moi());
    work = `${d.mode === "binome" ? `<div class="field"><label for="partenaire">Mon binôme</label><select id="partenaire"><option value="">Choisir…</option>${cam.map(x => `<option value="${esc(x.email)}" ${S.partenaire === x.email ? "selected" : ""}>${esc(x.nom)}</option>`).join("")}</select></div>` : ""}
      ${copiesEleve("devoir", d.id, moi()).map(x => `<div class="copierow">${icon("edit")}<span>Ta copie modifiable : <b>${esc(x.nom)}</b><small class="muted" style="display:block">Tes modifications sont enregistrées automatiquement et ton professeur les voit.</small></span>${telephone() ? `<a href="#" data-act="wordtel" data-copie="${esc(x.id)}" data-devoir="${esc(d.id)}" class="btn sm">Ouvrir</a>` : `<a href="${esc(x.web)}" target="_blank" rel="noopener" class="btn ghost sm">Ouvrir</a>`}</div>`).join("")}
      ${S.files.length ? `<div class="att rcards mini">${S.files.map((f, i) => carteEdit({ label: f.name, pending: f }, "rmfile", i, " · " + tailleTxt(f.size))).join("")}</div>` : ""}
      ${S.lienOpen ? `<div class="field"><label for="lien">Lien (OneDrive, vidéo…)</label><input id="lien" type="url" placeholder="https://…" value="${esc(S.lien)}"></div>` : ""}
      ${(() => { const aCopie = copiesEleve("devoir", d.id, moi()).length > 0, ouvre = S.autresRendus || S.files.length || S.lienOpen || S.menu === "ajouter";
        const autres = `${(d.ressources || []).map((x, i) => ficheAnnotable(x) ? `<button class="btn tonal ecrirefiche" data-act="ecrirefiche" data-id="${d.id}" data-i="${i}">${icon("pen")} Écrire sur « ${esc(x.label || "la fiche")} »</button>` : "").join("")}
      <button class="btn tonal" data-act="scanner" data-id="${d.id}">${icon("camera")} Scanner mon travail papier</button>
      <div class="dd"><button class="btn ghost" data-act="menu" data-m="ajouter" style="width:100%">${icon("plus")} Ajouter ou créer</button>${S.menu === "ajouter" ? `<div class="dd-menu" style="left:0;right:auto;width:100%"><a href="#" data-act="pickfile">${icon("upload")} Fichier</a><a href="#" data-act="lienopen">${icon("links")} Lien</a></div>` : ""}</div>`;
        return aCopie ? `<details class="autresrendus"${ouvre ? " open" : ""}><summary>Autres façons de rendre <small>photo, fichier, lien</small></summary><div class="autresliste">${autres}</div></details>` : autres; })()}
      <input type="file" id="fileIn" multiple hidden>
      ${!ouvert(d) ? `<p class="notice" style="margin:0;font-size:.85rem">La date limite est passée : ton travail sera marqué <b>en retard</b>.</p>` : ""}
      <div id="depErr" class="err" hidden></div>${quiRend()}
      <button class="btn" data-act="submit" data-id="${d.id}" ${S.sending ? "disabled" : ""}>${S.sending ? "Envoi en cours…" : (S.files.length || S.lien ? "Rendre" : "Marquer comme terminé")}</button>
      <p class="muted" style="margin:0;font-size:.78rem">50 Mo maximum par fichier${d.formats ? " · " + esc(d.formats) : ""}</p>`;
  }
  return `<div class="page wide" style="--c:var(${k.c})"><div class="dv dveleve">
    <div class="dvmain" style="display:grid;gap:16px;min-width:0">
      <div class="dvhead"><span class="ico">${icon(isQ ? "question" : "devoir", "")}</span><div style="flex:1;min-width:0"><h1>${escTitre(d.titre)}</h1>
        <div class="muted" style="font-size:.88rem;margin-top:4px">${esc(R().prof.nom)} · ${fmtShort(D(d.publie_le))}</div>
        <div class="dvmeta"><b>${pts(d)}</b><span>${dueOf(d)}</span></div></div></div>
      <div class="dvbody">${texteUtile(d.consigne) ? `<div class="consignehead">${btnEcouter("consigne-" + d.id)}</div><div class="richtext" id="consigne-${d.id}">${rich(d.consigne)}</div>` : ""}
        ${isQ ? "" : `<p class="muted" style="margin:0;font-size:.85rem">${d.mode === "binome" ? "Un seul rendu par binôme : la note s'applique aux deux élèves." : "Travail individuel."}</p>`}${ressources(d.ressources, { classe: d.classe_id, devoir: d.id })}</div>
      ${isQ ? reponsesClasse(d, c, rd, Q) : ""}
      ${blocComsDevoir(d, c)}
    </div>
    <aside class="dvside" style="display:grid;gap:16px;align-content:start">
      <div class="yourwork"><header><h2>${isQ ? "Ta réponse" : "Ton travail"}</h2><span class="pill ${e.k}">${e.t === "Rendu" && isQ ? "Envoyée" : libEtat(e.t)}${e.retard ? " en retard" : ""}</span></header>${work}</div>
      ${vCP(d.id, moi())}${actionsTelDevoir(d, "devoir")}
    </aside></div>${pageFoot()}</div>`;
}
function travailQuestion(d, c, e, rd, open, Q){
  if (rd) return `<div class="reponse">${linkify(rd.reponse || "")}</div>
    <p class="muted" style="margin:0;font-size:.8rem">Envoyée le ${fmtShort(D(rd.rendu_le))} à ${fmtT(D(rd.rendu_le))}</p>
    ${e.t === "Noté" ? `<div class="grade">${fmtNote(e.note)}<small>/${d.points}</small></div>` : ""}${retourProf(e, d)}
    ${e.t !== "Noté" && open && Q.modifier !== false ? `<button class="btn ghost" data-act="unsubmit" data-id="${rd.id}">Modifier ma réponse</button>` : ""}`;
  if (!open) return `<p style="margin:0" class="muted">${d.accepte === false ? "Ton professeur n'accepte plus de réponses pour cette question." : "La date limite est passée : tu ne peux plus répondre."}</p>`;
  const champ = Q.format === "choix" ? `<div class="qopts" style="padding:0">${(Q.options || []).map(o => `<label class="opt"><input type="radio" name="repQ" data-act="repchoix" value="${esc(o)}" ${S.reponse === o ? "checked" : ""}> ${esc(o)}</label>`).join("")}</div>`
    : `<textarea id="repQ" rows="4" placeholder="Ta réponse" aria-label="Ta réponse">${esc(S.reponse || "")}</textarea>`;
  return `${champ}<div id="depErr" class="err" hidden></div>${quiRend()}
    <button class="btn" data-act="submit" data-id="${d.id}" ${S.sending ? "disabled" : ""}>${S.sending ? "Envoi…" : "Rendre"}</button>
    ${Q.voir ? `<p class="muted" style="margin:0;font-size:.78rem">Après ta réponse, tu verras celles de tes camarades.</p>` : ""}`;
}
function reponsesClasse(d, c, rd, Q){
  if (!Q.voir || !rd) return "";
  const autres = S.rendus.filter(r => r.devoir_id === d.id && r.id !== rd.id);
  return `<section class="yourwork"><header><h2 style="font-size:1rem">${icon("people")} Réponses de la classe</h2><span class="muted mono">${autres.length}</span></header>
    ${autres.length ? autres.map(r => `<div class="com">${avatarP(nomDe(c.id, r.auteur_email), "sm")}<div style="flex:1;min-width:0"><b>${esc(nomDe(c.id, r.auteur_email))}</b><div>${linkify(r.reponse || "")}</div></div></div>`).join("") : `<span class="muted" style="font-size:.85rem">Personne d'autre n'a encore répondu.</span>`}</section>`;
}
function syntheseQuestion(d, el){
  const Q = d.question || {}, rs = el.map(e => renduDe(d, e.email)).filter(Boolean);
  if (!rs.length) return "";
  if (Q.format === "choix") return `<div class="synth">${(Q.options || []).map(o => { const n = rs.filter(r => r.reponse === o).length, p = Math.round(n / rs.length * 100); return `<div class="sbar"><span>${esc(o)}</span><span class="jauge"><i style="width:${p}%"></i></span><b>${n}</b></div>`; }).join("")}</div>`;
  return `<div class="synth">${rs.map(r => `<div class="com"><b style="min-width:120px">${esc(nomDe(d.classe_id, r.auteur_email))}</b><span>${linkify(r.reponse || "")}</span></div>`).join("")}</div>`;
}
const retourProf = (e, d) => (e.t === "Noté" ? badgesCompetences(e.c && e.c.competences) + retourFichiers(e.c) : "") + (e.t === "Noté" && d ? grilleEleve(d, e.c) : "") + (e.t === "Noté" && e.c && e.c.commentaire ? `<div class="retour"><b>${icon("comment")} Commentaire de ${esc(R().prof.nom)}</b><div>${linkify(e.c.commentaire)}</div></div>` : "");
const tailleTxt = b => b > 1e6 ? (b / 1e6).toFixed(1).replace(".", ",") + " Mo" : Math.max(1, Math.round(b / 1e3)) + " Ko";
const safeName = n => n.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9._-]+/g, "_").slice(-80);
const nomDe = (cid, email) => ((inscritsDe(cid).find(x => x.email === email) || {}).nom) || nomDepuisEmail(email);

async function rendreDevoir(d){
  const err = document.getElementById("depErr"), fail = m => { S.sending = false; render().then(() => { const x = document.getElementById("depErr"); if (x) { x.hidden = false; x.textContent = m; } }); };
  if (!depotOuvert(d)) return fail(d.accepte === false ? "Ton professeur n'accepte plus de devoirs pour ce travail." : "La date limite est passée.");
  if (d.type === "question") {
    const rep2 = (S.reponse || "").trim(); if (!rep2) return fail("Écris ou choisis ta réponse avant de rendre.");
    if (!enLigne()) return fail("Pas de connexion Internet : ta réponse reste gardée sur ce téléphone. Réessaie dès que le réseau revient.");
    S.sending = true; render();
    const { error } = await envoiAvecEssais(() => sb.from("rendus").insert({ devoir_id: d.id, auteur: S.user.id, auteur_email: moi(), fichiers: [], reponse: rep2 }));
    if (error) return fail("Envoi impossible : " + error.message);
    S.reponse = ""; S.sending = false; await rafraichir(); render(); confirmationRendu(d, "Réponse envoyée !"); return;
  }
  if (d.mode === "binome" && !S.partenaire) return fail("Choisis ton binôme avant de rendre.");
  if (S.lien && !/^https:\/\//.test(S.lien)) return fail("Le lien doit commencer par https://");
  if (!enLigne()) return fail("Pas de connexion Internet : ton travail reste gardé sur ce téléphone. Réessaie dès que le réseau revient.");
  S.sending = true; render();
  const fichiers = [], aEnvoyer = [];
  for (const f0 of S.files) aEnvoyer.push(await alleger(f0));
  const total = aEnvoyer.reduce((a, f) => a + (f.size || 0), 0) || 1; let fait = 0;
  for (let i = 0; i < aEnvoyer.length; i++) {
    const f = aEnvoyer[i];
    progressionEnvoi(i + 1, aEnvoyer.length, fait / total, f.name);
    const chemin = d.id + "/" + S.user.id + "/" + Date.now() + "-" + safeName(f.name);
    const { error } = await envoiAvecEssais(() => sb.storage.from("rendus").upload(chemin, f), n => progressionEnvoi(i + 1, aEnvoyer.length, fait / total, f.name, n));
    if (error) { progressionEnvoi(); if (fichiers.length) await sb.storage.from("rendus").remove(fichiers.map(x => x.chemin)); return fail("Envoi de « " + f.name + " » impossible : " + (estErreurReseau(error) ? "le réseau a coupé. Ton travail reste gardé sur ce téléphone : réessaie dans un instant." : error.message)); }
    fichiers.push({ chemin, nom: f.name, taille: f.size }); fait += f.size || 0;
  }
  progressionEnvoi(aEnvoyer.length, aEnvoyer.length, 1, "");
  const { error } = await envoiAvecEssais(() => sb.from("rendus").insert({ devoir_id: d.id, auteur: S.user.id, auteur_email: moi(), binome_email: d.mode === "binome" ? S.partenaire : null, fichiers, lien: S.lien || null }));
  progressionEnvoi();
  if (error) { if (fichiers.length) await sb.storage.from("rendus").remove(fichiers.map(x => x.chemin)); return fail(/row-level|policy/i.test(error.message) ? "Rendu impossible : le dépôt est fermé, ou ton binôme a déjà rendu ce devoir." : "Rendu impossible : " + error.message); }
  S.files = []; S.lien = ""; S.lienOpen = false; S.partenaire = ""; S.sending = false;
  await rafraichir(); render(); confirmationRendu(d, "Devoir rendu !");
}

/* ---------- devoir côté professeur ---------- */
function vDevoirProf(d, c){
  const k = C(c && c.couleur), ptab = S.ptab || "travaux", isQ = d.type === "question";
  const el = elevesDuDevoir(d, (S.cache[c.id] || {eleves:[]}).eleves);
  const sel = S.sel && el.some(e => e.email === S.sel) ? S.sel : null;
  const tabs = `<div class="tabsbar" style="--c:var(${k.c})"><div class="tabs" role="tablist"><button role="tab" aria-selected="${ptab === "instructions"}" data-act="ptab" data-t="instructions">Instructions</button><button role="tab" aria-selected="${ptab === "travaux"}" data-act="ptab" data-t="travaux">Travaux des élèves</button></div>
    <div class="tabicons">${isQ ? "" : `<button class="ib" data-act="dmnew" data-d="${d.id}" title="Demande au préparateur" aria-label="Demande de matériel au préparateur">${icon("flask")}</button>`}<a class="ib" href="#/editer/${isQ ? "question" : "devoir"}/${d.id}" title="Modifier" aria-label="Modifier">${icon("edit")}</a></div></div>`;
  if (ptab === "instructions") {
    return tabs + `<div class="page wide" style="--c:var(${k.c})"><div class="dvhead"><span class="ico">${icon(isQ ? "question" : "devoir", "")}</span><div style="flex:1;min-width:0"><h1>${escTitre(d.titre)}</h1>
      <div class="muted" style="font-size:.88rem;margin-top:4px">${esc(R().prof.nom)} · ${fmtShort(D(d.publie_le))}${d.brouillon ? " · <i>Brouillon</i>" : ""}${d.eleves ? " · attribué à " + d.eleves.length + " élève" + (d.eleves.length > 1 ? "s" : "") : ""}</div>
      <div class="dvmeta"><b>${pts(d)}</b><span>${dueOf(d)}</span></div></div></div>
      <div class="dvbody">${texteUtile(d.consigne) ? `<div class="consignehead">${btnEcouter("consigne-" + d.id)}</div><div class="richtext" id="consigne-${d.id}">${rich(d.consigne)}</div>` : ""}${isQ ? `<p class="muted" style="margin:0;font-size:.85rem">${(d.question || {}).format === "choix" ? "Choix multiple : " + (d.question.options || []).map(esc).join(" · ") : "Réponse courte."}${(d.question || {}).voir ? " Les élèves voient les réponses de la classe." : ""}${(d.question || {}).modifier === false ? " Réponse non modifiable." : ""}</p>` : `<p class="muted" style="margin:0;font-size:.85rem">${d.mode === "binome" ? "Un rendu par binôme." : "Individuel."}${d.formats ? " Formats : " + esc(d.formats) + "." : ""}</p>`}${ressources(d.ressources, { classe: d.classe_id, devoir: d.id })}</div>${blocComsDevoir(d, c)}${pageFoot()}</div>`;
  }
  const rendusE = el.filter(e => renduDe(d, e.email)), autres = el.filter(e => !renduDe(d, e.email));
  const noteDe = e => { const cr = correctionDe(renduDe(d, e.email)); return cr && cr.note != null ? fmtNote(cr.note) : "__"; };
  const row = e => { const s = etat(d, e.email), cr = correctionDe(renduDe(d, e.email)); return `<button class="st" data-act="sel" data-n="${esc(e.email)}" aria-current="${sel === e.email}">${avatarP(e.nom, "sm")}<span class="nm">${esc(e.nom)}<small style="color:var(--${s.k === "bad" ? "bad" : s.k === "info" ? "accent" : "muted"})">${cr && cr.note != null && !cr.publiee ? "Brouillon" : s.t}${s.retard ? " · en retard" : ""}</small></span>${d.points != null ? `<span class="nt">${noteDe(e)}<span class="muted">/${d.points}</span></span>` : ""}</button>`; };
  let detail;
  if (!sel) {
    detail = `<h2 style="font-size:1.3rem">${esc(d.titre)}</h2>${statsDevoir(d)}${statsAvancees(d)}
      <label class="accepte"><input type="checkbox" data-accepte="${d.id}" ${d.accepte !== false ? "checked" : ""}><i></i><span>${d.accepte !== false ? "Devoirs acceptés" : "Devoirs non acceptés"}</span>
        <span class="info" title="Quand les devoirs ne sont pas acceptés, les élèves ne peuvent plus rendre leur travail ni annuler leur envoi. Tu peux rouvrir la remise à tout moment.">${icon("question")}</span></label>
      ${d.accepte === false ? `<p class="muted" style="margin:-6px 0 0;font-size:.85rem">La remise est verrouillée : les élèves voient « Ton professeur n'accepte plus de devoirs pour ce travail ».</p>` : ""}
      <p class="muted" style="margin:0">${d.date_limite ? (ouvert(d) ? "Dépôt ouvert jusqu'au " + fmtD(D(d.date_limite)) + " à " + fmtT(D(d.date_limite)) + "." : "Dépôt fermé depuis le " + fmtD(D(d.date_limite)) + ".") : "Aucune date limite."}</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap">${d.points != null && aCorriger(d) ? `<button class="btn" data-act="rendretout" data-d="${d.id}">${icon("send")} Rendre toutes les notes saisies</button>` : ""}
      ${autres.length ? `<button class="btn ghost" data-act="mailmissing" data-d="${d.id}">${icon("mail")} Écrire aux ${autres.length} élève${autres.length > 1 ? "s" : ""} qui n'${autres.length > 1 ? "ont" : "a"} pas rendu</button>` : ""}</div>
      ${S.compose ? composeBox(el.filter(e => S.pick.has(e.email))) : ""}
      ${isQ ? syntheseQuestion(d, el) : ""}
      ${odActif() && !isQ && rendusE.length ? `<div><button class="btn ghost sm" data-act="odrendus" data-d="${d.id}">${icon("nuage")} Copier les travaux rendus dans OneDrive</button></div>` : ""}
      <p style="margin:0">Choisis un élève dans la liste pour ouvrir ${isQ ? "sa réponse" : "son travail"} et le noter.</p>`;
  } else {
    const e = el.find(x => x.email === sel), rd = renduDe(d, sel), cr = correctionDe(rd);
    detail = `${barreCorrection()}<div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center"><h2 style="font-size:1.35rem">${esc(e.nom)}${rd && rd.binome_email ? ` <span class="muted" style="font-size:.95rem">avec ${esc(nomDe(c.id, rd.auteur_email === sel ? rd.binome_email : rd.auteur_email))}</span>` : ""}</h2><span class="pill ${etat(d, sel).k}">${etat(d, sel).t}</span></div>
      ${rd ? `<p class="muted" style="margin:0;font-size:.85rem">Rendu le ${fmtD(D(rd.rendu_le))} à ${fmtT(D(rd.rendu_le))}${enRetard(d, rd) ? ` <span class="pill bad">en retard</span>` : ""}</p>
        ${isQ ? `<div class="reponse">${linkify(rd.reponse || "")}</div>` : `${(rd.fichiers || []).length || rd.lien ? `<div class="att rcards mini">${(rd.fichiers || []).map((f, fj) => { const fam = familleRes(f.nom), lien = `href="#" data-act="voir" data-d="${d.id}" data-e="${esc(sel)}" data-i="${fj}"`; return `<div class="rcard"><a class="rtxt" ${lien} title="${esc(f.nom)}"><b>${esc(f.nom)}</b><small>${esc(fam ? TYPE_RES[fam][0] : "Fichier")}</small></a><a class="rthumb-l" ${lien} tabindex="-1" aria-hidden="true">${vignetteRes({ label: f.nom, bucket: "rendus" }, fam)}</a></div>`; }).join("")}${rd.lien ? carteRes({ label: rd.lien, url: rd.lien }) : ""}</div>` : `<div class="att"><span class="muted">Marqué comme terminé, sans fichier joint.</span></div>`}`}
        ${(rd.fichiers || []).length ? `<div><button class="btn ghost sm" data-act="voir" data-d="${d.id}" data-e="${esc(sel)}" data-i="0">${icon("expand")} Ouvrir dans la visionneuse</button></div>` : ""}
        ${blocNotation(d, rd, cr)}`
      : `<p class="muted" style="margin:0">${ouvert(d) ? "Cet élève n'a pas encore rendu son travail." : "Cet élève n'a rien rendu avant la date limite."}</p>`}
      ${copiesEleve("devoir", d.id, sel).length ? `<div class="copierow" style="flex-direction:column;align-items:stretch">${copiesEleve("devoir", d.id, sel).map(x => `<div style="display:flex;gap:8px;align-items:center">${icon("edit")}<span style="flex:1">Copie de l'élève : <b>${esc(x.nom)}</b></span>${telephone() ? `<a href="#" data-act="wordtel" data-copie="${esc(x.id)}" data-devoir="${esc(d.id)}" class="btn sm">Ouvrir</a>` : `<a href="${esc(x.web)}" target="_blank" rel="noopener" class="btn ghost sm">Ouvrir</a>`}</div>`).join("")}</div>` : ""}
      ${vCP(d.id, sel)}`;
  }
  /* filtre (Tous / Remis / Attribués / Notés / À noter) et tri (statut, nom de famille, prénom), comme Classroom */
  const filtre = S.swFiltre || "tous", tri = S.swTri || "statut", lblA = ouvert(d) ? "Attribués" : "Manquants";
  const grp = e => { const s = etat(d, e.email); return s.t === "Noté" ? "notes" : s.r ? "remis" : "attribues"; };
  const passe = e => filtre === "tous" || (filtre === "anoter" ? grp(e) === "remis" : grp(e) === filtre);
  const vus = el.filter(passe), vide = `<p class="empty" style="padding:4px 16px">Aucun</p>`;
  let liste;
  if (tri === "statut") liste = [["remis", "Remis"], ["attribues", lblA], ["notes", "Notés"]].map(([g, t]) => { const l = vus.filter(e => grp(e) === g); return filtre !== "tous" && !l.length ? "" : `<h4>${t} (${l.length})</h4>${l.map(row).join("") || vide}`; }).join("");
  else { const cle = tri === "nom" ? e => cleNom(e.nom).nom + " " + cleNom(e.nom).prenom : e => cleNom(e.nom).prenom + " " + cleNom(e.nom).nom;
    liste = `<h4>${vus.length} élève${vus.length > 1 ? "s" : ""}</h4>${vus.slice().sort((a, b) => cle(a).localeCompare(cle(b), "fr")).map(row).join("") || vide}`; }
  const outils = `<div class="swtools">
      <select data-swf="1" aria-label="Filtrer les élèves">${[["tous", "Tous"], ["remis", "Remis"], ["attribues", lblA], ["notes", "Notés"]].map(([v, t]) => `<option value="${v}" ${filtre === v || (filtre === "anoter" && v === "remis") ? "selected" : ""}>${t}</option>`).join("")}</select>
      <select data-swt="1" aria-label="Trier les élèves">${[["nom", "Trier par nom de famille"], ["prenom", "Trier par prénom"], ["statut", "Trier par statut"]].map(([v, t]) => `<option value="${v}" ${tri === v ? "selected" : ""}>${t}</option>`).join("")}</select></div>`;
  return tabs + `<div class="page wide" style="--c:var(${k.c})">
    <div class="sw"><div class="list">${outils}<button class="st" data-act="sel" data-n="" aria-current="${!sel}"><span class="nm"><b>Tous les élèves</b></span></button>
      ${liste}</div>
    <div class="detail">${detail}</div></div>${pageFoot()}</div>`;
}

/* nom de famille / prénom : mot(s) en MAJUSCULES = nom de famille ; sinon le 1er mot est le prénom */
function cleNom(n){
  const w = String(n || "").trim().split(/\s+/).filter(Boolean), up = w.filter(x => x.length > 1 && x === x.toUpperCase() && /\p{L}/u.test(x));
  if (up.length && up.length < w.length) return { nom: up.join(" ").toLowerCase(), prenom: w.filter(x => !up.includes(x)).join(" ").toLowerCase() };
  return { prenom: (w[0] || "").toLowerCase(), nom: w.slice(1).join(" ").toLowerCase() };
}
/* ---------- à corriger d'un seul cours (onglet du cours, vue prof) ---------- */
function vCorrigerClasse(c){
  const ds = S.devoirs.filter(d => d.classe_id === c.id && !d.brouillon).slice().reverse();
  const tri = ds.filter(d => aCorriger(d) > 0).concat(ds.filter(d => !(aCorriger(d) > 0)));
  const total = ds.reduce((a, d) => a + aCorriger(d), 0);
  return `<div class="page" style="max-width:860px;--c:var(${C(c.couleur).c})">${ds.length ? `<section class="group"><header><span style="color:var(--c)">${total ? `${total} copie${total > 1 ? "s" : ""} à corriger` : "Tout est corrigé ✓"}</span><span class="muted mono">${ds.length} devoir${ds.length > 1 ? "s" : ""}</span></header>
      ${tri.map(d => `<div class="work"><a class="workrow" href="#/devoir/${d.id}" style="padding:12px 18px;gap:16px"><span class="ico">${icon("devoir", "")}</span><span class="tt">${esc(d.titre)}<br><small class="muted" style="font-weight:400">${dueOf(d)}</small></span>${statsDevoir(d, false)}</a></div>`).join("")}</section>`
    : `<div class="emptystate"><b>Aucun devoir dans ce cours pour l'instant.</b></div>`}${pageFoot()}</div>`;
}
/* ---------- à faire / à corriger ---------- */
function vTodo(){
  if (S.prof) {
    const parClasse = actives().map(c => ({c, ds:S.devoirs.filter(d => d.classe_id === c.id && !d.brouillon).slice().reverse()})).filter(x => x.ds.length);
    return `<div class="page"><h1 style="font-size:1.6rem">À corriger</h1>${parClasse.length ? `<div class="todo">${parClasse.map(({c, ds}) => `<section class="group" style="--c:var(${C(c.couleur).c})"><header><span style="color:var(--c)">${esc(c.nom)}</span><span class="muted mono">${ds.reduce((a, d) => a + aCorriger(d), 0)} à corriger</span></header>
      ${ds.map(d => `<div class="work"><a class="workrow" href="#/devoir/${d.id}" style="padding:12px 18px;gap:16px"><span class="ico">${icon("devoir", "")}</span><span class="tt">${esc(d.titre)}<br><small class="muted" style="font-weight:400">${dueOf(d)}</small></span>${statsDevoir(d, false)}</a></div>`).join("")}</section>`).join("")}</div>` : `<div class="emptystate"><b>Aucun devoir pour l'instant.</b></div>`}${pageFoot()}</div>`;
  }
  const q = S.quiz.filter(x => x.mode === "note" && cls(x.classe_id) && !cls(x.classe_id).archive);
  const dv = S.devoirs.filter(d => cls(d.classe_id) && !cls(d.classe_id).archive);
  /* 5e évaluation : « À faire » montre aussi les entraînements qui ont une date limite (comme l'accueil et la pastille), du plus urgent au moins urgent */
  const qEntr = S.quiz.filter(x => x.mode !== "note" && x.date_limite && D(x.date_limite) > now() && cls(x.classe_id) && !cls(x.classe_id).archive && !S.quizRes[x.id]);
  const lim = it => { const o = it.d || it.q; return o.date_limite ? +D(o.date_limite) : 9e15; };
  const groups = {
    attribues: [...dv.filter(d => etat(d, moi()).t === "Attribué").map(d => ({d})), ...q.filter(x => !resultatDe(x, S.user.id) && (!x.date_limite || D(x.date_limite) > now())).map(x => ({q:x})), ...qEntr.map(x => ({q:x}))].sort((a, b) => lim(a) - lim(b)),
    manquants: [...dv.filter(d => etat(d, moi()).t === "Manquant").map(d => ({d})), ...q.filter(x => !resultatDe(x, S.user.id) && x.date_limite && D(x.date_limite) <= now()).map(x => ({q:x}))],
    termines: [...dv.filter(d => ["Rendu", "Noté"].includes(etat(d, moi()).t)).map(d => ({d})), ...q.filter(x => resultatDe(x, S.user.id)).map(x => ({q:x}))]
  };
  const L = {attribues:"À faire", manquants:"En retard", termines:"Terminés"}, list = groups[S.todoTab];
  const ligne = it => { const o = it.d || it.q, c = cls(o.classe_id); let right;
    if (it.d) { const e = etat(o, moi()); right = e.t === "Noté" ? `<span class="mono nt" style="color:var(--ink)">${fmtNote(e.note)}/${o.points}</span>` : e.t === "Rendu" ? "Rendu" : dueOf(o).replace("Échéance : ", "") + (e.t === "Attribué" ? relEch(o.date_limite) : ""); }
    else { const r = resultatDe(o, S.user.id); right = r ? `<span class="mono nt" style="color:var(--ink)">${fmtNote(noteQuiz(o, r))}/${o.points}</span>` : o.date_limite ? dueTxt(D(o.date_limite)).replace("Échéance : ", "") + relEch(o.date_limite) : "Aucune date limite"; }
    return `<div class="work" style="--c:var(${C(c && c.couleur).c})"><a class="workrow" href="${it.d ? "#/devoir/" : "#/quiz/"}${o.id}" style="padding:12px 18px;gap:16px"><span class="ico">${icon(it.d ? "devoir" : "quiz", "")}</span><span class="tt">${esc(o.titre)}<br><small class="muted" style="font-weight:400">${esc(c ? c.nom : "")}</small></span><span class="dt">${right}</span></a></div>`; };
  return `<div class="tabsbar" style="--c:var(--accent)"><div class="tabs tabs3" role="tablist">${Object.keys(L).map(k => `<button role="tab" aria-selected="${S.todoTab === k}" data-act="todotab" data-t="${k}">${L[k]} <span class="muted mono">${groups[k].length}</span></button>`).join("")}</div></div>
  <div class="page" style="max-width:820px"><section class="group">${list.length ? list.map(ligne).join("") : `<p class="empty" style="padding:24px 18px;margin:0">${S.todoTab === "attribues" ? "Aucun travail à rendre pour le moment." : S.todoTab === "manquants" ? "Aucun travail en retard. Bravo !" : "Aucun travail terminé."}</p>`}</section>${pageFoot()}</div>`;
}

/* ---------- agenda ---------- */
function vAgenda(r){
  const filtre = r && r.a && cls(r.a) ? r.a : "";
  const t = now(), mon = new Date(t); mon.setHours(0, 0, 0, 0); mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7) + S.week * 7);
  const days = [...Array(7)].map((_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return d; });
  const evts = [...S.devoirs.filter(d => d.date_limite && !d.brouillon).map(d => ({d:D(d.date_limite), t:d.titre, c:cls(d.classe_id), href:"#/devoir/" + d.id})),
                ...S.quiz.filter(q => q.date_limite && !q.brouillon).map(q => ({d:D(q.date_limite), t:"Questionnaire · " + q.titre, c:cls(q.classe_id), href:"#/quiz/" + q.id}))].filter(e => e.c && !e.c.archive && (!filtre || e.c.id === filtre));
  return `<div class="page wide"><div class="weekbar"><button class="ib" data-act="week" data-w="-1" aria-label="Semaine précédente">${icon("left")}</button><button class="ib" data-act="week" data-w="1" aria-label="Semaine suivante">${icon("right")}</button>
    <h2>${mon.toLocaleDateString("fr-FR", {day:"numeric", month:"short"})} – ${days[6].toLocaleDateString("fr-FR", {day:"numeric", month:"short", year:"numeric"})}</h2>${S.week ? `<button class="btn ghost sm" data-act="week" data-w="0">Cette semaine</button>` : ""}<span class="spacer"></span>
    <select data-agenda="1" aria-label="Filtrer par cours" class="agsel"><option value="">Tous les cours</option>${actives().map(c => `<option value="${esc(c.id)}" ${c.id === filtre ? "selected" : ""}>${esc(c.nom)}</option>`).join("")}</select></div>
    <div style="overflow-x:auto"><div class="week">${days.map(d => `<div class="day"><div class="dh ${sameDay(d, t) ? "today" : ""}">${d.toLocaleDateString("fr-FR", {weekday:"short"})}<b>${d.getDate()}</b></div>
      ${evts.filter(e => sameDay(e.d, d)).sort((a, b) => a.d - b.d).map(e => `<a class="ev" style="--bb:var(${C(e.c.couleur).b})" href="${e.href}">${esc(e.t)}<small>${esc(e.c.nom)} · ${fmtT(e.d)}</small></a>`).join("")}</div>`).join("")}</div></div>${pageFoot()}</div>`;
}
function vOutils(){
  if (S.prof && S.outilsEdit) return `<div class="page"><div class="homehead"><h1 style="font-size:1.6rem">Modifier la boîte à outils</h1></div>${admOutils()}${pageFoot()}</div>`;
  return `<div class="page"><div class="homehead"><h1 style="font-size:1.6rem">Boîte à outils</h1>${S.prof ? `<button class="btn ghost sm" data-act="outilsedit">${icon("edit")} Modifier</button>` : ""}</div>${R().outils.map(g => `<section class="theme" style="--c:var(--${esc(g.couleur)})"><div class="themehead"><h2>${esc(g.matiere)}</h2></div>${g.liens.map(([n, d, u]) => `<div class="work"><a class="workrow" href="${esc(u)}" target="_blank" rel="noopener" style="padding:10px 8px;gap:16px"><span class="ico pale">${icon("links", "")}</span><span class="tt">${esc(n)}<br><small class="muted" style="font-weight:400">${esc(d)}</small></span><span class="muted">↗</span></a></div>`).join("")}</section>`).join("")}${pageFoot()}</div>`;
}
