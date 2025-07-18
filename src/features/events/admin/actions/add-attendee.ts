"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getAuthWithPermission } from "@/features/auth/queries/get-auth-with-permission"
import { toActionState, ActionState } from "@/components/form/utils/to-action-state"
import { logError, logInfo, logWarn } from "@/features/logs/queries/add-log"
import { eventAdminPath, eventsPath } from "@/app/paths"
import { DEFAULT_PARTICIPANT_TYPE } from "@/features/attendance-list/constants/participant-types"

export async function addAttendeeToEvent(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const userId = formData.get("userId") as string
    const eventId = formData.get("eventId") as string
    const participantType = formData.get("participantType") as string || DEFAULT_PARTICIPANT_TYPE

    // Verificar permissão
    const { user, error } = await getAuthWithPermission("events.create")
    
    if (error || !user) {
      await logWarn(
        "Events.Admin.addAttendee",
        `Tentativa de adicionar inscrito sem permissão`,
        user?.id,
        { userId, eventId, participantType }
      )
      return toActionState("ERROR", error?.message || "Você não tem permissão para adicionar inscritos")
    }

    // Verificar se o evento existe
    const event = await prisma.events.findUnique({
      where: { id: eventId },
      select: { id: true, title: true }
    })

    if (!event) {
      await logWarn(
        "Events.Admin.addAttendee",
        `Evento não encontrado: ${eventId}`,
        user.id,
        { userId, eventId }
      )
      return toActionState("ERROR", "Evento não encontrado")
    }

    // Verificar se o usuário existe
    const attendeeUser = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        company: {
          select: {
            cnpj: true,
            name: true,
            segment: true
          }
        }
      }
    })

    if (!attendeeUser) {
      await logWarn(
        "Events.Admin.addAttendee",
        `Usuário não encontrado: ${userId}`,
        user.id,
        { userId, eventId }
      )
      return toActionState("ERROR", "Usuário não encontrado")
    }

    // Verificar se já está inscrito
    const existingAttendance = await prisma.attendance_list.findFirst({
      where: {
        eventId: eventId,
        userId: userId
      }
    })

    if (existingAttendance) {
      await logWarn(
        "Events.Admin.addAttendee",
        `Usuário já está inscrito no evento`,
        user.id,
        { userId, eventId, attendanceId: existingAttendance.id }
      )
      return toActionState("ERROR", "Este usuário já está inscrito no evento")
    }

    // Criar inscrição
    const attendance = await prisma.attendance_list.create({
      data: {
        id: crypto.randomUUID(),
        eventId: eventId,
        userId: userId,
        company_cnpj: attendeeUser.company.cnpj,
        company_segment: attendeeUser.company.segment,
        attendee_full_name: attendeeUser.name,
        attendee_email: attendeeUser.email,
        attendee_position: attendeeUser.position,
        attendee_rg: attendeeUser.rg,
        attendee_cpf: attendeeUser.cpf,
        mobile_phone: attendeeUser.mobile_phone,
        attendee_type: "admin_add", // Identificar que foi adicionado pelo admin
        participant_type: participantType,
        checked_in: false
      }
    })


    await logInfo(
      "Events.Admin.addAttendee",
      `Inscrito adicionado ao evento: ${attendeeUser.name}`,
      user.id,
      {
        attendanceId: attendance.id,
        userId: userId,
        userName: attendeeUser.name,
        userEmail: attendeeUser.email,
        eventId: eventId,
        eventTitle: event.title,
        participantType: participantType,
        addedBy: "admin"
      }
    )

    // Revalidar caminhos
    revalidatePath(eventsPath())
    revalidatePath(eventAdminPath(eventId))
    revalidatePath(`/admin/events/${eventId}/checkin`)

    const message = "Inscrito adicionado ao evento com sucesso"

    return toActionState("SUCCESS", message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    await logError(
      "Events.Admin.addAttendee",
      `Erro ao adicionar inscrito`,
      undefined,
      {
        error: errorMessage,
        userId: formData.get("userId"),
        eventId: formData.get("eventId"),
        participantType: formData.get("participantType")
      }
    )

    return toActionState("ERROR", "Erro ao adicionar inscrito. Tente novamente.")
  }
}