// /features/roles/types.ts
import { permissions, roles, users } from "@prisma/client"

// Tipo básico de role conforme o modelo do Prisma
export type Role = roles

// Tipo de role com relacionamentos
export type RoleWithRelations = roles & {
  permissions: permissions[];
  users?: users[];
}

// Props para componentes
export interface RolesSectionProps {
  roles: RoleWithRelations[]
}

export interface RoleCardProps {
  role: RoleWithRelations
  expanded: boolean
  onToggleExpand: (id: string) => void
}

export interface RoleDetailProps {
  role: RoleWithRelations
}