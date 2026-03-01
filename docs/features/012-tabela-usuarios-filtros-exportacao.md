# Feature: Tabela de Usuários com Filtros e Exportação

**Status:** Aguardando Aprovação
**Data:** 12/02/2026
**Versão:** 1.0

---

## Resumo

Refatorar a tela de usuários (`/admin/users`) substituindo a visualização atual em **cards** por uma **tabela** com:
- Filtros de busca
- Paginação
- Ordenação por colunas
- **Exportação para Excel** (server-side com barra de progresso)

---

## Problema Atual

- Visualização em cards dificulta a gestão com muitos usuários
- Sem filtros para busca rápida
- Sem paginação
- Sem opção de exportar dados

---

## Regras de Negócio

### Tabela

- **RN-001:** Substituir cards por tabela na listagem de usuários.

- **RN-002:** Implementar **filtros**:
  - Nome (busca parcial)
  - Email (busca parcial)
  - CPF
  - Empresa vinculada
  - Status (ativo/inativo)
  - Data de cadastro (período)

- **RN-003:** Implementar **paginação**:
  - Padrão: 10 itens por página
  - Opções: 10, 25, 50, 100

- **RN-004:** Implementar **ordenação** por colunas clicáveis.

- **RN-005:** Layout **responsivo**.

### Exportação

- **RN-006:** Botão "Exportar Excel" visível na tela.

- **RN-007:** Exportação deve respeitar os **filtros aplicados**.

- **RN-008:** Processamento **100% server-side**:
  - Usuário clica em exportar
  - Servidor processa as queries
  - Gera arquivo Excel
  - Retorna download para o usuário

- **RN-009:** Exibir **barra de progresso** durante a exportação.

- **RN-010:** Para grandes volumes, processar em **background** e notificar quando pronto.

---

## Fluxo do Usuário (User Flow)

### Tela Principal

```
┌─────────────────────────────────────────────────────────────────┐
│  Admin > Usuários                                                │
│  /admin/users                                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [+ Novo Usuário]                        [📥 Exportar Excel]    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Filtros                                                    ││
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       ││
│  │  │ Nome...  │ │ Email... │ │ CPF...   │ │ Empresa ▼│       ││
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘       ││
│  │  ┌──────────┐ ┌──────────────────────┐                      ││
│  │  │ Status ▼ │ │ Período cadastro     │  [🔍 Buscar] [Limpar]│
│  │  └──────────┘ └──────────────────────┘                      ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Nome ↕        Email            Empresa      Cadastro  Ações││
│  │  ───────────────────────────────────────────────────────────││
│  │  João Silva    joao@email.com   ABC Ltda     10/01/26   ⋮   ││
│  │  Maria Santos  maria@email.com  XYZ S.A.     08/01/26   ⋮   ││
│  │  Pedro Costa   pedro@email.com  123 Corp     05/01/26   ⋮   ││
│  │  Ana Oliveira  ana@email.com    ABC Ltda     03/01/26   ⋮   ││
│  │  Carlos Lima   carlos@email.com DEF Inc      01/01/26   ⋮   ││
│  │  ...                                                        ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Mostrando 1-10 de 1.523 usuários   [<] [1] [2] [3] ... [>]    │
│  Itens por página: [10 ▼]                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Fluxo de Exportação

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Usuário clica em [📥 Exportar Excel]                           │
│                         │                                        │
│                         ▼                                        │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                                                              ││
│  │   Exportando usuários...                                    ││
│  │                                                              ││
│  │   ████████████████████░░░░░░░░░░░░░░  45%                   ││
│  │                                                              ││
│  │   Processando 687 de 1.523 registros                        ││
│  │                                                              ││
│  │   [Cancelar]                                                ││
│  │                                                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                         │                                        │
│                         ▼                                        │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                                                              ││
│  │   ✅ Exportação concluída!                                   ││
│  │                                                              ││
│  │   1.523 usuários exportados                                 ││
│  │                                                              ││
│  │   [📥 Baixar Arquivo]   [Fechar]                            ││
│  │                                                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementação Técnica - Exportação Server-Side

### Arquitetura

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│              │     │              │     │              │
│   Frontend   │────▶│   API Next   │────▶│   Banco de   │
│   (React)    │     │   (Server)   │     │    Dados     │
│              │◀────│              │◀────│              │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │
       │  Progress via      │  Gera Excel
       │  SSE/Polling       │  (streaming)
       ▼                    ▼
  Barra de             Arquivo .xlsx
  Progresso            para download
```

