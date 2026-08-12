interface ContadorProps {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  min?: number;
  max?: number;
}

/**
 * Neutro de propósito: o vermelho da marca fica reservado pro botão que
 * confirma o pagamento. Um contador sólido na cor da marca puxava mais
 * atenção que o próprio CTA da tela.
 */
export function Contador({ value, onIncrement, onDecrement, min = 1, max }: ContadorProps) {
  return (
    <div className="flex h-[38px] w-[116px] items-center justify-between rounded-full border-[0.5px] border-black/15 bg-white px-1.5">
      <button
        type="button"
        onClick={onDecrement}
        disabled={value <= min}
        aria-label="Diminuir"
        className="flex size-7 items-center justify-center rounded-full bg-black/[0.05] text-base font-medium text-[#111827] transition-transform active:scale-90 disabled:opacity-30 disabled:active:scale-100"
      >
        −
      </button>
      <span className="text-sm font-semibold text-[#111827] tabular-nums">{value}</span>
      <button
        type="button"
        onClick={onIncrement}
        disabled={max !== undefined && value >= max}
        aria-label="Aumentar"
        className="flex size-7 items-center justify-center rounded-full bg-black/[0.05] text-base font-medium text-[#111827] transition-transform active:scale-90 disabled:opacity-30 disabled:active:scale-100"
      >
        +
      </button>
    </div>
  );
}
