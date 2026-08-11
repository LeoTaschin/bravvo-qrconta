'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import {
  getTableBySlug,
  getRestaurant,
  getOrCreateOpenSession,
  getSessionItems,
  getSessionCharges,
  criarCobranca,
  marcarComoPago,
} from '@/lib/supabase/queries';
import { calcularFaltaPagar, itensDisponiveis, totalItem } from '@/lib/conta';
import { gerarBRCode } from '@/lib/pix/brcode';
import { gerarImagemQR } from '@/lib/pix/qrcode';
import type {
  ChargeType,
  PixCharge,
  Restaurant,
  RestaurantTable,
  SessionItem,
  TableSession,
} from '@/lib/supabase/types';

import { TelaCarregando } from '@/components/conta-mesa/TelaCarregando';
import { ContaMesaPrincipal } from '@/components/conta-mesa/ContaMesaPrincipal';
import { ModalPagarConta } from '@/components/conta-mesa/ModalPagarConta';
import { ModalDividirConta } from '@/components/conta-mesa/ModalDividirConta';
import { TelaDividirIgualmente } from '@/components/conta-mesa/TelaDividirIgualmente';
import { TelaPagarItens } from '@/components/conta-mesa/TelaPagarItens';
import { TelaPagamento } from '@/components/conta-mesa/TelaPagamento';
import { TelaQRCode } from '@/components/conta-mesa/TelaQRCode';

type Passo =
  | 'principal'
  | 'modal-pagar-conta'
  | 'modal-dividir-conta'
  | 'dividir-igualmente'
  | 'pagar-itens'
  | 'pagamento'
  | 'qrcode';

interface CobrancaPendente {
  chargeType: ChargeType;
  amount: number;
  peoplePaying?: number;
  peopleTotal?: number;
  itemIds?: string[];
}

