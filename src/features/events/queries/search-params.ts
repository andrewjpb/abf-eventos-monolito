// /features/events/queries/search-params.ts
"use server"

import { prisma } from "@/lib/prisma"

// Função para obter formatos de eventos disponíveis para o filtro
export async function getEventFormats() {
  const formats = await prisma.events.findMany({
    where: {
      isPublished: true
    },
    select: {
      format: true
    },
    distinct: ['format']
  })

  return formats.map(f => f.format).filter(Boolean).sort()
}