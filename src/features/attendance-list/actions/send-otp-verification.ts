"use server"

import { getAuth } from "@/features/auth/queries/get-auth"
import { prisma } from "@/lib/prisma"
import { OTPManager } from "@/lib/otp"
import { logInfo, logError, logWarn } from "@/features/logs/queries/add-log"

export async function sendOTPVerification() {
  const auth = await getAuth()
  
  if (!auth || !auth.user) {
    await logWarn("Auth.OTP", "Tentativa de envio de OTP sem autenticação", null, {
      hasAuth: !!auth,
      hasUser: !!auth?.user
    })
    return { 
      status: "ERROR" as const, 
      message: "Usuário não autenticado" 
    }
  }

  try {
    const user = await prisma.users.findUnique({
      where: { id: auth.user.id },
      select: { email: true, email_verified: true }
    })

    if (!user) {
      await logError("Auth.OTP", "Usuário não encontrado na base de dados", auth.user.id, {
        userId: auth.user.id,
        action: "send_otp_verification"
      })
      return { 
        status: "ERROR" as const, 
        message: "Usuário não encontrado" 
      }
    }

    if (user.email_verified) {
      await logInfo("Auth.OTP", "Tentativa de envio de OTP para email já verificado", auth.user.id, {
        email: user.email,
        emailVerified: true
      })
      return { 
        status: "SUCCESS" as const, 
        message: "Email já verificado",
        emailVerified: true
      }
    }

    // Enviar código OTP usando a classe OTPManager
    const result = await OTPManager.sendEmailOTP({
      email: user.email,
      purpose: "email_verification",
      userId: auth.user.id,
      subject: "Confirme seu email - ABF Eventos",
      template: (code: string) => `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirme seu email - ABF Eventos</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 500px; margin: 0 auto; padding: 20px;">
          <div style="background: #3564b1; padding: 40px 25px; text-align: center; border-radius: 8px 8px 0 0;">
            <img src="https://eventos.abfti.com.br/logo-white.png" alt="ABF Eventos" style="height: 60px; max-width: 100%; object-fit: contain;" />
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px; text-align: center;">Confirme seu email</h2>
            
            <p style="margin-bottom: 25px; font-size: 16px; text-align: center;">
              Use o código abaixo para confirmar seu email e finalizar sua inscrição:
            </p>
            
            <div style="background: #f8f9fa; border: 2px solid #667eea; border-radius: 8px; padding: 25px; text-align: center; margin: 25px 0;">
              <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 6px;">${code}</div>
              <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Válido por 10 minutos</p>
            </div>
            
            <p style="font-size: 12px; color: #999; text-align: center; margin: 20px 0 0 0;">
              Se você não solicitou este código, ignore este email.
            </p>
          </div>
        </body>
        </html>
      `
    })

    if (result.success) {
      await logInfo("Auth.OTP", "Código OTP enviado com sucesso para verificação de email", auth.user.id, {
        email: user.email,
        purpose: "email_verification",
        emailSent: true
      })
      return { 
        status: "SUCCESS" as const, 
        message: result.message,
        emailVerified: false
      }
    } else {
      await logError("Auth.OTP", "Falha ao enviar código OTP para verificação de email", auth.user.id, {
        email: user.email,
        purpose: "email_verification",
        error: result.message
      })
      return { 
        status: "ERROR" as const, 
        message: result.message
      }
    }
  } catch (error) {
    console.error("Erro ao enviar OTP:", error)
    await logError("Auth.OTP", "Erro interno ao processar envio de OTP", auth.user?.id, {
      userId: auth.user?.id,
      error: String(error),
      action: "send_otp_verification"
    })
    return { 
      status: "ERROR" as const, 
      message: "Erro ao enviar código de verificação" 
    }
  }
}