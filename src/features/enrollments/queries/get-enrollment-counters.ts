// /features/enrollments/queries/get-enrollment-counters.ts
"use server"

import { prisma } from "@/lib/prisma"
import { cache } from "react"
import { getAuthWithPermission } from "@/features/auth/queries/get-auth-with-permission"

type GetEnrollmentCountersOptions = {
  search?: string;
  eventId?: string;
  segment?: string;
  status?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const getEnrollmentCounters = cache(async (options: GetEnrollmentCountersOptions = {}) => {
  const { user, error } = await getAuthWithPermission("enrollments.view")

  if (error || !user) {
    return {
      totalCount: 0,
      checkedInCount: 0,
      pendingCount: 0,
      checkInRate: 0
    }
  }

  const {
    search,
    eventId,
    segment,
    status,
    type,
    dateFrom,
    dateTo
  } = options

  try {
    // Construir condições de filtro (mesmo filtro da lista)
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

    // Buscar contadores usando transação
    const [totalCount, checkedInCount, presentialCount, onlineCount] = await prisma.$transaction([
      // Total de inscrições com os filtros aplicados
      prisma.attendance_list.count({
        where
      }),

      // Total com check-in feito com os filtros aplicados
      prisma.attendance_list.count({
        where: {
          ...where,
          checked_in: true
        }
      }),

      // Total presencial com os filtros aplicados
      prisma.attendance_list.count({
        where: {
          ...where,
          attendee_type: "in_person"
        }
      }),

      // Total online com os filtros aplicados
      prisma.attendance_list.count({
        where: {
          ...where,
          attendee_type: "online"
        }
      })
    ])

    const pendingCount = totalCount - checkedInCount
    const checkInRate = totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0

    return {
      totalCount,
      checkedInCount,
      pendingCount,
      checkInRate,
      presentialCount,
      onlineCount
    }
  } catch (error) {
    console.error("Erro ao buscar contadores de inscrições:", error)
    return {
      totalCount: 0,
      checkedInCount: 0,
      pendingCount: 0,
      checkInRate: 0
    }
  }
})