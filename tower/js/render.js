// Kreslení. Barva se drží v malém offscreen plátně (1 pixel = 1 buňka) a jen se zvětšuje – rychlé i na slabém mobilu.
window.Render = (() => {
  const W = Sim.W, H = 600, R = 9, COLORS = Sim.COLORS;
  let canvas, ctx, scale = 1, dpr = 1;
  let camY = 0, camInit = false;
  function setPalette() {}
  let particles = [], rings = [], popups = [], shake = 0, t = 0;

  const HATS = {
    none: { price: 0 },
    cap: { price: 150 }, bow: { price: 150 }, sprout: { price: 200 }, antenna: { price: 200 }, beanie: { price: 200 }, flower: { price: 250 },
    horns: { price: 300 }, headphones: { price: 300 }, cat: { price: 350 }, halo: { price: 400 }, chef: { price: 400 }, pirate: { price: 450 },
    helmet: { price: 500 }, viking: { price: 550 }, tophat: { price: 600 }, wizard: { price: 650 }, party: { price: 700 }, crown: { price: 1000 },
  };
  // vzory na těle
  const PATTERNS = { none: { price: 0 }, stripes: { price: 200 }, dots: { price: 200 }, ring: { price: 250 }, half: { price: 300 }, star: { price: 400 }, heart: { price: 400 }, checker: { price: 500 } };

  function init(cv) { canvas = cv; ctx = cv.getContext("2d"); resize(); window.addEventListener("resize", resize); }
  function resize() {
    const stage = canvas.parentElement, sw = stage.clientWidth, sh = stage.clientHeight;
    scale = Math.min(sw / W, sh / H);
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(W * scale * dpr); canvas.height = Math.round(H * scale * dpr);
    canvas.style.width = Math.round(W * scale) + "px"; canvas.style.height = Math.round(H * scale) + "px";
    stage.style.setProperty("--cw", Math.round(W * scale) + "px");
  }
  // převod souřadnic dotyku na svět
  function toWorld(clientX, clientY) { const r = canvas.getBoundingClientRect(); return { x: (clientX - r.left) / scale, y: (clientY - r.top) / scale }; }

  // ---------- efekty
  function burst(x, y, color, n = 12, speed = 160) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, s = Math.random() * speed; particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, c: color, life: 0.4 + Math.random() * 0.4, max: 0.8 }); } }
  function ring(x, y, color, max = 50) { rings.push({ x, y, r: 6, max, life: 0.5, c: color }); }
  function popup(x, y, text, color) { popups.push({ x, y, text, c: color, life: 1 }); }
  function kick(n) { shake = Math.max(shake, n); }

  function tickFx(dt) {
    t += dt;
    for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.95; p.vy *= 0.95; p.life -= dt; }
    particles = particles.filter(p => p.life > 0);
    for (const r of rings) { r.life -= dt; r.r += (r.max - r.r) * dt * 7; }
    rings = rings.filter(r => r.life > 0);
    for (const p of popups) { p.y -= 30 * dt; p.life -= dt; }
    popups = popups.filter(p => p.life > 0);
    shake = Math.max(0, shake - dt * 5);
  }

  // ---------- kreslení. Svět: y roste nahoru. view = {plats, players:[{x,y,dir,color,name,hat,pattern,ground,dead,out,done,me,best}], t, lava, top, phase, countdown, showMe, mode}
  const sy = (y) => H - (y - camY);                       // svět -> obrazovka
  function draw(view, dt) {
    tickFx(dt);
    const meP = view.players.find(p => p.me);
    const me = meP && (meP.out || meP.done) && view.follow ? view.follow : meP;
    const targetCam = me ? me.y - H * 0.42 : 0;
    if (!camInit || view.phase === "idle") { camY = Math.max(-40, targetCam); camInit = view.phase !== "idle"; }
    else camY += (Math.max(-40, targetCam) - camY) * Math.min(1, dt * 6);
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    if (shake > 0) ctx.translate((Math.random() - 0.5) * shake * 8, (Math.random() - 0.5) * shake * 8);

    // pozadí podle výšky
    const k = Math.min(1, Math.max(0, camY / Math.max(1, view.top || 4000)));
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, lerpColor("#2B1150", "#0B1E44", k)); g.addColorStop(1, lerpColor("#160B2E", "#1B0E38", k));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // hvězdy / cihly zdi
    ctx.fillStyle = "rgba(255,255,255,.06)";
    for (let i = 0; i < 40; i++) { const x = (i * 97) % W, y = ((i * 211) - camY * 0.3) % (H + 40); ctx.fillRect(x, ((y % (H + 40)) + H + 40) % (H + 40) - 20, 2, 2); }
    ctx.fillStyle = "rgba(255,255,255,.04)";
    for (let y = -((camY * 0.6) % 34); y < H; y += 34) { ctx.fillRect(0, y, 10, 1); ctx.fillRect(W - 10, y, 10, 1); }

    // plošiny v záběru
    const gone = view.gone || new Set();
    for (const p of view.plats) {
      const y = sy(p.y); if (y < -30 || y > H + 30 || gone.has(p.idx)) continue;
      const x = Sim.platX(p, view.t);
      if (p.kind === "floor") { ctx.fillStyle = "#3A3155"; ctx.fillRect(0, y, W, H); ctx.fillStyle = "#5EE1D0"; ctx.fillRect(0, y, W, 3); continue; }
      if (p.kind === "finish") { ctx.fillStyle = "#FFCF5A"; ctx.fillRect(0, y, W, 6); for (let i = 0; i < W; i += 20) { ctx.fillStyle = (i / 20) % 2 ? "#2B2440" : "#fff"; ctx.fillRect(i, y - 12, 20, 12); } continue; }
      ctx.fillStyle = p.kind === "spring" ? "#FFCF5A" : p.kind === "check" ? "#5EE1D0" : p.kind === "move" ? "#B98CFF" : p.kind === "ice" ? "#BFEFFF" : p.kind === "conveyor" ? "#3A3155" : p.kind === "crumble" ? "#C9A27E" : "#F4F0E8";
      roundRect(x, y, p.w, 10, 4);
      ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.fillRect(x + 2, y + 6, p.w - 4, 3);
      if (p.kind === "ice") { ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.fillRect(x + 6, y + 2, p.w * 0.4, 2); }
      if (p.kind === "conveyor") { ctx.fillStyle = "#FFCF5A"; const off = ((t * 60 * p.dir) % 14 + 14) % 14; for (let i = -14; i < p.w; i += 14) { const ax = x + i + off; if (ax < x + 2 || ax + 8 > x + p.w - 2) continue; ctx.beginPath(); ctx.moveTo(ax, y + 2); ctx.lineTo(ax + 5 * p.dir, y + 5); ctx.lineTo(ax, y + 8); ctx.fill(); } }
      if (p.kind === "crumble") { ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + p.w * 0.3, y + 1); ctx.lineTo(x + p.w * 0.36, y + 6); ctx.lineTo(x + p.w * 0.3, y + 9); ctx.moveTo(x + p.w * 0.65, y + 1); ctx.lineTo(x + p.w * 0.6, y + 5); ctx.lineTo(x + p.w * 0.68, y + 9); ctx.stroke(); if (p.cracked) { ctx.fillStyle = "rgba(255,94,126,.5)"; ctx.fillRect(x, y, p.w, 10); } }
      if (p.kind === "spring") { ctx.strokeStyle = "#C48F14"; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i < 4; i++) { ctx.moveTo(x + p.w / 2 - 6, y - i * 3); ctx.lineTo(x + p.w / 2 + 6, y - i * 3 - 1.5); } ctx.stroke(); }
      if (p.kind === "move") { ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(x + 6, y + 5); ctx.lineTo(x + 12, y + 1); ctx.lineTo(x + 12, y + 9); ctx.fill(); ctx.beginPath(); ctx.moveTo(x + p.w - 6, y + 5); ctx.lineTo(x + p.w - 12, y + 1); ctx.lineTo(x + p.w - 12, y + 9); ctx.fill(); }
      if (p.kind === "spike") { ctx.fillStyle = "#FF5E7E"; for (let i = 0; i < p.sw; i += 8) { ctx.beginPath(); ctx.moveTo(p.sx + i, y); ctx.lineTo(p.sx + i + 4, y - 9); ctx.lineTo(p.sx + i + 8, y); ctx.fill(); } }
      if (p.kind === "check") { ctx.fillStyle = "#5EE1D0"; ctx.fillRect(x + p.w / 2 - 1, y - 22, 2, 22); ctx.fillStyle = "#FF5E7E"; ctx.beginPath(); ctx.moveTo(x + p.w / 2 + 1, y - 22); ctx.lineTo(x + p.w / 2 + 14, y - 17); ctx.lineTo(x + p.w / 2 + 1, y - 12); ctx.fill(); ctx.fillStyle = "rgba(255,255,255,.6)"; ctx.font = "800 9px Nunito, sans-serif"; ctx.textAlign = "left"; ctx.fillText(p.i + "F", x + 4, y - 3); }
    }
    // mince
    for (const c of view.coins || []) { const y = sy(c.y); if (y < -10 || y > H + 10) continue; const sq = 0.7 + Math.abs(Math.sin(t * 4 + c.id)) * 0.3; ctx.fillStyle = "#FFCF5A"; ctx.beginPath(); ctx.ellipse(c.x, y, 5 * sq, 5, 0, 0, 6.28); ctx.fill(); ctx.fillStyle = "#C48F14"; ctx.beginPath(); ctx.ellipse(c.x, y, 3 * sq, 3, 0, 0, 6.28); ctx.fill(); }
    // kruhy
    for (const r of rings) { ctx.globalAlpha = Math.max(0, r.life * 2); ctx.strokeStyle = r.c; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(r.x, sy(r.y), r.r, 0, 6.28); ctx.stroke(); }
    ctx.globalAlpha = 1;
    // hráči (já naposled)
    const ps = view.players.filter(p => !p.dead && !p.out).sort((a, b) => (a.me ? 1 : 0) - (b.me ? 1 : 0));
    for (const p of ps) drawPlayer(p);
    if (view.showMe && meP && !meP.dead && !meP.out) drawMeArrow({ x: meP.x + Sim.PW / 2, y: sy(meP.y) - Sim.PH / 2, meLabel: meP.meLabel }, view.showMe);
    if (me !== meP && me) { ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.font = "800 14px Nunito, sans-serif"; ctx.textAlign = "center"; ctx.fillText((view.watchLabel || "Watching") + ": " + me.name, W / 2, 60); }
    // láva
    if (view.lava !== undefined && view.lava > -150) {
      const ly = sy(view.lava);
      if (ly < H + 20) {
        const lg = ctx.createLinearGradient(0, ly, 0, H); lg.addColorStop(0, "#FF9A3C"); lg.addColorStop(0.3, "#FF5E7E"); lg.addColorStop(1, "#7A1030");
        ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, ly);
        for (let x = 0; x <= W; x += 12) ctx.lineTo(x, ly + Math.sin(x * 0.08 + t * 5) * 4);
        ctx.lineTo(W, H); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,.25)"; for (let i = 0; i < 6; i++) { const x = (i * 67 + t * 30) % W; ctx.beginPath(); ctx.arc(x, ly + 14 + Math.sin(t * 3 + i) * 6, 3, 0, 6.28); ctx.fill(); }
      }
    }
    // částice, popupy
    for (const p of particles) { ctx.globalAlpha = Math.min(1, p.life / p.max * 1.5); ctx.fillStyle = p.c; ctx.fillRect(p.x - 2, sy(p.y) - 2, 4, 4); }
    ctx.globalAlpha = 1; ctx.font = "700 14px Nunito, sans-serif"; ctx.textAlign = "center";
    for (const p of popups) { ctx.globalAlpha = p.life; ctx.fillStyle = p.c; ctx.lineWidth = 3; ctx.strokeStyle = "rgba(0,0,0,.5)"; ctx.strokeText(p.text, p.x, sy(p.y)); ctx.fillText(p.text, p.x, sy(p.y)); }
    ctx.globalAlpha = 1;
    // výška
    if (meP) { ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.font = "800 12px Nunito, sans-serif"; ctx.textAlign = "right"; ctx.fillText(Math.round(meP.best / 78) + " F" + (view.mode === "coins" ? "  ● " + (meP.score || 0) : ""), W - 8, H - 10); }
    if (view.phase === "countdown") { ctx.fillStyle = "rgba(10,6,20,.45)"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "#fff"; ctx.font = "800 96px Nunito, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(Math.max(1, Math.ceil(view.countdown)), W / 2, H / 2); ctx.textBaseline = "alphabetic"; }
  }
  function lerpColor(a, b, k) { const pa = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16)); return "rgb(" + pa.map((v, i) => Math.round(v + (pb[i] - v) * k)).join(",") + ")"; }

  function drawPlayer(p) {
    const cx = p.x + Sim.PW / 2, cy = sy(p.y) - Sim.PH / 2 + 2;
    ctx.save(); ctx.translate(cx, cy);
    if (!p.me) ctx.globalAlpha = 0.8;
    const squash = p.ground ? 1 : 0.9;
    ctx.scale(2 - squash, squash);
    ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.beginPath(); ctx.ellipse(0, R + 1, R * 0.8, 3, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(0, 0, R, 0, 6.28); ctx.fill();
    drawPattern(p.pattern, p.color);
    if (p.me) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, R + 2.5, 0, 6.28); ctx.stroke(); }
    ctx.fillStyle = "rgba(255,255,255,.45)"; ctx.beginPath(); ctx.arc(-3, -3.5, 3, 0, 6.28); ctx.fill();
    const ex = p.dir * 2.5;
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(ex - 2.6, -1, 2.6, 0, 6.28); ctx.arc(ex + 2.6, -1, 2.6, 0, 6.28); ctx.fill();
    ctx.fillStyle = "#2B2440"; ctx.beginPath(); ctx.arc(ex * 1.4 - 2.6, -1, 1.3, 0, 6.28); ctx.arc(ex * 1.4 + 2.6, -1, 1.3, 0, 6.28); ctx.fill();
    drawHat(p.hat, p.color);
    ctx.restore();
    ctx.font = "700 10px Nunito, sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.fillText(p.name, cx, cy + R + 12);
  }
  function drawMeArrow(p, k) {
    const bob = Math.sin(t * 8) * 4, y = p.y - R - 30 + bob, label = p.meLabel || "YOU";
    ctx.save(); ctx.globalAlpha = Math.min(1, k); ctx.font = "900 15px Nunito, sans-serif"; ctx.textAlign = "center"; ctx.lineWidth = 4; ctx.strokeStyle = "#2B2440"; ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.moveTo(p.x, y + 10); ctx.lineTo(p.x - 9, y - 2); ctx.lineTo(p.x + 9, y - 2); ctx.closePath(); ctx.fill();
    ctx.strokeText(label, p.x, y - 6); ctx.fillText(label, p.x, y - 6); ctx.restore();
  }

  // vzory na těle (kontext v těžišti)
  function drawPattern(pat, color) {
    if (!pat || pat === "none") return;
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, R, 0, 6.28); ctx.clip();
    const ink = "rgba(255,255,255,.55)";
    ctx.fillStyle = ink; ctx.strokeStyle = ink;
    switch (pat) {
      case "stripes": ctx.lineWidth = 2.5; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 5 - 10, 10); ctx.lineTo(i * 5 + 10, -10); ctx.stroke(); } break;
      case "dots": [[-4, -4], [4, -3], [0, 3], [-5, 4], [5, 5]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 1.8, 0, 6.28); ctx.fill(); }); break;
      case "ring": ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, R - 3, 0, 6.28); ctx.stroke(); break;
      case "half": ctx.fillRect(-R, 0, R * 2, R); break;
      case "star": ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? 2.2 : 5; i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr + 1) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr + 1); } ctx.closePath(); ctx.fill(); break;
      case "heart": ctx.beginPath(); ctx.moveTo(0, 5); ctx.bezierCurveTo(-7, 0, -3, -5, 0, -2); ctx.bezierCurveTo(3, -5, 7, 0, 0, 5); ctx.fill(); break;
      case "checker": for (let y = -9; y < 9; y += 4.5) for (let x = -9; x < 9; x += 4.5) if (((x + y) / 4.5) % 2 === 0) ctx.fillRect(x, y, 4.5, 4.5); break;
    }
    ctx.restore();
  }

  // klobouky – jednoduché tvary nad hlavou (kontext je v těžišti hráče)
  function drawHat(hat, color) {
    ctx.save(); ctx.translate(0, -R);
    const dark = "#2B2440";
    switch (hat) {
      case "cap": ctx.fillStyle = dark; ctx.beginPath(); ctx.arc(0, 1, 7, Math.PI, 0); ctx.fill(); ctx.fillRect(-2, 0, 11, 2.5); break;
      case "crown": ctx.fillStyle = "#FFCF5A"; ctx.beginPath(); ctx.moveTo(-7, 2); ctx.lineTo(-7, -6); ctx.lineTo(-3.5, -2); ctx.lineTo(0, -8); ctx.lineTo(3.5, -2); ctx.lineTo(7, -6); ctx.lineTo(7, 2); ctx.closePath(); ctx.fill(); ctx.fillStyle = "#FF5E7E"; ctx.beginPath(); ctx.arc(0, -1, 1.5, 0, 6.28); ctx.fill(); break;
      case "horns": ctx.fillStyle = "#FF5E7E"; [[-1, -7], [1, 7]].forEach(([s, x]) => { ctx.beginPath(); ctx.moveTo(x - 2, 2); ctx.quadraticCurveTo(x + s * 1, -4, x + s * 3, -9); ctx.quadraticCurveTo(x + s * 0.5, -3, x + 2, 2); ctx.fill(); }); break;
      case "halo": ctx.strokeStyle = "#FFCF5A"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, -6, 7, 2.5, 0, 0, 6.28); ctx.stroke(); break;
      case "antenna": ctx.strokeStyle = dark; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(2, -9); ctx.stroke(); ctx.fillStyle = "#FF5E7E"; ctx.beginPath(); ctx.arc(2, -10, 2.5, 0, 6.28); ctx.fill(); break;
      case "headphones": ctx.strokeStyle = dark; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 4, 9, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke(); ctx.fillStyle = dark; [[-9, 4], [9, 4]].forEach(([x, y]) => { ctx.beginPath(); ctx.ellipse(x, y, 2.5, 3.5, 0, 0, 6.28); ctx.fill(); }); break;
      case "tophat": ctx.fillStyle = dark; ctx.fillRect(-8, 0, 16, 2.5); ctx.fillRect(-5, -10, 10, 10.5); ctx.fillStyle = "#FF5E7E"; ctx.fillRect(-5, -3, 10, 2); break;
      case "bow": ctx.fillStyle = "#FF7AD9"; ctx.beginPath(); ctx.moveTo(4, -3); ctx.lineTo(-3, -7); ctx.lineTo(-3, 1); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(4, -3); ctx.lineTo(11, -7); ctx.lineTo(11, 1); ctx.closePath(); ctx.fill(); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(4, -3, 1.8, 0, 6.28); ctx.fill(); break;
      case "sprout": ctx.strokeStyle = "#4FD37A"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(1, -5, 0, -8); ctx.stroke(); ctx.fillStyle = "#4FD37A"; ctx.beginPath(); ctx.ellipse(-3, -7, 3.5, 2, -0.6, 0, 6.28); ctx.fill(); ctx.beginPath(); ctx.ellipse(3, -6, 3.5, 2, 0.6, 0, 6.28); ctx.fill(); break;
      case "helmet": ctx.fillStyle = "#D6D2E0"; ctx.beginPath(); ctx.arc(0, 2, 9.5, Math.PI, 0); ctx.fill(); ctx.fillStyle = color; ctx.fillRect(-1.5, -8, 3, 8); break;
      case "party": ctx.fillStyle = "#8A5CFF"; ctx.beginPath(); ctx.moveTo(-5, 1); ctx.lineTo(0, -11); ctx.lineTo(5, 1); ctx.closePath(); ctx.fill(); ctx.fillStyle = "#FFCF5A"; ctx.beginPath(); ctx.arc(0, -11, 2, 0, 6.28); ctx.fill(); ctx.fillStyle = "#5EE1D0"; ctx.fillRect(-3.5, -4, 7, 1.5); break;
      case "beanie": ctx.fillStyle = "#FF9A3C"; ctx.beginPath(); ctx.arc(0, 1, 8, Math.PI, 0); ctx.fill(); ctx.fillStyle = "#fff"; ctx.fillRect(-8, 0, 16, 3); ctx.beginPath(); ctx.arc(0, -8, 2.5, 0, 6.28); ctx.fill(); break;
      case "flower": ctx.fillStyle = "#FF7AD9"; [0, 1.26, 2.51, 3.77, 5.03].forEach(a => { ctx.beginPath(); ctx.arc(3 + Math.cos(a) * 4, -5 + Math.sin(a) * 4, 2.5, 0, 6.28); ctx.fill(); }); ctx.fillStyle = "#FFCF5A"; ctx.beginPath(); ctx.arc(3, -5, 2, 0, 6.28); ctx.fill(); break;
      case "cat": ctx.fillStyle = color; ctx.strokeStyle = dark; ctx.lineWidth = 1; [[-1, -6], [1, 6]].forEach(([s, x]) => { ctx.beginPath(); ctx.moveTo(x - 3, 1); ctx.lineTo(x, -7); ctx.lineTo(x + 3, 1); ctx.closePath(); ctx.fill(); ctx.stroke(); }); ctx.fillStyle = "#FF7AD9"; [[-6, -1], [6, -1]].forEach(([x, y]) => { ctx.beginPath(); ctx.moveTo(x - 1.5, y + 1); ctx.lineTo(x, y - 3); ctx.lineTo(x + 1.5, y + 1); ctx.closePath(); ctx.fill(); }); break;
      case "chef": ctx.fillStyle = "#fff"; ctx.fillRect(-6, -4, 12, 5); ctx.beginPath(); ctx.arc(-4, -6, 4, 0, 6.28); ctx.arc(0, -8, 4.5, 0, 6.28); ctx.arc(4, -6, 4, 0, 6.28); ctx.fill(); ctx.strokeStyle = "#D6D2E0"; ctx.lineWidth = 1; ctx.strokeRect(-6, -4, 12, 5); break;
      case "pirate": ctx.fillStyle = dark; ctx.beginPath(); ctx.moveTo(-10, 1); ctx.quadraticCurveTo(-8, -4, -6, -3); ctx.quadraticCurveTo(0, -12, 6, -3); ctx.quadraticCurveTo(8, -4, 10, 1); ctx.closePath(); ctx.fill(); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(0, -4, 2, 0, 6.28); ctx.fill(); ctx.fillStyle = dark; ctx.beginPath(); ctx.arc(-0.7, -4.5, 0.6, 0, 6.28); ctx.arc(0.7, -4.5, 0.6, 0, 6.28); ctx.fill(); break;
      case "viking": ctx.fillStyle = "#D6D2E0"; ctx.beginPath(); ctx.arc(0, 2, 9, Math.PI, 0); ctx.fill(); ctx.fillStyle = "#FFCF5A"; [[-1, -8], [1, 8]].forEach(([s, x]) => { ctx.beginPath(); ctx.moveTo(x, 2); ctx.quadraticCurveTo(x + s * 3, -3, x + s * 2, -10); ctx.quadraticCurveTo(x - s * 2, -4, x - s * 3, 1); ctx.closePath(); ctx.fill(); }); break;
      case "wizard": ctx.fillStyle = "#8A5CFF"; ctx.beginPath(); ctx.moveTo(-9, 2); ctx.lineTo(9, 2); ctx.lineTo(2, -14); ctx.closePath(); ctx.fill(); ctx.fillStyle = "#FFCF5A"; ctx.beginPath(); ctx.arc(1, -5, 1.6, 0, 6.28); ctx.arc(-2, -1, 1.2, 0, 6.28); ctx.fill(); break;
    }
    ctx.restore();
  }

  // náhled klobouku do obchodu
  function preview(cv, hat, color, pattern) {
    const c = cv.getContext("2d"); const S = cv.width;
    c.clearRect(0, 0, S, S); c.save(); c.translate(S / 2, S * 0.6); c.scale(S / 36, S / 36);
    const saved = ctx; ctx = c;
    c.fillStyle = color; c.beginPath(); c.arc(0, 0, R, 0, 6.28); c.fill();
    drawPattern(pattern, color);
    c.fillStyle = "#fff"; c.beginPath(); c.arc(-2.6, -1, 2.6, 0, 6.28); c.arc(2.6, -1, 2.6, 0, 6.28); c.fill();
    c.fillStyle = "#2B2440"; c.beginPath(); c.arc(-2.6, -1, 1.3, 0, 6.28); c.arc(2.6, -1, 1.3, 0, 6.28); c.fill();
    drawHat(hat, color);
    ctx = saved; c.restore();
  }

  // náhled klobouku do obchodu
  function preview(cv, hat, color, pattern) {
    const c = cv.getContext("2d"); const S = cv.width;
    c.clearRect(0, 0, S, S); c.save(); c.translate(S / 2, S * 0.6); c.scale(S / 36, S / 36);
    const saved = ctx; ctx = c;
    c.fillStyle = color; c.beginPath(); c.arc(0, 0, R, 0, 6.28); c.fill();
    drawPattern(pattern, color);
    c.fillStyle = "#fff"; c.beginPath(); c.arc(-2.6, -1, 2.6, 0, 6.28); c.arc(2.6, -1, 2.6, 0, 6.28); c.fill();
    c.fillStyle = "#2B2440"; c.beginPath(); c.arc(-2.6, -1, 1.3, 0, 6.28); c.arc(2.6, -1, 1.3, 0, 6.28); c.fill();
    drawHat(hat, color);
    ctx = saved; c.restore();
  }

  function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); ctx.fill(); }

  return { init, draw, setPalette, burst, ring, popup, kick, toWorld, preview, HATS, PATTERNS, get scale() { return scale; } };
})();
