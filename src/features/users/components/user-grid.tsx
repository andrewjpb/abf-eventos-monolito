// /features/users/components/user-grid.tsx
"use client"

import { UserBasic } from "../types"
import { UserCard } from "./user-card"
import { useInfiniteQuery } from "@tanstack/react-query"
import { getUsers } from "../queries/get-users"
import { Button } from "@/components/ui/button"
import { PlusIcon, SearchIcon, X, LucideLoaderCircle } from "lucide-react"
import Link from "next/link"
import { userCreatePath } from "@/app/paths"
import { useState, useEffect, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import clsx from "clsx"
import { UserDashboardMetrics } from "./user-dashboard-metrics"

type UserGridProps = {
  initialUsers: {
    users: UserBasic[],
    metadata: {
      count: number,
      hasNextPage: boolean,
      cursor: string | undefined
    }
  },
  initialSearch?: string,
  initialStatus?: string,
}

export function UserGrid({ initialUsers, initialSearch = "", initialStatus = "all" }: UserGridProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [searchInput, setSearchInput] = useState(initialSearch)
  const [status, setStatus] = useState(initialStatus)

  // Função para atualizar os parâmetros de URL e refazer a busca
  const updateFilters = (search: string, statusFilter: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams)

      if (search) {
        params.set("search", search)
      } else {
        params.delete("search")
      }

      if (statusFilter !== "all") {
        params.set("status", statusFilter)
      } else {
        params.delete("status")
      }

      router.replace(`${pathname}?${params.toString()}`)
    })
  }

  // Query para buscar usuários
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isLoading
  } = useInfiniteQuery({
    queryKey: ["users", searchTerm, status],
    queryFn: ({ pageParam }) => getUsers({
      cursor: pageParam as string,
      search: searchTerm,
      status: status as any
    }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.metadata?.hasNextPage ? lastPage.metadata?.cursor : undefined,
    initialData: {
      pages: [initialUsers],
      pageParams: [undefined]
    }
  })

  // Atualizar a query sempre que os filtros mudarem
  useEffect(() => {
    refetch()
  }, [searchTerm, status, refetch])

  // Extrair a lista de usuários de todas as páginas
  const users = data?.pages.flatMap(page => page.users) || []

  // Manipuladores de eventos
  const handleSearch = () => {
    setSearchTerm(searchInput)
    updateFilters(searchInput, status)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleStatusChange = (value: string) => {
    setStatus(value)
    updateFilters(searchTerm, value)
  }

  const handleClearSearch = () => {
    setSearchInput("")
    setSearchTerm("")
    updateFilters("", status)
  }

  const handleRefresh = () => {
    refetch()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex-1 space-y-1">
          <h1 className="text-2xl font-bold">Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie os usuários do sistema
          </p>
        </div>

        <Button asChild>
          <Link href={userCreatePath()}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Novo Usuário
          </Link>
        </Button>
      </div>

      {/* Filtros */}
      <Card className="p-4 flex w-full">
        <div className="flex justify-between w-full">
          <div className="flex items-center gap-2 w-full">
            <div className="space-y-2 w-full">
              <Label htmlFor="search">Pesquisar</Label>
              <div className="flex">
                <div className="relative flex-1">
                  <Input
                    id="search"
                    placeholder="Nome, email ou cargo"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isPending || isLoading}
                    className="pr-8 "
                  />
                  {searchInput && (
                    <button
                      onClick={handleClearSearch}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      disabled={isPending || isLoading}
                    >

                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <Button
                  onClick={handleSearch}
                  className="ml-2"
                  variant="secondary"
                  disabled={isPending || isLoading}
                >
                  <SearchIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter">Status</Label>
              <Select
                value={status}
                onValueChange={handleStatusChange}
                disabled={isPending || isLoading}
              >
                <SelectTrigger id="filter">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                  <SelectItem value="admin">Administradores</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center">
            {(isPending || isLoading) && (
              <LucideLoaderCircle className={clsx("w-6 h-6 mr-2 animate-spin cursor-pointer ")} />
            )}
          </div>
        </div>
      </Card>

      <UserDashboardMetrics />

      {/* Lista de usuários */}
      {!isPending && !isLoading && users.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum usuário encontrado</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map(user => (
              <UserCard
                key={user.id}
                user={user}
                onStatusChange={handleRefresh}
              />
            ))}
          </div>

          {hasNextPage && (
            <div className="flex justify-center mt-6">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage || isPending}
              >
                {isFetchingNextPage ? "Carregando..." : "Carregar mais"}
              </Button></div>
          )}
        </>
      )}
    </div>
  )
}