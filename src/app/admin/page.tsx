'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import {
  getStaffForCurrentUser,
  getOpenSessionsForTables,
  getTablesForRestaurant,
  getRestaurantById,
  getSessionItemsForSessions,
} from '@/lib/supabase/admin-queries';
import type { RestaurantTable, SessionItem, Staff, TableSession } from '@/lib/supabase/types';
import { totalItem, totalSessao } from '@/lib/conta';
import { CabecalhoDashboard } from '@/components/admin/CabecalhoDashboard';
import { CabecalhoPagina } from '@/components/admin/CabecalhoPagina';
import { ResumoSalao } from '@/components/admin/ResumoSalao';
import { GradeMesas, TOTAL_MESAS } from '@/components/admin/GradeMesas';
import type { InfoMesaAberta } from '@/components/admin/CartaoMesa';

export default function AdminPage() {
  const router = useRouter();
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [openTableIds, setOpenTableIds] = useState<Set<string>>(new Set());
  const [sessoesAbertas, setSessoesAbertas] = useState<TableSession[]>([]);
  const [itensAbertos, setItensAbertos] = useState<SessionItem[]>([]);
  const [totalPendente, setTotalPendente] = useState(0);

  const recarregarMesas = useCallback(async (restaurantId: string, tableIds: string[]) => {
    const sessoes = await getOpenSessionsForTables(tableIds);
    setOpenTableIds(new Set(sessoes.map((sessao) => sessao.table_id)));
    setSessoesAbertas(sessoes);
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

        setStaff(staffAtual);

        const [mesas, restaurante] = await Promise.all([
          getTablesForRestaurant(staffAtual.restaurant_id),
          getRestaurantById(staffAtual.restaurant_id),
        ]);
        if (cancelado) return;
        setTables(mesas);
        setRestaurantName(restaurante?.name ?? null);

        await recarregarMesas(
          staffAtual.restaurant_id,
          mesas.map((mesa) => mesa.id)
        );
      } catch (err) {
        if (!cancelado) {
          console.error(err);
          setErro('Não foi possível carregar as mesas. Tente novamente.');
        }
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }

    carregar();
    return () => {
      cancelado = true;
    };
  }, [recarregarMesas]);

  useEffect(() => {
    if (!staff || tables.length === 0) return;

    const tableIds = new Set(tables.map((mesa) => mesa.id));
    const channel = supabase
      .channel(`mesas-${staff.restaurant_id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'table_sessions' }, (payload) => {
        const linha = (payload.new ?? payload.old) as { table_id?: string } | null;
        if (linha?.table_id && tableIds.has(linha.table_id)) {
          recarregarMesas(
            staff.restaurant_id,
            tables.map((mesa) => mesa.id)
          );
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [staff, tables, recarregarMesas]);

  const idsSessoesAbertas = sessoesAbertas.map((sessao) => sessao.id).join(',');

  useEffect(() => {
    const ids = idsSessoesAbertas ? idsSessoesAbertas.split(',') : [];
    let cancelado = false;

    async function calcularPendente() {
      const itens = await getSessionItemsForSessions(ids);
      if (cancelado) return;
      setItensAbertos(itens);
      setTotalPendente(itens.filter((item) => item.status !== 'paid').reduce((acc, item) => acc + totalItem(item), 0));
    }

    calcularPendente();

    if (ids.length === 0) {
      return () => {
        cancelado = true;
      };
    }

    const channel = supabase
      .channel(`resumo-itens-${ids.join('-')}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'session_items', filter: `session_id=in.(${ids.join(',')})` },
        calcularPendente
      )
      .subscribe();

    return () => {
      cancelado = true;
      supabase.removeChannel(channel);
    };
  }, [idsSessoesAbertas]);

  const infoOcupadas = useMemo(() => {
    const itensPorSessao = new Map<string, SessionItem[]>();
    for (const item of itensAbertos) {
      const lista = itensPorSessao.get(item.session_id) ?? [];
      lista.push(item);
      itensPorSessao.set(item.session_id, lista);
    }

    const mapa = new Map<string, InfoMesaAberta>();
    for (const sessao of sessoesAbertas) {
      const itens = itensPorSessao.get(sessao.id) ?? [];
      mapa.set(sessao.table_id, {
        valor: totalSessao(itens),
        quantidadeItens: itens.reduce((acc, item) => acc + item.quantity, 0),
        abertaEm: sessao.opened_at,
      });
    }
    return mapa;
  }, [sessoesAbertas, itensAbertos]);

  async function handleSair() {
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  }

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f3f3]">
        <p className="text-sm text-black/40">Carregando mesas...</p>
      </div>
    );
  }

  if (erro && !staff) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f3f3f3] text-center">
        <p className="text-sm text-black/60">{erro}</p>
        <button type="button" onClick={handleSair} className="text-sm font-medium text-[#851619]">
          Sair
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f3f3]">
      {staff && <CabecalhoDashboard staff={staff} restaurantName={restaurantName} />}
      <div className="mx-auto max-w-7xl px-8 py-10">
        <CabecalhoPagina
          titulo="Mesas"
          descricao="Acompanhe o movimento e as contas abertas do salão."
          onGerenciarMesas={() => router.push('/admin/mesas')}
        />
        <ResumoSalao
          totalMesas={TOTAL_MESAS}
          ocupadas={openTableIds.size}
          livres={TOTAL_MESAS - openTableIds.size}
          emAberto={totalPendente}
        />
        <GradeMesas
          tables={tables}
          openTableIds={openTableIds}
          infoOcupadas={infoOcupadas}
          onSelect={(numero) => router.push(`/admin/mesa/${numero}`)}
        />
      </div>
    </div>
  );
}
