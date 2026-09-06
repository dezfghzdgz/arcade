window.Arc = (() => {
  const CFG = { supabaseUrl: "https://ofozkelnipwozpukbdfg.supabase.co", supabaseAnonKey: "sb_publishable_o8I4CvJRiM3IeXUI2V24cQ_wEUoYKt4" };
  const $ = (id) => document.getElementById(id);
  const get = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  let lang = get("arc_lang", null) || "en", sound = get("arc_sound", true), name = get("arc_name", "");
  try { const an = localStorage.getItem("arcade_name"); if (an) name = an.slice(0, 12); } catch {}
  let device = get("arc_device", null); if (!device) { device = crypto.randomUUID ? crypto.randomUUID() : "d" + Math.random().toString(36).slice(2); set("arc_device", device); }
  const COMMON = {
    en: { score: "Score", best: "Best", leaderboard: "Leaderboard", tryAgain: "Try again", close: "Close", yourName: "Your name", rank: (r) => `#${r} worldwide`, loading: "Loading…", empty: "Nobody yet – be the first.", offline: "Leaderboard isn't set up yet.", sound: "Sound", on: "on", off: "off", lang: "Čeština", saved: "Saved", newGame: "New game" },
    cs: { score: "Skóre", best: "Rekord", leaderboard: "Žebříček", tryAgain: "Znovu", close: "Zavřít", yourName: "Tvoje jméno", rank: (r) => `Celosvětově ${r}. místo`, loading: "Načítám…", empty: "Zatím nikdo – buď první.", offline: "Žebříček ještě není zapojený.", sound: "Zvuk", on: "zap", off: "vyp", lang: "English", saved: "Uloženo", newGame: "Nová hra" },
  };
  let T = COMMON;
  const L = (k, ...a) => { const v = (T[lang] && T[lang][k]) ?? T.en[k] ?? COMMON[lang][k] ?? COMMON.en[k]; return typeof v === "function" ? v(...a) : v; };
  function texts(extra) { T = { en: Object.assign({}, COMMON.en, extra.en), cs: Object.assign({}, COMMON.cs, extra.cs) }; }
  function applyLang() { document.documentElement.lang = lang; document.querySelectorAll("[data-i18n]").forEach(el => el.textContent = L(el.dataset.i18n)); document.querySelectorAll("[data-i18n-ph]").forEach(el => el.placeholder = L(el.dataset.i18nPh)); if ($("btn-sound")) $("btn-sound").textContent = L("sound") + ": " + L(sound ? "on" : "off"); if ($("btn-lang")) $("btn-lang").textContent = L("lang"); }
  let actx; function beep(f, dur = 0.12, type = "triangle", vol = 0.08) { if (!sound) return; try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); const o = actx.createOscillator(), g = actx.createGain(); o.type = type; o.frequency.value = f; g.gain.value = vol; g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + dur); o.connect(g).connect(actx.destination); o.start(); o.stop(actx.currentTime + dur + 0.01); } catch {} }
  const hdr = () => ({ "Content-Type": "application/json", apikey: CFG.supabaseAnonKey, Authorization: "Bearer " + CFG.supabaseAnonKey });
  async function submit(game, score) { if (!CFG.supabaseUrl || score <= 0) return null; try { const r = await fetch(CFG.supabaseUrl + "/rest/v1/rpc/submit_score_game", { method: "POST", headers: hdr(), body: JSON.stringify({ p_game: game, p_device: device, p_name: (name || "Player").slice(0, 12), p_score: Math.round(score) }) }); return r.ok ? await r.json() : null; } catch { return null; } }
  async function openLb(game, fmt = (s) => s) {
    $("lb").classList.remove("hidden"); $("name-input").value = name; const list = $("lb-list"); list.innerHTML = ""; const st = $("lb-status");
    if (!CFG.supabaseUrl) { st.textContent = L("offline"); return; }
    st.textContent = L("loading");
    try { const r = await fetch(CFG.supabaseUrl + `/rest/v1/leaderboard_game?game=eq.${game}&select=rank,name,score,device_id&order=rank.asc&limit=50`, { headers: hdr() }); const rows = await r.json();
      st.textContent = rows.length ? "" : L("empty"); for (const x of rows) { const li = document.createElement("li"); if (x.device_id === device) li.className = "me"; li.innerHTML = `<span>${x.rank}.</span><span class="n"></span><b>${fmt(x.score)}</b>`; li.querySelector(".n").textContent = x.name; list.appendChild(li); } } catch { st.textContent = L("offline"); }
  }
  function wire() {
    if ($("lb-close")) $("lb-close").onclick = () => $("lb").classList.add("hidden");
    if ($("btn-name")) $("btn-name").onclick = () => { name = $("name-input").value.trim().slice(0, 12); set("arc_name", name); $("lb-status").textContent = L("saved"); };
    if ($("btn-lang")) $("btn-lang").onclick = () => { lang = lang === "en" ? "cs" : "en"; set("arc_lang", lang); applyLang(); };
    if ($("btn-sound")) $("btn-sound").onclick = () => { sound = !sound; set("arc_sound", sound); applyLang(); };
  }
  return { $, get, set, L, texts, applyLang, beep, submit, openLb, wire, get lang() { return lang; } };
})();
