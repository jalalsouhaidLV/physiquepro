/* =====================================================================
   Outils Scientifiques Importants : éditeur de formules, chimie,
   mesures et incertitudes, SNT, SI et technologie
   ===================================================================== */
IC.codeb = '<path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>';
const OUTILS_PLUS = {};
const nb = v => { const x = Number(String(v ?? "").replace(/\s/g, "").replace(",", ".")); return isFinite(x) && String(v ?? "").trim() !== "" ? x : NaN; };
const champ = (id, lib, val, unite, ph) => `<label class="ochamp"><span>${lib}</span><span class="ochin"><input id="${id}" data-oi="1" value="${esc(val ?? "")}" inputmode="decimal" placeholder="${esc(ph || "")}">${unite ? `<em>${unite}</em>` : ""}</span></label>`;
const carteOutil = (titre, desc, corps, id) => `<section class="ocarte" ${id ? `id="${id}"` : ""}><h3>${titre}</h3>${desc ? `<p class="muted">${desc}</p>` : ""}${corps}</section>`;
const OV = {}; // valeurs saisies (gardées entre deux affichages)
const ov = id => OV[id] ?? "";

/* ---------- Éditeur de formules (KaTeX + mhchem) ---------- */
const KATEX = "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/";
let katexPret = null;
function chargerKatex(){
  if (katexPret) return katexPret;
  katexPret = new Promise((ok, ko) => {
    const l = document.createElement("link"); l.rel = "stylesheet"; l.href = KATEX + "katex.min.css"; document.head.appendChild(l);
    const s = document.createElement("script"); s.src = KATEX + "katex.min.js"; s.onload = () => { const m = document.createElement("script"); m.src = KATEX + "contrib/mhchem.min.js"; m.onload = ok; m.onerror = ok; document.head.appendChild(m); }; s.onerror = ko; document.head.appendChild(s);
  });
  return katexPret;
}
const FORMULES_BTN = [
  ["Structure", [["a/b", "\\frac{a}{b}", "Fraction"], ["x²", "x^{2}", "Puissance"], ["xᵢ", "x_{i}", "Indice"], ["√", "\\sqrt{x}", "Racine carrée"], ["ⁿ√", "\\sqrt[n]{x}", "Racine n-ième"], ["( )", "\\left( x \\right)", "Parenthèses adaptées"], ["|x|", "\\left| x \\right|", "Valeur absolue"], ["F⃗", "\\vec{F}", "Vecteur"], ["AB⃗", "\\overrightarrow{AB}", "Vecteur AB"], ["x̄", "\\bar{x}", "Moyenne"], ["ẋ", "\\dot{x}", "Dérivée temporelle"], ["10ⁿ", "\\times 10^{n}", "Notation scientifique"]]],
  ["Symboles", [["×", "\\times", ""], ["·", "\\cdot", ""], ["÷", "\\div", ""], ["±", "\\pm", ""], ["≈", "\\approx", ""], ["≠", "\\neq", ""], ["≤", "\\leq", ""], ["≥", "\\geq", ""], ["∝", "\\propto", "Proportionnel à"], ["∞", "\\infty", ""], ["°", "^{\\circ}", "Degré"], ["Δ", "\\Delta", ""], ["∂", "\\partial", ""], ["∑", "\\sum_{i=1}^{n}", "Somme"], ["∫", "\\int_{a}^{b}", "Intégrale"], ["lim", "\\lim_{x \\to 0}", "Limite"], ["d/dt", "\\frac{\\mathrm{d}x}{\\mathrm{d}t}", "Dérivée"], ["→", "\\rightarrow", ""], ["⇔", "\\Leftrightarrow", ""], ["⇒", "\\Rightarrow", ""]]],
  ["Vecteurs", [["v⃗", "\\vec{v}", "Vitesse"], ["a⃗", "\\vec{a}", "Accélération"], ["F⃗", "\\vec{F}", "Force"], ["P⃗", "\\vec{P}", "Poids"], ["R⃗", "\\vec{R}", "Réaction du support"], ["T⃗", "\\vec{T}", "Tension d'un fil"], ["f⃗", "\\vec{f}", "Frottements"], ["p⃗", "\\vec{p}", "Quantité de mouvement"], ["g⃗", "\\vec{g}", "Champ de pesanteur"], ["E⃗", "\\vec{E}", "Champ électrique"], ["B⃗", "\\vec{B}", "Champ magnétique"], ["OM⃗", "\\overrightarrow{OM}", "Vecteur position"], ["AB⃗", "\\overrightarrow{AB}", "Vecteur AB"], ["‖v⃗‖", "\\left\\| \\vec{v} \\right\\|", "Norme"], ["i⃗ j⃗ k⃗", "\\vec{i}, \\vec{j}, \\vec{k}", "Base"], ["u⃗ₜ", "\\vec{u}_{T}", "Vecteur unitaire tangent"], ["u⃗ₙ", "\\vec{u}_{N}", "Vecteur unitaire normal"], ["0⃗", "\\vec{0}", "Vecteur nul"], ["u⃗·v⃗", "\\vec{u} \\cdot \\vec{v}", "Produit scalaire"], ["(x;y)", "\\begin{pmatrix} x \\\\ y \\end{pmatrix}", "Coordonnées (colonne)"], ["(x;y;z)", "\\begin{pmatrix} x \\\\ y \\\\ z \\end{pmatrix}", "Coordonnées 3D"], ["ΣF⃗=ma⃗", "\\sum \\vec{F}_{\\text{ext}} = m \\vec{a}", "2e loi de Newton"], ["v⃗=dOM⃗/dt", "\\vec{v} = \\frac{\\mathrm{d}\\overrightarrow{OM}}{\\mathrm{d}t}", "Vitesse"], ["a⃗=dv⃗/dt", "\\vec{a} = \\frac{\\mathrm{d}\\vec{v}}{\\mathrm{d}t}", "Accélération"], ["Δv⃗", "\\Delta \\vec{v}", "Variation de vitesse"]]],
  ["Grec", "α β γ δ ε η θ λ μ ν π ρ σ τ φ ψ ω Γ Δ Θ Λ Π Σ Φ Ψ Ω".split(" ").map(g => [g, "\\" + { α: "alpha", β: "beta", γ: "gamma", δ: "delta", ε: "varepsilon", η: "eta", θ: "theta", λ: "lambda", μ: "mu", ν: "nu", π: "pi", ρ: "rho", σ: "sigma", τ: "tau", φ: "varphi", ψ: "psi", ω: "omega", Γ: "Gamma", Δ: "Delta", Θ: "Theta", Λ: "Lambda", Π: "Pi", Σ: "Sigma", Φ: "Phi", Ψ: "Psi", Ω: "Omega" }[g] + " ", ""])],
  ["Chimie", [["→", "\\ce{A + B -> C}", "Équation de réaction"], ["⇌", "\\ce{A + B <=> C + D}", "Équilibre"], ["H₂O", "\\ce{H2O}", "Formule brute"], ["SO₄²⁻", "\\ce{SO4^2-}", "Ion"], ["Ox/Red", "\\ce{Cu^2+ + 2e- -> Cu}", "Demi-équation"], ["(aq)", "\\ce{Na+(aq)}", "État physique"], ["¹⁴₆C", "\\ce{^{14}_{6}C}", "Noyau (A, Z)"], ["β⁻", "\\ce{^{14}_{6}C -> ^{14}_{7}N + ^{0}_{-1}e}", "Désintégration"], ["[ ]", "[\\ce{H3O+}]", "Concentration"]]],
  ["Unités", [["mol·L⁻¹", "\\text{ mol·L}^{-1}", ""], ["m·s⁻¹", "\\text{ m·s}^{-1}", ""], ["m·s⁻²", "\\text{ m·s}^{-2}", ""], ["g·mol⁻¹", "\\text{ g·mol}^{-1}", ""], ["J", "\\text{ J}", ""], ["W", "\\text{ W}", ""], ["Ω", "\\text{ }\\Omega", ""], ["°C", "\\text{ }^{\\circ}\\text{C}", ""], ["kg·m⁻³", "\\text{ kg·m}^{-3}", ""], ["Pa", "\\text{ Pa}", ""]]]
];
const EXEMPLES_FORMULES = [["Énergie cinétique", "E_c = \\frac{1}{2} m v^{2}"], ["2e loi de Newton", "\\sum \\vec{F} = m \\vec{a}"], ["Concentration", "C = \\frac{n}{V} = \\frac{m}{M \\times V}"], ["Combustion du méthane", "\\ce{CH4 + 2O2 -> CO2 + 2H2O}"], ["Gaz parfait", "P V = n R T"], ["Décroissance radioactive", "N(t) = N_0 \\, e^{-\\lambda t}"], ["pH", "\\mathrm{pH} = -\\log\\left(\\frac{[\\ce{H3O+}]}{c^{\\circ}}\\right)"], ["Snell-Descartes", "n_1 \\sin(i_1) = n_2 \\sin(i_2)"]];
OUTILS_PLUS.formules = function(){
  if (!window.katex) chargerKatex().then(() => { if (route().v === "physique") apercuFormule(); }).catch(() => {});
  const v = OV.formule ?? "E_c = \\frac{1}{2} m v^{2}";
  return `<div class="fmgrille"><div class="fmgauche">
      ${FORMULES_BTN.map(([g, L]) => `<div class="fmgroupe"><small>${g}</small><div class="fmbtns">${L.map(([l, c, t]) => `<button class="fmb" data-act="fmins" data-c="${esc(c)}" title="${esc(t || c)}">${esc(l).replace(/(OM|AB|[A-Za-z0-9])\u20D7/g, '<span class="vl">$1</span>')}</button>`).join("")}</div></div>`).join("")}
    </div><div class="fmdroite">
      <label class="ochamp"><span>Formule (écris ou clique sur les boutons) — notation LaTeX, équations chimiques avec \\ce{…}</span><textarea id="fmTxt" rows="4" spellcheck="false">${esc(v)}</textarea></label>
      <div id="fmApercu" class="fmapercu" aria-live="polite">${window.katex ? "" : "Chargement de l'éditeur…"}</div>
      <div class="fmactions"><button class="btn sm" data-act="fmword">${icon("copy")} Copier pour Word / OneNote</button><button class="btn ghost sm" data-act="fmlatex">${icon("copy")} Copier le code LaTeX</button><button class="btn ghost sm" data-act="fmpng">${icon("down")} Télécharger en image</button></div>
      <div class="fmex"><small>Exemples :</small>${EXEMPLES_FORMULES.map(([n, f]) => `<button class="chip" data-act="fmex" data-c="${esc(f)}">${esc(n)}</button>`).join("")}</div>
      <p class="muted" style="font-size:.78rem;margin:0">« Copier pour Word » colle une vraie équation modifiable dans Word (Ctrl+V). L'image se colle partout (Pronote, Teams, diaporama…).</p></div></div>`;
};
function apercuFormule(){
  const t = document.getElementById("fmTxt"), z = document.getElementById("fmApercu"); if (!t || !z) return;
  OV.formule = t.value; if (!window.katex) { z.textContent = "Chargement de l'éditeur…"; return; }
  try { z.innerHTML = katex.renderToString(t.value || "\\text{…}", { displayMode: true, throwOnError: true, strict: false }); z.classList.remove("err"); }
  catch (e) { z.textContent = "Formule incomplète : " + (e.message || "").replace(/^KaTeX parse error: /, ""); z.classList.add("err"); }
}
function insererFormule(code){
  const t = document.getElementById("fmTxt"); if (!t) return; const a = t.selectionStart ?? t.value.length, b = t.selectionEnd ?? a, sel = t.value.slice(a, b);
  let c = code; if (sel && /\{[a-z]\}|\bx\b/.test(c)) c = c.replace(/\{[a-z]\}|\bx\b/, m => m.startsWith("{") ? "{" + sel + "}" : sel);
  t.value = t.value.slice(0, a) + c + t.value.slice(b); t.focus(); const p = a + c.length; t.setSelectionRange(p, p); apercuFormule();
}
async function imageFormule(){
  const z = document.querySelector("#fmApercu .katex-display") || document.getElementById("fmApercu"); if (!z) return;
  await chargerScriptUne("https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js", () => window.htmlToImage);
  const url = await window.htmlToImage.toPng(z, { backgroundColor: "#ffffff", pixelRatio: 3, style: { margin: "0", padding: "12px" } });
  const l = document.createElement("a"); l.download = "formule.png"; l.href = url; l.click();
}
function chargerScriptUne(url, test){ if (test()) return Promise.resolve(); return new Promise((ok, ko) => { const s = document.createElement("script"); s.src = url; s.onload = ok; s.onerror = ko; document.head.appendChild(s); }); }

