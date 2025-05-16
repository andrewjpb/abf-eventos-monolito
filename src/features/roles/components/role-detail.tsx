// /features/roles/components/role-detail.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Users, ExternalLink, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { permissionPath, roleEditPath } from "@/app/paths"
import { RoleDetailProps } from "../types"
import { useConfirmDialog } from "@/components/confirm-dialog"
import { deleteRole } from "../actions/delete-role"

export function RoleDetail({ role }: RoleDetailProps) {
  const hasPermissions = role.permissions && role.permissions.length > 0
  const hasUsers = role.users ? role.users.length > 0 : false

  // Dialog para excluir Grupo
  const [deleteButton, deleteDialog] = useConfirmDialog({
    action: deleteRole.bind(null, role.id),
    title: "Excluir Grupo",
    description: `Tem certeza que deseja excluir o grupo ${role.name}? Esta ação não pode ser desfeita.`,
    trigger: (
      <Button variant="destructive" size="sm">
        <Trash2 className="mr-2 h-4 w-4" />
        Excluir
      </Button>
    )
  })

  return (
    <div className="space-y-8">
      {/* Ações */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={roleEditPath(role.id)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar Grupo
          </Link>
        </Button>

        {deleteButton}
      </div>

      {/* Informações detalhadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Detalhes da Grupo */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Users className="h-5 w-5 mr-2 text-primary" />
                Informações do grupo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">ID da Grupo</p>
                  <p className="font-medium">{role.id}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-medium">{role.name}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Descrição</p>
                  <p className="text-sm">{role.description}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Data de Cadastro</p>
                  <p className="font-medium">
                    {new Date(role.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>


            </CardContent>
          </Card>
          {/* Usuários com esta Grupo */}
          {hasUsers && role.users && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Users className="h-5 w-5 mr-2 text-primary" />
                  Usuários com este grupo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {role.users.map((user) => (
                    <div key={user.id} className="flex items-center gap-2 p-2 border-b">
                      <span className="font-medium">{user.name}</span>
                      <span className="text-sm text-muted-foreground">({user.email})</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

        </div>

        {/* Permissões Associadas */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center">
                <Shield className="h-5 w-5 mr-2 text-primary" />
                Permissões Associadas
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href={roleEditPath(role.id)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Permissões
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {hasPermissions ? (
              <div className="space-y-4">
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
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-3">
                  <Shield className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  Esta Grupo não tem permissões associadas
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>


      {/* Dialog de confirmação */}
      {deleteDialog}
    </div>
  )
}