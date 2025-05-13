// /app/(admin)/roles/[id]/page.tsx
import { notFound } from "next/navigation"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { Separator } from "@/components/ui/separator"
import { rolesPath } from "@/app/paths"
import { RoleDetail } from "@/features/roles/components/role-detail"
import { getRole } from "@/features/roles/queries/get-role"
import { getAuthOrRedirect } from "@/features/auth/queries/get-auth-or-rerdirect"

type RolePageProps = Promise<{ id: string }>

export default async function RolePage({ params }: { params: RolePageProps }) {
  // Verificar autenticação
  await getAuthOrRedirect()

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
          { title: role.name || "Detalhes da Função" }
        ]} />

      <Separator />
      <div className="animate-fade-in-from-top">
        <RoleDetail role={role} />
      </div>
    </div>
  )
}