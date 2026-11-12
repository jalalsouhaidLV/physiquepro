/* PhysiquePro · service worker
   - la page (index.html) : le réseau d'abord, pour avoir toujours la version à jour ; la copie locale si le réseau ne répond pas en 4 s ;
   - les fichiers « versionnés » (app.js?v=…, app.css?v=…, config.js?v=…, logos.js?v=…) : la copie locale d'abord (lot R, 5e évaluation) :
     leur adresse change à chaque mise en ligne, donc une copie gardée est toujours la bonne et le site s'ouvre presque tout de suite ;
   - le reste du site : le réseau d'abord, la copie locale si pas de connexion. */
const CACHE = "pp-v1";   /* 11/11/2026 : partage Android, bibliothèques gardées hors connexion */
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(["./", "./index.html", "./manifest.json", "./icon-192.png"]).catch(() => {}))); });
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
/* « Partager vers PhysiquePro » (Android, étape 31) : les fichiers reçus sont gardés dans le téléphone, puis le site s'ouvre sur #/partage */
function idbPartage(v){
  return new Promise((ok, ko) => { const o = indexedDB.open("pp-telephone", 1); o.onupgradeneeded = () => o.result.createObjectStore("kv");
    o.onsuccess = () => { const t = o.result.transaction("kv", "readwrite"); t.objectStore("kv").put(v, "partage"); t.oncomplete = ok; t.onerror = () => ko(t.error); }; o.onerror = () => ko(o.error); });
}
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "POST" || u.origin !== location.origin || !/\/partage\/?$/.test(u.pathname)) return;
  e.respondWith((async () => {
    try {
      const f = await r.formData(), files = f.getAll("fichiers").filter(x => x && typeof x === "object" && x.size);
      const lien = [f.get("url"), f.get("text")].map(x => String(x || "")).join(" ").match(/https:\/\/\S+/);
      await idbPartage({ files, lien: lien ? lien[0] : "", le: Date.now() });
    } catch (_) {}
    return Response.redirect(new URL("index.html#/partage", self.registration.scope).href, 303);
  })());
});
/* bibliothèques (jsDelivr, versions figées et vérifiées) et polices : gardées pour que le site s'ouvre sans réseau */
const CDN = /^cdn\.jsdelivr\.net$/;   /* les polices sont maintenant dans le dépôt (dossier polices/) */
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || !CDN.test(u.hostname)) return;
  e.respondWith(caches.open("pp-cdn").then(c => c.match(r).then(x => x || fetch(r).then(rep => { if (rep.ok || rep.type === "opaque") c.put(r, rep.clone()); return rep; }))));
});
const garder = (r, rep) => { if (rep.ok) { const copie = rep.clone(); caches.open(CACHE).then(c => c.put(r, copie)); } return rep; };
/* une seule version gardée par fichier : les anciennes (?v= d'avant) sont effacées */
const ranger = (c, u) => c.keys().then(L => Promise.all(L.filter(k => { const x = new URL(k.url); return x.pathname === u.pathname && x.search !== u.search; }).map(k => c.delete(k))));
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin) return;   // Supabase, Microsoft, etc. : jamais mis en cache
  if (u.searchParams.has("v") && /\.(js|css)$/.test(u.pathname)) {
    e.respondWith(caches.open(CACHE).then(c => c.match(r).then(x => x || fetch(r).then(rep => { if (rep.ok) { c.put(r, rep.clone()); ranger(c, u); } return rep; }))));
    return;
  }
  if (r.mode === "navigate") {
    e.respondWith(new Promise(ok => {
      let fini = false; const secours = () => caches.match(r).then(x => x || caches.match("./index.html")).then(x => x || fetch(r));
      const t = setTimeout(() => secours().then(x => { if (!fini) { fini = true; ok(x); } }), 4000);
      fetch(r).then(rep => { garder(r, rep); if (!fini) { fini = true; clearTimeout(t); ok(rep); } })
        .catch(() => { clearTimeout(t); secours().then(x => { if (!fini) { fini = true; ok(x); } }); });
    }));
    return;
  }
  e.respondWith(fetch(r).then(rep => garder(r, rep)).catch(() => caches.match(r).then(x => x || caches.match("./index.html"))));
});

/* notifications push (étape 37) : note rendue par le professeur, etc. */
self.addEventListener("push", e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (_) { d = { texte: e.data ? e.data.text() : "" }; }
  /* message urgent d'un élève (étape 48) : la notification reste affichée jusqu'à ce que le prof la touche, et vibre fort */
  const fort = d.insistant === true;
  /* une seule alerte par message : si la notification de ce message est déjà affichée (2e envoi, autre source), elle ne sonne pas une 2e fois */
  e.waitUntil(self.registration.getNotifications({ tag: d.tag || "pp" }).catch(() => []).then(L => self.registration.showNotification(d.titre || "PhysiquePro", { body: d.texte || "", icon: "icon-192.png", badge: "icon-192.png", tag: d.tag || "pp", renotify: !(L && L.length), silent: false,
    requireInteraction: fort, vibrate: fort ? [400, 150, 400, 150, 600] : [200, 100, 200], data: { url: d.url || "./" } })));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const cible = new URL((e.notification.data && e.notification.data.url) || "./", self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(L => {
    const w = L.find(c => c.url.startsWith(self.registration.scope));
    if (w) return w.focus().then(c => (c || w).navigate ? (c || w).navigate(cible) : null).catch(() => self.clients.openWindow(cible));
    return self.clients.openWindow(cible);
  }));
});
