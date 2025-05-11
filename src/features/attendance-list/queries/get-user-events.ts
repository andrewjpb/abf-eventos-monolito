// /features/attendance-list/queries/get-user-events.ts
"use server"

import { prisma } from "@/lib/prisma"
import { getAuth } from "@/features/auth/queries/get-auth"

type GetUserEventsOptions = {
  past?: boolean;
  page?: number;
  limit?: number;
}

export async function getUserEvents(options: GetUserEventsOptions = {}) {
  const { past = false, page = 1, limit = 10 } = options
  const skip = (page - 1) * limit
  const now = new Date()

  // Verificar se o usuário está autenticado
  const { user } = await getAuth()

  if (!user) {
    throw new Error("Usuário não autenticado")
  }

  // Construir condições de filtro para data
  const dateFilter = past
    ? { lte: now } // Eventos passados (data <= hoje)
    : { gt: now }  // Eventos futuros (data > hoje)

  // Consultas usando transação para garantir consistência
  const [attendances, totalCount] = await prisma.$transaction([
    // 1. Consulta principal para obter as inscrições e eventos
    prisma.attendance_list.findMany({
      where: {
        userId: user.id,
        events: {
          date: dateFilter
        }
      },
      include: {
        events: {
          include: {
            address: {
              include: {
                cities: true,
                states: true
              }
            },
            speakers: {
              include: {
                users: {
                  select: {
                    name: true,
                    position: true,
                    image_url: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: past
        ? { events: { date: "desc" } } // Eventos passados ordenados do mais recente para o mais antigo
        : { events: { date: "asc" } },  // Eventos futuros ordenados do mais próximo para o mais distante
      skip,
      take: limit
    }),

    // 2. Contagem total de inscrições
    prisma.attendance_list.count({
      where: {
        userId: user.id,
        events: {
          date: dateFilter
        }
      }
    })
  ])

  return {
    attendances,
    metadata: {
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  }
}