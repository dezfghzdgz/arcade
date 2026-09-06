(() => {
  const $ = (id) => document.getElementById(id);
  const T = PT_CONFIG.tuning;
  const screens = ["menu", "lobby", "game", "results"];
  const COLORS = ["#FF5E7E", "#5EE1D0", "#FFCF5A", "#8A5CFF", "#B6FF5A", "#FF9A3C", "#6FC3FF", "#FF7AD9"];
  const GAMES = ["reflex", "race", "math", "color", "hold", "count"];
  let role = null, phase = "menu", lobby = { code: "", hostId: null, players: [], speed: "normal" };
  let game = null, cur = null, timerTick = null, totals = {};

  function show(id) { screens.forEach(s => $(s).classList.toggle("hidden", s !== id)); $("btn-hub").classList.toggle("hidden", id !== "menu"); if (id === "menu" || id === "results") Monetization.showBanner(); else Monetization.hideBanner(); }
  function toast(msg, ms = 2000) { const el = $("toast"); el.textContent = msg; el.classList.remove("hidden"); clearTimeout(el._t); el._t = setTimeout(() => el.classList.add("hidden"), ms); }
  const myName = () => (Storage.name || "").trim() || (Lang.current() === "cs" ? "Hráč" : "Player");
  const me = () => ({ id: Net.myId, name: myName() });
  const nameOf = (id) => (lobby.players.find(p => p.id === id) || {}).name || "?";
  const colorOf = (id) => COLORS[Math.max(0, lobby.players.findIndex(p => p.id === id)) % COLORS.length];
  const mulberry = (a) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  // ---------- menu / lobby
  function refreshMenu() { $("name-input").value = Storage.name; $("btn-sound").textContent = Lang("sound") + ": " + Lang(Storage.sound ? "on" : "off"); $("btn-lang").textContent = Lang("lang"); }
  $("name-input").addEventListener("input", (e) => Storage.setName(e.target.value.slice(0, 12)));
  $("btn-sound").onclick = () => { Storage.setSound(!Storage.sound); Audio2.ui(); refreshMenu(); };
  $("btn-lang").onclick = () => { Lang.toggle(); refreshMenu(); renderLobby(); };
  $("btn-create").onclick = () => { Audio2.unlock(); role = "host"; const code = Net.makeCode(); const kind = Net.open(code, true); lobby = { code, hostId: Net.myId, players: [me()], speed: "normal" }; openLobby(kind); syncLobby(); };
  let joinTimeout = null;
  $("btn-join").onclick = () => join($("code-input").value.trim().toUpperCase());
  $("code-input").addEventListener("keydown", (e) => { if (e.key === "Enter") $("btn-join").click(); });
  function join(code) { if (code.length !== 4) return; Audio2.unlock(); role = "client"; const kind = Net.open(code, false); lobby = { code, hostId: null, players: [], speed: "normal" }; openLobby(kind); $("lobby-count").textContent = Lang("connecting"); Net.send("hello", me()); clearTimeout(joinTimeout); joinTimeout = setTimeout(() => { if (role === "client" && !lobby.hostId) { leaveToMenu(); toast(Lang("notFound"), 3000); } }, kind === "online" ? 6000 : 2500); }
  function syncLobby() { if (role === "host") Net.send("lobby", { code: lobby.code, hostId: lobby.hostId, players: lobby.players, speed: lobby.speed, phase }); renderLobby(); }
  Net.on("hello", (p, from) => { if (role !== "host") return; if (lobby.players.find(x => x.id === from)) { syncLobby(); return; } if (lobby.players.length >= T.maxPlayers || phase !== "lobby") { Net.send("full", {}, from); return; } lobby.players.push({ id: from, name: (p.name || "?").slice(0, 12) }); toast(p.name + " →"); syncLobby(); });
  Net.on("full", () => { if (role === "client" && !lobby.hostId) { leaveToMenu(); toast(Lang("roomFull"), 3000); } });
  Net.on("lobby", (p) => { if (role !== "client") return; lobby = { code: p.code, hostId: p.hostId, players: p.players, speed: p.speed }; clearTimeout(joinTimeout); if (phase === "lobby" || (phase === "results" && p.phase === "lobby")) { if (phase === "results") openLobby(Net.kind); renderLobby(); } });
  Net.on("leave", ({ id }) => { if (role === "host") { if (lobby.players.some(p => p.id === id)) { lobby.players = lobby.players.filter(p => p.id !== id); syncLobby(); if (game) checkAll(); } } else if (role === "client" && id === lobby.hostId) { leaveToMenu(); toast(Lang("hostLeft"), 3000); } });
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
  function leaveToMenu() { clearInterval(timerTick); clearInterval(againTick); Net.close(); role = null; game = null; cur = null; phase = "menu"; refreshMenu(); show("menu"); }

  // ---------- hostitel: kola
  $("btn-start").onclick = () => { if (role !== "host" || lobby.players.length < 2) { toast(Lang("needTwo")); return; } startGame(); };
  function startGame() { const n = +Lang.speed(lobby.speed); game = { round: 0, rounds: n, results: {}, totals: Object.fromEntries(lobby.players.map(p => [p.id, 0])), used: [] }; totals = game.totals; phase = "game"; Net.send("lobby", { code: lobby.code, hostId: lobby.hostId, players: lobby.players, speed: lobby.speed, phase }); nextRound(); }
  function nextRound() {
    game.round++; game.results = {}; if (game.round > game.rounds) return endGame();
    let g; do { g = GAMES[Math.floor(Math.random() * GAMES.length)]; } while (game.used.slice(-2).includes(g)); game.used.push(g);
    const msg = { game: g, seed: Math.floor(Math.random() * 1e9), round: game.round, rounds: game.rounds, totals: game.totals }; Net.send("round", msg); receiveRound(msg);
    clearTimeout(game.timeout); game.timeout = setTimeout(() => finishRound(), 16000);
  }
  Net.on("result", (p, from) => { if (role !== "host" || !game || p.round !== game.round) return; game.results[from] = p.value; checkAll(); });
  function submitResult(value) { if (!cur || cur.sent) return; cur.sent = true; if (role === "host") { game.results[Net.myId] = value; checkAll(); } else Net.send("result", { round: cur.round, value }, lobby.hostId); }
  function checkAll() { if (game && lobby.players.every(p => game.results[p.id] !== undefined)) setTimeout(() => finishRound(), 600); }
  function finishRound() {
    if (!game || game.done === game.round) return; game.done = game.round; clearTimeout(game.timeout);
    // pořadí podle typu hry
    const g = game.used[game.used.length - 1];
    const rows = lobby.players.map(p => ({ id: p.id, v: game.results[p.id] }));
    const better = (a, b) => { const A = a.v, B = b.v; const inv = (x) => x === undefined || x === null || x < 0; if (inv(A) && inv(B)) return 0; if (inv(A)) return 1; if (inv(B)) return -1; return (g === "race") ? B - A : A - B; };   // menší lepší (čas/odchylka), u race větší
    rows.sort(better);
    const gains = [3, 2, 1]; rows.forEach((r, i) => { const inv = r.v === undefined || r.v === null || r.v < 0; r.gain = inv ? 0 : (gains[i] || 0); game.totals[r.id] += r.gain; });
    const msg = { round: game.round, game: g, rows, totals: game.totals }; Net.send("score", msg); showScore(msg);
    setTimeout(() => nextRound(), 3500);
  }
  function endGame() { const rows = lobby.players.map(p => ({ id: p.id, total: game.totals[p.id] })).sort((a, b) => b.total - a.total); Net.send("end", { rows }); showResults(rows); }

  // ---------- kolo u mě
  Net.on("round", (m) => { if (role === "client") receiveRound(m); });
  Net.on("score", (m) => { if (role === "client") showScore(m); });
  Net.on("end", (m) => { if (role === "client") showResults(m.rows); });
  function receiveRound(m) {
    cur = { game: m.game, seed: m.seed, round: m.round, rounds: m.rounds, sent: false, t0: performance.now() }; totals = m.totals || totals; phase = "game"; show("game");
    $("g-step").textContent = Lang("round", m.round, m.rounds); $("g-title").textContent = Lang.g(m.game); $("g-hint").textContent = Lang.g(m.game + "Hint"); $("g-score").classList.add("hidden"); $("g-area").classList.remove("hidden");
    const area = $("g-area"); area.innerHTML = ""; clearInterval(timerTick); $("g-timer").textContent = "";
    const rand = mulberry(m.seed); Audio2.whistle();
    if (m.game === "reflex") reflex(area, rand); else if (m.game === "race") race(area); else if (m.game === "math") math(area, rand); else if (m.game === "color") colorGame(area, rand); else if (m.game === "hold") hold(area); else if (m.game === "count") count(area, rand);
  }
  const stamp = () => Math.round(performance.now() - cur.t0);
  function reflex(area, rand) {
    const b = document.createElement("button"); b.className = "bigbtn red"; b.textContent = Lang.g("wait"); area.appendChild(b);
    const delay = 1500 + rand() * 3500; let go = 0;
    const t = setTimeout(() => { if (cur.sent) return; go = performance.now(); b.className = "bigbtn green"; b.textContent = Lang.g("tap"); Audio2.go(); }, delay);
    b.onpointerdown = () => { if (cur.sent) return; if (!go) { clearTimeout(t); b.className = "bigbtn gray"; b.textContent = Lang.g("early"); Audio2.bump(); submitResult(-1); return; } const ms = Math.round(performance.now() - go); b.className = "bigbtn amber"; b.textContent = Lang.g("ms", ms); Audio2.pickup(); submitResult(ms); };
  }
  function race(area) {
    let n = 0, left = 5; const b = document.createElement("button"); b.className = "bigbtn green"; b.textContent = "0"; area.appendChild(b); $("g-timer").textContent = left;
    b.onpointerdown = (e) => { e.preventDefault(); if (cur.sent || left <= 0) return; n++; b.textContent = n; if (n % 5 === 0) Audio2.tick(); };
    timerTick = setInterval(() => { left--; $("g-timer").textContent = left; if (left <= 0) { clearInterval(timerTick); b.className = "bigbtn amber"; b.textContent = Lang.g("taps", n); submitResult(n); } }, 1000);
  }
  function quiz(area, question, options, correct, big = false) {
    const q = document.createElement("div"); q.className = "q"; q.textContent = question; area.appendChild(q);
    const o = document.createElement("div"); o.className = "opts"; area.appendChild(o);
    options.forEach((v, i) => { const b = document.createElement("button"); b.textContent = v; b.onclick = () => { if (cur.sent) return; if (i === correct) { b.classList.add("active"); Audio2.pickup(); submitResult(stamp()); } else { b.disabled = true; b.textContent = Lang.g("wrong"); Audio2.bump(); submitResult(-1); } }; o.appendChild(b); });
  }
  function math(area, rand) { const a = 2 + Math.floor(rand() * 12), b = 2 + Math.floor(rand() * 12), op = rand() < 0.5 ? "+" : rand() < 0.5 ? "−" : "×"; const ans = op === "+" ? a + b : op === "−" ? a - b : a * b; const opts = new Set([ans]); while (opts.size < 4) opts.add(ans + Math.floor(rand() * 11) - 5); const arr = [...opts].sort(() => rand() - 0.5); quiz(area, `${a} ${op} ${b} = ?`, arr, arr.indexOf(ans)); }
  function colorGame(area, rand) {
    const names = Lang.current() === "cs" ? ["ČERVENÁ", "ZELENÁ", "MODRÁ", "ŽLUTÁ"] : ["RED", "GREEN", "BLUE", "YELLOW"], cols = ["#FF5E7E", "#4FD37A", "#6FC3FF", "#FFCF5A"];
    const target = Math.floor(rand() * 4); const q = document.createElement("div"); q.className = "q"; q.textContent = names[target]; q.style.color = cols[Math.floor(rand() * 4)]; area.appendChild(q);
    const o = document.createElement("div"); o.className = "opts"; area.appendChild(o); const order = [0, 1, 2, 3].sort(() => rand() - 0.5);
    order.forEach(k => { const b = document.createElement("button"); const textIdx = Math.floor(rand() * 4); b.textContent = names[textIdx]; b.style.color = cols[k]; b.onclick = () => { if (cur.sent) return; if (k === target) { b.classList.add("active"); Audio2.pickup(); submitResult(stamp()); } else { b.disabled = true; Audio2.bump(); submitResult(-1); } }; o.appendChild(b); });
  }
  function hold(area) { const b = document.createElement("button"); b.className = "bigbtn gray"; b.textContent = "0.00"; area.appendChild(b); let t0 = 0, iv = null; b.onpointerdown = (e) => { e.preventDefault(); if (cur.sent || t0) return; t0 = performance.now(); b.className = "bigbtn green"; iv = setInterval(() => { const s = (performance.now() - t0) / 1000; b.textContent = s < 2 ? s.toFixed(2) : "?.??"; }, 50); }; const rel = () => { if (!t0 || cur.sent) return; clearInterval(iv); const s = (performance.now() - t0) / 1000; const off = Math.abs(s - 5); b.className = "bigbtn amber"; b.textContent = s.toFixed(2) + " s"; Audio2.pickup(); submitResult(Math.round(off * 1000)); }; b.onpointerup = rel; b.onpointerleave = rel; }
  function count(area, rand) { const n = 6 + Math.floor(rand() * 14); const box = document.createElement("div"); box.className = "dots"; for (let i = 0; i < n; i++) { const d = document.createElement("i"); d.style.left = (5 + rand() * 88) + "%"; d.style.top = (5 + rand() * 88) + "%"; d.style.background = COLORS[Math.floor(rand() * COLORS.length)]; box.appendChild(d); } area.appendChild(box); const opts = new Set([n]); while (opts.size < 4) opts.add(Math.max(1, n + Math.floor(rand() * 7) - 3)); const arr = [...opts].sort(() => rand() - 0.5); const o = document.createElement("div"); o.className = "opts"; area.appendChild(o); arr.forEach(v => { const b = document.createElement("button"); b.textContent = v; b.onclick = () => { if (cur.sent) return; if (v === n) { b.classList.add("active"); Audio2.pickup(); submitResult(stamp()); } else { b.disabled = true; Audio2.bump(); submitResult(-1); } }; o.appendChild(b); }); }

  function showScore(m) {
    clearInterval(timerTick); totals = m.totals; $("g-area").classList.add("hidden"); const sc = $("g-score"); sc.classList.remove("hidden");
    const fmt = (v) => v === undefined || v === null || v < 0 ? "✕" : m.game === "race" ? Lang.g("taps", v) : m.game === "hold" ? Lang.g("holdOff", (v / 1000).toFixed(2)) : Lang.g("ms", v);
    sc.innerHTML = m.rows.map(r => `<div class="res-row${r.id === Net.myId ? " me" : ""}"><span class="dot" style="background:${colorOf(r.id)}"></span><span class="nm"></span><span>${fmt(r.v)}</span><span class="gain">${r.gain ? "+" + r.gain : ""}</span><b>${totals[r.id] || 0}</b></div>`).join("");
    [...sc.querySelectorAll(".nm")].forEach((el, i) => el.textContent = nameOf(m.rows[i].id)); if (m.rows[0] && m.rows[0].id === Net.myId && m.rows[0].gain) Audio2.win();
  }
  function showResults(rows) { phase = "results"; show("results"); const box = $("results"); let list = box.querySelector(".album"); if (!list) { list = document.createElement("div"); list.className = "album"; box.insertBefore(list, $("btn-again")); } list.innerHTML = rows.map((r, i) => `<div class="res-row${r.id === Net.myId ? " me" : ""}"><span>${i + 1}.</span><span class="dot" style="background:${colorOf(r.id)}"></span><span class="nm"></span><b>${Lang("pts", r.total)}</b></div>`).join(""); [...list.querySelectorAll(".nm")].forEach((el, i) => el.textContent = nameOf(rows[i].id)); Storage.addGame(); if (rows[0] && rows[0].id === Net.myId) Audio2.win(); else Audio2.lose(); startAgain(); }

  // ---------- hrát znovu
  let againVotes = new Set(), againLeft = 0, againTick = null;
  function startAgain() { againVotes = new Set(); againLeft = 20; clearInterval(againTick); updateAgain(); againTick = setInterval(() => { againLeft--; updateAgain(); if (againLeft <= 0) { clearInterval(againTick); if (role === "host") goLobbyAgain(); } }, 1000); }
  function updateAgain() { $("btn-again").textContent = (againVotes.has(Net.myId) ? Lang("waitingOthers") : Lang("playAgain")) + ` ${againVotes.size}/${lobby.players.length} · ${againLeft}s`; }
  $("btn-again").onclick = () => { if (againVotes.has(Net.myId)) return; againVotes.add(Net.myId); if (role === "client") Net.send("again", {}, lobby.hostId); else { Net.send("againVotes", [...againVotes]); checkAgain(); } updateAgain(); };
  Net.on("again", (p, from) => { if (role !== "host" || phase !== "results") return; againVotes.add(from); Net.send("againVotes", [...againVotes]); updateAgain(); checkAgain(); });
  Net.on("againVotes", (v) => { if (role === "client" && phase === "results") { againVotes = new Set(v); updateAgain(); } });
  function checkAgain() { if (lobby.players.every(p => againVotes.has(p.id))) { clearInterval(againTick); goLobbyAgain(); } }
  function goLobbyAgain() { game = null; cur = null; openLobby(Net.kind); syncLobby(); }
  $("btn-res-menu").onclick = () => leaveToMenu();

  Lang.apply(); refreshMenu(); show("menu"); Monetization.init();
  const roomParam = new URLSearchParams(location.search).get("room");
  if (roomParam) { history.replaceState(null, "", location.pathname); $("code-input").value = roomParam.toUpperCase(); setTimeout(() => join(roomParam.toUpperCase()), 300); }
})();
