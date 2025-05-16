// /app/(admin)/banners/create/page.tsx
import { Breadcrumbs } from "@/components/breadcrumbs"
import { CardCompact } from "@/components/cardCompact"
import { Separator } from "@/components/ui/separator"
import { bannersPath } from "@/app/paths"
import { BannerUpsertForm } from "@/features/banners/components/banner-upsert-form"
import { getAuthWithPermissionOrRedirect } from "@/features/auth/queries/get-auth-with-permission-or-redirect"

export default async function CreateBannerPage() {
  // Verificar autenticação
  await getAuthWithPermissionOrRedirect("banners.create")

  return (
    <div className="flex-1 flex flex-col gap-y-8">
      <Breadcrumbs
        breadcrumbs={[
          { title: "Banners", href: bannersPath() },
          { title: "Novo Banner" }
        ]} />

      <Separator />

      <div className="flex-1 flex flex-col justify-center items-center">
        <CardCompact
          title="Novo Banner"
          description="Cadastre um novo banner no sistema"
          className="w-full max-w-[800px] animate-fade-in-from-top"
          content={
            <BannerUpsertForm />
          }
        />
      </div>
    </div>
  )
}