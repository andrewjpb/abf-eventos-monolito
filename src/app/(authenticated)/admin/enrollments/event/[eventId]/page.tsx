// /app/(admin)/enrollments/event/[eventId]/page.tsx
import { notFound } from "next/navigation"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { Separator } from "@/components/ui/separator"
import { enrollmentsPath } from "@/app/paths"
import { EventEnrollmentDetail } from "@/features/enrollments/components/event-enrollment-detail"
import { EnrollmentsList } from "@/features/enrollments/components/enrollments-list"
import { getEventEnrollmentStats } from "@/features/enrollments/queries/get-event-enrollment-stats"
import { searchParamsCache } from "@/features/enrollments/search-params"
import { SearchParams } from "nuqs"
import { getAuthWithPermissionOrRedirect } from "@/features/auth/queries/get-auth-with-permission-or-redirect"
import { Card } from "@/components/ui/card"

type EventEnrollmentsPageProps = Promise<{ eventId: string }>

export default async function EventEnrollmentsPage({
  params,
  searchParams
}: {
  params: EventEnrollmentsPageProps
  searchParams: Promise<SearchParams>
}) {
  // Verificar autenticação
  await getAuthWithPermissionOrRedirect("enrollments.view")

  const { eventId } = await params
  const parsedParams = await searchParamsCache.parse(searchParams)

  const eventStats = await getEventEnrollmentStats(eventId)

  if (!eventStats) {
    return notFound()
  }

  return (
    <div className="flex-1 flex flex-col gap-y-8">
      <Breadcrumbs
        breadcrumbs={[
          { title: "Inscrições", href: enrollmentsPath() },
          { title: eventStats.event.title || "Inscrições do Evento" }
        ]}
      />

      <Separator />

      <div className="animate-fade-in-from-top space-y-6">
        {/* Detalhes e estatísticas do evento */}
        <EventEnrollmentDetail stats={eventStats} />

        {/* Lista de inscrições do evento */}
        <Card className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Lista de Inscritos</h3>
            <EnrollmentsList
              searchParams={{
                ...parsedParams,
                eventId: eventId // Forçar o filtro para este evento específico
              }}
              events={[{
                id: eventStats.event.id,
                title: eventStats.event.title
              }]}
              segments={[]}
              types={[]}
              fixedEventId={eventId}
              fixedEventTitle={eventStats.event.title}
            />
          </div>
        </Card>
      </div>
    </div>
  )
}