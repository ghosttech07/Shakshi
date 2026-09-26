-- Shakshi storefront schema.
-- Every table shares one shape so the app's small data layer (src/lib/server/db.ts) can serve them all:
--   id, created_at, status and email are queryable columns; everything else lives in `data` (jsonb).
-- Only the server (service-role key) reads and writes. RLS is on with no policies, so the
-- public anon key can reach nothing.

do $$
declare t text;
begin
  foreach t in array array[
    'orders', 'bookings', 'quiz_results', 'leads', 'abandoned_carts', 'events', 'reviews',
    'gift_cards', 'warranties', 'referrals', 'stock', 'products', 'articles',
    'login_attempts', 'discount_codes', 'settings'
  ] loop
    execute format($f$
      create table if not exists public.%1$I (
        id          text primary key,
        created_at  timestamptz not null default now(),
        status      text,
        email       text,
        data        jsonb not null default '{}'::jsonb
      );
      create index if not exists %1$s_created_at_idx on public.%1$I (created_at desc);
      create index if not exists %1$s_status_idx on public.%1$I (status);
      create index if not exists %1$s_email_idx on public.%1$I (email);
      alter table public.%1$I enable row level security;
    $f$, t);
  end loop;
end $$;

-- Handy views for the team in the Supabase dashboard. security_invoker keeps them behind the tables' RLS.
create or replace view public.order_summary with (security_invoker = true) as
  select id, created_at, status, email,
         (data->>'total')::numeric as total,
         data->'customer'->>'city' as city,
         jsonb_array_length(coalesce(data->'items', '[]'::jsonb)) as item_count
  from public.orders;

create or replace view public.funnel_daily with (security_invoker = true) as
  select date_trunc('day', created_at) as day, data->>'name' as event, count(*) as n
  from public.events
  group by 1, 2;
