(() => {
  const $ = (id) => document.getElementById(id);
  const T = DD_CONFIG.tuning;
  const screens = ["menu", "lobby", "game", "reveal", "results"];
  const COLORS = ["#FF5E7E", "#5EE1D0", "#FFCF5A", "#8A5CFF", "#B6FF5A", "#FF9A3C", "#6FC3FF", "#FF7AD9", "#F4F0E8", "#B98CFF"];
  let role = null, phase = "menu", lobby = { code: "", hostId: null, players: [], speed: "normal" };
  let game = null;      // hostitel: { chains, round, rounds, deadline, submitted:Set }
  let task = null;      // já: { kind, chain, prompt(text|img), deadline }
  let timerTick = null;

  function show(id) { screens.forEach(s => $(s).classList.toggle("hidden", s !== id)); $("btn-hub").classList.toggle("hidden", id !== "menu"); if (id === "menu" || id === "results") Monetization.showBanner(); else Monetization.hideBanner(); }
  function toast(msg, ms = 2000) { const el = $("toast"); el.textContent = msg; el.classList.remove("hidden"); clearTimeout(el._t); el._t = setTimeout(() => el.classList.add("hidden"), ms); }
  const myName = () => (Storage.name || "").trim() || (Lang.current() === "cs" ? "Hráč" : "Player");
  const me = () => ({ id: Net.myId, name: myName() });
  const nameOf = (id) => (lobby.players.find(p => p.id === id) || {}).name || "?";
  const colorOf = (id) => COLORS[Math.max(0, lobby.players.findIndex(p => p.id === id)) % COLORS.length];

  // ---------- menu
  function refreshMenu() { $("name-input").value = Storage.name; $("btn-sound").textContent = Lang("sound") + ": " + Lang(Storage.sound ? "on" : "off"); $("btn-lang").textContent = Lang("lang"); }
  $("name-input").addEventListener("input", (e) => Storage.setName(e.target.value.slice(0, 12)));
  $("btn-sound").onclick = () => { Storage.setSound(!Storage.sound); Audio2.ui(); refreshMenu(); };
  $("btn-lang").onclick = () => { Lang.toggle(); refreshMenu(); renderLobby(); };

  // ---------- lobby
  $("btn-create").onclick = () => { Audio2.unlock(); role = "host"; const code = Net.makeCode(); const kind = Net.open(code, true); lobby = { code, hostId: Net.myId, players: [me()], speed: "normal" }; openLobby(kind); syncLobby(); };
  let joinTimeout = null;
  $("btn-join").onclick = () => join($("code-input").value.trim().toUpperCase());
  $("code-input").addEventListener("keydown", (e) => { if (e.key === "Enter") $("btn-join").click(); });
  function join(code) { if (code.length !== 4) return; Audio2.unlock(); role = "client"; const kind = Net.open(code, false); lobby = { code, hostId: null, players: [], speed: "normal" }; openLobby(kind); $("lobby-count").textContent = Lang("connecting"); Net.send("hello", me()); clearTimeout(joinTimeout); joinTimeout = setTimeout(() => { if (role === "client" && !lobby.hostId) { leaveToMenu(); toast(Lang("notFound"), 3000); } }, kind === "online" ? 6000 : 2500); }
  function syncLobby() { if (role === "host") Net.send("lobby", { code: lobby.code, hostId: lobby.hostId, players: lobby.players, speed: lobby.speed, phase }); renderLobby(); }
  Net.on("hello", (p, from) => { if (role !== "host") return; if (lobby.players.find(x => x.id === from)) { syncLobby(); return; } if (lobby.players.length >= T.maxPlayers || phase !== "lobby") { Net.send("full", {}, from); return; } lobby.players.push({ id: from, name: (p.name || "?").slice(0, 12) }); toast(p.name + " →"); syncLobby(); });
  Net.on("full", () => { if (role === "client" && !lobby.hostId) { leaveToMenu(); toast(Lang("roomFull"), 3000); } });
  Net.on("lobby", (p) => { if (role !== "client") return; lobby = { code: p.code, hostId: p.hostId, players: p.players, speed: p.speed }; clearTimeout(joinTimeout); if (phase === "lobby" || (phase === "results" && p.phase === "lobby")) { if (phase === "results") openLobby(Net.kind); renderLobby(); } });
  Net.on("leave", ({ id }) => { if (role === "host") { if (lobby.players.some(p => p.id === id)) { lobby.players = lobby.players.filter(p => p.id !== id); syncLobby(); if (game) checkRound(); } } else if (role === "client" && id === lobby.hostId) { leaveToMenu(); toast(Lang("hostLeft"), 3000); } });
  function openLobby(kind) { phase = "lobby"; show("lobby"); $("lobby-code").textContent = lobby.code; $("lobby-kind").textContent = kind === "online" ? "online" : "local (dev)"; $("btn-start").classList.toggle("hidden", role !== "host"); $("lobby-wait").classList.toggle("hidden", role !== "client"); renderLobby(); }
  function renderLobby() {
    if (phase !== "lobby") return;
    $("lobby-count").textContent = Lang("players", lobby.players.length, T.maxPlayers);
    $("lobby-list").innerHTML = lobby.players.map((p, i) => `<div class="lobby-p"><span class="dot" style="background:${COLORS[i % COLORS.length]}"></span><span></span><small>${p.id === Net.myId ? Lang("you") : p.id === lobby.hostId ? Lang("host") : ""}</small></div>`).join("");
    [...$("lobby-list").querySelectorAll(".lobby-p span:nth-child(2)")].forEach((el, i) => el.textContent = lobby.players[i].name);
    const sb = $("speed-btns"); sb.innerHTML = ""; for (const k of Object.keys(T.speed)) { const b = document.createElement("button"); b.textContent = Lang.speed(k); b.className = k === lobby.speed ? "active" : ""; b.disabled = role !== "host"; b.onclick = () => { lobby.speed = k; syncLobby(); }; sb.appendChild(b); }
    $("btn-start").disabled = lobby.players.length < 2;
  }
  $("btn-copy").onclick = async () => { try { await navigator.clipboard.writeText(Net.roomLink(lobby.code)); toast(Lang("copied")); } catch { toast(Net.roomLink(lobby.code), 4000); } };
  $("btn-share-room").onclick = async () => { const url = Net.roomLink(lobby.code); try { if (navigator.share) await navigator.share({ text: Lang("shareRoom", lobby.code) + url }); else { await navigator.clipboard.writeText(url); toast(Lang("copied")); } } catch {} };
  $("btn-leave").onclick = () => leaveToMenu();
  function leaveToMenu() { clearInterval(timerTick); clearInterval(againTick); Net.close(); role = null; game = null; task = null; phase = "menu"; refreshMenu(); show("menu"); }

  // ---------- hostitel: průběh
  $("btn-start").onclick = () => { if (role !== "host" || lobby.players.length < 2) { toast(Lang("needTwo")); return; } startGame(); };
  function startGame() {
    const n = lobby.players.length;
    const rounds = Math.min(12, Math.max(n, Math.ceil(6 / n) * n));   // aspoň 6 kroků v albu (ve 2 lidech: napiš, kresli, hádej, kresli, hádej, kresli)
    game = { chains: lobby.players.map(p => ({ owner: p.id, entries: [] })), round: 0, rounds, submitted: new Set() };
    phase = "game"; Net.send("lobby", { code: lobby.code, hostId: lobby.hostId, players: lobby.players, speed: lobby.speed, phase });
    beginRound();
  }
  const secs = (kind) => Math.round(T[kind] * T.speed[lobby.speed]);
  function beginRound() {
    const r = game.round, n = lobby.players.length;
    game.submitted = new Set();
    const rounds = game.rounds; game.deadline = Date.now() + secs(r === 0 ? "write" : r % 2 ? "draw" : "guess") * 1000;
    lobby.players.forEach((p, i) => {
      const chainIdx = (i + r) % n, chain = game.chains[chainIdx], prev = chain.entries[r - 1];
      const t = r === 0 ? { kind: "write" } : r % 2 ? { kind: "draw", text: prev.text } : { kind: "guess", img: prev.img };
      Object.assign(t, { chain: chainIdx, round: r, rounds, deadline: game.deadline });
      if (p.id === Net.myId) receiveTask(t); else Net.send("task", t, p.id);
    });
    game.timeout = setTimeout(() => finishRound(), game.deadline - Date.now() + 1500);
  }
  Net.on("submit", (p, from) => { if (role !== "host" || !game) return; acceptSubmit(from, p); });
  function acceptSubmit(from, p) {
    if (!game || game.submitted.has(from) || p.round !== game.round) return;
    const chain = game.chains[p.chain]; chain.entries[game.round] = { by: from, text: p.text, img: p.img };
    game.submitted.add(from); Net.send("progress", { n: game.submitted.size, of: lobby.players.length });
    updateWait(game.submitted.size, lobby.players.length); checkRound();
  }
  function checkRound() { if (game && lobby.players.every(p => game.submitted.has(p.id))) finishRound(); }
  function finishRound() {
    if (!game) return; clearTimeout(game.timeout);
    // chybějící odpovědi doplnit
    const r = game.round, n = lobby.players.length;
    lobby.players.forEach((p, i) => { const chain = game.chains[(i + r) % n]; if (!chain.entries[r]) chain.entries[r] = { by: p.id, text: r % 2 ? undefined : "…", img: r % 2 ? blank() : undefined }; });
    game.round++;
    if (game.round < game.rounds) beginRound(); else startReveal();
  }
  function blank() { const c = document.createElement("canvas"); c.width = 600; c.height = 400; const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, 600, 400); return c.toDataURL("image/png"); }

  // ---------- já: úkol
  Net.on("task", (t) => { if (role === "client") receiveTask(t); });
  function receiveTask(t) {
    task = t; phase = "game"; show("game"); Audio2.whistle();
    $("g-step").textContent = `${t.round + 1} / ${t.rounds}`;
    $("g-write").classList.toggle("hidden", t.kind === "draw"); $("g-draw").classList.toggle("hidden", t.kind !== "draw");
    $("g-prompt").classList.toggle("hidden", t.kind !== "draw"); $("g-image").classList.toggle("hidden", t.kind !== "guess"); $("g-wait").classList.add("hidden");
    $("g-text").value = ""; $("g-text").disabled = false; $("g-send").disabled = false; $("g-send-draw").disabled = false;
    if (t.kind === "write") { $("g-title").textContent = Lang("writeTitle"); $("g-hint").textContent = Lang("writeHint"); $("g-text").placeholder = Lang("writePh"); }
    if (t.kind === "draw") { $("g-title").textContent = Lang("drawTitle"); $("g-prompt").textContent = t.text; clearPad(); }
    if (t.kind === "guess") { $("g-title").textContent = Lang("guessTitle"); $("g-hint").textContent = ""; $("g-image").src = t.img; $("g-text").placeholder = Lang("guessPh"); }
    setTimeout(() => { if (t.kind !== "draw") $("g-text").focus(); }, 100);
    clearInterval(timerTick); timerTick = setInterval(() => { const s = Math.max(0, Math.ceil((t.deadline - Date.now()) / 1000)); $("g-timer").textContent = s; if (s <= 5 && s > 0) Audio2.tick(); if (s === 0) { clearInterval(timerTick); if (!task.sent) submit(true); } }, 500);
  }
  function submit(auto) {
    if (!task || task.sent) return;
    const payload = { chain: task.chain, round: task.round };
    if (task.kind === "draw") payload.img = $("pad").toDataURL("image/png"); else payload.text = ($("g-text").value.trim() || (auto ? "…" : "")); 
    if (!auto && task.kind !== "draw" && !payload.text) return;
    task.sent = true; $("g-send").disabled = true; $("g-send-draw").disabled = true; $("g-text").disabled = true; Audio2.pickup();
    if (role === "host") acceptSubmit(Net.myId, payload); else Net.send("submit", payload, lobby.hostId);
    $("g-wait").classList.remove("hidden"); $("g-wait").textContent = Lang("submitted");
  }
  $("g-send").onclick = () => submit(false); $("g-send-draw").onclick = () => submit(false);
  $("g-text").addEventListener("keydown", (e) => { if (e.key === "Enter") submit(false); });
  Net.on("progress", (p) => { if (role === "client") updateWait(p.n, p.of); });
  function updateWait(n, of) { if (task && task.sent) { $("g-wait").classList.remove("hidden"); $("g-wait").textContent = `${Lang("submitted")} ${n}/${of}`; } }

  // ---------- kreslení
  const pad = $("pad"), pctx = pad.getContext("2d");
  let color = "#2B2440", size = 4, eraser = false, drawing = false, last = null, undoStack = [];
  function clearPad() { pctx.fillStyle = "#fff"; pctx.fillRect(0, 0, pad.width, pad.height); undoStack = []; }
  clearPad();
  const cb = $("colors"); ["#2B2440", "#FF5E7E", "#FF9A3C", "#FFCF5A", "#B6FF5A", "#5EE1D0", "#6FC3FF", "#8A5CFF", "#FF7AD9", "#8B5A2B", "#9E9E9E", "#FFFFFF"].forEach((c, i) => { const b = document.createElement("button"); b.style.background = c; b.className = i === 0 ? "active" : ""; b.onclick = () => { color = c; eraser = false; cb.querySelectorAll("button").forEach(x => x.classList.remove("active")); b.classList.add("active"); $("t-eraser").classList.remove("active"); }; cb.appendChild(b); });
  document.querySelectorAll(".sz").forEach(b => b.onclick = () => { size = +b.dataset.size; document.querySelectorAll(".sz").forEach(x => x.classList.remove("active")); b.classList.add("active"); });
  $("t-eraser").onclick = () => { eraser = !eraser; $("t-eraser").classList.toggle("active", eraser); };
  $("t-undo").onclick = () => { const im = undoStack.pop(); if (im) pctx.putImageData(im, 0, 0); };
  $("t-clear").onclick = () => { undoStack.push(pctx.getImageData(0, 0, pad.width, pad.height)); pctx.fillStyle = "#fff"; pctx.fillRect(0, 0, pad.width, pad.height); };
  const pos = (e) => { const r = pad.getBoundingClientRect(); return { x: (e.clientX - r.left) * pad.width / r.width, y: (e.clientY - r.top) * pad.height / r.height }; };
  pad.addEventListener("pointerdown", (e) => { e.preventDefault(); if (task && task.sent) return; drawing = true; last = pos(e); undoStack.push(pctx.getImageData(0, 0, pad.width, pad.height)); if (undoStack.length > 20) undoStack.shift(); dot(last); pad.setPointerCapture(e.pointerId); });
  pad.addEventListener("pointermove", (e) => { if (!drawing) return; const p = pos(e); pctx.strokeStyle = eraser ? "#fff" : color; pctx.lineWidth = eraser ? size * 3 : size; pctx.lineCap = "round"; pctx.lineJoin = "round"; pctx.beginPath(); pctx.moveTo(last.x, last.y); pctx.lineTo(p.x, p.y); pctx.stroke(); last = p; });
  const up = () => { drawing = false; }; pad.addEventListener("pointerup", up); pad.addEventListener("pointercancel", up);
  function dot(p) { pctx.fillStyle = eraser ? "#fff" : color; pctx.beginPath(); pctx.arc(p.x, p.y, (eraser ? size * 3 : size) / 2, 0, 6.28); pctx.fill(); }

  // ---------- alba
  let reveal = null;   // { chain, step }
  function startReveal() { phase = "reveal"; reveal = { chain: 0, step: 0 }; broadcastReveal(); }
  function broadcastReveal() { const ch = game.chains[reveal.chain]; const msg = { chain: reveal.chain, step: reveal.step, owner: ch.owner, entries: ch.entries.slice(0, reveal.step + 1), last: reveal.chain === game.chains.length - 1 && reveal.step === ch.entries.length - 1, total: game.chains.length }; Net.send("reveal", msg); showReveal(msg); }
  Net.on("reveal", (m) => { if (role === "client") showReveal(m); });
  function showReveal(m) {
    phase = "reveal"; show("reveal"); $("r-title").textContent = Lang("album", nameOf(m.owner)) + ` (${m.chain + 1}/${m.total})`;
    const list = $("r-list");
    if (m.step === 0) list.innerHTML = "";
    const e = m.entries[m.step]; if (e && list.childElementCount <= m.step) { const d = document.createElement("div"); d.className = "entry"; d.innerHTML = `<div class="by"><span class="dot" style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${colorOf(e.by)};margin-right:6px"></span><span></span></div>` + (e.img ? `<img src="${e.img}" alt="" />` : `<div class="txt"></div>`); d.querySelector(".by span:nth-child(2)").textContent = `${nameOf(e.by)} ${m.step === 0 ? Lang("wrote") : e.img ? Lang("drew") : Lang("guessed")}`; if (!e.img) d.querySelector(".txt").textContent = e.text; list.appendChild(d); d.scrollIntoView({ behavior: "smooth", block: "end" }); Audio2.ui(); }
    $("r-next").classList.toggle("hidden", role !== "host"); $("r-wait").classList.toggle("hidden", role === "host");
    $("r-next").textContent = m.last ? Lang("finish") : (m.step === m.entries.length - 1 && m.entries.length === (game ? game.rounds : m.entries.length) ? Lang("nextAlbum") : Lang("next"));
    if (m.last) $("r-next").textContent = Lang("finish");
  }
  $("r-next").onclick = () => { if (role !== "host" || !game) return; const ch = game.chains[reveal.chain]; if (reveal.step < ch.entries.length - 1) reveal.step++; else if (reveal.chain < game.chains.length - 1) { reveal.chain++; reveal.step = 0; } else { endGame(); return; } broadcastReveal(); };
  function endGame() { Net.send("end", {}); showResults(); }
  Net.on("end", () => { if (role === "client") showResults(); });
  function showResults() { phase = "results"; show("results"); Storage.addGame(); Audio2.win(); startAgain(); }

  // ---------- hrát znovu
  let againVotes = new Set(), againLeft = 0, againTick = null;
  function startAgain() { againVotes = new Set(); againLeft = 20; clearInterval(againTick); updateAgain(); againTick = setInterval(() => { againLeft--; updateAgain(); if (againLeft <= 0) { clearInterval(againTick); if (role === "host") goLobbyAgain(); } }, 1000); }
  function updateAgain() { $("btn-again").textContent = (againVotes.has(Net.myId) ? Lang("waitingOthers") : Lang("playAgain")) + ` ${againVotes.size}/${lobby.players.length} · ${againLeft}s`; }
  $("btn-again").onclick = () => { if (againVotes.has(Net.myId)) return; againVotes.add(Net.myId); if (role === "client") Net.send("again", {}, lobby.hostId); else { Net.send("againVotes", [...againVotes]); checkAgain(); } updateAgain(); };
  Net.on("again", (p, from) => { if (role !== "host" || phase !== "results") return; againVotes.add(from); Net.send("againVotes", [...againVotes]); updateAgain(); checkAgain(); });
  Net.on("againVotes", (v) => { if (role === "client" && phase === "results") { againVotes = new Set(v); updateAgain(); } });
  function checkAgain() { if (lobby.players.every(p => againVotes.has(p.id))) { clearInterval(againTick); goLobbyAgain(); } }
  function goLobbyAgain() { game = null; task = null; openLobby(Net.kind); syncLobby(); }
  $("btn-res-menu").onclick = () => leaveToMenu();

  // ---------- start
  Lang.apply(); refreshMenu(); show("menu"); Monetization.init();
  const roomParam = new URLSearchParams(location.search).get("room");
  if (roomParam) { history.replaceState(null, "", location.pathname); $("code-input").value = roomParam.toUpperCase(); setTimeout(() => join(roomParam.toUpperCase()), 300); }
})();
