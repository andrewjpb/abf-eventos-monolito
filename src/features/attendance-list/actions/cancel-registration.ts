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
          <title>Inscrição Cancelada - ABF Eventos</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #3564b1; padding: 40px 25px; text-align: center; border-radius: 8px 8px 0 0;">
            <img src="https://eventos.abfti.com.br/logo-white.png" alt="ABF Eventos" style="height: 60px; max-width: 100%; object-fit: contain;" />
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px; text-align: center;">Inscrição Cancelada</h2>
            
            <div style="background: #fef3c7; border: 2px solid #fbbf24; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <p style="margin: 0; font-size: 18px; color: #92400e; font-weight: bold;">⚠️ Cancelamento Confirmado</p>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #92400e;">Sua inscrição foi cancelada com sucesso.</p>
            </div>
            
            <p style="margin-bottom: 20px;">Olá, <strong>${attendance.attendee_full_name || attendance.users.username}</strong>!</p>
            
            <p style="margin-bottom: 25px; font-size: 16px;">Confirmamos o cancelamento da sua inscrição para o seguinte evento:</p>
            
            <div style="background: #f8f9fa; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">${attendance.events.title}</h3>
              
              <p style="margin: 8px 0; font-size: 14px; color: #666;">
                <strong>📅 Data:</strong> ${eventDateFormatted}
              </p>
              
              <p style="margin: 8px 0; font-size: 14px; color: #666;">
                <strong>🕐 Horário:</strong> ${attendance.events.start_time} às ${attendance.events.end_time}
              </p>
              
              <p style="margin: 8px 0; font-size: 14px; color: #666;">
                <strong>📍 Local:</strong> ${locationInfo}
              </p>
              
              ${attendance.users.company ? `
              <p style="margin: 8px 0; font-size: 14px; color: #666;">
                <strong>🏢 Empresa:</strong> ${attendance.users.company.name}
              </p>
              ` : ''}
            </div>
            
            <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; font-weight: bold; color: #92400e;">⚠️ Importante:</p>
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                Sua vaga foi liberada e está disponível para outros participantes. 
                Caso deseje participar do evento, será necessário realizar uma nova inscrição, sujeita à disponibilidade de vagas.
              </p>
            </div>
            
            <p style="margin-bottom: 25px; font-size: 16px;">
              Se você cancelou por engano ou mudou de ideia, você pode se inscrever novamente:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/eventos/${attendance.events.id}" style="display: inline-block; padding: 12px 30px; background-color: #3564b1; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
                Ver Evento
              </a>
            </div>
            
            <p style="margin-top: 30px; font-size: 12px; color: #999; text-align: center;">
              Se você tiver alguma dúvida, entre em contato conosco respondendo este e-mail.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="font-size: 11px; color: #999; text-align: center; margin: 0;">
              Este é um e-mail automático. Por favor, não responda diretamente a esta mensagem.<br>
              © ${new Date().getFullYear()} ABF Eventos. Todos os direitos reservados.
            </p>
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