// /features/sponsors/actions/update-sponsor-status.ts
"use server"

import { getAuthOrRedirect } from "@/features/auth/queries/get-auth-or-rerdirect"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { sponsorPath, sponsorsPath } from "@/app/paths"
import { toActionState } from "@/components/form/utils/to-action-state"
import { logError, logInfo, logWarn } from "@/features/logs/queries/add-log"

export async function updateSponsorStatus(sponsorId: string, active: boolean) {
  const { user } = await getAuthOrRedirect()

  // Verificar se o usuário é admin
  const isAdmin = user.roles.some(role => role.name === "admin")
  if (!isAdmin) {
    await logWarn("Sponsor.updateStatus", `Acesso negado: usuário não-admin tentou alterar status de patrocinador`, user.id, {
      sponsorId,
      targetStatus: active ? "ACTIVE" : "INACTIVE",
      isAdmin
    })
    return toActionState("ERROR", "Você não tem permissão para realizar esta ação")
  }

  try {
    // Verificar se o patrocinador existe
    const sponsor = await prisma.sponsors.findUnique({
      where: { id: sponsorId },
      select: {
        id: true,
        name: true,
        active: true
      }
    })

    if (!sponsor) {
      await logWarn("Sponsor.updateStatus", `Tentativa de atualizar status de patrocinador inexistente #${sponsorId}`, user.id, {
        sponsorId,
        targetStatus: active ? "ACTIVE" : "INACTIVE"
      })
      return toActionState("ERROR", "Patrocinador não encontrado")
    }

    // Atualizar o status do patrocinador
    await prisma.sponsors.update({
      where: { id: sponsorId },
      data: {
        active,
        updatedAt: new Date()
      }
    })

    await logInfo("Sponsor.updateStatus", `Status do patrocinador #${sponsorId} atualizado: ${sponsor.active} → ${active}`, user.id, {
      sponsorId,
      sponsorName: sponsor.name,
      oldStatus: sponsor.active ? "ACTIVE" : "INACTIVE",
      newStatus: active ? "ACTIVE" : "INACTIVE"
    })

    revalidatePath(sponsorsPath())
    revalidatePath(sponsorPath(sponsorId))

    return toActionState("SUCCESS", `Status atualizado para ${active ? "Ativo" : "Inativo"}`)
  } catch (error) {
    await logError("Sponsor.updateStatus", `Erro ao atualizar status do patrocinador #${sponsorId}`, user.id, {
      sponsorId,
      targetStatus: active ? "ACTIVE" : "INACTIVE",
      error: String(error)
    })
    console.error("Erro ao atualizar status do patrocinador:", error)
    return toActionState("ERROR", "Ocorreu um erro ao atualizar o status")
  }
}