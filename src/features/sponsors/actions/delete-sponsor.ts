// /features/sponsors/actions/delete-sponsor.ts
"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { setCoookieByKey } from "@/actions/cookies"
import { sponsorsPath } from "@/app/paths"
import { toActionState } from "@/components/form/utils/to-action-state"
import { redirect } from "next/navigation"
import { logError, logInfo, logWarn } from "@/features/logs/queries/add-log"
import { getPermissionOrRedirect } from "@/features/auth/queries/get-permission-or-redirect"

export const deleteSponsor = async (id: string) => {
  // Verificar se o usuário tem permissão para excluir patrocinadores
  const { user } = await getPermissionOrRedirect("sponsors.delete")

  try {
    // Verificar se o patrocinador existe
    const sponsor = await prisma.sponsors.findUnique({
      where: { id },
      include: {
        events: {
          select: { id: true, title: true }
        }
      }
    })

    // Se não existe
    if (!sponsor) {
      await logWarn("Sponsor.delete", `Tentativa de excluir patrocinador inexistente #${id}`, user.id, {
        sponsorId: id
      })
      return toActionState("ERROR", "Patrocinador não encontrado")
    }

    // Verificar se o patrocinador está associado a algum evento
    if (sponsor.events.length > 0) {
      await logWarn("Sponsor.delete", `Tentativa de excluir patrocinador associado a eventos`, user.id, {
        sponsorId: id,
        sponsorName: sponsor.name,
        eventCount: sponsor.events.length,
        events: sponsor.events.map(e => ({ id: e.id, title: e.title }))
      })
      return toActionState("ERROR", "Este patrocinador está associado a eventos e não pode ser excluído")
    }

    // Excluir o patrocinador
    await prisma.sponsors.delete({
      where: { id }
    })

    await logInfo("Sponsor.delete", `Patrocinador #${id} (${sponsor.name}) excluído com sucesso`, user.id, {
      sponsorId: id,
      sponsorName: sponsor.name,
      description: sponsor.description
    })

    revalidatePath(sponsorsPath())
    setCoookieByKey("revalidate", "true")
    setCoookieByKey("toast", "Patrocinador excluído com sucesso")
    return redirect(sponsorsPath())
  } catch (error) {
    await logError("Sponsor.delete", `Erro ao excluir patrocinador #${id}`, user.id, {
      sponsorId: id,
      error: String(error)
    })
    console.error("Erro ao excluir patrocinador:", error)
    return toActionState("ERROR", "Ocorreu um erro ao excluir o patrocinador")
  }
}