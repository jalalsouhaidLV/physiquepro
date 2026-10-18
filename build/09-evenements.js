/* ---------- rendu ---------- */
let renderId = 0;
const chargement = (r) => topbar(r) + `<div class="shell">${drawer(r)}<main class="content"><div class="loading"><div><div class="spin"></div>Chargement…</div></div></main></div>`;
async function render(){
  if (S.public) { renderPublic(); return; }
  const id = ++renderId, r = route();
  try {
    if (r.v === "editer") {
      if (!S.prof) { go("/"); return; }
      await initEditeur(r); if (id !== renderId) return;
      const foc = document.activeElement && document.activeElement.id;
      if (S.ed.type === "questionnaire") await urlsSignees(S.ed.questions.map(q => q.img).filter(Boolean)); if (id !== renderId) return;
      app.innerHTML = vEditer();
      const qf = document.getElementById("qimgFile"); if (qf) qf.onchange = () => { const f = qf.files[0]; qf.value = ""; if (f) imageQuestion(f); };
      const fi = document.getElementById("edFile"); if (fi) fi.onchange = () => { uploadFichiers([...fi.files], "ed"); fi.value = ""; };
      apresRendu(foc); return;
    }
    if (S.viewer && S.prof) {
      await preparerViewer(); if (id !== renderId) return;
      if (S.viewer) { const foc = document.activeElement && document.activeElement.id; app.innerHTML = vViewer(); apresRendu(foc); return; }
    }
    if (r.v === "classe" && r.t === "parametres") {
      const c = cls(r.a); if (!S.prof || !c) { go("/"); return; }
      const foc = document.activeElement && document.activeElement.id;
      app.innerHTML = vParametres(c); apresRendu(foc); return;
    }
    let content;
    if (r.v === "classe") {
      if (!S.cache[r.a]) app.innerHTML = chargement(r);
      const data = cls(r.a) ? await chargerClasse(r.a) : null; if (id !== renderId) return;
      content = vClasse(r, data);
    } else if (r.v === "devoir") {
      const d = S.devoirs.find(x => String(x.id) === r.a);
      if (d) { if (!S.cache[d.classe_id]) app.innerHTML = chargement(r); await chargerClasse(d.classe_id); const em = S.prof ? S.sel : moi(); if (em) await chargerCP(d.id, em); }
      if (id !== renderId) return;
      content = vDevoir(r);
      if (d && S.prof && odActif() && !(S.syncFait || {})[d.id + ":" + rendusDe(d).length]) { (S.syncFait = S.syncFait || {})[d.id + ":" + rendusDe(d).length] = 1; syncRendus(d, true).then(n => { if (n) toast(n + " travail" + (n > 1 ? "x copiés" : " copié") + " dans OneDrive"); }).catch(() => {}); }
    } else if (r.v === "quiz") {
      const q = S.quiz.find(x => String(x.id) === r.a);
      if (q && S.prof) { await chargerClasse(q.classe_id); await chargerResultatsQuiz(q); }
      if (q) await urlsSignees((q.questions || []).map(x => x.img).filter(Boolean));
      if (id !== renderId) return;
      content = vQuiz(r);
    } else if (r.v === "suivi") {
      if (!S.prof) { go("/"); return; }
      content = vSuivi();
    } else if (r.v === "admin") {
      if (!S.prof && r.a !== "profil") { go("/admin/profil"); return; }
      if (admTab(r) === "fichiers" && !S.fich) { app.innerHTML = chargement(r); await chargerFichiers(); if (id !== renderId) return; }
      content = vAdmin(r);
    } else if (r.v === "rejoindre") {
      const code = r.a || "";
      if (S.prof) { go("/"); toast("Lien d'invitation : l'élève qui l'ouvre rejoint le cours (code " + code + ")."); return; }
      const deja = S.classes.find(c => c.code && c.code.toLowerCase() === code.toLowerCase());
      if (deja) { go("/classe/" + deja.id); return; }
      if (S.joinVu !== code) { S.joinVu = code; S.modal = {kind:"join", code}; }
      content = vAccueil();
    } else {
      if (!S.prof && r.v === "accueil" && !actives().length && !S.joinAuto && !S.modal) { S.joinAuto = true; S.modal = {kind:"join"}; }
      content = ({agenda:vAgenda, todo:vTodo, outils:vOutils, archives:vArchives})[r.v]?.(r) ?? vAccueil();
    }
    const foc = document.activeElement && document.activeElement.id;
    app.innerHTML = topbar(r) + `<div class="shell">${drawer(r)}<main class="content">${content}</main></div>` + (S.modal ? vModal() : "");
    { const c0 = r.a && typeof cls === "function" ? cls(r.a) : null, T = { agenda: "Agenda", todo: S.prof ? "À corriger" : "À faire", suivi: "Suivi des élèves", admin: "Paramètres", outils: "Boîte à outils", archives: "Cours archivés" };
      document.title = (r.v === "classe" && c0 ? c0.nom + " · " : T[r.v] ? T[r.v] + " · " : "") + "PhysiquePro"; }
    { const pg = app.querySelector("main.content > .page"); if (pg && !pg.querySelector(":scope > .headband")) pg.insertAdjacentHTML("afterbegin", pageHead()); }
    const fi = document.getElementById("fileIn"); if (fi) fi.onchange = () => { S.files.push(...[...fi.files].filter(f => { if (f.size > 50e6) { toast("« " + f.name + " » dépasse 50 Mo : mets-le dans ton OneDrive et ajoute le lien."); return false; } return true; })); fi.value = ""; render(); };
    const iz = document.getElementById("impZip"); if (iz) iz.onchange = () => { const f = [...iz.files]; iz.value = ""; if (f.length) importerZip(f).catch(er => { S.imp.busy = false; toast("Zip : " + (er.message || er)); render(); }); };
    const af = document.getElementById("anFile"); if (af) af.onchange = () => { uploadFichiers([...af.files], "annonce"); af.value = ""; };
    apresRendu(foc);
  } catch (e) {
    app.innerHTML = topbar(r) + `<div class="shell">${drawer(r)}<main class="content"><div class="page"><div class="emptystate"><b>Impossible de charger cette page.</b><span>${esc(e.message || e)}</span><button class="btn ghost" data-act="reload">Réessayer</button></div></div></main></div>`;
  }
}
function apresRendu(foc){
  if (S.modal && S.modal.kind !== "liens" && S.modal.kind !== "cible" && S.modal.kind !== "reutiliser") { const f = document.querySelector(".modal input:not([type=checkbox])"); if (f) f.focus(); return; }
  if (foc && document.getElementById(foc) && !["edHtml", "anHtml"].includes(foc)) { const el = document.getElementById(foc); el.focus(); if (el.setSelectionRange && el.type === "text") { const n = el.value.length; el.setSelectionRange(n, n); } }
}
const fermerMenus = () => { S.dd = false; S.me = false; S.menu = null; S.bell = false; };

