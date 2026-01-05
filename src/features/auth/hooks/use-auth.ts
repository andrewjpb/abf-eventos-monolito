"use client"

// Hook de autenticação (useAuth.ts)
import { useEffect, useState } from "react"
import { User as AuthUser } from "lucia"
import { usePathname } from "next/navigation"
import { getAuth } from "../queries/get-auth"

const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isFetched, setIsFetched] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const pathname = usePathname()

  useEffect(() => {
    const fetchUser = async () => {
      console.log("[useAuth] Iniciando fetch de autenticação. Pathname:", pathname)
      setError(null)

      try {
        console.log("[useAuth] Chamando getAuth()...")
        const result = await getAuth()
        console.log("[useAuth] Resultado recebido:", result ? "OK" : "null", "| User:", result?.user?.id || "null")
        setUser(result?.user ?? null)
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        console.error("[useAuth] ERRO ao buscar autenticação:", error.message)
        console.error("[useAuth] Stack:", error.stack)
        console.error("[useAuth] Erro completo:", JSON.stringify(err, Object.getOwnPropertyNames(err)))
        setError(error)
        setUser(null)
      } finally {
        console.log("[useAuth] Fetch finalizado. isFetched = true")
        setIsFetched(true)
      }
    }
    fetchUser()
  }, [pathname])

  // Adicione utilitários aqui
  const hasRole = (roleName: string) => {
    if (!user || !user.roles) return false;
    return user.roles.some((role: any) => role.name === roleName);
  }

  const isAdmin = () => {
    return hasRole('admin');
  }

  return { user, isFetched, hasRole, isAdmin, error }
}

export { useAuth }