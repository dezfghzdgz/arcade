-- ARCADE: globální rating (body ze všech her) + žebříček. Spusť po SETUP.sql.
create table if not exists public.rating (
  user_id uuid primary key references auth.users(id) on delete cascade,
  points integer not null default 0,
  games integer not null default 0,
  updated_at timestamptz not null default now()
);
create table if not exists public.rating_log (
  id bigserial primary key, user_id uuid not null references auth.users(id) on delete cascade, game text not null, points integer not null, created_at timestamptz not null default now()
);
alter table public.rating enable row level security; alter table public.rating_log enable row level security;
create policy "rating public read" on public.rating for select to anon, authenticated using (true);
create policy "own log" on public.rating_log for select to authenticated using (auth.uid() = user_id);

-- přičtení bodů: max 60 za jednu hru, max 40 zápisů za hodinu (proti podvádění)
create or replace function public.add_rating(p_game text, p_points integer) returns integer language plpgsql security definer set search_path = public as $$
declare v_pts integer := greatest(0, least(60, coalesce(p_points, 0))); v_recent integer;
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  select count(*) into v_recent from public.rating_log where user_id = auth.uid() and created_at > now() - interval '1 hour';
  if v_recent >= 40 then return (select points from public.rating where user_id = auth.uid()); end if;
  insert into public.rating_log (user_id, game, points) values (auth.uid(), p_game, v_pts);
  insert into public.rating (user_id, points, games, updated_at) values (auth.uid(), v_pts, 1, now())
  on conflict (user_id) do update set points = public.rating.points + excluded.points, games = public.rating.games + 1, updated_at = now();
  return (select points from public.rating where user_id = auth.uid());
end; $$;
grant execute on function public.add_rating(text, integer) to authenticated;

create or replace view public.rating_board as
  select r.user_id, p.name, r.points, r.games, rank() over (order by r.points desc, r.updated_at asc) as rank
  from public.rating r join public.profiles p on p.id = r.user_id;
grant select on public.rating_board to anon, authenticated;
