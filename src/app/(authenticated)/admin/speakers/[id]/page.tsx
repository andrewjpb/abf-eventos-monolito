// /app/(admin)/admin/speakers/[id]/page.tsx
import { notFound } from "next/navigation"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { Separator } from "@/components/ui/separator"
import { speakersPath } from "@/app/paths"
import { SpeakerDetail } from "@/features/speakers/components/speaker-detail"
import { getSpeaker } from "@/features/speakers/queries/get-speaker"
import { getAuthWithPermissionOrRedirect } from "@/features/auth/queries/get-auth-with-permission-or-redirect"
import { SpeakerWithAuth } from "@/features/speakers/types"
import { SpeakerEventsSelect } from "@/features/speakers/components/speaker-events-select"
import { getAvailableEvents } from "@/features/speakers/components/get-available-events"
import { SpeakerImageUpload } from "@/features/speakers/components/speaker-image-upload"

type SpeakerPageProps = Promise<{ id: string }>

export default async function SpeakerPage({ params }: { params: SpeakerPageProps }) {
  // Verificar se o usuário tem permissão para visualizar palestrantes
  await getAuthWithPermissionOrRedirect("speakers.view")

  const { id } = await params

  const speaker = await getSpeaker(id)

  if (!speaker) {
    return notFound()
  }

  // Buscar eventos disponíveis para o painel de seleção
  const availableEvents = await getAvailableEvents()

  return (
    <div className="flex-1 flex flex-col gap-y-8">
      <Breadcrumbs
        breadcrumbs={[
          { title: "Palestrantes", href: speakersPath() },
          { title: speaker.users.name || "Detalhes do Palestrante" }
        ]} />

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 animate-fade-in-from-top">
          <SpeakerDetail speaker={speaker as SpeakerWithAuth} />
        </div>

        <div>
          <SpeakerImageUpload
            speakerId={speaker.id}
            currentImageUrl={speaker.users.image_url || null}
            userName={speaker.users.name}
          />
        </div>
      </div>
    </div>
  )
}