/* ---------- OneDrive (Microsoft Graph) : documents rangés par classe, thème et activité ---------- */
const OD_RACINE = "ONEDRIVE SITE PHYSIQUEPRO";
const MSAL_CFG = { auth: { clientId: "f52213ef-d098-49cc-ac22-944c23bcab61", authority: "https://login.microsoftonline.com/4bd4c77d-938d-4bd2-99ae-3ca7e4de49e6",
  redirectUri: location.origin + location.pathname.replace(/[^/]*$/, "") + "auth.html" }, cache: { cacheLocation: "localStorage" } };
let msalApp = null;
const odActif = () => S.prof && !!(R().onedrive);
async function msalInit(){
  if (msalApp) return msalApp;
  /* lot R (5e évaluation) : la bibliothèque Microsoft se charge sans retarder l'ouverture du site (async) ; on l'attend ici au besoin */
  for (let i = 0; !window.msal && i < 100; i++) await new Promise(ok => setTimeout(ok, 100));
  if (!window.msal) throw new Error("la bibliothèque Microsoft n'a pas pu être chargée");
  msalApp = new window.msal.PublicClientApplication(MSAL_CFG); await msalApp.initialize(); return msalApp;
}
const SCOPES_COPIE = ["Files.ReadWrite", "Files.Read.All"];
async function jetonGraph(interactif, scopes){
  const app = await msalInit(), req = { scopes: scopes || ["Files.ReadWrite"], loginHint: moi() };
  const compte = app.getAllAccounts().find(a => (a.username || "").toLowerCase() === moi());
  try {
    if (compte) return (await app.acquireTokenSilent({ ...req, account: compte })).accessToken;
    return (await app.ssoSilent(req)).accessToken;
  } catch (e) {
    if (!interactif) throw e;
    return (await app.acquireTokenPopup(req)).accessToken;
  }
}
async function graph(chemin, opt = {}, interactif = true, scopes){
  const t = await jetonGraph(interactif, scopes);
  const r = await fetch(chemin.startsWith("http") ? chemin : "https://graph.microsoft.com/v1.0" + chemin, { ...opt, headers: { Authorization: "Bearer " + t, ...(opt.headers || {}) } });
  if (!r.ok) { let m = r.status + ""; try { const j = await r.json(); m = (j.error && j.error.message) || m; } catch (_) {} const er = new Error(m); er.status = r.status; throw er; }
  return r.status === 204 ? null : r.json();
}
const nomOD = s => String(s || "").replace(/[\\/:*?"<>|#%]+/g, " ").replace(/\s+/g, " ").trim().replace(/^\.+|\.+$/g, "").slice(0, 120) || "Sans titre";
const cheminOD = parts => parts.map(nomOD).map(encodeURIComponent).join("/");
/* envoie un fichier dans le OneDrive du prof et renvoie {id, web, partage} */
async function odPut(ch, fichier, scopes){
  let item;
  if (!fichier || typeof fichier.size !== "number") throw new Error("fichier illisible, ajoute-le à nouveau");
  if (fichier.size <= 4 * 1024 * 1024) item = await graph("/me/drive/root:/" + ch + ":/content?@microsoft.graph.conflictBehavior=rename", { method: "PUT", body: fichier }, true, scopes);
  else {
    const ses = await graph("/me/drive/root:/" + ch + ":/createUploadSession", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ item: { "@microsoft.graph.conflictBehavior": "rename" } }) }, true, scopes);
    const pas = 320 * 1024 * 16;
    for (let deb = 0; deb < fichier.size; deb += pas) {
      const fin = Math.min(deb + pas, fichier.size), r = await fetch(ses.uploadUrl, { method: "PUT", headers: { "Content-Range": `bytes ${deb}-${fin - 1}/${fichier.size}` }, body: fichier.slice(deb, fin) });
      if (!r.ok && r.status !== 202) throw new Error("envoi interrompu (" + r.status + ")");
      if (fin === fichier.size) { try { item = await r.json(); } catch (_) { item = null; } }
    }
  }
  /* réponse incomplète de Microsoft : on relit le fichier par son chemin */
  if (!item || !item.id) {
    await new Promise(ok => setTimeout(ok, 1500));
    item = await graph("/me/drive/root:/" + ch, {}, true, scopes);
  }
  if (!item || !item.id) throw new Error("OneDrive n'a pas confirmé l'envoi du fichier");
  return item;
}
async function odEnvoyer(parts, fichier){
  const item = await odPut(cheminOD([OD_RACINE, ...parts]), fichier);
  const lien = await graph("/me/drive/items/" + item.id + "/createLink", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "view", scope: "organization" }) });
  return { id: item.id, web: item.webUrl, partage: lien.link.webUrl, nom: item.name };
}
const ressourceOD = (r, label) => ({ type: extType(r.nom), label: label || r.nom, url: r.partage, od: { id: r.id, web: r.web } });
/* dossier d'un travail : classe / thème / titre */
function dossierTravail(classeId, themeId, titre){
  const c = cls(classeId), data = S.cache[classeId] || { themes: [] }, th = data.themes.find(t => String(t.id) === String(themeId));
  return [c ? c.nom : classeId, th ? th.titre : "Sans thème", titre || "Sans titre"];
}

