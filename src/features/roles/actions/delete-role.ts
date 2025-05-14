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
    // Verificar se a função (role) existe
    const role = await prisma.roles.findUnique({
      where: { id },
      include: {
        users: {
          select: { id: true, name: true, email: true }
        },
        permissions: {
          select: { id: true, name: true }
        }
      }
    })

    // Se não existe ou o usuário não tem permissão
    if (!role) {
      await logWarn("Role.delete", `Tentativa de excluir função inexistente #${id}`, user.id, {
        roleId: id
      })
      return toActionState("ERROR", "Função não encontrada")
    }

    // Verificar se o usuário é admin
    const isAdmin = user.roles.some(role => role.name === "admin")
    if (!isAdmin) {
      await logWarn("Role.delete", `Acesso negado: usuário não-admin tentou excluir função`, user.id, {
        roleId: id,
        roleName: role.name,
        isAdmin
      })
      return toActionState("ERROR", "Você não tem permissão para excluir esta função")
    }

    // Verificar se a função está associada a algum usuário
    if (role.users.length > 0) {
      await logWarn("Role.delete", `Tentativa de excluir função associada a usuários`, user.id, {
        roleId: id,
        roleName: role.name,
        userCount: role.users.length,
        users: role.users.map(u => ({ id: u.id, name: u.name, email: u.email }))
      })
      return toActionState("ERROR", "Esta função está associada a usuários e não pode ser excluída")
    }

    // Excluir as relações com permissões
    await prisma.$executeRaw`DELETE FROM "_PermissionToRole" WHERE "A" IN (SELECT id FROM "permissions") AND "B" = ${id}`

    // Excluir a função
    await prisma.roles.delete({
      where: { id }
    })

    await logInfo("Role.delete", `Função #${id} (${role.name}) excluída com sucesso`, user.id, {
      roleId: id,
      roleName: role.name,
      permissionCount: role.permissions.length
    })

    revalidatePath(rolesPath())
    setCoookieByKey("revalidate", "true")
    setCoookieByKey("toast", "Função excluída com sucesso")
    return redirect(rolesPath())
  } catch (error) {
    await logError("Role.delete", `Erro ao excluir função #${id}`, user.id, {
      roleId: id,
      error: String(error)
    })
    console.error("Erro ao excluir função:", error)
    return toActionState("ERROR", "Ocorreu um erro ao excluir a função")
  }
}