window.I18N = {
  en: { tagline: "One draws, everyone guesses. Live.", yourName: "Your name", createRoom: "Create room", joinRoom: "Join", lobby: "Room", copyLink: "Copy link", share: "Share", copied: "Link copied",
    players: (n, m) => `Players ${n}/${m}`, start: "Start", leave: "Leave", waitingHost: "Waiting for the host to start…", hostLeft: "The host left.", notFound: "Room not found.", connecting: "Connecting…", roomFull: "Room is full.", you: "you", host: "host",
    needTwo: "Need at least 2 players", speed: "Draw time", speeds: { fast: "50 s", normal: "70 s", slow: "100 s" }, sound: "Sound", on: "on", off: "off", lang: "Čeština",
    chooseWord: "Choose a word", fill: "Fill", eraser: "Eraser", undo: "Undo", clear: "Clear", guessPh: "Type your guess…", send: "Send", round: (r, n) => `Round ${r}/${n}`, isDrawing: (n) => `${n} is drawing`, youDraw: "You draw!", choosing: (n) => `${n} is choosing a word…`, correct: (n) => `${n} guessed it!`, close: "Close!", wordWas: (w) => `The word was: ${w}`, results: "Final", playAgain: "Play again", waitingOthers: "Waiting for others", backMenu: "Menu", shareRoom: (c) => `Come play Sketch! Code: ${c} `, pts: (n) => `${n} pts`, timeUp: "Time's up!", everyoneGot: "Everyone got it!" },
  cs: { tagline: "Jeden kreslí, ostatní hádají. Naživo.", yourName: "Tvoje jméno", createRoom: "Založit místnost", joinRoom: "Připojit se", lobby: "Místnost", copyLink: "Kopírovat odkaz", share: "Sdílet", copied: "Odkaz zkopírován",
    players: (n, m) => `Hráči ${n}/${m}`, start: "Start", leave: "Odejít", waitingHost: "Čekej, až hostitel odstartuje…", hostLeft: "Hostitel odešel.", notFound: "Místnost nenalezena.", connecting: "Připojuju…", roomFull: "Místnost je plná.", you: "ty", host: "host",
    needTwo: "Aspoň 2 hráči", speed: "Čas na kreslení", speeds: { fast: "50 s", normal: "70 s", slow: "100 s" }, sound: "Zvuk", on: "zap", off: "vyp", lang: "English",
    chooseWord: "Vyber slovo", fill: "Výplň", eraser: "Guma", undo: "Zpět", clear: "Smazat", guessPh: "Napiš tip…", send: "Poslat", round: (r, n) => `Kolo ${r}/${n}`, isDrawing: (n) => `Kreslí ${n}`, youDraw: "Kreslíš ty!", choosing: (n) => `${n} vybírá slovo…`, correct: (n) => `${n} to uhodl!`, close: "Blízko!", wordWas: (w) => `Slovo bylo: ${w}`, results: "Konečné pořadí", playAgain: "Hrát znovu", waitingOthers: "Čekám na ostatní", backMenu: "Menu", shareRoom: (c) => `Pojď hrát Sketch! Kód: ${c} `, pts: (n) => `${n} b.`, timeUp: "Čas vypršel!", everyoneGot: "Všichni uhodli!" },
};
window.Lang = (() => {
  let lang = Storage.lang || "en";
  const L = (key, ...args) => { const v = (I18N[lang] && I18N[lang][key]) ?? I18N.en[key] ?? key; return typeof v === "function" ? v(...args) : v; };
  L.speed = (k) => (I18N[lang].speeds || I18N.en.speeds)[k] || k; L.current = () => lang;
  L.set = (l) => { lang = l; Storage.setLang(l); L.apply(); }; L.toggle = () => L.set(lang === "cs" ? "en" : "cs");
  L.apply = () => { document.documentElement.lang = lang; document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = L(el.dataset.i18n); }); document.querySelectorAll("[data-i18n-ph]").forEach(el => { el.placeholder = L(el.dataset.i18nPh); }); };
  return L;
})();
