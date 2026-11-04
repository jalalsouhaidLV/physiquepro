/* =====================================================================
   Labo animé (suite) : onde progressive, décroissance radioactive,
   atome et couches électroniques, binaire et octets
   ===================================================================== */
LABS.push(
  { id: "onde", t: "Onde progressive", niv: "Tle · 1re", ic: "chart", d: "Corde ou ressort : règle la période et la célérité, mesure la longueur d'onde et le retard d'un point." },
  { id: "radio", t: "Décroissance radioactive", niv: "Tle", ic: "atom", d: "Des noyaux se désintègrent au hasard : la courbe N(t) se construit et la demi-vie apparaît." },
  { id: "atome", t: "Atome et couches électroniques", niv: "2nde · 1re", ic: "atom", d: "Choisis un élément : noyau, électrons sur leurs couches, électrons de valence et ion stable." },
  { id: "binaire", t: "Binaire et octets", niv: "SNT · 3e", ic: "codeb", d: "Allume les 8 bits d'un octet : la valeur décimale, hexadécimale et le caractère se calculent." }
);
VIGN.onde = `<svg viewBox="0 0 160 100"><path class="vg-ax" d="M8 50h146"/><path class="vg-c vg-onde" d="M8 50 Q20 20 32 50 T56 50 T80 50 T104 50 T128 50 T152 50"/></svg>`;
VIGN.radio = `<svg viewBox="0 0 160 100"><path class="vg-ax" d="M14 8v80h140"/><path class="vg-c" d="M14 14 C40 50 70 72 154 84"/>${Array.from({ length: 12 }, (_, i) => `<circle class="vg-n${i % 3 ? "" : " vg-off"}" cx="${100 + (i % 4) * 12}" cy="${14 + Math.floor(i / 4) * 12}" r="4"/>`).join("")}</svg>`;
VIGN.atome = `<svg viewBox="0 0 160 100"><circle cx="80" cy="50" r="9" class="vg-noy"/><circle cx="80" cy="50" r="24" class="vg-orb"/><circle cx="80" cy="50" r="42" class="vg-orb"/><g class="vg-rot"><circle cx="104" cy="50" r="4" class="vg-e"/><circle cx="38" cy="50" r="4" class="vg-e"/><circle cx="80" cy="8" r="4" class="vg-e"/></g></svg>`;
VIGN.binaire = `<svg viewBox="0 0 160 100">${[1, 0, 1, 1, 0, 0, 1, 0].map((b, i) => `<rect x="${10 + i * 18}" y="34" width="14" height="22" rx="4" class="vg-bit${b ? " on" : ""}"/>`).join("")}<text x="80" y="82" text-anchor="middle" class="vg-txt">= 178</text></svg>`;

