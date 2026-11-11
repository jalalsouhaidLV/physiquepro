/* ---------- questionnaire (QCM) ---------- */
async function chargerResultatsQuiz(q, force){
  S.qr = S.qr || {};
  if (S.qr[q.id] && !force) return S.qr[q.id];
  const [r1, r2] = await Promise.all([
    sb.from("resultats_quiz").select("eleve, reponses, score, sur, fait_le").eq("quiz_id", q.id),
    sb.from("quiz_solutions").select("bonnes").eq("quiz_id", q.id).maybeSingle()
  ]);
  return S.qr[q.id] = { res: r1.data || [], bonnes: (r2.data && r2.data.bonnes) || [] };
}
const normTxt = t => sansAccent(String(t || "")).replace(/['’]/g, " ").replace(/\s+/g, " ").trim();
function juste(t, rep, bon){
  if (rep == null || bon == null) return false;
  if (t === "cases") return Array.isArray(rep) && Array.isArray(bon) && [...new Set(rep)].sort().join(",") === [...new Set(bon)].sort().join(",");
  if (t === "courte") return Array.isArray(bon) && normTxt(rep) !== "" && bon.some(a => normTxt(a) === normTxt(rep));
  if (t === "num") { const v = nombre(bon && bon.v), x = nombre(rep), tol = Number(bon && bon.tol) || 0; if (v == null || x == null) return false; return v === 0 ? Math.abs(x) <= tol / 100 : Math.abs(x - v) <= Math.abs(v) * tol / 100; }
  return Number(rep) === Number(bon);
}
const typeQ = x => x.t || "choix";
const TYPE_LIB = { choix: "Choix unique", cases: "Cases à cocher", courte: "Réponse courte", num: "Réponse numérique" };
const imgQ = x => x.img && S.urls && S.urls[x.img] ? (ecoActive() ? boutonEco(esc(S.urls[x.img]), "qpic") : `<img class="qpic" src="${esc(S.urls[x.img])}" alt="Illustration de la question" loading="lazy">`) : "";
const attendue = (t, b) => t === "num" ? (b ? fmtNote(nombre(b.v)) + (Number(b.tol) ? " (± " + fmtNote(b.tol) + " %)" : "") : "") : (b || []).map(esc).join(" ou ");
function vQuiz(r){
  const q = S.quiz.find(x => String(x.id) === r.a);
  if (!q) return `<div class="page"><div class="emptystate"><b>Questionnaire introuvable.</b><a href="#/">Retour à l'accueil</a></div></div>`;
  const c = cls(q.classe_id), k = C(c && c.couleur), qs = q.questions || [];
  const head = `<div class="dvhead"><span class="ico">${icon("quiz", "")}</span><div style="flex:1;min-width:0"><h1>${esc(q.titre)}</h1>
    <div class="muted" style="font-size:.88rem;margin-top:4px">${esc(R().prof.nom)} · ${fmtShort(D(q.publie_le))}${S.prof && q.brouillon ? " · <i>Brouillon</i>" : ""}</div>
    <div class="dvmeta"><b>${q.mode === "note" ? "Noté sur " + q.points + " · une seule tentative" : "Entraînement · recommençable"}</b><span>${q.date_limite ? dueTxt(D(q.date_limite)) : "Aucune date limite"}</span></div></div>
    ${S.prof ? `<a class="ib" href="#/editer/questionnaire/${q.id}" title="Modifier" aria-label="Modifier le questionnaire">${icon("edit")}</a>` : ""}</div>
    ${q.consigne ? `<div class="dvbody"><div class="consignehead">${btnEcouter("qconsigne-" + q.id)}</div><div class="richtext" id="qconsigne-${q.id}">${rich(q.consigne)}</div></div>` : ""}`;
  if (S.prof) {
    const data = S.qr && S.qr[q.id], el = elevesDuDevoir(q, (S.cache[q.classe_id] || {eleves:[]}).eleves);
    if (!data) return `<div class="page" style="--c:var(${k.c})">${head}<div class="loading"><div><div class="spin"></div>Chargement des résultats…</div></div></div>`;
    const parEmail = {}; data.res.forEach(x => parEmail[S.profils[x.eleve]] = x);
    const moy = data.res.length ? data.res.reduce((a, x) => a + noteQuiz(q, x), 0) / data.res.length : null;
    return `<div class="page" style="--c:var(${k.c})">${head}
      ${q.mode === "note" ? `<div class="stats"><div><b>${data.res.length}/${el.length}</b><small>Réponses</small></div><div><b>${moy == null ? "–" : fmtNote(Math.round(moy * 10) / 10)}</b><small>Moyenne /${q.points}</small></div></div>
      <div class="tablewrap"><table><thead><tr><th class="first">Élève</th><th>Envoyé le</th><th>Bonnes réponses</th><th>Note /${q.points}</th></tr></thead><tbody>
      ${el.map(e => { const x = parEmail[e.email]; return `<tr><td class="first">${esc(e.nom)}</td><td class="muted">${x ? fmtShort(D(x.fait_le)) + " " + fmtT(D(x.fait_le)) : ""}</td><td class="mono">${x ? x.score + "/" + x.sur : ""}</td><td class="mono">${x ? fmtNote(noteQuiz(q, x)) : `<span class="pill">Non fait</span>`}</td></tr>`; }).join("") || `<tr><td colspan="4" class="muted">Aucun élève dans ce cours.</td></tr>`}</tbody></table></div>`
        : `<div class="notice">Questionnaire d'entraînement : les réponses des élèves ne sont pas enregistrées.</div>`}
      <section class="card">${qs.map((x, i) => { const t = typeQ(x), b = data.bonnes[i], ok = q.mode === "note" && data.res.length ? Math.round(data.res.filter(r2 => r2.reponses && juste(t, r2.reponses[i], b)).length / data.res.length * 100) : null;
        const estBon = j => t === "cases" ? (b || []).includes(j) : b === j;
        return `<div class="q"><b>${i + 1}. ${sci(x.q)}</b> <span class="pill">${TYPE_LIB[t]}</span>${imgQ(x)}
          ${t === "courte" || t === "num" ? `<div class="opt good">${icon("check")} ${attendue(t, b)}</div>` : x.o.map((o, j) => `<div class="opt ${estBon(j) ? "good" : ""}">${estBon(j) ? icon("check") : `<span style="width:22px"></span>`} ${sci(o)}</div>`).join("")}
          ${ok != null ? `<span class="muted" style="font-size:.82rem">${ok} % de bonnes réponses</span>` : ""}</div>`; }).join("")}</section>${pageFoot()}</div>`;
  }
  const deja = resultatDe(q, S.user.id), res = S.quizRes[q.id], rep = S.quizRep[q.id] || {};
  const ferme = q.date_limite && D(q.date_limite) <= now();
  if (q.mode === "note" && deja && !res) return `<div class="page" style="--c:var(${k.c})">${head}<section class="yourwork"><header><h2>Questionnaire envoyé</h2><span class="pill ok">${fmtNote(noteQuiz(q, deja))}/${q.points}</span></header><p class="muted" style="margin:0">Tu as répondu le ${fmtShort(D(deja.fait_le))} à ${fmtT(D(deja.fait_le))} : ${deja.score} bonne${deja.score > 1 ? "s" : ""} réponse${deja.score > 1 ? "s" : ""} sur ${deja.sur}.</p></section>${pageFoot()}</div>`;
  if (ferme && !res) return `<div class="page" style="--c:var(${k.c})">${head}<section class="yourwork"><header><h2>Questionnaire fermé</h2><span class="pill bad">Date limite passée</span></header></section>${pageFoot()}</div>`;
  const b = res && res.bonnes;
  return `<div class="page" style="--c:var(${k.c})">${head}
    <section class="card">${(q.melanger ? melangeStable(qs.length, S.user.id + ":" + q.id) : qs.map((_, i) => i)).map((i, rang) => { const x = qs[i], t = typeQ(x), num = rang + 1;
      if (t === "courte" || t === "num") { const ok = res && b ? juste(t, rep[i], b[i]) : null;
        return `<div class="q"><b>${num}. ${sci(x.q)}</b>${btnEcouter("", x.q + (x.o && x.o.length ? ". Réponses possibles : " + x.o.map(String).join(" ; ") : ""), true)}${imgQ(x)}<input class="qans ${ok === true ? "good" : ok === false ? "wrong" : ""}" data-act="anstxt" data-q="${q.id}" data-i="${i}" value="${esc(rep[i] || "")}" placeholder="${t === "num" ? "Ta réponse (ex. 2,4×10^-3)" : "Ta réponse"}" ${t === "num" ? 'inputmode="decimal"' : ""} aria-label="Réponse à la question ${num}" ${res ? "disabled" : ""}>${t === "num" && !res ? clavierPhysique(q.id, i) : ""}${res && b && !ok ? `<span class="muted" style="font-size:.85rem">Réponse attendue : ${attendue(t, b[i])}</span>` : ""}</div>`; }
      const coche = j => t === "cases" ? (rep[i] || []).includes(j) : rep[i] === j, bonne = j => t === "cases" ? ((b && b[i]) || []).includes(j) : b && j === b[i];
      const ordreO = q.melanger ? melangeStable(x.o.length, S.user.id + ":" + q.id + ":" + i) : x.o.map((_, j) => j);
      return `<div class="q"><b>${num}. ${sci(x.q)}</b>${btnEcouter("", x.q + (x.o && x.o.length ? ". Réponses possibles : " + x.o.map(String).join(" ; ") : ""), true)}${imgQ(x)}${t === "cases" ? `<span class="muted" style="font-size:.8rem">Plusieurs réponses possibles</span>` : ""}${ordreO.map(j => { const o = x.o[j]; let cl = ""; if (res && b) { if (bonne(j)) cl = "good"; else if (coche(j)) cl = "wrong"; }
        return `<label class="opt ${cl}"><input type="${t === "cases" ? "checkbox" : "radio"}" name="q${i}" data-act="${t === "cases" ? "anscase" : "ans"}" data-q="${q.id}" data-i="${i}" data-j="${j}" ${coche(j) ? "checked" : ""} ${res ? "disabled" : ""}> ${sci(o)}</label>`; }).join("")}</div>`; }).join("")}
      <div class="q">${res ? `<div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap"><span class="grade">${res.score}<small>/${res.sur}</small></span>${q.mode === "note" ? `<span>Note : <b>${fmtNote(Math.round(res.score / Math.max(1, res.sur) * q.points * 100) / 100)}/${q.points}</b></span>` : `<button class="btn ghost" data-act="retry" data-q="${q.id}">Recommencer</button>`}${!b ? `<span class="muted">La correction n'est pas affichée pour ce questionnaire.</span>` : ""}</div>`
        : `${quiRend()}<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button class="btn" data-act="valider" data-q="${q.id}" ${S.sending ? "disabled" : ""}>${S.sending ? "Envoi…" : "Envoyer"}</button>${q.mode === "note" ? `<span class="muted" style="font-size:.85rem">Une seule tentative : vérifie tes réponses avant d'envoyer.</span>` : ""}</div>`}</div>
    </section>${actionsTelDevoir(q, "quiz")}${pageFoot()}</div>`;
}
async function envoyerQuiz(qid){
  const q = S.quiz.find(x => x.id === qid), rep = S.quizRep[qid] || {}, n = (q.questions || []).length;
  const vide = i => { const v = rep[i], t = typeQ(q.questions[i]); return v == null || (t === "cases" && !v.length) || ((t === "courte" || t === "num") && !String(v).trim()); };
  if ([...Array(n)].some((_, i) => vide(i))) { toast("Réponds à toutes les questions avant d'envoyer."); return; }
  if (!enLigne()) { toast("Pas de connexion Internet : tes réponses restent gardées sur ce téléphone. Réessaie dès que le réseau revient."); return; }
  S.sending = true; render();
  const { data, error } = await envoiAvecEssais(() => sb.rpc("soumettre_quiz", { qid, reponses: [...Array(n)].map((_, i) => { const v = rep[i], t = typeQ(q.questions[i]); return v == null ? null : t === "cases" ? v.slice().sort((a, b2) => a - b2) : t === "courte" ? String(v).trim() : t === "num" ? (nombre(v) != null ? String(nombre(v)) : String(v).trim()) : v; }) }));
  S.sending = false;
  if (error) { render(); toast(error.message); return; }
  S.quizRes[qid] = data;
  oublierBrouillonQuiz(qid);
  if (q.mode === "note") await rafraichir();
  render(); if (q.mode === "note") confirmationRendu(q, "Questionnaire envoyé !");
}
