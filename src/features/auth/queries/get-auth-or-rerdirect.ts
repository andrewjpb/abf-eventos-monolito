// /features/auth/queries/get-auth-or-redirect.ts
"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getAuth } from "./get-auth"
import { signInPath, homePath } from "@/app/paths"
import { logWarn } from "@/features/logs/queries/add-log"
import { prisma } from "@/lib/prisma"

/**
 * Verifica se o usuário está autenticado e opcionalmente se possui uma permissão específica
 * Redireciona para a página de login se não estiver autenticado
 * Redireciona para a página inicial se não tiver a permissão necessária
 * 
 * @param permission Nome opcional da permissão necessária
 * @returns Dados de autenticação do usuário
 */
export const getAuthOrRedirect = async (permission?: string) => {
  const auth = await getAuth()
  const headersInstance = await headers()

  if (!auth.user) {
    const referer = headersInstance.get("referer")
    const logData = {
      path: referer ? (new URL(referer)).pathname : "URL desconhecida"
    }

    await logWarn("Auth", "Tentativa de acesso sem autenticação", undefined, logData)
    redirect(signInPath())
  }

  // Se uma permissão específica foi solicitada, verificar se o usuário a possui
  if (permission) {
    // Verificar se o usuário é admin (admins têm todas as permissões)
    const isAdmin = auth.user.roles.some(role => role.name === "admin")

    // Se não for admin, verificar se tem a permissão específica
    if (!isAdmin) {
      // Carrega o usuário com suas permissões
      const userWithPermissions = await prisma.users.findUnique({
        where: { id: auth.user.id },
        include: {
          roles: {
            include: {
              permissions: {
                select: { id: true, name: true }
              }
            }
          }
        }
      });

      if (!userWithPermissions) {
        redirect(signInPath());
      }

      // Verificar se o usuário tem a permissão solicitada
      const hasPermission = userWithPermissions.roles.some(role =>
        role.permissions.some(perm => perm.name === permission)
      );

      // Se não tiver a permissão necessária, redirecionar para a página inicial
      if (!hasPermission) {
        const referer = headersInstance.get("referer")
        const roleNames = auth.user.roles ? auth.user.roles.map((r: any) => r.name).join(', ') : 'none';

        const logData = {
          path: referer ? (new URL(referer)).pathname : "URL desconhecida",
          requiredPermission: permission,
          userId: auth.user.id,
          userName: auth.user.username,
          roles: roleNames
        }

        await logWarn("Auth", `Acesso negado: usuário sem permissão "${permission}"`, auth.user.id, logData)
        redirect(homePath())
      }
    }
  }

  return auth
}

// Mantendo as funções existentes para compatibilidade
export const getAdminOrRedirect = async () => {
  const auth = await getAuth();
  const headersInstance = await headers();

  if (!auth.user) {
    const referer = headersInstance.get("referer");
    const logData = {
      path: referer ? (new URL(referer)).pathname : "URL desconhecida"
    };

    await logWarn("Auth", "Tentativa de acesso sem autenticação", undefined, logData);
    redirect(signInPath());
  }

  // Agora isAdmin é um booleano, não uma função
  if (!auth.user.isAdmin) {
    const referer = headersInstance.get("referer");
    const roleNames = auth.user.roles ? auth.user.roles.map((r: any) => r.name).join(', ') : 'none';

    const logData = {
      userId: auth.user.id,
      userName: auth.user.username,
      roles: roleNames,
      path: referer ? (new URL(referer)).pathname : "URL desconhecida"
    };

    await logWarn("Auth", "Acesso negado a área administrativa", auth.user.id, logData);
    redirect("/");
  }

  return auth;
};

export const getPanelAccessOrRedirect = async () => {
  const auth = await getAuth();
  const headersInstance = await headers();

  if (!auth.user) {
    const referer = headersInstance.get("referer");
    const logData = {
      path: referer ? (new URL(referer)).pathname : "URL desconhecida"
    };

    await logWarn("Auth", "Tentativa de acesso sem autenticação", undefined, logData);
    redirect(signInPath());
  }

  // Verifica se é admin (acesso completo)
  const isAdmin = auth.user.roles.some(role => role.name === "admin");
  if (isAdmin) {
    return auth;
  }

  // Carrega o usuário com suas permissões
  const userWithPermissions = await prisma.users.findUnique({
    where: { id: auth.user.id },
    include: {
      roles: {
        include: {
          permissions: {
            select: { name: true }
          }
        }
      }
    }
  });

  if (!userWithPermissions) {
    redirect(signInPath());
  }

  // Verifica se o usuário tem a permissão 'panel.access' ou qualquer outra que começa com um prefixo de recurso
  const hasPanelAccess = userWithPermissions.roles.some(role =>
    role.permissions.some(permission => {
      // Verificar permissão específica panel.access
      if (permission.name === 'panel.access') return true;

      // Verificar permissões que implicam acesso ao painel (todas as permissões .view, .create, etc.)
      const resourcePrefixes = ['users.', 'companies.', 'events.', 'external_events.',
        'speakers.', 'sponsors.', 'supporters.', 'banners.',
        'attendance.', 'roles.', 'permissions.', 'logs.', 'settings.'];

      return resourcePrefixes.some(prefix => permission.name.startsWith(prefix));
    })
  );

  if (!hasPanelAccess) {
    const referer = headersInstance.get("referer");
    const roleNames = auth.user.roles ? auth.user.roles.map((r) => r.name).join(', ') : 'none';

    const logData = {
      userId: auth.user.id,
      userName: auth.user.username,
      roles: roleNames,
      path: referer ? (new URL(referer)).pathname : "URL desconhecida"
    };

    await logWarn("Auth", "Acesso negado ao painel administrativo", auth.user.id, logData);
    redirect("/"); // Redireciona para a página inicial
  }

  return auth;
};