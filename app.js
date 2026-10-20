/* =====================================================================
   PhysiquePro · application
   Organisation : 01 noyau · 02 coque · 03 classe · 04 devoirs · 05 éditeurs
                  06 questionnaires · 07 paramètres · 08 fenêtres · 09 événements
   ===================================================================== */
(function () {
"use strict";
const CFG = window.PHYSIQUEPRO;
const app = document.getElementById("app");

/* ---------- utilitaires ---------- */
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const now = () => new Date();
const D = s => new Date(s);
const fmtD = d => d.toLocaleDateString("fr-FR", {weekday:"long", day:"numeric", month:"long"});
const fmtShort = d => d.toLocaleDateString("fr-FR", {day:"numeric", month:"short"});
const fmtT = d => d.toLocaleTimeString("fr-FR", {hour:"2-digit", minute:"2-digit"});
const fmtQuand = d => sameDay(d, now()) ? fmtT(d) : fmtShort(d) + (d.getFullYear() !== now().getFullYear() ? " " + d.getFullYear() : "");
const fmtNote = n => n == null || n === "" ? "" : String(Math.round(Number(n) * 100) / 100).replace(".", ",");
const sameDay = (a, b) => a.toDateString() === b.toDateString();
const initials = n => String(n || "?").split(/[\s.\-]+/).filter(Boolean).map(x => x[0]).join("").slice(0, 2).toUpperCase();
const nomDepuisEmail = e => String(e || "").split("@")[0].replace(/^lv\./i, "").split(".").map(x => x.split("-").map(y => y.charAt(0).toUpperCase() + y.slice(1)).join("-")).join(" ");
const dueTxt = d => {
  const t = now(); if (sameDay(d, t)) return "Aujourd'hui, " + fmtT(d);
  const y = new Date(t); y.setDate(t.getDate() + 1); if (sameDay(d, y)) return "Demain, " + fmtT(d);
  return "Échéance : " + fmtD(d) + ", " + fmtT(d);
};
const ouvert = d => !d.date_limite || D(d.date_limite) > now();
const depotOuvert = d => d.accepte !== false && (ouvert(d) || !!d.retard_ok);
const enRetard = (d, r) => !!(r && d.date_limite && D(r.rendu_le) > D(d.date_limite));
const dueOf = d => d.date_limite ? dueTxt(D(d.date_limite)) : "Aucune date limite";
const pts = d => d.points == null ? "Non noté" : d.points + " points";
const pad = n => String(n).padStart(2, "0");
const ymd = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
const hm = d => pad(d.getHours()) + ":" + pad(d.getMinutes());
let toastT;
const toast = m => { const t = document.getElementById("toast"); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 3500); };

const IC = {
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>', home:'<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>',
  cal:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  todo:'<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>',
  check:'<path d="M5 12l5 5 9-10"/>', tools:'<path d="M14 6a4 4 0 0 0 5 5l-8 8a2 2 0 0 1-3-3z"/><path d="M5 5l4 4"/>',
  links:'<path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1"/><path d="M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1"/>',
  devoir:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  support:'<rect x="6" y="4" width="12" height="16" rx="1.5"/><path d="M10 4v6l2-1.5 2 1.5V4"/>',
  quiz:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8.5 8l1 1 2-2M8.5 13l1 1 2-2M13.5 8.5h2M13.5 13.5h2"/>',
  folder:'<path d="M3 7h6l2 2h10v10H3z"/>', grade:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  left:'<path d="M15 6l-6 6 6 6"/>', right:'<path d="M9 6l6 6-6 6"/>', x:'<path d="M6 6l12 12M18 6L6 18"/>',
  mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>', logout:'<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
  plus:'<path d="M12 5v14M5 12h14"/>', more:'<circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/>',
  theme:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M8 10v9"/>', edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  trash:'<path d="M5 7h14M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>', up:'<path d="M12 19V5M6 11l6-6 6 6"/>', down:'<path d="M12 5v14M6 13l6 6 6-6"/>',
  upload:'<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>', ecole:'<path d="M3 10l9-5 9 5-9 5z"/><path d="M7 12v5c3 2 7 2 10 0v-5"/>',
  nuage:'<path d="M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 9a4.5 4.5 0 0 0 1 9z"/>',
  copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  key:'<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7 7 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z"/>',
  video:'<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/>', archive:'<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v11h14V9M10 13h4"/>',
  restore:'<path d="M4 12a8 8 0 1 0 3-6.2"/><path d="M4 4v4h4"/>', send:'<path d="M4 12l16-8-6 16-2-7z"/>', comment:'<path d="M4 5h16v11H9l-5 4z"/>',
  people:'<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14c2.8 0 5 2.2 5 5"/>',
  chevup:'<path d="M6 15l6-6 6 6"/>',
  chevdown:'<path d="M6 9l6 6 6-6"/>',
  reuse:'<path d="M17 2l4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  file:'<path d="M6 3h8l4 4v14H6z"/>', expand:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>', eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'
};
IC.bell = '<path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>';
IC.question = '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.4c-.6.3-1 .8-1 1.5v.6M12 17.2v.1"/>';
IC.invite = '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5M19 8v6M16 11h6"/>';
/* illustrations des bandeaux (dessins au trait, propres à PhysiquePro) */
const ARTS = {
  labo: '<path d="M70 8h18M74 8v26L58 66a6 6 0 0 0 5 9h32a6 6 0 0 0 5-9L84 34V8"/><path d="M63 56h32"/><circle cx="72" cy="64" r="2.5"/><circle cx="83" cy="60" r="1.8"/><ellipse cx="128" cy="40" rx="26" ry="10"/><ellipse cx="128" cy="40" rx="26" ry="10" transform="rotate(60 128 40)"/><ellipse cx="128" cy="40" rx="26" ry="10" transform="rotate(-60 128 40)"/><circle cx="128" cy="40" r="3.5"/>',
  code: '<path d="M62 22l-16 18 16 18M98 22l16 18-16 18M86 14L74 66"/><rect x="124" y="14" width="40" height="52" rx="5"/><path d="M132 26h24M132 36h16M132 46h22M132 56h10"/>',
  engrenages: '<circle cx="80" cy="40" r="17"/><circle cx="80" cy="40" r="6"/><path d="M80 15v-6M80 71v-6M55 40h-6M111 40h-6M62 22l-4-4M102 62l-4-4M62 58l-4 4M102 18l-4 4"/><circle cx="134" cy="28" r="11"/><circle cx="134" cy="28" r="4"/><path d="M134 13v-4M134 47v-4M119 28h-4M153 28h-4M124 18l-3-3M147 41l-3-3M124 38l-3 3M147 15l-3 3"/>',
  regle: '<path d="M50 62L106 6l14 14-56 56z"/><path d="M62 50l6 6M72 40l4 4M82 30l6 6M92 20l4 4"/><path d="M140 12l-16 58M140 12l16 58M131 46h18"/><circle cx="140" cy="12" r="3"/>',
  reseau: '<circle cx="62" cy="20" r="6"/><circle cx="100" cy="44" r="8"/><circle cx="62" cy="66" r="6"/><circle cx="142" cy="20" r="6"/><circle cx="146" cy="62" r="6"/><path d="M67 23l26 16M67 63l26-14M107 40l29-17M108 48l32 12"/>',
  livres: '<rect x="54" y="14" width="14" height="56" rx="2"/><rect x="70" y="20" width="14" height="50" rx="2"/><path d="M90 24l13-4 14 48-13 4z"/><path d="M130 22h30v48h-30zM136 34h18M136 44h18M136 54h10"/>'
};
const ART_NOMS = [["auto", "Selon la couleur"], ["labo", "Laboratoire"], ["code", "Programmation"], ["engrenages", "Engrenages"], ["regle", "Géométrie"], ["reseau", "Réseau"], ["livres", "Livres"], ["aucune", "Aucune (lettres)"]];
const artDe = c => { const k = c.illustration && c.illustration !== "auto" ? c.illustration : ({pc:"labo", snt:"code", si:"engrenages", tech:"regle", pix:"reseau"})[c.couleur] || "livres"; return k === "aucune" ? null : ARTS[k] ? k : null; };
const bannerArt = c => { const k = artDe(c); return k ? `<svg class="art" viewBox="0 0 170 80" aria-hidden="true">${ARTS[k]}</svg>` : `<span class="sym">${esc(c.symbole)}</span>`; };
const icon = (k, cls = "i") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${IC[k] || IC.links}</svg>`;
const logoSVG = `<svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true"><rect x="1" y="1" width="28" height="28" rx="6" fill="none" stroke="var(--accent)" stroke-width="2"/><path d="M6 20 Q10 6 15 15 T24 10" fill="none" stroke="var(--accent)" stroke-width="2.2" stroke-linecap="round"/><circle cx="24" cy="10" r="2.4" fill="var(--accent)"/></svg>`;
const LOGOS = window.PP_LOGOS || {};
const logos = `<span class="logos">${LOGOS.lfl ? `<img src="${LOGOS.lfl}" alt="Lycée franco-libanais Verdun">` : ""}${LOGOS.mlf ? `<img src="${LOGOS.mlf}" alt="Réseau mlfmonde">` : ""}</span>`;
const C = k => ({c:"--" + (k || "pc"), b:"--b-" + (k || "pc")});

/* texte mis en forme : on ne garde que des balises sûres */
function rich(html){
  if (!html) return "";
  if (!/[<>]/.test(html) || typeof DOMParser === "undefined") return esc(html).replace(/\n/g, "<br>");
  const root = new DOMParser().parseFromString("<div>" + html + "</div>", "text/html").body.firstChild;
  const ok = new Set(["B","STRONG","I","EM","U","UL","OL","LI","BR","P","DIV","SUP","SUB"]);
  [...root.querySelectorAll("*")].reverse().forEach(el => {
    if (["SCRIPT","STYLE","IFRAME","OBJECT"].includes(el.tagName)) el.remove();
    else if (!ok.has(el.tagName)) el.replaceWith(...el.childNodes);
    else [...el.attributes].forEach(a => el.removeAttribute(a.name));
  });
  return root.innerHTML;
}
/* notation scientifique dans le texte simple : 10^-3, x^{2n}, H_2O, CO_{2} */
const sci = t => esc(t).replace(/\^\{([^}]{1,12})\}/g, "<sup>$1</sup>").replace(/\^(-?[\w.]{1,6})/g, "<sup>$1</sup>").replace(/_\{([^}]{1,12})\}/g, "<sub>$1</sub>").replace(/([A-Za-z\)])_([0-9]{1,3}|[a-z]{1,3})/g, "$1<sub>$2</sub>");
const SYMBOLES = ["Δ","√","×","·","÷","±","≈","≠","≤","≥","→","⇌","⟶","°","µ","λ","Ω","π","θ","α","β","γ","ε","ρ","σ","τ","φ","ω","∞","∑","∫","²","³","⁻¹","⁻","⁺","₀","₁","₂","₃","₄","‰","℃","Å"];
const paletteSymb = () => `<div class="symbs" role="toolbar" aria-label="Symboles scientifiques">${SYMBOLES.map(x => `<button class="sym" data-act="ins" data-s="${x}" data-keepfocus="1" title="Insérer ${x}">${x}</button>`).join("")}<span class="muted" style="font-size:.78rem;padding:0 6px">Astuce : dans les questions, écris 10^-3 ou H_2O</span></div>`;
const linkify = t => esc(t).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>').replace(/\n/g, "<br>");

/* ---------- Supabase ---------- */
if (!window.supabase) { app.innerHTML = `<div class="loading"><div class="notice">Impossible de charger PhysiquePro. Vérifie ta connexion Internet puis recharge la page.</div></div>`; return; }
const sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey, { auth: { flowType: "pkce", detectSessionInUrl: true, persistSession: true } });
const ICI = location.origin + location.pathname;

/* ---------- réglages du site (modifiables dans Administration) ---------- */
const COULEURS = [["pc","Bleu"],["snt","Vert"],["si","Rouge"],["tech","Ocre"],["pix","Bleu pétrole"]];
const ICONES = [["logo-pronote","Logo Pronote"],["logo-lycee","Logo Lycée Verdun"],["logo-pix","Logo PIX"],["logo-outlook","Logo Outlook"],["logo-onedrive","Logo OneDrive"],["logo-pixorga","Logo PIX Orga"],["logo-whatsapp","Logo WhatsApp"],["logo-claude","Logo Claude"],["logo-chatgpt","Logo ChatGPT"],["logo-numworks","Logo NumWorks (calculatrice)"],["logo-copilot","Logo Copilot M365"],["logo-gemini","Logo Gemini"],["logo-notebook","Logo Gemini Notebook"],["logo-youtube","Logo YouTube"],["logo-atena","Logo Atena"],["logo-orion","Logo Orion"],["logo-magistere","Logo Magistère"],["logo-calendrier","Logo Excel (calendrier)"],["pronote","Pronote (P)"],["pix","PIX"],["ecole","École"],["mail","E-mail"],["nuage","Nuage (OneDrive)"],["links","Lien"],["video","Vidéo"],["cal","Calendrier"],["folder","Dossier"],["tools","Outil"]];
const clone = o => JSON.parse(JSON.stringify(o));
function appliquerReglages(d){
  d = d || {};
  S.R = {
    prof: { nom: (d.prof && d.prof.nom) || CFG.prof.nom, titre: (d.prof && d.prof.titre != null) ? d.prof.titre : CFG.prof.titre, email: CFG.prof.email },
    liensUtiles: Array.isArray(d.liensUtiles) ? d.liensUtiles : CFG.liensUtiles,
    outils: Array.isArray(d.outils) ? d.outils : CFG.outils,
    onedrive: !!d.onedrive,
    preparateur: typeof d.preparateur === "string" ? d.preparateur : "",
    simulations: Array.isArray(d.simulations) ? d.simulations : [],
    pratique: d.pratique && typeof d.pratique === "object" && !Array.isArray(d.pratique) ? d.pratique : {},
    remarques: Array.isArray(d.remarques) ? d.remarques : ["Très bon travail.", "Attention aux unités.", "Chiffres significatifs à revoir.", "Justifie davantage ton raisonnement.", "Schéma incomplet ou non légendé.", "Relis la consigne.", "Bon raisonnement, mais erreur de calcul."]
  };
}
const R = () => S.R;
const reglagesData = () => ({ prof: { nom: R().prof.nom, titre: R().prof.titre }, liensUtiles: R().liensUtiles, outils: R().outils, remarques: R().remarques, onedrive: R().onedrive, preparateur: R().preparateur || "", simulations: R().simulations || [], pratique: R().pratique || {} });

/* ---------- état ---------- */
const S = {
  user:null, profil:null, prof:false, nom:"",
  classes:[], devoirs:[], rendus:[], corrections:[], quiz:[], resultats:[], profils:{}, nbEleves:{},
  cache:{},
  drawer: window.innerWidth >= 1100, dd:false, me:false, menu:null, open:null, todoTab:"attribues", week:0,
  pick:new Set(), compose:false, cSub:"", cBody:"", modal:null, ed:null, sel:null, ptab:"travaux",
  R:null, adm:null, admTab:"site", admQ:"", recent:false, files:[], lien:"", partenaire:"", quizRep:{}, quizRes:{}, annonce:null, filtreTheme:"", reduits:new Set(), settings:null
};
appliquerReglages();
const route = () => { const h = location.hash.replace(/^#\/?/, "").split("/").map(decodeURIComponent); return {v: h[0] || "accueil", a: h[1] || null, t: h[2] || null, x: h[3] || null}; };
const go = hash => { location.hash = hash; };

/* ---------- chargement des données ---------- */
async function chargerTout(){
  const reqs = [
    sb.from("classes").select("*").order("ordre"),
    sb.from("devoirs").select("*").order("date_limite", {ascending:true, nullsFirst:false}),
    sb.from("rendus").select("*"),
    sb.from("corrections").select("*"),
    sb.from("quiz").select("*"),
    sb.from("resultats_quiz").select("quiz_id, eleve, score, sur, fait_le")
  ];
  if (S.prof) reqs.push(sb.from("inscriptions").select("classe_id, email, nom"), sb.from("profiles").select("id, email, nom, role, cree_le, derniere_visite"));
  const [res, reg] = await Promise.all([Promise.all(reqs), sb.from("reglages").select("data").eq("id", 1).maybeSingle()]);
  appliquerReglages(reg && !reg.error && reg.data ? reg.data.data : null);
  for (const r of res) if (r.error) throw r.error;
  [S.classes, S.devoirs, S.rendus, S.corrections, S.quiz, S.resultats] = res.slice(0, 6).map(r => r.data);
  try { const cp = await sb.from("copies").select("*"); S.copies = cp.error ? [] : cp.data; } catch (_) { S.copies = []; }
  await chargerUrgents();
  if (S.prof) {
    S.nbEleves = {}; S.toutesInscriptions = res[6].data;
    res[6].data.forEach(x => S.nbEleves[x.classe_id] = (S.nbEleves[x.classe_id] || 0) + 1);
    S.profils = {}; S.comptes = res[7].data; res[7].data.forEach(p => S.profils[p.id] = p.email);
  }
}
async function chargerClasse(id, force){
  if (S.cache[id] && !force) return S.cache[id];
  const [th, su, ins, an] = await Promise.all([
    sb.from("themes").select("*").eq("classe_id", id).order("ordre"),
    sb.from("supports").select("*").eq("classe_id", id).order("publie_le", {ascending:false}),
    sb.from("inscriptions").select("email, nom").eq("classe_id", id).order("nom"),
    sb.from("annonces").select("*").eq("classe_id", id).order("cree_le", {ascending:false})
  ]);
  for (const r of [th, su, ins]) if (r.error) throw r.error;
  const annonces = an.error ? [] : an.data;
  let coms = [];
  if (annonces.length) { const r = await sb.from("commentaires").select("*").in("annonce_id", annonces.map(a => a.id)).order("cree_le"); if (!r.error) coms = r.data; }
  return S.cache[id] = { themes: th.data, supports: su.data, eleves: ins.data, annonces, coms };
}
async function rafraichir(classe){ if (classe) delete S.cache[classe]; else S.cache = {}; await chargerTout(); }

/* ---------- logique ---------- */
const cls = id => S.classes.find(c => c.id === id);
/* ordre des cours : celui du prof (base de données) ; un élève peut avoir son propre ordre (gardé sur son appareil) */
function ordreEleve(){ try { return JSON.parse(localStorage.getItem("pp_ordre_" + (S.user && S.user.id)) || "[]"); } catch (_) { return []; } }
const actives = () => { const l = S.classes.filter(c => !c.archive); if (S.prof) return l; const o = ordreEleve(); if (!o.length) return l;
  const rang = id => { const i = o.indexOf(id); return i < 0 ? 1e6 : i; }; return l.slice().sort((a, b) => rang(a.id) - rang(b.id)); };
const moi = () => S.profil.email;
const renduDe = (d, email) => S.rendus.find(r => r.devoir_id === d.id && (r.auteur_email === email || r.binome_email === email));
const correctionDe = r => r && S.corrections.find(c => c.rendu_id === r.id);
const rendusDe = d => S.rendus.filter(r => r.devoir_id === d.id);
const aCorriger = d => rendusDe(d).filter(r => !(correctionDe(r) || {}).publiee).length;
const elevesDuDevoir = (d, liste) => d.eleves ? liste.filter(e => d.eleves.includes(e.email)) : liste;
const inscritsDe = cid => (S.cache[cid] && S.cache[cid].eleves) || (S.toutesInscriptions || []).filter(x => x.classe_id === cid);
function etat(d, email){
  const r = renduDe(d, email), c = correctionDe(r);
  if (r && c && c.publiee) return {t:"Noté", k:"ok", note:c.note, r, c, retard:enRetard(d, r)};
  if (r) return {t:"Rendu", k:"info", r, c, retard:enRetard(d, r)};
  return !ouvert(d) ? {t:"Manquant", k:"bad"} : {t:"Attribué", k:""};
}
const resultatDe = (q, uid) => S.resultats.find(x => x.quiz_id === q.id && x.eleve === uid);
const noteQuiz = (q, r) => r ? Math.round(r.score / Math.max(1, r.sur) * (q.points || 20) * 100) / 100 : null;
/* ---------- connexion ---------- */
function vLogin(message, info){
  app.innerHTML = `<div class="login"><div class="card">
    <div class="brand" style="cursor:default;padding:0">${logoSVG}<span class="brandtx"><b>Physique<span>Pro</span></b><small>site de M. ${esc(R().prof.nom)}</small></span></div>
    <div><h2 style="font-size:1.4rem">Connexion</h2><p class="muted" style="margin:.3rem 0 0">Utilise ton compte Microsoft 365 du lycée.</p></div>
    ${message ? `<div class="${info ? "notice" : "err"}">${message}</div>` : ""}
    <div class="field"><label for="mail">Adresse Microsoft 365</label><input id="mail" type="email" placeholder="${esc(CFG.prefixeEleve ?? "lv.")}prenom.nom@${esc(CFG.domaine)}" autocomplete="username"></div>
    <div id="mailErr" class="err" hidden></div>
    <button class="btn" id="loginBtn">Se connecter</button>
    <p class="muted" style="margin:0;font-size:.82rem">Tu passeras par la page Microsoft habituelle pour taper ton mot de passe, puis tu reviendras ici.</p>
    ${logos.replace('class="logos"', 'class="logos" style="justify-content:center;border-top:1px solid var(--line);padding-top:14px"')}
    ${S.public ? `<a href="#/" data-act="pubretour" class="linkbtn" style="justify-self:center">${icon("left")} Retour à l'accueil</a>` : ""}
  </div></div>`;
  const btn = document.getElementById("loginBtn"), inp = document.getElementById("mail");
  const lancer = async () => {
    const m = inp.value.trim().toLowerCase(), err = document.getElementById("mailErr");
    if (m && !m.endsWith("@" + CFG.domaine)) { err.hidden = false; err.textContent = "Cette adresse n'appartient pas au lycée. Utilise ton adresse en @" + CFG.domaine + "."; return; }
    btn.disabled = true; btn.textContent = "Redirection vers Microsoft…";
    try { localStorage.setItem("pp_fresh", "1"); } catch (_) {}
    const { error } = await sb.auth.signInWithOAuth({ provider: "azure", options: { scopes: "openid email profile", redirectTo: ICI, queryParams: m ? { login_hint: m } : { prompt: "select_account" } } });
    if (error) { btn.disabled = false; btn.textContent = "Se connecter"; err.hidden = false; err.textContent = "La connexion n'a pas pu démarrer : " + error.message; }
  };
  btn.onclick = lancer; inp.onkeydown = e => { if (e.key === "Enter") lancer(); };
}
const messageErreur = desc => /Database error saving new user|non autoris/i.test(desc) ? "Cette adresse n'est pas autorisée : seules les adresses @" + esc(CFG.domaine) + " peuvent se connecter." : "La connexion a échoué : " + esc(desc);

/* ---------- barre du haut ---------- */
const LOGOS_RAPIDES = { "logo-pronote": "logo-pronote.png", "logo-lycee": "logo-lycee.png?v=2", "logo-pix": "logo-pix.png", "logo-outlook": "logo-outlook.png", "logo-onedrive": "logo-onedrive.png", "logo-pixorga": "logo-pixorga.svg", "logo-whatsapp": "logo-whatsapp.png", "logo-claude": "logo-claude.png", "logo-chatgpt": "logo-chatgpt.png", "logo-numworks": "logo-numworks.png", "logo-copilot": "logo-copilot.png", "logo-gemini": "logo-gemini.svg", "logo-notebook": "logo-notebook.svg", "logo-youtube": "logo-youtube.png", "logo-atena": "logo-atena.png", "logo-orion": "logo-orion.png", "logo-magistere": "logo-magistere.png", "logo-calendrier": "logo-excel.png" };
function quickIcon(k){
  if (LOGOS_RAPIDES[k]) return `<img class="qlogo" src="${LOGOS_RAPIDES[k]}" alt="">`;
  if (k === "pronote") return `<b class="qp">P</b>`;
  if (k === "pix") return `<b class="qp" style="font-size:.72rem;letter-spacing:.02em">PIX</b>`;
  return icon(k === "ecole" ? "ecole" : k === "mail" ? "mail" : k === "nuage" ? "nuage" : "links");
}
function topbar(r){
  let crumb = "";
  const c = r.v === "classe" ? cls(r.a) : r.v === "devoir" ? cls((S.devoirs.find(d => String(d.id) === r.a) || {}).classe_id) : r.v === "quiz" ? cls((S.quiz.find(q => String(q.id) === r.a) || {}).classe_id) : null;
  if (c) crumb = `<span class="sep">›</span><a class="cur" href="#/classe/${esc(c.id)}" style="color:inherit;text-decoration:none" title="${esc(c.nom)}"><span class="curnom">${esc(c.nom)}</span><small>${esc(c.section)}</small></a>`;
  return `<header class="topbar">
    <button class="ib menubtn" data-act="drawer" aria-label="Menu principal">${icon("menu")}${nbUrgents() ? `<span class="badge urgdot">${nbUrgents()}</span>` : ""}</button>
    <div class="crumbs"><a class="brand" href="#/" style="text-decoration:none;color:inherit">${logoSVG}<span class="brandtx"><b>Physique<span>Pro</span></b><small>site de M. ${esc(R().prof.nom)}</small></span></a>${crumb}</div>
    <span class="spacer topmid"><img class="toplogo" src="logo-verdun-haut.png?v=2" alt="Lycée franco-libanais Verdun" width="81" height="48"></span>
    ${(() => { const L = liensFavoris(); return `<nav class="quick${L.length > 12 ? " deux" : ""}" style="--qc:${Math.min(12, Math.ceil(L.length / 2))}" aria-label="Liens rapides favoris">${L.map(lienRapide).join("")}</nav>`; })()}
    ${lanceurApps()}
    ${cloche()}
    <div class="dd ddplus"><button class="ib" data-act="dd" title="${S.prof ? "Créer un cours" : "Rejoindre un cours"}" aria-label="${S.prof ? "Créer un cours" : "Rejoindre un cours"}" aria-expanded="${S.dd}">${icon("plus")}</button>
      ${S.dd ? `<div class="dd-menu"><a href="#" data-act="${S.prof ? "newclass" : "join"}">${icon("plus")} ${S.prof ? "Créer un cours" : "Rejoindre un cours"}</a></div>` : ""}</div>
    <div class="dd"><button class="avatar" data-act="me" title="${esc(S.nom)}" style="border:0;cursor:pointer">${initials(S.nom)}</button>
      ${S.me ? `<div class="dd-menu"><div style="padding:8px 10px"><b>${esc(S.nom)}</b><br><small class="muted">${esc(moi())}</small></div>${menuApparence()}${lienInstall()}<a href="#" data-act="logout">${icon("logout")} Se déconnecter</a></div>` : ""}</div>
  </header>`;
}
function drawer(r){
  const cur = v => r.v === v ? 'aria-current="page"' : "";
  const arch = S.classes.some(c => c.archive);
  return `<nav class="drawer" ${S.drawer ? "" : "hidden"} aria-label="Menu principal">
    <a class="it" href="#/" ${cur("accueil")}>${icon("home")}<span class="lbl">Accueil</span></a>
    <a class="it" href="#/agenda" ${cur("agenda")}>${icon("cal")}<span class="lbl">Agenda</span></a>
    <a class="it" href="#/semaine" ${cur("semaine")}>${icon("week")}<span class="lbl">Ma semaine</span></a>
    <a class="it coinit" href="#" data-act="coinperso" ${document.getElementById("coinPerso") ? 'aria-current="page"' : ""}>${icon("note")}<span class="lbl">Coin Perso</span></a>
    <hr>
    ${S.prof ? "" : `<a class="it" href="#/todo" ${cur("todo")}>${icon("todo")}<span class="lbl">À faire</span></a>`}
    ${S.prof ? `<a class="it" href="#/suivi" ${cur("suivi")}>${icon("grade")}<span class="lbl">Suivi des élèves</span></a><a class="it${nbUrgents() ? " actif" : ""}" href="#/urgences" ${cur("urgences")}><span class="urgico">${icon("urgent")}${nbUrgents() ? `<b class="urgn" title="${nbUrgents()} message(s) non lu(s)">${nbUrgents() > 99 ? "99+" : nbUrgents()}</b>` : ""}</span><span class="lbl urglbl">Messagerie d'urgence</span></a><a class="it" href="#/preparateur" ${cur("preparateur")}>${icon("flask")}<span class="lbl lbl2">Demande de matériel au Préparateur de Labo</span></a>` : ""}
    ${S.prof ? "" : (() => { const cs = actives(), rc = route(), cc = rc.v === "classe" && cls(rc.a) ? rc.a : (cs.length === 1 ? cs[0].id : ""), n = reponsesNonVues(); return cs.length ? `<a class="it urgeleve${n ? " actif" : ""}" href="#" data-act="${cc ? "urgent" : "urgchoix"}" data-c="${esc(cc)}">${icon("urgent")}<span class="lbl lbl2">Message urgent à ${esc(nomProfCourt())}${supUrg(n)}</span></a>${statutProf()}` : ""; })()}
    <a class="it" href="#/rendezvous" ${cur("rendezvous")}>${icon("rdv")}<span class="lbl lbl2">${S.prof ? "Rendez-vous avec des élèves" : "Rendez-vous avec " + nomProfCourt()}</span></a>
    <hr><div class="sect">${icon("people")} ${S.prof ? "Cours enseignés" : "Cours suivis"}</div>
    ${actives().map(c => `<a class="it itcours" data-cid="${esc(c.id)}" title="Glisse pour changer l'ordre" href="#/classe/${esc(c.id)}" ${r.v === "classe" && r.a === c.id ? 'aria-current="page"' : ""}><span class="ini" style="--bb:var(${C(c.couleur).b})">${esc((c.symbole || c.nom).slice(0, 3))}</span><span class="lbl"><span class="cnom" title="${esc(c.nom)}">${esc(nomCourtCours(c.nom))}</span><small>${S.prof ? nbTxt(S.nbEleves[c.id]) : esc(c.section)}</small></span></a>`).join("")}
    <hr>${arch && S.prof ? `<a class="it" href="#/archives" ${cur("archives")}>${icon("archive")}<span class="lbl">Cours archivés</span></a>` : ""}
    ${liensUtilesEleve()}<div class="sect">${icon("flask")} Ressources</div>
    <a class="it" href="#/revisions" ${cur("revisions")}>${icon("cards")}<span class="lbl">Révisions et flashcards</span></a>
    <a class="it" href="#/simulations" ${cur("simulations")}>${icon("atom")}<span class="lbl">Simulations</span></a>
    <a class="it" href="#/physique" ${cur("physique")}>${icon("ruler")}<span class="lbl">Outils Scientifiques Importants</span></a>
    <a class="it" href="#/outils" ${cur("outils")}>${icon("tools")}<span class="lbl">Boîte à outils</span></a>
    <a class="it" href="#" data-act="azerty">${icon("clavier")}<span class="lbl">Raccourcis AZERTY</span></a>
    <hr><a class="it" href="#/admin/profil" ${cur("admin")}>${icon("gear")}<span class="lbl">Paramètres</span></a>
    ${S.prof ? `<a class="it" href="#/corbeille" ${cur("corbeille")}>${icon("trash")}<span class="lbl">Corbeille et sauvegardes</span></a>` : ""}
  </nav>${S.drawer && window.innerWidth < 1100 ? `<div class="scrim" data-act="drawer"></div>` : ""}`;
}
/* élève : liens de ses cours, regroupés dans le menu sous « Liens utiles pour toi » */
function liensUtilesEleve(){
  if (S.prof) return "";
  const vus = new Set(), L = [];
  actives().forEach(c => (c.liens || []).forEach(l => { if (l && l.url && !vus.has(l.url)) { vus.add(l.url); L.push({ ...l, c }); } }));
  if (!L.length) return "";
  return `<div class="it ithead">${icon("links")}<span class="lbl">Liens utiles pour toi</span></div>${L.map(l => `<a class="it sublink" href="${esc(l.url)}" target="_blank" rel="noopener" title="${esc(l.c.nom)}"><span class="lbl">${esc(l.nom)}</span></a>`).join("")}`;
}
const nbTxt = n => (n || 0) + " élève" + ((n || 0) > 1 ? "s" : "");
const pageHead = () => `<div class="foot headband"><div class="hbtxt"><span><b>PhysiquePro</b> · site de M. ${esc(R().prof.nom)}${R().prof.titre ? " · " + esc(R().prof.titre) : ""}</span>${S.prof ? compteurVisites() : ""}</div></div>`;
const pageFoot = () => `<div class="foot"><span><b>PhysiquePro</b> · site de M. ${esc(R().prof.nom)}${R().prof.titre ? " · " + esc(R().prof.titre) : ""}</span>${logos}</div>`;
const bientot = txt => `<div class="emptystate"><b>Bientôt disponible</b><span>${txt}</span></div>`;
const avatarP = (nom, cls2 = "") => `<div class="avatar ${cls2}" style="background:var(--surface-2);color:var(--ink)">${initials(nom)}</div>`;

/* ---------- accueil : cartes de cours ---------- */
function carte(c, archivee){
  const k = C(c.couleur), dv = S.devoirs.filter(d => d.classe_id === c.id && !d.brouillon);
  let body = "";
  if (!archivee) {
    if (S.prof) {
      const ac = dv.reduce((a, d) => a + aCorriger(d), 0), next = dv.filter(d => d.date_limite && ouvert(d)).slice(0, 2);
      body = `${ac ? `<span><b>${ac}</b> rendu${ac > 1 ? "s" : ""} à corriger</span>` : ""}${next.map(d => `<span class="due">${dueOf(d)}</span><a href="#/devoir/${d.id}">${esc(d.titre)}</a>`).join("")}`;
    } else {
      const due = dv.filter(d => ouvert(d) && !renduDe(d, moi())).slice(0, 3);
      body = due.map(d => `<span class="due">${dueOf(d)}</span><a href="#/devoir/${d.id}">${esc(d.titre)}</a>`).join("");
      if (!due.length) body = `<span class="cvide">${icon("check")} Rien à rendre</span>`;
    }
    if (S.prof && !body) body = `<span class="cvide">${icon("check")} Rien à corriger</span>`;
    const der = dv.filter(d => d.publie_le && new Date(d.publie_le) <= new Date()).sort((a, b) => new Date(b.publie_le) - new Date(a.publie_le))[0];
    if (der) { const j = Math.floor((Date.now() - new Date(der.publie_le)) / 864e5); body += `<span class="cder">Dernière publication ${j <= 0 ? "aujourd'hui" : j === 1 ? "hier" : "il y a " + j + " jours"} : <a href="#/devoir/${der.id}">${esc(der.titre)}</a></span>`; }
  }
  const menuEleve = !S.prof && !archivee ? `<div class="dd kebab"><button class="ib" data-act="menu" data-m="c${esc(c.id)}" aria-label="Options du cours">${icon("more")}</button>${S.menu === "c" + c.id ? `<div class="dd-menu">${deplacerMenu(c)}<a href="#" data-act="quitter" data-c="${esc(c.id)}" style="color:var(--bad)">${icon("logout")} Quitter le cours</a></div>` : ""}</div>` : "";
  const menu = !S.prof ? menuEleve : `<div class="dd kebab"><button class="ib" data-act="menu" data-m="c${esc(c.id)}" aria-label="Options du cours">${icon("more")}</button>${S.menu === "c" + c.id ? `<div class="dd-menu">
      ${archivee ? `<a href="#" data-act="archiver" data-c="${esc(c.id)}" data-on="0">${icon("restore")} Restaurer</a><a href="#" data-act="supprclasse" data-c="${esc(c.id)}" style="color:var(--bad)">${icon("trash")} Supprimer</a>`
        : `${deplacerMenu(c)}${c.code ? `<a href="#" data-act="copylien" data-code="${esc(c.code)}">${icon("links")} Copier le lien d'invitation</a>` : ""}<a href="#/classe/${esc(c.id)}/parametres">${icon("edit")} Modifier</a><a href="#" data-act="copiercours" data-c="${esc(c.id)}">${icon("copy")} Copier</a><a href="#" data-act="archiver" data-c="${esc(c.id)}" data-on="1">${icon("archive")} Archiver</a>`}</div>` : ""}</div>`;
  return `<article class="ccard${archivee ? " archived" : " movable"}" data-cid="${esc(c.id)}" style="--bb:var(${k.b})">
    <div style="position:relative">
      <a class="banner" href="#/classe/${esc(c.id)}">${bannerArt(c)}${archivee ? "" : badgeCarte(c)}<h2${c.nom.length > 26 ? ' class="long"' : ""}>${esc(c.nom)}</h2>${c.section ? `<p>${esc(c.section)}</p>` : ""}<span class="teacher">${S.prof ? nbTxt(S.nbEleves[c.id]) : esc(R().prof.nom)}</span></a>
      ${S.prof ? "" : avatarP(R().prof.nom, "lg ph")}
    </div>
    <div class="body">${body}</div>
    <div class="cfoot">
      ${S.prof ? `<a class="ib" href="#/classe/${esc(c.id)}/notes" title="Notes" aria-label="Notes de ${esc(c.nom)}">${icon("grade")}</a>` : `<a class="ib" href="#/todo" title="Mes travaux" aria-label="Mes travaux">${icon("todo")}</a>`}
      ${S.prof && c.dossier_onedrive ? `<a class="ib" href="${esc(c.dossier_onedrive)}" target="_blank" rel="noopener" title="Dossier OneDrive du cours" aria-label="Dossier OneDrive de ${esc(c.nom)}">${icon("folder")}</a>` : ""}
      ${menu}
    </div></article>`;
}
/* « Déplacer » comme Classroom : ouvre une fenêtre pour choisir la nouvelle place du cours */
function deplacerMenu(c){
  return actives().length > 1 ? `<a href="#" data-act="placercours" data-c="${esc(c.id)}">${icon("expand")} Déplacer</a>` : "";
}
function vAccueil(){
  const list = actives();
  if (!list.length) return `<div class="page">${S.prof ? `<div class="emptystate"><b>Aucun cours actif.</b><span>Crée ton premier cours avec le bouton + en haut de la page.</span><div><button class="btn" data-act="newclass">${icon("plus")} Créer un cours</button></div></div>` :
    `<div class="emptystate"><b>Tu n'es inscrit dans aucun cours pour l'instant.</b><span>Demande le code du cours à ton professeur, puis rejoins-le.</span><div><button class="btn" data-act="join">${icon("plus")} Rejoindre un cours</button></div></div>`}${pageFoot()}</div>`;
  return `<div class="page wide home">${blocTableauDeBord()}${blocRappels()}${S.prof ? blocAlertes() : ""}${blocRecent()}
    ${blocScientifique()}<section class="homepanel"><div class="homehead"><h1>Cours <small class="ordreaide">${list.length > 1 ? "· glisse une carte pour changer l'ordre" : ""}</small></h1><button class="linkbtn" data-act="${S.prof ? "newclass" : "join"}">${icon("plus")} ${S.prof ? "Ajouter un cours" : "Rejoindre un cours"}</button></div>
    <div class="cards">${list.map(c => carte(c, false)).join("")}</div></section>${blocDecouvertes()}${pageFoot()}</div>`;
}
/* « À rendre récemment » (en haut de l'accueil, comme Classroom) */
function blocRecent(){
  const t = now(), avant = new Date(t - 7 * 864e5), apres = new Date(+t + 7 * 864e5);
  const dans = d => d.date_limite && D(d.date_limite) >= avant && D(d.date_limite) <= apres;
  const ok = o => !o.brouillon && D(o.publie_le) <= t && cls(o.classe_id) && !cls(o.classe_id).archive;
  let items = [...S.devoirs.filter(d => ok(d) && dans(d)).map(d => ({k:"devoir", o:d})), ...S.quiz.filter(q => ok(q) && dans(q) && q.mode === "note").map(q => ({k:"quiz", o:q}))];
  if (!S.prof) items = items.filter(it => it.k === "devoir" ? etat(it.o, moi()).t !== "Noté" : !resultatDe(it.o, S.user.id));
  items.sort((a, b) => D(a.o.date_limite) - D(b.o.date_limite));
  const ligne = it => { const o = it.o, c = cls(o.classe_id);
    let droite = "";
    if (S.prof && it.k === "devoir") { const el = elevesDuDevoir(o, inscritsDe(o.classe_id)); const nr = el.filter(e => renduDe(o, e.email)).length; droite = `<span class="muted">${nr} rendu${nr > 1 ? "s" : ""} sur ${el.length}</span>`; }
    else if (!S.prof && it.k === "devoir") { const e = etat(o, moi()); droite = `<span class="pill ${e.k}">${e.t}</span>`; }
    return `<a class="recentrow" href="#/${it.k}/${o.id}" style="--c:var(${C(c.couleur).c})"><span class="ico">${icon(it.k === "devoir" && o.type === "question" ? "question" : it.k, "")}</span><span class="tt">${esc(o.titre)}<small>${esc(c.nom)} · ${dueTxt(D(o.date_limite)).replace("Échéance : ", "")}</small></span>${relEch(o.date_limite, !S.prof && it.k === "devoir" && ["Rendu", "Noté"].includes(etat(o, moi()).t))}${droite}</a>`; };
  return `<section class="recent${S.recent ? " open" : ""}"><div class="recenthead"><h2>${S.prof ? "À rendre récemment" : "À faire bientôt"}</h2>
      <button class="ib" data-act="recent" title="${S.recent ? "Réduire" : "Développer"}" aria-label="${S.recent ? "Réduire" : "Développer"}" aria-expanded="${S.recent}">${icon(S.recent ? "up" : "expand")}</button></div>
    ${S.recent ? (items.length ? `<div class="recentlist">${items.slice(0, 10).map(ligne).join("")}</div>` : `<p class="muted" style="margin:0">Aucun travail avec une date limite cette semaine ou la semaine dernière.</p>`) : ""}</section>`;
}
function vArchives(){
  const list = S.classes.filter(c => c.archive);
  return `<div class="page wide"><div class="homehead"><h1>Cours archivés</h1></div>
    <p class="muted" style="margin:0">Les cours archivés n'apparaissent plus sur l'accueil. Tu peux les restaurer ou les supprimer définitivement.</p>
    ${list.length ? `<div class="cards">${list.map(c => carte(c, true)).join("")}</div>` : `<div class="emptystate"><b>Aucun cours archivé.</b></div>`}${pageFoot()}</div>`;
}
/* ---------- page de cours : onglets ---------- */
function fluxVisible(c){ return S.prof || c.flux_mode !== "masque"; }
function peutPublier(c){ return S.prof || c.flux_mode === "eleves"; }
function peutCommenter(c){ return S.prof || c.flux_mode === "prof" || c.flux_mode === "eleves"; }
function teamsVisible(c){ return c.teams_url && (S.prof || c.teams_visible); }

function classTabs(c, tab){
  const T = []; if (fluxVisible(c)) T.push(["flux", "Flux"]);
  T.push(["travaux", "Travaux<span class=\"tl\"> et devoirs</span>"], ["personnes", "Personnes"]); T.push(["notes", S.prof ? "Notes" : "Mes notes"]);
  if (S.prof) T.push(["corriger", "À corriger"]);
  return `<div class="tabsbar" style="--c:var(${C(c.couleur).c})"><div class="tabs" role="tablist">${T.map(([k, l]) => `<a role="tab" aria-selected="${tab === k}" href="#/classe/${esc(c.id)}/${k}">${l}</a>`).join("")}</div>
    <div class="tabicons">
      ${teamsVisible(c) ? `<a class="ib" href="${esc(c.teams_url)}" target="_blank" rel="noopener" title="Visio Teams de la classe" aria-label="Visio Teams de la classe">${icon("video")}</a>` : ""}
      <a class="ib" href="#/agenda/${esc(c.id)}" title="Agenda du cours" aria-label="Agenda du cours">${icon("cal")}</a>
      ${S.prof && c.dossier_onedrive ? `<a class="ib" href="${esc(c.dossier_onedrive)}" target="_blank" rel="noopener" title="Dossier OneDrive du cours" aria-label="Dossier OneDrive du cours">${icon("folder")}</a>` : ""}
      ${S.prof ? `<a class="ib" href="#/classe/${esc(c.id)}/parametres" title="Paramètres du cours" aria-label="Paramètres du cours">${icon("gear")}</a>` : ""}
    </div></div>`;
}
/* vidéos YouTube : titre récupéré automatiquement + miniature */
const ytId = u => { const m = String(u || "").match(/(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/|\/live\/)([\w-]{11})/); return m ? m[1] : null; };
const YT = {}, ytEnCours = new Set();
async function titreYoutube(u){
  const id = ytId(u); if (!id) return null; if (YT[id]) return YT[id];
  const w = "https://www.youtube.com/watch?v=" + id;
  for (const api of ["https://www.youtube.com/oembed?format=json&url=", "https://noembed.com/embed?url="]) {
    try { const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 5000);
      const r = await fetch(api + encodeURIComponent(w), { signal: ctl.signal }); clearTimeout(t);
      if (r.ok) { const j = await r.json(); if (j && j.title) return YT[id] = j.title; } } catch (_) {}
  }
  return null;
}
const libelleGenerique = l => !l || /^(youtube|lien|vidéo youtube|chargement…)$/i.test(String(l).trim());
/* ---------- pièces jointes : cartes comme dans Google Classroom ---------- */
const TYPE_RES = { doc:["Microsoft Word","#185ABD","W"], xls:["Microsoft Excel","#107C41","X"], ppt:["Microsoft PowerPoint","#C43E1C","P"], pdf:["PDF","#D93025","PDF"], img:["Image","#1E8E3E","IMG"], vid:["Vidéo","#7B1FA2","▶"], zip:["Archive","#5F6368","ZIP"], txt:["Texte","#5F6368","TXT"] };
function familleRes(nom){
  const x = extDe(nom);
  if (/^(doc|dot|rtf|odt)/.test(x)) return "doc"; if (/^(xls|ods|csv)/.test(x)) return "xls"; if (/^(ppt|pps|odp)/.test(x)) return "ppt";
  if (x === "pdf") return "pdf"; if (/^(png|jpe?g|gif|webp|bmp|svg|heic)$/.test(x)) return "img"; if (/^(mp4|mov|avi|mkv|webm|mp3|wav|m4a)$/.test(x)) return "vid";
  if (/^(zip|rar|7z)$/.test(x)) return "zip"; if (/^(txt|md|py|html?|js|css)$/.test(x)) return "txt"; return "";
}
const domaineDe = u => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch (_) { return ""; } };
const MINI = {};          // vignettes déjà trouvées (id → url)
function vignetteRes(r, fam){
  const t = TYPE_RES[fam];
  const glyphe = t ? `<span class="rglyph" style="--g:${t[1]}">${t[2]}</span>` : r.url && domaineDe(r.url) ? `<img class="rfav" src="https://www.google.com/s2/favicons?domain=${encodeURIComponent(domaineDe(r.url))}&sz=64" alt="" loading="lazy" onerror="this.outerHTML='<span class=rglyph style=--g:#5F6368>URL</span>'">` : `<span class="rglyph" style="--g:#5F6368">${icon("links")}</span>`;
  let img = "";
  if (r.od && r.od.id) { const v = MINI["od:" + r.od.id]; if (v) img = v; else vignetteOD(r.od.id); }
  else if (!r.path && !fam && /^https?:/.test(r.url || "")) img = "https://s.wordpress.com/mshots/v1/" + encodeURIComponent(r.url) + "?w=320&h=240";
  else if (r.path && fam === "img") { const v = (S.urls || {})[r.path]; if (v) img = v; else if (!MINI["p:" + r.path]) { MINI["p:" + r.path] = 1; urlsSignees([r.path]).then(() => { if ((S.urls || {})[r.path]) render(); }); } }
  return `<span class="rthumb${img ? " img" : ""}">${glyphe}${img ? `<img class="rimg" src="${esc(img)}" alt="" loading="lazy" onerror="this.parentNode.classList.remove('img');this.remove()">` : ""}</span>`;
}
function carteRes(r, ctx = {}){
  if (!r.path && ytId(r.url)) {
    const id = ytId(r.url), titre = !libelleGenerique(r.label) ? r.label : YT[id] || "Vidéo YouTube";
    if (libelleGenerique(r.label) && !YT[id] && !ytEnCours.has(id)) { ytEnCours.add(id); titreYoutube(r.url).then(t => { if (t) render(); }); }
    return `<div class="rcard"><a class="rtxt" href="${esc(r.url)}" target="_blank" rel="noopener"><b>${esc(titre)}</b><small>Vidéo YouTube</small></a><a class="rthumb img yt" href="${esc(r.url)}" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true"><img src="https://i.ytimg.com/vi/${id}/mqdefault.jpg" alt="" loading="lazy"><span class="ytplay">▶</span></a></div>`;
  }
  const nom = r.label || r.path || r.url || "", fam = familleRes(r.od || r.path ? nom : (r.label && /\.\w{2,5}$/.test(r.label) ? r.label : ""));
  const sous = fam ? TYPE_RES[fam][0] : r.url ? String(r.url).replace(/^https?:\/\//, "") : "Fichier";
  const tip = appOffice(nom) ? `title="Ouvrir dans ${appOffice(nom)} en ligne"` : `title="${esc(nom)}"`;
  const office = !S.prof && appOffice(nom) && r.od, copie = office ? copieDe(r, ctx) : null;
  let lien = r.path ? `href="#" data-act="openfile" data-bucket="${esc(r.bucket || "documents")}" data-path="${esc(r.path)}"` : `href="${esc(S.prof && r.od && r.od.web ? r.od.web : r.url)}" target="_blank" rel="noopener"`;
  let tip2 = tip;
  if (copie) { lien = `href="${esc(copie.web)}" target="_blank" rel="noopener"`; tip2 = `title="Ouvrir ma copie modifiable dans ${appOffice(nom)} en ligne"`; }
  const dl = r.path ? btnDl(r.bucket || "documents", r.path, r.label) : r.url && /sharepoint\.com/i.test(r.url) && fam ? `<a class="dlbtn" href="${esc(r.url + (r.url.includes("?") ? "&" : "?") + "download=1")}" target="_blank" rel="noopener" title="Télécharger pour modifier sur l'ordinateur" aria-label="Télécharger ${esc(nom)}">${icon("down")}</a>` : "";
  return `<div class="rcard"><a class="rtxt" ${lien} ${tip2}><b>${esc(nom)}</b><small>${esc(sous)}${copie ? " · ma copie modifiable" : office ? " · lecture seule" : ""}</small></a>${dl}<a class="rthumb-l" ${lien} tabindex="-1" aria-hidden="true">${vignetteRes(r, fam)}</a></div>`;
}
const carteYoutube = r => carteRes(r);
function ressources(list, ctx = {}){
  if (!list || !list.length) return "";
  return `<div class="att rcards">${list.map(r => carteRes(r, ctx)).join("")}</div>`;
}
const banniere = (c) => `<div class="banner bigbanner" style="--bb:var(${C(c.couleur).b})">${bannerArt(c)}${S.prof ? `<a class="btn ghost sm custom" href="#/classe/${esc(c.id)}/parametres">${icon("edit")} Personnaliser</a>` : ""}<h1>${esc(c.nom)}</h1><span>${esc(c.section)}</span>${c.description ? `<p class="bdesc">${esc(c.description)}</p>` : ""}</div>`;

function asideClasse(c){
  const up = S.devoirs.filter(d => d.classe_id === c.id && d.date_limite && ouvert(d) && !d.brouillon && (S.prof || !renduDe(d, moi()))).slice(0, 3);
  return `<aside class="caside">
    ${(c.liens && c.liens.length) || S.prof ? `<div class="box"><div class="boxhead"><h3>${S.prof ? "Liens de la classe" : "Liens utiles pour toi"}</h3>${S.prof ? `<button class="ib sm" data-act="editliens" data-c="${esc(c.id)}" aria-label="Modifier les liens" title="Modifier les liens">${icon("edit")}</button>` : ""}</div>
      <div class="classlinks">${(c.liens || []).map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${icon("links")}<span>${esc(l.nom)}</span></a>`).join("")}</div>
      ${S.prof && !(c.liens || []).length ? `<span class="muted" style="font-size:.82rem">Ajoute des liens utiles : manuel, simulateur, Capytale…</span>` : ""}</div>` : ""}
    <div class="box"><h3>À venir</h3>${up.length ? up.map(d => `<span class="muted" style="font-size:.8rem">${dueOf(d).replace("Échéance : ", "")}</span><a href="#/devoir/${d.id}" class="uplink">${esc(d.titre)}</a>`).join("") : `<span class="muted">Aucun devoir à remettre dans les jours qui viennent</span>`}<a class="linkbtn" href="${S.prof ? `#/classe/${esc(c.id)}/corriger` : "#/todo"}">Tout afficher</a></div>
    ${!S.prof && c.moyenne_visible ? `<div class="box"><h3>Ma moyenne</h3><span class="grade">${moyenneEleve(c) == null ? "–" : fmtNote(moyenneEleve(c))}<small>/20</small></span><span class="muted" style="font-size:.78rem">Calculée sur les notes rendues par ton professeur.</span></div>` : ""}
    ${teamsVisible(c) ? `<div class="box"><div class="boxhead"><h3>${icon("video")} Visio Teams</h3></div><a class="btn ghost" href="${esc(c.teams_url)}" target="_blank" rel="noopener" style="text-decoration:none">Rejoindre</a>${S.prof ? `<span class="muted" style="font-size:.78rem">${icon("eye")} ${c.teams_visible ? "Visible par les élèves" : "Masqué aux élèves"}</span>` : ""}</div>`
      : S.prof ? `<div class="box"><div class="boxhead"><h3>${icon("video")} Visio Teams</h3></div><a class="linkbtn" href="#/classe/${esc(c.id)}/parametres">Ajouter le lien de la visio</a></div>` : ""}
    ${S.prof ? `<div class="box"><div class="boxhead"><h3>Code du cours</h3><div class="dd kebab"><button class="ib sm" data-act="menu" data-m="code" aria-label="Options du code">${icon("more")}</button>${S.menu === "code" ? `<div class="dd-menu">
        <a href="#" data-act="copylien" data-code="${esc(c.code || "")}">${icon("links")} Copier le lien d'invitation</a>
        <a href="#" data-act="copycode" data-code="${esc(c.code || "")}">${icon("copy")} Copier le code</a>
        <a href="#" data-act="resetcode" data-c="${esc(c.id)}">${icon("key")} Réinitialiser</a>
        <a href="#" data-act="togglecode" data-c="${esc(c.id)}" data-on="${c.code_actif ? "0" : "1"}">${icon(c.code_actif ? "x" : "check")} ${c.code_actif ? "Désactiver" : "Activer"}</a></div>` : ""}</div></div>
      ${c.code_actif ? `<button class="codebig" data-act="showcode" data-code="${esc(c.code)}" title="Afficher en grand">${esc(c.code)} ${icon("expand")}</button>` : `<span class="muted">Désactivé</span>`}</div>` : ""}
  </aside>`;
}

/* ---------- Flux ---------- */
function vFlux(c, data){
  const items = data.annonces.map(a => ({k:"annonce", date:D(a.cree_le), a}));
  if (c.flux_devoirs) {
    S.devoirs.filter(d => d.classe_id === c.id && !d.brouillon && D(d.publie_le) <= now()).forEach(d => items.push({k:"devoir", date:D(d.publie_le), o:d}));
    data.supports.filter(s => !s.brouillon && D(s.publie_le) <= now()).forEach(s => items.push({k:"support", date:D(s.publie_le), o:s}));
    S.quiz.filter(q => q.classe_id === c.id && !q.brouillon && D(q.publie_le) <= now()).forEach(q => items.push({k:"quiz", date:D(q.publie_le), o:q}));
  }
  items.sort((x, y) => y.date - x.date);
  const A = S.annonce && S.annonce.classe === c.id ? S.annonce : null;
  const composer = !peutPublier(c) ? "" : A ? `<section class="post composer">
      <div class="field"><label>${A.id ? "Modifier l'annonce" : "Pour : " + esc(c.nom) + " · tous les élèves"}</label>
      <div class="rte"><div id="anHtml" class="rtebody" contenteditable="true" role="textbox" aria-multiline="true" data-ph="Annoncez quelque chose à la classe">${rich(A.html)}</div>
      <div class="rtebar">${fmtBar()}</div></div></div>
      ${A.ressources.length ? `<ul class="files">${A.ressources.map((x, i) => `<li><span><span class="k mono muted">${esc(x.type)}</span> ${esc(x.label)}</span><button data-act="anrm" data-i="${i}" aria-label="Retirer">✕</button></li>`).join("")}</ul>` : ""}
      ${S.prof && !A.id && actives().length > 1 ? `<details class="aussi"><summary>Publier aussi dans d'autres cours${(A.aussi || []).length ? " (" + A.aussi.length + ")" : ""}</summary>${actives().filter(x => x.id !== c.id).map(x => `<label class="check"><input type="checkbox" class="anAussi" value="${esc(x.id)}" ${(A.aussi || []).includes(x.id) ? "checked" : ""}> ${esc(x.nom)}</label>`).join("")}</details>` : ""}
      ${A.linkMode ? `<div class="linkform"><div class="field"><label for="anLinkUrl">Lien</label><input id="anLinkUrl" type="url" placeholder="https://…"></div><div class="field"><label for="anLinkLabel">Nom affiché <span class="muted">(facultatif)</span></label><input id="anLinkLabel"></div><div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn ghost sm" data-act="anlinkcancel">Annuler</button><button class="btn sm" data-act="anlinkadd">Ajouter</button></div></div>` : ""}
      <div class="composerfoot"><div style="display:flex;gap:4px">
        <button class="ib" data-act="anlink" title="Ajouter un lien OneDrive, YouTube ou site" aria-label="Ajouter un lien">${icon("links")}</button>
        ${S.prof ? `<button class="ib" data-act="anupload" title="Importer un fichier" aria-label="Importer un fichier">${icon("upload")}</button><input type="file" id="anFile" multiple hidden>` : ""}</div>
        <span class="spacer"></span><button class="btn ghost" data-act="ancancel">Annuler</button><button class="btn" data-act="anpost" ${A.busy ? "disabled" : ""}>${A.busy ? "Enregistrement…" : A.id ? "Enregistrer" : "Publier"}</button></div>
    </section>` : `<button class="post annoncer" data-act="annoncer" data-c="${esc(c.id)}">${avatarP(S.nom)}<span>Annoncez quelque chose à la classe</span></button>`;
  const fluxMasque = S.prof && c.flux_mode === "masque" ? `<div class="notice">${icon("eye")} Le flux est actuellement <b>masqué aux élèves</b>. Tu peux changer ce réglage dans les <a href="#/classe/${esc(c.id)}/parametres">paramètres du cours</a>.</div>` : "";
  return `<div class="page" style="--c:var(${C(c.couleur).c})">${banniere(c)}
    <div class="classgrid">${asideClasse(c)}
      <div class="stream">${fluxMasque}${composer}
        ${items.length ? items.map(it => it.k === "annonce" ? vAnnonce(c, it.a, data) : vNotif(it)).join("") : `<section class="post emptyflux"><div><h3>C'est ici que vous pourrez communiquer avec ${S.prof ? "votre classe" : "ta classe"}</h3><p class="muted">${S.prof ? "Publie des annonces, et les nouveaux devoirs et documents apparaîtront ici." : "Les annonces de ton professeur apparaîtront ici."}</p>${S.prof ? `<a class="btn ghost sm" href="#/classe/${esc(c.id)}/parametres">${icon("gear")} Paramètres du flux</a>` : ""}</div></section>`}
      </div></div>${pageFoot()}</div>`;
}
function vNotif(it){
  const o = it.o, isQ = it.k === "devoir" && o.type === "question", href = it.k === "devoir" ? "#/devoir/" + o.id : it.k === "quiz" ? "#/quiz/" + o.id : "#/classe/" + o.classe_id + "/travaux";
  const lib = isQ ? "Nouvelle question" : it.k === "devoir" ? "Nouveau devoir" : it.k === "quiz" ? "Nouveau questionnaire" : "Nouveau support";
  return `<a class="post notif" href="${href}"><span class="ico">${icon(isQ ? "question" : it.k, "")}</span><span class="tt"><span class="nlib">${lib}</span>${esc(o.titre)}<small>${fmtQuand(it.date)} · ${esc(R().prof.nom)}</small></span></a>`;
}
function vAnnonce(c, a, data){
  const coms = data.coms.filter(x => x.annonce_id === a.id), mien = S.prof || a.auteur === S.user.id;
  const open = S.open === "an" + a.id || coms.length <= 2;
  const shown = open ? coms : coms.slice(-1);
  return `<section class="post">
    <div class="posthead">${avatarP(a.auteur_nom)}<div style="flex:1;min-width:0"><b>${esc(a.auteur_nom)}</b><small class="muted">${fmtQuand(D(a.cree_le))}</small></div>
      ${mien ? `<div class="dd kebab"><button class="ib sm" data-act="menu" data-m="a${a.id}" aria-label="Options de l'annonce">${icon("more")}</button>${S.menu === "a" + a.id ? `<div class="dd-menu"><a href="#" data-act="editannonce" data-id="${a.id}" data-c="${esc(c.id)}">${icon("edit")} Modifier</a><a href="#" data-act="copiertexte" data-id="${a.id}" data-c="${esc(c.id)}">${icon("copy")} Copier le texte</a><a href="#" data-act="supprannonce" data-id="${a.id}" data-c="${esc(c.id)}" style="color:var(--bad)">${icon("trash")} Supprimer</a></div>` : ""}</div>` : ""}</div>
    <div class="richtext">${rich(a.texte)}</div>${ressources(a.ressources, { classe: a.classe_id })}
    <div class="coms">${coms.length ? `${!open ? `<button class="linkbtn" data-act="opencoms" data-id="${a.id}">${icon("people")} ${coms.length} commentaires sur le cours</button>` : `<span class="muted" style="font-size:.85rem">${icon("people")} ${coms.length} commentaire${coms.length > 1 ? "s" : ""} sur le cours</span>`}` : ""}
      ${shown.map(x => `<div class="com">${avatarP(x.auteur_nom, "sm")}<div style="flex:1;min-width:0"><b>${esc(x.auteur_nom)}</b> <small class="muted">${fmtQuand(D(x.cree_le))}</small><div>${linkify(x.texte)}</div></div>${S.prof || x.auteur === S.user.id ? `<button class="ib sm" data-act="supprcom" data-id="${x.id}" data-c="${esc(c.id)}" aria-label="Supprimer le commentaire" title="Supprimer">${icon("x")}</button>` : ""}</div>`).join("")}
      ${peutCommenter(c) ? `<div class="comform">${avatarP(S.nom, "sm")}<input id="cm-${a.id}" placeholder="Ajouter un commentaire pour le cours…" aria-label="Commentaire pour le cours"><button class="ib" data-act="comment" data-id="${a.id}" data-c="${esc(c.id)}" aria-label="Envoyer">${icon("send")}</button></div>` : ""}
    </div></section>`;
}
const fmtBar = () => [["bold","<b>G</b>","Gras"],["italic","<i>I</i>","Italique"],["underline","<u>S</u>","Souligné"],["superscript","x²","Exposant"],["subscript","x₂","Indice"],["insertUnorderedList","•≡","Liste à puces"],["removeFormat","✕","Effacer la mise en forme"]].map(([cmd, l, t]) => `<button class="ib sm" data-act="fmt" data-cmd="${cmd}" data-keepfocus="1" title="${t}" aria-label="${t}">${l}</button>`).join("")
  + `<button class="ib sm" data-act="symb" data-keepfocus="1" title="Symboles scientifiques" aria-label="Symboles scientifiques" aria-pressed="${!!S.symb}">Ω</button>` + (S.symb && !S.ed ? paletteSymb() : "");

/* ---------- Travaux et devoirs ---------- */
function itemsDuTheme(c, data, themeId){
  const items = [];
  data.supports.filter(s => (s.theme_id ?? null) === themeId).forEach(s => items.push({k:"support", id:"s" + s.id, titre:s.titre, date:D(s.publie_le), s}));
  S.devoirs.filter(d => d.classe_id === c.id && (d.theme_id ?? null) === themeId).forEach(d => items.push({k:"devoir", q2:d.type === "question", id:"d" + d.id, titre:d.titre, date:D(d.publie_le), d}));
  S.quiz.filter(q => q.classe_id === c.id && (q.theme_id ?? null) === themeId).forEach(q => items.push({k:"quiz", id:"q" + q.id, titre:q.titre, date:D(q.publie_le), q}));
  const pos = it => (it.s || it.d || it.q).position;
  return items.sort((a, b) => { const pa = pos(a), pb = pos(b);
    if (pa == null && pb == null) return b.date - a.date; if (pa == null) return -1; if (pb == null) return 1; return pa - pb; });
}
function workItem(it){
  const op = S.open === it.id, obj = it.s || it.d || it.q, draft = obj.brouillon, prog = !draft && D(obj.publie_le) > now();
  let right = "", detail = "";
  const cible = obj.eleves ? `<span class="pill">${obj.eleves.length} élève${obj.eleves.length > 1 ? "s" : ""}</span>` : "";
  if (it.k === "support") {
    right = `<span class="dt">Publié le ${fmtShort(it.date)}</span>`;
    detail = `${texteUtile(obj.description) ? `<div class="richtext wkdesc">${rich(obj.description)}</div>` : ""}${ressources(obj.ressources, { classe: obj.classe_id, support: obj.id }) || (texteUtile(obj.description) ? "" : `<span class="muted">Aucun fichier joint.</span>`)}`;
  } else if (it.k === "devoir") {
    const d = obj;
    right = S.prof ? `<span class="dt">${d.date_limite ? dueOf(d).replace("Échéance : ", "") : "Publié le " + fmtShort(it.date)}</span>` : `<span class="dt">${etat(d, moi()).t === "Manquant" ? `<span style="color:var(--bad)">Manquant</span>` : etat(d, moi()).t === "Noté" ? fmtNote(etat(d, moi()).note) + "/" + d.points : d.date_limite ? dueOf(d).replace("Échéance : ", "") : ""}</span>`;
    const st = etat(d, moi());
    detail = `<div class="wkhead"><div class="wkdl"><b>${d.date_limite ? "Date limite : " + fmtShort(D(d.date_limite)) + " " + fmtT(D(d.date_limite)) : "Aucune date limite"}</b><small>${it.q2 ? (d.question && d.question.format === "choix" ? "Question à choix multiples" : "Question à réponse courte") : d.mode === "binome" ? "Un rendu par binôme" : "Individuel"} · ${pts(d)}</small></div>
        ${S.prof ? statsDevoir(d) : `<span class="wkright"><span class="wkst ${st.k}">${st.t}</span><a class="wklink wkopen" href="#/devoir/${d.id}">${it.q2 ? "Afficher la question" : "Afficher le devoir"} ${icon("right")}</a></span>`}</div>
      ${texteUtile(d.consigne) ? `<div class="richtext wkdesc">${rich(d.consigne)}</div>` : ""}${ressources(d.ressources, { classe: d.classe_id, devoir: d.id })}
      ${S.prof ? `<div class="wkfoot"><a class="wklink" href="#/devoir/${d.id}">Afficher les instructions</a><a class="btn tonal" href="#/devoir/${d.id}">${it.q2 ? "Voir les réponses" : "Évaluer le travail"}</a></div>` : it.q2 && !renduDe(d, moi()) && depotOuvert(d) ? `<div class="wkfoot"><span></span><a class="btn tonal" href="#/devoir/${d.id}">Répondre</a></div>` : ""}`;
  } else {
    const q = obj, r = resultatDe(q, S.user.id);
    right = `<span class="dt">${!S.prof && r ? fmtNote(noteQuiz(q, r)) + "/" + q.points : q.date_limite ? dueTxt(D(q.date_limite)).replace("Échéance : ", "") : q.mode === "note" ? "Questionnaire noté" : "Entraînement"}</span>`;
    detail = `<div class="wkhead"><div class="wkdl"><b>${q.date_limite ? "Date limite : " + fmtShort(D(q.date_limite)) + " " + fmtT(D(q.date_limite)) : "Aucune date limite"}</b><small>${(q.questions || []).length} questions · ${q.mode === "note" ? "noté sur " + q.points + ", une seule tentative" : "entraînement, recommençable"}</small></div>${!S.prof ? `<span class="wkst ${r ? "ok" : ""}">${r ? "Fait" : "Attribué"}</span>` : ""}</div>
      ${texteUtile(q.consigne) ? `<div class="richtext wkdesc">${rich(q.consigne)}</div>` : ""}
      <div class="wkfoot"><a class="wklink" href="#/quiz/${q.id}">Afficher le questionnaire</a><a class="btn tonal" href="#/quiz/${q.id}">${S.prof ? "Voir les résultats" : r ? "Voir mon résultat" : "Commencer"}</a></div>`;
  }
  if (S.prof && draft) right = `<span class="dt draft">Brouillon</span>`;
  else if (S.prof && prog) right = `<span class="dt draft">Programmé · ${fmtShort(D(obj.publie_le))} ${fmtT(D(obj.publie_le))}</span>`;
  const typ = it.k === "support" ? "documentation" : it.k === "quiz" ? "questionnaire" : it.q2 ? "question" : "devoir", rid = it.id.slice(1);
  const menu = S.prof ? `<div class="dd kebab"><button class="ib" data-act="menu" data-m="i${it.id}" aria-label="Options">${icon("more")}</button>${S.menu === "i" + it.id ? `<div class="dd-menu">
      <a href="#/editer/${typ}/${rid}">${icon("edit")} Modifier</a>
      ${draft || prog ? `<a href="#" data-act="publier" data-k="${it.k}" data-id="${rid}">${icon("check")} Publier maintenant</a>` : ""}
      <a href="#" data-act="moveitem" data-wk="${it.k}:${rid}" data-to="first">${icon("up")} Placer en premier</a>
      <a href="#" data-act="moveitem" data-wk="${it.k}:${rid}" data-to="-1">${icon("up")} Monter</a>
      <a href="#" data-act="moveitem" data-wk="${it.k}:${rid}" data-to="1">${icon("down")} Descendre</a>
      <a href="#" data-act="moveitem" data-wk="${it.k}:${rid}" data-to="last">${icon("down")} Placer en dernier</a>
      <a href="#" data-act="dupliquer" data-k="${it.k}" data-id="${rid}">${icon("copy")} Dupliquer</a>
      <a href="#" data-act="reutiliser" data-k="${it.k}" data-id="${rid}">${icon("reuse")} Réutiliser dans un autre cours</a>
      <a href="#" data-act="suppr" data-k="${it.k}" data-id="${rid}" data-titre="${esc(it.titre)}" style="color:var(--bad)">${icon("trash")} Supprimer</a></div>` : ""}</div>` : "";
  return `<div class="work${draft ? " isdraft" : ""}"${S.prof ? ` data-wk="${it.k}:${rid}"` : ""}><div class="workrow"><button data-act="toggle" data-id="${it.id}" aria-expanded="${op}"><span class="ico ${it.k === "support" ? "pale" : ""}">${icon(it.q2 ? "question" : it.k, "")}</span><span class="tt">${esc(it.titre)}</span>${S.prof ? cible : ""}${right}</button>${menu}</div>${op ? `<div class="workd">${detail}</div>` : ""}</div>`;
}
function statsDevoir(d, lien = true){
  const el = elevesDuDevoir(d, inscritsDe(d.classe_id)), n = el.filter(e => renduDe(d, e.email)).length;
  const an = aCorriger(d);
  const bloc = (nb, txt, f) => lien ? `<a href="#/devoir/${d.id}" data-act="voirstat" data-d="${d.id}" data-f="${f}" title="Voir les élèves : ${txt.toLowerCase()}"><b>${nb}</b><small>${txt}</small></a>` : `<div><b>${nb}</b><small>${txt}</small></div>`;
  return `<span class="stats crstats">${bloc(n, "Remis", "remis")}${bloc(el.length - n, ouvert(d) ? "Attribués" : "Manquants", "attribues")}${an ? bloc(an, "À noter", "anoter") : ""}</span>`;
}
/* vrai texte (pas seulement « … » ou des espaces) */
function texteUtile(h){ return !!String(h || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;|&hellip;/g, " ").replace(/[\s.…·-]+/g, "").length;
}
function vTravaux(c, data){
  const groupes = data.themes.map((t, i) => ({t, i, titre:t.titre, items:itemsDuTheme(c, data, t.id)}));
  const sans = itemsDuTheme(c, data, null); if (sans.length) groupes.unshift({t:null, titre:"Aucun thème", items:sans});
  const visibles = groupes.filter(g => (S.prof || g.items.length) && (!S.prof || !S.filtreTheme || (g.t ? String(g.t.id) : "none") === S.filtreTheme));
  const themeMenu = g => !S.prof || !g.t ? "" : `<div class="dd kebab"><button class="ib" data-act="menu" data-m="t${g.t.id}" aria-label="Options du thème">${icon("more")}</button>${S.menu === "t" + g.t.id ? `<div class="dd-menu">
    <a href="#" data-act="renomtheme" data-id="${g.t.id}" data-titre="${esc(g.t.titre)}">${icon("edit")} Renommer</a>
    <a href="#" data-act="placertheme" data-id="${g.t.id}" data-titre="${esc(g.t.titre)}" data-c="${esc(c.id)}">${icon("reuse")} Déplacer avant / après…</a>
    ${g.i > 0 ? `<a href="#" data-act="movetheme" data-id="${g.t.id}" data-to="0" data-c="${esc(c.id)}">${icon("up")} Placer en premier</a><a href="#" data-act="movetheme" data-id="${g.t.id}" data-dir="-1" data-c="${esc(c.id)}">${icon("up")} Monter</a>` : ""}
    ${g.i < data.themes.length - 1 ? `<a href="#" data-act="movetheme" data-id="${g.t.id}" data-dir="1" data-c="${esc(c.id)}">${icon("down")} Descendre</a><a href="#" data-act="movetheme" data-id="${g.t.id}" data-to="999" data-c="${esc(c.id)}">${icon("down")} Placer en dernier</a>` : ""}
    <a href="#" data-act="supprtheme" data-id="${g.t.id}" data-titre="${esc(g.t.titre)}" data-c="${esc(c.id)}" style="color:var(--bad)">${icon("trash")} Supprimer</a></div>` : ""}</div>`;
  const gid = g => g.t ? String(g.t.id) : "none";
  const head = `<div class="travhead">
    ${S.prof ? `<div class="dd"><button class="btn" data-act="menu" data-m="create">${icon("plus")} Créer</button>${S.menu === "create" ? `<div class="dd-menu" style="left:0;right:auto">
      <a href="#/editer/devoir/new/${esc(c.id)}">${icon("devoir")} Devoir</a>
      <a href="#/editer/questionnaire/new/${esc(c.id)}">${icon("quiz")} Questionnaire</a>
      <a href="#/editer/question/new/${esc(c.id)}">${icon("question")} Question</a>
      <a href="#/editer/documentation/new/${esc(c.id)}">${icon("support")} Documentation</a>
      <a href="#" data-act="reutiliserdepuis" data-c="${esc(c.id)}">${icon("reuse")} Réutiliser un post</a>
      <hr><a href="#" data-act="newtheme" data-c="${esc(c.id)}">${icon("theme")} Thème</a></div>` : ""}</div>` : ""}
    ${S.prof && groupes.length > 1 ? `<div class="field filt"><label for="filtreTheme">Filtre thématique</label><select id="filtreTheme" data-f="filtre"><option value="">Tous les thèmes</option>${groupes.map(g => `<option value="${gid(g)}" ${S.filtreTheme === gid(g) ? "selected" : ""}>${esc(g.titre)}</option>`).join("")}</select></div>` : ""}
    <span class="spacer"></span>${groupes.length ? `<button class="linkbtn" data-act="toutreduire">${S.reduits.size ? "Tout développer" : "Tout réduire"}</button>` : ""}</div>`;
  return `<div class="page" style="--c:var(${C(c.couleur).c})">${head}
    ${visibles.length ? visibles.map(g => `<section class="theme${S.prof ? " movable" : ""}" data-tid="${gid(g)}"><div class="themehead">${S.prof && g.t ? `<span class="grip" title="Glisser pour déplacer" aria-hidden="true">⋮⋮</span>` : ""}<h2>${esc(g.titre)}</h2><button class="ib sm" data-act="reduire" data-id="${gid(g)}" aria-label="${S.reduits.has(gid(g)) ? "Développer" : "Réduire"}">${icon(S.reduits.has(gid(g)) ? "chevdown" : "chevup")}</button>${themeMenu(g)}</div>
      ${S.reduits.has(gid(g)) ? "" : g.t ? etapesChapitre(g, c) : g.items.length ? g.items.map(workItem).join("") : `<p class="empty">${S.prof ? "Aucun élément. Utilise « Créer » pour ajouter un devoir, un questionnaire ou une documentation." : "Rien pour l'instant."}</p>`}</section>`).join("")
      : `<div class="emptystate"><b>${S.prof ? "Crée ton premier élément" : "Aucun travail pour l'instant."}</b><span>${S.prof ? "Crée un thème (par exemple « Chapitre 1 »), puis ajoute des devoirs, des questionnaires et des documentations." : "Ton professeur n'a encore rien publié dans ce cours."}</span></div>`}
    ${pageFoot()}</div>`;
}

/* ---------- Personnes ---------- */
function vPersonnes(c, data){
  const el = data.eleves, selN = el.filter(e => S.pick.has(e.email)).length;
  return `<div class="page" style="max-width:820px;--c:var(${C(c.couleur).c})">
    <section class="people"><h2>Enseignants</h2><div class="person">${`<div class="avatar">${initials(R().prof.nom)}</div>`}<span>${esc(R().prof.nom)}</span></div></section>
    <section class="people"><h2>Élèves <small>${el.length} élève${el.length > 1 ? "s" : ""}${S.prof ? ` <button class="ib sm" data-act="ajouteleves" data-c="${esc(c.id)}" title="Ajouter des élèves" aria-label="Ajouter des élèves">${icon("invite")}</button>` : ""}</small></h2>
    ${S.prof ? `<div class="invitebar"><button class="btn ghost sm" data-act="ajouteleves" data-c="${esc(c.id)}">${icon("invite")} Ajouter des élèves</button>${c.code ? `<button class="btn ghost sm" data-act="copylien" data-code="${esc(c.code)}">${icon("links")} Copier le lien d'invitation</button><button class="btn ghost sm" data-act="showcode" data-code="${esc(c.code)}">${icon("expand")} Afficher le code</button>` : ""}</div>` : ""}
    ${S.prof && el.length ? `<div class="person" style="gap:12px;flex-wrap:wrap"><input type="checkbox" data-act="pickall" data-c="${esc(c.id)}" ${selN === el.length ? "checked" : ""} aria-label="Tout sélectionner"><div class="dd"><button class="btn ghost sm" data-act="menu" data-m="actions" ${selN ? "" : "disabled"}>Actions ▾</button>${S.menu === "actions" ? `<div class="dd-menu" style="left:0;right:auto"><a href="#" data-act="compose">${icon("mail")} Envoyer un e-mail</a><a href="#" data-act="autrescours" data-c="${esc(c.id)}">${icon("plus")} Ajouter à un autre cours</a><a href="#" data-act="retirersel" data-c="${esc(c.id)}" style="color:var(--bad)">${icon("trash")} Retirer de la classe</a></div>` : ""}</div><span class="muted" style="font-size:.85rem">${selN ? selN + " sélectionné" + (selN > 1 ? "s" : "") : ""}</span></div>` : ""}
    ${S.prof && S.compose ? composeBox(el.filter(e => S.pick.has(e.email))) : ""}
    ${el.length ? el.map(e => `<div class="person">${S.prof ? `<input type="checkbox" data-act="pick" data-e="${esc(e.email)}" ${S.pick.has(e.email) ? "checked" : ""} aria-label="Sélectionner ${esc(e.nom)}">` : ""}${avatarP(e.nom)}<span style="flex:1;min-width:0">${esc(e.nom)}${S.prof ? `<small class="muted" style="display:block;overflow-wrap:anywhere">${esc(e.email)}</small>` : ""}</span>${S.prof ? `<div class="dd kebab"><button class="ib sm" data-act="menu" data-m="p${esc(e.email)}" aria-label="Options">${icon("more")}</button>${S.menu === "p" + e.email ? `<div class="dd-menu"><a href="#" data-act="maileleve" data-e="${esc(e.email)}">${icon("mail")} Envoyer un e-mail</a><a href="#" data-act="renomeleve" data-e="${esc(e.email)}" data-n="${esc(e.nom)}">${icon("edit")} Modifier le nom</a><a href="#" data-act="autrescours" data-c="${esc(c.id)}" data-e="${esc(e.email)}">${icon("plus")} Ajouter à un autre cours</a><a href="#" data-act="retirer" data-e="${esc(e.email)}" data-n="${esc(e.nom)}" data-c="${esc(c.id)}" style="color:var(--bad)">${icon("trash")} Retirer de la classe</a></div>` : ""}</div>` : ""}</div>`).join("")
      : `<p class="empty">${S.prof ? "Aucun élève inscrit. Ajoute-les en collant ta liste (bouton « Ajouter des élèves »), ou envoie-leur le lien d'invitation." : "Aucun élève."}</p>`}
    </section>${pageFoot()}</div>`;
}
function composeBox(list){
  return `<div class="box" style="margin:12px 0"><div class="boxhead"><h3>Nouvel e-mail</h3><button class="ib" data-act="closecompose" aria-label="Fermer">${icon("x")}</button></div>
    <div class="field"><label>À (${list.length})</label><div class="att">${list.map(e => `<span class="f">${esc(e.nom)}</span>`).join("")}</div></div>
    <div class="field"><label for="cSub">Objet</label><input id="cSub" value="${esc(S.cSub)}"></div>
    <div class="field"><label for="cBody">Message</label><textarea id="cBody">${esc(S.cBody)}</textarea></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><a class="btn" id="olk" href="${esc(outlookLink(list.map(e => e.email), S.cSub, S.cBody))}" target="_blank" rel="noopener">${icon("mail")} Ouvrir dans Outlook</a><button class="btn ghost" data-act="copymails">Copier les adresses</button></div>
    <p class="muted" style="margin:0;font-size:.8rem">Outlook s'ouvre avec les destinataires, l'objet et le message remplis : tu vérifies et tu cliques sur Envoyer.</p></div>`;
}
const outlookLink = (mails, sub, body) => "https://outlook.office.com/mail/deeplink/compose?to=" + encodeURIComponent(mails.join(";")) + "&subject=" + encodeURIComponent(sub || "") + "&body=" + encodeURIComponent(body || "");

/* ---------- Notes (carnet de notes) ---------- */
function vNotes(c, data){
  const cols = [
    ...S.devoirs.filter(d => d.classe_id === c.id && d.points != null && !d.brouillon).map(d => ({k:"d", o:d, date:D(d.publie_le)})),
    ...S.quiz.filter(q => q.classe_id === c.id && q.mode === "note" && !q.brouillon).map(q => ({k:"q", o:q, date:D(q.publie_le)}))
  ].sort((a, b) => b.date - a.date);
  const el = data.eleves;
  if (!cols.length || !el.length) return `<div class="page">${`<div class="emptystate"><b>${!el.length ? "Aucun élève dans ce cours." : "Aucun travail noté pour l'instant."}</b><span>${!el.length ? "Les élèves apparaîtront ici dès qu'ils auront rejoint le cours avec le code." : "Les devoirs notés et les questionnaires notés apparaîtront ici en colonnes."}</span></div>`}${pageFoot()}</div>`;
  const uidDe = email => Object.keys(S.profils).find(id => S.profils[id] === email);
  const cell = (col, e) => {
    if (col.k === "q") { const uid = uidDe(e.email), r = uid && resultatDe(col.o, uid); return r ? `<td class="cell"><span class="nv">${fmtNote(noteQuiz(col.o, r))}</span><span class="muted">/${col.o.points}</span></td>` : `<td class="cell"><span class="s muted">Non fait</span></td>`; }
    const d = col.o; if (d.eleves && !d.eleves.includes(e.email)) return `<td class="cell na"></td>`;
    const r = renduDe(d, e.email), cr = correctionDe(r);
    if (!r) return `<td class="cell">${ouvert(d) ? "" : `<span class="s" style="color:var(--bad)">Manquant</span>`}</td>`;
    return `<td class="cell"><input class="gin" data-act="note" data-rendu="${r.id}" data-max="${d.points}" value="${cr && cr.note != null ? fmtNote(cr.note) : ""}" placeholder="__" aria-label="Note de ${esc(e.nom)}"><span class="muted">/${d.points}</span><span class="s ${cr && cr.publiee ? "" : "draftnote"}">${cr && cr.note != null ? (cr.publiee ? "" : "Brouillon") : "Rendu"}</span></td>`;
  };
  const moyEleve = e => moyenneDe(c, e.email, uidDe(e.email), false).moy;
  const moyCol = col => { const v = el.map(e => { if (col.k === "q") { const uid = uidDe(e.email), r = uid && resultatDe(col.o, uid); return r ? noteQuiz(col.o, r) : null; } const cr = correctionDe(renduDe(col.o, e.email)); return cr && cr.note != null ? Number(cr.note) : null; }).filter(x => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
  return `<div class="page wide" style="--c:var(${C(c.couleur).c})"><div class="homehead"><span></span><button class="btn ghost sm" data-act="exportnotes" data-c="${esc(c.id)}">${icon("down")} Exporter les notes (Excel)</button></div><div class="tablewrap"><table class="gradebook">
    <thead><tr><th class="first"><span class="muted">Élèves (${el.length})</span></th>${cols.map(col => `<th><small class="muted">${col.o.date_limite ? fmtShort(D(col.o.date_limite)) : "Aucune date limite"}</small><a href="${col.k === "d" ? "#/devoir/" + col.o.id : "#/quiz/" + col.o.id}">${esc(col.o.titre)}</a><small class="muted">sur ${col.o.points}${col.o.categorie ? " · " + esc(col.o.categorie) : ""}</small>
      ${col.k === "d" ? `<div class="dd kebab"><button class="ib sm" data-act="menu" data-m="g${col.o.id}" aria-label="Options de la colonne">${icon("more")}</button>${S.menu === "g" + col.o.id ? `<div class="dd-menu"><a href="#" data-act="rendretout" data-d="${col.o.id}">${icon("send")} Rendre toutes les notes</a><a href="#/devoir/${col.o.id}">${icon("devoir")} Ouvrir le devoir</a></div>` : ""}</div>` : ""}</th>`).join("")}<th>Moyenne<small class="muted">sur 20${(c.categories || []).length ? " · pondérée" : ""}</small></th></tr></thead>
    <tbody><tr class="avg"><td class="first">${icon("people")} Moyenne de la classe</td>${cols.map(col => `<td class="cell">${fmtNote(moyCol(col) == null ? null : Math.round(moyCol(col) * 10) / 10)}</td>`).join("")}<td class="cell"></td></tr>
    ${el.map(e => `<tr><td class="first"><span class="who2">${avatarP(e.nom, "sm")}${esc(e.nom)}</span></td>${cols.map(col => cell(col, e)).join("")}<td class="cell"><b>${fmtNote(moyEleve(e) == null ? null : Math.round(moyEleve(e) * 10) / 10)}</b></td></tr>`).join("")}
    </tbody></table></div>
    <p class="muted" style="margin:0;font-size:.85rem">Saisis une note directement dans une case : elle reste en <b>brouillon</b> (invisible pour l'élève) jusqu'à ce que tu cliques sur ⋮ → <b>Rendre toutes les notes</b> en haut de la colonne, ou sur « Rendre » dans le devoir.</p>${pageFoot()}</div>`;
}

/* ---------- Mes notes (élève) ---------- */
function vMesNotes(c){
  const lignes = [
    ...S.devoirs.filter(d => d.classe_id === c.id && !d.brouillon).map(d => { const e = etat(d, moi()); return { date: D(d.publie_le), titre: d.titre, href: "#/devoir/" + d.id, ic: d.type === "question" ? "question" : "devoir",
      statut: e.t === "Rendu" && d.type === "question" ? "Envoyée" : e.t, k: e.k, note: e.t === "Noté" && e.note != null && d.points != null ? fmtNote(e.note) + "/" + d.points : d.points == null ? "Non noté" : "—", com: e.t === "Noté" && e.c ? e.c.commentaire : "", due: d.date_limite ? dueOf(d).replace("Échéance : ", "") : "" }; }),
    ...S.quiz.filter(q => q.classe_id === c.id && !q.brouillon && q.mode === "note").map(q => { const r = resultatDe(q, S.user.id), ferme = q.date_limite && D(q.date_limite) <= now();
      return { date: D(q.publie_le), titre: q.titre, href: "#/quiz/" + q.id, ic: "quiz", statut: r ? "Noté" : ferme ? "Manquant" : "Attribué", k: r ? "ok" : ferme ? "bad" : "", note: r ? fmtNote(noteQuiz(q, r)) + "/" + q.points : "—", com: "", due: q.date_limite ? dueTxt(D(q.date_limite)).replace("Échéance : ", "") : "" }; })
  ].sort((a, b) => b.date - a.date);
  const moy = c.moyenne_visible ? moyenneEleve(c) : null, md = c.moyenne_visible ? moyenneDe(c, moi(), S.user.id, true) : { parCat: [] };
  return `<div class="page" style="max-width:860px;--c:var(${C(c.couleur).c})">
    <div class="mesnotes-head"><div class="who2">${avatarP(S.nom, "lg")}<div><b style="font-size:1.2rem">${esc(S.nom)}</b><small class="muted" style="display:block">${esc(moi())}</small></div></div>
      ${c.moyenne_visible ? `<div class="grade">${moy == null ? "–" : fmtNote(moy)}<small>/20</small></div>` : ""}</div>
    ${md.parCat.length ? `<div class="chips">${md.parCat.map(x => `<span class="chip static">${esc(x.nom)} · coef ${fmtNote(x.coef)} : <b>${fmtNote(arrondi1(x.moy))}</b>/20</span>`).join("")}</div>` : ""}
    ${lignes.length ? `<section class="group">${lignes.map(l => `<div class="work"><a class="workrow" href="${l.href}" style="padding:12px 18px;gap:16px"><span class="ico">${icon(l.ic, "")}</span><span class="tt">${esc(l.titre)}<br><small class="muted" style="font-weight:400">${l.due ? esc(l.due) + " · " : ""}<span class="pill ${l.k}">${esc(l.statut)}</span></small>${l.com ? `<small class="muted" style="display:block;font-weight:400">${icon("comment")} ${esc(l.com)}</small>` : ""}</span><span class="dt mono">${esc(l.note)}</span></a></div>`).join("")}</section>`
      : `<div class="emptystate"><b>Aucun travail pour l'instant.</b><span>Tes devoirs, questions et questionnaires notés apparaîtront ici avec tes notes.</span></div>`}
    ${tableCompetencesEleve(c.id, moi())}
    ${pageFoot()}</div>`;
}
function vClasse(r, data){
  const c = cls(r.a); if (!c) return `<div class="page"><div class="emptystate"><b>Cours introuvable.</b><a href="#/">Retour à l'accueil</a></div></div>`;
  let tab = ["flux", "travaux", "personnes", "notes"].concat(S.prof ? ["corriger"] : []).includes(r.t) ? r.t : (fluxVisible(c) ? "flux" : "travaux");
  if (tab === "flux" && !fluxVisible(c)) tab = "travaux";
  const inner = tab === "flux" ? vFlux(c, data) : tab === "personnes" ? vPersonnes(c, data) : tab === "notes" ? (S.prof ? vNotes(c, data) : vMesNotes(c)) : tab === "corriger" ? vCorrigerClasse(c) : vTravaux(c, data);
  return classTabs(c, tab) + inner;
}
/* ---------- commentaires privés ---------- */
const cpKey = (did, email) => did + "|" + email;
async function chargerCP(did, email, force){
  const k = cpKey(did, email); S.cp = S.cp || {};
  if (S.cp[k] && !force) return S.cp[k];
  const { data, error } = await sb.from("commentaires_prives").select("*").eq("devoir_id", did).eq("eleve_email", email).order("cree_le");
  return S.cp[k] = error ? [] : data;
}
function vCP(did, email){
  const list = (S.cp || {})[cpKey(did, email)] || [];
  return `<div class="yourwork"><header><h2 style="font-size:1rem">${icon("comment")} Commentaires privés</h2></header>
    ${list.map(x => `<div class="com">${avatarP(x.auteur_nom, "sm")}<div style="flex:1;min-width:0"><b>${esc(x.auteur_nom)}</b> <small class="muted">${fmtQuand(D(x.cree_le))}</small><div>${linkify(x.texte)}</div></div></div>`).join("") || `<span class="muted" style="font-size:.85rem">${S.prof ? "Aucun échange avec cet élève." : "Pose une question à ton professeur : seul lui verra ce message."}</span>`}
    <div class="comform"><input id="cpIn" placeholder="${S.prof ? "Écrire à l'élève…" : "Écrire au professeur…"}" aria-label="Commentaire privé"><button class="ib" data-act="cpsend" data-d="${did}" data-e="${esc(email)}" aria-label="Envoyer">${icon("send")}</button></div></div>`;
}

/* ---------- devoir côté élève ---------- */
function vDevoir(r){
  const d = S.devoirs.find(x => String(x.id) === r.a);
  if (!d) return `<div class="page"><div class="emptystate"><b>Devoir introuvable.</b><a href="#/">Retour à l'accueil</a></div></div>`;
  const c = cls(d.classe_id), k = C(c && c.couleur);
  if (S.prof) return vDevoirProf(d, c);
  const e = etat(d, moi()), rd = e.r, open = depotOuvert(d), isQ = d.type === "question", Q = d.question || {};
  let work;
  if (isQ) work = travailQuestion(d, c, e, rd, open, Q);
  else if (rd) {
    work = `<ul class="files">${(rd.fichiers || []).map(f => f.od ? `<li><a href="${esc(f.od.web)}" target="_blank" rel="noopener">${icon("file")} ${esc(f.nom)}</a></li>` : `<li><a href="#" data-act="openfile" data-bucket="rendus" data-path="${esc(f.chemin)}">${icon("file")} ${esc(f.nom)}</a>${btnDl("rendus", f.chemin, f.nom)}</li>`).join("")}${rd.lien ? `<li><a href="${esc(rd.lien)}" target="_blank" rel="noopener">${icon("links")} ${esc(rd.lien)}</a></li>` : ""}</ul>
      ${rd.binome_email ? `<p style="margin:0;font-size:.85rem">Rendu en binôme avec <b>${esc(nomDe(c.id, rd.auteur_email === moi() ? rd.binome_email : rd.auteur_email))}</b></p>` : ""}
      <p class="muted" style="margin:0;font-size:.8rem">Rendu le ${fmtShort(D(rd.rendu_le))} à ${fmtT(D(rd.rendu_le))}</p>
      ${e.t === "Noté" ? `<div class="grade">${fmtNote(e.note)}<small>/${d.points}</small></div>` : ""}${retourProf(e, d)}
      ${e.t !== "Noté" && open && rd.auteur === S.user.id ? `<button class="btn ghost" data-act="unsubmit" data-id="${rd.id}">Annuler l'envoi</button>` : ""}`;
  } else if (!open) {
    work = `<p style="margin:0" class="muted">${d.accepte === false ? "Ton professeur n'accepte plus de devoirs pour ce travail : le dépôt est verrouillé." : "La date limite est passée : le dépôt est fermé."} Écris un commentaire privé à ton professeur si besoin.</p>`;
  } else {
    const cam = (S.cache[c.id] ? S.cache[c.id].eleves : []).filter(x => x.email !== moi());
    work = `${d.mode === "binome" ? `<div class="field"><label for="partenaire">Mon binôme</label><select id="partenaire"><option value="">Choisir…</option>${cam.map(x => `<option value="${esc(x.email)}" ${S.partenaire === x.email ? "selected" : ""}>${esc(x.nom)}</option>`).join("")}</select></div>` : ""}
      ${copiesEleve("devoir", d.id, moi()).map(x => `<div class="copierow">${icon("edit")}<span>Ta copie modifiable : <b>${esc(x.nom)}</b><small class="muted" style="display:block">Tes modifications sont enregistrées automatiquement et ton professeur les voit.</small></span><a href="${esc(x.web)}" target="_blank" rel="noopener" class="btn ghost sm">Ouvrir</a></div>`).join("")}
      ${S.files.length ? `<ul class="files">${S.files.map((f, i) => `<li><span>${esc(f.name)}</span><span><span class="mono muted">${tailleTxt(f.size)}</span> <button data-act="rmfile" data-i="${i}" aria-label="Retirer ${esc(f.name)}">✕</button></span></li>`).join("")}</ul>` : ""}
      ${S.lienOpen ? `<div class="field"><label for="lien">Lien (OneDrive, vidéo…)</label><input id="lien" type="url" placeholder="https://…" value="${esc(S.lien)}"></div>` : ""}
      <div class="dd"><button class="btn ghost" data-act="menu" data-m="ajouter" style="width:100%">${icon("plus")} Ajouter ou créer</button>${S.menu === "ajouter" ? `<div class="dd-menu" style="left:0;right:auto;width:100%"><a href="#" data-act="pickfile">${icon("upload")} Fichier</a><a href="#" data-act="lienopen">${icon("links")} Lien</a></div>` : ""}</div>
      <input type="file" id="fileIn" multiple hidden>
      ${!ouvert(d) ? `<p class="notice" style="margin:0;font-size:.85rem">La date limite est passée : ton travail sera marqué <b>en retard</b>.</p>` : ""}
      <div id="depErr" class="err" hidden></div>
      <button class="btn" data-act="submit" data-id="${d.id}" ${S.sending ? "disabled" : ""}>${S.sending ? "Envoi en cours…" : (S.files.length || S.lien ? "Rendre" : "Marquer comme terminé")}</button>
      <p class="muted" style="margin:0;font-size:.78rem">50 Mo maximum par fichier${d.formats ? " · " + esc(d.formats) : ""}</p>`;
  }
  return `<div class="page wide" style="--c:var(${k.c})"><div class="dv">
    <div style="display:grid;gap:16px;min-width:0">
      <div class="dvhead"><span class="ico">${icon(isQ ? "question" : "devoir", "")}</span><div style="flex:1;min-width:0"><h1>${esc(d.titre)}</h1>
        <div class="muted" style="font-size:.88rem;margin-top:4px">${esc(R().prof.nom)} · ${fmtShort(D(d.publie_le))}</div>
        <div class="dvmeta"><b>${pts(d)}</b><span>${dueOf(d)}</span></div></div></div>
      <div class="dvbody">${texteUtile(d.consigne) ? `<div class="richtext">${rich(d.consigne)}</div>` : ""}
        ${isQ ? "" : `<p class="muted" style="margin:0;font-size:.85rem">${d.mode === "binome" ? "Un seul rendu par binôme : la note s'applique aux deux élèves." : "Travail individuel."}</p>`}${ressources(d.ressources, { classe: d.classe_id, devoir: d.id })}</div>
      ${isQ ? reponsesClasse(d, c, rd, Q) : ""}
    </div>
    <aside style="display:grid;gap:16px;align-content:start">
      <div class="yourwork"><header><h2>${isQ ? "Votre réponse" : "Votre travail"}</h2><span class="pill ${e.k}">${e.t === "Rendu" && isQ ? "Envoyée" : e.t}${e.retard ? " en retard" : ""}</span></header>${work}</div>
      ${vCP(d.id, moi())}
    </aside></div>${pageFoot()}</div>`;
}
function travailQuestion(d, c, e, rd, open, Q){
  if (rd) return `<div class="reponse">${linkify(rd.reponse || "")}</div>
    <p class="muted" style="margin:0;font-size:.8rem">Envoyée le ${fmtShort(D(rd.rendu_le))} à ${fmtT(D(rd.rendu_le))}</p>
    ${e.t === "Noté" ? `<div class="grade">${fmtNote(e.note)}<small>/${d.points}</small></div>` : ""}${retourProf(e, d)}
    ${e.t !== "Noté" && open && Q.modifier !== false ? `<button class="btn ghost" data-act="unsubmit" data-id="${rd.id}">Modifier ma réponse</button>` : ""}`;
  if (!open) return `<p style="margin:0" class="muted">${d.accepte === false ? "Ton professeur n'accepte plus de réponses pour cette question." : "La date limite est passée : tu ne peux plus répondre."}</p>`;
  const champ = Q.format === "choix" ? `<div class="qopts" style="padding:0">${(Q.options || []).map(o => `<label class="opt"><input type="radio" name="repQ" data-act="repchoix" value="${esc(o)}" ${S.reponse === o ? "checked" : ""}> ${esc(o)}</label>`).join("")}</div>`
    : `<textarea id="repQ" rows="4" placeholder="Ta réponse" aria-label="Ta réponse">${esc(S.reponse || "")}</textarea>`;
  return `${champ}<div id="depErr" class="err" hidden></div>
    <button class="btn" data-act="submit" data-id="${d.id}" ${S.sending ? "disabled" : ""}>${S.sending ? "Envoi…" : "Rendre"}</button>
    ${Q.voir ? `<p class="muted" style="margin:0;font-size:.78rem">Après ta réponse, tu verras celles de tes camarades.</p>` : ""}`;
}
function reponsesClasse(d, c, rd, Q){
  if (!Q.voir || !rd) return "";
  const autres = S.rendus.filter(r => r.devoir_id === d.id && r.id !== rd.id);
  return `<section class="yourwork"><header><h2 style="font-size:1rem">${icon("people")} Réponses de la classe</h2><span class="muted mono">${autres.length}</span></header>
    ${autres.length ? autres.map(r => `<div class="com">${avatarP(nomDe(c.id, r.auteur_email), "sm")}<div style="flex:1;min-width:0"><b>${esc(nomDe(c.id, r.auteur_email))}</b><div>${linkify(r.reponse || "")}</div></div></div>`).join("") : `<span class="muted" style="font-size:.85rem">Personne d'autre n'a encore répondu.</span>`}</section>`;
}
function syntheseQuestion(d, el){
  const Q = d.question || {}, rs = el.map(e => renduDe(d, e.email)).filter(Boolean);
  if (!rs.length) return "";
  if (Q.format === "choix") return `<div class="synth">${(Q.options || []).map(o => { const n = rs.filter(r => r.reponse === o).length, p = Math.round(n / rs.length * 100); return `<div class="sbar"><span>${esc(o)}</span><span class="jauge"><i style="width:${p}%"></i></span><b>${n}</b></div>`; }).join("")}</div>`;
  return `<div class="synth">${rs.map(r => `<div class="com"><b style="min-width:120px">${esc(nomDe(d.classe_id, r.auteur_email))}</b><span>${linkify(r.reponse || "")}</span></div>`).join("")}</div>`;
}
const retourProf = (e, d) => (e.t === "Noté" ? badgesCompetences(e.c && e.c.competences) + retourFichiers(e.c) : "") + (e.t === "Noté" && d ? grilleEleve(d, e.c) : "") + (e.t === "Noté" && e.c && e.c.commentaire ? `<div class="retour"><b>${icon("comment")} Commentaire de ${esc(R().prof.nom)}</b><div>${linkify(e.c.commentaire)}</div></div>` : "");
const tailleTxt = b => b > 1e6 ? (b / 1e6).toFixed(1).replace(".", ",") + " Mo" : Math.max(1, Math.round(b / 1e3)) + " Ko";
const safeName = n => n.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9._-]+/g, "_").slice(-80);
const nomDe = (cid, email) => ((inscritsDe(cid).find(x => x.email === email) || {}).nom) || nomDepuisEmail(email);

async function rendreDevoir(d){
  const err = document.getElementById("depErr"), fail = m => { S.sending = false; render().then(() => { const x = document.getElementById("depErr"); if (x) { x.hidden = false; x.textContent = m; } }); };
  if (!depotOuvert(d)) return fail(d.accepte === false ? "Ton professeur n'accepte plus de devoirs pour ce travail." : "La date limite est passée.");
  if (d.type === "question") {
    const rep2 = (S.reponse || "").trim(); if (!rep2) return fail("Écris ou choisis ta réponse avant de rendre.");
    S.sending = true; render();
    const { error } = await sb.from("rendus").insert({ devoir_id: d.id, auteur: S.user.id, auteur_email: moi(), fichiers: [], reponse: rep2 });
    if (error) return fail("Envoi impossible : " + error.message);
    S.reponse = ""; S.sending = false; await rafraichir(); render(); toast("Réponse envoyée"); celebrer("Réponse envoyée !"); return;
  }
  if (d.mode === "binome" && !S.partenaire) return fail("Choisis ton binôme avant de rendre.");
  if (S.lien && !/^https:\/\//.test(S.lien)) return fail("Le lien doit commencer par https://");
  S.sending = true; render();
  const fichiers = [];
  for (const f of S.files) {
    const chemin = d.id + "/" + S.user.id + "/" + Date.now() + "-" + safeName(f.name);
    const { error } = await sb.storage.from("rendus").upload(chemin, f);
    if (error) { if (fichiers.length) await sb.storage.from("rendus").remove(fichiers.map(x => x.chemin)); return fail("Envoi de « " + f.name + " » impossible : " + error.message); }
    fichiers.push({ chemin, nom: f.name, taille: f.size });
  }
  const { error } = await sb.from("rendus").insert({ devoir_id: d.id, auteur: S.user.id, auteur_email: moi(), binome_email: d.mode === "binome" ? S.partenaire : null, fichiers, lien: S.lien || null });
  if (error) { if (fichiers.length) await sb.storage.from("rendus").remove(fichiers.map(x => x.chemin)); return fail(/row-level|policy/i.test(error.message) ? "Rendu impossible : le dépôt est fermé, ou ton binôme a déjà rendu ce devoir." : "Rendu impossible : " + error.message); }
  S.files = []; S.lien = ""; S.lienOpen = false; S.partenaire = ""; S.sending = false;
  await rafraichir(); render(); toast("Devoir rendu"); celebrer("Devoir rendu !");
}

/* ---------- devoir côté professeur ---------- */
function vDevoirProf(d, c){
  const k = C(c && c.couleur), ptab = S.ptab || "travaux", isQ = d.type === "question";
  const el = elevesDuDevoir(d, (S.cache[c.id] || {eleves:[]}).eleves);
  const sel = S.sel && el.some(e => e.email === S.sel) ? S.sel : null;
  const tabs = `<div class="tabsbar" style="--c:var(${k.c})"><div class="tabs" role="tablist"><button role="tab" aria-selected="${ptab === "instructions"}" data-act="ptab" data-t="instructions">Instructions</button><button role="tab" aria-selected="${ptab === "travaux"}" data-act="ptab" data-t="travaux">Travaux des élèves</button></div>
    <div class="tabicons">${isQ ? "" : `<button class="ib" data-act="dmnew" data-d="${d.id}" title="Demande au préparateur" aria-label="Demande de matériel au préparateur">${icon("flask")}</button>`}<a class="ib" href="#/editer/${isQ ? "question" : "devoir"}/${d.id}" title="Modifier" aria-label="Modifier">${icon("edit")}</a></div></div>`;
  if (ptab === "instructions") {
    return tabs + `<div class="page wide" style="--c:var(${k.c})"><div class="dvhead"><span class="ico">${icon(isQ ? "question" : "devoir", "")}</span><div style="flex:1;min-width:0"><h1>${esc(d.titre)}</h1>
      <div class="muted" style="font-size:.88rem;margin-top:4px">${esc(R().prof.nom)} · ${fmtShort(D(d.publie_le))}${d.brouillon ? " · <i>Brouillon</i>" : ""}${d.eleves ? " · attribué à " + d.eleves.length + " élève" + (d.eleves.length > 1 ? "s" : "") : ""}</div>
      <div class="dvmeta"><b>${pts(d)}</b><span>${dueOf(d)}</span></div></div></div>
      <div class="dvbody">${texteUtile(d.consigne) ? `<div class="richtext">${rich(d.consigne)}</div>` : ""}${isQ ? `<p class="muted" style="margin:0;font-size:.85rem">${(d.question || {}).format === "choix" ? "Choix multiple : " + (d.question.options || []).map(esc).join(" · ") : "Réponse courte."}${(d.question || {}).voir ? " Les élèves voient les réponses de la classe." : ""}${(d.question || {}).modifier === false ? " Réponse non modifiable." : ""}</p>` : `<p class="muted" style="margin:0;font-size:.85rem">${d.mode === "binome" ? "Un rendu par binôme." : "Individuel."}${d.formats ? " Formats : " + esc(d.formats) + "." : ""}</p>`}${ressources(d.ressources, { classe: d.classe_id, devoir: d.id })}</div>${pageFoot()}</div>`;
  }
  const rendusE = el.filter(e => renduDe(d, e.email)), autres = el.filter(e => !renduDe(d, e.email));
  const noteDe = e => { const cr = correctionDe(renduDe(d, e.email)); return cr && cr.note != null ? fmtNote(cr.note) : "__"; };
  const row = e => { const s = etat(d, e.email), cr = correctionDe(renduDe(d, e.email)); return `<button class="st" data-act="sel" data-n="${esc(e.email)}" aria-current="${sel === e.email}">${avatarP(e.nom, "sm")}<span class="nm">${esc(e.nom)}<small style="color:var(--${s.k === "bad" ? "bad" : s.k === "info" ? "accent" : "muted"})">${cr && cr.note != null && !cr.publiee ? "Brouillon" : s.t}${s.retard ? " · en retard" : ""}</small></span>${d.points != null ? `<span class="nt">${noteDe(e)}<span class="muted">/${d.points}</span></span>` : ""}</button>`; };
  let detail;
  if (!sel) {
    detail = `<h2 style="font-size:1.3rem">${esc(d.titre)}</h2>${statsDevoir(d)}${statsAvancees(d)}
      <label class="accepte"><input type="checkbox" data-accepte="${d.id}" ${d.accepte !== false ? "checked" : ""}><i></i><span>${d.accepte !== false ? "Devoirs acceptés" : "Devoirs non acceptés"}</span>
        <span class="info" title="Quand les devoirs ne sont pas acceptés, les élèves ne peuvent plus rendre leur travail ni annuler leur envoi. Tu peux rouvrir la remise à tout moment.">${icon("question")}</span></label>
      ${d.accepte === false ? `<p class="muted" style="margin:-6px 0 0;font-size:.85rem">La remise est verrouillée : les élèves voient « Ton professeur n'accepte plus de devoirs pour ce travail ».</p>` : ""}
      <p class="muted" style="margin:0">${d.date_limite ? (ouvert(d) ? "Dépôt ouvert jusqu'au " + fmtD(D(d.date_limite)) + " à " + fmtT(D(d.date_limite)) + "." : "Dépôt fermé depuis le " + fmtD(D(d.date_limite)) + ".") : "Aucune date limite."}</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap">${d.points != null && aCorriger(d) ? `<button class="btn" data-act="rendretout" data-d="${d.id}">${icon("send")} Rendre toutes les notes saisies</button>` : ""}
      ${autres.length ? `<button class="btn ghost" data-act="mailmissing" data-d="${d.id}">${icon("mail")} Écrire aux ${autres.length} élève${autres.length > 1 ? "s" : ""} qui n'${autres.length > 1 ? "ont" : "a"} pas rendu</button>` : ""}</div>
      ${S.compose ? composeBox(el.filter(e => S.pick.has(e.email))) : ""}
      ${isQ ? syntheseQuestion(d, el) : ""}
      ${odActif() && !isQ && rendusE.length ? `<div><button class="btn ghost sm" data-act="odrendus" data-d="${d.id}">${icon("nuage")} Copier les travaux rendus dans OneDrive</button></div>` : ""}
      <p style="margin:0">Choisis un élève dans la liste pour ouvrir ${isQ ? "sa réponse" : "son travail"} et le noter.</p>`;
  } else {
    const e = el.find(x => x.email === sel), rd = renduDe(d, sel), cr = correctionDe(rd);
    detail = `${barreCorrection()}<div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center"><h2 style="font-size:1.35rem">${esc(e.nom)}${rd && rd.binome_email ? ` <span class="muted" style="font-size:.95rem">avec ${esc(nomDe(c.id, rd.auteur_email === sel ? rd.binome_email : rd.auteur_email))}</span>` : ""}</h2><span class="pill ${etat(d, sel).k}">${etat(d, sel).t}</span></div>
      ${rd ? `<p class="muted" style="margin:0;font-size:.85rem">Rendu le ${fmtD(D(rd.rendu_le))} à ${fmtT(D(rd.rendu_le))}${enRetard(d, rd) ? ` <span class="pill bad">en retard</span>` : ""}</p>
        ${isQ ? `<div class="reponse">${linkify(rd.reponse || "")}</div>` : `<div class="att">${(rd.fichiers || []).map((f, fj) => `<a href="#" data-act="voir" data-d="${d.id}" data-e="${esc(sel)}" data-i="${fj}"><span class="k">${esc((f.nom.split(".").pop() || "").slice(0, 5))}</span>${esc(f.nom)}</a>`).join("")}${rd.lien ? `<a href="${esc(rd.lien)}" target="_blank" rel="noopener"><span class="k">lien</span>${esc(rd.lien.replace(/^https?:\/\//, "").slice(0, 40))}</a>` : ""}${!(rd.fichiers || []).length && !rd.lien ? `<span class="muted">Marqué comme terminé, sans fichier joint.</span>` : ""}</div>`}
        ${(rd.fichiers || []).length ? `<div><button class="btn ghost sm" data-act="voir" data-d="${d.id}" data-e="${esc(sel)}" data-i="0">${icon("expand")} Ouvrir dans la visionneuse</button></div>` : ""}
        ${blocNotation(d, rd, cr)}`
      : `<p class="muted" style="margin:0">${ouvert(d) ? "Cet élève n'a pas encore rendu son travail." : "Cet élève n'a rien rendu avant la date limite."}</p>`}
      ${copiesEleve("devoir", d.id, sel).length ? `<div class="copierow" style="flex-direction:column;align-items:stretch">${copiesEleve("devoir", d.id, sel).map(x => `<div style="display:flex;gap:8px;align-items:center">${icon("edit")}<span style="flex:1">Copie de l'élève : <b>${esc(x.nom)}</b></span><a href="${esc(x.web)}" target="_blank" rel="noopener" class="btn ghost sm">Ouvrir</a></div>`).join("")}</div>` : ""}
      ${vCP(d.id, sel)}`;
  }
  /* filtre (Tous / Remis / Attribués / Notés / À noter) et tri (statut, nom de famille, prénom), comme Classroom */
  const filtre = S.swFiltre || "tous", tri = S.swTri || "statut", lblA = ouvert(d) ? "Attribués" : "Manquants";
  const grp = e => { const s = etat(d, e.email); return s.t === "Noté" ? "notes" : s.r ? "remis" : "attribues"; };
  const passe = e => filtre === "tous" || (filtre === "anoter" ? grp(e) === "remis" : grp(e) === filtre);
  const vus = el.filter(passe), vide = `<p class="empty" style="padding:4px 16px">Aucun</p>`;
  let liste;
  if (tri === "statut") liste = [["remis", "Remis"], ["attribues", lblA], ["notes", "Notés"]].map(([g, t]) => { const l = vus.filter(e => grp(e) === g); return filtre !== "tous" && !l.length ? "" : `<h4>${t} (${l.length})</h4>${l.map(row).join("") || vide}`; }).join("");
  else { const cle = tri === "nom" ? e => cleNom(e.nom).nom + " " + cleNom(e.nom).prenom : e => cleNom(e.nom).prenom + " " + cleNom(e.nom).nom;
    liste = `<h4>${vus.length} élève${vus.length > 1 ? "s" : ""}</h4>${vus.slice().sort((a, b) => cle(a).localeCompare(cle(b), "fr")).map(row).join("") || vide}`; }
  const outils = `<div class="swtools">
      <select data-swf="1" aria-label="Filtrer les élèves">${[["tous", "Tous"], ["remis", "Remis"], ["attribues", lblA], ["notes", "Notés"]].map(([v, t]) => `<option value="${v}" ${filtre === v || (filtre === "anoter" && v === "remis") ? "selected" : ""}>${t}</option>`).join("")}</select>
      <select data-swt="1" aria-label="Trier les élèves">${[["nom", "Trier par nom de famille"], ["prenom", "Trier par prénom"], ["statut", "Trier par statut"]].map(([v, t]) => `<option value="${v}" ${tri === v ? "selected" : ""}>${t}</option>`).join("")}</select></div>`;
  return tabs + `<div class="page wide" style="--c:var(${k.c})">
    <div class="sw"><div class="list">${outils}<button class="st" data-act="sel" data-n="" aria-current="${!sel}"><span class="nm"><b>Tous les élèves</b></span></button>
      ${liste}</div>
    <div class="detail">${detail}</div></div>${pageFoot()}</div>`;
}

/* nom de famille / prénom : mot(s) en MAJUSCULES = nom de famille ; sinon le 1er mot est le prénom */
function cleNom(n){
  const w = String(n || "").trim().split(/\s+/).filter(Boolean), up = w.filter(x => x.length > 1 && x === x.toUpperCase() && /\p{L}/u.test(x));
  if (up.length && up.length < w.length) return { nom: up.join(" ").toLowerCase(), prenom: w.filter(x => !up.includes(x)).join(" ").toLowerCase() };
  return { prenom: (w[0] || "").toLowerCase(), nom: w.slice(1).join(" ").toLowerCase() };
}
/* ---------- à corriger d'un seul cours (onglet du cours, vue prof) ---------- */
function vCorrigerClasse(c){
  const ds = S.devoirs.filter(d => d.classe_id === c.id && !d.brouillon).slice().reverse();
  const tri = ds.filter(d => aCorriger(d) > 0).concat(ds.filter(d => !(aCorriger(d) > 0)));
  const total = ds.reduce((a, d) => a + aCorriger(d), 0);
  return `<div class="page" style="max-width:860px;--c:var(${C(c.couleur).c})">${ds.length ? `<section class="group"><header><span style="color:var(--c)">${total ? `${total} copie${total > 1 ? "s" : ""} à corriger` : "Tout est corrigé ✓"}</span><span class="muted mono">${ds.length} devoir${ds.length > 1 ? "s" : ""}</span></header>
      ${tri.map(d => `<div class="work"><a class="workrow" href="#/devoir/${d.id}" style="padding:12px 18px;gap:16px"><span class="ico">${icon("devoir", "")}</span><span class="tt">${esc(d.titre)}<br><small class="muted" style="font-weight:400">${dueOf(d)}</small></span>${statsDevoir(d, false)}</a></div>`).join("")}</section>`
    : `<div class="emptystate"><b>Aucun devoir dans ce cours pour l'instant.</b></div>`}${pageFoot()}</div>`;
}
/* ---------- à faire / à corriger ---------- */
function vTodo(){
  if (S.prof) {
    const parClasse = actives().map(c => ({c, ds:S.devoirs.filter(d => d.classe_id === c.id && !d.brouillon).slice().reverse()})).filter(x => x.ds.length);
    return `<div class="page"><h1 style="font-size:1.6rem">À corriger</h1>${parClasse.length ? `<div class="todo">${parClasse.map(({c, ds}) => `<section class="group" style="--c:var(${C(c.couleur).c})"><header><span style="color:var(--c)">${esc(c.nom)}</span><span class="muted mono">${ds.reduce((a, d) => a + aCorriger(d), 0)} à corriger</span></header>
      ${ds.map(d => `<div class="work"><a class="workrow" href="#/devoir/${d.id}" style="padding:12px 18px;gap:16px"><span class="ico">${icon("devoir", "")}</span><span class="tt">${esc(d.titre)}<br><small class="muted" style="font-weight:400">${dueOf(d)}</small></span>${statsDevoir(d, false)}</a></div>`).join("")}</section>`).join("")}</div>` : `<div class="emptystate"><b>Aucun devoir pour l'instant.</b></div>`}${pageFoot()}</div>`;
  }
  const q = S.quiz.filter(x => x.mode === "note" && cls(x.classe_id) && !cls(x.classe_id).archive);
  const dv = S.devoirs.filter(d => cls(d.classe_id) && !cls(d.classe_id).archive);
  const groups = {
    attribues: [...dv.filter(d => etat(d, moi()).t === "Attribué").map(d => ({d})), ...q.filter(x => !resultatDe(x, S.user.id) && (!x.date_limite || D(x.date_limite) > now())).map(x => ({q:x}))],
    manquants: [...dv.filter(d => etat(d, moi()).t === "Manquant").map(d => ({d})), ...q.filter(x => !resultatDe(x, S.user.id) && x.date_limite && D(x.date_limite) <= now()).map(x => ({q:x}))],
    termines: [...dv.filter(d => ["Rendu", "Noté"].includes(etat(d, moi()).t)).map(d => ({d})), ...q.filter(x => resultatDe(x, S.user.id)).map(x => ({q:x}))]
  };
  const L = {attribues:"Attribués", manquants:"Manquants", termines:"Terminés"}, list = groups[S.todoTab];
  const ligne = it => { const o = it.d || it.q, c = cls(o.classe_id); let right;
    if (it.d) { const e = etat(o, moi()); right = e.t === "Noté" ? `<span class="mono" style="color:var(--ink)">${fmtNote(e.note)}/${o.points}</span>` : e.t === "Rendu" ? "Rendu" : dueOf(o).replace("Échéance : ", "") + (e.t === "Attribué" ? relEch(o.date_limite) : ""); }
    else { const r = resultatDe(o, S.user.id); right = r ? `<span class="mono" style="color:var(--ink)">${fmtNote(noteQuiz(o, r))}/${o.points}</span>` : o.date_limite ? dueTxt(D(o.date_limite)).replace("Échéance : ", "") + relEch(o.date_limite) : "Aucune date limite"; }
    return `<div class="work" style="--c:var(${C(c && c.couleur).c})"><a class="workrow" href="${it.d ? "#/devoir/" : "#/quiz/"}${o.id}" style="padding:12px 18px;gap:16px"><span class="ico">${icon(it.d ? "devoir" : "quiz", "")}</span><span class="tt">${esc(o.titre)}<br><small class="muted" style="font-weight:400">${esc(c ? c.nom : "")}</small></span><span class="dt">${right}</span></a></div>`; };
  return `<div class="tabsbar" style="--c:var(--accent)"><div class="tabs" role="tablist">${Object.keys(L).map(k => `<button role="tab" aria-selected="${S.todoTab === k}" data-act="todotab" data-t="${k}">${L[k]} <span class="muted mono">${groups[k].length}</span></button>`).join("")}</div></div>
  <div class="page" style="max-width:820px"><section class="group">${list.length ? list.map(ligne).join("") : `<p class="empty" style="padding:24px 18px;margin:0">${S.todoTab === "attribues" ? "Aucun travail à rendre pour le moment." : S.todoTab === "manquants" ? "Aucun travail manquant." : "Aucun travail terminé."}</p>`}</section>${pageFoot()}</div>`;
}

/* ---------- agenda ---------- */
function vAgenda(r){
  const filtre = r && r.a && cls(r.a) ? r.a : "";
  const t = now(), mon = new Date(t); mon.setHours(0, 0, 0, 0); mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7) + S.week * 7);
  const days = [...Array(7)].map((_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return d; });
  const evts = [...S.devoirs.filter(d => d.date_limite && !d.brouillon).map(d => ({d:D(d.date_limite), t:d.titre, c:cls(d.classe_id), href:"#/devoir/" + d.id})),
                ...S.quiz.filter(q => q.date_limite && !q.brouillon).map(q => ({d:D(q.date_limite), t:"Questionnaire · " + q.titre, c:cls(q.classe_id), href:"#/quiz/" + q.id}))].filter(e => e.c && !e.c.archive && (!filtre || e.c.id === filtre));
  return `<div class="page wide"><div class="weekbar"><button class="ib" data-act="week" data-w="-1" aria-label="Semaine précédente">${icon("left")}</button><button class="ib" data-act="week" data-w="1" aria-label="Semaine suivante">${icon("right")}</button>
    <h2>${mon.toLocaleDateString("fr-FR", {day:"numeric", month:"short"})} – ${days[6].toLocaleDateString("fr-FR", {day:"numeric", month:"short", year:"numeric"})}</h2>${S.week ? `<button class="btn ghost sm" data-act="week" data-w="0">Cette semaine</button>` : ""}<span class="spacer"></span>
    <select data-agenda="1" aria-label="Filtrer par cours" class="agsel"><option value="">Tous les cours</option>${actives().map(c => `<option value="${esc(c.id)}" ${c.id === filtre ? "selected" : ""}>${esc(c.nom)}</option>`).join("")}</select></div>
    <div style="overflow-x:auto"><div class="week">${days.map(d => `<div class="day"><div class="dh ${sameDay(d, t) ? "today" : ""}">${d.toLocaleDateString("fr-FR", {weekday:"short"})}<b>${d.getDate()}</b></div>
      ${evts.filter(e => sameDay(e.d, d)).sort((a, b) => a.d - b.d).map(e => `<a class="ev" style="--bb:var(${C(e.c.couleur).b})" href="${e.href}">${esc(e.t)}<small>${esc(e.c.nom)} · ${fmtT(e.d)}</small></a>`).join("")}</div>`).join("")}</div></div>${pageFoot()}</div>`;
}
function vOutils(){
  if (S.prof && S.outilsEdit) return `<div class="page"><div class="homehead"><h1 style="font-size:1.6rem">Modifier la boîte à outils</h1></div>${admOutils()}${pageFoot()}</div>`;
  return `<div class="page"><div class="homehead"><h1 style="font-size:1.6rem">Boîte à outils</h1>${S.prof ? `<button class="btn ghost sm" data-act="outilsedit">${icon("edit")} Modifier</button>` : ""}</div>${R().outils.map(g => `<section class="theme" style="--c:var(--${esc(g.couleur)})"><div class="themehead"><h2>${esc(g.matiere)}</h2></div>${g.liens.map(([n, d, u]) => `<div class="work"><a class="workrow" href="${esc(u)}" target="_blank" rel="noopener" style="padding:10px 8px;gap:16px"><span class="ico pale">${icon("links", "")}</span><span class="tt">${esc(n)}<br><small class="muted" style="font-weight:400">${esc(d)}</small></span><span class="muted">↗</span></a></div>`).join("")}</section>`).join("")}${pageFoot()}</div>`;
}
/* ---------- éditeur plein écran : devoir, documentation, questionnaire ---------- */
const typeDeLien = (u, mode) => mode === "youtube" || /youtu\.?be/i.test(u) ? "YouTube" : mode === "onedrive" || /sharepoint\.com|onedrive|1drv\.ms/i.test(u) ? "OneDrive" : "Lien";
const extType = n => { const e = (n.split(".").pop() || "").toUpperCase(); return e.length && e.length <= 5 ? e : "Fichier"; };

async function initEditeur(r){
  const type = ["documentation", "questionnaire", "question"].includes(r.a) ? r.a : "devoir", key = location.hash;
  if (S.ed && S.ed.key === key) return;
  let rec = null, classe = r.x, bonnes = [];
  if (r.t !== "new") {
    if (type === "devoir" || type === "question") rec = S.devoirs.find(d => String(d.id) === r.t);
    else if (type === "questionnaire") {
      rec = S.quiz.find(q => String(q.id) === r.t);
      if (rec) { const { data } = await sb.from("quiz_solutions").select("bonnes").eq("quiz_id", rec.id).maybeSingle(); bonnes = (data && data.bonnes) || []; }
    } else { for (const c of S.classes) { const data = await chargerClasse(c.id); rec = data.supports.find(x => String(x.id) === r.t); if (rec) break; } }
    if (!rec) throw new Error("Élément introuvable.");
    classe = rec.classe_id;
  }
  if (!cls(classe)) classe = (actives()[0] || S.classes[0] || {}).id;
  await chargerClasse(classe);
  const lim = rec && rec.date_limite ? D(rec.date_limite) : (() => { const x = new Date(); x.setDate(x.getDate() + 7); x.setHours(23, 59, 0, 0); return x; })();
  S.ed = { key, type, id: rec ? rec.id : null, classe_id: classe, titre: rec ? rec.titre : "",
    html: rec ? (type === "documentation" ? rec.description : rec.consigne) || "" : "", ressources: rec ? (rec.ressources || []).filter(x => !x.pending || x.pending instanceof Blob) : [], fantomes: rec ? (rec.ressources || []).filter(x => x.pending && !(x.pending instanceof Blob)).map(x => x.label) : [],
    theme_id: rec && rec.theme_id ? String(rec.theme_id) : (S.edTheme || ""), points: rec ? (rec.points == null ? "none" : String(rec.points)) : "20",
    hasDate: rec ? !!rec.date_limite : type !== "documentation", date: ymd(lim), heure: hm(lim), mode: rec ? rec.mode : (type === "questionnaire" ? "note" : "individuel"), formats: rec ? rec.formats || "" : "",
    eleves: rec && rec.eleves ? rec.eleves.slice() : null, montrer: rec ? rec.montrer_correction !== false : true,
    questions: type === "questionnaire" ? (rec ? (rec.questions || []).map((x, i) => { const t = x.t || "choix", b = bonnes[i] ?? null;
      return { q: x.q, t, img: x.img || null, o: t === "courte" || t === "num" ? ["", ""] : (x.o || []).slice(), a: t === "courte" || t === "num" ? null : b, acc: t === "courte" && Array.isArray(b) ? b.join(" ; ") : "",
        num: t === "num" && b && typeof b === "object" ? { v: b.v ?? "", tol: b.tol ?? "5" } : { v: "", tol: "5" } }; }) : [{ q: "", t: "choix", o: ["", ""], a: null, acc: "" }]) : [],
    qformat: rec && rec.question ? rec.question.format || "courte" : "courte", qoptions: rec && rec.question && rec.question.options ? rec.question.options.slice() : ["", ""],
    aussi: [], categorie: rec ? rec.categorie || "" : "", grille: rec && rec.grille ? clone(rec.grille) : [], retard: rec ? !!rec.retard_ok : false, melanger: rec ? !!rec.melanger : false,
    qvoir: rec && rec.question ? !!rec.question.voir : false, qmodif: rec && rec.question ? rec.question.modifier !== false : true,
    aDesResultats: type === "questionnaire" && rec ? S.resultats.some(x => x.quiz_id === rec.id) : false,
    publie: rec ? !rec.brouillon && D(rec.publie_le) <= now() : false, linkMode: null, uploaded: [], toDelete: [], busy: false, err: "" };
  S.edTheme = null;
}

function vEditer(){
  const e = S.ed, c = cls(e.classe_id), k = C(c && c.couleur), data = S.cache[e.classe_id] || {themes:[], eleves:[]};
  const label = {devoir:"Devoir", documentation:"Documentation", questionnaire:"Questionnaire", question:"Question"}[e.type];
  const main = e.publie ? "Enregistrer" : e.type === "devoir" ? "Publier le devoir" : e.type === "questionnaire" ? "Publier le questionnaire" : e.type === "question" ? "Poser la question" : "Publier";
  const isQ = e.type === "question";
  const lm = e.linkMode, lmLabel = {onedrive:"Lien de partage OneDrive", youtube:"Lien de la vidéo YouTube", lien:"Adresse du site"}[lm];
  const nCible = e.eleves ? e.eleves.length : null;
  const dateField = `<div class="field"><label for="edHasDate">Date limite</label><select id="edHasDate" data-f="hasDate"><option value="0" ${e.hasDate ? "" : "selected"}>Aucune date limite</option><option value="1" ${e.hasDate ? "selected" : ""}>Choisir une date</option></select>
      ${e.hasDate ? `<div class="dt2"><input id="edDate" type="date" data-f="date" value="${e.date}" aria-label="Date"><input id="edHeure" type="time" data-f="heure" value="${e.heure}" aria-label="Heure"></div><span class="muted" style="font-size:.78rem">${e.type === "questionnaire" ? "Le questionnaire se fermera à cette heure." : "Le dépôt se fermera automatiquement à cette heure."}</span>` : ""}</div>`;
  return `<div class="edtop" style="--c:var(${k.c})">
    <button class="ib" data-act="edclose" aria-label="Fermer">${icon("x")}</button>
    <span class="ico">${icon(e.type === "devoir" ? "devoir" : e.type === "questionnaire" ? "quiz" : isQ ? "question" : "support", "")}</span><h1>${label}</h1><span class="spacer"></span>
    <button class="btn ghost sm" data-act="symb" data-keepfocus="1" aria-pressed="${!!S.symb}" title="Symboles scientifiques">Ω<span class="lbl"> Symboles</span></button>
    <div class="split dd"><button class="btn" data-act="edsave" data-mode="publish" ${e.busy ? "disabled" : ""}>${e.busy ? "Enregistrement…" : main}</button><button class="btn caret" data-act="menu" data-m="edsave" aria-label="Autres options" ${e.busy ? "disabled" : ""}>▾</button>
      ${S.menu === "edsave" ? `<div class="dd-menu">${e.publie ? "" : `<a href="#" data-act="edprog">Programmer…</a>`}<a href="#" data-act="edsave" data-mode="draft">${e.publie ? "Repasser en brouillon" : "Enregistrer le brouillon"}</a></div>` : ""}</div>
  </div>
  ${S.symb ? `<div class="symbsticky">${paletteSymb()}</div>` : ""}
  <div class="edgrid" style="--c:var(${k.c})">
    <div class="edmain">
      ${e.err ? `<div class="notice" style="background:var(--bad-bg);color:var(--bad)">${esc(e.err)}</div>` : ""}
      ${(e.fantomes || []).length ? `<div class="notice">${e.fantomes.length > 1 ? "Ces fichiers n'avaient" : "Ce fichier n'avait"} pas été envoyé${e.fantomes.length > 1 ? "s" : ""} correctement : <b>${e.fantomes.map(esc).join(", ")}</b>. ${e.fantomes.length > 1 ? "Ils ont été retirés" : "Il a été retiré"} : ajoute-${e.fantomes.length > 1 ? "les" : "le"} à nouveau si besoin.</div>` : ""}
      ${e.aDesResultats ? `<div class="notice">Des élèves ont déjà répondu à ce questionnaire : modifier les questions ou les bonnes réponses ne recalcule pas leurs notes.</div>` : ""}
      <section class="edcard">
        <div class="field"><label for="edTitre">${isQ ? "Question *" : "Titre *"}</label><input id="edTitre" data-f="titre" value="${esc(e.titre)}" placeholder="${e.type === "devoir" ? "ex. Compte rendu du TP titrage" : e.type === "questionnaire" ? "ex. QCM · Les acides et les bases" : isQ ? "ex. Quelle est l'unité de la quantité de matière ?" : "ex. Cours · Les acides et les bases"}"></div>
        <div class="field"><label>${e.type === "documentation" ? "Description" : "Instructions"} <span class="muted">(facultatif)</span></label>
          <div class="rte"><div id="edHtml" class="rtebody" contenteditable="true" role="textbox" aria-multiline="true" data-ph="Ajoute les consignes pour les élèves…">${rich(e.html)}</div><div class="rtebar">${fmtBar()}</div></div></div>
      </section>
      ${e.type === "questionnaire" ? vQuestionsEditeur(e) : ""}
      ${isQ && e.qformat === "choix" ? `<section class="edcard"><h3>Options de réponse</h3><div class="qopts" style="padding:0">${e.qoptions.map((o, j) => `<div class="qopt"><span class="muted mono">${j + 1}</span><input class="otext qoinput" data-qo="${j}" value="${esc(o)}" placeholder="Option ${j + 1}" aria-label="Option ${j + 1}">${e.qoptions.length > 2 ? `<button class="ib sm" data-act="rmqo" data-i="${j}" aria-label="Supprimer l'option">${icon("x")}</button>` : ""}</div>`).join("")}</div>
        <div><button class="linkbtn" data-act="addqo">${icon("plus")} Ajouter une option</button></div></section>` : ""}
      ${e.type === "questionnaire" ? "" : `<section class="edcard">
        <h3>Joindre</h3>
        <div class="joindre">
          <button data-act="edlink" data-mode="onedrive"><span class="jic" style="color:#0364B8">${icon("nuage")}</span>OneDrive</button>
          <button data-act="edlink" data-mode="youtube"><span class="jic" style="color:#E62117">▶</span>YouTube</button>
          <button data-act="edupload"><span class="jic">${icon("upload")}</span>Importer</button>
          <button data-act="edlink" data-mode="lien"><span class="jic">${icon("links")}</span>Lien</button>
        </div>
        <input type="file" id="edFile" multiple hidden>
        ${lm ? `<div class="linkform"><div class="field"><label for="edLinkUrl">${lmLabel}</label><input id="edLinkUrl" type="url" placeholder="https://…"></div>
          <div class="field"><label for="edLinkLabel">Nom affiché <span class="muted">(facultatif${lm === "youtube" ? " : le titre de la vidéo s'affiche tout seul" : ""})</span></label><input id="edLinkLabel" placeholder="${lm === "youtube" ? "Laisse vide pour le titre de la vidéo" : "ex. Fiche de TP"}"></div>
          <div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn ghost sm" data-act="edlinkcancel">Annuler</button><button class="btn sm" data-act="edlinkadd">Ajouter</button></div>
          ${lm === "onedrive" ? `<p class="muted" style="margin:0;font-size:.8rem">Dans OneDrive : clic droit sur le fichier, « Partager », « Copier le lien ». Vérifie que le lien est accessible aux personnes du lycée.</p>` : ""}</div>` : ""}
        ${e.ressources.length ? `<ul class="files">${e.ressources.map((x, i) => `<li><span><span class="k mono muted">${esc(x.type)}</span> ${esc(x.label)}${x.pending ? ` <small class="muted">· ira dans OneDrive à l'enregistrement</small>` : x.od ? ` <small class="muted">· OneDrive</small>` : ""}</span><button data-act="rmres" data-i="${i}" aria-label="Retirer ${esc(x.label)}">✕</button></li>`).join("")}</ul>` : ""}
      </section>`}
      ${e.type === "devoir" ? `<section class="edcard"><h3>Grille d'évaluation <span class="muted" style="font-weight:400">(facultatif)</span></h3>
        <p class="muted" style="margin:0;font-size:.85rem">Ajoute des critères notés : la note du devoir sera la somme des critères.</p>
        ${e.grille.map((g, i) => `<div class="adrow cat"><input data-gr2="${i}" data-k="c" value="${esc(g.c)}" placeholder="Critère (ex. Rédaction, unités)" aria-label="Critère ${i + 1}"><input data-gr2="${i}" data-k="p" type="number" min="0" step="0.5" value="${esc(g.p)}" aria-label="Points du critère ${i + 1}"><button class="ib sm" data-act="rmgr" data-i="${i}" aria-label="Supprimer le critère">${icon("x")}</button></div>`).join("")}
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button class="linkbtn" data-act="addgr">${icon("plus")} Ajouter un critère</button>${e.grille.length ? `<span class="muted" style="font-size:.85rem">Total : <b>${fmtNote(e.grille.reduce((a, g) => a + (Number(g.p) || 0), 0))}</b> points</span>` : ""}</div></section>` : ""}
    </div>
    <aside class="edside">
      <div class="field"><label for="edClasse">Pour</label><select id="edClasse" data-f="classe_id" ${e.id ? "disabled" : ""}>${actives().map(x => `<option value="${esc(x.id)}" ${x.id === e.classe_id ? "selected" : ""}>${esc(x.nom)}</option>`).join("")}</select></div>
      ${!e.id && actives().length > 1 ? `<details class="aussi" ${e.aussi.length ? "open" : ""}><summary>Publier aussi dans d'autres cours${e.aussi.length ? " (" + e.aussi.length + ")" : ""}</summary>${actives().filter(x => x.id !== e.classe_id).map(x => `<label class="check"><input type="checkbox" class="edAussi" value="${esc(x.id)}" ${e.aussi.includes(x.id) ? "checked" : ""}> ${esc(x.nom)}</label>`).join("")}<small class="muted">Une copie est créée dans chaque cours coché (sans thème, pour tous les élèves).</small></details>` : ""}
      <div class="field"><label>Attribuer à</label><button class="btn ghost" data-act="cible">${icon("people")} ${nCible == null ? "Tous les élèves" : nCible + " élève" + (nCible > 1 ? "s" : "")}</button></div>
      ${isQ ? `<div class="field"><label for="edQformat">Type de question</label><select id="edQformat" data-f="qformat"><option value="courte" ${e.qformat === "courte" ? "selected" : ""}>Réponse courte</option><option value="choix" ${e.qformat === "choix" ? "selected" : ""}>Choix multiple</option></select></div>` : ""}
      ${e.type === "devoir" && e.grille.length ? `<div class="field"><label>Points</label><input value="${fmtNote(e.grille.reduce((a, g) => a + (Number(g.p) || 0), 0))} (grille)" disabled></div>${dateField}` : ""}
      ${(e.type === "devoir" && !e.grille.length) || isQ ? `<div class="field"><label for="edPoints">Points</label><select id="edPoints" data-f="points">${["20","10","100","none"].map(p => `<option value="${p}" ${e.points === p ? "selected" : ""}>${p === "none" ? "Non noté" : p}</option>`).join("")}</select></div>${dateField}` : ""}
      ${e.type === "questionnaire" ? `<div class="field"><label for="edMode">Type</label><select id="edMode" data-f="mode"><option value="note" ${e.mode === "note" ? "selected" : ""}>Noté · une seule tentative</option><option value="entrainement" ${e.mode === "entrainement" ? "selected" : ""}>Entraînement · recommençable</option></select></div>
        ${e.mode === "note" ? `<div class="field"><label for="edPoints">Noté sur</label><select id="edPoints" data-f="points">${["20","10","100"].map(p => `<option value="${p}" ${e.points === p ? "selected" : ""}>${p}</option>`).join("")}</select></div>
        <label class="check"><input type="checkbox" id="edMontrer" ${e.montrer ? "checked" : ""}> Montrer la correction à l'élève après l'envoi</label>` : ""}${dateField}` : ""}
      ${isQ ? `<label class="check"><input type="checkbox" id="edVoir" ${e.qvoir ? "checked" : ""}> Les élèves peuvent voir les réponses de la classe</label><label class="check"><input type="checkbox" id="edModif" ${e.qmodif ? "checked" : ""}> Les élèves peuvent modifier leur réponse</label>` : ""}
      ${(e.type !== "documentation") && (c && (c.categories || []).length) ? `<div class="field"><label for="edCat">Catégorie de note</label><select id="edCat" data-f="categorie"><option value="">Aucune catégorie</option>${c.categories.map(x => `<option value="${esc(x.nom)}" ${e.categorie === x.nom ? "selected" : ""}>${esc(x.nom)} · coef ${fmtNote(x.coef)}</option>`).join("")}</select></div>` : ""}
      ${e.type === "devoir" && e.hasDate ? `<label class="check"><input type="checkbox" id="edRetard" ${e.retard ? "checked" : ""}> Accepter les rendus en retard (marqués « en retard »)</label>` : ""}
      ${e.type === "questionnaire" ? `<label class="check"><input type="checkbox" id="edMelanger" ${e.melanger ? "checked" : ""}> Mélanger l'ordre des questions et des réponses pour chaque élève</label>` : ""}
      <div class="field"><label for="edTheme">Thème</label><select id="edTheme" data-f="theme_id"><option value="">Aucun thème</option>${data.themes.map(t => `<option value="${t.id}" ${String(t.id) === e.theme_id ? "selected" : ""}>${esc(t.titre)}</option>`).join("")}<option value="__new">+ Créer un thème…</option></select></div>
      ${e.type === "devoir" ? `<div class="field"><label for="edMode">Type de rendu</label><select id="edMode" data-f="mode"><option value="individuel" ${e.mode === "individuel" ? "selected" : ""}>Individuel</option><option value="binome" ${e.mode === "binome" ? "selected" : ""}>Un rendu par binôme</option></select></div>
      <div class="field"><label for="edFormats">Formats attendus <span class="muted">(facultatif)</span></label><input id="edFormats" data-f="formats" value="${esc(e.formats)}" placeholder="PDF, photos, Python…"></div>` : ""}
    </aside>
  </div>${S.modal ? vModal() : ""}`;
}

function vQuestionsEditeur(e){
  const TYPES = [["choix", "Choix unique"], ["cases", "Cases à cocher"], ["courte", "Réponse courte"], ["num", "Réponse numérique"]];
  return `${e.questions.map((q, i) => { const t = q.t || "choix", bon = j => t === "cases" ? (q.a || []).includes(j) : q.a === j;
    const aide = t === "courte" ? "" : t === "cases" ? ((q.a || []).length ? (q.a || []).length + " bonne(s) réponse(s) cochée(s)" : "Coche toutes les bonnes réponses") : q.a == null ? "Coche la bonne réponse" : "Bonne réponse : option " + (q.a + 1);
    return `<section class="edcard qcard">
      <div class="qhead"><span class="qnum">${i + 1}</span><textarea class="qtext" data-qi="${i}" data-qk="q" rows="2" placeholder="Question" aria-label="Énoncé de la question ${i + 1}">${esc(q.q)}</textarea>
        <select class="qtype" data-qt="${i}" aria-label="Type de la question ${i + 1}">${TYPES.map(([v, l]) => `<option value="${v}" ${t === v ? "selected" : ""}>${l}</option>`).join("")}</select></div>
      ${q.img ? `<div class="qimg"><img src="${esc(S.urls[q.img] || "")}" alt="Image de la question ${i + 1}"><button class="ib sm" data-act="rmqimg" data-qi="${i}" title="Retirer l'image" aria-label="Retirer l'image">${icon("x")}</button></div>` : ""}
      ${t === "num" ? `<div class="qopts"><div class="two"><div class="field"><label>Valeur attendue</label><input class="qacc" data-qnum="${i}" data-k="v" value="${esc(q.num.v)}" placeholder="ex. 2,4 × 10^-3"></div><div class="field"><label>Tolérance (%)</label><input class="qacc" data-qnum="${i}" data-k="tol" type="number" min="0" step="0.5" value="${esc(q.num.tol)}"></div></div>
          <span class="muted" style="font-size:.8rem">L'élève peut écrire 0,0024 ou 2,4×10^-3 ou 2,4e-3 ; l'unité écrite après le nombre est ignorée.</span></div>`
      : t === "courte" ? `<div class="qopts"><div class="field"><label>Réponses acceptées <span class="muted">(sépare-les par ;)</span></label><input class="qacc" data-qacc="${i}" value="${esc(q.acc || "")}" placeholder="ex. mol ; mole ; moles"></div>
          <span class="muted" style="font-size:.8rem">Les majuscules, les accents et les espaces en trop ne comptent pas.</span></div>`
        : `<div class="qopts">${q.o.map((o, j) => `<div class="qopt ${bon(j) ? "good" : ""}"><input type="${t === "cases" ? "checkbox" : "radio"}" name="bonne${i}" data-act="${t === "cases" ? "bonnecase" : "bonne"}" data-qi="${i}" data-oi="${j}" ${bon(j) ? "checked" : ""} aria-label="Bonne réponse : option ${j + 1}" title="Bonne réponse"><input class="otext" data-qi="${i}" data-oi="${j}" value="${esc(o)}" placeholder="Option ${j + 1}" aria-label="Option ${j + 1} de la question ${i + 1}">${q.o.length > 2 ? `<button class="ib sm" data-act="rmopt" data-qi="${i}" data-oi="${j}" aria-label="Supprimer l'option">${icon("x")}</button>` : ""}</div>`).join("")}</div>`}
      <div class="qfoot">${t === "courte" || t === "num" ? "" : `<button class="linkbtn" data-act="addopt" data-qi="${i}">${icon("plus")} Ajouter une option</button>`}<button class="linkbtn" data-act="qimg" data-qi="${i}">${icon("upload")} ${q.img ? "Changer l'image" : "Image"}</button><span class="spacer"></span>
        <span class="muted" style="font-size:.8rem">${aide}</span>
        <button class="ib sm" data-act="dupq" data-qi="${i}" title="Dupliquer" aria-label="Dupliquer la question">${icon("copy")}</button>
        ${e.questions.length > 1 ? `<button class="ib sm" data-act="rmq" data-qi="${i}" title="Supprimer" aria-label="Supprimer la question">${icon("trash")}</button>` : ""}</div>
    </section>`; }).join("")}
    <div><button class="btn ghost" data-act="addq">${icon("plus")} Ajouter une question</button></div><input type="file" id="qimgFile" accept="image/*" hidden>`;
}
/* lecture d'un nombre écrit par un élève : 0,0024 · 2,4×10^-3 · 2.4e-3 · « 2,4 mol » */
function nombre(t){
  let s = String(t ?? "").toLowerCase().replace(/[\s\u00a0]/g, "").replace(/,/g, ".").replace(/[−–]/g, "-");
  s = s.replace(/(×|x|\*|·)10\^?/, "e").replace(/[⁻]/g, "-").replace(/[^0-9e.+-].*$/, "");
  return /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/.test(s) ? Number(s) : null;
}
const accDe = q => String(q.acc || "").split(/[;\n]/).map(x => x.trim()).filter(Boolean);

async function uploadFichiers(files, cible){
  const classe = cible === "annonce" ? S.annonce.classe : S.ed.classe_id, dest = cible === "annonce" ? S.annonce : S.ed;
  if (odActif()) {
    for (const f of files) {
      if (cible !== "annonce") { dest.ressources.push({ type: extType(f.name), label: f.name, pending: f }); continue; }
      try { toast("Envoi dans OneDrive : « " + f.name + " »…"); const o = await odEnvoyer([(cls(classe) || {}).nom || classe, "Annonces", ymd(now()), f.name], f); dest.ressources.push(ressourceOD(o, f.name)); toast("« " + f.name + " » rangé dans OneDrive"); }
      catch (e) { toast("OneDrive : " + (e.message || e) + ". Fichier non ajouté."); }
    }
    return render();
  }
  for (const f of files) {
    if (f.size > 50 * 1024 * 1024) { toast("« " + f.name + " » dépasse 50 Mo : mets-le dans OneDrive et ajoute le lien."); continue; }
    toast("Envoi de « " + f.name + " »…");
    const path = classe + "/" + Date.now() + "-" + safeName(f.name);
    const { error } = await sb.storage.from("documents").upload(path, f, { upsert: false });
    if (error) { toast("Échec de l'envoi de « " + f.name + " » : " + error.message); continue; }
    dest.ressources.push({ type: extType(f.name), label: f.name, path }); dest.uploaded.push(path);
    toast("« " + f.name + " » ajouté");
  }
  render();
}

async function enregistrer(mode, programme){
  const e = S.ed; e.err = "";
  if (!e.titre.trim()) { e.err = "Donne un titre."; return render(); }
  let limite = null;
  if (e.type !== "documentation" && e.hasDate) {
    if (!e.date) { e.err = "Choisis la date limite, ou « Aucune date limite »."; return render(); }
    limite = new Date(e.date + "T" + (e.heure || "23:59"));
    if (mode !== "draft" && limite <= (programme || now())) { e.err = "La date limite doit être après la publication."; return render(); }
  }
  if (e.type === "questionnaire") {
    for (let i = 0; i < e.questions.length; i++) {
      const q = e.questions[i], t = q.t || "choix";
      if (!q.q.trim()) { e.err = "La question " + (i + 1) + " n'a pas d'énoncé."; return render(); }
      if (t === "courte") { if (!accDe(q).length) { e.err = "Indique au moins une réponse acceptée pour la question " + (i + 1) + "."; return render(); } continue; }
      if (t === "num") { if (nombre(q.num.v) == null) { e.err = "La valeur attendue de la question " + (i + 1) + " n'est pas un nombre."; return render(); } continue; }
      if (q.o.length < 2 || q.o.some(x => !x.trim())) { e.err = "La question " + (i + 1) + " doit avoir au moins deux options, toutes remplies."; return render(); }
      if (t === "cases" ? !(q.a || []).length : q.a == null) { e.err = (t === "cases" ? "Coche au moins une bonne réponse" : "Coche la bonne réponse") + " de la question " + (i + 1) + "."; return render(); }
    }
  }
  if (e.type === "question" && e.qformat === "choix" && (e.qoptions.length < 2 || e.qoptions.some(x => !x.trim()))) { e.err = "Donne au moins deux options de réponse, toutes remplies."; return render(); }
  if (e.eleves && !e.eleves.length) { e.err = "Choisis au moins un élève, ou « Tous les élèves »."; return render(); }
  const row = { classe_id: e.classe_id, theme_id: e.theme_id ? Number(e.theme_id) : null, titre: e.titre.trim(), ressources: e.ressources, eleves: e.eleves };
  const grille = e.grille.map(g => ({ c: String(g.c || "").trim(), p: Number(String(g.p).replace(",", ".")) || 0 })).filter(g => g.c && g.p > 0);
  if (e.type === "devoir" && e.grille.length && grille.length !== e.grille.length) { e.err = "Chaque critère de la grille doit avoir un nom et des points."; return render(); }
  if (e.type === "devoir") Object.assign(row, { consigne: e.html, date_limite: limite ? limite.toISOString() : null, mode: e.mode, formats: e.formats.trim(),
    points: grille.length ? grille.reduce((a, g) => a + g.p, 0) : e.points === "none" ? null : Number(e.points), grille: grille.length ? grille : null, retard_ok: !!(e.retard && limite), categorie: e.categorie || null });
  else if (e.type === "question") Object.assign(row, { categorie: e.categorie || null, type: "question", consigne: e.html, date_limite: limite ? limite.toISOString() : null, mode: "individuel", formats: "", points: e.points === "none" ? null : Number(e.points),
    question: { format: e.qformat, options: e.qformat === "choix" ? e.qoptions.map(x => x.trim()) : [], voir: e.qvoir, modifier: e.qmodif } });
  else if (e.type === "questionnaire") Object.assign(row, { categorie: e.categorie || null, melanger: !!e.melanger, consigne: e.html, date_limite: limite ? limite.toISOString() : null, mode: e.mode, points: Number(e.points === "none" ? 20 : e.points), montrer_correction: e.montrer,
    questions: e.questions.map(q => { const t = q.t || "choix", base = (t === "courte" || t === "num") ? { q: q.q.trim(), t, o: [] } : { q: q.q.trim(), t, o: q.o.map(x => x.trim()) }; if (q.img) base.img = q.img; return base; }) });
  else row.description = e.html;
  if (e.type === "questionnaire") delete row.ressources;
  if (mode === "draft") row.brouillon = true;
  else if (mode === "schedule") { row.brouillon = false; row.publie_le = programme.toISOString(); }
  else { row.brouillon = false; if (!e.publie) row.publie_le = now().toISOString(); }
  Object.keys(row).forEach(k => row[k] === undefined && delete row[k]);
  e.busy = true; S.menu = null; render();
  if (e.ressources.some(x => x.pending)) {
    try { await envoyerEnAttente(e); } catch (er) { e.busy = false; e.err = "Envoi dans OneDrive impossible : " + (er.message || er) + ". Réessaie, ou désactive OneDrive dans Paramètres › Site."; return render(); }
    if (row.ressources) row.ressources = e.ressources;
  }
  if (row.ressources) row.ressources = row.ressources.filter(x => !x.pending);
  const table = e.type === "devoir" || e.type === "question" ? "devoirs" : e.type === "questionnaire" ? "quiz" : "supports";
  const q = e.id ? sb.from(table).update(row).eq("id", e.id).select("id").single() : sb.from(table).insert(row).select("id").single();
  const { data, error } = await q;
  if (error) { e.busy = false; e.err = "Enregistrement impossible : " + error.message; return render(); }
  const bonnesQ = e.type === "questionnaire" ? e.questions.map(x => (x.t || "choix") === "courte" ? accDe(x) : x.t === "num" ? { v: String(nombre(x.num.v)), tol: String(Math.max(0, Number(String(x.num.tol).replace(",", ".")) || 0)) } : x.t === "cases" ? (x.a || []).slice().sort((p, q) => p - q) : x.a) : null;
  if (e.type === "questionnaire") {
    const r2 = await sb.from("quiz_solutions").upsert({ quiz_id: data.id, bonnes: bonnesQ });
    if (r2.error) { e.busy = false; e.err = "Les bonnes réponses n'ont pas pu être enregistrées : " + r2.error.message; e.id = data.id; return render(); }
  }
  if (e.toDelete.length) await sb.storage.from("documents").remove(e.toDelete);
  const aussi = e.id ? [] : e.aussi.filter(x => x !== e.classe_id), kk = e.type === "questionnaire" ? "quiz" : e.type === "documentation" ? "support" : "devoir";
  if (mode === "schedule") progAjoute(e.type === "questionnaire" ? "quiz" : e.type === "documentation" ? "support" : "devoir", data.id);
  const classe = e.classe_id, nouveau = !e.id, typ = e.type; S.ed = null;
  await rafraichir(classe);
  if (aussi.length) { const n = await publierAussi(kk, aussi, row, bonnesQ); await rafraichir(); toast("Aussi publié dans " + n + " autre" + (n > 1 ? "s" : "") + " cours"); }
  else toast(mode === "draft" ? "Brouillon enregistré" : mode === "schedule" ? "Publication programmée" : !nouveau ? "Modifications enregistrées" : ({devoir:"Devoir publié", questionnaire:"Questionnaire publié", documentation:"Documentation publiée", question:"Question publiée"})[typ]);
  go("/classe/" + classe + "/travaux");
  setTimeout(async () => { await synchroPartages(true); if (mode !== "draft") await genererCopies(true); }, 800);
}

/* ---------- annonces du flux ---------- */
async function publierAnnonce(){
  const A = S.annonce, el = document.getElementById("anHtml"); if (el) A.html = el.innerHTML;
  const txt = (A.html || "").replace(/<[^>]*>/g, "").trim();
  if (!txt && !A.ressources.length) { toast("Écris un message avant de publier."); return; }
  A.busy = true; render();
  const { error } = A.id ? await sb.from("annonces").update({ texte: A.html, ressources: A.ressources }).eq("id", A.id)
    : await sb.from("annonces").insert({ classe_id: A.classe, auteur_nom: S.nom, texte: A.html, ressources: A.ressources });
  if (error) { A.busy = false; render(); toast("Enregistrement impossible : " + error.message); return; }
  if (A.toDelete && A.toDelete.length) await sb.storage.from("documents").remove(A.toDelete);
  for (const cid of (!A.id && A.aussi) || []) { await sb.from("annonces").insert({ classe_id: cid, auteur_nom: S.nom, texte: A.html, ressources: await copierRessources(A.ressources, cid) }); delete S.cache[cid]; }
  const c = A.classe, modif = !!A.id; S.annonce = null; delete S.cache[c]; render(); toast(modif ? "Annonce modifiée" : "Annonce publiée");
}
/* ---------- questionnaire (QCM) ---------- */
async function chargerResultatsQuiz(q, force){
  S.qr = S.qr || {};
  if (S.qr[q.id] && !force) return S.qr[q.id];
  const [r1, r2] = await Promise.all([
    sb.from("resultats_quiz").select("eleve, reponses, score, sur, fait_le").eq("quiz_id", q.id),
    sb.from("quiz_solutions").select("bonnes").eq("quiz_id", q.id).maybeSingle()
  ]);
  return S.qr[q.id] = { res: r1.data || [], bonnes: (r2.data && r2.data.bonnes) || [] };
}
const normTxt = t => sansAccent(String(t || "")).replace(/['’]/g, " ").replace(/\s+/g, " ").trim();
function juste(t, rep, bon){
  if (rep == null || bon == null) return false;
  if (t === "cases") return Array.isArray(rep) && Array.isArray(bon) && [...new Set(rep)].sort().join(",") === [...new Set(bon)].sort().join(",");
  if (t === "courte") return Array.isArray(bon) && normTxt(rep) !== "" && bon.some(a => normTxt(a) === normTxt(rep));
  if (t === "num") { const v = nombre(bon && bon.v), x = nombre(rep), tol = Number(bon && bon.tol) || 0; if (v == null || x == null) return false; return v === 0 ? Math.abs(x) <= tol / 100 : Math.abs(x - v) <= Math.abs(v) * tol / 100; }
  return Number(rep) === Number(bon);
}
const typeQ = x => x.t || "choix";
const TYPE_LIB = { choix: "Choix unique", cases: "Cases à cocher", courte: "Réponse courte", num: "Réponse numérique" };
const imgQ = x => x.img && S.urls && S.urls[x.img] ? `<img class="qpic" src="${esc(S.urls[x.img])}" alt="Illustration de la question" loading="lazy">` : "";
const attendue = (t, b) => t === "num" ? (b ? fmtNote(nombre(b.v)) + (Number(b.tol) ? " (± " + fmtNote(b.tol) + " %)" : "") : "") : (b || []).map(esc).join(" ou ");
function vQuiz(r){
  const q = S.quiz.find(x => String(x.id) === r.a);
  if (!q) return `<div class="page"><div class="emptystate"><b>Questionnaire introuvable.</b><a href="#/">Retour à l'accueil</a></div></div>`;
  const c = cls(q.classe_id), k = C(c && c.couleur), qs = q.questions || [];
  const head = `<div class="dvhead"><span class="ico">${icon("quiz", "")}</span><div style="flex:1;min-width:0"><h1>${esc(q.titre)}</h1>
    <div class="muted" style="font-size:.88rem;margin-top:4px">${esc(R().prof.nom)} · ${fmtShort(D(q.publie_le))}${S.prof && q.brouillon ? " · <i>Brouillon</i>" : ""}</div>
    <div class="dvmeta"><b>${q.mode === "note" ? "Noté sur " + q.points + " · une seule tentative" : "Entraînement · recommençable"}</b><span>${q.date_limite ? dueTxt(D(q.date_limite)) : "Aucune date limite"}</span></div></div>
    ${S.prof ? `<a class="ib" href="#/editer/questionnaire/${q.id}" title="Modifier" aria-label="Modifier le questionnaire">${icon("edit")}</a>` : ""}</div>
    ${q.consigne ? `<div class="dvbody"><div class="richtext">${rich(q.consigne)}</div></div>` : ""}`;
  if (S.prof) {
    const data = S.qr && S.qr[q.id], el = elevesDuDevoir(q, (S.cache[q.classe_id] || {eleves:[]}).eleves);
    if (!data) return `<div class="page" style="--c:var(${k.c})">${head}<div class="loading"><div><div class="spin"></div>Chargement des résultats…</div></div></div>`;
    const parEmail = {}; data.res.forEach(x => parEmail[S.profils[x.eleve]] = x);
    const moy = data.res.length ? data.res.reduce((a, x) => a + noteQuiz(q, x), 0) / data.res.length : null;
    return `<div class="page" style="--c:var(${k.c})">${head}
      ${q.mode === "note" ? `<div class="stats"><div><b>${data.res.length}/${el.length}</b><small>Réponses</small></div><div><b>${moy == null ? "–" : fmtNote(Math.round(moy * 10) / 10)}</b><small>Moyenne /${q.points}</small></div></div>
      <div class="tablewrap"><table><thead><tr><th class="first">Élève</th><th>Envoyé le</th><th>Bonnes réponses</th><th>Note /${q.points}</th></tr></thead><tbody>
      ${el.map(e => { const x = parEmail[e.email]; return `<tr><td class="first">${esc(e.nom)}</td><td class="muted">${x ? fmtShort(D(x.fait_le)) + " " + fmtT(D(x.fait_le)) : ""}</td><td class="mono">${x ? x.score + "/" + x.sur : ""}</td><td class="mono">${x ? fmtNote(noteQuiz(q, x)) : `<span class="pill">Non fait</span>`}</td></tr>`; }).join("") || `<tr><td colspan="4" class="muted">Aucun élève dans ce cours.</td></tr>`}</tbody></table></div>`
        : `<div class="notice">Questionnaire d'entraînement : les réponses des élèves ne sont pas enregistrées.</div>`}
      <section class="card">${qs.map((x, i) => { const t = typeQ(x), b = data.bonnes[i], ok = q.mode === "note" && data.res.length ? Math.round(data.res.filter(r2 => r2.reponses && juste(t, r2.reponses[i], b)).length / data.res.length * 100) : null;
        const estBon = j => t === "cases" ? (b || []).includes(j) : b === j;
        return `<div class="q"><b>${i + 1}. ${sci(x.q)}</b> <span class="pill">${TYPE_LIB[t]}</span>${imgQ(x)}
          ${t === "courte" || t === "num" ? `<div class="opt good">${icon("check")} ${attendue(t, b)}</div>` : x.o.map((o, j) => `<div class="opt ${estBon(j) ? "good" : ""}">${estBon(j) ? icon("check") : `<span style="width:22px"></span>`} ${sci(o)}</div>`).join("")}
          ${ok != null ? `<span class="muted" style="font-size:.82rem">${ok} % de bonnes réponses</span>` : ""}</div>`; }).join("")}</section>${pageFoot()}</div>`;
  }
  const deja = resultatDe(q, S.user.id), res = S.quizRes[q.id], rep = S.quizRep[q.id] || {};
  const ferme = q.date_limite && D(q.date_limite) <= now();
  if (q.mode === "note" && deja && !res) return `<div class="page" style="--c:var(${k.c})">${head}<section class="yourwork"><header><h2>Questionnaire envoyé</h2><span class="pill ok">${fmtNote(noteQuiz(q, deja))}/${q.points}</span></header><p class="muted" style="margin:0">Tu as répondu le ${fmtShort(D(deja.fait_le))} à ${fmtT(D(deja.fait_le))} : ${deja.score} bonne${deja.score > 1 ? "s" : ""} réponse${deja.score > 1 ? "s" : ""} sur ${deja.sur}.</p></section>${pageFoot()}</div>`;
  if (ferme && !res) return `<div class="page" style="--c:var(${k.c})">${head}<section class="yourwork"><header><h2>Questionnaire fermé</h2><span class="pill bad">Date limite passée</span></header></section>${pageFoot()}</div>`;
  const b = res && res.bonnes;
  return `<div class="page" style="--c:var(${k.c})">${head}
    <section class="card">${(q.melanger ? melangeStable(qs.length, S.user.id + ":" + q.id) : qs.map((_, i) => i)).map((i, rang) => { const x = qs[i], t = typeQ(x), num = rang + 1;
      if (t === "courte" || t === "num") { const ok = res && b ? juste(t, rep[i], b[i]) : null;
        return `<div class="q"><b>${num}. ${sci(x.q)}</b>${imgQ(x)}<input class="qans ${ok === true ? "good" : ok === false ? "wrong" : ""}" data-act="anstxt" data-q="${q.id}" data-i="${i}" value="${esc(rep[i] || "")}" placeholder="${t === "num" ? "Ta réponse (ex. 2,4×10^-3)" : "Ta réponse"}" ${t === "num" ? 'inputmode="decimal"' : ""} aria-label="Réponse à la question ${num}" ${res ? "disabled" : ""}>${res && b && !ok ? `<span class="muted" style="font-size:.85rem">Réponse attendue : ${attendue(t, b[i])}</span>` : ""}</div>`; }
      const coche = j => t === "cases" ? (rep[i] || []).includes(j) : rep[i] === j, bonne = j => t === "cases" ? ((b && b[i]) || []).includes(j) : b && j === b[i];
      const ordreO = q.melanger ? melangeStable(x.o.length, S.user.id + ":" + q.id + ":" + i) : x.o.map((_, j) => j);
      return `<div class="q"><b>${num}. ${sci(x.q)}</b>${imgQ(x)}${t === "cases" ? `<span class="muted" style="font-size:.8rem">Plusieurs réponses possibles</span>` : ""}${ordreO.map(j => { const o = x.o[j]; let cl = ""; if (res && b) { if (bonne(j)) cl = "good"; else if (coche(j)) cl = "wrong"; }
        return `<label class="opt ${cl}"><input type="${t === "cases" ? "checkbox" : "radio"}" name="q${i}" data-act="${t === "cases" ? "anscase" : "ans"}" data-q="${q.id}" data-i="${i}" data-j="${j}" ${coche(j) ? "checked" : ""} ${res ? "disabled" : ""}> ${sci(o)}</label>`; }).join("")}</div>`; }).join("")}
      <div class="q">${res ? `<div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap"><span class="grade">${res.score}<small>/${res.sur}</small></span>${q.mode === "note" ? `<span>Note : <b>${fmtNote(Math.round(res.score / Math.max(1, res.sur) * q.points * 100) / 100)}/${q.points}</b></span>` : `<button class="btn ghost" data-act="retry" data-q="${q.id}">Recommencer</button>`}${!b ? `<span class="muted">La correction n'est pas affichée pour ce questionnaire.</span>` : ""}</div>`
        : `<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button class="btn" data-act="valider" data-q="${q.id}" ${S.sending ? "disabled" : ""}>${S.sending ? "Envoi…" : "Envoyer"}</button>${q.mode === "note" ? `<span class="muted" style="font-size:.85rem">Une seule tentative : vérifie tes réponses avant d'envoyer.</span>` : ""}</div>`}</div>
    </section>${pageFoot()}</div>`;
}
async function envoyerQuiz(qid){
  const q = S.quiz.find(x => x.id === qid), rep = S.quizRep[qid] || {}, n = (q.questions || []).length;
  const vide = i => { const v = rep[i], t = typeQ(q.questions[i]); return v == null || (t === "cases" && !v.length) || ((t === "courte" || t === "num") && !String(v).trim()); };
  if ([...Array(n)].some((_, i) => vide(i))) { toast("Réponds à toutes les questions avant d'envoyer."); return; }
  S.sending = true; render();
  const { data, error } = await sb.rpc("soumettre_quiz", { qid, reponses: [...Array(n)].map((_, i) => { const v = rep[i], t = typeQ(q.questions[i]); return v == null ? null : t === "cases" ? v.slice().sort((a, b2) => a - b2) : t === "courte" ? String(v).trim() : t === "num" ? (nombre(v) != null ? String(nombre(v)) : String(v).trim()) : v; }) });
  S.sending = false;
  if (error) { render(); toast(error.message); return; }
  S.quizRes[qid] = data;
  if (q.mode === "note") await rafraichir();
  render();
}
/* ---------- paramètres du cours ---------- */
function initParametres(c){
  if (S.settings && S.settings.id === c.id) return;
  S.settings = { id:c.id, nom:c.nom || "", description:c.description || "", section:c.section || "", niveau:c.niveau || "", matiere:c.matiere || "", salle:c.salle || "",
    symbole:c.symbole || "", couleur:c.couleur || "pc", illustration:c.illustration || "auto", code_actif:c.code_actif !== false, flux_mode:c.flux_mode || "prof", flux_devoirs:c.flux_devoirs !== false,
    teams_url:c.teams_url || "", teams_visible:c.teams_visible !== false, dossier_onedrive:c.dossier_onedrive || "", moyenne_visible:!!c.moyenne_visible, categories:clone(c.categories || []), busy:false, err:"" };
}
function vParametres(c){
  initParametres(c);
  const s = S.settings, k = C(s.couleur);
  const f = (key, label, ph = "", type = "text") => `<div class="field"><label for="s_${key}">${label}</label><input id="s_${key}" type="${type}" data-s="${key}" value="${esc(s[key])}" placeholder="${esc(ph)}"></div>`;
  const sw = (key, label, aide = "") => `<label class="switch"><span><b>${label}</b>${aide ? `<small class="muted">${aide}</small>` : ""}</span><input type="checkbox" data-s="${key}" ${s[key] ? "checked" : ""}><i aria-hidden="true"></i></label>`;
  return `<div class="edtop" style="--c:var(${k.c})"><a class="ib" href="#/classe/${esc(c.id)}" aria-label="Fermer">${icon("x")}</a><h1>Paramètres du cours</h1><span class="spacer"></span>
      <button class="btn" data-act="savesettings" ${s.busy ? "disabled" : ""}>${s.busy ? "Enregistrement…" : "Enregistrer"}</button></div>
    <div class="settings">
      ${s.err ? `<div class="notice" style="background:var(--bad-bg);color:var(--bad)">${esc(s.err)}</div>` : ""}
      <section class="edcard"><h2>Informations sur la classe</h2>
        ${f("nom", "Nom du cours *")}
        <div class="field"><label for="s_description">Description du cours</label><textarea id="s_description" data-s="description" rows="3">${esc(s.description)}</textarea></div>
        ${f("section", "Section", "ex. Spécialité physique-chimie")}
        <div class="two">${f("niveau", "Niveau(x)", "ex. Terminale")}${f("matiere", "Matière", "ex. Physique-Chimie")}</div>
        ${f("salle", "Salle", "ex. Labo 2")}
        <div class="two">${f("symbole", "Symbole sur le bandeau", "ex. Tle")}
          <div class="field"><label for="s_couleur">Couleur du bandeau</label><select id="s_couleur" data-s="couleur">${[["pc","Bleu"],["snt","Vert"],["si","Rouge"],["tech","Ocre"],["pix","Bleu pétrole"]].map(([v, l]) => `<option value="${v}" ${s.couleur === v ? "selected" : ""}>${l}</option>`).join("")}</select></div></div>
        <div class="field"><label for="s_illustration">Illustration du bandeau</label><select id="s_illustration" data-s="illustration">${ART_NOMS.map(([v, l]) => `<option value="${v}" ${s.illustration === v ? "selected" : ""}>${l}</option>`).join("")}</select></div>
        <div class="banner bigbanner preview" style="--bb:var(${k.b})">${bannerArt(s)}<h1>${esc(s.nom || "Nom du cours")}</h1><span>${esc(s.section)}</span></div>
      </section>
      <section class="edcard"><h2>Général</h2>
        <h3>Codes d'invitation</h3>
        <div class="setrow"><span><b>Gérer les codes d'invitation</b><small class="muted">Les élèves rejoignent le cours avec ce code (bouton + en haut de PhysiquePro).</small></span><select data-s="code_actif" aria-label="Codes d'invitation"><option value="1" ${s.code_actif ? "selected" : ""}>Activé</option><option value="0" ${s.code_actif ? "" : "selected"}>Désactivé</option></select></div>
        <div class="setrow"><span><b>Lien d'invitation</b><small class="muted">Envoie-le aux élèves (Teams, e-mail, Pronote) : un clic, ils se connectent et rejoignent le cours.</small></span><button class="btn ghost sm" data-act="copylien" data-code="${esc(c.code || "")}">${icon("links")} Copier le lien</button></div>
        <div class="setrow"><span><b>Code du cours</b></span><span class="mono" style="font-size:1.1rem;color:var(--accent)">${esc(c.code || "")}</span></div>
        <div class="setrow"><span><b>Actions</b></span><span style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end"><button class="btn ghost sm" data-act="showcode" data-code="${esc(c.code || "")}">${icon("expand")} Afficher le code</button><button class="btn ghost sm" data-act="copycode" data-code="${esc(c.code || "")}">${icon("copy")} Copier</button><button class="btn ghost sm" data-act="resetcode" data-c="${esc(c.id)}">${icon("key")} Réinitialiser</button></span></div>
        <h3>Flux, et travaux et devoirs</h3>
        <div class="setrow"><span><b>Flux</b><small class="muted">Qui peut voir et publier dans le flux du cours.</small></span><select data-s="flux_mode" aria-label="Réglage du flux">
          <option value="eleves" ${s.flux_mode === "eleves" ? "selected" : ""}>Les élèves peuvent publier et commenter</option>
          <option value="prof" ${s.flux_mode === "prof" ? "selected" : ""}>Les élèves peuvent uniquement commenter</option>
          <option value="prof_seul" ${s.flux_mode === "prof_seul" ? "selected" : ""}>Seuls les enseignants peuvent publier et commenter</option>
          <option value="masque" ${s.flux_mode === "masque" ? "selected" : ""}>Masquer le flux aux élèves</option></select></div>
        <div class="setrow"><span><b>Travaux et devoirs sur le flux</b></span><select data-s="flux_devoirs" aria-label="Travaux et devoirs sur le flux"><option value="1" ${s.flux_devoirs ? "selected" : ""}>Afficher des notifications condensées</option><option value="0" ${s.flux_devoirs ? "" : "selected"}>Masquer les notifications</option></select></div>
      </section>
      <section class="edcard"><h2>${icon("video")} Visio Microsoft Teams</h2>
        ${f("teams_url", "Lien de la réunion Teams de la classe", "https://teams.microsoft.com/l/meetup-join/…", "url")}
        ${sw("teams_visible", "Visible par les élèves", "Les élèves voient le bouton « Rejoindre » sur la page du cours.")}
        <details class="aide"><summary>Comment obtenir un lien Teams permanent pour la classe ?</summary>
          <ol><li>Ouvre <b>Teams</b> (ou Outlook) → <b>Calendrier</b> → <b>Nouvelle réunion</b>.</li><li>Titre : le nom du cours (ex. « ${esc(s.nom)} · visio »). Choisis une date, puis <b>Répéter : chaque semaine</b>, sans date de fin.</li><li>N'invite personne, puis <b>Enregistrer</b>.</li><li>Rouvre la réunion, clique sur <b>Copier le lien</b> et colle-le ici.</li></ol>
          <p class="muted">Le même lien reste valable toute l'année : un clic sur « Rejoindre » ouvre la visio de cette classe. Selon les réglages du lycée, les élèves peuvent passer par la salle d'attente.</p></details>
      </section>
      <section class="edcard"><h2>${icon("folder")} Dossier OneDrive du cours</h2>
        ${f("dossier_onedrive", "Lien de partage du dossier OneDrive", "https://lyceeverdun-my.sharepoint.com/…", "url")}
        <details class="aide"><summary>Organisation conseillée</summary>
          <p>Dans ton OneDrive, un dossier principal <b>ONEDRIVE SITE PHYSIQUEPRO</b>, puis un sous-dossier par cours (ex. <b>${esc(s.nom)}</b>). Partage le sous-dossier avec « Personnes de MLF disposant du lien » en lecture, puis colle le lien ici. Le bouton dossier apparaîtra sur la carte et la page du cours.</p></details>
      </section>
      <section class="edcard"><h2>Notation</h2>
        ${sw("moyenne_visible", "Montrer la moyenne aux élèves", "Chaque élève voit sa moyenne sur 20 (notes rendues uniquement) sur la page du cours.")}
        <h3>Catégories de notes et coefficients</h3>
        <p class="muted" style="margin:0;font-size:.85rem">Ex. TP coef 1, Contrôle coef 2, DM coef 0,5. La moyenne devient pondérée : moyenne de chaque catégorie × son coefficient. Sans catégorie, c'est une moyenne simple. Les travaux sans catégorie comptent avec un coefficient 1.</p>
        <div class="adlist">${s.categories.map((x, i) => `<div class="adrow cat"><input data-cat="${i}" data-k="nom" value="${esc(x.nom || "")}" placeholder="Nom (ex. Contrôle)" aria-label="Nom de la catégorie ${i + 1}"><input data-cat="${i}" data-k="coef" type="number" min="0" step="0.5" value="${esc(x.coef ?? 1)}" aria-label="Coefficient"><button class="ib sm" data-act="rmcat" data-i="${i}" aria-label="Supprimer la catégorie">${icon("x")}</button></div>`).join("")}</div>
        <div><button class="btn ghost sm" data-act="addcat">${icon("plus")} Ajouter une catégorie</button></div>
      </section>
      <section class="edcard danger"><h2>Archiver ou supprimer</h2>
        <div class="setrow"><span><b>${c.archive ? "Restaurer le cours" : "Archiver le cours"}</b><small class="muted">${c.archive ? "Le cours réapparaîtra sur l'accueil." : "Le cours disparaît de l'accueil et du menu. Tu pourras le restaurer depuis « Cours archivés »."}</small></span><button class="btn ghost sm" data-act="archiver" data-c="${esc(c.id)}" data-on="${c.archive ? "0" : "1"}">${icon(c.archive ? "restore" : "archive")} ${c.archive ? "Restaurer" : "Archiver"}</button></div>
        ${c.archive ? `<div class="setrow"><span><b>Supprimer définitivement</b><small class="muted">Supprime le cours, ses devoirs, les travaux rendus, les notes et les annonces.</small></span><button class="btn sm danger" data-act="supprclasse" data-c="${esc(c.id)}">${icon("trash")} Supprimer</button></div>` : `<p class="muted" style="margin:0;font-size:.85rem">Pour supprimer un cours, archive-le d'abord (comme dans Classroom).</p>`}
      </section>
    </div>${S.modal ? vModal() : ""}`;
}
async function enregistrerParametres(){
  const s = S.settings; s.err = "";
  if (!s.nom.trim()) { s.err = "Le nom du cours est obligatoire."; return render(); }
  for (const [k2, l] of [["teams_url", "Le lien Teams"], ["dossier_onedrive", "Le lien OneDrive"]]) if (s[k2].trim() && !/^https:\/\//.test(s[k2].trim())) { s.err = l + " doit commencer par https://"; return render(); }
  s.busy = true; render();
  const ancienNom = (cls(s.id) || {}).nom;
  const { error } = await sb.from("classes").update({ nom:s.nom.trim(), description:s.description.trim(), section:s.section.trim(), niveau:s.niveau.trim(), matiere:s.matiere.trim(), salle:s.salle.trim(),
    symbole:s.symbole.trim() || s.nom.trim().slice(0, 3), couleur:s.couleur, illustration:s.illustration === "auto" ? null : s.illustration, code_actif:s.code_actif, flux_mode:s.flux_mode, flux_devoirs:s.flux_devoirs,
    teams_url:s.teams_url.trim() || null, teams_visible:s.teams_visible, dossier_onedrive:s.dossier_onedrive.trim() || null, moyenne_visible:s.moyenne_visible,
    categories:s.categories.map(x => ({ nom: String(x.nom || "").trim(), coef: Math.max(0, Number(String(x.coef).replace(",", ".")) || 0) })).filter(x => x.nom) }).eq("id", s.id);
  if (error) { s.busy = false; s.err = "Enregistrement impossible : " + error.message; return render(); }
  const id = s.id; S.settings = null; await rafraichir(id); toast("Paramètres enregistrés"); go("/classe/" + id);
  if (odActif() && ancienNom && ancienNom !== s.nom.trim()) setTimeout(() => rangerDossiersClasses({ [id]: ancienNom }), 1200);
}
function moyenneEleve(c){
  return arrondi1(moyenneDe(c, moi(), S.user.id, true).moy);
}
/* ---------- fenêtres ---------- */
function vModal(){
  const m = S.modal; let body = "", ok = "Enregistrer", foot = true;
  if (m.kind === "theme") { body = `<h2>${m.id ? "Renommer le thème" : "Ajouter un thème"}</h2><div class="field"><label for="mTitre">Nom du thème</label><input id="mTitre" value="${esc(m.titre || "")}" placeholder="ex. Chapitre 1 · Mouvements"></div>`; ok = m.id ? "Renommer" : "Ajouter"; }
  else if (m.kind === "copieauth") { body = `<h2>Ouvrir ta copie modifiable</h2><p style="margin:0">Pour modifier ce document en ligne, PhysiquePro en crée <b>une copie dans ton OneDrive</b> (dossier « PhysiquePro »). Le document de ton professeur n'est pas modifié.</p><p class="muted" style="margin:0;font-size:.85rem">La première fois seulement, Microsoft te demande d'autoriser PhysiquePro à accéder à ton OneDrive.</p>`; ok = "Autoriser et ouvrir"; }
  else if (m.kind === "placercours") { const l = actives(), i = l.findIndex(c => c.id === m.id), autres = l.filter(c => c.id !== m.id);
    body = `<h2>Déplacer « ${esc(m.nom)} »</h2><div class="field"><label for="mPos">Nouvelle place du cours</label><select id="mPos" style="width:100%;max-width:100%">
      <option value="0" ${i === 0 ? "selected" : ""}>En premier</option>${autres.map((c, k) => `<option value="${k + 1}" ${i === k + 1 ? "selected" : ""}>Après « ${esc(c.nom)} »</option>`).join("")}</select></div>
      <p class="muted" style="margin:0;font-size:.85rem">${S.prof ? "Les élèves voient les cours dans cet ordre." : "Cet ordre ne concerne que ton accueil."} Tu peux aussi glisser-déposer les cartes sur l'accueil.</p>`; ok = "Déplacer"; }
  else if (m.kind === "placertheme") { const th = ((S.cache[m.classe] || {}).themes || []).filter(t => String(t.id) !== String(m.id));
    body = `<h2>Déplacer « ${esc(m.titre)} »</h2><div class="field"><label for="mOu">Placer ce thème</label><select id="mOu" style="width:100%"><option value="avant">Avant le thème…</option><option value="apres">Après le thème…</option></select></div>
      <div class="field"><label for="mRef">Thème</label><select id="mRef" style="width:100%;max-width:100%;text-overflow:ellipsis">${th.map(t => `<option value="${t.id}">${esc(t.titre.length > 70 ? t.titre.slice(0, 68) + "…" : t.titre)}</option>`).join("")}</select></div>`; ok = "Déplacer"; }
  else if (m.kind === "prog") { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(8, 0, 0, 0);
    body = `<h2>Programmer la publication</h2><p class="muted" style="margin:0">Les élèves verront cet élément à partir de cette date.</p><div class="dt2"><input id="mDate" type="date" value="${ymd(d)}" aria-label="Date"><input id="mHeure" type="time" value="08:00" aria-label="Heure"></div>`; ok = "Programmer"; }
  else if (m.kind === "join") { body = `<h2>Rejoindre un cours</h2><p class="muted" style="margin:0">Tu es connecté avec <b>${esc(moi())}</b>. Saisis le code du cours donné par ton professeur.</p><div class="field"><label for="mCode">Code du cours</label><input id="mCode" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="ex. k7m4pqr" value="${esc(m.code || "")}" style="font-family:var(--mono);font-size:1.2rem;letter-spacing:.08em"></div>`; ok = "Rejoindre"; }
  else if (m.kind === "ajouteleves") { const c = cls(m.classe);
    body = `<h2>Ajouter des élèves${c ? " · " + esc(c.nom) : ""}</h2>
      ${m.fixe ? "" : `<div class="field"><label for="mClasse">Dans le cours</label><select id="mClasse" data-mclasse="1">${actives().map(x => `<option value="${esc(x.id)}" ${x.id === m.classe ? "selected" : ""}>${esc(x.nom)}</option>`).join("")}</select></div>`}
      <div class="field"><label for="mListe">Colle la liste (une ligne par élève)</label><textarea id="mListe" rows="7" placeholder="${esc(CFG.prefixeEleve ?? "lv.")}prenom.nom@${esc(CFG.domaine)}&#10;HADDAD Lina&#10;Karim Saad ; ${esc(CFG.prefixeEleve ?? "lv.")}karim.saad@${esc(CFG.domaine)}">${esc(m.texte || "")}</textarea></div>
      <p class="muted" style="margin:0;font-size:.8rem">Accepté : une adresse, « NOM Prénom » copié depuis Pronote ou Excel (l'adresse ${esc(CFG.prefixeEleve ?? "lv.")}prenom.nom@${esc(CFG.domaine)} est alors déduite), ou les deux sur la même ligne.</p>
      <div id="mApercu">${apercuListe(m)}</div>`; ok = "Ajouter"; }
  else if (m.kind === "renomeleve") { body = `<h2>Modifier le nom</h2><p class="muted" style="margin:0;font-size:.85rem">${esc(m.email)}</p><div class="field"><label for="mNomEl">Nom affiché (dans tous les cours)</label><input id="mNomEl" value="${esc(m.nom)}"></div>`; }
  else if (m.kind === "autrescours") { body = `<h2>Ajouter à un autre cours</h2><p class="muted" style="margin:0">${m.emails.length} élève${m.emails.length > 1 ? "s" : ""} sélectionné${m.emails.length > 1 ? "s" : ""}.</p>
      <div class="ciblelist">${actives().filter(c => c.id !== m.from).map(c => `<label class="check"><input type="checkbox" class="mDest" value="${esc(c.id)}"> ${esc(c.nom)}</label>`).join("") || `<span class="muted">Aucun autre cours actif.</span>`}</div>`; ok = "Ajouter"; }
  else if (m.kind === "copiercours") { body = `<h2>Copier « ${esc(m.nom)} »</h2>
      <div class="field"><label for="mNomCopie">Nom du nouveau cours</label><input id="mNomCopie" value="${esc(/(\d{2})-(\d{2})/.test(m.nom) ? m.nom.replace(/(\d{2})-(\d{2})/, (x, a, b) => String(+a + 1).padStart(2, "0") + "-" + String(+b + 1).padStart(2, "0")) : "Copie de " + m.nom)}"></div>
      <p class="muted" style="margin:0;font-size:.85rem">Comme dans Classroom : les thèmes, devoirs, questions, questionnaires et documentations sont copiés en <b>brouillon</b>. Idéal pour préparer l'année suivante : l'année du nom (ex. 26-27) est avancée d'un an. Les élèves, les annonces, les travaux rendus et les notes ne sont pas copiés.</p>`; ok = "Copier"; }
  else if (m.kind === "newclass") { body = `<h2>Créer un cours</h2>
    <div class="field"><label for="mNom">Nom du cours *</label><input id="mNom" placeholder="ex. Ter. G2 SPE SPC 26-27"></div>
    <div class="field"><label for="mSection">Section</label><input id="mSection" placeholder="ex. Spécialité physique-chimie"></div>
    <div class="two"><div class="field"><label for="mSym">Symbole</label><input id="mSym" maxlength="4" placeholder="ex. Tle"></div>
    <div class="field"><label for="mCouleur">Couleur</label><select id="mCouleur"><option value="pc">Bleu</option><option value="snt">Vert</option><option value="si">Rouge</option><option value="tech">Ocre</option><option value="pix">Bleu pétrole</option></select></div></div>`; ok = "Créer"; }
  else if (m.kind === "liens") { body = `<h2>Liens de la classe</h2><p class="muted" style="margin:0">Ces liens apparaissent sur la page du cours, pour les élèves de ce cours uniquement.</p>
    <div class="linkedit">${m.liens.map((l, i) => `<div class="lrow"><input data-li="${i}" data-k="nom" value="${esc(l.nom)}" placeholder="Nom" aria-label="Nom du lien ${i + 1}"><input data-li="${i}" data-k="url" value="${esc(l.url)}" placeholder="https://…" aria-label="Adresse du lien ${i + 1}"><button class="ib sm" data-act="rmlien" data-i="${i}" aria-label="Supprimer ce lien">${icon("x")}</button></div>`).join("")}</div>
    <div><button class="btn ghost sm" data-act="addlien">${icon("plus")} Ajouter un lien</button></div>`; }
  else if (m.kind === "code") { body = `<h2>Code du cours</h2><div class="codehuge">${esc(m.code)}</div><p class="muted" style="margin:0">Les élèves cliquent sur <b>+</b> en haut de PhysiquePro, puis sur « Rejoindre un cours », et saisissent ce code.</p>
    <div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn ghost" data-act="copycode" data-code="${esc(m.code)}">${icon("copy")} Copier</button><button class="btn" data-act="mclose">Fermer</button></div>`; foot = false; }
  else if (m.kind === "cible") {
    const el = (S.cache[S.ed.classe_id] || {eleves:[]}).eleves, sel = new Set(m.sel || el.map(e => e.email));
    body = `<h2>Attribuer à</h2>${el.length ? `<label class="check"><input type="checkbox" data-act="cibletous" ${m.sel == null ? "checked" : ""}> <b>Tous les élèves</b></label>
      <div class="ciblelist">${el.map(e => `<label class="check"><input type="checkbox" data-act="cibleun" data-e="${esc(e.email)}" ${sel.has(e.email) ? "checked" : ""}> ${esc(e.nom)}</label>`).join("")}</div>`
      : `<p class="muted" style="margin:0">Aucun élève n'a encore rejoint ce cours : l'élément sera attribué à tous les élèves.</p>`}`; ok = "Valider"; }
  else if (m.kind === "reutiliser") {
    const autres = actives().filter(c => m.k === "depuis" || c.id !== m.classe);
    body = `<h2>${m.k === "depuis" ? "Réutiliser un post" : "Réutiliser dans un autre cours"}</h2>
      ${m.k === "depuis" ? `<p class="muted" style="margin:0">Choisis un élément d'un autre cours : il sera copié en <b>brouillon</b> dans ce cours.</p>
        <div class="field"><label for="mSource">Élément à copier</label><select id="mSource">${actives().filter(c => c.id !== m.classe).map(c => {
          const its = [...S.devoirs.filter(d => d.classe_id === c.id).map(d => ["devoir", d.id, d.titre]), ...S.quiz.filter(q => q.classe_id === c.id).map(q => ["quiz", q.id, "QCM · " + q.titre])];
          return its.length ? `<optgroup label="${esc(c.nom)}">${its.map(([k2, id, t]) => `<option value="${k2}:${id}">${esc(t)}</option>`).join("")}</optgroup>` : ""; }).join("")}</select></div>
        <p class="muted" style="margin:0;font-size:.82rem">Les documentations se réutilisent depuis le menu ⋮ de l'élément, dans son cours d'origine.</p>`
      : `<p class="muted" style="margin:0">Une copie sera créée en <b>brouillon</b> dans les cours choisis : tu pourras la relire avant de la publier.</p>
        <div class="ciblelist">${autres.map(c => `<label class="check"><input type="checkbox" class="mDest" value="${esc(c.id)}"> ${esc(c.nom)}</label>`).join("") || `<span class="muted">Aucun autre cours actif.</span>`}</div>`}`; ok = "Copier"; }
  else if (m.kind === "supprclasse") { body = `<h2>Supprimer « ${esc(m.nom)} » ?</h2><p style="margin:0">Le cours, ses devoirs, questionnaires, documentations, annonces, les travaux rendus et les notes seront <b>définitivement supprimés</b>.${odActif() ? " Son dossier OneDrive et tout son contenu partent dans la corbeille de ton OneDrive (récupérables pendant 93 jours)." : ""}</p><div class="field"><label for="mConfirm">Pour confirmer, tape le nom du cours</label><input id="mConfirm" autocomplete="off" placeholder="${esc(m.nom)}"></div>`; ok = "Supprimer"; }
  else if (m.kind === "demande") { body = modalDemande(m) + `<label class="check"><input type="checkbox" id="dmEnvoi" ${m.x.statut && m.x.statut !== "brouillon" ? "" : "checked"}> Ouvrir Outlook pour l'envoyer au préparateur</label>`; ok = "Enregistrer"; }
  else if (m.kind === "prep") { body = `<h2>${icon("flask")} Adresse du préparateur</h2><p class="muted" style="margin:0">Les demandes de matériel lui seront adressées par Outlook.</p><div class="field"><label for="dmPrep">Adresse e-mail</label><input id="dmPrep" type="email" value="${esc(emailPrep())}" placeholder="prenom.nom@${esc(CFG.domaine)}"></div>`; }
  else if (m.kind === "rdv") { body = modalRdv(); ok = "Créer les créneaux"; }
  else if (m.kind === "urgchoix") { body = `<h2>${icon("urgent")} Message urgent à ${esc(nomProfCourt())}</h2><p class="muted" style="margin:0">Pour quel cours ?</p><div class="urgchoix">${actives().map(c => `<button class="btn tonal" data-act="urgent" data-c="${esc(c.id)}" style="--c:var(${C(c.couleur).c})">${esc(c.nom)}${supUrg(reponsesNonVues(c.id))}</button>`).join("")}</div><div style="display:flex;justify-content:flex-end"><button class="btn ghost" data-act="mclose">Annuler</button></div>`; foot = false; }
  else if (m.kind === "urgent") { body = modalUrgent(m); ok = "Envoyer"; }
  else if (m.kind === "urgprof") { body = modalUrgProf(m); ok = "Envoyer"; }
  else if (m.kind === "confirm") { body = `<h2>${esc(m.titre)}</h2><p style="margin:0">${esc(m.texte)}</p>`; ok = m.ok || "Supprimer"; }
  const danger = (m.kind === "confirm" && m.action !== "rien") || m.kind === "supprclasse";
  return `<div class="modalbg" data-act="mclose"></div><div class="modal" role="dialog" aria-modal="true">${body}${m.err ? `<div class="err">${esc(m.err)}</div>` : ""}
    ${foot ? `<div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn ghost" data-act="mclose">Annuler</button><button class="btn${danger ? " danger" : ""}" data-act="mok" ${m.busy ? "disabled" : ""}>${ok}</button></div>` : ""}</div>`;
}

async function copierRessources(list, versClasse){
  const out = [];
  for (const r of list || []) {
    if (!r.path) { out.push(r); continue; }
    const to = versClasse + "/" + Date.now() + "-" + r.path.split("/").pop().replace(/^\d+-/, "");
    const { error } = await sb.storage.from("documents").copy(r.path, to);
    out.push(error ? r : { ...r, path: to });
  }
  return out;
}
async function reutiliser(k, id, versClasse, themeId = null, extra = {}){
  if (k === "devoir") { const d = S.devoirs.find(x => String(x.id) === String(id)); const { id: _i, publie_le, theme_id, eleves, ...rest } = d;
    return sb.from("devoirs").insert({ ...rest, classe_id: versClasse, theme_id: themeId, eleves: null, brouillon: true, ressources: await copierRessources(d.ressources, versClasse), ...extra }); }
  if (k === "support") { let s = null; for (const c of S.classes) { const data = S.cache[c.id]; if (data) { s = data.supports.find(x => String(x.id) === String(id)); if (s) break; } }
    const { id: _i, publie_le, theme_id, eleves, ...rest } = s;
    return sb.from("supports").insert({ ...rest, classe_id: versClasse, theme_id: themeId, eleves: null, brouillon: true, ressources: await copierRessources(s.ressources, versClasse), ...extra }); }
  const q = S.quiz.find(x => String(x.id) === String(id)); const { id: _i, publie_le, theme_id, eleves, ...rest } = q;
  const qs2 = [];
  for (const x of rest.questions || []) { if (x.img && versClasse !== q.classe_id) { const [cp] = await copierRessources([{ path: x.img }], versClasse); qs2.push({ ...x, img: cp.path }); } else qs2.push(x); }
  const ins = await sb.from("quiz").insert({ ...rest, questions: qs2, classe_id: versClasse, theme_id: themeId, eleves: null, brouillon: true, ...extra }).select("id").single();
  if (ins.error) return ins;
  const sol = await sb.from("quiz_solutions").select("bonnes").eq("quiz_id", q.id).maybeSingle();
  return sb.from("quiz_solutions").insert({ quiz_id: ins.data.id, bonnes: (sol.data && sol.data.bonnes) || [] });
}

const idDeCours = nom => (nom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "cours") + "-" + Math.random().toString(36).slice(2, 6);
async function copierCours(src, nom){
  const c = cls(src), data = await chargerClasse(src, true), id = idDeCours(nom);
  const { code, archive, ...rest } = c;
  const { error } = await sb.from("classes").insert({ ...rest, id, nom, archive: false, teams_url: null, dossier_onedrive: null, ordre: S.classes.reduce((a, x) => Math.max(a, x.ordre || 0), 0) + 1 });
  if (error) throw error;
  const map = {};
  for (const t of data.themes) { const r = await sb.from("themes").insert({ classe_id: id, titre: t.titre, ordre: t.ordre }).select("id").single(); if (r.error) throw r.error; map[t.id] = r.data.id; }
  const th = x => x.theme_id != null && map[x.theme_id] ? map[x.theme_id] : null;
  for (const d of S.devoirs.filter(x => x.classe_id === src)) { const r = await reutiliser("devoir", d.id, id, th(d)); if (r.error) throw r.error; }
  for (const s2 of data.supports) { const r = await reutiliser("support", s2.id, id, th(s2)); if (r.error) throw r.error; }
  for (const q of S.quiz.filter(x => x.classe_id === src)) { const r = await reutiliser("quiz", q.id, id, th(q)); if (r.error) throw r.error; }
  return id;
}
async function modalOk(){
  const m = S.modal, val = id => (document.getElementById(id) || {}).value || "";
  const done = async (msg, classe) => { S.modal = null; await rafraichir(classe); toast(msg); render(); };
  const stop = msg => { m.err = msg; m.busy = false; render(); };
  m.busy = true;
  try {
    if (m.kind === "demande") { const env = (document.getElementById("dmEnvoi") || {}).checked; await enregistrerDemande(m, env); S.modal = null; if (route().v !== "preparateur") go("/preparateur"); render(); if (!env) toast("Demande enregistrée"); return; }
    if (m.kind === "prep") { const v2 = val("dmPrep").trim(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v2)) return stop("Adresse e-mail invalide."); await sauverPrep(v2); const suite = m.ensuite; S.modal = null; render(); toast("Adresse du préparateur enregistrée"); if (suite) { const x = (S.demandes || []).find(y => y.id === suite); if (x) envoyerDemande(x); } return; }
    if (m.kind === "rdv") { const n = await creerRdv(); S.modal = null; S.rdvFrais = true; if (route().v !== "rendezvous") go("/rendezvous"); render(); toast(n + " créneau(x) créé(s)"); return; }
    if (m.kind === "urgprof") { const nom = await envoyerUrgProf(); S.modal = null; render(); toast("Message d'urgence envoyé à " + nom); return; }
    if (m.kind === "urgent") { await envoyerUrgent(m); S.modal = null; render(); toast("Message envoyé à " + nomProfCourt()); return; }
    if (m.kind === "copieauth") { m.busy = false; return copieAutoriser(); }
    if (m.kind === "placercours") { const pos = Number(val("mPos")); S.modal = null; render(); return deplacerA(m.id, pos); }
    if (m.kind === "placertheme") {
      const th = S.cache[m.classe].themes.filter(t => String(t.id) !== String(m.id)), k = th.findIndex(t => String(t.id) === val("mRef"));
      S.modal = null; return placerTheme(m.classe, m.id, k < 0 ? 0 : k + (val("mOu") === "apres" ? 1 : 0));
    }
    if (m.kind === "theme") {
      const t = val("mTitre").trim(); if (!t) return stop("Donne un nom au thème.");
      if (m.id) { const { error } = await sb.from("themes").update({ titre: t }).eq("id", m.id); if (error) throw error; return done("Thème renommé", m.classe); }
      const data = await chargerClasse(m.classe), ordre = data.themes.reduce((a, x) => Math.max(a, x.ordre), 0) + 1;
      const { data: ins, error } = await sb.from("themes").insert({ classe_id: m.classe, titre: t, ordre }).select("id").single(); if (error) throw error;
      if (m.fromEditor && S.ed) { delete S.cache[m.classe]; await chargerClasse(m.classe); S.ed.theme_id = String(ins.id); S.modal = null; toast("Thème ajouté"); return render(); }
      return done("Thème ajouté", m.classe);
    }
    if (m.kind === "prog") {
      const d = new Date(val("mDate") + "T" + (val("mHeure") || "08:00"));
      if (isNaN(d) || d <= now()) return stop("Choisis une date dans le futur.");
      S.modal = null; return enregistrer("schedule", d);
    }
    if (m.kind === "join") {
      const code = val("mCode").trim(); if (!code) return stop("Saisis le code du cours.");
      const { data, error } = await sb.rpc("rejoindre_classe", { p_code: code, p_nom: S.nom });
      if (error) return stop(error.message);
      S.modal = null; await rafraichir(); toast("Tu as rejoint « " + data.nom + " »"); go("/classe/" + data.id); return;
    }
    if (m.kind === "ajouteleves") {
      const cid = m.classe; if (!cls(cid)) return stop("Choisis un cours.");
      const L = analyserListe(m.texte, cid), ok = L.filter(x => !x.err && !x.deja);
      if (!ok.length) return stop(L.length ? "Aucun nouvel élève à ajouter (erreurs ou déjà inscrits)." : "Colle au moins une ligne.");
      const { error } = await sb.from("inscriptions").upsert(ok.map(x => ({ classe_id: cid, email: x.email, nom: x.nom })), { onConflict: "classe_id,email", ignoreDuplicates: true });
      if (error) throw error;
      return done(ok.length + " élève" + (ok.length > 1 ? "s ajoutés" : " ajouté") + " à " + cls(cid).nom, cid);
    }
    if (m.kind === "renomeleve") {
      const n = val("mNomEl").trim(); if (!n) return stop("Le nom ne peut pas être vide.");
      const { error } = await sb.from("inscriptions").update({ nom: n }).eq("email", m.email); if (error) throw error;
      return done("Nom modifié");
    }
    if (m.kind === "autrescours") {
      const dest = [...document.querySelectorAll(".mDest:checked")].map(x => x.value); if (!dest.length) return stop("Coche au moins un cours.");
      const noms = {}; inscritsDe(m.from).forEach(x => noms[x.email] = x.nom);
      const rows = dest.flatMap(cid => m.emails.map(email => ({ classe_id: cid, email, nom: noms[email] || nomDepuisEmail(email) })));
      const { error } = await sb.from("inscriptions").upsert(rows, { onConflict: "classe_id,email", ignoreDuplicates: true }); if (error) throw error;
      return done("Ajouté à " + dest.length + " cours");
    }
    if (m.kind === "copiercours") {
      const nom = val("mNomCopie").trim(); if (!nom) return stop("Donne un nom au nouveau cours.");
      const id = await copierCours(m.id, nom);
      S.modal = null; await rafraichir(); toast("Cours copié : les travaux sont en brouillon"); go("/classe/" + id + "/travaux"); return;
    }
    if (m.kind === "newclass") {
      const nom = val("mNom").trim(); if (!nom) return stop("Donne un nom au cours.");
      const id = idDeCours(nom), ordre = S.classes.reduce((a, x) => Math.max(a, x.ordre || 0), 0) + 1;
      const { error } = await sb.from("classes").insert({ id, nom, section: val("mSection").trim(), symbole: val("mSym").trim() || nom.slice(0, 3), couleur: val("mCouleur") || "pc", ordre }); if (error) throw error;
      S.modal = null; await rafraichir(); toast("Cours créé"); go("/classe/" + id); return;
    }
    if (m.kind === "liens") {
      const liens = m.liens.map(l => ({ nom: l.nom.trim(), url: l.url.trim() })).filter(l => l.nom || l.url);
      if (liens.find(l => !/^https?:\/\//.test(l.url) || !l.nom)) return stop("Chaque lien doit avoir un nom et une adresse qui commence par https://");
      const { error } = await sb.from("classes").update({ liens }).eq("id", m.classe); if (error) throw error;
      return done("Liens enregistrés");
    }
    if (m.kind === "cible") { S.ed.eleves = m.sel == null ? null : m.sel.slice(); S.modal = null; return render(); }
    if (m.kind === "reutiliser") {
      if (m.k === "depuis") { const v = val("mSource"); if (!v) return stop("Aucun élément à copier dans tes autres cours."); const [k2, id] = v.split(":"); const r = await reutiliser(k2, id, m.classe); if (r.error) throw r.error; return done("Copie ajoutée en brouillon", m.classe); }
      const dest = [...document.querySelectorAll(".mDest:checked")].map(x => x.value); if (!dest.length) return stop("Coche au moins un cours.");
      if (m.k === "support") await chargerClasse(m.classe);
      for (const cid of dest) { const r = await reutiliser(m.k, m.id, cid); if (r.error) throw r.error; delete S.cache[cid]; }
      return done("Copie ajoutée en brouillon dans " + dest.length + " cours");
    }
    if (m.kind === "supprclasse") {
      if (val("mConfirm").trim() !== m.nom) return stop("Le nom saisi ne correspond pas.");
      const docs = await sb.storage.from("documents").list(m.id, { limit: 1000 });
      if (docs.data && docs.data.length) await sb.storage.from("documents").remove(docs.data.map(f => m.id + "/" + f.name));
      const rendusFichiers = S.rendus.filter(r => (S.devoirs.find(d => d.id === r.devoir_id) || {}).classe_id === m.id).flatMap(r => (r.fichiers || []).map(f => f.chemin)).filter(Boolean);
      if (rendusFichiers.length) await sb.storage.from("rendus").remove(rendusFichiers);
      const nomCours = (cls(m.id) || {}).nom || m.nom;
      const { error } = await sb.from("classes").delete().eq("id", m.id); if (error) throw error;
      if (odActif()) supprimerDossierCours(nomCours).then(ok => { if (ok) toast("Dossier OneDrive « " + nomCours + " » mis à la corbeille"); }).catch(e => toast("Dossier OneDrive non supprimé : " + (e.message || e)));
      S.modal = null; await rafraichir(); toast("Cours supprimé"); go("/archives"); return;
    }
    if (m.kind === "confirm") {
      if (m.action === "suppr") {
        const table = m.k === "devoir" ? "devoirs" : m.k === "support" ? "supports" : "quiz";
        const rec = m.k === "devoir" ? S.devoirs.find(d => String(d.id) === m.id) : m.k === "support" ? ((S.cache[m.classe] || {supports:[]}).supports.find(x => String(x.id) === m.id)) : null;
        const { error } = await sb.from(table).delete().eq("id", m.id); if (error) throw error;
        const paths = ((rec && rec.ressources) || []).filter(x => x.path).map(x => x.path); if (paths.length) await sb.storage.from("documents").remove(paths);
        if (m.k === "devoir") { const f = S.rendus.filter(r => String(r.devoir_id) === m.id).flatMap(r => (r.fichiers || []).map(x => x.chemin)).filter(Boolean); if (f.length) await sb.storage.from("rendus").remove(f); }
        return done("Élément supprimé", m.classe);
      }
      if (m.action === "supprtheme") { const { error } = await sb.from("themes").delete().eq("id", m.id); if (error) throw error; return done("Thème supprimé", m.classe); }
      if (m.action === "retirer") { const { error } = await sb.from("inscriptions").delete().eq("classe_id", m.classe).in("email", m.emails); if (error) throw error; m.emails.forEach(x => S.pick.delete(x)); return done(m.emails.length > 1 ? "Élèves retirés du cours" : "Élève retiré du cours", m.classe); }
      if (m.action === "rien") { S.modal = null; render(); return; }
      if (m.action === "perte") { S.modal = null; S.outilsEdit = false; S.adm = null; render(); return; }
      if (m.action === "odorphelins") { let n = 0; for (const id of m.ids) { try { await graph("/me/drive/items/" + encodeURIComponent(id), { method: "DELETE" }, false); n++; } catch (e) { console.warn(e); } }
        S.modal = null; render(); toast(n + " dossier" + (n > 1 ? "s" : "") + " mis à la corbeille OneDrive"); return; }
      if (m.action === "dmsuppr") { const { error } = await sb.from("demandes_materiel").delete().eq("id", m.id); if (error) throw error; await chargerDemandes(); S.modal = null; render(); toast("Demande supprimée"); return; }
      if (m.action === "rdvsuppr") { const { error } = await sb.from("rdv_series").delete().eq("id", m.id); if (error) throw error; await chargerRdv(); S.modal = null; S.rdvFrais = true; render(); toast("Rendez-vous supprimés"); return; }
      if (m.action === "quitter") { const { error } = await sb.rpc("pp_quitter_cours", { p_classe: m.classe }); if (error) throw error;
        const nom = (cls(m.classe) || {}).nom || "le cours"; S.modal = null; delete S.cache[m.classe]; await rafraichir(); go("/"); render(); toast("Tu as quitté " + nom); return; }
      if (m.action === "supprcompte") { const { error } = await sb.rpc("pp_supprimer_compte", { p_email: m.email }); if (error) throw error;
        S.comptes = (S.comptes || []).filter(p => p.email !== m.email); S.toutesInscriptions = (S.toutesInscriptions || []).filter(x => x.email !== m.email);
        return done(m.nom + " a été supprimé"); }
      if (m.action === "retirertout") { const { error } = await sb.from("inscriptions").delete().eq("email", m.email); if (error) throw error; return done(m.nom + " a été retiré de tous les cours"); }
      if (m.action === "purge") { const n = await purgerFichiers(); S.fich = null; S.modal = null; await chargerFichiers(true); toast(n + " fichier" + (n > 1 ? "s supprimés" : " supprimé")); render(); return; }
      if (m.action === "supprannonce") { const { error } = await sb.from("annonces").delete().eq("id", m.id); if (error) throw error; return done("Annonce supprimée", m.classe); }
    }
  } catch (err) { stop("Action impossible : " + (err.message || err)); }
}
/* ---------- Paramètres de PhysiquePro (administration, prof uniquement) ---------- */
const ADM_TABS = [["profil", "Profil et notifications"], ["site", "Site"], ["cours", "Cours"], ["eleves", "Élèves"], ["fichiers", "Fichiers"], ["import", "Importer"], ["sauvegarde", "Sauvegarde"]];
const admTab = r => !S.prof ? "profil" : ADM_TABS.some(([k]) => k === r.a) ? r.a : "profil";
const getPath = (o, p) => p.split(".").reduce((x, k) => x == null ? x : x[k], o);
function setPath(o, p, v){ const ks = p.split("."), last = ks.pop(); const t = ks.reduce((x, k) => x[k], o); t[last] = v; }
const sansAccent = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const taille = b => b >= 1e9 ? (b / 1e9).toFixed(2).replace(".", ",") + " Go" : b >= 1e6 ? (b / 1e6).toFixed(1).replace(".", ",") + " Mo" : Math.max(0, Math.round(b / 1e3)) + " Ko";

function telecharger(nom, contenu, type){
  const b = new Blob([contenu], { type }), u = URL.createObjectURL(b), a = document.createElement("a");
  a.href = u; a.download = nom; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 5000);
}
const csv = rows => "﻿" + rows.map(r => r.map(v => { v = v == null ? "" : String(v); return /[";\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(";")).join("\r\n");

function initAdm(){
  if (S.adm) return;
  S.adm = { prof: { nom: R().prof.nom, titre: R().prof.titre }, liensUtiles: clone(R().liensUtiles), outils: clone(R().outils), remarques: R().remarques.join("\n"), onedrive: R().onedrive, busy: false, err: "", modif: false };
}

function vAdmin(r){
  const tab = admTab(r);
  const head = `<div class="tabsbar" style="--c:var(--accent)"><div class="tabs" role="tablist">${ADM_TABS.filter(([k]) => S.prof || k === "profil").map(([k, l]) => `<a role="tab" aria-selected="${tab === k}" href="#/admin/${k}">${l}</a>`).join("")}</div></div>`;
  const body = tab === "profil" ? admProfil() : tab === "site" ? admSite() : tab === "cours" ? admCours() : tab === "eleves" ? admEleves() : tab === "fichiers" ? admFichiers() : tab === "import" ? admImport() : admSauvegarde();
  return head + `<div class="page wide adm${tab === "profil" ? " crpage" : ""}"><div class="homehead"><h1>Paramètres</h1></div>${body}${pageFoot()}</div>`;
}

/* ----- onglet Site : identité, liens rapides, boîte à outils ----- */
function admOutils(){
  initAdm(); const A = S.adm, H = admHelpers(A);
  return `<div class="savebar${A.modif ? " on" : ""}"><span>${A.modif ? "Modifications non enregistrées" : "Ajoute, modifie ou supprime des liens, puis enregistre."}</span><span class="spacer"></span>
      <button class="btn ghost sm" data-act="outilsfin">Terminer</button><button class="btn sm" data-act="admsave" ${A.busy || !A.modif ? "disabled" : ""}>${A.busy ? "Enregistrement…" : "Enregistrer"}</button></div>
    ${A.err ? `<div class="notice" style="background:var(--bad-bg);color:var(--bad)">${esc(A.err)}</div>` : ""}${admOutilsSection(A, H.inp, H.outilsBtns)}`;
}
function admHelpers(A){
  const inp = (path, ph = "", type = "text", lab = "") => `<input type="${type}" data-ad="${path}" value="${esc(getPath(A, path))}" placeholder="${esc(ph)}" aria-label="${esc(lab || ph)}">`;
  const outilsBtns = (path, i, n) => `<span class="adbtns">${i > 0 ? `<button class="ib sm" data-act="admv" data-path="${path}" data-i="${i}" data-dir="-1" title="Monter" aria-label="Monter">${icon("up")}</button>` : ""}${i < n - 1 ? `<button class="ib sm" data-act="admv" data-path="${path}" data-i="${i}" data-dir="1" title="Descendre" aria-label="Descendre">${icon("down")}</button>` : ""}<button class="ib sm" data-act="adrm" data-path="${path}" data-i="${i}" title="Supprimer" aria-label="Supprimer">${icon("x")}</button></span>`;
  return { inp, outilsBtns };
}
function admSite(){
  initAdm(); const A = S.adm;
  const inp = (path, ph = "", type = "text", lab = "") => `<input type="${type}" data-ad="${path}" value="${esc(getPath(A, path))}" placeholder="${esc(ph)}" aria-label="${esc(lab || ph)}">`;
  const outilsBtns = (path, i, n) => `<span class="adbtns">${i > 0 ? `<button class="ib sm" data-act="admv" data-path="${path}" data-i="${i}" data-dir="-1" title="Monter" aria-label="Monter">${icon("up")}</button>` : ""}${i < n - 1 ? `<button class="ib sm" data-act="admv" data-path="${path}" data-i="${i}" data-dir="1" title="Descendre" aria-label="Descendre">${icon("down")}</button>` : ""}<button class="ib sm" data-act="adrm" data-path="${path}" data-i="${i}" title="Supprimer" aria-label="Supprimer">${icon("x")}</button></span>`;
  const quickPreview = `<nav class="quick preview-quick" aria-label="Aperçu des liens rapides">${A.liensUtiles.filter(l => l.nom).map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener" class="${l.principal ? "main" : ""}" style="--q:${esc(l.couleur || "#116482")}"><span class="qi">${quickIcon(l.icone)}</span><span class="ql">${esc(l.nom)}</span></a>`).join("")}</nav>`;
  return `${A.err ? `<div class="notice" style="background:var(--bad-bg);color:var(--bad)">${esc(A.err)}</div>` : ""}
    <div class="savebar${A.modif ? " on" : ""}"><span>${A.modif ? "Modifications non enregistrées" : "Tout est enregistré"}</span><span class="spacer"></span>
      ${A.modif ? `<button class="btn ghost sm" data-act="admreset">Annuler</button>` : ""}<button class="btn sm" data-act="admsave" ${A.busy || !A.modif ? "disabled" : ""}>${A.busy ? "Enregistrement…" : "Enregistrer"}</button></div>
    <section class="edcard"><h2>${icon("people")} Identité</h2>
      <div class="two"><div class="field"><label>Nom affiché</label>${inp("prof.nom", "ex. Jalal SOUHAID", "text", "Nom affiché")}</div>
      <div class="field"><label>Adresse du professeur</label><input value="${esc(R().prof.email)}" disabled></div></div>
      <div class="field"><label>Titre (bas de chaque page)</label>${inp("prof.titre", "ex. Professeur de Physique-Chimie", "text", "Titre")}</div>
      <p class="muted" style="margin:0;font-size:.82rem">Ton adresse ne se change pas ici : c'est elle qui te donne les droits de professeur.</p>
    </section>
    <section class="edcard"><h2>${icon("links")} Liens rapides en haut de page</h2>
      <p class="muted" style="margin:0;font-size:.85rem">Visibles par tous (toi et les élèves). Le lien « principal » est mis en avant (comme Pronote).</p>
      <div class="box" style="padding:10px">${quickPreview}</div>
      <div class="adlist">${A.liensUtiles.map((l, i) => `<div class="adrow lien">
        ${inp("liensUtiles." + i + ".nom", "Nom", "text", "Nom du lien " + (i + 1))}
        ${inp("liensUtiles." + i + ".url", "https://…", "url", "Adresse du lien " + (i + 1))}
        <select data-ad="liensUtiles.${i}.icone" aria-label="Icône">${ICONES.map(([v, t]) => `<option value="${v}" ${l.icone === v ? "selected" : ""}>${t}</option>`).join("")}</select>
        <input type="color" data-ad="liensUtiles.${i}.couleur" value="${esc(/^#[0-9a-f]{6}$/i.test(l.couleur || "") ? l.couleur : "#116482")}" aria-label="Couleur" title="Couleur">
        <label class="check" title="Lien principal"><input type="checkbox" data-ad="liensUtiles.${i}.principal" ${l.principal ? "checked" : ""}> Principal</label>
        <label class="check" title="Visible seulement par le professeur"><input type="checkbox" data-ad="liensUtiles.${i}.prof" ${l.prof ? "checked" : ""}> Prof seul</label>
        <label class="check" title="Masqué sur téléphone (place limitée)"><input type="checkbox" data-ad="liensUtiles.${i}.ordi" ${l.ordi ? "checked" : ""}> Ordinateur seul</label>
        ${outilsBtns("liensUtiles", i, A.liensUtiles.length)}</div>`).join("")}</div>
      <div><button class="btn ghost sm" data-act="adadd" data-path="liensUtiles" data-tpl="lien">${icon("plus")} Ajouter un lien rapide</button></div>
    </section>
    ${admOutilsSection(A, inp, outilsBtns)}
    <section class="edcard"><h2>${icon("nuage")} OneDrive</h2>
      <p class="muted" style="margin:0;font-size:.88rem">Activé, chaque document que tu joins est rangé dans ton OneDrive : <b>${OD_RACINE} › classe › thème › activité</b>, et partagé avec le lycée en lecture. Les élèves l'ouvrent dans Word, Excel ou PowerPoint en ligne. Toi, tu peux le modifier directement. Les travaux rendus par les élèves sont copiés dans <b>… › activité › Travaux rendus</b>.</p>
      <div class="setrow"><span><b>Connexion à OneDrive</b><small class="muted">${S.odOk ? "Connecté." : "À faire une fois : Microsoft te demande ton accord."}</small></span><button class="btn ghost sm" data-act="odconnect">${icon("nuage")} ${S.odOk ? "Vérifier" : "Connecter OneDrive"}</button></div>
      <label class="switch"><span><b>Ranger mes documents dans OneDrive</b><small class="muted">Les nouveaux documents joints vont dans OneDrive au lieu du stockage de PhysiquePro.</small></span><input type="checkbox" data-ad="onedrive" ${A.onedrive ? "checked" : ""}><i aria-hidden="true"></i></label>
      <div class="setrow"><span><b>Documents déjà publiés</b><small class="muted">Copie dans OneDrive les documents importés avant l'activation, puis met à jour les liens.</small></span><button class="btn ghost sm" data-act="odmigrer" ${S.odBusy ? "disabled" : ""}>${S.odBusy ? "Copie en cours… " + (S.odN || 0) : "Ranger dans OneDrive"}</button></div>
      <div class="setrow"><span><b>Confidentialité des dossiers</b><small class="muted">Les élèves ne voient jamais tes dossiers OneDrive : seulement les fichiers publiés pour eux sur le site. Les fichiers des brouillons restent privés jusqu'à leur publication. Vérification automatique à chaque ouverture du site.</small></span><button class="btn ghost sm" data-act="odconf">${icon("key")} Vérifier maintenant</button></div>
      <div class="setrow"><span><b>Dossiers des cours</b><small class="muted">Un dossier par cours, au nom actuel du cours : renomme les anciens dossiers, fusionne les doublons et met à jour les liens. Se fait aussi automatiquement quand tu renommes un cours.</small></span><button class="btn ghost sm" data-act="odranger">${icon("folder")} Ranger les dossiers</button></div>
      <div class="setrow"><span><b>Dossiers des cours supprimés</b><small class="muted">Quand tu supprimes un cours, son dossier OneDrive part automatiquement dans la corbeille. Ce bouton fait le ménage pour les cours supprimés avant cette option.</small></span><button class="btn ghost sm" data-act="odorphelins">${icon("trash")} Chercher</button></div>
    </section>
    <section class="edcard"><h2>${icon("comment")} Remarques de correction</h2>
      <p class="muted" style="margin:0;font-size:.85rem">Une remarque par ligne. Elles s'insèrent en un clic quand tu notes un travail.</p>
      <textarea data-ad="remarques" rows="7" class="adtext" aria-label="Remarques de correction">${esc(A.remarques)}</textarea></section>
    <section class="edcard"><h2>${icon("restore")} Valeurs d'origine</h2>
      <div class="setrow"><span><b>Revenir aux réglages d'origine</b><small class="muted">Remet le nom, les liens rapides et la boîte à outils du fichier config.js. Rien n'est enregistré tant que tu ne cliques pas sur « Enregistrer ».</small></span><button class="btn ghost sm" data-act="admdefaut">Rétablir</button></div>
    </section>`;
}
async function admEnregistrer(){
  const A = S.adm; A.err = "";
  const liens = A.liensUtiles.map(l => ({ nom: (l.nom || "").trim(), url: (l.url || "").trim(), icone: l.icone || "links", couleur: l.couleur || "#116482", principal: !!l.principal, prof: !!l.prof, ordi: !!l.ordi })).filter(l => l.nom || l.url);
  const outils = A.outils.map(g => ({ matiere: (g.matiere || "").trim(), couleur: g.couleur || "pc", liens: (g.liens || []).map(x => x.map(v => String(v || "").trim())).filter(x => x[0] || x[2]) })).filter(g => g.matiere || g.liens.length);
  if (!A.prof.nom.trim()) { A.err = "Le nom affiché est obligatoire."; return render(); }
  if (liens.some(l => !l.nom || !/^https?:\/\//.test(l.url))) { A.err = "Chaque lien rapide doit avoir un nom et une adresse qui commence par https://"; return render(); }
  if (outils.some(g => !g.matiere)) { A.err = "Chaque groupe de la boîte à outils doit avoir un nom."; return render(); }
  if (outils.some(g => g.liens.some(x => !x[0] || !/^https?:\/\//.test(x[2])))) { A.err = "Chaque outil doit avoir un nom et une adresse qui commence par https://"; return render(); }
  const data = { prof: { nom: A.prof.nom.trim(), titre: (A.prof.titre || "").trim() }, liensUtiles: liens, outils, remarques: String(A.remarques || "").split("\n").map(x => x.trim()).filter(Boolean), onedrive: !!A.onedrive };
  A.busy = true; render();
  const { error } = await sb.from("reglages").upsert({ id: 1, data, modifie_le: now().toISOString() });
  if (error) { A.busy = false; A.err = /reglages/.test(error.message) ? "La base n'est pas encore à jour (script 07 à exécuter dans Supabase)." : "Enregistrement impossible : " + error.message; return render(); }
  appliquerReglages(data); S.nom = R().prof.nom; S.adm = null; S.outilsEdit = false; toast("Réglages du site enregistrés"); render();
}

function admOutilsSection(A, inp, outilsBtns){
  return `<section class="edcard"><h2>${icon("tools")} Boîte à outils</h2>
      <p class="muted" style="margin:0;font-size:.85rem">Page « Boîte à outils » du menu, visible par les élèves. Un groupe par matière.</p>
      ${A.outils.map((g, i) => `<div class="adgroup" style="--c:var(--${esc(g.couleur || "pc")})">
        <div class="adrow grp">${inp("outils." + i + ".matiere", "Nom du groupe (ex. Physique-Chimie)", "text", "Nom du groupe")}
          <select data-ad="outils.${i}.couleur" aria-label="Couleur du groupe">${COULEURS.map(([v, t]) => `<option value="${v}" ${g.couleur === v ? "selected" : ""}>${t}</option>`).join("")}</select>
          ${outilsBtns("outils", i, A.outils.length)}</div>
        ${(g.liens || []).map((x, j) => `<div class="adrow outil">${inp("outils." + i + ".liens." + j + ".0", "Nom de l'outil", "text", "Nom de l'outil")}${inp("outils." + i + ".liens." + j + ".1", "Description courte", "text", "Description")}${inp("outils." + i + ".liens." + j + ".2", "https://…", "url", "Adresse")}<button class="ib sm" data-act="adrm" data-path="outils.${i}.liens" data-i="${j}" title="Supprimer" aria-label="Supprimer l'outil">${icon("x")}</button></div>`).join("")}
        <div><button class="linkbtn" data-act="adadd" data-path="outils.${i}.liens" data-tpl="outil">${icon("plus")} Ajouter un outil</button></div></div>`).join("")}
      <div><button class="btn ghost sm" data-act="adadd" data-path="outils" data-tpl="groupe">${icon("plus")} Ajouter un groupe</button></div>
    </section>`;
}
/* ----- onglet Cours ----- */
function admCours(){
  const list = [...actives(), ...S.classes.filter(c => c.archive)];
  return `<div class="travhead"><button class="btn" data-act="newclass">${icon("plus")} Créer un cours</button><span class="spacer"></span><span class="muted" style="font-size:.85rem">L'ordre ici est celui de l'accueil et du menu.</span></div>
    <div class="tablewrap"><table class="admtable"><thead><tr><th>Ordre</th><th class="first">Cours</th><th>Élèves</th><th>Code</th><th>Visio</th><th>OneDrive</th><th>Statut</th><th></th></tr></thead><tbody>
    ${list.map(c => { const act = actives(), i = act.indexOf(c);
      return `<tr><td>${c.archive ? "" : `<span class="adbtns">${i > 0 ? `<button class="ib sm" data-act="moveclasse" data-c="${esc(c.id)}" data-dir="-1" aria-label="Monter ${esc(c.nom)}" title="Monter">${icon("up")}</button>` : ""}${i < act.length - 1 ? `<button class="ib sm" data-act="moveclasse" data-c="${esc(c.id)}" data-dir="1" aria-label="Descendre ${esc(c.nom)}" title="Descendre">${icon("down")}</button>` : ""}</span>`}</td>
        <td class="first"><a class="who2" href="#/classe/${esc(c.id)}" style="text-decoration:none;color:inherit"><span class="ini" style="--bb:var(${C(c.couleur).b})">${esc((c.symbole || c.nom).slice(0, 3))}</span><span><b>${esc(c.nom)}</b><small class="muted" style="display:block">${esc(c.section)}</small></span></a></td>
        <td><a href="#/classe/${esc(c.id)}/personnes">${nbTxt(S.nbEleves[c.id])}</a></td>
        <td class="mono">${c.code ? esc(c.code) + (c.code_actif ? "" : ` <span class="pill">désactivé</span>`) : ""}</td>
        <td>${c.teams_url ? `<a href="${esc(c.teams_url)}" target="_blank" rel="noopener">${icon("video")}</a>` : `<span class="muted">—</span>`}</td>
        <td>${c.dossier_onedrive ? `<a href="${esc(c.dossier_onedrive)}" target="_blank" rel="noopener">${icon("folder")}</a>` : `<span class="muted">—</span>`}</td>
        <td>${c.archive ? `<span class="pill">Archivé</span>` : `<span class="pill ok">Actif</span>`}</td>
        <td><span class="adbtns"><a class="ib sm" href="#/classe/${esc(c.id)}/parametres" title="Paramètres du cours" aria-label="Paramètres de ${esc(c.nom)}">${icon("gear")}</a>
          <button class="ib sm" data-act="archiver" data-c="${esc(c.id)}" data-on="${c.archive ? "0" : "1"}" data-stay="1" title="${c.archive ? "Restaurer" : "Archiver"}" aria-label="${c.archive ? "Restaurer" : "Archiver"} ${esc(c.nom)}">${icon(c.archive ? "restore" : "archive")}</button>
          ${c.archive ? `<button class="ib sm" data-act="supprclasse" data-c="${esc(c.id)}" title="Supprimer" aria-label="Supprimer ${esc(c.nom)}" style="color:var(--bad)">${icon("trash")}</button>` : ""}</span></td></tr>`; }).join("")}
    </tbody></table></div>`;
}

/* ----- onglet Élèves ----- */
function tousLesEleves(){
  const M = new Map();
  (S.toutesInscriptions || []).forEach(x => { const e = M.get(x.email) || { email: x.email, nom: x.nom, classes: new Set(), compte: false }; e.classes.add(x.classe_id); M.set(x.email, e); });
  (S.comptes || []).filter(p => p.role !== "prof").forEach(p => { const e = M.get(p.email) || { email: p.email, nom: p.nom && !p.nom.includes("@") ? p.nom : nomDepuisEmail(p.email), classes: new Set() }; e.compte = true; e.depuis = p.cree_le; M.set(p.email, e); });
  return [...M.values()].sort((a, b) => sansAccent(a.nom).localeCompare(sansAccent(b.nom)));
}
function admEleves(){
  const tous = tousLesEleves(), act = actives(), q = sansAccent(S.admQ.trim());
  const f = S.admF || "";
  const list = tous.filter(e => (!q || sansAccent(e.nom + " " + e.email).includes(q)) && (!f || (f === "aucun" ? !e.classes.size : f === "jamais" ? !e.compte : e.classes.has(f))));
  return `<div class="travhead">
      <button class="btn" data-act="ajouteleves" data-c="">${icon("plus")} Ajouter des élèves</button>
      <div class="field filt"><label for="admQ">Rechercher</label><input id="admQ" data-adq="1" value="${esc(S.admQ)}" placeholder="Nom ou adresse"></div>
      <div class="field filt"><label for="admF">Afficher</label><select id="admF" data-adf="1"><option value="">Tous les élèves (${tous.length})</option>${act.map(c => `<option value="${esc(c.id)}" ${f === c.id ? "selected" : ""}>${esc(c.nom)}</option>`).join("")}<option value="aucun" ${f === "aucun" ? "selected" : ""}>Inscrits dans aucun cours</option><option value="jamais" ${f === "jamais" ? "selected" : ""}>Jamais connectés</option></select></div>
      <span class="spacer"></span><button class="btn ghost sm" data-act="exporteleves">${icon("down")} Exporter (CSV)</button></div>
    <p class="muted" style="margin:0;font-size:.85rem">Coche une case pour inscrire un élève dans un cours, décoche-la pour le retirer. Tu peux inscrire les élèves avant leur première connexion : il suffit de leur adresse Microsoft 365.</p>
    ${list.length ? `<div class="tablewrap"><table class="admtable"><thead><tr><th class="first">Élève</th>${act.map(c => `<th class="cc" title="${esc(c.nom)}"><span class="ini" style="--bb:var(${C(c.couleur).b})">${esc((c.symbole || c.nom).slice(0, 3))}</span></th>`).join("")}<th>Compte</th><th></th></tr></thead><tbody>
      ${list.map(e => `<tr><td class="first"><span class="who2">${avatarP(e.nom, "sm")}<span style="min-width:0"><b>${esc(e.nom)}</b><small class="muted" style="display:block;overflow-wrap:anywhere">${esc(e.email)}</small></span></span></td>
        ${act.map(c => `<td class="cc"><input type="checkbox" data-act="inscr" data-e="${esc(e.email)}" data-n="${esc(e.nom)}" data-c="${esc(c.id)}" ${e.classes.has(c.id) ? "checked" : ""} aria-label="${esc(e.nom)} inscrit en ${esc(c.nom)}"></td>`).join("")}
        <td>${e.compte ? `<span class="pill ok">Connecté</span>` : `<span class="pill">Jamais connecté</span>`}</td>
        <td><div class="dd kebab"><button class="ib sm" data-act="menu" data-m="ae${esc(e.email)}" aria-label="Options">${icon("more")}</button>${S.menu === "ae" + e.email ? `<div class="dd-menu">
          <a href="#" data-act="renomeleve" data-e="${esc(e.email)}" data-n="${esc(e.nom)}">${icon("edit")} Modifier le nom</a>
          <a href="${esc(outlookLink([e.email], "", ""))}" target="_blank" rel="noopener">${icon("mail")} Envoyer un e-mail</a>
          ${e.classes.size ? `<a href="#" data-act="retirertout" data-e="${esc(e.email)}" data-n="${esc(e.nom)}" style="color:var(--bad)">${icon("trash")} Retirer de tous les cours</a>` : ""}
          <a href="#" data-act="supprcompte" data-e="${esc(e.email)}" data-n="${esc(e.nom)}" style="color:var(--bad)">${icon("trash")} Supprimer l'élève${e.compte ? " et son compte" : ""}</a></div>` : ""}</div></td></tr>`).join("")}
    </tbody></table></div>` : `<div class="emptystate"><b>${tous.length ? "Aucun élève ne correspond." : "Aucun élève pour l'instant."}</b><span>${tous.length ? "Change la recherche ou le filtre." : "Ajoute tes listes de classe avec « Ajouter des élèves », ou donne le code du cours aux élèves."}</span></div>`}`;
}

/* lecture d'une liste collée (Pronote, Excel, e-mails…) */
function analyserListe(txt, classe){
  const out = [], vus = new Set(), dom = "@" + CFG.domaine;
  const norm = x => sansAccent(x).replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  const cap = x => x.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
  String(txt || "").split(/\r?\n/).map(l => l.trim()).filter(Boolean).forEach(l => {
    const m = l.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
    let email = "", nom = "", deduit = false, err = "";
    if (m) { email = m[0].toLowerCase(); nom = l.replace(m[0], " ").replace(/[;,\t<>"()]+/g, " ").replace(/\s+/g, " ").trim() || nomDepuisEmail(email); }
    else {
      const parts = l.replace(/[;,\t]+/g, " ").replace(/\s+/g, " ").trim().split(" ");
      if (parts.length < 2) err = "Indique le nom et le prénom, ou l'adresse e-mail.";
      else {
        const maj = parts.filter(p => p === p.toUpperCase() && /\p{L}/u.test(p) && p.length > 1);
        let nomF, prenom;
        if (maj.length && maj.length < parts.length) { nomF = maj.join(" "); prenom = parts.filter(p => !maj.includes(p)).join(" "); }
        else { prenom = parts[0]; nomF = parts.slice(1).join(" "); }
        email = (CFG.prefixeEleve ?? "lv.") + norm(prenom) + "." + norm(nomF) + dom; nom = cap(prenom) + " " + nomF.toUpperCase(); deduit = true;
      }
    }
    if (email && !email.endsWith(dom)) err = "Adresse hors du lycée (" + dom + ").";
    else if (email && vus.has(email)) err = "En double dans la liste.";
    if (email) vus.add(email);
    const deja = !err && classe && (S.toutesInscriptions || []).some(x => x.classe_id === classe && x.email === email);
    out.push({ ligne: l, email, nom, deduit, err, deja });
  });
  return out;
}
function apercuListe(m){
  const L = analyserListe(m.texte, m.classe), ok = L.filter(x => !x.err && !x.deja);
  if (!L.length) return `<p class="muted" style="margin:0;font-size:.85rem">L'aperçu apparaîtra ici.</p>`;
  return `<div class="apercu"><b>${ok.length} élève${ok.length > 1 ? "s" : ""} à ajouter</b>${L.some(x => x.deduit) ? ` <span class="muted" style="font-size:.8rem">· vérifie les adresses déduites (en orange)</span>` : ""}
    <ul>${L.map(x => `<li class="${x.err ? "bad" : x.deja ? "deja" : x.deduit ? "deduit" : ""}"><span>${esc(x.nom || x.ligne)}</span><small>${x.err ? esc(x.err) : esc(x.email) + (x.deja ? " · déjà inscrit" : x.deduit ? " · adresse déduite" : "")}</small></li>`).join("")}</ul></div>`;
}

/* ----- onglet Fichiers ----- */
async function chargerFichiers(force){
  if (S.fich && !force) return S.fich;
  const [f, su, an] = await Promise.all([sb.rpc("pp_fichiers"), sb.from("supports").select("id, classe_id, titre, ressources"), sb.from("annonces").select("id, classe_id, ressources")]);
  if (f.error) return S.fich = { err: f.error.message };
  return S.fich = { fichiers: f.data || [], supports: su.data || [], annonces: an.data || [] };
}
/* fichiers privés du professeur (calendrier dynamique…) : jamais considérés comme inutilisés */
const estPrive = x => x.bucket === "documents" && /^prof\//.test(x.chemin);
function analyseFichiers(){
  const F = S.fich, refs = new Map(), heure = new Date(now() - 3600e3);
  const ajoute = (list, k, lib) => (list || []).forEach(o => (o.ressources || []).forEach(x => x.path && refs.set(x.path, { k, o, lib: lib(o) })));
  ajoute(S.devoirs, "devoir", o => "Devoir · " + o.titre); ajoute(F.supports, "support", o => "Documentation · " + o.titre); ajoute(F.annonces, "annonce", o => "Annonce du flux");
  const rendusRefs = new Set(S.rendus.flatMap(r => (r.fichiers || []).map(x => x.chemin)).filter(Boolean));
  const parClasse = {}, orphelins = [];
  const devoirClasse = id => (S.devoirs.find(d => String(d.id) === id) || {}).classe_id;
  F.fichiers.forEach(x => {
    const seg = x.chemin.split("/")[0], cid = x.bucket === "documents" ? seg : devoirClasse(seg) || "?";
    const P = parClasse[cid] = parClasse[cid] || { docs: 0, docsT: 0, rendus: 0, rendusT: 0 };
    if (x.bucket === "documents") { P.docs++; P.docsT += x.taille; } else { P.rendus++; P.rendusT += x.taille; }
    const utilise = x.bucket === "documents" ? refs.has(x.chemin) : rendusRefs.has(x.chemin);
    if (!utilise && !estPrive(x) && D(x.cree_le) < heure) orphelins.push(x);
  });
  return { refs, parClasse, orphelins, total: F.fichiers.reduce((a, x) => a + x.taille, 0) };
}
function admFichiers(){
  const F = S.fich;
  if (!F) return `<div class="loading"><div><div class="spin"></div>Chargement des fichiers…</div></div>`;
  if (F.err) return `<div class="notice" style="background:var(--bad-bg);color:var(--bad)">Liste des fichiers indisponible : ${esc(F.err)}</div>`;
  const A = analyseFichiers(), quota = 1e9, pc = Math.min(100, Math.round(A.total / quota * 100));
  const nomC = id => (cls(id) || {}).nom || (id === "?" ? "Devoirs supprimés" : id === "prof" ? "Fichiers privés du professeur (calendrier…)" : id);
  const gros = F.fichiers.filter(x => x.bucket === "documents").sort((a, b) => b.taille - a.taille).slice(0, 12);
  return `<div class="travhead"><span class="spacer"></span><button class="btn ghost sm" data-act="admfichiers">${icon("restore")} Actualiser</button></div>
    <section class="edcard"><h2>${icon("nuage")} Espace utilisé</h2>
      <div class="jauge"><i style="width:${pc}%"></i></div>
      <p style="margin:0"><b>${taille(A.total)}</b> sur 1 Go (offre gratuite Supabase) · ${F.fichiers.length} fichier${F.fichiers.length > 1 ? "s" : ""}</p>
      <p class="muted" style="margin:0;font-size:.85rem">Les liens OneDrive ne comptent pas : seuls les fichiers importés dans PhysiquePro et les travaux rendus par les élèves occupent cet espace.</p></section>
    <section class="edcard"><h2>${icon("folder")} Par cours</h2>
      <div class="tablewrap"><table class="admtable"><thead><tr><th class="first">Cours</th><th>Documents du prof</th><th>Travaux des élèves</th><th>Total</th></tr></thead><tbody>
      ${Object.entries(A.parClasse).sort((a, b) => (b[1].docsT + b[1].rendusT) - (a[1].docsT + a[1].rendusT)).map(([id, P]) => `<tr><td class="first">${esc(nomC(id))}</td><td>${P.docs} · ${taille(P.docsT)}</td><td>${P.rendus} · ${taille(P.rendusT)}</td><td><b>${taille(P.docsT + P.rendusT)}</b></td></tr>`).join("") || `<tr><td colspan="4" class="muted">Aucun fichier.</td></tr>`}
      </tbody></table></div></section>
    <section class="edcard"><h2>${icon("trash")} Fichiers inutilisés</h2>
      ${A.orphelins.length ? `<p style="margin:0">${A.orphelins.length} fichier${A.orphelins.length > 1 ? "s" : ""} ne ${A.orphelins.length > 1 ? "sont" : "est"} plus utilisé${A.orphelins.length > 1 ? "s" : ""} par aucun devoir, documentation, annonce ou travail rendu (${taille(A.orphelins.reduce((a, x) => a + x.taille, 0))}).</p>
        <ul class="files">${A.orphelins.slice(0, 15).map(x => `<li><a href="#" data-act="openfile" data-bucket="${esc(x.bucket)}" data-path="${esc(x.chemin)}">${icon("file")} ${esc(x.chemin.split("/").pop().replace(/^\d+-/, ""))}</a><span class="mono muted">${taille(x.taille)}</span></li>`).join("")}</ul>
        <div><button class="btn danger sm" data-act="purge">${icon("trash")} Supprimer les fichiers inutilisés</button></div>`
      : `<p class="muted" style="margin:0">Aucun fichier inutilisé : tout est propre.</p>`}</section>
    <section class="edcard"><h2>${icon("file")} Plus gros documents</h2>
      ${gros.length ? `<ul class="files">${gros.map(x => { const ref = A.refs.get(x.chemin); return `<li><a href="#" data-act="openfile" data-bucket="documents" data-path="${esc(x.chemin)}">${icon("file")} ${esc(x.chemin.split("/").pop().replace(/^\d+-/, ""))}</a><span class="muted" style="font-size:.8rem">${esc(nomC(x.chemin.split("/")[0]))}${ref ? " · " + esc(ref.lib) : " · inutilisé"} · <span class="mono">${taille(x.taille)}</span></span></li>`; }).join("")}</ul>` : `<p class="muted" style="margin:0">Aucun document importé.</p>`}
      <p class="muted" style="margin:0;font-size:.82rem">Astuce : pour les vidéos et les gros fichiers, utilise plutôt un lien OneDrive.</p></section>`;
}
async function purgerFichiers(){
  const A = analyseFichiers(), par = {};
  A.orphelins.filter(x => !estPrive(x)).forEach(x => (par[x.bucket] = par[x.bucket] || []).push(x.chemin));
  for (const b of Object.keys(par)) for (let i = 0; i < par[b].length; i += 100) { const { error } = await sb.storage.from(b).remove(par[b].slice(i, i + 100)); if (error) throw error; }
  return A.orphelins.length;
}

/* ----- onglet Sauvegarde ----- */
function admSauvegarde(){
  return `<section class="edcard"><h2>${icon("down")} Sauvegarde complète</h2>
      <p style="margin:0">Télécharge toutes les données du site dans un fichier : cours, thèmes, devoirs, questionnaires, documentations, annonces, listes d'élèves, rendus, notes et réglages.</p>
      <p class="muted" style="margin:0;font-size:.85rem">Les fichiers eux-mêmes (PDF, photos…) ne sont pas dans la sauvegarde : ils restent dans Supabase et dans ton OneDrive. Fais une sauvegarde au moins une fois par trimestre.</p>
      <div><button class="btn" data-act="backup" ${S.backupBusy ? "disabled" : ""}>${S.backupBusy ? "Préparation…" : "Télécharger la sauvegarde"}</button></div></section>
    <section class="edcard"><h2>${icon("grade")} Notes vers Excel ou Pronote</h2>
      <p class="muted" style="margin:0;font-size:.85rem">Un fichier CSV par cours, qui s'ouvre dans Excel : une ligne par élève, une colonne par devoir ou questionnaire noté, et la moyenne sur 20.</p>
      <div class="adbtns" style="flex-wrap:wrap;gap:8px">${actives().map(c => `<button class="btn ghost sm" data-act="exportnotes" data-c="${esc(c.id)}">${esc(c.nom)}</button>`).join("")}</div></section>
    <section class="edcard"><h2>${icon("people")} Listes d'élèves</h2>
      <div><button class="btn ghost sm" data-act="exporteleves">${icon("down")} Exporter tous les élèves (CSV)</button></div></section>
    <section class="edcard"><h2>${icon("gear")} Raccourcis techniques</h2>
      <p class="muted" style="margin:0;font-size:.85rem">Tu n'en as normalement plus besoin : tout se règle depuis cette page. Ils restent utiles en cas de souci.</p>
      <div class="classlinks">
        <a href="https://supabase.com/dashboard/project/${esc((CFG.supabaseUrl.match(/https:\/\/([^.]+)/) || [])[1] || "")}" target="_blank" rel="noopener">${icon("links")}<span>Supabase · base de données et fichiers</span></a>
        <a href="https://github.com/jalalsouhaidlv/physiquepro" target="_blank" rel="noopener">${icon("links")}<span>GitHub · fichiers du site</span></a>
        <a href="https://entra.microsoft.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Credentials/appId/f52213ef-d098-49cc-ac22-944c23bcab61" target="_blank" rel="noopener">${icon("links")}<span>Microsoft Entra · connexion Microsoft 365 (secret valable jusqu'au 16/10/2028)</span></a>
      </div></section>`;
}
async function sauvegarder(){
  const tables = ["reglages", "classes", "themes", "supports", "devoirs", "quiz", "quiz_solutions", "inscriptions", "annonces", "commentaires", "commentaires_prives", "rendus", "corrections", "resultats_quiz", "profiles"];
  const out = { site: "PhysiquePro", exporte_le: now().toISOString(), tables: {} };
  const res = await Promise.all(tables.map(t => sb.from(t).select("*")));
  res.forEach((r, i) => { out.tables[tables[i]] = r.error ? { erreur: r.error.message } : r.data; });
  telecharger("physiquepro-sauvegarde-" + ymd(now()) + ".json", JSON.stringify(out, null, 1), "application/json");
}
async function exporterNotes(cid){
  const c = cls(cid), data = await chargerClasse(cid), el = data.eleves;
  const cols = [...S.devoirs.filter(d => d.classe_id === cid && d.points != null && !d.brouillon).map(d => ({ k: "d", o: d })), ...S.quiz.filter(q => q.classe_id === cid && q.mode === "note" && !q.brouillon).map(q => ({ k: "q", o: q }))]
    .sort((a, b) => D(a.o.publie_le) - D(b.o.publie_le));
  const uidDe = email => Object.keys(S.profils).find(id => S.profils[id] === email);
  const val = (col, e) => { if (col.k === "q") { const uid = uidDe(e.email), r = uid && resultatDe(col.o, uid); return r ? noteQuiz(col.o, r) : null; }
    if (col.o.eleves && !col.o.eleves.includes(e.email)) return null; const cr = correctionDe(renduDe(col.o, e.email)); return cr && cr.note != null ? Number(cr.note) : null; };
  const rows = [["Élève", "Adresse", ...cols.map(col => col.o.titre + " (/" + col.o.points + (col.o.categorie ? " · " + col.o.categorie : "") + ")"), (c.categories || []).length ? "Moyenne pondérée /20" : "Moyenne /20"]];
  el.forEach(e => { const v = cols.map(col => val(col, e)), m = moyenneDe(c, e.email, uidDe(e.email), false).moy;
    rows.push([e.nom, e.email, ...v.map(x => x == null ? "" : fmtNote(x)), m == null ? "" : fmtNote(Math.round(m * 100) / 100)]); });
  telecharger("notes-" + sansAccent(c.nom).replace(/[^a-z0-9]+/g, "-") + "-" + ymd(now()) + ".csv", csv(rows), "text/csv;charset=utf-8");
  toast("Notes exportées : " + c.nom);
}
function exporterEleves(){
  const act = S.classes;
  const rows = [["Nom", "Adresse", "Cours", "Compte"]];
  tousLesEleves().forEach(e => rows.push([e.nom, e.email, [...e.classes].map(id => (act.find(c => c.id === id) || {}).nom || id).join(", "), e.compte ? "connecté" : "jamais connecté"]));
  telecharger("eleves-physiquepro-" + ymd(now()) + ".csv", csv(rows), "text/csv;charset=utf-8");
}

const confirmerPerte = () => { S.modal = { kind: "confirm", action: "perte", titre: "Quitter sans enregistrer ?", texte: "Tes modifications de la boîte à outils seront perdues.", ok: "Quitter" }; render(); return false; };
/* ---------- déplacer les cours (glisser-déposer, comme Classroom) ---------- */
async function enregistrerOrdre(ids){
  if (S.prof) {
    ids.forEach((id, n) => { const c = cls(id); if (c) c.ordre = n + 1; });
    S.classes.sort((a, b) => (a.archive - b.archive) || (a.ordre - b.ordre));
    render();
    const res = await Promise.all(ids.map((id, n) => sb.from("classes").update({ ordre: n + 1 }).eq("id", id)));
    if (res.some(x => x.error)) { toast("L'ordre n'a pas pu être enregistré."); await rafraichir(); render(); }
  } else {
    try { localStorage.setItem("pp_ordre_" + S.user.id, JSON.stringify(ids)); } catch (_) {}
    render();
  }
}
function deplacerA(id, pos){
  const ids = actives().map(c => c.id).filter(x => x !== id);
  ids.splice(Math.max(0, Math.min(pos, ids.length)), 0, id);
  return enregistrerOrdre(ids);
}
const DG = { el: null, ghost: null, x0: 0, y0: 0, dx: 0, dy: 0, on: false, timer: null, pid: null, bloqueClic: false };
function finDrag(annule){
  clearTimeout(DG.timer);
  if (DG.on) {
    const ids = [...document.querySelectorAll(".cards .ccard.movable")].map(x => x.dataset.cid);
    DG.ghost && DG.ghost.remove(); DG.el.classList.remove("dragph"); document.body.classList.remove("dragging");
    DG.bloqueClic = true; setTimeout(() => { DG.bloqueClic = false; }, 50);
    const avant = actives().map(c => c.id).join();
    if (!annule && ids.join() !== avant) enregistrerOrdre(ids); else render();
  }
  DG.el = null; DG.ghost = null; DG.on = false; DG.pid = null;
}
function debutDrag(){
  const r = DG.el.getBoundingClientRect();
  DG.dx = DG.x0 - r.left; DG.dy = DG.y0 - r.top;
  const g = DG.el.cloneNode(true); g.classList.add("dragghost"); g.style.width = r.width + "px"; g.style.height = r.height + "px";
  g.style.left = r.left + "px"; g.style.top = r.top + "px"; document.body.appendChild(g);
  DG.ghost = g; DG.on = true; DG.el.classList.add("dragph"); document.body.classList.add("dragging");
  fermerMenus();
}
function bougeDrag(x, y){
  DG.ghost.style.left = (x - DG.dx) + "px"; DG.ghost.style.top = (y - DG.dy) + "px";
  const sous = document.elementFromPoint(x, y), cible = sous && sous.closest(".cards .ccard.movable");
  if (cible && cible !== DG.el) {
    const list = [...document.querySelectorAll(".cards .ccard.movable")], i = list.indexOf(DG.el), j = list.indexOf(cible);
    cible.parentNode.insertBefore(DG.el, i < j ? cible.nextSibling : cible);
  }
  if (y < 70) window.scrollBy(0, -12); else if (y > window.innerHeight - 50) window.scrollBy(0, 12);
}
document.addEventListener("pointerdown", e => {
  if (e.button !== 0 || route().v !== "accueil") return;
  const card = e.target.closest(".cards .ccard.movable");
  if (!card || e.target.closest(".dd-menu") || e.target.closest("input")) return;
  DG.el = card; DG.x0 = e.clientX; DG.y0 = e.clientY; DG.pid = e.pointerId; DG.on = false;
  if (e.pointerType === "touch") DG.timer = setTimeout(() => { if (DG.el && !DG.on) { debutDrag(); bougeDrag(DG.x0, DG.y0); if (navigator.vibrate) try { navigator.vibrate(20); } catch (_) {} } }, 380);
});
document.addEventListener("pointermove", e => {
  if (!DG.el || e.pointerId !== DG.pid) return;
  if (!DG.on) {
    const d = Math.hypot(e.clientX - DG.x0, e.clientY - DG.y0);
    if (e.pointerType === "touch") { if (d > 10) { clearTimeout(DG.timer); DG.el = null; } return; }
    if (d < 6) return;
    debutDrag();
  }
  e.preventDefault(); bougeDrag(e.clientX, e.clientY);
});
document.addEventListener("touchmove", e => { if (DG.on) e.preventDefault(); }, { passive: false });
document.addEventListener("pointerup", e => { if (DG.el && e.pointerId === DG.pid) finDrag(false); });
document.addEventListener("pointercancel", () => { if (DG.el) finDrag(true); });
document.addEventListener("click", e => { if (DG.bloqueClic) { e.preventDefault(); e.stopPropagation(); } }, true);
document.addEventListener("dragstart", e => { if (e.target.closest && e.target.closest(".cards .ccard.movable")) e.preventDefault(); });

/* ---------- déplacer les thèmes et les travaux (onglet Travaux et devoirs) ---------- */
const DT = { el: null, kind: null, ghost: null, x0: 0, y0: 0, dx: 0, dy: 0, on: false, pid: null, timer: null, depuis: null };
const sections = () => [...document.querySelectorAll(".page section.theme.movable")];
function dtDebut(){
  const r = DT.el.getBoundingClientRect(), src = DT.kind === "theme" ? DT.el.querySelector(".themehead") : DT.el;
  const g = src.cloneNode(true); g.classList.add("dragghost", "dtghost"); g.style.width = r.width + "px";
  DT.dx = DT.x0 - r.left; DT.dy = DT.y0 - r.top; g.style.left = r.left + "px"; g.style.top = r.top + "px";
  document.body.appendChild(g); DT.ghost = g; DT.on = true; DT.el.classList.add("dtph"); document.body.classList.add("dragging");
  if (DT.kind === "theme") document.querySelectorAll(".page section.theme").forEach(x => x.classList.add("compact"));
  DT.depuis = DT.kind === "item" ? DT.el.closest("section.theme").dataset.tid : null;
  DT.avant = DT.kind === "item" ? [...DT.el.closest("section.theme").querySelectorAll(".work[data-wk]")].map(x => x.dataset.wk).join() : null; fermerMenus();
}
function dtBouge(x, y){
  DT.ghost.style.left = (x - DT.dx) + "px"; DT.ghost.style.top = (y - DT.dy) + "px";
  DT.px = x; DT.py = y;
  const sous = document.elementFromPoint(x, y);
  if (DT.kind === "theme") {
    const autres = sections().filter(x => x !== DT.el && x.dataset.tid !== "none");
    if (autres.length) {
      const avant = autres.find(x => { const r = x.getBoundingClientRect(); return y < r.top + r.height / 2; });
      const ref = avant || autres[autres.length - 1].nextSibling;
      if (ref !== DT.el && ref !== DT.el.nextSibling) autres[0].parentNode.insertBefore(DT.el, ref);
    }
  } else {
    if (!sous) return;
    const sec = sous.closest("section.theme.movable"); if (!sec) return;
    const w = sous.closest(".work[data-wk]");
    if (w && w !== DT.el && sec.contains(w)) { const r = w.getBoundingClientRect(); w.parentNode.insertBefore(DT.el, y < r.top + r.height / 2 ? w : w.nextSibling); }
    else if (!w && !sec.contains(DT.el)) { const vide = sec.querySelector("p.empty"); if (vide) vide.remove(); sec.appendChild(DT.el); }
  }
}
/* défilement automatique continu quand le pointeur reste près du haut ou du bas de l'écran */
setInterval(() => {
  if (!DT.on || DT.py == null) return;
  const h = window.innerHeight, v = DT.py < 110 ? -Math.ceil((110 - DT.py) / 6) : DT.py > h - 80 ? Math.ceil((DT.py - h + 80) / 5) : 0;
  if (v) { window.scrollBy(0, v); dtBouge(DT.px, DT.py); }
}, 16);
async function dtFin(annule){
  clearTimeout(DT.timer);
  const was = DT.on, kind = DT.kind, el = DT.el, depuis = DT.depuis, cid = route().a;
  DT.el = null; DT.on = false; DT.pid = null; DT.py = null;
  if (!was) return;
  DT.ghost && DT.ghost.remove(); el.classList.remove("dtph"); document.body.classList.remove("dragging");
  document.querySelectorAll(".page section.theme.compact").forEach(x => x.classList.remove("compact"));
  DG.bloqueClic = true; setTimeout(() => { DG.bloqueClic = false; }, 50);
  if (annule) return render();
  if (kind === "theme") {
    const ids = sections().map(x => x.dataset.tid).filter(x => x !== "none");
    const data = S.cache[cid]; if (!data) return render();
    if (ids.join() === data.themes.map(t => String(t.id)).join()) return render();
    data.themes.sort((a, b) => ids.indexOf(String(a.id)) - ids.indexOf(String(b.id))); data.themes.forEach((t, n) => t.ordre = n + 1); render();
    const res = await Promise.all(ids.map((id, n) => sb.from("themes").update({ ordre: n + 1 }).eq("id", id)));
    if (res.some(x => x.error)) toast("L'ordre des thèmes n'a pas pu être enregistré."); else toast("Thèmes réorganisés");
    delete S.cache[cid]; return render();
  }
  const sec = el.closest("section.theme"), vers = sec.dataset.tid, wks = [...sec.querySelectorAll(".work[data-wk]")].map(x => x.dataset.wk);
  if (vers === depuis && wks.join() === DT.avant) return render();
  return ordonnerItems(cid, vers, wks, vers !== depuis ? el.dataset.wk : null);
}
/* enregistre l'ordre des éléments d'un thème (et le changement de thème éventuel) */
async function ordonnerItems(cid, tid, wks, change){
  const T = { devoir: "devoirs", support: "supports", quiz: "quiz" }, theme = tid === "none" ? null : Number(tid);
  const trouve = (k, id) => k === "devoir" ? S.devoirs.find(x => String(x.id) === id) : k === "quiz" ? S.quiz.find(x => String(x.id) === id) : ((S.cache[cid] || {}).supports || []).find(x => String(x.id) === id);
  wks.forEach((w, n) => { const [k, id] = w.split(":"), o = trouve(k, id); if (o) { o.position = n + 1; if (w === change) o.theme_id = theme; } });
  render();
  const res = await Promise.all(wks.map((w, n) => { const [k, id] = w.split(":"), row = { position: n + 1 }; if (w === change) row.theme_id = theme; return sb.from(T[k]).update(row).eq("id", id); }));
  const err = res.find(x => x.error);
  if (err) toast(/position/.test(err.error.message) ? "Mise à jour de la base nécessaire (étape 12)." : "Déplacement impossible : " + err.error.message);
  else toast(change ? (tid === "none" ? "Déplacé dans « Aucun thème »" : "Déplacé dans le thème") : "Ordre enregistré");
  await rafraichir(cid); render();
}
document.addEventListener("pointerdown", e => {
  if (e.button !== 0 || !S.prof) return;
  const r = route(); if (r.v !== "classe" || (r.t && r.t !== "travaux") || (!r.t && fluxVisible(cls(r.a) || {}))) return;
  if (e.target.closest(".dd, .dd-menu, input, select")) return;
  const head = e.target.closest("section.theme.movable .themehead"), work = e.target.closest(".work[data-wk]");
  let el = null, kind = null;
  if (head && head.parentNode.dataset.tid !== "none" && !e.target.closest("button")) { el = head.parentNode; kind = "theme"; }
  else if (work && !e.target.closest(".workd")) { el = work; kind = "item"; }
  if (!el) return;
  Object.assign(DT, { el, kind, x0: e.clientX, y0: e.clientY, pid: e.pointerId, on: false });
  if (e.pointerType === "touch") DT.timer = setTimeout(() => { if (DT.el && !DT.on) { dtDebut(); dtBouge(DT.x0, DT.y0); } }, 380);
});
document.addEventListener("pointermove", e => {
  if (!DT.el || e.pointerId !== DT.pid) return;
  if (!DT.on) { const d = Math.hypot(e.clientX - DT.x0, e.clientY - DT.y0);
    if (e.pointerType === "touch") { if (d > 10) { clearTimeout(DT.timer); DT.el = null; } return; }
    if (d < 6) return; dtDebut(); }
  e.preventDefault(); dtBouge(e.clientX, e.clientY);
});
document.addEventListener("touchmove", e => { if (DT.on) e.preventDefault(); }, { passive: false });
document.addEventListener("pointerup", e => { if (DT.el && e.pointerId === DT.pid) dtFin(false); });
document.addEventListener("pointercancel", () => { if (DT.el) dtFin(true); });

/* place un thème à la position voulue (0 = premier) et enregistre l'ordre */
async function placerTheme(cid, id, pos){
  const data = await chargerClasse(cid), th = data.themes.slice(), i = th.findIndex(t => String(t.id) === String(id));
  if (i < 0) return render();
  const [t] = th.splice(i, 1); th.splice(Math.max(0, Math.min(pos, th.length)), 0, t);
  if (th.map(x => x.id).join() === data.themes.map(x => x.id).join()) return render();
  th.forEach((x, n) => x.ordre = n + 1); data.themes = th; render();
  const res = await Promise.all(th.map((x, n) => sb.from("themes").update({ ordre: n + 1 }).eq("id", x.id)));
  if (res.some(x => x.error)) toast("Déplacement impossible."); else toast("Thème déplacé");
  delete S.cache[cid]; render();
}
/* ---------- notifications (cloche) et page Profil ---------- */
const NOTIF_DEF = {
  coms: [["coms", "Commentaires ajoutés à vos posts"], ["mention", "Commentaires dans lesquels vous êtes mentionné"], ["prives", "Commentaires privés sur les devoirs"]],
  prof: [["rendus", "Nouveaux envois de devoirs d'élèves"], ["manquants", "Devoirs non rendus à la date limite"], ["programmes", "Publication d'un post programmé"]],
  eleve: [["travaux", "Nouveaux devoirs, questions, questionnaires et documents"], ["notes", "Notes et travaux rendus par le professeur"], ["annonces", "Nouvelles annonces dans le flux"], ["echeances", "Travaux à rendre dans les 24 heures"]]
};
const prefs = () => (S.profil && S.profil.prefs) || {};
const notifOn = k => prefs().bell !== false && prefs()[k] !== false;
const coursOn = cid => !cid || !(prefs().cours_off || []).includes(cid);
const vuLe = () => S.profil && S.profil.vu_le ? D(S.profil.vu_le) : new Date(now() - 7 * 864e5);
function progListe(){ try { return JSON.parse(localStorage.getItem("pp_prog") || "[]"); } catch (_) { return []; } }
function progAjoute(k, id){ try { const l = progListe().filter(x => x !== k + ":" + id); l.push(k + ":" + id); localStorage.setItem("pp_prog", JSON.stringify(l.slice(-50))); } catch (_) {} }

async function chargerNotifs(){
  if (!S.profil) return;
  const vu = vuLe(), depuis = new Date(Math.max(+vu, now() - 30 * 864e5)).toISOString(), moiId = S.user.id;
  const prenom = sansAccent((S.nom || "").split(/\s+/)[0]);
  const reqs = [
    sb.from("commentaires").select("id, annonce_id, auteur, auteur_nom, texte, cree_le, annonces(classe_id, auteur)").gt("cree_le", depuis).order("cree_le", { ascending: false }).limit(60),
    sb.from("commentaires_prives").select("id, devoir_id, eleve_email, auteur, auteur_nom, texte, cree_le").gt("cree_le", depuis).order("cree_le", { ascending: false }).limit(60)
  ];
  if (S.prof) reqs.push(sb.from("rendus").select("id, devoir_id, auteur_email, rendu_le").gt("rendu_le", depuis).order("rendu_le", { ascending: false }).limit(80));
  else reqs.push(sb.from("annonces").select("id, classe_id, auteur, auteur_nom, cree_le").gt("cree_le", depuis).limit(40), sb.from("supports").select("id, classe_id, titre, publie_le").gt("publie_le", depuis).limit(40));
  const res = await Promise.all(reqs.map(p => Promise.resolve(p).catch(() => ({ data: [] }))));
  const [co, cp] = res.map(r => (r && !r.error && r.data) || []);
  const L = [], add = (k, date, titre, href, cid) => { if (notifOn(k) && coursOn(cid)) L.push({ k, date, titre, href, cid }); };
  const dv = id => S.devoirs.find(d => d.id === id) || {};
  co.filter(x => x.auteur !== moiId).forEach(x => { const a = x.annonces || {}, cid = a.classe_id, mention = prenom.length > 2 && sansAccent(x.texte).includes(prenom);
    if (mention) add("mention", D(x.cree_le), esc(x.auteur_nom) + " vous a mentionné dans un commentaire", "#/classe/" + cid + "/flux", cid);
    else if (S.prof || a.auteur === moiId) add("coms", D(x.cree_le), esc(x.auteur_nom) + " a commenté " + (S.prof ? "une annonce" : "votre post"), "#/classe/" + cid + "/flux", cid); });
  cp.filter(x => x.auteur !== moiId).forEach(x => { const d = dv(x.devoir_id); add("prives", D(x.cree_le), esc(x.auteur_nom) + " : commentaire privé sur « " + esc(d.titre || "un devoir") + " »", "#/devoir/" + x.devoir_id, d.classe_id); });
  if (S.prof) {
    ((res[2] && res[2].data) || []).forEach(x => { const d = dv(x.devoir_id); add("rendus", D(x.rendu_le), esc(nomDe(d.classe_id, x.auteur_email)) + (d.type === "question" ? " a répondu à « " : " a rendu « ") + esc(d.titre || "") + " »", "#/devoir/" + x.devoir_id, d.classe_id); });
    S.devoirs.filter(d => !d.brouillon && d.date_limite && D(d.date_limite) > vu && D(d.date_limite) <= now()).forEach(d => {
      const el = elevesDuDevoir(d, inscritsDe(d.classe_id)), n = el.filter(e => !renduDe(d, e.email)).length;
      if (n) add("manquants", D(d.date_limite), n + " élève" + (n > 1 ? "s n'ont" : " n'a") + " pas rendu « " + esc(d.titre) + " »", "#/devoir/" + d.id, d.classe_id); });
    const prog = progListe(), restants = [];
    prog.forEach(key => { const [k, id] = key.split(":"), o = k === "quiz" ? S.quiz.find(q => String(q.id) === id) : S.devoirs.find(d => String(d.id) === id);
      if (o && !o.brouillon && D(o.publie_le) <= now()) add("programmes", D(o.publie_le), "Post programmé publié : « " + esc(o.titre) + " »", (k === "quiz" ? "#/quiz/" : "#/devoir/") + o.id, o.classe_id);
      else if (o || k === "support") restants.push(key); });
  } else {
    const nouveaux = [...S.devoirs.map(d => ({ o: d, h: "#/devoir/" + d.id, l: d.type === "question" ? "Nouvelle question" : "Nouveau devoir" })), ...S.quiz.map(q => ({ o: q, h: "#/quiz/" + q.id, l: "Nouveau questionnaire" })),
      ...((res[3] && res[3].data) || []).map(s => ({ o: s, h: "#/classe/" + s.classe_id + "/travaux", l: "Nouveau document" }))];
    nouveaux.filter(x => D(x.o.publie_le) > vu && D(x.o.publie_le) <= now()).forEach(x => add("travaux", D(x.o.publie_le), x.l + " : « " + esc(x.o.titre) + " »", x.h, x.o.classe_id));
    S.corrections.filter(c => c.publiee && c.modifie_le && D(c.modifie_le) > vu).forEach(c => { const r = S.rendus.find(x => x.id === c.rendu_id), d = r && dv(r.devoir_id);
      if (d && d.id) add("notes", D(c.modifie_le), "Travail rendu : « " + esc(d.titre) + " »" + (c.note != null ? " · " + fmtNote(c.note) + "/" + d.points : ""), "#/devoir/" + d.id, d.classe_id); });
    ((res[2] && res[2].data) || []).filter(a => a.auteur !== moiId).forEach(a => add("annonces", D(a.cree_le), esc(a.auteur_nom) + " a publié une annonce", "#/classe/" + a.classe_id + "/flux", a.classe_id));
    S.devoirs.filter(d => d.date_limite && D(d.date_limite) > now() && D(d.date_limite) - now() < 864e5 && etat(d, moi()).t === "Attribué").forEach(d => add("echeances", D(d.date_limite), "À rendre " + dueTxt(D(d.date_limite)).toLowerCase() + " : « " + esc(d.titre) + " »", "#/devoir/" + d.id, d.classe_id));
  }
  L.sort((a, b) => b.date - a.date);
  S.notifs = L; S.nbNotifs = L.filter(x => x.k === "echeances" || x.date > vu).length;
  majCloche();
}
function cloche(){
  if (prefs().bell === false) return "";
  const n = S.nbNotifs || 0, L = S.notifs || [];
  return `<div class="dd bellwrap"><button class="ib" data-act="bell" title="Notifications" aria-label="Notifications${n ? " (" + n + " nouvelles)" : ""}" aria-expanded="${!!S.bell}">${icon("bell")}${n ? `<span class="badge">${n > 99 ? "99+" : n}</span>` : ""}</button>
    ${S.bell ? `<div class="dd-menu bellmenu"><div class="bellhead"><b>Notifications</b>${n ? `<button class="linkbtn" data-act="toutlu">Tout marquer comme lu</button>` : ""}</div>
      ${L.length ? `<div class="belllist">${L.slice(0, 40).map(x => { const c = cls(x.cid); return `<a href="${x.href}" class="${x.k === "echeances" || x.date > vuLe() ? "new" : ""}"><span class="ini" style="--bb:var(${C(c && c.couleur).b})">${esc(c ? (c.symbole || c.nom).slice(0, 3) : "•")}</span><span><span class="bt">${x.titre}</span><small class="muted">${esc(c ? c.nom : "")} · ${fmtQuand(x.date)}</small></span></a>`; }).join("")}</div>` : `<p class="muted" style="margin:8px 10px">Aucune nouvelle notification.</p>`}
      <a class="bellfoot" href="#/admin/profil">${icon("gear")} Paramètres des notifications</a></div>` : ""}</div>`;
}
function majCloche(){ const w = document.querySelector(".bellwrap"); if (w) w.outerHTML = cloche(); }

async function sauverPrefs(p){
  S.profil.prefs = p;
  const { error } = await sb.rpc("pp_prefs", { p });
  if (error) toast("Paramètre non enregistré : " + error.message); else toast("Paramètre enregistré");
  chargerNotifs();
}

/* page Profil et notifications (comme Paramètres de Classroom) */
function admProfil(){
  const P = prefs(), sw = (k, label) => `<label class="switch crsw"><span>${label}</span><input type="checkbox" data-pref="${k}" ${P[k] !== false ? "checked" : ""}${k !== "bell" && P.bell === false ? " disabled" : ""}><i aria-hidden="true"></i></label>`;
  const off = P.cours_off || [];
  return `<section class="edcard crcard"><h2 class="crbig">Profil</h2>
      <div class="crrow"><b>Photo de profil</b><div class="who2">${avatarP(S.nom, "lg")}<a class="linkbtn" href="https://myaccount.microsoft.com/" target="_blank" rel="noopener">Modifier</a></div></div>
      <div class="crrow"><b>Paramètres du compte</b><span>Modifiez le mot de passe et les options de sécurité de votre compte Microsoft 365 du lycée. <a href="https://myaccount.microsoft.com/" target="_blank" rel="noopener">Gérer</a></span></div>
      <div class="crrow"><b>Changer de nom</b>${S.prof ? `<div class="two" style="align-items:end"><div class="field"><label for="pfNom">Nom affiché aux élèves</label><input id="pfNom" value="${esc(R().prof.nom)}"></div><div><button class="btn sm" data-act="savenom">Enregistrer</button></div></div>`
        : `<span>Ton nom (${esc(S.nom)}) est indiqué par ton professeur. S'il y a une erreur, écris-lui.</span>`}</div>
      <div class="crrow"><b>Adresse</b><span class="muted">${esc(moi())}</span></div>
      <div class="crrow"><b>Apparence</b><select data-theme-choice="1" class="agsel" aria-label="Apparence">${[["auto", "Automatique (comme l'appareil)"], ["light", "Clair"], ["dark", "Sombre"]].map(([v, l]) => `<option value="${v}" ${themeChoisi() === v ? "selected" : ""}>${l}</option>`).join("")}</select><small class="muted">Réglage propre à cet appareil.</small></div>
    </section>
    <section class="edcard crcard"><h2 class="crbig">Notifications</h2>
      <h3 class="crsub">Dans PhysiquePro</h3>
      <p class="muted" style="margin:0">Ces paramètres s'appliquent aux notifications de la cloche ${icon("bell")} en haut de chaque page. PhysiquePro n'envoie pas d'e-mails automatiques : la cloche les remplace.</p>
      ${sw("bell", "Autoriser les notifications")}
      <h3 class="crsub">Commentaires</h3>${NOTIF_DEF.coms.map(([k, l]) => sw(k, l)).join("")}
      <h3 class="crsub">${S.prof ? "Cours dont vous êtes enseignant" : "Cours dont vous êtes élève"}</h3>${NOTIF_DEF[S.prof ? "prof" : "eleve"].map(([k, l]) => sw(k, l)).join("")}
      <details class="crdet"><summary><span><b>Notifications de cours</b><small class="muted">Ces paramètres s'appliquent aux notifications pour chaque cours</small></span>${icon("down")}</summary>
        ${actives().map(c => `<label class="switch crsw"><span class="who2"><span class="ini" style="--bb:var(${C(c.couleur).b})">${esc((c.symbole || c.nom).slice(0, 3))}</span>${esc(c.nom)}</span><input type="checkbox" data-prefc="${esc(c.id)}" ${off.includes(c.id) ? "" : "checked"}><i aria-hidden="true"></i></label>`).join("")}</details>
    </section>`;
}
/* ---------- notation : catégories et coefficients, grilles, remarques ---------- */
function itemsNotes(c){
  return [...S.devoirs.filter(d => d.classe_id === c.id && d.points != null && !d.brouillon).map(d => ({ k: "d", o: d })),
          ...S.quiz.filter(q => q.classe_id === c.id && q.mode === "note" && !q.brouillon).map(q => ({ k: "q", o: q }))];
}
function noteSur20(it, email, uid, pub){
  if (it.k === "q") { const r = uid && resultatDe(it.o, uid); return r ? noteQuiz(it.o, r) / it.o.points * 20 : null; }
  if (it.o.eleves && !it.o.eleves.includes(email)) return null;
  const cr = correctionDe(renduDe(it.o, email));
  if (!cr || cr.note == null || (pub && !cr.publiee)) return null;
  return cr.note / it.o.points * 20;
}
/* moyenne sur 20 : simple sans catégories ; pondérée par catégorie sinon (les travaux sans catégorie comptent avec un coefficient 1) */
function moyenneDe(c, email, uid, pub){
  const cats = (c.categories || []).filter(x => x && x.nom), grp = {};
  itemsNotes(c).forEach(it => { const v = noteSur20(it, email, uid, pub); if (v == null) return;
    const cat = cats.find(x => x.nom === it.o.categorie), key = cat ? cat.nom : "";
    (grp[key] = grp[key] || { coef: cat ? Number(cat.coef) || 0 : 1, v: [] }).v.push(v); });
  const g = Object.entries(grp).map(([nom, x]) => ({ nom: nom || "Sans catégorie", coef: x.coef, moy: x.v.reduce((a, b) => a + b, 0) / x.v.length, n: x.v.length }));
  if (!cats.length) { const all = Object.values(grp).flatMap(x => x.v); return { moy: all.length ? all.reduce((a, b) => a + b, 0) / all.length : null, parCat: [] }; }
  const pond = g.filter(x => x.coef > 0), sc = pond.reduce((a, x) => a + x.coef, 0);
  return { moy: sc ? pond.reduce((a, x) => a + x.coef * x.moy, 0) / sc : null, parCat: g };
}
const arrondi1 = x => x == null ? null : Math.round(x * 10) / 10;

/* bloc de notation (page du devoir et visionneuse) */
function blocNotation(d, rd, cr){
  const G = d.grille && d.grille.length ? d.grille : null, gv = (cr && cr.grille) || [];
  const rem = (R().remarques || []).length ? R().remarques : REMARQUES_DEFAUT;
  return `${G ? `<div class="grille"><b>Grille d'évaluation</b>${G.map((g, i) => `<label class="grow"><span>${esc(g.c)}</span><input id="gr-${i}" data-gr="${i}" type="number" min="0" max="${g.p}" step="0.25" inputmode="decimal" value="${gv[i] != null ? gv[i] : ""}" aria-label="${esc(g.c)}"><span class="muted">/${g.p}</span></label>`).join("")}</div>` : ""}
    ${d.points != null ? `<div class="gradeline"><label for="note">Note</label><input id="note" type="number" min="0" max="${d.points}" step="0.25" inputmode="decimal" value="${cr && cr.note != null ? cr.note : ""}" ${G ? "readonly" : ""}><span class="muted">/${d.points}</span>${G ? `<small class="muted">calculée avec la grille</small>` : ""}</div>` : ""}
    <div class="field"><label for="noteCom">Commentaire pour l'élève <span class="muted">(visible quand tu rends le travail)</span></label><textarea id="noteCom" rows="2" placeholder="ex. Bon raisonnement, attention aux unités.">${esc(cr && cr.commentaire || "")}</textarea>
      ${rem.length ? `<div class="chips">${rem.map(t => `<button class="chip" data-act="remarque" data-t="${esc(t)}">${esc(t)}</button>`).join("")}</div>` : ""}</div>
    ${blocCompetences(cr)}${blocVocal(rd, cr)}
    <div id="noteErr" class="err" hidden></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">${d.points != null ? `<button class="btn ghost" data-act="savenote" data-id="${rd.id}" data-pub="0">Enregistrer le brouillon</button>` : ""}<button class="btn" data-act="savenote" data-id="${rd.id}" data-pub="1">${cr && cr.publiee ? "Mettre à jour" : "Rendre"}</button><button class="btn tonal" data-act="savenote" data-id="${rd.id}" data-pub="1" data-next="1" title="Ctrl + Entrée">${cr && cr.publiee ? "Mettre à jour" : "Rendre"} et passer au suivant ${icon("right")}</button></div>
    <p class="muted" style="margin:0;font-size:.8rem">${rd.binome_email ? "La note s'affiche pour les deux élèves du binôme." : "Seul l'élève voit sa note, une fois rendue."}</p>`;
}
function grilleEleve(d, c){
  if (!d.grille || !d.grille.length || !c || !c.grille) return "";
  return `<div class="grille lue">${d.grille.map((g, i) => `<div class="grow"><span>${esc(g.c)}</span><b class="mono">${c.grille[i] != null ? fmtNote(c.grille[i]) : "–"}</b><span class="muted">/${g.p}</span></div>`).join("")}</div>`;
}

/* ---------- images des questionnaires ---------- */
async function urlsSignees(paths){
  S.urls = S.urls || {};
  const manque = [...new Set(paths)].filter(p => !S.urls[p]); if (!manque.length) return;
  try { const { data } = await sb.storage.from("documents").createSignedUrls(manque, 3600); (data || []).forEach(x => { if (x.signedUrl) S.urls[x.path] = x.signedUrl; }); } catch (_) {}
}
async function imageQuestion(f){
  const e = S.ed, i = S.qimgFor; if (!e || i == null || !e.questions[i]) return;
  if (!/^image\//.test(f.type)) { toast("Choisis une image (photo, capture, schéma)."); return; }
  if (f.size > 8e6) { toast("Image trop lourde (8 Mo maximum)."); return; }
  toast("Envoi de l'image…");
  const path = e.classe_id + "/" + Date.now() + "-quiz-" + safeName(f.name);
  const { error } = await sb.storage.from("documents").upload(path, f, { upsert: false });
  if (error) { toast("Envoi impossible : " + error.message); return; }
  e.uploaded.push(path); e.questions[i].img = path; await urlsSignees([path]); render();
}
/* ordre aléatoire mais toujours le même pour un élève donné */
function melangeStable(n, graine){
  let h = 2166136261; for (const ch of String(graine)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  const a = [...Array(n).keys()], rnd = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; };
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
/* ---------- visionneuse des travaux rendus (prof) ---------- */
/* Word, Excel et PowerPoint s'ouvrent dans Office en ligne (Microsoft 365) */
const OFFICE = ["doc", "docx", "dot", "dotx", "rtf", "odt", "xls", "xlsx", "xlsm", "csv", "ods", "ppt", "pptx", "pps", "ppsx", "odp"];
const estOffice = n => OFFICE.includes(String(n || "").split(".").pop().toLowerCase());
const lienOffice = (nom, url) => estOffice(nom) && !/\.csv$/i.test(nom) ? "https://view.officeapps.live.com/op/view.aspx?src=" + encodeURIComponent(url) : url;
const appOffice = n => { const x = String(n || "").split(".").pop().toLowerCase(); return /^(doc|dot|rtf|odt)/.test(x) ? "Word" : /^(xls|ods)/.test(x) ? "Excel" : /^(ppt|pps|odp)/.test(x) ? "PowerPoint" : ""; };
const btnDl = (bucket, path, nom) => `<button class="dlbtn" data-act="dlfile" data-bucket="${esc(bucket)}" data-path="${esc(path)}" data-nom="${esc(nom || "")}" title="Télécharger pour modifier sur l'ordinateur" aria-label="Télécharger ${esc(nom || "")}">${icon("down")}</button>`;
const extDe = n => (String(n || "").split(".").pop() || "").toLowerCase();
const cleF = f => f.chemin || ("od:" + (f.od && f.od.id));
const TYPES = { pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp", svg: "image/svg+xml", mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime", mp3: "audio/mpeg", wav: "audio/wav", m4a: "audio/mp4", txt: "text/plain;charset=utf-8", py: "text/plain;charset=utf-8", csv: "text/plain;charset=utf-8", md: "text/plain;charset=utf-8", json: "text/plain;charset=utf-8" };
async function urlRendu(f){
  if (typeof f === "string") f = { chemin: f };
  S.vurl = S.vurl || {}; const k = cleF(f);
  if (S.vurl[k]) return S.vurl[k];
  if (f.chemin) { const { data } = await sb.storage.from("rendus").createSignedUrl(f.chemin, 3600); return S.vurl[k] = data ? data.signedUrl : null; }
  try {
    if (appOffice(f.nom)) { const p = await graph("/me/drive/items/" + encodeURIComponent(f.od.id) + "/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }); return S.vurl[k] = p.getUrl || f.od.web; }
    const it = await graph("/me/drive/items/" + encodeURIComponent(f.od.id)), b = await (await fetch(it["@microsoft.graph.downloadUrl"])).blob();
    return S.vurl[k] = URL.createObjectURL(new Blob([b], { type: TYPES[extDe(f.nom)] || b.type || "application/octet-stream" }));
  } catch (e) { return S.vurl[k] = null; }
}
function rendusOrdonnes(d){
  const el = elevesDuDevoir(d, inscritsDe(d.classe_id));
  return el.filter(e => renduDe(d, e.email));
}
async function preparerViewer(){
  const V = S.viewer, d = S.devoirs.find(x => x.id === V.did); if (!d) { S.viewer = null; return; }
  await chargerClasse(d.classe_id);
  const rd = renduDe(d, V.email), f = rd && (rd.fichiers || [])[V.fi || 0];
  if (f) await urlRendu(f);
  await chargerCP(d.id, V.email);
}
function apercuFichier(f){
  const u = S.vurl && S.vurl[cleF(f)], x = extDe(f.nom);
  if (!u) return `<div class="vempty">Fichier introuvable.${f.od ? `<a class="btn" href="${esc(f.od.web)}" target="_blank" rel="noopener">Ouvrir dans OneDrive</a>` : ""}</div>`;
  if (f.od && ["doc", "docx", "ppt", "pptx", "xls", "xlsx"].includes(x)) return `<iframe class="vframe" src="${esc(u)}" title="${esc(f.nom)}"></iframe>`;
  if (["png", "jpg", "jpeg", "gif", "webp", "bmp", "heic", "svg"].includes(x)) return `<img class="vimg" src="${esc(u)}" alt="${esc(f.nom)}">`;
  if (x === "pdf") return `<iframe class="vframe" src="${esc(u)}" title="${esc(f.nom)}"></iframe>`;
  if (["mp4", "webm", "mov", "m4v"].includes(x)) return `<video class="vimg" src="${esc(u)}" controls></video>`;
  if (["mp3", "wav", "m4a", "ogg"].includes(x)) return `<audio src="${esc(u)}" controls style="width:min(520px,90%)"></audio>`;
  if (["doc", "docx", "ppt", "pptx", "xls", "xlsx"].includes(x)) return `<iframe class="vframe" src="https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(u)}" title="${esc(f.nom)}"></iframe>`;
  if (["txt", "py", "csv", "md", "html", "js", "json"].includes(x)) return `<iframe class="vframe blanc" src="${esc(u)}" title="${esc(f.nom)}"></iframe>`;
  return `<div class="vempty"><b>${esc(f.nom)}</b><span>Aperçu impossible pour ce type de fichier.</span><a class="btn" href="${esc(u)}" target="_blank" rel="noopener">Télécharger</a></div>`;
}
function vViewer(){
  const V = S.viewer, d = S.devoirs.find(x => x.id === V.did), c = cls(d.classe_id), k = C(c && c.couleur);
  const liste = rendusOrdonnes(d), i = liste.findIndex(e => e.email === V.email), e = liste[i] || { nom: nomDe(d.classe_id, V.email), email: V.email };
  const rd = renduDe(d, V.email), cr = correctionDe(rd), fs = (rd && rd.fichiers) || [], fi = Math.min(V.fi || 0, Math.max(0, fs.length - 1));
  const prec = liste[i - 1], suiv = liste[i + 1];
  return `<div class="edtop" style="--c:var(${k.c})"><button class="ib" data-act="vclose" aria-label="Fermer">${icon("x")}</button>
      <div style="min-width:0"><h1 style="font-size:1.15rem">${esc(e.nom)}</h1><small class="muted">${esc(d.titre)} · ${i + 1}/${liste.length} rendus</small></div><span class="spacer"></span>
      <button class="btn ghost sm" data-act="vgo" data-e="${prec ? esc(prec.email) : ""}" ${prec ? "" : "disabled"} title="Élève précédent (←)">${icon("left")} Précédent</button>
      <button class="btn ghost sm" data-act="vgo" data-e="${suiv ? esc(suiv.email) : ""}" ${suiv ? "" : "disabled"} title="Élève suivant (→)">Suivant ${icon("right")}</button></div>
    <div class="viewer">
      <div class="vmain">${fs.length > 1 ? `<div class="vtabs">${fs.map((f, j) => `<button class="${j === fi ? "on" : ""}" data-act="vfile" data-i="${j}">${esc(f.nom)}</button>`).join("")}</div>` : ""}
        <div class="vbody">${fs.length ? apercuFichier(fs[fi]) : rd && rd.reponse ? `<div class="reponse" style="max-width:640px;margin:24px">${linkify(rd.reponse)}</div>` : `<div class="vempty">${rd ? "Rendu sans fichier." : "Aucun rendu."}${rd && rd.lien ? `<a class="btn" href="${esc(rd.lien)}" target="_blank" rel="noopener">Ouvrir le lien rendu</a>` : ""}</div>`}</div>
        ${fs.length && peutAnnoter(fs[fi]) ? `<div class="vfoot"><button class="btn sm" data-act="annoter" data-id="${rd.id}">${icon("pen")} Annoter cette copie</button></div>` : ""}
        ${fs.length && fs[fi].od ? `<div class="vfoot"><a href="${esc(fs[fi].od.web)}" target="_blank" rel="noopener">${icon("expand")} Ouvrir dans OneDrive</a></div>` : ""}
        ${fs.length && fs[fi].chemin && S.vurl && S.vurl[fs[fi].chemin] ? `<div class="vfoot"><a href="${esc(lienOffice(fs[fi].nom, S.vurl[fs[fi].chemin]))}" target="_blank" rel="noopener">${icon("expand")} ${appOffice(fs[fi].nom) ? "Ouvrir dans " + appOffice(fs[fi].nom) + " en ligne" : "Ouvrir dans un nouvel onglet"}</a><a href="#" data-act="dlfile" data-bucket="rendus" data-path="${esc(fs[fi].chemin)}" data-nom="${esc(fs[fi].nom)}">${icon("down")} Télécharger</a></div>` : ""}</div>
      <aside class="vside">${rd ? `<p class="muted" style="margin:0;font-size:.85rem">Rendu le ${fmtD(D(rd.rendu_le))} à ${fmtT(D(rd.rendu_le))}${enRetard(d, rd) ? ` <span class="pill bad">en retard</span>` : ""}</p>
        ${rd.lien ? `<a href="${esc(rd.lien)}" target="_blank" rel="noopener">${icon("links")} Lien rendu</a>` : ""}${blocNotation(d, rd, cr)}` : ""}
        ${vCP(d.id, V.email)}</aside></div>`;
}

/* ---------- suivi des élèves (prof) ---------- */
function vSuivi(){
  const act = actives(); if (!act.length) return `<div class="page"><div class="emptystate"><b>Aucun cours actif.</b></div></div>`;
  const c = cls(S.suiviC) && !cls(S.suiviC).archive ? cls(S.suiviC) : act[0], el = inscritsDe(c.id);
  const uidDe = email => Object.keys(S.profils).find(id => S.profils[id] === email);
  const dv = S.devoirs.filter(d => d.classe_id === c.id && !d.brouillon && D(d.publie_le) <= now());
  const lignes = el.map(e => { const ds = dv.filter(d => !d.eleves || d.eleves.includes(e.email)), et = ds.map(d => ({ d, s: etat(d, e.email) }));
    const rendus = et.filter(x => x.s.r), dernier = rendus.map(x => D(x.s.r.rendu_le)).sort((a, b) => b - a)[0];
    return { e, moy: moyenneDe(c, e.email, uidDe(e.email), false).moy, n: ds.length, rendus: rendus.length, manq: et.filter(x => x.s.t === "Manquant").length, retard: et.filter(x => x.s.retard).length, dernier, et }; })
    .sort((a, b) => (b.manq - a.manq) || ((a.moy ?? 99) - (b.moy ?? 99)));
  return `<div class="page wide"><div class="homehead"><h1>Suivi des élèves</h1>
      <div class="travhead" style="gap:10px"><div class="field filt"><label for="suiviC">Cours</label><select id="suiviC" data-suivi="1">${act.map(x => `<option value="${esc(x.id)}" ${x.id === c.id ? "selected" : ""}>${esc(x.nom)}</option>`).join("")}</select></div>
      <button class="btn ghost sm" data-act="exportsuivi" data-c="${esc(c.id)}">${icon("down")} Exporter (Excel)</button></div></div>
    ${blocAlertes(true)}
    <p class="muted" style="margin:0;font-size:.85rem">Les élèves avec des travaux manquants apparaissent en premier. Clique sur un élève pour voir le détail.</p>
    ${lignes.length ? `<div class="tablewrap"><table class="admtable"><thead><tr><th class="first">Élève</th><th>Moyenne /20</th><th>Rendus</th><th>Manquants</th><th>En retard</th><th>Dernier rendu</th></tr></thead><tbody>
      ${lignes.map(l => `<tr class="suivirow ${l.manq ? "alerte" : ""}" data-act="toggle" data-id="sv${esc(l.e.email)}"><td class="first"><span class="who2">${avatarP(l.e.nom, "sm")}<b>${esc(l.e.nom)}</b></span></td>
        <td class="mono"><b>${l.moy == null ? "–" : fmtNote(arrondi1(l.moy))}</b></td><td>${l.rendus}/${l.n}</td><td>${l.manq ? `<span class="pill bad">${l.manq}</span>` : "0"}</td><td>${l.retard ? `<span class="pill">${l.retard}</span>` : "0"}</td><td class="muted">${l.dernier ? fmtShort(l.dernier) : "—"}</td></tr>
        ${S.open === "sv" + l.e.email ? `<tr><td colspan="6" class="suividetail">${l.et.length ? l.et.map(x => `<a href="#/devoir/${x.d.id}"><span class="pill ${x.s.k}">${x.s.t}${x.s.retard ? " · retard" : ""}</span> ${esc(x.d.titre)} ${x.s.t === "Noté" && x.s.note != null ? `<b class="mono">${fmtNote(x.s.note)}/${x.d.points}</b>` : ""}</a>`).join("") : `<span class="muted">Aucun devoir.</span>`}
          <a href="${esc(outlookLink([l.e.email], "", ""))}" target="_blank" rel="noopener">${icon("mail")} Écrire à l'élève</a><a href="#" data-act="bilanpdf" data-c="${esc(c.id)}" data-e="${esc(l.e.email)}">${icon("down")} Bilan PDF</a></td></tr>` : ""}`).join("")}
    </tbody></table></div>` : `<div class="emptystate"><b>Aucun élève dans ce cours.</b></div>`}${tableCompetencesClasse(c)}${pageFoot()}</div>`;
}
function exporterSuivi(cid){
  const c = cls(cid), el = inscritsDe(cid), uidDe = email => Object.keys(S.profils).find(id => S.profils[id] === email);
  const dv = S.devoirs.filter(d => d.classe_id === cid && !d.brouillon && D(d.publie_le) <= now());
  const rows = [["Élève", "Adresse", "Moyenne /20", "Rendus", "Attribués", "Manquants", "En retard"]];
  el.forEach(e => { const ds = dv.filter(d => !d.eleves || d.eleves.includes(e.email)), et = ds.map(d => etat(d, e.email)), m = moyenneDe(c, e.email, uidDe(e.email), false).moy;
    rows.push([e.nom, e.email, m == null ? "" : fmtNote(arrondi1(m)), et.filter(x => x.r).length, ds.length, et.filter(x => x.t === "Manquant").length, et.filter(x => x.retard).length]); });
  telecharger("suivi-" + sansAccent(c.nom).replace(/[^a-z0-9]+/g, "-") + "-" + ymd(now()) + ".csv", csv(rows), "text/csv;charset=utf-8");
}

/* ---------- apparence : clair / sombre ---------- */
function themeChoisi(){ try { return localStorage.getItem("pp_theme") || "auto"; } catch (_) { return "auto"; } }
function appliquerTheme(v){
  try { if (v === "auto") localStorage.removeItem("pp_theme"); else localStorage.setItem("pp_theme", v); } catch (_) {}
  const de = document.documentElement; if (!de || !de.dataset) return;
  if (v === "auto") delete de.dataset.theme; else de.dataset.theme = v;
}
appliquerTheme(themeChoisi());

/* ---------- publier aussi dans d'autres cours ---------- */
async function publierAussi(k, cibles, row, bonnes){
  let ok = 0; const table = k === "quiz" ? "quiz" : k === "support" ? "supports" : "devoirs";
  for (const cid of cibles) {
    const r2 = { ...row, classe_id: cid, theme_id: null, eleves: null };
    if (row.ressources) r2.ressources = await copierRessources(row.ressources, cid);
    if (k === "quiz") { r2.questions = []; for (const x of row.questions || []) { if (x.img) { const [cp] = await copierRessources([{ path: x.img }], cid); r2.questions.push({ ...x, img: cp.path }); } else r2.questions.push(x); } }
    const ins = await sb.from(table).insert(r2).select("id").single();
    if (ins.error) continue;
    if (k === "quiz") { const s2 = await sb.from("quiz_solutions").insert({ quiz_id: ins.data.id, bonnes: bonnes || [] }); if (s2.error) continue; }
    ok++; delete S.cache[cid];
  }
  return ok;
}
/* ---------- OneDrive (Microsoft Graph) : documents rangés par classe, thème et activité ---------- */
const OD_RACINE = "ONEDRIVE SITE PHYSIQUEPRO";
const MSAL_CFG = { auth: { clientId: "f52213ef-d098-49cc-ac22-944c23bcab61", authority: "https://login.microsoftonline.com/4bd4c77d-938d-4bd2-99ae-3ca7e4de49e6",
  redirectUri: location.origin + location.pathname.replace(/[^/]*$/, "") + "auth.html" }, cache: { cacheLocation: "localStorage" } };
let msalApp = null;
const odActif = () => S.prof && !!(R().onedrive);
async function msalInit(){
  if (msalApp) return msalApp;
  if (!window.msal) throw new Error("la bibliothèque Microsoft n'a pas pu être chargée");
  msalApp = new window.msal.PublicClientApplication(MSAL_CFG); await msalApp.initialize(); return msalApp;
}
const SCOPES_COPIE = ["Files.ReadWrite", "Files.Read.All"];
async function jetonGraph(interactif, scopes){
  const app = await msalInit(), req = { scopes: scopes || ["Files.ReadWrite"], loginHint: moi() };
  const compte = app.getAllAccounts().find(a => (a.username || "").toLowerCase() === moi());
  try {
    if (compte) return (await app.acquireTokenSilent({ ...req, account: compte })).accessToken;
    return (await app.ssoSilent(req)).accessToken;
  } catch (e) {
    if (!interactif) throw e;
    return (await app.acquireTokenPopup(req)).accessToken;
  }
}
async function graph(chemin, opt = {}, interactif = true, scopes){
  const t = await jetonGraph(interactif, scopes);
  const r = await fetch(chemin.startsWith("http") ? chemin : "https://graph.microsoft.com/v1.0" + chemin, { ...opt, headers: { Authorization: "Bearer " + t, ...(opt.headers || {}) } });
  if (!r.ok) { let m = r.status + ""; try { const j = await r.json(); m = (j.error && j.error.message) || m; } catch (_) {} const er = new Error(m); er.status = r.status; throw er; }
  return r.status === 204 ? null : r.json();
}
const nomOD = s => String(s || "").replace(/[\\/:*?"<>|#%]+/g, " ").replace(/\s+/g, " ").trim().replace(/^\.+|\.+$/g, "").slice(0, 120) || "Sans titre";
const cheminOD = parts => parts.map(nomOD).map(encodeURIComponent).join("/");
/* envoie un fichier dans le OneDrive du prof et renvoie {id, web, partage} */
async function odPut(ch, fichier, scopes){
  let item;
  if (!fichier || typeof fichier.size !== "number") throw new Error("fichier illisible, ajoute-le à nouveau");
  if (fichier.size <= 4 * 1024 * 1024) item = await graph("/me/drive/root:/" + ch + ":/content?@microsoft.graph.conflictBehavior=rename", { method: "PUT", body: fichier }, true, scopes);
  else {
    const ses = await graph("/me/drive/root:/" + ch + ":/createUploadSession", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ item: { "@microsoft.graph.conflictBehavior": "rename" } }) }, true, scopes);
    const pas = 320 * 1024 * 16;
    for (let deb = 0; deb < fichier.size; deb += pas) {
      const fin = Math.min(deb + pas, fichier.size), r = await fetch(ses.uploadUrl, { method: "PUT", headers: { "Content-Range": `bytes ${deb}-${fin - 1}/${fichier.size}` }, body: fichier.slice(deb, fin) });
      if (!r.ok && r.status !== 202) throw new Error("envoi interrompu (" + r.status + ")");
      if (fin === fichier.size) { try { item = await r.json(); } catch (_) { item = null; } }
    }
  }
  /* réponse incomplète de Microsoft : on relit le fichier par son chemin */
  if (!item || !item.id) {
    await new Promise(ok => setTimeout(ok, 1500));
    item = await graph("/me/drive/root:/" + ch, {}, true, scopes);
  }
  if (!item || !item.id) throw new Error("OneDrive n'a pas confirmé l'envoi du fichier");
  return item;
}
async function odEnvoyer(parts, fichier){
  const item = await odPut(cheminOD([OD_RACINE, ...parts]), fichier);
  const lien = await graph("/me/drive/items/" + item.id + "/createLink", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "view", scope: "organization" }) });
  return { id: item.id, web: item.webUrl, partage: lien.link.webUrl, nom: item.name };
}
const ressourceOD = (r, label) => ({ type: extType(r.nom), label: label || r.nom, url: r.partage, od: { id: r.id, web: r.web } });
/* dossier d'un travail : classe / thème / titre */
function dossierTravail(classeId, themeId, titre){
  const c = cls(classeId), data = S.cache[classeId] || { themes: [] }, th = data.themes.find(t => String(t.id) === String(themeId));
  return [c ? c.nom : classeId, th ? th.titre : "Sans thème", titre || "Sans titre"];
}

/* connexion OneDrive (consentement une seule fois) */
async function connecterOneDrive(){
  try {
    await jetonGraph(true);
    const me = await graph("/me/drive/root:/" + encodeURIComponent(OD_RACINE));
    S.odOk = true; toast("OneDrive connecté : dossier « " + me.name + " » trouvé"); return true;
  } catch (e) {
    S.odOk = false;
    toast(/AADSTS65001|consent|admin/i.test(e.message || "") ? "Microsoft demande l'accord d'un administrateur du lycée pour OneDrive." : "Connexion OneDrive impossible : " + (e.message || e));
    return false;
  }
}

/* envoi des fichiers en attente de l'éditeur, au moment d'enregistrer */
async function envoyerEnAttente(e){
  e.ressources = e.ressources.filter(x => !x.pending || x.pending instanceof Blob);
  const att = e.ressources.filter(x => x.pending); if (!att.length) return;
  const parts = dossierTravail(e.classe_id, e.theme_id, e.titre.trim());
  for (const x of att) {
    toast("Envoi dans OneDrive : « " + x.label + " »…");
    let r;
    try { r = await odEnvoyer([...parts, x.pending.name], x.pending); }
    catch (er) { console.error("Envoi OneDrive, nouvel essai", er); await new Promise(ok => setTimeout(ok, 2000)); r = await odEnvoyer([...parts, x.pending.name], x.pending); }
    const i = e.ressources.indexOf(x); e.ressources[i] = ressourceOD(r, x.label);
  }
}

/* copie des travaux rendus dans le OneDrive du prof : …/Titre/Travaux rendus/Élève - fichier */
async function syncRendus(d, silencieux){
  if (!odActif()) return 0;
  const rendus = rendusDe(d).filter(r => (r.fichiers || []).length); if (!rendus.length) return 0;
  const parts = [...dossierTravail(d.classe_id, d.theme_id, d.titre), "Travaux rendus"];
  let deja = new Set();
  try { const l = await graph("/me/drive/root:/" + cheminOD([OD_RACINE, ...parts]) + ":/children?$select=name&$top=999", {}, !silencieux); (l.value || []).forEach(x => deja.add(x.name)); } catch (_) {}
  let n = 0;
  for (const r of rendus) for (const f of r.fichiers) {
    if (!f.chemin) continue;
    const nom = nomOD(nomDe(d.classe_id, r.auteur_email) + " - " + f.nom);
    if (deja.has(nom)) continue;
    const { data } = await sb.storage.from("rendus").createSignedUrl(f.chemin, 600); if (!data) continue;
    const blob = await (await fetch(data.signedUrl)).blob();
    await odEnvoyer([...parts, nom], blob); n++;
  }
  return n;
}

/* rangement des documents déjà présents dans PhysiquePro vers OneDrive */
async function migrerVersOneDrive(maj){
  await chargerFichiers(true);
  const sups = (S.fich && S.fich.supports) || [], ann = (S.fich && S.fich.annonces) || [];
  const lots = [
    ...S.devoirs.map(d => ({ table: "devoirs", o: d, parts: dossierTravail(d.classe_id, d.theme_id, d.titre) })),
    ...sups.map(s => ({ table: "supports", o: s, parts: dossierTravail(s.classe_id, s.theme_id, s.titre) })),
    ...ann.map(a => ({ table: "annonces", o: a, parts: [(cls(a.classe_id) || {}).nom || a.classe_id, "Annonces"] }))
  ].filter(x => (x.o.ressources || []).some(r => r.path));
  let n = 0, err = 0;
  for (const lot of lots) {
    for (const c of S.classes) if (!S.cache[c.id]) await chargerClasse(c.id);
    const res = [];
    for (const r of lot.o.ressources) {
      if (!r.path) { res.push(r); continue; }
      try { const { data } = await sb.storage.from("documents").createSignedUrl(r.path, 600); const blob = await (await fetch(data.signedUrl)).blob();
        const nom = r.label || r.path.split("/").pop().replace(/^\d+-/, ""); const o = await odEnvoyer([...lot.parts, nom], blob); res.push(ressourceOD(o, r.label)); n++; maj(n); }
      catch (e) { res.push(r); err++; }
    }
    await sb.from(lot.table).update({ ressources: res }).eq("id", lot.o.id);
  }
  return { n, err };
}

/* vignette d'un fichier OneDrive (aperçu de la 1re page, comme dans Classroom) — prof uniquement, sans fenêtre */
const vignEnCours = new Set();
let vignErreur = false;
function vignetteOD(id){
  const k = "od:" + id;
  if (MINI[k] || vignEnCours.has(id) || vignErreur || !odActif()) return;
  try { const c = JSON.parse(localStorage.getItem("pp_vign") || "{}"); if (c[id] && c[id].t > Date.now() - 3e6) { MINI[k] = c[id].u; return; } } catch (_) {}
  vignEnCours.add(id);
  graph("/me/drive/items/" + encodeURIComponent(id) + "/thumbnails?select=medium", {}, false).then(j => {
    const u = j && j.value && j.value[0] && j.value[0].medium && j.value[0].medium.url;
    if (!u) { setTimeout(() => vignEnCours.delete(id), 120000); return; }
    MINI[k] = u;
    try { const c = JSON.parse(localStorage.getItem("pp_vign") || "{}"); c[id] = { u, t: Date.now() }; const ks = Object.keys(c); if (ks.length > 400) ks.slice(0, 100).forEach(x => delete c[x]); localStorage.setItem("pp_vign", JSON.stringify(c)); } catch (_) {}
    clearTimeout(vignetteOD.t); vignetteOD.t = setTimeout(render, 150);
  }).catch(e => { setTimeout(() => vignEnCours.delete(id), 120000); if (/interaction|login|consent|popup|InteractionRequired/i.test(String(e && (e.errorCode || e.message) || e))) vignErreur = true; });
}

/* ---------- élève : copie modifiable d'un document Word / Excel / PowerPoint dans SON OneDrive ---------- */
const b64u = t => btoa(unescape(encodeURIComponent(t))).replace(/=+$/, "").replace(/\//g, "_").replace(/\+/g, "-");
const cleCopies = () => "pp_copies_" + (S.user ? S.user.id : "");
function copiesDe(devoir){ if (!devoir) return []; try { return (JSON.parse(localStorage.getItem(cleCopies()) || "{}")[devoir] || []); } catch (_) { return []; } }
function memoCopie(ctx, item, nom){
  if (!ctx.devoir) return;
  try { const all = JSON.parse(localStorage.getItem(cleCopies()) || "{}"), l = (all[ctx.devoir] || []).filter(x => x.id !== item.id);
    l.push({ id: item.id, nom, web: item.webUrl }); all[ctx.devoir] = l; localStorage.setItem(cleCopies(), JSON.stringify(all)); } catch (_) {}
}
function attente(win, txt){
  try { win.document.title = "PhysiquePro"; win.document.body.innerHTML = `<div style="font:16px Roboto,system-ui,sans-serif;color:#1F1F1F;display:grid;place-items:center;min-height:90vh;text-align:center"><div><div style="width:34px;height:34px;border:3px solid #C2E7FF;border-top-color:#116482;border-radius:50%;margin:0 auto 14px;animation:t 1s linear infinite"></div>${txt}</div></div><style>@keyframes t{to{transform:rotate(360deg)}}</style>`; } catch (_) {}
}
async function ouvrirCopie(r, ctx, win){
  const nom = nomOD(r.label || (r.path || "").split("/").pop().replace(/^\d+-/, ""));
  const c = ctx.classe ? cls(ctx.classe) : null, ch = cheminOD(["PhysiquePro", c ? c.nom : "Documents", nom]);
  let item = null;
  try { item = await graph("/me/drive/root:/" + ch, {}, false, SCOPES_COPIE); } catch (e) { if (e.status !== 404) throw e; }
  if (!item) {
    attente(win, "Création de ta copie de « " + esc(nom) + " »…");
    let blob;
    if (r.path) { const { data, error } = await sb.storage.from(r.bucket || "documents").createSignedUrl(r.path, 600); if (error) throw error; blob = await (await fetch(data.signedUrl)).blob(); }
    else {
      const it = await graph("/shares/u!" + b64u(r.url) + "/driveItem", { headers: { Prefer: "redeemSharingLinkIfNecessary" } }, false, SCOPES_COPIE);
      const url = it["@microsoft.graph.downloadUrl"]; if (!url) throw new Error("document introuvable");
      const res = await fetch(url); if (!res.ok) throw new Error("lecture du document impossible (" + res.status + ")"); blob = await res.blob();
    }
    item = await odPut(ch, blob, SCOPES_COPIE);
  }
  memoCopie(ctx, item, nom);
  win.location.href = item.webUrl;
  if (ctx.devoir && route().v === "devoir") render();
}
async function copieOffice(a){
  const r = JSON.parse(a.dataset.r || "{}"), ctx = JSON.parse(a.dataset.ctx || "{}");
  const win = window.open("", "_blank");
  if (!win) { toast("Autorise les fenêtres (pop-up) pour ce site, puis réessaie."); return; }
  attente(win, "Ouverture de ta copie…");
  try { await jetonGraph(false, SCOPES_COPIE); }
  catch (e) { win.close(); S.modal = { kind: "copieauth", r, ctx }; render(); return; }
  try { await ouvrirCopie(r, ctx, win); }
  catch (e) { win.close(); toast("Copie impossible : " + (e.message || e)); }
}
/* première fois : l'élève autorise PhysiquePro à utiliser son OneDrive (clic direct = fenêtre Microsoft autorisée) */
async function copieAutoriser(){
  const m = S.modal; if (!m) return;
  try { await jetonGraph(true, SCOPES_COPIE); } catch (e) { toast("Autorisation OneDrive refusée ou impossible."); return; }
  S.modal = null; render();
  const win = window.open("", "_blank"); if (!win) { toast("Autorise les fenêtres (pop-up) pour ce site, puis réessaie."); return; }
  attente(win, "Ouverture de ta copie…");
  try { await ouvrirCopie(m.r, m.ctx, win); } catch (e) { win.close(); toast("Copie impossible : " + (e.message || e)); }
}
async function joindreCopie(id, nom){
  try {
    toast("Ajout de ta copie…");
    const it = await graph("/me/drive/items/" + encodeURIComponent(id), {}, true, SCOPES_COPIE), url = it["@microsoft.graph.downloadUrl"];
    const blob = await (await fetch(url)).blob();
    S.files.push(new File([blob], nom, { type: blob.type || "application/octet-stream" })); render(); toast("« " + nom + " » ajouté à ton travail");
  } catch (e) { toast("Impossible de joindre la copie : " + (e.message || e)); }
}

/* ---------- copies modifiables créées par le professeur pour chaque élève (comme Classroom) ---------- */
const copiesEleve = (objet, id, email) => (S.copies || []).filter(x => x.objet === objet && String(x.objet_id) === String(id) && x.eleve_email === email);
function copieDe(r, ctx){
  if (!r.od || !r.od.id) return null;
  return (S.copies || []).find(x => x.source === r.od.id && x.eleve_email === moi() && (ctx.devoir ? x.objet === "devoir" && String(x.objet_id) === String(ctx.devoir) : ctx.support ? x.objet === "support" && String(x.objet_id) === String(ctx.support) : true)) || null;
}
let copiesEnCours = false;
async function genererCopies(silencieux){
  if (!S.prof || !odActif() || copiesEnCours) return;
  copiesEnCours = true;
  try {
    const visible = o => !o.brouillon && D(o.publie_le) <= now();
    const office = o => (o.ressources || []).filter(r => r.od && r.od.id && appOffice(r.label || ""));
    const lots = [];
    for (const d of S.devoirs) if (visible(d) && d.type !== "question" && office(d).length) lots.push({ objet: "devoir", o: d });
    for (const c of actives()) { const data = await chargerClasse(c.id); (data.supports || []).forEach(sp => { if (visible(sp) && office(sp).length) lots.push({ objet: "support", o: sp }); }); }
    const faits = new Set((S.copies || []).map(x => x.objet + ":" + x.objet_id + ":" + x.source + ":" + x.eleve_email));
    const taches = [];
    for (const l of lots) {
      const el = elevesDuDevoir(l.o, inscritsDe(l.o.classe_id));
      for (const r of office(l.o)) for (const e of el) if (!faits.has(l.objet + ":" + l.o.id + ":" + r.od.id + ":" + e.email)) taches.push({ ...l, r, e });
    }
    if (!taches.length) return;
    await jetonGraph(!silencieux);
    const cache = {};
    let n = 0;
    for (const t of taches) {
      try {
        if (!cache[t.r.od.id]) { const it = await graph("/me/drive/items/" + encodeURIComponent(t.r.od.id), {}, false); cache[t.r.od.id] = await (await fetch(it["@microsoft.graph.downloadUrl"])).blob(); }
        const nom = nomOD(t.r.label || "document"), nomE = nomOD(t.e.nom || nomDepuisEmail(t.e.email));
        const item = await odPut(cheminOD([OD_RACINE, ...dossierTravail(t.o.classe_id, t.o.theme_id, t.o.titre), "Copies élèves", nomE + " - " + nom]), cache[t.r.od.id]);
        await graph("/me/drive/items/" + item.id + "/invite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipients: [{ email: t.e.email }], roles: ["write"], requireSignIn: true, sendInvitation: false }) }, false);
        const row = { classe_id: t.o.classe_id, objet: t.objet, objet_id: t.o.id, source: t.r.od.id, eleve_email: t.e.email, nom, od_id: item.id, web: item.webUrl };
        const { data, error } = await sb.from("copies").insert(row).select().single(); if (error) throw error;
        S.copies.push(data); n++;
        if (n === 1 || n % 5 === 0) toast("Copies modifiables pour les élèves : " + n + " / " + taches.length);
      } catch (e) { console.warn("copie élève", e); if (/42P01|copies/.test(e.message || "")) break; }
    }
    if (n) toast(n + " copie" + (n > 1 ? "s modifiables créées" : " modifiable créée") + " pour les élèves");
  } catch (e) { if (!silencieux) toast("Copies élèves : " + (e.message || e)); }
  finally { copiesEnCours = false; }
}

/* ---------- travaux rendus : déplacés dans le OneDrive du prof, puis supprimés du stockage PhysiquePro (1 Go) ---------- */
let transfertEnCours = false;
async function transfererRendus(silencieux){
  if (!S.prof || !odActif() || transfertEnCours) return;
  const aFaire = S.rendus.filter(r => (r.fichiers || []).some(f => f.chemin));
  if (!aFaire.length) return;
  transfertEnCours = true; let n = 0;
  try {
    await jetonGraph(!silencieux);
    for (const r of aFaire) {
      const d = S.devoirs.find(x => x.id === r.devoir_id); if (!d) continue;
      if (!S.cache[d.classe_id]) await chargerClasse(d.classe_id);
      const parts = [...dossierTravail(d.classe_id, d.theme_id, d.titre), "Travaux rendus"], fichiers = [], aSupprimer = [];
      let change = false;
      for (const f of r.fichiers || []) {
        if (!f.chemin) { fichiers.push(f); continue; }
        try {
          const { data } = await sb.storage.from("rendus").createSignedUrl(f.chemin, 600); if (!data) throw new Error("introuvable");
          const blob = await (await fetch(data.signedUrl)).blob();
          const item = await odPut(cheminOD([OD_RACINE, ...parts, nomOD(nomDe(d.classe_id, r.auteur_email) + " - " + f.nom)]), blob);
          const dest = [r.auteur_email, r.binome_email].filter(Boolean).map(email => ({ email }));
          await graph("/me/drive/items/" + item.id + "/invite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipients: dest, roles: ["read"], requireSignIn: true, sendInvitation: false }) }, false);
          fichiers.push({ nom: f.nom, taille: f.taille, od: { id: item.id, web: item.webUrl } }); aSupprimer.push(f.chemin); change = true; n++;
        } catch (e) { console.warn("transfert rendu", e); fichiers.push(f); }
      }
      if (!change) continue;
      const { error } = await sb.from("rendus").update({ fichiers }).eq("id", r.id);
      if (error) { console.warn("maj rendu", error); if (/policy|row-level/i.test(error.message)) break; continue; }
      r.fichiers = fichiers;
      await sb.storage.from("rendus").remove(aSupprimer);
    }
    if (n && !silencieux) toast(n + " fichier" + (n > 1 ? "s rendus rangés" : " rendu rangé") + " dans OneDrive");
  } catch (e) { if (!silencieux) toast("Transfert des rendus : " + (e.message || e)); }
  finally { transfertEnCours = false; }
}

/* ---------- confidentialité OneDrive ----------
   1) Les dossiers (classe, thèmes, activités) ne sont jamais partagés avec les élèves ni avec tout le lycée :
      un élève n'accède qu'aux fichiers publiés pour lui, par les liens du site.
   2) Les fichiers d'un élément en BROUILLON n'ont aucun lien de partage ; le lien est (re)créé à la publication. */
let confEnCours = false;
const permsOD = async id => ((await graph("/me/drive/items/" + encodeURIComponent(id) + "/permissions", {}, false)) || {}).value || [];
const suppPermOD = (id, p) => graph("/me/drive/items/" + encodeURIComponent(id) + "/permissions/" + encodeURIComponent(p.id), { method: "DELETE" }, false);
const emailsDe = p => [p.grantedToV2, ...(p.grantedToIdentitiesV2 || [])].filter(Boolean).map(g => ((g.user || g.siteUser || {}).email || "").toLowerCase()).filter(Boolean);
async function dossiersPrives(eleves){
  let n = 0;
  const racine = await graph("/me/drive/root:/" + encodeURIComponent(OD_RACINE), {}, false);
  const pile = [racine.id];
  while (pile.length) {
    const id = pile.shift();
    for (const p of await permsOD(id)) {
      if (p.inheritedFrom || (p.roles || []).includes("owner")) continue;
      const large = p.link && ["organization", "anonymous"].includes(p.link.scope);
      const versEleve = emailsDe(p).some(e => eleves.has(e));
      if (large || versEleve) { try { await suppPermOD(id, p); n++; } catch (e) { console.warn("partage dossier", e); } }
    }
    let url = "/me/drive/items/" + encodeURIComponent(id) + "/children?$select=id,name,folder&$top=200";
    while (url) { const j = await graph(url, {}, false); (j.value || []).forEach(x => { if (x.folder) pile.push(x.id); }); url = j["@odata.nextLink"] || null; }
  }
  return n;
}
async function fichiersBrouillons(){
  let fermes = 0, ouverts = 0;
  const lots = S.devoirs.map(o => ({ table: "devoirs", o }));
  for (const c of S.classes) { const data = await chargerClasse(c.id); (data.supports || []).forEach(o => lots.push({ table: "supports", o })); }
  for (const { table, o } of lots) {
    const res = o.ressources || []; if (!res.some(r => r.od && r.od.id)) continue;
    let change = false;
    for (const r of res) {
      if (!r.od || !r.od.id) continue;
      try {
        if (o.brouillon && !r.prive) {
          for (const p of await permsOD(r.od.id)) if (p.link && !p.inheritedFrom) await suppPermOD(r.od.id, p);
          r.prive = true; r.url = r.od.web || r.url; change = true; fermes++;
        } else if (!o.brouillon && r.prive) {
          const lien = await graph("/me/drive/items/" + encodeURIComponent(r.od.id) + "/createLink", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "view", scope: "organization" }) }, false);
          r.url = lien.link.webUrl; delete r.prive; change = true; ouverts++;
        }
      } catch (e) { console.warn("partage fichier", r.label, e); }
    }
    if (change) { const { error } = await sb.from(table).update({ ressources: res }).eq("id", o.id); if (error) console.warn("maj ressources", error); }
  }
  return { fermes, ouverts };
}
async function synchroPartages(silencieux, dossiers){
  if (!S.prof || !odActif() || confEnCours) return;
  confEnCours = true;
  try {
    await jetonGraph(!silencieux);
    const f = await fichiersBrouillons();
    let nd = 0, dernier = 0;
    try { dernier = Number(localStorage.getItem("pp_conf_dossiers") || 0); } catch (_) {}
    if (dossiers || Date.now() - dernier > 12 * 3600e3) {
      const el = new Set((S.toutesInscriptions || []).map(x => String(x.email).toLowerCase()));
      nd = await dossiersPrives(el);
      try { localStorage.setItem("pp_conf_dossiers", String(Date.now())); } catch (_) {}
    }
    if (f.fermes || f.ouverts) S.cache = {};
    if (!silencieux || nd || f.fermes || f.ouverts) toast([nd ? nd + " partage" + (nd > 1 ? "s" : "") + " de dossier retiré" + (nd > 1 ? "s" : "") : "", f.fermes ? f.fermes + " fichier" + (f.fermes > 1 ? "s" : "") + " de brouillon rendu" + (f.fermes > 1 ? "s" : "") + " privé" + (f.fermes > 1 ? "s" : "") : "", f.ouverts ? f.ouverts + " fichier" + (f.ouverts > 1 ? "s" : "") + " publié" + (f.ouverts > 1 ? "s" : "") + " pour les élèves" : ""].filter(Boolean).join(" · ") || "OneDrive : dossiers et brouillons déjà privés ✓");
  } catch (e) { if (!silencieux) toast("Confidentialité OneDrive : " + (e.message || e)); }
  finally { confEnCours = false; }
}

/* ---------- dossiers de classe : un dossier par cours, au nom actuel du cours ----------
   Renomme, fusionne les doublons (ex. « Terminale spé PC » + « Terminale spé PC 26-27 »), met à jour les adresses
   des fichiers, le lien du dossier dans les paramètres du cours, puis revérifie que rien n'est partagé. */
const NOMS_INITIAUX = { tle: "Terminale spé PC", "1re": "1re spé PC", snt: "SNT", si: "Option SI", "3e": "Technologie 3e", pix: "PIX" };
async function enfantsOD(id){
  const out = []; let url = "/me/drive/items/" + encodeURIComponent(id) + "/children?$select=id,name,folder,file,webUrl&$top=200";
  while (url) { const j = await graph(url, {}, false); out.push(...(j.value || [])); url = j["@odata.nextLink"] || null; }
  return out;
}
const patchOD = (id, corps) => graph("/me/drive/items/" + encodeURIComponent(id) + "?@microsoft.graph.conflictBehavior=rename", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps) }, false);
async function fusionnerOD(srcId, dstId){
  const dst = new Map((await enfantsOD(dstId)).map(x => [x.name.toLowerCase(), x]));
  for (const x of await enfantsOD(srcId)) {
    const y = dst.get(x.name.toLowerCase());
    if (y && x.folder && y.folder) { await fusionnerOD(x.id, y.id); await supprimerSiVide(x.id); }
    else await patchOD(x.id, { parentReference: { id: dstId } });
  }
}
/* un dossier vide part dans la corbeille OneDrive (récupérable) ; un dossier non vide n'est jamais supprimé */
async function supprimerSiVide(id){ if (!(await enfantsOD(id)).length) await graph("/me/drive/items/" + encodeURIComponent(id), { method: "DELETE" }, false); }
let rangerEnCours = false;
async function rangerDossiersClasses(anciens = {}){
  if (!S.prof || !odActif() || rangerEnCours) return;
  rangerEnCours = true; const bilan = { renommes: 0, fusionnes: 0, liens: 0, autres: [] };
  try {
    await jetonGraph(true);
    const racine = await graph("/me/drive/root:/" + encodeURIComponent(OD_RACINE), {}, false);
    let top = (await enfantsOD(racine.id)).filter(x => x.folder);
    const parId = new Map(top.map(x => [x.id, x])), parNom = n => top.find(x => x.name.toLowerCase() === nomOD(n).toLowerCase());
    /* 1. à quel cours appartient chaque dossier ? d'après l'emplacement des fichiers de ce cours, puis d'après le nom */
    const objets = S.devoirs.map(o => ({ table: "devoirs", o }));
    for (const c of S.classes) { const data = await chargerClasse(c.id); (data.supports || []).forEach(o => objets.push({ table: "supports", o })); }
    const dossiersDe = {}, votes = {}; S.classes.forEach(c => dossiersDe[c.id] = new Set());
    for (const { o } of objets) {
      const r = (o.ressources || []).find(x => x.od && x.od.id); if (!r || !dossiersDe[o.classe_id]) continue;
      try { const it = await graph("/me/drive/items/" + encodeURIComponent(r.od.id) + "?$select=id,parentReference", {}, false);
        const seg = decodeURIComponent((it.parentReference && it.parentReference.path) || "").split(":/")[1] || "", parts = seg.split("/");
        if (parts[0] === OD_RACINE && parts[1]) { const f = parNom(parts[1]); if (f) { const v = votes[f.id] = votes[f.id] || {}; v[o.classe_id] = (v[o.classe_id] || 0) + 1; } } } catch (_) {}
    }
    /* un dossier appartient au cours qui y a le plus de fichiers */
    for (const [fid, v] of Object.entries(votes)) { const cid = Object.keys(v).sort((a, b) => v[b] - v[a])[0]; dossiersDe[cid].add(fid); }
    const pris = new Set(Object.values(dossiersDe).flatMap(s => [...s]));
    for (const c of S.classes) for (const n of [c.nom, anciens[c.id], NOMS_INITIAUX[c.id]].filter(Boolean)) { const f = parNom(n); if (f && !pris.has(f.id)) { dossiersDe[c.id].add(f.id); pris.add(f.id); } }
    /* 2. un seul dossier par cours, au nom actuel du cours */
    for (const c of S.classes) {
      const ids = [...dossiersDe[c.id]]; if (!ids.length) continue;
      const cible = ids.find(id => parId.get(id).name.toLowerCase() === nomOD(c.nom).toLowerCase()) || ids[0];
      for (const id of ids) if (id !== cible) { await fusionnerOD(id, cible); await supprimerSiVide(id); bilan.fusionnes++; }
      let f = parId.get(cible);
      if (f.name !== nomOD(c.nom)) { f = await patchOD(cible, { name: nomOD(c.nom) }); bilan.renommes++; }
      const web = (await graph("/me/drive/items/" + encodeURIComponent(cible) + "?$select=webUrl", {}, false)).webUrl;
      if (web && c.dossier_onedrive !== web) { const { error } = await sb.from("classes").update({ dossier_onedrive: web }).eq("id", c.id); if (!error) { c.dossier_onedrive = web; bilan.liens++; } }
    }
    top = (await enfantsOD(racine.id)).filter(x => x.folder);
    bilan.autres = top.filter(x => !S.classes.some(c => nomOD(c.nom).toLowerCase() === x.name.toLowerCase())).map(x => x.name);
    /* 3. adresses des fichiers déplacés (documents, copies des élèves, travaux rendus) */
    const webDe = async id => { try { return (await graph("/me/drive/items/" + encodeURIComponent(id) + "?$select=webUrl", {}, false)).webUrl; } catch (_) { return null; } };
    for (const { table, o } of objets) {
      let ch = false; for (const r of o.ressources || []) if (r.od && r.od.id) { const w = await webDe(r.od.id); if (w && w !== r.od.web) { if (r.prive || r.url === r.od.web) r.url = w; r.od.web = w; ch = true; } }
      if (ch) await sb.from(table).update({ ressources: o.ressources }).eq("id", o.id);
    }
    for (const x of S.copies || []) { const w = await webDe(x.od_id); if (w && w !== x.web) { await sb.from("copies").update({ web: w }).eq("id", x.id); x.web = w; } }
    for (const r of S.rendus) { let ch = false; const fs = (r.fichiers || []).map(f => ({ ...f })); for (const f of fs) if (f.od && f.od.id) { const w = await webDe(f.od.id); if (w && w !== f.od.web) { f.od = { ...f.od, web: w }; ch = true; } }
      if (ch) { const { error } = await sb.from("rendus").update({ fichiers: fs }).eq("id", r.id); if (!error) r.fichiers = fs; } }
    /* 4. confidentialité : aucun dossier partagé */
    const el = new Set((S.toutesInscriptions || []).map(x => String(x.email).toLowerCase()));
    const nd = await dossiersPrives(el); try { localStorage.setItem("pp_conf_dossiers", String(Date.now())); } catch (_) {}
    S.cache = {}; await rafraichir();
    toast(`Dossiers OneDrive rangés : ${bilan.renommes} renommé(s), ${bilan.fusionnes} doublon(s) fusionné(s)${nd ? ", " + nd + " partage(s) retiré(s)" : ""}${bilan.autres.length ? " · hors cours : " + bilan.autres.join(", ") : ""}`);
    return bilan;
  } catch (e) { toast("Rangement OneDrive : " + (e.message || e)); }
  finally { rangerEnCours = false; render(); }
}

/* ---------- cours supprimé : son dossier OneDrive part dans la corbeille (récupérable 93 jours) ---------- */
async function supprimerDossierCours(nom){
  await jetonGraph(true);
  try { const it = await graph("/me/drive/root:/" + cheminOD([OD_RACINE, nom]), {}, false); await graph("/me/drive/items/" + encodeURIComponent(it.id), { method: "DELETE" }, false); return true; }
  catch (e) { if (e.status === 404) return false; throw e; }
}
/* dossiers restés pour des cours déjà supprimés (aucun cours, même archivé, ne porte ce nom) */
async function dossiersOrphelins(){
  await jetonGraph(true);
  const racine = await graph("/me/drive/root:/" + encodeURIComponent(OD_RACINE), {}, false);
  const noms = new Set(S.classes.map(c => nomOD(c.nom).toLowerCase()));
  return (await enfantsOD(racine.id)).filter(x => x.folder && !noms.has(x.name.toLowerCase()));
}
/* ---------- import depuis Google Classroom ---------- */
const MOIS_FR = { janv: 0, "févr": 1, fevr: 1, mars: 2, avr: 3, mai: 4, juin: 5, juil: 6, "août": 7, aout: 7, sept: 8, oct: 9, nov: 10, "déc": 11, dec: 11 };
const META_CR = /^(Aucune date limite|Date limite.*|À rendre.*|Échéance.*|\d+|Remis|Rendus?|Attribués?|Notés?|Afficher les instructions|Afficher le support|Afficher le devoir|Afficher la question|Modifier le support|Modifier le devoir|Modifier la question|PDF|Microsoft Word|Microsoft Excel|Microsoft PowerPoint|Google (Docs|Sheets|Slides|Forms|Drive|Dessins)|Formulaires Google|Image|Vidéo|YouTube|Vidéo YouTube.*|Lien|Dossier|\d+ minutes?|\d+:\d+)$/i;
function dateCR(lignes){
  const l = (lignes || []).find(x => /^(Date limite|À rendre)/i.test(x)); if (!l) return null;
  const m = l.match(/(\d{1,2})\s+([a-zéû]+)\.?(?:\s+(\d{4}))?(?:,?\s*(\d{1,2}):(\d{2}))?/i); if (!m) return null;
  const mo = MOIS_FR[m[2].toLowerCase().replace(/\.$/, "")]; if (mo == null) return null;
  const an = m[3] ? Number(m[3]) : (mo >= 7 ? 2026 : 2027);
  return new Date(an, mo, Number(m[1]), m[4] ? Number(m[4]) : 23, m[5] ? Number(m[5]) : 59);
}
function texteCR(it){
  const titres = new Set((it.liens || []).flatMap(l => [l.t, l.u]));
  const lignes = (it.corps || []).filter(x => x.trim() && !META_CR.test(x.trim()) && !titres.has(x.trim()) && !/^https?:\/\//.test(x.trim()));
  let html = "", liste = false;
  for (const x of lignes) {
    const puce = /^\s/.test(x) || /^[•\-–]\s/.test(x.trim());
    if (puce && !liste) { html += "<ul>"; liste = true; }
    if (!puce && liste) { html += "</ul>"; liste = false; }
    html += puce ? "<li>" + esc(x.trim().replace(/^[•\-–]\s*/, "")) + "</li>" : "<p>" + esc(x.trim()) + "</p>";
  }
  return html + (liste ? "</ul>" : "");
}
function ressourcesCR(it){
  return (it.liens || []).map(l => { const u = l.u, t = (l.t || "").trim();
    const type = /youtu/.test(u) ? "YouTube" : /docs\.google\.com\/document/.test(u) ? "Docs" : /spreadsheets/.test(u) ? "Sheets" : /presentation/.test(u) ? "Slides" : /forms/.test(u) ? "Forms" : /drive\.google/.test(u) ? (extType(t) !== "Fichier" ? extType(t) : "Drive") : "Lien";
    return { type, label: type === "YouTube" && /^(youtube|vidéo)/i.test(t) ? "YouTube" : t || u, url: u, cr: /google\.com/.test(u) ? 1 : 0 }; });
}
const coursAuto = nom => { const n = " " + sansAccent(nom).replace(/[^a-z0-9]+/g, " ") + " ";
  return /\s(ter|tle|tale|terminale|terminales)\s/.test(n) ? "tle" : /\s(1ere|1re|1eres|premiere|premieres)\s/.test(n) ? "1re" : /\ssnt\s/.test(n) ? "snt" : /\s(si|option si|sciences de l ingenieur)\s/.test(n) ? "si" : /\s(3eme|3e|3eme a b|techno|technologie)\s/.test(n) ? "3e" : /\spix\s/.test(n) ? "pix" : ""; };

function admImport(){
  const I = S.imp || (S.imp = { texte: "", data: null, map: {}, brouillons: true, log: [], busy: false });
  let liste = "";
  if (I.data) liste = I.data.map((c, k) => `<div class="setrow"><span><b>${esc(c.cours.replace(/^Travaux et devoirs de\s*/, "").replace(/\s*-\s*Classroom$/, ""))}</b><small class="muted">${c.items.length} éléments · ${new Set(c.items.map(i => i.topic)).size} thèmes · ${c.items.filter(i => /Brouillon/.test(i.statut)).length} brouillons</small></span>
      <select data-impmap="${k}" class="agsel"><option value="">Ne pas importer</option>${actives().map(x => `<option value="${esc(x.id)}" ${I.map[k] === x.id ? "selected" : ""}>${esc(x.nom)}</option>`).join("")}</select></div>`).join("");
  return `<section class="edcard"><h2>${icon("upload")} Importer depuis Google Classroom</h2>
      <p class="muted" style="margin:0;font-size:.88rem">Étape 1 : colle ici les données lues dans ton Classroom (Claude s'en charge). Étape 2 : choisis le cours PhysiquePro de destination. Étape 3 : importe. Les thèmes, documentations, devoirs, descriptions, liens et vidéos sont recréés. Un élément déjà présent (même titre) n'est pas recréé.</p>
      <textarea id="impTexte" class="adtext" rows="4" placeholder="Données Classroom (JSON)">${esc(I.texte)}</textarea>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn ghost sm" data-act="impanalyse">Analyser</button></div>
      ${I.data ? `<h3>Cours trouvés</h3>${liste}
        <label class="check"><input type="checkbox" id="impBrouillons" ${I.brouillons ? "checked" : ""}> Importer aussi les brouillons (en brouillon)</label>
        <div><button class="btn" data-act="impgo" ${I.busy ? "disabled" : ""}>${I.busy ? "Import en cours…" : "Importer"}</button></div>` : ""}
      ${I.log.length ? `<div class="implog">${I.log.map(l => `<div>${esc(l)}</div>`).join("")}</div>` : ""}
    </section>
    <section class="edcard"><h2>${icon("folder")} Fichiers Google Drive</h2>
      <p class="muted" style="margin:0;font-size:.88rem">Tes élèves n'ont pas de compte Google : les fichiers Drive doivent être copiés. Dans Google Drive, télécharge le dossier <b>Classroom</b> (clic droit › Télécharger), puis choisis le fichier .zip ici. Chaque fichier est rangé ${odActif() ? "dans ton OneDrive (classe › thème › activité)" : "dans PhysiquePro"} et remplace le lien Drive.</p>
      <div><button class="btn ghost sm" data-act="impzip" ${I.busy ? "disabled" : ""}>${icon("upload")} Choisir le .zip de Google Drive</button><input type="file" id="impZip" accept=".zip" multiple hidden></div>
    </section>`;
}
function analyserImport(){
  const I = S.imp; I.log = [];
  try { let d = JSON.parse(I.texte); if (!Array.isArray(d)) d = [d]; d = d.filter(c => c && Array.isArray(c.items)); if (!d.length) throw new Error("aucun cours");
    I.data = d; I.map = {}; d.forEach((c, k) => { I.map[k] = coursAuto(c.cours); }); }
  catch (e) { I.data = null; I.log = ["Données illisibles : " + (e.message || e)]; }
}
async function lancerImport(){
  const I = S.imp; if (!I || !I.data) return; I.busy = true; I.log = []; const log = m => { I.log.push(m); const z = document.querySelector(".implog"); if (z) z.insertAdjacentHTML("beforeend", "<div>" + esc(m) + "</div>"); else render(); };
  render();
  for (let k = 0; k < I.data.length; k++) {
    const cid = I.map[k]; if (!cid) continue; const C = I.data[k], c = cls(cid);
    log("— " + c.nom + " —");
    const data = await chargerClasse(cid, true), themes = data.themes.slice();
    const existants = new Set([...S.devoirs.filter(d => d.classe_id === cid).map(d => d.titre), ...data.supports.map(s => s.titre), ...S.quiz.filter(q => q.classe_id === cid).map(q => q.titre)].map(sansAccent));
    const ordreTopics = [...new Set([...(C.topics || []), ...C.items.map(i => i.topic)])];
    let ordre = themes.reduce((a, t) => Math.max(a, t.ordre || 0), 0);
    const idTheme = {};
    for (const nom of ordreTopics) {
      if (!nom) continue; const ex = themes.find(t => sansAccent(t.titre) === sansAccent(nom));
      if (ex) { idTheme[nom] = ex.id; continue; }
      const r = await sb.from("themes").insert({ classe_id: cid, titre: nom, ordre: ++ordre }).select("id").single();
      if (r.error) { log("Thème « " + nom + " » : " + r.error.message); continue; } idTheme[nom] = r.data.id; log("Thème créé : " + nom);
    }
    /* même ordre des thèmes que dans Classroom (les autres thèmes passent après) */
    const ids = ordreTopics.map(t => idTheme[t]).filter(Boolean), autres = themes.filter(t => !ids.includes(t.id)).map(t => t.id);
    await Promise.all([...ids, ...autres].map((id, k2) => sb.from("themes").update({ ordre: k2 + 1 }).eq("id", id)));
    const base = Date.now(); let n = 0, saut = 0;
    for (let i = 0; i < C.items.length; i++) {
      const it = C.items[i], brouillon = /Brouillon/i.test(it.statut);
      if (brouillon && !I.brouillons) continue;
      if (existants.has(sansAccent(it.titre))) { saut++; continue; }
      const commun = { classe_id: cid, theme_id: idTheme[it.topic] || null, titre: it.titre, ressources: ressourcesCR(it), brouillon, publie_le: new Date(base - i * 60000).toISOString() };
      let r;
      if (it.kind === "book") r = await sb.from("supports").insert({ ...commun, description: texteCR(it) });
      else { const lim = dateCR(it.corps), isQ = /help/.test(it.kind);
        r = await sb.from("devoirs").insert({ ...commun, consigne: texteCR(it), date_limite: lim ? lim.toISOString() : null, mode: "individuel", formats: "", points: 20,
          ...(isQ ? { type: "question", question: { format: "courte", options: [], voir: false, modifier: true } } : {}) }); }
      if (r.error) log("« " + it.titre + " » : " + r.error.message); else n++;
    }
    log(n + " élément" + (n > 1 ? "s importés" : " importé") + (saut ? " · " + saut + " déjà présent(s)" : ""));
    delete S.cache[cid];
  }
  await rafraichir(); I.busy = false; log("Import terminé."); render();
}
/* fichiers du zip Google Drive → OneDrive (ou PhysiquePro), à la place des liens Drive */
async function importerZip(files){
  const I = S.imp || (S.imp = { texte: "", data: null, map: {}, brouillons: true, log: [], busy: false });
  if (!window.JSZip) { await new Promise((ok, ko) => { const s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"; s.onload = ok; s.onerror = ko; document.head.appendChild(s); }); }
  I.busy = true; I.log = []; render();
  const log = m => { I.log.push(m); const z = document.querySelector(".implog"); if (z) z.insertAdjacentHTML("beforeend", "<div>" + esc(m) + "</div>"); else render(); };
  /* index des fichiers du zip : nom → [{entrée, cours}] (le cours vient du dossier Classroom « Ter. G1… », « 1ere G3… ») */
  const index = new Map(), cle = n => sansAccent(String(n).split("/").pop().replace(/\.[a-z0-9]{2,5}$/i, "")).replace(/[^a-z0-9]+/g, "");
  for (const f of files) { const z = await window.JSZip.loadAsync(f); z.forEach((p, e) => { if (e.dir) return;
    let cid = ""; for (const seg of p.split("/").slice(0, -1)) { cid = coursAuto(seg); if (cid) break; }
    const k = cle(p); if (!index.has(k)) index.set(k, []); index.get(k).push({ e, cid, p }); }); }
  log(index.size + " fichiers trouvés dans le zip.");
  { const parCours = {}, sans = new Set(); index.forEach(l => l.forEach(x => { parCours[x.cid || "?"] = (parCours[x.cid || "?"] || 0) + 1; if (!x.cid) sans.add(x.p.split("/").slice(0, -1).slice(0, 3).join(" / ") || "(racine du zip)"); }));
    log("Fichiers par cours : " + Object.entries(parCours).map(([k, v]) => (k === "?" ? "cours non reconnu" : ((cls(k) || {}).nom || k)) + " " + v).join(" · "));
    if (sans.size) log("Dossiers sans cours reconnu : " + [...sans].slice(0, 6).join(" | ")); }
  { let nd = 0; index.forEach(l => { if (new Set(l.map(x => x.cid)).size > 1) nd++; }); log(nd + " nom" + (nd > 1 ? "s" : "") + " de fichier présent" + (nd > 1 ? "s" : "") + " dans plusieurs cours."); }
  const choisir = (label, cid) => { const l = index.get(cle(label)); if (!l) return null; return l.find(x => x.cid === cid) || (l.length === 1 ? l[0] : null); };
  const doublon = label => { const l = index.get(cle(label)); return l && new Set(l.map(x => x.cid)).size > 1; };
  for (const c of S.classes) await chargerClasse(c.id, true);
  const lots = [...S.devoirs.map(d => ({ table: "devoirs", o: d })), ...S.classes.flatMap(c => (S.cache[c.id] || { supports: [] }).supports.map(s => ({ table: "supports", o: s })))]
    .filter(x => (x.o.ressources || []).some(r => r.cr || (r.od && doublon(r.label))));
  let n = 0, corr = 0;
  for (const lot of lots) {
    const res = []; let chg = false;
    for (const r of lot.o.ressources) {
      const aRefaire = r.od && doublon(r.label), x = (r.cr || aRefaire) ? choisir(r.label, lot.o.classe_id) : null;
      if (!x || (aRefaire && r.od.src === x.p)) { res.push(r); continue; }
      try {
        const blob = await x.e.async("blob"), nom = x.e.name.split("/").pop();
        let nouv;
        if (odActif()) { const o = await odEnvoyer([...dossierTravail(lot.o.classe_id, lot.o.theme_id, lot.o.titre), nom], blob); nouv = ressourceOD(o, nom); nouv.od.src = x.p; }
        else { const path = lot.o.classe_id + "/" + Date.now() + "-" + safeName(nom); const up = await sb.storage.from("documents").upload(path, blob); if (up.error) throw up.error; nouv = { type: extType(nom), label: nom, path }; }
        if (aRefaire && r.od.id) { try { await graph("/me/drive/items/" + r.od.id, { method: "DELETE" }); } catch (_) {} corr++; log("↻ corrigé : " + nom + " → " + lot.o.titre); }
        else { n++; log("✓ " + nom + " → " + lot.o.titre); }
        res.push(nouv); chg = true;
      } catch (er) { res.push(r); log("✗ " + r.label + " : " + (er.message || er)); }
    }
    if (chg) await sb.from(lot.table).update({ ressources: res }).eq("id", lot.o.id);
  }
  if (corr) log(corr + " fichier" + (corr > 1 ? "s" : "") + " portant le même nom dans plusieurs cours ont été remplacés par la version du bon cours.");
  S.cache = {}; await rafraichir(); I.busy = false; log(n + " fichier" + (n > 1 ? "s" : "") + " copiés. Les liens Drive restants n'ont pas été trouvés dans le zip."); render();
}
/* ---------- page d'accueil publique (visiteur non connecté) ---------- */
const PUB = { classes: [], charge: false };
const ROUTES_PUBLIQUES = ["accueil", "outils", "simulations", "physique"];
async function chargerPublic(){
  try {
    const { data, error } = await sb.rpc("pp_accueil_public");
    if (error) throw error;
    PUB.classes = (data && data.classes) || [];
    const g = (data && data.reglages) || {};
    appliquerReglages({ prof: g.prof || {}, liensUtiles: g.liensUtiles, outils: g.outils });
  } catch (_) { PUB.classes = []; appliquerReglages(); }
  PUB.charge = true;
}
/* bouton « Se connecter » : directement la page Microsoft, puis retour sur la page demandée */
async function connecter(suite){
  try { localStorage.setItem("pp_fresh", "1"); if (suite) localStorage.setItem("pp_next", suite); else localStorage.removeItem("pp_next"); } catch (_) {}
  document.querySelectorAll('[data-act="pubconnect"]').forEach(b => { b.disabled = true; b.textContent = "Redirection vers Microsoft…"; });
  const { error } = await sb.auth.signInWithOAuth({ provider: "azure", options: { scopes: "openid email profile", redirectTo: ICI, queryParams: { prompt: "select_account" } } });
  if (error) { toast("La connexion n'a pas pu démarrer : " + error.message); renderPublic(); }
}
const btnConnexion = (txt = "Se connecter", cls2 = "") => `<button class="btn ${cls2}" data-act="pubconnect">${icon("logout")} ${txt}</button>`;
function topbarPublic(){
  return `<header class="topbar pubtop">
    <div class="crumbs"><a class="brand" href="#/" style="text-decoration:none;color:inherit">${logoSVG}<span class="brandtx"><b>Physique<span>Pro</span></b><small>site de M. ${esc(R().prof.nom)}</small></span></a></div>
    <span class="spacer topmid"><img class="toplogo" src="logo-verdun-haut.png?v=2" alt="Lycée franco-libanais Verdun" width="81" height="48"></span>
    <nav class="quick pubquick" aria-label="Liens rapides">${R().liensUtiles.filter(l => !l.prof).slice(0, 12).map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener" class="${l.principal ? "main" : ""}${l.ordi ? " qordi" : ""}${COTE_A_COTE[l.icone] ? " qside" + (SP.cle === l.icone ? " on" : "") : ""}" data-cle="${esc(l.icone || "")}" style="--q:${esc(l.couleur)}"><span class="qi">${quickIcon(l.icone)}</span><span class="ql">${esc(l.nom)}</span></a>`).join("")}</nav>
  </header>`;
}
function cartePublique(c){
  return `<article class="ccard pubcard" style="--bb:var(${C(c.couleur).b})">
    <div style="position:relative">
      <a class="banner" href="#/classe/${esc(c.id)}" data-act="pubcours" data-c="${esc(c.id)}">${bannerArt(c)}<h2>${esc(c.nom)}</h2>${c.section ? `<p>${esc(c.section)}</p>` : ""}<span class="teacher">${esc(R().prof.nom)}</span></a>
      ${avatarP(R().prof.nom, "lg ph")}
    </div>
    <div class="body"><span class="muted">Connecte-toi pour ouvrir ce cours.</span></div>
  </article>`;
}
const blocOutils = () => R().outils.map(g => `<section class="theme" style="--c:var(--${esc(g.couleur)})"><div class="themehead"><h2>${esc(g.matiere)}</h2></div>${g.liens.map(([n, d, u]) => `<div class="work"><a class="workrow" href="${esc(u)}" target="_blank" rel="noopener" style="padding:10px 8px;gap:16px"><span class="ico pale">${icon("links", "")}</span><span class="tt">${esc(n)}<br><small class="muted" style="font-weight:400">${esc(d)}</small></span><span class="muted">↗</span></a></div>`).join("")}</section>`).join("");
function vPublic(r){
  if (r.v === "simulations" || r.v === "physique") return VUES_PRO[r.v]().replace('<div class="homehead"><h1>', `<div class="homehead"><a class="linkbtn" href="#/">${icon("left")} Accueil</a></div><div class="homehead"><h1>`);
  if (r.v === "outils") return `<div class="page"><div class="homehead"><h1 style="font-size:1.6rem">Boîte à outils</h1><span style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><a class="linkbtn" href="#/">${icon("left")} Accueil</a>${btnConnexion("Se connecter avec Microsoft 365")}</span></div>${blocOutils()}${pageFoot()}</div>`;
  return `<div class="page wide home">
    <section class="pubhero">
      <div><h1>Bienvenue sur l'espace de cours de M. ${esc(R().prof.nom)}</h1>
      <p class="muted">Cours, documents, devoirs et ressources de Physique-Chimie, SNT (Sciences Numériques et Technologie), SI (Sciences de l'Ingénieur), et Technologie. Connecte-toi avec ton compte Microsoft 365 du lycée (@${esc(CFG.domaine)}) pour accéder à tes cours.</p></div>
      <button class="btn pubbig pubm365" data-act="pubconnect"><img src="logo-m365-carre.png" alt="" width="26" height="26"> Se connecter avec Microsoft 365</button>
    </section>
    <nav class="pubres"><a href="#/simulations">${icon("atom")}<span><b>Simulations</b><small>Toutes les simulations PhET du programme, à côté de la page</small></span></a><a href="#/physique">${icon("ruler")}<span><b>Outils Scientifiques Importants</b><small>Unités, éléments, formules, chimie, SNT, SI…</small></span></a><a href="#/outils">${icon("tools")}<span><b>Boîte à outils</b><small>Les sites utiles par matière</small></span></a></nav>
    ${blocScientifique()}
    ${blocDecouvertes()}
    <section class="homepanel"><div class="homehead"><h1>Boîte à outils</h1><a class="linkbtn" href="#/outils">Tout voir ${icon("ext")}</a></div><div class="puboutils">${blocOutils()}</div></section>
    ${pageFoot()}</div>`;
}
function renderPublic(){
  const r = route();
  if (!ROUTES_PUBLIQUES.includes(r.v)) { demanderConnexion(location.hash); return; }
  app.innerHTML = topbarPublic() + `<div class="shell pubshell"><main class="content">${vPublic(r)}</main></div>`;
  const pg = app.querySelector("main.content > .page"); if (pg) pg.insertAdjacentHTML("afterbegin", pageHead());
  document.title = (r.v === "outils" ? "Boîte à outils · " : "") + "PhysiquePro";
}
/* page protégée demandée sans être connecté : on garde l'adresse pour y revenir après la connexion */
function demanderConnexion(suite){
  try { if (suite && suite !== "#/" && suite !== "#") localStorage.setItem("pp_next", suite); } catch (_) {}
  vLogin("Connecte-toi avec ton compte Microsoft 365 du lycée pour ouvrir cette page.", true);
}
/* ---------- Message urgent (élève → prof) et Messagerie d'urgence (prof) ---------- */
IC.urgent = '<path d="M12 3l9.5 16.5h-19z"/><path d="M12 10v4.5M12 17.2v.1"/>';
const nomProfCourt = () => { const w = String(R().prof.nom || "").trim().split(/\s+/); const up = w.filter(x => x.length > 1 && x === x.toUpperCase()); return "M.\u00a0" + (up.length ? up.join(" ") : w[w.length - 1] || ""); };
async function chargerUrgents(){
  try { const r = await sb.from("messages_urgents").select("*").order("cree_le", { ascending: false }).limit(300); S.urgents = r.error ? (S.urgents || []) : r.data; }
  catch (_) { S.urgents = S.urgents || []; }
  if (S.user) signalerNouveautes();
  const n = nbUrgents(), b = document.querySelector(".urgbtn .badge"), btn = document.querySelector(".urgbtn");
  if (btn) { if (b && !n) b.remove(); else if (b) b.textContent = n > 99 ? "99+" : n; else if (n) btn.insertAdjacentHTML("beforeend", `<span class="badge">${n > 99 ? "99+" : n}</span>`); }
}
const nbUrgents = () => S.prof ? (S.urgents || []).filter(m => !m.lu && !m.de_prof).length : 0;
/* icône de la barre du haut (prof) */
const boutonUrgences = () => S.prof ? `<a class="ib urgbtn" href="#/urgences" title="Messagerie d'urgence" aria-label="Messagerie d'urgence${nbUrgents() ? " (" + nbUrgents() + " non lus)" : ""}">${icon("urgent")}${nbUrgents() ? `<span class="badge">${nbUrgents() > 99 ? "99+" : nbUrgents()}</span>` : ""}</a>` : "";
/* onglet élève, à côté de « Mes notes » */
/* réponses du prof pas encore vues par l'élève (mémorisé sur son appareil) */
const cleVuUrg = () => "pp_urg_vu_" + (S.user && S.user.id);
const reponsesNonVues = cid => { if (S.prof) return 0; let vu = ""; try { vu = localStorage.getItem(cleVuUrg()) || ""; } catch (_) {}
  return (S.urgents || []).filter(m => (!cid || m.classe_id === cid) && ((m.de_prof && !m.lu) || (!m.de_prof && m.reponse && m.repondu_le && m.repondu_le > vu))).length; };
/* l'élève ouvre la fenêtre : les messages du prof de ce cours passent à « lu » */
async function marquerMessagesProfLus(cid){ const L = (S.urgents || []).filter(m => m.de_prof && !m.lu && m.classe_id === cid); if (!L.length) return; L.forEach(m => m.lu = true); try { await sb.rpc("pp_urgent_lu", { p_classe: cid }); } catch (_) {} }
const marquerReponsesVues = () => { const d = (S.urgents || []).map(m => m.repondu_le || "").sort().pop(); if (d) try { localStorage.setItem(cleVuUrg(), d); } catch (_) {} };
const supUrg = n => n ? `<sup class="urgsup" title="${n} nouvelle${n > 1 ? "s" : ""} réponse${n > 1 ? "s" : ""}">${n}</sup>` : "";
const ongletUrgent = c => { if (S.prof) return ""; const n = reponsesNonVues(c.id);
  return `<button role="tab" class="urgtab" data-act="urgent" data-c="${esc(c.id)}">${icon("urgent")}<span class="tl">Message urgent à ${esc(nomProfCourt())}${supUrg(n)}</span><span class="tc">Urgent${supUrg(n)}</span></button>`; };
function modalUrgent(m){
  const mes = (S.urgents || []).filter(x => x.classe_id === m.classe).slice(0, 5);
  return `<h2>${icon("urgent")} Message urgent à ${esc(nomProfCourt())}</h2>
    <p class="muted" style="margin:0;font-size:.88rem">Pour une question importante sur ce cours (absence le jour d'un devoir, problème pour rendre un travail…). ${esc(nomProfCourt())} reçoit ton message sur le site et te répond ici.</p>
    ${bandeauNotifs()}
    <div class="field"><label for="mUrg">Ton message</label><textarea id="mUrg" rows="5" maxlength="2000" placeholder="Écris ton message…" style="width:100%;resize:vertical">${esc(m.texte || "")}</textarea></div>
    ${mes.length ? `<div class="urgmine"><b style="font-size:.85rem">Tes derniers messages dans ce cours</b>${mes.map(x => x.de_prof ? `<div class="urgold deprof"><div><small class="muted">${fmtQuand(D(x.cree_le))} · <b>Message de ${esc(nomProfCourt())}</b></small><p>${linkify(x.texte)}</p></div></div>` : `<div class="urgold"><div><small class="muted">${fmtQuand(D(x.cree_le))} · ${x.reponse ? "Répondu" : x.lu ? "Lu par ton professeur" : "Envoyé"}</small><p>${linkify(x.texte)}</p></div>${x.reponse ? `<div class="urgrep"><small><b>Réponse de ${esc(nomProfCourt())}</b> · ${fmtQuand(D(x.repondu_le))}</small><p>${linkify(x.reponse)}</p></div>` : ""}</div>`).join("")}</div>` : ""}`;
}
async function envoyerUrgent(m){
  const t = ((document.getElementById("mUrg") || {}).value || "").trim();
  if (!t) throw new Error("Écris ton message avant d'envoyer.");
  const nom = S.nom || nomDepuisEmail(moi());
  const { data, error } = await sb.from("messages_urgents").insert({ classe_id: m.classe, eleve: S.user.id, eleve_email: moi(), eleve_nom: nom, texte: t }).select().single();
  if (error) throw error;
  S.urgents = [data, ...(S.urgents || [])];
}
/* page prof */
function vUrgences(){
  const L = S.urgents || [], filtre = S.urgF || "tous";
  const vus = L.filter(m => filtre === "tous" || (filtre === "nonlus" ? !m.lu && !m.de_prof : filtre === "envoyes" ? m.de_prof : filtre === "recus" ? !m.de_prof : m.classe_id === filtre));
  const carte = m => { const c = cls(m.classe_id);
    if (m.de_prof) return `<article class="urgcard envoye" style="--c:var(${C(c && c.couleur).c})">
      <header>${avatarP(R().prof.nom, "sm")}<div style="flex:1;min-width:0"><b>Envoyé à ${esc(m.eleve_nom || nomDepuisEmail(m.eleve_email))}</b><small class="muted">${esc(c ? c.nom : "Cours supprimé")} · ${fmtD(D(m.cree_le))} à ${fmtT(D(m.cree_le))}</small></div><span class="pill ${m.lu ? "ok" : ""}">${m.lu ? "Lu par l'élève" : "Pas encore lu"}</span></header>
      <p class="urgtxt">${linkify(m.texte)}</p>
      <div class="urgactions"><button class="btn ghost sm" data-act="urgecrire" data-c="${esc(m.classe_id)}" data-e="${esc(m.eleve)}">${icon("send")} Écrire à nouveau</button><button class="ib sm" data-act="urgsuppr" data-id="${m.id}" title="Supprimer" aria-label="Supprimer le message">${icon("trash")}</button></div></article>`;
    return `<article class="urgcard${m.lu ? "" : " nonlu"}" style="--c:var(${C(c && c.couleur).c})">
      <header>${avatarP(m.eleve_nom || m.eleve_email, "sm")}<div style="flex:1;min-width:0"><b>${esc(m.eleve_nom || nomDepuisEmail(m.eleve_email))}</b><small class="muted">${esc(c ? c.nom : "Cours supprimé")} · ${fmtD(D(m.cree_le))} à ${fmtT(D(m.cree_le))}</small></div>${m.lu ? "" : `<span class="pill bad">Non lu</span>`}</header>
      <p class="urgtxt">${linkify(m.texte)}</p>
      ${m.reponse ? `<div class="urgrep"><small><b>Ta réponse</b> · ${fmtQuand(D(m.repondu_le))}</small><p>${linkify(m.reponse)}</p></div>` : ""}
      ${S.urgRep === m.id ? `<div class="field"><textarea id="urgRep${m.id}" rows="3" placeholder="Ta réponse (l'élève la voit dans sa fenêtre « Message urgent »)" style="width:100%">${esc(m.reponse || "")}</textarea></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" data-act="urgsend" data-id="${m.id}">${icon("send")} Envoyer la réponse</button><button class="btn ghost sm" data-act="urgrep" data-id="">Annuler</button></div>`
      : `<div class="urgactions"><button class="btn tonal sm" data-act="urgrep" data-id="${m.id}">${icon("comment")} ${m.reponse ? "Modifier la réponse" : "Répondre"}</button>
        ${m.lu ? `<button class="btn ghost sm" data-act="urglu" data-id="${m.id}" data-on="0">Marquer non lu</button>` : `<button class="btn ghost sm" data-act="urglu" data-id="${m.id}" data-on="1">${icon("check")} Marquer comme lu</button>`}
        <a class="btn ghost sm" href="mailto:${esc(m.eleve_email)}?subject=${encodeURIComponent("Re : message urgent · " + (c ? c.nom : ""))}">${icon("mail")} E-mail</a>
        <button class="ib sm" data-act="urgsuppr" data-id="${m.id}" title="Supprimer" aria-label="Supprimer le message">${icon("trash")}</button></div>`}
    </article>`; };
  const nRec = L.filter(m => !m.de_prof).length, nEnv = L.filter(m => m.de_prof).length;
  return `<div class="page"><div class="homehead"><h1 style="font-size:1.6rem">${icon("urgent")} Messagerie d'urgence</h1>
      <span style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button class="btn danger" data-act="urgecrire">${icon("send")} Écrire à un élève</button>
      <select data-urgf="1" aria-label="Filtrer les messages"><option value="tous">Tous les messages (${L.length})</option><option value="nonlus" ${filtre === "nonlus" ? "selected" : ""}>Non lus (${nbUrgents()})</option><option value="recus" ${filtre === "recus" ? "selected" : ""}>Reçus des élèves (${nRec})</option><option value="envoyes" ${filtre === "envoyes" ? "selected" : ""}>Envoyés aux élèves (${nEnv})</option>${S.classes.map(c => `<option value="${esc(c.id)}" ${filtre === c.id ? "selected" : ""}>${esc(c.nom)}</option>`).join("")}</select></span></div>
    ${bandeauNotifs()}
    <p class="muted" style="margin:0">Les messages urgents de tes élèves et ceux que tu leur envoies. Un élève qui reçoit ton message voit une grande alerte au centre de son écran, sur n'importe quelle page du site.</p>
    ${vus.length ? `<div class="urglist">${vus.map(carte).join("")}</div>` : `<div class="emptystate"><b>Aucun message${filtre === "nonlus" ? " non lu" : ""}.</b><span>Quand un élève t'écrit, son message apparaît ici et « Messagerie d'urgence » affiche un chiffre rouge dans le menu de gauche.</span></div>`}
    ${pageFoot()}</div>`;
}
/* fenêtre « Écrire à un élève » */
function modalUrgProf(m){
  const act = actives(), cid = m.classe || (act[0] && act[0].id), comptes = new Map((S.comptes || []).map(p => [p.email, p]));
  const el = inscritsDe(cid).map(e => ({ ...e, p: comptes.get(e.email) })), avec = el.filter(e => e.p), sans = el.filter(e => !e.p);
  return `<h2>${icon("urgent")} Message d'urgence à un élève</h2>
    <div class="two"><div class="field"><label for="upCours">Cours</label><select id="upCours" data-urgc="1">${act.map(c => `<option value="${esc(c.id)}" ${c.id === cid ? "selected" : ""}>${esc(c.nom)}</option>`).join("")}</select></div>
      <div class="field"><label for="upEleve">Élève</label><select id="upEleve">${avec.length ? avec.map(e => `<option value="${esc(e.p.id)}" ${m.eleve === e.p.id ? "selected" : ""}>${esc(e.nom)}</option>`).join("") : `<option value="">Aucun élève connecté dans ce cours</option>`}</select></div></div>
    ${sans.length ? `<p class="muted" style="margin:0;font-size:.8rem">${sans.length} élève${sans.length > 1 ? "s" : ""} de ce cours ne ${sans.length > 1 ? "se sont" : "s'est"} jamais connecté${sans.length > 1 ? "s" : ""} au site : ${sans.length > 1 ? "ils" : "il"} ne peu${sans.length > 1 ? "vent" : "t"} pas encore recevoir de message.</p>` : ""}
    <div class="field"><label for="upTexte">Ton message</label><textarea id="upTexte" rows="5" maxlength="2000" style="width:100%;resize:vertical" placeholder="ex. Passe me voir à la récréation pour ton TP.">${esc(m.texte || "")}</textarea></div>
    <p class="muted" style="margin:0;font-size:.82rem">L'élève voit une grande alerte « MESSAGE D'URGENCE REÇU » au centre de son écran dès qu'il est sur le site, et peut te répondre par un message urgent.</p>`;
}
async function envoyerUrgProf(){
  const v = id => ((document.getElementById(id) || {}).value || "").trim();
  const cid = v("upCours"), uid = v("upEleve"), t = v("upTexte");
  if (!uid) throw new Error("Choisis un élève."); if (!t) throw new Error("Écris ton message.");
  const p = (S.comptes || []).find(x => x.id === uid), e = inscritsDe(cid).find(x => x.email === (p && p.email));
  const { data, error } = await sb.from("messages_urgents").insert({ classe_id: cid, eleve: uid, eleve_email: p.email, eleve_nom: (e && e.nom) || p.nom || nomDepuisEmail(p.email), texte: t, de_prof: true }).select().single();
  if (error) throw error;
  S.urgents = [data, ...(S.urgents || [])]; signalerNouveautes();
  return (e && e.nom) || p.email;
}

async function actionUrgence(act, a){
  const m = (S.urgents || []).find(x => String(x.id) === a.dataset.id);
  if (act === "urgrep") { S.urgRep = m ? m.id : null; render(); return; }
  if (!m) return;
  if (act === "urglu") { const on = a.dataset.on === "1"; const { error } = await sb.from("messages_urgents").update({ lu: on }).eq("id", m.id); if (error) return toast("Action impossible : " + error.message); m.lu = on; render(); return; }
  if (act === "urgsend") { const t = ((document.getElementById("urgRep" + m.id) || {}).value || "").trim(); if (!t) return toast("Écris ta réponse.");
    const patch = { reponse: t, repondu_le: now().toISOString(), lu: true }; const { error } = await sb.from("messages_urgents").update(patch).eq("id", m.id); if (error) return toast("Envoi impossible : " + error.message);
    Object.assign(m, patch); S.urgRep = null; toast("Réponse envoyée à " + (m.eleve_nom || m.eleve_email)); render(); return; }
  if (act === "urgsuppr") { const { error } = await sb.from("messages_urgents").delete().eq("id", m.id); if (error) return toast("Suppression impossible : " + error.message); S.urgents = S.urgents.filter(x => x !== m); toast("Message supprimé"); render(); return; }
}

/* ---------- notifications sur l'ordinateur (site ouvert, même en arrière-plan) ---------- */
const notifOk = () => typeof Notification !== "undefined" && Notification.permission === "granted";
const notifPossible = () => typeof Notification !== "undefined" && Notification.permission !== "denied";
const cleNotif = () => "pp_urg_notif_" + (S.user && S.user.id);
function clesUrgentes(){ return S.prof ? (S.urgents || []).filter(m => !m.lu && !m.de_prof).map(m => "m" + m.id)
  : [...(S.urgents || []).filter(m => !m.de_prof && m.reponse && m.repondu_le).map(m => "r" + m.id + "@" + m.repondu_le), ...(S.urgents || []).filter(m => m.de_prof).map(m => "p" + m.id)]; }
/* son : le navigateur n'autorise le son qu'après un premier clic sur la page → on « déverrouille » au premier clic */
let audioCtx = null;
const ouvrirAudio = () => { try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === "suspended") audioCtx.resume(); } catch (_) {} };
["pointerdown", "keydown"].forEach(ev => document.addEventListener(ev, ouvrirAudio, { capture: true, passive: true }));
function bip(){ try { ouvrirAudio(); const A = audioCtx; if (!A) return; const t = A.currentTime + .05;
  [[880, 0], [1320, .18], [880, .5], [1320, .68]].forEach(([f, d]) => { const o = A.createOscillator(), g = A.createGain(); o.frequency.value = f; o.type = "sine"; g.gain.setValueAtTime(.0001, t + d); g.gain.exponentialRampToValueAtTime(.35, t + d + .02); g.gain.exponentialRampToValueAtTime(.0001, t + d + .15); o.connect(g).connect(A.destination); o.start(t + d); o.stop(t + d + .16); });
  } catch (_) {} }
/* grande alerte au centre de l'écran (taille d'un paquet de cartes), sur n'importe quelle page du site */
function bandeauAlerte(titre, texte, ouvrir, qui, cours, entete){
  let ov = document.getElementById("urgCentre");
  if (!ov) { ov = document.createElement("div"); ov.id = "urgCentre"; ov.innerHTML = `<div class="ucbox" role="alertdialog" aria-modal="true" aria-labelledby="ucT"><div class="uchead">${icon("urgent")}<b id="ucT"></b></div><div class="ucbody"></div><div class="ucfoot"><button class="btn ghost" data-uc="fermer">Fermer</button><button class="btn danger" data-uc="ouvrir">Ouvrir</button></div></div>`; document.body.appendChild(ov);
    ov.addEventListener("click", e => { const b = e.target.closest("[data-uc]"); if (!b && e.target !== ov) return; const L = ov._file || []; ov.remove(); if (b && b.dataset.uc === "ouvrir" && L.length) L[L.length - 1].ouvrir(); }); }
  ov._file = [...(ov._file || []), { ouvrir }];
  ov.querySelector("#ucT").textContent = entete || (S.prof ? "MESSAGE D'URGENCE REÇU" : "RÉPONSE AU MESSAGE D'URGENCE REÇUE");
  const n = ov._file.length;
  ov.querySelector(".ucbody").innerHTML = `<p class="ucqui">${esc(qui)}</p>${cours ? `<p class="uccours">${esc(cours)}</p>` : ""}<p class="uctxt">${esc(texte.slice(0, 220))}</p>${n > 1 ? `<p class="ucplus">+ ${n - 1} autre${n > 2 ? "s" : ""} message${n > 2 ? "s" : ""}</p>` : ""}`;
  setTimeout(() => { const b = ov.querySelector('[data-uc="ouvrir"]'); if (b) b.focus(); }, 50);
}
/* titre de l'onglet qui clignote tant qu'on n'est pas revenu sur le site */
let clignoT = null;
function clignoter(msg){ clearInterval(clignoT); let on = false; const base = () => document.title.replace(/^⚠ .*? · /, "");
  clignoT = setInterval(() => { if (document.visibilityState === "visible" && document.hasFocus()) { clearInterval(clignoT); document.title = base(); titreAvecCompteur(); return; } on = !on; document.title = on ? "⚠ " + msg + " · " + base() : base(); }, 1000); }
function notifier(titre, texte, ouvrir){
  bip(); clignoter(S.prof ? "Message urgent" : "Réponse reçue"); bandeauAlerte(titre, arguments[5] || texte, ouvrir, arguments[3] || titre, arguments[4] || "", arguments[6]);
  if (!notifOk()) return;
  try { const n = new Notification(titre, { body: texte.slice(0, 180), icon: "icon-192.png", tag: "pp-urgent-" + Date.now(), requireInteraction: true });
    n.onclick = () => { window.focus(); ouvrir(); n.close(); }; } catch (_) {}
}
/* compare avec ce qui a déjà été signalé sur cet appareil ; la première fois, on mémorise sans sonner */
function signalerNouveautes(){
  let vus = null; try { vus = JSON.parse(localStorage.getItem(cleNotif()) || "null"); } catch (_) {}
  const cles = clesUrgentes();
  if (vus) {
    const nouv = cles.filter(k => !vus.includes(k));
    nouv.forEach(k => {
      const id = Number(k.slice(1).split("@")[0]), m = (S.urgents || []).find(x => x.id === id); if (!m) return;
      const c = cls(m.classe_id);
      if (S.prof) notifier("⚠ Message urgent · " + (m.eleve_nom || m.eleve_email), (c ? c.nom + " · " : "") + m.texte, () => go("/urgences"), "De : " + (m.eleve_nom || m.eleve_email), c ? c.nom : "", m.texte);
      else if (m.de_prof) notifier("Message d'urgence de " + nomProfCourt(), (c ? c.nom + " · " : "") + m.texte, () => { go("/classe/" + m.classe_id); setTimeout(() => { S.modal = { kind: "urgent", classe: m.classe_id }; marquerReponsesVues(); marquerMessagesProfLus(m.classe_id); render(); }, 400); }, "De : " + nomProfCourt(), c ? c.nom : "", m.texte, "MESSAGE D'URGENCE REÇU");
      else notifier("Réponse de " + nomProfCourt(), (c ? c.nom + " · " : "") + m.reponse, () => { go("/classe/" + m.classe_id); setTimeout(() => { S.modal = { kind: "urgent", classe: m.classe_id }; marquerReponsesVues(); render(); }, 400); }, "De : " + nomProfCourt(), c ? c.nom : "", m.reponse);
    });
    if (nouv.length && !S.modal && !S.ed && !(document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))) render();
  }
  try { localStorage.setItem(cleNotif(), JSON.stringify([...new Set([...(vus || []), ...cles])].slice(-400))); } catch (_) {}
  titreAvecCompteur();
}
const compteurUrgent = () => S.prof ? nbUrgents() : reponsesNonVues();
function titreAvecCompteur(){ const n = compteurUrgent(), t = document.title.replace(/^\(\d+\) /, ""); document.title = n ? "(" + n + ") " + t : t; }
async function demanderNotifs(){
  if (typeof Notification === "undefined") return toast("Ce navigateur ne gère pas les notifications.");
  const p = await Notification.requestPermission();
  if (p === "granted") { toast("Notifications activées sur cet ordinateur ✓"); notifier("PhysiquePro", S.prof ? "Tu seras prévenu ici à chaque message urgent d'un élève." : "Tu seras prévenu ici quand " + nomProfCourt() + " répond à ton message.", () => {}); }
  else toast("Notifications refusées. Tu peux les autoriser plus tard dans les réglages du navigateur (cadenas à gauche de l'adresse).");
  render();
}
const bandeauNotifs = () => notifOk() ? `<p class="muted" style="margin:0;font-size:.82rem">${icon("bell")} Notifications activées sur cet ordinateur : ${S.prof ? "tu es prévenu à chaque nouveau message" : "tu es prévenu quand ton professeur répond"}, tant que le site est ouvert dans un onglet.</p>`
  : notifPossible() ? `<div class="notifbar">${icon("bell")}<span>${S.prof ? "Sois prévenu sur cet ordinateur dès qu'un élève t'envoie un message urgent." : "Sois prévenu sur cet ordinateur dès que ton professeur te répond."}</span><button class="btn sm" data-act="notifon">Activer les notifications</button></div>`
  : `<p class="muted" style="margin:0;font-size:.82rem">${icon("bell")} Les notifications sont bloquées pour ce site : autorise-les dans les réglages du navigateur (cadenas à gauche de l'adresse).</p>`;
/* =====================================================================
   Nouveautés : préparateur · compétences · copies annotées et vocal ·
                alertes décrochage · rappels · rendez-vous
   ===================================================================== */
IC.flask = '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3"/><path d="M7.5 15h9"/>';
IC.rdv = '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/><path d="M9.5 15l2 2 3.5-4"/>';
IC.pen = '<path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 6l3 3"/>';
IC.mic = '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>';
IC.alerte = '<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.1"/>';
IC.print = '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>';

/* ---------------------------------------------------------------- 1. Préparateur */
const STATUT_DM = { brouillon: ["Brouillon", ""], envoyee: ["Envoyée", "info"], prete: ["Prête", "ok"] };
async function chargerDemandes(){ const r = await sb.from("demandes_materiel").select("*").order("date_tp", { ascending: false, nullsFirst: true }); S.demandes = r.error ? [] : r.data; return S.demandes; }
const emailPrep = () => (R().preparateur || "").trim();
function texteDemande(x){
  const c = cls(x.classe_id), d = x.date_tp ? D(x.date_tp) : null;
  return [`Bonjour,`, ``, `Voici ma demande de matériel pour le TP « ${x.titre} »${c ? " (" + c.nom + ")" : ""}.`, ``,
    `Date : ${d ? fmtD(d) + " à " + fmtT(d) : "à préciser"}`, `Salle : ${x.salle || "à préciser"}`, `Nombre de postes : ${x.postes || "à préciser"}`, ``,
    x.solutions.trim() ? `SOLUTIONS ET PRODUITS :\n${x.solutions.trim()}\n` : "", x.materiel.trim() ? `MATÉRIEL ET VERRERIE :\n${x.materiel.trim()}\n` : "",
    x.remarques.trim() ? `REMARQUES :\n${x.remarques.trim()}\n` : "", `Merci beaucoup,`, R().prof.nom].filter(l => l !== "").join("\n").replace(/\n{3,}/g, "\n\n");
}
function vPreparateur(){
  const L = S.demandes || [];
  const carte = x => { const c = cls(x.classe_id), st = STATUT_DM[x.statut] || STATUT_DM.brouillon, d = x.date_tp ? D(x.date_tp) : null;
    return `<article class="dmcard" style="--c:var(${C(c && c.couleur).c})"><header><div style="flex:1;min-width:0"><b>${esc(x.titre)}</b><small class="muted">${esc(c ? c.nom : "Sans cours")} · ${d ? fmtD(d) + " à " + fmtT(d) : "date à préciser"}${x.salle ? " · salle " + esc(x.salle) : ""}${x.postes ? " · " + x.postes + " postes" : ""}</small></div><span class="pill ${st[1]}">${st[0]}</span></header>
      ${x.solutions.trim() ? `<div class="dmbloc"><b>Solutions et produits</b><p>${esc(x.solutions)}</p></div>` : ""}${x.materiel.trim() ? `<div class="dmbloc"><b>Matériel et verrerie</b><p>${esc(x.materiel)}</p></div>` : ""}${x.remarques.trim() ? `<div class="dmbloc"><b>Remarques</b><p>${esc(x.remarques)}</p></div>` : ""}
      <div class="urgactions"><button class="btn sm" data-act="dmsend" data-id="${x.id}">${icon("send")} ${x.statut === "brouillon" ? "Envoyer au préparateur" : "Renvoyer"}</button>
        <button class="btn ghost sm" data-act="dmedit" data-id="${x.id}">${icon("edit")} Modifier</button>
        <button class="btn ghost sm" data-act="dmprint" data-id="${x.id}">${icon("print")} Imprimer</button>
        ${x.statut !== "prete" ? `<button class="btn ghost sm" data-act="dmstat" data-id="${x.id}" data-s="prete">${icon("check")} Matériel prêt</button>` : `<button class="btn ghost sm" data-act="dmstat" data-id="${x.id}" data-s="envoyee">Pas encore prêt</button>`}
        <button class="ib sm" data-act="dmsuppr" data-id="${x.id}" title="Supprimer" aria-label="Supprimer la demande">${icon("trash")}</button></div></article>`; };
  return `<div class="page"><div class="homehead"><h1 style="font-size:1.6rem">${icon("flask")} Demande de matériel au Préparateur de Labo</h1><button class="btn" data-act="dmnew">${icon("plus")} Nouvelle demande</button></div>
    <p class="muted" style="margin:0">Prépare la liste des solutions et du matériel pour chaque TP, puis envoie-la en un clic par Outlook à ${emailPrep() ? "<b>" + esc(emailPrep()) + "</b>" : "ton préparateur (son adresse te sera demandée la première fois)"}.${emailPrep() ? ` <button class="linkbtn" data-act="dmprep">Changer l'adresse</button>` : ""}</p>
    ${L.length ? `<div class="urglist">${L.map(carte).join("")}</div>` : `<div class="emptystate"><b>Aucune demande pour l'instant.</b><span>Crée ta première demande, ou ouvre un TP et clique sur « Demande au préparateur ».</span></div>`}${pageFoot()}</div>`;
}
function modalDemande(m){
  const x = m.x, dt = x.date_tp ? D(x.date_tp) : null;
  return `<h2>${icon("flask")} ${x.id ? "Modifier la demande" : "Demande au préparateur"}</h2>
    <div class="field"><label for="dmTitre">TP</label><input id="dmTitre" value="${esc(x.titre)}" placeholder="ex. TP 2 · Dosage par titrage"></div>
    <div class="two"><div class="field"><label for="dmCours">Cours</label><select id="dmCours"><option value="">—</option>${actives().map(c => `<option value="${esc(c.id)}" ${c.id === x.classe_id ? "selected" : ""}>${esc(c.nom)}</option>`).join("")}</select></div>
      <div class="field"><label for="dmPostes">Nombre de postes</label><input id="dmPostes" type="number" min="1" max="40" value="${x.postes || ""}" placeholder="ex. 8"></div></div>
    <div class="two"><div class="field"><label for="dmDate">Date du TP</label><input id="dmDate" type="date" value="${dt ? ymd(dt) : ""}"></div><div class="field"><label for="dmHeure">Heure</label><input id="dmHeure" type="time" value="${dt ? hm(dt) : ""}"></div></div>
    <div class="field"><label for="dmSalle">Salle</label><input id="dmSalle" value="${esc(x.salle)}" placeholder="ex. Labo 2"></div>
    <div class="field"><label for="dmSol">Solutions et produits <span class="muted">(une ligne par produit)</span></label><textarea id="dmSol" rows="4" placeholder="ex. Solution de soude 0,10 mol/L · 1 L\nPhénolphtaléine · 8 flacons">${esc(x.solutions)}</textarea></div>
    <div class="field"><label for="dmMat">Matériel et verrerie</label><textarea id="dmMat" rows="4" placeholder="ex. Burettes 25 mL × 8\nBéchers 100 mL × 16\nAgitateurs magnétiques × 8">${esc(x.materiel)}</textarea></div>
    <div class="field"><label for="dmRem">Remarques</label><textarea id="dmRem" rows="2" placeholder="ex. Préparer les solutions la veille.">${esc(x.remarques)}</textarea></div>
    ${!emailPrep() ? `<div class="field"><label for="dmPrep">Adresse e-mail du préparateur</label><input id="dmPrep" type="email" placeholder="prenom.nom@${esc(CFG.domaine)}"></div>` : ""}`;
}
async function enregistrerDemande(m, envoyer){
  const v = id => ((document.getElementById(id) || {}).value || "").trim();
  if (!v("dmTitre")) throw new Error("Donne un nom au TP.");
  const date = v("dmDate"), heure = v("dmHeure") || "08:00";
  const row = { titre: v("dmTitre"), classe_id: v("dmCours") || null, devoir_id: m.x.devoir_id || null, postes: v("dmPostes") ? Number(v("dmPostes")) : null,
    date_tp: date ? new Date(date + "T" + heure).toISOString() : null, salle: v("dmSalle"), solutions: v("dmSol"), materiel: v("dmMat"), remarques: v("dmRem") };
  if (document.getElementById("dmPrep") && v("dmPrep")) await sauverPrep(v("dmPrep"));
  const r = m.x.id ? await sb.from("demandes_materiel").update(row).eq("id", m.x.id).select().single() : await sb.from("demandes_materiel").insert(row).select().single();
  if (r.error) throw r.error;
  await chargerDemandes();
  if (envoyer) envoyerDemande(r.data);
  return r.data;
}
async function sauverPrep(email){
  const data = { ...reglagesData(), preparateur: email };
  const { error } = await sb.from("reglages").upsert({ id: 1, data, modifie_le: now().toISOString() }); if (error) throw error;
  appliquerReglages(data);
}
async function envoyerDemande(x){
  if (!emailPrep()) { S.modal = { kind: "prep", ensuite: x.id }; render(); return; }
  const d = x.date_tp ? D(x.date_tp) : null;
  window.open(outlookLink([emailPrep()], "Demande de matériel · " + x.titre + (d ? " · " + fmtShort(d) : ""), texteDemande(x)), "_blank", "noopener");
  if (x.statut === "brouillon") { await sb.from("demandes_materiel").update({ statut: "envoyee", envoye_le: now().toISOString() }).eq("id", x.id); await chargerDemandes(); render(); }
  toast("Outlook s'ouvre avec la demande : vérifie puis clique sur Envoyer.");
}
function imprimerDemande(x){
  const c = cls(x.classe_id), d = x.date_tp ? D(x.date_tp) : null, w = window.open("", "_blank"); if (!w) { toast("Autorise les fenêtres pop-up pour imprimer."); return; }
  const bloc = (t, s) => s.trim() ? `<h2>${t}</h2><ul>${s.trim().split(/\n+/).map(l => `<li>${esc(l)}</li>`).join("")}</ul>` : "";
  w.document.write(`<!doctype html><meta charset="utf-8"><title>Demande · ${esc(x.titre)}</title><style>body{font:15px/1.5 system-ui,sans-serif;max-width:720px;margin:32px auto;padding:0 20px;color:#111}h1{font-size:22px;margin:0}h2{font-size:15px;margin:18px 0 6px;border-bottom:1px solid #ccc;padding-bottom:3px}ul{margin:0;padding-left:20px}.m{color:#555}table{border-collapse:collapse;margin-top:10px}td{padding:3px 14px 3px 0}</style>
    <h1>Demande de matériel · ${esc(x.titre)}</h1><p class="m">${esc(R().prof.nom)} · ${esc(c ? c.nom : "")}</p><table><tr><td><b>Date</b></td><td>${d ? fmtD(d) + " à " + fmtT(d) : "à préciser"}</td></tr><tr><td><b>Salle</b></td><td>${esc(x.salle || "à préciser")}</td></tr><tr><td><b>Postes</b></td><td>${x.postes || "à préciser"}</td></tr></table>
    ${bloc("Solutions et produits", x.solutions)}${bloc("Matériel et verrerie", x.materiel)}${x.remarques.trim() ? `<h2>Remarques</h2><p>${esc(x.remarques).replace(/\n/g, "<br>")}</p>` : ""}<script>onload=()=>print()<\/script>`);
  w.document.close();
}
async function actionDemande(act, a){
  const x = (S.demandes || []).find(y => String(y.id) === a.dataset.id);
  if (act === "dmnew") { const d = a.dataset.d ? S.devoirs.find(y => String(y.id) === a.dataset.d) : null;
    S.modal = { kind: "demande", x: { titre: d ? d.titre : "", classe_id: d ? d.classe_id : (route().v === "classe" ? route().a : ""), devoir_id: d ? d.id : null, date_tp: d && d.date_limite ? d.date_limite : null, salle: "", postes: null, solutions: "", materiel: "", remarques: "" } }; render(); return; }
  if (act === "dmprep") { S.modal = { kind: "prep" }; render(); return; }
  if (!x) return;
  if (act === "dmedit") { S.modal = { kind: "demande", x: { ...x } }; render(); return; }
  if (act === "dmsend") return envoyerDemande(x);
  if (act === "dmprint") return imprimerDemande(x);
  if (act === "dmstat") { const { error } = await sb.from("demandes_materiel").update({ statut: a.dataset.s }).eq("id", x.id); if (error) return toast("Action impossible : " + error.message); x.statut = a.dataset.s; render(); return; }
  if (act === "dmsuppr") { S.modal = { kind: "confirm", action: "dmsuppr", id: x.id, titre: "Supprimer la demande « " + x.titre + " » ?", texte: "La demande disparaît de ta liste. Un e-mail déjà envoyé au préparateur n'est pas annulé.", ok: "Supprimer" }; render(); return; }
}

/* ---------------------------------------------------------------- 2. Compétences */
const COMP = [["APP", "S'approprier"], ["ANA", "Analyser – Raisonner"], ["REA", "Réaliser"], ["VAL", "Valider"], ["COM", "Communiquer"]];
const NIV = { A: "Très bonne maîtrise", B: "Maîtrise satisfaisante", C: "Maîtrise fragile", D: "Maîtrise insuffisante" };
const blocCompetences = cr => { const v = (cr && cr.competences) || {};
  return `<details class="compbloc" ${Object.keys(v).length ? "open" : ""}><summary><b>Compétences</b> <span class="muted">(facultatif · A très bonne maîtrise … D insuffisante)</span></summary><div class="comprow">${COMP.map(([k, l]) => `<label title="${esc(l)}"><span>${k}</span><select id="comp-${k}" aria-label="${esc(l)}"><option value="">–</option>${"ABCD".split("").map(n => `<option ${v[k] === n ? "selected" : ""}>${n}</option>`).join("")}</select></label>`).join("")}</div></details>`; };
const lireCompetences = () => { const o = {}; COMP.forEach(([k]) => { const x = (document.getElementById("comp-" + k) || {}).value; if (x) o[k] = x; }); return Object.keys(o).length ? o : null; };
const badgesCompetences = v => v && Object.keys(v).length ? `<div class="compbadges">${COMP.filter(([k]) => v[k]).map(([k, l]) => `<span class="cb n${v[k]}" title="${esc(l)} : ${NIV[v[k]]}"><b>${k}</b>${v[k]}</span>`).join("")}</div>` : "";
/* profil : niveau le plus fréquent (à égalité, le plus récent) */
function profilCompetences(cid, email){
  const L = S.devoirs.filter(d => d.classe_id === cid && !d.brouillon).map(d => { const r = renduDe(d, email), c = correctionDe(r); return c && c.publiee && c.competences ? { t: D(c.modifie_le || d.publie_le), v: c.competences } : null; }).filter(Boolean).sort((a, b) => a.t - b.t);
  const res = {}; COMP.forEach(([k]) => { const vals = L.map(x => x.v[k]).filter(Boolean); if (!vals.length) return; const n = {}; vals.forEach(x => n[x] = (n[x] || 0) + 1); const max = Math.max(...Object.values(n));
    res[k] = { niv: [...vals].reverse().find(x => n[x] === max), nb: vals.length, hist: vals }; });
  return res;
}
const tableCompetencesEleve = (cid, email) => { const p = profilCompetences(cid, email); if (!Object.keys(p).length) return "";
  return `<section class="edcard"><h2 style="font-size:1.1rem">Mes compétences</h2><p class="muted" style="margin:0;font-size:.85rem">Niveau le plus fréquent sur tes travaux corrigés (A très bonne maîtrise · B satisfaisante · C fragile · D insuffisante).</p>
    <div class="complist">${COMP.map(([k, l]) => p[k] ? `<div class="compl"><span class="cb n${p[k].niv}"><b>${k}</b>${p[k].niv}</span><span>${esc(l)}</span><span class="muted mono" title="Historique">${p[k].hist.join(" ")}</span></div>` : `<div class="compl"><span class="cb"><b>${k}</b>–</span><span>${esc(l)}</span><span class="muted">pas encore évaluée</span></div>`).join("")}</div></section>`; };
function tableCompetencesClasse(c){
  const el = inscritsDe(c.id); if (!el.length) return "";
  const lignes = el.map(e => ({ e, p: profilCompetences(c.id, e.email) })).filter(x => Object.keys(x.p).length);
  if (!lignes.length) return `<section class="edcard"><h2 style="font-size:1.1rem">Compétences</h2><p class="muted" style="margin:0">Aucune compétence évaluée dans ce cours. Quand tu notes un travail, ouvre « Compétences » sous la note pour cocher A, B, C ou D.</p></section>`;
  return `<section class="edcard"><h2 style="font-size:1.1rem">Compétences de la démarche scientifique</h2><p class="muted" style="margin:0;font-size:.85rem">Niveau le plus fréquent de chaque élève sur les travaux rendus.</p>
    <div class="tablewrap"><table class="admtable"><thead><tr><th class="first">Élève</th>${COMP.map(([k, l]) => `<th title="${esc(l)}">${k}</th>`).join("")}</tr></thead><tbody>
    ${lignes.map(({ e, p }) => `<tr><td class="first">${esc(e.nom)}</td>${COMP.map(([k]) => `<td>${p[k] ? `<span class="cb n${p[k].niv}" title="${p[k].hist.join(" ")}">${p[k].niv}</span>` : "–"}</td>`).join("")}</tr>`).join("")}</tbody></table></div></section>`;
}

/* ---------------------------------------------------------------- 3. Copies annotées et commentaire vocal */
async function chargerScript(url, test){ if (test()) return; await new Promise((ok, ko) => { const s = document.createElement("script"); s.src = url; s.onload = ok; s.onerror = () => ko(new Error("bibliothèque introuvable")); document.head.appendChild(s); }); }
const PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js", PDFJS_W = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js", JSPDF = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
/* déposer un fichier du prof pour l'élève : OneDrive (partagé avec l'élève et son binôme) ou, sinon, stockage du site */
async function deposerPourEleve(d, rd, nom, blob){
  if (odActif()) {
    const item = await odPut(cheminOD([OD_RACINE, ...dossierTravail(d.classe_id, d.theme_id, d.titre), "Travaux rendus", nom]), blob);
    const dest = [rd.auteur_email, rd.binome_email].filter(Boolean).map(email => ({ email }));
    await graph("/me/drive/items/" + item.id + "/invite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipients: dest, roles: ["read"], requireSignIn: true, sendInvitation: false }) });
    return { nom, od: { id: item.id, web: item.webUrl } };
  }
  const chemin = d.id + "/" + rd.auteur + "/prof-" + Date.now() + "-" + safeName(nom);
  const { error } = await sb.storage.from("rendus").upload(chemin, blob, { upsert: false, contentType: blob.type }); if (error) throw error;
  return { nom, chemin };
}
async function ajouterACorrection(rdId, champ, f){
  const cr = S.corrections.find(c => c.rendu_id === rdId), liste = [...((cr && cr[champ]) || []), f];
  const r = cr ? await sb.from("corrections").update({ [champ]: liste, modifie_le: now().toISOString() }).eq("rendu_id", rdId)
               : await sb.from("corrections").insert({ rendu_id: rdId, [champ]: liste, publiee: false });
  if (r.error) throw r.error;
  await rafraichir();
}
async function retirerDeCorrection(rdId, champ, i){
  const cr = S.corrections.find(c => c.rendu_id === rdId); if (!cr) return;
  const liste = (cr[champ] || []).filter((_, j) => j !== i);
  const { error } = await sb.from("corrections").update({ [champ]: liste }).eq("rendu_id", rdId); if (error) return toast("Action impossible : " + error.message);
  await rafraichir(); render();
}
const peutAnnoter = f => f && ["png", "jpg", "jpeg", "gif", "webp", "bmp", "pdf"].includes(extDe(f.nom));
/* éditeur d'annotation (fenêtre plein écran, hors du rendu de la page pour garder le dessin) */
const AN = { pages: [], outil: "stylo", couleur: "#d93025", hist: [] };
async function ouvrirAnnotation(){
  const V = S.viewer, d = S.devoirs.find(x => x.id === V.did), rd = renduDe(d, V.email), f = rd && (rd.fichiers || [])[V.fi || 0];
  if (!peutAnnoter(f)) return toast("Annotation possible sur les photos et les PDF.");
  const url = await urlRendu(f); if (!url) return toast("Fichier introuvable.");
  const ov = document.createElement("div"); ov.className = "annot"; ov.innerHTML = `<div class="anbar"><b>${icon("pen")} Annoter · ${esc(f.nom)}</b><span class="spacer"></span>
    <button class="btn sm on" data-o="stylo" style="--x:#d93025">${icon("pen")} Stylo rouge</button><button class="btn sm" data-o="vert" style="--x:#188038">Stylo vert</button><button class="btn sm" data-o="surligneur" style="--x:#fbbc04">Surligneur</button><button class="btn sm" data-o="texte">T Texte</button>
    <button class="btn ghost sm" data-o="annuler">↶ Annuler</button><button class="btn ghost sm" data-o="fermer">Fermer</button><button class="btn sm" data-o="enregistrer">${icon("send")} Enregistrer pour l'élève</button></div>
    <div class="anpages"><div class="vempty">Chargement…</div></div>`;
  document.body.appendChild(ov); document.body.style.overflow = "hidden";
  AN.pages = []; AN.hist = []; AN.outil = "stylo"; AN.couleur = "#d93025"; AN.ctx = { d, rd, f };
  const zone = ov.querySelector(".anpages");
  try {
    const fonds = [];
    if (extDe(f.nom) === "pdf") {
      await chargerScript(PDFJS, () => window.pdfjsLib); window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_W;
      const pdf = await window.pdfjsLib.getDocument({ url }).promise, n = Math.min(pdf.numPages, 15);
      for (let i = 1; i <= n; i++) { const p = await pdf.getPage(i), vp0 = p.getViewport({ scale: 1 }), vp = p.getViewport({ scale: Math.min(2, 1400 / vp0.width) });
        const c = document.createElement("canvas"); c.width = vp.width; c.height = vp.height; await p.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise; fonds.push(c); }
      if (pdf.numPages > 15) toast("Seules les 15 premières pages sont annotables.");
    } else {
      const img = await new Promise((ok, ko) => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => ok(i); i.onerror = () => ko(new Error("image illisible")); i.src = url; });
      const k = Math.min(1, 1600 / img.naturalWidth), c = document.createElement("canvas"); c.width = img.naturalWidth * k; c.height = img.naturalHeight * k; c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); fonds.push(c);
    }
    zone.innerHTML = "";
    fonds.forEach((fond, i) => { const w = document.createElement("div"); w.className = "anpage"; const des = document.createElement("canvas"); des.width = fond.width; des.height = fond.height; w.append(fond, des); zone.appendChild(w); AN.pages.push({ fond, des }); brancherDessin(des, i); });
  } catch (e) { zone.innerHTML = `<div class="vempty">Impossible d'ouvrir ce fichier pour l'annoter : ${esc(e.message || e)}</div>`; }
  ov.addEventListener("click", async ev => { const b = ev.target.closest("[data-o]"); if (!b) return; const o = b.dataset.o;
    if (["stylo", "vert", "surligneur", "texte"].includes(o)) { AN.outil = o === "vert" ? "stylo" : o; AN.couleur = o === "vert" ? "#188038" : o === "surligneur" ? "#fbbc04" : "#d93025"; ov.querySelectorAll("[data-o]").forEach(x => x.classList.toggle("on", x === b)); return; }
    if (o === "annuler") { const h = AN.hist.pop(); if (h) { const g = AN.pages[h.i].des.getContext("2d"); g.putImageData(h.img, 0, 0); } return; }
    if (o === "fermer") { if (AN.hist.length && !confirmerFermeture(ov)) return; fermerAnnotation(ov); return; }
    if (o === "enregistrer") { b.disabled = true; b.textContent = "Enregistrement…"; try { await enregistrerAnnotation(); fermerAnnotation(ov); toast("Copie corrigée enregistrée : l'élève la verra quand tu lui rendras le travail."); render(); } catch (e) { b.disabled = false; b.textContent = "Enregistrer pour l'élève"; toast("Enregistrement impossible : " + (e.message || e)); } }
  });
}
function confirmerFermeture(ov){ const bar = ov.querySelector(".anbar"); if (bar.dataset.sure) return true; bar.dataset.sure = "1"; toast("Tes annotations ne sont pas enregistrées : clique encore sur Fermer pour les abandonner."); return false; }
function fermerAnnotation(ov){ ov.remove(); document.body.style.overflow = ""; AN.pages = []; AN.hist = []; }
function brancherDessin(cv, i){
  const g = cv.getContext("2d"); let actif = false, x0 = 0, y0 = 0;
  const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height]; };
  cv.addEventListener("pointerdown", e => { e.preventDefault(); AN.hist.push({ i, img: g.getImageData(0, 0, cv.width, cv.height) }); if (AN.hist.length > 40) AN.hist.shift();
    const [x, y] = pos(e);
    if (AN.outil === "texte") { const t = prompt("Texte à écrire sur la copie :"); if (t) { g.globalCompositeOperation = "source-over"; g.globalAlpha = 1; g.fillStyle = "#d93025"; g.font = `bold ${Math.round(cv.width / 45)}px system-ui, sans-serif`; t.split("\n").forEach((l, k) => g.fillText(l, x, y + k * cv.width / 38)); } else AN.hist.pop(); return; }
    actif = true; x0 = x; y0 = y; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener("pointermove", e => { if (!actif) return; const [x, y] = pos(e); g.lineCap = g.lineJoin = "round";
    if (AN.outil === "surligneur") { g.globalCompositeOperation = "multiply"; g.globalAlpha = .35; g.lineWidth = cv.width / 55; } else { g.globalCompositeOperation = "source-over"; g.globalAlpha = 1; g.lineWidth = Math.max(2.5, cv.width / 450); }
    g.strokeStyle = AN.couleur; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x, y); g.stroke(); x0 = x; y0 = y; });
  const fin = () => { actif = false; }; cv.addEventListener("pointerup", fin); cv.addEventListener("pointercancel", fin);
}
async function enregistrerAnnotation(){
  const { d, rd, f } = AN.ctx; if (!AN.pages.length) throw new Error("rien à enregistrer");
  await chargerScript(JSPDF, () => window.jspdf);
  const fus = AN.pages.map(p => { const c = document.createElement("canvas"); c.width = p.fond.width; c.height = p.fond.height; const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(p.fond, 0, 0); g.drawImage(p.des, 0, 0); return c; });
  const p0 = fus[0], doc = new window.jspdf.jsPDF({ orientation: p0.width > p0.height ? "l" : "p", unit: "px", format: [p0.width, p0.height], compress: true });
  fus.forEach((c, i) => { if (i) doc.addPage([c.width, c.height], c.width > c.height ? "l" : "p"); doc.addImage(c.toDataURL("image/jpeg", .82), "JPEG", 0, 0, c.width, c.height); });
  const nom = nomOD(nomDe(d.classe_id, rd.auteur_email) + " - corrigé - " + f.nom.replace(/\.[^.]+$/, "")) + ".pdf";
  const fic = await deposerPourEleve(d, rd, nom, doc.output("blob"));
  await ajouterACorrection(rd.id, "annotations", fic);
}
/* commentaire vocal */
const VOC = { rec: null, morceaux: [], t0: 0, timer: null };
const blocVocal = (rd, cr) => { const A = (cr && cr.audio) || [], N = (cr && cr.annotations) || [];
  return `<div class="vocal"><b style="font-size:.9rem">Copie corrigée et commentaire vocal</b>
    ${N.map((x, i) => `<div class="pj">${icon("pen")} ${lienFichierProf(x)}<button class="ib sm" data-act="rmannot" data-id="${rd.id}" data-i="${i}" title="Retirer" aria-label="Retirer la copie corrigée">${icon("x")}</button></div>`).join("")}
    ${A.map((x, i) => `<div class="pj">${icon("mic")} ${lienFichierProf(x)}<button class="ib sm" data-act="rmaudio" data-id="${rd.id}" data-i="${i}" title="Retirer" aria-label="Retirer le commentaire vocal">${icon("x")}</button></div>`).join("")}
    <div style="display:flex;gap:8px;flex-wrap:wrap">${(rd.fichiers || []).some(peutAnnoter) ? `<button class="btn ghost sm" data-act="annoter" data-id="${rd.id}">${icon("pen")} Annoter la copie</button>` : ""}
      <button class="btn ghost sm vocbtn" data-act="vocal" data-id="${rd.id}">${icon("mic")} ${VOC.rec ? "Arrêter et enregistrer" : "Commentaire vocal"}</button><span class="muted vocinfo" style="font-size:.8rem;align-self:center"></span></div></div>`; };
const lienFichierProf = x => x.od ? `<a href="${esc(x.od.web)}" target="_blank" rel="noopener">${esc(x.nom)}</a>` : `<a href="#" data-act="dlfile" data-bucket="rendus" data-path="${esc(x.chemin)}" data-nom="${esc(x.nom)}">${esc(x.nom)}</a>`;
async function basculerVocal(a){
  const rd = S.rendus.find(r => String(r.id) === a.dataset.id), d = rd && S.devoirs.find(x => x.id === rd.devoir_id); if (!rd) return;
  if (VOC.rec) { VOC.rec.stop(); return; }
  if (!navigator.mediaDevices || !window.MediaRecorder) return toast("Ce navigateur ne permet pas d'enregistrer le son.");
  let flux; try { flux = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { return toast("Micro refusé : autorise le micro pour ce site dans le navigateur."); }
  const type = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find(t => MediaRecorder.isTypeSupported(t)) || "";
  VOC.morceaux = []; VOC.rec = new MediaRecorder(flux, type ? { mimeType: type } : undefined); VOC.t0 = Date.now();
  VOC.rec.ondataavailable = e => { if (e.data.size) VOC.morceaux.push(e.data); };
  VOC.rec.onstop = async () => { clearInterval(VOC.timer); flux.getTracks().forEach(t => t.stop()); const mt = VOC.rec.mimeType || "audio/webm"; VOC.rec = null; render();
    const blob = new Blob(VOC.morceaux, { type: mt }), ext = /mp4/.test(mt) ? "m4a" : "webm";
    if (blob.size < 2000) return toast("Enregistrement trop court.");
    try { toast("Envoi du commentaire vocal…"); const nom = nomOD(nomDe(d.classe_id, rd.auteur_email) + " - commentaire vocal - " + fmtShort(now()) + " " + hm(now()).replace(":", "h")) + "." + ext;
      await ajouterACorrection(rd.id, "audio", await deposerPourEleve(d, rd, nom, blob)); toast("Commentaire vocal enregistré : l'élève l'écoutera quand tu lui rendras le travail."); render(); }
    catch (e) { toast("Envoi impossible : " + (e.message || e)); } };
  VOC.rec.start(); render();
  VOC.timer = setInterval(() => { const s = Math.round((Date.now() - VOC.t0) / 1000), el = document.querySelector(".vocinfo"); if (el) el.textContent = "● " + s + " s / 120 s"; if (s >= 120 && VOC.rec) VOC.rec.stop(); }, 500);
}
const retourFichiers = c => { if (!c) return ""; const N = c.annotations || [], A = c.audio || []; if (!N.length && !A.length) return "";
  return `<div class="retour"><b>${icon("pen")} Retour de ${esc(R().prof.nom)}</b>${N.map(x => `<div class="pj">${icon("pen")} Copie corrigée : ${lienFichierProf(x)}</div>`).join("")}${A.map(x => `<div class="pj">${icon("mic")} Commentaire vocal : ${lienFichierProf(x)}</div>`).join("")}</div>`; };

/* ---------------------------------------------------------------- 4. Alertes décrochage */
function alertesEleves(){
  if (!S.prof) return [];
  const out = [], t = now(), compte = email => (S.comptes || []).find(p => p.email === email);
  actives().forEach(c => {
    const dv = S.devoirs.filter(d => d.classe_id === c.id && !d.brouillon && D(d.publie_le) <= t);
    const nbFini = dv.filter(d => d.date_limite && D(d.date_limite) < t).length;
    inscritsDe(c.id).forEach(e => {
      const raisons = [];
      const fermes = dv.filter(d => (!d.eleves || d.eleves.includes(e.email)) && d.date_limite && D(d.date_limite) < t).sort((a, b) => D(b.date_limite) - D(a.date_limite));
      let suite = 0; for (const d of fermes) { if (renduDe(d, e.email)) break; suite++; }
      if (suite >= 3) raisons.push({ k: "bad", t: suite + " travaux manquants de suite" });
      const notes = dv.map(d => { const r = renduDe(d, e.email), cr = correctionDe(r); return cr && cr.publiee && cr.note != null && d.points ? { t: D(d.date_limite || d.publie_le), n: cr.note / d.points * 20 } : null; }).filter(Boolean).sort((a, b) => a.t - b.t);
      if (notes.length >= 5) { const fin = notes.slice(-3), deb = notes.slice(0, -3), m = l => l.reduce((s, x) => s + x.n, 0) / l.length; const ecart = m(deb) - m(fin);
        if (ecart >= 4) raisons.push({ k: "", t: "moyenne en baisse de " + fmtNote(arrondi1(ecart)) + " pts (" + fmtNote(arrondi1(m(fin))) + "/20 sur les 3 derniers)" }); }
      const p = compte(e.email), vu = p && p.derniere_visite ? D(p.derniere_visite) : null;
      if (!p && nbFini) raisons.push({ k: "", t: "ne s'est jamais connecté" });
      else if (p && vu && t - vu > 14 * 864e5) raisons.push({ k: "", t: "pas venu sur le site depuis " + Math.floor((t - vu) / 864e5) + " jours" });
      if (raisons.length) out.push({ c, e, raisons });
    });
  });
  return out;
}
function blocAlertes(complet){
  const L = alertesEleves(); if (!L.length) return complet ? `<section class="alertes ok"><b>${icon("check")} Aucun élève à surveiller pour l'instant.</b></section>` : "";
  const ouvert = complet || S.alertesOuv;
  return `<section class="alertes"><div class="recenthead"><h2>${icon("alerte")} Élèves à surveiller <span class="pill bad">${L.length}</span></h2>${complet ? "" : `<button class="ib" data-act="alertesouv" aria-expanded="${!!ouvert}" title="${ouvert ? "Réduire" : "Afficher"}">${icon(ouvert ? "up" : "expand")}</button>`}</div>
    ${ouvert ? `<div class="alist">${L.map(x => `<div class="arow"><span class="ini" style="--bb:var(${C(x.c.couleur).b})">${esc((x.c.symbole || x.c.nom).slice(0, 3))}</span><div style="flex:1;min-width:0"><b>${esc(x.e.nom)}</b> <small class="muted">${esc(x.c.nom)}</small><div class="chips">${x.raisons.map(r => `<span class="pill ${r.k}">${esc(r.t)}</span>`).join("")}</div></div>
      <a class="btn ghost sm" href="${esc(outlookLink([x.e.email], "Suivi · " + x.c.nom, "Bonjour " + x.e.nom.split(" ")[0] + ",\n\n"))}" target="_blank" rel="noopener">${icon("mail")} Écrire</a></div>`).join("")}</div>
      <p class="muted" style="margin:0;font-size:.8rem">Repérés automatiquement : 3 travaux manquants de suite, baisse de moyenne d'au moins 4 points, ou plus de 14 jours sans venir sur le site.</p>` : ""}</section>`;
}

/* ---------------------------------------------------------------- 5. Rappels avant échéance */
function blocRappels(){
  const t = now();
  if (!S.prof) {
    const L = S.devoirs.filter(d => d.date_limite && !d.brouillon && cls(d.classe_id) && !cls(d.classe_id).archive && D(d.date_limite) > t && D(d.date_limite) - t < 864e5 * 1.5 && etat(d, moi()).t === "Attribué").sort((a, b) => D(a.date_limite) - D(b.date_limite));
    if (!L.length) return "";
    return `<section class="rappel">${icon("alerte")}<div><b>À rendre bientôt</b>${L.map(d => `<a href="#/devoir/${d.id}"><b>${esc(d.titre)}</b> · ${esc(cls(d.classe_id).nom)} · ${dueTxt(D(d.date_limite)).replace("Échéance : ", "")}</a>`).join("")}</div></section>`;
  }
  const L = S.devoirs.filter(d => d.date_limite && !d.brouillon && cls(d.classe_id) && !cls(d.classe_id).archive && Math.abs(D(d.date_limite) - t) < 864e5 * 1.5)
    .map(d => ({ d, manq: elevesDuDevoir(d, inscritsDe(d.classe_id)).filter(e => !renduDe(d, e.email)) })).filter(x => x.manq.length).sort((a, b) => D(a.d.date_limite) - D(b.d.date_limite));
  if (!L.length) return "";
  return `<section class="rappel prof">${icon("alerte")}<div style="flex:1;min-width:0"><b>Retardataires · échéances d'hier, d'aujourd'hui et de demain</b>
    ${L.map(x => { const passe = D(x.d.date_limite) < t; return `<div class="rrow"><a href="#/devoir/${x.d.id}"><b>${esc(x.d.titre)}</b> · ${esc(cls(x.d.classe_id).nom)} · ${passe ? "fermé " : ""}${dueTxt(D(x.d.date_limite)).replace("Échéance : ", "")}</a>
      <span class="muted">${x.manq.length} élève${x.manq.length > 1 ? "s" : ""} sans rendu</span>
      <a class="btn ghost sm" href="${esc(outlookLink(x.manq.map(e => e.email), (passe ? "Travail non rendu : " : "Rappel : à rendre ") + x.d.titre, "Bonjour,\n\n" + (passe ? "Je n'ai pas reçu ton travail « " + x.d.titre + " ». Merci de me le rendre au plus vite sur PhysiquePro." : "Petit rappel : le travail « " + x.d.titre + " » est à rendre " + dueTxt(D(x.d.date_limite)).replace("Échéance : ", "").toLowerCase() + " sur PhysiquePro.") + "\n\n" + R().prof.nom))}" target="_blank" rel="noopener">${icon("mail")} Relancer</a></div>`; }).join("")}</div></section>`;
}

/* ---------------------------------------------------------------- 6. Rendez-vous */
async function chargerRdv(){
  const [s, c, r, p] = await Promise.all([sb.from("rdv_series").select("*").order("cree_le", { ascending: false }), sb.from("rdv_creneaux").select("*").order("debut"), sb.from("rdv_reservations").select("*"), sb.rpc("pp_places")]);
  S.rdv = { series: s.error ? [] : s.data, creneaux: c.error ? [] : c.data, resa: r.error ? [] : r.data, places: {} };
  (p.data || []).forEach(x => S.rdv.places[x.creneau_id] = x.pris);
  S.rdvOk = !s.error;
}
function vRendezVous(){
  const R0 = S.rdv || { series: [], creneaux: [], resa: [], places: {} }, t = now();
  const series = R0.series.filter(s => cls(s.classe_id));
  const carte = s => { const c = cls(s.classe_id), cr = R0.creneaux.filter(x => x.serie_id === s.id), moiR = R0.resa.find(x => x.serie_id === s.id && x.eleve === (S.user && S.user.id));
    const jours = [...new Set(cr.map(x => ymd(D(x.debut))))];
    return `<article class="rdvcard" style="--c:var(${C(c.couleur).c})"><header><div style="flex:1;min-width:0"><b>${esc(s.titre)}</b><small class="muted">${esc(c.nom)}${s.lieu ? " · " + esc(s.lieu) : ""}</small></div>
        ${S.prof ? `<button class="ib sm" data-act="rdvsuppr" data-id="${s.id}" title="Supprimer" aria-label="Supprimer ces rendez-vous">${icon("trash")}</button>` : moiR ? `<span class="pill ok">Inscrit</span>` : ""}</header>
      ${s.consigne ? `<p style="margin:0">${linkify(s.consigne)}</p>` : ""}
      ${!S.prof && moiR ? (() => { const x = cr.find(y => y.id === moiR.creneau_id); return x ? `<div class="monrdv">${icon("rdv")} Ton rendez-vous : <b>${fmtD(D(x.debut))} à ${fmtT(D(x.debut))}</b>${D(x.debut) > t ? ` <button class="linkbtn" data-act="rdvannule" data-id="${s.id}">Annuler</button>` : ""}</div>` : ""; })() : ""}
      ${jours.map(j => `<div class="rdvjour"><b>${fmtD(new Date(j + "T12:00"))}</b><div class="slots">${cr.filter(x => ymd(D(x.debut)) === j).map(x => {
        const pris = S.prof ? R0.resa.filter(y => y.creneau_id === x.id).length : (R0.places[x.id] || 0), plein = pris >= x.capacite, mien = moiR && moiR.creneau_id === x.id, passe = D(x.debut) <= t;
        if (S.prof) { const noms = R0.resa.filter(y => y.creneau_id === x.id); return `<div class="slot prof ${noms.length ? "pris" : ""}"><span class="mono">${fmtT(D(x.debut))}</span>${noms.length ? noms.map(y => `<span class="snom">${esc(y.eleve_nom || y.eleve_email)}<button class="ib sm" data-act="rdvretire" data-c="${x.id}" data-e="${esc(y.eleve)}" title="Retirer" aria-label="Retirer ${esc(y.eleve_nom)}">${icon("x")}</button></span>`).join("") : `<span class="muted">libre</span>`}${x.capacite > 1 ? `<small class="muted">${noms.length}/${x.capacite}</small>` : ""}</div>`; }
        return `<button class="slot ${mien ? "mien" : ""}" data-act="rdvresa" data-id="${x.id}" ${plein && !mien || passe ? "disabled" : ""}><span class="mono">${fmtT(D(x.debut))}</span><small>${mien ? "ton créneau" : passe ? "passé" : plein ? "complet" : x.capacite > 1 ? (x.capacite - pris) + " place(s)" : "libre"}</small></button>`; }).join("")}</div></div>`).join("")}
      ${S.prof ? `<p class="muted" style="margin:0;font-size:.82rem">${R0.resa.filter(y => y.serie_id === s.id).length} inscrit(s) sur ${inscritsDe(s.classe_id).length} élève(s) · ${cr.length} créneau(x)</p>` : ""}</article>`; };
  return `<div class="page"><div class="homehead"><h1 style="font-size:1.6rem">${icon("rdv")} Rendez-vous</h1>${S.prof ? `<button class="btn" data-act="rdvnew">${icon("plus")} Proposer des créneaux</button>` : ""}</div>
    <p class="muted" style="margin:0">${S.prof ? "Passages d'oral, Grand Oral, soutien : crée des créneaux, chaque élève du cours choisit le sien. Tu vois ici qui est inscrit et quand." : "Choisis un créneau libre pour chaque rendez-vous proposé par ton professeur. Tu peux changer ou annuler tant que le créneau n'est pas passé."}</p>
    ${!S.rdvOk ? `<div class="notice">Les rendez-vous ne sont pas encore activés.</div>` : series.length ? `<div class="urglist">${series.map(carte).join("")}</div>` : `<div class="emptystate"><b>Aucun rendez-vous proposé${S.prof ? "" : " pour l'instant"}.</b></div>`}${pageFoot()}</div>`;
}
function modalRdv(){
  const d = new Date(now()); d.setDate(d.getDate() + 1);
  return `<h2>${icon("rdv")} Proposer des créneaux</h2>
    <div class="field"><label for="rvTitre">Titre</label><input id="rvTitre" placeholder="ex. Passage d'oral · projet SI"></div>
    <div class="two"><div class="field"><label for="rvCours">Cours</label><select id="rvCours">${actives().map(c => `<option value="${esc(c.id)}" ${route().v === "classe" && route().a === c.id ? "selected" : ""}>${esc(c.nom)}</option>`).join("")}</select></div>
      <div class="field"><label for="rvLieu">Lieu</label><input id="rvLieu" placeholder="ex. Salle B12 ou Teams"></div></div>
    <div class="two"><div class="field"><label for="rvDate">Jour</label><input id="rvDate" type="date" value="${ymd(d)}"></div><div class="field"><label for="rvDuree">Durée d'un créneau (min)</label><input id="rvDuree" type="number" min="5" max="240" value="15"></div></div>
    <div class="two"><div class="field"><label for="rvDe">De</label><input id="rvDe" type="time" value="13:00"></div><div class="field"><label for="rvA">À</label><input id="rvA" type="time" value="15:00"></div></div>
    <div class="two"><div class="field"><label for="rvCap">Élèves par créneau</label><input id="rvCap" type="number" min="1" max="40" value="1"></div><div class="field"><label for="rvPause">Pause entre deux (min)</label><input id="rvPause" type="number" min="0" max="60" value="0"></div></div>
    <div class="field"><label for="rvCons">Consigne <span class="muted">(facultatif)</span></label><textarea id="rvCons" rows="2" placeholder="ex. Apporte ta présentation sur clé USB."></textarea></div>
    <p class="muted" style="margin:0;font-size:.82rem">Tu pourras ajouter d'autres jours en recréant des créneaux avec le même titre.</p>`;
}
async function creerRdv(){
  const v = id => ((document.getElementById(id) || {}).value || "").trim();
  const titre = v("rvTitre"), cid = v("rvCours"), jour = v("rvDate"), dur = Number(v("rvDuree")), pause = Number(v("rvPause") || 0), cap = Number(v("rvCap") || 1);
  if (!titre) throw new Error("Donne un titre."); if (!jour || !v("rvDe") || !v("rvA")) throw new Error("Choisis le jour et les heures.");
  if (!(dur >= 5)) throw new Error("Durée d'un créneau : au moins 5 minutes.");
  const deb = new Date(jour + "T" + v("rvDe")), fin = new Date(jour + "T" + v("rvA")); if (fin <= deb) throw new Error("L'heure de fin doit être après l'heure de début.");
  const cr = []; for (let x = new Date(deb); +x + dur * 6e4 <= +fin; x = new Date(+x + (dur + pause) * 6e4)) cr.push({ debut: x.toISOString(), fin: new Date(+x + dur * 6e4).toISOString(), capacite: cap });
  if (!cr.length) throw new Error("Aucun créneau ne tient dans cet horaire."); if (cr.length > 80) throw new Error("Trop de créneaux (80 maximum) : réduis l'horaire ou allonge la durée.");
  let s = (S.rdv && S.rdv.series || []).find(x => x.titre === titre && x.classe_id === cid);
  if (!s) { const r = await sb.from("rdv_series").insert({ titre, classe_id: cid, lieu: v("rvLieu"), consigne: v("rvCons") }).select().single(); if (r.error) throw r.error; s = r.data; }
  const r2 = await sb.from("rdv_creneaux").insert(cr.map(x => ({ ...x, serie_id: s.id }))); if (r2.error) throw r2.error;
  await chargerRdv(); return cr.length;
}
async function actionRdv(act, a){
  if (act === "rdvnew") { S.modal = { kind: "rdv" }; render(); return; }
  if (act === "rdvresa") { const { error } = await sb.rpc("pp_reserver", { p_creneau: Number(a.dataset.id) }); if (error) { toast(error.message); await chargerRdv(); render(); return; } await chargerRdv(); render(); toast("Créneau réservé ✓"); return; }
  if (act === "rdvannule") { const { error } = await sb.rpc("pp_annuler_rdv", { p_serie: Number(a.dataset.id) }); if (error) return toast(error.message); await chargerRdv(); render(); toast("Rendez-vous annulé"); return; }
  if (act === "rdvretire") { const { error } = await sb.from("rdv_reservations").delete().eq("creneau_id", Number(a.dataset.c)).eq("eleve", a.dataset.e); if (error) return toast(error.message); await chargerRdv(); render(); return; }
  if (act === "rdvsuppr") { const s = S.rdv.series.find(x => String(x.id) === a.dataset.id); S.modal = { kind: "confirm", action: "rdvsuppr", id: s.id, titre: "Supprimer « " + s.titre + " » ?", texte: "Tous les créneaux et les inscriptions des élèves sont supprimés.", ok: "Supprimer" }; render(); return; }
}
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
      ${o.remplacer && S.prof ? `<label class="ib sm" title="Remplacer le fichier Excel" aria-label="Remplacer le fichier Excel" style="cursor:pointer">${icon("upload")}<input type="file" accept=".xlsx,.xls" data-calfile="1" hidden></label>` : ""}
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
document.addEventListener("click", e => { const a = e.target.closest && e.target.closest("a.qside"); if (!a || a.dataset.cle === "logo-calendrier" || e.ctrlKey || e.metaKey || e.shiftKey || e.button) return;
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
/* =====================================================================
   PhysiquePro · améliorations « pro » (barre d'applications, recherche,
   tableau de bord, semaine, correction rapide, thème, etc.)
   ===================================================================== */

/* ---------- #2 Barre du haut : favoris + lanceur « Applications » ---------- */
IC.apps = '<circle cx="5" cy="5" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="12" cy="19" r="2"/><circle cx="19" cy="19" r="2"/>';
IC.star = '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>';
const FAVORIS_DEFAUT = ["Pronote Verdun", "Lycée Verdun", "WhatsApp Web", "E-mail Outlook", "OneDrive", "NumWorks"];
const FAVORIS_MAX = 24;
const cleFavoris = () => "pp_favoris3_" + (S.user && S.user.id);
const liensVisibles = () => R().liensUtiles.filter(l => l.nom && (!l.prof || S.prof));
function favorisNoms(){
  let f = null; try { f = JSON.parse(localStorage.getItem(cleFavoris()) || "null"); } catch (_) {}
  const noms = liensVisibles().map(l => l.nom);
  if (!Array.isArray(f)) f = noms.slice(0, FAVORIS_MAX);
  return f.filter(n => noms.includes(n));
}
const liensFavoris = () => { const f = favorisNoms(); return liensVisibles().filter(l => f.includes(l.nom)); };
function basculerFavori(nom){
  let f = favorisNoms();
  if (f.includes(nom)) f = f.filter(n => n !== nom);
  else { if (f.length >= FAVORIS_MAX) { toast(`${FAVORIS_MAX} favoris au maximum : retire d'abord une étoile.`); return; } f.push(nom); }
  try { localStorage.setItem(cleFavoris(), JSON.stringify(f)); } catch (_) {}
}
const classesLien = l => `${l.principal ? "main" : ""}${l.prof ? " qprof" : ""}${l.ordi ? " qordi" : ""}${COTE_A_COTE[l.icone] ? " qside" + (SP.cle === l.icone ? " on" : "") : ""}`;
const lienRapide = l => `<a href="${esc(l.url)}" target="_blank" rel="noopener" class="${classesLien(l)}" data-cle="${esc(l.icone || "")}" style="--q:${esc(l.couleur)}" title="${esc(l.nom)}"><span class="qi">${quickIcon(l.icone)}</span><span class="ql">${esc(l.nom)}</span></a>`;
function lanceurApps(){
  const L = liensVisibles(), f = favorisNoms();
  return `<div class="dd apps"><button class="ib appsbtn" data-act="apps" title="Toutes les applications" aria-label="Toutes les applications" aria-expanded="${!!S.apps}">${icon("apps")}</button>
    ${S.apps ? `<div class="dd-menu appsmenu" role="menu"><div class="appstete"><b>Applications</b><small>★ = affichée dans la barre du haut</small></div>
      <div class="appsgrille">${L.map(l => `<div class="apptuile${f.includes(l.nom) ? " fav" : ""}"><a href="${esc(l.url)}" target="_blank" rel="noopener" class="${classesLien(l).replace("qordi", "")}" data-cle="${esc(l.icone || "")}" style="--q:${esc(l.couleur)}"><span class="qi">${quickIcon(l.icone)}</span><span class="ql">${esc(l.nom)}</span></a>
        <button class="appetoile" data-act="favori" data-nom="${esc(l.nom)}" title="${f.includes(l.nom) ? "Retirer de la barre du haut" : "Afficher dans la barre du haut"}" aria-label="${f.includes(l.nom) ? "Retirer " : "Ajouter "}${esc(l.nom)} ${f.includes(l.nom) ? "de" : "à"} la barre du haut" aria-pressed="${f.includes(l.nom)}">${icon("star")}</button></div>`).join("")}</div></div>` : ""}</div>`;
}
document.addEventListener("click", e => { if (e.target.closest && e.target.closest(".appsmenu a")) setTimeout(() => { if (S.apps) { S.apps = false; render(); } }, 50); });

/* ---------- #8 Tableau de bord (accueil) ---------- */
IC.search = '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>';
IC.flask = IC.flask || '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3"/>';
IC.week = '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M7 14h2M11 14h2M15 14h2M7 17h2M11 17h2"/>';
const premierPrenom = () => { const n = String(S.nom || "").trim().split(/\s+/); const p = n.find(x => x !== x.toUpperCase()) || n[0] || ""; return p; };
const salut = () => { const h = now().getHours(); return h < 5 ? "Bonne nuit" : h < 18 ? "Bonjour" : "Bonsoir"; };
let tdbCharge = false;
function chargerPourTableau(){
  sauvegardeAuto();
  if (tdbCharge) return; tdbCharge = true;
  const L = [];
  if (!S.rdv && typeof chargerRdv === "function") L.push(chargerRdv().catch(() => {}));
  if (S.prof && !S.demandes && typeof chargerDemandes === "function") L.push(chargerDemandes().catch(() => {}));
  if (L.length) Promise.all(L).then(() => { if (route().v === "accueil" && !S.modal) render(); });
}
const tuile = (href, ic, n, lib, ton, sous) => n === 0 ? "" : `<a class="kpi ${ton || ""}" href="${href}"><span class="kpiic">${icon(ic)}</span><span class="kpitxt"><b>${n}</b><span>${lib}</span>${sous ? `<small>${sous}</small>` : ""}</span></a>`;
function blocTableauDeBord(){
  chargerPourTableau();
  const t = now(), dans7 = new Date(+t + 7 * 864e5), aujourdhui = d => sameDay(D(d), t);
  const vis = o => !o.brouillon && cls(o.classe_id) && !cls(o.classe_id).archive;
  let tuiles = "";
  if (S.prof) {
    const dvs = S.devoirs.filter(vis), acor = dvs.reduce((a, d) => a + aCorriger(d), 0);
    const premier = actives().find(c => dvs.some(d => d.classe_id === c.id && aCorriger(d) > 0));
    const urg = typeof nbUrgents === "function" ? nbUrgents() : 0, alertes = typeof alertesEleves === "function" ? alertesEleves().length : 0;
    const crs = S.rdv ? S.rdv.creneaux.filter(c => aujourdhui(c.debut)) : [], rdvJour = S.rdv ? S.rdv.resa.filter(r => crs.some(c => c.id === r.creneau_id)).length : null;
    const tps = (S.demandes || []).filter(x => x.date_tp && D(x.date_tp) >= new Date(+t - 864e5 / 2) && D(x.date_tp) <= dans7);
    const prochain = dvs.filter(d => d.date_limite && D(d.date_limite) > t).sort((a, b) => D(a.date_limite) - D(b.date_limite))[0];
    tuiles = tuile(premier ? `#/classe/${esc(premier.id)}/corriger` : "#/todo", "check", acor, acor > 1 ? "copies à corriger" : "copie à corriger", acor ? "warn" : "ok", premier && acor ? esc(premier.nom) : acor ? "" : "Tout est corrigé")
      + tuile("#/urgences", "urgent", urg, urg > 1 ? "messages urgents" : "message urgent", urg ? "bad" : "ok", urg ? "non lu" + (urg > 1 ? "s" : "") : "Rien de nouveau")
      + tuile("#/rendezvous", "rdv", rdvJour == null ? "…" : rdvJour, "rendez-vous aujourd'hui", rdvJour ? "info" : "", crs.length ? crs.length + " créneau" + (crs.length > 1 ? "x" : "") + " prévu" + (crs.length > 1 ? "s" : "") : "")
      + tuile("#/suivi", "alerte", alertes, alertes > 1 ? "élèves à surveiller" : "élève à surveiller", alertes ? "warn" : "ok", alertes ? "décrochage possible" : "Tout va bien")
      + tuile("#/preparateur", "flask", S.demandes ? tps.length : "…", "TP cette semaine", tps.some(x => x.statut === "brouillon") ? "warn" : "", tps.length ? tps.filter(x => x.statut === "prete").length + " prêt(s) · " + tps.filter(x => x.statut === "brouillon").length + " à envoyer" : "")
      + (() => { const n = [...S.devoirs, ...S.quiz].filter(o => !o.brouillon && o.publie_le && D(o.publie_le) > t).length; return n ? tuile("#/programmes", "cal", n, n > 1 ? "publications programmées" : "publication programmée", "info", "apparaîtront automatiquement") : ""; })()
      + (prochain ? tuile(`#/devoir/${prochain.id}`, "cal", fmtShort(D(prochain.date_limite)), "prochaine échéance", "", esc(prochain.titre)) : "");
  } else {
    const dvs = S.devoirs.filter(d => vis(d) && D(d.publie_le) <= t);
    const semaine = dvs.filter(d => d.date_limite && D(d.date_limite) > t && D(d.date_limite) <= dans7 && etat(d, moi()).t === "Attribué").length;
    const manq = dvs.filter(d => etat(d, moi()).t === "Manquant").length;
    const notes = dvs.filter(d => { const e = etat(d, moi()); return e.t === "Noté" && e.c && D(e.c.modifie_le || e.c.cree_le || 0) > new Date(+t - 7 * 864e5); }).length;
    const rep = typeof reponsesNonVues === "function" ? reponsesNonVues() : 0;
    const maResa = S.rdv ? S.rdv.resa.filter(r => r.eleve === S.user.id).map(r => S.rdv.creneaux.find(c => c.id === r.creneau_id)).filter(c => c && D(c.debut) > t).sort((a, b) => D(a.debut) - D(b.debut))[0] : null;
    tuiles = tuile("#/semaine", "week", semaine, "à rendre cette semaine", semaine ? "info" : "ok", semaine ? "" : "Rien d'urgent")
      + tuile("#/todo", "alerte", manq, manq > 1 ? "travaux manquants" : "travail manquant", manq ? "bad" : "ok", manq ? "à rattraper" : "Aucun retard")
      + tuile("#/todo", "grade", notes, notes > 1 ? "nouvelles notes" : "nouvelle note", notes ? "info" : "", "ces 7 derniers jours")
      + (rep ? tuile("#", "urgent", rep, rep > 1 ? "réponses de " + esc(nomProfCourt()) : "réponse de " + esc(nomProfCourt()), "bad", "Message urgent").replace('href="#"', 'href="#" data-act="urgchoix"') : "")
      + (maResa ? tuile("#/rendezvous", "rdv", fmtShort(D(maResa.debut)), "prochain rendez-vous", "info", fmtT(D(maResa.debut))) : "");
  }
  return `<section class="tdb"><div class="tdbhead"><div><h1>${salut()} ${esc(premierPrenom())}</h1><p>${esc(fmtD(t).replace(/^./, m => m.toUpperCase()))}</p></div>
      <button class="tdbsearch" data-act="recherche" aria-label="Rechercher (Ctrl+K)">${icon("search")}<span>Rechercher un cours, un devoir${S.prof ? ", un élève" : ""}…</span><kbd>Ctrl K</kbd></button></div>
    ${tuiles ? `<div class="kpis">${tuiles}</div>` : `<div class="kpiok">${icon("check")}<span><b>Tout est à jour</b><small>${S.prof ? "Aucune copie à corriger, aucun message urgent, aucun élève à surveiller." : "Rien à rendre cette semaine, aucun retard."}</small></span></div>`}</section>`;
}

/* ---------- #7 Recherche universelle (Ctrl+K) ---------- */
function indexRecherche(){
  const L = [], t = now();
  const pages = [["#/", "home", "Accueil"], ["#/agenda", "cal", "Agenda"], ["#/semaine", "week", "Ma semaine"], [S.prof ? "#/todo" : "#/todo", "todo", S.prof ? "Toutes les copies à corriger" : "À faire"], ["#/rendezvous", "rdv", "Rendez-vous"],
    ["#/outils", "tools", "Boîte à outils"], ["#/physique", "flask", "Outils Scientifiques Importants (unités, éléments, formules, chimie, SNT, SI…)"], ["#/simulations", "eye", "Simulations (PhET, GeoGebra…)"], ["#/revisions", "quiz", "Fiches de révision et flashcards"], ["#/admin/profil", "gear", "Paramètres"]];
  if (S.prof) pages.push(["#/programmes", "cal", "Publications programmées"], ["#/suivi", "grade", "Suivi des élèves"], ["#/urgences", "urgent", "Messagerie d'urgence"], ["#/preparateur", "flask", "Demande de matériel au préparateur"], ["#/archives", "archive", "Cours archivés"]);
  pages.forEach(([h, ic, n]) => L.push({ t: "Page", ic, n, h }));
  L.push({ t: "Action", ic: "note", n: "Ouvrir le Coin Perso", act: "coinperso" });
  if (S.prof) { L.push({ t: "Action", ic: "plus", n: "Créer un cours", act: "newclass" }); actives().forEach(c => { L.push({ t: "Action", ic: "devoir", n: "Nouveau devoir · " + c.nom, h: `#/editer/devoir/new/${c.id}` }); L.push({ t: "Action", ic: "support", n: "Nouvelle documentation · " + c.nom, h: `#/editer/documentation/new/${c.id}` }); }); }
  else L.push({ t: "Action", ic: "plus", n: "Rejoindre un cours", act: "join" });
  S.classes.forEach(c => L.push({ t: c.archive ? "Cours archivé" : "Cours", ic: "people", n: c.nom, s: c.section, h: `#/classe/${c.id}`, c: c.couleur }));
  S.devoirs.filter(d => S.prof || (!d.brouillon && D(d.publie_le) <= t)).forEach(d => { const c = cls(d.classe_id); L.push({ t: d.brouillon ? "Brouillon" : d.type === "question" ? "Question" : "Devoir", ic: d.type === "question" ? "question" : "devoir", n: d.titre, s: c ? c.nom : "", h: `#/devoir/${d.id}`, c: c && c.couleur }); });
  S.quiz.filter(q => S.prof || !q.brouillon).forEach(q => { const c = cls(q.classe_id); L.push({ t: "Questionnaire", ic: "quiz", n: q.titre, s: c ? c.nom : "", h: `#/quiz/${q.id}`, c: c && c.couleur }); });
  Object.entries(S.cache).forEach(([cid, data]) => (data.supports || []).forEach(s => { const c = cls(cid); L.push({ t: "Documentation", ic: "support", n: s.titre, s: c ? c.nom : "", h: `#/classe/${cid}/travaux`, c: c && c.couleur }); }));
  if (S.prof) (S.toutesInscriptions || []).forEach(e => { const c = cls(e.classe_id); if (c && !c.archive) L.push({ t: "Élève", ic: "people", n: e.nom || nomDepuisEmail(e.email), s: c.nom + " · " + e.email, eleve: e.email, cid: c.id, c: c.couleur }); });
  liensVisibles().forEach(l => L.push({ t: "Application", ic: "links", n: l.nom, url: l.url, cle: l.icone, logo: LOGOS_RAPIDES[l.icone] }));
  return L;
}
const RCH = { L: [], i: 0, res: [] };
function ouvrirRecherche(){
  if (document.getElementById("rechBox")) return;
  RCH.L = indexRecherche(); RCH.i = 0;
  const box = document.createElement("div"); box.id = "rechBox";
  box.innerHTML = `<div class="rechvoile"></div><div class="rech" role="dialog" aria-modal="true" aria-label="Recherche">
    <div class="rechin">${icon("search")}<input type="search" placeholder="Rechercher un cours, un devoir${S.prof ? ", un élève" : ""}, une page, une application…" aria-label="Rechercher" autocomplete="off" spellcheck="false"><kbd>Échap</kbd></div>
    <div class="rechres" role="listbox"></div>
    <div class="rechpied"><span><kbd>↑</kbd><kbd>↓</kbd> naviguer</span><span><kbd>Entrée</kbd> ouvrir</span><span><kbd>Ctrl</kbd><kbd>K</kbd> partout sur le site</span></div></div>`;
  document.body.appendChild(box);
  const inp = box.querySelector("input"), zone = box.querySelector(".rechres");
  const dessiner = () => {
    const q = sansAccent(inp.value.trim()), mots = q.split(/\s+/).filter(Boolean);
    let res = mots.length ? RCH.L.map(x => { const h = sansAccent(x.n + " " + (x.s || "") + " " + x.t); if (!mots.every(m => h.includes(m))) return null; const n = sansAccent(x.n); return { x, sc: (n.startsWith(mots[0]) ? 0 : 10) + (x.t === "Page" || x.t === "Cours" ? 0 : 3) + n.length / 100 }; }).filter(Boolean).sort((a, b) => a.sc - b.sc).map(o => o.x)
      : RCH.L.filter(x => x.t === "Cours" || x.t === "Page").slice(0, 14);
    RCH.res = res.slice(0, 40); RCH.i = Math.min(RCH.i, Math.max(0, RCH.res.length - 1));
    zone.innerHTML = RCH.res.length ? RCH.res.map((x, i) => `<button class="rechit${i === RCH.i ? " sel" : ""}" data-i="${i}" role="option" aria-selected="${i === RCH.i}" ${x.c ? `style="--c:var(${C(x.c).c})"` : ""}>
        <span class="rechic">${x.logo ? `<img src="${esc(x.logo)}" alt="">` : icon(x.ic)}</span><span class="rechtx"><b>${esc(x.n)}</b>${x.s ? `<small>${esc(x.s)}</small>` : ""}</span><span class="rechtype">${esc(x.t)}</span></button>`).join("")
      : `<p class="rechvide">Aucun résultat pour « ${esc(inp.value)} ».</p>`;
    const s = zone.querySelector(".sel"); if (s) s.scrollIntoView({ block: "nearest" });
  };
  const choisir = i => { const x = RCH.res[i]; if (!x) return; fermerRecherche();
    if (x.url) { const a = document.querySelector(`.quick a[data-cle="${x.cle}"]`); if (a) a.click(); else window.open(x.url, "_blank", "noopener"); return; }
    if (x.eleve) { S.suiviC = x.cid; go("/suivi"); setTimeout(() => { S.open = "sv" + x.eleve; render(); }, 60); return; }
    if (x.act) { const b = document.createElement("a"); b.dataset.act = x.act; b.href = "#"; b.hidden = true; document.body.appendChild(b); b.click(); b.remove(); return; }
    if (x.h) location.hash = x.h.replace(/^#/, ""); };
  inp.addEventListener("input", () => { RCH.i = 0; dessiner(); });
  inp.addEventListener("keydown", e => {
    if (e.key === "ArrowDown") { e.preventDefault(); RCH.i = Math.min(RCH.i + 1, RCH.res.length - 1); dessiner(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); RCH.i = Math.max(RCH.i - 1, 0); dessiner(); }
    else if (e.key === "Enter") { e.preventDefault(); choisir(RCH.i); }
    else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); fermerRecherche(); } });
  zone.addEventListener("click", e => { const b = e.target.closest(".rechit"); if (b) choisir(Number(b.dataset.i)); });
  box.querySelector(".rechvoile").addEventListener("click", fermerRecherche);
  dessiner(); setTimeout(() => inp.focus(), 20);
}
function fermerRecherche(){ const b = document.getElementById("rechBox"); if (b) b.remove(); }
document.addEventListener("keydown", e => {
  if (!S.user) return;
  if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) { e.preventDefault(); document.getElementById("rechBox") ? fermerRecherche() : ouvrirRecherche(); return; }
  if (e.key === "/" && !e.ctrlKey && !e.metaKey && !/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || "") && !(document.activeElement && document.activeElement.isContentEditable)) { e.preventDefault(); ouvrirRecherche(); }
});
document.addEventListener("click", e => { const a = e.target.closest && e.target.closest('[data-act="recherche"]'); if (a) { e.preventDefault(); e.stopPropagation(); fermerMenus(); ouvrirRecherche(); } }, true);

/* vues supplémentaires (routes #/semaine, #/physique, #/simulations, #/revisions) : complétées plus bas */
const VUES_PRO = {};

/* ---------- #9 Correction rapide : élève précédent / suivant, raccourcis, banque de commentaires ---------- */
const REMARQUES_DEFAUT = ["Très bon travail, continue ainsi.", "Attention aux unités.", "Chiffres significatifs à respecter.", "Justifie ta réponse.", "Relis l'énoncé : la question n'est pas traitée en entier.", "Formule correcte mais application numérique fausse.", "Schéma incomplet ou non légendé.", "Rédaction à soigner.", "Bonne démarche, erreur de calcul.", "Pense à conclure par une phrase."];
const ordreEleves = () => [...document.querySelectorAll('.sw .list button.st[data-n]')].map(b => b.dataset.n).filter(Boolean);
function eleveVoisin(sens){ const L = ordreEleves(); if (!L.length) return null; const i = L.indexOf(S.sel); if (i < 0) return L[0]; const j = i + sens; return j >= 0 && j < L.length ? L[j] : null; }
function barreCorrection(){
  const L = ordreEleves(), i = L.indexOf(S.sel);
  if (!S.prof || !S.sel) return "";
  setTimeout(majBarreCorrection, 0);
  return `<div class="corrnav"><button class="btn ghost sm" data-act="selnav" data-s="-1" ${i <= 0 ? "disabled" : ""} title="Alt + ←">${icon("left")} Précédent</button>
    <span class="muted">${i >= 0 ? `Élève ${i + 1} sur ${L.length}` : ""}</span>
    <button class="btn ghost sm" data-act="selnav" data-s="1" ${i < 0 || i >= L.length - 1 ? "disabled" : ""} title="Alt + →">Suivant ${icon("right")}</button>
    <small class="muted corraide"><kbd>Alt</kbd>+<kbd>←</kbd><kbd>→</kbd> changer d'élève · <kbd>Ctrl</kbd>+<kbd>Entrée</kbd> rendre et passer au suivant</small></div>`;
}
function majBarreCorrection(){ const z = document.querySelector(".corrnav"); if (!z) return; const L = ordreEleves(), i = L.indexOf(S.sel);
  const [p, n] = z.querySelectorAll("button"); p.disabled = i <= 0; n.disabled = i < 0 || i >= L.length - 1; z.querySelector("span").textContent = i >= 0 ? `Élève ${i + 1} sur ${L.length}` : ""; }
document.addEventListener("click", e => { const a = e.target.closest && e.target.closest('[data-act="selnav"]'); if (!a) return; e.preventDefault(); e.stopPropagation(); const n = eleveVoisin(Number(a.dataset.s)); if (n) { S.sel = n; S.compose = false; render(); } }, true);
document.addEventListener("keydown", e => {
  if (!S.prof || route().v !== "devoir" || !S.sel) return;
  if (e.altKey && (e.key === "ArrowRight" || e.key === "ArrowLeft")) { e.preventDefault(); const n = eleveVoisin(e.key === "ArrowRight" ? 1 : -1); if (n) { S.sel = n; render(); } }
  else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { const b = document.querySelector('[data-act="savenote"][data-next="1"]'); if (b) { e.preventDefault(); b.click(); } }
});

/* ---------- #13 Ma semaine : frise du lundi au dimanche + progression ---------- */
VUES_PRO.semaine = function(){
  chargerPourTableau();
  const t = now(), lun = new Date(t); lun.setHours(0, 0, 0, 0); lun.setDate(lun.getDate() - ((lun.getDay() + 6) % 7) + (S.semW || 0) * 7);
  const jours = [...Array(7)].map((_, i) => { const d = new Date(lun); d.setDate(lun.getDate() + i); return d; }), fin = new Date(+jours[6] + 864e5);
  const dans = d => d >= lun && d < fin, vis = o => !o.brouillon && cls(o.classe_id) && !cls(o.classe_id).archive && (S.prof || D(o.publie_le) <= t);
  const items = [];
  S.devoirs.filter(d => vis(d) && d.date_limite && dans(D(d.date_limite))).forEach(d => {
    const c = cls(d.classe_id), e = S.prof ? null : etat(d, moi());
    const fait = S.prof ? aCorriger(d) === 0 && rendusDe(d).length > 0 : !!(e && (e.t === "Rendu" || e.t === "Noté"));
    items.push({ d: D(d.date_limite), titre: d.titre, c, href: "#/devoir/" + d.id, ic: d.type === "question" ? "question" : "devoir", fait,
      etat: S.prof ? `${rendusDe(d).length} rendu${rendusDe(d).length > 1 ? "s" : ""} · ${aCorriger(d)} à corriger` : e.t, k: S.prof ? (aCorriger(d) ? "warn" : "ok") : e.k });
  });
  S.quiz.filter(q => vis(q) && q.date_limite && dans(D(q.date_limite))).forEach(q => { const c = cls(q.classe_id), r = S.prof ? null : resultatDe(q, S.user.id);
    items.push({ d: D(q.date_limite), titre: q.titre, c, href: "#/quiz/" + q.id, ic: "quiz", fait: S.prof ? D(q.date_limite) < t : !!r, etat: S.prof ? "Questionnaire" : r ? "Fait" : "À faire", k: r ? "ok" : "" }); });
  if (S.rdv) { const mes = S.prof ? S.rdv.resa : S.rdv.resa.filter(r => r.eleve === S.user.id);
    mes.forEach(r => { const cr = S.rdv.creneaux.find(c => c.id === r.creneau_id), se = cr && S.rdv.series.find(s => s.id === cr.serie_id); if (cr && dans(D(cr.debut))) items.push({ d: D(cr.debut), titre: (se ? se.titre : "Rendez-vous") + (S.prof ? " · " + (r.eleve_nom || r.eleve_email) : ""), c: se && cls(se.classe_id), href: "#/rendezvous", ic: "rdv", fait: D(cr.fin) < t, etat: "Rendez-vous", k: "info", rdv: 1 }); }); }
  if (S.prof && S.demandes) S.demandes.filter(x => x.date_tp && dans(D(x.date_tp))).forEach(x => items.push({ d: D(x.date_tp), titre: "TP · " + x.titre, c: cls(x.classe_id), href: "#/preparateur", ic: "flask", fait: x.statut === "prete", etat: x.statut === "prete" ? "Matériel prêt" : x.statut === "envoyee" ? "Demande envoyée" : "Demande à envoyer", k: x.statut === "prete" ? "ok" : x.statut === "envoyee" ? "info" : "warn" }));
  const travaux = items.filter(x => !x.rdv), faits = travaux.filter(x => x.fait).length, pc = travaux.length ? Math.round(faits / travaux.length * 100) : 100;
  const carte = x => `<a class="smitem${x.fait ? " fait" : ""}" href="${x.href}" style="--c:var(${C(x.c && x.c.couleur).c})"><span class="smh">${fmtT(x.d)}</span><span class="smt">${icon(x.ic)}<b>${esc(x.titre)}</b></span><small>${esc(x.c ? x.c.nom : "")}</small><span class="pill ${x.k || ""}">${esc(x.etat)}</span></a>`;
  return `<div class="page wide semaine"><div class="smhead"><div><h1>${S.prof ? "Ma semaine" : "Ma semaine"}</h1><p class="muted">${jours[0].toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} – ${jours[6].toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p></div>
      <div class="smnav"><button class="ib" data-act="semw" data-w="-1" aria-label="Semaine précédente">${icon("left")}</button>${S.semW ? `<button class="btn ghost sm" data-act="semw" data-w="0">Cette semaine</button>` : ""}<button class="ib" data-act="semw" data-w="1" aria-label="Semaine suivante">${icon("right")}</button></div></div>
    <div class="smprog"><div class="smbar"><i style="width:${Math.round(pc * 0.34)}px"></i></div><span><b>${faits}/${travaux.length}</b> ${S.prof ? "travaux entièrement corrigés ou terminés" : "travaux faits"} · ${pc} %</span></div>
    <div class="smfrise">${jours.map(j => { const L = items.filter(x => sameDay(x.d, j)).sort((a, b) => a.d - b.d); return `<section class="smjour${sameDay(j, t) ? " auj" : ""}${j < new Date(t.toDateString()) ? " passe" : ""}"><h3>${j.toLocaleDateString("fr-FR", { weekday: "long" })}<b>${j.getDate()}</b></h3>${L.length ? L.map(carte).join("") : `<p class="smvide">—</p>`}</section>`; }).join("")}</div>${pageFoot()}</div>`;
};
document.addEventListener("click", e => { const a = e.target.closest && e.target.closest('[data-act="semw"]'); if (!a) return; e.preventDefault(); e.stopPropagation(); S.semW = a.dataset.w === "0" ? 0 : (S.semW || 0) + Number(a.dataset.w); render(); }, true);

/* ---------- #4 Thème clair / sombre / automatique ---------- */
IC.sun = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
IC.moon = '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>';
IC.auto = '<circle cx="12" cy="12" r="9"/><path d="M12 3v18a9 9 0 0 0 0-18z" fill="currentColor"/>';
IC.access = '<circle cx="12" cy="4.5" r="2"/><path d="M4 8l8 1.5L20 8M12 9.5V15l-3 6M12 15l3 6"/>';
function menuApparence(){
  const t = themeChoisi(), b = (v, ic, l) => `<button class="thbtn${t === v ? " on" : ""}" data-act="theme" data-v="${v}" aria-pressed="${t === v}">${icon(ic)}<span>${l}</span></button>`;
  return `<div class="thmenu"><small>Apparence</small><div class="thgroupe">${b("light", "sun", "Clair")}${b("dark", "moon", "Sombre")}${b("auto", "auto", "Auto")}</div></div><a href="#" data-act="accessib">${icon("access")} Accessibilité</a>`;
}
document.addEventListener("click", e => { const a = e.target.closest && e.target.closest('[data-act="theme"]'); if (!a) return; e.preventDefault(); e.stopPropagation(); appliquerTheme(a.dataset.v); render(); }, true);

/* ---------- #6 Chargement en squelettes + animation de réussite ---------- */
const squelette = () => `<div class="page wide skel" aria-busy="true" aria-label="Chargement"><div class="sk sk-t"></div><div class="sk sk-s"></div><div class="skgrille">${'<div class="sk sk-c"></div>'.repeat(4)}</div><div class="sk sk-l"></div><div class="sk sk-l"></div><div class="sk sk-l court"></div></div>`;
function celebrer(texte){
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const o = document.createElement("div"); o.className = "bravo"; o.setAttribute("aria-hidden", "true");
  o.innerHTML = `<div class="bravobox"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="M14 27l8 8 16-17"/></svg><b>${esc(texte || "Bravo !")}</b></div>`;
  document.body.appendChild(o); confettis(o.querySelector(".bravobox")); setTimeout(() => o.classList.add("fin"), 1500); setTimeout(() => o.remove(), 1900);
}

/* ---------- #5 Cartes de cours plus parlantes ---------- */
function badgeCarte(c){
  const dv = S.devoirs.filter(d => d.classe_id === c.id && !d.brouillon && D(d.publie_le) <= now());
  if (S.prof) { const ac = dv.reduce((a, d) => a + aCorriger(d), 0); return ac ? `<span class="cbadge" title="${ac} rendu(s) à corriger">${ac} à corriger</span>` : ""; }
  const pour = dv.filter(d => !d.eleves || d.eleves.includes(moi())); if (!pour.length) return "";
  const faits = pour.filter(d => { const e = etat(d, moi()); return e.t === "Rendu" || e.t === "Noté"; }).length, pc = Math.round(faits / pour.length * 100);
  return `<span class="cprog" title="${faits} travail(s) rendu(s) sur ${pour.length}"><i style="width:${Math.round(pc * 0.34)}px"></i><small>${faits}/${pour.length} rendus</small></span>`;
}

/* ---------- #16 Accessibilité : taille du texte, contraste, police lisible, animations ---------- */
const A11Y_DEF = { taille: 100, contraste: false, police: "", calme: false };
const a11y = () => { try { return { ...A11Y_DEF, ...JSON.parse(localStorage.getItem("pp_a11y") || "{}") }; } catch (_) { return { ...A11Y_DEF }; } };
function appliquerA11y(){ const a = a11y(), de = document.documentElement;
  de.style.fontSize = a.taille === 100 ? "" : a.taille + "%"; de.classList.toggle("a11y-contraste", !!a.contraste); de.classList.toggle("a11y-calme", !!a.calme);
  de.dataset.police = a.police || ""; }
appliquerA11y();
function panneauA11y(){
  if (document.getElementById("a11yBox")) return; const a = a11y();
  const box = document.createElement("div"); box.id = "a11yBox";
  box.innerHTML = `<div class="rechvoile"></div><div class="a11y" role="dialog" aria-modal="true" aria-labelledby="a11yT"><div class="a11ytete"><h2 id="a11yT">${icon("access")} Accessibilité</h2><button class="ib" data-a11y="fermer" aria-label="Fermer">${icon("x")}</button></div>
    <div class="a11yrow"><b>Taille du texte</b><div class="thgroupe">${[[90, "A−"], [100, "A"], [115, "A+"], [130, "A++"]].map(([v, l]) => `<button class="thbtn${a.taille === v ? " on" : ""}" data-a11y="taille" data-v="${v}" style="font-size:${v / 100}rem">${l}</button>`).join("")}</div></div>
    <div class="a11yrow"><b>Police</b><div class="thgroupe">${[["", "Normale"], ["lisible", "Très lisible"], ["dys", "Adaptée dyslexie"]].map(([v, l]) => `<button class="thbtn${a.police === v ? " on" : ""}" data-a11y="police" data-v="${v}">${l}</button>`).join("")}</div></div>
    <label class="a11ycheck"><input type="checkbox" data-a11y="contraste" ${a.contraste ? "checked" : ""}><span><b>Contraste renforcé</b><small>Textes plus foncés, bordures plus visibles.</small></span></label>
    <label class="a11ycheck"><input type="checkbox" data-a11y="calme" ${a.calme ? "checked" : ""}><span><b>Réduire les animations</b><small>Aucun mouvement ni effet de transition.</small></span></label>
    <p class="muted" style="margin:0;font-size:.8rem">Ces réglages sont gardés sur cet appareil.</p></div>`;
  document.body.appendChild(box);
  const maj = (k, v) => { const x = a11y(); x[k] = v; try { localStorage.setItem("pp_a11y", JSON.stringify(x)); } catch (_) {} appliquerA11y(); box.remove(); panneauA11y(); };
  box.addEventListener("click", e => { const b = e.target.closest("[data-a11y]"); if (e.target.classList.contains("rechvoile") || (b && b.dataset.a11y === "fermer")) { box.remove(); return; }
    if (b && b.tagName === "BUTTON") maj(b.dataset.a11y, b.dataset.a11y === "taille" ? Number(b.dataset.v) : b.dataset.v); });
  box.addEventListener("change", e => { const b = e.target.closest("[data-a11y]"); if (b) maj(b.dataset.a11y, b.checked); });
  box.addEventListener("keydown", e => { if (e.key === "Escape") box.remove(); });
  setTimeout(() => { const f = box.querySelector(".thbtn.on"); if (f) f.focus(); }, 30);
}
document.addEventListener("click", e => { const a = e.target.closest && e.target.closest('[data-act="accessib"]'); if (!a) return; e.preventDefault(); e.stopPropagation(); fermerMenus(); render(); panneauA11y(); }, true);

/* ---------- #19 Statistiques d'un devoir ---------- */
IC.chart = '<path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6M20 16v-9"/>';
function statsAvancees(d){
  const notes = rendusDe(d).map(r => correctionDe(r)).filter(c => c && c.note != null).map(c => Number(c.note));
  const cors = rendusDe(d).map(r => correctionDe(r)).filter(Boolean);
  if (!notes.length && !cors.some(c => c.competences)) return "";
  const sur = d.points || 20, tri = notes.slice().sort((a, b) => a - b), n = tri.length;
  const moy = n ? tri.reduce((a, b) => a + b, 0) / n : null, med = n ? (n % 2 ? tri[(n - 1) / 2] : (tri[n / 2 - 1] + tri[n / 2]) / 2) : null;
  const et = n ? Math.sqrt(tri.reduce((a, x) => a + (x - moy) ** 2, 0) / n) : null;
  const tranches = 5, pas = sur / tranches, H = [...Array(tranches)].map((_, i) => tri.filter(x => i === tranches - 1 ? x >= i * pas : x >= i * pas && x < (i + 1) * pas).length), hmax = Math.max(1, ...H);
  const histo = n ? `<div class="histo" role="img" aria-label="Répartition des notes">${H.map((h, i) => `<div class="hcol"><span class="hval">${h || ""}</span><i style="height:${Math.round(h / hmax * 100)}%" class="${i < tranches / 2 - .5 ? "bas" : i >= tranches - 1 ? "haut" : ""}"></i><small>${fmtNote(i * pas)}–${fmtNote((i + 1) * pas)}</small></div>`).join("")}</div>` : "";
  const G = d.grille && d.grille.length ? d.grille : null;
  const crit = G ? G.map((g, i) => { const v = cors.map(c => c.grille && c.grille[i]).filter(x => x != null).map(Number); const m = v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; return { c: g.c, p: g.p, m, r: m == null ? null : m / g.p }; }) : [];
  const comp = COMP.map(([k, l]) => { const v = cors.map(c => c.competences && c.competences[k]).filter(Boolean); if (!v.length) return null; const sc = v.reduce((a, x) => a + ({ A: 4, B: 3, C: 2, D: 1 }[x] || 0), 0) / v.length; return { k, l, sc, n: v.length, faibles: v.filter(x => x === "C" || x === "D").length }; }).filter(Boolean).sort((a, b) => a.sc - b.sc);
  return `<details class="statsav" open><summary>${icon("chart")} <b>Statistiques</b> <span class="muted">${n} note${n > 1 ? "s" : ""} saisie${n > 1 ? "s" : ""}</span></summary>
    ${n ? `<div class="statchiffres"><div><b>${fmtNote(Math.round(moy * 100) / 100)}</b><small>moyenne /${sur}</small></div><div><b>${fmtNote(med)}</b><small>médiane</small></div><div><b>${fmtNote(tri[0])} – ${fmtNote(tri[n - 1])}</b><small>min – max</small></div><div><b>${fmtNote(Math.round(et * 100) / 100)}</b><small>écart-type</small></div><div><b>${Math.round(tri.filter(x => x >= sur / 2).length / n * 100)} %</b><small>≥ la moyenne</small></div></div>${histo}` : ""}
    ${crit.length ? `<div class="statbloc"><b>Critères de la grille</b>${crit.map(x => `<div class="critligne"><span>${esc(x.c)}</span><span class="critbar"><i style="width:${x.r == null ? 0 : Math.round(x.r * 100)}%" class="${x.r != null && x.r < .5 ? "bas" : ""}"></i></span><span class="mono">${x.m == null ? "–" : fmtNote(Math.round(x.m * 100) / 100)}/${x.p}</span></div>`).join("")}</div>` : ""}
    ${comp.length ? `<div class="statbloc"><b>Compétences (de la moins à la plus acquise)</b>${comp.map(x => `<div class="critligne"><span>${esc(x.l)}</span><span class="critbar"><i style="width:${Math.round((x.sc - 1) / 3 * 100)}%" class="${x.sc < 2.5 ? "bas" : ""}"></i></span><span class="muted" style="font-size:.78rem">${x.faibles ? x.faibles + " élève(s) en C/D" : "acquise"}</span></div>`).join("")}
      ${comp[0].sc < 2.5 ? `<p class="statconseil">${icon("alerte")} Remédiation conseillée : <b>${esc(comp[0].l)}</b>.</p>` : ""}</div>` : ""}
    <div class="statactions"><button class="btn ghost sm" data-act="pronotecopier" data-d="${d.id}">${icon("copy")} Copier les notes pour Pronote</button><button class="btn ghost sm" data-act="pronotecsv" data-d="${d.id}">${icon("down")} Exporter (Excel)</button></div>
  </details>`;
}

/* ---------- #12 Exports : notes pour Pronote, bilan PDF d'un élève ---------- */
function lignesNotesDevoir(d){
  const c = cls(d.classe_id), el = elevesDuDevoir(d, inscritsDe(d.classe_id)).slice();
  el.sort((a, b) => { const x = cleNom(a.nom), y = cleNom(b.nom); return (x.nom + " " + x.prenom).localeCompare(y.nom + " " + y.prenom, "fr"); });
  return el.map(e => { const s = etat(d, e.email), cr = s.r ? correctionDe(s.r) : null, k = cleNom(e.nom);
    return { nom: k.nom.toUpperCase(), prenom: k.prenom.replace(/(^|[\s-])\S/g, m => m.toUpperCase()), email: e.email, note: cr && cr.note != null ? cr.note : null, statut: s.t }; });
}
document.addEventListener("click", async e => {
  const a = e.target.closest && e.target.closest('[data-act="pronotecopier"],[data-act="pronotecsv"],[data-act="bilanpdf"]'); if (!a) return; e.preventDefault(); e.stopPropagation();
  if (a.dataset.act === "bilanpdf") { a.disabled = true; try { await bilanPdf(a.dataset.c, a.dataset.e); } catch (er) { toast("PDF impossible : " + (er.message || er)); } a.disabled = false; return; }
  const d = S.devoirs.find(x => String(x.id) === a.dataset.d); if (!d) return; const L = lignesNotesDevoir(d);
  if (a.dataset.act === "pronotecopier") {
    const txt = L.map(x => x.note == null ? (x.statut === "Manquant" ? "Abs" : "") : String(x.note).replace(".", ",")).join("\n");
    try { await navigator.clipboard.writeText(txt); toast(`${L.length} notes copiées (ordre alphabétique) : dans Pronote, clique dans la 1re case de la colonne puis Ctrl+V.`); } catch (_) { toast("Copie impossible : utilise plutôt l'export Excel."); }
  } else {
    const rows = [["Nom", "Prénom", "Note /" + (d.points || 20), "Statut", "Adresse"], ...L.map(x => [x.nom, x.prenom, x.note == null ? "" : String(x.note).replace(".", ","), x.statut, x.email])];
    telecharger("notes-" + sansAccent(d.titre).replace(/[^a-z0-9]+/g, "-").slice(0, 40) + "-" + ymd(now()) + ".csv", csv(rows), "text/csv;charset=utf-8");
  }
}, true);
async function bilanPdf(cid, email){
  const c = cls(cid); if (!c) return; await chargerScript(JSPDF, () => window.jspdf);
  const e = inscritsDe(cid).find(x => x.email === email) || { nom: nomDepuisEmail(email), email };
  const uid = Object.keys(S.profils || {}).find(id => S.profils[id] === email);
  const dv = S.devoirs.filter(d => d.classe_id === cid && !d.brouillon && D(d.publie_le) <= now() && (!d.eleves || d.eleves.includes(email)));
  const m = moyenneDe(c, email, uid, false).moy;
  const doc = new window.jspdf.jsPDF({ unit: "mm", format: "a4" }), W = 210; let y = 18;
  const coul = { pc: [42, 99, 194], snt: [61, 139, 44], si: [194, 53, 53], tech: [138, 106, 8] }[c.couleur] || [17, 100, 130];
  doc.setFillColor(...coul); doc.rect(0, 0, W, 34, "F"); doc.setTextColor(255); doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.text("Bilan de l'élève", 14, 15);
  doc.setFontSize(11); doc.setFont("helvetica", "normal"); doc.text(`${c.nom}${c.section ? " · " + c.section : ""}`, 14, 23); doc.text(`Édité le ${now().toLocaleDateString("fr-FR")} · ${R().prof.nom}`, 14, 29);
  y = 46; doc.setTextColor(11, 31, 40); doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.text(e.nom, 14, y);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(83, 105, 115); doc.text(e.email, 14, y + 6);
  doc.setFontSize(26); doc.setTextColor(...coul); doc.setFont("helvetica", "bold"); doc.text(m == null ? "–" : fmtNote(arrondi1(m)), W - 14, y + 2, { align: "right" }); doc.setFontSize(10); doc.text("moyenne /20", W - 14, y + 8, { align: "right" });
  const et = dv.map(d => ({ d, s: etat(d, email) }));
  const rendus = et.filter(x => x.s.r).length, manq = et.filter(x => x.s.t === "Manquant").length, ret = et.filter(x => x.s.retard).length;
  y += 18; doc.setTextColor(11, 31, 40); doc.setFontSize(10); doc.setFont("helvetica", "normal");
  [["Travaux rendus", rendus + " / " + dv.length], ["Manquants", String(manq)], ["Rendus en retard", String(ret)]].forEach(([l, v], i) => { const x = 14 + i * 62; doc.setDrawColor(217, 228, 232); doc.roundedRect(x, y, 58, 16, 2, 2); doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.text(v, x + 4, y + 7); doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.text(l, x + 4, y + 13); });
  y += 26; doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.text("Détail des travaux", 14, y); y += 6;
  doc.setFontSize(9); doc.setFillColor(233, 238, 246); doc.rect(14, y - 4, W - 28, 7, "F"); doc.text("Travail", 16, y); doc.text("Échéance", 120, y); doc.text("Statut", 150, y); doc.text("Note", W - 16, y, { align: "right" }); y += 7; doc.setFont("helvetica", "normal");
  et.forEach(({ d, s }) => { if (y > 270) { doc.addPage(); y = 20; } const t = doc.splitTextToSize(d.titre, 100); doc.text(t, 16, y); doc.text(d.date_limite ? D(d.date_limite).toLocaleDateString("fr-FR") : "—", 120, y); doc.text(s.t + (s.retard ? " (retard)" : ""), 150, y);
    doc.text(s.t === "Noté" && s.note != null ? fmtNote(s.note) + "/" + (d.points || 20) : "", W - 16, y, { align: "right" }); y += 5 * t.length + 2; doc.setDrawColor(235); doc.line(14, y - 3, W - 14, y - 3); });
  const comps = {}; et.forEach(({ s }) => { const cr = s.c; if (cr && cr.publiee && cr.competences) Object.entries(cr.competences).forEach(([k, v]) => (comps[k] = comps[k] || []).push(v)); });
  if (Object.keys(comps).length) { y += 6; if (y > 250) { doc.addPage(); y = 20; } doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.text("Compétences", 14, y); y += 7; doc.setFontSize(9.5); doc.setFont("helvetica", "normal");
    COMP.forEach(([k, l]) => { const v = comps[k]; if (!v) return; const sc = v.reduce((a, x) => a + ({ A: 4, B: 3, C: 2, D: 1 }[x] || 0), 0) / v.length; doc.text(l, 16, y); doc.setFillColor(233, 238, 246); doc.rect(80, y - 3, 90, 4, "F"); doc.setFillColor(...(sc < 2.5 ? [192, 57, 43] : coul)); doc.rect(80, y - 3, 90 * (sc - 1) / 3, 4, "F"); doc.text(v.join(" "), W - 16, y, { align: "right" }); y += 7; }); }
  doc.setFontSize(8); doc.setTextColor(140); doc.text("PhysiquePro · Lycée franco-libanais Verdun", 14, 290);
  doc.save(`bilan-${sansAccent(e.nom).replace(/[^a-z0-9]+/g, "-")}-${sansAccent(c.nom).replace(/[^a-z0-9]+/g, "-").slice(0, 30)}.pdf`);
}

/* ---------- #10 Publications programmées : liste sur une page ---------- */
VUES_PRO.programmes = function(){
  if (!S.prof) return VUES_PRO.semaine();
  const t = now(), L = [...S.devoirs.map(d => ({ o: d, k: "devoir", h: "#/devoir/" + d.id })), ...S.quiz.map(q => ({ o: q, k: "quiz", h: "#/quiz/" + q.id }))].filter(x => !x.o.brouillon && x.o.publie_le && D(x.o.publie_le) > t).sort((a, b) => D(a.o.publie_le) - D(b.o.publie_le));
  const sup = Object.entries(S.cache).flatMap(([cid, data]) => (data.supports || []).filter(s => !s.brouillon && s.publie_le && D(s.publie_le) > t).map(s => ({ o: { ...s, classe_id: cid }, k: "support", h: `#/classe/${cid}/travaux` })));
  const tout = [...L, ...sup].sort((a, b) => D(a.o.publie_le) - D(b.o.publie_le));
  return `<div class="page"><div class="homehead"><h1>Publications programmées</h1></div><p class="muted" style="margin:0">Ces éléments apparaîtront automatiquement aux élèves à la date indiquée. Pour programmer : dans l'éditeur, choisis « Programmer » au lieu de « Publier ».</p>
    ${tout.length ? `<section class="group">${tout.map(x => { const c = cls(x.o.classe_id); return `<div class="work" style="--c:var(${C(c && c.couleur).c})"><a class="workrow" href="${x.h}" style="padding:12px 18px;gap:16px"><span class="ico">${icon(x.k === "quiz" ? "quiz" : x.k === "support" ? "support" : "devoir", "")}</span><span class="tt">${esc(x.o.titre)}<br><small class="muted" style="font-weight:400">${esc(c ? c.nom : "")}</small></span><span class="dt">${icon("cal")} ${fmtD(D(x.o.publie_le))}, ${fmtT(D(x.o.publie_le))}</span></a></div>`; }).join("")}</section>`
      : `<div class="emptystate"><b>Aucune publication programmée.</b><span>Les documentations des cours que tu n'as pas encore ouverts dans cette session ne sont pas listées.</span></div>`}${pageFoot()}</div>`;
};

IC.cards = '<rect x="3" y="6" width="13" height="15" rx="2"/><path d="M8 3h11a2 2 0 0 1 2 2v13"/>';
IC.atom = '<circle cx="12" cy="12" r="1.6"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>';
IC.ruler = '<path d="M3 17 17 3l4 4L7 21z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/>';
IC.install = '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>';

/* ---------- #20 Corbeille (30 jours) et sauvegardes automatiques ---------- */
let sauvegardeLancee = false;
function sauvegardeAuto(){ if (!S.prof || sauvegardeLancee) return; sauvegardeLancee = true; sb.rpc("pp_sauvegarde", { p_forcer: false }).then(() => {}, () => {}); }
const NOMS_TABLES = { themes: "Thème", supports: "Documentation", devoirs: "Devoir", quiz: "Questionnaire", annonces: "Annonce", commentaires: "Commentaire", rendus: "Travail rendu", corrections: "Correction", resultats_quiz: "Résultat de questionnaire", quiz_solutions: "Solutions", flashcards: "Flashcard" };
async function chargerCorbeille(){
  const [c, s] = await Promise.all([sb.from("corbeille").select("id, lot, table_nom, ligne, supprime_le, restaure_le").is("restaure_le", null).order("supprime_le", { ascending: false }).limit(800), sb.from("sauvegardes").select("id, cree_le, taille").order("cree_le", { ascending: false })]);
  S.corb = { lignes: c.error ? [] : c.data, sauv: s.error ? [] : s.data, err: c.error && c.error.message };
}
VUES_PRO.corbeille = function(){
  if (!S.prof) return VUES_PRO.semaine();
  if (!S.corb) { chargerCorbeille().catch(er => { S.corb = { lignes: [], sauv: [], err: er.message || String(er) }; }).then(() => { if (route().v === "corbeille") render(); }); return squelette(); }
  const lots = {}; S.corb.lignes.forEach(l => (lots[l.lot] = lots[l.lot] || []).push(l));
  const principaux = ["devoirs", "quiz", "supports", "themes", "annonces", "flashcards", "rendus", "commentaires"];
  const items = Object.values(lots).map(L => { const p = principaux.map(t => L.find(x => x.table_nom === t)).find(Boolean) || L[0]; return { L, p }; }).filter(x => x.p.table_nom !== "corrections" || x.L.length > 0);
  const titre = l => { const g = l.ligne; return g.titre || g.recto || (g.texte ? String(g.texte).slice(0, 80) : "") || (g.auteur_email ? "de " + g.auteur_email : "") || "(sans titre)"; };
  const ilya = d => { const j = Math.floor((now() - D(d)) / 864e5); return j === 0 ? "aujourd'hui" : j === 1 ? "hier" : "il y a " + j + " jours"; };
  return `<div class="page"><div class="homehead"><h1>Corbeille et sauvegardes</h1></div>
    <section class="edcard"><h2>${icon("trash")} Corbeille <span class="muted" style="font-weight:400;font-size:.85rem">· éléments supprimés ces 30 derniers jours</span></h2>
      ${S.corb.err ? `<p class="err">${esc(S.corb.err)}</p>` : ""}
      ${items.length ? `<div class="corbliste">${items.map(({ L, p }) => { const c = cls(p.ligne.classe_id) || cls(((S.devoirs.find(d => d.id === p.ligne.devoir_id) || {}).classe_id));
        const autres = L.length - 1;
        return `<div class="corbitem"><span class="corbtype">${esc(NOMS_TABLES[p.table_nom] || p.table_nom)}</span><span class="corbtx"><b>${esc(titre(p))}</b><small>${esc(c ? c.nom + " · " : "")}supprimé ${ilya(p.supprime_le)}${autres ? ` · avec ${autres} élément${autres > 1 ? "s" : ""} lié${autres > 1 ? "s" : ""} (rendus, notes…)` : ""}</small></span>
          <button class="btn tonal sm" data-act="restaurer" data-lot="${p.lot}">${icon("restore")} Restaurer</button></div>`; }).join("")}</div>`
        : `<p class="muted" style="margin:0">La corbeille est vide.</p>`}
      <p class="muted" style="margin:0;font-size:.8rem">Un devoir restauré revient avec les travaux rendus et les notes supprimés en même temps. Les fichiers déposés par les élèves restent dans leur stockage.</p></section>
    <section class="edcard"><h2>${icon("down")} Sauvegardes automatiques</h2>
      <p class="muted" style="margin:0;font-size:.88rem">Une copie complète des données du site (cours, devoirs, notes, élèves, réglages) est faite automatiquement chaque semaine, quand tu ouvres le site. Les 8 dernières sont gardées.</p>
      ${S.corb.sauv.length ? `<div class="corbliste">${S.corb.sauv.map(x => `<div class="corbitem"><span class="corbtype">${icon("down")}</span><span class="corbtx"><b>${esc(fmtD(D(x.cree_le)))} à ${fmtT(D(x.cree_le))}</b><small>${Math.round((x.taille || 0) / 1024)} Ko</small></span><button class="btn ghost sm" data-act="telsauv" data-id="${x.id}">${icon("down")} Télécharger</button></div>`).join("")}</div>` : `<p class="muted" style="margin:0">Aucune sauvegarde pour l'instant.</p>`}
      <div><button class="btn" data-act="sauvnow">${icon("down")} Faire une sauvegarde maintenant</button></div></section>${pageFoot()}</div>`;
};
document.addEventListener("click", async e => {
  const a = e.target.closest && e.target.closest('[data-act="restaurer"],[data-act="telsauv"],[data-act="sauvnow"]'); if (!a) return; e.preventDefault(); e.stopPropagation(); a.disabled = true;
  if (a.dataset.act === "restaurer") { const { data, error } = await sb.rpc("pp_restaurer", { p_lot: Number(a.dataset.lot) }); if (error) { toast("Restauration impossible : " + error.message); a.disabled = false; return; } S.cache = {}; await rafraichir(); await chargerCorbeille(); render(); toast(`Restauré (${data} élément${data > 1 ? "s" : ""})`); }
  else if (a.dataset.act === "telsauv") { const { data, error } = await sb.from("sauvegardes").select("contenu, cree_le").eq("id", Number(a.dataset.id)).single(); a.disabled = false; if (error) { toast("Téléchargement impossible : " + error.message); return; } telecharger("physiquepro-sauvegarde-" + ymd(D(data.cree_le)) + ".json", JSON.stringify(data.contenu), "application/json"); }
  else { const { error } = await sb.rpc("pp_sauvegarde", { p_forcer: true }); if (error) { toast("Sauvegarde impossible : " + error.message); a.disabled = false; return; } await chargerCorbeille(); render(); toast("Sauvegarde faite"); }
}, true);
window.addEventListener("hashchange", () => { if (route().v !== "corbeille") S.corb = null; });

/* ---------- #15 Application installable + barre de navigation en bas sur téléphone ---------- */
let invitationInstall = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); invitationInstall = e; });
if ("serviceWorker" in navigator && location.protocol === "https:") window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
const estInstallee = () => (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone;
function lienInstall(){ return estInstallee() ? "" : `<a href="#" data-act="installer">${icon("install")} Installer l'application</a>`; }
document.addEventListener("click", async e => { const a = e.target.closest && e.target.closest('[data-act="installer"]'); if (!a) return; e.preventDefault(); e.stopPropagation(); fermerMenus(); render();
  if (invitationInstall) { invitationInstall.prompt(); const r = await invitationInstall.userChoice.catch(() => null); invitationInstall = null; if (r && r.outcome === "accepted") toast("PhysiquePro est installé"); return; }
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  S.modal = { kind: "confirm", titre: "Installer PhysiquePro", texte: ios ? "Sur iPhone / iPad : touche le bouton Partager (carré avec une flèche) en bas de Safari, puis « Sur l'écran d'accueil »." : "Dans le menu de ton navigateur (⋮ ou …), choisis « Installer PhysiquePro » ou « Ajouter à l'écran d'accueil ».", ok: "Compris", action: "rien" }; render(); }, true);
function navMobile(r){
  if (!S.user || S.public) return "";
  const it = (h, ic, l, on) => `<a href="${h}" class="${on ? "on" : ""}" ${on ? 'aria-current="page"' : ""}>${icon(ic)}<span>${l}</span></a>`;
  return `<nav class="navbas" aria-label="Navigation rapide">${it("#/", "home", "Accueil", r.v === "accueil")}${it("#/semaine", "week", "Semaine", r.v === "semaine")}${it("#/todo", S.prof ? "check" : "todo", S.prof ? "Corriger" : "À faire", r.v === "todo")}${it("#/agenda", "cal", "Agenda", r.v === "agenda")}<a href="#" data-act="drawer" class="${S.drawer ? "on" : ""}">${icon("menu")}<span>Menu</span></a></nav>`;
}

/* ---------- #17 Bibliothèque de simulations (ouverture dans le panneau latéral) ---------- */
const PHET = (n, t, niv) => ({ t, url: `https://phet.colorado.edu/sims/html/${n}/latest/${n}_all.html?locale=fr`, src: "PhET", niv });
const SIMS = [
  { cat: "Mécanique : mouvements et forces", l: [PHET("forces-and-motion-basics", "Forces et mouvement : les bases", "2nde"), PHET("friction", "Frottements", "2nde"), PHET("vector-addition", "Addition de vecteurs", "2nde · 1re"), PHET("balancing-act", "Équilibrer les masses", "2nde"), PHET("hookes-law", "Loi de Hooke (ressorts)", "2nde"), PHET("gravity-force-lab-basics", "Interaction gravitationnelle : les bases", "2nde"), PHET("gravity-force-lab", "Loi de la gravitation universelle", "2nde · Tle"), PHET("projectile-motion", "Mouvement d'un projectile", "Tle"), PHET("projectile-data-lab", "Labo de données sur les projectiles", "Tle"), PHET("collision-lab", "Labo de collisions (quantité de mouvement)", "Tle"), PHET("gravity-and-orbits", "Gravité et orbites", "Tle"), PHET("keplers-laws", "Lois de Kepler", "Tle"), PHET("my-solar-system", "Mon système solaire", "Tle")] },
  { cat: "Énergie, oscillations et thermodynamique", l: [PHET("energy-skate-park-basics", "Énergie au skatepark : les bases", "1re"), PHET("energy-skate-park", "Énergies au skatepark", "1re"), PHET("pendulum-lab", "Labo du pendule", "1re · Tle"), PHET("masses-and-springs-basics", "Masses et ressorts : les bases", "1re"), PHET("masses-and-springs", "Masses et ressorts", "1re · Tle"), PHET("energy-forms-and-changes", "Formes et conversions d'énergie", "2nde · SI · Techno"), PHET("states-of-matter-basics", "États de la matière : les bases", "2nde"), PHET("states-of-matter", "États de la matière", "2nde · 1re"), PHET("gases-intro", "Gaz : introduction", "2nde · Tle"), PHET("gas-properties", "Propriétés des gaz (gaz parfait)", "Tle"), PHET("diffusion", "Diffusion d'un gaz", "Tle"), PHET("greenhouse-effect", "Effet de serre", "1re (ens. scientifique)")] },
  { cat: "Fluides", l: [PHET("density", "Masse volumique", "2nde"), PHET("under-pressure", "Sous pression (pression d'un fluide)", "2nde · 1re"), PHET("buoyancy-basics", "Poussée d'Archimède : les bases", "Tle"), PHET("buoyancy", "Poussée d'Archimède", "Tle")] },
  { cat: "Ondes et signaux", l: [PHET("waves-intro", "Introduction aux ondes (son, lumière, eau)", "2nde"), PHET("fourier-making-waves", "Fourier : décomposer un son", "2nde"), PHET("wave-on-a-string", "Onde sur une corde", "Tle"), PHET("wave-interference", "Interférences et diffraction", "Tle"), PHET("quantum-wave-interference", "Interférences quantiques", "Tle")] },
  { cat: "Lumière, couleurs et spectres", l: [PHET("bending-light", "Réfraction de la lumière (Snell-Descartes)", "2nde"), PHET("geometric-optics-basics", "Optique géométrique : les bases", "2nde · 1re"), PHET("geometric-optics", "Lentilles et miroirs", "1re"), PHET("color-vision", "Vision des couleurs", "1re"), PHET("blackbody-spectrum", "Spectre du corps noir (loi de Wien)", "1re"), PHET("models-of-the-hydrogen-atom", "Modèles de l'atome d'hydrogène", "1re"), PHET("molecules-and-light", "Molécules et lumière", "1re")] },
  { cat: "Électricité et magnétisme", l: [PHET("circuit-construction-kit-dc", "Construire un circuit (courant continu)", "2nde · SI · Techno"), PHET("circuit-construction-kit-dc-virtual-lab", "Circuit continu : labo virtuel", "2nde · SI"), PHET("ohms-law", "Loi d'Ohm", "2nde · Techno"), PHET("resistance-in-a-wire", "Résistance d'un fil", "2nde"), PHET("circuit-construction-kit-ac", "Construire un circuit (alternatif)", "SI"), PHET("circuit-construction-kit-ac-virtual-lab", "Circuit alternatif : labo virtuel", "SI"), PHET("capacitor-lab-basics", "Condensateur", "Tle"), PHET("balloons-and-static-electricity", "Ballons et électricité statique", "1re"), PHET("john-travoltage", "John Travoltage (électrisation)", "1re"), PHET("coulombs-law", "Loi de Coulomb", "1re"), PHET("charges-and-fields", "Charges et champs électriques", "1re · Tle"), PHET("magnet-and-compass", "Aimant et boussole", "1re · Techno"), PHET("magnets-and-electromagnets", "Aimants et électroaimants", "1re · SI"), PHET("faradays-law", "Loi de Faraday (induction)", "SI"), PHET("faradays-electromagnetic-lab", "Labo électromagnétique de Faraday", "SI"), PHET("generator", "Générateur (alternateur)", "SI · Techno"), { t: "Simulateur de circuits Falstad", url: "https://www.falstad.com/circuit/circuitjs.html", src: "Falstad", niv: "SI · Techno" }] },
  { cat: "Atome et noyau", l: [PHET("build-an-atom", "Construire un atome", "2nde"), PHET("isotopes-and-atomic-mass", "Isotopes et masse atomique", "2nde"), PHET("rutherford-scattering", "Diffusion de Rutherford", "2nde"), PHET("build-a-nucleus", "Construire un noyau", "1re"), PHET("alpha-decay", "Désintégration alpha", "1re · Tle"), PHET("beta-decay", "Désintégration bêta", "1re · Tle")] },
  { cat: "Chimie", l: [PHET("build-a-molecule", "Créer une molécule", "2nde"), PHET("balancing-chemical-equations", "Ajuster une équation chimique", "2nde"), PHET("reactants-products-and-leftovers", "Réactifs, produits et restes (avancement)", "2nde · 1re"), PHET("concentration", "Concentration", "2nde"), PHET("molarity", "Concentration molaire", "2nde"), PHET("molecule-shapes-basics", "Géométrie des molécules : les bases", "1re"), PHET("molecule-shapes", "Géométrie des molécules (VSEPR)", "1re"), PHET("molecule-polarity", "Polarité des molécules", "1re"), PHET("atomic-interactions", "Interactions atomiques", "1re"), PHET("beers-law-lab", "Loi de Beer-Lambert", "1re"), PHET("ph-scale-basics", "Échelle de pH : les bases", "Tle"), PHET("ph-scale", "Échelle de pH", "Tle"), PHET("acid-base-solutions", "Solutions acides et basiques", "Tle")] },
  { cat: "Mesures, graphiques et mathématiques", l: [PHET("curve-fitting", "Ajustement de courbes (modélisation)", "2nde · 1re · Tle"), PHET("least-squares-regression", "Régression linéaire", "1re · Tle"), PHET("graphing-quadratics", "Tracer des paraboles", "1re"), PHET("calculus-grapher", "Dérivées et intégrales", "Tle"), PHET("trig-tour", "Cercle trigonométrique", "1re · Tle")] },
  { cat: "Programmation, SNT, SI et technologie", l: [{ t: "Basthon · Python dans le navigateur", url: "https://basthon.fr/", src: "Basthon", niv: "SNT · SI" }, { t: "Capytale (Python, Scratch, HTML…)", url: "https://capytale2.ac-paris.fr/web/accueil", src: "Capytale", niv: "SNT · SI · Techno" }, { t: "GeoGebra · grapheur", url: "https://www.geogebra.org/graphing?lang=fr", src: "GeoGebra", niv: "Tous niveaux" }, { t: "Ostralo · animations de physique", url: "https://www.ostralo.net/", src: "Ostralo", niv: "2nde · 1re · Tle" }] }
];
function ouvrirSimu(t, url){ const cle = "sim:" + url; COTE_A_COTE[cle] = { titre: t, mode: "cadre" }; if (window.innerWidth <= 760) { window.open(url, "_blank", "noopener"); return; } ouvrirCote(cle, url, t); }
VUES_PRO.simulations = function(){
  const perso = R().simulations || [], q = sansAccent(S.simQ || "");
  const groupes = [...SIMS, ...(perso.length ? [{ cat: "Ajoutées par " + nomProfCourt(), l: perso.map(x => ({ ...x, src: x.src || "Lien" })), perso: true }] : [])];
  const filtre = x => !q || sansAccent(x.t + " " + x.src + " " + (x.niv || "")).includes(q);
  return `<div class="page wide"><div class="homehead"><h1>Simulations</h1></div>
    <p class="muted" style="margin:0">Clique sur une simulation : elle s'ouvre à côté de la page (écran partagé). Sur téléphone, elle s'ouvre dans un nouvel onglet.</p>
    <div class="simbarre"><div class="simq">${icon("search")}<input type="search" data-simq="1" placeholder="Chercher : pendule, pH, circuit, Tle, SI…" value="${esc(S.simQ || "")}" aria-label="Chercher une simulation"></div></div>
    ${groupes.map(g => { const L = g.l.map((x, i) => ({ ...x, i })).filter(filtre); return L.length ? `<section class="simgroupe"><h2>${esc(g.cat)}</h2><div class="simgrille">${L.map(x => `<div class="simcarte"><button class="simouvrir" data-act="simu" data-t="${esc(x.t)}" data-u="${esc(x.url)}"><span class="simsrc">${esc(x.src)}</span>${x.niv ? `<span class="simniv">${esc(x.niv)}</span>` : ""}<b>${esc(x.t)}</b><span class="simgo">${icon("expand")} Ouvrir à côté</span></button>${g.perso && S.prof ? `<button class="ib sm simsuppr" data-act="simsuppr" data-i="${x.i}" title="Retirer" aria-label="Retirer ${esc(x.t)}">${icon("trash")}</button>` : ""}</div>`).join("")}</div></section>` : ""; }).join("") || `<div class="emptystate"><b>Aucune simulation ne correspond.</b></div>`}
    ${S.prof ? `<section class="edcard"><h2>${icon("plus")} Ajouter une simulation</h2><div class="simajout"><input id="simT" placeholder="Titre (ex. Chute libre)" aria-label="Titre"><input id="simU" type="url" placeholder="https://…" aria-label="Adresse"><button class="btn" data-act="simajout">${icon("plus")} Ajouter</button></div><p class="muted" style="margin:0;font-size:.8rem">Certains sites (Scratch, Tinkercad…) refusent de s'afficher à côté : utilise alors le bouton ↗ du panneau pour les ouvrir dans un onglet.</p></section>` : ""}
    ${pageFoot()}</div>`;
};
document.addEventListener("input", e => { if (e.target.dataset && e.target.dataset.simq) { S.simQ = e.target.value; const pos = e.target.selectionStart; render(); const i = document.querySelector("[data-simq]"); if (i) { i.focus(); i.setSelectionRange(pos, pos); } } });
document.addEventListener("click", async e => {
  const a = e.target.closest && e.target.closest('[data-act="simu"],[data-act="simajout"],[data-act="simsuppr"]'); if (!a) return; e.preventDefault(); e.stopPropagation();
  if (a.dataset.act === "simu") { ouvrirSimu(a.dataset.t, a.dataset.u); return; }
  let L = (R().simulations || []).slice();
  if (a.dataset.act === "simajout") { const t = (document.getElementById("simT").value || "").trim(), u = (document.getElementById("simU").value || "").trim(); if (!t || !/^https:\/\/\S+\.\S+/.test(u)) { toast("Indique un titre et une adresse commençant par https://"); return; } L.push({ t, url: u }); }
  else L.splice(Number(a.dataset.i), 1);
  const data = { ...reglagesData(), simulations: L };
  const { error } = await sb.from("reglages").upsert({ id: 1, data, modifie_le: now().toISOString() }); if (error) { toast("Enregistrement impossible : " + error.message); return; }
  appliquerReglages(data); render(); toast(a.dataset.act === "simajout" ? "Simulation ajoutée" : "Simulation retirée");
}, true);

/* ---------- #18 Outils de physique : unités, tableau périodique, constantes, courbes ---------- */
const ELEM = "H,Hydrogène,1.008,nm|He,Hélium,4.0026,ng|Li,Lithium,6.94,al|Be,Béryllium,9.0122,at|B,Bore,10.81,md|C,Carbone,12.011,nm|N,Azote,14.007,nm|O,Oxygène,15.999,nm|F,Fluor,18.998,ha|Ne,Néon,20.180,ng|Na,Sodium,22.990,al|Mg,Magnésium,24.305,at|Al,Aluminium,26.982,pt|Si,Silicium,28.085,md|P,Phosphore,30.974,nm|S,Soufre,32.06,nm|Cl,Chlore,35.45,ha|Ar,Argon,39.948,ng|K,Potassium,39.098,al|Ca,Calcium,40.078,at|Sc,Scandium,44.956,tr|Ti,Titane,47.867,tr|V,Vanadium,50.942,tr|Cr,Chrome,51.996,tr|Mn,Manganèse,54.938,tr|Fe,Fer,55.845,tr|Co,Cobalt,58.933,tr|Ni,Nickel,58.693,tr|Cu,Cuivre,63.546,tr|Zn,Zinc,65.38,tr|Ga,Gallium,69.723,pt|Ge,Germanium,72.630,md|As,Arsenic,74.922,md|Se,Sélénium,78.971,nm|Br,Brome,79.904,ha|Kr,Krypton,83.798,ng|Rb,Rubidium,85.468,al|Sr,Strontium,87.62,at|Y,Yttrium,88.906,tr|Zr,Zirconium,91.224,tr|Nb,Niobium,92.906,tr|Mo,Molybdène,95.95,tr|Tc,Technétium,98,tr|Ru,Ruthénium,101.07,tr|Rh,Rhodium,102.91,tr|Pd,Palladium,106.42,tr|Ag,Argent,107.87,tr|Cd,Cadmium,112.41,tr|In,Indium,114.82,pt|Sn,Étain,118.71,pt|Sb,Antimoine,121.76,md|Te,Tellure,127.60,md|I,Iode,126.90,ha|Xe,Xénon,131.29,ng|Cs,Césium,132.91,al|Ba,Baryum,137.33,at|La,Lanthane,138.91,ln|Ce,Cérium,140.12,ln|Pr,Praséodyme,140.91,ln|Nd,Néodyme,144.24,ln|Pm,Prométhium,145,ln|Sm,Samarium,150.36,ln|Eu,Europium,151.96,ln|Gd,Gadolinium,157.25,ln|Tb,Terbium,158.93,ln|Dy,Dysprosium,162.50,ln|Ho,Holmium,164.93,ln|Er,Erbium,167.26,ln|Tm,Thulium,168.93,ln|Yb,Ytterbium,173.05,ln|Lu,Lutécium,174.97,ln|Hf,Hafnium,178.49,tr|Ta,Tantale,180.95,tr|W,Tungstène,183.84,tr|Re,Rhénium,186.21,tr|Os,Osmium,190.23,tr|Ir,Iridium,192.22,tr|Pt,Platine,195.08,tr|Au,Or,196.97,tr|Hg,Mercure,200.59,tr|Tl,Thallium,204.38,pt|Pb,Plomb,207.2,pt|Bi,Bismuth,208.98,pt|Po,Polonium,209,pt|At,Astate,210,ha|Rn,Radon,222,ng|Fr,Francium,223,al|Ra,Radium,226,at|Ac,Actinium,227,ac|Th,Thorium,232.04,ac|Pa,Protactinium,231.04,ac|U,Uranium,238.03,ac|Np,Neptunium,237,ac|Pu,Plutonium,244,ac|Am,Américium,243,ac|Cm,Curium,247,ac|Bk,Berkélium,247,ac|Cf,Californium,251,ac|Es,Einsteinium,252,ac|Fm,Fermium,257,ac|Md,Mendélévium,258,ac|No,Nobélium,259,ac|Lr,Lawrencium,266,ac|Rf,Rutherfordium,267,tr|Db,Dubnium,268,tr|Sg,Seaborgium,269,tr|Bh,Bohrium,270,tr|Hs,Hassium,277,tr|Mt,Meitnérium,278,in|Ds,Darmstadtium,281,in|Rg,Roentgenium,282,in|Cn,Copernicium,285,tr|Nh,Nihonium,286,in|Fl,Flérovium,289,in|Mc,Moscovium,290,in|Lv,Livermorium,293,in|Ts,Tennesse,294,in|Og,Oganesson,294,in"
  .split("|").map((x, i) => { const [s, n, m, k] = x.split(","); return { z: i + 1, s, n, m: Number(m), k }; });
const CAT_EL = { nm: "Non-métal", ng: "Gaz noble", al: "Métal alcalin", at: "Métal alcalino-terreux", md: "Métalloïde", ha: "Halogène", pt: "Métal pauvre", tr: "Métal de transition", ln: "Lanthanide", ac: "Actinide", in: "Propriétés inconnues" };
function posElement(z){
  if (z === 1) return [1, 1]; if (z === 2) return [1, 18];
  const P = [[3, 10, 2], [11, 18, 3], [19, 36, 4], [37, 54, 5], [55, 86, 6], [87, 118, 7]];
  for (const [a, b, p] of P) if (z >= a && z <= b) {
    const k = z - a;
    if (p <= 3) return [p, k < 2 ? k + 1 : k + 11];
    if (p <= 5) return [p, k + 1];
    if ((p === 6 && z >= 57 && z <= 71) || (p === 7 && z >= 89 && z <= 103)) return [p === 6 ? 9 : 10, 3 + (z - (p === 6 ? 57 : 89))];
    return [p, k < 2 ? k + 1 : k - 14 + 1 + (k >= 17 ? 0 : 0)];
  }
}
function configElec(z){
  const O = ["1s", "2s", "2p", "3s", "3p", "4s", "3d", "4p", "5s", "4d", "5p", "6s", "4f", "5d", "6p", "7s", "5f", "6d", "7p"], cap = { s: 2, p: 6, d: 10, f: 14 };
  let r = z; const out = []; for (const o of O) { if (r <= 0) break; const n = Math.min(cap[o[1]], r); out.push([o, n]); r -= n; }
  const ex = { 24: [["4s", 1], ["3d", 5]], 29: [["4s", 1], ["3d", 10]], 42: [["5s", 1], ["4d", 5]], 47: [["5s", 1], ["4d", 10]], 79: [["6s", 1], ["5d", 10]], 46: [["5s", 0], ["4d", 10]] };
  if (ex[z]) ex[z].forEach(([o, n]) => { const x = out.find(y => y[0] === o); if (x) x[1] = n; });
  return out.filter(x => x[1] > 0).map(([o, n]) => o + "<sup>" + n + "</sup>").join(" ");
}
const CONSTANTES = [["Vitesse de la lumière dans le vide", "c", "2,998 × 10⁸", "m·s⁻¹", "299792458"], ["Intensité de la pesanteur (Terre)", "g", "9,81", "N·kg⁻¹", "9.81"], ["Constante de gravitation universelle", "G", "6,674 × 10⁻¹¹", "N·m²·kg⁻²", "6.674e-11"], ["Constante d'Avogadro", "Nₐ", "6,022 × 10²³", "mol⁻¹", "6.022e23"], ["Charge élémentaire", "e", "1,602 × 10⁻¹⁹", "C", "1.602e-19"], ["Constante de Planck", "h", "6,626 × 10⁻³⁴", "J·s", "6.626e-34"], ["Masse de l'électron", "mₑ", "9,109 × 10⁻³¹", "kg", "9.109e-31"], ["Masse du proton", "mₚ", "1,673 × 10⁻²⁷", "kg", "1.673e-27"], ["Masse du neutron", "mₙ", "1,675 × 10⁻²⁷", "kg", "1.675e-27"], ["Constante de Boltzmann", "k_B", "1,381 × 10⁻²³", "J·K⁻¹", "1.381e-23"], ["Constante des gaz parfaits", "R", "8,314", "J·mol⁻¹·K⁻¹", "8.314"], ["Constante de Coulomb", "k", "8,988 × 10⁹", "N·m²·C⁻²", "8.988e9"], ["Permittivité du vide", "ε₀", "8,854 × 10⁻¹²", "F·m⁻¹", "8.854e-12"], ["Perméabilité du vide", "μ₀", "1,257 × 10⁻⁶", "H·m⁻¹", "1.257e-6"], ["Volume molaire (0 °C, 1 bar)", "Vₘ", "22,7", "L·mol⁻¹", "22.7"], ["Volume molaire (20 °C, 1 atm)", "Vₘ", "24,0", "L·mol⁻¹", "24.0"], ["Pression atmosphérique normale", "P₀", "1,013 × 10⁵", "Pa", "101325"], ["Masse volumique de l'eau", "ρ", "1,00 × 10³", "kg·m⁻³", "1000"], ["Capacité thermique massique de l'eau", "c", "4,18 × 10³", "J·kg⁻¹·K⁻¹", "4180"], ["Électronvolt", "eV", "1,602 × 10⁻¹⁹", "J", "1.602e-19"], ["Unité astronomique", "ua", "1,496 × 10¹¹", "m", "1.496e11"], ["Année-lumière", "a.l.", "9,461 × 10¹⁵", "m", "9.461e15"], ["Masse de la Terre", "M_T", "5,972 × 10²⁴", "kg", "5.972e24"], ["Rayon de la Terre", "R_T", "6,371 × 10⁶", "m", "6.371e6"], ["Masse du Soleil", "M_S", "1,989 × 10³⁰", "kg", "1.989e30"], ["Produit ionique de l'eau (25 °C)", "Kₑ", "1,0 × 10⁻¹⁴", "", "1e-14"], ["Vitesse du son dans l'air (20 °C)", "v", "343", "m·s⁻¹", "343"]];
const UNITES = {
  "Longueur": { base: "m", u: [["km", 1e3], ["m", 1], ["dm", .1], ["cm", .01], ["mm", 1e-3], ["µm", 1e-6], ["nm", 1e-9], ["pm", 1e-12], ["Å (angström)", 1e-10], ["ua", 1.496e11], ["a.l.", 9.461e15], ["mile", 1609.344], ["pouce", .0254]] },
  "Masse": { base: "kg", u: [["t", 1e3], ["kg", 1], ["g", 1e-3], ["mg", 1e-6], ["µg", 1e-9], ["u (unité de masse atomique)", 1.6605e-27], ["livre (lb)", .45359]] },
  "Volume": { base: "m³", u: [["m³", 1], ["dm³", 1e-3], ["L", 1e-3], ["dL", 1e-4], ["cL", 1e-5], ["mL", 1e-6], ["cm³", 1e-6], ["mm³", 1e-9], ["µL", 1e-9]] },
  "Temps": { base: "s", u: [["an", 3.15576e7], ["jour", 86400], ["h", 3600], ["min", 60], ["s", 1], ["ms", 1e-3], ["µs", 1e-6], ["ns", 1e-9]] },
  "Vitesse": { base: "m/s", u: [["m/s", 1], ["km/h", 1 / 3.6], ["km/s", 1e3], ["nœud", .514444], ["c (vitesse de la lumière)", 299792458]] },
  "Pression": { base: "Pa", u: [["Pa", 1], ["hPa", 100], ["kPa", 1e3], ["MPa", 1e6], ["bar", 1e5], ["mbar", 100], ["atm", 101325], ["mmHg", 133.322]] },
  "Énergie": { base: "J", u: [["J", 1], ["kJ", 1e3], ["MJ", 1e6], ["Wh", 3600], ["kWh", 3.6e6], ["cal", 4.184], ["kcal", 4184], ["eV", 1.602177e-19], ["MeV", 1.602177e-13]] },
  "Puissance": { base: "W", u: [["W", 1], ["mW", 1e-3], ["kW", 1e3], ["MW", 1e6], ["GW", 1e9], ["ch (cheval-vapeur)", 735.499]] },
  "Concentration molaire": { base: "mol/L", u: [["mol/L", 1], ["mmol/L", 1e-3], ["µmol/L", 1e-6], ["mol/m³", 1e-3]] },
  "Concentration en masse": { base: "g/L", u: [["g/L", 1], ["mg/L", 1e-3], ["kg/m³", 1], ["g/mL", 1e3], ["µg/mL", 1e-3]] },
  "Angle": { base: "rad", u: [["rad", 1], ["°", Math.PI / 180], ["tour", 2 * Math.PI]] },
  "Quantité de données": { base: "o", u: [["o", 1], ["bit", 1 / 8], ["kbit", 125], ["Mbit", 125e3], ["Gbit", 125e6], ["ko", 1e3], ["Mo", 1e6], ["Go", 1e9], ["To", 1e12], ["Kio", 1024], ["Mio", 1024 ** 2], ["Gio", 1024 ** 3], ["Tio", 1024 ** 4]] },
  "Température": { temp: true, u: [["°C"], ["K"], ["°F"]] }
};
const versK = (v, u) => u === "K" ? v : u === "°C" ? v + 273.15 : (v - 32) * 5 / 9 + 273.15, depuisK = (k, u) => u === "K" ? k : u === "°C" ? k - 273.15 : (k - 273.15) * 9 / 5 + 32;
const fmtSci = x => { if (!isFinite(x)) return "—"; if (x === 0) return "0"; const a = Math.abs(x); if (a >= 1e-3 && a < 1e6) return String(Math.round(x * 1e6) / 1e6).replace(".", ","); const e = Math.floor(Math.log10(a)), m = x / 10 ** e; return (Math.round(m * 1000) / 1000).toString().replace(".", ",") + " × 10" + String(e).replace(/[-\d]/g, c => "⁻⁰¹²³⁴⁵⁶⁷⁸⁹"["-0123456789".indexOf(c)]); };
VUES_PRO.physique = function(){
  const ong = S.phyOng || "phys", O = [["unites", "Convertisseur d'unités", "ruler"], ["tableau", "Tableau périodique", "atom"], ["phys", "Physique", "pendule"], ["chimie", "Chimie", "flask"], ["formules", "Éditeur de formules", "edit"], ["mesures", "Mesures et incertitudes", "grade"], ["constantes", "Constantes", "key"], ["courbes", "Traceur de courbes", "chart"], ["snt", "SNT · bits et octets", "codeb"]];
  let corps = "";
  if (ong === "unites") {
    const g = S.phyG || "Longueur", G = UNITES[g], de = S.phyDe || G.u[0][0], vers = S.phyVers || (G.u[1] || G.u[0])[0], v = S.phyV ?? "1";
    const x = Number(String(v).replace(",", ".").replace(/\s/g, ""));
    let r = NaN; if (isFinite(x)) { if (G.temp) r = depuisK(versK(x, de), vers); else { const f1 = (G.u.find(u => u[0] === de) || [0, 1])[1], f2 = (G.u.find(u => u[0] === vers) || [0, 1])[1]; r = x * f1 / f2; } }
    corps = `<div class="convbloc"><div class="field"><label for="phyG">Grandeur</label><select id="phyG" data-phy="G">${Object.keys(UNITES).map(k => `<option ${k === g ? "selected" : ""}>${k}</option>`).join("")}</select></div>
      <div class="conv"><div class="convcote"><input id="phyV" data-phy="V" value="${esc(v)}" inputmode="decimal" aria-label="Valeur"><select data-phy="De" aria-label="Unité de départ">${G.u.map(u => `<option ${u[0] === de ? "selected" : ""}>${u[0]}</option>`).join("")}</select></div>
        <button class="ib" data-act="physwap" title="Inverser" aria-label="Inverser les unités">${icon("swap")}</button>
        <div class="convcote res"><output>${fmtSci(r)}</output><select data-phy="Vers" aria-label="Unité d'arrivée">${G.u.map(u => `<option ${u[0] === vers ? "selected" : ""}>${u[0]}</option>`).join("")}</select></div></div>
      ${!G.temp && isFinite(r) ? `<div class="convtous">${G.u.map(u => `<span><b>${fmtSci(x * (G.u.find(y => y[0] === de) || [0, 1])[1] / u[1])}</b> ${u[0]}</span>`).join("")}</div>` : ""}</div>`;
  } else if (ong === "tableau") {
    const sel = ELEM.find(e => e.z === (S.phyEl || 6)), q = sansAccent(S.phyElQ || "");
    corps = `<div class="ptq"><input type="search" data-phy="ElQ" placeholder="Chercher un élément (nom, symbole, Z)…" value="${esc(S.phyElQ || "")}" aria-label="Chercher un élément"></div>
      <div class="ptwrap"><div class="ptable">${ELEM.map(e => { const [r, c] = posElement(e.z), on = !q || sansAccent(e.n + " " + e.s).includes(q) || String(e.z) === q;
        return `<button class="pel k-${e.k}${e.z === sel.z ? " sel" : ""}${on ? "" : " off"}" style="grid-row:${r};grid-column:${c}" data-act="phyel" data-z="${e.z}" title="${esc(e.n)}"><small>${e.z}</small><b>${e.s}</b></button>`; }).join("")}
        <div class="ptlegende">${Object.entries(CAT_EL).map(([k, l]) => `<span class="k-${k}">${l}</span>`).join("")}</div>
        <div class="ptfiche k-${sel.k}"><div class="ptgros"><small>${sel.z}</small><b>${sel.s}</b><span>${fmtNote(sel.m)}</span></div><div><h3>${esc(sel.n)}</h3><p>${CAT_EL[sel.k]}</p><p>Numéro atomique <b>Z = ${sel.z}</b> · Masse molaire <b>${fmtNote(sel.m)} g·mol⁻¹</b></p><p>Configuration électronique : <span class="mono">${configElec(sel.z)}</span></p><p class="muted" style="font-size:.8rem">Période ${posElement(sel.z)[0] > 7 ? (sel.k === "ln" ? 6 : 7) : posElement(sel.z)[0]}${posElement(sel.z)[0] <= 7 ? " · Colonne " + posElement(sel.z)[1] : ""}</p></div></div>
      </div></div>`;
  } else if (ong === "constantes") {
    corps = `<div class="tablewrap"><table class="admtable consttab"><thead><tr><th class="first">Grandeur</th><th>Symbole</th><th>Valeur</th><th>Unité</th><th></th></tr></thead><tbody>${CONSTANTES.map(([n, s, v, u, brut]) => `<tr><td class="first">${n}</td><td class="mono"><b>${s}</b></td><td class="mono">${v}</td><td>${u}</td><td><button class="ib sm" data-act="phycopie" data-v="${brut}" title="Copier la valeur" aria-label="Copier ${esc(n)}">${icon("copy")}</button></td></tr>`).join("")}</tbody></table></div>`;
  } else if (OUTILS_PLUS[ong]) corps = OUTILS_PLUS[ong](); else corps = vueCourbes();
  return `<div class="page wide"><div class="homehead"><h1>Outils Scientifiques Importants</h1></div>
    <div class="phyongs" role="tablist">${O.map(([k, l, ic]) => `<button role="tab" aria-selected="${ong === k}" data-act="phyong" data-o="${k}">${icon(ic)}<span>${l}</span></button>`).join("")}</div>
    <section class="phycorps">${corps}</section>${pageFoot()}</div>`;
};
/* traceur de courbes : tableau de mesures → points, modèle (linéaire, affine, parabole, exponentielle), R² */
const CB = () => S.cb || (S.cb = { x: "x", y: "y", ux: "", uy: "", pts: [["0", "0"], ["1", "2.1"], ["2", "3.9"], ["3", "6.2"], ["4", "7.9"], ["", ""]], mod: "lineaire" });
function ajuster(P, mod){
  const n = P.length; if (n < 2) return null;
  const sx = P.reduce((a, p) => a + p[0], 0), sy = P.reduce((a, p) => a + p[1], 0), sxx = P.reduce((a, p) => a + p[0] * p[0], 0), sxy = P.reduce((a, p) => a + p[0] * p[1], 0);
  let f, txt, k = [];
  if (mod === "lineaire") { const a = sxy / sxx; f = x => a * x; txt = `y = ${fmtSci(a)} × x`; k = [a]; }
  else if (mod === "affine") { const a = (n * sxy - sx * sy) / (n * sxx - sx * sx), b = (sy - a * sx) / n; f = x => a * x + b; txt = `y = ${fmtSci(a)} × x ${b < 0 ? "−" : "+"} ${fmtSci(Math.abs(b))}`; k = [a, b]; }
  else if (mod === "parabole") { if (n < 3) return null; const S4 = [0, 1, 2, 3, 4].map(e => P.reduce((a, p) => a + p[0] ** e, 0)), T = [0, 1, 2].map(e => P.reduce((a, p) => a + p[0] ** e * p[1], 0));
    const M = [[S4[4], S4[3], S4[2], T[2]], [S4[3], S4[2], S4[1], T[1]], [S4[2], S4[1], S4[0], T[0]]];
    for (let i = 0; i < 3; i++) { const piv = M[i][i]; if (!piv) return null; for (let j = i; j < 4; j++) M[i][j] /= piv; for (let r = 0; r < 3; r++) if (r !== i) { const fct = M[r][i]; for (let j = i; j < 4; j++) M[r][j] -= fct * M[i][j]; } }
    const [a, b, c] = [M[0][3], M[1][3], M[2][3]]; f = x => a * x * x + b * x + c; txt = `y = ${fmtSci(a)} x² ${b < 0 ? "−" : "+"} ${fmtSci(Math.abs(b))} x ${c < 0 ? "−" : "+"} ${fmtSci(Math.abs(c))}`; }
  else { const Q = P.filter(p => p[1] > 0); if (Q.length < 2) return null; const r = ajuster(Q.map(p => [p[0], Math.log(p[1])]), "affine"); const A = Math.exp(r.k[1]), kk = r.k[0]; f = x => A * Math.exp(kk * x); txt = `y = ${fmtSci(A)} × e^(${fmtSci(kk)} x)`; }
  const my = sy / n, ssr = P.reduce((a, p) => a + (p[1] - f(p[0])) ** 2, 0), sst = P.reduce((a, p) => a + (p[1] - my) ** 2, 0);
  return { f, txt, r2: sst ? 1 - ssr / sst : 1, k };
}
function vueCourbes(){
  const c = CB();
  return `<div class="cbgrille"><div class="cbdonnees">
      <div class="cbaxes"><label>Abscisse <input data-cb="x" value="${esc(c.x)}" aria-label="Nom de l'abscisse"></label><label>unité <input data-cb="ux" value="${esc(c.ux)}" aria-label="Unité de l'abscisse" placeholder="s"></label>
        <label>Ordonnée <input data-cb="y" value="${esc(c.y)}" aria-label="Nom de l'ordonnée"></label><label>unité <input data-cb="uy" value="${esc(c.uy)}" aria-label="Unité de l'ordonnée" placeholder="m"></label></div>
      <table class="cbtab"><thead><tr><th>${esc(c.x)}</th><th>${esc(c.y)}</th><th></th></tr></thead><tbody>${c.pts.map((p, i) => `<tr><td><input data-cbp="${i}" data-c="0" value="${esc(p[0])}" inputmode="decimal"></td><td><input data-cbp="${i}" data-c="1" value="${esc(p[1])}" inputmode="decimal"></td><td><button class="ib sm" data-act="cbsuppr" data-i="${i}" aria-label="Supprimer la ligne">${icon("x")}</button></td></tr>`).join("")}</tbody></table>
      <div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn ghost sm" data-act="cbligne">${icon("plus")} Ligne</button><button class="btn ghost sm" data-act="cbvider">Vider</button></div>
      <p class="muted" style="font-size:.78rem;margin:0">Astuce : copie deux colonnes depuis Excel ou Regressi et colle-les dans la première case (Ctrl+V).</p></div>
    <div class="cbgraphe"><div class="cbmod">${[["lineaire", "Linéaire y = a·x"], ["affine", "Affine y = a·x + b"], ["parabole", "Parabole"], ["expo", "Exponentielle"]].map(([k, l]) => `<button class="thbtn${c.mod === k ? " on" : ""}" data-act="cbmod" data-m="${k}">${l}</button>`).join("")}</div>
      <canvas id="cbCanvas" width="760" height="460" aria-label="Graphique des mesures"></canvas><div id="cbRes" class="cbres"></div>
      <button class="btn ghost sm" data-act="cbpng">${icon("down")} Télécharger l'image</button></div></div>`;
}
function dessinerCourbe(){
  const cv = document.getElementById("cbCanvas"); if (!cv) return; const c = CB(), g = cv.getContext("2d"), W = cv.width, H = cv.height, m = { l: 64, r: 20, t: 20, b: 48 };
  const valides = c.pts.filter(p => String(p[0]).trim() !== "" && String(p[1]).trim() !== "").map(p => [Number(String(p[0]).replace(",", ".")), Number(String(p[1]).replace(",", "."))]).filter(p => isFinite(p[0]) && isFinite(p[1]));
  const st = getComputedStyle(document.documentElement), ink = st.getPropertyValue("--ink").trim() || "#0B1F28", mut = st.getPropertyValue("--muted").trim() || "#536973", line = st.getPropertyValue("--line").trim() || "#D9E4E8", acc = st.getPropertyValue("--accent").trim() || "#116482";
  g.clearRect(0, 0, W, H); g.fillStyle = st.getPropertyValue("--surface").trim() || "#fff"; g.fillRect(0, 0, W, H);
  const res = document.getElementById("cbRes");
  if (!valides.length) { g.fillStyle = mut; g.font = "15px sans-serif"; g.fillText("Saisis des mesures dans le tableau.", m.l, H / 2); if (res) res.innerHTML = ""; return; }
  let x0 = Math.min(0, ...valides.map(p => p[0])), x1 = Math.max(...valides.map(p => p[0])), y0 = Math.min(0, ...valides.map(p => p[1])), y1 = Math.max(...valides.map(p => p[1]));
  if (x1 === x0) x1 = x0 + 1; if (y1 === y0) y1 = y0 + 1; const px = (x1 - x0) * .06, py = (y1 - y0) * .08; x1 += px; y1 += py; if (x0 < 0) x0 -= px; if (y0 < 0) y0 -= py;
  const X = x => m.l + (x - x0) / (x1 - x0) * (W - m.l - m.r), Y = y => H - m.b - (y - y0) / (y1 - y0) * (H - m.t - m.b);
  const pas = (a, b) => { const r = (b - a) / 6, p = 10 ** Math.floor(Math.log10(r)), n = r / p; return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * p; };
  g.font = "12px sans-serif"; g.lineWidth = 1;
  const sx = pas(x0, x1), sy = pas(y0, y1);
  for (let v = Math.ceil(x0 / sx) * sx; v <= x1; v += sx) { g.strokeStyle = line; g.beginPath(); g.moveTo(X(v), m.t); g.lineTo(X(v), H - m.b); g.stroke(); g.fillStyle = mut; g.textAlign = "center"; g.fillText(fmtSci(Math.round(v / sx) * sx), X(v), H - m.b + 16); }
  for (let v = Math.ceil(y0 / sy) * sy; v <= y1; v += sy) { g.strokeStyle = line; g.beginPath(); g.moveTo(m.l, Y(v)); g.lineTo(W - m.r, Y(v)); g.stroke(); g.fillStyle = mut; g.textAlign = "right"; g.fillText(fmtSci(Math.round(v / sy) * sy), m.l - 6, Y(v) + 4); }
  g.strokeStyle = ink; g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(m.l, Y(Math.min(Math.max(0, y0), y1))); g.lineTo(W - m.r, Y(Math.min(Math.max(0, y0), y1))); g.moveTo(X(Math.min(Math.max(0, x0), x1)), m.t); g.lineTo(X(Math.min(Math.max(0, x0), x1)), H - m.b); g.stroke();
  g.fillStyle = ink; g.textAlign = "center"; g.font = "600 13px sans-serif"; g.fillText(c.x + (c.ux ? " (" + c.ux + ")" : ""), (m.l + W - m.r) / 2, H - 10);
  g.save(); g.translate(16, (m.t + H - m.b) / 2); g.rotate(-Math.PI / 2); g.fillText(c.y + (c.uy ? " (" + c.uy + ")" : ""), 0, 0); g.restore();
  const fit = ajuster(valides, c.mod);
  if (fit) { g.strokeStyle = "#E8710A"; g.lineWidth = 2; g.beginPath(); let d = false; for (let i = 0; i <= 200; i++) { const x = x0 + (x1 - x0) * i / 200, y = fit.f(x); if (!isFinite(y) || y < y0 - (y1 - y0) || y > y1 + (y1 - y0)) { d = false; continue; } d ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)); d = true; } g.stroke(); }
  g.fillStyle = acc; valides.forEach(p => { g.beginPath(); g.moveTo(X(p[0]) - 5, Y(p[1])); g.lineTo(X(p[0]) + 5, Y(p[1])); g.moveTo(X(p[0]), Y(p[1]) - 5); g.lineTo(X(p[0]), Y(p[1]) + 5); g.strokeStyle = acc; g.lineWidth = 2; g.stroke(); });
  if (res) res.innerHTML = fit ? `<b>Modèle :</b> <span class="mono">${esc(fit.txt.replace(/\by\b/, c.y).replace(/\bx\b/g, c.x))}</span> · <b>R²</b> = <span class="mono">${fit.r2.toFixed(4).replace(".", ",")}</span>${fit.r2 > .99 ? " <span class=\"pill ok\">très bon accord</span>" : fit.r2 > .95 ? " <span class=\"pill\">accord correct</span>" : " <span class=\"pill bad\">modèle peu adapté</span>"}` : `<span class="muted">Pas assez de points pour ce modèle.</span>`;
}
document.addEventListener("click", async e => {
  const a = e.target.closest && e.target.closest('[data-act^="phy"],[data-act^="cb"]'); if (!a) return; const act = a.dataset.act; e.preventDefault(); e.stopPropagation(); const c = CB();
  if (act === "phyong") S.phyOng = a.dataset.o;
  else if (act === "physwap") { const g = UNITES[S.phyG || "Longueur"], de = S.phyDe || g.u[0][0], v = S.phyVers || (g.u[1] || g.u[0])[0]; S.phyDe = v; S.phyVers = de; }
  else if (act === "phyel") S.phyEl = Number(a.dataset.z);
  else if (act === "phycopie") { try { await navigator.clipboard.writeText(a.dataset.v); toast("Valeur copiée : " + a.dataset.v); } catch (_) {} return; }
  else if (act === "cbmod") c.mod = a.dataset.m;
  else if (act === "cbligne") c.pts.push(["", ""]);
  else if (act === "cbsuppr") { c.pts.splice(Number(a.dataset.i), 1); if (!c.pts.length) c.pts.push(["", ""]); }
  else if (act === "cbvider") c.pts = [["", ""], ["", ""], ["", ""]];
  else if (act === "cbpng") { const cv = document.getElementById("cbCanvas"); const l = document.createElement("a"); l.download = "courbe-" + sansAccent(c.y + "-" + c.x).replace(/[^a-z0-9]+/g, "-") + ".png"; l.href = cv.toDataURL("image/png"); l.click(); return; }
  else return;
  render();
}, true);
document.addEventListener("change", e => { const d = e.target.dataset || {}; if (!d.phy) return;
  if (d.phy === "G") { S.phyG = e.target.value; S.phyDe = S.phyVers = null; } else if (d.phy === "De") S.phyDe = e.target.value; else if (d.phy === "Vers") S.phyVers = e.target.value; else return; render(); });
document.addEventListener("input", e => { const d = e.target.dataset || {}, c = S.cb;
  if (d.phy === "V") { S.phyV = e.target.value; const o = document.querySelector(".convcote.res output"); const G = UNITES[S.phyG || "Longueur"], de = S.phyDe || G.u[0][0], vers = S.phyVers || (G.u[1] || G.u[0])[0], x = Number(String(S.phyV).replace(",", ".").replace(/\s/g, ""));
    if (o) o.textContent = !isFinite(x) ? "—" : fmtSci(G.temp ? depuisK(versK(x, de), vers) : x * (G.u.find(u => u[0] === de) || [0, 1])[1] / (G.u.find(u => u[0] === vers) || [0, 1])[1]);
    const t = document.querySelector(".convtous"); if (t && !G.temp && isFinite(x)) t.innerHTML = G.u.map(u => `<span><b>${fmtSci(x * (G.u.find(y => y[0] === de) || [0, 1])[1] / u[1])}</b> ${u[0]}</span>`).join(""); return; }
  if (d.phy === "ElQ") { S.phyElQ = e.target.value; const q = sansAccent(S.phyElQ); document.querySelectorAll(".pel").forEach(b => { const el = ELEM[Number(b.dataset.z) - 1]; b.classList.toggle("off", !!q && !sansAccent(el.n + " " + el.s).includes(q) && String(el.z) !== q); }); return; }
  if (d.cb && c) { c[d.cb] = e.target.value; dessinerCourbe(); return; }
  if (d.cbp != null && c) { c.pts[Number(d.cbp)][Number(d.c)] = e.target.value; if (Number(d.cbp) === c.pts.length - 1 && e.target.value) { c.pts.push(["", ""]); const tb = document.querySelector(".cbtab tbody"); if (tb) tb.insertAdjacentHTML("beforeend", `<tr><td><input data-cbp="${c.pts.length - 1}" data-c="0" inputmode="decimal"></td><td><input data-cbp="${c.pts.length - 1}" data-c="1" inputmode="decimal"></td><td><button class="ib sm" data-act="cbsuppr" data-i="${c.pts.length - 1}" aria-label="Supprimer la ligne">${icon("x")}</button></td></tr>`); } dessinerCourbe(); }
});
document.addEventListener("paste", e => { const t = e.target; if (!t.dataset || t.dataset.cbp == null) return; const txt = (e.clipboardData || {}).getData ? e.clipboardData.getData("text") : ""; if (!/[\t;\n]/.test(txt)) return;
  e.preventDefault(); const L = txt.trim().split(/\r?\n/).map(l => l.split(/\t|;/).map(x => x.trim())).filter(l => l.length >= 2 && l[0] !== "");
  const debut = L.length && isNaN(Number(L[0][0].replace(",", "."))) ? L.shift() : null; const c = CB(); if (debut) { c.x = debut[0]; c.y = debut[1]; }
  c.pts = [...L.map(l => [l[0], l[1]]), ["", ""]]; render(); });
new MutationObserver(() => { if (document.getElementById("cbCanvas") && !document.getElementById("cbCanvas").dataset.ok) { document.getElementById("cbCanvas").dataset.ok = 1; dessinerCourbe(); } }).observe(document.documentElement, { childList: true, subtree: true });

/* ---------- #14 Révisions : flashcards par chapitre (thème), mode « révision » ---------- */
const FC = { cours: {}, rev: null };
async function chargerFlash(cid, force){ if (FC.cours[cid] && !force) return FC.cours[cid]; const [r] = await Promise.all([sb.from("flashcards").select("*").eq("classe_id", cid).order("ordre").order("id"), chargerClasse(cid)]); FC.cours[cid] = r.error ? { err: r.error.message, l: [] } : { l: r.data }; return FC.cours[cid]; }
const scoresFC = () => { try { return JSON.parse(localStorage.getItem("pp_fc_" + (S.user && S.user.id)) || "{}"); } catch (_) { return {}; } };
const memoScore = (id, ok) => { const s = scoresFC(); const v = s[id] || { ok: 0, ko: 0 }; ok ? v.ok++ : v.ko++; v.d = Date.now(); s[id] = v; try { localStorage.setItem("pp_fc_" + S.user.id, JSON.stringify(s)); } catch (_) {} };
VUES_PRO.revisions = function(r){
  const act = actives(); if (!act.length) return `<div class="page"><div class="emptystate"><b>Aucun cours.</b></div></div>`;
  const cid = cls(S.fcCours) && !cls(S.fcCours).archive ? S.fcCours : act[0].id, c = cls(cid);
  const d = FC.cours[cid]; if (!d) { chargerFlash(cid).then(() => { if (route().v === "revisions") render(); }); return squelette(); }
  if (FC.rev && FC.rev.cid === cid) return vueRevision(c);
  const data = S.cache[cid] || { themes: [], supports: [] }, sc = scoresFC();
  const groupes = [...data.themes.map(t => ({ id: t.id, titre: t.titre })), { id: null, titre: "Sans chapitre" }].map(g => ({ ...g, cartes: d.l.filter(x => (x.theme_id ?? null) === g.id), docs: data.supports.filter(s => (s.theme_id ?? null) === g.id && !s.brouillon && D(s.publie_le) <= now()) })).filter(g => g.cartes.length || g.docs.length || (S.prof && g.id != null));
  const maitrise = L => { const v = L.map(x => sc[x.id]).filter(Boolean); if (!L.length) return 0; return Math.round(L.filter(x => sc[x.id] && sc[x.id].ok > sc[x.id].ko).length / L.length * 100); };
  return `<div class="page wide" style="--c:var(${C(c.couleur).c})"><div class="homehead"><h1>Révisions et flashcards</h1>
      <div class="field filt"><label for="fcC">Cours</label><select id="fcC" data-fcc="1">${act.map(x => `<option value="${esc(x.id)}" ${x.id === cid ? "selected" : ""}>${esc(x.nom)}</option>`).join("")}</select></div></div>
    <p class="muted" style="margin:0">${S.prof ? "Crée des cartes question/réponse pour chaque chapitre : les élèves les révisent, les cartes ratées reviennent jusqu'à ce qu'elles soient sues." : "Choisis un chapitre et révise : retourne la carte, puis dis si tu savais. Les cartes ratées reviennent jusqu'à ce que tu les saches."}</p>
    ${d.err ? `<p class="err">${esc(d.err)}</p>` : ""}
    ${d.l.length ? `<div><button class="btn" data-act="fcrev" data-t="tout">${icon("cards")} Réviser tout le cours (${d.l.length} cartes)</button></div>` : ""}
    <div class="fcgrille">${groupes.filter(g => S.prof || g.cartes.length).map(g => { const m = maitrise(g.cartes); return `<section class="fcchap"><div class="fcchaph"><h2>${esc(g.titre)}</h2>${g.cartes.length ? `<span class="fcmaitr" title="Cartes sues"><i style="width:${m}%"></i></span><small>${m} %</small>` : ""}</div>
        <p class="muted" style="margin:0;font-size:.85rem">${g.cartes.length} carte${g.cartes.length > 1 ? "s" : ""}${g.docs.length ? ` · ${g.docs.length} fiche${g.docs.length > 1 ? "s" : ""} de cours` : ""}</p>
        ${g.docs.length ? `<div class="fcdocs">${g.docs.slice(0, 4).map(s => `<a href="#/classe/${esc(cid)}/travaux">${icon("support")} ${esc(s.titre)}</a>`).join("")}</div>` : ""}
        <div class="fcact">${g.cartes.length ? `<button class="btn tonal sm" data-act="fcrev" data-t="${g.id ?? "none"}">${icon("cards")} Réviser</button>` : ""}${S.prof ? `<button class="btn ghost sm" data-act="fcedit" data-t="${g.id ?? "none"}">${icon("edit")} ${g.cartes.length ? "Modifier les cartes" : "Créer des cartes"}</button>` : ""}</div>
        ${S.prof && String(S.fcEdit) === String(g.id ?? "none") ? editeurCartes(cid, g) : ""}</section>`; }).join("") || `<div class="emptystate"><b>Pas encore de cartes de révision dans ce cours.</b></div>`}</div>${pageFoot()}</div>`;
};
function editeurCartes(cid, g){
  return `<div class="fcedit"><div class="fcliste">${g.cartes.map(x => `<div class="fcligne"><span><b>${esc(x.recto)}</b><small>${esc(x.verso)}</small></span><button class="ib sm" data-act="fcsuppr" data-id="${x.id}" aria-label="Supprimer la carte">${icon("trash")}</button></div>`).join("")}</div>
    <div class="field"><label for="fcNew">Ajouter des cartes : une par ligne, sous la forme <b>question ; réponse</b></label><textarea id="fcNew" rows="5" placeholder="Unité de la quantité de matière ; la mole (mol)&#10;Formule de la concentration en masse ; Cm = m / V"></textarea></div>
    <div style="display:flex;gap:8px"><button class="btn" data-act="fcajout" data-c="${esc(cid)}" data-t="${g.id ?? "none"}">${icon("plus")} Ajouter</button><button class="btn ghost" data-act="fcedit" data-t="">Fermer</button></div></div>`;
}
function vueRevision(c){
  const R2 = FC.rev, carte = R2.file[0];
  if (!carte) return `<div class="page" style="--c:var(${C(c.couleur).c})"><div class="fcfin"><svg viewBox="0 0 52 52" class="fcok"><circle cx="26" cy="26" r="24"/><path d="M14 27l8 8 16-17"/></svg><h2>Révision terminée !</h2>
    <p>${R2.total} carte${R2.total > 1 ? "s" : ""} · <b>${R2.premierCoup}</b> sue${R2.premierCoup > 1 ? "s" : ""} du premier coup${R2.total - R2.premierCoup ? `, ${R2.total - R2.premierCoup} revue${R2.total - R2.premierCoup > 1 ? "s" : ""} plusieurs fois` : ""}.</p>
    <div style="display:flex;gap:8px;justify-content:center"><button class="btn" data-act="fcrev" data-t="${R2.t}">${icon("restore")} Recommencer</button><button class="btn ghost" data-act="fcquitter">Retour aux chapitres</button></div></div>${pageFoot()}</div>`;
  const fait = R2.total - R2.file.length;
  return `<div class="page" style="--c:var(${C(c.couleur).c})"><div class="fcrevtete"><button class="btn ghost sm" data-act="fcquitter">${icon("left")} Chapitres</button><span class="fcprog"><i style="width:${Math.round(fait / R2.total * 100)}%"></i></span><small class="muted">${fait}/${R2.total}</small></div>
    <button class="fccarte${R2.retournee ? " retournee" : ""}" data-act="fcflip" aria-label="Retourner la carte (Espace)"><span class="fcface fcrecto"><small>Question</small><b>${esc(carte.recto)}</b><em>Clique ou appuie sur Espace pour voir la réponse</em></span><span class="fcface fcverso"><small>Réponse</small><b>${esc(carte.verso)}</b></span></button>
    ${R2.retournee ? `<div class="fcrep"><button class="btn danger" data-act="fcnon">${icon("x")} À revoir <kbd>1</kbd></button><button class="btn" data-act="fcoui">${icon("check")} Je savais <kbd>2</kbd></button></div>` : `<div class="fcrep"><button class="btn tonal" data-act="fcflip">Voir la réponse <kbd>Espace</kbd></button></div>`}${pageFoot()}</div>`;
}
document.addEventListener("change", e => { if (e.target.dataset && e.target.dataset.fcc) { S.fcCours = e.target.value; FC.rev = null; S.fcEdit = null; render(); } });
document.addEventListener("click", async e => {
  const a = e.target.closest && e.target.closest('[data-act^="fc"]'); if (!a) return; const act = a.dataset.act; e.preventDefault(); e.stopPropagation();
  const cid = cls(S.fcCours) && !cls(S.fcCours).archive ? S.fcCours : (actives()[0] || {}).id, d = FC.cours[cid];
  if (act === "fcrev") { const L = d.l.filter(x => a.dataset.t === "tout" || String(x.theme_id ?? "none") === a.dataset.t); const sc = scoresFC();
    const file = L.slice().sort((x, y) => ((sc[y.id] || {}).ko || 0) - ((sc[x.id] || {}).ko || 0) || Math.random() - .5);
    FC.rev = { cid, t: a.dataset.t, file, total: file.length, rate: new Set(), premierCoup: 0, retournee: false }; }
  else if (act === "fcflip") { if (!FC.rev) return; FC.rev.retournee = !FC.rev.retournee; const k = document.querySelector(".fccarte"), z = document.querySelector(".fcrep");
    if (k && z) { k.classList.toggle("retournee", FC.rev.retournee); z.innerHTML = FC.rev.retournee ? `<button class="btn danger" data-act="fcnon">${icon("x")} À revoir <kbd>1</kbd></button><button class="btn" data-act="fcoui">${icon("check")} Je savais <kbd>2</kbd></button>` : `<button class="btn tonal" data-act="fcflip">Voir la réponse <kbd>Espace</kbd></button>`; return; } }
  else if (act === "fcoui" || act === "fcnon") { sortieCarte(act === "fcoui" ? 1 : -1); const R2 = FC.rev, x = R2.file.shift(); memoScore(x.id, act === "fcoui");
    if (act === "fcoui") { if (!R2.rate.has(x.id)) R2.premierCoup++; } else { R2.rate.add(x.id); R2.file.splice(Math.min(R2.file.length, 3), 0, x); } R2.retournee = false; if (!R2.file.length) celebrer("Révision terminée !"); }
  else if (act === "fcquitter") FC.rev = null;
  else if (act === "fcedit") S.fcEdit = a.dataset.t || null;
  else if (act === "fcajout") { const lignes = ((document.getElementById("fcNew") || {}).value || "").split(/\r?\n/).map(l => l.split(/\s*[;|]\s*|\t/)).filter(p => p.length >= 2 && p[0].trim() && p.slice(1).join(" ; ").trim());
    if (!lignes.length) { toast("Écris au moins une ligne « question ; réponse »."); return; }
    const t = a.dataset.t === "none" ? null : Number(a.dataset.t), base = d.l.length;
    const { error } = await sb.from("flashcards").insert(lignes.map((p, i) => ({ classe_id: a.dataset.c, theme_id: t, recto: p[0].trim(), verso: p.slice(1).join(" ; ").trim(), ordre: base + i })));
    if (error) { toast("Ajout impossible : " + error.message); return; } await chargerFlash(a.dataset.c, true); toast(lignes.length + " carte" + (lignes.length > 1 ? "s ajoutées" : " ajoutée")); }
  else if (act === "fcsuppr") { const { error } = await sb.from("flashcards").delete().eq("id", Number(a.dataset.id)); if (error) { toast("Suppression impossible : " + error.message); return; } await chargerFlash(cid, true); }
  render();
}, true);
document.addEventListener("keydown", e => { if (!FC.rev || route().v !== "revisions" || /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || "")) return;
  const clic = s => { const b = document.querySelector(`[data-act="${s}"]`); if (b) { e.preventDefault(); b.click(); } };
  if (e.key === " ") clic("fcflip"); else if (e.key === "1" && FC.rev.retournee) clic("fcnon"); else if (e.key === "2" && FC.rev.retournee) clic("fcoui"); });

/* ---------- Compteur de visites (prof) : comptes, visites, personnes en ligne ---------- */
let presenceOn = false, presenceRpc = true;
function idSession(){ const k = "pp_sess_" + (S.user && S.user.id); try { let v = sessionStorage.getItem(k); if (!v) { v = (crypto.randomUUID ? crypto.randomUUID() : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16))); sessionStorage.setItem(k, v); } return v; } catch (_) { return null; } }
function nomAppareil(){
  const u = navigator.userAgent, os = /iPhone/.test(u) ? "iPhone" : /iPad/.test(u) ? "iPad" : /Android/.test(u) ? "Android" : /Windows/.test(u) ? "Windows" : /Mac OS X/.test(u) ? "Mac" : /CrOS/.test(u) ? "Chromebook" : /Linux/.test(u) ? "Linux" : "Appareil";
  const nav = /Edg\//.test(u) ? "Edge" : /OPR\//.test(u) ? "Opera" : /Firefox\//.test(u) ? "Firefox" : /Chrome\//.test(u) ? "Chrome" : /Safari\//.test(u) ? "Safari" : "Navigateur";
  return os + " · " + nav + (window.matchMedia && matchMedia("(display-mode: standalone)").matches ? " (application)" : "");
}
async function signalerPresence(){
  if (!S.user) return;
  const id = idSession();
  if (presenceRpc && id) {
    const { data, error } = await sb.rpc("pp_presence", { p_session: id, p_appareil: nomAppareil(), p_visible: document.visibilityState === "visible" });
    if (!error) { if (data === true) deconnexionForcee(); return; }
    if (/pp_presence|function/i.test(error.message || "")) presenceRpc = false;   // étape 23 pas encore installée
  }
  if (document.visibilityState === "visible") sb.rpc("pp_visite").then(() => {}, () => {});
}
async function deconnexionForcee(){
  try { sessionStorage.removeItem("pp_sess_" + (S.user && S.user.id)); sessionStorage.setItem("pp_kick", "1"); } catch (_) {}
  try { await sb.auth.signOut({ scope: "local" }); } catch (_) {}
  /* on ferme aussi la session Microsoft de ce navigateur, sinon l'élève suivant serait connecté automatiquement */
  location.replace("https://login.microsoftonline.com/common/oauth2/v2.0/logout?post_logout_redirect_uri=" + encodeURIComponent(ICI));
}
function demarrerPresence(){
  if (presenceOn) return; presenceOn = true;
  signalerPresence();
  setInterval(signalerPresence, 30000);
  document.addEventListener("visibilitychange", signalerPresence); window.addEventListener("pagehide", signalerPresence);
  if (S.prof) { chargerStatsVisites(); setInterval(chargerStatsVisites, 60000); }
}
async function chargerStatsVisites(){
  if (!S.prof) return; const { data, error } = await sb.rpc("pp_stats_visites"); if (error || !data) return;
  S.stv = typeof data === "string" ? JSON.parse(data) : data; document.querySelectorAll(".compteur").forEach(z => z.outerHTML = compteurVisites());
}
function compteurVisites(){
  if (!S.prof || !S.stv) return S.prof ? `<div class="compteur"></div>` : "";
  const v = S.stv, noms = (v.noms || []).slice(0, 12);
  return `<div class="compteur"><span class="cpt" title="Élèves qui se sont déjà connectés au site">${icon("people")}<b>${v.comptes}</b> élève${v.comptes > 1 ? "s" : ""} déjà connecté${v.comptes > 1 ? "s" : ""}</span>
    <span class="cpt" title="Visites des élèves (une nouvelle visite après 30 minutes d'absence)">${icon("eye")}<b>${v.visites}</b> visite${v.visites > 1 ? "s" : ""} d'élèves</span>
    <span class="cpt" title="Élèves connectés aujourd'hui">${icon("cal")}<b>${v.aujourdhui}</b> élève${v.aujourdhui > 1 ? "s" : ""} aujourd'hui</span>
    <button class="cpt enligne" data-act="enligne" title="Voir qui est en ligne et déconnecter une session"><i class="pastille"></i><b>${v.enligne}</b> élève${v.enligne > 1 ? "s" : ""} en ligne</button></div>`;
}

/* ---------- Glisser-déposer des cours dans le menu de gauche ---------- */
const DM = { el: null, y0: 0, on: false, pid: null, bloque: false };
document.addEventListener("pointerdown", e => { if (e.button !== 0) return; const it = e.target.closest && e.target.closest(".drawer a.itcours"); if (!it) return; DM.el = it; DM.y0 = e.clientY; DM.on = false; DM.pid = e.pointerId; });
document.addEventListener("pointermove", e => {
  if (!DM.el || e.pointerId !== DM.pid) return;
  if (!DM.on) { if (Math.abs(e.clientY - DM.y0) < 8) return; if (e.pointerType === "touch") { DM.el = null; return; } DM.on = true; DM.el.classList.add("dmplace"); document.body.classList.add("dragging"); }
  e.preventDefault();
  const L = [...document.querySelectorAll(".drawer a.itcours")], cible = L.find(x => { const r = x.getBoundingClientRect(); return e.clientY >= r.top && e.clientY <= r.bottom; });
  if (cible && cible !== DM.el) { const r = cible.getBoundingClientRect(); cible.parentNode.insertBefore(DM.el, e.clientY < r.top + r.height / 2 ? cible : cible.nextSibling); }
});
document.addEventListener("pointerup", e => { if (!DM.el || e.pointerId !== DM.pid) return; const el = DM.el; DM.el = null;
  if (!DM.on) return; DM.on = false; el.classList.remove("dmplace"); document.body.classList.remove("dragging"); DM.bloque = true; setTimeout(() => DM.bloque = false, 60);
  const ids = [...document.querySelectorAll(".drawer a.itcours")].map(x => x.dataset.cid); if (ids.join() !== actives().map(c => c.id).join()) enregistrerOrdre(ids); });
document.addEventListener("click", e => { if (DM.bloque && e.target.closest && e.target.closest(".drawer")) { e.preventDefault(); e.stopPropagation(); } }, true);
document.addEventListener("dragstart", e => { if (e.target.closest && e.target.closest(".drawer a.itcours")) e.preventDefault(); });



/* ---------- Calendrier dynamique (Excel privé du prof, affiché à côté de la page) ---------- */
const CAL_CHEMIN = "prof/calendrier-dynamique.xlsx";
/* lien Google Drive du calendrier partagé par la direction : toujours la dernière version */
const CAL_DRIVE = "1YXfbYl-v3lrAA1VUjQO4WGC1NTR_SYRe";
function lienCalendrier(){
  const l = (R().liensUtiles || []).find(x => x.icone === "logo-calendrier"), u = l && /^https?:\/\//.test(l.url || "") ? l.url : "https://drive.google.com/file/d/" + CAL_DRIVE + "/view";
  const id = (u.match(/\/(?:file|spreadsheets)\/d\/([\w-]{20,})/) || [])[1];
  return id ? { vue: "https://drive.google.com/file/d/" + id + "/preview", ext: "https://docs.google.com/spreadsheets/d/" + id + "/edit" } : { vue: u, ext: u };
}
async function ouvrirCalendrier(forcer){
  if (SP.cle === "logo-calendrier" && !forcer) { fermerCote(); return; }
  { const L = lienCalendrier(), o = COTE_A_COTE["logo-calendrier"]; o.mode = "cadre"; o.remplacer = false; o.lienExt = L.ext; SP.cle = null; ouvrirCote("logo-calendrier", L.vue, "Calendrier"); return; }
  const { data, error } = await sb.storage.from("documents").createSignedUrl(CAL_CHEMIN, 3600);
  if (error || !data || !data.signedUrl) { COTE_A_COTE["logo-calendrier"].mode = "televerser"; SP.cle = null; ouvrirCote("logo-calendrier", "#", "Calendrier"); return; }
  COTE_A_COTE["logo-calendrier"].mode = "cadre"; SP.cle = null;
  ouvrirCote("logo-calendrier", "https://view.officeapps.live.com/op/embed.aspx?src=" + encodeURIComponent(data.signedUrl), "Calendrier");
}
document.addEventListener("click", e => { const a = e.target.closest && e.target.closest('a.qside[data-cle="logo-calendrier"]'); if (!a || e.ctrlKey || e.metaKey) return; e.preventDefault(); e.stopImmediatePropagation(); if (S.apps) { S.apps = false; render(); } ouvrirCalendrier(); }, true);
document.addEventListener("change", async e => { const i = e.target; if (!i.dataset || !i.dataset.calfile || !i.files[0]) return; const f = i.files[0];
  toast("Envoi du calendrier…"); const { error } = await sb.storage.from("documents").upload(CAL_CHEMIN, f, { upsert: true, contentType: f.type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  if (error) { toast("Envoi impossible : " + error.message); return; } toast("Calendrier enregistré"); ouvrirCalendrier(true); });

/* nom du cours sur une seule ligne dans le menu : la taille du texte s'ajuste si le nom est long */
function ajusterNomsCours(){ document.querySelectorAll(".drawer a.itcours .cnom").forEach(n => { n.style.fontSize = ""; const lbl = n.parentElement, max = lbl.clientWidth; if (!max) return; let t = 15; while (n.scrollWidth > max && t > 10) { t -= .5; n.style.fontSize = t + "px"; } }); }
new MutationObserver(() => { if (document.querySelector(".drawer a.itcours .cnom:not([data-ajuste])")) { document.querySelectorAll(".drawer a.itcours .cnom").forEach(n => n.dataset.ajuste = 1); ajusterNomsCours(); } }).observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener("resize", ajusterNomsCours);
/* ---------- Scientifique du jour : 90 hommes et 90 femmes, en alternance (programme de Physique-Chimie 2nde, 1re, Tle) ---------- */
/* format : [nom, dates, titre Wikipédia (ou null : recherche par le nom), biographie, notions du programme] */
const SCI_HOMMES = [
  ["Isaac Newton", "1643–1727", "Isaac_Newton", "Physicien et mathématicien anglais. Ses Principia (1687) unifient la chute des corps sur Terre et le mouvement des planètes.", ["Principe d'inertie (2nde)", "Deuxième loi de Newton (Tle)", "Gravitation universelle", "Décomposition de la lumière blanche"]],
  ["Amedeo Avogadro", "1776–1856", "Amedeo_Avogadro", "Physicien et chimiste italien. Il propose en 1811 que des volumes égaux de gaz, dans les mêmes conditions, contiennent le même nombre de molécules.", ["Quantité de matière et mole (2nde)", "Constante d'Avogadro", "Volume molaire d'un gaz"]],
  ["Daniel Bernoulli", "1700–1782", "Daniel_Bernoulli", "Physicien et mathématicien suisse, fondateur de l'hydrodynamique. Il relie vitesse, pression et altitude dans un fluide en écoulement.", ["Relation de Bernoulli (Tle)", "Écoulement d'un fluide, débit", "Pression d'un fluide"]],
  ["Albert Einstein", "1879–1955", "Albert_Einstein", "Physicien d'origine allemande, prix Nobel 1921. Il explique l'effet photoélectrique par les photons et formule la relativité.", ["Effet photoélectrique (Tle)", "Photon et énergie E = h·ν", "Équivalence masse-énergie E = m·c²"]],
  ["Blaise Pascal", "1623–1662", "Blaise_Pascal", "Savant et philosophe français. Il prouve que la pression de l'air diminue avec l'altitude (expérience du Puy de Dôme, 1648).", ["Pression (2nde)", "Loi fondamentale de la statique des fluides (1re)", "Unité : le pascal"]],
  ["Antoine Lavoisier", "1743–1794", "Antoine_Lavoisier", "Chimiste français, père de la chimie moderne. « Rien ne se perd, rien ne se crée, tout se transforme. »", ["Conservation de la masse (2nde)", "Équation de réaction ajustée", "Rôle du dioxygène dans la combustion"]],
  ["Dmitri Mendeleïev", "1834–1907", "Dmitri_Mendeleïev", "Chimiste russe. En 1869, il classe les éléments par masse croissante et propriétés, en laissant des cases pour des éléments encore inconnus.", ["Tableau périodique (2nde)", "Familles chimiques", "Électrons de valence"]],
  ["Ernest Rutherford", "1871–1937", "Ernest_Rutherford", "Physicien néo-zélandais. Avec la feuille d'or, il montre que l'atome possède un noyau minuscule, dense et chargé positivement.", ["Modèle de l'atome (2nde)", "Noyau, proton", "Rayonnements α et β"]],
  ["Niels Bohr", "1885–1962", "Niels_Bohr", "Physicien danois, prix Nobel 1922. Son modèle de l'atome explique les spectres de raies par des niveaux d'énergie quantifiés.", ["Niveaux d'énergie de l'atome (1re)", "Spectres d'émission et d'absorption", "Quantification de l'énergie"]],
  ["Max Planck", "1858–1947", "Max_Planck", "Physicien allemand, prix Nobel 1918, fondateur de la physique quantique : l'énergie est échangée par « quanta ».", ["Constante de Planck h (1re)", "Énergie d'un photon E = h·ν", "Rayonnement du corps noir"]],
  ["James Clerk Maxwell", "1831–1879", "James_Clerk_Maxwell", "Physicien écossais. Ses équations unifient électricité et magnétisme et montrent que la lumière est une onde électromagnétique.", ["Ondes électromagnétiques (2nde)", "Spectre électromagnétique", "Champs électrique et magnétique (1re)"]],
  ["Michael Faraday", "1791–1867", "Michael_Faraday", "Physicien et chimiste anglais. Il découvre l'induction électromagnétique et établit les lois de l'électrolyse.", ["Champ magnétique (1re)", "Électrolyse (Tle)", "Constante de Faraday"]],
  ["Georg Ohm", "1789–1854", "Georg_Simon_Ohm", "Physicien allemand. Il établit en 1827 la proportionnalité entre la tension aux bornes d'un conducteur et l'intensité qui le traverse.", ["Loi d'Ohm U = R·I (2nde)", "Résistance, unité ohm", "Caractéristique d'un dipôle"]],
  ["Alessandro Volta", "1745–1827", "Alessandro_Volta", "Physicien italien. Il invente en 1800 la pile électrique, première source de courant continu.", ["Piles électrochimiques (1re)", "Tension électrique, unité volt", "Oxydoréduction"]],
  ["André-Marie Ampère", "1775–1836", "André-Marie_Ampère", "Physicien français, fondateur de l'électrodynamique : il étudie les forces entre courants électriques.", ["Intensité du courant, unité ampère (2nde)", "Loi des nœuds", "Courant et champ magnétique"]],
  ["Gustav Kirchhoff", "1824–1887", "Gustav_Kirchhoff", "Physicien allemand. Il énonce les lois des circuits électriques et fonde, avec Bunsen, l'analyse spectrale.", ["Lois des nœuds et des mailles (2nde)", "Spectres de raies et identification des éléments"]],
  ["Christiaan Huygens", "1629–1695", "Christiaan_Huygens", "Savant néerlandais. Il propose une théorie ondulatoire de la lumière et invente l'horloge à pendule.", ["Propagation des ondes (Tle)", "Période d'un pendule", "Nature ondulatoire de la lumière"]],
  ["Galilée", "1564–1642", "Galilée_(savant)", "Savant italien. Il étudie la chute des corps, observe le ciel à la lunette et défend que la Terre tourne autour du Soleil.", ["Chute libre (Tle)", "Principe d'inertie et référentiel (2nde)", "Relativité du mouvement"]],
  ["Johannes Kepler", "1571–1630", "Johannes_Kepler", "Astronome allemand. Ses trois lois décrivent les orbites elliptiques des planètes autour du Soleil.", ["Lois de Kepler (Tle)", "Mouvement des planètes et des satellites"]],
  ["Robert Hooke", "1635–1703", "Robert_Hooke", "Savant anglais. Il énonce la loi d'élasticité des ressorts et observe les premières cellules au microscope.", ["Force de rappel d'un ressort", "Modélisation d'une action mécanique (2nde)"]],
  ["Robert Boyle", "1627–1691", "Robert_Boyle", "Physicien et chimiste irlandais. Il montre qu'à température constante, la pression d'un gaz est inversement proportionnelle à son volume.", ["Loi de Boyle-Mariotte P·V = constante (2nde)", "Pression d'un gaz"]],
  ["Joseph Louis Gay-Lussac", "1778–1850", "Louis_Joseph_Gay-Lussac", "Chimiste et physicien français. Il étudie la dilatation des gaz et les volumes de gaz qui réagissent entre eux.", ["Modèle du gaz parfait P·V = n·R·T (Tle)", "Influence de la température sur un gaz"]],
  ["Svante Arrhenius", "1859–1927", "Svante_August_Arrhenius", "Chimiste suédois, prix Nobel 1903. Il définit les acides et les bases et étudie l'effet de la température sur la vitesse des réactions.", ["Acides et bases (Tle)", "Température, facteur cinétique (Tle)", "Effet de serre"]],
  ["Johannes Brønsted", "1879–1947", "Johannes_Nicolaus_Brønsted", "Chimiste danois. En 1923, il définit un acide comme une espèce capable de céder un proton H⁺.", ["Couples acide/base (1re)", "Réactions acide-base (Tle)"]],
  ["Søren Sørensen", "1868–1939", "Søren_Sørensen", "Chimiste danois. Il introduit en 1909 l'échelle de pH pour mesurer l'acidité d'une solution.", ["pH d'une solution (Tle)", "Solutions acides, basiques, neutres"]],
  ["Gilbert Lewis", "1875–1946", "Gilbert_Newton_Lewis", "Chimiste américain. Il décrit la liaison covalente comme une mise en commun d'électrons.", ["Schéma de Lewis (1re)", "Doublets liants et non liants", "Liaison covalente"]],
  ["Linus Pauling", "1901–1994", "Linus_Pauling", "Chimiste américain, deux fois prix Nobel. Il crée l'échelle d'électronégativité des éléments.", ["Électronégativité (1re)", "Polarité des liaisons et des molécules"]],
  ["August Kekulé", "1829–1896", "August_Kekulé", "Chimiste allemand. Il montre que le carbone forme quatre liaisons et propose la structure cyclique du benzène.", ["Tétravalence du carbone (1re)", "Formules développées et semi-développées"]],
  ["Hans Christian Ørsted", "1777–1851", "Hans_Christian_Ørsted", "Physicien danois. En 1820, il observe qu'un courant électrique dévie l'aiguille d'une boussole.", ["Champ magnétique créé par un courant (1re)", "Lien entre électricité et magnétisme"]],
  ["Charles-Augustin Coulomb", "1736–1806", "Charles-Augustin_Coulomb", "Physicien français. Avec sa balance de torsion, il établit la loi d'interaction entre charges électriques.", ["Loi de Coulomb (1re)", "Charge électrique, unité coulomb", "Champ électrique"]],
  ["James Prescott Joule", "1818–1889", "James_Prescott_Joule", "Physicien anglais. Il montre l'équivalence entre travail mécanique et chaleur.", ["Énergie et unité joule", "Effet Joule (1re)", "Premier principe de la thermodynamique (Tle)"]],
  ["Sadi Carnot", "1796–1832", "Nicolas_Léonard_Sadi_Carnot", "Physicien français, fondateur de la thermodynamique : il étudie le rendement des machines à vapeur.", ["Conversion d'énergie et rendement (1re)", "Machines thermiques", "Bilans énergétiques"]],
  ["Lord Kelvin", "1824–1907", "William_Thomson_(Lord_Kelvin)", "Physicien britannique. Il définit l'échelle de température absolue, qui part du zéro absolu.", ["Température absolue, kelvin (2nde)", "Zéro absolu", "Thermodynamique"]],
  ["Anders Celsius", "1701–1744", "Anders_Celsius", "Astronome suédois. Il propose en 1742 l'échelle de température centésimale, fondée sur l'eau.", ["Température en degrés Celsius", "Changements d'état de l'eau (2nde)"]],
  ["Christian Doppler", "1803–1853", "Christian_Doppler", "Physicien autrichien. Il prédit que la fréquence d'une onde perçue dépend du mouvement de la source.", ["Effet Doppler (Tle)", "Mesure de vitesses (radars, astronomie)"]],
  ["Thomas Young", "1773–1829", "Thomas_Young_(physicien)", "Savant anglais. Son expérience des fentes prouve la nature ondulatoire de la lumière.", ["Interférences (Tle)", "Fentes d'Young", "Nature ondulatoire de la lumière"]],
  ["Augustin Fresnel", "1788–1827", "Augustin_Fresnel", "Physicien français. Il explique la diffraction par la théorie ondulatoire et invente la lentille des phares.", ["Diffraction (Tle)", "Lumière : modèle ondulatoire"]],
  ["Willebrord Snell", "1580–1626", "Willebrord_Snell", "Astronome et mathématicien néerlandais. Il découvre en 1621 la loi de la réfraction de la lumière.", ["Lois de Snell-Descartes (2nde)", "Indice de réfraction", "Réfraction de la lumière"]],
  ["René Descartes", "1596–1650", "René_Descartes", "Philosophe et savant français. Il publie en 1637 les lois de la réflexion et de la réfraction de la lumière.", ["Lois de Snell-Descartes (2nde)", "Réflexion et réfraction", "Repère cartésien"]],
  ["Louis de Broglie", "1892–1987", "Louis_de_Broglie", "Physicien français, prix Nobel 1929. Il associe une onde à toute particule en mouvement.", ["Dualité onde-particule (Tle)", "Longueur d'onde de de Broglie λ = h/p"]],
  ["Heinrich Hertz", "1857–1894", "Heinrich_Hertz", "Physicien allemand. Il produit et détecte les premières ondes radio en 1887.", ["Ondes électromagnétiques (2nde)", "Fréquence, unité hertz", "Effet photoélectrique"]],
  ["Joseph John Thomson", "1856–1940", "Joseph_John_Thomson", "Physicien anglais, prix Nobel 1906. Il découvre l'électron en 1897.", ["Électron et modèle de l'atome (2nde)", "Particule chargée dans un champ électrique (Tle)"]],
  ["Robert Millikan", "1868–1953", "Robert_Andrews_Millikan", "Physicien américain, prix Nobel 1923. Son expérience des gouttelettes d'huile mesure la charge de l'électron.", ["Charge élémentaire e (Tle)", "Mouvement dans un champ électrique"]],
  ["Henri Becquerel", "1852–1908", "Henri_Becquerel", "Physicien français, prix Nobel 1903. Il découvre la radioactivité de l'uranium en 1896.", ["Radioactivité (1re)", "Unité becquerel (Bq)", "Activité d'un échantillon (Tle)"]],
  ["Jacques Charles", "1746–1823", "Jacques_Charles", "Physicien et aéronaute français. Il étudie la dilatation des gaz chauffés et vole en ballon à hydrogène.", ["Lois des gaz (Tle)", "Masse volumique d'un gaz"]],
  ["August Beer", "1825–1863", "August_Beer", "Physicien allemand. Il relie l'absorption de la lumière par une solution à sa concentration.", ["Loi de Beer-Lambert (1re)", "Dosage par spectrophotométrie", "Absorbance"]],
  ["Archimède", "vers -287 – -212", "Archimède", "Savant grec de Syracuse. Il énonce le principe de la poussée exercée par un fluide sur un corps immergé.", ["Poussée d'Archimède (Tle)", "Masse volumique", "Statique des fluides"]],
  ["Evangelista Torricelli", "1608–1647", "Evangelista_Torricelli", "Physicien italien. Il invente le baromètre à mercure en 1643 et mesure la pression atmosphérique.", ["Pression atmosphérique (2nde)", "Baromètre", "Écoulement par un orifice"]],
  ["Ole Rømer", "1644–1710", "Ole_Christensen_Rømer", "Astronome danois. En observant Io, satellite de Jupiter, il montre en 1676 que la lumière a une vitesse finie.", ["Vitesse de la lumière (2nde)", "Propagation de la lumière"]],
  ["Hippolyte Fizeau", "1819–1896", "Hippolyte_Fizeau", "Physicien français. Il mesure la vitesse de la lumière sur Terre en 1849 avec une roue dentée.", ["Vitesse de la lumière (2nde)", "Effet Doppler-Fizeau (Tle)"]],
  ["Joseph Fourier", "1768–1830", "Joseph_Fourier", "Mathématicien et physicien français. Il étudie la propagation de la chaleur et décompose les signaux en sinusoïdes.", ["Transferts thermiques (Tle)", "Spectre d'un son (2nde)", "Flux thermique"]],
  ["Henry Cavendish", "1731–1810", "Henry_Cavendish", "Physicien et chimiste britannique. Il identifie le dihydrogène et mesure la constante de gravitation.", ["Constante de gravitation G", "Dihydrogène et composition de l'eau"]],
  ["Jean Perrin", "1870–1942", "Jean_Perrin", "Physicien français, prix Nobel 1926. Ses mesures prouvent l'existence des atomes et déterminent le nombre d'Avogadro.", ["Constante d'Avogadro (2nde)", "Réalité des atomes et des molécules"]],
  ["Jöns Jacob Berzelius", "1779–1848", "Jöns_Jacob_Berzelius", "Chimiste suédois. Il invente la notation chimique moderne avec des symboles d'une ou deux lettres.", ["Symboles des éléments (2nde)", "Formules chimiques"]],
  ["John Dalton", "1766–1844", "John_Dalton", "Chimiste anglais. Il propose en 1808 la théorie atomique : la matière est faite d'atomes.", ["Modèle de l'atome (2nde)", "Pressions partielles des gaz"]],
  ["Joseph Black", "1728–1799", null, "Chimiste écossais. Il découvre le dioxyde de carbone (« air fixe ») et introduit la notion de chaleur latente.", ["Dioxyde de carbone", "Changements d'état et énergie (2nde)", "Chaleur latente"]],
  ["Joseph Priestley", "1733–1804", null, "Chimiste et théologien anglais. Il isole le dioxygène en 1774 et invente l'eau gazeuse.", ["Dioxygène", "Gaz et transformations chimiques (2nde)"]],
  ["Carl Wilhelm Scheele", "1742–1786", null, "Pharmacien et chimiste suédois. Il découvre le dioxygène, le chlore et de nombreux acides organiques.", ["Dioxygène et dichlore", "Acides carboxyliques (1re)"]],
  ["Humphry Davy", "1778–1829", null, "Chimiste anglais. Grâce à l'électrolyse, il isole le sodium, le potassium et le calcium ; il invente une lampe de sécurité pour les mineurs.", ["Électrolyse (Tle)", "Métaux alcalins (2nde)"]],
  ["Friedrich Wöhler", "1800–1882", null, "Chimiste allemand. En 1828, il synthétise l'urée à partir d'un composé minéral : la chimie organique n'est plus réservée au vivant.", ["Synthèse organique (Tle)", "Chimie organique (1re)"]],
  ["Louis Pasteur", "1822–1895", null, "Chimiste et biologiste français. Il découvre que certaines molécules existent sous deux formes images l'une de l'autre dans un miroir.", ["Stéréochimie, molécules images", "Fermentation, catalyse"]],
  ["Marcellin Berthelot", "1827–1907", null, "Chimiste français, pionnier de la synthèse organique et de la thermochimie.", ["Synthèse organique (Tle)", "Énergie libérée par une réaction"]],
  ["Henry Le Chatelier", "1850–1936", null, "Chimiste français. Il énonce le principe de déplacement des équilibres chimiques.", ["Équilibre chimique (Tle)", "Évolution d'un système chimique"]],
  ["Jacobus van 't Hoff", "1852–1911", null, "Chimiste néerlandais, premier prix Nobel de chimie (1901), pour ses travaux sur la cinétique et les équilibres.", ["Cinétique chimique (Tle)", "Atome de carbone tétraédrique", "Pression osmotique"]],
  ["Fritz Haber", "1868–1934", null, "Chimiste allemand, prix Nobel 1918. Il met au point la synthèse de l'ammoniac à partir du diazote de l'air.", ["Catalyse (Tle)", "Synthèse de l'ammoniac", "Rendement d'une synthèse"]],
  ["Wilhelm Ostwald", "1853–1932", null, "Chimiste germano-balte, prix Nobel 1909 pour ses travaux sur la catalyse et les vitesses de réaction.", ["Catalyse (Tle)", "Loi de dilution, acides faibles"]],
  ["Paul Sabatier", "1854–1941", null, "Chimiste français, prix Nobel 1912. Il découvre l'hydrogénation catalytique avec le nickel.", ["Catalyse hétérogène (Tle)", "Chimie organique"]],
  ["Victor Grignard", "1871–1935", null, "Chimiste français, prix Nobel 1912. Ses réactifs permettent d'allonger les chaînes carbonées.", ["Modification de la chaîne carbonée (Tle)", "Synthèse organique"]],
  ["Joseph Proust", "1754–1826", null, "Chimiste français. Il énonce la loi des proportions définies : un composé a toujours la même composition.", ["Proportions dans une réaction (2nde)", "Stœchiométrie"]],
  ["Stanislao Cannizzaro", "1826–1910", null, "Chimiste italien. Il fait accepter l'hypothèse d'Avogadro et distingue clairement atomes et molécules.", ["Masse molaire (2nde)", "Atomes et molécules"]],
  ["Robert Bunsen", "1811–1899", null, "Chimiste allemand. Avec Kirchhoff, il fonde la spectroscopie et découvre le césium et le rubidium.", ["Spectres de raies (2nde)", "Test de flamme", "Bec Bunsen"]],
  ["Léon Foucault", "1819–1868", null, "Physicien français. Son pendule du Panthéon (1851) démontre la rotation de la Terre ; il mesure aussi la vitesse de la lumière.", ["Référentiels et mouvements (2nde)", "Vitesse de la lumière", "Pendule"]],
  ["Pierre Curie", "1859–1906", null, "Physicien français, prix Nobel 1903 avec Marie Curie et Henri Becquerel. Il découvre la piézoélectricité.", ["Radioactivité (1re)", "Piézoélectricité, capteurs", "Magnétisme"]],
  ["Frédéric Joliot-Curie", "1900–1958", null, "Physicien français, prix Nobel de chimie 1935 avec Irène Joliot-Curie pour la radioactivité artificielle.", ["Radioactivité artificielle (Tle)", "Réaction en chaîne, fission"]],
  ["Enrico Fermi", "1901–1954", null, "Physicien italien, prix Nobel 1938. Il construit le premier réacteur nucléaire en 1942.", ["Réactions nucléaires (1re)", "Neutrons", "Énergie nucléaire"]],
  ["Werner Heisenberg", "1901–1976", null, "Physicien allemand, prix Nobel 1932, l'un des fondateurs de la mécanique quantique.", ["Physique quantique (Tle)", "Principe d'incertitude"]],
  ["Erwin Schrödinger", "1887–1961", null, "Physicien autrichien, prix Nobel 1933. Son équation décrit le comportement ondulatoire des particules.", ["Dualité onde-particule (Tle)", "Mécanique quantique"]],
  ["James Chadwick", "1891–1974", null, "Physicien anglais, prix Nobel 1935 pour la découverte du neutron en 1932.", ["Neutron et noyau atomique (2nde)", "Isotopes"]],
  ["Wilhelm Röntgen", "1845–1923", null, "Physicien allemand, premier prix Nobel de physique (1901), pour la découverte des rayons X.", ["Rayons X et spectre électromagnétique (2nde)", "Imagerie médicale"]],
  ["Edwin Hubble", "1889–1953", null, "Astronome américain. Il montre que les galaxies s'éloignent d'autant plus vite qu'elles sont lointaines : l'Univers est en expansion.", ["Effet Doppler et décalage vers le rouge (Tle)", "Spectres des étoiles"]],
  ["Nicolas Copernic", "1473–1543", null, "Astronome polonais. Il place le Soleil, et non la Terre, au centre du système des planètes.", ["Référentiel héliocentrique (2nde)", "Mouvement des planètes"]],
  ["Benjamin Franklin", "1706–1790", null, "Savant et homme politique américain. Il montre que la foudre est un phénomène électrique et invente le paratonnerre.", ["Charges électriques (1re)", "Électrisation"]],
  ["Luigi Galvani", "1737–1798", null, "Médecin et physicien italien. Ses expériences sur les cuisses de grenouille ouvrent la voie à l'étude de l'électricité.", ["Courant électrique", "Origine de la pile de Volta"]],
  ["Nikola Tesla", "1856–1943", null, "Inventeur et ingénieur serbo-américain, pionnier du courant alternatif et du moteur électrique.", ["Courant alternatif", "Unité tesla du champ magnétique", "Conversion d'énergie"]],
  ["Guglielmo Marconi", "1874–1937", null, "Physicien italien, prix Nobel 1909. Il réalise les premières transmissions par ondes radio à grande distance.", ["Ondes électromagnétiques (2nde)", "Transmission de l'information"]],
  ["James Watt", "1736–1819", null, "Ingénieur écossais. Il perfectionne la machine à vapeur ; l'unité de puissance porte son nom.", ["Puissance, unité watt (2nde)", "Conversion d'énergie, rendement"]],
  ["Rudolf Clausius", "1822–1888", null, "Physicien allemand. Il énonce les principes de la thermodynamique et introduit la notion d'entropie.", ["Premier principe de la thermodynamique (Tle)", "Transferts thermiques"]],
  ["Ludwig Boltzmann", "1844–1906", null, "Physicien autrichien. Il explique la température et la pression d'un gaz par le mouvement des molécules.", ["Modèle du gaz parfait (Tle)", "Constante de Boltzmann", "Description microscopique d'un gaz"]],
  ["Hermann von Helmholtz", "1821–1894", null, "Physicien et physiologiste allemand. Il formule le principe de conservation de l'énergie et étudie l'acoustique.", ["Conservation de l'énergie (1re)", "Son et perception (2nde)"]],
  ["Richard Feynman", "1918–1988", null, "Physicien américain, prix Nobel 1965 pour l'électrodynamique quantique, célèbre pour ses talents de pédagogue.", ["Interaction lumière-matière", "Photon (Tle)"]]
];
const SCI_FEMMES = [
  ["Marie Curie", "1867–1934", "Marie_Curie", "Physicienne et chimiste franco-polonaise, seule personne récompensée par deux prix Nobel scientifiques (physique 1903, chimie 1911).", ["Radioactivité (1re)", "Décroissance radioactive (Tle)", "Découverte du polonium et du radium"]],
  ["Émilie du Châtelet", "1706–1749", "Émilie_du_Châtelet", "Mathématicienne et physicienne française. Elle traduit Newton et défend l'idée que l'énergie d'un corps dépend du carré de sa vitesse.", ["Énergie cinétique Ec = ½·m·v² (1re)", "Conservation de l'énergie"]],
  ["Lise Meitner", "1878–1968", "Lise_Meitner", "Physicienne autrichienne. Elle explique en 1939 la fission nucléaire de l'uranium.", ["Fission nucléaire (1re)", "Énergie nucléaire", "Radioactivité"]],
  ["Irène Joliot-Curie", "1897–1956", "Irène_Joliot-Curie", "Chimiste et physicienne française, prix Nobel 1935 avec Frédéric Joliot, pour la radioactivité artificielle.", ["Radioactivité artificielle (Tle)", "Transformations nucléaires", "Isotopes"]],
  ["Hypatie d'Alexandrie", "vers 355–415", null, "Mathématicienne, astronome et philosophe grecque d'Alexandrie. On lui attribue le perfectionnement de l'astrolabe et de l'hydromètre.", ["Mesure de la masse volumique (hydromètre)", "Astronomie"]],
  ["Marie Meurdrac", "vers 1610–1680", null, "Chimiste française. Son livre « La chimie charitable et facile, en faveur des dames » (1666) est l'un des premiers traités de chimie écrits par une femme.", ["Techniques de laboratoire", "Extraction et préparation de solutions"]],
  ["Laura Bassi", "1711–1778", null, "Physicienne italienne, première femme à obtenir une chaire de physique dans une université européenne (Bologne).", ["Mécanique newtonienne", "Électricité"]],
  ["Marie-Anne Paulze Lavoisier", "1758–1836", null, "Chimiste française, collaboratrice d'Antoine Lavoisier. Elle traduit, illustre et publie ses travaux.", ["Conservation de la masse (2nde)", "Combustion"]],
  ["Elizabeth Fulhame", "XVIIIe siècle", null, "Chimiste écossaise. Dans son livre de 1794, elle décrit pour la première fois le principe de la catalyse.", ["Catalyse (Tle)", "Oxydoréduction"]],
  ["Caroline Herschel", "1750–1848", null, "Astronome germano-britannique. Elle découvre plusieurs comètes et nébuleuses avec son frère William.", ["Observation du ciel", "Lumière des étoiles"]],
  ["Sophie Germain", "1776–1831", null, "Mathématicienne française autodidacte. Elle remporte en 1816 le prix de l'Académie des sciences pour sa théorie des surfaces élastiques.", ["Vibrations et ondes", "Élasticité"]],
  ["Mary Somerville", "1780–1872", null, "Scientifique écossaise. Ses livres de vulgarisation font connaître la physique et l'astronomie de son temps.", ["Gravitation", "Lumière et magnétisme"]],
  ["Jane Marcet", "1769–1858", null, "Autrice britannique. Ses « Conversations sur la chimie » (1805) ont appris la chimie à des milliers d'élèves, dont Michael Faraday.", ["Transformations chimiques (2nde)", "Vulgarisation scientifique"]],
  ["Ada Lovelace", "1815–1852", null, "Mathématicienne anglaise. Elle écrit en 1843 ce que l'on considère comme le premier programme informatique.", ["Algorithmes et programmation (SNT)", "Machine analytique"]],
  ["Maria Mitchell", "1818–1889", null, "Astronome américaine. Elle découvre une comète en 1847 et devient la première femme professeure d'astronomie aux États-Unis.", ["Observation astronomique", "Mesures et incertitudes"]],
  ["Eunice Foote", "1819–1888", null, "Scientifique américaine. En 1856, elle montre que le dioxyde de carbone retient la chaleur du Soleil : c'est la première trace de l'effet de serre.", ["Effet de serre", "Dioxyde de carbone", "Transferts thermiques"]],
  ["Ellen Swallow Richards", "1842–1911", null, "Chimiste américaine, première femme admise au MIT. Elle analyse la qualité de l'eau potable.", ["Analyse chimique de l'eau", "Dosages"]],
  ["Williamina Fleming", "1857–1911", null, "Astronome écossaise. Elle classe plus de 10 000 étoiles d'après leur spectre et découvre la nébuleuse de la Tête de Cheval.", ["Spectres des étoiles (2nde)", "Classification spectrale"]],
  ["Hertha Ayrton", "1854–1923", null, "Physicienne et ingénieure britannique. Elle étudie l'arc électrique et la formation des rides de sable par les vagues.", ["Électricité, arc électrique", "Ondes à la surface de l'eau"]],
  ["Agnes Pockels", "1862–1935", null, "Physicienne allemande autodidacte. Elle mesure la tension superficielle des liquides dans sa cuisine.", ["Tension superficielle", "Interactions entre molécules (1re)"]],
  ["Annie Jump Cannon", "1863–1941", null, "Astronome américaine. Elle crée la classification des étoiles O, B, A, F, G, K, M, toujours utilisée.", ["Spectres des étoiles (2nde)", "Température d'une étoile"]],
  ["Henrietta Leavitt", "1868–1921", null, "Astronome américaine. Elle relie la luminosité des étoiles céphéides à leur période, ce qui permet de mesurer les distances dans l'Univers.", ["Mesure de distances", "Période d'un phénomène"]],
  ["Clara Immerwahr", "1870–1915", null, "Chimiste allemande, première femme docteure en chimie de l'université de Breslau.", ["Chimie des solutions", "Électrochimie"]],
  ["Harriet Brooks", "1876–1933", null, "Physicienne canadienne, première physicienne nucléaire du Canada. Elle découvre le recul radioactif et participe à l'étude du radon.", ["Radioactivité (1re)", "Gaz radon"]],
  ["Emmy Noether", "1882–1935", null, "Mathématicienne allemande. Son théorème relie chaque loi de conservation à une symétrie de la nature.", ["Conservation de l'énergie (1re)", "Conservation de la quantité de mouvement"]],
  ["Ida Noddack", "1896–1978", null, "Chimiste allemande. Elle découvre le rhénium et propose dès 1934 l'idée de la fission du noyau.", ["Éléments chimiques", "Fission nucléaire"]],
  ["Marietta Blau", "1894–1970", null, "Physicienne autrichienne. Elle utilise des plaques photographiques pour observer les traces des particules.", ["Particules et noyaux", "Rayonnement cosmique"]],
  ["Katharine Burr Blodgett", "1898–1979", null, "Physicienne et chimiste américaine. Elle invente le verre antireflet grâce à des couches très minces.", ["Interférences en lumière (Tle)", "Couches minces"]],
  ["Hertha Sponer", "1895–1968", null, "Physicienne allemande, spécialiste de la spectroscopie moléculaire.", ["Spectroscopie", "Niveaux d'énergie (1re)"]],
  ["Cecilia Payne-Gaposchkin", "1900–1979", null, "Astronome anglo-américaine. Elle montre en 1925 que les étoiles sont composées surtout d'hydrogène et d'hélium.", ["Spectres des étoiles (2nde)", "Composition de l'Univers"]],
  ["Kathleen Lonsdale", "1903–1971", null, "Cristallographe irlandaise. Elle prouve par les rayons X que la molécule de benzène est plane.", ["Structure des molécules (1re)", "Diffraction des rayons X"]],
  ["Maria Goeppert Mayer", "1906–1972", null, "Physicienne germano-américaine, prix Nobel 1963 pour le modèle en couches du noyau atomique.", ["Structure du noyau", "Stabilité des noyaux (Tle)"]],
  ["Melitta Bentz", "1873–1950", null, "Inventrice allemande. Elle invente en 1908 le filtre à café en papier.", ["Filtration (2nde)", "Séparation des mélanges"]],
  ["Chien-Shiung Wu", "1912–1997", null, "Physicienne sino-américaine. Son expérience de 1956 montre que la désintégration β ne respecte pas la symétrie miroir.", ["Radioactivité β (1re)", "Physique nucléaire"]],
  ["Dorothy Hodgkin", "1910–1994", null, "Chimiste britannique, prix Nobel 1964. Elle détermine par rayons X la structure de la pénicilline et de la vitamine B12.", ["Structure des molécules", "Diffraction (Tle)"]],
  ["Grace Hopper", "1906–1992", null, "Informaticienne et officière de marine américaine. Elle crée le premier compilateur et popularise le mot « bug ».", ["Programmation (SNT)", "Langages informatiques"]],
  ["Hedy Lamarr", "1914–2000", null, "Actrice et inventrice austro-américaine. Elle co-invente l'étalement de spectre par saut de fréquence, à l'origine du Wi-Fi et du Bluetooth.", ["Ondes et fréquences (2nde)", "Transmission de l'information"]],
  ["Marguerite Perey", "1909–1975", null, "Physicienne française, élève de Marie Curie. Elle découvre le francium en 1939.", ["Radioactivité (1re)", "Tableau périodique : le francium"]],
  ["Yvette Cauchois", "1908–1999", null, "Physicienne française, spécialiste de la spectroscopie des rayons X et du rayonnement synchrotron.", ["Rayons X", "Spectroscopie"]],
  ["Rosalind Franklin", "1920–1958", null, "Chimiste britannique. Sa photographie par diffraction des rayons X révèle la structure en double hélice de l'ADN.", ["Diffraction (Tle)", "Structure des molécules"]],
  ["Gertrude Elion", "1918–1999", null, "Chimiste américaine, prix Nobel de médecine 1988 pour la mise au point de nombreux médicaments.", ["Synthèse organique (Tle)", "Molécules du vivant"]],
  ["Rosalyn Yalow", "1921–2011", null, "Physicienne américaine, prix Nobel 1977. Elle utilise des isotopes radioactifs pour doser des hormones dans le sang.", ["Isotopes radioactifs (1re)", "Dosages"]],
  ["Katherine Johnson", "1918–2020", null, "Mathématicienne afro-américaine de la NASA. Elle calcule les trajectoires des premiers vols spatiaux habités américains.", ["Mouvement dans un champ de gravitation (Tle)", "Lois de Kepler"]],
  ["Mary Jackson", "1921–2005", null, "Ingénieure afro-américaine de la NASA, spécialiste de l'aérodynamique en soufflerie.", ["Écoulement des fluides (Tle)", "Forces exercées par l'air"]],
  ["Dorothy Vaughan", "1910–2008", null, "Mathématicienne afro-américaine de la NASA. Elle apprend le langage FORTRAN à son équipe pour programmer les premiers ordinateurs.", ["Programmation (SNT)", "Calcul numérique"]],
  ["Stephanie Kwolek", "1923–2014", null, "Chimiste américaine. Elle invente le Kevlar, une fibre cinq fois plus résistante que l'acier à masse égale.", ["Polymères", "Synthèse de matériaux"]],
  ["Vera Rubin", "1928–2016", null, "Astronome américaine. En mesurant la vitesse de rotation des galaxies, elle apporte la preuve de l'existence de la matière noire.", ["Mouvements circulaires (Tle)", "Effet Doppler"]],
  ["Margaret Burbidge", "1919–2020", null, "Astrophysicienne britannique. Elle explique comment les éléments chimiques sont fabriqués dans les étoiles.", ["Fusion nucléaire (1re)", "Origine des éléments chimiques"]],
  ["Mildred Dresselhaus", "1930–2017", null, "Physicienne américaine surnommée « la reine du carbone » pour ses travaux sur le graphite et les nanotubes.", ["Le carbone et ses formes", "Conduction électrique"]],
  ["Valentina Terechkova", "née en 1937", null, "Cosmonaute soviétique, première femme dans l'espace en 1963.", ["Satellites et orbites (Tle)", "Apesanteur"]],
  ["Jocelyn Bell Burnell", "née en 1943", null, "Astrophysicienne nord-irlandaise. Elle découvre les pulsars en 1967 en analysant des signaux radio.", ["Ondes radio", "Signaux périodiques"]],
  ["Margaret Hamilton", "née en 1936", null, "Informaticienne américaine. Elle dirige l'écriture du logiciel de navigation des missions Apollo.", ["Programmation (SNT)", "Fiabilité des logiciels"]],
  ["Darleane Hoffman", "née en 1926", null, "Chimiste nucléaire américaine. Elle étudie les éléments lourds et confirme l'existence du seaborgium.", ["Éléments transuraniens", "Radioactivité"]],
  ["Ruth Benerito", "1916–2013", null, "Chimiste américaine. Elle met au point le coton infroissable par traitement chimique des fibres.", ["Chimie des matériaux", "Liaisons chimiques"]],
  ["Tu Youyou", "née en 1930", null, "Chimiste pharmaceutique chinoise, prix Nobel 2015. Elle extrait l'artémisinine d'une plante pour soigner le paludisme.", ["Extraction par solvant (2nde)", "Espèces chimiques naturelles"]],
  ["Ada Yonath", "née en 1939", null, "Cristallographe israélienne, prix Nobel de chimie 2009 pour la structure du ribosome.", ["Structure des molécules", "Diffraction des rayons X"]],
  ["Hélène Langevin-Joliot", "née en 1927", null, "Physicienne nucléaire française, petite-fille de Marie Curie, engagée pour la place des femmes en sciences.", ["Physique nucléaire", "Noyau atomique"]],
  ["Sally Ride", "1951–2012", null, "Astronaute et physicienne américaine, première Américaine dans l'espace en 1983.", ["Mouvement des satellites (Tle)", "Lasers"]],
  ["Mae Jemison", "née en 1956", null, "Médecin, ingénieure et astronaute américaine, première femme afro-américaine dans l'espace en 1992.", ["Exploration spatiale", "Apesanteur"]],
  ["Claudie Haigneré", "née en 1957", null, "Médecin et astronaute française, première Française dans l'espace en 1996, puis ministre de la Recherche.", ["Exploration spatiale", "Mouvement en orbite (Tle)"]],
  ["Shirley Ann Jackson", "née en 1946", null, "Physicienne américaine, première Afro-Américaine docteure du MIT. Ses recherches ont contribué aux télécommunications.", ["Physique des matériaux", "Télécommunications"]],
  ["Françoise Combes", "née en 1952", null, "Astrophysicienne française, professeure au Collège de France, spécialiste de la formation des galaxies.", ["Galaxies", "Gravitation universelle"]],
  ["Catherine Bréchignac", "née en 1946", null, "Physicienne française. Elle étudie les agrégats d'atomes et a présidé le CNRS.", ["Physique atomique", "Nanosciences"]],
  ["Frances Arnold", "née en 1956", null, "Ingénieure chimiste américaine, prix Nobel 2018 pour l'évolution dirigée des enzymes.", ["Catalyse enzymatique (Tle)", "Chimie verte"]],
  ["Andrea Ghez", "née en 1965", null, "Astrophysicienne américaine, prix Nobel 2020. Elle suit des étoiles en orbite autour du trou noir central de notre galaxie.", ["Lois de Kepler (Tle)", "Gravitation"]],
  ["Donna Strickland", "née en 1959", null, "Physicienne canadienne, prix Nobel 2018 pour une méthode de production d'impulsions laser ultra-courtes et intenses.", ["Lasers", "Lumière et énergie"]],
  ["Fabiola Gianotti", "née en 1960", null, "Physicienne italienne. Elle a annoncé la découverte du boson de Higgs en 2012 et dirige le CERN.", ["Particules élémentaires", "Masse et énergie"]],
  ["Lisa Randall", "née en 1962", null, "Physicienne théoricienne américaine, spécialiste des particules et des dimensions supplémentaires.", ["Particules élémentaires", "Gravitation"]],
  ["Emmanuelle Charpentier", "née en 1968", null, "Microbiologiste française, prix Nobel de chimie 2020 pour les « ciseaux moléculaires » CRISPR-Cas9.", ["Molécules du vivant", "Catalyse enzymatique"]],
  ["Jennifer Doudna", "née en 1964", null, "Biochimiste américaine, prix Nobel de chimie 2020 avec Emmanuelle Charpentier pour CRISPR-Cas9.", ["Molécules du vivant", "Catalyse enzymatique"]],
  ["Carolyn Bertozzi", "née en 1966", null, "Chimiste américaine, prix Nobel 2022 pour des réactions chimiques qui fonctionnent à l'intérieur des cellules vivantes.", ["Synthèse organique (Tle)", "Chimie click"]],
  ["Anne L'Huillier", "née en 1958", null, "Physicienne franco-suédoise, prix Nobel 2023 pour des impulsions de lumière de l'ordre de l'attoseconde.", ["Lumière et électrons", "Ondes électromagnétiques"]],
  ["Asima Chatterjee", "1917–2006", null, "Chimiste indienne. Elle étudie les molécules issues des plantes médicinales et met au point des médicaments contre l'épilepsie et le paludisme.", ["Extraction d'espèces naturelles (2nde)", "Chimie organique"]],
  ["Bibha Chowdhuri", "1913–1991", null, "Physicienne indienne, pionnière de l'étude des rayons cosmiques.", ["Particules et rayonnements", "Physique nucléaire"]],
  ["Toshiko Yuasa", "1909–1980", null, "Physicienne japonaise, première femme physicienne du Japon, spécialiste de la radioactivité β.", ["Radioactivité β (1re)", "Physique nucléaire"]],
  ["Alice Ball", "1892–1916", null, "Chimiste afro-américaine. Elle met au point un traitement injectable contre la lèpre à partir d'une huile végétale.", ["Extraction et modification d'espèces chimiques", "Chimie organique"]],
  ["Rachel Carson", "1907–1964", null, "Biologiste américaine. Son livre « Printemps silencieux » (1962) alerte sur les dangers des pesticides.", ["Chimie et environnement", "Pollution"]],
  ["Inge Lehmann", "1888–1993", null, "Sismologue danoise. En étudiant les ondes sismiques, elle découvre que la Terre possède une graine solide.", ["Ondes mécaniques (Tle)", "Propagation des ondes"]],
  ["Marie Tharp", "1920–2006", null, "Géologue et cartographe américaine. Elle réalise la première carte des fonds océaniques à partir de mesures par sonar.", ["Ondes sonores et sonar (2nde)", "Mesure de distances"]],
  ["Maria Telkes", "1900–1995", null, "Physicienne et inventrice hongro-américaine, pionnière de l'énergie solaire thermique.", ["Énergie solaire", "Transferts thermiques (Tle)"]],
  ["Edith Clarke", "1883–1959", null, "Ingénieure américaine, première femme ingénieure en électricité diplômée du MIT. Elle invente un calculateur pour les réseaux électriques.", ["Circuits électriques (2nde)", "Transport de l'électricité"]],
  ["Lene Hau", "née en 1959", null, "Physicienne danoise. Elle a ralenti la lumière jusqu'à la vitesse d'un vélo, puis l'a arrêtée.", ["Vitesse de la lumière", "Interaction lumière-matière"]],
  ["Nergis Mavalvala", "née en 1968", null, "Astrophysicienne pakistano-américaine, membre de l'équipe qui a détecté les ondes gravitationnelles en 2015.", ["Interférences (Tle)", "Ondes"]],
  ["Gabriela González", "née en 1965", null, "Physicienne argentine. Elle a été porte-parole de la collaboration LIGO lors de la première détection d'ondes gravitationnelles.", ["Interférométrie (Tle)", "Ondes"]],
  ["Sau Lan Wu", "née vers 1940", null, "Physicienne des particules sino-américaine, qui a participé aux découvertes du gluon et du boson de Higgs.", ["Particules élémentaires", "Accélérateurs"]],
  ["Elsa Neumann", "1872–1902", null, "Physicienne allemande, première femme docteure de l'université de Berlin, pour ses travaux sur la polarisation électrique.", ["Électricité", "Piles et électrodes"]],
  ["Patricia Bath", "1942–2019", null, "Ophtalmologue et inventrice américaine. Elle invente une sonde laser pour opérer la cataracte.", ["Lasers", "Optique de l'œil"]],
  ["Katalin Karikó", "née en 1955", null, "Biochimiste hongroise, prix Nobel de médecine 2023 pour les travaux qui ont permis les vaccins à ARN messager.", ["Molécules du vivant", "Synthèse de molécules"]],
  ["Hilde Levi", "1909–2003", null, "Physicienne germano-danoise, pionnière de l'utilisation des traceurs radioactifs en biologie.", ["Isotopes radioactifs", "Datation"]],
  ["Ellen Ochoa", "née en 1958", null, "Ingénieure et astronaute américaine, première Hispano-Américaine dans l'espace, spécialiste des systèmes optiques.", ["Optique", "Exploration spatiale"]]
];
const cleJour = d => { const x = new Date(d); x.setHours(12, 0, 0, 0); return Math.floor(x / 864e5); };
/* jour pair : un homme, jour impair : une femme ; l'ordre est mélangé mais fixe */
function scientifiqueDuJour(d){ const j = cleJour(d || now()), k = Math.floor(j / 2), L = j % 2 ? SCI_FEMMES : SCI_HOMMES, n = L.length; return L[((k * 37) % n + n) % n]; }
const PHOTOS = {};
async function infosWiki(nom, titre){
  const cle = titre || nom; if (PHOTOS[cle] !== undefined) return PHOTOS[cle];
  try { const c = JSON.parse(localStorage.getItem("pp_wiki2_" + cle) || "null"); if (c && c.t > Date.now() - 30 * 864e5) return PHOTOS[cle] = c; } catch (_) {}
  PHOTOS[cle] = null;
  const resume = async t => { const r = await fetch("https://fr.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(t)); if (!r.ok) return null; const j = await r.json(); if (j.type === "disambiguation") return null; return { u: (j.thumbnail && j.thumbnail.source) || "", lien: (j.content_urls && j.content_urls.desktop && j.content_urls.desktop.page) || "" }; };
  try {
    let x = await resume(titre || nom);
    if (!x) { const r = await fetch("https://fr.wikipedia.org/w/api.php?action=query&list=search&srlimit=1&format=json&origin=*&srsearch=" + encodeURIComponent(nom)); const j = await r.json(); const t = j.query && j.query.search && j.query.search[0] && j.query.search[0].title; if (t) x = await resume(t); }
    if (x) { x.t = Date.now(); PHOTOS[cle] = x; try { localStorage.setItem("pp_wiki2_" + cle, JSON.stringify(x)); } catch (_) {} }
  } catch (_) {}
  return PHOTOS[cle];
}
const lienWiki = (nom, titre) => titre ? "https://fr.wikipedia.org/wiki/" + encodeURIComponent(titre) : "https://fr.wikipedia.org/w/index.php?search=" + encodeURIComponent(nom) + "&go=Aller";
const imgSci = (u, nom) => `<img src="${esc(u)}" alt="Portrait de ${esc(nom)}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{textContent:'${esc(initials(nom))}'}))">`;
function blocScientifique(){
  const [nom, dates, titre, bio, notions] = scientifiqueDuJour(), cle = titre || nom, x = PHOTOS[cle], url = (x && x.lien) || lienWiki(nom, titre);
  if (x === undefined) infosWiki(nom, titre).then(v => { document.querySelectorAll(`.sciday[data-t="${CSS.escape(cle)}"]`).forEach(z => {
    if (v && v.u) { const p = z.querySelector(".sciphoto"); p.innerHTML = imgSci(v.u, nom) + `<em>${icon("ext")} Wikipédia</em>`; }
    if (v && v.lien) z.querySelectorAll("a[data-wiki]").forEach(a => a.href = v.lien); }); });
  return `<section class="sciday" data-t="${esc(cle)}"><a class="sciphoto" data-wiki="1" href="${esc(url)}" target="_blank" rel="noopener" title="Lire sa biographie sur Wikipédia">${x && x.u ? imgSci(x.u, nom) : `<span>${esc(initials(nom))}</span>`}<em>${icon("ext")} Wikipédia</em></a>
    <div class="scitx"><small class="scilbl">${icon("atom")} Scientifique du jour</small><h2><a data-wiki="1" href="${esc(url)}" target="_blank" rel="noopener">${esc(nom)}</a> <span>${esc(dates)}</span></h2><p>${esc(bio)}</p>
      <div class="scinot"><b>Au programme :</b>${notions.map(n => `<span>${esc(n)}</span>`).join("")}</div></div></section>`;
}
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
    <div class="fformule">${jolie(formule)}</div>
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
    r = `<div class="ores bon"><b>x_max = ${fmt4(x)} mol</b><small>${lim}</small></div><div class="tablewrap"><table class="admtable avtab"><thead><tr><th class="first">État</th><th>a A</th><th>b B</th><th>c C</th>${d ? "<th>d D</th>" : ""}</tr></thead><tbody>
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
/* =====================================================================
   Personnes en ligne (professeur) : liste détaillée et déconnexion à distance
   ===================================================================== */
const SES = { liste: null, err: "", q: "", t: null, arme: null };
const heureCourte = d => new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
const ilYa = d => { const m = Math.round((Date.now() - new Date(d)) / 60000); return m < 1 ? "à l'instant" : m < 60 ? `il y a ${m} min` : `il y a ${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}`; };
async function chargerSessions(){
  const { data, error } = await sb.rpc("pp_sessions");
  if (error) { SES.err = /pp_sessions|function/i.test(error.message) ? "La liste détaillée n'est pas encore installée (étape 23 de la base de données)." : error.message; SES.liste = []; }
  else { SES.err = ""; const brut = typeof data === "string" ? JSON.parse(data) : (data || []), vus = new Map();
    /* un même navigateur peut avoir plusieurs onglets : on n'en garde qu'un (le plus récent, visible en priorité) */
    brut.sort((a, b) => (b.visible && b.en_ligne) - (a.visible && a.en_ligne) || new Date(b.vu_le) - new Date(a.vu_le)).forEach(x => { const k = x.email + "|" + x.appareil; if (!vus.has(k)) vus.set(k, x); });
    SES.liste = [...vus.values()]; }
  dessinerSessions();
}
function ligneSession(x){
  if (!x.nom || x.nom.includes("@")) x.nom = nomDepuisEmail(x.email || x.nom || "?");
  const etat = x.deconnecter ? `<span class="sest attente">Déconnexion demandée…</span>` : x.en_ligne ? (x.visible ? `<span class="sest on">En ligne</span>` : `<span class="sest fond">Onglet en arrière-plan</span>`) : `<span class="sest off">Inactif · vu ${ilYa(x.vu_le)}</span>`;
  const btn = x.moi ? `<span class="muted sesmoi">${x.id === idSession() ? "Toi (cette page)" : "Toi (autre appareil)"}</span>` : x.deconnecter ? "" : `<button class="btn sm ${SES.arme === x.id ? "danger" : "ghost"}" data-act="sesdeco" data-id="${esc(x.id)}">${icon("logout")} ${SES.arme === x.id ? "Confirmer ?" : "Déconnecter"}</button>`;
  return `<div class="sesl${x.en_ligne ? "" : " inactif"}">${avatarP(x.nom || x.email || "?", "")}<div class="sesinfo"><b>${esc(x.nom || x.email)}</b>${x.role === "prof" ? ` <span class="simniv">Professeur</span>` : ""}<small>${esc(x.classes || (x.role === "prof" ? "" : "Aucun cours"))}</small><small class="muted">${esc(x.appareil || "Appareil inconnu")} · connecté depuis ${heureCourte(x.debut)}</small></div>${etat}${btn}</div>`;
}
function dessinerSessions(){
  const z = document.querySelector("#sesPanel .sescorps"); if (!z) return;
  if (!SES.liste) { z.innerHTML = `<p class="muted">Chargement…</p>`; return; }
  if (SES.err) { z.innerHTML = `<p class="ores err">${esc(SES.err)}</p>`; return; }
  const q = sansAccent(SES.q), L = SES.liste.filter(x => !q || sansAccent([x.nom, x.email, x.classes, x.appareil].join(" ")).includes(q));
  const on = L.filter(x => x.en_ligne), off = L.filter(x => !x.en_ligne), nbEl = SES.liste.filter(x => x.role !== "prof" && !x.deconnecter).length;
  z.innerHTML = `<section><h4>En ligne maintenant · ${on.length}</h4>${on.map(ligneSession).join("") || `<p class="muted">Personne en ligne.</p>`}</section>
    <section><h4>Sessions restées ouvertes (vues dans les 18 dernières heures) · ${off.length}</h4><p class="muted sesaide">Navigateur fermé sans se déconnecter, par exemple sur un ordinateur du lycée. La déconnexion se fera dès que ce navigateur rouvrira le site.</p>${off.map(ligneSession).join("") || `<p class="muted">Aucune.</p>`}</section>`;
  const tous = document.querySelector('#sesPanel [data-act="sesdecotous"]'); if (tous) { tous.disabled = !nbEl; tous.className = "btn sm " + (SES.arme === "tous" ? "danger" : "ghost"); tous.innerHTML = `${icon("logout")} ${SES.arme === "tous" ? `Confirmer : déconnecter ${nbEl} session${nbEl > 1 ? "s" : ""} d'élèves ?` : "Déconnecter tous les élèves"}`; }
}
function ouvrirSessions(){
  if (document.getElementById("sesPanel")) return;
  const p = document.createElement("div"); p.id = "sesPanel"; p.className = "sesfond";
  p.innerHTML = `<div class="sesboite" role="dialog" aria-modal="true" aria-label="Élèves connectés"><header>${icon("people")}<b>Élèves connectés</b><button class="ib" data-act="sesfermer" aria-label="Fermer">${icon("x")}</button></header>
    <div class="sesbarre"><input type="search" id="sesQ" placeholder="Chercher un nom, une classe…" aria-label="Chercher"><button class="btn sm ghost" data-act="sesdecotous">${icon("logout")} Déconnecter tous les élèves</button></div>
    <p class="muted sesaide">La déconnexion prend effet en moins de 30 secondes. Elle ferme aussi la session Microsoft de ce navigateur : l'élève suivant devra entrer son propre mot de passe.</p>
    <div class="sescorps"></div></div>`;
  document.body.appendChild(p);
  p.addEventListener("click", e => { if (e.target === p) fermerSessions(); });
  p.querySelector("#sesQ").addEventListener("input", e => { SES.q = e.target.value; dessinerSessions(); });
  SES.liste = null; SES.arme = null; dessinerSessions(); chargerSessions();
  clearInterval(SES.t); SES.t = setInterval(chargerSessions, 15000);
}
function fermerSessions(){ document.getElementById("sesPanel")?.remove(); clearInterval(SES.t); }
let sesArmeT = null;
const armer = id => { SES.arme = id; dessinerSessions(); clearTimeout(sesArmeT); sesArmeT = setTimeout(() => { SES.arme = null; dessinerSessions(); }, 5000); };
document.addEventListener("click", async e => {
  const a = e.target.closest && e.target.closest('[data-act="enligne"],[data-act="sesfermer"],[data-act="sesdeco"],[data-act="sesdecotous"]'); if (!a) return; e.preventDefault(); e.stopPropagation();
  const act = a.dataset.act;
  if (act === "enligne") { if (S.prof) ouvrirSessions(); return; }
  if (act === "sesfermer") { fermerSessions(); return; }
  const id = act === "sesdecotous" ? "tous" : a.dataset.id;
  if (SES.arme !== id) { armer(id); return; }
  SES.arme = null; clearTimeout(sesArmeT); a.disabled = true;
  const { data, error } = await sb.rpc("pp_deconnecter", { p_session: id === "tous" ? null : id });
  if (error) toast("Déconnexion impossible : " + error.message);
  else toast(id === "tous" ? `${data || 0} session${data > 1 ? "s" : ""} d'élèves vont être déconnectées` : "La session va être déconnectée dans les 30 secondes");
  chargerSessions();
}, true);
document.addEventListener("keydown", e => { if (e.key === "Escape" && document.getElementById("sesPanel")) fermerSessions(); });
/* message affiché à l'élève après une déconnexion à distance */
try { if (sessionStorage.getItem("pp_kick")) { sessionStorage.removeItem("pp_kick"); setTimeout(() => toast("Tu as été déconnecté par ton professeur. Pense à te déconnecter quand tu quittes un ordinateur du lycée."), 1500); } } catch (_) {}

/* ---------- Pour les élèves : le professeur est-il en ligne ? ---------- */
const STP = { d: null, t: null };
function statutProf(){
  if (S.prof || !S.user) return "";
  const d = STP.d; if (!d) return `<div class="statprof"></div>`;
  const ok = !!d.actif;
  return `<div class="statprof"><span class="stp ${ok ? "vert" : "rouge"}" title="${ok ? "Ton professeur est connecté et utilise le site en ce moment." : "Ton professeur n'est pas disponible sur le site en ce moment."}"><i></i>${ok ? "Disponible" : "Indisponible"}</span></div>`;
}
async function chargerStatutProf(){
  if (S.prof || !S.user) return;
  const { data, error } = await sb.rpc("pp_statut_prof"); if (error) return;
  STP.d = typeof data === "string" ? JSON.parse(data) : data;
  document.querySelectorAll(".statprof").forEach(z => z.outerHTML = statutProf());
}
const _demarrerPresence = demarrerPresence;
demarrerPresence = function(){ _demarrerPresence(); if (!S.prof && !STP.t) { chargerStatutProf(); STP.t = setInterval(chargerStatutProf, 15000); document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") chargerStatutProf(); }); } };
/* =====================================================================
   « Pour s'entraîner » : le professeur relie simulations et outils aux chapitres
   + nom court des cours dans le menu
   ===================================================================== */
function nomCourtCours(nom){
  let n = String(nom || "");
  if (n.length <= 24) return n;
  return n.replace(/\bTerminale\b/gi, "Tle").replace(/Première/gi, "1re").replace(/\bSeconde\b/gi, "2nde")
    .replace(/spécialité/gi, "spé").replace(/\bPhysique[- ]Chimie\b/gi, "PC").replace(/\bTechnologie\b/gi, "Techno")
    .replace(/\bSciences de l'ingénieur\b/gi, "SI").replace(/\bSciences numériques et technologie\b/gi, "SNT").replace(/\s+/g, " ").trim();
}
const PR_ONG = [["unites", "Convertisseur d'unités"], ["tableau", "Tableau périodique"], ["formules", "Éditeur de formules"], ["mesures", "Mesures et incertitudes"], ["constantes", "Constantes"], ["courbes", "Traceur de courbes"], ["snt", "Bits et octets (SNT)"]];
function cataloguePratique(){
  const L = [];
  SIMS.forEach(g => g.l.forEach(x => L.push({ k: "s:" + x.url, t: x.t, type: "Simulation", sous: g.cat + (x.niv ? " · " + x.niv : ""), ic: "atom" })));
  (R().simulations || []).forEach(x => L.push({ k: "s:" + x.url, t: x.t, type: "Simulation", sous: "Ajoutée par toi", ic: "atom" }));
  F_PHY.forEach(t => L.push({ k: "f:phy:" + t[0], t: t[3], type: "Outil de physique", sous: t[4] + " · " + t[2], ic: "pendule" }));
  F_CHI.forEach(t => L.push({ k: "f:chi:" + t[0], t: t[3], type: "Outil de chimie", sous: t[4] + " · " + t[2], ic: "flask" }));
  PR_ONG.forEach(([k, t]) => L.push({ k: "o:" + k, t, type: "Outil", sous: "Outils Scientifiques Importants", ic: "ruler" }));
  return L;
}
const elemPratique = k => { const c = cataloguePratique().find(x => x.k === k); if (c) return c; if (k.startsWith("s:")) return { k, t: "Simulation", type: "Simulation", ic: "atom" }; return null; };
function blocPratique(tid){
  const L = ((R().pratique || {})[tid] || []).map(elemPratique).filter(Boolean);
  if (!L.length && !S.prof) return "";
  return `<div class="pratique"><span class="prlbl">${icon("flask")} Pour s'entraîner</span>${L.map(x => `<span class="prchip"><button data-act="prouvrir" data-k="${esc(x.k)}" title="${esc(x.type)}">${icon(x.ic)}${esc(x.t)}</button>${S.prof ? `<button class="prx" data-act="prretire" data-tid="${esc(tid)}" data-k="${esc(x.k)}" aria-label="Retirer">×</button>` : ""}</span>`).join("")}${S.prof ? `<button class="prplus" data-act="prajout" data-tid="${esc(tid)}">${icon("plus")} ${L.length ? "Ajouter" : "Ajouter une simulation ou un outil"}</button>` : ""}</div>`;
}
async function sauverPratique(tid, liste){
  const p = { ...(R().pratique || {}) }; if (liste.length) p[tid] = liste; else delete p[tid];
  const data = { ...reglagesData(), pratique: p };
  const { error } = await sb.from("reglages").upsert({ id: 1, data, modifie_le: now().toISOString() });
  if (error) { toast("Enregistrement impossible : " + error.message); return false; }
  appliquerReglages(data); return true;
}
const PR = { tid: null, q: "" };
function dessinerChoixPratique(){
  const z = document.querySelector("#prPanel .prliste"); if (!z) return;
  const deja = new Set((R().pratique || {})[PR.tid] || []), q = sansAccent(PR.q);
  const L = cataloguePratique().filter(x => !q || sansAccent(x.t + " " + x.type + " " + (x.sous || "")).includes(q)).slice(0, 80);
  z.innerHTML = L.map(x => `<button class="prl${deja.has(x.k) ? " on" : ""}" data-act="prbascule" data-k="${esc(x.k)}">${icon(x.ic)}<span><b>${esc(x.t)}</b><small>${esc(x.type)}${x.sous ? " · " + esc(x.sous) : ""}</small></span><i>${deja.has(x.k) ? "✓ Ajouté" : "+ Ajouter"}</i></button>`).join("") || `<p class="muted">Aucun résultat.</p>`;
}
function ouvrirChoixPratique(tid){
  PR.tid = tid; PR.q = "";
  const p = document.createElement("div"); p.id = "prPanel"; p.className = "sesfond";
  p.innerHTML = `<div class="sesboite" role="dialog" aria-modal="true" aria-label="Pour s'entraîner"><header>${icon("flask")}<b>Pour s'entraîner : simulations et outils du chapitre</b><button class="ib" data-act="prfermer" aria-label="Fermer">${icon("x")}</button></header>
    <div class="sesbarre"><input type="search" id="prQ" placeholder="Chercher : pendule, pH, dilution, lentille, circuit…" aria-label="Chercher"></div>
    <p class="muted sesaide">Clique pour ajouter ou retirer. Les élèves verront ces liens en haut du chapitre et les ouvriront en un clic.</p>
    <div class="sescorps prliste"></div></div>`;
  document.body.appendChild(p);
  p.addEventListener("click", e => { if (e.target === p) fermerChoixPratique(); });
  p.querySelector("#prQ").addEventListener("input", e => { PR.q = e.target.value; dessinerChoixPratique(); });
  dessinerChoixPratique(); setTimeout(() => p.querySelector("#prQ").focus(), 50);
}
function fermerChoixPratique(){ document.getElementById("prPanel")?.remove(); render(); }
function ouvrirPratique(k){
  if (k.startsWith("s:")) { const x = elemPratique(k); ouvrirSimu(x.t, k.slice(2)); return; }
  if (k.startsWith("o:")) { S.phyOng = k.slice(2); go("/physique"); return; }
  const [, dom, id] = k.split(":"), t = (dom === "phy" ? F_PHY : F_CHI).find(x => x[0] === id);
  S.phyOng = dom === "phy" ? "phys" : "chimie"; OV["fniv_" + dom] = "tout"; OV["fQ_" + dom] = t ? t[3] : ""; FOPEN.add(dom + ":" + id); go("/physique");
}
document.addEventListener("click", async e => {
  const a = e.target.closest && e.target.closest('[data-act="prouvrir"],[data-act="prretire"],[data-act="prajout"],[data-act="prfermer"],[data-act="prbascule"]'); if (!a) return; e.preventDefault(); e.stopPropagation();
  const act = a.dataset.act;
  if (act === "prouvrir") ouvrirPratique(a.dataset.k);
  else if (act === "prajout") { if (S.prof) ouvrirChoixPratique(a.dataset.tid); }
  else if (act === "prfermer") fermerChoixPratique();
  else if (act === "prretire") { const L = ((R().pratique || {})[a.dataset.tid] || []).filter(k => k !== a.dataset.k); if (await sauverPratique(a.dataset.tid, L)) render(); }
  else if (act === "prbascule") { const L = ((R().pratique || {})[PR.tid] || []).slice(), i = L.indexOf(a.dataset.k); if (i >= 0) L.splice(i, 1); else L.push(a.dataset.k); if (await sauverPratique(PR.tid, L)) dessinerChoixPratique(); }
}, true);
document.addEventListener("keydown", e => { if (e.key === "Escape" && document.getElementById("prPanel")) fermerChoixPratique(); });

/* ---------- Échéance en temps restant (pastille colorée) ---------- */
function relEch(date, fait){
  if (!date || fait) return "";
  const d = D(date), t = now(), j0 = new Date(t); j0.setHours(0, 0, 0, 0); const jd = new Date(d); jd.setHours(0, 0, 0, 0);
  const jours = Math.round((jd - j0) / 864e5);
  if (d < t) return `<span class="rel retard">En retard</span>`;
  const [txt, cl] = jours === 0 ? ["Aujourd'hui", "urgent"] : jours === 1 ? ["Demain", "urgent"] : jours <= 3 ? ["Dans " + jours + " jours", "bientot"] : ["Dans " + jours + " jours", "large"];
  return `<span class="rel ${cl}">${txt}</span>`;
}

/* ---------- Chapitre en 3 étapes : Comprendre → S'entraîner → Vérifier ---------- */
function etapeDe(it){ if (it.k === "support") return 0; if (it.q || it.k === "quiz") return 2; const o = it.d || it.s || it.q; return o && o.type === "question" ? 2 : 1; }
function etapesChapitre(g, c){
  const tid = String(g.t.id), E = [[], [], []]; g.items.forEach(it => E[etapeDe(it)].push(it));
  const pr = blocPratique(tid), fc = (typeof FC !== "undefined" && FC.cours && FC.cours[c.id] && FC.cours[c.id].l) ? FC.cours[c.id].l.filter(x => String(x.theme_id) === tid).length : 0;
  if (!g.items.length && !pr && !fc) return `<p class="empty">${S.prof ? "Aucun élément. Utilise « Créer » pour ajouter un devoir, un questionnaire ou une documentation." : "Rien pour l'instant."}</p>`;
  const T = [["1", "Comprendre", "Cours et documents"], ["2", "S'entraîner", "Simulations, outils et exercices"], ["3", "Vérifier", "Questions, questionnaires et révisions"]];
  return T.map(([n, titre, sous], i) => {
    const extra = i === 1 ? pr : i === 2 && fc ? `<div class="pratique"><span class="prlbl">${icon("cards")} Révisions</span><span class="prchip"><button data-act="prreviser" data-c="${esc(c.id)}">${icon("cards")}${fc} carte${fc > 1 ? "s" : ""} à réviser</button></span></div>` : "";
    if (!E[i].length && !extra) return "";
    return `<div class="etape"><div class="etapeh"><span class="etn">${n}</span><b>${titre}</b><small>${sous}</small></div>${extra}${E[i].map(workItem).join("")}</div>`;
  }).join("");
}
document.addEventListener("click", e => { const a = e.target.closest && e.target.closest('[data-act="prreviser"]'); if (!a) return; e.preventDefault(); e.stopPropagation(); S.fcCours = a.dataset.c; go("/revisions"); }, true);
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
/* ---------- rendu ---------- */
let renderId = 0;
const chargement = (r) => topbar(r) + `<div class="shell">${drawer(r)}<main class="content">${squelette()}</main></div>`;
async function render(){
  if (S.public) { renderPublic(); return; }
  const id = ++renderId, r = route();
  try {
    if (r.v === "editer") {
      if (!S.prof) { go("/"); return; }
      await initEditeur(r); if (id !== renderId) return;
      const foc = document.activeElement && document.activeElement.id;
      if (S.ed.type === "questionnaire") await urlsSignees(S.ed.questions.map(q => q.img).filter(Boolean)); if (id !== renderId) return;
      app.innerHTML = vEditer();
      const qf = document.getElementById("qimgFile"); if (qf) qf.onchange = () => { const f = qf.files[0]; qf.value = ""; if (f) imageQuestion(f); };
      const fi = document.getElementById("edFile"); if (fi) fi.onchange = () => { uploadFichiers([...fi.files], "ed"); fi.value = ""; };
      apresRendu(foc); return;
    }
    if (S.viewer && S.prof) {
      await preparerViewer(); if (id !== renderId) return;
      if (S.viewer) { const foc = document.activeElement && document.activeElement.id; app.innerHTML = vViewer(); apresRendu(foc); return; }
    }
    if (r.v === "classe" && r.t === "parametres") {
      const c = cls(r.a); if (!S.prof || !c) { go("/"); return; }
      const foc = document.activeElement && document.activeElement.id;
      app.innerHTML = vParametres(c); apresRendu(foc); return;
    }
    let content;
    if (r.v === "classe") {
      if (!S.cache[r.a]) app.innerHTML = chargement(r);
      const data = cls(r.a) ? await chargerClasse(r.a) : null; if (id !== renderId) return;
      content = vClasse(r, data);
    } else if (r.v === "devoir") {
      const d = S.devoirs.find(x => String(x.id) === r.a);
      if (d) { if (!S.cache[d.classe_id]) app.innerHTML = chargement(r); await chargerClasse(d.classe_id); const em = S.prof ? S.sel : moi(); if (em) await chargerCP(d.id, em); }
      if (id !== renderId) return;
      content = vDevoir(r);
      if (d && S.prof && odActif() && !(S.syncFait || {})[d.id + ":" + rendusDe(d).length]) { (S.syncFait = S.syncFait || {})[d.id + ":" + rendusDe(d).length] = 1; syncRendus(d, true).then(n => { if (n) toast(n + " travail" + (n > 1 ? "x copiés" : " copié") + " dans OneDrive"); }).catch(() => {}); }
    } else if (r.v === "quiz") {
      const q = S.quiz.find(x => String(x.id) === r.a);
      if (q && S.prof) { await chargerClasse(q.classe_id); await chargerResultatsQuiz(q); }
      if (q) await urlsSignees((q.questions || []).map(x => x.img).filter(Boolean));
      if (id !== renderId) return;
      content = vQuiz(r);
    } else if (r.v === "preparateur") {
      if (!S.prof) { go("/"); return; }
      if (!S.demandes) { app.innerHTML = chargement(r); await chargerDemandes(); if (id !== renderId) return; }
      content = vPreparateur();
    } else if (r.v === "rendezvous") {
      if (!S.rdv) { app.innerHTML = chargement(r); await chargerRdv(); if (id !== renderId) return; }
      content = vRendezVous();
    } else if (r.v === "urgences") {
      if (!S.prof) { go("/"); return; }
      content = vUrgences();
    } else if (r.v === "suivi") {
      if (!S.prof) { go("/"); return; }
      content = vSuivi();
    } else if (r.v === "admin") {
      if (!S.prof && r.a !== "profil") { go("/admin/profil"); return; }
      if (admTab(r) === "fichiers" && !S.fich) { app.innerHTML = chargement(r); await chargerFichiers(); if (id !== renderId) return; }
      content = vAdmin(r);
    } else if (r.v === "rejoindre") {
      const code = r.a || "";
      if (S.prof) { go("/"); toast("Lien d'invitation : l'élève qui l'ouvre rejoint le cours (code " + code + ")."); return; }
      const deja = S.classes.find(c => c.code && c.code.toLowerCase() === code.toLowerCase());
      if (deja) { go("/classe/" + deja.id); return; }
      if (S.joinVu !== code) { S.joinVu = code; S.modal = {kind:"join", code}; }
      content = vAccueil();
    } else {
      if (!S.prof && r.v === "accueil" && !actives().length && !S.joinAuto && !S.modal) { S.joinAuto = true; S.modal = {kind:"join"}; }
      content = ({agenda:vAgenda, todo:vTodo, outils:vOutils, archives:vArchives, ...VUES_PRO})[r.v]?.(r) ?? vAccueil();
    }
    const foc = document.activeElement && document.activeElement.id;
    app.innerHTML = topbar(r) + `<div class="shell">${drawer(r)}<main class="content">${content}</main></div>` + navMobile(r) + (S.modal ? vModal() : "");
    { const c0 = r.a && typeof cls === "function" ? cls(r.a) : null, T = { agenda: "Agenda", todo: S.prof ? "À corriger" : "À faire", suivi: "Suivi des élèves", urgences: "Messagerie d'urgence", preparateur: "Demande de matériel", rendezvous: "Rendez-vous", admin: "Paramètres", outils: "Boîte à outils", archives: "Cours archivés" };
      Object.assign(T, { semaine: "Ma semaine", revisions: "Révisions", simulations: "Simulations", physique: "Outils scientifiques", programmes: "Publications programmées" }); const dv0 = r.v === "devoir" ? (S.devoirs || []).find(d => String(d.id) === String(r.a)) : r.v === "quiz" ? (S.quiz || []).find(q => String(q.id) === String(r.a)) : null, cd0 = dv0 ? cls(dv0.classe_id) : null;
      document.title = (dv0 ? dv0.titre + (cd0 ? " · " + cd0.nom : "") + " · " : r.v === "classe" && c0 ? c0.nom + " · " : T[r.v] ? T[r.v] + " · " : "") + "PhysiquePro";  titreAvecCompteur(); }
    { const pg = app.querySelector("main.content > .page"); if (pg && !pg.querySelector(":scope > .headband")) pg.insertAdjacentHTML("afterbegin", pageHead()); }
    const fi = document.getElementById("fileIn"); if (fi) fi.onchange = () => { S.files.push(...[...fi.files].filter(f => { if (f.size > 50e6) { toast("« " + f.name + " » dépasse 50 Mo : mets-le dans ton OneDrive et ajoute le lien."); return false; } return true; })); fi.value = ""; render(); };
    const iz = document.getElementById("impZip"); if (iz) iz.onchange = () => { const f = [...iz.files]; iz.value = ""; if (f.length) importerZip(f).catch(er => { S.imp.busy = false; toast("Zip : " + (er.message || er)); render(); }); };
    const af = document.getElementById("anFile"); if (af) af.onchange = () => { uploadFichiers([...af.files], "annonce"); af.value = ""; };
    apresRendu(foc);
  } catch (e) {
    app.innerHTML = topbar(r) + `<div class="shell">${drawer(r)}<main class="content"><div class="page"><div class="emptystate"><b>Impossible de charger cette page.</b><span>${esc(e.message || e)}</span><button class="btn ghost" data-act="reload">Réessayer</button></div></div></main></div>`;
  }
}
function apresRendu(foc){
  if (S.modal && S.modal.kind !== "liens" && S.modal.kind !== "cible" && S.modal.kind !== "reutiliser") { const f = document.querySelector(".modal input:not([type=checkbox]), .modal textarea"); if (f) f.focus(); return; }
  if (foc && document.getElementById(foc) && !["edHtml", "anHtml"].includes(foc)) { const el = document.getElementById(foc); el.focus(); if (el.setSelectionRange && el.type === "text") { const n = el.value.length; el.setSelectionRange(n, n); } }
}
const fermerMenus = () => { S.dd = false; S.me = false; S.menu = null; S.bell = false; S.apps = false; };

/* ---------- clics ---------- */
document.addEventListener("click", async e => {
  const a = e.target.closest("[data-act]");
  if (!a) {
    if ((S.dd || S.me || S.menu || S.bell || S.apps) && !e.target.closest(".dd")) { fermerMenus(); render(); }
    return;
  }
  const act = a.dataset.act, r = route();
  if (["INPUT"].includes(a.tagName) && ["pick", "pickall", "cibletous", "cibleun", "bonne", "ans", "inscr", "bonnecase", "anscase", "repchoix"].includes(act)) { /* traité par « change » */ if (act !== "pick" && act !== "pickall") return; }
  switch (act) {
    case "pubconnect": e.preventDefault(); connecter(); return;
    case "pubcours": e.preventDefault(); connecter("#/classe/" + encodeURIComponent(a.dataset.c)); return;
    case "pubretour": e.preventDefault(); try { localStorage.removeItem("pp_next"); } catch (_) {} if (location.hash && location.hash !== "#/") location.hash = "/"; else renderPublic(); return;
    case "drawer": S.drawer = !S.drawer; render(); return;
    case "bell": { const o = !S.bell; fermerMenus(); S.bell = o; render(); if (o) chargerNotifs(); return; }
    case "toutlu": { const { data, error } = await sb.rpc("pp_vu"); if (error) { toast("Action impossible : " + error.message); return; } S.profil.vu_le = data || now().toISOString(); await chargerNotifs(); return; }
    case "savenom": { const n = ((document.getElementById("pfNom") || {}).value || "").trim(); if (!n) { toast("Le nom ne peut pas être vide."); return; }
      const data = { ...reglagesData(), prof: { nom: n, titre: R().prof.titre } };
      const { error } = await sb.from("reglages").upsert({ id: 1, data, modifie_le: now().toISOString() }); if (error) { toast("Enregistrement impossible : " + error.message); return; }
      appliquerReglages(data); S.nom = n; S.adm = null; toast("Nom modifié"); render(); return; }
    case "apps": { e.preventDefault(); const o = !S.apps; fermerMenus(); S.apps = o; render(); return; }
    case "favori": { e.preventDefault(); e.stopPropagation(); basculerFavori(a.dataset.nom); render(); return; }
    case "dd": S.dd = !S.dd; S.me = false; S.menu = null; render(); return;
    case "me": S.me = !S.me; S.dd = false; S.menu = null; render(); return;
    case "logout": e.preventDefault(); try { const k = "pp_sess_" + (S.user && S.user.id), id = sessionStorage.getItem(k); if (id) { await sb.rpc("pp_fin_session", { p_session: id }); sessionStorage.removeItem(k); } } catch (_) {} await sb.auth.signOut(); location.replace(ICI); return;
    case "menu": e.preventDefault(); S.menu = S.menu === a.dataset.m ? null : a.dataset.m; S.dd = false; S.me = false; render(); return;
    case "reload": S.cache = {}; await chargerTout().catch(() => {}); render(); return;
    case "toggle": S.open = S.open === a.dataset.id ? null : a.dataset.id; render(); return;
    case "recent": S.recent = !S.recent; try { localStorage.setItem("pp_recent", S.recent ? "1" : "0"); } catch (_) {} render(); return;
    case "todotab": S.todoTab = a.dataset.t; render(); return;
    case "week": S.week = a.dataset.w === "0" ? 0 : S.week + Number(a.dataset.w); render(); return;
    case "toutreduire": { const c = cls(r.a), data = S.cache[r.a]; if (S.reduits.size) S.reduits = new Set(); else { S.reduits = new Set(data.themes.map(t => String(t.id))); S.reduits.add("none"); } render(); return; }
    case "reduire": { const k = a.dataset.id; S.reduits.has(k) ? S.reduits.delete(k) : S.reduits.add(k); render(); return; }

    /* cours */
    case "join": e.preventDefault(); fermerMenus(); S.modal = {kind:"join"}; render(); return;
    case "newclass": e.preventDefault(); fermerMenus(); S.modal = {kind:"newclass"}; render(); return;
    case "showcode": e.preventDefault(); S.menu = null; S.modal = {kind:"code", code:a.dataset.code}; render(); return;
    case "copycode": { e.preventDefault(); S.menu = null; const code = a.dataset.code; try { navigator.clipboard.writeText(code).then(() => toast("Code copié : " + code), () => toast("Code : " + code)); } catch (_) { toast("Code : " + code); } render(); return; }
    case "resetcode": { e.preventDefault(); S.menu = null; const al = "abcdefghjkmnpqrstuvwxyz23456789", code = [...Array(7)].map(() => al[Math.floor(Math.random() * al.length)]).join("");
      const { error } = await sb.from("classes").update({ code, code_actif: true }).eq("id", a.dataset.c); if (error) { toast("Impossible de changer le code : " + error.message); return; }
      if (S.settings) S.settings.code_actif = true; await rafraichir(); render(); toast("Nouveau code : " + code); return; }
    case "togglecode": { e.preventDefault(); S.menu = null; const on = a.dataset.on === "1"; const { error } = await sb.from("classes").update({ code_actif: on }).eq("id", a.dataset.c); if (error) { toast("Action impossible : " + error.message); return; }
      await rafraichir(); render(); toast(on ? "Code activé" : "Code désactivé : plus personne ne peut rejoindre avec ce code"); return; }
    case "archiver": { e.preventDefault(); S.menu = null; const on = a.dataset.on === "1"; const { error } = await sb.from("classes").update({ archive: on }).eq("id", a.dataset.c); if (error) { toast("Action impossible : " + error.message); return; }
      S.settings = null; await rafraichir(); toast(on ? "Cours archivé" : "Cours restauré"); if (a.dataset.stay) render(); else go(on ? "/archives" : "/classe/" + a.dataset.c); return; }
    case "supprclasse": { e.preventDefault(); S.menu = null; const c = cls(a.dataset.c); S.modal = {kind:"supprclasse", id:c.id, nom:c.nom}; render(); return; }
    case "editliens": { const c = cls(a.dataset.c); S.modal = {kind:"liens", classe:c.id, liens:(c.liens || []).map(l => ({...l}))}; if (!S.modal.liens.length) S.modal.liens.push({nom:"", url:""}); render(); return; }
    case "addlien": S.modal.liens.push({nom:"", url:""}); render(); return;
    case "rmlien": S.modal.liens.splice(Number(a.dataset.i), 1); render(); return;
    case "savesettings": enregistrerParametres(); return;
    case "addcat": S.settings.categories.push({ nom: "", coef: 1 }); render(); return;
    case "rmcat": S.settings.categories.splice(Number(a.dataset.i), 1); render(); return;
    case "copylien": { e.preventDefault(); S.menu = null; const lien = ICI + "#/rejoindre/" + encodeURIComponent(a.dataset.code);
      try { navigator.clipboard.writeText(lien).then(() => toast("Lien d'invitation copié"), () => toast(lien)); } catch (_) { toast(lien); } render(); return; }
    case "deplacer": e.preventDefault(); S.menu = null; deplacerA(a.dataset.c, Number(a.dataset.pos)); return;
    case "placercours": { e.preventDefault(); S.menu = null; const c = cls(a.dataset.c); S.modal = {kind:"placercours", id:c.id, nom:c.nom}; render(); return; }
    case "copiercours": { e.preventDefault(); S.menu = null; const c = cls(a.dataset.c); S.modal = {kind:"copiercours", id:c.id, nom:c.nom}; render(); return; }
    case "moveclasse": { const act2 = actives(), i = act2.findIndex(c => c.id === a.dataset.c), j = i + Number(a.dataset.dir); if (i < 0 || j < 0 || j >= act2.length) return;
      [act2[i], act2[j]] = [act2[j], act2[i]];
      const res = await Promise.all(act2.map((c, n) => sb.from("classes").update({ ordre: n + 1 }).eq("id", c.id)));
      if (res.some(x => x.error)) toast("Déplacement impossible."); await rafraichir(); render(); return; }

    /* paramètres du site */
    case "adadd": { const list = getPath(S.adm, a.dataset.path), tpl = a.dataset.tpl;
      list.push(tpl === "lien" ? { nom: "", url: "", icone: "links", couleur: "#116482", principal: false } : tpl === "groupe" ? { matiere: "", couleur: "pc", liens: [["", "", ""]] } : ["", "", ""]);
      S.adm.modif = true; render(); return; }
    case "adrm": getPath(S.adm, a.dataset.path).splice(Number(a.dataset.i), 1); S.adm.modif = true; render(); return;
    case "admv": { const list = getPath(S.adm, a.dataset.path), i = Number(a.dataset.i), j = i + Number(a.dataset.dir); if (j < 0 || j >= list.length) return; [list[i], list[j]] = [list[j], list[i]]; S.adm.modif = true; render(); return; }
    case "admsave": admEnregistrer(); return;
    case "outilsedit": S.adm = null; S.outilsEdit = true; render(); return;
    case "outilsfin": if (S.adm && S.adm.modif && !confirmerPerte()) return; S.outilsEdit = false; S.adm = null; render(); return;
    case "admreset": S.adm = null; render(); return;
    case "admdefaut": S.adm = { prof: { nom: CFG.prof.nom, titre: CFG.prof.titre }, liensUtiles: clone(CFG.liensUtiles), outils: clone(CFG.outils), remarques: R().remarques.join("\n"), busy: false, err: "", modif: true }; render(); return;
    case "admfichiers": S.fich = null; render(); return;
    case "purge": S.modal = {kind:"confirm", action:"purge", ok:"Supprimer", titre:"Supprimer les fichiers inutilisés ?", texte:"Ces fichiers ne sont reliés à aucun devoir, documentation, annonce ou travail rendu. Leur suppression est définitive."}; render(); return;
    case "backup": S.backupBusy = true; render(); try { await sauvegarder(); toast("Sauvegarde téléchargée"); } catch (err) { toast("Sauvegarde impossible : " + (err.message || err)); } S.backupBusy = false; render(); return;
    case "exportnotes": try { await exporterNotes(a.dataset.c); } catch (err) { toast("Export impossible : " + (err.message || err)); } return;
    case "exporteleves": exporterEleves(); return;
    case "ajouteleves": { e.preventDefault(); S.menu = null; const cid = a.dataset.c || (r.v === "classe" ? r.a : "") || (S.admF && cls(S.admF) ? S.admF : (actives()[0] || {}).id); S.modal = {kind:"ajouteleves", classe:cid, fixe:!!a.dataset.c, texte:""}; render(); return; }
    case "renomeleve": e.preventDefault(); S.menu = null; S.modal = {kind:"renomeleve", email:a.dataset.e, nom:a.dataset.n}; render(); return;
    case "autrescours": e.preventDefault(); S.menu = null; S.modal = {kind:"autrescours", from:a.dataset.c, emails:a.dataset.e ? [a.dataset.e] : [...S.pick]}; render(); return;
    case "supprcompte": e.preventDefault(); S.menu = null; S.modal = {kind:"confirm", action:"supprcompte", email:a.dataset.e, nom:a.dataset.n, ok:"Supprimer", titre:"Supprimer " + a.dataset.n + " ?", texte:"L'élève disparaît de la liste et de tous les cours. Ses travaux rendus, ses notes et ses commentaires privés sont supprimés définitivement. S'il se reconnecte un jour, il repartira d'un compte vide et devra rejoindre un cours avec le code."}; render(); return;
    case "retirertout": e.preventDefault(); S.menu = null; S.modal = {kind:"confirm", action:"retirertout", email:a.dataset.e, nom:a.dataset.n, ok:"Retirer", titre:"Retirer " + a.dataset.n + " de tous les cours ?", texte:"L'élève n'aura plus accès à aucun cours. Ses travaux rendus et ses notes sont conservés."}; render(); return;

    /* personnes et e-mails */
    case "compose": e.preventDefault(); S.menu = null; S.compose = true; render(); return;
    case "maileleve": e.preventDefault(); S.menu = null; S.pick = new Set([a.dataset.e]); S.compose = true; render(); return;
    case "closecompose": S.compose = false; S.cSub = ""; S.cBody = ""; render(); return;
    case "copymails": { const txt = [...S.pick].join("; "); try { navigator.clipboard.writeText(txt).then(() => toast("Adresses copiées"), () => toast(txt)); } catch (_) { toast(txt); } return; }
    case "retirer": e.preventDefault(); S.menu = null; S.modal = {kind:"confirm", action:"retirer", emails:[a.dataset.e], classe:a.dataset.c, ok:"Retirer", titre:"Retirer " + a.dataset.n + " du cours ?", texte:"L'élève n'aura plus accès à ce cours. Ses travaux déjà rendus sont conservés. Il pourra revenir avec le code du cours."}; render(); return;
    case "retirersel": e.preventDefault(); S.menu = null; S.modal = {kind:"confirm", action:"retirer", emails:[...S.pick], classe:a.dataset.c, ok:"Retirer", titre:"Retirer " + S.pick.size + " élève" + (S.pick.size > 1 ? "s" : "") + " du cours ?", texte:"Ils n'auront plus accès à ce cours. Leurs travaux déjà rendus sont conservés."}; render(); return;
    case "pick": { const m = a.dataset.e; S.pick.has(m) ? S.pick.delete(m) : S.pick.add(m); if (!S.pick.size) S.compose = false; render(); return; }
    case "pickall": { const el = (S.cache[a.dataset.c] || {eleves:[]}).eleves, all = el.every(x => S.pick.has(x.email)); S.pick = all ? new Set() : new Set(el.map(x => x.email)); if (!S.pick.size) S.compose = false; render(); return; }

    /* thèmes et éléments */
    case "newtheme": e.preventDefault(); S.menu = null; S.modal = {kind:"theme", classe:a.dataset.c}; render(); return;
    case "renomtheme": e.preventDefault(); S.menu = null; S.modal = {kind:"theme", id:a.dataset.id, titre:a.dataset.titre, classe:r.a}; render(); return;
    case "supprtheme": e.preventDefault(); S.menu = null; S.modal = {kind:"confirm", action:"supprtheme", id:a.dataset.id, classe:a.dataset.c, titre:"Supprimer le thème « " + a.dataset.titre + " » ?", texte:"Les éléments de ce thème ne sont pas supprimés : ils passent dans « Aucun thème »."}; render(); return;
    case "movetheme": { e.preventDefault(); S.menu = null; const th = (await chargerClasse(a.dataset.c)).themes.slice(), i = th.findIndex(t => String(t.id) === a.dataset.id);
      if (i < 0) return render();
      const j = a.dataset.to != null ? Math.min(Number(a.dataset.to), th.length - 1) : i + Number(a.dataset.dir);
      return placerTheme(a.dataset.c, a.dataset.id, j); }
    case "copieoffice": e.preventDefault(); copieOffice(a); return;
    case "joindrecopie": e.preventDefault(); joindreCopie(a.dataset.id, a.dataset.nom); return;
    case "moveitem": { e.preventDefault(); S.menu = null; const sec = a.closest("section.theme"), wks = [...sec.querySelectorAll(".work[data-wk]")].map(x => x.dataset.wk), i = wks.indexOf(a.dataset.wk);
      if (i < 0) return render();
      wks.splice(i, 1); const t = a.dataset.to, j = t === "first" ? 0 : t === "last" ? wks.length : Math.max(0, Math.min(wks.length, i + Number(t)));
      wks.splice(j, 0, a.dataset.wk); return ordonnerItems(r.a, sec.dataset.tid, wks); }
    case "placertheme": { e.preventDefault(); S.menu = null; await chargerClasse(a.dataset.c); S.modal = {kind:"placertheme", id:a.dataset.id, titre:a.dataset.titre, classe:a.dataset.c}; render(); return; }
    case "suppr": e.preventDefault(); S.menu = null; S.modal = {kind:"confirm", action:"suppr", k:a.dataset.k, id:a.dataset.id, classe:r.a, titre:"Supprimer « " + a.dataset.titre + " » ?", texte:a.dataset.k === "devoir" ? "Les travaux rendus par les élèves, leurs notes et les commentaires privés de ce devoir seront aussi supprimés. Cette action est définitive." : a.dataset.k === "quiz" ? "Les réponses des élèves seront aussi supprimées. Cette action est définitive." : "Cette action est définitive."}; render(); return;
    case "publier": { e.preventDefault(); S.menu = null; const table = a.dataset.k === "devoir" ? "devoirs" : a.dataset.k === "support" ? "supports" : "quiz";
      const { error } = await sb.from(table).update({ brouillon: false, publie_le: now().toISOString() }).eq("id", a.dataset.id); if (error) { toast("Publication impossible : " + error.message); return; }
      await rafraichir(r.a); await synchroPartages(true); await rafraichir(r.a); render(); toast("Publié"); return; }
    case "reutiliser": e.preventDefault(); S.menu = null; S.modal = {kind:"reutiliser", k:a.dataset.k, id:a.dataset.id, classe:r.a}; render(); return;
    case "reutiliserdepuis": e.preventDefault(); S.menu = null; S.modal = {kind:"reutiliser", k:"depuis", classe:a.dataset.c}; render(); return;
    case "mclose": if (S.modal && S.modal.busy) return; S.modal = null; render(); return;
    case "mok": modalOk(); return;
    case "openfile": { e.preventDefault(); const w = window.open("about:blank", "_blank");
      const { data, error } = await sb.storage.from(a.dataset.bucket || "documents").createSignedUrl(a.dataset.path, 3600);
      if (error || !data) { if (w) w.close(); toast("Fichier introuvable ou accès refusé."); return; }
      const cible = lienOffice(a.dataset.path, data.signedUrl);
      if (w) w.location = cible; else location.href = cible; return; }
    case "dlfile": { e.preventDefault(); const nom = a.dataset.nom || a.dataset.path.split("/").pop().replace(/^\d+-/, "");
      const { data, error } = await sb.storage.from(a.dataset.bucket || "documents").createSignedUrl(a.dataset.path, 600, { download: nom });
      if (error || !data) { toast("Téléchargement impossible."); return; }
      const l = document.createElement("a"); l.href = data.signedUrl; l.download = nom; document.body.appendChild(l); l.click(); l.remove(); return; }

    /* éditeur */
    case "fmt": { e.preventDefault(); const ed = document.getElementById(S.ed ? "edHtml" : "anHtml") || document.getElementById("anHtml"); if (!ed) return; ed.focus(); document.execCommand(a.dataset.cmd, false, null); if (ed.id === "edHtml") S.ed.html = ed.innerHTML; else S.annonce.html = ed.innerHTML; return; }
    case "edlink": S.ed.linkMode = a.dataset.mode; render(); setTimeout(() => { const u = document.getElementById("edLinkUrl"); if (u) u.focus(); }, 0); return;
    case "edlinkcancel": S.ed.linkMode = null; render(); return;
    case "edlinkadd": { const u = document.getElementById("edLinkUrl").value.trim(), l = document.getElementById("edLinkLabel").value.trim();
      if (!/^https?:\/\//.test(u)) { toast("Colle une adresse qui commence par https://"); return; }
      const t = typeDeLien(u, S.ed.linkMode), res = { type: t, label: l || (t === "Lien" ? u.replace(/^https?:\/\/(www\.)?/, "").split("/")[0] : t), url: u };
      if (!l && ytId(u)) { res.type = "YouTube"; res.label = "Chargement…"; }
      S.ed.ressources.push(res); S.ed.linkMode = null; render();
      if (!l && ytId(u)) { const titre = await titreYoutube(u); res.label = titre || "Vidéo YouTube"; if (S.ed) render(); } return; }
    case "edupload": document.getElementById("edFile").click(); return;
    case "rmres": { const x = S.ed.ressources.splice(Number(a.dataset.i), 1)[0];
      if (x && x.path) { if (S.ed.uploaded.includes(x.path)) { sb.storage.from("documents").remove([x.path]); S.ed.uploaded = S.ed.uploaded.filter(p => p !== x.path); } else S.ed.toDelete.push(x.path); }
      render(); return; }
    case "edprog": e.preventDefault(); S.menu = null; S.modal = {kind:"prog"}; render(); return;
    case "edsave": e.preventDefault(); enregistrer(a.dataset.mode); return;
    case "edclose": { const ed = S.ed; if (ed && ed.uploaded.length) sb.storage.from("documents").remove(ed.uploaded); const c = ed ? ed.classe_id : null; S.ed = null; S.modal = null; if (c) go("/classe/" + c + "/travaux"); else history.back(); return; }
    case "cible": S.modal = {kind:"cible", sel: S.ed.eleves ? S.ed.eleves.slice() : null}; render(); return;
    case "addq": S.ed.questions.push({ q: "", t: "choix", o: ["", ""], a: null, acc: "", img: null, num: { v: "", tol: "5" } }); render(); setTimeout(() => { const t = document.querySelectorAll(".qtext"); if (t.length) t[t.length - 1].focus(); }, 0); return;
    case "rmq": S.ed.questions.splice(Number(a.dataset.qi), 1); render(); return;
    case "dupq": { const q = S.ed.questions[Number(a.dataset.qi)]; S.ed.questions.splice(Number(a.dataset.qi) + 1, 0, { q: q.q, t: q.t || "choix", o: q.o.slice(), a: Array.isArray(q.a) ? q.a.slice() : q.a, acc: q.acc || "", img: q.img || null, num: { ...(q.num || { v: "", tol: "5" }) } }); render(); return; }
    case "addqo": S.ed.qoptions.push(""); render(); return;
    case "addgr": S.ed.grille.push({ c: "", p: 2 }); render(); return;
    case "rmgr": S.ed.grille.splice(Number(a.dataset.i), 1); render(); return;
    case "rmqo": S.ed.qoptions.splice(Number(a.dataset.i), 1); render(); return;
    case "addopt": S.ed.questions[Number(a.dataset.qi)].o.push(""); render(); return;
    case "rmopt": { const q = S.ed.questions[Number(a.dataset.qi)], j = Number(a.dataset.oi); q.o.splice(j, 1);
      if (Array.isArray(q.a)) q.a = q.a.filter(x => x !== j).map(x => x > j ? x - 1 : x); else if (q.a === j) q.a = null; else if (q.a > j) q.a--; render(); return; }

    /* flux */
    case "annoncer": S.annonce = { classe: a.dataset.c, html: "", ressources: [], uploaded: [], linkMode: null, busy: false }; render(); setTimeout(() => { const x = document.getElementById("anHtml"); if (x) x.focus(); }, 0); return;
    case "ancancel": if (S.annonce && S.annonce.uploaded.length) sb.storage.from("documents").remove(S.annonce.uploaded); S.annonce = null; render(); return;
    case "anpost": publierAnnonce(); return;
    case "anlink": S.annonce.html = (document.getElementById("anHtml") || {}).innerHTML || S.annonce.html; S.annonce.linkMode = "lien"; render(); return;
    case "anlinkcancel": S.annonce.linkMode = null; render(); return;
    case "anlinkadd": { const u = document.getElementById("anLinkUrl").value.trim(), l = document.getElementById("anLinkLabel").value.trim();
      if (!/^https?:\/\//.test(u)) { toast("Colle une adresse qui commence par https://"); return; }
      const t = typeDeLien(u), res = { type: t, label: l || (t === "Lien" ? u.replace(/^https?:\/\/(www\.)?/, "").split("/")[0] : t), url: u };
      if (!l && ytId(u)) { res.type = "YouTube"; res.label = "Chargement…"; }
      S.annonce.ressources.push(res); S.annonce.linkMode = null; render();
      if (!l && ytId(u)) { const titre = await titreYoutube(u); res.label = titre || "Vidéo YouTube"; if (S.annonce) render(); } return; }
    case "anupload": S.annonce.html = (document.getElementById("anHtml") || {}).innerHTML || S.annonce.html; document.getElementById("anFile").click(); return;
    case "anrm": { const A2 = S.annonce, x = A2.ressources.splice(Number(a.dataset.i), 1)[0];
      if (x && x.path) { if (A2.uploaded.includes(x.path) || !A2.id) sb.storage.from("documents").remove([x.path]); else (A2.toDelete = A2.toDelete || []).push(x.path); } render(); return; }
    case "comment": { const inp = document.getElementById("cm-" + a.dataset.id), t = inp.value.trim(); if (!t) return;
      a.disabled = true; const { error } = await sb.from("commentaires").insert({ annonce_id: Number(a.dataset.id), auteur_nom: S.nom, texte: t });
      if (error) { a.disabled = false; toast("Commentaire impossible : " + error.message); return; }
      delete S.cache[a.dataset.c]; S.open = "an" + a.dataset.id; render(); return; }
    case "supprcom": { const { error } = await sb.from("commentaires").delete().eq("id", a.dataset.id); if (error) { toast("Suppression impossible : " + error.message); return; } delete S.cache[a.dataset.c]; render(); return; }
    case "supprannonce": e.preventDefault(); S.menu = null; S.modal = {kind:"confirm", action:"supprannonce", id:a.dataset.id, classe:a.dataset.c, titre:"Supprimer cette annonce ?", texte:"L'annonce et ses commentaires seront supprimés."}; render(); return;
    case "editannonce": { e.preventDefault(); S.menu = null; const an = ((S.cache[a.dataset.c] || {}).annonces || []).find(x => String(x.id) === a.dataset.id); if (!an) return;
      S.annonce = { classe: a.dataset.c, id: an.id, html: an.texte || "", ressources: clone(an.ressources || []), uploaded: [], toDelete: [], linkMode: null, busy: false }; render(); window.scrollTo(0, 0); setTimeout(() => { const x = document.getElementById("anHtml"); if (x) x.focus(); }, 0); return; }
    case "copiertexte": { e.preventDefault(); S.menu = null; const an = ((S.cache[a.dataset.c] || {}).annonces || []).find(x => String(x.id) === a.dataset.id); const t = an ? (new DOMParser().parseFromString(an.texte || "", "text/html").body.textContent || "") : "";
      try { navigator.clipboard.writeText(t).then(() => toast("Texte copié"), () => toast("Copie impossible")); } catch (_) { toast("Copie impossible"); } render(); return; }
    case "opencoms": S.open = "an" + a.dataset.id; render(); return;

    /* devoirs : élève */
    case "pickfile": e.preventDefault(); S.menu = null; document.getElementById("fileIn").click(); render(); return;
    case "lienopen": e.preventDefault(); S.menu = null; S.lienOpen = true; render(); setTimeout(() => { const l = document.getElementById("lien"); if (l) l.focus(); }, 0); return;
    case "rmfile": S.files.splice(Number(a.dataset.i), 1); render(); return;
    case "submit": rendreDevoir(S.devoirs.find(x => String(x.id) === a.dataset.id)); return;
    case "unsubmit": { const rd = S.rendus.find(x => String(x.id) === a.dataset.id); if (rd && rd.reponse) S.reponse = rd.reponse; const { error } = await sb.from("rendus").delete().eq("id", a.dataset.id);
      if (error) { toast("Annulation impossible : " + error.message); return; }
      const f = (rd.fichiers || []).map(x => x.chemin).filter(Boolean); if (f.length) await sb.storage.from("rendus").remove(f);
      await rafraichir(); render(); toast("Envoi annulé : tu peux modifier ton travail et le rendre à nouveau."); return; }
    case "cpsend": { const inp = document.getElementById("cpIn"), t = inp.value.trim(); if (!t) return;
      const { error } = await sb.from("commentaires_prives").insert({ devoir_id: Number(a.dataset.d), eleve_email: a.dataset.e, auteur_nom: S.nom, texte: t });
      if (error) { toast("Commentaire impossible : " + error.message); return; }
      await chargerCP(Number(a.dataset.d), a.dataset.e, true); render(); return; }

    /* devoirs : professeur */
    case "ptab": S.ptab = a.dataset.t; render(); return;
    case "coinperso": e.preventDefault(); if (window.innerWidth < 1100) { S.drawer = false; render(); } await ouvrirCoinPerso(); return;
    case "urgchoix": e.preventDefault(); fermerMenus(); if (window.innerWidth < 1100) S.drawer = false; S.modal = {kind:"urgchoix"}; render(); return;
    case "urgent": e.preventDefault(); fermerMenus(); if (window.innerWidth < 1100) S.drawer = false; S.modal = {kind:"urgent", classe:a.dataset.c}; marquerReponsesVues(); marquerMessagesProfLus(a.dataset.c); render(); chargerUrgents().then(() => { if (S.modal && S.modal.kind === "urgent") { const t = (document.getElementById("mUrg") || {}).value; S.modal.texte = t; render(); } }); return;
    case "dmnew": case "dmprep": case "dmedit": case "dmsend": case "dmprint": case "dmstat": case "dmsuppr": e.preventDefault(); fermerMenus(); await actionDemande(act, a); return;
    case "rdvnew": case "rdvresa": case "rdvannule": case "rdvretire": case "rdvsuppr": e.preventDefault(); a.disabled = true; await actionRdv(act, a); return;
    case "alertesouv": S.alertesOuv = !S.alertesOuv; render(); return;
    case "vocal": e.preventDefault(); await basculerVocal(a); return;
    case "rmannot": case "rmaudio": e.preventDefault(); await retirerDeCorrection(Number(a.dataset.id), act === "rmannot" ? "annotations" : "audio", Number(a.dataset.i)); return;
    case "annoter": { e.preventDefault(); const rd = S.rendus.find(x => String(x.id) === a.dataset.id); if (!rd) return;
      if (!S.viewer || S.viewer.did !== rd.devoir_id) { const fi = Math.max(0, (rd.fichiers || []).findIndex(peutAnnoter)); S.viewer = { did: rd.devoir_id, email: S.sel || rd.auteur_email, fi }; await render(); }
      await ouvrirAnnotation(); return; }
    case "notifon": e.preventDefault(); await demanderNotifs(); return;
    case "urgecrire": e.preventDefault(); fermerMenus(); S.modal = { kind: "urgprof", classe: a.dataset.c || (route().v === "classe" ? route().a : null), eleve: a.dataset.e || null }; render(); return;
    case "urgrep": case "urglu": case "urgsend": case "urgsuppr": e.preventDefault(); await actionUrgence(act, a); return;
    case "odorphelins": { e.preventDefault(); toast("Recherche des dossiers de cours supprimés…");
      try { const l = await dossiersOrphelins(); if (!l.length) { toast("Aucun dossier de cours supprimé dans OneDrive ✓"); return; }
        S.modal = {kind:"confirm", action:"odorphelins", ids:l.map(x => x.id), ok:"Mettre à la corbeille", titre:"Supprimer " + l.length + " dossier" + (l.length > 1 ? "s" : "") + " de cours supprimé" + (l.length > 1 ? "s" : "") + " ?", texte:"Dossiers trouvés dans OneDrive sans cours correspondant : " + l.map(x => "« " + x.name + " »").join(", ") + ". Ils partent avec tout leur contenu dans la corbeille de ton OneDrive (récupérables pendant 93 jours)."}; render();
      } catch (er) { toast("OneDrive : " + (er.message || er)); } return; }
    case "odranger": e.preventDefault(); toast("Rangement des dossiers OneDrive…"); await rangerDossiersClasses(); return;
    case "odconf": e.preventDefault(); toast("Vérification de la confidentialité OneDrive…"); await synchroPartages(false, true); await rafraichir(); render(); return;
    case "voirstat": { e.preventDefault(); S.swFiltre = a.dataset.f === "anoter" ? "anoter" : a.dataset.f; S.ptab = "travaux"; S.sel = null; fermerMenus();
      if (r.v === "devoir" && r.a === a.dataset.d) render(); else go("/devoir/" + a.dataset.d); return; }
    case "quitter": e.preventDefault(); S.menu = null; { const c = cls(a.dataset.c); S.modal = {kind:"confirm", action:"quitter", classe:a.dataset.c, ok:"Quitter", titre:"Quitter « " + (c ? c.nom : "ce cours") + " » ?", texte:"Tu ne verras plus ce cours ni ses travaux. Tes travaux déjà rendus restent chez ton professeur. Pour revenir plus tard, il te faudra le code du cours."}; } render(); return;
    case "sel": S.sel = a.dataset.n || null; S.compose = false; render(); return;
    case "symb": S.symb = !S.symb; render(); return;
    case "impanalyse": S.imp.texte = (document.getElementById("impTexte") || {}).value || ""; analyserImport(); render(); return;
    case "impgo": if (!S.imp.busy) lancerImport(); return;
    case "impzip": document.getElementById("impZip").click(); return;
    case "odconnect": await connecterOneDrive(); render(); return;
    case "odmigrer": { if (!S.odOk && !(await connecterOneDrive())) { render(); return; } S.odBusy = true; S.odN = 0; render();
      try { const r2 = await migrerVersOneDrive(n => { S.odN = n; const b = document.querySelector('[data-act="odmigrer"]'); if (b) b.textContent = "Copie en cours… " + n; }); toast(r2.n + " document" + (r2.n > 1 ? "s rangés" : " rangé") + " dans OneDrive" + (r2.err ? " · " + r2.err + " erreur(s)" : "")); }
      catch (er) { toast("Rangement impossible : " + (er.message || er)); }
      S.odBusy = false; S.cache = {}; await rafraichir(); render(); return; }
    case "odrendus": { const d = S.devoirs.find(x => String(x.id) === a.dataset.d); a.disabled = true; toast("Copie des travaux dans OneDrive…");
      try { const n = await syncRendus(d, false); toast(n ? n + " fichier" + (n > 1 ? "s copiés" : " copié") + " dans OneDrive" : "Tout est déjà dans OneDrive"); } catch (er) { toast("OneDrive : " + (er.message || er)); } a.disabled = false; return; }
    case "voir": e.preventDefault(); S.viewer = { did: Number(a.dataset.d), email: a.dataset.e, fi: Number(a.dataset.i) || 0 }; render(); return;
    case "vclose": S.viewer = null; render(); return;
    case "vgo": if (a.dataset.e) { S.viewer.email = a.dataset.e; S.viewer.fi = 0; S.sel = a.dataset.e; render(); } return;
    case "vfile": S.viewer.fi = Number(a.dataset.i); render(); return;
    case "exportsuivi": exporterSuivi(a.dataset.c); return;
    case "dupliquer": { e.preventDefault(); S.menu = null; const k = a.dataset.k, id = a.dataset.id;
      const rec = k === "devoir" ? S.devoirs.find(x => String(x.id) === id) : k === "quiz" ? S.quiz.find(x => String(x.id) === id) : ((S.cache[r.a] || {}).supports || []).find(x => String(x.id) === id);
      if (!rec) return; const res = await reutiliser(k, id, rec.classe_id, rec.theme_id ?? null, { titre: "Copie de " + rec.titre });
      if (res.error) { toast("Duplication impossible : " + res.error.message); return; }
      await rafraichir(rec.classe_id); render(); toast("Copie créée en brouillon"); return; }
    case "ins": { const el = document.activeElement; if (el && (el.isContentEditable || el.tagName === "TEXTAREA" || (el.tagName === "INPUT" && !["checkbox", "radio", "number", "color", "file"].includes(el.type)))) document.execCommand("insertText", false, a.dataset.s); else toast("Clique d'abord dans un champ de texte."); return; }
    case "qimg": S.qimgFor = Number(a.dataset.qi); document.getElementById("qimgFile").click(); return;
    case "rmqimg": { const q = S.ed.questions[Number(a.dataset.qi)]; if (q.img && S.ed.uploaded.includes(q.img)) { sb.storage.from("documents").remove([q.img]); S.ed.uploaded = S.ed.uploaded.filter(p => p !== q.img); } q.img = null; render(); return; }
    case "remarque": { const t = document.getElementById("noteCom"); if (t) { t.value = (t.value.trim() ? t.value.trim() + " " : "") + a.dataset.t; t.focus(); } return; }
    case "savenote": { const v = (document.getElementById("note") || {}).value, d = S.devoirs.find(x => x.id === (S.rendus.find(y => String(y.id) === a.dataset.id) || {}).devoir_id);
      const n = v === "" || v == null ? null : Number(String(v).replace(",", ".")), pub = a.dataset.pub === "1";
      if (n != null && (isNaN(n) || n < 0 || (d && d.points != null && n > d.points))) { const x = document.getElementById("noteErr"); x.hidden = false; x.textContent = "La note doit être comprise entre 0 et " + d.points + "."; return; }
      const com = ((document.getElementById("noteCom") || {}).value || "").trim();
      const grille = d && d.grille && d.grille.length ? d.grille.map((g, i) => { const x = (document.getElementById("gr-" + i) || {}).value; return x === "" || x == null ? null : Number(String(x).replace(",", ".")); }) : null;
      if (grille && grille.some((x, i) => x != null && (isNaN(x) || x < 0 || x > d.grille[i].p))) { const x = document.getElementById("noteErr"); x.hidden = false; x.textContent = "Une note de critère dépasse son maximum."; return; }
      const { error } = await sb.from("corrections").upsert({ rendu_id: Number(a.dataset.id), note: n, commentaire: com, grille, competences: lireCompetences(), publiee: pub, modifie_le: now().toISOString() });
      if (error) { toast("Enregistrement impossible : " + error.message); return; }
      const suiv = a.dataset.next === "1" ? eleveVoisin(1) : null; await rafraichir(); if (suiv) S.sel = suiv; render(); toast(pub ? "Travail rendu à l'élève" + (suiv ? " · élève suivant" : "") : "Brouillon enregistré"); return; }
    case "rendretout": { e.preventDefault(); S.menu = null; const d = S.devoirs.find(x => String(x.id) === a.dataset.d);
      const ids = rendusDe(d).filter(rd => { const c = correctionDe(rd); return c && c.note != null && !c.publiee; }).map(rd => rd.id);
      if (!ids.length) { toast("Aucune note en brouillon à rendre pour ce devoir."); render(); return; }
      const { error } = await sb.from("corrections").update({ publiee: true, modifie_le: now().toISOString() }).in("rendu_id", ids);
      if (error) { toast("Action impossible : " + error.message); return; }
      await rafraichir(); render(); toast(ids.length + " note" + (ids.length > 1 ? "s rendues" : " rendue")); return; }
    case "mailmissing": { const d = S.devoirs.find(x => String(x.id) === a.dataset.d), el = elevesDuDevoir(d, (S.cache[d.classe_id] || {eleves:[]}).eleves);
      S.pick = new Set(el.filter(x => !renduDe(d, x.email)).map(x => x.email)); S.compose = true; S.cSub = "Rappel : " + d.titre;
      S.cBody = "Bonjour,\n\nJe n'ai pas encore reçu ton travail « " + d.titre + " ». " + (d.date_limite ? (ouvert(d) ? "La date limite est le " + fmtD(D(d.date_limite)) + " à " + fmtT(D(d.date_limite)) + "." : "La date limite est passée, viens me voir.") : "") + "\n\n" + R().prof.nom; render(); return; }

    /* questionnaires : élève */
    case "valider": envoyerQuiz(Number(a.dataset.q)); return;
    case "retry": delete S.quizRep[a.dataset.q]; delete S.quizRes[a.dataset.q]; render(); return;
  }
});

/* ---------- saisie ---------- */
document.addEventListener("mousedown", e => { if (e.target.closest && e.target.closest("[data-keepfocus]")) e.preventDefault(); });
document.addEventListener("input", e => {
  const t = e.target;
  if (t.id === "edHtml" && S.ed) { S.ed.html = t.innerHTML; return; }
  if (t.id === "anHtml" && S.annonce) { S.annonce.html = t.innerHTML; return; }
  if (S.ed && t.dataset.qi != null && t.dataset.qk === "q") { S.ed.questions[Number(t.dataset.qi)].q = t.value; return; }
  if (S.ed && t.classList.contains("otext")) { S.ed.questions[Number(t.dataset.qi)].o[Number(t.dataset.oi)] = t.value; return; }
  if (S.ed && t.dataset.f && t.tagName !== "SELECT") { S.ed[t.dataset.f] = t.value; return; }
  if (S.modal && S.modal.kind === "liens" && t.dataset.li != null) { S.modal.liens[Number(t.dataset.li)][t.dataset.k] = t.value; return; }
  if (S.settings && t.dataset.s && t.tagName !== "SELECT" && t.type !== "checkbox") { S.settings[t.dataset.s] = t.value; if (["nom", "section", "symbole"].includes(t.dataset.s)) { const p = document.querySelector(".preview"); if (p) { p.querySelector("h1").textContent = S.settings.nom || "Nom du cours"; p.querySelector("span:not(.sym)").textContent = S.settings.section; const sy = p.querySelector(".sym"); if (sy) sy.textContent = S.settings.symbole; } } return; }
  if (t.id === "cSub" || t.id === "cBody") { S[t.id] = t.value; const l = document.getElementById("olk"); if (l) l.href = outlookLink([...S.pick], S.cSub, S.cBody); return; }
  if (t.id === "lien") { S.lien = t.value; return; }
  if (t.id === "repQ") { S.reponse = t.value; return; }
  if (t.id === "impTexte" && S.imp) { S.imp.texte = t.value; return; }
  if (S.settings && t.dataset.cat != null) { S.settings.categories[Number(t.dataset.cat)][t.dataset.k] = t.value; return; }
  if (t.dataset.gr != null) { const ins = [...document.querySelectorAll("[data-gr]")], vals = ins.map(x => Number(String(x.value).replace(",", "."))).filter(x => !isNaN(x) && String(x) !== ""); const n = document.getElementById("note"); if (n) n.value = ins.some(x => x.value !== "") ? Math.round(ins.reduce((a, x) => a + (Number(String(x.value).replace(",", ".")) || 0), 0) * 100) / 100 : ""; return; }
  if (t.dataset.act === "anstxt") { const id = t.dataset.q; S.quizRep[id] = S.quizRep[id] || {}; S.quizRep[id][Number(t.dataset.i)] = t.value; return; }
  if (S.ed && t.dataset.gr2 != null) { S.ed.grille[Number(t.dataset.gr2)][t.dataset.k] = t.value; if (t.dataset.k === "p") { const tot = document.querySelector(".edcard .muted b"); } return; }
  if (S.ed && t.dataset.qo != null) { S.ed.qoptions[Number(t.dataset.qo)] = t.value; return; }
  if (S.ed && t.dataset.qnum != null) { const q = S.ed.questions[Number(t.dataset.qnum)]; q.num = q.num || { v: "", tol: "5" }; q.num[t.dataset.k] = t.value; return; }
  if (S.ed && t.dataset.qacc != null) { S.ed.questions[Number(t.dataset.qacc)].acc = t.value; return; }
  if (S.adm && t.dataset.ad && t.type !== "checkbox" && t.tagName !== "SELECT" && t.type !== "color") { setPath(S.adm, t.dataset.ad, t.value); if (!S.adm.modif) { S.adm.modif = true; const b = document.querySelector(".savebar"); if (b) { b.classList.add("on"); b.firstElementChild.textContent = "Modifications non enregistrées"; const sv = b.querySelector('[data-act="admsave"]'); if (sv) sv.disabled = false; } } return; }
  if (t.dataset.adq) { S.admQ = t.value; render(); return; }
  if (t.id === "mListe" && S.modal && S.modal.kind === "ajouteleves") { S.modal.texte = t.value; const ap = document.getElementById("mApercu"); if (ap) ap.innerHTML = apercuListe(S.modal); return; }
});
document.addEventListener("change", async e => {
  const t = e.target, r = route();
  if (t.dataset.act === "ans") { const id = t.dataset.q; S.quizRep[id] = S.quizRep[id] || {}; S.quizRep[id][Number(t.dataset.i)] = Number(t.dataset.j); return; }
  if (t.dataset.act === "bonne") { S.ed.questions[Number(t.dataset.qi)].a = Number(t.dataset.oi); render(); return; }
  if (t.dataset.act === "cibletous") { const el = (S.cache[S.ed.classe_id] || {eleves:[]}).eleves; S.modal.sel = t.checked ? null : []; render(); return; }
  if (t.dataset.act === "cibleun") { const el = (S.cache[S.ed.classe_id] || {eleves:[]}).eleves; let s = S.modal.sel == null ? el.map(x => x.email) : S.modal.sel.slice(); s = t.checked ? [...new Set([...s, t.dataset.e])] : s.filter(x => x !== t.dataset.e); S.modal.sel = s.length === el.length ? null : s; render(); return; }
  if (t.dataset.act === "note") {
    const n = t.value.trim() === "" ? null : Number(t.value.replace(",", ".")), max = Number(t.dataset.max);
    if (n != null && (isNaN(n) || n < 0 || n > max)) { toast("La note doit être comprise entre 0 et " + max + "."); t.classList.add("bad"); return; }
    t.classList.remove("bad");
    const old = S.corrections.find(c => c.rendu_id === Number(t.dataset.rendu));
    const { error } = await sb.from("corrections").upsert({ rendu_id: Number(t.dataset.rendu), note: n, publiee: old ? old.publiee : false, modifie_le: now().toISOString() });
    if (error) { toast("Note non enregistrée : " + error.message); return; }
    if (old) old.note = n; else S.corrections.push({ rendu_id: Number(t.dataset.rendu), note: n, publiee: false });
    const s = t.parentElement.querySelector(".s"); if (s) { const pub = old && old.publiee; s.textContent = n == null ? "Rendu" : pub ? "" : "Brouillon"; }
    toast(old && old.publiee ? "Note modifiée (déjà rendue à l'élève)" : "Note enregistrée en brouillon"); return;
  }
  if (t.id === "partenaire") { S.partenaire = t.value; return; }
  if (t.dataset.act === "repchoix") { S.reponse = t.value; return; }
  if (t.dataset.act === "anscase") { const id = t.dataset.q, i = Number(t.dataset.i), j = Number(t.dataset.j); S.quizRep[id] = S.quizRep[id] || {}; const cur = new Set(S.quizRep[id][i] || []); t.checked ? cur.add(j) : cur.delete(j); S.quizRep[id][i] = [...cur]; return; }
  if (t.dataset.act === "bonnecase") { const q = S.ed.questions[Number(t.dataset.qi)], j = Number(t.dataset.oi), cur = new Set(Array.isArray(q.a) ? q.a : []); t.checked ? cur.add(j) : cur.delete(j); q.a = [...cur]; render(); return; }
  if (S.ed && t.dataset.qt != null) { const q = S.ed.questions[Number(t.dataset.qt)]; q.t = t.value; q.num = q.num || { v: "", tol: "5" }; q.a = t.value === "cases" ? (q.a != null && !Array.isArray(q.a) ? [q.a] : Array.isArray(q.a) ? q.a : []) : t.value === "choix" ? (Array.isArray(q.a) ? (q.a[0] ?? null) : q.a) : null; if (q.o.length < 2) q.o = ["", ""]; render(); return; }
  if (t.id === "edVoir" && S.ed) { S.ed.qvoir = t.checked; return; }
  if (t.id === "edRetard" && S.ed) { S.ed.retard = t.checked; return; }
  if (t.id === "edMelanger" && S.ed) { S.ed.melanger = t.checked; return; }
  if (S.ed && t.dataset.gr2 != null && t.dataset.k === "p") { render(); return; }
  if (t.id === "edModif" && S.ed) { S.ed.qmodif = t.checked; return; }
  if (t.dataset.act === "inscr") { const on = t.checked, cid = t.dataset.c, email = t.dataset.e; t.disabled = true;
    const { error } = on ? await sb.from("inscriptions").upsert({ classe_id: cid, email, nom: t.dataset.n }, { onConflict: "classe_id,email", ignoreDuplicates: true }) : await sb.from("inscriptions").delete().eq("classe_id", cid).eq("email", email);
    if (error) { toast("Action impossible : " + error.message); t.checked = !on; t.disabled = false; return; }
    await rafraichir(); toast((on ? "Inscrit en " : "Retiré de ") + cls(cid).nom); render(); return; }
  if (S.adm && t.dataset.ad) { setPath(S.adm, t.dataset.ad, t.type === "checkbox" ? t.checked : t.value); S.adm.modif = true; render(); return; }
  if (t.dataset.pref) { const p = { ...prefs() }; p[t.dataset.pref] = t.checked; await sauverPrefs(p); render(); return; }
  if (t.dataset.prefc) { const p = { ...prefs() }, off = new Set(p.cours_off || []); t.checked ? off.delete(t.dataset.prefc) : off.add(t.dataset.prefc); p.cours_off = [...off]; await sauverPrefs(p); return; }
  if (t.classList && t.classList.contains("edAussi") && S.ed) { const v = t.value; S.ed.aussi = t.checked ? [...new Set([...S.ed.aussi, v])] : S.ed.aussi.filter(x => x !== v); return; }
  if (t.classList && t.classList.contains("anAussi") && S.annonce) { const v = t.value, l = S.annonce.aussi || []; S.annonce.aussi = t.checked ? [...new Set([...l, v])] : l.filter(x => x !== v); return; }
  if (t.dataset.impmap != null) { S.imp.map[t.dataset.impmap] = t.value; return; }
  if (t.id === "impBrouillons") { S.imp.brouillons = t.checked; return; }
  if (t.dataset.urgc && S.modal) { S.modal.texte = (document.getElementById("upTexte") || {}).value || ""; S.modal.classe = t.value; S.modal.eleve = null; render(); return; }
  if (t.dataset.urgf) { S.urgF = t.value; render(); return; }
  if (t.dataset.swf) { S.swFiltre = t.value; render(); return; }
  if (t.dataset.swt) { S.swTri = t.value; try { localStorage.setItem("pp_tri", t.value); } catch (_) {} render(); return; }
  if (t.dataset.accepte) { const d = S.devoirs.find(x => String(x.id) === t.dataset.accepte), on = t.checked; if (!d) return; t.disabled = true;
    const { error } = await sb.from("devoirs").update({ accepte: on }).eq("id", d.id);
    if (error) { toast("Modification impossible : " + error.message); t.checked = !on; t.disabled = false; return; }
    d.accepte = on; toast(on ? "Les élèves peuvent de nouveau rendre ce devoir" : "Devoirs non acceptés : la remise est verrouillée"); render(); return; }
  if (t.dataset.suivi) { S.suiviC = t.value; S.open = null; render(); return; }
  if (t.dataset.agenda != null) { go(t.value ? "/agenda/" + t.value : "/agenda"); return; }
  if (t.dataset.themeChoice) { appliquerTheme(t.value); toast("Apparence modifiée"); return; }
  if (t.dataset.adf) { S.admF = t.value; render(); return; }
  if (t.dataset.mclasse && S.modal) { S.modal.classe = t.value; const ap = document.getElementById("mApercu"); if (ap) ap.innerHTML = apercuListe(S.modal); return; }
  if (t.id === "edMontrer" && S.ed) { S.ed.montrer = t.checked; return; }
  if (t.dataset.f === "filtre") { S.filtreTheme = t.value; render(); return; }
  if (S.settings && t.dataset.s) { const k = t.dataset.s; S.settings[k] = t.type === "checkbox" ? t.checked : ["code_actif", "flux_devoirs"].includes(k) ? t.value === "1" : t.value; if (k === "couleur" || k === "illustration") render(); return; }
  if (!S.ed || !t.dataset.f || t.tagName !== "SELECT") return;
  const f = t.dataset.f, v = t.value;
  if (f === "theme_id" && v === "__new") { t.value = S.ed.theme_id; S.modal = {kind:"theme", classe:S.ed.classe_id, fromEditor:true}; render(); return; }
  if (f === "hasDate") { S.ed.hasDate = v === "1"; render(); return; }
  if (f === "classe_id") { S.ed.classe_id = v; S.ed.theme_id = ""; S.ed.eleves = null; await chargerClasse(v); render(); return; }
  S.ed[f] = v; if (f === "mode" || f === "qformat") render();
});
document.addEventListener("keydown", e => {
  if (e.key === "Enter" && S.modal && e.target.closest && e.target.closest(".modal") && e.target.tagName === "INPUT" && e.target.type !== "checkbox") { e.preventDefault(); modalOk(); return; }
  if (e.key === "Enter" && e.target.id && e.target.id.startsWith("cm-")) { e.preventDefault(); const b = e.target.parentElement.querySelector('[data-act="comment"]'); if (b) b.click(); return; }
  if (e.key === "Enter" && e.target.id === "cpIn") { e.preventDefault(); const b = e.target.parentElement.querySelector('[data-act="cpsend"]'); if (b) b.click(); return; }
  if (e.key === "Enter" && e.target.dataset && e.target.dataset.act === "note") { e.target.blur(); return; }
  if (S.viewer && !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName || "") && (e.key === "ArrowLeft" || e.key === "ArrowRight")) { const b = document.querySelectorAll('[data-act="vgo"]')[e.key === "ArrowLeft" ? 0 : 1]; if (b && !b.disabled) b.click(); return; }
  if (e.key === "Escape" && document.getElementById("coinPerso") && e.target.closest && e.target.closest("#coinPerso")) { fermerCoinPerso(); return; }
  if (e.key === "Escape" && S.viewer && !S.modal) { S.viewer = null; render(); return; }
  if (e.key === "Escape" && DG.on) { finDrag(true); return; }
  if (e.key === "Escape" && DT.on) { dtFin(true); return; }
  if (e.key === "Escape") { if (S.modal && !S.modal.busy) { S.modal = null; render(); return; } if (S.dd || S.me || S.menu) { fermerMenus(); render(); return; } if (S.drawer && window.innerWidth < 1100) { S.drawer = false; render(); } }
});
window.addEventListener("hashchange", () => {
  const r = route();
  if (r.v !== "editer") S.ed = null;
  if (!(r.v === "classe" && r.t === "parametres")) S.settings = null;
  if (r.v !== "admin") S.adm = null;
  S.outilsEdit = false;
  S.viewer = null;
  if (r.v === "rendezvous") S.rdv = null;
  if (r.v === "preparateur") S.demandes = null;
  if (r.v !== "devoir") { S.swFiltre = ""; S.reponse = ""; S.sel = null; S.ptab = "travaux"; S.files = []; S.lien = ""; S.lienOpen = false; S.partenaire = ""; }
  fermerMenus(); S.modal = null; S.open = null; S.compose = false; S.pick = new Set(); S.cSub = ""; S.cBody = ""; S.annonce = null; S.filtreTheme = "";
  if (window.innerWidth < 1100) S.drawer = false; window.scrollTo(0, 0); render();
});
let lastW = window.innerWidth;
window.addEventListener("resize", () => { const w = window.innerWidth; if ((lastW >= 1100) !== (w >= 1100)) { S.drawer = w >= 1100; if (S.profil) render(); } lastW = w; });

/* ---------- démarrage ---------- */
(async function start(){
  const p = new URLSearchParams(location.search + "&" + location.hash.replace(/^#/, ""));
  const errDesc = p.get("error_description");
  if (errDesc) { history.replaceState(null, "", ICI); vLogin(messageErreur(errDesc)); return; }
  const { data: { session } } = await sb.auth.getSession();
  if (location.search) history.replaceState(null, "", ICI + location.hash);
  const rj = route();
  if (rj.v === "rejoindre" && rj.a) { try { localStorage.setItem("pp_join", rj.a); } catch (_) {} }
  if (!session) {
    S.public = true; await chargerPublic();
    if (rj.v === "rejoindre") { vLogin("Connecte-toi avec ton compte Microsoft 365 du lycée : tu rejoindras ensuite le cours automatiquement.", true); return; }
    renderPublic(); return;
  }
  let pj = null, suite = null, fresh = false;
  try { pj = localStorage.getItem("pp_join"); localStorage.removeItem("pp_join"); suite = localStorage.getItem("pp_next"); localStorage.removeItem("pp_next"); fresh = localStorage.getItem("pp_fresh") === "1"; localStorage.removeItem("pp_fresh"); } catch (_) {}
  if (pj && route().v !== "rejoindre") history.replaceState(null, "", ICI + "#/rejoindre/" + encodeURIComponent(pj));
  else if (suite && /^#\/[\w%\-\/.]*$/.test(suite) && route().v === "accueil") history.replaceState(null, "", ICI + suite);
  S.user = session.user;
  const { data: profil, error } = await sb.from("profiles").select("*").eq("id", S.user.id).maybeSingle();
  if (error || !profil) { vLogin("Ton profil n'a pas pu être chargé. Déconnecte-toi puis reconnecte-toi."); await sb.auth.signOut(); return; }
  S.profil = profil; S.prof = profil.role === "prof";
  if (S.prof) S.nom = R().prof.nom;
  else {
    const { data: ins } = await sb.from("inscriptions").select("nom").eq("email", profil.email).limit(1);
    S.nom = (ins && ins[0] && ins[0].nom) || (profil.nom && !profil.nom.includes("@") ? profil.nom : nomDepuisEmail(profil.email));
  }
  try { await chargerTout(); } catch (e) { app.innerHTML = `<div class="loading"><div class="notice">Impossible de charger tes données : ${esc(e.message)}</div></div>`; return; }
  if (S.prof) S.nom = R().prof.nom;
  try { S.recent = localStorage.getItem("pp_recent") !== "0"; S.swTri = localStorage.getItem("pp_tri") || "statut"; } catch (_) {}
  /* juste après la connexion : un élève inscrit dans un seul cours arrive directement dans ce cours */
  if (fresh && !S.prof && !pj && route().v === "accueil" && actives().length === 1) history.replaceState(null, "", ICI + "#/classe/" + encodeURIComponent(actives()[0].id));
  render();
  chargerNotifs().catch(() => {});
  demarrerPresence();
  if (S.prof) setTimeout(async () => { await synchroPartages(true); await transfererRendus(true); await genererCopies(true); }, 4000);
  if (S.prof) setInterval(() => { if (document.visibilityState === "visible") transfererRendus(true); }, 600000);
  setInterval(() => { if (document.visibilityState === "visible") chargerNotifs().catch(() => {}); }, 180000);
  setInterval(() => { chargerUrgents(); }, 45000);
  sb.auth.onAuthStateChange(ev => { if (ev === "SIGNED_OUT") location.replace(ICI); });
})();
})();
