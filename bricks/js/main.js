(() => {
  const { $, get, set, L, beep } = Arc;
  Arc.texts({ en: { level: "Level", lives: "Lives", hint: "Drag or move the mouse. Tap to launch.", gameOver: "Game over", levelUp: (n) => `Level ${n}!` }, cs: { level: "Level", lives: "Životy", hint: "Táhni prstem nebo myší. Ťuknutím vystřel.", gameOver: "Konec hry", levelUp: (n) => `Level ${n}!` } });
  const cv = $("cv"), ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
  const COLORS = ["#FF5E7E", "#FF9A3C", "#FFCF5A", "#B6FF5A", "#5EE1D0", "#6FC3FF", "#B98CFF", "#FF7AD9"];
  let paddle, balls, bricks, drops, lasers, score, lives, level, running, over, last = 0, particles = [], shake = 0, wideT = 0, laserT = 0, laserCd = 0, popups = [];
  function reset() { score = 0; lives = 3; level = 1; over = false; newLevel(); hud(); $("over").classList.add("hidden"); }
  function newLevel() {
    paddle = { x: W / 2, w: 90, h: 14 }; balls = [{ x: W / 2, y: H - 60, vx: 0, vy: 0, stuck: true }]; drops = []; lasers = []; running = false; wideT = 0; laserT = 0;
    bricks = []; const rows = Math.min(9, 4 + level), cols = 9, bw = (W - 20) / cols, bh = 20;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { if (level > 2 && ((r + c + level) % 5 === 0)) continue; const hp = level > 3 && r < 2 ? 2 : 1; bricks.push({ x: 10 + c * bw, y: 60 + r * (bh + 5), w: bw - 4, h: bh, hp, c: COLORS[r % COLORS.length] }); }
  }
  function hud() { $("score").textContent = score; $("level").textContent = level; $("lives").textContent = "❤".repeat(lives); }
  function launch() { for (const b of balls) if (b.stuck) { b.stuck = false; const a = -Math.PI / 2 + (Math.random() - 0.5) * 0.6; const sp = 380 + level * 20; b.vx = Math.cos(a) * sp; b.vy = Math.sin(a) * sp; } running = true; }
  function step(dt) {
    if (!running) { for (const b of balls) if (b.stuck) b.x = paddle.x; return; }
    wideT = Math.max(0, wideT - dt); laserT = Math.max(0, laserT - dt); laserCd = Math.max(0, laserCd - dt);
    paddle.w = wideT > 0 ? 140 : 90;
    if (laserT > 0 && laserCd <= 0) { laserCd = 0.35; lasers.push({ x: paddle.x - paddle.w / 2 + 8, y: H - 40 }, { x: paddle.x + paddle.w / 2 - 8, y: H - 40 }); beep(900, 0.05, "square", 0.04); }
    for (let i = balls.length - 1; i >= 0; i--) {
      const b = balls[i]; if (b.stuck) { b.x = paddle.x; continue; }
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x < 8) { b.x = 8; b.vx = Math.abs(b.vx); } if (b.x > W - 8) { b.x = W - 8; b.vx = -Math.abs(b.vx); } if (b.y < 8) { b.y = 8; b.vy = Math.abs(b.vy); }
      const py = H - 30;
      if (b.vy > 0 && b.y + 8 >= py && b.y - 8 <= py + paddle.h && b.x > paddle.x - paddle.w / 2 - 8 && b.x < paddle.x + paddle.w / 2 + 8) { const rel = (b.x - paddle.x) / (paddle.w / 2); const sp = Math.hypot(b.vx, b.vy); const a = -Math.PI / 2 + rel * 1.1; b.vx = Math.cos(a) * sp; b.vy = Math.sin(a) * sp; b.y = py - 8; beep(300, 0.05); }
      if (b.y > H + 10) { balls.splice(i, 1); continue; }
      for (let k = bricks.length - 1; k >= 0; k--) { const br = bricks[k]; if (b.x + 8 < br.x || b.x - 8 > br.x + br.w || b.y + 8 < br.y || b.y - 8 > br.y + br.h) continue;
        const ox = Math.min(b.x + 8 - br.x, br.x + br.w - (b.x - 8)), oy = Math.min(b.y + 8 - br.y, br.y + br.h - (b.y - 8)); if (ox < oy) b.vx = -b.vx; else b.vy = -b.vy;
        hitBrick(k); break; }
    }
    for (let i = lasers.length - 1; i >= 0; i--) { const l = lasers[i]; l.y -= 700 * dt; if (l.y < 0) { lasers.splice(i, 1); continue; } const k = bricks.findIndex(br => l.x >= br.x && l.x <= br.x + br.w && l.y >= br.y && l.y <= br.y + br.h); if (k >= 0) { hitBrick(k); lasers.splice(i, 1); } }
    for (let i = drops.length - 1; i >= 0; i--) { const d = drops[i]; d.y += 160 * dt; if (d.y > H + 10) { drops.splice(i, 1); continue; } if (d.y > H - 40 && d.y < H - 10 && Math.abs(d.x - paddle.x) < paddle.w / 2 + 10) { drops.splice(i, 1); power(d.kind); } }
    if (!balls.length) { lives--; hud(); beep(180, 0.4, "sawtooth", 0.15); shake = 1; if (lives <= 0) return gameOver(); balls = [{ x: paddle.x, y: H - 60, vx: 0, vy: 0, stuck: true }]; running = false; }
    if (!bricks.length) { level++; score += 100 * level; hud(); beep(880, 0.3); popups.push({ x: W / 2, y: H / 2, text: L("levelUp", level), life: 1.5 }); newLevel(); }
    for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; p.life -= dt; } particles = particles.filter(p => p.life > 0);
    for (const p of popups) p.life -= dt; popups = popups.filter(p => p.life > 0); shake = Math.max(0, shake - dt * 4);
  }
  function hitBrick(k) { const br = bricks[k]; br.hp--; score += 10; beep(500 + Math.random() * 300, 0.06, "square", 0.05); if (br.hp <= 0) { bricks.splice(k, 1); burst(br.x + br.w / 2, br.y + br.h / 2, br.c); if (Math.random() < 0.14) drops.push({ x: br.x + br.w / 2, y: br.y, kind: ["multi", "wide", "laser", "life"][Math.floor(Math.random() * 4)] }); } hud(); }
  function power(kind) { beep(1000, 0.15); if (kind === "multi") { const b = balls[0]; if (b) { balls.push({ x: b.x, y: b.y, vx: -b.vx, vy: b.vy, stuck: false }, { x: b.x, y: b.y, vx: b.vx * 0.5, vy: -Math.abs(b.vy), stuck: false }); } } else if (kind === "wide") wideT = 10; else if (kind === "laser") laserT = 8; else if (kind === "life") { lives = Math.min(5, lives + 1); hud(); } }
  function burst(x, y, c) { for (let i = 0; i < 10; i++) { const a = Math.random() * 6.28, s = 60 + Math.random() * 160; particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80, c, life: 0.6 }); } }
  async function gameOver() { over = true; running = false; $("over").classList.remove("hidden"); $("over-title").textContent = L("gameOver"); $("over-score").textContent = score; $("over-rank").textContent = ""; const r = await Arc.submit("bricks", score); if (r) $("over-rank").textContent = L("rank", r); }
  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0); if (shake > 0) ctx.translate((Math.random() - 0.5) * shake * 8, (Math.random() - 0.5) * shake * 8);
    ctx.fillStyle = "#2A1B4A"; ctx.fillRect(-10, -10, W + 20, H + 20);
    for (const br of bricks) { ctx.fillStyle = br.c; ctx.globalAlpha = br.hp > 1 ? 1 : 0.9; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(br.x, br.y, br.w, br.h, 5) : ctx.rect(br.x, br.y, br.w, br.h); ctx.fill(); if (br.hp > 1) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke(); } } ctx.globalAlpha = 1;
    for (const d of drops) { ctx.fillStyle = { multi: "#5EE1D0", wide: "#FFCF5A", laser: "#FF5E7E", life: "#B6FF5A" }[d.kind]; ctx.beginPath(); ctx.arc(d.x, d.y, 10, 0, 6.28); ctx.fill(); ctx.fillStyle = "#1B1030"; ctx.font = "900 12px Nunito, sans-serif"; ctx.textAlign = "center"; ctx.fillText({ multi: "×3", wide: "↔", laser: "⚡", life: "♥" }[d.kind], d.x, d.y + 4); }
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
  Arc.wire(); Arc.applyLang(); reset(); requestAnimationFrame(loop);
})();
