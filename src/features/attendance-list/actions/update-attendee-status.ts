// /features/attendance-list/actions/update-attendee-status.ts
"use server"

import { getAdminOrRedirect } from "@/features/auth/queries/get-auth-or-rerdirect"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { eventPath, eventsPath } from "@/app/paths"
import { toActionState } from "@/components/form/utils/to-action-state"
import { logError, logInfo, logWarn } from "@/features/logs/queries/add-log"

// Definição de status possíveis para participantes (você pode ajustar conforme necessário)
export enum AttendeeStatusEnum {
  REGISTERED = "REGISTERED",
  CONFIRMED = "CONFIRMED",
  CANCELED = "CANCELED",
  WAITLIST = "WAITLIST",
}

export async function updateAttendeeStatus(attendanceId: string, status: AttendeeStatusEnum) {
  const { user } = await getAdminOrRedirect()

  try {
    // Verificar se a inscrição existe
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
      await logWarn("AttendanceList.updateStatus", `Tentativa de atualizar status de inscrição inexistente #${attendanceId}`, user.id, {
        attendanceId,
        targetStatus: status
      })
      return toActionState("ERROR", "Inscrição não encontrada")
    }

    // Verificar se o usuário tem permissão para atualizar o status
    // (Apenas administradores já que usamos getAdminOrRedirect)

    // Atualizar o status do participante
    // Como o schema pode não ter um campo de status, podemos usar um campo customizado ou 
    // implementar lógica conforme a necessidade do projeto

    // Exemplo: Na tabela attendance_list você poderia adicionar uma coluna "status"
    // Para este exemplo, vamos atualizá-lo como um campo virtual usando o attendee_type
    await prisma.attendance_list.update({
      where: { id: attendanceId },
      data: {
        attendee_type: status,
        updatedAt: new Date()
      }
    })

    await logInfo("AttendanceList.updateStatus", `Status da inscrição #${attendanceId} atualizado para: ${status}`, user.id, {
      attendanceId,
      eventId: attendance.events.id,
      eventTitle: attendance.events.title,
      attendeeName: attendance.attendee_full_name,
      attendeeEmail: attendance.attendee_email,
      oldStatus: attendance.attendee_type,
      newStatus: status
    })

    revalidatePath(eventsPath())
    revalidatePath(eventPath(attendance.events.id))

    return toActionState("SUCCESS", `Status atualizado para ${status}`)
  } catch (error) {
    await logError("AttendanceList.updateStatus", `Erro ao atualizar status da inscrição #${attendanceId}`, user.id, {
      attendanceId,
      targetStatus: status,
      error: String(error)
    })

    return toActionState("ERROR", "Ocorreu um erro ao atualizar o status da inscrição")
  }
}