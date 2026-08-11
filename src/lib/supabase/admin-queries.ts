import { supabase } from './client';
import type { Product, Restaurant, RestaurantTable, SessionItem, Staff, TableSession } from './types';

export async function getStaffForCurrentUser(): Promise<Staff | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.from('staff').select('*').eq('user_id', user.id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getRestaurantById(restaurantId: string): Promise<Restaurant | null> {
  const { data, error } = await supabase.from('restaurants').select('*').eq('id', restaurantId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getTablesForRestaurant(restaurantId: string): Promise<RestaurantTable[]> {
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('number', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getTableByNumber(restaurantId: string, number: number): Promise<RestaurantTable | null> {
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('number', number)
    .maybeSingle();
  if (error) throw error;
  return data;
}

function gerarSlugMesa(): string {
  return `mesa-${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`;
}

export async function createTable(
  restaurantId: string,
  number: number,
  name: string | null
): Promise<RestaurantTable> {
  const { data, error } = await supabase
    .from('tables')
    .insert({ restaurant_id: restaurantId, number, name, qr_slug: gerarSlugMesa() })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateTableName(tableId: string, name: string | null): Promise<void> {
  const { error } = await supabase.from('tables').update({ name }).eq('id', tableId);
  if (error) throw error;
}

export async function setTableQrActive(tableId: string, qrActive: boolean): Promise<void> {
  const { error } = await supabase.from('tables').update({ qr_active: qrActive }).eq('id', tableId);
  if (error) throw error;
}

export async function regenerateTableSlug(tableId: string): Promise<RestaurantTable> {
  const { data, error } = await supabase
    .from('tables')
    .update({ qr_slug: gerarSlugMesa() })
    .eq('id', tableId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

/**
 * Remove o cadastro da mesa. Só funciona se ela nunca teve nenhuma sessão
 * (table_sessions.table_id referencia tables sem cascade, de propósito, pra
 * não apagar histórico de atendimento junto). Se a mesa já foi usada, o
 * Postgres rejeita com violação de chave estrangeira (código 23503) — quem
 * chama trata esse erro pra avisar o funcionário.
 */
export async function deleteTable(tableId: string): Promise<void> {
  const { error } = await supabase.from('tables').delete().eq('id', tableId);
  if (error) throw error;
}

/**
 * Encerra a sessão (limpa a mesa): zera a conta e desocupa a mesa pra próxima
 * rotatividade. Não apaga itens/cobranças — ficam como histórico ligados à
 * sessão fechada. A próxima getOrCreateOpenSession() pra essa mesa abre uma
 * sessão nova e vazia.
 */
export async function closeSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('table_sessions')
    .update({ status: 'closed', closed_at: new Date().toISOString() })
    .eq('id', sessionId);
  if (error) throw error;
}

/**
 * Fecha várias sessões de uma vez, ignorando saldo em aberto — usado pelo
 * botão de teste "Fechar todas as mesas" na tela de gestão, pra resetar o
 * salão rapidamente entre rodadas de teste sem passar pelo fluxo de pagamento.
 */
export async function closeSessions(sessionIds: string[]): Promise<void> {
  if (sessionIds.length === 0) return;
  const { error } = await supabase
    .from('table_sessions')
    .update({ status: 'closed', closed_at: new Date().toISOString() })
    .in('id', sessionIds);
  if (error) throw error;
}

export async function getOpenSessionsForTables(tableIds: string[]): Promise<TableSession[]> {
  if (tableIds.length === 0) return [];
  const { data, error } = await supabase
    .from('table_sessions')
    .select('*')
    .in('table_id', tableIds)
    .eq('status', 'open');
  if (error) throw error;
  return data ?? [];
}

export async function getSessionItemsForSessions(sessionIds: string[]): Promise<SessionItem[]> {
  if (sessionIds.length === 0) return [];
  const { data, error } = await supabase.from('session_items').select('*').in('session_id', sessionIds);
  if (error) throw error;
  return data ?? [];
}

export async function getProductsForRestaurant(restaurantId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('active', true)
    .order('name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** Todos os produtos do restaurante (ativos e inativos), para a tela de gestão do catálogo. */
export async function getAllProductsForRestaurant(restaurantId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createProduct(
  restaurantId: string,
  name: string,
  price: number,
  category: string | null
): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .insert({ restaurant_id: restaurantId, name, price, category })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateProduct(
  productId: string,
  fields: { name: string; price: number; category: string | null }
): Promise<Product> {
  const { data, error } = await supabase.from('products').update(fields).eq('id', productId).select('*').single();
  if (error) throw error;
  return data;
}

export async function setProductActive(productId: string, active: boolean): Promise<void> {
  const { error } = await supabase.from('products').update({ active }).eq('id', productId);
  if (error) throw error;
}

/** Remove o produto do catálogo. Seguro: session_items copia nome/preço no lançamento, sem FK para products. */
export async function deleteProduct(productId: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', productId);
  if (error) throw error;
}

/**
 * Adiciona um produto à comanda: se já existe uma linha "unpaid" desse mesmo
 * produto na sessão, só incrementa a quantidade (evita linhas duplicadas ao
 * clicar + repetidas vezes); senão cria uma linha nova com quantidade 1.
 */
export async function adicionarItemNaComanda(
  sessionId: string,
  produto: { name: string; price: number },
  itensAtuais: SessionItem[]
): Promise<void> {
  const existente = itensAtuais.find(
    (item) => item.session_id === sessionId && item.name === produto.name && item.status === 'unpaid'
  );
  if (existente) {
    await atualizarQuantidadeItem(existente.id, existente.quantity + 1);
    return;
  }

  const { error } = await supabase.from('session_items').insert({
    session_id: sessionId,
    name: produto.name,
    quantity: 1,
    unit_price: produto.price,
    status: 'unpaid',
  });
  if (error) throw error;
}

export async function atualizarQuantidadeItem(itemId: string, quantity: number): Promise<void> {
  if (quantity <= 0) {
    await removerItemDaComanda(itemId);
    return;
  }
  const { error } = await supabase.from('session_items').update({ quantity }).eq('id', itemId);
  if (error) throw error;
}

export async function removerItemDaComanda(itemId: string): Promise<void> {
  const { error } = await supabase.from('session_items').delete().eq('id', itemId);
  if (error) throw error;
}

export async function removerTodosItens(sessionId: string): Promise<void> {
  const { error } = await supabase.from('session_items').delete().eq('session_id', sessionId);
  if (error) throw error;
}
