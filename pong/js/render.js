// Kreslení. Barva se drží v malém offscreen plátně (1 pixel = 1 buňka) a jen se zvětšuje – rychlé i na slabém mobilu.
window.Render = (() => {
  const { W, H, R, COLORS } = Sim;
  let canvas, ctx, scale = 1, dpr = 1;
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

  // ---------- kreslení. view = {players:[{x,y,w,color,name,me,team}], balls, score, phase, countdown, showMe}
  const trail = [];
  function draw(view, dt) {
    tickFx(dt);
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    if (shake > 0) ctx.translate((Math.random() - 0.5) * shake * 8, (Math.random() - 0.5) * shake * 8);
    ctx.fillStyle = "#1B1030"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,94,126,.08)"; ctx.fillRect(0, H / 2, W, H / 2); ctx.fillStyle = "rgba(94,225,208,.08)"; ctx.fillRect(0, 0, W, H / 2);
    ctx.setLineDash([10, 10]); ctx.strokeStyle = "rgba(255,255,255,.25)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = "rgba(255,255,255,.15)"; ctx.beginPath(); ctx.arc(W / 2, H / 2, 40, 0, 6.28); ctx.stroke();
    if (view.score) { ctx.font = "900 64px Nunito, sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "rgba(94,225,208,.35)"; ctx.fillText(view.score[1], W / 2, H / 2 - 24); ctx.fillStyle = "rgba(255,94,126,.35)"; ctx.fillText(view.score[0], W / 2, H / 2 + 72); }
    for (const b of view.balls || []) { trail.push({ x: b.x, y: b.y, life: 0.25 }); }
    for (const tr of trail) { tr.life -= dt; ctx.globalAlpha = Math.max(0, tr.life * 2); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(tr.x, tr.y, R * 0.7, 0, 6.28); ctx.fill(); } ctx.globalAlpha = 1; while (trail.length && trail[0].life <= 0) trail.shift(); if (trail.length > 40) trail.splice(0, trail.length - 40);
    for (const b of view.balls || []) { ctx.shadowColor = "#fff"; ctx.shadowBlur = 12; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(b.x, b.y, R, 0, 6.28); ctx.fill(); ctx.shadowBlur = 0; }
    for (const p of view.players) { const y = p.y; ctx.fillStyle = "rgba(0,0,0,.35)"; roundRect(p.x - p.w / 2, y - 5 + 3, p.w, 10, 5); ctx.fillStyle = p.color; roundRect(p.x - p.w / 2, y - 5, p.w, 10, 5); ctx.fillStyle = "rgba(255,255,255,.35)"; roundRect(p.x - p.w / 2 + 4, y - 4, p.w - 8, 3, 2); ctx.font = "800 10px Nunito, sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.fillText(p.name, p.x, p.team === 1 ? y + 20 : y - 12); if (p.me && view.showMe) drawMeArrow({ x: p.x, y: p.team === 1 ? y + 40 : y - 20, meLabel: p.meLabel }, view.showMe); }
    for (const r of rings) { ctx.globalAlpha = Math.max(0, r.life * 2); ctx.strokeStyle = r.c; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, 6.28); ctx.stroke(); } ctx.globalAlpha = 1;
    for (const p of particles) { ctx.globalAlpha = Math.min(1, p.life / p.max * 1.5); ctx.fillStyle = p.c; ctx.fillRect(p.x - 2, p.y - 2, 4, 4); } ctx.globalAlpha = 1;
    ctx.font = "700 14px Nunito, sans-serif"; ctx.textAlign = "center";
    for (const p of popups) { ctx.globalAlpha = p.life; ctx.fillStyle = p.c; ctx.lineWidth = 3; ctx.strokeStyle = "rgba(0,0,0,.5)"; ctx.strokeText(p.text, p.x, p.y); ctx.fillText(p.text, p.x, p.y); } ctx.globalAlpha = 1;
    if (view.phase === "countdown") { ctx.fillStyle = "rgba(10,6,20,.45)"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "#fff"; ctx.font = "800 96px Nunito, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(Math.max(1, Math.ceil(view.countdown)), W / 2, H / 2); ctx.textBaseline = "alphabetic"; }
  }
  function drawMeArrow(p, k) { const bob = Math.sin(t * 8) * 4, y = p.y - 10 + bob, label = p.meLabel || "YOU"; ctx.save(); ctx.globalAlpha = Math.min(1, k); ctx.font = "900 15px Nunito, sans-serif"; ctx.textAlign = "center"; ctx.lineWidth = 4; ctx.strokeStyle = "#1B1030"; ctx.fillStyle = "#fff"; ctx.strokeText(label, p.x, y); ctx.fillText(label, p.x, y); ctx.restore(); }
  // náhled klobouku do obchodu
  function preview(cv, hat, color, pattern) {
    const c = cv.getContext("2d"); const S = cv.width;
    c.clearRect(0, 0, S, S); c.save(); c.translate(S / 2, S * 0.6); c.scale(S / 36, S / 36);
    const saved = ctx; ctx = c;
    c.fillStyle = color; c.beginPath(); c.roundRect ? c.roundRect(-14, -3, 28, 6, 3) : c.rect(-14, -3, 28, 6); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.arc(0, -10, 4, 0, 6.28); c.fill();
    ctx = saved; c.restore();
  }

  function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); ctx.fill(); }

  function fullPaint() {} function applyDeltas() {}
  return { init, draw, fullPaint, applyDeltas, setPalette, burst, ring, popup, kick, toWorld, preview, HATS, PATTERNS, get scale() { return scale; } };
})();
