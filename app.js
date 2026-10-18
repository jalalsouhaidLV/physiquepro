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
const nomDepuisEmail = e => String(e || "").split("@")[0].split(".").map(x => x.split("-").map(y => y.charAt(0).toUpperCase() + y.slice(1)).join("-")).join(" ");
const dueTxt = d => {
  const t = now(); if (sameDay(d, t)) return "Aujourd'hui, " + fmtT(d);
  const y = new Date(t); y.setDate(t.getDate() + 1); if (sameDay(d, y)) return "Demain, " + fmtT(d);
  return "Échéance : " + fmtD(d) + ", " + fmtT(d);
};
const ouvert = d => !d.date_limite || D(d.date_limite) > now();
const depotOuvert = d => ouvert(d) || !!d.retard_ok;
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
const ICONES = [["logo-pronote","Logo Pronote"],["logo-lycee","Logo Lycée Verdun"],["logo-pix","Logo PIX"],["logo-outlook","Logo Outlook"],["logo-onedrive","Logo OneDrive"],["pronote","Pronote (P)"],["pix","PIX"],["ecole","École"],["mail","E-mail"],["nuage","Nuage (OneDrive)"],["links","Lien"],["video","Vidéo"],["cal","Calendrier"],["folder","Dossier"],["tools","Outil"]];
const clone = o => JSON.parse(JSON.stringify(o));
function appliquerReglages(d){
  d = d || {};
  S.R = {
    prof: { nom: (d.prof && d.prof.nom) || CFG.prof.nom, titre: (d.prof && d.prof.titre != null) ? d.prof.titre : CFG.prof.titre, email: CFG.prof.email },
    liensUtiles: Array.isArray(d.liensUtiles) ? d.liensUtiles : CFG.liensUtiles,
    outils: Array.isArray(d.outils) ? d.outils : CFG.outils,
    onedrive: !!d.onedrive,
    remarques: Array.isArray(d.remarques) ? d.remarques : ["Très bon travail.", "Attention aux unités.", "Chiffres significatifs à revoir.", "Justifie davantage ton raisonnement.", "Schéma incomplet ou non légendé.", "Relis la consigne.", "Bon raisonnement, mais erreur de calcul."]
  };
}
const R = () => S.R;
const reglagesData = () => ({ prof: { nom: R().prof.nom, titre: R().prof.titre }, liensUtiles: R().liensUtiles, outils: R().outils, remarques: R().remarques, onedrive: R().onedrive });

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
  if (S.prof) reqs.push(sb.from("inscriptions").select("classe_id, email, nom"), sb.from("profiles").select("id, email, nom, role, cree_le"));
  const [res, reg] = await Promise.all([Promise.all(reqs), sb.from("reglages").select("data").eq("id", 1).maybeSingle()]);
  appliquerReglages(reg && !reg.error && reg.data ? reg.data.data : null);
  for (const r of res) if (r.error) throw r.error;
  [S.classes, S.devoirs, S.rendus, S.corrections, S.quiz, S.resultats] = res.slice(0, 6).map(r => r.data);
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
    <div class="brand" style="cursor:default;padding:0">${logoSVG}<b>Physique<span>Pro</span></b></div>
    <div><h2 style="font-size:1.4rem">Connexion</h2><p class="muted" style="margin:.3rem 0 0">Utilise ton compte Microsoft 365 du lycée.</p></div>
    ${message ? `<div class="${info ? "notice" : "err"}">${message}</div>` : ""}
    <div class="field"><label for="mail">Adresse Microsoft 365</label><input id="mail" type="email" placeholder="prenom.nom@${esc(CFG.domaine)}" autocomplete="username"></div>
    <div id="mailErr" class="err" hidden></div>
    <button class="btn" id="loginBtn">Se connecter</button>
    <p class="muted" style="margin:0;font-size:.82rem">Tu passeras par la page Microsoft habituelle pour taper ton mot de passe, puis tu reviendras ici.</p>
    ${logos.replace('class="logos"', 'class="logos" style="justify-content:center;border-top:1px solid var(--line);padding-top:14px"')}
  </div></div>`;
  const btn = document.getElementById("loginBtn"), inp = document.getElementById("mail");
  const lancer = async () => {
    const m = inp.value.trim().toLowerCase(), err = document.getElementById("mailErr");
    if (m && !m.endsWith("@" + CFG.domaine)) { err.hidden = false; err.textContent = "Cette adresse n'appartient pas au lycée. Utilise ton adresse en @" + CFG.domaine + "."; return; }
    btn.disabled = true; btn.textContent = "Redirection vers Microsoft…";
    const { error } = await sb.auth.signInWithOAuth({ provider: "azure", options: { scopes: "openid email profile", redirectTo: ICI, queryParams: m ? { login_hint: m } : { prompt: "select_account" } } });
    if (error) { btn.disabled = false; btn.textContent = "Se connecter"; err.hidden = false; err.textContent = "La connexion n'a pas pu démarrer : " + error.message; }
  };
  btn.onclick = lancer; inp.onkeydown = e => { if (e.key === "Enter") lancer(); };
}
const messageErreur = desc => /Database error saving new user|non autoris/i.test(desc) ? "Cette adresse n'est pas autorisée : seules les adresses @" + esc(CFG.domaine) + " peuvent se connecter." : "La connexion a échoué : " + esc(desc);

/* ---------- barre du haut ---------- */
const LOGOS_RAPIDES = { "logo-pronote": "logo-pronote.png", "logo-lycee": "logo-lycee.png", "logo-pix": "logo-pix.png", "logo-outlook": "logo-outlook.png", "logo-onedrive": "logo-onedrive.png" };
function quickIcon(k){
  if (LOGOS_RAPIDES[k]) return `<img class="qlogo" src="${LOGOS_RAPIDES[k]}" alt="">`;
  if (k === "pronote") return `<b class="qp">P</b>`;
  if (k === "pix") return `<b class="qp" style="font-size:.72rem;letter-spacing:.02em">PIX</b>`;
  return icon(k === "ecole" ? "ecole" : k === "mail" ? "mail" : k === "nuage" ? "nuage" : "links");
}
function topbar(r){
  let crumb = "";
  const c = r.v === "classe" ? cls(r.a) : r.v === "devoir" ? cls((S.devoirs.find(d => String(d.id) === r.a) || {}).classe_id) : r.v === "quiz" ? cls((S.quiz.find(q => String(q.id) === r.a) || {}).classe_id) : null;
  if (c) crumb = `<span class="sep">›</span><a class="cur" href="#/classe/${esc(c.id)}" style="color:inherit;text-decoration:none">${esc(c.nom)}<small>${esc(c.section)}</small></a>`;
  return `<header class="topbar">
    <button class="ib" data-act="drawer" aria-label="Menu principal">${icon("menu")}</button>
    <div class="crumbs"><a class="brand" href="#/" style="text-decoration:none;color:inherit">${logoSVG}<b>Physique<span>Pro</span></b></a>${crumb}</div>
    <span class="spacer"></span>
    <nav class="quick" aria-label="Liens rapides">${R().liensUtiles.map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener" class="${l.principal ? "main" : ""}" style="--q:${esc(l.couleur)}"><span class="qi">${quickIcon(l.icone)}</span><span class="ql">${esc(l.nom)}</span></a>`).join("")}</nav>
    ${cloche()}
    <div class="dd ddplus"><button class="ib" data-act="dd" title="${S.prof ? "Créer un cours" : "Rejoindre un cours"}" aria-label="${S.prof ? "Créer un cours" : "Rejoindre un cours"}" aria-expanded="${S.dd}">${icon("plus")}</button>
      ${S.dd ? `<div class="dd-menu"><a href="#" data-act="${S.prof ? "newclass" : "join"}">${icon("plus")} ${S.prof ? "Créer un cours" : "Rejoindre un cours"}</a></div>` : ""}</div>
    <div class="dd"><button class="avatar" data-act="me" title="${esc(S.nom)}" style="border:0;cursor:pointer">${initials(S.nom)}</button>
      ${S.me ? `<div class="dd-menu"><div style="padding:8px 10px"><b>${esc(S.nom)}</b><br><small class="muted">${esc(moi())}</small></div><a href="#" data-act="logout">${icon("logout")} Se déconnecter</a></div>` : ""}</div>
  </header>`;
}
function drawer(r){
  const cur = v => r.v === v ? 'aria-current="page"' : "";
  const arch = S.classes.some(c => c.archive);
  return `<nav class="drawer" ${S.drawer ? "" : "hidden"} aria-label="Menu principal">
    <a class="it" href="#/" ${cur("accueil")}>${icon("home")}<span class="lbl">Accueil</span></a>
    <a class="it" href="#/agenda" ${cur("agenda")}>${icon("cal")}<span class="lbl">Agenda</span></a>
    <hr><div class="sect">${icon("people")} ${S.prof ? "Cours enseignés" : "Cours suivis"}</div>
    <a class="it" href="#/todo" ${cur("todo")}>${icon(S.prof ? "check" : "todo")}<span class="lbl">${S.prof ? "À corriger" : "À faire"}</span></a>
    ${S.prof ? `<a class="it" href="#/suivi" ${cur("suivi")}>${icon("grade")}<span class="lbl">Suivi des élèves</span></a>` : ""}
    ${actives().map(c => `<a class="it" href="#/classe/${esc(c.id)}" ${r.v === "classe" && r.a === c.id ? 'aria-current="page"' : ""}><span class="ini" style="--bb:var(${C(c.couleur).b})">${esc((c.symbole || c.nom).slice(0, 3))}</span><span class="lbl">${esc(c.nom)}<small>${S.prof ? nbTxt(S.nbEleves[c.id]) : esc(c.section)}</small></span></a>`).join("")}
    <hr>${arch && S.prof ? `<a class="it" href="#/archives" ${cur("archives")}>${icon("archive")}<span class="lbl">Cours archivés</span></a>` : ""}
    <a class="it" href="#/outils" ${cur("outils")}>${icon("tools")}<span class="lbl">Boîte à outils</span></a>
    <a class="it" href="#/admin/profil" ${cur("admin")}>${icon("gear")}<span class="lbl">Paramètres</span></a>
  </nav>${S.drawer && window.innerWidth < 1100 ? `<div class="scrim" data-act="drawer"></div>` : ""}`;
}
const nbTxt = n => (n || 0) + " élève" + ((n || 0) > 1 ? "s" : "");
const pageHead = () => `<div class="foot headband"><span><b>PhysiquePro</b> · site de M. ${esc(R().prof.nom)}${R().prof.titre ? " · " + esc(R().prof.titre) : ""}</span>${logos}</div>`;
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
    }
  }
  const menuEleve = !S.prof && !archivee ? `<div class="dd kebab"><button class="ib" data-act="menu" data-m="c${esc(c.id)}" aria-label="Options du cours">${icon("more")}</button>${S.menu === "c" + c.id ? `<div class="dd-menu">${deplacerMenu(c)}</div>` : ""}</div>` : "";
  const menu = !S.prof ? menuEleve : `<div class="dd kebab"><button class="ib" data-act="menu" data-m="c${esc(c.id)}" aria-label="Options du cours">${icon("more")}</button>${S.menu === "c" + c.id ? `<div class="dd-menu">
      ${archivee ? `<a href="#" data-act="archiver" data-c="${esc(c.id)}" data-on="0">${icon("restore")} Restaurer</a><a href="#" data-act="supprclasse" data-c="${esc(c.id)}" style="color:var(--bad)">${icon("trash")} Supprimer</a>`
        : `${c.code ? `<a href="#" data-act="copylien" data-code="${esc(c.code)}">${icon("links")} Copier le lien d'invitation</a>` : ""}<a href="#/classe/${esc(c.id)}/parametres">${icon("edit")} Modifier</a>${deplacerMenu(c)}<a href="#" data-act="copiercours" data-c="${esc(c.id)}">${icon("copy")} Copier</a><a href="#" data-act="archiver" data-c="${esc(c.id)}" data-on="1">${icon("archive")} Archiver</a>`}</div>` : ""}</div>`;
  return `<article class="ccard${archivee ? " archived" : " movable"}" data-cid="${esc(c.id)}" style="--bb:var(${k.b})">
    <div style="position:relative">
      <a class="banner" href="#/classe/${esc(c.id)}">${bannerArt(c)}<h2>${esc(c.nom)}</h2>${c.section ? `<p>${esc(c.section)}</p>` : ""}<span class="teacher">${S.prof ? nbTxt(S.nbEleves[c.id]) : esc(R().prof.nom)}</span></a>
      ${S.prof ? "" : avatarP(R().prof.nom, "lg ph")}
    </div>
    <div class="body">${body}</div>
    <div class="cfoot">
      ${S.prof ? `<a class="ib" href="#/classe/${esc(c.id)}/notes" title="Notes" aria-label="Notes de ${esc(c.nom)}">${icon("grade")}</a>` : `<a class="ib" href="#/todo" title="Mes travaux" aria-label="Mes travaux">${icon("todo")}</a>`}
      ${c.dossier_onedrive ? `<a class="ib" href="${esc(c.dossier_onedrive)}" target="_blank" rel="noopener" title="Dossier OneDrive du cours" aria-label="Dossier OneDrive de ${esc(c.nom)}">${icon("folder")}</a>` : ""}
      ${menu}
    </div></article>`;
}
function deplacerMenu(c){
  const l = actives(), i = l.findIndex(x => x.id === c.id);
  return `${i > 0 ? `<a href="#" data-act="deplacer" data-c="${esc(c.id)}" data-pos="0">${icon("up")} Placer en premier</a><a href="#" data-act="deplacer" data-c="${esc(c.id)}" data-pos="${i - 1}">${icon("left")} Déplacer avant</a>` : ""}${i < l.length - 1 ? `<a href="#" data-act="deplacer" data-c="${esc(c.id)}" data-pos="${i + 1}">${icon("right")} Déplacer après</a>` : ""}`;
}
function vAccueil(){
  const list = actives();
  if (!list.length) return `<div class="page">${S.prof ? `<div class="emptystate"><b>Aucun cours actif.</b><span>Crée ton premier cours avec le bouton + en haut de la page.</span><div><button class="btn" data-act="newclass">${icon("plus")} Créer un cours</button></div></div>` :
    `<div class="emptystate"><b>Tu n'es inscrit dans aucun cours pour l'instant.</b><span>Demande le code du cours à ton professeur, puis rejoins-le.</span><div><button class="btn" data-act="join">${icon("plus")} Rejoindre un cours</button></div></div>`}${pageFoot()}</div>`;
  return `<div class="page wide home">${blocRecent()}
    <section class="homepanel"><div class="homehead"><h1>Cours</h1><button class="linkbtn" data-act="${S.prof ? "newclass" : "join"}">${icon("plus")} ${S.prof ? "Ajouter un cours" : "Rejoindre un cours"}</button></div>
    <div class="cards">${list.map(c => carte(c, false)).join("")}</div></section>${pageFoot()}</div>`;
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
    if (S.prof && it.k === "devoir") { const el = elevesDuDevoir(o, inscritsDe(o.classe_id)); droite = `<span class="muted">${el.filter(e => renduDe(o, e.email)).length} rendu(s) / ${el.length}</span>`; }
    else if (!S.prof && it.k === "devoir") { const e = etat(o, moi()); droite = `<span class="pill ${e.k}">${e.t}</span>`; }
    return `<a class="recentrow" href="#/${it.k}/${o.id}" style="--c:var(${C(c.couleur).c})"><span class="ico">${icon(it.k === "devoir" && o.type === "question" ? "question" : it.k, "")}</span><span class="tt">${esc(o.titre)}<small>${esc(c.nom)} · ${dueTxt(D(o.date_limite)).replace("Échéance : ", "")}</small></span>${droite}</a>`; };
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
  return `<div class="tabsbar" style="--c:var(${C(c.couleur).c})"><div class="tabs" role="tablist">${T.map(([k, l]) => `<a role="tab" aria-selected="${tab === k}" href="#/classe/${esc(c.id)}/${k}">${l}</a>`).join("")}</div>
    <div class="tabicons">
      ${teamsVisible(c) ? `<a class="ib" href="${esc(c.teams_url)}" target="_blank" rel="noopener" title="Visio Teams de la classe" aria-label="Visio Teams de la classe">${icon("video")}</a>` : ""}
      <a class="ib" href="#/agenda/${esc(c.id)}" title="Agenda du cours" aria-label="Agenda du cours">${icon("cal")}</a>
      ${c.dossier_onedrive ? `<a class="ib" href="${esc(c.dossier_onedrive)}" target="_blank" rel="noopener" title="Dossier OneDrive du cours" aria-label="Dossier OneDrive du cours">${icon("folder")}</a>` : ""}
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
  const copie = !S.prof && appOffice(nom) && (r.path || r.od || /sharepoint\.com|1drv\.ms|onedrive/i.test(r.url || ""));
  let lien = r.path ? `href="#" data-act="openfile" data-bucket="${esc(r.bucket || "documents")}" data-path="${esc(r.path)}"` : `href="${esc(S.prof && r.od && r.od.web ? r.od.web : r.url)}" target="_blank" rel="noopener"`;
  let tip2 = tip;
  if (copie) { lien = `href="#" data-act="copieoffice" data-r="${esc(JSON.stringify({ url: r.url || "", path: r.path || "", bucket: r.bucket || "", label: nom }))}" data-ctx="${esc(JSON.stringify(ctx))}"`; tip2 = `title="Ouvrir ma copie modifiable dans ${appOffice(nom)} en ligne"`; }
  const dl = r.path ? btnDl(r.bucket || "documents", r.path, r.label) : r.url && /sharepoint\.com/i.test(r.url) && fam ? `<a class="dlbtn" href="${esc(r.url + (r.url.includes("?") ? "&" : "?") + "download=1")}" target="_blank" rel="noopener" title="Télécharger pour modifier sur l'ordinateur" aria-label="Télécharger ${esc(nom)}">${icon("down")}</a>` : "";
  return `<div class="rcard"><a class="rtxt" ${lien} ${tip2}><b>${esc(nom)}</b><small>${esc(sous)}${copie ? " · modifiable en ligne" : ""}</small></a>${dl}<a class="rthumb-l" ${lien} tabindex="-1" aria-hidden="true">${vignetteRes(r, fam)}</a></div>`;
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
    ${teamsVisible(c) ? `<div class="box"><div class="boxhead"><h3>${icon("video")} Visio Teams</h3></div><a class="btn ghost" href="${esc(c.teams_url)}" target="_blank" rel="noopener" style="text-decoration:none">Rejoindre</a>${S.prof ? `<span class="muted" style="font-size:.78rem">${icon("eye")} ${c.teams_visible ? "Visible par les élèves" : "Masqué aux élèves"}</span>` : ""}</div>`
      : S.prof ? `<div class="box"><div class="boxhead"><h3>${icon("video")} Visio Teams</h3></div><a class="linkbtn" href="#/classe/${esc(c.id)}/parametres">Ajouter le lien de la visio</a></div>` : ""}
    ${S.prof ? `<div class="box"><div class="boxhead"><h3>Code du cours</h3><div class="dd kebab"><button class="ib sm" data-act="menu" data-m="code" aria-label="Options du code">${icon("more")}</button>${S.menu === "code" ? `<div class="dd-menu">
        <a href="#" data-act="copylien" data-code="${esc(c.code || "")}">${icon("links")} Copier le lien d'invitation</a>
        <a href="#" data-act="copycode" data-code="${esc(c.code || "")}">${icon("copy")} Copier le code</a>
        <a href="#" data-act="resetcode" data-c="${esc(c.id)}">${icon("key")} Réinitialiser</a>
        <a href="#" data-act="togglecode" data-c="${esc(c.id)}" data-on="${c.code_actif ? "0" : "1"}">${icon(c.code_actif ? "x" : "check")} ${c.code_actif ? "Désactiver" : "Activer"}</a></div>` : ""}</div></div>
      ${c.code_actif ? `<button class="codebig" data-act="showcode" data-code="${esc(c.code)}" title="Afficher en grand">${esc(c.code)} ${icon("expand")}</button>` : `<span class="muted">Désactivé</span>`}</div>` : ""}
    ${!S.prof && c.moyenne_visible ? `<div class="box"><h3>Ma moyenne</h3><span class="grade">${moyenneEleve(c) == null ? "–" : fmtNote(moyenneEleve(c))}<small>/20</small></span><span class="muted" style="font-size:.78rem">Calculée sur les notes rendues par ton professeur.</span></div>` : ""}
    <div class="box"><h3>À venir</h3>${up.length ? up.map(d => `<span class="muted" style="font-size:.8rem">${dueOf(d).replace("Échéance : ", "")}</span><a href="#/devoir/${d.id}" class="uplink">${esc(d.titre)}</a>`).join("") : `<span class="muted">Aucun devoir à remettre dans les jours qui viennent</span>`}<a class="linkbtn" href="#/todo">Tout afficher</a></div>
    ${(c.liens && c.liens.length) || S.prof ? `<div class="box"><div class="boxhead"><h3>Liens de la classe</h3>${S.prof ? `<button class="ib sm" data-act="editliens" data-c="${esc(c.id)}" aria-label="Modifier les liens" title="Modifier les liens">${icon("edit")}</button>` : ""}</div>
      <div class="classlinks">${(c.liens || []).map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${icon("links")}<span>${esc(l.nom)}</span></a>`).join("")}</div>
      ${S.prof && !(c.liens || []).length ? `<span class="muted" style="font-size:.82rem">Ajoute des liens utiles : manuel, simulateur, Capytale…</span>` : ""}</div>` : ""}
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
  const lib = isQ ? "une nouvelle question" : it.k === "devoir" ? "un nouveau devoir" : it.k === "quiz" ? "un nouveau questionnaire" : "un nouveau support";
  return `<a class="post notif" href="${href}"><span class="ico">${icon(isQ ? "question" : it.k, "")}</span><span class="tt">${esc(R().prof.nom)} a publié ${lib} : ${esc(o.titre)}<small>${fmtQuand(it.date)}</small></span></a>`;
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
    detail = `${texteUtile(obj.description) ? `<div class="richtext wkdesc">${rich(obj.description)}</div>` : ""}${ressources(obj.ressources, { classe: obj.classe_id }) || (texteUtile(obj.description) ? "" : `<span class="muted">Aucun fichier joint.</span>`)}`;
  } else if (it.k === "devoir") {
    const d = obj;
    right = S.prof ? `<span class="dt">${d.date_limite ? dueOf(d).replace("Échéance : ", "") : "Publié le " + fmtShort(it.date)}</span>` : `<span class="dt">${etat(d, moi()).t === "Manquant" ? `<span style="color:var(--bad)">Manquant</span>` : etat(d, moi()).t === "Noté" ? fmtNote(etat(d, moi()).note) + "/" + d.points : d.date_limite ? dueOf(d).replace("Échéance : ", "") : ""}</span>`;
    const st = etat(d, moi());
    detail = `<div class="wkhead"><div class="wkdl"><b>${d.date_limite ? "Date limite : " + fmtShort(D(d.date_limite)) + " " + fmtT(D(d.date_limite)) : "Aucune date limite"}</b><small>${it.q2 ? (d.question && d.question.format === "choix" ? "Question à choix multiples" : "Question à réponse courte") : d.mode === "binome" ? "Un rendu par binôme" : "Individuel"} · ${pts(d)}</small></div>
        ${S.prof ? statsDevoir(d) : `<span class="wkst ${st.k}">${st.t}</span>`}</div>
      ${texteUtile(d.consigne) ? `<div class="richtext wkdesc">${rich(d.consigne)}</div>` : ""}${ressources(d.ressources, { classe: d.classe_id, devoir: d.id })}
      <div class="wkfoot"><a class="wklink" href="#/devoir/${d.id}">${S.prof ? "Afficher les instructions" : it.q2 ? "Afficher la question" : "Afficher le devoir"}</a>${S.prof ? `<a class="btn tonal" href="#/devoir/${d.id}">${it.q2 ? "Voir les réponses" : "Évaluer le travail"}</a>` : it.q2 && !renduDe(d, moi()) ? `<a class="btn tonal" href="#/devoir/${d.id}">Répondre</a>` : ""}</div>`;
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
function statsDevoir(d){
  const el = elevesDuDevoir(d, inscritsDe(d.classe_id)), n = el.filter(e => renduDe(d, e.email)).length;
  const an = aCorriger(d);
  return `<span class="stats crstats"><div><b>${n}</b><small>Remis</small></div><div><b>${el.length - n}</b><small>${ouvert(d) ? "Attribués" : "Manquants"}</small></div>${an ? `<div><b>${an}</b><small>À noter</small></div>` : ""}</span>`;
}
/* vrai texte (pas seulement « … » ou des espaces) */
function texteUtile(h){ return !!String(h || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;|&hellip;/g, " ").replace(/[\s.…·-]+/g, "").length;
}
function vTravaux(c, data){
  const groupes = data.themes.map((t, i) => ({t, i, titre:t.titre, items:itemsDuTheme(c, data, t.id)}));
  const sans = itemsDuTheme(c, data, null); if (sans.length) groupes.unshift({t:null, titre:"Aucun thème", items:sans});
  const visibles = groupes.filter(g => (S.prof || g.items.length) && (!S.filtreTheme || (g.t ? String(g.t.id) : "none") === S.filtreTheme));
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
    ${groupes.length > 1 ? `<div class="field filt"><label for="filtreTheme">Filtre thématique</label><select id="filtreTheme" data-f="filtre"><option value="">Tous les thèmes</option>${groupes.map(g => `<option value="${gid(g)}" ${S.filtreTheme === gid(g) ? "selected" : ""}>${esc(g.titre)}</option>`).join("")}</select></div>` : ""}
    <span class="spacer"></span>${groupes.length ? `<button class="linkbtn" data-act="toutreduire">${S.reduits.size ? "Tout développer" : "Tout réduire"}</button>` : ""}</div>`;
  return `<div class="page" style="--c:var(${C(c.couleur).c})">${head}
    ${visibles.length ? visibles.map(g => `<section class="theme${S.prof ? " movable" : ""}" data-tid="${gid(g)}"><div class="themehead">${S.prof && g.t ? `<span class="grip" title="Glisser pour déplacer" aria-hidden="true">⋮⋮</span>` : ""}<h2>${esc(g.titre)}</h2><button class="ib sm" data-act="reduire" data-id="${gid(g)}" aria-label="${S.reduits.has(gid(g)) ? "Développer" : "Réduire"}">${icon(S.reduits.has(gid(g)) ? "chevdown" : "chevup")}</button>${themeMenu(g)}</div>
      ${S.reduits.has(gid(g)) ? "" : g.items.length ? g.items.map(workItem).join("") : `<p class="empty">${S.prof ? "Aucun élément. Utilise « Créer » pour ajouter un devoir, un questionnaire ou une documentation." : "Rien pour l'instant."}</p>`}</section>`).join("")
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
    ${pageFoot()}</div>`;
}
function vClasse(r, data){
  const c = cls(r.a); if (!c) return `<div class="page"><div class="emptystate"><b>Cours introuvable.</b><a href="#/">Retour à l'accueil</a></div></div>`;
  let tab = ["flux", "travaux", "personnes", "notes"].includes(r.t) ? r.t : (fluxVisible(c) ? "flux" : "travaux");
  if (tab === "flux" && !fluxVisible(c)) tab = "travaux";
  const inner = tab === "flux" ? vFlux(c, data) : tab === "personnes" ? vPersonnes(c, data) : tab === "notes" ? (S.prof ? vNotes(c, data) : vMesNotes(c)) : vTravaux(c, data);
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
    <div class="comform"><input id="cpIn" placeholder="${S.prof ? "Ajouter un commentaire privé…" : "Ajouter un commentaire privé…"}" aria-label="Commentaire privé"><button class="ib" data-act="cpsend" data-d="${did}" data-e="${esc(email)}" aria-label="Envoyer">${icon("send")}</button></div></div>`;
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
    work = `<ul class="files">${(rd.fichiers || []).map(f => `<li><a href="#" data-act="openfile" data-bucket="rendus" data-path="${esc(f.chemin)}">${icon("file")} ${esc(f.nom)}</a>${btnDl("rendus", f.chemin, f.nom)}</li>`).join("")}${rd.lien ? `<li><a href="${esc(rd.lien)}" target="_blank" rel="noopener">${icon("links")} ${esc(rd.lien)}</a></li>` : ""}</ul>
      ${rd.binome_email ? `<p style="margin:0;font-size:.85rem">Rendu en binôme avec <b>${esc(nomDe(c.id, rd.auteur_email === moi() ? rd.binome_email : rd.auteur_email))}</b></p>` : ""}
      <p class="muted" style="margin:0;font-size:.8rem">Rendu le ${fmtShort(D(rd.rendu_le))} à ${fmtT(D(rd.rendu_le))}</p>
      ${e.t === "Noté" ? `<div class="grade">${fmtNote(e.note)}<small>/${d.points}</small></div>` : ""}${retourProf(e, d)}
      ${e.t !== "Noté" && open && rd.auteur === S.user.id ? `<button class="btn ghost" data-act="unsubmit" data-id="${rd.id}">Annuler l'envoi</button>` : ""}`;
  } else if (!open) {
    work = `<p style="margin:0" class="muted">La date limite est passée : le dépôt est fermé. Écris un commentaire privé à ton professeur si besoin.</p>`;
  } else {
    const cam = (S.cache[c.id] ? S.cache[c.id].eleves : []).filter(x => x.email !== moi());
    work = `${d.mode === "binome" ? `<div class="field"><label for="partenaire">Mon binôme</label><select id="partenaire"><option value="">Choisir…</option>${cam.map(x => `<option value="${esc(x.email)}" ${S.partenaire === x.email ? "selected" : ""}>${esc(x.nom)}</option>`).join("")}</select></div>` : ""}
      ${copiesDe(d.id).filter(x => !S.files.some(f => f.name === x.nom)).map(x => `<div class="copierow">${icon("edit")}<span>Ta copie de <b>${esc(x.nom)}</b></span><a href="${esc(x.web)}" target="_blank" rel="noopener" class="linkbtn">Ouvrir</a><button class="btn ghost sm" data-act="joindrecopie" data-id="${esc(x.id)}" data-nom="${esc(x.nom)}">Joindre</button></div>`).join("")}
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
  if (!open) return `<p style="margin:0" class="muted">La date limite est passée : tu ne peux plus répondre.</p>`;
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
const retourProf = (e, d) => (e.t === "Noté" && d ? grilleEleve(d, e.c) : "") + (e.t === "Noté" && e.c && e.c.commentaire ? `<div class="retour"><b>${icon("comment")} Commentaire de ${esc(R().prof.nom)}</b><div>${linkify(e.c.commentaire)}</div></div>` : "");
const tailleTxt = b => b > 1e6 ? (b / 1e6).toFixed(1).replace(".", ",") + " Mo" : Math.max(1, Math.round(b / 1e3)) + " Ko";
const safeName = n => n.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9._-]+/g, "_").slice(-80);
const nomDe = (cid, email) => ((inscritsDe(cid).find(x => x.email === email) || {}).nom) || nomDepuisEmail(email);

