-- ARCADE: postup hráče (XP, level, mince, streak), denní mise, sezóny, obchod se skiny. Spusť po SETUP.sql + SETUP4.sql.
-- Vše počítá server (RPC) – klient jen hlásí události. Limity proti podvádění jsou uvnitř.

create table if not exists public.player (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  xp         integer not null default 0,
  coins      integer not null default 0,
  streak     integer not null default 0,
  streak_day date,                       -- poslední den, kdy streak narostl
  season_xp  integer not null default 0, -- XP v aktuální sezóně (měsíc)
  season     text not null default to_char(now(), 'YYYY-MM'),
  week_xp    integer not null default 0,
  week       text not null default to_char(now(), 'IYYY-IW'),
  plays      integer not null default 0,
  equipped   jsonb not null default '{}'::jsonb,   -- { "ball": "neon", "name": "gold" }
  updated_at timestamptz not null default now()
);
create table if not exists public.player_log (
  id bigserial primary key, user_id uuid not null references auth.users(id) on delete cascade,
  game text not null, kind text not null, xp integer not null, coins integer not null, created_at timestamptz not null default now()
);
create table if not exists public.missions (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  data jsonb not null,                   -- [{id, kind, game, target, progress, done, claimed, xp, coins}]
  primary key (user_id, day)
);
create table if not exists public.inventory (
  user_id uuid not null references auth.users(id) on delete cascade,
  item text not null, bought_at timestamptz not null default now(),
  primary key (user_id, item)
);
alter table public.player enable row level security; alter table public.player_log enable row level security;
alter table public.missions enable row level security; alter table public.inventory enable row level security;
create policy "player public read" on public.player for select to anon, authenticated using (true);
create policy "own log" on public.player_log for select to authenticated using (auth.uid() = user_id);
create policy "own missions" on public.missions for select to authenticated using (auth.uid() = user_id);
create policy "own inventory" on public.inventory for select to authenticated using (auth.uid() = user_id);

-- level z XP: 100, 250, 450, 700, 1000 … (kvadratické)
create or replace function public.level_of(p_xp integer) returns integer language sql immutable as $$ select greatest(1, floor((sqrt(1 + 8.0 * p_xp / 100.0) - 1) / 2)::integer + 1); $$;

-- vyrobí denní mise (3), pokud pro dnešek nejsou
create or replace function public.ensure_missions(p_uid uuid) returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb; games text[] := array['splatz','tower','boom','fleet','snakes','pong','party','sketch','doodle','merge','snake','mines','bricks','sudoku','solitaire','roll','tubes','flow','stack','zigdash']; g1 text; g2 text; seed double precision;
begin
  select data into v from public.missions where user_id = p_uid and day = current_date;
  if v is not null then return v; end if;
  seed := ('x' || substr(md5(p_uid::text || current_date::text), 1, 8))::bit(32)::int / 4294967295.0 + 0.5;
  g1 := games[1 + floor(seed * array_length(games, 1))::int]; g2 := games[1 + floor(((seed * 7919) - floor(seed * 7919)) * array_length(games, 1))::int];
  v := jsonb_build_array(
    jsonb_build_object('id', 'play3', 'kind', 'finish', 'game', null, 'target', 3, 'progress', 0, 'done', false, 'claimed', false, 'xp', 60, 'coins', 30),
    jsonb_build_object('id', 'game1', 'kind', 'finish', 'game', g1, 'target', 1, 'progress', 0, 'done', false, 'claimed', false, 'xp', 80, 'coins', 40),
    jsonb_build_object('id', 'win1', 'kind', 'win', 'game', null, 'target', 1, 'progress', 0, 'done', false, 'claimed', false, 'xp', 100, 'coins', 50)
  );
  insert into public.missions (user_id, day, data) values (p_uid, current_date, v) on conflict do nothing;
  return v;
end; $$;

