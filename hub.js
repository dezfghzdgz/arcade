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
      desktopBtn: "Download for PC (build guide)", installT: "Install Arcade", installD: "works offline – solo games need no wifi", installBtn: "Install app", offlineBtn: "Save games for offline", offlineDone: "Saved – solo games now work without internet", iosHint: "On iPhone: Share → Add to Home Screen", search: "Search games…", dailyT: "Today", shop: "Shop", shopT: "Shop", shopHelp: "Coins come from playing and daily missions. Skins show up in our games and next to your name. Pass items are free with Arcade Pass.", dailyLogin: "Sign in to get 3 daily missions, XP, coins and a streak – in every game, even guest ones.", streakN: (n) => `${n}-day streak`, claim: "Claim", claimed: "Claimed!", mWin: (n) => `Win ${n} round in any game`, mGame: (g, n) => `Play ${g} ${n}×`, mPlay: (n) => `Finish ${n} games (any)`, slot_ball: "Ball skin", slot_name: "Name color", slot_trail: "Trail", slot_badge: "Badge", slot_title: "Title", slot_theme: "Site theme", equip: "Equip", equipped: "Equipped ✓", free: "Free (Pass)", notEnough: "Not enough coins yet – play a bit more!", toNext: (n) => `${n} XP to next level`, streakLbl: "day streak", coins: "coins", plays: "games played", seasonXp: "season XP", weekXp: "this week", bWeek: "This week", bSeason: "Season", bAll: "All-time", fAll: "All", fSolo: "Solo", fFriends: "With friends", rating: "Rating", ratingTitle: "Leaderboards", ratingHelp: "XP from every game – ours and guest games too. The week resets Monday, the season monthly; all-time never.", tier: "Tier", games: "Games", yourRank: (r) => `Your rank #${r}`, noRatingYet: "Play any game while signed in to earn your first points.", ratingLogin: "Sign in to collect rating points across all games.", ratingNotSetup: "Leaderboards aren't set up yet (run SETUP5.sql).", cat_all: "All", cat_action: "Action", cat_puzzle: "Puzzle", cat_arcade: "Arcade", cat_strategy: "Strategy", cat_party: "Party", cat_sports: "Sports", cat_cards: "Cards", cat_board: "Board", cat_idle: "Idle", recentH: "Continue playing", duel: "1v1 on one code or vs a bot: Connect 4, Five in a row, Battleships. Three bot levels.", hop: "Hop across roads, rivers and rails. Dodge cars and trains, ride logs, don\u2019t dawdle – the eagle is coming.", slovo: "Guess the five-letter word in six tries. New daily word for everyone + unlimited practice. Czech & English.", golf: "Minigolf with endless generated holes: walls, bumpers, water, sand, moving blocks. Hit par for 3 stars.", tycoon: "Build an arcade empire: buy machines, hire managers, earn even while you\u2019re offline. Investors boost you forever.", soloH: "Offline · solo", guestNote: "Q1K3, UNDERRUN, PACKABUNCHAS, PATH TO GLORY, 666, SPACE and the Careless platformer are guest games from js13kGames by their respective authors.", g_q1k3: "FPS like Doom in 13 kB. WASD + mouse, click to capture the mouse.", g_underrun: "Top-down shooter in a dark facility. WASD + mouse.", g_packabunchas: "Pack shapes into the rocket before launch. Mouse or touch.", g_pathtoglory: "Medieval sword fighting in 2D. Keyboard.", g_666: "Collect souls in a 3D hell. WASD + mouse.", g_space: "2D space shooter. Keyboard.", g_deathrun: "2D platformer where dying doesn't matter. Keyboard.", friendsH: "Online · with friends", pcOnly: "PC ONLY", pcLocked: "Needs a mouse – open on a PC", addHint: "Send us your HTML5 game. If it fits, it shows up here with your name.", zigdash: "Tap, flip, dodge. One thumb, leaderboard, daily missions.", splatz: "Paint arena for up to 8. Share a code, fill the rest with bots. 5 modes.", tower: "Race up the tower. Jump, springs, gears, lava. First to the top wins.", front: "Territory strategy. Draw the map together, spawn, expand, conquer 60%.", boom: "Hot potato for up to 8 with 5 modes: classic, chaos, shrinking zone, teams, hunter.", fleet: "Naval battle for up to 8: steer, broadside, sink. Battle, fleets, king of the sea, treasure.", solitaire: "Klondike: draw 1 or 3, undo, auto-finish, daily deal with best-time leaderboard.", roll: "Roll the ball, paint every tile. Endless generated maze levels, undo, 3-star scoring.", tubes: "Pour colors until every tube is one color. Endless levels, undo, hints, extra tube.", flow: "Connect matching dots without crossing and fill the board. Relaxing puzzles 5×5 to 9×9.", snakes: "Multiplayer snake for up to 8: eat, grow, boost, make rivals crash. Arena, last one, teams.", sketch: "Draw and guess live, like skribbl: one draws, everyone types guesses. Czech or English words, 2–10 players.", stack: "Tap to drop the block and build the tallest tower. Perfect drops grow it back.", party: "12 quick minigames like 1234 Player Games, but everyone on their own phone: reflex, tap race, math, colors, Simon, target, stop the bar, typing…", pong: "Online Pong for 2–4: 1v1, 2v2 or 2v1 (the solo player gets a wider paddle). Play to points or time, ball speeds up every hit.", doodle: "Write it, draw it, guess it – telephone game for 2–10 friends, then laugh at the albums.", merge: "Slide and merge numbers. Daily challenge, undo, global leaderboard.", snake: "The classic, faster with every apple. Wrap-around or walls mode, bonus stars.", mines: "Minesweeper with a daily board and best-time leaderboard. Hold to flag.", bricks: "Breakout with power-ups: multiball, laser, wide paddle, extra life. Endless levels.", sudoku: "Three difficulties, notes, hints, mistake check, daily puzzle with best-time leaderboard.", checkEmail: "Check your e-mail to confirm the account, then sign in." },
    cs: { sub: "Rychlé hry. Sólo nebo s kamarády přes jeden odkaz.", solo: "SÓLO", friends: "S KAMARÁDY", community: "Od komunity", signIn: "Přihlásit", signUp: "Založit účet", signOut: "Odhlásit",
      submitGame: "Poslat hru", mySubs: "Moje hry", admin: "Ke schválení", kine: "Také od nás:", kineDesc: "– videa, živě, tvůrci", lang: "English",
      submitHelp: "Svou HTML5 hru si hostuj kdekoliv (Vercel, GitHub Pages, itch.io) a vlož odkaz. Zahrajeme si ji, a když sedne, objeví se na Arcade s tvým jménem.",
      fTitle: "Název", fDesc: "Popis na jeden řádek", fUrl: "Odkaz na hru (https://…)", fIcon: "Odkaz na ikonu (nepovinné, čtvercové PNG)", fKind: "Typ", fNote: "Poznámka pro nás (nepovinné)", fName: "Zobrazované jméno", fPass: "Heslo", send: "Odeslat ke schválení",
      needLogin: "Nejdřív se přihlas.", sent: "Odesláno! Brzy se na to podíváme.", noSupabase: "Účty ještě nejsou zapojené (viz README).", toggleUp: "Nemáš účet? Založ si ho", toggleIn: "Máš účet? Přihlas se",
      pending: "čeká", approved: "schváleno", rejected: "zamítnuto", approve: "Schválit", reject: "Zamítnout", by: (n) => `od ${n}`, empty: "Zatím nic.",
      pass: "Arcade Pass", passDesc: (p) => `Bez reklam ve všech hrách · ${p}/měsíc`, passActive: (d) => `Arcade Pass aktivní do ${d}`, getPass: "Pořídit Arcade Pass", passNeedLogin: "Na pass se musíš přihlásit.",
      desktopBtn: "Stáhnout pro PC (návod)", installT: "Nainstaluj Arcade", installD: "funguje offline – sólo hry nepotřebují wifi", installBtn: "Nainstalovat", offlineBtn: "Uložit hry pro offline", offlineDone: "Uloženo – sólo hry teď jedou i bez internetu", iosHint: "Na iPhonu: Sdílet → Přidat na plochu", search: "Hledat hry…", dailyT: "Dnes", shop: "Obchod", shopT: "Obchod", shopHelp: "Mince získáš hraním a denními misemi. Skiny se ukážou v našich hrách a u tvého jména. Položky Pass jsou zdarma s Arcade Pass.", dailyLogin: "Přihlas se a dostaneš 3 denní mise, XP, mince a streak – v každé hře, i hostující.", streakN: (n) => `${n} dní v řadě`, claim: "Vyzvednout", claimed: "Vyzvednuto!", mWin: (n) => `Vyhraj ${n} kolo v jakékoli hře`, mGame: (g, n) => `Zahraj ${g} ${n}×`, mPlay: (n) => `Dohraj ${n} hry (jakékoli)`, slot_ball: "Skin kuličky", slot_name: "Barva jména", slot_trail: "Stopa", slot_badge: "Odznak", slot_title: "Titul", slot_theme: "Téma webu", equip: "Nasadit", equipped: "Nasazeno ✓", free: "Zdarma (Pass)", notEnough: "Ještě nemáš dost mincí – zahraj si ještě chvíli!", toNext: (n) => `${n} XP do dalšího levelu`, streakLbl: "dní v řadě", coins: "mincí", plays: "odehraných her", seasonXp: "XP v sezóně", weekXp: "tento týden", bWeek: "Tento týden", bSeason: "Sezóna", bAll: "Celkově", fAll: "Vše", fSolo: "Sólo", fFriends: "S kamarády", rating: "Rating", ratingTitle: "Žebříčky", ratingHelp: "XP ze všech her – našich i hostujících. Týden se resetuje v pondělí, sezóna každý měsíc, celkový nikdy.", tier: "Hodnost", games: "Her", yourRank: (r) => `Tvoje pořadí #${r}`, noRatingYet: "Zahraj si přihlášený jakoukoli hru a získáš první body.", ratingLogin: "Přihlas se a sbírej body ze všech her.", ratingNotSetup: "Žebříčky ještě nejsou zapojené (spusť SETUP5.sql).", cat_all: "Vše", cat_action: "Akce", cat_puzzle: "Hlavolamy", cat_arcade: "Arkády", cat_strategy: "Strategie", cat_party: "Párty", cat_sports: "Sport", cat_cards: "Karty", cat_board: "Deskovky", cat_idle: "Idle", recentH: "Pokračuj v hraní", duel: "1v1 přes jeden kód nebo proti botovi: Čtyři v řadě, Piškvorky, Lodě. Tři úrovně bota.", hop: "Skákej přes silnice, řeky a koleje. Uhýbej autům a vlakům, jeď po kládách a neloudej se – přiletí orel.", slovo: "Uhodni slovo z pěti písmen na šest pokusů. Každý den nové pro všechny + neomezený trénink. Česky i anglicky.", golf: "Minigolf s nekonečnými jamkami: zdi, nárazníky, voda, písek, pohyblivé bloky. Na par 3 hvězdy.", tycoon: "Postav herní impérium: kupuj automaty, najímej manažery, vydělávej i offline. Investoři tě posunou navždy.", soloH: "Offline · sólo", guestNote: "Q1K3, UNDERRUN, PACKABUNCHAS, PATH TO GLORY, 666, SPACE a skákačka od Careless Labs jsou hostující hry ze soutěže js13kGames od jejich autorů.", g_q1k3: "FPS jako Doom ve 13 kB. WASD + myš, kliknutím zamkneš myš.", g_underrun: "Střílečka shora v temném komplexu. WASD + myš.", g_packabunchas: "Naskládej tvary do rakety před startem. Myš nebo dotyk.", g_pathtoglory: "Středověký boj s mečem, 2D. Klávesnice.", g_666: "Sbírej duše v 3D pekle. WASD + myš.", g_space: "2D vesmírná střílečka. Klávesnice.", g_deathrun: "2D skákačka, kde nevadí umírat. Klávesnice.", friendsH: "Online · s kamarády", pcOnly: "JEN PC", pcLocked: "Potřebuje myš – otevři na počítači", addHint: "Pošli nám svou HTML5 hru. Když sedne, objeví se tady s tvým jménem.", zigdash: "Ťukni, otoč se, uhni. Jeden palec, žebříček, denní úkoly.", splatz: "Malovací aréna až pro 8. Pošli kód, zbytek doplní boti. 5 módů.", tower: "Závod nahoru věží. Skoky, pružiny, ozubená kola, láva.", front: "Strategie o území. Nakreslete mapu, naspawnujte se, dobyjte 60 %.", boom: "Horký brambor až pro 8 v 5 módech: klasika, chaos, zóna, týmy, lovec.", fleet: "Námořní bitva až pro 8: kormidlo, salva z boku, potopení. Bitva, flotily, král moří, poklad.", solitaire: "Klondike: po 1 nebo po 3, zpět, automatické dohrání, denní rozdání se žebříčkem časů.", roll: "Kulička jede, dokud nenarazí – obarvi všechna políčka. Nekonečné generované levely, zpět, hvězdičky.", tubes: "Přelévej barvy, dokud není každá zkumavka jednobarevná. Nekonečné levely, zpět, nápovědy, zkumavka navíc.", flow: "Spoj stejné tečky bez křížení a vyplň celé pole. Klidné hlavolamy 5×5 až 9×9.", snakes: "Multiplayer had až pro 8: jez, rosť, boostuj, nech soupeře nabourat. Aréna, poslední, týmy.", sketch: "Kresli a hádej naživo jako skribbl: jeden kreslí, ostatní píšou tipy. České nebo anglické slova, 2–10 hráčů.", stack: "Ťukáním skládej bloky do co nejvyšší věže. Přesná trefa blok zase zvětší.", party: "12 rychlých miniher jako 1234 Player Games, ale každý na svém mobilu: reflex, ťukací závod, matika, barvy, Simon, terč, zastav lištu, psaní…", pong: "Online Pong pro 2–4: 1v1, 2v2 i 2v1 (sám má širší pálku). Na body nebo na čas, míček s každým odrazem zrychlí.", doodle: "Napiš, nakresli, uhodni – tichá pošta pro 2–10 kamarádů, na konci alba k popukání.", merge: "Posouvej a spojuj čísla. Denní výzva, zpět, globální žebříček.", snake: "Klasika, s každým jablkem rychlejší. Průchozí okraje nebo stěny, bonusové hvězdy.", mines: "Miny s denním polem a žebříčkem nejlepších časů. Podržením vlajka.", bricks: "Breakout s power-upy: multiball, laser, širší pálka, život navíc. Nekonečné levely.", sudoku: "Tři obtížnosti, poznámky, nápověda, kontrola chyb, denní sudoku se žebříčkem časů.", checkEmail: "Potvrď účet v e-mailu a pak se přihlas." },
  };
  let lang = localStorage.getItem("arcade_lang") || "en";
  const L = (k, ...a) => { const v = T[lang][k] ?? T.en[k] ?? k; return typeof v === "function" ? v(...a) : v; };
  const BUILTIN = [
    { slug: "party", title: "Party", kind: "friends", url: "party/?create=1", icon: "party/icon-192.png", cat: "party" },
    { slug: "sketch", title: "Sketch", kind: "friends", url: "sketch/?create=1", icon: "sketch/icon-192.png", cat: "party" },
    { slug: "duel", title: "Duel", kind: "friends", url: "duel/", icon: "duel/icon-192.png", cat: "board", isNew: true },
    { slug: "hop", title: "Hop", kind: "solo", url: "hop/", icon: "hop/icon-192.png", cat: "arcade", isNew: true },
    { slug: "slovo", title: "Slovo", kind: "solo", url: "slovo/", icon: "slovo/icon-192.png", cat: "puzzle", isNew: true },
    { slug: "golf", title: "Golf", kind: "solo", url: "golf/", icon: "golf/icon-192.png", cat: "sports", isNew: true },
    { slug: "tycoon", title: "Tycoon", kind: "solo", url: "tycoon/", icon: "tycoon/icon-192.png", cat: "idle", isNew: true },
    { slug: "zigdash", title: "ZigDash", kind: "solo", url: "zigdash/", icon: "zigdash/icon-192.png", cat: "arcade" },
    { slug: "splatz", title: "Splatz", kind: "friends", url: "splatz/", icon: "splatz/icon-192.png", cat: "action" },
    { slug: "tower", title: "Tower", kind: "friends", url: "tower/", icon: "tower/icon-192.png", cat: "action" },
    { slug: "front", title: "Front", kind: "friends", url: "front/", icon: "front/icon-192.png", cat: "strategy", pc: true },
    { slug: "doodle", title: "Doodle", kind: "friends", url: "doodle/", icon: "doodle/icon-192.png", cat: "party" },
    { slug: "boom", title: "Boom", kind: "friends", url: "boom/", icon: "boom/icon-192.png", cat: "action" },
    { slug: "fleet", title: "Fleet", kind: "friends", url: "fleet/", icon: "fleet/icon-192.png", cat: "action" },
    { slug: "snakes", title: "Snakes", kind: "friends", url: "snakes/", icon: "snakes/icon-192.png", cat: "action" },
    { slug: "pong", title: "Pong", kind: "friends", url: "pong/", icon: "pong/icon-192.png", cat: "sports" },
    { slug: "merge", title: "Merge", kind: "solo", url: "merge/", icon: "merge/icon-192.png", cat: "puzzle" },
    { slug: "snake", title: "Snake", kind: "solo", url: "snake/", icon: "snake/icon-192.png", cat: "arcade" },
    { slug: "mines", title: "Mines", kind: "solo", url: "mines/", icon: "mines/icon-192.png", cat: "puzzle" },
    { slug: "bricks", title: "Bricks", kind: "solo", url: "bricks/", icon: "bricks/icon-192.png", cat: "arcade" },
    { slug: "sudoku", title: "Sudoku", kind: "solo", url: "sudoku/", icon: "sudoku/icon-192.png", cat: "puzzle" },
    { slug: "solitaire", title: "Solitaire", kind: "solo", url: "solitaire/", icon: "solitaire/icon-192.png", cat: "cards" },
    { slug: "roll", title: "Roll", kind: "solo", url: "roll/", icon: "roll/icon-192.png", cat: "puzzle" },
    { slug: "tubes", title: "Tubes", kind: "solo", url: "tubes/", icon: "tubes/icon-192.png", cat: "puzzle" },
    { slug: "flow", title: "Flow", kind: "solo", url: "flow/", icon: "flow/icon-192.png", cat: "puzzle" },
    { slug: "stack", title: "Stack", kind: "solo", url: "stack/", icon: "stack/icon-192.png", cat: "arcade" },
    { slug: "hexa", title: "Hexa", kind: "solo", url: "hexa/", icon: "hexa/icon-192.png", cat: "puzzle", isNew: true, desc: "Rotate the hexagon, catch falling blocks, match three colors. Endless." },
    { slug: "blocks", title: "Blocks", kind: "solo", url: "blocks/", icon: "blocks/icon-192.png", cat: "puzzle", isNew: true, desc: "Falling blocks with hold, ghost and levels. Keyboard or swipe." },
    { slug: "q1k3", title: "Q1K3", kind: "solo", url: "play.html?url=guest/q1k3/&game=q1k3", icon: "guest/q1k3/icon-192.png", cat: "action", pc: true, by: "Dominic Szablewski" },
    { slug: "underrun", title: "UNDERRUN", kind: "solo", url: "play.html?url=guest/underrun/&game=underrun", icon: "guest/underrun/icon-192.png", cat: "action", pc: true, by: "Dominic Szablewski" },
    { slug: "packabunchas", title: "PACKABUNCHAS", kind: "solo", url: "play.html?url=guest/packabunchas/&game=packabunchas", icon: "guest/packabunchas/icon-192.png", cat: "puzzle", by: "Rémi Vansteelandt" },
    { slug: "pathtoglory", title: "PATH TO GLORY", kind: "solo", url: "play.html?url=guest/pathtoglory/&game=pathtoglory", icon: "guest/pathtoglory/icon-192.png", cat: "action", pc: true, by: "Rémi Vansteelandt" },
    { slug: "666", title: "666", kind: "solo", url: "play.html?url=guest/666/&game=666", icon: "guest/666/icon-192.png", cat: "action", pc: true, by: "js13kGames" },
    { slug: "space", title: "SPACE", kind: "solo", url: "play.html?url=guest/space/&game=space", icon: "guest/space/icon-192.png", cat: "action", pc: true, by: "Matthew Diamant" },
    { slug: "deathrun", title: "Careless Platformer", kind: "solo", url: "play.html?url=guest/deathrun/&game=deathrun", icon: "guest/deathrun/icon-192.png", cat: "arcade", pc: true, by: "Adam Williams" },
  ];

  const sb = C.supabaseUrl && window.supabase ? supabase.createClient(C.supabaseUrl, C.supabaseAnonKey) : null;
  let user = null, profile = null;

  const toast = (m, ms = 2200) => { const el = $("toast"); el.textContent = m; el.classList.remove("hidden"); clearTimeout(el._t); el._t = setTimeout(() => el.classList.add("hidden"), ms); };
  function applyLang() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach(el => el.textContent = L(el.dataset.i18n));
    document.querySelectorAll("[data-i18n-ph]").forEach(el => el.placeholder = L(el.dataset.i18nPh));
    $("lang").textContent = L("lang");
    renderChips(); renderGames(); renderPass(); updateAuthUI();
  }
  $("lang").onclick = () => { lang = lang === "en" ? "cs" : "en"; localStorage.setItem("arcade_lang", lang); applyLang(); };
  $("kine-link").href = C.kineUrl;

  // ---------- stránky
  function showPage(id) { document.querySelectorAll(".page").forEach(p => p.classList.toggle("hidden", p.id !== "page-" + id)); $("user-drop").classList.add("hidden"); window.scrollTo(0, 0); if (id === "mine") loadMine(); if (id === "admin") loadAdmin(); if (id === "rating") loadRating(); if (id === "shop") loadShop(); if (id === "profile") loadProfile(); }
  document.querySelectorAll("[data-page]").forEach(b => b.onclick = () => { if (!["home", "rating", "shop"].includes(b.dataset.page) && !user) { openAuth(); return; } showPage(b.dataset.page); });

  // ---------- hry
  function card(g, community) {
    const a = document.createElement("a"); a.className = "card " + (g.kind === "solo" ? "solo" : "friends"); a.href = g.url; if (community) { a.target = "_blank"; a.rel = "noopener"; }
    const img = g.icon || g.icon_url; 
    a.innerHTML = `${img ? `<img src="${img}" alt="" onerror="this.remove()" />` : ""}<span class="tag">${g.kind === "solo" ? L("solo") : L("friends")}</span>${g.pc ? `<span class="tag pcbadge">${L("pcOnly")}</span>` : ""}<h3></h3><p></p>${community ? `<small></small>` : ""}`;
    if (g.pc) { a.classList.add("pconly"); if (matchMedia("(pointer: coarse)").matches) { a.classList.add("locked"); a.dataset.lock = L("pcLocked"); a.removeAttribute("href"); } }
    a.querySelector("h3").textContent = g.title; a.querySelector("p").textContent = community ? g.description : (L(g.slug) === g.slug ? L("g_" + g.slug) : L(g.slug));
    if (g.by) { const c = document.createElement("small"); c.className = "cred"; c.textContent = L("by", g.by); a.appendChild(c); }
    if (community) a.querySelector("small").textContent = L("by", g.author || "?");
    return a;
  }
  const CATS = ["all", "action", "puzzle", "arcade", "board", "strategy", "party", "sports", "cards", "idle"];
  let fWho = "all", fCat = "all", fText = "";
  function tile(g, community) {
    const a = document.createElement("a"); a.className = "tile"; a.href = g.url; if (community) { a.target = "_blank"; a.rel = "noopener"; }
    const img = g.icon || g.icon_url || "";
    a.innerHTML = `<img src="${img}" alt="" loading="lazy" onerror="this.style.display='none'" /><div class="b"><span class="${g.kind === "solo" ? "s" : "f"}">${g.kind === "solo" ? L("solo") : L("friends")}</span>${g.pc ? `<span class="p">PC</span>` : ""}${g.isNew ? `<span class="n">NEW</span>` : ""}</div><div class="t"></div>`;
    a.querySelector(".t").textContent = g.title; a.title = community ? g.description : (g.desc || (L(g.slug) === g.slug ? (L("g_" + g.slug) === "g_" + g.slug ? "" : L("g_" + g.slug)) : L(g.slug)));
    if (g.pc && matchMedia("(pointer: coarse)").matches) { a.classList.add("locked"); a.removeAttribute("href"); }
    if (g.slug === "party") a.classList.add("big");
    if (!community) a.addEventListener("click", () => { try { const r = JSON.parse(localStorage.getItem("arcade_recent") || "[]").filter(x => x !== g.slug); r.unshift(g.slug); localStorage.setItem("arcade_recent", JSON.stringify(r.slice(0, 8))); } catch {} });
    return a;
  }
  const matches = (g) => (fWho === "all" || g.kind === fWho) && (fCat === "all" || g.cat === fCat) && (!fText || (g.title + " " + (g.desc || L(g.slug) || "")).toLowerCase().includes(fText));
  function renderChips() { const c = $("cat-chips"); c.innerHTML = ""; for (const k of CATS) { const b = document.createElement("button"); b.textContent = L("cat_" + k); b.className = k === fCat ? "active" : ""; b.onclick = () => { fCat = k; renderChips(); renderGames(); }; c.appendChild(b); } }
  let EXTRA = [], catalogLoaded = false;
  async function loadCatalog() { if (catalogLoaded) return; catalogLoaded = true; try { const r = await fetch("catalog.json?v=" + Date.now()); const j = await r.json(); EXTRA = (j.games || []).filter(g => !g.hidden).map(g => Object.assign({}, g, { url: g.embed ? `play.html?url=${encodeURIComponent(g.embed)}&title=${encodeURIComponent(g.title)}` : g.url })); renderGames(); } catch {} }
  async function renderGames() {
    loadCatalog();
    const grid = $("games-all"); grid.innerHTML = "";
    { let rec = []; try { rec = JSON.parse(localStorage.getItem("arcade_recent") || "[]"); } catch {} const all = BUILTIN.concat(EXTRA), items = rec.map(sl => all.find(g => g.slug === sl)).filter(Boolean).slice(0, 6), show = items.length > 0 && !fText && fCat === "all" && fWho === "all";
      $("recent-h").classList.toggle("hidden", !show); const rg = $("recent"); rg.classList.toggle("hidden", !show); rg.innerHTML = ""; if (show) items.forEach(g => { const t = tile(g, false); t.classList.remove("big"); rg.appendChild(t); }); } BUILTIN.concat(EXTRA).filter(matches).forEach(g => grid.appendChild(tile(g, false)));
    if (!fText && fCat === "all") { const add = document.createElement("div"); add.className = "tile add"; add.innerHTML = `<div><div class="plus">+</div><div></div></div>`; add.querySelector("div div:last-child").textContent = L("submitGame"); add.onclick = () => { if (!user) { openAuth(); return; } showPage("submit"); }; grid.appendChild(add); }
    if (!sb) return;
    const { data } = await sb.from("games").select("*").order("created_at", { ascending: false });
    const cg = $("community"); cg.innerHTML = "";
    const rows = (data || []).filter(g => (fWho === "all" || g.kind === fWho) && (!fText || (g.title + " " + g.description).toLowerCase().includes(fText)));
    $("community-h").classList.toggle("hidden", !rows.length);
    rows.forEach(g => cg.appendChild(card(g, true)));
  }
  $("search").addEventListener("input", (e) => { fText = e.target.value.trim().toLowerCase(); renderGames(); });
  $("who-seg").querySelectorAll("button").forEach(b => b.onclick = () => { fWho = b.dataset.who; $("who-seg").querySelectorAll("button").forEach(x => x.classList.toggle("active", x === b)); renderGames(); });
  // ---------- rating
  $("btn-rating").onclick = () => showPage("rating");
  let boardKind = "week";
  $("board-seg").querySelectorAll("button").forEach(b => b.onclick = () => { boardKind = b.dataset.b; $("board-seg").querySelectorAll("button").forEach(x => x.classList.toggle("active", x === b)); loadRating(); });
  async function loadRating() {
    const tb = $("rating-board").querySelector("tbody"); tb.innerHTML = ""; const st = $("rating-status"); st.textContent = L("loading");
    if (!sb) { st.textContent = L("noSupabase"); return; }
    const { data, error } = await sb.from("board_" + boardKind).select("*").order("rank").limit(100);
    if (error) { st.textContent = L("ratingNotSetup"); return; }
    st.textContent = data.length ? "" : L("empty");
    tb.innerHTML = data.map(r => `<tr class="${user && r.user_id === user.id ? "me" : ""}"><td>${r.rank}</td><td><span class="nm"></span></td><td>${r.level}</td><td>${r.xp}</td></tr>`).join("");
    [...tb.querySelectorAll(".nm")].forEach((el, i) => el.textContent = data[i].name);
    const box = $("rating-me"); box.classList.remove("hidden");
    if (user) { const mine = data.find(r => r.user_id === user.id); const st2 = window.Meta && Meta.state; box.innerHTML = `<span>${mine ? L("yourRank", mine.rank) : L("noRatingYet")}${st2 ? ` · Lv ${st2.level} · 🔥 ${st2.streak}` : ""}</span><b>${mine ? mine.xp : (st2 ? st2.xp : 0)} XP</b>`; }
    else box.innerHTML = `<span>${L("ratingLogin")}</span><button class="pass" onclick="document.getElementById('btn-signin').click()">${L("signIn")}</button>`;
  }
  // ---------- hráč: pruh v hlavičce, denní mise, obchod, profil
  function renderPlayer() {
    const st = window.Meta && Meta.state, strip = $("player-strip");
    if (!user || !st) { strip.classList.add("hidden"); $("daily").classList.toggle("hidden", !!user && !st); renderMissions(); return; }
    strip.classList.remove("hidden"); $("daily").classList.remove("hidden");
    const lv = st.level || 1, base = Meta.xpForLevel(lv), next = Meta.xpForLevel(lv + 1), pct = Math.min(100, Math.round(100 * (st.xp - base) / Math.max(1, next - base)));
    $("ps-level").textContent = lv; $("ps-xp").style.width = pct + "%"; $("ps-streak").textContent = "🔥" + (st.streak || 0); $("ps-coins").textContent = "🪙" + (st.coins || 0);
    const nm = $("user-name"); const ns = Meta.skin("name"); nm.style.background = ""; nm.style.color = ""; nm.style.webkitBackgroundClip = ""; if (ns) { if (ns.color.startsWith("linear")) { nm.style.background = ns.color; nm.style.webkitBackgroundClip = "text"; nm.style.color = "transparent"; } else nm.style.color = ns.color; }
    const bd = Meta.skin("badge"); nm.textContent = (bd ? bd.icon + " " : "") + ((profile && profile.name) || user.email.split("@")[0]);
    renderMissions();
  }
  function renderMissions() {
    const box = $("missions"), st = window.Meta && Meta.state;
    if (!user) { box.innerHTML = `<div class="mission login"><span>${L("dailyLogin")}</span><button class="pass" onclick="document.getElementById('btn-signin').click()">${L("signIn")}</button></div>`; $("daily-sub").textContent = ""; return; }
    const ms = (st && st.missions) || []; const done = ms.filter(m => m.claimed).length; $("daily-sub").textContent = `${done}/${ms.length} · 🔥 ${L("streakN", st ? st.streak : 0)}`;
    box.innerHTML = ms.map(m => `<div class="mission ${m.claimed ? "claimed" : m.done ? "done" : ""}"><div class="mt">${missionText(m)}</div><div class="mb"><i style="width:${Math.round(100 * m.progress / m.target)}%"></i></div><div class="mr">+${m.xp} XP · 🪙${m.coins}</div>${m.done && !m.claimed ? `<button class="pass" data-claim="${m.id}">${L("claim")}</button>` : m.claimed ? `<span class="ok">✓</span>` : `<span class="dim">${m.progress}/${m.target}</span>`}</div>`).join("");
    box.querySelectorAll("[data-claim]").forEach(b => b.onclick = async () => { b.disabled = true; const r = await Meta.rpc("claim_mission", { p_id: b.dataset.claim }); if (r) { localStorage.setItem("arcade_meta", JSON.stringify(r)); await Meta.refresh(); renderPlayer(); toast(L("claimed")); } });
  }
  function missionText(m) { const g = m.game ? (BUILTIN.find(x => x.slug === m.game) || { title: m.game }).title : null; if (m.kind === "win") return L("mWin", m.target); if (g) return L("mGame", g, m.target); return L("mPlay", m.target); }
  document.addEventListener("arcade-meta", renderPlayer);
  $("player-strip").onclick = () => showPage("profile"); $("btn-shop").onclick = () => showPage("shop");
  async function loadShop() {
    const st = (await Meta.refresh()) || Meta.state || {}; $("shop-coins").textContent = "🪙 " + (st.coins || 0);
    const { data: dbItems } = sb ? await sb.from("shop_items").select("*") : { data: [] }; const grid = $("shop-grid"); grid.innerHTML = "";
    const hasPass = profile && profile.pass_until && new Date(profile.pass_until) > new Date();
    const items = Object.keys(Meta.SHOP).map(k => { const db = (dbItems || []).find(x => x.item === k); return { item: k, price: db ? db.price : Meta.SHOP[k].price, pass_only: db ? db.pass_only : !!Meta.SHOP[k].pass }; });
    const curSlot = grid.dataset.slot || "all"; const slots = ["all", ...new Set(items.map(i => Meta.SHOP[i.item].slot))];
    const tabs = document.createElement("div"); tabs.className = "seg shop-tabs"; tabs.innerHTML = slots.map(sl => `<button data-s="${sl}" class="${sl === curSlot ? "active" : ""}">${sl === "all" ? L("fAll") : L("slot_" + sl)}</button>`).join(""); grid.appendChild(tabs);
    tabs.querySelectorAll("button").forEach(b => b.onclick = () => { grid.dataset.slot = b.dataset.s; loadShop(); });
    for (const it of items) { const d = Meta.SHOP[it.item]; if (!d || (curSlot !== "all" && d.slot !== curSlot)) continue; const owned = (st.inventory || []).includes(it.item), eq = st.equipped && st.equipped[d.slot] === it.item;
      const c = document.createElement("div"); c.className = "shop-item" + (owned ? " owned" : "") + (eq ? " eq" : "");
      c.innerHTML = `<div class="sw" style="background:${d.color || "#3A1A6A"}">${d.icon || (d.text ? "🏷" : "")}</div><b></b><small>${L("slot_" + d.slot)}</small><button class="${owned ? "" : "pass"}">${eq ? L("equipped") : owned ? L("equip") : it.pass_only ? (hasPass ? L("free") : "Pass") : "🪙 " + it.price}</button>`;
      c.querySelector("b").textContent = d.name[lang] || d.name.en;
      c.querySelector("button").onclick = async () => { if (!user) { openAuth(); return; } let r; if (owned) r = await Meta.rpc("equip", { p_slot: d.slot, p_item: eq ? null : it.item }); else { if (it.pass_only && !hasPass) { showPage("home"); renderPass(); return; } r = await Meta.rpc("buy_item", { p_item: it.item }); if (!r) { toast(L("notEnough")); return; } } if (r) { localStorage.setItem("arcade_meta", JSON.stringify(r)); await Meta.refresh(); loadShop(); renderPlayer(); } };
      grid.appendChild(c); }
  }
  async function loadProfile() {
    const st = (await Meta.refresh()) || Meta.state; const box = $("profile-card"); if (!user || !st) { box.innerHTML = `<button class="pass" onclick="document.getElementById('btn-signin').click()">${L("signIn")}</button>`; return; }
    const lv = st.level, base = Meta.xpForLevel(lv), next = Meta.xpForLevel(lv + 1);
    box.innerHTML = `<div class="ph"><div class="big-lv">${lv}</div><div><h2 id="pf-name"></h2><div class="dim">${(Meta.skin("title") ? Meta.skin("title").text[lang] + " · " : "")}${Meta.tier(st.xp)} · ${st.xp} XP · ${L("toNext", next - st.xp)}</div><div class="xpbar big"><i style="width:${Math.round(100 * (st.xp - base) / (next - base))}%"></i></div></div></div>
      <div class="stats"><div><b>🔥 ${st.streak}</b><small>${L("streakLbl")}</small></div><div><b>🪙 ${st.coins}</b><small>${L("coins")}</small></div><div><b>${st.plays}</b><small>${L("plays")}</small></div><div><b>${st.season_xp}</b><small>${L("seasonXp")}</small></div><div><b>${st.week_xp}</b><small>${L("weekXp")}</small></div></div>
      <div class="row"><button class="pass" data-page="shop">🛍 ${L("shop")}</button><button data-page="rating">★ ${L("rating")}</button></div>`;
    box.querySelector("#pf-name").textContent = (profile && profile.name) || user.email.split("@")[0];
    box.querySelectorAll("[data-page]").forEach(b => b.onclick = () => showPage(b.dataset.page));
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
  function updateAuthUI() { if (window.Meta) { if (user) Meta.refresh().then(renderPlayer); else { localStorage.removeItem("arcade_meta"); renderPlayer(); } }
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
  renderPlayer(); applyLang();
})();
