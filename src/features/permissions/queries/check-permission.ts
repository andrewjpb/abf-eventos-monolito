// /features/permissions/queries/check-panel-access.ts
"use server"

import { prisma } from "@/lib/prisma"
import { cache } from "react"

export const checkPanelAccess = cache(async (userId: string): Promise<boolean> => {
  if (!userId) {
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

    // Se o usuário for admin, ele tem acesso ao painel
    const isAdmin = user.roles.some(role => role.name === "admin")
    if (isAdmin) {
      return true
    }

    // Verificar se o usuário tem a permissão panel.access ou qualquer permissão de acesso a recursos
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

    // Verificar se o usuário tem pelo menos uma permissão que dê acesso ao painel
    const hasPanelAccess = userWithPermissions.roles.some(role =>
      role.permissions.some(permission => {
        // Verificar permissão específica panel.access
        if (permission.name === 'panel.access') return true;

        // Verificar permissões que dão acesso a recursos do painel (prefixos comuns)
        return permission.name.includes('.view') ||
          permission.name.includes('.create') ||
          permission.name.includes('.update') ||
          permission.name.includes('.delete');
      })
    );

    return hasPanelAccess;
  } catch (error) {
    console.error("Erro ao verificar acesso ao painel:", error)
    return false
  }
})