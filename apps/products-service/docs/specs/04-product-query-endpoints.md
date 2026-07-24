# Spec: Endpoints de Consulta de Produtos no products-service

## Visão geral

Esta spec define os endpoints essenciais de consulta de produtos no `products-service`, com foco em navegação do catálogo aberto do marketplace. As consultas devem ser públicas, enquanto a criação de produtos permanece protegida pelo fluxo de autenticação já existente no serviço.

| Item | Valor |
|------|-------|
| Serviço | `products-service` |
| Escopo | Consulta de catálogo e consulta de produto |
| Autenticação | Pública nas rotas desta spec |

---

## 1. Requisitos funcionais

### 1.1 Endpoints de consulta

- Criar três endpoints de consulta no `ProductsController`.
- Os endpoints devem utilizar o `ProductsService` para buscar os dados no banco.
- As rotas desta spec devem ser públicas usando `@Public()`.
- A rota de criação `POST /products` deve continuar protegida pelo `JwtAuthGuard` global.

### 1.2 GET /products

- Criar o endpoint `GET /products`.
- O endpoint deve retornar todos os produtos ativos do catálogo.
- Apenas produtos com `isActive = true` devem ser incluídos no resultado.
- O retorno deve ser ordenado por data de criação, do mais recente para o mais antigo.
- A rota deve ser pública.

### 1.3 GET /products/seller/:sellerId

- Criar o endpoint `GET /products/seller/:sellerId`.
- O endpoint deve retornar todos os produtos ativos de um vendedor específico.
- Apenas produtos com `isActive = true` devem ser incluídos no resultado.
- O `sellerId` deve ser recebido pela rota.
- Se o vendedor não possuir produtos ativos, a resposta deve ser um array vazio.
- A rota deve ser pública.

### 1.4 GET /products/:id

- Criar o endpoint `GET /products/:id`.
- O endpoint deve retornar os dados de um produto específico identificado por UUID.
- O endpoint deve retornar `404 Not Found` quando o produto não existir.
- A rota deve ser pública.

### 1.5 Regras de ordenação das rotas

- A ordem de declaração das rotas no controller deve respeitar o roteamento do NestJS.
- Rotas estáticas e com prefixo devem ser declaradas antes da rota dinâmica `:id`.
- A rota `GET /products/seller/:sellerId` deve vir antes de `GET /products/:id`.

### 1.6 Escopo das consultas

- As consultas desta spec devem atender apenas o fluxo essencial do marketplace.
- Não incluir paginação.
- Não incluir filtros adicionais.
- Não incluir busca por texto.
- Não incluir ordenação configurável.

---

## 2. Estrutura de dados

### 2.1 Resposta de listagem

Os endpoints de listagem devem retornar um array de produtos com os dados persistidos do catálogo ativo.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único do produto |
| `name` | string | Nome do produto |
| `description` | string | Descrição do produto |
| `price` | decimal | Preço do produto |
| `stock` | inteiro | Quantidade em estoque |
| `sellerId` | UUID | Identificador do vendedor |
| `isActive` | boolean | Status de ativação do produto |
| `createdAt` | timestamp | Data/hora de criação |
| `updatedAt` | timestamp | Data/hora da última atualização |

### 2.2 Resposta de detalhe

O endpoint `GET /products/:id` deve retornar um único produto com os mesmos campos persistidos da entidade `Product`.

---

## 3. Respostas esperadas

- **200 OK**: lista de produtos ou dados de um produto.
- **404 Not Found**: produto não encontrado no `GET /products/:id`.

---

## 4. Fluxo esperado das consultas

### 4.1 Listagem de catálogo

1. Receber requisição `GET /products`.
2. Permitir acesso sem autenticação por ser rota pública.
3. Buscar produtos com `isActive = true`.
4. Ordenar por data de criação decrescente.
5. Retornar `200 OK` com a lista de produtos.

### 4.2 Listagem por vendedor

1. Receber requisição `GET /products/seller/:sellerId`.
2. Permitir acesso sem autenticação por ser rota pública.
3. Buscar produtos com `sellerId` correspondente e `isActive = true`.
4. Retornar `200 OK` com a lista encontrada.
5. Se não houver produtos, retornar `200 OK` com array vazio.

### 4.3 Consulta por ID

1. Receber requisição `GET /products/:id`.
2. Permitir acesso sem autenticação por ser rota pública.
3. Buscar o produto pelo identificador informado.
4. Se o produto existir, retornar `200 OK` com seus dados.
5. Se o produto não existir, retornar `404 Not Found`.

---

## 5. Critérios de aceite

### Estrutura e integração

- [ ] **CA-01** — Existem três endpoints de consulta expostos no `ProductsController`.
- [ ] **CA-02** — Os endpoints utilizam o `ProductsService` para recuperar os dados.
- [ ] **CA-03** — A rota `POST /products` continua protegida.
- [ ] **CA-04** — As rotas `GET /products`, `GET /products/seller/:sellerId` e `GET /products/:id` são públicas com `@Public()`.

### GET /products

- [ ] **CA-05** — `GET /products` retorna apenas produtos com `isActive = true`.
- [ ] **CA-06** — `GET /products` retorna produtos ordenados do mais recente para o mais antigo.
- [ ] **CA-07** — `GET /products` responde com `200 OK`.

### GET /products/seller/:sellerId

- [ ] **CA-08** — `GET /products/seller/:sellerId` retorna apenas produtos ativos do vendedor informado.
- [ ] **CA-09** — `GET /products/seller/:sellerId` responde com `200 OK`.
- [ ] **CA-10** — Quando o vendedor não possui produtos ativos, a resposta é um array vazio.

### GET /products/:id

- [ ] **CA-11** — `GET /products/:id` retorna os dados de um produto existente.
- [ ] **CA-12** — `GET /products/:id` responde com `200 OK` quando o produto existe.
- [ ] **CA-13** — `GET /products/:id` responde com `404 Not Found` quando o produto não existe.

### Regras de roteamento

- [ ] **CA-14** — A rota `GET /products/seller/:sellerId` é declarada antes de `GET /products/:id`.
- [ ] **CA-15** — A rota dinâmica `:id` não interfere no funcionamento da rota `seller/:sellerId`.

---

## 6. Fora de escopo

Esta spec não inclui:

- atualização de produtos;
- exclusão de produtos;
- paginação;
- filtros adicionais;
- busca por texto;
- ordenação customizável;
- validação de ownership;
- qualquer alteração no fluxo de autenticação além do uso de `@Public()` nas rotas de consulta.
