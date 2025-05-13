// /app/(admin)/permissions/[id]/edit/page.tsx
import { Breadcrumbs } from "@/components/breadcrumbs"
import { CardCompact } from "@/components/cardCompact"
import { Separator } from "@/components/ui/separator"
import { permissionsPath, permissionPath } from "@/app/paths"
import { notFound } from "next/navigation"
import { PermissionUpsertForm } from "@/features/permissions/components/permission-upsert-form"
import { getPermission } from "@/features/permissions/queries/get-permission"
import { getAuthOrRedirect } from "@/features/auth/queries/get-auth-or-rerdirect"

type EditPermissionPageProps = Promise<{ id: string }>

export default async function EditPermissionPage({ params }: { params: EditPermissionPageProps }) {
  // Verificar autenticação
  await getAuthOrRedirect()

  const { id } = await params

  const permission = await getPermission(id)

  if (!permission) {
    return notFound()
  }

  return (
    <div className="flex-1 flex flex-col gap-y-8">
      <Breadcrumbs
        breadcrumbs={[
          { title: "Permissões", href: permissionsPath() },
          { title: permission.name || "Detalhes da Permissão", href: permissionPath(permission.id) },
          { title: "Editar" }
        ]} />

      <Separator />

      <div className="flex-1 flex flex-col justify-center items-center">
        <CardCompact
          title="Editar Permissão"
          description="Atualize as informações da permissão"
          className="w-full max-w-[800px] animate-fade-in-from-top"
          content={
            <PermissionUpsertForm permission={permission} />
          }
        />
      </div>
    </div>
  )
}