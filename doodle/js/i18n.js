window.I18N = {
  en: { tagline: "Write it. Draw it. Guess it. Laugh at the album.", yourName: "Your name", createRoom: "Create room", joinRoom: "Join", lobby: "Room", copyLink: "Copy link", share: "Share", copied: "Link copied",
    players: (n, m) => `Players ${n}/${m}`, start: "Start", leave: "Leave", waitingHost: "Waiting for the host to start…", hostLeft: "The host left.", notFound: "Room not found.", connecting: "Connecting…", roomFull: "Room is full.", you: "you", host: "host",
    needTwo: "Need at least 2 players", speed: "Timer", speeds: { fast: "fast", normal: "normal", slow: "slow" }, sound: "Sound", on: "on", off: "off", lang: "Čeština",
    writeTitle: "Write a sentence", writeHint: "Something weird. The next player has to draw it.", writePh: "e.g. A cat driving a bus in the rain", drawTitle: "Draw this:", guessTitle: "What is this?", guessPh: "Your guess…", done: "Done", waiting: (n) => `Waiting for ${n}…`, submitted: "Sent! Waiting for others.",
    undo: "Undo", clear: "Clear", eraser: "Eraser", brush: "Brush", album: (n) => `${n}'s album`, next: "Next", nextAlbum: "Next album", finish: "Finish", results: "That's all!", playAgain: "Play again", waitingOthers: "Waiting for others", backMenu: "Menu", wrote: "wrote", drew: "drew", guessed: "guessed", revealWait: "Host is showing the albums…", shareRoom: (c) => `Come play Doodle! Code: ${c} `, timeUp: "Time's up!" },
  cs: { tagline: "Napiš. Nakresli. Uhodni. Zasměj se u alba.", yourName: "Tvoje jméno", createRoom: "Založit místnost", joinRoom: "Připojit se", lobby: "Místnost", copyLink: "Kopírovat odkaz", share: "Sdílet", copied: "Odkaz zkopírován",
    players: (n, m) => `Hráči ${n}/${m}`, start: "Start", leave: "Odejít", waitingHost: "Čekej, až hostitel odstartuje…", hostLeft: "Hostitel odešel.", notFound: "Místnost nenalezena.", connecting: "Připojuju…", roomFull: "Místnost je plná.", you: "ty", host: "host",
    needTwo: "Aspoň 2 hráči", speed: "Časovač", speeds: { fast: "rychlý", normal: "normální", slow: "pomalý" }, sound: "Zvuk", on: "zap", off: "vyp", lang: "English",
    writeTitle: "Napiš větu", writeHint: "Něco divného. Další hráč to bude muset nakreslit.", writePh: "např. Kočka řídí autobus v dešti", drawTitle: "Nakresli:", guessTitle: "Co to je?", guessPh: "Tvůj tip…", done: "Hotovo", waiting: (n) => `Čekáme na ${n}…`, submitted: "Odesláno! Čekáme na ostatní.",
    undo: "Zpět", clear: "Smazat", eraser: "Guma", brush: "Štětec", album: (n) => `Album: ${n}`, next: "Další", nextAlbum: "Další album", finish: "Konec", results: "A to je vše!", playAgain: "Hrát znovu", waitingOthers: "Čekám na ostatní", backMenu: "Menu", wrote: "napsal", drew: "nakreslil", guessed: "hádal", revealWait: "Hostitel ukazuje alba…", shareRoom: (c) => `Pojď hrát Doodle! Kód: ${c} `, timeUp: "Čas vypršel!" },
};
window.Lang = (() => {
  let lang = Storage.lang || "en";
  const L = (key, ...args) => { const v = (I18N[lang] && I18N[lang][key]) ?? I18N.en[key] ?? key; return typeof v === "function" ? v(...args) : v; };
  L.speed = (k) => (I18N[lang].speeds || I18N.en.speeds)[k] || k; L.current = () => lang;
  L.set = (l) => { lang = l; Storage.setLang(l); L.apply(); }; L.toggle = () => L.set(lang === "cs" ? "en" : "cs");
  L.apply = () => { document.documentElement.lang = lang; document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = L(el.dataset.i18n); }); document.querySelectorAll("[data-i18n-ph]").forEach(el => { el.placeholder = L(el.dataset.i18nPh); }); };
  return L;
})();
