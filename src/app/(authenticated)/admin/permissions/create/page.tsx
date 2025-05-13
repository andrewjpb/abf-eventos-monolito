// /app/(admin)/permissions/create/page.tsx
import { Breadcrumbs } from "@/components/breadcrumbs"
import { CardCompact } from "@/components/cardCompact"
import { Separator } from "@/components/ui/separator"
import { permissionsPath } from "@/app/paths"
import { PermissionUpsertForm } from "@/features/permissions/components/permission-upsert-form"
import { getAuthOrRedirect } from "@/features/auth/queries/get-auth-or-rerdirect"

export default async function CreatePermissionPage() {
  // Verificar autenticação
  await getAuthOrRedirect()

  return (
    <div className="flex-1 flex flex-col gap-y-8">
      <Breadcrumbs
        breadcrumbs={[
          { title: "Permissões", href: permissionsPath() },
          { title: "Nova Permissão" }
        ]} />

      <Separator />

      <div className="flex-1 flex flex-col justify-center items-center">
        <CardCompact
          title="Nova Permissão"
          description="Cadastre uma nova permissão no sistema"
          className="w-full max-w-[800px] animate-fade-in-from-top"
          content={
            <PermissionUpsertForm />
          }
        />
      </div>
    </div>
  )
}