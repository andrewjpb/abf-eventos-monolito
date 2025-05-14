// /features/roles/queries/get-roles.ts
"use server"

import { prisma } from "@/lib/prisma"
import { RoleWithRelations } from "../types"

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
      lt: cursor // Usar "lt" (less than) com ordenação "desc"
    }
  }

  // Consultas usando transação para garantir consistência
  const [roles, count] = await prisma.$transaction([
    // 1. Consulta principal para obter as funções desta página
    prisma.roles.findMany({
      where,
      take,
      orderBy: [
        { id: "desc" } // Usar ordenação "desc" para funcionar com cursor "lt"
      ],
      include: {
        permissions: true, // Incluir permissões associadas
        users: {
          select: {
            id: true,
            name: true,
            email: true
          },
          take: 10 // Limitar para não sobrecarregar a consulta
        }
      }
    }),

    // 2. Contagem total de funções com os mesmos filtros (exceto cursor)
    prisma.roles.count({
      where: {
        ...where,
        id: cursor ? undefined : where.id // Remover condição de cursor para contar todos
      }
    })
  ])

  // Verificar se há mais páginas
  const hasNextPage = roles.length === take && count > roles.length

  // Se há mais páginas, use o último ID como cursor
  const nextCursor = hasNextPage && roles.length > 0 ? roles[roles.length - 1]?.id : undefined

  return {
    roles: roles as RoleWithRelations[],
    metadata: {
      count,
      hasNextPage,
      cursor: nextCursor
    }
  }
}