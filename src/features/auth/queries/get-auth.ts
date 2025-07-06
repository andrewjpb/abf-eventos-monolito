"use server"

import { cookies } from "next/headers"
import { lucia } from "@/lib/lucia"
import { prisma } from "@/lib/prisma"

export const getAuth = async () => {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(lucia.sessionCookieName)?.value ?? null

  if (!sessionId) {
    return {
      user: null,
      session: null
    }
  }

  const result = await lucia.validateSession(sessionId)

  // Se o usuário existir, vamos enriquecer com os relacionamentos
  if (result.user) {
    // Buscar todas as roles e empresa do usuário
    const userWithRoles = await prisma.users.findUnique({
      where: { id: result.user.id },
      include: {
        roles: true,  // Incluir todas as roles
        company: true // Incluir dados da empresa
      }
    })

    if (userWithRoles) {
      // Adicionar apenas os dados de roles, sem funções
      const roles = userWithRoles.roles || [];
      result.user.roles = roles;

      // Computar valores booleanos ao invés de funções
      const roleNames = roles.map(role => role.name);
      // Corrigido: não usamos o operador de acesso opcional no lado esquerdo
      result.user.isAdmin = roleNames.includes('admin');
      
      // Adicionar dados da empresa
      if (userWithRoles.company) {
        result.user.company = userWithRoles.company;
      }
    }
  }

  try {
    if (result.session && result.session.fresh) {
      const sessionCookie = lucia.createSessionCookie(result.session.id)
      cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)
    }
    if (!result.session) {
      const sessionCookie = lucia.createBlankSessionCookie()
      cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)
    }
  } catch (error) {
    console.log(error)
  }

  return result
}