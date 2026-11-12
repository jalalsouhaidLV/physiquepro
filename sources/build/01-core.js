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
/* titre : espace insécable avant : ; ! ? » et après « (pas de « : ondes » seul à la ligne) */
const escTitre = s => esc(s).replace(/ ([:;!?»])/g, "\u00a0$1").replace(/« /g, "«\u00a0");
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
const linkify = t => esc(t).replace(/ ([?!;:»])/g, "\u00a0$1").replace(/« /g, "«\u00a0").replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>').replace(/\n/g, "<br>");

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
/* 5e évaluation (11/11/2026) : l'élève (parfois collégien) lit des mots simples ; le prof garde ceux de Classroom */
const libEtat = t => S.prof ? t : t === "Attribué" ? "À faire" : t === "Manquant" ? "En retard" : t;
const resultatDe = (q, uid) => S.resultats.find(x => x.quiz_id === q.id && x.eleve === uid);
const noteQuiz = (q, r) => r ? Math.round(r.score / Math.max(1, r.sur) * (q.points || 20) * 100) / 100 : null;
