// /features/permissions/queries/get-permissions.ts
"use server"

import { prisma } from "@/lib/prisma"
import { PermissionWithRoles } from "../types"

type GetPermissionsOptions = {
  cursor?: string;
  search?: string;
}

export async function getPermissions(options: GetPermissionsOptions = {}) {
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
      lt: cursor // Usar "lt" (less than) com ordenação "desc"
    }
  }

  // Consultas usando transação para garantir consistência
  const [permissions, count] = await prisma.$transaction([
    // 1. Consulta principal para obter as permissões desta página
    prisma.permissions.findMany({
      where,
      take,
      orderBy: [
        { id: "desc" } // Usar ordenação "desc" para funcionar com cursor "lt"
      ],
      include: {
        roles: true // Incluir roles associadas para mostrar nas permissões
      }
    }),

    // 2. Contagem total de permissões com os mesmos filtros (exceto cursor)
    prisma.permissions.count({
      where: {
        ...where,
        id: cursor ? undefined : where.id // Remover condição de cursor para contar todos
      }
    })
  ])

  // Verificar se há mais páginas
  const hasNextPage = permissions.length === take && count > permissions.length

  // Se há mais páginas, use o último ID como cursor
  const nextCursor = hasNextPage && permissions.length > 0 ? permissions[permissions.length - 1]?.id : undefined

  return {
    permissions: permissions as PermissionWithRoles[],
    metadata: {
      count,
      hasNextPage,
      cursor: nextCursor,
      countByStatus: {
        ACTIVE: 0,
        INACTIVE: 0,
        WITH_EVENTS: 0
      }
    }
  }
}