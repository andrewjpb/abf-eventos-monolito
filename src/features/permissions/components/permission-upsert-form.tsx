// /features/permissions/components/permission-upsert-form.tsx
"use client"

import { FieldError } from "@/components/form/field-error"
import { Form } from "@/components/form/form"
import { EMPTY_ACTION_STATE } from "@/components/form/utils/to-action-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useActionState } from "react"
import { Permission } from "@/features/roles/types"
import { useQueryClient } from "@tanstack/react-query"
import { LucideLoaderCircle, Save } from "lucide-react"
import clsx from "clsx"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { upsertPermission } from "../actions/upsert-permission"

type PermissionUpsertFormProps = {
  permission?: Permission & { roles?: { id: string; name: string }[] }
}

const PermissionUpsertForm = ({ permission }: PermissionUpsertFormProps) => {
  const [actionState, action, pending] = useActionState(
    upsertPermission.bind(null, permission?.id),
    EMPTY_ACTION_STATE
  )
  const queryClient = useQueryClient()

  return (
    <Form
      action={action}
      actionState={actionState}
      onSuccess={() => {
        queryClient.invalidateQueries({ queryKey: ["permissions"] })
      }}
    >
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Informações da Permissão</h3>
        <Separator />

        <div className="space-y-2">
          <Label htmlFor="name">Nome da Permissão</Label>
          <Input
            id="name"
            name="name"
            placeholder="Nome da permissão (ex: users.create)"
            defaultValue={permission?.name || ""}
          />
          <p className="text-xs text-muted-foreground">
            Use apenas letras, números, pontos e underscores (ex: users.create, posts.edit)
          </p>
          <FieldError actionState={actionState} name="name" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Descreva a finalidade desta permissão"
            rows={3}
            defaultValue={permission?.description || ""}
          />
          <FieldError actionState={actionState} name="description" />
        </div>

        {permission && permission.roles && permission.roles.length > 0 && (
          <div className="rounded-md border p-4 bg-amber-50 dark:bg-amber-950/20">
            <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
              Atenção
            </p>
            <p className="text-sm mt-1 text-amber-700 dark:text-amber-300">
              Esta permissão está associada a {permission.roles.length} função{permission.roles.length !== 1 ? 'ões' : ''}.
              Alterar seu nome pode afetar o comportamento do sistema.
            </p>
          </div>
        )}
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
        {permission ? "Atualizar Permissão" : "Cadastrar Permissão"}
      </Button>
    </Form>
  )
}

export { PermissionUpsertForm }