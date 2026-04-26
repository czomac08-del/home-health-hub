-- Profile attribution
alter table public.profiles
  add column if not exists referral_source text,
  add column if not exists promo_code text,
  add column if not exists affiliate_code text;

create index if not exists idx_profiles_affiliate_code on public.profiles(affiliate_code);
create index if not exists idx_profiles_referral_source on public.profiles(referral_source);

-- Subscription plan type (standard | deal_funded | trial)
alter table public.subscriptions
  add column if not exists plan_type text not null default 'standard';

-- closed_deals
create table if not exists public.closed_deals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  deal_address text not null,
  close_date date not null,
  purchase_price integer,
  platform_fee_cents integer not null default 2500,
  platform_fee_charged boolean not null default false,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  charged_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.closed_deals enable row level security;

create policy "Users view own closed deals" on public.closed_deals
  for select to authenticated using (auth.uid() = user_id);
create policy "Users insert own closed deals" on public.closed_deals
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own closed deals" on public.closed_deals
  for update to authenticated using (auth.uid() = user_id);
create policy "Admins view all closed deals" on public.closed_deals
  for select to authenticated using (public.is_admin(auth.uid()));

create trigger trg_closed_deals_updated
  before update on public.closed_deals
  for each row execute function public.update_updated_at_column();

-- affiliate_partners
create table if not exists public.affiliate_partners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  code text not null unique,
  rev_share_pct numeric(5,2) not null default 20.00,
  total_referred integer not null default 0,
  total_earned_cents integer not null default 0,
  stripe_payout_id text,
  contact_email text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.affiliate_partners enable row level security;

create policy "Partner views own row" on public.affiliate_partners
  for select to authenticated using (auth.uid() = user_id);
create policy "Admins manage partners" on public.affiliate_partners
  for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create trigger trg_affiliate_partners_updated
  before update on public.affiliate_partners
  for each row execute function public.update_updated_at_column();

-- affiliate_earnings
create table if not exists public.affiliate_earnings (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliate_partners(id) on delete cascade,
  month date not null,
  subscribers_count integer not null default 0,
  gross_revenue_cents integer not null default 0,
  rev_share_amount_cents integer not null default 0,
  paid_out boolean not null default false,
  paid_at timestamptz,
  stripe_payout_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (affiliate_id, month)
);
alter table public.affiliate_earnings enable row level security;

create policy "Partner views own earnings" on public.affiliate_earnings
  for select to authenticated using (
    exists (
      select 1 from public.affiliate_partners ap
      where ap.id = affiliate_earnings.affiliate_id and ap.user_id = auth.uid()
    )
  );
create policy "Admins manage earnings" on public.affiliate_earnings
  for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create trigger trg_affiliate_earnings_updated
  before update on public.affiliate_earnings
  for each row execute function public.update_updated_at_column();

-- affiliate_referrals
create table if not exists public.affiliate_referrals (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliate_partners(id) on delete cascade,
  referred_user_id uuid not null references auth.users(id) on delete cascade,
  signed_up_at timestamptz not null default now(),
  first_paid_at timestamptz,
  active boolean not null default true,
  unique (affiliate_id, referred_user_id)
);
alter table public.affiliate_referrals enable row level security;

create policy "Partner views own referrals" on public.affiliate_referrals
  for select to authenticated using (
    exists (
      select 1 from public.affiliate_partners ap
      where ap.id = affiliate_referrals.affiliate_id and ap.user_id = auth.uid()
    )
  );
create policy "Admins manage referrals" on public.affiliate_referrals
  for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create index if not exists idx_affiliate_earnings_affiliate on public.affiliate_earnings(affiliate_id, month desc);
create index if not exists idx_affiliate_referrals_affiliate on public.affiliate_referrals(affiliate_id);
create index if not exists idx_closed_deals_user on public.closed_deals(user_id, close_date desc);