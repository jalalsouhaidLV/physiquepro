/* ---------- notation : catégories et coefficients, grilles, remarques ---------- */
function itemsNotes(c){
  return [...S.devoirs.filter(d => d.classe_id === c.id && d.points != null && !d.brouillon).map(d => ({ k: "d", o: d })),
          ...S.quiz.filter(q => q.classe_id === c.id && q.mode === "note" && !q.brouillon).map(q => ({ k: "q", o: q }))];
}
function noteSur20(it, email, uid, pub){
  if (it.k === "q") { const r = uid && resultatDe(it.o, uid); return r ? noteQuiz(it.o, r) / it.o.points * 20 : null; }
  if (it.o.eleves && !it.o.eleves.includes(email)) return null;
  const cr = correctionDe(renduDe(it.o, email));
  if (!cr || cr.note == null || (pub && !cr.publiee)) return null;
  return cr.note / it.o.points * 20;
}
/* moyenne sur 20 : simple sans catégories ; pondérée par catégorie sinon (les travaux sans catégorie comptent avec un coefficient 1) */
function moyenneDe(c, email, uid, pub){
  const cats = (c.categories || []).filter(x => x && x.nom), grp = {};
  itemsNotes(c).forEach(it => { const v = noteSur20(it, email, uid, pub); if (v == null) return;
    const cat = cats.find(x => x.nom === it.o.categorie), key = cat ? cat.nom : "";
    (grp[key] = grp[key] || { coef: cat ? Number(cat.coef) || 0 : 1, v: [] }).v.push(v); });
  const g = Object.entries(grp).map(([nom, x]) => ({ nom: nom || "Sans catégorie", coef: x.coef, moy: x.v.reduce((a, b) => a + b, 0) / x.v.length, n: x.v.length }));
  if (!cats.length) { const all = Object.values(grp).flatMap(x => x.v); return { moy: all.length ? all.reduce((a, b) => a + b, 0) / all.length : null, parCat: [] }; }
  const pond = g.filter(x => x.coef > 0), sc = pond.reduce((a, x) => a + x.coef, 0);
  return { moy: sc ? pond.reduce((a, x) => a + x.coef * x.moy, 0) / sc : null, parCat: g };
}
const arrondi1 = x => x == null ? null : Math.round(x * 10) / 10;

/* bloc de notation (page du devoir et visionneuse) */
function blocNotation(d, rd, cr){
  const G = d.grille && d.grille.length ? d.grille : null, gv = (cr && cr.grille) || [];
  const rem = (R().remarques || []).length ? R().remarques : REMARQUES_DEFAUT;
  return `${G ? `<div class="grille"><b>Grille d'évaluation</b>${G.map((g, i) => `<label class="grow"><span>${esc(g.c)}</span><input id="gr-${i}" data-gr="${i}" type="number" min="0" max="${g.p}" step="0.25" inputmode="decimal" value="${gv[i] != null ? gv[i] : ""}" aria-label="${esc(g.c)}"><span class="muted">/${g.p}</span></label>`).join("")}</div>` : ""}
    ${d.points != null ? `<div class="gradeline"><label for="note">Note</label><input id="note" type="text" inputmode="decimal" autocomplete="off" pattern="[0-9]+([,.][0-9]+)?" aria-describedby="noteErr" value="${cr && cr.note != null ? String(cr.note).replace(".", ",") : ""}" ${G ? "readonly" : ""}><span class="muted">/${d.points}</span>${G ? `<small class="muted">calculée avec la grille</small>` : ""}</div>` : ""}
    <div class="field"><label for="noteCom">Commentaire pour l'élève <span class="muted">(visible quand tu rends le travail)</span></label><textarea id="noteCom" rows="2" placeholder="ex. Bon raisonnement, attention aux unités.">${esc(cr && cr.commentaire || "")}</textarea>
      ${rem.length ? `<div class="chips">${rem.map(t => `<button class="chip" data-act="remarque" data-t="${esc(t)}">${esc(t)}</button>`).join("")}</div>` : ""}</div>
    ${blocCompetences(cr)}${blocVocal(rd, cr)}
    <div id="noteErr" class="err" hidden></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">${d.points != null ? `<button class="btn ghost" data-act="savenote" data-id="${rd.id}" data-pub="0">Enregistrer le brouillon</button>` : ""}<button class="btn" data-act="savenote" data-id="${rd.id}" data-pub="1">${cr && cr.publiee ? "Mettre à jour" : "Rendre"}</button><button class="btn tonal" data-act="savenote" data-id="${rd.id}" data-pub="1" data-next="1" title="Ctrl + Entrée">${cr && cr.publiee ? "Mettre à jour" : "Rendre"} et passer au suivant ${icon("right")}</button></div>
    <p class="muted" style="margin:0;font-size:.8rem">${rd.binome_email ? "La note s'affiche pour les deux élèves du binôme." : "Seul l'élève voit sa note, une fois rendue."}</p>`;
}
function grilleEleve(d, c){
  if (!d.grille || !d.grille.length || !c || !c.grille) return "";
  return `<div class="grille lue">${d.grille.map((g, i) => `<div class="grow"><span>${esc(g.c)}</span><b class="mono nt">${c.grille[i] != null ? fmtNote(c.grille[i]) : "–"}</b><span class="muted">/${g.p}</span></div>`).join("")}</div>`;
}

/* ---------- images des questionnaires ---------- */
async function urlsSignees(paths){
  S.urls = S.urls || {};
  const manque = [...new Set(paths)].filter(p => !S.urls[p]); if (!manque.length) return;
  try { const { data } = await sb.storage.from("documents").createSignedUrls(manque, 3600); (data || []).forEach(x => { if (x.signedUrl) S.urls[x.path] = x.signedUrl; }); } catch (_) {}
}
async function imageQuestion(f){
  const e = S.ed, i = S.qimgFor; if (!e || i == null || !e.questions[i]) return;
  if (!/^image\//.test(f.type)) { toast("Choisis une image (photo, capture, schéma)."); return; }
  if (f.size > 8e6) { toast("Image trop lourde (8 Mo maximum)."); return; }
  toast("Envoi de l'image…");
  const path = e.classe_id + "/" + Date.now() + "-quiz-" + safeName(f.name);
  const { error } = await sb.storage.from("documents").upload(path, f, { upsert: false });
  if (error) { toast("Envoi impossible : " + error.message); return; }
  e.uploaded.push(path); e.questions[i].img = path; await urlsSignees([path]); render();
}
/* ordre aléatoire mais toujours le même pour un élève donné */
function melangeStable(n, graine){
  let h = 2166136261; for (const ch of String(graine)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  const a = [...Array(n).keys()], rnd = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; };
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
