// Globální žebříček. Backend = Supabase (tabulka scores + RPC), schéma v supabase/schema.sql.
// Bez vyplněného configu se jen tiše nic neposílá a hra funguje s lokálním rekordem.
window.Leaderboard = (() => {
  const cfg = ZD_CONFIG;
  const enabled = () => !!(cfg.supabaseUrl && cfg.supabaseAnonKey);
  const headers = () => ({
    "Content-Type": "application/json",
    apikey: cfg.supabaseAnonKey,
    Authorization: "Bearer " + cfg.supabaseAnonKey,
  });

  // Pošle skóre; server si nechá jen nejvyšší pro dané zařízení. Vrací pořadí nebo null.
  async function submit(score) {
    if (!enabled() || score <= 0) return null;
    try {
      const r = await fetch(cfg.supabaseUrl + "/rest/v1/rpc/submit_score", {
        method: "POST", headers: headers(),
        body: JSON.stringify({
          p_device: Storage.device,
          p_name: (Storage.name || Lang("player")).slice(0, 12),
          p_score: Math.floor(score),
        }),
      });
      if (!r.ok) return null;
      const data = await r.json();
      return typeof data === "number" ? data : null;
    } catch { return null; }
  }

  // Top N + pozice hráče.
  async function top(limit = 50) {
    if (!enabled()) return { rows: [], me: null, offline: true };
    try {
      const r = await fetch(
        cfg.supabaseUrl + `/rest/v1/leaderboard?select=rank,name,score,device_id&order=rank.asc&limit=${limit}`,
        { headers: headers() }
      );
      if (!r.ok) throw new Error(r.status);
      const rows = await r.json();
      const me = rows.find(x => x.device_id === Storage.device) || null;
      let meRank = me;
      if (!meRank) {
        const r2 = await fetch(cfg.supabaseUrl + "/rest/v1/rpc/my_rank", {
          method: "POST", headers: headers(), body: JSON.stringify({ p_device: Storage.device }),
        });
        if (r2.ok) { const d = await r2.json(); meRank = d && d.length ? d[0] : null; }
      }
      return { rows, me: meRank, offline: false };
    } catch { return { rows: [], me: null, offline: false, error: true }; }
  }

  async function rename(name) {
    Storage.setName(name);
    if (!enabled()) return;
    try {
      await fetch(cfg.supabaseUrl + "/rest/v1/rpc/rename_player", {
        method: "POST", headers: headers(),
        body: JSON.stringify({ p_device: Storage.device, p_name: name.slice(0, 12) }),
      });
    } catch {}
  }

  return { submit, top, rename, enabled };
})();
