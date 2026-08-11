'use client';

import { useEffect, useState } from 'react';
import { gerarImagemQR } from '@/lib/pix/qrcode';
import { nomeMesa } from '@/lib/mesas';
import { baixarDataUrl, linkMesa } from '@/lib/mesas-export';
import type { RestaurantTable } from '@/lib/supabase/types';
import { Modal } from '@/components/admin/Modal';

interface ModalVerQRProps {
  mesa: RestaurantTable;
  origin: string;
  onFechar: () => void;
}

export function ModalVerQR({ mesa, origin, onFechar }: ModalVerQRProps) {
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    let cancelado = false;
    gerarImagemQR(linkMesa(mesa, origin)).then((imagem) => {
      if (!cancelado) setQrImage(imagem);
    });
    return () => {
      cancelado = true;
    };
  }, [mesa, origin]);

  const link = linkMesa(mesa, origin);

  async function handleCopiar() {
    await navigator.clipboard.writeText(link);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  function handleBaixar() {
    if (!qrImage) return;
    baixarDataUrl(qrImage, `qrcode-${nomeMesa(mesa).toLowerCase().replace(/\s+/g, '-')}.png`);
  }

  return (
    <Modal titulo={nomeMesa(mesa)} onFechar={onFechar} largura="max-w-xs">
      <div className="flex flex-col items-center gap-4">
        <div className="flex size-48 items-center justify-center rounded-xl border border-black/[0.06] bg-[#f9f9f9] p-3">
          {qrImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrImage} alt={`QR Code da ${nomeMesa(mesa)}`} className="size-full" />
          ) : (
            <span className="text-xs text-black/35">Gerando QR...</span>
          )}
        </div>

        {!mesa.qr_active && (
          <p className="text-center text-xs font-medium text-[#851619]">
            QR desativado — o link não abre a conta até reativar.
          </p>
        )}

        <p className="text-center text-sm text-black/50">Escaneie para abrir a conta desta mesa.</p>
        <p className="break-all text-center text-xs text-black/40">{link}</p>

        <div className="flex w-full gap-2">
          <button
            type="button"
            onClick={handleCopiar}
            className="flex-1 rounded-lg border border-black/[0.1] py-2 text-sm font-medium text-black/70 transition-colors hover:bg-black/[0.03]"
          >
            {copiado ? 'Link copiado!' : 'Copiar link'}
          </button>
          <button
            type="button"
            onClick={handleBaixar}
            disabled={!qrImage}
            className="flex-1 rounded-lg bg-[#851619] py-2 text-sm font-medium text-white transition-colors hover:brightness-110 disabled:opacity-50"
          >
            Baixar QR
          </button>
        </div>
      </div>
    </Modal>
  );
}
