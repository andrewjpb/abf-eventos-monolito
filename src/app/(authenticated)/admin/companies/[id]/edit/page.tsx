// /app/admin/companies/[id]/edit/page.tsx
import { Breadcrumbs } from "@/components/breadcrumbs"
import { CardCompact } from "@/components/cardCompact"
import { Separator } from "@/components/ui/separator"
import { companiesPath, companyPath } from "@/app/paths"
import { notFound } from "next/navigation"
import { CompanyUpsertForm } from "@/features/companies/components/company-upsert-form"
import { getCompany } from "@/features/companies/queries/get-company"
import { getAuthWithPermissionOrRedirect } from "@/features/auth/queries/get-auth-with-permission-or-redirect"

type EditCompanyPageProps = Promise<{ id: string }>

export default async function EditCompanyPage({ params }: { params: EditCompanyPageProps }) {
  await getAuthWithPermissionOrRedirect("companies.update")
  const { id } = await params

  const company = await getCompany(id)

  if (!company) {
    return notFound()
  }

  return (
    <div className="flex-1 flex flex-col gap-y-8">
      <Breadcrumbs
        breadcrumbs={[
          { title: "Empresas", href: companiesPath() },
          { title: company.name || "Detalhes da Empresa", href: companyPath(company.id) },
          { title: "Editar" }
        ]} />

      <Separator />

      <div className="flex-1 flex flex-col justify-center items-center">
        <CardCompact
          title="Editar Empresa"
          description="Atualize as informações da empresa"
          className="w-full max-w-[800px] animate-fade-in-from-top"
          content={
            <CompanyUpsertForm company={company} />
          }
        />
      </div>
    </div>
  )
}