"use server"

import { getAuth } from "@/features/auth/queries/get-auth"
import { prisma } from "@/lib/prisma"
import { OTPManager } from "@/lib/otp"
import { logInfo, logError, logWarn } from "@/features/logs/queries/add-log"

export async function verifyOTP(otpCode: string) {
  const auth = await getAuth()
  
  if (!auth || !auth.user) {
    await logWarn("Auth.OTP", "Tentativa de verificação de OTP sem autenticação", null, {
      hasAuth: !!auth,
      hasUser: !!auth?.user,
      action: "verify_otp"
    })
    return { 
      status: "ERROR" as const, 
      message: "Usuário não autenticado" 
    }
  }

  try {
    const user = await prisma.users.findUnique({
      where: { id: auth.user.id },
      select: { 
        email: true,
        email_verified: true 
      }
    })

    if (!user) {
      await logError("Auth.OTP", "Usuário não encontrado para verificação de OTP", auth.user.id, {
        userId: auth.user.id,
        action: "verify_otp"
      })
      return { 
        status: "ERROR" as const, 
        message: "Usuário não encontrado" 
      }
    }

    if (user.email_verified) {
      await logInfo("Auth.OTP", "Tentativa de verificação de OTP para email já verificado", auth.user.id, {
        email: user.email,
        emailVerified: true,
        action: "verify_otp"
      })
      return { 
        status: "SUCCESS" as const, 
        message: "Email já verificado",
        verified: true
      }
    }

    // Verificar código OTP usando a classe OTPManager
    const verificationResult = await OTPManager.verifyOTP({
      identifier: user.email,
      purpose: "email_verification",
      code: otpCode
    })

    if (!verificationResult.valid) {
      await logWarn("Auth.OTP", "Tentativa de verificação de OTP com código inválido", auth.user.id, {
        email: user.email,
        otpCode: otpCode,
        verificationError: verificationResult.message,
        action: "verify_otp"
      })
      return { 
        status: "ERROR" as const, 
        message: verificationResult.message
      }
    }

    // Marcar email como verificado
    await prisma.users.update({
      where: { id: auth.user.id },
      data: {
        email_verified: true
      }
    })

    await logInfo("Auth.OTP", "Email verificado com sucesso via OTP", auth.user.id, {
      email: user.email,
      otpCode: otpCode,
      emailVerified: true,
      action: "verify_otp"
    })

    return { 
      status: "SUCCESS" as const, 
      message: "Email verificado com sucesso!",
      verified: true
    }
  } catch (error) {
    console.error("Erro ao verificar OTP:", error)
    await logError("Auth.OTP", "Erro interno ao verificar código OTP", auth.user?.id, {
      userId: auth.user?.id,
      otpCode: otpCode,
      error: String(error),
      action: "verify_otp"
    })
    return { 
      status: "ERROR" as const, 
      message: "Erro ao verificar código" 
    }
  }
}