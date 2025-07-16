"use server"

import { prisma } from "@/lib/prisma"
import { cache } from "react"

/**
 * Verifica se uma empresa é associada (ativa) na ABF
 * @param cnpj CNPJ da empresa
 * @returns true se a empresa está ativa/associada, false caso contrário
 */
export const isCompanyMember = cache(async (cnpj: string): Promise<boolean> => {
  try {
    const company = await prisma.company.findUnique({
      where: { cnpj },
      select: { active: true }
    })

    return company?.active === true
  } catch (error) {
    console.error("Erro ao verificar status de associação da empresa:", error)
    return false
  }
})

/**
 * Verifica se uma empresa é associada e retorna suas informações
 * @param cnpj CNPJ da empresa
 * @returns Dados da empresa se ativa, null caso contrário
 */
export const getCompanyMembershipStatus = cache(async (cnpj: string) => {
  try {
    const company = await prisma.company.findUnique({
      where: { cnpj },
      select: { 
        id: true,
        name: true,
        active: true,
        segment: true,
        created_at: true
      }
    })

    return {
      isActive: company?.active === true,
      company: company || null
    }
  } catch (error) {
    console.error("Erro ao verificar status de associação da empresa:", error)
    return {
      isActive: false,
      company: null
    }
  }
})