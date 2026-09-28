-- Customer accounts: one row per verified email (id = email), profile and saved items in `data`.
-- Sign-in itself is handled by Supabase Auth (email one-time codes); this table holds the shop's own profile.
create table if not exists public.customers (
  id          text primary key,
  created_at  timestamptz not null default now(),
  status      text,
  email       text,
  data        jsonb not null default '{}'::jsonb
);
create index if not exists customers_created_at_idx on public.customers (created_at desc);
create index if not exists customers_status_idx on public.customers (status);
create index if not exists customers_email_idx on public.customers (email);
alter table public.customers enable row level security;
