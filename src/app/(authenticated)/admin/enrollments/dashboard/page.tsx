// /app/(admin)/enrollments/dashboard/page.tsx
import { Breadcrumbs } from "@/components/breadcrumbs"
import { Separator } from "@/components/ui/separator"
import { enrollmentsListPath } from "@/app/paths"
import { EnrollmentDashboard } from "@/features/enrollments/components/enrollment-dashboard"
import { getEnrollmentStats } from "@/features/enrollments/queries/get-enrollment-stats"
import { getAuthWithPermissionOrRedirect } from "@/features/auth/queries/get-auth-with-permission-or-redirect"

export default async function EnrollmentsDashboardPage() {
  // Verificar autenticação
  await getAuthWithPermissionOrRedirect("enrollments.view")

  const stats = await getEnrollmentStats()

  if (!stats) {
    return (
      <div className="flex-1 flex flex-col gap-y-8">
        <Breadcrumbs
          breadcrumbs={[
            { title: "Inscrições", href: enrollmentsListPath() },
            { title: "Dashboard" }
          ]}
        />

        <Separator />

        <div className="flex-1 flex flex-col justify-center items-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Dashboard de Inscrições</h1>
            <p className="text-muted-foreground">
              Erro ao carregar as estatísticas de inscrições.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col gap-y-8">
      <Breadcrumbs
        breadcrumbs={[
          { title: "Inscrições", href: enrollmentsListPath() },
          { title: "Dashboard" }
        ]}
      />

      <Separator />

      <div className="animate-fade-in-from-top">
        <EnrollmentDashboard stats={stats} />
      </div>
    </div>
  )
}