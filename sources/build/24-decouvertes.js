/* =====================================================================
   Accueil public : « Découvertes du jour » (simulation, défi, le saviez-vous)
   ===================================================================== */
const DEFIS = [
  ["2nde", "Quelle est l'unité de la quantité de matière ?", ["la mole (mol)", "le gramme (g)", "le litre (L)", "le joule (J)"], 0, "La quantité de matière n s'exprime en moles : 1 mol contient environ 6,02 × 10²³ entités."],
  ["2nde", "Quelle est la vitesse de la lumière dans le vide ?", ["340 m/s", "3,00 × 10⁸ m/s", "3,00 × 10⁵ m/s", "1 500 m/s"], 1, "c ≈ 3,00 × 10⁸ m/s, soit 300 000 km par seconde. 340 m/s est la vitesse du son dans l'air."],
  ["2nde", "Combien d'électrons de valence possède l'atome de chlore (Z = 17) ?", ["1", "5", "7", "17"], 2, "Configuration 1s² 2s² 2p⁶ 3s² 3p⁵ : 2 + 5 = 7 électrons sur la couche de valence."],
  ["2nde", "Quel ion forme le sodium (Z = 11) ?", ["Na⁻", "Na⁺", "Na²⁺", "Na²⁻"], 1, "En perdant 1 électron, le sodium acquiert la configuration stable du néon : il forme Na⁺."],
  ["2nde", "Une solution aqueuse neutre à 25 °C a un pH de :", ["0", "1", "7", "14"], 2, "pH < 7 : acide ; pH = 7 : neutre ; pH > 7 : basique (à 25 °C)."],
  ["2nde", "Dans un noyau de carbone 14 (¹⁴₆C), combien y a-t-il de neutrons ?", ["6", "8", "14", "20"], 1, "N = A − Z = 14 − 6 = 8 neutrons."],
  ["2nde", "La loi de Snell-Descartes décrit :", ["la réflexion", "la réfraction", "la diffraction", "la dispersion par un prisme seulement"], 1, "n₁ sin(i₁) = n₂ sin(i₂) : changement de direction de la lumière en changeant de milieu."],
  ["2nde", "Un signal a une période T = 20 ms. Sa fréquence est :", ["20 Hz", "50 Hz", "200 Hz", "0,05 Hz"], 1, "f = 1 / T = 1 / 0,020 s = 50 Hz."],
  ["2nde", "Le domaine des sons audibles par l'être humain va environ de :", ["2 Hz à 2 kHz", "20 Hz à 20 kHz", "200 Hz à 200 kHz", "20 kHz à 200 kHz"], 1, "En dessous de 20 Hz : infrasons ; au-dessus de 20 kHz : ultrasons."],
  ["2nde", "Le poids d'un objet de 10 kg sur Terre (g ≈ 9,8 N/kg) vaut environ :", ["10 N", "98 N", "9,8 kg", "0,98 N"], 1, "P = m × g = 10 × 9,8 ≈ 98 N. Le poids est une force : il s'exprime en newtons."],
  ["2nde", "Dans un circuit en série, l'intensité du courant :", ["est la même en tout point", "augmente après chaque dipôle", "diminue après chaque dipôle", "est nulle entre deux dipôles"], 0, "Loi d'unicité de l'intensité dans un circuit série."],
  ["2nde", "Quelle est la masse volumique de l'eau liquide ?", ["1,0 g/L", "1,0 kg/L", "10 kg/L", "1,0 kg/m³"], 1, "ρ(eau) ≈ 1,0 kg/L = 1 000 kg/m³ = 1,0 g/mL."],
  ["1re", "L'énergie cinétique d'un objet de 2 kg roulant à 3 m/s vaut :", ["3 J", "6 J", "9 J", "18 J"], 2, "Ec = ½ m v² = ½ × 2 × 3² = 9 J."],
  ["1re", "Lors d'une oxydation, une espèce chimique :", ["gagne des électrons", "perd des électrons", "gagne des protons", "perd des neutrons"], 1, "Oxydation = perte d'électrons ; réduction = gain d'électrons."],
  ["1re", "Un appareil sous 230 V est traversé par 2 A. Sa puissance est :", ["115 W", "232 W", "460 W", "4,6 kW"], 2, "P = U × I = 230 × 2 = 460 W."],
  ["1re", "Un radiateur électrique convertit l'énergie électrique principalement en :", ["énergie lumineuse", "énergie thermique", "énergie mécanique", "énergie chimique"], 1, "Par effet Joule, l'énergie électrique est convertie en énergie thermique."],
  ["1re", "Dans le cristal de chlorure de sodium, les ions Na⁺ et Cl⁻ sont liés par :", ["une liaison covalente", "l'interaction électrostatique", "l'interaction gravitationnelle", "des liaisons hydrogène"], 1, "Des charges de signes opposés s'attirent : c'est l'interaction électrostatique (loi de Coulomb)."],
  ["Tle", "Selon Brønsted, un acide est une espèce capable de :", ["céder un proton H⁺", "capter un proton H⁺", "céder un électron", "capter un électron"], 0, "Acide : donneur de H⁺ ; base : accepteur de H⁺."],
  ["Tle", "En chute libre (frottements négligés), l'accélération d'un objet est :", ["nulle", "égale à g, verticale vers le bas", "proportionnelle à sa masse", "dirigée selon la vitesse initiale"], 1, "D'après la 2e loi de Newton : m a = m g, donc a = g, quelle que soit la masse."],
  ["Tle", "La constante d'Avogadro vaut environ :", ["6,02 × 10²³ mol⁻¹", "6,67 × 10⁻¹¹ mol⁻¹", "1,60 × 10⁻¹⁹ mol⁻¹", "3,00 × 10⁸ mol⁻¹"], 0, "N_A ≈ 6,02 × 10²³ mol⁻¹ : c'est le nombre d'entités dans une mole."],
  ["Tle", "Le temps de demi-vie d'un échantillon radioactif est la durée au bout de laquelle :", ["tous les noyaux se sont désintégrés", "la moitié des noyaux initiaux se sont désintégrés", "l'activité a doublé", "la masse de l'échantillon est divisée par 4"], 1, "Après t½, il reste N₀/2 noyaux ; après 2 t½, N₀/4…"],
  ["SNT", "Combien de bits contient un octet ?", ["2", "4", "8", "1 024"], 2, "1 octet (byte) = 8 bits, soit 256 valeurs possibles."],
  ["SNT", "Combien vaut le nombre binaire 1010 en décimal ?", ["4", "10", "12", "1 010"], 1, "1×8 + 0×4 + 1×2 + 0×1 = 10."],
  ["SNT", "Une adresse IPv4 est codée sur :", ["8 bits", "16 bits", "32 bits", "128 bits"], 2, "4 nombres de 0 à 255, donc 4 × 8 = 32 bits (IPv6 : 128 bits)."],
  ["SNT", "Quel service traduit un nom de domaine (ex. wikipedia.org) en adresse IP ?", ["HTTP", "DNS", "HTML", "GPS"], 1, "Le DNS (Domain Name System) est l'« annuaire » d'Internet."],
  ["SNT", "Une connexion à 80 Mbit/s télécharge au mieux, chaque seconde :", ["80 Mo", "10 Mo", "640 Mo", "8 Mo"], 1, "80 Mbit ÷ 8 = 10 Mo : les débits sont en bits, les fichiers en octets."],
  ["SNT", "Le langage HTML sert à :", ["mettre en forme les couleurs uniquement", "structurer le contenu d'une page web", "stocker les données d'un serveur", "transporter les paquets sur le réseau"], 1, "HTML structure (titres, paragraphes, liens…), CSS met en forme."],
  ["SNT", "Quelle couleur correspond au code hexadécimal #FF0000 ?", ["rouge", "vert", "bleu", "blanc"], 0, "FF = 255 pour le rouge, 00 pour le vert et le bleu."],
  ["SNT", "Pour se localiser, un récepteur GPS a besoin des signaux d'au moins :", ["1 satellite", "2 satellites", "4 satellites", "24 satellites"], 2, "3 satellites pour la position, un 4e pour corriger l'horloge du récepteur."],
  ["SNT", "En Python, que produit list(range(3)) ?", ["[1, 2, 3]", "[0, 1, 2]", "[0, 1, 2, 3]", "[3]"], 1, "range(3) commence à 0 et s'arrête avant 3."],
  ["SI", "Un engrenage menant de 10 dents entraîne un engrenage mené de 30 dents. Le mené tourne :", ["3 fois plus vite", "3 fois moins vite", "à la même vitesse", "30 fois moins vite"], 1, "r = Z menant / Z mené = 10 / 30 = 1/3 : c'est un réducteur."],
  ["SI", "Dans la chaîne de puissance d'un système, le moteur a pour fonction de :", ["acquérir une information", "convertir l'énergie", "traiter l'information", "communiquer"], 1, "Il convertit l'énergie électrique en énergie mécanique."],
  ["SI", "Un capteur de température :", ["transforme une grandeur physique en signal", "commande un moteur", "stocke de l'énergie", "affiche une valeur"], 0, "Il appartient à la chaîne d'information (fonction « acquérir »)."],
  ["Techno", "Quelle est l'unité de la résistance électrique ?", ["le volt", "l'ampère", "l'ohm", "le watt"], 2, "La résistance R s'exprime en ohms (Ω)."],
  ["Techno", "La loi d'Ohm s'écrit :", ["U = R × I", "U = R / I", "I = R × U", "P = R × I"], 0, "U en volts, R en ohms, I en ampères."],
  ["Techno", "Quel matériau est le meilleur conducteur électrique ?", ["le bois", "le plastique", "le cuivre", "le verre"], 2, "Le cuivre est utilisé dans les câbles électriques pour sa très bonne conductivité."]
];
const SAVIEZ = [
  "La lumière du Soleil met environ 8 minutes et 20 secondes pour arriver jusqu'à la Terre.",
  "Le son se propage environ 4 fois plus vite dans l'eau (≈ 1 500 m/s) que dans l'air (≈ 340 m/s), et pas du tout dans le vide.",
  "Un éclair peut chauffer l'air à environ 30 000 °C, soit plus de 5 fois la température de la surface du Soleil.",
  "Le premier « bug » informatique documenté (1947) était un vrai papillon de nuit coincé dans un relais de l'ordinateur Harvard Mark II.",
  "Le mot « robot » vient du tchèque « robota » (travail forcé). Il a été popularisé par la pièce de Karel Čapek en 1920.",
  "L'hélium a été découvert dans le spectre de la lumière du Soleil (1868) avant d'être trouvé sur Terre : son nom vient du grec hêlios, le Soleil.",
  "Le diamant et le graphite (la mine des crayons) sont faits du même élément : le carbone. Seul l'arrangement des atomes change.",
  "La glace est moins dense que l'eau liquide : c'est pour cela que les icebergs flottent et que les lacs gèlent par la surface.",
  "En 1869, Mendeleïev a laissé des cases vides dans son tableau et prédit les propriétés d'éléments encore inconnus, comme le gallium et le germanium.",
  "Ada Lovelace a écrit dès 1843 ce que l'on considère comme le premier programme informatique.",
  "Le premier site web, créé par Tim Berners-Lee au CERN, a été mis en ligne en 1991.",
  "Le QR code a été inventé en 1994 au Japon par l'entreprise Denso Wave, pour suivre des pièces automobiles.",
  "Sans les corrections de la relativité d'Einstein, la position donnée par le GPS dériverait d'une dizaine de kilomètres par jour.",
  "La Lune s'éloigne de la Terre d'environ 3,8 cm par an.",
  "Un atome est presque entièrement vide : si son noyau avait la taille d'une bille, l'atome aurait la taille d'un stade.",
  "Depuis 2019, le kilogramme est défini à partir de la constante de Planck, et non plus par un cylindre de métal conservé près de Paris.",
  "Le mètre est défini comme la distance parcourue par la lumière dans le vide en 1/299 792 458 de seconde.",
  "Un ordinateur ne manipule que des 0 et des 1, car un transistor n'a que deux états : bloqué ou passant.",
  "Le premier microprocesseur commercial, l'Intel 4004 (1971), comptait 2 300 transistors. Ceux d'aujourd'hui en ont plusieurs dizaines de milliards.",
  "Le ciel est bleu parce que l'atmosphère diffuse beaucoup plus la lumière bleue que la lumière rouge (diffusion de Rayleigh).",
  "Un arc-en-ciel apparaît parce que chaque goutte d'eau dévie différemment chaque couleur de la lumière blanche : c'est la dispersion.",
  "Marie Curie est la seule personne à avoir reçu deux prix Nobel dans deux sciences différentes : physique (1903) et chimie (1911).",
  "Le zéro absolu, 0 K soit −273,15 °C, est la température la plus basse qui puisse exister.",
  "L'oxygène liquide est bleu pâle et il est attiré par un aimant.",
  "Pour échapper à l'attraction de la Terre, une fusée doit atteindre environ 11,2 km/s : c'est la vitesse de libération.",
  "Dans une fibre optique, la lumière reste piégée grâce à la réflexion totale : elle peut parcourir des dizaines de kilomètres.",
  "L'air que l'on respire contient environ 78 % de diazote et seulement 21 % de dioxygène.",
  "Grâce à la poussée d'Archimède, un paquebot de plusieurs dizaines de milliers de tonnes d'acier flotte.",
  "Une imprimante 3D à dépôt de fil construit un objet en superposant des couches de plastique fondu, souvent épaisses de 0,2 mm.",
  "Le binaire était déjà étudié par Leibniz en 1703, bien avant l'invention des ordinateurs.",
  "Le disque dur d'1 To affiché « 931 Go » n'a rien perdu : Windows compte en gibioctets (1 Gio = 1 024³ octets).",
  "Le noyau d'un atome est environ 100 000 fois plus petit que l'atome lui-même.",
  "Les panneaux solaires convertissent directement la lumière en électricité grâce à l'effet photovoltaïque, expliqué en partie par Einstein.",
  "Le sel de cuisine (NaCl) est formé d'un métal très réactif, le sodium, et d'un gaz toxique, le dichlore."
];
const jourN = (d = new Date()) => Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 864e5);
const DEC = { defi: null, rep: null, fait: null };
/* niveaux de l'élève connecté (d'après ses cours) ; vide = tous les niveaux */
function niveauxEleve(){
  if (!S.user || S.prof || typeof actives !== "function") return [];
  const M = { tle: ["Tle", "1re"], "1re": ["1re", "2nde"], "2nde": ["2nde"], snt: ["SNT", "2nde"], si: ["SI", "2nde"], "3e": ["Techno"], pix: ["SNT"] }, out = new Set();
  actives().forEach(c => { const k = String(c.symbole || "").toLowerCase(), n = sansAccent(c.nom || ""); const L = M[k] || (/\bsnt\b/.test(n) ? M.snt : /\bsi\b|ingenieur/.test(n) ? M.si : /terminale|\btle\b/.test(n) ? M.tle : /1re|1ere|premiere/.test(n) ? M["1re"] : /seconde|2nde/.test(n) ? M["2nde"] : /3e|3eme|techno/.test(n) ? M["3e"] : /pix/.test(n) ? M.pix : []); L.forEach(x => out.add(x)); });
  return [...out];
}
const defisPourMoi = () => { const N = niveauxEleve(); const I = DEFIS.map((d, i) => i).filter(i => !N.length || N.includes(DEFIS[i][0])); return I.length ? I : DEFIS.map((d, i) => i); };
function simDuJour(){
  const N = niveauxEleve(), tout = SIMS.flatMap(g => g.l).filter(x => x.src === "PhET"), adapt = tout.filter(x => !N.length || N.some(n => (x.niv || "").includes(n === "Techno" ? "Techno" : n)));
  const L = adapt.length ? adapt : tout;
  const x = L[(jourN() * 7) % L.length], slug = (x.url.match(/sims\/html\/([^/]+)\//) || [])[1];
  return { ...x, img: `https://phet.colorado.edu/sims/html/${slug}/latest/${slug}-600.png` };
}
function carteDefi(){
  const I = defisPourMoi(), i = DEC.defi ?? I[(jourN() * 5) % I.length], [niv, q, opts, ok, expl] = DEFIS[i], r = DEC.rep;
  return `<article class="decarte decdefi" id="decDefi"><small class="declbl">${icon("quiz")} Défi du jour <span class="simniv">${esc(niv)}</span></small><h3>${esc(q)}</h3>
    <div class="defiopts">${opts.map((o, k) => `<button class="defiopt${r == null ? "" : k === ok ? " bon" : k === r ? " faux" : " off"}" data-act="defirep" data-k="${k}" ${r == null ? "" : "disabled"}>${esc(o)}</button>`).join("")}</div>
    ${r == null ? "" : `<p class="defiexpl"><b>${r === ok ? "Bravo !" : "Pas tout à fait."}</b> ${esc(expl)}</p><button class="linkbtn" data-act="defiautre">${icon("restore")} Un autre défi</button>`}</article>`;
}
function carteFait(){
  const i = DEC.fait ?? (jourN() * 3) % SAVIEZ.length;
  return `<article class="decarte decfait" id="decFait"><small class="declbl">${icon("idea")} Le saviez-vous ?</small><p>${esc(SAVIEZ[i])}</p><button class="linkbtn" data-act="faitautre">${icon("restore")} Une autre anecdote</button>${constanteDuJour()}</article>`;
}
function constanteDuJour(){
  const [n, sym, v, u] = CONSTANTES[(jourN() * 11) % CONSTANTES.length];
  return `<div class="decconst"><small class="declbl">${icon("key")} Constante du jour</small><b>${esc(sym).replace(/_(\w+)/, "<sub>$1</sub>")} = ${esc(v)} <span>${esc(u)}</span></b><span class="muted">${esc(n)}</span><a class="linkbtn" href="#/physique">Outils Scientifiques Importants ${icon("chevright")}</a></div>`;
}
function blocDecouvertes(){
  const s = simDuJour();
  return `<section class="decouvertes">
    <article class="decarte decsim"><small class="declbl">${icon("atom")} Simulation du jour <span class="simniv">${esc(s.niv || "")}</span></small>
      <button class="decimg" data-act="simu" data-t="${esc(s.t)}" data-u="${esc(s.url)}" title="Lancer la simulation"><img src="${esc(s.img)}" alt="" loading="lazy" onerror="this.parentNode.classList.add('vide');this.remove()"><span>${icon("play")} Lancer</span></button>
      <h3>${esc(s.t)}</h3><a class="linkbtn" href="#/simulations">Toutes les simulations ${icon("chevright")}</a></article>
    ${carteDefi()}${carteFait()}</section>`;
}
IC.idea = IC.idea || '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>';
IC.play = IC.play || '<path d="M7 4v16l13-8z"/>';
IC.chevright = IC.chevright || '<path d="m9 6 6 6-6 6"/>';
document.addEventListener("click", e => {
  const a = e.target.closest && e.target.closest('[data-act="defirep"],[data-act="defiautre"],[data-act="faitautre"]'); if (!a) return; e.preventDefault(); e.stopPropagation();
  if (a.dataset.act === "defirep") DEC.rep = Number(a.dataset.k);
  else if (a.dataset.act === "defiautre") { const I = defisPourMoi(), cur = DEC.defi ?? I[(jourN() * 5) % I.length]; let n; do n = I[Math.floor(Math.random() * I.length)]; while (n === cur && I.length > 1); DEC.defi = n; DEC.rep = null; }
  else { const cur = DEC.fait ?? (jourN() * 3) % SAVIEZ.length; let n; do n = Math.floor(Math.random() * SAVIEZ.length); while (n === cur); DEC.fait = n; }
  const id = a.dataset.act === "faitautre" ? "decFait" : "decDefi", z = document.getElementById(id); if (z) z.outerHTML = a.dataset.act === "faitautre" ? carteFait() : carteDefi();
}, true);
