/* =====================================================================
   Raccourcis clavier AZERTY : panneau flottant (ne cache pas la page)
   ===================================================================== */
IC.clavier = IC.clavier || '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M18 14h.01M9 14h6"/>';
const K = t => t.split(" + ").map(x => `<kbd>${esc(x)}</kbd>`).join(" + ");
const AZ = [
  ["Ponctuation", [[".", "Maj + ;"], [",", ","], [";", ";"], [":", ":"], ["!", "!"], ["?", "Maj + ,"], ["'", "4", "apostrophe, sans Maj"], ['"', "3", "guillemet, sans Maj"], ["-", "6", "tiret, sans Maj (ou pavé numérique)"], ["_", "8", "tiret bas, sans Maj"], ["(", "5"], [")", ")", "touche à droite du 0"], ["«", "Alt + 0171", "pavé numérique"], ["»", "Alt + 0187", "pavé numérique"], ["…", "Alt + 0133", "points de suspension"]]],
  ["Symboles", [["@", "AltGr + à", "AltGr + touche 0"], ["%", "Maj + ù"], ["&", "1"], ["/", "Maj + :", "ou pavé numérique"], ["*", "*", "ou pavé numérique"], ["+", "Maj + =", "ou pavé numérique"], ["=", "="], ["#", "AltGr + 3"], ["€", "AltGr + E"], ["$", "$"], ["£", "Maj + $"], ["§", "Maj + !"], ["°", "Maj + )"], ["²", "²", "touche en haut à gauche"], ["µ", "Maj + *"], ["<", "<"], [">", "Maj + <"], ["±", "Alt + 0177"], ["×", "Alt + 0215"], ["÷", "Alt + 0247"]]],
  ["Lettres accentuées", [["é", "2"], ["è", "7"], ["à", "0"], ["ù", "ù"], ["ç", "9"], ["ê", "^ puis E", "accent circonflexe, puis la lettre"], ["â", "^ puis A"], ["î", "^ puis I"], ["ô", "^ puis O"], ["û", "^ puis U"], ["ë", "Maj + ^ puis E", "tréma ¨, puis la lettre"], ["ï", "Maj + ^ puis I"], ["ü", "Maj + ^ puis U"], ["á", "Alt + 0225", "pavé numérique"], ["í", "Alt + 0237"], ["ó", "Alt + 0243"], ["ú", "Alt + 0250"], ["ñ", "Alt + 0241"]]],
  ["Majuscules accentuées et lettres liées", [["É", "Alt + 0201"], ["È", "Alt + 0200"], ["À", "Alt + 0192"], ["Ç", "Alt + 0199"], ["Ê", "^ puis Maj + E"], ["Ô", "^ puis Maj + O"], ["œ", "Alt + 0156", "cœur, sœur"], ["Œ", "Alt + 0140"], ["æ", "Alt + 0230"]]],
  ["Programmation", [["{", "AltGr + 4"], ["}", "AltGr + ="], ["[", "AltGr + 5"], ["]", "AltGr + )"], ["|", "AltGr + 6"], ["\\", "AltGr + 8"], ["~", "AltGr + 2 puis Espace"], ["`", "AltGr + 7 puis Espace"], ["^", "^ puis Espace", "ou AltGr + 9"], ["0…9", "Maj + touche", "ou Verr. Maj, ou pavé numérique"]]],
  ["Raccourcis utiles", [["Copier", "Ctrl + C"], ["Couper", "Ctrl + X"], ["Coller", "Ctrl + V"], ["Annuler", "Ctrl + Z"], ["Rétablir", "Ctrl + Y"], ["Tout sélectionner", "Ctrl + A"], ["Enregistrer", "Ctrl + S"], ["Rechercher", "Ctrl + F"], ["Imprimer", "Ctrl + P"], ["Changer de fenêtre", "Alt + Tab"], ["Capture d'écran", "Win + Maj + S"], ["Historique du presse-papiers", "Win + V"], ["Émojis et symboles", "Win + ."], ["Rouvrir un onglet fermé", "Ctrl + Maj + T"], ["Exposant (Word)", "Ctrl + Maj + ="], ["Indice (Word)", "Ctrl + ="], ["Zoomer / dézoomer", "Ctrl + molette"]]]
];
let azQ = "";
function contenuAzerty(){
  const q = sansAccent(azQ);
  return AZ.map(([g, L]) => { const R = L.filter(([c, k, n]) => !q || sansAccent(c + " " + k + " " + (n || "") + " " + g).includes(q) || c.toLowerCase() === azQ.toLowerCase());
    return R.length ? `<section><h4>${esc(g)}</h4>${R.map(([c, k, n]) => `<div class="azl">${c.length <= 3 ? `<button class="azc" data-act="azcopie" data-c="${esc(c)}" title="Copier « ${esc(c)} »">${esc(c)}</button>` : `<span class="azt">${esc(c)}</span>`}<span class="azk">${K(k).replace(/<kbd>([^<]*) puis ([^<]*)<\/kbd>/g, "<kbd>$1</kbd> <i>puis</i> <kbd>$2</kbd>")}${n ? `<small>${esc(n)}</small>` : ""}</span></div>`).join("")}</section>` : ""; }).join("") || `<p class="muted">Aucun résultat.</p>`;
}
function ouvrirAzerty(){
  let p = document.getElementById("azPanel"); if (p) { p.remove(); return; }
  p = document.createElement("div"); p.id = "azPanel"; p.setAttribute("role", "dialog"); p.setAttribute("aria-label", "Raccourcis AZERTY");
  p.innerHTML = `<header class="azhead">${icon("clavier")}<b>Raccourcis AZERTY</b><button class="ib" data-act="azfermer" aria-label="Fermer">${icon("x")}</button></header>
    <div class="azbarre"><input type="search" id="azQ" placeholder="Chercher : @, accent, crochet, copier…" aria-label="Chercher un raccourci"><small>Clavier français (Windows). Alt + code : maintiens Alt et tape le nombre sur le pavé numérique. Clique sur un caractère pour le copier.</small></div>
    <div class="azcorps">${contenuAzerty()}</div>`;
  document.body.appendChild(p);
  try { const pos = JSON.parse(localStorage.getItem("pp_azpos") || "null"); if (pos) { p.style.left = Math.min(pos.x, innerWidth - 120) + "px"; p.style.top = Math.min(pos.y, innerHeight - 80) + "px"; p.style.right = "auto"; p.style.bottom = "auto"; } } catch (_) {}
  p.querySelector("#azQ").addEventListener("input", e => { azQ = e.target.value; p.querySelector(".azcorps").innerHTML = contenuAzerty(); });
  const h = p.querySelector(".azhead");
  h.addEventListener("pointerdown", e => { if (e.target.closest("button")) return; const r = p.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top; h.setPointerCapture(e.pointerId);
    const mv = ev => { p.style.left = Math.max(0, Math.min(innerWidth - 80, ev.clientX - dx)) + "px"; p.style.top = Math.max(0, Math.min(innerHeight - 40, ev.clientY - dy)) + "px"; p.style.right = "auto"; p.style.bottom = "auto"; };
    const up = () => { h.removeEventListener("pointermove", mv); h.removeEventListener("pointerup", up); try { localStorage.setItem("pp_azpos", JSON.stringify({ x: parseInt(p.style.left), y: parseInt(p.style.top) })); } catch (_) {} };
    h.addEventListener("pointermove", mv); h.addEventListener("pointerup", up); });
  document.querySelectorAll('[data-act="azerty"]').forEach(x => x.setAttribute("aria-current", "page"));
}
document.addEventListener("click", async e => {
  const a = e.target.closest && e.target.closest('[data-act="azerty"],[data-act="azfermer"],[data-act="azcopie"]'); if (!a) return; e.preventDefault(); e.stopPropagation();
  if (a.dataset.act === "azerty") { if (window.innerWidth < 1100 && S.drawer) { S.drawer = false; render(); } ouvrirAzerty(); if (!document.getElementById("azPanel")) document.querySelectorAll('[data-act="azerty"]').forEach(x => x.removeAttribute("aria-current")); }
  else if (a.dataset.act === "azfermer") { document.getElementById("azPanel")?.remove(); document.querySelectorAll('[data-act="azerty"]').forEach(x => x.removeAttribute("aria-current")); }
  else { try { await navigator.clipboard.writeText(a.dataset.c); toast("« " + a.dataset.c + " » copié"); } catch (_) { toast("Copie impossible"); } }
}, true);
document.addEventListener("keydown", e => { if (e.key === "Escape" && document.getElementById("azPanel") && !document.querySelector(".modal, dialog[open]")) document.getElementById("azPanel").remove(); });
