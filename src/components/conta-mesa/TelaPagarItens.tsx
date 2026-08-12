import Image from 'next/image';
import { TelaCheia } from './TelaCheia';
import { BotaoPrimario } from './BotaoPrimario';
import { Contador } from './Contador';
import { formatarReal } from '@/lib/format';
import { totalItem, totalSessao } from '@/lib/conta';
import type { SessionItem } from '@/lib/supabase/types';

interface TelaPagarItensProps {
  /** Todos os itens da sessão: os reservados aparecem aqui como indisponíveis. */
  itens: SessionItem[];
  faltaPagar: number;
  /** id da linha da comanda -> quantas unidades dela o cliente escolheu. */
  selecionados: Map<string, number>;
  onDefinirQuantidade: (itemId: string, quantidade: number) => void;
  onSelecionarTodos: () => void;
  onLimparSelecao: () => void;
  onVoltar: () => void;
  onConfirmar: () => void;
}

/**
 * Tela cheia, e não sheet: das três formas de pagar, essa é a única em que o
 * cliente precisa ler a comanda inteira pra decidir. Num sheet de 85% sobravam
 * ~5 linhas de uma comanda que passa fácil de 15 — o cliente rolava uma janelinha
 * procurando o que comeu. "Pagar tudo" e "dividir igualmente" continuam em sheet
 * porque são uma decisão só, sem nada pra procurar.
 *
 * Linha de uma unidade tem marcação simples; linha com várias ("2x Rotolina")
 * tem contador, porque quem dividiu a mesa quer pagar só a sua. O rodapé conta
 * unidades, não linhas: quem marcou uma pizza e duas cocas escolheu 3 itens, e
 * é assim que ele conta de cabeça.
 */
