"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"
import { AdminEventCard } from "./admin-event-card"
import { AdminEventFiltersSimple } from "./admin-event-filters-simple"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarX, LucideLoaderCircle } from "lucide-react"
import { getAdminEventsInfinite } from "../queries/get-admin-events-infinite"

export function AdminEventsInfiniteList() {
  const searchParams = useSearchParams()
  
  // Converter search params para query params
  const queryParams = {
    search: searchParams.get('search') || undefined,
    status: searchParams.get('status') === 'ALL' ? undefined : searchParams.get('status') as 'published' | 'draft' | 'archived' | undefined,
    format: searchParams.get('format') === 'ALL' ? undefined : searchParams.get('format') || undefined,
    highlight: searchParams.get('highlight') === 'ALL' ? undefined : searchParams.get('highlight') || undefined,
    date_from: searchParams.get('date_from') || undefined,
    date_to: searchParams.get('date_to') || undefined,
    city: searchParams.get('city') || undefined,
    state: searchParams.get('state') || undefined,
    sort: searchParams.get('sort') || 'date_desc',
  }

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error
  } = useInfiniteQuery({
    queryKey: ["admin-events", queryParams],
    queryFn: ({ pageParam }) => getAdminEventsInfinite({
      cursor: pageParam,
      limit: 12,
      ...queryParams
    }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.metadata?.hasNextPage ? lastPage.metadata?.cursor : undefined,
  })

  const events = data?.pages.flatMap(page => page.events) ?? []

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-40 bg-muted animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-80 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-8">
        <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
          <CalendarX className="h-12 w-12 text-muted-foreground opacity-50" />
          <div>
            <h3 className="text-lg font-medium text-muted-foreground">
              Erro ao carregar eventos
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Tente recarregar a página.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <AdminEventFiltersSimple />

      {/* Lista de eventos */}
      {events.length === 0 ? (
        <Card className="p-8">
          <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
            <CalendarX className="h-12 w-12 text-muted-foreground opacity-50" />
            <div>
              <h3 className="text-lg font-medium text-muted-foreground">
                Nenhum evento encontrado
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Tente ajustar os filtros ou criar um novo evento.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => (
              <AdminEventCard key={event.id} event={event} />
            ))}
          </div>

          {/* Botão Carregar Mais */}
          {hasNextPage && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
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
      )}
    </div>
  )
}