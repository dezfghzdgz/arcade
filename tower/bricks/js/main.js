(() => {
  const { $, get, set, L, beep } = Arc;
  Arc.texts({ en: { level: "Level", lives: "Lives", hint: "Drag or move the mouse. Tap to launch.", gameOver: "Game over", levelUp: (n) => `Level ${n}!`, continueLv: (n) => `Continue from level ${n}` }, cs: { level: "Level", lives: "Životy", hint: "Táhni prstem nebo myší. Ťuknutím vystřel.", gameOver: "Konec hry", levelUp: (n) => `Level ${n}!`, continueLv: (n) => `Pokračovat od levelu ${n}` } });
  const cv = $("cv"), ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
  const COLORS = ["#FF5E7E", "#FF9A3C", "#FFCF5A", "#B6FF5A", "#5EE1D0", "#6FC3FF", "#B98CFF", "#FF7AD9"];
  let paddle, balls, bricks, drops, lasers, score, lives, level, running, over, last = 0, particles = [], shake = 0, wideT = 0, laserT = 0, laserCd = 0, popups = [];
  let maxLevel = get("br_max", 1);
  function reset(startLevel = 1) { score = 0; lives = 3; level = startLevel; over = false; newLevel(); hud(); $("over").classList.add("hidden"); }
  const PATTERNS = [
    (r, c, R, C) => true,                                            // plná stěna
    (r, c, R, C) => (r + c) % 2 === 0,                               // šachovnice
    (r, c, R, C) => Math.abs(c - (C - 1) / 2) <= r * 0.7,           // pyramida
    (r, c, R, C) => Math.abs(c - (C - 1) / 2) + Math.abs(r - R / 2) <= R / 2 + 1,   // kosočtverec
    (r, c, R, C) => r % 2 === 0 || c % 3 === 0,                      // mřížka
    (r, c, R, C) => !(r > 1 && r < R - 2 && c > 1 && c < C - 2),     // rám
  ];
  function newLevel() {
    paddle = { x: W / 2, w: Math.max(56, 90 - (level - 1) * 4), h: 14 }; balls = [{ x: W / 2, y: H - 60, vx: 0, vy: 0, stuck: true }]; drops = []; lasers = []; running = false; wideT = 0; laserT = 0; smallT = 0;
    bricks = []; const rows = Math.min(10, 4 + level), cols = 9, bw = (W - 20) / cols, bh = 20, pat = PATTERNS[(level - 1) % PATTERNS.length];
    const rnd = mulberry(level * 7919);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (!pat(r, c, rows, cols)) continue;
      const roll = rnd(); let kind = "n", hp = 1;
      if (level > 1 && roll < 0.05 + level * 0.008) { kind = "steel"; hp = 99; }
      else if (level > 2 && roll < 0.12 + level * 0.01) { kind = "bomb"; }
      else if (roll < 0.16 + level * 0.01) { kind = "gold"; }
      else if (level > 2 && r < 2 + level / 3 && rnd() < 0.5) hp = 2;
      bricks.push({ x: 10 + c * bw, y: 60 + r * (bh + 5), w: bw - 4, h: bh, hp, kind, c: kind === "steel" ? "#7A7A8C" : kind === "bomb" ? "#2B2440" : kind === "gold" ? "#FFCF5A" : COLORS[r % COLORS.length] });
    }
  }
  const mulberry = (a) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  let smallT = 0;
  function hud() { $("score").textContent = score; $("level").textContent = level; $("lives").textContent = "❤".repeat(lives); }
  const ballSpeed = () => 360 + level * 32;
  function launch() { for (const b of balls) if (b.stuck) { b.stuck = false; const a = -Math.PI / 2 + (Math.random() - 0.5) * 0.6; const sp = ballSpeed(); b.vx = Math.cos(a) * sp; b.vy = Math.sin(a) * sp; } running = true; }
  function step(dt) {
    if (!running) { for (const b of balls) if (b.stuck) b.x = paddle.x; return; }
    wideT = Math.max(0, wideT - dt); laserT = Math.max(0, laserT - dt); laserCd = Math.max(0, laserCd - dt); smallT = Math.max(0, smallT - dt);
    const base = Math.max(56, 90 - (level - 1) * 4); paddle.w = wideT > 0 ? base + 50 : smallT > 0 ? base - 24 : base;
    if (laserT > 0 && laserCd <= 0) { laserCd = 0.35; lasers.push({ x: paddle.x - paddle.w / 2 + 8, y: H - 40 }, { x: paddle.x + paddle.w / 2 - 8, y: H - 40 }); beep(900, 0.05, "square", 0.04); }
    for (let i = balls.length - 1; i >= 0; i--) {
      const b = balls[i]; if (b.stuck) { b.x = paddle.x; continue; }
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x < 8) { b.x = 8; b.vx = Math.abs(b.vx); } if (b.x > W - 8) { b.x = W - 8; b.vx = -Math.abs(b.vx); } if (b.y < 8) { b.y = 8; b.vy = Math.abs(b.vy); }
      const py = H - 30;
      if (b.vy > 0 && b.y + 8 >= py && b.y - 8 <= py + paddle.h && b.x > paddle.x - paddle.w / 2 - 8 && b.x < paddle.x + paddle.w / 2 + 8) { const rel = (b.x - paddle.x) / (paddle.w / 2); const sp = Math.min(ballSpeed() * 1.6, Math.hypot(b.vx, b.vy) * 1.015); const a = -Math.PI / 2 + rel * 1.1; b.vx = Math.cos(a) * sp; b.vy = Math.sin(a) * sp; b.y = py - 8; beep(300, 0.05); }
      if (b.y > H + 10) { balls.splice(i, 1); continue; }
      for (let k = bricks.length - 1; k >= 0; k--) { const br = bricks[k]; if (b.x + 8 < br.x || b.x - 8 > br.x + br.w || b.y + 8 < br.y || b.y - 8 > br.y + br.h) continue;
        const ox = Math.min(b.x + 8 - br.x, br.x + br.w - (b.x - 8)), oy = Math.min(b.y + 8 - br.y, br.y + br.h - (b.y - 8)); if (ox < oy) b.vx = -b.vx; else b.vy = -b.vy;
        hitBrick(k); break; }
    }
    for (let i = lasers.length - 1; i >= 0; i--) { const l = lasers[i]; l.y -= 700 * dt; if (l.y < 0) { lasers.splice(i, 1); continue; } const k = bricks.findIndex(br => l.x >= br.x && l.x <= br.x + br.w && l.y >= br.y && l.y <= br.y + br.h); if (k >= 0) { hitBrick(k); lasers.splice(i, 1); } }
    for (let i = drops.length - 1; i >= 0; i--) { const d = drops[i]; d.y += 160 * dt; if (d.y > H + 10) { drops.splice(i, 1); continue; } if (d.y > H - 40 && d.y < H - 10 && Math.abs(d.x - paddle.x) < paddle.w / 2 + 10) { drops.splice(i, 1); power(d.kind); } }
    if (!balls.length) { lives--; hud(); beep(180, 0.4, "sawtooth", 0.15); shake = 1; if (lives <= 0) return gameOver(); balls = [{ x: paddle.x, y: H - 60, vx: 0, vy: 0, stuck: true }]; running = false; }
    if (!bricks.some(b => b.kind !== "steel")) { level++; if (level > maxLevel) { maxLevel = level; set("br_max", maxLevel); Arc.progress.save("bricks", { level: maxLevel }); } $("btn-cont").classList.toggle("hidden", maxLevel <= 1); score += 100 * level; hud(); beep(880, 0.3); popups.push({ x: W / 2, y: H / 2, text: L("levelUp", level), life: 1.5 }); newLevel(); }
    for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; p.life -= dt; } particles = particles.filter(p => p.life > 0);
    for (const p of popups) p.life -= dt; popups = popups.filter(p => p.life > 0); shake = Math.max(0, shake - dt * 4);
  }
  function hitBrick(k) {
    const br = bricks[k]; if (!br) return; if (br.kind === "steel") { beep(200, 0.05, "square", 0.05); return; }
    br.hp--; score += br.kind === "gold" ? 50 : 10; beep(500 + Math.random() * 300, 0.06, "square", 0.05);
    if (br.hp <= 0) { bricks.splice(k, 1); burst(br.x + br.w / 2, br.y + br.h / 2, br.c);
      if (br.kind === "bomb") { shake = 0.8; beep(120, 0.3, "sawtooth", 0.12); for (let j = bricks.length - 1; j >= 0; j--) { const o = bricks[j]; if (o.kind !== "steel" && Math.abs(o.x - br.x) <= o.w + 6 && Math.abs(o.y - br.y) <= o.h + 6) { score += 10; bricks.splice(j, 1); burst(o.x + o.w / 2, o.y + o.h / 2, o.c); } } }
      const p = Math.random(); if (p < 0.12) drops.push({ x: br.x + br.w / 2, y: br.y, kind: ["multi", "wide", "laser", "life"][Math.floor(Math.random() * 4)] }); else if (p < 0.12 + 0.03 * level) drops.push({ x: br.x + br.w / 2, y: br.y, kind: ["small", "fast"][Math.floor(Math.random() * 2)] }); }
    hud();
  }
  function power(kind) { beep(kind === "small" || kind === "fast" ? 240 : 1000, 0.15); if (kind === "multi") { const b = balls[0]; if (b) { balls.push({ x: b.x, y: b.y, vx: -b.vx, vy: b.vy, stuck: false }, { x: b.x, y: b.y, vx: b.vx * 0.5, vy: -Math.abs(b.vy), stuck: false }); } } else if (kind === "wide") { wideT = 10; smallT = 0; } else if (kind === "laser") laserT = 8; else if (kind === "life") { lives = Math.min(5, lives + 1); hud(); } else if (kind === "small") { smallT = 8; wideT = 0; } else if (kind === "fast") { for (const b of balls) { b.vx *= 1.3; b.vy *= 1.3; } } }
  function burst(x, y, c) { for (let i = 0; i < 10; i++) { const a = Math.random() * 6.28, s = 60 + Math.random() * 160; particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80, c, life: 0.6 }); } }
  async function gameOver() { over = true; running = false; $("over").classList.remove("hidden"); $("over-title").textContent = L("gameOver"); $("over-score").textContent = score; $("over-rank").textContent = ""; const r = await Arc.submit("bricks", score); if (r) $("over-rank").textContent = L("rank", r); }
  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0); if (shake > 0) ctx.translate((Math.random() - 0.5) * shake * 8, (Math.random() - 0.5) * shake * 8);
    ctx.fillStyle = "#2A1B4A"; ctx.fillRect(-10, -10, W + 20, H + 20);
    for (const br of bricks) { ctx.fillStyle = br.c; ctx.globalAlpha = br.kind === "n" && br.hp === 1 ? 0.9 : 1; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(br.x, br.y, br.w, br.h, 5) : ctx.rect(br.x, br.y, br.w, br.h); ctx.fill();
      if (br.kind === "n" && br.hp > 1) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke(); }
      if (br.kind === "steel") { ctx.strokeStyle = "#B8B8C8"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(br.x + 4, br.y + br.h / 2); ctx.lineTo(br.x + br.w - 4, br.y + br.h / 2); ctx.stroke(); }
      if (br.kind === "bomb") { ctx.fillStyle = "#FF9A3C"; ctx.beginPath(); ctx.arc(br.x + br.w / 2, br.y + br.h / 2, 4, 0, 6.28); ctx.fill(); }
      if (br.kind === "gold") { ctx.fillStyle = "rgba(255,255,255,.6)"; ctx.fillRect(br.x + 4, br.y + 4, br.w * 0.4, 3); } } ctx.globalAlpha = 1;
    for (const d of drops) { const bad = d.kind === "small" || d.kind === "fast"; ctx.fillStyle = { multi: "#5EE1D0", wide: "#FFCF5A", laser: "#FF5E7E", life: "#B6FF5A", small: "#7A7A8C", fast: "#7A7A8C" }[d.kind]; ctx.beginPath(); ctx.arc(d.x, d.y, 10, 0, 6.28); ctx.fill(); ctx.fillStyle = bad ? "#fff" : "#1B1030"; ctx.font = "900 12px Nunito, sans-serif"; ctx.textAlign = "center"; ctx.fillText({ multi: "×3", wide: "↔", laser: "⚡", life: "♥", small: "↕", fast: "»" }[d.kind], d.x, d.y + 4); }
    for (const l of lasers) { ctx.fillStyle = "#FF5E7E"; ctx.fillRect(l.x - 2, l.y - 10, 4, 14); }
    ctx.fillStyle = laserT > 0 ? "#FF5E7E" : "#F4F0E8"; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(paddle.x - paddle.w / 2, H - 30, paddle.w, paddle.h, 7) : ctx.rect(paddle.x - paddle.w / 2, H - 30, paddle.w, paddle.h); ctx.fill();
    for (const b of balls) { ctx.fillStyle = "#fff"; ctx.shadowColor = "#fff"; ctx.shadowBlur = 10; ctx.beginPath(); ctx.arc(b.x, b.y, 8, 0, 6.28); ctx.fill(); ctx.shadowBlur = 0; }
    for (const p of particles) { ctx.globalAlpha = Math.min(1, p.life * 2); ctx.fillStyle = p.c; ctx.fillRect(p.x - 2, p.y - 2, 4, 4); } ctx.globalAlpha = 1;
    ctx.font = "900 28px Nunito, sans-serif"; ctx.textAlign = "center"; for (const p of popups) { ctx.globalAlpha = Math.min(1, p.life); ctx.fillStyle = "#FFCF5A"; ctx.fillText(p.text, p.x, p.y); } ctx.globalAlpha = 1;
    if (!running && !over) { ctx.fillStyle = "rgba(255,255,255,.6)"; ctx.font = "900 20px Nunito, sans-serif"; ctx.fillText("▲", W / 2, H / 2); }
  }
  function loop(now) { const dt = Math.min(0.05, (now - last) / 1000); last = now; if (!over) step(dt); draw(); requestAnimationFrame(loop); }
  const toX = (cx) => { const r = cv.getBoundingClientRect(); return (cx - r.left) * W / r.width; };
  let pdown = null;
  cv.addEventListener("pointerdown", (e) => { pdown = { x: e.clientX, y: e.clientY }; paddle.x = Math.max(paddle.w / 2, Math.min(W - paddle.w / 2, toX(e.clientX))); });
  cv.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse" && !(e.buttons & 1) && !pdown) { paddle.x = Math.max(paddle.w / 2, Math.min(W - paddle.w / 2, toX(e.clientX))); return; } if (pdown) paddle.x = Math.max(paddle.w / 2, Math.min(W - paddle.w / 2, toX(e.clientX))); });
  window.addEventListener("pointerup", (e) => { if (!pdown) return; const moved = Math.hypot(e.clientX - pdown.x, e.clientY - pdown.y) > 10; pdown = null; if (!moved && !running && !over) launch(); if (over && !moved) reset(); });
  window.addEventListener("keydown", (e) => { if (e.key === " " && !running && !over) launch(); if (e.key === "ArrowLeft") paddle.x = Math.max(paddle.w / 2, paddle.x - 30); if (e.key === "ArrowRight") paddle.x = Math.min(W - paddle.w / 2, paddle.x + 30); });
  $("btn-new").onclick = reset; $("btn-again").onclick = reset; $("btn-lb").onclick = () => Arc.openLb("bricks");
  $("btn-cont").onclick = () => reset(maxLevel); $("btn-cont").classList.toggle("hidden", maxLevel <= 1);
  Arc.progress.load("bricks", { level: maxLevel }).then(p => { if (p.level > maxLevel) { maxLevel = p.level; set("br_max", maxLevel); } $("btn-cont").classList.toggle("hidden", maxLevel <= 1); $("btn-cont").textContent = L("continueLv", maxLevel); });
  $("btn-cont").textContent = L("continueLv", maxLevel);
  Arc.wire(); Arc.applyLang(); reset(); requestAnimationFrame(loop);
})();
