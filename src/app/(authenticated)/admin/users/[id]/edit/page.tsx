import { notFound } from "next/navigation"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { Separator } from "@/components/ui/separator"
import { usersPath } from "@/app/paths"
import { UserDetail } from "@/features/users/components/user-detail"
import { getUser } from "@/features/users/queries/get-user"

type UserPageProps = Promise<{ id: string }>

export default async function UserPage({ params }: { params: UserPageProps }) {
  const { id } = await params

  const user = await getUser(id)

  if (!user) {
    return notFound()
  }

  return (
    <div className="flex-1 flex flex-col gap-y-8">
      <Breadcrumbs
        breadcrumbs={[
          { title: "Usuários", href: usersPath() },
          { title: user.name || "Detalhes do Usuário" }
        ]} />

      <Separator />
      <div className="animate-fade-in-from-top">
        <UserDetail user={user} />
      </div>
    </div>
  )
}

