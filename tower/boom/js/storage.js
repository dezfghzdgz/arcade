window.Storage = (() => {
  const get = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const st = {
    name: get("bm_name", ""), coins: get("bm_coins", 0), hat: get("bm_hat", "none"), owned: get("bm_hat_owned", ["none"]),
    sound: get("bm_sound", true), lang: get("bm_lang", null), noAds: get("bm_noads", false), noAdsUntil: get("bm_noads_until", 0),
    device: get("bm_device", null), stats: get("bm_stats", { games: 0, wins: 0, best: 0 }),
    pattern: get("bm_pattern", "none"), patternOwned: get("bm_pattern_owned", ["none"]), color: get("bm_color", -1),
    missions: get("bm_missions", null), daily: get("bm_daily", null), lastMode: get("bm_mode", "classic"), lastSeconds: get("bm_seconds", 300), vibrate: get("bm_vibrate", true),
    opts: get("bm_opts", { target: 0, pu: "normal", bots: "mix" }),
  };
  if (!st.device) { st.device = crypto.randomUUID ? crypto.randomUUID() : "d-" + Math.random().toString(36).slice(2) + Date.now(); set("bm_device", st.device); }
  try { const an = localStorage.getItem("arcade_name"); if (an && localStorage.getItem("arcade_name_used_boom") !== an) { st.name = an.slice(0, 12); set("bm_name", st.name); localStorage.setItem("arcade_name_used_boom", an); } } catch {}
  return {
    get name() { return st.name; }, setName(v) { st.name = v; set("bm_name", v); },
    get coins() { return st.coins; }, addCoins(n) { st.coins = Math.max(0, st.coins + n); set("bm_coins", st.coins); },
    get hat() { return st.hat; }, setHat(v) { st.hat = v; set("bm_hat", v); },
    get owned() { return st.owned; }, own(id) { if (!st.owned.includes(id)) { st.owned.push(id); set("bm_hat_owned", st.owned); } },
    get sound() { return st.sound; }, setSound(v) { st.sound = v; set("bm_sound", v); },
    get lang() { return st.lang; }, setLang(v) { st.lang = v; set("bm_lang", v); },
    get noAds() { return !!st.noAds || st.noAdsUntil > Date.now(); }, setNoAds(v) { st.noAds = v; set("bm_noads", v); },
    get noAdsUntil() { return st.noAdsUntil; }, setNoAdsUntil(t) { st.noAdsUntil = t || 0; set("bm_noads_until", st.noAdsUntil); },
    get device() { return st.device; },
    get stats() { return st.stats; }, setStats(v) { st.stats = v; set("bm_stats", v); },
    get pattern() { return st.pattern; }, setPattern(v) { st.pattern = v; set("bm_pattern", v); },
    get patternOwned() { return st.patternOwned; }, ownPattern(id) { if (!st.patternOwned.includes(id)) { st.patternOwned.push(id); set("bm_pattern_owned", st.patternOwned); } },
    get color() { return st.color; }, setColor(v) { st.color = v; set("bm_color", v); },
    get missions() { return st.missions; }, setMissions(v) { st.missions = v; set("bm_missions", v); },
    get daily() { return st.daily; }, setDaily(v) { st.daily = v; set("bm_daily", v); },
    get lastMode() { return st.lastMode; }, setLastMode(v) { st.lastMode = v; set("bm_mode", v); },
    get lastSeconds() { return st.lastSeconds; }, setLastSeconds(v) { st.lastSeconds = v; set("bm_seconds", v); },
    get vibrate() { return st.vibrate; }, setVibrate(v) { st.vibrate = v; set("bm_vibrate", v); },
    get opts() { return st.opts; }, setOpts(v) { st.opts = v; set("bm_opts", v); },
  };
})();
