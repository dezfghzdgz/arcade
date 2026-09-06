window.I18N = {
  cs: {
    tagline: "Horký brambor. Předej bombu dřív, než bouchne.", yourName: "Tvoje jméno",
    playBots: "Hrát s boty", createRoom: "Založit místnost", joinRoom: "Připojit se", roomCode: "Kód místnosti",
    shop: "Obchod", sound: "Zvuk", on: "zap", off: "vyp", lang: "English",
    lobby: "Místnost", copyLink: "Kopírovat odkaz", share: "Sdílet", copied: "Odkaz zkopírován",
    players: (n, m) => `Hráči ${n}/${m}`, fillBots: "Doplnit boty", start: "Start", leave: "Odejít",
    waitingHost: "Čekej, až hostitel odstartuje…", hostLeft: "Hostitel odešel z místnosti.", notFound: "Místnost nenalezena. Zkontroluj kód.",
    connecting: "Připojuju…", roomFull: "Místnost je plná.", you: "ty", host: "host", bot: "bot",
    go: "JEĎ!", timeUp: "KONEC", winner: (n) => `${n} vyhrává!`, youWin: "Vyhrál jsi!", draw: "Remíza",
    results: "Výsledky", coinsEarned: (n) => `+${n} mincí`, doubleAd: "Zdvojnásobit za reklamu", again: "Znovu", playAgain: "Hrát znovu", waitingOthers: "Čekám na ostatní", backMenu: "Menu",
    nextRound: "Hostitel může spustit další kolo", waitNext: "Čekej na další kolo…",
    hats: "Klobouky", purchases: "Nákupy", removeAds: "Bez reklam", perMonth: "/měsíc", subActive: (d) => `Bez reklam do ${d}`,
    coins: (n) => `${n} mincí`, restore: "Obnovit nákupy", restored: "Nákupy obnoveny", nothingToRestore: "Není co obnovit",
    done: "Hotovo", unlocked: (n) => `${n} odemčeno`, missingCoins: (n) => `Chybí ${n} mincí`, purchaseActive: "Nákup aktivován",
    stripeNote: "Platba proběhne na stránce Stripe a vrátí tě zpět do hry.", adUnavailable: "Reklama není k dispozici",
    mockAd: "Simulovaná reklama", mockAdNote: "(na mobilu tu bude AdMob rewarded video)", mockBuy: (k) => `Simulovaný nákup: ${k}. Potvrdit?`, banner: "reklamní banner",
    hintMobile: "Táhni prstem = pohyb · dash = odraz nebo únik", hintPc: "WASD / šipky = pohyb · mezerník = dash",
    stats: (g, w, b) => `Her ${g} · výher ${w} · nejvíc ${b} %`, shareRoom: (c) => `Pojď hrát Boom! Kód: ${c} `,
    hatNames: { none: "Nic", cap: "Kšiltovka", crown: "Koruna", horns: "Rohy", halo: "Svatozář", antenna: "Anténa", headphones: "Sluchátka", tophat: "Cylindr", bow: "Mašle", sprout: "Klíček", helmet: "Helma", party: "Party", beanie: "Kulich", flower: "Kytka", cat: "Kočka", chef: "Kuchař", pirate: "Pirát", viking: "Viking", wizard: "Kouzelník" },
    patNames: { none: "Nic", stripes: "Pruhy", dots: "Puntíky", ring: "Prstenec", half: "Půlka", star: "Hvězda", heart: "Srdce", checker: "Šachovnice" },
    modes: { classic: "Klasika", chaos: "Chaos", shrink: "Zóna", teams: "Týmy", hunter: "Lovec" }, out: (n) => `${n} vyletěl`, gotBomb: "MÁŠ BOMBU!", roundWin: (n) => `${n} vyhrál kolo`,
    modeDesc: { classic: "Jedna bomba. Dotykem ji předáš. Komu bouchne, vypadává. Poslední = 3 body, první na 6 vyhrává.", chaos: "Dvě bomby najednou.", shrink: "Aréna se zmenšuje. Kdo zůstane venku, vypadá.", teams: "Dva týmy, bombu lze předat jen soupeři. Vyhrává tým, který přežije.", hunter: "Bomba nebouchá: kdo ji drží, sbírá body. Seber ji dotykem. 60 s." },
    mode: "Mód", length: "Délka", seconds: (n) => `${n} s`, color: "Barva", colorAuto: "náhodná",
    missions: "Úkoly", dailyT: "Denní", weeklyT: "Týdenní", missionDone: (n) => `Úkol splněn: +${n} mincí`, dailyBonus: (n, d) => `Denní bonus +${n} mincí (${d}. den v řadě)`,
    mission: { games: (n) => `Odehraj ${n} her`, wins: (n) => `Vyhraj ${n}×`, paint: (n) => `Pobarvi ${n} % v jedné hře`, kos: (n) => `Dej ${n} KO`, dashes: (n) => `Použij ${n}× dash`, powerups: (n) => `Seber ${n} schopností`, captures: (n) => `Získej ${n} cílů v Závodě`, top3: (n) => `Skonči ${n}× v top 3` },
    ability: { bomb: "Bomba! Za 5 s bouchne", speed: "Rychlost!", shield: "Štít!", giant: "Obr!", gun: "Zbraň – 3 rány", freeze: "Zmrazeno!", frenzy: "Nekonečný dash! 3 s" },
    ko: (a, b) => `${a} KO ${b}`, capture: (n) => `${n} +1`, teamA: "Tým Korál", teamB: "Tým Akva", teamWin: (t) => `${t} vyhrává!`,
    hats: "Klobouky", patterns: "Vzory", vibrate: "Vibrace", hostSettings: "Nastavení kola",
    target: "Cíl", timeOnly: "jen čas", pts: (n) => `${n} b.`, abilities: "Schopnosti", bots: "Boti",
    pu: { none: "žádné", rare: "málo", normal: "normálně", many: "hodně" }, botLv: { easy: "lehcí", mid: "střední", hard: "těžcí", mix: "mix" },
    tier: { easy: "noob", mid: "ok", hard: "pro" }, bombAura: "Bomba! 5 s aura",
  },
  en: {
    tagline: "Hot potato. Pass the bomb before it blows.", yourName: "Your name",
    playBots: "Play vs bots", createRoom: "Create room", joinRoom: "Join", roomCode: "Room code",
    shop: "Shop", sound: "Sound", on: "on", off: "off", lang: "Čeština",
    lobby: "Room", copyLink: "Copy link", share: "Share", copied: "Link copied",
    players: (n, m) => `Players ${n}/${m}`, fillBots: "Fill with bots", start: "Start", leave: "Leave",
    waitingHost: "Waiting for the host to start…", hostLeft: "The host left the room.", notFound: "Room not found. Check the code.",
    connecting: "Connecting…", roomFull: "Room is full.", you: "you", host: "host", bot: "bot",
    go: "GO!", timeUp: "TIME", winner: (n) => `${n} wins!`, youWin: "You win!", draw: "Draw",
    results: "Results", coinsEarned: (n) => `+${n} coins`, doubleAd: "Double with an ad", again: "Again", playAgain: "Play again", waitingOthers: "Waiting for others", backMenu: "Menu",
    nextRound: "Host can start the next round", waitNext: "Waiting for the next round…",
    hats: "Hats", purchases: "Purchases", removeAds: "Remove ads", perMonth: "/month", subActive: (d) => `Ad-free until ${d}`,
    coins: (n) => `${n} coins`, restore: "Restore purchases", restored: "Purchases restored", nothingToRestore: "Nothing to restore",
    done: "Done", unlocked: (n) => `${n} unlocked`, missingCoins: (n) => `${n} more coins needed`, purchaseActive: "Purchase activated",
    stripeNote: "Payment opens on Stripe and brings you back to the game.", adUnavailable: "Ad not available",
    mockAd: "Simulated ad", mockAdNote: "(AdMob rewarded video plays here on mobile)", mockBuy: (k) => `Simulated purchase: ${k}. Confirm?`, banner: "ad banner",
    hintMobile: "Drag = move · dash = shove or escape", hintPc: "WASD / arrows = move · space = dash",
    stats: (g, w, b) => `Games ${g} · wins ${w} · best ${b}%`, shareRoom: (c) => `Come play Boom! Code: ${c} `,
    hatNames: { none: "None", cap: "Cap", crown: "Crown", horns: "Horns", halo: "Halo", antenna: "Antenna", headphones: "Headphones", tophat: "Top hat", bow: "Bow", sprout: "Sprout", helmet: "Helmet", party: "Party", beanie: "Beanie", flower: "Flower", cat: "Cat", chef: "Chef", pirate: "Pirate", viking: "Viking", wizard: "Wizard" },
    patNames: { none: "None", stripes: "Stripes", dots: "Dots", ring: "Ring", half: "Half", star: "Star", heart: "Heart", checker: "Checker" },
    modes: { classic: "Classic", chaos: "Chaos", shrink: "Zone", teams: "Teams", hunter: "Hunter" }, out: (n) => `${n} is out`, gotBomb: "YOU HAVE THE BOMB!", roundWin: (n) => `${n} wins the round`,
    modeDesc: { classic: "One bomb. Touch to pass it. Whoever holds it when it blows is out. Last one standing = 3 pts, first to 6 wins.", chaos: "Two bombs at once.", shrink: "The arena shrinks. Stay outside and you're out.", teams: "Two teams, the bomb can only be passed to the enemy. Surviving team wins.", hunter: "The bomb never blows: whoever holds it scores. Steal it by touch. 60 s." },
    mode: "Mode", length: "Length", seconds: (n) => `${n} s`, color: "Color", colorAuto: "random",
    missions: "Missions", dailyT: "Daily", weeklyT: "Weekly", missionDone: (n) => `Mission complete: +${n} coins`, dailyBonus: (n, d) => `Daily bonus +${n} coins (day ${d} in a row)`,
    mission: { games: (n) => `Play ${n} games`, wins: (n) => `Win ${n} times`, paint: (n) => `Cover ${n}% in one game`, kos: (n) => `Score ${n} KOs`, dashes: (n) => `Dash ${n} times`, powerups: (n) => `Grab ${n} abilities`, captures: (n) => `Capture ${n} targets in Race`, top3: (n) => `Finish top 3 ${n} times` },
    ability: { bomb: "Bomb! Blows in 5 s", speed: "Speed!", shield: "Shield!", giant: "Giant!", gun: "Gun – 3 shots", freeze: "Frozen!", frenzy: "Unlimited dash! 3 s" },
    ko: (a, b) => `${a} KO'd ${b}`, capture: (n) => `${n} +1`, teamA: "Team Coral", teamB: "Team Aqua", teamWin: (t) => `${t} wins!`,
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
