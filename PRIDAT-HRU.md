# Jak dostat na Arcade víc her (krok za krokem)

## A) Katalogy s oficiálním embedem – nejvíc her za nejmíň práce (PC i mobil)
Takhle fungují CrazyGames, Poki i Y8: hry nekopírují, ale zobrazují je přes iframe od distributora, který se dělí o reklamy.

**GameDistribution (gamedistribution.com) – tisíce HTML5 her, mobil i PC**
1. Založ účet jako *Publisher* (developer.gamedistribution.com). Web musí být online na vlastní doméně (ne `*.vercel.app` – kup doménu, cca 250 Kč/rok, ve Vercelu ji připojíš v Settings → Domains).
2. Přidej web (název, URL, kategorie). Schválení trvá 1–3 dny.
3. V katalogu si vyber hry → u každé je *Embed URL* (`https://html5.gamedistribution.com/<id>/`).
4. Do `catalog.json` přidej řádek:
   `{ "slug": "moto-x3m", "title": "Moto X3M", "kind": "solo", "cat": "arcade", "embed": "https://html5.gamedistribution.com/…/", "icon": "https://img.gamedistribution.com/…-512x512.jpg", "by": "Madpuffers" }`
   (`icon` = obrázek z katalogu; `pc: true` když hra nejde na dotyk.)
5. Commit + push. Hra se objeví mezi ostatními, otevře se v `play.html` s lištou „‹ Arcade" a fullscreenem. Reklamy uvnitř hry řeší distributor, podíl z výnosu chodí tobě.

**GameMonetize (gamemonetize.com)** – stejný princip, méně přísné schvalování, také tisíce her. **GamePix** – totéž, lepší podmínky pro mobil. Můžeš mít všechny tři najednou.

Tip na výběr: filtruj *mobile-friendly*, hodnocení 4+, počet her je vedlejší – radši 40 dobrých než 400 náhodných. Každou hru si před přidáním na 2 minuty zahraj na mobilu i PC.

## B) Open-source hry (jdou i offline, kód máš u sebe)
Hry s licencí **MIT / BSD / Apache / CC-BY** můžeš zkopírovat do složky, stačí uvést autora (jako u Q1K3). U **GPL** taky, ale musíš zveřejnit případné úpravy. Bez uvedené licence = nekopírovat, napsat autorovi.
Jak na to: GitHub → hra → soubor LICENSE → pokud je MIT/BSD/Apache, stáhni, rozbal do `arcade-root/<slug>/`, přidej do `catalog.json` s `"url": "<slug>/"`, vyrob ikonu (screenshot ořezaný do čtverce) a přidej do `CREDITS.txt` autora. Do `sw.js` do seznamu `GAMES` přidej slug, ať jde offline.
Dobré startovní zdroje: GitHub topic `html5-game` + filtr licence MIT, js13kgames.com (u každé hry je odkaz na GitHub s licencí), itch.io s filtrem „open source".

## C) Hry od hráčů
Tlačítko „Poslat hru" už funguje: hráč pošle odkaz, ty ve frontě schválíš. Napiš do popisu, že přijímáš i školní projekty – ve škole to může být zajímavá soutěž.

## D) Vlastní hry
Ty děláme spolu; každá nová sedí do stejné šablony (lobby, boti, mise, rating).

## Kontrola kvality před zveřejněním (5 minut na hru)
- otevře se do 3 s na mobilních datech, jde hrát bez návodu
- nemá vlastní reklamu přes celou obrazovku hned na startu
- na mobilu nepřekrývá ovládání, na PC funguje klávesnice
- není to kopie cizí značky (Mario, Minecraft…) – to distributor i Google trestají
