// /features/roles/actions/delete-role.ts
"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { setCoookieByKey } from "@/actions/cookies"
import { getAuthOrRedirect } from "@/features/auth/queries/get-auth-or-rerdirect"
import { rolesPath } from "@/app/paths"
import { toActionState } from "@/components/form/utils/to-action-state"
import { redirect } from "next/navigation"
import { logError, logInfo, logWarn } from "@/features/logs/queries/add-log"

export const deleteRole = async (id: string) => {
  const { user } = await getAuthOrRedirect()

  try {
    // Verificar se o usuário é admin
    const isAdmin = user.roles.some(role => role.name === "admin")
    if (!isAdmin) {
      await logWarn("Role.delete", `Acesso negado: usuário não-admin tentou excluir role`, user.id, {
        roleId: id,
        isAdmin
      })
      return toActionState("ERROR", "Você não tem permissão para excluir esta role")
    }

    // Verificar se a role existe
    const role = await prisma.roles.findUnique({
      where: { id },
      include: {
        users: {
          select: { id: true, name: true }
        }
      }
    })

    // Se não existe
    if (!role) {
      await logWarn("Role.delete", `Tentativa de excluir role inexistente #${id}`, user.id, {
        roleId: id
      })
      return toActionState("ERROR", "Role não encontrada")
    }

    // Não permitir excluir a role "admin"
    if (role.name === "admin") {
      await logWarn("Role.delete", `Tentativa de excluir a role protegida 'admin'`, user.id, {
        roleId: id
      })
      return toActionState("ERROR", "A role 'admin' não pode ser excluída")
    }

    // Verificar se há usuários associados a essa role
    if (role.users.length > 0) {
      await logWarn("Role.delete", `Tentativa de excluir role associada a usuários`, user.id, {
        roleId: id,
        roleName: role.name,
        userCount: role.users.length,
        users: role.users.map(u => ({ id: u.id, name: u.name }))
      })
      return toActionState("ERROR", `Esta role está associada a ${role.users.length} usuário(s) e não pode ser excluída`)
    }

    // Excluir a role
    await prisma.roles.delete({
      where: { id }
    })

    await logInfo("Role.delete", `Role #${id} (${role.name}) excluída com sucesso`, user.id, {
      roleId: id,
      roleName: role.name,
      description: role.description
    })

    revalidatePath(rolesPath())
    setCoookieByKey("revalidate", "true")
    setCoookieByKey("toast", "Role excluída com sucesso")
    return redirect(rolesPath())
  } catch (error) {
    await logError("Role.delete", `Erro ao excluir role #${id}`, user.id, {
      roleId: id,
      error: String(error)
    })
    console.error("Erro ao excluir role:", error)
    return toActionState("ERROR", "Ocorreu um erro ao excluir a role")
  }
}