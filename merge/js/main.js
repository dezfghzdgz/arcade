(() => {
  const CFG = { supabaseUrl: "https://ofozkelnipwozpukbdfg.supabase.co", supabaseAnonKey: "sb_publishable_o8I4CvJRiM3IeXUI2V24cQ_wEUoYKt4" };
  const $ = (id) => document.getElementById(id);
  const T = {
    en: { score: "Score", best: "Best", classic: "Classic", daily: "Daily", leaderboard: "Leaderboard", undo: "Undo", newGame: "New game", hint: "Swipe or use arrow keys. Same numbers merge.", keepGoing: "Keep going", tryAgain: "Try again", close: "Close", yourName: "Your name",
      gameOver: "No more moves", win: "You made 2048!", dailyTitle: (d) => `Daily ${d}`, rank: (r) => `#${r} worldwide`, loading: "Loading…", empty: "Nobody yet – be the first.", offline: "Leaderboard isn't set up yet.", dailyDone: (s) => `Today's daily done: ${s}. Come back tomorrow (or play classic).`, sound: "Sound", on: "on", off: "off", lang: "Čeština", saved: "Saved" },
    cs: { score: "Skóre", best: "Rekord", classic: "Klasika", daily: "Denní", leaderboard: "Žebříček", undo: "Zpět", newGame: "Nová hra", hint: "Táhni prstem nebo šipky. Stejná čísla se spojí.", keepGoing: "Pokračovat", tryAgain: "Znovu", close: "Zavřít", yourName: "Tvoje jméno",
      gameOver: "Žádný další tah", win: "Máš 2048!", dailyTitle: (d) => `Denní ${d}`, rank: (r) => `Celosvětově ${r}. místo`, loading: "Načítám…", empty: "Zatím nikdo – buď první.", offline: "Žebříček ještě není zapojený.", dailyDone: (s) => `Dnešní denní hotová: ${s}. Přijď zítra (nebo hraj klasiku).`, sound: "Zvuk", on: "zap", off: "vyp", lang: "English", saved: "Uloženo" },
  };
  const get = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  let lang = get("mg_lang", null) || "en";
  const L = (k, ...a) => { const v = T[lang][k] ?? T.en[k]; return typeof v === "function" ? v(...a) : v; };
  let name = get("mg_name", ""); try { const an = localStorage.getItem("arcade_name"); if (an) name = an.slice(0, 12); } catch {}
  let device = get("mg_device", null); if (!device) { device = (crypto.randomUUID ? crypto.randomUUID() : "d" + Math.random().toString(36).slice(2)); set("mg_device", device); }
  let sound = get("mg_sound", true);

  // ---------- hra
  const N = 4;
  let grid, score, best = get("mg_best", 0), bestDaily = get("mg_best_daily", {}), mode = "classic", rand = Math.random, history = [], won = false, over = false, tileId = 1, tiles = new Map();
  const today = () => new Date().toISOString().slice(0, 10);
  const mulberry = (a) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const seedOf = (s) => { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  function newGame() {
    rand = mode === "daily" ? mulberry(seedOf(today())) : Math.random;
    grid = Array.from({ length: N }, () => Array(N).fill(null)); score = 0; history = []; won = false; over = false; tiles.clear();
    $("board").querySelectorAll(".tile").forEach(t => t.remove());
    spawn(); spawn(); render(); $("over").classList.add("hidden"); updateHud();
  }
  function spawn() { const empty = []; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!grid[y][x]) empty.push([x, y]); if (!empty.length) return; const [x, y] = empty[Math.floor(rand() * empty.length)]; grid[y][x] = { v: rand() < 0.9 ? 2 : 4, id: tileId++, fresh: true }; }
  function move(dir) {   // 0 left 1 up 2 right 3 down
    if (over) return;
    const snap = { grid: grid.map(r => r.map(c => c && { v: c.v, id: c.id })), score };
    let moved = false, gained = 0;
    const lines = [];
    for (let i = 0; i < N; i++) { const line = []; for (let j = 0; j < N; j++) { const [x, y] = dir === 0 ? [j, i] : dir === 2 ? [N - 1 - j, i] : dir === 1 ? [i, j] : [i, N - 1 - j]; line.push({ x, y, t: grid[y][x] }); } lines.push(line); }
    for (const line of lines) {
      const ts = line.filter(c => c.t).map(c => c.t); const out = []; let k = 0;
      while (k < ts.length) { if (k + 1 < ts.length && ts[k].v === ts[k + 1].v) { out.push({ v: ts[k].v * 2, id: ts[k].id, merged: true, from: ts[k + 1].id }); gained += ts[k].v * 2; k += 2; } else { out.push({ v: ts[k].v, id: ts[k].id }); k++; } }
      for (let j = 0; j < N; j++) { const c = line[j], nt = out[j] || null; if ((c.t && !nt) || (!c.t && nt) || (c.t && nt && (c.t.id !== nt.id || nt.merged))) moved = true; grid[c.y][c.x] = nt; }
    }
    if (!moved) return;
    history.push(snap); if (history.length > 5) history.shift();
    score += gained; spawn(); render(); if (gained) beep(gained >= 64 ? 660 : 520);
    if (score > best) { best = score; set("mg_best", best); }
    if (mode === "daily" && score > (bestDaily[today()] || 0)) { bestDaily = { [today()]: score }; set("mg_best_daily", bestDaily); }
    updateHud();
    if (!won && grid.some(r => r.some(c => c && c.v >= 2048))) { won = true; showOver(true); return; }
    if (!canMove()) { over = true; showOver(false); }
  }
  function canMove() { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const c = grid[y][x]; if (!c) return true; if (x < N - 1 && grid[y][x + 1] && grid[y][x + 1].v === c.v) return true; if (y < N - 1 && grid[y + 1][x] && grid[y + 1][x].v === c.v) return true; } return false; }
  $("btn-undo").onclick = () => { const s = history.pop(); if (!s) return; grid = s.grid.map(r => r.map(c => c && { v: c.v, id: c.id })); score = s.score; over = false; $("over").classList.add("hidden"); render(); updateHud(); };

  // ---------- kreslení
  const COLORS = { 2: "#F4F0E8", 4: "#FFE9A3", 8: "#FFCF5A", 16: "#FF9A3C", 32: "#FF6B5B", 64: "#FF5E7E", 128: "#FF7AD9", 256: "#B98CFF", 512: "#8A5CFF", 1024: "#5EE1D0", 2048: "#B6FF5A", 4096: "#6FC3FF" };
  const board = $("board"); for (let i = 0; i < N * N; i++) { const c = document.createElement("div"); c.className = "cell"; board.appendChild(c); }
  function cellPos(x, y) { const r = board.getBoundingClientRect(), pad = 8, gap = 8, s = (r.width - pad * 2 - gap * 3) / N; return { left: pad + x * (s + gap), top: pad + y * (s + gap), size: s }; }
  function render() {
    const seen = new Set();
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const c = grid[y][x]; if (!c) continue; seen.add(c.id);
      let el = tiles.get(c.id); const p = cellPos(x, y);
      if (!el) { el = document.createElement("div"); el.className = "tile new"; board.appendChild(el); tiles.set(c.id, el); el.style.left = p.left + "px"; el.style.top = p.top + "px"; }
      el.style.width = el.style.height = p.size + "px"; el.style.left = p.left + "px"; el.style.top = p.top + "px";
      el.textContent = c.v; el.style.background = COLORS[c.v] || "#fff"; el.style.fontSize = (c.v >= 1024 ? 22 : c.v >= 128 ? 26 : 30) + "px"; el.style.color = c.v >= 1024 ? "#1B1030" : "#1B1030";
      if (c.merged) { el.classList.remove("merged"); void el.offsetWidth; el.classList.add("merged"); c.merged = false; if (c.from && tiles.get(c.from)) { tiles.get(c.from).remove(); tiles.delete(c.from); } }
    }
    for (const [id, el] of tiles) if (!seen.has(id)) { el.remove(); tiles.delete(id); }
  }
  window.addEventListener("resize", render);
  function updateHud() { $("score").textContent = score; $("best").textContent = mode === "daily" ? (bestDaily[today()] || 0) : best; $("btn-undo").disabled = !history.length; }

  // ---------- vstupy
  window.addEventListener("keydown", (e) => { if (e.target.tagName === "INPUT") return; const d = { ArrowLeft: 0, ArrowUp: 1, ArrowRight: 2, ArrowDown: 3, a: 0, w: 1, d: 2, s: 3 }[e.key]; if (d !== undefined) { e.preventDefault(); move(d); } });
  let sw = null;
  board.addEventListener("pointerdown", (e) => { sw = { x: e.clientX, y: e.clientY }; });
  window.addEventListener("pointerup", (e) => { if (!sw) return; const dx = e.clientX - sw.x, dy = e.clientY - sw.y; sw = null; if (Math.hypot(dx, dy) < 24) return; move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 2 : 0) : (dy > 0 ? 3 : 1)); });

  // ---------- konec + žebříček
  async function showOver(w) {
    $("over").classList.remove("hidden"); $("over-title").textContent = w ? L("win") : L("gameOver"); $("over-score").textContent = score; $("btn-continue").classList.toggle("hidden", !w); $("over-rank").textContent = "";
    beep(w ? 880 : 220);
    const r = await submitScore(score); if (r) $("over-rank").textContent = L("rank", r);
  }
  $("btn-continue").onclick = () => { $("over").classList.add("hidden"); };
  $("btn-again").onclick = () => newGame();
  const sbOk = () => !!CFG.supabaseUrl;
  const hdr = () => ({ "Content-Type": "application/json", apikey: CFG.supabaseAnonKey, Authorization: "Bearer " + CFG.supabaseAnonKey });
  async function submitScore(s) { if (!sbOk() || s <= 0) return null; try { const r = await fetch(CFG.supabaseUrl + "/rest/v1/rpc/submit_score_game", { method: "POST", headers: hdr(), body: JSON.stringify({ p_game: "merge_" + mode, p_device: device, p_name: (name || "Player").slice(0, 12), p_score: s }) }); return r.ok ? await r.json() : null; } catch { return null; } }
  async function openLb() {
    $("lb").classList.remove("hidden"); $("name-input").value = name; const list = $("lb-list"); list.innerHTML = ""; const st = $("lb-status");
    if (!sbOk()) { st.textContent = L("offline"); return; }
    st.textContent = L("loading");
    try { const r = await fetch(CFG.supabaseUrl + `/rest/v1/leaderboard_game?game=eq.merge_${mode}&select=rank,name,score,device_id&order=rank.asc&limit=50`, { headers: hdr() }); const rows = await r.json();
      st.textContent = rows.length ? "" : L("empty"); for (const x of rows) { const li = document.createElement("li"); if (x.device_id === device) li.className = "me"; li.innerHTML = `<span>${x.rank}.</span><span class="n"></span><b>${x.score}</b>`; li.querySelector(".n").textContent = x.name; list.appendChild(li); } } catch { st.textContent = L("offline"); }
  }
  $("btn-lb").onclick = openLb; $("lb-close").onclick = () => $("lb").classList.add("hidden");
  $("btn-name").onclick = () => { name = $("name-input").value.trim().slice(0, 12); set("mg_name", name); $("lb-status").textContent = L("saved"); };
  $("m-classic").onclick = () => { mode = "classic"; $("m-classic").classList.add("active"); $("m-daily").classList.remove("active"); newGame(); };
  $("m-daily").onclick = () => { mode = "daily"; $("m-daily").classList.add("active"); $("m-classic").classList.remove("active"); newGame(); };
  $("btn-new").onclick = () => newGame();

  // ---------- zvuk, jazyk
  let actx; function beep(f) { if (!sound) return; try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); const o = actx.createOscillator(), g = actx.createGain(); o.type = "triangle"; o.frequency.value = f; g.gain.value = 0.08; g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.12); o.connect(g).connect(actx.destination); o.start(); o.stop(actx.currentTime + 0.13); } catch {} }
  function applyLang() { document.documentElement.lang = lang; document.querySelectorAll("[data-i18n]").forEach(el => el.textContent = L(el.dataset.i18n)); document.querySelectorAll("[data-i18n-ph]").forEach(el => el.placeholder = L(el.dataset.i18nPh)); $("btn-sound").textContent = L("sound") + ": " + L(sound ? "on" : "off"); $("btn-lang").textContent = L("lang"); }
  $("btn-lang").onclick = () => { lang = lang === "en" ? "cs" : "en"; set("mg_lang", lang); applyLang(); };
  $("btn-sound").onclick = () => { sound = !sound; set("mg_sound", sound); applyLang(); };
  applyLang(); newGame();
})();
