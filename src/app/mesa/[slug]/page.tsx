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
  dividirItemDaComanda,
  marcarComoPago,
} from '@/lib/supabase/queries';
import { calcularDivisaoIgual, calcularFaltaPagar, itensDisponiveis } from '@/lib/conta';
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

import { MolduraTelefone } from '@/components/conta-mesa/MolduraTelefone';
import { TelaCarregando } from '@/components/conta-mesa/TelaCarregando';
import { ContaMesaPrincipal } from '@/components/conta-mesa/ContaMesaPrincipal';
import { ModalPagarConta } from '@/components/conta-mesa/ModalPagarConta';
import { TelaDividirIgualmente } from '@/components/conta-mesa/TelaDividirIgualmente';
import { TelaPagarItens } from '@/components/conta-mesa/TelaPagarItens';
import { TelaPagamento } from '@/components/conta-mesa/TelaPagamento';
import { TelaQRCode } from '@/components/conta-mesa/TelaQRCode';

type Passo =
  | 'principal'
  | 'modal-pagar-conta'
  | 'dividir-igualmente'
  | 'pagar-itens'
  | 'pagamento'
  | 'qrcode';

interface CobrancaPendente {
  chargeType: ChargeType;
  amount: number;
  peoplePaying?: number;
  peopleTotal?: number;
  /** Quantas unidades de cada linha da comanda esta cobrança leva. */
  itensEscolhidos?: Array<{ id: string; quantidade: number }>;
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
  /** id da linha da comanda -> quantas unidades dela o cliente escolheu. */
  const [selecionados, setSelecionados] = useState<Map<string, number>>(new Map());
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
    const { seuTotal } = calcularDivisaoIgual(faltaPagar, peoplePaying, peopleTotal);
    setPendente({ chargeType: 'equal_split', amount: seuTotal, peoplePaying, peopleTotal });
    setPasso('pagamento');
  }

  function confirmarPagarItens() {
    const itensEscolhidos = Array.from(selecionados, ([id, quantidade]) => ({ id, quantidade }));
    const valor = itensEscolhidos.reduce((acc, escolha) => {
      const item = itens.find((i) => i.id === escolha.id);
      return item ? acc + item.unit_price * escolha.quantidade : acc;
    }, 0);
    setPendente({ chargeType: 'items', amount: valor, itensEscolhidos });
    setPasso('pagamento');
  }

  function selecionarTodosOsItens() {
    setSelecionados(new Map(disponiveis.map((item) => [item.id, item.quantity])));
  }

  function definirQuantidadeSelecionada(itemId: string, quantidade: number) {
    setSelecionados((atual) => {
      const novo = new Map(atual);
      if (quantidade <= 0) {
        novo.delete(itemId);
      } else {
        novo.set(itemId, quantidade);
      }
      return novo;
    });
  }

  async function confirmarPagamento() {
    if (!pendente || !session || !restaurant || gerando) return;
    setGerando(true);
    setErroCobranca(null);

    try {
      // Quem escolheu só parte das unidades de uma linha ("1 das 3 águas")
      // precisa dela separada antes da reserva, que é sempre por linha inteira.
      // Se a cobrança falhar depois disso, a comanda fica com duas linhas do
      // mesmo produto — o total da mesa não muda, então é inofensivo.
      const itemIds = pendente.itensEscolhidos
        ? await Promise.all(
            pendente.itensEscolhidos.map(async ({ id, quantidade }) => {
              const item = itens.find((i) => i.id === id);
              return item && quantidade < item.quantity
                ? dividirItemDaComanda(id, quantidade)
                : id;
            })
          )
        : undefined;

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
        itemIds,
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

  /**
   * A seta de voltar da tela de itens desfaz um passo só — quem entrou ali
   * errando a opção quer trocar de forma de pagamento, não sair do fluxo.
   */
  function voltarParaEscolha() {
    setSelecionados(new Map());
    setPasso('modal-pagar-conta');
  }

  function voltarParaPrincipal() {
    setPasso('principal');
    setPendente(null);
    setSelecionados(new Map());
    setCobrancaAtual(null);
    setQrImageAtual(null);
    setErroCobranca(null);
  }

  if (carregando) {
    return (
      <MolduraTelefone>
        <TelaCarregando />
      </MolduraTelefone>
    );
  }

  if (erro || !table || !session) {
    return (
      <MolduraTelefone>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#f3f3f3] px-8 text-center">
          <p className="text-base text-black">{erro ?? 'Algo deu errado.'}</p>
        </div>
      </MolduraTelefone>
    );
  }

  return (
    <MolduraTelefone>
      <ContaMesaPrincipal
        nomeRestaurante={restaurant?.name ?? 'Restaurante'}
        numeroMesa={table.number}
        itens={itens}
        cobrancas={cobrancas}
        onPagarOuDividir={abrirPagarOuDividir}
      />

      {passo === 'modal-pagar-conta' && (
        <ModalPagarConta
          faltaPagar={faltaPagar}
          onClose={voltarParaPrincipal}
          onPagarContaCheia={pagarContaCheia}
          onDividirIgualmente={() => setPasso('dividir-igualmente')}
          onSelecionarItens={() => setPasso('pagar-itens')}
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
          itens={itens}
          faltaPagar={faltaPagar}
          selecionados={selecionados}
          onDefinirQuantidade={definirQuantidadeSelecionada}
          onSelecionarTodos={selecionarTodosOsItens}
          onLimparSelecao={() => setSelecionados(new Map())}
          onVoltar={voltarParaEscolha}
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
    </MolduraTelefone>
  );
}
