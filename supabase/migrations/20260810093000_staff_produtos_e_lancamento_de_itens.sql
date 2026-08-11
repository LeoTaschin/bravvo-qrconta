-- Login por funcionário: liga um usuário do Supabase Auth a um restaurante
-- (tabela staff) e cadastro do catálogo de produtos (tabela products), usado
-- pelo painel do funcionário pra lançar itens na comanda a partir de um menu
-- pré-cadastrado (não texto livre). Cadastro de funcionário (linha em staff,
-- criação do auth.users) e de produtos continuam manuais, feitos por você
-- direto no Dashboard/SQL — mesmo padrão hoje usado para restaurants/tables.

create table staff (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id),
  restaurant_id uuid not null references restaurants(id),
  name text not null,
  created_at timestamptz not null default now()
);

create index idx_staff_restaurant_id on staff(restaurant_id);

create table products (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id),
  name text not null,
  price numeric(10,2) not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_products_restaurant_id on products(restaurant_id);

alter table staff enable row level security;
alter table products enable row level security;

-- Funcionário só enxerga o próprio vínculo (usado pra descobrir seu restaurant_id).
create policy "funcionario le seu proprio cadastro" on staff
  for select using (user_id = auth.uid());

-- Funcionário só lê o catálogo do restaurante ao qual está vinculado.
create policy "funcionario le catalogo do proprio restaurante" on products
  for select using (
    exists (
      select 1 from staff
      where staff.user_id = auth.uid()
        and staff.restaurant_id = products.restaurant_id
    )
  );

-- Funcionário logado pode lançar itens na comanda de uma sessão que pertence
-- ao restaurante dele (session_items hoje não tem NENHUMA policy de insert —
-- lançamento sempre foi manual via Dashboard, que ignora RLS por ser owner).
create policy "funcionario lanca item na comanda" on session_items
  for insert with check (
    exists (
      select 1
      from table_sessions ts
      join tables t on t.id = ts.table_id
      join staff s on s.restaurant_id = t.restaurant_id
      where ts.id = session_items.session_id
        and s.user_id = auth.uid()
    )
  );

-- Não há insert/update/delete policy em staff/products: cadastro continua
-- manual via Studio (mesmo modelo de restaurants/tables hoje).
