// /app/admin/sponsors/page.tsx
import { SponsorsList } from "@/features/sponsors/components/sponsors-list"
import { searchParamsCache } from "@/features/sponsors/search-params"
import { SearchParams } from "nuqs"

export default async function SponsorsPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>
}) {
  const parsedParams = await searchParamsCache.parse(searchParams)

  return (
    <main className="container mx-auto py-6">
      <SponsorsList searchParams={parsedParams} />
    </main>
  )
}