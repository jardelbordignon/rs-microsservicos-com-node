# SPEC — Processamento de Pagamentos no payments-service (Fake Gateway + Consumer + Consulta)

## Objetivo

Implementar o processamento de pagamento no `payments-service` a partir de mensagens do RabbitMQ publicadas pelo `checkout-service`, persistindo o resultado em PostgreSQL e expondo um endpoint de consulta do status do pagamento por `orderId`.

## Contexto

- O `payments-service` (porta 4003) já possui NestJS, PostgreSQL (porta 5433), TypeORM e integração com RabbitMQ.
- Existe um consumer (`PaymentConsumerService`) que consome mensagens da fila `payment_queue`, com retry e DLQ já configurados.
- O consumer já valida a mensagem `PaymentOrderMessage`, porém o “processamento real” ainda é um TODO (apenas logs).
- Existem endpoints existentes para DLQ (stats, reprocess, purge) e métricas (metrics, health, summary) que não devem ser alterados.
- O `checkout-service` publica mensagens ao finalizar um pedido.

## Escopo

### Em Escopo

- Persistência de pagamentos em PostgreSQL via uma entidade `Payment`.
- Implementação de um `FakePaymentGatewayService` determinístico para simular processamento.
- Implementação de um `PaymentsService` para orquestrar: criar pagamento pendente, chamar gateway fake, atualizar status e salvar.
- Concluir `PaymentConsumerService` para chamar o `PaymentsService.processPayment()` ao receber uma mensagem válida.
- Criar endpoint HTTP de consulta do status do pagamento por `orderId`.
- Expor health check em `GET /health`.

### Fora de Escopo (Não Fazer)

- Integração com gateway de pagamento real (Stripe, etc.).
- Webhook/callback para notificar `checkout-service` ou qualquer outro serviço.
- Alterar o `checkout-service` e/ou o formato de mensagem que ele publica.
- Alterar endpoints existentes de DLQ e métricas (podem ser mantidos e utilizados, mas não modificados).
- Adicionar autenticação/autorizações para as novas rotas (se necessário, será definido em outra SPEC).

## Contratos e Integração

### Mensagem consumida do RabbitMQ

O `payments-service` deve processar mensagens de pagamento provenientes do RabbitMQ, com o seguinte payload lógico:

`PaymentOrderMessage`:

- `orderId` (UUID)
- `userId` (UUID)
- `amount` (valor monetário com 2 casas decimais)
- `items[]`:
  - `productId` (UUID)
  - `quantity` (int)
  - `price` (valor unitário)
- `paymentMethod` (string)

Requisito de compatibilidade:

- O `payments-service` deve ser compatível com o formato efetivamente publicado pelo `checkout-service` no repositório (ex.: `amount` pode chegar como string numérica com 2 casas decimais).

## Requisitos Funcionais

### RF-01 — Entidade Payment

Deve existir uma entidade `Payment` persistida no PostgreSQL com os seguintes campos:

- `id`: UUID (PK)
- `orderId`: UUID (obrigatório)
- `userId`: UUID (obrigatório)
- `amount`: decimal(10,2) (obrigatório)
- `status`: enum (`pending`, `approved`, `rejected`) com default `pending`
- `paymentMethod`: varchar(50) (obrigatório)
- `transactionId`: varchar(255) (nullable)
- `rejectionReason`: varchar(255) (nullable)
- `processedAt`: timestamp (nullable)
- `createdAt`: timestamp (obrigatório)
- `updatedAt`: timestamp (obrigatório)

Regras de domínio associadas:

- Deve existir no máximo 1 `Payment` por `orderId`.
- `transactionId` deve existir quando `status` for `approved`.
- `rejectionReason` deve existir quando `status` for `rejected`.
- `processedAt` deve existir quando o pagamento tiver sido processado (aprovado ou rejeitado).

### RF-02 — FakePaymentGatewayService

Deve existir um serviço `FakePaymentGatewayService` que simula o processamento de pagamento, com:

- Latência simulada entre 500ms e 2s.
- Regras determinísticas:
  - Se `amount` > 10000, o pagamento deve ser rejeitado com `rejectionReason = "Limite excedido"`.
  - Se `amount` termina com `.99`, o pagamento deve ser rejeitado com `rejectionReason = "Cartão recusado pela operadora"`.
  - Caso contrário, o pagamento deve ser aprovado.
