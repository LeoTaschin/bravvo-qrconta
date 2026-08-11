import { Sheet } from './Sheet';
import { BotaoPrimario } from './BotaoPrimario';
import { BotaoSecundario } from './BotaoSecundario';

interface ModalDividirContaProps {
  onClose: () => void;
  onSelecionarItens: () => void;
  onDividirIgualmente: () => void;
}

export function ModalDividirConta({ onClose, onSelecionarItens, onDividirIgualmente }: ModalDividirContaProps) {
  return (
    <Sheet title="Pagar sua conta" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <BotaoPrimario onClick={onSelecionarItens}>Selecionar itens</BotaoPrimario>
        <BotaoSecundario onClick={onDividirIgualmente}>Dividir igualmente</BotaoSecundario>
      </div>
    </Sheet>
  );
}
