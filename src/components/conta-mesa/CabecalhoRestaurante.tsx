import Image from 'next/image';

interface CabecalhoRestauranteProps {
  nomeRestaurante: string;
  numeroMesa: number;
}

/**
 * Primeira pergunta que o cliente faz ao abrir o QR Code: "estou na mesa
 * certa?". É uma confirmação rápida, não o assunto da tela — por isso ocupa
 * uma faixa compacta, deixando o espaço para a conta em si.
 */
export function CabecalhoRestaurante({ nomeRestaurante, numeroMesa }: CabecalhoRestauranteProps) {
  return (
    <div className="flex items-center gap-2.5">
      <Image
        src="/assets/logo-bravvo.png"
        alt=""
        aria-hidden
        width={40}
        height={40}
        className="size-10 shrink-0 rounded-full object-cover"
      />
      <div className="min-w-0">
        <p className="truncate text-[15px] font-semibold leading-tight text-[#111827]">
          {nomeRestaurante}
        </p>
        <p className="mt-0.5 text-xs leading-tight text-black/45">Mesa {numeroMesa}</p>
      </div>
    </div>
  );
}
