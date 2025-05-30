// /features/banners/actions/update-banner-status.ts
"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { bannerPath, bannersPath } from "@/app/paths"
import { toActionState } from "@/components/form/utils/to-action-state"
import { logError, logInfo, logWarn } from "@/features/logs/queries/add-log"
import { getAuthWithPermission } from "@/features/auth/queries/get-auth-with-permission"

export async function updateBannerStatus(bannerId: string, active: boolean) {
  const { user, error } = await getAuthWithPermission("banners.update")
  // Se houver erro de permissão, retornar o erro
  if (error) {
    return toActionState("ERROR", "Você não tem permissão para realizar esta ação")
  }

  try {
    // Verificar se o banner existe
    const banner = await prisma.highlight_card.findUnique({
      where: { id: bannerId },
      select: {
        id: true,
        title: true,
        active: true
      }
    })

    if (!banner) {
      await logWarn("Banner.updateStatus", `Tentativa de atualizar status de banner inexistente #${bannerId}`, user.id, {
        bannerId,
        targetStatus: active ? "ACTIVE" : "INACTIVE"
      })
      return toActionState("ERROR", "Banner não encontrado")
    }

    // Atualizar o status do banner
    await prisma.highlight_card.update({
      where: { id: bannerId },
      data: {
        active,
        updatedAt: new Date()
      }
    })

    await logInfo("Banner.updateStatus", `Status do banner #${bannerId} atualizado: ${banner.active} → ${active}`, user.id, {
      bannerId,
      bannerTitle: banner.title,
      oldStatus: banner.active ? "ACTIVE" : "INACTIVE",
      newStatus: active ? "ACTIVE" : "INACTIVE"
    })

    revalidatePath(bannersPath())
    revalidatePath(bannerPath(bannerId))
    revalidatePath('/')

    return toActionState("SUCCESS", `Status atualizado para ${active ? "Ativo" : "Inativo"}`)
  } catch (error) {
    await logError("Banner.updateStatus", `Erro ao atualizar status do banner #${bannerId}`, user.id, {
      bannerId,
      targetStatus: active ? "ACTIVE" : "INACTIVE",
      error: String(error)
    })
    console.error("Erro ao atualizar status do banner:", error)
    return toActionState("ERROR", "Ocorreu um erro ao atualizar o status")
  }
}