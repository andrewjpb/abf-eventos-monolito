import { SearchParams } from "nuqs/server"
import { Suspense } from "react"
import { Spinner } from "@/components/spinner"
import { searchParamsCache } from "@/features/users/search-params"
import { UserGrid } from "@/features/users/components/user-grid"
import { getUsers } from "@/features/users/queries/get-users"
import { redirect } from "next/navigation"

type UsersPageProps = {
  searchParams: Promise<SearchParams>
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const parsedParams = await searchParamsCache.parse(searchParams)

  // Buscar usuários iniciais com os filtros da URL
  const initialUsers = await getUsers({
    search: parsedParams.search,
    status: parsedParams.status as any,
    take: 9
  })

  return (
    <div className="flex-1 animate-fade-in-from-top p-6">
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

