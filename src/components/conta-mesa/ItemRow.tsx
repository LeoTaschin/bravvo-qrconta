import { formatarReal } from '@/lib/format';
import { totalItem } from '@/lib/conta';
import type { SessionItem } from '@/lib/supabase/types';

export function ItemRow({ item }: { item: SessionItem }) {
  const pago = item.status === 'paid';
  const reservado = item.status === 'reserved';

  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#f3f3f3]">
          <span className="text-sm font-semibold text-[#595959]">{item.quantity}</span>
        </div>
        <span
          className={`truncate text-base font-medium ${pago ? 'text-[#9ca3af] line-through' : 'text-[#111827]'}`}
        >
          {item.name}
        </span>
        {reservado && (
          <span className="shrink-0 rounded-full bg-[#851619]/8 px-2 py-0.5 text-xs font-medium text-[#851619]">
            reservado
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-5 text-base">
        {item.quantity > 1 && <span className="text-black/45">{formatarReal(item.unit_price)}</span>}
        <span className={`font-semibold ${pago ? 'text-[#9ca3af] line-through' : 'text-[#111827]'}`}>
          {formatarReal(totalItem(item))}
        </span>
      </div>
    </div>
  );
}
