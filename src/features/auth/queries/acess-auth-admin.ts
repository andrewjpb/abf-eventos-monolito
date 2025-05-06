"use server"

import { redirect } from "next/navigation"
import { getAuth } from "../queries/get-auth"
import { homePath } from "@/app/paths"

export const acessAuthAdmin = async () => {
  const auth = await getAuth()
  if (!auth.user?.roles.includes('admin')) redirect(homePath())
  return auth

}
