// /app/(admin)/enrollments/stats/page.tsx
import { Breadcrumbs } from "@/components/breadcrumbs"
import { Separator } from "@/components/ui/separator"
import { enrollmentsPath } from "@/app/paths"
import { EnrollmentDashboard } from "@/features/enrollments/components/enrollment-dashboard"
import { getEnrollmentStats } from "@/features/enrollments/queries/get-enrollment-stats"
import { getAuthWithPermissionOrRedirect } from "@/features/auth/queries/get-auth-with-permission-or-redirect"

export default async function EnrollmentsStatsPage() {
  // Verificar autenticação
  await getAuthWithPermissionOrRedirect("enrollments.stats")

  const stats = await getEnrollmentStats()

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
          <p className="text-muted-foreground">
            Você não tem permissão para visualizar as estatísticas de inscrições.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col gap-y-8">
      <Breadcrumbs
        breadcrumbs={[
          { title: "Inscrições", href: enrollmentsPath() },
          { title: "Estatísticas Avançadas" }
        ]}
      />

      <Separator />

      <div className="animate-fade-in-from-top">
        <EnrollmentDashboard stats={stats} />
      </div>
    </div>
  )
}