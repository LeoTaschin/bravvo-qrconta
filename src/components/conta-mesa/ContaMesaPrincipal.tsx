import { CabecalhoRestaurante } from './CabecalhoRestaurante';
import { ProgressoPagamento } from './ProgressoPagamento';
import { ItemRow } from './ItemRow';
import { BotaoPrimario } from './BotaoPrimario';
import { agruparItens, calcularFaltaPagar, totalSessao } from '@/lib/conta';
import { formatarReal } from '@/lib/format';
import type { PixCharge, SessionItem } from '@/lib/supabase/types';

interface ContaMesaPrincipalProps {
  nomeRestaurante: string;
  numeroMesa: number;
  itens: SessionItem[];
  cobrancas: PixCharge[];
  onPagarOuDividir: () => void;
}

/**
 * Tela que o cliente vê antes de pagar. A ordem das seções segue a ordem das
 * perguntas que ele faz: onde estou → quanto é a conta → já pagaram algo → o
 * que foi consumido → quanto falta → quero pagar.
 *
 * O total aparece uma vez só, no topo. O rodapé fixo carrega o único número
 * acionável — o que ainda falta pagar — grudado no botão que age sobre ele.
 */
export function ContaMesaPrincipal({
  nomeRestaurante,
  numeroMesa,
  itens,
  cobrancas,
  onPagarOuDividir,
}: ContaMesaPrincipalProps) {
  const total = totalSessao(itens);
  const faltaPagar = calcularFaltaPagar(itens, cobrancas);
  const contaQuitada = total > 0 && faltaPagar <= 0;
  const itensAgrupados = agruparItens(itens);

  return (
    <div className="absolute inset-0 flex flex-col bg-[#f3f3f3]">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3 p-4 pb-6">
          <section className="rounded-2xl bg-white px-5 py-4">
            <CabecalhoRestaurante nomeRestaurante={nomeRestaurante} numeroMesa={numeroMesa} />
            <div className="mt-4">
              <ProgressoPagamento total={total} faltaPagar={faltaPagar} />
            </div>
          </section>

          <section className="rounded-2xl bg-white px-5 py-5">
            <h2 className="text-sm font-medium text-black/45">Itens da conta</h2>
            {itensAgrupados.length === 0 ? (
              <p className="py-6 text-center text-sm text-black/40">
                Nenhum item lançado na sua mesa ainda.
              </p>
            ) : (
              <div className="mt-1 divide-y divide-black/[0.05]">
                {itensAgrupados.map((item, index) => (
                  <div
                    key={item.key}
                    className="animate-item-fade-in"
                    style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
                  >
                    <ItemRow item={item} />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <div className="shrink-0 border-t border-black/[0.06] bg-white px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
        {contaQuitada ? (
          <p className="rounded-2xl bg-emerald-50 py-3.5 text-center text-base font-medium text-emerald-700">
            Conta quitada — obrigado!
          </p>
        ) : (
          <>
            <div className="mb-3.5 flex items-baseline justify-between">
              <span className="text-sm text-black/50">Falta pagar</span>
              <span className="text-xl font-semibold tracking-tight text-[#111827] tabular-nums">
                {formatarReal(faltaPagar)}
              </span>
            </div>
            <BotaoPrimario onClick={onPagarOuDividir} disabled={total <= 0}>
              Pagar ou dividir conta
            </BotaoPrimario>
            <p className="mx-auto mt-3 max-w-[290px] text-center text-xs leading-relaxed text-black/40">
              Você poderá escolher quanto deseja pagar na próxima etapa.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
