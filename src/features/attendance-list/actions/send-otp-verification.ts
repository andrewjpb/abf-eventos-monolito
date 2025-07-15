"use server"

import { getAuth } from "@/features/auth/queries/get-auth"
import { prisma } from "@/lib/prisma"
import { OTPManager } from "@/lib/otp"

export async function sendOTPVerification() {
  const auth = await getAuth()
  
  if (!auth || !auth.user) {
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
      return { 
        status: "ERROR" as const, 
        message: "Usuário não encontrado" 
      }
    }

    if (user.email_verified) {
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
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Confirme seu email</h2>
          <p>Use o código abaixo para confirmar seu email e finalizar sua inscrição:</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="color: #1a73e8; letter-spacing: 5px; margin: 0;">${code}</h1>
          </div>
          <p style="color: #666; font-size: 14px;">Este código expira em 10 minutos.</p>
          <p style="color: #666; font-size: 14px;">Se você não solicitou este código, ignore este email.</p>
        </div>
      `
    })

    if (result.success) {
      return { 
        status: "SUCCESS" as const, 
        message: result.message,
        emailVerified: false
      }
    } else {
      return { 
        status: "ERROR" as const, 
        message: result.message
      }
    }
  } catch (error) {
    console.error("Erro ao enviar OTP:", error)
    return { 
      status: "ERROR" as const, 
      message: "Erro ao enviar código de verificação" 
    }
  }
}