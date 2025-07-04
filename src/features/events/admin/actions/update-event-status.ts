"use server"

import { ActionState, toActionState } from "@/components/form/utils/to-action-state"
import { prisma } from "@/lib/prisma"
import { getAuthWithPermission } from "@/features/auth/queries/get-auth-with-permission"
import { revalidatePath } from "next/cache"
import { logError, logInfo, logWarn } from "@/features/logs/queries/add-log"

export const updateEventStatus = async (
  eventId: string,
  action: 'publish' | 'unpublish' | 'highlight' | 'unhighlight',
  _actionState: ActionState,
  _formData: FormData
) => {
  const { user, error } = await getAuthWithPermission("events.update")
  if (error) {
    return toActionState("ERROR", "Você não tem permissão para realizar esta ação")
  }

  const isAdmin = user.roles.some(role => role.name === "admin")
  if (!isAdmin) {
    await logWarn("Event.updateStatus", `Acesso negado: usuário não-admin tentou atualizar status do evento`, user.id, {
      eventId,
      action,
      isAdmin
    })
    return toActionState("ERROR", "Você não tem permissão para realizar esta ação")
  }

  try {
    // Buscar o evento para verificar se existe
    const event = await prisma.events.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        isPublished: true,
        highlight: true
      }
    })

    if (!event) {
      await logWarn("Event.updateStatus", `Tentativa de atualizar status de evento inexistente #${eventId}`, user.id, {
        eventId,
        action
      })
      return toActionState("ERROR", "Evento não encontrado")
    }

    let updateData: any = {}
    let actionMessage = ""
    let logMessage = ""

    switch (action) {
      case 'publish':
        if (event.isPublished) {
          return toActionState("ERROR", "Evento já está publicado")
        }
        updateData.isPublished = true
        actionMessage = "Evento publicado com sucesso"
        logMessage = "publicado"
        break

      case 'unpublish':
        if (!event.isPublished) {
          return toActionState("ERROR", "Evento já está despublicado")
        }
        updateData.isPublished = false
        actionMessage = "Evento despublicado com sucesso"
        logMessage = "despublicado"
        break

      case 'highlight':
        if (event.highlight) {
          return toActionState("ERROR", "Evento já está destacado")
        }
        updateData.highlight = true
        actionMessage = "Evento destacado com sucesso"
        logMessage = "destacado"
        break

      case 'unhighlight':
        if (!event.highlight) {
          return toActionState("ERROR", "Evento já não está destacado")
        }
        updateData.highlight = false
        actionMessage = "Destaque do evento removido com sucesso"
        logMessage = "destaque removido"
        break

      default:
        return toActionState("ERROR", "Ação inválida")
    }

    // Atualizar o evento
    await prisma.events.update({
      where: { id: eventId },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    })

    await logInfo("Event.updateStatus", `Evento #${eventId} ${logMessage}: ${event.title}`, user.id, {
      eventId,
      eventTitle: event.title,
      action,
      previousStatus: {
        isPublished: event.isPublished,
        highlight: event.highlight
      },
      newStatus: updateData
    })

    revalidatePath('/admin/events')
    revalidatePath(`/admin/events/${eventId}`)
    revalidatePath('/') // Revalidar página inicial onde eventos podem aparecer

    return toActionState("SUCCESS", actionMessage)

  } catch (error) {
    await logError("Event.updateStatus", `Erro ao atualizar status do evento #${eventId}`, user.id, {
      eventId,
      action,
      error: String(error)
    })
    return toActionState("ERROR", "Erro interno do servidor ao atualizar status")
  }
}

// Action específica para publicar/despublicar
export const toggleEventPublication = async (
  eventId: string,
  _actionState: ActionState,
  _formData: FormData
) => {
  const event = await prisma.events.findUnique({
    where: { id: eventId },
    select: { isPublished: true }
  })

  if (!event) {
    return toActionState("ERROR", "Evento não encontrado")
  }

  const action = event.isPublished ? 'unpublish' : 'publish'
  return updateEventStatus(eventId, action, _actionState, _formData)
}

// Action específica para destacar/remover destaque
export const toggleEventHighlight = async (
  eventId: string,
  _actionState: ActionState,
  _formData: FormData
) => {
  const event = await prisma.events.findUnique({
    where: { id: eventId },
    select: { highlight: true }
  })

  if (!event) {
    return toActionState("ERROR", "Evento não encontrado")
  }

  const action = event.highlight ? 'unhighlight' : 'highlight'
  return updateEventStatus(eventId, action, _actionState, _formData)
}