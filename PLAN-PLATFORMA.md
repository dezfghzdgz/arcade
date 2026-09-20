# Arcade jako platforma, kam se lidi vracejí

## Co je v tomto balíku (v33)
**Nová vrstva „Meta“** – XP, level, mince, streak, denní mise, obchod se skiny, žebříčky týden/sezóna/celkově. Vše počítá server (Supabase RPC), klient jen hlásí události, takže se to nedá jednoduše nafouknout z konzole.

Soubory: `SETUP5.sql` (spusť v Supabase SQL editoru), `rating.js` (nová verze – hry ho už načítají, nic v nich měnit nemusíš), `meta.css`, `play.html`, `index.html`, `hub.js`, `sw.js`, `stack/js/main.js`.

### Jak to hráč vidí
- Po přihlášení má v hlavičce **pruh: level · XP bar · 🔥 streak · 🪙 mince** (klik = profil).
- Na domovské stránce **„Dnes“**: 3 denní mise („Dohraj 3 hry“, „Zahraj Splatz 1×“, „Vyhraj kolo“) s odměnou XP + mince a tlačítkem Vyzvednout. Mise se generují ze seedu (uživatel + den), takže jsou pro každého jiné a nejde je resetovat obnovením stránky.
- **Streak** roste první hrou každého dne; jeden den výpadku se odpouští (víkend nezabije motivaci). Bonus +5 XP × streak (max +50).
- **Body i za cizí hry**: hostující hry a embedy jdou přes `play.html`, který posílá odehraný čas (1 XP / 30 s, max 10 min = 20 XP denně na hru). Takže se vyplatí hrát cokoli u nás, ale nejde to farmit necháním záložky otevřené (počítá se jen aktivní záložka a je denní strop).
- **Obchod**: skiny kuličky, barva jména, stopa, odznak – za mince. Pass položky (zlatá kulička, duhové jméno) jsou zdarma s Arcade Pass → Pass má důvod existovat. Skiny se ukazují u jména na webu a hry si je čtou přes `Meta.skin("ball")` (Stack už používá stopu; do ostatních doplním).
- **Žebříčky**: Tento týden (reset v pondělí) · Sezóna (měsíc) · Celkově. Týdenní reset = i nováček má šanci být nahoře, to je klíč pro školu.
- Nepřihlášený hráč po dohrání vidí 1× denně nenápadnou výzvu „Přihlas se a sbírej XP…“ – ne otravný popup.

### Body za hru (server)
| událost | XP | mince |
|---|---|---|
| dohrání (`Meta.finish`) | 20 | 5 |
| výhra (`Meta.win`) | 40 | 12 |
| skóre (`Meta.score`, staré `Rating.add`) | 5–40 | XP/4 |
| čas v cizí hře | 1 / 30 s, max 20 denně | XP/4 |
| denní mise | 60 / 80 / 100 | 30 / 40 / 50 |
Limit 60 událostí za hodinu na účet. Level = kvadraticky (Lv2 100 XP, Lv3 300, Lv5 1000, Lv10 4500) – první levely rychle, pak pomaleji.

## Co udělat v dalších kolech (v pořadí)
1. **Do online her přidat `Meta.win`** (Splatz, Tower, Boom, Fleet, Snakes, Pong, Party, Sketch, Doodle) – teď posílají jen skóre přes `Rating.add`; s výhrou bude mise „Vyhraj kolo“ plnitelná všude. Skiny do her: kulička v Roll, hlava hada, pálka v Pongu, barva jména v lobby.
2. **Odznaky/achievementy** (první výhra, 7 dní streak, 10 her s kamarády, level 10…) – na profilu, viditelné ostatním.
3. **Přátelé + „kdo je online“** – z toho vzniká „pojď hrát“ bez posílání kódů; pro školu největší tahák.
4. **Sezónní odměny** – konec měsíce: top 10 % dostane exkluzivní skin, který už nikdy nebude v obchodě.
5. **Battle Pass (sezónní žebřík odměn)** – zdarma a Pass řada, jako ve Fortnite: úroveň za XP, každá úroveň něco dá. Tohle je nejsilnější důvod si Pass koupit a zároveň férový (platíš za odměny, ne za výhodu).
6. **Turnaje** – každý pátek 16:00 Party turnaj, výsledky na hlavní straně.
7. **Klany/třídy** – skupina se společným XP; třída 8.B vs 8.A. Ve škole zlato.

## Co NEdělat (a proč)
- Loot boxy / náhodné placené odměny: v části EU zakázané pro nezletilé, Apple i Google to trestají, rodiče a školy nenávidí. Vše, co se kupuje, ať je vidět předem.
- Pay-to-win: skiny a pohodlí ano, výhoda ve hře ne – jinak to hráči na sociálních sítích roznesou.
- Tresty za nehraní (ztráta streaku bez odpuštění, mizející odměny): krátkodobě funguje, dlouhodobě lidi odradí. Odpuštění 1 dne a týdenní resety fungují líp.
- Sbírat o dětech víc než e-mail a přezdívku. Pro Google Play s cílovkou pod 13 platí přísný režim (Families policy), viz níže.

## Monetizace (férová a pro školáky reálná)
- **Arcade Pass** (≈ 99 Kč/měs.): bez reklam, 2× mince, Pass skiny, Pass řada Battle Passu, barevné jméno. Platba přes Stripe na webu, přes obchod v appkách.
- **Reklamy** jen mezi hrami (nikdy uprostřed), odměněné reklamy za nápovědu/přeskočení levelu (už máš).
- **Podíl z hostovaných her** (GameDistribution/GameMonetize) – pasivní příjem z každé odehrané cizí hry.
- Mince se **nedají kupovat přímo** – jen hraním a Passem. Tím je obchod „za snahu“, nikoli „za peníze“, což je ten pocit, který chceš.

## Steam, App Store, Google Play
Stejný web, tři obaly. Pořadí podle poměru práce/přínos:
1. **Google Play** (Capacitor/TWA) – nejjednodušší, cílovka tam je. Poplatek 25 $ jednorázově. Pozor: pokud appka cílí na děti, spadá pod *Families policy* – reklamy jen přes certifikované sítě (AdMob s dětským nastavením), žádný sběr osobních dat navíc, věkové hodnocení. Pass přes Google Play Billing (30 %/15 % podíl obchodu).
2. **App Store** – potřebuje Mac (nebo cloud Mac) a 99 $/rok. Apple vyžaduje, aby appka nebyla „jen web“ – obal musí přinést něco navíc (offline hry, notifikace o misích, Game Center). Máš to připravené (offline sólo hry), stačí přidat push notifikace („mise čekají“, „kamarád hraje“).
3. **Steam** – 100 $ za titul, Electron obal (už máš `desktop/`), Steam Overlay a achievementy přes Steamworks SDK (Greenworks). Steam se hodí spíš pro balík našich her jako jednu „Arcade“ appku s achievementy; publikum je starší než škola, ale dává značce váhu. Doporučuji jako třetí krok, až budou achievementy hotové.

Společný základ pro všechny tři: účet Supabase, jeden kód, PWA offline. Rozdíl je jen v platbách (Stripe na webu / Play Billing / StoreKit) – RevenueCat to sjednotí (máš připravené v configu).
