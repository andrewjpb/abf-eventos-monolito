// /features/companies/queries/get-company.ts
"use server"

import { cache } from "react"
import { prisma } from "@/lib/prisma"
import { getAuth } from "@/features/auth/queries/get-auth"
import { CompanyWithRelations } from "../types"

export const getCompany = cache(async (id: string) => {
  const { user } = await getAuth()

  // Verificar se o usuário está autenticado
  if (!user) {
    return null
  }

  const company = await prisma.company.findUnique({
    where: {
      id
    },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          position: true
        }
      }
    }
  })

  if (!company) {
    return null
  }

  return company as CompanyWithRelations
})