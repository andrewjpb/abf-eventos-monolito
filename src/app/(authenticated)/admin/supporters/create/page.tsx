// /app/(admin)/supporters/create/page.tsx
import { Breadcrumbs } from "@/components/breadcrumbs"
import { CardCompact } from "@/components/cardCompact"
import { Separator } from "@/components/ui/separator"
import { supportersPath } from "@/app/paths"
import { SupporterUpsertForm } from "@/features/supporters/components/supporter-upsert-form"

export default async function CreateSupporterPage() {
  return (
    <div className="flex-1 flex flex-col gap-y-8">
      <Breadcrumbs
        breadcrumbs={[
          { title: "Apoiadores", href: supportersPath() },
          { title: "Novo Apoiador" }
        ]} />

      <Separator />

      <div className="flex-1 flex flex-col justify-center items-center">
        <CardCompact
          title="Novo Apoiador"
          description="Cadastre um novo apoiador no sistema"
          className="w-full max-w-[800px] animate-fade-in-from-top"
          content={
            <SupporterUpsertForm />
          }
        />
      </div>
    </div>
  )
}