/* ---------------------------------------------------------------- ONDE PROGRESSIVE */
const ONDE = { type: "corde", A: 3, T: 1.5, v: 2, xm: 2.5, lam: true, run: true, t: 0, hist: [] };
function uiOnde(){
  return `<div class="labctl">
    ${choix("oType", "Type d'onde", [["corde", "Transversale (corde)"], ["ressort", "Longitudinale (ressort)"]], ONDE.type)}
    ${curseur("oA", "Amplitude", 1, 5, 0.5, ONDE.A, "cm")}
    ${curseur("oT", "Période T", 0.5, 4, 0.1, ONDE.T, "s")}
    ${curseur("oV", "Célérité v", 0.5, 4, 0.1, ONDE.v, "m/s")}
    ${curseur("oX", "Position du point M", 0.2, 6, 0.1, ONDE.xm, "m")}
    <div class="labbtns"><button class="btn sm" data-lab="go">${icon("restore")} Relancer depuis la source</button><button class="btn sm tonal" data-lab="pause">${icon("pause")} Pause</button></div>
    <div class="labopts">${coche("oLam", "Montrer la longueur d'onde λ", ONDE.lam)}</div>
    <div class="labinfo" id="oInfo"></div></div>
  <div class="labscene seul deux"><canvas id="oCv" class="labcv" aria-label="Milieu de propagation"></canvas><canvas id="oG" class="labcv" aria-label="Élongation du point M en fonction du temps"></canvas></div>`;
}
const elongOnde = (x, t) => t < x / ONDE.v ? 0 : ONDE.A * Math.sin(2 * Math.PI * (t / ONDE.T - x / (ONDE.v * ONDE.T)));
function initOnde(p){
  const q = s => p.querySelector(s), zero = () => { ONDE.t = 0; ONDE.hist = []; };
  const lier = (id, k, u, n) => q("#" + id).oninput = e => { ONDE[k] = Number(e.target.value); q("#" + id + "O").textContent = fx(ONDE[k], n) + " " + u; if (k !== "xm") zero(); else ONDE.hist = []; };
  lier("oA", "A", "cm", 1); lier("oT", "T", "s", 1); lier("oV", "v", "m/s", 1); lier("oX", "xm", "m", 1);
  q("#oType").onchange = e => { ONDE.type = e.target.value; };
  q("#oLam").onchange = e => { ONDE.lam = e.target.checked; };
  p.querySelector(".labbtns").addEventListener("click", e => { const b = e.target.closest("[data-lab]"); if (!b) return; if (b.dataset.lab === "go") { zero(); ONDE.run = true; } else ONDE.run = !ONDE.run; });
  zero(); ONDE.run = true; let t0 = performance.now();
  const boucle = t => { const dt = Math.min(.05, (t - t0) / 1000); t0 = t; if (ONDE.run) { ONDE.t += dt; ONDE.hist.push([ONDE.t, elongOnde(ONDE.xm, ONDE.t)]); if (ONDE.hist.length > 2000) ONDE.hist.shift(); } dessinOnde(); LAB.raf = requestAnimationFrame(boucle); };
  LAB.dessiner = dessinOnde; LAB.raf = requestAnimationFrame(boucle);
}
function dessinOnde(){
  const cv = document.getElementById("oCv"), gr = document.getElementById("oG"); if (!cv || !gr) return;
  const K = couleursLab(), L = 6.5, lam = ONDE.v * ONDE.T, t = ONDE.t;
  { const { g, w, h } = preparerCanvas(cv), m = { l: 30, r: 16 }, W = w - m.l - m.r, X = x => m.l + x / L * W, y0 = h / 2, ky = (h * .32) / 5;
    g.font = `600 11px ${K.font}`; g.fillStyle = K.muted; for (let x = 0; x <= 6; x++) { g.fillRect(X(x), h - 22, 1, 6); g.fillText(x + " m", X(x) - 8, h - 6); }
    g.fillStyle = K.ink; g.fillRect(m.l - 18, y0 - 18, 12, 36); g.fillText("S", m.l - 16, y0 - 24);
    if (ONDE.type === "corde") {
      g.strokeStyle = K.accent; g.lineWidth = 3; g.beginPath(); for (let i = 0; i <= 400; i++) { const x = L * i / 400, y = y0 - elongOnde(x, t) * ky; i ? g.lineTo(X(x), y) : g.moveTo(X(x), y); } g.stroke();
    } else {
      g.strokeStyle = K.accent; g.lineWidth = 2; const pasR = Math.max(.1, L * 7 / W); for (let x = 0; x <= L; x += pasR) { const xx = X(x + elongOnde(x, t) * .025); g.beginPath(); g.moveTo(xx, y0 - 30); g.lineTo(xx, y0 + 30); g.stroke(); }
    }
    const yM = ONDE.type === "corde" ? y0 - elongOnde(ONDE.xm, t) * ky : y0, xM = ONDE.type === "corde" ? X(ONDE.xm) : X(ONDE.xm + elongOnde(ONDE.xm, t) * .025);
    g.fillStyle = K.bad; g.beginPath(); g.arc(xM, yM, 6, 0, 7); g.fill(); g.fillText("M", xM + 8, yM - 8);
    const front = Math.min(L, ONDE.v * t); g.setLineDash([3, 4]); g.strokeStyle = K.muted; g.lineWidth = 1; g.beginPath(); g.moveTo(X(front), 12); g.lineTo(X(front), h - 28); g.stroke(); g.setLineDash([]); if (front < L) g.fillText("front", X(front) + 4, 22);
    if (ONDE.lam && front > lam * 1.2) { let x1 = 0; const ph = t / ONDE.T; x1 = ((ph - Math.floor(ph) - .25) * lam + lam) % lam; if (x1 + lam <= front) { const yb = y0 - ONDE.A * ky - 14; g.strokeStyle = K.ok; g.fillStyle = K.ok; g.lineWidth = 2; g.beginPath(); g.moveTo(X(x1), yb); g.lineTo(X(x1 + lam), yb); g.stroke(); [x1, x1 + lam].forEach(x => { g.beginPath(); g.moveTo(X(x), yb - 6); g.lineTo(X(x), yb + 6); g.stroke(); }); g.font = `700 13px ${K.font}`; g.fillText("λ = " + fx(lam) + " m", X(x1 + lam / 2) - 34, yb - 8); } }
  }
  { const { g, w, h } = preparerCanvas(gr), m = { l: 40, r: 14, t: 18, b: 28 }, W = w - m.l - m.r, H = h - m.t - m.b, fen = 8, t1 = Math.max(fen, t), t0 = t1 - fen;
    const X = tt => m.l + (tt - t0) / fen * W, Y = y => m.t + H / 2 - y / 5 * H / 2;
    g.font = `500 11px ${K.font}`; g.strokeStyle = K.line; g.lineWidth = 1; for (let s = Math.ceil(t0); s <= t1; s++) { g.beginPath(); g.moveTo(X(s), m.t); g.lineTo(X(s), m.t + H); g.stroke(); g.fillStyle = K.muted; g.fillText(s + " s", X(s) - 8, h - 8); }
    g.strokeStyle = K.ink; g.beginPath(); g.moveTo(m.l, Y(0)); g.lineTo(m.l + W, Y(0)); g.stroke(); g.fillStyle = K.ink; g.font = `700 11px ${K.font}`; g.fillText("y_M (cm)", 4, m.t - 4);
    const tau = ONDE.xm / ONDE.v; if (tau >= t0 && tau <= t1) { g.setLineDash([4, 4]); g.strokeStyle = K.bad; g.beginPath(); g.moveTo(X(tau), m.t); g.lineTo(X(tau), m.t + H); g.stroke(); g.setLineDash([]); g.fillStyle = K.bad; g.fillText("τ = " + fx(tau) + " s", X(tau) + 4, m.t + 12); }
    g.strokeStyle = K.bad; g.lineWidth = 2; g.beginPath(); ONDE.hist.filter(([tt]) => tt >= t0).forEach(([tt, y], i) => i ? g.lineTo(X(tt), Y(y)) : g.moveTo(X(tt), Y(y))); g.stroke(); }
  const info = document.getElementById("oInfo"); if (info) info.innerHTML = `<div class="labmesures"><span><small>t</small><b>${fx(t, 1)} s</b></span><span><small>λ = v × T</small><b>${fx(lam)} m</b></span><span><small>f = 1/T</small><b>${fx(1 / ONDE.T)} Hz</b></span><span><small>Retard de M</small><b>${fx(ONDE.xm / ONDE.v)} s</b></span></div>
    <p class="labeq">Le point M reproduit le mouvement de la source S avec un <b>retard τ = SM / v = ${fx(ONDE.xm)} / ${fx(ONDE.v, 1)} = ${fx(ONDE.xm / ONDE.v)} s</b>. La longueur d'onde est la distance parcourue par l'onde pendant une période : <b>λ = v·T</b>.</p>
    <p class="labeq muted">${ONDE.type === "corde" ? "Onde transversale : les points de la corde bougent perpendiculairement à la direction de propagation." : "Onde longitudinale : les spires bougent dans la même direction que la propagation (compressions et dilatations)."} Il n'y a pas de transport de matière, seulement d'énergie.</p>`;
}

