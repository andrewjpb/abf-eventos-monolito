// /app/admin/supporters/page.tsx
import { SupportersList } from "@/features/supporters/components/supporters-list"
import { searchParamsCache } from "@/features/supporters/search-params"
import { SearchParams } from "nuqs"

export default async function SupportersPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>
}) {
  const parsedParams = await searchParamsCache.parse(searchParams)

  return (
    <main className="container mx-auto py-6">
      <SupportersList searchParams={parsedParams} />
    </main>
  )
}