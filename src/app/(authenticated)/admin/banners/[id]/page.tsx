// /app/(admin)/banners/[id]/page.tsx
import { notFound } from "next/navigation"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { Separator } from "@/components/ui/separator"
import { bannersPath } from "@/app/paths"
import { BannerDetail } from "@/features/banners/components/banner-detail"
import { getBanner } from "@/features/banners/queries/get-banner"
import { getAuthOrRedirect } from "@/features/auth/queries/get-auth-or-rerdirect"

type BannerPageProps = Promise<{ id: string }>

export default async function BannerPage({ params }: { params: BannerPageProps }) {
  // Verificar autenticação
  await getAuthOrRedirect()

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
          { title: banner.title || "Detalhes do Banner" }
        ]} />

      <Separator />
      <div className="animate-fade-in-from-top">
        <BannerDetail banner={banner} />
      </div>
    </div>
  )
}