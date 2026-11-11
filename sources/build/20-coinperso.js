/* ---------- Coin Perso : bloc-notes jaune personnel, mis en forme, déplaçable, enregistré tout seul ---------- */
IC.ext = '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>';
IC.swap = '<path d="M7 7h13M16 3l4 4-4 4M17 17H4M8 13l-4 4 4 4"/>';
IC.note = '<path d="M5 3h14v12l-6 6H5z"/><path d="M13 21v-6h6"/>';
IC.cpb = '<path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z"/>';
IC.cpi = '<path d="M10 5h8M6 19h8M14 5l-4 14"/>';
IC.cpu = '<path d="M7 4v7a5 5 0 0 0 10 0V4M5 20h14"/>';
IC.cps = '<path d="M5 12h14M16 6.5C15 5 13.6 4.5 12 4.5c-2.5 0-4 1.3-4 3.2M8 17.5c1 1.4 2.4 2 4 2 2.6 0 4.2-1.3 4.2-3.3"/>';
IC.cphl = '<path d="m9 15 6-11 4 2.2-6 11z"/><path d="M8 17.5 9 15l4 2.2-2 1.8z"/>';
IC.cpa = '<path d="M6 17 11 5h2l5 12M8 13h8"/>';
IC.cpul = '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>';
IC.cpol = '<path d="M10 6h10M10 12h10M10 18h10M4 4.5h1.5V9M4 9h3M4 14.5c.4-.6 1-.9 1.6-.9.8 0 1.4.5 1.4 1.2 0 1.1-3 2.2-3 3.7h3"/>';
IC.cpal = '<path d="M4 6h16M4 10h10M4 14h16M4 18h10"/>';
IC.cpac = '<path d="M4 6h16M7 10h10M4 14h16M7 18h10"/>';
IC.cpar = '<path d="M4 6h16M10 10h10M4 14h16M10 18h10"/>';
IC.cpclr = '<path d="M6 17 11 5h2l2.6 6.2M8 13h5M14 15l6 6M20 15l-6 6"/>';
IC.cplk = '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>';
IC.cpdrag = '<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>';
const CP = { charge: false, html: "", t: null, sel: null };
const CP_POLICES = [["", "Police du site"], ["Calibri, Carlito, sans-serif", "Calibri"], ["Arial, Helvetica, sans-serif", "Arial"], ["'Times New Roman', Times, serif", "Times New Roman"], ["Georgia, serif", "Georgia"], ["Verdana, sans-serif", "Verdana"], ["'Courier New', monospace", "Courier New"], ["'Comic Sans MS', 'Comic Neue', cursive", "Comic Sans MS"]];
const CP_TAILLES = [10, 11, 12, 14, 16, 18, 20, 24, 28, 36];
const CP_COULEURS = ["#000000", "#5f6368", "#c5221f", "#e8710a", "#f9ab00", "#188038", "#1a73e8", "#174ea6", "#9334e6", "#ffffff"];
const CP_SURLIGN = ["#fff475", "#ccff90", "#a7ffeb", "#aecbfa", "#fdcfe8", "#ffd8a8", "transparent"];
/* --- nettoyage : seules les mises en forme simples sont gardées (pas de script, pas d'image) --- */
const CP_BALISES = new Set(["B", "STRONG", "I", "EM", "U", "S", "STRIKE", "SPAN", "FONT", "A", "UL", "OL", "LI", "DIV", "P", "BR", "H1", "H2", "H3", "BLOCKQUOTE", "SUB", "SUP"]);
const CP_STYLES = ["color", "background-color", "font-family", "font-size", "font-weight", "font-style", "text-decoration", "text-decoration-line", "text-align"];
function cpNettoyer(html){
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html"), racine = doc.body.firstChild;
  const net = n => { [...n.childNodes].forEach(c => {
    if (c.nodeType === 3) return;
    if (c.nodeType !== 1 || /^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED|IMG|SVG|MATH|LINK|META|FORM|INPUT|TEXTAREA|BUTTON|SELECT)$/.test(c.tagName)) { c.remove(); return; }
    if (!CP_BALISES.has(c.tagName)) { net(c); c.replaceWith(...c.childNodes); return; }
    const garde = {};
    if (c.tagName === "A") { const h = c.getAttribute("href") || ""; if (/^(https?:|mailto:)/i.test(h)) { garde.href = h; garde.target = "_blank"; garde.rel = "noopener"; } }
    if (c.tagName === "FONT") ["color", "face", "size"].forEach(a => { const v = c.getAttribute(a); if (v && /^[#\w\s,'"-]{1,80}$/.test(v)) garde[a] = v; });
    const st = []; CP_STYLES.forEach(p => { const v = c.style && c.style.getPropertyValue(p); if (v && !/url\(|expression|javascript/i.test(v)) st.push(`${p}:${v}`); });
    [...c.attributes].forEach(a => c.removeAttribute(a.name));
    Object.entries(garde).forEach(([k, v]) => c.setAttribute(k, v)); if (st.length) c.setAttribute("style", st.join(";"));
    net(c);
  }); };
  net(racine); return racine.innerHTML;
}
/* anciennes notes en texte brut → HTML */
const cpVersHtml = t => /<\/?(b|i|u|s|span|font|a|ul|ol|li|div|p|br|h[1-3]|strong|em)\b/i.test(t) ? cpNettoyer(t) : esc(t).replace(/\n/g, "<br>");
async function chargerCoinPerso(){
  if (CP.charge) return;
  let t = "";
  try { const r = await sb.from("notes_perso").select("contenu").eq("id", S.user.id).maybeSingle(); t = (r.data && r.data.contenu) || ""; } catch (_) {}
  try { const loc = localStorage.getItem("pp_coin_" + S.user.id); if (loc && !t) t = loc; } catch (_) {}
  CP.html = cpVersHtml(t); CP.charge = true;
}
const liensDe = t => [...new Set((String(t).match(/https?:\/\/[^\s<>"']+/g) || []).map(u => u.replace(/[).,;!?]+$/, "")))];
function majLiensCoin(){ const z = document.querySelector("#coinPerso .cpliens"), ed = document.querySelector("#coinPerso .cptxt"); if (!z || !ed) return;
  const L = [...new Set([...liensDe(ed.innerText), ...[...ed.querySelectorAll("a[href]")].map(a => a.getAttribute("href")).filter(h => /^https?:/i.test(h))])];
  z.innerHTML = L.length ? L.map(u => `<a href="${esc(u)}" target="_blank" rel="noopener">${icon("links")}<span>${esc(u.replace(/^https?:\/\/(www\.)?/, "").slice(0, 60))}</span></a>`).join("") : ""; z.hidden = !L.length; }
function etatCoin(t){ const e = document.querySelector("#coinPerso .cpetat"); if (e) e.textContent = t; }
async function sauverCoin(){
  clearTimeout(CP.t); CP.t = null;
  try { localStorage.setItem("pp_coin_" + S.user.id, CP.html); } catch (_) {}
  const { error } = await sb.from("notes_perso").upsert({ id: S.user.id, contenu: CP.html, modifie_le: now().toISOString() });
  etatCoin(error ? "Non enregistré en ligne (gardé sur cet appareil)" : "Enregistré ✓");
}
/* position et taille mémorisées sur l'appareil */
const cleGeo = () => "pp_coin_geo_" + (S.user && S.user.id);
function geoCoin(ov){
  if (window.innerWidth <= 600) return;
  let g = null; try { g = JSON.parse(localStorage.getItem(cleGeo()) || "null"); } catch (_) {}
  if (!g) return;
  const W = window.innerWidth, H = window.innerHeight;
  const w = Math.min(Math.max(g.w || 0, 300), W - 16), h = Math.min(Math.max(g.h || 0, 240), H - 16);
  ov.style.width = w + "px"; ov.style.height = h + "px";
  ov.style.left = Math.min(Math.max(g.x, 8 - w + 120), W - 120) + "px"; ov.style.top = Math.min(Math.max(g.y, 8), H - 60) + "px";
}
function memoGeo(ov){ if (window.innerWidth <= 600) return; const r = ov.getBoundingClientRect(); try { localStorage.setItem(cleGeo(), JSON.stringify({ x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) })); } catch (_) {} }
function deplacableCoin(ov){
  const poignee = ov.querySelector(".cphead");
  poignee.addEventListener("pointerdown", e => {
    if (e.button !== 0 || e.target.closest("button,select,input,a") || window.innerWidth <= 600) return;
    e.preventDefault(); const r = ov.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
    ov.classList.add("drag"); poignee.setPointerCapture(e.pointerId);
    const bouge = ev => { const W = window.innerWidth, H = window.innerHeight;
      ov.style.left = Math.min(Math.max(ev.clientX - dx, 8 - r.width + 120), W - 120) + "px"; ov.style.top = Math.min(Math.max(ev.clientY - dy, 8), H - 50) + "px"; };
    const fin = () => { ov.classList.remove("drag"); poignee.removeEventListener("pointermove", bouge); poignee.removeEventListener("pointerup", fin); poignee.removeEventListener("pointercancel", fin); memoGeo(ov); };
    poignee.addEventListener("pointermove", bouge); poignee.addEventListener("pointerup", fin); poignee.addEventListener("pointercancel", fin);
  });
  if (window.ResizeObserver) { let t = null; new ResizeObserver(() => { clearTimeout(t); t = setTimeout(() => { if (document.body.contains(ov)) memoGeo(ov); }, 300); }).observe(ov); }
}
/* barre d'outils */
const cpPalette = (k, cols) => `<div class="cppal" data-pal="${k}" hidden>${cols.map(c => `<button type="button" class="cpcol${c === "transparent" ? " aucune" : ""}" data-cpc="${k}" data-v="${c}" style="--v:${c}" title="${c === "transparent" ? "Aucune" : c}" aria-label="${c === "transparent" ? "Aucune couleur" : "Couleur " + c}"></button>`).join("")}</div>`;
function barreCoin(){
  const b = (cmd, ic, t) => `<button type="button" class="cpbtn" data-cmd="${cmd}" title="${t}" aria-label="${t}">${icon(ic)}</button>`;
  return `<div class="cpbar" role="toolbar" aria-label="Mise en forme">
    <select class="cpsel cppol" data-cpsel="police" aria-label="Police" title="Police">${CP_POLICES.map(([v, l]) => `<option value="${esc(v)}" style="font-family:${esc(v || "inherit")}">${l}</option>`).join("")}</select>
    <select class="cpsel cptai" data-cpsel="taille" aria-label="Taille" title="Taille">${CP_TAILLES.map(t => `<option value="${t}" ${t === 12 ? "selected" : ""}>${t}</option>`).join("")}</select>
    <span class="cpsep"></span>
    ${b("bold", "cpb", "Gras (Ctrl+B)")}${b("italic", "cpi", "Italique (Ctrl+I)")}${b("underline", "cpu", "Souligné (Ctrl+U)")}${b("strikeThrough", "cps", "Barré")}
    <span class="cpgrp"><button type="button" class="cpbtn cpcoul" data-pal-open="hl" title="Surligner" aria-label="Couleur de surlignage">${icon("cphl")}<i class="cpbar-c" style="background:#fff475"></i></button>${cpPalette("hl", CP_SURLIGN)}</span>
    <span class="cpgrp"><button type="button" class="cpbtn cpcoul" data-pal-open="fg" title="Couleur du texte" aria-label="Couleur du texte">${icon("cpa")}<i class="cpbar-c" style="background:#c5221f"></i></button>${cpPalette("fg", CP_COULEURS)}</span>
    ${b("lien", "cplk", "Insérer un lien")}
    <span class="cpsep"></span>
    ${b("insertUnorderedList", "cpul", "Liste à puces")}${b("insertOrderedList", "cpol", "Liste numérotée")}
    ${b("justifyLeft", "cpal", "Aligner à gauche")}${b("justifyCenter", "cpac", "Centrer")}${b("justifyRight", "cpar", "Aligner à droite")}
    ${b("removeFormat", "cpclr", "Effacer la mise en forme")}
  </div>
  <div class="cplienbox" hidden><input type="url" placeholder="https://…" aria-label="Adresse du lien"><button type="button" class="btn sm" data-cp="lienok">OK</button><button type="button" class="btn ghost sm" data-cp="lienno">Annuler</button></div>`;
}
function cpGarderSel(){ const s = window.getSelection(), ed = document.querySelector("#coinPerso .cptxt"); if (s && s.rangeCount && ed && ed.contains(s.anchorNode)) CP.sel = s.getRangeAt(0).cloneRange(); }
function cpRemettreSel(){ const ed = document.querySelector("#coinPerso .cptxt"); if (!ed) return; ed.focus(); if (CP.sel) { const s = window.getSelection(); s.removeAllRanges(); s.addRange(CP.sel); } }
function cpExec(cmd, val){ cpRemettreSel(); try { document.execCommand("styleWithCSS", false, true); } catch (_) {} document.execCommand(cmd, false, val); cpGarderSel(); cpModifie(); cpEtatBarre(); }
/* taille en points : on pose une taille repère (7) puis on la remplace par la vraie taille */
function cpTaille(pt){ cpRemettreSel(); try { document.execCommand("styleWithCSS", false, false); } catch (_) {} document.execCommand("fontSize", false, "7");
  const ed = document.querySelector("#coinPerso .cptxt"); ed.querySelectorAll('font[size="7"]').forEach(f => { f.removeAttribute("size"); f.style.fontSize = pt + "pt"; });
  ed.querySelectorAll("span").forEach(s => { if (s.style.fontSize === "xxx-large" || s.style.fontSize === "-webkit-xxx-large") s.style.fontSize = pt + "pt"; });
  cpGarderSel(); cpModifie(); }
function cpEtatBarre(){ const ov = document.getElementById("coinPerso"); if (!ov) return;
  ov.querySelectorAll(".cpbtn[data-cmd]").forEach(b => { let on = false; try { on = document.queryCommandState(b.dataset.cmd); } catch (_) {} b.classList.toggle("on", !!on); }); }
function cpModifie(){ const ed = document.querySelector("#coinPerso .cptxt"); if (!ed) return; CP.html = ed.innerHTML === "<br>" ? "" : ed.innerHTML; ed.classList.toggle("vide", !ed.textContent.trim() && !ed.querySelector("li")); etatCoin("Enregistrement…"); majLiensCoin(); clearTimeout(CP.t); CP.t = setTimeout(sauverCoin, 700); }
async function ouvrirCoinPerso(){
  let ov = document.getElementById("coinPerso");
  if (ov) { fermerCoinPerso(); return; }
  await chargerCoinPerso();
  ov = document.createElement("div"); ov.id = "coinPerso"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", "Coin Perso");
  ov.innerHTML = `<div class="cpgrip" title="Glisse pour changer la largeur" aria-hidden="true"></div><div class="cphead">${icon("note")}<b>Coin Perso</b><span class="cpetat">Enregistré ✓</span><button class="ib sm" data-cp="fermer" aria-label="Fermer le Coin Perso" title="Fermer">${icon("x")}</button></div>
    ${barreCoin()}
    <div class="cptxt" contenteditable="true" spellcheck="true" role="textbox" aria-multiline="true" aria-label="Notes du Coin Perso" data-ph="Écris ici ce que tu veux : remarques, idées, liens (https://…), listes… Tout s'enregistre tout seul. Toi seul vois ce coin."></div>
    <div class="cpliens" hidden></div>`;
  document.body.appendChild(ov); dockerCoin(ov);
  const ed = ov.querySelector(".cptxt"); ed.innerHTML = CP.html; ed.classList.toggle("vide", !ed.textContent.trim()); majLiensCoin();
  ed.addEventListener("input", cpModifie);
  ed.addEventListener("blur", () => { cpGarderSel(); if (CP.t) sauverCoin(); });
  ed.addEventListener("keyup", () => { cpGarderSel(); cpEtatBarre(); }); ed.addEventListener("mouseup", () => { cpGarderSel(); cpEtatBarre(); });
  ed.addEventListener("paste", e => { const h = e.clipboardData && e.clipboardData.getData("text/html"), t = e.clipboardData && e.clipboardData.getData("text/plain");
    e.preventDefault(); document.execCommand("insertHTML", false, h ? cpNettoyer(h) : esc(t || "").replace(/\n/g, "<br>")); });
  ed.addEventListener("click", e => { const a = e.target.closest("a[href]"); if (a && (e.ctrlKey || e.metaKey)) { e.preventDefault(); window.open(a.href, "_blank", "noopener"); } });
  /* boutons : on garde la sélection du texte (mousedown sans prendre le focus) */
  ov.querySelectorAll(".cpbar button").forEach(b => b.addEventListener("mousedown", e => e.preventDefault()));
  ov.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.cp === "fermer") { fermerCoinPerso(); return; }
    if (b.dataset.palOpen) { const p = ov.querySelector(`.cppal[data-pal="${b.dataset.palOpen}"]`), ouvert = !p.hidden; ov.querySelectorAll(".cppal").forEach(x => x.hidden = true); p.hidden = ouvert; return; }
    if (b.dataset.cpc) { const v = b.dataset.v; ov.querySelectorAll(".cppal").forEach(x => x.hidden = true);
      if (b.dataset.cpc === "fg") { cpExec("foreColor", v); ov.querySelector('[data-pal-open="fg"] .cpbar-c').style.background = v; }
      else { cpExec("hiliteColor", v); if (v !== "transparent") ov.querySelector('[data-pal-open="hl"] .cpbar-c').style.background = v; } return; }
    if (b.dataset.cmd === "lien") { const box = ov.querySelector(".cplienbox"); box.hidden = false; const i = box.querySelector("input"); i.value = "https://"; i.focus(); return; }
    if (b.dataset.cp === "lienok" || b.dataset.cp === "lienno") { const box = ov.querySelector(".cplienbox"), u = box.querySelector("input").value.trim(); box.hidden = true;
      if (b.dataset.cp === "lienok" && /^https?:\/\/\S+\.\S+/i.test(u)) { const s = CP.sel; if (s && !s.collapsed) cpExec("createLink", u); else { cpRemettreSel(); document.execCommand("insertHTML", false, `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(u)}</a>&nbsp;`); cpModifie(); } }
      else cpRemettreSel(); return; }
    if (b.dataset.cmd) cpExec(b.dataset.cmd);
  });
  ov.querySelector(".cplienbox input").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); ov.querySelector('[data-cp="lienok"]').click(); } if (e.key === "Escape") { e.stopPropagation(); ov.querySelector('[data-cp="lienno"]').click(); } });
  ov.querySelectorAll(".cpsel").forEach(s => s.addEventListener("change", () => {
    if (s.dataset.cpsel === "police") cpExec("fontName", s.value || getComputedStyle(document.body).fontFamily); else cpTaille(Number(s.value));
  }));
  document.addEventListener("mousedown", e => { if (!e.target.closest(".cpgrp")) ov.querySelectorAll(".cppal").forEach(x => x.hidden = true); });
  setTimeout(() => { ed.focus(); const s = window.getSelection(), r = document.createRange(); r.selectNodeContents(ed); r.collapse(false); s.removeAllRanges(); s.addRange(r); cpGarderSel(); }, 30);
  document.querySelectorAll('.drawer [data-act="coinperso"]').forEach(x => x.setAttribute("aria-current", "page"));
}
function fermerCoinPerso(){ const ov = document.getElementById("coinPerso"); if (!ov) return; if (CP.t) sauverCoin(); ov.remove(); document.documentElement.classList.remove("cp-open"); CP.sel = null; document.querySelectorAll('.drawer [data-act="coinperso"]').forEach(x => x.removeAttribute("aria-current")); }
window.addEventListener("beforeunload", () => { if (CP.t) { try { localStorage.setItem("pp_coin_" + S.user.id, CP.html); } catch (_) {} sauverCoin(); } });

/* ---------- Écran partagé : NumWorks, Pronote, ChatGPT, Claude, WhatsApp Web s'ouvrent à côté de la page ----------
   NumWorks et Pronote s'affichent dans le panneau. ChatGPT, Claude et WhatsApp interdisent l'affichage dans une autre
   page : ils s'ouvrent dans une fenêtre placée exactement sur le panneau (déplaçable et redimensionnable). */
const COTE_A_COTE = {
  "logo-numworks": { titre: "Calculatrice NumWorks", mode: "cadre" },
  "logo-pronote":  { titre: "Pronote", mode: "cadre", virtuel: 720 },
  "logo-chatgpt":  { titre: "ChatGPT", mode: "fenetre" },
  "logo-copilot":  { titre: "Copilot M365", mode: "fenetre" },
  "logo-gemini":   { titre: "Gemini", mode: "fenetre" },
  "logo-notebook": { titre: "Gemini Notebook", mode: "fenetre" },
  "logo-claude":   { titre: "Claude", mode: "fenetre" },
  "logo-youtube":  { titre: "YouTube", mode: "fenetre" },
  "logo-atena":    { titre: "Atena · AEFE", mode: "fenetre" },
  "logo-orion":    { titre: "Orion · AEFE", mode: "fenetre" },
  "logo-magistere":{ titre: "M@gistère", mode: "cadre" },
  "logo-calendrier":{ titre: "Calendrier dynamique 2026-2027", mode: "cadre", remplacer: true },
  "logo-whatsapp": { titre: "WhatsApp Web", mode: "fenetre" }
};
const SP = { cle: null, url: "", fen: null, veille: null };
const spGeo = () => { let g = {}; try { g = JSON.parse(localStorage.getItem("pp_side_geo") || "{}"); } catch (_) {} return { w: g.w || 460, cote: g.cote === "gauche" ? "gauche" : "droite" }; };
const spMemo = g => { try { localStorage.setItem("pp_side_geo", JSON.stringify(g)); } catch (_) {} };
function spAppliquer(){
  const p = document.getElementById("sidePanel"); if (!p) return;
  const g = spGeo(), w = Math.round(Math.min(Math.max(g.w, 300), window.innerWidth - 320));
  document.documentElement.style.setProperty("--side-w", w + "px");
  document.documentElement.classList.toggle("side-gauche", g.cote === "gauche"); document.documentElement.classList.toggle("side-droite", g.cote !== "gauche");
  spEchelle();
}
/* site trop large pour le panneau (Pronote) : on l'affiche à sa largeur normale, réduit pour tenir dans le cadre */
function spEchelle(){
  const v = document.querySelector("#sidePanel .sidevue[data-virtuel]"); if (!v) return; const f = v.querySelector("iframe");
  const W = v.clientWidth, H = v.clientHeight, V = Number(v.dataset.virtuel), k = Math.min(1, W / V);
  f.style.width = (k < 1 ? V : W) + "px"; f.style.height = (H / k) + "px"; f.style.transform = k < 1 ? `scale(${k})` : "";
}
function spFenetre(){
  const p = document.getElementById("sidePanel"); if (!p) return; const r = p.getBoundingClientRect();
  const bx = Math.max(0, (window.outerWidth - window.innerWidth) / 2), by = Math.max(0, window.outerHeight - window.innerHeight - bx);
  const f = `popup=yes,width=${Math.round(r.width)},height=${Math.round(r.height)},left=${Math.round(window.screenX + bx + r.left)},top=${Math.round(window.screenY + by + r.top)}`;
  SP.fen = window.open(SP.url, "pp_cote_" + SP.cle, f);
  clearInterval(SP.veille); SP.veille = setInterval(() => { if (!SP.fen || SP.fen.closed) fermerCote(); }, 1000);
}
function ouvrirCote(cle, url, nom){
  const o = COTE_A_COTE[cle]; if (!o) return false;
  if (SP.cle === cle && SP.url === url) { fermerCote(); return true; }
  fermerCote();
  SP.cle = cle; SP.url = url;
  const p = document.createElement("aside"); p.id = "sidePanel"; p.setAttribute("aria-label", o.titre); p.dataset.mode = o.mode;
  const logo = LOGOS_RAPIDES[cle] || "";
  p.innerHTML = `<div class="sidegrip" title="Glisse pour changer la largeur" aria-hidden="true"></div>
    <div class="sidehead">${logo ? `<img src="${esc(logo)}" alt="" width="22" height="22">` : ""}<b>${esc(o.titre || nom)}</b>
      ${o.remplacer && S.prof ? `<label class="ib sm" title="Remplacer le fichier Excel" style="cursor:pointer">${icon("upload")}<span class="pp-sr">Remplacer le fichier Excel</span><input type="file" accept=".xlsx,.xls" data-calfile="1" hidden></label>` : ""}
      <button class="ib sm" data-sp="cote" title="Mettre de l'autre côté" aria-label="Mettre le panneau de l'autre côté">${icon("swap")}</button>
      <a class="ib sm" href="${esc(o.lienExt || url)}" target="_blank" rel="noopener" title="Ouvrir dans un nouvel onglet" aria-label="Ouvrir dans un nouvel onglet">${icon("ext")}</a>
      <button class="ib sm" data-sp="fermer" title="Fermer" aria-label="Fermer ${esc(o.titre)}">${icon("x")}</button></div>
    ${o.mode === "televerser" ? `<div class="sidefen"><img src="logo-excel.png" alt="" width="64" height="64"><b>Aucun calendrier pour l'instant</b><p>Choisis le fichier Excel du calendrier dynamique : il sera rangé dans ton espace privé (invisible des élèves) et s'affichera ici.</p><label class="btn">${icon("upload")} Choisir le fichier Excel<input type="file" accept=".xlsx,.xls" data-calfile="1" hidden></label></div>` : ""}
    ${o.mode === "cadre" ? `<div class="sidevue"${o.virtuel ? ` data-virtuel="${o.virtuel}"` : ""}><iframe src="${esc(url)}" title="${esc(o.titre)}" allow="clipboard-read; clipboard-write; fullscreen; microphone; camera" referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`
      : `<div class="sidefen"><img src="${esc(logo)}" alt="" width="56" height="56"><b>${esc(o.titre)} s'ouvre dans une fenêtre placée ici.</b>
          <p>${esc(o.titre)} n'accepte pas d'être affiché à l'intérieur d'un autre site : il s'ouvre donc dans sa propre fenêtre, posée sur ce panneau. Tu peux la déplacer et la redimensionner librement.</p>
          <button class="btn" data-sp="replacer">${icon("ext")} Rouvrir / replacer la fenêtre ici</button>
          <small class="muted">Si rien ne s'ouvre, autorise les fenêtres pop-up pour ce site (icône à droite de la barre d'adresse).</small></div>`}
    <div class="sidevoile" hidden></div>`;
  document.body.appendChild(p); document.documentElement.classList.add("side-open"); spAppliquer();
  if (S.drawer && window.innerWidth - spGeo().w < 1000) { S.drawer = false; render(); }
  p.addEventListener("click", e => { const b = e.target.closest("[data-sp]"); if (!b) return;
    if (b.dataset.sp === "fermer") fermerCote();
    else if (b.dataset.sp === "cote") { const g = spGeo(); g.cote = g.cote === "gauche" ? "droite" : "gauche"; spMemo(g); spAppliquer(); if (o.mode === "fenetre") spFenetre(); }
    else if (b.dataset.sp === "replacer") spFenetre(); });
  /* largeur : on tire la bordure du panneau ; la page se resserre d'autant */
  const grip = p.querySelector(".sidegrip"), voile = p.querySelector(".sidevoile");
  grip.addEventListener("pointerdown", e => { e.preventDefault(); grip.setPointerCapture(e.pointerId); voile.hidden = false; document.documentElement.classList.add("side-drag");
    const bouge = ev => { const g = spGeo(); g.w = g.cote === "gauche" ? ev.clientX : window.innerWidth - ev.clientX; g.w = Math.min(Math.max(g.w, 300), window.innerWidth - 320); spMemo(g); spAppliquer(); };
    const fin = () => { voile.hidden = true; document.documentElement.classList.remove("side-drag"); grip.removeEventListener("pointermove", bouge); grip.removeEventListener("pointerup", fin); grip.removeEventListener("pointercancel", fin); if (o.mode === "fenetre") spFenetre(); };
    grip.addEventListener("pointermove", bouge); grip.addEventListener("pointerup", fin); grip.addEventListener("pointercancel", fin); });
  if (o.mode === "fenetre") spFenetre();
  document.querySelectorAll("a.qside").forEach(a => a.classList.toggle("on", a.dataset.cle === cle));
  return true;
}
function fermerCote(){
  clearInterval(SP.veille); SP.veille = null;
  if (SP.fen && !SP.fen.closed) { try { SP.fen.close(); } catch (_) {} } SP.fen = null;
  const p = document.getElementById("sidePanel"); if (p) p.remove(); SP.cle = null;
  document.documentElement.classList.remove("side-open", "side-gauche", "side-droite");
  document.querySelectorAll("a.qside").forEach(a => a.classList.remove("on"));
}
window.addEventListener("resize", () => { if (document.getElementById("sidePanel")) { if (window.innerWidth <= 760) fermerCote(); else spAppliquer(); } });
document.addEventListener("click", e => { const a = e.target.closest && e.target.closest("a.qside"); if (!a || a.dataset.cle === "logo-calendrier" || (COTE_A_COTE[a.dataset.cle] || {}).mode === "fenetre" || e.ctrlKey || e.metaKey || e.shiftKey || e.button) return;
  if (window.innerWidth <= 760) return; e.preventDefault(); e.stopPropagation(); ouvrirCote(a.dataset.cle, a.getAttribute("href"), a.textContent.trim()); }, true);

