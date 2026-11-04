/* =====================================================================
   Labo animé : simulations PhysiquePro dessinées dans la page
   - Dosage pH-métrique (Tle / 1re)
   - Mouvement dans un champ de pesanteur : tir parabolique (Tle)
   ===================================================================== */
const LABS = [
  { id: "dosage", t: "Dosage pH-métrique", niv: "Tle · 1re", ic: "flask", d: "Verse la solution titrante goutte à goutte : la courbe pH = f(V) se trace et l'indicateur change de couleur." },
  { id: "tir", t: "Tir parabolique", niv: "Tle · 2nde", ic: "pendule", d: "Règle la vitesse et l'angle, lance : chronophotographie, vecteurs vitesse, portée et flèche." }
];
const LAB = { id: null, raf: null, ro: null };
const LAB_DEF = {}, VIGN = {};
const fx = (x, n = 2) => (Math.round(x * 10 ** n) / 10 ** n).toFixed(n).replace(".", ",");
function couleursLab(){
  const cs = getComputedStyle(document.documentElement), v = (n, d) => cs.getPropertyValue(n).trim() || d;
  return { ink: v("--ink", "#1f1f1f"), muted: v("--muted", "#5f6368"), line: v("--line", "#dadce0"), surface: v("--surface", "#fff"), s2: v("--surface-2", "#f1f3f4"), accent: v("--accent", "#1a73e8"), ok: v("--ok", "#1e8e3e"), bad: v("--bad", "#d93025"), warn: v("--warn", "#e37400"), font: v("--body", "system-ui") };
}
function preparerCanvas(cv){
  const r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.max(10, Math.round(r.width)), h = Math.max(10, Math.round(r.height));
  if (cv.width !== w * dpr || cv.height !== h * dpr) { cv.width = w * dpr; cv.height = h * dpr; }
  const g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h); return { g, w, h };
}
const curseur = (id, lbl, min, max, pas, val, unite) => `<div class="labrange"><label for="${id}">${lbl}<output id="${id}O">${String(val).replace(".", ",")} ${unite}</output></label><input type="range" id="${id}" min="${min}" max="${max}" step="${pas}" value="${val}"></div>`;
const choix = (id, lbl, L, val) => `<div class="field labsel"><label for="${id}">${lbl}</label><select id="${id}">${L.map(([v, t]) => `<option value="${v}" ${String(v) === String(val) ? "selected" : ""}>${t}</option>`).join("")}</select></div>`;
const coche = (id, lbl, on) => `<label class="labcoche"><input type="checkbox" id="${id}" ${on ? "checked" : ""}><span>${lbl}</span></label>`;

function blocLabs(){
  return `<section class="simgroupe labgroupe"><h2>${icon("play")} Simulations animées PhysiquePro <span class="labneuf">Nouveau</span></h2><div class="labgrille">${LABS.map(l => `<button class="labcarte" data-act="labouvrir" data-l="${l.id}"><span class="labvignette lv-${l.id}" aria-hidden="true">${vignetteLab(l.id)}</span><span class="labtx"><small>${esc(l.niv)}</small><b>${esc(l.t)}</b><span>${esc(l.d)}</span><em>${icon("play")} Lancer</em></span></button>`).join("")}</div></section>`;
}
function vignetteLab(id){
  if (VIGN[id]) return VIGN[id];
  if (id === "dosage") return `<svg viewBox="0 0 160 100"><path class="vg-ax" d="M14 8v80h140"/><path class="vg-c" d="M14 78 C50 74 70 70 82 62 C86 58 86 30 90 24 C100 16 130 14 154 13"/><circle class="vg-p" cx="86" cy="44" r="4"/></svg>`;
  return `<svg viewBox="0 0 160 100"><path class="vg-ax" d="M8 90h146"/><path class="vg-c" d="M14 88 Q70 -10 146 88" stroke-dasharray="2 9"/><circle class="vg-p vg-tir" cx="14" cy="88" r="5"/></svg>`;
}
function ouvrirLab(id){
  fermerLab(true); const L = LABS.find(x => x.id === id); if (!L) return; LAB.id = id;
  const p = document.createElement("div"); p.id = "labPanel"; p.className = "labfond";
  p.innerHTML = `<div class="labboite" role="dialog" aria-modal="true" aria-label="${esc(L.t)}"><header>${icon(L.ic)}<b>${esc(L.t)}</b><small>${esc(L.niv)}</small><button class="ib" data-act="labfermer" aria-label="Fermer">${icon("x")}</button></header>
    <div class="labcorps">${LAB_DEF[id].ui()}</div></div>`;
  document.body.appendChild(p); document.body.classList.add("labouvert");
  p.addEventListener("click", e => { if (e.target === p) fermerLab(); });
  LAB_DEF[id].init(p);
  LAB.ro = new ResizeObserver(() => LAB.dessiner && LAB.dessiner()); p.querySelectorAll("canvas").forEach(c => LAB.ro.observe(c));
  setTimeout(() => p.querySelector("header .ib").focus(), 30);
}
function fermerLab(silencieux){
  cancelAnimationFrame(LAB.raf); LAB.raf = null; if (LAB.ro) LAB.ro.disconnect(); LAB.ro = null; LAB.dessiner = null; LAB.id = null;
  const p = document.getElementById("labPanel"); if (p) p.remove(); document.body.classList.remove("labouvert");
}
document.addEventListener("click", e => {
  const a = e.target.closest && e.target.closest('[data-act="labouvrir"],[data-act="labfermer"]'); if (!a) return; e.preventDefault(); e.stopPropagation();
  if (a.dataset.act === "labouvrir") ouvrirLab(a.dataset.l); else fermerLab();
}, true);
document.addEventListener("keydown", e => { if (e.key === "Escape" && document.getElementById("labPanel")) fermerLab(); });

