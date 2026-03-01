# Feature: Gráfico de Participação do Usuário (Admin)

**Status:** Aguardando Aprovação
**Data:** 12/02/2026
**Versão:** 1.2

---

## Resumo

Adicionar duas visualizações de engajamento de usuários no painel administrativo:

1. **Dashboard Geral** (`/admin/users/dashboard`) - Ranking dos 10 usuários que mais fizeram check-in
2. **Dashboard Individual** (`/admin/users/[id]`) - Gráfico de engajamento do usuário específico

---

## Regras de Negócio

### Gerais

- **RN-001:** **NÃO contabilizar:**
  - Eventos cancelados (mesmo que o usuário tenha se inscrito)
  - Inscrições canceladas pelo próprio usuário
  - Inscrições pendentes/não aprovadas

- **RN-002:** Contabilizar **eventos presenciais E online** nas métricas.

- **RN-003:** Layout deve ser **responsivo** (funcionar em desktop e mobile).

### Dashboard Geral (`/admin/users/dashboard`)

- **RN-004:** Exibir ranking dos **Top 10 usuários** com mais check-ins realizados.

- **RN-005:** Mostrar para cada usuário: nome, quantidade de check-ins, e taxa de participação.

### Dashboard Individual (`/admin/users/[id]`)

- **RN-006:** Nova aba "Dashboard" na tela do usuário.

- **RN-007:** Exibir gráfico comparativo entre **inscrições vs participações** do usuário.

- **RN-008:** Mostrar taxa de participação do usuário.

---

## Fluxo do Usuário (User Flow)

### Tela 1: Dashboard Geral

```
┌─────────────────────────────────────────────────────────────────┐
│  Admin > Usuários > Dashboard                                    │
│  /admin/users/dashboard                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  TOP 10 USUÁRIOS MAIS ENGAJADOS                                 │
│  (Maior número de check-ins)                                    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  #   Usuário              Check-ins   Inscrições    Taxa    ││
│  │  ─────────────────────────────────────────────────────────  ││
│  │  1   João Silva           45          52            87%     ││
│  │  2   Maria Santos         38          45            84%     ││
│  │  3   Pedro Costa          35          40            88%     ││
│  │  4   Ana Oliveira         32          38            84%     ││
│  │  5   Carlos Lima          28          35            80%     ││
│  │  6   Fernanda Souza       25          30            83%     ││
│  │  7   Ricardo Alves        22          28            79%     ││
│  │  8   Juliana Dias         20          25            80%     ││
│  │  9   Bruno Martins        18          22            82%     ││
│  │  10  Camila Rocha         15          20            75%     ││
│  │                                                              ││
│  │  [Clique no usuário para ver detalhes]                      ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Tela 2: Dashboard Individual (Usuário Específico)

```
┌─────────────────────────────────────────────────────────────────┐
│  Admin > Usuários > João Silva                                  │
│  /admin/users/[id]                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Dados] [Inscrições] [Dashboard]  ← Nova aba                   │
│                         ─────────                                │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  HISTÓRICO DE PARTICIPAÇÃO                                  ││
│  │                                                              ││
│  │  ┌─────────────────┐    ┌─────────────────┐                 ││
│  │  │                 │    │                 │                 ││
│  │  │       52        │    │       45        │                 ││
│  │  │                 │    │                 │                 ││
│  │  │   Inscrições    │    │  Participações  │                 ││
│  │  │    (Total)      │    │   (Check-ins)   │                 ││
│  │  └─────────────────┘    └─────────────────┘                 ││
│  │                                                              ││
│  │              Taxa de participação: 87%                      ││
│  │                                                              ││
│  │  ┌─────────────────────────────────────────────────────┐   ││
│  │  │                                                     │   ││
│  │  │   ████████████████████████████  52 Inscritos       │   ││
│  │  │   █████████████████████████     45 Participados    │   ││
│  │  │                                                     │   ││
│  │  └─────────────────────────────────────────────────────┘   ││
│  │                                                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Versão Mobile (Responsivo)

```
┌───────────────────────────┐
│  Dashboard Usuários       │
├───────────────────────────┤
│  TOP 10 MAIS ENGAJADOS    │
│                           │
│  1. João Silva            │
│     45 check-ins (87%)    │
│                           │
│  2. Maria Santos          │
│     38 check-ins (84%)    │
│                           │
│  3. Pedro Costa           │
│     35 check-ins (88%)    │
│  ...                      │
└───────────────────────────┘
```

---

## Telas Afetadas

| Tela | URL | Descrição |
|------|-----|-----------|
| Dashboard Geral | `/admin/users/dashboard` | Nova página com ranking Top 10 |
| Dashboard Individual | `/admin/users/[id]` | Nova aba "Dashboard" na tela do usuário |

**Sidebar:** Seção "Usuários" → novo item "Dashboard"

---

## Métricas Calculadas

| Métrica | Cálculo |
|---------|---------|
| Total Inscritos | COUNT de inscrições ativas (excluindo canceladas e eventos cancelados) |
| Total Participados | COUNT de inscrições com check-in realizado |
| Taxa de Participação | (Participados / Inscritos) × 100% |

---

## O que NÃO entra na contagem

- Eventos cancelados pelo organizador
- Inscrições canceladas pelo usuário
- Inscrições pendentes/não aprovadas

---

## Observações

- Inclui eventos presenciais e online.
- Layout responsivo para acesso em qualquer dispositivo.
- Clicar no usuário no ranking leva para o dashboard individual dele.

---

**Próximos Passos:**
1. Cliente valida e aprova os requisitos
2. Estimativa de esforço
3. Desenvolvimento
