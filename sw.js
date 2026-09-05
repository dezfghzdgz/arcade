// Service worker Arcade: sólo hry a rozcestník fungují offline. Online hry (Splatz, Tower, Front, Doodle) potřebují síť na hraní, ale načtou se z cache.
const VERSION = "arcade-v1";
const SHELL = ["./", "./index.html", "./hub.css", "./hub.js", "./config.js", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];
const GAMES = ["zigdash", "merge", "snake", "mines", "bricks", "sudoku", "splatz", "tower", "front", "doodle", "boom"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
// síť první, cache jako záloha; vše, co projde, se ukládá (hry se tak uloží po prvním otevření)
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin && !url.hostname.includes("fonts.g") && !url.hostname.includes("jsdelivr")) return;
  e.respondWith(fetch(e.request).then(r => { if (r.ok && (url.origin === location.origin || url.hostname.includes("jsdelivr"))) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); } return r; }).catch(() => caches.match(e.request).then(m => m || (e.request.mode === "navigate" ? caches.match("./index.html") : undefined))));
});
// předběžné stažení všech her na vyžádání (tlačítko "stáhnout pro offline")
self.addEventListener("message", async (e) => {
  if (e.data !== "precache") return;
  const c = await caches.open(VERSION);
  for (const g of GAMES) { try { const idx = await fetch(`./${g}/index.html`); if (!idx.ok) continue; const html = await idx.text(); await c.put(`./${g}/index.html`, new Response(html, { headers: { "Content-Type": "text/html" } })); const refs = [...html.matchAll(/(?:src|href)="((?:css|js)\/[^"]+|icon-\d+\.png|manifest\.webmanifest)"/g)].map(m => `./${g}/${m[1]}`); await Promise.all(refs.map(u => fetch(u).then(r => r.ok && c.put(u, r)).catch(() => {}))); } catch {} }
  const clients = await self.clients.matchAll(); clients.forEach(cl => cl.postMessage("precached"));
});
