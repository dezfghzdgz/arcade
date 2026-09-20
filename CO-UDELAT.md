# v34 – co udělat po rozbalení do repa
1. Smaž složky `hextris/` a `blocks/` (pokud existují) – nahrazují je vlastní hry `hexa/` a `blocks/`.
2. Přepiš soubory z balíku (index.html, hub.js, rating.js, meta.css, sw.js, play.html) a přidej `hexa/`, `blocks/`.
3. Supabase → SQL Editor: spusť `SETUP5.sql` (pokud ještě není) a pak `SETUP6.sql` (obchod).
4. Commit + push. Po nasazení jednou obnov stránku (cache verze arcade-v18).
