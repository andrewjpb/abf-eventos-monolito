import { PermissionWithRoles } from "../types"// /features/permissions/queries/get-permission.ts
"use server"

import { cache } from "react"
import { prisma } from "@/lib/prisma"
import { getAuth } from "@/features/auth/queries/get-auth"

export const getPermission = cache(async (id: string) => {
  const { user } = await getAuth()

  // Verificar se o usuário tem permissão para acessar permissões
  if (!user) {
    return null
  }

  const permission = await prisma.permissions.findUnique({
    where: {
      id
    },
    include: {
      roles: true // Incluir as roles associadas
    }
  })

  if (!permission) {
    return null
  }

  return permission as PermissionWithRoles
})