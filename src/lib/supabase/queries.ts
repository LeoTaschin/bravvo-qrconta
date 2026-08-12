import { supabase } from './client';
import type {
  ChargeType,
  PixCharge,
  Restaurant,
  RestaurantTable,
  SessionItem,
  TableSession,
} from './types';

export async function getTableBySlug(slug: string): Promise<RestaurantTable | null> {
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .eq('qr_slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getRestaurant(restaurantId: string): Promise<Restaurant | null> {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', restaurantId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getOrCreateOpenSession(tableId: string): Promise<TableSession> {
  const { data: existing, error: selectError } = await supabase
    .from('table_sessions')
    .select('*')
    .eq('table_id', tableId)
    .eq('status', 'open')
    .maybeSingle();
  if (selectError) throw selectError;
  if (existing) return existing;

  const { data: created, error: insertError } = await supabase
    .from('table_sessions')
    .insert({ table_id: tableId })
    .select('*')
    .single();

  if (insertError) {
    // Duas pessoas escanearam o QR ao mesmo tempo e ambas tentaram abrir sessão:
    // o índice único (uma sessão aberta por mesa) rejeita a segunda — busca a que já existe.
    const { data: fallback, error: fallbackError } = await supabase
      .from('table_sessions')
      .select('*')
      .eq('table_id', tableId)
      .eq('status', 'open')
      .maybeSingle();
    if (fallbackError) throw fallbackError;
    if (fallback) return fallback;
    throw insertError;
  }

  return created;
}

export async function getSessionItems(sessionId: string): Promise<SessionItem[]> {
  const { data, error } = await supabase
    .from('session_items')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getSessionCharges(sessionId: string): Promise<PixCharge[]> {
  const { data, error } = await supabase
    .from('pix_charges')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/**
 * Separa `quantidade` unidades de uma linha da comanda numa linha nova, e
 * devolve o id dela. Serve pro cliente pagar 1 das 3 águas sem levar as outras
 * duas junto — a reserva é sempre por linha inteira.
 *
 * Roda como função no banco porque criar linha na comanda é justamente o que o
 * cliente não pode fazer solto (ver a migration 20260814090000).
 */
export async function dividirItemDaComanda(itemId: string, quantidade: number): Promise<string> {
  const { data, error } = await supabase.rpc('dividir_item_da_comanda', {
    p_item_id: itemId,
    p_quantidade: quantidade,
  });
  if (error) throw error;
  return data as string;
}

interface CriarCobrancaParams {
  sessionId: string;
  chargeType: ChargeType;
  amount: number;
  txid: string;
  brcode: string;
  peoplePaying?: number;
  peopleTotal?: number;
  itemIds?: string[];
}

/**
 * Cria a cobrança Pix e, no caso de "pagar itens selecionados", reserva os itens
 * escolhidos (status unpaid -> reserved) amarrados a essa cobrança.
 * Confere que os itens ainda estavam 'unpaid' antes de reservar, para evitar
 * que dois clientes reservem o mesmo item ao mesmo tempo.
 */
export async function criarCobranca({
  sessionId,
  chargeType,
  amount,
  txid,
  brcode,
  peoplePaying,
  peopleTotal,
  itemIds,
}: CriarCobrancaParams): Promise<PixCharge> {
  const { data: charge, error: chargeError } = await supabase
    .from('pix_charges')
    .insert({
      session_id: sessionId,
      charge_type: chargeType,
      amount,
      txid,
      brcode,
      people_paying: peoplePaying ?? null,
      people_total: peopleTotal ?? null,
    })
    .select('*')
    .single();
  if (chargeError) throw chargeError;

  if (chargeType === 'items' && itemIds && itemIds.length > 0) {
    const { data: reservedItems, error: reserveError } = await supabase
      .from('session_items')
      .update({ status: 'reserved', reserved_by_charge_id: charge.id })
      .in('id', itemIds)
      .eq('status', 'unpaid')
      .select('id');

    if (reserveError) throw reserveError;

    if (!reservedItems || reservedItems.length !== itemIds.length) {
      // Algum item já foi pego por outro cliente entre a seleção e a confirmação:
      // desfaz a cobrança criada para não deixar uma cobrança "órfã" sem itens válidos.
      await supabase.from('pix_charges').delete().eq('id', charge.id);
      throw new Error(
        'Um ou mais itens selecionados já foram reservados por outro cliente. Atualize a página e tente novamente.'
      );
    }

    const { error: linkError } = await supabase
      .from('pix_charge_items')
      .insert(itemIds.map((sessionItemId) => ({ pix_charge_id: charge.id, session_item_id: sessionItemId })));
    if (linkError) throw linkError;
  }

  return charge;
}

export async function marcarComoPago(chargeId: string): Promise<void> {
  const { error } = await supabase
    .from('pix_charges')
    .update({ status: 'pending_confirmation' })
    .eq('id', chargeId);
  if (error) throw error;
}
