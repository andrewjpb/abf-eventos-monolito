# Feature: Melhorias nos Filtros de Inscrições (Admin)

**Status:** Aguardando Aprovação
**Data:** 11/02/2026
**Versão:** 1.0

---

## Resumo

Melhorar os filtros na tela de inscrições do admin (`/admin/enrollments/event/{id}`). Atualmente os filtros de **Segmento** e **Tipo de Participante** não estão exibindo todas as opções disponíveis.

---

## Situação Atual (Problema)

- **Filtro de Segmento:** Não está aparecendo todos os segmentos, apenas "Todos"
- **Filtro de Tipo de Participante:** Só aparece "Todos os tipos", não lista as opções individuais

---

## Situação Desejada

- **Filtro de Segmento:** Deve listar todos os segmentos cadastrados/disponíveis
- **Filtro de Tipo de Participante:** Deve listar todos os tipos de participante disponíveis

---

## Regras de Negócio

- **RN-001:** O filtro de **Segmento** deve listar os segmentos das empresas que possuem inscrições no evento (pegar da própria lista de inscritos).

- **RN-002:** O filtro de **Tipo de Participante** deve listar os tipos que existem dentro da lista de participantes do evento (dinâmico, baseado nos inscritos).

- **RN-003:** Ambos os filtros devem manter a opção "Todos" como primeira opção (para não filtrar).

- **RN-004:** Os filtros devem funcionar em conjunto (ex: filtrar por segmento X e tipo Y ao mesmo tempo).

---

## Definições Confirmadas

- **Segmentos:** Pegar da inscrição (segmento da empresa inscrita)
- **Tipos de participante:** Pegar dinamicamente da lista de participantes do evento
- **Outros filtros:** Não precisa ajustar

---

## Tela Afetada

**URL:** `/admin/enrollments/event/{eventId}`

```
┌─────────────────────────────────────────────────────────────────┐
│  Inscrições do Evento                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Filtros:                                                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Segmento      ▼ │  │ Tipo Partic.  ▼ │  │ Status        ▼ │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                  │
│  Problema atual:                                                 │
│  - Segmento: só mostra "Todos"                                  │
│  - Tipo Participante: só mostra "Todos os tipos"                │
│                                                                  │
│  Esperado:                                                       │
│  - Segmento: Todos, Franqueado, Fornecedor, Consultor, etc.     │
│  - Tipo: Todos, Associado, Não-associado, Convidado, etc.       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Observações

- Verificar se é um bug no carregamento dos dados ou se os filtros nunca foram implementados completamente.
- Os filtros devem ser dinâmicos, baseados nos dados existentes nas inscrições do evento.
- Todos os pontos técnicos foram definidos e confirmados.
- O esforço de desenvolvimento será estimado após aprovação dos requisitos.

---

**Próximos Passos:**
1. Cliente valida e aprova os requisitos
2. Estimativa de esforço
3. Desenvolvimento
