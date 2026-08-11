'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getStaffForCurrentUser,
  getRestaurantById,
  getTablesForRestaurant,
  getOpenSessionsForTables,
  createTable,
  updateTableName,
  setTableQrActive,
  regenerateTableSlug,
  deleteTable,
  closeSessions,
} from '@/lib/supabase/admin-queries';
import type { RestaurantTable, Staff, TableSession } from '@/lib/supabase/types';
import { nomeMesa, interpretarNomeOuNumero } from '@/lib/mesas';
import { gerarImagemQR } from '@/lib/pix/qrcode';
import { baixarDataUrl, linkMesa, baixarQRsEmLote, gerarPDFImpressao } from '@/lib/mesas-export';
import { CabecalhoDashboard } from '@/components/admin/CabecalhoDashboard';
import { LinhaMesa } from '@/components/admin/mesas/LinhaMesa';
import { BarraFerramentas, type FiltroStatusMesa } from '@/components/admin/mesas/BarraFerramentas';
import { BarraSelecao } from '@/components/admin/mesas/BarraSelecao';
import { ModalNovaMesa } from '@/components/admin/mesas/ModalNovaMesa';
import { ModalRenomearMesa } from '@/components/admin/mesas/ModalRenomearMesa';
import { ModalVerQR } from '@/components/admin/mesas/ModalVerQR';
import { ModalConfirmacao } from '@/components/admin/ModalConfirmacao';

function nomeArquivoQR(mesa: RestaurantTable): string {
  return `qrcode-${nomeMesa(mesa).toLowerCase().replace(/\s+/g, '-')}.png`;
}

