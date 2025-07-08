import { Metadata } from "next"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Heading } from "@/components/heading"
import { getAdminEvent } from "@/features/events/admin/queries/get-admin-event"
import { AdminEventUpsertForm } from "@/features/events/admin/components/admin-event-upsert-form"
import { getAvailableSpeakers } from "@/features/speakers/components/get-available-speakers"
import { getSponsors } from "@/features/sponsors/queries/get-sponsors"
import { getSupporters } from "@/features/supporters/queries/get-supporters"
import { prisma } from "@/lib/prisma"

interface EditEventPageProps {
  params: Promise<{
    id: string
  }>
}

export async function generateMetadata({ params }: EditEventPageProps): Promise<Metadata> {
  const { id } = await params
  const event = await getAdminEvent(id)

  return {
    title: `Editar ${event.title} - Admin`,
    description: `Editar evento: ${event.summary}`,
    viewport: "width=device-width, initial-scale=1"
  }
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { id } = await params

  // Carregar evento e dados necessários para o formulário
  const [event, speakers, sponsorsData, supportersData, states, cities] = await Promise.all([
    getAdminEvent(id),
    getAvailableSpeakers(),
    getSponsors(),
    getSupporters(),
    prisma.states.findMany({
      select: {
        id: true,
        name: true,
        uf: true
      },
      orderBy: {
        name: 'asc'
      }
    }),
    prisma.cities.findMany({
      select: {
        id: true,
        name: true,
        stateId: true
      },
      where: {
        stateId: {
          not: null
        }
      },
      orderBy: {
        name: 'asc'
      }
    })
  ])

  const sponsorOptions = sponsorsData.sponsors.map(sponsor => ({
    id: sponsor.id,
    name: sponsor.name
  }))

  const supporterOptions = supportersData.supporters.map(supporter => ({
    id: supporter.id,
    name: supporter.name
  }))

  const speakerOptions = speakers.map(speaker => ({
    id: speaker.id,
    name: speaker.name,
    email: speaker.email,
    position: speaker.position || ""
  }))

  return (
    <div className="flex-1 flex flex-col gap-y-8">
      <div className="flex items-center gap-4">
        <Link href={`/admin/events/${id}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>

      </div>

      <div className="animate-fade-in-from-top">
        <AdminEventUpsertForm
          event={event}
          speakers={speakerOptions}
          sponsors={sponsorOptions}
          supporters={supporterOptions}
          states={states}
          cities={cities}
        />
      </div>
    </div>
  )
}