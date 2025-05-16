// /features/speakers/queries/get-available-users.ts
"use server"

import { cache } from "react"
import { prisma } from "@/lib/prisma"
import { getAuth } from "@/features/auth/queries/get-auth"

/**
 * Obtém usuários que podem ser associados como palestrantes
 * (exclui os que já são palestrantes, a menos que seja o palestrante sendo editado)
 */
export const getAvailableUsers = cache(async (excludeSpeakerId?: string) => {
  const { user } = await getAuth()

  // Verificar se o usuário tem permissão para acessar palestrantes
  if (!user) {
    return []
  }

  // Verificar se o usuário é admin
  const isAdmin = user.roles.some(role => role.name === "admin")
  if (!isAdmin) {
    return []
  }

  // Obter IDs de usuários que já são palestrantes
  const existingSpeakerUserIds = await prisma.speakers.findMany({
    where: {
      // Excluir o palestrante atual se estiver editando
      ...(excludeSpeakerId ? { id: { not: excludeSpeakerId } } : {})
    },
    select: {
      moderatorId: true
    }
  })

  const excludedUserIds = existingSpeakerUserIds.map(s => s.moderatorId)

  // Buscar usuários que não são palestrantes
  const availableUsers = await prisma.users.findMany({
    where: {
      id: {
        notIn: excludedUserIds
      },
      active: true
    },
    include: {
      company: true
    },
    orderBy: {
      name: 'asc'
    }
  })

  return availableUsers
})