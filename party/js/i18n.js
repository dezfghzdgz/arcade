window.I18N = {
  en: { tagline: "Quick minigames. Everyone on their own phone. 2–8 players.", yourName: "Your name", createRoom: "Create room", joinRoom: "Join", lobby: "Room", copyLink: "Copy link", share: "Share", copied: "Link copied",
    players: (n, m) => `Players ${n}/${m}`, start: "Start", leave: "Leave", waitingHost: "Waiting for the host to start…", hostLeft: "The host left.", notFound: "Room not found.", connecting: "Connecting…", roomFull: "Room is full.", you: "you", host: "host",
    needTwo: "Need at least 2 players", speed: "Rounds", speeds: { fast: "5", normal: "8", slow: "12" }, sound: "Sound", on: "on", off: "off", lang: "Čeština",
    round: (r, n) => `Round ${r}/${n}`, getReady: "Get ready…", results: "Final", playAgain: "Play again", waitingOthers: "Waiting for others", backMenu: "Menu", shareRoom: (c) => `Come play Party! Code: ${c} `, pts: (n) => `${n} pts`,
    g: { reflex: "Reflex", reflexHint: "Wait for green, then tap. Too early = out.", wait: "WAIT…", tap: "TAP!", early: "Too early!", ms: (n) => `${n} ms`,
         race: "Tap race", raceHint: "Tap as fast as you can for 5 seconds.", taps: (n) => `${n} taps`,
         math: "Quick math", mathHint: "First correct answer wins.", wrong: "Wrong!",
         color: "Color match", colorHint: "Tap the word whose COLOR matches the top word.",
         hold: "Hold 5 s", holdHint: "Hold the button and release at exactly 5.00 s.", holdOff: (n) => `${n} s off`,
         count: "Count the dots", countHint: "How many dots? First correct wins." } },
  cs: { tagline: "Rychlé minihry. Každý na svém mobilu. 2–8 hráčů.", yourName: "Tvoje jméno", createRoom: "Založit místnost", joinRoom: "Připojit se", lobby: "Místnost", copyLink: "Kopírovat odkaz", share: "Sdílet", copied: "Odkaz zkopírován",
    players: (n, m) => `Hráči ${n}/${m}`, start: "Start", leave: "Odejít", waitingHost: "Čekej, až hostitel odstartuje…", hostLeft: "Hostitel odešel.", notFound: "Místnost nenalezena.", connecting: "Připojuju…", roomFull: "Místnost je plná.", you: "ty", host: "host",
    needTwo: "Aspoň 2 hráči", speed: "Kola", speeds: { fast: "5", normal: "8", slow: "12" }, sound: "Zvuk", on: "zap", off: "vyp", lang: "English",
    round: (r, n) => `Kolo ${r}/${n}`, getReady: "Připrav se…", results: "Konečné pořadí", playAgain: "Hrát znovu", waitingOthers: "Čekám na ostatní", backMenu: "Menu", shareRoom: (c) => `Pojď hrát Party! Kód: ${c} `, pts: (n) => `${n} b.`,
    g: { reflex: "Reflex", reflexHint: "Počkej na zelenou a ťukni. Moc brzo = konec kola.", wait: "ČEKEJ…", tap: "TEĎ!", early: "Moc brzo!", ms: (n) => `${n} ms`,
         race: "Ťukací závod", raceHint: "Ťukej co nejrychleji 5 sekund.", taps: (n) => `${n} ťuknutí`,
         math: "Rychlá matika", mathHint: "První správná odpověď vyhrává.", wrong: "Špatně!",
         color: "Barvy", colorHint: "Ťukni na slovo, jehož BARVA odpovídá slovu nahoře.",
         hold: "Drž 5 s", holdHint: "Drž tlačítko a pusť přesně v 5,00 s.", holdOff: (n) => `${n} s vedle`,
         count: "Počítání teček", countHint: "Kolik je teček? První správně vyhrává." } },
};
window.Lang = (() => {
  let lang = Storage.lang || "en";
  const L = (key, ...args) => { const v = (I18N[lang] && I18N[lang][key]) ?? I18N.en[key] ?? key; return typeof v === "function" ? v(...args) : v; };
  L.g = (key, ...args) => { const v = (I18N[lang].g || I18N.en.g)[key] ?? key; return typeof v === "function" ? v(...args) : v; };
  L.speed = (k) => (I18N[lang].speeds || I18N.en.speeds)[k] || k; L.current = () => lang;
  L.set = (l) => { lang = l; Storage.setLang(l); L.apply(); }; L.toggle = () => L.set(lang === "cs" ? "en" : "cs");
  L.apply = () => { document.documentElement.lang = lang; document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = L(el.dataset.i18n); }); document.querySelectorAll("[data-i18n-ph]").forEach(el => { el.placeholder = L(el.dataset.i18nPh); }); };
  return L;
})();
