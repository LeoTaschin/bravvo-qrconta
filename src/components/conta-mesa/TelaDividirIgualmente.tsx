import { Sheet } from './Sheet';
import { BotaoPrimario } from './BotaoPrimario';
import { Contador } from './Contador';
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

export function TelaDividirIgualmente({
  faltaPagar,
  peoplePaying,
  peopleTotal,
  onChangePeoplePaying,
  onChangePeopleTotal,
  onClose,
  onConfirmar,
}: TelaDividirIgualmenteProps) {
  const proporcao = peopleTotal > 0 ? (peoplePaying / peopleTotal) * 100 : 0;
  const seuTotal = peopleTotal > 0 ? (faltaPagar / peopleTotal) * peoplePaying : 0;

  return (
    <Sheet title="Pagar sua conta" onClose={onClose}>
      <div className="flex flex-col gap-8">
        <div
          className="mx-auto flex size-[112px] items-center justify-center rounded-full shadow-[0_6px_20px_rgba(133,22,25,0.18)] transition-[background] duration-300"
          style={{
            background: `conic-gradient(#851619 0% ${proporcao}%, rgba(0,0,0,0.15) ${proporcao}% 100%)`,
          }}
        >
          <div className="flex size-[94px] items-center justify-center rounded-full bg-white px-2 text-center shadow-inner">
            <span className="text-base font-semibold leading-tight text-black tabular-nums">{formatarReal(faltaPagar)}</span>
          </div>
        </div>

        <div className="flex flex-col divide-y divide-black/[0.05] rounded-2xl bg-[#f9f9f9]">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-4">
            <span className="text-sm text-black/65">Pagando para</span>
            <Contador
              value={peoplePaying}
              min={1}
              onDecrement={() => onChangePeoplePaying(Math.max(1, peoplePaying - 1))}
              onIncrement={() => onChangePeoplePaying(Math.min(peopleTotal, peoplePaying + 1))}
            />
            <span className="text-right text-sm text-black/65">Pessoa(s)</span>
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-4">
            <span className="text-sm text-black/65">No total de</span>
            <Contador
              value={peopleTotal}
              min={peoplePaying}
              onDecrement={() => onChangePeopleTotal(Math.max(peoplePaying, peopleTotal - 1))}
              onIncrement={() => onChangePeopleTotal(peopleTotal + 1)}
            />
            <span className="text-right text-sm text-black/65">na mesa</span>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-[#f9f9f9] px-4 py-4">
          <span className="text-base text-black/60">Seu total é</span>
          <span className="text-xl font-semibold tracking-tight text-black tabular-nums">
            {formatarReal(seuTotal)}
          </span>
        </div>

        <BotaoPrimario onClick={onConfirmar} disabled={seuTotal <= 0}>
          Confirmar
        </BotaoPrimario>
      </div>
    </Sheet>
  );
}
