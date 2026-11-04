/* =====================================================================
   Animations de l'interface : entrée des pages, compteurs, voyant,
   défi du jour à retourner, flashcards à glisser
   (tout est coupé si l'utilisateur demande « moins d'animations »)
   ===================================================================== */
const ANIM = { cle: null, vals: {}, t: null };
const moinsAnim = () => !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) || document.documentElement.classList.contains("a11y-calme");
const cleRoute = () => (location.hash || "#/").split("?")[0];

/* 1 + 6 : apparition des cartes l'une après l'autre, seulement quand on change de page */
function animerEntree(){
  const main = app.querySelector("main.content"); if (!main) return;
  const k = cleRoute() + (S.public ? "|p" : "") + "|" + (S.phyOng || "") + "|" + (FC && FC.rev ? "rev" : "");
  if (k === ANIM.cle) return; ANIM.cle = k;
  if (moinsAnim()) return;
  main.classList.add("entree");
  let i = 0; main.querySelectorAll(".ccard, .kpi, .decarte, .simcarte, .labcarte, .fcchap, .etape, .theme, .homepanel, .pubres a, .edcard").forEach(el => { if (i < 14) el.style.setProperty("--i", i++); });
  clearTimeout(ANIM.t); ANIM.t = setTimeout(() => { const m = app.querySelector("main.content"); if (m) m.classList.remove("entree"); }, 1400);
}

/* 3 : les compteurs défilent jusqu'à leur valeur (seulement quand la valeur change) */
function animerCompteurs(){
  document.querySelectorAll(".compteur .cpt").forEach((c, n) => {
    const b = c.querySelector("b"); if (!b) return; const fin = parseInt(b.textContent, 10); if (!isFinite(fin)) return;
    const cle = c.getAttribute("title") || "c" + n, dep = ANIM.vals[cle] ?? 0; ANIM.vals[cle] = fin;
    if (dep === fin || moinsAnim()) return;
    const t0 = performance.now(), dur = Math.min(1200, 400 + Math.abs(fin - dep) * 6);
    if (dep !== 0) c.classList.add("bump");
    const pas = t => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); b.textContent = Math.round(dep + (fin - dep) * e); if (p < 1) requestAnimationFrame(pas); else setTimeout(() => c.classList.remove("bump"), 300); };
    b.textContent = dep; requestAnimationFrame(pas);
  });
}
const _chargerStatsVisites = chargerStatsVisites;
chargerStatsVisites = async function(){ await _chargerStatsVisites(); animerCompteurs(); };

/* 2 : le voyant du professeur signale son changement d'état */
const _chargerStatutProf = chargerStatutProf;
chargerStatutProf = async function(){
  const avant = STP.d ? !!STP.d.actif : null; await _chargerStatutProf(); const apres = STP.d ? !!STP.d.actif : null;
  if (avant !== null && apres !== avant) document.querySelectorAll(".statprof .stp").forEach(s => { s.classList.add("change"); setTimeout(() => s.classList.remove("change"), 2400); });
};

/* après chaque affichage complet de la page */
new MutationObserver(() => requestAnimationFrame(() => { animerEntree(); animerCompteurs(); })).observe(app, { childList: true });

/* 4 : confettis discrets autour de la coche de réussite */
function confettis(box){
  if (moinsAnim() || !box) return;
  const couleurs = ["#1E8E3E", "#1A73E8", "#F9AB00", "#D93025", "#A142F4", "#12B5CB"];
  for (let k = 0; k < 26; k++) {
    const p = document.createElement("i"); p.className = "confetti";
    const a = Math.random() * Math.PI * 2, d = 90 + Math.random() * 120;
    p.style.cssText = `--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d - 40}px;--r:${Math.random() * 720 - 360}deg;--c:${couleurs[k % couleurs.length]};animation-delay:${.35 + Math.random() * .15}s`;
    box.appendChild(p);
  }
}

