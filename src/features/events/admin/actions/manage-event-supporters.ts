"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getAuthWithPermissionOrRedirect } from "@/features/auth/queries/get-auth-with-permission-or-redirect"
import { logInfo } from "@/features/logs/queries/add-log"

// Associar apoiador ao evento
export async function associateEventSupporter(
  eventId: string,
  supporterId: string,
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

    // Verificar se o apoiador existe e está ativo
    const supporter = await prisma.supporters.findUnique({
      where: { id: supporterId },
      select: { id: true, name: true, active: true }
    })

    if (!supporter) {
      return { 
        success: false, 
        message: "Apoiador não encontrado" 
      }
    }

    if (!supporter.active) {
      return { 
        success: false, 
        message: "Não é possível associar um apoiador inativo" 
      }
    }

    // Verificar se já existe associação
    const existingEvent = await prisma.events.findUnique({
      where: { id: eventId },
      include: {
        supporters: {
          where: { id: supporterId }
        }
      }
    })

    if (existingEvent && existingEvent.supporters.length > 0) {
      return {
        success: false,
        message: "Apoiador já está associado a este evento"
      }
    }

    // Criar associação
    await prisma.events.update({
      where: { id: eventId },
      data: {
        supporters: {
          connect: { id: supporterId }
        }
      }
    })

    // Log da ação
    await logInfo(
      "ASSOCIATE_EVENT_SUPPORTER",
      `Apoiador "${supporter.name}" associado ao evento "${event.title}"`,
      user.id,
      {
        eventId,
        eventTitle: event.title,
        supporterId,
        supporterName: supporter.name
      }
    )

    // Revalidar as páginas relevantes
    revalidatePath(`/admin/events/${eventId}`)
    revalidatePath(`/admin/events/${eventId}/supporters`)

    return { 
      success: true, 
      message: `Apoiador "${supporter.name}" associado com sucesso` 
    }

  } catch (error) {
    console.error("Erro ao associar apoiador:", error)
    return { 
      success: false, 
      message: "Erro interno do servidor" 
    }
  }
}

// Desassociar apoiador do evento
export async function disassociateEventSupporter(
  eventId: string,
  supporterId: string,
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

    // Buscar informações do apoiador
    const supporter = await prisma.supporters.findUnique({
      where: { id: supporterId },
      select: { id: true, name: true }
    })

    if (!supporter) {
      return { 
        success: false, 
        message: "Apoiador não encontrado" 
      }
    }

    // Verificar se existe associação
    const eventWithSupporter = await prisma.events.findUnique({
      where: { id: eventId },
      include: {
        supporters: {
          where: { id: supporterId }
        }
      }
    })

    if (!eventWithSupporter || eventWithSupporter.supporters.length === 0) {
      return {
        success: false,
        message: "Apoiador não está associado a este evento"
      }
    }

    // Remover associação
    await prisma.events.update({
      where: { id: eventId },
      data: {
        supporters: {
          disconnect: { id: supporterId }
        }
      }
    })

    // Log da ação
    await logInfo(
      "DISASSOCIATE_EVENT_SUPPORTER",
      `Apoiador "${supporter.name}" removido do evento "${event.title}"`,
      user.id,
      {
        eventId,
        eventTitle: event.title,
        supporterId,
        supporterName: supporter.name
      }
    )

    // Revalidar as páginas relevantes
    revalidatePath(`/admin/events/${eventId}`)
    revalidatePath(`/admin/events/${eventId}/supporters`)

    return { 
      success: true, 
      message: `Apoiador "${supporter.name}" removido com sucesso` 
    }

  } catch (error) {
    console.error("Erro ao desassociar apoiador:", error)
    return { 
      success: false, 
      message: "Erro interno do servidor" 
    }
  }
}

// Atualizar ordem do apoiador no evento
export async function updateSupporterOrder(
  eventId: string,
  supporterId: string,
  prevState: any,
  formData: FormData
) {
  try {
    // Verificar permissões
    const user = await getAuthWithPermissionOrRedirect("events.update")

    const order = parseInt(formData.get("order")?.toString() || "0")

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

    // Buscar informações do apoiador
    const supporter = await prisma.supporters.findUnique({
      where: { id: supporterId },
      select: { id: true, name: true }
    })

    if (!supporter) {
      return {
        success: false,
        message: "Apoiador não encontrado"
      }
    }

    // Verificar se existe a relação na tabela many-to-many
    const existingRelation = await prisma.events.findUnique({
      where: { id: eventId },
      include: {
        supporters: {
          where: { id: supporterId }
        }
      }
    })

    if (!existingRelation || existingRelation.supporters.length === 0) {
      return {
        success: false,
        message: "Apoiador não está associado a este evento"
      }
    }

    // Upsert na tabela de ordem
    await prisma.event_supporter_order.upsert({
      where: {
        eventId_supporterId: {
          eventId,
          supporterId
        }
      },
      update: {
        order,
        updatedAt: new Date()
      },
      create: {
        eventId,
        supporterId,
        order
      }
    })

    // Log da ação
    await logInfo(
      "UPDATE_SUPPORTER_ORDER",
      `Ordem do apoiador "${supporter.name}" atualizada para ${order} no evento "${event.title}"`,
      user.id,
      {
        eventId,
        eventTitle: event.title,
        supporterId,
        supporterName: supporter.name,
        newOrder: order
      }
    )

    // Revalidar as páginas relevantes
    revalidatePath(`/admin/events/${eventId}`)
    revalidatePath(`/admin/events/${eventId}/supporters`)

    return {
      success: true,
      message: `Ordem do apoiador "${supporter.name}" atualizada com sucesso`
    }

  } catch (error) {
    console.error("Erro ao atualizar ordem do apoiador:", error)
    return {
      success: false,
      message: "Erro interno do servidor"
    }
  }
}