'use client';

import { Modal } from './Modal';

interface ModalConfirmacaoProps {
  titulo: string;
  descricao: string;
  textoConfirmar: string;
  confirmando?: boolean;
  erro?: string | null;
  onFechar: () => void;
  onConfirmar: () => void;
}

export function ModalConfirmacao({
  titulo,
  descricao,
  textoConfirmar,
  confirmando,
  erro,
  onFechar,
  onConfirmar,
}: ModalConfirmacaoProps) {
  return (
    <Modal titulo={titulo} onFechar={onFechar}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-black/55">{descricao}</p>
        {erro && <p className="text-xs text-[#851619]">{erro}</p>}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onFechar}
            className="rounded-lg px-4 py-2 text-sm font-medium text-black/50 transition-colors hover:bg-black/5"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={confirmando}
            className="rounded-lg bg-[#851619] px-4 py-2 text-sm font-semibold text-white transition-colors hover:brightness-110 disabled:opacity-50"
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </Modal>
  );
}
