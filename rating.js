// Arcade Meta (dřív rating.js – název zůstává, aby ho hry nemusely měnit).
// XP, level, mince, streak, denní mise, skiny. Vše počítá server (SETUP5.sql), sem chodí jen události.
// API pro hry:  Rating.add(game, points)  (staré, dál funguje)  |  Meta.finish(game) | Meta.win(game) | Meta.score(game, 0–40) | Meta.heartbeat(game) pro cizí hry
// Skiny:        Meta.skin("ball") -> {id, color, glow} | Meta.skin("name") -> css barva | Meta.state (cache)
window.Meta = (() => {
  const CFG = { url: "https://ofozkelnipwozpukbdfg.supabase.co", key: "sb_publishable_o8I4CvJRiM3IeXUI2V24cQ_wEUoYKt4" };
  const CS = document.documentElement.lang === "cs" || (localStorage.getItem("arcade_lang") || "").includes("cs");
  function session() { try { const raw = localStorage.getItem("sb-ofozkelnipwozpukbdfg-auth-token"); if (!raw) return null; const j = JSON.parse(raw); if (!j.access_token || (j.expires_at && j.expires_at * 1000 < Date.now())) return null; return j; } catch { return null; } }
  const hdr = (s) => ({ "Content-Type": "application/json", apikey: CFG.key, Authorization: "Bearer " + s.access_token });
  async function rpc(name, body) { const s = session(); if (!s) return null; try { const r = await fetch(CFG.url + "/rest/v1/rpc/" + name, { method: "POST", headers: hdr(s), body: JSON.stringify(body || {}) }); if (!r.ok) return null; return await r.json(); } catch { return null; } }

  // ---------- skiny (fungují i offline z cache)
  const SHOP = {
    ball_neon:   { slot: "ball", name: { en: "Neon ball", cs: "Neonová kulička" }, color: "#5EE1D0", glow: "#5EE1D0" },
    ball_lava:   { slot: "ball", name: { en: "Lava ball", cs: "Lávová kulička" }, color: "#FF5E7E", glow: "#FF9A3C" },
    ball_galaxy: { slot: "ball", name: { en: "Galaxy ball", cs: "Galaktická kulička" }, color: "#8A5CFF", glow: "#6FC3FF" },
    ball_gold:   { slot: "ball", name: { en: "Gold ball (Pass)", cs: "Zlatá kulička (Pass)" }, color: "#FFCF5A", glow: "#FFE9A3" },
    name_aqua:   { slot: "name", name: { en: "Aqua name", cs: "Tyrkysové jméno" }, color: "#5EE1D0" },
    name_coral:  { slot: "name", name: { en: "Coral name", cs: "Korálové jméno" }, color: "#FF5E7E" },
    name_gold:   { slot: "name", name: { en: "Gold name", cs: "Zlaté jméno" }, color: "#FFCF5A" },
    name_rainbow:{ slot: "name", name: { en: "Rainbow name (Pass)", cs: "Duhové jméno (Pass)" }, color: "linear-gradient(90deg,#FF5E7E,#FFCF5A,#B6FF5A,#5EE1D0,#8A5CFF)" },
    trail_sparkle:{ slot: "trail", name: { en: "Sparkle trail", cs: "Jiskřivá stopa" }, color: "#fff" },
    trail_fire:  { slot: "trail", name: { en: "Fire trail", cs: "Ohnivá stopa" }, color: "#FF9A3C" },
    badge_star:  { slot: "badge", name: { en: "Star badge", cs: "Odznak hvězda" }, icon: "★" },
    badge_crown: { slot: "badge", name: { en: "Crown badge", cs: "Odznak koruna" }, icon: "👑" },
  };
  let state = null; try { state = JSON.parse(localStorage.getItem("arcade_meta") || "null"); } catch {}
  function save(st) { state = st; try { localStorage.setItem("arcade_meta", JSON.stringify(st)); } catch {} document.dispatchEvent(new CustomEvent("arcade-meta", { detail: st })); }
  const skin = (slot) => { const id = state && state.equipped && state.equipped[slot]; return id && SHOP[id] ? Object.assign({ id }, SHOP[id]) : null; };
  const levelOf = (xp) => Math.max(1, Math.floor((Math.sqrt(1 + 8 * xp / 100) - 1) / 2) + 1);
  const xpForLevel = (lv) => 100 * (lv - 1) * lv / 2;            // XP potřebné na dosažení levelu lv
  const TIERS = [[0, "Bronze"], [300, "Silver"], [1000, "Gold"], [2500, "Platinum"], [6000, "Diamond"], [15000, "Elite"]];
  const tier = (xp) => { let t = TIERS[0]; for (const x of TIERS) if (xp >= x[0]) t = x; return t[1]; };

  // ---------- události
  async function event(game, kind, value) {
    const r = await rpc("award", { p_game: game, p_kind: kind, p_value: Math.round(value || 0) });
    if (!r) { if (!session()) nudge(); return null; }
    const before = state; save(Object.assign({}, state || {}, { xp: r.xp, coins: r.coins, level: r.level, streak: r.streak, missions: r.missions || (state && state.missions) }));
    if (r.gained_xp > 0 || r.gained_coins > 0) toast(r, before); return r;
  }
  const finish = (game) => event(game, "finish", 0);
  const win = (game) => event(game, "win", 0);
  const score = (game, pts) => event(game, "score", pts);
  // cizí (embed) hry: každých 60 s aktivního času pošli 60 s; server dá 1 XP / 30 s, max 10 min denně na hru
  let hb = null; function heartbeat(game) { stopHeartbeat(); let acc = 0, last = Date.now(); hb = setInterval(() => { if (document.hidden) { last = Date.now(); return; } acc += (Date.now() - last) / 1000; last = Date.now(); if (acc >= 60) { event(game, "time", Math.round(acc)); acc = 0; } }, 5000); }
  function stopHeartbeat() { if (hb) clearInterval(hb); hb = null; }

  // ---------- UI: toast s XP + level-up, výzva k přihlášení (jen 1× za den)
  const T = { xp: "XP", lvUp: CS ? "LEVEL UP!" : "LEVEL UP!", mission: CS ? "Mise splněna" : "Mission done", login: CS ? "Přihlas se a sbírej XP, mince a denní mise ze všech her" : "Sign in to earn XP, coins and daily missions in every game", signin: CS ? "Přihlásit" : "Sign in", streak: CS ? "den v řadě" : "day streak" };
  function toast(r, before) {
    try {
      const el = document.createElement("div"); const lvUp = before && before.level && r.level > before.level; const done = (r.missions || []).some(m => m.done && !m.claimed);
      el.innerHTML = `<div style="display:flex;gap:10px;align-items:center"><b style="font-size:16px">+${r.gained_xp} XP</b>${r.gained_coins ? `<span>🪙 +${r.gained_coins}</span>` : ""}${r.streak > 1 ? `<span>🔥 ${r.streak}</span>` : ""}</div>${lvUp ? `<div style="color:#FFCF5A;font-size:15px">⬆ ${T.lvUp} ${r.level}</div>` : ""}${done ? `<div style="color:#5EE1D0">✓ ${T.mission} – ${CS ? "vyzvedni na Arcade" : "claim on Arcade"}</div>` : ""}`;
      el.style.cssText = "position:fixed;right:12px;top:12px;z-index:99999;background:#24124A;color:#fff;font:800 13px Nunito,system-ui,sans-serif;padding:10px 14px;border-radius:14px;box-shadow:0 6px 18px rgba(0,0,0,.45);border:2px solid rgba(255,255,255,.15);animation:arcMetaIn .3s ease";
      if (!document.getElementById("arc-meta-css")) { const st = document.createElement("style"); st.id = "arc-meta-css"; st.textContent = "@keyframes arcMetaIn{from{transform:translateY(-20px);opacity:0}to{transform:none;opacity:1}}"; document.head.appendChild(st); }
      document.body.appendChild(el); setTimeout(() => el.remove(), lvUp ? 5000 : 3200);
    } catch {}
  }
  function nudge() { try { const k = "arcade_nudge_" + new Date().toISOString().slice(0, 10); if (localStorage.getItem(k)) return; localStorage.setItem(k, "1"); const el = document.createElement("div"); el.innerHTML = `<span>${T.login}</span> <a href="${location.pathname.includes("/guest/") ? "../../" : "../"}" style="color:#FFCF5A;font-weight:900;margin-left:8px">${T.signin} →</a>`; el.style.cssText = "position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:99999;background:#24124A;color:#fff;font:800 13px Nunito,system-ui,sans-serif;padding:10px 16px;border-radius:999px;box-shadow:0 6px 18px rgba(0,0,0,.45);max-width:92vw;text-align:center"; document.body.appendChild(el); setTimeout(() => el.remove(), 8000); } catch {} }

  async function refresh() { const r = await rpc("my_state"); if (r) save(r); return r; }
  if (session()) refresh();
  return { event, finish, win, score, heartbeat, stopHeartbeat, refresh, rpc, skin, SHOP, levelOf, xpForLevel, tier, TIERS, get state() { return state; }, get loggedIn() { return !!session(); } };
})();
// zpětná kompatibilita: staré volání Rating.add(game, body) -> skóre event
window.Rating = { add: (game, pts) => Meta.score(game, Math.min(40, Math.max(5, Math.round(pts || 5)))), tier: Meta.tier, TIERS: Meta.TIERS, get loggedIn() { return Meta.loggedIn; } };
