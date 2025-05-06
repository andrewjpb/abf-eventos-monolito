"use server"

import { cookies } from "next/headers"



export const getCookieByKey = async (key: string) => {
  const cookie = await cookies()
  const cookieKey = cookie.get(key)
  if (!cookieKey) {
    return null
  }
  return cookieKey.value
}

export const setCoookieByKey = async (key: string, value: string) => {
  const cookie = await cookies()
  cookie.set(key, value)
}

export const deleteCookieByKey = async (key: string) => {
  const cookie = await cookies()
  cookie.delete(key)
}



