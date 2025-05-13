// /features/sponsors/queries/get-sponsor.ts
"use server"

import { cache } from "react"
import { prisma } from "@/lib/prisma"
import { getAuth } from "@/features/auth/queries/get-auth"
import { SponsorWithEvents } from "../types"

export const getSponsor = cache(async (id: string) => {
  const { user } = await getAuth()

  // Verificar se o usuário tem permissão para acessar patrocinadores
  if (!user) {
    return null
  }

  const sponsor = await prisma.sponsors.findUnique({
    where: {
      id
    },
    include: {
      events: true
    }
  })

  if (!sponsor) {
    return null
  }

  // Verificar se o usuário é admin
  const isAuthorized = user.roles.some(role => role.name === "admin")

  return {
    ...sponsor,
    isAuthorized
  } as SponsorWithEvents & { isAuthorized: boolean }
})