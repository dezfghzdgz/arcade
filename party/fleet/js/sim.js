// Fleet: námořní bitva. Loď má směr a rychlost, joystick = kam plout, tlačítko = salva z obou boků.
window.Sim = (() => {
  const T = FL_CONFIG.tuning;
  const W = 360, H = 600, R = 11, GW = 60, GH = 100, CELL = 6;
  const COLORS = ["#FF5E7E", "#5EE1D0", "#FFCF5A", "#8A5CFF", "#B6FF5A", "#FF9A3C", "#6FC3FF", "#FF7AD9"];
  const TEAM_COLORS = ["#FF5E7E", "#5EE1D0"];
  const MODES = { deathmatch: { teams: false }, teams: { teams: true }, koth: { teams: false }, treasure: { teams: false } };
  const POWERUPS = {}, PU_RATE = { none: 0 };
  const BOT_SKILL = { easy: [0.15, 0.35], mid: [0.45, 0.65], hard: [0.8, 1.0], mix: [0.15, 1.0] };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), rnd = (a, b) => a + Math.random() * (b - a);
  const mulberry = (a) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };

  function create(seed, opts = {}) {
    const rand = mulberry(seed || 1), islands = [];
    const n = 3 + Math.floor(rand() * 3);
    for (let i = 0; i < n; i++) { let x, y, r, k = 0; do { x = 40 + rand() * (W - 80); y = 90 + rand() * (H - 180); r = 18 + rand() * 22; k++; } while (islands.some(o => Math.hypot(o.x - x, o.y - y) < o.r + r + 50) && k < 20); islands.push({ x, y, r }); }
    const mode = MODES[opts.mode] ? opts.mode : "deathmatch";
    return { seed, mode, teams: MODES[mode].teams, obstacles: [], islands, players: [], balls: [], powerups: [], projectiles: [], paint: new Uint8Array(0), counts: new Uint16Array(9), dirty: [], events: [], time: opts.seconds || T.roundSeconds, roundSeconds: opts.seconds || T.roundSeconds, phase: "countdown", countdown: 3, objective: null, objTimer: 0, chests: [], client: !!opts.client };
  }
  function addPlayer(w, p) {
    const idx = w.players.length; if (idx >= T.maxPlayers) return null;
    const pl = Object.assign({ x: 0, y: 0, a: 0, spd: 0, hp: T.hp, dead: 0, fireCd: 0, dashCd: 0, stun: 0, score: 0, kos: 0, deaths: 0, chest: 0, input: { dx: 0, dy: 0, dash: false }, bot: false, hat: "none", pattern: "none", pref: -1, ai: {}, skill: 0.5 }, p, { slot: idx });
    pl.ci = pickColor(w, pl.pref); pl.team = idx % 2; placeAtStart(w, pl, idx); w.players.push(pl); return pl;
  }
  function pickColor(w, pref) { const used = new Set(w.players.map(p => p.ci)); if (pref >= 0 && !used.has(pref)) return pref; const free = COLORS.map((_, i) => i).filter(i => !used.has(i)); return free.length ? free[Math.floor(Math.random() * free.length)] : 0; }
  function removePlayer(w, id) { w.players = w.players.filter(p => p.id !== id); w.players.forEach((p, i) => { p.slot = i; p.team = i % 2; }); }
  const colorOf = (w, p) => w.teams ? TEAM_COLORS[p.team] : COLORS[p.ci];
  function placeAtStart(w, p, i) { const s = [[40, 40], [W - 40, H - 40], [W - 40, 40], [40, H - 40], [W / 2, 30], [W / 2, H - 30], [30, H / 2], [W - 30, H / 2]]; p.x = s[i % 8][0]; p.y = s[i % 8][1]; p.a = Math.atan2(H / 2 - p.y, W / 2 - p.x); p.spd = 0; }
  function resetRound(w, seed, opts = {}) {
    const f = create(seed, opts);
    Object.assign(w, { seed, mode: f.mode, teams: f.teams, islands: f.islands, balls: [], time: f.time, roundSeconds: f.roundSeconds, phase: "countdown", countdown: 3, dirty: [], events: [], objective: null, objTimer: 0, chests: [], results: null });
    w.players.forEach((p, i) => { p.slot = i; p.team = i % 2; });
    if (opts.bots) w.players.forEach(p => { if (p.bot) assignBot(p, opts.bots); });
    const order = [...w.players].sort(() => Math.random() - 0.5); const used = new Set();
    for (const p of order) { p.ci = -1; if (p.pref >= 0 && !used.has(p.pref)) { p.ci = p.pref; used.add(p.pref); } }
    for (const p of order) if (p.ci < 0) { const free = COLORS.map((_, i) => i).filter(i => !used.has(i)); p.ci = free[Math.floor(Math.random() * free.length)]; used.add(p.ci); }
    w.players.forEach((p, i) => { placeAtStart(w, p, i); Object.assign(p, { hp: T.hp, dead: 0, fireCd: 0, dashCd: 0, stun: 0, score: 0, kos: 0, deaths: 0, chest: 0, input: { dx: 0, dy: 0, dash: false }, ai: {} }); });
    if (w.mode === "koth") w.objective = { kind: "zone", x: W / 2, y: H / 2, r: 60 };
    if (w.mode === "treasure") spawnChest(w);
  }
  function spawnChest(w) { let x, y, k = 0; do { x = rnd(30, W - 30); y = rnd(60, H - 60); k++; } while (hitIsland(w, x, y, 20) && k < 30); w.chests.push({ x, y, id: Math.random().toString(36).slice(2, 6) }); }
  const hitIsland = (w, x, y, r = R) => w.islands.some(o => Math.hypot(o.x - x, o.y - y) < o.r + r);

  function step(w, dt) {
    w.events.length = 0;
    if (w.phase === "countdown") { const b = Math.ceil(w.countdown); w.countdown -= dt; if (Math.ceil(w.countdown) !== b && w.countdown > 0) w.events.push({ t: "count", n: Math.ceil(w.countdown) }); if (w.countdown <= 0) { w.phase = "play"; w.events.push({ t: "go" }); } return; }
    if (w.phase !== "play") return;
    w.time -= dt; if (w.time <= 0) { w.time = 0; w.phase = "end"; w.events.push({ t: "end" }); w.results = results(w); return; }
    if (Math.ceil(w.time) <= 5 && Math.ceil(w.time + dt) !== Math.ceil(w.time)) w.events.push({ t: "tick" });
    for (const p of w.players) {
      if (p.dead > 0) { p.dead -= dt; if (p.dead <= 0) { placeAtStart(w, p, p.slot); p.hp = T.hp; p.dead = 0; w.events.push({ t: "respawn", id: p.id }); } continue; }
      if (p.bot) botThink(w, p, dt);
      moveShip(w, p, dt);
    }
    for (let i = 0; i < w.players.length; i++) for (let j = i + 1; j < w.players.length; j++) { const a = w.players[i], b = w.players[j]; if (a.dead > 0 || b.dead > 0) continue; const d = Math.hypot(a.x - b.x, a.y - b.y); if (d < R * 2 && d > 0) { const nx = (b.x - a.x) / d, ny = (b.y - a.y) / d, o = R * 2 - d; a.x -= nx * o / 2; a.y -= ny * o / 2; b.x += nx * o / 2; b.y += ny * o / 2; a.spd *= 0.5; b.spd *= 0.5; } }
    stepBalls(w, dt);
    if (w.mode === "koth") { const z = w.objective; const inside = w.players.filter(p => p.dead <= 0 && Math.hypot(p.x - z.x, p.y - z.y) < z.r); z.contested = inside.length > 1; if (inside.length === 1) { inside[0].score += dt; z.holder = inside[0].id; } else z.holder = null; w.objTimer += dt; if (w.objTimer > 20) { w.objTimer = 0; do { z.x = rnd(70, W - 70); z.y = rnd(100, H - 100); } while (hitIsland(w, z.x, z.y, z.r)); w.events.push({ t: "zone" }); } }
    if (w.mode === "treasure") { for (const p of w.players) { if (p.dead > 0) continue; for (let i = w.chests.length - 1; i >= 0; i--) { const c = w.chests[i]; if (Math.hypot(c.x - p.x, c.y - p.y) < R + 8) { w.chests.splice(i, 1); p.chest++; p.score += 1; w.events.push({ t: "chest", id: p.id, x: c.x, y: c.y }); if (w.chests.length < 2) spawnChest(w); } } } }
  }
  function moveShip(w, p, dt) {
    p.fireCd = Math.max(0, p.fireCd - dt); p.stun = Math.max(0, p.stun - dt);
    const len = Math.hypot(p.input.dx, p.input.dy);
    if (len > 0.2 && p.stun <= 0) { const want = Math.atan2(p.input.dy, p.input.dx); const d = angDiff(p.a, want); p.a += clamp(d, -T.turnRate * dt, T.turnRate * dt); p.spd += (T.speed * Math.min(1, len) - p.spd) * Math.min(1, dt * 2.5); }
    else p.spd += (0 - p.spd) * Math.min(1, dt * 1.2);
    if (p.input.dash && p.fireCd <= 0 && p.stun <= 0) { p.fireCd = T.fireCd; fire(w, p); }
    p.input.dash = false;
    const nx = clamp(p.x + Math.cos(p.a) * p.spd * dt, R, W - R), ny = clamp(p.y + Math.sin(p.a) * p.spd * dt, R, H - R);
    if (hitIsland(w, nx, ny)) { p.spd *= -0.3; p.stun = Math.max(p.stun, 0.2); w.events.push({ t: "bump", x: p.x, y: p.y, small: true }); } else { p.x = nx; p.y = ny; }
  }
  function fire(w, p) {
    for (const side of [-1, 1]) for (let k = -1; k <= 1; k++) { const a = p.a + side * Math.PI / 2 + k * 0.12; w.balls.push({ x: p.x + Math.cos(p.a) * k * 6, y: p.y + Math.sin(p.a) * k * 6, vx: Math.cos(a) * T.ballSpeed + Math.cos(p.a) * p.spd * 0.3, vy: Math.sin(a) * T.ballSpeed + Math.sin(p.a) * p.spd * 0.3, life: T.ballLife, owner: p.slot }); }
    w.events.push({ t: "fire", id: p.id, x: p.x, y: p.y, a: p.a });
  }
  function stepBalls(w, dt) {
    for (let i = w.balls.length - 1; i >= 0; i--) {
      const b = w.balls[i]; b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      if (b.life <= 0 || b.x < 0 || b.y < 0 || b.x > W || b.y > H || hitIsland(w, b.x, b.y, 2)) { w.events.push({ t: "splash", x: b.x, y: b.y }); w.balls.splice(i, 1); continue; }
      const owner = w.players[b.owner];
      for (const p of w.players) { if (p.slot === b.owner || p.dead > 0 || (w.teams && owner && p.team === owner.team)) continue; if (Math.hypot(p.x - b.x, p.y - b.y) < R + 3) { w.balls.splice(i, 1); hit(w, owner, p); break; } }
    }
  }
  function hit(w, att, vic) {
    vic.hp--; w.events.push({ t: "hit", id: vic.id, by: att ? att.id : null, x: vic.x, y: vic.y });
    if (vic.hp <= 0) { vic.dead = T.respawn; vic.deaths++; if (att) { att.kos++; if (w.mode !== "koth") att.score += w.mode === "treasure" ? 0 : 1; if (w.mode === "treasure" && vic.chest > 0) { const drop = Math.ceil(vic.chest / 2); vic.chest -= drop; vic.score -= drop; for (let k = 0; k < drop; k++) w.chests.push({ x: vic.x + rnd(-20, 20), y: vic.y + rnd(-20, 20), id: Math.random().toString(36).slice(2, 6) }); } } w.events.push({ t: "sink", id: vic.id, by: att ? att.id : null, x: vic.x, y: vic.y }); }
  }
  // boti: obeplouvají cíl bokem a střílí, hlídají ostrovy
  function botThink(w, p, dt) {
    const ai = p.ai, sk = p.skill; ai.t = (ai.t || 0) - dt;
    if (ai.t <= 0 || !ai.target) {
      ai.t = 0.5 + (1 - sk) * 1.2; const enemies = w.players.filter(o => o !== p && o.dead <= 0 && (!w.teams || o.team !== p.team));
      if (w.mode === "treasure" && w.chests.length && Math.random() < 0.7) { ai.target = w.chests.reduce((b, c) => Math.hypot(c.x - p.x, c.y - p.y) < Math.hypot(b.x - p.x, b.y - p.y) ? c : b); ai.kind = "point"; }
      else if (w.mode === "koth" && Math.random() < 0.6) { ai.target = w.objective; ai.kind = "point"; }
      else if (enemies.length) { ai.target = enemies.reduce((b, o) => Math.hypot(o.x - p.x, o.y - p.y) < Math.hypot(b.x - p.x, b.y - p.y) ? o : b); ai.kind = "ship"; }
      else { ai.target = { x: rnd(40, W - 40), y: rnd(60, H - 60) }; ai.kind = "point"; }
    }
    const t = ai.target; let dx = t.x - p.x, dy = t.y - p.y; const d = Math.hypot(dx, dy) || 1;
    if (ai.kind === "ship") { // krouží kolem cíle ve vzdálenosti ~70, aby měl bok k nepříteli
      const ang = Math.atan2(dy, dx), side = ai.side || (ai.side = Math.random() < 0.5 ? 1 : -1);
      const orbit = d > 110 ? ang : ang + side * (Math.PI / 2 + (d < 60 ? 0.5 : 0)); dx = Math.cos(orbit); dy = Math.sin(orbit);
      const rel = Math.abs(angDiff(p.a + Math.PI / 2, ang)), rel2 = Math.abs(angDiff(p.a - Math.PI / 2, ang));
      if (d < 120 && Math.min(rel, rel2) < 0.35 + (1 - sk) * 0.3 && p.fireCd <= 0 && Math.random() < 0.3 + sk * 0.7) p.input.dash = true;
    } else { dx /= d; dy /= d; }
    // vyhnout se ostrovům před přídí
    for (const o of w.islands) { const fx = p.x + Math.cos(p.a) * 40, fy = p.y + Math.sin(p.a) * 40; const dd = Math.hypot(o.x - fx, o.y - fy); if (dd < o.r + 20) { const s = ai.side || 1; const a = Math.atan2(fy - o.y, fx - o.x) + s * 0.6; dx = Math.cos(a); dy = Math.sin(a); } }
    if (sk < 0.4 && Math.random() < 0.05) { dx = rnd(-1, 1); dy = rnd(-1, 1); }
    p.input.dx = dx; p.input.dy = dy;
  }
  function results(w) {
    const rows = w.players.map(p => ({ id: p.id, name: p.name, color: colorOf(w, p), team: p.team, slot: p.slot, bot: p.bot, score: w.teams ? w.players.filter(o => o.team === p.team).reduce((a, o) => a + o.score, 0) : p.score, own: p.score, kos: p.kos, pct: 0 }));
    rows.sort((a, b) => b.score - a.score || b.own - a.own || b.kos - a.kos);
    rows.forEach((r, i) => { r.rank = i + 1; r.value = Math.round(r.score); r.coins = r.bot ? 0 : Math.round(10 + Math.min(60, r.own * 4) + (i === 0 ? 25 : i === 1 ? 10 : 0)); });
    if (w.teams) { const wt = rows[0].team; rows.forEach(r => { r.win = r.team === wt; if (!r.bot && r.win) r.coins += 15; }); } else rows.forEach((r, i) => r.win = i === 0);
    return rows;
  }
  function packPlayers(w) { return w.players.map(p => [p.id, Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10, Math.round(p.a * 100) / 100, (p.dead > 0 ? 8 : 0) | (p.stun > 0 ? 1 : 0), p.hp, p.fireCd > 0 ? 1 : 0, Math.round(p.score * 10) / 10, Math.round(p.spd)]); }
  function packPaint() { return ""; } function unpackPaint() {}
  function lobbyInfo(w) { return w.players.map(p => ({ id: p.id, name: p.name, color: colorOf(w, p), ci: p.ci, team: p.team, hat: p.hat, pattern: p.pattern, bot: !!p.bot, skill: p.bot ? p.skill : undefined })); }
  function assignBot(p, difficulty) { const [a, b] = BOT_SKILL[difficulty] || BOT_SKILL.mix; p.skill = Math.round((a + Math.random() * (b - a)) * 100) / 100; p.ai = {}; }
  const skillTier = (s) => s < 0.4 ? "easy" : s < 0.75 ? "mid" : "hard";
  const palette = (w) => w.teams ? TEAM_COLORS : w.players.map(p => COLORS[p.ci]);
  const blocked = (w, x, y) => hitIsland(w, x, y);
  return { W, H, CELL, GW, GH, R, COLORS, TEAM_COLORS, MODES, POWERUPS, PU_RATE, BOT_SKILL, create, addPlayer, removePlayer, resetRound, step, movePlayer: moveShip, results, packPlayers, packPaint, unpackPaint, lobbyInfo, colorOf, assignBot, skillTier, palette, blocked };
})();
