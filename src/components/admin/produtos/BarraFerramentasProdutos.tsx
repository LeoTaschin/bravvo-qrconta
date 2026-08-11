'use client';

import { CATEGORIAS_CARDAPIO } from '@/lib/categorias';

interface BarraFerramentasProdutosProps {
  busca: string;
  onBuscaChange: (valor: string) => void;
  categoria: string;
  onCategoriaChange: (categoria: string) => void;
}

const OPCOES = ['Todas', ...CATEGORIAS_CARDAPIO];

export function BarraFerramentasProdutos({
  busca,
  onBuscaChange,
  categoria,
  onCategoriaChange,
}: BarraFerramentasProdutosProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative sm:w-72">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/30"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={busca}
          onChange={(event) => onBuscaChange(event.target.value)}
          placeholder="Buscar produto..."
          className="h-10 w-full rounded-lg border border-black/[0.1] bg-white pl-9 pr-3 text-sm text-[#111827] placeholder:text-black/35 focus:border-[#851619]/40 focus:outline-none"
        />
      </div>

      <div className="flex w-fit flex-wrap items-center gap-1 rounded-lg bg-black/[0.04] p-1">
        {OPCOES.map((opcao) => (
          <button
            key={opcao}
            type="button"
            onClick={() => onCategoriaChange(opcao)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              categoria === opcao ? 'bg-white text-[#111827] shadow-sm' : 'text-black/50 hover:text-black/70'
            }`}
          >
            {opcao}
          </button>
        ))}
      </div>
    </div>
  );
}
