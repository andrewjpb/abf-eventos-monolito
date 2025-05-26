// /features/enrollments/queries/get-enrollment-filter-data.ts
"use server"

import { cache } from "react"
import { prisma } from "@/lib/prisma"
import { getAuthWithPermission } from "@/features/auth/queries/get-auth-with-permission"

export const getEnrollmentFilterData = cache(async () => {
  const { user, error } = await getAuthWithPermission("enrollments.view")

  if (error || !user) {
    return {
      events: [],
      segments: [],
      types: []
    }
  }

  try {
    // Buscar dados para os filtros usando transação
    const [events, segments, types] = await prisma.$transaction([
      // Eventos que têm inscrições
      prisma.events.findMany({
        where: {
          attendance_list: {
            some: {}
          }
        },
        select: {
          id: true,
          title: true,
          date: true
        },
        orderBy: {
          date: 'desc'
        }
      }),

      // Segmentos únicos
      prisma.$queryRaw`
        SELECT DISTINCT company_segment as segment
        FROM attendance_list 
        WHERE company_segment IS NOT NULL 
        AND company_segment != ''
        ORDER BY company_segment
      `,

      // Tipos de participante únicos
      prisma.$queryRaw`
        SELECT DISTINCT attendee_type as type
        FROM attendance_list 
        WHERE attendee_type IS NOT NULL 
        AND attendee_type != ''
        ORDER BY attendee_type
      `
    ])

    return {
      events: events.map(event => ({
        id: event.id,
        title: event.title
      })),
      segments: (segments as any[]).map(s => s.segment),
      types: (types as any[]).map(t => t.type)
    }
  } catch (error) {
    console.error("Erro ao buscar dados dos filtros:", error)
    return {
      events: [],
      segments: [],
      types: []
    }
  }
})