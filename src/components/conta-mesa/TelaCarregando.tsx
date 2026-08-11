import Image from 'next/image';

export function TelaCarregando() {
  return (
    <div className="fixed inset-0 z-40 mx-auto flex max-w-[430px] flex-col items-center justify-center gap-6 bg-[#f3f3f3]">
      <div className="relative flex items-center justify-center">
        <div className="absolute -inset-2 animate-spin rounded-full border-2 border-[#851619]/15 border-t-[#851619]" />
        <Image
          src="/assets/logo-bravvo.png"
          alt="Bravvo Pizzaria Italiana"
          width={149}
          height={147}
          className="rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.1)]"
        />
      </div>
      <p className="animate-pulse-soft text-xl font-medium text-[#595959]">Carregando conta...</p>
    </div>
  );
}
