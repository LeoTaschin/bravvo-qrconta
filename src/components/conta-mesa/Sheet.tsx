import Image from 'next/image';

interface SheetProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function Sheet({ title, onClose, children }: SheetProps) {
  return (
    <div className="animate-overlay-fade-in absolute inset-0 z-20 flex items-end justify-center bg-black/40 backdrop-blur-[2px]">
      {/* Tocar fora fecha o sheet — comportamento esperado no celular, onde o
          "x" no canto é um alvo pequeno. É um button de propósito, pra também
          responder ao teclado. */}
      <button type="button" aria-label="Fechar" onClick={onClose} className="absolute inset-0" />

      <div className="animate-sheet-slide-up relative flex max-h-[85%] w-full flex-col rounded-t-3xl bg-white pb-[max(2rem,env(safe-area-inset-bottom))] shadow-[0_-12px_40px_rgba(0,0,0,0.18)]">
        <div className="shrink-0 px-6 pt-6">
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
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6">{children}</div>
      </div>
    </div>
  );
}
