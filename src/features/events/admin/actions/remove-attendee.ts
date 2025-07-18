"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getAuthWithPermission } from "@/features/auth/queries/get-auth-with-permission"
import { toActionState, ActionState } from "@/components/form/utils/to-action-state"
import { logError, logInfo, logWarn } from "@/features/logs/queries/add-log"
import { eventAdminPath, eventsPath } from "@/app/paths"

export async function removeAttendeeFromEvent(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const attendanceId = formData.get("attendanceId") as string
    const eventId = formData.get("eventId") as string

    // Verificar permissão
    const { user, error } = await getAuthWithPermission("events.create")
    
    if (error || !user) {
      await logWarn(
        "Events.Admin.removeAttendee",
        `Tentativa de remover inscrito sem permissão`,
        user?.id,
        { attendanceId, eventId }
      )
      return toActionState("ERROR", error?.message || "Você não tem permissão para remover inscritos")
    }

    // Buscar a inscrição com detalhes
    const attendance = await prisma.attendance_list.findUnique({
      where: { id: attendanceId },
      include: {
        events: {
          select: {
            id: true,
            title: true
          }
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!attendance) {
      await logWarn(
        "Events.Admin.removeAttendee",
        `Inscrição não encontrada: ${attendanceId}`,
        user.id,
        { attendanceId, eventId }
      )
      return toActionState("ERROR", "Inscrição não encontrada")
    }

    // Verificar se o inscrito é um palestrante
    const speaker = await prisma.speakers.findFirst({
      where: {
        users: {
          id: attendance.userId
        },
        events: {
          some: {
            id: eventId
          }
        }
      }
    })

    // Iniciar transação para garantir consistência
    await prisma.$transaction(async (tx) => {
      // Se for palestrante, remover da relação com o evento
      if (speaker) {
        // Desconectar o palestrante do evento
        await tx.speakers.update({
          where: {
            id: speaker.id
          },
          data: {
            events: {
              disconnect: {
                id: eventId
              }
            }
          }
        })

        await logInfo(
          "Events.Admin.removeAttendee",
          `Palestrante removido do evento`,
          user.id,
          {
            speakerId: speaker.id,
            eventId: eventId,
            eventTitle: attendance.events.title
          }
        )
      }

      // Remover inscrição
      await tx.attendance_list.delete({
        where: { id: attendanceId }
      })

      await logInfo(
        "Events.Admin.removeAttendee",
        `Inscrito removido do evento: ${attendance.attendee_full_name}`,
        user.id,
        {
          attendanceId: attendanceId,
          attendeeName: attendance.attendee_full_name,
          attendeeEmail: attendance.attendee_email,
          eventId: eventId,
          eventTitle: attendance.events.title,
          wasSpeaker: !!speaker
        }
      )
    })

    // Revalidar caminhos
    revalidatePath(eventsPath())
    revalidatePath(eventAdminPath(eventId))
    revalidatePath(`/admin/events/${eventId}/checkin`)

    const message = speaker 
      ? "Inscrito e palestrante removidos com sucesso"
      : "Inscrito removido com sucesso"

    return toActionState("SUCCESS", message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    await logError(
      "Events.Admin.removeAttendee",
      `Erro ao remover inscrito`,
      undefined,
      {
        error: errorMessage,
        attendanceId: formData.get("attendanceId"),
        eventId: formData.get("eventId")
      }
    )

    return toActionState("ERROR", "Erro ao remover inscrito. Tente novamente.")
  }
}