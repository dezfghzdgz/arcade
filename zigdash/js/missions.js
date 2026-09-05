// Denní úkoly (3 za den, generované ze dne, takže má každý hráč stejné) + denní bonus za sérii dnů.
// Hra hlásí události přes Missions.event(type, value); splnění rovnou připíše gemy.
window.Missions = (() => {
  const today = () => new Date().toISOString().slice(0, 10);
  const yesterday = () => new Date(Date.now() - 864e5).toISOString().slice(0, 10);

  // typ: jak se počítá (max = nejlepší v jednom běhu, add = sčítá se přes den)
  const TYPES = {
    score:  { mode: "max", targets: [30, 60, 100, 160],  rewards: [40, 70, 110, 160] },
    combo:  { mode: "max", targets: [8, 12, 18, 25],     rewards: [40, 60, 90, 140] },
    gems:   { mode: "add", targets: [15, 30, 50, 80],    rewards: [40, 60, 90, 130] },
    near:   { mode: "add", targets: [5, 10, 20, 35],     rewards: [40, 60, 100, 150] },
    bounce: { mode: "add", targets: [60, 120, 250, 400], rewards: [30, 50, 80, 120] },
    runs:   { mode: "add", targets: [3, 5, 10, 15],      rewards: [30, 50, 80, 110] },
    fever:  { mode: "add", targets: [1, 2, 4, 6],        rewards: [50, 80, 120, 160] },
  };

  // deterministický generátor ze dne
  function seeded(str) { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; }; }

  let state = Storage.missions || { date: "", list: [] };

  function ensureToday() {
    if (state.date === today() && state.list.length === 3) return;
    const r = seeded(today() + "zigdash");
    const keys = Object.keys(TYPES).sort(() => r() - 0.5).slice(0, 3);
    state = { date: today(), list: keys.map(type => { const i = Math.floor(r() * 4); return { type, target: TYPES[type].targets[i], reward: TYPES[type].rewards[i], progress: 0, claimed: false }; }) };
    save();
  }
  function save() { Storage.setMissions(state); }

  const listeners = [];
  function event(type, value = 1) {
    ensureToday();
    let done = [];
    for (const m of state.list) {
      if (m.type !== type || m.claimed) continue;
      m.progress = TYPES[type].mode === "max" ? Math.max(m.progress, value) : m.progress + value;
      if (m.progress >= m.target) { m.claimed = true; m.progress = m.target; Storage.addCoins(m.reward); done.push(m); }
    }
    if (done.length || type) save();
    for (const m of done) listeners.forEach(fn => fn(m));
  }

  function list() { ensureToday(); return state.list; }
  function allDone() { return list().every(m => m.claimed); }

  // denní bonus – vrací {reward, streak} když se dnes ještě nevybral, jinak null
  function dailyBonus() {
    const d = Storage.daily || { last: "", streak: 0 };
    if (d.last === today()) return null;
    const streak = d.last === yesterday() ? d.streak + 1 : 1;
    const reward = 20 + 15 * Math.min(streak - 1, 6);
    Storage.setDaily({ last: today(), streak });
    Storage.addCoins(reward);
    return { reward, streak };
  }

  return { event, list, allDone, dailyBonus, onComplete: (fn) => listeners.push(fn), TYPES };
})();
