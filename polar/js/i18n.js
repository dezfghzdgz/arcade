window.I18N = {
  cs: {
    tagline: "Přepni pól. Přitáhni mince. Stáhni soupeře do díry.", yourName: "Tvoje jméno",
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
    hintMobile: "Táhni prstem = pohyb · FLIP = přepnout pól", hintPc: "WASD / šipky = pohyb · mezerník = přepnout pól",
    stats: (g, w, b) => `Her ${g} · výher ${w} · nejvíc ${b} mincí`, shareRoom: (c) => `Pojď hrát Polar! Kód: ${c} `,
    hatNames: { none: "Nic", cap: "Kšiltovka", crown: "Koruna", horns: "Rohy", halo: "Svatozář", antenna: "Anténa", headphones: "Sluchátka", tophat: "Cylindr", bow: "Mašle", sprout: "Klíček", helmet: "Helma", party: "Party", beanie: "Kulich", flower: "Kytka", cat: "Kočka", chef: "Kuchař", pirate: "Pirát", viking: "Viking", wizard: "Kouzelník" },
    patNames: { none: "Nic", stripes: "Pruhy", dots: "Puntíky", ring: "Prstenec", half: "Půlka", star: "Hvězda", heart: "Srdce", checker: "Šachovnice" },
    modes: { coins: "Mince", team: "Týmy 4v4", sumo: "Sumo" },
    modeDesc: { coins: "Přitáhni si nejvíc mincí. Náraz nebo díra ti je vezmou.", team: "Dva týmy, mince se sčítají", sumo: "Žádné mince – body za shození soupeře do díry a vyražení" },
    mode: "Mód", length: "Délka", seconds: (n) => `${n} s`, color: "Barva", colorAuto: "náhodná",
    missions: "Úkoly", dailyT: "Denní", weeklyT: "Týdenní", missionDone: (n) => `Úkol splněn: +${n} mincí`, dailyBonus: (n, d) => `Denní bonus +${n} mincí (${d}. den v řadě)`,
    mission: { games: (n) => `Odehraj ${n} her`, wins: (n) => `Vyhraj ${n}×`, coins: (n) => `Seber ${n} mincí`, best: (n) => `Skonči s ${n} mincemi v jedné hře`, kos: (n) => `Vyraz ${n}× soupeře`, flips: (n) => `Přepni pól ${n}×`, powerups: (n) => `Seber ${n} schopností`, top3: (n) => `Skonči ${n}× v top 3` },
    ability: { magnet: "Silný magnet! 6 s", shield: "Štít! 6 s", vacuum: "Vysavač!", heavy: "Těžký! 6 s", scramble: "Přepólováno!" },
    ko: (a, b) => `${a} shodil ${b}`, capture: (n) => `${n} +1`, teamA: "Tým Korál", teamB: "Tým Akva", teamWin: (t) => `${t} vyhrává!`,
    hats: "Klobouky", patterns: "Vzory", vibrate: "Vibrace", hostSettings: "Nastavení kola",
    target: "Cíl", timeOnly: "jen čas", pts: (n) => `${n} b.`, abilities: "Schopnosti", bots: "Boti",
    pu: { none: "žádné", rare: "málo", normal: "normálně", many: "hodně" }, botLv: { easy: "lehcí", mid: "střední", hard: "těžcí", mix: "mix" },
    tier: { easy: "noob", mid: "ok", hard: "pro" }, bombAura: "Bomba! 5 s aura",
  },
  en: {
    tagline: "Flip your pole. Pull coins. Drag rivals into pits.", yourName: "Your name",
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
    hintMobile: "Drag = move · FLIP = switch pole", hintPc: "WASD / arrows = move · space = switch pole",
    stats: (g, w, b) => `Games ${g} · wins ${w} · best ${b} coins`, shareRoom: (c) => `Come play Polar! Code: ${c} `,
    hatNames: { none: "None", cap: "Cap", crown: "Crown", horns: "Horns", halo: "Halo", antenna: "Antenna", headphones: "Headphones", tophat: "Top hat", bow: "Bow", sprout: "Sprout", helmet: "Helmet", party: "Party", beanie: "Beanie", flower: "Flower", cat: "Cat", chef: "Chef", pirate: "Pirate", viking: "Viking", wizard: "Wizard" },
    patNames: { none: "None", stripes: "Stripes", dots: "Dots", ring: "Ring", half: "Half", star: "Star", heart: "Heart", checker: "Checker" },
    modes: { coins: "Coins", team: "Teams 4v4", sumo: "Sumo" },
    modeDesc: { coins: "Pull in the most coins. Crashes and pits take them away.", team: "Two teams, coins add up", sumo: "No coins – points for knocking rivals into pits and crashes" },
    mode: "Mode", length: "Length", seconds: (n) => `${n} s`, color: "Color", colorAuto: "random",
    missions: "Missions", dailyT: "Daily", weeklyT: "Weekly", missionDone: (n) => `Mission complete: +${n} coins`, dailyBonus: (n, d) => `Daily bonus +${n} coins (day ${d} in a row)`,
    mission: { games: (n) => `Play ${n} games`, wins: (n) => `Win ${n} times`, coins: (n) => `Collect ${n} coins`, best: (n) => `Finish with ${n} coins in one game`, kos: (n) => `Knock rivals ${n} times`, flips: (n) => `Flip your pole ${n} times`, powerups: (n) => `Grab ${n} abilities`, top3: (n) => `Finish top 3 ${n} times` },
    ability: { magnet: "Strong magnet! 6 s", shield: "Shield! 6 s", vacuum: "Vacuum!", heavy: "Heavy! 6 s", scramble: "Scrambled!" },
    ko: (a, b) => `${a} sank ${b}`, capture: (n) => `${n} +1`, teamA: "Team Coral", teamB: "Team Aqua", teamWin: (t) => `${t} wins!`,
    hats: "Hats", patterns: "Patterns", vibrate: "Vibration", hostSettings: "Round settings",
    target: "Target", timeOnly: "time only", pts: (n) => `${n} pts`, abilities: "Abilities", bots: "Bots",
    pu: { none: "none", rare: "rare", normal: "normal", many: "many" }, botLv: { easy: "easy", mid: "medium", hard: "hard", mix: "mix" },
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
