// Reklamy a nákupy za jednou fasádou. Na PC/webu běží "mock" – rewarded reklama je 3s odpočet,
// nákup se rovnou "povede". V nativní appce (Capacitor) se použijí skutečné pluginy:
//   - reklamy:  @capacitor-community/admob       (Capacitor.Plugins.AdMob)
//   - nákupy:   @revenuecat/purchases-capacitor  (Capacitor.Plugins.Purchases)
// Postup zapojení je v README.
window.Monetization = (() => {
  const cap = window.Capacitor;
  const native = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  const platform = cap && cap.getPlatform ? cap.getPlatform() : "web";
  const AdMob = native && cap.Plugins ? cap.Plugins.AdMob : null;
  const Purchases = native && cap.Plugins ? cap.Plugins.Purchases : null;
  const cfg = DD_CONFIG;

  let bannerVisible = false;
  let rewardedReady = false;
  let initialized = false;

  async function init() {
    if (initialized) return;
    initialized = true;
    if (AdMob) {
      try {
        await AdMob.initialize({ initializeForTesting: false });
        preloadRewarded();
      } catch (e) { console.warn("AdMob init failed", e); }
    }
    if (Purchases) {
      try {
        // API klíč RevenueCat pro danou platformu – doplň do config.js, pokud budeš RevenueCat používat.
        await Purchases.configure({ apiKey: cfg.revenueCatKey || "", appUserID: Storage.device });
        await syncNativeSubscription();
      } catch (e) { console.warn("Purchases configure failed", e); }
    }
  }

  // Předplatné "bez reklam": zjistí aktuální stav od RevenueCat a uloží datum vypršení.
  // Volá se při startu; když hráč předplatné zruší, po konci období se reklamy vrátí.
  async function syncNativeSubscription() {
    if (!Purchases) return;
    try {
      const { customerInfo } = await Purchases.getCustomerInfo();
      const ent = customerInfo?.entitlements?.active?.[cfg.revenueCatEntitlement || "no_ads"];
      Storage.setNoAdsUntil(ent ? (ent.expirationDate ? Date.parse(ent.expirationDate) : Date.now() + 40 * 864e5) : 0);
      if (!Storage.noAds) showBannerIfAllowed();
    } catch {}
  }
  function showBannerIfAllowed() { /* banner se ukáže při dalším přechodu do menu */ }

  async function preloadRewarded() {
    if (!AdMob) { rewardedReady = true; return; }
    try {
      await AdMob.prepareRewardVideoAd({
        adId: platform === "ios" ? cfg.admob.iosRewarded : cfg.admob.androidRewarded,
      });
      rewardedReady = true;
    } catch (e) { rewardedReady = false; console.warn("rewarded prepare failed", e); }
  }

  // ---------- banner ----------
  async function showBanner() {
    if (Storage.noAds || bannerVisible) return;
    bannerVisible = true;
    document.getElementById("stage").classList.add("has-banner");
    if (AdMob) {
      try {
        await AdMob.showBanner({
          adId: platform === "ios" ? cfg.admob.iosBanner : cfg.admob.androidBanner,
          adSize: "ADAPTIVE_BANNER", position: "BOTTOM_CENTER", margin: 0,
        });
      } catch (e) { console.warn(e); }
    } else {
      document.getElementById("banner").classList.remove("hidden");
    }
  }
  async function hideBanner() {
    if (!bannerVisible) return;
    bannerVisible = false;
    document.getElementById("stage").classList.remove("has-banner");
    if (AdMob) { try { await AdMob.hideBanner(); } catch {} }
    else document.getElementById("banner").classList.add("hidden");
  }

  // ---------- rewarded ----------
  // Vrací true, když si hráč odměnu zasloužil (dokoukal).
  async function showRewarded() {
    if (AdMob) {
      if (!rewardedReady) await preloadRewarded();
      if (!rewardedReady) return false;
      return new Promise(async (resolve) => {
        let rewarded = false;
        const h1 = await AdMob.addListener("onRewardedVideoAdReward", () => { rewarded = true; });
        const h2 = await AdMob.addListener("onRewardedVideoAdDismissed", () => {
          h1.remove(); h2.remove(); rewardedReady = false; preloadRewarded(); resolve(rewarded);
        });
        try { await AdMob.showRewardVideoAd(); }
        catch (e) { h1.remove(); h2.remove(); resolve(false); }
      });
    }
    // Web mock – simulovaná reklama s odpočtem
    return new Promise((resolve) => {
      const el = document.createElement("div");
      el.style.cssText = "position:absolute;inset:0;background:#000;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:22px;z-index:50;gap:10px";
      el.innerHTML = `<div>${Lang("mockAd")}</div><div id='mock-ad-n' style='font-size:54px;font-weight:700'>3</div><div style='font-size:13px;opacity:.6'>${Lang("mockAdNote")}</div>`;
      document.getElementById("stage").appendChild(el);
      let n = 3;
      const iv = setInterval(() => {
        n--; el.querySelector("#mock-ad-n").textContent = n;
        if (n <= 0) { clearInterval(iv); el.remove(); resolve(true); }
      }, 1000);
    });
  }

  // ---------- nákupy ----------
  async function purchase(key) {
    const product = cfg.iap[key];
    if (!product) return false;
    if (Purchases) {
      try {
        const { products } = await Purchases.getProducts({ productIdentifiers: [product.id] });
        if (!products || !products.length) return false;
        const res = await Purchases.purchaseStoreProduct({ product: products[0] });
        if (cfg.iap[key].subscription) {
          const ent = res?.customerInfo?.entitlements?.active?.[cfg.revenueCatEntitlement || "no_ads"];
          applyPurchase(key, ent?.expirationDate ? Date.parse(ent.expirationDate) : null);
        } else applyPurchase(key);
        return true;
      } catch (e) {
        if (!e.userCancelled) console.warn("purchase failed", e);
        return false;
      }
    }
    // Web: Stripe Payment Link (když je vyplněný), jinak mock pro testování na PC
    const link = cfg.stripe && cfg.stripe.links && cfg.stripe.links[key];
    if (link) {
      const url = new URL(link);
      url.searchParams.set("client_reference_id", Storage.device);
      window.location.href = url.toString();
      return false; // dokončí se po návratu přes claimWebPurchases()
    }
    if (!confirm(Lang("mockBuy", key))) return false;
    applyPurchase(key);
    return true;
  }

  // Web: vyzvedne nákupy, které Stripe webhook zapsal do Supabase pro toto zařízení.
  // Vrací seznam klíčů produktů, které byly právě aktivovány.
  async function claimWebPurchases() {
    if (native || !cfg.supabaseUrl || !cfg.supabaseAnonKey) return [];
    const returned = new URLSearchParams(location.search).get("paid");
    if (returned) history.replaceState(null, "", location.pathname);
    // po návratu ze Stripe může webhook chvíli trvat – zkusíme několikrát
    const tries = returned ? 6 : 1;
    for (let i = 0; i < tries; i++) {
      try {
        const r = await fetch(cfg.supabaseUrl + "/rest/v1/rpc/sync_entitlements", {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: cfg.supabaseAnonKey, Authorization: "Bearer " + cfg.supabaseAnonKey },
          body: JSON.stringify({ p_device: Storage.device }),
        });
        if (r.ok) {
          const rows = await r.json();
          const keys = [];
          let noAdsUntil = 0;
          for (const row of rows) {
            const key = Object.keys(cfg.iap).find(k => cfg.iap[k].id === row.product) || row.product;
            if (!cfg.iap[key]) continue;
            if (cfg.iap[key].subscription) {
              const exp = row.expires_at ? Date.parse(row.expires_at) : 0;
              noAdsUntil = Math.max(noAdsUntil, exp);
              if (row.fresh) keys.push(key);
            } else if (row.fresh) { applyPurchase(key); keys.push(key); }
          }
          // předplatné se synchronizuje vždy – i zrušené (pak noAdsUntil klesne do minulosti)
          Storage.setNoAdsUntil(noAdsUntil);
          if (noAdsUntil > Date.now()) hideBanner();
          if (keys.length || !returned) return keys;
        }
      } catch {}
      await new Promise(res => setTimeout(res, 1500));
    }
    return [];
  }

  function applyPurchase(key, expiresAt) {
    const p = cfg.iap[key];
    if (key === "remove_ads") {
      // předplatné: platí do expiresAt (webhook / RevenueCat); bez data bereme měsíc od teď
      Storage.setNoAdsUntil(expiresAt || Date.now() + 31 * 864e5);
      hideBanner();
    }
    if (p.coins) Storage.addCoins(p.coins);
  }

  async function restore() {
    if (!Purchases) return false;
    try {
      await Purchases.restorePurchases();
      await syncNativeSubscription();
      return Storage.noAds;
    } catch { return false; }
  }

  async function loadPrices() {
    if (!Purchases) return;
    try {
      const ids = Object.values(cfg.iap).map(p => p.id);
      const { products } = await Purchases.getProducts({ productIdentifiers: ids });
      for (const key of Object.keys(cfg.iap)) {
        const prod = products.find(p => p.identifier === cfg.iap[key].id);
        const el = document.getElementById("price-" + key);
        if (prod && el) el.textContent = prod.priceString + (cfg.iap[key].subscription ? Lang("perMonth") : "");
      }
    } catch {}
  }

  return { init, showBanner, hideBanner, showRewarded, purchase, restore, loadPrices, claimWebPurchases, syncNativeSubscription, native };
})();
