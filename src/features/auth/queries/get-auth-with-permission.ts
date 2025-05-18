// /features/auth/queries/get-auth-with-permission.ts
"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getAuth } from "./get-auth"
import { signInPath } from "@/app/paths"
import { logWarn } from "@/features/logs/queries/add-log"
import { prisma } from "@/lib/prisma"
import { toActionState } from "@/components/form/utils/to-action-state"

/**
 * Verifica se o usuário está autenticado e redireciona para a página de login se não estiver
 * Se uma permissão for especificada, verifica se o usuário tem essa permissão
 * Mas não redireciona - apenas retorna um ActionState de erro
 * 
 * @param permission Nome opcional da permissão necessária
 * @returns Objeto com os dados do usuário e um possível estado de erro
 */
export const getAuthWithPermission = async (permission?: string) => {
  const auth = await getAuth()
  const headersInstance = await headers()

  // Se não estiver autenticado, redirecionar para login
  if (!auth.user) {
    const referer = headersInstance.get("referer")
    const logData = {
      path: referer ? (new URL(referer)).pathname : "URL desconhecida"
    }

    await logWarn("Auth", "Tentativa de acesso sem autenticação", undefined, logData)
    redirect(signInPath())
  }

  // Se uma permissão específica foi solicitada, verificar se o usuário a possui
  if (permission) {
    // Verificar se o usuário é admin (admins têm todas as permissões)
    const isAdmin = auth.user.roles.some(role => role.name === "admin")

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
        return {
          user: auth.user,
          error: toActionState("ERROR", "Usuário não encontrado")
        };
      }

      // Verificar se o usuário tem a permissão solicitada
      const hasPermission = userWithPermissions.roles.some(role =>
        role.permissions.some(perm => perm.name === permission)
      );

      // Se não tiver a permissão necessária, retornar um erro
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

        return {
          user: auth.user,
          error: toActionState("ERROR", `Você não tem permissão para realizar esta ação. Permissão necessária: ${permission}`)
        };
      }
    }
  }

  // Se tudo estiver ok, retorna o usuário sem erro
  return {
    user: auth.user,
    error: undefined
  };
}