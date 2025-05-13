// /features/permissions/queries/get-permission.ts
"use server"

import { cache } from "react"
import { prisma } from "@/lib/prisma"
import { getAuth } from "@/features/auth/queries/get-auth"
import { Permission } from "@/features/roles/types"

export const getPermission = cache(async (id: string) => {
  const { user } = await getAuth()

  // Verificar se o usuário tem permissão para acessar permissões
  if (!user) {
    return null
  }

  // Verificar se o usuário é admin
  const isAdmin = user.roles.some(role => role.name === "admin")
  if (!isAdmin) {
    return null
  }

  const permission = await prisma.permissions.findUnique({
    where: {
      id
    },
    include: {
      roles: {
        select: {
          id: true,
          name: true,
          description: true
        }
      }
    }
  })

  if (!permission) {
    return null
  }

  return {
    ...permission,
    isAuthorized: isAdmin
  } as Permission & {
    roles: { id: string; name: string; description: string }[],
    isAuthorized: boolean
  }
})