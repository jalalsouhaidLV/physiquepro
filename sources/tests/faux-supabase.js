/* =====================================================================
   PhysiquePro · faux client Supabase pour les tests (bouchon)
   ---------------------------------------------------------------------
   Remplace window.supabase (la bibliothèque supabase-js) pendant les
   tests : aucune requête ne part vers Supabase. Toutes les données sont
   FICTIVES et gardées en mémoire dans la page (elles disparaissent au
   rechargement). Aucune clé, aucun mot de passe, aucune vraie donnée.

   Rôle simulé, au choix :
     - adresse ?role=eleve | ?role=prof | ?role=visiteur
     - ou window.__PP_ROLE défini avant le chargement (script de test)
   Par défaut : élève.

   Pour le débogage : window.__PP_APPELS (toutes les requêtes simulées)
   et window.__PP_INCONNUS (tables, fonctions ou méthodes non prévues).
   ===================================================================== */
(function () {
  "use strict";

  /* ---------- rôle simulé ---------- */
  let role = window.__PP_ROLE;
  try { const q = new URLSearchParams(location.search).get("role"); if (q) role = q; } catch (_) {}
  if (!["eleve", "prof", "visiteur"].includes(role)) role = "eleve";

  /* ---------- dates relatives (les tests ne vieillissent pas) ---------- */
  const T0 = Date.now(), J = 864e5;
  const jour = n => new Date(T0 + n * J).toISOString();

  /* ---------- comptes fictifs ---------- */
  const PROF = { id: "00000000-0000-4000-8000-000000000001", email: "prof.test@lycee-verdun.edu.lb", nom: "Professeur Test", role: "prof" };
  const ELEVE = { id: "00000000-0000-4000-8000-000000000002", email: "lv.eleve.test@lycee-verdun.edu.lb", nom: "Élève Test", role: "eleve" };
  const ELEVE2 = { id: "00000000-0000-4000-8000-000000000003", email: "lv.binome.test@lycee-verdun.edu.lb", nom: "Binôme Test", role: "eleve" };
  const MOI = role === "prof" ? PROF : role === "eleve" ? ELEVE : null;

  const profil = p => ({ id: p.id, email: p.email, nom: p.nom, role: p.role, cree_le: jour(-40), prefs: {}, vu_le: jour(-2), derniere_visite: jour(0), visites: 12 });

  /* ---------- données fictives (forme des tables de sources/supabase/) ---------- */
  const classe = (id, nom, couleur, ordre, matiere) => ({
    id, nom, section: "Test", couleur, symbole: "", ordre, dossier_onedrive: null, code: "test" + ordre, code_actif: true,
    liens: [], description: "Cours fictif pour les tests.", niveau: "", matiere, salle: "B12", archive: false,
    flux_mode: "prof", flux_devoirs: true, teams_url: null, teams_visible: false, moyenne_visible: true, illustration: null, categories: []
  });
  const DB = {
    profiles: [profil(PROF), profil(ELEVE), profil(ELEVE2)],
    classes: [classe("tle", "Tle spé PC (test)", "pc", 1, "Physique-Chimie"), classe("snt", "SNT (test)", "snt", 2, "SNT")],
    inscriptions: [
      { classe_id: "tle", email: ELEVE.email, nom: ELEVE.nom }, { classe_id: "tle", email: ELEVE2.email, nom: ELEVE2.nom },
      { classe_id: "snt", email: ELEVE.email, nom: ELEVE.nom }
    ],
    themes: [
      { id: 1, classe_id: "tle", titre: "Chapitre 1 · Ondes mécaniques", ordre: 1 },
      { id: 2, classe_id: "tle", titre: "Chapitre 2 · Dosages", ordre: 2 },
      { id: 3, classe_id: "snt", titre: "Internet", ordre: 1 }
    ],
    supports: [
      { id: 1, classe_id: "tle", theme_id: 1, titre: "Cours : ondes progressives", description: "Lire le cours avant la séance.", ressources: [{ type: "lien", url: "https://example.org/cours", titre: "Cours en ligne" }], publie_le: jour(-5), brouillon: false, eleves: null, position: 1 },
      { id: 2, classe_id: "snt", theme_id: 3, titre: "Fiche : adresses IP", description: "", ressources: [], publie_le: jour(-3), brouillon: false, eleves: null, position: 1 },
      { id: 3, classe_id: "tle", theme_id: 2, titre: "ZZ support brouillon", description: "", ressources: [], publie_le: jour(-4), brouillon: true, eleves: null, position: 2 }
    ],
    devoirs: [
      { id: 1, classe_id: "tle", theme_id: 1, titre: "Exercices sur les ondes", consigne: "<p>Faire les exercices 3 et 4.</p><ol><li>Lire l'énoncé</li><li>Faire le schéma</li><li>Rédiger la réponse</li></ol>", ressources: [{ type: "DOCX", label: "Fiche ondes.docx", url: "https://exemple.sharepoint.com/:w:/g/fiche", od: { id: "OD-FICHE", web: "https://exemple.sharepoint.com/fiche.docx" } }, { type: "Fichier", label: "Schéma à compléter.png", path: "tle/schema.png" }], date_limite: jour(3), mode: "individuel", formats: "", points: 20, publie_le: jour(-2), brouillon: false, eleves: null, type: "devoir", question: null, categorie: "", grille: null, retard_ok: true, position: 2, accepte: true },
      { id: 2, classe_id: "tle", theme_id: 2, titre: "Compte rendu de TP", consigne: "Rendre le compte rendu du dosage.", ressources: [], date_limite: jour(-1), mode: "binome", formats: "", points: 20, publie_le: jour(-8), brouillon: false, eleves: null, type: "devoir", question: null, categorie: "", grille: null, retard_ok: false, position: 1, accepte: true },
      { id: 3, classe_id: "snt", theme_id: 3, titre: "Question : qu'est-ce qu'un routeur ?", consigne: "Réponds en deux phrases.", ressources: [], date_limite: jour(6), mode: "individuel", formats: "", points: null, publie_le: jour(-1), brouillon: false, eleves: null, type: "question", question: { type: "courte" }, categorie: "", grille: null, retard_ok: true, position: 1, accepte: true }
    ],
    rendus: [
      { id: 1, devoir_id: 2, auteur: ELEVE.id, auteur_email: ELEVE.email, binome_email: ELEVE2.email, fichiers: [], lien: "https://example.org/compte-rendu", rendu_le: jour(-2), reponse: null }
    ],
    corrections: [
      { rendu_id: 1, note: 15.5, commentaire: "Bon travail, attention aux unités.", publiee: true, modifie_le: jour(-1), grille: null, competences: null, annotations: null, audio: null }
    ],
    quiz: [
      { id: 1, classe_id: "tle", theme_id: 1, titre: "Questionnaire : ondes", mode: "note", consigne: "", points: 4, date_limite: jour(5), publie_le: jour(-1), brouillon: false, eleves: null, montrer_correction: true, categorie: "", melanger: false, position: 3,
        questions: [{ q: "Une onde mécanique transporte-t-elle de la matière ?", t: "choix", o: ["Oui", "Non"] }, { q: "Unité de la célérité ?", t: "choix", o: ["m/s", "Hz", "s"] }] },
      { id: 2, classe_id: "tle", theme_id: 1, titre: "Entraînement : célérité", mode: "entrainement", consigne: "", points: 3, date_limite: jour(1), publie_le: jour(-1), brouillon: false, eleves: null, montrer_correction: true, categorie: "", melanger: false, position: 4,
        questions: [{ q: "Calcule la célérité (en m/s) : d = 3,0 m en t = 2,0×10^-3 s.", t: "num", o: [] }, { q: "Une onde transporte de l'énergie.", t: "choix", o: ["Vrai", "Faux"] }, { q: "Grandeurs à mesurer ?", t: "cases", o: ["Distance", "Durée", "Masse"] }] }
    ],
    quiz_solutions: [{ quiz_id: 1, bonnes: [1, 0] }, { quiz_id: 2, bonnes: [{ v: "1500", tol: "5" }, 0, [0, 1]] }],
    resultats_quiz: [],
    annonces: [{ id: 1, classe_id: "tle", auteur: PROF.id, auteur_nom: PROF.nom, texte: "Bienvenue dans le cours (annonce de test).", ressources: [], cree_le: jour(-4), publie_le: jour(-4), epingle: true },
      { id: 2, classe_id: "tle", auteur: PROF.id, auteur_nom: PROF.nom, texte: "Annonce programmée (test).", ressources: [], cree_le: jour(-1), publie_le: jour(2), epingle: false }],
    commentaires: [{ id: 1, annonce_id: 1, auteur: ELEVE.id, auteur_nom: ELEVE.nom, texte: "Merci !", cree_le: jour(-1) }],
    commentaires_prives: [],
    commentaires_devoirs: [{ id: 1, devoir_id: 1, auteur: ELEVE.id, auteur_nom: ELEVE.nom, texte: "Faut-il rendre les deux exercices ? (commentaire de test)", cree_le: jour(-0.5) }],
    reglages: [{ id: 1, data: {}, modifie_le: jour(-10) }],
    copies: [{ id: 1, classe_id: "tle", objet: "devoir", objet_id: 1, source: "OD-FICHE", eleve_email: ELEVE.email, nom: "Fiche ondes.docx", od_id: "OD-COPIE", web: "https://exemple.sharepoint.com/_layouts/15/Doc.aspx?sourcedoc=x", fichier: "https://exemple.sharepoint.com/personal/prof/Documents/Copies/Eleve%20Test%20-%20Fiche%20ondes.docx", cree_le: jour(-2) }],
    messages_urgents: [{ id: 1, classe_id: "tle", eleve: ELEVE.id, eleve_email: ELEVE.email, eleve_nom: ELEVE.nom, texte: "Message urgent de test.", cree_le: jour(-0.1), lu: false, reponse: null, repondu_le: null, de_prof: false }],
    demandes_materiel: [],
    rdv_series: [{ id: 1, classe_id: "tle", titre: "Rendez-vous de test", lieu: "Salle B12", consigne: "", cree_le: jour(-3) }],
    rdv_creneaux: [{ id: 1, serie_id: 1, debut: jour(2), fin: new Date(T0 + 2 * J + 15 * 6e4).toISOString(), capacite: 1 }],
    rdv_reservations: [],
    notes_perso: [],
    corbeille: [],
    sauvegardes: [],
    flashcards: [{ id: 1, classe_id: "tle", theme_id: 1, recto: "Célérité", verso: "Vitesse de propagation de l'onde", ordre: 1, cree_le: jour(-3) }]
  };
  /* un élève ne voit que ses données (comme les règles RLS) */
  if (role === "eleve") {
    DB.profiles = DB.profiles.filter(p => p.id === ELEVE.id);
    DB.messages_urgents = DB.messages_urgents.filter(m => m.eleve === ELEVE.id);
    DB.annonces = DB.annonces.filter(a => new Date(a.publie_le) <= new Date());
    DB.quiz_solutions = []; DB.corbeille = []; DB.sauvegardes = []; DB.demandes_materiel = [];
  }

  /* ---------- fonctions SQL simulées (RPC) ---------- */
  const RPC = {
    pp_accueil_public: () => ({ classes: DB.classes.map(c => ({ id: c.id, nom: c.nom, section: c.section, couleur: c.couleur, symbole: c.symbole, ordre: c.ordre, description: c.description, illustration: c.illustration })), reglages: {} }),
    pp_presence: () => false,
    pp_presence2: () => ({ kick: false }),
    pp_visite: () => null,
    pp_statut_prof: () => ({ actif: true }),
    pp_stats_visites: () => ({ comptes: 2, visites: 17, aujourdhui: 1, enligne: 1, inactifs: 0, noms: [ELEVE.nom] }),
    pp_sessions: () => [{ id: "00000000-0000-4000-8000-0000000000aa", user_id: ELEVE.id, email: ELEVE.email, nom: ELEVE.nom, role: "eleve", classes: "Tle spé PC (test)", appareil: "Windows · Chrome", debut: jour(-0.05), vu_le: jour(0), visible: true, en_ligne: true, deconnecter: false, actif_le: jour(0) },
      { id: "00000000-0000-4000-8000-0000000000ab", email: "eleve.ordi@lycee-verdun.edu.lb", nom: "Élève Ordinateur", role: "eleve", classes: "Tle spé PC (test)", appareil: "Windows · Chrome", debut: jour(-0.1), vu_le: jour(-0.02), visible: false, en_ligne: false, statut: "inactif", deconnecter: false, actif_le: jour(-0.02) },
      { id: "00000000-0000-4000-8000-0000000000ac", email: "eleve.tel@lycee-verdun.edu.lb", nom: "Élève Téléphone", role: "eleve", classes: "Tle spé PC (test)", appareil: "Android · Chrome (application)", debut: jour(-0.1), vu_le: jour(-0.02), visible: false, en_ligne: false, statut: "inactif", deconnecter: false, actif_le: jour(-0.02) }],
    pp_places: () => DB.rdv_creneaux.map(c => ({ creneau_id: c.id, pris: DB.rdv_reservations.filter(r => r.creneau_id === c.id).length })),
    pp_fichiers: () => [],
    pp_prefs: a => { const p = DB.profiles.find(x => MOI && x.id === MOI.id); if (p) p.prefs = (a && a.p) || {}; return null; },
    pp_vu: () => { const t = new Date().toISOString(); const p = DB.profiles.find(x => MOI && x.id === MOI.id); if (p) p.vu_le = t; return t; },
    pp_urgent_lu: () => null,
    pp_push_abonner: () => null,
    pp_push_desabonner: () => null,
    pp_reserver: () => null,
    pp_annuler_rdv: () => null,
    pp_deconnecter: () => null,
    pp_fin_session: () => null,
    pp_fin_appareil: () => null,
    pp_quitter_cours: () => null,
    pp_restaurer: () => null,
    pp_sauvegarde: () => ({}),
    pp_supprimer_compte: () => null,
    rejoindre_classe: () => "tle",
    soumettre_quiz: () => ({ score: 2, sur: 4 })
  };

  /* ---------- outils ---------- */
  const APPELS = window.__PP_APPELS = [];
  const INCONNUS = window.__PP_INCONNUS = [];
  const inconnu = x => { if (!INCONNUS.includes(x)) INCONNUS.push(x); };
  const copie = v => v === undefined ? v : JSON.parse(JSON.stringify(v));
  const ok = data => ({ data: copie(data), error: null, count: null, status: 200, statusText: "OK" });
  const ko = (message, code) => ({ data: null, error: { message, code: code || "BOUCHON", details: "", hint: "" }, count: null, status: 400, statusText: "Bad Request" });
  const idsSuivants = {};
  const nouvelId = t => { if (!idsSuivants[t]) idsSuivants[t] = Math.max(0, ...(DB[t] || []).map(r => typeof r.id === "number" ? r.id : 0)) + 1; return idsSuivants[t]++; };
  const egal = (a, b) => String(a) === String(b);
  const contient = (a, b) => {
    if (a == null) return false;
    if (Array.isArray(b)) return Array.isArray(a) && b.every(x => a.some(y => JSON.stringify(y) === JSON.stringify(x)));
    if (typeof b === "object") return Object.keys(b).every(k => JSON.stringify(a[k]) === JSON.stringify(b[k]));
    return String(a).includes(String(b));
  };
  const valeurFiltre = v => { if (v === "null") return null; if (v === "true") return true; if (v === "false") return false; return v; };
  const OPS = {
    eq: (a, b) => egal(a, b), neq: (a, b) => !egal(a, b),
    gt: (a, b) => a != null && a > b, gte: (a, b) => a != null && a >= b, lt: (a, b) => a != null && a < b, lte: (a, b) => a != null && a <= b,
    in: (a, b) => (Array.isArray(b) ? b : String(b).replace(/^\(|\)$/g, "").split(",")).some(x => egal(a, x)),
    is: (a, b) => (b === null ? a == null : a === b),
    like: (a, b) => a != null && new RegExp("^" + String(b).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*") + "$").test(a),
    ilike: (a, b) => a != null && new RegExp("^" + String(b).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*") + "$", "i").test(a),
    contains: contient, cs: contient
  };

  /* ---------- tables liées dans select("…, annonces(classe_id, auteur)") ---------- */
  function lier(table, ligne, select) {
    const re = /(\w+)\s*(?:!\w+)?\s*\(([^()]*)\)/g; let m;
    while ((m = re.exec(select || ""))) {
      const autre = m[1]; if (!DB[autre]) { inconnu("lien " + table + " → " + autre); continue; }
      const cle = autre.replace(/s$/, "") + "_id";
      if (cle in ligne) ligne[autre] = copie(DB[autre].find(r => egal(r.id, ligne[cle])) || null);
      else { const inverse = table.replace(/s$/, "") + "_id"; ligne[autre] = copie(DB[autre].filter(r => egal(r[inverse], ligne.id))); }
    }
    return ligne;
  }

  /* ---------- requêtes sur les tables : from("…") ---------- */
  class Requete {
    constructor(table) { this.t = table; this.op = "select"; this.f = []; this.tri = []; this.lim = null; this.debut = 0; this.un = null; this.cols = "*"; this.opts = {}; this.charge = null; this.conflit = null; this.renvoyer = false; }
    select(cols, opts) { if (this.op === "select") { this.cols = cols || "*"; this.opts = opts || {}; } else this.renvoyer = true; return this; }
    insert(v) { this.op = "insert"; this.charge = v; return this; }
    upsert(v, o) { this.op = "upsert"; this.charge = v; this.conflit = o && o.onConflict; return this; }
    update(v) { this.op = "update"; this.charge = v; return this; }
    delete() { this.op = "delete"; return this; }
    filtre(c, op, v) { this.f.push(r => OPS[op](r[c], v)); return this; }
    eq(c, v) { return this.filtre(c, "eq", v); } neq(c, v) { return this.filtre(c, "neq", v); }
    gt(c, v) { return this.filtre(c, "gt", v); } gte(c, v) { return this.filtre(c, "gte", v); }
    lt(c, v) { return this.filtre(c, "lt", v); } lte(c, v) { return this.filtre(c, "lte", v); }
    in(c, v) { return this.filtre(c, "in", v); } is(c, v) { return this.filtre(c, "is", v); }
    like(c, v) { return this.filtre(c, "like", v); } ilike(c, v) { return this.filtre(c, "ilike", v); }
    contains(c, v) { return this.filtre(c, "contains", v); }
    match(o) { Object.keys(o || {}).forEach(k => this.eq(k, o[k])); return this; }
    filter(c, op, v) { if (OPS[op]) return this.filtre(c, op, valeurFiltre(v)); inconnu("filter " + op); return this; }
    not(c, op, v) { if (OPS[op]) { const val = valeurFiltre(v); this.f.push(r => !OPS[op](r[c], val)); } else inconnu("not " + op); return this; }
    or() { inconnu("or (ignoré)"); return this; }
    order(c, o) { this.tri.push({ c, asc: !o || o.ascending !== false, nf: o && o.nullsFirst }); return this; }
    limit(n) { this.lim = n; return this; }
    range(a, b) { this.debut = a; this.lim = b - a + 1; return this; }
    single() { this.un = "single"; return this; }
    maybeSingle() { this.un = "maybe"; return this; }
    returns() { return this; } abortSignal() { return this; } throwOnError() { return this; }
    lignes() { return (DB[this.t] || []).filter(r => this.f.every(f => f(r))); }
    executer() {
      APPELS.push({ table: this.t, op: this.op });
      if (!DB[this.t]) { inconnu("table " + this.t); DB[this.t] = []; }
      let res;
      if (this.op === "select") {
        let L = this.lignes().slice();
        for (const s of this.tri.slice().reverse()) L.sort((a, b) => {
          const x = a[s.c], y = b[s.c];
          if (x == null && y == null) return 0;
          if (x == null) return s.nf === undefined ? (s.asc ? 1 : -1) : s.nf ? -1 : 1;
          if (y == null) return s.nf === undefined ? (s.asc ? -1 : 1) : s.nf ? 1 : -1;
          return (x < y ? -1 : x > y ? 1 : 0) * (s.asc ? 1 : -1);
        });
        const total = L.length;
        if (this.debut) L = L.slice(this.debut);
        if (this.lim != null) L = L.slice(0, this.lim);
        L = L.map(r => lier(this.t, copie(r), this.cols));
        res = ok(this.opts.head ? null : L); if (this.opts.count) res.count = total;
      } else if (this.op === "insert" || this.op === "upsert") {
        const v = (Array.isArray(this.charge) ? this.charge : [this.charge]).map(copie), sortie = [];
        for (const r of v) {
          const cles = this.conflit ? this.conflit.split(",").map(s => s.trim()) : ("id" in r ? ["id"] : null);
          const existe = this.op === "upsert" && cles && DB[this.t].find(x => cles.every(k => egal(x[k], r[k])));
          if (existe) { Object.assign(existe, r); sortie.push(existe); continue; }
          const n = Object.assign({}, r);
          if (!("id" in n) && DB[this.t].some(x => typeof x.id === "number")) n.id = nouvelId(this.t);
          if (!("cree_le" in n) && DB[this.t].some(x => "cree_le" in x)) n.cree_le = new Date().toISOString();
          /* dates remplies par défaut dans la vraie base (default now()) */
          for (const k of ["rendu_le", "fait_le", "modifie_le"]) if (!(k in n) && DB[this.t].some(x => k in x)) n[k] = new Date().toISOString();
          DB[this.t].push(n); sortie.push(n);
        }
        res = ok(this.renvoyer ? sortie : null);
      } else if (this.op === "update") {
        const L = this.lignes(); L.forEach(r => Object.assign(r, copie(this.charge)));
        res = ok(this.renvoyer ? L : null);
      } else if (this.op === "delete") {
        const L = this.lignes(); DB[this.t] = DB[this.t].filter(r => !L.includes(r));
        res = ok(this.renvoyer ? L : null);
      }
      if (this.un) {
        const L = Array.isArray(res.data) ? res.data : [];
        if (L.length > 1 || (this.un === "single" && L.length === 0)) return ko("JSON object requested, multiple (or no) rows returned", "PGRST116");
        res.data = L[0] || null;
      }
      return res;
    }
    /* hors connexion (navigateur « offline ») : même réponse que supabase-js quand le réseau manque */
    then(ok, ko) { return new Promise(r => setTimeout(r, 5)).then(() => navigator.onLine === false ? { data: null, error: { name: "TypeError", message: "TypeError: Failed to fetch" } } : this.executer()).then(ok, ko); }
    catch(ko) { return this.then(undefined, ko); }
    finally(f) { return this.then(v => { f(); return v; }, e => { f(); throw e; }); }
  }

  /* ---------- stockage (buckets « documents » et « rendus ») ---------- */
  const FICHIER_TEST = "data:text/plain;charset=utf-8," + encodeURIComponent("Fichier fictif (test PhysiquePro)");
  const stockage = bucket => {
    const a = (op, data) => { APPELS.push({ bucket, op }); return Promise.resolve(ok(data)); };
    return {
      /* window.__PP_PANNE = n : les n prochains envois échouent comme une coupure de réseau (test de l'envoi fiable) */
      upload: (chemin, f) => { if (window.__PP_PANNE > 0) { window.__PP_PANNE--; APPELS.push({ bucket, op: "upload-panne" }); return Promise.resolve({ data: null, error: { name: "TypeError", message: "Failed to fetch" } }); }
        APPELS.push({ bucket, op: "upload", chemin, taille: f && f.size, type: f && f.type }); return Promise.resolve(ok({ path: chemin, fullPath: bucket + "/" + chemin })); },
      remove: (L) => a("remove", (L || []).map(name => ({ name }))),
      list: () => a("list", []),
      copy: (de, vers) => a("copy", { path: vers }),
      move: (de, vers) => a("move", { path: vers }),
      download: () => a("download", new Blob(["Fichier fictif"], { type: "text/plain" })),
      /* une image fictive (vraie image du site) pour les fichiers .png/.jpg : sert à l'annotation par l'élève */
      createSignedUrls: (L) => a("createSignedUrls", (L || []).map(p => ({ path: p, signedUrl: /\.(png|jpe?g)$/i.test(p || "") ? location.origin + "/icon-512.png" : FICHIER_TEST }))),
      createSignedUrl: (p) => a("createSignedUrl", { signedUrl: /\.(png|jpe?g)$/i.test(p || "") ? location.origin + "/icon-512.png" : FICHIER_TEST }),
      getPublicUrl: () => ({ data: { publicUrl: FICHIER_TEST } })
    };
  };

  /* ---------- connexion simulée ---------- */
  let session = MOI ? { access_token: "jeton-factice", token_type: "bearer", expires_in: 3600, expires_at: Math.floor(T0 / 1000) + 3600, refresh_token: "factice",
    user: { id: MOI.id, email: MOI.email, aud: "authenticated", role: "authenticated", app_metadata: { provider: "azure" }, user_metadata: { full_name: MOI.nom } } } : null;
  const ecouteurs = [];
  const auth = {
    getSession: async () => ok({ session }),
    getUser: async () => ok({ user: session ? session.user : null }),
    refreshSession: async () => ok({ session, user: session && session.user }),
    onAuthStateChange: cb => { ecouteurs.push(cb); return { data: { subscription: { unsubscribe() { const i = ecouteurs.indexOf(cb); if (i >= 0) ecouteurs.splice(i, 1); } } } }; },
    signInWithOAuth: async () => { APPELS.push({ auth: "signInWithOAuth" }); return ok({ provider: "azure", url: null }); },
    signOut: async () => { APPELS.push({ auth: "signOut" }); session = null; ecouteurs.slice().forEach(cb => { try { cb("SIGNED_OUT", null); } catch (_) {} }); return { error: null }; }
  };

  window.supabase = {
    createClient: () => ({
      auth,
      from: t => new Requete(t),
      rpc: (nom, args) => {
        APPELS.push({ rpc: nom });
        const f = RPC[nom];
        if (!f) { inconnu("rpc " + nom); return Promise.resolve(ko("function " + nom + " inconnue du bouchon de test")); }
        return new Promise(r => setTimeout(r, 5)).then(() => ok(f(args || {})));
      },
      functions: { invoke: async (nom, o) => { APPELS.push({ fonction: nom }); const b = (o && o.body) || {}; return ok(b.action === "cle" ? { cle: "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U" } : { envoyes: 0, eleves: 0, appareils: 0 }); } },
      storage: { from: stockage },
      channel: () => { inconnu("channel"); const c = { on: () => c, subscribe: () => c, unsubscribe: () => Promise.resolve("ok") }; return c; },
      removeChannel: () => Promise.resolve("ok")
    })
  };
  window.__PP_BOUCHON = { role, DB };
})();
