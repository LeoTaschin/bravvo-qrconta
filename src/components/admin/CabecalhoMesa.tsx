'use client';

import { useEffect, useState } from 'react';
import { formatarTempoDecorrido } from '@/lib/tempo';

interface CabecalhoMesaProps {
  numero: number;
  ocupada: boolean;
  abertaEm?: string;
  onVoltar: () => void;
}

export function CabecalhoMesa({ numero, ocupada, abertaEm, onVoltar }: CabecalhoMesaProps) {
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    const intervalo = setInterval(() => setAgora(Date.now()), 30_000);
    return () => clearInterval(intervalo);
  }, []);

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-black/[0.06] bg-white px-6 sm:px-8">
      <button
        type="button"
        onClick={onVoltar}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-black/50 transition-colors hover:bg-black/5 hover:text-black"
      >
        ← Mesas
      </button>

      <span className="h-4 w-px bg-black/10" />

      <p className="text-base font-semibold text-[#111827]">Mesa {String(numero).padStart(2, '0')}</p>

      <span className="flex items-center gap-1.5 text-sm text-black/45">
        <span className={`size-1.5 rounded-full ${ocupada ? 'bg-[#851619]' : 'bg-black/20'}`} />
        <span className={ocupada ? 'font-medium text-[#851619]' : ''}>{ocupada ? 'Ocupada' : 'Livre'}</span>
        {ocupada && abertaEm && <span>• aberta há {formatarTempoDecorrido(abertaEm, agora)}</span>}
      </span>
    </header>
  );
}
