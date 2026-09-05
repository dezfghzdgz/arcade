// ZigDash – jádro hry.
// Mechanika: kulička stoupá tunelem, sama se odráží od stěn. Jediný vstup = ťuknutí, které
// obrátí vodorovný směr. Překážky padají shora, tempo roste s každým bodem.
window.Game = (() => {
  const W = 360, WALL = 14;
  let H = 640; // výška plátna se dopočítá podle displeje (vyplní celou obrazovku)
  const T = ZD_CONFIG.tuning;

  // Kuličky. type: solid | rainbow (mění barvu) | ring (prstenec) | core (tmavé jádro) | ghost (průhledná)
  const SKINS = {
    amber:  { c: "#FFCF5A", price: 0,    name: "Amber", cs: "Jantar" },
    coral:  { c: "#FF5E7E", price: 120,  name: "Coral", cs: "Korál" },
    aqua:   { c: "#5EE1D0", price: 120,  name: "Aqua", cs: "Akva" },
    lime:   { c: "#B6FF5A", price: 200,  name: "Lime", cs: "Limeta" },
    sky:    { c: "#6FC3FF", price: 200,  name: "Sky", cs: "Nebe" },
    white:  { c: "#FFFFFF", price: 250,  name: "Snow", cs: "Sníh" },
    violet: { c: "#B98CFF", price: 300,  name: "Violet", cs: "Fialka" },
    orange: { c: "#FF9A3C", price: 300,  name: "Lava" },
    pink:   { c: "#FF7AD9", price: 400,  name: "Neon" },
    mint:   { c: "#8CFFC1", price: 400,  name: "Mint", cs: "Máta" },
    ruby:   { c: "#FF3355", price: 500,  name: "Ruby", cs: "Rubín", type: "core" },
    gold:   { c: "#FFD700", price: 600,  name: "Gold", cs: "Zlato", type: "ring" },
    ice:    { c: "#D8F6FF", price: 600,  name: "Ice", cs: "Led", type: "ring" },
    ghost:  { c: "#FFFFFF", price: 800,  name: "Ghost", cs: "Duch", type: "ghost" },
    ember:  { c: "#FF6A00", price: 900,  name: "Ember", cs: "Uhlík", type: "core" },
    rainbow:{ c: "#FF5E7E", price: 1500, name: "Rainbow", cs: "Duha", type: "rainbow" },
  };

  // Pozadí. top/bottom = gradient, wall = stěny, fever = barva při FEVER, grid = mřížka
  const THEMES = {
    night:  { name: "Night", cs: "Noc",     price: 0,    top: "#1B0E38", bottom: "#120826", wall: "#8A5CFF", fever: "#2B1150", grid: "rgba(255,255,255,0.045)" },
    sunset: { name: "Sunset", cs: "Západ",   price: 300,  top: "#3A1240", bottom: "#1C0A2A", wall: "#FF8A5B", fever: "#5A1A3A", grid: "rgba(255,200,150,0.06)" },
    ocean:  { name: "Ocean", cs: "Oceán",   price: 300,  top: "#082A4A", bottom: "#04121F", wall: "#3DA9FF", fever: "#0B3E6A", grid: "rgba(150,220,255,0.06)" },
    forest: { name: "Forest", cs: "Les",     price: 400,  top: "#0B2E22", bottom: "#05170F", wall: "#4FD37A", fever: "#124A2E", grid: "rgba(180,255,200,0.06)" },
    lava:   { name: "Lava", cs: "Láva",    price: 500,  top: "#2E0B0B", bottom: "#170404", wall: "#FF4D1F", fever: "#4A1010", grid: "rgba(255,150,100,0.07)" },
    candy:  { name: "Candy", cs: "Bonbón",  price: 500,  top: "#3A0F3F", bottom: "#200A28", wall: "#FF7AD9", fever: "#5A1A5A", grid: "rgba(255,180,240,0.07)" },
    void:   { name: "Void", cs: "Prázdno", price: 700,  top: "#050508", bottom: "#000000", wall: "#3A3A4A", fever: "#1A1A2E", grid: "rgba(255,255,255,0.03)" },
    retro:  { name: "Retro",   price: 900,  top: "#0A0A1A", bottom: "#000010", wall: "#00FFC8", fever: "#1A0A3A", grid: "rgba(0,255,200,0.12)" },
  };

  // Tvary kuličky. Kreslí se vycentrované, r = poloměr; rotují podle směru.
  const SHAPES = {
    circle:   { name: "Ball", cs: "Koule",     price: 0 },
    square:   { name: "Cube", cs: "Kostka",    price: 200 },
    triangle: { name: "Arrow", cs: "Šipka",     price: 200 },
    diamond:  { name: "Diamond", cs: "Diamant",   price: 300 },
    hexagon:  { name: "Hexagon", cs: "Šestihran", price: 300 },
    star:     { name: "Star", cs: "Hvězda",    price: 500 },
    heart:    { name: "Heart", cs: "Srdce",     price: 500 },
    donut:    { name: "Donut",     price: 700 },
    saw:      { name: "Saw", cs: "Pila",      price: 900 },
  };

  // Aury = co se táhne za kuličkou.
  const AURAS = {
    tail:    { name: "Tail", cs: "Ocas",     price: 0 },     // původní slábnoucí puntíky
    none:    { name: "None", cs: "Nic",      price: 50 },
    line:    { name: "Line", cs: "Čára",     price: 250 },   // tenká linka po celé trajektorii (cik-cak)
    dots:    { name: "Beads", cs: "Korálky",  price: 300 },
    comet:   { name: "Comet", cs: "Kometa",   price: 400 },   // tlustá zářící stopa
    neon:    { name: "Neon",     price: 600 },   // dvojitá obrysová linka
    echo:    { name: "Echo", cs: "Ozvěna",   price: 700 },   // průhledné kopie tvaru
    sparks:  { name: "Sparks", cs: "Jiskry",   price: 800 },   // sype částice
    rainbow: { name: "Rainbow", cs: "Duha",     price: 1000 },
    bolt:    { name: "Bolt", cs: "Blesk",    price: 1200 },  // zubatá elektrická linka
  };

  // Efekty při odrazu a smrti.
  const FX = {
    basic:     { name: "Basic", cs: "Základ",    price: 0 },
    ripple:    { name: "Ripples", cs: "Kruhy",     price: 300 },
    confetti:  { name: "Confetti", cs: "Konfety",   price: 500 },
    pixel:     { name: "Pixels", cs: "Pixely",    price: 600 },
    shockwave: { name: "Shockwave", cs: "Rázovka",   price: 700 },
    fireworks: { name: "Fireworks", cs: "Ohňostroj", price: 900 },
    lightning: { name: "Lightning", cs: "Blesky",    price: 1200 },
  };

  let canvas, ctx, dpr = 1, scale = 1;
  let cb = {};
  let state = "idle";
  let last = 0, t = 0;

  // stav běhu
  let player, obstacles, gems, particles, popups, rings, bolts, timers;
  let score, coins, combo, bestCombo, mult, scroll, sideSpeed;
  let shake, flash, bgOffset, spawnY, feverFlash, deadTimer;
  let continued;

  function skinColor() {
    const sk = SKINS[Storage.skin] || SKINS.amber;
    if (sk.type === "rainbow") return `hsl(${(t * 120) % 360}, 95%, 65%)`;
    return sk.c;
  }
  const theme = () => THEMES[Storage.bg] || THEMES.night;

  // ---------------------------------------------------------------- utility
  const L = (...a) => window.Lang ? Lang(...a) : a[0];
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rectDist = (cx, cy, r) => {
    const px = clamp(cx, r.x, r.x + r.w), py = clamp(cy, r.y, r.y + r.h);
    return Math.hypot(cx - px, cy - py);
  };

  // ---------------------------------------------------------------- init
  function init(el, callbacks) {
    canvas = el; ctx = canvas.getContext("2d"); cb = callbacks || {};
    resize();
    window.addEventListener("resize", resize);
    reset();
    requestAnimationFrame(loop);
  }

  function resize() {
    const stage = canvas.parentElement;
    const sw = stage.clientWidth, sh = stage.clientHeight;
    scale = sw / W;
    H = Math.round(sh / scale);
    if (H < 600) { scale = sh / 600; H = 600; }      // široké displeje (PC) – letterbox po stranách
    if (H > 860) { scale = sh / 860; H = 860; }      // extrémně vysoké displeje
    if (player) player.y = H * 0.74;
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(W * scale * dpr);
    canvas.height = Math.round(H * scale * dpr);
    canvas.style.width = Math.round(W * scale) + "px";
    canvas.style.height = Math.round(H * scale) + "px";
    stage.style.setProperty("--cw", Math.round(W * scale) + "px");
  }

  function reset() {
    player = { x: W / 2, y: H * 0.74, r: 11, dir: 1, shield: false, invuln: 0, trail: [], squash: 0 };
    obstacles = []; gems = []; particles = []; popups = []; rings = []; bolts = []; timers = [];
    score = 0; coins = 0; combo = 0; bestCombo = 0; mult = 1;
    scroll = T.baseScroll; sideSpeed = T.baseSideSpeed;
    shake = 0; flash = 0; bgOffset = 0; spawnY = -80; feverFlash = 0; deadTimer = 0;
    continued = false;
    // rozjezd: pár lehkých překážek dopředu
    for (let i = 0; i < 3; i++) spawn(true);
  }

  function start() { reset(); state = "play"; cb.onHud && cb.onHud(hudData()); }

  // Oživení po reklamě: uklidit okolí, dát nesmrtelnost, jet dál.
  function revive() {
    obstacles = obstacles.filter(o => o.y > player.y + 60 || o.y < player.y - 320);
    player.invuln = 1.6; player.shield = false;
    combo = 0; mult = 1; continued = true;
    burst(player.x, player.y, 24, "#5EE1D0");
    Audio2.revive();
    state = "play";
    cb.onHud && cb.onHud(hudData());
  }

  function tap() {
    if (state !== "play") return;
    player.dir *= -1;
    player.squash = 1;
    Audio2.tap();
    for (let i = 0; i < 4; i++) particles.push(mkParticle(player.x, player.y, rnd(-40, 40), rnd(20, 90), skinColor(), 0.35));
  }

  // ---------------------------------------------------------------- generování
  // 0 -> 1 plynule podle skóre; nikdy nedosáhne 1, takže hra se zrychluje pořád, ale stále pomaleji
  const ramp = (r) => 1 - Math.exp(-score / r);
  function gapSize() { return 125 - 53 * ramp(T.difficultyRamp); }
  function spacing() { return 235 - 85 * ramp(T.difficultyRamp); }

  function spawn(easy) {
    const y = spawnY;
    const s = easy ? 0 : score;
    const roll = Math.random();
    let type;
    if (easy || s < 4) type = roll < 0.6 ? "bar" : "spike";
    else if (s < 15) type = roll < 0.45 ? "bar" : roll < 0.8 ? "spike" : "mover";
    else type = roll < 0.35 ? "bar" : roll < 0.6 ? "spike" : roll < 0.8 ? "mover" : "gate";

    if (type === "bar") {
      const gw = gapSize();
      const gx = rnd(WALL + 10, W - WALL - 10 - gw);
      obstacles.push({ type, y, h: 16, gx, gw, passed: false, near: 99 });
      placeGem(gx + gw / 2, y + 8, 0.7);
    } else if (type === "spike") {
      const side = Math.random() < 0.5 ? "left" : "right";
      const w = clamp(44 + s * 0.6, 44, 90), h = 54;
      obstacles.push({ type, y, side, w, h, passed: false, near: 99 });
      placeGem(side === "left" ? W - WALL - 30 : WALL + 30, y + h / 2, 0.55);
    } else if (type === "mover") {
      const w = 68;
      obstacles.push({ type, y, x: rnd(WALL, W - WALL - w), w, h: 16, vx: (Math.random() < 0.5 ? -1 : 1) * clamp(90 + s * 2, 90, 200), passed: false, near: 99 });
      placeGem(rnd(WALL + 20, W - WALL - 20), y - 60, 0.5);
    } else if (type === "gate") {
      const gw = gapSize() + 10;
      const gx = rnd(WALL + 4, W - WALL - 4 - gw);
      obstacles.push({ type, y, h: 46, gx, gw, passed: false, near: 99 });
      placeGem(gx + gw / 2, y + 23, 0.9);
    }
    // občas volný gem mezi překážkami
    if (Math.random() < 0.35) placeGem(rnd(WALL + 24, W - WALL - 24), y - spacing() * 0.5, 1);
    spawnY -= spacing();
  }

  function placeGem(x, y, chance) {
    if (Math.random() > chance) return;
    const shield = !player.shield && Math.random() < 0.05;
    gems.push({ x, y, r: 9, shield, bob: Math.random() * 6.28 });
  }

  // geometrie překážky jako obdélníky pro kolize
  function rects(o) {
    if (o.type === "bar") return [
      { x: WALL, y: o.y, w: o.gx - WALL, h: o.h },
      { x: o.gx + o.gw, y: o.y, w: W - WALL - (o.gx + o.gw), h: o.h },
    ];
    if (o.type === "spike") return [{ x: o.side === "left" ? WALL : W - WALL - o.w, y: o.y + 4, w: o.w, h: o.h - 8 }];
    if (o.type === "mover") return [{ x: o.x, y: o.y, w: o.w, h: o.h }];
    if (o.type === "gate") return [
      { x: WALL, y: o.y + 3, w: o.gx - WALL, h: o.h - 6 },
      { x: o.gx + o.gw, y: o.y + 3, w: W - WALL - (o.gx + o.gw), h: o.h - 6 },
    ];
    return [];
  }

  // ---------------------------------------------------------------- update
  function update(dt) {
    t += dt;
    bgOffset = (bgOffset + scroll * dt * 0.35) % 64;
    if (shake > 0) shake = Math.max(0, shake - dt * 18);
    if (flash > 0) flash = Math.max(0, flash - dt * 2.5);
    if (feverFlash > 0) feverFlash = Math.max(0, feverFlash - dt);
    updateParticles(dt);
    if (state !== "play") { if (state === "dead") deadTimer += dt; return; }

    // rychlosti
    scroll = T.baseScroll + (T.maxScroll - T.baseScroll) * ramp(T.scrollRamp);
    Music.set((scroll - T.baseScroll) / (T.maxScroll - T.baseScroll), mult > 1);
    sideSpeed = T.baseSideSpeed + (T.maxSideSpeed - T.baseSideSpeed) * ramp(T.sideRamp);

    // hráč
    player.x += player.dir * sideSpeed * dt;
    if (player.x - player.r <= WALL) { player.x = WALL + player.r; player.dir = 1; onBounce(); }
    if (player.x + player.r >= W - WALL) { player.x = W - WALL - player.r; player.dir = -1; onBounce(); }
    player.squash = Math.max(0, player.squash - dt * 6);
    player.invuln = Math.max(0, player.invuln - dt);
    player.trail.unshift({ x: player.x, y: player.y });
    // stopa se drží, dokud neodjede pod okraj obrazovky (aura až dolů)
    while (player.trail.length && player.trail[player.trail.length - 1].y > H + 30) player.trail.pop();
    if (player.trail.length > 900) player.trail.pop();
    if (Storage.active("aura") === "sparks" && Math.random() < 0.5)
      particles.push(mkParticle(player.x, player.y, rnd(-30, 30), rnd(0, 40), skinColor(), rnd(0.3, 0.6)));
    for (const p of player.trail) p.y += scroll * dt;

    // překážky
    for (const o of obstacles) {
      o.y += scroll * dt;
      if (o.type === "mover") {
        o.x += o.vx * dt;
        if (o.x <= WALL) { o.x = WALL; o.vx *= -1; }
        if (o.x + o.w >= W - WALL) { o.x = W - WALL - o.w; o.vx *= -1; }
      }
      // blízkost (pro near-miss)
      const rs = rects(o);
      for (const r of rs) {
        const d = rectDist(player.x, player.y, r) - player.r;
        if (d < o.near) o.near = d;
        if (d <= 0 && player.invuln <= 0) { hit(); return; }
      }
      // průlet
      if (!o.passed && o.y > player.y + player.r) {
        o.passed = true;
        combo++; bestCombo = Math.max(bestCombo, combo);
        addScore(1);
        Audio2.pass();
        if (o.near < 9) {
          addScore(T.nearMissBonus);
          popup(player.x, player.y - 26, L("close") + " +" + (T.nearMissBonus * mult), "#FF5E7E");
          Audio2.near(); Haptic.near(); shake = Math.max(shake, 0.6);
          Missions.event("near", 1);
        }
        updateFever();
      }
    }
    obstacles = obstacles.filter(o => o.y < H + 80);

    // gemy
    for (const g of gems) {
      g.y += scroll * dt; g.bob += dt * 5;
      if (!g.taken && Math.hypot(g.x - player.x, g.y - player.y) < g.r + player.r + 4) {
        g.taken = true;
        if (g.shield) {
          player.shield = true; Audio2.shield();
          popup(player.x, player.y - 26, L("shield"), "#5EE1D0");
          burst(player.x, player.y, 18, "#5EE1D0");
        } else {
          coins++; addScore(T.gemValue);
          Missions.event("gems", 1);
          Audio2.gem(combo);
          popup(g.x, g.y - 10, "+" + (T.gemValue * mult), "#5EE1D0");
          burst(g.x, g.y, 8, "#5EE1D0");
        }
      }
    }
    gems = gems.filter(g => !g.taken && g.y < H + 40);

    // generování dopředu
    spawnY += scroll * dt;
    while (spawnY > -120) spawn(false);
  }

  function onBounce() {
    Audio2.bounce(); Haptic.bounce();
    Missions.event("bounce", 1);
    shake = Math.max(shake, 0.15);
    fxBounce(player.x, player.y, player.dir, skinColor());
  }

  // ---------- efekty (odraz / smrt) podle vybraného FX
  function fxBounce(x, y, dir, c) {
    const fx = Storage.active("fx");
    for (let i = 0; i < 5; i++) particles.push(mkParticle(x, y, -dir * rnd(40, 140), rnd(-60, 60), c, 0.3));
    if (fx === "ripple") rings.push({ x, y, r: 6, max: 40, life: 0.45, c, w: 2 });
    if (fx === "shockwave") { rings.push({ x, y, r: 4, max: 90, life: 0.5, c: "#FFFFFF", w: 4 }); shake = Math.max(shake, 0.45); }
    if (fx === "confetti") for (let i = 0; i < 10; i++) particles.push(mkParticle(x, y, -dir * rnd(30, 200), rnd(-150, 50), confettiColor(), rnd(0.5, 0.9), "rect"));
    if (fx === "pixel") for (let i = 0; i < 8; i++) particles.push(mkParticle(x, y, -dir * rnd(50, 180), rnd(-80, 80), c, 0.5, "pixel"));
    if (fx === "fireworks") for (let i = 0; i < 12; i++) { const a = rnd(0, 6.28); particles.push(mkParticle(x, y, Math.cos(a) * 120, Math.sin(a) * 120, confettiColor(), 0.5, "spark")); }
    if (fx === "lightning") { bolts.push(mkBolt(x, y, x, y - rnd(80, 160), c)); bolts.push(mkBolt(x, y, x, y + rnd(60, 120), c)); flash = Math.max(flash, 0.15); }
  }
  function fxDie(x, y, c) {
    const fx = Storage.active("fx");
    burst(x, y, 40, c); burst(x, y, 14, "#FF5E7E");
    if (fx === "ripple") for (let i = 0; i < 3; i++) rings.push({ x, y, r: 6 + i * 10, max: 120 + i * 40, life: 0.8 + i * 0.2, c, w: 3 });
    if (fx === "shockwave") { rings.push({ x, y, r: 6, max: 320, life: 0.9, c: "#FFFFFF", w: 8 }); shake = 2.4; }
    if (fx === "confetti") for (let i = 0; i < 70; i++) particles.push(mkParticle(x, y, rnd(-260, 260), rnd(-320, 80), confettiColor(), rnd(0.8, 1.6), "rect"));
    if (fx === "pixel") for (let i = 0; i < 60; i++) particles.push(mkParticle(x + rnd(-12, 12), y + rnd(-12, 12), rnd(-220, 220), rnd(-220, 220), c, rnd(0.5, 1.1), "pixel"));
    if (fx === "fireworks") for (let k = 0; k < 5; k++) timers.push({ at: k * 0.18, fn: () => { const bx = x + rnd(-90, 90), by = y + rnd(-140, 40); const cc = confettiColor(); for (let i = 0; i < 26; i++) { const a = rnd(0, 6.28), sp = rnd(80, 220); particles.push(mkParticle(bx, by, Math.cos(a) * sp, Math.sin(a) * sp, cc, rnd(0.5, 0.9), "spark")); } rings.push({ x: bx, y: by, r: 4, max: 60, life: 0.4, c: cc, w: 2 }); } });
    if (fx === "lightning") for (let k = 0; k < 6; k++) timers.push({ at: k * 0.08, fn: () => { bolts.push(mkBolt(rnd(WALL, W - WALL), -10, x, y, k % 2 ? "#FFFFFF" : c)); flash = Math.max(flash, 0.35); } });
  }
  const confettiColor = () => ["#FF5E7E", "#FFCF5A", "#5EE1D0", "#B98CFF", "#B6FF5A", "#FF7AD9"][Math.floor(Math.random() * 6)];
  function mkBolt(x1, y1, x2, y2, c) {
    const pts = [{ x: x1, y: y1 }];
    const n = 7;
    for (let i = 1; i < n; i++) { const k = i / n; pts.push({ x: x1 + (x2 - x1) * k + rnd(-16, 16), y: y1 + (y2 - y1) * k + rnd(-8, 8) }); }
    pts.push({ x: x2, y: y2 });
    return { pts, c, life: 0.18 };
  }

  function addScore(n) {
    score += n * mult;
    cb.onHud && cb.onHud(hudData());
  }

  function updateFever() {
    const m = combo >= T.feverAt2 ? 3 : combo >= T.feverAt ? 2 : 1;
    if (m !== mult) {
      mult = m;
      if (m > 1) { Audio2.fever(); Haptic.fever(); if (m === 2) Missions.event("fever", 1); feverFlash = 0.6; shake = Math.max(shake, 0.5); popup(player.x, player.y - 40, "FEVER ×" + m, "#FFCF5A"); }
    }
    cb.onHud && cb.onHud(hudData());
  }

  function hit() {
    if (player.shield) {
      player.shield = false; player.invuln = 1.2;
      shake = 1; Audio2.shieldHit(); Haptic.near();
      burst(player.x, player.y, 20, "#5EE1D0");
      popup(player.x, player.y - 30, L("shieldSaved"), "#5EE1D0");
      return;
    }
    Audio2.die(); Haptic.die();
    shake = 1.6; flash = 1; deadTimer = 0;
    fxDie(player.x, player.y, skinColor());
    state = "dead";
    const finalScore = Math.floor(score);
    const isNew = finalScore > Storage.best;
    if (isNew) { Storage.setBest(finalScore); setTimeout(() => Audio2.record(), 500); }
    Storage.addCoins(coins);
    Missions.event("score", finalScore); Missions.event("combo", bestCombo); Missions.event("runs", 1);
    cb.onDie && cb.onDie({ score: finalScore, coins, combo: bestCombo, best: Storage.best, isNew, canContinue: !continued });
  }

  function hudData() { return { score: Math.floor(score), coins, combo, mult }; }

  // ---------------------------------------------------------------- efekty
  function mkParticle(x, y, vx, vy, c, life, kind) {
    return { x, y, vx, vy, c, life, max: life, kind: kind || "dot", r: kind === "pixel" ? 6 : kind === "rect" ? 5 : rnd(2, 4), rot: rnd(0, 6.28), vr: rnd(-8, 8) };
  }
  function burst(x, y, n, c) {
    for (let i = 0; i < n; i++) {
      const a = rnd(0, 6.28), s = rnd(60, 260);
      particles.push(mkParticle(x, y, Math.cos(a) * s, Math.sin(a) * s, c, rnd(0.4, 0.9)));
    }
  }
  function popup(x, y, text, c) { popups.push({ x, y, text, c, life: 0.9 }); }
  function updateParticles(dt) {
    for (const p of particles) {
      const g = p.kind === "rect" ? 260 : p.kind === "spark" ? 120 : 0;
      p.vy += g * dt;
      p.x += p.vx * dt; p.y += (p.vy + scroll * 0.6) * dt; p.vx *= 0.97; p.life -= dt; p.rot += p.vr * dt;
    }
    particles = particles.filter(p => p.life > 0);
    for (const r of rings) { r.life -= dt; r.r += (r.max - r.r) * dt * 6; r.y += scroll * dt * 0.3; }
    rings = rings.filter(r => r.life > 0);
    for (const b of bolts) b.life -= dt;
    bolts = bolts.filter(b => b.life > 0);
    for (const tm of timers) { tm.at -= dt; if (tm.at <= 0 && !tm.done) { tm.done = true; tm.fn(); } }
    timers = timers.filter(tm => !tm.done);
    for (const p of popups) { p.y -= 40 * dt; p.life -= dt; }
    popups = popups.filter(p => p.life > 0);
  }

  // ---------------------------------------------------------------- render
  function loop(now) {
    const dt = Math.min(1 / 30, (now - last) / 1000 || 0);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function draw() {
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    const sx = shake > 0 ? rnd(-1, 1) * shake * 6 : 0;
    const sy = shake > 0 ? rnd(-1, 1) * shake * 6 : 0;
    ctx.translate(sx, sy);

    // pozadí
    const fever = mult > 1;
    const th = theme();
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, fever ? th.fever : th.top);
    grad.addColorStop(1, th.bottom);
    ctx.fillStyle = grad;
    ctx.fillRect(-10, -10, W + 20, H + 20);

    // jemná mřížka posouvající se dolů (pocit rychlosti)
    ctx.strokeStyle = th.grid;
    ctx.lineWidth = 1;
    for (let y = -64 + bgOffset; y < H; y += 64) { ctx.beginPath(); ctx.moveTo(WALL, y); ctx.lineTo(W - WALL, y); ctx.stroke(); }

    // stěny
    ctx.fillStyle = fever ? "#FF5E7E" : th.wall;
    ctx.fillRect(0, -10, WALL, H + 20);
    ctx.fillRect(W - WALL, -10, WALL, H + 20);
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(WALL - 3, -10, 3, H + 20);
    ctx.fillRect(W - WALL, -10, 3, H + 20);

    // gemy
    for (const g of gems) {
      const s = g.r + Math.sin(g.bob) * 1.5;
      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.rotate(Math.PI / 4 + (g.shield ? t * 2 : 0));
      ctx.fillStyle = g.shield ? "#FFFFFF" : "#5EE1D0";
      ctx.shadowColor = g.shield ? "#FFFFFF" : "#5EE1D0"; ctx.shadowBlur = 12;
      ctx.fillRect(-s, -s, s * 2, s * 2);
      if (g.shield) { ctx.strokeStyle = "#5EE1D0"; ctx.lineWidth = 3; ctx.strokeRect(-s - 5, -s - 5, s * 2 + 10, s * 2 + 10); }
      ctx.restore();
    }

    // překážky
    for (const o of obstacles) drawObstacle(o);

    // trail + hráč
    const skin = SKINS[Storage.skin] || SKINS.amber;
    const col = skinColor();
    const shape = Storage.active("shape");
    const rot = t * 3 * player.dir;
    drawAura(player.trail, col, shape, rot, skin);
    if (state !== "dead") {
      const blink = player.invuln > 0 && Math.floor(t * 12) % 2 === 0;
      ctx.save();
      ctx.translate(player.x, player.y);
      const sq = player.squash * 0.35;
      ctx.scale(1 + sq, 1 - sq);
      ctx.shadowColor = col; ctx.shadowBlur = skin.type === "ghost" ? 26 : 18;
      if (skin.type === "ghost") ctx.globalAlpha = 0.55;
      ctx.fillStyle = blink ? "rgba(255,255,255,.5)" : col;
      drawShape(ctx, shape, player.r, rot);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      if (skin.type === "ring") {
        ctx.strokeStyle = col; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, player.r + 4, 0, 6.28); ctx.stroke();
      }
      if (skin.type === "core" && shape !== "donut") {
        ctx.fillStyle = "rgba(0,0,0,.45)";
        ctx.beginPath(); ctx.arc(0, 0, player.r * 0.5, 0, 6.28); ctx.fill();
      }
      if (shape === "circle") {
        ctx.fillStyle = "rgba(255,255,255,.55)";
        ctx.beginPath(); ctx.arc(-3, -4, 3.5, 0, 6.28); ctx.fill();
        ctx.fillStyle = "#1B0E38";
        ctx.beginPath(); ctx.arc(player.dir * 4, -1, 2, 0, 6.28); ctx.fill();
      }
      ctx.restore();
      if (player.shield) {
        ctx.strokeStyle = "rgba(94,225,208,.9)"; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(player.x, player.y, player.r + 6 + Math.sin(t * 6) * 1.5, 0, 6.28); ctx.stroke();
      }
    }

    // částice
    for (const p of particles) {
      ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = p.c;
      if (p.kind === "rect") { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillRect(-4, -2, 8, 4); ctx.restore(); }
      else if (p.kind === "spark") { ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, 6.28); ctx.fill(); }
      else ctx.fillRect(p.x - p.r / 2, p.y - p.r / 2, p.r, p.r);
    }
    ctx.globalAlpha = 1;
    // kruhy
    for (const r of rings) {
      ctx.globalAlpha = clamp(r.life, 0, 1);
      ctx.strokeStyle = r.c; ctx.lineWidth = r.w;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, 6.28); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // blesky
    for (const b of bolts) {
      ctx.globalAlpha = clamp(b.life / 0.18, 0, 1);
      ctx.strokeStyle = b.c; ctx.lineWidth = 2.5; ctx.shadowColor = b.c; ctx.shadowBlur = 12;
      ctx.beginPath(); b.pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;

    // popupy
    ctx.font = "700 20px Fredoka, sans-serif";
    ctx.textAlign = "center";
    for (const p of popups) {
      ctx.globalAlpha = clamp(p.life / 0.9, 0, 1);
      ctx.fillStyle = p.c;
      ctx.fillText(p.text, clamp(p.x, 50, W - 50), p.y);
    }
    ctx.globalAlpha = 1;

    // fever záblesk / úmrtí
    if (feverFlash > 0) { ctx.fillStyle = `rgba(255,207,90,${feverFlash * 0.35})`; ctx.fillRect(0, 0, W, H); }
    if (flash > 0) { ctx.fillStyle = `rgba(255,94,126,${flash * 0.45})`; ctx.fillRect(0, 0, W, H); }

    // nápověda v menu
    if (state === "idle") {
      ctx.fillStyle = "rgba(247,241,255,.35)";
      ctx.font = "600 15px Fredoka, sans-serif";
      ctx.fillText(L("hint"), W / 2, H * 0.79);
    }
  }

  function drawObstacle(o) {
    ctx.fillStyle = "#FF5E7E";
    ctx.shadowColor = "#FF5E7E"; ctx.shadowBlur = 10;
    if (o.type === "bar" || o.type === "gate") {
      for (const r of rects(o)) roundRect(r.x, r.y, r.w, r.h, o.type === "gate" ? 8 : 5);
      if (o.type === "gate") {
        // zubaté hrany k mezeře
        ctx.beginPath();
        ctx.moveTo(o.gx, o.y + 3); ctx.lineTo(o.gx + 14, o.y + o.h / 2); ctx.lineTo(o.gx, o.y + o.h - 3); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(o.gx + o.gw, o.y + 3); ctx.lineTo(o.gx + o.gw - 14, o.y + o.h / 2); ctx.lineTo(o.gx + o.gw, o.y + o.h - 3); ctx.fill();
      }
    } else if (o.type === "spike") {
      const left = o.side === "left";
      const x0 = left ? WALL : W - WALL, tip = left ? WALL + o.w : W - WALL - o.w;
      ctx.beginPath();
      ctx.moveTo(x0, o.y); ctx.lineTo(tip, o.y + o.h / 2); ctx.lineTo(x0, o.y + o.h); ctx.closePath(); ctx.fill();
    } else if (o.type === "mover") {
      roundRect(o.x, o.y, o.w, o.h, 6);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255,255,255,.5)";
      ctx.fillRect(o.x + 6, o.y + 4, o.w - 12, 2);
    }
    ctx.shadowBlur = 0;
  }

  // Tvar vycentrovaný na 0,0 (kontext už je přeložený). Vyplní aktuálním fillStyle.
  function drawShape(c, shape, r, rot) {
    c.save();
    if (shape !== "circle") c.rotate(rot);
    c.beginPath();
    switch (shape) {
      case "square": c.rect(-r * 0.9, -r * 0.9, r * 1.8, r * 1.8); break;
      case "triangle": c.moveTo(r * 1.15, 0); c.lineTo(-r * 0.8, r); c.lineTo(-r * 0.8, -r); c.closePath(); break;
      case "diamond": c.moveTo(0, -r * 1.2); c.lineTo(r * 0.85, 0); c.lineTo(0, r * 1.2); c.lineTo(-r * 0.85, 0); c.closePath(); break;
      case "hexagon": for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; i ? c.lineTo(Math.cos(a) * r * 1.1, Math.sin(a) * r * 1.1) : c.moveTo(r * 1.1, 0); } c.closePath(); break;
      case "star": for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? r * 0.55 : r * 1.25; i ? c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.closePath(); break;
      case "heart": c.moveTo(0, r * 1.1); c.bezierCurveTo(-r * 1.6, -r * 0.1, -r * 0.6, -r * 1.3, 0, -r * 0.45); c.bezierCurveTo(r * 0.6, -r * 1.3, r * 1.6, -r * 0.1, 0, r * 1.1); break;
      case "donut": c.arc(0, 0, r * 1.1, 0, 6.28); c.moveTo(r * 0.45, 0); c.arc(0, 0, r * 0.45, 0, 6.28, true); break;
      case "saw": for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, rr = i % 2 ? r * 0.8 : r * 1.25; i ? c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : c.moveTo(rr, 0); } c.closePath(); break;
      default: c.arc(0, 0, r, 0, 6.28);
    }
    c.fill("evenodd");
    c.restore();
  }

  function drawAura(trail, col, shape, rot, skin) {
    const aura = Storage.active("aura");
    if (aura === "none" || trail.length < 2) return;
    const ghost = skin.type === "ghost";
    if (aura === "tail") {
      for (let i = 0; i < Math.min(trail.length, 14); i++) {
        const p = trail[i], k = 1 - i / 14;
        ctx.globalAlpha = k * (ghost ? 0.18 : 0.35); ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(p.x, p.y, player.r * k * 0.9, 0, 6.28); ctx.fill();
      }
    } else if (aura === "line" || aura === "comet" || aura === "neon" || aura === "rainbow") {
      const g = ctx.createLinearGradient(0, trail[0].y, 0, trail[trail.length - 1].y);
      if (aura === "rainbow") { for (let i = 0; i <= 6; i++) g.addColorStop(i / 6, `hsl(${(t * 120 + i * 60) % 360}, 95%, 65%)`); }
      else { g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)"); }
      ctx.strokeStyle = g; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.lineWidth = aura === "comet" ? player.r * 1.6 : aura === "rainbow" ? 6 : 2.5;
      if (aura === "comet") { ctx.shadowColor = col; ctx.shadowBlur = 16; }
      ctx.beginPath(); trail.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
      ctx.shadowBlur = 0;
      if (aura === "neon") { ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.lineWidth = 1; ctx.beginPath(); trail.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke(); }
    } else if (aura === "dots") {
      for (let i = 3; i < trail.length; i += 5) {
        const p = trail[i]; ctx.globalAlpha = 1 - i / trail.length; ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(p.x, p.y, 3.5, 0, 6.28); ctx.fill();
      }
    } else if (aura === "echo") {
      const n = trail.length;
      for (let i = 6; i < n; i += 7) {
        const p = trail[i];
        ctx.save(); ctx.translate(p.x, p.y); ctx.globalAlpha = 0.4 * (1 - i / n); ctx.fillStyle = col;
        drawShape(ctx, shape, player.r * (1 - 0.5 * i / n), rot - i * 0.1 * player.dir); ctx.restore();
      }
    } else if (aura === "bolt") {
      ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.shadowColor = col; ctx.shadowBlur = 10; ctx.lineJoin = "round";
      ctx.beginPath();
      trail.forEach((p, i) => { const k = i ? Math.max(0.2, 1 - i / trail.length) : 0; const jx = rnd(-5, 5) * k, jy = rnd(-3, 3) * k; i ? ctx.lineTo(p.x + jx, p.y + jy) : ctx.moveTo(p.x, p.y); });
      ctx.globalAlpha = 0.9; ctx.stroke(); ctx.shadowBlur = 0;
    } else if (aura === "sparks") {
      for (let i = 0; i < Math.min(trail.length, 8); i++) {
        const p = trail[i], k = 1 - i / 8; ctx.globalAlpha = k * 0.3; ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(p.x, p.y, player.r * k * 0.7, 0, 6.28); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  // Náhled položky do obchodu (malý canvas). kind: skin | shape | aura | fx | bg
  function preview(cv, kind, id) {
    const c = cv.getContext("2d"); const S = cv.width; const m = S / 2;
    c.clearRect(0, 0, S, S);
    const col = "#FFCF5A";
    if (kind === "shape") { c.translate(m, m); c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 6; drawShape(c, id, S * 0.26, -0.4); }
    else if (kind === "aura") {
      const pts = []; for (let i = 0; i < 6; i++) pts.push({ x: i % 2 ? S * 0.78 : S * 0.22, y: S * 0.12 + i * S * 0.14 });
      c.lineCap = "round"; c.lineJoin = "round";
      const hue = (i) => `hsl(${i * 60}, 95%, 65%)`;
      if (id === "none") { c.fillStyle = "rgba(255,255,255,.25)"; c.font = `${S * 0.5}px sans-serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("–", m, m); }
      else if (id === "tail" || id === "sparks") { pts.forEach((p, i) => { c.globalAlpha = 1 - i / 6; c.fillStyle = col; c.beginPath(); c.arc(p.x, p.y, S * 0.08 * (1 - i / 7), 0, 6.28); c.fill(); }); }
      else if (id === "dots") { pts.forEach((p, i) => { c.globalAlpha = 1 - i / 7; c.fillStyle = col; c.beginPath(); c.arc(p.x, p.y, 3, 0, 6.28); c.fill(); }); }
      else if (id === "echo") { pts.forEach((p, i) => { c.globalAlpha = 1 - i / 6; c.fillStyle = col; c.beginPath(); c.arc(p.x, p.y, S * 0.1 * (1 - i / 8), 0, 6.28); c.fill(); }); }
      else {
        const g = c.createLinearGradient(0, 0, 0, S);
        if (id === "rainbow") for (let i = 0; i <= 6; i++) g.addColorStop(i / 6, hue(i)); else { g.addColorStop(0, col); g.addColorStop(1, "rgba(255,207,90,0)"); }
        c.strokeStyle = g; c.lineWidth = id === "comet" ? S * 0.14 : id === "rainbow" ? 4 : 2;
        if (id === "comet" || id === "bolt") { c.shadowColor = col; c.shadowBlur = 8; }
        c.beginPath(); pts.forEach((p, i) => { const j = id === "bolt" && i ? (i % 2 ? 4 : -4) : 0; i ? c.lineTo(p.x + j, p.y) : c.moveTo(p.x, p.y); }); c.stroke();
        if (id === "neon") { c.shadowBlur = 0; c.strokeStyle = "rgba(255,255,255,.8)"; c.lineWidth = 1; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.stroke(); }
      }
    } else if (kind === "fx") {
      c.fillStyle = col; c.strokeStyle = col; c.lineWidth = 2;
      c.beginPath(); c.arc(m, m, S * 0.1, 0, 6.28); c.fill();
      if (id === "basic") for (let i = 0; i < 6; i++) { const a = i; c.fillRect(m + Math.cos(a) * S * 0.28 - 2, m + Math.sin(a) * S * 0.28 - 2, 4, 4); }
      if (id === "ripple") [0.2, 0.32, 0.44].forEach((r, i) => { c.globalAlpha = 1 - i * 0.3; c.beginPath(); c.arc(m, m, S * r, 0, 6.28); c.stroke(); });
      if (id === "shockwave") { c.strokeStyle = "#fff"; c.lineWidth = 4; c.beginPath(); c.arc(m, m, S * 0.38, 0, 6.28); c.stroke(); }
      if (id === "confetti") for (let i = 0; i < 12; i++) { c.save(); c.translate(m + Math.cos(i * 1.7) * S * 0.33, m + Math.sin(i * 2.3) * S * 0.33); c.rotate(i); c.fillStyle = ["#FF5E7E", "#FFCF5A", "#5EE1D0", "#B98CFF"][i % 4]; c.fillRect(-4, -2, 8, 4); c.restore(); }
      if (id === "pixel") for (let i = 0; i < 10; i++) c.fillRect(m + Math.cos(i * 1.9) * S * 0.32 - 4, m + Math.sin(i * 1.3) * S * 0.32 - 4, 8, 8);
      if (id === "fireworks") for (let k = 0; k < 3; k++) { const cx = m + Math.cos(k * 2.1) * S * 0.25, cy = m + Math.sin(k * 2.1) * S * 0.25; c.fillStyle = ["#FF5E7E", "#5EE1D0", "#B98CFF"][k]; for (let i = 0; i < 8; i++) { c.beginPath(); c.arc(cx + Math.cos(i * 0.78) * S * 0.14, cy + Math.sin(i * 0.78) * S * 0.14, 1.8, 0, 6.28); c.fill(); } }
      if (id === "lightning") { c.strokeStyle = "#fff"; c.shadowColor = col; c.shadowBlur = 8; c.beginPath(); c.moveTo(m + 8, 4); c.lineTo(m - 4, m - 4); c.lineTo(m + 4, m); c.lineTo(m - 8, S - 4); c.stroke(); }
    }
    c.globalAlpha = 1; c.setTransform(1, 0, 0, 1, 0, 0);
  }

  function roundRect(x, y, w, h, r) {
    if (w <= 0) return;
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.fill();
  }

  return {
    init, start, revive, tap, SKINS, THEMES, SHAPES, AURAS, FX, skinColor, preview,
    get state() { return state; },
    goIdle() { state = "idle"; reset(); },
    // jen pro ladění/testy
    get debug() { return { player, obstacles, gems, score, combo, mult, H, W, WALL }; },
  };
})();
