// /features/permissions/components/permission-detail.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Shield,
  ShieldCheck,
  Edit,
  Trash2,
  ExternalLink
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Permission } from "@/features/roles/types"
import { useConfirmDialog } from "@/components/confirm-dialog"
import { deletePermission } from "../actions/delete-permission"
import Link from "next/link"
import { permissionEditPath, rolePath } from "@/app/paths"
import { ScrollArea } from "@/components/ui/scroll-area"

type PermissionDetailProps = {
  permission: Permission & {
    roles: { id: string; name: string; description: string }[],
    isAuthorized: boolean
  }
}

export function PermissionDetail({ permission }: PermissionDetailProps) {
  // Dialog para excluir permissão
  const [deleteButton, deleteDialog] = useConfirmDialog({
    action: deletePermission.bind(null, permission.id),
    title: "Excluir Permissão",
    description: `Tem certeza que deseja excluir a permissão "${permission.name}"? Esta ação não pode ser desfeita.`,
    trigger: (
      <Button variant="destructive" size="sm">
        <Trash2 className="mr-2 h-4 w-4" />
        Excluir
      </Button>
    )
  })

  const hasRoles = permission.roles && permission.roles.length > 0

  return (
    <div className="space-y-8">
      {/* Informações detalhadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Detalhes da Permissão */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Shield className="h-5 w-5 mr-2 text-primary" />
              Informações da Permissão
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-muted-foreground">ID da Permissão</p>
                <p className="font-medium">{permission.id}</p>
              </div>

              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="font-medium">{permission.name}</p>
              </div>

              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Descrição</p>
                <p className="text-sm">{permission.description}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Data de Criação</p>
                <p className="font-medium">
                  {new Date(permission.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Última Atualização</p>
                <p className="font-medium">
                  {new Date(permission.updatedAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Funções associadas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <ShieldCheck className="h-5 w-5 mr-2 text-primary" />
              Funções ({permission.roles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasRoles ? (
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {permission.roles.map((role) => (
                    <div key={role.id} className="border rounded-md p-3 hover:bg-muted/20 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{role.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {role.description}
                          </p>
                        </div>
                        <Link href={rolePath(role.id)} className="flex-shrink-0">
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
                  Esta permissão não está associada a nenhuma função
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ações para administradores */}
      {permission.isAuthorized && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={permissionEditPath(permission.id)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>

          {!hasRoles && deleteButton}
        </div>
      )}

      {/* Dialogs de confirmação */}
      {deleteDialog}
    </div>
  )
}