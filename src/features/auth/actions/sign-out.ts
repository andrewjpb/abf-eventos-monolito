"use server"

import { cookies } from "next/headers"
import { getAuth } from "../queries/get-auth"
import { redirect } from "next/navigation"
import { signInPath } from "@/app/paths"
import { lucia } from "@/lib/lucia"

export const SignOut = async () => {
  const cookieStore = await cookies()
  const { session } = await getAuth()

  if (!session) {
    redirect(signInPath())
  }

  await lucia.invalidateSession(session.id)
  const sessionCookie = lucia.createBlankSessionCookie()
  cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)

  redirect(signInPath())
}
