window.Storage = (() => {
  const get = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const st = { name: get("pt_name", ""), sound: get("pt_sound", true), lang: get("pt_lang", null), noAds: get("pt_noads", false), noAdsUntil: get("pt_noads_until", 0), device: get("pt_device", null), coins: get("pt_coins", 0), games: get("pt_games", 0) };
  if (!st.device) { st.device = crypto.randomUUID ? crypto.randomUUID() : "d-" + Math.random().toString(36).slice(2) + Date.now(); set("pt_device", st.device); }
  try { const an = localStorage.getItem("arcade_name"); if (an && localStorage.getItem("arcade_name_used_dd") !== an) { st.name = an.slice(0, 12); set("pt_name", st.name); localStorage.setItem("arcade_name_used_dd", an); } } catch {}
  return {
    get name() { return st.name; }, setName(v) { st.name = v; set("pt_name", v); },
    get sound() { return st.sound; }, setSound(v) { st.sound = v; set("pt_sound", v); },
    get lang() { return st.lang; }, setLang(v) { st.lang = v; set("pt_lang", v); },
    get noAds() { return !!st.noAds || st.noAdsUntil > Date.now(); }, setNoAds(v) { st.noAds = v; set("pt_noads", v); },
    get noAdsUntil() { return st.noAdsUntil; }, setNoAdsUntil(t) { st.noAdsUntil = t || 0; set("pt_noads_until", st.noAdsUntil); },
    get device() { return st.device; }, get coins() { return st.coins; }, addCoins(n) { st.coins += n; set("pt_coins", st.coins); },
    get games() { return st.games; }, addGame() { st.games++; set("pt_games", st.games); },
  };
})();
