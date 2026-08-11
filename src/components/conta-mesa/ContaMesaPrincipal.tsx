import { Header } from './Header';
import { ItemRow } from './ItemRow';
import { BotaoPrimario } from './BotaoPrimario';
import { calcularFaltaPagar, totalSessao } from '@/lib/conta';
import type { PixCharge, SessionItem } from '@/lib/supabase/types';

interface ContaMesaPrincipalProps {
  numeroMesa: number;
  itens: SessionItem[];
  cobrancas: PixCharge[];
  onPagarOuDividir: () => void;
}

export function ContaMesaPrincipal({ numeroMesa, itens, cobrancas, onPagarOuDividir }: ContaMesaPrincipalProps) {
  const faltaPagar = calcularFaltaPagar(itens, cobrancas);
  const total = totalSessao(itens);
  const contaQuitada = faltaPagar <= 0;

  return (
    <div className="mx-auto flex min-h-screen max-w-[430px] flex-col bg-[#f3f3f3]">
      <div className="rounded-b-2xl bg-white pb-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
        <Header numeroMesa={numeroMesa} faltaPagar={faltaPagar} totalSessao={total} />
        <div className="mt-5 flex flex-col divide-y divide-black/[0.04] px-6">
          {itens.length === 0 ? (
            <p className="py-4 text-center text-sm text-black/50">
              Nenhum item lançado na sua mesa ainda.
            </p>
          ) : (
            itens.map((item, index) => (
              <div
                key={item.id}
                className="animate-item-fade-in py-3 first:pt-0 last:pb-0"
                style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
              >
                <ItemRow item={item} />
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex-1" />

      <div className="rounded-t-2xl bg-white p-4 pb-6 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        {contaQuitada ? (
          <p className="rounded-[16px] bg-emerald-50 py-3 text-center text-base font-medium text-emerald-700">
            Conta quitada — obrigado! 🎉
          </p>
        ) : (
          <BotaoPrimario onClick={onPagarOuDividir}>Pagar ou dividir conta</BotaoPrimario>
        )}
      </div>
    </div>
  );
}
