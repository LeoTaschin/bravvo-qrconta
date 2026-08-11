-- "Limpar mesa": botão no painel do funcionário pra encerrar a sessão atual
-- de uma mesa (zera a conta e desocupa a mesa), essencial pro cenário de
-- rotatividade — cliente pagou por fora, foi embora sem pagar, ou a sessão
-- ficou "presa" por qualquer motivo, e a próxima mesa precisa começar do zero.
--
-- Encerrar = table_sessions.status = 'closed'. Não apaga session_items nem
-- pix_charges (ficam como histórico ligados à sessão fechada); a próxima
-- chamada de getOrCreateOpenSession() pra essa mesa cria uma sessão nova e
-- vazia, já que só pode haver uma sessão aberta por mesa por vez.

-- Funcionário pode encerrar (não reabrir) sessões de mesas do próprio restaurante.
-- O "with check (status = 'closed')" garante que só dá pra transicionar pra
-- fechado, nunca reescrever outros campos pra reabrir uma sessão.
create policy "funcionario fecha sessao da mesa" on table_sessions
  for update using (
    exists (
      select 1
      from tables t
      join staff s on s.restaurant_id = t.restaurant_id
      where t.id = table_sessions.table_id
        and s.user_id = auth.uid()
    )
  )
  with check (status = 'closed');

-- table_sessions ainda não estava no Realtime — a grade de mesas do painel
-- escuta mudanças nela pra marcar mesa como livre/ocupada ao vivo.
alter publication supabase_realtime add table table_sessions;
