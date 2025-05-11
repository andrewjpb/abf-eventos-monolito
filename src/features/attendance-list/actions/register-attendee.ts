// /features/attendance-list/actions/register-attendee.ts
"use server"

import { ActionState, fromErrorToActionState, toActionState } from "@/components/form/utils/to-action-state"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { nanoid } from "nanoid"
import { getAuth } from "@/features/auth/queries/get-auth"
import { revalidatePath } from "next/cache"
import { eventPath, eventsPath } from "@/app/paths"
import { logError, logInfo, logWarn } from "@/features/logs/queries/add-log"

// Schema para validação
const attendeeSchema = z.object({
  eventId: z.string().min(1, { message: "ID do evento é obrigatório" }),
  userId: z.string().min(1, { message: "ID do usuário é obrigatório" }),
  company_cnpj: z.string().min(14, { message: "CNPJ da empresa é obrigatório" }).max(14),
  company_segment: z.string().min(1, { message: "Segmento da empresa é obrigatório" }),
  attendee_full_name: z.string().min(1, { message: "Nome completo é obrigatório" }),
  attendee_email: z.string().email({ message: "E-mail inválido" }),
  attendee_position: z.string().min(1, { message: "Cargo é obrigatório" }),
  attendee_rg: z.string().min(1, { message: "RG é obrigatório" }),
  attendee_cpf: z.string().min(11, { message: "CPF é obrigatório" }).max(11),
  mobile_phone: z.string().min(1, { message: "Telefone celular é obrigatório" }),
  attendee_type: z.string().min(1, { message: "Tipo de participante é obrigatório" }),
})

