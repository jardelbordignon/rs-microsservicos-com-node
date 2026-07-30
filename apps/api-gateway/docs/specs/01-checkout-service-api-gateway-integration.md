# SPEC — Integração do checkout-service no api-gateway (proxies de Carrinho e Pedidos)

## Objetivo

Expor, no `api-gateway`, rotas públicas do domínio de **Carrinho** e **Pedidos** através de controllers de proxy que encaminham requisições ao `checkout-service`, reutilizando o mecanismo de proxy já existente (circuit breaker, retry, timeout e fallback).

## Contexto e Premissas

- `checkout-service` (porta **3003**) já possui endpoints funcionais e protegidos por JWT:
  - `POST /cart/items`
  - `GET /cart`
  - `DELETE /cart/items`
  - `POST /cart/checkout`
  - `GET /orders`
  - `GET /orders/:id`
- `api-gateway` (porta **3005**) já possui:
  - `ProxyModule`/`ProxyService` com circuit breaker, retry, timeout e fallback
  - `AuthModule` com `JwtAuthGuard`
  - Controllers de proxy para `users-service` e `products-service`
- `gateway.config.ts` já possui configuração para `checkout` com `url: http://localhost:3003` e `timeout: 10000`.
- `ProxyService` já reconhece `checkout` como `serviceName` e possui fallback configurado para este serviço.

## Escopo

### Em Escopo

- Criar um `CheckoutModule` no `api-gateway` responsável por expor rotas de proxy para:
  - Carrinho (`/cart`)
  - Pedidos (`/orders`)
- Garantir repasse do header `Authorization` do cliente para o `checkout-service` em todos os proxies.
- Criar teste E2E completo exercitando o fluxo via `api-gateway`.
- Registrar o `CheckoutModule` no `AppModule` do `api-gateway`.

### Fora de Escopo (Não Fazer)

- Alterar o mecanismo de proxy existente (`ProxyModule`/`ProxyService`) ou suas políticas (retry, timeout, circuit breaker, fallback).
- Alterar o `checkout-service` (contratos, endpoints, autenticação, handlers, DTOs, etc.).
- Criar rotas de proxy para `payments-service` (será definido em outra SPEC).
- Alterar o contrato de autenticação (JWT) ou o comportamento do `JwtAuthGuard`.

## Requisitos Funcionais

### RF-01 — CheckoutModule no api-gateway

- Deve existir um `CheckoutModule` no `api-gateway`.
- O módulo deve conter exatamente dois controllers de proxy:
  - `CartProxyController`
  - `OrdersProxyController`
- O módulo deve reutilizar o `ProxyService` existente para encaminhar chamadas ao `checkout-service` (serviceName: `checkout`).

### RF-02 — CartProxyController (rotas de carrinho)

- Deve existir um controller `CartProxyController` com:
  - `@Controller('cart')`
  - `@UseGuards(JwtAuthGuard)`
- O controller deve expor as rotas abaixo e encaminhar para o `checkout-service` preservando path e método HTTP:

| Rota no api-gateway | Método | Rota alvo no checkout-service | Observações |
|---|---:|---|---|
| `/cart/items` | `POST` | `POST /cart/items` | Adiciona/atualiza item no carrinho |
| `/cart` | `GET` | `GET /cart` | Retorna carrinho ativo do usuário |
| `/cart/items` | `DELETE` | `DELETE /cart/items` | Remove item do carrinho |

### RF-03 — OrdersProxyController (rotas de pedidos)

- Deve existir um controller `OrdersProxyController` com:
  - `@UseGuards(JwtAuthGuard)`
- O controller deve expor as rotas abaixo:

| Rota no api-gateway | Método | Rota alvo no checkout-service | Observações |
|---|---:|---|---|
| `/orders` | `POST` | `POST /cart/checkout` | Efetiva checkout do carrinho e cria um pedido |
| `/orders` | `GET` | `GET /orders` | Lista pedidos do usuário |
| `/orders/:id` | `GET` | `GET /orders/:id` | Busca pedido por id |