/* ---------------------------------------------------------------- DÉCROISSANCE RADIOACTIVE */
const RAD = { N0: 400, th: 8, vit: 1, run: false, t: 0, etat: null, flash: null, pts: [], theo: true };
function uiRadio(){
  return `<div class="labctl">
    ${choix("rN", "Nombre de noyaux au départ N₀", [[100, "100"], [400, "400"], [900, "900"]], RAD.N0)}
    ${curseur("rT", "Demi-vie t½ (simulation)", 2, 20, 1, RAD.th, "s")}
    ${choix("rV", "Vitesse", [[1, "Temps réel"], [4, "Accéléré ×4"]], RAD.vit)}
    <div class="labbtns"><button class="btn sm" data-lab="go">${icon("play")} Lancer</button><button class="btn sm tonal" data-lab="pause">${icon("pause")} Pause</button><button class="btn sm ghost" data-lab="zero">${icon("restore")} Recommencer</button></div>
    <div class="labopts">${coche("rTheo", "Courbe théorique N₀·e<sup>−λt</sup>", RAD.theo)}</div>
    <div class="labinfo" id="rInfo"></div></div>
  <div class="labscene"><canvas id="rCv" class="labcv" aria-label="Noyaux"></canvas><canvas id="rG" class="labcv" aria-label="Nombre de noyaux restants en fonction du temps"></canvas></div>`;
}
function initRadio(p){
  const q = s => p.querySelector(s), zero = () => { RAD.t = 0; RAD.run = false; RAD.etat = new Uint8Array(RAD.N0); RAD.flash = new Float32Array(RAD.N0); RAD.pts = [[0, RAD.N0]]; };
  q("#rN").onchange = e => { RAD.N0 = Number(e.target.value); zero(); };
  q("#rT").oninput = e => { RAD.th = Number(e.target.value); q("#rTO").textContent = RAD.th + " s"; zero(); };
  q("#rV").onchange = e => { RAD.vit = Number(e.target.value); };
  q("#rTheo").onchange = e => { RAD.theo = e.target.checked; };
  p.querySelector(".labbtns").addEventListener("click", e => { const b = e.target.closest("[data-lab]"); if (!b) return; const k = b.dataset.lab; if (k === "go") { if (RAD.t > 0 && !RAD.run && restants() === 0) zero(); RAD.run = true; } else if (k === "pause") RAD.run = !RAD.run; else zero(); });
  zero(); let t0 = performance.now(), acc = 0;
  const boucle = t => { const dt = Math.min(.05, (t - t0) / 1000) * RAD.vit; t0 = t;
    if (RAD.run) { const lam = Math.LN2 / RAD.th; RAD.t += dt; const pr = 1 - Math.exp(-lam * dt);
      for (let i = 0; i < RAD.N0; i++) if (!RAD.etat[i] && Math.random() < pr) { RAD.etat[i] = 1; RAD.flash[i] = 1; }
      acc += dt; if (acc > .1) { acc = 0; RAD.pts.push([RAD.t, restants()]); }
      if (restants() === 0 || RAD.t > RAD.th * 8) { RAD.run = false; RAD.pts.push([RAD.t, restants()]); } }
    for (let i = 0; i < RAD.N0; i++) if (RAD.flash[i] > 0) RAD.flash[i] = Math.max(0, RAD.flash[i] - dt / RAD.vit * 2);
    dessinRadio(); LAB.raf = requestAnimationFrame(boucle); };
  LAB.dessiner = dessinRadio; LAB.raf = requestAnimationFrame(boucle);
}
const restants = () => { let n = 0; for (let i = 0; i < RAD.N0; i++) if (!RAD.etat[i]) n++; return n; };
function dessinRadio(){
  const cv = document.getElementById("rCv"), gr = document.getElementById("rG"); if (!cv || !gr) return;
  const K = couleursLab(), N = restants(), lam = Math.LN2 / RAD.th;
  { const { g, w, h } = preparerCanvas(cv), c = Math.ceil(Math.sqrt(RAD.N0 * w / h)), r = Math.ceil(RAD.N0 / c), pas = Math.min((w - 20) / c, (h - 40) / r), rad = pas * .36;
    for (let i = 0; i < RAD.N0; i++) { const x = 10 + (i % c + .5) * pas, y = 10 + (Math.floor(i / c) + .5) * pas;
      if (RAD.flash[i] > 0) { g.fillStyle = `rgba(249,171,0,${RAD.flash[i] * .5})`; g.beginPath(); g.arc(x, y, rad * (1 + 2 * (1 - RAD.flash[i])), 0, 7); g.fill(); }
      g.fillStyle = RAD.etat[i] ? K.line : K.bad; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill(); }
    g.font = `600 12px ${K.font}`; g.fillStyle = K.bad; g.fillText("● noyaux pères : " + N, 10, h - 10); g.fillStyle = K.muted; g.fillText("● désintégrés : " + (RAD.N0 - N), w / 2, h - 10); }
  { const { g, w, h } = preparerCanvas(gr), m = { l: 44, r: 14, t: 18, b: 30 }, W = w - m.l - m.r, H = h - m.t - m.b, tm = RAD.th * 5;
    const X = t => m.l + t / tm * W, Y = n => m.t + H - n / RAD.N0 * H;
    g.font = `500 11px ${K.font}`; g.lineWidth = 1;
    for (let k = 0; k <= 5; k++) { g.strokeStyle = K.line; g.beginPath(); g.moveTo(X(k * RAD.th), m.t); g.lineTo(X(k * RAD.th), m.t + H); g.stroke(); g.fillStyle = K.muted; g.fillText(k ? k + " t½" : "0", X(k * RAD.th) - 8, h - 10); }
    [1, .5, .25, .125].forEach(f => { g.strokeStyle = K.line; g.beginPath(); g.moveTo(m.l, Y(RAD.N0 * f)); g.lineTo(m.l + W, Y(RAD.N0 * f)); g.stroke(); g.fillStyle = K.muted; g.fillText(f === 1 ? "N₀" : f === .5 ? "N₀/2" : f === .25 ? "N₀/4" : "N₀/8", 4, Y(RAD.N0 * f) + 4); });
    if (RAD.theo) { g.setLineDash([5, 4]); g.strokeStyle = K.muted; g.lineWidth = 1.5; g.beginPath(); for (let i = 0; i <= 200; i++) { const t = tm * i / 200; i ? g.lineTo(X(t), Y(RAD.N0 * Math.exp(-lam * t))) : g.moveTo(X(t), Y(RAD.N0)); } g.stroke(); g.setLineDash([]); }
    g.strokeStyle = K.bad; g.lineWidth = 2.5; g.beginPath(); RAD.pts.filter(p => p[0] <= tm).forEach(([t, n], i) => i ? g.lineTo(X(t), Y(n)) : g.moveTo(X(t), Y(n))); g.stroke();
    if (RAD.t > 0) { const tt = Math.min(RAD.t, tm); g.fillStyle = K.bad; g.beginPath(); g.arc(X(tt), Y(N), 4.5, 0, 7); g.fill(); }
    g.fillStyle = K.ink; g.font = `700 11px ${K.font}`; g.fillText("N(t)", m.l + 4, m.t - 4); }
  const info = document.getElementById("rInfo"); if (info) info.innerHTML = `<div class="labmesures"><span><small>t</small><b>${fx(RAD.t, 1)} s</b></span><span><small>N restants</small><b>${N}</b></span><span><small>N / N₀</small><b>${fx(N / RAD.N0 * 100, 0)} %</b></span><span><small>λ = ln2 / t½</small><b>${fx(lam, 3)} s⁻¹</b></span><span><small>Activité ≈ λN</small><b>${fx(lam * N, 1)} Bq</b></span></div>
    <p class="labeq">Loi de décroissance : <b>N(t) = N₀·e<sup>−λt</sup></b>. Au bout d'une demi-vie, il reste la moitié des noyaux ; au bout de deux, le quart…</p>
    <p class="labeq muted">On ne peut pas prévoir <i>quel</i> noyau va se désintégrer (phénomène aléatoire), mais avec beaucoup de noyaux la courbe suit la loi : compare N₀ = 100 et N₀ = 900.</p>`;
}

