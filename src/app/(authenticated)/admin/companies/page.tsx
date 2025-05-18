// /app/admin/companies/page.tsx
import { CompaniesList } from "@/features/companies/components/companies-list"
import { searchParamsCache } from "@/features/companies/search-params"
import { SearchParams } from "nuqs"
import { getAuthWithPermissionOrRedirect } from "@/features/auth/queries/get-auth-with-permission-or-redirect"

export default async function CompaniesPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>
}) {
  await getAuthWithPermissionOrRedirect("companies.view")
  const parsedParams = await searchParamsCache.parse(searchParams)

  return (
    <main className="container mx-auto py-6">
      <CompaniesList searchParams={parsedParams} />
    </main>
  )
}