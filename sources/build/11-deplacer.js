/* ---------- déplacer les cours (glisser-déposer, comme Classroom) ---------- */
async function enregistrerOrdre(ids){
  if (S.prof) {
    ids.forEach((id, n) => { const c = cls(id); if (c) c.ordre = n + 1; });
    S.classes.sort((a, b) => (a.archive - b.archive) || (a.ordre - b.ordre));
    render();
    const res = await Promise.all(ids.map((id, n) => sb.from("classes").update({ ordre: n + 1 }).eq("id", id)));
    if (res.some(x => x.error)) { toast("L'ordre n'a pas pu être enregistré."); await rafraichir(); render(); }
  } else {
    try { localStorage.setItem("pp_ordre_" + S.user.id, JSON.stringify(ids)); } catch (_) {}
    render();
  }
}
function deplacerA(id, pos){
  const ids = actives().map(c => c.id).filter(x => x !== id);
  ids.splice(Math.max(0, Math.min(pos, ids.length)), 0, id);
  return enregistrerOrdre(ids);
}
const DG = { el: null, ghost: null, x0: 0, y0: 0, dx: 0, dy: 0, on: false, timer: null, pid: null, bloqueClic: false };
function finDrag(annule){
  clearTimeout(DG.timer);
  if (DG.on) {
    const ids = [...document.querySelectorAll(".cards .ccard.movable")].map(x => x.dataset.cid);
    DG.ghost && DG.ghost.remove(); DG.el.classList.remove("dragph"); document.body.classList.remove("dragging");
    DG.bloqueClic = true; setTimeout(() => { DG.bloqueClic = false; }, 50);
    const avant = actives().map(c => c.id).join();
    if (!annule && ids.join() !== avant) enregistrerOrdre(ids); else render();
  }
  DG.el = null; DG.ghost = null; DG.on = false; DG.pid = null;
}
function debutDrag(){
  const r = DG.el.getBoundingClientRect();
  DG.dx = DG.x0 - r.left; DG.dy = DG.y0 - r.top;
  const g = DG.el.cloneNode(true); g.classList.add("dragghost"); g.style.width = r.width + "px"; g.style.height = r.height + "px";
  g.style.left = r.left + "px"; g.style.top = r.top + "px"; document.body.appendChild(g);
  DG.ghost = g; DG.on = true; DG.el.classList.add("dragph"); document.body.classList.add("dragging");
  fermerMenus();
}
function bougeDrag(x, y){
  DG.ghost.style.left = (x - DG.dx) + "px"; DG.ghost.style.top = (y - DG.dy) + "px";
  const sous = document.elementFromPoint(x, y), cible = sous && sous.closest(".cards .ccard.movable");
  if (cible && cible !== DG.el) {
    const list = [...document.querySelectorAll(".cards .ccard.movable")], i = list.indexOf(DG.el), j = list.indexOf(cible);
    cible.parentNode.insertBefore(DG.el, i < j ? cible.nextSibling : cible);
  }
  if (y < 70) window.scrollBy(0, -12); else if (y > window.innerHeight - 50) window.scrollBy(0, 12);
}
document.addEventListener("pointerdown", e => {
  if (e.button !== 0 || route().v !== "accueil") return;
  const card = e.target.closest(".cards .ccard.movable");
  if (!card || e.target.closest(".dd-menu") || e.target.closest("input")) return;
  DG.el = card; DG.x0 = e.clientX; DG.y0 = e.clientY; DG.pid = e.pointerId; DG.on = false;
  if (e.pointerType === "touch") DG.timer = setTimeout(() => { if (DG.el && !DG.on) { debutDrag(); bougeDrag(DG.x0, DG.y0); if (navigator.vibrate) try { navigator.vibrate(20); } catch (_) {} } }, 380);
});
document.addEventListener("pointermove", e => {
  if (!DG.el || e.pointerId !== DG.pid) return;
  if (!DG.on) {
    const d = Math.hypot(e.clientX - DG.x0, e.clientY - DG.y0);
    if (e.pointerType === "touch") { if (d > 10) { clearTimeout(DG.timer); DG.el = null; } return; }
    if (d < 6) return;
    debutDrag();
  }
  e.preventDefault(); bougeDrag(e.clientX, e.clientY);
});
document.addEventListener("touchmove", e => { if (DG.on) e.preventDefault(); }, { passive: false });
document.addEventListener("pointerup", e => { if (DG.el && e.pointerId === DG.pid) finDrag(false); });
document.addEventListener("pointercancel", () => { if (DG.el) finDrag(true); });
document.addEventListener("click", e => { if (DG.bloqueClic) { e.preventDefault(); e.stopPropagation(); } }, true);
document.addEventListener("dragstart", e => { if (e.target.closest && e.target.closest(".cards .ccard.movable")) e.preventDefault(); });

