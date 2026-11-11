/* =====================================================================
   PhysiquePro · module 33 · 5e évaluation experte (11/11/2026)
   Lot P : les logos du haut qui ne tiennent pas en entier se rangent (ils restent dans Applications).
   Lot S : chaque page a un titre principal (h1, caché s'il n'y en a pas de visible) et des niveaux de titres réguliers.
   ===================================================================== */

/* ---------- P : logos du haut, seulement ceux qui tiennent en entier (ordinateur 1024 px, zoom, petits Android) */
function logosQuiTiennent(){
  document.querySelectorAll(".topbar .quick").forEach(nav => {
    const L = [...nav.querySelectorAll(":scope > a")];
    L.forEach(a => a.classList.remove("qcache"));
    if (!nav.offsetWidth) return;
    const bord = () => nav.getBoundingClientRect().right + 0.5;
    const visibles = () => L.filter(a => a.offsetWidth && !a.classList.contains("qcache"));
    /* bord droit VISIBLE d'un logo : son cadre .qi (plus large que le lien) + l'anneau vert de 2 px (box-shadow) — lot T de la 6e évaluation */
    const droite = a => { const q = a.querySelector(".qi"); let r = a.getBoundingClientRect().right; if (q) { const s = getComputedStyle(q).boxShadow.match(/0px 0px 0px (\d+(?:\.\d+)?)px/); r = Math.max(r, q.getBoundingClientRect().right + (s ? Number(s[1]) : 0)); } return r; };
    for (let v = visibles(), i = 0; v.length > 1 && i < L.length && (nav.scrollWidth > nav.clientWidth + 1 || droite(v[v.length - 1]) > bord()); v = visibles(), i++)
      v[v.length - 1].classList.add("qcache");
  });
}
let _logosT = null;
window.addEventListener("resize", () => { clearTimeout(_logosT); _logosT = setTimeout(logosQuiTiennent, 120); });

/* ---------- S : titres de la page */
function titresDeLaPage(){
  const m = document.querySelector("main.content"); if (!m) return;
  m.querySelectorAll("h1.vh[data-auto]").forEach(h => h.remove());
  if (![...m.querySelectorAll("h1")].some(h => h.offsetWidth || h.offsetHeight)) {
    const fil = document.querySelector(".topbar .curnom");
    const onglet = document.querySelector('.tabsbar [role="tab"][aria-selected="true"]');
    const t = [fil && fil.textContent.trim(), onglet && onglet.textContent.replace(/\s+\d+$/, "").trim()].filter(Boolean).join(" · ") || document.title || "PhysiquePro";
    const h = document.createElement("h1"); h.className = "vh"; h.dataset.auto = "1"; h.textContent = t;
    m.insertBefore(h, m.firstChild);
  }
  /* un titre ne saute pas de niveau (h1 puis h3) : on lui donne le niveau attendu pour les lecteurs d'écran */
  let prec = 0; const niv = {};
  m.querySelectorAll("h1,h2,h3,h4,h5,h6").forEach(h => {
    if (h.dataset.niv) { h.removeAttribute("aria-level"); delete h.dataset.niv; }
    if (!h.getClientRects().length) return;           /* titre caché : ignoré */
    const n = Number(h.tagName[1]);
    for (const k in niv) if (Number(k) > n) delete niv[k];
    const eff = niv[n] != null ? Math.min(niv[n], prec + 1) : Math.min(n, prec + 1);
    niv[n] = eff;
    if (eff !== n) { h.setAttribute("aria-level", String(eff)); h.dataset.niv = "1"; }
    prec = eff;
  });
}

APRES_RENDU.push(() => { logosQuiTiennent(); titresDeLaPage(); });
