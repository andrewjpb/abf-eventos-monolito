"use server"

import { redirect } from "next/navigation"
import { getAuth } from "../queries/get-auth"
import { signInPath } from "@/app/paths"
import { logWarn } from "@/features/logs/queries/add-log"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"

export const getAuthOrRedirect = async () => {
  const auth = await getAuth()
  const headersInstance = await headers() // Headers não é uma Promise em Server Components

  if (!auth.user) {
    const referer = headersInstance.get("referer")
    const logData = {
      path: referer ? (new URL(referer)).pathname : "URL desconhecida"
    }

    await logWarn("Auth", "Tentativa de acesso sem autenticação", undefined, logData)
    redirect(signInPath())
  }

  return auth
}

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

// Lista de permissões que dão acesso ao painel administrativo
const PANEL_ACCESS_PERMISSIONS = [
  "panel.access", // Permissão geral de acesso ao painel
  "users.view",
  "roles.view",
  "permissions.view",
  "events.view",
  "events.create",
  "events.update",
  "sponsors.view",
  "sponsors.create",
  "logs.view"
  // Adicione outras permissões que dão acesso ao painel
]

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