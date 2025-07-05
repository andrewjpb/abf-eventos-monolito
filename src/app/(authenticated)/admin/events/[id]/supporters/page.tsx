import { Metadata } from "next"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getAdminEvent } from "@/features/events/admin/queries/get-admin-event"
import { EventSupportersManager } from "@/features/events/admin/components/event-supporters-manager"
import { Heading } from "@/components/heading"

interface EventSupportersPageProps {
  params: Promise<{
    id: string
  }>
}

export async function generateMetadata({ params }: EventSupportersPageProps): Promise<Metadata> {
  const { id } = await params
  const event = await getAdminEvent(id)

  return {
    title: `Apoiadores - ${event.title} - Admin`,
    description: `Gerenciar apoiadores do evento ${event.title}`,
    viewport: "width=device-width, initial-scale=1"
  }
}

export default async function EventSupportersPage({ params }: EventSupportersPageProps) {
  const { id } = await params
  const event = await getAdminEvent(id)

  return (
    <div className="flex-1 flex flex-col gap-y-8">
      <div className="flex justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">{event.title}</h1>
          <p className="text-muted-foreground">
            Gerencie os apoiadores associados a este evento
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
        <EventSupportersManager eventId={id} event={event} />
      </div>
    </div>
  )
}