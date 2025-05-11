// /features/events/actions/delete-event.ts
"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { setCoookieByKey } from "@/actions/cookies"
import { getAdminOrRedirect } from "@/features/auth/queries/get-auth-or-rerdirect"
import { eventsPath } from "@/app/paths"
import { toActionState } from "@/components/form/utils/to-action-state"
import { redirect } from "next/navigation"
import { logError, logInfo, logWarn } from "@/features/logs/queries/add-log"

export const deleteEvent = async (id: string) => {
  const { user } = await getAdminOrRedirect()

  try {
    // Verificar se o evento existe
    const event = await prisma.events.findUnique({
      where: { id },
      include: {
        address: true,
        speakers: true,
        sponsors: true,
        supporters: true,
        attendance_list: {
          select: {
            id: true,
            attendee_email: true
          }
        }
      }
    })

    // Se não existe
    if (!event) {
      await logWarn("Event.delete", `Tentativa de excluir evento inexistente #${id}`, user.id, {
        eventId: id
      })
      return toActionState("ERROR", "Evento não encontrado")
    }

    // Verificar se o evento já ocorreu e tem inscritos
    const hoje = new Date()
    const dataEvento = new Date(event.date)

    if (dataEvento < hoje && event.attendance_list.length > 0) {
      await logWarn("Event.delete", `Tentativa de excluir evento já realizado com inscritos #${id}`, user.id, {
        eventId: id,
        eventTitle: event.title,
        eventDate: event.date,
        attendeesCount: event.attendance_list.length
      })
      return toActionState("ERROR", "Não é possível excluir um evento já realizado que possui inscritos")
    }

    // Primeiro excluir os relacionamentos
    // 1. Excluir as inscrições
    await prisma.attendance_list.deleteMany({
      where: { eventId: id }
    })

    // 2. Remover relações com palestrantes
    await prisma.events.update({
      where: { id },
      data: {
        speakers: {
          disconnect: event.speakers.map(speaker => ({ id: speaker.id }))
        }
      }
    })

    // 3. Remover relações com patrocinadores
    await prisma.events.update({
      where: { id },
      data: {
        sponsors: {
          disconnect: event.sponsors.map(sponsor => ({ id: sponsor.id }))
        }
      }
    })

    // 4. Remover relações com apoiadores
    await prisma.events.update({
      where: { id },
      data: {
        supporters: {
          disconnect: event.supporters.map(supporter => ({ id: supporter.id }))
        }
      }
    })

    // 5. Finalmente, excluir o evento
    await prisma.events.delete({
      where: { id }
    })

    await logInfo("Event.delete", `Evento #${id} (${event.title}) excluído com sucesso`, user.id, {
      eventId: id,
      eventTitle: event.title,
      eventDate: event.date,
      attendeesCount: event.attendance_list.length,
      attendeesEmails: event.attendance_list.map(a => a.attendee_email)
    })

    revalidatePath(eventsPath())
    setCoookieByKey("toast", "Evento excluído com sucesso")
    return redirect(eventsPath())
  } catch (error) {
    await logError("Event.delete", `Erro ao excluir evento #${id}`, user.id, {
      eventId: id,
      error: String(error)
    })
    console.error("Erro ao excluir evento:", error)
    return toActionState("ERROR", "Ocorreu um erro ao excluir o evento")
  }
}