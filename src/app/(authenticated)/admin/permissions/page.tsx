// /app/(admin)/permissions/page.tsx
import { Suspense } from "react"
import { Spinner } from "@/components/spinner"
import { getAuthOrRedirect } from "@/features/auth/queries/get-auth-or-rerdirect"
import { SearchParams } from "nuqs/server"
import { searchParamsCache } from "@/features/roles/search-params"
import { PermissionsList } from "@/features/permissions/components/permissions-list"

export default async function PermissionsPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>
}) {
  // Verificar autenticação
  await getAuthOrRedirect()

  // Processar parâmetros de busca
  const parsedParams = await searchParamsCache.parse(searchParams)

  return (
    <div className="flex-1 flex flex-col gap-y-8">
      <Suspense fallback={<div className="flex justify-center py-8"><Spinner /></div>}>
        <div className="animate-fade-in-from-top">
          <PermissionsList
            searchParams={parsedParams}
            showActions={true}
          />
        </div>
      </Suspense>
    </div>
  )
}