// /features/permissions/types.ts
import { permissions, roles } from "@prisma/client"

// Tipo básico de permissão conforme o modelo do Prisma
export type Permission = permissions

// Tipo de permissão com relacionamentos
export type PermissionWithRoles = permissions & {
  roles: roles[]
}

// Props para componentes
export interface PermissionsSectionProps {
  permissions: PermissionWithRoles[]
}

export interface PermissionCardProps {
  permission: PermissionWithRoles
  expanded: boolean
  onToggleExpand: (id: string) => void
}

export interface PermissionDetailProps {
  permission: PermissionWithRoles
}