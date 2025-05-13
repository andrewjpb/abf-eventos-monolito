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
  // Array de IDs de permissões
  permissions: z.array(z.string()).optional(),
})

export const upsertRole = async (
  roleId: string | undefined,
  _actionState: ActionState,
  formData: FormData
) => {
  const { user } = await getAuthOrRedirect()

  // Verificar se o usuário é admin
  const isAdmin = user.roles.some(role => role.name === "admin")
  if (!isAdmin) {
    await logWarn("Role.upsert", `Acesso negado: usuário não-admin tentou ${roleId ? 'atualizar' : 'criar'} role`, user.id, {
      roleId,
      isAdmin
    })
    return toActionState("ERROR", "Você não tem permissão para realizar esta ação")
  }

  try {
    // Preparar os dados do formulário
    const formDataObject: any = Object.fromEntries(formData.entries())

    // Processar permissões - podem vir como array ou como valores separados com o mesmo nome
    const permissionEntries = Array.from(formData.entries())
      .filter(([key]) => key.startsWith('permissions'))
      .map(([_, value]) => value as string);

    formDataObject.permissions = permissionEntries;

    // Validar os dados da role
    const data = roleSchema.parse(formDataObject)

    // Se é uma atualização, verificar se a role existe
    if (roleId) {
      const existingRole = await prisma.roles.findUnique({
        where: { id: roleId },
        include: {
          permissions: true
        }
      })

      if (!existingRole) {
        await logWarn("Role.update", `Tentativa de atualizar role inexistente #${roleId}`, user.id, {
          roleId
        })
        return toActionState("ERROR", "Role não encontrada")
      }

      // Verificar se o nome já existe (exceto para a própria role)
      const duplicateName = await prisma.roles.findFirst({
        where: {
          name: data.name,
          id: { not: roleId }
        }
      })

      if (duplicateName) {
        return toActionState("ERROR", "Já existe uma role com este nome")
      }

      // Para o log, preparamos as alterações significativas
      const changes: any = {}

      if (existingRole.name !== data.name) changes['name'] = { from: existingRole.name, to: data.name }
      if (existingRole.description !== data.description) changes['description'] = { from: existingRole.description, to: data.description }

      // Atualizar a role
      await prisma.roles.update({
        where: { id: roleId },
        data: {
          name: data.name,
          description: data.description || "",
          updatedAt: new Date(),
          // Desconectar todas as permissões existentes e conectar as novas
          permissions: {
            disconnect: existingRole.permissions.map(p => ({ id: p.id })),
            connect: data.permissions?.map(id => ({ id })) || []
          }
        }
      })

      // Registrar mudanças nas permissões
      if (data.permissions) {
        const oldPermissions = existingRole.permissions.map(p => p.id)
        const newPermissions = data.permissions

        // Encontrar permissões adicionadas e removidas
        const added = newPermissions.filter(p => !oldPermissions.includes(p))
        const removed = oldPermissions.filter(p => !newPermissions.includes(p))

        if (added.length > 0 || removed.length > 0) {
          changes['permissions'] = {
            added: added.length > 0 ? added : undefined,
            removed: removed.length > 0 ? removed : undefined,
            oldCount: oldPermissions.length,
            newCount: newPermissions.length
          }
        }
      }

      await logInfo("Role.update", `Role #${roleId} atualizada: ${data.name}`, user.id, {
        roleId,
        roleName: data.name,
        changes
      })

    } else {
      // Verificar se o nome já existe
      const duplicateName = await prisma.roles.findFirst({
        where: {
          name: data.name
        }
      })

      if (duplicateName) {
        return toActionState("ERROR", "Já existe uma role com este nome")
      }

      // Criar nova role
      const newRoleId = nanoid()

      await prisma.roles.create({
        data: {
          id: newRoleId,
          name: data.name,
          description: data.description || "",
          created_at: new Date(),
          updatedAt: new Date(),
          // Conectar permissões
          permissions: {
            connect: data.permissions?.map(id => ({ id })) || []
          }
        }
      })

      await logInfo("Role.create", `Nova role criada: ${data.name}`, user.id, {
        roleId: newRoleId,
        roleName: data.name,
        description: data.description,
        permissionsCount: data.permissions?.length || 0
      })

      // Atualizar o ID da role para o redirecionamento
      roleId = newRoleId
    }

    revalidatePath(rolesPath())
    if (roleId) {
      revalidatePath(rolePath(roleId))
    }

    if (roleId) {
      redirect(rolePath(roleId))
    }

    return toActionState("SUCCESS", "Role salva com sucesso")

  } catch (error) {
    await logError("Role.upsert", `Erro ao ${roleId ? 'atualizar' : 'criar'} role`, user.id, {
      roleId,
      error: String(error),
      formDataKeys: Array.from(formData.keys())
    })
    return fromErrorToActionState(error, formData)
  }
}