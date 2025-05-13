// /features/supporters/queries/get-supporter.ts
"use server"

import { cache } from "react"
import { prisma } from "@/lib/prisma"
import { getAuth } from "@/features/auth/queries/get-auth"
import { SupporterWithEvents } from "../types"

export const getSupporter = cache(async (id: string) => {
  const { user } = await getAuth()

  // Verificar se o usuário tem permissão para acessar apoiadores
  if (!user) {
    return null
  }

  const supporter = await prisma.supporters.findUnique({
    where: {
      id
    },
    include: {
      events: true
    }
  })

  if (!supporter) {
    return null
  }

  // Verificar se o usuário é admin
  const isAuthorized = user.roles.some(role => role.name === "admin")

  return {
    ...supporter,
    isAuthorized
  } as SupporterWithEvents & { isAuthorized: boolean }
})