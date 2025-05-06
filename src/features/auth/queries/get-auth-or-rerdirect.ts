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
  const user = await auth.user;
  const headersInstance = await headers();

  if (!auth.user) {
    const referer = headersInstance.get("referer");
    const logData = {
      path: referer ? (new URL(referer)).pathname : "URL desconhecida"
    };

    await logWarn("Auth", "Tentativa de acesso sem autenticação", undefined, logData);
    redirect(signInPath());
  }

  if (user && !user?.roles.includes('admin')) {
    const referer = headersInstance.get("referer");
    const logData = {
      userId: user.id,
      userName: user.username,
      roles: user.roles,
      path: referer ? (new URL(referer)).pathname : "URL desconhecida"
    };

    await logWarn("Auth", "Acesso negado a área administrativa", auth.user.id, logData);
    redirect("/");
  }

  return auth;
};