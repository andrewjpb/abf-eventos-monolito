// /features/roles/types.ts
import { roles, permissions, users } from "@prisma/client"

// Tipo básico de roles conforme o modelo do Prisma
export type Role = roles

// Tipo de role com relacionamentos
export type RoleWithRelations = roles & {
  permissions: permissions[]
  users?: users[]
  _count?: {
    users: number
    permissions: number
  }
}

// Tipo básico de permission conforme o modelo do Prisma
export type Permission = permissions

// Props para componentes
export interface RolesSectionProps {
  roles: RoleWithRelations[]
}

export interface RoleCardProps {
  role: RoleWithRelations
  expanded: boolean
  onToggleExpand: (id: string) => void
}

export interface PermissionSectionProps {
  permissions: Permission[]
}

export interface PermissionCardProps {
  permission: Permission
  expanded: boolean
  onToggleExpand: (id: string) => void
}

// Função para obter classe de estilo conforme número de usuários
export const getRoleUsersCountClass = (userCount: number): string => {
  if (userCount > 10) return "bg-green-100 text-green-800 border-green-200";
  if (userCount > 0) return "bg-blue-100 text-blue-800 border-blue-200";
  return "bg-gray-100 text-gray-800 border-gray-200";
};

// Função para obter classe de estilo conforme número de permissões
export const getRolePermissionsCountClass = (permissionCount: number): string => {
  if (permissionCount > 5) return "bg-purple-100 text-purple-800 border-purple-200";
  if (permissionCount > 0) return "bg-indigo-100 text-indigo-800 border-indigo-200";
  return "bg-gray-100 text-gray-800 border-gray-200";
};