/* ---------- déplacer les thèmes et les travaux (onglet Travaux et devoirs) ---------- */
const DT = { el: null, kind: null, ghost: null, x0: 0, y0: 0, dx: 0, dy: 0, on: false, pid: null, timer: null, depuis: null };
const sections = () => [...document.querySelectorAll(".page section.theme.movable")];
function dtDebut(){
  const r = DT.el.getBoundingClientRect(), src = DT.kind === "theme" ? DT.el.querySelector(".themehead") : DT.el;
  const g = src.cloneNode(true); g.classList.add("dragghost", "dtghost"); g.style.width = r.width + "px";
  DT.dx = DT.x0 - r.left; DT.dy = DT.y0 - r.top; g.style.left = r.left + "px"; g.style.top = r.top + "px";
  document.body.appendChild(g); DT.ghost = g; DT.on = true; DT.el.classList.add("dtph"); document.body.classList.add("dragging");
  if (DT.kind === "theme") document.querySelectorAll(".page section.theme").forEach(x => x.classList.add("compact"));
  DT.depuis = DT.kind === "item" ? DT.el.closest("section.theme").dataset.tid : null;
  DT.avant = DT.kind === "item" ? [...DT.el.closest("section.theme").querySelectorAll(".work[data-wk]")].map(x => x.dataset.wk).join() : null; fermerMenus();
}
function dtBouge(x, y){
  DT.ghost.style.left = (x - DT.dx) + "px"; DT.ghost.style.top = (y - DT.dy) + "px";
  DT.px = x; DT.py = y;
  const sous = document.elementFromPoint(x, y);
  if (DT.kind === "theme") {
    const autres = sections().filter(x => x !== DT.el && x.dataset.tid !== "none");
    if (autres.length) {
      const avant = autres.find(x => { const r = x.getBoundingClientRect(); return y < r.top + r.height / 2; });
      const ref = avant || autres[autres.length - 1].nextSibling;
      if (ref !== DT.el && ref !== DT.el.nextSibling) autres[0].parentNode.insertBefore(DT.el, ref);
    }
  } else {
    if (!sous) return;
    const sec = sous.closest("section.theme.movable"); if (!sec) return;
    const w = sous.closest(".work[data-wk]");
    if (w && w !== DT.el && sec.contains(w)) { const r = w.getBoundingClientRect(); w.parentNode.insertBefore(DT.el, y < r.top + r.height / 2 ? w : w.nextSibling); }
    else if (!w && !sec.contains(DT.el)) { const vide = sec.querySelector("p.empty"); if (vide) vide.remove(); sec.appendChild(DT.el); }
  }
}
/* défilement automatique continu quand le pointeur reste près du haut ou du bas de l'écran */
setInterval(() => {
  if (!DT.on || DT.py == null) return;
  const h = window.innerHeight, v = DT.py < 110 ? -Math.ceil((110 - DT.py) / 6) : DT.py > h - 80 ? Math.ceil((DT.py - h + 80) / 5) : 0;
  if (v) { window.scrollBy(0, v); dtBouge(DT.px, DT.py); }
}, 16);
async function dtFin(annule){
  clearTimeout(DT.timer);
  const was = DT.on, kind = DT.kind, el = DT.el, depuis = DT.depuis, cid = route().a;
  DT.el = null; DT.on = false; DT.pid = null; DT.py = null;
  if (!was) return;
  DT.ghost && DT.ghost.remove(); el.classList.remove("dtph"); document.body.classList.remove("dragging");
  document.querySelectorAll(".page section.theme.compact").forEach(x => x.classList.remove("compact"));
  DG.bloqueClic = true; setTimeout(() => { DG.bloqueClic = false; }, 50);
  if (annule) return render();
  if (kind === "theme") {
    const ids = sections().map(x => x.dataset.tid).filter(x => x !== "none");
    const data = S.cache[cid]; if (!data) return render();
    if (ids.join() === data.themes.map(t => String(t.id)).join()) return render();
    data.themes.sort((a, b) => ids.indexOf(String(a.id)) - ids.indexOf(String(b.id))); data.themes.forEach((t, n) => t.ordre = n + 1); render();
    const res = await Promise.all(ids.map((id, n) => sb.from("themes").update({ ordre: n + 1 }).eq("id", id)));
    if (res.some(x => x.error)) toast("L'ordre des thèmes n'a pas pu être enregistré."); else toast("Thèmes réorganisés");
    delete S.cache[cid]; return render();
  }
  const sec = el.closest("section.theme"), vers = sec.dataset.tid, wks = [...sec.querySelectorAll(".work[data-wk]")].map(x => x.dataset.wk);
  if (vers === depuis && wks.join() === DT.avant) return render();
  return ordonnerItems(cid, vers, wks, vers !== depuis ? el.dataset.wk : null);
}
/* enregistre l'ordre des éléments d'un thème (et le changement de thème éventuel) */
async function ordonnerItems(cid, tid, wks, change){
  const T = { devoir: "devoirs", support: "supports", quiz: "quiz" }, theme = tid === "none" ? null : Number(tid);
  const trouve = (k, id) => k === "devoir" ? S.devoirs.find(x => String(x.id) === id) : k === "quiz" ? S.quiz.find(x => String(x.id) === id) : ((S.cache[cid] || {}).supports || []).find(x => String(x.id) === id);
  wks.forEach((w, n) => { const [k, id] = w.split(":"), o = trouve(k, id); if (o) { o.position = n + 1; if (w === change) o.theme_id = theme; } });
  render();
  const res = await Promise.all(wks.map((w, n) => { const [k, id] = w.split(":"), row = { position: n + 1 }; if (w === change) row.theme_id = theme; return sb.from(T[k]).update(row).eq("id", id); }));
  const err = res.find(x => x.error);
  if (err) toast(/position/.test(err.error.message) ? "Mise à jour de la base nécessaire (étape 12)." : "Déplacement impossible : " + err.error.message);
  else toast(change ? (tid === "none" ? "Déplacé dans « Aucun thème »" : "Déplacé dans le thème") : "Ordre enregistré");
  await rafraichir(cid); render();
}
document.addEventListener("pointerdown", e => {
  if (e.button !== 0 || !S.prof) return;
  const r = route(); if (r.v !== "classe" || (r.t && r.t !== "travaux") || (!r.t && fluxVisible(cls(r.a) || {}))) return;
  if (e.target.closest(".dd, .dd-menu, input, select")) return;
  const head = e.target.closest("section.theme.movable .themehead"), work = e.target.closest(".work[data-wk]");
  let el = null, kind = null;
  if (head && head.parentNode.dataset.tid !== "none" && !e.target.closest("button")) { el = head.parentNode; kind = "theme"; }
  else if (work && !e.target.closest(".workd")) { el = work; kind = "item"; }
  if (!el) return;
  Object.assign(DT, { el, kind, x0: e.clientX, y0: e.clientY, pid: e.pointerId, on: false });
  if (e.pointerType === "touch") DT.timer = setTimeout(() => { if (DT.el && !DT.on) { dtDebut(); dtBouge(DT.x0, DT.y0); } }, 380);
});
document.addEventListener("pointermove", e => {
  if (!DT.el || e.pointerId !== DT.pid) return;
  if (!DT.on) { const d = Math.hypot(e.clientX - DT.x0, e.clientY - DT.y0);
    if (e.pointerType === "touch") { if (d > 10) { clearTimeout(DT.timer); DT.el = null; } return; }
    if (d < 6) return; dtDebut(); }
  e.preventDefault(); dtBouge(e.clientX, e.clientY);
});
document.addEventListener("touchmove", e => { if (DT.on) e.preventDefault(); }, { passive: false });
document.addEventListener("pointerup", e => { if (DT.el && e.pointerId === DT.pid) dtFin(false); });
document.addEventListener("pointercancel", () => { if (DT.el) dtFin(true); });

/* place un thème à la position voulue (0 = premier) et enregistre l'ordre */
async function placerTheme(cid, id, pos){
  const data = await chargerClasse(cid), th = data.themes.slice(), i = th.findIndex(t => String(t.id) === String(id));
  if (i < 0) return render();
  const [t] = th.splice(i, 1); th.splice(Math.max(0, Math.min(pos, th.length)), 0, t);
  if (th.map(x => x.id).join() === data.themes.map(x => x.id).join()) return render();
  th.forEach((x, n) => x.ordre = n + 1); data.themes = th; render();
  const res = await Promise.all(th.map((x, n) => sb.from("themes").update({ ordre: n + 1 }).eq("id", x.id)));
  if (res.some(x => x.error)) toast("Déplacement impossible."); else toast("Thème déplacé");
  delete S.cache[cid]; render();
}
