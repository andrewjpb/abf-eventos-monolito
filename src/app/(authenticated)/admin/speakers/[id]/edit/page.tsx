// /app/(admin)/admin/speakers/[id]/edit/page.tsx
import { notFound } from "next/navigation"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { speakersPath, speakerPath } from "@/app/paths"
import { getSpeaker } from "@/features/speakers/queries/get-speaker"
import { getAuthWithPermissionOrRedirect } from "@/features/auth/queries/get-auth-with-permission-or-redirect"
import { SpeakerUpsertForm } from "@/features/speakers/components/speaker-upsert-form"
import { getAvailableUsers } from "@/features/speakers/components/get-available-users"

type EditSpeakerPageProps = Promise<{ id: string }>

export default async function EditSpeakerPage({ params }: { params: EditSpeakerPageProps }) {
  // Verificar se o usuário tem permissão para editar palestrantes
  await getAuthWithPermissionOrRedirect("speakers.update")

  const { id } = await params

  const speaker = await getSpeaker(id)

  if (!speaker) {
    return notFound()
  }

  // Buscar usuários disponíveis, excluindo os que já são palestrantes (exceto o atual)
  const availableUsers = await getAvailableUsers(id)

  return (
    <div className="flex-1 flex flex-col gap-y-8">
      <Breadcrumbs
        breadcrumbs={[
          { title: "Palestrantes", href: speakersPath() },
          { title: speaker.users.name, href: speakerPath(speaker.id) },
          { title: "Editar" }
        ]} />

      <Separator />

      <div className="max-w-2xl mx-auto w-full animate-fade-in-from-top">
        <Card>
          <CardHeader>
            <CardTitle>Editar Palestrante</CardTitle>
          </CardHeader>
          <CardContent>
            <SpeakerUpsertForm speaker={speaker} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}