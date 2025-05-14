// /features/permissions/components/permissions-list.tsx
"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import { getPermissions } from "../queries/get-permissions"
import { Button } from "@/components/ui/button"
import { Search, LucideLoaderCircle } from "lucide-react"
import Link from "next/link"
import { permissionsPath } from "@/app/paths"
import { Card, CardContent } from "@/components/ui/card"
import { PermissionCard } from "./permission-card"
import { Separator } from "@/components/ui/separator"
import { Permission, PermissionWithRoles } from "../types"
import { ParsedSearchParams } from "../search-params"
import { useState } from "react"
import { PermissionSearchInput } from "./permission-search-input"

type PermissionsListProps = {
  searchParams: ParsedSearchParams,
  showActions?: boolean
}

export function PermissionsList({
  searchParams,
  showActions = true
}: PermissionsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery({
    queryKey: ["permissions", searchParams.search],
    queryFn: ({ pageParam }) => getPermissions({
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

  // Extrair a lista de permissões de todas as páginas
  const permissions = data?.pages.flatMap(page => page.permissions) || []
  const totalCount = data?.pages[0]?.metadata.count || 0

  return (
    <div className="space-y-6">
      {showActions && (
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex-1 space-y-1">
            <h1 className="text-2xl font-bold">Permissões</h1>
            <p className="text-muted-foreground">
              Visualização das permissões disponíveis no sistema
            </p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-full sm:w-auto flex-1">
            <PermissionSearchInput />
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
            {totalCount} permissão(ões) encontrada(s)
          </span>
        </div>
      </div>

      <Separator />

      {/* Lista de permissões */}
      {!isLoading && permissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-muted-foreground opacity-40" />
          </div>
          <p className="text-muted-foreground text-center">
            Nenhuma permissão encontrada com os filtros selecionados
          </p>
          <Link href={permissionsPath()} passHref>
            <Button variant="link">
              Limpar filtros
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {permissions.map(permission => (
              <PermissionCard
                key={permission.id}
                permission={permission as PermissionWithRoles}
                expanded={expandedId === permission.id}
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