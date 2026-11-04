/* =====================================================================
   PhysiquePro · petit serveur local pour les tests
   ---------------------------------------------------------------------
   Sert les fichiers du dépôt. La page d'accueil (/ ou /index.html) est
   une COPIE d'index.html, transformée à la volée :
     - attributs integrity et crossorigin retirés ;
     - supabase-js remplacé par sources/tests/faux-supabase.js ;
     - msal-browser remplacé par sources/tests/faux-msal.js.
   Le vrai index.html n'est jamais modifié.

   Utilisation seule (pour regarder le site avec les fausses données) :
     node sources/tests/serveur.js
   puis ouvrir http://localhost:8123/?role=eleve (ou ?role=prof, ?role=visiteur)
   ===================================================================== */
"use strict";
const http = require("http"), fs = require("fs"), path = require("path");

const RACINE = path.resolve(__dirname, "..", "..");
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json",
  ".png": "image/png", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".webmanifest": "application/manifest+json", ".txt": "text/plain; charset=utf-8" };

function indexDeTest() {
  let h = fs.readFileSync(path.join(RACINE, "index.html"), "utf8");
  const avant = h;
  h = h.replace(/\s+integrity="[^"]*"/g, "").replace(/\s+crossorigin(="[^"]*")?/g, "");
  h = h.replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js[^"]*"><\/script>/, '<script src="sources/tests/faux-supabase.js"></script>');
  h = h.replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@azure\/msal-browser[^"]*"><\/script>/, '<script src="sources/tests/faux-msal.js"></script>');
  if (!h.includes("faux-supabase.js") || !h.includes("faux-msal.js")) throw new Error("index.html : balises supabase-js ou msal-browser introuvables, le bouchon ne peut pas être branché");
  if (h === avant) throw new Error("index.html n'a pas été transformé");
  return h;
}

function demarrer(port) {
  const serveur = http.createServer((req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      let p = decodeURIComponent(url.pathname);
      if (p === "/" || p === "/index.html") { res.writeHead(200, { "Content-Type": TYPES[".html"], "Cache-Control": "no-store" }); res.end(indexDeTest()); return; }
      const f = path.normalize(path.join(RACINE, p));
      if (!f.startsWith(RACINE + path.sep) || !fs.existsSync(f) || !fs.statSync(f).isFile()) { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); res.end("introuvable : " + p); return; }
      res.writeHead(200, { "Content-Type": TYPES[path.extname(f).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-store" });
      fs.createReadStream(f).pipe(res);
    } catch (e) { res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" }); res.end(String(e.message || e)); }
  });
  return new Promise((ok, ko) => { serveur.once("error", ko); serveur.listen(port || 0, "127.0.0.1", () => ok(serveur)); });
}

module.exports = { demarrer, indexDeTest };

if (require.main === module) {
  const port = Number(process.argv[2]) || 8123;
  demarrer(port).then(() => console.log("PhysiquePro (données fictives) : http://localhost:" + port + "/?role=eleve  |  ?role=prof  |  ?role=visiteur"));
}