/* 18 : défi du jour, la carte se retourne pour montrer l'explication */
function carteDefiFlip(){
  const I = defisPourMoi(), i = DEC.defi ?? I[(jourN() * 5) % I.length], [niv, q, opts, ok, expl] = DEFIS[i], r = DEC.rep, bon = r === ok;
  return `<article class="decarte decdefi flipcarte${r != null && DEC.flip ? " retourne" : ""}" id="decDefi"><div class="defiflip">
    <div class="defiface recto"${r != null && DEC.flip ? ' aria-hidden="true"' : ""}><small class="declbl">${icon("quiz")} Défi du jour <span class="simniv">${esc(niv)}</span></small><h3>${esc(q)}</h3>
      <div class="defiopts">${opts.map((o, k) => `<button class="defiopt${r == null ? "" : k === ok ? " bon" : k === r ? " faux" : " off"}" data-act="defirep" data-k="${k}" ${r == null ? "" : "disabled"}>${esc(o)}</button>`).join("")}</div>
      ${r == null ? `<p class="defiaide">Choisis une réponse : la carte se retourne pour t'expliquer.</p>` : `<button class="linkbtn" data-act="defivoir">${icon("restore")} Voir l'explication</button>`}</div>
    <div class="defiface verso"${r != null && DEC.flip ? "" : ' aria-hidden="true"'}>${r == null ? "" : `<small class="declbl">${icon("quiz")} Défi du jour <span class="simniv">${esc(niv)}</span></small>
      <div class="defiverdict ${bon ? "ok" : "ko"}"><svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="23"/>${bon ? '<path d="M15 27l7 7 15-16"/>' : '<path d="M18 18l16 16M34 18 18 34"/>'}</svg><b>${bon ? "Bravo !" : "Pas tout à fait."}</b></div>
      <p class="defirep">Bonne réponse : <b>${esc(opts[ok])}</b></p><p class="defiexpl">${esc(expl)}</p>
      <div class="defibtns"><button class="linkbtn" data-act="defiretour">${icon("left")} Revoir la question</button><button class="btn tonal sm" data-act="defiautre">${icon("restore")} Un autre défi</button></div>`}</div>
  </div></article>`;
}
carteDefi = carteDefiFlip;
document.addEventListener("click", e => {
  const a = e.target.closest && e.target.closest('[data-act="defirep"],[data-act="defiautre"],[data-act="defiretour"],[data-act="defivoir"]'); if (!a) return;
  const act = a.dataset.act;
  if (act === "defiretour" || act === "defivoir") { e.preventDefault(); e.stopPropagation(); DEC.flip = act === "defivoir"; const z = document.getElementById("decDefi"); if (z) { z.classList.toggle("retourne", DEC.flip); z.querySelector(".recto").setAttribute("aria-hidden", DEC.flip); z.querySelector(".verso").setAttribute("aria-hidden", !DEC.flip); } return; }
  DEC.flip = false; /* le gestionnaire du module Découvertes met la carte à jour juste après */
  if (act === "defirep") setTimeout(() => { DEC.flip = true; const z = document.getElementById("decDefi"); if (!z) return; z.outerHTML = carteDefiFlip(); const n = document.getElementById("decDefi"); n.classList.remove("retourne"); void n.offsetWidth; requestAnimationFrame(() => n.classList.add("retourne")); }, moinsAnim() ? 0 : 750);
}, true);

/* 19 : flashcards — la carte part à droite (sue) ou à gauche (à revoir), on peut aussi la glisser */
function sortieCarte(sens){
  const k = document.querySelector(".fccarte"); if (!k || moinsAnim()) return;
  const r = k.getBoundingClientRect(), c = k.cloneNode(true);
  c.removeAttribute("data-act"); c.classList.add("fcsortie"); c.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;margin:0;z-index:80;pointer-events:none;--sens:${sens}`;
  const cc = getComputedStyle(k).getPropertyValue("--c"); if (cc) c.style.setProperty("--c", cc);
  document.body.appendChild(c); setTimeout(() => c.remove(), 520);
}
const GL = { el: null, x0: 0, dx: 0, id: null };
document.addEventListener("pointerdown", e => {
  const k = e.target.closest && e.target.closest(".fccarte.retournee"); if (!k || e.button !== 0) return;
  GL.el = k; GL.x0 = e.clientX; GL.dx = 0; GL.id = e.pointerId;
});
document.addEventListener("pointermove", e => {
  if (!GL.el || e.pointerId !== GL.id) return; GL.dx = e.clientX - GL.x0; if (Math.abs(GL.dx) < 6) return;
  GL.el.classList.add("glisse"); GL.el.style.transform = `translateX(${GL.dx}px) rotate(${GL.dx / 18}deg)`;
  GL.el.dataset.vers = GL.dx > 40 ? "oui" : GL.dx < -40 ? "non" : "";
});
document.addEventListener("pointerup", e => {
  if (!GL.el || e.pointerId !== GL.id) return; const k = GL.el, dx = GL.dx; GL.el = null;
  k.classList.remove("glisse"); k.style.transform = ""; delete k.dataset.vers;
  if (Math.abs(dx) > 110) { GL.bloque = true; setTimeout(() => GL.bloque = false, 50); const b = document.querySelector(`[data-act="${dx > 0 ? "fcoui" : "fcnon"}"]`); if (b) b.click(); }
  else if (Math.abs(dx) > 6) { GL.bloque = true; setTimeout(() => GL.bloque = false, 50); }
});
/* un glissement ne doit pas aussi retourner la carte */
document.addEventListener("click", e => { if (GL.bloque && e.target.closest && e.target.closest(".fccarte")) { e.preventDefault(); e.stopImmediatePropagation(); } }, true);
