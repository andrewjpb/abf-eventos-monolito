// /features/attendance-list/actions/update-attendance-checkin.ts
"use server"

import { getAdminOrRedirect } from "@/features/auth/queries/get-auth-or-rerdirect"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { eventPath, eventsPath } from "@/app/paths"
import { toActionState } from "@/components/form/utils/to-action-state"
import { logError, logInfo, logWarn } from "@/features/logs/queries/add-log"

export async function updateAttendanceCheckin(attendanceId: string, checkedIn: boolean) {
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
      await logWarn("AttendanceList.updateCheckin", `Tentativa de atualizar check-in de inscrição inexistente #${attendanceId}`, user.id, {
        attendanceId,
        targetCheckinStatus: checkedIn
      })
      return toActionState("ERROR", "Inscrição não encontrada")
    }

    // Verificar se o status está sendo alterado (para evitar operações desnecessárias)
    if (attendance.checked_in === checkedIn) {
      return toActionState("SUCCESS", `Status de check-in já está como ${checkedIn ? "presente" : "não confirmado"}`)
    }

    // Atualizar o status de check-in
    await prisma.attendance_list.update({
      where: { id: attendanceId },
      data: {
        checked_in: checkedIn,
        updatedAt: new Date()
      }
    })

    await logInfo("AttendanceList.updateCheckin", `Status de check-in da inscrição #${attendanceId} atualizado: ${attendance.checked_in} → ${checkedIn}`, user.id, {
      attendanceId,
      eventId: attendance.events.id,
      eventTitle: attendance.events.title,
      attendeeName: attendance.attendee_full_name,
      attendeeEmail: attendance.attendee_email,
      oldCheckinStatus: attendance.checked_in,
      newCheckinStatus: checkedIn
    })

    revalidatePath(eventsPath())
    revalidatePath(eventPath(attendance.events.id))

    return toActionState("SUCCESS", `Check-in ${checkedIn ? "confirmado" : "removido"} com sucesso`)
  } catch (error) {
    await logError("AttendanceList.updateCheckin", `Erro ao atualizar status de check-in da inscrição #${attendanceId}`, user.id, {
      attendanceId,
      targetCheckinStatus: checkedIn,
      error: String(error)
    })

    return toActionState("ERROR", "Ocorreu um erro ao atualizar o status de check-in")
  }
}