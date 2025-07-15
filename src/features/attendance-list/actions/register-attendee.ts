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
        vacancies_per_brand: true,
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
            <title>Inscrição Confirmada</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f5f5f5;
                margin: 0;
                padding: 0;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              }
              .header {
                background-color: #16a34a;
                color: #ffffff;
                padding: 30px;
                text-align: center;
              }
              .header h1 {
                margin: 0;
                font-size: 24px;
                font-weight: 600;
              }
              .content {
                padding: 30px;
              }
              .event-card {
                background-color: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
              }
              .event-title {
                font-size: 18px;
                font-weight: 600;
                color: #111827;
                margin: 0 0 10px 0;
              }
              .event-details {
                font-size: 14px;
                color: #6b7280;
                margin: 5px 0;
              }
              .icon {
                display: inline-block;
                width: 16px;
                height: 16px;
                margin-right: 8px;
                vertical-align: middle;
              }
              .footer {
                background-color: #f9fafb;
                padding: 20px 30px;
                text-align: center;
                font-size: 12px;
                color: #6b7280;
                border-top: 1px solid #e5e7eb;
              }
              .button {
                display: inline-block;
                padding: 12px 24px;
                background-color: #2563eb;
                color: #ffffff;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 500;
                margin-top: 20px;
              }
              .success-box {
                background-color: #dcfce7;
                border: 1px solid #22c55e;
                border-radius: 6px;
                padding: 15px;
                margin: 20px 0;
                font-size: 14px;
                color: #166534;
              }
              .info-box {
                background-color: #dbeafe;
                border: 1px solid #3b82f6;
                border-radius: 6px;
                padding: 15px;
                margin: 20px 0;
                font-size: 14px;
                color: #1e40af;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Inscrição Confirmada</h1>
              </div>
              
              <div class="content">
                <p>Olá <strong>${data.attendee_full_name}</strong>,</p>
                
                <div class="success-box">
                  <strong>🎉 Parabéns!</strong> Sua inscrição foi realizada com sucesso! Sua vaga está garantida para o evento.
                </div>
                
                <p>Aqui estão os detalhes do evento:</p>
                
                <div class="event-card">
                  <h2 class="event-title">${event.title}</h2>
                  <p class="event-details">
                    <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM4 8h12v8H4V8z" clip-rule="evenodd"/>
                    </svg>
                    <strong>Data:</strong> ${eventDateFormatted}
                  </p>
                  <p class="event-details">
                    <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                    </svg>
                    <strong>Horário:</strong> ${event.start_time} às ${event.end_time}
                  </p>
                  <p class="event-details">
                    <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                    </svg>
                    <strong>Local:</strong> ${locationInfo}
                  </p>
                  ${userCompany?.name ? `
                  <p class="event-details">
                    <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clip-rule="evenodd"/>
                    </svg>
                    <strong>Empresa:</strong> ${userCompany.name}
                  </p>
                  ` : ''}
                  <p class="event-details">
                    <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
                    </svg>
                    <strong>Participante:</strong> ${data.attendee_full_name}
                  </p>
                  <p class="event-details">
                    <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                    </svg>
                    <strong>E-mail:</strong> ${data.attendee_email}
                  </p>
                </div>
                
                <div class="info-box">
                  <strong>📋 Próximos passos:</strong>
                  <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Anote a data e horário em sua agenda</li>
                    <li>Chegue com 15 minutos de antecedência</li>
                    <li>Traga um documento com foto para o credenciamento</li>
                    ${event.format === "ONLINE" || event.format === "HIBRIDO" ? '<li>Você receberá o link de acesso próximo ao evento</li>' : ''}
                  </ul>
                </div>
                
                <div style="text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/eventos/${event.id}" class="button">
                    Ver Detalhes do Evento
                  </a>
                </div>
                
                <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                  Se você tiver alguma dúvida ou precisar cancelar sua inscrição, acesse a página do evento ou entre em contato conosco.
                </p>
              </div>
              
              <div class="footer">
                <p>Este é um e-mail automático de confirmação de inscrição.</p>
                <p>&copy; ${new Date().getFullYear()} ABF Eventos. Todos os direitos reservados.</p>
              </div>
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