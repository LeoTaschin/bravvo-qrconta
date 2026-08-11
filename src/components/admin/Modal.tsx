'use client';

import { useEffect, useRef } from 'react';

interface ModalProps {
  titulo: string;
  onFechar: () => void;
  children: React.ReactNode;
  largura?: string;
}

/**
 * O controle de "aberto/fechado" é feito por quem usa o Modal: monta o
 * componente só quando precisa mostrá-lo (`{condicao && <Modal ... />}`).
 * Isso evita ter que resetar estado interno (input, erro etc.) via efeito
 * toda vez que o modal reabre — ele já nasce com estado limpo a cada montagem.
 */
export function Modal({ titulo, onFechar, children, largura = 'max-w-sm' }: ModalProps) {
  const painelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onFechar();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onFechar]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onMouseDown={(event) => {
        if (painelRef.current && !painelRef.current.contains(event.target as Node)) onFechar();
      }}
    >
      <div ref={painelRef} className={`w-full ${largura} rounded-2xl bg-white p-6 shadow-xl`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#111827]">{titulo}</h2>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="flex size-7 items-center justify-center rounded-lg text-black/35 transition-colors hover:bg-black/5 hover:text-black/60"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
