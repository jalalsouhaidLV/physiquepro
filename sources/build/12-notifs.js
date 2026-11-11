/* ---------- notifications (cloche) et page Profil ---------- */
/* côté élève, on tutoie (lot T de la 6e évaluation) */
const NOTIF_TU = { coms: "Commentaires ajoutés à tes messages", mention: "Commentaires où l'on te mentionne" };
const NOTIF_DEF = {
  coms: [["coms", "Commentaires ajoutés à vos posts"], ["mention", "Commentaires dans lesquels vous êtes mentionné"], ["prives", "Commentaires privés sur les devoirs"]],
  prof: [["rendus", "Nouveaux envois de devoirs d'élèves"], ["manquants", "Devoirs non rendus à la date limite"], ["programmes", "Publication d'un post programmé"]],
  eleve: [["travaux", "Nouveaux devoirs, questions, questionnaires et documents"], ["notes", "Notes et travaux rendus par le professeur"], ["annonces", "Nouvelles annonces dans le flux"], ["echeances", "Travaux à rendre dans les 24 heures"]]
};
const prefs = () => (S.profil && S.profil.prefs) || {};
const notifOn = k => prefs().bell !== false && prefs()[k] !== false;
const coursOn = cid => !cid || !(prefs().cours_off || []).includes(cid);
const vuLe = () => S.profil && S.profil.vu_le ? D(S.profil.vu_le) : new Date(now() - 7 * 864e5);
/* lecture d'une seule notification : ses clés sont gardées dans prefs.lus (synchronisé entre appareils) */
const cleNotifLue = x => x.k + "|" + x.href + "|" + (+x.date);
const notifsLues = () => Array.isArray(prefs().lus) ? prefs().lus : [];
const estNouvelle = x => (x.k === "echeances" || x.date > vuLe()) && !notifsLues().includes(cleNotifLue(x));
async function marquerNotifsLues(cles, garderAnciennes){
  if (!S.profil) return;
  const vu = +vuLe(), anciennes = garderAnciennes === false ? [] : notifsLues().filter(c => !cles.includes(c) && (c.startsWith("echeances|") || +c.split("|").pop() > vu - 864e5));
  S.profil.prefs = { ...prefs(), lus: [...anciennes, ...cles].slice(-200) };
  S.nbNotifs = (S.notifs || []).filter(estNouvelle).length; majCloche();
  const { error } = await sb.rpc("pp_prefs", { p: S.profil.prefs });
  if (error) toast("Notification non marquée comme lue : " + error.message);
}
function progListe(){ try { return JSON.parse(localStorage.getItem("pp_prog") || "[]"); } catch (_) { return []; } }
function progAjoute(k, id){ try { const l = progListe().filter(x => x !== k + ":" + id); l.push(k + ":" + id); localStorage.setItem("pp_prog", JSON.stringify(l.slice(-50))); } catch (_) {} }

