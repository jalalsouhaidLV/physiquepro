/* ---------- Message urgent (élève → prof) et Messagerie d'urgence (prof) ---------- */
IC.urgent = '<path d="M12 3l9.5 16.5h-19z"/><path d="M12 10v4.5M12 17.2v.1"/>';
/* nom du prof sans civilité (évite « M. M. SOUHAID » si le nom saisi commence déjà par M.) */
function nomProfSans(){ return String(R().prof.nom || "").replace(/^\s*(M\.|Mr\.?|Monsieur|Mme|Madame|Mlle)\s+/i, "").trim(); }
const nomProfCourt = () => { const w = nomProfSans().split(/\s+/); const up = w.filter(x => x.length > 1 && x === x.toUpperCase()); return "M.\u00a0" + (up.length ? up.join(" ") : w[w.length - 1] || ""); };
async function chargerUrgents(){
  try { const r = await sb.from("messages_urgents").select("*").order("cree_le", { ascending: false }).limit(300); S.urgents = r.error ? (S.urgents || []) : r.data; }
  catch (_) { S.urgents = S.urgents || []; }
  if (S.user) signalerNouveautes();
  const n = nbUrgents(), b = document.querySelector(".urgbtn .badge"), btn = document.querySelector(".urgbtn");
  if (btn) { if (b && !n) b.remove(); else if (b) b.textContent = n > 99 ? "99+" : n; else if (n) btn.insertAdjacentHTML("beforeend", `<span class="badge">${n > 99 ? "99+" : n}</span>`); }
}
const nbUrgents = () => S.prof ? (S.urgents || []).filter(m => !m.lu && !m.de_prof).length : 0;
/* icône de la barre du haut (prof) */
const boutonUrgences = () => S.prof ? `<a class="ib urgbtn" href="#/urgences" title="Messagerie d'urgence" aria-label="Messagerie d'urgence${nbUrgents() ? " (" + nbUrgents() + " non lus)" : ""}">${icon("urgent")}${nbUrgents() ? `<span class="badge">${nbUrgents() > 99 ? "99+" : nbUrgents()}</span>` : ""}</a>` : "";
/* onglet élève, à côté de « Mes notes » */
/* réponses du prof pas encore vues par l'élève (mémorisé sur son appareil) */
const cleVuUrg = () => "pp_urg_vu_" + (S.user && S.user.id);
const reponsesNonVues = cid => { if (S.prof) return 0; let vu = ""; try { vu = localStorage.getItem(cleVuUrg()) || ""; } catch (_) {}
  return (S.urgents || []).filter(m => (!cid || m.classe_id === cid) && ((m.de_prof && !m.lu) || (!m.de_prof && m.reponse && m.repondu_le && m.repondu_le > vu))).length; };
/* l'élève ouvre la fenêtre : les messages du prof de ce cours passent à « lu » */
async function marquerMessagesProfLus(cid){ const L = (S.urgents || []).filter(m => m.de_prof && !m.lu && m.classe_id === cid); if (!L.length) return; L.forEach(m => m.lu = true); try { await sb.rpc("pp_urgent_lu", { p_classe: cid }); } catch (_) {} }
const marquerReponsesVues = () => { const d = (S.urgents || []).map(m => m.repondu_le || "").sort().pop(); if (d) try { localStorage.setItem(cleVuUrg(), d); } catch (_) {} };
const supUrg = n => n ? `<sup class="urgsup" title="${n} nouvelle${n > 1 ? "s" : ""} réponse${n > 1 ? "s" : ""}">${n}</sup>` : "";
const ongletUrgent = c => { if (S.prof) return ""; const n = reponsesNonVues(c.id);
  return `<button role="tab" class="urgtab" data-act="urgent" data-c="${esc(c.id)}">${icon("urgent")}<span class="tl">Message urgent à ${esc(nomProfCourt())}${supUrg(n)}</span><span class="tc">Urgent${supUrg(n)}</span></button>`; };
