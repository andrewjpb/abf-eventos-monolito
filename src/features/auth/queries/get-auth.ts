"use server"

import { cookies } from "next/headers"
import { lucia } from "@/lib/lucia"
import { prisma } from "@/lib/prisma"

export const getAuth = async () => {
  console.log("[getAuth] Iniciando verificação de autenticação...")

  const cookieStore = await cookies()
  const sessionId = cookieStore.get(lucia.sessionCookieName)?.value ?? null

  console.log("[getAuth] Session ID encontrado:", sessionId ? "SIM (***" + sessionId.slice(-8) + ")" : "NÃO")

  if (!sessionId) {
    console.log("[getAuth] Sem session ID, retornando null")
    return {
      user: null,
      session: null
    }
  }

  let result;
  try {
    console.log("[getAuth] Validando sessão com Lucia...")
    result = await lucia.validateSession(sessionId)
    console.log("[getAuth] Resultado da validação:", result.session ? "VÁLIDA" : "INVÁLIDA", "| User ID:", result.user?.id || "null")
  } catch (error) {
    console.error("[getAuth] ERRO ao validar sessão:", error)
    console.error("[getAuth] Stack:", error instanceof Error ? error.stack : "N/A")
    return {
      user: null,
      session: null
    }
  }

  // Se a sessão for inválida, retorna sem usuário
  if (!result.session) {
    console.log("[getAuth] Sessão inválida, retornando null")
    return {
      user: null,
      session: null
    }
  }

  // Se o usuário existir, vamos enriquecer com os relacionamentos
  if (result.user) {
    console.log("[getAuth] Buscando dados completos do usuário:", result.user.id)

    let userWithRoles;
    try {
      userWithRoles = await prisma.users.findUnique({
        where: { id: result.user.id },
        include: {
          roles: true,
          company: true
        }
      })
      console.log("[getAuth] Dados do usuário encontrados:", userWithRoles ? "SIM" : "NÃO")
    } catch (dbError) {
      console.error("[getAuth] ERRO ao buscar usuário no banco:", dbError)
      return {
        user: null,
        session: null
      }
    }

    if (userWithRoles) {
      // Adicionar apenas os dados de roles, sem funções
      const roles = userWithRoles.roles || [];
      result.user.roles = roles;

      // Computar valores booleanos ao invés de funções
      const roleNames = roles.map(role => role.name);
      result.user.isAdmin = roleNames.includes('admin');

      // Adicionar dados da empresa
      if (userWithRoles.company) {
        result.user.company = userWithRoles.company;
      }

      // Adicionar URLs de imagem
      result.user.image_url = userWithRoles.image_url;
      result.user.thumb_url = userWithRoles.thumb_url;

      // Adicionar campo de email verificado
      result.user.email_verified = userWithRoles.email_verified;

      console.log("[getAuth] Usuário enriquecido com sucesso. Roles:", roles.map(r => r.name).join(", "))
    }
  }

  console.log("[getAuth] Retornando resultado final. User:", result.user?.id || "null")
  return result
}