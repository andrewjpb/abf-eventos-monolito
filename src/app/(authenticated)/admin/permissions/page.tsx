// /app/(admin)/permissions/page.tsx
import { PermissionsList } from "@/features/permissions/components/permissions-list"
import { searchParamsCache } from "@/features/permissions/search-params"
import { SearchParams } from "nuqs"
import { getPermissionOrRedirect } from "@/features/auth/queries/get-permission-or-redirect"

export default async function PermissionsPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>
}) {
  // Verificar se o usuário tem permissão para visualizar permissões
  await getPermissionOrRedirect("permissions.view")

  const parsedParams = await searchParamsCache.parse(searchParams)

  return (
    <main className="container mx-auto py-6">
      <PermissionsList searchParams={parsedParams} />
    </main>
  )
}