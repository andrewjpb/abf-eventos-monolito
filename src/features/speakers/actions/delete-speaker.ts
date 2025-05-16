// /features/speakers/actions/delete-speaker.ts
"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { setCoookieByKey } from "@/actions/cookies"
import { speakersPath } from "@/app/paths"
import { toActionState } from "@/components/form/utils/to-action-state"
import { redirect } from "next/navigation"
import { logError, logInfo, logWarn } from "@/features/logs/queries/add-log"
import { getAuthWithPermission } from "@/features/auth/queries/get-auth-with-permission"

export const deleteSpeaker = async (id: string) => {
  const { user, error } = await getAuthWithPermission("speakers.delete")
  if (error) {
    return toActionState("ERROR", "Você não tem permissão para realizar esta ação")
  }

  try {
    // Verificar se o palestrante existe
    const speaker = await prisma.speakers.findUnique({
      where: { id },
      include: {
        events: {
          select: { id: true, title: true }
        },
        users: {
          select: { id: true, name: true }
        }
      }
    })

    // Se não existe
    if (!speaker) {
      await logWarn("Speaker.delete", `Tentativa de excluir palestrante inexistente #${id}`, user.id, {
        speakerId: id
      })
      return toActionState("ERROR", "Palestrante não encontrado")
    }

    // Verificar se o palestrante está associado a algum evento
    if (speaker.events.length > 0) {
      await logWarn("Speaker.delete", `Tentativa de excluir palestrante associado a eventos`, user.id, {
        speakerId: id,
        speakerName: speaker.users.name,
        eventCount: speaker.events.length,
        events: speaker.events.map(e => ({ id: e.id, title: e.title }))
      })
      return toActionState("ERROR", "Este palestrante está associado a eventos e não pode ser excluído")
    }

    // Excluir o palestrante
    await prisma.speakers.delete({
      where: { id }
    })

    await logInfo("Speaker.delete", `Palestrante #${id} (${speaker.users.name}) excluído com sucesso`, user.id, {
      speakerId: id,
      speakerName: speaker.users.name,
      description: speaker.description
    })

    revalidatePath(speakersPath())
    setCoookieByKey("revalidate", "true")
    setCoookieByKey("toast", "Palestrante excluído com sucesso")
    return redirect(speakersPath())
  } catch (error) {
    await logError("Speaker.delete", `Erro ao excluir palestrante #${id}`, user.id, {
      speakerId: id,
      error: String(error)
    })
    console.error("Erro ao excluir palestrante:", error)
    return toActionState("ERROR", "Ocorreu um erro ao excluir o palestrante")
  }
}