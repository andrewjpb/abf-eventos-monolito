// /features/attendance-list/actions/delete-attendee.ts
"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getAuth } from "@/features/auth/queries/get-auth"
import { eventPath, eventsPath } from "@/app/paths"
import { toActionState } from "@/components/form/utils/to-action-state"
import { logError, logInfo, logWarn } from "@/features/logs/queries/add-log"

export const deleteAttendee = async (attendanceId: string) => {
  const { user } = await getAuth()

  if (!user) {
    return toActionState("ERROR", "Usuário não autenticado")
  }

  try {
    // Verificar se a inscrição existe
    const attendance = await prisma.attendance_list.findUnique({
      where: { id: attendanceId },
      include: {
        events: {
          select: {
            id: true,
            title: true,
            date: true
          }
        }
      }
    })

    if (!attendance) {
      await logWarn("AttendanceList.delete", `Tentativa de cancelar inscrição inexistente #${attendanceId}`, user.id, {
        attendanceId
      })
      return toActionState("ERROR", "Inscrição não encontrada")
    }

    // Verificar se o usuário é o dono da inscrição ou administrador
    const isOwner = attendance.userId === user.id
    const isAdmin = user.roles.some(role => role.name === "ADMIN")

    // Verificar a permissão do usuário consultando seu role
    const userWithRoles = !isAdmin && !isOwner ? await prisma.users.findUnique({
      where: { id: user.id },
      include: {
        roles: true
      }
    }) : null

    const hasAdminRole = userWithRoles?.roles.some(role => role.name === "ADMIN") || false

    if (!isOwner && !isAdmin && !hasAdminRole) {
      await logWarn("AttendanceList.delete", `Usuário sem permissão tentou cancelar inscrição`, user.id, {
        attendanceId,
        eventId: attendance.events.id
      })
      return toActionState("ERROR", "Você não tem permissão para cancelar esta inscrição")
    }

    // Verificar se o evento já ocorreu
    const now = new Date()
    const eventDate = new Date(attendance.events.date)

    // Apenas administradores podem cancelar inscrições após o evento
    if (now > eventDate && !isAdmin && !hasAdminRole) {
      await logWarn("AttendanceList.delete", `Tentativa de cancelar inscrição após evento`, user.id, {
        attendanceId,
        eventId: attendance.events.id,
        eventDate: eventDate
      })
      return toActionState("ERROR", "Não é possível cancelar a inscrição após o evento")
    }

    // Excluir a inscrição
    await prisma.attendance_list.delete({
      where: { id: attendanceId }
    })

    await logInfo("AttendanceList.delete", `Inscrição #${attendanceId} cancelada para o evento ${attendance.events.title}`, user.id, {
      attendanceId,
      eventId: attendance.events.id,
      eventTitle: attendance.events.title,
      attendeeName: attendance.attendee_full_name,
      attendeeEmail: attendance.attendee_email
    })

    revalidatePath(eventsPath())
    revalidatePath(eventPath(attendance.events.id))

    return toActionState("SUCCESS", "Inscrição cancelada com sucesso")
  } catch (error) {
    await logError("AttendanceList.delete", `Erro ao cancelar inscrição #${attendanceId}`, user.id, {
      attendanceId,
      error: String(error)
    })

    return toActionState("ERROR", "Ocorreu um erro ao cancelar a inscrição")
  }
}