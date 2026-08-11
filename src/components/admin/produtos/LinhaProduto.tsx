'use client';

import { formatarReal } from '@/lib/format';
import type { Product } from '@/lib/supabase/types';
import { MenuAcoesProduto } from './MenuAcoesProduto';

interface LinhaProdutoProps {
  produto: Product;
  onEditar: () => void;
  onToggleAtivo: () => void;
  onExcluir: () => void;
}

export function LinhaProduto({ produto, onEditar, onToggleAtivo, onExcluir }: LinhaProdutoProps) {
  return (
    <div className="flex items-center gap-4 border-b border-black/[0.05] px-5 py-3.5 transition-colors last:border-b-0 hover:bg-black/[0.015]">
      <p className="w-56 shrink-0 truncate text-sm font-semibold text-[#111827]">{produto.name}</p>

      <span className="w-40 shrink-0 truncate text-xs text-black/50">{produto.category ?? 'Sem categoria'}</span>

      <span className="w-24 shrink-0 text-sm text-black/70">{formatarReal(produto.price)}</span>

      <span
        className={`flex w-24 shrink-0 items-center gap-1.5 text-xs ${produto.active ? 'text-black/50' : 'font-medium text-[#851619]/75'}`}
      >
        <span className={`size-1.5 shrink-0 rounded-full ${produto.active ? 'bg-[#2f8f4e]' : 'bg-black/20'}`} />
        {produto.active ? 'Ativo' : 'Inativo'}
      </span>

      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <MenuAcoesProduto produto={produto} onEditar={onEditar} onToggleAtivo={onToggleAtivo} onExcluir={onExcluir} />
      </div>
    </div>
  );
}