- Retorno do processamento:
  - `approved`: boolean
  - `transactionId`: string
  - `rejectionReason?`: string (apenas quando `approved` for `false`)

### RF-03 — PaymentsService (orquestração do processamento)

Deve existir um `PaymentsService` responsável por:

#### RF-03.1 — processPayment(message)

Ao receber um `PaymentOrderMessage`, deve:

1. Criar e persistir um `Payment` com:
   - `status = pending`
   - `orderId`, `userId`, `amount`, `paymentMethod` preenchidos a partir da mensagem
2. Chamar o `FakePaymentGatewayService` para obter o resultado do processamento
3. Atualizar e persistir o `Payment` com:
   - `status = approved` ou `rejected`
   - `transactionId`
   - `rejectionReason` quando rejeitado
   - `processedAt` preenchido quando finalizado
4. Retornar o `Payment` final (aprovado ou rejeitado)

Requisitos de idempotência:

- `processPayment` deve ser idempotente por `orderId`, evitando criar múltiplos pagamentos se a mesma mensagem for processada mais de uma vez (cenário típico de retry/redelivery).

#### RF-03.2 — findByOrderId(orderId)

- Deve buscar `Payment` por `orderId`.
- Deve retornar 404 quando não existir `Payment` para o `orderId` informado.

### RF-04 — Completar PaymentConsumerService

O `PaymentConsumerService` deve:

- Substituir o TODO atual pelo processamento real via `PaymentsService.processPayment(message)`.
- Manter a validação de mensagem existente (ou equivalente), garantindo que apenas mensagens válidas sejam processadas.
- Considerar o resultado `rejected` como um processamento válido (não deve disparar retry/DLQ apenas por rejeição).
- Apenas falhas inesperadas (ex.: indisponibilidade do DB, erro interno não tratado) devem resultar em erro re-lançado, permitindo que o mecanismo já existente trate retry/DLQ.

### RF-05 — PaymentsController (consulta)

Deve existir um controller HTTP para consulta:

- `GET /payments/:orderId`
  - Retorna o status do pagamento do pedido.
  - Quando existir, deve retornar pelo menos:
    - `orderId`, `userId`, `amount`, `status`, `paymentMethod`, `transactionId?`, `rejectionReason?`, `processedAt?`, `createdAt`, `updatedAt`
  - Quando não existir, deve retornar 404.

### RF-06 — Health check

Deve existir um endpoint:

- `GET /health`
  - Deve retornar 200 quando a aplicação estiver saudável.
  - Deve permitir validar, no mínimo, que o serviço está respondendo HTTP e pronto para operar.

## Requisitos Não Funcionais

### RNF-01 — Confiabilidade em ambiente com retry/DLQ

- O processamento deve ser consistente sob re-entrega de mensagens (idempotência por `orderId`).
- A rejeição de pagamento (por regras do gateway fake) não deve ser tratada como erro de processamento.

### RNF-02 — Observabilidade

- O processamento deve manter o uso dos mecanismos de métricas já existentes, registrando sucesso/falha conforme o resultado do processamento.
- Logs devem permitir rastrear `orderId` e `userId` durante consumo e persistência.

## Critérios de Aceite (AC)

### AC-01 — Tabela Payment e persistência

- Ao processar uma mensagem válida, um registro `Payment` é criado com `status=pending` e posteriormente atualizado para `approved` ou `rejected`.
- O registro final contém `processedAt` preenchido.

### AC-02 — Regras determinísticas do FakePaymentGatewayService

- Para `amount > 10000`, o pagamento é `rejected` com `rejectionReason="Limite excedido"`.
- Para `amount` terminando em `.99`, o pagamento é `rejected` com `rejectionReason="Cartão recusado pela operadora"`.
- Para os demais valores, o pagamento é `approved`.

### AC-03 — Consumer processa mensagem e não deixa TODO

- Ao receber uma mensagem válida da fila `payment_queue`, o consumer chama o processamento real e persiste o resultado.

### AC-04 — Idempotência por orderId

- Processar duas vezes a mesma mensagem (mesmo `orderId`) não cria dois pagamentos no banco.
- O resultado retornado para consulta é consistente após reprocessamentos.

### AC-05 — Consulta por orderId

- `GET /payments/:orderId` retorna 200 e o payload do `Payment` quando existir.
- `GET /payments/:orderId` retorna 404 quando não existir pagamento para o `orderId`.

### AC-06 — Health check

- `GET /health` responde 200 de forma consistente.

