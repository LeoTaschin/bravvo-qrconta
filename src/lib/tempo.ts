/**
 * Formata a duração entre uma data ISO e o instante atual (em ms), como
 * "12 min" ou "1h 20min". Usado para mostrar há quanto tempo uma mesa está
 * aberta, tanto na grade do salão quanto no cabeçalho da página da mesa.
 */
export function formatarTempoDecorrido(desde: string, agoraMs: number): string {
  const minutos = Math.max(0, Math.round((agoraMs - new Date(desde).getTime()) / 60_000));
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const restoMinutos = minutos % 60;
  return `${horas}h ${restoMinutos}min`;
}
