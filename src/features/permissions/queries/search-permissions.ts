// /features/permissions/queries/search-permissions.ts
"use server"

import { prisma } from "@/lib/prisma"
import { permissions } from "@prisma/client"

type SearchPermissionsOptions = {
  search?: string;
  take?: number;
}

export async function searchPermissions(options: SearchPermissionsOptions = {}) {
  const { search = "", take = 20 } = options

  // Construir condições de filtro
  const where: any = {}

  // Filtro por termo de busca
  if (search) {
    where.OR = [
      {
        name: {
          contains: search,
          mode: "insensitive"
        }
      },
      {
        description: {
          contains: search,
          mode: "insensitive"
        }
      }
    ]
  }

  // Consultas usando transação para garantir consistência
  const [permissions, total] = await prisma.$transaction([
    // Consulta principal para obter as permissões
    prisma.permissions.findMany({
      where,
      take,
      orderBy: [
        { name: "asc" }
      ]
    }),

    // Contagem total com os mesmos filtros
    prisma.permissions.count({
      where
    })
  ])

  return {
    permissions,
    metadata: {
      total
    }
  }
}