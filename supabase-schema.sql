-- Esquema inicial para gestão de empresa em roleplay FiveM
-- Execute no SQL Editor do seu projeto Supabase.

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('income', 'expense')),
  description text not null,
  amount numeric(12, 2) not null check (amount > 0),
  category text not null default 'Outros',
  responsible text not null default 'Equipe Vértice',
  created_at timestamptz not null default now()
);

alter table public.transactions enable row level security;

-- Políticas abertas para facilitar o protótipo com a chave anon.
-- Use apenas dados fictícios. Antes de usar em produção, integre Supabase Auth
-- e restrinja as políticas por usuário/empresa (company_id).
drop policy if exists "Demo can read transactions" on public.transactions;
create policy "Demo can read transactions"
  on public.transactions for select to anon, authenticated using (true);
drop policy if exists "Demo can add transactions" on public.transactions;
create policy "Demo can add transactions"
  on public.transactions for insert to anon, authenticated with check (true);
drop policy if exists "Demo can reset transactions" on public.transactions;
create policy "Demo can reset transactions"
  on public.transactions for delete to anon, authenticated using (true);

grant select, insert, delete on public.transactions to anon, authenticated;

create index if not exists transactions_created_at_idx
  on public.transactions (created_at desc);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  server_id text not null unique,
  role text not null,
  phone text not null default '',
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

alter table public.employees enable row level security;

drop policy if exists "Demo can read employees" on public.employees;
create policy "Demo can read employees"
  on public.employees for select to anon, authenticated using (true);
drop policy if exists "Demo can add employees" on public.employees;
create policy "Demo can add employees"
  on public.employees for insert to anon, authenticated with check (true);
drop policy if exists "Demo can remove employees" on public.employees;
create policy "Demo can remove employees"
  on public.employees for delete to anon, authenticated using (true);

grant select, insert, delete on public.employees to anon, authenticated;
create index if not exists employees_created_at_idx
  on public.employees (created_at desc);

-- Estado compartilhado do painel. Esta tabela sincroniza as demais áreas que
-- antes ficavam somente no navegador (baú, encomendas, clientes, cargos, permissões etc.).
-- A política abaixo é pública, adequada apenas para o servidor fictício de demonstração.
create table if not exists public.app_state (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

drop policy if exists "Demo can read shared app state" on public.app_state;
create policy "Demo can read shared app state"
  on public.app_state for select to anon, authenticated using (true);
drop policy if exists "Demo can add shared app state" on public.app_state;
create policy "Demo can add shared app state"
  on public.app_state for insert to anon, authenticated with check (true);
drop policy if exists "Demo can update shared app state" on public.app_state;
create policy "Demo can update shared app state"
  on public.app_state for update to anon, authenticated using (true) with check (true);
drop policy if exists "Demo can delete shared app state" on public.app_state;
create policy "Demo can delete shared app state"
  on public.app_state for delete to anon, authenticated using (true);

grant select, insert, update, delete on public.app_state to anon, authenticated;
create index if not exists app_state_updated_at_idx on public.app_state (updated_at desc);
