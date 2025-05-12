// /features/users/components/user-card.tsx
"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { UserBasic } from "../types"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Eye, Edit, Power } from "lucide-react"
import { useConfirmDialog } from "@/components/confirm-dialog"
import { toggleUserStatus } from "../actions/toggle-user-status"
import Link from "next/link"
import { userPath, userEditPath } from "@/app/paths"

type UserCardProps = {
  user: UserBasic
  onStatusChange?: () => void
}

export function UserCard({ user, onStatusChange }: UserCardProps) {
  // Verificar se o usuário tem uma role de admin
  const isAdmin = user.roles.some(role =>
    role.name.toLowerCase().includes('admin')
  )

  const [toggleButton, toggleDialog] = useConfirmDialog({
    action: toggleUserStatus.bind(null, user.id),
    title: user.active ? "Desativar Usuário" : "Ativar Usuário",
    description: user.active
      ? `Tem certeza que deseja desativar o usuário ${user.name}?`
      : `Tem certeza que deseja ativar o usuário ${user.name}?`,
    onSuccess: onStatusChange,
    trigger: (
      <Button variant="ghost" size="sm">
        <Power className={`h-4 w-4 ${user.active ? "text-green-500" : "text-red-500"}`} />
      </Button>
    )
  })

  return (
    <Card className="overflow-hidden pb-0 h-full flex flex-col justify-between">
      <CardContent>
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.image_url || undefined} alt={user.name} />
            <AvatarFallback>
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-lg">{user.name}</h3>
              <div className="flex gap-1">
                {!user.active && (
                  <Badge variant="destructive">Desativado</Badge>
                )}
                {isAdmin && (
                  <Badge>Admin</Badge>
                )}
              </div>
            </div>

            <p className="text-sm text-muted-foreground">{user.email}</p>

            {user.position && (
              <p className="text-sm">{user.position}</p>
            )}

            {user.company && (
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {user.company.name}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {user.company.segment}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="bg-muted/50 px-6 py-3">
        <div className="flex justify-end gap-2 w-full">
          {toggleButton}

          <Button variant="ghost" size="sm" asChild>
            <Link href={userPath(user.id)}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>

          <Button variant="ghost" size="sm" asChild>
            <Link href={userEditPath(user.id)}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardFooter>

      {toggleDialog}
    </Card>
  )
}