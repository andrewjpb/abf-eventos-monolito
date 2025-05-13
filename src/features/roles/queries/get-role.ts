// /features/roles/queries/get-role.ts
"use server"

import { cache } from "react"
import { prisma } from "@/lib/prisma"
import { getAuth } from "@/features/auth/queries/get-auth"
import { RoleWithRelations } from "../types"

export const getRole = cache(async (id: string) => {
  const { user } = await getAuth()

  // Verificar se o usuário tem permissão para acessar roles
  if (!user) {
    return null
  }

  // Verificar se o usuário é admin
  const isAdmin = user.roles.some(role => role.name === "admin")
  if (!isAdmin) {
    return null
  }

  const role = await prisma.roles.findUnique({
    where: {
      id
    },
    include: {
      permissions: true,
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          image_url: true
        }
      },
      _count: {
        select: {
          users: true,
          permissions: true
        }
      }
    }
  })

  if (!role) {
    return null
  }

  return {
    ...role,
    isAuthorized: isAdmin
  } as RoleWithRelations & { isAuthorized: boolean }
})