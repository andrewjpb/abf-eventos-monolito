// /features/events/actions/update-event-status.ts
"use server"

import { getAdminOrRedirect } from "@/features/auth/queries/get-auth-or-rerdirect"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { eventPath, eventsPath } from "@/app/paths"
import { toActionState } from "@/components/form/utils/to-action-state"
import { logError, logInfo, logWarn } from "@/features/logs/queries/add-log"
import { getAuthWithPermission } from "@/features/auth/queries/get-auth-with-permission"
// Função para publicar ou despublicar um evento
export async function updateEventPublishStatus(eventId: string, isPublished: boolean) {
  const { user, error } = await getAuthWithPermission("events.update")
  if (error) {
    return toActionState("ERROR", "Você não tem permissão para realizar esta ação")
  }

  try {
    // Verificar se o evento existe
    const event = await prisma.events.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        isPublished: true,
        date: true
      }
    })

    if (!event) {
      await logWarn("Event.updatePublishStatus", `Tentativa de atualizar status de evento inexistente #${eventId}`, user.id, {
        eventId,
        targetStatus: isPublished
      })
      return toActionState("ERROR", "Evento não encontrado")
    }

    // Verificar se o evento já ocorreu
    const hoje = new Date()
    const dataEvento = new Date(event.date)

    if (dataEvento < hoje && isPublished) {
      await logWarn("Event.updatePublishStatus", `Tentativa de publicar evento já realizado #${eventId}`, user.id, {
        eventId,
        eventTitle: event.title,
        eventDate: event.date
      })
      return toActionState("ERROR", "Não é possível publicar um evento que já ocorreu")
    }

    // Verificar se o status já está como desejado
    if (event.isPublished === isPublished) {
      return toActionState("SUCCESS", `Evento já está ${isPublished ? 'publicado' : 'despublicado'}`)
    }

    // Atualizar o status de publicação
    await prisma.events.update({
      where: { id: eventId },
      data: {
        isPublished,
        updatedAt: new Date()
      }
    })

    await logInfo(
      "Event.updatePublishStatus",
      `Status de publicação do evento #${eventId} atualizado: ${event.isPublished} → ${isPublished}`,
      user.id,
      {
        eventId,
        eventTitle: event.title,
        oldStatus: event.isPublished,
        newStatus: isPublished
      }
    )

    revalidatePath(eventsPath())
    revalidatePath(eventPath(eventId))

    return toActionState("SUCCESS", `Evento ${isPublished ? 'publicado' : 'despublicado'} com sucesso`)
  } catch (error) {
    await logError("Event.updatePublishStatus", `Erro ao atualizar status de publicação do evento #${eventId}`, user.id, {
      eventId,
      targetStatus: isPublished,
      error: String(error)
    })

    return toActionState("ERROR", "Ocorreu um erro ao atualizar o status de publicação")
  }
}

// Função para destacar ou remover destaque de um evento
export async function updateEventHighlightStatus(eventId: string, highlight: boolean) {
  const { user, error } = await getAuthWithPermission("events.update")
  if (error) {
    return toActionState("ERROR", "Você não tem permissão para realizar esta ação")
  }

  try {
    // Verificar se o evento existe
    const event = await prisma.events.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        highlight: true
      }
    })

    if (!event) {
      await logWarn("Event.updateHighlightStatus", `Tentativa de atualizar destaque de evento inexistente #${eventId}`, user.id, {
        eventId,
        targetHighlight: highlight
      })
      return toActionState("ERROR", "Evento não encontrado")
    }

    // Verificar se o status já está como desejado
    if (event.highlight === highlight) {
      return toActionState("SUCCESS", `Evento já está ${highlight ? 'destacado' : 'sem destaque'}`)
    }

    // Atualizar o status de destaque
    await prisma.events.update({
      where: { id: eventId },
      data: {
        highlight,
        updatedAt: new Date()
      }
    })

    await logInfo(
      "Event.updateHighlightStatus",
      `Status de destaque do evento #${eventId} atualizado: ${event.highlight} → ${highlight}`,
      user.id,
      {
        eventId,
        eventTitle: event.title,
        oldHighlight: event.highlight,
        newHighlight: highlight
      }
    )

    revalidatePath(eventsPath())
    revalidatePath(eventPath(eventId))

    return toActionState("SUCCESS", `Evento ${highlight ? 'destacado' : 'removido de destaque'} com sucesso`)
  } catch (error) {
    await logError("Event.updateHighlightStatus", `Erro ao atualizar status de destaque do evento #${eventId}`, user.id, {
      eventId,
      targetHighlight: highlight,
      error: String(error)
    })

    return toActionState("ERROR", "Ocorreu um erro ao atualizar o status de destaque")
  }
}