/* connexion OneDrive (consentement une seule fois) */
async function connecterOneDrive(){
  try {
    await jetonGraph(true);
    const me = await graph("/me/drive/root:/" + encodeURIComponent(OD_RACINE));
    S.odOk = true; toast("OneDrive connecté : dossier « " + me.name + " » trouvé"); return true;
  } catch (e) {
    S.odOk = false;
    toast(/AADSTS65001|consent|admin/i.test(e.message || "") ? "Microsoft demande l'accord d'un administrateur du lycée pour OneDrive." : "Connexion OneDrive impossible : " + (e.message || e));
    return false;
  }
}

/* envoi des fichiers en attente de l'éditeur, au moment d'enregistrer */
async function envoyerEnAttente(e){
  e.ressources = e.ressources.filter(x => !x.pending || x.pending instanceof Blob);
  const att = e.ressources.filter(x => x.pending); if (!att.length) return;
  const parts = dossierTravail(e.classe_id, e.theme_id, e.titre.trim());
  for (const x of att) {
    toast("Envoi dans OneDrive : « " + x.label + " »…");
    let r;
    try { r = await odEnvoyer([...parts, x.pending.name], x.pending); }
    catch (er) { console.error("Envoi OneDrive, nouvel essai", er); await new Promise(ok => setTimeout(ok, 2000)); r = await odEnvoyer([...parts, x.pending.name], x.pending); }
    const i = e.ressources.indexOf(x); e.ressources[i] = ressourceOD(r, x.label);
  }
}

/* copie des travaux rendus dans le OneDrive du prof : …/Titre/Travaux rendus/Élève - fichier */
async function syncRendus(d, silencieux){
  if (!odActif()) return 0;
  const rendus = rendusDe(d).filter(r => (r.fichiers || []).length); if (!rendus.length) return 0;
  const parts = [...dossierTravail(d.classe_id, d.theme_id, d.titre), "Travaux rendus"];
  let deja = new Set();
  try { const l = await graph("/me/drive/root:/" + cheminOD([OD_RACINE, ...parts]) + ":/children?$select=name&$top=999", {}, !silencieux); (l.value || []).forEach(x => deja.add(x.name)); } catch (_) {}
  let n = 0;
  for (const r of rendus) for (const f of r.fichiers) {
    if (!f.chemin) continue;
    const nom = nomOD(nomDe(d.classe_id, r.auteur_email) + " - " + f.nom);
    if (deja.has(nom)) continue;
    const { data } = await sb.storage.from("rendus").createSignedUrl(f.chemin, 600); if (!data) continue;
    const blob = await (await fetch(data.signedUrl)).blob();
    await odEnvoyer([...parts, nom], blob); n++;
  }
  return n;
}

/* rangement des documents déjà présents dans PhysiquePro vers OneDrive */
async function migrerVersOneDrive(maj){
  await chargerFichiers(true);
  const sups = (S.fich && S.fich.supports) || [], ann = (S.fich && S.fich.annonces) || [];
  const lots = [
    ...S.devoirs.map(d => ({ table: "devoirs", o: d, parts: dossierTravail(d.classe_id, d.theme_id, d.titre) })),
    ...sups.map(s => ({ table: "supports", o: s, parts: dossierTravail(s.classe_id, s.theme_id, s.titre) })),
    ...ann.map(a => ({ table: "annonces", o: a, parts: [(cls(a.classe_id) || {}).nom || a.classe_id, "Annonces"] }))
  ].filter(x => (x.o.ressources || []).some(r => r.path));
  let n = 0, err = 0;
  for (const lot of lots) {
    for (const c of S.classes) if (!S.cache[c.id]) await chargerClasse(c.id);
    const res = [];
    for (const r of lot.o.ressources) {
      if (!r.path) { res.push(r); continue; }
      try { const { data } = await sb.storage.from("documents").createSignedUrl(r.path, 600); const blob = await (await fetch(data.signedUrl)).blob();
        const nom = r.label || r.path.split("/").pop().replace(/^\d+-/, ""); const o = await odEnvoyer([...lot.parts, nom], blob); res.push(ressourceOD(o, r.label)); n++; maj(n); }
      catch (e) { res.push(r); err++; }
    }
    await sb.from(lot.table).update({ ressources: res }).eq("id", lot.o.id);
  }
  return { n, err };
}

