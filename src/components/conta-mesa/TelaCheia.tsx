import Image from 'next/image';

interface TelaCheiaProps {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function TelaCheia({ title, onBack, children, footer }: TelaCheiaProps) {
  return (
    <div className="animate-sheet-slide-up fixed inset-0 z-30 mx-auto flex max-w-[430px] flex-col bg-[#f3f3f3]">
      <div className="relative z-10 flex flex-col items-center bg-white px-6 pb-5 pt-8 shadow-[0_12px_20px_-12px_rgba(0,0,0,0.1)]">
        <button
          type="button"
          onClick={onBack}
          aria-label="Voltar"
          className="absolute left-6 top-[30px] flex size-9 items-center justify-center transition-opacity active:opacity-50"
        >
          <Image src="/assets/icon-back.svg" alt="" width={14} height={25} />
        </button>
        <p className="text-xl font-medium text-[#111827]">{title}</p>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
      {footer && (
        <div className="rounded-t-2xl bg-white p-4 pb-6 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">{footer}</div>
      )}
    </div>
  );
}