async function rendreDevoir(d){
  const err = document.getElementById("depErr"), fail = m => { S.sending = false; render().then(() => { const x = document.getElementById("depErr"); if (x) { x.hidden = false; x.textContent = m; } }); };
  if (!depotOuvert(d)) return fail("La date limite est passée.");
  if (d.type === "question") {
    const rep2 = (S.reponse || "").trim(); if (!rep2) return fail("Écris ou choisis ta réponse avant de rendre.");
    S.sending = true; render();
    const { error } = await sb.from("rendus").insert({ devoir_id: d.id, auteur: S.user.id, auteur_email: moi(), fichiers: [], reponse: rep2 });
    if (error) return fail("Envoi impossible : " + error.message);
    S.reponse = ""; S.sending = false; await rafraichir(); render(); toast("Réponse envoyée"); return;
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
  await rafraichir(); render(); toast("Devoir rendu");
}

/* ---------- devoir côté professeur ---------- */
function vDevoirProf(d, c){
  const k = C(c && c.couleur), ptab = S.ptab || "travaux", isQ = d.type === "question";
  const el = elevesDuDevoir(d, (S.cache[c.id] || {eleves:[]}).eleves);
  const sel = S.sel && el.some(e => e.email === S.sel) ? S.sel : null;
  const tabs = `<div class="tabsbar" style="--c:var(${k.c})"><div class="tabs" role="tablist"><button role="tab" aria-selected="${ptab === "instructions"}" data-act="ptab" data-t="instructions">Instructions</button><button role="tab" aria-selected="${ptab === "travaux"}" data-act="ptab" data-t="travaux">Travaux des élèves</button></div>
    <div class="tabicons"><a class="ib" href="#/editer/${isQ ? "question" : "devoir"}/${d.id}" title="Modifier" aria-label="Modifier">${icon("edit")}</a></div></div>`;
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
    detail = `<h2 style="font-size:1.3rem">${esc(d.titre)}</h2>${statsDevoir(d)}
      <p class="muted" style="margin:0">${d.date_limite ? (ouvert(d) ? "Dépôt ouvert jusqu'au " + fmtD(D(d.date_limite)) + " à " + fmtT(D(d.date_limite)) + "." : "Dépôt fermé depuis le " + fmtD(D(d.date_limite)) + ".") : "Aucune date limite."}</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap">${d.points != null && aCorriger(d) ? `<button class="btn" data-act="rendretout" data-d="${d.id}">${icon("send")} Rendre toutes les notes saisies</button>` : ""}
      ${autres.length ? `<button class="btn ghost" data-act="mailmissing" data-d="${d.id}">${icon("mail")} Écrire aux ${autres.length} élève${autres.length > 1 ? "s" : ""} qui n'${autres.length > 1 ? "ont" : "a"} pas rendu</button>` : ""}</div>
      ${S.compose ? composeBox(el.filter(e => S.pick.has(e.email))) : ""}
      ${isQ ? syntheseQuestion(d, el) : ""}
      ${odActif() && !isQ && rendusE.length ? `<div><button class="btn ghost sm" data-act="odrendus" data-d="${d.id}">${icon("nuage")} Copier les travaux rendus dans OneDrive</button></div>` : ""}
      <p style="margin:0">Choisis un élève dans la liste pour ouvrir ${isQ ? "sa réponse" : "son travail"} et le noter.</p>`;
  } else {
    const e = el.find(x => x.email === sel), rd = renduDe(d, sel), cr = correctionDe(rd);
    detail = `<div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center"><h2 style="font-size:1.35rem">${esc(e.nom)}${rd && rd.binome_email ? ` <span class="muted" style="font-size:.95rem">avec ${esc(nomDe(c.id, rd.auteur_email === sel ? rd.binome_email : rd.auteur_email))}</span>` : ""}</h2><span class="pill ${etat(d, sel).k}">${etat(d, sel).t}</span></div>
      ${rd ? `<p class="muted" style="margin:0;font-size:.85rem">Rendu le ${fmtD(D(rd.rendu_le))} à ${fmtT(D(rd.rendu_le))}${enRetard(d, rd) ? ` <span class="pill bad">en retard</span>` : ""}</p>
        ${isQ ? `<div class="reponse">${linkify(rd.reponse || "")}</div>` : `<div class="att">${(rd.fichiers || []).map((f, fj) => `<a href="#" data-act="voir" data-d="${d.id}" data-e="${esc(sel)}" data-i="${fj}"><span class="k">${esc((f.nom.split(".").pop() || "").slice(0, 5))}</span>${esc(f.nom)}</a>`).join("")}${rd.lien ? `<a href="${esc(rd.lien)}" target="_blank" rel="noopener"><span class="k">lien</span>${esc(rd.lien.replace(/^https?:\/\//, "").slice(0, 40))}</a>` : ""}${!(rd.fichiers || []).length && !rd.lien ? `<span class="muted">Marqué comme terminé, sans fichier joint.</span>` : ""}</div>`}
        ${(rd.fichiers || []).length ? `<div><button class="btn ghost sm" data-act="voir" data-d="${d.id}" data-e="${esc(sel)}" data-i="0">${icon("expand")} Ouvrir dans la visionneuse</button></div>` : ""}
        ${blocNotation(d, rd, cr)}`
      : `<p class="muted" style="margin:0">${ouvert(d) ? "Cet élève n'a pas encore rendu son travail." : "Cet élève n'a rien rendu avant la date limite."}</p>`}
      ${vCP(d.id, sel)}`;
  }
  return tabs + `<div class="page wide" style="--c:var(${k.c})">
    <div class="sw"><div class="list"><button class="st" data-act="sel" data-n="" aria-current="${!sel}"><span class="nm"><b>Tous les élèves</b></span></button>
      <h4>Rendus (${rendusE.length})</h4>${rendusE.map(row).join("") || `<p class="empty" style="padding:4px 16px">Aucun</p>`}
      <h4>${ouvert(d) ? "Attribués" : "Manquants"} (${autres.length})</h4>${autres.map(row).join("") || `<p class="empty" style="padding:4px 16px">Aucun</p>`}</div>
    <div class="detail">${detail}</div></div>${pageFoot()}</div>`;
}

/* ---------- à faire / à corriger ---------- */
function vTodo(){
  if (S.prof) {
    const parClasse = actives().map(c => ({c, ds:S.devoirs.filter(d => d.classe_id === c.id && !d.brouillon).slice().reverse()})).filter(x => x.ds.length);
    return `<div class="page"><h1 style="font-size:1.6rem">À corriger</h1>${parClasse.length ? `<div class="todo">${parClasse.map(({c, ds}) => `<section class="group" style="--c:var(${C(c.couleur).c})"><header><span style="color:var(--c)">${esc(c.nom)}</span><span class="muted mono">${ds.reduce((a, d) => a + aCorriger(d), 0)} à corriger</span></header>
      ${ds.map(d => `<div class="work"><a class="workrow" href="#/devoir/${d.id}" style="padding:12px 18px;gap:16px"><span class="ico">${icon("devoir", "")}</span><span class="tt">${esc(d.titre)}<br><small class="muted" style="font-weight:400">${dueOf(d)}</small></span>${statsDevoir(d)}</a></div>`).join("")}</section>`).join("")}</div>` : `<div class="emptystate"><b>Aucun devoir pour l'instant.</b></div>`}${pageFoot()}</div>`;
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
    if (it.d) { const e = etat(o, moi()); right = e.t === "Noté" ? `<span class="mono" style="color:var(--ink)">${fmtNote(e.note)}/${o.points}</span>` : e.t === "Rendu" ? "Rendu" : dueOf(o).replace("Échéance : ", ""); }
    else { const r = resultatDe(o, S.user.id); right = r ? `<span class="mono" style="color:var(--ink)">${fmtNote(noteQuiz(o, r))}/${o.points}</span>` : o.date_limite ? dueTxt(D(o.date_limite)).replace("Échéance : ", "") : "Aucune date limite"; }
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
    html: rec ? (type === "documentation" ? rec.description : rec.consigne) || "" : "", ressources: rec ? (rec.ressources || []).slice() : [],
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
  const { error } = await sb.from("classes").update({ nom:s.nom.trim(), description:s.description.trim(), section:s.section.trim(), niveau:s.niveau.trim(), matiere:s.matiere.trim(), salle:s.salle.trim(),
    symbole:s.symbole.trim() || s.nom.trim().slice(0, 3), couleur:s.couleur, illustration:s.illustration === "auto" ? null : s.illustration, code_actif:s.code_actif, flux_mode:s.flux_mode, flux_devoirs:s.flux_devoirs,
    teams_url:s.teams_url.trim() || null, teams_visible:s.teams_visible, dossier_onedrive:s.dossier_onedrive.trim() || null, moyenne_visible:s.moyenne_visible,
    categories:s.categories.map(x => ({ nom: String(x.nom || "").trim(), coef: Math.max(0, Number(String(x.coef).replace(",", ".")) || 0) })).filter(x => x.nom) }).eq("id", s.id);
  if (error) { s.busy = false; s.err = "Enregistrement impossible : " + error.message; return render(); }
  const id = s.id; S.settings = null; await rafraichir(id); toast("Paramètres enregistrés"); go("/classe/" + id);
}
function moyenneEleve(c){
  return arrondi1(moyenneDe(c, moi(), S.user.id, true).moy);
}
/* ---------- fenêtres ---------- */
function vModal(){
  const m = S.modal; let body = "", ok = "Enregistrer", foot = true;
  if (m.kind === "theme") { body = `<h2>${m.id ? "Renommer le thème" : "Ajouter un thème"}</h2><div class="field"><label for="mTitre">Nom du thème</label><input id="mTitre" value="${esc(m.titre || "")}" placeholder="ex. Chapitre 1 · Mouvements"></div>`; ok = m.id ? "Renommer" : "Ajouter"; }
  else if (m.kind === "copieauth") { body = `<h2>Ouvrir ta copie modifiable</h2><p style="margin:0">Pour modifier ce document en ligne, PhysiquePro en crée <b>une copie dans ton OneDrive</b> (dossier « PhysiquePro »). Le document de ton professeur n'est pas modifié.</p><p class="muted" style="margin:0;font-size:.85rem">La première fois seulement, Microsoft te demande d'autoriser PhysiquePro à accéder à ton OneDrive.</p>`; ok = "Autoriser et ouvrir"; }
  else if (m.kind === "placertheme") { const th = ((S.cache[m.classe] || {}).themes || []).filter(t => String(t.id) !== String(m.id));
    body = `<h2>Déplacer « ${esc(m.titre)} »</h2><div class="field"><label for="mOu">Placer ce thème</label><select id="mOu" style="width:100%"><option value="avant">Avant le thème…</option><option value="apres">Après le thème…</option></select></div>
      <div class="field"><label for="mRef">Thème</label><select id="mRef" style="width:100%;max-width:100%;text-overflow:ellipsis">${th.map(t => `<option value="${t.id}">${esc(t.titre.length > 70 ? t.titre.slice(0, 68) + "…" : t.titre)}</option>`).join("")}</select></div>`; ok = "Déplacer"; }
  else if (m.kind === "prog") { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(8, 0, 0, 0);
    body = `<h2>Programmer la publication</h2><p class="muted" style="margin:0">Les élèves verront cet élément à partir de cette date.</p><div class="dt2"><input id="mDate" type="date" value="${ymd(d)}" aria-label="Date"><input id="mHeure" type="time" value="08:00" aria-label="Heure"></div>`; ok = "Programmer"; }
  else if (m.kind === "join") { body = `<h2>Rejoindre un cours</h2><p class="muted" style="margin:0">Tu es connecté avec <b>${esc(moi())}</b>. Saisis le code du cours donné par ton professeur.</p><div class="field"><label for="mCode">Code du cours</label><input id="mCode" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="ex. k7m4pqr" value="${esc(m.code || "")}" style="font-family:var(--mono);font-size:1.2rem;letter-spacing:.08em"></div>`; ok = "Rejoindre"; }
  else if (m.kind === "ajouteleves") { const c = cls(m.classe);
    body = `<h2>Ajouter des élèves${c ? " · " + esc(c.nom) : ""}</h2>
      ${m.fixe ? "" : `<div class="field"><label for="mClasse">Dans le cours</label><select id="mClasse" data-mclasse="1">${actives().map(x => `<option value="${esc(x.id)}" ${x.id === m.classe ? "selected" : ""}>${esc(x.nom)}</option>`).join("")}</select></div>`}
      <div class="field"><label for="mListe">Colle la liste (une ligne par élève)</label><textarea id="mListe" rows="7" placeholder="prenom.nom@${esc(CFG.domaine)}&#10;HADDAD Lina&#10;Karim Saad ; karim.saad@${esc(CFG.domaine)}">${esc(m.texte || "")}</textarea></div>
      <p class="muted" style="margin:0;font-size:.8rem">Accepté : une adresse, « NOM Prénom » copié depuis Pronote ou Excel (l'adresse prenom.nom@${esc(CFG.domaine)} est alors déduite), ou les deux sur la même ligne.</p>
      <div id="mApercu">${apercuListe(m)}</div>`; ok = "Ajouter"; }
  else if (m.kind === "renomeleve") { body = `<h2>Modifier le nom</h2><p class="muted" style="margin:0;font-size:.85rem">${esc(m.email)}</p><div class="field"><label for="mNomEl">Nom affiché (dans tous les cours)</label><input id="mNomEl" value="${esc(m.nom)}"></div>`; }
  else if (m.kind === "autrescours") { body = `<h2>Ajouter à un autre cours</h2><p class="muted" style="margin:0">${m.emails.length} élève${m.emails.length > 1 ? "s" : ""} sélectionné${m.emails.length > 1 ? "s" : ""}.</p>
      <div class="ciblelist">${actives().filter(c => c.id !== m.from).map(c => `<label class="check"><input type="checkbox" class="mDest" value="${esc(c.id)}"> ${esc(c.nom)}</label>`).join("") || `<span class="muted">Aucun autre cours actif.</span>`}</div>`; ok = "Ajouter"; }
  else if (m.kind === "copiercours") { body = `<h2>Copier « ${esc(m.nom)} »</h2>
      <div class="field"><label for="mNomCopie">Nom du nouveau cours</label><input id="mNomCopie" value="${esc("Copie de " + m.nom)}"></div>
      <p class="muted" style="margin:0;font-size:.85rem">Comme dans Classroom : les thèmes, devoirs, questions, questionnaires et documentations sont copiés en <b>brouillon</b>. Les élèves, les annonces, les travaux rendus et les notes ne sont pas copiés.</p>`; ok = "Copier"; }
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
  else if (m.kind === "supprclasse") { body = `<h2>Supprimer « ${esc(m.nom)} » ?</h2><p style="margin:0">Le cours, ses devoirs, questionnaires, documentations, annonces, les travaux rendus et les notes seront <b>définitivement supprimés</b>.</p><div class="field"><label for="mConfirm">Pour confirmer, tape le nom du cours</label><input id="mConfirm" autocomplete="off" placeholder="${esc(m.nom)}"></div>`; ok = "Supprimer"; }
  else if (m.kind === "confirm") { body = `<h2>${esc(m.titre)}</h2><p style="margin:0">${esc(m.texte)}</p>`; ok = m.ok || "Supprimer"; }
  const danger = m.kind === "confirm" || m.kind === "supprclasse";
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
    if (m.kind === "copieauth") { m.busy = false; return copieAutoriser(); }
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
      const rendusFichiers = S.rendus.filter(r => (S.devoirs.find(d => d.id === r.devoir_id) || {}).classe_id === m.id).flatMap(r => (r.fichiers || []).map(f => f.chemin));
      if (rendusFichiers.length) await sb.storage.from("rendus").remove(rendusFichiers);
      const { error } = await sb.from("classes").delete().eq("id", m.id); if (error) throw error;
      S.modal = null; await rafraichir(); toast("Cours supprimé"); go("/archives"); return;
    }
    if (m.kind === "confirm") {
      if (m.action === "suppr") {
        const table = m.k === "devoir" ? "devoirs" : m.k === "support" ? "supports" : "quiz";
        const rec = m.k === "devoir" ? S.devoirs.find(d => String(d.id) === m.id) : m.k === "support" ? ((S.cache[m.classe] || {supports:[]}).supports.find(x => String(x.id) === m.id)) : null;
        const { error } = await sb.from(table).delete().eq("id", m.id); if (error) throw error;
        const paths = ((rec && rec.ressources) || []).filter(x => x.path).map(x => x.path); if (paths.length) await sb.storage.from("documents").remove(paths);
        if (m.k === "devoir") { const f = S.rendus.filter(r => String(r.devoir_id) === m.id).flatMap(r => (r.fichiers || []).map(x => x.chemin)); if (f.length) await sb.storage.from("rendus").remove(f); }
        return done("Élément supprimé", m.classe);
      }
      if (m.action === "supprtheme") { const { error } = await sb.from("themes").delete().eq("id", m.id); if (error) throw error; return done("Thème supprimé", m.classe); }
      if (m.action === "retirer") { const { error } = await sb.from("inscriptions").delete().eq("classe_id", m.classe).in("email", m.emails); if (error) throw error; m.emails.forEach(x => S.pick.delete(x)); return done(m.emails.length > 1 ? "Élèves retirés du cours" : "Élève retiré du cours", m.classe); }
      if (m.action === "perte") { S.modal = null; S.outilsEdit = false; S.adm = null; render(); return; }
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
        ${outilsBtns("liensUtiles", i, A.liensUtiles.length)}</div>`).join("")}</div>
      <div><button class="btn ghost sm" data-act="adadd" data-path="liensUtiles" data-tpl="lien">${icon("plus")} Ajouter un lien rapide</button></div>
    </section>
    ${admOutilsSection(A, inp, outilsBtns)}
    <section class="edcard"><h2>${icon("nuage")} OneDrive</h2>
      <p class="muted" style="margin:0;font-size:.88rem">Activé, chaque document que tu joins est rangé dans ton OneDrive : <b>${OD_RACINE} › classe › thème › activité</b>, et partagé avec le lycée en lecture. Les élèves l'ouvrent dans Word, Excel ou PowerPoint en ligne. Toi, tu peux le modifier directement. Les travaux rendus par les élèves sont copiés dans <b>… › activité › Travaux rendus</b>.</p>
      <div class="setrow"><span><b>Connexion à OneDrive</b><small class="muted">${S.odOk ? "Connecté." : "À faire une fois : Microsoft te demande ton accord."}</small></span><button class="btn ghost sm" data-act="odconnect">${icon("nuage")} ${S.odOk ? "Vérifier" : "Connecter OneDrive"}</button></div>
      <label class="switch"><span><b>Ranger mes documents dans OneDrive</b><small class="muted">Les nouveaux documents joints vont dans OneDrive au lieu du stockage de PhysiquePro.</small></span><input type="checkbox" data-ad="onedrive" ${A.onedrive ? "checked" : ""}><i aria-hidden="true"></i></label>
      <div class="setrow"><span><b>Documents déjà publiés</b><small class="muted">Copie dans OneDrive les documents importés avant l'activation, puis met à jour les liens.</small></span><button class="btn ghost sm" data-act="odmigrer" ${S.odBusy ? "disabled" : ""}>${S.odBusy ? "Copie en cours… " + (S.odN || 0) : "Ranger dans OneDrive"}</button></div>
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
  const liens = A.liensUtiles.map(l => ({ nom: (l.nom || "").trim(), url: (l.url || "").trim(), icone: l.icone || "links", couleur: l.couleur || "#116482", principal: !!l.principal })).filter(l => l.nom || l.url);
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
        email = norm(prenom) + "." + norm(nomF) + dom; nom = cap(prenom) + " " + nomF.toUpperCase(); deduit = true;
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
function analyseFichiers(){
  const F = S.fich, refs = new Map(), heure = new Date(now() - 3600e3);
  const ajoute = (list, k, lib) => (list || []).forEach(o => (o.ressources || []).forEach(x => x.path && refs.set(x.path, { k, o, lib: lib(o) })));
  ajoute(S.devoirs, "devoir", o => "Devoir · " + o.titre); ajoute(F.supports, "support", o => "Documentation · " + o.titre); ajoute(F.annonces, "annonce", o => "Annonce du flux");
  const rendusRefs = new Set(S.rendus.flatMap(r => (r.fichiers || []).map(x => x.chemin)));
  const parClasse = {}, orphelins = [];
  const devoirClasse = id => (S.devoirs.find(d => String(d.id) === id) || {}).classe_id;
  F.fichiers.forEach(x => {
    const seg = x.chemin.split("/")[0], cid = x.bucket === "documents" ? seg : devoirClasse(seg) || "?";
    const P = parClasse[cid] = parClasse[cid] || { docs: 0, docsT: 0, rendus: 0, rendusT: 0 };
    if (x.bucket === "documents") { P.docs++; P.docsT += x.taille; } else { P.rendus++; P.rendusT += x.taille; }
    const utilise = x.bucket === "documents" ? refs.has(x.chemin) : rendusRefs.has(x.chemin);
    if (!utilise && D(x.cree_le) < heure) orphelins.push(x);
  });
  return { refs, parClasse, orphelins, total: F.fichiers.reduce((a, x) => a + x.taille, 0) };
}
function admFichiers(){
  const F = S.fich;
  if (!F) return `<div class="loading"><div><div class="spin"></div>Chargement des fichiers…</div></div>`;
  if (F.err) return `<div class="notice" style="background:var(--bad-bg);color:var(--bad)">Liste des fichiers indisponible : ${esc(F.err)}</div>`;
  const A = analyseFichiers(), quota = 1e9, pc = Math.min(100, Math.round(A.total / quota * 100));
  const nomC = id => (cls(id) || {}).nom || (id === "?" ? "Devoirs supprimés" : id);
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
  A.orphelins.forEach(x => (par[x.bucket] = par[x.bucket] || []).push(x.chemin));
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
  const rem = R().remarques || [];
  return `${G ? `<div class="grille"><b>Grille d'évaluation</b>${G.map((g, i) => `<label class="grow"><span>${esc(g.c)}</span><input id="gr-${i}" data-gr="${i}" type="number" min="0" max="${g.p}" step="0.25" inputmode="decimal" value="${gv[i] != null ? gv[i] : ""}" aria-label="${esc(g.c)}"><span class="muted">/${g.p}</span></label>`).join("")}</div>` : ""}
    ${d.points != null ? `<div class="gradeline"><label for="note">Note</label><input id="note" type="number" min="0" max="${d.points}" step="0.25" inputmode="decimal" value="${cr && cr.note != null ? cr.note : ""}" ${G ? "readonly" : ""}><span class="muted">/${d.points}</span>${G ? `<small class="muted">calculée avec la grille</small>` : ""}</div>` : ""}
    <div class="field"><label for="noteCom">Commentaire pour l'élève <span class="muted">(visible quand tu rends le travail)</span></label><textarea id="noteCom" rows="2" placeholder="ex. Bon raisonnement, attention aux unités.">${esc(cr && cr.commentaire || "")}</textarea>
      ${rem.length ? `<div class="chips">${rem.map(t => `<button class="chip" data-act="remarque" data-t="${esc(t)}">${esc(t)}</button>`).join("")}</div>` : ""}</div>
    <div id="noteErr" class="err" hidden></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">${d.points != null ? `<button class="btn ghost" data-act="savenote" data-id="${rd.id}" data-pub="0">Enregistrer le brouillon</button>` : ""}<button class="btn" data-act="savenote" data-id="${rd.id}" data-pub="1">${cr && cr.publiee ? "Mettre à jour" : "Rendre"}</button></div>
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
async function urlRendu(path){
  S.vurl = S.vurl || {};
  if (S.vurl[path]) return S.vurl[path];
  const { data } = await sb.storage.from("rendus").createSignedUrl(path, 3600);
  return S.vurl[path] = data ? data.signedUrl : null;
}
function rendusOrdonnes(d){
  const el = elevesDuDevoir(d, inscritsDe(d.classe_id));
  return el.filter(e => renduDe(d, e.email));
}
async function preparerViewer(){
  const V = S.viewer, d = S.devoirs.find(x => x.id === V.did); if (!d) { S.viewer = null; return; }
  await chargerClasse(d.classe_id);
  const rd = renduDe(d, V.email), f = rd && (rd.fichiers || [])[V.fi || 0];
  if (f) await urlRendu(f.chemin);
  await chargerCP(d.id, V.email);
}
function apercuFichier(f){
  const u = S.vurl && S.vurl[f.chemin], x = extDe(f.nom);
  if (!u) return `<div class="vempty">Fichier introuvable.</div>`;
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
        ${fs.length && S.vurl && S.vurl[fs[fi].chemin] ? `<div class="vfoot"><a href="${esc(lienOffice(fs[fi].nom, S.vurl[fs[fi].chemin]))}" target="_blank" rel="noopener">${icon("expand")} ${appOffice(fs[fi].nom) ? "Ouvrir dans " + appOffice(fs[fi].nom) + " en ligne" : "Ouvrir dans un nouvel onglet"}</a><a href="#" data-act="dlfile" data-bucket="rendus" data-path="${esc(fs[fi].chemin)}" data-nom="${esc(fs[fi].nom)}">${icon("down")} Télécharger</a></div>` : ""}</div>
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
    <p class="muted" style="margin:0;font-size:.85rem">Les élèves avec des travaux manquants apparaissent en premier. Clique sur un élève pour voir le détail.</p>
    ${lignes.length ? `<div class="tablewrap"><table class="admtable"><thead><tr><th class="first">Élève</th><th>Moyenne /20</th><th>Rendus</th><th>Manquants</th><th>En retard</th><th>Dernier rendu</th></tr></thead><tbody>
      ${lignes.map(l => `<tr class="suivirow ${l.manq ? "alerte" : ""}" data-act="toggle" data-id="sv${esc(l.e.email)}"><td class="first"><span class="who2">${avatarP(l.e.nom, "sm")}<b>${esc(l.e.nom)}</b></span></td>
        <td class="mono"><b>${l.moy == null ? "–" : fmtNote(arrondi1(l.moy))}</b></td><td>${l.rendus}/${l.n}</td><td>${l.manq ? `<span class="pill bad">${l.manq}</span>` : "0"}</td><td>${l.retard ? `<span class="pill">${l.retard}</span>` : "0"}</td><td class="muted">${l.dernier ? fmtShort(l.dernier) : "—"}</td></tr>
        ${S.open === "sv" + l.e.email ? `<tr><td colspan="6" class="suividetail">${l.et.length ? l.et.map(x => `<a href="#/devoir/${x.d.id}"><span class="pill ${x.s.k}">${x.s.t}${x.s.retard ? " · retard" : ""}</span> ${esc(x.d.titre)} ${x.s.t === "Noté" && x.s.note != null ? `<b class="mono">${fmtNote(x.s.note)}/${x.d.points}</b>` : ""}</a>`).join("") : `<span class="muted">Aucun devoir.</span>`}
          <a href="${esc(outlookLink([l.e.email], "", ""))}" target="_blank" rel="noopener">${icon("mail")} Écrire à l'élève</a></td></tr>` : ""}`).join("")}
    </tbody></table></div>` : `<div class="emptystate"><b>Aucun élève dans ce cours.</b></div>`}${pageFoot()}</div>`;
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
async function jetonGraph(interactif){
  const app = await msalInit(), req = { scopes: ["Files.ReadWrite"], loginHint: moi() };
  const compte = app.getAllAccounts().find(a => (a.username || "").toLowerCase() === moi());
  try {
    if (compte) return (await app.acquireTokenSilent({ ...req, account: compte })).accessToken;
    return (await app.ssoSilent(req)).accessToken;
  } catch (e) {
    if (!interactif) throw e;
    return (await app.acquireTokenPopup(req)).accessToken;
  }
}
async function graph(chemin, opt = {}, interactif = true){
  const t = await jetonGraph(interactif);
  const r = await fetch(chemin.startsWith("http") ? chemin : "https://graph.microsoft.com/v1.0" + chemin, { ...opt, headers: { Authorization: "Bearer " + t, ...(opt.headers || {}) } });
  if (!r.ok) { let m = r.status + ""; try { const j = await r.json(); m = (j.error && j.error.message) || m; } catch (_) {} const er = new Error(m); er.status = r.status; throw er; }
  return r.status === 204 ? null : r.json();
}
const nomOD = s => String(s || "").replace(/[\\/:*?"<>|#%]+/g, " ").replace(/\s+/g, " ").trim().replace(/^\.+|\.+$/g, "").slice(0, 120) || "Sans titre";
const cheminOD = parts => parts.map(nomOD).map(encodeURIComponent).join("/");
/* envoie un fichier dans le OneDrive du prof et renvoie {id, web, partage} */
async function odPut(ch, fichier){
  let item;
  if (fichier.size <= 4 * 1024 * 1024) item = await graph("/me/drive/root:/" + ch + ":/content?@microsoft.graph.conflictBehavior=rename", { method: "PUT", body: fichier });
  else {
    const ses = await graph("/me/drive/root:/" + ch + ":/createUploadSession", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ item: { "@microsoft.graph.conflictBehavior": "rename" } }) });
    const pas = 320 * 1024 * 16;
    for (let deb = 0; deb < fichier.size; deb += pas) {
      const fin = Math.min(deb + pas, fichier.size), r = await fetch(ses.uploadUrl, { method: "PUT", headers: { "Content-Range": `bytes ${deb}-${fin - 1}/${fichier.size}` }, body: fichier.slice(deb, fin) });
      if (!r.ok && r.status !== 202) throw new Error("envoi interrompu (" + r.status + ")");
      if (fin === fichier.size) item = await r.json();
    }
  }
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
  const att = e.ressources.filter(x => x.pending); if (!att.length) return;
  const parts = dossierTravail(e.classe_id, e.theme_id, e.titre.trim());
  for (const x of att) {
    toast("Envoi dans OneDrive : « " + x.label + " »…");
    const r = await odEnvoyer([...parts, x.pending.name], x.pending);
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
  try { item = await graph("/me/drive/root:/" + ch, {}, false); } catch (e) { if (e.status !== 404) throw e; }
  if (!item) {
    attente(win, "Création de ta copie de « " + esc(nom) + " »…");
    let blob;
    if (r.path) { const { data, error } = await sb.storage.from(r.bucket || "documents").createSignedUrl(r.path, 600); if (error) throw error; blob = await (await fetch(data.signedUrl)).blob(); }
    else {
      const it = await graph("/shares/u!" + b64u(r.url) + "/driveItem", { headers: { Prefer: "redeemSharingLinkIfNecessary" } }, false);
      const url = it["@microsoft.graph.downloadUrl"]; if (!url) throw new Error("document introuvable");
      const res = await fetch(url); if (!res.ok) throw new Error("lecture du document impossible (" + res.status + ")"); blob = await res.blob();
    }
    item = await odPut(ch, blob);
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
  try { await jetonGraph(false); }
  catch (e) { win.close(); S.modal = { kind: "copieauth", r, ctx }; render(); return; }
  try { await ouvrirCopie(r, ctx, win); }
  catch (e) { win.close(); toast("Copie impossible : " + (e.message || e)); }
}
/* première fois : l'élève autorise PhysiquePro à utiliser son OneDrive (clic direct = fenêtre Microsoft autorisée) */
async function copieAutoriser(){
  const m = S.modal; if (!m) return;
  try { await jetonGraph(true); } catch (e) { toast("Autorisation OneDrive refusée ou impossible."); return; }
  S.modal = null; render();
  const win = window.open("", "_blank"); if (!win) { toast("Autorise les fenêtres (pop-up) pour ce site, puis réessaie."); return; }
  attente(win, "Ouverture de ta copie…");
  try { await ouvrirCopie(m.r, m.ctx, win); } catch (e) { win.close(); toast("Copie impossible : " + (e.message || e)); }
}
async function joindreCopie(id, nom){
  try {
    toast("Ajout de ta copie…");
    const it = await graph("/me/drive/items/" + encodeURIComponent(id), {}, true), url = it["@microsoft.graph.downloadUrl"];
    const blob = await (await fetch(url)).blob();
    S.files.push(new File([blob], nom, { type: blob.type || "application/octet-stream" })); render(); toast("« " + nom + " » ajouté à ton travail");
  } catch (e) { toast("Impossible de joindre la copie : " + (e.message || e)); }
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
/* ---------- rendu ---------- */
let renderId = 0;
const chargement = (r) => topbar(r) + `<div class="shell">${drawer(r)}<main class="content"><div class="loading"><div><div class="spin"></div>Chargement…</div></div></main></div>`;
async function render(){
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
      content = ({agenda:vAgenda, todo:vTodo, outils:vOutils, archives:vArchives})[r.v]?.(r) ?? vAccueil();
    }
    const foc = document.activeElement && document.activeElement.id;
    app.innerHTML = topbar(r) + `<div class="shell">${drawer(r)}<main class="content">${content}</main></div>` + (S.modal ? vModal() : "");
    { const c0 = r.a && typeof cls === "function" ? cls(r.a) : null, T = { agenda: "Agenda", todo: S.prof ? "À corriger" : "À faire", suivi: "Suivi des élèves", admin: "Paramètres", outils: "Boîte à outils", archives: "Cours archivés" };
      document.title = (r.v === "classe" && c0 ? c0.nom + " · " : T[r.v] ? T[r.v] + " · " : "") + "PhysiquePro"; }
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
  if (S.modal && S.modal.kind !== "liens" && S.modal.kind !== "cible" && S.modal.kind !== "reutiliser") { const f = document.querySelector(".modal input:not([type=checkbox])"); if (f) f.focus(); return; }
  if (foc && document.getElementById(foc) && !["edHtml", "anHtml"].includes(foc)) { const el = document.getElementById(foc); el.focus(); if (el.setSelectionRange && el.type === "text") { const n = el.value.length; el.setSelectionRange(n, n); } }
}
const fermerMenus = () => { S.dd = false; S.me = false; S.menu = null; S.bell = false; };

/* ---------- clics ---------- */
document.addEventListener("click", async e => {
  const a = e.target.closest("[data-act]");
  if (!a) {
    if ((S.dd || S.me || S.menu || S.bell) && !e.target.closest(".dd")) { fermerMenus(); render(); }
    return;
  }
  const act = a.dataset.act, r = route();
  if (["INPUT"].includes(a.tagName) && ["pick", "pickall", "cibletous", "cibleun", "bonne", "ans", "inscr", "bonnecase", "anscase", "repchoix"].includes(act)) { /* traité par « change » */ if (act !== "pick" && act !== "pickall") return; }
  switch (act) {
    case "drawer": S.drawer = !S.drawer; render(); return;
    case "bell": { const o = !S.bell; fermerMenus(); S.bell = o; render(); if (o) chargerNotifs(); return; }
    case "toutlu": { const { data, error } = await sb.rpc("pp_vu"); if (error) { toast("Action impossible : " + error.message); return; } S.profil.vu_le = data || now().toISOString(); await chargerNotifs(); return; }
    case "savenom": { const n = ((document.getElementById("pfNom") || {}).value || "").trim(); if (!n) { toast("Le nom ne peut pas être vide."); return; }
      const data = { ...reglagesData(), prof: { nom: n, titre: R().prof.titre } };
      const { error } = await sb.from("reglages").upsert({ id: 1, data, modifie_le: now().toISOString() }); if (error) { toast("Enregistrement impossible : " + error.message); return; }
      appliquerReglages(data); S.nom = n; S.adm = null; toast("Nom modifié"); render(); return; }
    case "dd": S.dd = !S.dd; S.me = false; S.menu = null; render(); return;
    case "me": S.me = !S.me; S.dd = false; S.menu = null; render(); return;
    case "logout": e.preventDefault(); await sb.auth.signOut(); location.replace(ICI); return;
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
      await rafraichir(r.a); render(); toast("Publié"); return; }
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
      const f = (rd.fichiers || []).map(x => x.chemin); if (f.length) await sb.storage.from("rendus").remove(f);
      await rafraichir(); render(); toast("Envoi annulé : tu peux modifier ton travail et le rendre à nouveau."); return; }
    case "cpsend": { const inp = document.getElementById("cpIn"), t = inp.value.trim(); if (!t) return;
      const { error } = await sb.from("commentaires_prives").insert({ devoir_id: Number(a.dataset.d), eleve_email: a.dataset.e, auteur_nom: S.nom, texte: t });
      if (error) { toast("Commentaire impossible : " + error.message); return; }
      await chargerCP(Number(a.dataset.d), a.dataset.e, true); render(); return; }

    /* devoirs : professeur */
    case "ptab": S.ptab = a.dataset.t; render(); return;
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
      const { error } = await sb.from("corrections").upsert({ rendu_id: Number(a.dataset.id), note: n, commentaire: com, grille, publiee: pub, modifie_le: now().toISOString() });
      if (error) { toast("Enregistrement impossible : " + error.message); return; }
      await rafraichir(); render(); toast(pub ? "Travail rendu à l'élève" : "Brouillon enregistré"); return; }
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
  if (r.v !== "devoir") { S.reponse = ""; S.sel = null; S.ptab = "travaux"; S.files = []; S.lien = ""; S.lienOpen = false; S.partenaire = ""; }
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
  if (!session) { vLogin(rj.v === "rejoindre" ? "Connecte-toi avec ton compte Microsoft 365 du lycée : tu rejoindras ensuite le cours automatiquement." : undefined, rj.v === "rejoindre"); return; }
  let pj = null; try { pj = localStorage.getItem("pp_join"); localStorage.removeItem("pp_join"); } catch (_) {}
  if (pj && route().v !== "rejoindre") history.replaceState(null, "", ICI + "#/rejoindre/" + encodeURIComponent(pj));
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
  try { S.recent = localStorage.getItem("pp_recent") === "1"; } catch (_) {}
  render();
  chargerNotifs().catch(() => {});
  setInterval(() => { if (document.visibilityState === "visible") chargerNotifs().catch(() => {}); }, 180000);
  sb.auth.onAuthStateChange(ev => { if (ev === "SIGNED_OUT") location.replace(ICI); });
})();
})();