/* ---------------------------------------------------------------- ATOME */
const ATO = { z: 8, rot: 0 };
const couchesAtome = z => { const cap = [2, 8, 8, 2], L = []; let r = z; for (const c of cap) { if (r <= 0) break; L.push(Math.min(c, r)); r -= c; } return L; };
function ionAtome(z){
  const C = couchesAtome(z), v = C[C.length - 1], el = ELEM[z - 1];
  if (el.k === "ng") return { t: "Gaz noble : déjà stable, il ne forme pas d'ion.", ion: null };
  if (z === 1) return { t: "L'hydrogène perd facilement son unique électron.", ion: "H⁺" };
  if (z <= 4) return { t: `Il perd ${v} électron${v > 1 ? "s" : ""} pour avoir la structure de l'hélium (règle du duet).`, ion: el.s + (v > 1 ? "²" : "") + "⁺" };
  if (v <= 3) return { t: `Il perd ${v} électron${v > 1 ? "s" : ""} pour avoir un octet sur sa couche externe.`, ion: el.s + (v > 1 ? "²³"[v - 2] : "") + "⁺" };
  if (v >= 5) { const g = 8 - v; return { t: `Il gagne ${g} électron${g > 1 ? "s" : ""} pour compléter son octet.`, ion: el.s + (g > 1 ? "²³"[g - 2] : "") + "⁻" }; }
  return { t: "Avec 4 électrons de valence, il forme plutôt 4 liaisons covalentes qu'un ion.", ion: null };
}
function uiAtome(){
  return `<div class="labctl">
    <div class="labrange"><label for="aZ">Numéro atomique Z<output id="aZO">${ATO.z}</output></label><input type="range" id="aZ" min="1" max="20" step="1" value="${ATO.z}"></div>
    <div class="labbtns"><button class="btn sm tonal" data-lab="moins">${icon("left")} Précédent</button><button class="btn sm tonal" data-lab="plus">Suivant ${icon("chevright")}</button></div>
    <div class="labinfo" id="aInfo"></div></div>
  <div class="labscene seul"><canvas id="aCv" class="labcv" aria-label="Modèle de l'atome"></canvas></div>`;
}
function initAtome(p){
  const q = s => p.querySelector(s), maj = () => { q("#aZ").value = ATO.z; q("#aZO").textContent = ATO.z; infoAtome(); };
  q("#aZ").oninput = e => { ATO.z = Number(e.target.value); maj(); };
  p.querySelector(".labbtns").addEventListener("click", e => { const b = e.target.closest("[data-lab]"); if (!b) return; ATO.z = Math.max(1, Math.min(20, ATO.z + (b.dataset.lab === "plus" ? 1 : -1))); maj(); });
  maj(); let t0 = performance.now();
  const boucle = t => { const dt = Math.min(.05, (t - t0) / 1000); t0 = t; if (!moinsAnim()) ATO.rot += dt * .6; dessinAtome(); LAB.raf = requestAnimationFrame(boucle); };
  LAB.dessiner = dessinAtome; LAB.raf = requestAnimationFrame(boucle);
}
function dessinAtome(){
  const cv = document.getElementById("aCv"); if (!cv) return;
  const K = couleursLab(), { g, w, h } = preparerCanvas(cv), el = ELEM[ATO.z - 1], C = couchesAtome(ATO.z), cx = w / 2, cy = h / 2, R0 = Math.min(w, h) * .12, pasR = (Math.min(w, h) / 2 - R0 - 24) / 4;
  const A = Math.round(el.m), Nn = A - ATO.z;
  g.fillStyle = "rgba(217,48,37,.12)"; g.beginPath(); g.arc(cx, cy, R0 * .8, 0, 7); g.fill();
  const nb = ATO.z + Nn; for (let i = 0; i < nb; i++) { const a = i * 2.39996, r = R0 * .7 * Math.sqrt((i + .5) / nb), pro = Math.floor((i + 1) * ATO.z / nb) > Math.floor(i * ATO.z / nb); g.fillStyle = pro ? "#D93025" : "#9AA0A6"; g.beginPath(); g.arc(cx + r * Math.cos(a), cy + r * Math.sin(a), Math.max(2.5, R0 * .11), 0, 7); g.fill(); }
  g.font = `800 ${Math.round(R0 * .38)}px ${K.font}`; g.textAlign = "center"; g.lineJoin = "round"; g.lineWidth = 6; g.strokeStyle = K.surface; g.strokeText(el.s, cx, cy + R0 * .13); g.fillStyle = K.ink; g.fillText(el.s, cx, cy + R0 * .13); g.textAlign = "left";
  const noms = ["K", "L", "M", "N"];
  C.forEach((n, k) => { const r = R0 + pasR * (k + 1), ext = k === C.length - 1;
    g.strokeStyle = ext ? K.accent : K.line; g.lineWidth = ext ? 2 : 1.2; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke();
    g.fillStyle = K.muted; g.font = `700 12px ${K.font}`; g.fillText(noms[k], cx + r * .72 + 4, cy - r * .72 - 4);
    for (let i = 0; i < n; i++) { const a = ATO.rot * (1.2 - k * .2) + i * 2 * Math.PI / n; g.fillStyle = ext ? K.accent : K.ink; g.beginPath(); g.arc(cx + r * Math.cos(a), cy + r * Math.sin(a), ext ? 6 : 5, 0, 7); g.fill(); } });
  g.font = `600 12px ${K.font}`; g.fillStyle = "#D93025"; g.fillText("● protons : " + ATO.z, 12, h - 46); g.fillStyle = "#9AA0A6"; g.fillText("● neutrons : " + Nn + " (isotope le plus courant)", 12, h - 28); g.fillStyle = K.accent; g.fillText("● électrons de valence", 12, h - 10);
}
function infoAtome(){
  const info = document.getElementById("aInfo"); if (!info) return; const el = ELEM[ATO.z - 1], C = couchesAtome(ATO.z), io = ionAtome(ATO.z), A = Math.round(el.m), pos = posElement(ATO.z);
  info.innerHTML = `<div class="atfiche"><b class="atsym"><sup>${A}</sup><sub>${ATO.z}</sub>${el.s}</b><span><b>${esc(el.n)}</b><small>${CAT_EL[el.k]}</small></span></div>
    <div class="labmesures"><span><small>Protons</small><b>${ATO.z}</b></span><span><small>Neutrons</small><b>${A - ATO.z}</b></span><span><small>Électrons</small><b>${ATO.z}</b></span><span><small>Période</small><b>${pos[0]}</b></span><span><small>Colonne</small><b>${pos[1]}</b></span><span><small>Valence</small><b>${C[C.length - 1]} e⁻</b></span></div>
    <p class="labeq">Configuration électronique : <b class="mono">${configElec(ATO.z)}</b></p>
    <p class="labeq">Répartition par couches : <b>${C.map((n, k) => "(" + "KLMN"[k] + ")" + "<sup>" + n + "</sup>").join(" ")}</b></p>
    <p class="labeq">${io.t}${io.ion ? ` Ion le plus probable : <b>${io.ion}</b>.` : ""}</p>`;
}

