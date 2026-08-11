'use client';

import { useEffect, useRef, useState } from 'react';
import { nomeMesa } from '@/lib/mesas';
import type { RestaurantTable } from '@/lib/supabase/types';

interface MenuAcoesMesaProps {
  mesa: RestaurantTable;
  onRenomear: () => void;
  onCopiarLink: () => void;
  onBaixarQR: () => void;
  onRegenerarQR: () => void;
  onToggleQrAtivo: () => void;
  onExcluir: () => void;
}

export function MenuAcoesMesa({
  mesa,
  onRenomear,
  onCopiarLink,
  onBaixarQR,
  onRegenerarQR,
  onToggleQrAtivo,
  onExcluir,
}: MenuAcoesMesaProps) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    function handleClickFora(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setAberto(false);
    }
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, [aberto]);

  function acionar(fn: () => void) {
    setAberto(false);
    fn();
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAberto((atual) => !atual)}
        aria-label={`Mais ações da ${nomeMesa(mesa)}`}
        className="flex size-8 items-center justify-center rounded-lg text-black/40 transition-colors hover:bg-black/5 hover:text-black/70"
      >
        •••
      </button>
      {aberto && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-10 w-56 rounded-xl border border-black/[0.06] bg-white py-1.5 shadow-lg">
          <button
            type="button"
            onClick={() => acionar(onRenomear)}
            className="block w-full px-4 py-2 text-left text-sm text-black/70 transition-colors hover:bg-black/[0.04]"
          >
            Renomear mesa
          </button>
          <button
            type="button"
            onClick={() => acionar(onCopiarLink)}
            className="block w-full px-4 py-2 text-left text-sm text-black/70 transition-colors hover:bg-black/[0.04]"
          >
            Copiar link
          </button>
          <button
            type="button"
            onClick={() => acionar(onBaixarQR)}
            className="block w-full px-4 py-2 text-left text-sm text-black/70 transition-colors hover:bg-black/[0.04]"
          >
            Baixar QR Code
          </button>
          <button
            type="button"
            onClick={() => acionar(onRegenerarQR)}
            className="block w-full px-4 py-2 text-left text-sm text-black/70 transition-colors hover:bg-black/[0.04]"
          >
            Regenerar QR Code
          </button>
          <button
            type="button"
            onClick={() => acionar(onToggleQrAtivo)}
            className="block w-full px-4 py-2 text-left text-sm text-black/70 transition-colors hover:bg-black/[0.04]"
          >
            {mesa.qr_active ? 'Desativar QR' : 'Ativar QR'}
          </button>
          <div className="my-1.5 border-t border-black/[0.06]" />
          <button
            type="button"
            onClick={() => acionar(onExcluir)}
            className="block w-full px-4 py-2 text-left text-sm font-medium text-[#851619] transition-colors hover:bg-[#851619]/8"
          >
            Excluir mesa
          </button>
        </div>
      )}
    </div>
  );
}
