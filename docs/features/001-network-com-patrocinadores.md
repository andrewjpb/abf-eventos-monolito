# Feature: Network com Patrocinadores

**Status:** Aguardando Aprovação
**Data:** 11/02/2026
**Versão:** 1.0

---

## Resumo

Permitir que participantes de eventos **presenciais** possam agendar bate-papos/reuniões com patrocinadores do evento, criando oportunidades de networking entre marcas e participantes.

---

## Regras de Negócio

### 1. Modal de Inscrição com Sucesso

- **RN-001:** Ao clicar em "Se Inscrever" em um evento **presencial**, após a confirmação da inscrição, deve abrir um modal informando que a inscrição foi realizada com sucesso.

- **RN-002:** Abaixo da mensagem de sucesso, deve exibir a lista de patrocinadores do evento disponíveis para networking.

- **RN-003:** Esta funcionalidade **NÃO** se aplica a inscrições em eventos online. Para eventos online, manter o fluxo atual sem exibição de patrocinadores.

### 2. Lista de Patrocinadores

- **RN-004:** Cada patrocinador deve ser exibido com:
  - Logo/imagem do patrocinador
  - Nome do patrocinador
  - Quantidade de vagas disponíveis para bate-papo

- **RN-005:** Ao passar o mouse (hover) sobre o patrocinador, deve exibir um **tooltip** com a chamada/texto promocional do patrocinador.

- **RN-006:** O participante pode selecionar **um ou mais** patrocinadores para solicitar bate-papo. *(Confirmar com cliente: limite de seleções por participante?)*

- **RN-007:** Patrocinadores sem vagas disponíveis devem aparecer como "Esgotado" e não permitir seleção.

### 3. Configuração de Bate-Papos (Lado do Admin)

- **RN-008:** Apenas o **administrador** do evento pode configurar os patrocinadores e bate-papos:
  - Quantidade de bate-papos disponíveis (ex: 5 vagas)
  - Duração de cada bate-papo em minutos (ex: 15 minutos)
  - Chamada/texto promocional para o tooltip

- **RN-009:** Cada vez que um participante seleciona um patrocinador, uma vaga é consumida automaticamente.

### 4. Aba de Bate-Papos no Evento (Gestão Admin)

- **RN-010:** Dentro da página de **gestão do evento** (mesma área do check-in), deve existir uma nova aba chamada "Bate-papo com Patrocinadores" (ou "Network com Marcas").

- **RN-011:** Esta aba deve exibir:
  - Lista de todos os participantes que selecionaram bate-papo, agrupados por patrocinador
  - Informações do participante (nome, email, telefone, etc.)
  - Quantidade de vagas utilizadas/disponíveis por patrocinador

- **RN-012:** Apenas **administradores** têm acesso a esta aba. Patrocinadores não acessam o sistema diretamente.

- **RN-013:** Deve existir um botão **"Exportar Participantes"** para cada patrocinador, permitindo que o admin exporte os dados dos participantes interessados (ex: CSV/Excel) para enviar ao patrocinador.

### 5. Visão do Participante

- **RN-014:** O participante deve ter acesso a visualizar os bate-papos que solicitou. *(Confirmar: onde? Na área "Meus Eventos"?)*

- **RN-015:** O participante deve receber confirmação (email/notificação?) após selecionar um patrocinador para bate-papo.

---

## Pontos para Validação com Cliente

1. **Limite de seleções:** O participante pode selecionar quantos patrocinadores quiser ou há um limite?

2. **Agendamento de horário:** O bate-papo é apenas uma "intenção" de conversa ou precisa de agendamento com data/hora específica?

3. **Notificações:** Enviar email para participante quando um bate-papo é solicitado?

4. **Cancelamento:** O participante pode cancelar a solicitação de bate-papo? A vaga volta a ficar disponível?

5. **Visualização do participante:** O participante consegue ver em algum lugar os bate-papos que solicitou? (ex: área "Meus Eventos")

---

## Fluxo do Usuário (User Flow)

```
┌─────────────────────────────────────────────────────────────────┐
│                    PARTICIPANTE                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Acessa página do evento PRESENCIAL                          │
│                     │                                            │
│                     ▼                                            │
│  2. Clica em "Se Inscrever"                                     │
│                     │                                            │
│                     ▼                                            │
│  3. Modal de Sucesso abre                                        │
│     ┌──────────────────────────────────┐                        │
│     │  ✓ Inscrição realizada!          │                        │
│     │                                   │                        │
│     │  Aproveite para conhecer nossos  │                        │
│     │  patrocinadores:                 │                        │
│     │                                   │                        │
│     │  [Logo1]  [Logo2]  [Logo3]       │                        │
│     │  5 vagas  3 vagas  Esgotado      │                        │
│     │                                   │                        │
│     │  [ Confirmar Seleção ]           │                        │
│     └──────────────────────────────────┘                        │
│                     │                                            │
│                     ▼                                            │
│  4. Hover no patrocinador → Tooltip com chamada                 │
│                     │                                            │
│                     ▼                                            │
│  5. Seleciona patrocinador(es) desejado(s)                      │
│                     │                                            │
│                     ▼                                            │
│  6. Confirma seleção → Vaga consumida                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    ADMINISTRADOR                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Acessa página de gestão do evento (área do check-in)        │
│                     │                                            │
│                     ▼                                            │
│  2. Aba "Bate-papo com Patrocinadores"                          │
│     ┌──────────────────────────────────┐                        │
│     │  Patrocinador: Empresa X         │                        │
│     │  Vagas: 3/5 utilizadas           │                        │
│     │                                   │                        │
│     │  Participantes:                  │                        │
│     │  - João Silva                    │                        │
│     │  - Maria Santos                  │                        │
│     │  - Pedro Costa                   │                        │
│     │                                   │                        │
│     │  [ Exportar Participantes ]      │                        │
│     └──────────────────────────────────┘                        │
│                     │                                            │
│                     ▼                                            │
│  3. Exporta CSV/Excel e envia para o patrocinador               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Entidades/Dados Necessários (Visão Inicial)

### Patrocinador do Evento (nova entidade ou extensão)
- ID do patrocinador
- ID do evento
- Nome
- Logo
- Chamada/texto para tooltip
- Quantidade de vagas para bate-papo
- Duração do bate-papo (minutos)
- Vagas disponíveis (calculado)

### Solicitação de Bate-Papo (nova entidade)
- ID da solicitação
- ID do participante (inscrição)
- ID do patrocinador
- ID do evento
- Data/hora da solicitação

---

## Definições Confirmadas

- **Acesso à gestão:** Apenas administradores podem gerenciar os bate-papos (na mesma página do check-in)
- **Dados para patrocinador:** O patrocinador não acessa o sistema. O admin exporta os dados e envia externamente.

---

## Observações

- Esta documentação contém a visão da feature baseada na descrição fornecida.
- Os pontos marcados para validação precisam ser esclarecidos antes do início do desenvolvimento.
- O esforço de desenvolvimento será estimado após aprovação dos requisitos.

---

**Próximos Passos:**
1. Cliente valida e aprova os requisitos
2. Esclarecimento dos pontos em aberto
3. Estimativa de esforço
4. Desenvolvimento
