(() => {
  const { $, get, set, L, beep } = Arc;
  Arc.texts({ en: { level: "Level", filled: "Filled", reset: "Clear", skip: "Skip (ad)", hint: "Drag from a dot to its twin. Pipes can't cross. Fill every cell.", done: "Flow!", next: "Next level", diff: (n, c) => `${n}×${n} · ${c} colors`, adTitle: "For an ad", adNote: "Watch a short ad. (Simulated on web; real rewarded ad in the app.)" }, cs: { level: "Level", filled: "Vyplněno", reset: "Vymazat", skip: "Přeskočit (reklama)", hint: "Táhni z tečky k její dvojici. Trubky se nesmí křížit. Vyplň všechna pole.", done: "Propojeno!", next: "Další level", diff: (n, c) => `${n}×${n} · ${c} barev`, adTitle: "Za reklamu", adNote: "Krátká reklama. (Na webu simulace, v appce skutečná odměněná reklama.)" } });
  const COLORS = ["#FF5E7E", "#5EE1D0", "#FFCF5A", "#8A5CFF", "#B6FF5A", "#FF9A3C", "#6FC3FF", "#FF7AD9", "#F4F0E8", "#4FD37A", "#D62828", "#8B5A2B"];
  const cv = $("cv"), ctx = cv.getContext("2d"), S = cv.width;
  let level = get("fl_level", 1), solved = get("fl_solved", 0), N, sol, ends, paths, drag = null, hints = 3, over = false;
  const mulberry = (a) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const sizeFor = (lv) => Math.min(9, 5 + Math.floor((lv - 1) / 6));
  // generátor: mřížku rozdělíme náhodnými cestami (délka ≥ 3) tak, aby byla celá pokrytá; konce cest = tečky
  function gen(seed, n) {
    const rand = mulberry(seed);
    for (let attempt = 0; attempt < 400; attempt++) {
      const owner = new Int8Array(n * n).fill(-1), pathList = [];
      const cells = [...Array(n * n).keys()].sort(() => rand() - 0.5);
      for (const start of cells) {
        if (owner[start] >= 0) continue;
        const path = [start]; owner[start] = pathList.length; let cur = start;
        const maxLen = 3 + Math.floor(rand() * (n + 2));
        while (path.length < maxLen) { const x = cur % n, y = (cur / n) | 0; const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [x + dx, y + dy]).filter(([a, b]) => a >= 0 && b >= 0 && a < n && b < n && owner[b * n + a] < 0).map(([a, b]) => b * n + a); if (!nb.length) break; cur = nb[Math.floor(rand() * nb.length)]; owner[cur] = pathList.length; path.push(cur); }
        pathList.push(path);
      }
      // krátké cesty (1–2) přilepit k sousední cestě na jejím konci, jinak zahodit pokus
      let ok = true;
      for (const p of pathList) { if (p.length >= 3) continue; let merged = false; for (const endCell of [p[0], p[p.length - 1]]) { const x = endCell % n, y = (endCell / n) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = x + dx, b = y + dy; if (a < 0 || b < 0 || a >= n || b >= n) continue; const o = pathList[owner[b * n + a]]; if (o === p || o.length < 3) continue; const c = b * n + a; if (o[o.length - 1] === c) { const add = endCell === p[0] ? p : [...p].reverse(); o.push(...add); add.forEach(k => owner[k] = pathList.indexOf(o)); p.length = 0; merged = true; break; } if (o[0] === c) { const add = endCell === p[0] ? [...p].reverse() : p; o.unshift(...add); add.forEach(k => owner[k] = pathList.indexOf(o)); p.length = 0; merged = true; break; } } if (merged) break; } if (!merged) { ok = false; break; } }
      if (!ok) continue;
      const paths = pathList.filter(p => p.length >= 3); if (paths.length < 3 || paths.length > 12) continue;
      return paths;
    }
    return null;
  }
  function load() {
    N = sizeFor(level); let seed = level * 48611 + 5; do { sol = gen(seed, N); seed++; } while (!sol);
    ends = sol.map(p => [p[0], p[p.length - 1]]); paths = sol.map(() => []); over = false; drag = null; hints = Math.max(hints, 1);
    $("level").textContent = level; $("diff").textContent = L("diff", N, sol.length); $("over").classList.add("hidden"); update();
  }
  const cellOf = (c) => ({ x: c % N, y: (c / N) | 0 });
  const colorAt = (c) => { for (let i = 0; i < ends.length; i++) if (ends[i].includes(c)) return i; return -1; };
  const pathAt = (c) => { for (let i = 0; i < paths.length; i++) if (paths[i].includes(c)) return i; return -1; };
  function update() { const filled = new Set(paths.flat()).size; $("filled").textContent = Math.round(100 * filled / (N * N)) + "%"; $("hint-n").textContent = hints; if (!over && paths.every((p, i) => p.length > 1 && ((p[0] === ends[i][0] && p[p.length - 1] === ends[i][1]) || (p[0] === ends[i][1] && p[p.length - 1] === ends[i][0]))) && filled === N * N) win(); }
  async function win() { over = true; beep(880, 0.25); setTimeout(() => beep(1320, 0.3), 100); solved = Math.max(solved, level); set("fl_solved", solved); setTimeout(async () => { $("over").classList.remove("hidden"); $("over-title").textContent = L("done"); $("over-score").textContent = "✓"; $("over-rank").textContent = ""; const r = await Arc.submit("flow", solved); if (r) $("over-rank").textContent = L("rank", r); }, 500); }
  // kreslení
  function draw() {
    ctx.clearRect(0, 0, S, S); const cs = S / N;
    ctx.strokeStyle = "rgba(255,255,255,.06)"; ctx.lineWidth = 1; for (let i = 1; i < N; i++) { ctx.beginPath(); ctx.moveTo(i * cs, 0); ctx.lineTo(i * cs, S); ctx.moveTo(0, i * cs); ctx.lineTo(S, i * cs); ctx.stroke(); }
    paths.forEach((p, i) => { if (p.length < 1) return; ctx.strokeStyle = COLORS[i]; ctx.lineWidth = cs * 0.42; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.globalAlpha = 0.9; ctx.beginPath(); p.forEach((c, k) => { const { x, y } = cellOf(c); k ? ctx.lineTo((x + 0.5) * cs, (y + 0.5) * cs) : ctx.moveTo((x + 0.5) * cs, (y + 0.5) * cs); }); ctx.stroke(); ctx.globalAlpha = 0.25; ctx.fillStyle = COLORS[i]; for (const c of p) { const { x, y } = cellOf(c); ctx.fillRect(x * cs + 2, y * cs + 2, cs - 4, cs - 4); } ctx.globalAlpha = 1; });
    ends.forEach(([a, b], i) => { for (const c of [a, b]) { const { x, y } = cellOf(c); ctx.fillStyle = COLORS[i]; ctx.beginPath(); ctx.arc((x + 0.5) * cs, (y + 0.5) * cs, cs * 0.32, 0, 6.28); ctx.fill(); ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.beginPath(); ctx.arc((x + 0.4) * cs, (y + 0.4) * cs, cs * 0.1, 0, 6.28); ctx.fill(); } });
    requestAnimationFrame(draw);
  }
  const toCell = (e) => { const r = cv.getBoundingClientRect(); const x = Math.floor((e.clientX - r.left) / r.width * N), y = Math.floor((e.clientY - r.top) / r.height * N); if (x < 0 || y < 0 || x >= N || y >= N) return -1; return y * N + x; };
  cv.addEventListener("pointerdown", (e) => { if (over) return; const c = toCell(e); if (c < 0) return; let i = colorAt(c); if (i >= 0) { paths[i] = [c]; } else { i = pathAt(c); if (i < 0) return; paths[i] = paths[i].slice(0, paths[i].indexOf(c) + 1); } drag = { i, last: c }; beep(420, 0.03, "sine", 0.04); update(); cv.setPointerCapture(e.pointerId); });
  cv.addEventListener("pointermove", (e) => {
    if (!drag) return; const c = toCell(e); if (c < 0 || c === drag.last) return; const p = paths[drag.i];
    const a = cellOf(drag.last), b = cellOf(c); if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) !== 1) return;
    if (p.length > 1 && ends[drag.i].includes(p[0]) && ends[drag.i].includes(p[p.length - 1])) return;  // cesta hotová
    const k = p.indexOf(c); if (k >= 0) { p.length = k + 1; drag.last = c; update(); return; }   // couvání
    const col = colorAt(c); if (col >= 0 && col !== drag.i) return;   // cizí tečka
    const other = pathAt(c); if (other >= 0 && other !== drag.i) { const op = paths[other]; paths[other] = op.slice(0, op.indexOf(c)); }   // přerušit cizí trubku
    p.push(c); drag.last = c; beep(500 + drag.i * 40, 0.02, "sine", 0.03); update();
    if ((c === ends[drag.i][1] || c === ends[drag.i][0]) && p[0] !== c && p.length > 1) { drag = null; beep(700, 0.06); update(); }
  });
  const up = () => { drag = null; }; cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
  function ad(cb) { const ov = document.createElement("div"); ov.className = "overlay"; ov.innerHTML = `<div class="card"><h2>${L("adTitle")}</h2><div class="big-num" id="ad-n">3</div><div class="dim">${L("adNote")}</div><button id="ad-x">${L("close")}</button></div>`; document.body.appendChild(ov); let n = 3; const iv = setInterval(() => { n--; ov.querySelector("#ad-n").textContent = n; if (n <= 0) { clearInterval(iv); ov.remove(); cb(); } }, 1000); ov.querySelector("#ad-x").onclick = () => { clearInterval(iv); ov.remove(); }; }
  function hint() { const i = sol.findIndex((p, k) => !(paths[k].length === p.length && paths[k].every((c, j) => c === p[j] || c === p[p.length - 1 - j]))); if (i < 0) return; for (let k = 0; k < paths.length; k++) if (k !== i) paths[k] = paths[k].filter(c => !sol[i].includes(c)); paths[i] = [...sol[i]]; beep(800, 0.1); update(); }
  $("btn-hint").onclick = () => { if (hints > 0) { hints--; hint(); } else ad(() => { hints += 3; hint(); }); };
  $("btn-reset").onclick = () => { paths = sol.map(() => []); update(); };
  $("btn-skip").onclick = () => ad(() => next());
  function next() { level++; set("fl_level", level); load(); Arc.progress.save("flow", { level, solved }); }
  $("btn-next").onclick = next; $("btn-lb").onclick = () => Arc.openLb("flow", (s) => "L" + s);
  Arc.wire(); Arc.applyLang(); load(); requestAnimationFrame(draw);
  Arc.progress.load("flow", { level, solved }).then(p => { if (p.level > level) { level = p.level; set("fl_level", level); load(); } if (p.solved > solved) { solved = p.solved; set("fl_solved", solved); } });
})();
