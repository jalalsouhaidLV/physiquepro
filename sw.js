/* PhysiquePro · service worker : le réseau d'abord (toujours la version à jour), la copie locale si pas de connexion */
const CACHE = "pp-v1";
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(["./", "./index.html", "./manifest.json", "./icon-192.png"]).catch(() => {}))); });
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin) return;   // Supabase, Microsoft, etc. : jamais mis en cache
  e.respondWith(fetch(r).then(rep => { if (rep.ok) { const copie = rep.clone(); caches.open(CACHE).then(c => c.put(r, copie)); } return rep; })
    .catch(() => caches.match(r).then(x => x || caches.match("./index.html"))));
});

/* notifications push (étape 37) : note rendue par le professeur, etc. */
self.addEventListener("push", e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (_) { d = { texte: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.titre || "PhysiquePro", { body: d.texte || "", icon: "icon-192.png", badge: "icon-192.png", tag: d.tag || "pp", renotify: true, data: { url: d.url || "./" } }));
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
