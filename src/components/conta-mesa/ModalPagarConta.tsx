import { Sheet } from './Sheet';
import { BotaoPrimario } from './BotaoPrimario';
import { BotaoSecundario } from './BotaoSecundario';

interface ModalPagarContaProps {
  onClose: () => void;
  onDividirConta: () => void;
  onPagarContaCheia: () => void;
}

export function ModalPagarConta({ onClose, onDividirConta, onPagarContaCheia }: ModalPagarContaProps) {
  return (
    <Sheet title="Pagar sua conta" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <BotaoPrimario onClick={onPagarContaCheia}>Pagar conta cheia</BotaoPrimario>
        <BotaoSecundario onClick={onDividirConta}>Dividir conta</BotaoSecundario>
      </div>
    </Sheet>
  );
}
