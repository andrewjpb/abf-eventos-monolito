// /app/admin/roles/[id]/edit/page.tsx
import { Breadcrumbs } from "@/components/breadcrumbs"
import { CardCompact } from "@/components/cardCompact"
import { Separator } from "@/components/ui/separator"
import { rolesPath, rolePath } from "@/app/paths"
import { notFound } from "next/navigation"
import { RoleUpsertForm } from "@/features/roles/components/role-upsert-form"
import { getRole } from "@/features/roles/queries/get-role"

type EditRolePageProps = Promise<{ id: string }>

export default async function EditRolePage({ params }: { params: EditRolePageProps }) {
  const { id } = await params

  const role = await getRole(id)

  if (!role) {
    return notFound()
  }

  return (
    <div className="flex-1 flex flex-col gap-y-8">
      <Breadcrumbs
        breadcrumbs={[
          { title: "Funções", href: rolesPath() },
          { title: role.name || "Detalhes da Função", href: rolePath(role.id) },
          { title: "Editar" }
        ]} />

      <Separator />

      <div className="flex-1 flex flex-col justify-center items-center">
        <CardCompact
          title="Editar Função"
          description="Atualize as informações da função"
          className="w-full max-w-[800px] animate-fade-in-from-top"
          content={
            <RoleUpsertForm role={role} />
          }
        />
      </div>
    </div>
  )
}