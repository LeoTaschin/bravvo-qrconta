# Fluxo Cliente — QRConta (Bravvo conta)

Documentação do fluxo desenhado no Figma:
https://www.figma.com/design/MICUl7aTi5uTKioOWGmb0h/QRConta---Fluxo-e-Telas

> Este documento apenas registra o que já está desenhado no Figma. Decisões de escopo (métodos de pagamento habilitados, divisão de conta, etc.) ainda serão discutidas separadamente.

## Visão geral

Cliente escaneia o QR na mesa → vê a conta em tempo real → escolhe pagar tudo ou dividir → escolhe método de pagamento → confirma.

## Telas

### 1. Carregando conta...
Tela de loading inicial ao escanear o QR. Logo + texto "Carregando conta...".

### 2. Conta da mesa (tela principal)
- Header: "Mesa 43" + barra de progresso visual (quanto já foi pago da conta)
- "Falta pagar: R$232,99"
- Lista de itens consumidos, cada um com indicador numérico (quantidade), nome do item e preço:
  - Pizza castelões pequena — R$99,99
  - Rotolinas — R$29,90 (unit.) / R$59,80 (total)
  - Coca-cola lata — R$4,90 (unit.) / R$14,70 (total)
  - Pizza pistache — R$59,99
- Botão: **"Pagar ou dividir conta"**

### 3. Modal "Pagar sua conta"
Duas opções:
- **Dividir conta**
- **Pagar conta cheia**

### 4. Modal (sub-fluxo de divisão)
Ao escolher "Dividir conta", duas opções:
- **Selecionar itens**
- **Dividir igualmente**

### 5. Tela "Dividir igualmente"
- Círculo central mostrando o total da mesa (R$232,99)
- Contador "Pagando para [X] pessoa(s)" (+/-)
- Contador "No total de [X] na mesa" (+/-)
- Cálculo automático: "Seu total é: R$54,30" (total ÷ pessoas)
- Botão **Confirmar**

### 6. Tela "Pagar seus itens" (seleção item a item)
- Lista de itens da mesa, cada um com botão "+" para adicionar à sua seleção
- Cálculo dinâmico: "Seu total é: R$..."
- Botão **Confirmar**

### 7. Tela de Pagamento
- Resumo: Total + **Taxa da plataforma** (ex: R$2,99) + Total final (ex: R$235,98)
- Métodos de pagamento exibidos:
  - **Apple Pay**
  - **Cartão de crédito** (ícones Visa/Mastercard)
  - **PIX**
- Botão **Confirmar**

## Decisões de escopo (MVP)

