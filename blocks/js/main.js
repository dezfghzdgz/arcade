(() => {
  const { $, get, set, L, beep } = Arc;
  Arc.texts({ en: { level: "Level", hold: "Hold", next: "Next", hint: "← → move · ↑ rotate · ↓ soft drop · space hard drop · C hold. Swipe on touch.", gameOver: "Stacked out", lines: (n) => `${n} lines` }, cs: { level: "Level", hold: "Drž", next: "Další", hint: "← → posun · ↑ otočit · ↓ rychleji · mezerník shodit · C držet. Na dotyk švihy.", gameOver: "Přeplněno", lines: (n) => `${n} řad` } });
  const W = 10, Hh = 20, cv = $("cv"), ctx = cv.getContext("2d"), CS = cv.width / W, nc = $("next"), nx = nc.getContext("2d"), hc = $("hold"), hx = hc.getContext("2d");
  // tvary jako seznam buněk; barvy v paletě Arcade
  const SHAPES = { I: [[0, 1], [1, 1], [2, 1], [3, 1]], O: [[1, 0], [2, 0], [1, 1], [2, 1]], T: [[1, 0], [0, 1], [1, 1], [2, 1]], S: [[1, 0], [2, 0], [0, 1], [1, 1]], Z: [[0, 0], [1, 0], [1, 1], [2, 1]], J: [[0, 0], [0, 1], [1, 1], [2, 1]], L: [[2, 0], [0, 1], [1, 1], [2, 1]] };
  const COL = { I: "#5EE1D0", O: "#FFCF5A", T: "#8A5CFF", S: "#B6FF5A", Z: "#FF5E7E", J: "#6FC3FF", L: "#FF9A3C" };
  let grid, cur, queue, hold, canHold, score, lines, level, best = get("bl_best", 0), over, dropT, last = 0, particles = [], lockT = 0, flash = [];
  const bag = () => Object.keys(SHAPES).sort(() => Math.random() - 0.5);
  function piece(t) { return { t, cells: SHAPES[t].map(c => c.slice()), x: 3, y: t === "I" ? -1 : 0 }; }
  function reset() { grid = Array.from({ length: Hh }, () => Array(W).fill(null)); queue = [...bag(), ...bag()]; hold = null; canHold = true; score = 0; lines = 0; level = 1; over = false; dropT = 0; particles = []; flash = []; next(); $("over").classList.add("hidden"); hud(); }
  function next() { if (queue.length < 7) queue.push(...bag()); cur = piece(queue.shift()); canHold = true; if (collides(cur, 0, 0, cur.cells)) gameOver(); drawSide(); }
  const collides = (p, dx, dy, cells) => cells.some(([cx, cy]) => { const x = p.x + cx + dx, y = p.y + cy + dy; return x < 0 || x >= W || y >= Hh || (y >= 0 && grid[y][x]); });
  function rotated(cells, t) { if (t === "O") return cells; const n = t === "I" ? 4 : 3; return cells.map(([x, y]) => [n - 1 - y, x]); }
  function rotate() { if (over) return; const rc = rotated(cur.cells, cur.t); for (const k of [0, -1, 1, -2, 2]) if (!collides(cur, k, 0, rc)) { cur.cells = rc; cur.x += k; beep(520, 0.03, "sine", 0.04); return; } }
  function move(d) { if (over) return; if (!collides(cur, d, 0, cur.cells)) { cur.x += d; beep(400, 0.02, "sine", 0.03); } }
  function soft() { if (over) return; if (!collides(cur, 0, 1, cur.cells)) { cur.y++; score += 1; } else lock(); }
  function hard() { if (over) return; let n = 0; while (!collides(cur, 0, 1, cur.cells)) { cur.y++; n++; } score += n * 2; lock(); }
  function doHold() { if (over || !canHold) return; const t = cur.t; if (hold) { cur = piece(hold); } else { next(); } hold = t; canHold = false; beep(600, 0.05); drawSide(); }
  function lock() {
    for (const [cx, cy] of cur.cells) { const y = cur.y + cy; if (y < 0) { gameOver(); return; } grid[y][cur.x + cx] = COL[cur.t]; }
    beep(300, 0.05, "square", 0.05);
    const full = []; for (let y = 0; y < Hh; y++) if (grid[y].every(Boolean)) full.push(y);
    if (full.length) { for (const y of full) { for (let x = 0; x < W; x++) burst(x, y, grid[y][x]); flash.push({ y, t: 0.25 }); } grid = grid.filter((_, y) => !full.includes(y)); while (grid.length < Hh) grid.unshift(Array(W).fill(null)); lines += full.length; score += [0, 100, 300, 500, 800][full.length] * level; level = 1 + Math.floor(lines / 10); beep(700 + full.length * 100, 0.2); if (full.length === 4) particles.push({ text: "BLOCKS!", life: 1.2 }); }
    if (score > best) { best = score; set("bl_best", best); } hud(); next();
  }
  function burst(x, y, c) { for (let i = 0; i < 4; i++) particles.push({ x: (x + 0.5) * CS, y: (y + 0.5) * CS, vx: (Math.random() - 0.5) * 200, vy: -Math.random() * 150, c, life: 0.5 }); }
  function hud() { $("score").textContent = score; $("level").textContent = level; $("best").textContent = best; }
  async function gameOver() { over = true; beep(180, 0.4, "sawtooth", 0.15); if (window.Meta) Meta.finish("blocks"); setTimeout(async () => { $("over").classList.remove("hidden"); $("over-title").textContent = L("gameOver"); $("over-score").textContent = score; $("over-rank").textContent = L("lines", lines); const r = await Arc.submit("blocks", score); if (r) $("over-rank").textContent += " · " + L("rank", r); }, 500); }
  function cell(c, x, y, s, col, alpha = 1) { c.globalAlpha = alpha; c.fillStyle = col; c.fillRect(x * s + 1, y * s + 1, s - 2, s - 2); c.fillStyle = "rgba(255,255,255,.25)"; c.fillRect(x * s + 1, y * s + 1, s - 2, 3); c.fillStyle = "rgba(0,0,0,.2)"; c.fillRect(x * s + 1, y * s + s - 4, s - 2, 3); c.globalAlpha = 1; }
  function drawSide() { nx.clearRect(0, 0, nc.width, nc.height); queue.slice(0, 3).forEach((t, i) => SHAPES[t].forEach(([x, y]) => cell(nx, x + (t === "I" || t === "O" ? 0 : 0.5), y + i * 3 + 0.5, 30, COL[t]))); hx.clearRect(0, 0, hc.width, hc.height); if (hold) SHAPES[hold].forEach(([x, y]) => cell(hx, x + (hold === "I" || hold === "O" ? 0 : 0.5), y + 1, 30, COL[hold], canHold ? 1 : 0.4)); }
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!over) { dropT += dt; const iv = Math.max(0.08, 0.8 * Math.pow(0.85, level - 1)); if (dropT >= iv) { dropT = 0; if (!collides(cur, 0, 1, cur.cells)) cur.y++; else { lockT += iv; if (lockT >= 0.3) { lockT = 0; lock(); } } } }
    ctx.clearRect(0, 0, cv.width, cv.height); ctx.fillStyle = "rgba(255,255,255,.03)"; for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) if ((x + y) & 1) ctx.fillRect(x * CS, y * CS, CS, CS);
    for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) if (grid[y][x]) cell(ctx, x, y, CS, grid[y][x]);
    if (!over && cur) { let gy = 0; while (!collides(cur, 0, gy + 1, cur.cells)) gy++; for (const [cx, cy] of cur.cells) if (cur.y + cy + gy >= 0) cell(ctx, cur.x + cx, cur.y + cy + gy, CS, COL[cur.t], 0.18); for (const [cx, cy] of cur.cells) if (cur.y + cy >= 0) cell(ctx, cur.x + cx, cur.y + cy, CS, COL[cur.t]); }
    for (const f of flash) { f.t -= dt; ctx.fillStyle = `rgba(255,255,255,${Math.max(0, f.t * 3)})`; ctx.fillRect(0, f.y * CS, cv.width, CS); } flash = flash.filter(f => f.t > 0);
    for (const p of particles) { p.life -= dt; if (p.text) { ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = "#FFCF5A"; ctx.font = "900 30px Nunito, sans-serif"; ctx.textAlign = "center"; ctx.fillText(p.text, cv.width / 2, cv.height / 2); } else { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 400 * dt; ctx.globalAlpha = Math.max(0, p.life * 2); ctx.fillStyle = p.c; ctx.fillRect(p.x - 2, p.y - 2, 4, 4); } } ctx.globalAlpha = 1; particles = particles.filter(p => p.life > 0);
    requestAnimationFrame(loop);
  }
  window.addEventListener("keydown", (e) => { if (e.target.tagName === "INPUT") return; const k = e.key; if (k === "ArrowLeft") move(-1); else if (k === "ArrowRight") move(1); else if (k === "ArrowUp" || k === "x") rotate(); else if (k === "ArrowDown") soft(); else if (k === " ") { e.preventDefault(); if (over) reset(); else hard(); } else if (k === "c" || k === "Shift") doHold(); else return; e.preventDefault(); });
  document.querySelectorAll(".pad button").forEach(b => b.addEventListener("pointerdown", (e) => { e.preventDefault(); ({ left: () => move(-1), right: () => move(1), rot: rotate, down: soft, drop: hard, hold: doHold })[b.dataset.k](); }));
  let sw = null; cv.addEventListener("pointerdown", (e) => { sw = { x: e.clientX, y: e.clientY, t: Date.now(), moved: false }; });
  cv.addEventListener("pointermove", (e) => { if (!sw) return; const dx = e.clientX - sw.x; const r = cv.getBoundingClientRect(); const step = r.width / W; if (Math.abs(dx) >= step) { move(Math.sign(dx)); sw.x += Math.sign(dx) * step; sw.moved = true; } });
  window.addEventListener("pointerup", (e) => { if (!sw) return; const dy = e.clientY - sw.y; if (!sw.moved && Math.abs(dy) < 20 && Date.now() - sw.t < 300) rotate(); else if (dy > 80) hard(); else if (dy > 30) soft(); sw = null; });
  $("btn-again").onclick = reset; $("btn-lb").onclick = () => Arc.openLb("blocks");
  Arc.wire(); Arc.applyLang(); reset(); requestAnimationFrame(loop);
})();
