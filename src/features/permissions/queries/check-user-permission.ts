// /features/permissions/queries/check-user-permission.ts
"use server"

import { prisma } from "@/lib/prisma"
import { cache } from "react"

export const checkUserPermission = cache(async (userId: string, permissionName: string): Promise<boolean> => {
  if (!userId || !permissionName) {
    return false
  }

  try {
    // Verificar se o usuário é admin
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        roles: {
          select: { name: true }
        }
      }
    })

    if (!user) {
      return false
    }

    // Se o usuário for admin, ele tem todas as permissões
    const isAdmin = user.roles.some(role => role.name === "admin")
    if (isAdmin) {
      return true
    }

    // Verificar se o usuário tem a permissão específica
    const userWithPermissions = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            permissions: {
              select: { name: true }
            }
          }
        }
      }
    })

    if (!userWithPermissions) {
      return false
    }

    // Verificar se algum papel do usuário tem a permissão especificada
    const hasPermission = userWithPermissions.roles.some(role =>
      role.permissions.some(permission => permission.name === permissionName)
    )

    return hasPermission
  } catch (error) {
    console.error(`Erro ao verificar permissão ${permissionName}:`, error)
    return false
  }
})