/* ---------- clics ---------- */
document.addEventListener("click", async e => {
  const a = e.target.closest("[data-act]");
  if (!a) {
    if ((S.dd || S.me || S.menu || S.bell) && !e.target.closest(".dd")) { fermerMenus(); render(); }
    return;
  }
  const act = a.dataset.act, r = route();
  if (["INPUT"].includes(a.tagName) && ["pick", "pickall", "cibletous", "cibleun", "bonne", "ans", "inscr", "bonnecase", "anscase", "repchoix"].includes(act)) { /* traité par « change » */ if (act !== "pick" && act !== "pickall") return; }
  switch (act) {
    case "pubconnect": e.preventDefault(); connecter(); return;
    case "pubcours": e.preventDefault(); connecter("#/classe/" + encodeURIComponent(a.dataset.c)); return;
    case "pubretour": e.preventDefault(); try { localStorage.removeItem("pp_next"); } catch (_) {} if (location.hash && location.hash !== "#/") location.hash = "/"; else renderPublic(); return;
    case "drawer": S.drawer = !S.drawer; render(); return;
    case "bell": { const o = !S.bell; fermerMenus(); S.bell = o; render(); if (o) chargerNotifs(); return; }
    case "toutlu": { const { data, error } = await sb.rpc("pp_vu"); if (error) { toast("Action impossible : " + error.message); return; } S.profil.vu_le = data || now().toISOString(); await chargerNotifs(); return; }
    case "savenom": { const n = ((document.getElementById("pfNom") || {}).value || "").trim(); if (!n) { toast("Le nom ne peut pas être vide."); return; }
      const data = { ...reglagesData(), prof: { nom: n, titre: R().prof.titre } };
      const { error } = await sb.from("reglages").upsert({ id: 1, data, modifie_le: now().toISOString() }); if (error) { toast("Enregistrement impossible : " + error.message); return; }
      appliquerReglages(data); S.nom = n; S.adm = null; toast("Nom modifié"); render(); return; }
    case "dd": S.dd = !S.dd; S.me = false; S.menu = null; render(); return;
    case "me": S.me = !S.me; S.dd = false; S.menu = null; render(); return;
    case "logout": e.preventDefault(); await sb.auth.signOut(); location.replace(ICI); return;
    case "menu": e.preventDefault(); S.menu = S.menu === a.dataset.m ? null : a.dataset.m; S.dd = false; S.me = false; render(); return;
    case "reload": S.cache = {}; await chargerTout().catch(() => {}); render(); return;
    case "toggle": S.open = S.open === a.dataset.id ? null : a.dataset.id; render(); return;
    case "recent": S.recent = !S.recent; try { localStorage.setItem("pp_recent", S.recent ? "1" : "0"); } catch (_) {} render(); return;
    case "todotab": S.todoTab = a.dataset.t; render(); return;
    case "week": S.week = a.dataset.w === "0" ? 0 : S.week + Number(a.dataset.w); render(); return;
    case "toutreduire": { const c = cls(r.a), data = S.cache[r.a]; if (S.reduits.size) S.reduits = new Set(); else { S.reduits = new Set(data.themes.map(t => String(t.id))); S.reduits.add("none"); } render(); return; }
    case "reduire": { const k = a.dataset.id; S.reduits.has(k) ? S.reduits.delete(k) : S.reduits.add(k); render(); return; }

    /* cours */
    case "join": e.preventDefault(); fermerMenus(); S.modal = {kind:"join"}; render(); return;
    case "newclass": e.preventDefault(); fermerMenus(); S.modal = {kind:"newclass"}; render(); return;
    case "showcode": e.preventDefault(); S.menu = null; S.modal = {kind:"code", code:a.dataset.code}; render(); return;
    case "copycode": { e.preventDefault(); S.menu = null; const code = a.dataset.code; try { navigator.clipboard.writeText(code).then(() => toast("Code copié : " + code), () => toast("Code : " + code)); } catch (_) { toast("Code : " + code); } render(); return; }
    case "resetcode": { e.preventDefault(); S.menu = null; const al = "abcdefghjkmnpqrstuvwxyz23456789", code = [...Array(7)].map(() => al[Math.floor(Math.random() * al.length)]).join("");
      const { error } = await sb.from("classes").update({ code, code_actif: true }).eq("id", a.dataset.c); if (error) { toast("Impossible de changer le code : " + error.message); return; }
      if (S.settings) S.settings.code_actif = true; await rafraichir(); render(); toast("Nouveau code : " + code); return; }
    case "togglecode": { e.preventDefault(); S.menu = null; const on = a.dataset.on === "1"; const { error } = await sb.from("classes").update({ code_actif: on }).eq("id", a.dataset.c); if (error) { toast("Action impossible : " + error.message); return; }
      await rafraichir(); render(); toast(on ? "Code activé" : "Code désactivé : plus personne ne peut rejoindre avec ce code"); return; }
    case "archiver": { e.preventDefault(); S.menu = null; const on = a.dataset.on === "1"; const { error } = await sb.from("classes").update({ archive: on }).eq("id", a.dataset.c); if (error) { toast("Action impossible : " + error.message); return; }
      S.settings = null; await rafraichir(); toast(on ? "Cours archivé" : "Cours restauré"); if (a.dataset.stay) render(); else go(on ? "/archives" : "/classe/" + a.dataset.c); return; }
    case "supprclasse": { e.preventDefault(); S.menu = null; const c = cls(a.dataset.c); S.modal = {kind:"supprclasse", id:c.id, nom:c.nom}; render(); return; }
    case "editliens": { const c = cls(a.dataset.c); S.modal = {kind:"liens", classe:c.id, liens:(c.liens || []).map(l => ({...l}))}; if (!S.modal.liens.length) S.modal.liens.push({nom:"", url:""}); render(); return; }
    case "addlien": S.modal.liens.push({nom:"", url:""}); render(); return;
    case "rmlien": S.modal.liens.splice(Number(a.dataset.i), 1); render(); return;
    case "savesettings": enregistrerParametres(); return;
    case "addcat": S.settings.categories.push({ nom: "", coef: 1 }); render(); return;
    case "rmcat": S.settings.categories.splice(Number(a.dataset.i), 1); render(); return;
    case "copylien": { e.preventDefault(); S.menu = null; const lien = ICI + "#/rejoindre/" + encodeURIComponent(a.dataset.code);
      try { navigator.clipboard.writeText(lien).then(() => toast("Lien d'invitation copié"), () => toast(lien)); } catch (_) { toast(lien); } render(); return; }
    case "deplacer": e.preventDefault(); S.menu = null; deplacerA(a.dataset.c, Number(a.dataset.pos)); return;
    case "copiercours": { e.preventDefault(); S.menu = null; const c = cls(a.dataset.c); S.modal = {kind:"copiercours", id:c.id, nom:c.nom}; render(); return; }
    case "moveclasse": { const act2 = actives(), i = act2.findIndex(c => c.id === a.dataset.c), j = i + Number(a.dataset.dir); if (i < 0 || j < 0 || j >= act2.length) return;
      [act2[i], act2[j]] = [act2[j], act2[i]];
      const res = await Promise.all(act2.map((c, n) => sb.from("classes").update({ ordre: n + 1 }).eq("id", c.id)));
      if (res.some(x => x.error)) toast("Déplacement impossible."); await rafraichir(); render(); return; }

    /* paramètres du site */
    case "adadd": { const list = getPath(S.adm, a.dataset.path), tpl = a.dataset.tpl;
      list.push(tpl === "lien" ? { nom: "", url: "", icone: "links", couleur: "#116482", principal: false } : tpl === "groupe" ? { matiere: "", couleur: "pc", liens: [["", "", ""]] } : ["", "", ""]);
      S.adm.modif = true; render(); return; }
    case "adrm": getPath(S.adm, a.dataset.path).splice(Number(a.dataset.i), 1); S.adm.modif = true; render(); return;
    case "admv": { const list = getPath(S.adm, a.dataset.path), i = Number(a.dataset.i), j = i + Number(a.dataset.dir); if (j < 0 || j >= list.length) return; [list[i], list[j]] = [list[j], list[i]]; S.adm.modif = true; render(); return; }
    case "admsave": admEnregistrer(); return;
    case "outilsedit": S.adm = null; S.outilsEdit = true; render(); return;
    case "outilsfin": if (S.adm && S.adm.modif && !confirmerPerte()) return; S.outilsEdit = false; S.adm = null; render(); return;
    case "admreset": S.adm = null; render(); return;
    case "admdefaut": S.adm = { prof: { nom: CFG.prof.nom, titre: CFG.prof.titre }, liensUtiles: clone(CFG.liensUtiles), outils: clone(CFG.outils), remarques: R().remarques.join("\n"), busy: false, err: "", modif: true }; render(); return;
    case "admfichiers": S.fich = null; render(); return;
    case "purge": S.modal = {kind:"confirm", action:"purge", ok:"Supprimer", titre:"Supprimer les fichiers inutilisés ?", texte:"Ces fichiers ne sont reliés à aucun devoir, documentation, annonce ou travail rendu. Leur suppression est définitive."}; render(); return;
    case "backup": S.backupBusy = true; render(); try { await sauvegarder(); toast("Sauvegarde téléchargée"); } catch (err) { toast("Sauvegarde impossible : " + (err.message || err)); } S.backupBusy = false; render(); return;
    case "exportnotes": try { await exporterNotes(a.dataset.c); } catch (err) { toast("Export impossible : " + (err.message || err)); } return;
    case "exporteleves": exporterEleves(); return;
    case "ajouteleves": { e.preventDefault(); S.menu = null; const cid = a.dataset.c || (r.v === "classe" ? r.a : "") || (S.admF && cls(S.admF) ? S.admF : (actives()[0] || {}).id); S.modal = {kind:"ajouteleves", classe:cid, fixe:!!a.dataset.c, texte:""}; render(); return; }
    case "renomeleve": e.preventDefault(); S.menu = null; S.modal = {kind:"renomeleve", email:a.dataset.e, nom:a.dataset.n}; render(); return;
    case "autrescours": e.preventDefault(); S.menu = null; S.modal = {kind:"autrescours", from:a.dataset.c, emails:a.dataset.e ? [a.dataset.e] : [...S.pick]}; render(); return;
    case "supprcompte": e.preventDefault(); S.menu = null; S.modal = {kind:"confirm", action:"supprcompte", email:a.dataset.e, nom:a.dataset.n, ok:"Supprimer", titre:"Supprimer " + a.dataset.n + " ?", texte:"L'élève disparaît de la liste et de tous les cours. Ses travaux rendus, ses notes et ses commentaires privés sont supprimés définitivement. S'il se reconnecte un jour, il repartira d'un compte vide et devra rejoindre un cours avec le code."}; render(); return;
    case "retirertout": e.preventDefault(); S.menu = null; S.modal = {kind:"confirm", action:"retirertout", email:a.dataset.e, nom:a.dataset.n, ok:"Retirer", titre:"Retirer " + a.dataset.n + " de tous les cours ?", texte:"L'élève n'aura plus accès à aucun cours. Ses travaux rendus et ses notes sont conservés."}; render(); return;

    /* personnes et e-mails */
    case "compose": e.preventDefault(); S.menu = null; S.compose = true; render(); return;
    case "maileleve": e.preventDefault(); S.menu = null; S.pick = new Set([a.dataset.e]); S.compose = true; render(); return;
    case "closecompose": S.compose = false; S.cSub = ""; S.cBody = ""; render(); return;
    case "copymails": { const txt = [...S.pick].join("; "); try { navigator.clipboard.writeText(txt).then(() => toast("Adresses copiées"), () => toast(txt)); } catch (_) { toast(txt); } return; }
    case "retirer": e.preventDefault(); S.menu = null; S.modal = {kind:"confirm", action:"retirer", emails:[a.dataset.e], classe:a.dataset.c, ok:"Retirer", titre:"Retirer " + a.dataset.n + " du cours ?", texte:"L'élève n'aura plus accès à ce cours. Ses travaux déjà rendus sont conservés. Il pourra revenir avec le code du cours."}; render(); return;
    case "retirersel": e.preventDefault(); S.menu = null; S.modal = {kind:"confirm", action:"retirer", emails:[...S.pick], classe:a.dataset.c, ok:"Retirer", titre:"Retirer " + S.pick.size + " élève" + (S.pick.size > 1 ? "s" : "") + " du cours ?", texte:"Ils n'auront plus accès à ce cours. Leurs travaux déjà rendus sont conservés."}; render(); return;
    case "pick": { const m = a.dataset.e; S.pick.has(m) ? S.pick.delete(m) : S.pick.add(m); if (!S.pick.size) S.compose = false; render(); return; }
    case "pickall": { const el = (S.cache[a.dataset.c] || {eleves:[]}).eleves, all = el.every(x => S.pick.has(x.email)); S.pick = all ? new Set() : new Set(el.map(x => x.email)); if (!S.pick.size) S.compose = false; render(); return; }

    /* thèmes et éléments */
    case "newtheme": e.preventDefault(); S.menu = null; S.modal = {kind:"theme", classe:a.dataset.c}; render(); return;
    case "renomtheme": e.preventDefault(); S.menu = null; S.modal = {kind:"theme", id:a.dataset.id, titre:a.dataset.titre, classe:r.a}; render(); return;
    case "supprtheme": e.preventDefault(); S.menu = null; S.modal = {kind:"confirm", action:"supprtheme", id:a.dataset.id, classe:a.dataset.c, titre:"Supprimer le thème « " + a.dataset.titre + " » ?", texte:"Les éléments de ce thème ne sont pas supprimés : ils passent dans « Aucun thème »."}; render(); return;
    case "movetheme": { e.preventDefault(); S.menu = null; const th = (await chargerClasse(a.dataset.c)).themes.slice(), i = th.findIndex(t => String(t.id) === a.dataset.id);
      if (i < 0) return render();
      const j = a.dataset.to != null ? Math.min(Number(a.dataset.to), th.length - 1) : i + Number(a.dataset.dir);
      return placerTheme(a.dataset.c, a.dataset.id, j); }
    case "copieoffice": e.preventDefault(); copieOffice(a); return;
    case "joindrecopie": e.preventDefault(); joindreCopie(a.dataset.id, a.dataset.nom); return;
    case "moveitem": { e.preventDefault(); S.menu = null; const sec = a.closest("section.theme"), wks = [...sec.querySelectorAll(".work[data-wk]")].map(x => x.dataset.wk), i = wks.indexOf(a.dataset.wk);
      if (i < 0) return render();
      wks.splice(i, 1); const t = a.dataset.to, j = t === "first" ? 0 : t === "last" ? wks.length : Math.max(0, Math.min(wks.length, i + Number(t)));
      wks.splice(j, 0, a.dataset.wk); return ordonnerItems(r.a, sec.dataset.tid, wks); }
    case "placertheme": { e.preventDefault(); S.menu = null; await chargerClasse(a.dataset.c); S.modal = {kind:"placertheme", id:a.dataset.id, titre:a.dataset.titre, classe:a.dataset.c}; render(); return; }
    case "suppr": e.preventDefault(); S.menu = null; S.modal = {kind:"confirm", action:"suppr", k:a.dataset.k, id:a.dataset.id, classe:r.a, titre:"Supprimer « " + a.dataset.titre + " » ?", texte:a.dataset.k === "devoir" ? "Les travaux rendus par les élèves, leurs notes et les commentaires privés de ce devoir seront aussi supprimés. Cette action est définitive." : a.dataset.k === "quiz" ? "Les réponses des élèves seront aussi supprimées. Cette action est définitive." : "Cette action est définitive."}; render(); return;
    case "publier": { e.preventDefault(); S.menu = null; const table = a.dataset.k === "devoir" ? "devoirs" : a.dataset.k === "support" ? "supports" : "quiz";
      const { error } = await sb.from(table).update({ brouillon: false, publie_le: now().toISOString() }).eq("id", a.dataset.id); if (error) { toast("Publication impossible : " + error.message); return; }
      await rafraichir(r.a); render(); toast("Publié"); return; }
    case "reutiliser": e.preventDefault(); S.menu = null; S.modal = {kind:"reutiliser", k:a.dataset.k, id:a.dataset.id, classe:r.a}; render(); return;
    case "reutiliserdepuis": e.preventDefault(); S.menu = null; S.modal = {kind:"reutiliser", k:"depuis", classe:a.dataset.c}; render(); return;
    case "mclose": if (S.modal && S.modal.busy) return; S.modal = null; render(); return;
    case "mok": modalOk(); return;
    case "openfile": { e.preventDefault(); const w = window.open("about:blank", "_blank");
      const { data, error } = await sb.storage.from(a.dataset.bucket || "documents").createSignedUrl(a.dataset.path, 3600);
      if (error || !data) { if (w) w.close(); toast("Fichier introuvable ou accès refusé."); return; }
      const cible = lienOffice(a.dataset.path, data.signedUrl);
      if (w) w.location = cible; else location.href = cible; return; }
    case "dlfile": { e.preventDefault(); const nom = a.dataset.nom || a.dataset.path.split("/").pop().replace(/^\d+-/, "");
      const { data, error } = await sb.storage.from(a.dataset.bucket || "documents").createSignedUrl(a.dataset.path, 600, { download: nom });
      if (error || !data) { toast("Téléchargement impossible."); return; }
      const l = document.createElement("a"); l.href = data.signedUrl; l.download = nom; document.body.appendChild(l); l.click(); l.remove(); return; }

    /* éditeur */
    case "fmt": { e.preventDefault(); const ed = document.getElementById(S.ed ? "edHtml" : "anHtml") || document.getElementById("anHtml"); if (!ed) return; ed.focus(); document.execCommand(a.dataset.cmd, false, null); if (ed.id === "edHtml") S.ed.html = ed.innerHTML; else S.annonce.html = ed.innerHTML; return; }
    case "edlink": S.ed.linkMode = a.dataset.mode; render(); setTimeout(() => { const u = document.getElementById("edLinkUrl"); if (u) u.focus(); }, 0); return;
    case "edlinkcancel": S.ed.linkMode = null; render(); return;
    case "edlinkadd": { const u = document.getElementById("edLinkUrl").value.trim(), l = document.getElementById("edLinkLabel").value.trim();
      if (!/^https?:\/\//.test(u)) { toast("Colle une adresse qui commence par https://"); return; }
      const t = typeDeLien(u, S.ed.linkMode), res = { type: t, label: l || (t === "Lien" ? u.replace(/^https?:\/\/(www\.)?/, "").split("/")[0] : t), url: u };
      if (!l && ytId(u)) { res.type = "YouTube"; res.label = "Chargement…"; }
      S.ed.ressources.push(res); S.ed.linkMode = null; render();
      if (!l && ytId(u)) { const titre = await titreYoutube(u); res.label = titre || "Vidéo YouTube"; if (S.ed) render(); } return; }
    case "edupload": document.getElementById("edFile").click(); return;
    case "rmres": { const x = S.ed.ressources.splice(Number(a.dataset.i), 1)[0];
      if (x && x.path) { if (S.ed.uploaded.includes(x.path)) { sb.storage.from("documents").remove([x.path]); S.ed.uploaded = S.ed.uploaded.filter(p => p !== x.path); } else S.ed.toDelete.push(x.path); }
      render(); return; }
    case "edprog": e.preventDefault(); S.menu = null; S.modal = {kind:"prog"}; render(); return;
    case "edsave": e.preventDefault(); enregistrer(a.dataset.mode); return;
    case "edclose": { const ed = S.ed; if (ed && ed.uploaded.length) sb.storage.from("documents").remove(ed.uploaded); const c = ed ? ed.classe_id : null; S.ed = null; S.modal = null; if (c) go("/classe/" + c + "/travaux"); else history.back(); return; }
    case "cible": S.modal = {kind:"cible", sel: S.ed.eleves ? S.ed.eleves.slice() : null}; render(); return;
    case "addq": S.ed.questions.push({ q: "", t: "choix", o: ["", ""], a: null, acc: "", img: null, num: { v: "", tol: "5" } }); render(); setTimeout(() => { const t = document.querySelectorAll(".qtext"); if (t.length) t[t.length - 1].focus(); }, 0); return;
    case "rmq": S.ed.questions.splice(Number(a.dataset.qi), 1); render(); return;
    case "dupq": { const q = S.ed.questions[Number(a.dataset.qi)]; S.ed.questions.splice(Number(a.dataset.qi) + 1, 0, { q: q.q, t: q.t || "choix", o: q.o.slice(), a: Array.isArray(q.a) ? q.a.slice() : q.a, acc: q.acc || "", img: q.img || null, num: { ...(q.num || { v: "", tol: "5" }) } }); render(); return; }
    case "addqo": S.ed.qoptions.push(""); render(); return;
    case "addgr": S.ed.grille.push({ c: "", p: 2 }); render(); return;
    case "rmgr": S.ed.grille.splice(Number(a.dataset.i), 1); render(); return;
    case "rmqo": S.ed.qoptions.splice(Number(a.dataset.i), 1); render(); return;
    case "addopt": S.ed.questions[Number(a.dataset.qi)].o.push(""); render(); return;
    case "rmopt": { const q = S.ed.questions[Number(a.dataset.qi)], j = Number(a.dataset.oi); q.o.splice(j, 1);
      if (Array.isArray(q.a)) q.a = q.a.filter(x => x !== j).map(x => x > j ? x - 1 : x); else if (q.a === j) q.a = null; else if (q.a > j) q.a--; render(); return; }

    /* flux */
    case "annoncer": S.annonce = { classe: a.dataset.c, html: "", ressources: [], uploaded: [], linkMode: null, busy: false }; render(); setTimeout(() => { const x = document.getElementById("anHtml"); if (x) x.focus(); }, 0); return;
    case "ancancel": if (S.annonce && S.annonce.uploaded.length) sb.storage.from("documents").remove(S.annonce.uploaded); S.annonce = null; render(); return;
    case "anpost": publierAnnonce(); return;
    case "anlink": S.annonce.html = (document.getElementById("anHtml") || {}).innerHTML || S.annonce.html; S.annonce.linkMode = "lien"; render(); return;
    case "anlinkcancel": S.annonce.linkMode = null; render(); return;
    case "anlinkadd": { const u = document.getElementById("anLinkUrl").value.trim(), l = document.getElementById("anLinkLabel").value.trim();
      if (!/^https?:\/\//.test(u)) { toast("Colle une adresse qui commence par https://"); return; }
      const t = typeDeLien(u), res = { type: t, label: l || (t === "Lien" ? u.replace(/^https?:\/\/(www\.)?/, "").split("/")[0] : t), url: u };
      if (!l && ytId(u)) { res.type = "YouTube"; res.label = "Chargement…"; }
      S.annonce.ressources.push(res); S.annonce.linkMode = null; render();
      if (!l && ytId(u)) { const titre = await titreYoutube(u); res.label = titre || "Vidéo YouTube"; if (S.annonce) render(); } return; }
    case "anupload": S.annonce.html = (document.getElementById("anHtml") || {}).innerHTML || S.annonce.html; document.getElementById("anFile").click(); return;
    case "anrm": { const A2 = S.annonce, x = A2.ressources.splice(Number(a.dataset.i), 1)[0];
      if (x && x.path) { if (A2.uploaded.includes(x.path) || !A2.id) sb.storage.from("documents").remove([x.path]); else (A2.toDelete = A2.toDelete || []).push(x.path); } render(); return; }
    case "comment": { const inp = document.getElementById("cm-" + a.dataset.id), t = inp.value.trim(); if (!t) return;
      a.disabled = true; const { error } = await sb.from("commentaires").insert({ annonce_id: Number(a.dataset.id), auteur_nom: S.nom, texte: t });
      if (error) { a.disabled = false; toast("Commentaire impossible : " + error.message); return; }
      delete S.cache[a.dataset.c]; S.open = "an" + a.dataset.id; render(); return; }
    case "supprcom": { const { error } = await sb.from("commentaires").delete().eq("id", a.dataset.id); if (error) { toast("Suppression impossible : " + error.message); return; } delete S.cache[a.dataset.c]; render(); return; }
    case "supprannonce": e.preventDefault(); S.menu = null; S.modal = {kind:"confirm", action:"supprannonce", id:a.dataset.id, classe:a.dataset.c, titre:"Supprimer cette annonce ?", texte:"L'annonce et ses commentaires seront supprimés."}; render(); return;
    case "editannonce": { e.preventDefault(); S.menu = null; const an = ((S.cache[a.dataset.c] || {}).annonces || []).find(x => String(x.id) === a.dataset.id); if (!an) return;
      S.annonce = { classe: a.dataset.c, id: an.id, html: an.texte || "", ressources: clone(an.ressources || []), uploaded: [], toDelete: [], linkMode: null, busy: false }; render(); window.scrollTo(0, 0); setTimeout(() => { const x = document.getElementById("anHtml"); if (x) x.focus(); }, 0); return; }
    case "copiertexte": { e.preventDefault(); S.menu = null; const an = ((S.cache[a.dataset.c] || {}).annonces || []).find(x => String(x.id) === a.dataset.id); const t = an ? (new DOMParser().parseFromString(an.texte || "", "text/html").body.textContent || "") : "";
      try { navigator.clipboard.writeText(t).then(() => toast("Texte copié"), () => toast("Copie impossible")); } catch (_) { toast("Copie impossible"); } render(); return; }
    case "opencoms": S.open = "an" + a.dataset.id; render(); return;

    /* devoirs : élève */
    case "pickfile": e.preventDefault(); S.menu = null; document.getElementById("fileIn").click(); render(); return;
    case "lienopen": e.preventDefault(); S.menu = null; S.lienOpen = true; render(); setTimeout(() => { const l = document.getElementById("lien"); if (l) l.focus(); }, 0); return;
    case "rmfile": S.files.splice(Number(a.dataset.i), 1); render(); return;
    case "submit": rendreDevoir(S.devoirs.find(x => String(x.id) === a.dataset.id)); return;
    case "unsubmit": { const rd = S.rendus.find(x => String(x.id) === a.dataset.id); if (rd && rd.reponse) S.reponse = rd.reponse; const { error } = await sb.from("rendus").delete().eq("id", a.dataset.id);
      if (error) { toast("Annulation impossible : " + error.message); return; }
      const f = (rd.fichiers || []).map(x => x.chemin).filter(Boolean); if (f.length) await sb.storage.from("rendus").remove(f);
      await rafraichir(); render(); toast("Envoi annulé : tu peux modifier ton travail et le rendre à nouveau."); return; }
    case "cpsend": { const inp = document.getElementById("cpIn"), t = inp.value.trim(); if (!t) return;
      const { error } = await sb.from("commentaires_prives").insert({ devoir_id: Number(a.dataset.d), eleve_email: a.dataset.e, auteur_nom: S.nom, texte: t });
      if (error) { toast("Commentaire impossible : " + error.message); return; }
      await chargerCP(Number(a.dataset.d), a.dataset.e, true); render(); return; }

    /* devoirs : professeur */
    case "ptab": S.ptab = a.dataset.t; render(); return;
    case "sel": S.sel = a.dataset.n || null; S.compose = false; render(); return;
    case "symb": S.symb = !S.symb; render(); return;
    case "impanalyse": S.imp.texte = (document.getElementById("impTexte") || {}).value || ""; analyserImport(); render(); return;
    case "impgo": if (!S.imp.busy) lancerImport(); return;
    case "impzip": document.getElementById("impZip").click(); return;
    case "odconnect": await connecterOneDrive(); render(); return;
    case "odmigrer": { if (!S.odOk && !(await connecterOneDrive())) { render(); return; } S.odBusy = true; S.odN = 0; render();
      try { const r2 = await migrerVersOneDrive(n => { S.odN = n; const b = document.querySelector('[data-act="odmigrer"]'); if (b) b.textContent = "Copie en cours… " + n; }); toast(r2.n + " document" + (r2.n > 1 ? "s rangés" : " rangé") + " dans OneDrive" + (r2.err ? " · " + r2.err + " erreur(s)" : "")); }
      catch (er) { toast("Rangement impossible : " + (er.message || er)); }
      S.odBusy = false; S.cache = {}; await rafraichir(); render(); return; }
    case "odrendus": { const d = S.devoirs.find(x => String(x.id) === a.dataset.d); a.disabled = true; toast("Copie des travaux dans OneDrive…");
      try { const n = await syncRendus(d, false); toast(n ? n + " fichier" + (n > 1 ? "s copiés" : " copié") + " dans OneDrive" : "Tout est déjà dans OneDrive"); } catch (er) { toast("OneDrive : " + (er.message || er)); } a.disabled = false; return; }
    case "voir": e.preventDefault(); S.viewer = { did: Number(a.dataset.d), email: a.dataset.e, fi: Number(a.dataset.i) || 0 }; render(); return;
    case "vclose": S.viewer = null; render(); return;
    case "vgo": if (a.dataset.e) { S.viewer.email = a.dataset.e; S.viewer.fi = 0; S.sel = a.dataset.e; render(); } return;
    case "vfile": S.viewer.fi = Number(a.dataset.i); render(); return;
    case "exportsuivi": exporterSuivi(a.dataset.c); return;
    case "dupliquer": { e.preventDefault(); S.menu = null; const k = a.dataset.k, id = a.dataset.id;
      const rec = k === "devoir" ? S.devoirs.find(x => String(x.id) === id) : k === "quiz" ? S.quiz.find(x => String(x.id) === id) : ((S.cache[r.a] || {}).supports || []).find(x => String(x.id) === id);
      if (!rec) return; const res = await reutiliser(k, id, rec.classe_id, rec.theme_id ?? null, { titre: "Copie de " + rec.titre });
      if (res.error) { toast("Duplication impossible : " + res.error.message); return; }
      await rafraichir(rec.classe_id); render(); toast("Copie créée en brouillon"); return; }
    case "ins": { const el = document.activeElement; if (el && (el.isContentEditable || el.tagName === "TEXTAREA" || (el.tagName === "INPUT" && !["checkbox", "radio", "number", "color", "file"].includes(el.type)))) document.execCommand("insertText", false, a.dataset.s); else toast("Clique d'abord dans un champ de texte."); return; }
    case "qimg": S.qimgFor = Number(a.dataset.qi); document.getElementById("qimgFile").click(); return;
    case "rmqimg": { const q = S.ed.questions[Number(a.dataset.qi)]; if (q.img && S.ed.uploaded.includes(q.img)) { sb.storage.from("documents").remove([q.img]); S.ed.uploaded = S.ed.uploaded.filter(p => p !== q.img); } q.img = null; render(); return; }
    case "remarque": { const t = document.getElementById("noteCom"); if (t) { t.value = (t.value.trim() ? t.value.trim() + " " : "") + a.dataset.t; t.focus(); } return; }
    case "savenote": { const v = (document.getElementById("note") || {}).value, d = S.devoirs.find(x => x.id === (S.rendus.find(y => String(y.id) === a.dataset.id) || {}).devoir_id);
      const n = v === "" || v == null ? null : Number(String(v).replace(",", ".")), pub = a.dataset.pub === "1";
      if (n != null && (isNaN(n) || n < 0 || (d && d.points != null && n > d.points))) { const x = document.getElementById("noteErr"); x.hidden = false; x.textContent = "La note doit être comprise entre 0 et " + d.points + "."; return; }
      const com = ((document.getElementById("noteCom") || {}).value || "").trim();
      const grille = d && d.grille && d.grille.length ? d.grille.map((g, i) => { const x = (document.getElementById("gr-" + i) || {}).value; return x === "" || x == null ? null : Number(String(x).replace(",", ".")); }) : null;
      if (grille && grille.some((x, i) => x != null && (isNaN(x) || x < 0 || x > d.grille[i].p))) { const x = document.getElementById("noteErr"); x.hidden = false; x.textContent = "Une note de critère dépasse son maximum."; return; }
      const { error } = await sb.from("corrections").upsert({ rendu_id: Number(a.dataset.id), note: n, commentaire: com, grille, publiee: pub, modifie_le: now().toISOString() });
      if (error) { toast("Enregistrement impossible : " + error.message); return; }
      await rafraichir(); render(); toast(pub ? "Travail rendu à l'élève" : "Brouillon enregistré"); return; }
    case "rendretout": { e.preventDefault(); S.menu = null; const d = S.devoirs.find(x => String(x.id) === a.dataset.d);
      const ids = rendusDe(d).filter(rd => { const c = correctionDe(rd); return c && c.note != null && !c.publiee; }).map(rd => rd.id);
      if (!ids.length) { toast("Aucune note en brouillon à rendre pour ce devoir."); render(); return; }
      const { error } = await sb.from("corrections").update({ publiee: true, modifie_le: now().toISOString() }).in("rendu_id", ids);
      if (error) { toast("Action impossible : " + error.message); return; }
      await rafraichir(); render(); toast(ids.length + " note" + (ids.length > 1 ? "s rendues" : " rendue")); return; }
    case "mailmissing": { const d = S.devoirs.find(x => String(x.id) === a.dataset.d), el = elevesDuDevoir(d, (S.cache[d.classe_id] || {eleves:[]}).eleves);
      S.pick = new Set(el.filter(x => !renduDe(d, x.email)).map(x => x.email)); S.compose = true; S.cSub = "Rappel : " + d.titre;
      S.cBody = "Bonjour,\n\nJe n'ai pas encore reçu ton travail « " + d.titre + " ». " + (d.date_limite ? (ouvert(d) ? "La date limite est le " + fmtD(D(d.date_limite)) + " à " + fmtT(D(d.date_limite)) + "." : "La date limite est passée, viens me voir.") : "") + "\n\n" + R().prof.nom; render(); return; }

    /* questionnaires : élève */
    case "valider": envoyerQuiz(Number(a.dataset.q)); return;
    case "retry": delete S.quizRep[a.dataset.q]; delete S.quizRes[a.dataset.q]; render(); return;
  }
});

/* ---------- saisie ---------- */
document.addEventListener("mousedown", e => { if (e.target.closest && e.target.closest("[data-keepfocus]")) e.preventDefault(); });
document.addEventListener("input", e => {
  const t = e.target;
  if (t.id === "edHtml" && S.ed) { S.ed.html = t.innerHTML; return; }
  if (t.id === "anHtml" && S.annonce) { S.annonce.html = t.innerHTML; return; }
  if (S.ed && t.dataset.qi != null && t.dataset.qk === "q") { S.ed.questions[Number(t.dataset.qi)].q = t.value; return; }
  if (S.ed && t.classList.contains("otext")) { S.ed.questions[Number(t.dataset.qi)].o[Number(t.dataset.oi)] = t.value; return; }
  if (S.ed && t.dataset.f && t.tagName !== "SELECT") { S.ed[t.dataset.f] = t.value; return; }
  if (S.modal && S.modal.kind === "liens" && t.dataset.li != null) { S.modal.liens[Number(t.dataset.li)][t.dataset.k] = t.value; return; }
  if (S.settings && t.dataset.s && t.tagName !== "SELECT" && t.type !== "checkbox") { S.settings[t.dataset.s] = t.value; if (["nom", "section", "symbole"].includes(t.dataset.s)) { const p = document.querySelector(".preview"); if (p) { p.querySelector("h1").textContent = S.settings.nom || "Nom du cours"; p.querySelector("span:not(.sym)").textContent = S.settings.section; const sy = p.querySelector(".sym"); if (sy) sy.textContent = S.settings.symbole; } } return; }
  if (t.id === "cSub" || t.id === "cBody") { S[t.id] = t.value; const l = document.getElementById("olk"); if (l) l.href = outlookLink([...S.pick], S.cSub, S.cBody); return; }
  if (t.id === "lien") { S.lien = t.value; return; }
  if (t.id === "repQ") { S.reponse = t.value; return; }
  if (t.id === "impTexte" && S.imp) { S.imp.texte = t.value; return; }
  if (S.settings && t.dataset.cat != null) { S.settings.categories[Number(t.dataset.cat)][t.dataset.k] = t.value; return; }
  if (t.dataset.gr != null) { const ins = [...document.querySelectorAll("[data-gr]")], vals = ins.map(x => Number(String(x.value).replace(",", "."))).filter(x => !isNaN(x) && String(x) !== ""); const n = document.getElementById("note"); if (n) n.value = ins.some(x => x.value !== "") ? Math.round(ins.reduce((a, x) => a + (Number(String(x.value).replace(",", ".")) || 0), 0) * 100) / 100 : ""; return; }
  if (t.dataset.act === "anstxt") { const id = t.dataset.q; S.quizRep[id] = S.quizRep[id] || {}; S.quizRep[id][Number(t.dataset.i)] = t.value; return; }
  if (S.ed && t.dataset.gr2 != null) { S.ed.grille[Number(t.dataset.gr2)][t.dataset.k] = t.value; if (t.dataset.k === "p") { const tot = document.querySelector(".edcard .muted b"); } return; }
  if (S.ed && t.dataset.qo != null) { S.ed.qoptions[Number(t.dataset.qo)] = t.value; return; }
  if (S.ed && t.dataset.qnum != null) { const q = S.ed.questions[Number(t.dataset.qnum)]; q.num = q.num || { v: "", tol: "5" }; q.num[t.dataset.k] = t.value; return; }
  if (S.ed && t.dataset.qacc != null) { S.ed.questions[Number(t.dataset.qacc)].acc = t.value; return; }
  if (S.adm && t.dataset.ad && t.type !== "checkbox" && t.tagName !== "SELECT" && t.type !== "color") { setPath(S.adm, t.dataset.ad, t.value); if (!S.adm.modif) { S.adm.modif = true; const b = document.querySelector(".savebar"); if (b) { b.classList.add("on"); b.firstElementChild.textContent = "Modifications non enregistrées"; const sv = b.querySelector('[data-act="admsave"]'); if (sv) sv.disabled = false; } } return; }
  if (t.dataset.adq) { S.admQ = t.value; render(); return; }
  if (t.id === "mListe" && S.modal && S.modal.kind === "ajouteleves") { S.modal.texte = t.value; const ap = document.getElementById("mApercu"); if (ap) ap.innerHTML = apercuListe(S.modal); return; }
});
document.addEventListener("change", async e => {
  const t = e.target, r = route();
  if (t.dataset.act === "ans") { const id = t.dataset.q; S.quizRep[id] = S.quizRep[id] || {}; S.quizRep[id][Number(t.dataset.i)] = Number(t.dataset.j); return; }
  if (t.dataset.act === "bonne") { S.ed.questions[Number(t.dataset.qi)].a = Number(t.dataset.oi); render(); return; }
  if (t.dataset.act === "cibletous") { const el = (S.cache[S.ed.classe_id] || {eleves:[]}).eleves; S.modal.sel = t.checked ? null : []; render(); return; }
  if (t.dataset.act === "cibleun") { const el = (S.cache[S.ed.classe_id] || {eleves:[]}).eleves; let s = S.modal.sel == null ? el.map(x => x.email) : S.modal.sel.slice(); s = t.checked ? [...new Set([...s, t.dataset.e])] : s.filter(x => x !== t.dataset.e); S.modal.sel = s.length === el.length ? null : s; render(); return; }
  if (t.dataset.act === "note") {
    const n = t.value.trim() === "" ? null : Number(t.value.replace(",", ".")), max = Number(t.dataset.max);
    if (n != null && (isNaN(n) || n < 0 || n > max)) { toast("La note doit être comprise entre 0 et " + max + "."); t.classList.add("bad"); return; }
    t.classList.remove("bad");
    const old = S.corrections.find(c => c.rendu_id === Number(t.dataset.rendu));
    const { error } = await sb.from("corrections").upsert({ rendu_id: Number(t.dataset.rendu), note: n, publiee: old ? old.publiee : false, modifie_le: now().toISOString() });
    if (error) { toast("Note non enregistrée : " + error.message); return; }
    if (old) old.note = n; else S.corrections.push({ rendu_id: Number(t.dataset.rendu), note: n, publiee: false });
    const s = t.parentElement.querySelector(".s"); if (s) { const pub = old && old.publiee; s.textContent = n == null ? "Rendu" : pub ? "" : "Brouillon"; }
    toast(old && old.publiee ? "Note modifiée (déjà rendue à l'élève)" : "Note enregistrée en brouillon"); return;
  }
  if (t.id === "partenaire") { S.partenaire = t.value; return; }
  if (t.dataset.act === "repchoix") { S.reponse = t.value; return; }
  if (t.dataset.act === "anscase") { const id = t.dataset.q, i = Number(t.dataset.i), j = Number(t.dataset.j); S.quizRep[id] = S.quizRep[id] || {}; const cur = new Set(S.quizRep[id][i] || []); t.checked ? cur.add(j) : cur.delete(j); S.quizRep[id][i] = [...cur]; return; }
  if (t.dataset.act === "bonnecase") { const q = S.ed.questions[Number(t.dataset.qi)], j = Number(t.dataset.oi), cur = new Set(Array.isArray(q.a) ? q.a : []); t.checked ? cur.add(j) : cur.delete(j); q.a = [...cur]; render(); return; }
  if (S.ed && t.dataset.qt != null) { const q = S.ed.questions[Number(t.dataset.qt)]; q.t = t.value; q.num = q.num || { v: "", tol: "5" }; q.a = t.value === "cases" ? (q.a != null && !Array.isArray(q.a) ? [q.a] : Array.isArray(q.a) ? q.a : []) : t.value === "choix" ? (Array.isArray(q.a) ? (q.a[0] ?? null) : q.a) : null; if (q.o.length < 2) q.o = ["", ""]; render(); return; }
  if (t.id === "edVoir" && S.ed) { S.ed.qvoir = t.checked; return; }
  if (t.id === "edRetard" && S.ed) { S.ed.retard = t.checked; return; }
  if (t.id === "edMelanger" && S.ed) { S.ed.melanger = t.checked; return; }
  if (S.ed && t.dataset.gr2 != null && t.dataset.k === "p") { render(); return; }
  if (t.id === "edModif" && S.ed) { S.ed.qmodif = t.checked; return; }
  if (t.dataset.act === "inscr") { const on = t.checked, cid = t.dataset.c, email = t.dataset.e; t.disabled = true;
    const { error } = on ? await sb.from("inscriptions").upsert({ classe_id: cid, email, nom: t.dataset.n }, { onConflict: "classe_id,email", ignoreDuplicates: true }) : await sb.from("inscriptions").delete().eq("classe_id", cid).eq("email", email);
    if (error) { toast("Action impossible : " + error.message); t.checked = !on; t.disabled = false; return; }
    await rafraichir(); toast((on ? "Inscrit en " : "Retiré de ") + cls(cid).nom); render(); return; }
  if (S.adm && t.dataset.ad) { setPath(S.adm, t.dataset.ad, t.type === "checkbox" ? t.checked : t.value); S.adm.modif = true; render(); return; }
  if (t.dataset.pref) { const p = { ...prefs() }; p[t.dataset.pref] = t.checked; await sauverPrefs(p); render(); return; }
  if (t.dataset.prefc) { const p = { ...prefs() }, off = new Set(p.cours_off || []); t.checked ? off.delete(t.dataset.prefc) : off.add(t.dataset.prefc); p.cours_off = [...off]; await sauverPrefs(p); return; }
  if (t.classList && t.classList.contains("edAussi") && S.ed) { const v = t.value; S.ed.aussi = t.checked ? [...new Set([...S.ed.aussi, v])] : S.ed.aussi.filter(x => x !== v); return; }
  if (t.classList && t.classList.contains("anAussi") && S.annonce) { const v = t.value, l = S.annonce.aussi || []; S.annonce.aussi = t.checked ? [...new Set([...l, v])] : l.filter(x => x !== v); return; }
  if (t.dataset.impmap != null) { S.imp.map[t.dataset.impmap] = t.value; return; }
  if (t.id === "impBrouillons") { S.imp.brouillons = t.checked; return; }
  if (t.dataset.suivi) { S.suiviC = t.value; S.open = null; render(); return; }
  if (t.dataset.agenda != null) { go(t.value ? "/agenda/" + t.value : "/agenda"); return; }
  if (t.dataset.themeChoice) { appliquerTheme(t.value); toast("Apparence modifiée"); return; }
  if (t.dataset.adf) { S.admF = t.value; render(); return; }
  if (t.dataset.mclasse && S.modal) { S.modal.classe = t.value; const ap = document.getElementById("mApercu"); if (ap) ap.innerHTML = apercuListe(S.modal); return; }
  if (t.id === "edMontrer" && S.ed) { S.ed.montrer = t.checked; return; }
  if (t.dataset.f === "filtre") { S.filtreTheme = t.value; render(); return; }
  if (S.settings && t.dataset.s) { const k = t.dataset.s; S.settings[k] = t.type === "checkbox" ? t.checked : ["code_actif", "flux_devoirs"].includes(k) ? t.value === "1" : t.value; if (k === "couleur" || k === "illustration") render(); return; }
  if (!S.ed || !t.dataset.f || t.tagName !== "SELECT") return;
  const f = t.dataset.f, v = t.value;
  if (f === "theme_id" && v === "__new") { t.value = S.ed.theme_id; S.modal = {kind:"theme", classe:S.ed.classe_id, fromEditor:true}; render(); return; }
  if (f === "hasDate") { S.ed.hasDate = v === "1"; render(); return; }
  if (f === "classe_id") { S.ed.classe_id = v; S.ed.theme_id = ""; S.ed.eleves = null; await chargerClasse(v); render(); return; }
  S.ed[f] = v; if (f === "mode" || f === "qformat") render();
});
document.addEventListener("keydown", e => {
  if (e.key === "Enter" && S.modal && e.target.closest && e.target.closest(".modal") && e.target.tagName === "INPUT" && e.target.type !== "checkbox") { e.preventDefault(); modalOk(); return; }
  if (e.key === "Enter" && e.target.id && e.target.id.startsWith("cm-")) { e.preventDefault(); const b = e.target.parentElement.querySelector('[data-act="comment"]'); if (b) b.click(); return; }
  if (e.key === "Enter" && e.target.id === "cpIn") { e.preventDefault(); const b = e.target.parentElement.querySelector('[data-act="cpsend"]'); if (b) b.click(); return; }
  if (e.key === "Enter" && e.target.dataset && e.target.dataset.act === "note") { e.target.blur(); return; }
  if (S.viewer && !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName || "") && (e.key === "ArrowLeft" || e.key === "ArrowRight")) { const b = document.querySelectorAll('[data-act="vgo"]')[e.key === "ArrowLeft" ? 0 : 1]; if (b && !b.disabled) b.click(); return; }
  if (e.key === "Escape" && S.viewer && !S.modal) { S.viewer = null; render(); return; }
  if (e.key === "Escape" && DG.on) { finDrag(true); return; }
  if (e.key === "Escape" && DT.on) { dtFin(true); return; }
  if (e.key === "Escape") { if (S.modal && !S.modal.busy) { S.modal = null; render(); return; } if (S.dd || S.me || S.menu) { fermerMenus(); render(); return; } if (S.drawer && window.innerWidth < 1100) { S.drawer = false; render(); } }
});
window.addEventListener("hashchange", () => {
  const r = route();
  if (r.v !== "editer") S.ed = null;
  if (!(r.v === "classe" && r.t === "parametres")) S.settings = null;
  if (r.v !== "admin") S.adm = null;
  S.outilsEdit = false;
  S.viewer = null;
  if (r.v !== "devoir") { S.reponse = ""; S.sel = null; S.ptab = "travaux"; S.files = []; S.lien = ""; S.lienOpen = false; S.partenaire = ""; }
  fermerMenus(); S.modal = null; S.open = null; S.compose = false; S.pick = new Set(); S.cSub = ""; S.cBody = ""; S.annonce = null; S.filtreTheme = "";
  if (window.innerWidth < 1100) S.drawer = false; window.scrollTo(0, 0); render();
});
let lastW = window.innerWidth;
window.addEventListener("resize", () => { const w = window.innerWidth; if ((lastW >= 1100) !== (w >= 1100)) { S.drawer = w >= 1100; if (S.profil) render(); } lastW = w; });

/* ---------- démarrage ---------- */
(async function start(){
  const p = new URLSearchParams(location.search + "&" + location.hash.replace(/^#/, ""));
  const errDesc = p.get("error_description");
  if (errDesc) { history.replaceState(null, "", ICI); vLogin(messageErreur(errDesc)); return; }
  const { data: { session } } = await sb.auth.getSession();
  if (location.search) history.replaceState(null, "", ICI + location.hash);
  const rj = route();
  if (rj.v === "rejoindre" && rj.a) { try { localStorage.setItem("pp_join", rj.a); } catch (_) {} }
  if (!session) {
    S.public = true; await chargerPublic();
    if (rj.v === "rejoindre") { vLogin("Connecte-toi avec ton compte Microsoft 365 du lycée : tu rejoindras ensuite le cours automatiquement.", true); return; }
    renderPublic(); return;
  }
  let pj = null, suite = null, fresh = false;
  try { pj = localStorage.getItem("pp_join"); localStorage.removeItem("pp_join"); suite = localStorage.getItem("pp_next"); localStorage.removeItem("pp_next"); fresh = localStorage.getItem("pp_fresh") === "1"; localStorage.removeItem("pp_fresh"); } catch (_) {}
  if (pj && route().v !== "rejoindre") history.replaceState(null, "", ICI + "#/rejoindre/" + encodeURIComponent(pj));
  else if (suite && /^#\/[\w%\-\/.]*$/.test(suite) && route().v === "accueil") history.replaceState(null, "", ICI + suite);
  S.user = session.user;
  const { data: profil, error } = await sb.from("profiles").select("*").eq("id", S.user.id).maybeSingle();
  if (error || !profil) { vLogin("Ton profil n'a pas pu être chargé. Déconnecte-toi puis reconnecte-toi."); await sb.auth.signOut(); return; }
  S.profil = profil; S.prof = profil.role === "prof";
  if (S.prof) S.nom = R().prof.nom;
  else {
    const { data: ins } = await sb.from("inscriptions").select("nom").eq("email", profil.email).limit(1);
    S.nom = (ins && ins[0] && ins[0].nom) || (profil.nom && !profil.nom.includes("@") ? profil.nom : nomDepuisEmail(profil.email));
  }
  try { await chargerTout(); } catch (e) { app.innerHTML = `<div class="loading"><div class="notice">Impossible de charger tes données : ${esc(e.message)}</div></div>`; return; }
  if (S.prof) S.nom = R().prof.nom;
  try { S.recent = localStorage.getItem("pp_recent") === "1"; } catch (_) {}
  /* juste après la connexion : un élève inscrit dans un seul cours arrive directement dans ce cours */
  if (fresh && !S.prof && !pj && route().v === "accueil" && actives().length === 1) history.replaceState(null, "", ICI + "#/classe/" + encodeURIComponent(actives()[0].id));
  render();
  chargerNotifs().catch(() => {});
  if (S.prof) setTimeout(async () => { await transfererRendus(true); await genererCopies(true); }, 4000);
  if (S.prof) setInterval(() => { if (document.visibilityState === "visible") transfererRendus(true); }, 600000);
  setInterval(() => { if (document.visibilityState === "visible") chargerNotifs().catch(() => {}); }, 180000);
  sb.auth.onAuthStateChange(ev => { if (ev === "SIGNED_OUT") location.replace(ICI); });
})();
})();
