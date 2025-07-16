# Pasta de Redirects

Esta pasta contém rotas de redirecionamento para manter compatibilidade com URLs antigas do sistema.

## Estrutura de Redirects

### `/app/event/[id]` → `/eventos/[id]`

**Motivo**: Links antigos que foram divulgados com a estrutura `/app/event/[id]` precisam redirecionar para a nova estrutura `/eventos/[id]`.

**Implementação**: 
- Utiliza `redirect()` do Next.js para redirecionamento 301 (permanente)
- Metadados configurados com `noindex, nofollow` para não indexar páginas de redirect
- Redirect automático e transparente para o usuário

## Como funciona

1. Usuário acessa link antigo: `https://eventos.abf.com.br/app/event/123`
2. Sistema captura o ID do evento (123)
3. Redireciona automaticamente para: `https://eventos.abf.com.br/eventos/123`

## Manutenção

- Manter estes redirects enquanto links antigos estiverem circulando
- Pode ser removido após período de transição (recomendado: 6-12 meses)
- Monitorar logs de acesso para verificar uso dos redirects