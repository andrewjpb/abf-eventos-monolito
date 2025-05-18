// /features/companies/queries/get-company-segments.ts
"use server"

import { prisma } from "@/lib/prisma"

export async function getCompanySegments() {
  // Buscar segmentos distintos das empresas existentes
  const distinctSegments = await prisma.company.groupBy({
    by: ['segment'],
    orderBy: {
      segment: 'asc'
    }
  })

  // Filtrar segmentos vazios e retornar array de strings
  return distinctSegments
    .map(item => item.segment)
    .filter(segment => segment && segment.trim() !== '')
}