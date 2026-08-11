/**
 * Geração do payload BR Code (Pix "copia e cola") conforme padrão EMV-QRCPS/MPM.
 *
 * Referência: Manual BR Code do Banco Central do Brasil
 * https://www.bcb.gov.br/content/estabilidadefinanceira/spb_docs/ManualBRCode.pdf
 *
 * Ver documentação do algoritmo em fluxo-cliente.md, seção "BRCode — geração do payload".
 */

export interface GerarBRCodeParams {
  /** Chave Pix do restaurante (CPF, CNPJ, e-mail, telefone ou chave aleatória) */
  chavePix: string;
  /** Nome do recebedor (restaurante). Truncado para 25 caracteres. */
  nomeRestaurante: string;
  /** Cidade do recebedor. Truncada para 15 caracteres. */
  cidadeRestaurante: string;
  /** Valor da cobrança em reais, ex: 54.30 */
  valor: number;
  /** Identificador da cobrança (txid), usado para conciliar com pix_charges.txid */
  txid: string;
}

/** Monta um campo TLV: ID (2 dígitos) + Tamanho (2 dígitos) + Valor */
function tlv(id: string, valor: string): string {
  const tamanho = valor.length.toString().padStart(2, '0');
  return `${id}${tamanho}${valor}`;
}

/** Remove acentos e caracteres não suportados pelo padrão EMV (apenas texto simples) */
function sanitizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^A-Za-z0-9 ]/g, '') // mantém apenas alfanumérico e espaço
    .toUpperCase();
}

function truncar(texto: string, tamanho: number): string {
  return texto.slice(0, tamanho);
}

function formatarValor(valor: number): string {
  if (valor <= 0) {
    throw new Error('Valor da cobrança deve ser maior que zero');
  }
  return valor.toFixed(2);
}

/**
 * Calcula o CRC16-CCITT-FFFF (polinômio 0x1021, valor inicial 0xFFFF)
 * sobre a string informada, retornando 4 caracteres hexadecimais maiúsculos.
 */
function crc16CcittFFFF(payload: string): string {
  let crc = 0xffff;
  const polinomio = 0x1021;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polinomio) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Gera o payload BR Code (Pix copia e cola) para uma cobrança dinâmica de uso único.
 */
export function gerarBRCode({
  chavePix,
  nomeRestaurante,
  cidadeRestaurante,
  valor,
  txid,
}: GerarBRCodeParams): string {
  if (!chavePix) throw new Error('chavePix é obrigatório');
  if (!txid) throw new Error('txid é obrigatório');

  const nome = sanitizar(truncar(nomeRestaurante, 25)) || 'RESTAURANTE';
  const cidade = sanitizar(truncar(cidadeRestaurante, 15)) || 'CIDADE';
  // txid no campo 05 do template 62 deve ser alfanumérico, até 25 caracteres
  const txidSanitizado = truncar(txid.replace(/[^A-Za-z0-9]/g, ''), 25);

  let payload = '';
  payload += tlv('00', '01'); // Payload Format Indicator
  payload += tlv('01', '12'); // Point of Initiation Method: QR de uso único (cobrança dinâmica)
  payload += tlv(
    '26',
    tlv('00', 'BR.GOV.BCB.PIX') + tlv('01', chavePix)
  ); // Merchant Account Information - Pix
  payload += tlv('52', '0000'); // Merchant Category Code (não informado)
  payload += tlv('53', '986'); // Transaction Currency: BRL
  payload += tlv('54', formatarValor(valor)); // Transaction Amount
  payload += tlv('58', 'BR'); // Country Code
  payload += tlv('59', nome); // Merchant Name
  payload += tlv('60', cidade); // Merchant City
  payload += tlv('62', tlv('05', txidSanitizado)); // Additional Data Field Template (txid)

  // Campo 63 (CRC16): o ID+tamanho ("6304") entram no cálculo, o valor não
  const payloadParaCrc = `${payload}6304`;
  const crc = crc16CcittFFFF(payloadParaCrc);
  payload += `6304${crc}`;

  return payload;
}
