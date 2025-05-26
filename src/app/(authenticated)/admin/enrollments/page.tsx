// /app/(admin)/enrollments/page.tsx
import { EnrollmentsList } from "@/features/enrollments/components/enrollments-list"
import { getEnrollmentFilterData } from "@/features/enrollments/queries/get-enrollment-filter-data"
import { searchParamsCache } from "@/features/enrollments/search-params"
import { SearchParams } from "nuqs"
import { getAuthWithPermissionOrRedirect } from "@/features/auth/queries/get-auth-with-permission-or-redirect"

export default async function EnrollmentsPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>
}) {
  await getAuthWithPermissionOrRedirect("enrollments.view")

  // Analisar parâmetros de busca
  const parsedParams = await searchParamsCache.parse(searchParams)

  // Buscar dados para os filtros
  const filterData = await getEnrollmentFilterData()

  return (
    <div className="flex-1 flex flex-col gap-y-8">
      <div className="animate-fade-in-from-top">
        <EnrollmentsList
          searchParams={parsedParams}
          events={filterData.events}
          segments={filterData.segments}
          types={filterData.types}
        />
      </div>
    </div>
  )
}