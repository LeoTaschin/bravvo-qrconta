import { Sheet } from './Sheet';
import { BotaoPrimario } from './BotaoPrimario';
import { Contador } from './Contador';
import { calcularDivisaoIgual } from '@/lib/conta';
import { formatarReal } from '@/lib/format';

interface TelaDividirIgualmenteProps {
  faltaPagar: number;
  peoplePaying: number;
  peopleTotal: number;
  onChangePeoplePaying: (value: number) => void;
  onChangePeopleTotal: (value: number) => void;
  onClose: () => void;
  onConfirmar: () => void;
}

/** Raio da linha do anel: 132px de caixa menos os 8px de traço. */
const RAIO_ANEL = 62;
const CIRCUNFERENCIA_ANEL = 2 * Math.PI * RAIO_ANEL;

/**
 * O cliente vem pra cá com uma pergunta só: "quanto eu pago?". Por isso o
 * valor dele ocupa o centro, e o total da conta vira legenda.
 *
 * Os campos seguem a ordem do raciocínio: primeiro quantas pessoas dividem,
 * depois quantas partes você cobre — o inverso travava o segundo contador num
 * limite mudo, já que ele não pode passar do total da mesa.
 *
 * O valor da parte some quando o cliente cobre a mesa inteira: aí ele já está
 * pagando tudo, e a legenda só repetiria o número do círculo com os centavos
 * do resto de diferença. Some com `invisible`, não desmontando: tirar a linha
 * do fluxo encolhia o sheet e fazia a tela pular no último toque do contador.
 */
export function TelaDividirIgualmente({
  faltaPagar,
  peoplePaying,
  peopleTotal,
  onChangePeoplePaying,
  onChangePeopleTotal,
  onClose,
  onConfirmar,
}: TelaDividirIgualmenteProps) {
  const { valorParte, seuTotal } = calcularDivisaoIgual(faltaPagar, peoplePaying, peopleTotal);
  const proporcao = peopleTotal > 0 ? (peoplePaying / peopleTotal) * 100 : 0;

  return (
    <Sheet title="Dividir igualmente" onClose={onClose}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-black/45">Você paga</p>
          <div className="relative flex size-[132px] items-center justify-center">
            <svg viewBox="0 0 132 132" className="absolute inset-0 -rotate-90">
              <circle
                cx="66"
                cy="66"
                r={RAIO_ANEL}
                fill="none"
                stroke="rgba(0,0,0,0.10)"
                strokeWidth="8"
              />
              <circle
                cx="66"
                cy="66"
                r={RAIO_ANEL}
                fill="none"
                stroke="#851619"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={CIRCUNFERENCIA_ANEL}
                strokeDashoffset={CIRCUNFERENCIA_ANEL * (1 - proporcao / 100)}
                className="transition-[stroke-dashoffset] duration-300"
              />
            </svg>
            <span className="relative px-6 text-center text-xl font-semibold leading-tight tracking-tight text-[#111827] tabular-nums">
              {formatarReal(seuTotal)}
            </span>
          </div>
          <p className="text-xs text-black/40 tabular-nums">de {formatarReal(faltaPagar)}</p>
        </div>

        <div className="flex flex-col divide-y divide-black/[0.05] rounded-2xl bg-[#f9f9f9]">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-black/65">Pessoas na mesa</span>
            <Contador
              value={peopleTotal}
              min={peoplePaying}
              onDecrement={() => onChangePeopleTotal(Math.max(peoplePaying, peopleTotal - 1))}
              onIncrement={() => onChangePeopleTotal(peopleTotal + 1)}
            />
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-black/65">Partes que você paga</span>
            <Contador
              value={peoplePaying}
              min={1}
              onDecrement={() => onChangePeoplePaying(Math.max(1, peoplePaying - 1))}
              onIncrement={() => onChangePeoplePaying(Math.min(peopleTotal, peoplePaying + 1))}
            />
          </div>
        </div>

        <p
          className={`text-center text-sm text-black/45 ${
            peoplePaying < peopleTotal ? '' : 'invisible'
          }`}
        >
          Cada parte fica em{' '}
          <span className="font-medium text-[#111827] tabular-nums">
            {formatarReal(valorParte)}
          </span>
        </p>

        <BotaoPrimario onClick={onConfirmar} disabled={seuTotal <= 0}>
          Confirmar
        </BotaoPrimario>
      </div>
    </Sheet>
  );
}
