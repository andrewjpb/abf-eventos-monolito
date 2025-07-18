"use server"

import { prisma } from "@/lib/prisma"

export async function getEventAttendees(eventId: string) {
  try {
    const attendees = await prisma.attendance_list.findMany({
      where: {
        eventId: eventId
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            email_verified: true,
            image_url: true,
            thumb_url: true,
            cnpj: true
          }
        },
        events: {
          select: {
            id: true,
            title: true
          }
        },
        company: {
          select: {
            id: true,
            name: true,
            cnpj: true,
            segment: true
          }
        }
      },
      orderBy: {
        attendee_full_name: 'asc' // Apenas por ordem alfabética
      }
    })

    return attendees
  } catch (error) {
    console.error('Erro ao buscar participantes do evento:', error)
    return []
  }
}