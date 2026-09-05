// Simulace Front. Mřížka: terrain (0 voda / 1 země), owner (0 nikdo / slot+1). Ekonomika: vojáci + zlato.
// Stavby: město, obranné stanoviště, přístav, silo, SAM, továrna. Jednotky: loď (výsadek), válečná loď, jaderné zbraně.
window.Sim = (() => {
  const T = FR_CONFIG.tuning, U = FR_CONFIG.units;
  const GW = 192, GH = 120, N = GW * GH;
  const COLORS = ["#FF5E7E", "#5EE1D0", "#FFCF5A", "#8A5CFF", "#B6FF5A", "#FF9A3C", "#6FC3FF", "#FF7AD9"];
  const TEAM_COLORS = COLORS;
  const MODES = { classic: {}, timed: {} };
  const MAPS = ["random", "islands", "continents", "pangaea", "lake", "archipelago", "draw"];
  const UNIT_KEYS = Object.keys(U);
  const BOT_SKILL = { easy: [0.15, 0.35], mid: [0.45, 0.65], hard: [0.8, 1.0], mix: [0.15, 1.0] };
  const PU_RATE = {};
  const mulberry = (a) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const idx = (x, y) => y * GW + x;
  const cx = (i) => i % GW, cy = (i) => (i / GW) | 0;
  const dist = (a, b) => Math.hypot(cx(a) - cx(b), cy(a) - cy(b));
  const N4 = (i, fn) => { const x = cx(i), y = cy(i); if (x > 0) fn(i - 1); if (x < GW - 1) fn(i + 1); if (y > 0) fn(i - GW); if (y < GH - 1) fn(i + GW); };

  // ---------- mapy
  function blobs(rand, t, list) { for (const [bx, by, rx, ry, rot] of list) for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { const dx = x - bx, dy = y - by, u = (dx * Math.cos(rot) + dy * Math.sin(rot)) / rx, v = (-dx * Math.sin(rot) + dy * Math.cos(rot)) / ry; if (u * u + v * v + (rand() - 0.5) * 0.3 < 1) t[idx(x, y)] = 1; } }
  function smooth(t) { const s = new Uint8Array(t); for (let y = 1; y < GH - 1; y++) for (let x = 1; x < GW - 1; x++) { let n = 0; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) n += t[idx(x + i, y + j)]; s[idx(x, y)] = n >= 5 ? 1 : 0; } for (let x = 0; x < GW; x++) { s[x] = 0; s[idx(x, GH - 1)] = 0; } for (let y = 0; y < GH; y++) { s[idx(0, y)] = 0; s[idx(GW - 1, y)] = 0; } return s; }
  function genTerrain(seed, map) {
    const rand = mulberry(seed || 1), t = new Uint8Array(N), R = (a, b) => a + rand() * (b - a);
    if (map === "islands") { const L = []; for (let b = 0; b < 8; b++) L.push([R(20, GW - 20), R(14, GH - 14), R(12, 26), R(9, 18), R(0, 3.14)]); blobs(rand, t, L); }
    else if (map === "continents") { blobs(rand, t, [[GW * 0.28, GH * 0.5, GW * 0.2, GH * 0.36, R(-0.3, 0.3)], [GW * 0.73, GH * 0.5, GW * 0.2, GH * 0.36, R(-0.3, 0.3)]]); for (let b = 0; b < 3; b++) blobs(rand, t, [[R(20, GW - 20), R(12, GH - 12), R(5, 9), R(4, 7), 0]]); }
    else if (map === "pangaea") { blobs(rand, t, [[GW * 0.5, GH * 0.5, GW * 0.42, GH * 0.4, 0]]); for (let b = 0; b < 6; b++) { const bx = R(30, GW - 30), by = R(20, GH - 20), r = R(6, 12); for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (Math.hypot(x - bx, y - by) < r) t[idx(x, y)] = 0; } }
    else if (map === "lake") { blobs(rand, t, [[GW * 0.5, GH * 0.5, GW * 0.46, GH * 0.45, 0]]); for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (Math.hypot((x - GW / 2) / 1.4, y - GH / 2) < GH * 0.26 + (rand() - 0.5) * 3) t[idx(x, y)] = 0; }
    else if (map === "archipelago") { const L = []; for (let b = 0; b < 22; b++) L.push([R(10, GW - 10), R(8, GH - 8), R(5, 12), R(4, 9), R(0, 3.14)]); blobs(rand, t, L); }
    else { const L = []; const n = 6 + Math.floor(rand() * 5); for (let b = 0; b < n; b++) L.push([R(16, GW - 16), R(12, GH - 12), R(12, 30), R(9, 20), R(0, 3.14)]); blobs(rand, t, L); }
    return smooth(t);
  }

  function create(seed, opts = {}) {
    const mode = MODES[opts.mode] ? opts.mode : "classic", map = MAPS.includes(opts.map) ? opts.map : "random";
    const disabled = new Set(opts.disabled || []);
    return {
      seed, mode, map, draw: map === "draw", disabled, teams: false,
      terrain: map === "draw" ? new Uint8Array(N) : genTerrain(seed, map), owner: new Uint8Array(N), cells: new Int32Array(9),
      players: [], attacks: [], boats: [], nukes: [], buildings: [], bid: 1,
      phase: "countdown", countdown: 3, time: mode === "timed" ? 180 : 480, t: 0,
      dirty: [], tdirty: [], events: [], client: !!opts.client,
    };
  }
  function addPlayer(w, p) {
    const i = w.players.length; if (i >= T.maxPlayers) return null;
    const pl = Object.assign({ troops: 30, gold: T.startGold, spawned: false, alive: true, out: 0, input: [], bot: false, hat: "none", pattern: "none", pref: -1, ai: {}, skill: 0.5, kills: 0, peak: 0 }, p, { slot: i });
    pl.ci = pickColor(w, pl.pref); pl.team = i % 2; w.players.push(pl); return pl;
  }
  function pickColor(w, pref) { const used = new Set(w.players.map(p => p.ci)); if (pref >= 0 && !used.has(pref)) return pref; const free = COLORS.map((_, i) => i).filter(i => !used.has(i)); return free.length ? free[Math.floor(Math.random() * free.length)] : 0; }
  function removePlayer(w, id) { w.players = w.players.filter(q => q.id !== id); w.players.forEach((q, i) => { q.slot = i; q.team = i % 2; }); w.owner.fill(0); w.cells.fill(0); w.buildings = []; }
  const colorOf = (w, p) => COLORS[p.ci];
  function resetRound(w, seed, opts = {}) {
    const f = create(seed, opts);
    Object.assign(w, { seed, mode: f.mode, map: f.map, draw: f.draw, disabled: f.disabled, terrain: f.terrain, owner: f.owner, cells: f.cells, attacks: [], boats: [], nukes: [], buildings: [], bid: 1, phase: "countdown", countdown: 3, time: f.time, t: 0, dirty: [], tdirty: [], events: [], results: null });
    w.players.forEach((p, i) => { p.slot = i; });
    if (opts.bots) w.players.forEach(p => { if (p.bot) assignBot(p, opts.bots); });
    const order = [...w.players].sort(() => Math.random() - 0.5); const used = new Set();
    for (const p of order) { p.ci = -1; if (p.pref >= 0 && !used.has(p.pref)) { p.ci = p.pref; used.add(p.pref); } }
    for (const p of order) if (p.ci < 0) { const free = COLORS.map((_, i) => i).filter(i => !used.has(i)); p.ci = free[Math.floor(Math.random() * free.length)]; used.add(p.ci); }
    w.players.forEach(p => Object.assign(p, { troops: 30, gold: T.startGold, spawned: false, alive: true, out: 0, input: [], ai: {}, kills: 0, peak: 0, spawnAt: null }));
  }
  function setOwner(w, i, o) { const prev = w.owner[i]; if (prev === o) return; w.owner[i] = o; w.cells[prev]--; w.cells[o]++; w.dirty.push((i << 4) | o); const b = w.buildings.find(b => b.cell === i); if (b && b.owner !== o) { removeBuilding(w, b, "captured"); } }
  function paint(w, cellsList, val) { for (const i of cellsList) { if (i < 0 || i >= N || w.terrain[i] === val) continue; w.terrain[i] = val; w.tdirty.push((i << 1) | val); } }
  const isCoast = (w, i) => { let c = false; N4(i, j => { if (!w.terrain[j]) c = true; }); return c; };
  const has = (w, p, type) => w.buildings.some(b => b.owner === p.slot + 1 && b.type === type);
  const enabled = (w, type) => !w.disabled.has(type);
  function removeBuilding(w, b, why) { w.buildings = w.buildings.filter(x => x !== b); w.events.push({ t: "bdestroy", id: b.id, cell: b.cell, type: b.type, why }); }

  // ---------- krok
  function step(w, dt) {
    w.events.length = 0;
    if (w.phase === "countdown") { const b = Math.ceil(w.countdown); w.countdown -= dt; if (Math.ceil(w.countdown) !== b && w.countdown > 0) w.events.push({ t: "count", n: Math.ceil(w.countdown) }); if (w.countdown <= 0) { w.phase = w.draw ? "draw" : "spawn"; w.countdown = w.draw ? T.drawSeconds : T.spawnSeconds; w.events.push({ t: w.draw ? "drawStart" : "spawnStart" }); } return; }
    if (w.phase === "draw") { w.countdown -= dt; for (const p of w.players) if (p.bot) botDraw(w, p, dt); if (w.countdown <= 0) { ensureLand(w); w.phase = "spawn"; w.countdown = T.spawnSeconds; w.events.push({ t: "spawnStart" }); } return; }
    if (w.phase === "spawn") { w.countdown -= dt; for (const p of w.players) if (!p.spawned && (p.bot || w.countdown <= 0)) doSpawn(w, p, p.spawnAt ?? randomLand(w)); if (w.players.every(p => p.spawned) || w.countdown <= 0) { w.phase = "play"; w.events.push({ t: "go" }); } return; }
    if (w.phase !== "play") return;
    w.t += dt; w.time -= dt;
    for (const p of w.players) {
      if (!p.alive) continue;
      const c = w.cells[p.slot + 1];
      if (c === 0) { p.alive = false; p.out = w.t; w.events.push({ t: "out", id: p.id }); for (const b of w.buildings.filter(b => b.owner === p.slot + 1)) removeBuilding(w, b, "out"); continue; }
      const cities = w.buildings.filter(b => b.owner === p.slot + 1 && b.type === "city").length, fac = w.buildings.filter(b => b.owner === p.slot + 1 && b.type === "factory").length;
      const max = T.maxBase + c * T.maxPerCell + cities * U.city.troopCap;
      p.troops = Math.min(max, p.troops + (T.growBase + c * T.growPerCell + cities * U.city.grow) * dt * (p.troops < max * 0.5 ? 1.2 : 0.7));
      p.gold += (T.goldBase + c * T.goldPerCell + fac * U.factory.gold) * dt;
      p.max = max; p.peak = Math.max(p.peak, c);
      if (p.bot) botThink(w, p, dt);
      while (p.input.length) { const a = p.input.shift(); doAction(w, p, a); }
    }
    stepAttacks(w, dt); stepBoats(w, dt); stepNukes(w, dt); stepWarships(w, dt);
    const alive = w.players.filter(p => p.alive);
    const land = w.terrain.reduce((a, b) => a + b, 0) || 1;
    const leader = [...alive].sort((a, b) => w.cells[b.slot + 1] - w.cells[a.slot + 1])[0];
    if (w.time <= 0 || alive.length <= 1 || (leader && w.cells[leader.slot + 1] / land >= T.winShare)) { w.phase = "end"; w.events.push({ t: "end" }); w.results = results(w); }
  }
  function ensureLand(w) { if (w.terrain.reduce((a, b) => a + b, 0) < 1500) { const g = genTerrain(w.seed, "random"); for (let i = 0; i < N; i++) if (!w.terrain[i] && g[i]) { w.terrain[i] = 1; w.tdirty.push((i << 1) | 1); } } }
  function randomLand(w) { for (let k = 0; k < 800; k++) { const i = Math.floor(Math.random() * N); if (w.terrain[i] && !w.owner[i]) { let free = 0; for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) { const xx = cx(i) + x, yy = cy(i) + y; if (xx >= 0 && yy >= 0 && xx < GW && yy < GH && w.terrain[idx(xx, yy)] && !w.owner[idx(xx, yy)]) free++; } if (free >= 30) return i; } } for (let i = 0; i < N; i++) if (w.terrain[i] && !w.owner[i]) return i; return 0; }
  function doSpawn(w, p, cell) {
    if (p.spawned) return; if (!w.terrain[cell] || w.owner[cell]) cell = randomLand(w);
    for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) { const xx = cx(cell) + x, yy = cy(cell) + y; if (xx < 0 || yy < 0 || xx >= GW || yy >= GH) continue; const i = idx(xx, yy); if (x * x + y * y <= 9 && w.terrain[i] && !w.owner[i]) setOwner(w, i, p.slot + 1); }
    p.spawned = true; w.events.push({ t: "spawn", id: p.id, cell });
  }

  // ---------- akce
  function doAction(w, p, a) {
    if (a.k === "attack") launch(w, p, a.cell, a.ratio);
    else if (a.k === "boat") boat(w, p, a.cell, a.ratio);
    else if (a.k === "build") build(w, p, a.type, a.cell);
    else if (a.k === "nuke") nuke(w, p, a.type, a.cell);
  }
  function adjacentTo(w, me, target) { for (let i = 0; i < N; i++) if (w.owner[i] === me) { let adj = false; N4(i, j => { if (w.terrain[j] && w.owner[j] === target) adj = true; }); if (adj) return true; } return false; }
  function launch(w, p, cell, ratio, force) {
    if (cell < 0 || cell >= N || !w.terrain[cell]) return;
    const me = p.slot + 1, target = w.owner[cell];
    if (target === me) return;
    if (!force && !adjacentTo(w, me, target)) { w.events.push({ t: "noAdj", id: p.id }); return; }
    const troops = force ? ratio : Math.floor(p.troops * Math.max(0.05, Math.min(1, ratio)));
    if (troops < 3) return;
    if (!force) p.troops -= troops;
    const ex = w.attacks.find(a => a.from === me && a.to === target);
    if (ex) { ex.troops += troops; ex.cell = cell; return; }
    w.attacks.push({ from: me, to: target, troops, acc: 0, cell });
    w.events.push({ t: "attack", id: p.id, to: target, troops, cell });
  }
  function stepAttacks(w, dt) {
    for (let k = w.attacks.length - 1; k >= 0; k--) {
      const a = w.attacks[k];
      const att = w.players.find(p => p.slot + 1 === a.from), def = a.to ? w.players.find(p => p.slot + 1 === a.to) : null;
      if (!att || !att.alive || (a.to && (!def || !def.alive))) { if (att) att.troops += a.troops; w.attacks.splice(k, 1); continue; }
      const defPerCell = def ? def.troops / Math.max(1, w.cells[a.to]) : 0;
      const baseCost = a.to ? T.costEnemyBase + defPerCell * 1.2 : T.costNeutral;
      const speed = T.attackSpeed * (1 + Math.log10(Math.max(1, a.troops)) * 0.6);
      a.acc += speed * dt;
      // hranice cíle u mého území (jeden průchod za tick)
      const front = [];
      for (let i = 0; i < N; i++) { if (w.owner[i] !== a.to || !w.terrain[i]) continue; let adj = false; N4(i, j => { if (w.owner[j] === a.from) adj = true; }); if (adj) front.push(i); }
      if (!front.length) { att.troops += a.troops; w.attacks.splice(k, 1); continue; }
      front.sort((i, j) => dist(i, a.cell) - dist(j, a.cell));
      const posts = def ? w.buildings.filter(b => b.owner === a.to && b.type === "defense") : [];
      let took = 0, fi = 0;
      while (a.acc >= 1 && fi < front.length) {
        const i = front[fi++];
        const cost = baseCost * (posts.some(b => dist(b.cell, i) <= U.defense.radius) ? U.defense.mult : 1);
        if (a.troops < cost) break;
        setOwner(w, i, a.from); a.troops -= cost; a.acc -= 1; took++;
        if (def) def.troops = Math.max(0, def.troops - cost * 0.5);
      }
      if (took) w.events.push({ t: "took", from: a.from, n: took });
      if (a.troops < baseCost) { att.troops += Math.max(0, a.troops); w.attacks.splice(k, 1); }
      if (def && w.cells[a.to] === 0) att.kills++;
    }
  }
  // loď: výsadek přes vodu (potřebuje přístav)
  function boat(w, p, cell, ratio) {
    if (!enabled(w, "port") || !has(w, p, "port")) { w.events.push({ t: "needPort", id: p.id }); return; }
    if (cell < 0 || !w.terrain[cell] || w.owner[cell] === p.slot + 1) return;
    const troops = Math.floor(p.troops * Math.max(0.05, Math.min(1, ratio))); if (troops < 5) return;
    // nejbližší přístav
    const ports = w.buildings.filter(b => b.owner === p.slot + 1 && b.type === "port").sort((a, b) => dist(a.cell, cell) - dist(b.cell, cell));
    const from = ports[0].cell; p.troops -= troops;
    w.boats.push({ id: w.bid++, from: p.slot + 1, x: cx(from), y: cy(from), tx: cx(cell), ty: cy(cell), troops, target: cell });
    w.events.push({ t: "boat", id: p.id, cell });
  }
  function stepBoats(w, dt) {
    for (let k = w.boats.length - 1; k >= 0; k--) {
      const b = w.boats[k], dx = b.tx - b.x, dy = b.ty - b.y, d = Math.hypot(dx, dy);
      const att = w.players.find(p => p.slot + 1 === b.from); if (!att || !att.alive) { w.boats.splice(k, 1); continue; }
      if (d <= 1.5) {
        // vylodění: zabere cílové pole + sousedy, zbytek pokračuje jako útok
        const target = w.owner[b.target]; let cost = 0;
        const cellsToTake = [b.target]; N4(b.target, j => { if (w.terrain[j] && w.owner[j] !== b.from) cellsToTake.push(j); });
        for (const i of cellsToTake) { if (b.troops < 2) break; if (w.owner[i] === b.from) continue; setOwner(w, i, b.from); b.troops -= 2; cost += 2; }
        w.events.push({ t: "landing", from: b.from, cell: b.target });
        if (b.troops > 3) launch(w, att, b.target, b.troops, true);
        w.boats.splice(k, 1); continue;
      }
      const sp = T.boatSpeed * dt / d; b.x += dx * sp; b.y += dy * sp;
      // válečná loď v dosahu potopí loď
      const ws = w.buildings.find(s => s.type === "warship" && s.owner !== b.from && Math.hypot(cx(s.cell) - b.x, cy(s.cell) - b.y) <= U.warship.radius);
      if (ws) { w.events.push({ t: "sunk", x: b.x, y: b.y, from: b.from }); w.boats.splice(k, 1); }
    }
  }
  // stavby
  function build(w, p, type, cell) {
    const u = U[type]; if (!u || !enabled(w, type)) return;
    if (p.gold < u.cost) { w.events.push({ t: "noGold", id: p.id }); return; }
    const me = p.slot + 1;
    if (type === "warship") { if (!has(w, p, "port")) { w.events.push({ t: "needPort", id: p.id }); return; } if (w.terrain[cell]) return; }
    else { if (w.owner[cell] !== me) return; if (type === "port" && !isCoast(w, cell)) { w.events.push({ t: "needCoast", id: p.id }); return; } if (w.buildings.some(b => dist(b.cell, cell) < 3)) return; }
    p.gold -= u.cost;
    w.buildings.push({ id: w.bid++, type, cell, owner: me });
    w.events.push({ t: "built", id: p.id, type, cell });
  }
  function stepWarships(w, dt) {
    for (const s of w.buildings) {
      if (s.type !== "warship") continue; s.acc = (s.acc || 0) + dt; if (s.acc < 2) continue; s.acc = 0;
      // ostřeluje pobřežní pole nepřátel v dosahu -> neutrální
      let hit = 0;
      for (let y = -U.warship.radius; y <= U.warship.radius; y++) for (let x = -U.warship.radius; x <= U.warship.radius; x++) { const xx = cx(s.cell) + x, yy = cy(s.cell) + y; if (xx < 0 || yy < 0 || xx >= GW || yy >= GH || hit >= 3) continue; const i = idx(xx, yy); if (w.terrain[i] && w.owner[i] && w.owner[i] !== s.owner && isCoast(w, i) && Math.hypot(x, y) <= U.warship.radius) { setOwner(w, i, 0); hit++; } }
      if (hit) w.events.push({ t: "shell", cell: s.cell });
    }
  }
  // jaderné zbraně
  function nuke(w, p, type, cell) {
    const u = U[type]; if (!u || !u.radius || !enabled(w, type)) return;
    if (!has(w, p, "silo")) { w.events.push({ t: "needSilo", id: p.id }); return; }
    if (p.gold < u.cost) { w.events.push({ t: "noGold", id: p.id }); return; }
    if (cell < 0) return;
    p.gold -= u.cost;
    const silo = w.buildings.filter(b => b.owner === p.slot + 1 && b.type === "silo").sort((a, b) => dist(a.cell, cell) - dist(b.cell, cell))[0];
    const targets = type === "mirv" ? Array.from({ length: u.count }, () => idx(Math.max(0, Math.min(GW - 1, cx(cell) + Math.round((Math.random() - 0.5) * u.spread * 2))), Math.max(0, Math.min(GH - 1, cy(cell) + Math.round((Math.random() - 0.5) * u.spread * 2))))) : [cell];
    for (const tcell of targets) w.nukes.push({ id: w.bid++, type, from: p.slot + 1, fromCell: silo.cell, cell: tcell, t: T.nukeFlight, radius: u.radius });
    w.events.push({ t: "nukeLaunch", id: p.id, type, cell });
  }
  function stepNukes(w, dt) {
    for (let k = w.nukes.length - 1; k >= 0; k--) {
      const n = w.nukes[k]; n.t -= dt; if (n.t > 0) continue;
      w.nukes.splice(k, 1);
      // SAM obránce v dosahu může sestřelit
      const sam = w.buildings.find(b => b.type === "sam" && b.owner !== n.from && dist(b.cell, n.cell) <= U.sam.radius);
      if (sam && Math.random() < U.sam.chance) { w.events.push({ t: "intercept", cell: n.cell, by: sam.owner }); continue; }
      const lost = new Int32Array(9);
      for (let y = -n.radius; y <= n.radius; y++) for (let x = -n.radius; x <= n.radius; x++) { const xx = cx(n.cell) + x, yy = cy(n.cell) + y; if (xx < 0 || yy < 0 || xx >= GW || yy >= GH || Math.hypot(x, y) > n.radius) continue; const i = idx(xx, yy); if (w.owner[i]) { lost[w.owner[i]]++; setOwner(w, i, 0); } }
      for (const p of w.players) { const l = lost[p.slot + 1]; if (l) p.troops = Math.max(0, p.troops - l * 3); }
      w.events.push({ t: "boom", cell: n.cell, radius: n.radius, type: n.type });
    }
  }

  // ---------- boti
  function botDraw(w, p, dt) { const ai = p.ai; ai.t = (ai.t || 0) - dt; if (ai.t > 0) return; ai.t = 1.4 + Math.random(); const val = Math.random() < 0.75 ? 1 : 0; const bx = Math.floor(Math.random() * GW), by = Math.floor(Math.random() * GH), r = 6 + Math.random() * 9, list = []; for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) { const xx = bx + x | 0, yy = by + y | 0; if (xx < 1 || yy < 1 || xx >= GW - 1 || yy >= GH - 1 || x * x + y * y > r * r) continue; list.push(idx(xx, yy)); } paint(w, list, val); }
  function botThink(w, p, dt) {
    const ai = p.ai, sk = p.skill; ai.t = (ai.t || 0) - dt; if (ai.t > 0) return;
    ai.t = 1.2 + (1 - sk) * 3 + Math.random();
    const me = p.slot + 1, max = p.max || 200, mine = [];
    for (let i = 0; i < N; i++) if (w.owner[i] === me) mine.push(i);
    // stavby: město, továrna, přístav u pobřeží, silo/SAM/obrana když je zlata dost
    const own = (t) => w.buildings.filter(b => b.owner === me && b.type === t).length;
    const pick = () => mine[Math.floor(Math.random() * mine.length)];
    if (mine.length > 40 && Math.random() < 0.3 + sk * 0.5) {
      if (p.gold >= U.city.cost && own("city") < 1 + mine.length / 300 && enabled(w, "city")) p.input.push({ k: "build", type: "city", cell: pick() });
      else if (p.gold >= U.factory.cost && own("factory") < 1 + mine.length / 400 && enabled(w, "factory")) p.input.push({ k: "build", type: "factory", cell: pick() });
      else if (p.gold >= U.port.cost && !own("port") && enabled(w, "port")) { const c = mine.filter(i => isCoast(w, i)); if (c.length) p.input.push({ k: "build", type: "port", cell: c[Math.floor(Math.random() * c.length)] }); }
      else if (p.gold >= U.defense.cost && own("defense") < 2 && sk > 0.4 && enabled(w, "defense")) p.input.push({ k: "build", type: "defense", cell: pick() });
      else if (p.gold >= U.silo.cost + 300 && !own("silo") && sk > 0.5 && enabled(w, "silo")) p.input.push({ k: "build", type: "silo", cell: pick() });
      else if (p.gold >= U.sam.cost && !own("sam") && sk > 0.6 && enabled(w, "sam")) p.input.push({ k: "build", type: "sam", cell: pick() });
    }
    // atomovka na největšího soupeře
    if (own("silo") && p.gold >= U.atom.cost + 100 && Math.random() < 0.15 * sk && enabled(w, "atom")) { const enemies = w.players.filter(o => o !== p && o.alive).sort((a, b) => w.cells[b.slot + 1] - w.cells[a.slot + 1]); if (enemies[0]) { const cells = []; for (let i = 0; i < N; i += 7) if (w.owner[i] === enemies[0].slot + 1) cells.push(i); if (cells.length) p.input.push({ k: "nuke", type: "atom", cell: cells[Math.floor(Math.random() * cells.length)] }); } }
    if (p.troops < max * (0.25 + (1 - sk) * 0.3)) return;
    const neigh = new Map();
    for (const i of mine) N4(i, j => { if (!w.terrain[j] || w.owner[j] === me) return; const o = w.owner[j]; if (!neigh.has(o)) neigh.set(o, { n: 0, cell: j }); neigh.get(o).n++; });
    if (!neigh.size) {
      // nic k dobytí po souši -> loď na nejbližší cizí/neutrální zemi
      if (own("port") && Math.random() < 0.6) { let best = -1, bd = 1e9; const from = mine[0]; for (let i = 0; i < N; i += 3) if (w.terrain[i] && w.owner[i] !== me) { const d = dist(i, from); if (d < bd) { bd = d; best = i; } } if (best >= 0) p.input.push({ k: "boat", cell: best, ratio: 0.5 }); }
      return;
    }
    let pk = null;
    if (neigh.has(0) && (Math.random() < 0.7 || neigh.size === 1)) pk = { o: 0, ...neigh.get(0), ratio: 0.35 + Math.random() * 0.3 };
    else {
      const cands = [...neigh.entries()].filter(([o]) => o !== 0).map(([o, v]) => { const d = w.players.find(q => q.slot + 1 === o); return { o, ...v, str: d ? d.troops / Math.max(1, w.cells[o]) : 0, tot: d ? d.troops : 0 }; }).sort((a, b) => a.str - b.str);
      const c = sk > 0.5 ? cands[0] : cands[Math.floor(Math.random() * cands.length)]; if (!c) return;
      if (sk > 0.4 && c.tot > p.troops * 1.3 && p.troops < max * 0.85) return;
      pk = { ...c, ratio: p.troops >= max * 0.85 ? 0.9 : 0.5 + sk * 0.3 };
    }
    p.input.push({ k: "attack", cell: pk.cell, ratio: pk.ratio });
  }

  // ---------- výsledky + síť
  function results(w) {
    const land = w.terrain.reduce((a, b) => a + b, 0) || 1;
    const rows = w.players.map(p => ({ id: p.id, name: p.name, color: colorOf(w, p), slot: p.slot, bot: p.bot, cells: w.cells[p.slot + 1], pct: Math.round(1000 * w.cells[p.slot + 1] / land) / 10, alive: p.alive, out: p.out, kills: p.kills }));
    rows.sort((a, b) => (b.alive ? 1 : 0) - (a.alive ? 1 : 0) || b.cells - a.cells || b.out - a.out);
    rows.forEach((r, i) => { r.rank = i + 1; r.value = r.pct + " %"; r.own = r.pct; r.coins = r.bot ? 0 : Math.round(10 + Math.min(60, r.pct) + (i === 0 ? 30 : i === 1 ? 12 : 0)); r.win = i === 0; });
    return rows;
  }
  function packPlayers(w) { return w.players.map(p => [p.id, Math.round(p.troops), w.cells[p.slot + 1], p.alive ? 1 : 0, p.spawned ? 1 : 0, Math.round(p.gold), Math.round(p.max || 0)]); }
  function packGrid(arr) { let out = "", prev = arr[0], n = 0; for (let i = 0; i < arr.length; i++) { const v = arr[i]; if (v === prev) n++; else { out += prev + ":" + n + ","; prev = v; n = 1; } } return out + prev + ":" + n; }
  function unpackGrid(arr, s) { let i = 0; for (const part of s.split(",")) { const [v, n] = part.split(":").map(Number); arr.fill(v, i, i + n); i += n; } }
  function recount(w) { w.cells.fill(0); for (let i = 0; i < N; i++) w.cells[w.owner[i]]++; }
  function lobbyInfo(w) { return w.players.map(p => ({ id: p.id, name: p.name, color: colorOf(w, p), ci: p.ci, team: p.team, hat: p.hat, pattern: p.pattern, bot: !!p.bot, skill: p.bot ? p.skill : undefined })); }
  function assignBot(p, difficulty) { const [a, b] = BOT_SKILL[difficulty] || BOT_SKILL.mix; p.skill = Math.round((a + Math.random() * (b - a)) * 100) / 100; p.ai = {}; }
  const skillTier = (s) => s < 0.4 ? "easy" : s < 0.75 ? "mid" : "hard";
  const palette = (w) => w.players.map(p => COLORS[p.ci]);
  return { GW, GH, N, COLORS, TEAM_COLORS, MODES, MAPS, UNIT_KEYS, PU_RATE, BOT_SKILL, POWERUPS: {}, create, addPlayer, removePlayer, resetRound, step, results, packPlayers, packGrid, unpackGrid, recount, lobbyInfo, colorOf, assignBot, skillTier, palette, paint, doSpawn, idx, cx, cy, isCoast };
})();
