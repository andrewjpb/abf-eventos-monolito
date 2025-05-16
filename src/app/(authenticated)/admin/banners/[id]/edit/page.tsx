// /app/(admin)/banners/[id]/edit/page.tsx
import { Breadcrumbs } from "@/components/breadcrumbs"
import { CardCompact } from "@/components/cardCompact"
import { Separator } from "@/components/ui/separator"
import { bannersPath, bannerPath } from "@/app/paths"
import { notFound } from "next/navigation"
import { BannerUpsertForm } from "@/features/banners/components/banner-upsert-form"
import { getBanner } from "@/features/banners/queries/get-banner"
import { getAuthWithPermissionOrRedirect } from "@/features/auth/queries/get-auth-with-permission-or-redirect"

type EditBannerPageProps = Promise<{ id: string }>

export default async function EditBannerPage({ params }: { params: EditBannerPageProps }) {
  // Verificar autenticação
  await getAuthWithPermissionOrRedirect("banners.update")

  const { id } = await params

  const banner = await getBanner(id)

  if (!banner) {
    return notFound()
  }

  return (
    <div className="flex-1 flex flex-col gap-y-8">
      <Breadcrumbs
        breadcrumbs={[
          { title: "Banners", href: bannersPath() },
          { title: banner.title || "Detalhes do Banner", href: bannerPath(banner.id) },
          { title: "Editar" }
        ]} />

      <Separator />

      <div className="flex-1 flex flex-col justify-center items-center">
        <CardCompact
          title="Editar Banner"
          description="Atualize as informações do banner"
          className="w-full max-w-[800px] animate-fade-in-from-top"
          content={
            <BannerUpsertForm banner={banner} />
          }
        />
      </div>
    </div>
  )
}