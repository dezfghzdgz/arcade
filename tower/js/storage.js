window.Storage = (() => {
  const get = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const st = {
    name: get("tw_name", ""), coins: get("tw_coins", 0), hat: get("tw_hat", "none"), owned: get("tw_hat_owned", ["none"]),
    sound: get("tw_sound", true), lang: get("tw_lang", null), noAds: get("tw_noads", false), noAdsUntil: get("tw_noads_until", 0),
    device: get("tw_device", null), stats: get("tw_stats", { games: 0, wins: 0, best: 0 }),
    pattern: get("tw_pattern", "none"), patternOwned: get("tw_pattern_owned", ["none"]), color: get("tw_color", -1),
    missions: get("tw_missions", null), daily: get("tw_daily", null), lastMode: get("tw_mode", "race"), lastSeconds: get("tw_seconds", 60), vibrate: get("tw_vibrate", true),
    opts: get("tw_opts", { target: 0, pu: "normal", bots: "mix" }),
  };
  if (!st.device) { st.device = crypto.randomUUID ? crypto.randomUUID() : "d-" + Math.random().toString(36).slice(2) + Date.now(); set("tw_device", st.device); }
  return {
    get name() { return st.name; }, setName(v) { st.name = v; set("tw_name", v); },
    get coins() { return st.coins; }, addCoins(n) { st.coins = Math.max(0, st.coins + n); set("tw_coins", st.coins); },
    get hat() { return st.hat; }, setHat(v) { st.hat = v; set("tw_hat", v); },
    get owned() { return st.owned; }, own(id) { if (!st.owned.includes(id)) { st.owned.push(id); set("tw_hat_owned", st.owned); } },
    get sound() { return st.sound; }, setSound(v) { st.sound = v; set("tw_sound", v); },
    get lang() { return st.lang; }, setLang(v) { st.lang = v; set("tw_lang", v); },
    get noAds() { return !!st.noAds || st.noAdsUntil > Date.now(); }, setNoAds(v) { st.noAds = v; set("tw_noads", v); },
    get noAdsUntil() { return st.noAdsUntil; }, setNoAdsUntil(t) { st.noAdsUntil = t || 0; set("tw_noads_until", st.noAdsUntil); },
    get device() { return st.device; },
    get stats() { return st.stats; }, setStats(v) { st.stats = v; set("tw_stats", v); },
    get pattern() { return st.pattern; }, setPattern(v) { st.pattern = v; set("tw_pattern", v); },
    get patternOwned() { return st.patternOwned; }, ownPattern(id) { if (!st.patternOwned.includes(id)) { st.patternOwned.push(id); set("tw_pattern_owned", st.patternOwned); } },
    get color() { return st.color; }, setColor(v) { st.color = v; set("tw_color", v); },
    get missions() { return st.missions; }, setMissions(v) { st.missions = v; set("tw_missions", v); },
    get daily() { return st.daily; }, setDaily(v) { st.daily = v; set("tw_daily", v); },
    get lastMode() { return st.lastMode; }, setLastMode(v) { st.lastMode = v; set("tw_mode", v); },
    get lastSeconds() { return st.lastSeconds; }, setLastSeconds(v) { st.lastSeconds = v; set("tw_seconds", v); },
    get vibrate() { return st.vibrate; }, setVibrate(v) { st.vibrate = v; set("tw_vibrate", v); },
    get opts() { return st.opts; }, setOpts(v) { st.opts = v; set("tw_opts", v); },
  };
})();
