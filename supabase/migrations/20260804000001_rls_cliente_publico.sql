-- MVP piloto: o cliente acessa a conta da mesa sem login (só escaneando o QR),
-- então o app precisa ler e escrever direto no Supabase com a chave anon.
-- Libera leitura pública (necessária pra ver a conta) e as escritas que o
-- fluxo do cliente faz sozinho (abrir sessão, gerar cobrança Pix, reservar
-- itens escolhidos, marcar "já paguei"). Lançamento de itens, cadastro de
-- mesas/restaurantes e confirmação final de pagamento continuam manuais,
-- feitos por você direto no Dashboard.
--
-- Trade-off consciente do piloto: sem autenticação de cliente, essas policies
-- são permissivas. Reforçar (ex: exigir session_token, RLS por restaurante)
-- antes de abrir para múltiplos restaurantes reais.

alter table restaurants enable row level security;
alter table tables enable row level security;
alter table table_sessions enable row level security;
alter table session_items enable row level security;
alter table pix_charges enable row level security;
alter table pix_charge_items enable row level security;

create policy "leitura publica restaurants" on restaurants for select using (true);
create policy "leitura publica tables" on tables for select using (true);

create policy "leitura publica table_sessions" on table_sessions for select using (true);
create policy "cliente abre sessao" on table_sessions for insert with check (true);

create policy "leitura publica session_items" on session_items for select using (true);
create policy "cliente reserva item" on session_items for update using (true) with check (true);

create policy "leitura publica pix_charges" on pix_charges for select using (true);
create policy "cliente cria cobranca" on pix_charges for insert with check (true);
create policy "cliente atualiza cobranca" on pix_charges for update using (true) with check (true);
create policy "cliente desfaz cobranca com item ja reservado" on pix_charges for delete using (true);

create policy "leitura publica pix_charge_items" on pix_charge_items for select using (true);
create policy "cliente vincula item a cobranca" on pix_charge_items for insert with check (true);
