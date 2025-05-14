// /app/admin/roles/page.tsx
import { RolesList } from "@/features/roles/components/roles-list"
import { searchParamsCache } from "@/features/roles/search-params"
import { SearchParams } from "nuqs"

export default async function RolesPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>
}) {
  const parsedParams = await searchParamsCache.parse(searchParams)

  return (
    <main className="container mx-auto py-6">
      <RolesList searchParams={parsedParams} />
    </main>
  )
}