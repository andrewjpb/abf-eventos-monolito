"use server"

import { cookies } from "next/headers"
import { lucia } from "@/lib/lucia"

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
