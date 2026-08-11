import Image from 'next/image';

interface SheetProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function Sheet({ title, onClose, children }: SheetProps) {
  return (
    <div className="animate-overlay-fade-in fixed inset-0 z-20 flex items-end justify-center bg-black/40 backdrop-blur-[2px]">
      <div className="animate-sheet-slide-up max-h-[90vh] w-full max-w-[430px] overflow-y-auto rounded-t-3xl bg-white p-6 pb-8 shadow-[0_-12px_40px_rgba(0,0,0,0.18)]">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-black/10" />
        <div className="relative mb-5 flex items-center justify-center">
          <p className="text-lg font-semibold text-black">{title}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="absolute right-0 top-0 flex size-7 items-center justify-center rounded-full bg-black/5 transition-colors hover:bg-black/10 active:scale-95"
          >
            <Image src="/assets/icon-close.svg" alt="" width={14} height={14} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
