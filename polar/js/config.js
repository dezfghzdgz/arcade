window.PL_CONFIG = {
  supabaseUrl: "", supabaseAnonKey: "", webUrl: "",
  admob: { androidBanner: "ca-app-pub-3940256099942544/6300978111", androidRewarded: "ca-app-pub-3940256099942544/5224354917", iosBanner: "ca-app-pub-3940256099942544/2934735716", iosRewarded: "ca-app-pub-3940256099942544/1712485313" },
  iap: {
    remove_ads: { id: "polar_noads_monthly", coins: 0, price: "€3.99", subscription: true },
    coins_500:  { id: "polar_coins_500",  coins: 500,  price: "€1.99" },
    coins_2000: { id: "polar_coins_2000", coins: 2000, price: "€5.99" },
  },
  revenueCatEntitlement: "no_ads",
  stripe: { links: { remove_ads: "", coins_500: "", coins_2000: "" } },
  tuning: {
    roundSeconds: 60, maxPlayers: 8,
    speed: 125,           // px/s
    flipCooldown: 0.25,   // s mezi přepnutím pólu
    magnetRange: 120,     // dosah síly mezi hráči
    coinRange: 110,       // dosah síly na mince
    force: 900000,        // síla magnetu (dělí se d^2)
    coinForce: 520000,
    coinsOnField: 12,
    knockSpeed: 230,      // relativní rychlost nárazu, od které vypadnou mince
    pitLoss: 0.5,         // podíl mincí ztracených pádem do díry
    powerupEvery: 8,
    tickRate: 30, snapRate: 8,
  },
};
