import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { AdminEventsInfiniteList } from "@/features/events/admin/components/admin-events-infinite-list"
import { generateListingMetadata } from "@/lib/metadata"

export const metadata = generateListingMetadata(
  "admin",
  "Painel administrativo para gerenciar eventos da ABF. Criação, edição e controle de publicação de eventos."
)

function AdminEventsPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Skeleton dos filtros */}
      <div className="h-40 bg-muted animate-pulse rounded-lg" />

      {/* Skeleton da lista */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-80 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    </div>
  )
}

export default async function AdminEventsPage() {
  return (
    <div className="flex-1 flex flex-col gap-y-8">
      <div className="flex items-center justify-end">
        <Link href="/admin/events/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Evento
          </Button>
        </Link>
      </div>

      <div className="animate-fade-in-from-top">
        <Suspense fallback={<AdminEventsPageSkeleton />}>
          <AdminEventsInfiniteList />
        </Suspense>
      </div>
    </div>
  )
}