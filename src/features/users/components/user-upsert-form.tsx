// /features/users/components/user-upsert-form.tsx
"use client"

import { Form } from "@/components/form/form"
import { SubmitButton } from "@/components/form/submit-button"
import { EMPTY_ACTION_STATE } from "@/components/form/utils/to-action-state"
import { upsertUser } from "../actions/upsert-user"
import { useActionState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { FieldError } from "@/components/form/field-error"
import { SaveIcon } from "lucide-react"
import { UserWithDetails } from "../types"
import { usersPath } from "@/app/paths"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

type Company = {
  id: string;
  name: string;
  cnpj: string;
  segment: string;
}

type Role = {
  id: string;
  name: string;
  description?: string;
}

type UserUpsertFormProps = {
  user?: UserWithDetails;
  companies: Company[];
  roles: Role[];
}

export function UserUpsertForm({ user, companies, roles }: UserUpsertFormProps) {
  const router = useRouter();
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>(user?.cnpj || "");

  const [state, action] = useActionState(
    upsertUser.bind(null, user?.id),
    EMPTY_ACTION_STATE
  );

  // Inicializar roles selecionadas se estiver editando um usuário
  useEffect(() => {
    if (user?.roles) {
      setSelectedRoles(user.roles);
    }
    if (user?.cnpj) {
      setSelectedCompany(user.cnpj);
    }
  }, [user]);

  const handleSuccess = () => {
    router.push(usersPath());
  }

  const handleAddRole = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;

    // Verificar se a role já está selecionada
    if (!selectedRoles.some(r => r.id === roleId)) {
      setSelectedRoles(prev => [...prev, role]);
    }
  }

  const handleRemoveRole = (roleId: string) => {
    setSelectedRoles(prev => prev.filter(r => r.id !== roleId));
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">
        {user ? "Editar Usuário" : "Novo Usuário"}
      </h2>

      <Form action={action} actionState={state} onSuccess={handleSuccess}>
        <input
          type="hidden"
          name="roleIds"
          value={JSON.stringify(selectedRoles.map(r => r.id))}
        />

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="w-full justify-start mb-6">
            <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
            <TabsTrigger value="company">Empresa</TabsTrigger>
            <TabsTrigger value="access">Acesso e Permissões</TabsTrigger>
            <TabsTrigger value="contact">Contato e Localização</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <h3 className="text-lg font-medium">Informações Básicas</h3>
            <Separator className="mb-4" />

            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                name="name"
                defaultValue={user?.name}
                placeholder="Nome do usuário"
              />
              <FieldError actionState={state} name="name" />
            </div>

            {/* Nome de usuário */}
            <div className="space-y-2">
              <Label htmlFor="username">Nome de Usuário</Label>
              <Input
                id="username"
                name="username"
                defaultValue={user?.username}
                placeholder="nome.sobrenome"
              />
              <FieldError actionState={state} name="username" />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={user?.email}
                placeholder="email@exemplo.com"
              />
              <FieldError actionState={state} name="email" />
            </div>

            {/* Documentos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  name="cpf"
                  defaultValue={user?.cpf}
                  placeholder="000.000.000-00"
                />
                <FieldError actionState={state} name="cpf" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rg">RG</Label>
                <Input
                  id="rg"
                  name="rg"
                  defaultValue={user?.rg}
                  placeholder="00.000.000-0"
                />
                <FieldError actionState={state} name="rg" />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="company" className="space-y-4">
            <h3 className="text-lg font-medium">Informações da Empresa</h3>
            <Separator className="mb-4" />

            {/* Empresa (CNPJ) */}
            <div className="space-y-2">
              <Label htmlFor="cnpj">Empresa</Label>
              <Select
                name="cnpj"
                value={selectedCompany}
                onValueChange={setSelectedCompany}
              >
                <SelectTrigger id="cnpj">
                  <SelectValue placeholder="Selecione uma empresa" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map(company => (
                    <SelectItem key={company.id} value={company.cnpj}>
                      {company.name} - {company.segment}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError actionState={state} name="cnpj" />
            </div>

            {/* Cargo */}
            <div className="space-y-2">
              <Label htmlFor="position">Cargo</Label>
              <Input
                id="position"
                name="position"
                defaultValue={user?.position || ""}
                placeholder="Cargo ou função"
              />
              <FieldError actionState={state} name="position" />
            </div>
          </TabsContent>

          <TabsContent value="access" className="space-y-4">
            <h3 className="text-lg font-medium">Acesso e Permissões</h3>
            <Separator className="mb-4" />

            {/* Status */}
            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                name="active"
                defaultChecked={user ? user.active : true}
              />
              <Label htmlFor="active">Usuário Ativo</Label>
            </div>
            <FieldError actionState={state} name="active" />

            {/* Funções/Papéis */}
            <div className="space-y-2 mt-4">
              <Label>Funções e Permissões</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedRoles.map(role => (
                  <Badge key={role.id} variant="secondary" className="flex items-center gap-1">
                    {role.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveRole(role.id)}
                      className="rounded-full hover:bg-muted p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              <Select
                onValueChange={(value) => handleAddRole(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Adicionar função" />
                </SelectTrigger>
                <SelectContent>
                  {roles
                    .filter(r => !selectedRoles.some(sr => sr.id === r.id))
                    .map(role => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name} {role.description ? `- ${role.description}` : ''}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
              <FieldError actionState={state} name="roleIds" />
            </div>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <h3 className="text-lg font-medium">Contato e Localização</h3>
            <Separator className="mb-4" />

            {/* Telefone */}
            <div className="space-y-2">
              <Label htmlFor="mobile_phone">Telefone Celular</Label>
              <Input
                id="mobile_phone"
                name="mobile_phone"
                defaultValue={user?.mobile_phone}
                placeholder="(00) 00000-0000"
              />
              <FieldError actionState={state} name="mobile_phone" />
            </div>

            {/* Cidade e Estado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  name="city"
                  defaultValue={user?.city}
                  placeholder="Cidade"
                />
                <FieldError actionState={state} name="city" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  name="state"
                  defaultValue={user?.state}
                  placeholder="Estado"
                />
                <FieldError actionState={state} name="state" />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Botões */}
        <div className="flex justify-end pt-6">
          <SubmitButton
            variant="default"
            icon={<SaveIcon className="mr-2 h-4 w-4" />}
            label={user ? "Atualizar Usuário" : "Criar Usuário"}
          />
        </div>
      </Form>
    </Card>
  )
}