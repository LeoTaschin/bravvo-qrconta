import Image from 'next/image';
import { Sheet } from './Sheet';
import { formatarReal } from '@/lib/format';

interface ModalPagarContaProps {
  faltaPagar: number;
  onClose: () => void;
  onPagarContaCheia: () => void;
  onDividirIgualmente: () => void;
  onSelecionarItens: () => void;
}

interface OpcaoProps {
  titulo: string;
  descricao?: string;
  valor?: number;
  onClick: () => void;
}

function Opcao({ titulo, descricao, valor, onClick }: OpcaoProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 py-4 text-left transition-colors active:bg-black/[0.03]"
    >
      <div className="min-w-0 flex-1">
        <p className="text-base font-medium text-[#111827]">{titulo}</p>
        {descricao && <p className="mt-0.5 text-sm leading-snug text-black/45">{descricao}</p>}
      </div>
      {valor !== undefined && (
        <span className="shrink-0 text-base font-semibold text-[#111827] tabular-nums">
          {formatarReal(valor)}
        </span>
      )}
      <Image
        src="/assets/icon-back.svg"
        alt=""
        aria-hidden
        width={7}
        height={12}
        className="shrink-0 rotate-180 opacity-25"
      />
    </button>
  );
}

/**
 * As três formas de pagar num sheet só. Antes eram dois sheets encadeados com
 * o mesmo título, então tocar em "Dividir conta" parecia não fazer nada — a
 * tela só trocava os rótulos dos botões.
 *
 * As opções são linhas neutras, não botões na cor da marca: são três escolhas
 * de mesmo peso, e destacar uma delas sugeriria que existe uma resposta certa.
 * O vermelho fica reservado pra confirmação do pagamento, mais adiante.
 */
export function ModalPagarConta({
  faltaPagar,
  onClose,
  onPagarContaCheia,
  onDividirIgualmente,
  onSelecionarItens,
}: ModalPagarContaProps) {
  return (
    <Sheet title="Como você quer pagar?" onClose={onClose}>
      <div className="flex flex-col divide-y divide-black/[0.06]">
        <Opcao titulo="Pagar tudo" valor={faltaPagar} onClick={onPagarContaCheia} />
        <Opcao
          titulo="Dividir igualmente"
          descricao="Divida em partes iguais entre a mesa"
          onClick={onDividirIgualmente}
        />
        <Opcao
          titulo="Escolher meus itens"
          descricao="Pague só o que você consumiu"
          onClick={onSelecionarItens}
        />
      </div>
    </Sheet>
  );
}
