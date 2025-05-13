// /app/(admin)/supporters/[id]/edit/page.tsx
import { Breadcrumbs } from "@/components/breadcrumbs"
import { CardCompact } from "@/components/cardCompact"
import { Separator } from "@/components/ui/separator"
import { supportersPath, supporterPath } from "@/app/paths"
import { notFound } from "next/navigation"
import { SupporterUpsertForm } from "@/features/supporters/components/supporter-upsert-form"
import { getSupporter } from "@/features/supporters/queries/get-supporter"

type EditSupporterPageProps = Promise<{ id: string }>

export default async function EditSupporterPage({ params }: { params: EditSupporterPageProps }) {
  const { id } = await params

  const supporter = await getSupporter(id)

  if (!supporter) {
    return notFound()
  }

  return (
    <div className="flex-1 flex flex-col gap-y-8">
      <Breadcrumbs
        breadcrumbs={[
          { title: "Apoiadores", href: supportersPath() },
          { title: supporter.name || "Detalhes do Apoiador", href: supporterPath(supporter.id) },
          { title: "Editar" }
        ]} />

      <Separator />

      <div className="flex-1 flex flex-col justify-center items-center">
        <CardCompact
          title="Editar Apoiador"
          description="Atualize as informações do apoiador"
          className="w-full max-w-[800px] animate-fade-in-from-top"
          content={
            <SupporterUpsertForm supporter={supporter} />
          }
        />
      </div>
    </div>
  )
}