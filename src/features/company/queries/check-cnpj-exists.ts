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
    // Primeiro, tenta buscar com CNPJ limpo (sem formatação)
    let company = await prisma.company.findUnique({
      where: {
        cnpj: cleanCnpj
      },
      select: {
        id: true,
        name: true,
        cnpj: true,
        segment: true,
        active: true
      }
    })
    
    // Se não encontrar, tenta buscar com CNPJ formatado (fallback)
    if (!company) {
      const formattedCnpj = cleanCnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
      
      company = await prisma.company.findUnique({
        where: {
          cnpj: formattedCnpj
        },
        select: {
          id: true,
          name: true,
          cnpj: true,
          segment: true,
          active: true
        }
      })
    }
    
    return company
  } catch (error) {
    console.error('Erro ao verificar CNPJ:', error)
    return null
  }
}