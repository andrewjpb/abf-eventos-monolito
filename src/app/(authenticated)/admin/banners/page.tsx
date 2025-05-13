// /app/(admin)/banners/page.tsx
import { BannersList } from "@/features/banners/components/banners-list"
import { searchParamsCache } from "@/features/banners/search-params"
import { getAuthOrRedirect } from "@/features/auth/queries/get-auth-or-rerdirect"
import { SearchParams } from "nuqs"

export default async function BannersPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>
}) {

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