# Arcade jako program na PC (Windows / Mac / Linux)

Balí web do Electronu. Výsledek: instalátor `.exe` (a přenosné `.exe`), `.dmg` pro Mac, `.AppImage` pro Linux.

## Postup (na tvém PC, jednorázově ~10 min)
1. Nainstaluj Node.js (nodejs.org, LTS).
2. Zkopíruj celý web (obsah kořene repa: `index.html`, `hub.js`, složky her…) do `desktop/app/`. Na Windows v PowerShellu z kořene repa:
   `robocopy . desktop\app /E /XD desktop .git node_modules`
3. `cd desktop` → `npm install` → `npm run build:win` (nebo `build:mac` / `build:linux`).
4. Hotové soubory jsou v `desktop/dist/` – `Arcade Setup 1.0.0.exe` (instalátor) a `Arcade 1.0.0.exe` (spustit bez instalace). Nahraj je např. do GitHub Releases a na rozcestník dej odkaz „Stáhnout pro Windows".

Poznámky: sólo hry fungují úplně offline (soubory jsou v appce); online hry a účty se připojují na Supabase jako na webu. Windows může u nepodepsaného exe ukázat SmartScreen („Přesto spustit") – podpis certifikátem stojí peníze, na začátek to nevadí. Mac buildy jdou stavět jen na Macu.

Rychlejší cesta bez buildu: na rozcestníku tlačítko **Nainstalovat** (Chrome/Edge) – nainstaluje web jako aplikaci s ikonou v nabídce Start, totéž chování, žádný exe.
