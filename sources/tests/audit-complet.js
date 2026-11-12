"use strict";
/* =====================================================================
   PhysiquePro · AUDIT COMPLET (audit final du 12/11/2026)
   ---------------------------------------------------------------------
   Passe TOUT le site au crible, famille de défauts par famille, au lieu
   de regarder quelques pages : ~550 pages sur 20 écrans (prof ordinateur
   et téléphone, élève ordinateur, iPhone SE/13/paysage, Pixel 7, Galaxy,
   Android 320 px, mode sombre, et données à TEXTES TRÈS LONGS), avec
   chaque menu et chaque fenêtre ouverts.
   Familles : mot coupé en fin de ligne, texte rogné, élément qui sort de
   l'écran, texte < 12 px et cible < 44 px sur téléphone, boutons qui se
   chevauchent, menu hors de l'écran, accords (1 élèves…), « ... »,
   espace avant ? ! ; :, image sans alt, accessibilité axe-core (si
   installé : npm i axe-core dans sources/tests), erreurs JavaScript.
   Lancer depuis la racine du dépôt (≈ 15 min) :
     node sources/tests/audit-complet.js          (les 4 groupes en parallèle)
   Résultat : liste des constats par famille ; code de sortie 1 s'il en reste.
   Faux positifs connus déjà écartés (voir FAUX_POSITIFS plus bas).
   ===================================================================== */
