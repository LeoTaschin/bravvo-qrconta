-- Schema inicial do QRConta (Bravvo conta)
-- Referência: fluxo-cliente.md

-- Restaurante (multi-tenant desde já, validação inicial com 1 restaurante)
create table restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  pix_key text not null,
  created_at timestamptz not null default now()
);

-- Mesa física do restaurante (fixa, QR impresso nela)
create table tables (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id),
  number int not null,
  qr_slug text not null unique, -- identifica a mesa, não a sessão
  created_at timestamptz not null default now()
);

-- Sessão de atendimento (abre no primeiro pedido, fecha quando conta é 100% paga)
create table table_sessions (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references tables(id),
  status text not null default 'open' check (status in ('open', 'closed')),
  session_token uuid not null default gen_random_uuid(), -- vai na URL/QR da sessão atual
  opened_at timestamptz not null default now(),
  closed_at timestamptz
);

create index idx_table_sessions_table_id on table_sessions(table_id);
create unique index idx_table_sessions_open_per_table
  on table_sessions(table_id) where status = 'open';

-- Itens lançados manualmente na comanda
create table session_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references table_sessions(id),
  name text not null,
  quantity int not null default 1,
  unit_price numeric(10,2) not null,
  status text not null default 'unpaid' check (status in ('unpaid', 'reserved', 'paid')),
  reserved_by_charge_id uuid,
  created_at timestamptz not null default now()
);

create index idx_session_items_session_id on session_items(session_id);

-- Cobrança Pix (BRCode) — conta cheia, divisão igual, ou itens selecionados
create table pix_charges (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references table_sessions(id),
  charge_type text not null default 'full' check (charge_type in ('full', 'equal_split', 'items')),
  people_paying int,   -- só para equal_split (ex: 1)
  people_total int,    -- só para equal_split (ex: 4)
  txid text not null unique,
  amount numeric(10,2) not null,
  brcode text not null, -- payload copia-e-cola / QR
  status text not null default 'pending'
    check (status in ('pending', 'pending_confirmation', 'paid', 'expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '15 minutes'),
  paid_at timestamptz
);

create index idx_pix_charges_session_id on pix_charges(session_id);
create index idx_pix_charges_status on pix_charges(status);

alter table session_items
  add constraint fk_session_items_reserved_by_charge
  foreign key (reserved_by_charge_id) references pix_charges(id);

-- Liga uma cobrança "por itens" aos itens específicos escolhidos
create table pix_charge_items (
  pix_charge_id uuid not null references pix_charges(id),
  session_item_id uuid not null references session_items(id),
  primary key (pix_charge_id, session_item_id)
);
