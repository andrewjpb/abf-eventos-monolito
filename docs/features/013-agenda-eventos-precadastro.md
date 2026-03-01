# Feature: Agenda de Eventos com Pré-Cadastro (Save the Date)

**Status:** Aguardando Aprovação
**Data:** 12/02/2026
**Versão:** 1.0

---

## Resumo

Criar um módulo de **Agenda de Eventos** com pré-cadastro, funcionando como um "Save the Date". Permite:

1. **Pré-cadastrar eventos** na agenda (planejamento futuro)
2. **Vincular** um evento real a um item da agenda quando for criá-lo
3. **Reutilizar ou alterar** o título do pré-cadastro

---

## Conceito

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│   AGENDA (Save the Date)           EVENTOS (Reais)              │
│                                                                  │
│   ┌─────────────────────┐         ┌─────────────────────┐       │
│   │ Congresso ABF 2026  │ ──────▶ │ Congresso ABF 2026  │       │
│   │ Março 2026          │ VINCULA │ 15/03/2026 - 14h    │       │
│   │ (Planejado)         │         │ (Publicado)         │       │
│   └─────────────────────┘         └─────────────────────┘       │
│                                                                  │
│   ┌─────────────────────┐                                       │
│   │ Workshop Marketing  │         (Ainda não criado)            │
│   │ Abril 2026          │                                       │
│   │ (Planejado)         │                                       │
│   └─────────────────────┘                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Regras de Negócio

### Agenda (Pré-Cadastro)

- **RN-001:** Admin pode criar itens na **Agenda** com informações básicas:
  - Título do evento
  - Mês/Ano previsto (ou data aproximada)
  - Descrição breve (opcional)
  - Tipo de evento (presencial/online/híbrido)

- **RN-002:** Itens da agenda são apenas **planejamento** (não abrem inscrições).

- **RN-003:** Agenda pode ser exibida publicamente como "Save the Date" (eventos futuros planejados).

### Vínculo Agenda ↔ Evento

- **RN-004:** Ao criar um novo evento, o admin pode **selecionar um item da agenda** para vincular.

- **RN-005:** Ao vincular, o sistema **pré-preenche** os dados do evento com as informações da agenda.

- **RN-006:** Admin pode **manter ou alterar** o título e demais informações.

- **RN-007:** Um item da agenda pode ter **apenas um evento vinculado**.

- **RN-008:** Um evento pode existir **sem vínculo** com a agenda (criação direta).

### Status da Agenda

- **RN-009:** Itens da agenda possuem status:
  - `planejado` - Apenas na agenda, sem evento vinculado
  - `vinculado` - Evento real foi criado e vinculado
  - `cancelado` - Item removido do planejamento

---

## Fluxo do Usuário (User Flow)

### Tela 1: Agenda de Eventos

```
┌─────────────────────────────────────────────────────────────────┐
│  Admin > Agenda de Eventos                                       │
│  /admin/agenda                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [+ Novo Item na Agenda]                                        │
│                                                                  │
│  2026                                                           │
│  ────────────────────────────────────────────────────────────── │
│                                                                  │
│  MARÇO                                                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 📅 Congresso ABF 2026                                       ││
│  │    Presencial • São Paulo                                   ││
│  │    Status: ✅ Vinculado ao evento #123                      ││
│  │                                          [Ver Evento] [⋮]   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ABRIL                                                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 📅 Workshop de Marketing Digital                            ││
│  │    Online                                                   ││
│  │    Status: 🕐 Planejado                                     ││
│  │                                      [Criar Evento] [⋮]     ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  MAIO                                                           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 📅 Encontro Regional Sul                                    ││
│  │    Presencial • Porto Alegre                                ││
│  │    Status: 🕐 Planejado                                     ││
│  │                                      [Criar Evento] [⋮]     ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Tela 2: Criar Item na Agenda

```
┌─────────────────────────────────────────────────────────────────┐
│  Novo Item na Agenda (Save the Date)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Título *                                                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Workshop de Marketing Digital                               ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Previsão *                                                     │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │ Abril      ▼ │  │ 2026       ▼ │                            │
│  └──────────────┘  └──────────────┘                            │
│                                                                  │
│  Tipo *                                                         │
│  ○ Presencial   ● Online   ○ Híbrido                           │
│                                                                  │
│  Local (opcional)                                               │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                                                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Descrição (opcional)                                           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Evento focado em estratégias de marketing...                ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ☐ Exibir publicamente como "Save the Date"                    │
│                                                                  │
│                                    [Cancelar]  [Salvar na Agenda]│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Tela 3: Criar Evento Vinculando à Agenda

