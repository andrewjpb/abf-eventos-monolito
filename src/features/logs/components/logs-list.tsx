// /features/logs/components/logs-list.tsx
"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import { getLogs } from "../queries/get-logs"
import { Button } from "@/components/ui/button"
import { AlertCircle, Info, Activity, LucideLoaderCircle, RotateCcw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ParsedLogSearchParams } from "../search-params"
import { LogFilter } from "./log-filter"
import { LogsTable } from "./logs-table"

type LogsListProps = {
  searchParams: ParsedLogSearchParams,
  showActions?: boolean
}

export function LogsList({
  searchParams,
  showActions = true
}: LogsListProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch
  } = useInfiniteQuery({
    queryKey: ["logs", searchParams.level, searchParams.userId, searchParams.action, searchParams.startDate, searchParams.endDate],
    queryFn: ({ pageParam }) => getLogs({
      cursor: pageParam as string,
      level: searchParams.level || undefined,
      userId: searchParams.userId || undefined,
      action: searchParams.action || undefined,
      startDate: searchParams.startDate || undefined,
      endDate: searchParams.endDate || undefined
    }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.metadata?.hasNextPage ? lastPage.metadata?.cursor : undefined,
  })

  // Extrair a lista de logs de todas as páginas
  const logs = data?.pages.flatMap(page => page.logs) || []
  const totalCount = data?.pages[0]?.metadata.count || 0

  // Contadores por nível
  const countsByLevel = data?.pages[0]?.metadata.countsByLevel || {
    INFO: 0,
    ERROR: 0,
    WARN: 0,
    DEBUG: 0
  }

  return (
    <div className="space-y-6">
      {showActions && (
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex-1 space-y-1">
            <h1 className="text-2xl font-bold">Logs do Sistema</h1>
            <p className="text-muted-foreground">
              Visualize e filtre os registros de atividades do sistema
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>
      )}

      {/* Filtros */}
      <LogFilter />

      {/* Contadores */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-2 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="p-2 flex justify-between items-center">
            <div className="flex items-center">
              <Info className="h-4 w-4 mr-2 text-blue-600" />
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">INFO</p>
            </div>
            <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
              {countsByLevel.INFO}
            </Badge>
          </CardContent>
        </Card>

        <Card className="p-2 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
          <CardContent className="p-2 flex justify-between items-center">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 text-red-600" />
              <p className="text-sm font-medium text-red-600 dark:text-red-400">ERROR</p>
            </div>
            <Badge variant="secondary" className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
              {countsByLevel.ERROR}
            </Badge>
          </CardContent>
        </Card>

        <Card className="p-2 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
          <CardContent className="p-2 flex justify-between items-center">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 text-amber-600" />
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">WARN</p>
            </div>
            <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
              {countsByLevel.WARN}
            </Badge>
          </CardContent>
        </Card>

        <Card className="p-2 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
          <CardContent className="p-2 flex justify-between items-center">
            <div className="flex items-center">
              <Activity className="h-4 w-4 mr-2 text-green-600" />
              <p className="text-sm font-medium text-green-600 dark:text-green-400">DEBUG</p>
            </div>
            <Badge variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
              {countsByLevel.DEBUG}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Resultados da busca - header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {totalCount} registro{totalCount !== 1 ? 's' : ''} encontrado{totalCount !== 1 ? 's' : ''}
          </span>
        </div>

        {isLoading && (
          <div className="flex items-center">
            <LucideLoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Carregando logs...</span>
          </div>
        )}
      </div>

      <Separator />

      {/* Lista de logs */}
      <LogsTable logs={logs} />

      {/* Botão carregar mais */}
      {hasNextPage && (
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage || isLoading}
          >
            {isFetchingNextPage ? (
              <>
                <LucideLoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Carregando...
              </>
            ) : (
              "Carregar mais"
            )}
          </Button>
        </div>
      )}
    </div>
  )
}