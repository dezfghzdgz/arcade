(() => {
  const $ = (id) => document.getElementById(id);
  const T = TW_CONFIG.tuning;
  const screens = ["menu", "hud", "lobby", "results", "shop", "missions"];
  const isTouch = matchMedia("(pointer: coarse)").matches;
  const MODES = Object.keys(Sim.MODES), LENGTHS = Object.keys(Sim.HEIGHTS);

  // ---------- stav
  let role = null;             // "solo" | "host" | "client"
  let world = null, cw = null, view = null;
  const defOpts = () => Object.assign({ target: 0, pu: "normal", bots: "mix" }, Storage.opts);
  const defHeight = () => Sim.HEIGHTS[Storage.lastSeconds] ? Storage.lastSeconds : "medium";
  let lobby = { code: "", hostId: null, players: [], mode: Storage.lastMode, seconds: defHeight(), opts: defOpts() };
  const TARGETS = {};
  let phase = "menu";
  let myResult = null, doubled = false, runStats = null, roundStart = 0;
  let hostTimer = null, clientTimer = null, snapAcc = 0, fullAcc = 0, inputAcc = 0, snapDirty = [], snapEvents = [], lastInputSent = "";
  const input = { dx: 0, dy: 0, jump: false, jumpHeld: false };
  const remote = new Map();

  function show(id) { screens.forEach(s => $(s).classList.toggle("hidden", s !== id)); if (id === "menu" || id === "results") Monetization.showBanner(); else Monetization.hideBanner(); }
  function toast(msg, ms = 1800) { const el = $("toast"); el.textContent = msg; el.classList.remove("hidden"); clearTimeout(el._t); el._t = setTimeout(() => el.classList.add("hidden"), ms); }
  const myName = () => (Storage.name || "").trim() || (Lang.current() === "cs" ? "Hráč" : "Player");
  const vibrate = (p) => { if (Storage.vibrate && navigator.vibrate) navigator.vibrate(p); };
  const me = () => ({ id: Net.myId, name: myName(), hat: Storage.hat, pattern: Storage.pattern, pref: Storage.color });

  // ---------- menu
  function refreshMenu() {
    $("menu-coins").textContent = Storage.coins;
    $("btn-sound").textContent = Lang("sound") + ": " + Lang(Storage.sound ? "on" : "off");
    $("btn-vibrate").textContent = Lang("vibrate") + ": " + Lang(Storage.vibrate ? "on" : "off");
    $("btn-lang").textContent = Lang("lang");
    const st = Storage.stats; $("menu-stats").textContent = st.games ? Lang("stats", st.games, st.wins, st.best) : "";
    $("name-input").value = Storage.name;
    $("missions-badge").textContent = Missions.left() || "✓";
    Render.preview($("me-preview"), Storage.hat, Storage.color >= 0 ? Sim.COLORS[Storage.color] : Sim.COLORS[0], Storage.pattern);
    const cr = $("color-row"); cr.innerHTML = "";
    const auto = document.createElement("button"); auto.className = "auto" + (Storage.color < 0 ? " active" : ""); auto.title = Lang("colorAuto"); auto.onclick = () => { Storage.setColor(-1); Audio2.ui(); refreshMenu(); }; cr.appendChild(auto);
    Sim.COLORS.forEach((c, i) => { const b = document.createElement("button"); b.style.background = c; b.className = Storage.color === i ? "active" : ""; b.onclick = () => { Storage.setColor(i); Audio2.ui(); refreshMenu(); }; cr.appendChild(b); });
    const loc = Lang.current() === "cs" ? "cs-CZ" : "en-US";
    $("lbl-coins_500").textContent = Lang("coins", (500).toLocaleString(loc)); $("lbl-coins_2000").textContent = Lang("coins", (2000).toLocaleString(loc));
    for (const k of Object.keys(TW_CONFIG.iap)) { const el = $("price-" + k), p = TW_CONFIG.iap[k]; if (el && p.price) el.textContent = p.price + (p.subscription ? Lang("perMonth") : ""); }
    const sub = document.querySelector('[data-iap="remove_ads"]'); const active = Storage.noAdsUntil > Date.now();
    sub.disabled = active; sub.querySelector("span").textContent = active ? Lang("subActive", new Date(Storage.noAdsUntil).toLocaleDateString()) : Lang("removeAds");
  }
  $("name-input").addEventListener("input", (e) => Storage.setName(e.target.value.slice(0, 12)));
  $("btn-sound").onclick = () => { Storage.setSound(!Storage.sound); Audio2.ui(); refreshMenu(); };
  $("btn-vibrate").onclick = () => { Storage.setVibrate(!Storage.vibrate); vibrate(15); Audio2.ui(); refreshMenu(); };
  $("btn-lang").onclick = () => { Lang.toggle(); Audio2.ui(); refreshMenu(); };
  $("btn-shop").onclick = () => openShop();
  $("btn-missions").onclick = () => openMissions();
  document.querySelectorAll("[data-back]").forEach(b => b.onclick = () => { Audio2.ui(); refreshMenu(); show("menu"); });

  // ---------- solo / host: založení
  const BOT_NAMES_ALL = {
    en: ["Max", "Zoe", "Leo", "Mia", "Rocky", "Kiki", "Sam", "Nova", "Rex", "Lily", "Ash", "Milo", "Jinx", "Pip", "Bolt", "Ruby"],
    cs: ["Bobek", "Zuzka", "Pepa", "Klára", "Rambo", "Kiki", "Tonda", "Máňa", "Rex", "Lili", "Bára", "Vašek"],
  };
  const BOT_NAMES = new Proxy([], { get: (_, k) => (BOT_NAMES_ALL[Lang.current()] || BOT_NAMES_ALL.en)[k] });
  const BOT_HATS = ["none", "cap", "bow", "sprout", "antenna", "beanie", "cat", "flower"];
  function fillBots() {
    const used = new Set(world.players.map(p => p.name)); let guard = 0;
    while (world.players.length < T.maxPlayers && guard++ < 40) { let n; do { n = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]; } while (used.has(n) && guard++ < 60); used.add(n); const b = Sim.addPlayer(world, { id: "bot-" + Math.random().toString(36).slice(2, 7), name: n, bot: true, hat: BOT_HATS[Math.floor(Math.random() * BOT_HATS.length)], pattern: Math.random() < 0.3 ? "dots" : "none" }); if (b) Sim.assignBot(b, lobby.opts.bots); }
  }
  $("btn-solo").onclick = () => { Audio2.unlock(); Audio2.ui(); role = "solo"; Net.close(); world = Sim.create(Date.now()); Sim.addPlayer(world, me()); lobby = { code: "", hostId: Net.myId, players: [], mode: Storage.lastMode, seconds: defHeight(), opts: defOpts() }; fillBots(); lobby.players = Sim.lobbyInfo(world); openLobby("solo"); };
  $("btn-create").onclick = () => {
    Audio2.unlock(); Audio2.ui(); role = "host";
    const code = Net.makeCode(); const kind = Net.open(code, true);
    world = Sim.create(Date.now()); Sim.addPlayer(world, me());
    lobby = { code, hostId: Net.myId, players: [], mode: Storage.lastMode, seconds: defHeight(), opts: defOpts() };
    syncLobby(); openLobby(kind);
  };
  function syncLobby() {
    lobby.players = Sim.lobbyInfo(world);
    if (role === "host") Net.send("lobby", { code: lobby.code, hostId: lobby.hostId, players: lobby.players, mode: lobby.mode, seconds: lobby.seconds, opts: lobby.opts, phase });
    renderLobby();
  }
  Net.on("hello", (p, from) => {
    if (role !== "host") return;
    if (world.players.find(x => x.id === from)) { syncLobby(); return; }
    if (world.players.length >= T.maxPlayers) { const bot = world.players.find(x => x.bot); if (bot) Sim.removePlayer(world, bot.id); }
    const pl = Sim.addPlayer(world, { id: from, name: (p.name || "?").slice(0, 12), hat: p.hat || "none", pattern: p.pattern || "none", pref: p.pref ?? -1 });
    if (!pl) { Net.send("full", {}, from); return; }
    toast(pl.name + " →"); syncLobby();
    if (phase === "game") sendFull(from);
  });
  Net.on("input", (p, from) => { if (role !== "host" || !world) return; const pl = world.players.find(x => x.id === from); if (!pl) return; pl.input.dx = p[0]; if (p[1]) pl.input.jump = true; pl.input.jumpHeld = !!p[2]; });
  Net.on("leave", ({ id }) => {
    if (role === "host") { if (world && world.players.find(x => x.id === id)) { Sim.removePlayer(world, id); if (phase === "game") { world.players.forEach(p => p.score = p.score); } syncLobby(); } }
    else if (role === "client" && id === lobby.hostId) { leaveToMenu(); toast(Lang("hostLeft"), 3000); }
  });
  $("btn-bots").onclick = () => { fillBots(); syncLobby(); Audio2.ui(); };
  $("btn-start").onclick = () => startRound();

  // ---------- lobby UI
  function openLobby(kind) {
    phase = "lobby"; show("lobby");
    $("code-box").classList.toggle("hidden", role === "solo");
    $("lobby-code").textContent = lobby.code;
    $("lobby-kind").textContent = role === "solo" ? "" : kind === "online" ? "online" : "local (dev)";
    $("lobby-host-actions").classList.toggle("hidden", role === "client");
    $("btn-bots").classList.toggle("hidden", role === "solo");
    $("lobby-wait").classList.toggle("hidden", role !== "client");
    renderLobby();
  }
  function renderLobby() {
    $("lobby-count").textContent = Lang("players", lobby.players.length, T.maxPlayers);
    const teams = Sim.MODES[lobby.mode].teams;
    $("lobby-list").innerHTML = lobby.players.map((p, i) => `<div class="lobby-p"><span class="dot" style="background:${teams ? Sim.TEAM_COLORS[i % 2] : Sim.COLORS[p.ci]}"></span><span></span><small>${p.id === Net.myId ? Lang("you") : p.id === lobby.hostId ? Lang("host") : p.bot ? Lang("bot") + (p.skill !== undefined ? " · " + Lang.tier(Sim.skillTier(p.skill)) : "") : ""}</small></div>`).join("");
    [...$("lobby-list").querySelectorAll(".lobby-p span:nth-child(2)")].forEach((el, i) => el.textContent = lobby.players[i].name);
    if (role !== "client") $("btn-start").disabled = lobby.players.length < 2;
    const canEdit = role !== "client";
    $("mode-btns").innerHTML = ""; $("len-btns").innerHTML = "";
    for (const m of MODES) { const b = document.createElement("button"); b.textContent = Lang.mode(m); b.className = m === lobby.mode ? "active" : ""; b.disabled = !canEdit; b.onclick = () => { lobby.mode = m; Storage.setLastMode(m); Audio2.ui(); syncLobby(); }; $("mode-btns").appendChild(b); }
    for (const s of LENGTHS) { const b = document.createElement("button"); b.textContent = Lang.height(s); b.className = s === lobby.seconds ? "active" : ""; b.disabled = !canEdit; b.onclick = () => { lobby.seconds = s; Storage.setLastSeconds(s); Audio2.ui(); syncLobby(); }; $("len-btns").appendChild(b); }
    $("mode-desc").textContent = Lang.modeDesc(lobby.mode);
    const setOpt = (k, v) => { lobby.opts[k] = v; Storage.setOpts(lobby.opts); Audio2.ui(); if (k === "bots" && world) { world.players.forEach(p => { if (p.bot) Sim.assignBot(p, v); }); } syncLobby(); };
    const seg = (id, items, cur, label, fn) => { const el = $(id); el.innerHTML = ""; for (const v of items) { const b = document.createElement("button"); b.textContent = label(v); b.className = v === cur ? "active" : ""; b.disabled = !canEdit; b.onclick = () => fn(v); el.appendChild(b); } };
    const tg = TARGETS[lobby.mode];
    $("target-row").classList.toggle("hidden", !tg);
    if (tg) { if (!tg.includes(lobby.opts.target)) lobby.opts.target = 0; seg("target-btns", tg, lobby.opts.target, (v) => v === 0 ? Lang("timeOnly") : lobby.mode === "koth" ? Lang("seconds", v) : Lang("pts", v), (v) => setOpt("target", v)); }
    $("pu-btns").parentElement.classList.add("hidden");
    seg("bots-btns", Object.keys(Sim.BOT_SKILL), lobby.opts.bots, (v) => Lang.botLv(v), (v) => setOpt("bots", v));
  }
  $("btn-copy").onclick = async () => { try { await navigator.clipboard.writeText(Net.roomLink(lobby.code)); toast(Lang("copied")); } catch { toast(Net.roomLink(lobby.code), 4000); } };
  $("btn-share-room").onclick = async () => { const url = Net.roomLink(lobby.code); try { if (navigator.share) await navigator.share({ text: Lang("shareRoom", lobby.code) + url }); else { await navigator.clipboard.writeText(url); toast(Lang("copied")); } } catch {} };
  $("btn-leave").onclick = () => leaveToMenu();
  function leaveToMenu() { hostLoopStop(); if (clientTimer) clientTimer.stop(); clientTimer = null; Net.close(); role = null; world = null; cw = null; view = null; phase = "menu"; refreshMenu(); show("menu"); }

  // ---------- kolo (solo/host)
  function startRound() {
    doubled = false; myResult = null; runStats = { jumps: 0, deaths: 0, floors: 0, finishes: 0 };
    Sim.resetRound(world, Date.now(), { mode: lobby.mode, height: lobby.seconds, bots: lobby.opts.bots });
    lobby.players = Sim.lobbyInfo(world);
    if (role === "host") Net.send("start", { seed: world.seed, mode: lobby.mode, seconds: lobby.seconds, opts: lobby.opts, players: lobby.players });
    phase = "game"; roundStart = performance.now();
    beginGameUI(); hostLoopStart();
  }
  function hostLoopStart() {
    hostLoopStop(); let last = performance.now();
    hostTimer = Net.workerInterval(() => {
      const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now;
      const mp = world.players.find(p => p.id === Net.myId);
      if (mp) { mp.input.dx = input.dx; mp.input.jumpHeld = input.jumpHeld; if (input.jump) mp.input.jump = true; input.jump = false; }
      Sim.step(world, dt);
      handleEvents(world.events);
      if (role === "host") {
        snapEvents.push(...world.events); snapAcc += dt; fullAcc += dt;
        if (snapAcc >= 1 / T.snapRate) { snapAcc = 0; Net.send("snap", snapPayload(snapEvents)); snapEvents = []; }
        if (fullAcc >= 4) { fullAcc = 0; sendFull(); }
      }
      if (world.phase === "end" && phase === "game") endRound(world.results);
    }, 1000 / T.tickRate);
  }
  function hostLoopStop() { if (hostTimer) hostTimer.stop(); hostTimer = null; }
  function snapPayload(ev) { return { p: Sim.packPlayers(world), wt: Math.round(world.t * 100) / 100, t: Math.round(world.time * 10) / 10, ph: world.phase, cd: world.countdown, lava: Math.round(world.lava), ev }; }
  function sendFull(to) { Net.send("full", Object.assign(snapPayload([]), { full: 1, seed: world.seed, mode: world.mode, seconds: lobby.seconds, opts: lobby.opts, players: lobby.players }), to); }

  // ---------- klient
  $("btn-join").onclick = () => join($("code-input").value.trim().toUpperCase());
  $("code-input").addEventListener("keydown", (e) => { if (e.key === "Enter") $("btn-join").click(); });
  let joinTimeout = null;
  function join(code) {
    if (code.length !== 4) return;
    Audio2.unlock(); Audio2.ui(); role = "client";
    const kind = Net.open(code, false);
    lobby = { code, hostId: null, players: [], mode: MODES[0], seconds: defHeight(), opts: defOpts() };
    openLobby(kind); $("lobby-count").textContent = Lang("connecting");
    Net.send("hello", me());
    clearTimeout(joinTimeout);
    joinTimeout = setTimeout(() => { if (role === "client" && !lobby.hostId) { leaveToMenu(); toast(Lang("notFound"), 3000); } }, kind === "online" ? 6000 : 2500);
  }
  Net.on("lobby", (p) => { if (role !== "client") return; lobby = { code: p.code, hostId: p.hostId, players: p.players, mode: p.mode, seconds: p.seconds, opts: p.opts || defOpts() }; clearTimeout(joinTimeout); if (phase === "results" && p.phase === "lobby") openLobby(Net.kind); else if (phase !== "game") renderLobby(); });
  Net.on("full", (p) => {
    if (role !== "client") return;
    if (!p.full && !lobby.hostId) { leaveToMenu(); toast(Lang("roomFull"), 3000); return; }
    if (!p.full) return;
    if (phase !== "game") clientStart(p.seed, p.mode, p.seconds, p.players, p.opts);
    applySnap(p);
  });
  Net.on("start", (p) => { if (role === "client") clientStart(p.seed, p.mode, p.seconds, p.players, p.opts); });
  Net.on("snap", (p) => { if (role !== "client" || phase !== "game") return; applySnap(p); });
  Net.on("end", (p) => { if (role === "client") endRound(p.results); });

  function clientStart(seed, mode, seconds, players, opts) {
    doubled = false; myResult = null; runStats = { jumps: 0, deaths: 0, floors: 0, finishes: 0 };
    lobby.players = players; lobby.mode = mode; lobby.seconds = seconds; if (opts) lobby.opts = opts;
    cw = Sim.create(seed, { mode, height: seconds, client: true });
    const idx = players.findIndex(p => p.id === Net.myId);
    const info = players[idx] || { name: myName(), hat: Storage.hat, ci: 0 };
    const m = Sim.addPlayer(cw, { id: Net.myId, name: info.name, hat: info.hat, pattern: info.pattern });
    m.slot = Math.max(0, idx); m.ci = info.ci; m.x = 40 + (m.slot % 8) * 40;
    remote.clear();
    view = { plats: cw.plats, top: cw.top, players: [], t: 0, lava: -200, time: T.timeLimit, phase: "countdown", countdown: 3, mode };
    phase = "game"; roundStart = performance.now();
    beginGameUI(); clientLoopStart();
  }
  function applySnap(p) {
    Object.assign(view, { time: p.t, phase: p.ph, countdown: p.cd, lava: p.lava });
    cw.phase = p.ph; cw.lava = p.lava; cw.t += (p.wt - cw.t) * 0.5;
    for (const a of p.p) {
      const [id, x, y, dir, fl, best, done] = a;
      const flags = { ground: !!(fl & 1), dead: !!(fl & 8), out: !!(fl & 16), done: !!(fl & 32) };
      if (id === Net.myId) {
        const m = cw.players[0]; const d = Math.hypot(m.x - x, m.y - y);
        if (flags.dead || flags.out || flags.done) { m.x = x; m.y = y; m.vx = m.vy = 0; }
        else if (d > 60) { m.x = x; m.y = y; } else { m.x += (x - m.x) * 0.12; m.y += (y - m.y) * 0.12; }
        m.dead = flags.dead ? 1 : 0; m.out = flags.out; m.done = done; m.best = Math.max(m.best, best);
        continue;
      }
      let r = remote.get(id); if (!r) { r = { x, y, dx: x, dy: y, dir }; remote.set(id, r); }
      Object.assign(r, flags, { tx: x, ty: y, dir, best, done });
    }
    if (p.ev && p.ev.length) handleEvents(p.ev);
  }
  function clientLoopStart() {
    if (clientTimer) clientTimer.stop(); let last = performance.now();
    clientTimer = Net.workerInterval(() => {
      const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now;
      const m = cw.players[0];
      m.input.dx = input.dx; m.input.dy = input.dy;
      const jumpNow = input.jump; input.jump = false;
      m.input.jumpHeld = input.jumpHeld; if (jumpNow) m.input.jump = true;
      if (cw.phase === "play" && m.dead <= 0 && !m.out && !m.done) { cw.t += dt; Sim.movePlayer(cw, m, dt); if (cw.events.some(e => e.t === "jump")) Audio2.dash(); cw.events.length = 0; }
      inputAcc += dt; const key = input.dx + "," + (input.jumpHeld ? 1 : 0);
      if (jumpNow || key !== lastInputSent || inputAcc >= 0.1) { inputAcc = 0; lastInputSent = key; Net.send("input", [input.dx, jumpNow ? 1 : 0, input.jumpHeld ? 1 : 0], lobby.hostId); }
    }, 1000 / 30);
  }

  // ---------- události → zvuk, efekty, statistiky
  const nameOf = (id) => { const p = lobby.players.find(x => x.id === id); return p ? p.name : "?"; };
  const colorOf = (id) => { const p = lobby.players.find(x => x.id === id); return p ? p.color : "#fff"; };
  function handleEvents(events) {
    for (const e of events) {
      const mine = e.id === Net.myId;
      if (e.t === "count") Audio2.countdown();
      else if (e.t === "go") { Audio2.go(); Render.popup(Sim.W / 2, Sim.H / 2 - 60, Lang("go"), "#fff"); }
      else if (e.t === "tick") Audio2.tick();
      else if (e.t === "end") Audio2.whistle();
      else if (e.t === "jump") { if (mine) { runStats.jumps++; if (role !== "client") Audio2.dash(); } }
      else if (e.t === "spring") { Render.ring(e.x + 8, e.y, "#FFCF5A", 30); if (mine) { Audio2.pickup(); vibrate(10); } }
      else if (e.t === "check") { if (mine) { const m = myPos(); Render.popup(Sim.W / 2, (m ? m.y : 0) + 60, Lang("checkpoint"), "#5EE1D0"); Audio2.pickup(); } }
      else if (e.t === "die") { Render.burst(e.x + 8, e.y + 10, colorOf(e.id), 14, 160); if (mine) { runStats.deaths++; Audio2.bump(); Render.kick(0.6); vibrate([30, 30, 60]); } }
      else if (e.t === "out") { Render.burst(e.x + 8, e.y + 10, "#FF5E7E", 20, 200); Render.popup(e.x + 8, e.y + 40, Lang("out", nameOf(e.id)), "#FF5E7E"); Audio2.bomb(); if (mine) Render.kick(1); }
      else if (e.t === "finish") { Render.burst(e.x + 8, e.y + 10, colorOf(e.id), 24, 220); Render.popup(e.x + 8, e.y + 40, Lang("finished", nameOf(e.id), e.rank), "#FFCF5A"); if (mine) { runStats.finishes++; Audio2.win(); vibrate([20, 40, 20]); } else Audio2.tick(); }
      else if (e.t === "lastcall") { toast(Lang("lastCall"), 2500); Audio2.whistle(); }
    }
  }
  function myPos() { if (role === "client") return cw.players[0]; const p = world && world.players.find(p => p.id === Net.myId); return p; }

  // ---------- herní UI + kreslení
  function beginGameUI() {
    show("hud");
    $("hud-hint").textContent = isTouch ? Lang("hintMobile") : Lang("hintPc");
    setTimeout(() => { $("hud-hint").textContent = ""; }, 5000);
    $("btn-dash").classList.toggle("hidden", !isTouch); $("btn-dash").textContent = "JUMP"; $("btn-left").classList.toggle("hidden", !isTouch); $("btn-right").classList.toggle("hidden", !isTouch);
    let ml = $("hud-mode"); if (!ml) { ml = document.createElement("div"); ml.id = "hud-mode"; ml.className = "hud-mode"; $("hud").appendChild(ml); }
    ml.textContent = Lang.mode(lobby.mode);
    $("hud-bars").innerHTML = "";
  }
  const meLabel = () => Lang("you").toUpperCase();
  function buildView() {
    const elapsed = (performance.now() - roundStart) / 1000;
    const showMe = elapsed < 7 ? Math.min(1, 7 - elapsed) : 0;
    if (role === "client") {
      const players = [];
      lobby.players.forEach((lp) => {
        const color = Sim.COLORS[lp.ci];
        if (lp.id === Net.myId) { const m = cw.players[0]; players.push({ x: m.x, y: m.y, dir: m.dir, color, name: lp.name, hat: lp.hat, pattern: lp.pattern, ground: m.ground, dead: m.dead > 0, out: m.out, done: m.done, best: m.best, me: true, meLabel: meLabel() }); }
        else { const r = remote.get(lp.id); if (!r) return; players.push({ x: r.dx, y: r.dy, dir: r.dir, color, name: lp.name, hat: lp.hat, pattern: lp.pattern, ground: r.ground, dead: r.dead, out: r.out, done: r.done, best: r.best }); }
      });
      view.players = players; view.showMe = showMe; view.t = cw.t;
      return view;
    }
    return {
      plats: world.plats, top: world.top, t: world.t, lava: world.lava, time: world.time, phase: world.phase, countdown: world.countdown, showMe, mode: world.mode,
      players: world.players.map(p => ({ x: p.x, y: p.y, dir: p.dir, color: Sim.colorOf(world, p), name: p.name, hat: p.hat, pattern: p.pattern, ground: p.ground, dead: p.dead > 0, out: p.out, done: p.done, best: p.best, me: p.id === Net.myId, meLabel: meLabel() })),
    };
  }
  let lastFrame = performance.now(), barsAcc = 0;
  function frame(now) {
    const dt = Math.min(0.1, (now - lastFrame) / 1000); lastFrame = now;
    if (phase === "game" || phase === "results") {
      if (role === "client") for (const r of remote.values()) { const k = Math.min(1, dt * 14); r.dx += (r.tx - r.dx) * k; r.dy += (r.ty - r.dy) * k; }
      const v = buildView(); Render.draw(v, dt);
      if (phase === "game") { $("hud-time").textContent = Math.ceil(v.time); barsAcc += dt; if (barsAcc > 0.3) { barsAcc = 0; renderBars(); } }
    } else Render.draw({ plats: [], players: [], top: 1, t: 0, phase: "idle" }, dt);
    requestAnimationFrame(frame);
  }
  function renderBars() {
    const bars = $("hud-bars"), top = (role === "client" ? cw : world).top;
    const bestOf = (lp, i) => { if (role !== "client") { const p = world.players[i]; return p ? p.best : 0; } const r = lp.id === Net.myId ? cw.players[0] : remote.get(lp.id); return r ? r.best || 0 : 0; };
    const rows = lobby.players.map((lp, i) => ({ color: Sim.COLORS[lp.ci], me: lp.id === Net.myId, v: bestOf(lp, i) }));
    const max = top;
    if (bars.childElementCount !== rows.length) bars.innerHTML = rows.map(r => `<div class="hud-bar${r.me ? " me" : ""}"><i style="background:${r.color}"></i></div>`).join("");
    rows.forEach((r, i) => { const el = bars.children[i]; el.firstChild.style.width = Math.min(100, 100 * r.v / max) + "%"; el.firstChild.style.background = r.color; el.classList.toggle("me", r.me); });
  }

  // ---------- vstupy
  const keys = {};
  const JUMP_KEYS = [" ", "w", "arrowup"];
  window.addEventListener("keydown", (e) => { if (e.target.tagName === "INPUT") return; const k = e.key.toLowerCase(); keys[k] = true; if (JUMP_KEYS.includes(k) && !e.repeat) { e.preventDefault(); if (phase === "game") input.jump = true; } updateKeyInput(); });
  window.addEventListener("keyup", (e) => { keys[e.key.toLowerCase()] = false; updateKeyInput(); });
  function updateKeyInput() { if (touchDx !== null) return; let dx = 0; if (keys["a"] || keys["arrowleft"]) dx -= 1; if (keys["d"] || keys["arrowright"]) dx += 1; input.dx = dx; input.jumpHeld = JUMP_KEYS.some(k => keys[k]) || jumpTouch; }
  let touchDx = null, jumpTouch = false;
  const hold = (id, on, off) => { const el = $(id); el.addEventListener("pointerdown", (e) => { e.preventDefault(); on(); }); ["pointerup", "pointercancel", "pointerleave"].forEach(ev => el.addEventListener(ev, () => off())); };
  hold("btn-left", () => { touchDx = -1; input.dx = -1; }, () => { if (touchDx === -1) { touchDx = null; input.dx = 0; updateKeyInput(); } });
  hold("btn-right", () => { touchDx = 1; input.dx = 1; }, () => { if (touchDx === 1) { touchDx = null; input.dx = 0; updateKeyInput(); } });
  hold("btn-dash", () => { if (phase === "game") input.jump = true; jumpTouch = true; input.jumpHeld = true; }, () => { jumpTouch = false; input.jumpHeld = JUMP_KEYS.some(k => keys[k]); });

  // ---------- výsledky
  function endRound(results) {
    phase = "results"; hostLoopStop();
    myResult = results.find(r => r.id === Net.myId);
    if (myResult) {
      Storage.addCoins(myResult.coins);
      const st = Storage.stats; Storage.setStats({ games: st.games + 1, wins: st.wins + (myResult.win ? 1 : 0), best: Math.max(st.best, myResult.floor) });
      Missions.afterGame(myResult, runStats);
      setTimeout(() => myResult.win ? Audio2.win() : Audio2.lose(), 400);
    }
    const top = results[0];
    $("res-title").textContent = myResult && myResult.win ? Lang("youWin") : Lang("winner", top.name);
    const mx = Math.max(1, ...results.map(r => r.best));
    $("res-list").innerHTML = results.map(r => `<div class="res-row${r.id === Net.myId ? " me" : ""}"><span>${r.rank}.</span><span class="dot" style="background:${r.color}"></span><span><span class="nm"></span><div class="bar"><i style="width:${Math.min(100, 100 * r.best / mx)}%;background:${r.color}"></i></div></span><span class="pct">${r.value}</span></div>`).join("");
    [...$("res-list").querySelectorAll(".nm")].forEach((el, i) => el.textContent = results[i].name);
    $("res-coins").textContent = myResult ? Lang("coinsEarned", myResult.coins) : "";
    $("btn-double").classList.toggle("hidden", !myResult || myResult.coins <= 0); $("btn-double").disabled = false;
    $("btn-again").classList.toggle("hidden", role === "client"); $("res-wait").classList.toggle("hidden", role !== "client");
    show("results");
    if (role === "host") Net.send("end", { results });
  }
  $("btn-double").onclick = async () => { if (doubled || !myResult) return; $("btn-double").disabled = true; const ok = await Monetization.showRewarded(); if (ok) { doubled = true; Storage.addCoins(myResult.coins); $("res-coins").textContent = Lang("coinsEarned", myResult.coins * 2); Audio2.reward(); $("btn-double").classList.add("hidden"); } else { $("btn-double").disabled = false; toast(Lang("adUnavailable")); } };
  $("btn-again").onclick = () => { Audio2.ui(); openLobby(role === "solo" ? "solo" : Net.kind); if (role === "host") syncLobby(); };
  $("btn-res-menu").onclick = () => leaveToMenu();
  Missions.onComplete((m) => { toast(Lang("missionDone", m.reward)); Audio2.reward(); vibrate([15, 40, 15]); });

  // ---------- úkoly
  function openMissions() {
    Audio2.ui(); show("missions");
    for (const [id, list] of [["daily-list", Missions.daily()], ["weekly-list", Missions.weekly()]]) {
      $(id).innerHTML = list.map(m => `<div class="mission${m.claimed ? " done" : ""}"><div class="m-head"><span></span><span class="m-reward"><span class="coin"></span>${m.reward}</span></div><div class="m-bar"><i style="width:${Math.min(100, 100 * m.progress / m.target)}%"></i></div><div class="m-prog">${m.claimed ? "✓" : Math.round(m.progress) + " / " + m.target}</div></div>`).join("");
      [...$(id).querySelectorAll(".m-head > span:first-child")].forEach((el, i) => el.textContent = Lang.mission(list[i].type, list[i].target));
    }
  }

  // ---------- obchod
  function openShop() {
    Audio2.ui(); show("shop"); refreshMenu();
    $("shop-coins").textContent = Storage.coins;
    $("iap-note").classList.toggle("hidden", Monetization.native);
    const col = Storage.color >= 0 ? Sim.COLORS[Storage.color] : Sim.COLORS[0];
    grid("hat-grid", Render.HATS, Storage.owned, Storage.hat, (id) => Lang.hat(id), (id) => Storage.own(id), (id) => Storage.setHat(id), (cv, id) => Render.preview(cv, id, col, Storage.pattern));
    grid("pat-grid", Render.PATTERNS, Storage.patternOwned, Storage.pattern, (id) => Lang.pat(id), (id) => Storage.ownPattern(id), (id) => Storage.setPattern(id), (cv, id) => Render.preview(cv, Storage.hat, col, id));
    Monetization.loadPrices();
  }
  function grid(elId, items, ownedList, active, nameFn, ownFn, pickFn, previewFn) {
    const g = $(elId); g.innerHTML = "";
    for (const [id, it] of Object.entries(items)) {
      const owned = ownedList.includes(id);
      const el = document.createElement("button"); el.className = "hat" + (owned ? " owned" : "") + (active === id ? " active" : "");
      const cv = document.createElement("canvas"); cv.width = 80; cv.height = 80; previewFn(cv, id); el.appendChild(cv);
      const lb = document.createElement("span"); lb.textContent = owned ? nameFn(id) : it.price; el.appendChild(lb);
      el.onclick = () => { if (owned) { pickFn(id); Audio2.ui(); } else if (Storage.coins >= it.price) { Storage.addCoins(-it.price); ownFn(id); pickFn(id); Audio2.reward(); toast(Lang("unlocked", nameFn(id))); } else { toast(Lang("missingCoins", it.price - Storage.coins)); return; } openShop(); };
      g.appendChild(el);
    }
  }
  document.querySelectorAll(".iap").forEach(b => b.onclick = async () => { const ok = await Monetization.purchase(b.dataset.iap); if (ok) { toast(Lang("done")); openShop(); } });
  $("btn-restore").onclick = async () => { const ok = await Monetization.restore(); toast(ok ? Lang("restored") : Lang("nothingToRestore")); };

  window.__dbg = () => ({ world, cw, lobby, phase });
  // ---------- start
  Render.init($("game")); Lang.apply(); refreshMenu(); show("menu"); requestAnimationFrame(frame);
  Monetization.init().then(async () => { const g = await Monetization.claimWebPurchases(); if (g.length) { toast(Lang("purchaseActive")); refreshMenu(); } });
  const bonus = Missions.dailyBonus(); if (bonus) setTimeout(() => { toast(Lang("dailyBonus", bonus.reward, bonus.streak), 3000); Audio2.reward(); refreshMenu(); }, 600);
  const roomParam = new URLSearchParams(location.search).get("room");
  if (roomParam) { history.replaceState(null, "", location.pathname); $("code-input").value = roomParam.toUpperCase(); setTimeout(() => join(roomParam.toUpperCase()), 300); }
})();
