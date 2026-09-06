window.Storage = (() => {
  const get = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const st = {
    name: get("pg_name", ""), coins: get("pg_coins", 0), hat: get("pg_hat", "none"), owned: get("pg_hat_owned", ["none"]),
    sound: get("pg_sound", true), lang: get("pg_lang", null), noAds: get("pg_noads", false), noAdsUntil: get("pg_noads_until", 0),
    device: get("pg_device", null), stats: get("pg_stats", { games: 0, wins: 0, best: 0 }),
    pattern: get("pg_pattern", "none"), patternOwned: get("pg_pattern_owned", ["none"]), color: get("pg_color", -1),
    missions: get("pg_missions", null), daily: get("pg_daily", null), lastMode: get("pg_mode", "classic"), lastSeconds: get("pg_seconds", 180), vibrate: get("pg_vibrate", true),
    opts: get("pg_opts", { target: 0, pu: "normal", bots: "mix" }),
  };
  if (!st.device) { st.device = crypto.randomUUID ? crypto.randomUUID() : "d-" + Math.random().toString(36).slice(2) + Date.now(); set("pg_device", st.device); }
  try { const an = localStorage.getItem("arcade_name"); if (an && localStorage.getItem("arcade_name_used_pong") !== an) { st.name = an.slice(0, 12); set("pg_name", st.name); localStorage.setItem("arcade_name_used_pong", an); } } catch {}
  return {
    get name() { return st.name; }, setName(v) { st.name = v; set("pg_name", v); },
    get coins() { return st.coins; }, addCoins(n) { st.coins = Math.max(0, st.coins + n); set("pg_coins", st.coins); },
    get hat() { return st.hat; }, setHat(v) { st.hat = v; set("pg_hat", v); },
    get owned() { return st.owned; }, own(id) { if (!st.owned.includes(id)) { st.owned.push(id); set("pg_hat_owned", st.owned); } },
    get sound() { return st.sound; }, setSound(v) { st.sound = v; set("pg_sound", v); },
    get lang() { return st.lang; }, setLang(v) { st.lang = v; set("pg_lang", v); },
    get noAds() { return !!st.noAds || st.noAdsUntil > Date.now(); }, setNoAds(v) { st.noAds = v; set("pg_noads", v); },
    get noAdsUntil() { return st.noAdsUntil; }, setNoAdsUntil(t) { st.noAdsUntil = t || 0; set("pg_noads_until", st.noAdsUntil); },
    get device() { return st.device; },
    get stats() { return st.stats; }, setStats(v) { st.stats = v; set("pg_stats", v); },
    get pattern() { return st.pattern; }, setPattern(v) { st.pattern = v; set("pg_pattern", v); },
    get patternOwned() { return st.patternOwned; }, ownPattern(id) { if (!st.patternOwned.includes(id)) { st.patternOwned.push(id); set("pg_pattern_owned", st.patternOwned); } },
    get color() { return st.color; }, setColor(v) { st.color = v; set("pg_color", v); },
    get missions() { return st.missions; }, setMissions(v) { st.missions = v; set("pg_missions", v); },
    get daily() { return st.daily; }, setDaily(v) { st.daily = v; set("pg_daily", v); },
    get lastMode() { return st.lastMode; }, setLastMode(v) { st.lastMode = v; set("pg_mode", v); },
    get lastSeconds() { return st.lastSeconds; }, setLastSeconds(v) { st.lastSeconds = v; set("pg_seconds", v); },
    get vibrate() { return st.vibrate; }, setVibrate(v) { st.vibrate = v; set("pg_vibrate", v); },
    get opts() { return st.opts; }, setOpts(v) { st.opts = v; set("pg_opts", v); },
  };
})();
