"use server"

import { redirect } from "next/navigation"
import { getAuth } from "../queries/get-auth"
import { signInPath } from "@/app/paths"
import { logWarn } from "@/features/logs/queries/add-log"
import { headers } from "next/headers"

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