"use server"

import { redirect } from "next/navigation"
import { getAuth } from "../queries/get-auth"
import { homePath } from "@/app/paths"

export const acessAuthAdmin = async () => {
  const auth = await getAuth()
  // isAdmin agora é um booleano, não uma função
  if (!auth.user?.isAdmin) redirect(homePath())
  return auth
}