- **Métodos de pagamento**: só **Pix** ativo no MVP. Apple Pay e Cartão de crédito ficam desenhados na tela mas desabilitados ("em breve") — ativar exigiria gateway de verdade (processamento real), que é fase 2. Não trava o MVP.
- **Pagamento**: sem gateway/PSP/processamento próprio. O BRCode é **montado diretamente pela aplicação** (payload EMV-QRCPS/MPM, padrão aberto do Bacen), usando apenas a **chave Pix do restaurante** — não depende de API de banco nem de PSP para gerar a cobrança. O dinheiro cai direto na conta Pix do restaurante; a Bravvo nunca movimenta o valor. Detalhes do algoritmo na seção [BRCode — geração do payload](#brcode--geração-do-payload) abaixo.
- **Taxa da plataforma**: **desativada por enquanto**. Como o dinheiro vai 100% cliente→Pix do restaurante (Bravvo nunca movimenta o valor), não há cobrança de comissão nessa fase. O campo "Taxa da plataforma" fica oculto na tela de pagamento (ou R$0,00) — reavaliar monetização futuramente (ex: assinatura mensal do restaurante).
- **Lançamento de itens**: manual, feito por você, sem integração com PDV por enquanto.
- **Multi-tenant**: arquitetura já pensada para múltiplos restaurantes, mas validação inicial com apenas 1 restaurante piloto.

## Modelo de dados

```sql
-- Mesa física do restaurante (fixa, QR impresso nela)
create table tables (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null,
  number int not null,
  qr_slug text unique not null  -- identifica a mesa, não a sessão
);

-- Sessão de atendimento (abre no primeiro pedido, fecha quando conta é 100% paga)
create table table_sessions (
  id uuid primary key default gen_random_uuid(),
  table_id uuid references tables(id),
  status text not null default 'open', -- open | closed
  session_token uuid not null default gen_random_uuid(), -- vai na URL/QR da sessão atual
  opened_at timestamptz default now(),
  closed_at timestamptz
);

-- Itens lançados manualmente na comanda
create table session_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references table_sessions(id),
  name text not null,
  quantity int not null default 1,
  unit_price numeric(10,2) not null,
  status text not null default 'unpaid', -- unpaid | reserved | paid
  reserved_by_charge_id uuid references pix_charges(id),
  created_at timestamptz default now()
);

-- Cobrança Pix (BRCode) — pode ser da conta cheia, de uma divisão igual, ou de itens selecionados
create table pix_charges (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references table_sessions(id),
  charge_type text not null default 'full', -- full | equal_split | items
  people_paying int,   -- só para equal_split (ex: 1)
  people_total int,    -- só para equal_split (ex: 4)
  txid text unique not null,        -- id da cobrança no PSP
  amount numeric(10,2) not null,
  brcode text not null,             -- payload copia-e-cola / QR
  status text not null default 'pending', -- pending | paid | expired
  created_at timestamptz default now(),
  paid_at timestamptz
);

-- Liga uma cobrança "por itens" aos itens específicos escolhidos
create table pix_charge_items (
  pix_charge_id uuid references pix_charges(id),
  session_item_id uuid references session_items(id),
  primary key (pix_charge_id, session_item_id)
);
```

### Como cada fluxo de pagamento usa o modelo

- **Pagar conta cheia** → 1 `pix_charge` (`charge_type=full`) com o total da sessão. Ao confirmar pagamento, todos os `session_items` viram `paid`.
- **Dividir igualmente** → cada pessoa gera seu próprio `pix_charge` (`charge_type=equal_split`, `people_paying=1`, `people_total=4`, valor = total ÷ pessoas). Não altera status de itens individuais.
- **Selecionar itens** → itens escolhidos viram `reserved` e ficam amarrados ao `pix_charge` (`charge_type=items`) via `pix_charge_items`, travando-os para outros clientes. Se o Pix expira sem pagamento, itens voltam a `unpaid`. Se paga, viram `paid`.

### Cálculo do "Falta pagar" (barra de progresso no topo)

```
falta_pagar = total_sessao
  - soma(session_items com status = 'paid')
  - soma(pix_charges com charge_type = 'equal_split' e status = 'paid')
```

### Observação para o MVP manual

Como o lançamento de itens é manual e não há concorrência real entre garçons, a lógica de "reserva" de item pode ser simples (sem lock pesado) — mas precisa de expiração automática da reserva caso o Pix não seja pago em alguns minutos, para não travar um item indefinidamente se o cliente desistir.

### Expiração da reserva de itens

**Decisão**: `pix_charges` com status `pending` ou `pending_confirmation` expiram após **15 minutos** sem confirmação manual.

Motivo do valor: curto o suficiente para não travar um item por muito tempo se o cliente desistir de pagar, mas longo o suficiente para você conseguir conferir o extrato do restaurante com calma (principalmente em horário de pico, com várias mesas simultâneas).

Comportamento ao expirar:
- `pix_charges.status` vira `expired`
- `session_items` que estavam `reserved` (ligados a essa cobrança) voltam para `unpaid`, liberando o item para qualquer cliente gerar uma nova cobrança (inclusive a mesma pessoa, se tentar de novo)
- **Exceção operacional**: se você for confirmar manualmente um pagamento e perceber que a cobrança já expirou (ex: atraso seu na conferência, mas o dinheiro realmente caiu), o sistema deve permitir confirmar mesmo assim — a expiração bloqueia novas tentativas automáticas do cliente, mas não deve te impedir de validar um pagamento real que chegou atrasado

## BRCode — geração do payload

Fonte: [Manual BR Code do Banco Central (EMV-QRCPS/MPM)](https://www.bcb.gov.br/content/estabilidadefinanceira/spb_docs/ManualBRCode.pdf).

O BRCode é um **padrão aberto** de codificação de texto (EMV® QR Code Specification for Payment Systems, modo *Merchant Presented Mode*). Não é uma API — é uma string estruturada em blocos `ID + Tamanho + Valor` (TLV), que qualquer aplicação pode montar sozinha desde que siga a especificação. Não é necessário PSP/gateway para **gerar** o QR; só é preciso ter a chave Pix do recebedor (o restaurante).

### Estrutura dos campos (raiz do payload)

| ID | Campo | Obrigatório | Conteúdo |
|----|-------|:---:|----------|
| 00 | Payload Format Indicator | Sim | Fixo `"01"` |
| 01 | Point of Initiation Method | Não | `"11"` = QR reutilizável / `"12"` = QR de uso único |
| 26 | Merchant Account Information – Pix | Sim | Sub-bloco: `00` = GUI `"BR.GOV.BCB.PIX"`, `01` = chave Pix do restaurante, `02` = descrição opcional |
| 52 | Merchant Category Code | Sim | `"0000"` (não informado) |
| 53 | Transaction Currency | Sim | `"986"` (BRL) |
| 54 | Transaction Amount | Não* | Valor da cobrança, ex: `"54.30"` (*obrigatório no nosso caso, cobrança sempre tem valor fechado) |
| 58 | Country Code | Sim | `"BR"` |
| 59 | Merchant Name | Sim | Nome do restaurante (máx. 25 caracteres) |
| 60 | Merchant City | Sim | Cidade do restaurante (máx. 15 caracteres) |
| 62 | Additional Data Field Template | Sim | Sub-bloco `05` = `txid` (identificador da cobrança, usado para conciliar o pagamento com a `pix_charge` no nosso banco) |
| 63 | CRC16 | Sim | Checksum calculado sobre o payload inteiro (ver abaixo) |

### Algoritmo de montagem

```
função gerarBRCode(chavePix, nomeRestaurante, cidadeRestaurante, valor, txid):
    payload = ""
    payload += tlv("00", "01")                                   # Payload Format Indicator
    payload += tlv("01", "12")                                   # QR de uso único (cobrança dinâmica)
    payload += tlv("26",
                    tlv("00", "BR.GOV.BCB.PIX") +
                    tlv("01", chavePix))                          # Merchant Account Info - Pix
    payload += tlv("52", "0000")                                  # Category code
    payload += tlv("53", "986")                                   # Moeda BRL
    payload += tlv("54", formatarValor(valor))                    # Valor (ex: "54.30")
    payload += tlv("58", "BR")                                    # País
    payload += tlv("59", truncar(nomeRestaurante, 25))            # Nome do recebedor
    payload += tlv("60", truncar(cidadeRestaurante, 15))          # Cidade
    payload += tlv("62", tlv("05", txid))                         # txid (conciliação)
    payload += "6304"                                             # ID+tamanho do CRC (fixo)
    crc = crc16_ccitt_ffff(payload)                                # calculado sobre payload + "6304"
    payload += crc  # 4 caracteres hex maiúsculos

    retorna payload

função tlv(id, valor):
    tamanho = tamanho(valor) formatado com 2 dígitos (ex: "05", "14", "58")
    retorna id + tamanho + valor
```

### Cálculo do CRC16 (checksum final, campo 63)

- Polinômio: `0x1021`
- Valor inicial: `0xFFFF`
- Variante: CRC-16-CCITT-FFFF
- Calculado sobre o payload inteiro **até e incluindo** `"6304"` (o ID e tamanho do próprio campo do CRC, mas sem o valor)
- Resultado formatado como 4 caracteres hexadecimais maiúsculos (ex: `AD38`)

### O QR visual

O payload final (string de texto, ex: 200-300 caracteres) é o que se chama de **"Pix copia e cola"**. Para exibir como QR Code na tela, basta codificar essa string em uma imagem QR padrão (qualquer lib de QR code, ex: `qrcode` no Node/Python) — não tem nada de especial na geração da imagem, a "mágica" toda está no conteúdo do payload.

### Confirmação de pagamento: manual (MVP)

Gerar o payload é responsabilidade só da aplicação, mas **confirmar que o Pix foi pago é outra etapa** — quem sabe se o dinheiro caiu é o banco/instituição do restaurante, não o BRCode em si.

**Decisão**: confirmação **manual**, no mesmo espírito do lançamento de itens (controle manual do piloto, sem integração bancária). Fluxo:

1. Cliente escaneia/copia o BRCode e paga pelo app do banco dele
2. Cliente aperta **"Já paguei"** na tela → `pix_charges.status` vira `pending_confirmation` (aguardando conferência)
3. Você/operador confere no extrato Pix do restaurante que o valor caiu (bate com o `txid` ou valor exibido)
4. Você confirma manualmente no sistema (ex: painel simples ou update direto) → `pix_charges.status` vira `paid`, `paid_at` preenchido → os `session_items` relacionados são baixados conforme a lógica já definida (ver seção "Como cada fluxo de pagamento usa o modelo")

Ajuste no modelo: o status de `pix_charges` passa a ter um estágio intermediário:
```
pending → pending_confirmation → paid
                                → expired (se cliente não confirma / você não valida)
```

Isso evita marcar como pago automaticamente por qualquer clique de "já paguei" (que poderia ser falso/engano) — o pagamento só é dado como concluído depois da sua conferência manual, igual ao controle que você já quer ter sobre os itens lançados.

**Trade-off consciente**: como não há automação, existe janela de erro humano (esquecer de conferir, confundir valores) e não escala para múltiplos restaurantes sem operação dedicada — mas é adequado para validar o piloto agora. Migrar para confirmação automática (webhook via PSP/Open Finance) fica marcado como melhoria de fase 2.

## Próximos pontos em aberto

- Fase 2: confirmação automática de pagamento (webhook Pix via PSP/Open Finance)
- Fase 2: avaliar gateway real para habilitar Cartão de crédito e Apple Pay
- Fase 2: reavaliar monetização da plataforma (já que taxa está off no MVP)
