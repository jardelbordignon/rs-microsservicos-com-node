# Spec: JWT Guards and Route Protection

## Visão geral

Implementar guards Passport JWT para proteger rotas no users-service, permitindo acesso apenas a usuários autenticados.

| Item | Valor |
|------|-------|
| Serviço | users-service |
| Objetivo | Proteger rotas do serviço |
| Dependências | @nestjs/passport, passport, passport-jwt |

---

## 1. Requisitos funcionais

### 1.1 JwtStrategy (Passport)
- Criar uma estratégia JWT que:
  - Extrai o token JWT do header Authorization, seguindo o formato "Bearer &lt;token&gt;"
  - Valida a assinatura do token usando a secret configurada no JwtModule
  - Valida automaticamente a expiração do token
  - Retorna um objeto com os dados do usuário extraídos do payload do token (id, email, role)
  - Este objeto ficará disponível em `req.user` em todas as rotas protegidas

### 1.2 JwtAuthGuard
- Criar um AuthGuard que:
  - Herda do AuthGuard('jwt') do Passport
  - Verifica se a rota possui a metadata "isPublic" antes de exigir autenticação
  - Se a rota for marcada como pública, permite acesso sem token
  - Se a rota não for pública, valida o token normalmente
  - Deve ser registrado como guard GLOBAL (APP_GUARD) para proteger todas as rotas automaticamente

### 1.3 Decorator @Public()
- Criar um decorator customizado que:
  - Marca uma rota como pública (não requer autenticação)
  - Usa o metadata do NestJS para comunicar com o JwtAuthGuard

### 1.4 Rotas públicas existentes
- Marcar as seguintes rotas existentes como públicas usando o decorator @Public():
  - POST /users/register
  - POST /users/login

---

## 2. Fluxo esperado de uma requisição

1. Requisição chega ao serviço
2. JwtAuthGuard verifica se a rota é marcada como @Public()
3. Se for pública: permite acesso sem autenticação
4. Se não for pública: extrai e valida o token JWT do header Authorization
5. Se o token for válido: injeta os dados do usuário em req.user
6. Controller processa a requisição

---

## 3. Respostas esperadas

- **401 Unauthorized**: Para rotas protegidas sem token, token expirado ou token com assinatura inválida
- **Resposta normal (200, 201, etc.)**: Para requisições com token válido ou rotas públicas

---

## 4. Critérios de aceite

### JwtStrategy
- [ ] CA-01: Estratégia extrai token do header Authorization no formato Bearer &lt;token&gt;
- [ ] CA-02: Estratégia valida assinatura usando a secret JWT_SECRET
- [ ] CA-03: Estratégia valida automaticamente expiração do token
- [ ] CA-04: Estratégia retorna objeto com id, email e role do usuário no req.user

### JwtAuthGuard
- [ ] CA-05: Guard verifica se a rota é @Public() antes de exigir autenticação
- [ ] CA-06: Guard permite acesso a rotas públicas sem token
- [ ] CA-07: Guard valida token para rotas não públicas
- [ ] CA-08: Guard registrado como APP_GUARD globalmente

### Decorator @Public()
- [ ] CA-09: Decorator marca rotas como públicas
- [ ] CA-10: POST /users/register está marcada como @Public()
- [ ] CA-11: POST /users/login está marcada como @Public()

---

## 5. Fora de escopo
- RoleGuard ou qualquer guard de roles/permissões
- SessionGuard
- Criação de novos endpoints
