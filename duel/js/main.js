(() => {
  const { $, get, set, L, beep } = Arc;
  const { C4, GM, BS } = window.DuelRules;
  Arc.texts({
    en: { pickGame: "Game", g_c4: "Connect 4", g_gm: "Five in a row", g_bs: "Battleships", vsFriend: "With a friend", create: "Create room", join: "Join", vsBot: "Against the bot", easy: "Easy", mid: "Medium", hard: "Hard", roomCode: "Room code", copyLink: "Copy link", share: "Share", start: "Start", leave: "Leave", copied: "Link copied",
      waitingFriend: "Send the code to a friend. Waiting…", joined: (n) => `${n} joined!`, connecting: "Connecting…", notFound: "Room not found", full: "Room is full", waitHost: (n) => `Connected to ${n}. Waiting for them to start…`, oppLeft: "Your opponent left", online: "online", local: "local test (same browser)",
      yourTurn: "Your turn", theirTurn: (n) => `${n} is thinking…`, youWin: "You win! 🎉", youLose: (n) => `${n} wins`, draw: "Draw", nextRound: "Next round", waitNext: "Waiting for the next round…", rematch: "Play again", menu: "Menu", bot: "Bot",
      shuffle: "Shuffle ships", ready: "Ready", waitReady: (n) => `Waiting for ${n} to place ships…`, placeShips: "Place your fleet – shuffle until you like it", yourSea: "Your sea", enemySea: "Enemy sea", hit: "Hit!", miss: "Miss", sunk: "Sunk!", record: (w, l) => `vs bot: ${w} wins · ${l} losses`, shareText: (c) => `Duel me on Arcade! Code ${c} ` },
    cs: { pickGame: "Hra", g_c4: "Čtyři v řadě", g_gm: "Piškvorky", g_bs: "Lodě", vsFriend: "S kamarádem", create: "Založit místnost", join: "Připojit", vsBot: "Proti botovi", easy: "Lehký", mid: "Střední", hard: "Těžký", roomCode: "Kód místnosti", copyLink: "Kopírovat odkaz", share: "Sdílet", start: "Start", leave: "Odejít", copied: "Odkaz zkopírován",
      waitingFriend: "Pošli kód kamarádovi. Čekám…", joined: (n) => `${n} se připojil!`, connecting: "Připojuju…", notFound: "Místnost nenalezena", full: "Místnost je plná", waitHost: (n) => `Připojeno k ${n}. Čeká se, až odstartuje…`, oppLeft: "Soupeř odešel", online: "online", local: "lokální test (stejný prohlížeč)",
      yourTurn: "Jsi na tahu", theirTurn: (n) => `${n} přemýšlí…`, youWin: "Vyhrál jsi! 🎉", youLose: (n) => `Vyhrál ${n}`, draw: "Remíza", nextRound: "Další kolo", waitNext: "Čeká se na další kolo…", rematch: "Hrát znovu", menu: "Menu", bot: "Bot",
      shuffle: "Zamíchat lodě", ready: "Připraven", waitReady: (n) => `Čeká se, až ${n} rozmístí lodě…`, placeShips: "Rozmísti flotilu – míchej, dokud se ti nelíbí", yourSea: "Tvoje moře", enemySea: "Moře soupeře", hit: "Zásah!", miss: "Voda", sunk: "Potopena!", record: (w, l) => `proti botovi: ${w} výher · ${l} proher`, shareText: (c) => `Dej si se mnou Duel na Arcade! Kód ${c} ` },
  });
  const COL = { c4: ["#FF5E7E", "#FFCF5A"], gm: ["#1B1030", "#F4F0E8"], bs: ["#FF5E7E", "#5EE1D0"] };
  let kind = get("du_kind", "c4"), mode = null, level = "mid", names = ["", ""], score = [0, 0], round = 0, me = 0, turn = 0, over = false, board = null, last = -1, winCells = null, guest = null, joinTimer = null;
  let bs = null;   // { mine: {occ, ships}, myShots: know[100] (moje střely do soupeře), theirShots: 0/1 (střely do mě), readyMe, readyThem, botFleet, botKnow }
  const myName = () => (($("name").value || "").trim() || get("arcade_name_raw", "") || (Arc.lang === "cs" ? "Hráč" : "Player")).slice(0, 12);
  try { const an = localStorage.getItem("arcade_name"); if (an) $("name").value = an.slice(0, 12); else $("name").value = get("du_name", ""); } catch {}
  $("name").addEventListener("input", () => set("du_name", $("name").value));
  function toast(t, ms = 2200) { const el = $("toast"); el.textContent = t; el.classList.remove("hidden"); clearTimeout(el._t); el._t = setTimeout(() => el.classList.add("hidden"), ms); }
  function show(id) { for (const s of ["menu", "lobby", "game"]) $(s).classList.toggle("hidden", s !== id); $("btn-hub").classList.toggle("hidden", id !== "menu"); document.querySelector(".foot").classList.toggle("hidden", id === "game"); }
  const rec = get("du_rec", {}); function renderRecord() { const r = rec[kind] || { w: 0, l: 0 }; $("record").textContent = L("record", r.w, r.l); }
  function pickKind(k) { kind = k; set("du_kind", k); document.querySelectorAll("#games button").forEach(b => b.classList.toggle("active", b.dataset.g === k)); renderRecord(); }
  document.querySelectorAll("#games button").forEach(b => b.onclick = () => { pickKind(b.dataset.g); beep(500, 0.04); });

  // ---------- proti botovi
  document.querySelectorAll("#bot-seg button").forEach(b => b.onclick = () => { mode = "bot"; level = b.dataset.d; names = [myName(), L("bot") + " · " + L(level)]; score = [0, 0]; round = 0; me = 0; startRound(round % 2); });

  // ---------- online
  $("btn-create").onclick = () => { mode = "host"; me = 0; guest = null; names = [myName(), ""]; score = [0, 0]; round = 0; const code = Net.makeCode(); const k = Net.open(code, true); openLobby(code, k); $("lobby-status").textContent = L("waitingFriend"); };
  $("btn-join").onclick = () => joinRoom(($("code").value || "").trim().toUpperCase());
  $("code").addEventListener("keydown", (e) => { if (e.key === "Enter") $("btn-join").click(); });
  function joinRoom(code) { if (code.length !== 4) return; mode = "guest"; me = 1; const k = Net.open(code, false); openLobby(code, k); $("lobby-status").textContent = L("connecting"); Net.send("hello", { name: myName() }); clearTimeout(joinTimer); joinTimer = setTimeout(() => { if (mode === "guest" && !names[0]) { leave(); toast(L("notFound")); } }, k === "online" ? 7000 : 2500); }
  function openLobby(code, k) { show("lobby"); $("lobby-code").textContent = code; $("lobby-kind").textContent = k === "online" ? L("online") : L("local"); $("btn-start").classList.add("hidden"); }
  Net.on("hello", (p, from) => { if (mode !== "host") return; if (guest && guest.id !== from) { Net.send("full", {}, from); return; } guest = { id: from, name: (p.name || "?").slice(0, 12) }; names[1] = guest.name; Net.send("welcome", { name: names[0], kind }, from); $("lobby-status").textContent = L("joined", guest.name); $("btn-start").classList.remove("hidden"); beep(700, 0.1); });
  Net.on("welcome", (p) => { if (mode !== "guest") return; clearTimeout(joinTimer); names = [p.name, myName()]; pickKind(p.kind); $("lobby-status").textContent = L("waitHost", p.name); beep(700, 0.1); });
  Net.on("full", () => { if (mode === "guest") { leave(); toast(L("full")); } });
  Net.on("leave", ({ id }) => { if ((mode === "host" && guest && id === guest.id) || (mode === "guest")) { toast(L("oppLeft"), 3000); leave(); } });
  $("btn-start").onclick = () => { if (mode !== "host" || !guest) return; hostStart(); };
  function hostStart() { const first = round % 2; Net.send("start", { kind, first, round, names, score }); startRound(first); }
  Net.on("start", (p) => { if (mode !== "guest") return; kind = p.kind; round = p.round; names = p.names; score = p.score; startRound(p.first); });
  Net.on("move", (p, from) => { if (mode === "bot" || over) return; if (turn === me) return; applyMove(p.i, 1 - me); });
  $("btn-copy").onclick = async () => { try { await navigator.clipboard.writeText(Net.roomLink($("lobby-code").textContent)); toast(L("copied")); } catch { toast(Net.roomLink($("lobby-code").textContent), 4000); } };
  $("btn-share").onclick = async () => { const url = Net.roomLink($("lobby-code").textContent); try { if (navigator.share) await navigator.share({ text: L("shareText", $("lobby-code").textContent) + url }); else { await navigator.clipboard.writeText(url); toast(L("copied")); } } catch {} };
  function leave() { Net.close(); mode = null; guest = null; clearTimeout(joinTimer); show("menu"); renderRecord(); }
  $("btn-leave").onclick = leave; $("btn-quit").onclick = leave;

  // ---------- kolo
  function startRound(first) {
    over = false; winCells = null; last = -1; turn = first; show("game");
    $("g-title").textContent = L("g_" + kind);
    if (kind === "c4") board = new Array(42).fill(0);
    else if (kind === "gm") board = new Array(225).fill(0);
    else { const mine = BS.place(); bs = { mine, myShots: new Array(100).fill(0), theirShots: new Array(100).fill(0), readyMe: false, readyThem: mode === "bot", enemyLeft: BS.FLEET.slice() }; if (mode === "bot") { bs.botFleet = BS.place(); bs.botKnow = new Array(100).fill(0); } }
    render(); beep(600, 0.08); maybeBot();
  }
  function renderScore() { for (const s of [0, 1]) { const el = $("p" + s); el.querySelector(".dot").style.background = COL[kind][s]; if (kind === "gm" && s === 0) el.querySelector(".dot").style.outline = "2px solid #fff"; el.querySelector(".nm").textContent = names[s] + (s === me ? " (" + (Arc.lang === "cs" ? "ty" : "you") + ")" : ""); el.querySelector("b").textContent = score[s]; el.classList.toggle("turn", !over && turn === s && (kind !== "bs" || (bs && bs.readyMe && bs.readyThem))); } }
  function status(t) { $("status").textContent = t; }
  function render() {
    renderScore(); const bd = $("board"), acts = $("actions"); acts.innerHTML = "";
    if (kind === "c4") {
      if (!bd.firstChild || bd.firstChild.className !== "c4") { bd.innerHTML = `<div class="c4">${Array.from({ length: 42 }, (_, i) => `<div class="h" data-i="${i}"></div>`).join("")}</div>`; bd.querySelectorAll(".h").forEach(h => h.onclick = () => { if (canPlay()) { const col = +h.dataset.i % 7; if (C4.drop(board, col) >= 0) play(col); } }); }
      bd.querySelectorAll(".h").forEach((h, i) => { const v = board[i]; const has = h.firstChild; if (v && !has) { const p = document.createElement("i"); p.style.background = COL.c4[v - 1]; if (i !== last) p.style.animation = "none"; h.appendChild(p); } else if (!v && has) h.innerHTML = ""; h.classList.toggle("win", !!(winCells && winCells.includes(i))); });
    } else if (kind === "gm") {
      if (!bd.firstChild || bd.firstChild.className !== "gm") { bd.innerHTML = `<div class="gm">${Array.from({ length: 225 }, (_, i) => `<div class="x" data-i="${i}"></div>`).join("")}</div>`; bd.querySelectorAll(".x").forEach(x => x.onclick = () => { const i = +x.dataset.i; if (canPlay() && !board[i]) play(i); }); }
      bd.querySelectorAll(".x").forEach((x, i) => { const v = board[i]; if (v && !x.firstChild) { const p = document.createElement("i"); p.style.background = COL.gm[v - 1]; x.appendChild(p); } else if (!v && x.firstChild) x.innerHTML = ""; x.classList.toggle("last", i === last); x.classList.toggle("win", !!(winCells && winCells.includes(i))); });
    } else renderBS();
    if (!over) { if (kind !== "bs" || (bs.readyMe && bs.readyThem)) status(turn === me ? L("yourTurn") : L("theirTurn", names[1 - me])); }
    else { const w = over.winner; status(w < 0 ? L("draw") : w === me ? L("youWin") : L("youLose", names[w]));
      if (mode === "bot") { acts.innerHTML = `<button class="big" id="a-next">${L("rematch")}</button><button id="a-menu">${L("menu")}</button>`; $("a-next").onclick = () => { round++; startRound(round % 2); }; $("a-menu").onclick = leave; }
      else if (mode === "host") { acts.innerHTML = `<button class="big" id="a-next">${L("nextRound")}</button>`; $("a-next").onclick = () => { round++; hostStart(); }; }
      else acts.innerHTML = `<span class="dim">${L("waitNext")}</span>`; }
  }
  const canPlay = () => !over && turn === me && (mode !== "bot" || true);
  function play(i) { if (!canPlay()) return; if (mode !== "bot") Net.send("move", { i }); applyMove(i, me); }
  function applyMove(i, who) {
    if (over || turn !== who) return;
    if (kind === "c4") { const idx = C4.drop(board, i); if (idx < 0) return; board[idx] = who + 1; last = idx; beep(300 + (5 - ((idx / 7) | 0)) * 40, 0.08, "triangle", 0.08); const w = C4.win(board, idx); if (w) return end(who, w); if (C4.full(board)) return end(-1); }
    else if (kind === "gm") { if (board[i]) return; board[i] = who + 1; last = i; beep(who === me ? 600 : 480, 0.05, "sine", 0.06); const w = GM.win(board, i); if (w) return end(who, w); if (GM.full(board)) return end(-1); }
    turn = 1 - who; render(); maybeBot();
  }
  function end(winner, cells) {
    over = { winner }; winCells = cells || null; if (winner >= 0) score[winner]++;
    if (winner === me) { beep(880, 0.2); setTimeout(() => beep(1320, 0.3), 120); } else if (winner >= 0) beep(200, 0.35, "sawtooth", 0.1);
    if (mode === "bot") { const r = rec[kind] || (rec[kind] = { w: 0, l: 0 }); if (winner === me) r.w++; else if (winner >= 0) r.l++; set("du_rec", rec); }
    if (window.Meta) { if (winner === me && (mode !== "bot" || level !== "easy")) Meta.win("duel"); else Meta.finish("duel"); }
    render();
  }
  function maybeBot() {
    if (mode !== "bot" || over || turn === me) return;
    if (kind === "bs" && !(bs.readyMe && bs.readyThem)) return;
    setTimeout(() => {
      if (over || turn === me || mode !== "bot") return;
      if (kind === "c4") applyMove(C4.bot(board, 2, level), 1);
      else if (kind === "gm") applyMove(GM.bot(board, 2, level), 1);
      else { const rem = bs.mine.ships.filter(s => s.hits < s.len).map(s => s.len); const i = BS.bot(bs.botKnow, rem, level); const res = receiveShot(i); bs.botKnow[i] = res.hit ? (res.sunk ? 3 : 2) : 1; if (res.sunk) res.sunk.forEach(c => bs.botKnow[c] = 3); afterShot(1, res); }
    }, kind === "bs" ? 650 : 420 + Math.random() * 380);
  }

  // ---------- Lodě
  function renderBS() {
    const bd = $("board"), acts = $("actions"), ready = bs.readyMe && bs.readyThem;
    const grid = (cls, cells) => `<div class="bs-grid ${cls}">${cells.join("")}</div>`;
    const mineCells = Array.from({ length: 100 }, (_, i) => { const sid = bs.mine.occ[i], shot = bs.theirShots[i]; let c = "s"; if (sid) c += " ship"; if (shot) c += sid ? (bs.mine.ships[sid - 1].hits >= bs.mine.ships[sid - 1].len ? " hit sunk" : " hit") : " miss"; return `<div class="${c}"></div>`; });
    if (!ready) {
      bd.innerHTML = `<div class="bs"><div class="lbl">${L("yourSea")}</div>${grid("big", mineCells)}</div>`; status(bs.readyMe ? L("waitReady", names[1 - me]) : L("placeShips"));
      if (!bs.readyMe) { acts.innerHTML = `<button id="a-shuf">${L("shuffle")}</button><button class="big" id="a-ready">${L("ready")}</button>`; $("a-shuf").onclick = () => { bs.mine = BS.place(); beep(500, 0.04); render(); }; $("a-ready").onclick = () => { bs.readyMe = true; if (mode !== "bot") Net.send("ready", {}); beep(700, 0.08); render(); maybeBot(); }; }
      return;
    }
    const enemyCells = Array.from({ length: 100 }, (_, i) => { const k = bs.myShots[i]; return `<div class="s${k === 1 ? " miss" : k === 2 ? " hit" : k === 3 ? " hit sunk" : ""}" data-i="${i}"></div>`; });
    bd.innerHTML = `<div class="bs"><div class="lbl">${L("enemySea")}</div>${grid("big", enemyCells)}<div class="lbl">${L("yourSea")}</div>${grid("small", mineCells)}</div>`;
    bd.querySelectorAll(".bs-grid.big .s").forEach(s => s.onclick = () => { const i = +s.dataset.i; if (!over && turn === me && !bs.myShots[i] && !bs.pending) fire(i); });
  }
  Net.on("ready", () => { if (!bs) return; bs.readyThem = true; render(); });
  function fire(i) {
    bs.pending = true;
    if (mode === "bot") { const sid = bs.botFleet.occ[i]; let res = { i, hit: !!sid, sunk: null, all: false }; if (sid) { const s = bs.botFleet.ships[sid - 1]; s.hits++; if (s.hits === s.len) { res.sunk = s.cells; res.len = s.len; } res.all = bs.botFleet.ships.every(x => x.hits >= x.len); } onResult(res); }
    else Net.send("shot", { i });
  }
  Net.on("shot", (p) => { if (!bs || over || turn === me) return; const res = receiveShot(p.i); Net.send("res", res); afterShot(1 - me, res); });
  Net.on("res", (res) => { if (!bs || !bs.pending) return; onResult(res); });
  function receiveShot(i) { bs.theirShots[i] = 1; const sid = bs.mine.occ[i]; const res = { i, hit: !!sid, sunk: null, all: false }; if (sid) { const s = bs.mine.ships[sid - 1]; s.hits++; if (s.hits === s.len) { res.sunk = s.cells; res.len = s.len; } res.all = bs.mine.ships.every(x => x.hits >= x.len); } return res; }
  function onResult(res) { bs.pending = false; bs.myShots[res.i] = res.hit ? 2 : 1; if (res.sunk) { res.sunk.forEach(c => bs.myShots[c] = 3); const k = bs.enemyLeft.indexOf(res.len); if (k >= 0) bs.enemyLeft.splice(k, 1); } afterShot(me, res); }
  function afterShot(shooter, res) {
    beep(res.hit ? (res.sunk ? 220 : 520) : 300, res.sunk ? 0.3 : 0.08, res.hit ? "square" : "sine", 0.07);
    if (shooter === me) toast(res.sunk ? L("sunk") : res.hit ? L("hit") : L("miss"), 900);
    if (res.all) return end(shooter);
    turn = 1 - shooter; render(); maybeBot();
  }

  // ---------- start
  Arc.wire(); Arc.applyLang(); pickKind(kind); show("menu");
  const q = new URLSearchParams(location.search);
  if (q.get("room")) { const c = q.get("room").toUpperCase(); history.replaceState(null, "", location.pathname); $("code").value = c; setTimeout(() => joinRoom(c), 300); }
  else if (q.get("create")) { history.replaceState(null, "", location.pathname); setTimeout(() => $("btn-create").click(), 150); }
  window.__duel = { get board() { return board; }, get turn() { return turn; }, get over() { return over; }, get bs() { return bs; }, play, fire };
})();
