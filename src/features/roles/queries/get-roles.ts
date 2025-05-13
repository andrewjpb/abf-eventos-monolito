// /features/roles/queries/get-roles.ts
"use server"

import { prisma } from "@/lib/prisma"

type GetRolesOptions = {
  cursor?: string;
  search?: string;
}

export async function getRoles(options: GetRolesOptions = {}) {
  const { cursor, search } = options
  const take = 9 // Número de itens por página

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

  // Condição de cursor para paginação
  if (cursor) {
    where.id = {
      lt: cursor
    }
  }

  // Consultas usando transação para garantir consistência
  const [roles, count, totalRoles, emptyRoles] = await prisma.$transaction([
    // 1. Consulta principal para obter as roles desta página
    prisma.roles.findMany({
      where,
      include: {
        permissions: true,
        _count: {
          select: {
            users: true,
            permissions: true
          }
        }
      },
      take,
      orderBy: [
        { name: "asc" }
      ]
    }),

    // 2. Contagem total de roles com os mesmos filtros (exceto cursor)
    prisma.roles.count({
      where: {
        ...where,
        id: cursor ? undefined : where.id // Remover condição de cursor para contar todos
      }
    }),

    // 3. Contagem total de roles no sistema
    prisma.roles.count(),

    // 4. Contagem de roles sem permissões
    prisma.roles.count({
      where: {
        permissions: {
          none: {}
        }
      }
    })
  ])

  // Verificar se há mais páginas
  const hasNextPage = roles.length === take && count > roles.length

  // Se há mais páginas, use o último ID como cursor
  const nextCursor = hasNextPage ? roles[roles.length - 1]?.id : undefined

  return {
    roles,
    metadata: {
      count,
      hasNextPage,
      cursor: nextCursor,
      countByStatus: {
        TOTAL: totalRoles,
        EMPTY: emptyRoles
      }
    }
  }
}