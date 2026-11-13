/* Mes Recettes – service worker : l'appli fonctionne hors connexion.
   Les fichiers de l'appli sont servis depuis le cache, puis mis à jour en arrière-plan
   (la nouvelle version s'applique au lancement suivant). Les recettes, elles, sont
   stockées sur le téléphone (IndexedDB) et ne passent jamais par Internet. */
const CACHE = "mesrecettes-v4";  // ne touche qu'aux caches de cette appli (plusieurs applis peuvent partager github.io)
const FICHIERS = ["./", "index.html", "recettes_initiales.js", "manifest.webmanifest",
                  "apple-touch-icon.png", "icone-192.png", "icone-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("mesrecettes-") && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const enCache = await c.match(req, {ignoreSearch: true}) ||
                    (req.mode === "navigate" ? await c.match("index.html") : null);
    const reseau = fetch(req).then(r => { if (r && r.ok) c.put(req, r.clone()); return r; }).catch(() => null);
    return enCache || (await reseau) || new Response("Hors connexion", {status: 503});
  }));
});
