// /features/companies/actions/toggle-company-status.ts
"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { companiesPath, companyPath } from "@/app/paths"
import { toActionState } from "@/components/form/utils/to-action-state"
import { logError, logInfo, logWarn } from "@/features/logs/queries/add-log"
import { getAuthWithPermission } from "@/features/auth/queries/get-auth-with-permission"
export const toggleCompanyStatus = async (id: string) => {
  const { user, error } = await getAuthWithPermission("companies.update")

  if (error) {
    return toActionState("ERROR", "Você não tem permissão para realizar esta ação")
  }

  try {
    // Verificar se o usuário tem permissão para atualizar empresas
    const isAdmin = user.roles.some(role => role.name === "admin")
    const hasPermission = isAdmin || user.roles.some(role =>
      role.permissions.some((permission: { name: string }) =>
        permission.name === "companies.update"
      )
    )

    if (!hasPermission) {
      await logWarn("Company.toggleStatus", `Acesso negado: usuário sem permissão tentou alterar status da empresa`, user.id, {
        companyId: id,
        isAdmin
      })
      return toActionState("ERROR", "Você não tem permissão para alterar o status desta empresa")
    }

    // Buscar a empresa atual
    const company = await prisma.company.findUnique({
      where: { id }
    })

    if (!company) {
      await logWarn("Company.toggleStatus", `Tentativa de alterar status de empresa inexistente #${id}`, user.id, {
        companyId: id
      })
      return toActionState("ERROR", "Empresa não encontrada")
    }

    // Inverter o status
    const newStatus = !company.active

    // Atualizar o status
    await prisma.company.update({
      where: { id },
      data: {
        active: newStatus,
        updatedAt: new Date()
      }
    })

    await logInfo("Company.toggleStatus", `Status da empresa #${id} alterado para ${newStatus ? 'Ativo' : 'Inativo'}`, user.id, {
      companyId: id,
      companyName: company.name,
      oldStatus: company.active,
      newStatus
    })

    // Revalidar caminhos
    revalidatePath(companiesPath())
    revalidatePath(companyPath(id))

    return toActionState("SUCCESS", `Empresa ${newStatus ? 'ativada' : 'desativada'} com sucesso`)
  } catch (error) {
    await logError("Company.toggleStatus", `Erro ao alterar status da empresa #${id}`, user.id, {
      companyId: id,
      error: String(error)
    })
    return toActionState("ERROR", "Ocorreu um erro ao alterar o status da empresa")
  }
}