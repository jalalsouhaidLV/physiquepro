/* =====================================================================
   PhysiquePro · module 35 · 7e évaluation experte (lot U, 12/11/2026)
   U4 : sur téléphone, barre « Ton travail · Rendre » sur la page d'un devoir à rendre.
   U7 : le message « Il manque ta réponse » disparaît au changement de page et, sur ordinateur, mène à la question oubliée.
   ===================================================================== */

/* ---------- U4 : barre « Ton travail · Rendre » */
let _rendreObs = null;
function barreRendre(){
  let b = document.getElementById("ppRendre");
  if (_rendreObs) { _rendreObs.disconnect(); _rendreObs = null; }
  const r = route(), zone = document.querySelector("main.content .yourwork");
  const pill = zone && zone.querySelector("header .pill");
  const fini = !pill || /Rendu|Noté|Envoyée/.test(pill.textContent);
  if (S.prof || r.v !== "devoir" || !zone || fini || !zone.querySelector('[data-act="submit"]')) { if (b) b.remove(); return; }
  if (!b) {
    b = document.createElement("button"); b.id = "ppRendre"; b.type = "button";
    b.addEventListener("click", () => { const z = document.querySelector("main.content .yourwork"); if (!z) return; z.scrollIntoView({ behavior: "smooth", block: "start" }); const s = z.querySelector('[data-act="submit"]'); if (s) setTimeout(() => s.focus({ preventScroll: true }), 400); });
    document.body.appendChild(b);
  }
  b.innerHTML = `${icon("send")} Ton travail · Rendre`;
  b.setAttribute("aria-label", "Aller à ton travail pour le rendre");
  /* la barre se cache dès que le bouton « Rendre » lui-même est à l'écran */
  if ("IntersectionObserver" in window) { _rendreObs = new IntersectionObserver(es => { const v = es.some(e => e.isIntersecting); const x = document.getElementById("ppRendre"); if (x) x.hidden = v; }, { rootMargin: "0px 0px -90px 0px" }); _rendreObs.observe(zone.querySelector('[data-act="submit"]')); }
}
APRES_RENDU.push(barreRendre);

/* ---------- U7 : message « Il manque… » */
window.addEventListener("hashchange", () => { const t = document.getElementById("toast"); if (t && /^Il manque t/.test(t.textContent)) t.hidden = true; });
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest('[data-act="valider"]'); if (!b || document.querySelector("section.uneq")) return;
  const sec = b.closest("section.card") || document.querySelector("main.content .page > section.card"); if (!sec) return;
  const qs = [...sec.querySelectorAll(":scope > .q")].filter(x => x.querySelector("input,textarea,select"));
  const rep = x => [...x.querySelectorAll("input,textarea,select")].some(i => (i.type === "radio" || i.type === "checkbox") ? i.checked : String(i.value || "").trim() !== "");
  const vide = qs.find(x => !rep(x)); if (!vide) return;
  setTimeout(() => {
    vide.classList.add("qmanque"); vide.scrollIntoView({ behavior: "smooth", block: "center" });
    const i = vide.querySelector("input,textarea,select"); if (i) setTimeout(() => i.focus({ preventScroll: true }), 350);
    const enlever = () => vide.classList.remove("qmanque"); vide.addEventListener("change", enlever, { once: true }); vide.addEventListener("input", enlever, { once: true });
  }, 0);
}, true);
