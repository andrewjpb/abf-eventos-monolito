// /features/roles/queries/get-role.ts
"use server"

import { cache } from "react"
import { prisma } from "@/lib/prisma"
import { getAuth } from "@/features/auth/queries/get-auth"
import { RoleWithRelations } from "../types"

export const getRole = cache(async (id: string) => {
  const { user } = await getAuth()

  // Verificar se o usuário está autenticado
  if (!user) {
    return null
  }

  const role = await prisma.roles.findUnique({
    where: {
      id
    },
    include: {
      permissions: true, // Incluir as permissões associadas
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          position: true
        }
      }
    }
  })

  if (!role) {
    return null
  }

  return role as RoleWithRelations
})