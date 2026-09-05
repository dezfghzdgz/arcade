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
    drawSeconds: 12, spawnSeconds: 8,
    growBase: 3, growPerCell: 0.05, maxBase: 150, maxPerCell: 5,   // vojáci
    goldBase: 1, goldPerCell: 0.02, startGold: 100,                 // zlato
    costNeutral: 1.2, costEnemyBase: 2.5, attackSpeed: 26,
    boatSpeed: 30,        // polí/s
    nukeFlight: 3,        // s
    winShare: 0.6,
    tickRate: 20, snapRate: 5,
  },
  // jednotky a stavby: cena ve zlatě, popis efektu je v README
  units: {
    city:     { cost: 125, troopCap: 250, grow: 1.5 },
    defense:  { cost: 60,  radius: 7, mult: 2.5 },
    port:     { cost: 125 },
    silo:     { cost: 200 },
    sam:      { cost: 150, radius: 12, chance: 0.75 },
    factory:  { cost: 100, gold: 1.2 },
    warship:  { cost: 150, radius: 5 },
    atom:     { cost: 300,  radius: 7 },
    hydrogen: { cost: 900,  radius: 12 },
    mirv:     { cost: 2200, radius: 6, count: 5, spread: 18 },
  },
};
