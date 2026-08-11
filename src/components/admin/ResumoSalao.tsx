import type { ReactNode } from 'react';
import { formatarReal } from '@/lib/format';

interface ResumoSalaoProps {
  totalMesas: number;
  ocupadas: number;
  livres: number;
  emAberto: number;
}

interface CardResumoProps {
  valor: string;
  label: string;
  icone: ReactNode;
  corIcone?: string;
}

function CardResumo({ valor, label, icone, corIcone = 'text-black/25' }: CardResumoProps) {
  return (
    <div className="rounded-xl border border-black/[0.06] bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-2xl font-semibold leading-none text-[#111827]">{valor}</span>
        <span className={corIcone}>{icone}</span>
      </div>
      <p className="mt-2 text-sm text-black/45">{label}</p>
    </div>
  );
}

function IconeMesas() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function IconeOcupadas() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.25" />
      <path d="M3.5 20c0-3.5 2.5-6 5.5-6s5.5 2.5 5.5 6" />
      <path d="M16 9.5c1.4-.3 2.5-1.5 2.5-3S17.4 3.8 16 3.5" />
      <path d="M18.5 14.2c1.7.5 3 2.3 3 4.8" />
    </svg>
  );
}

function IconeLivres() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5 5.5-6" />
    </svg>
  );
}

function IconeEmAberto() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v9" />
      <path d="M15 9.75c0-1.24-1.34-2.25-3-2.25s-3 1.01-3 2.25 1.34 2.25 3 2.25 3 1.01 3 2.25-1.34 2.25-3 2.25-3-1.01-3-2.25" />
    </svg>
  );
}

export function ResumoSalao({ totalMesas, ocupadas, livres, emAberto }: ResumoSalaoProps) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <CardResumo valor={String(totalMesas)} label="Mesas" icone={<IconeMesas />} />
      <CardResumo valor={String(ocupadas)} label="Ocupadas" icone={<IconeOcupadas />} corIcone="text-[#851619]/60" />
      <CardResumo valor={String(livres)} label="Livres" icone={<IconeLivres />} corIcone="text-emerald-600/50" />
      <CardResumo valor={formatarReal(emAberto)} label="Em aberto" icone={<IconeEmAberto />} />
    </div>
  );
}
