// /features/permissions/queries/get-permissions.ts
"use server"

import { prisma } from "@/lib/prisma"

type GetPermissionsOptions = {
  cursor?: string;
  search?: string;
}

export async function getPermissions(options: GetPermissionsOptions = {}) {
  const { cursor, search } = options
  const take = 15 // Número de itens por página

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
  const [permissions, count, totalPermissions, unusedPermissions] = await prisma.$transaction([
    // 1. Consulta principal para obter as permissões desta página
    prisma.permissions.findMany({
      where,
      take,
      orderBy: [
        { name: "asc" }
      ]
    }),

    // 2. Contagem total de permissões com os mesmos filtros (exceto cursor)
    prisma.permissions.count({
      where: {
        ...where,
        id: cursor ? undefined : where.id // Remover condição de cursor para contar todos
      }
    }),

    // 3. Contagem total de permissões no sistema
    prisma.permissions.count(),

    // 4. Contagem de permissões não utilizadas por nenhuma role
    prisma.permissions.count({
      where: {
        roles: {
          none: {}
        }
      }
    })
  ])

  // Verificar se há mais páginas
  const hasNextPage = permissions.length === take && count > permissions.length

  // Se há mais páginas, use o último ID como cursor
  const nextCursor = hasNextPage ? permissions[permissions.length - 1]?.id : undefined

  return {
    permissions,
    metadata: {
      count,
      hasNextPage,
      cursor: nextCursor,
      countByStatus: {
        TOTAL: totalPermissions,
        UNUSED: unusedPermissions
      }
    }
  }
}