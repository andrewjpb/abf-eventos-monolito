// /features/speakers/actions/update-speaker-events.ts
"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { speakerPath, speakersPath, eventPath } from "@/app/paths"
import { toActionState } from "@/components/form/utils/to-action-state"
import { logError, logInfo, logWarn } from "@/features/logs/queries/add-log"
import { getAuthWithPermission } from "@/features/auth/queries/get-auth-with-permission"
import { PARTICIPANT_TYPES } from "@/features/attendance-list/constants/participant-types"
import { nanoid } from "nanoid"

type UpdateSpeakerEventsParams = {
  speakerId: string;
  eventIds: string[];
}

export async function updateSpeakerEvents({ speakerId, eventIds }: UpdateSpeakerEventsParams) {
  console.log('🎤 UPDATE SPEAKER EVENTS - Iniciando:', { speakerId, eventIds })
  const { user, error } = await getAuthWithPermission("speakers.update")
  if (error) {
    return toActionState("ERROR", "Você não tem permissão para realizar esta ação")
  }

  // Verificar se o usuário é admin
  const isAdmin = user.roles.some(role => role.name === "admin")
  if (!isAdmin) {
    await logWarn("Speaker.updateEvents", `Acesso negado: usuário não-admin tentou atualizar eventos do palestrante`, user.id, {
      speakerId,
      eventIds,
      isAdmin
    })
    return toActionState("ERROR", "Você não tem permissão para realizar esta ação")
  }

  try {
    // Verificar se o palestrante existe
    const speaker = await prisma.speakers.findUnique({
      where: { id: speakerId },
      include: {
        users: {
          select: { id: true, name: true }
        },
        events: {
          select: { id: true, title: true }
        }
      }
    })

    if (!speaker) {
      await logWarn("Speaker.updateEvents", `Tentativa de atualizar eventos de palestrante inexistente #${speakerId}`, user.id, {
        speakerId,
        eventIds
      })
      return toActionState("ERROR", "Palestrante não encontrado")
    }

    // Verificar se todos os eventos existem
    const events = await prisma.events.findMany({
      where: {
        id: {
          in: eventIds
        }
      },
      select: {
        id: true,
        title: true
      }
    })

    if (events.length !== eventIds.length) {
      await logWarn("Speaker.updateEvents", `Tentativa de associar palestrante a eventos inexistentes`, user.id, {
        speakerId,
        eventIds,
        foundEvents: events.map(e => e.id)
      })
      return toActionState("ERROR", "Um ou mais eventos selecionados não existem")
    }

    // Obter IDs dos eventos atuais
    const currentEventIds = speaker.events.map(e => e.id)

    // Eventos a adicionar (estão em eventIds mas não em currentEventIds)
    const eventsToAdd = eventIds.filter(id => !currentEventIds.includes(id))

    // Eventos a remover (estão em currentEventIds mas não em eventIds)
    const eventsToRemove = currentEventIds.filter(id => !eventIds.includes(id))

    console.log('🎤 EVENTOS PARA PROCESSAR:', { 
      currentEventIds, 
      newEventIds: eventIds,
      eventsToAdd, 
      eventsToRemove 
    })

    // Atualizar o relacionamento entre palestrante e eventos
    await prisma.$transaction(async (tx) => {
      // Remover eventos que não estão mais na lista
      for (const eventId of eventsToRemove) {
        await tx.events.update({
          where: { id: eventId },
          data: {
            speakers: {
              disconnect: {
                id: speakerId
              }
            }
          }
        })

        // Remover palestrante da attendance_list do evento
        await tx.attendance_list.deleteMany({
          where: {
            eventId: eventId,
            userId: speaker.users.id,
            participant_type: PARTICIPANT_TYPES.SPEAKER
          }
        })
      }

      // Adicionar novos eventos à lista
      for (const eventId of eventsToAdd) {
        await tx.events.update({
          where: { id: eventId },
          data: {
            speakers: {
              connect: {
                id: speakerId
              }
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

        // Buscar informações do usuário e empresa antes de criar/atualizar
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
          await tx.attendance_list.update({
            where: { id: existingAttendance.id },
            data: {
              participant_type: PARTICIPANT_TYPES.SPEAKER
            }
          })
        } else {
          // Se não existe, criar novo registro na attendance_list
          console.log('🎤 CRIANDO ATTENDANCE para palestrante:', {
            speakerId,
            eventId,
            userId: speaker.users.id,
            userName: userInfo.name
          })
          try {
            const newAttendance = await tx.attendance_list.create({
              data: {
                id: nanoid(),
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
            console.log('✅ ATTENDANCE CRIADO:', newAttendance.id)
          } catch (createError) {
            // Log do erro para debug
            console.error('❌ ERRO ao criar attendance_list para palestrante:', {
              speakerId,
              eventId,
              userId: speaker.users.id,
              error: createError
            })
            throw createError
          }
        }
      }
    })

    // Registrar a atualização no log
    await logInfo("Speaker.updateEvents", `Eventos do palestrante #${speakerId} atualizados`, user.id, {
      speakerId,
      speakerName: speaker.users.name,
      addedEvents: eventsToAdd.length,
      removedEvents: eventsToRemove.length,
      currentEvents: eventIds.length,
      eventsToAdd,
      eventsToRemove
    })

    // Revalidar os paths necessários
    revalidatePath(speakersPath())
    revalidatePath(speakerPath(speakerId))

    // Revalidar também os paths dos eventos afetados
    const allAffectedEventIds = [...eventsToAdd, ...eventsToRemove]
    for (const eventId of allAffectedEventIds) {
      revalidatePath(eventPath(eventId))
    }

    return toActionState("SUCCESS", "Eventos do palestrante atualizados com sucesso")
  } catch (error) {
    await logError("Speaker.updateEvents", `Erro ao atualizar eventos do palestrante #${speakerId}`, user.id, {
      speakerId,
      eventIds,
      error: String(error)
    })
    console.error("Erro ao atualizar eventos do palestrante:", error)
    return toActionState("ERROR", "Ocorreu um erro ao atualizar os eventos do palestrante")
  }
}