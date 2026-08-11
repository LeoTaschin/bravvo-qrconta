-- Seed de teste: roda no Supabase SQL Editor (Dashboard), não pela app.
-- Cria restaurante + mesa + sessão aberta + itens, simulando o cadastro manual
-- que o dono do restaurante faria (restaurants/tables/session_items não são
-- inseríveis pela anon key — só leitura pública, ver 20260804000001_rls_cliente_publico.sql).

with restaurante as (
  insert into restaurants (name, city, pix_key)
  values ('Bravvo Pizzaria Italiana', 'Sao Paulo', 'teste-piloto@bravvo.dev')
  returning id
),
mesa as (
  insert into tables (restaurant_id, number, qr_slug)
  select id, 43, 'mesa-43' from restaurante
  returning id
),
sessao as (
  insert into table_sessions (table_id)
  select id from mesa
  returning id
)
insert into session_items (session_id, name, quantity, unit_price)
select id, name, quantity, unit_price
from sessao, (values
  ('Pizza castelões pequena', 1, 99.99),
  ('Rotolinas', 2, 29.9),
  ('Coca-cola lata', 3, 4.9),
  ('Pizza pistache', 1, 59.99)
) as itens(name, quantity, unit_price);

-- Depois de rodar, teste em /mesa/mesa-43
