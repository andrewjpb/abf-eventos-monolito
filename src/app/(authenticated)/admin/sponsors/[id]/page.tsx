// /app/(admin)/sponsors/[id]/page.tsx
import { notFound } from "next/navigation"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { Separator } from "@/components/ui/separator"
import { sponsorsPath } from "@/app/paths"
import { SponsorDetail } from "@/features/sponsors/components/sponsor-detail"
import { getSponsor } from "@/features/sponsors/queries/get-sponsor"
import { getAuthWithPermissionOrRedirect } from "@/features/auth/queries/get-auth-with-permission-or-redirect"
type SponsorPageProps = Promise<{ id: string }>

export default async function SponsorPage({ params }: { params: SponsorPageProps }) {
  await getAuthWithPermissionOrRedirect("sponsors.view")

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
          { title: sponsor.name || "Detalhes do Patrocinador" }
        ]} />

      <Separator />
      <div className="animate-fade-in-from-top">
        <SponsorDetail sponsor={sponsor} />
      </div>
    </div>
  )
}