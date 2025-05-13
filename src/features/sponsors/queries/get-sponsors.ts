// /features/sponsors/queries/get-sponsors.ts
"use server"

import { prisma } from "@/lib/prisma"

type GetSponsorsOptions = {
  cursor?: string;
  search?: string;
  active?: string;
}

export async function getSponsors(options: GetSponsorsOptions = {}) {
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
  const [sponsors, count, countActive, countInactive, countWithEvents] = await prisma.$transaction([
    // 1. Consulta principal para obter os patrocinadores desta página
    prisma.sponsors.findMany({
      where,
      include: {
        events: true
      },
      take,
      orderBy: [
        { id: "desc" } // Simplificando para usar apenas o ID como critério de ordenação
      ]
    }),

    // 2. Contagem total de patrocinadores com os mesmos filtros (exceto cursor)
    prisma.sponsors.count({
      where: {
        ...where,
        id: cursor ? undefined : where.id // Remover condição de cursor para contar todos
      }
    }),

    // 3. Contagem de patrocinadores ativos
    prisma.sponsors.count({
      where: {
        active: true,
        ...(search ? { OR: where.OR } : {})
      }
    }),

    // 4. Contagem de patrocinadores inativos
    prisma.sponsors.count({
      where: {
        active: false,
        ...(search ? { OR: where.OR } : {})
      }
    }),

    // 5. Contagem de patrocinadores com pelo menos um evento associado
    prisma.sponsors.count({
      where: {
        events: {
          some: {}
        },
        ...(search ? { OR: where.OR } : {})
      }
    })
  ])

  // Verificar se há mais páginas - usando a mesma lógica dos logs
  const hasNextPage = sponsors.length === take && count > sponsors.length

  // Se há mais páginas, use o último ID como cursor
  const nextCursor = hasNextPage ? sponsors[sponsors.length - 1]?.id : undefined

  return {
    sponsors,
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