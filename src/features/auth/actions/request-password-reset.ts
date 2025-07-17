"use server"

import { z } from "zod"
import { randomBytes } from "crypto"
import { addMinutes } from "date-fns"
import { v4 as uuidv4 } from "uuid"
import { prisma } from "@/lib/prisma"
import { resend } from "@/lib/resend"
import { toActionState, ActionState } from "@/components/form/utils/to-action-state"
import { logInfo, logError, logWarn } from "@/features/logs/queries/add-log"

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
      where: { email: validatedData.email },
      select: {
        id: true,
        name: true,
        email: true,
        active: true
      }
    })
    
    console.log("👤 Usuário encontrado:", user ? `${user.name} (${user.email})` : "Não encontrado")

    // Validar se o usuário existe antes de enviar OTP
    if (!user) {
      console.log("❌ Usuário não encontrado, retornando erro")
      await logWarn("Auth.passwordReset", `Tentativa de reset de senha para email inexistente: ${validatedData.email}`, undefined, {
        email: validatedData.email,
        userExists: false
      })
      return toActionState("ERROR", "Email não encontrado. Verifique se o email está correto ou crie uma conta.", formData)
    }

    // Validar se o usuário está ativo
    if (!user.active) {
      console.log("❌ Usuário inativo, retornando erro")
      await logWarn("Auth.passwordReset", `Tentativa de reset de senha para usuário inativo: ${validatedData.email}`, user.id, {
        email: validatedData.email,
        userExists: true,
        userActive: false
      })
      return toActionState("ERROR", "Conta inativa. Entre em contato com o administrador.", formData)
    }

    // Log de usuário válido encontrado
    await logInfo("Auth.passwordReset", `Usuário válido encontrado para reset de senha: ${user.email}`, user.id, {
      email: user.email,
      userExists: true,
      userActive: true
    })

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

    await logInfo("Auth.passwordReset", `Token de reset de senha gerado para usuário: ${user.name}`, user.id, {
      email: user.email,
      tokenId: token,
      otpGenerated: true,
      expiresAt: expiresAt.toISOString()
    })

    // Envia email com OTP
    console.log("Tentando enviar email para:", validatedData.email)
    console.log("OTP gerado:", otp)
    
    const emailResult = await resend.emails.send({
      from: "ABF Eventos <reset-senha@abf.com.br>",
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
          <div style="background: #3564b1; padding: 40px 25px; text-align: center; border-radius: 8px 8px 0 0;">
            <img src="https://eventos.abfti.com.br/logo-white.png" alt="ABF Eventos" style="height: 60px; max-width: 100%; object-fit: contain;" />
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
      await logError("Auth.passwordReset", `Erro ao enviar email de reset de senha`, user.id, {
        email: user.email,
        emailError: emailResult.error,
        tokenId: token
      })
      return toActionState("ERROR", "Erro ao enviar email")
    }

    await logInfo("Auth.passwordReset", `Email de reset de senha enviado com sucesso`, user.id, {
      email: user.email,
      emailId: emailResult.data?.id,
      tokenId: token
    })

    return toActionState("SUCCESS", "Código de verificação enviado com sucesso para seu email!")
  } catch (error) {
    console.error("Erro ao solicitar reset de senha:", error)

    // Tentar extrair email do formData se possível
    const emailFromForm = formData.get("email") as string
    
    await logError("Auth.passwordReset", `Erro no processo de reset de senha`, undefined, {
      email: emailFromForm,
      error: String(error),
      errorType: error instanceof z.ZodError ? "validation" : "unknown"
    })

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