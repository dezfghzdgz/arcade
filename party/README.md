# Arcade – web s hrami, účty a komunitními hrami

Statický web (žádný build): `index.html` rozcestník, `zigdash/`, `splatz/`, `tower/` hry. Účty, posílání her a Arcade Pass běží přes Supabase (stejný projekt jako hry).

## Nasazení
1. Obsah téhle složky do kořene GitHub repa (GitHub Desktop: zkopírovat do složky repa → Commit → Push).
2. Vercel importuje repo, nic nenastavuješ. Používej **produkční adresu** (`https://nazev.vercel.app`), ne odkazy z Deployments (ty jsou chráněné přihlášením). Pokud i produkční adresa chce login: Vercel → projekt → Settings → Deployment Protection → Vercel Authentication → vypnout.

## Zapojení Supabase (klíče už jsou vyplněné)
1. Supabase → **SQL Editor** → New query → vlož celý soubor **`SETUP.sql`** → Run. (Založí žebříček ZigDash, účty, posílání her, Arcade Pass a nákupy z webu.)
2. Authentication → Providers → Email → vypni „Confirm email" (jinak musí každý potvrdit mail; free tier posílá jen pár mailů denně).
3. Zaregistruj se na webu, pak v SQL: `update public.profiles set is_admin = true where id = '<tvoje uuid>'` (Authentication → Users). Objeví se ti „Review queue".
4. Multiplayer (Splatz, Tower, Front) nepotřebuje nic dalšího – jede přes Realtime kanály. V lobby už nebude „local (dev)", ale „online".

## Účty, posílání her, schvalování
1. Supabase → SQL editor → spusť `SETUP.sql` (viz výše).
2. Authentication → Providers → Email: nech zapnuté; pro rychlý start vypni „Confirm email" (jinak musí uživatel potvrdit e-mail – Supabase free tier posílá jen pár mailů denně).
3. URL + anon key do `config.js` (stejné jako v hrách).
4. Zaregistruj se na webu, pak v SQL: `update public.profiles set is_admin = true where id = '<tvoje uuid>'` (uuid najdeš v Authentication → Users). Od té chvíle máš v menu „Review queue".

Tok: hráč se přihlásí → „Submit a game" (název, popis, odkaz na hru hostovanou kdekoliv, ikona) → ty ve frontě schválíš/zamítneš s poznámkou → schválená hra se objeví v sekci „From the community" s jménem autora a otevírá se v nové záložce.

## Appka a offline
Web je PWA: na rozcestníku je tlačítko **Nainstalovat** (Chrome/Edge na PC i Androidu; na iPhonu Sdílet → Přidat na plochu) a **Uložit hry pro offline** – service worker (`sw.js`) stáhne všechny hry do cache. Sólo hry pak fungují úplně bez internetu, online hry se načtou, ale na hraní potřebují síť. Po každém nasazení nové verze zvedni `VERSION` v `sw.js`, aby se cache obnovila.

## Program na PC
Ve složce `desktop/` je Electron obal – návod tamtéž (výsledek je `.exe` instalátor / přenosné exe, na Macu `.dmg`). Hotové soubory nahraj do GitHub Releases a odkaz dej na rozcestník.

## Postup u účtu
`SETUP3.sql` založí tabulku `progress`. Přihlášený hráč (session z rozcestníku) má postup v Roll, Tubes a Bricks uložený u účtu a na jiném zařízení pokračuje tam, kde skončil (vyšší level vyhrává). Bez přihlášení zůstává postup jen v prohlížeči. Hry čtou session ze stejného localStorage jako rozcestník; po hodině bez otevřeného rozcestníku token vyprší a ukládá se jen lokálně (otevřením rozcestníku se obnoví).

## Rozcestník
Na PC dva sloupce: vlevo Offline · sólo, vpravo Online · s kamarády (Party první). Na mobilu jeden sloupec, hry se střídají online/sólo.

