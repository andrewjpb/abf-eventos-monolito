// /app/admin/sponsors/page.tsx
import { SponsorsList } from "@/features/sponsors/components/sponsors-list"
import { searchParamsCache } from "@/features/sponsors/search-params"
import { SearchParams } from "nuqs"
import { getAuthWithPermissionOrRedirect } from "@/features/auth/queries/get-auth-with-permission-or-redirect"
export default async function SponsorsPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>
}) {
  await getAuthWithPermissionOrRedirect("sponsors.view")
  const parsedParams = await searchParamsCache.parse(searchParams)

  return (
    <main className="container mx-auto py-6">
      <SponsorsList searchParams={parsedParams} />
    </main>
  )
}