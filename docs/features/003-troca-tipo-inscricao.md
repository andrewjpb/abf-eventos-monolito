# Feature: Troca de Tipo de Inscrição (Online/Presencial)

**Status:** Aguardando Aprovação
**Data:** 11/02/2026
**Versão:** 1.0

---

## Resumo

Permitir que o administrador do evento altere o tipo de inscrição de um participante entre **Online** e **Presencial** (e vice-versa) diretamente na área administrativa.

---

## Regras de Negócio

### 1. Troca de Tipo de Inscrição

- **RN-001:** O administrador deve poder alterar o tipo de inscrição de um participante de **Online para Presencial** ou de **Presencial para Online**.

- **RN-002:** A opção de troca deve estar disponível na **página de check-in** do evento, com um botão de **editar** na inscrição.

- **RN-003:** A troca deve ser realizada de forma individual (por participante).

- **RN-004:** Ao clicar em trocar, deve abrir um **modal de confirmação** antes de efetuar a alteração.

- **RN-005:** O limite de vagas **não se aplica** para o administrador. Mesmo que o presencial esteja lotado, o admin pode trocar de online para presencial.

- **RN-006:** Se o participante **já fez check-in**, a opção de trocar tipo **não deve estar disponível** (bloquear alteração).

### 2. Notificação

- **RN-007:** Após a troca, o sistema deve **enviar email** para o participante informando que o tipo de inscrição foi alterado e qual foi a alteração (ex: "Sua inscrição foi alterada de Online para Presencial").

### 3. Integração com Bate-papo de Patrocinadores (Feature 001)

- **RN-008:** Se o participante tinha solicitações de bate-papo com patrocinadores e a inscrição for alterada de **Presencial para Online**, os bate-papos devem ser **cancelados automaticamente**.

- **RN-009:** As vagas dos bate-papos cancelados devem voltar a ficar disponíveis para outros participantes.

---

## Definições Confirmadas

- **Localização:** Página de check-in, botão de editar
- **Modal de confirmação:** Sim
- **Limite de vagas:** Ignorado para admin
- **Histórico:** Log normal do sistema
- **Email:** Sim, informar participante da alteração
- **Após check-in:** Bloqueia alteração
- **Bate-papos (presencial→online):** Cancela automaticamente

---

## Fluxo do Usuário (User Flow)

```
┌─────────────────────────────────────────────────────────────────┐
│                    ADMINISTRADOR                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Acessa página de check-in do evento                         │
│                     │                                            │
│                     ▼                                            │
│  2. Visualiza lista de inscritos                                │
│     ┌────────────────────────────────────────────────────┐      │
│     │  Nome         │ Tipo       │ Check-in │ Ações      │      │
│     │───────────────│────────────│──────────│────────────│      │
│     │  João Silva   │ Presencial │ ✗        │ [Editar]   │      │
│     │  Maria Santos │ Online     │ -        │ [Editar]   │      │
│     │  Pedro Costa  │ Presencial │ ✓        │ [Bloq.]    │      │
│     └────────────────────────────────────────────────────┘      │
│                     │                                            │
│                     ▼                                            │
│  3. Clica em "Editar" na inscrição (sem check-in)               │
│                     │                                            │
│                     ▼                                            │
│  4. Modal de confirmação                                         │
│     ┌──────────────────────────────────┐                        │
│     │  Trocar tipo de inscrição?       │                        │
│     │                                   │                        │
│     │  João Silva                      │                        │
│     │  Presencial → Online             │                        │
│     │                                   │                        │
│     │  ⚠ Bate-papos com patrocinadores │                        │
│     │    serão cancelados.             │                        │
│     │                                   │                        │
│     │  [ Cancelar ]  [ Confirmar ]     │                        │
│     └──────────────────────────────────┘                        │
│                     │                                            │
│                     ▼                                            │
│  5. Tipo alterado + Email enviado ao participante               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Nota:** Participantes com check-in confirmado não podem ter o tipo alterado.

---

## Observações

- Esta feature possui integração com a Feature 001 (Network com Patrocinadores): ao trocar de presencial para online, os bate-papos são cancelados.
- Todos os pontos técnicos foram definidos e confirmados.
- O esforço de desenvolvimento será estimado após aprovação dos requisitos.

---

**Próximos Passos:**
1. Cliente valida e aprova os requisitos
2. Estimativa de esforço
3. Desenvolvimento
