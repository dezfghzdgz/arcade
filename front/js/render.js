// Kreslení mapy Front. Offscreen plátno 4 px na pole, hlavní plátno 896x576 (landscape, PC).
window.Render = (() => {
  const { GW, GH, N, COLORS } = Sim;
  const CS = 2, OW = GW * CS, OH = GH * CS, W = 960, H = 600;
  let canvas, ctx, scale = 1, dpr = 1;
  const off = document.createElement("canvas"); off.width = OW; off.height = OH; const octx = off.getContext("2d");
  let terrain = null, owner = null, palette = COLORS;
  let t = 0, particles = [], popups = [], rings = [];
  const HATS = { none: { price: 0 }, cap: { price: 150 }, crown: { price: 1000 } }, PATTERNS = { none: { price: 0 } };

  function init(cv) { canvas = cv; ctx = cv.getContext("2d"); resize(); window.addEventListener("resize", resize); }
  function resize() { const st = canvas.parentElement, sw = st.clientWidth, sh = st.clientHeight; scale = Math.min(sw / W, sh / H); dpr = Math.min(window.devicePixelRatio || 1, 2); canvas.width = Math.round(W * scale * dpr); canvas.height = Math.round(H * scale * dpr); canvas.style.width = Math.round(W * scale) + "px"; canvas.style.height = Math.round(H * scale) + "px"; st.style.setProperty("--cw", Math.round(W * scale) + "px"); }
  const cam = { z: 1, ox: 0, oy: 0 };   // zoom a posun v základních souřadnicích plátna (W×H)
  function toWorld(clientX, clientY) { const r = canvas.getBoundingClientRect(); return { x: (clientX - r.left) / scale / cam.z + cam.ox, y: (clientY - r.top) / scale / cam.z + cam.oy }; }
  function toCell(clientX, clientY) { const p = toWorld(clientX, clientY); const x = Math.floor(p.x / (W / GW)), y = Math.floor(p.y / (H / GH)); if (x < 0 || y < 0 || x >= GW || y >= GH) return -1; return y * GW + x; }
  function clampCam() { cam.z = Math.max(1, Math.min(6, cam.z)); cam.ox = Math.max(0, Math.min(W - W / cam.z, cam.ox)); cam.oy = Math.max(0, Math.min(H - H / cam.z, cam.oy)); }
  function zoomAt(clientX, clientY, factor) { const before = toWorld(clientX, clientY); cam.z *= factor; clampCam(); const after = toWorld(clientX, clientY); cam.ox += before.x - after.x; cam.oy += before.y - after.y; clampCam(); }
  function pan(dxPx, dyPx) { cam.ox -= dxPx / scale / cam.z; cam.oy -= dyPx / scale / cam.z; clampCam(); }
  function centerOn(gx, gy) { cam.ox = gx * (W / GW) - W / cam.z / 2; cam.oy = gy * (H / GH) - H / cam.z / 2; clampCam(); }
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
      if (cx === 0 || owner[i - 1] !== o || cx === GW - 1 || owner[i + 1] !== o || cy === 0 || owner[i - GW] !== o || cy === GH - 1 || owner[i + GW] !== o) octx.fillRect(x, y, CS, CS);
    } else if (terrain[i]) { octx.fillStyle = "rgba(0,0,0,.06)"; if (!((i % GW) & 1) && !(((i / GW) | 0) & 1)) octx.fillRect(x, y, CS, CS); }
  }
  function fullPaint(terr, own) { terrain = terr; owner = own; for (let i = 0; i < N; i++) drawCell(i); }
  function applyDeltas(deltas) { const seen = new Set(); for (const d of deltas) { const i = d >> 4; seen.add(i); const cx = i % GW, cy = (i / GW) | 0; if (cx > 0) seen.add(i - 1); if (cx < GW - 1) seen.add(i + 1); if (cy > 0) seen.add(i - GW); if (cy < GH - 1) seen.add(i + GW); } for (const i of seen) drawCell(i); }
  function applyTerrain(deltas) { const seen = new Set(); for (const d of deltas) { const i = d >> 1; seen.add(i); } for (const i of seen) drawCell(i); }

  function burst(x, y, c, n = 10) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, s = 40 + Math.random() * 120; particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, c, life: 0.5 }); } }
  function popup(x, y, text, c) { popups.push({ x, y, text, c, life: 1.2 }); }
  function kick() {}
  function ring(x, y, c, max) { rings.push({ x, y, r: 4, max, life: 1, c }); }

  // view = { players:[{name,color,troops,cells,alive,me,cx,cy}], attacks:[{from,to,cell,troops,color}], hover, phase, countdown, brush, brushVal, showMe }
  function draw(view, dt) {
    t += dt;
    for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; } particles = particles.filter(p => p.life > 0);
    for (const p of popups) { p.y -= 20 * dt; p.life -= dt; } popups = popups.filter(p => p.life > 0);
    for (const r of rings) { r.life -= dt * 0.8; r.r += (r.max - r.r) * dt * 5; } rings = rings.filter(r => r.life > 0);
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    ctx.fillStyle = "#14284D"; ctx.fillRect(0, 0, W, H);
    ctx.setTransform(dpr * scale * cam.z, 0, 0, dpr * scale * cam.z, -cam.ox * dpr * scale * cam.z, -cam.oy * dpr * scale * cam.z);
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
    // trasy: továrna -> město/přístav (koleje), obchodní lodě -> cíl
    const B = view.buildings || [];
    ctx.lineWidth = 1.5 / (view.zoom || 1);
    for (const f of B) { if (f.type !== "factory") continue; for (const b of B) { if (b.owner !== f.owner || (b.type !== "city" && b.type !== "port")) continue; const x1 = (Sim.cx(f.cell) + 0.5) * sx, y1 = (Sim.cy(f.cell) + 0.5) * sy, x2 = (Sim.cx(b.cell) + 0.5) * sx, y2 = (Sim.cy(b.cell) + 0.5) * sy; const d = Math.hypot(x2 - x1, y2 - y1); if (d / sx > 140) continue;
      ctx.strokeStyle = "#2B2440"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      const nx = -(y2 - y1) / d, ny = (x2 - x1) / d; ctx.lineWidth = 1; for (let k = 6; k < d; k += 7) { const px = x1 + (x2 - x1) * k / d, py = y1 + (y2 - y1) * k / d; ctx.beginPath(); ctx.moveTo(px - nx * 2.2, py - ny * 2.2); ctx.lineTo(px + nx * 2.2, py + ny * 2.2); ctx.stroke(); } } }
    ctx.setLineDash([]); ctx.lineWidth = 1;
    // stavby
    for (const b of view.buildings || []) {
      const x = ((b.x ?? Sim.cx(b.cell)) + 0.5) * sx, y = ((b.y ?? Sim.cy(b.cell)) + 0.5) * sy, c = b.color || "#fff";
      ctx.save(); ctx.translate(x, y); ctx.lineWidth = 1.5; ctx.strokeStyle = "#0B1020"; ctx.fillStyle = c;
      if (b.selected) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 13, 0, 6.28); ctx.stroke(); ctx.strokeStyle = "#0B1020"; ctx.lineWidth = 1.5; }
      switch (b.type) {
        case "city": ctx.beginPath(); ctx.moveTo(-6, 6); ctx.lineTo(-6, -2); ctx.lineTo(0, -8); ctx.lineTo(6, -2); ctx.lineTo(6, 6); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#0B1020"; ctx.fillRect(-1.5, 0, 3, 6); break;
        case "defense": ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(7, 0); ctx.lineTo(0, 8); ctx.lineTo(-7, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.strokeStyle = c; ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.arc(0, 0, 7 * sx, 0, 6.28); ctx.stroke(); ctx.globalAlpha = 1; break;
        case "port": ctx.strokeStyle = "#0B1020"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, -4, 2.5, 0, 6.28); ctx.moveTo(0, -1.5); ctx.lineTo(0, 7); ctx.moveTo(-6, 3); ctx.quadraticCurveTo(0, 10, 6, 3); ctx.stroke(); ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.stroke(); break;
        case "silo": ctx.beginPath(); ctx.arc(0, 0, 7, 0, 6.28); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#0B1020"; ctx.beginPath(); ctx.arc(0, 0, 3, 0, 6.28); ctx.fill(); ctx.fillStyle = "#FF5E7E"; ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(2, 1); ctx.lineTo(-2, 1); ctx.fill(); break;
        case "sam": ctx.beginPath(); ctx.moveTo(-6, 7); ctx.lineTo(6, 7); ctx.lineTo(0, -8); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.strokeStyle = c; ctx.globalAlpha = 0.2; ctx.beginPath(); ctx.arc(0, 0, 12 * sx, 0, 6.28); ctx.stroke(); ctx.globalAlpha = 1; break;
        case "factory": ctx.fillRect(-7, -2, 14, 9); ctx.strokeRect(-7, -2, 14, 9); ctx.fillRect(-5, -8, 3, 6); ctx.strokeRect(-5, -8, 3, 6); break;
        case "warship": ctx.rotate(Math.sin(t * 2) * 0.05); ctx.beginPath(); ctx.moveTo(-10, 2); ctx.lineTo(10, 2); ctx.lineTo(7, 6); ctx.lineTo(-7, 6); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillRect(-3, -5, 6, 7); ctx.strokeRect(-3, -5, 6, 7); ctx.fillRect(-1, -9, 2, 4); break;
      }
      if ((b.lvl || 1) > 1) { ctx.fillStyle = "#fff"; ctx.strokeStyle = "#0B1020"; ctx.lineWidth = 2; ctx.font = "900 9px Nunito, sans-serif"; ctx.textAlign = "center"; ctx.strokeText(b.lvl, 8, -6); ctx.fillText(b.lvl, 8, -6); }
      ctx.restore();
    }
    // lodě (výsadek)
    for (const b of view.boats || []) {
      const x = (b.x + 0.5) * sx, y = (b.y + 0.5) * sy, ang = Math.atan2(b.ty - b.y, b.tx - b.x);
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.fillStyle = b.color; ctx.strokeStyle = "#0B1020"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-6, -4); ctx.lineTo(-6, 4); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      ctx.fillStyle = "#fff"; ctx.font = "800 10px Nunito, sans-serif"; ctx.textAlign = "center"; ctx.fillText(b.troops, x, y - 8);
      ctx.setLineDash([3, 4]); ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo((b.tx + 0.5) * sx, (b.ty + 0.5) * sy); ctx.stroke(); ctx.setLineDash([]);
    }
    // obchodní lodě
    for (const b of view.ships || []) {
      const x = (b.x + 0.5) * sx, y = (b.y + 0.5) * sy, ang = Math.atan2(b.ty - b.y, b.tx - b.x);
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.fillStyle = "#F4F0E8"; ctx.strokeStyle = b.color; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-5, -3); ctx.lineTo(-5, 3); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      ctx.fillStyle = "#FFCF5A"; ctx.font = "800 8px Nunito, sans-serif"; ctx.textAlign = "center"; ctx.fillText("$", x, y - 6);
    }
    // vlaky
    for (const tr of view.trains || []) { const x = (tr.x + 0.5) * sx, y = (tr.y + 0.5) * sy; ctx.fillStyle = "#2B2440"; ctx.fillRect(x - 5, y - 2.5, 10, 5); ctx.fillStyle = tr.color; ctx.fillRect(x - 3.5, y - 1.5, 7, 3); }
    // jaderné zbraně v letu
    for (const n of view.nukes || []) {
      const k = 1 - n.t / 3, fx = (Sim.cx(n.fromCell) + 0.5) * sx, fy = (Sim.cy(n.fromCell) + 0.5) * sy, tx = (Sim.cx(n.cell) + 0.5) * sx, ty = (Sim.cy(n.cell) + 0.5) * sy;
      const x = fx + (tx - fx) * k, y = fy + (ty - fy) * k - Math.sin(k * Math.PI) * 120;
      ctx.strokeStyle = "rgba(255,94,126,.5)"; ctx.setLineDash([4, 6]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.quadraticCurveTo((fx + tx) / 2, Math.min(fy, ty) - 160, tx, ty); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = "#FF5E7E"; ctx.beginPath(); ctx.arc(x, y, 5, 0, 6.28); ctx.fill();
      ctx.strokeStyle = "#FF5E7E"; ctx.lineWidth = 2; ctx.globalAlpha = 0.5 + Math.sin(t * 12) * 0.4; ctx.beginPath(); ctx.arc(tx, ty, n.radius * sx, 0, 6.28); ctx.stroke(); ctx.globalAlpha = 1;
      ctx.fillStyle = "#fff"; ctx.font = "800 11px Nunito, sans-serif"; ctx.textAlign = "center"; ctx.fillText(n.t.toFixed(1), tx, ty - n.radius * sx - 4);
    }
    // výbuchy
    for (const r of rings) { ctx.globalAlpha = Math.max(0, r.life); ctx.strokeStyle = r.c; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, 6.28); ctx.stroke(); ctx.fillStyle = r.c; ctx.globalAlpha *= 0.25; ctx.fill(); }
    ctx.globalAlpha = 1;
    // popisky hráčů
    const z = view.zoom || 1;
    for (const p of view.players || []) {
      if (!p.alive || p.cx === undefined) continue;
      if (z < 1.8 && p.cells < 80 && !p.me) continue;
      const x = p.cx * sx, y = p.cy * sy, fs = Math.max(9, 13 / Math.sqrt(z));
      ctx.font = `900 ${fs}px Nunito, sans-serif`; ctx.textAlign = "center"; ctx.lineWidth = 4; ctx.strokeStyle = "rgba(0,0,0,.55)"; ctx.fillStyle = "#fff";
      ctx.strokeText(p.name, x, y - 4); ctx.fillText(p.name, x, y - 4);
      ctx.font = `800 ${fs - 1}px Nunito, sans-serif`; ctx.fillStyle = p.color;
      const tl = p.troops >= 1000 ? (p.troops / 1000).toFixed(1) + "K" : Math.round(p.troops);
      ctx.strokeText(tl, x, y + fs - 2); ctx.fillText(tl, x, y + fs - 2);
      if (view.alliances && view.me && p.slot + 1 !== view.me && view.alliances.has(Sim.akey(view.me, p.slot + 1))) { ctx.fillStyle = "#5EE1D0"; ctx.fillText("🤝", x + fs * 2.4, y - 4); }
      if (p.traitor) { ctx.fillStyle = "#FF5E7E"; ctx.fillText("☠", x - fs * 2.4, y - 4); }
      if (p.me && view.showMe) { const bob = Math.sin(t * 8) * 4; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(x, y - 22 + bob); ctx.lineTo(x - 8, y - 34 + bob); ctx.lineTo(x + 8, y - 34 + bob); ctx.fill(); ctx.font = "900 14px Nunito, sans-serif"; ctx.strokeText(p.meLabel || "YOU", x, y - 38 + bob); ctx.fillText(p.meLabel || "YOU", x, y - 38 + bob); }
    }
    // kurzor
    if (view.hover >= 0 && view.hover !== undefined) {
      const hx = (view.hover % GW) * sx, hy = ((view.hover / GW) | 0) * sy;
      if (view.phase === "draw") { const r = view.brush || 2; ctx.strokeStyle = view.brushVal ? "#C9B98A" : "#6FC3FF"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hx + sx / 2, hy + sy / 2, r * sx + sx / 2, 0, 6.28); ctx.stroke(); }
      else if (view.tool && view.toolRadius) { ctx.strokeStyle = view.toolNuke ? "#FF5E7E" : "#5EE1D0"; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.arc(hx + sx / 2, hy + sy / 2, view.toolRadius * sx, 0, 6.28); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = view.toolNuke ? "rgba(255,94,126,.12)" : "rgba(94,225,208,.10)"; ctx.fill(); }
      else { ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.strokeRect(hx, hy, sx, sy); }
    }
    for (const p of particles) { ctx.globalAlpha = p.life * 2; ctx.fillStyle = p.c; ctx.fillRect(p.x - 2, p.y - 2, 4, 4); }
    ctx.globalAlpha = 1; ctx.font = "800 14px Nunito, sans-serif"; ctx.textAlign = "center";
    for (const p of popups) { ctx.globalAlpha = Math.min(1, p.life); ctx.lineWidth = 3; ctx.strokeStyle = "rgba(0,0,0,.6)"; ctx.fillStyle = p.c; ctx.strokeText(p.text, p.x, p.y); ctx.fillText(p.text, p.x, p.y); }
    ctx.globalAlpha = 1;
    if (view.phase === "countdown") { ctx.fillStyle = "rgba(10,6,20,.45)"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "#fff"; ctx.font = "800 96px Nunito, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(Math.max(1, Math.ceil(view.countdown)), W / 2, H / 2); ctx.textBaseline = "alphabetic"; }
  }
  function preview(cv, hat, color) { const c = cv.getContext("2d"); c.clearRect(0, 0, cv.width, cv.height); c.fillStyle = color; c.beginPath(); c.arc(cv.width / 2, cv.height / 2, cv.width * 0.3, 0, 6.28); c.fill(); }
  return { init, draw, fullPaint, applyDeltas, applyTerrain, setPalette, burst, popup, kick, ring, toCell, toWorld, zoomAt, pan, centerOn, cam, preview, HATS, PATTERNS, W, H, GW, GH, get scale() { return scale; } };
})();
