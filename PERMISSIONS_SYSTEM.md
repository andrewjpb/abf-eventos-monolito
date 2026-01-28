# Sistema de Grupos e Permissões

Este documento descreve a implementação completa do sistema de controle de acesso baseado em funções (RBAC - Role-Based Access Control) neste projeto.

## Índice

1. [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
2. [Arquivos Principais](#arquivos-principais)
3. [Como as Permissões São Verificadas](#como-as-permissões-são-verificadas)
4. [Como Atribuir Grupos aos Usuários](#como-atribuir-grupos-aos-usuários)
5. [Convenções e Padrões](#convenções-e-padrões)
6. [Exemplos de Uso](#exemplos-de-uso)

---

## Estrutura do Banco de Dados

### Tabelas

#### `permissions` - Permissões
```prisma
model Permission {
  id          String   @id @default(cuid())
  name        String   @unique  // ex: "users.view", "events.create"
  description String             // Descrição legível
  roles       Role[]             // Relação many-to-many com roles
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt
}
```

**Localização no schema:** `prisma/schema.prisma:269-298`

#### `roles` - Grupos/Papéis
```prisma
model Role {
  id          String       @id @default(cuid())
  name        String       @unique  // ex: "admin", "event_manager"
  description String                // Descrição legível
  permissions Permission[]          // Relação many-to-many com permissions
  users       User[]                // Relação many-to-many com users
  createdAt   DateTime     @default(now()) @map("created_at")
  updatedAt   DateTime     @updatedAt
}
```

**Localização no schema:** `prisma/schema.prisma:149-178`

#### `users` - Usuários (campos relevantes)
```prisma
model User {
  id       String  @id @default(cuid())
  name     String
  email    String  @unique
  username String  @unique
  roles    Role[]  // Relação many-to-many com roles
  // ... outros campos
}
```

### Tabelas de Relacionamento (Junction Tables)

#### `_PermissionToRole`
Relaciona permissões com grupos/papéis.
- Campo A: `permission.id`
- Campo B: `role.id`

#### `_RoleToUser`
Relaciona grupos/papéis com usuários.
- Campo A: `role.id`
- Campo B: `user.id`

### Diagrama de Relacionamentos

```
┌─────────┐         ┌──────────────────┐         ┌────────────┐
│  User   │ ◄─────► │  _RoleToUser     │ ◄─────► │    Role    │
└─────────┘         └──────────────────┘         └────────────┘
                                                        ▲
                                                        │
                                                        ▼
                                                  ┌──────────────────────┐
                                                  │ _PermissionToRole    │
                                                  └──────────────────────┘
                                                        ▲
                                                        │
                                                        ▼
                                                  ┌────────────┐
                                                  │ Permission │
                                                  └────────────┘
```

---

## Arquivos Principais

### 1. Seed de Dados Iniciais

**`scripts/seed-permissions-and-roles.ts`**
- Popula 50+ permissões predefinidas
- Cria 6 grupos padrão: `admin`, `event_manager`, `marketing`, `reception`, `enrollment_analyst`, `viewer`
- Atribui permissões aos grupos conforme lógica de negócio

### 2. Verificação de Permissões (Core)

#### Server-Side (Queries)

**`src/features/permissions/queries/check-permission.ts`**
- Verifica acesso ao painel administrativo
- Checa se usuário tem "panel.access" ou qualquer permissão de recurso

**`src/features/permissions/queries/check-user-permission.ts`**
- Verifica permissão específica para um usuário
- Admin bypass: admins têm todas as permissões automaticamente
- Usa `cache()` do React para deduplificação

#### Client-Side (Hooks)

**`src/features/permissions/hooks/use-check-permission.tsx`**
- Hook React para verificação client-side
- Retorna `{ hasPermission, isLoading }`
- Útil para renderização condicional de UI

### 3. Autenticação com Permissões

**`src/features/auth/queries/get-auth.ts`**
- Função base de autenticação
- Enriquece objeto do usuário com roles e empresa
- Define flag `user.isAdmin`

**`src/features/auth/queries/get-auth-with-permission.ts`**
- Verifica autenticação + permissão opcional
- Redireciona para login se não autenticado
- Retorna ActionState com erro se sem permissão (não redireciona)
- Loga tentativas de acesso não autorizado

**`src/features/auth/queries/get-auth-with-permission-or-redirect.ts`**
- Verifica autenticação + permissão opcional
- Retorna 404 (`notFound()`) se sem permissão
- Usado para proteção em nível de página

### 4. Gerenciamento de Grupos (Roles)

**`src/features/roles/queries/get-role.ts`**
- Busca grupo com permissões e usuários relacionados

**`src/features/roles/actions/upsert-role.ts`**
- Cria/atualiza grupos
- Gerencia atribuição de permissões usando `connect`/`disconnect`
- Requer permissão "roles.create" ou "roles.update"
- Loga todas as mudanças

**`src/features/roles/components/role-upsert-form.tsx`**
- Interface para criar/editar grupos
- Seletor de permissões com busca/autocomplete
- Mostra permissões selecionadas como badges removíveis

### 5. Gerenciamento de Usuários

**`src/features/users/actions/upsert-user.ts`**
- Cria/atualiza usuários
- Atribui grupos via SQL raw na tabela `_RoleToUser`
- Requer permissão de admin
- Loga todas as mudanças

**`src/features/users/components/user-upsert-form.tsx`**
- Interface para criar/editar usuários
- Multi-seleção de grupos/papéis

### 6. Navegação

**`src/app/_navigation/sidebar/sidebar.tsx`**
- Filtra itens de navegação baseado nas permissões do usuário
- Carrega permissões do banco de dados
- Esconde sidebar inteira se não houver acesso ao painel
- Usuários admin veem todos os itens

**`src/app/_navigation/sidebar/constants.tsx`**
- Define estrutura de navegação
- Cada item tem campo `requiredPermission`
- Suporta sub-itens aninhados com suas próprias permissões

---

## Como as Permissões São Verificadas

### Padrão 1: Proteção em Nível de Página (mais comum)

```typescript
// Em arquivos page.tsx (Server Components)
await getAuthWithPermissionOrRedirect("users.view")
```

- Usado no topo de componentes server
- Retorna 404 se usuário não tiver permissão
- **Exemplo:** `src/app/(authenticated)/admin/users/page.tsx`

### Padrão 2: Proteção em Nível de Action

```typescript
// Em server actions
const { user, error } = await getAuthWithPermission("users.create")
if (error) {
  return toActionState("ERROR", "Sem permissão para criar usuário")
}
```

- Usado em actions de formulários e mutações
- Retorna ActionState com erro ao invés de redirecionar
- Permite tratamento gracioso de erros em forms

### Padrão 3: Renderização Condicional Client-Side

```typescript
// Em client components
const { hasPermission } = useCheckPermission(userId, "events.delete")

if (!hasPermission) {
  return null // Ou esconder botão, etc
}
```

- Usado para mostrar/esconder elementos de UI
- NÃO é camada de segurança (verificações server são primárias)
- Melhora UX evitando mostrar opções indisponíveis

### Padrão 4: Filtragem de Navegação

- Sidebar filtra itens automaticamente
- Verifica campo `requiredPermission` de cada item
- Usuários admin ignoram todas as verificações

### Lógica de Admin Bypass

Em todo o sistema, admins (usuários com role "admin") passam automaticamente por todas as verificações:

```typescript
const isAdmin = user.roles.some(role => role.name === "admin")
if (isAdmin) return true
```

---

## Como Atribuir Grupos aos Usuários

### Durante Criação/Atualização de Usuário

1. Admin seleciona grupos no formulário de usuário
2. Formulário envia `roleIds` como array JSON
3. Server action valida permissão do solicitante
4. Transação executa:
   ```sql
   DELETE FROM "_RoleToUser" WHERE "B" = userId;
   INSERT INTO "_RoleToUser" ("A", "B") VALUES (roleId1, userId), (roleId2, userId), ...;
   ```
5. Todas as atribuições antigas são removidas, novas são adicionadas

### Na Camada de Banco de Dados

- Prisma gerencia tabela junction `_RoleToUser` automaticamente
- SQL raw é usado em alguns casos para controle fino
- Relacionamento definido como: `users.roles` ↔ `roles.users`

### Resolução de Permissões

Quando verificando permissões:

1. Busca usuário com seus grupos (roles)
2. Para cada grupo, busca suas permissões
3. "Achata" todas as permissões em um único array
4. Verifica se permissão requerida existe no array
5. Cacheia resultado usando `cache()` do React

---

## Convenções e Padrões

### Convenção de Nomenclatura

Permissões seguem o padrão: `recurso.acao`

- **Recursos:** users, companies, events, roles, permissions, sponsors, etc.
- **Ações:** view, create, update, delete, publish, assign, etc.
- **Exemplos:**
  - `users.view` - Visualizar usuários
  - `events.create` - Criar eventos
  - `roles.delete` - Deletar grupos
  - `attendance.check_in` - Fazer check-in de participantes

### Permissões Especiais

- **`panel.access`** - Acesso geral ao painel administrativo
- Qualquer permissão com `.view`, `.create`, `.update`, `.delete` também concede acesso ao painel

### Tipos de Grupos (do seed)

1. **admin** - Acesso completo ao sistema (todas as permissões)
2. **event_manager** - Eventos, palestrantes, inscrições, presença
3. **marketing** - Eventos (leitura), patrocinadores, apoiadores, banners, estatísticas
4. **reception** - Check-in e gerenciamento de presença
5. **enrollment_analyst** - Acesso especializado a dados de inscrição e análises
6. **viewer** - Acesso somente leitura à maioria dos recursos

### Logging

Todas as ações relacionadas a permissões são logadas:

- `logWarn()` para tentativas de acesso não autorizado
- `logInfo()` para ações bem-sucedidas
- `logError()` para falhas
- Inclui ID do usuário, ação e metadata

### Caching

- Verificações de permissão usam `cache()` do React para deduplificação
- Reduz queries ao banco durante SSR
- Cache tem escopo de uma única requisição

### Tipos TypeScript

- **`src/features/roles/types.ts`** - Tipos de Role
- **`src/features/users/types.ts`** - Tipos de User com roles
- `RoleWithRelations` inclui permissions e users
- `UserWithDetails` inclui company e roles

### Tratamento de Erros

- **Nível de página:** Retorna 404 para acesso não autorizado
- **Nível de action:** Retorna ActionState com mensagem de erro
- **Loga** todas as tentativas não autorizadas com contexto

---

## Exemplos de Uso

### Exemplo 1: Proteger uma Página

```typescript
// src/app/(authenticated)/admin/events/page.tsx
import { getAuthWithPermissionOrRedirect } from "@/features/auth/queries/get-auth-with-permission-or-redirect"

export default async function EventsPage() {
  // Se usuário não tiver permissão, retorna 404
  await getAuthWithPermissionOrRedirect("events.view")

  return (
    <div>
      {/* Conteúdo da página */}
    </div>
  )
}
```

### Exemplo 2: Proteger um Server Action

```typescript
// src/features/events/actions/create-event.ts
"use server"

import { getAuthWithPermission } from "@/features/auth/queries/get-auth-with-permission"
import { toActionState } from "@/lib/action-state"

export async function createEvent(data: EventFormData) {
  // Verifica autenticação e permissão
  const { user, error } = await getAuthWithPermission("events.create")

  if (error) {
    return toActionState("ERROR", error)
  }

  // Processa criação do evento...
  // ...

  return toActionState("SUCCESS", "Evento criado com sucesso")
}
```

### Exemplo 3: Renderização Condicional no Cliente

```typescript
// src/app/(authenticated)/admin/events/event-actions.tsx
"use client"

import { useCheckPermission } from "@/features/permissions/hooks/use-check-permission"

export function EventActions({ eventId, userId }: Props) {
  const { hasPermission: canDelete } = useCheckPermission(userId, "events.delete")
  const { hasPermission: canEdit } = useCheckPermission(userId, "events.update")

  return (
    <div>
      {canEdit && <EditButton eventId={eventId} />}
      {canDelete && <DeleteButton eventId={eventId} />}
    </div>
  )
}
```

### Exemplo 4: Criar um Novo Grupo com Permissões

```typescript
// Usando o formulário em src/features/roles/components/role-upsert-form.tsx
// Ou programaticamente:

import { upsertRole } from "@/features/roles/actions/upsert-role"

const result = await upsertRole({
  name: "content_manager",
  description: "Gerenciador de Conteúdo",
  permissionIds: [
    "events.view",
    "events.create",
    "events.update",
    "speakers.view",
    "speakers.create"
  ]
})
```

### Exemplo 5: Atribuir Grupos a um Usuário

```typescript
// Usando o formulário em src/features/users/components/user-upsert-form.tsx
// Ou programaticamente:

import { upsertUser } from "@/features/users/actions/upsert-user"

const result = await upsertUser({
  id: userId, // Para atualizar usuário existente
  name: "João Silva",
  email: "joao@example.com",
  roleIds: ["role_id_1", "role_id_2"], // IDs dos grupos
  // ... outros campos
})
```

### Exemplo 6: Adicionar Item ao Menu com Permissão

```typescript
// src/app/_navigation/sidebar/constants.tsx

export const NAVIGATION_ITEMS = [
  {
    title: "Meu Recurso",
    href: "/admin/my-resource",
    icon: <MyIcon />,
    requiredPermission: "my_resource.view", // Só aparece se tiver permissão
  },
  {
    title: "Gerenciamento",
    icon: <SettingsIcon />,
    requiredPermission: "panel.access",
    subItems: [
      {
        title: "Sub Item",
        href: "/admin/sub-item",
        requiredPermission: "sub_item.view",
      }
    ]
  }
]
```

---

## Resumo

Este é um sistema de **RBAC (Role-Based Access Control)** completo com:

- Relacionamentos **many-to-many** entre Users ↔ Roles ↔ Permissions
- **Modelo hierárquico** de permissões com bypass para admin
- **Permissões granulares** seguindo nomenclatura recurso.acao
- **Aplicação em múltiplas camadas**: página, action e UI
- **Logging abrangente** de todos os eventos de autorização
- **Filtragem de navegação** baseada em permissões
- Implementação **type-safe** com Prisma e TypeScript

O sistema é bem estruturado, segue boas práticas de segurança e oferece tanto conveniência (admin bypass) quanto flexibilidade (permissões granulares para diferentes papéis).

---

## Migração/Seed

Para aplicar o sistema em um novo projeto:

1. Copie o schema do Prisma (models `Permission`, `Role`, `User` com relacionamentos)
2. Execute as migrations: `npx prisma migrate dev`
3. Execute o seed: `npm run seed-permissions` (ou o comando configurado no projeto)
4. Copie as features de `auth`, `permissions`, `roles` e `users`
5. Adapte os componentes de navegação conforme necessário

**Comando de seed configurado em `package.json`:**
```json
"scripts": {
  "seed-permissions": "tsx scripts/seed-permissions-and-roles.ts"
}
```