export default function AdminGerenciarMesasPage() {
  const router = useRouter();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [sessoesAbertas, setSessoesAbertas] = useState<TableSession[]>([]);
  const openTableIds = useMemo(() => new Set(sessoesAbertas.map((sessao) => sessao.table_id)), [sessoesAbertas]);

  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatusMesa>('todas');
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());

  const [modalNovaMesaAberta, setModalNovaMesaAberta] = useState(false);
  const [mesaRenomeando, setMesaRenomeando] = useState<RestaurantTable | null>(null);
  const [mesaVerQR, setMesaVerQR] = useState<RestaurantTable | null>(null);
  const [mesaRegenerando, setMesaRegenerando] = useState<RestaurantTable | null>(null);
  const [regenerandoAtivo, setRegenerandoAtivo] = useState(false);
  const [erroRegenerar, setErroRegenerar] = useState<string | null>(null);
  const [mesaExcluindo, setMesaExcluindo] = useState<RestaurantTable | null>(null);
  const [excluindoAtivo, setExcluindoAtivo] = useState(false);
  const [erroExcluir, setErroExcluir] = useState<string | null>(null);
  const [processandoLote, setProcessandoLote] = useState(false);
  const [modalFecharTodasAberto, setModalFecharTodasAberto] = useState(false);
  const [fechandoTodasAtivo, setFechandoTodasAtivo] = useState(false);
  const [erroFecharTodas, setErroFecharTodas] = useState<string | null>(null);

  const [aviso, setAviso] = useState<string | null>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

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

        const [restaurante, mesas] = await Promise.all([
          getRestaurantById(staffAtual.restaurant_id),
          getTablesForRestaurant(staffAtual.restaurant_id),
        ]);
        if (cancelado) return;
        setRestaurantName(restaurante?.name ?? null);
        setTables(mesas);

        const sessoes = await getOpenSessionsForTables(mesas.map((mesa) => mesa.id));
        if (cancelado) return;
        setSessoesAbertas(sessoes);
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
  }, []);

  const proximoNumeroSugerido = useMemo(
    () => tables.reduce((max, mesa) => Math.max(max, mesa.number), 0) + 1,
    [tables]
  );

  const mesasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return tables.filter((mesa) => {
      const combinaBusca = !termo || nomeMesa(mesa).toLowerCase().includes(termo) || String(mesa.number).includes(termo);
      const ocupada = openTableIds.has(mesa.id);
      const combinaFiltro = filtroStatus === 'todas' || (filtroStatus === 'ocupadas' ? ocupada : !ocupada);
      return combinaBusca && combinaFiltro;
    });
  }, [tables, busca, filtroStatus, openTableIds]);

  const mesasSelecionadas = tables.filter((mesa) => selecionadas.has(mesa.id));
  const todasVisiveisSelecionadas =
    mesasFiltradas.length > 0 && mesasFiltradas.every((mesa) => selecionadas.has(mesa.id));

  function toggleSelecionada(id: string) {
    setSelecionadas((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  function toggleSelecionarTodasVisiveis() {
    setSelecionadas((atual) => {
      const novo = new Set(atual);
      if (todasVisiveisSelecionadas) {
        mesasFiltradas.forEach((mesa) => novo.delete(mesa.id));
      } else {
        mesasFiltradas.forEach((mesa) => novo.add(mesa.id));
      }
      return novo;
    });
  }

  async function handleCriarMesa(valor: string) {
    if (!staff) return;
    const interpretado = interpretarNomeOuNumero(valor);
    const numero = interpretado.number ?? proximoNumeroSugerido;
    if (tables.some((mesa) => mesa.number === numero)) {
      throw new Error('Já existe uma mesa com esse número.');
    }
    const novaMesa = await createTable(staff.restaurant_id, numero, interpretado.name);
    setTables((atual) => [...atual, novaMesa].sort((a, b) => a.number - b.number));
    mostrarAviso(`${nomeMesa(novaMesa)} criada.`);
  }

  async function handleSalvarNome(nome: string | null) {
    if (!mesaRenomeando) return;
    await updateTableName(mesaRenomeando.id, nome);
    const idAlvo = mesaRenomeando.id;
    setTables((atual) => atual.map((item) => (item.id === idAlvo ? { ...item, name: nome } : item)));
  }

  async function handleToggleQrAtivo(mesa: RestaurantTable) {
    const novoValor = !mesa.qr_active;
    try {
      await setTableQrActive(mesa.id, novoValor);
      setTables((atual) => atual.map((item) => (item.id === mesa.id ? { ...item, qr_active: novoValor } : item)));
      mostrarAviso(novoValor ? `QR da ${nomeMesa(mesa)} ativado.` : `QR da ${nomeMesa(mesa)} desativado.`);
    } catch (err) {
      console.error(err);
      mostrarAviso('Não foi possível atualizar o QR.');
    }
  }

  async function handleConfirmarRegenerar() {
    if (!mesaRegenerando) return;
    setRegenerandoAtivo(true);
    setErroRegenerar(null);
    try {
      const atualizada = await regenerateTableSlug(mesaRegenerando.id);
      setTables((atual) => atual.map((item) => (item.id === atualizada.id ? atualizada : item)));
      mostrarAviso(`Novo QR gerado para a ${nomeMesa(atualizada)}.`);
      setMesaRegenerando(null);
    } catch (err) {
      console.error(err);
      setErroRegenerar('Não foi possível regenerar o QR.');
    } finally {
      setRegenerandoAtivo(false);
    }
  }

  async function handleConfirmarExcluir() {
    if (!mesaExcluindo) return;
    setExcluindoAtivo(true);
    setErroExcluir(null);
    try {
      await deleteTable(mesaExcluindo.id);
      const idAlvo = mesaExcluindo.id;
      setTables((atual) => atual.filter((item) => item.id !== idAlvo));
      setSelecionadas((atual) => {
        const novo = new Set(atual);
        novo.delete(idAlvo);
        return novo;
      });
      setMesaExcluindo(null);
    } catch (err) {
      setErroExcluir(
        (err as { code?: string })?.code === '23503'
          ? 'Essa mesa já tem histórico de atendimentos e não pode ser excluída.'
          : 'Não foi possível excluir a mesa.'
      );
    } finally {
      setExcluindoAtivo(false);
    }
  }

  /**
   * Botão de teste: fecha todas as sessões abertas de uma vez, ignorando
   * saldo pendente — não passa pelo fluxo normal de pagamento, só reseta o
   * salão pra continuar testando. Some com a barra de seleção junto.
   */
  async function handleConfirmarFecharTodas() {
    if (sessoesAbertas.length === 0) return;
    setFechandoTodasAtivo(true);
    setErroFecharTodas(null);
    try {
      await closeSessions(sessoesAbertas.map((sessao) => sessao.id));
      setSessoesAbertas([]);
      setSelecionadas(new Set());
      setModalFecharTodasAberto(false);
      mostrarAviso('Todas as mesas foram fechadas.');
    } catch (err) {
      console.error(err);
      setErroFecharTodas('Não foi possível fechar as mesas.');
    } finally {
      setFechandoTodasAtivo(false);
    }
  }

  async function handleCopiarLink(mesa: RestaurantTable) {
    await navigator.clipboard.writeText(linkMesa(mesa, origin));
    mostrarAviso('Link copiado!');
  }

  async function handleBaixarQRUnico(mesa: RestaurantTable) {
    const imagem = await gerarImagemQR(linkMesa(mesa, origin));
    baixarDataUrl(imagem, nomeArquivoQR(mesa));
  }

  async function handleBaixarQRsSelecionadas() {
    setProcessandoLote(true);
    try {
      await baixarQRsEmLote(mesasSelecionadas, origin);
    } finally {
      setProcessandoLote(false);
    }
  }

  async function handleGerarPDFSelecionadas() {
    setProcessandoLote(true);
    try {
      await gerarPDFImpressao(mesasSelecionadas, origin, restaurantName ?? 'QRConta');
    } finally {
      setProcessandoLote(false);
    }
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
        <button
          type="button"
          onClick={() => router.push('/admin')}
          className="mb-4 flex items-center gap-1.5 text-sm font-medium text-black/50 transition-colors hover:text-black"
        >
          ← Mesas
        </button>

        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-[28px] font-semibold tracking-tight text-[#111827]">Gerenciar mesas</h1>
            <p className="mt-1 text-sm text-black/45">Cadastre, organize e gerencie o acesso digital das mesas do salão.</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {openTableIds.size > 0 && (
              <button
                type="button"
                onClick={() => setModalFecharTodasAberto(true)}
                className="h-10 rounded-lg border border-[#851619]/25 px-4 text-sm font-medium text-[#851619] transition-colors hover:bg-[#851619]/8"
                title="Fecha todas as mesas de uma vez, ignorando o valor pendente — só para testes."
              >
                Fechar todas (teste)
              </button>
            )}
            <button
              type="button"
              onClick={() => setModalNovaMesaAberta(true)}
              className="h-10 rounded-lg bg-[#851619] px-4 text-sm font-semibold text-white transition-colors hover:brightness-110"
            >
              + Nova mesa
            </button>
          </div>
        </div>

        <p className="mb-6 mt-3 text-sm text-black/40">
          {tables.length} {tables.length === 1 ? 'mesa cadastrada' : 'mesas cadastradas'} • {openTableIds.size} ocupadas •{' '}
          {tables.length - openTableIds.size} livres
        </p>

        {erro && <p className="mb-4 text-xs text-[#851619]">{erro}</p>}

        <BarraFerramentas busca={busca} onBuscaChange={setBusca} filtro={filtroStatus} onFiltroChange={setFiltroStatus} />

        <BarraSelecao
          quantidade={selecionadas.size}
          processando={processandoLote}
          onBaixarQRs={handleBaixarQRsSelecionadas}
          onGerarPDF={handleGerarPDFSelecionadas}
          onDesmarcar={() => setSelecionadas(new Set())}
        />

        <div className="rounded-xl border border-black/[0.06] bg-white">
          {tables.length > 0 && (
            <div className="flex items-center gap-4 border-b border-black/[0.05] px-5 py-2.5">
              <input
                type="checkbox"
                checked={todasVisiveisSelecionadas}
                onChange={toggleSelecionarTodasVisiveis}
                aria-label="Selecionar todas as mesas visíveis"
                className="size-4 shrink-0 rounded border-black/25 text-[#851619] accent-[#851619]"
              />
              <span className="text-xs font-medium text-black/35">Mesa</span>
            </div>
          )}

          {tables.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-black/40">Nenhuma mesa cadastrada ainda.</p>
          ) : mesasFiltradas.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-black/40">Nenhuma mesa encontrada.</p>
          ) : (
            mesasFiltradas.map((mesa) => (
              <LinhaMesa
                key={mesa.id}
                mesa={mesa}
                ocupada={openTableIds.has(mesa.id)}
                selecionada={selecionadas.has(mesa.id)}
                onToggleSelecionada={() => toggleSelecionada(mesa.id)}
                onVerQR={() => setMesaVerQR(mesa)}
                onRenomear={() => setMesaRenomeando(mesa)}
                onCopiarLink={() => handleCopiarLink(mesa)}
                onBaixarQR={() => handleBaixarQRUnico(mesa)}
                onRegenerarQR={() => setMesaRegenerando(mesa)}
                onToggleQrAtivo={() => handleToggleQrAtivo(mesa)}
                onExcluir={() => setMesaExcluindo(mesa)}
              />
            ))
          )}
        </div>
      </div>

      {modalNovaMesaAberta && (
        <ModalNovaMesa
          sugestao={`Mesa ${String(proximoNumeroSugerido).padStart(2, '0')}`}
          onFechar={() => setModalNovaMesaAberta(false)}
          onCriar={handleCriarMesa}
        />
      )}

      {mesaRenomeando && (
        <ModalRenomearMesa mesa={mesaRenomeando} onFechar={() => setMesaRenomeando(null)} onSalvar={handleSalvarNome} />
      )}

      {mesaVerQR && <ModalVerQR mesa={mesaVerQR} origin={origin} onFechar={() => setMesaVerQR(null)} />}

      {mesaRegenerando && (
        <ModalConfirmacao
          titulo={`Regenerar QR Code da ${nomeMesa(mesaRegenerando)}?`}
          descricao="O QR Code atual deixará de funcionar e um novo acesso será criado para esta mesa."
          textoConfirmar="Regenerar QR"
          confirmando={regenerandoAtivo}
          erro={erroRegenerar}
          onFechar={() => {
            setMesaRegenerando(null);
            setErroRegenerar(null);
          }}
          onConfirmar={handleConfirmarRegenerar}
        />
      )}

      {mesaExcluindo && (
        <ModalConfirmacao
          titulo={`Excluir ${nomeMesa(mesaExcluindo)}?`}
          descricao="O QR Code será invalidado e a mesa deixará de aparecer no salão."
          textoConfirmar="Excluir mesa"
          confirmando={excluindoAtivo}
          erro={erroExcluir}
          onFechar={() => {
            setMesaExcluindo(null);
            setErroExcluir(null);
          }}
          onConfirmar={handleConfirmarExcluir}
        />
      )}

      {modalFecharTodasAberto && (
        <ModalConfirmacao
          titulo="Fechar todas as mesas?"
          descricao={`${sessoesAbertas.length} ${sessoesAbertas.length === 1 ? 'mesa será fechada' : 'mesas serão fechadas'} imediatamente, independente do valor em aberto. Use só para resetar o salão durante testes.`}
          textoConfirmar="Fechar todas"
          confirmando={fechandoTodasAtivo}
          erro={erroFecharTodas}
          onFechar={() => {
            setModalFecharTodasAberto(false);
            setErroFecharTodas(null);
          }}
          onConfirmar={handleConfirmarFecharTodas}
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
