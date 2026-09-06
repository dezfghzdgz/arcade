(() => {
  const $ = (id) => document.getElementById(id);
  const screens = ["menu", "hud", "over", "leaderboard", "shop", "missions"];
  let lastFrom = "menu";
  let submitting = null;

  function show(id) {
    screens.forEach(s => $(s).classList.toggle("hidden", s !== id));
    if (id === "menu" || id === "over") Monetization.showBanner();
    else Monetization.hideBanner();
  }

  function toast(msg, ms = 1600) {
    const el = $("toast");
    el.textContent = msg; el.classList.remove("hidden");
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.add("hidden"), ms);
  }

  function refreshMenu() {
    $("menu-best").textContent = Storage.best;
    $("menu-coins").textContent = Storage.coins;
    $("btn-sound").textContent = Lang("sound") + ": " + Lang(Storage.sound ? "on" : "off");
    $("btn-music").textContent = Lang("music") + ": " + Lang(Storage.music ? "on" : "off");
    $("btn-vibrate").textContent = Lang("vibrate") + ": " + Lang(Storage.vibrate ? "on" : "off");
    const left = Missions.list().filter(m => !m.claimed).length;
    $("missions-badge").textContent = left ? left : "✓";
    $("btn-lang").textContent = Lang("lang");
    const loc = Lang.current() === "cs" ? "cs-CZ" : "en-US";
    $("lbl-gems_500").textContent = Lang("gems", (500).toLocaleString(loc));
    $("lbl-gems_2000").textContent = Lang("gems", (2000).toLocaleString(loc));
    for (const k of Object.keys(ZD_CONFIG.iap)) {
      const el = $("price-" + k), p = ZD_CONFIG.iap[k];
      if (el && p.price) el.textContent = p.price + (p.subscription ? Lang("perMonth") : "");
    }
    const sub = document.querySelector('[data-iap="remove_ads"]');
    if (sub) {
      const active = Storage.noAdsUntil > Date.now();
      sub.disabled = active;
      sub.querySelector("span").textContent = active ? Lang("subActive", new Date(Storage.noAdsUntil).toLocaleDateString()) : Lang("removeAds");
    }
  }

  // ---------- hra ----------
  Game.init($("game"), {
    onHud({ score, coins, combo, mult }) {
      $("hud-score").textContent = score;
      $("hud-coins-n").textContent = coins;
      $("hud-combo").textContent = combo >= 3 ? Lang("combo").toLowerCase() + " " + combo : "";
      $("hud-fever").classList.toggle("hidden", mult <= 1);
      $("hud-mult").textContent = mult;
    },
    async onDie({ score, coins, combo, best, isNew, canContinue }) {
      $("over-score").textContent = score;
      $("over-best").textContent = best;
      $("over-combo").textContent = combo;
      $("over-coins").textContent = coins;
      $("over-new").classList.toggle("hidden", !isNew);
      $("btn-continue").classList.toggle("hidden", !canContinue || score < 3);
      $("over-rank").textContent = "";
      Music.stop();
      setTimeout(() => show("over"), 550);
      // skóre do žebříčku
      submitting = Leaderboard.submit(score).then(rank => {
        if (rank) $("over-rank").textContent = Lang("worldRank", rank);
        return rank;
      });
    },
  });

  function startGame() {
    Audio2.unlock();
    show("hud");
    Game.start();
    Music.start();
  }

  // vstup: kdekoli na ploše během hry
  const stage = $("stage");
  stage.addEventListener("pointerdown", (e) => {
    if (Game.state !== "play") return;
    if (e.target.closest("button, input")) return;
    e.preventDefault();
    Game.tap();
  });
  window.addEventListener("keydown", (e) => {
    if ([" ", "ArrowLeft", "ArrowRight", "ArrowUp"].includes(e.key)) {
      e.preventDefault();
      if (Game.state === "play") Game.tap();
      else if (Game.state === "idle" && !$("menu").classList.contains("hidden")) startGame();
    }
  });

  // ---------- menu ----------
  $("btn-play").onclick = startGame;
  $("btn-retry").onclick = startGame;
  $("btn-over-menu").onclick = () => { Game.goIdle(); Music.stop(); refreshMenu(); show("menu"); };
  $("btn-sound").onclick = () => { Storage.setSound(!Storage.sound); Audio2.ui(); refreshMenu(); };
  $("btn-music").onclick = () => { Music.toggle(); Audio2.ui(); refreshMenu(); };
  $("btn-vibrate").onclick = () => { Storage.setVibrate(!Storage.vibrate); Haptic.bounce(); Audio2.ui(); refreshMenu(); };
  $("btn-missions").onclick = () => { lastFrom = "menu"; openMissions(); };
  $("btn-share").onclick = shareScore;
  $("btn-lang").onclick = () => { Lang.toggle(); Audio2.ui(); refreshMenu(); };
  $("btn-leaderboard").onclick = () => { lastFrom = "menu"; openLeaderboard(); };
  $("btn-over-leaderboard").onclick = () => { lastFrom = "over"; openLeaderboard(); };
  $("btn-shop").onclick = () => { lastFrom = "menu"; openShop(); };
  document.querySelectorAll("[data-back]").forEach(b => b.onclick = () => { Audio2.ui(); if (lastFrom === "menu") refreshMenu(); show(lastFrom); });

  $("btn-continue").onclick = async () => {
    const btn = $("btn-continue");
    btn.disabled = true;
    const ok = await Monetization.showRewarded();
    btn.disabled = false;
    if (ok) { show("hud"); Game.revive(); Music.start(); }
    else toast(Lang("adUnavailable"));
  };

  // ---------- denní úkoly ----------
  function openMissions() {
    Audio2.ui();
    show("missions");
    const list = $("missions-list"); list.innerHTML = "";
    for (const m of Missions.list()) {
      const el = document.createElement("div");
      el.className = "mission" + (m.claimed ? " done" : "");
      const pct = Math.min(100, Math.round(100 * m.progress / m.target));
      el.innerHTML = `<div class="m-head"><span></span><span class="m-reward"><span class="gem"></span>${m.reward}</span></div>
        <div class="m-bar"><i style="width:${pct}%"></i></div>
        <div class="m-prog">${m.claimed ? "✓" : m.progress + " / " + m.target}</div>`;
      el.querySelector(".m-head span").textContent = Lang.mission(m.type, m.target);
      list.appendChild(el);
    }
    $("missions-note").classList.toggle("hidden", !Missions.allDone());
  }
  Missions.onComplete((m) => { toast(Lang("missionDone", m.reward)); Audio2.reward(); Haptic.reward(); });

  // ---------- sdílení skóre ----------
  async function shareScore() {
    const url = ZD_CONFIG.webUrl || location.href.split("?")[0];
    const text = Lang("shareText", $("over-score").textContent) + url;
    try {
      if (navigator.share) { await navigator.share({ text }); return; }
      await navigator.clipboard.writeText(text); toast(Lang("copied"));
    } catch {}
  }

  // ---------- žebříček ----------
  async function openLeaderboard() {
    Audio2.ui();
    show("leaderboard");
    $("name-input").value = Storage.name;
    const list = $("lb-list"), status = $("lb-status"), me = $("lb-me");
    list.innerHTML = ""; me.classList.add("hidden");
    if (!Leaderboard.enabled()) {
      status.textContent = Lang("lbOffline", Storage.best);
      return;
    }
    status.textContent = Lang("loading");
    if (submitting) await submitting;
    const { rows, me: mine, error } = await Leaderboard.top(50);
    if (error) { status.textContent = Lang("lbError"); return; }
    status.textContent = rows.length ? "" : Lang("lbEmpty");
    for (const r of rows) {
      const li = document.createElement("li");
      if (r.device_id === Storage.device) li.classList.add("me");
      li.innerHTML = `<span class="rank">${r.rank}.</span><span class="name"></span><span class="score">${r.score}</span>`;
      li.querySelector(".name").textContent = r.name || Lang("player");
      list.appendChild(li);
    }
    if (mine) { me.textContent = Lang("you", mine.rank, mine.score); me.classList.remove("hidden"); }
  }
  $("btn-name-save").onclick = async () => {
    const v = $("name-input").value.trim().slice(0, 12);
    if (!v) return;
    await Leaderboard.rename(v);
    toast(Lang("nameSaved"));
    openLeaderboard();
  };

  // ---------- obchod ----------
  const CATALOG = [
    { kind: "skin",  title: "Barvy",  items: () => Game.SKINS },
    { kind: "shape", title: "Tvary",  items: () => Game.SHAPES },
    { kind: "aura",  title: "Aury",   items: () => Game.AURAS },
    { kind: "fx",    title: "Efekty", items: () => Game.FX },
    { kind: "bg",    title: "Pozadí", items: () => Game.THEMES },
  ];
  let shopTab = "skin";

  function openShop() {
    Audio2.ui();
    show("shop");
    refreshMenu();
    $("shop-coins").textContent = Storage.coins;
    $("iap-note").classList.toggle("hidden", Monetization.native);

    const tabs = $("shop-tabs");
    tabs.innerHTML = "";
    for (const cat of CATALOG) {
      const b = document.createElement("button");
      b.textContent = Lang.tab(cat.kind);
      b.className = cat.kind === shopTab ? "active" : "";
      b.onclick = () => { shopTab = cat.kind; Audio2.ui(); openShop(); };
      tabs.appendChild(b);
    }

    const cat = CATALOG.find(c => c.kind === shopTab);
    const grid = $("shop-grid");
    grid.innerHTML = "";
    const owned = Storage.ownedOf(cat.kind), active = Storage.active(cat.kind);
    for (const [id, item] of Object.entries(cat.items())) {
      const has = owned.includes(id);
      const el = document.createElement("button");
      el.className = "skin" + (has ? " owned" : "") + (active === id ? " active" : "");
      el.appendChild(previewEl(cat.kind, id, item));
      const label = document.createElement("span");
      label.textContent = has ? Lang.itemName(item) : item.price;
      el.appendChild(label);
      el.onclick = () => {
        if (has) { Storage.setActive(cat.kind, id); Audio2.ui(); }
        else if (Storage.coins >= item.price) { Storage.addCoins(-item.price); Storage.ownItem(cat.kind, id); Storage.setActive(cat.kind, id); Audio2.gem(8); toast(Lang("unlocked", Lang.itemName(item))); }
        else { toast(Lang("missingGems", item.price - Storage.coins)); return; }
        openShop();
      };
      grid.appendChild(el);
    }
    Monetization.loadPrices();
  }

  function previewEl(kind, id, item) {
    if (kind === "skin") {
      const d = document.createElement("span"); d.className = "dot";
      d.style.cssText = item.type === "rainbow" ? "background:conic-gradient(#f55,#ff5,#5f5,#5ff,#55f,#f5f,#f55)"
        : item.type === "ghost" ? `background:${item.c};opacity:.55`
        : item.type === "ring" ? `background:${item.c};box-shadow:0 0 0 3px var(--bg-2),0 0 0 5px ${item.c}`
        : item.type === "core" ? `background:radial-gradient(circle,#000 30%,${item.c} 32%)`
        : `background:${item.c}`;
      return d;
    }
    if (kind === "bg") {
      const d = document.createElement("span"); d.className = "swatch";
      d.style.cssText = `background:linear-gradient(${item.top},${item.bottom});box-shadow:inset 3px 0 0 ${item.wall},inset -3px 0 0 ${item.wall}`;
      return d;
    }
    const cv = document.createElement("canvas"); cv.width = 68; cv.height = 68;
    Game.preview(cv, kind, id);
    return cv;
  }
  document.querySelectorAll(".iap").forEach(b => b.onclick = async () => {
    const ok = await Monetization.purchase(b.dataset.iap);
    if (ok) { toast(Lang("done")); openShop(); }
  });
  $("btn-restore").onclick = async () => {
    const ok = await Monetization.restore();
    toast(ok ? Lang("restored") : Lang("nothingToRestore"));
  };

  // ---------- start ----------
  Monetization.init().then(async () => {
    // návrat ze Stripe / nevyzvednuté nákupy z webu
    const granted = await Monetization.claimWebPurchases();
    if (granted.length) { toast(Lang("purchaseActive")); refreshMenu(); }
  });
  Lang.apply();
  refreshMenu();
  show("menu");
  // denní bonus za sérii dnů
  const bonus = Missions.dailyBonus();
  if (bonus) setTimeout(() => { toast(Lang("dailyBonus", bonus.reward, bonus.streak), 3000); Audio2.reward(); refreshMenu(); }, 600);
})();
