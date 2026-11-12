/* =====================================================================
   Outils Scientifiques Importants : formulaires de physique et de chimie
   (Terminale, Première, Seconde). Chaque outil : on remplit toutes les
   valeurs sauf une, l'inconnue est calculée (résolution numérique).
   ===================================================================== */
const FOPEN = new Set();
const DEG = Math.PI / 180, sinD = x => Math.sin(x * DEG), cosD = x => Math.cos(x * DEG);
const K_ = { G: 6.674e-11, c: 2.998e8, h: 6.626e-34, e: 1.602e-19, NA: 6.022e23, R: 8.314, k: 8.99e9, F: 96485, I0: 1e-12, mn: 1.67e-27, W: 2.898e-3 };
/* [id, section, niveau affiché, titre, formule, variables [clé, libellé, unité, défaut], équation o => [membre gauche, membre droit], aide] */
const F_PHY = [
  // ---------- Terminale ----------
  ["newton", "Tle", "Tle", "2e loi de Newton", "ΣF = m × a", [["F", "Somme des forces ΣF", "N"], ["m", "Masse m", "kg"], ["a", "Accélération a", "m·s⁻²"]], o => [o.F, o.m * o.a]],
  ["mrua_v", "Tle", "Tle", "Mouvement uniformément accéléré : vitesse", "v = v₀ + a × t", [["v", "Vitesse v", "m·s⁻¹"], ["v0", "Vitesse initiale v₀", "m·s⁻¹", "0"], ["a", "Accélération a", "m·s⁻²", "9,81"], ["t", "Durée t", "s"]], o => [o.v, o.v0 + o.a * o.t]],
  ["mrua_x", "Tle", "Tle", "Mouvement uniformément accéléré : position", "x = x₀ + v₀ × t + ½ × a × t²", [["x", "Position x", "m"], ["x0", "Position initiale x₀", "m", "0"], ["v0", "Vitesse initiale v₀", "m·s⁻¹", "0"], ["a", "Accélération a", "m·s⁻²", "9,81"], ["t", "Durée t", "s"]], o => [o.x, o.x0 + o.v0 * o.t + .5 * o.a * o.t * o.t]],
  ["portee", "Tle", "Tle", "Tir parabolique : portée (sol horizontal)", "d = v₀² × sin(2α) / g", [["d", "Portée d", "m"], ["v0", "Vitesse de lancement v₀", "m·s⁻¹"], ["al", "Angle de tir α", "°"], ["g", "Pesanteur g", "N·kg⁻¹", "9,81"]], o => [o.d, o.v0 * o.v0 * sinD(2 * o.al) / o.g], "Frottements négligés, lancement et arrivée à la même altitude."],
  ["fleche", "Tle", "Tle", "Tir parabolique : hauteur maximale (flèche)", "h = v₀² × sin²(α) / (2g)", [["h", "Hauteur maximale h", "m"], ["v0", "Vitesse de lancement v₀", "m·s⁻¹"], ["al", "Angle de tir α", "°"], ["g", "Pesanteur g", "N·kg⁻¹", "9,81"]], o => [o.h, (o.v0 * sinD(o.al)) ** 2 / (2 * o.g)]],
  ["centri", "Tle", "Tle", "Mouvement circulaire uniforme", "a = v² / R", [["a", "Accélération (normale) a", "m·s⁻²"], ["v", "Vitesse v", "m·s⁻¹"], ["R", "Rayon R", "m"]], o => [o.a, o.v * o.v / o.R]],
  ["orbite_v", "Tle", "Tle", "Satellite : vitesse sur orbite circulaire", "v = √(G × M / r)", [["v", "Vitesse v", "m·s⁻¹"], ["M", "Masse de l'astre attracteur M", "kg", "5,97e24"], ["r", "Rayon de l'orbite r (centre de l'astre)", "m"]], o => [o.v, Math.sqrt(K_.G * o.M / o.r)], "G = 6,674 × 10⁻¹¹ N·m²·kg⁻². Rayon de la Terre : 6,371 × 10⁶ m."],
  ["orbite_T", "Tle", "Tle", "Satellite : période de révolution", "T = 2π × √(r³ / (G × M))", [["T", "Période T", "s"], ["r", "Rayon de l'orbite r", "m"], ["M", "Masse de l'astre attracteur M", "kg", "5,97e24"]], o => [o.T, 2 * Math.PI * Math.sqrt(o.r ** 3 / (K_.G * o.M))], "Satellite géostationnaire : T = 86 164 s."],
  ["kepler", "Tle", "Tle", "3e loi de Kepler (deux astres autour du même centre)", "T₁² / a₁³ = T₂² / a₂³", [["T1", "Période T₁", ""], ["a1", "Demi-grand axe a₁", ""], ["T2", "Période T₂", ""], ["a2", "Demi-grand axe a₂", ""]], o => [o.T1 ** 2 / o.a1 ** 3, o.T2 ** 2 / o.a2 ** 3], "Utilise les mêmes unités pour T₁ et T₂, et pour a₁ et a₂ (ex. années et ua)."],
  ["qdm", "Tle", "Tle", "Quantité de mouvement", "p = m × v", [["p", "Quantité de mouvement p", "kg·m·s⁻¹"], ["m", "Masse m", "kg"], ["v", "Vitesse v", "m·s⁻¹"]], o => [o.p, o.m * o.v]],
  ["recul", "Tle", "Tle", "Conservation de la quantité de mouvement (recul, propulsion)", "m₁ × v₁ = m₂ × v₂", [["m1", "Masse m₁", "kg"], ["v1", "Vitesse v₁", "m·s⁻¹"], ["m2", "Masse m₂", "kg"], ["v2", "Vitesse v₂", "m·s⁻¹"]], o => [o.m1 * o.v1, o.m2 * o.v2], "Système isolé initialement immobile : les deux parties partent en sens opposés."],
  ["cond_E", "Tle", "Tle", "Champ électrique dans un condensateur plan", "E = U / d", [["E", "Champ E", "V·m⁻¹"], ["U", "Tension U", "V"], ["d", "Distance entre les armatures d", "m"]], o => [o.E, o.U / o.d]],
  ["force_el", "Tle", "Tle", "Force électrique dans un champ uniforme", "F = |q| × E", [["F", "Force F", "N"], ["q", "Charge |q|", "C", "1,602e-19"], ["E", "Champ E", "V·m⁻¹"]], o => [o.F, Math.abs(o.q) * o.E]],
  ["capa", "Tle", "Tle", "Condensateur : charge et capacité", "q = C × u", [["q", "Charge q", "C"], ["C", "Capacité C", "F"], ["u", "Tension u", "V"]], o => [o.q, o.C * o.u]],
  ["tau", "Tle", "Tle", "Circuit RC : constante de temps", "τ = R × C", [["tau", "Constante de temps τ", "s"], ["R", "Résistance R", "Ω"], ["C", "Capacité C", "F"]], o => [o.tau, o.R * o.C], "Le condensateur est chargé à 63 % au bout de τ et à 99 % au bout de 5τ."],
  ["rc_charge", "Tle", "Tle", "Circuit RC : charge du condensateur", "u(t) = E × (1 − e^(−t/τ))", [["u", "Tension u(t)", "V"], ["E", "Tension du générateur E", "V"], ["t", "Instant t", "s"], ["tau", "Constante de temps τ", "s"]], o => [o.u, o.E * (1 - Math.exp(-o.t / o.tau))]],
  ["rc_dech", "Tle", "Tle", "Circuit RC : décharge du condensateur", "u(t) = U₀ × e^(−t/τ)", [["u", "Tension u(t)", "V"], ["U0", "Tension initiale U₀", "V"], ["t", "Instant t", "s"], ["tau", "Constante de temps τ", "s"]], o => [o.u, o.U0 * Math.exp(-o.t / o.tau)]],
  ["cond_W", "Tle", "Tle", "Énergie stockée dans un condensateur", "E = ½ × C × u²", [["E", "Énergie E", "J"], ["C", "Capacité C", "F"], ["u", "Tension u", "V"]], o => [o.E, .5 * o.C * o.u * o.u]],
  ["doppler", "Tle", "Tle", "Effet Doppler (source qui se rapproche)", "f_R = f_E × v / (v − v_S)", [["fR", "Fréquence reçue f_R", "Hz"], ["fE", "Fréquence émise f_E", "Hz"], ["v", "Célérité de l'onde v", "m·s⁻¹", "340"], ["vS", "Vitesse de la source v_S", "m·s⁻¹"]], o => [o.fR, o.fE * o.v / (o.v - o.vS)], "Si la source s'éloigne, entre une vitesse v_S négative."],
  ["diffr", "Tle", "Tle", "Diffraction par une fente", "θ = λ / a", [["th", "Demi-écart angulaire θ", "rad"], ["lam", "Longueur d'onde λ", "m"], ["a", "Largeur de la fente a", "m"]], o => [o.th, o.lam / o.a], "Écart angulaire entre le milieu de la tache centrale et la 1re extinction."],
  ["interf", "Tle", "Tle", "Interférences : interfrange (fentes d'Young)", "i = λ × D / b", [["i", "Interfrange i", "m"], ["lam", "Longueur d'onde λ", "m"], ["D", "Distance fentes-écran D", "m"], ["b", "Distance entre les fentes b", "m"]], o => [o.i, o.lam * o.D / o.b]],
  ["lunette", "Tle", "Tle", "Lunette astronomique : grossissement", "G = f′₁ / f′₂", [["G", "Grossissement G", ""], ["f1", "Focale de l'objectif f′₁", "m"], ["f2", "Focale de l'oculaire f′₂", "m"]], o => [o.G, o.f1 / o.f2]],
  ["photoel", "Tle", "Tle", "Effet photoélectrique", "Ec max = h × ν − W", [["Ec", "Énergie cinétique max Ec", "eV"], ["nu", "Fréquence de la lumière ν", "Hz"], ["W", "Travail d'extraction W", "eV"]], o => [o.Ec, K_.h * o.nu / K_.e - o.W], "h = 6,626 × 10⁻³⁴ J·s ; 1 eV = 1,602 × 10⁻¹⁹ J."],
  ["mcdt", "Tle", "Tle", "Transfert thermique (sans changement d'état)", "Q = m × c × ΔT", [["Q", "Transfert thermique Q", "J"], ["m", "Masse m", "kg"], ["c", "Capacité thermique massique c", "J·kg⁻¹·K⁻¹", "4180"], ["dT", "Variation de température ΔT", "K ou °C"]], o => [o.Q, o.m * o.c * o.dT], "c(eau) = 4 180 J·kg⁻¹·K⁻¹."],
  ["flux", "Tle", "Tle", "Flux thermique à travers une paroi", "Φ = ΔT / R_th", [["phi", "Flux thermique Φ", "W"], ["dT", "Écart de température ΔT", "K"], ["Rth", "Résistance thermique R_th", "K·W⁻¹"]], o => [o.phi, o.dT / o.Rth]],
  ["refroid", "Tle", "Tle", "Loi de Newton : refroidissement d'un corps", "T(t) = T_ext + (T₀ − T_ext) × e^(−t/τ)", [["T", "Température T(t)", "°C"], ["Text", "Température extérieure T_ext", "°C", "20"], ["T0", "Température initiale T₀", "°C"], ["t", "Instant t", "s"], ["tau", "Constante de temps τ", "s"]], o => [o.T, o.Text + (o.T0 - o.Text) * Math.exp(-o.t / o.tau)]],
  ["gp", "Tle", "Tle", "Loi des gaz parfaits", "P × V = n × R × T", [["P", "Pression P", "Pa"], ["V", "Volume V", "m³"], ["n", "Quantité de matière n", "mol"], ["T", "Température T", "K"]], o => [o.P * o.V, o.n * K_.R * o.T], "R = 8,314 J·mol⁻¹·K⁻¹ ; T(K) = θ(°C) + 273,15 ; 1 L = 10⁻³ m³."],
  ["archi", "Tle", "Tle", "Poussée d'Archimède", "Π = ρ_fluide × V_immergé × g", [["Pi", "Poussée Π", "N"], ["rho", "Masse volumique du fluide ρ", "kg·m⁻³", "1000"], ["V", "Volume immergé V", "m³"], ["g", "Pesanteur g", "N·kg⁻¹", "9,81"]], o => [o.Pi, o.rho * o.V * o.g]],
  ["debit", "Tle", "Tle", "Débit volumique d'un fluide", "D = S × v", [["D", "Débit D", "m³·s⁻¹"], ["S", "Section S", "m²"], ["v", "Vitesse d'écoulement v", "m·s⁻¹"]], o => [o.D, o.S * o.v], "Fluide incompressible : le débit se conserve, S₁v₁ = S₂v₂."],
  ["bernoulli", "Tle", "Tle", "Relation de Bernoulli", "P₁ + ½ρv₁² + ρgz₁ = P₂ + ½ρv₂² + ρgz₂", [["P1", "Pression P₁", "Pa"], ["v1", "Vitesse v₁", "m·s⁻¹"], ["z1", "Altitude z₁", "m"], ["P2", "Pression P₂", "Pa"], ["v2", "Vitesse v₂", "m·s⁻¹"], ["z2", "Altitude z₂", "m"], ["rho", "Masse volumique ρ", "kg·m⁻³", "1000"]], o => [o.P1 + .5 * o.rho * o.v1 ** 2 + o.rho * 9.81 * o.z1, o.P2 + .5 * o.rho * o.v2 ** 2 + o.rho * 9.81 * o.z2], "Fluide parfait, incompressible, écoulement permanent (g = 9,81 N·kg⁻¹)."],
  ["decrois", "Tle", "Tle", "Décroissance radioactive", "N(t) = N₀ × e^(−λt)", [["N", "Noyaux restants N(t)", ""], ["N0", "Noyaux initiaux N₀", ""], ["lam", "Constante radioactive λ", "s⁻¹"], ["t", "Durée t", "s"]], o => [o.N, o.N0 * Math.exp(-o.lam * o.t)], "Marche aussi avec l'activité A ou la masse : même loi."],
  ["demivie", "Tle", "Tle", "Temps de demi-vie", "t½ = ln 2 / λ", [["t12", "Demi-vie t½", "s"], ["lam", "Constante radioactive λ", "s⁻¹"]], o => [o.t12, Math.LN2 / o.lam], "Carbone 14 : t½ = 5 730 ans."],
  ["activite", "Tle", "Tle", "Activité d'un échantillon radioactif", "A = λ × N", [["A", "Activité A", "Bq"], ["lam", "Constante radioactive λ", "s⁻¹"], ["N", "Nombre de noyaux N", ""]], o => [o.A, o.lam * o.N]],
  // ---------- Première ----------
  ["ec", "1re", "1re", "Énergie cinétique", "Ec = ½ × m × v²", [["Ec", "Énergie cinétique Ec", "J"], ["m", "Masse m", "kg"], ["v", "Vitesse v", "m·s⁻¹"]], o => [o.Ec, .5 * o.m * o.v * o.v]],
  ["epp", "1re", "1re", "Énergie potentielle de pesanteur", "Epp = m × g × z", [["Epp", "Énergie potentielle Epp", "J"], ["m", "Masse m", "kg"], ["g", "Pesanteur g", "N·kg⁻¹", "9,81"], ["z", "Altitude z", "m"]], o => [o.Epp, o.m * o.g * o.z]],
  ["em", "1re", "1re", "Énergie mécanique", "Em = ½ × m × v² + m × g × z", [["Em", "Énergie mécanique Em", "J"], ["m", "Masse m", "kg"], ["v", "Vitesse v", "m·s⁻¹"], ["z", "Altitude z", "m"]], o => [o.Em, .5 * o.m * o.v * o.v + o.m * 9.81 * o.z], "g = 9,81 N·kg⁻¹."],
  ["chute", "1re", "1re", "Vitesse après une chute de hauteur h (sans frottements)", "v = √(2 × g × h)", [["v", "Vitesse v", "m·s⁻¹"], ["g", "Pesanteur g", "N·kg⁻¹", "9,81"], ["h", "Hauteur de chute h", "m"]], o => [o.v, Math.sqrt(2 * o.g * o.h)], "Conservation de l'énergie mécanique, départ sans vitesse."],
  ["travail", "1re", "1re", "Travail d'une force constante", "W = F × AB × cos α", [["W", "Travail W", "J"], ["F", "Force F", "N"], ["AB", "Déplacement AB", "m"], ["al", "Angle α entre F⃗ et AB⃗", "°", "0"]], o => [o.W, o.F * o.AB * cosD(o.al)]],
  ["w_poids", "1re", "1re", "Travail du poids", "W(P) = m × g × (z_A − z_B)", [["W", "Travail W", "J"], ["m", "Masse m", "kg"], ["zA", "Altitude de départ z_A", "m"], ["zB", "Altitude d'arrivée z_B", "m"]], o => [o.W, o.m * 9.81 * (o.zA - o.zB)], "g = 9,81 N·kg⁻¹. Positif quand l'objet descend."],
  ["puis_meca", "1re", "1re", "Puissance mécanique", "P = W / Δt", [["P", "Puissance P", "W"], ["W", "Travail ou énergie W", "J"], ["dt", "Durée Δt", "s"]], o => [o.P, o.W / o.dt]],
  ["pui_el", "1re", "1re", "Puissance électrique", "P = U × I", [["P", "Puissance P", "W"], ["U", "Tension U", "V"], ["I", "Intensité I", "A"]], o => [o.P, o.U * o.I]],
  ["joule", "1re", "1re", "Effet Joule", "P = R × I²", [["P", "Puissance dissipée P", "W"], ["R", "Résistance R", "Ω"], ["I", "Intensité I", "A"]], o => [o.P, o.R * o.I * o.I]],
  ["energie", "1re", "1re", "Énergie électrique", "E = P × Δt", [["E", "Énergie E", "J"], ["P", "Puissance P", "W"], ["dt", "Durée Δt", "s"]], o => [o.E, o.P * o.dt], "1 kWh = 3,6 × 10⁶ J."],
  ["rendement", "1re", "1re", "Rendement d'un convertisseur", "η = P_utile / P_absorbée", [["eta", "Rendement η", "%"], ["Pu", "Puissance utile", "W"], ["Pa", "Puissance absorbée", "W"]], o => [o.eta, 100 * o.Pu / o.Pa]],
  ["coulomb", "1re", "1re", "Loi de Coulomb", "F = k × |q_A × q_B| / d²", [["F", "Force F", "N"], ["qA", "Charge q_A", "C"], ["qB", "Charge q_B", "C"], ["d", "Distance d", "m"]], o => [o.F, K_.k * Math.abs(o.qA * o.qB) / (o.d * o.d)], "k = 8,99 × 10⁹ N·m²·C⁻²."],
  ["champ_g", "1re", "1re", "Champ de gravitation créé par un astre", "g = G × M / d²", [["g", "Champ g", "N·kg⁻¹"], ["M", "Masse de l'astre M", "kg", "5,97e24"], ["d", "Distance au centre d", "m", "6,371e6"]], o => [o.g, K_.G * o.M / (o.d * o.d)]],
  ["onde_per", "1re", "1re", "Onde périodique : longueur d'onde", "λ = v × T = v / f", [["lam", "Longueur d'onde λ", "m"], ["v", "Célérité v", "m·s⁻¹"], ["f", "Fréquence f", "Hz"]], o => [o.lam, o.v / o.f]],
  ["retard", "1re", "1re", "Retard d'une onde", "v = d / τ", [["v", "Célérité v", "m·s⁻¹"], ["d", "Distance d", "m"], ["tau", "Retard τ", "s"]], o => [o.v, o.d / o.tau]],
  ["conjug", "1re", "2nde · 1re", "Lentille mince : relation de conjugaison", "1/OA′ − 1/OA = 1/f′", [["OAp", "Position de l'image OA′", "m"], ["OA", "Position de l'objet OA (négatif)", "m"], ["f", "Distance focale f′", "m"]], o => [1 / o.OAp - 1 / o.OA, 1 / o.f], "Distances algébriques : l'objet réel est à gauche, donc OA < 0."],
  ["grand", "1re", "2nde · 1re", "Lentille mince : grandissement", "γ = OA′ / OA = A′B′ / AB", [["g", "Grandissement γ", ""], ["OAp", "Position de l'image OA′", "m"], ["OA", "Position de l'objet OA", "m"]], o => [o.g, o.OAp / o.OA]],
  ["photon", "1re", "1re", "Énergie d'un photon", "E = h × c / λ", [["E", "Énergie E", "eV"], ["lam", "Longueur d'onde λ", "nm"]], o => [o.E, K_.h * K_.c / (o.lam * 1e-9 * K_.e)]],
  ["transition", "1re", "1re", "Transition entre deux niveaux d'énergie", "λ = h × c / (E_haut − E_bas)", [["lam", "Longueur d'onde λ", "nm"], ["Eh", "Niveau de départ E_haut", "eV"], ["Eb", "Niveau d'arrivée E_bas", "eV"]], o => [o.lam, K_.h * K_.c / ((o.Eh - o.Eb) * K_.e) * 1e9], "Exemple : hydrogène, E₃ = −1,51 eV et E₂ = −3,40 eV → 656 nm (rouge)."],
  ["wien", "1re", "1re", "Loi de Wien", "λ_max × T = 2,898 × 10⁻³ m·K", [["lam", "Longueur d'onde du maximum λ_max", "nm"], ["T", "Température de surface T", "K"]], o => [o.lam * 1e-9 * o.T, K_.W], "Soleil : T ≈ 5 800 K → λ_max ≈ 500 nm."],
  // ---------- Seconde ----------
  ["vitesse", "2nde", "2nde", "Vitesse moyenne", "v = d / Δt", [["v", "Vitesse v", "m·s⁻¹"], ["d", "Distance d", "m"], ["dt", "Durée Δt", "s"]], o => [o.v, o.d / o.dt], "1 m·s⁻¹ = 3,6 km·h⁻¹."],
  ["poids", "2nde", "2nde", "Poids d'un objet", "P = m × g", [["P", "Poids P", "N"], ["m", "Masse m", "kg"], ["g", "Pesanteur g", "N·kg⁻¹", "9,81"]], o => [o.P, o.m * o.g], "Sur la Lune, g = 1,62 N·kg⁻¹."],
  ["gravit", "2nde", "2nde · 1re", "Interaction gravitationnelle", "F = G × m_A × m_B / d²", [["F", "Force F", "N"], ["mA", "Masse m_A", "kg"], ["mB", "Masse m_B", "kg"], ["d", "Distance entre les centres d", "m"]], o => [o.F, K_.G * o.mA * o.mB / (o.d * o.d)], "G = 6,674 × 10⁻¹¹ N·m²·kg⁻²."],
  ["rho", "2nde", "2nde", "Masse volumique", "ρ = m / V", [["rho", "Masse volumique ρ", "kg·m⁻³"], ["m", "Masse m", "kg"], ["V", "Volume V", "m³"]], o => [o.rho, o.m / o.V], "1 g·cm⁻³ = 1 000 kg·m⁻³ ; 1 L = 10⁻³ m³."],
  ["pression", "2nde", "2nde", "Pression exercée par une force", "P = F / S", [["P", "Pression P", "Pa"], ["F", "Force pressante F", "N"], ["S", "Surface S", "m²"]], o => [o.P, o.F / o.S], "1 bar = 10⁵ Pa ; 1 hPa = 100 Pa."],
  ["statique", "2nde", "2nde", "Loi fondamentale de la statique des fluides", "P_B − P_A = ρ × g × (z_A − z_B)", [["PB", "Pression au point B (plus bas)", "Pa"], ["PA", "Pression au point A", "Pa", "1,013e5"], ["rho", "Masse volumique ρ", "kg·m⁻³", "1000"], ["h", "Profondeur de B sous A : z_A − z_B", "m"]], o => [o.PB - o.PA, o.rho * 9.81 * o.h], "g = 9,81 N·kg⁻¹. Dans l'eau, la pression augmente d'environ 1 bar tous les 10 m."],
  ["mariotte", "2nde", "2nde", "Loi de Mariotte (température constante)", "P₁ × V₁ = P₂ × V₂", [["P1", "Pression P₁", "Pa"], ["V1", "Volume V₁", ""], ["P2", "Pression P₂", "Pa"], ["V2", "Volume V₂", ""]], o => [o.P1 * o.V1, o.P2 * o.V2], "Garde la même unité de volume pour V₁ et V₂."],
  ["snell", "2nde", "2nde", "Loi de Snell-Descartes (réfraction)", "n₁ × sin(i₁) = n₂ × sin(i₂)", [["n1", "Indice du milieu 1 n₁", "", "1"], ["i1", "Angle d'incidence i₁", "°"], ["n2", "Indice du milieu 2 n₂", "", "1,33"], ["i2", "Angle de réfraction i₂", "°"]], o => [o.n1 * sinD(o.i1), o.n2 * sinD(o.i2)], "Air : 1,00 ; eau : 1,33 ; verre : environ 1,5."],
  ["indice", "2nde", "2nde", "Indice de réfraction d'un milieu", "n = c / v", [["n", "Indice n", ""], ["v", "Vitesse de la lumière dans le milieu v", "m·s⁻¹"]], o => [o.n, K_.c / o.v], "c = 2,998 × 10⁸ m·s⁻¹."],
  ["ilim", "2nde", "2nde · 1re", "Réflexion totale : angle limite", "sin(i_lim) = n₂ / n₁", [["il", "Angle limite i_lim", "°"], ["n1", "Indice du milieu de départ n₁ (le plus grand)", "", "1,5"], ["n2", "Indice du second milieu n₂", "", "1"]], o => [sinD(o.il), o.n2 / o.n1], "Au-delà de cet angle, toute la lumière est réfléchie (fibre optique)."],
  ["freq", "2nde", "2nde", "Période et fréquence", "f = 1 / T", [["f", "Fréquence f", "Hz"], ["T", "Période T", "s"]], o => [o.f, 1 / o.T]],
  ["lumiere", "2nde", "2nde", "Fréquence et longueur d'onde de la lumière", "ν = c / λ", [["nu", "Fréquence ν", "Hz"], ["lam", "Longueur d'onde λ", "nm"]], o => [o.nu, K_.c / (o.lam * 1e-9)], "Lumière visible : de 400 nm (violet) à 800 nm (rouge)."],
  ["echo", "2nde", "2nde", "Mesure de distance par écho (sonar, télémètre)", "d = v × Δt / 2", [["d", "Distance d", "m"], ["v", "Célérité v", "m·s⁻¹", "340"], ["dt", "Durée aller-retour Δt", "s"]], o => [o.d, o.v * o.dt / 2], "Son dans l'air : 340 m·s⁻¹ ; dans l'eau : 1 500 m·s⁻¹."],
  ["niveau", "2nde", "2nde", "Niveau d'intensité sonore", "L = 10 × log(I / I₀)", [["L", "Niveau L", "dB"], ["I", "Intensité sonore I", "W·m⁻²"]], o => [o.L, 10 * Math.log10(o.I / K_.I0)], "I₀ = 10⁻¹² W·m⁻². Doubler l'intensité ajoute 3 dB."],
  ["ohm", "2nde", "2nde", "Loi d'Ohm", "U = R × I", [["U", "Tension U", "V"], ["R", "Résistance R", "Ω"], ["I", "Intensité I", "A"]], o => [o.U, o.R * o.I]],
  ["serie", "2nde", "2nde", "Résistances en série", "R = R₁ + R₂ + R₃", [["R", "Résistance équivalente R", "Ω"], ["R1", "R₁", "Ω"], ["R2", "R₂", "Ω"], ["R3", "R₃ (0 si absente)", "Ω", "0"]], o => [o.R, o.R1 + o.R2 + o.R3]],
  ["parallele", "2nde", "2nde", "Résistances en dérivation", "1/R = 1/R₁ + 1/R₂", [["R", "Résistance équivalente R", "Ω"], ["R1", "R₁", "Ω"], ["R2", "R₂", "Ω"]], o => [1 / o.R, 1 / o.R1 + 1 / o.R2]],
  ["charge", "2nde", "2nde", "Intensité et charge électrique", "I = Q / Δt", [["I", "Intensité I", "A"], ["Q", "Charge Q", "C"], ["dt", "Durée Δt", "s"]], o => [o.I, o.Q / o.dt]]
];
const F_CHI = [
  // ---------- Terminale ----------
  ["ke", "Tle", "Tle", "Produit ionique de l'eau", "[H₃O⁺] × [HO⁻] = Ke", [["h", "[H₃O⁺]", "mol·L⁻¹"], ["oh", "[HO⁻]", "mol·L⁻¹"], ["Ke", "Ke", "", "1e-14"]], o => [o.h * o.oh, o.Ke], "Ke = 10⁻¹⁴ à 25 °C."],
  ["base_forte", "Tle", "Tle", "pH d'une solution de base forte", "pH = 14 + log(C)", [["pH", "pH", ""], ["C", "Concentration apportée C", "mol·L⁻¹"]], o => [o.pH, 14 + Math.log10(o.C)], "À 25 °C. Pour un acide fort : pH = −log(C)."],
  ["acide_fort", "Tle", "Tle", "pH d'une solution d'acide fort", "pH = −log(C)", [["pH", "pH", ""], ["C", "Concentration apportée C", "mol·L⁻¹"]], o => [o.pH, -Math.log10(o.C)]],
  ["pka", "Tle", "Tle", "Constante d'acidité et pKa", "pKa = −log(Ka)", [["pKa", "pKa", ""], ["Ka", "Ka", ""]], o => [o.pKa, -Math.log10(o.Ka)]],
  ["ka", "Tle", "Tle", "Constante d'acidité d'un couple AH/A⁻", "Ka = [A⁻] × [H₃O⁺] / [AH]", [["Ka", "Ka", ""], ["A", "[A⁻] à l'équilibre", "mol·L⁻¹"], ["h", "[H₃O⁺] à l'équilibre", "mol·L⁻¹"], ["AH", "[AH] à l'équilibre", "mol·L⁻¹"]], o => [o.Ka, o.A * o.h / o.AH]],
  ["henderson", "Tle", "Tle", "pH d'un mélange acide / base conjugués", "pH = pKa + log([A⁻] / [AH])", [["pH", "pH", ""], ["pKa", "pKa du couple", ""], ["A", "[A⁻]", "mol·L⁻¹"], ["AH", "[AH]", "mol·L⁻¹"]], o => [o.pH, o.pKa + Math.log10(o.A / o.AH)], "Si pH > pKa, c'est la base A⁻ qui prédomine."],
  ["taux", "Tle", "Tle", "Taux d'avancement final", "τ = x_f / x_max", [["tau", "Taux d'avancement τ", "%"], ["xf", "Avancement final x_f", "mol"], ["xmax", "Avancement maximal x_max", "mol"]], o => [o.tau, 100 * o.xf / o.xmax], "τ = 100 % : transformation totale."],
  ["qr", "Tle", "Tle", "Quotient de réaction (a A + b B → c C + d D)", "Qr = [C]^c × [D]^d / ([A]^a × [B]^b)", [["Qr", "Qr", ""], ["C", "[C]", "mol·L⁻¹"], ["c", "c", "", "1"], ["D", "[D]", "mol·L⁻¹", "1"], ["d", "d", "", "1"], ["A", "[A]", "mol·L⁻¹"], ["a", "a", "", "1"], ["B", "[B]", "mol·L⁻¹", "1"], ["b", "b", "", "1"]], o => [o.Qr, o.C ** o.c * o.D ** o.d / (o.A ** o.a * o.B ** o.b)], "Le solvant (eau) et les solides ne figurent pas dans Qr : laisse leur concentration à 1."],
  ["vitesse_vol", "Tle", "Tle", "Vitesse volumique moyenne", "v = Δ[P] / Δt", [["v", "Vitesse v", "mol·L⁻¹·s⁻¹"], ["dC", "Variation de concentration Δ[P]", "mol·L⁻¹"], ["dt", "Durée Δt", "s"]], o => [o.v, o.dC / o.dt], "Vitesse d'apparition d'un produit (de disparition d'un réactif : −Δ[R]/Δt)."],
  ["ordre1", "Tle", "Tle", "Cinétique d'ordre 1", "[A](t) = [A]₀ × e^(−k × t)", [["A", "[A](t)", "mol·L⁻¹"], ["A0", "[A]₀", "mol·L⁻¹"], ["k", "Constante de vitesse k", "s⁻¹"], ["t", "Instant t", "s"]], o => [o.A, o.A0 * Math.exp(-o.k * o.t)]],
  ["t12chi", "Tle", "Tle", "Temps de demi-réaction (ordre 1)", "t½ = ln 2 / k", [["t12", "Temps de demi-réaction t½", "s"], ["k", "Constante de vitesse k", "s⁻¹"]], o => [o.t12, Math.LN2 / o.k]],
  ["kohl", "Tle", "Tle", "Loi de Kohlrausch (solution d'un soluté ionique X⁺ + Y⁻)", "σ = (λ_X⁺ + λ_Y⁻) × C", [["s", "Conductivité σ", "S·m⁻¹"], ["l1", "λ du cation", "mS·m²·mol⁻¹"], ["l2", "λ de l'anion", "mS·m²·mol⁻¹"], ["C", "Concentration C", "mol·L⁻¹"]], o => [o.s, (o.l1 + o.l2) * o.C], "Avec λ en mS·m²·mol⁻¹ et C en mol·L⁻¹, σ sort directement en S·m⁻¹. Ex. : Na⁺ 5,01 ; Cl⁻ 7,63."],
  ["electrons", "Tle", "Tle", "Quantité d'électrons échangés (pile, électrolyse)", "n(e⁻) = I × Δt / F", [["ne", "Quantité d'électrons n(e⁻)", "mol"], ["I", "Intensité I", "A"], ["dt", "Durée Δt", "s"]], o => [o.ne, o.I * o.dt / K_.F], "F = 96 485 C·mol⁻¹ (constante de Faraday)."],
  ["electrolyse", "Tle", "Tle", "Électrolyse : masse de métal déposée", "m = M × I × Δt / (z × F)", [["m", "Masse déposée m", "g"], ["M", "Masse molaire du métal M", "g·mol⁻¹"], ["I", "Intensité I", "A"], ["dt", "Durée Δt", "s"], ["z", "Électrons par ion z (Cu²⁺ : 2)", "", "2"]], o => [o.m, o.M * o.I * o.dt / (o.z * K_.F)]],
  ["capa_pile", "Tle", "Tle", "Capacité électrique d'une pile", "Q = n(e⁻) × F", [["Q", "Capacité Q", "A·h"], ["ne", "Quantité d'électrons n(e⁻)", "mol"]], o => [o.Q, o.ne * K_.F / 3600], "1 A·h = 3 600 C."],
  ["rdt", "Tle", "1re · Tle", "Rendement d'une synthèse", "η = n_obtenue / n_max", [["eta", "Rendement η", "%"], ["n", "Quantité obtenue (ou masse)", ""], ["nmax", "Quantité maximale attendue (même unité)", ""]], o => [o.eta, 100 * o.n / o.nmax]],
  ["titrage", "Tle", "1re · Tle", "Titrage : relation à l'équivalence", "C_A × V_A / a = C_B × V_B / b", [["CA", "Concentration titrée C_A", "mol·L⁻¹"], ["VA", "Volume titré V_A", "mL"], ["a", "Coefficient a du titré", "", "1"], ["CB", "Concentration titrante C_B", "mol·L⁻¹"], ["VB", "Volume versé à l'équivalence V_B", "mL"], ["b", "Coefficient b du titrant", "", "1"]], o => [o.CA * o.VA / o.a, o.CB * o.VB / o.b], "Pour la réaction a A + b B → …"],
  ["onde_ir", "Tle", "1re · Tle", "Spectroscopie IR : nombre d'onde", "σ = 1 / λ", [["s", "Nombre d'onde σ", "cm⁻¹"], ["lam", "Longueur d'onde λ", "µm"]], o => [o.s, 1e4 / o.lam], "Liaison O–H : bande large vers 3 200–3 400 cm⁻¹ ; C=O : vers 1 700 cm⁻¹."],
  // ---------- Première ----------
  ["n_N", "1re", "2nde · 1re", "Nombre d'entités et quantité de matière", "n = N / N_A", [["n", "Quantité de matière n", "mol"], ["N", "Nombre d'entités N", ""]], o => [o.n, o.N / K_.NA], "N_A = 6,022 × 10²³ mol⁻¹."],
  ["n_gaz", "1re", "1re", "Quantité de matière d'un gaz", "n = V / V_m", [["n", "Quantité de matière n", "mol"], ["V", "Volume de gaz V", "L"], ["Vm", "Volume molaire V_m", "L·mol⁻¹", "24,0"]], o => [o.n, o.V / o.Vm], "V_m ≈ 24,0 L·mol⁻¹ à 20 °C et 1 bar ; 22,4 L·mol⁻¹ à 0 °C."],
  ["n_liq", "1re", "1re", "Quantité de matière d'un liquide pur", "n = ρ × V / M", [["n", "Quantité de matière n", "mol"], ["rho", "Masse volumique ρ", "g·mL⁻¹"], ["V", "Volume V", "mL"], ["M", "Masse molaire M", "g·mol⁻¹"]], o => [o.n, o.rho * o.V / o.M]],
  ["cm_c", "1re", "1re", "Concentration en masse et concentration en quantité", "Cm = C × M", [["Cm", "Concentration en masse Cm", "g·L⁻¹"], ["C", "Concentration C", "mol·L⁻¹"], ["M", "Masse molaire M", "g·mol⁻¹"]], o => [o.Cm, o.C * o.M]],
  ["densite", "1re", "1re", "Densité d'un liquide", "d = ρ / ρ_eau", [["d", "Densité d", ""], ["rho", "Masse volumique ρ", "g·mL⁻¹"]], o => [o.d, o.rho / 1.0], "ρ_eau = 1,00 g·mL⁻¹. Un liquide de densité < 1 flotte sur l'eau (s'il n'est pas miscible)."],
  ["beer", "1re", "1re", "Loi de Beer-Lambert", "A = ε × ℓ × C", [["A", "Absorbance A", ""], ["eps", "Coefficient d'absorption molaire ε", "L·mol⁻¹·cm⁻¹"], ["l", "Largeur de la cuve ℓ", "cm", "1"], ["C", "Concentration C", "mol·L⁻¹"]], o => [o.A, o.eps * o.l * o.C]],
  ["etalon", "1re", "1re", "Dosage par étalonnage (droite A = k × C)", "A = k × C", [["A", "Absorbance A (ou conductivité)", ""], ["k", "Coefficient directeur k", ""], ["C", "Concentration C", "mol·L⁻¹"]], o => [o.A, o.k * o.C], "Trace la droite d'étalonnage avec le traceur de courbes pour obtenir k."],
  ["combu", "1re", "1re", "Énergie libérée par une combustion", "Q = m × PC", [["Q", "Énergie libérée Q", "kJ"], ["m", "Masse de combustible m", "kg"], ["PC", "Pouvoir calorifique PC", "kJ·kg⁻¹"]], o => [o.Q, o.m * o.PC], "PC du butane ≈ 4,6 × 10⁴ kJ·kg⁻¹ ; du bois ≈ 1,5 × 10⁴ kJ·kg⁻¹."],
  ["combu_mol", "1re", "1re", "Énergie molaire de combustion", "E = n × E_comb", [["E", "Énergie libérée E", "kJ"], ["n", "Quantité de combustible n", "mol"], ["Ec", "Énergie molaire de combustion", "kJ·mol⁻¹"]], o => [o.E, o.n * o.Ec], "Méthane : environ 890 kJ·mol⁻¹."],
  // ---------- Seconde ----------
  ["cm", "2nde", "2nde", "Concentration en masse", "Cm = m_soluté / V_solution", [["Cm", "Concentration en masse Cm", "g·L⁻¹"], ["m", "Masse de soluté m", "g"], ["V", "Volume de solution V", "L"]], o => [o.Cm, o.m / o.V]],
  ["facteur", "2nde", "2nde", "Facteur de dilution", "F = C_mère / C_fille = V_fille / V_mère", [["F", "Facteur de dilution F", ""], ["Vf", "Volume de solution fille", "mL"], ["Vm", "Volume de solution mère prélevé", "mL"]], o => [o.F, o.Vf / o.Vm], "Exemple : diluer 10 fois → prélever 10,0 mL et compléter à 100,0 mL."],
  ["rho_chi", "2nde", "2nde", "Masse volumique d'une espèce chimique", "ρ = m / V", [["rho", "Masse volumique ρ", "g·mL⁻¹"], ["m", "Masse m", "g"], ["V", "Volume V", "mL"]], o => [o.rho, o.m / o.V], "Eau : 1,00 g·mL⁻¹ ; éthanol : 0,79 g·mL⁻¹."],
  ["pctm", "2nde", "2nde", "Pourcentage massique", "w = m_espèce / m_totale", [["w", "Pourcentage massique w", "%"], ["m", "Masse de l'espèce", "g"], ["mt", "Masse totale du mélange", "g"]], o => [o.w, 100 * o.m / o.mt]],
  ["solub", "2nde", "2nde", "Solubilité", "s = m_max / V", [["s", "Solubilité s", "g·L⁻¹"], ["m", "Masse maximale dissoute", "g"], ["V", "Volume de solvant", "L"]], o => [o.s, o.m / o.V], "Sel (NaCl) dans l'eau à 20 °C : environ 360 g·L⁻¹."],
  ["m_atome", "2nde", "2nde", "Masse approchée d'un atome", "m ≈ A × m_nucléon", [["m", "Masse de l'atome m", "kg"], ["A", "Nombre de masse A", ""]], o => [o.m, o.A * K_.mn], "m_nucléon ≈ 1,67 × 10⁻²⁷ kg (la masse des électrons est négligeable)."],
  ["n_entites", "2nde", "2nde", "Nombre d'entités dans un échantillon", "N = m_échantillon / m_entité", [["N", "Nombre d'entités N", ""], ["m", "Masse de l'échantillon", "kg"], ["me", "Masse d'une entité", "kg"]], o => [o.N, o.m / o.me]]
];

