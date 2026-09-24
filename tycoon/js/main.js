(() => {
  const { $, get, set, L, beep } = Arc;
  Arc.texts({
    en: { managers: "Managers", upgrades: "Upgrades", investors: "Investors", welcomeBack: "Welcome back!", collect: "Collect", collect2: "Collect ×2 (ad)", away: (t) => `Your managers kept working for ${t}`, perSec: (v) => `${v} / sec`, starsLine: (n, b) => `⭐ ${n} investors · +${b}% profit`,
      buy: (n, c) => `Buy ×${n} · ${c}`, max: "MAX", next: (n) => `next ⚡ at ${n}`, allMs: "all milestones", hire: "Hire", hired: "Hired", runsAlone: "Runs it on its own – even offline", profitX: (m) => `profit ×${m}`, allBiz: "All machines", buyU: "Buy", bought: "Done",
      preT: "Investors", preHelp: "Investors join when your lifetime earnings grow. Each gives +2% profit forever. Claiming them restarts your arcade (you keep investors).", preNow: (n) => `You have ⭐ ${n}`, preGain: (n) => `Restart now to gain ⭐ ${n}`, preBtn: "Restart & claim", preNone: "Earn more to attract investors", lifetime: (v) => `Lifetime earnings: ${v}`, adTitle: "Watching ad…", adNote: "(Simulated on web; real rewarded ad in the app.)", msReached: (n, x) => `${n} reached ${x} – 2× faster!`,
      b: ["Gumball machine", "Claw machine", "Pinball", "Air hockey", "Racing sim", "VR booth", "Esports arena", "Arcade tower"] },
    cs: { managers: "Manažeři", upgrades: "Vylepšení", investors: "Investoři", welcomeBack: "Vítej zpátky!", collect: "Vybrat", collect2: "Vybrat ×2 (reklama)", away: (t) => `Tví manažeři pracovali ${t}`, perSec: (v) => `${v} / s`, starsLine: (n, b) => `⭐ ${n} investorů · +${b} % zisk`,
      buy: (n, c) => `Koupit ×${n} · ${c}`, max: "MAX", next: (n) => `další ⚡ při ${n}`, allMs: "všechny milníky", hire: "Najmout", hired: "Najat", runsAlone: "Jede sám – i když jsi offline", profitX: (m) => `zisk ×${m}`, allBiz: "Všechny automaty", buyU: "Koupit", bought: "Hotovo",
      preT: "Investoři", preHelp: "Investoři přicházejí s tím, jak roste celkový výdělek. Každý dává navždy +2 % zisku. Když je vybereš, herna začne znovu (investoři zůstanou).", preNow: (n) => `Máš ⭐ ${n}`, preGain: (n) => `Restartuj teď a získáš ⭐ ${n}`, preBtn: "Restart a vybrat", preNone: "Vydělej víc a přilákáš investory", lifetime: (v) => `Celkem vyděláno: ${v}`, adTitle: "Běží reklama…", adNote: "(Na webu simulace, v appce skutečná odměněná reklama.)", msReached: (n, x) => `${n}: ${x} kusů – 2× rychleji!`,
      b: ["Žvýkačkový automat", "Automat s drápem", "Pinball", "Air hockey", "Závodní simulátor", "VR kabina", "Esport aréna", "Herní mrakodrap"] },
  });
  const B = [
    { e: "🍬", c0: 4, k: 1.07, p0: 1, t0: 0.6, mgr: 1e3 }, { e: "🧸", c0: 60, k: 1.15, p0: 60, t0: 3, mgr: 1.5e4 }, { e: "🕹️", c0: 720, k: 1.14, p0: 540, t0: 6, mgr: 1e5 }, { e: "🏒", c0: 8640, k: 1.13, p0: 4320, t0: 12, mgr: 5e5 },
    { e: "🏎️", c0: 103680, k: 1.12, p0: 51840, t0: 24, mgr: 1.2e6 }, { e: "🥽", c0: 1.24416e6, k: 1.11, p0: 622080, t0: 96, mgr: 1e7 }, { e: "🏟️", c0: 1.492992e7, k: 1.1, p0: 7.46496e6, t0: 384, mgr: 1.11e8 }, { e: "🗼", c0: 1.7915904e8, k: 1.09, p0: 8.957952e7, t0: 1536, mgr: 5.55e8 },
  ];
  const MS = [25, 50, 100, 200, 300, 400, 500];
  const UPG = []; B.forEach((b, i) => { for (let u = 0; u < 5; u++) UPG.push({ id: `u${i}_${u}`, b: i, mult: 3, cost: Math.max(2.5e5, b.c0 * 5e4) * Math.pow(40, u) }); }); for (let u = 0; u < 6; u++) UPG.push({ id: `all_${u}`, b: -1, mult: 3, cost: 1e10 * Math.pow(1e3, u) }); UPG.sort((a, c) => a.cost - c.cost);
  const SUF = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc", "UDc", "DDc", "TDc"];
  const fmt = (v) => { if (v < 1000) return "$" + (v < 10 ? v.toFixed(2).replace(/\.00$/, "") : Math.floor(v)); const e = Math.min(SUF.length - 1, Math.floor(Math.log10(v) / 3)); const x = v / Math.pow(1000, e); return "$" + x.toFixed(x >= 100 ? 0 : x >= 10 ? 1 : 2) + " " + SUF[e]; };
  const fmtT = (s) => s >= 3600 ? `${Math.floor(s / 3600)} h ${Math.floor(s % 3600 / 60)} min` : s >= 60 ? `${Math.floor(s / 60)} min` : `${Math.floor(s)} s`;
  const fresh = () => ({ cash: 0, lifetime: 0, owned: [1, 0, 0, 0, 0, 0, 0, 0], mgr: B.map(() => false), upg: [], prog: B.map(() => 0), run: B.map(() => false), stars: 0, savedAt: Date.now(), msSeen: {} });
  let S = Object.assign(fresh(), get("ty_save", {})), mode = get("ty_mode", "1"), last = 0, els = [], saveT = 0;
  const starBonus = () => 1 + S.stars * 0.02;
  const msLevel = (n) => MS.filter(m => n >= m).length;
  const cycleT = (i) => B[i].t0 / Math.pow(2, msLevel(S.owned[i]));
  const upgMult = (i) => S.upg.reduce((m, id) => { const u = UPG.find(x => x.id === id); return u && (u.b === i || u.b === -1) ? m * u.mult : m; }, 1);
  const payout = (i) => B[i].p0 * S.owned[i] * upgMult(i) * starBonus();
  const rate = (i) => S.owned[i] ? payout(i) / cycleT(i) : 0;
  const costN = (i, n) => { const b = B[i]; return b.c0 * Math.pow(b.k, S.owned[i]) * (Math.pow(b.k, n) - 1) / (b.k - 1); };
  const maxN = (i) => { const b = B[i]; const c = b.c0 * Math.pow(b.k, S.owned[i]); return Math.max(0, Math.floor(Math.log(S.cash * (b.k - 1) / c + 1) / Math.log(b.k))); };
  const starsTotal = () => Math.floor(10 * Math.sqrt(S.lifetime / 1e9));


  function earn(v) { S.cash += v; S.lifetime += v; }
  function tapBiz(i, ev) { if (!S.owned[i] || S.mgr[i] || S.run[i]) return; S.run[i] = true; S.prog[i] = 0; beep(520 + i * 40, 0.04, "sine", 0.05); }
  function buy(i) {
    const n = mode === "max" ? maxN(i) : +mode; if (n < 1) return; const c = costN(i, n); if (c > S.cash) return;
    const before = msLevel(S.owned[i]); S.cash -= c; S.owned[i] += n; beep(700, 0.06); const after = msLevel(S.owned[i]);
    if (after > before) { toastFloat(L("msReached", L("b")[i], MS[after - 1])); beep(990, 0.18); const key = i + ":" + MS[after - 1]; if (!S.msSeen[key]) { S.msSeen[key] = 1; if (window.Meta) Meta.score("tycoon", 8 + i * 2); } }
    build();
  }
  function hire(i) { if (S.mgr[i] || S.cash < B[i].mgr || !S.owned[i]) return; S.cash -= B[i].mgr; S.mgr[i] = true; S.run[i] = true; beep(880, 0.12); build(); openSheet("mgr"); }
  function buyUpg(id) { const u = UPG.find(x => x.id === id); if (!u || S.upg.includes(id) || S.cash < u.cost) return; S.cash -= u.cost; S.upg.push(id); beep(990, 0.12); build(); openSheet("upg"); }
  function prestige() { const g = starsTotal() - S.stars; if (g < 1) return; const keep = { stars: S.stars + g, lifetime: S.lifetime }; S = Object.assign(fresh(), keep); save(); build(); closeSheet(); beep(1320, 0.3); if (window.Meta) Meta.score("tycoon", Math.min(40, 10 + g)); Arc.submit("tycoon", Math.floor(Math.log10(S.lifetime + 1) * 1000), Math.min(40, 10 + g)); }

  // ---------- smyčka
  function tick(dt) {
    for (let i = 0; i < B.length; i++) {
      if (!S.owned[i]) continue; if (S.mgr[i]) S.run[i] = true; if (!S.run[i]) continue;
      const T = cycleT(i); S.prog[i] += dt / T;
      if (S.prog[i] >= 1) { const cycles = S.mgr[i] ? Math.floor(S.prog[i]) : 1; earn(payout(i) * cycles); S.prog[i] = S.mgr[i] ? S.prog[i] - cycles : 0; if (!S.mgr[i]) S.run[i] = false; if (T > 0.4) floatAt(i, payout(i) * cycles); }
    }
  }
  function floatAt(i, v) { const el = els[i]; if (!el) return; const r = el.ico.getBoundingClientRect(), st = $("stage").getBoundingClientRect(); const f = document.createElement("div"); f.className = "float"; f.textContent = "+" + fmt(v); f.style.left = (r.left - st.left + 8) + "px"; f.style.top = (r.top - st.top) + "px"; $("stage").appendChild(f); setTimeout(() => f.remove(), 900); }
  function toastFloat(t) { const f = document.createElement("div"); f.className = "float"; f.textContent = t; f.style.left = "50%"; f.style.transform = "translateX(-50%)"; f.style.top = "130px"; f.style.fontSize = "16px"; f.style.animationDuration = "2.2s"; $("stage").appendChild(f); setTimeout(() => f.remove(), 2200); }

  // ---------- vykreslení (seznam se staví jen při změně, každý snímek se mění jen čísla a lišty)
  function build() {
    const list = $("list"); list.innerHTML = ""; els = [];
    B.forEach((b, i) => {
      const unlocked = S.owned[i] > 0 || i === 0 || S.owned[i - 1] > 0; if (!unlocked) return;
      const d = document.createElement("div"); d.className = "biz" + (S.owned[i] ? "" : " locked");
      d.innerHTML = `<div class="ico">${b.e}<span class="n"></span></div><div class="bmain"><div class="btop"><b></b><span class="pay"></span></div><div class="bar"><i></i><em></em></div><div class="brow"><button class="buy"></button><span class="ms"></span></div></div>`;
      d.querySelector("b").textContent = L("b")[i];
      const ico = d.querySelector(".ico"); ico.onclick = (e) => tapBiz(i, e); d.querySelector(".buy").onclick = () => buy(i);
      list.appendChild(d); els[i] = { d, ico, n: d.querySelector(".n"), pay: d.querySelector(".pay"), bar: d.querySelector(".bar"), fill: d.querySelector(".bar i"), time: d.querySelector(".bar em"), buy: d.querySelector(".buy"), ms: d.querySelector(".ms") };
    });
    update(true);
  }
  function update() {
    $("cash").innerHTML = fmt(S.cash); const tot = B.reduce((a, _, i) => a + (S.mgr[i] ? rate(i) : 0), 0); $("rate").textContent = tot ? L("perSec", fmt(tot)) : "";
    $("stars-line").textContent = S.stars ? L("starsLine", S.stars, S.stars * 2) : "";
    els.forEach((e, i) => { if (!e) return; const T = cycleT(i), fast = T < 0.12 && (S.mgr[i] || S.run[i]);
      e.n.textContent = S.owned[i]; e.pay.textContent = S.owned[i] ? fmt(payout(i)) : ""; e.bar.classList.toggle("fast", fast); e.fill.style.width = (Math.min(1, S.prog[i]) * 100) + "%";
      const left = S.run[i] || S.mgr[i] ? (1 - S.prog[i]) * T : T; e.time.textContent = S.owned[i] ? (T < 1 ? T.toFixed(2) + "s" : fmtT(left)) : "";
      e.ico.classList.toggle("idle", S.owned[i] > 0 && !S.mgr[i] && !S.run[i]);
      const n = mode === "max" ? Math.max(1, maxN(i)) : +mode, c = costN(i, n); e.buy.textContent = L("buy", n, fmt(c)); e.buy.disabled = c > S.cash || (mode === "max" && maxN(i) < 1);
      const nm = MS.find(m => m > S.owned[i]); e.ms.textContent = nm ? L("next", nm) : L("allMs"); });
    // počty dostupných věcí na záložkách
    const mg = B.filter((b, i) => S.owned[i] && !S.mgr[i] && S.cash >= b.mgr).length, up = UPG.filter(u => !S.upg.includes(u.id) && S.cash >= u.cost).length;
    $("b-mgr").textContent = mg; $("b-mgr").classList.toggle("hidden", !mg); $("b-upg").textContent = up; $("b-upg").classList.toggle("hidden", !up);
    if (!$("sheet").classList.contains("hidden") && sheetKind !== "pre") refreshSheetButtons();
  }
  let sheetKind = null;
  function openSheet(k) {
    sheetKind = k; $("sheet").classList.remove("hidden"); const body = $("sheet-body"); body.innerHTML = "";
    if (k === "mgr") { $("sheet-t").textContent = L("managers"); B.forEach((b, i) => { const it = document.createElement("div"); it.className = "item" + (S.mgr[i] ? " done" : ""); it.innerHTML = `<span class="e">${b.e}</span><span class="t"></span><button data-i="${i}"></button>`; it.querySelector(".t").innerHTML = `${L("b")[i]}<small>${L("runsAlone")}</small>`; const bt = it.querySelector("button"); bt.onclick = () => hire(i); body.appendChild(it); }); }
    if (k === "upg") { $("sheet-t").textContent = L("upgrades"); UPG.filter(u => !S.upg.includes(u.id)).slice(0, 10).forEach(u => { const it = document.createElement("div"); it.className = "item"; it.innerHTML = `<span class="e">${u.b < 0 ? "🌟" : B[u.b].e}</span><span class="t"></span><button data-u="${u.id}"></button>`; it.querySelector(".t").innerHTML = `${u.b < 0 ? L("allBiz") : L("b")[u.b]}<small>${L("profitX", u.mult)} · ${fmt(u.cost)}</small>`; it.querySelector("button").onclick = () => buyUpg(u.id); body.appendChild(it); }); }
    if (k === "pre") { $("sheet-t").textContent = L("preT"); const g = starsTotal() - S.stars; body.innerHTML = `<p class="dim" style="text-align:center">${L("preHelp")}</p><div class="item"><span class="e">⭐</span><span class="t">${L("preNow", S.stars)}<small>${L("lifetime", fmt(S.lifetime))}</small></span></div><div style="text-align:center;font-weight:900;font-size:18px;color:var(--amber)">${g > 0 ? L("preGain", g) : L("preNone")}</div>`; if (g > 0) { const bt = document.createElement("button"); bt.className = "big"; bt.textContent = L("preBtn"); bt.onclick = prestige; body.appendChild(bt); } }
    refreshSheetButtons();
  }
  function refreshSheetButtons() {
    $("sheet-body").querySelectorAll("button[data-i]").forEach(bt => { const i = +bt.dataset.i; bt.textContent = S.mgr[i] ? L("hired") : L("hire") + " · " + fmt(B[i].mgr); bt.disabled = S.mgr[i] || !S.owned[i] || S.cash < B[i].mgr; });
    $("sheet-body").querySelectorAll("button[data-u]").forEach(bt => { const u = UPG.find(x => x.id === bt.dataset.u); bt.textContent = L("buyU"); bt.disabled = S.cash < u.cost; });
  }
  function closeSheet() { $("sheet").classList.add("hidden"); sheetKind = null; }
  $("t-mgr").onclick = () => openSheet("mgr"); $("t-upg").onclick = () => openSheet("upg"); $("t-pre").onclick = () => openSheet("pre"); $("sheet-x").onclick = closeSheet;
  document.querySelectorAll("#modes button").forEach(b => { b.classList.toggle("active", b.dataset.m === mode); b.onclick = () => { mode = b.dataset.m; set("ty_mode", mode); document.querySelectorAll("#modes button").forEach(x => x.classList.toggle("active", x === b)); update(); }; });
  $("btn-lb").onclick = () => Arc.openLb("tycoon", (s) => fmt(Math.pow(10, s / 1000)));

  // ---------- ukládání + offline výdělek
  function save() { S.savedAt = Date.now(); set("ty_save", S); }
  let lbSent = get("ty_lb", 0);
  function cloudSave() { Arc.progress.save("tycoon", { lifetime: S.lifetime, save: JSON.stringify(S) }); const sc = Math.floor(Math.log10(S.lifetime + 1) * 1000); if (sc > lbSent + 50) { lbSent = sc; set("ty_lb", sc); Arc.submit("tycoon", sc, 0); } }
  function offline(since) {
    const secs = Math.min(8 * 3600, Math.max(0, (Date.now() - since) / 1000)); if (secs < 60) return;
    let got = 0; for (let i = 0; i < B.length; i++) if (S.mgr[i]) got += rate(i) * secs;
    if (got <= 0) return;
    $("welcome").classList.remove("hidden"); $("away-t").textContent = L("away", fmtT(secs)); $("away-cash").textContent = fmt(got);
    $("btn-collect").onclick = () => { earn(got); $("welcome").classList.add("hidden"); beep(880, 0.15); save(); };
    $("btn-collect2").onclick = () => { const ov = document.createElement("div"); ov.className = "overlay"; ov.style.zIndex = 9; ov.innerHTML = `<div class="card"><h2>${L("adTitle")}</h2><div class="big-num" id="ad-n">3</div><div class="dim">${L("adNote")}</div></div>`; document.body.appendChild(ov); let n = 3; const iv = setInterval(() => { n--; ov.querySelector("#ad-n").textContent = n; if (n <= 0) { clearInterval(iv); ov.remove(); earn(got * 2); $("welcome").classList.add("hidden"); beep(1320, 0.2); save(); } }, 1000); };
  }
  function loop(now) { const dt = Math.min(1, (now - last) / 1000 || 0); last = now; tick(dt); update(); saveT += dt; if (saveT > 5) { saveT = 0; save(); } requestAnimationFrame(loop); }
  document.addEventListener("visibilitychange", () => { if (document.hidden) { save(); cloudSave(); } else { const since = S.savedAt; offline(since); } });
  window.addEventListener("pagehide", () => { save(); cloudSave(); });

  Arc.wire(); Arc.applyLang();
  const since = S.savedAt; build(); offline(since); requestAnimationFrame(loop);
  // cloud: když je na účtu novější/větší hra, převezmi ji
  Arc.progress.load("tycoon", {}).then(p => { if (p && p.save && p.lifetime > S.lifetime) { try { const r = JSON.parse(p.save); S = Object.assign(fresh(), r); build(); offline(r.savedAt); } catch {} } });
  setInterval(cloudSave, 60000);
  window.__ty = { get S() { return S; }, buy, hire, tapBiz, prestige, build, fmt };
})();
