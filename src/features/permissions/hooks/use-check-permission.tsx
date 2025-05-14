// /features/permissions/hooks/use-check-permission.tsx
"use client"

import { useState, useEffect } from "react"
import { checkUserPermission } from "../queries/check-user-permission"

export function useCheckPermission(userId: string | undefined, permissionName: string) {
  const [hasPermission, setHasPermission] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const checkPermission = async () => {
      if (!userId) {
        setHasPermission(false)
        setIsLoading(false)
        return
      }

      try {
        const result = await checkUserPermission(userId, permissionName)
        setHasPermission(result)
      } catch (error) {
        console.error(`Erro ao verificar permissão ${permissionName}:`, error)
        setHasPermission(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkPermission()
  }, [userId, permissionName])

  return { hasPermission, isLoading }
}