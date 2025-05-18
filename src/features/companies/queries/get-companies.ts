// /features/companies/queries/get-companies.ts
"use server"

import { prisma } from "@/lib/prisma"
import { CompanyWithRelations } from "../types"

type GetCompaniesOptions = {
  cursor?: string;
  search?: string;
  segment?: string;
  active?: string;
}

export async function getCompanies(options: GetCompaniesOptions = {}) {

  const { cursor, search, segment, active } = options
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
        cnpj: {
          contains: search,
          mode: "insensitive"
        }
      }
    ]
  }

  // Filtro por segmento
  if (segment) {
    where.segment = {
      contains: segment,
      mode: "insensitive"
    }
  }

  // Filtro por status (ativo/inativo)
  if (active === "true") {
    where.active = true
  } else if (active === "false") {
    where.active = false
  }

  // Condição de cursor para paginação
  if (cursor) {
    where.id = {
      lt: cursor // Usar "lt" (less than) com ordenação "desc"
    }
  }

  // Consultas usando transação para garantir consistência
  const [companies, count] = await prisma.$transaction([
    // 1. Consulta principal para obter as empresas desta página
    prisma.company.findMany({
      where,
      take,
      orderBy: [
        { id: "desc" } // Usar ordenação "desc" para funcionar com cursor "lt"
      ],
      include: {
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

    // 2. Contagem total de empresas com os mesmos filtros (exceto cursor)
    prisma.company.count({
      where: {
        ...where,
        id: cursor ? undefined : where.id // Remover condição de cursor para contar todos
      }
    })
  ])

  // Verificar se há mais páginas
  const hasNextPage = companies.length === take && count > companies.length

  // Se há mais páginas, use o último ID como cursor
  const nextCursor = hasNextPage && companies.length > 0 ? companies[companies.length - 1]?.id : undefined

  return {
    companies: companies as CompanyWithRelations[],
    metadata: {
      count,
      hasNextPage,
      cursor: nextCursor
    }
  }
}