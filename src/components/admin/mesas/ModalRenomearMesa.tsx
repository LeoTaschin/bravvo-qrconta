'use client';

import { useState } from 'react';
import { nomeMesa } from '@/lib/mesas';
import type { RestaurantTable } from '@/lib/supabase/types';
import { Modal } from '@/components/admin/Modal';

interface ModalRenomearMesaProps {
  mesa: RestaurantTable;
  onFechar: () => void;
  onSalvar: (nome: string | null) => Promise<void>;
}

export function ModalRenomearMesa({ mesa, onFechar, onSalvar }: ModalRenomearMesaProps) {
  const [nome, setNome] = useState(() => nomeMesa(mesa));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSalvar() {
    setSalvando(true);
    setErro(null);
    try {
      await onSalvar(nome.trim() || null);
      onFechar();
    } catch {
      setErro('Não foi possível salvar o nome.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal titulo="Renomear mesa" onFechar={onFechar}>
      <div className="flex flex-col gap-3">
        <label className="text-xs font-medium text-black/50">Nome da mesa</label>
        <input
          type="text"
          value={nome}
          onChange={(event) => setNome(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && handleSalvar()}
          autoFocus
          className="h-11 rounded-lg border border-black/[0.1] px-3 text-sm text-[#111827] focus:border-[#851619]/40 focus:outline-none"
        />
        {erro && <p className="text-xs text-[#851619]">{erro}</p>}
        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onFechar}
            className="rounded-lg px-4 py-2 text-sm font-medium text-black/50 transition-colors hover:bg-black/5"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSalvar}
            disabled={salvando}
            className="rounded-lg bg-[#851619] px-4 py-2 text-sm font-semibold text-white transition-colors hover:brightness-110 disabled:opacity-50"
          >
            Salvar
          </button>
        </div>
      </div>
    </Modal>
  );
}
