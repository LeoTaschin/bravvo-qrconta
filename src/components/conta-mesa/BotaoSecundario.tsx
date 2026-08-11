interface BotaoSecundarioProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
}

export function BotaoSecundario({ children, onClick, disabled, type = 'button' }: BotaoSecundarioProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="h-[54px] w-full shrink-0 rounded-[20px] border-[1.5px] border-[#851619] bg-white text-base font-medium text-[#851619] transition-all duration-150 hover:bg-[#851619]/5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
    >
      {children}
    </button>
  );
}
