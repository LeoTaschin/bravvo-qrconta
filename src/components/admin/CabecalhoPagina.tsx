interface CabecalhoPaginaProps {
  titulo: string;
  descricao: string;
  onGerenciarMesas?: () => void;
}

export function CabecalhoPagina({ titulo, descricao, onGerenciarMesas }: CabecalhoPaginaProps) {
  return (
    <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight text-[#111827]">{titulo}</h1>
        <p className="mt-1 text-sm text-black/45">{descricao}</p>
      </div>

      <button
        type="button"
        onClick={onGerenciarMesas}
        className="flex shrink-0 items-center gap-2 rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-medium text-black/60 transition-colors hover:border-black/15 hover:text-black/80"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
        Gerenciar mesas
      </button>
    </div>
  );
}
