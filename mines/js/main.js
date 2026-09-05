(() => {
  const { $, get, set, L, beep } = Arc;
  Arc.texts({ en: { time: "Time", left: "Mines", easy: "Easy", mid: "Medium", hard: "Hard", daily: "Daily", flagHint: "tap = reveal · hold or 🚩 = flag", win: "Cleared!", lose: "Boom!", bestTime: (s) => `Best: ${s}s`, dailyBoard: "Daily board – same for everyone, one timed try" }, cs: { time: "Čas", left: "Miny", easy: "Lehká", mid: "Střední", hard: "Těžká", daily: "Denní", flagHint: "ťuk = odkrýt · podržet nebo 🚩 = vlajka", win: "Vyčištěno!", lose: "Bum!", bestTime: (s) => `Nejlepší: ${s}s`, dailyBoard: "Denní pole – stejné pro všechny, jeden pokus na čas" } });
  const SIZES = { easy: [9, 9, 10], mid: [12, 12, 24], hard: [16, 16, 48], daily: [12, 12, 26] };
  let mode = "easy", W, H, M, cells, mines, opened, flags, started, over, t0, timer, flagMode = false, rand = Math.random, best = get("mn_best", {});
  const today = () => new Date().toISOString().slice(0, 10);
  const mulberry = (a) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const seedOf = (s) => { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const grid = $("grid"), idx = (x, y) => y * W + x;
  const N8 = (i, fn) => { const x = i % W, y = (i / W) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H) fn(idx(xx, yy)); } };
  function newGame() {
    [W, H, M] = SIZES[mode]; rand = mode === "daily" ? mulberry(seedOf(today() + "mines")) : Math.random;
    mines = null; opened = new Set(); flags = new Set(); started = false; over = false; clearInterval(timer); $("time").textContent = "0"; $("left").textContent = M;
    grid.style.gridTemplateColumns = `repeat(${W}, 1fr)`; grid.innerHTML = "";
    cells = []; for (let i = 0; i < W * H; i++) { const c = document.createElement("div"); c.className = "c"; c.dataset.i = i; grid.appendChild(c); cells.push(c); }
    $("over").classList.add("hidden"); $("btn-flag").classList.toggle("active", flagMode);
  }
  function place(first) {   // miny až po prvním kliku, kolem něj prázdno
    mines = new Set(); const safe = new Set([first]); N8(first, j => safe.add(j));
    while (mines.size < M) { const i = Math.floor(rand() * W * H); if (!safe.has(i)) mines.add(i); }
    started = true; t0 = Date.now(); timer = setInterval(() => $("time").textContent = Math.floor((Date.now() - t0) / 1000), 250);
  }
  const count = (i) => { let n = 0; N8(i, j => { if (mines.has(j)) n++; }); return n; };
  function reveal(i) {
    if (over || flags.has(i) || opened.has(i)) return;
    if (!started) place(i);
    if (mines.has(i)) { lose(i); return; }
    const stack = [i];
    while (stack.length) { const k = stack.pop(); if (opened.has(k) || flags.has(k)) continue; opened.add(k); const n = count(k); const c = cells[k]; c.classList.add("o"); if (n) { c.textContent = n; c.dataset.n = n; } else N8(k, j => { if (!opened.has(j)) stack.push(j); }); }
    beep(600, 0.05, "sine", 0.05);
    if (opened.size === W * H - M) win();
  }
  function chord(i) { if (!opened.has(i)) return; const n = count(i); let f = 0; N8(i, j => { if (flags.has(j)) f++; }); if (f === n) N8(i, j => { if (!flags.has(j) && !opened.has(j)) reveal(j); }); }
  function flag(i) { if (over || opened.has(i)) return; if (flags.has(i)) { flags.delete(i); cells[i].classList.remove("f"); cells[i].textContent = ""; } else { flags.add(i); cells[i].classList.add("f"); cells[i].textContent = "🚩"; } $("left").textContent = M - flags.size; beep(400, 0.05, "square", 0.04); }
  function lose(hit) { over = true; clearInterval(timer); for (const m of mines) { cells[m].classList.add("m"); cells[m].textContent = "💣"; } cells[hit].classList.add("boom"); beep(120, 0.5, "sawtooth", 0.15); $("over").classList.remove("hidden"); $("over-title").textContent = L("lose"); $("over-score").textContent = "💥"; $("over-rank").textContent = best[mode] ? L("bestTime", best[mode]) : ""; }
  async function win() {
    over = true; clearInterval(timer); const s = Math.round((Date.now() - t0) / 100) / 10; beep(880, 0.3); setTimeout(() => beep(1320, 0.4), 120);
    if (!best[mode] || s < best[mode]) { best[mode] = s; set("mn_best", best); }
    $("over").classList.remove("hidden"); $("over-title").textContent = L("win"); $("over-score").textContent = s + "s"; $("over-rank").textContent = L("bestTime", best[mode]);
    const r = await Arc.submit("mines_" + mode, Math.max(1, 100000 - Math.round(s * 10)));   // žebříček: menší čas = vyšší skóre
    if (r) $("over-rank").textContent += " · " + L("rank", r);
  }
  // vstupy: klik = odkrýt / chord, pravý klik nebo podržení = vlajka, režim 🚩
  let hold = null, held = false;
  grid.addEventListener("contextmenu", (e) => e.preventDefault());
  grid.addEventListener("pointerdown", (e) => { const c = e.target.closest(".c"); if (!c) return; held = false; hold = setTimeout(() => { held = true; flag(+c.dataset.i); if (navigator.vibrate) navigator.vibrate(15); }, 380); });
  grid.addEventListener("pointerup", (e) => { clearTimeout(hold); const c = e.target.closest(".c"); if (!c || held) return; const i = +c.dataset.i; if (e.button === 2 || flagMode) { flag(i); return; } if (opened.has(i)) chord(i); else reveal(i); });
  grid.addEventListener("pointerleave", () => clearTimeout(hold)); grid.addEventListener("pointercancel", () => clearTimeout(hold));
  $("btn-flag").onclick = () => { flagMode = !flagMode; $("btn-flag").classList.toggle("active", flagMode); };
  $("btn-new").onclick = newGame; $("btn-again").onclick = newGame;
  $("btn-lb").onclick = () => Arc.openLb("mines_" + mode, (s) => ((100000 - s) / 10).toFixed(1) + "s");
  for (const m of ["easy", "mid", "hard", "daily"]) $("m-" + m).onclick = () => { mode = m; ["easy", "mid", "hard", "daily"].forEach(k => $("m-" + k).classList.toggle("active", k === m)); newGame(); };
  Arc.wire(); Arc.applyLang(); newGame();
})();
