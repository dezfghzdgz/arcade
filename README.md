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

## Nové hry
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
