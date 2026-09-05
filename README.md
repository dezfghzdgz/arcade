# Arcade – web s hrami

Stránka je přímo v kořeni repa (žádná složka `www`), takže Vercel nepotřebuje žádné nastavení:
- `index.html` – rozcestník
- `zigdash/` – ZigDash
- `splatz/` – Splatz

## Nasazení
1. Obsah téhle složky nahraj do kořene GitHub repa (v repu musí být `index.html` hned nahoře, ne ve složce).
2. vercel.com → Add New Project → Import → Deploy. Framework "Other", nic dalšího.

## Online funkce
Supabase URL + anon key do `zigdash/js/config.js` a `splatz/js/config.js`; do Splatz `webUrl` dej `https://tvoje-adresa/splatz/`. Pro ZigDash žebříček spusť `schema.sql` (je v projektu ZigDash).

## Nová hra
Složka `nazev/` s `index.html` + karta v `index.html` rozcestníku.
