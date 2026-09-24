(() => {
  const { $, get, set, L, beep } = Arc;
  Arc.texts({
    en: { play: "Play", hint: "Tap or ↑ to hop forward. Swipe or ← → ↓ to dodge.", bestIs: (n) => `Best: ${n}`, squashed: "Squashed!", splash: "Splash!", eagle: "Too slow!", train: "Hit by a train!", coinsN: (n) => `🪙 ${n} coins` },
    cs: { play: "Hrát", hint: "Ťukni nebo ↑ = skok dopředu. Švih nebo ← → ↓ = uhnout.", bestIs: (n) => `Rekord: ${n}`, squashed: "Přejetý!", splash: "Žbluňk!", eagle: "Moc pomalu!", train: "Srazil tě vlak!", coinsN: (n) => `🪙 ${n} mincí` },
  });
  const cv = $("cv"), ctx = cv.getContext("2d"), W = cv.width, H = cv.height, COLS = 9, CS = W / COLS, SPAN = COLS + 6;
  const CAR_COLORS = ["#FF5E7E", "#5EE1D0", "#FFCF5A", "#8A5CFF", "#FF9A3C", "#6FC3FF", "#B6FF5A"];
  let rows, player, cam, camFloor, score, coins, best = get("hop_best", 0), state = "menu", particles, last = 0, shake = 0, deathT = 0, deathMsg = "", queue = [], started = false;
  const rnd = (a, b) => a + Math.random() * (b - a);

  // ---------- generování řádků
  function gen(r) {
    const d = Math.min(1, r / 160), prev = rows.get(r - 1);
    let type = "grass";
    if (r >= 4) {
      const roll = Math.random(), run = prev ? prev.run || 1 : 0, maxRun = prev && prev.type === "river" ? 2 : 2 + Math.floor(d * 3);
      if (prev && (prev.type === "road" || prev.type === "river") && run < maxRun && Math.random() < 0.5) type = prev.type;   // krátké shluky
      else if (prev && prev.type !== "grass" && run >= 2 && Math.random() < 0.7) type = "grass";                                // po shluku oddech
      else if (roll < 0.3) type = "grass"; else if (roll < 0.66) type = "road"; else if (roll < 0.88 && r > 8) type = "river"; else if (r > 14) type = "rail"; else type = "road";
      if (prev && prev.type === type && type === "rail") type = "grass";
    }
    const row = { type, dir: Math.random() < 0.5 ? -1 : 1, run: prev && prev.type === type ? (prev.run || 1) + 1 : 1 };
    if (type === "grass") {
      row.trees = new Set();
      if (r >= 4) { for (let c = 0; c < COLS; c++) if (Math.random() < 0.18 + d * 0.12) row.trees.add(c); while (row.trees.size > COLS - 3) row.trees.delete([...row.trees][0]); }
      else { row.trees.add(0); row.trees.add(COLS - 1); }
    } else if (type === "road") {
      row.speed = rnd(1.1, 2.2) + d * 2.4; row.items = []; let x = rnd(0, 3);
      while (x < SPAN - 2) { const w = Math.random() < 0.25 + d * 0.15 ? 2 : 1; row.items.push({ x: x - 3, w, color: CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)] }); x += w + rnd(2.4, 4.6) - d * 0.8; }
    } else if (type === "river") {
      row.speed = rnd(0.8, 1.6) + d * 1.4; row.items = []; let x = rnd(0, 2);
      while (x < SPAN - 1) { const w = Math.floor(rnd(2, 4.5 - d)); row.items.push({ x: x - 3, w }); x += w + rnd(1.1, 2.4 + d * 0.6); }
    } else if (type === "rail") { row.timer = rnd(2, 6); row.train = null; }
    if ((type === "grass" || type === "road") && r > 3 && Math.random() < 0.1) { let c; do { c = Math.floor(Math.random() * COLS); } while (row.trees && row.trees.has(c)); row.coin = c; }
    rows.set(r, row);
  }
  const rowAt = (r) => { if (!rows.has(r)) { for (let k = Math.min(...rows.keys(), r); k <= r; k++) if (!rows.has(k)) gen(k); } return rows.get(r); };

  function reset() {
    rows = new Map(); for (let r = -4; r < 24; r++) gen(r);
    player = { c: 4, r: 0, from: null, to: null, t: 1, dead: false, face: 0, squash: 0 };
    cam = -3; camFloor = -3; score = 0; coins = 0; particles = []; queue = []; deathT = 0; started = false; state = "play";
    $("over").classList.add("hidden"); $("start").classList.add("hidden"); document.querySelector(".corner").classList.add("hidden"); $("btn-hub").classList.add("hidden");
  }

  // ---------- pohyb
  function hop(dc, dr) {
    if (state !== "play" || player.dead) return;
    if (player.t < 1) { if (queue.length < 1) queue.push([dc, dr]); return; }
    started = true;
    const target = rowAt(player.r + dr);
    let nc = player.c + dc; const onRiverTarget = target.type === "river";
    if (!onRiverTarget) nc = Math.round(nc);
    if (nc < -0.3 || nc > COLS - 0.7) { bump(); return; }
    if (target.type === "grass" && target.trees.has(Math.round(nc))) { bump(); return; }
    player.from = { c: player.c, r: player.r }; player.to = { c: nc, r: player.r + dr }; player.t = 0; player.face = dc ? (dc > 0 ? 1 : 3) : (dr > 0 ? 0 : 2);
    beep(dr > 0 ? 520 : 440, 0.04, "sine", 0.05);
  }
  function bump() { player.squash = 0.12; beep(200, 0.04, "square", 0.03); }
  function die(kind) {
    if (player.dead) return; player.dead = kind; state = "dying"; deathT = 0; shake = 1;
    const px = (player.c + 0.5) * CS, py = sy(player.r) + CS / 2;
    deathMsg = { car: L("squashed"), water: L("splash"), eagle: L("eagle"), train: L("train") }[kind];
    for (let i = 0; i < 24; i++) { const a = Math.random() * 6.28, s = rnd(60, 220); particles.push({ x: px, y: py, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.7, c: kind === "water" ? "#9FD8FF" : skinColor() }); }
    beep(kind === "water" ? 160 : 120, 0.35, "sawtooth", 0.12);
  }
  const skinColor = () => (window.Meta && Meta.skin("ball") && Meta.skin("ball").color) || "#F4F0E8";

  async function gameOver() {
    state = "over"; if (score > best) { best = score; set("hop_best", best); } document.querySelector(".corner").classList.remove("hidden"); $("btn-hub").classList.remove("hidden");
    $("over").classList.remove("hidden"); $("over-title").textContent = deathMsg; $("over-score").textContent = score; $("over-rank").textContent = L("coinsN", coins) + " · " + L("bestIs", best);
    const r = await Arc.submit("hop", score, Math.min(40, 5 + Math.floor(score / 4) + coins));
    if (r) $("over-rank").textContent += " · " + L("rank", r);
  }

  // ---------- smyčka
  const sy = (r) => H - (r - cam + 1) * CS - CS * 1.5;
  function update(dt) {
    // vozidla, klády, vlaky
    for (const [r, row] of rows) {
      if (row.items) for (const it of row.items) { it.x += row.dir * row.speed * dt; if (it.x > SPAN - 3) it.x -= SPAN; if (it.x < -3 - it.w + 0.001 && row.dir < 0) it.x += SPAN; }
      if (row.type === "rail") { if (row.train) { row.train.x += row.dir * 22 * dt; if ((row.dir > 0 && row.train.x > COLS + 2) || (row.dir < 0 && row.train.x < -14)) { row.train = null; row.timer = rnd(3, 7); } } else { row.timer -= dt; if (row.timer <= 0) { row.train = { x: row.dir > 0 ? -14 : COLS + 2, w: 12 }; if (Math.abs(r - player.r) < 8) beep(90, 0.5, "sawtooth", 0.05); } } }
    }
    if (state === "dying") { deathT += dt; if (deathT > 0.9) gameOver(); return; }
    if (state !== "play") return;
    // skok
    if (player.t < 1) { player.t = Math.min(1, player.t + dt / 0.11); if (player.t >= 1) { player.c = player.to.c; player.r = player.to.r; landed(); if (queue.length) { const q = queue.shift(); hop(q[0], q[1]); } } }
    player.squash = Math.max(0, player.squash - dt);
    const lr = player.t < 0.5 && player.from ? player.from.r : player.r, row = rowAt(lr), pc = player.t < 1 && player.from ? player.from.c + (player.to.c - player.from.c) * player.t : player.c;
    if (row.type === "road") for (const it of row.items) if (pc + 0.18 < it.x + it.w && pc + 0.82 > it.x) return die("car");
    if (row.type === "rail" && row.train && pc + 0.1 < row.train.x + row.train.w && pc + 0.9 > row.train.x) return die("train");
    if (row.type === "river" && player.t >= 1) {
      const log = row.items.find(it => pc + 0.5 > it.x && pc + 0.5 < it.x + it.w);
      if (!log) return die("water");
      player.c += row.dir * row.speed * dt; if (player.c < -0.45 || player.c > COLS - 0.55) return die("water");
    }
    // kamera: drží hráče ve 4. řadě, a když stojí, pomalu tlačí dopředu
    const target = player.r - 3; cam += (Math.max(target, camFloor) - cam) * Math.min(1, dt * 8);
    if (started) camFloor += dt * (0.5 + Math.min(0.4, score / 400));
    if (player.r - camFloor < -0.6) return die("eagle");
    // generovat dopředu, mazat staré
    for (let r = Math.floor(cam) + 20; !rows.has(r); r--) rowAt(r);
    for (const r of [...rows.keys()]) if (r < cam - 6) rows.delete(r);
  }
  function landed() {
    const row = rowAt(player.r);
    if (player.r > score) { score = player.r; }
    camFloor = Math.max(camFloor, player.r - 3.5);
    if (row.coin != null && row.coin === Math.round(player.c)) { coins++; row.coin = null; beep(1100, 0.08); const px = (player.c + 0.5) * CS, py = sy(player.r) + CS / 2; for (let i = 0; i < 10; i++) particles.push({ x: px, y: py, vx: rnd(-90, 90), vy: rnd(-160, -40), life: 0.5, c: "#FFCF5A" }); }
    player.squash = 0.08;
  }

  // ---------- kreslení
  function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }
  function draw(dt) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (shake > 0) { ctx.translate(rnd(-1, 1) * shake * 6, rnd(-1, 1) * shake * 6); shake = Math.max(0, shake - dt * 3); }
    const r0 = Math.floor(cam) - 2, r1 = Math.floor(cam) + 17;
    for (let r = r0; r <= r1; r++) {
      const row = rowAt(r), y = sy(r);
      if (row.type === "grass") { ctx.fillStyle = r % 2 ? "#3E9A5E" : "#379055"; ctx.fillRect(0, y, W, CS); }
      else if (row.type === "road") { ctx.fillStyle = "#3A3155"; ctx.fillRect(0, y, W, CS); const up = rowAt(r + 1); if (up.type === "road") { ctx.fillStyle = "rgba(255,255,255,.35)"; for (let x = 6; x < W; x += 34) ctx.fillRect(x, y - 1.5, 16, 3); } }
      else if (row.type === "river") { ctx.fillStyle = "#2F7BD0"; ctx.fillRect(0, y, W, CS); ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.lineWidth = 2; const off = (performance.now() / 40 * row.dir) % 30; for (let x = -30; x < W + 30; x += 30) { ctx.beginPath(); ctx.moveTo(x + off, y + CS * 0.55); ctx.quadraticCurveTo(x + off + 7, y + CS * 0.45, x + off + 14, y + CS * 0.55); ctx.stroke(); } }
      else if (row.type === "rail") { ctx.fillStyle = "#4A3B35"; ctx.fillRect(0, y, W, CS); ctx.fillStyle = "#6B5040"; for (let x = 2; x < W; x += 14) ctx.fillRect(x, y + 5, 8, CS - 10); ctx.fillStyle = "#B9B4C8"; ctx.fillRect(0, y + 11, W, 3); ctx.fillRect(0, y + CS - 14, W, 3);
        const warn = row.train || row.timer < 1.2; ctx.fillStyle = "#222"; ctx.fillRect(W - 12, y - 14, 4, 18); ctx.fillStyle = warn && (performance.now() / 150 | 0) % 2 ? "#FF3B3B" : "#551515"; ctx.beginPath(); ctx.arc(W - 10, y - 16, 5, 0, 6.28); ctx.fill(); }
    }
    // objekty (od nejvzdálenějších, ať se správně překrývají)
    for (let r = r1; r >= r0; r--) {
      const row = rowAt(r), y = sy(r);
      if (row.type === "grass") { for (const c of row.trees) { const x = c * CS; ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.beginPath(); ctx.ellipse(x + CS / 2, y + CS * 0.8, CS * 0.36, CS * 0.14, 0, 0, 6.28); ctx.fill(); ctx.fillStyle = "#6B4A2B"; ctx.fillRect(x + CS * 0.42, y + CS * 0.45, CS * 0.16, CS * 0.35); ctx.fillStyle = "#1F6B3B"; ctx.beginPath(); ctx.arc(x + CS / 2, y + CS * 0.34, CS * 0.34, 0, 6.28); ctx.fill(); ctx.fillStyle = "#2C8A4E"; ctx.beginPath(); ctx.arc(x + CS * 0.42, y + CS * 0.26, CS * 0.18, 0, 6.28); ctx.fill(); } }
      if (row.coin != null) { const x = (row.coin + 0.5) * CS, bob = Math.sin(performance.now() / 200 + r) * 3; ctx.fillStyle = "#FFCF5A"; ctx.beginPath(); ctx.ellipse(x, y + CS / 2 + bob, CS * 0.22 * Math.abs(Math.cos(performance.now() / 300)) + 2, CS * 0.22, 0, 0, 6.28); ctx.fill(); }
      if (row.type === "river") for (const it of row.items) { const x = it.x * CS; ctx.fillStyle = "#6B4A2B"; roundRect(x + 2, y + 6, it.w * CS - 4, CS - 10, 10); ctx.fill(); ctx.fillStyle = "#8B5A2B"; roundRect(x + 2, y + 4, it.w * CS - 4, CS - 14, 10); ctx.fill(); ctx.strokeStyle = "rgba(0,0,0,.2)"; ctx.lineWidth = 1.5; for (let k = 1; k < it.w; k++) { ctx.beginPath(); ctx.moveTo(x + k * CS, y + 8); ctx.lineTo(x + k * CS, y + CS - 12); ctx.stroke(); } }
      if (r === (player.t < 0.5 && player.from ? player.from.r : player.r) && !player.dead) drawPlayer();
      if (row.type === "road") for (const it of row.items) { const x = it.x * CS, w = it.w * CS; ctx.fillStyle = "rgba(0,0,0,.25)"; roundRect(x + 3, y + CS * 0.62, w - 6, CS * 0.28, 6); ctx.fill(); ctx.fillStyle = it.color; roundRect(x + 3, y + 5, w - 6, CS - 12, 8); ctx.fill(); ctx.fillStyle = "rgba(20,12,40,.55)"; const wx = row.dir > 0 ? x + w - CS * 0.55 : x + 8; roundRect(wx, y + 9, CS * 0.42, CS - 22, 4); ctx.fill(); ctx.fillStyle = "#FFF6C0"; const lx = row.dir > 0 ? x + w - 7 : x + 4; ctx.fillRect(lx, y + 8, 3, 5); ctx.fillRect(lx, y + CS - 18, 3, 5); }
      if (row.type === "rail" && row.train) { const x = row.train.x * CS, w = row.train.w * CS; ctx.fillStyle = "#C23A57"; roundRect(x, y + 3, w, CS - 8, 8); ctx.fill(); ctx.fillStyle = "#FFE9A3"; for (let k = 0; k < row.train.w - 1; k += 1.5) ctx.fillRect(x + (k + 0.4) * CS, y + 9, CS * 0.6, CS * 0.3); }
    }
    if (player.dead === "water" || player.dead === "car" || player.dead === "train") { /* rozprsknutí jen částicemi */ } else if (player.dead === "eagle") drawPlayer();
    for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; p.life -= dt; ctx.globalAlpha = Math.max(0, p.life * 1.5); ctx.fillStyle = p.c; ctx.fillRect(p.x - 3, p.y - 3, 6, 6); } ctx.globalAlpha = 1; particles = particles.filter(p => p.life > 0);
    // HUD
    ctx.font = "900 44px Nunito, sans-serif"; ctx.textAlign = "center"; ctx.lineWidth = 6; ctx.strokeStyle = "rgba(20,12,40,.6)"; ctx.fillStyle = "#fff"; ctx.strokeText(score, W / 2, 62); ctx.fillText(score, W / 2, 62);
    ctx.font = "900 16px Nunito, sans-serif"; ctx.textAlign = "right"; ctx.strokeText("🪙 " + coins, W - 12, 92); ctx.fillStyle = "#FFCF5A"; ctx.fillText("🪙 " + coins, W - 12, 92);
    if (!started && state === "play") { ctx.textAlign = "center"; ctx.font = "900 18px Nunito, sans-serif"; ctx.fillStyle = "rgba(255,255,255,.9)"; ctx.fillText("▲", W / 2, sy(player.r) - 10 + Math.sin(performance.now() / 150) * 4); }
  }
  function drawPlayer() {
    const t = player.t < 1 && player.from ? player.t : 1, c = player.from && t < 1 ? player.from.c + (player.to.c - player.from.c) * t : player.c, r = player.from && t < 1 ? player.from.r + (player.to.r - player.from.r) * t : player.r;
    const x = (c + 0.5) * CS, y = sy(r) + CS / 2, jump = Math.sin(t * Math.PI) * CS * 0.35, sq = player.squash > 0 ? 1 - player.squash * 2 : 1, col = skinColor(), s = CS * 0.66;
    ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.beginPath(); ctx.ellipse(x, y + s * 0.42, s * 0.42, s * 0.16, 0, 0, 6.28); ctx.fill();
    ctx.save(); ctx.translate(x, y - jump); ctx.scale(1 / sq, sq);
    ctx.fillStyle = col; roundRect(-s / 2, -s / 2, s, s, s * 0.28); ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,.12)"; roundRect(-s / 2, s * 0.18, s, s * 0.32, s * 0.2); ctx.fill();
    const f = [[0, -1], [1, 0], [0, 1], [-1, 0]][player.face] || [0, -1];
    ctx.fillStyle = "#1B1030"; for (const k of [-1, 1]) { ctx.beginPath(); ctx.arc(f[0] * s * 0.12 + (f[1] ? k * s * 0.17 : 0) + (f[0] ? 0 : k * s * 0.17), -s * 0.08 + f[1] * s * 0.1, s * 0.07, 0, 6.28); ctx.fill(); }
    ctx.fillStyle = "#FF9A3C"; ctx.beginPath(); ctx.moveTo(f[0] * s * 0.34 - 4, s * 0.06 + f[1] * s * 0.18); ctx.lineTo(f[0] * s * 0.34 + 4, s * 0.06 + f[1] * s * 0.18); ctx.lineTo(f[0] * s * 0.46, s * 0.14 + f[1] * s * 0.24); ctx.fill();
    ctx.restore();
  }
  function loop(now) { const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now; if (state === "play" || state === "dying") update(dt); draw(dt); requestAnimationFrame(loop); }

  // ---------- ovládání
  window.addEventListener("keydown", (e) => { if (e.target.tagName === "INPUT") return; const k = e.key; const m = { ArrowUp: [0, 1], w: [0, 1], ArrowDown: [0, -1], s: [0, -1], ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0], " ": [0, 1] }[k]; if (!m) return; e.preventDefault(); if (state === "menu" || state === "over") { if (k === " " || k === "ArrowUp") start(); return; } hop(m[0], m[1]); });
  let sw = null;
  cv.addEventListener("pointerdown", (e) => { sw = { x: e.clientX, y: e.clientY, t: Date.now() }; });
  window.addEventListener("pointerup", (e) => { if (!sw || state !== "play") { sw = null; return; } const dx = e.clientX - sw.x, dy = e.clientY - sw.y; sw = null; if (Math.hypot(dx, dy) < 22) return hop(0, 1); if (Math.abs(dx) > Math.abs(dy)) hop(dx > 0 ? 1 : -1, 0); else hop(0, dy < 0 ? 1 : -1); });
  function start() { reset(); beep(660, 0.1); }
  $("btn-go").onclick = start; $("btn-again").onclick = start;
  $("btn-lb").onclick = () => Arc.openLb("hop"); $("btn-lb2").onclick = () => Arc.openLb("hop");
  Arc.wire(); Arc.applyLang(); $("start-best").textContent = best ? L("bestIs", best) : "";
  rows = new Map(); for (let r = -4; r < 24; r++) gen(r); player = { c: 4, r: 0, t: 1, face: 0, squash: 0 }; cam = -3; camFloor = -3; score = 0; coins = 0; particles = []; state = "menu";
  requestAnimationFrame(loop);
})();
