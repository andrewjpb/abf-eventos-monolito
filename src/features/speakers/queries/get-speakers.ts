// /features/speakers/queries/get-speakers.ts
"use server"

import { prisma } from "@/lib/prisma"

type GetSpeakersOptions = {
  cursor?: string;
  search?: string;
  active?: string;
}

export async function getSpeakers(options: GetSpeakersOptions = {}) {
  const { cursor, search, active } = options
  const take = 9 // Número de itens por página

  // Construir condições de filtro
  const where: any = {}

  // Filtro por status ativo (com eventos)
  if (active === "WITH_EVENTS") {
    where.events = {
      some: {}
    };
  }

  // Filtro por termo de busca (usando o campo do usuário relacionado)
  if (search) {
    where.users = {
      OR: [
        {
          name: {
            contains: search,
            mode: "insensitive"
          }
        },
        {
          email: {
            contains: search,
            mode: "insensitive"
          }
        },
        {
          position: {
            contains: search,
            mode: "insensitive"
          }
        }
      ]
    }
  }

  // Condição de cursor para paginação
  if (cursor) {
    where.id = {
      lt: cursor
    }
  }

  // Consultas usando transação para garantir consistência
  const [speakers, count, countWithEvents] = await prisma.$transaction([
    // 1. Consulta principal para obter os palestrantes desta página
    prisma.speakers.findMany({
      where,
      include: {
        events: true,
        users: {
          include: {
            company: true
          }
        }
      },
      take,
      orderBy: [
        { id: "desc" } // Simplificando para usar apenas o ID como critério de ordenação
      ]
    }),

    // 2. Contagem total de palestrantes com os mesmos filtros (exceto cursor)
    prisma.speakers.count({
      where: {
        ...where,
        id: cursor ? undefined : where.id // Remover condição de cursor para contar todos
      }
    }),

    // 3. Contagem de palestrantes com pelo menos um evento associado
    prisma.speakers.count({
      where: {
        events: {
          some: {}
        },
        ...(search ? { users: where.users } : {})
      }
    })
  ])

  // Verificar se há mais páginas
  const hasNextPage = speakers.length === take && count > speakers.length

  // Se há mais páginas, use o último ID como cursor
  const nextCursor = hasNextPage ? speakers[speakers.length - 1]?.id : undefined

  return {
    speakers,
    metadata: {
      count,
      hasNextPage,
      cursor: nextCursor,
      countByStatus: {
        WITH_EVENTS: countWithEvents
      }
    }
  }
}