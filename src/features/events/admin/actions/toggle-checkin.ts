"use server"

import { getAuthWithPermissionOrRedirect } from "@/features/auth/queries/get-auth-with-permission-or-redirect"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { eventCheckinPath } from "@/app/paths"
import { toActionState, ActionState } from "@/components/form/utils/to-action-state"
import { logError, logInfo } from "@/features/logs/queries/add-log"

export async function toggleCheckin(
  _actionState: ActionState,
  formData: FormData
): Promise<ActionState> {
  let user: any = null
  
  try {
    // Verificar permissões de criar/editar eventos
    user = await getAuthWithPermissionOrRedirect("events.create")
    
    const attendanceId = formData.get("attendanceId") as string
    const eventId = formData.get("eventId") as string
    
    if (!attendanceId || !eventId) {
      await logError("Events.toggleCheckin", "Dados obrigatórios não fornecidos", user?.id, {
        attendanceId,
        eventId,
        missingData: { attendanceId: !attendanceId, eventId: !eventId }
      })
      return toActionState("ERROR", "Dados obrigatórios não fornecidos")
    }

    // Buscar a inscrição atual
    const attendance = await prisma.attendance_list.findUnique({
      where: { id: attendanceId },
      include: {
        events: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    if (!attendance) {
      await logError("Events.toggleCheckin", `Inscrição não encontrada: ${attendanceId}`, user.id, {
        attendanceId,
        eventId,
        searchAttempted: true
      })
      return toActionState("ERROR", "Inscrição não encontrada")
    }

    // Alternar o status de check-in
    const newCheckinStatus = !attendance.checked_in
    
    await prisma.attendance_list.update({
      where: { id: attendanceId },
      data: {
        checked_in: newCheckinStatus,
        updatedAt: new Date()
      }
    })

    await logInfo(
      "Events.toggleCheckin", 
      `Check-in ${newCheckinStatus ? "realizado" : "removido"} para participante ${attendance.attendee_full_name}`, 
      user.id,
      {
        attendanceId,
        eventId: attendance.events.id,
        eventTitle: attendance.events.title,
        attendeeName: attendance.attendee_full_name,
        attendeeEmail: attendance.attendee_email,
        oldCheckinStatus: attendance.checked_in,
        newCheckinStatus
      }
    )

    revalidatePath(eventCheckinPath(eventId))
    
    const successMessage = newCheckinStatus 
      ? `Check-in realizado para ${attendance.attendee_full_name}`
      : `Check-in removido para ${attendance.attendee_full_name}`
    
    return toActionState("SUCCESS", successMessage)
    
  } catch (error) {
    await logError("Events.toggleCheckin", `Erro ao alterar check-in: ${error}`, user?.id, { 
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
      formData: {
        attendanceId: formData.get("attendanceId"),
        eventId: formData.get("eventId")
      }
    })
    
    return toActionState("ERROR", "Erro ao alterar status de check-in")
  }
}