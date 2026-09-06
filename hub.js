(() => {
  const $ = (id) => document.getElementById(id);
  const C = HUB_CONFIG;
  const T = {
    en: { sub: "Quick games. Solo or with friends over one link.", solo: "SOLO", friends: "WITH FRIENDS", community: "From the community", signIn: "Sign in", signUp: "Create account", signOut: "Sign out",
      submitGame: "Submit a game", mySubs: "My submissions", admin: "Review queue", kine: "Also by us:", kineDesc: "– videos, live, creators", lang: "Čeština",
      submitHelp: "Host your HTML5 game anywhere (Vercel, GitHub Pages, itch.io), paste the link. We play it, and if it fits, it appears on the Arcade with your name.",
      fTitle: "Title", fDesc: "One-line description", fUrl: "Play URL (https://…)", fIcon: "Icon URL (optional, square PNG)", fKind: "Type", fNote: "Note for reviewers (optional)", fName: "Display name", fPass: "Password", send: "Send for review",
      needLogin: "Sign in first.", sent: "Sent! We'll review it soon.", noSupabase: "Accounts aren't set up yet (see README).", toggleUp: "No account? Create one", toggleIn: "Have an account? Sign in",
      pending: "pending", approved: "approved", rejected: "rejected", approve: "Approve", reject: "Reject", by: (n) => `by ${n}`, empty: "Nothing here yet.",
      pass: "Arcade Pass", passDesc: (p) => `No ads in every game · ${p}/month`, passActive: (d) => `Arcade Pass active until ${d}`, getPass: "Get Arcade Pass", passNeedLogin: "Sign in to get the pass.",
      desktopBtn: "Download for PC (build guide)", installT: "Install Arcade", installD: "works offline – solo games need no wifi", installBtn: "Install app", offlineBtn: "Save games for offline", offlineDone: "Saved – solo games now work without internet", iosHint: "On iPhone: Share → Add to Home Screen", pcOnly: "PC ONLY", pcLocked: "Needs a mouse – open on a PC", addHint: "Send us your HTML5 game. If it fits, it shows up here with your name.", zigdash: "Tap, flip, dodge. One thumb, leaderboard, daily missions.", splatz: "Paint arena for up to 8. Share a code, fill the rest with bots. 5 modes.", tower: "Race up the tower. Jump, springs, gears, lava. First to the top wins.", front: "Territory strategy. Draw the map together, spawn, expand, conquer 60%.", boom: "Hot potato for up to 8 with 5 modes: classic, chaos, shrinking zone, teams, hunter.", fleet: "Naval battle for up to 8: steer, broadside, sink. Battle, fleets, king of the sea, treasure.", solitaire: "Klondike: draw 1 or 3, undo, auto-finish, daily deal with best-time leaderboard.", roll: "Roll the ball, paint every tile. Endless generated maze levels, undo, 3-star scoring.", tubes: "Pour colors until every tube is one color. Endless levels, undo, hints, extra tube.", flow: "Connect matching dots without crossing and fill the board. Relaxing puzzles 5×5 to 9×9.", snakes: "Multiplayer snake for up to 8: eat, grow, boost, make rivals crash. Arena, last one, teams.", doodle: "Write it, draw it, guess it – telephone game for 2–10 friends, then laugh at the albums.", merge: "Slide and merge numbers. Daily challenge, undo, global leaderboard.", snake: "The classic, faster with every apple. Wrap-around or walls mode, bonus stars.", mines: "Minesweeper with a daily board and best-time leaderboard. Hold to flag.", bricks: "Breakout with power-ups: multiball, laser, wide paddle, extra life. Endless levels.", sudoku: "Three difficulties, notes, hints, mistake check, daily puzzle with best-time leaderboard.", checkEmail: "Check your e-mail to confirm the account, then sign in." },
    cs: { sub: "Rychlé hry. Sólo nebo s kamarády přes jeden odkaz.", solo: "SÓLO", friends: "S KAMARÁDY", community: "Od komunity", signIn: "Přihlásit", signUp: "Založit účet", signOut: "Odhlásit",
      submitGame: "Poslat hru", mySubs: "Moje hry", admin: "Ke schválení", kine: "Také od nás:", kineDesc: "– videa, živě, tvůrci", lang: "English",
      submitHelp: "Svou HTML5 hru si hostuj kdekoliv (Vercel, GitHub Pages, itch.io) a vlož odkaz. Zahrajeme si ji, a když sedne, objeví se na Arcade s tvým jménem.",
      fTitle: "Název", fDesc: "Popis na jeden řádek", fUrl: "Odkaz na hru (https://…)", fIcon: "Odkaz na ikonu (nepovinné, čtvercové PNG)", fKind: "Typ", fNote: "Poznámka pro nás (nepovinné)", fName: "Zobrazované jméno", fPass: "Heslo", send: "Odeslat ke schválení",
      needLogin: "Nejdřív se přihlas.", sent: "Odesláno! Brzy se na to podíváme.", noSupabase: "Účty ještě nejsou zapojené (viz README).", toggleUp: "Nemáš účet? Založ si ho", toggleIn: "Máš účet? Přihlas se",
      pending: "čeká", approved: "schváleno", rejected: "zamítnuto", approve: "Schválit", reject: "Zamítnout", by: (n) => `od ${n}`, empty: "Zatím nic.",
      pass: "Arcade Pass", passDesc: (p) => `Bez reklam ve všech hrách · ${p}/měsíc`, passActive: (d) => `Arcade Pass aktivní do ${d}`, getPass: "Pořídit Arcade Pass", passNeedLogin: "Na pass se musíš přihlásit.",
      desktopBtn: "Stáhnout pro PC (návod)", installT: "Nainstaluj Arcade", installD: "funguje offline – sólo hry nepotřebují wifi", installBtn: "Nainstalovat", offlineBtn: "Uložit hry pro offline", offlineDone: "Uloženo – sólo hry teď jedou i bez internetu", iosHint: "Na iPhonu: Sdílet → Přidat na plochu", pcOnly: "JEN PC", pcLocked: "Potřebuje myš – otevři na počítači", addHint: "Pošli nám svou HTML5 hru. Když sedne, objeví se tady s tvým jménem.", zigdash: "Ťukni, otoč se, uhni. Jeden palec, žebříček, denní úkoly.", splatz: "Malovací aréna až pro 8. Pošli kód, zbytek doplní boti. 5 módů.", tower: "Závod nahoru věží. Skoky, pružiny, ozubená kola, láva.", front: "Strategie o území. Nakreslete mapu, naspawnujte se, dobyjte 60 %.", boom: "Horký brambor až pro 8 v 5 módech: klasika, chaos, zóna, týmy, lovec.", fleet: "Námořní bitva až pro 8: kormidlo, salva z boku, potopení. Bitva, flotily, král moří, poklad.", solitaire: "Klondike: po 1 nebo po 3, zpět, automatické dohrání, denní rozdání se žebříčkem časů.", roll: "Kulička jede, dokud nenarazí – obarvi všechna políčka. Nekonečné generované levely, zpět, hvězdičky.", tubes: "Přelévej barvy, dokud není každá zkumavka jednobarevná. Nekonečné levely, zpět, nápovědy, zkumavka navíc.", flow: "Spoj stejné tečky bez křížení a vyplň celé pole. Klidné hlavolamy 5×5 až 9×9.", snakes: "Multiplayer had až pro 8: jez, rosť, boostuj, nech soupeře nabourat. Aréna, poslední, týmy.", doodle: "Napiš, nakresli, uhodni – tichá pošta pro 2–10 kamarádů, na konci alba k popukání.", merge: "Posouvej a spojuj čísla. Denní výzva, zpět, globální žebříček.", snake: "Klasika, s každým jablkem rychlejší. Průchozí okraje nebo stěny, bonusové hvězdy.", mines: "Miny s denním polem a žebříčkem nejlepších časů. Podržením vlajka.", bricks: "Breakout s power-upy: multiball, laser, širší pálka, život navíc. Nekonečné levely.", sudoku: "Tři obtížnosti, poznámky, nápověda, kontrola chyb, denní sudoku se žebříčkem časů.", checkEmail: "Potvrď účet v e-mailu a pak se přihlas." },
  };
  let lang = localStorage.getItem("arcade_lang") || "en";
  const L = (k, ...a) => { const v = T[lang][k] ?? T.en[k] ?? k; return typeof v === "function" ? v(...a) : v; };
  const BUILTIN = [
    { slug: "zigdash", title: "ZigDash", kind: "solo", url: "zigdash/", icon: "zigdash/icon-192.png" },
    { slug: "splatz", title: "Splatz", kind: "friends", url: "splatz/", icon: "splatz/icon-192.png" },
    { slug: "tower", title: "Tower", kind: "friends", url: "tower/", icon: "tower/icon-192.png" },
    { slug: "front", title: "Front", kind: "friends", url: "front/", icon: "front/icon-192.png", pc: true },
    { slug: "doodle", title: "Doodle", kind: "friends", url: "doodle/", icon: "doodle/icon-192.png" },
    { slug: "boom", title: "Boom", kind: "friends", url: "boom/", icon: "boom/icon-192.png" },
    { slug: "fleet", title: "Fleet", kind: "friends", url: "fleet/", icon: "fleet/icon-192.png" },
    { slug: "snakes", title: "Snakes", kind: "friends", url: "snakes/", icon: "snakes/icon-192.png" },
    { slug: "merge", title: "Merge", kind: "solo", url: "merge/", icon: "merge/icon-192.png" },
    { slug: "snake", title: "Snake", kind: "solo", url: "snake/", icon: "snake/icon-192.png" },
    { slug: "mines", title: "Mines", kind: "solo", url: "mines/", icon: "mines/icon-192.png" },
    { slug: "bricks", title: "Bricks", kind: "solo", url: "bricks/", icon: "bricks/icon-192.png" },
    { slug: "sudoku", title: "Sudoku", kind: "solo", url: "sudoku/", icon: "sudoku/icon-192.png" },
    { slug: "solitaire", title: "Solitaire", kind: "solo", url: "solitaire/", icon: "solitaire/icon-192.png" },
    { slug: "roll", title: "Roll", kind: "solo", url: "roll/", icon: "roll/icon-192.png" },
    { slug: "tubes", title: "Tubes", kind: "solo", url: "tubes/", icon: "tubes/icon-192.png" },
    { slug: "flow", title: "Flow", kind: "solo", url: "flow/", icon: "flow/icon-192.png" },
  ];

  const sb = C.supabaseUrl && window.supabase ? supabase.createClient(C.supabaseUrl, C.supabaseAnonKey) : null;
  let user = null, profile = null;

  const toast = (m, ms = 2200) => { const el = $("toast"); el.textContent = m; el.classList.remove("hidden"); clearTimeout(el._t); el._t = setTimeout(() => el.classList.add("hidden"), ms); };
  function applyLang() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach(el => el.textContent = L(el.dataset.i18n));
    $("lang").textContent = L("lang");
    renderGames(); renderPass(); updateAuthUI();
  }
  $("lang").onclick = () => { lang = lang === "en" ? "cs" : "en"; localStorage.setItem("arcade_lang", lang); applyLang(); };
  $("kine-link").href = C.kineUrl;

  // ---------- stránky
  function showPage(id) { document.querySelectorAll(".page").forEach(p => p.classList.toggle("hidden", p.id !== "page-" + id)); $("user-drop").classList.add("hidden"); window.scrollTo(0, 0); if (id === "mine") loadMine(); if (id === "admin") loadAdmin(); }
  document.querySelectorAll("[data-page]").forEach(b => b.onclick = () => { if (b.dataset.page !== "home" && !user) { openAuth(); return; } showPage(b.dataset.page); });

  // ---------- hry
  function card(g, community) {
    const a = document.createElement("a"); a.className = "card " + (g.kind === "solo" ? "solo" : "friends"); a.href = g.url; if (community) { a.target = "_blank"; a.rel = "noopener"; }
    const img = g.icon || g.icon_url; 
    a.innerHTML = `${img ? `<img src="${img}" alt="" onerror="this.remove()" />` : ""}<span class="tag">${g.kind === "solo" ? L("solo") : L("friends")}</span>${g.pc ? `<span class="tag pcbadge">${L("pcOnly")}</span>` : ""}<h3></h3><p></p>${community ? `<small></small>` : ""}`;
    if (g.pc) { a.classList.add("pconly"); if (matchMedia("(pointer: coarse)").matches) { a.classList.add("locked"); a.dataset.lock = L("pcLocked"); a.removeAttribute("href"); } }
    a.querySelector("h3").textContent = g.title; a.querySelector("p").textContent = community ? g.description : L(g.slug);
    if (community) a.querySelector("small").textContent = L("by", g.author || "?");
    return a;
  }
  async function renderGames() {
    const grid = $("games"); grid.innerHTML = ""; BUILTIN.forEach(g => grid.appendChild(card(g, false)));
    const add = document.createElement("div"); add.className = "card add"; add.innerHTML = `<div class="plus">+</div><h3></h3><p></p>`; add.querySelector("h3").textContent = L("submitGame"); add.querySelector("p").textContent = L("addHint"); add.onclick = () => { if (!user) { openAuth(); return; } showPage("submit"); }; grid.appendChild(add);
    if (!sb) return;
    const { data } = await sb.from("games").select("*").order("created_at", { ascending: false });
    const cg = $("community"); cg.innerHTML = "";
    $("community-h").classList.toggle("hidden", !data || !data.length);
    (data || []).forEach(g => cg.appendChild(card(g, true)));
  }

  // ---------- auth
  let signup = false;
  function openAuth() { if (!sb) { toast(L("noSupabase"), 3000); return; } signup = false; renderAuth(); $("auth").classList.remove("hidden"); }
  function renderAuth() { $("auth-title").textContent = L(signup ? "signUp" : "signIn"); $("auth-submit").textContent = L(signup ? "signUp" : "signIn"); $("auth-toggle").textContent = L(signup ? "toggleIn" : "toggleUp"); $("auth-name-row").classList.toggle("hidden", !signup); $("auth-err").textContent = ""; }
  $("btn-signin").onclick = openAuth; $("auth-close").onclick = () => $("auth").classList.add("hidden"); $("auth-toggle").onclick = () => { signup = !signup; renderAuth(); };
  $("auth-form").onsubmit = async (e) => {
    e.preventDefault(); const f = new FormData(e.target); $("auth-err").textContent = "";
    const email = f.get("email"), password = f.get("password");
    const r = signup ? await sb.auth.signUp({ email, password, options: { data: { name: (f.get("name") || "").trim().slice(0, 20) || email.split("@")[0] } } }) : await sb.auth.signInWithPassword({ email, password });
    if (r.error) { $("auth-err").textContent = r.error.message; return; }
    if (signup && !r.data.session) { toast(L("checkEmail"), 5000); $("auth").classList.add("hidden"); return; }
    $("auth").classList.add("hidden");
  };
  $("btn-user").onclick = () => $("user-drop").classList.toggle("hidden");
  $("btn-signout").onclick = async () => { await sb.auth.signOut(); $("user-drop").classList.add("hidden"); showPage("home"); };
  async function setUser(u) {
    user = u; profile = null;
    if (u) { const { data } = await sb.from("profiles").select("*").eq("id", u.id).single(); profile = data; try { localStorage.setItem("arcade_name", (profile && profile.name) || u.user_metadata?.name || u.email.split("@")[0]); localStorage.setItem("arcade_uid", u.id); } catch {} }
    else { try { localStorage.removeItem("arcade_name"); localStorage.removeItem("arcade_uid"); } catch {} }
    updateAuthUI(); renderPass(); handlePaidReturn();
  }
  function updateAuthUI() {
    $("btn-signin").classList.toggle("hidden", !!user); $("user-menu").classList.toggle("hidden", !user);
    if (user) $("user-name").textContent = (profile && profile.name) || user.user_metadata?.name || user.email;
    $("btn-admin").classList.toggle("hidden", !(profile && profile.is_admin));
  }
  if (sb) { sb.auth.getSession().then(({ data }) => setUser(data.session?.user || null)); sb.auth.onAuthStateChange((_, s) => setUser(s?.user || null)); }

  // ---------- Arcade Pass
  const passActive = () => profile && profile.pass_until && new Date(profile.pass_until) > new Date();
  function renderPass() {
    const b = $("pass-banner"), btn = $("btn-pass");
    if (!sb || !C.stripePassLink) { b.classList.add("hidden"); btn.classList.add("hidden"); return; }
    btn.classList.remove("hidden"); btn.textContent = passActive() ? "★ " + L("pass") : L("pass");
    b.classList.remove("hidden");
    b.innerHTML = passActive() ? `<span>★ ${L("passActive", new Date(profile.pass_until).toLocaleDateString())}</span>` : `<span><b>${L("pass")}</b> · ${L("passDesc", C.passPrice)}</span><button class="pass" id="btn-get-pass">${L("getPass")}</button>`;
    const g = $("btn-get-pass"); if (g) g.onclick = buyPass;
    btn.onclick = buyPass;
  }
  function buyPass() {
    if (passActive()) return;
    if (!user) { toast(L("passNeedLogin")); openAuth(); return; }
    const u = new URL(C.stripePassLink); u.searchParams.set("client_reference_id", user.id); if (user.email) u.searchParams.set("prefilled_email", user.email);
    location.href = u.toString();
  }
  async function handlePaidReturn() {
    if (!new URLSearchParams(location.search).get("paid") || !user) return;
    history.replaceState(null, "", location.pathname);
    for (let i = 0; i < 6; i++) { const { data } = await sb.from("profiles").select("*").eq("id", user.id).single(); profile = data; if (passActive()) { renderPass(); toast("★ " + L("pass")); return; } await new Promise(r => setTimeout(r, 1500)); }
  }

  // ---------- odeslání hry
  $("submit-form").onsubmit = async (e) => {
    e.preventDefault(); if (!user) { openAuth(); return; }
    const f = new FormData(e.target);
    const { error } = await sb.from("submissions").insert({ user_id: user.id, title: f.get("title"), description: f.get("description"), url: f.get("url"), icon_url: f.get("icon_url") || null, kind: f.get("kind"), note: f.get("note") || null });
    if (error) { toast(error.message, 4000); return; }
    e.target.reset(); toast(L("sent"), 3000); showPage("mine");
  };
  async function loadMine() {
    const { data } = await sb.from("submissions").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    $("mine-list").innerHTML = (data || []).map(s => `<div class="row"><div class="h"><span>${esc(s.title)}</span><span class="st ${s.status}">${L(s.status)}</span></div><div>${esc(s.description)}</div><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url)}</a>${s.review_note ? `<div class="err">${esc(s.review_note)}</div>` : ""}</div>`).join("") || `<p class="sub">${L("empty")}</p>`;
  }
  async function loadAdmin() {
    const { data } = await sb.from("submissions").select("*, profiles(name)").eq("status", "pending").order("created_at");
    $("admin-list").innerHTML = (data || []).map(s => `<div class="row" data-id="${s.id}"><div class="h"><span>${esc(s.title)} <small>${L("by", esc(s.profiles?.name || "?"))}</small></span><span class="st">${s.kind}</span></div><div>${esc(s.description)}</div><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url)}</a>${s.note ? `<div class="sub" style="margin:0;text-align:left">${esc(s.note)}</div>` : ""}<input placeholder="note (optional)" class="rn" /><div class="acts"><button class="pass" data-act="approved">${L("approve")}</button><button data-act="rejected">${L("reject")}</button></div></div>`).join("") || `<p class="sub">${L("empty")}</p>`;
    $("admin-list").querySelectorAll("[data-act]").forEach(b => b.onclick = async () => {
      const row = b.closest(".row"), id = row.dataset.id, note = row.querySelector(".rn").value;
      const { error } = await sb.rpc("review_submission", { p_id: id, p_status: b.dataset.act, p_note: note || null });
      if (error) { toast(error.message, 4000); return; }
      loadAdmin(); renderGames();
    });
  }
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // instalace (PWA) + offline předstažení
  let installEvt = null;
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installEvt = e; $("btn-install").classList.remove("hidden"); });
  $("btn-install").onclick = async () => { if (!installEvt) return; installEvt.prompt(); await installEvt.userChoice; installEvt = null; $("btn-install").classList.add("hidden"); };
  if (/iphone|ipad/i.test(navigator.userAgent) && !navigator.standalone) { $("btn-install").classList.remove("hidden"); $("btn-install").onclick = () => toast(L("iosHint"), 4000); }
  if (matchMedia("(display-mode: standalone)").matches || navigator.standalone) $("btn-install").classList.add("hidden");
  $("btn-offline").onclick = () => { if (!navigator.serviceWorker || !navigator.serviceWorker.controller) { toast("…", 1500); setTimeout(() => location.reload(), 1200); return; } $("btn-offline").disabled = true; navigator.serviceWorker.controller.postMessage("precache"); };
  if (navigator.serviceWorker) navigator.serviceWorker.addEventListener("message", (e) => { if (e.data && e.data.t === "precached") { toast(L("offlineDone") + ` (${e.data.n})`, 4000); $("btn-offline").disabled = false; } });
  applyLang();
})();
