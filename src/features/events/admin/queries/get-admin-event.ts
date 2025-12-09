"use server"

import { prisma } from "@/lib/prisma"
import { getAuthWithPermissionOrRedirect } from "@/features/auth/queries/get-auth-with-permission-or-redirect"
import { type AdminEventWithDetails } from "../types"
import { notFound } from "next/navigation"

// Função auxiliar para buscar patrocinadores e apoiadores ordenados
async function getOrderedSponsorsAndSupporters(eventId: string) {
  // Buscar patrocinadores ordenados
  const sponsorsOrdered = await prisma.sponsors.findMany({
    where: {
      events: {
        some: {
          id: eventId
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
      eventId,
      sponsorId: {
        in: sponsorsOrdered.map(s => s.id)
      }
    }
  })

  // Mapear ordens dos patrocinadores
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
      events: {
        some: {
          id: eventId
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
      eventId,
      supporterId: {
        in: supportersOrdered.map(s => s.id)
      }
    }
  })

  // Mapear ordens dos apoiadores
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

  return {
    sponsors: orderedSponsors,
    supporters: orderedSupporters
  }
}

export async function getAdminEvent(eventId: string): Promise<AdminEventWithDetails> {
  await getAuthWithPermissionOrRedirect("events.read")

  const event = await prisma.events.findUnique({
    where: { id: eventId },
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
              position: true,
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
          attendance_list: true,
          speakers: true,
          sponsors: true,
          supporters: true,
          schedule: true
        }
      }
    }
  })

  if (!event) {
    notFound()
  }

  // Buscar patrocinadores e apoiadores ordenados
  const { sponsors, supporters } = await getOrderedSponsorsAndSupporters(eventId)

  // Contar inscrições presenciais e online separadamente
  const presentialCount = await prisma.attendance_list.count({
    where: {
      eventId,
      attendee_type: 'in_person'
    }
  })

  const onlineCount = await prisma.attendance_list.count({
    where: {
      eventId,
      attendee_type: 'online'
    }
  })

  return {
    ...event,
    sponsors,
    supporters,
    presentialCount,
    onlineCount
  } as AdminEventWithDetails
}

// Query para buscar evento por slug
export async function getAdminEventBySlug(slug: string): Promise<AdminEventWithDetails> {
  await getAuthWithPermissionOrRedirect("events.read")

  const event = await prisma.events.findUnique({
    where: { slug },
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
              position: true,
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
          attendance_list: true,
          speakers: true,
          sponsors: true,
          supporters: true,
          schedule: true
        }
      }
    }
  })

  if (!event) {
    notFound()
  }

  // Buscar patrocinadores e apoiadores ordenados
  const { sponsors, supporters } = await getOrderedSponsorsAndSupporters(event.id)

  // Contar inscrições presenciais e online separadamente
  const presentialCount = await prisma.attendance_list.count({
    where: {
      eventId: event.id,
      attendee_type: 'in_person'
    }
  })

  const onlineCount = await prisma.attendance_list.count({
    where: {
      eventId: event.id,
      attendee_type: 'online'
    }
  })

  return {
    ...event,
    sponsors,
    supporters,
    presentialCount,
    onlineCount
  } as AdminEventWithDetails
}