import { formatarReal } from '@/lib/format';
import { formatarTempoDecorrido } from '@/lib/tempo';

export interface InfoMesaAberta {
  valor: number;
  quantidadeItens: number;
  abertaEm: string;
}

interface CartaoMesaProps {
  numero: number;
  cadastrada: boolean;
  ocupada: boolean;
  info?: InfoMesaAberta;
  agora: number;
  onSelect: () => void;
}

function formatarNumero(numero: number): string {
  return String(numero).padStart(2, '0');
}

export function CartaoMesa({ numero, cadastrada, ocupada, info, agora, onSelect }: CartaoMesaProps) {
  if (!cadastrada) {
    return (
      <div className="flex min-h-[144px] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-black/10 text-black/25">
        <span className="text-2xl font-medium">{numero}</span>
        <span className="text-[11px]">não cadastrada</span>
      </div>
    );
  }

  if (ocupada && info) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className="flex min-h-[144px] cursor-pointer flex-col rounded-xl border border-[#851619]/20 bg-white p-4 text-left shadow-[0_2px_10px_rgba(133,22,25,0.06)] transition-all hover:-translate-y-0.5 hover:border-[#851619]/35 hover:shadow-[0_10px_24px_rgba(133,22,25,0.12)]"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-[#111827]">Mesa {formatarNumero(numero)}</span>
          <span className="flex items-center gap-1.5 text-xs font-medium text-[#851619]">
            <span className="size-1.5 rounded-full bg-[#851619]" />
            Ocupada
          </span>
        </div>

        <p className="mt-3.5 text-xl font-semibold leading-none text-[#111827]">{formatarReal(info.valor)}</p>
        <p className="mt-1.5 text-xs text-black/45">
          {info.quantidadeItens} {info.quantidadeItens === 1 ? 'item' : 'itens'}
        </p>

        <p className="mt-auto pt-3 text-[11px] text-black/35">Aberta há {formatarTempoDecorrido(info.abertaEm, agora)}</p>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex min-h-[144px] cursor-pointer flex-col rounded-xl border border-black/[0.06] bg-white p-4 text-left transition-colors hover:border-black/[0.1] hover:bg-black/[0.01]"
    >
      <span className="text-sm font-medium text-black/45">Mesa {formatarNumero(numero)}</span>
      <span className="mt-auto flex items-center gap-1.5 text-xs text-black/35">
        <span className="size-1.5 rounded-full bg-black/20" />
        Livre
      </span>
    </button>
  );
}
