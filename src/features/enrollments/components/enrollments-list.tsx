// /features/enrollments/components/enrollments-list.tsx
"use client"

import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { getEnrollments } from "../queries/get-enrollments"
import { getEnrollmentCounters } from "../queries/get-enrollment-counters"
import { Button } from "@/components/ui/button"
import { Search, LucideLoaderCircle, Download, FileSpreadsheet } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ParsedSearchParams } from "../search-params"
import { EnrollmentFilters } from "./enrollment-filters"
import { EnrollmentListItem } from "./enrollment-list-item"
import { exportEnrollmentsToXLSX } from "../utils/export-enrollments"
import { useState } from "react"
import { toast } from "sonner"

type EnrollmentsListProps = {
  searchParams: ParsedSearchParams
  events?: Array<{ id: string; title: string }>
  segments?: string[]
  types?: string[]
  fixedEventId?: string
  fixedEventTitle?: string
}

export function EnrollmentsList({
  searchParams,
  events = [],
  segments = [],
  types = [],
  fixedEventId,
  fixedEventTitle
}: EnrollmentsListProps) {
  const [isExporting, setIsExporting] = useState(false)

  // Query para buscar as inscrições (com paginação)
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["enrollments", searchParams.search, searchParams.eventId, searchParams.segment, searchParams.status, searchParams.type, searchParams.dateFrom, searchParams.dateTo],
    queryFn: ({ pageParam }) => getEnrollments({
      cursor: pageParam as string,
      limit: 20,
      search: searchParams.search,
      eventId: searchParams.eventId === "ALL" ? undefined : searchParams.eventId,
      segment: searchParams.segment === "ALL" ? undefined : searchParams.segment,
      status: searchParams.status === "ALL" ? undefined : searchParams.status,
      type: searchParams.type === "ALL" ? undefined : searchParams.type,
      dateFrom: searchParams.dateFrom || undefined,
      dateTo: searchParams.dateTo || undefined,
    }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.metadata?.hasNextPage ? lastPage.metadata?.cursor : undefined,
  })

  // Query separada para buscar os contadores globais (sem paginação)
  const { data: counters, isLoading: isLoadingCounters } = useQuery({
    queryKey: ["enrollment-counters", searchParams.search, searchParams.eventId, searchParams.segment, searchParams.status, searchParams.type, searchParams.dateFrom, searchParams.dateTo],
    queryFn: () => getEnrollmentCounters({
      search: searchParams.search,
      eventId: searchParams.eventId === "ALL" ? undefined : searchParams.eventId,
      segment: searchParams.segment === "ALL" ? undefined : searchParams.segment,
      status: searchParams.status === "ALL" ? undefined : searchParams.status,
      type: searchParams.type === "ALL" ? undefined : searchParams.type,
      dateFrom: searchParams.dateFrom || undefined,
      dateTo: searchParams.dateTo || undefined,
    }),
  })

  // Extrair a lista de inscrições de todas as páginas
  const enrollments = data?.pages.flatMap(page => page.enrollments) || []

  // Usar os contadores globais em vez dos dados paginados
  const totalCount = counters?.totalCount || 0
  const checkedInCount = counters?.checkedInCount || 0
  const pendingCount = counters?.pendingCount || 0
  const checkInRate = counters?.checkInRate || 0
  const presentialCount = counters?.presentialCount || 0
  const onlineCount = counters?.onlineCount || 0

  // Função para exportar as inscrições
  const handleExport = async () => {
    try {
      setIsExporting(true)
      
      // Buscar todos os registros com os filtros atuais
      const allEnrollments = await getEnrollments({
        limit: 10000, // Limite alto para pegar todos os registros
        search: searchParams.search,
        eventId: searchParams.eventId === "ALL" ? undefined : searchParams.eventId,
        segment: searchParams.segment === "ALL" ? undefined : searchParams.segment,
        status: searchParams.status === "ALL" ? undefined : searchParams.status,
        type: searchParams.type === "ALL" ? undefined : searchParams.type,
        dateFrom: searchParams.dateFrom || undefined,
        dateTo: searchParams.dateTo || undefined,
      })

      if (allEnrollments.enrollments.length === 0) {
        toast.error("Nenhuma inscrição encontrada para exportar")
        return
      }

      // Exportar para XLSX
      exportEnrollmentsToXLSX(allEnrollments.enrollments)
      toast.success(`${allEnrollments.enrollments.length} inscrições exportadas com sucesso!`)
    } catch (error) {
      console.error("Erro ao exportar:", error)
      toast.error("Erro ao exportar inscrições")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex-1 space-y-1">
          <h1 className="text-2xl font-bold">Inscrições</h1>
          <p className="text-muted-foreground">
            Visualização e análise de inscrições em eventos
          </p>
        </div>

        <Button 
          variant="outline" 
          onClick={handleExport}
          disabled={isExporting || isLoading || totalCount === 0}
        >
          {isExporting ? (
            <>
              <LucideLoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              Exportando...
            </>
          ) : (
            <>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Exportar XLSX
            </>
          )}
        </Button>
      </div>

      {/* Filtros */}
      <EnrollmentFilters
        events={events}
        segments={segments}
        types={types}
        fixedEventId={fixedEventId}
        fixedEventTitle={fixedEventTitle}
      />

      {/* Contadores rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-2">
          <CardContent className="p-2 flex justify-between items-center">
            <p className="text-sm font-medium">Total</p>
            <Badge variant="secondary">
              {isLoadingCounters ? "..." : totalCount}
            </Badge>
          </CardContent>
        </Card>

        <Card className="p-2 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="p-2 flex justify-between items-center">
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Presencial</p>
            <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
              {isLoadingCounters ? "..." : presentialCount}
            </Badge>
          </CardContent>
        </Card>

        <Card className="p-2 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800">
          <CardContent className="p-2 flex justify-between items-center">
            <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Online</p>
            <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
              {isLoadingCounters ? "..." : onlineCount}
            </Badge>
          </CardContent>
        </Card>

        <Card className="p-2 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
          <CardContent className="p-2 flex justify-between items-center">
            <p className="text-sm font-medium text-green-600 dark:text-green-400">Check-in Feito</p>
            <Badge variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
              {isLoadingCounters ? "..." : checkedInCount}
            </Badge>
          </CardContent>
        </Card>

        <Card className="p-2 bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800">
          <CardContent className="p-2 flex justify-between items-center">
            <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Pendente</p>
            <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
              {isLoadingCounters ? "..." : pendingCount}
            </Badge>
          </CardContent>
        </Card>

        <Card className="p-2 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800">
          <CardContent className="p-2 flex justify-between items-center">
            <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Taxa Check-in</p>
            <Badge variant="secondary" className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
              {isLoadingCounters ? "..." : `${checkInRate}%`}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Resultados da busca - header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {totalCount} inscrição{totalCount !== 1 ? 'ões' : ''} encontrada{totalCount !== 1 ? 's' : ''}
          </span>
        </div>

        {isLoading && (
          <LucideLoaderCircle className="w-4 h-4 animate-spin" />
        )}
      </div>

      <Separator />

      {/* Lista de inscrições */}
      {!isLoading && enrollments.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-muted-foreground opacity-40" />
          </div>
          <p className="text-muted-foreground text-center">
            Nenhuma inscrição encontrada com os filtros selecionados
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {enrollments.map(enrollment => (
              <EnrollmentListItem key={enrollment.id} enrollment={enrollment} />
            ))}
          </div>

          {hasNextPage && (
            <div className="flex justify-center mt-6">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage || isLoading}
              >
                {isFetchingNextPage ? (
                  <>
                    <LucideLoaderCircle className="w-4 h-4 mr-2 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  "Carregar mais"
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}