'use client';

interface BarraSelecaoProps {
  quantidade: number;
  processando: boolean;
  onBaixarQRs: () => void;
  onGerarPDF: () => void;
  onDesmarcar: () => void;
}

export function BarraSelecao({ quantidade, processando, onBaixarQRs, onGerarPDF, onDesmarcar }: BarraSelecaoProps) {
  if (quantidade === 0) return null;

  return (
    <div className="mb-4 flex items-center justify-between rounded-xl border border-[#851619]/15 bg-[#851619]/[0.04] px-4 py-2.5">
      <p className="text-sm font-medium text-[#851619]">
        {quantidade} {quantidade === 1 ? 'mesa selecionada' : 'mesas selecionadas'}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBaixarQRs}
          disabled={processando}
          className="rounded-lg border border-black/[0.1] bg-white px-3 py-1.5 text-xs font-medium text-black/65 transition-colors hover:border-black/20 disabled:opacity-50"
        >
          Baixar QRs
        </button>
        <button
          type="button"
          onClick={onGerarPDF}
          disabled={processando}
          className="rounded-lg border border-black/[0.1] bg-white px-3 py-1.5 text-xs font-medium text-black/65 transition-colors hover:border-black/20 disabled:opacity-50"
        >
          Gerar PDF
        </button>
        <button
          type="button"
          onClick={onDesmarcar}
          className="px-2 text-xs font-medium text-black/45 transition-colors hover:text-black/70"
        >
          Desmarcar
        </button>
      </div>
    </div>
  );
}