### RF-04 — Registro do módulo

- O `CheckoutModule` deve ser registrado no `DomainModule` do `api-gateway` para que as rotas estejam ativas na inicialização da aplicação.

## Requisitos Não Funcionais

### RNF-01 — Transparência de autenticação (repasse de Authorization)

- Todas as rotas de proxy (Carrinho e Pedidos) devem repassar o header HTTP `Authorization` recebido pelo `api-gateway` para o `checkout-service`.
- O comportamento esperado é que o `checkout-service` valide o JWT da mesma forma como já faz atualmente para acesso direto (sem gateway).

### RNF-02 — Confiabilidade e resiliência

- Todas as rotas de proxy devem utilizar o mecanismo já existente do `ProxyService` para:
  - timeout
  - retry
  - circuit breaker
  - fallback configurado para `checkout`

## Contrato de Rotas no api-gateway

### Visão rápida (roteamento)

```
Cliente HTTP
  |
  |  Authorization: Bearer <jwt>
  v
api-gateway (3005)
  |  /cart/*, /orders/*
  v
checkout-service (3003)
  |  valida JWT e executa domínio de checkout
  v
PostgreSQL / integrações internas do checkout-service
```

## Testes

### E2E — Fluxo completo via api-gateway

Deve existir um teste E2E executado contra o `api-gateway` cobrindo o cenário ponta-a-ponta:

1. Login via `api-gateway` (rota já existente de users proxy) para obter um `access_token` JWT válido.
2. Adicionar item ao carrinho via `api-gateway`:
   - `POST /cart/items` com header `Authorization: Bearer <token>`.
3. Consultar carrinho via `api-gateway`:
   - `GET /cart` com header `Authorization`.
4. Executar checkout via `api-gateway`:
   - `POST /orders` com header `Authorization`.
5. Consultar pedidos via `api-gateway`:
   - `GET /orders` com header `Authorization`.
6. Consultar pedido específico via `api-gateway`:
   - `GET /orders/:id` com header `Authorization`.

O teste deve validar, no mínimo:

- Para cada etapa, o status HTTP é compatível com o comportamento esperado do `checkout-service` (sem alterar semântica no gateway).
- As rotas do gateway exigem JWT (sem token devem falhar com resposta de não autorizado).
- O pedido criado no checkout aparece nas consultas posteriores.

## Critérios de Aceite (AC)

### AC-01 — Rotas de carrinho disponíveis e protegidas

- `POST /cart/items`, `GET /cart` e `DELETE /cart/items` respondem via `api-gateway` e exigem `Authorization` válido.

### AC-02 — Rotas de pedidos disponíveis e protegidas

- `POST /orders`, `GET /orders` e `GET /orders/:id` respondem via `api-gateway` e exigem `Authorization` válido.

### AC-03 — Repasse de Authorization comprovado

- As chamadas via gateway funcionam com o mesmo token JWT aceito pelo `checkout-service` quando acessado diretamente.
- Chamadas sem `Authorization` falham antes de chegar ao `checkout-service` (guard do gateway).

### AC-04 — Reutilização do ProxyService

- Todas as rotas acima usam o `ProxyService` existente com `serviceName = checkout`, mantendo timeout/retry/circuit breaker/fallback como já configurados.

### AC-05 — E2E verde

- Existe um teste E2E automatizado executando o fluxo: login → add to cart → view cart → checkout → view orders.
- O teste passa de forma determinística em ambiente local com os serviços necessários ativos.

## Alinhamentos Necessários

- A rota de checkout do `checkout-service` é `POST /cart/checkout`. Esta SPEC define que o `api-gateway` expõe `POST /orders` como rota de entrada para checkout (proxy para `POST /cart/checkout`), mantendo a superfície do gateway centrada no recurso “orders”.

