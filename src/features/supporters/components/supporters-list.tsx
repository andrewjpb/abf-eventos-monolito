// /features/supporters/components/supporters-list.tsx
"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import { getSupporters } from "../queries/get-supporters"
import { Button } from "@/components/ui/button"
import { Plus, Search, LucideLoaderCircle, Filter } from "lucide-react"
import Link from "next/link"
import { supporterCreatePath, supportersPath } from "@/app/paths"
import { Card, CardContent } from "@/components/ui/card"
import { SupporterCard } from "./supporter-card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { SupporterWithEvents } from "../types"
import { ParsedSearchParams } from "../search-params"
import { useEffect, useState } from "react"
import { SupporterSearchInput } from "./supporter-search-input"
import { SupporterStatusSelect } from "./supporter-status-select"

type SupportersListProps = {
  searchParams: ParsedSearchParams,
  showActions?: boolean
}

export function SupportersList({
  searchParams,
  showActions = true
}: SupportersListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery({
    queryKey: ["supporters", searchParams.search, searchParams.active],
    queryFn: ({ pageParam }) => getSupporters({
      cursor: pageParam as string,
      search: searchParams.search,
      active: searchParams.active === "ALL" ? undefined : searchParams.active
    }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.metadata?.hasNextPage ? lastPage.metadata?.cursor : undefined,
  })

  const handleToggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  // Extrair a lista de apoiadores de todas as páginas
  const supporters = data?.pages.flatMap(page => page.supporters) || []
  const totalCount = data?.pages[0]?.metadata.count || 0

  // Contadores por status
  const countByStatus = data?.pages[0]?.metadata.countByStatus || {
    ACTIVE: 0,
    INACTIVE: 0,
    WITH_EVENTS: 0
  }

  useEffect(() => {
    console.log(searchParams.active)
  }, [searchParams])

  return (
    <div className="space-y-6">
      {showActions && (
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex-1 space-y-1">
            <h1 className="text-2xl font-bold">Apoiadores</h1>
            <p className="text-muted-foreground">
              Gerenciamento de apoiadores e suas associações com eventos
            </p>
          </div>

          <Button asChild>
            <Link href={supporterCreatePath()}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Apoiador
            </Link>
          </Button>
        </div>
      )}

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-full sm:w-auto flex-1">
            <SupporterSearchInput />
          </div>

          <div className="w-full sm:w-auto">
            <SupporterStatusSelect />
          </div>

          {isLoading && (
            <div className="flex items-center">
              <LucideLoaderCircle className="w-6 h-6 animate-spin cursor-pointer" />
            </div>
          )}
        </div>
      </Card>

      {/* Contadores */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-2 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
          <CardContent className="p-2 flex justify-between items-center">
            <p className="text-sm font-medium text-green-600 dark:text-green-400">Ativos</p>
            <Badge variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
              {countByStatus.ACTIVE}
            </Badge>
          </CardContent>
        </Card>

        <Card className="p-2 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
          <CardContent className="p-2 flex justify-between items-center">
            <p className="text-sm font-medium text-red-600 dark:text-red-400">Inativos</p>
            <Badge variant="secondary" className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
              {countByStatus.INACTIVE}
            </Badge>
          </CardContent>
        </Card>

        <Card className="p-2 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="p-2 flex justify-between items-center">
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Com Eventos</p>
            <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
              {countByStatus.WITH_EVENTS}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Resultados da busca - header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {totalCount} apoiador{totalCount !== 1 ? 'es' : ''} encontrado{totalCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <Separator />

      {/* Lista de apoiadores */}
      {!isLoading && supporters.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-muted-foreground opacity-40" />
          </div>
          <p className="text-muted-foreground text-center">
            Nenhum apoiador encontrado com os filtros selecionados
          </p>
          <Link href={supportersPath()} passHref>
            <Button variant="link">
              Limpar filtros
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {supporters.map(supporter => (
              <SupporterCard
                key={supporter.id}
                supporter={supporter as SupporterWithEvents}
                expanded={expandedId === supporter.id}
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