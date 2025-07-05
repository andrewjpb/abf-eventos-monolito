"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getAuthWithPermissionOrRedirect } from "@/features/auth/queries/get-auth-with-permission-or-redirect"
import { addLog } from "@/features/logs/queries/add-log"

// Associar patrocinador ao evento
export async function associateEventSponsor(
  eventId: string,
  sponsorId: string,
  prevState: any,
  formData: FormData
) {
  try {
    // Verificar permissões
    const { user } = await getAuthWithPermissionOrRedirect("events.update")

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

    // Verificar se o patrocinador existe e está ativo
    const sponsor = await prisma.sponsors.findUnique({
      where: { id: sponsorId },
      select: { id: true, name: true, active: true }
    })

    if (!sponsor) {
      return { 
        success: false, 
        message: "Patrocinador não encontrado" 
      }
    }

    if (!sponsor.active) {
      return { 
        success: false, 
        message: "Não é possível associar um patrocinador inativo" 
      }
    }

    // Verificar se já existe associação
    const existingAssociation = await prisma.eventSponsors.findFirst({
      where: {
        eventId,
        sponsorId
      }
    })

    if (existingAssociation) {
      return { 
        success: false, 
        message: "Patrocinador já está associado a este evento" 
      }
    }

    // Criar associação
    await prisma.eventSponsors.create({
      data: {
        eventId,
        sponsorId
      }
    })

    // Log da ação
    await addLog({
      userId: user.id,
      action: "ASSOCIATE_EVENT_SPONSOR",
      entity: "events",
      entityId: eventId,
      details: {
        eventTitle: event.title,
        sponsorName: sponsor.name,
        sponsorId
      }
    })

    // Revalidar as páginas relevantes
    revalidatePath(`/admin/events/${eventId}`)
    revalidatePath(`/admin/events/${eventId}/sponsors`)

    return { 
      success: true, 
      message: `Patrocinador "${sponsor.name}" associado com sucesso` 
    }

  } catch (error) {
    console.error("Erro ao associar patrocinador:", error)
    return { 
      success: false, 
      message: "Erro interno do servidor" 
    }
  }
}

// Desassociar patrocinador do evento
export async function disassociateEventSponsor(
  eventId: string,
  sponsorId: string,
  prevState: any,
  formData: FormData
) {
  try {
    // Verificar permissões
    const { user } = await getAuthWithPermissionOrRedirect("events.update")

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

    // Buscar informações do patrocinador
    const sponsor = await prisma.sponsors.findUnique({
      where: { id: sponsorId },
      select: { id: true, name: true }
    })

    if (!sponsor) {
      return { 
        success: false, 
        message: "Patrocinador não encontrado" 
      }
    }

    // Verificar se existe associação
    const association = await prisma.eventSponsors.findFirst({
      where: {
        eventId,
        sponsorId
      }
    })

    if (!association) {
      return { 
        success: false, 
        message: "Patrocinador não está associado a este evento" 
      }
    }

    // Remover associação
    await prisma.eventSponsors.delete({
      where: {
        id: association.id
      }
    })

    // Log da ação
    await addLog({
      userId: user.id,
      action: "DISASSOCIATE_EVENT_SPONSOR",
      entity: "events",
      entityId: eventId,
      details: {
        eventTitle: event.title,
        sponsorName: sponsor.name,
        sponsorId
      }
    })

    // Revalidar as páginas relevantes
    revalidatePath(`/admin/events/${eventId}`)
    revalidatePath(`/admin/events/${eventId}/sponsors`)

    return { 
      success: true, 
      message: `Patrocinador "${sponsor.name}" removido com sucesso` 
    }

  } catch (error) {
    console.error("Erro ao desassociar patrocinador:", error)
    return { 
      success: false, 
      message: "Erro interno do servidor" 
    }
  }
}