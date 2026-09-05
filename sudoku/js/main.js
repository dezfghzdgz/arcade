(() => {
  const { $, get, set, L, beep } = Arc;
  Arc.texts({ en: { time: "Time", mistakes: "Mistakes", easy: "Easy", mid: "Medium", hard: "Hard", daily: "Daily", win: "Solved!", lose: "3 mistakes", notes: "Notes", erase: "Erase", hint: "Hint", bestTime: (s) => `Best: ${s}`, adTitle: "Hint for an ad", adNote: "First hint is free. Watch a short ad for more. (Simulated on web; real rewarded ad in the app.)" }, cs: { time: "Čas", mistakes: "Chyby", easy: "Lehké", mid: "Střední", hard: "Těžké", daily: "Denní", win: "Vyřešeno!", lose: "3 chyby", notes: "Poznámky", erase: "Smazat", hint: "Nápověda", bestTime: (s) => `Nejlepší: ${s}`, adTitle: "Nápověda za reklamu", adNote: "První nápověda je zdarma. Další za krátkou reklamu. (Na webu simulace, v appce skutečná odměněná reklama.)" } });
  const HOLES = { easy: 38, mid: 48, hard: 55, daily: 50 };
  let mode = "easy", sol, puzzle, board, notes, given, sel = -1, noteMode = false, mistakes = 0, t0, timer, over = false, best = get("su_best", {}), rand = Math.random;
  const today = () => new Date().toISOString().slice(0, 10);
  const mulberry = (a) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const seedOf = (s) => { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  // ---------- generátor: vyplnit backtrackingem, pak odebírat s kontrolou jediného řešení
  function ok(g, i, v) { const r = (i / 9) | 0, c = i % 9, br = r - r % 3, bc = c - c % 3; for (let k = 0; k < 9; k++) { if (g[r * 9 + k] === v || g[k * 9 + c] === v) return false; if (g[(br + ((k / 3) | 0)) * 9 + bc + k % 3] === v) return false; } return true; }
  function fill(g, i = 0) { if (i === 81) return true; if (g[i]) return fill(g, i + 1); const vals = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => rand() - 0.5); for (const v of vals) { if (ok(g, i, v)) { g[i] = v; if (fill(g, i + 1)) return true; g[i] = 0; } } return false; }
  function countSolutions(g, limit = 2) { let count = 0; const rec = () => { if (count >= limit) return; const i = g.indexOf(0); if (i < 0) { count++; return; } for (let v = 1; v <= 9; v++) if (ok(g, i, v)) { g[i] = v; rec(); g[i] = 0; if (count >= limit) return; } }; rec(); return count; }
  function generate(holes) {
    sol = new Array(81).fill(0); fill(sol); puzzle = sol.slice();
    const order = [...Array(81).keys()].sort(() => rand() - 0.5); let removed = 0;
    for (const i of order) { if (removed >= holes) break; const v = puzzle[i]; puzzle[i] = 0; if (countSolutions(puzzle.slice()) !== 1) puzzle[i] = v; else removed++; }
  }
  function newGame() {
    rand = mode === "daily" ? mulberry(seedOf(today() + "sudoku")) : Math.random;
    generate(HOLES[mode]); board = puzzle.slice(); given = puzzle.map(v => v > 0); notes = Array.from({ length: 81 }, () => new Set()); sel = -1; mistakes = 0; over = false; noteMode = false;
    clearInterval(timer); t0 = Date.now(); timer = setInterval(() => { const s = Math.floor((Date.now() - t0) / 1000); $("time").textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; }, 500);
    $("over").classList.add("hidden"); render();
  }
  const grid = $("grid"); for (let i = 0; i < 81; i++) { const c = document.createElement("div"); c.className = "sc"; if (i % 9 === 2 || i % 9 === 5) c.classList.add("b"); if (((i / 9) | 0) === 2 || ((i / 9) | 0) === 5) c.classList.add("d"); c.onclick = () => { sel = i; render(); }; grid.appendChild(c); }
  const cells = [...grid.children];
  function render() {
    const sr = sel >= 0 ? (sel / 9) | 0 : -1, sc = sel >= 0 ? sel % 9 : -1, sv = sel >= 0 ? board[sel] : 0;
    const counts = Array(10).fill(0); for (const v of board) counts[v]++;
    cells.forEach((c, i) => { const r = (i / 9) | 0, col = i % 9; c.className = "sc" + (col === 2 || col === 5 ? " b" : "") + (r === 2 || r === 5 ? " d" : "") + (given[i] ? " given" : "") + (i === sel ? " sel" : "") + (sv && board[i] === sv ? " same" : "") + (sel >= 0 && (r === sr || col === sc || (((r / 3) | 0) === ((sr / 3) | 0) && ((col / 3) | 0) === ((sc / 3) | 0))) ? " peer" : "") + (board[i] && !given[i] && board[i] !== sol[i] ? " err" : "");
      if (board[i]) c.textContent = board[i]; else if (notes[i].size) c.innerHTML = `<div class="notes">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<span>${notes[i].has(n) ? n : ""}</span>`).join("")}</div>`; else c.textContent = ""; });
    $("mist").textContent = `${mistakes}/3`;
    const np = $("numpad"); np.innerHTML = ""; for (let n = 1; n <= 9; n++) { const b = document.createElement("button"); b.innerHTML = `${n}<small>${9 - counts[n]}</small>`; b.disabled = counts[n] >= 9; b.onclick = () => enter(n); np.appendChild(b); }
    const e = document.createElement("button"); e.textContent = "⌫"; e.onclick = () => enter(0); np.appendChild(e);
    const nb = document.createElement("button"); nb.textContent = "✎"; nb.className = noteMode ? "active" : ""; nb.title = L("notes"); nb.onclick = () => { noteMode = !noteMode; render(); }; np.appendChild(nb);
    const hb = document.createElement("button"); hb.textContent = "💡"; hb.onclick = hint; np.appendChild(hb);
  }
  function enter(n) {
    if (over || sel < 0 || given[sel]) return;
    if (noteMode && n) { notes[sel].has(n) ? notes[sel].delete(n) : notes[sel].add(n); render(); return; }
    board[sel] = n; notes[sel].clear();
    if (n) { if (n !== sol[sel]) { mistakes++; beep(200, 0.2, "sawtooth", 0.1); if (mistakes >= 3) { lose(); render(); return; } } else { beep(600, 0.05); const r = (sel / 9) | 0, c = sel % 9; for (let k = 0; k < 81; k++) if (((k / 9) | 0) === r || k % 9 === c || ((((k / 9) | 0) / 3) | 0) === ((r / 3) | 0) && (((k % 9) / 3) | 0) === ((c / 3) | 0)) notes[k].delete(n); } }
    render(); if (board.every((v, i) => v === sol[i])) win();
  }
  let hintsUsed = 0;
  // 1. nápověda zdarma, další za zhlédnutí reklamy (na webu simulace, v appce AdMob rewarded)
  function hint() { if (over) return; if (hintsUsed >= 1) { showAd(() => { doHint(); }); return; } doHint(); }
  function showAd(cb) {
    const ov = document.createElement("div"); ov.className = "overlay"; ov.innerHTML = `<div class="card"><h2>${L("adTitle")}</h2><div class="big-num" id="ad-n">3</div><div class="dim">${L("adNote")}</div><button id="ad-x">${L("close")}</button></div>`; document.body.appendChild(ov);
    let n = 3; const iv = setInterval(() => { n--; ov.querySelector("#ad-n").textContent = n; if (n <= 0) { clearInterval(iv); ov.remove(); cb(); } }, 1000);
    ov.querySelector("#ad-x").onclick = () => { clearInterval(iv); ov.remove(); };
  }
  function doHint() { if (over) return; hintsUsed++; const empties = board.map((v, i) => v !== sol[i] ? i : -1).filter(i => i >= 0); if (!empties.length) return; const i = empties[Math.floor(Math.random() * empties.length)]; board[i] = sol[i]; given[i] = true; sel = i; beep(800, 0.1); render(); if (board.every((v, k) => v === sol[k])) win(); }
  function lose() { over = true; clearInterval(timer); $("over").classList.remove("hidden"); $("over-title").textContent = L("lose"); $("over-score").textContent = "✖"; $("over-rank").textContent = ""; }
  async function win() { over = true; clearInterval(timer); const s = Math.round((Date.now() - t0) / 1000), f = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; beep(880, 0.3); setTimeout(() => beep(1320, 0.4), 120); if (!best[mode] || s < best[mode]) { best[mode] = s; set("su_best", best); } $("over").classList.remove("hidden"); $("over-title").textContent = L("win"); $("over-score").textContent = f; $("over-rank").textContent = L("bestTime", `${Math.floor(best[mode] / 60)}:${String(best[mode] % 60).padStart(2, "0")}`); const r = await Arc.submit("sudoku_" + mode, Math.max(1, 100000 - s)); if (r) $("over-rank").textContent += " · " + L("rank", r); }
  window.addEventListener("keydown", (e) => { if (e.target.tagName === "INPUT") return; if (e.key >= "1" && e.key <= "9") enter(+e.key); if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") enter(0); if (e.key === "n") { noteMode = !noteMode; render(); } const d = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -9, ArrowDown: 9 }[e.key]; if (d !== undefined && sel >= 0) { e.preventDefault(); sel = Math.max(0, Math.min(80, sel + d)); render(); } });
  $("btn-new").onclick = newGame; $("btn-again").onclick = newGame;
  $("btn-lb").onclick = () => Arc.openLb("sudoku_" + mode, (s) => { const t = 100000 - s; return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`; });
  for (const m of ["easy", "mid", "hard", "daily"]) $("m-" + m).onclick = () => { mode = m; ["easy", "mid", "hard", "daily"].forEach(k => $("m-" + k).classList.toggle("active", k === m)); newGame(); };
  Arc.wire(); Arc.applyLang(); newGame();
})();
