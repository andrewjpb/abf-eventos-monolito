// /app/(admin)/permissions/[id]/page.tsx
import { notFound } from "next/navigation"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { Separator } from "@/components/ui/separator"
import { permissionsPath } from "@/app/paths"
import { PermissionDetail } from "@/features/permissions/components/permission-detail"
import { getPermission } from "@/features/permissions/queries/get-permission"
import { getAuthOrRedirect } from "@/features/auth/queries/get-auth-or-rerdirect"

type PermissionPageProps = Promise<{ id: string }>

export default async function PermissionPage({ params }: { params: PermissionPageProps }) {
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
          { title: permission.name || "Detalhes da Permissão" }
        ]} />

      <Separator />
      <div className="animate-fade-in-from-top">
        <PermissionDetail permission={permission} />
      </div>
    </div>
  )
}