### Fluxo Técnico

1. **Frontend** envia request com filtros aplicados
2. **Backend** inicia job de exportação
3. **Backend** processa em chunks (ex: 500 registros por vez)
4. **Backend** envia progresso via **Server-Sent Events (SSE)** ou polling
5. **Frontend** atualiza barra de progresso
6. **Backend** gera arquivo Excel com biblioteca (ex: ExcelJS)
7. **Backend** retorna URL para download ou stream direto
8. **Frontend** dispara download automático

### Endpoint API

```typescript
// POST /api/admin/users/export
{
  filters: {
    name?: string,
    email?: string,
    cpf?: string,
    companyId?: string,
    status?: 'active' | 'inactive',
    dateFrom?: string,
    dateTo?: string
  }
}

// Response (SSE stream)
data: { progress: 25, processed: 380, total: 1523 }
data: { progress: 50, processed: 761, total: 1523 }
data: { progress: 75, processed: 1142, total: 1523 }
data: { progress: 100, processed: 1523, total: 1523, downloadUrl: "/api/exports/abc123.xlsx" }
```

### Biblioteca Sugerida

- **ExcelJS** - Geração de Excel com streaming (baixo consumo de memória)

```typescript
import ExcelJS from 'exceljs';

const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
  stream: res, // Stream direto para response
});
```

---

## Colunas da Tabela

| Coluna | Descrição | Ordenável | Exportar |
|--------|-----------|-----------|----------|
| Nome | Nome completo | Sim | Sim |
| Email | Email do usuário | Sim | Sim |
| CPF | CPF formatado | Não | Sim |
| Telefone | Telefone | Não | Sim |
| Empresa | Empresa vinculada | Sim | Sim |
| Cargo | Cargo na empresa | Não | Sim |
| Status | Ativo/Inativo | Sim | Sim |
| Data Cadastro | Data de criação | Sim | Sim |
| Ações | Menu dropdown | Não | Não |

---

## Filtros Disponíveis

| Filtro | Tipo | Descrição |
|--------|------|-----------|
| Nome | Input texto | Busca parcial |
| Email | Input texto | Busca parcial |
| CPF | Input texto | Busca exata ou parcial |
| Empresa | Select/Autocomplete | Filtrar por empresa |
| Status | Select | Todos / Ativo / Inativo |
| Período | Date range | Data de cadastro (de/até) |

---

## Formato do Excel Exportado

| Nome | Email | CPF | Telefone | Empresa | Cargo | Status | Cadastro |
|------|-------|-----|----------|---------|-------|--------|----------|
| João Silva | joao@email.com | 123.456.789-00 | (11) 99999-0000 | ABC Ltda | Gerente | Ativo | 10/01/2026 |
| Maria Santos | maria@email.com | 987.654.321-00 | (11) 98888-0000 | XYZ S.A. | Diretora | Ativo | 08/01/2026 |

---

## Tela Afetada

**URL:** `/admin/users`

---

## Observações

- Exportação server-side evita timeout e problemas de memória no navegador
- Streaming permite exportar grandes volumes (10k+ registros)
- Filtros são aplicados na exportação (exporta só o que está filtrado)
- Componente de tabela reutiliza padrão da tela de empresas

---

**Próximos Passos:**
1. Cliente valida e aprova os requisitos
2. Definir colunas e filtros finais
3. Estimativa de esforço
4. Desenvolvimento
