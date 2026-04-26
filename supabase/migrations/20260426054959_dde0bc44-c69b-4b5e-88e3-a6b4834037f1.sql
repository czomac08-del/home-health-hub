
-- ============== EXTENSIONS ==============
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ============== USER CREDITS ==============
create table if not exists public.user_credits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  lifetime_purchased integer not null default 0,
  lifetime_spent integer not null default 0,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.user_credits enable row level security;

create policy "Users view own credits"
  on public.user_credits for select
  to authenticated
  using (auth.uid() = user_id);

-- No direct insert/update/delete from clients — only via SECURITY DEFINER fns.

-- Auto-create a row on first read by upserting via trigger on signup
create or replace function public.handle_new_user_credits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_credits (user_id, balance)
  values (NEW.id, 0)
  on conflict (user_id) do nothing;
  return NEW;
end;
$$;

drop trigger if exists on_auth_user_created_credits on auth.users;
create trigger on_auth_user_created_credits
  after insert on auth.users
  for each row execute function public.handle_new_user_credits();

-- Spend credits atomically. Returns true on success, false if insufficient.
create or replace function public.spend_credits(_amount integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _ok boolean := false;
begin
  if _uid is null or _amount <= 0 then return false; end if;

  insert into public.user_credits (user_id, balance) values (_uid, 0)
    on conflict (user_id) do nothing;

  update public.user_credits
     set balance = balance - _amount,
         lifetime_spent = lifetime_spent + _amount,
         updated_at = now()
   where user_id = _uid and balance >= _amount
   returning true into _ok;

  return coalesce(_ok, false);
end;
$$;

-- Grant credits (called from edge function w/ service role on Stripe webhook).
create or replace function public.grant_credits(_user_id uuid, _amount integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if _amount <= 0 then return; end if;
  insert into public.user_credits (user_id, balance, lifetime_purchased)
    values (_user_id, _amount, _amount)
    on conflict (user_id) do update
      set balance = public.user_credits.balance + _amount,
          lifetime_purchased = public.user_credits.lifetime_purchased + _amount,
          updated_at = now();
end;
$$;

revoke all on function public.grant_credits(uuid, integer) from public, anon, authenticated;

-- ============== DATA PULL LOG ==============
create table if not exists public.data_pull_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  source_name text not null,
  data_type text not null,
  api_cost_cents integer not null default 0,
  credits_charged integer not null default 0,
  status text not null check (status in ('success','failed','cached')),
  raw_response_cached boolean not null default false,
  pulled_at timestamptz not null default now()
);

create index if not exists data_pull_log_user_idx on public.data_pull_log(user_id, pulled_at desc);
create index if not exists data_pull_log_property_idx on public.data_pull_log(property_id, pulled_at desc);

alter table public.data_pull_log enable row level security;

create policy "Users view own pull log"
  on public.data_pull_log for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users insert own pull log"
  on public.data_pull_log for insert
  to authenticated
  with check (auth.uid() = user_id);

-- ============== PAID DATA CACHE ==============
create table if not exists public.data_source_cache (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  cache_key text not null,           -- e.g. normalized address
  payload jsonb not null,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null,
  unique (source_name, cache_key)
);

create index if not exists data_source_cache_expiry_idx on public.data_source_cache(expires_at);

alter table public.data_source_cache enable row level security;
-- No client policies — service role only.

-- ============== FREE-SOURCE REFRESH STATE ==============
create table if not exists public.data_source_refresh_state (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  source_name text not null,
  last_refreshed_at timestamptz not null default now(),
  last_status text,
  unique (property_id, source_name)
);

alter table public.data_source_refresh_state enable row level security;

create policy "Users view refresh state for own properties"
  on public.data_source_refresh_state for select
  to authenticated
  using (exists (
    select 1 from public.properties p
    where p.id = data_source_refresh_state.property_id and p.user_id = auth.uid()
  ));

-- updated_at touch
create or replace function public.touch_user_credits()
returns trigger language plpgsql as $$
begin NEW.updated_at = now(); return NEW; end; $$;

drop trigger if exists trg_touch_user_credits on public.user_credits;
create trigger trg_touch_user_credits before update on public.user_credits
  for each row execute function public.touch_user_credits();

-- ============== CRON: free-data refresh daily 4am UTC ==============
-- Removes any prior schedule, then schedules invocation of the edge function.
do $$ begin
  perform cron.unschedule('free-data-refresh-daily');
exception when others then null; end $$;

select cron.schedule(
  'free-data-refresh-daily',
  '0 4 * * *',
  $$
  select net.http_post(
    url := 'https://cwfauypkmwqzhfqpdeiw.supabase.co/functions/v1/free-data-refresh',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3ZmF1eXBrbXdxemhmcXBkZWl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NTY4MjIsImV4cCI6MjA5MTEzMjgyMn0.20DttEFmZeA-ZXoyKPoMQY-DJWhoFcwInOv7EZI3kDE'
    ),
    body := jsonb_build_object('triggered_by','cron','at', now())
  );
  $$
);
