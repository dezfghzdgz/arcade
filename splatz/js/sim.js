// Simulace Splatz. Čistá data, žádné kreslení – běží na hostiteli (a u klienta pro predikci vlastního pohybu).
window.Sim = (() => {
  const T = SZ_CONFIG.tuning;
  const W = 360, H = 600, CELL = 6, GW = W / CELL, GH = H / CELL;   // 60 x 100 buněk
  const R = 9;

  const COLORS = ["#FF5E7E", "#5EE1D0", "#FFCF5A", "#8A5CFF", "#B6FF5A", "#FF9A3C", "#6FC3FF", "#FF7AD9"];
  const TEAM_COLORS = ["#FF5E7E", "#5EE1D0"];
  const MODES = {
    paint:      { teams: false, obj: null },     // nejvíc barvy
    team:       { teams: true,  obj: null },     // týmy 2 barvy
    deathmatch: { teams: false, obj: null },     // KO dashem / zbraní
    race:       { teams: false, obj: "target" }, // první u cíle
    koth:       { teams: false, obj: "zone" },   // kdo drží zónu
  };
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
    const mode = MODES[opts.mode] ? opts.mode : "paint";
    return {
      seed, obstacles, mode, teams: MODES[mode].teams,
      paint: new Uint8Array(GW * GH), counts: new Uint16Array(9),
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
    Object.assign(w, { obstacles: fresh.obstacles, mode: fresh.mode, teams: fresh.teams, paint: fresh.paint, counts: fresh.counts, powerups: [], projectiles: [],
      time: fresh.time, roundSeconds: fresh.roundSeconds, target: fresh.target, puEvery: fresh.puEvery, phase: "countdown", countdown: 3, dirty: [], events: [], nextPowerup: 4, seed, objective: null, objTimer: 0, results: null });
    if (opts.bots) w.players.forEach(p => { if (p.bot) assignBot(p, opts.bots); });
    reindex(w);
    // preferované barvy: kdo má, dostane; kolize řeší náhoda
    const order = [...w.players].sort(() => Math.random() - 0.5); const used = new Set();
    for (const p of order) { p.ci = -1; if (p.pref >= 0 && !used.has(p.pref)) { p.ci = p.pref; used.add(p.pref); } }
    for (const p of order) if (p.ci < 0) { const free = COLORS.map((_, i) => i).filter(i => !used.has(i)); p.ci = free[Math.floor(Math.random() * free.length)]; used.add(p.ci); }
    w.players.forEach((p, i) => { placeAtStart(w, p, i); Object.assign(p, { vx: 0, vy: 0, dash: 0, dashCd: 0, stun: 0, speedBoost: 0, shield: false, giant: 0, gun: 0, bomb: 0, frenzy: 0, dead: 0, score: 0, kos: 0, input: { dx: 0, dy: 0, dash: false }, ai: {} }); });
    if (MODES[w.mode].obj) newObjective(w);
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

  // ---------- krok
  function step(w, dt) {
    w.events.length = 0;
    if (w.phase === "countdown") {
      const before = Math.ceil(w.countdown); w.countdown -= dt;
      if (Math.ceil(w.countdown) !== before && w.countdown > 0) w.events.push({ t: "count", n: Math.ceil(w.countdown) });
      if (w.countdown <= 0) { w.phase = "play"; w.events.push({ t: "go" }); }
      return;
    }
    if (w.phase !== "play") return;
    w.time -= dt;
    if (w.time <= 0) { w.time = 0; w.phase = "end"; w.events.push({ t: "end" }); w.results = results(w); return; }
    if (Math.ceil(w.time) <= 5 && Math.ceil(w.time + dt) !== Math.ceil(w.time)) w.events.push({ t: "tick" });

    // power-upy
    w.nextPowerup -= dt;
    if (w.puEvery > 0 && w.nextPowerup <= 0 && w.powerups.length < 3) {
      w.nextPowerup = w.puEvery;
      const s = freeSpot(w);
      const total = Object.values(POWERUPS).reduce((a, b) => a + b, 0); let r = Math.random() * total, kind = "bomb";
      for (const [k, wgt] of Object.entries(POWERUPS)) { r -= wgt; if (r <= 0) { kind = k; break; } }
      w.powerups.push({ id: w.puId++, kind, x: s.x, y: s.y });
    }
    // zóna se stěhuje
    if (w.objective && w.objective.kind === "zone") { w.objTimer -= dt; if (w.objTimer <= 0) { newObjective(w); w.events.push({ t: "zone" }); } }

    for (const p of w.players) {
      if (p.dead > 0) { p.dead -= dt; if (p.dead <= 0) { placeAtStart(w, p, p.slot); p.stun = 0; p.dead = 0; w.events.push({ t: "respawn", id: p.id }); } continue; }
      if (p.bot) botThink(w, p, dt);
      movePlayer(w, p, dt);
    }
    for (let i = 0; i < w.players.length; i++) for (let j = i + 1; j < w.players.length; j++) collide(w, w.players[i], w.players[j]);
    for (const p of w.players) if (p.dead <= 0) unstick(w, p);
    stepProjectiles(w, dt);
    stepObjective(w, dt);
    // cílové skóre: první, kdo ho dosáhne, ukončí kolo
    if (w.target > 0 && w.mode !== "paint" && w.mode !== "team" && w.players.some(p => p.score >= w.target)) { w.phase = "end"; w.events.push({ t: "end" }); w.results = results(w); }
  }

  function movePlayer(w, p, dt) {
    p.dashCd = Math.max(0, p.dashCd - dt); p.stun = Math.max(0, p.stun - dt); p.frozen = Math.max(0, (p.frozen || 0) - dt); p.speedBoost = Math.max(0, p.speedBoost - dt); p.giant = Math.max(0, p.giant - dt);
    p.bomb = Math.max(0, p.bomb - dt); p.frenzy = Math.max(0, p.frenzy - dt);
    if (p.frenzy > 0) p.dashCd = 0;
    const owner = ownerAt(w, p.x, p.y), me = ownerOf(w, p);
    let speed = owner === me ? T.speedOwn : owner === 0 ? T.speed : T.speedEnemy;
    if (p.speedBoost > 0) speed *= 1.5;
    if (p.giant > 0) speed *= 0.9;

    let dx = p.input.dx, dy = p.input.dy;
    const len = Math.hypot(dx, dy);
    if (len > 1) { dx /= len; dy /= len; }

    if (p.input.dash && p.stun <= 0) {
      if (p.gun > 0) { shoot(w, p, len > 0.2 ? Math.atan2(dy, dx) : p.dir); }
      else if (p.dashCd <= 0 && len > 0.2) {
        p.dash = T.dashTime; p.dashCd = T.dashCooldown; p.dashDx = dx / (len || 1); p.dashDy = dy / (len || 1);
        paintCircle(w, p.x, p.y, T.dashSplash, me);
        w.events.push({ t: "dash", id: p.id, x: p.x, y: p.y });
      }
    }
    p.input.dash = false;

    if (p.stun > 0) { p.vx *= 0.9; p.vy *= 0.9; }
    else if (p.dash > 0) { p.dash -= dt; p.vx = p.dashDx * T.dashSpeed; p.vy = p.dashDy * T.dashSpeed; }
    else { p.vx += (dx * speed - p.vx) * Math.min(1, dt * 14); p.vy += (dy * speed - p.vy) * Math.min(1, dt * 14); }

    if (Math.hypot(p.vx, p.vy) > 5) p.dir = Math.atan2(p.vy, p.vx);
    const nx = clamp(p.x + p.vx * dt, R, W - R), ny = clamp(p.y + p.vy * dt, R, H - R);
    p.x = blocked(w, nx, p.y) ? p.x : nx;
    p.y = blocked(w, p.x, ny) ? p.y : ny;
    if (p.stun <= 0) paintCircle(w, p.x, p.y, (p.dash > 0 ? T.paintRadius * 1.3 : T.paintRadius) * (p.giant > 0 ? 2 : 1), me);
    if (p.bomb > 0) paintCircle(w, p.x, p.y, T.bombRadius, me);   // bomba = 5 s aura, která přebarvuje všechno kolem

    for (let i = w.powerups.length - 1; i >= 0; i--) {
      const pu = w.powerups[i];
      if (Math.hypot(pu.x - p.x, pu.y - p.y) < R + 9) { w.powerups.splice(i, 1); applyPowerup(w, p, pu.kind); }
    }
  }

  function applyPowerup(w, p, kind) {
    const me = ownerOf(w, p);
    p.powerups = (p.powerups || 0) + 1;
    if (kind === "bomb") { p.bomb = 5; w.events.push({ t: "bomb", id: p.id, x: p.x, y: p.y, color: colorOf(w, p) }); }
    else if (kind === "frenzy") { p.frenzy = 3; p.dashCd = 0; w.events.push({ t: "pickup", id: p.id, kind }); }
    else if (kind === "speed") { p.speedBoost = 5; w.events.push({ t: "pickup", id: p.id, kind }); }
    else if (kind === "shield") { p.shield = true; w.events.push({ t: "pickup", id: p.id, kind }); }
    else if (kind === "giant") { p.giant = 6; p.stun = 0; w.events.push({ t: "pickup", id: p.id, kind }); }
    else if (kind === "gun") { p.gun = 3; w.events.push({ t: "pickup", id: p.id, kind }); }
    else if (kind === "freeze") {
      for (const o of w.players) if (o !== p && o.dead <= 0 && (!w.teams || o.team !== p.team) && Math.hypot(o.x - p.x, o.y - p.y) < 110) { if (o.shield) o.shield = false; else { o.stun = Math.max(o.stun, 1.6); o.frozen = 1.6; } }
      w.events.push({ t: "freeze", x: p.x, y: p.y });
    }
  }

  function shoot(w, p, angle) {
    p.gun--;
    if (!w.client) w.projectiles.push({ x: p.x + Math.cos(angle) * (R + 4), y: p.y + Math.sin(angle) * (R + 4), vx: Math.cos(angle) * 420, vy: Math.sin(angle) * 420, owner: p.slot, life: 0.7 });
    w.events.push({ t: "shoot", id: p.id, x: p.x, y: p.y });
  }
  function stepProjectiles(w, dt) {
    for (let i = w.projectiles.length - 1; i >= 0; i--) {
      const pr = w.projectiles[i], sh = w.players.find(p => p.slot === pr.owner);
      if (!sh) { w.projectiles.splice(i, 1); continue; }
      const own = ownerOf(w, sh);
      pr.x += pr.vx * dt; pr.y += pr.vy * dt; pr.life -= dt;
      paintCircle(w, pr.x, pr.y, 5, own);
      let done = pr.life <= 0 || pr.x < 0 || pr.x > W || pr.y < 0 || pr.y > H || inObstacle(w, pr.x, pr.y);
      for (const v of w.players) {
        if (v === sh || v.dead > 0 || (w.teams && v.team === sh.team)) continue;
        if (Math.hypot(v.x - pr.x, v.y - pr.y) < R + 4) { done = true; if (v.shield) { v.shield = false; w.events.push({ t: "shieldpop", id: v.id }); } else { hitPlayer(w, sh, v, pr.vx / 420, pr.vy / 420, 0.7); } break; }
      }
      if (done) { paintCircle(w, clamp(pr.x, 0, W), clamp(pr.y, 0, H), 18, own); w.events.push({ t: "splash", x: pr.x, y: pr.y, color: colorOf(w, sh) }); w.projectiles.splice(i, 1); }
    }
  }

  function collide(w, a, b) {
    if (a.dead > 0 || b.dead > 0) return;
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
    const ra = a.giant > 0 ? R * 1.5 : R, rb = b.giant > 0 ? R * 1.5 : R;
    if (d >= ra + rb || d === 0) return;
    const nx = dx / d, ny = dy / d, overlap = ra + rb - d;
    const wa = a.giant > 0 ? 0.2 : 0.5, wb = 1 - wa;
    a.x -= nx * overlap * wa; a.y -= ny * overlap * wa; b.x += nx * overlap * wb; b.y += ny * overlap * wb;
    const mates = w.teams && a.team === b.team;
    const aDash = a.dash > 0, bDash = b.dash > 0;
    if (mates) return;
    if (aDash && !bDash && b.stun <= 0) attack(w, a, b, nx, ny);
    else if (bDash && !aDash && a.stun <= 0) attack(w, b, a, -nx, -ny);
    else if (aDash && bDash) { a.stun = b.stun = T.stunTime * 0.5; a.vx = -nx * 200; a.vy = -ny * 200; b.vx = nx * 200; b.vy = ny * 200; w.events.push({ t: "bump", x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }); }
  }
  function attack(w, att, vic, nx, ny) {
    if (vic.shield) { vic.shield = false; att.dash = 0; att.vx = -nx * 220; att.vy = -ny * 220; w.events.push({ t: "shieldpop", id: vic.id, x: vic.x, y: vic.y }); return; }
    if (vic.giant > 0) { att.dash = 0; att.stun = T.stunTime * 0.6; att.vx = -nx * 260; att.vy = -ny * 260; w.events.push({ t: "bump", x: att.x, y: att.y, victim: att.id, by: vic.id }); return; }
    hitPlayer(w, att, vic, nx, ny, 1);
    att.dash = 0;
  }
  function hitPlayer(w, att, vic, nx, ny, k) {
    vic.stun = T.stunTime * k; vic.vx = nx * 260; vic.vy = ny * 260; vic.dash = 0;
    paintCircle(w, vic.x, vic.y, T.dashSplash + 4, ownerOf(w, att));
    w.events.push({ t: "bump", x: vic.x, y: vic.y, victim: vic.id, by: att.id });
    att.kos++;
    if (w.mode === "deathmatch") { att.score++; vic.dead = 2; vic.deaths = (vic.deaths || 0) + 1; w.events.push({ t: "ko", victim: vic.id, by: att.id, x: vic.x, y: vic.y }); }
  }

  function stepObjective(w, dt) {
    const o = w.objective; if (!o) return;
    if (o.kind === "target") {
      for (const p of w.players) if (p.dead <= 0 && Math.hypot(p.x - o.x, p.y - o.y) < o.r + R) { p.score++; w.events.push({ t: "capture", id: p.id, x: o.x, y: o.y, color: colorOf(w, p) }); newObjective(w); break; }
    } else if (o.kind === "zone") {
      // body ze zóny se dělí mezi všechny uvnitř – sám = plná sekunda za sekundu
      const inside = w.players.filter(p => p.dead <= 0 && p.stun <= 0 && Math.hypot(p.x - o.x, p.y - o.y) < o.r);
      for (const p of inside) p.score += dt / inside.length;
      o.holder = inside.length === 1 ? inside[0].id : null; o.contested = inside.length > 1;
    }
  }

  // ---------- boti: skill 0..1 (reakce, přesnost, chytrost) + styl (painter / hunter / collector / camper)
  function botThink(w, p, dt) {
    const ai = p.ai, sk = p.skill;
    ai.t = (ai.t || 0) - dt;
    if (ai.t <= 0 || !ai.target) {
      ai.t = rnd(0.5, 1.2) * (1.6 - sk);                       // noob přemýšlí pomaleji
      let best = null, bestScore = -1e9;
      const enemies = w.players.filter(o => o !== p && o.dead <= 0 && (!w.teams || o.team !== p.team));
      const objProb = p.style === "camper" ? 0.9 : 0.35 + sk * 0.4;
      const huntProb = p.style === "hunter" ? 0.6 + sk * 0.3 : w.mode === "deathmatch" ? 0.4 + sk * 0.4 : 0.05 + sk * 0.1;
      const puProb = p.style === "collector" ? 0.85 : 0.2 + sk * 0.4;

      if (w.objective && Math.random() < objProb) { best = { x: w.objective.x + rnd(-15, 15), y: w.objective.y + rnd(-15, 15) }; bestScore = 1e6; }
      if (bestScore < 1e6 && enemies.length && Math.random() < huntProb) {
        // hunter jde po nejbližším, pro si vybírá omráčené / bez štítu
        let pick = null, pd = 1e9;
        for (const o of enemies) { const d = Math.hypot(o.x - p.x, o.y - p.y) - (o.stun > 0 ? 60 * sk : 0) + (o.shield ? 50 * sk : 0) + (o.giant > 0 ? 200 : 0); if (d < pd) { pd = d; pick = o; } }
        if (pick) { best = { x: pick.x, y: pick.y, chase: pick }; bestScore = 1e6; }
      }
      if (bestScore < 1e6 && w.powerups.length && Math.random() < puProb) {
        let pu = w.powerups[0], pd = 1e9;
        for (const q of w.powerups) { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < pd) { pd = d; pu = q; } }
        best = { x: pu.x, y: pu.y }; bestScore = 1e6;
      }
      const samples = 6 + Math.round(sk * 12);                  // pro zkoumá víc kandidátů
      for (let k = 0; k < samples && bestScore < 1e6; k++) {
        const x = rnd(15, W - 15), y = rnd(15, H - 15);
        if (blocked(w, x, y, 12)) continue;
        let gain = 0;
        for (let r = -2; r <= 2; r++) for (let c = -2; c <= 2; c++) {
          const cc = Math.floor(x / CELL) + c, rr = Math.floor(y / CELL) + r;
          if (cc < 0 || rr < 0 || cc >= GW || rr >= GH) continue;
          const o = w.paint[rr * GW + cc]; gain += o === 0 ? 1 : o === ownerOf(w, p) ? 0 : 1.4;
        }
        const score = gain * 10 - Math.hypot(x - p.x, y - p.y) * (0.15 + sk * 0.2) + rnd(0, 60 * (1 - sk));
        if (score > bestScore) { bestScore = score; best = { x, y }; }
      }
      ai.target = best;
    }
    // sledování cíle (hunter přepočítává pozici oběti)
    const tg = ai.target.chase && ai.target.chase.dead <= 0 ? ai.target.chase : ai.target;
    let dx = tg.x - p.x, dy = tg.y - p.y; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    // noob se občas zakolísá
    if (sk < 0.5 && Math.random() < 0.15 * (1 - sk)) { const a = rnd(-1, 1); [dx, dy] = [dx * Math.cos(a) - dy * Math.sin(a), dx * Math.sin(a) + dy * Math.cos(a)]; }
    if (d < 14) ai.t = 0;
    if (blocked(w, p.x + dx * 18, p.y + dy * 18)) { const s = ai.side || (ai.side = Math.random() < 0.5 ? 1 : -1); [dx, dy] = [-dy * s, dx * s]; if (blocked(w, p.x + dx * 18, p.y + dy * 18)) { ai.side = -s; [dx, dy] = [-dx, -dy]; } }
    p.input.dx = dx; p.input.dy = dy;

    // útok: dash / střelba; přesnost a rozhodnost roste se skillem
    let dash = false;
    const range = p.gun > 0 ? 80 + sk * 80 : 30 + sk * 20;
    for (const o of w.players) {
      if (o === p || o.dead > 0 || (w.teams && o.team === p.team)) continue;
      if (o.stun > 0 && sk > 0.5) continue;                     // pro neplýtvá dashem na omráčené
      if (o.giant > 0 && sk > 0.6) continue;                    // pro neútočí na obra
      const od = Math.hypot(o.x - p.x, o.y - p.y);
      if (od < range && p.dashCd <= 0 && Math.random() < 0.08 + sk * 0.25) {
        const err = (1 - sk) * 0.5; const a = Math.atan2(o.y - p.y, o.x - p.x) + rnd(-err, err);
        p.input.dx = Math.cos(a); p.input.dy = Math.sin(a); dash = true;
      }
    }
    // frenzy: dashuje pořád, jinak náhodný dash kvůli rychlosti
    if (!dash && p.dashCd <= 0 && p.gun <= 0 && Math.random() < (p.frenzy > 0 ? 0.6 : 0.005 + sk * 0.015)) dash = true;
    p.input.dash = dash;
  }

  // ---------- výsledky
  function coverage(w) {
    const total = GW * GH;
    return w.players.map(p => ({ id: p.id, name: p.name, color: colorOf(w, p), team: p.team, slot: p.slot, bot: p.bot, pct: Math.round(1000 * w.counts[ownerOf(w, p)] / total) / 10, score: Math.round(p.score * 10) / 10, kos: p.kos }));
  }
  function results(w) {
    const rows = coverage(w);
    const key = w.mode === "paint" || w.mode === "team" ? "pct" : "score";
    rows.sort((a, b) => b[key] - a[key] || b.pct - a.pct);
    rows.forEach((r, i) => { r.rank = i + 1; r.value = r[key]; r.coins = r.bot ? 0 : Math.round(10 + (key === "pct" ? r.pct * (w.teams ? 0.6 : 1.2) : Math.min(60, r.score * 3)) + (i === 0 ? 25 : i === 1 ? 10 : 0)); });
    if (w.teams) { const winTeam = rows[0].team; rows.forEach(r => { r.win = r.team === winTeam; if (!r.bot && r.win) r.coins += 15; }); }
    else rows.forEach((r, i) => r.win = i === 0);
    return rows;
  }

  // ---------- serializace pro síť
  function packPlayers(w) {
    return w.players.map(p => [p.id, Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10, Math.round(p.dir * 100) / 100,
      (p.stun > 0 ? 1 : 0) | (p.dash > 0 ? 2 : 0) | (p.speedBoost > 0 ? 4 : 0) | (p.dead > 0 ? 8 : 0) | (p.shield ? 16 : 0) | (p.giant > 0 ? 32 : 0) | (p.frozen > 0 && p.stun > 0 ? 64 : 0) | (p.bomb > 0 ? 128 : 0) | (p.frenzy > 0 ? 256 : 0),
      p.gun, p.dashCd > 0 ? 1 : 0, Math.round(p.score * 10) / 10]);
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
