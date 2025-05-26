// /features/enrollments/queries/get-event-enrollment-stats.ts
"use server"

import { cache } from "react"
import { prisma } from "@/lib/prisma"
import { getAuthWithPermission } from "@/features/auth/queries/get-auth-with-permission"
import { EventEnrollmentStats } from "../types"

export const getEventEnrollmentStats = cache(async (eventId: string): Promise<EventEnrollmentStats | null> => {
  const { user, error } = await getAuthWithPermission("enrollments.view")

  if (error || !user) {
    return null
  }

  try {
    // Buscar evento
    const event = await prisma.events.findUnique({
      where: { id: eventId },
      include: {
        address: {
          include: {
            cities: true,
            states: true
          }
        }
      }
    })

    if (!event) {
      return null
    }

    // Buscar estatísticas do evento
    const [
      totalEnrollments,
      checkedInCount,
      presentialEnrollments,
      onlineEnrollments,
      enrollmentsBySegment,
      enrollmentsByType,
      enrollmentsByCity,
      enrollmentsByCompany // Adicionado
    ] = await prisma.$transaction([
      // Total de inscrições
      prisma.attendance_list.count({
        where: { eventId }
      }),

      // Inscrições com check-in feito
      prisma.attendance_list.count({
        where: { eventId, checked_in: true }
      }),

      // Inscrições presenciais
      prisma.attendance_list.count({
        where: {
          eventId,
          attendee_type: "in_person"
        }
      }),

      // Inscrições online
      prisma.attendance_list.count({
        where: {
          eventId,
          attendee_type: "online"
        }
      }),

      // Inscrições por segmento
      prisma.$queryRaw`
        SELECT 
          company_segment as segment,
          COUNT(*)::int as count,
          CASE 
            WHEN (SELECT COUNT(*) FROM attendance_list WHERE "eventId" = ${eventId}) > 0 
            THEN ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM attendance_list WHERE "eventId" = ${eventId}), 2)::float
            ELSE 0::float
          END as percentage
        FROM attendance_list 
        WHERE "eventId" = ${eventId} AND company_segment IS NOT NULL AND company_segment != ''
        GROUP BY company_segment
        ORDER BY count DESC
      `,

      // Inscrições por tipo de participante
      prisma.$queryRaw`
        SELECT 
          attendee_type as type,
          COUNT(*)::int as count,
          CASE 
            WHEN (SELECT COUNT(*) FROM attendance_list WHERE "eventId" = ${eventId}) > 0 
            THEN ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM attendance_list WHERE "eventId" = ${eventId}), 2)::float
            ELSE 0::float
          END as percentage
        FROM attendance_list 
        WHERE "eventId" = ${eventId} AND attendee_type IS NOT NULL AND attendee_type != ''
        GROUP BY attendee_type
        ORDER BY count DESC
      `,

      // Inscrições por cidade (baseado no usuário)
      prisma.$queryRaw`
        SELECT 
          u.city as city,
          COUNT(*)::int as count,
          CASE 
            WHEN (SELECT COUNT(*) FROM attendance_list WHERE "eventId" = ${eventId}) > 0 
            THEN ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM attendance_list WHERE "eventId" = ${eventId}), 2)::float
            ELSE 0::float
          END as percentage
        FROM attendance_list al
        JOIN users u ON al."userId" = u.id
        WHERE al."eventId" = ${eventId} AND u.city IS NOT NULL AND u.city != ''
        GROUP BY u.city
        ORDER BY count DESC
      `,

      // Inscrições por empresa (adicionado)
      prisma.$queryRaw`
        SELECT 
          c.name as company_name,
          c.cnpj as company_cnpj,
          COUNT(al.id)::int as count,
          CASE 
            WHEN (SELECT COUNT(*) FROM attendance_list WHERE "eventId" = ${eventId}) > 0 
            THEN ROUND(COUNT(al.id) * 100.0 / (SELECT COUNT(*) FROM attendance_list WHERE "eventId" = ${eventId}), 2)::float
            ELSE 0::float
          END as percentage
        FROM attendance_list al
        JOIN company c ON al.company_cnpj = c.cnpj
        WHERE al."eventId" = ${eventId}
        GROUP BY c.name, c.cnpj
        ORDER BY count DESC
        LIMIT 10
      `
    ])

    const pendingCount = totalEnrollments - checkedInCount

    // Calcular ocupação separada para presencial vs online
    const presentialOccupancyRate = event.vacancy_total > 0 ? (presentialEnrollments / event.vacancy_total) * 100 : 0
    const totalOccupancyRate = event.vacancy_total > 0 ? (totalEnrollments / event.vacancy_total) * 100 : 0

    return {
      event,
      totalEnrollments,
      checkedInCount,
      pendingCount,
      presentialEnrollments,
      onlineEnrollments,
      presentialOccupancyRate,
      totalOccupancyRate,
      enrollmentsBySegment: enrollmentsBySegment as any[],
      enrollmentsByType: enrollmentsByType as any[],
      enrollmentsByCity: enrollmentsByCity as any[],
      enrollmentsByCompany: enrollmentsByCompany as any[] // Adicionado
    }
  } catch (error) {
    console.error("Erro ao buscar estatísticas do evento:", error)
    return null
  }
})