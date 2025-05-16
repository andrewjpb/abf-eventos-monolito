// /features/speakers/queries/get-available-events.ts
"use server"

import { cache } from "react"
import { prisma } from "@/lib/prisma"
import { getAuth } from "@/features/auth/queries/get-auth"

/**
 * Obtém eventos que podem ser associados a palestrantes
 */
export const getAvailableEvents = cache(async () => {
  const { user } = await getAuth()

  // Verificar se o usuário tem permissão
  if (!user) {
    return []
  }

  // Verificar se o usuário é admin
  const isAdmin = user.roles.some(role => role.name === "admin")
  if (!isAdmin) {
    return []
  }

  // Buscar eventos ativos (data igual ou maior que hoje)
  const availableEvents = await prisma.events.findMany({
    where: {
      date: {
        gte: new Date(new Date().setHours(0, 0, 0, 0))
      },
      isPublished: true
    },
    orderBy: [
      { date: 'asc' },
      { title: 'asc' }
    ]
  })

  return availableEvents
})