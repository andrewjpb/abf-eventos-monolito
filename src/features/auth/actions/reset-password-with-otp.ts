"use server"

import { z } from "zod"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { toActionState, ActionState } from "@/components/form/utils/to-action-state"

const resetPasswordWithOtpSchema = z.object({
  email: z.string().email("Email inválido"),
  otp: z.string().length(6, "Código deve ter 6 dígitos"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirm_password: z.string().min(6, "Confirmação de senha é obrigatória")
}).refine((data) => data.password === data.confirm_password, {
  message: "Senhas não coincidem",
  path: ["confirm_password"]
})

export async function resetPasswordWithOtp(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const data = {
      email: formData.get("email") as string,
      otp: formData.get("otp") as string,
      password: formData.get("password") as string,
      confirm_password: formData.get("confirm_password") as string
    }

    const validatedData = resetPasswordWithOtpSchema.parse(data)

    // Busca o usuário pelo email
    const user = await prisma.users.findUnique({
      where: { email: validatedData.email }
    })

    if (!user) {
      return {
        status: "ERROR",
        message: "Usuário não encontrado",
        fieldErrors: { email: ["Email não encontrado"] },
        timestamp: Date.now()
      }
    }

    // Busca o token de reset pelo userId e OTP
    const resetToken = await prisma.reset_password_token.findFirst({
      where: { 
        userId: user.id,
        otp: validatedData.otp,
        used: false
      },
      orderBy: { created_at: 'desc' }
    })

    if (!resetToken) {
      return {
        status: "ERROR",
        message: "Código de verificação inválido",
        fieldErrors: { otp: ["Código inválido ou expirado"] },
        timestamp: Date.now()
      }
    }

    // Verifica se o token não expirou
    if (resetToken.expiresAt < new Date()) {
      // Remove token expirado
      await prisma.reset_password_token.delete({
        where: { id: resetToken.id }
      })
      return {
        status: "ERROR",
        message: "Código expirado. Solicite um novo código.",
        fieldErrors: { otp: ["Código expirado"] },
        timestamp: Date.now()
      }
    }

    // Hash da nova senha
    const hashedPassword = await hash(validatedData.password, 10)

    // Atualiza a senha do usuário
    await prisma.users.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        updatedAt: new Date()
      }
    })

    // Marca o token como usado
    await prisma.reset_password_token.update({
      where: { id: resetToken.id },
      data: { used: true }
    })

    // Remove todas as sessões do usuário para forçar novo login
    await prisma.session.deleteMany({
      where: { userId: user.id }
    })

    return toActionState("SUCCESS", "Senha redefinida com sucesso")
  } catch (error) {
    console.error("Erro ao redefinir senha:", error)
    
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