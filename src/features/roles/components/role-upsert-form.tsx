// /features/roles/components/role-upsert-form.tsx
"use client"

import { FieldError } from "@/components/form/field-error"
import { Form } from "@/components/form/form"
import { EMPTY_ACTION_STATE } from "@/components/form/utils/to-action-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useActionState } from "react"
import { upsertRole } from "../actions/upsert-role"
import { RoleWithRelations } from "../types"
import { useQueryClient } from "@tanstack/react-query"
import { LucideLoaderCircle, Save, Search, ShieldCheck } from "lucide-react"
import clsx from "clsx"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useEffect, useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Permission } from "@/features/roles/types"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

type RoleUpsertFormProps = {
  role?: RoleWithRelations
  permissions: Permission[]
}

const RoleUpsertForm = ({ role, permissions }: RoleUpsertFormProps) => {
  const [actionState, action, pending] = useActionState(
    upsertRole.bind(null, role?.id),
    EMPTY_ACTION_STATE
  )
  const queryClient = useQueryClient()

  // Estado para controlar as permissões selecionadas
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    role?.permissions.map(p => p.id) || []
  )

  // Filtro de permissões
  const [permissionFilter, setPermissionFilter] = useState<string>("")

  // Permissões filtradas
  const filteredPermissions = permissions.filter(p =>
    p.name.toLowerCase().includes(permissionFilter.toLowerCase()) ||
    p.description.toLowerCase().includes(permissionFilter.toLowerCase())
  )

  // Atualizar permissões selecionadas quando o role mudar
  useEffect(() => {
    if (role) {
      setSelectedPermissions(role.permissions.map(p => p.id))
    }
  }, [role])

  // Função para alternar a seleção de uma permissão
  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    )
  }

  return (
    <Form
      action={action}
      actionState={actionState}
      onSuccess={() => {
        queryClient.invalidateQueries({ queryKey: ["roles"] })
      }}
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Informações da Função</h3>
          <Separator />

          <div className="space-y-2">
            <Label htmlFor="name">Nome da Função</Label>
            <Input
              id="name"
              name="name"
              placeholder="Nome da função"
              defaultValue={role?.name || ""}
            />
            <FieldError actionState={actionState} name="name" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Descreva a finalidade desta função"
              rows={3}
              defaultValue={role?.description || ""}
            />
            <FieldError actionState={actionState} name="description" />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Permissões</h3>
          <Separator />

          <div className="space-y-2">
            <Label htmlFor="permission-search">Filtrar Permissões</Label>
            <div className="flex items-center">
              <Input
                id="permission-search"
                placeholder="Buscar por nome ou descrição"
                value={permissionFilter}
                onChange={(e) => setPermissionFilter(e.target.value)}
                className="flex-1"
              />
              <Badge variant="outline" className="ml-2 bg-primary/5">
                {selectedPermissions.length} selecionada{selectedPermissions.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>

          {/* Lista de permissões */}
          <Card>
            <CardContent className="p-2">
              {permissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-3">
                    <ShieldCheck className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">
                    Nenhuma permissão encontrada no sistema
                  </p>
                </div>
              ) : filteredPermissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-3">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">
                    Nenhuma permissão corresponde à busca
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-72">
                  <div className="space-y-2 p-2">
                    {filteredPermissions.map((permission) => (
                      <div
                        key={permission.id}
                        className="flex items-start space-x-2 p-2 hover:bg-muted/20 rounded transition-colors"
                      >
                        <Checkbox
                          id={`permission-${permission.id}`}
                          checked={selectedPermissions.includes(permission.id)}
                          onCheckedChange={() => togglePermission(permission.id)}
                        />
                        {/* Incluir campo hidden para cada permissão selecionada */}
                        {selectedPermissions.includes(permission.id) && (
                          <input
                            type="hidden"
                            name="permissions"
                            value={permission.id}
                          />
                        )}
                        <div className="grid gap-1.5 leading-none">
                          <label
                            htmlFor={`permission-${permission.id}`}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {permission.name}
                          </label>
                          <p className="text-xs text-muted-foreground">
                            {permission.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="w-full mt-6"
      >
        {pending && (
          <LucideLoaderCircle className={clsx("w-4 h-4 mr-2 animate-spin")} />
        )}
        <Save className="mr-2 h-4 w-4" />
        {role ? "Atualizar Função" : "Cadastrar Função"}
      </Button>
    </Form>
  )
}

export { RoleUpsertForm }