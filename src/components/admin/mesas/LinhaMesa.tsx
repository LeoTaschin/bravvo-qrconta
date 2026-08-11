'use client';

import { nomeMesa } from '@/lib/mesas';
import type { RestaurantTable } from '@/lib/supabase/types';
import { MenuAcoesMesa } from './MenuAcoesMesa';

interface LinhaMesaProps {
  mesa: RestaurantTable;
  ocupada: boolean;
  selecionada: boolean;
  onToggleSelecionada: () => void;
  onVerQR: () => void;
  onRenomear: () => void;
  onCopiarLink: () => void;
  onBaixarQR: () => void;
  onRegenerarQR: () => void;
  onToggleQrAtivo: () => void;
  onExcluir: () => void;
}

export function LinhaMesa({
  mesa,
  ocupada,
  selecionada,
  onToggleSelecionada,
  onVerQR,
  onRenomear,
  onCopiarLink,
  onBaixarQR,
  onRegenerarQR,
  onToggleQrAtivo,
  onExcluir,
}: LinhaMesaProps) {
  return (
    <div className="flex items-center gap-4 border-b border-black/[0.05] px-5 py-3.5 transition-colors last:border-b-0 hover:bg-black/[0.015]">
      <input
        type="checkbox"
        checked={selecionada}
        onChange={onToggleSelecionada}
        aria-label={`Selecionar ${nomeMesa(mesa)}`}
        className="size-4 shrink-0 rounded border-black/25 text-[#851619] accent-[#851619]"
      />

      <p className="w-32 shrink-0 truncate text-sm font-semibold text-[#111827]">{nomeMesa(mesa)}</p>

      <span className="flex w-24 shrink-0 items-center gap-1.5 text-xs text-black/50">
        <span className={`size-1.5 shrink-0 rounded-full ${ocupada ? 'bg-[#851619]' : 'bg-black/20'}`} />
        {ocupada ? 'Ocupada' : 'Livre'}
      </span>

      <span className={`w-24 shrink-0 text-xs ${mesa.qr_active ? 'text-black/40' : 'font-medium text-[#851619]/75'}`}>
        {mesa.qr_active ? 'QR ativo' : 'QR desativado'}
      </span>

      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={onVerQR}
          className="rounded-lg border border-black/[0.08] px-3.5 py-1.5 text-xs font-medium text-black/65 transition-colors hover:border-black/15 hover:text-black/85"
        >
          Ver QR
        </button>
        <MenuAcoesMesa
          mesa={mesa}
          onRenomear={onRenomear}
          onCopiarLink={onCopiarLink}
          onBaixarQR={onBaixarQR}
          onRegenerarQR={onRegenerarQR}
          onToggleQrAtivo={onToggleQrAtivo}
          onExcluir={onExcluir}
        />
      </div>
    </div>
  );
}
