// /app/(authenticated)/logs/page.tsx
import { Suspense } from "react"
import { Spinner } from "@/components/spinner"
import { getAuth } from "@/features/auth/queries/get-auth"
import { homePath, } from "@/app/paths"
import { redirect } from "next/navigation"
import { SearchParams } from "nuqs/server"
import { searchParamsCache } from "@/features/logs/search-params"
import { LogsList } from "@/features/logs/components/logs-list"

export default async function LogsPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>
}) {

  // Processar parâmetros de busca
  const parsedParams = await searchParamsCache.parse(searchParams)

  return (
    <div className="flex-1 flex flex-col gap-y-8">
      <Suspense fallback={<div className="flex justify-center py-8"><Spinner /></div>}>
        <div className="animate-fade-in-from-top">
          <LogsList
            searchParams={{
              level: parsedParams.level,
              userId: parsedParams.userId,
              action: parsedParams.action,
              startDate: parsedParams.startDate,
              endDate: parsedParams.endDate
            }}
            showActions={true}
          />
        </div>
      </Suspense>
    </div>
  )
}