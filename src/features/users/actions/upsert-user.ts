// /features/users/actions/upsert-user.ts
"use server"

import { ActionState, fromErrorToActionState, toActionState } from "@/components/form/utils/to-action-state"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { usersPath } from "@/app/paths"
import { nanoid } from "nanoid"
import { logError, logInfo, logWarn } from "@/features/logs/queries/add-log"
import { hash } from "bcryptjs"
import { getAuthWithPermission } from "@/features/auth/queries/get-auth-with-permission"
// Schema para validação usando Zod
const userSchema = z.object({
  name: z.string().min(1, { message: "Nome é obrigatório" }).max(191),
  username: z.string().min(1, { message: "Nome de usuário é obrigatório" }).max(191),
  email: z.string().email({ message: "Email inválido" }).min(1, { message: "Email é obrigatório" }),
  position: z.string().optional(),
  rg: z.string().min(1, { message: "RG é obrigatório" }),
  cpf: z.string().min(1, { message: "CPF é obrigatório" }),
  mobile_phone: z.string()
    .min(1, { message: "Telefone é obrigatório" })
    .refine((phone) => {
      // Remover formatação
      const cleanPhone = phone.replace(/\D/g, '')
      // Validar: deve ter 10 dígitos (DDD + 8 fixo) ou 11 dígitos (DDD + 9 celular)
      return cleanPhone.length === 10 || cleanPhone.length === 11
    }, { message: "Telefone deve ter DDD + 8 dígitos (fixo) ou DDD + 9 dígitos (celular)" }),
  cnpj: z.string().min(1, { message: "CNPJ da empresa é obrigatório" }),
  city: z.string().optional(),
  state: z.string().optional(),
  active: z.preprocess(
    (val) => val === "true" || val === true || val === "on",
    z.boolean()
  ),
  roleIds: z.array(z.string()).optional(),
})

