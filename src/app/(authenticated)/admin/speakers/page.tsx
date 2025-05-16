// /app/(admin)/admin/speakers/page.tsx
import { SpeakersList } from "@/features/speakers/components/speakers-list"
import { searchParamsCache } from "@/features/speakers/search-params"
import { SearchParams } from "nuqs"
import { getAuthWithPermissionOrRedirect } from "@/features/auth/queries/get-auth-with-permission-or-redirect"

export default async function SpeakersPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>
}) {
  // Verificar se o usuário tem permissão para visualizar palestrantes
  await getAuthWithPermissionOrRedirect("speakers.view")

  const parsedParams = await searchParamsCache.parse(searchParams)

  return (
    <main className="container mx-auto py-6">
      <SpeakersList searchParams={parsedParams} />
    </main>
  )
}