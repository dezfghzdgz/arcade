(() => {
  const $ = (id) => document.getElementById(id);
  const T = SK2_CONFIG.tuning;
  const screens = ["menu", "lobby", "game", "results"];
  const COLORS = ["#FF5E7E", "#5EE1D0", "#FFCF5A", "#8A5CFF", "#B6FF5A", "#FF9A3C", "#6FC3FF", "#FF7AD9", "#F4F0E8", "#B98CFF"];
  let role = null, phase = "menu", lobby = { code: "", hostId: null, players: [], speed: "normal", lang: "en" };
  let game = null, turn = null, timerTick = null, scores = {};
  const norm = (s) => (s || "").toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  function show(id) { screens.forEach(s => $(s).classList.toggle("hidden", s !== id)); $("btn-hub").classList.toggle("hidden", id !== "menu"); if (id === "menu" || id === "results") Monetization.showBanner(); else Monetization.hideBanner(); }
  function toast(msg, ms = 2000) { const el = $("toast"); el.textContent = msg; el.classList.remove("hidden"); clearTimeout(el._t); el._t = setTimeout(() => el.classList.add("hidden"), ms); }
  const myName = () => (Storage.name || "").trim() || (Lang.current() === "cs" ? "Hráč" : "Player");
  const me = () => ({ id: Net.myId, name: myName() });
  const nameOf = (id) => (lobby.players.find(p => p.id === id) || {}).name || "?";
  const colorOf = (id) => COLORS[Math.max(0, lobby.players.findIndex(p => p.id === id)) % COLORS.length];

  // ---------- menu / lobby
  function refreshMenu() { $("name-input").value = Storage.name; $("btn-sound").textContent = Lang("sound") + ": " + Lang(Storage.sound ? "on" : "off"); $("btn-lang").textContent = Lang("lang"); }
  $("name-input").addEventListener("input", (e) => Storage.setName(e.target.value.slice(0, 12)));
  $("btn-sound").onclick = () => { Storage.setSound(!Storage.sound); Audio2.ui(); refreshMenu(); };
  $("btn-lang").onclick = () => { Lang.toggle(); refreshMenu(); renderLobby(); };
  $("btn-create").onclick = () => { Audio2.unlock(); role = "host"; const code = Net.makeCode(); const kind = Net.open(code, true); lobby = { code, hostId: Net.myId, players: [me()], speed: "normal", lang: Lang.current() }; openLobby(kind); syncLobby(); };
  let joinTimeout = null;
  $("btn-join").onclick = () => join($("code-input").value.trim().toUpperCase());
  $("code-input").addEventListener("keydown", (e) => { if (e.key === "Enter") $("btn-join").click(); });
  function join(code) { if (code.length !== 4) return; Audio2.unlock(); role = "client"; const kind = Net.open(code, false); lobby = { code, hostId: null, players: [], speed: "normal", lang: "en" }; openLobby(kind); $("lobby-count").textContent = Lang("connecting"); Net.send("hello", me()); clearTimeout(joinTimeout); joinTimeout = setTimeout(() => { if (role === "client" && !lobby.hostId) { leaveToMenu(); toast(Lang("notFound"), 3000); } }, kind === "online" ? 6000 : 2500); }
  function syncLobby() { if (role === "host") Net.send("lobby", { code: lobby.code, hostId: lobby.hostId, players: lobby.players, speed: lobby.speed, lang: lobby.lang, phase }); renderLobby(); }
  Net.on("hello", (p, from) => { if (role !== "host") return; if (lobby.players.find(x => x.id === from)) { syncLobby(); if (phase === "game") sendState(from); return; } if (lobby.players.length >= T.maxPlayers) { Net.send("full", {}, from); return; } lobby.players.push({ id: from, name: (p.name || "?").slice(0, 12) }); scores[from] = scores[from] || 0; toast(p.name + " →"); syncLobby(); if (phase === "game") sendState(from); });
  Net.on("full", () => { if (role === "client" && !lobby.hostId) { leaveToMenu(); toast(Lang("roomFull"), 3000); } });
  Net.on("lobby", (p) => { if (role !== "client") return; lobby = { code: p.code, hostId: p.hostId, players: p.players, speed: p.speed, lang: p.lang }; clearTimeout(joinTimeout); if (phase === "lobby" || (phase === "results" && p.phase === "lobby")) { if (phase === "results") openLobby(Net.kind); renderLobby(); } });
  Net.on("leave", ({ id }) => { if (role === "host") { if (lobby.players.some(p => p.id === id)) { lobby.players = lobby.players.filter(p => p.id !== id); syncLobby(); if (game && turn && turn.drawer === id) endTurn("left"); } } else if (role === "client" && id === lobby.hostId) { leaveToMenu(); toast(Lang("hostLeft"), 3000); } });
  function openLobby(kind) { phase = "lobby"; show("lobby"); $("lobby-code").textContent = lobby.code; $("lobby-kind").textContent = kind === "online" ? "online" : "local (dev)"; $("btn-start").classList.toggle("hidden", role !== "host"); $("lobby-wait").classList.toggle("hidden", role !== "client"); renderLobby(); }
  function renderLobby() {
    if (phase !== "lobby") return;
    $("lobby-count").textContent = Lang("players", lobby.players.length, T.maxPlayers);
    $("lobby-list").innerHTML = lobby.players.map((p, i) => `<div class="lobby-p"><span class="dot" style="background:${COLORS[i % COLORS.length]}"></span><span></span><small>${p.id === Net.myId ? Lang("you") : p.id === lobby.hostId ? Lang("host") : ""}</small></div>`).join("");
    [...$("lobby-list").querySelectorAll(".lobby-p span:nth-child(2)")].forEach((el, i) => el.textContent = lobby.players[i].name);
    const sb = $("speed-btns"); sb.innerHTML = ""; for (const k of Object.keys(T.speed)) { const b = document.createElement("button"); b.textContent = Lang.speed(k); b.className = k === lobby.speed ? "active" : ""; b.disabled = role !== "host"; b.onclick = () => { lobby.speed = k; syncLobby(); }; sb.appendChild(b); }
    for (const l of ["en", "cs"]) { const b = document.createElement("button"); b.textContent = l === "en" ? "EN words" : "CZ slova"; b.className = l === lobby.lang ? "active" : ""; b.disabled = role !== "host"; b.onclick = () => { lobby.lang = l; syncLobby(); }; sb.appendChild(b); }
    $("btn-start").disabled = lobby.players.length < 2;
  }
  $("btn-copy").onclick = async () => { try { await navigator.clipboard.writeText(Net.roomLink(lobby.code)); toast(Lang("copied")); } catch { toast(Net.roomLink(lobby.code), 4000); } };
  $("btn-share-room").onclick = async () => { const url = Net.roomLink(lobby.code); try { if (navigator.share) await navigator.share({ text: Lang("shareRoom", lobby.code) + url }); else { await navigator.clipboard.writeText(url); toast(Lang("copied")); } } catch {} };
  $("btn-leave").onclick = () => leaveToMenu();
  function leaveToMenu() { clearInterval(timerTick); clearInterval(againTick); clearTimeout(game && game.timeout); Net.close(); role = null; game = null; turn = null; phase = "menu"; refreshMenu(); show("menu"); }

  // ---------- hostitel: průběh
  $("btn-start").onclick = () => { if (role !== "host" || lobby.players.length < 2) { toast(Lang("needTwo")); return; } startGame(); };
  const drawSecs = () => Math.round(T.drawTime * T.speed[lobby.speed]);
  function startGame() { scores = Object.fromEntries(lobby.players.map(p => [p.id, 0])); game = { round: 1, rounds: T.rounds, order: lobby.players.map(p => p.id), idx: 0, used: new Set() }; phase = "game"; Net.send("lobby", { code: lobby.code, hostId: lobby.hostId, players: lobby.players, speed: lobby.speed, lang: lobby.lang, phase }); nextTurn(); }
  function pickWords() { const list = (WORDS[lobby.lang] || WORDS.en).split(","); const out = []; let k = 0; while (out.length < 3 && k++ < 200) { const w = list[Math.floor(Math.random() * list.length)].trim(); if (!game.used.has(w) && !out.includes(w)) out.push(w); } out.forEach(w => game.used.add(w)); return out; }
  function nextTurn() {
    if (!game) return; if (game.idx >= game.order.length) { game.idx = 0; game.round++; if (game.round > game.rounds) return endGame(); }
    const drawer = game.order[game.idx++]; if (!lobby.players.some(p => p.id === drawer)) return nextTurn();
    turn = { drawer, word: null, choices: pickWords(), got: new Set(), deadline: Date.now() + T.choose * 1000, phase: "choose", round: game.round, hint: "" };
    broadcastTurn(); if (drawer === Net.myId) offerChoices(turn.choices); else Net.send("choose", { choices: turn.choices }, drawer);
    clearTimeout(game.timeout); game.timeout = setTimeout(() => { if (turn && turn.phase === "choose") chooseWord(turn.choices[0]); }, T.choose * 1000);
  }
  function chooseWord(w) {
    if (!turn || turn.phase !== "choose") return; turn.word = w; turn.phase = "draw"; turn.deadline = Date.now() + drawSecs() * 1000; turn.hint = w.replace(/[^ ]/g, "_"); turn.revealIdx = [...w].map((c, i) => c !== " " ? i : -1).filter(i => i >= 0).sort(() => Math.random() - 0.5);
    broadcastTurn(); clearTimeout(game.timeout); game.timeout = setTimeout(() => endTurn("time"), drawSecs() * 1000);
    // nápověda: postupně odkrývat písmena (max polovinu)
    const total = drawSecs(), maxReveal = Math.floor(w.replace(/ /g, "").length / 2); let revealed = 0;
    clearInterval(game.hintIv); game.hintIv = setInterval(() => { if (!turn || turn.phase !== "draw" || revealed >= maxReveal) return; const i = turn.revealIdx[revealed++]; const h = [...turn.hint]; h[i] = w[i]; turn.hint = h.join(""); Net.send("hint", { hint: turn.hint }); applyHint(turn.hint); }, (total * 1000) / (maxReveal + 2));
  }
  Net.on("chosen", (p, from) => { if (role === "host" && turn && from === turn.drawer && turn.choices.includes(p.w)) chooseWord(p.w); });
  function broadcastTurn() { const pub = { drawer: turn.drawer, phase: turn.phase, deadline: turn.deadline, round: turn.round, rounds: game.rounds, hint: turn.hint, len: turn.word ? turn.word.length : 0, scores, got: [...turn.got] }; Net.send("turn", pub); applyTurn(pub); }
  function sendState(to) { if (!turn) return; Net.send("turn", { drawer: turn.drawer, phase: turn.phase, deadline: turn.deadline, round: turn.round, rounds: game.rounds, hint: turn.hint, len: turn.word ? turn.word.length : 0, scores, got: [...turn.got] }, to); Net.send("strokes", { all: strokes }, to); }
  Net.on("guess", (p, from) => { if (role !== "host" || !turn) return; handleGuess(from, p.text); });
  function handleGuess(from, text) {
    if (!turn || turn.phase !== "draw" || from === turn.drawer || turn.got.has(from)) { if (turn && (from === turn.drawer || turn.got.has(from))) return; Net.send("chat", { from, text }); addChat(from, text); return; }
    const g = norm(text), w = norm(turn.word);
    if (g === w) { turn.got.add(from); const left = Math.max(0, (turn.deadline - Date.now()) / 1000), pts = 100 + Math.round(left / drawSecs() * 150); scores[from] = (scores[from] || 0) + pts; scores[turn.drawer] = (scores[turn.drawer] || 0) + 40; Net.send("correct", { from, scores, got: [...turn.got] }); applyCorrect(from, scores, [...turn.got]); if (lobby.players.filter(p => p.id !== turn.drawer).every(p => turn.got.has(p.id))) endTurn("all"); return; }
    if (w.length > 3 && (w.includes(g) || g.includes(w) || levenshtein(g, w) <= 1) && g.length >= 3) { Net.send("chat", { from, text, close: true }); addChat(from, text, false, true); return; }
    Net.send("chat", { from, text }); addChat(from, text);
  }
  function levenshtein(a, b) { const m = []; for (let i = 0; i <= a.length; i++) m[i] = [i]; for (let j = 0; j <= b.length; j++) m[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return m[a.length][b.length]; }
  function endTurn(why) { if (!turn) return; clearTimeout(game.timeout); clearInterval(game.hintIv); const word = turn.word; turn.phase = "end"; Net.send("turnEnd", { word, why, scores }); applyTurnEnd(word, why, scores); turn = null; setTimeout(() => nextTurn(), 3500); }
  function endGame() { const rows = lobby.players.map(p => ({ id: p.id, total: scores[p.id] || 0 })).sort((a, b) => b.total - a.total); Net.send("end", { rows }); showResults(rows); }

  // ---------- klient/všichni: stav tahu
  Net.on("turn", (p) => { if (role === "client") applyTurn(p); });
  Net.on("choose", (p) => { if (role === "client") offerChoices(p.choices); });
  Net.on("hint", (p) => { if (role === "client") applyHint(p.hint); });
  Net.on("chat", (p) => { if (role === "client") addChat(p.from, p.text, false, p.close); });
  Net.on("correct", (p) => { if (role === "client") applyCorrect(p.from, p.scores, p.got); });
  Net.on("turnEnd", (p) => { if (role === "client") applyTurnEnd(p.word, p.why, p.scores); });
  Net.on("end", (m) => { if (role === "client") showResults(m.rows); });
  let view = null;
  function applyTurn(p) {
    const newTurn = !view || view.drawer !== p.drawer || view.round !== p.round || (view.phase === "end");
    view = p; scores = p.scores || scores; phase = "game"; show("game");
    if (newTurn) { clearPad(); strokes = []; $("g-chat").innerHTML = ""; }
    const meDraw = p.drawer === Net.myId;
    $("g-step").textContent = Lang("round", p.round, p.rounds) + " · " + (meDraw ? Lang("youDraw") : Lang("isDrawing", nameOf(p.drawer)));
    $("g-tools").classList.toggle("hidden", !meDraw || p.phase !== "draw"); $("g-guess").classList.toggle("hidden", meDraw);
    $("g-choose").classList.toggle("hidden", !(meDraw && p.phase === "choose"));
    if (p.phase === "choose" && !meDraw) $("g-word").textContent = Lang("choosing", nameOf(p.drawer)); else if (!meDraw) applyHint(p.hint);
    renderScores(p.got || []);
    clearInterval(timerTick); timerTick = setInterval(() => { const s = Math.max(0, Math.ceil((p.deadline - Date.now()) / 1000)); $("g-timer").textContent = s; if (s <= 5 && s > 0 && p.phase === "draw") Audio2.tick(); }, 500);
    if (!meDraw) setTimeout(() => $("g-text").focus(), 50);
  }
  function offerChoices(ch) { $("g-choose").classList.remove("hidden"); const c = $("g-choices"); c.innerHTML = ""; ch.forEach(w => { const b = document.createElement("button"); b.textContent = w; b.onclick = () => { $("g-choose").classList.add("hidden"); $("g-word").textContent = w; if (role === "host") chooseWord(w); else Net.send("chosen", { w }, lobby.hostId); }; c.appendChild(b); }); }
  function applyHint(h) { if (view && view.drawer === Net.myId) return; $("g-word").textContent = (h || "").split("").join(" "); }
  function addChat(from, text, ok = false, close = false) { const c = $("g-chat"); const d = document.createElement("div"); d.className = ok ? "ok" : ""; d.innerHTML = `<b style="color:${colorOf(from)}"></b><span></span>${close ? ` <em class="sys">${Lang("close")}</em>` : ""}`; d.querySelector("b").textContent = nameOf(from) + ":"; d.querySelector("span").textContent = text; c.appendChild(d); c.scrollTop = c.scrollHeight; if (c.childElementCount > 60) c.firstChild.remove(); }
  function sysChat(text) { const c = $("g-chat"); const d = document.createElement("div"); d.className = "sys"; d.textContent = text; c.appendChild(d); c.scrollTop = c.scrollHeight; }
  function applyCorrect(from, sc, got) { scores = sc; if (view) view.got = got; sysChat(Lang("correct", nameOf(from))); if (from === Net.myId) { Audio2.win(); $("g-text").disabled = true; } else Audio2.pickup(); renderScores(got); }
  function applyTurnEnd(word, why, sc) { scores = sc; if (view) view.phase = "end"; clearInterval(timerTick); sysChat(Lang("wordWas", word) + (why === "all" ? " · " + Lang("everyoneGot") : why === "time" ? " · " + Lang("timeUp") : "")); $("g-word").textContent = word; $("g-tools").classList.add("hidden"); $("g-text").disabled = false; renderScores([]); }
  function renderScores(got) { const s = $("g-scores"); s.innerHTML = lobby.players.map(p => `<span class="${p.id === Net.myId ? "me" : ""}${view && view.drawer === p.id ? " drawing" : ""}${got.includes(p.id) ? " got" : ""}"><span class="nm"></span> ${scores[p.id] || 0}</span>`).join(""); [...s.querySelectorAll(".nm")].forEach((el, i) => el.textContent = lobby.players[i].name); }
  $("g-send").onclick = () => sendGuess(); $("g-text").addEventListener("keydown", (e) => { if (e.key === "Enter") sendGuess(); });
  function sendGuess() { const t = $("g-text").value.trim(); if (!t) return; $("g-text").value = ""; if (role === "host") handleGuess(Net.myId, t); else Net.send("guess", { text: t }, lobby.hostId); }

  // ---------- kreslení + synchronizace tahů
  const pad = $("pad"), pctx = pad.getContext("2d");
  let color = "#2B2440", size = 4, eraser = false, fillMode = false, drawing = false, cur = null, strokes = [], pending = [];
  function clearPad() { pctx.fillStyle = "#fff"; pctx.fillRect(0, 0, pad.width, pad.height); }
  clearPad();
  const cb = $("colors"); ["#2B2440", "#FF5E7E", "#FF9A3C", "#FFCF5A", "#B6FF5A", "#5EE1D0", "#6FC3FF", "#8A5CFF", "#FF7AD9", "#8B5A2B", "#9E9E9E", "#FFFFFF"].forEach((c, i) => { const b = document.createElement("button"); b.style.background = c; b.className = i === 0 ? "active" : ""; b.onclick = () => { color = c; eraser = false; cb.querySelectorAll("button").forEach(x => x.classList.remove("active")); b.classList.add("active"); $("t-eraser").classList.remove("active"); }; cb.appendChild(b); });
  document.querySelectorAll(".sz").forEach(b => b.onclick = () => { size = +b.dataset.size; document.querySelectorAll(".sz").forEach(x => x.classList.remove("active")); b.classList.add("active"); });
  $("t-eraser").onclick = () => { eraser = !eraser; fillMode = false; $("t-eraser").classList.toggle("active", eraser); $("t-fill").classList.remove("active"); };
  $("t-fill").onclick = () => { fillMode = !fillMode; eraser = false; $("t-fill").classList.toggle("active", fillMode); $("t-eraser").classList.remove("active"); };
  $("t-undo").onclick = () => { if (!canDraw()) return; strokes.pop(); redraw(); emit({ t: "undo" }); };
  $("t-clear").onclick = () => { if (!canDraw()) return; strokes = []; clearPad(); emit({ t: "clear" }); };
  const canDraw = () => view && view.drawer === Net.myId && view.phase === "draw";
  const pos = (e) => { const r = pad.getBoundingClientRect(); return [Math.round((e.clientX - r.left) * pad.width / r.width), Math.round((e.clientY - r.top) * pad.height / r.height)]; };
  function drawStroke(s) { if (s.t === "fill") { floodFill(s.x, s.y, s.c); return; } pctx.strokeStyle = s.c; pctx.lineWidth = s.w; pctx.lineCap = "round"; pctx.lineJoin = "round"; pctx.beginPath(); const p = s.p; if (p.length === 1) { pctx.fillStyle = s.c; pctx.arc(p[0][0], p[0][1], s.w / 2, 0, 6.28); pctx.fill(); return; } pctx.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) pctx.lineTo(p[i][0], p[i][1]); pctx.stroke(); }
  function redraw() { clearPad(); for (const s of strokes) drawStroke(s); }
  function floodFill(x, y, hex) { const img = pctx.getImageData(0, 0, pad.width, pad.height), d = img.data, W = pad.width, H = pad.height; const idx = (y * W + x) * 4; const tr = d[idx], tg = d[idx + 1], tb = d[idx + 2]; const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16); if (tr === r && tg === g && tb === b) return; const st = [[x, y]]; const seen = new Uint8Array(W * H); while (st.length) { const [cx, cy] = st.pop(); if (cx < 0 || cy < 0 || cx >= W || cy >= H) continue; const k = cy * W + cx; if (seen[k]) continue; const i = k * 4; if (Math.abs(d[i] - tr) + Math.abs(d[i + 1] - tg) + Math.abs(d[i + 2] - tb) > 60) continue; seen[k] = 1; d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255; st.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]); } pctx.putImageData(img, 0, 0); }
  pad.addEventListener("pointerdown", (e) => { e.preventDefault(); if (!canDraw()) return; const [x, y] = pos(e); if (fillMode) { const s = { t: "fill", x, y, c: color }; strokes.push(s); drawStroke(s); emit({ t: "s", s }); return; } drawing = true; cur = { t: "l", c: eraser ? "#FFFFFF" : color, w: eraser ? size * 3 : size, p: [[x, y]] }; strokes.push(cur); drawStroke(cur); pad.setPointerCapture(e.pointerId); });
  pad.addEventListener("pointermove", (e) => { if (!drawing || !cur) return; const [x, y] = pos(e); const last = cur.p[cur.p.length - 1]; if (Math.abs(last[0] - x) + Math.abs(last[1] - y) < 2) return; cur.p.push([x, y]); pctx.strokeStyle = cur.c; pctx.lineWidth = cur.w; pctx.lineCap = "round"; pctx.beginPath(); pctx.moveTo(last[0], last[1]); pctx.lineTo(x, y); pctx.stroke(); });
  const up = () => { if (drawing && cur) { emit({ t: "s", s: cur }); } drawing = false; cur = null; }; pad.addEventListener("pointerup", up); pad.addEventListener("pointercancel", up);
  // odesílání: rozpracovaný tah každých 80 ms (živé kreslení), hotový celý
  setInterval(() => { if (drawing && cur && cur.p.length > 1) { const from = cur.sent || 0; if (cur.p.length > from) { emitNow({ t: "part", c: cur.c, w: cur.w, p: cur.p.slice(Math.max(0, from - 1)) }); cur.sent = cur.p.length; } } }, 80);
  function emit(m) { emitNow(m); }
  function emitNow(m) { if (role === "host") Net.send("strokes", { one: m }); else Net.send("strokes", { one: m }, lobby.hostId); }
  Net.on("strokes", (p, from) => {
    if (role === "host") { if (!turn || from !== turn.drawer) return; applyStrokeMsg(p.one); Net.send("strokes", { one: p.one }); return; }
    if (p.all) { strokes = p.all; redraw(); return; }
    if (view && view.drawer === Net.myId) return; applyStrokeMsg(p.one);
  });
  function applyStrokeMsg(m) { if (!m) return; if (m.t === "s") { strokes.push(m.s); if (m.s.t === "fill") drawStroke(m.s); else redraw(); } else if (m.t === "part") { drawStroke({ t: "l", c: m.c, w: m.w, p: m.p }); } else if (m.t === "undo") { strokes.pop(); redraw(); } else if (m.t === "clear") { strokes = []; clearPad(); } }

  // ---------- výsledky + hrát znovu
  function showResults(rows) { phase = "results"; show("results"); const box = $("results"); let list = box.querySelector(".album"); if (!list) { list = document.createElement("div"); list.className = "album"; box.insertBefore(list, $("btn-again")); } list.innerHTML = rows.map((r, i) => `<div class="entry" style="flex-direction:row;align-items:center"><span>${i + 1}.</span><span class="dot" style="width:10px;height:10px;border-radius:50%;background:${colorOf(r.id)}"></span><span class="nm" style="flex:1"></span><b>${Lang("pts", r.total)}</b></div>`).join(""); [...list.querySelectorAll(".nm")].forEach((el, i) => el.textContent = nameOf(rows[i].id)); Storage.addGame(); if (window.Rating) Rating.add("sketch", 15 + (rows[0] && rows[0].id === Net.myId ? 10 : 0)); if (rows[0] && rows[0].id === Net.myId) Audio2.win(); else Audio2.lose(); startAgain(); }
  let againVotes = new Set(), againLeft = 0, againTick = null;
  function startAgain() { againVotes = new Set(); againLeft = 20; clearInterval(againTick); updateAgain(); againTick = setInterval(() => { againLeft--; updateAgain(); if (againLeft <= 0) { clearInterval(againTick); if (role === "host") goLobbyAgain(); } }, 1000); }
  function updateAgain() { $("btn-again").textContent = (againVotes.has(Net.myId) ? Lang("waitingOthers") : Lang("playAgain")) + ` ${againVotes.size}/${lobby.players.length} · ${againLeft}s`; }
  $("btn-again").onclick = () => { if (againVotes.has(Net.myId)) return; againVotes.add(Net.myId); if (role === "client") Net.send("again", {}, lobby.hostId); else { Net.send("againVotes", [...againVotes]); checkAgain(); } updateAgain(); };
  Net.on("again", (p, from) => { if (role !== "host" || phase !== "results") return; againVotes.add(from); Net.send("againVotes", [...againVotes]); updateAgain(); checkAgain(); });
  Net.on("againVotes", (v) => { if (role === "client" && phase === "results") { againVotes = new Set(v); updateAgain(); } });
  function checkAgain() { if (lobby.players.every(p => againVotes.has(p.id))) { clearInterval(againTick); goLobbyAgain(); } }
  function goLobbyAgain() { game = null; turn = null; view = null; openLobby(Net.kind); syncLobby(); }
  $("btn-res-menu").onclick = () => leaveToMenu();

  Lang.apply(); refreshMenu(); show("menu"); Monetization.init();
  if (new URLSearchParams(location.search).get("create")) { history.replaceState(null, "", location.pathname); setTimeout(() => $("btn-create").click(), 150); }
  const roomParam = new URLSearchParams(location.search).get("room");
  if (roomParam) { history.replaceState(null, "", location.pathname); $("code-input").value = roomParam.toUpperCase(); setTimeout(() => join(roomParam.toUpperCase()), 300); }
})();
