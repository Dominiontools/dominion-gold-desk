-- Dominion Gold Signal Desk subscription foundation
-- Run in Supabase SQL Editor. Review before production use.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null default 'monthly',
  status text not null default 'pending' check (status in ('pending','active','rejected','expired')),
  started_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.payment_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  method text not null check (method in ('bank_transfer','usdt_bep20','usdt_trc20')),
  transaction_reference text not null,
  payer_note text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payment_submissions enable row level security;

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile" on public.profiles for select to authenticated using (auth.uid() = id);
drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
drop policy if exists "Users read own subscriptions" on public.subscriptions;
create policy "Users read own subscriptions" on public.subscriptions for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users submit own payment references" on public.payment_submissions;
create policy "Users submit own payment references" on public.payment_submissions for insert to authenticated with check (auth.uid() = user_id and status = 'pending');
drop policy if exists "Users read own payment submissions" on public.payment_submissions;
create policy "Users read own payment submissions" on public.payment_submissions for select to authenticated using (auth.uid() = user_id);

-- No customer update policy: customers cannot self-approve payments/subscriptions.
-- For this prototype, review and approve manually through a trusted admin session in Supabase.
