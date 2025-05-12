"use client"

// Hook de autenticação (useAuth.ts)
import { useEffect, useState } from "react"
import { User as AuthUser } from "lucia"
import { usePathname } from "next/navigation"
import { getAuth } from "../queries/get-auth"

const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isFetched, setIsFetched] = useState(false)

  const pathname = usePathname()

  useEffect(() => {
    const fetchUser = async () => {
      const { user } = await getAuth()
      setUser(user)
      setIsFetched(true)
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

  return { user, isFetched, hasRole, isAdmin }
}

export { useAuth }