/* ---------- résolution numérique de l'inconnue ---------- */
function resoudreInconnue(eq, o, k){
  const g = x => { const p = { ...o, [k]: x }; const [a, b] = eq(p); return a - b; };
  const ok = x => { if (!isFinite(x)) return false; const p = { ...o, [k]: x }; const [a, b] = eq(p); return isFinite(a) && isFinite(b) && Math.abs(a - b) <= 1e-7 * (Math.abs(a) + Math.abs(b)) + 1e-300; };
  const X = []; for (let e = -40; e <= 40; e += .1) X.push(10 ** e);
  const balayer = L => { let px = L[0], pg = g(px); if (pg === 0) return px;
    for (let i = 1; i < L.length; i++) { const x = L[i], gx = g(x); if (gx === 0) return x;
      if (isFinite(pg) && isFinite(gx) && (pg < 0) !== (gx < 0)) { let a = px, b = x, ga = pg; for (let j = 0; j < 200; j++) { const m = (a + b) / 2, gm = g(m); if (gm === 0) { a = b = m; break; } if ((ga < 0) === (gm < 0)) { a = m; ga = gm; } else b = m; } const r = (a + b) / 2; if (ok(r)) return r; }
      px = x; pg = gx; } return null; };
  let r = balayer(X); if (r != null) return r;
  if (ok(0)) return 0;
  r = balayer(X.map(x => -x)); return r;
}
const jolie = t => esc(t).replace(/\^\(([^()]*)\)/g, "<sup>$1</sup>").replace(/\^([A-Za-z0-9]+)/g, "<sup>$1</sup>").replace(/_([A-Za-zÀ-ÿ0-9]+(?:,[a-z])?)/g, "<sub>$1</sub>");
const fmt4 = x => fmtSci(Number(Number(x).toPrecision(4)));
const nbF = v => nb(String(v ?? "").replace(/\s*[×x]\s*10\^?\s*/i, "e").replace(/⁻/g, "-"));
function carteFormule(t, dom){
  const [id, , niv, titre, formule, V, eq, aide] = t, cle = k => "F_" + dom + "_" + id + "_" + k;
  const val = ([k, , , d]) => OV[cle(k)] !== undefined ? OV[cle(k)] : (d ?? "");
  const o = {}, vides = []; V.forEach(v => { const x = nbF(val(v)); if (String(val(v)).trim() === "") vides.push(v); else o[v[0]] = x; });
  let res = "";
  const invalide = V.find(v => String(val(v)).trim() !== "" && !isFinite(o[v[0]]));
  if (invalide) res = `<div class="ores err">Valeur non comprise pour « ${esc(invalide[1])} ».</div>`;
  else if (vides.length === 1) { const [k, lib, u] = vides[0], x = resoudreInconnue(eq, o, k); res = x == null ? `<div class="ores err">Pas de solution avec ces valeurs : vérifie-les.</div>` : `<div class="ores bon"><b>${jolie(lib)} = ${fmt4(x)}${u ? " " + esc(u) : ""}</b></div>`; }
  else if (vides.length > 1) { if (V.some(v => v[3] == null && String(val(v)).trim() !== "")) res = `<p class="fmuet">Remplis toutes les valeurs sauf celle à calculer.</p>`; }
  else res = `<p class="fmuet">Vide la case de la grandeur à calculer.</p>`;
  const k0 = dom + ":" + id, ouv = FOPEN.has(k0) || V.some(v => OV[cle(v[0])] !== undefined && String(OV[cle(v[0])]).trim() !== "");
  return `<article class="fcarte${ouv ? " ouvert" : ""}" data-niv="${esc(niv)}" data-k="${esc(k0)}"><header data-act="fouvre"><span class="simniv">${esc(niv)}</span><h3>${jolie(titre)}</h3><button class="ib" data-act="fclr" data-p="${esc("F_" + dom + "_" + id + "_")}" title="Effacer" aria-label="Effacer">${icon("restore")}</button></header>
    <div class="fformule" tabindex="0">${jolie(formule)}</div>
    <div class="ochamps">${V.map(v => `<label class="ochamp"><span>${jolie(v[1])}</span><span class="ochin"><input id="${cle(v[0])}" data-oi="1" value="${esc(val(v))}" inputmode="decimal" autocomplete="off">${v[2] ? `<em>${esc(v[2])}</em>` : ""}</span></label>`).join("")}</div>
    ${res}${aide ? `<p class="faide">${esc(aide)}</p>` : ""}</article>`;
}
const NIVEAUX = [["Tle", "Terminale"], ["1re", "Première"], ["2nde", "Seconde"]];
function barreNiveaux(dom){
  const n = ov("fniv_" + dom) || "tout";
  return `<div class="fbarre"><div class="fchips">${[["tout", "Tous les niveaux"], ...NIVEAUX].map(([k, l]) => `<button class="chip${n === k ? " on" : ""}" data-act="fniv" data-d="${dom}" data-n="${k}">${l}</button>`).join("")}</div>
    <div class="simq">${icon("search")}<input type="search" id="fQ_${dom}" data-oi="1" placeholder="Chercher un outil : énergie, pH, lentille…" value="${esc(ov("fQ_" + dom))}" aria-label="Chercher un outil"></div></div>`;
}
/* sections : outils « spéciaux » (HTML déjà prêt, avec niveau et mots-clés) + formulaires */
function vueFormulaires(dom, liste, speciaux){
  const n = ov("fniv_" + dom) || "tout", q = sansAccent(ov("fQ_" + dom) || ""), voit = txt => !q || sansAccent(txt).includes(q);
  let total = 0;
  const sections = NIVEAUX.filter(([k]) => n === "tout" || n === k).map(([k, l]) => {
    const sp = (speciaux[k] || []).filter(s => voit(s.mots)), fo = liste.filter(t => t[1] === k && voit(t[3] + " " + t[4] + " " + t[2]));
    total += sp.length + fo.length;
    return sp.length + fo.length ? `<section class="fsection"><h2>${l} <small>${sp.length + fo.length} outils</small></h2><div class="fgrille">${sp.map(s => s.html).join("")}${fo.map(t => carteFormule(t, dom)).join("")}</div></section>` : "";
  }).join("");
  return barreNiveaux(dom) + `<p class="muted fintro">Dans chaque outil, remplis toutes les valeurs sauf une : la grandeur laissée vide est calculée automatiquement. Les nombres s'écrivent 0,5 ou 6,02e23 (= 6,02 × 10²³).</p>` + (total ? sections : `<p class="muted">Aucun outil ne correspond à ta recherche.</p>`);
}
const spec = (html, mots) => { const k0 = "sp:" + mots.split(" ").slice(0, 3).join("-"); return { html: html.replace('<section class="ocarte"', `<section class="ocarte fcarte fspec${FOPEN.has(k0) ? " ouvert" : ""}" data-k="${k0}"`).replace(/<h3>/, '<h3 data-act="fouvre">'), mots }; };

