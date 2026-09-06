(() => {
  const { $, get, set, L, beep } = Arc;
  Arc.texts({ en: { level: "Level", moves: "Moves", undo: "Undo", reset: "Restart", skip: "Skip (ad)", hint: "Swipe or arrow keys. The ball rolls until it hits a wall. Paint every tile.", done: "Painted!", next: "Next level", movesIn: (m, b) => `${m} moves · best possible ${b}`, adTitle: "Skip level for an ad", adNote: "Watch a short ad to skip. (Simulated on web; real rewarded ad in the app.)", diff: (n) => `${n} tiles` }, cs: { level: "Level", moves: "Tahy", undo: "Zpět", reset: "Znovu", skip: "Přeskočit (reklama)", hint: "Táhni prstem nebo šipky. Kulička jede, dokud nenarazí. Obarvi všechna políčka.", done: "Vybarveno!", next: "Další level", movesIn: (m, b) => `${m} tahů · nejlíp to jde na ${b}`, adTitle: "Přeskočit level za reklamu", adNote: "Krátká reklama a level přeskočíš. (Na webu simulace, v appce skutečná odměněná reklama.)", diff: (n) => `${n} políček` } });
  const cv = $("cv"), ctx = cv.getContext("2d"), S = cv.width;
  let level = get("rl_level", 1), lvl, ball, painted, moves, hist, anim = null, best, solved = get("rl_solved", 0);
  const mulberry = (a) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const COLORS = ["#FF5E7E", "#5EE1D0", "#FFCF5A", "#B6FF5A", "#FF9A3C", "#B98CFF", "#6FC3FF", "#FF7AD9"];
  // ---------- generátor: náhodný blob + kontrola řešitelnosti hledáním (stav = pozice + maska)
  function gen(seed, n) {
    const rand = mulberry(seed), W = 11;
    for (let attempt = 0; attempt < 80; attempt++) {
      const cells = new Set(); let x = 5, y = 5, d = [1, 0]; cells.add(y * W + x);
      while (cells.size < n) { if (rand() < 0.45) d = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(rand() * 4)]; const nx = x + d[0], ny = y + d[1]; if (nx < 1 || ny < 1 || nx >= W - 1 || ny >= W - 1) { d = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(rand() * 4)]; continue; } x = nx; y = ny; cells.add(y * W + x); }
      // příliš kompaktní bloby (plný obdélník) zahodit – chceme chodby
      const xs = [...cells].map(c => c % W), ys = [...cells].map(c => (c / W) | 0); const bw = Math.max(...xs) - Math.min(...xs) + 1, bh = Math.max(...ys) - Math.min(...ys) + 1; if (cells.size > 8 && cells.size / (bw * bh) > 0.72) continue;
      const list = [...cells]; const idx = new Map(list.map((c, i) => [c, i]));
      const slide = (c, d) => { let cx = c % W, cy = (c / W) | 0, path = []; while (true) { const nx = cx + d[0], ny = cy + d[1]; if (nx < 0 || ny < 0 || nx >= W || ny >= W || !cells.has(ny * W + nx)) break; cx = nx; cy = ny; path.push(idx.get(cy * W + cx)); } return path; };
      const start = list[Math.floor(rand() * list.length)]; const full = (1 << list.length) - 1;
      // BFS s omezením
      const seen = new Map(); const q = [[start, 1 << idx.get(start), 0]]; seen.set(start + ":" + (1 << idx.get(start)), 0); let ok = -1, steps = 0;
      while (q.length && steps++ < 40000) { const [c, m, d] = q.shift(); if (m === full) { ok = d; break; } for (const dir of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const p = slide(c, dir); if (!p.length) continue; let nm = m; for (const i of p) nm |= 1 << i; const nc = list[p[p.length - 1]]; const k = nc + ":" + nm; if (seen.has(k)) continue; seen.set(k, d + 1); q.push([nc, nm, d + 1]); } }
      if (ok >= 3) return { W, cells, list, idx, start, best: ok, slide };
    }
    return null;
  }
  function load() {
    const n = Math.min(26, 6 + Math.floor(level * 0.8) + (level % 3 === 0 ? 1 : 0));
    let seed = level * 7919 + 13; do { lvl = gen(seed, n); seed++; } while (!lvl);
    ball = lvl.start; painted = new Set([ball]); moves = 0; hist = []; best = lvl.best; anim = null;
    $("level").textContent = level; $("moves").textContent = 0; $("diff").textContent = L("diff", lvl.list.length); $("over").classList.add("hidden");
  }
  let squash = { t: 0, dir: [1, 0] }, shake = 0, particles = [], dir = 2, blink = 0;
  function move(d) {
    if (anim) return; const dv = [[-1, 0], [0, -1], [1, 0], [0, 1]][d]; dir = d; const path = lvl.slide(ball, dv);
    if (!path.length) { squash = { t: 0.18, dir: dv, small: true }; beep(220, 0.05, "square", 0.04); return; }   // do zdi hned: jen bouchne
    hist.push({ ball, painted: new Set(painted) }); if (hist.length > 30) hist.shift();
    const cellsPath = path.map(i => lvl.list[i]);
    anim = { from: ball, path: cellsPath, t: 0, dv, len: cellsPath.length }; beep(440 + Math.min(200, cellsPath.length * 30), 0.05, "sine", 0.05);
    ball = cellsPath[cellsPath.length - 1]; moves++; $("moves").textContent = moves;
  }
  function finishAnim() { for (const c of anim.path) painted.add(c); squash = { t: 0.22, dir: anim.dv }; shake = Math.min(0.8, 0.2 + anim.len * 0.08); anim = null; beep(300, 0.07, "triangle", 0.09); if (painted.size === lvl.list.length) { winT = 0; win(); } }
  async function win() { beep(880, 0.25); setTimeout(() => beep(1320, 0.3), 100); await new Promise(r => setTimeout(r, 700)); solved = Math.max(solved, level); set("rl_solved", solved); $("over").classList.remove("hidden"); $("over-title").textContent = L("done"); $("over-score").textContent = "★".repeat(moves <= best ? 3 : moves <= best + 2 ? 2 : 1); $("over-rank").textContent = L("movesIn", moves, best); const r = await Arc.submit("roll", solved); if (r) $("over-rank").textContent += " · " + L("rank", r); }
  function next() { level++; set("rl_level", level); load(); Arc.progress.save("roll", { level, solved }); }
  $("btn-next").onclick = next; $("btn-reset").onclick = load;
  $("btn-undo").onclick = () => { if (anim) return; const h = hist.pop(); if (!h) return; ball = h.ball; painted = h.painted; moves++; $("moves").textContent = moves; };
  $("btn-skip").onclick = () => { const ov = document.createElement("div"); ov.className = "overlay"; ov.innerHTML = `<div class="card"><h2>${L("adTitle")}</h2><div class="big-num" id="ad-n">3</div><div class="dim">${L("adNote")}</div><button id="ad-x">${L("close")}</button></div>`; document.body.appendChild(ov); let n = 3; const iv = setInterval(() => { n--; ov.querySelector("#ad-n").textContent = n; if (n <= 0) { clearInterval(iv); ov.remove(); next(); } }, 1000); ov.querySelector("#ad-x").onclick = () => { clearInterval(iv); ov.remove(); }; };
  $("btn-lb").onclick = () => Arc.openLb("roll", (s) => "L" + s);
  // ---------- kreslení (izometricky vypadající dlaždice: horní plocha + boční hrana)
  let last = 0, winT = 0;
  function draw(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, S, S);
    if (shake > 0) { ctx.translate((Math.random() - 0.5) * shake * 5, (Math.random() - 0.5) * shake * 5); shake = Math.max(0, shake - dt * 6); }
    const W = lvl.W, col = COLORS[(level - 1) % COLORS.length];
    if (!lvl.bb) { const xs = lvl.list.map(c => c % W), ys = lvl.list.map(c => (c / W) | 0); lvl.bb = { x0: Math.min(...xs), y0: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs) + 1, h: Math.max(...ys) - Math.min(...ys) + 1 }; }
    const cs = Math.min(S / (lvl.bb.w + 1), S / (lvl.bb.h + 1), 80), ox = (S - lvl.bb.w * cs) / 2, oy = (S - lvl.bb.h * cs) / 2;
    const pos = (c) => ({ x: ox + ((c % W) - lvl.bb.x0) * cs, y: oy + (((c / W) | 0) - lvl.bb.y0) * cs });
    // pohyb: konstantně rychle (22 polí/s), poslední kousek s dojezdem
    let bx, by, k = 0;
    if (anim) { anim.t += dt * 22; k = Math.min(anim.len, anim.t); const eased = k >= anim.len - 0.6 ? anim.len - 0.6 + (k - (anim.len - 0.6)) * 0.85 : k; const prev = eased < 1 ? anim.from : anim.path[Math.floor(eased) - 1]; const nxt = anim.path[Math.min(anim.len - 1, Math.floor(eased))]; const f = eased - Math.floor(eased); const a = pos(prev), b = pos(nxt); bx = a.x + (b.x - a.x) * f; by = a.y + (b.y - a.y) * f;
      if (Math.random() < 0.8) particles.push({ x: bx + cs / 2 + (Math.random() - 0.5) * cs * 0.4, y: by + cs * 0.45 + (Math.random() - 0.5) * cs * 0.4, vx: -anim.dv[0] * 60 + (Math.random() - 0.5) * 40, vy: -anim.dv[1] * 60 + (Math.random() - 0.5) * 40, life: 0.3, c: "#fff" });
      if (k >= anim.len) { const e = pos(anim.path[anim.len - 1]); bx = e.x; by = e.y; finishAnim(); } }
    else { const p = pos(ball); bx = p.x; by = p.y; }
    // stěny: tmavá hrana kolem tvaru
    ctx.fillStyle = "#0B0716"; for (const c of lvl.list) { const p = pos(c); ctx.fillRect(p.x - 6, p.y - 6, cs + 12, cs + 14); }
    // dlaždice
    const done = painted.size === lvl.list.length;
    for (const c of lvl.list) { const p = pos(c); const isP = painted.has(c) || (anim && anim.path.includes(c) && animProgressCovers(c)); const pulse = done ? 0.5 + 0.5 * Math.sin(winT * 6 + (c % W) * 0.7 + ((c / W) | 0) * 0.5) : 0; ctx.fillStyle = isP ? col : "#7C86A4"; ctx.fillRect(p.x, p.y, cs, cs); ctx.fillStyle = "rgba(0,0,0,.08)"; ctx.fillRect(p.x, p.y + cs - 3, cs, 3); ctx.strokeStyle = "rgba(0,0,0,.12)"; ctx.lineWidth = 1; ctx.strokeRect(p.x + 0.5, p.y + 0.5, cs - 1, cs - 1); if (pulse) { ctx.fillStyle = `rgba(255,255,255,${pulse * 0.35})`; ctx.fillRect(p.x, p.y, cs, cs); } }
    if (done) winT += dt;
    for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; ctx.globalAlpha = Math.max(0, p.life * 2.5); ctx.fillStyle = p.c; ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3); } ctx.globalAlpha = 1; particles = particles.filter(p => p.life > 0);
    // pruh za kuličkou (motion blur)
    const r = cs * 0.3, cx = bx + cs / 2, cy = by + cs * 0.45;
    if (anim) { const len = Math.min(cs * 2.2, cs * 0.5 + k * cs * 0.4); const g = ctx.createLinearGradient(cx, cy, cx - anim.dv[0] * len, cy - anim.dv[1] * len); g.addColorStop(0, "rgba(255,255,255,.55)"); g.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx - anim.dv[0] * len / 2, cy - anim.dv[1] * len / 2, anim.dv[0] ? len / 2 : r * 0.9, anim.dv[1] ? len / 2 : r * 0.9, 0, 0, 6.28); ctx.fill(); }
    ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.beginPath(); ctx.ellipse(cx, by + cs * 0.7, r * 0.9, r * 0.35, 0, 0, 6.28); ctx.fill();
    ctx.save(); ctx.translate(cx, cy);
    let sx = 1, sy = 1;
    if (squash.t > 0) { squash.t -= dt; const kk = Math.sin(squash.t / 0.22 * Math.PI) * (squash.small ? 0.15 : 0.3); if (squash.dir[0]) { sx = 1 - kk; sy = 1 + kk; } else { sy = 1 - kk; sx = 1 + kk; } }
    ctx.scale(sx, sy);
    const g2 = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r); g2.addColorStop(0, "#FFFFFF"); g2.addColorStop(0.6, "#E8E6F0"); g2.addColorStop(1, "#A9A6BD");
    ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.28); ctx.fill();
    ctx.restore();
    requestAnimationFrame(draw);
  }
  function animProgressCovers(c) { const i = anim.path.indexOf(c); return i >= 0 && anim.t >= i + 1; }
  window.addEventListener("keydown", (e) => { const d = { ArrowLeft: 0, ArrowUp: 1, ArrowRight: 2, ArrowDown: 3, a: 0, w: 1, d: 2, s: 3 }[e.key]; if (d !== undefined) { e.preventDefault(); move(d); } });
  let sw = null; cv.addEventListener("pointerdown", (e) => { sw = { x: e.clientX, y: e.clientY }; }); window.addEventListener("pointerup", (e) => { if (!sw) return; const dx = e.clientX - sw.x, dy = e.clientY - sw.y; sw = null; if (Math.hypot(dx, dy) < 20) return; move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 2 : 0) : (dy > 0 ? 3 : 1)); });
  Arc.wire(); Arc.applyLang(); load(); requestAnimationFrame(draw);
  Arc.progress.load("roll", { level, solved }).then(p => { if (p.level > level) { level = p.level; set("rl_level", level); load(); } if (p.solved > solved) { solved = p.solved; set("rl_solved", solved); } });
})();
