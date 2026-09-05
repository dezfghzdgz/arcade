// Simulace Tower. Věž ze seedu (stejná pro všechny), fyzika skoku, checkpointy, láva, boti.
// Souřadnice: x 0..W, y roste NAHORU (0 = podlaha). Kreslení si to otočí.
window.Sim = (() => {
  const T = TW_CONFIG.tuning;
  const W = 360, PW = 16, PH = 20;                         // šířka arény, hráč (box)
  const COLORS = ["#FF5E7E", "#5EE1D0", "#FFCF5A", "#8A5CFF", "#B6FF5A", "#FF9A3C", "#6FC3FF", "#FF7AD9"];
  const TEAM_COLORS = ["#FF5E7E", "#5EE1D0"];
  const MODES = { race: { teams: false }, lava: { teams: false } };
  const HEIGHTS = { short: 25, medium: 45, long: 70 };    // počet pater
  const BOT_SKILL = { easy: [0.15, 0.35], mid: [0.45, 0.65], hard: [0.8, 1.0], mix: [0.15, 1.0] };
  const PU_RATE = {};                                       // (schopnosti tu nejsou – lobby řádek se skryje)

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mulberry = (a) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  // ---------- generování věže
  function genLevel(seed, floors) {
    const rand = mulberry(seed);
    const plats = [{ x: 0, w: W, y: 0, kind: "floor", main: true, i: 0 }];
    let y = 0, lastC = W / 2;
    for (let i = 1; i <= floors; i++) {
      y += 62 + rand() * 20;
      // hlavní cesta: vždy dosažitelná (střed max ±85 od předchozího středu, gap ≤ 82)
      const w = 80 + rand() * 50;
      const c = clamp(lastC + (rand() - 0.5) * 170, w / 2 + 4, W - w / 2 - 4);
      const roll = rand();
      let kind = "static";
      if (i > 6 && roll < 0.16 && w >= 105) kind = "spike";
      if (i % 10 === 0) kind = "check";
      const p = { x: c - w / 2, w, y, kind, i, main: true };
      if (kind === "spike") { p.sw = 24; p.sx = p.x + (w - p.sw) / 2; }   // bodáky uprostřed (24 px), bezpečné kraje ≥ 40 px
      plats.push(p);
      // vedlejší plošina (zkratka/bonus): pružina nebo pohyblivá, mimo hlavní cestu
      if (rand() < 0.4) {
        const w2 = 56 + rand() * 40; const side = c < W / 2 ? 1 : -1;
        const c2 = c + side * (w / 2 + w2 / 2 + 30 + rand() * 40);
        if (c2 - w2 / 2 >= 0 && c2 + w2 / 2 <= W) {
          const r2 = rand(); const q = { x: c2 - w2 / 2, w: w2, y: y + (rand() - 0.5) * 10, kind: r2 < 0.45 ? "spring" : r2 < 0.75 ? "move" : "static", i, main: false };
          if (q.kind === "move") { q.amp = 25 + rand() * 25; q.spd = 0.8 + rand() * 0.6; q.ph = rand() * 6.28; q.x = clamp(q.x, q.amp, W - w2 - q.amp); }
          plats.push(q);
        }
      }
      lastC = c;
    }
    const top = y + 90;
    plats.push({ x: 0, w: W, y: top, kind: "finish", main: true, i: floors + 1 });
    return { plats, top, floors };
  }
  const platX = (p, t) => p.kind === "move" ? p.x + Math.sin(t * p.spd + p.ph) * p.amp : p.x;

  // ---------- svět
  function create(seed, opts = {}) {
    const mode = MODES[opts.mode] ? opts.mode : "race";
    const floors = (HEIGHTS[opts.height] || HEIGHTS.medium) * (mode === "lava" ? 4 : 1);   // v lávě je věž 4× vyšší – láva zrychluje a nakonec dožene každého
    const lvl = genLevel(seed || 1, floors);
    return { seed, mode, teams: false, floors, plats: lvl.plats, top: lvl.top, players: [], t: 0, time: T.timeLimit, phase: "countdown", countdown: 3, events: [], lava: -200, lavaOn: mode === "lava", finished: 0, client: !!opts.client };
  }
  function addPlayer(w, p) {
    const idx = w.players.length; if (idx >= T.maxPlayers) return null;
    const pl = Object.assign({ x: 0, y: 0, vx: 0, vy: 0, dir: 1, ground: false, coyote: 0, jbuf: 0, jumpHeld: false, check: 0, dead: 0, out: false, done: 0, best: 0, score: 0, deaths: 0, input: { dx: 0, jump: false, jumpHeld: false }, bot: false, hat: "none", pattern: "none", pref: -1, ai: {}, skill: 0.5, style: "runner" }, p, { slot: idx });
    pl.ci = pickColor(w, pl.pref); pl.team = idx % 2; placeAtStart(w, pl, idx); w.players.push(pl); return pl;
  }
  function pickColor(w, pref) { const used = new Set(w.players.map(p => p.ci)); if (pref >= 0 && !used.has(pref)) return pref; const free = COLORS.map((_, i) => i).filter(i => !used.has(i)); return free.length ? free[Math.floor(Math.random() * free.length)] : 0; }
  function removePlayer(w, id) { w.players = w.players.filter(p => p.id !== id); w.players.forEach((p, i) => { p.slot = i; p.team = i % 2; }); }
  const colorOf = (w, p) => COLORS[p.ci];
  function placeAtStart(w, p, i) { p.x = 40 + (i % 8) * 40; p.y = 0; p.vx = p.vy = 0; p.ground = true; }

  function resetRound(w, seed, opts = {}) {
    const f = create(seed, opts);
    Object.assign(w, { seed, mode: f.mode, floors: f.floors, plats: f.plats, top: f.top, t: 0, time: T.timeLimit, phase: "countdown", countdown: 3, events: [], lava: -200, lavaOn: f.lavaOn, finished: 0, results: null });
    w.players.forEach((p, i) => { p.slot = i; });
    if (opts.bots) w.players.forEach(p => { if (p.bot) assignBot(p, opts.bots); });
    const order = [...w.players].sort(() => Math.random() - 0.5); const used = new Set();
    for (const p of order) { p.ci = -1; if (p.pref >= 0 && !used.has(p.pref)) { p.ci = p.pref; used.add(p.pref); } }
    for (const p of order) if (p.ci < 0) { const free = COLORS.map((_, i) => i).filter(i => !used.has(i)); p.ci = free[Math.floor(Math.random() * free.length)]; used.add(p.ci); }
    w.players.forEach((p, i) => { placeAtStart(w, p, i); Object.assign(p, { dir: 1, coyote: 0, jbuf: 0, check: 0, dead: 0, out: false, done: 0, best: 0, score: 0, deaths: 0, input: { dx: 0, jump: false, jumpHeld: false }, ai: {} }); });
  }

  // ---------- krok
  function step(w, dt) {
    w.events.length = 0;
    if (w.phase === "countdown") { const b = Math.ceil(w.countdown); w.countdown -= dt; if (Math.ceil(w.countdown) !== b && w.countdown > 0) w.events.push({ t: "count", n: Math.ceil(w.countdown) }); if (w.countdown <= 0) { w.phase = "play"; w.events.push({ t: "go" }); } return; }
    if (w.phase !== "play") return;
    w.t += dt; w.time -= dt;
    if (w.lavaOn && w.t > T.lavaStart) { const u = w.t - T.lavaStart; w.lava += (T.lavaSpeed + u * 1.4 + u * u * 0.06) * dt; }
    for (const p of w.players) {
      if (p.out || p.done) continue;
      if (p.dead > 0) { p.dead -= dt; if (p.dead <= 0) respawn(w, p); continue; }
      if (p.bot) botThink(w, p, dt);
      movePlayer(w, p, dt);
    }
    const alive = w.players.filter(p => !p.out);
    const running = w.players.filter(p => !p.out && !p.done);
    if (w.time <= 0 || running.length === 0 || (w.mode === "lava" && alive.length <= 1 && w.players.length > 1) || (w.mode === "race" && w.finished >= Math.min(3, w.players.length) && w.time < T.timeLimit - 10 && running.every(p => p.bot))) endRound(w);
    if (w.mode === "race" && w.finished > 0 && !w.lastCall) { w.lastCall = true; w.time = Math.min(w.time, 20); w.events.push({ t: "lastcall" }); }   // po prvním v cíli zbývá 20 s
  }
  function endRound(w) { w.phase = "end"; w.events.push({ t: "end" }); w.results = results(w); }

  function movePlayer(w, p, dt) {
    const T_ = T;
    p.coyote = Math.max(0, p.coyote - dt); p.jbuf = Math.max(0, p.jbuf - dt);
    if (p.input.jump) { p.jbuf = T_.jumpBuffer; p.input.jump = false; }
    const dx = clamp(p.input.dx, -1, 1);
    const acc = p.ground ? 1 : T_.airControl;
    p.vx += (dx * T_.speed - p.vx) * Math.min(1, dt * 16 * acc);
    if (dx) p.dir = dx > 0 ? 1 : -1;
    // skok (coyote + buffer)
    if (p.jbuf > 0 && (p.ground || p.coyote > 0)) { p.vy = T_.jump; p.ground = false; p.coyote = 0; p.jbuf = 0; w.events.push({ t: "jump", id: p.id }); }
    // proměnná výška skoku: puštění tlačítka zkrátí
    if (p.bot && !p.ground) { p.ai.holdT = (p.ai.holdT || 0) - dt; if (p.ai.holdT <= 0) p.input.jumpHeld = false; }
    if (!p.input.jumpHeld && p.vy > 200) p.vy = 200;
    p.vy -= T_.gravity * dt;
    if (p.vy < -900) p.vy = -900;
    const oldY = p.y;
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.x < 0) { p.x = 0; p.vx = 0; } if (p.x > W - PW) { p.x = W - PW; p.vx = 0; }
    // přistání na plošinách (jednosměrné: jen při pádu, nohy nad horní hranou)
    const wasGround = p.ground; p.ground = false;
    if (p.vy <= 0) {
      for (const pl of w.plats) {
        const px = platX(pl, w.t);
        if (p.x + PW <= px || p.x >= px + pl.w) continue;
        const topY = pl.y;
        if (oldY >= topY - 1 && p.y <= topY) {
          p.y = topY; p.vy = 0; p.ground = true;
          if (pl.kind === "move") p.x += (platX(pl, w.t) - platX(pl, w.t - dt));
          if (pl.kind === "spring") { p.vy = T_.jump * T_.spring; p.ground = false; if (p.bot) p.ai.lastSpring = pl; w.events.push({ t: "spring", id: p.id, x: p.x, y: p.y }); }
          else if (pl.kind === "spike" && p.x + PW > pl.sx && p.x < pl.sx + pl.sw) { die(w, p); return; }
          else if (pl.kind === "check" && p.check < pl.i) { p.check = pl.i; w.events.push({ t: "check", id: p.id, i: pl.i }); }
          else if (pl.kind === "finish") { finish(w, p); return; }
          break;
        }
      }
    }
    if (wasGround && !p.ground) p.coyote = T_.coyote;
    if (p.y < -40 || (w.lavaOn && p.y < w.lava - 6)) die(w, p);
    p.best = Math.max(p.best, p.y);
  }
  function die(w, p) {
    p.deaths++;
    if (w.lavaOn && p.y < w.lava) { p.out = true; p.done = 0; w.events.push({ t: "out", id: p.id, x: p.x, y: p.y }); p.score = w.players.filter(o => o.out).length; return; }
    p.dead = 1.0; w.events.push({ t: "die", id: p.id, x: p.x, y: p.y });
  }
  function respawn(w, p) {
    const cp = w.plats.filter(pl => pl.kind === "check" && pl.i <= p.check).pop() || w.plats[0];
    p.x = clamp(platX(cp, w.t) + cp.w / 2 - PW / 2, 0, W - PW); p.y = cp.y + 1; p.vx = p.vy = 0; p.ground = true; p.dead = 0;
    if (p.bot) { p.ai.floor = cp.i; p.ai.target = null; p.ai.stuck = 0; }
    if (w.lavaOn && p.y < w.lava) { p.out = true; w.events.push({ t: "out", id: p.id, x: p.x, y: p.y }); p.score = w.players.filter(o => o.out).length; }
  }
  function finish(w, p) { w.finished++; p.done = w.finished; p.score = 1000 - w.finished; w.events.push({ t: "finish", id: p.id, rank: w.finished, x: p.x, y: p.y }); }

  // ---------- boti: jdou po hlavní cestě (main plošiny), skáčou jen když to fyzika dovolí
  function flightReach(gap) {            // kolik px vodorovně urazím, než dopadnu o `gap` výš (plný skok)
    const v = T.jump, g = T.gravity, disc = v * v - 2 * g * Math.max(0, gap);
    if (disc < 0) return -1;
    return (v + Math.sqrt(disc)) / g * T.speed;
  }
  function botThink(w, p, dt) {
    const ai = p.ai, sk = p.skill;
    if (ai.floor === undefined) ai.floor = 0;
    // na které hlavní plošině stojím
    if (p.ground) { for (const pl of w.plats) { if (!pl.main) continue; const px = platX(pl, w.t); if (Math.abs(p.y - pl.y) < 2 && p.x + PW > px && p.x < px + pl.w) { if (pl.i !== ai.floor) { ai.floor = pl.i; ai.stuck = 0; } break; } } }
    ai.stuck = (ai.stuck || 0) + dt;
    // ve vzduchu: při stoupání mířím na svůj cíl, při pádu na nejvyšší rozumnou plošinu pod sebou
    if (!p.ground) {
      let land = null;
      if (p.vy > 0 && ai.target && ai.target.y > p.y - 2) land = ai.target;
      else {
        let ls = -1e9;
        for (const pl of w.plats) { if (pl.y > p.y + 2 || pl.y < p.y - 360 || pl.kind === "floor") continue; const px = platX(pl, w.t), nx = clamp(p.x + PW / 2, px, px + pl.w), d = Math.abs(nx - (p.x + PW / 2)); if (d > 150) continue; let sc = pl.y - d * 0.8 + (pl.main ? 40 : 0); if (pl.kind === "spike") sc -= 60; if (pl.kind === "spring") sc -= 120; if (sc > ls) { ls = sc; land = pl; } }
      }
      if (land) { const dx = safeX(land, w.t, p) - p.x; const stop = Math.abs(p.vx) * 0.08 + 2; p.input.dx = Math.abs(dx) < stop ? 0 : Math.sign(dx); }
      return;
    }
    // noob váhá a dělá přestávky; pro jede plynule
    ai.pause = Math.max(0, (ai.pause || 0) - dt);
    if (ai.pause > 0) { p.input.dx = 0; p.input.jumpHeld = false; return; }
    if (Math.random() < (1 - sk) * 0.012) { ai.pause = 0.3 + Math.random() * 0.9 * (1 - sk); }
    // cíl: další hlavní plošina; když stojím mimo hlavní cestu, nejbližší hlavní nad sebou v dosahu, jinak pod sebou
    let tg = w.plats.find(pl => pl.main && pl.i === ai.floor + 1);
    const onMain = w.plats.some(pl => pl.main && Math.abs(p.y - pl.y) < 2 && p.x + PW > platX(pl, w.t) && p.x < platX(pl, w.t) + pl.w);
    if (!onMain) { const above = w.plats.filter(pl => pl.main && pl.y > p.y + 5 && pl.y < p.y + 100).sort((a, b) => b.y - a.y); tg = above[0] || w.plats.filter(pl => pl.main && pl.y <= p.y + 2).sort((a, b) => b.y - a.y)[0] || tg; }
    if (!tg) { p.input.dx = 0; return; }
    ai.target = tg;
    const tx = safeX(tg, w.t, p);
    const dx = tx - p.x, gap = tg.y - p.y;
    p.input.dx = Math.abs(dx) < 3 ? 0 : Math.sign(dx);
    // stojím na bodácích a cesta k cíli vede přes ně -> přeskočit je
    const cur = w.plats.find(pl => Math.abs(p.y - pl.y) < 2 && p.x + PW > platX(pl, w.t) && p.x < platX(pl, w.t) + pl.w);
    if (cur && cur.kind === "spike") { const a = p.x + PW / 2, b = tx + PW / 2, s1 = cur.sx - 6, s2 = cur.sx + cur.sw + 6; if ((a < s1 && b > s1) || (a > s2 && b < s2)) { if (Math.abs(a - (a < s1 ? s1 : s2)) < 14) { p.input.jump = true; p.input.jumpHeld = true; ai.holdT = 0.25; ai.target = cur; } return; } }
    if (gap <= 0) { if (Math.abs(dx) < 6) { p.input.jump = true; p.input.jumpHeld = false; } return; }   // cíl níž: seskočit
    const reach = flightReach(gap) * (0.6 + sk * 0.3);
    const atEdge = (dx > 0 && p.x >= platEdge(w, p, 1) - 1) || (dx < 0 && p.x <= platEdge(w, p, -1) + 1);
    if ((Math.abs(dx) < 8 || (atEdge && Math.abs(dx) < reach)) && Math.random() < 0.15 + sk * 0.85) { p.input.jump = true; p.input.jumpHeld = true; ai.holdT = 0.5 - (1 - sk) * Math.random() * 0.3; }
    else if (sk < 0.5 && atEdge && Math.random() < 0.02 * (1 - sk)) { p.input.jump = true; p.input.jumpHeld = true; ai.holdT = 0.2; }   // noob občas skočí naslepo
    else p.input.jumpHeld = false;
    // zaseknutí: 3 s bez pokroku -> náhodný skok stranou
    if (ai.stuck > 3) { ai.stuck = 0; p.input.dx = Math.random() < 0.5 ? -1 : 1; p.input.jump = true; p.input.jumpHeld = true; }
    if (sk < 0.4 && Math.random() < 0.01) { p.input.dx = -p.input.dx; }
    if (w.lavaOn && p.y - w.lava < 50 && Math.abs(dx) < reach) { p.input.jump = true; p.input.jumpHeld = true; }
  }
  // bezpečné místo na plošině (u bodáků kraj blíž ke mně), jinak nejbližší bod v rozsahu
  function safeX(pl, t, p) {
    const px = platX(pl, t);
    if (pl.kind === "spike") return p.x + PW / 2 < pl.sx + pl.sw / 2 ? px + Math.max(2, (pl.sx - px - PW) / 2) : px + pl.w - PW - Math.max(2, (px + pl.w - pl.sx - pl.sw - PW) / 2);
    return clamp(p.x, px + 3, px + pl.w - PW - 3);
  }
  // okraj plošiny, na které stojím, ve směru dir
  function platEdge(w, p, dir) {
    for (const pl of w.plats) { const px = platX(pl, w.t); if (Math.abs(p.y - pl.y) < 2 && p.x + PW > px && p.x < px + pl.w) return dir > 0 ? px + pl.w - PW : px; }
    return p.x;
  }

  // ---------- výsledky
  function results(w) {
    const rows = w.players.map(p => ({ id: p.id, name: p.name, color: colorOf(w, p), slot: p.slot, bot: p.bot, done: p.done, out: p.out, best: Math.round(p.best), floor: Math.round(p.best / 78), deaths: p.deaths, pct: 0, own: 0 }));
    if (w.mode === "race") rows.sort((a, b) => (a.done || 99) - (b.done || 99) || b.best - a.best);
    else rows.sort((a, b) => (a.out ? 1 : 0) - (b.out ? 1 : 0) || b.best - a.best);
    rows.forEach((r, i) => { r.rank = i + 1; r.value = w.mode === "race" ? (r.done ? "🏁" : r.floor + "F") : (r.out ? r.floor + "F" : "✓"); r.own = r.floor; r.coins = r.bot ? 0 : Math.round(10 + Math.min(50, r.floor) + (i === 0 ? 25 : i === 1 ? 10 : 0)); r.win = i === 0; });
    return rows;
  }
  function packPlayers(w) { return w.players.map(p => [p.id, Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10, p.dir, (p.ground ? 1 : 0) | (p.dead > 0 ? 8 : 0) | (p.out ? 16 : 0) | (p.done ? 32 : 0), Math.round(p.best), p.done]); }
  function lobbyInfo(w) { return w.players.map(p => ({ id: p.id, name: p.name, color: colorOf(w, p), ci: p.ci, team: p.team, hat: p.hat, pattern: p.pattern, bot: !!p.bot, skill: p.bot ? p.skill : undefined })); }
  function assignBot(p, difficulty) { const [a, b] = BOT_SKILL[difficulty] || BOT_SKILL.mix; p.skill = Math.round((a + Math.random() * (b - a)) * 100) / 100; p.ai = {}; }
  const skillTier = (s) => s < 0.4 ? "easy" : s < 0.75 ? "mid" : "hard";
  const palette = (w) => w.players.map(p => COLORS[p.ci]);

  return { W, PW, PH, COLORS, TEAM_COLORS, MODES, HEIGHTS, PU_RATE, BOT_SKILL, POWERUPS: {}, create, addPlayer, removePlayer, resetRound, step, movePlayer, results, packPlayers, lobbyInfo, colorOf, assignBot, skillTier, palette, platX };
})();
