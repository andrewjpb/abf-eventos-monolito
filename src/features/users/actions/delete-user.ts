// /features/users/actions/delete-user.ts
"use server"

import { ActionState, toActionState } from "@/components/form/utils/to-action-state"
import { getAuthOrRedirect } from "@/features/auth/queries/get-auth-or-rerdirect"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { usersPath } from "@/app/paths"
import { redirect } from "next/navigation"
import { logError, logInfo, logWarn } from "@/features/logs/queries/add-log"
import { getAuthWithPermission } from "@/features/auth/queries/get-auth-with-permission"
export const deleteUser = async (userId: string): Promise<ActionState> => {

  const { user, error } = await getAuthWithPermission("users.delete")
  if (error) {
    return toActionState("ERROR", "Você não tem permissão para realizar esta ação")
  }

  // Verificar admin através da relação com roles que têm permissões administrativas
  const isAdmin = await checkIfUserIsAdmin(user.id)

  if (!isAdmin) {
    await logWarn("User.delete", `Acesso negado: usuário sem permissão de admin tentou excluir usuário #${userId}`, user.id, {
      targetUserId: userId,
      isAdmin: false
    })
    return toActionState("ERROR", "Sem permissão para realizar esta ação")
  }

  const userToDelete = await prisma.users.findUnique({ where: { id: userId } })

  if (!userToDelete) {
    await logWarn("User.delete", `Tentativa de excluir usuário inexistente #${userId}`, user.id, {
      targetUserId: userId
    })
    return toActionState("ERROR", "Usuário não encontrado")
  }

  if (userToDelete.id === user.id) {
    await logWarn("User.delete", `Tentativa de auto-exclusão rejeitada`, user.id, {
      targetUserId: userId
    })
    return toActionState("ERROR", "Não é possível excluir seu próprio usuário")
  }

  try {
    // Primeiro verificamos as relações
    const [attendanceRecords, speakerProfile] = await Promise.all([
      prisma.attendance_list.count({ where: { userId } }),
      prisma.speakers.findUnique({ where: { moderatorId: userId } })
    ]);

    // Se houver participações em eventos ou perfil de palestrante
    if (attendanceRecords > 0 || speakerProfile) {
      await logWarn("User.delete", `Exclusão negada: usuário tem registros relacionados`, user.id, {
        targetUserId: userId,
        targetUserName: userToDelete.name,
        hasAttendanceRecords: attendanceRecords > 0,
        hasSpeakerProfile: !!speakerProfile
      })
      return toActionState("ERROR", `Não é possível excluir este usuário pois ele ${attendanceRecords > 0 ? 'possui registros de participação em eventos' : ''} ${attendanceRecords > 0 && speakerProfile ? ' e ' : ''} ${speakerProfile ? 'é um palestrante registrado' : ''}.`)
    }

    // Se não tiver impedimentos, prosseguimos com a exclusão
    await prisma.$transaction(async tx => {
      // Remover relações com roles (usando a tabela de relacionamento de muitos para muitos)
      await tx.$executeRaw`DELETE FROM "_RoleToUser" WHERE "B" = ${userId}`

      // Remover sessões
      await tx.session.deleteMany({ where: { userId } })

      // Remover logs
      await tx.appLog.deleteMany({ where: { userId } })

      // Finalmente excluir o usuário
      await tx.users.delete({ where: { id: userId } })
    })

    const userIsAdmin = await checkIfUserIsAdmin(userToDelete.id)

    await logInfo("User.delete", `Usuário #${userId} (${userToDelete.name}) excluído com sucesso`, user.id, {
      targetUserId: userId,
      targetUserName: userToDelete.name,
      targetUserEmail: userToDelete.email,
      wasAdmin: userIsAdmin
    })

  } catch (error) {
    await logError("User.delete", `Erro ao excluir usuário #${userId}`, user.id, {
      targetUserId: userId,
      targetUserName: userToDelete.name,
      error: String(error)
    })

    console.error("Erro ao excluir usuário:", error)
    return toActionState("ERROR", "Ocorreu um erro ao excluir o usuário")
  }

  revalidatePath(usersPath())
  return redirect(usersPath())
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
  // Esta lógica pode ser ajustada conforme a sua implementação de permissões
  return user.roles.some(role =>
    role.name.toLowerCase().includes('admin') ||
    role.permissions.some(perm => perm.name.toLowerCase().includes('admin'))
  )
}