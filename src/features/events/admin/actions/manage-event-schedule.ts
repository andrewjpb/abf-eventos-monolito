// /features/events/admin/actions/manage-event-schedule.ts
"use server"

import { ActionState, fromErrorToActionState, toActionState } from "@/components/form/utils/to-action-state"
import { prisma } from "@/lib/prisma"
import { randomUUID } from "crypto"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { getAuthWithPermissionOrRedirect } from "@/features/auth/queries/get-auth-with-permission-or-redirect"

// Schema para validação
const scheduleSchema = z.object({
  eventId: z.string().min(1, { message: "ID do evento é obrigatório" }),
  day_date: z.string().min(1, { message: "Data é obrigatória" }),
  start_time: z.string().min(1, { message: "Horário de início é obrigatório" }),
  end_time: z.string().min(1, { message: "Horário de fim é obrigatório" }),
  title: z.string().min(1, { message: "Título é obrigatório" }),
  description: z.string().optional(),
  order_index: z.string().optional()
})

// Adicionar item à programação
export const addScheduleItem = async (
  _actionState: ActionState,
  formData: FormData
) => {
  try {
    await getAuthWithPermissionOrRedirect("events.create")

    const formDataEntries = Object.fromEntries(formData)
    const data = scheduleSchema.parse(formDataEntries)

    // Verificar se o evento existe
    const event = await prisma.events.findUnique({
      where: { id: data.eventId }
    })

    if (!event) {
      return toActionState("ERROR", "Evento não encontrado")
    }

    // Validar horários
    if (data.start_time >= data.end_time) {
      return toActionState("ERROR", "Horário de início deve ser anterior ao horário de fim")
    }

    // Criar item da programação
    const scheduleId = randomUUID()
    await prisma.event_schedule.create({
      data: {
        id: scheduleId,
        eventId: data.eventId,
        day_date: new Date(data.day_date),
        start_time: data.start_time,
        end_time: data.end_time,
        title: data.title,
        description: data.description || "",
        order_index: data.order_index ? parseInt(data.order_index) : 0
      }
    })

    revalidatePath(`/admin/events/${data.eventId}`)
    return toActionState("SUCCESS", "Item adicionado à programação com sucesso")

  } catch (error) {
    return fromErrorToActionState(error, formData)
  }
}

// Remover item da programação
export const removeScheduleItem = async (
  _actionState: ActionState,
  formData: FormData
) => {
  try {
    await getAuthWithPermissionOrRedirect("events.create")

    const scheduleId = formData.get("scheduleId")?.toString()
    const eventId = formData.get("eventId")?.toString()

    if (!scheduleId || !eventId) {
      return toActionState("ERROR", "Dados incompletos")
    }

    // Verificar se o item existe
    const scheduleItem = await prisma.event_schedule.findUnique({
      where: { id: scheduleId }
    })

    if (!scheduleItem) {
      return toActionState("ERROR", "Item da programação não encontrado")
    }

    // Remover item
    await prisma.event_schedule.delete({
      where: { id: scheduleId }
    })

    revalidatePath(`/admin/events/${eventId}`)
    return toActionState("SUCCESS", "Item removido da programação com sucesso")

  } catch (error) {
    return fromErrorToActionState(error, formData)
  }
}

// Atualizar item da programação
export const updateScheduleItem = async (
  _actionState: ActionState,
  formData: FormData
) => {
  try {
    await getAuthWithPermissionOrRedirect("events.create")

    const scheduleId = formData.get("scheduleId")?.toString()
    if (!scheduleId) {
      return toActionState("ERROR", "ID do item da programação é obrigatório")
    }

    const formDataEntries = Object.fromEntries(formData)
    const data = scheduleSchema.parse(formDataEntries)

    // Verificar se o item existe
    const scheduleItem = await prisma.event_schedule.findUnique({
      where: { id: scheduleId }
    })

    if (!scheduleItem) {
      return toActionState("ERROR", "Item da programação não encontrado")
    }

    // Validar horários
    if (data.start_time >= data.end_time) {
      return toActionState("ERROR", "Horário de início deve ser anterior ao horário de fim")
    }

    // Atualizar item
    await prisma.event_schedule.update({
      where: { id: scheduleId },
      data: {
        day_date: new Date(data.day_date),
        start_time: data.start_time,
        end_time: data.end_time,
        title: data.title,
        description: data.description || "",
        order_index: data.order_index ? parseInt(data.order_index) : 0
      }
    })

    revalidatePath(`/admin/events/${data.eventId}`)
    return toActionState("SUCCESS", "Item da programação atualizado com sucesso")

  } catch (error) {
    return fromErrorToActionState(error, formData)
  }
}