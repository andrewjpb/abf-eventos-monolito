// /app/admin/supporters/page.tsx
import { SupportersList } from "@/features/supporters/components/supporters-list"
import { searchParamsCache } from "@/features/supporters/search-params"
import { SearchParams } from "nuqs"
import { getAuthWithPermissionOrRedirect } from "@/features/auth/queries/get-auth-with-permission-or-redirect"
export default async function SupportersPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>
}) {
  await getAuthWithPermissionOrRedirect("supporters.view")

  const parsedParams = await searchParamsCache.parse(searchParams)

  return (
    <main className="container mx-auto py-6">
      <SupportersList searchParams={parsedParams} />
    </main>
  )
}