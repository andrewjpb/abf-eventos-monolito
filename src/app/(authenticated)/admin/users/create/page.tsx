import { Breadcrumbs } from "@/components/breadcrumbs"
import { CardCompact } from "@/components/cardCompact"
import { Separator } from "@/components/ui/separator"
import { usersPath } from "@/app/paths"
import { UserUpsertForm } from "@/features/users/components/user-upsert-form"
import { prisma } from "@/lib/prisma"

export default async function CreateUserPage() {
  // Buscar empresas e roles para o formulário
  const [companies, roles] = await Promise.all([
    prisma.company.findMany({
      where: { active: true },
      select: { id: true, name: true, cnpj: true, segment: true },
      orderBy: { name: 'asc' }
    }),
    prisma.roles.findMany({
      select: { id: true, name: true, description: true },
      orderBy: { name: 'asc' }
    })
  ])

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
          title="Cadastrar Novo Usuário"
          description="Preencha as informações para cadastrar um novo usuário"
          className="w-full max-w-[800px] animate-fade-in-from-top"
          content={
            <UserUpsertForm
              companies={companies}
              roles={roles}
            />
          }
        />
      </div>
    </div>
  )
}
