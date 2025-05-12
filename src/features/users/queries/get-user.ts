// /features/users/queries/get-user.ts
"use server"

import { getAuth } from "@/features/auth/queries/get-auth"
import { prisma } from "@/lib/prisma"
import { cache } from "react"
import { notFound } from "next/navigation"

export const getUser = cache(async (userId: string) => {
  const { user } = await getAuth()

  if (!user) {
    notFound()
  }

  // Verificar se o usuário é admin
  const isAdmin = await checkIfUserIsAdmin(user.id)
  if (!isAdmin) {
    notFound()
  }

  const foundUser = await prisma.users.findUnique({
    where: {
      id: userId
    },
    include: {
      company: true,
      roles: true,
      speakers: true,
      attendance_list: {
        include: {
          events: {
            select: {
              id: true,
              title: true,
              date: true,
              format: true
            }
          }
        },
        orderBy: {
          created_at: "desc"
        },
        take: 5
      }
    }
  })

  if (!foundUser) {
    notFound()
  }

  return foundUser;
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