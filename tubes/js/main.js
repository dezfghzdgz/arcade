(() => {
  const { $, get, set, L, beep } = Arc;
  Arc.texts({ en: { level: "Level", moves: "Moves", undo: "Undo", reset: "Restart", hint: "Tap a tube, then another to pour. Same color on top only.", done: "Sorted!", next: "Next level", movesIn: (m) => `${m} moves`, adTitle: "For an ad", adNote: "Watch a short ad. (Simulated on web; real rewarded ad in the app.)", diff: (c) => `${c} colors`, noHint: "No hint found – try undo" }, cs: { level: "Level", moves: "Tahy", undo: "Zpět", reset: "Znovu", hint: "Ťukni na zkumavku a pak na druhou = přelít. Jen stejná barva navrch.", done: "Roztříděno!", next: "Další level", movesIn: (m) => `${m} tahů`, adTitle: "Za reklamu", adNote: "Krátká reklama. (Na webu simulace, v appce skutečná odměněná reklama.)", diff: (c) => `${c} barev`, noHint: "Nápověda nenašla tah – zkus zpět" } });
  const COLORS = ["#FF5E7E", "#5EE1D0", "#FFCF5A", "#8A5CFF", "#B6FF5A", "#FF9A3C", "#6FC3FF", "#FF7AD9", "#8B5A2B", "#4FD37A", "#D62828", "#F4F0E8"];
  const CAP = 4;
  let level = get("tb_level", 1), tubes, sel = -1, moves, hist, hints = 3, extra = false, solved = get("tb_solved", 0);
  const mulberry = (a) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const colorsFor = (lv) => Math.min(12, 3 + Math.floor((lv - 1) / 2));
  // generátor: vyřešený stav zamícháme zpětnými platnými přelitími (=> vždy řešitelné)
  function gen(seed, nc) {
    const rand = mulberry(seed); let t = []; for (let c = 0; c < nc; c++) t.push(Array(CAP).fill(c)); t.push([], []);
    const canPour = (a, b) => t[a].length && t[b].length < CAP && (!t[b].length || t[b][t[b].length - 1] === t[a][t[a].length - 1]);
    for (let k = 0; k < nc * 25 + 40; k++) {
      // zpětný tah: vezmi vrchní kus z libovolné zkumavky a přesuň do jiné, kde bude buď na stejné barvě nebo na jiné (zpětně cokoliv jde, dopředu je to pak platné přelití)
      const from = Math.floor(rand() * t.length), to = Math.floor(rand() * t.length); if (from === to || !t[from].length || t[to].length >= CAP) continue;
      // zpětný pohyb je platný, pokud dopředu půjde přelít zpět: barva na vrcholu 'to' po přesunu musí jít zpět na 'from' (tj. from vrchol == barva nebo from prázdná) – vždy pravda, protože vracíme na původní místo
      const n = 1 + Math.floor(rand() * Math.min(2, t[from].length)); const col = t[from][t[from].length - 1]; let cnt = 0; while (cnt < n && t[from].length && t[from][t[from].length - 1] === col && t[to].length < CAP) { t[to].push(t[from].pop()); cnt++; }
    }
    return t.map(x => x.slice());
  }
  function load() { const nc = colorsFor(level); let seed = level * 104729 + 7; tubes = gen(seed, nc); if (tubes.every(isDone)) { tubes = gen(seed + 1, nc); } sel = -1; moves = 0; hist = []; extra = false; $("level").textContent = level; $("moves").textContent = 0; $("diff").textContent = L("diff", nc); $("over").classList.add("hidden"); render(); }
  const isDone = (t) => t.length === 0 || (t.length === CAP && t.every(c => c === t[0]));
  const top = (t) => t[t.length - 1];
  let busy = false;
  function pour(a, b, animate = true) {
    const A = tubes[a], B = tubes[b]; if (busy || !A.length || B.length >= CAP || (B.length && top(B) !== top(A))) return false;
    hist.push(tubes.map(x => x.slice())); const c = top(A); let n = 0; while (A.length && top(A) === c && B.length < CAP) { B.push(A.pop()); n++; }
    moves++; $("moves").textContent = moves;
    if (animate) animatePour(a, b, c, n); else render();
    return true;
  }
  // animace přelití: zdrojová zkumavka vyjede nad cílovou a nakloní se, proud teče, hladiny se plynule mění
  function animatePour(a, b, c, n) {
    busy = true; const box = $("tubes"), els = box.querySelectorAll(".tube"), ea = els[a], eb = els[b]; if (!ea || !eb) { busy = false; render(); return; }
    const ra = ea.getBoundingClientRect(), rb = eb.getBoundingClientRect(), rbox = box.getBoundingClientRect();
    const left = rb.left < ra.left;   // cíl vlevo -> tělo zkumavky míří nahoru doprava
    // otáčíme kolem hrdla (transform-origin nahoře uprostřed) a hrdlo posadíme těsně nad cílovou zkumavku
    const mouthX = rb.left + rb.width / 2, mouthY = rb.top - 6;
    const dx = mouthX - (ra.left + ra.width / 2), dy = mouthY - ra.top;
    ea.style.transformOrigin = "50% 0"; ea.classList.add("pouring"); ea.style.transform = `translate(${dx}px, ${dy}px) rotate(${left ? -115 : 115}deg)`;
    const srcSegs = [...ea.querySelectorAll(".seg")].slice(-n); const added = []; for (let k = 0; k < n; k++) { const sg = document.createElement("div"); sg.className = "seg ghost"; sg.style.background = COLORS[c]; eb.appendChild(sg); added.push(sg); }
    setTimeout(() => {
      // proud: od hrdla dolů k hladině v cíli
      const fillTop = rb.bottom - (tubes[b].length - n) * rb.height * 0.25;
      const st = document.createElement("div"); st.className = "stream"; st.style.background = COLORS[c]; st.style.left = (mouthX - rbox.left - 4) + "px"; st.style.top = (mouthY - rbox.top) + "px"; st.style.height = Math.max(8, fillTop - mouthY - 6) + "px"; box.appendChild(st);
      srcSegs.forEach(sg => sg.style.height = "0%"); added.forEach(sg => { sg.classList.remove("ghost"); sg.style.height = "25%"; sg.style.opacity = "1"; }); beep(500 + c * 40, 0.25, "sine", 0.05);
      setTimeout(() => { st.remove(); ea.style.transform = ""; ea.style.transformOrigin = ""; ea.classList.remove("pouring"); eb.classList.add("wobble"); setTimeout(() => { busy = false; render(); if (tubes.every(isDone)) win(); }, 230); }, 340);
    }, 240);
  }
  function render() {
    const box = $("tubes"); box.innerHTML = "";
    tubes.forEach((t, i) => { const d = document.createElement("div"); d.className = "tube" + (i === sel ? " sel" : "") + (t.length === CAP && isDone(t) ? " done" : ""); t.forEach((c) => { const s = document.createElement("div"); s.className = "seg"; s.style.background = COLORS[c]; d.appendChild(s); }); d.onclick = () => tap(i); box.appendChild(d); });
    $("hint-n").textContent = hints; $("btn-undo").disabled = !hist.length; $("btn-extra").disabled = extra;
  }
  function tap(i) { if (busy) return; if (sel < 0) { if (tubes[i].length) { sel = i; beep(380, 0.04); render(); } return; } if (sel === i) { sel = -1; render(); return; } const ok = pour(sel, i); sel = ok ? -1 : (tubes[i].length ? i : -1); if (!ok) render(); }
  // nápověda: BFS pár tahů dopředu, vybere tah vedoucí k nejvyššímu "pořádku"
  function hintMove() { const score = (t) => t.reduce((a, x) => a + (isDone(x) ? 3 : 0) + (x.length ? x.filter(c => c === x[0]).length === x.length ? 1 : 0 : 0), 0); let best = null, bs = -1; for (let a = 0; a < tubes.length; a++) for (let b = 0; b < tubes.length; b++) { if (a === b) continue; const A = tubes[a], B = tubes[b]; if (!A.length || B.length >= CAP || (B.length && top(B) !== top(A))) continue; if (!B.length && A.every(c => c === A[0])) continue; const copy = tubes.map(x => x.slice()); const c = top(copy[a]); while (copy[a].length && top(copy[a]) === c && copy[b].length < CAP) copy[b].push(copy[a].pop()); const s = score(copy) + (copy[b].length === CAP && isDone(copy[b]) ? 2 : 0) + Math.random() * 0.1; if (s > bs) { bs = s; best = [a, b]; } } return best; }
  function ad(cb) { const ov = document.createElement("div"); ov.className = "overlay"; ov.innerHTML = `<div class="card"><h2>${L("adTitle")}</h2><div class="big-num" id="ad-n">3</div><div class="dim">${L("adNote")}</div><button id="ad-x">${L("close")}</button></div>`; document.body.appendChild(ov); let n = 3; const iv = setInterval(() => { n--; ov.querySelector("#ad-n").textContent = n; if (n <= 0) { clearInterval(iv); ov.remove(); cb(); } }, 1000); ov.querySelector("#ad-x").onclick = () => { clearInterval(iv); ov.remove(); }; }
  $("btn-hint").onclick = () => { const go = () => { const m = hintMove(); if (!m) { alert(L("noHint")); return; } sel = m[0]; render(); setTimeout(() => { sel = -1; pour(m[0], m[1]); }, 250); }; if (hints > 0) { hints--; go(); } else ad(() => { hints += 3; go(); }); };
  $("btn-extra").onclick = () => { if (extra) return; ad(() => { extra = true; tubes.push([]); render(); }); };
  $("btn-undo").onclick = () => { if (busy) return; const h = hist.pop(); if (!h) return; tubes = h; sel = -1; moves++; $("moves").textContent = moves; render(); };
  $("btn-reset").onclick = load; $("btn-next").onclick = () => { level++; set("tb_level", level); load(); Arc.progress.save("tubes", { level, solved }); };
  $("btn-lb").onclick = () => Arc.openLb("tubes", (s) => "L" + s);
  Arc.wire(); Arc.applyLang(); load();
  Arc.progress.load("tubes", { level, solved }).then(p => { if (p.level > level) { level = p.level; set("tb_level", level); load(); } if (p.solved > solved) { solved = p.solved; set("tb_solved", solved); } });
})();