/* ---------------------------------------------------------------- DOSAGE */
const DOS_TYPES = {
  hcl:  { n: "Acide chlorhydrique (acide fort) par la soude", an: "H₃O⁺ + Cl⁻", ti: "Na⁺ + HO⁻", pKa: -6, base: false, eq: "H₃O⁺ + HO⁻ → 2 H₂O" },
  acet: { n: "Acide éthanoïque (acide faible) par la soude", an: "CH₃COOH", ti: "Na⁺ + HO⁻", pKa: 4.76, base: false, eq: "CH₃COOH + HO⁻ → CH₃COO⁻ + H₂O" },
  nh3:  { n: "Ammoniac (base faible) par l'acide chlorhydrique", an: "NH₃", ti: "H₃O⁺ + Cl⁻", pKa: 9.25, base: true, eq: "NH₃ + H₃O⁺ → NH₄⁺ + H₂O" }
};
const INDIC = {
  bbt:  { n: "Bleu de bromothymol (6,0 – 7,6)", z: [6.0, 7.6], a: [232, 196, 60], b: [44, 98, 196], m: [70, 160, 90] },
  phph: { n: "Phénolphtaléine (8,2 – 10,0)", z: [8.2, 10.0], a: [232, 240, 250], b: [214, 51, 138] },
  hel:  { n: "Hélianthine (3,1 – 4,4)", z: [3.1, 4.4], a: [214, 52, 43], b: [242, 182, 50], m: [236, 120, 40] },
  aucun:{ n: "Aucun indicateur", z: [0, 0], a: [226, 236, 246], b: [226, 236, 246] }
};
const DOS = { type: "acet", Ca: 0.10, Va: 20, Cb: 0.10, ind: "bbt", V: 0, pts: [], cont: false, theo: false, deriv: false, eqv: false, gouttes: [], tour: 0 };
function phDosage(V){
  const t = DOS_TYPES[DOS.type], Vt = (DOS.Va + V) / 1000, C = DOS.Ca * DOS.Va / 1000 / Vt, Ct = DOS.Cb * V / 1000 / Vt, Kw = 1e-14, Ka = 10 ** -t.pKa;
  const f = h => t.base ? h + C * h / (h + Ka) - Kw / h - Ct : h + Ct - Kw / h - C * Ka / (Ka + h);
  let lo = -14.5, hi = 1; for (let i = 0; i < 70; i++) { const m = (lo + hi) / 2; if (f(10 ** m) > 0) hi = m; else lo = m; }
  return -(lo + hi) / 2;
}
const veqDos = () => DOS.Ca * DOS.Va / DOS.Cb;
const vmaxDos = () => Math.min(50, Math.max(15, Math.ceil(veqDos() * 2 / 5) * 5));
function couleurIndic(pH){
  const I = INDIC[DOS.ind], [z1, z2] = I.z; let c;
  if (pH <= z1) c = I.a; else if (pH >= z2) c = I.b;
  else { const k = (pH - z1) / (z2 - z1); if (I.m) c = k < .5 ? I.a.map((x, i) => x + (I.m[i] - x) * k * 2) : I.m.map((x, i) => x + (I.b[i] - x) * (k - .5) * 2); else c = I.a.map((x, i) => x + (I.b[i] - x) * k); }
  return `rgb(${c.map(Math.round).join(",")})`;
}
function uiDosage(){
  return `<div class="labctl">
    ${choix("dType", "Dosage", Object.entries(DOS_TYPES).map(([k, t]) => [k, t.n]), DOS.type)}
    ${curseur("dCa", "Concentration de la solution titrée C", 0.01, 0.15, 0.01, DOS.Ca, "mol/L")}
    ${choix("dVa", "Volume prélevé à la pipette jaugée", [[10, "10,0 mL"], [20, "20,0 mL"], [25, "25,0 mL"]], DOS.Va)}
    ${choix("dCb", "Concentration de la solution titrante (burette)", [[0.05, "0,050 mol/L"], [0.1, "0,100 mol/L"], [0.2, "0,200 mol/L"]], DOS.Cb)}
    ${choix("dInd", "Indicateur coloré", Object.entries(INDIC).map(([k, t]) => [k, t.n]), DOS.ind)}
    <div class="labbtns"><button class="btn sm tonal" data-lab="goutte">+ 1 goutte</button><button class="btn sm tonal" data-lab="ml">+ 1 mL</button><button class="btn sm" data-lab="cont">${icon("play")} Verser</button><button class="btn sm ghost" data-lab="zero">${icon("restore")} Recommencer</button></div>
    <div class="labopts">${coche("dTheo", "Courbe théorique en pointillés", DOS.theo)}${coche("dDer", "Courbe dérivée dpH/dV", DOS.deriv)}${coche("dEq", "Repérer l'équivalence", DOS.eqv)}</div>
    <div class="labinfo" id="dInfo"></div>
  </div>
  <div class="labscene"><canvas id="dScene" class="labcv scene" aria-label="Burette, bécher et pH-mètre"></canvas><canvas id="dGraph" class="labcv graph" role="img" aria-label="Courbe pH en fonction du volume versé"></canvas></div>`;
}
function initDosage(p){
  const q = s => p.querySelector(s);
  const zero = () => { DOS.V = 0; DOS.pts = [[0, phDosage(0)]]; DOS.cont = false; DOS.gouttes = []; majBoutonCont(); };
  const majBoutonCont = () => { const b = q('[data-lab="cont"]'); if (b) b.innerHTML = DOS.cont ? `${icon("pause")} Pause` : `${icon("play")} Verser`; };
  const verser = dv => { const vm = vmaxDos(); if (DOS.V >= vm) { DOS.cont = false; majBoutonCont(); return; }
    const pas = 0.02; let reste = Math.min(dv, vm - DOS.V); while (reste > 1e-9) { const d = Math.min(pas, reste); DOS.V += d; reste -= d; DOS.pts.push([DOS.V, phDosage(DOS.V)]); }
    if (!moinsAnim() && DOS.gouttes.length < 6) DOS.gouttes.push({ y: 0, v: 0 }); };
  q("#dType").onchange = e => { DOS.type = e.target.value; DOS.ind = { hcl: "bbt", acet: "phph", nh3: "hel" }[DOS.type]; q("#dInd").value = DOS.ind; zero(); };
  q("#dCa").oninput = e => { DOS.Ca = Number(e.target.value); q("#dCaO").textContent = fx(DOS.Ca) + " mol/L"; zero(); };
  q("#dVa").onchange = e => { DOS.Va = Number(e.target.value); zero(); };
  q("#dCb").onchange = e => { DOS.Cb = Number(e.target.value); zero(); };
  q("#dInd").onchange = e => { DOS.ind = e.target.value; };
  q("#dTheo").onchange = e => { DOS.theo = e.target.checked; };
  q("#dDer").onchange = e => { DOS.deriv = e.target.checked; };
  q("#dEq").onchange = e => { DOS.eqv = e.target.checked; };
  p.querySelector(".labbtns").addEventListener("click", e => { const b = e.target.closest("[data-lab]"); if (!b) return; const k = b.dataset.lab;
    if (k === "goutte") verser(0.05); else if (k === "ml") verser(1); else if (k === "zero") zero(); else { DOS.cont = !DOS.cont; majBoutonCont(); } });
  zero();
  let t0 = performance.now();
  const boucle = t => { const dt = Math.min(.1, (t - t0) / 1000); t0 = t;
    if (DOS.cont) { const prochePE = Math.abs(DOS.V - veqDos()) < 1.2; verser((prochePE ? 0.35 : 1.4) * dt); }
    DOS.tour += dt * 6; DOS.gouttes.forEach(g => { g.v += 900 * dt; g.y += g.v * dt; }); DOS.gouttes = DOS.gouttes.filter(g => g.y < 1);
    dessinDosage(); LAB.raf = requestAnimationFrame(boucle); };
  LAB.dessiner = dessinDosage; LAB.raf = requestAnimationFrame(boucle);
}
function dessinDosage(){
  const sc = document.getElementById("dScene"), gr = document.getElementById("dGraph"); if (!sc || !gr) return;
  const K = couleursLab(), pH = DOS.pts.length ? DOS.pts[DOS.pts.length - 1][1] : phDosage(0), vm = vmaxDos(), ve = veqDos(), T = DOS_TYPES[DOS.type];
  /* --- la scène : burette, bécher, agitateur, pH-mètre --- */
  { const { g, w, h } = preparerCanvas(sc), cx = w * .42, bx = cx - 9, by = 16, bh = h * .46, bw = 18;
    g.font = `600 11px ${K.font}`; g.lineWidth = 1.5;
    g.strokeStyle = K.muted; g.beginPath(); g.moveTo(cx + 34, 8); g.lineTo(cx + 34, h - 30); g.stroke(); g.beginPath(); g.moveTo(cx + 34, by + 30); g.lineTo(bx + bw, by + 30); g.stroke();
    const niv = (DOS.V / vm); g.fillStyle = "rgba(120,160,230,.35)"; g.fillRect(bx, by + bh * niv, bw, bh * (1 - niv));
    g.strokeStyle = K.ink; g.strokeRect(bx, by, bw, bh);
    g.fillStyle = K.muted; for (let i = 0; i <= 5; i++) { const y = by + bh * i / 5; g.fillRect(bx, y, i % 5 ? 5 : 9, 1); g.fillText(String(Math.round(vm * i / 5)), bx - 22, y + 4); }
    g.fillStyle = K.ink; g.fillText("mL", bx - 22, by - 4);
    g.beginPath(); g.moveTo(bx, by + bh); g.lineTo(cx - 2, by + bh + 16); g.lineTo(cx + 2, by + bh + 16); g.lineTo(bx + bw, by + bh); g.stroke();
    g.fillStyle = DOS.cont ? K.ok : K.muted; g.fillRect(cx - 9, by + bh + 4, 18, 5);
    const yb = h * .66, hb = h * .26, lb = Math.min(110, w * .44), x0 = cx - lb / 2;
    g.fillStyle = "rgba(120,160,230,.9)"; DOS.gouttes.forEach(d => { const y = by + bh + 18 + d.y * (yb - by - bh - 10); g.beginPath(); g.ellipse(cx, y, 2.6, 3.6, 0, 0, 7); g.fill(); });
    const rempli = .45 + .4 * Math.min(1, (DOS.Va + DOS.V) / (DOS.Va + vm));
    g.fillStyle = couleurIndic(pH); g.globalAlpha = .88; g.fillRect(x0 + 2, yb + hb * (1 - rempli), lb - 4, hb * rempli - 2); g.globalAlpha = 1;
    g.strokeStyle = K.ink; g.lineWidth = 2; g.beginPath(); g.moveTo(x0 - 4, yb - 4); g.lineTo(x0, yb); g.lineTo(x0, yb + hb); g.lineTo(x0 + lb, yb + hb); g.lineTo(x0 + lb, yb); g.stroke();
    const ang = DOS.tour; g.save(); g.translate(cx, yb + hb - 6); g.scale(Math.cos(ang), 1); g.fillStyle = "#fff"; g.strokeStyle = K.muted; g.lineWidth = 1; g.beginPath(); g.roundRect ? g.roundRect(-10, -3, 20, 6, 3) : g.rect(-10, -3, 20, 6); g.fill(); g.stroke(); g.restore();
    g.fillStyle = K.s2; g.fillRect(x0 - 10, yb + hb + 2, lb + 20, 14); g.strokeStyle = K.line; g.strokeRect(x0 - 10, yb + hb + 2, lb + 20, 14);
    const sx = x0 + lb - 18; g.strokeStyle = K.ink; g.lineWidth = 3; g.beginPath(); g.moveTo(sx, yb + hb - 14); g.lineTo(sx, yb - 30); g.lineTo(w - 40, yb - 30); g.lineTo(w - 40, yb - 46); g.stroke();
    const px = w - 78, py = yb - 92; g.fillStyle = "#263238"; g.fillRect(px, py, 74, 46); g.fillStyle = "#b9f6ca"; g.fillRect(px + 6, py + 6, 62, 22); g.fillStyle = "#103020"; g.font = `700 16px ${K.font}`; g.textAlign = "center"; g.fillText(fx(pH), px + 37, py + 23); g.font = `600 10px ${K.font}`; g.fillStyle = "#fff"; g.fillText("pH-mètre", px + 37, py + 41); g.textAlign = "left";
    g.fillStyle = K.ink; g.font = `600 11px ${K.font}`; g.fillText(T.ti, bx + bw + 6, by + bh - 4);
    g.fillText(T.an, x0, yb + hb + 30); g.fillStyle = K.muted; g.fillText(fx(DOS.Va, 1) + " mL", x0 + lb - 40, yb + hb + 30); }
  /* --- le graphe pH = f(V) --- */
  { const { g, w, h } = preparerCanvas(gr), m = { l: 40, r: DOS.deriv ? 50 : 14, t: 24, b: 34 }, W = w - m.l - m.r, H = h - m.t - m.b;
    const X = v => m.l + v / vm * W, Y = p => m.t + (1 - p / 14) * H;
    g.font = `500 11px ${K.font}`; g.lineWidth = 1;
    for (let p = 0; p <= 14; p += 2) { g.strokeStyle = K.line; g.beginPath(); g.moveTo(m.l, Y(p)); g.lineTo(m.l + W, Y(p)); g.stroke(); g.fillStyle = K.muted; g.fillText(p, m.l - 20, Y(p) + 4); }
    const pasV = vm > 30 ? 10 : 5; for (let v = 0; v <= vm; v += pasV) { g.strokeStyle = K.line; g.beginPath(); g.moveTo(X(v), m.t); g.lineTo(X(v), m.t + H); g.stroke(); g.fillStyle = K.muted; g.fillText(v, X(v) - 5, m.t + H + 14); }
    g.fillStyle = K.ink; g.font = `700 11px ${K.font}`; g.fillText("pH", m.l - 22, m.t - 10); g.fillText("V versé (mL)", m.l + W - 70, h - 4);
    const I = INDIC[DOS.ind]; if (DOS.ind !== "aucun") { g.fillStyle = couleurIndic((I.z[0] + I.z[1]) / 2); g.globalAlpha = .14; g.fillRect(m.l, Y(I.z[1]), W, Y(I.z[0]) - Y(I.z[1])); g.globalAlpha = 1; }
    if (DOS.theo) { g.setLineDash([4, 4]); g.strokeStyle = K.muted; g.beginPath(); for (let i = 0; i <= 300; i++) { const v = vm * i / 300; i ? g.lineTo(X(v), Y(phDosage(v))) : g.moveTo(X(v), Y(phDosage(v))); } g.stroke(); g.setLineDash([]); }
    if (DOS.deriv && DOS.pts.length > 3) { const D = []; for (let i = 5; i < DOS.pts.length; i += 5) { const [v1, p1] = DOS.pts[i - 5], [v2, p2] = DOS.pts[i]; D.push([(v1 + v2) / 2, (p2 - p1) / (v2 - v1)]); }
      const dm = Math.max(1, ...D.filter(d => d[0] > Math.min(1, ve / 4)).map(d => Math.abs(d[1]))); g.strokeStyle = K.warn; g.lineWidth = 1.5; g.beginPath(); D.forEach(([v, d], i) => { const y = m.t + H - Math.min(1, Math.abs(d) / dm) * H * .95; i ? g.lineTo(X(v), y) : g.moveTo(X(v), y); }); g.stroke();
      g.fillStyle = K.warn; g.fillText("dpH/dV", m.l + W - 40, m.t - 10); }
    g.strokeStyle = K.accent; g.lineWidth = 2.5; g.beginPath(); DOS.pts.forEach(([v, p], i) => i ? g.lineTo(X(v), Y(p)) : g.moveTo(X(v), Y(p))); g.stroke();
    const [vd, pd] = DOS.pts[DOS.pts.length - 1]; g.fillStyle = K.accent; g.beginPath(); g.arc(X(vd), Y(pd), 4.5, 0, 7); g.fill();
    if (DOS.eqv && DOS.V > ve) { const pe = phDosage(ve); g.setLineDash([5, 4]); g.strokeStyle = K.bad; g.lineWidth = 1.5; g.beginPath(); g.moveTo(X(ve), m.t + H); g.lineTo(X(ve), Y(pe)); g.lineTo(m.l, Y(pe)); g.stroke(); g.setLineDash([]);
      g.fillStyle = K.bad; g.beginPath(); g.arc(X(ve), Y(pe), 5, 0, 7); g.fill(); g.font = `700 12px ${K.font}`; g.fillText(`E (${fx(ve)} mL ; ${fx(pe)})`, Math.min(X(ve) + 8, m.l + W - 120), Y(pe) + (pe > 9 ? 18 : -8)); }
  }
  const info = document.getElementById("dInfo"); if (info) { const pe = phDosage(ve);
    info.innerHTML = `<div class="labmesures"><span><small>V versé</small><b>${fx(DOS.V)} mL</b></span><span><small>pH</small><b>${fx(pH)}</b></span><span><small>Avancement</small><b>${DOS.V < ve - .02 ? "avant l'équivalence" : DOS.V > ve + .02 ? "après l'équivalence" : "à l'équivalence"}</b></span></div>
      <p class="labeq">Réaction support du titrage : <b>${T.eq}</b></p>
      ${DOS.eqv ? `<p class="labeq">À l'équivalence, les réactifs ont été introduits dans les proportions stœchiométriques : C × V<sub>A</sub> = C<sub>titrant</sub> × V<sub>E</sub>, d'où V<sub>E</sub> = ${fx(DOS.Ca)} × ${fx(DOS.Va, 1)} / ${fx(DOS.Cb, 3)} = <b>${fx(ve)} mL</b> et pH<sub>E</sub> ≈ <b>${fx(pe)}</b>.${T.pKa > 0 && T.pKa < 14 ? ` À la demi-équivalence (${fx(ve / 2)} mL), pH = pK<sub>A</sub> = ${fx(T.pKa)}.` : ""}</p>` : `<p class="labeq muted">Astuce : verse lentement près du saut de pH, puis coche « Repérer l'équivalence » pour vérifier ta lecture.</p>`}`; }
}

/* ---------------------------------------------------------------- TIR PARABOLIQUE */
const PLANETES = [[9.81, "Terre (9,81 m/s²)"], [1.62, "Lune (1,62 m/s²)"], [3.71, "Mars (3,71 m/s²)"], [24.79, "Jupiter (24,79 m/s²)"]];
const TIR = { v0: 15, a: 45, h0: 0, g: 9.81, vec: true, comp: true, chrono: true, prev: false, lent: false, t: 0, run: false, fini: false, traces: [] };
const tirParams = () => ({ v0: TIR.v0, a: TIR.a * Math.PI / 180, h0: TIR.h0, g: TIR.g });
function tirInfos(P){
  const vx = P.v0 * Math.cos(P.a), vy0 = P.v0 * Math.sin(P.a), tf = (vy0 + Math.sqrt(vy0 * vy0 + 2 * P.g * P.h0)) / P.g;
  return { vx, vy0, tf, portee: vx * tf, tm: Math.max(0, vy0 / P.g), hmax: P.h0 + Math.max(0, vy0 * vy0 / (2 * P.g)) };
}
const posTir = (P, t) => ({ x: P.v0 * Math.cos(P.a) * t, y: P.h0 + P.v0 * Math.sin(P.a) * t - P.g * t * t / 2, vx: P.v0 * Math.cos(P.a), vy: P.v0 * Math.sin(P.a) - P.g * t });
function uiTir(){
  return `<div class="labctl">
    ${curseur("tV", "Vitesse initiale v₀", 1, 30, 0.5, TIR.v0, "m/s")}
    ${curseur("tA", "Angle de tir α", 0, 90, 1, TIR.a, "°")}
    ${curseur("tH", "Hauteur de lancement h₀", 0, 20, 0.5, TIR.h0, "m")}
    ${choix("tG", "Champ de pesanteur g", PLANETES, TIR.g)}
    <div class="labbtns"><button class="btn sm" data-lab="lancer">${icon("play")} Lancer</button><button class="btn sm tonal" data-lab="pause">${icon("pause")} Pause</button><button class="btn sm ghost" data-lab="garder">${icon("copy")} Garder la trajectoire</button><button class="btn sm ghost" data-lab="effacer">${icon("trash")} Effacer</button></div>
    <div class="labopts">${coche("tVec", "Vecteur vitesse v", TIR.vec)}${coche("tComp", "Composantes vₓ et v<sub>y</sub>", TIR.comp)}${coche("tChr", "Chronophotographie (toutes les 0,1 s)", TIR.chrono)}${coche("tPrev", "Trajectoire prévue", TIR.prev)}${coche("tLent", "Ralenti ×¼", TIR.lent)}</div>
    <div class="labinfo" id="tInfo"></div>
  </div>
  <div class="labscene seul"><canvas id="tCv" class="labcv tir" role="img" aria-label="Trajectoire du projectile"></canvas></div>`;
}
function initTir(p){
  const q = s => p.querySelector(s), arret = () => { TIR.run = false; TIR.t = 0; TIR.fini = false; };
  const lier = (id, cle, u, n) => { q("#" + id).oninput = e => { TIR[cle] = Number(e.target.value); q("#" + id + "O").textContent = fx(TIR[cle], n) + " " + u; arret(); }; };
  lier("tV", "v0", "m/s", 1); lier("tA", "a", "°", 0); lier("tH", "h0", "m", 1);
  q("#tG").onchange = e => { TIR.g = Number(e.target.value); arret(); };
  [["tVec", "vec"], ["tComp", "comp"], ["tChr", "chrono"], ["tPrev", "prev"], ["tLent", "lent"]].forEach(([id, k]) => q("#" + id).onchange = e => { TIR[k] = e.target.checked; });
  p.querySelector(".labbtns").addEventListener("click", e => { const b = e.target.closest("[data-lab]"); if (!b) return; const k = b.dataset.lab;
    if (k === "lancer") { TIR.t = 0; TIR.fini = false; TIR.run = true; }
    else if (k === "pause") { if (TIR.fini) return; TIR.run = !TIR.run; }
    else if (k === "garder") { const P = tirParams(); if (TIR.traces.length >= 4) TIR.traces.shift(); TIR.traces.push(P); toast("Trajectoire gardée pour comparer"); }
    else if (k === "effacer") { TIR.traces = []; arret(); } });
  let t0 = performance.now();
  const boucle = t => { const dt = Math.min(.05, (t - t0) / 1000); t0 = t;
    if (TIR.run) { const I = tirInfos(tirParams()); TIR.t += dt * (TIR.lent ? .25 : 1); if (TIR.t >= I.tf) { TIR.t = I.tf; TIR.run = false; TIR.fini = true; } }
    dessinTir(); LAB.raf = requestAnimationFrame(boucle); };
  arret(); LAB.dessiner = dessinTir; LAB.raf = requestAnimationFrame(boucle);
}
function fleche(g, x1, y1, x2, y2, c, lbl){
  const L = Math.hypot(x2 - x1, y2 - y1); if (L < 3) return; const a = Math.atan2(y2 - y1, x2 - x1);
  g.strokeStyle = g.fillStyle = c; g.lineWidth = 2.4; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
  g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - 10 * Math.cos(a - .4), y2 - 10 * Math.sin(a - .4)); g.lineTo(x2 - 10 * Math.cos(a + .4), y2 - 10 * Math.sin(a + .4)); g.closePath(); g.fill();
  if (lbl) { g.font = `700 12px ${couleursLab().font}`; g.fillText(lbl, x2 + 6 * Math.cos(a) + 4, y2 + 6 * Math.sin(a) - 4); }
}
function dessinTir(){
  const cv = document.getElementById("tCv"); if (!cv) return;
  const K = couleursLab(), { g, w, h } = preparerCanvas(cv), P = tirParams(), I = tirInfos(P);
  const toutes = [P, ...TIR.traces].map(tirInfos), Xm = Math.max(5, ...toutes.map(x => x.portee)) * 1.08, Ym = Math.max(3, ...toutes.map(x => x.hmax)) * 1.15;
  const m = { l: 44, r: 16, t: 14, b: 44 }, W = w - m.l - m.r, H = h - m.t - m.b, k = Math.min(W / Xm, H / Ym);
  const X = x => m.l + x * k, Y = y => m.t + H - y * k;
  const pasG = [1, 2, 5, 10, 20, 50, 100].find(s => s * k > 38) || 200; g.font = `500 11px ${K.font}`; g.lineWidth = 1;
  for (let x = 0; X(x) <= m.l + W; x += pasG) { g.strokeStyle = K.line; g.beginPath(); g.moveTo(X(x), m.t); g.lineTo(X(x), Y(0)); g.stroke(); g.fillStyle = K.muted; g.fillText(x, X(x) - 4, Y(0) + 14); }
  for (let y = 0; Y(y) >= m.t; y += pasG) { g.strokeStyle = K.line; g.beginPath(); g.moveTo(m.l, Y(y)); g.lineTo(m.l + W, Y(y)); g.stroke(); g.fillStyle = K.muted; g.fillText(y, m.l - 22, Y(y) + 4); }
  g.fillStyle = K.ink; g.font = `700 11px ${K.font}`; g.fillText("x (m)", m.l + W - 34, h - 4); g.fillText("y (m)", 6, m.t + 8);
  g.fillStyle = "rgba(110,160,80,.25)"; g.fillRect(m.l, Y(0), W, 6); g.strokeStyle = K.ink; g.lineWidth = 2; g.beginPath(); g.moveTo(m.l, Y(0)); g.lineTo(m.l + W, Y(0)); g.stroke();
  if (P.h0 > 0) { g.fillStyle = K.s2; g.strokeStyle = K.muted; g.lineWidth = 1; g.fillRect(m.l - 14, Y(P.h0), 14, Y(0) - Y(P.h0)); g.strokeRect(m.l - 14, Y(P.h0), 14, Y(0) - Y(P.h0)); }
  const coul = ["#9AA0A6", "#A142F4", "#12B5CB", "#F29900"];
  TIR.traces.forEach((Q, i) => { const J = tirInfos(Q); g.strokeStyle = coul[i % 4]; g.globalAlpha = .7; g.lineWidth = 2; g.setLineDash([6, 4]); g.beginPath(); for (let j = 0; j <= 120; j++) { const s = posTir(Q, J.tf * j / 120); j ? g.lineTo(X(s.x), Y(s.y)) : g.moveTo(X(s.x), Y(s.y)); } g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
    g.fillStyle = coul[i % 4]; g.font = `600 10px ${K.font}`; { const sm = posTir(Q, J.tm); g.fillText(`${fx(Q.v0, 1)} m/s · ${Math.round(Q.a * 180 / Math.PI)}°`, X(sm.x) - 30, Y(sm.y) - 8); } });
  if (TIR.prev) { g.strokeStyle = K.muted; g.lineWidth = 1.2; g.setLineDash([2, 5]); g.beginPath(); for (let j = 0; j <= 120; j++) { const s = posTir(P, I.tf * j / 120); j ? g.lineTo(X(s.x), Y(s.y)) : g.moveTo(X(s.x), Y(s.y)); } g.stroke(); g.setLineDash([]); }
  g.save(); g.translate(X(0), Y(P.h0)); g.rotate(-P.a); g.fillStyle = K.ink; g.fillRect(-6, -5, 28, 10); g.restore(); g.fillStyle = K.muted; g.beginPath(); g.arc(X(0), Y(P.h0), 7, 0, 7); g.fill();
  const t = TIR.t;
  if (t > 0) { g.strokeStyle = K.accent; g.lineWidth = 2; g.beginPath(); for (let j = 0; j <= 100; j++) { const s = posTir(P, t * j / 100); j ? g.lineTo(X(s.x), Y(s.y)) : g.moveTo(X(s.x), Y(s.y)); } g.stroke();
    if (TIR.chrono) { g.fillStyle = K.accent; for (let tt = 0; tt <= t + 1e-9; tt += .1) { const s = posTir(P, tt); g.beginPath(); g.arc(X(s.x), Y(s.y), 2.6, 0, 7); g.fill(); } } }
  const s = posTir(P, t), px = X(s.x), py = Y(Math.max(0, s.y)), ech = Math.min(4.5, 90 / Math.max(P.v0, 1));
  if (TIR.comp) { fleche(g, px, py, px + s.vx * ech, py, "#1A73E8", "vₓ"); fleche(g, px, py, px, py - s.vy * ech, "#D93025", "vy"); }
  if (TIR.vec) fleche(g, px, py, px + s.vx * ech, py - s.vy * ech, K.ok, "v");
  fleche(g, px - 24, py - 44, px - 24, py - 10, "#F29900", "g");
  g.fillStyle = K.ink; g.beginPath(); g.arc(px, py, 7, 0, 7); g.fill(); g.fillStyle = "#fff"; g.beginPath(); g.arc(px - 2, py - 2, 2, 0, 7); g.fill();
  if (TIR.fini) { g.strokeStyle = K.bad; g.setLineDash([4, 4]); g.lineWidth = 1.3; const sm = posTir(P, I.tm); if (I.tm > 0) { g.beginPath(); g.moveTo(X(sm.x), Y(sm.y)); g.lineTo(X(sm.x), Y(0)); g.stroke(); }
    g.setLineDash([]); g.fillStyle = K.bad; g.font = `700 12px ${K.font}`; g.fillText(`portée ${fx(I.portee, 1)} m`, Math.max(m.l, X(I.portee) - 125), Y(0) - 12); if (I.tm > 0) g.fillText(`flèche ${fx(I.hmax, 1)} m`, X(sm.x) + 6, Y(sm.y) - 8); }
  const info = document.getElementById("tInfo"); if (info) {
    const v = Math.hypot(s.vx, s.vy), c = fx(P.v0 * Math.cos(P.a)), sn = fx(P.v0 * Math.sin(P.a));
    info.innerHTML = `<div class="labmesures"><span><small>t</small><b>${fx(t)} s</b></span><span><small>x</small><b>${fx(s.x)} m</b></span><span><small>y</small><b>${fx(Math.max(0, s.y))} m</b></span><span><small>vₓ</small><b>${fx(s.vx)} m/s</b></span><span><small>v<sub>y</sub></small><b>${fx(s.vy)} m/s</b></span><span><small>v</small><b>${fx(v)} m/s</b></span></div>
      <p class="labeq">Équations horaires : <b>x(t) = ${c} t</b> et <b>y(t) = −${fx(P.g / 2, 3)} t² + ${sn} t${P.h0 ? " + " + fx(P.h0, 1) : ""}</b></p>
      <p class="labeq">${TIR.fini ? `Arrivée au sol après <b>${fx(I.tf)} s</b> · portée <b>${fx(I.portee, 1)} m</b> · flèche <b>${fx(I.hmax, 1)} m</b>. Remarque : vₓ reste constante, seule v<sub>y</sub> varie (a = g).` : `Clique sur « Lancer ». Avec les points de la chronophotographie, observe que l'écart horizontal entre deux points reste le même.`}</p>`; }
}

LAB_DEF.dosage = { ui: uiDosage, init: initDosage }; LAB_DEF.tir = { ui: uiTir, init: initTir };
/* points d'entrée : page Simulations, « Pour s'entraîner » dans les chapitres */
const _vueSimulations = VUES_PRO.simulations;
VUES_PRO.simulations = function(){ const h = _vueSimulations.apply(this, arguments), i = h.indexOf('<section class="simgroupe">'); return i < 0 ? h + blocLabs() : h.slice(0, i) + blocLabs() + h.slice(i); };
const _cataloguePratique = cataloguePratique;
cataloguePratique = function(){ return [...LABS.map(l => ({ k: "l:" + l.id, t: l.t, type: "Simulation animée", sous: "PhysiquePro · " + l.niv, ic: "play" })), ..._cataloguePratique()]; };
const _ouvrirPratique = ouvrirPratique;
ouvrirPratique = function(k){ if (k.startsWith("l:")) { ouvrirLab(k.slice(2)); return; } _ouvrirPratique(k); };
IC.pause = IC.pause || '<path d="M7 5h3v14H7zM14 5h3v14h-3z"/>';