export function TelaPagarItens({
  itens,
  faltaPagar,
  selecionados,
  onDefinirQuantidade,
  onSelecionarTodos,
  onLimparSelecao,
  onVoltar,
  onConfirmar,
}: TelaPagarItensProps) {
  const selecionaveis = itens.filter((item) => item.status === 'unpaid');
  const reservados = itens.filter((item) => item.status === 'reserved');

  const unidades = selecionaveis.reduce((acc, item) => acc + (selecionados.get(item.id) ?? 0), 0);
  const total = selecionaveis.reduce(
    (acc, item) => acc + item.unit_price * (selecionados.get(item.id) ?? 0),
    0
  );
  const tudoSelecionado =
    selecionaveis.length > 0 &&
    selecionaveis.every((item) => (selecionados.get(item.id) ?? 0) === item.quantity);

  return (
    <TelaCheia
      title="Escolha seus itens"
      onBack={onVoltar}
      progresso={{ total: totalSessao(itens), faltaPagar }}
      footer={
        <>
          <div className="mb-3.5 flex items-baseline justify-between gap-3">
            <span className="text-sm text-black/50">
              {unidades === 0
                ? 'Nenhum item selecionado'
                : `${unidades} ${unidades === 1 ? 'item selecionado' : 'itens selecionados'}`}
            </span>
            <span className="text-xl font-semibold tracking-tight text-[#111827] tabular-nums">
              {formatarReal(total)}
            </span>
          </div>
          <BotaoPrimario onClick={onConfirmar} disabled={unidades === 0}>
            Confirmar seleção
          </BotaoPrimario>
          {total > 0 && (
            <p className="mt-2.5 text-center text-xs text-black/40 tabular-nums">
              Você selecionou {formatarReal(total)} de {formatarReal(faltaPagar)} da conta
            </p>
          )}
        </>
      }
    >
      {selecionaveis.length === 0 && reservados.length === 0 ? (
        <p className="py-6 text-center text-sm text-black/40">
          Nenhum item disponível para seleção no momento.
        </p>
      ) : (
        <>
          {/* A ação fica numa linha só dela: ao lado do texto de apoio ela
              espremia a frase em duas linhas num aparelho de 375px. */}
          <p className="text-sm font-medium text-[#111827]">Selecione o que você consumiu</p>
          <p className="mt-0.5 text-sm text-black/45">Você só pagará pelos itens escolhidos.</p>

          {selecionaveis.length > 0 && (
            <div className="mb-2 mt-4 flex justify-end">
              <button
                type="button"
                onClick={tudoSelecionado ? onLimparSelecao : onSelecionarTodos}
                className="text-sm font-medium text-[#851619] transition-opacity active:opacity-50"
              >
                {tudoSelecionado ? 'Limpar seleção' : 'Selecionar tudo'}
              </button>
            </div>
          )}

          {selecionaveis.length > 0 && (
            <div className="flex flex-col divide-y divide-black/[0.05] overflow-hidden rounded-2xl bg-white">
              {selecionaveis.map((item) => {
                const escolhidas = selecionados.get(item.id) ?? 0;
                const selecionado = escolhidas > 0;

                const descricao = (
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] leading-snug text-[#111827]">
                      {item.quantity > 1 && (
                        <span className="text-black/40 tabular-nums">{item.quantity}x </span>
                      )}
                      {item.name}
                    </span>
                    {item.quantity > 1 && (
                      <span className="mt-0.5 block text-xs text-black/40 tabular-nums">
                        {formatarReal(item.unit_price)} cada
                      </span>
                    )}
                  </span>
                );

                // Uma unidade só: marcar a linha inteira é mais rápido que
                // mexer num contador que nunca sai de 1.
                if (item.quantity === 1) {
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onDefinirQuantidade(item.id, selecionado ? 0 : 1)}
                      aria-pressed={selecionado}
                      className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                        selecionado ? 'bg-[#851619]/[0.06]' : 'active:bg-black/[0.03]'
                      }`}
                    >
                      <span
                        className={`flex size-[22px] shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors ${
                          selecionado ? 'border-[#851619] bg-[#851619]' : 'border-black/15 bg-white'
                        }`}
                      >
                        {selecionado && (
                          <Image src="/assets/icon-checkmark.svg" alt="" width={11} height={8} />
                        )}
                      </span>
                      {descricao}
                      <span className="shrink-0 text-sm text-black/45 tabular-nums">
                        {formatarReal(totalItem(item))}
                      </span>
                    </button>
                  );
                }

                return (
                  <div
                    key={item.id}
                    className={`flex w-full items-center gap-3 px-4 py-3 transition-colors ${
                      selecionado ? 'bg-[#851619]/[0.06]' : ''
                    }`}
                  >
                    {descricao}
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Contador
                        value={escolhidas}
                        min={0}
                        max={item.quantity}
                        onDecrement={() => onDefinirQuantidade(item.id, escolhidas - 1)}
                        onIncrement={() => onDefinirQuantidade(item.id, escolhidas + 1)}
                      />
                      {/* Fica montado quando zerado pra a linha não mudar de
                          altura na primeira toque do contador. */}
                      <span
                        className={`text-xs text-black/45 tabular-nums ${
                          selecionado ? '' : 'invisible'
                        }`}
                      >
                        {formatarReal(item.unit_price * escolhidas)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {reservados.length > 0 && (
            <>
              <p className="mb-2 mt-6 text-sm text-black/45">
                Já escolhidos por outras pessoas da mesa
              </p>
              <div className="flex flex-col divide-y divide-black/[0.05] overflow-hidden rounded-2xl bg-white">
                {reservados.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3.5 opacity-45">
                    <span className="size-[22px] shrink-0 rounded-full border-[1.5px] border-black/10 bg-black/[0.03]" />
                    <span className="min-w-0 flex-1 text-[15px] leading-snug text-[#111827]">
                      {item.quantity > 1 && (
                        <span className="text-black/40 tabular-nums">{item.quantity}x </span>
                      )}
                      {item.name}
                    </span>
                    <span className="shrink-0 text-sm text-black/45 tabular-nums">
                      {formatarReal(totalItem(item))}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </TelaCheia>
  );
}