export const upsertUser = async (
  userId: string | undefined,
  _actionState: ActionState,
  formData: FormData
) => {
  const { user, error } = await getAuthWithPermission("users.create")
  if (error) {
    return toActionState("ERROR", "Você não tem permissão para realizar esta ação")
  }

  // Verificar se o usuário é admin
  const isAdmin = await checkIfUserIsAdmin(user.id)

  if (!isAdmin) {
    await logWarn("User.upsert", `Acesso negado: usuário sem permissão de admin tentou ${userId ? 'atualizar' : 'criar'} usuário`, user.id, {
      targetUserId: userId,
      isAdmin
    })
    return toActionState("ERROR", "Sem permissão para realizar esta ação")
  }

  try {
    // 1. Converte FormData em objeto JS simples
    const raw = Object.fromEntries(formData.entries()) as Record<string, string>

    // 2. Parse do roleIds (string JSON) pra string[]
    let roleIds: string[] = []
    if (raw.roleIds) {
      try {
        roleIds = JSON.parse(raw.roleIds)
      } catch {
        roleIds = raw.roleIds.split(",").map(id => id.trim())
      }
    }

    // 3. Chama o Zod e extrai os campos validados
    const data = userSchema.parse({
      ...raw,
      active: raw.active,
      roleIds
    })

    // 4. Verificar se a empresa existe
    const company = await prisma.company.findUnique({
      where: { cnpj: data.cnpj }
    })

    if (!company) {
      return toActionState("ERROR", "Empresa não encontrada com o CNPJ informado")
    }

    // 5. Se estiver atualizando, verificar se o usuário existe
    let originalUser = null;
    if (userId) {
      originalUser = await prisma.users.findUnique({
        where: { id: userId },
        include: {
          roles: true
        }
      });

      if (!originalUser) {
        return toActionState("ERROR", "Usuário não encontrado")
      }
    }

    // 6. Verificar se username, email, cpf, rg e mobile_phone são únicos
    const existingUser = await prisma.users.findFirst({
      where: {
        OR: [
          { username: data.username },
          { email: data.email },
          { cpf: data.cpf },
          { rg: data.rg },
          { mobile_phone: data.mobile_phone }
        ],
        NOT: userId ? { id: userId } : undefined
      }
    });

    if (existingUser) {
      let errorMessage = "Já existe um usuário com ";
      if (existingUser.username === data.username) errorMessage += "este nome de usuário";
      else if (existingUser.email === data.email) errorMessage += "este email";
      else if (existingUser.cpf === data.cpf) errorMessage += "este CPF";
      else if (existingUser.rg === data.rg) errorMessage += "este RG";
      else if (existingUser.mobile_phone === data.mobile_phone) errorMessage += "este número de telefone";

      return toActionState("ERROR", errorMessage);
    }

    // 7. Lógica de upsert usando `data`
    const id = userId ?? nanoid()

    // Gerar senha padrão apenas para novos usuários
    let password = undefined;
    if (!userId) {
      // Geramos uma senha aleatória temporária
      const tempPassword = generateRandomPassword();
      password = await hash(tempPassword, 10);
      // Aqui poderia enviar um email com a senha temporária
    }

    await prisma.$transaction(async tx => {
      // MODIFICAÇÃO AQUI: Separar a lógica entre criar e atualizar
      if (userId) {
        // ATUALIZAR usuário existente
        await tx.users.update({
          where: { id },
          data: {
            name: data.name,
            username: data.username,
            email: data.email,
            active: data.active,
            rg: data.rg,
            cpf: data.cpf,
            cnpj: data.cnpj,
            mobile_phone: data.mobile_phone,
            position: data.position || "",
            city: data.city || "",
            state: data.state || "",
            updatedAt: new Date(),
          }
        });
      } else {
        // CRIAR novo usuário
        await tx.users.create({
          data: {
            id,
            name: data.name,
            username: data.username,
            email: data.email,
            password: password as string, // senha temporária para novos usuários
            active: data.active,
            rg: data.rg,
            cpf: data.cpf,
            cnpj: data.cnpj,
            mobile_phone: data.mobile_phone,
            position: data.position || "",
            city: data.city || "",
            state: data.state || "",
            image_url: "",
            thumb_url: "",
            image_path: "",
            thumb_path: "",
            created_at: new Date(),
            updatedAt: new Date(),
          }
        });
      }

      // Atualizar relações com roles
      if (userId) {
        // Remover todas as roles existentes (usando SQL bruto para tabela muitos-para-muitos)
        await tx.$executeRaw`DELETE FROM "_RoleToUser" WHERE "B" = ${id}`
      }

      // Adicionar as novas roles
      for (const roleId of data.roleIds || []) {
        await tx.$executeRaw`INSERT INTO "_RoleToUser" ("A", "B") VALUES (${roleId}, ${id})`
      }
    })

    // Para o log, preparamos as alterações significativas
    if (userId && originalUser) {
      const changes: any = {}
      if (originalUser.name !== data.name) changes['name'] = { from: originalUser.name, to: data.name }
      if (originalUser.email !== data.email) changes['email'] = { from: originalUser.email, to: data.email }
      if (originalUser.username !== data.username) changes['username'] = { from: originalUser.username, to: data.username }
      if (originalUser.position !== data.position) changes['position'] = { from: originalUser.position, to: data.position }
      if (originalUser.active !== data.active) changes['active'] = { from: originalUser.active, to: data.active }
      if (originalUser.city !== data.city) changes['city'] = { from: originalUser.city, to: data.city }
      if (originalUser.state !== data.state) changes['state'] = { from: originalUser.state, to: data.state }

      // Mudanças em roles
      const originalRoleIds = originalUser.roles.map(role => role.id)
      const addedRoles = data.roleIds?.filter(id => !originalRoleIds.includes(id)) || []
      const removedRoles = originalRoleIds.filter(id => !data.roleIds?.includes(id))

      if (addedRoles.length > 0 || removedRoles.length > 0) {
        changes['roles'] = {
          added: addedRoles.length,
          removed: removedRoles.length,
          addedIds: addedRoles,
          removedIds: removedRoles
        }
      }

      const isUserAdmin = await checkIfUserIsAdmin(userId)

      await logInfo("User.update", `Usuário #${userId} atualizado: ${data.name}`, user.id, {
        targetUserId: userId,
        targetUserEmail: data.email,
        changes,
        isAdmin: isUserAdmin,
        isActive: data.active
      })
    } else {
      // Log para criação de usuário
      await logInfo("User.create", `Novo usuário criado: ${data.name}`, user.id, {
        newUserId: id,
        name: data.name,
        email: data.email,
        username: data.username,
        isActive: data.active,
        rolesCount: data.roleIds?.length || 0,
        roleIds: data.roleIds
      })
    }

    revalidatePath(usersPath())
    return toActionState(
      "SUCCESS",
      userId ? "Usuário atualizado com sucesso" : "Usuário criado com sucesso"
    )
  } catch (error) {
    await logError("User.upsert", `Erro ao ${userId ? 'atualizar' : 'criar'} usuário`, user.id, {
      targetUserId: userId,
      error: String(error),
      formDataKeys: Array.from(formData.keys())
    })

    return fromErrorToActionState(error, formData)
  }
}

// Função para gerar senha aleatória
function generateRandomPassword(length = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Função auxiliar para verificar se um usuário é admin
async function checkIfUserIsAdmin(userId: string): Promise<boolean> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          permissions: true
        }
      }
    }
  })

  if (!user) return false

  return user.roles.some(role =>
    role.name.toLowerCase().includes('admin') ||
    role.permissions.some(perm => perm.name.toLowerCase().includes('admin'))
  )
}