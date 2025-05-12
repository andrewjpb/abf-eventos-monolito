// /features/banners/queries/get-banners.ts
"use server"

import { prisma } from "@/lib/prisma"
import { cache } from "react"

type GetBannersOptions = {
  limit?: number;
  onlyActive?: boolean;
}

export const getBanners = cache(async (options: GetBannersOptions = {}) => {
  const {
    limit = 3,
    onlyActive = true
  } = options

  // Construir condições de filtro
  const where: any = {}

  // Filtrar apenas banners ativos, se solicitado
  if (onlyActive) {
    where.active = true
  }

  // Consulta para obter os banners
  const banners = await prisma.highlight_card.findMany({
    where,
    orderBy: [
      { updatedAt: 'desc' as const }
    ],
    take: limit
  })

  return {
    banners
  }
})