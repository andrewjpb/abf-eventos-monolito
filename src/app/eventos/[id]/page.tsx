// /app/eventos/[id]/page.tsx
import { Suspense } from "react"
import { getEvent } from "@/features/events/queries/get-event"
import { getEvents } from "@/features/events/queries/get-events"
import { Spinner } from "@/components/spinner"
import { notFound } from "next/navigation"
import { EventDetail } from "@/features/events/components/event-detail"

type EventPageProps = Promise<{ id: string }>

export default async function EventPage({ params }: { params: EventPageProps }) {
  const { id } = await params
  const eventData = await getEvent(id)
  if (!eventData) {
    return notFound()
  }
  const { event, isRegistered, attendanceId, isAdmin, user, canRegister, remainingVacancies, companyRemainingVacancies, occupationPercentage } = eventData

  // Buscar próximos eventos (excluindo o evento atual)
  const upcomingEventsData = await getEvents({
    past: false,
    limit: 6
  })
  
  // Filtrar para remover o evento atual
  const upcomingEvents = upcomingEventsData.events.filter(e => e.id !== event.id)

  return (
    <div className="flex-1 flex flex-col gap-y-8 mt-10">
      <div className="animate-fade-in-from-top">
        <Suspense fallback={<div className="flex justify-center py-8"><Spinner /></div>}>
          <EventDetail
            event={event}
            isRegistered={isRegistered}
            attendanceId={attendanceId}
            isAdmin={isAdmin}
            user={user}
            canRegister={canRegister}
            remainingVacancies={remainingVacancies}
            companyRemainingVacancies={companyRemainingVacancies}
            occupationPercentage={occupationPercentage}
            upcomingEvents={upcomingEvents}
          />
        </Suspense>
      </div>
    </div>
  )
}