// Kreslení. Barva se drží v malém offscreen plátně (1 pixel = 1 buňka) a jen se zvětšuje – rychlé i na slabém mobilu.
window.Render = (() => {
  const { W, H, CELL, GW, GH, R, COLORS } = Sim;
  let canvas, ctx, scale = 1, dpr = 1;
  const paintCv = document.createElement("canvas"); paintCv.width = GW; paintCv.height = GH;
  const pctx = paintCv.getContext("2d");
  const img = pctx.createImageData(GW, GH);
  let rgb = [];
  const hexRgb = (hex) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  // paleta: index barvy (slot+1 nebo tým+1) -> barva; nastavuje se při startu kola
  function setPalette(colors) { rgb = colors.map(hexRgb); }
  setPalette(COLORS);
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

  // ---------- barva
  function setCell(idx, owner) {
    const o = idx * 4;
    if (!owner || !rgb[owner - 1]) { img.data[o + 3] = 0; return; }
    const c = rgb[owner - 1]; img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
  }
  function fullPaint(paint) { for (let i = 0; i < paint.length; i++) setCell(i, paint[i]); pctx.putImageData(img, 0, 0); }
  function applyDeltas(deltas) { for (const d of deltas) setCell(d >> 4, d & 15); pctx.putImageData(img, 0, 0); }

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

  // ---------- hlavní kreslení. view = {obstacles, players:[{x,y,dir,color,name,hat,stun,dash,boost,me,slot,dashCd}], powerups, time, phase, countdown}
  function draw(view, dt) {
    tickFx(dt);
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    if (shake > 0) ctx.translate((Math.random() - 0.5) * shake * 8, (Math.random() - 0.5) * shake * 8);

    // podklad
    const g = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, 420); g.addColorStop(0, "#3A2A5A"); g.addColorStop(1, "#1F1538");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(255,255,255,0.05)"; ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // barva
    ctx.imageSmoothingEnabled = false;

    ctx.imageSmoothingEnabled = true;

    // překážky
    for (const o of view.obstacles) { ctx.fillStyle = "#12091F";
      ctx.fillStyle = "#0F0A1C"; roundRect(o.x, o.y, o.w, o.h, 6);
      ctx.fillStyle = "rgba(255,255,255,.12)"; roundRect(o.x + 3, o.y + 3, o.w - 6, 5, 3);
    }

    // cíl módu
    if (view.objective) {
      const o = view.objective;
      ctx.save(); ctx.translate(o.x, o.y);
      if (o.kind === "target") {
        const pulse = 1 + Math.sin(t * 6) * 0.08;
        ctx.strokeStyle = "#2B2440"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, o.r * pulse, 0, 6.28); ctx.stroke();
        ctx.fillStyle = "#FFCF5A"; ctx.beginPath(); ctx.arc(0, 0, o.r * 0.55, 0, 6.28); ctx.fill();
        ctx.fillStyle = "#2B2440"; ctx.beginPath(); ctx.arc(0, 0, o.r * 0.2, 0, 6.28); ctx.fill();
      } else {
        ctx.fillStyle = o.contested ? "rgba(255,94,126,.18)" : o.holderColor ? o.holderColor + "44" : "rgba(43,36,64,.12)";
        ctx.beginPath(); ctx.arc(0, 0, o.r, 0, 6.28); ctx.fill();
        ctx.strokeStyle = "#2B2440"; ctx.lineWidth = 2; ctx.setLineDash([8, 6]); ctx.lineDashOffset = -t * 20; ctx.beginPath(); ctx.arc(0, 0, o.r, 0, 6.28); ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.restore();
    }
    // power-upy
    for (const pu of view.powerups) {
      const bob = Math.sin(t * 4 + pu.id) * 2;
      ctx.save(); ctx.translate(pu.x, pu.y + bob);
      ctx.shadowColor = "rgba(0,0,0,.25)"; ctx.shadowBlur = 8;
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(0, 0, 10, 0, 6.28); ctx.fill(); ctx.shadowBlur = 0;
      drawPowerupIcon(pu.kind);
      ctx.restore();
    }
    // střely
    for (const pr of view.projectiles || []) {
      ctx.fillStyle = pr.color || "#2B2440"; ctx.beginPath(); ctx.arc(pr.x, pr.y, 4.5, 0, 6.28); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.5)"; ctx.beginPath(); ctx.arc(pr.x - 1, pr.y - 1, 1.5, 0, 6.28); ctx.fill();
    }

    // kruhy
    for (const r of rings) { ctx.globalAlpha = Math.max(0, r.life * 2); ctx.strokeStyle = r.c; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, 6.28); ctx.stroke(); }
    ctx.globalAlpha = 1;

    // hráči (omráčení pod ostatními)
    const ps = [...view.players].filter(p => !p.dead).sort((a, b) => (b.stun ? 1 : 0) - (a.stun ? 1 : 0));
    for (const p of ps) drawPlayer(p);
    // šipka "TY" nad vlastním hráčem na začátku kola
    if (view.showMe) { const me = view.players.find(p => p.me); if (me && !me.dead) drawMeArrow(me, view.showMe); }

    // částice
    for (const p of particles) { ctx.globalAlpha = Math.min(1, p.life / p.max * 1.5); ctx.fillStyle = p.c; ctx.fillRect(p.x - 2, p.y - 2, 4, 4); }
    ctx.globalAlpha = 1;
    // popupy
    ctx.font = "700 14px Nunito, sans-serif"; ctx.textAlign = "center";
    for (const p of popups) { ctx.globalAlpha = p.life; ctx.fillStyle = p.c; ctx.fillText(p.text, p.x, p.y); }
    ctx.globalAlpha = 1;

    // odpočet
    if (view.phase === "countdown") {
      ctx.fillStyle = "rgba(43,36,64,.35)"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#fff"; ctx.font = "800 96px Nunito, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(Math.max(1, Math.ceil(view.countdown)), W / 2, H / 2);
      ctx.textBaseline = "alphabetic";
    }
  }

  function drawPlayer(p) {
    const stunned = p.stun, dashing = p.dash;
    ctx.save(); ctx.translate(p.x, p.y);
    if (p.giant) { const s = 1.5; ctx.scale(s, s); }
    if (stunned) ctx.rotate(Math.sin(t * 20) * 0.25);
    // stín
    ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.beginPath(); ctx.ellipse(0, R * 0.8, R * 0.9, R * 0.4, 0, 0, 6.28); ctx.fill();
    // tělo
    if (dashing || p.boost) { ctx.shadowColor = p.color; ctx.shadowBlur = 14; }
    ctx.fillStyle = p.frozen ? "#9ED8FF" : p.color; ctx.beginPath(); ctx.arc(0, 0, R + (dashing ? 1.5 : 0), 0, 6.28); ctx.fill();
    ctx.shadowBlur = 0;
    drawPattern(p.pattern, p.color);
    if (p.bomb) { const blink = Math.sin(t * (6 + (1 - Math.min(1, p.fuse / 10)) * 24)) > 0; if (blink) { ctx.globalAlpha = 0.35; ctx.fillStyle = "#FF5E7E"; ctx.beginPath(); ctx.arc(0, 0, R + 10, 0, 6.28); ctx.fill(); ctx.globalAlpha = 1; }
      ctx.fillStyle = "#2B2440"; ctx.beginPath(); ctx.arc(0, -R - 12, 9, 0, 6.28); ctx.fill(); ctx.strokeStyle = "#2B2440"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(3, -R - 20); ctx.quadraticCurveTo(8, -R - 28, 12, -R - 24); ctx.stroke(); ctx.fillStyle = blink ? "#FF9A3C" : "#FFCF5A"; ctx.beginPath(); ctx.arc(12, -R - 24, 3, 0, 6.28); ctx.fill(); ctx.fillStyle = "rgba(255,255,255,.5)"; ctx.beginPath(); ctx.arc(-3, -R - 15, 3, 0, 6.28); ctx.fill(); }
    if (false) { const blink = false; ctx.fillStyle = "#2B2440"; ctx.beginPath(); ctx.arc(R + 6, -R - 2, 5.5, 0, 6.28); ctx.fill(); ctx.strokeStyle = "#2B2440"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(R + 8, -R - 6); ctx.quadraticCurveTo(R + 11, -R - 10, R + 13, -R - 8); ctx.stroke(); ctx.fillStyle = blink ? "#FF9A3C" : "#FFCF5A"; ctx.beginPath(); ctx.arc(R + 13, -R - 8, 2, 0, 6.28); ctx.fill(); if (blink) { ctx.globalAlpha = 0.18; ctx.fillStyle = "#FF5E7E"; ctx.beginPath(); ctx.arc(0, 0, 67 / (p.giant ? 1.5 : 1), 0, 6.28); ctx.fill(); ctx.globalAlpha = 1; } }
    if (p.frenzy) { ctx.strokeStyle = "#FFCF5A"; ctx.lineWidth = 2; for (let i = 0; i < 6; i++) { const a = t * 12 + i * 1.05; ctx.beginPath(); ctx.moveTo(Math.cos(a) * (R + 4), Math.sin(a) * (R + 4)); ctx.lineTo(Math.cos(a) * (R + 9), Math.sin(a) * (R + 9)); ctx.stroke(); } }
    if (p.shield) { ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, R + 5 + Math.sin(t * 6), 0, 6.28); ctx.stroke(); ctx.strokeStyle = "rgba(94,225,208,.8)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, R + 7 + Math.sin(t * 6), 0, 6.28); ctx.stroke(); }
    if (p.me) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, R + 2.5, 0, 6.28); ctx.stroke(); }
    if (p.gun) { ctx.save(); ctx.rotate(p.dir); ctx.fillStyle = "#2B2440"; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(R - 3, -3.5, 8, 7, 2) : ctx.rect(R - 3, -3.5, 8, 7); ctx.fill(); ctx.strokeStyle = "#FF5E7E"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(R + 9, 0, 3, 0, 6.28); ctx.stroke(); ctx.restore(); for (let i = 0; i < p.gun; i++) { ctx.fillStyle = "#FF5E7E"; ctx.beginPath(); ctx.arc(-6 + i * 6, R + 6, 2, 0, 6.28); ctx.fill(); } }
    // odlesk
    ctx.fillStyle = "rgba(255,255,255,.45)"; ctx.beginPath(); ctx.arc(-3, -3.5, 3, 0, 6.28); ctx.fill();
    // oči podle směru
    const ex = Math.cos(p.dir) * 3, ey = Math.sin(p.dir) * 3;
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(ex - 2.6, ey - 1, 2.6, 0, 6.28); ctx.arc(ex + 2.6, ey - 1, 2.6, 0, 6.28); ctx.fill();
    ctx.fillStyle = "#2B2440";
    if (stunned) { ctx.lineWidth = 1.2; ctx.strokeStyle = "#2B2440"; [[-2.6, -1], [2.6, -1]].forEach(([x, y]) => { ctx.beginPath(); ctx.moveTo(x - 1.5, y - 1.5); ctx.lineTo(x + 1.5, y + 1.5); ctx.moveTo(x + 1.5, y - 1.5); ctx.lineTo(x - 1.5, y + 1.5); ctx.stroke(); }); }
    else { ctx.beginPath(); ctx.arc(ex * 1.3 - 2.6, ey * 1.3 - 1, 1.3, 0, 6.28); ctx.arc(ex * 1.3 + 2.6, ey * 1.3 - 1, 1.3, 0, 6.28); ctx.fill(); }
    drawHat(p.hat, p.color);
    ctx.restore();
    // jméno
    ctx.font = "700 10px Nunito, sans-serif"; ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.fillText(p.name, p.x, p.y + R + 14);
    // cooldown dashe (jen já)
    if (p.me && p.dashCd) { ctx.strokeStyle = "rgba(43,36,64,.35)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, R + 5, -1.57, -1.57 + 6.28 * (1 - p.dashCd), false); ctx.stroke(); }
  }

  function drawPowerupIcon(kind) {
    const dark = "#2B2440";
    if (kind === "bomb") { ctx.fillStyle = dark; ctx.beginPath(); ctx.arc(0, 1, 5.5, 0, 6.28); ctx.fill(); ctx.strokeStyle = dark; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(2, -4); ctx.quadraticCurveTo(5, -8, 7, -6); ctx.stroke(); ctx.fillStyle = "#FF9A3C"; ctx.beginPath(); ctx.arc(7, -6, 1.8, 0, 6.28); ctx.fill(); }
    else if (kind === "speed") { ctx.fillStyle = "#FFCF5A"; ctx.beginPath(); ctx.moveTo(1, -7); ctx.lineTo(-4, 1); ctx.lineTo(0, 1); ctx.lineTo(-1, 7); ctx.lineTo(4, -1); ctx.lineTo(0, -1); ctx.closePath(); ctx.fill(); }
    else if (kind === "shield") { ctx.fillStyle = "#5EE1D0"; ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(6, -4); ctx.lineTo(5, 3); ctx.lineTo(0, 7); ctx.lineTo(-5, 3); ctx.lineTo(-6, -4); ctx.closePath(); ctx.fill(); ctx.strokeStyle = dark; ctx.lineWidth = 1.2; ctx.stroke(); }
    else if (kind === "giant") { ctx.strokeStyle = "#8A5CFF"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-6, 6); ctx.lineTo(-6, 0); ctx.moveTo(-6, 6); ctx.lineTo(0, 6); ctx.moveTo(6, -6); ctx.lineTo(6, 0); ctx.moveTo(6, -6); ctx.lineTo(0, -6); ctx.moveTo(-5, 5); ctx.lineTo(5, -5); ctx.stroke(); }
    else if (kind === "gun") { ctx.strokeStyle = dark; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 5.5, 0, 6.28); ctx.stroke(); ctx.beginPath(); [[0, -8, 0, -3], [0, 3, 0, 8], [-8, 0, -3, 0], [3, 0, 8, 0]].forEach(([a, b, c, d]) => { ctx.moveTo(a, b); ctx.lineTo(c, d); }); ctx.stroke(); ctx.fillStyle = "#FF5E7E"; ctx.beginPath(); ctx.arc(0, 0, 2, 0, 6.28); ctx.fill(); }
    else if (kind === "frenzy") { ctx.fillStyle = "#FFCF5A"; for (let i = 0; i < 3; i++) { const x = -6 + i * 6; ctx.beginPath(); ctx.moveTo(x + 1, -6); ctx.lineTo(x - 2, 0); ctx.lineTo(x, 0); ctx.lineTo(x - 1, 6); ctx.lineTo(x + 2, -1); ctx.lineTo(x, -1); ctx.closePath(); ctx.fill(); } }
    else if (kind === "freeze") { ctx.strokeStyle = "#6FC3FF"; ctx.lineWidth = 1.6; for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 7, Math.sin(a) * 7); ctx.lineTo(-Math.cos(a) * 7, -Math.sin(a) * 7); ctx.stroke(); } }
  }

  function drawMeArrow(p, k) {
    const bob = Math.sin(t * 8) * 4;
    const below = p.y < 80;                       // u horního okraje šipka zespodu
    const label = p.meLabel || "TY";
    ctx.save(); ctx.globalAlpha = Math.min(1, k);
    ctx.font = "900 15px Nunito, sans-serif"; ctx.textAlign = "center"; ctx.lineWidth = 4; ctx.strokeStyle = "#fff"; ctx.fillStyle = "#2B2440";
    if (below) {
      const y = p.y + R + 26 - bob;
      ctx.beginPath(); ctx.moveTo(p.x, y - 10); ctx.lineTo(p.x - 9, y + 2); ctx.lineTo(p.x + 9, y + 2); ctx.closePath(); ctx.fill();
      ctx.strokeText(label, p.x, y + 18); ctx.fillText(label, p.x, y + 18);
    } else {
      const y = p.y - R - 34 + bob;
      ctx.beginPath(); ctx.moveTo(p.x, y + 10); ctx.lineTo(p.x - 9, y - 2); ctx.lineTo(p.x + 9, y - 2); ctx.closePath(); ctx.fill();
      ctx.strokeText(label, p.x, y - 6); ctx.fillText(label, p.x, y - 6);
    }
    ctx.restore();
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

  function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); ctx.fill(); }

  return { init, draw, fullPaint, applyDeltas, setPalette, burst, ring, popup, kick, toWorld, preview, HATS, PATTERNS, get scale() { return scale; } };
})();
