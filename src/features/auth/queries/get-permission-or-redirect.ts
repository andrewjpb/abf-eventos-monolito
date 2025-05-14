// /features/permissions/queries/get-permission-or-redirect.ts
"use server"

import { redirect } from "next/navigation"
import { getAuth } from "@/features/auth/queries/get-auth"
import { signInPath } from "@/app/paths"
import { logWarn } from "@/features/logs/queries/add-log"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"

export const getPermissionOrRedirect = async (permissionName: string) => {
  const auth = await getAuth()
  const headersInstance = await headers()

  // Se não houver usuário, redirecionar para login
  if (!auth.user) {
    const referer = headersInstance.get("referer")
    const logData = {
      path: referer ? (new URL(referer)).pathname : "URL desconhecida",
      requiredPermission: permissionName
    }

    await logWarn("Auth", "Tentativa de acesso sem autenticação", undefined, logData)
    redirect(signInPath())
  }

  // Verificar se o usuário é admin - admins têm todas as permissões
  const isAdmin = auth.user.roles.some(role => role.name === "admin")
  if (isAdmin) {
    return auth
  }

  // Verificar se o usuário tem a permissão específica
  // Primeiro carregamos as permissões dos papéis do usuário
  const userWithPermissions = await prisma.users.findUnique({
    where: { id: auth.user.id },
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
    redirect(signInPath())
  }

  // Verificar se algum dos papéis do usuário tem a permissão requerida
  const hasPermission = userWithPermissions.roles.some(role =>
    role.permissions.some(permission => permission.name === permissionName)
  )

  if (!hasPermission) {
    const referer = headersInstance.get("referer")
    const roleNames = auth.user.roles ? auth.user.roles.map((r) => r.name).join(', ') : 'none'

    const logData = {
      userId: auth.user.id,
      userName: auth.user.username,
      roles: roleNames,
      requiredPermission: permissionName,
      path: referer ? (new URL(referer)).pathname : "URL desconhecida"
    }

    await logWarn("Auth", `Acesso negado: usuário sem permissão '${permissionName}'`, auth.user.id, logData)

    // Redirecionar para not found (403 ou 404, dependendo da sua estratégia)
    redirect("/not-found")
  }

  return auth
}