/* vignette d'un fichier OneDrive (aperçu de la 1re page, comme dans Classroom) — prof uniquement, sans fenêtre */
const vignEnCours = new Set();
let vignErreur = false;
function vignetteOD(id){
  const k = "od:" + id;
  if (MINI[k] || vignEnCours.has(id) || vignErreur || !odActif()) return;
  try { const c = JSON.parse(localStorage.getItem("pp_vign") || "{}"); if (c[id] && c[id].t > Date.now() - 3e6) { MINI[k] = c[id].u; return; } } catch (_) {}
  vignEnCours.add(id);
  graph("/me/drive/items/" + encodeURIComponent(id) + "/thumbnails?select=medium", {}, false).then(j => {
    const u = j && j.value && j.value[0] && j.value[0].medium && j.value[0].medium.url;
    if (!u) { setTimeout(() => vignEnCours.delete(id), 120000); return; }
    MINI[k] = u;
    try { const c = JSON.parse(localStorage.getItem("pp_vign") || "{}"); c[id] = { u, t: Date.now() }; const ks = Object.keys(c); if (ks.length > 400) ks.slice(0, 100).forEach(x => delete c[x]); localStorage.setItem("pp_vign", JSON.stringify(c)); } catch (_) {}
    clearTimeout(vignetteOD.t); vignetteOD.t = setTimeout(render, 150);
  }).catch(e => { setTimeout(() => vignEnCours.delete(id), 120000); if (/interaction|login|consent|popup|InteractionRequired/i.test(String(e && (e.errorCode || e.message) || e))) vignErreur = true; });
}

