// /app/admin/companies/[id]/page.tsx
import { notFound } from "next/navigation"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { Separator } from "@/components/ui/separator"
import { companiesPath } from "@/app/paths"
import { CompanyDetail } from "@/features/companies/components/company-detail"
import { getCompany } from "@/features/companies/queries/get-company"
import { getAuthWithPermissionOrRedirect } from "@/features/auth/queries/get-auth-with-permission-or-redirect"

type CompanyPageProps = Promise<{ id: string }>

export default async function CompanyPage({ params }: { params: CompanyPageProps }) {
  await getAuthWithPermissionOrRedirect("companies.view")
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
          { title: company.name || "Detalhes da Empresa" }
        ]} />

      <Separator />
      <div className="animate-fade-in-from-top">
        <CompanyDetail company={company} />
      </div>
    </div>
  )
}