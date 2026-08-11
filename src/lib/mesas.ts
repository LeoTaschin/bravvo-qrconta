import type { RestaurantTable } from '@/lib/supabase/types';

/** Nome de exibição da mesa: usa o nome customizado se houver, senão "Mesa NN". */
export function nomeMesa(mesa: Pick<RestaurantTable, 'number' | 'name'>): string {
  return mesa.name?.trim() || `Mesa ${String(mesa.number).padStart(2, '0')}`;
}

/**
 * Interpreta o campo livre "Nome ou número" do formulário de nova mesa.
 * - "45" ou "Mesa 45" -> vira o número 45, sem nome customizado (exibe "Mesa 45").
 * - Qualquer outro texto (ex: "Varanda 01") -> vira o nome customizado; o
 *   número é atribuído automaticamente (só serve de identificador interno).
 */
export function interpretarNomeOuNumero(valor: string): { number: number | null; name: string | null } {
  const texto = valor.trim();
  if (/^\d+$/.test(texto)) return { number: Number(texto), name: null };

  const comoMesaNumero = texto.match(/^mesa\s+0*(\d+)$/i);
  if (comoMesaNumero) return { number: Number(comoMesaNumero[1]), name: null };

  return { number: null, name: texto || null };
}
