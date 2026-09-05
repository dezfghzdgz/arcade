// Lokální uložení. Na nativní appce zůstává localStorage zachovaný mezi spuštěními.
window.Storage = (() => {
  const K = {
    best: "zd_best", coins: "zd_coins", skin: "zd_skin", owned: "zd_owned",
    noAds: "zd_noads", name: "zd_name", device: "zd_device", sound: "zd_sound",
    bg: "zd_bg", bgOwned: "zd_bg_owned", lang: "zd_lang", music: "zd_music",
    vibrate: "zd_vibrate", missions: "zd_missions", daily: "zd_daily", noAdsUntil: "zd_noads_until",
  };
  const get = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

  const state = {
    best: get(K.best, 0),
    coins: get(K.coins, 0),
    skin: get(K.skin, "amber"),
    owned: get(K.owned, ["amber"]),
    noAds: get(K.noAds, false),
    name: get(K.name, ""),
    device: get(K.device, null),
    sound: get(K.sound, true),
    music: get(K.music, true),
    lang: get(K.lang, null),
    vibrate: get(K.vibrate, true),
    missions: get(K.missions, null),
    daily: get(K.daily, null),
    noAdsUntil: get(K.noAdsUntil, 0),
  };
  if (!state.device) {
    state.device = (crypto.randomUUID ? crypto.randomUUID() : "d-" + Math.random().toString(36).slice(2) + Date.now());
    set(K.device, state.device);
  }

  // Generická kosmetika: kind = skin | shape | aura | fx | bg
  const KIND_KEYS = {
    skin: [K.skin, K.owned], bg: [K.bg, K.bgOwned],
    shape: ["zd_shape", "zd_shape_owned"], aura: ["zd_aura", "zd_aura_owned"], fx: ["zd_fx", "zd_fx_owned"],
  };
  const DEFAULTS = { skin: "amber", bg: "night", shape: "circle", aura: "tail", fx: "basic" };
  const cos = {};
  for (const k of Object.keys(KIND_KEYS)) {
    cos[k] = { active: get(KIND_KEYS[k][0], DEFAULTS[k]), owned: get(KIND_KEYS[k][1], [DEFAULTS[k]]) };
  }

  return {
    active(kind) { return cos[kind].active; },
    setActive(kind, id) { cos[kind].active = id; set(KIND_KEYS[kind][0], id); },
    ownedOf(kind) { return cos[kind].owned; },
    ownItem(kind, id) { if (!cos[kind].owned.includes(id)) { cos[kind].owned.push(id); set(KIND_KEYS[kind][1], cos[kind].owned); } },

    get best() { return state.best; },
    setBest(v) { state.best = v; set(K.best, v); },
    get coins() { return state.coins; },
    addCoins(n) { state.coins = Math.max(0, state.coins + n); set(K.coins, state.coins); },
    get skin() { return cos.skin.active; },
    setSkin(id) { this.setActive("skin", id); },
    get owned() { return cos.skin.owned; },
    own(id) { this.ownItem("skin", id); },
    // Bez reklam = doživotní nákup (starý flag) NEBO aktivní předplatné do noAdsUntil
    get noAds() { return !!state.noAds || state.noAdsUntil > Date.now(); },
    setNoAds(v) { state.noAds = v; set(K.noAds, v); },
    get noAdsUntil() { return state.noAdsUntil; },
    setNoAdsUntil(ts) { state.noAdsUntil = ts || 0; set(K.noAdsUntil, state.noAdsUntil); },
    get name() { return state.name; },
    setName(v) { state.name = v; set(K.name, v); },
    get device() { return state.device; },
    get sound() { return state.sound; },
    setSound(v) { state.sound = v; set(K.sound, v); },
    get music() { return state.music; },
    setMusic(v) { state.music = v; set(K.music, v); },
    get lang() { return state.lang; },
    setLang(v) { state.lang = v; set(K.lang, v); },
    get vibrate() { return state.vibrate; },
    setVibrate(v) { state.vibrate = v; set(K.vibrate, v); },
    get missions() { return state.missions; },
    setMissions(v) { state.missions = v; set(K.missions, v); },
    get daily() { return state.daily; },
    setDaily(v) { state.daily = v; set(K.daily, v); },
    get bg() { return cos.bg.active; },
    setBg(id) { this.setActive("bg", id); },
    get bgOwned() { return cos.bg.owned; },
    ownBg(id) { this.ownItem("bg", id); },
  };
})();
