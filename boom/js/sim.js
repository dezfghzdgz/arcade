// Simulace Boom. Čistá data, žádné kreslení – běží na hostiteli (a u klienta pro predikci vlastního pohybu).
window.Sim = (() => {
  const T = BM_CONFIG.tuning;
  const W = 360, H = 600, CELL = 6, GW = W / CELL, GH = H / CELL;   // 60 x 100 buněk
  const R = 9;

  const COLORS = ["#FF5E7E", "#5EE1D0", "#FFCF5A", "#8A5CFF", "#B6FF5A", "#FF9A3C", "#6FC3FF", "#FF7AD9"];
  const TEAM_COLORS = ["#FF5E7E", "#5EE1D0"];
  const MODES = { classic: { teams: false }, chaos: { teams: false } };
  // schopnosti (power-upy) a jejich váha při spawnu
  const POWERUPS = { bomb: 4, speed: 3, shield: 3, giant: 2, gun: 3, freeze: 2, frenzy: 2 };
  // frekvence schopností (sekundy mezi spawny) podle nastavení
  const PU_RATE = { none: 0, rare: 13, normal: 7, many: 3.5 };
  // obtížnost botů -> skill 0..1
  const BOT_SKILL = { easy: [0.15, 0.35], mid: [0.45, 0.65], hard: [0.8, 1.0], mix: [0.15, 1.0] };
  const BOT_STYLES = ["painter", "hunter", "collector", "camper"];

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const mulberry = (a) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  // ---------- svět
  function create(seed, opts = {}) {
    const rand = mulberry(seed || Date.now());
    const obstacles = [];
    const n = 3 + Math.floor(rand() * 2);
    for (let i = 0; i < n; i++) {
      const w = 30 + rand() * 50, h = 30 + rand() * 60;
      obstacles.push({ x: 40 + rand() * (W - 80 - w), y: 90 + rand() * (H - 180 - h), w, h });
    }
    const mode = MODES[opts.mode] ? opts.mode : "classic";
    return {
      seed, obstacles, mode, teams: MODES[mode].teams,
      paint: new Uint8Array(GW * GH), counts: new Uint16Array(9), bombs: [], round: 0,
      players: [], powerups: [], projectiles: [],
      time: opts.seconds || T.roundSeconds, roundSeconds: opts.seconds || T.roundSeconds,
      target: opts.target || 0,                       // cílové skóre (0 = jen na čas)
      puEvery: PU_RATE[opts.pu] ?? T.powerupEvery,     // 0 = žádné schopnosti
      phase: "countdown", countdown: 3,
      dirty: [], events: [], nextPowerup: 4, puId: 1,
      objective: null, objTimer: 0, client: !!opts.client,
    };
  }

  function addPlayer(w, p) {
    const idx = w.players.length;
    if (idx >= T.maxPlayers) return null;
    const pl = Object.assign({ x: 0, y: 0, vx: 0, vy: 0, dir: 0, dash: 0, dashCd: 0, stun: 0, speedBoost: 0, shield: false, giant: 0, gun: 0, bomb: 0, frenzy: 0, dead: 0, score: 0, kos: 0,
      input: { dx: 0, dy: 0, dash: false }, bot: false, hat: "none", pattern: "none", pref: -1, ai: {}, skill: 0.5, style: "painter" }, p, { slot: idx });
    pl.ci = pickColor(w, pl.pref);
    pl.team = idx % 2;
    placeAtStart(w, pl, idx);
    w.players.push(pl);
    return pl;
  }
  function pickColor(w, pref) {
    const used = new Set(w.players.map(p => p.ci));
    if (pref >= 0 && !used.has(pref)) return pref;
    const free = COLORS.map((_, i) => i).filter(i => !used.has(i));
    return free.length ? free[Math.floor(Math.random() * free.length)] : 0;
  }
  function removePlayer(w, id) { w.players = w.players.filter(p => p.id !== id); reindex(w); }
  function reindex(w) { w.players.forEach((p, i) => { p.slot = i; p.team = i % 2; }); }
  const colorOf = (w, p) => w.teams ? TEAM_COLORS[p.team] : COLORS[p.ci];
  const ownerOf = (w, p) => w.teams ? p.team + 1 : p.slot + 1;
  const palette = (w) => w.teams ? TEAM_COLORS : w.players.map(p => COLORS[p.ci]);

  function placeAtStart(w, p, i) {
    const spots = [[30, 40], [W - 30, H - 40], [W - 30, 40], [30, H - 40], [W / 2, 30], [W / 2, H - 30], [30, H / 2], [W - 30, H / 2]];
    p.x = spots[i % 8][0]; p.y = spots[i % 8][1];
  }

  function resetRound(w, seed, opts = {}) {
    const fresh = create(seed, opts);
    Object.assign(w, { obstacles: fresh.obstacles, mode: fresh.mode, teams: fresh.teams, paint: fresh.paint, counts: fresh.counts, bombs: [], round: 0, powerups: [], projectiles: [],
      time: fresh.time, roundSeconds: fresh.roundSeconds, target: fresh.target, puEvery: fresh.puEvery, phase: "countdown", countdown: 3, dirty: [], events: [], nextPowerup: 4, seed, objective: null, objTimer: 0, results: null });
    if (opts.bots) w.players.forEach(p => { if (p.bot) assignBot(p, opts.bots); });
    reindex(w);
    // preferované barvy: kdo má, dostane; kolize řeší náhoda
    const order = [...w.players].sort(() => Math.random() - 0.5); const used = new Set();
    for (const p of order) { p.ci = -1; if (p.pref >= 0 && !used.has(p.pref)) { p.ci = p.pref; used.add(p.pref); } }
    for (const p of order) if (p.ci < 0) { const free = COLORS.map((_, i) => i).filter(i => !used.has(i)); p.ci = free[Math.floor(Math.random() * free.length)]; used.add(p.ci); }
    w.players.forEach((p, i) => { placeAtStart(w, p, i); Object.assign(p, { vx: 0, vy: 0, dash: 0, dashCd: 0, stun: 0, speedBoost: 0, shield: false, giant: 0, gun: 0, bomb: 0, frenzy: 0, dead: 0, score: 0, kos: 0, wins: 0, deaths: 0, passCd: 0, input: { dx: 0, dy: 0, dash: false }, ai: {} }); });
  }

  // ---------- malování
  function paintCircle(w, cx, cy, radius, owner) {
    const c0 = Math.max(0, Math.floor((cx - radius) / CELL)), c1 = Math.min(GW - 1, Math.floor((cx + radius) / CELL));
    const r0 = Math.max(0, Math.floor((cy - radius) / CELL)), r1 = Math.min(GH - 1, Math.floor((cy + radius) / CELL));
    const rr = radius * radius;
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      const px = c * CELL + CELL / 2, py = r * CELL + CELL / 2;
      if ((px - cx) ** 2 + (py - cy) ** 2 > rr || inObstacle(w, px, py)) continue;
      const idx = r * GW + c, prev = w.paint[idx];
      if (prev === owner) continue;
      w.paint[idx] = owner; w.counts[prev]--; w.counts[owner]++;
      w.dirty.push((idx << 4) | owner);
    }
  }
  function inObstacle(w, x, y) { for (const o of w.obstacles) if (x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h) return true; return false; }
  function ownerAt(w, x, y) { return w.paint[clamp(Math.floor(y / CELL), 0, GH - 1) * GW + clamp(Math.floor(x / CELL), 0, GW - 1)]; }
  function blocked(w, x, y, r = R) { for (const o of w.obstacles) if (x + r > o.x && x - r < o.x + o.w && y + r > o.y && y - r < o.y + o.h) return true; return false; }
  // vytlačí hráče z překážky nejkratší cestou (proti zaseknutí)
  function unstick(w, p) {
    for (const o of w.obstacles) {
      if (!(p.x + R > o.x && p.x - R < o.x + o.w && p.y + R > o.y && p.y - R < o.y + o.h)) continue;
      const dl = p.x + R - o.x, dr = o.x + o.w - (p.x - R), dt = p.y + R - o.y, db = o.y + o.h - (p.y - R);
      const m = Math.min(dl, dr, dt, db);
      if (m === dl) p.x -= dl + 0.5; else if (m === dr) p.x += dr + 0.5; else if (m === dt) p.y -= dt + 0.5; else p.y += db + 0.5;
    }
    p.x = clamp(p.x, R, W - R); p.y = clamp(p.y, R, H - R);
  }
  function freeSpot(w, margin = 20) { let x, y, t = 0; do { x = rnd(margin, W - margin); y = rnd(margin, H - margin); } while (blocked(w, x, y, 14) && t++ < 30); return { x, y }; }

  // ---------- cíle módů
  function newObjective(w) {
    if (MODES[w.mode].obj === "target") { const s = freeSpot(w, 30); w.objective = { kind: "target", x: s.x, y: s.y, r: 16 }; }
    if (MODES[w.mode].obj === "zone") { const s = freeSpot(w, 70); w.objective = { kind: "zone", x: s.x, y: s.y, r: 48 }; w.objTimer = 15; }
  }

  // ---------- krok: bomba koluje, komu bouchne v ruce, vypadává; poslední vyhrává kolo
  function step(w, dt) {
    w.events.length = 0;
    if (w.phase === "countdown") { const b = Math.ceil(w.countdown); w.countdown -= dt; if (Math.ceil(w.countdown) !== b && w.countdown > 0) w.events.push({ t: "count", n: Math.ceil(w.countdown) }); if (w.countdown <= 0) { w.phase = "play"; w.events.push({ t: "go" }); startRound(w); } return; }
    if (w.phase !== "play") return;
    w.time -= dt;
    if (w.time <= 0) { w.time = 0; w.phase = "end"; w.events.push({ t: "end" }); w.results = results(w); return; }
    w.roundT = (w.roundT || 0) + dt;
    for (const b of w.bombs) { b.fuse -= dt; b.beep = (b.beep || 0) - dt; if (b.beep <= 0) { b.beep = Math.max(0.12, b.fuse / 6); w.events.push({ t: "beep", id: b.holder, fast: b.fuse < 3 }); } }
    for (const p of w.players) { if (p.dead > 0) continue; if (p.bot) botThink(w, p, dt); movePlayer(w, p, dt); }
    for (let i = 0; i < w.players.length; i++) for (let j = i + 1; j < w.players.length; j++) collide(w, w.players[i], w.players[j]);
    for (const p of w.players) if (p.dead <= 0) unstick(w, p);
    for (const b of w.bombs) if (b.fuse <= 0) explode(w, b);
    const alive = w.players.filter(p => p.dead <= 0);
    if (alive.length <= 1 && w.players.length > 1) { const win = alive[0]; if (win) { win.score += 3; win.wins++; w.events.push({ t: "roundWin", id: win.id }); } if (w.players.some(p => p.score >= T.winPoints)) { w.phase = "end"; w.events.push({ t: "end" }); w.results = results(w); return; } w.countdown = 2.5; w.phase = "countdown"; w.events.push({ t: "newRound" }); }
  }
  function startRound(w) {
    w.round = (w.round || 0) + 1; w.roundT = 0; w.bombs = [];
    w.players.forEach((p, i) => { placeAtStart(w, p, i); p.dead = 0; p.stun = 0; p.dash = 0; p.dashCd = 0; p.passCd = 0; p.vx = p.vy = 0; });
    const n = w.mode === "chaos" ? 2 : 1;
    const cand = [...w.players].sort(() => Math.random() - 0.5).slice(0, n);
    for (const c of cand) w.bombs.push({ holder: c.id, fuse: T.fuseMin + Math.random() * (T.fuseMax - T.fuseMin), beep: 0 });
  }
  const holding = (w, p) => w.bombs.some(b => b.holder === p.id);
  function explode(w, b) {
    const h = w.players.find(p => p.id === b.holder); w.bombs = w.bombs.filter(x => x !== b);
    if (!h) return;
    h.dead = 1e9; h.deaths++; w.events.push({ t: "boom", id: h.id, x: h.x, y: h.y });
    for (const o of w.players) if (o !== h && o.dead <= 0) { const d = Math.hypot(o.x - h.x, o.y - h.y); if (d < 90) { o.stun = Math.max(o.stun, 0.8); o.vx = (o.x - h.x) / (d || 1) * 320; o.vy = (o.y - h.y) / (d || 1) * 320; } }
    // bomba pokračuje u dalšího přeživšího (kolo běží dál)
    const alive = w.players.filter(p => p.dead <= 0 && !holding(w, p));
    if (alive.length > 1) { const n = alive[Math.floor(Math.random() * alive.length)]; w.bombs.push({ holder: n.id, fuse: T.fuseMin + Math.random() * (T.fuseMax - T.fuseMin), beep: 0 }); w.events.push({ t: "newBomb", id: n.id }); }
  }
  function movePlayer(w, p, dt) {
    p.dashCd = Math.max(0, p.dashCd - dt); p.stun = Math.max(0, p.stun - dt); p.passCd = Math.max(0, (p.passCd || 0) - dt);
    const speed = holding(w, p) ? T.speedBomb : T.speed;
    let dx = p.input.dx, dy = p.input.dy; const len = Math.hypot(dx, dy); if (len > 1) { dx /= len; dy /= len; }
    if (p.input.dash && p.dashCd <= 0 && p.stun <= 0 && len > 0.2) { p.dash = T.dashTime; p.dashCd = T.dashCooldown; p.dashDx = dx / (len || 1); p.dashDy = dy / (len || 1); w.events.push({ t: "dash", id: p.id, x: p.x, y: p.y }); }
    p.input.dash = false;
    if (p.stun > 0) { p.vx *= 0.9; p.vy *= 0.9; } else if (p.dash > 0) { p.dash -= dt; p.vx = p.dashDx * T.dashSpeed; p.vy = p.dashDy * T.dashSpeed; } else { p.vx += (dx * speed - p.vx) * Math.min(1, dt * 14); p.vy += (dy * speed - p.vy) * Math.min(1, dt * 14); }
    if (Math.hypot(p.vx, p.vy) > 5) p.dir = Math.atan2(p.vy, p.vx);
    const nx = clamp(p.x + p.vx * dt, R, W - R), ny = clamp(p.y + p.vy * dt, R, H - R);
    p.x = blocked(w, nx, p.y) ? p.x : nx; p.y = blocked(w, p.x, ny) ? p.y : ny;
  }
  function collide(w, a, b) {
    if (a.dead > 0 || b.dead > 0) return;
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy); if (d >= R * 2 || d === 0) return;
    const nx = dx / d, ny = dy / d, overlap = R * 2 - d; a.x -= nx * overlap / 2; a.y -= ny * overlap / 2; b.x += nx * overlap / 2; b.y += ny * overlap / 2;
    // předání bomby dotykem
    for (const bomb of w.bombs) {
      const from = bomb.holder === a.id ? a : bomb.holder === b.id ? b : null; if (!from) continue; const to = from === a ? b : a;
      if (from.passCd > 0 || holding(w, to)) continue;
      bomb.holder = to.id; to.passCd = T.passCd; from.passCd = T.passCd; to.stun = Math.max(to.stun, 0.25); w.events.push({ t: "pass", from: from.id, to: to.id, x: to.x, y: to.y });
    }
    if (a.dash > 0 && !holding(w, a) && b.dash <= 0) { b.vx = nx * 300; b.vy = ny * 300; b.stun = Math.max(b.stun, 0.3); }
    if (b.dash > 0 && !holding(w, b) && a.dash <= 0) { a.vx = -nx * 300; a.vy = -ny * 300; a.stun = Math.max(a.stun, 0.3); }
  }
  // ---------- boti: s bombou honí nejbližšího, bez bomby utíkají od držitele
  function botThink(w, p, dt) {
    const ai = p.ai, sk = p.skill; ai.t = (ai.t || 0) - dt; if (ai.t > 0) return; ai.t = 0.15 + (1 - sk) * 0.4;
    const alive = w.players.filter(o => o !== p && o.dead <= 0);
    if (!alive.length) { p.input.dx = p.input.dy = 0; return; }
    let dx = 0, dy = 0;
    if (holding(w, p)) { let t = null, td = 1e9; for (const o of alive) { const d = Math.hypot(o.x - p.x, o.y - p.y) + (o.passCd > 0 ? 200 : 0); if (d < td) { td = d; t = o; } } dx = t.x - p.x; dy = t.y - p.y; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d; if (d < 60 && p.dashCd <= 0 && Math.random() < 0.2 + sk * 0.6) p.input.dash = true; }
    else { for (const o of alive) if (holding(w, o)) { const d = Math.hypot(p.x - o.x, p.y - o.y) || 1; const wgt = 1 / Math.max(0.2, d / 120); dx += (p.x - o.x) / d * wgt; dy += (p.y - o.y) / d * wgt; }
      // od stěn a překážek pryč, ať se nezasekne v rohu
      dx += (W / 2 - p.x) / W * 0.6; dy += (H / 2 - p.y) / H * 0.6;
      for (const ob of w.obstacles) { const cx = ob.x + ob.w / 2, cy = ob.y + ob.h / 2, d = Math.hypot(p.x - cx, p.y - cy); if (d < 70) { dx += (p.x - cx) / d * 0.8; dy += (p.y - cy) / d * 0.8; } }
      const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l; if (sk < 0.4 && Math.random() < 0.1) { dx = rnd(-1, 1); dy = rnd(-1, 1); }
      const hold = alive.find(o => holding(w, o)); if (hold && Math.hypot(hold.x - p.x, hold.y - p.y) < 50 && p.dashCd <= 0 && Math.random() < sk) p.input.dash = true; }
    if (blocked(w, p.x + dx * 16, p.y + dy * 16)) { const s_ = ai.side || (ai.side = Math.random() < 0.5 ? 1 : -1); [dx, dy] = [-dy * s_, dx * s_]; }
    p.input.dx = dx; p.input.dy = dy;
  }

  // ---------- výsledky
  function coverage(w) {
    const total = GW * GH;
    return w.players.map(p => ({ id: p.id, name: p.name, color: colorOf(w, p), team: p.team, slot: p.slot, bot: p.bot, pct: Math.round(1000 * w.counts[ownerOf(w, p)] / total) / 10, score: Math.round(p.score * 10) / 10, kos: p.kos }));
  }
  function results(w) {
    const rows = coverage(w);
    rows.forEach(r => { const p = w.players.find(q => q.id === r.id); r.score = p.score; r.wins = p.wins; });
    rows.sort((a, b) => b.score - a.score);
    rows.forEach((r, i) => { r.rank = i + 1; r.value = r.score; r.coins = r.bot ? 0 : Math.round(10 + Math.min(60, r.score * 4) + (i === 0 ? 25 : i === 1 ? 10 : 0)); r.win = i === 0; });
    return rows;
  }

  // ---------- serializace pro síť
  function packPlayers(w) {
    return w.players.map(p => [p.id, Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10, Math.round(p.dir * 100) / 100,
      (p.stun > 0 ? 1 : 0) | (p.dash > 0 ? 2 : 0) | (p.dead > 0 ? 8 : 0) | (holding(w, p) ? 128 : 0),
      0, p.dashCd > 0 ? 1 : 0, p.score, holding(w, p) ? Math.round((w.bombs.find(b => b.holder === p.id) || {}).fuse * 10) / 10 : 0]);
  }
  function packPaint(w) { let out = "", prev = w.paint[0], n = 0; for (let i = 0; i < w.paint.length; i++) { const v = w.paint[i]; if (v === prev) n++; else { out += prev + ":" + n + ","; prev = v; n = 1; } } return out + prev + ":" + n; }
  function unpackPaint(w, s) { w.paint.fill(0); w.counts.fill(0); let i = 0; for (const part of s.split(",")) { const [v, n] = part.split(":").map(Number); w.paint.fill(v, i, i + n); w.counts[v] += n; i += n; } }
  function lobbyInfo(w) { return w.players.map(p => ({ id: p.id, name: p.name, color: colorOf(w, p), ci: p.ci, team: p.team, hat: p.hat, pattern: p.pattern, bot: !!p.bot, skill: p.bot ? p.skill : undefined, style: p.bot ? p.style : undefined })); }
  // přiřadí botovi úroveň a styl podle nastavení obtížnosti
  function assignBot(p, difficulty) {
    const [a, b] = BOT_SKILL[difficulty] || BOT_SKILL.mix;
    p.skill = Math.round((a + Math.random() * (b - a)) * 100) / 100;
    p.style = BOT_STYLES[Math.floor(Math.random() * BOT_STYLES.length)];
    p.ai = {};
  }
  const skillTier = (s) => s < 0.4 ? "easy" : s < 0.75 ? "mid" : "hard";

  return { W, H, CELL, GW, GH, R, COLORS, TEAM_COLORS, MODES, POWERUPS, PU_RATE, BOT_SKILL, create, addPlayer, removePlayer, resetRound, step, movePlayer, coverage, results, packPlayers, packPaint, unpackPaint, ownerAt, paintCircle, blocked, palette, lobbyInfo, colorOf, assignBot, skillTier };
})();
