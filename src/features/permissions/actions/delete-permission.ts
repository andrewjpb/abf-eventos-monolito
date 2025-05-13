// /features/permissions/actions/delete-permission.ts
"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { setCoookieByKey } from "@/actions/cookies"
import { getAuthOrRedirect } from "@/features/auth/queries/get-auth-or-rerdirect"
import { permissionsPath } from "@/app/paths"
import { toActionState } from "@/components/form/utils/to-action-state"
import { redirect } from "next/navigation"
import { logError, logInfo, logWarn } from "@/features/logs/queries/add-log"

export const deletePermission = async (id: string) => {
  const { user } = await getAuthOrRedirect()

  try {
    // Verificar se o usuário é admin
    const isAdmin = user.roles.some(role => role.name === "admin")
    if (!isAdmin) {
      await logWarn("Permission.delete", `Acesso negado: usuário não-admin tentou excluir permissão`, user.id, {
        permissionId: id,
        isAdmin
      })
      return toActionState("ERROR", "Você não tem permissão para excluir esta permissão")
    }

    // Verificar se a permissão existe
    const permission = await prisma.permissions.findUnique({
      where: { id },
      include: {
        roles: {
          select: { id: true, name: true }
        }
      }
    })

    // Se não existe
    if (!permission) {
      await logWarn("Permission.delete", `Tentativa de excluir permissão inexistente #${id}`, user.id, {
        permissionId: id
      })
      return toActionState("ERROR", "Permissão não encontrada")
    }

    // Verificar se há roles associadas a essa permissão
    if (permission.roles.length > 0) {
      await logWarn("Permission.delete", `Tentativa de excluir permissão associada a roles`, user.id, {
        permissionId: id,
        permissionName: permission.name,
        roleCount: permission.roles.length,
        roles: permission.roles.map(r => ({ id: r.id, name: r.name }))
      })
      return toActionState("ERROR", `Esta permissão está associada a ${permission.roles.length} função(ões) e não pode ser excluída`)
    }

    // Excluir a permissão
    await prisma.permissions.delete({
      where: { id }
    })

    await logInfo("Permission.delete", `Permissão #${id} (${permission.name}) excluída com sucesso`, user.id, {
      permissionId: id,
      permissionName: permission.name,
      description: permission.description
    })

    revalidatePath(permissionsPath())
    setCoookieByKey("revalidate", "true")
    setCoookieByKey("toast", "Permissão excluída com sucesso")
    return redirect(permissionsPath())
  } catch (error) {
    await logError("Permission.delete", `Erro ao excluir permissão #${id}`, user.id, {
      permissionId: id,
      error: String(error)
    })
    console.error("Erro ao excluir permissão:", error)
    return toActionState("ERROR", "Ocorreu um erro ao excluir a permissão")
  }
}