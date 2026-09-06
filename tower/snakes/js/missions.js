// Denní (3) a týdenní (3) úkoly za mince. Generované z data / týdne, stejné pro všechny hráče.
window.Missions = (() => {
  const today = () => new Date().toISOString().slice(0, 10);
  const yesterday = () => new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  const week = () => { const d = new Date(); const onejan = new Date(d.getFullYear(), 0, 1); return d.getFullYear() + "-W" + Math.ceil(((d - onejan) / 864e5 + onejan.getDay() + 1) / 7); };

  // mode: max = nejlepší v jedné hře, add = sčítá se
  const TYPES = {
    games:    { mode: "add", d: [[2, 30], [3, 40], [5, 60]],       w: [[10, 120], [15, 180], [25, 300]] },
    wins:     { mode: "add", d: [[1, 60], [2, 100]],               w: [[3, 200], [5, 320]] },
    paint:    { mode: "max", d: [[12, 40], [18, 70], [25, 120]],   w: [[30, 250], [35, 350]] },
    kos:      { mode: "add", d: [[3, 40], [6, 60], [10, 100]],     w: [[25, 200], [50, 350]] },
    dashes:   { mode: "add", d: [[20, 30], [40, 50], [80, 90]],    w: [[200, 150], [400, 260]] },
    powerups: { mode: "add", d: [[5, 40], [10, 60], [20, 100]],    w: [[40, 200], [80, 320]] },
    captures: { mode: "add", d: [[3, 50], [6, 80]],                w: [[20, 220], [40, 350]] },
    top3:     { mode: "add", d: [[2, 50], [3, 70]],                w: [[8, 200], [15, 320]] },
  };
  function seeded(str) { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; }; }

  let st = Storage.missions || { day: "", daily: [], wk: "", weekly: [] };
  const save = () => Storage.setMissions(st);

  function gen(seedStr, tier) {
    const r = seeded(seedStr + "snakes");
    const keys = Object.keys(TYPES).sort(() => r() - 0.5).slice(0, 3);
    return keys.map(type => { const opts = TYPES[type][tier]; const [target, reward] = opts[Math.floor(r() * opts.length)]; return { type, target, reward, progress: 0, claimed: false }; });
  }
  function ensure() {
    let changed = false;
    if (st.day !== today() || st.daily.length !== 3) { st.day = today(); st.daily = gen(today(), "d"); changed = true; }
    if (st.wk !== week() || st.weekly.length !== 3) { st.wk = week(); st.weekly = gen(week(), "w"); changed = true; }
    if (changed) save();
  }

  const listeners = [];
  function event(type, value = 1) {
    ensure();
    const done = [];
    for (const m of [...st.daily, ...st.weekly]) {
      if (m.type !== type || m.claimed) continue;
      m.progress = TYPES[type].mode === "max" ? Math.max(m.progress, value) : m.progress + value;
      if (m.progress >= m.target) { m.claimed = true; m.progress = m.target; Storage.addCoins(m.reward); done.push(m); }
    }
    save();
    done.forEach(m => listeners.forEach(fn => fn(m)));
  }
  // po hře: souhrn z výsledku
  function afterGame(res, stats) {
    event("games", 1);
    if (res.win) event("wins", 1);
    if (res.rank <= 3) event("top3", 1);
    event("paint", res.pct);
    if (stats.kos) event("kos", stats.kos);
    if (stats.dashes) event("dashes", stats.dashes);
    if (stats.powerups) event("powerups", stats.powerups);
    if (stats.captures) event("captures", stats.captures);
  }
  function daily() { ensure(); return st.daily; }
  function weekly() { ensure(); return st.weekly; }
  function left() { return [...daily(), ...weekly()].filter(m => !m.claimed).length; }
  function dailyBonus() {
    const d = Storage.daily || { last: "", streak: 0 };
    if (d.last === today()) return null;
    const streak = d.last === yesterday() ? d.streak + 1 : 1;
    const reward = 20 + 15 * Math.min(streak - 1, 6);
    Storage.setDaily({ last: today(), streak }); Storage.addCoins(reward);
    return { reward, streak };
  }
  return { event, afterGame, daily, weekly, left, dailyBonus, onComplete: (fn) => listeners.push(fn) };
})();
