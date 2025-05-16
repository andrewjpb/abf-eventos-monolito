// /features/speakers/queries/search-users.ts
"use server"

import { prisma } from "@/lib/prisma"
import { getAuth } from "@/features/auth/queries/get-auth"

type SearchUsersOptions = {
  search?: string;
  userId?: string; // Adicionado para buscar por ID específico
  limit?: number;
}

/**
 * Busca usuários que podem ser associados como palestrantes
 * com opções de filtragem e paginação
 */
export async function searchUsers(options: SearchUsersOptions = {}) {
  const { user } = await getAuth()
  const { search = "", userId = null, limit = 20 } = options

  // Verificar se o usuário tem permissão
  if (!user) {
    return {
      users: [],
      metadata: { total: 0 }
    }
  }

  // Verificar se o usuário é admin
  const isAdmin = user.roles.some(role => role.name === "admin")
  if (!isAdmin) {
    return {
      users: [],
      metadata: { total: 0 }
    }
  }

  // Construir condições de consulta
  const where: any = {
  }

  // Se temos um ID específico, procurar apenas por esse usuário
  if (userId) {
    where.id = userId;
  }
  // Caso contrário, aplicar filtro de busca por texto
  else if (search && search.trim() !== "") {
    where.OR = [
      {
        name: {
          contains: search,
          mode: "insensitive"
        }
      },
      {
        email: {
          contains: search,
          mode: "insensitive"
        }
      },
      {
        position: {
          contains: search,
          mode: "insensitive"
        }
      },
      {
        company: {
          name: {
            contains: search,
            mode: "insensitive"
          }
        }
      }
    ]
  }

  try {
    // Executar as consultas em uma transação para garantir consistência
    const [users, total] = await prisma.$transaction([
      // 1. Buscar usuários filtrados
      prisma.users.findMany({
        where,
        orderBy: {
          name: "asc"
        },
        take: limit,
        include: {
          company: true
        }
      }),

      // 2. Contar o total
      prisma.users.count({
        where
      })
    ]);

    return {
      users,
      metadata: {
        total
      }
    }
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    throw error;
  }
}