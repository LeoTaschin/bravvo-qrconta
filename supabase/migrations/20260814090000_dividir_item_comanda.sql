-- Permite o cliente pagar só parte das unidades de uma linha da comanda.
--
-- A reserva de item é por linha inteira ("3x Água" é uma linha só com
-- quantity = 3), então pagar 1 água exigia quebrar a linha em duas. O cliente
-- já pode dar update em session_items (policy "cliente reserva item"), mas não
-- pode inserir — e abrir insert pra anon deixaria qualquer um pendurar item
-- falso na conta de qualquer mesa.
--
-- Daí a função security definer: ela é a única porta pra criar linha na comanda
-- pelo lado do cliente, e só sabe fazer uma coisa — separar unidades de uma
-- linha que já existe. O valor total da mesa não muda: (q - p) + p = q.
create or replace function dividir_item_da_comanda(p_item_id uuid, p_quantidade int)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item session_items%rowtype;
  v_novo_id uuid;
begin
  -- for update serializa dois clientes tentando separar a mesma linha ao
  -- mesmo tempo: o segundo só lê depois que o primeiro commitou, então ele vê
  -- a quantidade já reduzida e a validação abaixo barra o excesso.
  select * into v_item from session_items where id = p_item_id for update;

  if not found then
    raise exception 'Item não encontrado';
  end if;

  if v_item.status <> 'unpaid' then
    raise exception 'Item não está mais disponível';
  end if;

  if p_quantidade < 1 or p_quantidade >= v_item.quantity then
    raise exception 'Quantidade inválida para separar o item';
  end if;

  update session_items
  set quantity = quantity - p_quantidade
  where id = p_item_id;

  insert into session_items (session_id, name, quantity, unit_price, status)
  values (v_item.session_id, v_item.name, p_quantidade, v_item.unit_price, 'unpaid')
  returning id into v_novo_id;

  return v_novo_id;
end;
$$;

revoke all on function dividir_item_da_comanda(uuid, int) from public;
grant execute on function dividir_item_da_comanda(uuid, int) to anon, authenticated;
