import { formatarReal } from '@/lib/format';
import { totalItem } from '@/lib/conta';
import type { SessionItem } from '@/lib/supabase/types';

interface ItemComandaAdminProps {
  item: SessionItem;
  onAlterarQuantidade: (quantidade: number) => void;
  onRemover: () => void;
}

export function ItemComandaAdmin({ item, onAlterarQuantidade, onRemover }: ItemComandaAdminProps) {
  const editavel = item.status === 'unpaid';
  const pago = item.status === 'paid';

  return (
    <div className="py-3">
      <div className="flex items-start justify-between gap-3">
        <span className={`truncate text-sm font-medium ${pago ? 'text-black/35 line-through' : 'text-[#111827]'}`}>
          {item.name}
        </span>
        <div className="shrink-0 text-right">
          {item.quantity > 1 && <p className="text-xs text-black/40">{formatarReal(item.unit_price)} cada</p>}
          <p className={`text-sm font-semibold ${pago ? 'text-black/35 line-through' : 'text-[#111827]'}`}>
            {formatarReal(totalItem(item))}
          </p>
        </div>
      </div>

      {editavel ? (
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => onAlterarQuantidade(item.quantity - 1)}
              aria-label="Diminuir quantidade"
              className="flex size-7 items-center justify-center rounded-full border border-black/[0.1] text-sm text-black/60 transition-colors hover:border-black/20 hover:bg-black/[0.03] active:scale-95"
            >
              −
            </button>
            <span className="w-4 text-center text-sm font-medium text-[#111827] tabular-nums">{item.quantity}</span>
            <button
              type="button"
              onClick={() => onAlterarQuantidade(item.quantity + 1)}
              aria-label="Aumentar quantidade"
              className="flex size-7 items-center justify-center rounded-full border border-black/[0.1] text-sm text-black/60 transition-colors hover:border-black/20 hover:bg-black/[0.03] active:scale-95"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={onRemover}
            aria-label={`Remover ${item.name}`}
            className="px-1.5 text-black/30 transition-colors hover:text-[#851619]"
          >
            ×
          </button>
        </div>
      ) : (
        <p className="mt-1 text-xs font-medium text-[#851619]/70">{item.status === 'reserved' ? 'reservado' : 'pago'}</p>
      )}
    </div>
  );
}
