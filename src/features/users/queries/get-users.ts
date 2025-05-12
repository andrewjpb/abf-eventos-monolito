// /features/users/queries/get-users.ts
"use server";

import { getAuth } from "@/features/auth/queries/get-auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { notFound } from "next/navigation";
import { cache } from "react";

type GetUsersParams = {
  /** cursor para paginação */
  cursor?: string;
  search?: string;
  status?: "all" | "active" | "inactive" | "admin";
  take?: number;
};

export const getUsers = cache(async ({
  cursor,
  search = "",
  status = "all",
  take = 10,
}: GetUsersParams = {}) => {
  const { user } = await getAuth();

  if (!user) {
    notFound()
  }

  // Verificar admin
  const isAdmin = await checkIfUserIsAdmin(user.id)
  if (!isAdmin) {
    return {
      users: [],
      metadata: {
        count: 0,
        hasNextPage: false,
        cursor: undefined,
      },
    };
  }

  // Monta o WHERE baseado no cursor, busca e status
  const where: Prisma.usersWhereInput = {};

  if (cursor) {
    where.created_at = { lt: new Date(parseInt(cursor, 10)) };
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { username: { contains: search, mode: "insensitive" } },
      { position: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status === "active") {
    where.active = true;
  } else if (status === "inactive") {
    where.active = false;
  } else if (status === "admin") {
    // No caso de "admin", precisamos verificar os usuários que têm roles de admin
    // Isso é mais complexo porque não temos um campo "admin" direto
    // Precisamos usar uma abordagem diferente
    where.roles = {
      some: {
        OR: [
          { name: { contains: "admin", mode: "insensitive" } },
          { permissions: { some: { name: { contains: "admin", mode: "insensitive" } } } }
        ]
      }
    };
  }

  // Transação: busca os registros, conta total e quantos já vieram antes do cursor
  const [users, count, loadedBefore] = await prisma.$transaction([
    // 1. Busca os usuários para esta página
    prisma.users.findMany({
      where,
      include: {
        company: {
          select: {
            name: true,
            segment: true,
          }
        },
        roles: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      take,
      orderBy: {
        created_at: "desc",
      },
    }),

    // 2. Contagem total de registros (sem cursor)
    prisma.users.count({
      where: {
        ...where,
        created_at: undefined,
      },
    }),

    // 3. Quantos registros vieram antes do cursor
    cursor
      ? prisma.users.count({
        where: {
          ...where,
          created_at: { gte: new Date(parseInt(cursor, 10)) },
        },
      })
      : prisma.users.count({
        where: {
          created_at: { equals: new Date("1900-01-01") },
        },
      }),
  ]);

  // Checa se ainda há próxima página
  const totalLoaded = loadedBefore + users.length;
  const hasNextPage = count > totalLoaded;

  return {
    users,
    metadata: {
      count,
      hasNextPage,
      cursor:
        users.length > 0
          ? users[users.length - 1]!.created_at.valueOf().toString()
          : undefined,
    },
  };
});

// Função auxiliar para verificar se um usuário é admin
async function checkIfUserIsAdmin(userId: string): Promise<boolean> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          permissions: true
        }
      }
    }
  })

  if (!user) return false

  return user.roles.some(role =>
    role.name.toLowerCase().includes('admin') ||
    role.permissions.some(perm => perm.name.toLowerCase().includes('admin'))
  )
}