/* Coin Perso ancré à droite, sur toute la hauteur : la page se resserre, rien n'est caché */
const cpLargeur = () => { let w = 400; try { w = Number(localStorage.getItem("pp_cp_w")) || 400; } catch (_) {} return Math.round(Math.min(Math.max(w, 280), Math.max(300, window.innerWidth - 360))); };
function appliquerLargeurCoin(){ document.documentElement.style.setProperty("--cp-w", cpLargeur() + "px"); }
function dockerCoin(ov){
  appliquerLargeurCoin(); document.documentElement.classList.add("cp-open");
  if (window.innerWidth > 600 && S.drawer && window.innerWidth - cpLargeur() - (document.getElementById("sidePanel") ? spGeo().w : 0) < 1000) { S.drawer = false; render(); }
  const grip = ov.querySelector(".cpgrip");
  grip.addEventListener("pointerdown", e => { e.preventDefault(); grip.setPointerCapture(e.pointerId); document.documentElement.classList.add("side-drag");
    const bord = ov.getBoundingClientRect().right;
    const bouge = ev => { const w = Math.min(Math.max(bord - ev.clientX, 280), window.innerWidth - 360); try { localStorage.setItem("pp_cp_w", Math.round(w)); } catch (_) {} appliquerLargeurCoin(); };
    const fin = () => { document.documentElement.classList.remove("side-drag"); grip.removeEventListener("pointermove", bouge); grip.removeEventListener("pointerup", fin); grip.removeEventListener("pointercancel", fin); };
    grip.addEventListener("pointermove", bouge); grip.addEventListener("pointerup", fin); grip.addEventListener("pointercancel", fin); });
}
window.addEventListener("resize", () => { if (document.getElementById("coinPerso")) appliquerLargeurCoin(); });
