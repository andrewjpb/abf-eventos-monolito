# Bug: Data do Evento Volta para o Dia Anterior ao Atualizar

**Status:** Aguardando Correção
**Data:** 12/02/2026
**Versão:** 1.0
**Tipo:** Bug

---

## Descrição do Problema

Ao atualizar **qualquer campo** dentro de um evento (ex: título, descrição, local, etc.), a **data do evento** está sendo alterada automaticamente para o **dia anterior**.

**Exemplo:**
- Evento com data: `15/03/2026`
- Admin edita o título do evento e salva
- Data do evento muda para: `14/03/2026`

---

## Causa Provável

Problema de **timezone/fuso horário** na conversão da data:
- Data salva no banco em UTC
- Ao carregar no formulário, converte para horário local
- Ao salvar, converte novamente sem considerar o offset corretamente
- Resultado: perde 1 dia (ou algumas horas que viram dia anterior)

---

## Passos para Reproduzir

1. Acessar `/admin/events/[id]/edit`
2. Verificar a data atual do evento
3. Alterar qualquer outro campo (ex: título)
4. Salvar o evento
5. Verificar que a data mudou para o dia anterior

---

## Comportamento Esperado

Ao atualizar qualquer campo do evento, a data deve **permanecer inalterada** se não foi modificada pelo usuário.

---

## Telas Afetadas

**URL:** `/admin/events/[id]/edit`

---

## Pontos para Investigação

1. Como a data está sendo serializada no formulário?
2. Qual o formato da data enviado para a API?
3. Como a API está parseando a data recebida?
4. O banco está salvando em UTC? A conversão está correta?
5. O campo de data está usando componente de date picker? Qual?

---

## Possíveis Soluções

1. **Enviar data em formato ISO com timezone:** `2026-03-15T00:00:00-03:00`
2. **Usar UTC consistentemente:** converter para UTC apenas no backend
3. **Não reenviar a data se não foi alterada:** comparar antes de salvar
4. **Ajustar o parsing no backend:** garantir que o timezone seja considerado

---

**Próximos Passos:**
1. Investigar o código de edição do evento
2. Identificar onde ocorre a perda do dia
3. Implementar correção
4. Testar em diferentes timezones
