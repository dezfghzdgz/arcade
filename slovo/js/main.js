(() => {
  const { $, get, set, L, beep } = Arc;
  Arc.texts({
    en: { daily: "Daily", free: "Practice", wordWas: "The word was", played: "Played", winPct: "Win %", streakL: "Streak", bestStreak: "Best", share: "Share", practiceMore: "Practice word", notWord: "Not in word list", short: "Not enough letters", copied: "Copied!", win: ["Genius!", "Magnificent!", "Impressive!", "Splendid!", "Great!", "Phew!"], lose: "So close!", subDaily: (n) => `Daily word #${n} · same for everyone`, subFree: "Practice – unlimited words", next: (t) => `Next daily word in ${t}`, enter: "ENTER", langNote: "Word language follows the game language." },
    cs: { daily: "Denní", free: "Trénink", wordWas: "Hledané slovo", played: "Odehráno", winPct: "Výhry %", streakL: "Série", bestStreak: "Nejlepší", share: "Sdílet", practiceMore: "Trénovat dál", notWord: "Tohle slovo neznám", short: "Málo písmen", copied: "Zkopírováno!", win: ["Génius!", "Úžasné!", "Skvělé!", "Parádní!", "Dobře ty!", "Uff, tak tak!"], lose: "Tak příště!", subDaily: (n) => `Denní slovo č. ${n} · stejné pro všechny`, subFree: "Trénink – neomezeně slov", next: (t) => `Další denní slovo za ${t}`, enter: "ENTER", langNote: "Jazyk slov se řídí jazykem hry." },
  });
  const norm = (w) => w.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const W = () => SLOVO_WORDS[Arc.lang === "cs" ? "cs" : "en"];
  const okSet = {}; const isOk = (w) => { const l = Arc.lang === "cs" ? "cs" : "en"; if (!okSet[l]) { const s = new Set(), t = SLOVO_WORDS[l].OK; for (let i = 0; i < t.length; i += 5) s.add(t.slice(i, i + 5)); SLOVO_WORDS[l].ANS.forEach(a => s.add(norm(a))); okSet[l] = s; } return okSet[l].has(w); };
  const EPOCH = Date.UTC(2026, 0, 1);
  const dayNo = () => { const d = new Date(); return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - EPOCH) / 864e5) + 1; };
  const KEYS = ["qwertzuiop", "asdfghjkl", "yxcvbnm"];
  let mode = "daily", answer = "", rows = [], cur = "", done = false, busy = false;
  const statKey = () => "slovo_stats_" + (Arc.lang === "cs" ? "cs" : "en");
  const stats = () => get(statKey(), { p: 0, w: 0, s: 0, b: 0, d: [0, 0, 0, 0, 0, 0], last: 0 });

  function start(m) {
    mode = m; $("m-daily").classList.toggle("active", m === "daily"); $("m-free").classList.toggle("active", m === "free");
    const ans = W().ANS; done = false; cur = ""; rows = [];
    if (m === "daily") { const n = dayNo(); answer = ans[((n - 1) % ans.length + ans.length) % ans.length]; $("sub").textContent = L("subDaily", n);
      const sv = get("slovo_day_" + (Arc.lang === "cs" ? "cs" : "en"), null); if (sv && sv.n === n) { rows = sv.rows; done = sv.done; } }
    else { answer = ans[Math.floor(Math.random() * ans.length)]; $("sub").textContent = L("subFree"); }
    render(); if (done) setTimeout(() => showOver(rows[rows.length - 1] === norm(answer)), 300);
  }
  function score(g) { const a = norm(answer).split(""), res = Array(5).fill("x"), left = {};
    for (let i = 0; i < 5; i++) if (g[i] === a[i]) res[i] = "g"; else left[a[i]] = (left[a[i]] || 0) + 1;
    for (let i = 0; i < 5; i++) if (res[i] !== "g" && left[g[i]]) { res[i] = "y"; left[g[i]]--; } return res; }
  function render() {
    const grid = $("grid"); grid.innerHTML = "";
    for (let r = 0; r < 6; r++) { const row = document.createElement("div"); row.className = "grow";
      const word = r < rows.length ? rows[r] : r === rows.length ? cur : "", res = r < rows.length ? score(rows[r]) : null;
      for (let c = 0; c < 5; c++) { const s = document.createElement("div"); s.className = "sq" + (word[c] ? " f" : "") + (res ? " " + res[c] : ""); s.textContent = word[c] || ""; row.appendChild(s); }
      grid.appendChild(row); }
    renderKb();
  }
  function renderKb() {
    const st = {}; rows.forEach(w => score(w).forEach((r, i) => { const k = w[i], rank = { g: 3, y: 2, x: 1 }; if (!st[k] || rank[r] > rank[st[k]]) st[k] = r; }));
    const kb = $("kb"); kb.innerHTML = "";
    KEYS.forEach((line, li) => { const r = document.createElement("div"); r.className = "kr";
      if (li === 2) r.appendChild(key(L("enter"), "enter", "wide"));
      for (const ch of line) r.appendChild(key(ch, ch, st[ch] || ""));
      if (li === 2) r.appendChild(key("⌫", "back", "wide"));
      kb.appendChild(r); });
  }
  function key(label, v, cls) { const b = document.createElement("button"); b.className = "k " + cls; b.textContent = label; b.onpointerdown = (e) => { e.preventDefault(); press(v); }; return b; }
  function toast(t) { const d = document.createElement("div"); d.className = "toast"; d.textContent = t; $("stage").appendChild(d); setTimeout(() => d.remove(), 1400); }
  function press(v) {
    if (done || busy) return;
    if (v === "back") { cur = cur.slice(0, -1); return render(); }
    if (v === "enter") return submitRow();
    if (/^[a-z]$/.test(v) && cur.length < 5) { cur += v; beep(600, 0.02, "sine", 0.03); render(); }
  }
  function submitRow() {
    const rowEl = $("grid").children[rows.length];
    if (cur.length < 5 || !isOk(cur)) { toast(L(cur.length < 5 ? "short" : "notWord")); rowEl.classList.remove("shake"); void rowEl.offsetWidth; rowEl.classList.add("shake"); beep(180, 0.12, "square", 0.04); return; }
    const res = score(cur); rows.push(cur); cur = ""; busy = true;
    // otočení dlaždic postupně
    [...rowEl.children].forEach((s, i) => setTimeout(() => { s.classList.add("flip"); setTimeout(() => { s.classList.add(res[i]); beep(res[i] === "g" ? 880 : res[i] === "y" ? 660 : 330, 0.05, "sine", 0.04); }, 250); }, i * 260));
    setTimeout(() => { busy = false; const won = res.every(r => r === "g"); if (won || rows.length === 6) finish(won); else render(); saveDay(); }, 5 * 260 + 300);
  }
  function saveDay() { if (mode === "daily") set("slovo_day_" + (Arc.lang === "cs" ? "cs" : "en"), { n: dayNo(), rows, done }); }
  function finish(won) {
    done = true; renderKb(); saveDay();
    if (won) { const row = $("grid").children[rows.length - 1]; [...row.children].forEach((s, i) => { s.style.animationDelay = i * 90 + "ms"; s.classList.add("win"); }); beep(1046, 0.25); }
    const st = stats(); st.p++; if (won) { st.w++; st.d[rows.length - 1]++; }
    if (mode === "daily") { const n = dayNo(); st.s = won ? (st.last === n - 1 ? st.s + 1 : 1) : 0; st.last = won ? n : st.last; st.b = Math.max(st.b, st.s); }
    set(statKey(), st);
    const xp = won ? (mode === "daily" ? 20 + (6 - rows.length) * 4 : 6 + (6 - rows.length)) : 3;
    Arc.submit("slovo", won ? (7 - rows.length) * 100 + (mode === "daily" ? 50 : 0) : 0, xp);
    if (window.Meta && won) Meta.win && Meta.win("slovo");
    setTimeout(() => showOver(won), won ? 1300 : 600);
  }
  function showOver(won) {
    const st = stats(); $("over").classList.remove("hidden");
    $("o-t").textContent = won ? L("win")[rows.length - 1] : L("lose"); $("o-word").textContent = answer;
    $("s-p").textContent = st.p; $("s-w").textContent = st.p ? Math.round(100 * st.w / st.p) : 0; $("s-s").textContent = st.s; $("s-b").textContent = st.b;
    const mx = Math.max(1, ...st.d); $("dist").innerHTML = st.d.map((v, i) => `<div>${i + 1}<i class="${won && done && rows.length === i + 1 ? "cur" : ""}" style="width:${Math.max(8, 100 * v / mx)}%">${v}</i></div>`).join("");
    if (mode === "daily") { const t = new Date(); t.setHours(24, 0, 0, 0); const s = (t - Date.now()) / 1000; $("o-next").textContent = L("next", `${Math.floor(s / 3600)} h ${Math.floor(s % 3600 / 60)} min`); } else $("o-next").textContent = "";
    $("btn-share").classList.toggle("hidden", mode !== "daily");
  }
  function shareText() { const won = rows[rows.length - 1] === norm(answer); return `Slovo ${Arc.lang === "cs" ? "CZ" : "EN"} #${dayNo()} ${won ? rows.length : "X"}/6\n\n` + rows.map(w => score(w).map(r => r === "g" ? "🟩" : r === "y" ? "🟨" : "⬛").join("")).join("\n") + `\n\n${location.origin}${location.pathname}`; }
  $("btn-share").onclick = async () => { const t = shareText(); try { if (navigator.share) await navigator.share({ text: t }); else { await navigator.clipboard.writeText(t); toast(L("copied")); } } catch { try { await navigator.clipboard.writeText(t); toast(L("copied")); } catch {} } };
  $("btn-again").onclick = () => { $("over").classList.add("hidden"); start("free"); };
  $("btn-close").onclick = () => $("over").classList.add("hidden");
  $("btn-stats").onclick = () => showOver(done && rows[rows.length - 1] === norm(answer));
  $("m-daily").onclick = () => start("daily"); $("m-free").onclick = () => start("free");
  document.addEventListener("keydown", (e) => { if (e.ctrlKey || e.metaKey || e.altKey) return; if (e.key === "Enter") press("enter"); else if (e.key === "Backspace") press("back"); else { const k = norm(e.key); if (/^[a-z]$/.test(k)) press(k); } });
  Arc.wire(); Arc.applyLang();
  $("btn-lang").addEventListener("click", () => setTimeout(() => start(mode), 0));
  start("daily");
  window.__slovo = { get answer() { return answer; }, press, get rows() { return rows; } };
})();
