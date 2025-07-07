"use server"

import { ActionState, fromErrorToActionState, toActionState } from "@/components/form/utils/to-action-state"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { accountPasswordPath } from "@/app/paths"
import { getAuthOrRedirect } from "@/features/auth/queries/get-auth-or-rerdirect"
import { logInfo, logError } from "@/features/logs/queries/add-log"
import bcrypt from "bcryptjs"

const passwordSchema = z.object({
  current_password: z.string().min(1, { message: "Senha atual é obrigatória" }),
  new_password: z.string().min(6, { message: "Nova senha deve ter pelo menos 6 caracteres" }),
  confirm_password: z.string().min(1, { message: "Confirmação de senha é obrigatória" }),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "As senhas não coincidem",
  path: ["confirm_password"],
})

export const changePassword = async (
  _actionState: ActionState,
  formData: FormData
) => {
  try {
    const { user } = await getAuthOrRedirect()
    
    const data = {
      current_password: formData.get("current_password") as string,
      new_password: formData.get("new_password") as string,
      confirm_password: formData.get("confirm_password") as string,
    }
    
    const validatedData = passwordSchema.parse(data)
    
    // Buscar o usuário com a senha atual
    const userWithPassword = await prisma.users.findUnique({
      where: { id: user.id },
      select: { password: true }
    })
    
    if (!userWithPassword || !userWithPassword.password) {
      return toActionState("ERROR", "Usuário não encontrado")
    }
    
    // Verificar se a senha atual está correta
    const isCurrentPasswordValid = await bcrypt.compare(
      validatedData.current_password,
      userWithPassword.password
    )
    
    if (!isCurrentPasswordValid) {
      return toActionState("ERROR", "Senha atual incorreta")
    }
    
    // Hash da nova senha
    const hashedNewPassword = await bcrypt.hash(validatedData.new_password, 12)
    
    // Atualizar a senha no banco
    await prisma.users.update({
      where: { id: user.id },
      data: { 
        password: hashedNewPassword,
        updatedAt: new Date()
      }
    })
    
    await logInfo("Password.change", `Usuário alterou sua senha`, user.id)
    
    revalidatePath(accountPasswordPath())
    
    return toActionState("SUCCESS", "Senha alterada com sucesso!")
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fromErrorToActionState(error)
    }
    
    await logError("Password.change", `Erro ao alterar senha: ${error}`, undefined, { error })
    
    return toActionState("ERROR", "Erro ao alterar senha")
  }
}