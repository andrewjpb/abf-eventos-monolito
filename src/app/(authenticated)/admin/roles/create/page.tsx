// /app/admin/roles/create/page.tsx
import { Breadcrumbs } from "@/components/breadcrumbs"
import { CardCompact } from "@/components/cardCompact"
import { Separator } from "@/components/ui/separator"
import { rolesPath } from "@/app/paths"
import { RoleUpsertForm } from "@/features/roles/components/role-upsert-form"

export default async function CreateRolePage() {
  return (
    <div className="flex-1 flex flex-col gap-y-8">
      <Breadcrumbs
        breadcrumbs={[
          { title: "Funções", href: rolesPath() },
          { title: "Nova Função" }
        ]} />

      <Separator />

      <div className="flex-1 flex flex-col justify-center items-center">
        <CardCompact
          title="Nova Função"
          description="Cadastre uma nova função no sistema"
          className="w-full max-w-[800px] animate-fade-in-from-top"
          content={
            <RoleUpsertForm />
          }
        />
      </div>
    </div>
  )
}