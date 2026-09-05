window.Storage = (() => {
  const get = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const st = {
    name: get("fr_name", ""), coins: get("fr_coins", 0), hat: get("fr_hat", "none"), owned: get("fr_hat_owned", ["none"]),
    sound: get("fr_sound", true), lang: get("fr_lang", null), noAds: get("fr_noads", false), noAdsUntil: get("fr_noads_until", 0),
    device: get("fr_device", null), stats: get("fr_stats", { games: 0, wins: 0, best: 0 }),
    pattern: get("fr_pattern", "none"), patternOwned: get("fr_pattern_owned", ["none"]), color: get("fr_color", -1),
    missions: get("fr_missions", null), daily: get("fr_daily", null), lastMode: get("fr_mode", "classic"), lastSeconds: get("fr_seconds", 60), vibrate: get("fr_vibrate", true),
    opts: get("fr_opts", { target: 0, pu: "normal", bots: "mix" }),
  };
  if (!st.device) { st.device = crypto.randomUUID ? crypto.randomUUID() : "d-" + Math.random().toString(36).slice(2) + Date.now(); set("fr_device", st.device); }
  try { const an = localStorage.getItem("arcade_name"); if (an && localStorage.getItem("arcade_name_used") !== an) { st.name = an.slice(0, 12); set("fr_name", st.name); localStorage.setItem("arcade_name_used", an); } } catch {}
  return {
    get name() { return st.name; }, setName(v) { st.name = v; set("fr_name", v); },
    get coins() { return st.coins; }, addCoins(n) { st.coins = Math.max(0, st.coins + n); set("fr_coins", st.coins); },
    get hat() { return st.hat; }, setHat(v) { st.hat = v; set("fr_hat", v); },
    get owned() { return st.owned; }, own(id) { if (!st.owned.includes(id)) { st.owned.push(id); set("fr_hat_owned", st.owned); } },
    get sound() { return st.sound; }, setSound(v) { st.sound = v; set("fr_sound", v); },
    get lang() { return st.lang; }, setLang(v) { st.lang = v; set("fr_lang", v); },
    get noAds() { return !!st.noAds || st.noAdsUntil > Date.now(); }, setNoAds(v) { st.noAds = v; set("fr_noads", v); },
    get noAdsUntil() { return st.noAdsUntil; }, setNoAdsUntil(t) { st.noAdsUntil = t || 0; set("fr_noads_until", st.noAdsUntil); },
    get device() { return st.device; },
    get stats() { return st.stats; }, setStats(v) { st.stats = v; set("fr_stats", v); },
    get pattern() { return st.pattern; }, setPattern(v) { st.pattern = v; set("fr_pattern", v); },
    get patternOwned() { return st.patternOwned; }, ownPattern(id) { if (!st.patternOwned.includes(id)) { st.patternOwned.push(id); set("fr_pattern_owned", st.patternOwned); } },
    get color() { return st.color; }, setColor(v) { st.color = v; set("fr_color", v); },
    get missions() { return st.missions; }, setMissions(v) { st.missions = v; set("fr_missions", v); },
    get daily() { return st.daily; }, setDaily(v) { st.daily = v; set("fr_daily", v); },
    get lastMode() { return st.lastMode; }, setLastMode(v) { st.lastMode = v; set("fr_mode", v); },
    get lastSeconds() { return st.lastSeconds; }, setLastSeconds(v) { st.lastSeconds = v; set("fr_seconds", v); },
    get vibrate() { return st.vibrate; }, setVibrate(v) { st.vibrate = v; set("fr_vibrate", v); },
    get opts() { return st.opts; }, setOpts(v) { st.opts = v; set("fr_opts", v); },
  };
})();
