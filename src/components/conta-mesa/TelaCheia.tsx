import Image from 'next/image';
import { ProgressoPagamento } from './ProgressoPagamento';

interface TelaCheiaProps {
  title: string;
  onBack: () => void;
  /**
   * Progresso da conta da mesa, na borda de baixo do header. Sair da tela
   * principal pra escolher itens tirava do cliente as duas únicas referências
   * que ele tinha — o tamanho da conta e o quanto já foi quitado —, e o rodapé
   * daqui só fala da seleção dele.
   */
  progresso?: { total: number; faltaPagar: number };
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function TelaCheia({ title, onBack, progresso, children, footer }: TelaCheiaProps) {
  return (
    <div className="animate-sheet-slide-up absolute inset-0 z-30 flex flex-col bg-[#f3f3f3]">
      <div className="relative z-10 flex flex-col bg-white px-6 pb-4 pt-7 shadow-[0_12px_20px_-12px_rgba(0,0,0,0.1)]">
        <button
          type="button"
          onClick={onBack}
          aria-label="Voltar"
          className="absolute left-6 top-[26px] flex size-9 items-center justify-center transition-opacity active:opacity-50"
        >
          <Image src="/assets/icon-back.svg" alt="" width={14} height={25} />
        </button>
        <p className="text-center text-xl font-medium text-[#111827]">{title}</p>
        {progresso && (
          <div className="mt-4">
            <ProgressoPagamento total={progresso.total} faltaPagar={progresso.faltaPagar} />
          </div>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">{children}</div>
      {footer && (
        <div className="shrink-0 rounded-t-2xl bg-white p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
          {footer}
        </div>
      )}
    </div>
  );
}
