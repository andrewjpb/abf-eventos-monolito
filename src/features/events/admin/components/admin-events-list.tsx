"use client"

import { AdminEventSummary } from "../types"
import { AdminEventCard } from "./admin-event-card"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarX } from "lucide-react"

interface AdminEventsListProps {
  events: AdminEventSummary[]
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  isLoading?: boolean
  onLoadMore?: () => void
}

export function AdminEventsList({
  events,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  onLoadMore
}: AdminEventsListProps) {
  if (events.length === 0) {
    return (
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
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map(event => (
          <AdminEventCard key={event.id} event={event} />
        ))}
      </div>

      {/* Botão Carregar Mais */}
      {hasNextPage && onLoadMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isFetchingNextPage || isLoading}
          >
            {isFetchingNextPage ? "Carregando..." : "Carregar mais"}
          </Button>
        </div>
      )}
    </div>
  )
}