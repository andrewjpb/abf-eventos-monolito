// /app/(admin)/admin/speakers/create/page.tsx
import { Breadcrumbs } from "@/components/breadcrumbs"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { speakersPath } from "@/app/paths"
import { getAuthWithPermissionOrRedirect } from "@/features/auth/queries/get-auth-with-permission-or-redirect"
import { SpeakerUpsertForm } from "@/features/speakers/components/speaker-upsert-form"
import { getAvailableUsers } from "@/features/speakers/components/get-available-users"

export default async function CreateSpeakerPage() {
  // Verificar se o usuário tem permissão para criar palestrantes
  await getAuthWithPermissionOrRedirect("speakers.create")

  // Buscar usuários disponíveis para o formulário
  const availableUsers = await getAvailableUsers()

  return (
    <div className="flex-1 flex flex-col gap-y-8">
      <Breadcrumbs
        breadcrumbs={[
          { title: "Palestrantes", href: speakersPath() },
          { title: "Novo Palestrante" }
        ]} />

      <Separator />

      <div className="max-w-2xl mx-auto w-full animate-fade-in-from-top">
        <Card>
          <CardHeader>
            <CardTitle>Cadastrar Novo Palestrante</CardTitle>
          </CardHeader>
          <CardContent>
            <SpeakerUpsertForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}