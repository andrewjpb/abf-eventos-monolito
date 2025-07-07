"use server"

import { z } from "zod"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { toActionState, ActionState } from "@/components/form/utils/to-action-state"

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token inválido"),
  otp: z.string().length(6, "Código deve ter 6 dígitos"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirm_password: z.string().min(6, "Confirmação de senha é obrigatória")
}).refine((data) => data.password === data.confirm_password, {
  message: "Senhas não coincidem",
  path: ["confirm_password"]
})

export async function resetPassword(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const data = {
      token: formData.get("token") as string,
      otp: formData.get("otp") as string,
      password: formData.get("password") as string,
      confirm_password: formData.get("confirm_password") as string
    }

    const validatedData = resetPasswordSchema.parse(data)

    // Busca o token de reset
    const resetToken = await prisma.reset_password_token.findUnique({
      where: { token: validatedData.token },
      include: { users: true }
    })

    if (!resetToken) {
      return toActionState("ERROR", "Token inválido ou expirado")
    }

    // Verifica se o token não expirou
    if (resetToken.expiresAt < new Date()) {
      // Remove token expirado
      await prisma.reset_password_token.delete({
        where: { id: resetToken.id }
      })
      return toActionState("ERROR", "Token expirado. Solicite um novo código.")
    }

    // Verifica se o OTP está correto
    if (resetToken.otp !== validatedData.otp) {
      return {
        status: "ERROR",
        message: "Código de verificação inválido",
        fieldErrors: { otp: ["Código inválido"] },
        timestamp: Date.now()
      }
    }

    // Hash da nova senha
    const hashedPassword = await hash(validatedData.password, 10)

    // Atualiza a senha do usuário
    await prisma.users.update({
      where: { id: resetToken.userId },
      data: {
        password: hashedPassword,
        updatedAt: new Date()
      }
    })

    // Remove o token usado
    await prisma.reset_password_token.delete({
      where: { id: resetToken.id }
    })

    // Remove todas as sessões do usuário para forçar novo login
    await prisma.session.deleteMany({
      where: { userId: resetToken.userId }
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