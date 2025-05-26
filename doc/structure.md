# Estrutura do Projeto - ABF Eventos

## Árvore de Diretórios

```
abf-eventos-monolito/
├── docs/                    # Documentação original
├── doc/                     # Nova documentação técnica
├── prisma/                  # Modelos de dados e migrações
│   └── schema.prisma        # Definição do esquema do banco de dados
├── public/                  # Arquivos estáticos públicos
├── scripts/                 # Scripts utilitários
│   └── seed-permissions-and-roles.ts  # Script para criação inicial de permissões
├── src/                     # Código-fonte principal
│   ├── actions/             # Ações globais do sistema
│   ├── app/                 # Estrutura de rotas Next.js (App Router)
│   │   ├── (authenticated)/ # Rotas autenticadas
│   │   ├── _navigation/     # Componentes de navegação
│   │   ├── _providers/      # Provedores globais
│   │   ├── eventos/         # Páginas públicas de eventos
│   │   ├── sign-in/         # Página de login
│   │   └── sign-up/         # Página de cadastro
│   ├── components/          # Componentes reutilizáveis
│   │   ├── form/            # Componentes e utilidades para formulários
│   │   ├── layouts/         # Layouts de página
│   │   ├── theme/           # Componentes relacionados ao tema
│   │   └── ui/              # Componentes de UI básicos
│   ├── features/            # Módulos funcionais organizados por domínio
│   │   ├── auth/            # Autenticação e autorização
│   │   ├── events/          # Funcionalidades de eventos
│   │   ├── speakers/        # Funcionalidades de palestrantes
│   │   ├── sponsors/        # Funcionalidades de patrocinadores
│   │   ├── users/           # Funcionalidades de usuários
│   │   └── ...              # Outros módulos de funcionalidade
│   ├── hooks/               # Hooks React personalizados
│   ├── lib/                 # Configurações de bibliotecas externas
│   └── utils/               # Funções utilitárias
└── types/                   # Definições de tipos globais
```

## Função dos Principais Componentes

| Diretório/Arquivo              | Função                                                                           |
|--------------------------------|----------------------------------------------------------------------------------|
| **prisma/schema.prisma**       | Define o esquema do banco de dados e relacionamentos entre entidades            |
| **src/actions/**               | Contém Server Actions globais do Next.js                                         |
| **src/app/**                   | Define a estrutura de rotas e páginas usando App Router do Next.js              |
| **src/app/(authenticated)/**   | Contém rotas protegidas que exigem autenticação                                 |
| **src/app/_navigation/**       | Componentes de navegação como sidebar e header                                  |
| **src/app/paths.ts**           | Definição centralizada de rotas da aplicação                                     |
| **src/components/ui/**         | Componentes de UI básicos utilizando shadcn/ui                                   |
| **src/components/form/**       | Componentes especializados para formulários e validação                          |
| **src/features/**              | Organização modular de funcionalidades por domínio                               |
| **src/features/[module]/actions/** | Server Actions específicas do módulo                                          |
| **src/features/[module]/components/** | Componentes React específicos do módulo                                    |
| **src/features/[module]/queries/** | Funções de consulta ao banco de dados para o módulo                           |
| **src/features/[module]/types.ts** | Definições de tipos específicos do módulo                                     |
| **src/lib/**                   | Configurações de serviços externos (Prisma, MinIO, Lucia, etc.)                 |
| **src/utils/**                 | Funções utilitárias compartilhadas por toda a aplicação                          |

## Fluxo de Dados Típico

1. **Renderização de Página**:
   - Componente de página (Server Component) em `src/app/[rota]/page.tsx`
   - Chama funções de query em `src/features/[module]/queries/`
   - Renderiza componentes específicos do módulo de `src/features/[module]/components/`

2. **Interação do Usuário**:
   - Componente cliente (`"use client"`) captura eventos do usuário
   - Formulário envia dados para Server Action em `src/features/[module]/actions/`
   - Server Action valida dados com Zod
   - Server Action executa operações no banco via Prisma
   - Server Action registra log de operação em `AppLog`
   - Revalidação de cache para atualizar UI

3. **Autenticação/Autorização**:
   - Middleware verifica sessão de usuário
   - Componentes de página chamam `getAuth()` ou `getAuthWithPermission()`
   - Verificação de permissões específicas do usuário
   - Renderização condicional baseada em permissões

4. **Upload de Arquivos**:
   - Componente de formulário captura arquivo
   - Server Action processa arquivo
   - Upload para MinIO via cliente configurado em `src/lib/minio.ts`
   - Armazenamento de URLs e paths no banco de dados
   - Geração de thumbnails quando necessário