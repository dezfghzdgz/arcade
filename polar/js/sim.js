// Simulace Polar. Každý hráč je magnet s pólem +1 / -1. Opačné póly se přitahují, stejné odpuzují – hráči i mince.
window.Sim = (() => {
  const T = PL_CONFIG.tuning;
  const W = 360, H = 600, R = 10;
  const COLORS = ["#FF5E7E", "#5EE1D0", "#FFCF5A", "#8A5CFF", "#B6FF5A", "#FF9A3C", "#6FC3FF", "#FF7AD9"];
  const TEAM_COLORS = ["#FF5E7E", "#5EE1D0"];
  const MODES = {
    coins: { teams: false },   // nejvíc mincí
    team:  { teams: true },    // 2 týmy, součet mincí
    sumo:  { teams: false },   // žádné mince, body za shození do díry / vyražení
  };
  const POWERUPS = { magnet: 3, shield: 3, vacuum: 2, heavy: 2, scramble: 2 };
  const PU_RATE = { none: 0, rare: 14, normal: 8, many: 4 };
  const BOT_SKILL = { easy: [0.15, 0.35], mid: [0.45, 0.65], hard: [0.8, 1.0], mix: [0.15, 1.0] };
  const BOT_STYLES = ["collector", "bully", "trapper", "guard"];

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const mulberry = (a) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  function create(seed, opts = {}) {
    const rand = mulberry(seed || Date.now());
    const pits = [];
    const n = 2 + Math.floor(rand() * 2);
    for (let i = 0; i < n; i++) {
      let x, y, tries = 0;
      do { x = 70 + rand() * (W - 140); y = 110 + rand() * (H - 220); tries++; } while (pits.some(p => Math.hypot(p.x - x, p.y - y) < 120) && tries < 20);
      pits.push({ x, y, r: 26 + rand() * 8 });
    }
    const mode = MODES[opts.mode] ? opts.mode : "coins";
    return {
      seed, pits, mode, teams: MODES[mode].teams,
      players: [], coins: [], powerups: [], coinId: 1, puId: 1,
      time: opts.seconds || T.roundSeconds, roundSeconds: opts.seconds || T.roundSeconds,
      target: opts.target || 0, puEvery: PU_RATE[opts.pu] ?? T.powerupEvery,
      phase: "countdown", countdown: 3, events: [], nextPowerup: 5, client: !!opts.client,
    };
  }
  function addPlayer(w, p) {
    const idx = w.players.length; if (idx >= T.maxPlayers) return null;
    const pl = Object.assign({ x: 0, y: 0, vx: 0, vy: 0, dir: 0, pol: 1, flipCd: 0, stun: 0, dead: 0, shield: 0, magnet: 0, heavy: 0, score: 0, kos: 0, flips: 0,
      input: { dx: 0, dy: 0, flip: false }, bot: false, hat: "none", pattern: "none", pref: -1, ai: {}, skill: 0.5, style: "collector" }, p, { slot: idx });
    pl.ci = pickColor(w, pl.pref); pl.team = idx % 2; placeAtStart(w, pl, idx); w.players.push(pl); return pl;
  }
  function pickColor(w, pref) { const used = new Set(w.players.map(p => p.ci)); if (pref >= 0 && !used.has(pref)) return pref; const free = COLORS.map((_, i) => i).filter(i => !used.has(i)); return free.length ? free[Math.floor(Math.random() * free.length)] : 0; }
  function removePlayer(w, id) { w.players = w.players.filter(p => p.id !== id); reindex(w); }
  function reindex(w) { w.players.forEach((p, i) => { p.slot = i; p.team = i % 2; }); }
  const colorOf = (w, p) => w.teams ? TEAM_COLORS[p.team] : COLORS[p.ci];
  function placeAtStart(w, p, i) { const s = [[30, 40], [W - 30, H - 40], [W - 30, 40], [30, H - 40], [W / 2, 30], [W / 2, H - 30], [30, H / 2], [W - 30, H / 2]]; p.x = s[i % 8][0]; p.y = s[i % 8][1]; p.vx = p.vy = 0; }

  function resetRound(w, seed, opts = {}) {
    const f = create(seed, opts);
    Object.assign(w, { pits: f.pits, mode: f.mode, teams: f.teams, coins: [], powerups: [], time: f.time, roundSeconds: f.roundSeconds, target: f.target, puEvery: f.puEvery, phase: "countdown", countdown: 3, events: [], nextPowerup: 5, seed, results: null });
    reindex(w);
    if (opts.bots) w.players.forEach(p => { if (p.bot) assignBot(p, opts.bots); });
    const order = [...w.players].sort(() => Math.random() - 0.5); const used = new Set();
    for (const p of order) { p.ci = -1; if (p.pref >= 0 && !used.has(p.pref)) { p.ci = p.pref; used.add(p.pref); } }
    for (const p of order) if (p.ci < 0) { const free = COLORS.map((_, i) => i).filter(i => !used.has(i)); p.ci = free[Math.floor(Math.random() * free.length)]; used.add(p.ci); }
    w.players.forEach((p, i) => { placeAtStart(w, p, i); Object.assign(p, { pol: i % 2 ? -1 : 1, flipCd: 0, stun: 0, dead: 0, shield: 0, magnet: 0, heavy: 0, score: 0, kos: 0, flips: 0, input: { dx: 0, dy: 0, flip: false }, ai: {} }); });
    if (w.mode !== "sumo") for (let i = 0; i < T.coinsOnField; i++) spawnCoin(w);
  }

  const inPit = (w, x, y, margin = 0) => w.pits.find(p => Math.hypot(p.x - x, p.y - y) < p.r - margin);
  function freeSpot(w, m = 24) { let x, y, t = 0; do { x = rnd(m, W - m); y = rnd(m, H - m); } while (w.pits.some(p => Math.hypot(p.x - x, p.y - y) < p.r + 20) && t++ < 30); return { x, y }; }
  function spawnCoin(w, x, y, vx = 0, vy = 0) {
    const s = x === undefined ? freeSpot(w) : { x, y };
    w.coins.push({ id: w.coinId++, x: s.x, y: s.y, vx, vy, pol: Math.random() < 0.5 ? 1 : -1, age: 0 });
  }

  // ---------- krok
  function step(w, dt) {
    w.events.length = 0;
    if (w.phase === "countdown") { const b = Math.ceil(w.countdown); w.countdown -= dt; if (Math.ceil(w.countdown) !== b && w.countdown > 0) w.events.push({ t: "count", n: Math.ceil(w.countdown) }); if (w.countdown <= 0) { w.phase = "play"; w.events.push({ t: "go" }); } return; }
    if (w.phase !== "play") return;
    w.time -= dt;
    if (w.time <= 0) { w.time = 0; endRound(w); return; }
    if (Math.ceil(w.time) <= 5 && Math.ceil(w.time + dt) !== Math.ceil(w.time)) w.events.push({ t: "tick" });

    w.nextPowerup -= dt;
    if (w.puEvery > 0 && w.nextPowerup <= 0 && w.powerups.length < 2) { w.nextPowerup = w.puEvery; const s = freeSpot(w); const tot = Object.values(POWERUPS).reduce((a, b) => a + b, 0); let r = Math.random() * tot, kind = "magnet"; for (const [k, wg] of Object.entries(POWERUPS)) { r -= wg; if (r <= 0) { kind = k; break; } } w.powerups.push({ id: w.puId++, kind, x: s.x, y: s.y }); }
    if (w.mode !== "sumo") while (w.coins.length < T.coinsOnField) spawnCoin(w);

    for (const p of w.players) {
      if (p.dead > 0) { p.dead -= dt; if (p.dead <= 0) { placeAtStart(w, p, p.slot); p.dead = 0; p.stun = 0; w.events.push({ t: "respawn", id: p.id }); } continue; }
      if (p.bot) botThink(w, p, dt);
      movePlayer(w, p, dt);
    }
    // síly mezi hráči + kolize
    for (let i = 0; i < w.players.length; i++) for (let j = i + 1; j < w.players.length; j++) interact(w, w.players[i], w.players[j], dt);
    for (const p of w.players) { if (p.dead > 0) continue; integrate(w, p, dt); }
    stepCoins(w, dt);
    if (w.target > 0 && w.players.some(p => p.score >= w.target)) endRound(w);
  }
  function endRound(w) { w.phase = "end"; w.events.push({ t: "end" }); w.results = results(w); }

  function movePlayer(w, p, dt) {
    p.flipCd = Math.max(0, p.flipCd - dt); p.stun = Math.max(0, p.stun - dt); p.lastHitT = Math.max(0, (p.lastHitT || 0) - dt); p.shield = Math.max(0, p.shield - dt); p.magnet = Math.max(0, p.magnet - dt); p.heavy = Math.max(0, p.heavy - dt);
    if (p.input.flip && p.flipCd <= 0 && p.stun <= 0) { p.pol = -p.pol; p.flipCd = T.flipCooldown; p.flips++; w.events.push({ t: "flip", id: p.id, x: p.x, y: p.y, pol: p.pol }); }
    p.input.flip = false;
    let dx = p.input.dx, dy = p.input.dy; const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
    const speed = T.speed * (p.heavy > 0 ? 0.8 : 1);
    if (p.stun <= 0) { p.ax = dx * speed; p.ay = dy * speed; } else { p.ax = p.ay = 0; }
    // power-upy
    for (let i = w.powerups.length - 1; i >= 0; i--) { const pu = w.powerups[i]; if (Math.hypot(pu.x - p.x, pu.y - p.y) < R + 9) { w.powerups.splice(i, 1); applyPowerup(w, p, pu.kind); } }
  }
  function applyPowerup(w, p, kind) {
    p.powerups = (p.powerups || 0) + 1;
    if (kind === "magnet") p.magnet = 6;
    else if (kind === "shield") p.shield = 6;
    else if (kind === "heavy") p.heavy = 6;
    else if (kind === "vacuum") { for (const c of w.coins) if (Math.hypot(c.x - p.x, c.y - p.y) < 170) { c.pull = p.slot; } }
    else if (kind === "scramble") { for (const o of w.players) if (o !== p && o.dead <= 0 && (!w.teams || o.team !== p.team)) { o.pol = -o.pol; o.flipCd = 1.2; } }
    w.events.push({ t: "pickup", id: p.id, kind, x: p.x, y: p.y });
  }

  // vzájemné síly + náraz
  function interact(w, a, b, dt) {
    if (a.dead > 0 || b.dead > 0) return;
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.01;
    const range = T.magnetRange * (a.magnet > 0 || b.magnet > 0 ? 1.6 : 1);
    if (d < range) {
      const nx = dx / d, ny = dy / d;
      const sign = a.pol === b.pol ? -1 : 1;                   // opačné = přitažlivost
      const f = sign * T.force / Math.max(d * d, 900) * (a.magnet > 0 || b.magnet > 0 ? 1.5 : 1);
      const ma = a.heavy > 0 ? 3 : 1, mb = b.heavy > 0 ? 3 : 1;
      a.vx += nx * f * dt / ma; a.vy += ny * f * dt / ma; b.vx -= nx * f * dt / mb; b.vy -= ny * f * dt / mb;
    }
    if (d < R * 2) {
      const nx = dx / d, ny = dy / d, overlap = R * 2 - d;
      a.x -= nx * overlap / 2; a.y -= ny * overlap / 2; b.x += nx * overlap / 2; b.y += ny * overlap / 2;
      const rvx = a.vx - b.vx, rvy = a.vy - b.vy, rel = rvx * nx + rvy * ny;
      if (rel > 0) {
        const ma = a.heavy > 0 ? 3 : 1, mb = b.heavy > 0 ? 3 : 1, j = 1.4 * rel / (1 / ma + 1 / mb);
        a.vx -= j * nx / ma; a.vy -= j * ny / ma; b.vx += j * nx / mb; b.vy += j * ny / mb;
        if (rel > T.knockSpeed && !(w.teams && a.team === b.team)) {
          // rychlejší (nebo těžší) vyráží mince slabšímu
          const sa = Math.hypot(a.vx, a.vy) * ma, sb = Math.hypot(b.vx, b.vy) * mb;
          const att = sa >= sb ? a : b, vic = att === a ? b : a;
          knock(w, att, vic, rel);
        } else w.events.push({ t: "bump", x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, small: true });
      }
    }
  }
  function knock(w, att, vic, rel) {
    if (vic.shield > 0) { w.events.push({ t: "shieldpop", id: vic.id, x: vic.x, y: vic.y }); return; }
    vic.stun = 0.5; att.kos++; vic.lastHit = att.id; vic.lastHitT = 3;
    const lost = Math.min(vic.score, Math.max(1, Math.round(vic.score * 0.3)));
    if (w.mode === "sumo") { att.score++; }
    else { vic.score -= lost; for (let i = 0; i < lost; i++) { const a = rnd(0, 6.28); spawnCoin(w, vic.x, vic.y, Math.cos(a) * rnd(80, 220), Math.sin(a) * rnd(80, 220)); w.coins[w.coins.length - 1].cool = 0.6; } }
    w.events.push({ t: "bump", x: vic.x, y: vic.y, victim: vic.id, by: att.id, lost });
  }

  function integrate(w, p, dt) {
    const m = p.heavy > 0 ? 3 : 1;
    p.vx += (p.ax || 0) * dt * 9 / m; p.vy += (p.ay || 0) * dt * 9 / m;
    p.vx *= Math.pow(0.02, dt); p.vy *= Math.pow(0.02, dt);              // tření
    const sp = Math.hypot(p.vx, p.vy); if (sp > 480) { p.vx *= 480 / sp; p.vy *= 480 / sp; }
    p.x += p.vx * dt; p.y += p.vy * dt;
    // stěny odrážejí
    if (p.x < R) { p.x = R; p.vx = Math.abs(p.vx) * 0.6; } if (p.x > W - R) { p.x = W - R; p.vx = -Math.abs(p.vx) * 0.6; }
    if (p.y < R) { p.y = R; p.vy = Math.abs(p.vy) * 0.6; } if (p.y > H - R) { p.y = H - R; p.vy = -Math.abs(p.vy) * 0.6; }
    if (sp > 5) p.dir = Math.atan2(p.vy, p.vx);
    // díra
    const pit = inPit(w, p.x, p.y, 4);
    if (pit && !w.client) fall(w, p, pit);
  }
  function fall(w, p, pit) {
    const lost = w.mode === "sumo" ? 0 : Math.round(p.score * T.pitLoss);
    p.score -= lost; p.dead = 2; p.vx = p.vy = 0; p.falls = (p.falls || 0) + 1;
    for (let i = 0; i < lost; i++) { const a = rnd(0, 6.28); spawnCoin(w, pit.x + Math.cos(a) * (pit.r + 14), pit.y + Math.sin(a) * (pit.r + 14), Math.cos(a) * 120, Math.sin(a) * 120); w.coins[w.coins.length - 1].cool = 0.8; }
    // v sumu bod tomu, kdo ho naposledy strčil (last hit)
    if (w.mode === "sumo" && p.lastHit && p.lastHitT > 0) { const att = w.players.find(o => o.id === p.lastHit); if (att && att !== p) { att.score++; att.kos++; w.events.push({ t: "ko", by: att.id, victim: p.id, x: pit.x, y: pit.y }); } }
    w.events.push({ t: "fall", id: p.id, x: pit.x, y: pit.y, lost });
  }

  function stepCoins(w, dt) {
    for (let i = w.coins.length - 1; i >= 0; i--) {
      const c = w.coins[i]; c.age += dt; c.cool = Math.max(0, (c.cool || 0) - dt);
      // síly od hráčů
      for (const p of w.players) {
        if (p.dead > 0) continue;
        const dx = p.x - c.x, dy = p.y - c.y, d = Math.hypot(dx, dy) || 0.01;
        const range = T.coinRange * (p.magnet > 0 ? 1.7 : 1);
        if (c.pull === p.slot) { c.vx += dx / d * 900 * dt; c.vy += dy / d * 900 * dt; }
        else if (d < range) { const sign = c.pol === p.pol ? -1 : 1; const f = sign * T.coinForce / Math.max(d * d, 600) * (p.magnet > 0 ? 1.6 : 1); c.vx += dx / d * f * dt; c.vy += dy / d * f * dt; }
        if (d < R + 6 && c.cool <= 0 && w.mode !== "sumo") { p.score++; w.coins.splice(i, 1); w.events.push({ t: "coin", id: p.id, x: c.x, y: c.y }); break; }
      }
      if (!w.coins.includes(c)) continue;
      c.vx *= Math.pow(0.05, dt); c.vy *= Math.pow(0.05, dt);
      c.x += c.vx * dt; c.y += c.vy * dt;
      if (c.x < 8) { c.x = 8; c.vx = Math.abs(c.vx); } if (c.x > W - 8) { c.x = W - 8; c.vx = -Math.abs(c.vx); }
      if (c.y < 8) { c.y = 8; c.vy = Math.abs(c.vy); } if (c.y > H - 8) { c.y = H - 8; c.vy = -Math.abs(c.vy); }
      if (inPit(w, c.x, c.y, 2)) { w.coins.splice(i, 1); }          // mince spadla do díry
    }
  }

  // ---------- boti
  function botThink(w, p, dt) {
    const ai = p.ai, sk = p.skill; ai.t = (ai.t || 0) - dt; ai.ft = (ai.ft || 0) - dt;
    if (ai.t <= 0 || !ai.target) {
      ai.t = rnd(0.4, 1.0) * (1.6 - sk);
      const enemies = w.players.filter(o => o !== p && o.dead <= 0 && (!w.teams || o.team !== p.team));
      const bullyP = p.style === "bully" ? 0.7 : w.mode === "sumo" ? 0.6 + sk * 0.3 : 0.1 + sk * 0.15;
      const trapP = p.style === "trapper" ? 0.6 + sk * 0.3 : sk * 0.2;
      ai.mode = "coin"; ai.target = null;
      if (enemies.length && Math.random() < bullyP) { let pick = null, pd = 1e9; for (const o of enemies) { const d = Math.hypot(o.x - p.x, o.y - p.y) - o.score * 4 * sk; if (d < pd) { pd = d; pick = o; } } if (pick) { ai.mode = "bully"; ai.target = pick; } }
      if (!ai.target && enemies.length && w.pits.length && Math.random() < trapP) {
        // trapper: najde soupeře blízko díry a jde na opačnou stranu díry, aby ho přitáhl dovnitř
        let best = null, bd = 1e9; for (const o of enemies) for (const pit of w.pits) { const d = Math.hypot(o.x - pit.x, o.y - pit.y); if (d < 90 && d < bd) { bd = d; best = { o, pit }; } }
        if (best) { ai.mode = "trap"; ai.target = best; }
      }
      if (!ai.target && w.powerups.length && Math.random() < 0.3 + sk * 0.4) { const pu = w.powerups[0]; ai.mode = "pu"; ai.target = pu; }
      if (!ai.target && w.coins.length) {
        // nejbližší mince s váhou na shluky; guard zůstává u své hromady, collector jde daleko
        let best = null, bs = -1e9;
        for (const c of w.coins) { const d = Math.hypot(c.x - p.x, c.y - p.y); const pit = w.pits.some(q => Math.hypot(q.x - c.x, q.y - c.y) < q.r + 30); const sc = -d * (p.style === "guard" ? 1.5 : 1) - (pit ? 60 * sk : 0) + rnd(0, 80 * (1 - sk)); if (sc > bs) { bs = sc; best = c; } }
        ai.mode = "coin"; ai.target = best;
      }
      if (!ai.target) ai.target = freeSpot(w);
    }
    const tg = ai.mode === "trap" ? ai.target.pit : ai.target;
    if (!tg) return;
    let tx = tg.x, ty = tg.y;
    if (ai.mode === "trap") { const o = ai.target.o; const ang = Math.atan2(o.y - tg.y, o.x - tg.x); tx = tg.x - Math.cos(ang) * (tg.r + 40); ty = tg.y - Math.sin(ang) * (tg.r + 40); }
    let dx = tx - p.x, dy = ty - p.y; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    // vyhýbání dírám (pro lépe)
    for (const pit of w.pits) { const px = pit.x - p.x, py = pit.y - p.y, pd = Math.hypot(px, py); if (pd < pit.r + 26 + sk * 20 && (px * dx + py * dy) > 0) { const s = ai.side || (ai.side = Math.random() < 0.5 ? 1 : -1); dx += -py / pd * s * 1.5; dy += px / pd * s * 1.5; } }
    const l = Math.hypot(dx, dy) || 1; p.input.dx = dx / l; p.input.dy = dy / l;
    if (sk < 0.5 && Math.random() < 0.1 * (1 - sk)) { p.input.dx = rnd(-1, 1); p.input.dy = rnd(-1, 1); }
    if (d < 12) ai.t = 0;
    // pól: chci přitahovat mince / soupeře -> opačný pól; guard odpuzuje soupeře od hromady
    let want = p.pol;
    if (ai.mode === "coin" && ai.target.pol !== undefined) want = -ai.target.pol;
    else if (ai.mode === "bully" || ai.mode === "trap") { const o = ai.mode === "trap" ? ai.target.o : ai.target; want = -o.pol; }
    else if (p.style === "guard") { const near = w.players.find(o => o !== p && o.dead <= 0 && Math.hypot(o.x - p.x, o.y - p.y) < 90); if (near) want = near.pol; }
    // noob přepíná s chybou / zpožděním
    if (want !== p.pol && ai.ft <= 0 && Math.random() < 0.3 + sk * 0.7) { p.input.flip = true; ai.ft = 0.4 * (1.5 - sk); }
    else p.input.flip = false;
  }

  // ---------- výsledky
  function results(w) {
    const rows = w.players.map(p => ({ id: p.id, name: p.name, color: colorOf(w, p), team: p.team, slot: p.slot, bot: p.bot, score: w.teams ? w.players.filter(o => o.team === p.team).reduce((a, o) => a + o.score, 0) : p.score, own: p.score, kos: p.kos, pct: 0 }));
    rows.sort((a, b) => b.score - a.score || b.own - a.own);
    rows.forEach((r, i) => { r.rank = i + 1; r.value = r.score; r.coins = r.bot ? 0 : Math.round(10 + Math.min(60, r.own * 1.5) + (i === 0 ? 25 : i === 1 ? 10 : 0)); });
    if (w.teams) { const wt = rows[0].team; rows.forEach(r => { r.win = r.team === wt; if (!r.bot && r.win) r.coins += 15; }); } else rows.forEach((r, i) => r.win = i === 0);
    return rows;
  }
  function packPlayers(w) { return w.players.map(p => [p.id, Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10, Math.round(p.dir * 100) / 100, (p.stun > 0 ? 1 : 0) | (p.dead > 0 ? 8 : 0) | (p.shield > 0 ? 16 : 0) | (p.magnet > 0 ? 32 : 0) | (p.heavy > 0 ? 64 : 0), p.pol, Math.round(p.score)]); }
  function packCoins(w) { return w.coins.map(c => [c.id, Math.round(c.x), Math.round(c.y), c.pol]); }
  function lobbyInfo(w) { return w.players.map(p => ({ id: p.id, name: p.name, color: colorOf(w, p), ci: p.ci, team: p.team, hat: p.hat, pattern: p.pattern, bot: !!p.bot, skill: p.bot ? p.skill : undefined })); }
  function assignBot(p, difficulty) { const [a, b] = BOT_SKILL[difficulty] || BOT_SKILL.mix; p.skill = Math.round((a + Math.random() * (b - a)) * 100) / 100; p.style = BOT_STYLES[Math.floor(Math.random() * BOT_STYLES.length)]; p.ai = {}; }
  const skillTier = (s) => s < 0.4 ? "easy" : s < 0.75 ? "mid" : "hard";
  const palette = (w) => w.teams ? TEAM_COLORS : w.players.map(p => COLORS[p.ci]);

  return { W, H, R, COLORS, TEAM_COLORS, MODES, POWERUPS, PU_RATE, BOT_SKILL, create, addPlayer, removePlayer, resetRound, step, movePlayer, integrate, results, packPlayers, packCoins, lobbyInfo, colorOf, assignBot, skillTier, palette };
})();
