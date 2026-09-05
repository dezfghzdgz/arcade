window.TW_CONFIG = {
  supabaseUrl: "", supabaseAnonKey: "", webUrl: "",
  admob: { androidBanner: "ca-app-pub-3940256099942544/6300978111", androidRewarded: "ca-app-pub-3940256099942544/5224354917", iosBanner: "ca-app-pub-3940256099942544/2934735716", iosRewarded: "ca-app-pub-3940256099942544/1712485313" },
  iap: {
    remove_ads: { id: "tower_noads_monthly", coins: 0, price: "€3.99", subscription: true },
    coins_500:  { id: "tower_coins_500",  coins: 500,  price: "€1.99" },
    coins_2000: { id: "tower_coins_2000", coins: 2000, price: "€5.99" },
  },
  revenueCatEntitlement: "no_ads",
  stripe: { links: { remove_ads: "", coins_500: "", coins_2000: "" } },
  tuning: {
    maxPlayers: 8,
    gravity: 1900, jump: 640, speed: 220, airControl: 0.9,
    coyote: 0.09, jumpBuffer: 0.12,
    spring: 1.75,          // násobek skoku
    lavaStart: 4,          // s po startu
    lavaSpeed: 26,         // px/s, roste
    timeLimit: 150,        // pojistka v sekundách
    tickRate: 60, snapRate: 10,
    botSpeed: 0.55,        // rychlost bota = botSpeed + skill*0.3 (× rychlost hráče)
  },
};
