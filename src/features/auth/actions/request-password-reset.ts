"use server"

import { z } from "zod"
import { randomBytes } from "crypto"
import { addMinutes } from "date-fns"
import { v4 as uuidv4 } from "uuid"
import { prisma } from "@/lib/prisma"
import { resend } from "@/lib/resend"
import { toActionState, ActionState } from "@/components/form/utils/to-action-state"

const requestPasswordResetSchema = z.object({
  email: z.string().email("Email inválido")
})

export async function requestPasswordReset(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  console.log("🚀 Iniciando requestPasswordReset")
  try {
    const data = {
      email: formData.get("email") as string
    }
    
    console.log("📧 Email recebido:", data.email)

    const validatedData = requestPasswordResetSchema.parse(data)
    console.log("✅ Dados validados:", validatedData)

    // Verifica se o usuário existe
    console.log("🔍 Buscando usuário no banco...")
    const user = await prisma.users.findUnique({
      where: { email: validatedData.email }
    })
    
    console.log("👤 Usuário encontrado:", user ? `${user.name} (${user.email})` : "Não encontrado")

    // Por segurança, sempre retornamos sucesso mesmo se o email não existir
    if (!user) {
      console.log("❌ Usuário não encontrado, retornando sucesso fake")
      return toActionState("SUCCESS", "Email enviado com sucesso")
    }

    // Gera código OTP de 6 dígitos
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // Gera token único para a URL
    const token = randomBytes(32).toString("hex")

    // Define expiração para 15 minutos
    const expiresAt = addMinutes(new Date(), 15)

    // Remove tokens antigos do usuário
    await prisma.reset_password_token.deleteMany({
      where: { userId: user.id }
    })

    // Cria novo token
    await prisma.reset_password_token.create({
      data: {
        id: uuidv4(),
        token,
        otp,
        userId: user.id,
        expiresAt,
        used: false
      }
    })

    // Envia email com OTP
    console.log("Tentando enviar email para:", validatedData.email)
    console.log("OTP gerado:", otp)
    
    const emailResult = await resend.emails.send({
      from: "ABF Eventos <onboarding@resend.dev>",
      to: [validatedData.email],
      subject: "Código para redefinir sua senha - ABF Eventos",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Código de Verificação - ABF Eventos</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 500px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">ABF Eventos</h1>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px; text-align: center;">Código de Verificação</h2>
            
            <p style="margin-bottom: 25px; font-size: 16px; text-align: center;">
              Olá, ${user.name}! Seu código para redefinir a senha é:
            </p>
            
            <div style="background: #f8f9fa; border: 2px solid #667eea; border-radius: 8px; padding: 25px; text-align: center; margin: 25px 0;">
              <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 6px;">${otp}</div>
              <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Válido por 15 minutos</p>
            </div>
            
            <p style="font-size: 12px; color: #999; text-align: center; margin: 20px 0 0 0;">
              Se você não solicitou este código, ignore este email.
            </p>
          </div>
        </body>
        </html>
      `
    })

    console.log("Resultado do envio de email:", emailResult)
    
    if (emailResult.error) {
      console.error("Erro no envio de email:", emailResult.error)
      return toActionState("ERROR", "Erro ao enviar email")
    }

    return toActionState("SUCCESS", "Email enviado com sucesso")
  } catch (error) {
    console.error("Erro ao solicitar reset de senha:", error)

    if (error instanceof z.ZodError) {
      return {
        status: "ERROR",
        message: "Dados inválidos",
        fieldErrors: error.flatten().fieldErrors,
        timestamp: Date.now()
      }
    }

    return toActionState("ERROR", "Erro interno do servidor")
  }
}