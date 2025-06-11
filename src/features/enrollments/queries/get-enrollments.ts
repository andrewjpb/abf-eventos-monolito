// /features/enrollments/queries/get-enrollments.ts
"use server"

import { prisma } from "@/lib/prisma"
import { cache } from "react"
import { getAuthWithPermission } from "@/features/auth/queries/get-auth-with-permission"
import { EnrollmentWithDetails } from "../types"

type GetEnrollmentsOptions = {
  limit?: number;
  cursor?: string;
  search?: string;
  eventId?: string;
  segment?: string;
  status?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const getEnrollments = cache(async (options: GetEnrollmentsOptions = {}) => {
  const { user, error } = await getAuthWithPermission("enrollments.view")

  if (error || !user) {
    return {
      enrollments: [],
      metadata: {
        count: 0,
        hasNextPage: false,
        cursor: undefined
      }
    }
  }

  const {
    limit = 20,
    cursor,
    search,
    eventId,
    segment,
    status,
    type,
    dateFrom,
    dateTo
  } = options

  try {
    // Construir condições de filtro
    const where: any = {}

    // Filtro por evento específico
    if (eventId && eventId !== "" && eventId !== "ALL") {
      where.eventId = eventId
    }

    // Filtro por segmento
    if (segment && segment !== "ALL") {
      where.company_segment = segment
    }

    // Filtro por status (check-in)
    if (status === "CHECKED_IN") {
      where.checked_in = true
    } else if (status === "PENDING") {
      where.checked_in = false
    }

    // Filtro por tipo de participante
    if (type && type !== "ALL") {
      where.attendee_type = type
    }

    // Filtro por termo de busca
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
          events: {
            title: {
              contains: search,
              mode: "insensitive"
            }
          }
        }
      ]
    }

    // Filtro por data
    const dateFilters: any = {}
    if (dateFrom) {
      // Criar data no início do dia considerando o fuso horário do Brasil
      const [year, month, day] = dateFrom.split('-').map(Number)
      const startDate = new Date(year, month - 1, day, 0, 0, 0, 0)
      dateFilters.gte = startDate
    }
    if (dateTo) {
      // Criar data no final do dia considerando o fuso horário do Brasil
      const [year, month, day] = dateTo.split('-').map(Number)
      const endDate = new Date(year, month - 1, day, 23, 59, 59, 999)
      dateFilters.lte = endDate
    }
    if (Object.keys(dateFilters).length > 0) {
      where.created_at = dateFilters
    }

    // Condição de cursor para paginação - usando skip/take approach
    let skip = 0
    if (cursor) {
      // Cursor será o número de registros para pular
      skip = parseInt(cursor) || 0
    }

    // Consultas usando transação
    const [enrollments, count] = await prisma.$transaction([
      // 1. Consulta principal para obter as inscrições desta página
      prisma.attendance_list.findMany({
        where,
        include: {
          events: {
            include: {
              address: {
                include: {
                  cities: true,
                  states: true
                }
              }
            }
          },
          users: true,
          company: true
        },
        orderBy: [
          { created_at: 'desc' }, // Ordenar primeiro por data de criação
          { id: 'desc' }          // Depois por ID para garantir ordem consistente
        ],
        skip: skip,
        take: limit
      }),

      // 2. Contagem total
      prisma.attendance_list.count({
        where: {
          ...where,
          id: cursor ? undefined : where.id // Remover condição de cursor para contar todos
        }
      })
    ])

    // Verificar se há mais páginas
    const hasNextPage = enrollments.length === limit

    // Próximo cursor será o número atual + limit
    const nextCursor = hasNextPage ? String(skip + limit) : undefined

    return {
      enrollments: enrollments as EnrollmentWithDetails[],
      metadata: {
        count,
        hasNextPage,
        cursor: nextCursor
      }
    }
  } catch (error) {
    console.error("Erro ao buscar inscrições:", error)
    return {
      enrollments: [],
      metadata: {
        count: 0,
        hasNextPage: false,
        cursor: undefined
      }
    }
  }
})