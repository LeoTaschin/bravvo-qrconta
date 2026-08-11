import Image from 'next/image';
import { formatarReal } from '@/lib/format';

interface HeaderProps {
  numeroMesa: number;
  faltaPagar: number;
  totalSessao: number;
}

export function Header({ numeroMesa, faltaPagar, totalSessao }: HeaderProps) {
  const proporcaoPaga = totalSessao > 0 ? (totalSessao - faltaPagar) / totalSessao : 0;

  return (
    <div className="relative px-6 pt-6">
      <div className="mx-auto mb-2 flex size-[60px] items-center justify-center rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.12)]">
        <Image src="/assets/logo-bravvo.png" alt="Bravvo Pizzaria Italiana" width={60} height={59} className="rounded-full" />
      </div>
      <p className="text-center text-sm font-medium uppercase tracking-wide text-black/45">
        Mesa {numeroMesa}
      </p>
      <div className="mt-2 flex items-end justify-between">
        <p className="text-base font-medium text-black/55">Falta pagar</p>
        <p className="text-3xl font-semibold tracking-tight text-[#111827] tabular-nums">
          {formatarReal(faltaPagar)}
        </p>
      </div>
      <div className="relative mt-3 h-[12px] w-full overflow-hidden rounded-2xl border-[0.5px] border-black/10 bg-[#f3f3f3] shadow-inner">
        <div
          className="h-full rounded-2xl bg-gradient-to-r from-[#851619] to-[#a3272b] transition-[width] duration-500 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, proporcaoPaga * 100))}%` }}
        />
      </div>
    </div>
  );
}
