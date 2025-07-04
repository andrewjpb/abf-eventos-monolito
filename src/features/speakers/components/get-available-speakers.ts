"use server"

import { cache } from "react"
import { prisma } from "@/lib/prisma"
import { getAuthWithPermissionOrRedirect } from "@/features/auth/queries/get-auth-with-permission-or-redirect"

/**
 * Obtém todos os palestrantes disponíveis para associar a eventos
 */
export const getAvailableSpeakers = cache(async () => {
  await getAuthWithPermissionOrRedirect("speakers.read")

  const speakers = await prisma.speakers.findMany({
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
    },
    orderBy: {
      users: {
        name: 'asc'
      }
    }
  })

  return speakers.map(speaker => ({
    id: speaker.id,
    name: speaker.users.name,
    email: speaker.users.email,
    position: speaker.users.position,
    image_url: speaker.users.image_url
  }))
})