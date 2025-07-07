"use server"

import { prisma } from "@/lib/prisma"

export async function checkCnpjExists(cnpj: string) {
  if (!cnpj || cnpj.trim() === '') {
    return null
  }
  
  // Remover formatação do CNPJ (manter apenas números)
  const cleanCnpj = cnpj.replace(/\D/g, '')
  
  if (cleanCnpj.length !== 14) {
    return null
  }
  
  try {
    const company = await prisma.company.findUnique({
      where: {
        cnpj: cleanCnpj
      },
      select: {
        id: true,
        name: true,
        cnpj: true,
        segment: true
      }
    })
    
    return company
  } catch (error) {
    console.error('Erro ao verificar CNPJ:', error)
    return null
  }
}