// /app/(admin)/sponsors/[id]/edit/page.tsx
import { Breadcrumbs } from "@/components/breadcrumbs"
import { CardCompact } from "@/components/cardCompact"
import { Separator } from "@/components/ui/separator"
import { sponsorsPath, sponsorPath } from "@/app/paths"
import { notFound } from "next/navigation"
import { SponsorUpsertForm } from "@/features/sponsors/components/sponsor-upsert-form"
import { getSponsor } from "@/features/sponsors/queries/get-sponsor"
import { getAuthWithPermissionOrRedirect } from "@/features/auth/queries/get-auth-with-permission-or-redirect"
type EditSponsorPageProps = Promise<{ id: string }>

export default async function EditSponsorPage({ params }: { params: EditSponsorPageProps }) {
  await getAuthWithPermissionOrRedirect("sponsors.update")

  const { id } = await params

  const sponsor = await getSponsor(id)

  if (!sponsor) {
    return notFound()
  }

  return (
    <div className="flex-1 flex flex-col gap-y-8">
      <Breadcrumbs
        breadcrumbs={[
          { title: "Patrocinadores", href: sponsorsPath() },
          { title: sponsor.name || "Detalhes do Patrocinador", href: sponsorPath(sponsor.id) },
          { title: "Editar" }
        ]} />

      <Separator />

      <div className="flex-1 flex flex-col justify-center items-center">
        <CardCompact
          title="Editar Patrocinador"
          description="Atualize as informações do patrocinador"
          className="w-full max-w-[800px] animate-fade-in-from-top"
          content={
            <SponsorUpsertForm sponsor={sponsor} />
          }
        />
      </div>
    </div>
  )
}