import type { PixCharge, SessionItem } from '@/lib/supabase/types';

export function totalItem(item: SessionItem): number {
  return item.unit_price * item.quantity;
}

export function totalSessao(items: SessionItem[]): number {
  return items.reduce((acc, item) => acc + totalItem(item), 0);
}

/**
 * falta_pagar = total_sessao
 *   - soma(session_items com status = 'paid')
 *   - soma(pix_charges com charge_type = 'equal_split' e status = 'paid')
 *
 * Ver fluxo-cliente.md > "Cálculo do Falta pagar".
 */
export function calcularFaltaPagar(items: SessionItem[], charges: PixCharge[]): number {
  const total = totalSessao(items);
  const pagoEmItens = items
    .filter((item) => item.status === 'paid')
    .reduce((acc, item) => acc + totalItem(item), 0);
  const pagoEmDivisaoIgual = charges
    .filter((charge) => charge.charge_type === 'equal_split' && charge.status === 'paid')
    .reduce((acc, charge) => acc + charge.amount, 0);

  return Math.max(0, total - pagoEmItens - pagoEmDivisaoIgual);
}

export function itensDisponiveis(items: SessionItem[]): SessionItem[] {
  return items.filter((item) => item.status === 'unpaid');
}

/**
 * Taxa de serviço exibida no resumo da comanda no painel do funcionário.
 * Puramente informativa por enquanto — o fluxo de cobrança/Pix ainda não
 * inclui essa taxa (ver calcularFaltaPagar).
 */
export const TAXA_SERVICO_PERCENTUAL = 0.1;

export function calcularTaxaServico(subtotal: number): number {
  return subtotal * TAXA_SERVICO_PERCENTUAL;
}
