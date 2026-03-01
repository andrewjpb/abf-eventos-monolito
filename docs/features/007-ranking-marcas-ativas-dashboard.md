# Feature: Ranking de Empresas na Tela de Empresas

**Status:** Aguardando Aprovação
**Data:** 11/02/2026
**Versão:** 1.0

---

## Resumo

Adicionar métricas/ranking na tela de empresas (`/admin/companies`) mostrando:
1. **Empresas que mais participam** (mais check-ins em eventos presenciais)
2. **Empresas que mais inscrevem e NÃO participam** (inscrevem mas não fazem check-in)

**Importante:** Métricas apenas para eventos **presenciais**.

---

## Regras de Negócio

- **RN-001:** Na tela de empresas, exibir ranking de **empresas que mais participam** (maior número de check-ins em eventos presenciais).

- **RN-002:** Na tela de empresas, exibir ranking de **empresas que mais inscrevem e NÃO participam** (inscrições presenciais sem check-in).

- **RN-003:** Considerar apenas **eventos presenciais** para ambas as métricas.

- **RN-004:** Eventos online **não entram** nas métricas.

---

## Pontos para Validação com Cliente

1. **Período:** Mostrar dados de qual período? (ano atual, últimos 12 meses, filtro de período?)

2. **Limite:** Mostrar top 10, top 20, ou quantas empresas em cada ranking?

3. **Detalhamento:** Ao clicar na empresa, abrir detalhe com lista de eventos?

4. **Exportação:** Precisa exportar os rankings (CSV/Excel)?

5. **Localização:** Os rankings ficam no topo da página, em cards laterais, ou em abas separadas?

---

## Fluxo do Usuário (User Flow)

```
┌─────────────────────────────────────────────────────────────────┐
│  Empresas                                                        │
│  /admin/companies                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────────────┐  ┌───────────────────────────┐   │
│  │  MAIS PARTICIPAM          │  │  INSCREVEM E NÃO VÃO      │   │
│  │  (Check-ins presenciais)  │  │  (Sem check-in)           │   │
│  │                           │  │                           │   │
│  │  1. Empresa ABC - 45      │  │  1. Empresa XYZ - 12      │   │
│  │  2. Empresa DEF - 38      │  │  2. Empresa 123 - 8       │   │
│  │  3. Empresa GHI - 32      │  │  3. Empresa JKL - 6       │   │
│  │  4. Empresa JKL - 28      │  │  4. Empresa MNO - 5       │   │
│  │  5. Empresa MNO - 25      │  │  5. Empresa PQR - 4       │   │
│  │                           │  │                           │   │
│  └───────────────────────────┘  └───────────────────────────┘   │
│                                                                  │
│  [Lista de empresas existente...]                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tela Afetada

**URL:** `/admin/companies`

---

## Observações

- Métricas exclusivas para eventos presenciais.
- O esforço de desenvolvimento será estimado após aprovação dos requisitos.

---

**Próximos Passos:**
1. Cliente valida e aprova os requisitos
2. Esclarecimento dos pontos em aberto
3. Estimativa de esforço
4. Desenvolvimento
