# Feature: Slug na URL de Empresas

**Status:** Aguardando Aprovação
**Data:** 12/02/2026
**Versão:** 1.0

---

## Resumo

Adicionar **slug** nas URLs de empresas para torná-las mais amigáveis e legíveis. O sistema deve aceitar tanto o **ID** quanto o **slug** na URL.

---

## Problema Atual

URLs atuais usam apenas ID (UUID ou numérico):
```
/admin/companies/550e8400-e29b-41d4-a716-446655440000
/empresa/550e8400-e29b-41d4-a716-446655440000
```

**Problemas:**
- URL feia e difícil de lembrar
- Não amigável para SEO
- Difícil de compartilhar

---

## Solução Proposta

URLs com slug amigável:
```
/admin/companies/abf-franchising
/empresa/abf-franchising
```

Manter compatibilidade com ID:
```
/admin/companies/550e8400-e29b-41d4-a716-446655440000  ✅ Funciona
/admin/companies/abf-franchising                        ✅ Funciona
```

---

## Regras de Negócio

- **RN-001:** Adicionar campo `slug` na tabela de empresas.

- **RN-002:** Slug deve ser **único** (não pode repetir entre empresas).

- **RN-003:** Slug gerado automaticamente a partir do nome da empresa:
  - "ABF Franchising" → `abf-franchising`
  - "Empresa & Cia Ltda" → `empresa-cia-ltda`

- **RN-004:** Admin pode **editar o slug** manualmente se desejar.

- **RN-005:** URLs devem aceitar **ID ou slug** como parâmetro.

- **RN-006:** Validação do slug:
  - Apenas letras minúsculas, números e hífens
  - Sem espaços ou caracteres especiais
  - Mínimo 3 caracteres
  - Máximo 100 caracteres

- **RN-007:** Se slug for alterado, **redirecionar** URL antiga para nova (301) - opcional.

---

## Fluxo do Usuário (User Flow)

### Cadastro/Edição de Empresa

```
┌─────────────────────────────────────────────────────────────────┐
│  Editar Empresa                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Nome da Empresa *                                              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ABF Franchising                                             ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Slug (URL amigável) *                                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ abf-franchising                                     [🔄]    ││
│  └─────────────────────────────────────────────────────────────┘│
│  URL: /empresa/abf-franchising                                  │
│                                                                  │
│  [🔄] = Regenerar slug a partir do nome                        │
│                                                                  │
│  CNPJ *                                                         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 12.345.678/0001-90                                          ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  [... demais campos ...]                                        │
│                                                                  │
│                                         [Cancelar]  [Salvar]    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Validação de Slug Duplicado

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Slug (URL amigável) *                                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ abf-franchising                                             ││
│  └─────────────────────────────────────────────────────────────┘│
│  ⚠️ Este slug já está em uso. Sugestões:                        │
│     • abf-franchising-2                                         │
│     • abf-franchising-sp                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementação Técnica

### Modelo de Dados

```sql
ALTER TABLE companies ADD COLUMN slug VARCHAR(100) UNIQUE;

-- Índice para busca rápida
CREATE UNIQUE INDEX idx_companies_slug ON companies(slug);
```

### Busca por ID ou Slug

```typescript
// /api/companies/[idOrSlug]

async function getCompany(idOrSlug: string) {
  // Verifica se é UUID
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

  if (isUUID) {
    return await db.company.findUnique({ where: { id: idOrSlug } });
  } else {
    return await db.company.findUnique({ where: { slug: idOrSlug } });
  }
}
```

### Geração do Slug

```typescript
import slugify from 'slugify';

function generateSlug(name: string): string {
  return slugify(name, {
    lower: true,      // minúsculas
    strict: true,     // remove caracteres especiais
    locale: 'pt',     // suporte a português
  });
}

// "ABF Franchising" → "abf-franchising"
// "Empresa & Cia Ltda" → "empresa-cia-ltda"
// "Açaí do João" → "acai-do-joao"
```

---

## URLs Afetadas

| Antes | Depois |
|-------|--------|
| `/admin/companies/[id]` | `/admin/companies/[idOrSlug]` |
| `/admin/companies/[id]/edit` | `/admin/companies/[idOrSlug]/edit` |
| `/empresa/[id]` | `/empresa/[idOrSlug]` |

---

## Migração de Dados

Para empresas existentes, gerar slug automaticamente:

```sql
-- Script de migração
UPDATE companies
SET slug = LOWER(REGEXP_REPLACE(
  REGEXP_REPLACE(name, '[^a-zA-Z0-9\s]', '', 'g'),
  '\s+', '-', 'g'
));

-- Tratar duplicados adicionando sufixo
```

---

## Pontos para Validação com Cliente

1. **Página pública:** Empresa tem página pública (`/empresa/slug`) ou só admin?

2. **Redirect:** Se o slug for alterado, redirecionar URL antiga automaticamente?

3. **Empresas existentes:** Gerar slug para todas as empresas existentes no banco?

---

## Observações

- Melhora SEO se houver páginas públicas de empresas
- URLs mais fáceis de compartilhar e lembrar
- Mantém compatibilidade total com URLs antigas (por ID)

---

**Próximos Passos:**
1. Cliente valida e aprova os requisitos
2. Estimativa de esforço
3. Migração de dados existentes
4. Desenvolvimento
