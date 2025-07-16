// /features/company/queries/search-companies.ts
"use server"

import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client";
import { cache } from "react"

type SearchCompaniesParams = {
  search?: string;
  take?: number;
  skip?: number;
  excludeIds?: string[];
  includeInactive?: boolean;
}

export const searchCompanies = cache(async ({
  search = "",
  take = 10,
  skip = 0,
  excludeIds = [],
  includeInactive = false
}: SearchCompaniesParams = {}) => {
  const whereClause: Prisma.companyWhereInput = {
    // Só filtrar por active se includeInactive for false
    ...(includeInactive ? {} : { active: true }),
    NOT: excludeIds.length > 0 ? { id: { in: excludeIds } } : undefined,
    OR: search ? [
      { name: { contains: search, mode: "insensitive" } },
      { segment: { contains: search, mode: "insensitive" } },
      { cnpj: { contains: search } }
    ] : undefined
  }

  // Executar a busca e contagem em paralelo
  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        cnpj: true,
        segment: true,
        active: true
      },
      orderBy: { name: 'asc' },
      take,
      skip
    }),
    prisma.company.count({
      where: whereClause
    })
  ])

  return {
    companies,
    metadata: {
      total,
      hasMore: skip + take < total
    }
  }
})