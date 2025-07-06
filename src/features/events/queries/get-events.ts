// /features/events/queries/get-events.ts
"use server"

import { prisma } from "@/lib/prisma"
import { getAuth } from "@/features/auth/queries/get-auth"

type GetEventsOptions = {
  cursor?: string;
  search?: string;
  format?: string;
  past?: boolean;
  onlyHighlighted?: boolean;
  limit?: number;
}

export async function getEvents(options: GetEventsOptions = {}) {
  const {
    cursor,
    search,
    format,
    past = false,
    onlyHighlighted = false,
    limit = 12
  } = options

  // Obter informações do usuário para verificar permissões
  const { user } = await getAuth()
  let isAdmin = false

  if (user) {
    const userWithRoles = await prisma.users.findUnique({
      where: { id: user.id },
      include: {
        roles: true
      }
    })

    isAdmin = userWithRoles?.roles.some(role => role.name === "ADMIN") || false
  }

  // Construir condições de filtro
  const where: any = {}

  // Filtrar eventos passados ou futuros
  const hoje = new Date()
  where.date = past
    ? { lt: hoje } // Eventos passados (data < hoje)
    : { gte: hoje } // Eventos futuros (data >= hoje)

  // Filtrar por termo de busca
  if (search) {
    where.OR = [
      {
        title: {
          contains: search,
          mode: "insensitive"
        }
      },
      {
        summary: {
          contains: search,
          mode: "insensitive"
        }
      },
      {
        description: {
          contains: search,
          mode: "insensitive"
        }
      }
    ]
  }

  // Filtrar por formato do evento
  if (format && format !== "ALL") {
    where.format = format
  }

  // Filtrar por eventos destacados
  if (onlyHighlighted) {
    where.highlight = true
  }

  // Mostrar apenas eventos publicados (a menos que seja admin)
  if (!isAdmin) {
    where.isPublished = true
  }

  // Condição de cursor para paginação
  if (cursor) {
    where.id = {
      lt: cursor
    }
  }

  // Ordenação: 
  // - Eventos futuros: do mais próximo para o mais distante
  // - Eventos passados: do mais recente para o mais antigo
  const orderBy = past
    ? { date: "desc" as const }
    : { date: "asc" as const }

  // Consultas usando transação para garantir consistência
  const [events, totalCount, countHighlighted, countVisible] = await prisma.$transaction([
    // 1. Consulta principal para obter os eventos
    prisma.events.findMany({
      where,
      include: {
        address: {
          include: {
            cities: true,
            states: true
          }
        },
        speakers: {
          include: {
            users: true
          }
        },
        sponsors: true,
        supporters: true,
        schedule: {
          orderBy: [
            { day_date: 'asc' },
            { order_index: 'asc' },
            { start_time: 'asc' }
          ]
        },
        _count: {
          select: {
            attendance_list: true
          }
        }
      },
      orderBy,
      take: limit
    }),

    // 2. Contagem total de eventos
    prisma.events.count({
      where
    }),

    // 3. Contagem de eventos destacados
    prisma.events.count({
      where: {
        ...where,
        highlight: true
      }
    }),

    // 4. Contagem de eventos visíveis (publicados)
    prisma.events.count({
      where: {
        ...where,
        isPublished: true
      }
    })
  ])

  const hasNextPage = events.length === limit && totalCount > limit
  const nextCursor = hasNextPage ? events[events.length - 1]?.id : undefined

  return {
    events,
    metadata: {
      totalCount,
      hasNextPage,
      cursor: nextCursor,
      counts: {
        highlighted: countHighlighted,
        visible: countVisible,
        hidden: totalCount - countVisible
      },
      isAdmin
    }
  }
}