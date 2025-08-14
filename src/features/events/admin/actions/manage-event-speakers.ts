"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getAuthWithPermissionOrRedirect } from "@/features/auth/queries/get-auth-with-permission-or-redirect"
import { logInfo } from "@/features/logs/queries/add-log"
import { PARTICIPANT_TYPES } from "@/features/attendance-list/constants/participant-types"
import { randomUUID } from "crypto"

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

    // Verificar se o palestrante existe
    const speaker = await prisma.speakers.findUnique({
      where: { id: speakerId },
      include: {
        users: {
          select: { id: true, name: true, active: true }
        }
      }
    })

    if (!speaker || !speaker.users) {
      return { 
        success: false, 
        message: "Palestrante não encontrado" 
      }
    }

    if (!speaker.users.active) {
      return { 
        success: false, 
        message: "Não é possível associar um palestrante com usuário inativo" 
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

    // Criar associação e gerenciar attendance_list
    await prisma.$transaction(async (tx) => {
      console.log('🎤 ASSOCIANDO PALESTRANTE AO EVENTO:', { eventId, speakerId, speakerName: speaker.users.name })
      
      // Conectar palestrante ao evento
      await tx.events.update({
        where: { id: eventId },
        data: {
          speakers: {
            connect: { id: speakerId }
          }
        }
      })

      // Verificar se o palestrante já está na attendance_list do evento
      const existingAttendance = await tx.attendance_list.findFirst({
        where: {
          eventId: eventId,
          userId: speaker.users.id
        }
      })

      // Buscar informações completas do usuário
      const userInfo = await tx.users.findUnique({
        where: { id: speaker.users.id },
        include: {
          company: true
        }
      })

      if (!userInfo) {
        throw new Error(`Usuário não encontrado para o palestrante ${speakerId}`)
      }

      if (existingAttendance) {
        // Se já existe, apenas atualizar o participant_type para speaker
        console.log('🎤 ATUALIZANDO ATTENDANCE EXISTENTE para palestrante')
        await tx.attendance_list.update({
          where: { id: existingAttendance.id },
          data: {
            participant_type: PARTICIPANT_TYPES.SPEAKER
          }
        })
      } else {
        // Se não existe, criar novo registro na attendance_list
        console.log('🎤 CRIANDO NOVO ATTENDANCE para palestrante')
        try {
          const newAttendance = await tx.attendance_list.create({
            data: {
              id: randomUUID(),
              eventId: eventId,
              userId: speaker.users.id,
              company_cnpj: userInfo.cnpj,
              company_segment: userInfo.company.segment,
              attendee_full_name: userInfo.name,
              attendee_email: userInfo.email,
              attendee_position: userInfo.position,
              attendee_rg: userInfo.rg,
              attendee_cpf: userInfo.cpf,
              mobile_phone: userInfo.mobile_phone,
              attendee_type: 'in_person', // Palestrantes são sempre presenciais
              participant_type: PARTICIPANT_TYPES.SPEAKER,
              checked_in: false,
              created_at: new Date(),
              updatedAt: new Date()
            }
          })
          console.log('✅ ATTENDANCE CRIADO COM SUCESSO:', newAttendance.id)
        } catch (createError) {
          console.error('❌ ERRO ao criar attendance_list:', createError)
          throw createError
        }
      }
    })

    // Log da ação
    await logInfo(
      "ASSOCIATE_EVENT_SPEAKER",
      `Palestrante "${speaker.users.name}" associado ao evento "${event.title}"`,
      user.id,
      {
        eventId,
        eventTitle: event.title,
        speakerId,
        speakerName: speaker.users.name
      }
    )

    // Revalidar as páginas relevantes
    revalidatePath(`/admin/events/${eventId}`)
    revalidatePath(`/admin/events/${eventId}/speakers`)

    return { 
      success: true, 
      message: `Palestrante "${speaker.users.name}" associado com sucesso` 
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
      include: {
        users: {
          select: { id: true, name: true }
        }
      }
    })

    if (!speaker || !speaker.users) {
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

    // Remover associação e gerenciar attendance_list
    await prisma.$transaction(async (tx) => {
      console.log('🎤 REMOVENDO PALESTRANTE DO EVENTO:', { eventId, speakerId, speakerName: speaker.users.name })
      
      // Desconectar palestrante do evento
      await tx.events.update({
        where: { id: eventId },
        data: {
          speakers: {
            disconnect: { id: speakerId }
          }
        }
      })

      // Remover palestrante da attendance_list do evento (apenas se for speaker)
      const deletedAttendances = await tx.attendance_list.deleteMany({
        where: {
          eventId: eventId,
          userId: speaker.users.id,
          participant_type: PARTICIPANT_TYPES.SPEAKER
        }
      })

      console.log('🎤 ATTENDANCES REMOVIDOS:', deletedAttendances.count)
    })

    // Log da ação
    await logInfo(
      "DISASSOCIATE_EVENT_SPEAKER",
      `Palestrante "${speaker.users.name}" removido do evento "${event.title}"`,
      user.id,
      {
        eventId,
        eventTitle: event.title,
        speakerId,
        speakerName: speaker.users.name
      }
    )

    // Revalidar as páginas relevantes
    revalidatePath(`/admin/events/${eventId}`)
    revalidatePath(`/admin/events/${eventId}/speakers`)

    return { 
      success: true, 
      message: `Palestrante "${speaker.users.name}" removido com sucesso` 
    }

  } catch (error) {
    console.error("Erro ao desassociar palestrante:", error)
    return { 
      success: false, 
      message: "Erro interno do servidor" 
    }
  }
}