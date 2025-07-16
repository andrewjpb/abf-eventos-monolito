

// /app/eventos/page.tsx
import { Suspense } from "react"
import { SearchParams } from "nuqs/server"
import { Spinner } from "@/components/spinner"
import { ParsedSearchParams, searchParamsCache } from "@/features/events/search-params"
import { EventList } from "@/features/events/components/event-list"
import { generateListingMetadata } from "@/lib/metadata"

export const metadata = generateListingMetadata(
  "eventos",
  "Descubra e participe dos eventos de franchising da ABF. Encontre palestras, workshops e networking com especialistas do setor."
)

type EventsPageProps = {
  searchParams: Promise<SearchParams>
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const parsedParams = await searchParamsCache.parse(searchParams)

  return (
    <div className="flex-1 animate-fade-in-from-top">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Eventos</h1>

        <Suspense fallback={<div className="flex justify-center py-8"><Spinner /></div>}>
          <EventList
            searchParams={parsedParams as unknown as ParsedSearchParams}
            showFilters={true}
            showHeader={true}
          />
        </Suspense>
      </main>
    </div>
  )
}