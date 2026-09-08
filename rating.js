// Arcade Rating: body ze všech her na účet (jen přihlášení). Session bere z localStorage rozcestníku (supabase-js).
window.Rating = (() => {
  const CFG = { url: "https://ofozkelnipwozpukbdfg.supabase.co", key: "sb_publishable_o8I4CvJRiM3IeXUI2V24cQ_wEUoYKt4" };
  function session() { try { const raw = localStorage.getItem("sb-ofozkelnipwozpukbdfg-auth-token"); if (!raw) return null; const j = JSON.parse(raw); if (!j.access_token || (j.expires_at && j.expires_at * 1000 < Date.now())) return null; return j; } catch { return null; } }
  const TIERS = [[0, "Bronze"], [300, "Silver"], [1000, "Gold"], [2500, "Platinum"], [6000, "Diamond"], [15000, "Elite"]];
  const tier = (pts) => { let t = TIERS[0]; for (const x of TIERS) if (pts >= x[0]) t = x; return t[1]; };
  async function add(game, points) {
    const s = session(); if (!s || !points) return null;
    try { const r = await fetch(CFG.url + "/rest/v1/rpc/add_rating", { method: "POST", headers: { "Content-Type": "application/json", apikey: CFG.key, Authorization: "Bearer " + s.access_token }, body: JSON.stringify({ p_game: game, p_points: Math.round(points) }) }); if (!r.ok) return null; const total = await r.json(); try { localStorage.setItem("arcade_rating", String(total)); } catch {} showToast(points, total); return total; } catch { return null; }
  }
  function showToast(pts, total) { try { const el = document.createElement("div"); el.textContent = `+${Math.round(pts)} ★ · ${total} (${tier(total)})`; el.style.cssText = "position:fixed;right:12px;top:12px;z-index:99999;background:#FFCF5A;color:#2A1600;font:900 14px Nunito,system-ui,sans-serif;padding:8px 14px;border-radius:999px;box-shadow:0 4px 12px rgba(0,0,0,.4)"; document.body.appendChild(el); setTimeout(() => el.remove(), 3500); } catch {} }
  return { add, tier, TIERS, get loggedIn() { return !!session(); } };
})();
