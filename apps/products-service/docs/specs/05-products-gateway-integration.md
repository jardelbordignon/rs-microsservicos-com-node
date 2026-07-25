# Spec: Integração do products-service com o api-gateway

## Visão geral

Esta spec define os requisitos para concluir a integração do `products-service` com o `api-gateway` no projeto `marketplace`, garantindo que o serviço de produtos fique operacional por trás do gateway e que o fluxo ponta a ponta possa ser validado de forma consistente.

O objetivo desta entrega é consolidar a exposição do `products-service` via gateway, incluindo health check, documentação OpenAPI e validação do repasse correto das requisições autenticadas.

| Item | Valor |
|------|-------|
| Serviço principal | `products-service` |
| Serviço integrador | `api-gateway` |
| Porta do gateway | `4001` |
| Porta do products-service | `4004` |
| Escopo | Integração ponta a ponta via gateway |

---

## 1. Requisitos funcionais no products-service

### 1.1 Endpoint público de health check

- Disponibilizar o endpoint `GET /health` no `products-service`.
- A rota deve ser pública e não exigir autenticação.
- A resposta deve retornar exatamente o payload `{ status: "ok", service: "products-service" }`.
- O endpoint deve ser apropriado para consumo pelo mecanismo de health check já existente no `api-gateway`.

### 1.2 Documentação Swagger/OpenAPI

- Disponibilizar documentação automática do `products-service`.
- A documentação deve estar acessível em `/doc`.
- A documentação deve usar o título `Products Service`.
- A versão da documentação deve ser `1.0`.
- A documentação deve indicar suporte a autenticação Bearer.
- A interface da documentação deve usar o Scalar, mantendo consistência visual e funcional com o padrão já adotado no `api-gateway`.

### 1.3 Cobertura da documentação

- A documentação deve refletir os endpoints já existentes do domínio de produtos.
- Os endpoints públicos devem estar claramente identificados como públicos.
- O endpoint protegido de criação de produto deve estar documentado como rota autenticada.
- O endpoint de health check também deve estar presente na documentação do serviço.

---

## 2. Verificações obrigatórias no api-gateway

### 2.1 Configuração do endereço do serviço

- Confirmar que a variável `PRODUCTS_SERVICE_URL` está configurada no ambiente do `api-gateway`.
- Confirmar que o valor configurado aponta para o `products-service` na porta `4004`.
- A integração não deve exigir alteração estrutural no mecanismo de configuração já existente do gateway.

### 2.2 Encaminhamento das rotas de produtos

- Verificar que o `api-gateway` encaminha corretamente as rotas sob o prefixo `/products/*` para o `products-service`.
- Confirmar que os endpoints de consulta e criação de produtos permanecem acessíveis quando chamados através da porta `4001`.
- Confirmar que o fluxo de roteamento preserve o comportamento esperado das rotas públicas e protegidas do `products-service`.

### 2.3 Repasse do header Authorization

- Verificar que o header `Authorization` recebido pelo `api-gateway` é repassado ao `products-service`.
- Confirmar que esse repasse permite ao `products-service` validar o JWT usando o mecanismo já existente no próprio serviço.
- A integração não deve alterar os guards, interceptores ou o mecanismo de proxy já existente no gateway.

---

## 3. Fluxo completo esperado via gateway

### 3.1 Autenticação

1. O cliente envia `POST /users/login` para o `api-gateway`.
2. O gateway encaminha a requisição ao `users-service`.
3. O `users-service` retorna um token JWT válido.
4. O cliente utiliza esse token nas chamadas subsequentes ao gateway.

### 3.2 Criação de produto via gateway

1. O cliente envia `POST /products` para o `api-gateway` com token Bearer válido.
2. O gateway encaminha a requisição ao `products-service`, incluindo o header `Authorization`.
3. O `products-service` valida o JWT e aplica a regra de autorização de vendedor.
4. O produto é criado com sucesso quando o usuário autenticado possui role `seller`.