function modalUrgent(m){
  const mes = (S.urgents || []).filter(x => x.classe_id === m.classe).slice(0, 5);
  return `<h2>${icon("urgent")} Message urgent à ${esc(nomProfCourt())}</h2>
    <p class="muted" style="margin:0;font-size:.88rem">Pour une question importante sur ce cours (absence le jour d'un devoir, problème pour rendre un travail…). ${esc(nomProfCourt())} reçoit ton message sur le site et te répond ici.</p>
    ${bandeauNotifs()}
    <div class="field"><label for="mUrg">Ton message</label><textarea id="mUrg" rows="5" maxlength="2000" placeholder="Écris ton message…" style="width:100%;resize:vertical">${esc(m.texte || "")}</textarea></div>
    ${mes.length ? `<div class="urgmine"><b style="font-size:.85rem">Tes derniers messages dans ce cours</b>${mes.map(x => x.de_prof ? `<div class="urgold deprof"><div><small class="muted">${fmtQuand(D(x.cree_le))} · <b>Message de ${esc(nomProfCourt())}</b></small><p>${linkify(x.texte)}</p></div></div>` : `<div class="urgold"><div><small class="muted">${fmtQuand(D(x.cree_le))} · ${x.reponse ? "Répondu" : x.lu ? "Lu par ton professeur" : "Envoyé"}</small><p>${linkify(x.texte)}</p></div>${x.reponse ? `<div class="urgrep"><small><b>Réponse de ${esc(nomProfCourt())}</b> · ${fmtQuand(D(x.repondu_le))}</small><p>${linkify(x.reponse)}</p></div>` : ""}</div>`).join("")}</div>` : ""}`;
}
async function envoyerUrgent(m){
  const t = ((document.getElementById("mUrg") || {}).value || "").trim();
  if (!t) throw new Error("Écris ton message avant d'envoyer.");
  const nom = S.nom || nomDepuisEmail(moi());
  const { data, error } = await sb.from("messages_urgents").insert({ classe_id: m.classe, eleve: S.user.id, eleve_email: moi(), eleve_nom: nom, texte: t }).select().single();
  if (error) throw error;
  S.urgents = [data, ...(S.urgents || [])];
}
/* page prof */
function vUrgences(){
  const L = S.urgents || [], filtre = S.urgF || "tous";
  const vus = L.filter(m => filtre === "tous" || (filtre === "nonlus" ? !m.lu && !m.de_prof : filtre === "envoyes" ? m.de_prof : filtre === "recus" ? !m.de_prof : m.classe_id === filtre));
  const carte = m => { const c = cls(m.classe_id);
    if (m.de_prof) return `<article class="urgcard envoye" style="--c:var(${C(c && c.couleur).c})">
      <header>${avatarP(R().prof.nom, "sm")}<div style="flex:1;min-width:0"><b>Envoyé à ${esc(m.eleve_nom || nomDepuisEmail(m.eleve_email))}</b><small class="muted">${esc(c ? c.nom : "Cours supprimé")} · ${fmtD(D(m.cree_le))} à ${fmtT(D(m.cree_le))}</small></div><span class="pill ${m.lu ? "ok" : ""}">${m.lu ? "Lu par l'élève" : "Pas encore lu"}</span></header>
      <p class="urgtxt">${linkify(m.texte)}</p>
      <div class="urgactions"><button class="btn ghost sm" data-act="urgecrire" data-c="${esc(m.classe_id)}" data-e="${esc(m.eleve)}">${icon("send")} Écrire à nouveau</button><button class="ib sm" data-act="urgsuppr" data-id="${m.id}" title="Supprimer" aria-label="Supprimer le message">${icon("trash")}</button></div></article>`;
    return `<article class="urgcard${m.lu ? "" : " nonlu"}" style="--c:var(${C(c && c.couleur).c})">
      <header>${avatarP(m.eleve_nom || m.eleve_email, "sm")}<div style="flex:1;min-width:0"><b>${esc(m.eleve_nom || nomDepuisEmail(m.eleve_email))}</b><small class="muted">${esc(c ? c.nom : "Cours supprimé")} · ${fmtD(D(m.cree_le))} à ${fmtT(D(m.cree_le))}</small></div>${m.lu ? "" : `<span class="pill bad">Non lu</span>`}</header>
      <p class="urgtxt">${linkify(m.texte)}</p>
      ${m.reponse ? `<div class="urgrep"><small><b>Ta réponse</b> · ${fmtQuand(D(m.repondu_le))}</small><p>${linkify(m.reponse)}</p></div>` : ""}
      ${S.urgRep === m.id ? `<div class="field"><textarea id="urgRep${m.id}" rows="3" placeholder="Ta réponse (l'élève la voit dans sa fenêtre « Message urgent »)" style="width:100%">${esc(m.reponse || "")}</textarea></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" data-act="urgsend" data-id="${m.id}">${icon("send")} Envoyer la réponse</button><button class="btn ghost sm" data-act="urgrep" data-id="">Annuler</button></div>`
      : `<div class="urgactions"><button class="btn tonal sm" data-act="urgrep" data-id="${m.id}">${icon("comment")} ${m.reponse ? "Modifier la réponse" : "Répondre"}</button>
        ${m.lu ? `<button class="btn ghost sm" data-act="urglu" data-id="${m.id}" data-on="0">Marquer non lu</button>` : `<button class="btn ghost sm" data-act="urglu" data-id="${m.id}" data-on="1">${icon("check")} Marquer comme lu</button>`}
        <a class="btn ghost sm" href="mailto:${esc(m.eleve_email)}?subject=${encodeURIComponent("Re : message urgent · " + (c ? c.nom : ""))}">${icon("mail")} E-mail</a>
        <button class="ib sm" data-act="urgsuppr" data-id="${m.id}" title="Supprimer" aria-label="Supprimer le message">${icon("trash")}</button></div>`}
    </article>`; };
  const nRec = L.filter(m => !m.de_prof).length, nEnv = L.filter(m => m.de_prof).length;
  return `<div class="page"><div class="homehead"><h1 style="font-size:1.6rem">${icon("urgent")} Messagerie d'urgence</h1>
      <span style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button class="btn danger" data-act="urgecrire">${icon("send")} Écrire à un élève</button>
      <select data-urgf="1" aria-label="Filtrer les messages"><option value="tous">Tous les messages (${L.length})</option><option value="nonlus" ${filtre === "nonlus" ? "selected" : ""}>Non lus (${nbUrgents()})</option><option value="recus" ${filtre === "recus" ? "selected" : ""}>Reçus des élèves (${nRec})</option><option value="envoyes" ${filtre === "envoyes" ? "selected" : ""}>Envoyés aux élèves (${nEnv})</option>${S.classes.map(c => `<option value="${esc(c.id)}" ${filtre === c.id ? "selected" : ""}>${esc(c.nom)}</option>`).join("")}</select></span></div>
    ${bandeauNotifs()}
    <p class="muted" style="margin:0">Les messages urgents de tes élèves et ceux que tu leur envoies. Un élève qui reçoit ton message voit une grande alerte au centre de son écran, sur n'importe quelle page du site.</p>
    ${vus.length ? `<div class="urglist">${vus.map(carte).join("")}</div>` : `<div class="emptystate"><b>Aucun message${filtre === "nonlus" ? " non lu" : ""}.</b><span>Quand un élève t'écrit, son message apparaît ici et « Messagerie d'urgence » affiche un chiffre rouge dans le menu de gauche.</span></div>`}
    ${pageFoot()}</div>`;
}
/* fenêtre « Écrire à un élève » */
function modalUrgProf(m){
  const act = actives(), cid = m.classe || (act[0] && act[0].id), comptes = new Map((S.comptes || []).map(p => [p.email, p]));
  const el = inscritsDe(cid).map(e => ({ ...e, p: comptes.get(e.email) })), avec = el.filter(e => e.p), sans = el.filter(e => !e.p);
  return `<h2>${icon("urgent")} Message d'urgence à un élève</h2>
    <div class="two"><div class="field"><label for="upCours">Cours</label><select id="upCours" data-urgc="1">${act.map(c => `<option value="${esc(c.id)}" ${c.id === cid ? "selected" : ""}>${esc(c.nom)}</option>`).join("")}</select></div>
      <div class="field"><label for="upEleve">Élève</label><select id="upEleve">${avec.length ? avec.map(e => `<option value="${esc(e.p.id)}" ${m.eleve === e.p.id ? "selected" : ""}>${esc(e.nom)}</option>`).join("") : `<option value="">Aucun élève connecté dans ce cours</option>`}</select></div></div>
    ${sans.length ? `<p class="muted" style="margin:0;font-size:.8rem">${sans.length} élève${sans.length > 1 ? "s" : ""} de ce cours ne ${sans.length > 1 ? "se sont" : "s'est"} jamais connecté${sans.length > 1 ? "s" : ""} au site : ${sans.length > 1 ? "ils" : "il"} ne peu${sans.length > 1 ? "vent" : "t"} pas encore recevoir de message.</p>` : ""}
    <div class="field"><label for="upTexte">Ton message</label><textarea id="upTexte" rows="5" maxlength="2000" style="width:100%;resize:vertical" placeholder="ex. Passe me voir à la récréation pour ton TP.">${esc(m.texte || "")}</textarea></div>
    <p class="muted" style="margin:0;font-size:.82rem">L'élève voit une grande alerte « MESSAGE D'URGENCE REÇU » au centre de son écran dès qu'il est sur le site. S'il a activé les notifications (Profil &gt; Notifications), il reçoit aussi une notification sur son téléphone, même site fermé.</p>`;
}
async function envoyerUrgProf(){
  const v = id => ((document.getElementById(id) || {}).value || "").trim();
  const cid = v("upCours"), uid = v("upEleve"), t = v("upTexte");
  if (!uid) throw new Error("Choisis un élève."); if (!t) throw new Error("Écris ton message.");
  const p = (S.comptes || []).find(x => x.id === uid), e = inscritsDe(cid).find(x => x.email === (p && p.email));
  const { data, error } = await sb.from("messages_urgents").insert({ classe_id: cid, eleve: uid, eleve_email: p.email, eleve_nom: (e && e.nom) || p.nom || nomDepuisEmail(p.email), texte: t, de_prof: true }).select().single();
  if (error) throw error;
  S.urgents = [data, ...(S.urgents || [])]; signalerNouveautes();
  const c = cls(cid), avis = await pousserUrgent([p.email], "⚠ Message d'urgence de " + nomProfCourt(), (c ? c.nom + " · " : "") + t, cid, "urg-" + data.id);
  return ((e && e.nom) || p.email) + avis;
}
/* notification push sur le téléphone de l'élève (fonction Supabase pp-push), même site fermé ; renvoie un complément pour le message de confirmation */
async function pousserUrgent(emails, titre, texte, cid, tag){
  try {
    const { data, error } = await sb.functions.invoke("pp-push", { body: { action: "envoyer", emails: emails.map(x => String(x).toLowerCase()), titre, texte: String(texte).slice(0, 180), url: "./#/classe/" + cid, tag } });
    if (error || !data) return " (notification sur le téléphone non envoyée)";
    return data.eleves ? " · notification envoyée sur son téléphone" : " · l'élève n'a pas activé les notifications sur son téléphone : il verra l'alerte en ouvrant le site";
  } catch (_) { return " (notification sur le téléphone non envoyée)"; }
}

async function actionUrgence(act, a){
  const m = (S.urgents || []).find(x => String(x.id) === a.dataset.id);
  if (act === "urgrep") { S.urgRep = m ? m.id : null; render(); return; }
  if (!m) return;
  if (act === "urglu") { const on = a.dataset.on === "1"; const { error } = await sb.from("messages_urgents").update({ lu: on }).eq("id", m.id); if (error) return toast("Action impossible : " + error.message); m.lu = on; render(); return; }
  if (act === "urgsend") { const t = ((document.getElementById("urgRep" + m.id) || {}).value || "").trim(); if (!t) return toast("Écris ta réponse.");
    const patch = { reponse: t, repondu_le: now().toISOString(), lu: true }; const { error } = await sb.from("messages_urgents").update(patch).eq("id", m.id); if (error) return toast("Envoi impossible : " + error.message);
    Object.assign(m, patch); S.urgRep = null; render();
    const c = cls(m.classe_id), avis = await pousserUrgent([m.eleve_email], "Réponse de " + nomProfCourt(), (c ? c.nom + " · " : "") + t, m.classe_id, "urgrep-" + m.id);
    toast("Réponse envoyée à " + (m.eleve_nom || m.eleve_email) + avis); return; }
  if (act === "urgsuppr") { const { error } = await sb.from("messages_urgents").delete().eq("id", m.id); if (error) return toast("Suppression impossible : " + error.message); S.urgents = S.urgents.filter(x => x !== m); toast("Message supprimé"); render(); return; }
}

/* ---------- notifications sur l'ordinateur (site ouvert, même en arrière-plan) ---------- */
const notifOk = () => typeof Notification !== "undefined" && Notification.permission === "granted";
const notifPossible = () => typeof Notification !== "undefined" && Notification.permission !== "denied";
const cleNotif = () => "pp_urg_notif_" + (S.user && S.user.id);
function clesUrgentes(){ return S.prof ? (S.urgents || []).filter(m => !m.lu && !m.de_prof).map(m => "m" + m.id)
  : [...(S.urgents || []).filter(m => !m.de_prof && m.reponse && m.repondu_le).map(m => "r" + m.id + "@" + m.repondu_le), ...(S.urgents || []).filter(m => m.de_prof).map(m => "p" + m.id)]; }
/* son : le navigateur n'autorise le son qu'après un premier clic sur la page → on « déverrouille » au premier clic */
let audioCtx = null;
const ouvrirAudio = () => { try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === "suspended") audioCtx.resume(); } catch (_) {} };
["pointerdown", "keydown"].forEach(ev => document.addEventListener(ev, ouvrirAudio, { capture: true, passive: true }));
function bip(){ try { ouvrirAudio(); const A = audioCtx; if (!A) return; const t = A.currentTime + .05;
  [[880, 0], [1320, .18], [880, .5], [1320, .68]].forEach(([f, d]) => { const o = A.createOscillator(), g = A.createGain(); o.frequency.value = f; o.type = "sine"; g.gain.setValueAtTime(.0001, t + d); g.gain.exponentialRampToValueAtTime(.35, t + d + .02); g.gain.exponentialRampToValueAtTime(.0001, t + d + .15); o.connect(g).connect(A.destination); o.start(t + d); o.stop(t + d + .16); });
  } catch (_) {} }
/* grande alerte au centre de l'écran (taille d'un paquet de cartes), sur n'importe quelle page du site */
function bandeauAlerte(titre, texte, ouvrir, qui, cours, entete){
  let ov = document.getElementById("urgCentre");
  if (!ov) { ov = document.createElement("div"); ov.id = "urgCentre"; ov.innerHTML = `<div class="ucbox" role="alertdialog" aria-modal="true" aria-labelledby="ucT"><div class="uchead">${icon("urgent")}<b id="ucT"></b></div><div class="ucbody"></div><div class="ucfoot"><button class="btn ghost" data-uc="fermer">Fermer</button><button class="btn danger" data-uc="ouvrir">Ouvrir</button></div></div>`; document.body.appendChild(ov);
    ov.addEventListener("click", e => { const b = e.target.closest("[data-uc]"); if (!b && e.target !== ov) return; const L = ov._file || []; ov.remove(); if (b && b.dataset.uc === "ouvrir" && L.length) L[L.length - 1].ouvrir(); }); }
  ov._file = [...(ov._file || []), { ouvrir }];
  ov.querySelector("#ucT").textContent = entete || (S.prof ? "MESSAGE D'URGENCE REÇU" : "RÉPONSE AU MESSAGE D'URGENCE REÇUE");
  const n = ov._file.length;
  ov.querySelector(".ucbody").innerHTML = `<p class="ucqui">${esc(qui)}</p>${cours ? `<p class="uccours">${esc(cours)}</p>` : ""}<p class="uctxt">${esc(texte.slice(0, 220))}</p>${n > 1 ? `<p class="ucplus">+ ${n - 1} autre${n > 2 ? "s" : ""} message${n > 2 ? "s" : ""}</p>` : ""}`;
  setTimeout(() => { const b = ov.querySelector('[data-uc="ouvrir"]'); if (b) b.focus(); }, 50);
}
/* titre de l'onglet qui clignote tant qu'on n'est pas revenu sur le site */
let clignoT = null;
function clignoter(msg){ clearInterval(clignoT); let on = false; const base = () => document.title.replace(/^⚠ .*? · /, "");
  clignoT = setInterval(() => { if (document.visibilityState === "visible" && document.hasFocus()) { clearInterval(clignoT); document.title = base(); titreAvecCompteur(); return; } on = !on; document.title = on ? "⚠ " + msg + " · " + base() : base(); }, 1000); }
function notifier(titre, texte, ouvrir){
  bip(); clignoter(S.prof ? "Message urgent" : "Réponse reçue"); bandeauAlerte(titre, arguments[5] || texte, ouvrir, arguments[3] || titre, arguments[4] || "", arguments[6]);
  if (!notifOk()) return;
  try { const n = new Notification(titre, { body: texte.slice(0, 180), icon: "icon-192.png", tag: "pp-urgent-" + Date.now(), requireInteraction: true });
    n.onclick = () => { window.focus(); ouvrir(); n.close(); }; } catch (_) {}
}
/* compare avec ce qui a déjà été signalé sur cet appareil ; la première fois, on mémorise sans sonner */
function signalerNouveautes(){
  let vus = null; try { vus = JSON.parse(localStorage.getItem(cleNotif()) || "null"); } catch (_) {}
  const cles = clesUrgentes();
  if (vus) {
    const nouv = cles.filter(k => !vus.includes(k));
    nouv.forEach(k => {
      const id = Number(k.slice(1).split("@")[0]), m = (S.urgents || []).find(x => x.id === id); if (!m) return;
      const c = cls(m.classe_id);
      if (S.prof) notifier("⚠ Message urgent · " + (m.eleve_nom || m.eleve_email), (c ? c.nom + " · " : "") + m.texte, () => go("/urgences"), "De : " + (m.eleve_nom || m.eleve_email), c ? c.nom : "", m.texte);
      else if (m.de_prof) notifier("Message d'urgence de " + nomProfCourt(), (c ? c.nom + " · " : "") + m.texte, () => { go("/classe/" + m.classe_id); setTimeout(() => { S.modal = { kind: "urgent", classe: m.classe_id }; marquerReponsesVues(); marquerMessagesProfLus(m.classe_id); render(); }, 400); }, "De : " + nomProfCourt(), c ? c.nom : "", m.texte, "MESSAGE D'URGENCE REÇU");
      else notifier("Réponse de " + nomProfCourt(), (c ? c.nom + " · " : "") + m.reponse, () => { go("/classe/" + m.classe_id); setTimeout(() => { S.modal = { kind: "urgent", classe: m.classe_id }; marquerReponsesVues(); render(); }, 400); }, "De : " + nomProfCourt(), c ? c.nom : "", m.reponse);
    });
    if (nouv.length && !S.modal && !S.ed && !(document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))) render();
  }
  try { localStorage.setItem(cleNotif(), JSON.stringify([...new Set([...(vus || []), ...cles])].slice(-400))); } catch (_) {}
  titreAvecCompteur();
}
const compteurUrgent = () => S.prof ? nbUrgents() : reponsesNonVues();
function titreAvecCompteur(){ const n = compteurUrgent(), t = document.title.replace(/^\(\d+\) /, ""); document.title = n ? "(" + n + ") " + t : t; }
async function demanderNotifs(){
  if (typeof Notification === "undefined") return toast("Ce navigateur ne gère pas les notifications.");
  const p = await Notification.requestPermission();
  if (p === "granted") { toast("Notifications activées sur cet ordinateur ✓"); notifier("PhysiquePro", S.prof ? "Tu seras prévenu ici à chaque message urgent d'un élève." : "Tu seras prévenu ici quand " + nomProfCourt() + " répond à ton message.", () => {}); }
  else toast("Notifications refusées. Tu peux les autoriser plus tard dans les réglages du navigateur (cadenas à gauche de l'adresse).");
  render();
}
const bandeauNotifs = () => notifOk() ? `<p class="muted" style="margin:0;font-size:.82rem">${icon("bell")} Notifications activées sur cet ordinateur : ${S.prof ? "tu es prévenu à chaque nouveau message" : "tu es prévenu quand ton professeur répond"}, tant que le site est ouvert dans un onglet.</p>`
  : notifPossible() ? `<div class="notifbar">${icon("bell")}<span>${S.prof ? "Sois prévenu sur cet ordinateur dès qu'un élève t'envoie un message urgent." : "Sois prévenu sur cet ordinateur dès que ton professeur te répond."}</span><button class="btn sm" data-act="notifon">Activer les notifications</button></div>`
  : `<p class="muted" style="margin:0;font-size:.82rem">${icon("bell")} Les notifications sont bloquées pour ce site : autorise-les dans les réglages du navigateur (cadenas à gauche de l'adresse).</p>`;
