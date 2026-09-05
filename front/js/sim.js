// Simulace Front. Mřížka polí: terrain (0 voda / 1 země), owner (0 nikdo / slot+1). Útok = postupné zabírání
// hraničních polí cíle, dokud nedojdou vojáci vyčlenění na útok.
window.Sim = (() => {
  const T = FR_CONFIG.tuning;
  const GW = 112, GH = 72, N = GW * GH;
  const COLORS = ["#FF5E7E", "#5EE1D0", "#FFCF5A", "#8A5CFF", "#B6FF5A", "#FF9A3C", "#6FC3FF", "#FF7AD9"];
  const TEAM_COLORS = COLORS;
  const MODES = { classic: {}, timed: {} };
  const BOT_SKILL = { easy: [0.15, 0.35], mid: [0.45, 0.65], hard: [0.8, 1.0], mix: [0.15, 1.0] };
  const PU_RATE = {};
  const mulberry = (a) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const idx = (x, y) => y * GW + x;
  const N4 = (i, fn) => { const x = i % GW, y = (i / GW) | 0; if (x > 0) fn(i - 1); if (x < GW - 1) fn(i + 1); if (y > 0) fn(i - GW); if (y < GH - 1) fn(i + GW); };

  // ---------- mapa: ostrovy z náhodných blobů
  function genTerrain(seed) {
    const rand = mulberry(seed), t = new Uint8Array(N);
    const blobs = 6 + Math.floor(rand() * 5);
    for (let b = 0; b < blobs; b++) {
      const cx = 10 + rand() * (GW - 20), cy = 8 + rand() * (GH - 16), rx = 8 + rand() * 18, ry = 6 + rand() * 12, rot = rand() * 3.14;
      for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
        const dx = x - cx, dy = y - cy, u = (dx * Math.cos(rot) + dy * Math.sin(rot)) / rx, v = (-dx * Math.sin(rot) + dy * Math.cos(rot)) / ry;
        const d = u * u + v * v + (rand() - 0.5) * 0.25;
        if (d < 1) t[idx(x, y)] = 1;
      }
    }
    // vyhladit okraje
    const s = new Uint8Array(t);
    for (let y = 1; y < GH - 1; y++) for (let x = 1; x < GW - 1; x++) { let n = 0; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) n += t[idx(x + i, y + j)]; s[idx(x, y)] = n >= 5 ? 1 : 0; }
    return s;
  }

  function create(seed, opts = {}) {
    const mode = MODES[opts.mode] ? opts.mode : "classic";
    return {
      seed, mode, teams: false, draw: !!opts.draw,
      terrain: opts.draw ? new Uint8Array(N).fill(0) : genTerrain(seed || 1), owner: new Uint8Array(N), cells: new Int32Array(9),
      players: [], attacks: [], phase: "countdown", countdown: 3, time: mode === "timed" ? 180 : 480, t: 0,
      dirty: [], tdirty: [], events: [], client: !!opts.client, spawned: 0,
    };
  }
  function addPlayer(w, p) {
    const i = w.players.length; if (i >= T.maxPlayers) return null;
    const pl = Object.assign({ troops: 30, ratio: 0.5, spawned: false, alive: true, out: 0, input: null, bot: false, hat: "none", pattern: "none", pref: -1, ai: {}, skill: 0.5, kills: 0, peak: 0 }, p, { slot: i });
    pl.ci = pickColor(w, pl.pref); pl.team = i % 2; w.players.push(pl); return pl;
  }
  function pickColor(w, pref) { const used = new Set(w.players.map(p => p.ci)); if (pref >= 0 && !used.has(pref)) return pref; const free = COLORS.map((_, i) => i).filter(i => !used.has(i)); return free.length ? free[Math.floor(Math.random() * free.length)] : 0; }
  function removePlayer(w, id) { const p = w.players.find(q => q.id === id); if (p) { for (let i = 0; i < N; i++) if (w.owner[i] === p.slot + 1) setOwner(w, i, 0); } w.players = w.players.filter(q => q.id !== id); w.players.forEach((q, i) => { q.slot = i; q.team = i % 2; }); w.owner.fill(0); w.cells.fill(0); }
  const colorOf = (w, p) => COLORS[p.ci];
  function resetRound(w, seed, opts = {}) {
    const f = create(seed, opts);
    Object.assign(w, { seed, mode: f.mode, draw: f.draw, terrain: f.terrain, owner: f.owner, cells: f.cells, attacks: [], phase: "countdown", countdown: 3, time: f.time, t: 0, dirty: [], tdirty: [], events: [], spawned: 0, results: null });
    w.players.forEach((p, i) => { p.slot = i; });
    if (opts.bots) w.players.forEach(p => { if (p.bot) assignBot(p, opts.bots); });
    const order = [...w.players].sort(() => Math.random() - 0.5); const used = new Set();
    for (const p of order) { p.ci = -1; if (p.pref >= 0 && !used.has(p.pref)) { p.ci = p.pref; used.add(p.pref); } }
    for (const p of order) if (p.ci < 0) { const free = COLORS.map((_, i) => i).filter(i => !used.has(i)); p.ci = free[Math.floor(Math.random() * free.length)]; used.add(p.ci); }
    w.players.forEach(p => Object.assign(p, { troops: 30, ratio: 0.5, spawned: false, alive: true, out: 0, input: null, ai: {}, kills: 0, peak: 0, spawnAt: null }));
  }
  function setOwner(w, i, o) { const prev = w.owner[i]; if (prev === o) return; w.owner[i] = o; w.cells[prev]--; w.cells[o]++; w.dirty.push((i << 4) | o); }
  function paint(w, cellsList, val) { for (const i of cellsList) { if (i < 0 || i >= N || w.terrain[i] === val) continue; w.terrain[i] = val; w.tdirty.push((i << 1) | val); } }

  // ---------- fáze
  function step(w, dt) {
    w.events.length = 0;
    if (w.phase === "countdown") { const b = Math.ceil(w.countdown); w.countdown -= dt; if (Math.ceil(w.countdown) !== b && w.countdown > 0) w.events.push({ t: "count", n: Math.ceil(w.countdown) }); if (w.countdown <= 0) { w.phase = w.draw ? "draw" : "spawn"; w.countdown = w.draw ? T.drawSeconds : T.spawnSeconds; w.events.push({ t: w.draw ? "drawStart" : "spawnStart" }); } return; }
    if (w.phase === "draw") {
      w.countdown -= dt; for (const p of w.players) if (p.bot) botDraw(w, p, dt);
      if (w.countdown <= 0) { ensureLand(w); w.phase = "spawn"; w.countdown = T.spawnSeconds; w.events.push({ t: "spawnStart" }); }
      return;
    }
    if (w.phase === "spawn") {
      w.countdown -= dt;
      for (const p of w.players) { if (!p.spawned && (p.bot || w.countdown <= 0)) doSpawn(w, p, p.spawnAt ?? randomLand(w)); }
      if (w.players.every(p => p.spawned) || w.countdown <= 0) { w.phase = "play"; w.events.push({ t: "go" }); }
      return;
    }
    if (w.phase !== "play") return;
    w.t += dt; w.time -= dt;
    for (const p of w.players) {
      if (!p.alive) continue;
      const c = w.cells[p.slot + 1];
      if (c === 0) { p.alive = false; p.out = w.t; w.events.push({ t: "out", id: p.id }); continue; }
      const max = T.maxBase + c * T.maxPerCell;
      p.troops = Math.min(max, p.troops + (T.growBase + c * T.growPerCell) * dt * (p.troops < max * 0.5 ? 1.2 : 0.7));
      p.peak = Math.max(p.peak, c);
      if (p.bot) botThink(w, p, dt);
      if (p.input) { launch(w, p, p.input.cell, p.input.ratio); p.input = null; }
    }
    stepAttacks(w, dt);
    const alive = w.players.filter(p => p.alive);
    const land = w.terrain.reduce((a, b) => a + b, 0) || 1;
    const leader = alive.sort((a, b) => w.cells[b.slot + 1] - w.cells[a.slot + 1])[0];
    if (w.time <= 0 || alive.length <= 1 || (leader && w.cells[leader.slot + 1] / land >= T.winShare)) { w.phase = "end"; w.events.push({ t: "end" }); w.results = results(w); }
  }
  function ensureLand(w) { if (w.terrain.reduce((a, b) => a + b, 0) < 400) { const g = genTerrain(w.seed); for (let i = 0; i < N; i++) if (!w.terrain[i] && g[i]) { w.terrain[i] = 1; w.tdirty.push((i << 1) | 1); } } }
  function randomLand(w) { for (let k = 0; k < 500; k++) { const i = Math.floor(Math.random() * N); if (w.terrain[i] && !w.owner[i]) { let free = 0; N4(i, j => { if (!w.owner[j] && w.terrain[j]) free++; }); if (free >= 3) return i; } } for (let i = 0; i < N; i++) if (w.terrain[i] && !w.owner[i]) return i; return 0; }
  function doSpawn(w, p, cell) {
    if (p.spawned) return;
    if (!w.terrain[cell] || w.owner[cell]) cell = randomLand(w);
    const cx = cell % GW, cy = (cell / GW) | 0;
    for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) { const xx = cx + x, yy = cy + y; if (xx < 0 || yy < 0 || xx >= GW || yy >= GH) continue; const i = idx(xx, yy); if (x * x + y * y <= 4 && w.terrain[i] && !w.owner[i]) setOwner(w, i, p.slot + 1); }
    p.spawned = true; w.spawned++; w.events.push({ t: "spawn", id: p.id, cell });
  }

  // ---------- útoky
  function launch(w, p, cell, ratio) {
    if (cell < 0 || cell >= N || !w.terrain[cell]) return;
    const target = w.owner[cell];
    if (target === p.slot + 1) return;
    // musí sousedit s mým územím (přes libovolné pole cíle spojené s hranicí) – zjednodušeně: cíl musí mít pole u mé hranice
    let adjacent = false;
    for (let i = 0; i < N && !adjacent; i++) if (w.owner[i] === p.slot + 1) N4(i, j => { if (w.terrain[j] && w.owner[j] === target) adjacent = true; });
    if (!adjacent) { w.events.push({ t: "noAdj", id: p.id }); return; }
    const troops = Math.floor(p.troops * Math.max(0.05, Math.min(1, ratio)));
    if (troops < 3) return;
    p.troops -= troops;
    const ex = w.attacks.find(a => a.from === p.slot + 1 && a.to === target);
    if (ex) { ex.troops += troops; return; }
    w.attacks.push({ from: p.slot + 1, to: target, troops, acc: 0, cell });
    w.events.push({ t: "attack", id: p.id, to: target, troops, cell });
  }
  function stepAttacks(w, dt) {
    for (let k = w.attacks.length - 1; k >= 0; k--) {
      const a = w.attacks[k];
      const att = w.players.find(p => p.slot + 1 === a.from), def = a.to ? w.players.find(p => p.slot + 1 === a.to) : null;
      if (!att || !att.alive || (a.to && (!def || !def.alive))) { if (att) att.troops += a.troops; w.attacks.splice(k, 1); continue; }
      const defPerCell = def ? (def.troops / Math.max(1, w.cells[a.to])) : 0;
      const cost = a.to ? T.costEnemyBase + defPerCell * 1.2 : T.costNeutral;
      const speed = T.attackSpeed * (1 + Math.log10(Math.max(1, a.troops)) * 0.6);
      a.acc += speed * dt;
      let took = 0;
      while (a.acc >= 1 && a.troops >= cost) {
        // hraniční pole cíle sousedící s útočníkem, nejblíž místu kliknutí
        let best = -1, bd = 1e9;
        for (let i = 0; i < N; i++) {
          if (w.owner[i] !== a.to || !w.terrain[i]) continue;
          let adj = false; N4(i, j => { if (w.owner[j] === a.from) adj = true; });
          if (!adj) continue;
          const d = Math.hypot((i % GW) - (a.cell % GW), ((i / GW) | 0) - ((a.cell / GW) | 0)) + Math.random() * 3;
          if (d < bd) { bd = d; best = i; }
        }
        if (best < 0) break;
        setOwner(w, best, a.from); a.troops -= cost; a.acc -= 1; took++;
        if (def) def.troops = Math.max(0, def.troops - cost * 0.5);
      }
      if (took) w.events.push({ t: "took", from: a.from, n: took });
      if (a.troops < cost) { att.troops += Math.max(0, a.troops); w.attacks.splice(k, 1); }
      else if (!took && a.acc >= 1) { att.troops += a.troops; w.attacks.splice(k, 1); }   // nic k zabrání -> vojáci se vrací
      if (def && !def.alive === false && w.cells[a.to] === 0) { att.kills++; }
    }
  }

  // ---------- boti
  function botDraw(w, p, dt) {
    const ai = p.ai; ai.t = (ai.t || 0) - dt; if (ai.t > 0) return; ai.t = 1.4 + Math.random();
    // maluje pár blobů země (a občas vodu, ať jsou zálivy)
    const val = Math.random() < 0.75 ? 1 : 0;
    const cx = Math.floor(Math.random() * GW), cy = Math.floor(Math.random() * GH), r = 4 + Math.random() * 6, list = [];
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) { const xx = cx + x | 0, yy = cy + y | 0; if (xx < 1 || yy < 1 || xx >= GW - 1 || yy >= GH - 1 || x * x + y * y > r * r) continue; list.push(idx(xx, yy)); }
    paint(w, list, val);
  }
  function botThink(w, p, dt) {
    const ai = p.ai, sk = p.skill; ai.t = (ai.t || 0) - dt; if (ai.t > 0) return;
    ai.t = 1.2 + (1 - sk) * 3 + Math.random();
    const me = p.slot + 1, max = T.maxBase + w.cells[me] * T.maxPerCell;
    if (p.troops < max * (0.25 + (1 - sk) * 0.3)) return;
    // spočítat sousedy: neutrální země a hráči
    const neigh = new Map();
    for (let i = 0; i < N; i++) if (w.owner[i] === me) N4(i, j => { if (!w.terrain[j] || w.owner[j] === me) return; const o = w.owner[j]; if (!neigh.has(o)) neigh.set(o, { n: 0, cell: j }); neigh.get(o).n++; });
    if (!neigh.size) return;
    let pick = null;
    if (neigh.has(0) && (Math.random() < 0.7 || neigh.size === 1)) pick = { o: 0, ...neigh.get(0), ratio: 0.35 + Math.random() * 0.3 };
    else {
      const cands = [...neigh.entries()].filter(([o]) => o !== 0).map(([o, v]) => { const d = w.players.find(q => q.slot + 1 === o); return { o, ...v, str: d ? d.troops / Math.max(1, w.cells[o]) : 0, tot: d ? d.troops : 0 }; });
      cands.sort((a, b) => a.str - b.str);
      const c = sk > 0.5 ? cands[0] : cands[Math.floor(Math.random() * cands.length)];
      if (!c) return;
      if (sk > 0.4 && c.tot > p.troops * 1.3 && p.troops < max * 0.85) return;   // pro neútočí na silnějšího – pokud nemá plno
      pick = { ...c, ratio: p.troops >= max * 0.85 ? 0.9 : 0.5 + sk * 0.3 };
    }
    p.input = { cell: pick.cell, ratio: pick.ratio };
  }

  // ---------- výsledky
  function results(w) {
    const land = w.terrain.reduce((a, b) => a + b, 0) || 1;
    const rows = w.players.map(p => ({ id: p.id, name: p.name, color: colorOf(w, p), slot: p.slot, bot: p.bot, cells: w.cells[p.slot + 1], pct: Math.round(1000 * w.cells[p.slot + 1] / land) / 10, alive: p.alive, out: p.out, peak: p.peak, kills: p.kills }));
    rows.sort((a, b) => (b.alive ? 1 : 0) - (a.alive ? 1 : 0) || b.cells - a.cells || b.out - a.out);
    rows.forEach((r, i) => { r.rank = i + 1; r.value = r.pct + " %"; r.own = r.pct; r.coins = r.bot ? 0 : Math.round(10 + Math.min(60, r.pct) + (i === 0 ? 30 : i === 1 ? 12 : 0)); r.win = i === 0; });
    return rows;
  }
  function packPlayers(w) { return w.players.map(p => [p.id, Math.round(p.troops), w.cells[p.slot + 1], p.alive ? 1 : 0, p.spawned ? 1 : 0]); }
  function packGrid(arr) { let out = "", prev = arr[0], n = 0; for (let i = 0; i < arr.length; i++) { const v = arr[i]; if (v === prev) n++; else { out += prev + ":" + n + ","; prev = v; n = 1; } } return out + prev + ":" + n; }
  function unpackGrid(arr, s) { let i = 0; for (const part of s.split(",")) { const [v, n] = part.split(":").map(Number); arr.fill(v, i, i + n); i += n; } }
  function recount(w) { w.cells.fill(0); for (let i = 0; i < N; i++) w.cells[w.owner[i]]++; }
  function lobbyInfo(w) { return w.players.map(p => ({ id: p.id, name: p.name, color: colorOf(w, p), ci: p.ci, team: p.team, hat: p.hat, pattern: p.pattern, bot: !!p.bot, skill: p.bot ? p.skill : undefined })); }
  function assignBot(p, difficulty) { const [a, b] = BOT_SKILL[difficulty] || BOT_SKILL.mix; p.skill = Math.round((a + Math.random() * (b - a)) * 100) / 100; p.ai = {}; }
  const skillTier = (s) => s < 0.4 ? "easy" : s < 0.75 ? "mid" : "hard";
  const palette = (w) => w.players.map(p => COLORS[p.ci]);

  return { GW, GH, N, COLORS, TEAM_COLORS, MODES, PU_RATE, BOT_SKILL, POWERUPS: {}, create, addPlayer, removePlayer, resetRound, step, results, packPlayers, packGrid, unpackGrid, recount, lobbyInfo, colorOf, assignBot, skillTier, palette, paint, doSpawn, launch, idx };
})();
