// /features/events/actions/upsert-event.ts
"use server"

import { ActionState, fromErrorToActionState, toActionState } from "@/components/form/utils/to-action-state"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { nanoid } from "nanoid"
import { revalidatePath } from "next/cache"
import { eventsPath, eventPath } from "@/app/paths"
import { redirect } from "next/navigation"
import { logError, logInfo, logWarn } from "@/features/logs/queries/add-log"
import { getAuthWithPermission } from "@/features/auth/queries/get-auth-with-permission"
// Schema para validação
const eventSchema = z.object({
  title: z.string().min(1, { message: "Título do evento é obrigatório" }),
  summary: z.string().min(1, { message: "Resumo do evento é obrigatório" }),
  description: z.string().min(1, { message: "Descrição do evento é obrigatória" }),
  date: z.string().min(1, { message: "Data do evento é obrigatória" }),
  start_time: z.string().min(1, { message: "Hora de início é obrigatória" }),
  end_time: z.string().min(1, { message: "Hora de término é obrigatória" }),
  format: z.string().min(1, { message: "Formato do evento é obrigatório" }),
  addressId: z.string().min(1, { message: "Endereço é obrigatório" }),
  vacancy_total: z.coerce.number().min(1, { message: "Total de vagas é obrigatório" }),
  vacancies_per_brand: z.coerce.number().min(1, { message: "Vagas por marca é obrigatório" }),
  minimum_quorum: z.coerce.number().min(0, { message: "Quórum mínimo deve ser um número positivo" }),
  highlight: z.coerce.boolean().default(false),
  isStreaming: z.coerce.boolean().default(false),
  transmission_link: z.string().optional(),
  schedule_link: z.string().optional(),
  free_online: z.coerce.boolean().default(false),
  isPublished: z.coerce.boolean().default(false),
});

export const upsertEvent = async (
  eventId: string | undefined,
  _actionState: ActionState,
  formData: FormData
) => {
  const { user, error } = await getAuthWithPermission("events.create")
  if (error) {
    return toActionState("ERROR", "Você não tem permissão para realizar esta ação")
  }

  try {
    const data = eventSchema.parse(Object.fromEntries(formData))

    // Se é uma atualização, verificar se o evento existe
    if (eventId) {
      const existingEvent = await prisma.events.findUnique({
        where: { id: eventId },
        select: {
          id: true,
          title: true,
          date: true,
          vacancy_total: true,
          _count: {
            select: {
              attendance_list: true
            }
          }
        }
      })

      if (!existingEvent) {
        await logWarn("Event.update", `Tentativa de atualizar evento inexistente #${eventId}`, user.id, {
          eventId
        })
        return toActionState("ERROR", "Evento não encontrado")
      }

      // Verificar se as vagas estão sendo reduzidas e já existem inscritos
      if (data.vacancy_total < existingEvent.vacancy_total &&
        existingEvent._count.attendance_list > 0 &&
        data.vacancy_total < existingEvent._count.attendance_list) {
        await logWarn("Event.update", `Tentativa de reduzir vagas abaixo do número de inscritos #${eventId}`, user.id, {
          eventId,
          currentVacancies: existingEvent.vacancy_total,
          newVacancies: data.vacancy_total,
          attendeesCount: existingEvent._count.attendance_list
        })
        return toActionState("ERROR", `Não é possível reduzir o número de vagas abaixo do número de inscritos (${existingEvent._count.attendance_list})`)
      }

      // Para o log, preparamos as alterações significativas
      const changes: any = {}

      // Verificar mudanças na data (importante para notificar inscritos)
      const oldDate = existingEvent.date
      const newDate = new Date(data.date)
      if (oldDate.toISOString() !== newDate.toISOString()) {
        changes['date'] = { from: oldDate, to: newDate }
      }

      // Atualizar o evento existente
      await prisma.events.update({
        where: { id: eventId },
        data: {
          title: data.title,
          summary: data.summary,
          description: data.description,
          date: newDate,
          start_time: data.start_time,
          end_time: data.end_time,
          format: data.format,
          addressId: data.addressId,
          vacancy_total: data.vacancy_total,
          vacancies_per_brand: data.vacancies_per_brand,
          minimum_quorum: data.minimum_quorum,
          highlight: data.highlight,
          isStreaming: data.isStreaming,
          transmission_link: data.transmission_link || "",
          schedule_link: data.schedule_link || "",
          free_online: data.free_online,
          isPublished: data.isPublished,
          updatedAt: new Date()
        }
      })

      await logInfo("Event.update", `Evento #${eventId} atualizado: ${data.title}`, user.id, {
        eventId,
        eventTitle: data.title,
        changes
      })

    } else {
      // Criar novo evento
      const newEventId = nanoid()

      // Gerar um slug baseado no título
      const slug = data.title
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-') +
        '-' +
        nanoid(5).toLowerCase();

      await prisma.events.create({
        data: {
          id: newEventId,
          title: data.title,
          slug,
          summary: data.summary,
          description: data.description,
          date: new Date(data.date),
          start_time: data.start_time,
          end_time: data.end_time,
          format: data.format,
          addressId: data.addressId,
          vacancy_total: data.vacancy_total,
          vacancies_per_brand: data.vacancies_per_brand,
          minimum_quorum: data.minimum_quorum,
          highlight: data.highlight,
          isStreaming: data.isStreaming,
          transmission_link: data.transmission_link || "",
          schedule_link: data.schedule_link || "",
          free_online: data.free_online,
          image_url: "", // Estes campos serão preenchidos posteriormente através do upload de imagens
          thumb_url: "",
          image_path: "",
          thumb_path: "",
          ticket_img_path: "",
          isPublished: data.isPublished,
          created_at: new Date(),
          updatedAt: new Date()
        }
      })

      await logInfo("Event.create", `Novo evento criado: ${data.title}`, user.id, {
        eventId: newEventId,
        eventTitle: data.title,
        eventDate: new Date(data.date),
        isPublished: data.isPublished
      })

      // Atualizar ID para redirecionamento
      eventId = newEventId
    }

    revalidatePath(eventsPath())
    revalidatePath(eventPath(eventId!))

    // Redirecionar para a página do evento
    redirect(eventPath(eventId!))

  } catch (error) {
    await logError("Event.upsert", `Erro ao ${eventId ? 'atualizar' : 'criar'} evento`, user.id, {
      eventId,
      error: String(error),
      formDataKeys: Array.from(formData.keys())
    })
    return fromErrorToActionState(error, formData)
  }

}