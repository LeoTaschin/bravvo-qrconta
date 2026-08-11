import Image from 'next/image';
import { BotaoPrimario } from './BotaoPrimario';
import { formatarReal } from '@/lib/format';

interface TelaPagamentoProps {
  total: number;
  gerando: boolean;
  erro: string | null;
  onBack: () => void;
  onConfirmar: () => void;
}

export function TelaPagamento({ total, gerando, erro, onBack, onConfirmar }: TelaPagamentoProps) {
  return (
    <div className="animate-sheet-slide-up absolute inset-0 z-30 flex flex-col bg-[#f3f3f3]">
      <div className="rounded-b-2xl bg-white pb-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
        <div className="relative flex flex-col items-center px-6 pb-5 pt-8">
          <button
            type="button"
            onClick={onBack}
            aria-label="Voltar"
            className="absolute left-6 top-[30px] transition-opacity active:opacity-50"
          >
            <Image src="/assets/icon-back.svg" alt="" width={14} height={25} />
          </button>
          <p className="text-xl font-medium text-[#111827]">Pagamento</p>
        </div>

        <div className="px-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-black">Total</span>
            <span className="font-medium text-black tabular-nums">{formatarReal(total)}</span>
          </div>

          <div className="mt-4 flex flex-col gap-2.5 border-t border-black/[0.04] pt-4">
            <div className="flex h-[54px] items-center justify-between rounded-[10px] border-[0.5px] border-black/20 px-[10px]">
              <div className="flex items-center gap-2.5">
                <Image src="/assets/icon-radio-unselected.svg" alt="" width={25} height={25} />
                <span className="text-sm font-medium text-black">Apple Pay</span>
              </div>
              <Image src="/assets/icon-apple-pay-badge.png" alt="Apple Pay" width={31} height={20} />
            </div>

            <div className="flex h-[54px] items-center justify-between rounded-[10px] border-[0.5px] border-black/20 px-[10px]">
              <div className="flex items-center gap-2.5">
                <Image src="/assets/icon-radio-unselected.svg" alt="" width={25} height={25} />
                <span className="text-sm font-medium text-black">Cartão de crédito</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-[26px] items-center justify-center overflow-hidden rounded-[3px] border-[0.5px] border-black/20 px-[5px]">
                  <Image src="/assets/icon-visa.svg" alt="Visa" width={30} height={30} />
                </div>
                <div className="flex h-[26px] items-center justify-center overflow-hidden rounded-[3px] border-[0.5px] border-black/20 px-[5px]">
                  <Image src="/assets/icon-mastercard.svg" alt="Mastercard" width={30} height={30} />
                </div>
              </div>
            </div>

            <div className="flex h-[54px] items-center justify-between rounded-[10px] border-[0.5px] border-black/20 px-[10px]">
              <div className="flex items-center gap-2.5">
                <div className="relative flex size-[25px] items-center justify-center">
                  <Image src="/assets/icon-radio-selected.svg" alt="" width={25} height={25} className="absolute inset-0" />
                  <Image src="/assets/icon-checkmark.svg" alt="" width={14} height={10} className="relative" />
                </div>
                <span className="text-sm font-medium text-black">PIX</span>
              </div>
              <Image src="/assets/icon-pix.svg" alt="Pix" width={30} height={30} />
            </div>
          </div>

          {erro && (
            <p className="mt-4 rounded-xl bg-[#851619]/5 px-3 py-2.5 text-sm text-[#851619]">{erro}</p>
          )}
        </div>
      </div>

      <div className="flex-1" />

      <div className="rounded-t-2xl bg-white p-4 pb-6 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        <BotaoPrimario onClick={onConfirmar} disabled={gerando}>
          {gerando ? 'Gerando cobrança...' : 'Confirmar'}
        </BotaoPrimario>
      </div>
    </div>
  );
}
