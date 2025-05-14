// /features/auth/queries/get-panel-access-or-redirect.ts
"use server"

import { redirect } from "next/navigation"
import { getAuth } from "./get-auth"
import { signInPath } from "@/app/paths"
import { logWarn } from "@/features/logs/queries/add-log"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"

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

  // Verifica se o usuário tem a permissão 'panel.access'
  const hasPanelAccess = userWithPermissions.roles.some(role =>
    role.permissions.some(permission => permission.name === 'panel.access')
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