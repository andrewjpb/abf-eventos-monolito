// /app/(admin)/sponsors/create/page.tsx
import { Breadcrumbs } from "@/components/breadcrumbs"
import { CardCompact } from "@/components/cardCompact"
import { Separator } from "@/components/ui/separator"
import { sponsorsPath } from "@/app/paths"
import { SponsorUpsertForm } from "@/features/sponsors/components/sponsor-upsert-form"

export default async function CreateSponsorPage() {


  return (
    <div className="flex-1 flex flex-col gap-y-8">
      <Breadcrumbs
        breadcrumbs={[
          { title: "Patrocinadores", href: sponsorsPath() },
          { title: "Novo Patrocinador" }
        ]} />

      <Separator />

      <div className="flex-1 flex flex-col justify-center items-center">
        <CardCompact
          title="Novo Patrocinador"
          description="Cadastre um novo patrocinador no sistema"
          className="w-full max-w-[800px] animate-fade-in-from-top"
          content={
            <SponsorUpsertForm />
          }
        />
      </div>
    </div>
  )
}

