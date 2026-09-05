-- ARCADE: kompletní nastavení databáze. Vlož celé do Supabase -> SQL Editor -> Run.

-- ===== 1) ZigDash žebříček =====
-- ZigDash – žebříček. Spusť v Supabase SQL editoru.
-- Princip: klient nikdy nezapisuje do tabulky přímo, jen volá RPC. Tím jde omezit
-- co se dá poslat (max skóre, délka jména, jen zvýšení vlastního rekordu).

create table if not exists public.scores (
  device_id   text primary key,
  name        text not null default 'Hráč',
  score       integer not null default 0,
  updated_at  timestamptz not null default now()
);

create index if not exists scores_score_idx on public.scores (score desc, updated_at asc);

alter table public.scores enable row level security;

-- Číst může kdokoli (anon), zapisovat nikdo přímo – jen přes RPC níže (security definer).
create policy "scores are public to read" on public.scores
  for select to anon, authenticated using (true);

-- View s pořadím – to čte klient.
create or replace view public.leaderboard as
  select
    rank() over (order by score desc, updated_at asc) as rank,
    name, score, device_id
  from public.scores
  where score > 0;

grant select on public.leaderboard to anon, authenticated;

-- Odeslání skóre. Vrací aktuální pořadí zařízení.
create or replace function public.submit_score(p_device text, p_name text, p_score integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rank integer;
  v_name text := left(coalesce(nullif(trim(p_name), ''), 'Hráč'), 12);
begin
  if p_device is null or length(p_device) < 8 or length(p_device) > 64 then
    raise exception 'bad device';
  end if;
  -- hrubý strop proti očividnému cheatu; uprav podle toho, čeho jde v hře reálně dosáhnout
  if p_score < 0 or p_score > 100000 then
    raise exception 'bad score';
  end if;

  insert into public.scores (device_id, name, score, updated_at)
  values (p_device, v_name, p_score, now())
  on conflict (device_id) do update
    set name = excluded.name,
        score = greatest(public.scores.score, excluded.score),
        updated_at = case when excluded.score > public.scores.score then now() else public.scores.updated_at end;

  select rank into v_rank from public.leaderboard where device_id = p_device;
  return v_rank;
end;
$$;

create or replace function public.rename_player(p_device text, p_name text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.scores
    set name = left(coalesce(nullif(trim(p_name), ''), 'Hráč'), 12)
    where device_id = p_device;
$$;

create or replace function public.my_rank(p_device text)
returns table (rank bigint, name text, score integer, device_id text)
language sql
security definer
set search_path = public
as $$
  select rank, name, score, device_id from public.leaderboard where device_id = p_device;
$$;

grant execute on function public.submit_score(text, text, integer) to anon, authenticated;
grant execute on function public.rename_player(text, text) to anon, authenticated;
grant execute on function public.my_rank(text) to anon, authenticated;

-- ===== 2) Arcade účty, posílání her, Arcade Pass =====
-- Arcade rozcestník: účty, posílání her, schvalování, Arcade Pass. Spusť v Supabase SQL editoru.

-- profil ke každému účtu (vzniká automaticky triggerem)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Player',
  is_admin boolean not null default false,
  pass_until timestamptz,
  stripe_customer text,
  stripe_subscription text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles readable" on public.profiles for select to anon, authenticated using (true);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id and is_admin = (select is_admin from public.profiles where id = auth.uid()));

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name) values (new.id, coalesce(left(new.raw_user_meta_data->>'name', 20), split_part(new.email, '@', 1)));
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- odeslané hry
create table if not exists public.submissions (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null, description text not null, url text not null, icon_url text, kind text not null default 'solo', note text,
  status text not null default 'pending',   -- pending / approved / rejected
  review_note text,
  created_at timestamptz not null default now()
);
alter table public.submissions enable row level security;
create policy "own submissions" on public.submissions for select to authenticated using (auth.uid() = user_id or exists (select 1 from public.profiles where id = auth.uid() and is_admin));
create policy "insert own" on public.submissions for insert to authenticated with check (auth.uid() = user_id and status = 'pending');

-- schválené hry viditelné všem
create table if not exists public.games (
  id bigserial primary key,
  submission_id bigint references public.submissions(id) on delete set null,
  slug text, title text not null, description text not null, url text not null, icon_url text, kind text not null default 'solo', author text,
  created_at timestamptz not null default now()
);
alter table public.games enable row level security;
create policy "games public" on public.games for select to anon, authenticated using (true);

-- schválení / zamítnutí (jen admin)
create or replace function public.review_submission(p_id bigint, p_status text, p_note text)
returns void language plpgsql security definer set search_path = public as $$
declare s public.submissions; a text;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin) then raise exception 'not admin'; end if;
  if p_status not in ('approved', 'rejected') then raise exception 'bad status'; end if;
  update public.submissions set status = p_status, review_note = p_note where id = p_id returning * into s;
  if p_status = 'approved' then
    select name into a from public.profiles where id = s.user_id;
    insert into public.games (submission_id, title, description, url, icon_url, kind, author) values (s.id, s.title, s.description, s.url, s.icon_url, s.kind, a);
  end if;
end; $$;
grant execute on function public.review_submission(bigint, text, text) to authenticated;

-- prvního admina nastavíš ručně: update public.profiles set is_admin = true where id = '<tvoje uuid z Authentication -> Users>';

-- ===== 3) Nákupy z webu přes Stripe (může zůstat, i když Stripe zatím nepoužíváš) =====
-- ZigDash – nákupy z webu přes Stripe (jednorázové gemy + měsíční předplatné "bez reklam").
-- Spusť po schema.sql. Stripe webhook (supabase/functions/stripe-webhook) sem zapisuje,
-- klient si stav vyzvedne přes sync_entitlements (jen pro své device_id).

create table if not exists public.entitlements (
  id                  bigserial primary key,
  device_id           text not null,
  product             text not null,            -- zigdash_noads_monthly / zigdash_gems_500 / ...
  stripe_session      text unique,              -- ochrana proti dvojímu zapsání stejné platby
  stripe_subscription text,                     -- u předplatného ID subscription (pro obnovy a zrušení)
  expires_at          timestamptz,              -- u předplatného konec zaplaceného období
  claimed_at          timestamptz,
  created_at          timestamptz not null default now()
);
create index if not exists entitlements_device_idx on public.entitlements (device_id);
create index if not exists entitlements_sub_idx on public.entitlements (stripe_subscription);

alter table public.entitlements enable row level security;
-- žádné přímé čtení ani zápis z klienta

-- Vrátí všechny nároky zařízení. fresh = true u těch, které se vyzvedávají poprvé
-- (gemy se připíšou jen jednou); předplatné se vrací vždy, aby klient znal aktuální expires_at.
create or replace function public.sync_entitlements(p_device text)
returns table (product text, expires_at timestamptz, fresh boolean)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    with upd as (
      update public.entitlements e
        set claimed_at = now()
        where e.device_id = p_device and e.claimed_at is null
        returning e.id
    )
    select e.product, e.expires_at, (e.id in (select id from upd)) as fresh
      from public.entitlements e
      where e.device_id = p_device;
end;
$$;
grant execute on function public.sync_entitlements(text) to anon, authenticated;
