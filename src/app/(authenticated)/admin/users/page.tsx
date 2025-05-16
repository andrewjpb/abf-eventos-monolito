import { SearchParams } from "nuqs/server"
import { Suspense } from "react"
import { Spinner } from "@/components/spinner"
import { searchParamsCache } from "@/features/users/search-params"
import { UserGrid } from "@/features/users/components/user-grid"
import { getUsers } from "@/features/users/queries/get-users"
import { getAuthWithPermissionOrRedirect } from "@/features/auth/queries/get-auth-with-permission-or-redirect"

type UsersPageProps = {
  searchParams: Promise<SearchParams>
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  await getAuthWithPermissionOrRedirect("users.view")

  const parsedParams = await searchParamsCache.parse(searchParams)

  // Buscar usuários iniciais com os filtros da URL
  const initialUsers = await getUsers({
    search: parsedParams.search,
    status: parsedParams.status as any,
    take: 9
  })

  return (
    <div className="flex-1 animate-fade-in-from-top ">
      <Suspense fallback={<div className="flex justify-center py-8"><Spinner /></div>}>
        <UserGrid
          initialUsers={initialUsers}
          initialSearch={parsedParams.search}
          initialStatus={parsedParams.status}
        />
      </Suspense>
    </div>
  )
}

