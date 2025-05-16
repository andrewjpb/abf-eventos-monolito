// /app/(admin)/users/create/page.tsx
import { Breadcrumbs } from "@/components/breadcrumbs"
import { CardCompact } from "@/components/cardCompact"
import { Separator } from "@/components/ui/separator"
import { usersPath } from "@/app/paths"
import { UserUpsertForm } from "@/features/users/components/user-upsert-form"
import { prisma } from "@/lib/prisma"
import { getAuth } from "@/features/auth/queries/get-auth"
import { notFound } from "next/navigation"
import { getAuthWithPermissionOrRedirect } from "@/features/auth/queries/get-auth-with-permission-or-redirect"
export default async function CreateUserPage() {
  await getAuthWithPermissionOrRedirect("users.create")

  const { user } = await getAuth()

  if (!user) {
    return notFound()
  }

  // Verificar se o usuário é admin
  const isAdmin = await checkIfUserIsAdmin(user.id)

  if (!isAdmin) {
    return notFound()
  }

  // Buscar apenas roles para o formulário
  const roles = await prisma.roles.findMany({
    select: { id: true, name: true, description: true },
    orderBy: { name: 'asc' }
  })

  return (
    <div className="flex-1 flex flex-col gap-y-8">
      <Breadcrumbs
        breadcrumbs={[
          { title: "Usuários", href: usersPath() },
          { title: "Novo Usuário" }
        ]} />

      <Separator />

      <div className="flex-1 flex flex-col justify-center items-center">
        <CardCompact
          title="Novo Usuário"
          description="Cadastre um novo usuário no sistema"
          className="w-full max-w-[800px] animate-fade-in-from-top"
          content={
            <UserUpsertForm roles={roles} />
          }
        />
      </div>
    </div>
  )
}

// Função auxiliar para verificar se um usuário é admin
async function checkIfUserIsAdmin(userId: string): Promise<boolean> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          permissions: true
        }
      }
    }
  })

  if (!user) return false

  return user.roles.some(role =>
    role.name.toLowerCase().includes('admin') ||
    role.permissions.some(perm => perm.name.toLowerCase().includes('admin'))
  )
}