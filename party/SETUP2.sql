-- ARCADE: doplněk – obecný žebříček pro další hry (Merge a budoucí). Spusť po SETUP.sql.
create table if not exists public.scores_game (
  game        text not null,
  device_id   text not null,
  name        text not null default 'Player',
  score       integer not null default 0,
  updated_at  timestamptz not null default now(),
  primary key (game, device_id)
);
create index if not exists scores_game_idx on public.scores_game (game, score desc, updated_at asc);
alter table public.scores_game enable row level security;
create policy "scores_game public read" on public.scores_game for select to anon, authenticated using (true);

create or replace view public.leaderboard_game as
  select game, rank() over (partition by game order by score desc, updated_at asc) as rank, name, score, device_id
  from public.scores_game where score > 0;
grant select on public.leaderboard_game to anon, authenticated;

create or replace function public.submit_score_game(p_game text, p_device text, p_name text, p_score integer)
returns integer language plpgsql security definer set search_path = public as $$
declare v_rank integer; v_name text := left(coalesce(nullif(trim(p_name), ''), 'Player'), 12);
begin
  if p_device is null or length(p_device) < 8 or length(p_device) > 64 then raise exception 'bad device'; end if;
  if p_score < 0 or p_score > 10000000 then raise exception 'bad score'; end if;
  insert into public.scores_game (game, device_id, name, score, updated_at) values (p_game, p_device, v_name, p_score, now())
  on conflict (game, device_id) do update set name = excluded.name, score = greatest(public.scores_game.score, excluded.score),
    updated_at = case when excluded.score > public.scores_game.score then now() else public.scores_game.updated_at end;
  select rank into v_rank from public.leaderboard_game where game = p_game and device_id = p_device;
  return v_rank;
end; $$;
grant execute on function public.submit_score_game(text, text, text, integer) to anon, authenticated;
