// /app/page.tsx
import { Suspense } from "react"
import { EventsSection } from "@/features/events/components/events-section"
import { Spinner } from "@/components/spinner"
import { getEvents } from "@/features/events/queries/get-events"
import { FeaturedEvent } from "@/features/events/components/featured-event"
import { EventWithDetails } from "@/features/events/types"
import { BannersSidebar } from "@/features/banners/components/banners-sidebar"

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
    limit: 30 // Aumentado para garantir que eventos de setembro apareçam
  })

  const featuredEvent = highlightedEvents.events[0]
  const otherEvents = upcomingEvents.events.filter(e => e.id !== featuredEvent?.id)

  return (
    <div className="flex-1 animate-fade-in-from-top">
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        <Suspense fallback={<div className="flex justify-center p-0"><Spinner /></div>}>
          <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:gap-6">
            <div className="sm:grid sm:grid-cols-12 sm:gap-4 md:gap-5 lg:gap-6 sm:min-h-[770px]">
              <div className="sm:col-span-7 md:col-span-8 lg:col-span-8 xl:col-span-8 mb-4 sm:mb-0">
                {featuredEvent && (
                  <Suspense fallback={<div className="flex justify-center py-8"><Spinner /></div>}>
                    <FeaturedEvent event={featuredEvent as any} />
                  </Suspense>
                )}
              </div>

              <div className="sm:col-span-5 md:col-span-4 lg:col-span-4 xl:col-span-4 min-h-[770px]">
                <Suspense fallback={
                  <div className="flex justify-center items-center h-full min-h-[770px] rounded-lg bg-card/50">
                    <Spinner />
                  </div>
                }>
                  <BannersSidebar
                    limit={5}
                    interval={2000}
                  />
                </Suspense>
              </div>
            </div>

            <div className="mt-4 sm:mt-6 md:mt-8 lg:mt-10">
              <EventsSection
                events={(featuredEvent ? otherEvents : upcomingEvents.events) as EventWithDetails[]}
                eventsPorPagina={3}
              />
            </div>
          </div>
        </Suspense>
      </main>
    </div>
  )
}