/* ---------- élève : copie modifiable d'un document Word / Excel / PowerPoint dans SON OneDrive ---------- */
const b64u = t => btoa(unescape(encodeURIComponent(t))).replace(/=+$/, "").replace(/\//g, "_").replace(/\+/g, "-");
const cleCopies = () => "pp_copies_" + (S.user ? S.user.id : "");
function copiesDe(devoir){ if (!devoir) return []; try { return (JSON.parse(localStorage.getItem(cleCopies()) || "{}")[devoir] || []); } catch (_) { return []; } }
function memoCopie(ctx, item, nom){
  if (!ctx.devoir) return;
  try { const all = JSON.parse(localStorage.getItem(cleCopies()) || "{}"), l = (all[ctx.devoir] || []).filter(x => x.id !== item.id);
    l.push({ id: item.id, nom, web: item.webUrl }); all[ctx.devoir] = l; localStorage.setItem(cleCopies(), JSON.stringify(all)); } catch (_) {}
}
function attente(win, txt){
  try { win.document.title = "PhysiquePro"; win.document.body.innerHTML = `<div style="font:16px Roboto,system-ui,sans-serif;color:#1F1F1F;display:grid;place-items:center;min-height:90vh;text-align:center"><div><div style="width:34px;height:34px;border:3px solid #C2E7FF;border-top-color:#116482;border-radius:50%;margin:0 auto 14px;animation:t 1s linear infinite"></div>${txt}</div></div><style>@keyframes t{to{transform:rotate(360deg)}}</style>`; } catch (_) {}
}
async function ouvrirCopie(r, ctx, win){
  const nom = nomOD(r.label || (r.path || "").split("/").pop().replace(/^\d+-/, ""));
  const c = ctx.classe ? cls(ctx.classe) : null, ch = cheminOD(["PhysiquePro", c ? c.nom : "Documents", nom]);
  let item = null;
  try { item = await graph("/me/drive/root:/" + ch, {}, false, SCOPES_COPIE); } catch (e) { if (e.status !== 404) throw e; }
  if (!item) {
    attente(win, "Création de ta copie de « " + esc(nom) + " »…");
    let blob;
    if (r.path) { const { data, error } = await sb.storage.from(r.bucket || "documents").createSignedUrl(r.path, 600); if (error) throw error; blob = await (await fetch(data.signedUrl)).blob(); }
    else {
      const it = await graph("/shares/u!" + b64u(r.url) + "/driveItem", { headers: { Prefer: "redeemSharingLinkIfNecessary" } }, false, SCOPES_COPIE);
      const url = it["@microsoft.graph.downloadUrl"]; if (!url) throw new Error("document introuvable");
      const res = await fetch(url); if (!res.ok) throw new Error("lecture du document impossible (" + res.status + ")"); blob = await res.blob();
    }
    item = await odPut(ch, blob, SCOPES_COPIE);
  }
  memoCopie(ctx, item, nom);
  win.location.href = item.webUrl;
  if (ctx.devoir && route().v === "devoir") render();
}
async function copieOffice(a){
  const r = JSON.parse(a.dataset.r || "{}"), ctx = JSON.parse(a.dataset.ctx || "{}");
  const win = window.open("", "_blank");
  if (!win) { toast("Autorise les fenêtres (pop-up) pour ce site, puis réessaie."); return; }
  attente(win, "Ouverture de ta copie…");
  try { await jetonGraph(false, SCOPES_COPIE); }
  catch (e) { win.close(); S.modal = { kind: "copieauth", r, ctx }; render(); return; }
  try { await ouvrirCopie(r, ctx, win); }
  catch (e) { win.close(); toast("Copie impossible : " + (e.message || e)); }
}
/* première fois : l'élève autorise PhysiquePro à utiliser son OneDrive (clic direct = fenêtre Microsoft autorisée) */
async function copieAutoriser(){
  const m = S.modal; if (!m) return;
  try { await jetonGraph(true, SCOPES_COPIE); } catch (e) { toast("Autorisation OneDrive refusée ou impossible."); return; }
  S.modal = null; render();
  const win = window.open("", "_blank"); if (!win) { toast("Autorise les fenêtres (pop-up) pour ce site, puis réessaie."); return; }
  attente(win, "Ouverture de ta copie…");
  try { await ouvrirCopie(m.r, m.ctx, win); } catch (e) { win.close(); toast("Copie impossible : " + (e.message || e)); }
}
async function joindreCopie(id, nom){
  try {
    toast("Ajout de ta copie…");
    const it = await graph("/me/drive/items/" + encodeURIComponent(id), {}, true, SCOPES_COPIE), url = it["@microsoft.graph.downloadUrl"];
    const blob = await (await fetch(url)).blob();
    S.files.push(new File([blob], nom, { type: blob.type || "application/octet-stream" })); render(); toast("« " + nom + " » ajouté à ton travail");
  } catch (e) { toast("Impossible de joindre la copie : " + (e.message || e)); }
}

/* ---------- copies modifiables créées par le professeur pour chaque élève (comme Classroom) ---------- */
const copiesEleve = (objet, id, email) => (S.copies || []).filter(x => x.objet === objet && String(x.objet_id) === String(id) && x.eleve_email === email);
function copieDe(r, ctx){
  if (!r.od || !r.od.id) return null;
  return (S.copies || []).find(x => x.source === r.od.id && x.eleve_email === moi() && (ctx.devoir ? x.objet === "devoir" && String(x.objet_id) === String(ctx.devoir) : ctx.support ? x.objet === "support" && String(x.objet_id) === String(ctx.support) : true)) || null;
}
/* adresse directe du fichier (…/Documents/…/x.docx) : sert à l'ouvrir dans l'appli Word du téléphone (ms-word:ofe|u|…) et à le télécharger */
async function adresseFichier(id){
  try {
    const it = await graph("/me/drive/items/" + encodeURIComponent(id) + "?$select=name,webUrl,webDavUrl,parentReference", {}, false);
    if (it.webDavUrl) return it.webDavUrl;
    const base = String(it.webUrl || "").split("/_layouts/")[0], ch = String((it.parentReference || {}).path || "").replace(/^\/drive\/root:/, "");
    let dec = ch; try { dec = decodeURIComponent(ch); } catch (_) {}
    return base && it.name ? base + "/Documents" + encodeURI(dec + "/" + it.name).replace(/#/g, "%23") : null;
  } catch (_) { return null; }
}
/* copies des élèves : un élève qui a le droit d'écrire peut créer un lien « Tout le monde » (email « anonymous access link »).
   Toutes les 6 h, le navigateur du prof retire ces liens et complète l'adresse directe des copies. */
async function entretienCopies(force){
  let dernier = 0; try { dernier = Number(localStorage.getItem("pp_conf_copies") || 0); } catch (_) {}
  if (!force && Date.now() - dernier < 6 * 3600e3) return 0;
  let n = 0; const limite = Date.now() - 200 * 864e5;
  for (const x of S.copies || []) {
    if (!x.od_id || (x.cree_le && D(x.cree_le) < limite)) continue;
    try {
      for (const p of await permsOD(x.od_id)) if (p.link && !p.inheritedFrom) { await suppPermOD(x.od_id, p); n++; }
      if (!x.fichier) { const f = await adresseFichier(x.od_id); if (f) { const { error } = await sb.from("copies").update({ fichier: f }).eq("id", x.id); if (!error) x.fichier = f; } }
    } catch (e) { console.warn("entretien copie", e); }
  }
  try { localStorage.setItem("pp_conf_copies", String(Date.now())); } catch (_) {}
  return n;
}
let copiesEnCours = false;
async function genererCopies(silencieux){
  if (!S.prof || !odActif() || copiesEnCours) return;
  copiesEnCours = true;
  try {
    const visible = o => !o.brouillon && D(o.publie_le) <= now();
    const office = o => (o.ressources || []).filter(r => r.od && r.od.id && appOffice(r.label || ""));
    const lots = [];
    for (const d of S.devoirs) if (visible(d) && d.type !== "question" && office(d).length) lots.push({ objet: "devoir", o: d });
    for (const c of actives()) { const data = await chargerClasse(c.id); (data.supports || []).forEach(sp => { if (visible(sp) && office(sp).length) lots.push({ objet: "support", o: sp }); }); }
    const faits = new Set((S.copies || []).map(x => x.objet + ":" + x.objet_id + ":" + x.source + ":" + x.eleve_email));
    const taches = [];
    for (const l of lots) {
      const el = elevesDuDevoir(l.o, inscritsDe(l.o.classe_id));
      for (const r of office(l.o)) for (const e of el) if (!faits.has(l.objet + ":" + l.o.id + ":" + r.od.id + ":" + e.email)) taches.push({ ...l, r, e });
    }
    if (!taches.length) return;
    await jetonGraph(!silencieux);
    const cache = {};
    let n = 0;
    for (const t of taches) {
      try {
        if (!cache[t.r.od.id]) { const it = await graph("/me/drive/items/" + encodeURIComponent(t.r.od.id), {}, false); cache[t.r.od.id] = await (await fetch(it["@microsoft.graph.downloadUrl"])).blob(); }
        const nom = nomOD(t.r.label || "document"), nomE = nomOD(t.e.nom || nomDepuisEmail(t.e.email));
        const item = await odPut(cheminOD([OD_RACINE, ...dossierTravail(t.o.classe_id, t.o.theme_id, t.o.titre), "Copies élèves", nomE + " - " + nom]), cache[t.r.od.id]);
        await graph("/me/drive/items/" + item.id + "/invite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipients: [{ email: t.e.email }], roles: ["write"], requireSignIn: true, sendInvitation: false }) }, false);
        const row = { classe_id: t.o.classe_id, objet: t.objet, objet_id: t.o.id, source: t.r.od.id, eleve_email: t.e.email, nom, od_id: item.id, web: item.webUrl, fichier: await adresseFichier(item.id) };
        const { data, error } = await sb.from("copies").insert(row).select().single(); if (error) throw error;
        S.copies.push(data); n++;
        if (n === 1 || n % 5 === 0) toast("Copies modifiables pour les élèves : " + n + " / " + taches.length);
      } catch (e) { console.warn("copie élève", e); if (/42P01|copies/.test(e.message || "")) break; }
    }
    if (n) toast(n + " copie" + (n > 1 ? "s modifiables créées" : " modifiable créée") + " pour les élèves");
  } catch (e) { if (!silencieux) toast("Copies élèves : " + (e.message || e)); }
  finally { copiesEnCours = false; }
}

/* ---------- travaux rendus : déplacés dans le OneDrive du prof, puis supprimés du stockage PhysiquePro (1 Go) ---------- */
let transfertEnCours = false;
async function transfererRendus(silencieux){
  if (!S.prof || !odActif() || transfertEnCours) return;
  const aFaire = S.rendus.filter(r => (r.fichiers || []).some(f => f.chemin));
  if (!aFaire.length) return;
  transfertEnCours = true; let n = 0;
  try {
    await jetonGraph(!silencieux);
    for (const r of aFaire) {
      const d = S.devoirs.find(x => x.id === r.devoir_id); if (!d) continue;
      if (!S.cache[d.classe_id]) await chargerClasse(d.classe_id);
      const parts = [...dossierTravail(d.classe_id, d.theme_id, d.titre), "Travaux rendus"], fichiers = [], aSupprimer = [];
      let change = false;
      for (const f of r.fichiers || []) {
        if (!f.chemin) { fichiers.push(f); continue; }
        try {
          const { data } = await sb.storage.from("rendus").createSignedUrl(f.chemin, 600); if (!data) throw new Error("introuvable");
          const blob = await (await fetch(data.signedUrl)).blob();
          const item = await odPut(cheminOD([OD_RACINE, ...parts, nomOD(nomDe(d.classe_id, r.auteur_email) + " - " + f.nom)]), blob);
          const dest = [r.auteur_email, r.binome_email].filter(Boolean).map(email => ({ email }));
          await graph("/me/drive/items/" + item.id + "/invite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipients: dest, roles: ["read"], requireSignIn: true, sendInvitation: false }) }, false);
          fichiers.push({ nom: f.nom, taille: f.taille, od: { id: item.id, web: item.webUrl } }); aSupprimer.push(f.chemin); change = true; n++;
        } catch (e) { console.warn("transfert rendu", e); fichiers.push(f); }
      }
      if (!change) continue;
      const { error } = await sb.from("rendus").update({ fichiers }).eq("id", r.id);
      if (error) { console.warn("maj rendu", error); if (/policy|row-level/i.test(error.message)) break; continue; }
      r.fichiers = fichiers;
      await sb.storage.from("rendus").remove(aSupprimer);
    }
    if (n && !silencieux) toast(n + " fichier" + (n > 1 ? "s rendus rangés" : " rendu rangé") + " dans OneDrive");
  } catch (e) { if (!silencieux) toast("Transfert des rendus : " + (e.message || e)); }
  finally { transfertEnCours = false; }
}

/* ---------- confidentialité OneDrive ----------
   1) Les dossiers (classe, thèmes, activités) ne sont jamais partagés avec les élèves ni avec tout le lycée :
      un élève n'accède qu'aux fichiers publiés pour lui, par les liens du site.
   2) Les fichiers d'un élément en BROUILLON n'ont aucun lien de partage ; le lien est (re)créé à la publication. */
let confEnCours = false;
const permsOD = async id => ((await graph("/me/drive/items/" + encodeURIComponent(id) + "/permissions", {}, false)) || {}).value || [];
const suppPermOD = (id, p) => graph("/me/drive/items/" + encodeURIComponent(id) + "/permissions/" + encodeURIComponent(p.id), { method: "DELETE" }, false);
const emailsDe = p => [p.grantedToV2, ...(p.grantedToIdentitiesV2 || [])].filter(Boolean).map(g => ((g.user || g.siteUser || {}).email || "").toLowerCase()).filter(Boolean);
async function dossiersPrives(eleves){
  let n = 0;
  const racine = await graph("/me/drive/root:/" + encodeURIComponent(OD_RACINE), {}, false);
  const pile = [racine.id];
  while (pile.length) {
    const id = pile.shift();
    for (const p of await permsOD(id)) {
      if (p.inheritedFrom || (p.roles || []).includes("owner")) continue;
      const large = p.link && ["organization", "anonymous"].includes(p.link.scope);
      const versEleve = emailsDe(p).some(e => eleves.has(e));
      if (large || versEleve) { try { await suppPermOD(id, p); n++; } catch (e) { console.warn("partage dossier", e); } }
    }
    let url = "/me/drive/items/" + encodeURIComponent(id) + "/children?$select=id,name,folder&$top=200";
    while (url) { const j = await graph(url, {}, false); (j.value || []).forEach(x => { if (x.folder) pile.push(x.id); }); url = j["@odata.nextLink"] || null; }
  }
  return n;
}
async function fichiersBrouillons(){
  let fermes = 0, ouverts = 0;
  const lots = S.devoirs.map(o => ({ table: "devoirs", o }));
  for (const c of S.classes) { const data = await chargerClasse(c.id); (data.supports || []).forEach(o => lots.push({ table: "supports", o })); }
  for (const { table, o } of lots) {
    const res = o.ressources || []; if (!res.some(r => r.od && r.od.id)) continue;
    let change = false;
    for (const r of res) {
      if (!r.od || !r.od.id) continue;
      try {
        if (o.brouillon && !r.prive) {
          for (const p of await permsOD(r.od.id)) if (p.link && !p.inheritedFrom) await suppPermOD(r.od.id, p);
          r.prive = true; r.url = r.od.web || r.url; change = true; fermes++;
        } else if (!o.brouillon && r.prive) {
          const lien = await graph("/me/drive/items/" + encodeURIComponent(r.od.id) + "/createLink", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "view", scope: "organization" }) }, false);
          r.url = lien.link.webUrl; delete r.prive; change = true; ouverts++;
        }
      } catch (e) { console.warn("partage fichier", r.label, e); }
    }
    if (change) { const { error } = await sb.from(table).update({ ressources: res }).eq("id", o.id); if (error) console.warn("maj ressources", error); }
  }
  return { fermes, ouverts };
}
async function synchroPartages(silencieux, dossiers){
  if (!S.prof || !odActif() || confEnCours) return;
  confEnCours = true;
  try {
    await jetonGraph(!silencieux);
    const f = await fichiersBrouillons();
    let nd = 0, dernier = 0;
    try { dernier = Number(localStorage.getItem("pp_conf_dossiers") || 0); } catch (_) {}
    if (dossiers || Date.now() - dernier > 12 * 3600e3) {
      const el = new Set((S.toutesInscriptions || []).map(x => String(x.email).toLowerCase()));
      nd = await dossiersPrives(el);
      try { localStorage.setItem("pp_conf_dossiers", String(Date.now())); } catch (_) {}
    }
    const nl = await entretienCopies(dossiers);
    if (f.fermes || f.ouverts) S.cache = {};
    if (!silencieux || nd || nl || f.fermes || f.ouverts) toast([nl ? nl + " lien" + (nl > 1 ? "s" : "") + " de partage retiré" + (nl > 1 ? "s" : "") + " des copies élèves" : "", nd ? nd + " partage" + (nd > 1 ? "s" : "") + " de dossier retiré" + (nd > 1 ? "s" : "") : "", f.fermes ? f.fermes + " fichier" + (f.fermes > 1 ? "s" : "") + " de brouillon rendu" + (f.fermes > 1 ? "s" : "") + " privé" + (f.fermes > 1 ? "s" : "") : "", f.ouverts ? f.ouverts + " fichier" + (f.ouverts > 1 ? "s" : "") + " publié" + (f.ouverts > 1 ? "s" : "") + " pour les élèves" : ""].filter(Boolean).join(" · ") || "OneDrive : dossiers et brouillons déjà privés ✓");
  } catch (e) { if (!silencieux) toast("Confidentialité OneDrive : " + (e.message || e)); }
  finally { confEnCours = false; }
}

/* ---------- dossiers de classe : un dossier par cours, au nom actuel du cours ----------
   Renomme, fusionne les doublons (ex. « Terminale spé PC » + « Terminale spé PC 26-27 »), met à jour les adresses
   des fichiers, le lien du dossier dans les paramètres du cours, puis revérifie que rien n'est partagé. */
const NOMS_INITIAUX = { tle: "Terminale spé PC", "1re": "1re spé PC", snt: "SNT", si: "Option SI", "3e": "Technologie 3e", pix: "PIX" };
async function enfantsOD(id){
  const out = []; let url = "/me/drive/items/" + encodeURIComponent(id) + "/children?$select=id,name,folder,file,webUrl&$top=200";
  while (url) { const j = await graph(url, {}, false); out.push(...(j.value || [])); url = j["@odata.nextLink"] || null; }
  return out;
}
const patchOD = (id, corps) => graph("/me/drive/items/" + encodeURIComponent(id) + "?@microsoft.graph.conflictBehavior=rename", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps) }, false);
async function fusionnerOD(srcId, dstId){
  const dst = new Map((await enfantsOD(dstId)).map(x => [x.name.toLowerCase(), x]));
  for (const x of await enfantsOD(srcId)) {
    const y = dst.get(x.name.toLowerCase());
    if (y && x.folder && y.folder) { await fusionnerOD(x.id, y.id); await supprimerSiVide(x.id); }
    else await patchOD(x.id, { parentReference: { id: dstId } });
  }
}
/* un dossier vide part dans la corbeille OneDrive (récupérable) ; un dossier non vide n'est jamais supprimé */
async function supprimerSiVide(id){ if (!(await enfantsOD(id)).length) await graph("/me/drive/items/" + encodeURIComponent(id), { method: "DELETE" }, false); }
let rangerEnCours = false;
async function rangerDossiersClasses(anciens = {}){
  if (!S.prof || !odActif() || rangerEnCours) return;
  rangerEnCours = true; const bilan = { renommes: 0, fusionnes: 0, liens: 0, autres: [] };
  try {
    await jetonGraph(true);
    const racine = await graph("/me/drive/root:/" + encodeURIComponent(OD_RACINE), {}, false);
    let top = (await enfantsOD(racine.id)).filter(x => x.folder);
    const parId = new Map(top.map(x => [x.id, x])), parNom = n => top.find(x => x.name.toLowerCase() === nomOD(n).toLowerCase());
    /* 1. à quel cours appartient chaque dossier ? d'après l'emplacement des fichiers de ce cours, puis d'après le nom */
    const objets = S.devoirs.map(o => ({ table: "devoirs", o }));
    for (const c of S.classes) { const data = await chargerClasse(c.id); (data.supports || []).forEach(o => objets.push({ table: "supports", o })); }
    const dossiersDe = {}, votes = {}; S.classes.forEach(c => dossiersDe[c.id] = new Set());
    for (const { o } of objets) {
      const r = (o.ressources || []).find(x => x.od && x.od.id); if (!r || !dossiersDe[o.classe_id]) continue;
      try { const it = await graph("/me/drive/items/" + encodeURIComponent(r.od.id) + "?$select=id,parentReference", {}, false);
        const seg = decodeURIComponent((it.parentReference && it.parentReference.path) || "").split(":/")[1] || "", parts = seg.split("/");
        if (parts[0] === OD_RACINE && parts[1]) { const f = parNom(parts[1]); if (f) { const v = votes[f.id] = votes[f.id] || {}; v[o.classe_id] = (v[o.classe_id] || 0) + 1; } } } catch (_) {}
    }
    /* un dossier appartient au cours qui y a le plus de fichiers */
    for (const [fid, v] of Object.entries(votes)) { const cid = Object.keys(v).sort((a, b) => v[b] - v[a])[0]; dossiersDe[cid].add(fid); }
    const pris = new Set(Object.values(dossiersDe).flatMap(s => [...s]));
    for (const c of S.classes) for (const n of [c.nom, anciens[c.id], NOMS_INITIAUX[c.id]].filter(Boolean)) { const f = parNom(n); if (f && !pris.has(f.id)) { dossiersDe[c.id].add(f.id); pris.add(f.id); } }
    /* 2. un seul dossier par cours, au nom actuel du cours */
    for (const c of S.classes) {
      const ids = [...dossiersDe[c.id]]; if (!ids.length) continue;
      const cible = ids.find(id => parId.get(id).name.toLowerCase() === nomOD(c.nom).toLowerCase()) || ids[0];
      for (const id of ids) if (id !== cible) { await fusionnerOD(id, cible); await supprimerSiVide(id); bilan.fusionnes++; }
      let f = parId.get(cible);
      if (f.name !== nomOD(c.nom)) { f = await patchOD(cible, { name: nomOD(c.nom) }); bilan.renommes++; }
      const web = (await graph("/me/drive/items/" + encodeURIComponent(cible) + "?$select=webUrl", {}, false)).webUrl;
      if (web && c.dossier_onedrive !== web) { const { error } = await sb.from("classes").update({ dossier_onedrive: web }).eq("id", c.id); if (!error) { c.dossier_onedrive = web; bilan.liens++; } }
    }
    top = (await enfantsOD(racine.id)).filter(x => x.folder);
    bilan.autres = top.filter(x => !S.classes.some(c => nomOD(c.nom).toLowerCase() === x.name.toLowerCase())).map(x => x.name);
    /* 3. adresses des fichiers déplacés (documents, copies des élèves, travaux rendus) */
    const webDe = async id => { try { return (await graph("/me/drive/items/" + encodeURIComponent(id) + "?$select=webUrl", {}, false)).webUrl; } catch (_) { return null; } };
    for (const { table, o } of objets) {
      let ch = false; for (const r of o.ressources || []) if (r.od && r.od.id) { const w = await webDe(r.od.id); if (w && w !== r.od.web) { if (r.prive || r.url === r.od.web) r.url = w; r.od.web = w; ch = true; } }
      if (ch) await sb.from(table).update({ ressources: o.ressources }).eq("id", o.id);
    }
    for (const x of S.copies || []) { const w = await webDe(x.od_id); if (w && w !== x.web) { const f = await adresseFichier(x.od_id); await sb.from("copies").update({ web: w, fichier: f }).eq("id", x.id); x.web = w; x.fichier = f; } }
    for (const r of S.rendus) { let ch = false; const fs = (r.fichiers || []).map(f => ({ ...f })); for (const f of fs) if (f.od && f.od.id) { const w = await webDe(f.od.id); if (w && w !== f.od.web) { f.od = { ...f.od, web: w }; ch = true; } }
      if (ch) { const { error } = await sb.from("rendus").update({ fichiers: fs }).eq("id", r.id); if (!error) r.fichiers = fs; } }
    /* 4. confidentialité : aucun dossier partagé */
    const el = new Set((S.toutesInscriptions || []).map(x => String(x.email).toLowerCase()));
    const nd = await dossiersPrives(el); try { localStorage.setItem("pp_conf_dossiers", String(Date.now())); } catch (_) {}
    S.cache = {}; await rafraichir();
    toast(`Dossiers OneDrive rangés : ${bilan.renommes} renommé(s), ${bilan.fusionnes} doublon(s) fusionné(s)${nd ? ", " + nd + " partage(s) retiré(s)" : ""}${bilan.autres.length ? " · hors cours : " + bilan.autres.join(", ") : ""}`);
    return bilan;
  } catch (e) { toast("Rangement OneDrive : " + (e.message || e)); }
  finally { rangerEnCours = false; render(); }
}

/* ---------- cours supprimé : son dossier OneDrive part dans la corbeille (récupérable 93 jours) ---------- */
async function supprimerDossierCours(nom){
  await jetonGraph(true);
  try { const it = await graph("/me/drive/root:/" + cheminOD([OD_RACINE, nom]), {}, false); await graph("/me/drive/items/" + encodeURIComponent(it.id), { method: "DELETE" }, false); return true; }
  catch (e) { if (e.status === 404) return false; throw e; }
}
/* dossiers restés pour des cours déjà supprimés (aucun cours, même archivé, ne porte ce nom) */
async function dossiersOrphelins(){
  await jetonGraph(true);
  const racine = await graph("/me/drive/root:/" + encodeURIComponent(OD_RACINE), {}, false);
  const noms = new Set(S.classes.map(c => nomOD(c.nom).toLowerCase()));
  return (await enfantsOD(racine.id)).filter(x => x.folder && !noms.has(x.name.toLowerCase()));
}
