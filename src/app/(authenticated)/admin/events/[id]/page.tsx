import { Metadata } from "next"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Heading } from "@/components/heading"
import { getAdminEvent } from "@/features/events/admin/queries/get-admin-event"
import { AdminEventDetail } from "@/features/events/admin/components/admin-event-detail"

interface EventDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export async function generateMetadata({ params }: EventDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const event = await getAdminEvent(id)

  return {
    title: `${event.title} - Admin`,
    description: event.summary,
    viewport: "width=device-width, initial-scale=1"
  }
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params
  const event = await getAdminEvent(id)

  return (
    <div className="flex-1 flex flex-col gap-y-8">
      <div className="flex items-center gap-4">
        <Link href="/admin/events">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>

      </div>

      <div className="animate-fade-in-from-top">
        <AdminEventDetail event={event} />
      </div>
    </div>
  )
}