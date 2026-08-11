import { formatarReal } from '@/lib/format';

interface ProgressoPagamentoProps {
  total: number;
  faltaPagar: number;
}

/**
 * Substitui o valor grande no topo. O número acionável (falta pagar) vive no
 * rodapé, junto do botão — aqui em cima o cliente só precisa enxergar de
 * relance o quanto da conta já foi quitado.
 *
 * Os rótulos "Pago X" / "de Y" dão sentido à barra mesmo zerada: ela mostra
 * que ninguém pagou ainda e qual é o tamanho da conta, sem repetir o total
 * como um número de destaque.
 */
export function ProgressoPagamento({ total, faltaPagar }: ProgressoPagamentoProps) {
  const pago = Math.max(0, total - faltaPagar);
  const percentualPago = total > 0 ? Math.min(100, Math.round((pago / total) * 100)) : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-black/45">
          Pago <span className="font-medium tabular-nums text-[#111827]">{formatarReal(pago)}</span>
        </span>
        <span className="tabular-nums text-black/45">de {formatarReal(total)}</span>
      </div>

      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.07]">
        <div
          className="h-full rounded-full bg-[#851619] transition-[width] duration-500 ease-out"
          style={{ width: `${percentualPago}%` }}
        />
      </div>
    </div>
  );
}
