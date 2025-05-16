// /features/auth/queries/get-auth-with-permission-or-redirect.ts
"use server"

import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { getAuth } from "./get-auth"
import { logWarn } from "@/features/logs/queries/add-log"
import { prisma } from "@/lib/prisma"

/**
 * Verifica se o usuário está autenticado e possui a permissão especificada.
 * Se não estiver autenticado, redireciona para a página de login.
 * Se não tiver a permissão necessária, retorna um 404.
 * 
 * @param permission Nome opcional da permissão necessária
 * @returns Objeto com os dados do usuário autenticado
 */
export async function getAuthWithPermissionOrRedirect(permission?: string) {
  const auth = await getAuth()
  const headersInstance = await headers()

  // Se não estiver autenticado, redirecionar para login
  if (!auth.user) {
    const referer = headersInstance.get("referer")
    const logData = {
      path: referer ? (new URL(referer)).pathname : "URL desconhecida"
    }

    await logWarn("Auth", "Tentativa de acesso sem autenticação", undefined, logData)
    return notFound()
  }

  // Se uma permissão específica foi solicitada, verificar se o usuário a possui
  if (permission) {
    // Verificar se o usuário é admin (admins têm todas as permissões)
    const isAdmin = auth.user.roles?.some(role => role.name === "admin")

    // Se não for admin, verificar se tem a permissão específica
    if (!isAdmin) {
      // Carrega o usuário com suas permissões
      const userWithPermissions = await prisma.users.findUnique({
        where: { id: auth.user.id },
        include: {
          roles: {
            include: {
              permissions: {
                select: { id: true, name: true }
              }
            }
          }
        }
      });

      if (!userWithPermissions) {
        notFound(); // Retorna 404 se o usuário não for encontrado
      }

      // Verificar se o usuário tem a permissão solicitada
      const hasPermission = userWithPermissions.roles.some(role =>
        role.permissions.some(perm => perm.name === permission)
      );

      // Se não tiver a permissão necessária, registrar o log e retornar 404
      if (!hasPermission) {
        const referer = headersInstance.get("referer")
        const roleNames = auth.user.roles ? auth.user.roles.map((r: any) => r.name).join(', ') : 'none';

        const logData = {
          path: referer ? (new URL(referer)).pathname : "URL desconhecida",
          requiredPermission: permission,
          userId: auth.user.id,
          userName: auth.user.username,
          roles: roleNames
        }

        await logWarn("Auth", `Acesso negado: usuário sem permissão "${permission}"`, auth.user.id, logData)

        notFound(); // Retorna 404 para não revelar a existência da permissão
      }
    }
  }

  // Se tudo estiver ok, retorna o usuário
  return auth.user;
}