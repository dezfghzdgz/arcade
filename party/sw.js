// Service worker Arcade: rozcestník a sólo hry fungují offline. Online hry se načtou z cache, na hraní potřebují síť.
const VERSION = "arcade-v9";
const GAMES = ["zigdash", "merge", "snake", "mines", "bricks", "sudoku", "solitaire", "roll", "tubes", "flow", "splatz", "tower", "front", "doodle", "boom", "fleet", "snakes", "party", "pong"];
const SHELL = ["./", "./hub.css", "./hub.js", "./config.js", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];
const norm = (u) => { const url = new URL(u, self.location.href); url.search = ""; if (url.pathname.endsWith("/index.html")) url.pathname = url.pathname.slice(0, -10); return url.href; };
self.addEventListener("install", (e) => { e.waitUntil((async () => { const c = await caches.open(VERSION); for (const u of SHELL) { try { const r = await fetch(u, { cache: "no-cache" }); if (r.ok) await c.put(norm(u), r); } catch {} } await self.skipWaiting(); })()); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const cacheable = (url) => url.origin === self.location.origin || /fonts\.g|jsdelivr/.test(url.hostname);
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url); if (!cacheable(url)) return;
  const key = norm(url.href);
  e.respondWith((async () => {
    const c = await caches.open(VERSION);
    try { const r = await fetch(e.request); if (r.ok && r.type !== "opaque") c.put(key, r.clone()); return r; }
    catch { const m = await c.match(key); if (m) return m; if (e.request.mode === "navigate") { const dir = await c.match(norm(new URL("./", url).href)); if (dir) return dir; return c.match(norm("./")); } return new Response("", { status: 504 }); }
  })());
});
// předběžné stažení všech her (tlačítko "Uložit hry pro offline")
self.addEventListener("message", async (e) => {
  if (e.data !== "precache") return;
  const c = await caches.open(VERSION); let n = 0;
  for (const g of GAMES) {
    try {
      const r = await fetch(`./${g}/`, { cache: "no-cache" }); if (!r.ok) continue; const html = await r.text(); await c.put(norm(`./${g}/`), new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } })); n++;
      const refs = [...html.matchAll(/(?:src|href)="((?:css|js)\/[^"]+|icon-\d+\.png|manifest\.webmanifest)"/g)].map(m => `./${g}/${m[1]}`);
      await Promise.all(refs.map(async u => { try { const rr = await fetch(u, { cache: "no-cache" }); if (rr.ok) { await c.put(norm(u), rr); n++; } } catch {} }));
    } catch {}
  }
  (await self.clients.matchAll()).forEach(cl => cl.postMessage({ t: "precached", n }));
});
