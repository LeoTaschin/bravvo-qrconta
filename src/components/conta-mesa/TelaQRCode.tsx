'use client';

import { useState } from 'react';
import { TelaCheia } from './TelaCheia';
import { BotaoPrimario } from './BotaoPrimario';
import { formatarReal } from '@/lib/format';
import type { ChargeStatus } from '@/lib/supabase/types';

interface TelaQRCodeProps {
  brcode: string;
  qrImage: string;
  amount: number;
  expiresAt: string;
  status: ChargeStatus;
  onBack: () => void;
  onJaPaguei: () => void;
}

export function TelaQRCode({ brcode, qrImage, amount, expiresAt, status, onBack, onJaPaguei }: TelaQRCodeProps) {
  const [copiado, setCopiado] = useState(false);

  async function copiarCodigo() {
    await navigator.clipboard.writeText(brcode);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  const horaExpiracao = new Date(expiresAt).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <TelaCheia
      title="Pague com Pix"
      onBack={onBack}
      footer={
        status === 'pending' ? (
          <BotaoPrimario onClick={onJaPaguei}>Já paguei</BotaoPrimario>
        ) : (
          <div className="flex h-[50px] w-full items-center justify-center gap-2 rounded-[20px] bg-[#f3f3f3] text-sm text-[#595959]">
            <span className="size-2 rounded-full bg-[#851619] animate-pulse-soft" />
            Aguardando confirmação do restaurante...
          </div>
        )
      }
    >
      <div className="flex flex-col items-center gap-4">
        <p className="text-2xl font-semibold tracking-tight text-[#111827] tabular-nums">
          {formatarReal(amount)}
        </p>

        <div className="rounded-2xl border border-black/5 bg-white p-3 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrImage} alt="QR Code Pix" width={220} height={220} />
        </div>

        <p className="text-center text-sm text-black/55">
          Escaneie com o app do seu banco ou copie o código abaixo
        </p>

        <div className="w-full rounded-[14px] border border-black/10 bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <p className="break-all text-[11px] text-black/50">{brcode}</p>
        </div>

        <button
          type="button"
          onClick={copiarCodigo}
          className="h-[46px] w-full rounded-[20px] border-[1.5px] border-[#851619] text-sm font-medium text-[#851619] transition-all duration-150 hover:bg-[#851619]/5 active:scale-[0.98]"
        >
          {copiado ? 'Código copiado!' : 'Copiar código'}
        </button>

        <p className="text-center text-xs text-black/45">
          Expira às {horaExpiracao} — pague antes para garantir sua reserva
        </p>
      </div>
    </TelaCheia>
  );
}
