# Feature: Email de Confirmação para Inscrição Manual

**Status:** Aguardando Aprovação
**Data:** 11/02/2026
**Versão:** 1.0

---

## Resumo

Quando o administrador adiciona um participante manualmente em um evento, o sistema deve enviar automaticamente um email de confirmação para o participante informando que ele está inscrito no evento.

---

## Regras de Negócio

- **RN-001:** Ao adicionar um participante manualmente via área administrativa, o sistema deve **disparar automaticamente** um email de confirmação para o participante.

- **RN-002:** Utilizar o **mesmo template de email** que já é enviado quando o participante faz inscrição pelo site.

- **RN-003:** O email deve informar o **tipo de inscrição** (Presencial ou Online), conforme já funciona hoje.

- **RN-004:** O formulário de adicionar participante deve ter um **checkbox** para o admin escolher **não enviar email** em casos específicos.

- **RN-005:** Por padrão, o checkbox deve vir **marcado** (enviar email). O admin desmarca se não quiser enviar.

---

## Definições Confirmadas

- **Conteúdo do email:** Mesmo modelo da inscrição pelo site
- **Template:** Reutilizar template existente
- **Tipo de inscrição:** Sim, informar (como já está hoje)
- **Opção de não enviar:** Checkbox para desativar envio

---

## Fluxo do Usuário (User Flow)

```
┌─────────────────────────────────────────────────────────────────┐
│                    ADMINISTRADOR                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Acessa área de gestão do evento                             │
│                     │                                            │
│                     ▼                                            │
│  2. Clica em "Adicionar Participante"                           │
│                     │                                            │
│                     ▼                                            │
│  3. Preenche dados do participante                              │
│     ┌──────────────────────────────────┐                        │
│     │  Nome: João Silva                │                        │
│     │  Email: joao@email.com           │                        │
│     │  CPF: 12345678900                │                        │
│     │  Tipo: [Presencial v]            │                        │
│     │                                   │                        │
│     │  [✓] Enviar email de confirmação │                        │
│     │                                   │                        │
│     │  [ Cancelar ]  [ Salvar ]        │                        │
│     └──────────────────────────────────┘                        │
│                     │                                            │
│                     ▼                                            │
│  4. Sistema salva inscrição                                      │
│                     │                                            │
│                     ▼                                            │
│  5. Sistema dispara email automaticamente                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    PARTICIPANTE (Email)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────┐                           │
│  │  Olá João,                       │                           │
│  │                                   │                           │
│  │  Sua inscrição no evento         │                           │
│  │  "Nome do Evento" está           │                           │
│  │  confirmada!                      │                           │
│  │                                   │                           │
│  │  Data: 15/03/2026                │                           │
│  │  Horário: 14:00                  │                           │
│  │  Local: Av. Exemplo, 123         │                           │
│  │  Tipo: Presencial                │                           │
│  │                                   │                           │
│  └──────────────────────────────────┘                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Observações

- Reutilizar o template de email já existente para inscrições via site.
- Todos os pontos técnicos foram definidos e confirmados.
- O esforço de desenvolvimento será estimado após aprovação dos requisitos.

---

**Próximos Passos:**
1. Cliente valida e aprova os requisitos
2. Estimativa de esforço
3. Desenvolvimento