### 3.3 Listagem de catálogo via gateway

1. O cliente envia `GET /products` para o `api-gateway`.
2. O gateway encaminha a requisição ao `products-service`.
3. O `products-service` retorna o catálogo conforme as regras já definidas no serviço.

### 3.4 Consulta de produto por ID via gateway

1. O cliente envia `GET /products/:id` para o `api-gateway`.
2. O gateway encaminha a requisição ao `products-service`.
3. O `products-service` retorna o produto correspondente quando existir.

---

## 4. Respostas esperadas

### 4.1 Health check

- **200 OK**: o endpoint `GET /health` retorna `{ status: "ok", service: "products-service" }`.

### 4.2 Fluxo via gateway

- **200 OK**: health check, listagem de produtos e consulta por ID quando bem-sucedidos.
- **201 Created**: criação de produto realizada com sucesso via gateway.
- **401 Unauthorized**: criação de produto via gateway sem token, com token inválido ou expirado.
- **403 Forbidden**: criação de produto via gateway com usuário autenticado que não possui role `seller`.
- **404 Not Found**: consulta de produto por ID inexistente.

---

## 5. Critérios de aceite

### products-service

- [ ] **CA-01** — Existe um endpoint público `GET /health` no `products-service`.
- [ ] **CA-02** — `GET /health` responde com `200 OK`.
- [ ] **CA-03** — `GET /health` retorna exatamente `{ status: "ok", service: "products-service" }`.
- [ ] **CA-04** — O `products-service` disponibiliza documentação OpenAPI em `/doc`.
- [ ] **CA-05** — A documentação usa o título `Products Service`.
- [ ] **CA-06** — A documentação usa a versão `1.0`.
- [ ] **CA-07** — A documentação suporta autenticação Bearer.
- [ ] **CA-08** — A documentação usa o Scalar como interface.

### api-gateway

- [ ] **CA-09** — O `api-gateway` possui `PRODUCTS_SERVICE_URL` configurado para o `products-service`.
- [ ] **CA-10** — O gateway encaminha corretamente requisições `POST /products`.
- [ ] **CA-11** — O gateway encaminha corretamente requisições `GET /products`.
- [ ] **CA-12** — O gateway encaminha corretamente requisições `GET /products/:id`.
- [ ] **CA-13** — O header `Authorization` recebido pelo gateway é repassado ao `products-service`.

### fluxo ponta a ponta

- [ ] **CA-14** — É possível obter um JWT válido através de `POST /users/login` via gateway.
- [ ] **CA-15** — É possível criar um produto via `POST /products` passando pelo gateway com usuário `seller`.
- [ ] **CA-16** — A criação via gateway falha com `401 Unauthorized` quando o token não é enviado ou é inválido.
- [ ] **CA-17** — A criação via gateway falha com `403 Forbidden` quando o usuário autenticado não possui role `seller`.
- [ ] **CA-18** — É possível listar produtos via `GET /products` passando pelo gateway.
- [ ] **CA-19** — É possível consultar um produto existente via `GET /products/:id` passando pelo gateway.
- [ ] **CA-20** — Todo o fluxo pode ser validado por `curl` ou Postman usando apenas a porta `4001`.

---

## 6. Restrições

- Não alterar o mecanismo de proxy já existente no `api-gateway`.
- Não alterar os guards já existentes no `api-gateway`.
- Não introduzir novos fluxos de autenticação.
- Não mudar as regras de negócio já implementadas no `products-service`.

---

## 7. Fora de escopo

Esta spec não inclui:

- refatoração da infraestrutura do gateway;
- criação de novos endpoints de produtos além do `GET /health`;
- mudanças no fluxo de login do `users-service`;
- paginação, filtros ou busca adicionais no catálogo;
- observabilidade avançada, métricas ou tracing distribuído;
- testes automatizados detalhados de implementação.
