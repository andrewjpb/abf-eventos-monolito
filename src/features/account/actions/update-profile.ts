"use server"

import { ActionState, fromErrorToActionState, toActionState } from "@/components/form/utils/to-action-state"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { accountProfilePath } from "@/app/paths"
import { getAuthOrRedirect } from "@/features/auth/queries/get-auth-or-rerdirect"
import { logInfo, logError } from "@/features/logs/queries/add-log"

// Schema para validação do perfil (apenas campos editáveis)
const profileSchema = z.object({
  name: z.string().min(1, { message: "Nome é obrigatório" }).max(191),
  position: z.string(),
  mobile_phone: z.string(),
  city: z.string(),
  state: z.string(),
})

export const updateProfile = async (
  _actionState: ActionState,
  formData: FormData
) => {
  try {
    const { user } = await getAuthOrRedirect()
    
    // Extrair e validar dados do formulário (apenas campos editáveis)
    const data = {
      name: formData.get("name") as string,
      position: (formData.get("position") as string) || "",
      mobile_phone: (formData.get("mobile_phone") as string) || "",
      city: (formData.get("city") as string) || "",
      state: (formData.get("state") as string) || "",
    }
    
    const validatedData = profileSchema.parse(data)
    
    // Preparar dados para atualização (todos os campos sempre são atualizados)
    const updateData = {
      name: validatedData.name,
      position: validatedData.position || null,
      mobile_phone: validatedData.mobile_phone || null,
      city: validatedData.city || null,
      state: validatedData.state || null,
      updatedAt: new Date()
    }
    
    await prisma.users.update({
      where: { id: user.id },
      data: updateData
    })
    
    await logInfo("Profile.update", `Usuário atualizou seu próprio perfil`, user.id)
    
    revalidatePath(accountProfilePath())
    
    return toActionState("SUCCESS", "Perfil atualizado com sucesso!")
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fromErrorToActionState(error)
    }
    
    await logError("Profile.update", `Erro ao atualizar perfil: ${error}`, undefined, { error })
    
    return toActionState("ERROR", "Erro ao atualizar perfil")
  }
}