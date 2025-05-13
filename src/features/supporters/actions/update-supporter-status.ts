// /features/supporters/actions/update-supporter-status.ts
"use server"

import { getAuthOrRedirect } from "@/features/auth/queries/get-auth-or-rerdirect"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { supporterPath, supportersPath } from "@/app/paths"
import { toActionState } from "@/components/form/utils/to-action-state"
import { logError, logInfo, logWarn } from "@/features/logs/queries/add-log"

export async function updateSupporterStatus(supporterId: string, active: boolean) {
  const { user } = await getAuthOrRedirect()

  // Verificar se o usuário é admin
  const isAdmin = user.roles.some(role => role.name === "admin")
  if (!isAdmin) {
    await logWarn("Supporter.updateStatus", `Acesso negado: usuário não-admin tentou alterar status de apoiador`, user.id, {
      supporterId,
      targetStatus: active ? "ACTIVE" : "INACTIVE",
      isAdmin
    })
    return toActionState("ERROR", "Você não tem permissão para realizar esta ação")
  }

  try {
    // Verificar se o apoiador existe
    const supporter = await prisma.supporters.findUnique({
      where: { id: supporterId },
      select: {
        id: true,
        name: true,
        active: true
      }
    })

    if (!supporter) {
      await logWarn("Supporter.updateStatus", `Tentativa de atualizar status de apoiador inexistente #${supporterId}`, user.id, {
        supporterId,
        targetStatus: active ? "ACTIVE" : "INACTIVE"
      })
      return toActionState("ERROR", "Apoiador não encontrado")
    }

    // Atualizar o status do apoiador
    await prisma.supporters.update({
      where: { id: supporterId },
      data: {
        active,
        updatedAt: new Date()
      }
    })

    await logInfo("Supporter.updateStatus", `Status do apoiador #${supporterId} atualizado: ${supporter.active} → ${active}`, user.id, {
      supporterId,
      supporterName: supporter.name,
      oldStatus: supporter.active ? "ACTIVE" : "INACTIVE",
      newStatus: active ? "ACTIVE" : "INACTIVE"
    })

    revalidatePath(supportersPath())
    revalidatePath(supporterPath(supporterId))

    return toActionState("SUCCESS", `Status atualizado para ${active ? "Ativo" : "Inativo"}`)
  } catch (error) {
    await logError("Supporter.updateStatus", `Erro ao atualizar status do apoiador #${supporterId}`, user.id, {
      supporterId,
      targetStatus: active ? "ACTIVE" : "INACTIVE",
      error: String(error)
    })
    console.error("Erro ao atualizar status do apoiador:", error)
    return toActionState("ERROR", "Ocorreu um erro ao atualizar o status")
  }
}