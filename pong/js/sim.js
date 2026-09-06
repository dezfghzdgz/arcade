// Pong: 1v1 nebo 2v2 (horní tým vs dolní tým). Joystick vlevo/vpravo = pálka. Míček zrychluje s každým odrazem.
window.Sim = (() => {
  const T = PG_CONFIG.tuning;
  const W = 360, H = 600, R = 7, CELL = 6, GW = 60, GH = 100;
  const COLORS = ["#FF5E7E", "#5EE1D0", "#FFCF5A", "#8A5CFF"];
  const TEAM_COLORS = ["#FF5E7E", "#5EE1D0"];
  const MODES = { classic: { teams: true }, speed: { teams: true }, multi: { teams: true } };
  const POWERUPS = {}, PU_RATE = { none: 0 };
  const BOT_SKILL = { easy: [0.15, 0.35], mid: [0.45, 0.65], hard: [0.8, 1.0], mix: [0.15, 1.0] };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), rnd = (a, b) => a + Math.random() * (b - a);
  function create(seed, opts = {}) { const mode = MODES[opts.mode] ? opts.mode : "classic"; return { seed, mode, teams: true, obstacles: [], players: [], balls: [], score: [0, 0], paint: new Uint8Array(0), counts: new Uint16Array(9), dirty: [], events: [], time: opts.seconds || T.roundSeconds, roundSeconds: opts.seconds || T.roundSeconds, phase: "countdown", countdown: 3, serveT: 0, client: !!opts.client }; }
  function addPlayer(w, p) { const idx = w.players.length; if (idx >= T.maxPlayers) return null; const pl = Object.assign({ x: W / 2, y: 0, w: T.paddleW, score: 0, kos: 0, hits: 0, input: { dx: 0, dy: 0, dash: false }, bot: false, hat: "none", pattern: "none", pref: -1, ai: {}, skill: 0.5, dead: 0 }, p, { slot: idx }); pl.ci = idx; pl.team = idx % 2; place(w, pl); w.players.push(pl); return pl; }
  function removePlayer(w, id) { w.players = w.players.filter(p => p.id !== id); w.players.forEach((p, i) => { p.slot = i; p.team = i % 2; place(w, p); }); }
  const colorOf = (w, p) => TEAM_COLORS[p.team];
  // rozestavení: tým 0 dole, tým 1 nahoře; dva hráči v týmu = levá/pravá půlka
  function place(w, p) { const mates = w.players.filter(q => q.team === p.team && q !== p).length; p.y = p.team === 0 ? H - 30 : 30; p.half = mates ? (p.slot < 2 ? 0 : 1) : -1; p.x = p.half < 0 ? W / 2 : p.half === 0 ? W / 4 : 3 * W / 4; }
  function resetRound(w, seed, opts = {}) {
    const f = create(seed, opts); Object.assign(w, { seed, mode: f.mode, balls: [], score: [0, 0], time: f.time, roundSeconds: f.roundSeconds, phase: "countdown", countdown: 3, dirty: [], events: [], results: null, serveT: 0 });
    w.players.forEach((p, i) => { p.slot = i; p.team = i % 2; p.ci = i; });
    if (opts.bots) w.players.forEach(p => { if (p.bot) assignBot(p, opts.bots); });
    w.players.forEach(p => { Object.assign(p, { score: 0, kos: 0, hits: 0, input: { dx: 0, dy: 0, dash: false }, ai: {} }); place(w, p); });
    w.serve = 0;
  }
  function serve(w) { const dir = w.serve % 2 ? -1 : 1; const n = w.mode === "multi" ? 2 : 1; w.balls = []; for (let k = 0; k < n; k++) { const a = (Math.random() - 0.5) * 1.2 + (k ? Math.PI : 0); const sp = w.mode === "speed" ? T.ballSpeed * 1.4 : T.ballSpeed; w.balls.push({ x: W / 2 + (k ? 40 : -40) * (n > 1 ? 1 : 0), y: H / 2, vx: Math.sin(a) * sp, vy: Math.cos(a) * sp * dir * (k ? -1 : 1), sp }); } w.events.push({ t: "serve" }); }
  function step(w, dt) {
    w.events.length = 0;
    if (w.phase === "countdown") { const b = Math.ceil(w.countdown); w.countdown -= dt; if (Math.ceil(w.countdown) !== b && w.countdown > 0) w.events.push({ t: "count", n: Math.ceil(w.countdown) }); if (w.countdown <= 0) { w.phase = "play"; w.events.push({ t: "go" }); serve(w); } return; }
    if (w.phase !== "play") return;
    w.time -= dt; if (w.time <= 0) { w.time = 0; return endRound(w); }
    for (const p of w.players) { if (p.bot) botThink(w, p, dt); movePaddle(w, p, dt); }
    if (w.serveT > 0) { w.serveT -= dt; if (w.serveT <= 0) serve(w); return; }
    for (const b of w.balls) {
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x < R) { b.x = R; b.vx = Math.abs(b.vx); w.events.push({ t: "wall", x: b.x, y: b.y }); } if (b.x > W - R) { b.x = W - R; b.vx = -Math.abs(b.vx); w.events.push({ t: "wall", x: b.x, y: b.y }); }
      for (const p of w.players) {
        const top = p.team === 1; if (top ? b.vy > 0 : b.vy < 0) continue;
        const py = p.y, half = p.w / 2;
        if (Math.abs(b.y - py) < R + 6 && b.x > p.x - half - R && b.x < p.x + half + R) {
          const rel = clamp((b.x - p.x) / half, -1, 1); const sp = Math.min(T.ballMax, b.sp * 1.06); b.sp = sp; const ang = rel * 1.1; b.vx = Math.sin(ang) * sp; b.vy = Math.cos(ang) * sp * (top ? 1 : -1); b.y = py + (top ? R + 6 : -(R + 6)); p.hits++; w.events.push({ t: "hit", id: p.id, x: b.x, y: b.y });
        }
      }
      if (b.y < -R || b.y > H + R) { const scorer = b.y < 0 ? 0 : 1; w.score[scorer]++; for (const p of w.players) if (p.team === scorer) p.score++; w.events.push({ t: "goal", team: scorer, x: b.x, y: clamp(b.y, 10, H - 10) }); w.serve++; w.serveT = 1.2; w.balls = []; if (w.score[scorer] >= T.winPoints) return endRound(w); break; }
    }
  }
  function endRound(w) { w.phase = "end"; w.events.push({ t: "end" }); w.results = results(w); }
  function movePaddle(w, p, dt) { const dx = clamp(p.input.dx, -1, 1); p.x = clamp(p.x + dx * T.paddleSpeed * dt, p.w / 2 + (p.half === 1 ? W / 2 : 0), (p.half === 0 ? W / 2 : W) - p.w / 2); }
  function botThink(w, p, dt) { const ai = p.ai, sk = p.skill; ai.t = (ai.t || 0) - dt; if (ai.t > 0) return; ai.t = 0.04 + (1 - sk) * 0.12; const top = p.team === 1; let tx = p.half < 0 ? W / 2 : p.half === 0 ? W / 4 : 3 * W / 4; let best = null, bt = 1e9; for (const b of w.balls) { const coming = top ? b.vy < 0 : b.vy > 0; if (!coming) continue; const t = Math.abs((p.y - b.y) / (b.vy || 1)); if (t < bt) { bt = t; best = b; } } if (best) { if (ai.lastBall !== best || ai.lastDir !== Math.sign(best.vy)) { ai.lastBall = best; ai.lastDir = Math.sign(best.vy); ai.err = Math.random() < (1 - sk) * 0.55 + 0.08 ? (Math.random() - 0.5) * 2 * (60 + (1 - sk) * 120) : (Math.random() - 0.5) * 20; } let px = best.x + best.vx * bt; while (px < 0 || px > W) px = px < 0 ? -px : 2 * W - px; tx = px + ai.err; } if (!best) ai.lastBall = null; const d = tx - p.x; p.input.dx = Math.abs(d) < 4 ? 0 : Math.sign(d) * Math.min(1, Math.abs(d) / 40); }
  function results(w) { const rows = w.players.map(p => ({ id: p.id, name: p.name, color: colorOf(w, p), team: p.team, slot: p.slot, bot: p.bot, score: w.score[p.team], own: p.hits, kos: 0, pct: 0 })); rows.sort((a, b) => b.score - a.score || b.own - a.own); rows.forEach((r, i) => { r.rank = i + 1; r.value = r.score; r.coins = r.bot ? 0 : Math.round(10 + r.own * 2 + (i === 0 ? 25 : 10)); }); const wt = rows[0].team; rows.forEach(r => { r.win = r.team === wt; if (!r.bot && r.win) r.coins += 15; }); return rows; }
  function packPlayers(w) { return w.players.map(p => [p.id, Math.round(p.x * 10) / 10, p.y, p.w, 0, 0, 0, p.score]); }
  function packPaint() { return ""; } function unpackPaint() {}
  function lobbyInfo(w) { return w.players.map(p => ({ id: p.id, name: p.name, color: colorOf(w, p), ci: p.ci, team: p.team, hat: p.hat, pattern: p.pattern, bot: !!p.bot, skill: p.bot ? p.skill : undefined })); }
  function assignBot(p, difficulty) { const [a, b] = BOT_SKILL[difficulty] || BOT_SKILL.mix; p.skill = Math.round((a + Math.random() * (b - a)) * 100) / 100; p.ai = {}; }
  const skillTier = (s) => s < 0.4 ? "easy" : s < 0.75 ? "mid" : "hard";
  const palette = (w) => TEAM_COLORS;
  return { W, H, R, CELL, GW, GH, COLORS, TEAM_COLORS, MODES, POWERUPS, PU_RATE, BOT_SKILL, create, addPlayer, removePlayer, resetRound, step, movePlayer: movePaddle, results, packPlayers, packPaint, unpackPaint, lobbyInfo, colorOf, assignBot, skillTier, palette, blocked: () => false };
})();
