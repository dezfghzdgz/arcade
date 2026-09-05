// Jediné místo, kde se vyplňují klíče. Nic z toho není tajné (anon key Supabase
// je veřejný by design, ochrana běží přes RLS + RPC – viz supabase/schema.sql).
window.ZD_CONFIG = {
  // Supabase projekt pro žebříček. Když necháš prázdné, hra běží jen s lokálním rekordem.
  supabaseUrl: "https://ofozkelnipwozpukbdfg.supabase.co",       // např. "https://xyzabc.supabase.co"
  supabaseAnonKey: "sb_publishable_o8I4CvJRiM3IeXUI2V24cQ_wEUoYKt4",   // Project settings -> API -> anon public

  // AdMob (Capacitor plugin @capacitor-community/admob). Testovací ID Googlu jsou vyplněné,
  // před vydáním nahraď svými.
  admob: {
    androidBanner: "ca-app-pub-3940256099942544/6300978111",
    androidRewarded: "ca-app-pub-3940256099942544/5224354917",
    iosBanner: "ca-app-pub-3940256099942544/2934735716",
    iosRewarded: "ca-app-pub-3940256099942544/1712485313",
  },

  // ID produktů, které založíš v App Store Connect / Google Play Console.
  // Ceny zde jsou jen zobrazovací pro web; v mobilní appce se načtou skutečné ze storu.
  // remove_ads je MĚSÍČNÍ PŘEDPLATNÉ: ve storech založ auto-renewable subscription, ve Stripe recurring produkt.
  iap: {
    remove_ads: { id: "zigdash_noads_monthly", gems: 0,    price: "€3.99", subscription: true },
    gems_500:   { id: "zigdash_gems_500",      gems: 500,  price: "€1.99" },
    gems_2000:  { id: "zigdash_gems_2000",     gems: 2000, price: "€5.99" },
  },
  revenueCatEntitlement: "no_ads",   // název entitlementu v RevenueCat pro předplatné
  webUrl: "",                        // URL webové verze – používá se ve sdílení skóre (prázdné = aktuální adresa)

  // Hudba. Když je url prázdné, hraje generovaná syntezátorová smyčka (žádné soubory).
  // Chceš vlastní skladbu? Dej mp3/ogg do www/audio/ a nastav např. url: "audio/track.mp3".
  music: {
    url: "",
    volume: 0.5,
  },

  // Web verze: Stripe Payment Links (Stripe dashboard -> Payment links -> vytvoř pro každý produkt).
  // Do URL se automaticky přidá ?client_reference_id=<device>, webhook pak zapíše nárok do Supabase.
  stripe: {
    links: {
      remove_ads: "",   // např. "https://buy.stripe.com/xxxx"
      gems_500: "",
      gems_2000: "",
    },
  },

  // Herní ladění – tady se mění „pocit" hry.
  // Rychlost roste plynule po křivce: base + (max - base) * (1 - e^(-skóre / ramp)).
  // Čím vyšší ramp, tím pomalejší nárůst. Skóre ~ramp = zhruba 63 % cesty k maximu.
  tuning: {
    baseScroll: 140,      // px/s na startu
    maxScroll: 440,
    scrollRamp: 150,
    baseSideSpeed: 200,   // vodorovná rychlost kuličky
    maxSideSpeed: 390,
    sideRamp: 170,
    difficultyRamp: 160,  // jak rychle se zužují mezery a zahušťují překážky
    feverAt: 10,          // combo pro FEVER ×2
    feverAt2: 25,         // combo pro FEVER ×3
    gemValue: 5,
    nearMissBonus: 3,
  },
};
