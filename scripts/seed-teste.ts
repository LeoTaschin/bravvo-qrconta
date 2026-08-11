import { supabase } from '../src/lib/supabase/client';

async function main() {
  const { data: restaurante, error: restauranteError } = await supabase
    .from('restaurants')
    .insert({
      name: 'Bravvo Pizzaria Italiana',
      city: 'Sao Paulo',
      pix_key: 'teste-piloto@bravvo.dev',
    })
    .select('*')
    .single();

  if (restauranteError) throw restauranteError;
  console.log('Restaurante criado:', restaurante);

  const { data: mesa, error: mesaError } = await supabase
    .from('tables')
    .insert({
      restaurant_id: restaurante.id,
      number: 43,
      qr_slug: 'mesa-43',
    })
    .select('*')
    .single();

  if (mesaError) throw mesaError;
  console.log('Mesa criada:', mesa);

  const { data: sessao, error: sessaoError } = await supabase
    .from('table_sessions')
    .insert({ table_id: mesa.id })
    .select('*')
    .single();

  if (sessaoError) throw sessaoError;
  console.log('Sessao criada:', sessao);

  const itens = [
    { session_id: sessao.id, name: 'Pizza castelões pequena', quantity: 1, unit_price: 99.99 },
    { session_id: sessao.id, name: 'Rotolinas', quantity: 2, unit_price: 29.9 },
    { session_id: sessao.id, name: 'Coca-cola lata', quantity: 3, unit_price: 4.9 },
    { session_id: sessao.id, name: 'Pizza pistache', quantity: 1, unit_price: 59.99 },
  ];

  const { data: itensCriados, error: itensError } = await supabase
    .from('session_items')
    .insert(itens)
    .select('*');

  if (itensError) throw itensError;
  console.log('Itens criados:', itensCriados);

  console.log('\nURL de teste: /mesa/mesa-43');
}

main().catch((err) => {
  console.error('Erro ao rodar seed:', err);
  process.exit(1);
});
