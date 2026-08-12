-- Impede que o mesmo produto vire duas linhas na comanda.
--
-- O painel decidia "somar na linha existente ou criar linha nova" a partir da
-- lista de itens que já estava carregada na tela. Dois toques rápidos no "+"
-- (ou dois funcionários lançando ao mesmo tempo) liam a mesma lista antes de
-- qualquer insert, os dois concluíam "não existe ainda" e criavam duas linhas
-- de 1x em vez de uma de 2x.
--
-- A decisão passa a ser do banco, dentro de uma transação só. O lock por
-- sessão+produto é o que fecha a janela: um `select ... for update` sozinho não
-- resolveria, porque quando ainda não existe linha não há o que travar, e as
-- duas transações inseririam mesmo assim.
--
-- security invoker de propósito: a função roda com as permissões de quem chama,
-- então continua valendo a policy "funcionario lanca item na comanda". Não é
-- uma porta de entrada nova — só o mesmo insert, serializado.
create or replace function lancar_item_na_comanda(
  p_session_id uuid,
  p_name text,
  p_unit_price numeric
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_id uuid;
begin
  perform pg_advisory_xact_lock(
    hashtextextended(p_session_id::text || '|' || p_name || '|' || p_unit_price::text, 0)
  );

  select id into v_id
  from session_items
  where session_id = p_session_id
    and name = p_name
    and unit_price = p_unit_price
    and status = 'unpaid'
  order by created_at
  limit 1
  for update;

  if found then
    update session_items set quantity = quantity + 1 where id = v_id;
    return v_id;
  end if;

  insert into session_items (session_id, name, quantity, unit_price, status)
  values (p_session_id, p_name, 1, p_unit_price, 'unpaid')
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function lancar_item_na_comanda(uuid, text, numeric) from public;
grant execute on function lancar_item_na_comanda(uuid, text, numeric) to authenticated;

-- Junta as linhas duplicadas que já existem nas comandas abertas.
--
-- Só mexe em linha 'unpaid': as 'reserved'/'paid' estão amarradas a uma
-- cobrança em pix_charge_items e não podem ser fundidas nem apagadas. O valor
-- da mesa não muda — a quantidade total é preservada, só muda de linha.
update session_items alvo
set quantity = grupo.quantidade_total
from (
  select
    -- O desempate por id tem que ser o mesmo do delete abaixo: se duas linhas
    -- tiverem created_at idêntico e cada instrução escolher uma, o total é
    -- somado numa linha e a outra é a que sobrevive.
    (array_agg(id order by created_at, id))[1] as id_mais_antigo,
    sum(quantity) as quantidade_total
  from session_items
  where status = 'unpaid'
  group by session_id, name, unit_price
  having count(*) > 1
) grupo
where alvo.id = grupo.id_mais_antigo;

delete from session_items si
where si.status = 'unpaid'
  and exists (
    select 1
    from session_items outro
    where outro.session_id = si.session_id
      and outro.name = si.name
      and outro.unit_price = si.unit_price
      and outro.status = 'unpaid'
      and (outro.created_at, outro.id) < (si.created_at, si.id)
  );
