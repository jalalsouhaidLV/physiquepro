/* ---------- notifications push sur téléphone + e-mail quand le prof rend une note (étape 37, 11/11/2026) ----------
   Élève : « Activer sur cet appareil » (Profil > Notifications) → abonnement Web Push rangé par pp_push_abonner.
   Prof : à chaque note rendue, la fonction Supabase « pp-push » prévient les appareils abonnés,
   et un e-mail part de la boîte Outlook du prof (Microsoft Graph, Mail.Send) aux élèves en copie cachée. */
const pushPossible = () => "serviceWorker" in navigator && "PushManager" in window && typeof Notification !== "undefined";
const estIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const siteInstalle = () => (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
const urlSite = () => location.origin + location.pathname.replace(/[^/]*$/, "");
function b64EnOctets(b){ const p = "=".repeat((4 - b.length % 4) % 4), s = atob((b + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from(s, c => c.charCodeAt(0)); }
async function abonnementPush(){ if (!pushPossible()) return null; try { const reg = await navigator.serviceWorker.getRegistration(); return reg ? await reg.pushManager.getSubscription() : null; } catch (_) { return null; } }
async function majEtatPush(){ const s = await abonnementPush(), on = !!s && notifOk(); if (on !== !!S.pushOn) { S.pushOn = on; if (location.hash.includes("/admin/profil")) render(); } }

async function activerPush(){
  if (!pushPossible()) return toast(estIOS() && !siteInstalle() ? "Sur iPhone : ajoute d'abord PhysiquePro à l'écran d'accueil, puis ouvre-le depuis l'icône." : "Ce navigateur ne gère pas les notifications push.");
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return toast("Notifications refusées. Autorise-les dans les réglages du téléphone ou du navigateur.");
  try {
    const reg = await navigator.serviceWorker.ready;
    const { data, error } = await sb.functions.invoke("pp-push", { body: { action: "cle" } });
    if (error || !data || !data.cle) throw new Error((error && error.message) || "clé introuvable");
    let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64EnOctets(data.cle) });
    const j = sub.toJSON();
    const { error: e2 } = await sb.rpc("pp_push_abonner", { p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth, p_appareil: (estIOS() ? "iPhone/iPad" : /Android/i.test(navigator.userAgent) ? "Android" : "Ordinateur") });
    if (e2) throw e2;
    S.pushOn = true; toast("Notifications activées sur cet appareil ✓"); render();
  } catch (e) { toast("Activation impossible : " + (e.message || e)); }
}
async function desactiverPush(){
  const sub = await abonnementPush();
  if (sub) { try { await sb.rpc("pp_push_desabonner", { p_endpoint: sub.endpoint }); } catch (_) {} try { await sub.unsubscribe(); } catch (_) {} }
  S.pushOn = false; toast("Notifications désactivées sur cet appareil"); render();
}

/* bloc de la page Profil */
function blocPush(){
  if (!S.prof) setTimeout(majEtatPush, 0);
  const etat = S.pushOn ? `<p class="muted" style="margin:0">${icon("bell")} Activées sur cet appareil.</p><div><button class="btn ghost sm" data-act="pushoff">Désactiver sur cet appareil</button></div>`
    : !pushPossible() && estIOS() && !siteInstalle() ? `<p class="muted" style="margin:0">Sur iPhone ou iPad (iOS 16.4 ou plus récent) : dans Safari, touche <b>Partager</b> puis <b>Sur l'écran d'accueil</b>. Ouvre ensuite PhysiquePro depuis cette nouvelle icône et reviens ici pour activer les notifications.</p>`
    : !pushPossible() ? `<p class="muted" style="margin:0">Ce navigateur ne gère pas les notifications push. Sur Android, utilise Chrome.</p>`
    : typeof Notification !== "undefined" && Notification.permission === "denied" ? `<p class="muted" style="margin:0">Les notifications sont bloquées pour ce site : autorise-les dans les réglages du téléphone ou du navigateur, puis reviens ici.</p>`
    : `<div><button class="btn sm" data-act="pushon">${icon("bell")} Activer les notifications sur cet appareil</button></div>`;
  return `${S.prof ? "" : `<h3 class="crsub">Sur ce téléphone ou cet ordinateur</h3>
      <p class="muted" style="margin:0">Reçois une notification sur cet appareil, même quand PhysiquePro est fermé, dès que ton professeur rend une note. À faire une fois sur chaque appareil.</p>
      ${etat}`}
      ${S.prof ? `<h3 class="crsub">Quand je rends une note</h3>
      <label class="switch crsw"><span>Envoyer aussi un e-mail à l'élève (depuis mon Outlook)</span><input type="checkbox" data-pref="mail_notes" ${prefs().mail_notes !== false ? "checked" : ""}><i aria-hidden="true"></i></label>
      <p class="muted" style="margin:0;font-size:.85rem">Les élèves qui ont activé les notifications sur leur téléphone (Profil &gt; Notifications) reçoivent aussi une notification push. La première fois, Microsoft demande d'autoriser l'envoi d'e-mails. <button class="linkbtn" data-act="mailauth">Autoriser maintenant</button></p>` : ""}`;
}

/* prof : prévenir les élèves dont la note vient d'être rendue (ne bloque pas l'écran) */
function prevenirEleves(renduIds){
  if (!S.prof || !renduIds || !renduIds.length) return;
  const parDevoir = new Map();
  renduIds.forEach(id => { const r = S.rendus.find(x => x.id === Number(id)); if (!r) return; const L = parDevoir.get(r.devoir_id) || new Set();
    [r.auteur_email, r.binome_email].filter(Boolean).forEach(e => L.add(String(e).toLowerCase())); parDevoir.set(r.devoir_id, L); });
  parDevoir.forEach((emails, did) => { const d = S.devoirs.find(x => x.id === did); if (d && emails.size) envoyerAvis(d, [...emails]); });
}
async function envoyerAvis(d, emails){
  const c = cls(d.classe_id), titre = d.titre || "ton travail", cours = c ? c.nom : "";
  const lien = urlSite() + "#/devoir/" + d.id;
  const res = [];
  try {
    const { data, error } = await sb.functions.invoke("pp-push", { body: { action: "envoyer", emails, titre: "Note disponible · " + titre, texte: (cours ? cours + " · " : "") + nomProfCourt() + " a rendu ton travail. Touche pour voir ta note.", url: "./#/devoir/" + d.id, tag: "note-" + d.id } });
    if (!error && data) res.push(data.eleves ? "notification envoyée à " + data.eleves + " élève" + (data.eleves > 1 ? "s" : "") : "aucun élève n'a activé les notifications");
  } catch (_) {}
  if (prefs().mail_notes !== false) {
    const corps = `<p>Bonjour,</p><p>${esc(R().prof.nom)} a rendu ton travail « <b>${esc(titre)}</b> »${cours ? " (" + esc(cours) + ")" : ""}.</p>
      <p>Ta note et les commentaires sont sur PhysiquePro : <a href="${esc(lien)}">ouvrir le travail</a>.</p><p style="color:#666;font-size:12px">E-mail envoyé automatiquement par PhysiquePro.</p>`;
    try {
      await graph("/me/sendMail", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: { subject: "PhysiquePro · Note disponible : " + titre, body: { contentType: "HTML", content: corps }, bccRecipients: emails.map(a => ({ emailAddress: { address: a } })) }, saveToSentItems: true }) }, true, ["Mail.Send"]);
      res.push("e-mail envoyé");
    } catch (e) { res.push("e-mail non envoyé (" + (e.message || e) + ")"); }
  }
  if (res.length) toast("« " + titre + " » : " + res.join(" · "));
}
async function autoriserMail(){ try { await jetonGraph(true, ["Mail.Send"]); toast("Envoi d'e-mails autorisé ✓"); } catch (e) { toast("Autorisation refusée : " + (e.message || e)); } }
