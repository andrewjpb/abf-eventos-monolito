import { Metadata } from "next"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getAdminEvent } from "@/features/events/admin/queries/get-admin-event"
import { EventSpeakersManager } from "@/features/events/admin/components/event-speakers-manager"
import { Heading } from "@/components/heading"

interface EventSpeakersPageProps {
  params: Promise<{
    id: string
  }>
}

export async function generateMetadata({ params }: EventSpeakersPageProps): Promise<Metadata> {
  const { id } = await params
  const event = await getAdminEvent(id)

  return {
    title: `Palestrantes - ${event.title} - Admin`,
    description: `Gerenciar palestrantes do evento ${event.title}`
  }
}

export default async function EventSpeakersPage({ params }: EventSpeakersPageProps) {
  const { id } = await params
  const event = await getAdminEvent(id)

  return (
    <div className="flex-1 flex flex-col gap-y-8">
      <div className="flex justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">{event.title}</h1>
          <p className="text-muted-foreground">
            Gerencie os palestrantes associados a este evento
          </p>
        </div>
        <Link href={`/admin/events/${id}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
      </div>

      <div className="animate-fade-in-from-top">
        <EventSpeakersManager eventId={id} event={event} />
      </div>
    </div>
  )
}