// Kreslení. Barva se drží v malém offscreen plátně (1 pixel = 1 buňka) a jen se zvětšuje – rychlé i na slabém mobilu.
window.Render = (() => {
  const { W, H, CELL, GW, GH, R, COLORS } = Sim;
  let canvas, ctx, scale = 1, dpr = 1;
  function setPalette() {}
  const smooth = new Map();
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

  // ---------- hlavní kreslení. view = {players:[{body,color,name,dir,dead,boost,me}], food, phase, countdown, showMe}
  function draw(view, dt) {
    tickFx(dt);
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    if (shake > 0) ctx.translate((Math.random() - 0.5) * shake * 8, (Math.random() - 0.5) * shake * 8);
    ctx.fillStyle = "#1B1030"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,255,255,.03)"; for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if ((x + y) & 1) ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
    ctx.strokeStyle = "#FF5E7E"; ctx.lineWidth = 3; ctx.strokeRect(1.5, 1.5, W - 3, H - 3);
    for (const f of view.food || []) { const x = (f % GW) * CELL + CELL / 2, y = ((f / GW) | 0) * CELL + CELL / 2; ctx.fillStyle = "#FFCF5A"; ctx.beginPath(); ctx.arc(x, y, 3.2 + Math.sin(t * 5 + f) * 0.6, 0, 6.28); ctx.fill(); }
    for (const p of view.players) { if (p.dead || !p.body || !p.body.length) { smooth.delete(p.name); continue; }
      // plynulý pohyb: každý článek se dohání ke své cílové buňce (i mezi kroky mřížky)
      let sm = smooth.get(p.name); if (!sm || sm.n !== p.body.length || Math.abs(sm.pts[0].x - (p.body[0] % GW) * CELL) > CELL * 3 || Math.abs(sm.pts[0].y - ((p.body[0] / GW) | 0) * CELL) > CELL * 3) { sm = { n: p.body.length, pts: p.body.map(c => ({ x: (c % GW) * CELL, y: ((c / GW) | 0) * CELL })) }; smooth.set(p.name, sm); }
      const k = Math.min(1, dt * (p.boost ? 22 : 13));
      for (let i = 0; i < p.body.length; i++) { const c = p.body[i], tx = (c % GW) * CELL, ty = ((c / GW) | 0) * CELL, q = sm.pts[i]; q.x += (tx - q.x) * k; q.y += (ty - q.y) * k; }
      ctx.fillStyle = p.color; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = p.color; ctx.lineWidth = CELL - 2.4;
      ctx.beginPath(); sm.pts.forEach((q, i) => { const x = q.x + CELL / 2, y = q.y + CELL / 2; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); if (sm.pts.length === 1) ctx.lineTo(sm.pts[0].x + CELL / 2 + 0.1, sm.pts[0].y + CELL / 2); ctx.stroke();
      if (p.boost) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(sm.pts[0].x + CELL / 2, sm.pts[0].y + CELL / 2, CELL * 0.75, 0, 6.28); ctx.stroke(); }
      const hx = sm.pts[0].x + CELL / 2, hy = sm.pts[0].y + CELL / 2, d = [[1, 0], [0, 1], [-1, 0], [0, -1]][p.dir] || [1, 0];
      ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(hx, hy, CELL * 0.55, 0, 6.28); ctx.fill();
      ctx.fillStyle = "#1B1030"; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(hx + d[0] * 1.5 + d[1] * s * 2.2, hy + d[1] * 1.5 + d[0] * s * 2.2, 1.3, 0, 6.28); ctx.fill(); }
      ctx.font = "800 9px Nunito, sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.fillText(p.name, hx, hy - 8);
      if (p.me && view.showMe) drawMeArrow({ x: hx, y: hy, meLabel: p.meLabel }, view.showMe);
    }
    for (const r of rings) { ctx.globalAlpha = Math.max(0, r.life * 2); ctx.strokeStyle = r.c; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, 6.28); ctx.stroke(); } ctx.globalAlpha = 1;
    for (const p of particles) { ctx.globalAlpha = Math.min(1, p.life / p.max * 1.5); ctx.fillStyle = p.c; ctx.fillRect(p.x - 2, p.y - 2, 4, 4); } ctx.globalAlpha = 1;
    ctx.font = "700 14px Nunito, sans-serif"; ctx.textAlign = "center";
    for (const p of popups) { ctx.globalAlpha = p.life; ctx.fillStyle = p.c; ctx.lineWidth = 3; ctx.strokeStyle = "rgba(0,0,0,.5)"; ctx.strokeText(p.text, p.x, p.y); ctx.fillText(p.text, p.x, p.y); } ctx.globalAlpha = 1;
    if (view.phase === "countdown") { ctx.fillStyle = "rgba(10,6,20,.45)"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "#fff"; ctx.font = "800 96px Nunito, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(Math.max(1, Math.ceil(view.countdown)), W / 2, H / 2); ctx.textBaseline = "alphabetic"; }
  }
  function drawMeArrow(p, k) { const bob = Math.sin(t * 8) * 4, y = p.y - 30 + bob, label = p.meLabel || "YOU"; ctx.save(); ctx.globalAlpha = Math.min(1, k); ctx.font = "900 15px Nunito, sans-serif"; ctx.textAlign = "center"; ctx.lineWidth = 4; ctx.strokeStyle = "#1B1030"; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(p.x, y + 10); ctx.lineTo(p.x - 9, y - 2); ctx.lineTo(p.x + 9, y - 2); ctx.closePath(); ctx.fill(); ctx.strokeText(label, p.x, y - 6); ctx.fillText(label, p.x, y - 6); ctx.restore(); }
  // náhled klobouku do obchodu
  function preview(cv, hat, color, pattern) {
    const c = cv.getContext("2d"); const S = cv.width;
    c.clearRect(0, 0, S, S); c.save(); c.translate(S / 2, S * 0.6); c.scale(S / 36, S / 36);
    const saved = ctx; ctx = c;
    c.fillStyle = color; for (let i = 0; i < 4; i++) { c.beginPath(); c.roundRect ? c.roundRect(-14 + i * 7 - 3, -3, 7, 7, 2) : c.rect(-14 + i * 7 - 3, -3, 7, 7); c.fill(); }
    c.fillStyle = "#2B2440"; c.beginPath(); c.arc(9, -1.5, 1.2, 0, 6.28); c.arc(9, 1.5, 1.2, 0, 6.28); c.fill();
    ctx = saved; c.restore();
  }

  function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); ctx.fill(); }

  function fullPaint() {} function applyDeltas() {}
  return { init, draw, fullPaint, applyDeltas, setPalette, burst, ring, popup, kick, toWorld, preview, HATS, PATTERNS, get scale() { return scale; } };
})();
