import { Metadata } from "next"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Heading } from "@/components/heading"
import { AdminEventUpsertForm } from "@/features/events/admin/components/admin-event-upsert-form"
import { getAvailableSpeakers } from "@/features/speakers/components/get-available-speakers"
import { getSponsors } from "@/features/sponsors/queries/get-sponsors"
import { getSupporters } from "@/features/supporters/queries/get-supporters"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = {
  title: "Criar Evento - Admin",
  description: "Criar um novo evento",
  viewport: "width=device-width, initial-scale=1"
}

export default async function CreateEventPage() {
  // Carregar dados necessários para o formulário
  const [speakers, sponsorsData, supportersData, states, cities] = await Promise.all([
    getAvailableSpeakers(),
    getSponsors({ active: 'ACTIVE' }),
    getSupporters({ active: 'ACTIVE' }),
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
      <div className="flex items-center justify-between gap-4">

        <h1 className="text-xl font-bold">Cadastro de evento</h1>
        <Link href="/admin/events">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
      </div>

      <div className="animate-fade-in-from-top">
        <AdminEventUpsertForm
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