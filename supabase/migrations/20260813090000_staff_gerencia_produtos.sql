-- Nova aba "Produtos" no painel do funcionário: cadastrar, editar (nome, preço,
-- categoria), ativar/desativar e excluir item do catálogo. Antes disso
-- `products` só tinha a policy de leitura (staff_produtos_e_lancamento_de_itens)
-- — cadastro era 100% manual via Studio.

create policy "funcionario cria produto do proprio restaurante" on products
  for insert with check (
    exists (
      select 1 from staff
      where staff.user_id = auth.uid()
        and staff.restaurant_id = products.restaurant_id
    )
  );

create policy "funcionario edita produto do proprio restaurante" on products
  for update using (
    exists (
      select 1 from staff
      where staff.user_id = auth.uid()
        and staff.restaurant_id = products.restaurant_id
    )
  )
  with check (
    exists (
      select 1 from staff
      where staff.user_id = auth.uid()
        and staff.restaurant_id = products.restaurant_id
    )
  );

-- Produto não tem histórico ligado por FK (session_items copia nome/preço no
-- momento do lançamento, não referencia products) — excluir é seguro, sem
-- risco de apagar registro de pedido já feito.
create policy "funcionario remove produto do proprio restaurante" on products
  for delete using (
    exists (
      select 1 from staff
      where staff.user_id = auth.uid()
        and staff.restaurant_id = products.restaurant_id
    )
  );
