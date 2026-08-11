import type { Product } from '@/lib/supabase/types';
import { formatarReal } from '@/lib/format';

const TODAS_CATEGORIAS = 'Todos';

interface CardapioMesaProps {
  produtos: Product[];
  categorias: string[];
  categoriaAtiva: string;
  busca: string;
  quantidadesNaComanda: Map<string, number>;
  onBuscaChange: (busca: string) => void;
  onCategoriaChange: (categoria: string) => void;
  onAdicionar: (produto: Product) => void;
}

function LinhaProduto({
  produto,
  quantidade,
  onAdicionar,
}: {
  produto: Product;
  quantidade: number;
  onAdicionar: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-[#111827]">{produto.name}</p>
        <p className="text-xs text-black/40">{formatarReal(produto.price)}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2.5">
        {quantidade > 0 && <span className="text-xs font-medium text-[#851619]">×{quantidade}</span>}
        <button
          type="button"
          onClick={onAdicionar}
          aria-label={`Adicionar ${produto.name}`}
          className="flex size-8 items-center justify-center rounded-full border border-black/[0.08] text-base font-medium text-[#851619] transition-colors hover:border-[#851619]/30 hover:bg-[#851619]/8 active:scale-95"
        >
          +
        </button>
      </div>
    </div>
  );
}

export function CardapioMesa({
  produtos,
  categorias,
  categoriaAtiva,
  busca,
  quantidadesNaComanda,
  onBuscaChange,
  onCategoriaChange,
  onAdicionar,
}: CardapioMesaProps) {
  return (
    <div className="flex h-full flex-col">
      <p className="mb-4 text-sm font-medium text-black/45">Cardápio</p>

      <input
        type="text"
        value={busca}
        onChange={(event) => onBuscaChange(event.target.value)}
        placeholder="Buscar item pelo nome..."
        className="h-11 w-full rounded-xl border border-black/[0.08] bg-white px-4 text-sm text-[#111827] placeholder:text-black/35 focus:border-[#851619]/40 focus:outline-none"
      />

      <div className="mt-4 flex flex-wrap gap-1.5">
        {[TODAS_CATEGORIAS, ...categorias].map((categoria) => (
          <button
            key={categoria}
            type="button"
            onClick={() => onCategoriaChange(categoria)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              categoriaAtiva === categoria
                ? 'bg-[#851619] text-white'
                : 'text-black/50 hover:bg-black/[0.04] hover:text-black/70'
            }`}
          >
            {categoria}
          </button>
        ))}
      </div>

      <div className="mt-2 flex-1 divide-y divide-black/[0.04] overflow-y-auto">
        {produtos.length === 0 ? (
          <p className="py-8 text-center text-sm text-black/40">Nenhum produto encontrado.</p>
        ) : (
          produtos.map((produto) => (
            <LinhaProduto
              key={produto.id}
              produto={produto}
              quantidade={quantidadesNaComanda.get(produto.name) ?? 0}
              onAdicionar={() => onAdicionar(produto)}
            />
          ))
        )}
      </div>
    </div>
  );
}
