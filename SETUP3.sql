-- ARCADE: postup ve hrách uložený u účtu (pokračování na jiném zařízení). Spusť po SETUP.sql.
create table if not exists public.progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  game text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, game)
);
alter table public.progress enable row level security;
create policy "own progress" on public.progress for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
