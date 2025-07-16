// /app/eventos/[id]/page.tsx
import { Suspense } from "react"
import { Metadata } from "next"
import { getEvent } from "@/features/events/queries/get-event"
import { getEvents } from "@/features/events/queries/get-events"
import { Spinner } from "@/components/spinner"
import { notFound } from "next/navigation"
import { EventDetail } from "@/features/events/components/event-detail"
import { generateEventMetadata } from "@/lib/metadata"

type EventPageProps = Promise<{ id: string }>

export async function generateMetadata({ params }: { params: EventPageProps }): Promise<Metadata> {
  const { id } = await params
  const eventData = await getEvent(id)

  if (!eventData) {
    return {
      title: "Evento não encontrado - ABF Eventos",
      description: "O evento solicitado não foi encontrado."
    }
  }

  const { event } = eventData

  // Formatar data do evento
  const eventDate = new Date(event.date)
  const eventDateFormatted = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(eventDate)

  // Formatar endereço
  let locationInfo = ""
  if (event.format === "ONLINE") {
    locationInfo = "Evento Online"
  } else if (event.address) {
    const { cities, states } = event.address
    locationInfo = `${cities.name}, ${states.uf}`
  } else {
    locationInfo = "Local a definir"
  }

  // Descrição para SEO
  const description = event.summary ||
    `Participe do evento ${event.title} em ${eventDateFormatted}. ${locationInfo}. Inscreva-se agora!`

  // URL absoluta para Open Graph
  const eventUrl = `${process.env.NEXT_PUBLIC_APP_URL}/eventos/${event.id}`

  // Keywords específicas do evento
  const eventKeywords = [
    event.title,
    locationInfo,
    eventDateFormatted,
    event.format === "ONLINE" ? "online" : "presencial",
    "franchising",
    "networking"
  ]

  return generateEventMetadata({
    title: event.title,
    description,
    image: event.image_url || event.thumb_url,
    url: eventUrl,
    keywords: eventKeywords,
    publishedTime: event.created_at?.toISOString(),
    modifiedTime: event.updatedAt?.toISOString(),
    isPublished: event.isPublished
  })
}

export default async function EventPage({ params }: { params: EventPageProps }) {
  const { id } = await params
  const eventData = await getEvent(id)
  if (!eventData) {
    return notFound()
  }
  const { event, isRegistered, attendanceId, isAdmin, user, canRegister, remainingVacancies, companyRemainingVacancies, companyAttendees, occupationPercentage, hasEventCreatePermission } = eventData

  // Buscar próximos eventos (excluindo o evento atual)
  const upcomingEventsData = await getEvents({
    past: false,
    limit: 6
  })

  // Filtrar para remover o evento atual
  const upcomingEvents = upcomingEventsData.events.filter(e => e.id !== event.id)

  return (
    <div className="flex-1 flex flex-col gap-y-8 mt-6">
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
            companyAttendees={companyAttendees}
            occupationPercentage={occupationPercentage}
            upcomingEvents={upcomingEvents}
            hasEventCreatePermission={hasEventCreatePermission}
          />
        </Suspense>
      </div>
    </div>
  )
}