async function chargerNotifs(){
  if (!S.profil) return;
  const vu = vuLe(), depuis = new Date(Math.max(+vu, now() - 30 * 864e5)).toISOString(), moiId = S.user.id;
  const prenom = sansAccent((S.nom || "").split(/\s+/)[0]);
  const reqs = [
    sb.from("commentaires").select("id, annonce_id, auteur, auteur_nom, texte, cree_le, annonces(classe_id, auteur)").gt("cree_le", depuis).order("cree_le", { ascending: false }).limit(60),
    sb.from("commentaires_prives").select("id, devoir_id, eleve_email, auteur, auteur_nom, texte, cree_le").gt("cree_le", depuis).order("cree_le", { ascending: false }).limit(60)
  ];
  if (S.prof) reqs.push(sb.from("rendus").select("id, devoir_id, auteur_email, rendu_le").gt("rendu_le", depuis).order("rendu_le", { ascending: false }).limit(80));
  else reqs.push(sb.from("annonces").select("id, classe_id, auteur, auteur_nom, cree_le, publie_le").gt("publie_le", depuis).limit(40), sb.from("supports").select("id, classe_id, titre, publie_le").gt("publie_le", depuis).limit(40));
  reqs.push(sb.from("commentaires_devoirs").select("id, devoir_id, auteur, auteur_nom, texte, cree_le").gt("cree_le", depuis).order("cree_le", { ascending: false }).limit(60));
  const res = await Promise.all(reqs.map(p => Promise.resolve(p).catch(() => ({ data: [] }))));
  const [co, cp] = res.map(r => (r && !r.error && r.data) || []);
  const L = [], add = (k, date, titre, href, cid) => { if (notifOn(k) && coursOn(cid)) L.push({ k, date, titre, href, cid }); };
  const dv = id => S.devoirs.find(d => d.id === id) || {};
  co.filter(x => x.auteur !== moiId).forEach(x => { const a = x.annonces || {}, cid = a.classe_id, mention = prenom.length > 2 && sansAccent(x.texte).includes(prenom);
    if (mention) add("mention", D(x.cree_le), esc(x.auteur_nom) + (S.prof ? " vous a mentionné dans un commentaire" : " t'a mentionné dans un commentaire"), "#/classe/" + cid + "/flux", cid);
    else if (S.prof || a.auteur === moiId) add("coms", D(x.cree_le), esc(x.auteur_nom) + " a commenté " + (S.prof ? "une annonce" : "ton message"), "#/classe/" + cid + "/flux", cid); });
  { const cd = (res[res.length - 1] && !res[res.length - 1].error && res[res.length - 1].data) || [];
    cd.filter(x => x.auteur !== moiId).forEach(x => { const d = dv(x.devoir_id), mention = prenom.length > 2 && sansAccent(x.texte).includes(prenom);
      if (S.prof || mention || x.auteur_nom === R().prof.nom) add("coms", D(x.cree_le), esc(x.auteur_nom) + " a commenté « " + esc(d.titre || "un devoir") + " »", "#/devoir/" + x.devoir_id, d.classe_id); }); }
  cp.filter(x => x.auteur !== moiId).forEach(x => { const d = dv(x.devoir_id); add("prives", D(x.cree_le), esc(x.auteur_nom) + " : commentaire privé sur « " + esc(d.titre || "un devoir") + " »", "#/devoir/" + x.devoir_id, d.classe_id); });
  if (S.prof) {
    ((res[2] && res[2].data) || []).forEach(x => { const d = dv(x.devoir_id); add("rendus", D(x.rendu_le), esc(nomDe(d.classe_id, x.auteur_email)) + (d.type === "question" ? " a répondu à « " : " a rendu « ") + esc(d.titre || "") + " »", "#/devoir/" + x.devoir_id, d.classe_id); });
    S.devoirs.filter(d => !d.brouillon && d.date_limite && D(d.date_limite) > vu && D(d.date_limite) <= now()).forEach(d => {
      const el = elevesDuDevoir(d, inscritsDe(d.classe_id)), n = el.filter(e => !renduDe(d, e.email)).length;
      if (n) add("manquants", D(d.date_limite), n + " élève" + (n > 1 ? "s n'ont" : " n'a") + " pas rendu « " + esc(d.titre) + " »", "#/devoir/" + d.id, d.classe_id); });
    const prog = progListe(), restants = [];
    prog.forEach(key => { const [k, id] = key.split(":"), o = k === "quiz" ? S.quiz.find(q => String(q.id) === id) : S.devoirs.find(d => String(d.id) === id);
      if (o && !o.brouillon && D(o.publie_le) <= now()) add("programmes", D(o.publie_le), "Post programmé publié : « " + esc(o.titre) + " »", (k === "quiz" ? "#/quiz/" : "#/devoir/") + o.id, o.classe_id);
      else if (o || k === "support") restants.push(key); });
  } else {
    const nouveaux = [...S.devoirs.map(d => ({ o: d, h: "#/devoir/" + d.id, l: d.type === "question" ? "Nouvelle question" : "Nouveau devoir" })), ...S.quiz.map(q => ({ o: q, h: "#/quiz/" + q.id, l: "Nouveau questionnaire" })),
      ...((res[3] && res[3].data) || []).map(s => ({ o: s, h: "#/classe/" + s.classe_id + "/travaux", l: "Nouveau document" }))];
    nouveaux.filter(x => D(x.o.publie_le) > vu && D(x.o.publie_le) <= now()).forEach(x => add("travaux", D(x.o.publie_le), x.l + " : « " + esc(x.o.titre) + " »", x.h, x.o.classe_id));
    S.corrections.filter(c => c.publiee && c.modifie_le && D(c.modifie_le) > vu).forEach(c => { const r = S.rendus.find(x => x.id === c.rendu_id), d = r && dv(r.devoir_id);
      if (d && d.id) add("notes", D(c.modifie_le), (c.note != null ? "Note reçue" : "Correction reçue") + " : « " + esc(d.titre) + " »" + (c.note != null ? " · " + fmtNote(c.note) + "/" + d.points : ""), "#/devoir/" + d.id, d.classe_id); });
    ((res[2] && res[2].data) || []).filter(a => a.auteur !== moiId).filter(a => D(a.publie_le || a.cree_le) <= now()).forEach(a => add("annonces", D(a.publie_le || a.cree_le), esc(a.auteur_nom) + " a publié une annonce", "#/classe/" + a.classe_id + "/flux", a.classe_id));
    S.devoirs.filter(d => d.date_limite && D(d.date_limite) > now() && D(d.date_limite) - now() < 864e5 && etat(d, moi()).t === "Attribué").forEach(d => add("echeances", D(d.date_limite), "À rendre " + dueTxt(D(d.date_limite)).toLowerCase() + " : « " + esc(d.titre) + " »", "#/devoir/" + d.id, d.classe_id));
  }
  L.sort((a, b) => b.date - a.date);
  S.notifs = L; S.nbNotifs = L.filter(estNouvelle).length;
  majCloche();
}
function cloche(){
  if (prefs().bell === false) return "";
  const n = S.nbNotifs || 0, L = S.notifs || [];
  return `<div class="dd bellwrap"><button class="ib" data-act="bell" title="Notifications" aria-expanded="${!!S.bell}">${icon("bell")}<span class="vh">Notifications${n ? " : " : ""}</span>${n ? `<span class="badge">${n > 99 ? "99+" : n}</span><span class="vh"> nouvelles</span>` : ""}</button>
    ${S.bell ? `<div class="dd-menu bellmenu"><div class="bellhead"><b>Notifications</b>${n ? `<button class="linkbtn" data-act="toutlu">Tout marquer comme lu</button>` : ""}</div>
      ${L.length ? `<div class="belllist">${L.slice(0, 40).map(x => { const c = cls(x.cid); const nv = estNouvelle(x), cle = esc(cleNotifLue(x)); return `<div class="bitem${nv ? " new" : ""}"><a href="${x.href}" data-nk="${cle}"><span class="ini" style="--bb:var(${C(c && c.couleur).b})">${esc(c ? (c.symbole || c.nom).slice(0, 3) : "•")}</span><span><span class="bt">${x.titre}</span><small class="muted">${esc(c ? c.nom : "")} · ${fmtQuand(x.date)}</small></span></a>${nv ? `<button class="ib blu" data-act="notiflu" data-nk="${cle}" title="Marquer comme lu" aria-label="Marquer comme lu">${icon("check")}</button>` : ""}</div>`; }).join("")}</div>` : `<p class="muted" style="margin:8px 10px">Aucune nouvelle notification.</p>`}
      <a class="bellfoot" href="#/admin/profil">${icon("gear")} Paramètres des notifications</a></div>` : ""}</div>`;
}
function majCloche(){ const w = document.querySelector(".bellwrap"); if (w) w.outerHTML = cloche(); }

