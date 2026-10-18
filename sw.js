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
