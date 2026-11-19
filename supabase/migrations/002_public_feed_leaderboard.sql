-- SMART LIFE 8.0: Public community and leaderboard foundation
-- This migration preserves existing tables and data.

-- 1. Allow public reading of basic profiles.
-- Profiles contain display names and avatar colors, not email addresses.
drop policy if exists "profiles_public_read" on public.profiles;
create policy "profiles_public_read"
on public.profiles
for select
to anon, authenticated
using (true);

-- 2. Allow everyone to read approved community posts.
drop policy if exists "posts_public_read_approved" on public.posts;
create policy "posts_public_read_approved"
on public.posts
for select
to anon, authenticated
using (moderation_status = 'approved');

-- 3. Check whether a post is approved.
create or replace function public.is_approved_post(p_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.posts p
    where p.id = p_post_id
      and p.moderation_status = 'approved'
  );
$$;

revoke all on function public.is_approved_post(uuid) from public;
grant execute on function public.is_approved_post(uuid) to anon, authenticated;

-- Allow public reading of approved comments on approved posts.
drop policy if exists "comments_public_read_approved" on public.comments;
create policy "comments_public_read_approved"
on public.comments
for select
to anon, authenticated
using (
  moderation_status = 'approved'
  and public.is_approved_post(post_id)
);

-- 4. Allow everyone to read likes on approved posts.
drop policy if exists "likes_public_read_approved" on public.post_likes;
create policy "likes_public_read_approved"
on public.post_likes
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.posts p
    where p.id = post_likes.post_id
      and p.moderation_status = 'approved'
  )
);

grant select on public.profiles to anon, authenticated;
grant select on public.posts to anon, authenticated;
grant select on public.comments to anon, authenticated;
grant select on public.post_likes to anon, authenticated;

-- 5. Add an idempotency key for XP transactions.
alter table public.xp_ledger
add column if not exists event_id uuid;

create unique index if not exists xp_ledger_user_event_unique
on public.xp_ledger(user_id, event_id)
where event_id is not null;

-- 6. Secure XP awarding: only the signed-in user can earn XP
-- for their own account. Maximum 25 XP per event and 100 XP per day.
create or replace function public.award_learning_xp(
  p_event_id uuid,
  p_amount integer,
  p_reason text
)
returns table(current_xp bigint, current_coins bigint, awarded integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_daily integer := 0;
  v_granted integer := 0;
  v_coins integer := 0;
begin
  if v_user is null then
    raise exception 'Bạn cần đăng nhập.';
  end if;

  if p_event_id is null
     or p_amount < 1
     or p_amount > 25
     or p_reason is null
     or char_length(trim(p_reason)) < 2
     or char_length(p_reason) > 120 then
    raise exception 'Thông tin nhận XP không hợp lệ.';
  end if;

  insert into public.learning_stats(user_id)
  values (v_user)
  on conflict (user_id) do nothing;

  perform 1
  from public.learning_stats
  where user_id = v_user
  for update;

  if exists (
    select 1 from public.xp_ledger
    where user_id = v_user and event_id = p_event_id
  ) then
    return query
    select s.xp, s.coins, 0
    from public.learning_stats s
    where s.user_id = v_user;
    return;
  end if;

  select coalesce(sum(amount), 0)::integer
  into v_daily
  from public.xp_ledger
  where user_id = v_user
    and amount > 0
    and created_at >= date_trunc('day', now());

  v_granted := greatest(0, least(p_amount, 100 - v_daily));

  if v_granted > 0 then
    v_coins := greatest(1, floor(v_granted / 5.0)::integer);

    update public.learning_stats
    set xp = xp + v_granted,
        coins = coins + v_coins,
        updated_at = now()
    where user_id = v_user;

    insert into public.xp_ledger(user_id, amount, reason, event_id)
    values (v_user, v_granted, trim(p_reason), p_event_id);
  end if;

  return query
  select s.xp, s.coins, v_granted
  from public.learning_stats s
  where s.user_id = v_user;
end;
$$;

revoke all on function public.award_learning_xp(uuid, integer, text) from public;
grant execute on function public.award_learning_xp(uuid, integer, text)
to authenticated;

-- 7. Public leaderboard: exposes display name and learning scores only.
create or replace function public.get_learning_leaderboard()
returns table(
  rank bigint,
  display_name text,
  avatar_color text,
  xp bigint,
  coins bigint
)
language sql
security definer
set search_path = public
as $$
  select
    row_number() over (order by s.xp desc, s.updated_at asc),
    p.display_name,
    p.avatar_color,
    s.xp,
    s.coins
  from public.learning_stats s
  join public.profiles p on p.id = s.user_id
  order by s.xp desc, s.updated_at asc
  limit 100;
$$;

revoke all on function public.get_learning_leaderboard() from public;
grant execute on function public.get_learning_leaderboard()
to anon, authenticated;
