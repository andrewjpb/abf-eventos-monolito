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
import { DEFAULT_PARTICIPANT_TYPE } from "../constants/participant-types"
import { resend } from "@/lib/resend"

// Schema para validação
const attendeeSchema = z.object({
  eventId: z.string().min(1, { message: "ID do evento é obrigatório" }),
  userId: z.string().min(1, { message: "ID do usuário é obrigatório" }),
  company_cnpj: z.string().min(1, { message: "CNPJ da empresa é obrigatório" }),
  company_segment: z.string().min(1, { message: "Segmento da empresa é obrigatório" }),
  attendee_full_name: z.string().min(1, { message: "Nome completo é obrigatório" }),
  attendee_email: z.string().email({ message: "E-mail inválido" }),
  attendee_position: z.string().min(1, { message: "Cargo é obrigatório" }),
  attendee_rg: z.string().min(1, { message: "RG é obrigatório" }),
  attendee_cpf: z.string().min(11, { message: "CPF é obrigatório" }).max(11),
  mobile_phone: z.string().min(1, { message: "Telefone celular é obrigatório" }),
  attendee_type: z.string().min(1, { message: "Tipo de participante é obrigatório" }),
  participant_type: z.string().default(DEFAULT_PARTICIPANT_TYPE),
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
        start_time: true,
        end_time: true,
        vacancy_total: true,
        vacancy_online: true,
        vacancies_per_brand: true,
        free_online: true,
        address: {
          include: {
            cities: true,
            states: true
          }
        },
        format: true,
        isStreaming: true,
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

    // Verificar vagas disponíveis baseado no tipo de inscrição
    const isOnlineRegistration = data.attendee_type === 'online'
    const isPresentialRegistration = data.attendee_type === 'in_person'

    // Contar inscrições presenciais e online separadamente
    const presentialCount = await prisma.attendance_list.count({
      where: {
        eventId: data.eventId,
        attendee_type: 'in_person'
      }
    })

    const onlineCount = await prisma.attendance_list.count({
      where: {
        eventId: data.eventId,
        attendee_type: 'online'
      }
    })

    // Validar vagas presenciais
    if (isPresentialRegistration && presentialCount >= event.vacancy_total) {
      await logWarn("AttendanceList.register", `Tentativa de inscrição presencial em evento lotado`, user.id, {
        eventId: data.eventId,
        vacancyTotal: event.vacancy_total,
        currentPresentialAttendances: presentialCount
      })
      return toActionState("ERROR", "Este evento já atingiu o número máximo de participantes presenciais")
    }

    // Validar vagas online
    if (isOnlineRegistration && onlineCount >= event.vacancy_online) {
      await logWarn("AttendanceList.register", `Tentativa de inscrição online em evento lotado`, user.id, {
        eventId: data.eventId,
        vacancyOnline: event.vacancy_online,
        currentOnlineAttendances: onlineCount
      })
      return toActionState("ERROR", "Este evento já atingiu o número máximo de participantes online")
    }

    // Verificar limite de vagas por marca
    // Regras:
    // - Presencial: SEMPRE valida contra vacancies_per_brand
    // - Online com free_online=true: NÃO valida contra vacancies_per_brand
    // - Online com free_online=false: valida APENAS inscrições online contra vacancies_per_brand

    if (isPresentialRegistration) {
      // Para presencial: contar apenas inscrições presenciais da empresa
      const companyPresentialCount = await prisma.attendance_list.count({
        where: {
          eventId: data.eventId,
          company_cnpj: data.company_cnpj,
          attendee_type: 'in_person'
        }
      })

      if (companyPresentialCount >= event.vacancies_per_brand) {
        await logWarn("AttendanceList.register", `Tentativa de inscrição presencial acima do limite por empresa`, user.id, {
          eventId: data.eventId,
          companyCnpj: data.company_cnpj,
          vacanciesPerBrand: event.vacancies_per_brand,
          currentCompanyPresentialAttendances: companyPresentialCount
        })
        return toActionState("ERROR", `Sua empresa já atingiu o limite de ${event.vacancies_per_brand} inscrições presenciais para este evento`)
      }
    } else if (isOnlineRegistration && !event.free_online) {
      // Para online com free_online=false: contar apenas inscrições online da empresa
      const companyOnlineCount = await prisma.attendance_list.count({
        where: {
          eventId: data.eventId,
          company_cnpj: data.company_cnpj,
          attendee_type: 'online'
        }
      })

      if (companyOnlineCount >= event.vacancies_per_brand) {
        await logWarn("AttendanceList.register", `Tentativa de inscrição online acima do limite por empresa`, user.id, {
          eventId: data.eventId,
          companyCnpj: data.company_cnpj,
          vacanciesPerBrand: event.vacancies_per_brand,
          currentCompanyOnlineAttendances: companyOnlineCount
        })
        return toActionState("ERROR", `Sua empresa já atingiu o limite de ${event.vacancies_per_brand} inscrições online para este evento`)
      }
    }
    // Se for online com free_online=true, não valida limite por marca

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

    const newAttendance = await prisma.attendance_list.create({
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
        participant_type: data.participant_type,
        created_at: new Date(),
        updatedAt: new Date()
      }
    })

    // Obter informações da empresa do usuário para o email
    const userCompany = await prisma.company.findFirst({
      where: { cnpj: data.company_cnpj },
      select: { name: true }
    })

    // Enviar email de confirmação de inscrição
    try {
      // Formatar data do evento
      const eventDate = new Date(event.date)
      const eventDateFormatted = new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(eventDate)

      // Formatar endereço
      let locationInfo = ""
      if (event.format === "ONLINE") {
        locationInfo = "Evento Online"
      } else if (event.address) {
        const { street, number, complement, cities, states } = event.address
        const addressParts = [
          street,
          number && `nº ${number}`,
          complement,
          cities?.name,
          states?.uf
        ].filter(Boolean)
        locationInfo = addressParts.join(", ")
      } else {
        locationInfo = "Local a definir"
      }

      // Criar mensagem HTML
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Inscrição Confirmada - ABF Eventos</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #3564b1; padding: 40px 25px; text-align: center; border-radius: 8px 8px 0 0;">
            <img src="https://eventos.abfti.com.br/logo-white.png" alt="ABF Eventos" style="height: 60px; max-width: 100%; object-fit: contain;" />
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px; text-align: center;">Inscrição Confirmada</h2>
            
            <div style="background: #dcfce7; border: 2px solid #22c55e; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <p style="margin: 0; font-size: 18px; color: #166534; font-weight: bold;">✅ Parabéns!</p>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #166534;">Sua inscrição foi realizada com sucesso!</p>
            </div>
            
            <p style="margin-bottom: 20px;">Olá, <strong>${data.attendee_full_name}</strong>!</p>
            
            <p style="margin-bottom: 25px; font-size: 16px;">Aqui estão os detalhes do evento:</p>
            
            <div style="background: #f8f9fa; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">${event.title}</h3>
              
              <p style="margin: 8px 0; font-size: 14px; color: #666;">
                <strong>📅 Data:</strong> ${eventDateFormatted}
              </p>
              
              <p style="margin: 8px 0; font-size: 14px; color: #666;">
                <strong>🕐 Horário:</strong> ${event.start_time} às ${event.end_time}
              </p>
              
              <p style="margin: 8px 0; font-size: 14px; color: #666;">
                <strong>📍 Local:</strong> ${locationInfo}
              </p>
              
              ${userCompany?.name ? `
              <p style="margin: 8px 0; font-size: 14px; color: #666;">
                <strong>🏢 Empresa:</strong> ${userCompany.name}
              </p>
              ` : ''}
              
              <p style="margin: 8px 0; font-size: 14px; color: #666;">
                <strong>👤 Participante:</strong> ${data.attendee_full_name}
              </p>
              
              <p style="margin: 8px 0; font-size: 14px; color: #666;">
                <strong>✉️ E-mail:</strong> ${data.attendee_email}
              </p>
            </div>
            
            <div style="background: #dbeafe; border: 1px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; font-weight: bold; color: #1e40af;">📋 Próximos passos:</p>
              <ul style="margin: 0; padding-left: 20px; color: #1e40af; font-size: 14px;">
                <li style="margin: 5px 0;">Anote a data e horário em sua agenda</li>
                <li style="margin: 5px 0;">Chegue com 15 minutos de antecedência</li>
                <li style="margin: 5px 0;">Traga um documento com foto para o credenciamento</li>
                ${event.format === "ONLINE" || event.format === "HIBRIDO" ? '<li style="margin: 5px 0;">Você receberá o link de acesso próximo ao evento</li>' : ''}
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/eventos/${event.id}" style="display: inline-block; padding: 12px 30px; background-color: #3564b1; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
                Ver Detalhes do Evento
              </a>
            </div>
            
            <p style="margin-top: 30px; font-size: 12px; color: #999; text-align: center;">
              Se você tiver alguma dúvida ou precisar cancelar sua inscrição, acesse a página do evento ou entre em contato conosco.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="font-size: 11px; color: #999; text-align: center; margin: 0;">
              Este é um e-mail automático de confirmação de inscrição.<br>
              © ${new Date().getFullYear()} ABF Eventos. Todos os direitos reservados.
            </p>
          </div>
        </body>
        </html>
      `

      await resend.emails.send({
        from: "ABF Eventos <inscricoes@abf.com.br>",
        to: data.attendee_email,
        subject: `Inscrição confirmada - ${event.title}`,
        html: htmlContent
      })

      await logInfo("AttendanceList.register", `Email de confirmação enviado para ${data.attendee_email}`, user.id, {
        attendanceId: newAttendanceId,
        eventId: data.eventId,
        email: data.attendee_email
      })
    } catch (emailError) {
      // Log do erro de email, mas não falha a operação
      await logError("AttendanceList.register", `Erro ao enviar email de confirmação`, user.id, {
        attendanceId: newAttendanceId,
        eventId: data.eventId,
        error: String(emailError)
      })
    }

    await logInfo("AttendanceList.register", `Nova inscrição criada para o evento ${event.title}`, user.id, {
      eventId: data.eventId,
      attendanceId: newAttendanceId,
      userName: data.attendee_full_name,
      userEmail: data.attendee_email,
      companyCnpj: data.company_cnpj
    })

    revalidatePath(eventsPath())
    revalidatePath(eventPath(data.eventId))

    return toActionState("SUCCESS", "Inscrição realizada com sucesso! Você receberá um e-mail de confirmação.")
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