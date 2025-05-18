// /features/companies/actions/delete-company.ts
"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { setCoookieByKey } from "@/actions/cookies"
import { getAuthWithPermission } from "@/features/auth/queries/get-auth-with-permission"
import { companiesPath } from "@/app/paths"
import { toActionState } from "@/components/form/utils/to-action-state"
import { redirect } from "next/navigation"
import { logError, logInfo, logWarn } from "@/features/logs/queries/add-log"

export const deleteCompany = async (id: string) => {
  const { user, error } = await getAuthWithPermission("companies.delete")

  if (error) {
    return toActionState("ERROR", "Você não tem permissão para realizar esta ação")
  }

  try {
    // Verificar se a empresa existe
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        users: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // Se não existe ou o usuário não tem permissão
    if (!company) {
      await logWarn("Company.delete", `Tentativa de excluir empresa inexistente #${id}`, user.id, {
        companyId: id
      })
      return toActionState("ERROR", "Empresa não encontrada")
    }

    // Verificar se o usuário tem permissão
    const isAdmin = user.roles.some(role => role.name === "admin")
    const hasPermission = isAdmin || user.roles.some(role =>
      role.permissions.some((permission: { name: string }) =>
        permission.name === "companies.delete"
      )
    )

    if (!hasPermission) {
      await logWarn("Company.delete", `Acesso negado: usuário sem permissão tentou excluir empresa`, user.id, {
        companyId: id,
        companyName: company.name,
        isAdmin
      })
      return toActionState("ERROR", "Você não tem permissão para excluir esta empresa")
    }

    // Verificar se a empresa está associada a algum usuário
    if (company.users.length > 0) {
      await logWarn("Company.delete", `Tentativa de excluir empresa associada a usuários`, user.id, {
        companyId: id,
        companyName: company.name,
        userCount: company.users.length,
        users: company.users.map(u => ({ id: u.id, name: u.name, email: u.email }))
      })
      return toActionState("ERROR", "Esta empresa possui usuários associados e não pode ser excluída")
    }

    // Verificar se a empresa está associada a alguma attendance_list
    const attendanceCount = await prisma.attendance_list.count({
      where: {
        company_cnpj: company.cnpj
      }
    })

    if (attendanceCount > 0) {
      await logWarn("Company.delete", `Tentativa de excluir empresa com listas de presença associadas`, user.id, {
        companyId: id,
        companyName: company.name,
        attendanceCount
      })
      return toActionState("ERROR", "Esta empresa possui histórico de participação em eventos e não pode ser excluída")
    }

    // Excluir a empresa
    await prisma.company.delete({
      where: { id }
    })

    await logInfo("Company.delete", `Empresa #${id} (${company.name}) excluída com sucesso`, user.id, {
      companyId: id,
      companyName: company.name,
      companyCnpj: company.cnpj
    })

    revalidatePath(companiesPath())
    setCoookieByKey("revalidate", "true")
    setCoookieByKey("toast", "Empresa excluída com sucesso")
    return redirect(companiesPath())
  } catch (error) {
    await logError("Company.delete", `Erro ao excluir empresa #${id}`, user.id, {
      companyId: id,
      error: String(error)
    })
    console.error("Erro ao excluir empresa:", error)
    return toActionState("ERROR", "Ocorreu um erro ao excluir a empresa")
  }
}