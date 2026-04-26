-- =========================================================================
-- 1. property_connections — links non-owner users (realtor, inspector,
--    contractor, renter, co-owner, investor) to a property
-- =========================================================================
create type public.property_connection_role as enum (
  'co_owner',
  'renter',
  'realtor',
  'inspector',
  'contractor',
  'investor'
);

create type public.property_connection_status as enum (
  'active',
  'pending',
  'revoked'
);

create table public.property_connections (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  user_id uuid not null,
  role public.property_connection_role not null,
  status public.property_connection_status not null default 'active',
  granted_by uuid,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (property_id, user_id, role)
);

create index idx_property_connections_property on public.property_connections(property_id);
create index idx_property_connections_user on public.property_connections(user_id);

alter table public.property_connections enable row level security;

-- Property owner manages all connections
create policy "Owner manages property connections"
on public.property_connections for all
to authenticated
using (
  exists (
    select 1 from public.properties p
    where p.id = property_connections.property_id
      and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.properties p
    where p.id = property_connections.property_id
      and p.user_id = auth.uid()
  )
);

-- Connected user can view their own connection
create policy "Connected user views own connection"
on public.property_connections for select
to authenticated
using (user_id = auth.uid());

create trigger trg_property_connections_updated_at
before update on public.property_connections
for each row execute function public.update_updated_at_column();

-- =========================================================================
-- 2. inspection_notifications — per-user fan-out for new inspection reports
-- =========================================================================
create type public.inspection_notification_type as enum (
  'new_inspection_uploaded',
  'finding_resolved',
  'fix_verified'
);

create table public.inspection_notifications (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  inspection_record_id uuid references public.property_records(id) on delete cascade,
  notified_user_id uuid not null,
  user_role public.property_connection_role,
  notification_type public.inspection_notification_type not null default 'new_inspection_uploaded',
  payload jsonb not null default '{}'::jsonb,
  sent_at timestamptz not null default now(),
  read_at timestamptz,
  action_taken text
);

create index idx_inspection_notif_user_unread
  on public.inspection_notifications(notified_user_id, read_at);
create index idx_inspection_notif_property
  on public.inspection_notifications(property_id);

alter table public.inspection_notifications enable row level security;

create policy "Users view own inspection notifications"
on public.inspection_notifications for select
to authenticated
using (notified_user_id = auth.uid());

create policy "Users mark own notifications read"
on public.inspection_notifications for update
to authenticated
using (notified_user_id = auth.uid())
with check (notified_user_id = auth.uid());

-- Inserts come from the security-definer function below; no direct insert policy needed.

-- Fan-out helper: insert one notification per connected user (owner + active connections)
create or replace function public.notify_property_connections(
  _property_id uuid,
  _inspection_record_id uuid,
  _notification_type public.inspection_notification_type default 'new_inspection_uploaded',
  _payload jsonb default '{}'::jsonb
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  _inserted integer := 0;
begin
  -- Property owner
  insert into public.inspection_notifications
    (property_id, inspection_record_id, notified_user_id, user_role, notification_type, payload)
  select p.id, _inspection_record_id, p.user_id, null, _notification_type, _payload
  from public.properties p
  where p.id = _property_id;

  get diagnostics _inserted = row_count;

  -- Active connected users
  insert into public.inspection_notifications
    (property_id, inspection_record_id, notified_user_id, user_role, notification_type, payload)
  select pc.property_id, _inspection_record_id, pc.user_id, pc.role, _notification_type, _payload
  from public.property_connections pc
  where pc.property_id = _property_id
    and pc.status = 'active';

  return _inserted;
end;
$$;

-- =========================================================================
-- 3. date_verifications — receipt / permit / photo backing for backfilled
--    repair or maintenance entries
-- =========================================================================
create type public.verification_level as enum (
  'permit_verified',     -- gold
  'receipt_verified',    -- green
  'photo_timestamp',     -- blue
  'owner_claimed'        -- yellow
);

create type public.verification_entity as enum (
  'maintenance_history',
  'inspection_finding',
  'fix_verification',
  'property_record'
);

create table public.date_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  property_id uuid not null references public.properties(id) on delete cascade,
  entity_type public.verification_entity not null,
  entity_id uuid not null,
  claimed_date date not null,
  verification_level public.verification_level not null default 'owner_claimed',
  document_url text,
  document_storage_path text,
  document_type text,                -- 'receipt' | 'invoice' | 'permit' | 'work_order' | 'photo'
  exif_date timestamptz,
  exif_matches_claim boolean,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_date_verifications_entity
  on public.date_verifications(entity_type, entity_id);
create index idx_date_verifications_property
  on public.date_verifications(property_id);

alter table public.date_verifications enable row level security;

create policy "Users view own date verifications"
on public.date_verifications for select
to authenticated
using (user_id = auth.uid());

create policy "Users insert own date verifications"
on public.date_verifications for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users update own date verifications"
on public.date_verifications for update
to authenticated
using (user_id = auth.uid());

create policy "Users delete own date verifications"
on public.date_verifications for delete
to authenticated
using (user_id = auth.uid());

create trigger trg_date_verifications_updated_at
before update on public.date_verifications
for each row execute function public.update_updated_at_column();