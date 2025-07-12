// /features/events/queries/get-public-event.ts
"use server"

import { cache } from "react"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"

export const getPublicEvent = cache(async (id: string) => {
  // Buscar evento público
  const event = await prisma.events.findFirst({
    where: {
      id,
      isPublished: true // Apenas eventos publicados
    },
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
              id: true,
              name: true,
              email: true,
              image_url: true,
              company: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      },
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
    }
  })

  if (!event) {
    notFound()
  }

  // Buscar patrocinadores ordenados
  const sponsorsOrdered = await prisma.sponsors.findMany({
    where: {
      active: true,
      events: {
        some: {
          id: event.id
        }
      }
    },
    include: {
      _count: {
        select: {
          events: true
        }
      }
    }
  })

  // Buscar ordens dos patrocinadores
  const sponsorOrders = await prisma.event_sponsor_order.findMany({
    where: {
      eventId: event.id,
      sponsorId: {
        in: sponsorsOrdered.map(s => s.id)
      }
    }
  })

  // Mapear ordens
  const sponsorOrderMap = sponsorOrders.reduce((acc, order) => {
    acc[order.sponsorId] = order.order
    return acc
  }, {} as Record<string, number>)

  // Ordenar patrocinadores
  const orderedSponsors = sponsorsOrdered
    .map(sponsor => ({
      ...sponsor,
      order: sponsorOrderMap[sponsor.id] || 0
    }))
    .sort((a, b) => a.order - b.order)

  // Buscar apoiadores ordenados
  const supportersOrdered = await prisma.supporters.findMany({
    where: {
      active: true,
      events: {
        some: {
          id: event.id
        }
      }
    },
    include: {
      _count: {
        select: {
          events: true
        }
      }
    }
  })

  // Buscar ordens dos apoiadores
  const supporterOrders = await prisma.event_supporter_order.findMany({
    where: {
      eventId: event.id,
      supporterId: {
        in: supportersOrdered.map(s => s.id)
      }
    }
  })

  // Mapear ordens
  const supporterOrderMap = supporterOrders.reduce((acc, order) => {
    acc[order.supporterId] = order.order
    return acc
  }, {} as Record<string, number>)

  // Ordenar apoiadores
  const orderedSupporters = supportersOrdered
    .map(supporter => ({
      ...supporter,
      order: supporterOrderMap[supporter.id] || 0
    }))
    .sort((a, b) => a.order - b.order)

  // Adicionar os dados ordenados ao evento
  const eventWithOrderedRelations = {
    ...event,
    sponsors: orderedSponsors,
    supporters: orderedSupporters
  }

  // Calcular vagas e ocupação
  const remainingVacancies = Math.max(0, event.vacancy_total - event._count.attendance_list)
  const occupationPercentage = event.vacancy_total > 0 
    ? Math.min(100, Math.round((event._count.attendance_list / event.vacancy_total) * 100))
    : 0

  return {
    event: eventWithOrderedRelations,
    remainingVacancies,
    occupationPercentage,
    totalRegistrations: event._count.attendance_list
  }
})