// /features/attendance-list/actions/cancel-registration.ts
"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getAuth } from "@/features/auth/queries/get-auth"
import { eventPath, eventsPath } from "@/app/paths"
import { toActionState } from "@/components/form/utils/to-action-state"
import { logError, logInfo, logWarn } from "@/features/logs/queries/add-log"
import { resend } from "@/lib/resend"

export const cancelRegistration = async (attendanceId: string) => {
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
            date: true,
            start_time: true,
            end_time: true,
            address: {
              include: {
                cities: true,
                states: true
              }
            },
            format: true,
            isStreaming: true
          }
        },
        users: {
          select: {
            email: true,
            username: true,
            company: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    if (!attendance) {
      await logWarn("AttendanceList.cancel", `Tentativa de cancelar inscrição inexistente #${attendanceId}`, user.id, {
        attendanceId
      })
      return toActionState("ERROR", "Inscrição não encontrada")
    }

    // Verificar se o usuário é o dono da inscrição
    const isOwner = attendance.userId === user.id

    if (!isOwner) {
      await logWarn("AttendanceList.cancel", `Usuário sem permissão tentou cancelar inscrição`, user.id, {
        attendanceId,
        eventId: attendance.events.id
      })
      return toActionState("ERROR", "Você não tem permissão para cancelar esta inscrição")
    }

    // Verificar se o evento já ocorreu
    const now = new Date()
    const eventDate = new Date(attendance.events.date)

    if (now > eventDate) {
      await logWarn("AttendanceList.cancel", `Tentativa de cancelar inscrição após evento`, user.id, {
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

    // Enviar email de confirmação de cancelamento
    try {
      // Formatar data do evento
      const eventDateFormatted = new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(eventDate)

      // Formatar endereço
      let locationInfo = ""
      if (attendance.events.format === "ONLINE") {
        locationInfo = "Evento Online"
      } else if (attendance.events.address) {
        const { street, number, complement, cities, states } = attendance.events.address
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
            <title>Inscrição Cancelada</title>
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
                background-color: #dc2626;
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
              .warning-box {
                background-color: #fef3c7;
                border: 1px solid #fbbf24;
                border-radius: 6px;
                padding: 15px;
                margin: 20px 0;
                font-size: 14px;
                color: #92400e;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Inscrição Cancelada</h1>
              </div>
              
              <div class="content">
                <p>Olá <strong>${attendance.attendee_full_name || attendance.users.username}</strong>,</p>
                
                <p>Confirmamos o cancelamento da sua inscrição para o seguinte evento:</p>
                
                <div class="event-card">
                  <h2 class="event-title">${attendance.events.title}</h2>
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
                    <strong>Horário:</strong> ${attendance.events.start_time} às ${attendance.events.end_time}
                  </p>
                  <p class="event-details">
                    <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                    </svg>
                    <strong>Local:</strong> ${locationInfo}
                  </p>
                  ${attendance.users.company ? `
                  <p class="event-details">
                    <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clip-rule="evenodd"/>
                    </svg>
                    <strong>Empresa:</strong> ${attendance.users.company.name}
                  </p>
                  ` : ''}
                </div>
                
                <div class="warning-box">
                  <strong>⚠️ Importante:</strong> Sua vaga foi liberada e está disponível para outros participantes. 
                  Caso deseje participar do evento, será necessário realizar uma nova inscrição, sujeita à disponibilidade de vagas.
                </div>
                
                <p>Se você cancelou por engano ou mudou de ideia, você pode se inscrever novamente acessando a página do evento:</p>
                
                <div style="text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/eventos/${attendance.events.id}" class="button">
                    Ver Evento
                  </a>
                </div>
                
                <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                  Se você tiver alguma dúvida, entre em contato conosco respondendo este e-mail.
                </p>
              </div>
              
              <div class="footer">
                <p>Este é um e-mail automático. Por favor, não responda diretamente a esta mensagem.</p>
                <p>&copy; ${new Date().getFullYear()} ABF Eventos. Todos os direitos reservados.</p>
              </div>
            </div>
          </body>
        </html>
      `

      await resend.emails.send({
        from: "ABF Eventos <no-reply@abf.com.br>",
        to: attendance.attendee_email || attendance.users.email,
        subject: `Inscrição cancelada - ${attendance.events.title}`,
        html: htmlContent
      })

      await logInfo("AttendanceList.cancel", `Email de cancelamento enviado para ${attendance.attendee_email}`, user.id, {
        attendanceId,
        eventId: attendance.events.id,
        email: attendance.attendee_email
      })
    } catch (emailError) {
      // Log do erro de email, mas não falha a operação
      await logError("AttendanceList.cancel", `Erro ao enviar email de cancelamento`, user.id, {
        attendanceId,
        error: String(emailError)
      })
    }

    await logInfo("AttendanceList.cancel", `Inscrição #${attendanceId} cancelada para o evento ${attendance.events.title}`, user.id, {
      attendanceId,
      eventId: attendance.events.id,
      eventTitle: attendance.events.title,
      attendeeName: attendance.attendee_full_name,
      attendeeEmail: attendance.attendee_email
    })

    revalidatePath(eventsPath())
    revalidatePath(eventPath(attendance.events.id))

    return toActionState("SUCCESS", "Inscrição cancelada com sucesso. Você receberá um e-mail de confirmação.")
  } catch (error) {
    await logError("AttendanceList.cancel", `Erro ao cancelar inscrição #${attendanceId}`, user.id, {
      attendanceId,
      error: String(error)
    })

    return toActionState("ERROR", "Ocorreu um erro ao cancelar a inscrição")
  }
}