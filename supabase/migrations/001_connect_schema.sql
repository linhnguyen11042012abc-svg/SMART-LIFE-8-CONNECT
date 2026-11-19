-- SMART LIFE 8.0 CONNECT: initial global community schema
-- Run in Supabase SQL Editor. All new community posts start pending moderation.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 24),
  avatar_color text not null default 'blue',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 80),
  category text not null check (category in ('Thiện nguyện','Bảo vệ môi trường','Chia sẻ kiến thức','Hoạt động trường học','Thành tích học tập')),
  body text not null check (char_length(body) between 3 and 1000),
  moderation_status text not null default 'pending' check (moderation_status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  moderation_status text not null default 'pending' check (moderation_status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  reason text not null check (char_length(reason) between 3 and 300),
  status text not null default 'open' check (status in ('open','reviewed','closed')),
  created_at timestamptz not null default now(),
  check ((post_id is not null)::int + (comment_id is not null)::int = 1)
);

create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists public.learning_stats (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  xp bigint not null default 0 check (xp >= 0),
  coins bigint not null default 0 check (coins >= 0),
  streak_days integer not null default 0 check (streak_days >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.xp_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null check (amount between -1000 and 1000),
  reason text not null check (char_length(reason) between 2 and 120),
  created_at timestamptz not null default now()
);

create index if not exists posts_feed_idx on public.posts (created_at desc) where moderation_status = 'approved';
create index if not exists comments_post_idx on public.comments (post_id, created_at asc) where moderation_status = 'approved';

-- Create a safe display profile from signup metadata; email is never copied into public profile.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 'Học sinh'))
  on conflict (id) do nothing;
  insert into public.learning_stats (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_smart_life on auth.users;
create trigger on_auth_user_created_smart_life
after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.post_likes enable row level security;
alter table public.content_reports enable row level security;
alter table public.blocks enable row level security;
alter table public.learning_stats enable row level security;
alter table public.xp_ledger enable row level security;

-- Profiles expose only display aliases, never email or contact details.
create policy "profiles are readable by signed-in users" on public.profiles
for select to authenticated using (true);
create policy "users create own profile" on public.profiles
for insert to authenticated with check (auth.uid() = id);
create policy "users update own profile" on public.profiles
for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Global feed: only approved posts are public to signed-in users; authors can see their own pending posts.
create policy "read approved posts or own pending" on public.posts
for select to authenticated using (moderation_status = 'approved' or author_id = auth.uid());
create policy "users submit own posts for review" on public.posts
for insert to authenticated with check (author_id = auth.uid() and moderation_status = 'pending');
create policy "authors delete own posts" on public.posts
for delete to authenticated using (author_id = auth.uid());

create policy "read approved comments or own pending" on public.comments
for select to authenticated using (
  moderation_status = 'approved' or author_id = auth.uid()
);
create policy "users submit own comments for review" on public.comments
for insert to authenticated with check (author_id = auth.uid() and moderation_status = 'pending');
create policy "authors delete own comments" on public.comments
for delete to authenticated using (author_id = auth.uid());

create policy "read likes on visible posts" on public.post_likes
for select to authenticated using (exists (
  select 1 from public.posts p where p.id = post_id and (p.moderation_status = 'approved' or p.author_id = auth.uid())
));
create policy "users like as themselves" on public.post_likes
for insert to authenticated with check (user_id = auth.uid() and exists (
  select 1 from public.posts p where p.id = post_id and p.moderation_status = 'approved'
));
create policy "users remove own likes" on public.post_likes
for delete to authenticated using (user_id = auth.uid());

create policy "users submit reports" on public.content_reports
for insert to authenticated with check (reporter_id = auth.uid());
create policy "users read own reports" on public.content_reports
for select to authenticated using (reporter_id = auth.uid());

create policy "users read own blocks" on public.blocks
for select to authenticated using (blocker_id = auth.uid());
create policy "users create own blocks" on public.blocks
for insert to authenticated with check (blocker_id = auth.uid());
create policy "users remove own blocks" on public.blocks
for delete to authenticated using (blocker_id = auth.uid());

create policy "users read own learning stats" on public.learning_stats
for select to authenticated using (user_id = auth.uid());
-- No client insert/update policy for learning_stats or xp_ledger:
-- XP and coins must be validated by trusted server logic, not edited by browser clients.
create policy "users read own xp ledger" on public.xp_ledger
for select to authenticated using (user_id = auth.uid());

grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, delete on public.posts to authenticated;
grant select, insert, delete on public.comments to authenticated;
grant select, insert, delete on public.post_likes to authenticated;
grant select, insert on public.content_reports to authenticated;
grant select, insert, delete on public.blocks to authenticated;
grant select on public.learning_stats to authenticated;
grant select on public.xp_ledger to authenticated;
