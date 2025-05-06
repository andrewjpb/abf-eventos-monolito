// /features/logs/queries/get-logs.ts
"use server"

import { prisma } from "@/lib/prisma"
import { LogWithUser } from "../types"

type GetLogsOptions = {
  cursor?: string;
  level?: string;
  userId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export async function getLogs(options: GetLogsOptions = {}) {
  const { cursor, level, userId, action, startDate, endDate, limit = 50 } = options

  // Construir condições de filtro
  const where: any = {}

  // Filtro por nível do log
  if (level) {
    where.level = level
  }

  // Filtro por usuário
  if (userId) {
    where.userId = userId
  }

  // Filtro por ação
  if (action) {
    where.action = {
      contains: action,
      mode: "insensitive"
    }
  }

  // Filtro por intervalo de datas
  if (startDate || endDate) {
    where.createdAt = {}

    if (startDate) {
      where.createdAt.gte = startDate
    }

    if (endDate) {
      // Adicionar 1 dia ao endDate para incluir o dia completo
      const endDateWithDay = new Date(endDate)
      endDateWithDay.setDate(endDateWithDay.getDate() + 1)
      where.createdAt.lt = endDateWithDay
    }
  }

  // Condição de cursor para paginação
  if (cursor) {
    where.id = {
      lt: cursor
    }
  }

  // Consultas usando transação para garantir consistência
  const [logs, count] = await prisma.$transaction([
    // 1. Consulta principal para obter os logs desta página
    prisma.appLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            position: true
          }
        }
      },
      take: limit,
      orderBy: {
        createdAt: "desc"
      }
    }),

    // 2. Contagem total de logs com os filtros aplicados
    prisma.appLog.count({
      where
    })
  ])

  // Verificar se há mais páginas
  const hasNextPage = logs.length === limit && count > limit
  const nextCursor = hasNextPage ? logs[logs.length - 1]?.id : undefined

  // Contagem por nível de log
  const countsByLevel = await prisma.$transaction([
    prisma.appLog.count({
      where: {
        ...where,
        level: "INFO"
      }
    }),
    prisma.appLog.count({
      where: {
        ...where,
        level: "ERROR"
      }
    }),
    prisma.appLog.count({
      where: {
        ...where,
        level: "WARN"
      }
    }),
    prisma.appLog.count({
      where: {
        ...where,
        level: "DEBUG"
      }
    })
  ])

  return {
    logs: logs as LogWithUser[],
    metadata: {
      count,
      hasNextPage,
      cursor: nextCursor,
      countsByLevel: {
        INFO: countsByLevel[0],
        ERROR: countsByLevel[1],
        WARN: countsByLevel[2],
        DEBUG: countsByLevel[3]
      }
    }
  }
}

// Função para obter a lista de ações únicas para o autocomplete
export async function getUniqueActions() {
  const actions = await prisma.appLog.groupBy({
    by: ['action'],
    orderBy: {
      _count: {
        action: 'desc'
      }
    },
    take: 20, // Limitar aos 20 mais comuns
  })

  return actions.map(item => item.action)
}

// Função para obter a lista de usuários que têm logs
export async function getLogUsers() {
  const userIds = await prisma.appLog.groupBy({
    by: ['userId'],
    where: {
      userId: {
        not: null
      }
    }
  })

  const users = await prisma.users.findMany({
    where: {
      id: {
        in: userIds.map(u => u.userId).filter(Boolean) as string[]
      }
    },
    select: {
      id: true,
      name: true
    },
    orderBy: {
      name: 'asc'
    }
  })

  return users
}