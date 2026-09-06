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

  // ---------- hlavní kreslení. view = {islands, players:[{x,y,a,color,name,hat,hp,dead,spd,me}], balls, chests, objective, phase, countdown, showMe}
  function draw(view, dt) {
    tickFx(dt);
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    if (shake > 0) ctx.translate((Math.random() - 0.5) * shake * 8, (Math.random() - 0.5) * shake * 8);
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#1E4F8A"); g.addColorStop(1, "#173D6E"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(255,255,255,.08)"; ctx.lineWidth = 1.5;
    for (let i = 0; i < 26; i++) { const y = ((i * 47 + t * 12) % (H + 40)) - 20, x = (i * 89) % W; ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.quadraticCurveTo(x - 6, y - 3, x, y); ctx.quadraticCurveTo(x + 6, y + 3, x + 12, y); ctx.stroke(); }
    for (const o of view.islands || []) { ctx.fillStyle = "rgba(255,255,255,.25)"; ctx.beginPath(); ctx.arc(o.x, o.y, o.r + 6, 0, 6.28); ctx.fill(); ctx.fillStyle = "#E8D9A8"; ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, 6.28); ctx.fill(); ctx.fillStyle = "#6BBF59"; ctx.beginPath(); ctx.arc(o.x - 2, o.y - 3, o.r * 0.55, 0, 6.28); ctx.fill(); }
    if (view.objective) { const z = view.objective; ctx.setLineDash([8, 6]); ctx.lineDashOffset = -t * 20; ctx.strokeStyle = z.contested ? "#FF5E7E" : z.holderColor || "#FFCF5A"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, 6.28); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = z.holderColor || "rgba(255,207,90,.5)"; ctx.globalAlpha = 0.15; ctx.fill(); ctx.globalAlpha = 1; }
    for (const c of view.chests || []) { ctx.save(); ctx.translate(c.x, c.y + Math.sin(t * 3 + c.x) * 2); ctx.fillStyle = "#8B5A2B"; ctx.fillRect(-8, -6, 16, 12); ctx.fillStyle = "#FFCF5A"; ctx.fillRect(-8, -2, 16, 3); ctx.fillRect(-2, -6, 4, 12); ctx.restore(); }
    for (const b of view.balls || []) { ctx.fillStyle = "#1B1030"; ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, 6.28); ctx.fill(); }
    for (const r of rings) { ctx.globalAlpha = Math.max(0, r.life * 2); ctx.strokeStyle = r.c; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, 6.28); ctx.stroke(); } ctx.globalAlpha = 1;
    for (const p of view.players) if (!p.dead) drawShip(p);
    if (view.showMe) { const me = view.players.find(p => p.me); if (me && !me.dead) drawMeArrow(me, view.showMe); }
    for (const p of particles) { ctx.globalAlpha = Math.min(1, p.life / p.max * 1.5); ctx.fillStyle = p.c; ctx.fillRect(p.x - 2, p.y - 2, 4, 4); } ctx.globalAlpha = 1;
    ctx.font = "700 14px Nunito, sans-serif"; ctx.textAlign = "center";
    for (const p of popups) { ctx.globalAlpha = p.life; ctx.fillStyle = p.c; ctx.lineWidth = 3; ctx.strokeStyle = "rgba(0,0,0,.5)"; ctx.strokeText(p.text, p.x, p.y); ctx.fillText(p.text, p.x, p.y); } ctx.globalAlpha = 1;
    if (view.phase === "countdown") { ctx.fillStyle = "rgba(10,20,40,.45)"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "#fff"; ctx.font = "800 96px Nunito, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(Math.max(1, Math.ceil(view.countdown)), W / 2, H / 2); ctx.textBaseline = "alphabetic"; }
  }
  function drawShip(p) {
    ctx.save(); ctx.translate(p.x, p.y);
    // brázda
    if (p.spd > 20) { ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-Math.cos(p.a) * 12, -Math.sin(p.a) * 12); ctx.lineTo(-Math.cos(p.a) * (12 + p.spd * 0.3) - Math.sin(p.a) * 5, -Math.sin(p.a) * (12 + p.spd * 0.3) + Math.cos(p.a) * 5); ctx.moveTo(-Math.cos(p.a) * 12, -Math.sin(p.a) * 12); ctx.lineTo(-Math.cos(p.a) * (12 + p.spd * 0.3) + Math.sin(p.a) * 5, -Math.sin(p.a) * (12 + p.spd * 0.3) - Math.cos(p.a) * 5); ctx.stroke(); }
    ctx.rotate(p.a);
    ctx.fillStyle = "#5C3A1E"; ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(4, -8); ctx.lineTo(-12, -8); ctx.lineTo(-14, 0); ctx.lineTo(-12, 8); ctx.lineTo(4, 8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#8B5A2B"; ctx.beginPath(); ctx.moveTo(13, 0); ctx.lineTo(3, -5); ctx.lineTo(-10, -5); ctx.lineTo(-11, 0); ctx.lineTo(-10, 5); ctx.lineTo(3, 5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = p.color; ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(-3, -12); ctx.quadraticCurveTo(6, -6, 8, 0); ctx.quadraticCurveTo(6, 6, -3, 12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#2B2440"; ctx.fillRect(-4, -1, 2, 2);
    if (p.stun) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 14, 0, 6.28); ctx.stroke(); }
    ctx.restore();
    // HP + jméno
    for (let i = 0; i < 3; i++) { ctx.fillStyle = i < p.hp ? "#B6FF5A" : "rgba(0,0,0,.35)"; ctx.fillRect(p.x - 9 + i * 6.5, p.y - 20, 5, 3); }
    if (p.chest) { ctx.fillStyle = "#FFCF5A"; ctx.font = "800 10px Nunito, sans-serif"; ctx.textAlign = "center"; ctx.fillText("💰" + p.chest, p.x, p.y - 24); }
    ctx.font = "700 10px Nunito, sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "rgba(255,255,255,.9)"; ctx.fillText(p.name, p.x, p.y + 24);
    if (p.me && p.fireCd) { ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, R + 6, -1.57, -1.57 + 6.28 * (1 - p.fireCd), false); ctx.stroke(); }
  }
  function drawMeArrow(p, k) { const bob = Math.sin(t * 8) * 4, y = p.y - 34 + bob, label = p.meLabel || "YOU"; ctx.save(); ctx.globalAlpha = Math.min(1, k); ctx.font = "900 15px Nunito, sans-serif"; ctx.textAlign = "center"; ctx.lineWidth = 4; ctx.strokeStyle = "#1B1030"; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(p.x, y + 10); ctx.lineTo(p.x - 9, y - 2); ctx.lineTo(p.x + 9, y - 2); ctx.closePath(); ctx.fill(); ctx.strokeText(label, p.x, y - 6); ctx.fillText(label, p.x, y - 6); ctx.restore(); }
  // náhled klobouku do obchodu
  function preview(cv, hat, color, pattern) {
    const c = cv.getContext("2d"); const S = cv.width;
    c.clearRect(0, 0, S, S); c.save(); c.translate(S / 2, S * 0.6); c.scale(S / 36, S / 36);
    const saved = ctx; ctx = c;
    drawShip({ x: 0, y: -4, a: -Math.PI / 2, color, name: "", hp: 3, spd: 0 });
    ctx = saved; c.restore();
  }

  function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); ctx.fill(); }

  function fullPaint() {} function applyDeltas() {}
  return { init, draw, fullPaint, applyDeltas, setPalette, burst, ring, popup, kick, toWorld, preview, HATS, PATTERNS, get scale() { return scale; } };
})();
