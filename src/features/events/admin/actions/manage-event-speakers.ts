"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getAuthWithPermissionOrRedirect } from "@/features/auth/queries/get-auth-with-permission-or-redirect"
import { logInfo } from "@/features/logs/queries/add-log"

// Associar palestrante ao evento
export async function associateEventSpeaker(
  eventId: string,
  speakerId: string,
  prevState: any,
  formData: FormData
) {
  try {
    // Verificar permissões
    const user = await getAuthWithPermissionOrRedirect("events.update")

    // Verificar se o evento existe
    const event = await prisma.events.findUnique({
      where: { id: eventId },
      select: { id: true, title: true }
    })

    if (!event) {
      return { 
        success: false, 
        message: "Evento não encontrado" 
      }
    }

    // Verificar se o palestrante existe e está ativo
    const speaker = await prisma.speakers.findUnique({
      where: { id: speakerId },
      select: { id: true, name: true, active: true }
    })

    if (!speaker) {
      return { 
        success: false, 
        message: "Palestrante não encontrado" 
      }
    }

    if (!speaker.active) {
      return { 
        success: false, 
        message: "Não é possível associar um palestrante inativo" 
      }
    }

    // Verificar se já existe associação
    const existingEvent = await prisma.events.findUnique({
      where: { id: eventId },
      include: {
        speakers: {
          where: { id: speakerId }
        }
      }
    })

    if (existingEvent && existingEvent.speakers.length > 0) {
      return {
        success: false,
        message: "Palestrante já está associado a este evento"
      }
    }

    // Criar associação
    await prisma.events.update({
      where: { id: eventId },
      data: {
        speakers: {
          connect: { id: speakerId }
        }
      }
    })

    // Log da ação
    await logInfo(
      "ASSOCIATE_EVENT_SPEAKER",
      `Palestrante "${speaker.name}" associado ao evento "${event.title}"`,
      user.id,
      {
        eventId,
        eventTitle: event.title,
        speakerId,
        speakerName: speaker.name
      }
    )

    // Revalidar as páginas relevantes
    revalidatePath(`/admin/events/${eventId}`)
    revalidatePath(`/admin/events/${eventId}/speakers`)

    return { 
      success: true, 
      message: `Palestrante "${speaker.name}" associado com sucesso` 
    }

  } catch (error) {
    console.error("Erro ao associar palestrante:", error)
    return { 
      success: false, 
      message: "Erro interno do servidor" 
    }
  }
}

// Desassociar palestrante do evento
export async function disassociateEventSpeaker(
  eventId: string,
  speakerId: string,
  prevState: any,
  formData: FormData
) {
  try {
    // Verificar permissões
    const user = await getAuthWithPermissionOrRedirect("events.update")

    // Verificar se o evento existe
    const event = await prisma.events.findUnique({
      where: { id: eventId },
      select: { id: true, title: true }
    })

    if (!event) {
      return { 
        success: false, 
        message: "Evento não encontrado" 
      }
    }

    // Buscar informações do palestrante
    const speaker = await prisma.speakers.findUnique({
      where: { id: speakerId },
      select: { id: true, name: true }
    })

    if (!speaker) {
      return { 
        success: false, 
        message: "Palestrante não encontrado" 
      }
    }

    // Verificar se existe associação
    const eventWithSpeaker = await prisma.events.findUnique({
      where: { id: eventId },
      include: {
        speakers: {
          where: { id: speakerId }
        }
      }
    })

    if (!eventWithSpeaker || eventWithSpeaker.speakers.length === 0) {
      return {
        success: false,
        message: "Palestrante não está associado a este evento"
      }
    }

    // Remover associação
    await prisma.events.update({
      where: { id: eventId },
      data: {
        speakers: {
          disconnect: { id: speakerId }
        }
      }
    })

    // Log da ação
    await logInfo(
      "DISASSOCIATE_EVENT_SPEAKER",
      `Palestrante "${speaker.name}" removido do evento "${event.title}"`,
      user.id,
      {
        eventId,
        eventTitle: event.title,
        speakerId,
        speakerName: speaker.name
      }
    )

    // Revalidar as páginas relevantes
    revalidatePath(`/admin/events/${eventId}`)
    revalidatePath(`/admin/events/${eventId}/speakers`)

    return { 
      success: true, 
      message: `Palestrante "${speaker.name}" removido com sucesso` 
    }

  } catch (error) {
    console.error("Erro ao desassociar palestrante:", error)
    return { 
      success: false, 
      message: "Erro interno do servidor" 
    }
  }
}