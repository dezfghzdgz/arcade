window.Storage = (() => {
  const get = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const st = {
    name: get("sz_name", ""), coins: get("sz_coins", 0), hat: get("sz_hat", "none"), owned: get("sz_hat_owned", ["none"]),
    sound: get("sz_sound", true), lang: get("sz_lang", null), noAds: get("sz_noads", false), noAdsUntil: get("sz_noads_until", 0),
    device: get("sz_device", null), stats: get("sz_stats", { games: 0, wins: 0, best: 0 }),
    pattern: get("sz_pattern", "none"), patternOwned: get("sz_pattern_owned", ["none"]), color: get("sz_color", -1),
    missions: get("sz_missions", null), daily: get("sz_daily", null), lastMode: get("sz_mode", "paint"), lastSeconds: get("sz_seconds", 60), vibrate: get("sz_vibrate", true),
    opts: get("sz_opts", { target: 0, pu: "normal", bots: "mix" }),
  };
  if (!st.device) { st.device = crypto.randomUUID ? crypto.randomUUID() : "d-" + Math.random().toString(36).slice(2) + Date.now(); set("sz_device", st.device); }
  try { const an = localStorage.getItem("arcade_name"); if (an && localStorage.getItem("arcade_name_used") !== an) { st.name = an.slice(0, 12); set("sz_name", st.name); localStorage.setItem("arcade_name_used", an); } } catch {}
  return {
    get name() { return st.name; }, setName(v) { st.name = v; set("sz_name", v); },
    get coins() { return st.coins; }, addCoins(n) { st.coins = Math.max(0, st.coins + n); set("sz_coins", st.coins); },
    get hat() { return st.hat; }, setHat(v) { st.hat = v; set("sz_hat", v); },
    get owned() { return st.owned; }, own(id) { if (!st.owned.includes(id)) { st.owned.push(id); set("sz_hat_owned", st.owned); } },
    get sound() { return st.sound; }, setSound(v) { st.sound = v; set("sz_sound", v); },
    get lang() { return st.lang; }, setLang(v) { st.lang = v; set("sz_lang", v); },
    get noAds() { return !!st.noAds || st.noAdsUntil > Date.now(); }, setNoAds(v) { st.noAds = v; set("sz_noads", v); },
    get noAdsUntil() { return st.noAdsUntil; }, setNoAdsUntil(t) { st.noAdsUntil = t || 0; set("sz_noads_until", st.noAdsUntil); },
    get device() { return st.device; },
    get stats() { return st.stats; }, setStats(v) { st.stats = v; set("sz_stats", v); },
    get pattern() { return st.pattern; }, setPattern(v) { st.pattern = v; set("sz_pattern", v); },
    get patternOwned() { return st.patternOwned; }, ownPattern(id) { if (!st.patternOwned.includes(id)) { st.patternOwned.push(id); set("sz_pattern_owned", st.patternOwned); } },
    get color() { return st.color; }, setColor(v) { st.color = v; set("sz_color", v); },
    get missions() { return st.missions; }, setMissions(v) { st.missions = v; set("sz_missions", v); },
    get daily() { return st.daily; }, setDaily(v) { st.daily = v; set("sz_daily", v); },
    get lastMode() { return st.lastMode; }, setLastMode(v) { st.lastMode = v; set("sz_mode", v); },
    get lastSeconds() { return st.lastSeconds; }, setLastSeconds(v) { st.lastSeconds = v; set("sz_seconds", v); },
    get vibrate() { return st.vibrate; }, setVibrate(v) { st.vibrate = v; set("sz_vibrate", v); },
    get opts() { return st.opts; }, setOpts(v) { st.opts = v; set("sz_opts", v); },
  };
})();