/* ---------- outils spéciaux de chimie ---------- */
function carteAvancement(){
  const g = k => nb(ov("av" + k)), a = g("a") || 1, b = g("b") || 1, c = g("c") || 1, d = g("d") || 0, nA = g("nA"), nB = g("nB");
  let r = "";
  if (isFinite(nA) && isFinite(nB)) { const xA = nA / a, xB = nB / b, x = Math.min(xA, xB), lim = Math.abs(xA - xB) < 1e-12 * Math.max(xA, xB) ? "mélange stœchiométrique : les deux réactifs sont limitants" : xA < xB ? "le réactif limitant est A" : "le réactif limitant est B";
    r = `<div class="ores bon"><b>x_max = ${fmt4(x)} mol</b><small>${lim}</small></div><div class="tablewrap" tabindex="0" role="region" aria-label="Tableau"><table class="admtable avtab"><thead><tr><th class="first">État</th><th>a A</th><th>b B</th><th>c C</th>${d ? "<th>d D</th>" : ""}</tr></thead><tbody>
      <tr><td class="first">Initial (x = 0)</td><td>${fmt4(nA)}</td><td>${fmt4(nB)}</td><td>0</td>${d ? "<td>0</td>" : ""}</tr>
      <tr><td class="first">En cours (x)</td><td>${fmt4(nA)} − ${a}x</td><td>${fmt4(nB)} − ${b}x</td><td>${c}x</td>${d ? `<td>${d}x</td>` : ""}</tr>
      <tr><td class="first">Final (x_max)</td><td>${fmt4(nA - a * x)}</td><td>${fmt4(nB - b * x)}</td><td>${fmt4(c * x)}</td>${d ? `<td>${fmt4(d * x)}</td>` : ""}</tr></tbody></table></div>`; }
  return carteOutil("Tableau d'avancement", "Réaction a A + b B → c C + d D (transformation totale). Quantités en mol.", `<div class="ochamps">${champ("ava", "a", ov("ava") || "1", "")}${champ("avb", "b", ov("avb") || "1", "")}${champ("avc", "c", ov("avc") || "1", "")}${champ("avd", "d (0 si absent)", ov("avd") || "1", "")}${champ("avnA", "n(A) initial", ov("avnA"), "mol")}${champ("avnB", "n(B) initial", ov("avnB"), "mol")}</div>${r}`);
}
const valenceDe = s => { const z = (ELEM.find(e => e.s === s) || {}).z; if (!z) return NaN; if (z === 1) return 1; if (z === 2) return 2; const col = posElement(z)[1]; return col <= 2 ? col : col >= 13 ? col - 10 : NaN; };
function carteLewis(){
  const f = ov("lwF"); let r = "";
  if (f) try { const m = f.match(/\^(\d*)([+-])$/) || f.match(/()([+-])$/), ch = m ? (m[2] === "+" ? 1 : -1) * (m[1] ? Number(m[1]) : 1) : 0, o = analyserFormule(f.replace(/\^\d*[+-]$|[+-]$/, ""));
    const det = Object.entries(o).map(([e, n]) => { const v = valenceDe(e); if (!isFinite(v)) throw new Error("Élément de transition non pris en charge : " + e); return [e, n, v]; });
    const tot = det.reduce((s, [, n, v]) => s + n * v, 0) - ch;
    r = `<div class="ores bon"><b>${tot} électrons de valence → ${tot % 2 ? (tot - 1) / 2 + " doublets + 1 électron célibataire" : tot / 2 + " doublets"}</b><small>${det.map(([e, n, v]) => `${n} × ${v} (${e})`).join(" + ")}${ch ? ` ${ch > 0 ? "−" : "+"} ${Math.abs(ch)} (charge)` : ""}</small></div>`;
  } catch (e) { r = `<div class="ores err">${esc(e.message)}</div>`; }
  return carteOutil("Schéma de Lewis : électrons et doublets", "Formule brute d'une molécule ou d'un ion : H2O, CO2, NH4+, CO3^2-… Les doublets se répartissent ensuite en liants et non liants (règles du duet et de l'octet).", `<label class="ochamp"><span>Formule</span><span class="ochin"><input id="lwF" data-oi="1" value="${esc(f)}" placeholder="H2O" spellcheck="false"></span></label>${r}`);
}
function carteNoyau(){
  const s = (ov("nyS") || "").trim(), A = nb(ov("nyA")); let r = "";
  const el = ELEM.find(e => e.s.toLowerCase() === s.toLowerCase() || sansAccent(e.n) === sansAccent(s));
  if (s && !el) r = `<div class="ores err">Élément inconnu : écris un symbole (C, Na, U…) ou un nom.</div>`;
  else if (el) r = `<div class="ores bon"><b>${esc(el.n)} : Z = ${el.z}${isFinite(A) ? ` · A = ${A}` : ""}</b><small>${el.z} protons${isFinite(A) ? ` · ${A - el.z} neutrons · ${A} nucléons` : ""} · ${el.z} électrons dans l'atome · noté <sup>${isFinite(A) ? A : "A"}</sup><sub>${el.z}</sub>${esc(el.s)}${isFinite(A) && A - el.z < 0 ? " — attention : A doit être ≥ Z" : ""}</small></div>`;
  return carteOutil("Composition d'un atome", "Symbole (ou nom) et nombre de masse A.", `<div class="ochamps"><label class="ochamp"><span>Élément</span><span class="ochin"><input id="nyS" data-oi="1" value="${esc(s)}" placeholder="C" spellcheck="false"></span></label>${champ("nyA", "Nombre de masse A", ov("nyA"), "", "14")}</div>${r}`);
}
function carteConfig(){
  const z = nb(ov("cfZ")); let r = "";
  if (isFinite(z) && z >= 1 && z <= 36 && Number.isInteger(z)) { const el = ELEM.find(e => e.z === z), [p, col] = posElement(z), v = valenceDe(el.s);
    r = `<div class="ores bon"><b>${esc(el.n)} (${el.s}) : ${configElec(z)}</b><small>Période ${p} · colonne ${col}${isFinite(v) ? ` · ${v} électron(s) de valence` : ""}</small></div>`; }
  else if (ov("cfZ")) r = `<div class="ores err">Entre un numéro atomique entier entre 1 et 36.</div>`;
  return carteOutil("Configuration électronique", "Numéro atomique Z (de 1 à 36, programme de Seconde).", `${champ("cfZ", "Numéro atomique Z", ov("cfZ"), "", "17")}${r}`);
}
function carteSens(){
  const q = nbF(ov("seQ")), k = nbF(ov("seK")); let r = "";
  if (isFinite(q) && isFinite(k)) r = Math.abs(q - k) <= 1e-9 * Math.max(Math.abs(q), Math.abs(k)) ? `<div class="ores bon"><b>Qr = K : le système est à l'équilibre</b><small>Aucune évolution macroscopique.</small></div>` : q < k ? `<div class="ores bon"><b>Qr < K : évolution dans le sens direct (→)</b><small>Les réactifs sont consommés, Qr augmente jusqu'à K.</small></div>` : `<div class="ores bon"><b>Qr > K : évolution dans le sens inverse (←)</b><small>Les produits sont consommés, Qr diminue jusqu'à K.</small></div>`;
  return carteOutil("Sens d'évolution spontanée", "Compare le quotient de réaction initial Qr,i à la constante d'équilibre K.", `<div class="ochamps">${champ("seQ", "Qr,i", ov("seQ"), "")}${champ("seK", "K", ov("seK"), "")}</div>${r}`);
}
OUTILS_PLUS.chimie = function(){
  const B = cartesChimieBase();
  return vueFormulaires("chi", F_CHI, {
    Tle: [spec(B.ph, "pH concentration H3O+ acide base Tle"), spec(carteSens(), "sens évolution quotient Qr constante équilibre K Tle")],
    "1re": [spec(carteAvancement(), "tableau d'avancement réactif limitant xmax stoechiométrique 1re"), spec(carteLewis(), "Lewis doublets électrons valence molécule ion 1re")],
    "2nde": [spec(B.mm, "masse molaire formule brute 2nde"), spec(B.eq, "ajuster équilibrer équation réaction 2nde"), spec(B.q, "quantité de matière n = m/M concentration 2nde"), spec(B.dil, "dilution solution mère fille C1V1 2nde"), spec(carteNoyau(), "noyau atome protons neutrons électrons A Z 2nde"), spec(carteConfig(), "configuration électronique couche valence période colonne 2nde")]
  });
};
IC.pendule = IC.pendule || '<path d="M4 3h16M12 3l-4 12"/><circle cx="7.5" cy="17" r="3"/>';
OUTILS_PLUS.phys = () => vueFormulaires("phy", F_PHY, {});
document.addEventListener("click", e => {
  const a = e.target.closest && e.target.closest('[data-act="fniv"],[data-act="fclr"],[data-act="fouvre"]'); if (!a) return;
  if (a.dataset.act === "fouvre") { if (e.target.closest('[data-act="fclr"]') || window.innerWidth > 760) return; const c = a.closest(".fcarte"); if (!c) return; e.preventDefault(); const k = c.dataset.k; if (FOPEN.has(k)) { FOPEN.delete(k); c.classList.remove("ouvert"); } else { FOPEN.add(k); c.classList.add("ouvert"); } return; }
  e.preventDefault(); e.stopPropagation();
  if (a.dataset.act === "fniv") OV["fniv_" + a.dataset.d] = a.dataset.n;
  else { const p = a.dataset.p; Object.keys(OV).forEach(k => { if (k.startsWith(p)) delete OV[k]; }); }
  render();
}, true);
