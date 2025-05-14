// /features/roles/components/roles-list.tsx
"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import { getRoles } from "../queries/get-roles"
import { Button } from "@/components/ui/button"
import { Search, LucideLoaderCircle, Plus } from "lucide-react"
import Link from "next/link"
import { roleCreatePath, rolesPath } from "@/app/paths"
import { Card, CardContent } from "@/components/ui/card"
import { RoleCard } from "./role-card"
import { Separator } from "@/components/ui/separator"
import { RoleWithRelations } from "../types"
import { ParsedSearchParams } from "../search-params"
import { useState } from "react"
import { RoleSearchInput } from "./role-search-input"

type RolesListProps = {
  searchParams: ParsedSearchParams,
  showActions?: boolean
}

export function RolesList({
  searchParams,
  showActions = true
}: RolesListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery({
    queryKey: ["roles", searchParams.search],
    queryFn: ({ pageParam }) => getRoles({
      cursor: pageParam as string,
      search: searchParams.search
    }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.metadata?.hasNextPage ? lastPage.metadata?.cursor : undefined,
  })

  const handleToggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  // Extrair a lista de roles de todas as páginas
  const roles = data?.pages.flatMap(page => page.roles) || []
  const totalCount = data?.pages[0]?.metadata.count || 0

  return (
    <div className="space-y-6">
      {showActions && (
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex-1 space-y-1">
            <h1 className="text-2xl font-bold">Grupos de acesso</h1>
            <p className="text-muted-foreground">
              Visualização dos grupos de acesso disponíveis no sistema
            </p>
          </div>
          <Button asChild>
            <Link href={roleCreatePath()}>
              <Plus className="mr-2 h-4 w-4" />
              Novo grupo
            </Link>
          </Button>
        </div>
      )}

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-full sm:w-auto flex-1">
            <RoleSearchInput />
          </div>

          {isLoading && (
            <div className="flex items-center">
              <LucideLoaderCircle className="w-6 h-6 animate-spin cursor-pointer" />
            </div>
          )}
        </div>
      </Card>

      {/* Resultados da busca - header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {totalCount} função(ões) encontrada(s)
          </span>
        </div>
      </div>

      <Separator />

      {/* Lista de funções */}
      {!isLoading && roles.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-muted-foreground opacity-40" />
          </div>
          <p className="text-muted-foreground text-center">
            Nenhuma função encontrada com os filtros selecionados
          </p>
          <Link href={rolesPath()} passHref>
            <Button variant="link">
              Limpar filtros
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map(role => (
              <RoleCard
                key={role.id}
                role={role}
                expanded={expandedId === role.id}
                onToggleExpand={handleToggleExpand}
              />
            ))}
          </div>

          {hasNextPage && (
            <div className="flex justify-center mt-6">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage || isLoading}
              >
                {isFetchingNextPage ? "Carregando..." : "Carregar mais"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}