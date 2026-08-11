import { gerarImagemQR } from '@/lib/pix/qrcode';
import { nomeMesa } from '@/lib/mesas';
import type { RestaurantTable } from '@/lib/supabase/types';

export function linkMesa(mesa: RestaurantTable, origin: string): string {
  return `${origin}/mesa/${mesa.qr_slug}`;
}

function nomeArquivoQR(mesa: RestaurantTable): string {
  return `qrcode-${nomeMesa(mesa).toLowerCase().replace(/\s+/g, '-')}.png`;
}

export function baixarDataUrl(dataUrl: string, nomeArquivo: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Baixa o PNG do QR de cada mesa selecionada, um de cada vez (com um pequeno
 * intervalo entre eles pra não esbarrar no bloqueio de downloads múltiplos do
 * navegador). Ponto de partida simples; agrupar tudo num único .zip fica pra
 * uma próxima etapa.
 */
export async function baixarQRsEmLote(mesas: RestaurantTable[], origin: string): Promise<void> {
  for (const [indice, mesa] of mesas.entries()) {
    const imagem = await gerarImagemQR(linkMesa(mesa, origin));
    setTimeout(() => baixarDataUrl(imagem, nomeArquivoQR(mesa)), indice * 400);
  }
}

/**
 * Abre uma janela com uma "placa" por mesa selecionada, pronta pro fluxo
 * nativo de impressão do navegador (que também serve pra "Salvar como PDF").
 * Um kit de impressão mais elaborado (cortes, papel específico etc.) fica
 * pra uma próxima etapa — aqui já cobre o essencial: imprimir ou gerar PDF.
 */
export async function gerarPDFImpressao(
  mesas: RestaurantTable[],
  origin: string,
  restaurantName: string
): Promise<void> {
  const janela = window.open('', '_blank');
  if (!janela) return;

  const placas = await Promise.all(
    mesas.map(async (mesa) => ({ mesa, imagem: await gerarImagemQR(linkMesa(mesa, origin)) }))
  );

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Kit de impressão — ${restaurantName}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 24px; background: #fff; }
  .grade { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
  .placa { border: 1px solid #ddd; border-radius: 16px; padding: 24px; text-align: center; page-break-inside: avoid; }
  .restaurante { font-size: 11px; letter-spacing: 0.08em; color: #851619; font-weight: 700; text-transform: uppercase; margin: 0; }
  .mesa { margin: 6px 0 16px; font-size: 22px; font-weight: 700; color: #111827; }
  img { width: 200px; height: 200px; }
  .instrucao { margin-top: 16px; font-size: 12px; color: #666; }
  @media print { .placa { border-color: #eee; } }
</style>
</head>
<body>
  <div class="grade">
    ${placas
      .map(
        ({ mesa, imagem }) => `
      <div class="placa">
        <p class="restaurante">${restaurantName}</p>
        <p class="mesa">${nomeMesa(mesa)}</p>
        <img src="${imagem}" alt="QR Code" />
        <p class="instrucao">Escaneie para visualizar<br />e fechar sua conta</p>
      </div>`
      )
      .join('')}
  </div>
</body>
</html>`;

  janela.document.open();
  janela.document.write(html);
  janela.document.close();
  setTimeout(() => {
    janela.focus();
    janela.print();
  }, 300);
}
