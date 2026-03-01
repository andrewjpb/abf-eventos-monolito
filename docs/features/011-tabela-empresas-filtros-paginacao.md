# Feature: Trocar Cards por Tabela na Tela de Empresas

**Status:** Aguardando Aprovação
**Data:** 12/02/2026
**Versão:** 1.0

---

## Resumo

Refatorar a tela de empresas (`/admin/companies`) substituindo a visualização atual em **cards** por uma **tabela** com:
- Filtros de busca
- Paginação
- Ordenação por colunas

---

## Problema Atual

- Visualização em cards dificulta a gestão com muitas empresas
- Sem filtros para busca rápida
- Sem paginação (carrega tudo de uma vez)
- Performance ruim com volume grande de dados

---

## Solução Proposta

Implementar tabela com:
- **Filtros:** busca por nome, CNPJ, status, etc.
- **Paginação:** X itens por página
- **Ordenação:** clicar no cabeçalho para ordenar
- **Ações:** editar, visualizar, excluir

---

## Regras de Negócio

- **RN-001:** Substituir cards por tabela na listagem de empresas.

- **RN-002:** Implementar **filtros**:
  - Nome da empresa (busca parcial)
  - CNPJ
  - Status (ativo/inativo)
  - Tipo de empresa (se houver)

- **RN-003:** Implementar **paginação**:
  - Padrão: 10 itens por página
  - Opções: 10, 25, 50, 100

- **RN-004:** Implementar **ordenação** por colunas:
  - Nome (A-Z, Z-A)
  - Data de cadastro
  - Status

- **RN-005:** Layout **responsivo** (tabela adaptada para mobile).

---

## Fluxo do Usuário (User Flow)

### Desktop

```
┌─────────────────────────────────────────────────────────────────┐
│  Admin > Empresas                                                │
│  /admin/companies                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [+ Nova Empresa]                                               │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Filtros                                                    ││
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        ││
│  │  │ Nome...      │ │ CNPJ...      │ │ Status ▼     │ [Buscar]│
│  │  └──────────────┘ └──────────────┘ └──────────────┘        ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Nome ↕          CNPJ           Status    Cadastro   Ações  ││
│  │  ───────────────────────────────────────────────────────────││
│  │  Empresa ABC     12.345.678/0001-90   Ativo    10/01/26  ⋮  ││
│  │  Empresa XYZ     98.765.432/0001-10   Ativo    08/01/26  ⋮  ││
│  │  Empresa 123     11.222.333/0001-44   Inativo  05/01/26  ⋮  ││
│  │  Empresa DEF     55.666.777/0001-88   Ativo    03/01/26  ⋮  ││
│  │  Empresa GHI     99.888.777/0001-66   Ativo    01/01/26  ⋮  ││
│  │  ...                                                        ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Mostrando 1-10 de 156 empresas    [<] [1] [2] [3] ... [16] [>] │
│  Itens por página: [10 ▼]                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Menu de Ações (⋮)

```
┌─────────────┐
│ 👁 Ver      │
│ ✏️ Editar   │
│ 🗑 Excluir  │
└─────────────┘
```

### Mobile (Responsivo)

```
┌───────────────────────────┐
│  Empresas                 │
├───────────────────────────┤
│  [+ Nova]                 │
│                           │
│  Filtros [▼]              │
│  ┌─────────────────────┐  │
│  │ Buscar...           │  │
│  └─────────────────────┘  │
│                           │
│  ┌─────────────────────┐  │
│  │ Empresa ABC         │  │
│  │ 12.345.678/0001-90  │  │
│  │ Ativo • 10/01/26    │  │
│  │              [⋮]    │  │
│  └─────────────────────┘  │
│                           │
│  ┌─────────────────────┐  │
│  │ Empresa XYZ         │  │
│  │ 98.765.432/0001-10  │  │
│  │ Ativo • 08/01/26    │  │
│  │              [⋮]    │  │
│  └─────────────────────┘  │
│                           │
│  [<] 1 de 16 [>]          │
│                           │
└───────────────────────────┘
```

---

## Colunas da Tabela

| Coluna | Descrição | Ordenável |
|--------|-----------|-----------|
| Nome | Nome da empresa | Sim |
| CNPJ | CNPJ formatado | Não |
| Status | Ativo/Inativo (badge) | Sim |
| Data Cadastro | Data de criação | Sim |
| Ações | Menu dropdown | Não |

---

## Filtros Disponíveis

| Filtro | Tipo | Descrição |
|--------|------|-----------|
| Nome | Input texto | Busca parcial (LIKE) |
| CNPJ | Input texto | Busca exata ou parcial |
| Status | Select | Todos / Ativo / Inativo |

---

## Tela Afetada

**URL:** `/admin/companies`

---

## Pontos para Validação com Cliente

1. **Colunas:** Quais colunas devem aparecer na tabela? Tem mais além das sugeridas?

2. **Filtros:** Os filtros sugeridos são suficientes? Precisa de mais algum?

3. **Exportação:** Precisa de botão para exportar lista (CSV/Excel)?

4. **Seleção múltipla:** Precisa selecionar várias empresas para ações em lote?

---

## Observações

- Essa refatoração servirá de base para outras telas que também usam cards.
- Componente de tabela pode ser reutilizado em outras listagens do admin.

---

**Próximos Passos:**
1. Cliente valida e aprova os requisitos
2. Definir colunas e filtros finais
3. Estimativa de esforço
4. Desenvolvimento
