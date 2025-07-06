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
              image_url: true
            }
          }
        }
      },
      sponsors: {
        where: {
          active: true
        }
      },
      supporters: {
        where: {
          active: true
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

  // Calcular vagas e ocupação
  const remainingVacancies = Math.max(0, event.vacancy_total - event._count.attendance_list)
  const occupationPercentage = event.vacancy_total > 0 
    ? Math.min(100, Math.round((event._count.attendance_list / event.vacancy_total) * 100))
    : 0

  return {
    event,
    remainingVacancies,
    occupationPercentage,
    totalRegistrations: event._count.attendance_list
  }
})