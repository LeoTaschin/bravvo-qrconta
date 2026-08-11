'use client';

import { useEffect, useRef, useState } from 'react';
import { formatarReal } from '@/lib/format';
import { calcularTaxaServico, totalSessao } from '@/lib/conta';
import type { SessionItem } from '@/lib/supabase/types';
import { ItemComandaAdmin } from './ItemComandaAdmin';

interface PainelComandaProps {
  itens: SessionItem[];
  onAlterarQuantidade: (item: SessionItem, quantidade: number) => void;
  onRemoverItem: (item: SessionItem) => void;
  onRemoverTodos: () => void;
  onLiberarMesa: () => void;
  onFecharConta: () => void;
  removendoTodos: boolean;
  liberando: boolean;
}

function EstadoVazioComanda() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 py-12 text-center">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-black/20">
        <path d="M6 3h12v18l-2.5-1.5L13 21l-2.5-1.5L8 21l-2-1.5V3z" strokeLinejoin="round" />
        <path d="M9 8h6M9 12h6M9 16h3" strokeLinecap="round" />
      </svg>
      <p className="text-sm font-medium text-black/50">Nenhum item na comanda</p>
      <p className="text-xs text-black/35">Adicione produtos do cardápio para começar.</p>
    </div>
  );
}

function MenuAcoes({ onRemoverTodos, onLiberarMesa }: { onRemoverTodos: () => void; onLiberarMesa: () => void }) {
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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAberto((atual) => !atual)}
        aria-label="Mais ações da mesa"
        className="flex size-8 items-center justify-center rounded-lg text-black/40 transition-colors hover:bg-black/5 hover:text-black/70"
      >
        •••
      </button>
      {aberto && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-10 w-52 rounded-xl border border-black/[0.06] bg-white py-1.5 shadow-lg">
          <button
            type="button"
            onClick={() => {
              setAberto(false);
              onRemoverTodos();
            }}
            className="block w-full px-4 py-2 text-left text-sm text-black/70 transition-colors hover:bg-black/[0.04]"
          >
            Remover todos os itens
          </button>
          <button
            type="button"
            onClick={() => {
              setAberto(false);
              onLiberarMesa();
            }}
            className="block w-full px-4 py-2 text-left text-sm font-medium text-[#851619] transition-colors hover:bg-[#851619]/8"
          >
            Liberar mesa
          </button>
        </div>
      )}
    </div>
  );
}

export function PainelComanda({
  itens,
  onAlterarQuantidade,
  onRemoverItem,
  onRemoverTodos,
  onLiberarMesa,
  onFecharConta,
  removendoTodos,
  liberando,
}: PainelComandaProps) {
  const subtotal = totalSessao(itens);
  const taxa = calcularTaxaServico(subtotal);
  const total = subtotal + taxa;

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between px-5 py-4">
        <p className="text-sm font-medium text-black/45">Comanda atual</p>
        <MenuAcoes onRemoverTodos={onRemoverTodos} onLiberarMesa={onLiberarMesa} />
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto border-t border-black/[0.06] px-5">
        {itens.length === 0 ? (
          <EstadoVazioComanda />
        ) : (
          <div className="divide-y divide-black/[0.04]">
            {itens.map((item) => (
              <ItemComandaAdmin
                key={item.id}
                item={item}
                onAlterarQuantidade={(quantidade) => onAlterarQuantidade(item, quantidade)}
                onRemover={() => onRemoverItem(item)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-black/[0.06] px-5 pb-5 pt-4">
        <div className="flex items-center justify-between text-sm text-black/45">
          <span>Subtotal</span>
          <span>{formatarReal(subtotal)}</span>
        </div>
        <div className="mt-1.5 flex items-center justify-between text-sm text-black/45">
          <span>Taxa de serviço</span>
          <span>{formatarReal(taxa)}</span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-black/[0.06] pt-3">
          <span className="text-sm font-semibold text-[#111827]">Total</span>
          <span className="text-xl font-semibold text-[#111827]">{formatarReal(total)}</span>
        </div>

        <button
          type="button"
          onClick={onFecharConta}
          disabled={itens.length === 0 || removendoTodos || liberando}
          className="mt-4 h-12 w-full rounded-xl bg-[#851619] text-sm font-semibold text-white transition-colors hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Fechar conta
        </button>
      </div>
    </div>
  );
}
