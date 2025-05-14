// /features/roles/actions/upsert-role.ts
"use server"

import { ActionState, fromErrorToActionState, toActionState } from "@/components/form/utils/to-action-state"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { nanoid } from "nanoid"
import { getAuthOrRedirect } from "@/features/auth/queries/get-auth-or-rerdirect"
import { revalidatePath } from "next/cache"
import { rolesPath, rolePath } from "@/app/paths"
import { redirect } from "next/navigation"
import { logError, logInfo, logWarn } from "@/features/logs/queries/add-log"

// Schema para validação
const roleSchema = z.object({
  name: z.string().min(1, { message: "Nome é obrigatório" }),
  description: z.string().optional(),
  permissionIds: z.string().transform((val, ctx) => {
    try {
      return JSON.parse(val) as string[];
    } catch (e) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Formato inválido para permissionIds",
      });
      return [];
    }
  }),
})

export const upsertRole = async (
  roleId: string | undefined,
  _actionState: ActionState,
  formData: FormData
) => {
  const { user } = await getAuthOrRedirect()

  // Verificar se o usuário tem permissão para gerenciar roles
  const isAdmin = user.roles.some(role => role.name === "admin")
  const hasPermission = isAdmin || user.roles.some(role =>
    role.permissions.some((permission: { name: string }) =>
      permission.name === "roles.create" || permission.name === "roles.update"
    )
  )

  if (!hasPermission) {
    await logWarn("Role.upsert", `Acesso negado: usuário sem permissão tentou ${roleId ? 'atualizar' : 'criar'} função`, user.id, {
      roleId,
      isAdmin
    })
    return toActionState("ERROR", "Você não tem permissão para realizar esta ação")
  }

  try {
    // Preparar os dados do formulário
    const formDataObject = Object.fromEntries(formData.entries())

    // Validar os dados
    const data = roleSchema.parse(formDataObject)

    let newRoleId = roleId

    // Se é uma atualização, verificar se a role existe
    if (roleId) {
      const existingRole = await prisma.roles.findUnique({
        where: { id: roleId },
        include: {
          permissions: {
            select: { id: true }
          }
        }
      })

      if (!existingRole) {
        await logWarn("Role.update", `Tentativa de atualizar função inexistente #${roleId}`, user.id, {
          roleId
        })
        return toActionState("ERROR", "Função não encontrada")
      }

      // Para o log, preparamos as alterações significativas
      const changes: any = {}

      if (existingRole.name !== data.name) changes['name'] = { from: existingRole.name, to: data.name }
      if (existingRole.description !== data.description) changes['description'] = { from: existingRole.description, to: data.description }

      // Verificar alterações nas permissões
      const existingPermissionIds = existingRole.permissions.map(p => p.id)
      const addedPermissions = data.permissionIds.filter(id => !existingPermissionIds.includes(id))
      const removedPermissions = existingPermissionIds.filter(id => !data.permissionIds.includes(id))

      if (addedPermissions.length > 0 || removedPermissions.length > 0) {
        changes['permissions'] = {
          added: addedPermissions.length,
          removed: removedPermissions.length
        }
      }

      // Atualizar a role
      await prisma.roles.update({
        where: { id: roleId },
        data: {
          name: data.name,
          description: data.description || "",
          updatedAt: new Date(),
          permissions: {
            // Desconectar permissões removidas
            disconnect: removedPermissions.map(id => ({ id })),
            // Conectar novas permissões
            connect: addedPermissions.map(id => ({ id }))
          }
        }
      })

      await logInfo("Role.update", `Função #${roleId} atualizada: ${data.name}`, user.id, {
        roleId,
        roleName: data.name,
        changes
      })

    } else {
      // Criar nova role
      newRoleId = nanoid()

      await prisma.roles.create({
        data: {
          id: newRoleId,
          name: data.name,
          description: data.description || "",
          created_at: new Date(),
          updatedAt: new Date(),
          permissions: {
            connect: data.permissionIds.map(id => ({ id }))
          }
        }
      })

      await logInfo("Role.create", `Nova função criada: ${data.name}`, user.id, {
        roleId: newRoleId,
        roleName: data.name,
        permissionCount: data.permissionIds.length
      })
    }

    revalidatePath(rolesPath())
    if (newRoleId) {
      revalidatePath(rolePath(newRoleId))
    }

    // Redirecionar para a página de detalhes da role ou para a lista
    if (newRoleId) {
      redirect(rolePath(newRoleId))
    } else {
      redirect(rolesPath())
    }

  } catch (error) {
    await logError("Role.upsert", `Erro ao ${roleId ? 'atualizar' : 'criar'} função`, user.id, {
      roleId,
      error: String(error),
      formDataKeys: Array.from(formData.keys())
    })
    return fromErrorToActionState(error, formData)
  }

}