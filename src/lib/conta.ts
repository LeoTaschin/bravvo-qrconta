import type { ItemStatus, PixCharge, SessionItem } from '@/lib/supabase/types';

export function totalItem(item: SessionItem): number {
  return item.unit_price * item.quantity;
}

export interface ItemAgrupado {
  key: string;
  name: string;
  quantity: number;
  unitPrice: number;
  status: ItemStatus;
  total: number;
}

/**
 * Junta linhas iguais da comanda numa só, pra o cliente conferir "2x Sprite
 * Zero" em vez de duas linhas soltas do mesmo produto.
 *
 * O status entra na chave de propósito: um item já pago e outro em aberto do
 * mesmo produto precisam continuar separados, porque só um deles aparece
 * riscado. O preço unitário também, pra não somar itens lançados com valores
 * diferentes (promoção, correção de preço) numa linha com total enganoso.
 *
 * É agrupamento só de exibição — a seleção item a item no fluxo de pagamento
 * continua usando os itens originais, com seus ids.
 */
export function agruparItens(items: SessionItem[]): ItemAgrupado[] {
  const grupos = new Map<string, ItemAgrupado>();

  for (const item of items) {
    const key = `${item.name}|${item.unit_price}|${item.status}`;
    const grupo = grupos.get(key);
    if (grupo) {
      grupo.quantity += item.quantity;
      grupo.total += totalItem(item);
    } else {
      grupos.set(key, {
        key,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        status: item.status,
        total: totalItem(item),
      });
    }
  }

  return Array.from(grupos.values());
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

export interface DivisaoIgual {
  /** Quanto vale uma parte (o que cada pessoa da mesa paga). */
  valorParte: number;
  /** Quanto este cliente paga, somando as partes que escolheu cobrir. */
  seuTotal: number;
}

/**
 * Divide a conta em partes iguais trabalhando em centavos, pra a soma das
 * partes bater exatamente com o valor devido.
 *
 * Dividir em reais e arredondar deixava resto órfão: R$ 100,00 entre 3 vira
 * 33,33 por pessoa, todo mundo paga e sobra 1 centavo em aberto na mesa — o
 * garçom não consegue fechar a comanda.
 *
 * O resto fica com quem cobre a mesa inteira. Enquanto o cliente paga só uma
 * fatia, ele vê o valor redondo da parte (33,33) — cobrar 1 centavo a mais que
 * a legenda "cada parte fica em" logo abaixo é o tipo de contradição que faz o
 * cliente desconfiar da conta. E os centavos não se perdem: cada pagamento
 * recalcula o falta_pagar, então eles sobram no valor de quem fecha por último,
 * que aí cobre tudo e paga o resto junto.
 */
export function calcularDivisaoIgual(
  faltaPagar: number,
  peoplePaying: number,
  peopleTotal: number
): DivisaoIgual {
  if (peopleTotal <= 0) return { valorParte: 0, seuTotal: 0 };

  const totalCentavos = Math.round(faltaPagar * 100);
  const centavosPorParte = Math.floor(totalCentavos / peopleTotal);
  const centavosDeResto = totalCentavos - centavosPorParte * peopleTotal;

  const partes = Math.min(peoplePaying, peopleTotal);
  const seuTotalCentavos =
    centavosPorParte * partes + (partes === peopleTotal ? centavosDeResto : 0);

  return {
    valorParte: centavosPorParte / 100,
    seuTotal: seuTotalCentavos / 100,
  };
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
