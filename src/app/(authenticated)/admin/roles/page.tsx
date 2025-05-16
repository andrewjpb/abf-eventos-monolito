// /app/admin/roles/page.tsx
import { RolesList } from "@/features/roles/components/roles-list"
import { searchParamsCache } from "@/features/roles/search-params"
import { SearchParams } from "nuqs"
import { getAuthWithPermissionOrRedirect } from "@/features/auth/queries/get-auth-with-permission-or-redirect"
export default async function RolesPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>
}) {
  await getAuthWithPermissionOrRedirect("roles.view")
  const parsedParams = await searchParamsCache.parse(searchParams)

  return (
    <main className="container mx-auto py-6">
      <RolesList searchParams={parsedParams} />
    </main>
  )
}