// /features/roles/components/role-detail.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ShieldCheck,
  UserCircle,
  Edit,
  Trash2,
  ExternalLink,
  User
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { RoleWithRelations } from "../types"
import { Separator } from "@/components/ui/separator"
import { useConfirmDialog } from "@/components/confirm-dialog"
import { deleteRole } from "../actions/delete-role"
import Link from "next/link"
import { roleEditPath, userPath, permissionPath } from "@/app/paths"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"

type RoleDetailProps = {
  role: RoleWithRelations & { isAuthorized: boolean }
}

export function RoleDetail({ role }: RoleDetailProps) {
  // Dialog para excluir role
  const [deleteButton, deleteDialog] = useConfirmDialog({
    action: deleteRole.bind(null, role.id),
    title: "Excluir Função",
    description: `Tem certeza que deseja excluir a função "${role.name}"? Esta ação não pode ser desfeita.`,
    trigger: (
      <Button variant="destructive" size="sm">
        <Trash2 className="mr-2 h-4 w-4" />
        Excluir
      </Button>
    )
  })

  return (
    <div className="space-y-8">
      {/* Informações detalhadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Detalhes da Role */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <ShieldCheck className="h-5 w-5 mr-2 text-primary" />
              Informações da Função
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-muted-foreground">ID da Função</p>
                <p className="font-medium">{role.id}</p>
              </div>

              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="font-medium">{role.name}</p>
              </div>

              {role.description && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Descrição</p>
                  <p className="text-sm">{role.description}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">Data de Criação</p>
                <p className="font-medium">
                  {new Date(role.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Última Atualização</p>
                <p className="font-medium">
                  {new Date(role.updatedAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Permissões associadas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <ShieldCheck className="h-5 w-5 mr-2 text-primary" />
              Permissões ({role.permissions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {role.permissions && role.permissions.length > 0 ? (
              <ScrollArea className="h-80">
                <div className="space-y-3">
                  {role.permissions.map((permission) => (
                    <div key={permission.id} className="border rounded-md p-3 hover:bg-muted/20 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{permission.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {permission.description}
                          </p>
                        </div>
                        <Link href={permissionPath(permission.id)} className="flex-shrink-0">
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-3">
                  <ShieldCheck className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  Esta função não possui permissões associadas
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Usuários associados à role */}
      {role.users && role.users.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <UserCircle className="h-5 w-5 mr-2 text-primary" />
              Usuários com esta função ({role.users.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              <div className="space-y-3">
                {role.users.map((user) => (
                  <div key={user.id} className="border rounded-md p-3 hover:bg-muted/20 transition-colors">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {user.image_url ? (
                            <AvatarImage src={user.image_url} alt={user.name} />
                          ) : (
                            <AvatarFallback>
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{user.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <Link href={userPath(user.id)} className="flex-shrink-0">
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Ações para administradores */}
      {role.isAuthorized && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={roleEditPath(role.id)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>

          {role.name !== "admin" && deleteButton}
        </div>
      )}

      {/* Dialogs de confirmação */}
      {deleteDialog}
    </div>
  )
}