'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getStaffForCurrentUser,
  getRestaurantById,
  getAllProductsForRestaurant,
  createProduct,
  updateProduct,
  setProductActive,
  deleteProduct,
} from '@/lib/supabase/admin-queries';
import type { Product, Staff } from '@/lib/supabase/types';
import { CabecalhoDashboard } from '@/components/admin/CabecalhoDashboard';
import { ModalConfirmacao } from '@/components/admin/ModalConfirmacao';
import { LinhaProduto } from '@/components/admin/produtos/LinhaProduto';
import { BarraFerramentasProdutos } from '@/components/admin/produtos/BarraFerramentasProdutos';
import { ModalProduto, type CamposProduto } from '@/components/admin/produtos/ModalProduto';

export default function AdminGerenciarProdutosPage() {
  const router = useRouter();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [produtos, setProdutos] = useState<Product[]>([]);

  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('Todas');

  const [modalAberto, setModalAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Product | null>(null);
  const [produtoExcluindo, setProdutoExcluindo] = useState<Product | null>(null);
  const [excluindoAtivo, setExcluindoAtivo] = useState(false);
  const [erroExcluir, setErroExcluir] = useState<string | null>(null);

  const [aviso, setAviso] = useState<string | null>(null);

  function mostrarAviso(texto: string) {
    setAviso(texto);
    setTimeout(() => setAviso(null), 2500);
  }

  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      try {
        const staffAtual = await getStaffForCurrentUser();
        if (cancelado) return;

        if (!staffAtual) {
          setErro('Sua conta não está vinculada a nenhum restaurante. Fale com o administrador.');
          setCarregando(false);
          return;
        }
        setStaff(staffAtual);

        const [restaurante, produtosCarregados] = await Promise.all([
          getRestaurantById(staffAtual.restaurant_id),
          getAllProductsForRestaurant(staffAtual.restaurant_id),
        ]);
        if (cancelado) return;
        setRestaurantName(restaurante?.name ?? null);
        setProdutos(produtosCarregados);
      } catch (err) {
        if (!cancelado) {
          console.error(err);
          setErro('Não foi possível carregar os produtos. Tente novamente.');
        }
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }

    carregar();
    return () => {
      cancelado = true;
    };
  }, []);

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return produtos.filter((produto) => {
      const combinaBusca = !termo || produto.name.toLowerCase().includes(termo);
      const combinaCategoria = categoria === 'Todas' || produto.category === categoria;
      return combinaBusca && combinaCategoria;
    });
  }, [produtos, busca, categoria]);

  async function handleCriar(campos: CamposProduto) {
    if (!staff) return;
    const novoProduto = await createProduct(staff.restaurant_id, campos.name, campos.price, campos.category);
    setProdutos((atual) => [...atual, novoProduto].sort((a, b) => a.name.localeCompare(b.name)));
    mostrarAviso(`${novoProduto.name} criado.`);
  }

  async function handleEditar(campos: CamposProduto) {
    if (!produtoEditando) return;
    const atualizado = await updateProduct(produtoEditando.id, campos);
    setProdutos((atual) =>
      atual.map((item) => (item.id === atualizado.id ? atualizado : item)).sort((a, b) => a.name.localeCompare(b.name))
    );
    mostrarAviso(`${atualizado.name} atualizado.`);
  }

  async function handleToggleAtivo(produto: Product) {
    const novoValor = !produto.active;
    try {
      await setProductActive(produto.id, novoValor);
      setProdutos((atual) => atual.map((item) => (item.id === produto.id ? { ...item, active: novoValor } : item)));
      mostrarAviso(novoValor ? `${produto.name} ativado.` : `${produto.name} desativado.`);
    } catch (err) {
      console.error(err);
      mostrarAviso('Não foi possível atualizar o produto.');
    }
  }

  async function handleConfirmarExcluir() {
    if (!produtoExcluindo) return;
    setExcluindoAtivo(true);
    setErroExcluir(null);
    try {
      await deleteProduct(produtoExcluindo.id);
      const idAlvo = produtoExcluindo.id;
      setProdutos((atual) => atual.filter((item) => item.id !== idAlvo));
      setProdutoExcluindo(null);
    } catch (err) {
      console.error(err);
      setErroExcluir('Não foi possível excluir o produto.');
    } finally {
      setExcluindoAtivo(false);
    }
  }

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f3f3]">
        <p className="text-sm text-black/40">Carregando produtos...</p>
      </div>
    );
  }

  if (erro && !staff) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f3f3f3] text-center">
        <p className="text-sm text-black/60">{erro}</p>
        <button type="button" onClick={() => router.push('/admin')} className="text-sm font-medium text-[#851619]">
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f3f3]">
      {staff && <CabecalhoDashboard staff={staff} restaurantName={restaurantName} />}

      <div className="mx-auto max-w-3xl px-8 py-10">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-[28px] font-semibold tracking-tight text-[#111827]">Gerenciar produtos</h1>
            <p className="mt-1 text-sm text-black/45">Cadastre, edite e organize os itens do cardápio.</p>
          </div>
          <button
            type="button"
            onClick={() => setModalAberto(true)}
            className="h-10 shrink-0 rounded-lg bg-[#851619] px-4 text-sm font-semibold text-white transition-colors hover:brightness-110"
          >
            + Novo produto
          </button>
        </div>

        <p className="mb-6 mt-3 text-sm text-black/40">
          {produtos.length} {produtos.length === 1 ? 'produto cadastrado' : 'produtos cadastrados'}
        </p>

        {erro && <p className="mb-4 text-xs text-[#851619]">{erro}</p>}

        <BarraFerramentasProdutos
          busca={busca}
          onBuscaChange={setBusca}
          categoria={categoria}
          onCategoriaChange={setCategoria}
        />

        <div className="rounded-xl border border-black/[0.06] bg-white">
          {produtos.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-black/40">Nenhum produto cadastrado ainda.</p>
          ) : produtosFiltrados.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-black/40">Nenhum produto encontrado.</p>
          ) : (
            produtosFiltrados.map((produto) => (
              <LinhaProduto
                key={produto.id}
                produto={produto}
                onEditar={() => setProdutoEditando(produto)}
                onToggleAtivo={() => handleToggleAtivo(produto)}
                onExcluir={() => setProdutoExcluindo(produto)}
              />
            ))
          )}
        </div>
      </div>

      {modalAberto && <ModalProduto onFechar={() => setModalAberto(false)} onSalvar={handleCriar} />}

      {produtoEditando && (
        <ModalProduto
          key={produtoEditando.id}
          produtoInicial={produtoEditando}
          onFechar={() => setProdutoEditando(null)}
          onSalvar={handleEditar}
        />
      )}

      {produtoExcluindo && (
        <ModalConfirmacao
          titulo={`Excluir ${produtoExcluindo.name}?`}
          descricao="O produto deixará de aparecer no cardápio e no lançamento de itens."
          textoConfirmar="Excluir produto"
          confirmando={excluindoAtivo}
          erro={erroExcluir}
          onFechar={() => {
            setProdutoExcluindo(null);
            setErroExcluir(null);
          }}
          onConfirmar={handleConfirmarExcluir}
        />
      )}

      {aviso && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-[#111827] px-4 py-2.5 text-sm text-white shadow-lg">
          {aviso}
        </div>
      )}
    </div>
  );
}
