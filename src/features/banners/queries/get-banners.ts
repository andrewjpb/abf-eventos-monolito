// /features/banners/queries/get-banners.ts
"use server"

import { prisma } from "@/lib/prisma"
import { cache } from "react"

type GetBannersOptions = {
  limit?: number;
  onlyActive?: boolean;
  cursor?: string;
  search?: string;
  active?: string;
}

export const getBanners = cache(async (options: GetBannersOptions = {}) => {
  const {
    limit = 3,
    onlyActive = true,
    cursor,
    search,
    active
  } = options

  // Construir condições de filtro
  const where: any = {}

  // Verificar se estamos usando os parâmetros de filtro da URL
  const usingUrlFilters = active !== undefined || search !== undefined

  // Filtro por status ativo/inativo
  if (active === "ACTIVE") {
    where.active = true;
  } else if (active === "INACTIVE") {
    where.active = false;
  }
  // Se não estiver usando filtros da URL e for chamado para mostrar apenas ativos (como na sidebar)
  else if (!usingUrlFilters && onlyActive) {
    where.active = true;
  }
  // Para valor "ALL" ou undefined na URL, não aplicamos nenhum filtro de status

  // Filtro por termo de busca (título)
  if (search) {
    where.OR = [
      {
        title: {
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

  // Log para debug
  console.log("Filtro de busca:", where);

  // Consultas usando transação para garantir consistência
  const [banners, count, countActive, countInactive] = await prisma.$transaction([
    // 1. Consulta principal para obter os banners desta página
    prisma.highlight_card.findMany({
      where,
      orderBy: [
        { created_at: 'desc' as const }
      ],
      take: limit
    }),

    // 2. Contagem total de banners com os mesmos filtros (exceto cursor)
    prisma.highlight_card.count({
      where: {
        ...where,
        id: cursor ? undefined : where.id // Remover condição de cursor para contar todos
      }
    }),

    // 3. Contagem de banners ativos
    prisma.highlight_card.count({
      where: {
        active: true,
        ...(search ? { OR: where.OR } : {})
      }
    }),

    // 4. Contagem de banners inativos
    prisma.highlight_card.count({
      where: {
        active: false,
        ...(search ? { OR: where.OR } : {})
      }
    })
  ])

  // Verificar se há mais páginas
  const hasNextPage = banners.length === limit && count > banners.length

  // Se há mais páginas, use o último ID como cursor
  const nextCursor = hasNextPage ? banners[banners.length - 1]?.id : undefined

  // Se for uma consulta simples da sidebar, retorne o formato simplificado
  if (!cursor && limit <= 5 && !usingUrlFilters) {
    return {
      banners
    }
  }

  // Caso contrário, retorne os banners com metadados para paginação
  return {
    banners,
    metadata: {
      count,
      hasNextPage,
      cursor: nextCursor,
      countByStatus: {
        ACTIVE: countActive,
        INACTIVE: countInactive
      }
    }
  }
})