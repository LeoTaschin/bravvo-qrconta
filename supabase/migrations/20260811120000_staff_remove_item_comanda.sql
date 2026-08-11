-- A nova comanda digital do painel do funcionário permite remover um item
-- lançado por engano ou "remover todos os itens" da mesa. session_items hoje
-- não tem NENHUMA policy de delete (só select/update/insert) — sem isso a
-- remoção falha silenciosamente pelo RLS.
create policy "funcionario remove item da comanda" on session_items
  for delete using (
    exists (
      select 1
      from table_sessions ts
      join tables t on t.id = ts.table_id
      join staff s on s.restaurant_id = t.restaurant_id
      where ts.id = session_items.session_id
        and s.user_id = auth.uid()
    )
  );
