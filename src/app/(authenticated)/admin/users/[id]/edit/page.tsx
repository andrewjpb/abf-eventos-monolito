// /app/(admin)/users/[id]/edit/page.tsx
import { Breadcrumbs } from "@/components/breadcrumbs"
import { CardCompact } from "@/components/cardCompact"
import { Separator } from "@/components/ui/separator"
import { usersPath, userPath } from "@/app/paths"
import { notFound } from "next/navigation"
import { UserUpsertForm } from "@/features/users/components/user-upsert-form"
import { prisma } from "@/lib/prisma"
import { getUser } from "@/features/users/queries/get-user"
import { getAuthWithPermissionOrRedirect } from "@/features/auth/queries/get-auth-with-permission-or-redirect"
type EditUserPageProps = Promise<{ id: string }>

export default async function EditUserPage({ params }: { params: EditUserPageProps }) {
  await getAuthWithPermissionOrRedirect("users.update")
  const { id } = await params

  const user = await getUser(id)

  if (!user) {
    return notFound()
  }

  // Buscar apenas roles para o formulário - empresas são carregadas dinamicamente pelo componente
  const roles = await prisma.roles.findMany({
    select: { id: true, name: true, description: true },
    orderBy: { name: 'asc' }
  })

  return (
    <div className="flex-1 flex flex-col gap-y-8">
      <Breadcrumbs
        breadcrumbs={[
          { title: "Usuários", href: usersPath() },
          { title: user.name || "Detalhes do Usuário", href: userPath(user.id) },
          { title: "Editar" }
        ]} />

      <Separator />

      <div className="flex-1 flex flex-col justify-center items-center">
        <CardCompact
          title="Editar Usuário"
          description="Atualize as informações do usuário"
          className="w-full max-w-[800px] animate-fade-in-from-top"
          content={
            <UserUpsertForm
              user={user}
              roles={roles}
            />
          }
        />
      </div>
    </div>
  )
}