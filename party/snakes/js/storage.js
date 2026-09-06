window.Storage = (() => {
  const get = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const st = {
    name: get("sk_name", ""), coins: get("sk_coins", 0), hat: get("sk_hat", "none"), owned: get("sk_hat_owned", ["none"]),
    sound: get("sk_sound", true), lang: get("sk_lang", null), noAds: get("sk_noads", false), noAdsUntil: get("sk_noads_until", 0),
    device: get("sk_device", null), stats: get("sk_stats", { games: 0, wins: 0, best: 0 }),
    pattern: get("sk_pattern", "none"), patternOwned: get("sk_pattern_owned", ["none"]), color: get("sk_color", -1),
    missions: get("sk_missions", null), daily: get("sk_daily", null), lastMode: get("sk_mode", "arena"), lastSeconds: get("sk_seconds", 120), vibrate: get("sk_vibrate", true),
    opts: get("sk_opts", { target: 0, pu: "normal", bots: "mix" }),
  };
  if (!st.device) { st.device = crypto.randomUUID ? crypto.randomUUID() : "d-" + Math.random().toString(36).slice(2) + Date.now(); set("sk_device", st.device); }
  try { const an = localStorage.getItem("arcade_name"); if (an && localStorage.getItem("arcade_name_used_snakes") !== an) { st.name = an.slice(0, 12); set("sk_name", st.name); localStorage.setItem("arcade_name_used_snakes", an); } } catch {}
  return {
    get name() { return st.name; }, setName(v) { st.name = v; set("sk_name", v); },
    get coins() { return st.coins; }, addCoins(n) { st.coins = Math.max(0, st.coins + n); set("sk_coins", st.coins); },
    get hat() { return st.hat; }, setHat(v) { st.hat = v; set("sk_hat", v); },
    get owned() { return st.owned; }, own(id) { if (!st.owned.includes(id)) { st.owned.push(id); set("sk_hat_owned", st.owned); } },
    get sound() { return st.sound; }, setSound(v) { st.sound = v; set("sk_sound", v); },
    get lang() { return st.lang; }, setLang(v) { st.lang = v; set("sk_lang", v); },
    get noAds() { return !!st.noAds || st.noAdsUntil > Date.now(); }, setNoAds(v) { st.noAds = v; set("sk_noads", v); },
    get noAdsUntil() { return st.noAdsUntil; }, setNoAdsUntil(t) { st.noAdsUntil = t || 0; set("sk_noads_until", st.noAdsUntil); },
    get device() { return st.device; },
    get stats() { return st.stats; }, setStats(v) { st.stats = v; set("sk_stats", v); },
    get pattern() { return st.pattern; }, setPattern(v) { st.pattern = v; set("sk_pattern", v); },
    get patternOwned() { return st.patternOwned; }, ownPattern(id) { if (!st.patternOwned.includes(id)) { st.patternOwned.push(id); set("sk_pattern_owned", st.patternOwned); } },
    get color() { return st.color; }, setColor(v) { st.color = v; set("sk_color", v); },
    get missions() { return st.missions; }, setMissions(v) { st.missions = v; set("sk_missions", v); },
    get daily() { return st.daily; }, setDaily(v) { st.daily = v; set("sk_daily", v); },
    get lastMode() { return st.lastMode; }, setLastMode(v) { st.lastMode = v; set("sk_mode", v); },
    get lastSeconds() { return st.lastSeconds; }, setLastSeconds(v) { st.lastSeconds = v; set("sk_seconds", v); },
    get vibrate() { return st.vibrate; }, setVibrate(v) { st.vibrate = v; set("sk_vibrate", v); },
    get opts() { return st.opts; }, setOpts(v) { st.opts = v; set("sk_opts", v); },
  };
})();
