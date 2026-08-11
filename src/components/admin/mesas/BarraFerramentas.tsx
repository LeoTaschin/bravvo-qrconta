'use client';

export type FiltroStatusMesa = 'todas' | 'livres' | 'ocupadas';

interface BarraFerramentasProps {
  busca: string;
  onBuscaChange: (valor: string) => void;
  filtro: FiltroStatusMesa;
  onFiltroChange: (filtro: FiltroStatusMesa) => void;
}

const OPCOES: { valor: FiltroStatusMesa; rotulo: string }[] = [
  { valor: 'todas', rotulo: 'Todas' },
  { valor: 'livres', rotulo: 'Livres' },
  { valor: 'ocupadas', rotulo: 'Ocupadas' },
];

export function BarraFerramentas({ busca, onBuscaChange, filtro, onFiltroChange }: BarraFerramentasProps) {
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
          placeholder="Buscar mesa..."
          className="h-10 w-full rounded-lg border border-black/[0.1] bg-white pl-9 pr-3 text-sm text-[#111827] placeholder:text-black/35 focus:border-[#851619]/40 focus:outline-none"
        />
      </div>

      <div className="flex w-fit items-center gap-1 rounded-lg bg-black/[0.04] p-1">
        {OPCOES.map((opcao) => (
          <button
            key={opcao.valor}
            type="button"
            onClick={() => onFiltroChange(opcao.valor)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              filtro === opcao.valor ? 'bg-white text-[#111827] shadow-sm' : 'text-black/50 hover:text-black/70'
            }`}
          >
            {opcao.rotulo}
          </button>
        ))}
      </div>
    </div>
  );
}
