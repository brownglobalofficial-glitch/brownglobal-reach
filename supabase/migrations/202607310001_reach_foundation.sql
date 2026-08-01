-- BrownGlobal Reach campaign intake.
-- Apply only to the dedicated BrownGlobal Reach Supabase project.
create extension if not exists "pgcrypto";

create table public.campaign_requests (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  contact_name text not null,
  contact_email text not null,
  objective text not null,
  preferred_launch_date date,
  duration_months integer not null default 1 check (duration_months between 1 and 12),
  starting_estimate numeric(12,2) not null default 0,
  status text not null default 'new' check (status in ('new','reviewing','proposal','approved','declined','complete')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.campaign_request_placements (
  id uuid primary key default gen_random_uuid(),
  campaign_request_id uuid not null references public.campaign_requests(id) on delete cascade,
  property_key text not null,
  property_name text not null,
  starting_price numeric(12,2) not null,
  created_at timestamptz not null default now()
);

create index campaign_requests_created_by_idx on public.campaign_requests (created_by);
create index campaign_request_placements_request_idx on public.campaign_request_placements (campaign_request_id);

alter table public.campaign_requests enable row level security;
alter table public.campaign_request_placements enable row level security;

create policy "users create campaign requests"
on public.campaign_requests for insert
to authenticated
with check (created_by = (select auth.uid()));

create policy "users view their requests"
on public.campaign_requests for select
to authenticated
using (created_by = (select auth.uid()));

create policy "users add placements to their requests"
on public.campaign_request_placements for insert
to authenticated
with check (
  exists (
    select 1
    from public.campaign_requests r
    where r.id = campaign_request_id
      and r.created_by = (select auth.uid())
  )
);

create policy "users view their placements"
on public.campaign_request_placements for select
to authenticated
using (
  exists (
    select 1
    from public.campaign_requests r
    where r.id = campaign_request_id
      and r.created_by = (select auth.uid())
  )
);

revoke all on table public.campaign_requests from public, anon;
revoke all on table public.campaign_request_placements from public, anon;
grant select, insert on table public.campaign_requests to authenticated;
grant select, insert on table public.campaign_request_placements to authenticated;

comment on table public.campaign_requests is
  'Planning requests only. A campaign does not begin until availability, suitability, pricing and a written proposal are approved.';

