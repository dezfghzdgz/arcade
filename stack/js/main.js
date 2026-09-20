(() => {
  const { $, get, set, L, beep } = Arc;
  Arc.texts({ en: { hint: "Tap or space to drop the block. Line it up perfectly to grow it back.", gameOver: "Tower fell", perfect: "PERFECT" }, cs: { hint: "Ťukni nebo mezerník = pustit blok. Trefíš přesně a blok se zase zvětší.", gameOver: "Věž spadla", perfect: "PŘESNĚ" } });
  const cv = $("cv"), ctx = cv.getContext("2d"), W = cv.width, H = cv.height, BH = 26;
  let blocks, cur, score, best = get("st_best", 0), over, camY, dir, speed, combo, fall = [], popups = [], last = 0, hue;
  const col = (i) => `hsl(${(hue + i * 9) % 360}, 70%, ${55 + Math.sin(i * 0.5) * 6}%)`;
  const trail = () => (window.Meta && Meta.skin("trail")) || null;
  function reset() { blocks = [{ x: W / 2 - 100, w: 200 }]; score = 0; over = false; camY = 0; combo = 0; hue = Math.floor(Math.random() * 360); fall = []; spawn(); $("over").classList.add("hidden"); hud(); }
  function spawn() { const top = blocks[blocks.length - 1]; dir = blocks.length % 2 ? 1 : -1; speed = 150 + Math.min(260, blocks.length * 9); cur = { x: dir > 0 ? -top.w * 0.5 : W - top.w * 0.5, w: top.w, y: blocks.length }; }
  function hud() { $("score").textContent = score; $("best").textContent = best; }
  function drop() {
    if (over || !cur) return; const top = blocks[blocks.length - 1];
    const left = Math.max(cur.x, top.x), right = Math.min(cur.x + cur.w, top.x + top.w), overlap = right - left;
    if (overlap <= 4) { fall.push({ x: cur.x, w: cur.w, y: cur.y, vy: 0, rot: 0, vr: dir * 2 }); return gameOver(); }
    const off = Math.abs(cur.x - top.x);
    if (off < 7) { combo++; const tr = trail(); if (tr) for (let k = 0; k < 10; k++) popups.push({ text: tr.id === "trail_fire" ? "🔥" : "✦", y: cur.y, life: 0.7 + Math.random() * 0.4, dx: (Math.random() - 0.5) * 200 }); const grow = Math.min(top.w + 8, 200); const nx = top.x - (grow - top.w) / 2; blocks.push({ x: Math.max(0, Math.min(W - grow, nx)), w: grow }); popups.push({ text: L("perfect") + (combo > 1 ? " ×" + combo : ""), y: cur.y, life: 1 }); beep(700 + combo * 60, 0.15); score += 1 + combo; }
    else { combo = 0; if (cur.x < top.x) fall.push({ x: cur.x, w: left - cur.x, y: cur.y, vy: 0, rot: 0, vr: -2 }); else fall.push({ x: right, w: cur.x + cur.w - right, y: cur.y, vy: 0, rot: 0, vr: 2 }); blocks.push({ x: left, w: overlap }); beep(420, 0.06); score += 1; }
    if (score > best) { best = score; set("st_best", best); } hud(); spawn();
  }
  async function gameOver() { over = true; cur = null; if (window.Meta) Meta.finish("stack"); beep(180, 0.4, "sawtooth", 0.15); setTimeout(async () => { $("over").classList.remove("hidden"); $("over-title").textContent = L("gameOver"); $("over-score").textContent = score; $("over-rank").textContent = ""; const r = await Arc.submit("stack", score); if (r) $("over-rank").textContent = L("rank", r); }, 700); }
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (cur && !over) { cur.x += dir * speed * dt; if (cur.x > W + 20 && dir > 0) { dir = -1; } if (cur.x + cur.w < -20 && dir < 0) { dir = 1; } }
    const targetCam = Math.max(0, (blocks.length - 6) * BH); camY += (targetCam - camY) * Math.min(1, dt * 6);
    ctx.clearRect(0, 0, W, H); const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, `hsl(${(hue + 180) % 360}, 40%, 18%)`); g.addColorStop(1, "#1B1030"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const yOf = (i) => H - 40 - i * BH + camY;
    blocks.forEach((b, i) => { const y = yOf(i); ctx.fillStyle = col(i); ctx.fillRect(b.x, y - BH, b.w, BH); ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.fillRect(b.x, y - 5, b.w, 5); ctx.fillStyle = "rgba(255,255,255,.18)"; ctx.fillRect(b.x, y - BH, b.w, 3); });
    if (cur) { const y = yOf(cur.y); ctx.fillStyle = col(cur.y); ctx.fillRect(cur.x, y - BH, cur.w, BH); ctx.fillStyle = "rgba(255,255,255,.25)"; ctx.fillRect(cur.x, y - BH, cur.w, 3); }
    for (const f of fall) { f.vy += 900 * dt; f.yy = (f.yy || 0) + f.vy * dt; f.rot += f.vr * dt; const y = yOf(f.y) + f.yy; ctx.save(); ctx.translate(f.x + f.w / 2, y - BH / 2); ctx.rotate(f.rot); ctx.fillStyle = col(f.y); ctx.globalAlpha = Math.max(0, 1 - f.yy / 500); ctx.fillRect(-f.w / 2, -BH / 2, f.w, BH); ctx.restore(); } fall = fall.filter(f => f.yy < 600);
    ctx.font = "900 22px Nunito, sans-serif"; ctx.textAlign = "center"; for (const p of popups) { p.life -= dt; ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = "#FFCF5A"; ctx.fillText(p.text, W / 2 + (p.dx || 0) * (1 - p.life), yOf(p.y) - BH - 10 - (1 - p.life) * 30); } ctx.globalAlpha = 1; popups = popups.filter(p => p.life > 0);
    if (!over) { ctx.fillStyle = "rgba(255,255,255,.9)"; ctx.font = "900 48px Nunito, sans-serif"; ctx.fillText(score, W / 2, 70); }
    requestAnimationFrame(loop);
  }
  cv.addEventListener("pointerdown", (e) => { e.preventDefault(); if (over) return; drop(); });
  window.addEventListener("keydown", (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); if (over) reset(); else drop(); } });
  $("btn-again").onclick = reset; $("btn-lb").onclick = () => Arc.openLb("stack");
  Arc.wire(); Arc.applyLang(); reset(); requestAnimationFrame(loop);
})();
