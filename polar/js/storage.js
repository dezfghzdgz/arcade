window.Storage = (() => {
  const get = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const st = {
    name: get("pl_name", ""), coins: get("pl_coins", 0), hat: get("pl_hat", "none"), owned: get("pl_hat_owned", ["none"]),
    sound: get("pl_sound", true), lang: get("pl_lang", null), noAds: get("pl_noads", false), noAdsUntil: get("pl_noads_until", 0),
    device: get("pl_device", null), stats: get("pl_stats", { games: 0, wins: 0, best: 0 }),
    pattern: get("pl_pattern", "none"), patternOwned: get("pl_pattern_owned", ["none"]), color: get("pl_color", -1),
    missions: get("pl_missions", null), daily: get("pl_daily", null), lastMode: get("pl_mode", "coins"), lastSeconds: get("pl_seconds", 60), vibrate: get("pl_vibrate", true),
    opts: get("pl_opts", { target: 0, pu: "normal", bots: "mix" }),
  };
  if (!st.device) { st.device = crypto.randomUUID ? crypto.randomUUID() : "d-" + Math.random().toString(36).slice(2) + Date.now(); set("pl_device", st.device); }
  return {
    get name() { return st.name; }, setName(v) { st.name = v; set("pl_name", v); },
    get coins() { return st.coins; }, addCoins(n) { st.coins = Math.max(0, st.coins + n); set("pl_coins", st.coins); },
    get hat() { return st.hat; }, setHat(v) { st.hat = v; set("pl_hat", v); },
    get owned() { return st.owned; }, own(id) { if (!st.owned.includes(id)) { st.owned.push(id); set("pl_hat_owned", st.owned); } },
    get sound() { return st.sound; }, setSound(v) { st.sound = v; set("pl_sound", v); },
    get lang() { return st.lang; }, setLang(v) { st.lang = v; set("pl_lang", v); },
    get noAds() { return !!st.noAds || st.noAdsUntil > Date.now(); }, setNoAds(v) { st.noAds = v; set("pl_noads", v); },
    get noAdsUntil() { return st.noAdsUntil; }, setNoAdsUntil(t) { st.noAdsUntil = t || 0; set("pl_noads_until", st.noAdsUntil); },
    get device() { return st.device; },
    get stats() { return st.stats; }, setStats(v) { st.stats = v; set("pl_stats", v); },
    get pattern() { return st.pattern; }, setPattern(v) { st.pattern = v; set("pl_pattern", v); },
    get patternOwned() { return st.patternOwned; }, ownPattern(id) { if (!st.patternOwned.includes(id)) { st.patternOwned.push(id); set("pl_pattern_owned", st.patternOwned); } },
    get color() { return st.color; }, setColor(v) { st.color = v; set("pl_color", v); },
    get missions() { return st.missions; }, setMissions(v) { st.missions = v; set("pl_missions", v); },
    get daily() { return st.daily; }, setDaily(v) { st.daily = v; set("pl_daily", v); },
    get lastMode() { return st.lastMode; }, setLastMode(v) { st.lastMode = v; set("pl_mode", v); },
    get lastSeconds() { return st.lastSeconds; }, setLastSeconds(v) { st.lastSeconds = v; set("pl_seconds", v); },
    get vibrate() { return st.vibrate; }, setVibrate(v) { st.vibrate = v; set("pl_vibrate", v); },
    get opts() { return st.opts; }, setOpts(v) { st.opts = v; set("pl_opts", v); },
  };
})();
