// Supabase JS klient se stáhne z CDN jen když je v configu vyplněný projekt (kvůli multiplayeru).
// Solo hra ho nepotřebuje. V nativní appce (Capacitor) se načte také – funguje online stejně jako na webu.
(() => {
  if (!PL_CONFIG.supabaseUrl) return;
  const s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js";
  s.async = false;
  document.head.appendChild(s);
})();
