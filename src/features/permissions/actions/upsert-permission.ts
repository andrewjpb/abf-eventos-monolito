// /features/permissions/actions/upsert-permission.ts
"use server"

import { ActionState, fromErrorToActionState, toActionState } from "@/components/form/utils/to-action-state"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { nanoid } from "nanoid"
import { getAuthOrRedirect } from "@/features/auth/queries/get-auth-or-rerdirect"
import { revalidatePath } from "next/cache"
import { permissionsPath, permissionPath } from "@/app/paths"
import { redirect } from "next/navigation"
import { logError, logInfo, logWarn } from "@/features/logs/queries/add-log"

// Schema para validação
const permissionSchema = z.object({
  name: z.string().min(1, { message: "Nome é obrigatório" })
    .regex(/^[a-zA-Z0-9._]+$/, { message: "Nome deve conter apenas letras, números, pontos e underscores" }),
  description: z.string().min(1, { message: "Descrição é obrigatória" }),
})

export const upsertPermission = async (
  permissionId: string | undefined,
  _actionState: ActionState,
  formData: FormData
) => {
  const { user } = await getAuthOrRedirect()

  // Verificar se o usuário é admin
  const isAdmin = user.roles.some(role => role.name === "admin")
  if (!isAdmin) {
    await logWarn("Permission.upsert", `Acesso negado: usuário não-admin tentou ${permissionId ? 'atualizar' : 'criar'} permissão`, user.id, {
      permissionId,
      isAdmin
    })
    return toActionState("ERROR", "Você não tem permissão para realizar esta ação")
  }

  try {
    // Preparar os dados do formulário
    const formDataObject: any = Object.fromEntries(formData.entries())

    // Validar os dados da permissão
    const data = permissionSchema.parse(formDataObject)

    // Se é uma atualização, verificar se a permissão existe
    if (permissionId) {
      const existingPermission = await prisma.permissions.findUnique({
        where: { id: permissionId }
      })

      if (!existingPermission) {
        await logWarn("Permission.update", `Tentativa de atualizar permissão inexistente #${permissionId}`, user.id, {
          permissionId
        })
        return toActionState("ERROR", "Permissão não encontrada")
      }

      // Verificar se o nome já existe (exceto para a própria permissão)
      const duplicateName = await prisma.permissions.findFirst({
        where: {
          name: data.name,
          id: { not: permissionId }
        }
      })

      if (duplicateName) {
        return toActionState("ERROR", "Já existe uma permissão com este nome")
      }

      // Para o log, preparamos as alterações significativas
      const changes: any = {}

      if (existingPermission.name !== data.name) changes['name'] = { from: existingPermission.name, to: data.name }
      if (existingPermission.description !== data.description) changes['description'] = { from: existingPermission.description, to: data.description }

      // Atualizar a permissão
      await prisma.permissions.update({
        where: { id: permissionId },
        data: {
          name: data.name,
          description: data.description,
          updatedAt: new Date()
        }
      })

      await logInfo("Permission.update", `Permissão #${permissionId} atualizada: ${data.name}`, user.id, {
        permissionId,
        permissionName: data.name,
        changes
      })

    } else {
      // Verificar se o nome já existe
      const duplicateName = await prisma.permissions.findFirst({
        where: {
          name: data.name
        }
      })

      if (duplicateName) {
        return toActionState("ERROR", "Já existe uma permissão com este nome")
      }

      // Criar nova permissão
      const newPermissionId = nanoid()

      await prisma.permissions.create({
        data: {
          id: newPermissionId,
          name: data.name,
          description: data.description,
          created_at: new Date(),
          updatedAt: new Date()
        }
      })

      await logInfo("Permission.create", `Nova permissão criada: ${data.name}`, user.id, {
        permissionId: newPermissionId,
        permissionName: data.name,
        description: data.description
      })

      // Atualizar o ID da permissão para o redirecionamento
      permissionId = newPermissionId
    }

    revalidatePath(permissionsPath())
    if (permissionId) {
      revalidatePath(permissionPath(permissionId))
    }

    if (permissionId) {
      redirect(permissionPath(permissionId))
    }

    return toActionState("SUCCESS", "Permissão salva com sucesso")

  } catch (error) {
    await logError("Permission.upsert", `Erro ao ${permissionId ? 'atualizar' : 'criar'} permissão`, user.id, {
      permissionId,
      error: String(error),
      formDataKeys: Array.from(formData.keys())
    })
    return fromErrorToActionState(error, formData)
  }
}