async function sauverPrefs(p){
  S.profil.prefs = p;
  const { error } = await sb.rpc("pp_prefs", { p });
  if (error) toast("Paramètre non enregistré : " + error.message); else toast("Paramètre enregistré");
  chargerNotifs();
}

/* page Profil et notifications (comme Paramètres de Classroom) */
function admProfil(){
  const P = prefs(), sw = (k, label) => `<label class="switch crsw"><span>${label}</span><input type="checkbox" data-pref="${k}" ${P[k] !== false ? "checked" : ""}${k !== "bell" && P.bell === false ? " disabled" : ""}><i aria-hidden="true"></i></label>`;
  const off = P.cours_off || [];
  return `<section class="edcard crcard"><h2 class="crbig">Profil</h2>
      <div class="crrow"><b>Photo de profil</b><div class="who2">${avatarP(S.nom, "lg")}<a class="linkbtn" href="https://myaccount.microsoft.com/" target="_blank" rel="noopener">Modifier</a></div></div>
      <div class="crrow"><b>Paramètres du compte</b><span>${S.prof ? "Modifie" : "Change"} ton mot de passe et les options de sécurité de ton compte Microsoft 365 du lycée. <a href="https://myaccount.microsoft.com/" target="_blank" rel="noopener">Gérer</a></span></div>
      <div class="crrow"><b>Changer de nom</b>${S.prof ? `<div class="two" style="align-items:end"><div class="field"><label for="pfNom">Nom affiché aux élèves</label><input id="pfNom" value="${esc(R().prof.nom)}"></div><div><button class="btn sm" data-act="savenom">Enregistrer</button></div></div>`
        : `<span>Ton nom (${esc(S.nom)}) est indiqué par ton professeur. S'il y a une erreur, écris-lui.</span>`}</div>
      <div class="crrow"><b>Adresse</b><span class="muted">${esc(moi())}</span></div>
      <div class="crrow"><b>Apparence</b><select data-theme-choice="1" class="agsel" aria-label="Apparence">${[["auto", "Automatique (comme l'appareil)"], ["light", "Clair"], ["dark", "Sombre"]].map(([v, l]) => `<option value="${v}" ${themeChoisi() === v ? "selected" : ""}>${l}</option>`).join("")}</select><small class="muted">Réglage propre à cet appareil.</small></div>
    </section>
    <section class="edcard crcard"><h2 class="crbig">Notifications</h2>
      <h3 class="crsub">Dans PhysiquePro</h3>
      <p class="muted" style="margin:0">Ces paramètres s'appliquent aux notifications de la cloche ${icon("bell")} en haut de chaque page. ${S.prof ? "Les élèves sont aussi prévenus par e-mail et sur leur téléphone quand tu rends une note (voir plus bas)." : "Pour être prévenu hors du site, active aussi les notifications de cet appareil plus bas."}</p>
      ${sw("bell", "Autoriser les notifications")}
      <h3 class="crsub">Commentaires</h3>${NOTIF_DEF.coms.map(([k, l]) => sw(k, S.prof ? l : (NOTIF_TU[k] || l))).join("")}
      <h3 class="crsub">${S.prof ? "Cours dont vous êtes enseignant" : "Tes cours"}</h3>${NOTIF_DEF[S.prof ? "prof" : "eleve"].map(([k, l]) => sw(k, l)).join("")}
      ${blocPush()}
      ${blocTelephoneProfil()}
      <details class="crdet"><summary><span><b>Notifications de cours</b><small class="muted">Ces paramètres s'appliquent aux notifications pour chaque cours</small></span>${icon("down")}</summary>
        ${actives().map(c => `<label class="switch crsw"><span class="who2"><span class="ini" style="--bb:var(${C(c.couleur).b})">${esc((c.symbole || c.nom).slice(0, 3))}</span>${esc(c.nom)}</span><input type="checkbox" data-prefc="${esc(c.id)}" ${off.includes(c.id) ? "" : "checked"}><i aria-hidden="true"></i></label>`).join("")}</details>
    </section>`;
}
