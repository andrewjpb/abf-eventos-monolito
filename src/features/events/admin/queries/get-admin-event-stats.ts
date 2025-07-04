"use server"

import { prisma } from "@/lib/prisma"
import { getAuthWithPermissionOrRedirect } from "@/features/auth/queries/get-auth-with-permission-or-redirect"
import { type AdminEventStats } from "../types"

export async function getAdminEventStats(): Promise<AdminEventStats> {
  await getAuthWithPermissionOrRedirect("events.read")

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Queries em paralelo para melhor performance
  const [
    totalEvents,
    publishedEvents, 
    draftEvents,
    highlightedEvents,
    totalEnrollments,
    upcomingEvents,
    pastEvents,
    todayEvents,
    eventsWithEnrollments
  ] = await Promise.all([
    prisma.events.count(),
    
    prisma.events.count({
      where: { isPublished: true }
    }),
    
    prisma.events.count({
      where: { isPublished: false }
    }),
    
    prisma.events.count({
      where: { highlight: true }
    }),
    
    prisma.attendance_list.count(),
    
    prisma.events.count({
      where: { date: { gt: tomorrow } }
    }),
    
    prisma.events.count({
      where: { date: { lt: today } }
    }),
    
    prisma.events.count({
      where: {
        date: {
          gte: today,
          lt: tomorrow
        }
      }
    }),

    // Para calcular média de inscrições por evento
    prisma.events.findMany({
      select: {
        _count: {
          select: {
            attendance_list: true
          }
        }
      }
    })
  ])

  // Calcular média de inscrições por evento
  const totalEnrollmentsByEvent = eventsWithEnrollments.reduce(
    (sum, event) => sum + event._count.attendance_list, 
    0
  )
  const avgEnrollmentsPerEvent = totalEvents > 0 
    ? Math.round(totalEnrollmentsByEvent / totalEvents) 
    : 0

  return {
    totalEvents,
    publishedEvents,
    draftEvents: draftEvents,
    highlightedEvents,
    totalEnrollments,
    avgEnrollmentsPerEvent,
    upcomingEvents,
    pastEvents,
    todayEvents
  }
}

// Query específica para dashboard com estatísticas por período
export async function getAdminEventStatsByPeriod(days: number = 30): Promise<{
  period: string
  eventsCreated: number
  enrollmentsCreated: number
  avgEventsPerDay: number
  avgEnrollmentsPerDay: number
}> {
  await getAuthWithPermissionOrRedirect("events.read")

  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const [eventsCreated, enrollmentsCreated] = await Promise.all([
    prisma.events.count({
      where: {
        created_at: {
          gte: startDate,
          lte: endDate
        }
      }
    }),

    prisma.attendance_list.count({
      where: {
        created_at: {
          gte: startDate,
          lte: endDate
        }
      }
    })
  ])

  return {
    period: `${days} dias`,
    eventsCreated,
    enrollmentsCreated,
    avgEventsPerDay: Math.round(eventsCreated / days * 10) / 10,
    avgEnrollmentsPerDay: Math.round(enrollmentsCreated / days * 10) / 10
  }
}