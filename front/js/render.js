// Kreslení mapy Front. Offscreen plátno 4 px na pole, hlavní plátno 896x576 (landscape, PC).
window.Render = (() => {
  const { GW, GH, N, COLORS } = Sim;
  const CS = 4, OW = GW * CS, OH = GH * CS, W = 896, H = 576;
  let canvas, ctx, scale = 1, dpr = 1;
  const off = document.createElement("canvas"); off.width = OW; off.height = OH; const octx = off.getContext("2d");
  let terrain = null, owner = null, palette = COLORS;
  let t = 0, particles = [], popups = [];
  const HATS = { none: { price: 0 }, cap: { price: 150 }, crown: { price: 1000 } }, PATTERNS = { none: { price: 0 } };

  function init(cv) { canvas = cv; ctx = cv.getContext("2d"); resize(); window.addEventListener("resize", resize); }
  function resize() { const st = canvas.parentElement, sw = st.clientWidth, sh = st.clientHeight; scale = Math.min(sw / W, sh / H); dpr = Math.min(window.devicePixelRatio || 1, 2); canvas.width = Math.round(W * scale * dpr); canvas.height = Math.round(H * scale * dpr); canvas.style.width = Math.round(W * scale) + "px"; canvas.style.height = Math.round(H * scale) + "px"; st.style.setProperty("--cw", Math.round(W * scale) + "px"); }
  function toCell(clientX, clientY) { const r = canvas.getBoundingClientRect(); const x = Math.floor((clientX - r.left) / scale / (W / GW)), y = Math.floor((clientY - r.top) / scale / (H / GH)); if (x < 0 || y < 0 || x >= GW || y >= GH) return -1; return y * GW + x; }
  function setPalette(c) { palette = c; if (owner) fullPaint(terrain, owner); }
  const hexRgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  function cellColor(i) {
    const o = owner[i];
    if (!terrain[i]) return "#1E3A6E";
    if (!o) return "#C9B98A";
    const [r, g, b] = hexRgb(palette[o - 1] || "#888");
    return `rgb(${Math.round(r * 0.75 + 40)},${Math.round(g * 0.75 + 40)},${Math.round(b * 0.75 + 40)})`;
  }
  function drawCell(i) {
    const x = (i % GW) * CS, y = ((i / GW) | 0) * CS;
    octx.fillStyle = cellColor(i); octx.fillRect(x, y, CS, CS);
    const o = owner[i];
    if (o && terrain[i]) {   // hranice území tmavší linkou
      octx.fillStyle = palette[o - 1] || "#888";
      const cx = i % GW, cy = (i / GW) | 0;
      if (cx === 0 || owner[i - 1] !== o) octx.fillRect(x, y, 1, CS);
      if (cx === GW - 1 || owner[i + 1] !== o) octx.fillRect(x + CS - 1, y, 1, CS);
      if (cy === 0 || owner[i - GW] !== o) octx.fillRect(x, y, CS, 1);
      if (cy === GH - 1 || owner[i + GW] !== o) octx.fillRect(x, y + CS - 1, CS, 1);
    } else if (terrain[i]) { octx.fillStyle = "rgba(0,0,0,.06)"; if (!((i % GW) & 1) && !(((i / GW) | 0) & 1)) octx.fillRect(x, y, CS, CS); }
  }
  function fullPaint(terr, own) { terrain = terr; owner = own; for (let i = 0; i < N; i++) drawCell(i); }
  function applyDeltas(deltas) { const seen = new Set(); for (const d of deltas) { const i = d >> 4; seen.add(i); const cx = i % GW, cy = (i / GW) | 0; if (cx > 0) seen.add(i - 1); if (cx < GW - 1) seen.add(i + 1); if (cy > 0) seen.add(i - GW); if (cy < GH - 1) seen.add(i + GW); } for (const i of seen) drawCell(i); }
  function applyTerrain(deltas) { const seen = new Set(); for (const d of deltas) { const i = d >> 1; seen.add(i); } for (const i of seen) drawCell(i); }

  function burst(x, y, c, n = 10) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, s = 40 + Math.random() * 120; particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, c, life: 0.5 }); } }
  function popup(x, y, text, c) { popups.push({ x, y, text, c, life: 1.2 }); }
  function kick() {}
  const ring = () => {};

  // view = { players:[{name,color,troops,cells,alive,me,cx,cy}], attacks:[{from,to,cell,troops,color}], hover, phase, countdown, brush, brushVal, showMe }
  function draw(view, dt) {
    t += dt;
    for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; } particles = particles.filter(p => p.life > 0);
    for (const p of popups) { p.y -= 20 * dt; p.life -= dt; } popups = popups.filter(p => p.life > 0);
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    ctx.fillStyle = "#14284D"; ctx.fillRect(0, 0, W, H);
    ctx.imageSmoothingEnabled = false; ctx.drawImage(off, 0, 0, W, H); ctx.imageSmoothingEnabled = true;
    const sx = W / GW, sy = H / GH;
    // útoky: pulzující kruh v místě cíle + čára od útočníka
    for (const a of view.attacks || []) {
      const p = (view.players || []).find(q => q.slot + 1 === a.from); if (!p || p.cx === undefined) continue;
      const tx = (a.cell % GW + 0.5) * sx, ty = (((a.cell / GW) | 0) + 0.5) * sy;
      ctx.strokeStyle = a.color; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.lineDashOffset = -t * 30; ctx.globalAlpha = 0.7;
      ctx.beginPath(); ctx.moveTo(p.cx * sx, p.cy * sy); ctx.lineTo(tx, ty); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
      ctx.fillStyle = a.color; ctx.beginPath(); ctx.arc(tx, ty, 6 + Math.sin(t * 8) * 2, 0, 6.28); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.font = "800 11px Nunito, sans-serif"; ctx.textAlign = "center"; ctx.fillText(Math.round(a.troops), tx, ty - 10);
    }
    // popisky hráčů
    for (const p of view.players || []) {
      if (!p.alive || p.cx === undefined) continue;
      const x = p.cx * sx, y = p.cy * sy;
      ctx.font = "900 13px Nunito, sans-serif"; ctx.textAlign = "center"; ctx.lineWidth = 4; ctx.strokeStyle = "rgba(0,0,0,.55)"; ctx.fillStyle = "#fff";
      ctx.strokeText(p.name, x, y - 4); ctx.fillText(p.name, x, y - 4);
      ctx.font = "800 12px Nunito, sans-serif"; ctx.fillStyle = p.color;
      ctx.strokeText(Math.round(p.troops), x, y + 11); ctx.fillText(Math.round(p.troops), x, y + 11);
      if (p.me && view.showMe) { const bob = Math.sin(t * 8) * 4; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(x, y - 22 + bob); ctx.lineTo(x - 8, y - 34 + bob); ctx.lineTo(x + 8, y - 34 + bob); ctx.fill(); ctx.font = "900 14px Nunito, sans-serif"; ctx.strokeText(p.meLabel || "YOU", x, y - 38 + bob); ctx.fillText(p.meLabel || "YOU", x, y - 38 + bob); }
    }
    // kurzor
    if (view.hover >= 0 && view.hover !== undefined) {
      const hx = (view.hover % GW) * sx, hy = ((view.hover / GW) | 0) * sy;
      if (view.phase === "draw") { const r = view.brush || 2; ctx.strokeStyle = view.brushVal ? "#C9B98A" : "#6FC3FF"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hx + sx / 2, hy + sy / 2, r * sx + sx / 2, 0, 6.28); ctx.stroke(); }
      else { ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.strokeRect(hx, hy, sx, sy); }
    }
    for (const p of particles) { ctx.globalAlpha = p.life * 2; ctx.fillStyle = p.c; ctx.fillRect(p.x - 2, p.y - 2, 4, 4); }
    ctx.globalAlpha = 1; ctx.font = "800 14px Nunito, sans-serif"; ctx.textAlign = "center";
    for (const p of popups) { ctx.globalAlpha = Math.min(1, p.life); ctx.lineWidth = 3; ctx.strokeStyle = "rgba(0,0,0,.6)"; ctx.fillStyle = p.c; ctx.strokeText(p.text, p.x, p.y); ctx.fillText(p.text, p.x, p.y); }
    ctx.globalAlpha = 1;
    if (view.phase === "countdown") { ctx.fillStyle = "rgba(10,6,20,.45)"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "#fff"; ctx.font = "800 96px Nunito, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(Math.max(1, Math.ceil(view.countdown)), W / 2, H / 2); ctx.textBaseline = "alphabetic"; }
  }
  function preview(cv, hat, color) { const c = cv.getContext("2d"); c.clearRect(0, 0, cv.width, cv.height); c.fillStyle = color; c.beginPath(); c.arc(cv.width / 2, cv.height / 2, cv.width * 0.3, 0, 6.28); c.fill(); }
  return { init, draw, fullPaint, applyDeltas, applyTerrain, setPalette, burst, popup, kick, ring, toCell, preview, HATS, PATTERNS, W, H, get scale() { return scale; } };
})();
