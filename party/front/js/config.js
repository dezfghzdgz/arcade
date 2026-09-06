window.FR_CONFIG = {
  supabaseUrl: "https://ofozkelnipwozpukbdfg.supabase.co", supabaseAnonKey: "sb_publishable_o8I4CvJRiM3IeXUI2V24cQ_wEUoYKt4", webUrl: "",
  admob: { androidBanner: "", androidRewarded: "", iosBanner: "", iosRewarded: "" },
  iap: {
    remove_ads: { id: "front_noads_monthly", coins: 0, price: "€3.99", subscription: true },
    coins_500:  { id: "front_coins_500",  coins: 500,  price: "€1.99" },
    coins_2000: { id: "front_coins_2000", coins: 2000, price: "€5.99" },
  },
  revenueCatEntitlement: "no_ads",
  stripe: { links: { remove_ads: "", coins_500: "", coins_2000: "" } },
  tuning: {
    maxPlayers: 8, maxNations: 64,   // lidí max 8, s boty až 64 národů
    drawSeconds: 12, spawnSeconds: 8,
    growBase: 4, growPerCell: 0.035, maxBase: 200, maxPerCell: 3.5,   // vojáci
    goldBase: 1.5, goldPerCell: 0.02, startGold: 250,                 // zlato ze základu (zbytek dělníci, obchod, vlaky)
    workerGold: 0.05,     // zlato/s za pole území × podíl dělníků
    tradeEvery: 9, tradeSpeed: 9, tradeGold: 1.4,   // obchodní lodě: interval spawnu, rychlost, zlato za pole vzdálenosti
    trainEvery: 6, trainSpeed: 22, trainGold: 0.7, trainRange: 140,
    allianceSeconds: 600,
    costNeutral: 0.8, costEnemyBase: 1.8, attackSpeed: 45,
    boatSpeed: 14,        // polí/s (lodě jedou pomalu jako v originále)
    nukeFlight: 3,        // s
    winShare: 0.6,
    tickRate: 20, snapRate: 5,
  },
  // jednotky a stavby: cena ve zlatě, popis efektu je v README
  units: {
    city:     { cost: 125, troopCap: 250, grow: 1.5, trainGold: 30 },
    defense:  { cost: 60,  radius: 10, mult: 2.5 },
    port:     { cost: 125, trainGold: 40 },
    silo:     { cost: 150 },
    sam:      { cost: 150, radius: 18, chance: 0.75 },
    factory:  { cost: 125 },
    warship:  { cost: 150, radius: 8 },
    atom:     { cost: 250,  radius: 10 },
    hydrogen: { cost: 800,  radius: 18 },
    mirv:     { cost: 2000, radius: 9, count: 5, spread: 26 },
  },
};
