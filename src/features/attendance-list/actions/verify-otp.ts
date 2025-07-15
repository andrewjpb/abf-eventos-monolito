"use server"

import { getAuth } from "@/features/auth/queries/get-auth"
import { prisma } from "@/lib/prisma"
import { OTPManager } from "@/lib/otp"

export async function verifyOTP(otpCode: string) {
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
      select: { 
        email: true,
        email_verified: true 
      }
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

    return { 
      status: "SUCCESS" as const, 
      message: "Email verificado com sucesso!",
      verified: true
    }
  } catch (error) {
    console.error("Erro ao verificar OTP:", error)
    return { 
      status: "ERROR" as const, 
      message: "Erro ao verificar código" 
    }
  }
}