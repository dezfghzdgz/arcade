(() => {
  const { $, get, set, L, beep } = Arc;
  Arc.texts({
    en: { hole: "Hole", strokes: "Strokes", retry: "Retry hole", nextHole: "Next hole", hint: "Drag back from anywhere, release to putt. Water = +1 stroke.", holeInOne: "HOLE IN ONE!", eagle: "Eagle!", birdie: "Birdie!", parT: "Par", bogey: "Bogey", done: "In the hole", tooMany: "Too many strokes", starsTotal: (n) => `★ ${n}`, sum: (s, p) => `${s} strokes · par ${p}` },
    cs: { hole: "Jamka", strokes: "Údery", retry: "Znovu jamku", nextHole: "Další jamka", hint: "Táhni kamkoli dozadu a pusť = odpal. Voda = +1 úder.", holeInOne: "HOLE IN ONE!", eagle: "Eagle!", birdie: "Birdie!", parT: "Par", bogey: "Bogey", done: "V jamce", tooMany: "Moc úderů", starsTotal: (n) => `★ ${n}`, sum: (s, p) => `${s} úderů · par ${p}` },
  });
  const cv = $("cv"), ctx = cv.getContext("2d"), W = cv.width, H = cv.height, R = 7, HOLE_R = 11, MAXV = 720, X0 = 18, X1 = W - 18, Y0 = 18, Y1 = H - 18;
  const mulberry = (a) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  let level = get("golf_level", 1), maxLevel = get("golf_max", 1), stars = get("golf_stars", {}), course, ball, strokes, aim = null, state = "play", last = 0, t = 0, particles = [], trail = [], lastRest;

  // ---------- generátor jamek
  function gen(lv) {
    const rnd = mulberry(lv * 7919 + 13), r = (a, b) => a + rnd() * (b - a), d = Math.min(1, lv / 30);
    const c = { walls: [], water: [], sand: [], bumpers: [], movers: [], tee: { x: r(90, W - 90), y: Y1 - 34 }, hole: { x: r(60, W - 60), y: Y0 + 50 }, par: 2 };
    const feats = lv === 1 ? [] : lv === 2 ? ["blocks"] : lv === 3 ? ["gate"] : lv === 4 ? ["bumpers", "gate"] : [];
    if (lv > 4) { const pool = ["gate", "zigzag", "blocks", "bumpers", "water", "sand", "zigzag", "gate"]; if (lv > 7) pool.push("mover", "water"); const n = lv < 7 ? 1 + Math.floor(rnd() * 2) : 2 + Math.floor(rnd() * 2) + (d > 0.55 ? 1 : 0); for (let i = 0; i < n; i++) feats.push(pool[Math.floor(rnd() * pool.length)]); }
    const top = Y0 + 110, bottom = Y1 - 90, band = (bottom - top) / Math.max(1, feats.length);
    feats.forEach((f, i) => {
      const y = top + band * (i + 0.5);
      if (f === "gate") { const gw = r(78, 110) - d * 18, gx = r(X0 + 20, X1 - 20 - gw); c.walls.push({ x: X0, y: y - 7, w: gx - X0, h: 14 }, { x: gx + gw, y: y - 7, w: X1 - gx - gw, h: 14 }); c.par++; }
      else if (f === "zigzag") { const left = rnd() < 0.5, gap = r(70, 95); c.walls.push(left ? { x: X0, y: y - 7, w: X1 - X0 - gap, h: 14 } : { x: X0 + gap, y: y - 7, w: X1 - X0 - gap, h: 14 }); c.par++; }
      else if (f === "blocks") { const n = 2 + Math.floor(rnd() * 2); for (let k = 0; k < n; k++) { const w = r(34, 60), h = r(22, 40); c.walls.push({ x: X0 + 20 + (X1 - X0 - 40 - w) * (k + rnd() * 0.6) / n, y: y - h / 2 + r(-band * 0.2, band * 0.2), w, h }); } }
      else if (f === "bumpers") { const n = 2 + Math.floor(rnd() * 2); for (let k = 0; k < n; k++) c.bumpers.push({ x: X0 + 40 + (X1 - X0 - 80) * (k + 0.5) / n + r(-15, 15), y: y + r(-band * 0.25, band * 0.25), r: r(13, 18) }); }
      else if (f === "water") { const bw = r(64, 92) - d * 14, bx = r(X0 + 10, X1 - 10 - bw), hh = r(30, 46); if (bx - X0 > 4) c.water.push({ x: X0, y: y - hh / 2, w: bx - X0, h: hh }); if (X1 - bx - bw > 4) c.water.push({ x: bx + bw, y: y - hh / 2, w: X1 - bx - bw, h: hh }); c.par++; }
      else if (f === "sand") { const w = r(90, 180), h = r(40, 70); c.sand.push({ x: r(X0, X1 - w), y: y - h / 2, w, h }); }
      else if (f === "mover") { c.movers.push({ bx: (X0 + X1) / 2, y: y - 7, w: r(80, 120), h: 14, amp: (X1 - X0) / 2 - 50, spd: r(0.9, 1.6) + d, ph: rnd() * 6.28 }); c.walls.push({ x: X0, y: y - 7, w: 20, h: 14 }, { x: X1 - 20, y: y - 7, w: 20, h: 14 }); }
    });
    c.par = Math.min(6, c.par);
    return c;
  }
  const movers = () => course.movers.map(m => { const cx = m.bx + Math.sin(t * m.spd + m.ph) * m.amp; return { x: cx - m.w / 2, y: m.y, w: m.w, h: m.h }; });
  const inRect = (p, q) => p.x > q.x && p.x < q.x + q.w && p.y > q.y && p.y < q.y + q.h;

  function load() {
    course = gen(level); strokes = 0; ball = { x: course.tee.x, y: course.tee.y, vx: 0, vy: 0, sink: 0, moving: false }; lastRest = { x: ball.x, y: ball.y }; state = "play"; aim = null; particles = []; trail = [];
    $("over").classList.add("hidden"); hud();
  }
  function hud() { $("hole").textContent = level; $("par").textContent = course.par; $("strokes").textContent = strokes; const total = Object.values(stars).reduce((a, b) => a + b, 0); $("stars-total").textContent = L("starsTotal", total); $("btn-prev").disabled = level <= 1; $("btn-next").disabled = level >= maxLevel; }

  // ---------- fyzika
  function collideRect(q) {
    const cx = Math.max(q.x, Math.min(ball.x, q.x + q.w)), cy = Math.max(q.y, Math.min(ball.y, q.y + q.h)); let dx = ball.x - cx, dy = ball.y - cy, dist = Math.hypot(dx, dy);
    if (dist >= R) return false;
    if (dist < 0.001) { const l = ball.x - q.x, rr = q.x + q.w - ball.x, tt = ball.y - q.y, b = q.y + q.h - ball.y, m = Math.min(l, rr, tt, b); dx = m === l ? -1 : m === rr ? 1 : 0; dy = m === tt ? -1 : m === b ? 1 : 0; dist = 0; }
    else { dx /= dist; dy /= dist; }
    ball.x += dx * (R - dist); ball.y += dy * (R - dist);
    const vn = ball.vx * dx + ball.vy * dy; if (vn < 0) { ball.vx -= 1.75 * vn * dx; ball.vy -= 1.75 * vn * dy; if (Math.abs(vn) > 60) beep(220 + Math.min(300, Math.abs(vn) / 3), 0.04, "square", 0.04); }
    return true;
  }
  function step(dt) {
    t += dt;
    if (state === "sinking") { ball.sink += dt * 3; ball.x += (course.hole.x - ball.x) * Math.min(1, dt * 12); ball.y += (course.hole.y - ball.y) * Math.min(1, dt * 12); if (ball.sink >= 1) finish(); return; }
    if (!ball.moving) return;
    const SUB = 6, h = dt / SUB, mv = movers();
    for (let k = 0; k < SUB; k++) {
      ball.x += ball.vx * h; ball.y += ball.vy * h;
      // okraje
      if (ball.x < X0 + R) { ball.x = X0 + R; ball.vx = Math.abs(ball.vx) * 0.75; } if (ball.x > X1 - R) { ball.x = X1 - R; ball.vx = -Math.abs(ball.vx) * 0.75; }
      if (ball.y < Y0 + R) { ball.y = Y0 + R; ball.vy = Math.abs(ball.vy) * 0.75; } if (ball.y > Y1 - R) { ball.y = Y1 - R; ball.vy = -Math.abs(ball.vy) * 0.75; }
      for (const q of course.walls) collideRect(q); for (const q of mv) collideRect(q);
      for (const b of course.bumpers) { const dx = ball.x - b.x, dy = ball.y - b.y, dd = Math.hypot(dx, dy); if (dd < R + b.r && dd > 0) { const nx = dx / dd, ny = dy / dd; ball.x = b.x + nx * (R + b.r); ball.y = b.y + ny * (R + b.r); const vn = ball.vx * nx + ball.vy * ny; if (vn < 0) { ball.vx -= 2.3 * vn * nx; ball.vy -= 2.3 * vn * ny; const sp = Math.hypot(ball.vx, ball.vy); if (sp > MAXV) { ball.vx *= MAXV / sp; ball.vy *= MAXV / sp; } b.hit = 0.25; beep(700, 0.06, "sine", 0.06); } } }
    }
    // tření (písek brzdí víc)
    const sand = course.sand.some(q => inRect(ball, q)), k = sand ? 3.6 : 1.05; const f = Math.max(0, 1 - k * dt); ball.vx *= f; ball.vy *= f;
    const sp = Math.hypot(ball.vx, ball.vy); if (sp < (sand ? 18 : 9)) { ball.vx = ball.vy = 0; ball.moving = false; lastRest = { x: ball.x, y: ball.y }; if (strokes >= 10) fail(); }
    trail.push({ x: ball.x, y: ball.y, life: 0.3 }); if (trail.length > 30) trail.shift();
    // jamka: pomalý míček spadne, rychlý přeletí a jen se vychýlí
    const hd = Math.hypot(ball.x - course.hole.x, ball.y - course.hole.y);
    if (hd < HOLE_R - 2) { if (sp < 420) { state = "sinking"; ball.moving = false; beep(880, 0.1); setTimeout(() => beep(1320, 0.14), 90); } else { ball.vx += (course.hole.x - ball.x) * 3; ball.vy += (course.hole.y - ball.y) * 3; } }
    // voda
    if (course.water.some(q => inRect(ball, q))) { for (let i = 0; i < 16; i++) particles.push({ x: ball.x, y: ball.y, vx: (Math.random() - 0.5) * 160, vy: (Math.random() - 0.7) * 160, life: 0.5, c: "#9FD8FF" }); beep(160, 0.25, "sine", 0.08); strokes++; ball.x = lastRest.x; ball.y = lastRest.y; ball.vx = ball.vy = 0; ball.moving = false; hud(); if (strokes >= 10) fail(); }
  }
  function shoot(vx, vy) { if (state !== "play" || ball.moving) return; ball.vx = vx; ball.vy = vy; ball.moving = true; strokes++; hud(); beep(300 + Math.hypot(vx, vy) / 3, 0.07, "triangle", 0.08); }
  async function finish() {
    state = "done"; const s = strokes <= course.par ? 3 : strokes === course.par + 1 ? 2 : 1, prev = stars[level] || 0; if (s > prev) stars[level] = s; set("golf_stars", stars);
    if (level >= maxLevel) { maxLevel = level + 1; set("golf_max", maxLevel); }
    const diff = strokes - course.par, title = strokes === 1 ? L("holeInOne") : diff <= -2 ? L("eagle") : diff === -1 ? L("birdie") : diff === 0 ? L("parT") : diff === 1 ? L("bogey") : L("done");
    if (strokes === 1 || diff < 0) for (let i = 0; i < 60; i++) particles.push({ x: course.hole.x, y: course.hole.y, vx: (Math.random() - 0.5) * 420, vy: (Math.random() - 0.9) * 420, life: 1.1, c: ["#FF5E7E", "#5EE1D0", "#FFCF5A", "#8A5CFF", "#B6FF5A"][i % 5] });
    setTimeout(async () => {
      $("over").classList.remove("hidden"); $("over-title").textContent = title; $("over-stars").innerHTML = [1, 2, 3].map(i => `<i class="${i <= s ? "on" : ""}">★</i>`).join(""); $("over-score").textContent = L("sum", strokes, course.par); $("over-rank").textContent = ""; $("btn-again").textContent = L("nextHole");
      hud(); const total = Object.values(stars).reduce((a, b) => a + b, 0);
      Arc.progress.save("golf", { level: maxLevel, stars: total });
      const rk = await Arc.submit("golf", total, 5 + s * 5 + (strokes === 1 ? 10 : 0)); if (rk) $("over-rank").textContent = L("rank", rk);
    }, strokes === 1 ? 900 : 350);
  }
  function fail() { state = "done"; beep(150, 0.3, "sawtooth", 0.1); $("over").classList.remove("hidden"); $("over-title").textContent = L("tooMany"); $("over-stars").innerHTML = ""; $("over-score").textContent = L("sum", strokes, course.par); $("over-rank").textContent = ""; $("btn-again").textContent = L("retry"); }

  // ---------- kreslení
  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }
  function draw(dt) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#2A1B4A"; rr(0, 0, W, H, 18); ctx.fill();
    for (let i = 0; i < 14; i++) { ctx.fillStyle = i % 2 ? "#3E9A5E" : "#43A364"; ctx.fillRect(X0, Y0 + i * (Y1 - Y0) / 14, X1 - X0, (Y1 - Y0) / 14 + 1); }
    for (const q of course.sand) { ctx.fillStyle = "#E8D9A8"; rr(q.x, q.y, q.w, q.h, 16); ctx.fill(); ctx.fillStyle = "rgba(0,0,0,.05)"; for (let k = 0; k < 8; k++) ctx.fillRect(q.x + ((k * 37) % q.w), q.y + ((k * 23) % q.h), 3, 3); }
    for (const q of course.water) { ctx.fillStyle = "#2F7BD0"; rr(q.x, q.y, q.w, q.h, 10); ctx.fill(); ctx.strokeStyle = "rgba(255,255,255,.25)"; ctx.lineWidth = 2; for (let x = q.x + 8; x < q.x + q.w - 10; x += 22) { const o = Math.sin(t * 2 + x) * 2; ctx.beginPath(); ctx.moveTo(x, q.y + q.h / 2 + o); ctx.quadraticCurveTo(x + 5, q.y + q.h / 2 - 3 + o, x + 10, q.y + q.h / 2 + o); ctx.stroke(); } }
    // jamka + vlajka
    const hx = course.hole.x, hy = course.hole.y; ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.beginPath(); ctx.ellipse(hx, hy + 2, HOLE_R + 3, HOLE_R + 1, 0, 0, 6.28); ctx.fill(); ctx.fillStyle = "#10081E"; ctx.beginPath(); ctx.arc(hx, hy, HOLE_R, 0, 6.28); ctx.fill();
    ctx.strokeStyle = "#F4F0E8"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx, hy - 44); ctx.stroke(); const wv = Math.sin(t * 5) * 3; ctx.fillStyle = "#FF5E7E"; ctx.beginPath(); ctx.moveTo(hx, hy - 44); ctx.quadraticCurveTo(hx + 12, hy - 40 + wv, hx + 24, hy - 36); ctx.lineTo(hx, hy - 28); ctx.fill();
    // odpaliště
    ctx.fillStyle = "rgba(255,255,255,.18)"; rr(course.tee.x - 16, course.tee.y - 10, 32, 20, 6); ctx.fill();
    // zdi (3D hrana)
    const wall = (q) => { ctx.fillStyle = "#1B1030"; rr(q.x, q.y + 3, q.w, q.h, 5); ctx.fill(); ctx.fillStyle = "#5A4A8A"; rr(q.x, q.y, q.w, q.h, 5); ctx.fill(); ctx.fillStyle = "rgba(255,255,255,.18)"; ctx.fillRect(q.x + 3, q.y + 2, Math.max(0, q.w - 6), 3); };
    for (const q of course.walls) wall(q); for (const q of movers()) { wall(q); ctx.fillStyle = "#FFCF5A"; ctx.fillRect(q.x + 4, q.y + q.h / 2 - 1, q.w - 8, 2); }
    for (const b of course.bumpers) { b.hit = Math.max(0, (b.hit || 0) - dt); const s = 1 + b.hit; ctx.fillStyle = "#C23A57"; ctx.beginPath(); ctx.arc(b.x, b.y + 3, b.r * s, 0, 6.28); ctx.fill(); ctx.fillStyle = "#FF5E7E"; ctx.beginPath(); ctx.arc(b.x, b.y, b.r * s, 0, 6.28); ctx.fill(); ctx.strokeStyle = "#fff"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(b.x, b.y, b.r * s * 0.55, 0, 6.28); ctx.stroke(); }
    // mantinel
    ctx.strokeStyle = "#5A4A8A"; ctx.lineWidth = 8; rr(X0 - 4, Y0 - 4, X1 - X0 + 8, Y1 - Y0 + 8, 14); ctx.stroke();
    // stopa + míček
    const skin = window.Meta && Meta.skin("ball"), col = (skin && skin.color) || "#FFFFFF", tr = window.Meta && Meta.skin("trail");
    for (const p of trail) { p.life -= dt; if (p.life <= 0) continue; ctx.globalAlpha = p.life * 1.6; ctx.fillStyle = tr ? tr.color : "rgba(255,255,255,.6)"; ctx.beginPath(); ctx.arc(p.x, p.y, R * p.life * 2.4, 0, 6.28); ctx.fill(); } ctx.globalAlpha = 1;
    if (state !== "done" || ball.sink < 1) { const s = state === "sinking" ? Math.max(0, 1 - ball.sink) : 1; ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.beginPath(); ctx.ellipse(ball.x + 2, ball.y + 3, R * s, R * 0.7 * s, 0, 0, 6.28); ctx.fill(); ctx.fillStyle = col; if (skin && skin.glow) { ctx.shadowColor = skin.glow; ctx.shadowBlur = 10; } ctx.beginPath(); ctx.arc(ball.x, ball.y, R * s, 0, 6.28); ctx.fill(); ctx.shadowBlur = 0; ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.beginPath(); ctx.arc(ball.x - 2, ball.y - 2, R * 0.35 * s, 0, 6.28); ctx.fill(); }
    // míření
    if (aim && state === "play" && !ball.moving) {
      const dx = aim.sx - aim.x, dy = aim.sy - aim.y, len = Math.min(150, Math.hypot(dx, dy)), a = Math.atan2(dy, dx), pw = len / 150;
      ctx.strokeStyle = `hsl(${120 - pw * 120}, 90%, 60%)`; ctx.lineWidth = 3; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(ball.x, ball.y); ctx.lineTo(ball.x + Math.cos(a) * (30 + pw * 110), ball.y + Math.sin(a) * (30 + pw * 110)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = "rgba(0,0,0,.4)"; rr(ball.x - 26, ball.y + 16, 52, 7, 4); ctx.fill(); ctx.fillStyle = `hsl(${120 - pw * 120}, 90%, 60%)`; rr(ball.x - 26, ball.y + 16, 52 * pw, 7, 4); ctx.fill();
    }
    for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 400 * dt; p.life -= dt; ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 2)); ctx.fillStyle = p.c; ctx.fillRect(p.x - 3, p.y - 3, 6, 6); } ctx.globalAlpha = 1; particles = particles.filter(p => p.life > 0);
    ctx.font = "900 13px Nunito, sans-serif"; ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.textAlign = "left"; ctx.fillText(`${L("hole")} ${level} · Par ${course.par}`, X0 + 6, Y1 - 6);
  }
  function loop(now) { const dt = Math.min(0.033, (now - last) / 1000 || 0); last = now; step(dt); draw(dt); requestAnimationFrame(loop); }

  // ---------- ovládání: táhni kamkoli, míří se od míčku opačným směrem
  const pos = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; };
  cv.addEventListener("pointerdown", (e) => { if (state !== "play" || ball.moving) return; const p = pos(e); aim = { sx: p.x, sy: p.y, x: p.x, y: p.y }; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener("pointermove", (e) => { if (!aim) return; const p = pos(e); aim.x = p.x; aim.y = p.y; });
  cv.addEventListener("pointerup", () => { if (!aim) return; const dx = aim.sx - aim.x, dy = aim.sy - aim.y, len = Math.min(150, Math.hypot(dx, dy)); aim = null; if (len < 8) return; const a = Math.atan2(dy, dx), v = (len / 150) * MAXV; shoot(Math.cos(a) * v, Math.sin(a) * v); });
  $("btn-reset").onclick = load; $("btn-replay").onclick = load;
  $("btn-again").onclick = () => { if (state === "done" && ball.sink >= 1) { level++; set("golf_level", level); } load(); };
  $("btn-prev").onclick = () => { if (level > 1) { level--; set("golf_level", level); load(); } };
  $("btn-next").onclick = () => { if (level < maxLevel) { level++; set("golf_level", level); load(); } };
  $("btn-lb").onclick = () => Arc.openLb("golf", (s) => "★ " + s);
  Arc.wire(); Arc.applyLang(); load(); requestAnimationFrame(loop);
  Arc.progress.load("golf", { level: maxLevel }).then(p => { if (p.level > maxLevel) { maxLevel = p.level; set("golf_max", maxLevel); hud(); } });
  window.__golf = { get course() { return course; }, get ball() { return ball; }, shoot, get state() { return state; } };
})();
