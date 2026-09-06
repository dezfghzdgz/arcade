// Snakes: hadi na mřížce. Joystick = směr, tlačítko = boost (zrychlí, ale ubírá délku). Náraz do těla = smrt.
window.Sim = (() => {
  const T = SK_CONFIG.tuning;
  const GW = 36, GH = 60, CELL = 10, W = GW * CELL, H = GH * CELL, R = 5;
  const COLORS = ["#FF5E7E", "#5EE1D0", "#FFCF5A", "#8A5CFF", "#B6FF5A", "#FF9A3C", "#6FC3FF", "#FF7AD9"];
  const TEAM_COLORS = ["#FF5E7E", "#5EE1D0"];
  const MODES = { arena: { teams: false }, last: { teams: false }, teams: { teams: true } };
  const POWERUPS = {}, PU_RATE = { none: 0 };
  const BOT_SKILL = { easy: [0.15, 0.35], mid: [0.45, 0.65], hard: [0.8, 1.0], mix: [0.15, 1.0] };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  function create(seed, opts = {}) { const mode = MODES[opts.mode] ? opts.mode : "arena"; return { seed, mode, teams: MODES[mode].teams, obstacles: [], players: [], food: [], grid: new Int16Array(GW * GH).fill(-1), acc: 0, paint: new Uint8Array(0), counts: new Uint16Array(9), dirty: [], events: [], time: opts.seconds || T.roundSeconds, roundSeconds: opts.seconds || T.roundSeconds, phase: "countdown", countdown: 3, client: !!opts.client }; }
  function addPlayer(w, p) { const idx = w.players.length; if (idx >= T.maxPlayers) return null; const pl = Object.assign({ body: [], dir: 0, nextDir: 0, boost: false, dead: 0, out: false, score: 0, kos: 0, len: T.startLen, grow: 0, input: { dx: 0, dy: 0, dash: false }, bot: false, hat: "none", pattern: "none", pref: -1, ai: {}, skill: 0.5, x: 0, y: 0 }, p, { slot: idx }); pl.ci = pickColor(w, pl.pref); pl.team = idx % 2; spawn(w, pl, idx); w.players.push(pl); return pl; }
  function pickColor(w, pref) { const used = new Set(w.players.map(p => p.ci)); if (pref >= 0 && !used.has(pref)) return pref; const free = COLORS.map((_, i) => i).filter(i => !used.has(i)); return free.length ? free[Math.floor(Math.random() * free.length)] : 0; }
  function removePlayer(w, id) { const p = w.players.find(q => q.id === id); if (p) clearBody(w, p); w.players = w.players.filter(q => q.id !== id); w.players.forEach((q, i) => { q.slot = i; q.team = i % 2; }); }
  const colorOf = (w, p) => w.teams ? TEAM_COLORS[p.team] : COLORS[p.ci];
  function clearBody(w, p) { for (const c of p.body) w.grid[c] = -1; p.body = []; }
  function spawn(w, p, i) { const S = [[4, 4, 0], [GW - 5, GH - 5, 2], [GW - 5, 4, 2], [4, GH - 5, 0], [GW / 2 | 0, 4, 1], [GW / 2 | 0, GH - 5, 3], [4, GH / 2 | 0, 0], [GW - 5, GH / 2 | 0, 2]][i % 8]; clearBody(w, p); p.dir = p.nextDir = S[2]; p.body = []; for (let k = 0; k < T.startLen; k++) { const x = S[0] - DIRS[S[2]][0] * k, y = S[1] - DIRS[S[2]][1] * k; const c = y * GW + x; p.body.push(c); w.grid[c] = p.slot; } p.len = T.startLen; p.grow = 0; p.dead = 0; p.x = S[0] * CELL; p.y = S[1] * CELL; }
  function resetRound(w, seed, opts = {}) {
    const f = create(seed, opts); Object.assign(w, { seed, mode: f.mode, teams: f.teams, food: [], grid: new Int16Array(GW * GH).fill(-1), acc: 0, time: f.time, roundSeconds: f.roundSeconds, phase: "countdown", countdown: 3, dirty: [], events: [], results: null });
    w.players.forEach((p, i) => { p.slot = i; p.team = i % 2; });
    if (opts.bots) w.players.forEach(p => { if (p.bot) assignBot(p, opts.bots); });
    const order = [...w.players].sort(() => Math.random() - 0.5); const used = new Set();
    for (const p of order) { p.ci = -1; if (p.pref >= 0 && !used.has(p.pref)) { p.ci = p.pref; used.add(p.pref); } }
    for (const p of order) if (p.ci < 0) { const free = COLORS.map((_, i) => i).filter(i => !used.has(i)); p.ci = free[Math.floor(Math.random() * free.length)]; used.add(p.ci); }
    w.players.forEach((p, i) => { Object.assign(p, { score: 0, kos: 0, out: false, boost: false, input: { dx: 0, dy: 0, dash: false }, ai: {} }); spawn(w, p, i); });
    for (let k = 0; k < T.food; k++) addFood(w);
  }
  function addFood(w) { for (let k = 0; k < 100; k++) { const c = Math.floor(Math.random() * GW * GH); if (w.grid[c] < 0 && !w.food.includes(c)) { w.food.push(c); return; } } }
  function step(w, dt) {
    w.events.length = 0;
    if (w.phase === "countdown") { const b = Math.ceil(w.countdown); w.countdown -= dt; if (Math.ceil(w.countdown) !== b && w.countdown > 0) w.events.push({ t: "count", n: Math.ceil(w.countdown) }); if (w.countdown <= 0) { w.phase = "play"; w.events.push({ t: "go" }); } return; }
    if (w.phase !== "play") return;
    w.time -= dt; if (w.time <= 0) { w.time = 0; return endRound(w); }
    if (Math.ceil(w.time) <= 5 && Math.ceil(w.time + dt) !== Math.ceil(w.time)) w.events.push({ t: "tick" });
    for (const p of w.players) { if (p.out) continue; if (p.dead > 0) { p.dead -= dt; if (p.dead <= 0) { spawn(w, p, p.slot); w.events.push({ t: "respawn", id: p.id }); } continue; } if (p.bot) botThink(w, p, dt); applyInput(w, p); }
    // krok mřížky: normální tempo + boost tempo
    w.acc += dt; w.accB = (w.accB || 0) + dt;
    const stepN = 1 / T.stepRate, stepB = 1 / T.boostRate;
    while (w.accB >= stepB) { w.accB -= stepB; for (const p of w.players) if (p.dead <= 0 && !p.out && p.boost) advance(w, p, true); }
    while (w.acc >= stepN) { w.acc -= stepN; for (const p of w.players) if (p.dead <= 0 && !p.out && !p.boost) advance(w, p, false); }
    while (w.food.length < T.food) addFood(w);
    const alive = w.players.filter(p => !p.out);
    if (w.mode === "last" && alive.length <= 1 && w.players.length > 1) endRound(w);
    if (w.teams && new Set(alive.map(p => p.team)).size <= 1 && w.players.length > 1 && w.mode === "teams") endRound(w);
    for (const p of w.players) { p.x = (p.body[0] % GW) * CELL; p.y = ((p.body[0] / GW) | 0) * CELL; }
  }
  function endRound(w) { w.phase = "end"; w.events.push({ t: "end" }); w.results = results(w); }
  function applyInput(w, p) { const dx = p.input.dx, dy = p.input.dy; if (Math.hypot(dx, dy) > 0.3) { const d = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : 2) : (dy > 0 ? 1 : 3); if ((d + 2) % 4 !== p.dir) p.nextDir = d; } p.boost = !!p.input.dash && p.len > T.startLen + 1; }
  function advance(w, p, boosted) {
    p.dir = p.nextDir; const h = p.body[0], x = h % GW + DIRS[p.dir][0], y = ((h / GW) | 0) + DIRS[p.dir][1];
    if (x < 0 || y < 0 || x >= GW || y >= GH) return die(w, p, null);
    const c = y * GW + x; const tail = p.body[p.body.length - 1];
    if (w.grid[c] >= 0 && !(c === tail && p.grow <= 0)) { const o = w.players[w.grid[c]]; return die(w, p, o && o !== p ? o : null); }
    p.body.unshift(c); w.grid[c] = p.slot;
    const fi = w.food.indexOf(c); if (fi >= 0) { w.food.splice(fi, 1); p.grow += 2; p.score += 1; w.events.push({ t: "eat", id: p.id, x: x * CELL + CELL / 2, y: y * CELL + CELL / 2 }); }
    if (boosted) { p.boostAcc = (p.boostAcc || 0) + 1; if (p.boostAcc >= 4 && p.len > T.startLen + 1) { p.boostAcc = 0; p.grow -= T.boostCost; } }
    if (p.grow > 0) { p.grow--; } else { const t = p.body.pop(); if (w.grid[t] === p.slot) w.grid[t] = -1; if (p.grow < 0) { p.grow++; const t2 = p.body.pop(); if (t2 !== undefined && w.grid[t2] === p.slot) w.grid[t2] = -1; } }
    p.len = p.body.length;
  }
  function die(w, p, killer) {
    // tělo se promění v jídlo
    for (const c of p.body) { w.grid[c] = -1; if (Math.random() < 0.5) w.food.push(c); }
    w.events.push({ t: "die", id: p.id, by: killer ? killer.id : null, x: (p.body[0] % GW) * CELL, y: ((p.body[0] / GW) | 0) * CELL, len: p.len });
    p.body = []; if (killer) { killer.kos++; killer.score += 3; }
    if (w.mode === "last" || w.mode === "teams") { p.out = true; p.dead = 1e9; } else p.dead = T.respawn;
  }
  // boti: hledají jídlo, vyhýbají se srážce (lookahead 1–3 kroky podle skillu)
  function botThink(w, p, dt) {
    const ai = p.ai, sk = p.skill; ai.t = (ai.t || 0) - dt; if (ai.t > 0) return; ai.t = 0.1;
    const h = p.body[0], hx = h % GW, hy = (h / GW) | 0;
    const free = (x, y, depth) => { if (x < 0 || y < 0 || x >= GW || y >= GH) return 0; const c = y * GW + x; if (w.grid[c] >= 0) return 0; if (depth <= 0) return 1; let s = 1; for (const d of DIRS) s += free(x + d[0], y + d[1], depth - 1) * 0.5; return s; };
    let target = null, td = 1e9; for (const f of w.food) { const d = Math.abs(f % GW - hx) + Math.abs(((f / GW) | 0) - hy); if (d < td) { td = d; target = f; } }
    let best = -1, bs = -1e9; const depth = sk > 0.7 ? 3 : sk > 0.4 ? 2 : 1;
    for (let d = 0; d < 4; d++) { if ((d + 2) % 4 === p.dir) continue; const nx = hx + DIRS[d][0], ny = hy + DIRS[d][1]; const f = free(nx, ny, depth); if (f <= 0) continue; let sc = f * 10 + (Math.random() - 0.5) * (1 - sk) * 8; if (target !== null) sc -= (Math.abs(target % GW - nx) + Math.abs(((target / GW) | 0) - ny)) * 1.5; if (sc > bs) { bs = sc; best = d; } }
    if (best >= 0) { p.input.dx = DIRS[best][0]; p.input.dy = DIRS[best][1]; }
    p.input.dash = sk > 0.5 && p.len > 10 && Math.random() < 0.1;
  }
  function results(w) {
    const rows = w.players.map(p => ({ id: p.id, name: p.name, color: colorOf(w, p), team: p.team, slot: p.slot, bot: p.bot, score: w.teams ? w.players.filter(o => o.team === p.team).reduce((a, o) => a + o.score, 0) : p.score, own: p.score, kos: p.kos, out: p.out, pct: 0 }));
    rows.sort((a, b) => (w.mode !== "arena" ? (a.out ? 1 : 0) - (b.out ? 1 : 0) : 0) || b.score - a.score || b.own - a.own);
    rows.forEach((r, i) => { r.rank = i + 1; r.value = r.score; r.coins = r.bot ? 0 : Math.round(10 + Math.min(60, r.own * 2) + (i === 0 ? 25 : i === 1 ? 10 : 0)); });
    if (w.teams) { const wt = rows[0].team; rows.forEach(r => { r.win = r.team === wt; if (!r.bot && r.win) r.coins += 15; }); } else rows.forEach((r, i) => r.win = i === 0);
    return rows;
  }
  function packPlayers(w) { return w.players.map(p => [p.id, p.body, p.dir, (p.dead > 0 ? 8 : 0) | (p.boost ? 2 : 0), p.score]); }
  function packPaint() { return ""; } function unpackPaint() {}
  function lobbyInfo(w) { return w.players.map(p => ({ id: p.id, name: p.name, color: colorOf(w, p), ci: p.ci, team: p.team, hat: p.hat, pattern: p.pattern, bot: !!p.bot, skill: p.bot ? p.skill : undefined })); }
  function assignBot(p, difficulty) { const [a, b] = BOT_SKILL[difficulty] || BOT_SKILL.mix; p.skill = Math.round((a + Math.random() * (b - a)) * 100) / 100; p.ai = {}; }
  const skillTier = (s) => s < 0.4 ? "easy" : s < 0.75 ? "mid" : "hard";
  const palette = (w) => w.teams ? TEAM_COLORS : w.players.map(p => COLORS[p.ci]);
  return { W, H, CELL, GW, GH, R, COLORS, TEAM_COLORS, MODES, POWERUPS, PU_RATE, BOT_SKILL, create, addPlayer, removePlayer, resetRound, step, movePlayer: () => {}, results, packPlayers, packPaint, unpackPaint, lobbyInfo, colorOf, assignBot, skillTier, palette, blocked: () => false };
})();
