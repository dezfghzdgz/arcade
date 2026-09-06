window.Storage = (() => {
  const get = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const st = {
    name: get("fl_name", ""), coins: get("fl_coins", 0), hat: get("fl_hat", "none"), owned: get("fl_hat_owned", ["none"]),
    sound: get("fl_sound", true), lang: get("fl_lang", null), noAds: get("fl_noads", false), noAdsUntil: get("fl_noads_until", 0),
    device: get("fl_device", null), stats: get("fl_stats", { games: 0, wins: 0, best: 0 }),
    pattern: get("fl_pattern", "none"), patternOwned: get("fl_pattern_owned", ["none"]), color: get("fl_color", -1),
    missions: get("fl_missions", null), daily: get("fl_daily", null), lastMode: get("fl_mode", "deathmatch"), lastSeconds: get("fl_seconds", 120), vibrate: get("fl_vibrate", true),
    opts: get("fl_opts", { target: 0, pu: "normal", bots: "mix" }),
  };
  if (!st.device) { st.device = crypto.randomUUID ? crypto.randomUUID() : "d-" + Math.random().toString(36).slice(2) + Date.now(); set("fl_device", st.device); }
  try { const an = localStorage.getItem("arcade_name"); if (an && localStorage.getItem("arcade_name_used_fleet") !== an) { st.name = an.slice(0, 12); set("fl_name", st.name); localStorage.setItem("arcade_name_used_fleet", an); } } catch {}
  return {
    get name() { return st.name; }, setName(v) { st.name = v; set("fl_name", v); },
    get coins() { return st.coins; }, addCoins(n) { st.coins = Math.max(0, st.coins + n); set("fl_coins", st.coins); },
    get hat() { return st.hat; }, setHat(v) { st.hat = v; set("fl_hat", v); },
    get owned() { return st.owned; }, own(id) { if (!st.owned.includes(id)) { st.owned.push(id); set("fl_hat_owned", st.owned); } },
    get sound() { return st.sound; }, setSound(v) { st.sound = v; set("fl_sound", v); },
    get lang() { return st.lang; }, setLang(v) { st.lang = v; set("fl_lang", v); },
    get noAds() { return !!st.noAds || st.noAdsUntil > Date.now(); }, setNoAds(v) { st.noAds = v; set("fl_noads", v); },
    get noAdsUntil() { return st.noAdsUntil; }, setNoAdsUntil(t) { st.noAdsUntil = t || 0; set("fl_noads_until", st.noAdsUntil); },
    get device() { return st.device; },
    get stats() { return st.stats; }, setStats(v) { st.stats = v; set("fl_stats", v); },
    get pattern() { return st.pattern; }, setPattern(v) { st.pattern = v; set("fl_pattern", v); },
    get patternOwned() { return st.patternOwned; }, ownPattern(id) { if (!st.patternOwned.includes(id)) { st.patternOwned.push(id); set("fl_pattern_owned", st.patternOwned); } },
    get color() { return st.color; }, setColor(v) { st.color = v; set("fl_color", v); },
    get missions() { return st.missions; }, setMissions(v) { st.missions = v; set("fl_missions", v); },
    get daily() { return st.daily; }, setDaily(v) { st.daily = v; set("fl_daily", v); },
    get lastMode() { return st.lastMode; }, setLastMode(v) { st.lastMode = v; set("fl_mode", v); },
    get lastSeconds() { return st.lastSeconds; }, setLastSeconds(v) { st.lastSeconds = v; set("fl_seconds", v); },
    get vibrate() { return st.vibrate; }, setVibrate(v) { st.vibrate = v; set("fl_vibrate", v); },
    get opts() { return st.opts; }, setOpts(v) { st.opts = v; set("fl_opts", v); },
  };
})();
