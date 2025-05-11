// /features/attendance-list/queries/get-attendances.ts
"use server"

import { prisma } from "@/lib/prisma"
import { getAuth } from "@/features/auth/queries/get-auth"

type GetAttendancesOptions = {
  eventId: string;
  checkedIn?: boolean;
  page?: number;
  limit?: number;
  search?: string;
}

export async function getAttendances(options: GetAttendancesOptions) {
  const { eventId, checkedIn, page = 1, limit = 20, search } = options
  const skip = (page - 1) * limit

  // Verificar se o usuário está autenticado
  const { user } = await getAuth()

  if (!user) {
    throw new Error("Usuário não autenticado")
  }

  // Verificar se o evento existe
  const event = await prisma.events.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
    }
  })

  if (!event) {
    throw new Error("Evento não encontrado")
  }

  // Verificar permissão do usuário (exemplo simplificado - adapte conforme suas regras de permissão)
  // Aqui estamos assumindo que você tem um campo de roles ou similar para verificar permissões
  const userWithRoles = await prisma.users.findUnique({
    where: { id: user.id },
    include: {
      roles: true
    }
  })

  const isAdmin = userWithRoles?.roles.some(role => role.name === "ADMIN") || false

  // Construir condições de filtro
  const where: any = {
    eventId
  }

  // Filtrar por status de check-in, se especificado
  if (checkedIn !== undefined) {
    where.checked_in = checkedIn
  }

  // Filtrar por termo de busca, se especificado
  if (search) {
    where.OR = [
      {
        attendee_full_name: {
          contains: search,
          mode: "insensitive"
        }
      },
      {
        attendee_email: {
          contains: search,
          mode: "insensitive"
        }
      },
      {
        company: {
          name: {
            contains: search,
            mode: "insensitive"
          }
        }
      }
    ]
  }

  // Consultas usando transação para garantir consistência
  const [attendances, totalCount, countCheckedIn, countNotCheckedIn] = await prisma.$transaction([
    // 1. Consulta principal para obter as inscrições
    prisma.attendance_list.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            position: true,
            image_url: true,
            company: {
              select: {
                name: true,
                segment: true
              }
            }
          }
        },
        company: true,
        events: {
          select: {
            id: true,
            title: true,
            date: true,
            vacancy_total: true
          }
        }
      },
      orderBy: {
        created_at: "desc"
      },
      skip,
      take: limit
    }),

    // 2. Contagem total de inscrições
    prisma.attendance_list.count({
      where
    }),

    // 3. Contagem de inscrições com check-in
    prisma.attendance_list.count({
      where: {
        ...where,
        checked_in: true
      }
    }),

    // 4. Contagem de inscrições sem check-in
    prisma.attendance_list.count({
      where: {
        ...where,
        checked_in: false
      }
    })
  ])

  return {
    attendances,
    isAdmin,
    metadata: {
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      countByStatus: {
        checkedIn: countCheckedIn,
        notCheckedIn: countNotCheckedIn
      }
    }
  }
}