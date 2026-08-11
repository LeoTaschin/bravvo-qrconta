'use client';

import { useState } from 'react';
import { Modal } from '@/components/admin/Modal';

interface ModalNovaMesaProps {
  sugestao: string;
  onFechar: () => void;
  onCriar: (valor: string) => Promise<void>;
}

export function ModalNovaMesa({ sugestao, onFechar, onCriar }: ModalNovaMesaProps) {
  const [valor, setValor] = useState('');
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleCriar() {
    setCriando(true);
    setErro(null);
    try {
      await onCriar(valor.trim() || sugestao);
      onFechar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível criar a mesa.');
    } finally {
      setCriando(false);
    }
  }

  return (
    <Modal titulo="Nova mesa" onFechar={onFechar}>
      <div className="flex flex-col gap-3">
        <label className="text-xs font-medium text-black/50">Nome ou número</label>
        <input
          type="text"
          value={valor}
          onChange={(event) => setValor(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && handleCriar()}
          placeholder={sugestao}
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
            onClick={handleCriar}
            disabled={criando}
            className="rounded-lg bg-[#851619] px-4 py-2 text-sm font-semibold text-white transition-colors hover:brightness-110 disabled:opacity-50"
          >
            Criar mesa
          </button>
        </div>
      </div>
    </Modal>
  );
}
