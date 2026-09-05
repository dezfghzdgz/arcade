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

## Arcade Pass (Stripe)
1. Stripe → Products → „Arcade Pass", recurring monthly (€3.99) → Payment Link; After payment → `https://tvoje-adresa/?paid=1`. URL do `config.js → stripePassLink`.
2. Nasaď webhook: `supabase functions deploy arcade-stripe --no-verify-jwt`, `supabase secrets set STRIPE_SECRET_KEY=sk_… STRIPE_WEBHOOK_SECRET=whsec_…` (**tajný klíč nikam jinam nedávej**, ani do chatu).
3. Stripe → Webhooks → URL funkce, eventy `checkout.session.completed`, `invoice.paid`, `customer.subscription.updated`, `customer.subscription.deleted`.
Pass se ukládá k účtu (`profiles.pass_until`). Hry zatím reklamy vypínají podle vlastního nákupu v každé hře; propojení „pass na účtu = bez reklam ve hrách" je další krok (hry se musí naučit číst přihlášení z hubu).

## Hrát znovu
Po kole mají všichni tlačítko „Hrát znovu" s 20s odpočtem (x/y hlasů). Jakmile odhlasují všichni lidé (nebo dojde čas), hostitel dostane lobby s nastavením a může rovnou odstartovat další kolo; ostatní čekají v lobby.

## Přidání vlastní hry napevno
Složka `nazev/` + záznam v `hub.js → BUILTIN`.
