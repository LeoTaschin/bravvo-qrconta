-- Redesign da tela "Gerenciar mesas": mesas passam a poder ter um nome livre
-- (ex: "Varanda 01", "Balcão 02"), além do número que já existia (o número
-- continua sendo a chave usada pra rotear /admin/mesa/[numero] — não mexe
-- nisso). E o QR de cada mesa passa a poder ser desativado temporariamente
-- sem excluir a mesa (ex: mesa interditada, mesa fora de uso na baixa
-- temporada), sem depender de apagar o cadastro.

alter table tables add column name text;
alter table tables add column qr_active boolean not null default true;

-- A policy pública antiga ("leitura publica tables", using (true)) deixava
-- qualquer mesa legível por qualquer um, ativa ou não. Substitui por uma
-- versão restrita a mesas com QR ativo — assim o cliente não consegue abrir
-- a conta de uma mesa desativada nem sabendo o slug. Precisa então de uma
-- policy separada pro funcionário continuar enxergando TODAS as mesas do
-- próprio restaurante (inclusive as desativadas) na tela "Gerenciar mesas".
drop policy "leitura publica tables" on tables;

create policy "leitura publica tables ativas" on tables
  for select using (qr_active = true);

create policy "funcionario le mesas do proprio restaurante" on tables
  for select using (
    exists (
      select 1 from staff
      where staff.user_id = auth.uid()
        and staff.restaurant_id = tables.restaurant_id
    )
  );
