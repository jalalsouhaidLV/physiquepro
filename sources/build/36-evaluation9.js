/* =====================================================================
   9e évaluation (12/11/2026), lot X1 : un mot composé ne se coupe plus
   au trait d'union en fin de ligne (« qu'est- / ce », « transporte-t- / elle »).
   Un « gluon » invisible (U+2060, WORD JOINER) est placé de part et d'autre
   du trait d'union entre deux lettres, dans tout le texte affiché.
   Ne touche ni aux champs de saisie, ni à l'éditeur, ni aux adresses web.
   ===================================================================== */
const SOUDE_RE = /(\p{L})-(?=\p{L})/gu, SOUDE_JOINT = "⁠";
const SOUDE_EXCLU = "input,textarea,select,option,script,style,pre,code,kbd,[contenteditable],.noglue,.att,.rcard,.reponse,[download]";
function souderTexte(n){
  const t = n.nodeValue;
  if (!t || !/[-?!;:«»]/.test(t) || /https?:\/\/|www\.|\.[a-z0-9]{2,4}\b|_/i.test(t)) return;
  const p = n.parentElement; if (!p || p.closest(SOUDE_EXCLU)) return;
  /* + typographie française : espace insécable avant ? ! ; : » et après « (plus de « ? » ou de « « » seul en bout de ligne) */
  const v = t.replace(SOUDE_RE, (m, a) => a + SOUDE_JOINT + "-" + SOUDE_JOINT).replace(/ ([?!;:»])/g, "\u00a0$1").replace(/« /g, "«\u00a0");
  if (v !== t) n.nodeValue = v;
}
function souder(racine){
  if (!racine) return;
  if (racine.nodeType === 3) return souderTexte(racine);
  if (racine.nodeType !== 1 || racine.closest(SOUDE_EXCLU)) return;
  const w = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) souderTexte(n);
}
if (typeof document !== "undefined" && typeof MutationObserver === "function") {
  const aSouder = new Set(); let prevu = false;
  const obs = new MutationObserver(ms => {
    for (const m of ms) m.addedNodes.forEach(x => aSouder.add(x));
    if (!prevu) { prevu = true; queueMicrotask(() => { prevu = false; const l = [...aSouder]; aSouder.clear(); l.forEach(souder); }); }
  });
  const go = () => { souder(document.body); obs.observe(document.body, { childList: true, subtree: true }); };
  if (document.body) go(); else document.addEventListener("DOMContentLoaded", go);
}

/* Audit final : un menu déroulant ou une fenêtre ouverte reste toujours entièrement dans l'écran
   (téléphone en paysage : le menu des applications et la cloche sortaient à gauche). */
function garderDansEcran(m){
  if (!m || !m.getBoundingClientRect) return;
  m.style.translate = "";
  const r = m.getBoundingClientRect(), W = document.documentElement.clientWidth, H = window.innerHeight, marge = 8;
  if (!r.width) return;
  let dx = 0;
  if (r.left < marge) dx = marge - r.left; else if (r.right > W - marge) dx = Math.max(marge - r.left, W - marge - r.right);
  if (dx) m.style.translate = Math.round(dx) + "px 0";
  if (getComputedStyle(m).position !== "static" && r.top < H && r.bottom > H - marge && r.height > 120) { m.style.maxHeight = Math.max(160, H - Math.max(r.top, 0) - marge) + "px"; m.style.overflowY = "auto"; }
}
if (typeof document !== "undefined" && typeof MutationObserver === "function") {
  const verifMenus = () => document.querySelectorAll(".dd-menu").forEach(garderDansEcran);
  new MutationObserver(ms => { if (ms.some(m => [...m.addedNodes].some(n => n.nodeType === 1 && (n.matches(".dd-menu") || n.querySelector(".dd-menu"))))) requestAnimationFrame(verifMenus); })
    .observe(document.documentElement, { childList: true, subtree: true });
  addEventListener("resize", verifMenus);
}
