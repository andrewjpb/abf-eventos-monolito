// /features/events/components/event-list.tsx
"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import { getEvents } from "../queries/get-events"
import { Button } from "@/components/ui/button"
import { EventCard } from "./event-card"
import { EventsSection } from "./events-section"
import { ParsedSearchParams } from "../search-params"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter, usePathname } from "next/navigation"
import { useQueryState } from "nuqs"
import { pastParse } from "../search-params"
import { Loader2 } from "lucide-react"
import { EventWithDetails } from "../types"

interface EventListProps {
  searchParams: ParsedSearchParams
  showFilters?: boolean
  showHeader?: boolean
  limit?: number
}

export function EventList({
  searchParams,
  showFilters = true,
  showHeader = true,
  limit = 12
}: EventListProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [pastEvents, setPastEvents] = useQueryState("past", pastParse)

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery({
    queryKey: ["events", searchParams.search, searchParams.format, searchParams.highlighted, pastEvents],
    queryFn: ({ pageParam }) => getEvents({
      cursor: pageParam as string,
      search: searchParams.search,
      format: searchParams.format === "ALL" ? undefined : searchParams.format,
      onlyHighlighted: searchParams.highlighted,
      past: pastEvents,
      limit
    }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.metadata?.hasNextPage ? lastPage.metadata?.cursor : undefined,
  })

  // Extrair todos os eventos de todas as páginas
  const events = data?.pages.flatMap(page => page.events) || []
  const highlightedEvents = events.filter(event => event.highlight)
  const nonHighlightedEvents = events.filter(event => !event.highlight)

  // Se não tiver eventos destacados, mostrar todos os eventos em uma única seção
  const hasHighlightedEvents = highlightedEvents.length > 0

  return (
    <div className="space-y-12">
      {/* Filtros de evento passado/futuro */}
      {showFilters && (
        <div className="flex justify-center">
          <Tabs value={pastEvents ? "past" : "future"} onValueChange={(value) => {
            setPastEvents(value === "past")
          }}>
            <TabsList>
              <TabsTrigger value="future">Próximos eventos</TabsTrigger>
              <TabsTrigger value="past">Eventos passados</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {isLoading ? (
        // Loading state
        <div className="py-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : events.length === 0 ? (
        // No events
        <div className="py-12 text-center">
          <h3 className="text-xl font-semibold mb-4 text-gray-700">
            {pastEvents ? "Nenhum evento passado encontrado" : "Nenhum evento futuro disponível"}
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            {searchParams.search || searchParams.format !== "ALL"
              ? "Tente remover os filtros para ver mais eventos"
              : pastEvents
                ? "Não encontramos eventos passados para exibir"
                : "Ainda não há eventos futuros programados"
            }
          </p>
        </div>
      ) : (
        // Events sections
        <>
          {/* Eventos destacados */}
          {hasHighlightedEvents && (
            <EventsSection
              events={highlightedEvents as EventWithDetails[]}
              title={pastEvents ? "Eventos Destacados Passados" : "Destaques"}
            />
          )}

          {/* Eventos não destacados */}
          {nonHighlightedEvents.length > 0 && (
            <EventsSection
              events={nonHighlightedEvents as EventWithDetails[]}
              title={hasHighlightedEvents
                ? (pastEvents ? "Outros eventos passados" : "Mais eventos")
                : (pastEvents ? "Eventos passados" : "Próximos eventos")}
            />
          )}

          {/* Botão de carregar mais */}
          {hasNextPage && (
            <div className="mt-8 flex justify-center">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  "Carregar mais eventos"
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}