/* ---------------------------------------------------------------- BINAIRE */
const BIN = { bits: [0, 0, 0, 0, 0, 0, 0, 0], defi: null, ok: 0 };
function uiBinaire(){
  return `<div class="labctl">
    <p class="labeq">Un <b>bit</b> vaut 0 ou 1. Un <b>octet</b> = 8 bits, soit 2⁸ = <b>256</b> valeurs possibles (de 0 à 255). Clique sur les ampoules pour allumer les bits.</p>
    <div class="labbtns"><button class="btn sm" data-lab="defi">${icon("star")} Défi : écris un nombre</button><button class="btn sm tonal" data-lab="hasard">Au hasard</button><button class="btn sm ghost" data-lab="zero">${icon("restore")} Tout éteindre</button></div>
    <div id="bDefi" class="bdefi"></div>
    <div class="field labsel"><label for="bTxt">Ou tape un caractère pour voir son code</label><input id="bTxt" maxlength="1" placeholder="A" autocomplete="off"></div>
  </div>
  <div class="labscene seul"><div class="binscene" id="bScene"></div></div>`;
}
function dessinBinaire(){
  const z = document.getElementById("bScene"); if (!z) return; const v = BIN.bits.reduce((a, b, i) => a + b * 2 ** (7 - i), 0), car = v >= 32 && v < 127 ? String.fromCharCode(v) : v >= 160 ? String.fromCharCode(v) : null;
  z.innerHTML = `<div class="binrang">${BIN.bits.map((b, i) => `<button class="binbit${b ? " on" : ""}" data-bit="${i}" aria-pressed="${!!b}" aria-label="Bit de poids ${2 ** (7 - i)}"><i></i><b>${b}</b><small>2<sup>${7 - i}</sup> = ${2 ** (7 - i)}</small></button>`).join("")}</div>
    <div class="bincalc">${BIN.bits.map((b, i) => b ? `<span>${2 ** (7 - i)}</span>` : "").filter(Boolean).join(" + ") || "<span>0</span>"} = <b>${v}</b></div>
    <div class="labmesures binres"><span><small>Binaire</small><b class="mono">${BIN.bits.join("")}</b></span><span><small>Décimal</small><b>${v}</b></span><span><small>Hexadécimal</small><b class="mono">${v.toString(16).toUpperCase().padStart(2, "0")}</b></span><span><small>Caractère (code ${v})</small><b>${car ? esc(car) : "—"}</b></span></div>`;
  const d = document.getElementById("bDefi"); if (d) d.innerHTML = BIN.defi == null ? "" : v === BIN.defi ? `<p class="bok">${icon("check")} Bravo ! <b>${BIN.defi}</b> s'écrit <b class="mono">${BIN.defi.toString(2).padStart(8, "0")}</b>. Défis réussis : ${BIN.ok}</p>` : `<p>Écris <b class="bnum">${BIN.defi}</b> en binaire.</p>`;
}
function initBinaire(p){
  const val = () => BIN.bits.reduce((a, b, i) => a + b * 2 ** (7 - i), 0), poser = n => { BIN.bits = n.toString(2).padStart(8, "0").slice(-8).split("").map(Number); };
  p.querySelector(".labscene").addEventListener("click", e => { const b = e.target.closest("[data-bit]"); if (!b) return; const i = Number(b.dataset.bit); BIN.bits[i] = 1 - BIN.bits[i];
    if (BIN.defi != null && val() === BIN.defi) { BIN.ok++; dessinBinaire(); celebrer("Bien joué !"); return; } dessinBinaire(); });
  p.querySelector(".labbtns").addEventListener("click", e => { const b = e.target.closest("[data-lab]"); if (!b) return; const k = b.dataset.lab;
    if (k === "defi") { let n; do n = 1 + Math.floor(Math.random() * 254); while (n === val()); BIN.defi = n; BIN.bits = [0, 0, 0, 0, 0, 0, 0, 0]; }
    else if (k === "hasard") { BIN.defi = null; poser(Math.floor(Math.random() * 256)); } else { BIN.defi = null; BIN.bits = [0, 0, 0, 0, 0, 0, 0, 0]; } dessinBinaire(); });
  p.querySelector("#bTxt").oninput = e => { const c = e.target.value; if (!c) return; const n = c.charCodeAt(0); if (n > 255) { toast("Ce caractère ne tient pas dans un octet (code " + n + ")"); return; } BIN.defi = null; poser(n); dessinBinaire(); };
  LAB.dessiner = null; dessinBinaire();
}
Object.assign(LAB_DEF, { onde: { ui: uiOnde, init: initOnde }, radio: { ui: uiRadio, init: initRadio }, atome: { ui: uiAtome, init: initAtome }, binaire: { ui: uiBinaire, init: initBinaire } });
