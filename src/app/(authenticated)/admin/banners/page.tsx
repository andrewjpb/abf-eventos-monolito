// /app/(admin)/banners/page.tsx
import { BannersList } from "@/features/banners/components/banners-list"
import { searchParamsCache } from "@/features/banners/search-params"
import { SearchParams } from "nuqs"
import { getAuthWithPermissionOrRedirect } from "@/features/auth/queries/get-auth-with-permission-or-redirect"

export default async function BannersPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>
}) {
  await getAuthWithPermissionOrRedirect("banners.view")
  // Analisar parâmetros de busca
  const parsedParams = await searchParamsCache.parse(searchParams)

  return (
    <div className="flex-1 flex flex-col gap-y-8">
      <div className="animate-fade-in-from-top">
        <BannersList searchParams={parsedParams} />
      </div>
    </div>
  )
}