// /features/supporters/queries/get-supporters.ts
"use server"

import { prisma } from "@/lib/prisma"

type GetSupportersOptions = {
  cursor?: string;
  search?: string;
  active?: string;
}

export async function getSupporters(options: GetSupportersOptions = {}) {
  const { cursor, search, active } = options
  const take = 9 // Número de itens por página

  // Construir condições de filtro
  const where: any = {}

  // Filtro por status ativo/inativo
  if (active === "ACTIVE") {
    where.active = true;
  } else if (active === "INACTIVE") {
    where.active = false;
  } else if (active === "WITH_EVENTS") {
    where.events = {
      some: {}
    };
  }

  // Filtro por termo de busca
  if (search) {
    where.OR = [
      {
        name: {
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
  const [supporters, count, countActive, countInactive, countWithEvents] = await prisma.$transaction([
    // 1. Consulta principal para obter os apoiadores desta página
    prisma.supporters.findMany({
      where,
      include: {
        events: true
      },
      take,
      orderBy: [
        { id: "desc" } // Simplificando para usar apenas o ID como critério de ordenação
      ]
    }),

    // 2. Contagem total de apoiadores com os mesmos filtros (exceto cursor)
    prisma.supporters.count({
      where: {
        ...where,
        id: cursor ? undefined : where.id // Remover condição de cursor para contar todos
      }
    }),

    // 3. Contagem de apoiadores ativos
    prisma.supporters.count({
      where: {
        active: true,
        ...(search ? { OR: where.OR } : {})
      }
    }),

    // 4. Contagem de apoiadores inativos
    prisma.supporters.count({
      where: {
        active: false,
        ...(search ? { OR: where.OR } : {})
      }
    }),

    // 5. Contagem de apoiadores com pelo menos um evento associado
    prisma.supporters.count({
      where: {
        events: {
          some: {}
        },
        ...(search ? { OR: where.OR } : {})
      }
    })
  ])

  // Verificar se há mais páginas - usando a mesma lógica dos logs
  const hasNextPage = supporters.length === take && count > supporters.length

  // Se há mais páginas, use o último ID como cursor
  const nextCursor = hasNextPage ? supporters[supporters.length - 1]?.id : undefined

  return {
    supporters,
    metadata: {
      count,
      hasNextPage,
      cursor: nextCursor,
      countByStatus: {
        ACTIVE: countActive,
        INACTIVE: countInactive,
        WITH_EVENTS: countWithEvents
      }
    }
  }
}