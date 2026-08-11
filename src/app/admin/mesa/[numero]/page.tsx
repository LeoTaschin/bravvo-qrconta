'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { getOrCreateOpenSession, getSessionItems } from '@/lib/supabase/queries';
import {
  getStaffForCurrentUser,
  getTableByNumber,
  getProductsForRestaurant,
  adicionarItemNaComanda,
  atualizarQuantidadeItem,
  removerItemDaComanda,
  removerTodosItens,
  closeSession,
} from '@/lib/supabase/admin-queries';
import type { Product, RestaurantTable, SessionItem, TableSession } from '@/lib/supabase/types';
import { totalItem } from '@/lib/conta';
import { formatarReal } from '@/lib/format';
import { CATEGORIAS_CARDAPIO } from '@/lib/categorias';
import { CabecalhoMesa } from '@/components/admin/CabecalhoMesa';
import { CardapioMesa } from '@/components/admin/CardapioMesa';
import { PainelComanda } from '@/components/admin/PainelComanda';

const TODAS_CATEGORIAS = 'Todos';

export default function AdminMesaPage() {
  const params = useParams<{ numero: string }>();
  const numero = Number(params.numero);
  const router = useRouter();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [table, setTable] = useState<RestaurantTable | null>(null);
  const [session, setSession] = useState<TableSession | null>(null);
  const [itens, setItens] = useState<SessionItem[]>([]);
  const [produtos, setProdutos] = useState<Product[]>([]);
  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState(TODAS_CATEGORIAS);
  const [removendoTodos, setRemovendoTodos] = useState(false);
  const [liberando, setLiberando] = useState(false);

  const recarregarItens = useCallback(async (sessionId: string) => {
    const itensAtualizados = await getSessionItems(sessionId);
    setItens(itensAtualizados);
  }, []);

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

        const mesa = await getTableByNumber(staffAtual.restaurant_id, numero);
        if (cancelado) return;

        if (!mesa) {
          setErro('Mesa não cadastrada.');
          setCarregando(false);
          return;
        }
        setTable(mesa);

        const [sessaoAtual, produtosCatalogo] = await Promise.all([
          getOrCreateOpenSession(mesa.id),
          getProductsForRestaurant(staffAtual.restaurant_id),
        ]);
        if (cancelado) return;

        setSession(sessaoAtual);
        setProdutos(produtosCatalogo);
        await recarregarItens(sessaoAtual.id);
      } catch (err) {
        if (!cancelado) {
          console.error(err);
          setErro('Não foi possível carregar a mesa. Tente novamente.');
        }
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }

    carregar();
    return () => {
      cancelado = true;
    };
  }, [numero, recarregarItens]);

  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel(`admin-sessao-${session.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'session_items', filter: `session_id=eq.${session.id}` },
        () => recarregarItens(session.id)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, recarregarItens]);

  const categorias = useMemo(() => {
    const encontradas = new Set<string>();
    for (const produto of produtos) {
      if (produto.category && !CATEGORIAS_CARDAPIO.includes(produto.category)) encontradas.add(produto.category);
    }
    // Categorias fixas da pizzaria primeiro (sempre visíveis, mesmo sem
    // produto cadastrado ainda), depois qualquer categoria extra encontrada.
    return [...CATEGORIAS_CARDAPIO, ...Array.from(encontradas).sort((a, b) => a.localeCompare(b, 'pt-BR'))];
  }, [produtos]);

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return produtos.filter((produto) => {
      const combinaCategoria = categoriaAtiva === TODAS_CATEGORIAS || produto.category === categoriaAtiva;
      const combinaBusca = !termo || produto.name.toLowerCase().includes(termo);
      return combinaCategoria && combinaBusca;
    });
  }, [produtos, busca, categoriaAtiva]);

  // Quantidade já lançada de cada produto (por nome), pra mostrar um "×N"
  // discreto na linha do cardápio sem precisar olhar pra comanda ao lado.
  const quantidadesNaComanda = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const item of itens) {
      if (item.status !== 'unpaid') continue;
      mapa.set(item.name, (mapa.get(item.name) ?? 0) + item.quantity);
    }
    return mapa;
  }, [itens]);

  async function handleAdicionarProduto(produto: Product) {
    if (!table) return;
    try {
      // Se a mesa acabou de ser liberada, não há sessão aberta ainda — abre
      // uma nova só agora, no primeiro item lançado pro próximo cliente.
      const sessaoAtiva = session ?? (await getOrCreateOpenSession(table.id));
      if (sessaoAtiva.id !== session?.id) setSession(sessaoAtiva);

      await adicionarItemNaComanda(sessaoAtiva.id, produto, itens);
      await recarregarItens(sessaoAtiva.id);
    } catch (err) {
      console.error(err);
      setErro('Não foi possível adicionar o item. Tente novamente.');
    }
  }

  async function handleAlterarQuantidade(item: SessionItem, quantidade: number) {
    try {
      await atualizarQuantidadeItem(item.id, quantidade);
      if (session) await recarregarItens(session.id);
    } catch (err) {
      console.error(err);
      setErro('Não foi possível atualizar a quantidade. Tente novamente.');
    }
  }

  async function handleRemoverItem(item: SessionItem) {
    try {
      await removerItemDaComanda(item.id);
      if (session) await recarregarItens(session.id);
    } catch (err) {
      console.error(err);
      setErro('Não foi possível remover o item. Tente novamente.');
    }
  }

  async function handleRemoverTodos() {
    if (!session || itens.length === 0) return;
    const confirmado = window.confirm(`Remover todos os ${itens.length} itens da comanda da Mesa ${numero}?`);
    if (!confirmado) return;

    setRemovendoTodos(true);
    try {
      await removerTodosItens(session.id);
      await recarregarItens(session.id);
    } catch (err) {
      console.error(err);
      setErro('Não foi possível remover os itens. Tente novamente.');
    } finally {
      setRemovendoTodos(false);
    }
  }

  async function handleLiberarMesa() {
    if (!session) return;

    const pendente = itens.filter((item) => item.status !== 'paid').reduce((acc, item) => acc + totalItem(item), 0);
    const aviso = pendente > 0 ? `Essa mesa ainda tem ${formatarReal(pendente)} em aberto. ` : '';
    const confirmado = window.confirm(
      `${aviso}Tem certeza que deseja liberar a Mesa ${numero}? A conta atual será encerrada e a mesa ficará livre para o próximo cliente.`
    );
    if (!confirmado) return;

    setLiberando(true);
    try {
      await closeSession(session.id);
      // Não abre sessão nova aqui: a mesa precisa aparecer como livre na
      // grade até que um novo pedido realmente comece (cliente ou garçom).
      setSession(null);
      setItens([]);
    } catch (err) {
      console.error(err);
      setErro('Não foi possível liberar a mesa. Tente novamente.');
    } finally {
      setLiberando(false);
    }
  }

  function handleFecharConta() {
    // Futuramente inicia o fluxo de fechamento digital pelo celular do
    // cliente. Por ora só a mesa é liberada manualmente (menu •••).
    window.alert(
      'Fechamento de conta pelo celular do cliente: em breve.\nPor enquanto, use "Liberar mesa" para encerrar manualmente.'
    );
  }

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f3f3]">
        <p className="text-sm text-black/40">Carregando mesa...</p>
      </div>
    );
  }

  if (erro && !table) {
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
    <div className="flex flex-col bg-[#f3f3f3] lg:h-screen lg:overflow-hidden">
      <CabecalhoMesa
        numero={numero}
        ocupada={Boolean(session)}
        abertaEm={session?.opened_at}
        onVoltar={() => router.push('/admin')}
      />

      {erro && (
        <p className="shrink-0 bg-[#851619]/8 px-6 py-2 text-center text-xs font-medium text-[#851619] sm:px-8">{erro}</p>
      )}

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-6 lg:flex-row lg:gap-0 lg:overflow-hidden lg:p-0">
        <main className="lg:flex-1 lg:overflow-y-auto lg:px-8 lg:py-6">
          <CardapioMesa
            produtos={produtosFiltrados}
            categorias={categorias}
            categoriaAtiva={categoriaAtiva}
            busca={busca}
            quantidadesNaComanda={quantidadesNaComanda}
            onBuscaChange={setBusca}
            onCategoriaChange={setCategoriaAtiva}
            onAdicionar={handleAdicionarProduto}
          />
        </main>

        <aside className="min-h-[420px] rounded-xl border border-black/[0.06] bg-white lg:h-full lg:w-[400px] lg:shrink-0 lg:rounded-none lg:border-y-0 lg:border-r-0 lg:border-l">
          <PainelComanda
            itens={itens}
            onAlterarQuantidade={handleAlterarQuantidade}
            onRemoverItem={handleRemoverItem}
            onRemoverTodos={handleRemoverTodos}
            onLiberarMesa={handleLiberarMesa}
            onFecharConta={handleFecharConta}
            removendoTodos={removendoTodos}
            liberando={liberando}
          />
        </aside>
      </div>
    </div>
  );
}
