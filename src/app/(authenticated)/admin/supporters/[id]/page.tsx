// /app/(admin)/supporters/[id]/page.tsx
import { notFound } from "next/navigation"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { Separator } from "@/components/ui/separator"
import { supportersPath } from "@/app/paths"
import { SupporterDetail } from "@/features/supporters/components/supporter-detail"
import { getSupporter } from "@/features/supporters/queries/get-supporter"

type SupporterPageProps = Promise<{ id: string }>

export default async function SupporterPage({ params }: { params: SupporterPageProps }) {
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
          { title: supporter.name || "Detalhes do Apoiador" }
        ]} />

      <Separator />
      <div className="animate-fade-in-from-top">
        <SupporterDetail supporter={supporter} />
      </div>
    </div>
  )
}