/* ---------- Chimie : masse molaire, quantités, dilution, équilibrage ---------- */
const MASSES = Object.fromEntries(ELEM.map(e => [e.s, e.m]));
function analyserFormule(f){
  f = String(f).replace(/\s/g, "").replace(/[·•.*](\d*)/g, "+$1").replace(/[₀-₉]/g, c => "0123456789"["₀₁₂₃₄₅₆₇₈₉".indexOf(c)]);
  const parties = f.split("+").filter(Boolean), total = {};
  for (const p of parties) {
    const mm = p.match(/^(\d+)(.*)$/), k = mm && !/^\d+$/.test(p) ? Number(mm[1]) : 1, corps = mm && !/^\d+$/.test(p) ? mm[2] : p;
    let i = 0;
    const lire = () => { const o = {}; while (i < corps.length) { const c = corps[i];
        if (c === "(" || c === "[") { i++; const sous = lire(); i++; const n = corps.slice(i).match(/^\d+/); const q = n ? Number(n[0]) : 1; if (n) i += n[0].length; for (const e in sous) o[e] = (o[e] || 0) + sous[e] * q; }
        else if (c === ")" || c === "]") return o;
        else { const m = corps.slice(i).match(/^([A-Z][a-z]?)(\d*)/); if (!m) throw new Error("Symbole inconnu près de « " + corps.slice(i) + " »"); if (!MASSES[m[1]]) throw new Error("Élément inconnu : " + m[1]); o[m[1]] = (o[m[1]] || 0) + (m[2] ? Number(m[2]) : 1); i += m[0].length; } }
      return o; };
    const o = lire(); for (const e in o) total[e] = (total[e] || 0) + o[e] * k;
  }
  if (!Object.keys(total).length) throw new Error("Écris une formule, par exemple C6H12O6 ou Ca(OH)2.");
  return total;
}
const masseMolaire = o => Object.entries(o).reduce((a, [e, n]) => a + MASSES[e] * n, 0);
/* équilibrage : noyau d'une matrice (méthode de Gauss en fractions) */
function pgcd(a, b){ a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; }
function equilibrer(txt){
  const [g, d] = String(txt).replace(/=|⟶|→|->/g, "=").split("="); if (!d) throw new Error("Sépare les réactifs et les produits par une flèche : ->");
  const esp = s => s.split(/\s\+\s|\+(?=\s*[A-Z(])/).map(x => x.trim()).filter(Boolean).map(x => x.replace(/^\d+\s*/, ""));
  const R = esp(g), P = esp(d), tous = [...R, ...P], comp = tous.map(x => analyserFormule(x.replace(/\^\d*[+-]$|[+-]$/, "")));
  const charges = tous.map(x => { const m = x.match(/\^(\d*)([+-])$/) || x.match(/()([+-])$/); return m ? (m[2] === "+" ? 1 : -1) * (m[1] ? Number(m[1]) : 1) : 0; });
  const els = [...new Set(comp.flatMap(o => Object.keys(o)))];
  const M = els.map(e => tous.map((_, j) => (comp[j][e] || 0) * (j < R.length ? 1 : -1)));
  if (charges.some(c => c)) M.push(tous.map((_, j) => charges[j] * (j < R.length ? 1 : -1)));
  const n = tous.length, A = M.map(r => r.map(v => [v, 1]));
  const sub = (x, y) => norm([x[0] * y[1] - y[0] * x[1], x[1] * y[1]]), mul = (x, y) => norm([x[0] * y[0], x[1] * y[1]]), div = (x, y) => norm([x[0] * y[1], x[1] * y[0]]);
  function norm(f){ if (f[1] < 0) f = [-f[0], -f[1]]; const k = pgcd(f[0], f[1]) || 1; return [f[0] / k, f[1] / k]; }
  let lig = 0; const piv = [];
  for (let c = 0; c < n && lig < A.length; c++) { let r = A.findIndex((row, i) => i >= lig && row[c][0] !== 0); if (r < 0) continue; [A[lig], A[r]] = [A[r], A[lig]];
    const p = A[lig][c]; A[lig] = A[lig].map(x => div(x, p)); A.forEach((row, i) => { if (i !== lig && row[c][0]) { const f = row[c]; A[i] = row.map((x, k) => sub(x, mul(f, A[lig][k]))); } }); piv.push(c); lig++; }
  const libres = [...Array(n).keys()].filter(c => !piv.includes(c)); if (libres.length !== 1) throw new Error(libres.length ? "Plusieurs ajustements possibles : vérifie l'équation." : "Équation impossible à ajuster : vérifie les formules.");
  const x = Array(n).fill(null); x[libres[0]] = [1, 1]; piv.forEach((c, i) => { x[c] = norm([-A[i][libres[0]][0], A[i][libres[0]][1]]); });
  const den = x.reduce((a, f) => a * f[1] / pgcd(a, f[1]), 1); let co = x.map(f => f[0] * den / f[1]); const g2 = co.reduce((a, v) => pgcd(a, v), 0); co = co.map(v => v / g2); if (co.some(v => v <= 0)) co = co.map(v => -v);
  if (co.some(v => v <= 0)) throw new Error("Équation impossible à ajuster : vérifie les réactifs et les produits.");
  const ecr = (L, off) => L.map((s2, i) => (co[off + i] === 1 ? "" : co[off + i] + " ") + s2).join(" + ");
  return ecr(R, 0) + " → " + ecr(P, R.length);
}
const formuleJolie = f => esc(f).replace(/(\d+)/g, "<sub>$1</sub>").replace(/<sub>(\d+)<\/sub>([+-])$/,"<sup>$1$2</sup>");
function cartesChimieBase(){
  let mmRes = ""; try { if (ov("mmF")) { const o = analyserFormule(ov("mmF")), M = masseMolaire(o); mmRes = `<div class="ores"><b>M(${esc(ov("mmF"))}) = ${fmtNote(Math.round(M * 100) / 100)} g·mol⁻¹</b><small>${Object.entries(o).map(([e, n]) => `${n} × M(${e}) = ${n} × ${fmtNote(MASSES[e])}`).join(" + ")}</small></div>`; } } catch (e) { mmRes = `<div class="ores err">${esc(e.message)}</div>`; }
  let eqRes = ""; try { if (ov("eqT")) eqRes = `<div class="ores"><b>${esc(equilibrer(ov("eqT")))}</b></div>`; } catch (e) { eqRes = `<div class="ores err">${esc(e.message)}</div>`; }
  const m = nb(ov("qm")), M = nb(ov("qM")), V = nb(ov("qV")), n = nb(ov("qn"));
  let qRes = ""; if (isFinite(m) && isFinite(M)) qRes += `n = m / M = <b>${fmtSci(m / M)} mol</b>`; if (isFinite(V) && V > 0 && isFinite(m)) qRes += `${qRes ? "<br>" : ""}C<sub>m</sub> = m / V = <b>${fmtSci(m / V)} g·L⁻¹</b>`;
  if (isFinite(V) && V > 0) { const nn = isFinite(n) ? n : isFinite(m) && isFinite(M) ? m / M : NaN; if (isFinite(nn)) qRes += `${qRes ? "<br>" : ""}C = n / V = <b>${fmtSci(nn / V)} mol·L⁻¹</b>`; }
  const C1 = nb(ov("dC1")), V1 = nb(ov("dV1")), C2 = nb(ov("dC2")), V2 = nb(ov("dV2")), conn = [C1, V1, C2, V2].filter(isFinite).length;
  let dRes = ""; if (conn === 3) { const r = !isFinite(C1) ? ["C₁", C2 * V2 / V1] : !isFinite(V1) ? ["V₁", C2 * V2 / C1] : !isFinite(C2) ? ["C₂", C1 * V1 / V2] : ["V₂", C1 * V1 / C2]; dRes = `<div class="ores"><b>${r[0]} = ${fmtSci(r[1])}</b><small>C₁ × V₁ = C₂ × V₂ (même unité de volume des deux côtés) · facteur de dilution F = ${fmtSci((isFinite(C1) ? C1 : C2 * V2 / V1) / (isFinite(C2) ? C2 : C1 * V1 / V2))}</small></div>`; }
  const h = nb(ov("phH")), p = nb(ov("phP"));
  const phRes = isFinite(h) && h > 0 ? `<div class="ores"><b>pH = ${fmtNote(Math.round(-Math.log10(h) * 100) / 100)}</b></div>` : isFinite(p) ? `<div class="ores"><b>[H₃O⁺] = ${fmtSci(10 ** -p)} mol·L⁻¹</b></div>` : "";
  return {
    mm: carteOutil("Masse molaire", "Écris une formule brute : C6H12O6, Ca(OH)2, CuSO4·5H2O…", `<label class="ochamp"><span>Formule</span><span class="ochin"><input id="mmF" data-oi="1" value="${esc(ov("mmF"))}" placeholder="C6H12O6" spellcheck="false"></span></label>${mmRes}`),
    eq: carteOutil("Ajuster une équation", "Exemple : CH4 + O2 -> CO2 + H2O · ions : Cu^2+ + Fe -> Cu + Fe^2+", `<label class="ochamp"><span>Équation</span><span class="ochin"><input id="eqT" data-oi="1" value="${esc(ov("eqT"))}" placeholder="CH4 + O2 -> CO2 + H2O" spellcheck="false"></span></label>${eqRes}`),
    q: carteOutil("Quantité de matière et concentrations", "Remplis ce que tu connais.", `<div class="ochamps">${champ("qm", "Masse m", ov("qm"), "g")}${champ("qM", "Masse molaire M", ov("qM"), "g·mol⁻¹")}${champ("qn", "Quantité n", ov("qn"), "mol")}${champ("qV", "Volume V", ov("qV"), "L")}</div>${qRes ? `<div class="ores">${qRes}</div>` : ""}`),
    dil: carteOutil("Dilution", "Remplis 3 valeurs sur 4 : la 4e est calculée.", `<div class="ochamps">${champ("dC1", "C₁ (mère)", ov("dC1"), "")}${champ("dV1", "V₁ prélevé", ov("dV1"), "")}${champ("dC2", "C₂ (fille)", ov("dC2"), "")}${champ("dV2", "V₂ (fiole)", ov("dV2"), "")}</div>${dRes}`),
    ph: carteOutil("pH ↔ concentration en ions H₃O⁺", "Remplis l'un ou l'autre.", `<div class="ochamps">${champ("phH", "[H₃O⁺]", ov("phH"), "mol·L⁻¹", "1e-3")}${champ("phP", "pH", ov("phP"), "")}</div>${phRes}`),
  };
};

/* ---------- Mesures et incertitudes (type A) ---------- */
OUTILS_PLUS.mesures = function(){
  const L = String(ov("mxL")).split(/[\s;]+/).map(nb).filter(isFinite), n = L.length, ref = nb(ov("mxR"));
  let res = "";
  if (n >= 2) { const moy = L.reduce((a, b) => a + b, 0) / n, s = Math.sqrt(L.reduce((a, x) => a + (x - moy) ** 2, 0) / (n - 1)), u = s / Math.sqrt(n);
    const ch = u ? Math.max(0, -Math.floor(Math.log10(u)) + (Number(String(u.toExponential(1))[0]) < 2 ? 1 : 0)) : 3, arr = x => fmtNote(Number(x.toFixed(Math.min(ch, 10))));
    res = `<div class="ores"><b>x̄ = ${fmtSci(moy)}</b><small>moyenne de ${n} mesures</small></div><div class="ores"><b>s = ${fmtSci(s)}</b><small>écart-type expérimental</small></div><div class="ores"><b>u(x) = s / √n = ${fmtSci(u)}</b><small>incertitude-type (évaluation de type A)</small></div>
      <div class="ores bon"><b>Résultat : x = ${arr(moy)} ± ${arr(u)}</b><small>écrit avec le même nombre de décimales que l'incertitude</small></div>
      ${isFinite(ref) && u ? `<div class="ores ${Math.abs(moy - ref) / u <= 2 ? "bon" : "err"}"><b>z = |x̄ − x<sub>réf</sub>| / u = ${fmtNote(Math.round(Math.abs(moy - ref) / u * 100) / 100)}</b><small>${Math.abs(moy - ref) / u <= 2 ? "z ≤ 2 : résultat compatible avec la valeur de référence" : "z > 2 : résultat non compatible avec la valeur de référence"}</small></div>` : ""}`; }
  else if (n === 1) res = `<div class="ores">Saisis au moins deux mesures.</div>`;
  return `<div class="ogrille">${carteOutil("Série de mesures", "Colle ou tape tes valeurs, séparées par des espaces, des retours à la ligne ou des points-virgules.", `<label class="ochamp"><span>Mesures</span><textarea id="mxL" data-oi="1" rows="4" placeholder="9,79 9,82 9,85 9,80 9,78">${esc(ov("mxL"))}</textarea></label>${champ("mxR", "Valeur de référence (facultatif)", ov("mxR"), "", "9,81")}`)}
    ${carteOutil("Résultats", "", res || `<p class="muted" style="margin:0">Les résultats s'affichent ici.</p>`)}</div>`;
};

/* ---------- SNT : bases, couleurs, poids d'une image, texte en binaire ---------- */
OUTILS_PLUS.snt = function(){
  const src = ov("bsrc") || "dec", val = ov("bval"); let n = NaN;
  try { if (val !== "") n = parseInt(String(val).replace(/\s/g, ""), { dec: 10, bin: 2, hex: 16 }[src]); } catch (_) {}
  const bases = isFinite(n) && n >= 0 ? `<div class="ores"><b>Décimal : ${n}</b><small>Binaire : ${n.toString(2).replace(/\B(?=(\d{4})+(?!\d))/g, " ")} · Hexadécimal : ${n.toString(16).toUpperCase()} · ${n.toString(2).length} bit(s)</small></div>` : val ? `<div class="ores err">Nombre invalide dans cette base.</div>` : "";
  const r = Number(ov("cR") || 17), g = Number(ov("cG") || 100), b = Number(ov("cB") || 130), hex = "#" + [r, g, b].map(x => Math.max(0, Math.min(255, x)).toString(16).padStart(2, "0")).join("").toUpperCase();
  const w = nb(ov("iW")), h = nb(ov("iH")), bpp = nb(ov("iB") || 24), oc = w * h * bpp / 8;
  const img = isFinite(oc) ? `<div class="ores"><b>${fmtSci(oc)} octets</b><small>= ${fmtSci(oc / 1024)} Kio = ${fmtSci(oc / 1048576)} Mio · ${fmtSci(w * h)} pixels (${fmtSci(w * h / 1e6)} mégapixels)</small></div>` : "";
  const txt = ov("tB"), bin = txt ? [...new TextEncoder().encode(txt)].map(x => x.toString(2).padStart(8, "0")).join(" ") : "";
  return `${carteDonnees()}<div class="ogrille">
    ${carteOutil("Conversion de bases", "Décimal, binaire, hexadécimal.", `<div class="ochamps"><label class="ochamp"><span>Base de départ</span><select id="bsrc" data-oi="1">${[["dec", "Décimal (10)"], ["bin", "Binaire (2)"], ["hex", "Hexadécimal (16)"]].map(([k, l]) => `<option value="${k}" ${k === src ? "selected" : ""}>${l}</option>`).join("")}</select></label>${champ("bval", "Nombre", val, "", "255")}</div>${bases}`)}
    ${carteOutil("Couleurs RVB", "Chaque composante va de 0 à 255 (1 octet).", `<div class="rvb">${[["cR", "Rouge", r, "#e53935"], ["cG", "Vert", g, "#43a047"], ["cB", "Bleu", b, "#1e88e5"]].map(([id, l, v, c]) => `<label><span style="color:${c}">${l} <b>${v}</b></span><input type="range" min="0" max="255" id="${id}" data-oi="1" value="${v}" style="accent-color:${c}"></label>`).join("")}</div><div class="rvbapercu" style="background:${hex}"><b>${hex}</b><small>rgb(${r}, ${g}, ${b})</small></div>`)}
    ${carteOutil("Poids d'une image", "Taille non compressée = largeur × hauteur × bits par pixel ÷ 8.", `<div class="ochamps">${champ("iW", "Largeur", ov("iW"), "px", "1920")}${champ("iH", "Hauteur", ov("iH"), "px", "1080")}${champ("iB", "Bits par pixel", ov("iB"), "bits", "24")}</div>${img}`)}
    ${carteOutil("Texte en binaire (UTF-8)", "Chaque caractère est codé sur un ou plusieurs octets.", `<label class="ochamp"><span>Texte</span><span class="ochin"><input id="tB" data-oi="1" value="${esc(txt)}" placeholder="SNT"></span></label>${bin ? `<div class="ores"><span class="mono" style="word-break:break-all;font-size:.82rem">${bin}</span></div>` : ""}`)}
  </div>`;
};

/* ---------- SI et Technologie : code couleur des résistances, loi d'Ohm, puissance, transmissions ---------- */
const COULEURS_R = [["noir", "#111"], ["marron", "#7b4a1e"], ["rouge", "#d32f2f"], ["orange", "#f57c00"], ["jaune", "#fbc02d"], ["vert", "#388e3c"], ["bleu", "#1976d2"], ["violet", "#7b1fa2"], ["gris", "#757575"], ["blanc", "#f5f5f5"]];
OUTILS_PLUS.si = function(){
  const b1 = Number(ov("r1") || 1), b2 = Number(ov("r2") || 0), b3 = Number(ov("r3") || 2), tol = ov("rt") || "5";
  const Rv = (b1 * 10 + b2) * 10 ** b3, sel = (id, v) => `<select id="${id}" data-oi="1">${COULEURS_R.map(([n], i) => `<option value="${i}" ${i === v ? "selected" : ""}>${n}</option>`).join("")}</select>`;
  const Rtxt = Rv >= 1e6 ? fmtNote(Rv / 1e6) + " MΩ" : Rv >= 1e3 ? fmtNote(Rv / 1e3) + " kΩ" : fmtNote(Rv) + " Ω";
  const U = nb(ov("oU")), I = nb(ov("oI")), R = nb(ov("oR")), k = [U, I, R].filter(isFinite).length;
  let oRes = ""; if (k === 2) { const r = !isFinite(U) ? ["U = R × I", R * I, "V"] : !isFinite(I) ? ["I = U / R", U / R, "A"] : ["R = U / I", U / I, "Ω"]; const uu = isFinite(U) ? U : R * I, ii = isFinite(I) ? I : U / R; oRes = `<div class="ores"><b>${r[0]} = ${fmtSci(r[1])} ${r[2]}</b><small>Puissance P = U × I = ${fmtSci(uu * ii)} W</small></div>`; }
  const P = nb(ov("eP")), t = nb(ov("eT")), E = P * t;
  const eRes = isFinite(E) ? `<div class="ores"><b>E = P × t = ${fmtSci(E)} J</b><small>= ${fmtSci(E / 3600)} Wh = ${fmtSci(E / 3.6e6)} kWh</small></div>` : "";
  const Z1 = nb(ov("tZ1")), Z2 = nb(ov("tZ2")), N1 = nb(ov("tN1")), C1 = nb(ov("tC1"));
  const tRes = isFinite(Z1) && isFinite(Z2) ? `<div class="ores"><b>Rapport de transmission r = Z<sub>menant</sub> / Z<sub>mené</sub> = ${fmtSci(Z1 / Z2)}</b><small>${isFinite(N1) ? `Vitesse de sortie N₂ = N₁ × r = ${fmtSci(N1 * Z1 / Z2)} tr/min · ` : ""}${isFinite(C1) ? `Couple de sortie (sans pertes) C₂ = C₁ / r = ${fmtSci(C1 * Z2 / Z1)} N·m · ` : ""}${Z1 < Z2 ? "réducteur : la vitesse diminue, le couple augmente" : Z1 > Z2 ? "multiplicateur : la vitesse augmente" : "même vitesse"}</small></div>` : "";
  return `<div class="ogrille">
    ${carteOutil("Code couleur d'une résistance", "4 anneaux : 2 chiffres, multiplicateur, tolérance.", `<div class="resist"><i style="background:${COULEURS_R[b1][1]}"></i><i style="background:${COULEURS_R[b2][1]}"></i><i style="background:${COULEURS_R[b3][1]}"></i><i class="tol" style="background:${tol === "5" ? "#c9a227" : tol === "10" ? "#b0b0b0" : tol === "1" ? "#7b4a1e" : "#d32f2f"}"></i></div>
      <div class="ochamps"><label class="ochamp"><span>1er anneau</span>${sel("r1", b1)}</label><label class="ochamp"><span>2e anneau</span>${sel("r2", b2)}</label><label class="ochamp"><span>Multiplicateur</span>${sel("r3", b3)}</label><label class="ochamp"><span>Tolérance</span><select id="rt" data-oi="1">${[["1", "marron ±1 %"], ["2", "rouge ±2 %"], ["5", "or ±5 %"], ["10", "argent ±10 %"]].map(([v, l]) => `<option value="${v}" ${v === tol ? "selected" : ""}>${l}</option>`).join("")}</select></label></div>
      <div class="ores"><b>R = ${Rtxt} ± ${tol} %</b><small>entre ${fmtSci(Rv * (1 - tol / 100))} Ω et ${fmtSci(Rv * (1 + tol / 100))} Ω</small></div>`)}
    ${carteOutil("Loi d'Ohm et puissance", "Remplis 2 valeurs sur 3.", `<div class="ochamps">${champ("oU", "Tension U", ov("oU"), "V")}${champ("oI", "Intensité I", ov("oI"), "A")}${champ("oR", "Résistance R", ov("oR"), "Ω")}</div>${oRes}`)}
    ${carteOutil("Énergie consommée", "E = P × t", `<div class="ochamps">${champ("eP", "Puissance P", ov("eP"), "W")}${champ("eT", "Durée t", ov("eT"), "s")}</div>${eRes}`)}
    ${carteOutil("Transmission par engrenages ou poulies", "Z = nombre de dents (ou diamètre des poulies).", `<div class="ochamps">${champ("tZ1", "Z menant", ov("tZ1"), "", "12")}${champ("tZ2", "Z mené", ov("tZ2"), "", "36")}${champ("tN1", "Vitesse d'entrée N₁", ov("tN1"), "tr/min")}${champ("tC1", "Couple d'entrée C₁", ov("tC1"), "N·m")}</div>${tRes}`)}
  </div>`;
};

/* saisie : on garde les valeurs et on met à jour la carte sans perdre le curseur */
function majOutils(e){
  const t = e.target; if (!t.dataset || (!t.dataset.oi && t.id !== "fmTxt")) return;
  if (t.id === "fmTxt") { apercuFormule(); return; }
  OV[t.id] = t.value; const id = t.id, pos = t.selectionStart;
  render(); const n = document.getElementById(id); if (n) { n.focus(); try { if (pos != null && n.setSelectionRange) n.setSelectionRange(pos, pos); } catch (_) {} }
}
document.addEventListener("input", e => { if (e.target.type !== "range" && e.target.tagName !== "SELECT") majOutils(e); else majOutils(e); });
document.addEventListener("click", async e => {
  const a = e.target.closest && e.target.closest('[data-act^="fm"]'); if (!a) return; e.preventDefault(); e.stopPropagation(); const t = document.getElementById("fmTxt");
  if (a.dataset.act === "fmins") insererFormule(a.dataset.c);
  else if (a.dataset.act === "fmex") { if (t) { t.value = a.dataset.c; apercuFormule(); } }
  else if (a.dataset.act === "fmlatex") { try { await navigator.clipboard.writeText(t.value); toast("Code LaTeX copié"); } catch (_) {} }
  else if (a.dataset.act === "fmword") { if (!window.katex) return; try { const mml = katex.renderToString(t.value, { output: "mathml", throwOnError: false }).replace(/^<span class="katex">|<\/span>$/g, "").replace(/<annotation[^>]*>[\s\S]*?<\/annotation>/, "").replace(/<semantics>|<\/semantics>/g, "");
      await navigator.clipboard.writeText(mml); toast("Équation copiée : colle-la dans Word avec Ctrl+V"); } catch (er) { toast("Copie impossible"); } }
  else if (a.dataset.act === "fmpng") { try { await imageFormule(); } catch (_) { toast("Image impossible"); } }
}, true);
new MutationObserver(() => { const z = document.getElementById("fmApercu"); if (z && !z.dataset.ok) { z.dataset.ok = 1; apercuFormule(); } }).observe(document.documentElement, { childList: true, subtree: true });

/* ---------- Unités de données : bit, octet, ko, Mo, Go, Kio, Mio… et temps de téléchargement ---------- */
const UD = [["bit", 1], ["kbit", 1e3], ["Mbit", 1e6], ["Gbit", 1e9], ["octet (o)", 8], ["ko", 8e3], ["Mo", 8e6], ["Go", 8e9], ["To", 8e12], ["Kio", 8 * 1024], ["Mio", 8 * 1024 ** 2], ["Gio", 8 * 1024 ** 3], ["Tio", 8 * 1024 ** 4]];
const UDEB = [["bit/s", 1], ["kbit/s", 1e3], ["Mbit/s", 1e6], ["Gbit/s", 1e9], ["ko/s", 8e3], ["Mo/s", 8e6]];
const selU = (id, L, v) => `<select id="${id}" data-oi="1">${L.map(([u]) => `<option ${u === v ? "selected" : ""}>${u}</option>`).join("")}</select>`;
const fmtDuree = s => { if (!isFinite(s)) return "—"; if (s < 1) return fmtSci(s) + " s"; const j = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), r = Math.round(s % 60 * 10) / 10; return [j && j + " j", h && h + " h", m && m + " min", (r || (!j && !h && !m)) && fmtNote(r) + " s"].filter(Boolean).join(" "); };
function carteDonnees(){
  const v = nb(ov("udV") || "1"), u = ov("udU") || "Go", f = (UD.find(x => x[0] === u) || UD[7])[1], bits = v * f;
  const tab = isFinite(bits) ? `<div class="udtab">${UD.map(([n, k]) => `<span class="${n === u ? "on" : ""}"><b>${fmtSci(bits / k)}</b> ${n}</span>`).join("")}</div>` : "";
  const tv = nb(ov("udT")), tu = ov("udTU") || "Go", dv = nb(ov("udD")), du = ov("udDU") || "Mbit/s";
  const tb = tv * (UD.find(x => x[0] === tu) || UD[7])[1], db = dv * (UDEB.find(x => x[0] === du) || UDEB[2])[1];
  const tRes = isFinite(tb) && isFinite(db) && db > 0 ? `<div class="ores"><b>Durée ≈ ${fmtDuree(tb / db)}</b><small>t = taille ÷ débit = ${fmtSci(tb)} bits ÷ ${fmtSci(db)} bit/s (débit idéal, sans pertes)</small></div>` : "";
  return `<section class="ocarte udcarte"><h3>Unités de données numériques : bit, octet, Mo, Go…</h3>
    <div class="udexpl">
      <div class="udpas"><span class="udnum">1</span><div><b>Le bit, c'est une lampe.</b> Une lampe est soit <b>allumée (1)</b>, soit <b>éteinte (0)</b>. Un ordinateur ne sait stocker que ça : des 0 et des 1. Une seule de ces « lampes » s'appelle un <b>bit</b> (symbole <b>b</b> ou « bit »). C'est la plus petite information possible.</div></div>
      <div class="udpas"><span class="udnum">2</span><div><b>L'octet, c'est 8 lampes côte à côte.</b> Un <b>octet</b> (symbole <b>o</b>) = <b>8 bits</b>. Avec 8 lampes, on peut faire 256 combinaisons différentes : assez pour coder une lettre. Exemple : la lettre <b>A</b> s'écrit <span class="mono">01000001</span>.<br>⚠️ En anglais, octet se dit <b>byte</b> (symbole <b>B</b>). Ne confonds pas <b>bit</b> et <b>byte</b> : 1 byte = 1 octet = 8 bits.</div></div>
      <div class="udpas"><span class="udnum">3</span><div><b>Les grandes unités marchent comme les mètres.</b> kilo = mille, méga = un million, giga = un milliard, téra = mille milliards.
        <div class="udescalier"><span>To</span><i>× 1 000</i><span>Go</span><i>× 1 000</i><span>Mo</span><i>× 1 000</i><span>ko</span><i>× 1 000</i><span>octet</span><i>× 8</i><span>bit</span></div>
        <small>Pour aller vers la droite (unité plus petite), on <b>multiplie</b>. Vers la gauche (unité plus grande), on <b>divise</b>.</small></div></div>
      <div class="udpas"><span class="udnum">4</span><div><b>Quelques ordres de grandeur</b>
        <div class="udordres"><span>📱 Un SMS<b>≈ 140 octets</b></span><span>📄 Une page de texte<b>≈ 2 ko</b></span><span>📷 Une photo de téléphone<b>≈ 3 Mo</b></span><span>🎵 Une chanson MP3<b>≈ 4 Mo</b></span><span>🎬 1 minute de vidéo HD<b>≈ 100 Mo</b></span><span>🍿 Un film HD<b>≈ 2 Go</b></span><span>🎮 Un jeu vidéo récent<b>50 à 100 Go</b></span><span>💾 Un téléphone<b>64 à 256 Go</b></span></div></div></div>
      <div class="udpas udattn"><span class="udnum">5</span><div><b>Le piège de la connexion internet.</b> Les box et les forfaits annoncent un débit en <b>Mbit/s</b> (méga<b>bits</b> par seconde, petit « b »). Mais les fichiers sont mesurés en <b>Mo</b> (méga<b>octets</b>). Pour passer des Mbit aux Mo : <b>on divise par 8</b>.<br>Exemple : une fibre à <b>100 Mbit/s</b> télécharge au mieux 100 ÷ 8 = <b>12,5 Mo par seconde</b>. Un film de 2 Go = 2 000 Mo met donc 2 000 ÷ 12,5 = 160 s, soit environ <b>2 min 40 s</b>.</div></div>
      <div class="udpas"><span class="udnum">6</span><div><b>Exemples corrigés</b>
        <ol class="udex"><li><b>Combien de photos de 3 Mo tiennent sur une clé USB de 32 Go ?</b><br>32 Go = 32 × 1 000 = 32 000 Mo, puis 32 000 ÷ 3 ≈ <b>10 666 photos</b>.</li>
        <li><b>Combien de bits dans un fichier de 5 Mo ?</b><br>5 Mo = 5 000 000 octets, puis × 8 = <b>40 000 000 bits</b>.</li>
        <li><b>Une chanson de 4 Mo avec une connexion 4G à 40 Mbit/s ?</b><br>40 ÷ 8 = 5 Mo par seconde, donc 4 ÷ 5 = <b>0,8 seconde</b>.</li>
        <li><b>Pourquoi ma clé « 32 Go » affiche seulement 29,8 Go ?</b><br>Windows compte par paquets de 1 024 au lieu de 1 000 (unités Kio, Mio, Gio). Rien n'a disparu : c'est juste une autre façon de compter.</li></ol></div></div>
    </div>
    <div class="ogrille">
      <div class="ocarte"><h3>Convertir une quantité de données</h3><div class="ochamps">${champ("udV", "Valeur", ov("udV") || "1", "")}<label class="ochamp"><span>Unité</span>${selU("udU", UD, u)}</label></div>${tab}</div>
      <div class="ocarte"><h3>Temps de téléchargement</h3><div class="ochamps">${champ("udT", "Taille du fichier", ov("udT"), "", "4,7")}<label class="ochamp"><span>Unité</span>${selU("udTU", UD, tu)}</label>${champ("udD", "Débit de la connexion", ov("udD"), "", "100")}<label class="ochamp"><span>Unité</span>${selU("udDU", UDEB, du)}</label></div>${tRes}</div>
    </div></section>`;
}
