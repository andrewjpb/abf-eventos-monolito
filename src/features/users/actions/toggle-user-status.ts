// /features/users/actions/toggle-user-status.ts
"use server"

import { ActionState, toActionState } from "@/components/form/utils/to-action-state"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { usersPath } from "@/app/paths"
import { logError, logInfo, logWarn } from "@/features/logs/queries/add-log"
import { getAuthWithPermission } from "@/features/auth/queries/get-auth-with-permission"
export const toggleUserStatus = async (userId: string): Promise<ActionState> => {
  const { user, error } = await getAuthWithPermission("users.update")
  if (error) {
    return toActionState("ERROR", "Você não tem permissão para realizar esta ação")
  }

  // Verificar admin através da relação com roles
  const isAdmin = await checkIfUserIsAdmin(user.id)

  // Verificar se o usuário atual tem permissão de admin
  if (!isAdmin) {
    await logWarn("User.toggleStatus", `Acesso negado: usuário sem permissão de admin tentou alterar status de usuário #${userId}`, user.id, {
      targetUserId: userId,
      isAdmin
    })
    return toActionState("ERROR", "Sem permissão para realizar esta ação")
  }

  // Verificar se o usuário existe
  const targetUser = await prisma.users.findUnique({
    where: { id: userId }
  })

  if (!targetUser) {
    await logWarn("User.toggleStatus", `Tentativa de alterar status de usuário inexistente #${userId}`, user.id, {
      targetUserId: userId
    })
    return toActionState("ERROR", "Usuário não encontrado")
  }

  try {
    // Não permitir que o usuário desative a si mesmo
    if (targetUser.id === user.id) {
      await logWarn("User.toggleStatus", `Tentativa de auto-desativação rejeitada`, user.id, {
        targetUserId: userId
      })
      return toActionState("ERROR", "Não é possível alterar o status do seu próprio usuário")
    }

    // Alternar o status do usuário (ativar/desativar)
    const newStatus = !targetUser.active
    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: {
        active: newStatus
      }
    })

    const targetUserIsAdmin = await checkIfUserIsAdmin(targetUser.id)

    await logInfo("User.toggleStatus", `Status do usuário #${userId} (${targetUser.name}) alterado: ${targetUser.active ? 'desativado' : 'ativado'}`, user.id, {
      targetUserId: userId,
      targetUserName: targetUser.name,
      targetUserEmail: targetUser.email,
      previousStatus: targetUser.active ? 'ativo' : 'desativado',
      newStatus: newStatus ? 'ativo' : 'desativado',
      isAdmin: targetUserIsAdmin
    })

    // Revalidar o caminho para atualizar a UI
    revalidatePath(usersPath())

    const message = !updatedUser.active
      ? "Usuário desativado com sucesso"
      : "Usuário ativado com sucesso"

    return toActionState("SUCCESS", message)
  } catch (error) {
    await logError("User.toggleStatus", `Erro ao alterar status do usuário #${userId}`, user.id, {
      targetUserId: userId,
      targetUserName: targetUser.name,
      targetStatusChange: !targetUser.active,
      error: String(error)
    })

    console.error("Erro ao alterar status do usuário:", error)
    return toActionState("ERROR", "Ocorreu um erro ao alterar o status do usuário")
  }
}

// Função auxiliar para verificar se um usuário é admin
async function checkIfUserIsAdmin(userId: string): Promise<boolean> {
  // Verificamos se o usuário tem alguma role com permissão administrativa
  const user = await prisma.users.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          permissions: true
        }
      }
    }
  })

  if (!user) return false

  // Verifica se alguma role tem uma permissão que indica admin
  return user.roles.some(role =>
    role.name.toLowerCase().includes('admin') ||
    role.permissions.some(perm => perm.name.toLowerCase().includes('admin'))
  )
}