(() => {
  const { $, get, set, L, beep } = Arc;
  Arc.texts({ en: { classic: "Classic", walls: "Walls", hint: "Swipe or arrow keys. Tap to start.", gameOver: "Game over", paused: "Paused" }, cs: { classic: "Klasika", walls: "Stěny", hint: "Táhni prstem nebo šipky. Ťuknutím začni.", gameOver: "Konec hry", paused: "Pauza" } });
  const N = 20, cv = $("cv"), ctx = cv.getContext("2d"), S = cv.width / N;
  let prev = null; let mode = "classic", snake, dir, nextDir, food, score, best = get("sn_best", {}), speed, acc = 0, running = false, over = false, last = 0, grow = 0, bonus = null, bonusT = 0, particles = [];
  const COLORS = ["#5EE1D0", "#B6FF5A", "#FFCF5A", "#FF9A3C", "#FF5E7E", "#FF7AD9", "#B98CFF", "#6FC3FF"];
  function reset() { snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }]; dir = { x: 1, y: 0 }; nextDir = dir; score = 0; speed = 6; acc = 0; running = false; over = false; grow = 0; bonus = null; particles = []; placeFood(); $("over").classList.add("hidden"); hud(); draw(); }
  function placeFood() { do { food = { x: Math.floor(Math.random() * N), y: Math.floor(Math.random() * N) }; } while (snake.some(s => s.x === food.x && s.y === food.y)); if (Math.random() < 0.18 && !bonus) { do { bonus = { x: Math.floor(Math.random() * N), y: Math.floor(Math.random() * N) }; } while (snake.some(s => s.x === bonus.x && s.y === bonus.y) || (bonus.x === food.x && bonus.y === food.y)); bonusT = 6; } }
  function hud() { $("score").textContent = score; $("best").textContent = best[mode] || 0; }
  function setDir(d) { const nd = [{ x: -1, y: 0 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }][d]; if (nd.x === -dir.x && nd.y === -dir.y) return; nextDir = nd; if (!running && !over) { running = true; beep(520); } }
  function step() {
    dir = nextDir; const h = snake[0]; let nx = h.x + dir.x, ny = h.y + dir.y;
    if (mode === "classic") { nx = (nx + N) % N; ny = (ny + N) % N; } else if (nx < 0 || ny < 0 || nx >= N || ny >= N) return die();
    if (snake.some((s, i) => i < snake.length - (grow ? 0 : 1) && s.x === nx && s.y === ny)) return die();
    prev = snake.map(s => ({ x: s.x, y: s.y })); snake.unshift({ x: nx, y: ny });
    if (nx === food.x && ny === food.y) { score += 10; grow += 1; speed = Math.min(16, speed + 0.35); beep(700 + Math.min(score, 600), 0.1); burst(food, "#FF5E7E"); placeFood(); }
    else if (bonus && nx === bonus.x && ny === bonus.y) { score += 50; grow += 2; beep(1000, 0.2); burst(bonus, "#FFCF5A"); bonus = null; }
    if (grow > 0) grow--; else snake.pop();
    if (prev && prev.length > snake.length) prev.length = snake.length;
    if (score > (best[mode] || 0)) { best[mode] = score; set("sn_best", best); }
    hud();
  }
  function die() { over = true; running = false; beep(180, 0.4, "sawtooth", 0.15); burst(snake[0], "#fff"); showOver(); }
  async function showOver() { $("over").classList.remove("hidden"); $("over-title").textContent = L("gameOver"); $("over-score").textContent = score; $("over-rank").textContent = ""; const r = await Arc.submit("snake_" + mode, score); if (r) $("over-rank").textContent = L("rank", r); }
  function burst(c, col) { for (let i = 0; i < 12; i++) { const a = Math.random() * 6.28, s = 60 + Math.random() * 120; particles.push({ x: (c.x + 0.5) * S, y: (c.y + 0.5) * S, vx: Math.cos(a) * s, vy: Math.sin(a) * s, c: col, life: 0.5 }); } }
  function draw(dt = 0) {
    ctx.fillStyle = "#2A1B4A"; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = "rgba(255,255,255,.04)"; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if ((x + y) & 1) ctx.fillRect(x * S, y * S, S, S);
    if (mode === "walls") { ctx.strokeStyle = "#FF5E7E"; ctx.lineWidth = 6; ctx.strokeRect(3, 3, cv.width - 6, cv.height - 6); }
    // jídlo
    const pulse = 1 + Math.sin(performance.now() / 150) * 0.1;
    ctx.fillStyle = "#FF5E7E"; ctx.beginPath(); ctx.arc((food.x + 0.5) * S, (food.y + 0.5) * S, S * 0.34 * pulse, 0, 6.28); ctx.fill();
    ctx.fillStyle = "#4FD37A"; ctx.fillRect((food.x + 0.5) * S - 1.5, (food.y + 0.5) * S - S * 0.45, 3, S * 0.18);
    if (bonus) { ctx.fillStyle = "#FFCF5A"; ctx.save(); ctx.translate((bonus.x + 0.5) * S, (bonus.y + 0.5) * S); ctx.rotate(performance.now() / 300); ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5, r = i % 2 ? S * 0.18 : S * 0.4; i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(r, 0); } ctx.closePath(); ctx.fill(); ctx.restore(); ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.fillRect((bonus.x + 0.1) * S, (bonus.y + 0.9) * S, S * 0.8 * (bonusT / 6), 2); }
    // had – barevný gradient po délce, hlava s očima
    const k = running ? Math.min(1, acc * speed) : 1;
    const ipos = (i) => { const s = snake[i], p = prev && prev[i] ? prev[i] : s; if (Math.abs(p.x - s.x) > 1 || Math.abs(p.y - s.y) > 1) return s; return { x: p.x + (s.x - p.x) * k, y: p.y + (s.y - p.y) * k }; };
    for (let i = snake.length - 1; i >= 0; i--) { const s = ipos(i); ctx.fillStyle = COLORS[Math.floor(i / 3) % COLORS.length]; const m = i === 0 ? 1 : 3; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(s.x * S + m, s.y * S + m, S - m * 2, S - m * 2, i === 0 ? 8 : 6) : ctx.rect(s.x * S + m, s.y * S + m, S - m * 2, S - m * 2); ctx.fill(); }
    const h = ipos(0); const ex = dir.x * 5, ey = dir.y * 5; ctx.fillStyle = "#1B1030";
    [[-6, -6], [6, 6]].forEach(([ox, oy]) => { const px = (h.x + 0.5) * S + (dir.x ? ex : ox), py = (h.y + 0.5) * S + (dir.y ? ey : oy); ctx.beginPath(); ctx.arc(px, py, 3, 0, 6.28); ctx.fill(); });
    for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; ctx.globalAlpha = Math.max(0, p.life * 2); ctx.fillStyle = p.c; ctx.fillRect(p.x - 2, p.y - 2, 4, 4); } ctx.globalAlpha = 1; particles = particles.filter(p => p.life > 0);
    if (!running && !over) { ctx.fillStyle = "rgba(27,16,48,.55)"; ctx.fillRect(0, 0, cv.width, cv.height); ctx.fillStyle = "#fff"; ctx.font = "900 34px Nunito, sans-serif"; ctx.textAlign = "center"; ctx.fillText("▶", cv.width / 2, cv.height / 2 + 12); }
  }
  function loop(now) { const dt = Math.min(0.1, (now - last) / 1000); last = now; if (running) { acc += dt; if (bonus) { bonusT -= dt; if (bonusT <= 0) bonus = null; } while (acc >= 1 / speed && running) { acc -= 1 / speed; step(); } } draw(dt); requestAnimationFrame(loop); }
  window.addEventListener("keydown", (e) => { if (e.target.tagName === "INPUT") return; const d = { ArrowLeft: 0, ArrowUp: 1, ArrowRight: 2, ArrowDown: 3, a: 0, w: 1, d: 2, s: 3 }[e.key]; if (d !== undefined) { e.preventDefault(); setDir(d); } if (e.key === " ") { e.preventDefault(); if (over) reset(); else running = !running; } });
  let sw = null; cv.addEventListener("pointerdown", (e) => { sw = { x: e.clientX, y: e.clientY }; }); window.addEventListener("pointerup", (e) => { if (!sw) return; const dx = e.clientX - sw.x, dy = e.clientY - sw.y; sw = null; if (Math.hypot(dx, dy) < 20) { if (over) reset(); else if (!running) { running = true; beep(520); } return; } setDir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 2 : 0) : (dy > 0 ? 3 : 1)); });
  document.querySelectorAll(".dpad button").forEach(b => b.onclick = () => setDir(+b.dataset.d));
  $("btn-again").onclick = reset; $("btn-lb").onclick = () => Arc.openLb("snake_" + mode);
  $("m-classic").onclick = () => { mode = "classic"; $("m-classic").classList.add("active"); $("m-walls").classList.remove("active"); reset(); };
  $("m-walls").onclick = () => { mode = "walls"; $("m-walls").classList.add("active"); $("m-classic").classList.remove("active"); reset(); };
  Arc.wire(); Arc.applyLang(); reset(); requestAnimationFrame(loop);
})();
