interface ContadorProps {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  min?: number;
}

export function Contador({ value, onIncrement, onDecrement, min = 1 }: ContadorProps) {
  return (
    <div className="flex h-[34px] w-[110px] items-center justify-between rounded-[60px] bg-[#851619] px-[10px] shadow-[0_2px_8px_rgba(133,22,25,0.25)]">
      <button
        type="button"
        onClick={onDecrement}
        disabled={value <= min}
        aria-label="Diminuir"
        className="flex size-6 items-center justify-center rounded-full bg-white text-sm font-medium text-[#851619] transition-transform active:scale-90 disabled:opacity-40 disabled:active:scale-100"
      >
        -
      </button>
      <span className="text-sm font-semibold text-white tabular-nums">{value}</span>
      <button
        type="button"
        onClick={onIncrement}
        aria-label="Aumentar"
        className="flex size-6 items-center justify-center rounded-full bg-white text-sm font-medium text-[#851619] transition-transform active:scale-90"
      >
        +
      </button>
    </div>
  );
}
