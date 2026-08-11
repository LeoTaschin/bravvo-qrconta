-- Habilita Realtime nas tabelas que a tela do cliente escuta em tempo real
-- (itens lançados/pagos e status de cobranças Pix), para atualizar a conta
-- na hora sem precisar dar refresh na página.

alter publication supabase_realtime add table session_items;
alter publication supabase_realtime add table pix_charges;