-- hlavní RPC: hra hlásí událost. kind: finish | win | score | time (value = sekundy)
-- Vrací aktuální stav hráče + co přibylo.
create or replace function public.award(p_game text, p_kind text, p_value integer default 0) returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); v_xp integer := 0; v_coins integer := 0; v_recent integer; p public.player; m jsonb; i integer; el jsonb; changed boolean := false; v_wk text := to_char(now(), 'IYYY-IW'); v_se text := to_char(now(), 'YYYY-MM'); v_today_time integer;
begin
  if uid is null then raise exception 'login required'; end if;
  insert into public.player (user_id) values (uid) on conflict do nothing;
  select * into p from public.player where user_id = uid for update;
  -- limity: max 60 událostí/h; čas z cizích her max 10 min/den/hra
  select count(*) into v_recent from public.player_log where user_id = uid and created_at > now() - interval '1 hour';
  if v_recent >= 60 then return jsonb_build_object('xp', p.xp, 'coins', p.coins, 'level', public.level_of(p.xp), 'streak', p.streak, 'gained_xp', 0, 'gained_coins', 0, 'capped', true); end if;
  if p_kind = 'finish' then v_xp := 20; v_coins := 5;
  elsif p_kind = 'win' then v_xp := 40; v_coins := 12;
  elsif p_kind = 'score' then v_xp := greatest(5, least(40, coalesce(p_value, 0))); v_coins := greatest(1, v_xp / 4);
  elsif p_kind = 'time' then
    select coalesce(sum(xp), 0) into v_today_time from public.player_log where user_id = uid and game = p_game and kind = 'time' and created_at::date = current_date;
    v_xp := least(greatest(0, coalesce(p_value, 0) / 30), greatest(0, 20 - v_today_time));   -- 1 XP za 30 s, max 20 XP (10 min) denně na hru
    v_coins := v_xp / 4;
  else raise exception 'bad kind'; end if;
  -- streak: první událost dne
  if p.streak_day is null or p.streak_day < current_date then
    if p.streak_day = current_date - 1 or p.streak_day = current_date - 2 then p.streak := p.streak + 1;   -- 1 den výpadku se odpouští
    else p.streak := 1; end if;
    p.streak_day := current_date; v_xp := v_xp + least(50, 5 * p.streak);   -- bonus za streak
  end if;
  -- sezóna / týden reset
  if p.season <> v_se then p.season := v_se; p.season_xp := 0; end if;
  if p.week <> v_wk then p.week := v_wk; p.week_xp := 0; end if;
  -- mise: postup
  m := public.ensure_missions(uid);
  for i in 0 .. jsonb_array_length(m) - 1 loop
    el := m -> i;
    if (el ->> 'done')::boolean then continue; end if;
    if (el ->> 'kind') = p_kind or ((el ->> 'kind') = 'finish' and p_kind in ('win', 'score')) then
      if (el ->> 'game') is null or (el ->> 'game') = p_game then
        el := jsonb_set(el, '{progress}', to_jsonb(least((el ->> 'target')::int, (el ->> 'progress')::int + 1)));
        if (el ->> 'progress')::int >= (el ->> 'target')::int then el := jsonb_set(el, '{done}', 'true'::jsonb); end if;
        m := jsonb_set(m, array[i::text], el); changed := true;
      end if;
    end if;
  end loop;
  if changed then update public.missions set data = m where user_id = uid and day = current_date; end if;
  update public.player set xp = xp + v_xp, coins = coins + v_coins, season_xp = p.season_xp + v_xp, season = p.season, week_xp = p.week_xp + v_xp, week = p.week, streak = p.streak, streak_day = p.streak_day, plays = plays + 1, updated_at = now() where user_id = uid returning * into p;
  insert into public.player_log (user_id, game, kind, xp, coins) values (uid, p_game, p_kind, v_xp, v_coins);
  return jsonb_build_object('xp', p.xp, 'coins', p.coins, 'level', public.level_of(p.xp), 'streak', p.streak, 'gained_xp', v_xp, 'gained_coins', v_coins, 'missions', m);
end; $$;
grant execute on function public.award(text, text, integer) to authenticated;

create or replace function public.my_state() returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); p public.player; inv text[];
begin
  if uid is null then return null; end if;
  insert into public.player (user_id) values (uid) on conflict do nothing;
  select * into p from public.player where user_id = uid;
  select coalesce(array_agg(item), '{}') into inv from public.inventory where user_id = uid;
  return jsonb_build_object('xp', p.xp, 'coins', p.coins, 'level', public.level_of(p.xp), 'streak', p.streak, 'streak_day', p.streak_day, 'season_xp', p.season_xp, 'week_xp', p.week_xp, 'plays', p.plays, 'equipped', p.equipped, 'inventory', to_jsonb(inv), 'missions', public.ensure_missions(uid));
end; $$;
grant execute on function public.my_state() to authenticated;

