'use client';

import { useState } from 'react';
import { CATEGORIAS_CARDAPIO } from '@/lib/categorias';
import type { Product } from '@/lib/supabase/types';
import { Modal } from '@/components/admin/Modal';

export interface CamposProduto {
  name: string;
  price: number;
  category: string | null;
}

interface ModalProdutoProps {
  produtoInicial?: Product;
  onFechar: () => void;
  onSalvar: (campos: CamposProduto) => Promise<void>;
}

/** Preço digitado como texto em formato brasileiro ("12,90") e convertido ao salvar. */
function paraNumero(texto: string): number {
  return Number(texto.replace(/\./g, '').replace(',', '.'));
}

export function ModalProduto({ produtoInicial, onFechar, onSalvar }: ModalProdutoProps) {
  const [nome, setNome] = useState(produtoInicial?.name ?? '');
  const [preco, setPreco] = useState(produtoInicial ? String(produtoInicial.price).replace('.', ',') : '');
  const [categoria, setCategoria] = useState(produtoInicial?.category ?? '');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSalvar() {
    const nomeLimpo = nome.trim();
    const precoNumero = paraNumero(preco);

    if (!nomeLimpo) {
      setErro('Informe o nome do produto.');
      return;
    }
    if (!Number.isFinite(precoNumero) || precoNumero <= 0) {
      setErro('Informe um preço válido.');
      return;
    }

    setSalvando(true);
    setErro(null);
    try {
      await onSalvar({ name: nomeLimpo, price: precoNumero, category: categoria || null });
      onFechar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível salvar o produto.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal titulo={produtoInicial ? 'Editar produto' : 'Novo produto'} onFechar={onFechar}>
      <div className="flex flex-col gap-3">
        <div>
          <label className="text-xs font-medium text-black/50">Nome</label>
          <input
            type="text"
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            autoFocus
            placeholder="Ex: Calabresa Artesanal 25cm"
            className="mt-1 h-11 w-full rounded-lg border border-black/[0.1] px-3 text-sm text-[#111827] focus:border-[#851619]/40 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-black/50">Preço</label>
          <input
            type="text"
            inputMode="decimal"
            value={preco}
            onChange={(event) => setPreco(event.target.value)}
            placeholder="0,00"
            className="mt-1 h-11 w-full rounded-lg border border-black/[0.1] px-3 text-sm text-[#111827] focus:border-[#851619]/40 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-black/50">Categoria</label>
          <select
            value={categoria}
            onChange={(event) => setCategoria(event.target.value)}
            className="mt-1 h-11 w-full rounded-lg border border-black/[0.1] bg-white px-3 text-sm text-[#111827] focus:border-[#851619]/40 focus:outline-none"
          >
            <option value="">Sem categoria</option>
            {CATEGORIAS_CARDAPIO.map((opcao) => (
              <option key={opcao} value={opcao}>
                {opcao}
              </option>
            ))}
          </select>
        </div>

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
            {produtoInicial ? 'Salvar' : 'Criar produto'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