export const registerAttendee = async (
  _actionState: ActionState,
  formData: FormData
) => {
  try {
    const { user } = await getAuth()

    if (!user) {
      return toActionState("ERROR", "Usuário não autenticado")
    }

    // Obter os dados do formulário
    const formDataEntries = Object.fromEntries(formData)

    // Ajustar o userId para ser o ID do usuário autenticado, se não for fornecido
    if (!formDataEntries.userId) {
      formDataEntries.userId = user.id
    }

    // Ajustar o CNPJ da empresa para ser o do usuário, se não for fornecido
    if (!formDataEntries.company_cnpj) {
      formDataEntries.company_cnpj = user.companyId
    }

    const data = attendeeSchema.parse(formDataEntries)

    // Verificar se o evento existe e está disponível para inscrições
    const event = await prisma.events.findUnique({
      where: { id: data.eventId },
      select: {
        id: true,
        title: true,
        date: true,
        vacancy_total: true,
        vacancies_per_brand: true,
        _count: {
          select: {
            attendance_list: true
          }
        }
      }
    })

    if (!event) {
      await logWarn("AttendanceList.register", `Tentativa de inscrição em evento inexistente`, user.id, {
        eventId: data.eventId
      })
      return toActionState("ERROR", "Evento não encontrado")
    }

    // Verificar se o evento já ocorreu
    const now = new Date()
    const eventDate = new Date(event.date)

    if (now > eventDate) {
      await logWarn("AttendanceList.register", `Tentativa de inscrição em evento já realizado`, user.id, {
        eventId: data.eventId,
        eventDate: eventDate
      })
      return toActionState("ERROR", "Não é possível se inscrever em um evento já realizado")
    }

    // Verificar se o evento já atingiu o número máximo de participantes
    if (event._count.attendance_list >= event.vacancy_total) {
      await logWarn("AttendanceList.register", `Tentativa de inscrição em evento lotado`, user.id, {
        eventId: data.eventId,
        vacancyTotal: event.vacancy_total,
        currentAttendances: event._count.attendance_list
      })
      return toActionState("ERROR", "Este evento já atingiu o número máximo de participantes")
    }

    // Verificar quantas inscrições a empresa já tem neste evento
    const companyAttendanceCount = await prisma.attendance_list.count({
      where: {
        eventId: data.eventId,
        company_cnpj: data.company_cnpj
      }
    })

    if (companyAttendanceCount >= event.vacancies_per_brand) {
      await logWarn("AttendanceList.register", `Tentativa de inscrição acima do limite por empresa`, user.id, {
        eventId: data.eventId,
        companyCnpj: data.company_cnpj,
        vacanciesPerBrand: event.vacancies_per_brand,
        currentCompanyAttendances: companyAttendanceCount
      })
      return toActionState("ERROR", `Sua empresa já atingiu o limite de ${event.vacancies_per_brand} inscrições para este evento`)
    }

    // Verificar se o usuário já está inscrito neste evento
    const existingAttendance = await prisma.attendance_list.findFirst({
      where: {
        eventId: data.eventId,
        userId: data.userId
      }
    })

    if (existingAttendance) {
      await logWarn("AttendanceList.register", `Usuário já inscrito no evento`, user.id, {
        eventId: data.eventId,
        attendanceId: existingAttendance.id
      })

      return toActionState("ERROR", "Você já está inscrito neste evento")
    }

    // Verificar se já existe uma inscrição com o mesmo e-mail, CPF ou RG para este evento
    const existingAttendanceByUniqueData = await prisma.attendance_list.findFirst({
      where: {
        eventId: data.eventId,
        OR: [
          { attendee_email: data.attendee_email },
          { attendee_cpf: data.attendee_cpf },
          { attendee_rg: data.attendee_rg }
        ]
      }
    })

    if (existingAttendanceByUniqueData) {
      let errorMessage = "Já existe uma inscrição para este evento com ";

      if (existingAttendanceByUniqueData.attendee_email === data.attendee_email) {
        errorMessage += "este e-mail";
      } else if (existingAttendanceByUniqueData.attendee_cpf === data.attendee_cpf) {
        errorMessage += "este CPF";
      } else if (existingAttendanceByUniqueData.attendee_rg === data.attendee_rg) {
        errorMessage += "este RG";
      }

      await logWarn("AttendanceList.register", `Tentativa de inscrição com dados duplicados`, user.id, {
        eventId: data.eventId,
        duplicatedEmail: existingAttendanceByUniqueData.attendee_email === data.attendee_email,
        duplicatedCpf: existingAttendanceByUniqueData.attendee_cpf === data.attendee_cpf,
        duplicatedRg: existingAttendanceByUniqueData.attendee_rg === data.attendee_rg
      })

      return toActionState("ERROR", errorMessage)
    }

    // Criar nova inscrição
    const newAttendanceId = nanoid()

    await prisma.attendance_list.create({
      data: {
        id: newAttendanceId,
        eventId: data.eventId,
        userId: data.userId,
        company_cnpj: data.company_cnpj,
        company_segment: data.company_segment,
        attendee_full_name: data.attendee_full_name,
        attendee_email: data.attendee_email,
        attendee_position: data.attendee_position,
        attendee_rg: data.attendee_rg,
        attendee_cpf: data.attendee_cpf,
        checked_in: false,
        mobile_phone: data.mobile_phone,
        attendee_type: data.attendee_type,
        created_at: new Date(),
        updatedAt: new Date()
      }
    })

    await logInfo("AttendanceList.register", `Nova inscrição criada para o evento ${event.title}`, user.id, {
      eventId: data.eventId,
      attendanceId: newAttendanceId,
      userName: data.attendee_full_name,
      userEmail: data.attendee_email,
      companyCnpj: data.company_cnpj
    })

    revalidatePath(eventsPath())
    revalidatePath(eventPath(data.eventId))

    return toActionState("SUCCESS", "Inscrição realizada com sucesso")
  } catch (error) {
    // Tentar obter o usuário se possível para registrar o erro
    let userId = "desconhecido"
    try {
      const { user } = await getAuth()
      if (user) {
        userId = user.id
      }
    } catch { }

    await logError("AttendanceList.register", `Erro ao processar inscrição em evento`, userId, {
      error: String(error),
      formDataKeys: Array.from(formData.keys())
    })

    return fromErrorToActionState(error, formData)
  }
}