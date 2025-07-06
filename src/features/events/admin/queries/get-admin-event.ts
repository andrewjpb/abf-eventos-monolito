"use server"

import { prisma } from "@/lib/prisma"
import { getAuthWithPermissionOrRedirect } from "@/features/auth/queries/get-auth-with-permission-or-redirect"
import { type AdminEventWithDetails } from "../types"
import { notFound } from "next/navigation"

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
              image_url: true
            }
          }
        }
      },
      sponsors: true,
      supporters: true,
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

  return event as AdminEventWithDetails
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
              image_url: true
            }
          }
        }
      },
      sponsors: true,
      supporters: true,
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

  return event as AdminEventWithDetails
}