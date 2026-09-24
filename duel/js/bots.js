// Pravidla a boti pro Duel. Čistá logika bez DOM, testovatelné v Node.
(function (root) {
  // ---------- Čtyři v řadě: 7 sloupců × 6 řad, index = r * 7 + c, řada 0 nahoře
  const C4 = { W: 7, H: 6 };
  C4.drop = (b, col) => { for (let r = C4.H - 1; r >= 0; r--) if (!b[r * 7 + col]) return r * 7 + col; return -1; };
  C4.win = (b, i) => line(b, i, 7, 6, 4);
  C4.full = (b) => b.every(Boolean);
  function c4score(b, me) {
    const op = 3 - me; let s = 0;
    for (let r = 0; r < 6; r++) if (b[r * 7 + 3] === me) s += 3; else if (b[r * 7 + 3] === op) s -= 3;
    const wins = (a, bb, c, d) => { const w = [b[a], b[bb], b[c], b[d]]; const m = w.filter(x => x === me).length, o = w.filter(x => x === op).length; if (m && o) return 0; if (m === 3) return 5; if (m === 2) return 2; if (o === 3) return -4; if (o === 2) return -1; return 0; };
    for (let r = 0; r < 6; r++) for (let c = 0; c < 7; c++) { const i = r * 7 + c;
      if (c <= 3) s += wins(i, i + 1, i + 2, i + 3);
      if (r <= 2) s += wins(i, i + 7, i + 14, i + 21);
      if (c <= 3 && r <= 2) s += wins(i, i + 8, i + 16, i + 24);
      if (c >= 3 && r <= 2) s += wins(i, i + 6, i + 12, i + 18); }
    return s;
  }
  C4.best = (b, me, depth) => {
    const order = [3, 2, 4, 1, 5, 0, 6];
    function nega(bd, p, d, a, beta) {
      if (d === 0) return c4score(bd, p);
      let best = -1e9, any = false;
      for (const c of order) { const i = C4.drop(bd, c); if (i < 0) continue; any = true; bd[i] = p;
        const v = C4.win(bd, i) ? 100000 + d : -nega(bd, 3 - p, d - 1, -beta, -a);
        bd[i] = 0; if (v > best) best = v; if (best > a) a = best; if (a >= beta) break; }
      return any ? best : 0;
    }
    let bestC = -1, bestV = -1e9; const bd = b.slice();
    for (const c of order) { const i = C4.drop(bd, c); if (i < 0) continue; bd[i] = me; const v = C4.win(bd, i) ? 1e6 : -nega(bd, 3 - me, depth - 1, -1e9, 1e9); bd[i] = 0; if (v > bestV) { bestV = v; bestC = c; } }
    return bestC;
  };
  C4.bot = (b, me, level) => {
    const legal = [0, 1, 2, 3, 4, 5, 6].filter(c => C4.drop(b, c) >= 0);
    if (level === "easy" && Math.random() < 0.45) return legal[Math.floor(Math.random() * legal.length)];
    return C4.best(b, me, level === "easy" ? 2 : level === "mid" ? 4 : 7);
  };

  // ---------- Piškvorky 15×15, pět v řadě
  const GM = { N: 15 };
  GM.win = (b, i) => line(b, i, 15, 15, 5);
  GM.full = (b) => b.every(Boolean);
  const PAT = (cnt, open) => cnt >= 5 ? 1e6 : cnt === 4 ? (open === 2 ? 1e5 : open === 1 ? 9000 : 0) : cnt === 3 ? (open === 2 ? 7000 : open === 1 ? 500 : 0) : cnt === 2 ? (open === 2 ? 400 : open === 1 ? 60 : 0) : (open === 2 ? 20 : open === 1 ? 4 : 0);
  function evalCell(b, i, p) {
    const N = 15, x = i % N, y = (i / N) | 0; let total = 0;
    for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
      let cnt = 1, open = 0;
      for (const s of [1, -1]) { let k = 1; while (true) { const xx = x + dx * k * s, yy = y + dy * k * s; if (xx < 0 || yy < 0 || xx >= N || yy >= N) break; const v = b[yy * N + xx]; if (v === p) { cnt++; k++; continue; } if (!v) open++; break; } }
      total += PAT(cnt, open);
    }
    return total;
  }
  GM.bot = (b, me, level) => {
    const N = 15, op = 3 - me, cand = [];
    if (!b.some(Boolean)) return 7 * N + 7;
    for (let i = 0; i < N * N; i++) { if (b[i]) continue; const x = i % N, y = (i / N) | 0; let near = false;
      for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < N && yy < N && b[yy * N + xx]) { near = true; break; } }
      if (!near) continue;
      const att = evalCell(b, i, me), def = evalCell(b, i, op);
      cand.push({ i, v: att * (level === "hard" ? 1.1 : 1) + def * (level === "easy" ? 0.6 : 0.95) + Math.random() * (level === "hard" ? 1 : 30) });
    }
    cand.sort((a, c) => c.v - a.v);
    const top = level === "easy" ? 5 : level === "mid" ? 2 : 1;
    // i lehký bot vždy dohraje výhru a zablokuje otevřenou čtyřku
    if (cand[0] && cand[0].v > 8e4) return cand[0].i;
    return cand[Math.floor(Math.random() * Math.min(top, cand.length))].i;
  };

  // ---------- Lodě 10×10, flotila 5-4-3-3-2, lodě se nesmí dotýkat ani rohem
  const BS = { N: 10, FLEET: [5, 4, 3, 3, 2] };
  BS.place = () => {
    for (let attempt = 0; attempt < 200; attempt++) {
      const occ = new Array(100).fill(0), ships = []; let ok = true;
      for (const len of BS.FLEET) { let placed = false;
        for (let t = 0; t < 300 && !placed; t++) { const hor = Math.random() < 0.5, x = Math.floor(Math.random() * (hor ? 11 - len : 10)), y = Math.floor(Math.random() * (hor ? 10 : 11 - len)); const cells = []; for (let k = 0; k < len; k++) cells.push((y + (hor ? 0 : k)) * 10 + x + (hor ? k : 0));
          if (cells.some(c => { const cx = c % 10, cy = (c / 10) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = cx + dx, yy = cy + dy; if (xx >= 0 && yy >= 0 && xx < 10 && yy < 10 && occ[yy * 10 + xx]) return true; } return false; })) continue;
          cells.forEach(c => occ[c] = ships.length + 1); ships.push({ len, cells, hits: 0 }); placed = true; }
        if (!placed) { ok = false; break; } }
      if (ok) return { occ, ships };
    }
    return null;
  };
  // knowledge: 0 neznámé, 1 voda, 2 zásah (nepotopená), 3 potopená
  BS.bot = (know, remaining, level) => {
    const unknown = []; for (let i = 0; i < 100; i++) if (!know[i]) unknown.push(i);
    const nb = (i) => { const x = i % 10, y = (i / 10) | 0; return [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [x + dx, y + dy]).filter(([a, b]) => a >= 0 && b >= 0 && a < 10 && b < 10).map(([a, b]) => b * 10 + a); };
    if (level === "easy" && Math.random() < 0.5) return unknown[Math.floor(Math.random() * unknown.length)];
    const hits = []; for (let i = 0; i < 100; i++) if (know[i] === 2) hits.push(i);
    // okolí potopených lodí je jistá voda (lodě se nedotýkají)
    const blocked = new Set(); for (let i = 0; i < 100; i++) if (know[i] === 3) { const x = i % 10, y = (i / 10) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < 10 && yy < 10) blocked.add(yy * 10 + xx); } }
    const free = (i) => !know[i] && !blocked.has(i);
    if (hits.length) {
      if (hits.length >= 2) { const hor = hits.every(h => ((h / 10) | 0) === ((hits[0] / 10) | 0)); const s = hits.slice().sort((a, b) => a - b), step = hor ? 1 : 10; const ends = [s[0] - step, s[s.length - 1] + step].filter(e => e >= 0 && e < 100 && (!hor || ((e / 10) | 0) === ((s[0] / 10) | 0)) && free(e)); if (ends.length) return ends[Math.floor(Math.random() * ends.length)]; }
      const opts = hits.flatMap(nb).filter(free); if (opts.length) return opts[Math.floor(Math.random() * opts.length)];
    }
    if (level === "hard") {
      // hustota: kolikrát může zbývající loď ležet přes dané pole
      const dens = new Array(100).fill(0);
      for (const len of remaining) for (let y = 0; y < 10; y++) for (let x = 0; x < 10; x++) for (const hor of [true, false]) { const cells = []; for (let k = 0; k < len; k++) { const xx = x + (hor ? k : 0), yy = y + (hor ? 0 : k); if (xx >= 10 || yy >= 10) { cells.length = 0; break; } cells.push(yy * 10 + xx); } if (cells.length === len && cells.every(free)) cells.forEach(c => dens[c]++); }
      let best = -1, bv = -1; for (const i of unknown) if (free(i) && dens[i] + Math.random() * 0.5 > bv) { bv = dens[i] + Math.random() * 0.5; best = i; } if (best >= 0) return best;
    }
    const parity = unknown.filter(i => free(i) && ((i % 10) + ((i / 10) | 0)) % 2 === 0);
    const pool = parity.length ? parity : unknown.filter(free).length ? unknown.filter(free) : unknown;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  // ---------- společné: výherní řada přes pole i
  function line(b, i, W, H, need) {
    const p = b[i]; if (!p) return null; const x = i % W, y = (i / W) | 0;
    for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
      const cells = [i];
      for (const s of [1, -1]) { let k = 1; while (true) { const xx = x + dx * k * s, yy = y + dy * k * s; if (xx < 0 || yy < 0 || xx >= W || yy >= H || b[yy * W + xx] !== p) break; cells.push(yy * W + xx); k++; } }
      if (cells.length >= need) return cells;
    }
    return null;
  }
  const api = { C4, GM, BS };
  if (typeof module !== "undefined") module.exports = api; else root.DuelRules = api;
})(typeof window !== "undefined" ? window : globalThis);
