# Boas Práticas - ABF Eventos

## Convenções de Código

### TypeScript

- Use tipagem estrita para todas as funções, componentes e variáveis
- Defina interfaces ou types para todas as entidades em arquivos `types.ts`
- Utilize Zod para validação de dados de entrada

```typescript
// ✅ Correto: tipagem bem definida
interface SpeakerWithEvents {
  id: string;
  description: string | null;
  moderatorId: string;
  users: UserBasic;
  events: EventBasic[];
}

// ❌ Incorreto: uso de any
const updateSpeaker = async (data: any) => { /* ... */ }
```

### Estrutura de Arquivos

- Organize código por domínio/feature, não por tipo de arquivo
- Utilize nomes de arquivo em kebab-case para componentes e arquivos
- Organize Server Actions com nomes padrão (verbos seguidos de substantivos)

```diff
// ✅ Correto: organização por feature
src/features/events/
  actions/
    delete-event.ts
    update-event-status.ts
  components/
    event-card.tsx
  queries/
    get-event.ts

// ❌ Incorreto: organização por tipo
src/
  actions/
    event.ts
    speaker.ts
  components/
    Card.tsx
    List.tsx
```

### Componentes React

- Use `"use client"` diretiva apenas nos componentes que precisam de interatividade
- Extraia lógica complexa para hooks customizados
- Utilize componentes de UI padronizados de `components/ui/`

```tsx
// ✅ Correto: componente com tipagem e parâmetro opcionais claros
"use client"

import { Button } from "@/components/ui/button"

interface EventCardProps {
  event: EventType;
  showActions?: boolean;
}

export function EventCard({ event, showActions = false }: EventCardProps) {
  return (/* ... */)
}

// ❌ Incorreto: sem tipagem, sem declaração de lado cliente
function EventCard(props) {
  return (/* ... */)
}
```

### Server Actions

- Sempre inicie com `"use server"`
- Implemente verificação de permissões com `getAuthWithPermission()`
- Use `toActionState` para padronizar retornos
- Implemente validação com Zod
- Registre logs para operações importantes

```typescript
// ✅ Correto: Server Action com validação, autorização e logs
"use server"

import { z } from "zod"
import { getAuthWithPermission } from "@/features/auth/queries/get-auth-with-permission"
import { toActionState } from "@/components/form/utils/to-action-state"
import { logInfo } from "@/features/logs/queries/add-log"

const schema = z.object({
  title: z.string().min(3).max(100),
  date: z.string().datetime(),
  // ...outros campos
})

export async function updateEvent(eventId: string, formData: FormData) {
  const { user, error } = await getAuthWithPermission("events.update")
  if (error) {
    return toActionState("ERROR", "Sem permissão para esta operação")
  }
  
  try {
    const data = schema.parse(/* dados do FormData */)
    // Lógica de atualização
    await logInfo("Event.update", `Evento ${eventId} atualizado`, user.id, {})
    return toActionState("SUCCESS", "Evento atualizado com sucesso")
  } catch (error) {
    // Tratamento de erro
    return toActionState("ERROR", "Erro ao atualizar evento")
  }
}

// ❌ Incorreto: sem validação ou controle de permissão
export async function updateEvent(eventId, data) {
  try {
    // Atualiza dados diretamente sem validar
    return { success: true }
  } catch (error) {
    return { success: false }
  }
}
```

### Queries

- Use `cache` para queries que serão reutilizadas
- Implemente paginação para listagens com muitos itens
- Siga nomenclatura padronizada (`get` + entidade)

```typescript
// ✅ Correto: query com cache e tipagem
import { cache } from "react"
import { prisma } from "@/lib/prisma"
import { EventWithDetails } from "../types"

export const getEvent = cache(async (id: string): Promise<EventWithDetails | null> => {
  const event = await prisma.events.findUnique({
    where: { id },
    include: {
      address: true,
      speakers: {
        include: { users: true }
      }
    }
  })
  
  if (!event) return null
  
  return event as EventWithDetails
})

// ❌ Incorreto: sem cache, tipagem inadequada
export async function fetchEvent(id) {
  return await prisma.events.findUnique({
    where: { id }
  })
}
```

## Padrão de Commits