const path = require("path"), fs = require("fs");
const REPO = path.join(__dirname, "..", "..");
const { demarrer } = require(REPO + "/sources/tests/serveur");
const { chromium, devices } = require("playwright");
let AXE = null; try { AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8"); } catch (_) { console.log("(axe-core absent : contrôle d'accessibilité sauté — npm i axe-core dans sources/tests)"); }
const UID = "00000000-0000-4000-8000-000000000002";
const PAGES = {
  visiteur: ["/accueil", "/outils", "/simulations", "/physique", "/donnees"],
  eleve: ["/accueil", "/classe/tle", "/classe/tle/flux", "/classe/tle/travaux", "/classe/tle/personnes", "/classe/tle/notes", "/classe/snt",
    "/devoir/1", "/devoir/2", "/devoir/3", "/quiz/1", "/quiz/2", "/todo", "/agenda", "/semaine", "/revisions", "/outils", "/simulations", "/physique",
    "/rendezvous", "/admin/profil", "/donnees"],
  prof: ["/accueil", "/classe/tle", "/classe/tle/flux", "/classe/tle/travaux", "/classe/tle/personnes", "/classe/tle/notes", "/classe/tle/corriger",
    "/classe/tle/parametres", "/classe/snt", "/devoir/1", "/devoir/2", "/devoir/3", "/quiz/1", "/todo", "/agenda", "/semaine", "/revisions", "/programmes",
    "/corbeille", "/suivi", "/urgences", "/preparateur", "/rendezvous", "/outils", "/simulations", "/physique",
    "/admin/profil", "/admin/site", "/admin/cours", "/admin/eleves", "/admin/fichiers", "/admin/import", "/admin/sauvegarde", "/donnees",
    "/editer/devoir/new/tle", "/editer/questionnaire/new/tle", "/editer/question/new/tle", "/editer/documentation/new/tle"]
};
const G = {
  a: [{ nom: "iphone-se", role: "eleve", dev: "iPhone SE" }, { nom: "android-320", role: "eleve", dev: "Galaxy S5", vue: { width: 320, height: 640 } }, { nom: "iphone-se-long", role: "eleve", dev: "iPhone SE", long: 1 }, { nom: "visiteur-iphone13", role: "visiteur", dev: "iPhone 13" }],
  b: [{ nom: "iphone-13", role: "eleve", dev: "iPhone 13" }, { nom: "iphone-13-sombre", role: "eleve", dev: "iPhone 13", sombre: 1 }, { nom: "iphone-13-paysage", role: "eleve", dev: "iPhone 13 landscape" }, { nom: "android-320-long", role: "eleve", dev: "Galaxy S5", vue: { width: 320, height: 640 }, long: 1 }],
  c: [{ nom: "pixel-7", role: "eleve", dev: "Pixel 7" }, { nom: "pixel-7-sombre", role: "eleve", dev: "Pixel 7", sombre: 1 }, { nom: "galaxy-s9plus", role: "eleve", dev: "Galaxy S9+" }, { nom: "eleve-1280", role: "eleve", vue: { width: 1280, height: 860 } }, { nom: "eleve-1366-sombre", role: "eleve", vue: { width: 1366, height: 768 }, sombre: 1 }, { nom: "eleve-1280-long", role: "eleve", vue: { width: 1280, height: 860 }, long: 1 }],
  d: [{ nom: "prof-1280", role: "prof", vue: { width: 1280, height: 860 } }, { nom: "prof-1024", role: "prof", vue: { width: 1024, height: 768 } }, { nom: "prof-1280-sombre", role: "prof", vue: { width: 1280, height: 860 }, sombre: 1 }, { nom: "prof-1280-long", role: "prof", vue: { width: 1280, height: 860 }, long: 1 }, { nom: "prof-iphone13", role: "prof", dev: "iPhone 13" }, { nom: "visiteur-1280", role: "visiteur", vue: { width: 1280, height: 860 } }],
};
const groupe = process.argv[2] || "tout";
const OUT = path.join(__dirname, "captures", "audit", groupe); if (groupe !== "tout") fs.mkdirSync(OUT, { recursive: true });

/* mesures faites dans la page ; zone = sélecteur de la partie ouverte (menu, fenêtre) ou null */
function mesurer({ tel, zone }) {
  const R = [];
  const nomEl = x => { let s = x.tagName.toLowerCase(); if (x.id) s += "#" + x.id; const c = [...x.classList].slice(0, 2).join("."); if (c) s += "." + c; return s; };
  const chemin = x => { const p = x.parentElement; return (p ? nomEl(p) + " > " : "") + nomEl(x); };
  const vis = x => { const r = x.getBoundingClientRect(); if (!r.width || !r.height) return false; if (x.checkVisibility && !x.checkVisibility({ opacityProperty: true, visibilityProperty: true, contentVisibilityAuto: true })) return false;
    /* caché par un parent replié (overflow hidden) ? */
    for (let a = x.parentElement; a && a !== document.body; a = a.parentElement) { const sa = getComputedStyle(a); if (sa.overflow !== "visible" || sa.overflowY !== "visible") { const ra = a.getBoundingClientRect(); if (r.bottom <= ra.top + 1 || r.top >= ra.bottom - 1 || r.right <= ra.left + 1 || r.left >= ra.right - 1) return false; } }
    return true; };
  const racines = zone ? [...document.querySelectorAll(zone)].filter(vis) : [document.body];
  const W = document.documentElement.clientWidth;
  const EXCL = "input,textarea,select,option,script,style,noscript,[contenteditable],svg,canvas,.sr-only,.visually-hidden";
  for (const root of racines) {
    /* 1. mots coupés en fin de ligne + texte rogné */
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = tw.nextNode(); n; n = tw.nextNode()) {
      const p = n.parentElement; if (!p || p.closest(EXCL) || !vis(p)) continue;
      const t = n.nodeValue; const re = /[^\s\u00a0]+/g; let m;
      while ((m = re.exec(t))) {
        const w = m[0].replace(/[\u2060]/g, ""); if (w.length < 3 || /^https?:/.test(w)) continue;
        const rg = document.createRange(); rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length);
        const rs = [...rg.getClientRects()].filter(r => r.width > 0.5); if (rs.length < 2) continue;
        const tops = new Set(rs.map(r => Math.round(r.top / 4))); if (tops.size > 1) R.push({ f: "mot coupé", el: chemin(p), t: w.slice(0, 40) });
      }
    }
    for (const x of root.querySelectorAll("*")) {
      if (!vis(x) || x.closest(EXCL)) continue;
      const s = getComputedStyle(x), r = x.getBoundingClientRect();
      const aTexte = [...x.childNodes].some(c => c.nodeType === 3 && c.nodeValue.trim().length > 1);
      /* 2. texte coupé par « … » ou caché */
      if (aTexte && (s.overflow !== "visible" || s.textOverflow === "ellipsis" || s.webkitLineClamp !== "none") && (x.scrollWidth > x.clientWidth + 2 || x.scrollHeight > x.clientHeight + 3) && !/textarea|pre/.test(x.tagName))
        R.push({ f: "texte rogné", el: chemin(x), t: x.textContent.trim().slice(0, 50) });
      /* 3. sort de l'écran à droite */
      if (r.right > W + 2 && s.position !== "fixed" && !x.closest(".tablewrap,.scrollx,.tw,table,pre,.gradebook,.qpuces,.tabs,.chips,.fchips,.carrousel,[style*='overflow']")) {
        let anc = x.parentElement, scroll = false; while (anc && anc !== document.body) { const o = getComputedStyle(anc).overflowX; if (o === "auto" || o === "scroll" || o === "hidden") { scroll = true; break; } anc = anc.parentElement; }
        if (!scroll) R.push({ f: "sort de l'écran", el: chemin(x), t: Math.round(r.right) + " px > " + W });
      }
      /* 4. petite police sur téléphone */
      if (tel && aTexte && parseFloat(s.fontSize) < 12) R.push({ f: "texte < 12 px", el: chemin(x), t: s.fontSize + " « " + x.textContent.trim().slice(0, 25) + " »" });
      /* 5. petite cible sur téléphone */
      if (tel && x.matches("a[href],button,select,input:not([type=hidden]),[role=button],summary,label.opt") && !(x.tagName === "A" && x.closest("p,li,.richtext,.reponse,small") && !x.className)) {
        if (x.type === "checkbox" || x.type === "radio") { const l = x.closest("label"); if (l && Math.min(l.getBoundingClientRect().height, l.getBoundingClientRect().width) >= 44) continue; }
        if (Math.min(r.width, r.height) < 44 && s.position !== "absolute") R.push({ f: "cible < 44 px", el: chemin(x), t: Math.round(r.width) + "×" + Math.round(r.height) + " « " + (x.textContent.trim() || x.getAttribute("aria-label") || "").slice(0, 20) + " »" });
      }
    }
    /* 6. éléments cliquables qui se chevauchent */
    const cl = [...root.querySelectorAll("a[href],button,select,input:not([type=hidden]),[role=button]")].filter(vis).filter(x => getComputedStyle(x).position !== "fixed" && !x.closest(".navbas,.apptuile,[aria-hidden=true]"));
    for (let i = 0; i < cl.length; i++) for (let j = i + 1; j < cl.length; j++) {
      const a = cl[i], b = cl[j]; if (a.contains(b) || b.contains(a)) continue;
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      const ix = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), iy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
      if (ix > 4 && iy > 4) R.push({ f: "chevauchement", el: chemin(a) + " ⟷ " + chemin(b), t: Math.round(ix) + "×" + Math.round(iy) });
    }
    /* 7. textes suspects */
    const txt = root.innerText || "";
    const motifs = [[/\bundefined\b|\bnull\b|\bNaN\b|\[object|Invalid Date/, "valeur brute"], [/(^|[^\d])1 (élèves|devoirs|rendus|notes|travaux|questions|copies|messages|jours|cours suivis)\b/, "accord (1 + pluriel)"],
      [/\b([2-9]|\d\d+) (élève|devoir|rendu|note|question|copie|message|jour)\b(?!s)/, "accord (pluriel)"], [/\w \.\.\.|[^.]\.\.\.(?!\.)/, "« ... » au lieu de « … »"], [/[a-zà-ÿ][?!;:](?=\s|$)/i, "pas d'espace avant ? ! ; :"]];
    for (const [re, f] of motifs) { const m = txt.match(new RegExp(".{0,30}(" + re.source + ").{0,20}", re.flags)); if (m && !/https?:|\d:\d|\bex\. /.test(m[0])) R.push({ f, el: zone || "page", t: m[0].replace(/\s+/g, " ").trim() }); }
  }
  /* 8. images sans texte, boutons sans nom */
  for (const root of racines) for (const x of root.querySelectorAll("img")) if (vis(x) && !x.hasAttribute("alt")) R.push({ f: "image sans alt", el: chemin(x), t: (x.getAttribute("src") || "").slice(0, 40) });
  return R;
}