## Nové hry
- **Fleet** (`fleet/`) – námořní bitva až pro 8: joystick = kormidlo (loď se otáčí omezenou rychlostí, zrychluje a dojíždí), tlačítko = salva ze obou boků (3 koule na stranu), ostrovy jako překážky, 3 zásahy = ke dnu, respawn 3 s. Módy: Bitva, Flotily (týmy), Král moří (zóna se stěhuje), Poklad (truhly, potopená loď půlku vysype).
- **Roll** (`roll/`) – kulička jede, dokud nenarazí, a maluje; obarvi všechno. Levely se generují ze seedu (blob s chodbami) a ověřují hledáním nejkratšího řešení – hvězdičky podle počtu tahů proti optimu. Zpět, restart, přeskočit za reklamu. Žebříček = dosažený level.
- **Tubes** (`tubes/`) – přelévání barev (Water Sort): levely se generují zamícháním vyřešeného stavu zpětnými tahy (vždy řešitelné), počet barev roste s levelem až do 12. Zpět, restart, 3 nápovědy zdarma a další za reklamu, zkumavka navíc za reklamu.
- **Flow** (`flow/`) – spojování teček (Flow Free): mřížka se rozdělí náhodnými cestami, jejich konce jsou tečky, takže je vždy řešitelné; 5×5 až 9×9, tažením prstem, přerušení cizí trubky, nápovědy (3 + za reklamu), přeskočení za reklamu, postup u účtu.
- **Snakes** (`snakes/`) – multiplayer had až pro 8 na mřížce 36×60: joystick = směr, držení BOOST = zrychlení za cenu délky, jídlo = bod, náraz soupeře do tebe = 3 body, tělo mrtvého hada se mění v jídlo. Módy Aréna (respawn), Poslední (bez respawnu), Týmy.
- **Party** (`party/`) – „1234 Player Games" online: 2–8 lidí, každý na svém mobilu, 5/8/12 kol náhodných miniher: Reflex, Ťukací závod, Rychlá matika, Barvy (Stroop), Drž 5 s, Počítání teček, Najdi jiný, Simon, Terč, Zastav lištu, Psaní, Větší?. Body 3/2/1 za pořadí v kole, mezi koly tabulka. Reakční časy se měří lokálně, takže latence nikoho neznevýhodní.
- **Pong** (`pong/`) – online Pong 1v1, 2v2 i 2v1 (sám proti dvěma má pálku 1,6×), cíl na body (7/11/15) nebo na čas (60/120/180 s), míček s každým odrazem zrychlí o 4 % (`speedUp`); módy Klasika, Rychlý, Dva míčky. Klient si míček extrapoluje mezi snapshoty (15×/s), pálku předpovídá.
- **Solitaire** (`solitaire/`) – Klondike po 1/po 3/denní, tap = výběr a přesun, dvojklik = nahoru, tažení, zpět, automatické dohrání, žebříček časů.
- **Boom** má 5 módů: Klasika, Chaos (2 bomby), Zóna (aréna se zmenšuje), Týmy (bombu jen soupeři), Lovec (bomba nebouchá, kdo ji drží, sbírá body, 60 s).
- **Boom** (`boom/`) – horký brambor až pro 8: bomba se předává dotykem, dash = odraz/únik, komu bouchne, vypadá; poslední bere 3 body, první na 6 vyhrává. Mód Chaos = dvě bomby.
- **Doodle** (`doodle/`) – tichá pošta: napiš → nakresli → uhodni, 2–10 hráčů, alba na konci. Hostitel ovládá ukazování alb.
- **Merge** (`merge/`) – sólo 2048 s denní výzvou (stejný seed pro všechny) a globálním žebříčkem. Žebříček potřebuje **`SETUP2.sql`** (obecná tabulka pro další hry).
- **Snake** (`snake/`) – klasika: režim Klasika (okraje průchozí) a Stěny, bonusové hvězdy, zrychluje s každým jablkem, žebříček.
- **Mines** (`mines/`) – Minesweeper: Lehká/Střední/Těžká + Denní pole (stejné pro všechny, na čas), první klik vždy bezpečný, chord (klik na číslo odkryje okolí), podržení = vlajka, žebříček nejlepších časů.
- **Bricks** (`bricks/`) – Breakout: 6 vzorů levelů, cihly ocelové (nezničitelné), výbušné, zlaté a dvojité; power-upy (×3, širší pálka, laser, život) i power-downy (užší pálka, rychlý míč); míč zrychluje odrazy i s levelem, pálka se s levelem zužuje.
- **Sudoku** (`sudoku/`) – generátor s garancí jediného řešení, Lehké/Střední/Těžké/Denní, poznámky, 3 chyby = konec, žebříček časů. **Nápověda:** první zdarma, další za odměněnou reklamu (na webu simulace 3 s, v appce AdMob).
- Sdílený modul `js/common.js` (jazyk, zvuk, žebříček) – nová sólo hra se dá postavit stejně.
- Jméno z účtu Arcade se automaticky přebírá do všech her (dokud si ho hráč ve hře nepřepíše).

## Arcade Pass (Stripe)
1. Stripe → Products → „Arcade Pass", recurring monthly (€3.99) → Payment Link; After payment → `https://tvoje-adresa/?paid=1`. URL do `config.js → stripePassLink`.
2. Nasaď webhook: `supabase functions deploy arcade-stripe --no-verify-jwt`, `supabase secrets set STRIPE_SECRET_KEY=sk_… STRIPE_WEBHOOK_SECRET=whsec_…` (**tajný klíč nikam jinam nedávej**, ani do chatu).
3. Stripe → Webhooks → URL funkce, eventy `checkout.session.completed`, `invoice.paid`, `customer.subscription.updated`, `customer.subscription.deleted`.
Pass se ukládá k účtu (`profiles.pass_until`). Hry zatím reklamy vypínají podle vlastního nákupu v každé hře; propojení „pass na účtu = bez reklam ve hrách" je další krok (hry se musí naučit číst přihlášení z hubu).

## Hrát znovu
Po kole mají všichni tlačítko „Hrát znovu" s 20s odpočtem (x/y hlasů). Jakmile odhlasují všichni lidé (nebo dojde čas), hostitel dostane lobby s nastavením a může rovnou odstartovat další kolo; ostatní čekají v lobby.

## Přidání vlastní hry napevno
Složka `nazev/` + záznam v `hub.js → BUILTIN`.
