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
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { CompanySelect } from "./company-select"

type Role = {
  id: string;
  name: string;
  description?: string;
}

type UserUpsertFormProps = {
  user?: UserWithDetails;
  roles: Role[];
}

export function UserUpsertForm({ user, roles }: UserUpsertFormProps) {
  const router = useRouter();
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>(user?.cnpj || "");
  const [activeTab, setActiveTab] = useState<string>("basic");

  // Controle dos valores do formulário para evitar problemas de validação entre abas
  const [formValues, setFormValues] = useState({
    name: user?.name || "",
    username: user?.username || "",
    email: user?.email || "",
    cpf: user?.cpf || "",
    rg: user?.rg || "",
    mobile_phone: user?.mobile_phone || "",
    city: user?.city || "",
    state: user?.state || "",
    position: user?.position || "",
    active: user?.active !== undefined ? user.active : true
  });

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

    // Atualizar valores do formulário quando o usuário muda
    if (user) {
      setFormValues({
        name: user.name || "",
        username: user.username || "",
        email: user.email || "",
        cpf: user.cpf || "",
        rg: user.rg || "",
        mobile_phone: user.mobile_phone || "",
        city: user.city || "",
        state: user.state || "",
        position: user.position || "",
        active: user.active !== undefined ? user.active : true
      });
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

  // Manipular alterações nos campos para manter o estado atualizado
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    // Aplicar formatação no campo de telefone
    if (name === "mobile_phone") {
      const formattedValue = formatPhone(value);
      setFormValues(prev => ({
        ...prev,
        [name]: formattedValue
      }));
      return;
    }
    
    setFormValues(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  // Função para formatar telefone
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    
    // Formato para celular (11 dígitos): (00) 00000-0000
    if (numbers.length === 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
    
    // Formato para fixo (10 dígitos): (00) 0000-0000
    if (numbers.length === 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    }
    
    // Formatação parcial durante a digitação
    if (numbers.length > 6) {
      return numbers.length > 10 
        ? numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
        : numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
    }
    
    if (numbers.length > 2) {
      return numbers.replace(/(\d{2})(\d{0,5})/, '($1) $2')
    }
    
    if (numbers.length > 0) {
      return numbers.replace(/(\d{0,2})/, '($1')
    }
    
    return numbers
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">
        {user ? "Editar Usuário" : "Novo Usuário"}
      </h2>

      <Form action={action} actionState={state} onSuccess={handleSuccess}>
        {/* Campos ocultos para todos os valores obrigatórios, para garantir que sejam enviados independentemente da aba ativa */}
        <input type="hidden" name="roleIds" value={JSON.stringify(selectedRoles.map(r => r.id))} />
        <input type="hidden" name="cnpj" value={selectedCompany} />

        {/* Campos ocultos para garantir que todos os valores obrigatórios sejam enviados mesmo estando em outra aba */}
        {activeTab !== "basic" && (
          <>
            <input type="hidden" name="name" value={formValues.name} />
            <input type="hidden" name="username" value={formValues.username} />
            <input type="hidden" name="email" value={formValues.email} />
            <input type="hidden" name="cpf" value={formValues.cpf} />
            <input type="hidden" name="rg" value={formValues.rg} />
          </>
        )}

        {activeTab !== "contact" && (
          <>
            <input type="hidden" name="mobile_phone" value={formValues.mobile_phone} />
            <input type="hidden" name="city" value={formValues.city} />
            <input type="hidden" name="state" value={formValues.state} />
          </>
        )}

        {activeTab !== "company" && (
          <>
            <input type="hidden" name="position" value={formValues.position} />
          </>
        )}

        {activeTab !== "access" && (
          <>
            <input type="hidden" name="active" value={formValues.active.toString()} />
          </>
        )}

        <Tabs
          defaultValue="basic"
          className="w-full"
          onValueChange={setActiveTab}
          value={activeTab}
        >
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
                value={formValues.name}
                onChange={handleInputChange}
                placeholder="Nome do usuário"
                required
              />
              <FieldError actionState={state} name="name" />
            </div>

            {/* Nome de usuário */}
            <div className="space-y-2">
              <Label htmlFor="username">Nome de Usuário</Label>
              <Input
                id="username"
                name="username"
                value={formValues.username}
                onChange={handleInputChange}
                placeholder="nome.sobrenome"
                required
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
                value={formValues.email}
                onChange={handleInputChange}
                placeholder="email@exemplo.com"
                required
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
                  value={formValues.cpf}
                  onChange={handleInputChange}
                  placeholder="000.000.000-00"
                  required
                />
                <FieldError actionState={state} name="cpf" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rg">RG</Label>
                <Input
                  id="rg"
                  name="rg"
                  value={formValues.rg}
                  onChange={handleInputChange}
                  placeholder="00.000.000-0"
                  required
                />
                <FieldError actionState={state} name="rg" />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="company" className="space-y-4">
            <h3 className="text-lg font-medium">Informações da Empresa</h3>
            <Separator className="mb-4" />

            {/* Empresa (CNPJ) */}
            <CompanySelect
              selectedCnpj={selectedCompany}
              onChange={setSelectedCompany}
              label="Empresa"
            />

            {/* Cargo */}
            <div className="space-y-2">
              <Label htmlFor="position">Cargo</Label>
              <Input
                id="position"
                name="position"
                value={formValues.position}
                onChange={handleInputChange}
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
                checked={formValues.active}
                onCheckedChange={(checked) => {
                  setFormValues(prev => ({ ...prev, active: checked }));
                }}
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
              <Label htmlFor="mobile_phone">Telefone</Label>
              <Input
                id="mobile_phone"
                name="mobile_phone"
                value={formValues.mobile_phone}
                onChange={handleInputChange}
                placeholder="(00) 0000-0000 ou (00) 00000-0000"
                required
              />
              <FieldError actionState={state} name="mobile_phone" />
              <p className="text-xs text-muted-foreground">
                Aceita telefone fixo (8 dígitos) ou celular (9 dígitos) com DDD
              </p>
            </div>

            {/* Cidade e Estado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  name="city"
                  value={formValues.city}
                  onChange={handleInputChange}
                  placeholder="Cidade"
                />
                <FieldError actionState={state} name="city" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  name="state"
                  value={formValues.state}
                  onChange={handleInputChange}
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