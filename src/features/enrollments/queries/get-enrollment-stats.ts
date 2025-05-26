// /features/enrollments/queries/get-enrollment-stats.ts
"use server"

import { cache } from "react"
import { prisma } from "@/lib/prisma"
import { getAuthWithPermission } from "@/features/auth/queries/get-auth-with-permission"
import { EnrollmentStats } from "../types"

export const getEnrollmentStats = cache(async (): Promise<EnrollmentStats | null> => {
  const { user, error } = await getAuthWithPermission("enrollments.view")

  if (error || !user) {
    return null
  }

  try {
    // Buscar estatísticas usando transação
    const [
      totalEnrollments,
      totalEvents,
      enrollmentsByMonth,
      enrollmentsBySegment,
      enrollmentsByCompany,
      topEvents
    ] = await prisma.$transaction([
      // Total de inscrições
      prisma.attendance_list.count(),

      // Total de eventos
      prisma.events.count(),

      // Inscrições por mês (últimos 12 meses)
      prisma.$queryRaw`
        SELECT 
          TO_CHAR(created_at, 'YYYY-MM') as month,
          COUNT(*)::int as count
        FROM attendance_list 
        WHERE created_at >= NOW() - INTERVAL '12 months'
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
        ORDER BY month DESC
        LIMIT 12
      `,

      // Inscrições por segmento
      prisma.$queryRaw`
        SELECT 
          company_segment as segment,
          COUNT(*)::int as count,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM attendance_list), 2)::float as percentage
        FROM attendance_list 
        WHERE company_segment IS NOT NULL AND company_segment != ''
        GROUP BY company_segment
        ORDER BY count DESC
      `,

      // Inscrições por empresa
      prisma.$queryRaw`
        SELECT 
          c.name as company_name,
          c.cnpj as company_cnpj,
          COUNT(al.id)::int as count,
          ROUND(COUNT(al.id) * 100.0 / (SELECT COUNT(*) FROM attendance_list), 2)::float as percentage
        FROM attendance_list al
        JOIN company c ON al.company_cnpj = c.cnpj
        GROUP BY c.name, c.cnpj
        ORDER BY count DESC
        LIMIT 20
      `,

      // Top eventos por número de inscrições - COM DETALHES PRESENCIAL/ONLINE
      prisma.$queryRaw`
        SELECT 
          e.id as "eventId",
          e.title as "eventTitle",
          COUNT(al.id)::int as "enrollmentCount",
          COUNT(CASE WHEN al.attendee_type = 'in_person' THEN 1 END)::int as "presentialCount",
          COUNT(CASE WHEN al.attendee_type = 'online' THEN 1 END)::int as "onlineCount",
          e.vacancy_total as "vacancyTotal",
          CASE 
            WHEN e.vacancy_total > 0 THEN ROUND(COUNT(CASE WHEN al.attendee_type = 'in_person' THEN 1 END) * 100.0 / e.vacancy_total, 2)::float
            ELSE 0::float
          END as "presentialOccupancyRate",
          CASE 
            WHEN e.vacancy_total > 0 THEN ROUND(COUNT(al.id) * 100.0 / e.vacancy_total, 2)::float
            ELSE 0::float
          END as "totalOccupancyRate"
        FROM events e
        LEFT JOIN attendance_list al ON e.id = al."eventId"
        GROUP BY e.id, e.title, e.vacancy_total
        HAVING COUNT(al.id) > 0
        ORDER BY "enrollmentCount" DESC
        LIMIT 10
      `
    ])

    const averageEnrollmentsPerEvent = totalEvents > 0 ? Math.round(totalEnrollments / totalEvents) : 0

    return {
      totalEnrollments,
      totalEvents,
      averageEnrollmentsPerEvent,
      enrollmentsByMonth: enrollmentsByMonth as any[],
      enrollmentsBySegment: enrollmentsBySegment as any[],
      enrollmentsByCompany: enrollmentsByCompany as any[],
      topEvents: topEvents as any[]
    }
  } catch (error) {
    console.error("Erro ao buscar estatísticas de inscrições:", error)
    return null
  }
})