// Texty hry. Výchozí angličtina; čeština se zapne přepínačem v menu (nebo automaticky podle jazyka telefonu).
// Nový jazyk = další klíč se stejnými položkami.
window.I18N = {
  en: {
    tagline: "Tap, flip, dodge. How long can you last?",
    best: "Best", play: "Play", leaderboard: "Leaderboard", shop: "Shop",
    sound: "Sound", music: "Music", on: "on", off: "off",
    crashed: "Crashed", newBest: "New best!", combo: "Combo",
    continueAd: "Continue", watchAd: "watch an ad", retry: "Retry", menu: "Menu",
    worldRank: (r) => `#${r} worldwide`, adUnavailable: "Ad not available",
    yourName: "Your name", save: "Save", nameSaved: "Name saved",
    loading: "Loading…", lbOffline: (b) => `Online leaderboard isn't set up yet (see README). Your best: ${b}`,
    lbError: "Couldn't load the leaderboard. Try again in a moment.", lbEmpty: "Nobody here yet. Play a run and be the first.",
    you: (r, s) => `You: #${r}, ${s} points`, player: "Player",
    purchases: "Purchases", removeAds: "Remove ads", gems: (n) => `${n} gems`,
    restore: "Restore purchases", restored: "Purchases restored", nothingToRestore: "Nothing to restore",
    stripeNote: "Payment opens on Stripe and brings you back to the game.",
    done: "Done", purchaseActive: "Purchase activated",
    unlocked: (n) => `${n} unlocked`, missingGems: (n) => `${n} more gems needed`,
    tabs: { skin: "Colors", shape: "Shapes", aura: "Auras", fx: "Effects", bg: "Backgrounds" },
    close: "close!", shield: "shield", shieldSaved: "shield saved you", hint: "tap to flip",
    mockAd: "Simulated ad", mockAdNote: "(AdMob rewarded video plays here on mobile)",
    mockBuy: (k) => `Simulated purchase: ${k}. Confirm?`, banner: "ad banner",
    lang: "Čeština", vibrate: "Vibration",
    missions: "Daily missions", missionsDone: "All done for today – come back tomorrow.", reward: "reward",
    missionDone: (n) => `Mission complete: +${n} gems`,
    dailyBonus: (n, d) => `Daily bonus +${n} gems (day ${d} in a row)`,
    mission: {
      score: (n) => `Score ${n} in one run`, combo: (n) => `Reach a ${n} combo`, gems: (n) => `Collect ${n} gems`,
      near: (n) => `${n} close calls`, bounce: (n) => `Bounce ${n} times`, runs: (n) => `Play ${n} runs`, fever: (n) => `Enter FEVER ${n}×`,
    },
    share: "Share", shareText: (s) => `I scored ${s} in ZigDash. Beat me: `, copied: "Copied to clipboard",
    perMonth: "/month", subActive: (d) => `Ad-free until ${d}`,
  },
  cs: {
    tagline: "Ťukni, otoč se, uhni. Kdy se rozbiješ?",
    best: "Rekord", play: "Hrát", leaderboard: "Žebříček", shop: "Obchod",
    sound: "Zvuk", music: "Hudba", on: "zap", off: "vyp",
    crashed: "Rozbito", newBest: "Nový rekord!", combo: "Combo",
    continueAd: "Pokračovat", watchAd: "zhlédni reklamu", retry: "Znovu", menu: "Menu",
    worldRank: (r) => `Celosvětově ${r}. místo`, adUnavailable: "Reklama není k dispozici",
    yourName: "Tvoje jméno", save: "Uložit", nameSaved: "Jméno uloženo",
    loading: "Načítám…", lbOffline: (b) => `Online žebříček ještě není zapojený (viz README). Tvůj rekord: ${b}`,
    lbError: "Žebříček se nepodařilo načíst. Zkus to za chvíli.", lbEmpty: "Zatím tu nikdo není. Zahraj si a buď první.",
    you: (r, s) => `Ty: ${r}. místo, ${s} bodů`, player: "Hráč",
    purchases: "Nákupy", removeAds: "Bez reklam", gems: (n) => `${n} gemů`,
    restore: "Obnovit nákupy", restored: "Nákupy obnoveny", nothingToRestore: "Není co obnovit",
    stripeNote: "Platba proběhne na stránce Stripe a vrátí tě zpět do hry.",
    done: "Hotovo", purchaseActive: "Nákup aktivován",
    unlocked: (n) => `${n} odemčeno`, missingGems: (n) => `Chybí ${n} gemů`,
    tabs: { skin: "Barvy", shape: "Tvary", aura: "Aury", fx: "Efekty", bg: "Pozadí" },
    close: "těsně!", shield: "štít", shieldSaved: "štít tě zachránil", hint: "ťuknutím se otočíš",
    mockAd: "Simulovaná reklama", mockAdNote: "(na mobilu tu bude AdMob rewarded video)",
    mockBuy: (k) => `Simulovaný nákup: ${k}. Potvrdit?`, banner: "reklamní banner",
    lang: "English", vibrate: "Vibrace",
    missions: "Denní úkoly", missionsDone: "Vše splněno – zítra budou nové.", reward: "odměna",
    missionDone: (n) => `Úkol splněn: +${n} gemů`,
    dailyBonus: (n, d) => `Denní bonus +${n} gemů (${d}. den v řadě)`,
    mission: {
      score: (n) => `Dej ${n} bodů v jednom běhu`, combo: (n) => `Dosáhni combo ${n}`, gems: (n) => `Seber ${n} gemů`,
      near: (n) => `${n}× těsný průlet`, bounce: (n) => `${n}× odraz od stěny`, runs: (n) => `Zahraj ${n} běhů`, fever: (n) => `${n}× spusť FEVER`,
    },
    share: "Sdílet", shareText: (s) => `Dal jsem ${s} bodů v ZigDash. Překonej mě: `, copied: "Zkopírováno do schránky",
    perMonth: "/měsíc", subActive: (d) => `Bez reklam do ${d}`,
  },
};

window.Lang = (() => {
  let lang = Storage.lang || "en";
  const L = (key, ...args) => {
    const v = (I18N[lang] && I18N[lang][key]) ?? I18N.en[key] ?? key;
    return typeof v === "function" ? v(...args) : v;
  };
  L.tab = (kind) => (I18N[lang].tabs || I18N.en.tabs)[kind];
  L.mission = (type, n) => ((I18N[lang].mission || I18N.en.mission)[type] || ((x) => type + " " + x))(n);
  L.itemName = (item) => (lang === "cs" && item.cs) || item.name;
  L.current = () => lang;
  L.set = (l) => { lang = l; Storage.setLang(l); L.apply(); };
  L.toggle = () => L.set(lang === "en" ? "cs" : "en");
  L.apply = () => {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = L(el.dataset.i18n); });
    document.querySelectorAll("[data-i18n-ph]").forEach(el => { el.placeholder = L(el.dataset.i18nPh); });
  };
  return L;
})();
