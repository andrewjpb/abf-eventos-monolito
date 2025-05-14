// /features/roles/components/role-upsert-form.tsx
"use client"

import { Form } from "@/components/form/form"
import { SubmitButton } from "@/components/form/submit-button"
import { EMPTY_ACTION_STATE } from "@/components/form/utils/to-action-state"
import { upsertRole } from "../actions/upsert-role"
import { useActionState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { FieldError } from "@/components/form/field-error"
import { SaveIcon, X, Search, LucideLoaderCircle } from "lucide-react"
import { RoleWithRelations } from "../types"
import { rolesPath } from "@/app/paths"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { searchPermissions } from "@/features/permissions/queries/search-permissions"
import { useDebounce } from "@/hooks/use-debounce"

type Permission = {
  id: string;
  name: string;
  description?: string;
}

type RoleUpsertFormProps = {
  role?: RoleWithRelations;
}

export function RoleUpsertForm({ role }: RoleUpsertFormProps) {
  const router = useRouter();
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([]);
  const [permissionOptions, setPermissionOptions] = useState<Permission[]>([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [permissionSearch, setPermissionSearch] = useState("");
  const [isPermissionSelectOpen, setIsPermissionSelectOpen] = useState(false);
  const [totalPermissionsCount, setTotalPermissionsCount] = useState(0);

  // Debounce da busca para evitar muitas requisições
  const debouncedSearch = useDebounce(permissionSearch, 300);

  // Controle dos valores do formulário
  const [formValues, setFormValues] = useState({
    name: role?.name || "",
    description: role?.description || "",
  });

  const [state, action] = useActionState(
    upsertRole.bind(null, role?.id),
    EMPTY_ACTION_STATE
  );

  // Inicializar permissões selecionadas se estiver editando uma role
  useEffect(() => {
    if (role?.permissions) {
      setSelectedPermissions(role.permissions);
    }

    // Atualizar valores do formulário quando a role muda
    if (role) {
      setFormValues({
        name: role.name || "",
        description: role.description || "",
      });
    }

    // Carregar opções iniciais de permissões
    loadPermissions("");
  }, [role]);

  // Carregar permissões com base no termo de pesquisa
  const loadPermissions = async (search: string = "") => {
    setIsLoadingPermissions(true);
    try {
      const result = await searchPermissions({ search });
      setPermissionOptions(result.permissions);
      setTotalPermissionsCount(result.metadata.total);
    } catch (error) {
      console.error("Erro ao buscar permissões:", error);
    } finally {
      setIsLoadingPermissions(false);
    }
  };

  // Efeito para buscar quando o termo de pesquisa mudar (com debounce)
  useEffect(() => {
    if (isPermissionSelectOpen) {
      loadPermissions(debouncedSearch);
    }
  }, [debouncedSearch, isPermissionSelectOpen]);

  // Quando o select é aberto, carregar opções iniciais (se a lista estiver vazia)
  useEffect(() => {
    if (isPermissionSelectOpen && permissionOptions.length === 0 && !isLoadingPermissions) {
      loadPermissions(permissionSearch);
    }
  }, [isPermissionSelectOpen]);

  const handleSuccess = () => {
    router.push(rolesPath());
  }

  const handleAddPermission = (permissionId: string) => {
    const permission = permissionOptions.find(p => p.id === permissionId);
    if (!permission) return;

    // Verificar se a permissão já está selecionada
    if (!selectedPermissions.some(p => p.id === permissionId)) {
      setSelectedPermissions(prev => [...prev, permission]);
    }
  }

  const handleRemovePermission = (permissionId: string) => {
    setSelectedPermissions(prev => prev.filter(p => p.id !== permissionId));
  }

  // Limpar o campo de pesquisa
  const handleClearSearch = () => {
    setPermissionSearch("");
  }

  // Manipular alterações nos campos para manter o estado atualizado
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Card className="p-6">
      <Form action={action} actionState={state} onSuccess={handleSuccess}>
        {/* Campo oculto para IDs de permissões */}
        <input
          type="hidden"
          name="permissionIds"
          value={JSON.stringify(selectedPermissions.map(p => p.id))}
        />

        <div className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Função</Label>
            <Input
              id="name"
              name="name"
              value={formValues.name}
              onChange={handleInputChange}
              placeholder="Nome da função"
              required
            />
            <FieldError actionState={state} name="name" />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              value={formValues.description}
              onChange={handleInputChange}
              placeholder="Descreva o propósito desta função"
              rows={3}
            />
            <FieldError actionState={state} name="description" />
          </div>

          <h3 className="text-lg font-medium mt-6">Permissões</h3>
          <Separator className="mb-4" />

          {/* Permissões */}
          <div className="space-y-4">
            <Label>Permissões Associadas</Label>

            {/* Lista de permissões selecionadas */}
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedPermissions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma permissão selecionada
                </p>
              ) : (
                selectedPermissions.map(permission => (
                  <Badge
                    key={permission.id}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {permission.name}
                    <button
                      type="button"
                      onClick={() => handleRemovePermission(permission.id)}
                      className="rounded-full hover:bg-muted p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>

            {/* Seletor de permissões com busca */}
            <Select
              open={isPermissionSelectOpen}
              onOpenChange={setIsPermissionSelectOpen}
              onValueChange={handleAddPermission}

            >
              <SelectTrigger onClick={() => setIsPermissionSelectOpen(true)} className="w-full">
                <SelectValue placeholder="Selecione permissões..." >
                  <p className="text-sm text-muted-foreground">
                    selecione permissões...
                  </p>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {/* Campo de busca */}
                <div className="px-3 py-2 mb-2 sticky top-0 bg-background z-10 border-b">
                  <div className="relative">
                    <Input
                      placeholder="Buscar permissão..."
                      value={permissionSearch}
                      onChange={(e) => setPermissionSearch(e.target.value)}
                      className="pr-8"
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                    {permissionSearch && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearSearch();
                        }}
                        className="absolute right-8 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      {isLoadingPermissions ? (
                        <LucideLoaderCircle className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        <Search className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>

                <SelectGroup>
                  {permissionOptions.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                      {isLoadingPermissions
                        ? "Buscando permissões..."
                        : "Nenhuma permissão encontrada"}
                    </div>
                  ) : (
                    permissionOptions
                      .filter(p => !selectedPermissions.some(sp => sp.id === p.id))
                      .map(permission => (
                        <SelectItem key={permission.id} value={permission.id}>
                          <div className="flex flex-col">
                            <span>{permission.name}</span>
                            {permission.description && (
                              <span className="text-xs text-muted-foreground">
                                {permission.description}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                  )}
                </SelectGroup>

                {/* Contador de resultados */}
                {permissionOptions.length > 0 && totalPermissionsCount > permissionOptions.length && (
                  <div className="px-3 py-2 text-xs text-muted-foreground text-center border-t">
                    Mostrando {permissionOptions.length} de {totalPermissionsCount} permissões
                  </div>
                )}
              </SelectContent>
            </Select>
            <FieldError actionState={state} name="permissionIds" />
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-end pt-6">
          <Button
            variant="outline"
            className="mr-2"
            onClick={() => router.push(rolesPath())}
            type="button"
          >
            Cancelar
          </Button>
          <SubmitButton
            variant="default"
            icon={<SaveIcon className="mr-2 h-4 w-4" />}
            label={role ? "Atualizar Função" : "Criar Função"}
          />
        </div>
      </Form>
    </Card>
  )
}