export default function MesaPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [table, setTable] = useState<RestaurantTable | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [session, setSession] = useState<TableSession | null>(null);
  const [itens, setItens] = useState<SessionItem[]>([]);
  const [cobrancas, setCobrancas] = useState<PixCharge[]>([]);

  const [passo, setPasso] = useState<Passo>('principal');
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [peoplePaying, setPeoplePaying] = useState(1);
  const [peopleTotal, setPeopleTotal] = useState(2);
  const [pendente, setPendente] = useState<CobrancaPendente | null>(null);

  const [gerando, setGerando] = useState(false);
  const [erroCobranca, setErroCobranca] = useState<string | null>(null);
  const [cobrancaAtual, setCobrancaAtual] = useState<PixCharge | null>(null);
  const [qrImageAtual, setQrImageAtual] = useState<string | null>(null);

  const recarregarItensECobrancas = useCallback(async (sessionId: string) => {
    const [novosItens, novasCobrancas] = await Promise.all([
      getSessionItems(sessionId),
      getSessionCharges(sessionId),
    ]);
    setItens(novosItens);
    setCobrancas(novasCobrancas);
  }, []);

  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      try {
        const mesa = await getTableBySlug(slug);
        if (!mesa) {
          if (!cancelado) setErro('Mesa não encontrada. Confira o QR Code.');
          return;
        }
        const [rest, sessao] = await Promise.all([
          getRestaurant(mesa.restaurant_id),
          getOrCreateOpenSession(mesa.id),
        ]);
        if (cancelado) return;
        setTable(mesa);
        setRestaurant(rest);
        setSession(sessao);
        await recarregarItensECobrancas(sessao.id);
      } catch (e) {
        if (!cancelado) {
          console.error(e);
          setErro('Não foi possível carregar a conta da mesa. Tente novamente.');
        }
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }

    carregar();
    return () => {
      cancelado = true;
    };
  }, [slug, recarregarItensECobrancas]);

  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel(`sessao-${session.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'session_items', filter: `session_id=eq.${session.id}` },
        () => recarregarItensECobrancas(session.id)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pix_charges', filter: `session_id=eq.${session.id}` },
        () => recarregarItensECobrancas(session.id)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, recarregarItensECobrancas]);

  const faltaPagar = calcularFaltaPagar(itens, cobrancas);
  const disponiveis = itensDisponiveis(itens);

  function abrirPagarOuDividir() {
    setPasso('modal-pagar-conta');
  }

  function pagarContaCheia() {
    setPendente({ chargeType: 'full', amount: faltaPagar });
    setPasso('pagamento');
  }

  function confirmarDividirIgualmente() {
    const valor = peopleTotal > 0 ? Math.round(((faltaPagar / peopleTotal) * peoplePaying) * 100) / 100 : 0;
    setPendente({ chargeType: 'equal_split', amount: valor, peoplePaying, peopleTotal });
    setPasso('pagamento');
  }

  function confirmarPagarItens() {
    const selecionadosItens = itens.filter((item) => selecionados.has(item.id));
    const valor = selecionadosItens.reduce((acc, item) => acc + totalItem(item), 0);
    setPendente({
      chargeType: 'items',
      amount: valor,
      itemIds: Array.from(selecionados),
    });
    setPasso('pagamento');
  }

  function alternarSelecao(itemId: string) {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (novo.has(itemId)) {
        novo.delete(itemId);
      } else {
        novo.add(itemId);
      }
      return novo;
    });
  }

  async function confirmarPagamento() {
    if (!pendente || !session || !restaurant || gerando) return;
    setGerando(true);
    setErroCobranca(null);

    try {
      const txid = crypto.randomUUID().replace(/-/g, '').toUpperCase().slice(0, 25);
      const brcode = gerarBRCode({
        chavePix: restaurant.pix_key,
        nomeRestaurante: restaurant.name,
        cidadeRestaurante: restaurant.city,
        valor: pendente.amount,
        txid,
      });

      const cobranca = await criarCobranca({
        sessionId: session.id,
        chargeType: pendente.chargeType,
        amount: pendente.amount,
        txid,
        brcode,
        peoplePaying: pendente.peoplePaying,
        peopleTotal: pendente.peopleTotal,
        itemIds: pendente.itemIds,
      });

      const qrImage = await gerarImagemQR(brcode);

      setCobrancaAtual(cobranca);
      setQrImageAtual(qrImage);
      setPasso('qrcode');
      await recarregarItensECobrancas(session.id);
    } catch (e) {
      console.error(e);
      setErroCobranca(e instanceof Error ? e.message : 'Não foi possível gerar a cobrança. Tente novamente.');
    } finally {
      setGerando(false);
    }
  }

  async function jaPaguei() {
    if (!cobrancaAtual || !session) return;
    await marcarComoPago(cobrancaAtual.id);
    await recarregarItensECobrancas(session.id);
    setCobrancaAtual((atual) => (atual ? { ...atual, status: 'pending_confirmation' } : atual));
  }

  function voltarParaPrincipal() {
    setPasso('principal');
    setPendente(null);
    setSelecionados(new Set());
    setCobrancaAtual(null);
    setQrImageAtual(null);
    setErroCobranca(null);
  }

  if (carregando) return <TelaCarregando />;

  if (erro || !table || !session) {
    return (
      <div className="mx-auto flex min-h-screen max-w-[430px] flex-col items-center justify-center gap-3 bg-[#f3f3f3] px-8 text-center">
        <p className="text-base text-black">{erro ?? 'Algo deu errado.'}</p>
      </div>
    );
  }

  return (
    <>
      <ContaMesaPrincipal
        numeroMesa={table.number}
        itens={itens}
        cobrancas={cobrancas}
        onPagarOuDividir={abrirPagarOuDividir}
      />

      {passo === 'modal-pagar-conta' && (
        <ModalPagarConta
          onClose={voltarParaPrincipal}
          onDividirConta={() => setPasso('modal-dividir-conta')}
          onPagarContaCheia={pagarContaCheia}
        />
      )}

      {passo === 'modal-dividir-conta' && (
        <ModalDividirConta
          onClose={voltarParaPrincipal}
          onSelecionarItens={() => setPasso('pagar-itens')}
          onDividirIgualmente={() => setPasso('dividir-igualmente')}
        />
      )}

      {passo === 'dividir-igualmente' && (
        <TelaDividirIgualmente
          faltaPagar={faltaPagar}
          peoplePaying={peoplePaying}
          peopleTotal={peopleTotal}
          onChangePeoplePaying={setPeoplePaying}
          onChangePeopleTotal={setPeopleTotal}
          onClose={voltarParaPrincipal}
          onConfirmar={confirmarDividirIgualmente}
        />
      )}

      {passo === 'pagar-itens' && (
        <TelaPagarItens
          itens={disponiveis}
          selecionados={selecionados}
          onToggle={alternarSelecao}
          onClose={voltarParaPrincipal}
          onConfirmar={confirmarPagarItens}
        />
      )}

      {passo === 'pagamento' && pendente && (
        <TelaPagamento
          total={pendente.amount}
          gerando={gerando}
          erro={erroCobranca}
          onBack={voltarParaPrincipal}
          onConfirmar={confirmarPagamento}
        />
      )}

      {passo === 'qrcode' && cobrancaAtual && qrImageAtual && (
        <TelaQRCode
          brcode={cobrancaAtual.brcode}
          qrImage={qrImageAtual}
          amount={cobrancaAtual.amount}
          expiresAt={cobrancaAtual.expires_at}
          status={cobrancaAtual.status}
          onBack={voltarParaPrincipal}
          onJaPaguei={jaPaguei}
        />
      )}
    </>
  );
}
