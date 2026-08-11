import { formatarReal } from '@/lib/format';
import type { ItemAgrupado } from '@/lib/conta';

/**
 * Hierarquia da linha: o nome do produto é o que o cliente procura ao conferir
 * a conta, então ele carrega o peso. A quantidade fica discreta à esquerda e o
 * preço alinhado à direita, pra a coluna de valores ser lida de cima a baixo.
 */
export function ItemRow({ item }: { item: ItemAgrupado }) {
  const pago = item.status === 'paid';
  const reservado = item.status === 'reserved';

  return (
    <div className="flex w-full items-baseline justify-between gap-4 py-3.5">
      <div className="flex min-w-0 items-baseline gap-2.5">
        <span className="shrink-0 text-sm tabular-nums text-black/40">{item.quantity}x</span>
        <span
          className={`min-w-0 text-[15px] leading-snug ${
            pago ? 'text-black/35 line-through' : 'text-[#111827]'
          }`}
        >
          {item.name}
          {reservado && (
            <span className="ml-2 whitespace-nowrap rounded-full bg-[#851619]/8 px-2 py-0.5 text-xs text-[#851619]">
              reservado
            </span>
          )}
        </span>
      </div>

      <span
        className={`shrink-0 text-[15px] tabular-nums ${
          pago ? 'text-black/35 line-through' : 'text-[#111827]'
        }`}
      >
        {formatarReal(item.total)}
      </span>
    </div>
  );
}
