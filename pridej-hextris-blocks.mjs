// Arcade: stáhne Hextris (GPL-3.0) a Blocks (javascript-tetris, MIT) do repa a upraví je pro Arcade.
// Spusť v KOŘENI repa (kde je index.html a hub.js):   node pridej-hextris-blocks.mjs
// Potřebuje git (máš přes GitHub Desktop) a Node 18+.
import { execSync } from "node:child_process";
import { existsSync, rmSync, readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const BACK = '<a href="../" style="position:fixed;top:8px;left:8px;z-index:99999;font:800 13px system-ui,sans-serif;color:#fff;background:rgba(0,0,0,.55);padding:6px 10px;border-radius:999px;text-decoration:none">‹ Arcade</a>';
const GAMES = [
  { dir: "hextris", repo: "https://github.com/Hextris/hextris.git", credits: "Hextris\nAuthors: Logan Engstrom, Garrett Finucane, Noah Moroze, Michael Yang (hextris.io)\nLicense: GPL-3.0 – source unchanged except analytics removed and a back link added.\nRepository: https://github.com/Hextris/hextris\n",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect width="192" height="192" rx="42" fill="#1B1030"/><polygon points="96,28 155,62 155,130 96,164 37,130 37,62" fill="none" stroke="#F4F0E8" stroke-width="10"/><polygon points="96,58 129,77 129,115 96,134 63,115 63,77" fill="#5EE1D0"/><polygon points="96,58 129,77 96,96" fill="#FF5E7E"/><polygon points="129,77 129,115 96,96" fill="#FFCF5A"/><polygon points="63,115 63,77 96,96" fill="#B6FF5A"/></svg>` },
  { dir: "blocks", repo: "https://github.com/jakesgordon/javascript-tetris.git", credits: "Blocks (javascript-tetris)\nAuthor: Jake Gordon\nLicense: MIT\nRepository: https://github.com/jakesgordon/javascript-tetris\nRenamed in the UI to 'Blocks'.\n",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect width="192" height="192" rx="42" fill="#1B1030"/><g stroke="#1B1030" stroke-width="3"><rect x="36" y="120" width="30" height="30" fill="#5EE1D0"/><rect x="66" y="120" width="30" height="30" fill="#5EE1D0"/><rect x="96" y="120" width="30" height="30" fill="#5EE1D0"/><rect x="126" y="120" width="30" height="30" fill="#5EE1D0"/><rect x="66" y="90" width="30" height="30" fill="#FFCF5A"/><rect x="96" y="90" width="30" height="30" fill="#FFCF5A"/><rect x="96" y="60" width="30" height="30" fill="#FFCF5A"/><rect x="126" y="60" width="30" height="30" fill="#FF5E7E"/><rect x="126" y="30" width="30" height="30" fill="#FF5E7E"/></g></svg>` },
];

if (!existsSync("hub.js") || !existsSync("index.html")) { console.error("Spusť mě v kořeni repa (kde je hub.js a index.html)."); process.exit(1); }

for (const g of GAMES) {
  if (existsSync(g.dir)) { console.log(`• ${g.dir}: složka už existuje, mažu a stahuju znovu`); rmSync(g.dir, { recursive: true, force: true }); }
  console.log(`• ${g.dir}: git clone…`);
  execSync(`git clone --depth 1 ${g.repo} ${g.dir}`, { stdio: "inherit" });
  rmSync(join(g.dir, ".git"), { recursive: true, force: true });
  for (const f of ["CNAME", ".gitignore", ".travis.yml"]) if (existsSync(join(g.dir, f))) rmSync(join(g.dir, f));
  const idx = join(g.dir, "index.html"); let s = readFileSync(idx, "utf8");
  s = s.replace(/<script>[^<]*google-analytics[\s\S]*?<\/script>/g, "");           // pryč cizí analytika
  s = s.replace(/<script[^>]*googletagmanager[^>]*><\/script>/g, "");
  if (g.dir === "blocks") s = s.replace(/Javascript Tetris/g, "Blocks").replace(/Tetris/g, "Blocks").replace(/tetris/g, "blocks");  // ochranná známka
  s = s.includes("</body>") ? s.replace("</body>", BACK + "</body>") : s + BACK;
  writeFileSync(idx, s);
  writeFileSync(join(g.dir, "CREDITS.txt"), g.credits);
  writeFileSync(join(g.dir, "icon.svg"), g.icon);
  console.log(`  ✓ ${g.dir} hotovo (${readdirSync(g.dir).length} položek)`);
}

// hub.js: ikony na SVG
let hub = readFileSync("hub.js", "utf8");
hub = hub.replace('icon: "hextris/icon-192.png"', 'icon: "hextris/icon.svg"').replace('icon: "blocks/icon-192.png"', 'icon: "blocks/icon.svg"');
writeFileSync("hub.js", hub);
// sw.js: zvednout verzi cache, aby se nová data dostala k hráčům
if (existsSync("sw.js")) { let sw = readFileSync("sw.js", "utf8"); sw = sw.replace(/VERSION = "arcade-v(\d+)"/, (m, n) => `VERSION = "arcade-v${+n + 1}"`); writeFileSync("sw.js", sw); }
console.log("\nHotovo. Teď: git add -A → commit → push. Vercel nasadí sám.");
