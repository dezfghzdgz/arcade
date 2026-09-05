// Jediné místo, kde se vyplňují klíče.
window.SZ_CONFIG = {
  // Supabase – používá se pro MULTIPLAYER (Realtime kanály) i pro nákupy z webu.
  // Když je prázdné, hra běží jen solo proti botům + "místní" multiplayer mezi taby jednoho prohlížeče (pro vývoj).
  supabaseUrl: "",
  supabaseAnonKey: "",

  // URL webové verze – do sdíleného odkazu na místnost (prázdné = aktuální adresa)
  webUrl: "",

  // AdMob (testovací ID Googlu, před vydáním nahraď)
  admob: {
    androidBanner: "ca-app-pub-3940256099942544/6300978111",
    androidRewarded: "ca-app-pub-3940256099942544/5224354917",
    iosBanner: "ca-app-pub-3940256099942544/2934735716",
    iosRewarded: "ca-app-pub-3940256099942544/1712485313",
  },
  iap: {
    remove_ads: { id: "splatz_noads_monthly", coins: 0,    price: "€3.99", subscription: true },
    coins_500:  { id: "splatz_coins_500",     coins: 500,  price: "€1.99" },
    coins_2000: { id: "splatz_coins_2000",    coins: 2000, price: "€5.99" },
  },
  revenueCatEntitlement: "no_ads",
  stripe: { links: { remove_ads: "", coins_500: "", coins_2000: "" } },

  // Herní ladění
  tuning: {
    roundSeconds: 60,
    maxPlayers: 8,
    speed: 115,          // px/s na nepobarveném
    speedOwn: 140,       // na vlastní barvě
    speedEnemy: 78,      // na cizí barvě
    dashSpeed: 340,
    dashTime: 0.2,
    dashCooldown: 1.3,
    stunTime: 0.9,
    paintRadius: 10,     // px pod hráčem
    dashSplash: 16,      // px cákanec při dashi
    bombRadius: 42,
    powerupEvery: 7,     // s
    tickRate: 30,        // simulace na hostiteli
    snapRate: 8,         // kolikrát za s posílá hostitel stav
  },
};
