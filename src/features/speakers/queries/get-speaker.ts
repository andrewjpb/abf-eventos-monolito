// /features/speakers/queries/get-speaker.ts
"use server"

import { cache } from "react"
import { prisma } from "@/lib/prisma"
import { getAuth } from "@/features/auth/queries/get-auth"

export const getSpeaker = cache(async (id: string) => {
  const { user } = await getAuth()

  // Verificar se o usuário tem permissão para acessar palestrantes
  if (!user) {
    return null
  }

  const speaker = await prisma.speakers.findUnique({
    where: {
      id
    },
    include: {
      events: true,
      users: {
        include: {
          company: true
        }
      }
    }
  })

  if (!speaker) {
    return null
  }

  // Verificar se o usuário é admin
  const isAuthorized = user.roles.some(role => role.name === "admin")

  return {
    ...speaker,
    isAuthorized
  }
})