Seguimos o padrão [Conventional Commits](https://www.conventionalcommits.org/) com a seguinte estrutura:

```
<tipo>(<escopo>): <descrição>

[corpo opcional]

[rodapé(s) opcional(is)]
```

### Tipos de Commit

- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Alterações em documentação
- `style`: Alterações que não afetam o código (formatação, espaços, etc.)
- `refactor`: Refatoração de código
- `perf`: Melhorias de performance
- `test`: Adição ou correção de testes
- `chore`: Alterações no processo de build, ferramentas, etc.

### Exemplos

```
feat(users): adicionar filtro por empresa na listagem

fix(events): corrigir contagem de vagas disponíveis

refactor(auth): simplificar processo de verificação de permissões
```

## Workflow de Branches e PRs

1. **Branches**:
   - `main`: Branch principal, contém código estável
   - `feat/nome-da-feature`: Para novas funcionalidades
   - `fix/descricao-do-bug`: Para correções de bugs
   - `refactor/descricao`: Para refatorações

2. **Processo de Pull Request**:
   - Crie branch a partir de `main`
   - Implemente mudanças com commits atômicos
   - Abra PR para `main` com descrição detalhada
   - Aguarde revisão de código
   - Faça merge após aprovação

3. **Proteções de Branch**:
   - `main` requer aprovação de PR
   - Verificações de CI devem passar antes do merge

## Normas de Teste

- Testes unitários para componentes isolados
- Testes de integração para Server Actions
- Testes e2e para fluxos completos
- Cobertura mínima: 75% para módulos principais

```typescript
// ✅ Correto: teste unitário de componente
import { render, screen } from "@testing-library/react"
import { EventCard } from "./event-card"

describe("EventCard", () => {
  it("should render event title", () => {
    render(<EventCard event={{ title: "Evento Teste", /* ... */ }} />)
    expect(screen.getByText("Evento Teste")).toBeInTheDocument()
  })
})

// ✅ Correto: teste de Server Action
import { updateEvent } from "./update-event"
import { mockAuth } from "@/test/helpers"

describe("updateEvent", () => {
  it("should update event when user has permission", async () => {
    mockAuth("events.update")
    const result = await updateEvent("event-id", /* form data mock */)
    expect(result.status).toBe("SUCCESS")
  })
})
```

## Exemplos Comparativos

### Server Actions

```diff
// ✅ Bom
"use server"
+ import { z } from "zod" 
+ import { nanoid } from "nanoid"
+ import { getAuthWithPermission } from "@/features/auth/queries/get-auth-with-permission"
+ import { revalidatePath } from "next/cache"
+ import { logInfo } from "@/features/logs/queries/add-log"

+ const schema = z.object({
+   title: z.string().min(3).max(100),
+   date: z.string()
+ })

export async function createEvent(formData: FormData) {
+   const { user, error } = await getAuthWithPermission("events.create")
+   if (error) return { status: "ERROR", message: "Sem permissão" }
  
    try {
+     const rawData = Object.fromEntries(formData.entries())
+     const data = schema.parse(rawData)
+     const id = nanoid()
      
+     await prisma.events.create({
+       data: {
+         id,
+         ...data
+       }
+     })
      
+     await logInfo("Event.create", `Evento ${id} criado`, user.id)
+     revalidatePath("/admin/events")
+     return { status: "SUCCESS", message: "Evento criado com sucesso" }
    } catch (error) {
+     console.error(error)
+     return { status: "ERROR", message: "Erro ao criar evento" }
    }
}

// ❌ Ruim
"use server"

export async function createEvent(formData: FormData) {
-   const data = Object.fromEntries(formData.entries())
  
-   try {
-     await prisma.events.create({
-       data
-     })
-     return { success: true }
-   } catch (error) {
-     return { success: false }
-   }
}
```

### Componentes React

```diff
// ✅ Bom
"use client"

+ import { useState } from "react"
+ import { Button } from "@/components/ui/button"
+ import { Card, CardContent, CardFooter } from "@/components/ui/card"
+ import { updateEventStatus } from "@/features/events/actions/update-event-status"
+ import { useToast } from "@/components/ui/use-toast"

+ interface EventCardProps {
+   event: EventWithDetails;
+   onStatusChange?: () => void;
+ }

+ export function EventCard({ event, onStatusChange }: EventCardProps) {
+   const [isLoading, setIsLoading] = useState(false)
+   const { toast } = useToast()
  
+   async function handleStatusToggle() {
+     setIsLoading(true)
+     const result = await updateEventStatus(event.id, !event.isPublished)
+     setIsLoading(false)
      
+     if (result.status === "SUCCESS") {
+       toast({
+         title: "Sucesso",
+         description: result.message
+       })
+       onStatusChange?.()
+     } else {
+       toast({
+         title: "Erro",
+         description: result.message,
+         variant: "destructive"
+       })
+     }
+   }
  
+   return (
+     <Card>
+       <CardContent>
+         <h3 className="text-lg font-semibold">{event.title}</h3>
+         <p className="text-sm text-muted-foreground">
+           {new Date(event.date).toLocaleDateString('pt-BR')}
+         </p>
+       </CardContent>
+       <CardFooter>
+         <Button 
+           onClick={handleStatusToggle}
+           disabled={isLoading}
+         >
+           {event.isPublished ? "Despublicar" : "Publicar"}
+         </Button>
+       </CardFooter>
+     </Card>
+   )
+ }

// ❌ Ruim
"use client"

- export default function EventCard(props) {
-   function toggleStatus() {
-     fetch(`/api/events/${props.event.id}/toggle-status`)
-   }
  
-   return (
-     <div className="card">
-       <h3>{props.event.title}</h3>
-       <p>{props.event.date}</p>
-       <button onClick={toggleStatus}>
-         Toggle Status
-       </button>
-     </div>
-   )
- }
```

## Checklist para Revisão de Código

- [ ] O código segue as convenções e padrões do projeto
- [ ] Todas as funções e componentes possuem tipagem adequada
- [ ] Server Actions implementam validação de entrada com Zod
- [ ] Server Actions verificam permissões adequadamente
- [ ] Logs são registrados para operações importantes
- [ ] Componentes de UI utilizam os componentes base padronizados
- [ ] Convenções de nomenclatura são seguidas (arquivos, funções, variáveis)
- [ ] Código está organizado corretamente na estrutura de pastas por feature
- [ ] Revalidação de cache é implementada onde necessário
- [ ] Código implementa tratamento de erros adequado
- [ ] Os testes cobrem funcionalidades críticas (se aplicável)
- [ ] Não existem bugs óbvios ou problemas de performance