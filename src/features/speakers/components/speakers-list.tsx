// /features/speakers/components/speakers-list.tsx
"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import { getSpeakers } from "../queries/get-speakers"
import { Button } from "@/components/ui/button"
import { Plus, Search, LucideLoaderCircle, Filter } from "lucide-react"
import Link from "next/link"
import { speakerCreatePath, speakersPath } from "@/app/paths"
import { Card, CardContent } from "@/components/ui/card"
import { SpeakerCard } from "./speaker-card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { SpeakerWithEvents } from "../types"
import { ParsedSearchParams } from "../search-params"
import { useState } from "react"
import { SpeakerSearchInput } from "./speaker-search-input"
import { SpeakerStatusSelect } from "./speaker-status-select"

type SpeakersListProps = {
  searchParams: ParsedSearchParams,
  showActions?: boolean
}

export function SpeakersList({
  searchParams,
  showActions = true
}: SpeakersListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery({
    queryKey: ["speakers", searchParams.search, searchParams.active],
    queryFn: ({ pageParam }) => getSpeakers({
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

  // Extrair a lista de palestrantes de todas as páginas
  const speakers = data?.pages.flatMap(page => page.speakers) || []
  const totalCount = data?.pages[0]?.metadata.count || 0

  // Contadores por status
  const countByStatus = data?.pages[0]?.metadata.countByStatus || {
    WITH_EVENTS: 0
  }

  return (
    <div className="space-y-6">
      {showActions && (
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex-1 space-y-1">
            <h1 className="text-2xl font-bold">Palestrantes</h1>
            <p className="text-muted-foreground">
              Gerenciamento de palestrantes e suas associações com eventos
            </p>
          </div>

          <Button asChild>
            <Link href={speakerCreatePath()}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Palestrante
            </Link>
          </Button>
        </div>
      )}

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-full sm:w-auto flex-1">
            <SpeakerSearchInput />
          </div>

          <div className="w-full sm:w-auto">
            <SpeakerStatusSelect />
          </div>

          {isLoading && (
            <div className="flex items-center">
              <LucideLoaderCircle className="w-6 h-6 animate-spin cursor-pointer" />
            </div>
          )}
        </div>
      </Card>

      {/* Contadores */}
      <div className="grid grid-cols-1 gap-4">
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
            {totalCount} palestrante{totalCount !== 1 ? 's' : ''} encontrado{totalCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <Separator />

      {/* Lista de palestrantes */}
      {!isLoading && speakers.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-muted-foreground opacity-40" />
          </div>
          <p className="text-muted-foreground text-center">
            Nenhum palestrante encontrado com os filtros selecionados
          </p>
          <Link href={speakersPath()} passHref>
            <Button variant="link">
              Limpar filtros
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {speakers.map(speaker => (
              <SpeakerCard
                key={speaker.id}
                speaker={speaker as SpeakerWithEvents}
                expanded={expandedId === speaker.id}
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