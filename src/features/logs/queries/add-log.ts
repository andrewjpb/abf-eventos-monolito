// /features/logs/queries/add-log.ts
"use server"

import { prisma } from "@/lib/prisma"
import { nanoid } from "nanoid"

type LogLevel = "INFO" | "ERROR" | "WARN" | "DEBUG"

interface AddLogOptions {
  level: LogLevel
  action: string
  message: string
  userId?: string | null
  meta?: any
}

export async function addLog({
  level,
  action,
  message,
  userId = null,
  meta = {}
}: AddLogOptions) {
  try {
    const log = await prisma.appLog.create({
      data: {
        id: nanoid(),
        level,
        action,
        message,
        userId,
        meta
      }
    })

    return log
  } catch (error) {
    console.error("Falha ao registrar log:", error)
    return null
  }
}

export async function logInfo(action: string, message: string, userId?: string, meta?: any) {
  return addLog({ level: "INFO", action, message, userId, meta })
}

export async function logError(action: string, message: string, userId?: string, meta?: any) {
  return addLog({ level: "ERROR", action, message, userId, meta })
}

export async function logWarn(action: string, message: string, userId?: string, meta?: any) {
  return addLog({ level: "WARN", action, message, userId, meta })
}

export async function logDebug(action: string, message: string, userId?: string, meta?: any) {
  return addLog({ level: "DEBUG", action, message, userId, meta })
}