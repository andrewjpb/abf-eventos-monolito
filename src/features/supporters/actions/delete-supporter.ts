// /features/supporters/actions/delete-supporter.ts
"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { setCoookieByKey } from "@/actions/cookies"
import { supportersPath } from "@/app/paths"
import { toActionState } from "@/components/form/utils/to-action-state"
import { redirect } from "next/navigation"
import { logError, logInfo, logWarn } from "@/features/logs/queries/add-log"
import { getAuthWithPermission } from "@/features/auth/queries/get-auth-with-permission"

export const deleteSupporter = async (id: string) => {
  const { user, error } = await getAuthWithPermission("supporters.delete")
  if (error) {
    return toActionState("ERROR", "Você não tem permissão para realizar esta ação")
  }
  try {
    // Verificar se o apoiador existe
    const supporter = await prisma.supporters.findUnique({
      where: { id },
      include: {
        events: {
          select: { id: true, title: true }
        }
      }
    })

    // Se não existe ou o usuário não tem permissão
    if (!supporter) {
      await logWarn("Supporter.delete", `Tentativa de excluir apoiador inexistente #${id}`, user.id, {
        supporterId: id
      })
      return toActionState("ERROR", "Apoiador não encontrado")
    }

    // Verificar se o usuário é admin
    const isAdmin = user.roles.some(role => role.name === "admin")
    if (!isAdmin) {
      await logWarn("Supporter.delete", `Acesso negado: usuário não-admin tentou excluir apoiador`, user.id, {
        supporterId: id,
        supporterName: supporter.name,
        isAdmin
      })
      return toActionState("ERROR", "Você não tem permissão para excluir este apoiador")
    }

    // Verificar se o apoiador está associado a algum evento
    if (supporter.events.length > 0) {
      await logWarn("Supporter.delete", `Tentativa de excluir apoiador associado a eventos`, user.id, {
        supporterId: id,
        supporterName: supporter.name,
        eventCount: supporter.events.length,
        events: supporter.events.map(e => ({ id: e.id, title: e.title }))
      })
      return toActionState("ERROR", "Este apoiador está associado a eventos e não pode ser excluído")
    }

    // Excluir o apoiador
    await prisma.supporters.delete({
      where: { id }
    })

    await logInfo("Supporter.delete", `Apoiador #${id} (${supporter.name}) excluído com sucesso`, user.id, {
      supporterId: id,
      supporterName: supporter.name
    })

    revalidatePath(supportersPath())
    setCoookieByKey("revalidate", "true")
    setCoookieByKey("toast", "Apoiador excluído com sucesso")
    return redirect(supportersPath())
  } catch (error) {
    await logError("Supporter.delete", `Erro ao excluir apoiador #${id}`, user.id, {
      supporterId: id,
      error: String(error)
    })
    console.error("Erro ao excluir apoiador:", error)
    return toActionState("ERROR", "Ocorreu um erro ao excluir o apoiador")
  }
}