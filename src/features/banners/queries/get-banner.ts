// /features/banners/queries/get-banner.ts
"use server"

import { cache } from "react"
import { prisma } from "@/lib/prisma"
import { getAuth } from "@/features/auth/queries/get-auth"
import { BannerWithDetails } from "../types"

export const getBanner = cache(async (id: string) => {
  const { user } = await getAuth()

  // Verificar se o usuário tem permissão para acessar banners
  if (!user) {
    return null
  }

  const banner = await prisma.highlight_card.findUnique({
    where: {
      id
    }
  })

  if (!banner) {
    return null
  }

  // Verificar se o usuário é admin
  const isAuthorized = user.roles.some(role => role.name === "admin")

  return {
    ...banner,
    isAuthorized
  } as BannerWithDetails & { isAuthorized: boolean }
})