async function auditGroupe() {
  const srv = await demarrer(0), base = "http://127.0.0.1:" + srv.address().port;
  const nav = await chromium.launch();
  const res = [];
  const ajoute = (e, p, etat, l) => l.forEach(x => res.push({ ecran: e.nom, page: p, etat, ...x }));
  for (const e of G[groupe]) {
    const dev = e.dev ? devices[e.dev] : {}, tel = !!(e.dev && dev.isMobile);
    const ctx = await nav.newContext({ ...dev, ...(e.vue ? { viewport: e.vue } : {}), locale: "fr-FR", serviceWorkers: "block", colorScheme: e.sombre ? "dark" : "light", bypassCSP: true });
    await ctx.addInitScript(([uid, role, long]) => { window.__PP_ROLE = role; if (long) window.__PP_LONG = 1; try { localStorage.setItem("pp_tel_" + uid + "_visite", "1"); localStorage.setItem("pp_tel_" + uid + "_installvu", "1"); } catch (_) {} }, [UID, e.role, !!e.long]);
    await ctx.route("**/*", r => { const u = new URL(r.request().url()); if (u.hostname === "127.0.0.1" || u.protocol === "data:" || u.protocol === "blob:") return r.continue(); return r.fulfill({ status: 200, contentType: /fonts\.googleapis/.test(u.hostname) ? "text/css" : "text/plain", body: "" }); });
    const page = await ctx.newPage(); let errs = [];
    page.on("pageerror", x => errs.push("JS " + x.message)); page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errs.push("console " + m.text()); });
    page.on("dialog", d => d.dismiss().catch(() => {}));
    await page.goto(base + "/#/accueil", { waitUntil: "load" }); await page.waitForSelector("#app > :not(.loading)", { timeout: 15000 }); await page.waitForTimeout(800);
    const axe = async zone => { if (!AXE) return []; if (!(await page.evaluate(() => !!window.axe))) await page.addScriptTag({ content: AXE }); return page.evaluate(async z => { const r = await axe.run(z ? { include: [z] } : document, { runOnly: ["wcag2a", "wcag2aa", "wcag21aa"], resultTypes: ["violations"] }); return r.violations.flatMap(v => v.nodes.slice(0, 3).map(n => ({ f: "axe " + v.id, el: n.target.join(" "), t: (n.any[0]?.message || n.all[0]?.message || "").slice(0, 110) }))); }, zone); };
    for (const p of PAGES[e.role]) {
      errs = [];
      await page.evaluate(h => { location.hash = h; }, "#" + p); await page.waitForTimeout(900);
      ajoute(e, p, "page", await page.evaluate(mesurer, { tel, zone: null }));
      ajoute(e, p, "page", await axe(null));
      /* contenu caché sous la barre du bas : on descend tout en bas */
      const bas = await page.evaluate(() => { scrollTo(0, 1e6); const fix = [...document.querySelectorAll("body *")].filter(x => { const s = getComputedStyle(x); const r = x.getBoundingClientRect(); return s.position === "fixed" && r.width > innerWidth * .6 && r.bottom >= innerHeight - 2 && r.top > innerHeight / 2 && !x.hidden && s.display !== "none" && s.visibility !== "hidden"; }); const haut = Math.min(innerHeight, ...fix.map(x => x.getBoundingClientRect().top)); const der = [...document.querySelectorAll("#app a, #app button, #app p, #app h2, #app .foot, #app footer, #app img")].filter(x => x.getBoundingClientRect().height > 0 && !x.closest(".navbas,#ppRendre") && getComputedStyle(x).position !== "fixed").pop(); return der ? { b: Math.round(der.getBoundingClientRect().bottom), haut: Math.round(haut), el: der.tagName + "." + der.className, t: (der.textContent || "").trim().slice(0, 30) } : null; });
      if (bas && bas.b > bas.haut + 2) res.push({ ecran: e.nom, page: p, etat: "page", f: "caché sous la barre du bas", el: bas.el, t: bas.t + " (" + bas.b + " > " + bas.haut + ")" });
      await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(150);
      await page.screenshot({ path: path.join(OUT, e.nom + p.replace(/\//g, "_") + ".png") });
      /* menus et fenêtres de la page */
      const nb = await page.evaluate(() => [...document.querySelectorAll('[data-act="menu"],[data-act="dd"],[data-act="drawer"],[data-act="bell"],[data-act="apps"],[data-act="me"],[data-act="join"],[data-act="pasmoi"]')].filter(x => x.getBoundingClientRect().width).length);
      for (let i = 0; i < Math.min(nb, 8); i++) {
        const lbl = await page.evaluate(i => { const x = [...document.querySelectorAll('[data-act="menu"],[data-act="dd"],[data-act="drawer"],[data-act="bell"],[data-act="apps"],[data-act="me"],[data-act="join"],[data-act="pasmoi"]')].filter(x => x.getBoundingClientRect().width)[i]; if (!x) return null; const l = x.dataset.act + ":" + (x.dataset.m || x.getAttribute("aria-label") || x.textContent.trim()).slice(0, 25); x.click(); return l; }, i);
        if (!lbl) break; await page.waitForTimeout(450);
        const z = await page.evaluate(() => { const c = ['.modal', '.dd-menu', '.drawer:not([hidden])', '.bellmenu', '.appsmenu', '.ddme .dd-menu', '[role=dialog]', '[role=menu]']; for (const s of c) { const x = [...document.querySelectorAll(s)].find(y => y.getBoundingClientRect().width > 0 && getComputedStyle(y).visibility !== "hidden"); if (x) return s; } return null; });
        if (z) { ajoute(e, p, "ouvert " + lbl, await page.evaluate(mesurer, { tel, zone: z })); ajoute(e, p, "ouvert " + lbl, await axe(z));
          /* la partie ouverte sort-elle de l'écran ? */
          const hors = await page.evaluate(z => { const x = [...document.querySelectorAll(z)].find(y => y.getBoundingClientRect().width > 0); const r = x.getBoundingClientRect(); return r.left < -1 || r.right > innerWidth + 1 || (r.bottom > innerHeight + 1 && getComputedStyle(x).overflowY === "visible" && getComputedStyle(x).position !== "static") ? Math.round(r.left) + "," + Math.round(r.right) + "," + Math.round(r.bottom) + " / " + innerWidth + "×" + innerHeight : null; }, z);
          if (hors) res.push({ ecran: e.nom, page: p, etat: "ouvert " + lbl, f: "menu hors de l'écran", el: z, t: hors });
          if (i < 3) await page.screenshot({ path: path.join(OUT, e.nom + p.replace(/\//g, "_") + "__" + lbl.replace(/[^a-z0-9]+/gi, "-").slice(0, 30) + ".png") });
        }
        await page.keyboard.press("Escape"); await page.waitForTimeout(150);
        await page.evaluate(h => { if (location.hash !== h) location.hash = h; document.querySelectorAll(".modal [data-act=mclose]").forEach(b => b.click()); }, "#" + p);
        await page.mouse.click(2, 300).catch(() => {}); await page.waitForTimeout(250);
        if (await page.evaluate(h => location.hash !== h, "#" + p)) { await page.evaluate(h => { location.hash = h; }, "#" + p); await page.waitForTimeout(700); }
      }
      errs.forEach(x => res.push({ ecran: e.nom, page: p, etat: "page", f: "erreur JS", el: "", t: x.slice(0, 160) }));
    }
    await ctx.close();
  }
  await nav.close(); srv.close();
  process.stdout.write(JSON.stringify(res));
}
/* faux positifs connus (vérifiés à l'œil le 12/11/2026) */
const FAUX_POSITIFS = [
  r => /vh|pp-sr|sr-only/.test(r.el) && r.f === "texte rogné",                       /* textes réservés aux lecteurs d'écran */
  r => /fformule/.test(r.el) && r.f === "texte rogné",                                /* formule : défilable sur ordinateur */
  r => /bellfoot/.test(r.el) && r.f === "chevauchement",                              /* pied de la cloche collé en bas pendant le défilement */
  r => /pointage\.html/.test(r.el) && r.f === "axe color-contrast",                   /* carte en train d'apparaître (animation) */
  r => r.f === "mot coupé" && /@/.test(r.t),
  r => r.f === "texte rogné" && /body > a|cder > a|smitem/.test(r.el),                /* titres très longs limités à 2 lignes (voulu) */
  r => r.f === "chevauchement" && /fcdocs/.test(r.el) && /×[0-9]$/.test(r.t),         /* liens des fiches de révision : < 10 px */
  r => r.f === "chevauchement" && /rtxt ⟷ .*dlbtn/.test(r.el),                        /* bouton Télécharger posé dans la carte (le texte lui laisse la place) */                                          /* adresses e-mail longues sur petit écran */
  r => r.f === "menu hors de l'écran" && /ouvert menu/.test(r.etat),                  /* menu en bas d'une longue page : on y arrive en faisant défiler */
  r => r.f === "chevauchement" && /tpgo|tpautres|telqui|etapecase/.test(r.el) && /^\d+×([0-9]|1[0-9])$/.test(r.t), /* zones de toucher élargies qui se touchent de < 20 px */
];
if (groupe !== "tout") auditGroupe().catch(e => { console.error(e); process.exit(1); });
else {
  const { execFile } = require("child_process");
  const un = g => new Promise(ok => execFile(process.execPath, [__filename, g], { maxBuffer: 1 << 28, env: process.env }, (e, out) => { try { ok(JSON.parse(out.slice(out.indexOf("[")))); } catch (_) { console.error("groupe " + g + " : échec", e || ""); ok([{ f: "erreur de l'audit", el: g, t: String(e).slice(0, 200), ecran: "", page: "", etat: "" }]); } }));
  Promise.all(Object.keys(G).map(un)).then(ls => {
    const res = ls.flat().filter(r => !FAUX_POSITIFS.some(f => f(r)));
    const fam = {};
    for (const r of res) { const k = r.f + " | " + r.el.replace(/\d+/g, "#").slice(0, 90) + " | " + (r.etat === "page" ? "page" : r.etat.split(":")[0]); (fam[k] = fam[k] || new Set()).add(r.ecran + " " + r.page + " " + r.t.slice(0, 50)); }
    const ks = Object.keys(fam).sort((a, b) => fam[b].size - fam[a].size);
    ks.forEach(k => console.log(fam[k].size + "  " + k + "\n      ex. " + [...fam[k]].slice(0, 2).join(" ; ")));
    console.log(ks.length ? "\nRésultat : " + ks.length + " sorte(s) de constat à regarder." : "\nRésultat : aucun constat.");
    process.exit(ks.length ? 1 : 0);
  });
}
