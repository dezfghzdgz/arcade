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
