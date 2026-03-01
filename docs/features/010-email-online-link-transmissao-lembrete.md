# Feature: Correção Email Online + Lembrete de Evento

**Status:** Aguardando Aprovação
**Data:** 12/02/2026
**Versão:** 1.0

---

## Resumo

Esta feature contempla duas melhorias no sistema de emails:

1. **Bug Fix:** Email de confirmação de eventos **online** está enviando endereço físico ao invés do link de transmissão
2. **Nova Feature:** Enviar **email de lembrete** 1 dia antes do evento para todos os inscritos

---

## Parte 1: Correção do Email para Eventos Online

### Descrição do Problema

Quando um usuário se inscreve em um evento **online**, o email de confirmação está exibindo o **endereço físico/local** ao invés do **link de transmissão**.

### Comportamento Atual (Errado)

```
Olá João,

Sua inscrição foi confirmada!

Evento: Webinar de Marketing Digital
Data: 20/03/2026 às 14h
Local: Rua das Flores, 123 - São Paulo/SP  ❌ ERRADO
```

### Comportamento Esperado (Correto)

```
Olá João,

Sua inscrição foi confirmada!

Evento: Webinar de Marketing Digital
Data: 20/03/2026 às 14h
Link de Transmissão: https://zoom.us/j/123456789  ✅ CORRETO
```

### Regras de Negócio

- **RN-001:** Se o evento for **online**, exibir "Link de Transmissão" no email.
- **RN-002:** Se o evento for **presencial**, exibir "Local" com endereço físico.
- **RN-003:** Se o evento for **híbrido**, exibir ambos (local + link).

---

## Parte 2: Email de Lembrete 1 Dia Antes

### Descrição

Enviar automaticamente um **email de lembrete** para todos os usuários inscritos em um evento, **1 dia antes** da data do evento.

### Regras de Negócio

- **RN-004:** Enviar lembrete **24 horas antes** do início do evento.
- **RN-005:** Enviar apenas para inscrições **ativas** (não canceladas).
- **RN-006:** Não enviar para eventos **cancelados**.
- **RN-007:** Incluir no email:
  - Nome do evento
  - Data e horário
  - Local (presencial) ou Link de transmissão (online)
  - Botão/link para "Ver detalhes"

### Template do Email de Lembrete

```
Assunto: Lembrete: [Nome do Evento] é amanhã!

─────────────────────────────────────────

Olá [Nome],

Este é um lembrete de que você está inscrito no evento:

📅 [Nome do Evento]
🗓️ Data: [Data] às [Horário]
📍 Local: [Endereço] (presencial)
   ou
🔗 Link: [URL de transmissão] (online)

Esperamos você lá!

[Botão: Ver Detalhes do Evento]

─────────────────────────────────────────
```

---

## Implementação Técnica

### Solução: Serviço NestJS Externo

Criar um **microserviço NestJS** separado, conectado ao mesmo banco de dados, responsável por:
- Cron jobs (lembretes, notificações)
- Integrações externas futuras
- Processamentos em background

**Vantagens:**
- Desacoplado do Next.js (não impacta performance do frontend)
- Facilita adicionar novas integrações no futuro
- Melhor controle sobre jobs agendados
- Pode escalar independentemente

### Arquitetura

```
┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │
│    Next.js      │      │    NestJS       │
│   (Frontend +   │      │  (Cron Jobs +   │
│     API)        │      │  Integrações)   │
│                 │      │                 │
└────────┬────────┘      └────────┬────────┘
         │                        │
         │    ┌───────────┐       │
         └────┤  Banco de ├───────┘
              │   Dados   │
              └───────────┘
```

### Estrutura do NestJS

```
nest-jobs/
├── src/
│   ├── cron/
│   │   ├── cron.module.ts
│   │   └── event-reminder.service.ts
│   ├── email/
│   │   ├── email.module.ts
│   │   └── email.service.ts
│   ├── database/
│   │   └── database.module.ts
│   └── app.module.ts
├── package.json
└── .env
```

### Exemplo do Cron no NestJS

```typescript
// event-reminder.service.ts
@Injectable()
export class EventReminderService {
  @Cron('0 9 * * *') // Todo dia às 9h
  async sendReminders() {
    // 1. Buscar eventos de amanhã
    // 2. Buscar inscritos ativos
    // 3. Enviar emails
  }
}
```

### Fluxo do Cron Job

```
┌─────────────────────────────────────────────────────────────┐
│  CRON JOB (Executa diariamente às 9h)                       │
│  /api/cron/send-event-reminders                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Buscar eventos que acontecem AMANHÃ                     │
│     WHERE event_date = CURRENT_DATE + 1                     │
│     AND status != 'cancelled'                               │
│                                                              │
│  2. Para cada evento, buscar inscrições ativas              │
│     WHERE status = 'confirmed'                              │
│                                                              │
│  3. Enviar email de lembrete para cada inscrito             │
│                                                              │
│  4. Registrar log de envio                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Pontos para Validação com Cliente

1. **Horário do lembrete:** Enviar às 9h da manhã está ok? Outro horário?

2. **Fuso horário:** Considerar qual timezone para o envio?

3. **Eventos com horário noturno:** Se o evento é às 20h de terça, o lembrete vai segunda às 9h (mais de 24h antes). Está ok?

4. **Múltiplos dias:** Se o evento dura 3 dias, enviar lembrete só do primeiro dia?

5. **Opt-out:** Usuário pode desativar lembretes?

---

## Telas/Endpoints Afetados

| Item | Localização |
|------|-------------|
| Template email confirmação | Ajustar para verificar tipo do evento |
| Novo endpoint cron | `/api/cron/send-event-reminders` |
| Template email lembrete | Criar novo template |

---

## Observações

- Requer configuração de serviço de email (Resend, SendGrid, etc.)
- Requer configuração de cron job (Vercel, Upstash, ou externo)
- Considerar rate limits do serviço de email para eventos grandes

---

**Próximos Passos:**
1. Cliente valida e aprova os requisitos
2. Definir serviço de cron a ser utilizado
3. Estimativa de esforço
4. Desenvolvimento
