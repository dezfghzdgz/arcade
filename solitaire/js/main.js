(() => {
  const { $, get, set, L, beep } = Arc;
  Arc.texts({ en: { time: "Time", moves: "Moves", draw1: "Draw 1", draw3: "Draw 3", daily: "Daily", undo: "Undo", hint: "Tap a card to move it, double-tap to send it up. Drag works too.", win: "Solved!", tryAgain: "New deal", bestTime: (s) => `Best: ${s}` }, cs: { time: "Čas", moves: "Tahy", draw1: "Po 1", draw3: "Po 3", daily: "Denní", undo: "Zpět", hint: "Ťukni na kartu = přesun, dvojklik = nahoru. Jde i tažením.", win: "Vyřešeno!", tryAgain: "Nové rozdání", bestTime: (s) => `Nejlepší: ${s}` } });
  const table = $("table"); const SUITS = ["♠", "♥", "♦", "♣"], RED = (s) => s === 1 || s === 2;
  let mode = "1", drawN = 1, stock, waste, found, tab, moves, t0, timer, over, hist = [], best = get("so_best", {}), rand = Math.random, sel = null, cw = 60;
  const today = () => new Date().toISOString().slice(0, 10);
  const mulberry = (a) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const seedOf = (s) => { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  function newGame() {
    rand = mode === "daily" ? mulberry(seedOf(today() + "sol")) : Math.random; drawN = mode === "3" ? 3 : 1;
    const deck = []; for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) deck.push({ s, r, up: false, id: s * 13 + r });
    for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
    tab = []; for (let i = 0; i < 7; i++) { tab.push(deck.splice(0, i + 1)); tab[i][i].up = true; }
    stock = deck; waste = []; found = [[], [], [], []]; moves = 0; over = false; hist = []; sel = null;
    clearInterval(timer); t0 = Date.now(); timer = setInterval(() => { const s = Math.floor((Date.now() - t0) / 1000); $("time").textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; }, 500);
    $("over").classList.add("hidden"); render();
  }
  const snapshot = () => JSON.stringify({ stock, waste, found, tab });
  function push() { hist.push(snapshot()); if (hist.length > 50) hist.shift(); }
  function restore(s) { const o = JSON.parse(s); stock = o.stock; waste = o.waste; found = o.found; tab = o.tab; }
  const canFound = (c, f) => f.length === 0 ? c.r === 1 : f[f.length - 1].s === c.s && f[f.length - 1].r === c.r - 1;
  const canTab = (c, col) => col.length === 0 ? c.r === 13 : (() => { const t = col[col.length - 1]; return t.up && RED(t.s) !== RED(c.s) && t.r === c.r + 1; })();
  function layout() { const W = table.clientWidth; cw = Math.floor((W - 8 * 6) / 7); table.style.setProperty("--cw", cw + "px"); }
  function render() {
    layout(); table.innerHTML = ""; const gap = 6, ch = cw * 1.4, topY = 8, tabY = topY + ch + 14, ox = (table.clientWidth - (7 * cw + 6 * gap)) / 2;
    const el = (c, x, y, extra = "") => { const d = document.createElement("div"); d.className = "card " + (c.up ? (RED(c.s) ? "red" : "blk") : "back") + extra; d.style.left = x + "px"; d.style.top = y + "px"; if (c.up) { const t = ["", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"][c.r] + SUITS[c.s]; d.innerHTML = `<span>${t}</span><span class="b">${t}</span>`; } d.dataset.id = c.id; return d; };
    // stock
    const st = document.createElement("div"); st.className = "slot stock"; st.style.left = ox + "px"; st.style.top = topY + "px"; st.onclick = draw; table.appendChild(st);
    if (stock.length) { const d = el(stock[stock.length - 1], ox, topY); d.onclick = draw; table.appendChild(d); }
    // waste (poslední až 3 vějířem)
    const wx = ox + cw + gap; const show = waste.slice(-Math.min(3, drawN));
    show.forEach((c, i) => { const d = el(c, wx + i * Math.floor(cw * 0.3), topY, i === show.length - 1 ? "" : " under"); if (i === show.length - 1) attach(d, { from: "waste" }); table.appendChild(d); });
    // foundations
    for (let f = 0; f < 4; f++) { const x = ox + (3 + f) * (cw + gap); const s = document.createElement("div"); s.className = "slot f"; s.style.left = x + "px"; s.style.top = topY + "px"; s.dataset.f = f; table.appendChild(s); if (found[f].length) { const d = el(found[f][found[f].length - 1], x, topY); d.dataset.f = f; table.appendChild(d); } }
    // tableau
    const dy = Math.min(cw * 0.45, (table.clientHeight - tabY - ch) / 13);
    for (let i = 0; i < 7; i++) { const x = ox + i * (cw + gap); const s = document.createElement("div"); s.className = "slot"; s.style.left = x + "px"; s.style.top = tabY + "px"; s.dataset.col = i; table.appendChild(s);
      tab[i].forEach((c, k) => { const d = el(c, x, tabY + k * (c.up ? dy : dy * 0.5)); d.dataset.col = i; d.dataset.k = k; if (c.up) attach(d, { from: "tab", col: i, k }); else if (k === tab[i].length - 1) d.onclick = () => { push(); c.up = true; moves++; render(); }; if (sel && sel.from === "tab" && sel.col === i && k >= sel.k) d.classList.add("sel"); table.appendChild(d); }); }
    if (sel && sel.from === "waste") { const d = [...table.querySelectorAll(".card")].find(x => +x.dataset.id === waste[waste.length - 1].id); if (d) d.classList.add("sel"); }
    $("moves").textContent = moves; $("btn-undo").disabled = !hist.length;
  }
  function draw() { if (over) return; push(); if (!stock.length) { if (!waste.length) return; stock = waste.reverse().map(c => ({ ...c, up: false })); waste = []; } else { for (let i = 0; i < drawN && stock.length; i++) { const c = stock.pop(); c.up = true; waste.push(c); } } moves++; sel = null; beep(500, 0.04); render(); }
  const cardsOf = (src) => src.from === "waste" ? [waste[waste.length - 1]] : tab[src.col].slice(src.k);
  function take(src) { if (src.from === "waste") return [waste.pop()]; return tab[src.col].splice(src.k); }
  function tryMove(src, dst) {   // dst: {to:"found",f} | {to:"tab",col}
    const cards = cardsOf(src); if (!cards.length || !cards[0]) return false;
    if (dst.to === "found") { if (cards.length !== 1 || !canFound(cards[0], found[dst.f])) return false; push(); found[dst.f].push(take(src)[0]); }
    else { if (src.from === "tab" && src.col === dst.col) return false; if (!canTab(cards[0], tab[dst.col])) return false; push(); tab[dst.col].push(...take(src)); }
    if (src.from === "tab" && tab[src.col].length && !tab[src.col][tab[src.col].length - 1].up) tab[src.col][tab[src.col].length - 1].up = true;
    moves++; beep(650, 0.05); return true;
  }
  function autoMove(src) { const cards = cardsOf(src); if (cards.length === 1) for (let f = 0; f < 4; f++) if (canFound(cards[0], found[f])) return tryMove(src, { to: "found", f }); for (let col = 0; col < 7; col++) if (canTab(cards[0], tab[col]) && !(src.from === "tab" && src.col === col) && !(tab[col].length === 0 && src.from === "tab" && src.k === 0)) return tryMove(src, { to: "tab", col }); return false; }
  // vstup: tap = výběr / přesun, dvojklik = nahoru, drag = tažení
  let drag = null, lastTap = 0;
  function attach(d, src) {
    d.addEventListener("pointerdown", (e) => { e.preventDefault(); drag = { src, x: e.clientX, y: e.clientY, moved: false, els: [] }; const ids = cardsOf(src).map(c => c.id); drag.els = [...table.querySelectorAll(".card")].filter(x => ids.includes(+x.dataset.id)); drag.els.forEach(x => { x.classList.add("drag"); x.dataset.ox = parseFloat(x.style.left); x.dataset.oy = parseFloat(x.style.top); }); d.setPointerCapture(e.pointerId); });
    d.addEventListener("pointermove", (e) => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.hypot(dx, dy) > 6) drag.moved = true; if (drag.moved) drag.els.forEach(x => { x.style.left = (+x.dataset.ox + dx) + "px"; x.style.top = (+x.dataset.oy + dy) + "px"; }); });
    d.addEventListener("pointerup", (e) => {
      if (!drag) return; const dr = drag; drag = null;
      if (dr.moved) { dr.els.forEach(x => x.style.visibility = "hidden"); const t = document.elementFromPoint(e.clientX, e.clientY); dr.els.forEach(x => x.style.visibility = ""); const tgt = t && t.closest("[data-f],[data-col]"); let ok = false; if (tgt) { if (tgt.dataset.f !== undefined) ok = tryMove(dr.src, { to: "found", f: +tgt.dataset.f }); else if (tgt.dataset.col !== undefined) ok = tryMove(dr.src, { to: "tab", col: +tgt.dataset.col }); } sel = null; render(); if (ok) checkWin(); return; }
      const now = Date.now(); const dbl = now - lastTap < 350; lastTap = now;
      if (dbl) { sel = null; if (autoMove(dr.src)) { render(); checkWin(); } return; }
      if (sel) { const ok = dr.src.from === "tab" ? tryMove(sel, { to: "tab", col: dr.src.col }) : false; sel = ok ? null : (sameSrc(sel, dr.src) ? null : dr.src); render(); if (ok) checkWin(); }
      else { sel = dr.src; render(); }
    });
  }
  const sameSrc = (a, b) => a.from === b.from && a.col === b.col && a.k === b.k;
  table.addEventListener("click", (e) => { const s = e.target.closest(".slot"); if (!s || !sel) return; let ok = false; if (s.dataset.f !== undefined) ok = tryMove(sel, { to: "found", f: +s.dataset.f }); else if (s.dataset.col !== undefined) ok = tryMove(sel, { to: "tab", col: +s.dataset.col }); sel = null; render(); if (ok) checkWin(); });
  table.addEventListener("click", (e) => { const c = e.target.closest(".card[data-f]"); if (c && sel) { const ok = tryMove(sel, { to: "found", f: +c.dataset.f }); sel = null; render(); if (ok) checkWin(); } });
  async function checkWin() {
    if (found.every(f => f.length === 13)) { over = true; clearInterval(timer); const s = Math.round((Date.now() - t0) / 1000), f = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; beep(880, 0.3); setTimeout(() => beep(1320, 0.4), 120);
      if (!best[mode] || s < best[mode]) { best[mode] = s; set("so_best", best); }
      $("over").classList.remove("hidden"); $("over-title").textContent = L("win"); $("over-score").textContent = f; $("over-rank").textContent = L("bestTime", `${Math.floor(best[mode] / 60)}:${String(best[mode] % 60).padStart(2, "0")}`);
      const r = await Arc.submit("solitaire_" + mode, Math.max(1, 100000 - s)); if (r) $("over-rank").textContent += " · " + L("rank", r); }
    // auto-dohrání: když je vše otočené a stock prázdný, posílat nahoru
    else if (!stock.length && !waste.length && tab.every(c => c.every(x => x.up))) { let moved = true; while (moved) { moved = false; for (let col = 0; col < 7; col++) { const c = tab[col][tab[col].length - 1]; if (!c) continue; for (let f = 0; f < 4; f++) if (canFound(c, found[f])) { found[f].push(tab[col].pop()); moved = true; break; } } } render(); if (found.every(f => f.length === 13)) checkWin(); }
  }
  $("btn-undo").onclick = () => { const s = hist.pop(); if (!s) return; restore(s); sel = null; moves++; render(); };
  $("btn-new").onclick = newGame; $("btn-again").onclick = newGame;
  $("btn-lb").onclick = () => Arc.openLb("solitaire_" + mode, (s) => { const t = 100000 - s; return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`; });
  for (const m of ["1", "3", "daily"]) $("m-" + m).onclick = () => { mode = m; ["1", "3", "daily"].forEach(k => $("m-" + k).classList.toggle("active", k === m)); newGame(); };
  window.addEventListener("resize", render);
  Arc.wire(); Arc.applyLang(); newGame();
})();
