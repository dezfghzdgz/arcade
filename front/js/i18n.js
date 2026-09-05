window.I18N = {
  cs: {
    tagline: "Nakreslete mapu. Naspawnujte se. Dobývejte.", yourName: "Tvoje jméno",
    playBots: "Hrát s boty", createRoom: "Založit místnost", joinRoom: "Připojit se", roomCode: "Kód místnosti",
    shop: "Obchod", sound: "Zvuk", on: "zap", off: "vyp", lang: "English",
    lobby: "Místnost", copyLink: "Kopírovat odkaz", share: "Sdílet", copied: "Odkaz zkopírován",
    players: (n, m) => `Hráči ${n}/${m}`, fillBots: "Doplnit boty", start: "Start", leave: "Odejít",
    waitingHost: "Čekej, až hostitel odstartuje…", hostLeft: "Hostitel odešel z místnosti.", notFound: "Místnost nenalezena. Zkontroluj kód.",
    connecting: "Připojuju…", roomFull: "Místnost je plná.", you: "ty", host: "host", bot: "bot",
    go: "JEĎ!", timeUp: "KONEC", winner: (n) => `${n} vyhrává!`, youWin: "Vyhrál jsi!", draw: "Remíza",
    results: "Výsledky", coinsEarned: (n) => `+${n} mincí`, doubleAd: "Zdvojnásobit za reklamu", again: "Znovu", backMenu: "Menu",
    nextRound: "Hostitel může spustit další kolo", waitNext: "Čekej na další kolo…",
    hats: "Klobouky", purchases: "Nákupy", removeAds: "Bez reklam", perMonth: "/měsíc", subActive: (d) => `Bez reklam do ${d}`,
    coins: (n) => `${n} mincí`, restore: "Obnovit nákupy", restored: "Nákupy obnoveny", nothingToRestore: "Není co obnovit",
    done: "Hotovo", unlocked: (n) => `${n} odemčeno`, missingCoins: (n) => `Chybí ${n} mincí`, purchaseActive: "Nákup aktivován",
    stripeNote: "Platba proběhne na stránce Stripe a vrátí tě zpět do hry.", adUnavailable: "Reklama není k dispozici",
    mockAd: "Simulovaná reklama", mockAdNote: "(na mobilu tu bude AdMob rewarded video)", mockBuy: (k) => `Simulovaný nákup: ${k}. Potvrdit?`, banner: "reklamní banner",
    hintMobile: "Táhni prstem = pohyb · tlačítko = dash", hintPc: "WASD / šipky = pohyb · mezerník = dash",
    stats: (g, w, b) => `Her ${g} · výher ${w} · nejvíc ${b} % mapy`, shareRoom: (c) => `Pojď hrát Front! Kód: ${c} `,
    hatNames: { none: "Nic", cap: "Kšiltovka", crown: "Koruna", horns: "Rohy", halo: "Svatozář", antenna: "Anténa", headphones: "Sluchátka", tophat: "Cylindr", bow: "Mašle", sprout: "Klíček", helmet: "Helma", party: "Party", beanie: "Kulich", flower: "Kytka", cat: "Kočka", chef: "Kuchař", pirate: "Pirát", viking: "Viking", wizard: "Kouzelník" },
    patNames: { none: "Nic", stripes: "Pruhy", dots: "Puntíky", ring: "Prstenec", half: "Půlka", star: "Hvězda", heart: "Srdce", checker: "Šachovnice" },
    modes: { classic: "Klasika", timed: "3 minuty" }, drawMap: "Mapa", disable: "Vypnout", maps: { random: "náhodná", islands: "ostrovy", continents: "kontinenty", pangaea: "pangea", lake: "jezero", archipelago: "souostroví", draw: "kreslíme spolu" }, units: { city: "Město", defense: "Obrana", port: "Přístav", silo: "Silo", sam: "SAM", factory: "Továrna", warship: "Válečná loď", atom: "Atomovka", hydrogen: "Vodíková", mirv: "MIRV" }, build: "Postavit", nukesHd: "Jaderné (potřebují silo)", navy: "Námořnictvo (potřebuje přístav)", pickTarget: (u) => `${u}: klikni na cíl`, needPort: "Potřebuješ přístav (pravý klik na pobřeží)", needSilo: "Potřebuješ silo", needCoast: "Přístav musí být na pobřeží", noGold: "Málo zlata", occupied: "Tady už něco stojí", gold: "zlata", boatSent: "Loď vyplula", hintBuild: "Pravý klik na svoje území = stavby a zbraně", phase: { draw: "KRESLETE MAPU – levé tlačítko země, pravé voda", spawn: "KLIKNI, KDE CHCEŠ ZAČÍT", play: "" }, attackWith: "Útočit s", workers: "Vojáci / dělníci", nations: "Národy", thName: "Jméno", allyReq: (n) => `${n} žádá o spojenectví`, accept: "Přijmout", reject: "Odmítnout", allied: (n) => `Spojenectví s ${n}`, allyRejected: (n) => `${n} odmítl`, betrayed: (n) => `${n} tě zradil!`, youBetrayed: "Zradil jsi spojence – 60 s slabší obrana", allyEnd: (n) => `Spojenectví s ${n} vypršelo`, info: (n, c, tr, g) => `${n}: ${c} % · ${tr} vojáků · ${g} zlata`, hotkeys: "Klávesy 1–9 = stavby, pak klik", allyExpiring: (n) => `Spojenectví s ${n} brzy vyprší`, renew: "Obnovit", ignore: "Ignorovat", renewed: (n) => `Spojenectví s ${n} obnoveno`, land: "Země", water: "Voda", troops: "vojáků", noAdj: "Musí sousedit s tvým územím", spawned: (n) => `${n} se objevil`, eliminated: (n) => `${n} vyřazen`, hintPc: "Levý klik = útok · pravý klik = menu (útok / loď / stavby / jaderné) · kolečko = zoom · tažení nebo WASD = posun · C = na mě · 1–9 = podíl vojáků", watching: "Sleduješ", hostCantLeave: "Hostitel nemůže odejít",
    modeDesc: { classic: "Do posledního nebo 60 % mapy", timed: "Po 3 minutách vyhrává největší území" },
    mode: "Mód", length: "Délka", seconds: (n) => `${n} s`, color: "Barva", colorAuto: "náhodná",
    missions: "Úkoly", dailyT: "Denní", weeklyT: "Týdenní", missionDone: (n) => `Úkol splněn: +${n} mincí`, dailyBonus: (n, d) => `Denní bonus +${n} mincí (${d}. den v řadě)`,
    mission: { games: (n) => `Odehraj ${n} her`, wins: (n) => `Vyhraj ${n}×`, best: (n) => `Ovládni ${n} % mapy v jedné hře`, attacks: (n) => `Spusť ${n} útoků`, top3: (n) => `Skonči ${n}× v top 3` },
    ability: { bomb: "Bomba! Za 5 s bouchne", speed: "Rychlost!", shield: "Štít!", giant: "Obr!", gun: "Zbraň – 3 rány", freeze: "Zmrazeno!", frenzy: "Nekonečný dash! 3 s" },
    ko: (a, b) => `${a} KO ${b}`, capture: (n) => `${n} +1`, teamA: "Tým Korál", teamB: "Tým Akva", teamWin: (t) => `${t} vyhrává!`,
    hats: "Klobouky", patterns: "Vzory", vibrate: "Vibrace", hostSettings: "Nastavení kola",
    target: "Cíl", timeOnly: "jen čas", pts: (n) => `${n} b.`, abilities: "Schopnosti", bots: "Boti",
    pu: { off: "náhodná", on: "kreslíme spolu (10 s)" }, phaseDraw: "KRESLETE MAPU – levé tlačítko země, pravé voda", botLv: { easy: "lehcí", mid: "střední", hard: "těžcí", mix: "mix" },
    tier: { easy: "noob", mid: "ok", hard: "pro" }, bombAura: "Bomba! 5 s aura",
  },
  en: {
    tagline: "Draw the map. Spawn. Conquer.", yourName: "Your name",
    playBots: "Play vs bots", createRoom: "Create room", joinRoom: "Join", roomCode: "Room code",
    shop: "Shop", sound: "Sound", on: "on", off: "off", lang: "Čeština",
    lobby: "Room", copyLink: "Copy link", share: "Share", copied: "Link copied",
    players: (n, m) => `Players ${n}/${m}`, fillBots: "Fill with bots", start: "Start", leave: "Leave",
    waitingHost: "Waiting for the host to start…", hostLeft: "The host left the room.", notFound: "Room not found. Check the code.",
    connecting: "Connecting…", roomFull: "Room is full.", you: "you", host: "host", bot: "bot",
    go: "GO!", timeUp: "TIME", winner: (n) => `${n} wins!`, youWin: "You win!", draw: "Draw",
    results: "Results", coinsEarned: (n) => `+${n} coins`, doubleAd: "Double with an ad", again: "Again", backMenu: "Menu",
    nextRound: "Host can start the next round", waitNext: "Waiting for the next round…",
    hats: "Hats", purchases: "Purchases", removeAds: "Remove ads", perMonth: "/month", subActive: (d) => `Ad-free until ${d}`,
    coins: (n) => `${n} coins`, restore: "Restore purchases", restored: "Purchases restored", nothingToRestore: "Nothing to restore",
    done: "Done", unlocked: (n) => `${n} unlocked`, missingCoins: (n) => `${n} more coins needed`, purchaseActive: "Purchase activated",
    stripeNote: "Payment opens on Stripe and brings you back to the game.", adUnavailable: "Ad not available",
    mockAd: "Simulated ad", mockAdNote: "(AdMob rewarded video plays here on mobile)", mockBuy: (k) => `Simulated purchase: ${k}. Confirm?`, banner: "ad banner",
    hintMobile: "Drag = move · button = dash", hintPc: "WASD / arrows = move · space = dash",
    stats: (g, w, b) => `Games ${g} · wins ${w} · best ${b}% of map`, shareRoom: (c) => `Come play Front! Code: ${c} `,
    hatNames: { none: "None", cap: "Cap", crown: "Crown", horns: "Horns", halo: "Halo", antenna: "Antenna", headphones: "Headphones", tophat: "Top hat", bow: "Bow", sprout: "Sprout", helmet: "Helmet", party: "Party", beanie: "Beanie", flower: "Flower", cat: "Cat", chef: "Chef", pirate: "Pirate", viking: "Viking", wizard: "Wizard" },
    patNames: { none: "None", stripes: "Stripes", dots: "Dots", ring: "Ring", half: "Half", star: "Star", heart: "Heart", checker: "Checker" },
    modes: { classic: "Classic", timed: "3 minutes" }, drawMap: "Map", disable: "Disable", maps: { random: "random", islands: "islands", continents: "continents", pangaea: "pangaea", lake: "lake", archipelago: "archipelago", draw: "draw together" }, units: { city: "City", defense: "Defense post", port: "Port", silo: "Missile silo", sam: "SAM launcher", factory: "Factory", warship: "Warship", atom: "Atom bomb", hydrogen: "Hydrogen bomb", mirv: "MIRV" }, build: "Build", nukesHd: "Nuclear (needs a silo)", navy: "Navy (needs a port)", pickTarget: (u) => `${u}: click the target`, needPort: "You need a port (right-click a coastal cell)", needSilo: "You need a missile silo", needCoast: "A port must be on the coast", noGold: "Not enough gold", occupied: "Something is already built here", gold: "gold", boatSent: "Boat sent", hintBuild: "Right-click your territory for buildings and weapons", phase: { draw: "DRAW THE MAP – left button land, right button water", spawn: "CLICK WHERE TO START", play: "" }, attackWith: "Attack with", workers: "Troops / Workers", nations: "Nations", thName: "Name", allyReq: (n) => `${n} requests an alliance`, accept: "Accept", reject: "Reject", allied: (n) => `Allied with ${n}`, allyRejected: (n) => `${n} declined`, betrayed: (n) => `${n} betrayed you!`, youBetrayed: "You betrayed an ally – 60 s weaker defense", allyEnd: (n) => `Alliance with ${n} expired`, info: (n, c, tr, g) => `${n}: ${c}% · ${tr} troops · ${g} gold`, hotkeys: "Keys 1–9 = build, then click", allyExpiring: (n) => `Your alliance with ${n} is about to expire`, renew: "Request to renew", ignore: "Ignore", renewed: (n) => `Alliance with ${n} renewed`, land: "Land", water: "Water", troops: "troops", noAdj: "Must border your territory", spawned: (n) => `${n} spawned`, eliminated: (n) => `${n} eliminated`, hintPc: "Left-click = attack · right-click = menu (attack / boat / build / nukes) · wheel = zoom · drag or WASD = pan · C = center on me · 1–9 = attack ratio", watching: "Watching", hostCantLeave: "Host can't leave",
    modeDesc: { classic: "Last one standing or 60 % of the map", timed: "Biggest territory after 3 minutes wins" },
    mode: "Mode", length: "Length", seconds: (n) => `${n} s`, color: "Color", colorAuto: "random",
    missions: "Missions", dailyT: "Daily", weeklyT: "Weekly", missionDone: (n) => `Mission complete: +${n} coins`, dailyBonus: (n, d) => `Daily bonus +${n} coins (day ${d} in a row)`,
    mission: { games: (n) => `Play ${n} games`, wins: (n) => `Win ${n} times`, best: (n) => `Control ${n}% of the map in one game`, attacks: (n) => `Launch ${n} attacks`, top3: (n) => `Finish top 3 ${n} times` },
    ability: { bomb: "Bomb! Blows in 5 s", speed: "Speed!", shield: "Shield!", giant: "Giant!", gun: "Gun – 3 shots", freeze: "Frozen!", frenzy: "Unlimited dash! 3 s" },
    ko: (a, b) => `${a} KO'd ${b}`, capture: (n) => `${n} +1`, teamA: "Team Coral", teamB: "Team Aqua", teamWin: (t) => `${t} wins!`,
    hats: "Hats", patterns: "Patterns", vibrate: "Vibration", hostSettings: "Round settings",
    target: "Target", timeOnly: "time only", pts: (n) => `${n} pts`, abilities: "Abilities", bots: "Bots",
    pu: { off: "random", on: "draw together (10 s)" }, phaseDraw: "DRAW THE MAP – left button land, right button water", botLv: { easy: "easy", mid: "medium", hard: "hard", mix: "mix" },
    tier: { easy: "noob", mid: "ok", hard: "pro" }, bombAura: "Bomb! 5 s aura",
  },
};
window.Lang = (() => {
  let lang = Storage.lang || "en";
  const L = (key, ...args) => { const v = (I18N[lang] && I18N[lang][key]) ?? I18N.en[key] ?? key; return typeof v === "function" ? v(...args) : v; };
  L.hat = (id) => (I18N[lang].hatNames || I18N.en.hatNames)[id] || id;
  L.pat = (id) => (I18N[lang].patNames || I18N.en.patNames)[id] || id;
  L.mode = (id) => (I18N[lang].modes || I18N.en.modes)[id] || id;
  L.modeDesc = (id) => (I18N[lang].modeDesc || I18N.en.modeDesc)[id] || "";
  L.mission = (type, n) => ((I18N[lang].mission || I18N.en.mission)[type] || ((x) => type + " " + x))(n);
  L.ability = (k) => (I18N[lang].ability || I18N.en.ability)[k] || k;
  L.pu = (k) => (I18N[lang].pu || I18N.en.pu)[k] || k;
  L.botLv = (k) => (I18N[lang].botLv || I18N.en.botLv)[k] || k;
  L.tier = (k) => (I18N[lang].tier || I18N.en.tier)[k] || k;
  L.phaseText = (k) => (I18N[lang].phase || I18N.en.phase)[k] || "";
  L.map = (k) => (I18N[lang].maps || I18N.en.maps)[k] || k;
  L.unit = (k) => (I18N[lang].units || I18N.en.units)[k] || k;
  L.current = () => lang;
  L.set = (l) => { lang = l; Storage.setLang(l); L.apply(); };
  L.toggle = () => L.set(lang === "cs" ? "en" : "cs");
  L.apply = () => {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = L(el.dataset.i18n); });
    document.querySelectorAll("[data-i18n-ph]").forEach(el => { el.placeholder = L(el.dataset.i18nPh); });
  };
  return L;
})();
