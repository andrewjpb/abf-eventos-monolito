// /features/companies/actions/upsert-company.ts
"use server"

import { ActionState, fromErrorToActionState, toActionState } from "@/components/form/utils/to-action-state"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { nanoid } from "nanoid"
import { revalidatePath } from "next/cache"
import { companiesPath, companyPath } from "@/app/paths"
import { redirect } from "next/navigation"
import { logError, logInfo, logWarn } from "@/features/logs/queries/add-log"
import { getAuthWithPermission } from "@/features/auth/queries/get-auth-with-permission"

// Função auxiliar para formatar CNPJ (remover caracteres não numéricos)
const formatCnpj = (cnpj: string) => {
  return cnpj.replace(/[^\d]/g, "");
}

// Schema para validação
const companySchema = z.object({
  name: z.string().min(1, { message: "Nome da empresa é obrigatório" }),
  cnpj: z.string().min(14, { message: "CNPJ deve ter no mínimo 14 dígitos" })
    .max(18, { message: "CNPJ deve ter no máximo 18 caracteres" })
    .transform(formatCnpj)
    .refine((cnpj) => cnpj.length === 14, { message: "CNPJ deve ter 14 dígitos após formatação" }),
  segment: z.string().min(1, { message: "Segmento é obrigatório" }),
  active: z.enum(["true", "false"]).transform(value => value === "true"),
})

export const upsertCompany = async (
  companyId: string | undefined,
  _actionState: ActionState,
  formData: FormData
) => {
  const { user, error } = await getAuthWithPermission("companies.create")

  if (error) {
    return toActionState("ERROR", "Você não tem permissão para realizar esta ação")
  }

  // Verificar se o usuário tem permissão para gerenciar empresas
  const isAdmin = user.roles.some(role => role.name === "admin")
  const hasPermission = isAdmin || user.roles.some(role =>
    role.permissions.some((permission: { name: string }) =>
      permission.name === "companies.create" || permission.name === "companies.update"
    )
  )

  if (!hasPermission) {
    await logWarn("Company.upsert", `Acesso negado: usuário sem permissão tentou ${companyId ? 'atualizar' : 'criar'} empresa`, user.id, {
      companyId,
      isAdmin
    })
    return toActionState("ERROR", "Você não tem permissão para realizar esta ação")
  }

  try {
    // Preparar os dados do formulário
    const formDataObject = Object.fromEntries(formData.entries())

    // Validar os dados
    const data = companySchema.parse(formDataObject)

    // Verificar se já existe uma empresa com o mesmo CNPJ (exceto no caso de atualização da mesma empresa)
    const existingCompanyWithCnpj = await prisma.company.findUnique({
      where: { cnpj: data.cnpj }
    })

    if (existingCompanyWithCnpj && (!companyId || existingCompanyWithCnpj.id !== companyId)) {
      await logWarn("Company.upsert", `Tentativa de criar/atualizar empresa com CNPJ já existente`, user.id, {
        companyId,
        cnpj: data.cnpj,
        existingCompanyId: existingCompanyWithCnpj.id
      })
      return toActionState("ERROR", "Já existe uma empresa cadastrada com este CNPJ")
    }

    let newCompanyId = companyId

    // Se é uma atualização, verificar se a empresa existe
    if (companyId) {
      const existingCompany = await prisma.company.findUnique({
        where: { id: companyId }
      })

      if (!existingCompany) {
        await logWarn("Company.update", `Tentativa de atualizar empresa inexistente #${companyId}`, user.id, {
          companyId
        })
        return toActionState("ERROR", "Empresa não encontrada")
      }

      // Para o log, preparamos as alterações significativas
      const changes: any = {}

      if (existingCompany.name !== data.name) changes['name'] = { from: existingCompany.name, to: data.name }
      if (existingCompany.cnpj !== data.cnpj) changes['cnpj'] = { from: existingCompany.cnpj, to: data.cnpj }
      if (existingCompany.segment !== data.segment) changes['segment'] = { from: existingCompany.segment, to: data.segment }
      if (existingCompany.active !== data.active) changes['active'] = { from: existingCompany.active, to: data.active }

      // Atualizar a empresa
      await prisma.company.update({
        where: { id: companyId },
        data: {
          name: data.name,
          cnpj: data.cnpj,
          segment: data.segment,
          active: data.active,
          updatedAt: new Date()
        }
      })

      await logInfo("Company.update", `Empresa #${companyId} atualizada: ${data.name}`, user.id, {
        companyId,
        companyName: data.name,
        changes
      })

    } else {
      // Criar nova empresa
      newCompanyId = nanoid()

      await prisma.company.create({
        data: {
          id: newCompanyId,
          name: data.name,
          cnpj: data.cnpj,
          segment: data.segment,
          active: data.active,
          created_at: new Date(),
          updatedAt: new Date()
        }
      })

      await logInfo("Company.create", `Nova empresa criada: ${data.name}`, user.id, {
        companyId: newCompanyId,
        companyName: data.name,
        cnpj: data.cnpj,
        segment: data.segment
      })
    }

    revalidatePath(companiesPath())
    if (newCompanyId) {
      revalidatePath(companyPath(newCompanyId))
    }

    // Redirecionar para a página de detalhes da empresa ou para a lista
    if (newCompanyId) {
      redirect(companyPath(newCompanyId))
    } else {
      redirect(companiesPath())
    }

  } catch (error) {
    await logError("Company.upsert", `Erro ao ${companyId ? 'atualizar' : 'criar'} empresa`, user.id, {
      companyId,
      error: String(error),
      formDataKeys: Array.from(formData.keys())
    })
    return fromErrorToActionState(error, formData)
  }
}