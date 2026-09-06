(() => {
  const $ = (id) => document.getElementById(id);
  const T = FR_CONFIG.tuning;
  const screens = ["menu", "hud", "lobby", "results", "shop", "missions"];
  const MODES = Object.keys(Sim.MODES);
  let role = null, world = null, cw = null, view = null, phase = "menu";
  const defOpts = () => Object.assign({ pu: "random", bots: "mix", target: 0, disabled: [], nations: 16 }, Storage.opts);
  const fmtK = (n) => n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 10000 ? Math.round(n / 1000) + "K" : n >= 1000 ? (n / 1000).toFixed(1) + "K" : Math.round(n);
  const U = FR_CONFIG.units;
  let tool = null;   // {type} – čeká na kliknutí cíle (nuke / warship)
  let lobby = { code: "", hostId: null, players: [], mode: MODES[0], seconds: 0, opts: defOpts() };
  let myResult = null, doubled = false, roundStart = 0, hostTimer = null, clientTimer = null, snapAcc = 0, fullAcc = 0, snapDirty = [], snapTDirty = [], snapEvents = [];
  let hover = -1, brushVal = 1, painting = null, ratio = 0.5, remoteP = [], remoteA = [], runStats = null, centroidAcc = 0, centroids = {};

  function show(id) { screens.forEach(s => $(s).classList.toggle("hidden", s !== id)); if (id === "menu" || id === "results") Monetization.showBanner(); else Monetization.hideBanner(); }
  function toast(msg, ms = 1800) { const el = $("toast"); el.textContent = msg; el.classList.remove("hidden"); clearTimeout(el._t); el._t = setTimeout(() => el.classList.add("hidden"), ms); }
  const myName = () => (Storage.name || "").trim() || (Lang.current() === "cs" ? "Hráč" : "Player");
  const me = () => ({ id: Net.myId, name: myName(), hat: Storage.hat, pattern: Storage.pattern, pref: Storage.color });

  // ---------- menu
  function refreshMenu() {
    $("menu-coins").textContent = Storage.coins; $("btn-sound").textContent = Lang("sound") + ": " + Lang(Storage.sound ? "on" : "off"); $("btn-vibrate").classList.add("hidden"); $("btn-lang").textContent = Lang("lang");
    const st = Storage.stats; $("menu-stats").textContent = st.games ? Lang("stats", st.games, st.wins, st.best) : ""; $("name-input").value = Storage.name; $("missions-badge").textContent = Missions.left() || "✓";
    Render.preview($("me-preview"), Storage.hat, Storage.color >= 0 ? Sim.COLORS[Storage.color] : Sim.COLORS[0]);
    const cr = $("color-row"); cr.innerHTML = "";
    const auto = document.createElement("button"); auto.className = "auto" + (Storage.color < 0 ? " active" : ""); auto.onclick = () => { Storage.setColor(-1); refreshMenu(); }; cr.appendChild(auto);
    Sim.COLORS.forEach((c, i) => { const b = document.createElement("button"); b.style.background = c; b.className = Storage.color === i ? "active" : ""; b.onclick = () => { Storage.setColor(i); refreshMenu(); }; cr.appendChild(b); });
    for (const k of Object.keys(FR_CONFIG.iap)) { const el = $("price-" + k), p = FR_CONFIG.iap[k]; if (el && p.price) el.textContent = p.price + (p.subscription ? Lang("perMonth") : ""); }
    const loc = Lang.current() === "cs" ? "cs-CZ" : "en-US"; $("lbl-coins_500").textContent = Lang("coins", (500).toLocaleString(loc)); $("lbl-coins_2000").textContent = Lang("coins", (2000).toLocaleString(loc));
    const sub = document.querySelector('[data-iap="remove_ads"]'); const active = Storage.noAdsUntil > Date.now(); sub.disabled = active; sub.querySelector("span").textContent = active ? Lang("subActive", new Date(Storage.noAdsUntil).toLocaleDateString()) : Lang("removeAds");
  }
  $("name-input").addEventListener("input", (e) => Storage.setName(e.target.value.slice(0, 12)));
  $("btn-sound").onclick = () => { Storage.setSound(!Storage.sound); Audio2.ui(); refreshMenu(); };
  $("btn-lang").onclick = () => { Lang.toggle(); Audio2.ui(); refreshMenu(); };
  $("btn-shop").onclick = () => openShop(); $("btn-missions").onclick = () => openMissions();
  document.querySelectorAll("[data-back]").forEach(b => b.onclick = () => { Audio2.ui(); refreshMenu(); show("menu"); });

  // ---------- solo / host
  const BOT_NAMES_ALL = { en: ["Max", "Zoe", "Leo", "Mia", "Rocky", "Kiki", "Sam", "Nova", "Rex", "Lily", "Ash", "Milo"], cs: ["Bobek", "Zuzka", "Pepa", "Klára", "Rambo", "Kiki", "Tonda", "Máňa", "Rex", "Lili", "Bára", "Vašek"] };
  function fillBots() { const names = [...Sim.NATIONS].sort(() => Math.random() - 0.5); const used = new Set(world.players.map(p => p.name)); const target = Math.min(T.maxNations, Math.max(lobby.opts.nations || 16, world.players.filter(p => !p.bot).length + 1)); let k = 0; while (world.players.length < target && k < names.length) { const n = names[k++]; if (used.has(n)) continue; used.add(n); const b = Sim.addPlayer(world, { id: "bot-" + Math.random().toString(36).slice(2, 7), name: n, bot: true }); if (b) Sim.assignBot(b, lobby.opts.bots); } }
  function trimBots() { const humans = world.players.filter(p => !p.bot).length; const target = Math.max(lobby.opts.nations || 16, humans + 1); while (world.players.length > target) { const bot = [...world.players].reverse().find(p => p.bot); if (!bot) break; Sim.removePlayer(world, bot.id); } }
  $("btn-solo").onclick = () => { Audio2.unlock(); role = "solo"; Net.close(); world = Sim.create(Date.now()); Sim.addPlayer(world, me()); lobby = { code: "", hostId: Net.myId, players: [], mode: Storage.lastMode in Sim.MODES ? Storage.lastMode : MODES[0], seconds: 0, opts: defOpts() }; fillBots(); lobby.players = Sim.lobbyInfo(world); openLobby("solo"); };
  $("btn-create").onclick = () => { Audio2.unlock(); role = "host"; const code = Net.makeCode(); const kind = Net.open(code, true); world = Sim.create(Date.now()); Sim.addPlayer(world, me()); lobby = { code, hostId: Net.myId, players: [], mode: Storage.lastMode in Sim.MODES ? Storage.lastMode : MODES[0], seconds: 0, opts: defOpts() }; syncLobby(); openLobby(kind); };
  function syncLobby() { lobby.players = Sim.lobbyInfo(world); if (role === "host") Net.send("lobby", { code: lobby.code, hostId: lobby.hostId, players: lobby.players, mode: lobby.mode, opts: lobby.opts, phase }); renderLobby(); }
  Net.on("hello", (p, from) => { if (role !== "host") return; if (world.players.find(x => x.id === from)) { syncLobby(); return; } if (world.players.filter(x => !x.bot).length >= T.maxPlayers) { Net.send("full", {}, from); return; } if (world.players.length >= T.maxNations) { const bot = world.players.find(x => x.bot); if (bot) Sim.removePlayer(world, bot.id); } const pl = Sim.addPlayer(world, { id: from, name: (p.name || "?").slice(0, 12), pref: p.pref ?? -1 }); if (!pl) { Net.send("full", {}, from); return; } toast(pl.name + " →"); syncLobby(); if (phase === "game") sendFull(from); });
  Net.on("leave", ({ id }) => { if (role === "host") { if (world && world.players.find(x => x.id === id)) { Sim.removePlayer(world, id); syncLobby(); } } else if (role === "client" && id === lobby.hostId) { leaveToMenu(); toast(Lang("hostLeft"), 3000); } });
  Net.on("act", (p, from) => { if (role !== "host" || !world) return; const pl = world.players.find(x => x.id === from); if (!pl) return; applyAct(pl, p); });
  function applyAct(pl, p) {
    if (p.k === "spawn" && world.phase === "spawn") { pl.spawnAt = p.cell; Sim.doSpawn(world, pl, p.cell); }
    else if (p.k === "paint" && world.phase === "draw") Sim.paint(world, p.cells, p.val);
    else if (world.phase === "play") pl.input.push(p);
  }
  $("btn-bots").onclick = () => { fillBots(); syncLobby(); };
  $("btn-start").onclick = () => startRound();

  // ---------- lobby UI
  function openLobby(kind) { phase = "lobby"; show("lobby"); $("code-box").classList.toggle("hidden", role === "solo"); $("lobby-code").textContent = lobby.code; $("lobby-kind").textContent = role === "solo" ? "" : kind === "online" ? "online" : "local (dev)"; $("lobby-host-actions").classList.toggle("hidden", role === "client"); $("btn-bots").classList.toggle("hidden", role === "solo"); $("lobby-wait").classList.toggle("hidden", role !== "client"); renderLobby(); }
  function renderLobby() {
    $("lobby-count").textContent = Lang("players", lobby.players.length, T.maxPlayers);
    const humans = lobby.players.filter(p => !p.bot), bots = lobby.players.filter(p => p.bot);
    $("lobby-list").innerHTML = humans.map(p => `<div class="lobby-p"><span class="dot" style="background:${Sim.COLORS[p.ci]}"></span><span></span><small>${p.id === Net.myId ? Lang("you") : p.id === lobby.hostId ? Lang("host") : ""}</small></div>`).join("") + (bots.length ? `<div class="lobby-p"><span class="dot" style="background:#888"></span><span>${bots.length} × ${Lang("bot")}</span><small>${Lang.botLv(lobby.opts.bots)}</small></div>` : "");
    [...$("lobby-list").querySelectorAll(".lobby-p span:nth-child(2)")].slice(0, humans.length).forEach((el, i) => el.textContent = humans[i].name);
    $("lobby-count").textContent = Lang("players", humans.length, T.maxPlayers) + " · " + Lang("nations") + " " + lobby.players.length;
    if (role !== "client") $("btn-start").disabled = lobby.players.length < 2;
    const canEdit = role !== "client";
    const seg = (id, items, cur, label, fn) => { const el = $(id); el.innerHTML = ""; for (const v of items) { const b = document.createElement("button"); b.textContent = label(v); b.className = v === cur ? "active" : ""; b.disabled = !canEdit; b.onclick = () => fn(v); el.appendChild(b); } };
    seg("mode-btns", MODES, lobby.mode, (m) => Lang.mode(m), (m) => { lobby.mode = m; Storage.setLastMode(m); syncLobby(); });
    $("mode-desc").textContent = Lang.modeDesc(lobby.mode);
    $("len-btns").parentElement.classList.add("hidden"); $("target-row").classList.add("hidden");
    const setOpt = (k, v) => { lobby.opts[k] = v; Storage.setOpts(lobby.opts); if (k === "bots" && world) world.players.forEach(p => { if (p.bot) Sim.assignBot(p, v); }); syncLobby(); };
    seg("pu-btns", Sim.MAPS, Sim.MAPS.includes(lobby.opts.pu) ? lobby.opts.pu : "random", (v) => Lang.map(v), (v) => setOpt("pu", v));
    const ub = $("units-btns"); ub.innerHTML = ""; for (const u of Sim.UNIT_KEYS) { const b = document.createElement("button"); b.textContent = Lang.unit(u); b.className = (lobby.opts.disabled || []).includes(u) ? "active" : ""; b.disabled = !canEdit; b.onclick = () => { const d = new Set(lobby.opts.disabled || []); d.has(u) ? d.delete(u) : d.add(u); setOpt("disabled", [...d]); }; ub.appendChild(b); }
    seg("bots-btns", Object.keys(Sim.BOT_SKILL), lobby.opts.bots, (v) => Lang.botLv(v), (v) => setOpt("bots", v));
    seg("nations-btns", [8, 16, 32, 48, 64], lobby.opts.nations || 16, (v) => String(v), (v) => { lobby.opts.nations = v; Storage.setOpts(lobby.opts); if (world) { if (world.players.length < v) fillBots(); else trimBots(); } syncLobby(); });
  }
  $("btn-copy").onclick = async () => { try { await navigator.clipboard.writeText(Net.roomLink(lobby.code)); toast(Lang("copied")); } catch { toast(Net.roomLink(lobby.code), 4000); } };
  $("btn-share-room").onclick = async () => { const url = Net.roomLink(lobby.code); try { if (navigator.share) await navigator.share({ text: Lang("shareRoom", lobby.code) + url }); else { await navigator.clipboard.writeText(url); toast(Lang("copied")); } } catch {} };
  $("btn-leave").onclick = () => leaveToMenu();
  function leaveToMenu() { clearInterval(againTick); hostLoopStop(); if (clientTimer) clientTimer.stop(); clientTimer = null; Net.close(); role = null; world = null; cw = null; view = null; phase = "menu"; refreshMenu(); show("menu"); }

  // ---------- kolo
  function startRound() {
    doubled = false; myResult = null; runStats = { attacks: 0, cells: 0 };
    Sim.resetRound(world, Date.now(), { mode: lobby.mode, map: lobby.opts.pu, disabled: lobby.opts.disabled, bots: lobby.opts.bots });
    lobby.players = Sim.lobbyInfo(world);
    Render.setPalette(Sim.palette(world)); Render.fullPaint(world.terrain, world.owner);
    if (role === "host") Net.send("start", { seed: world.seed, mode: lobby.mode, opts: lobby.opts, players: lobby.players });
    phase = "game"; roundStart = performance.now(); beginGameUI(); hostLoopStart();
  }
  function hostLoopStart() {
    hostLoopStop(); let last = performance.now();
    hostTimer = Net.workerInterval(() => {
      const now = performance.now(), dt = Math.min(0.2, (now - last) / 1000); last = now;
      Sim.step(world, dt); handleEvents(world.events);
      if (world.dirty.length) { Render.applyDeltas(world.dirty); if (role === "host") snapDirty.push(...world.dirty); world.dirty = []; }
      if (world.tdirty.length) { Render.applyTerrain(world.tdirty); if (role === "host") snapTDirty.push(...world.tdirty); world.tdirty = []; }
      if (role === "host") { snapEvents.push(...world.events); snapAcc += dt; fullAcc += dt; if (snapAcc >= 1 / T.snapRate) { snapAcc = 0; Net.send("snap", snapPayload(snapDirty, snapTDirty, snapEvents)); snapDirty = []; snapTDirty = []; snapEvents = []; } if (fullAcc >= 5) { fullAcc = 0; sendFull(); } }
      if (world.phase === "end" && phase === "game") endRound(world.results);
    }, 1000 / T.tickRate);
  }
  function hostLoopStop() { if (hostTimer) hostTimer.stop(); hostTimer = null; }
  const attacksPayload = () => world.attacks.map(a => { const p = world.players.find(q => q.slot + 1 === a.from); return { from: a.from, to: a.to, cell: a.cell, troops: Math.round(a.troops), color: p ? Sim.colorOf(world, p) : "#fff" }; });
  const colorSlot = (sl) => { const p = world.players.find(q => q.slot + 1 === sl); return p ? Sim.colorOf(world, p) : "#fff"; };
  function snapPayload(d, td, ev) { return { p: Sim.packPlayers(world), d, td, a: attacksPayload(), b: world.buildings.map(b => ({ id: b.id, type: b.type, cell: b.cell, owner: b.owner, lvl: b.lvl || 1, x: b.x !== undefined ? Math.round(b.x * 10) / 10 : undefined, y: b.y !== undefined ? Math.round(b.y * 10) / 10 : undefined, color: colorSlot(b.owner) })), bo: world.boats.map(b => ({ x: Math.round(b.x * 10) / 10, y: Math.round(b.y * 10) / 10, tx: b.tx, ty: b.ty, troops: b.troops, color: colorSlot(b.from) })), nk: world.nukes.map(n => ({ fromCell: n.fromCell, cell: n.cell, t: Math.round(n.t * 10) / 10, radius: n.radius })), sh: world.ships.map(b => ({ x: Math.round(b.x * 10) / 10, y: Math.round(b.y * 10) / 10, tx: b.tx, ty: b.ty, color: colorSlot(b.owner) })), tr: world.trains.map(b => ({ x: Math.round(b.x * 10) / 10, y: Math.round(b.y * 10) / 10, color: colorSlot(b.owner) })), al: Sim.packAlliances(world), rq: world.requests.map(r => [r.from, r.to]), ph: world.phase, cd: world.countdown, t: Math.round(world.time), ev }; }
  function sendFull(to) { Net.send("full", Object.assign(snapPayload([], [], []), { full: 1, terr: Sim.packGrid(world.terrain), own: Sim.packGrid(world.owner), seed: world.seed, mode: world.mode, opts: lobby.opts, players: lobby.players }), to); }

  // ---------- klient
  $("btn-join").onclick = () => join($("code-input").value.trim().toUpperCase());
  $("code-input").addEventListener("keydown", (e) => { if (e.key === "Enter") $("btn-join").click(); });
  let joinTimeout = null;
  function join(code) { if (code.length !== 4) return; Audio2.unlock(); role = "client"; const kind = Net.open(code, false); lobby = { code, hostId: null, players: [], mode: MODES[0], seconds: 0, opts: defOpts() }; openLobby(kind); $("lobby-count").textContent = Lang("connecting"); Net.send("hello", me()); clearTimeout(joinTimeout); joinTimeout = setTimeout(() => { if (role === "client" && !lobby.hostId) { leaveToMenu(); toast(Lang("notFound"), 3000); } }, kind === "online" ? 6000 : 2500); }
  Net.on("lobby", (p) => { if (role !== "client") return; lobby = { code: p.code, hostId: p.hostId, players: p.players, mode: p.mode, seconds: 0, opts: p.opts || defOpts() }; clearTimeout(joinTimeout); if (phase === "results" && p.phase === "lobby") openLobby(Net.kind); else if (phase !== "game") renderLobby(); });
  Net.on("start", (p) => { if (role === "client") clientStart(p); });
  Net.on("full", (p) => { if (role !== "client") return; if (!p.full && !lobby.hostId) { leaveToMenu(); toast(Lang("roomFull"), 3000); return; } if (!p.full) return; if (phase !== "game") clientStart(p); Sim.unpackGrid(cw.terrain, p.terr); Sim.unpackGrid(cw.owner, p.own); Sim.recount(cw); Render.fullPaint(cw.terrain, cw.owner); applySnap(p); });
  Net.on("snap", (p) => { if (role !== "client" || phase !== "game") return; if (p.td && p.td.length) { for (const d of p.td) cw.terrain[d >> 1] = d & 1; Render.applyTerrain(p.td); } if (p.d && p.d.length) { for (const d of p.d) { const i = d >> 4, o = d & 15; cw.cells[cw.owner[i]]--; cw.owner[i] = o; cw.cells[o]++; } Render.applyDeltas(p.d); } applySnap(p); });
  Net.on("end", (p) => { if (role === "client") endRound(p.results); });
  function clientStart(p) {
    doubled = false; myResult = null; runStats = { attacks: 0, cells: 0 }; lobby.players = p.players; lobby.mode = p.mode; if (p.opts) lobby.opts = p.opts;
    cw = Sim.create(p.seed, { mode: p.mode, map: lobby.opts.pu, disabled: lobby.opts.disabled, client: true });
    lobby.players.forEach(lp => Sim.addPlayer(cw, { id: lp.id, name: lp.name, pref: lp.ci })); cw.players.forEach((q, i) => { q.ci = lobby.players[i].ci; });
    Render.setPalette(lobby.players.map(lp => Sim.COLORS[lp.ci])); Render.fullPaint(cw.terrain, cw.owner);
    view = { players: [], attacks: [], phase: "countdown", countdown: 3, time: 0 };
    phase = "game"; roundStart = performance.now(); beginGameUI();
    if (clientTimer) clientTimer.stop(); clientTimer = Net.workerInterval(() => { if (painting !== null) sendPaintBatch(); }, 200);
  }
  function applySnap(p) { Object.assign(view, { phase: p.ph, countdown: p.cd, time: p.t, buildings: p.b || [], boats: p.bo || [], nukes: p.nk || [], ships: p.sh || [], trains: p.tr || [] }); if (p.al) cw.alliances = new Set(p.al); if (p.rq) cw.requests = p.rq.map(([from, to]) => ({ from, to })); cw.phase = p.ph; remoteP = p.p; remoteA = p.a || []; if (p.ev && p.ev.length) handleEvents(p.ev); }

  // ---------- akce hráče
  function act(a) { if (role === "client") Net.send("act", a, lobby.hostId); else { const pl = world.players.find(x => x.id === Net.myId); if (pl) applyAct(pl, a); } }
  const W_ = () => role === "client" ? cw : world;
  const canvas = $("game");
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  let drag = null;   // {x,y,button,moved}
  canvas.addEventListener("pointermove", (e) => {
    hover = Render.toCell(e.clientX, e.clientY);
    if (drag) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 6) drag.moved = true; if (drag.moved && drag.button !== 0 || (drag.moved && drag.button === 0 && W_().phase !== "draw")) { Render.pan(e.clientX - drag.lx, e.clientY - drag.ly); } drag.lx = e.clientX; drag.ly = e.clientY; }
    if (painting !== null) brushAt(hover, painting);
  });
  canvas.addEventListener("pointerdown", (e) => {
    if (phase !== "game") return; hideBuildMenu(); hideRadial();
    const w = W_();
    if (w.phase === "draw" && e.button !== 1) { const cell = Render.toCell(e.clientX, e.clientY); painting = e.button === 2 ? 0 : brushVal; brushAt(cell, painting); return; }
    drag = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, button: e.button, moved: false };
  });
  window.addEventListener("pointerup", (e) => {
    if (painting !== null) { sendPaintBatch(); painting = null; }
    if (!drag) return; const d = drag; drag = null;
    if (d.moved || phase !== "game") return;
    const w = W_(); const cell = Render.toCell(e.clientX, e.clientY); if (cell < 0) return;
    if (w.phase === "spawn") { if (d.button === 0) act({ k: "spawn", cell }); return; }
    if (w.phase !== "play") return;
    if (tool) { if (d.button === 0) { if (tool.nuke) act({ k: "nuke", type: tool.type, cell }); else act({ k: "build", type: tool.type, cell }); } setTool(null); return; }
    if (d.button === 2) { selectedShip = null; showRadial(e.clientX, e.clientY, cell); return; }
    if (d.button === 0) {
      const me = mySlotIdx() + 1, blds = role === "client" ? (view.buildings || []) : world.buildings;
      const ship = blds.find(b => b.type === "warship" && b.owner === me && Math.hypot((b.x ?? Sim.cx(b.cell)) - Sim.cx(cell), (b.y ?? Sim.cy(b.cell)) - Sim.cy(cell)) < 4);
      if (ship) { selectedShip = selectedShip === ship.id ? null : ship.id; return; }
      if (selectedShip && !w.terrain[cell]) { act({ k: "move", id: selectedShip, cell }); selectedShip = null; return; }
      selectedShip = null; doAttackOrBoat(cell, false);
    }
  });
  canvas.addEventListener("wheel", (e) => { e.preventDefault(); if (phase !== "game") return; Render.zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.15 : 1 / 1.15); }, { passive: false });
  function doAttackOrBoat(cell, forceBoat) {
    const w = W_(), mySlot = mySlotIdx();
    if (!w.terrain[cell] || w.owner[cell] === mySlot + 1) return;
    if (!forceBoat && Sim.reachable(w, mySlot + 1, cell)) { act({ k: "attack", cell, ratio }); runStats.attacks++; Audio2.ui(); }
    else { act({ k: "boat", cell, ratio }); runStats.attacks++; }
  }
  function mySlotIdx() { return lobby.players.findIndex(p => p.id === Net.myId); }
  // radiální menu (pravý klik): útok / loď / stavby / jaderné
  let radialCell = -1, selectedShip = null;
  function showRadial(px, py, cell) {
    const w = W_(), me = mySlotIdx() + 1, st = $("stage").getBoundingClientRect(), r = $("radial");
    radialCell = cell; r.style.left = (px - st.left) + "px"; r.style.top = (py - st.top) + "px"; r.classList.remove("hidden");
    const mine = w.owner[cell] === me, land = !!w.terrain[cell], other = land && w.owner[cell] && !mine;
    r.querySelector("[data-r=attack]").disabled = !land || mine; r.querySelector("[data-r=boat]").disabled = !land || mine; r.querySelector("[data-r=ally]").disabled = !other; r.querySelector("[data-r=info]").disabled = !other; r.querySelector("[data-r=build]").disabled = !(mine || !land);
  }
  function hideRadial() { $("radial").classList.add("hidden"); }
  $("radial").querySelectorAll("button").forEach(b => b.onclick = (e) => {
    const k = b.dataset.r, cell = radialCell; hideRadial();
    if (k === "attack") doAttackOrBoat(cell, false); else if (k === "boat") doAttackOrBoat(cell, true);
    else if (k === "build") showBuildMenu(e.clientX, e.clientY, cell, !W_().terrain[cell]);
    else if (k === "ally") act({ k: "ally", cell });
    else if (k === "info") { const o = W_().owner[cell]; const pl = lobby.players[o - 1]; const r = role === "client" ? remoteP.find(x => x[0] === pl.id) : null; const wp = role !== "client" ? world.players[o - 1] : null; const cells = wp ? world.cells[o] : (r ? r[2] : 0), tr = wp ? wp.troops : (r ? r[1] : 0), g = wp ? wp.gold : (r ? r[5] : 0); toast(Lang("info", pl.name, Math.round(100 * cells / landTotal()), fmtK(tr), fmtK(g)), 4000); }
  });
  // kamera z klávesnice
  const camKeys = {};
  window.addEventListener("keydown", (e) => { if (e.target.tagName === "INPUT" || phase !== "game") return; const k = e.key.toLowerCase(); camKeys[k] = true; if (k === "c") centerOnMe(); if (k === "q") Render.zoomAt(innerWidth / 2, innerHeight / 2, 1 / 1.2); if (k === "e") Render.zoomAt(innerWidth / 2, innerHeight / 2, 1.2); });
  window.addEventListener("keyup", (e) => { camKeys[e.key.toLowerCase()] = false; });
  function camTick(dt) { let dx = 0, dy = 0; if (camKeys["a"] || camKeys["arrowleft"]) dx += 1; if (camKeys["d"] || camKeys["arrowright"]) dx -= 1; if (camKeys["w"] || camKeys["arrowup"]) dy += 1; if (camKeys["s"] || camKeys["arrowdown"]) dy -= 1; if (dx || dy) Render.pan(dx * 500 * dt, dy * 500 * dt); }
  function showBuildMenu(px, py, cell, water, nukesOnly) {
    const m = $("build-menu"); const mp = myInfo(); const gold = mp ? mp.gold : 0; const dis = new Set(lobby.opts.disabled || []);
    const btn = (type) => `<button data-type="${type}" ${dis.has(type) ? "disabled" : ""}><span>${Lang.unit(type)}</span><b>${U[type].cost}</b></button>`;
    const nukes = `<div class="hd">${Lang("nukesHd")}</div>${["atom", "hydrogen", "mirv"].map(t => btn(t)).join("")}`;
    m.innerHTML = nukesOnly ? nukes : water ? `<div class="hd">${Lang("navy")}</div>${btn("warship")}` : `<div class="hd">${Lang("build")}</div>${["city", "defense", "port", "factory", "silo", "sam"].map(t => btn(t)).join("")}<div class="hd">${Lang("navy")}</div>${btn("warship")}${nukes}`;
    m.querySelectorAll("button").forEach(b => { const type = b.dataset.type; if (!b.disabled && gold < U[type].cost) b.style.opacity = .5;
      b.onclick = () => { hideBuildMenu(); const w = W_();
        if (["atom", "hydrogen", "mirv"].includes(type)) { if (w.owner[cell] && w.owner[cell] !== mySlotIdx() + 1) act({ k: "nuke", type, cell }); else setTool({ type, nuke: true }); }
        else if (type === "warship") { if (!w.terrain[cell]) act({ k: "build", type, cell }); else setTool({ type }); }
        else act({ k: "build", type, cell }); }; });
    const st = $("stage").getBoundingClientRect(); m.style.left = Math.min(px - st.left, st.width - 280) + "px"; m.style.top = Math.min(py - st.top, st.height - 260) + "px"; m.classList.remove("hidden");
  }
  function hideBuildMenu() { $("build-menu").classList.add("hidden"); }
  function setTool(t) { tool = t; $("hud-tool").classList.toggle("hidden", !t); if (t) $("tool-label").textContent = Lang("pickTarget", Lang.unit(t.type)); }
  $("tool-cancel").onclick = () => setTool(null);
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") { setTool(null); hideBuildMenu(); hideRadial(); } });
  function myInfo() { if (role !== "client") { const p = world && world.players.find(x => x.id === Net.myId); return p ? { gold: p.gold, troops: p.troops, max: p.max, grow: p.growRate } : null; } const r = remoteP.find(x => x[0] === Net.myId); return r ? { gold: r[5], troops: r[1], max: r[6] } : null; }
  function centerOnMe() { const c = centroids[mySlotIdx()]; if (c) { Render.centerOn(c.x, c.y); } }
  let paintBatch = [];
  function brushAt(cell, val) { if (cell < 0) return; const r = 3, cx = cell % Sim.GW, cy = (cell / Sim.GW) | 0, list = []; for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) { const xx = cx + x, yy = cy + y; if (xx < 0 || yy < 0 || xx >= Sim.GW || yy >= Sim.GH || x * x + y * y > r * r + 1) continue; list.push(Sim.idx(xx, yy)); } if (role === "client") { for (const i of list) cw.terrain[i] = val; Render.applyTerrain(list.map(i => (i << 1) | val)); paintBatch.push(...list); } else act({ k: "paint", cells: list, val }); }
  function sendPaintBatch() { if (!paintBatch.length) return; act({ k: "paint", cells: [...new Set(paintBatch)], val: painting ?? brushVal }); paintBatch = []; }
  $("brush-land").onclick = () => { brushVal = 1; $("brush-land").classList.add("active"); $("brush-water").classList.remove("active"); };
  $("brush-water").onclick = () => { brushVal = 0; $("brush-water").classList.add("active"); $("brush-land").classList.remove("active"); };
  $("ratio").oninput = (e) => { ratio = e.target.value / 100; $("ratio-val").textContent = e.target.value + " %"; };
  $("work").oninput = (e) => { $("work-val").textContent = e.target.value + " %"; act({ k: "work", v: e.target.value / 100 }); };
  const HOTKEYS = ["city", "factory", "port", "defense", "warship", "silo", "sam", "atom", "hydrogen", "mirv"];
  window.addEventListener("keydown", (e) => { if (e.target.tagName === "INPUT" || phase !== "game") return; const n = e.key === "0" ? 10 : parseInt(e.key); if (!(n >= 1 && n <= 10)) return;
    if (e.shiftKey) { $("ratio").value = n * 10; $("ratio").dispatchEvent(new Event("input")); return; }
    const type = HOTKEYS[n - 1]; if (!type || (lobby.opts.disabled || []).includes(type)) return; setTool(["atom", "hydrogen", "mirv"].includes(type) ? { type, nuke: true } : { type }); });
  function renderKeys() {
    const b = $("bb-keys"); if (b.childElementCount !== HOTKEYS.length) b.innerHTML = HOTKEYS.map((t, i) => `<button data-t="${t}"><small>${i === 9 ? 0 : i + 1}</small>${ICON[t]}<b>0</b></button>`).join("");
    const me = mySlotIdx() + 1, counts = {}; for (const x of (role === "client" ? (view.buildings || []) : world.buildings)) if (x.owner === me) counts[x.type] = (counts[x.type] || 0) + 1;
    [...b.children].forEach(el => { const t = el.dataset.t; el.querySelector("b").textContent = counts[t] || 0; el.classList.toggle("armed", !!(tool && tool.type === t)); el.disabled = (lobby.opts.disabled || []).includes(t); el.onclick = () => setTool(tool && tool.type === t ? null : (["atom", "hydrogen", "mirv"].includes(t) ? { type: t, nuke: true } : { type: t })); });
  }
  const ICON = { city: "🏙", factory: "🏭", port: "⚓", defense: "🛡", warship: "🚢", silo: "🚀", sam: "📡", atom: "☢", hydrogen: "💥", mirv: "🌐" };
  function firstCellOf(slot) { const w = W_(); for (let i = 0; i < Sim.N; i += 3) if (w.owner[i] === slot) return i; return -1; }
  const landTotal = () => { const w = W_(); if (!w._land || w._landT !== w.terrain) { w._land = w.terrain.reduce((a, b) => a + b, 0) || 1; w._landT = w.terrain; } return w._land; };

  // ---------- události
  const nameOf = (id) => { const p = lobby.players.find(x => x.id === id); return p ? p.name : "?"; };
  function handleEvents(events) {
    for (const e of events) {
      const mine = e.id === Net.myId;
      if (e.t === "count") Audio2.countdown(); else if (e.t === "go") Audio2.go();
      else if (e.t === "drawStart") { toast(Lang.phaseText("draw"), 2500); }
      else if (e.t === "spawnStart") { toast(Lang.phaseText("spawn"), 2500); Audio2.whistle(); }
      else if (e.t === "spawn") { if (mine) Audio2.pickup(); }
      else if (e.t === "attack") { if (mine) Audio2.dash(); }
      else if (e.t === "noAdj") { if (mine) toast(Lang("noAdj")); }
      else if (e.t === "needPort") { if (mine) toast(Lang("needPort"), 2500); }
      else if (e.t === "needSilo") { if (mine) toast(Lang("needSilo"), 2500); }
      else if (e.t === "needCoast") { if (mine) toast(Lang("needCoast"), 2500); }
      else if (e.t === "noGold") { if (mine) toast(Lang("noGold")); }
      else if (e.t === "occupied") { if (mine) toast(Lang("occupied")); }
      else if (e.t === "built") { if (mine) { Audio2.pickup(); } }
      else if (e.t === "upgraded") { if (mine) { Audio2.pickup(); const sx = Render.W / Sim.GW, sy = Render.H / Sim.GH; Render.popup((Sim.cx(e.cell) + 0.5) * sx, (Sim.cy(e.cell) + 0.5) * sy - 10, Lang.unit(e.type) + " " + e.lvl, "#FFCF5A"); } }
      else if (e.t === "allyExpiring") { const me = mySlotIdx() + 1; if (e.a === me || e.b === me) { expiring.add(e.a === me ? e.b : e.a); $("events").dataset.key = ""; } }
      else if (e.t === "renewed") { const me = mySlotIdx() + 1; if (e.a === me || e.b === me) { expiring.delete(e.a === me ? e.b : e.a); $("events").dataset.key = ""; toast(Lang("renewed", (lobby.players[(e.a === me ? e.b : e.a) - 1] || {}).name)); } }
      else if (e.t === "boat") { if (mine) { toast(Lang("boatSent")); Audio2.dash(); } }
      else if (e.t === "landing") { Audio2.bump(); }
      else if (e.t === "sunk") { Audio2.bomb(); }
      else if (e.t === "nukeLaunch") { Audio2.whistle(); }
      else if (e.t === "boom") { const sx = Render.W / Sim.GW, sy = Render.H / Sim.GH; Render.ring((Sim.cx(e.cell) + 0.5) * sx, (Sim.cy(e.cell) + 0.5) * sy, "#FF9A3C", e.radius * sx); Render.burst((Sim.cx(e.cell) + 0.5) * sx, (Sim.cy(e.cell) + 0.5) * sy, "#FFCF5A", 30); Audio2.bomb(); }
      else if (e.t === "intercept") { const sx = Render.W / Sim.GW, sy = Render.H / Sim.GH; Render.popup((Sim.cx(e.cell) + 0.5) * sx, (Sim.cy(e.cell) + 0.5) * sy, "SAM ✓", "#5EE1D0"); Audio2.tick(); }
      else if (e.t === "shell") { Audio2.tick(); }
      else if (e.t === "trade" || e.t === "train") { const mySl = mySlotIdx() + 1; if (e.owner === mySl || e.to === mySl) { const sx = Render.W / Sim.GW, sy = Render.H / Sim.GH; Render.popup((e.x + 0.5) * sx, (e.y + 0.5) * sy, "+" + Math.round(e.gold * (e.to === mySl && e.owner !== mySl ? 0.6 : 1)) + " ●", "#FFCF5A"); } }
      else if (e.t === "allied") { const me = mySlotIdx() + 1; if (e.a === me || e.b === me) { toast(Lang("allied", (lobby.players[(e.a === me ? e.b : e.a) - 1] || {}).name), 3000); Audio2.pickup(); } }
      else if (e.t === "allyReject") { if (e.to === mySlotIdx() + 1) toast(Lang("allyRejected", (lobby.players[e.from - 1] || {}).name)); }
      else if (e.t === "betray") { const me = mySlotIdx() + 1; if (e.b === me) { toast(Lang("betrayed", (lobby.players[e.a - 1] || {}).name), 4000); Audio2.bomb(); } else if (e.a === me) toast(Lang("youBetrayed"), 4000); }
      else if (e.t === "allyEnd") { const me = mySlotIdx() + 1; if (e.a === me || e.b === me) toast(Lang("allyEnd", (lobby.players[(e.a === me ? e.b : e.a) - 1] || {}).name)); }
      else if (e.t === "captured") { const mySl = mySlotIdx() + 1; if (e.by === mySl) { Audio2.pickup(); } const sx = Render.W / Sim.GW, sy = Render.H / Sim.GH; Render.popup((e.x + 0.5) * sx, (e.y + 0.5) * sy, "⚓ +" + e.gold, "#FF5E7E"); }
      else if (e.t === "out") { toast(Lang("eliminated", nameOf(e.id)), 2000); Audio2.bomb(); }
      else if (e.t === "end") Audio2.whistle();
    }
  }

  // ---------- HUD + kreslení
  function beginGameUI() { show("hud"); setTool(null); hideBuildMenu(); hideRadial(); centeredOnce = false; Render.cam.z = 1; Render.cam.ox = 0; Render.cam.oy = 0; $("hud-hint").textContent = Lang("hintPc"); setTimeout(() => { $("hud-hint").textContent = ""; }, 12000); $("btn-spec-leave").classList.add("hidden"); $("hud-board").querySelector("tbody").innerHTML = ""; $("events").innerHTML = ""; $("events").dataset.key = ""; }
  function buildView() {
    const elapsed = (performance.now() - roundStart) / 1000;
    let players, attacks, ph, cd, time;
    if (role === "client") {
      players = lobby.players.map((lp, i) => { const r = remoteP.find(x => x[0] === lp.id) || [lp.id, 0, 0, 1, 0, 0, 0]; return { id: lp.id, slot: i, name: lp.name, color: Sim.COLORS[lp.ci], troops: r[1], cells: r[2], alive: !!r[3], spawned: !!r[4], gold: r[5], traitor: !!r[8], me: lp.id === Net.myId }; });
      attacks = remoteA; ph = view.phase; cd = view.countdown; time = view.time;
    } else {
      players = world.players.map(p => ({ id: p.id, slot: p.slot, name: p.name, color: Sim.colorOf(world, p), troops: p.troops, cells: world.cells[p.slot + 1], alive: p.alive, spawned: p.spawned, gold: p.gold, traitor: p.traitor > world.t, me: p.id === Net.myId }));
      attacks = attacksPayload(); ph = world.phase; cd = world.countdown; time = world.time;
    }
    for (const p of players) { const c = centroids[p.slot]; if (c) { p.cx = c.x; p.cy = c.y; } p.meLabel = Lang("you").toUpperCase(); }
    if (role === "client") (view.buildings || []).forEach(b => b.selected = b.id === selectedShip);
    const extra = role === "client" ? { buildings: view.buildings || [], boats: view.boats || [], nukes: view.nukes || [], ships: view.ships || [], trains: view.trains || [] } : { buildings: world.buildings.map(b => ({ id: b.id, type: b.type, cell: b.cell, owner: b.owner, lvl: b.lvl || 1, x: b.x, y: b.y, selected: b.id === selectedShip, color: colorSlot(b.owner) })), boats: world.boats.map(b => ({ x: b.x, y: b.y, tx: b.tx, ty: b.ty, troops: b.troops, color: colorSlot(b.from) })), nukes: world.nukes.map(n => ({ fromCell: n.fromCell, cell: n.cell, t: n.t, radius: n.radius })), ships: world.ships.map(b => ({ x: b.x, y: b.y, tx: b.tx, ty: b.ty, color: colorSlot(b.owner) })), trains: world.trains.map(b => ({ x: b.x, y: b.y, color: colorSlot(b.owner) })) };
    return Object.assign({ players, attacks, phase: ph, countdown: cd, time, hover, brush: 3, brushVal: painting ?? brushVal, showMe: ph === "play" && elapsed < 25 ? 1 : 0, tool: !!tool, toolNuke: !!(tool && tool.nuke), toolRadius: tool ? (tool.nuke ? (U[tool.type].radius + (tool.type === "mirv" ? U.mirv.spread : 0)) : (U[tool.type].radius || (tool.type === "factory" ? FR_CONFIG.tuning.trainRange : tool.type === "port" ? 0 : 0))) : 0, alliances: W_().alliances, me: mySlotIdx() + 1, zoom: Render.cam.z }, extra);
  }
  function updateCentroids() { const w = W_(); const sx = new Float64Array(9), sy = new Float64Array(9), n = new Int32Array(9); for (let i = 0; i < Sim.N; i++) { const o = w.owner[i]; if (!o) continue; sx[o] += i % Sim.GW; sy[o] += (i / Sim.GW) | 0; n[o]++; } centroids = {}; for (let o = 1; o <= 8; o++) if (n[o]) centroids[o - 1] = { x: sx[o] / n[o] + 0.5, y: sy[o] / n[o] + 0.5 }; }
  let lastFrame = performance.now(), hudAcc = 0, centeredOnce = false;
  function frame(now) {
    const dt = Math.min(0.1, (now - lastFrame) / 1000); lastFrame = now;
    if (phase === "game" || phase === "results") {
      centroidAcc += dt; if (centroidAcc > 0.4) { centroidAcc = 0; updateCentroids(); if (!centeredOnce && W_().phase === "play" && centroids[mySlotIdx()]) { centeredOnce = true; Render.cam.z = 2; centerOnMe(); } }
      camTick(dt);
      const v = buildView(); Render.draw(v, dt);
      hudAcc += dt; if (hudAcc > 0.25 && phase === "game") { hudAcc = 0; renderHud(v); }
    } else Render.draw({ players: [], attacks: [], phase: "idle" }, dt);
    requestAnimationFrame(frame);
  }
  function renderHud(v) {
    const t = Math.max(0, Math.round(v.phase === "play" ? v.time : v.countdown)); $("hud-time").textContent = v.phase === "play" ? `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}` : t;
    $("hud-phase").textContent = v.phase === "draw" ? Lang.phaseText("draw") : v.phase === "spawn" ? Lang.phaseText("spawn") : "";
    const mp = v.players.find(p => p.me), mi = myInfo();
    $("bottom").classList.toggle("hidden", v.phase !== "play"); $("hud-brush").classList.toggle("hidden", v.phase !== "draw");
    if (mp && mi) { const max = mi.max || 1; $("bb-fill").style.width = Math.min(100, 100 * mp.troops / max) + "%"; $("bb-troops").textContent = `${fmtK(mp.troops)} / ${fmtK(max)}`; $("bb-gold").textContent = "● " + fmtK(mi.gold); $("bb-grow").textContent = "+" + fmtK(mi.grow || 0) + "/s"; }
    const land = landTotal(), sorted = [...v.players].sort((a, b) => b.cells - a.cells);
    const rows = sorted.slice(0, 12).concat(mp && sorted.indexOf(mp) >= 12 ? [mp] : []);
    const tb = $("hud-board").querySelector("tbody");
    tb.innerHTML = rows.map(p => `<tr class="${p.me ? "me" : ""}${p.alive ? "" : " dead"}"><td>${sorted.indexOf(p) + 1}</td><td><span class="dot" style="background:${p.color}"></span><span class="nm"></span></td><td>${(100 * p.cells / land).toFixed(1)}</td><td>${fmtK(p.gold || 0)}</td><td>${fmtK(p.troops)}</td></tr>`).join("");
    [...tb.querySelectorAll(".nm")].forEach((el, i) => el.textContent = rows[i].name);
    if (v.phase === "play") { renderKeys(); renderEvents(); }
    $("btn-spec-leave").classList.toggle("hidden", !(mp && !mp.alive && v.phase === "play"));
  }
  const expiring = new Set();
  function renderEvents() {
    const w = W_(), me = mySlotIdx() + 1, reqs = (w.requests || []).filter(r => r.to === me);
    const exp = [...expiring].filter(o => w.alliances && w.alliances.has(Sim.akey(me, o)));
    const ev = $("events"); const key = reqs.map(r => r.from).join(",") + "|" + exp.join(",");
    if (ev.dataset.key === key) return; ev.dataset.key = key;
    ev.innerHTML = reqs.map(r => `<div class="ev"><span>${Lang("allyReq", (lobby.players[r.from - 1] || {}).name || "?")}</span><div class="acts"><button class="pass" data-acc="${r.from}">${Lang("accept")}</button><button data-rej="${r.from}">${Lang("reject")}</button></div></div>`).join("")
      + exp.map(o => `<div class="ev" style="border-left-color:#FFCF5A"><span>${Lang("allyExpiring", (lobby.players[o - 1] || {}).name || "?")}</span><div class="acts"><button class="pass" data-renew="${o}">${Lang("renew")}</button><button data-ign="${o}">${Lang("ignore")}</button></div></div>`).join("");
    ev.querySelectorAll("[data-renew]").forEach(b => b.onclick = () => { const o = +b.dataset.renew; const cell = firstCellOf(o); if (cell >= 0) act({ k: "ally", cell }); expiring.delete(o); ev.dataset.key = ""; });
    ev.querySelectorAll("[data-ign]").forEach(b => b.onclick = () => { expiring.delete(+b.dataset.ign); ev.dataset.key = ""; });
    ev.querySelectorAll("[data-acc]").forEach(b => b.onclick = () => act({ k: "allyAccept", from: +b.dataset.acc }));
    ev.querySelectorAll("[data-rej]").forEach(b => b.onclick = () => act({ k: "allyReject", from: +b.dataset.rej }));
  }
  $("btn-spec-leave").onclick = () => { if (role === "client") leaveToMenu(); else if (role === "solo") { hostLoopStop(); world.phase = "end"; world.results = Sim.results(world); endRound(world.results); } else toast(Lang("hostCantLeave")); };

  // ---------- výsledky
  function endRound(results) {
    phase = "results"; hostLoopStop(); myResult = results.find(r => r.id === Net.myId);
    if (myResult) { Storage.addCoins(myResult.coins); const st = Storage.stats; Storage.setStats({ games: st.games + 1, wins: st.wins + (myResult.win ? 1 : 0), best: Math.max(st.best, myResult.pct) }); Missions.afterGame(myResult, runStats); setTimeout(() => myResult.win ? Audio2.win() : Audio2.lose(), 400); }
    const top = results[0];
    $("res-title").textContent = myResult && myResult.win ? Lang("youWin") : Lang("winner", top.name);
    $("res-list").innerHTML = results.map(r => `<div class="res-row${r.id === Net.myId ? " me" : ""}"><span>${r.rank}.</span><span class="dot" style="background:${r.color}"></span><span><span class="nm"></span><div class="bar"><i style="width:${Math.min(100, r.pct * 1.6)}%;background:${r.color}"></i></div></span><span class="pct">${r.value}</span></div>`).join("");
    [...$("res-list").querySelectorAll(".nm")].forEach((el, i) => el.textContent = results[i].name);
    $("res-coins").textContent = myResult ? Lang("coinsEarned", myResult.coins) : "";
    $("btn-double").classList.toggle("hidden", !myResult || myResult.coins <= 0); $("btn-double").disabled = false;
    $("btn-again").classList.remove("hidden"); $("res-wait").classList.add("hidden");
    show("results"); if (role === "host") Net.send("end", { results });
    startAgain();
  }
  $("btn-double").onclick = async () => { if (doubled || !myResult) return; $("btn-double").disabled = true; const ok = await Monetization.showRewarded(); if (ok) { doubled = true; Storage.addCoins(myResult.coins); $("res-coins").textContent = Lang("coinsEarned", myResult.coins * 2); Audio2.reward(); $("btn-double").classList.add("hidden"); } else { $("btn-double").disabled = false; toast(Lang("adUnavailable")); } };

  // ---------- Hrát znovu: hlasování všech lidí, 20 s odpočet; pak hostitel dostane lobby s nastavením
  let againVotes = new Set(), againLeft = 0, againTick = null;
  const humansNow = () => (role === "client" ? lobby.players : (world ? world.players : [])).filter(p => !p.bot);
  function startAgain() { againVotes = new Set(); againLeft = 20; clearInterval(againTick); updateAgain(); againTick = setInterval(() => { againLeft--; updateAgain(); if (againLeft <= 0) { clearInterval(againTick); if (role !== "client") goLobbyAgain(); } }, 1000); }
  function updateAgain() { const n = humansNow().length; $("btn-again").textContent = (againVotes.has(Net.myId) ? Lang("waitingOthers") : Lang("playAgain")) + (n > 1 ? ` ${againVotes.size}/${n}` : "") + ` · ${againLeft}s`; }
  $("btn-again").onclick = () => { if (againVotes.has(Net.myId)) return; Audio2.ui(); againVotes.add(Net.myId); if (role === "client") Net.send("again", {}, lobby.hostId); else { Net.send("againVotes", [...againVotes]); checkAgain(); } updateAgain(); };
  Net.on("again", (p, from) => { if (role !== "host" || phase !== "results") return; againVotes.add(from); Net.send("againVotes", [...againVotes]); updateAgain(); checkAgain(); });
  Net.on("againVotes", (v) => { if (role === "client" && phase === "results") { againVotes = new Set(v); updateAgain(); } });
  function checkAgain() { if (humansNow().every(p => againVotes.has(p.id))) { clearInterval(againTick); goLobbyAgain(); } }
  function goLobbyAgain() { openLobby(role === "solo" ? "solo" : Net.kind); if (role === "host") syncLobby(); }
  $("btn-res-menu").onclick = () => leaveToMenu();
  Missions.onComplete((m) => { toast(Lang("missionDone", m.reward)); Audio2.reward(); });

  // ---------- úkoly, obchod (zjednodušené)
  function openMissions() { show("missions"); for (const [id, list] of [["daily-list", Missions.daily()], ["weekly-list", Missions.weekly()]]) { $(id).innerHTML = list.map(m => `<div class="mission${m.claimed ? " done" : ""}"><div class="m-head"><span></span><span class="m-reward"><span class="coin"></span>${m.reward}</span></div><div class="m-bar"><i style="width:${Math.min(100, 100 * m.progress / m.target)}%"></i></div><div class="m-prog">${m.claimed ? "✓" : Math.round(m.progress) + " / " + m.target}</div></div>`).join(""); [...$(id).querySelectorAll(".m-head > span:first-child")].forEach((el, i) => el.textContent = Lang.mission(list[i].type, list[i].target)); } }
  function openShop() { show("shop"); refreshMenu(); $("shop-coins").textContent = Storage.coins; $("iap-note").classList.toggle("hidden", Monetization.native); $("hat-grid").innerHTML = ""; $("pat-grid").innerHTML = ""; Monetization.loadPrices(); }
  document.querySelectorAll(".iap").forEach(b => b.onclick = async () => { const ok = await Monetization.purchase(b.dataset.iap); if (ok) { toast(Lang("done")); openShop(); } });
  $("btn-restore").onclick = async () => { const ok = await Monetization.restore(); toast(ok ? Lang("restored") : Lang("nothingToRestore")); };

  window.__dbg = () => ({ world, cw, lobby, phase });
  Render.init($("game")); Lang.apply(); refreshMenu(); show("menu"); requestAnimationFrame(frame);
  Monetization.init().then(async () => { const g = await Monetization.claimWebPurchases(); if (g.length) { toast(Lang("purchaseActive")); refreshMenu(); } });
  const bonus = Missions.dailyBonus(); if (bonus) setTimeout(() => { toast(Lang("dailyBonus", bonus.reward, bonus.streak), 3000); Audio2.reward(); refreshMenu(); }, 600);
  if (new URLSearchParams(location.search).get("create")) { history.replaceState(null, "", location.pathname); setTimeout(() => $("btn-create").click(), 150); }
  const roomParam = new URLSearchParams(location.search).get("room");
  if (roomParam) { history.replaceState(null, "", location.pathname); $("code-input").value = roomParam.toUpperCase(); setTimeout(() => join(roomParam.toUpperCase()), 300); }
})();
