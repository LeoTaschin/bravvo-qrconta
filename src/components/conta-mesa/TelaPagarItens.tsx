import { Sheet } from './Sheet';
import { BotaoPrimario } from './BotaoPrimario';
import { formatarReal } from '@/lib/format';
import { totalItem } from '@/lib/conta';
import type { SessionItem } from '@/lib/supabase/types';

interface TelaPagarItensProps {
  itens: SessionItem[];
  selecionados: Set<string>;
  onToggle: (itemId: string) => void;
  onClose: () => void;
  onConfirmar: () => void;
}

export function TelaPagarItens({ itens, selecionados, onToggle, onClose, onConfirmar }: TelaPagarItensProps) {
  const total = itens
    .filter((item) => selecionados.has(item.id))
    .reduce((acc, item) => acc + totalItem(item), 0);

  return (
    <Sheet title="Pagar seus itens" onClose={onClose}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          {itens.length === 0 && (
            <p className="py-4 text-center text-sm text-black/50">
              Nenhum item disponível para seleção no momento.
            </p>
          )}
          {itens.map((item) => {
            const selecionado = selecionados.has(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onToggle(item.id)}
                className={`flex h-[54px] w-full items-center justify-between rounded-[14px] border-[1.5px] px-4 text-left transition-all duration-150 active:scale-[0.99] ${
                  selecionado
                    ? 'border-[#851619] bg-[#851619]/5 shadow-[0_2px_10px_rgba(133,22,25,0.12)]'
                    : 'border-black/10 hover:border-black/20'
                }`}
              >
                <span className="text-base font-medium text-black">{item.name}</span>
                <div className="flex items-center gap-[10px]">
                  <span className="w-[60px] text-sm text-black/50">{formatarReal(totalItem(item))}</span>
                  <span
                    className={`flex size-[32px] items-center justify-center rounded-full text-sm font-medium transition-colors ${
                      selecionado
                        ? 'bg-[#851619] text-white'
                        : 'border-[1.5px] border-black/15 text-black/40'
                    }`}
                  >
                    {selecionado ? '✓' : '+'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-[#f9f9f9] px-4 py-4">
          <span className="text-base text-black/60">Seu total é</span>
          <span className="text-xl font-semibold tracking-tight text-black tabular-nums">
            {formatarReal(total)}
          </span>
        </div>

        <BotaoPrimario onClick={onConfirmar} disabled={selecionados.size === 0}>
          Confirmar
        </BotaoPrimario>
      </div>
    </Sheet>
  );
}
