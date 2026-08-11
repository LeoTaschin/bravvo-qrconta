import QRCode from 'qrcode';

/**
 * Gera a imagem do QR Code (data URL PNG) a partir do payload BRCode ("Pix copia e cola").
 * O conteúdo relevante está todo no payload — a imagem é só a representação visual dele.
 */
export async function gerarImagemQR(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 512,
  });
}
