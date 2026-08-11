-- Tela "Gerenciar mesas" no painel do funcionário: cadastrar mesa nova,
-- renomear o número, regenerar o QR (qr_slug) e remover mesa. Antes disso
-- `tables` só tinha a policy de leitura pública (rls_cliente_publico) — o
-- cadastro era 100% manual via Studio, mesmo modelo hoje usado por
-- staff/products.

create policy "funcionario cria mesa do proprio restaurante" on tables
  for insert with check (
    exists (
      select 1 from staff
      where staff.user_id = auth.uid()
        and staff.restaurant_id = tables.restaurant_id
    )
  );

create policy "funcionario edita mesa do proprio restaurante" on tables
  for update using (
    exists (
      select 1 from staff
      where staff.user_id = auth.uid()
        and staff.restaurant_id = tables.restaurant_id
    )
  )
  with check (
    exists (
      select 1 from staff
      where staff.user_id = auth.uid()
        and staff.restaurant_id = tables.restaurant_id
    )
  );

-- Remover só funciona de fato se a mesa nunca teve sessão (table_sessions.table_id
-- referencia tables sem "on delete cascade" — de propósito, pra nunca apagar
-- histórico de atendimento junto com o cadastro da mesa). O painel trata esse
-- erro de FK e avisa o funcionário nesse caso.
create policy "funcionario remove mesa do proprio restaurante" on tables
  for delete using (
    exists (
      select 1 from staff
      where staff.user_id = auth.uid()
        and staff.restaurant_id = tables.restaurant_id
    )
  );
