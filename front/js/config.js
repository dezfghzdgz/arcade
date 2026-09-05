window.FR_CONFIG = {
  supabaseUrl: "", supabaseAnonKey: "", webUrl: "",
  admob: { androidBanner: "", androidRewarded: "", iosBanner: "", iosRewarded: "" },
  iap: {
    remove_ads: { id: "front_noads_monthly", coins: 0, price: "€3.99", subscription: true },
    coins_500:  { id: "front_coins_500",  coins: 500,  price: "€1.99" },
    coins_2000: { id: "front_coins_2000", coins: 2000, price: "€5.99" },
  },
  revenueCatEntitlement: "no_ads",
  stripe: { links: { remove_ads: "", coins_500: "", coins_2000: "" } },
  tuning: {
    maxPlayers: 8,
    drawSeconds: 10,      // fáze kreslení mapy (když je zapnutá)
    spawnSeconds: 8,      // výběr místa spawnu
    growBase: 3,        // vojáci/s základ
    growPerCell: 0.09,   // vojáci/s za každé pole území
    maxBase: 150, maxPerCell: 8,
    costNeutral: 1.2,     // cena za dobytí neutrálního pole
    costEnemyBase: 2.5,   // cena za nepřátelské pole + podíl obránců
    attackSpeed: 22,      // polí za sekundu na jeden útok (škáluje s velikostí útoku)
    winShare: 0.6,        // podíl mapy = výhra
    tickRate: 20, snapRate: 5,
  },
};
