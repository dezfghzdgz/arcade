(() => {
  const { $, get, set, L, beep } = Arc;
  Arc.texts({ en: { hint: "Tap left/right half or arrow keys to rotate. Three same colors touching clear.", gameOver: "Overflow!", combo: "COMBO" }, cs: { hint: "Ťukni na levou/pravou půlku nebo šipky = otočit. Tři stejné barvy u sebe zmizí.", gameOver: "Přeteklo!", combo: "KOMBO" } });
  const cv = $("cv"), ctx = cv.getContext("2d"), S = cv.width, C = S / 2, R0 = 70, H = 26, MAX = 7, SIDES = 6;
  const COLORS = ["#FF5E7E", "#5EE1D0", "#FFCF5A", "#8A5CFF", "#B6FF5A"];
  let lanes, falling, rot, rotT, score, best = get("hx_best", 0), over, speed, spawnT, particles = [], combo = 0, comboT = 0, last = 0, shake = 0, clearing = [];
  function reset() { lanes = Array.from({ length: SIDES }, () => []); falling = []; rot = 0; rotT = 0; score = 0; over = false; speed = 90; spawnT = 0.6; particles = []; combo = 0; clearing = []; $("over").classList.add("hidden"); hud(); }
  function hud() { $("score").textContent = score; $("best").textContent = best; }
  function rotate(d) { if (over) return; rot = (rot + d + SIDES) % SIDES; rotT += d; beep(360 + rot * 20, 0.04, "sine", 0.04); }
  const colorsInPlay = () => COLORS.slice(0, Math.min(COLORS.length, 3 + Math.floor(score / 400)));
  function spawn() { const n = 1 + (Math.random() < Math.min(0.4, score / 3000) ? 1 : 0); const used = new Set(); for (let k = 0; k < n; k++) { let lane; do { lane = Math.floor(Math.random() * SIDES); } while (used.has(lane)); used.add(lane); const cs = colorsInPlay(); falling.push({ lane, color: cs[Math.floor(Math.random() * cs.length)], dist: S / 2 + 20 }); } }
  // hex geometrie: lane i má "lokální" index; zobrazená strana = (lane + rot) % 6
  function landed(f) { const st = lanes[f.lane]; if (st.length >= MAX) { gameOver(); return; } st.push({ color: f.color, t: 0 }); beep(500 + st.length * 30, 0.05); resolve(); }
  function resolve() {
    // spojené skupiny stejné barvy: sousedé = stejná lane výška±1 a sousední lane stejná výška
    const seen = new Set(), groups = [];
    for (let l = 0; l < SIDES; l++) for (let h = 0; h < lanes[l].length; h++) { const k = l + ":" + h; if (seen.has(k)) continue; const col = lanes[l][h].color; const g = [], st = [[l, h]]; seen.add(k);
      while (st.length) { const [a, b] = st.pop(); g.push([a, b]); for (const [na, nb] of [[a, b + 1], [a, b - 1], [(a + 1) % SIDES, b], [(a + SIDES - 1) % SIDES, b]]) { const kk = na + ":" + nb; if (seen.has(kk) || nb < 0 || nb >= lanes[na].length || lanes[na][nb].color !== col) continue; seen.add(kk); st.push([na, nb]); } }
      if (g.length >= 3) groups.push(g); }
    if (!groups.length) { if (comboT <= 0) combo = 0; return; }
    combo++; comboT = 2; let n = 0;
    for (const g of groups) for (const [l, h] of g) { lanes[l][h].dead = true; n++; const p = pos(l, h); burst(p.x, p.y, lanes[l][h].color); }
    for (let l = 0; l < SIDES; l++) lanes[l] = lanes[l].filter(b => !b.dead);
    score += n * 10 * combo; if (score > best) { best = score; set("hx_best", best); } hud(); shake = 0.5; beep(700 + combo * 80, 0.15);
    if (combo > 1) particles.push({ text: L("combo") + " ×" + combo, x: C, y: C, life: 1.2 });
    setTimeout(resolve, 120);   // řetězení
  }
  function pos(l, h) { const a = ((l + rot) % SIDES) * Math.PI / 3 + Math.PI / 6 + (rotT - Math.round(rotT)) * 0; const r = R0 + H * (h + 0.5) + 8; return { x: C + Math.cos(a) * r, y: C + Math.sin(a) * r, a }; }
  function burst(x, y, c) { for (let i = 0; i < 10; i++) { const a = Math.random() * 6.28, s = 60 + Math.random() * 140; particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, c, life: 0.5 }); } }
  async function gameOver() { over = true; beep(180, 0.4, "sawtooth", 0.15); shake = 1; if (window.Meta) Meta.finish("hexa"); setTimeout(async () => { $("over").classList.remove("hidden"); $("over-title").textContent = L("gameOver"); $("over-score").textContent = score; $("over-rank").textContent = ""; const r = await Arc.submit("hexa", score); if (r) $("over-rank").textContent = L("rank", r); }, 600); }
  let smoothRot = 0;
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!over) { spawnT -= dt; if (spawnT <= 0) { spawn(); spawnT = Math.max(0.55, 1.6 - score / 1500); } speed = 90 + Math.min(160, score / 12); comboT -= dt;
      for (let i = falling.length - 1; i >= 0; i--) { const f = falling[i]; f.dist -= speed * dt; const top = R0 + H * lanes[f.lane].length + 8 + H / 2; if (f.dist <= top) { falling.splice(i, 1); landed(f); } } }
    // vizuální rotace se dohání
    const target = rot; let d = target - smoothRot; while (d > 3) d -= 6; while (d < -3) d += 6; smoothRot += d * Math.min(1, dt * 14); if (Math.abs(d) < 0.001) smoothRot = target;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, S, S);
    if (shake > 0) { ctx.translate((Math.random() - 0.5) * shake * 6, (Math.random() - 0.5) * shake * 6); shake = Math.max(0, shake - dt * 3); }
    const g = ctx.createRadialGradient(C, C, 40, C, C, S / 2); g.addColorStop(0, "#2A1B4A"); g.addColorStop(1, "#1B1030"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(C, C, S / 2, 0, 6.28); ctx.fill();
    // varovný kruh (limit)
    ctx.strokeStyle = "rgba(255,94,126,.25)"; ctx.lineWidth = 2; ctx.setLineDash([6, 8]); ctx.beginPath(); ctx.arc(C, C, R0 + H * MAX + 8, 0, 6.28); ctx.stroke(); ctx.setLineDash([]);
    const angOf = (l) => ((l + smoothRot) % SIDES) * Math.PI / 3 + Math.PI / 6;
    // segment: trapéz na straně l ve výšce h (r1..r2)
    const seg = (l, r1, r2, fill) => { const a0 = angOf(l) - Math.PI / 6 + 0.03, a1 = angOf(l) + Math.PI / 6 - 0.03; ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(C, C, r2, a0, a1); ctx.arc(C, C, r1, a1, a0, true); ctx.closePath(); ctx.fill(); };
    // středový hexagon
    ctx.fillStyle = "#3A2A5A"; ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = angOf(i) - Math.PI / 6; const x = C + Math.cos(a) * R0, y = C + Math.sin(a) * R0; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); ctx.fill(); ctx.strokeStyle = "rgba(255,255,255,.25)"; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.9)"; ctx.font = "900 26px Nunito, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(score, C, C); ctx.textBaseline = "alphabetic";
    for (let l = 0; l < SIDES; l++) lanes[l].forEach((b, h) => { b.t = Math.min(1, (b.t || 0) + dt * 6); const r1 = R0 + 8 + H * h, r2 = r1 + H - 3; seg(l, r1, r2, b.color); if (b.t < 1) seg(l, r1, r2, `rgba(255,255,255,${(1 - b.t) * 0.5})`); });
    for (const f of falling) { const a = angOf(f.lane); const r1 = f.dist - H / 2, r2 = f.dist + H / 2; seg(f.lane, r1, r2, f.color); ctx.globalAlpha = 0.25; seg(f.lane, r2, r2 + 20, f.color); ctx.globalAlpha = 1; }
    for (const p of particles) { p.life -= dt; if (p.text) { ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = "#FFCF5A"; ctx.font = "900 28px Nunito, sans-serif"; ctx.textAlign = "center"; ctx.fillText(p.text, p.x, p.y - 60 - (1.2 - p.life) * 30); } else { p.x += p.vx * dt; p.y += p.vy * dt; ctx.globalAlpha = Math.max(0, p.life * 2); ctx.fillStyle = p.c; ctx.fillRect(p.x - 2, p.y - 2, 4, 4); } } ctx.globalAlpha = 1; particles = particles.filter(p => p.life > 0);
    requestAnimationFrame(loop);
  }
  cv.addEventListener("pointerdown", (e) => { e.preventDefault(); if (over) return; const r = cv.getBoundingClientRect(); rotate(e.clientX - r.left < r.width / 2 ? -1 : 1); });
  window.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft" || e.key === "a") rotate(-1); if (e.key === "ArrowRight" || e.key === "d") rotate(1); if ((e.key === " " || e.key === "Enter") && over) reset(); });
  $("btn-again").onclick = reset; $("btn-lb").onclick = () => Arc.openLb("hexa");
  Arc.wire(); Arc.applyLang(); reset(); requestAnimationFrame(loop);
})();
