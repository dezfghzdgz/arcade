# Arcade – web s hrami, účty a komunitními hrami

Statický web (žádný build): `index.html` rozcestník, `zigdash/`, `splatz/`, `tower/` hry. Účty, posílání her a Arcade Pass běží přes Supabase (stejný projekt jako hry).

## Nasazení
1. Obsah téhle složky do kořene GitHub repa (GitHub Desktop: zkopírovat do složky repa → Commit → Push).
2. Vercel importuje repo, nic nenastavuješ. Používej **produkční adresu** (`https://nazev.vercel.app`), ne odkazy z Deployments (ty jsou chráněné přihlášením). Pokud i produkční adresa chce login: Vercel → projekt → Settings → Deployment Protection → Vercel Authentication → vypnout.

## Účty, posílání her, schvalování
1. Supabase → SQL editor → spusť `supabase/hub.sql`.
2. Authentication → Providers → Email: nech zapnuté; pro rychlý start vypni „Confirm email" (jinak musí uživatel potvrdit e-mail – Supabase free tier posílá jen pár mailů denně).
3. URL + anon key do `config.js` (stejné jako v hrách).
4. Zaregistruj se na webu, pak v SQL: `update public.profiles set is_admin = true where id = '<tvoje uuid>'` (uuid najdeš v Authentication → Users). Od té chvíle máš v menu „Review queue".

Tok: hráč se přihlásí → „Submit a game" (název, popis, odkaz na hru hostovanou kdekoliv, ikona) → ty ve frontě schválíš/zamítneš s poznámkou → schválená hra se objeví v sekci „From the community" s jménem autora a otevírá se v nové záložce.

## Arcade Pass (Stripe)
1. Stripe → Products → „Arcade Pass", recurring monthly (€3.99) → Payment Link; After payment → `https://tvoje-adresa/?paid=1`. URL do `config.js → stripePassLink`.
2. Nasaď webhook: `supabase functions deploy arcade-stripe --no-verify-jwt`, `supabase secrets set STRIPE_SECRET_KEY=sk_… STRIPE_WEBHOOK_SECRET=whsec_…` (**tajný klíč nikam jinam nedávej**, ani do chatu).
3. Stripe → Webhooks → URL funkce, eventy `checkout.session.completed`, `invoice.paid`, `customer.subscription.updated`, `customer.subscription.deleted`.
Pass se ukládá k účtu (`profiles.pass_until`). Hry zatím reklamy vypínají podle vlastního nákupu v každé hře; propojení „pass na účtu = bez reklam ve hrách" je další krok (hry se musí naučit číst přihlášení z hubu).

## Přidání vlastní hry napevno
Složka `nazev/` + záznam v `hub.js → BUILTIN`.
