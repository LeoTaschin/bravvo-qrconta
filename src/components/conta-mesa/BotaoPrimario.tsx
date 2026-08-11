interface BotaoPrimarioProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
}

export function BotaoPrimario({ children, onClick, disabled, type = 'button' }: BotaoPrimarioProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="h-[54px] w-full shrink-0 rounded-[20px] bg-[#851619] text-base font-medium text-white shadow-[0_6px_16px_rgba(133,22,25,0.3)] transition-all duration-150 hover:brightness-110 active:scale-[0.98] active:shadow-[0_2px_8px_rgba(133,22,25,0.25)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:active:scale-100"
    >
      {children}
    </button>
  );
}