create or replace function public.claim_mission(p_id text) returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); m jsonb; i integer; el jsonb; got boolean := false;
begin
  if uid is null then raise exception 'login required'; end if;
  m := public.ensure_missions(uid);
  for i in 0 .. jsonb_array_length(m) - 1 loop
    el := m -> i;
    if (el ->> 'id') = p_id and (el ->> 'done')::boolean and not (el ->> 'claimed')::boolean then
      el := jsonb_set(el, '{claimed}', 'true'::jsonb); m := jsonb_set(m, array[i::text], el); got := true;
      update public.player set xp = xp + (el ->> 'xp')::int, coins = coins + (el ->> 'coins')::int, season_xp = season_xp + (el ->> 'xp')::int, week_xp = week_xp + (el ->> 'xp')::int, updated_at = now() where user_id = uid;
      insert into public.player_log (user_id, game, kind, xp, coins) values (uid, 'mission', 'claim', (el ->> 'xp')::int, (el ->> 'coins')::int);
    end if;
  end loop;
  if got then update public.missions set data = m where user_id = uid and day = current_date; end if;
  return public.my_state();
end; $$;
grant execute on function public.claim_mission(text) to authenticated;

-- obchod: položky jsou v kódu (meta.js SHOP), server jen ověří cenu ze seznamu níže
create table if not exists public.shop_items (item text primary key, slot text not null, price integer not null, pass_only boolean not null default false);
insert into public.shop_items (item, slot, price, pass_only) values
  ('ball_neon','ball',150,false),('ball_lava','ball',300,false),('ball_galaxy','ball',600,false),('ball_gold','ball',0,true),
  ('name_aqua','name',100,false),('name_coral','name',100,false),('name_gold','name',500,false),('name_rainbow','name',0,true),
  ('trail_sparkle','trail',250,false),('trail_fire','trail',400,false),
  ('badge_star','badge',200,false),('badge_crown','badge',800,false)
on conflict (item) do update set slot = excluded.slot, price = excluded.price, pass_only = excluded.pass_only;
alter table public.shop_items enable row level security; create policy "shop read" on public.shop_items for select to anon, authenticated using (true);

create or replace function public.buy_item(p_item text) returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); it public.shop_items; c integer; has_pass boolean;
begin
  if uid is null then raise exception 'login required'; end if;
  select * into it from public.shop_items where item = p_item; if it is null then raise exception 'no such item'; end if;
  if exists (select 1 from public.inventory where user_id = uid and item = p_item) then return public.my_state(); end if;
  select coalesce(pass_until > now(), false) into has_pass from public.profiles where id = uid;
  if it.pass_only and not coalesce(has_pass, false) then raise exception 'pass required'; end if;
  select coins into c from public.player where user_id = uid; if coalesce(c, 0) < it.price then raise exception 'not enough coins'; end if;
  update public.player set coins = coins - it.price where user_id = uid;
  insert into public.inventory (user_id, item) values (uid, p_item);
  return public.my_state();
end; $$;
grant execute on function public.buy_item(text) to authenticated;

create or replace function public.equip(p_slot text, p_item text) returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'login required'; end if;
  if p_item is not null and not exists (select 1 from public.inventory where user_id = uid and item = p_item) then raise exception 'not owned'; end if;
  update public.player set equipped = case when p_item is null then equipped - p_slot else equipped || jsonb_build_object(p_slot, p_item) end where user_id = uid;
  return public.my_state();
end; $$;
grant execute on function public.equip(text, text) to authenticated;

-- žebříčky: týden, sezóna, celkově
create or replace view public.board_week as select p.user_id, pr.name, p.week_xp as xp, public.level_of(p.xp) as level, rank() over (order by p.week_xp desc, p.updated_at asc) as rank from public.player p join public.profiles pr on pr.id = p.user_id where p.week = to_char(now(), 'IYYY-IW') and p.week_xp > 0;
create or replace view public.board_season as select p.user_id, pr.name, p.season_xp as xp, public.level_of(p.xp) as level, rank() over (order by p.season_xp desc, p.updated_at asc) as rank from public.player p join public.profiles pr on pr.id = p.user_id where p.season = to_char(now(), 'YYYY-MM') and p.season_xp > 0;
create or replace view public.board_all as select p.user_id, pr.name, p.xp, public.level_of(p.xp) as level, p.streak, rank() over (order by p.xp desc, p.updated_at asc) as rank from public.player p join public.profiles pr on pr.id = p.user_id where p.xp > 0;
grant select on public.board_week, public.board_season, public.board_all to anon, authenticated;
