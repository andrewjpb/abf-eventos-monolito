// /app/admin/companies/create/page.tsx
import { Breadcrumbs } from "@/components/breadcrumbs"
import { CardCompact } from "@/components/cardCompact"
import { Separator } from "@/components/ui/separator"
import { companiesPath } from "@/app/paths"
import { CompanyUpsertForm } from "@/features/companies/components/company-upsert-form"
import { getAuthWithPermissionOrRedirect } from "@/features/auth/queries/get-auth-with-permission-or-redirect"

export default async function CreateCompanyPage() {
  await getAuthWithPermissionOrRedirect("companies.create")

  return (
    <div className="flex-1 flex flex-col gap-y-8">
      <Breadcrumbs
        breadcrumbs={[
          { title: "Empresas", href: companiesPath() },
          { title: "Nova Empresa" }
        ]} />

      <Separator />

      <div className="flex-1 flex flex-col justify-center items-center">
        <CardCompact
          title="Nova Empresa"
          description="Cadastre uma nova empresa no sistema"
          className="w-full max-w-[800px] animate-fade-in-from-top"
          content={
            <CompanyUpsertForm />
          }
        />
      </div>
    </div>
  )
}