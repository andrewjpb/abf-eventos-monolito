// /app/page.tsx
import { Suspense } from "react"
import { EventsSection } from "@/features/events/components/events-section"
import { Spinner } from "@/components/spinner"
import { getEvents } from "@/features/events/queries/get-events"
import { FeaturedEvent } from "@/features/events/components/featured-event"
import { EventWithDetails } from "@/features/events/types"

export default async function Home() {
  // Buscar eventos destacados
  const highlightedEvents = await getEvents({
    onlyHighlighted: true,
    limit: 1
  })

  // Buscar eventos futuros (não destacados)
  const upcomingEvents = await getEvents({
    onlyHighlighted: false,
    past: false,
    limit: 9
  })

  // Verificar se temos um evento em destaque
  const featuredEvent = highlightedEvents.events[0]
  const otherEvents = upcomingEvents.events.filter(e => e.id !== featuredEvent?.id)

  return (
    <div className="flex-1 animate-fade-in-from-top">
      <main className="container mx-auto px-4 py-8">
        {featuredEvent && (
          <Suspense fallback={<div className="flex justify-center py-8"><Spinner /></div>}>
            <FeaturedEvent event={featuredEvent as any} />
          </Suspense>
        )}

        <Suspense fallback={<div className="flex justify-center py-8"><Spinner /></div>}>
          <EventsSection
            events={otherEvents as EventWithDetails[]}
            title="Próximos Eventos"
            eventsPorPagina={3}
          />
        </Suspense>
      </main>
    </div>
  )
}