```
┌─────────────────────────────────────────────────────────────────┐
│  Novo Evento                                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 📅 Vincular a um item da Agenda (opcional)                  ││
│  │                                                              ││
│  │  ┌───────────────────────────────────────────────────────┐  ││
│  │  │ Selecione um item da agenda...                      ▼ │  ││
│  │  └───────────────────────────────────────────────────────┘  ││
│  │                                                              ││
│  │  Itens disponíveis:                                         ││
│  │  • Workshop de Marketing Digital (Abril/2026)               ││
│  │  • Encontro Regional Sul (Maio/2026)                        ││
│  │  • Seminário de Vendas (Junho/2026)                         ││
│  │                                                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ────────────────────────────────────────────────────────────── │
│                                                                  │
│  Título *                          [Preenchido automaticamente] │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Workshop de Marketing Digital                               ││
│  └─────────────────────────────────────────────────────────────┘│
│  ☐ Usar título diferente                                       │
│                                                                  │
│  Data e Hora *                                                  │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │ 15/04/2026   │  │ 14:00        │                            │
│  └──────────────┘  └──────────────┘                            │
│                                                                  │
│  Tipo: ● Online (herdado da agenda)                            │
│                                                                  │
│  [... demais campos do evento ...]                              │
│                                                                  │
│                                       [Cancelar]  [Criar Evento]│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Tela 4: Página Pública "Save the Date"

```
┌─────────────────────────────────────────────────────────────────┐
│  Próximos Eventos - Save the Date                               │
│  /eventos/agenda                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Confira os eventos planejados para 2026:                       │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                                                              ││
│  │  📅 ABRIL 2026                                              ││
│  │  Workshop de Marketing Digital                              ││
│  │  Online                                                     ││
│  │                                                              ││
│  │  Inscrições em breve!                                       ││
│  │                                                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                                                              ││
│  │  📅 MAIO 2026                                               ││
│  │  Encontro Regional Sul                                      ││
│  │  Presencial • Porto Alegre                                  ││
│  │                                                              ││
│  │  Inscrições em breve!                                       ││
│  │                                                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Modelo de Dados

### Tabela: `agenda_items`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| title | String | Título do evento planejado |
| month | Int | Mês previsto (1-12) |
| year | Int | Ano previsto |
| type | Enum | presencial / online / híbrido |
| location | String? | Local previsto (opcional) |
| description | String? | Descrição breve |
| is_public | Boolean | Exibir como Save the Date |
| status | Enum | planejado / vinculado / cancelado |
| event_id | UUID? | FK para evento vinculado |
| created_at | DateTime | Data de criação |

### Relacionamento

```
agenda_items (1) ───────── (0..1) events
              Um item da agenda pode ter
              zero ou um evento vinculado
```

---

## Telas Afetadas

| Tela | URL | Descrição |
|------|-----|-----------|
| Agenda (Admin) | `/admin/agenda` | Nova tela - Lista de itens da agenda |
| Novo Item Agenda | `/admin/agenda/new` | Nova tela - Criar pré-cadastro |
| Criar Evento | `/admin/events/new` | Alterar - Adicionar seleção de agenda |
| Save the Date (Público) | `/eventos/agenda` | Nova tela - Página pública |

---

## Pontos para Validação com Cliente

1. **Página pública:** A página "Save the Date" deve ser pública ou só para membros logados?

2. **Notificação:** Quando o evento real for criado, notificar usuários interessados?

3. **Interesse:** Usuário pode marcar "Tenho interesse" num Save the Date antes das inscrições abrirem?

4. **Recorrência:** Eventos anuais recorrentes devem ser pré-criados automaticamente na agenda?

---

## Observações

- Agenda funciona como planejamento interno e/ou divulgação antecipada
- Facilita a criação de eventos já previstos
- Mantém histórico de eventos planejados vs realizados

---

**Próximos Passos:**
1. Cliente valida e aprova os requisitos
2. Esclarecimento dos pontos em aberto
3. Estimativa de esforço
4. Desenvolvimento
