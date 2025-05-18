// /features/companies/types.ts
import { company, users } from "@prisma/client"

// Tipo básico de company conforme o modelo do Prisma
export type Company = company

// Tipo de company com relacionamentos
export type CompanyWithRelations = company & {
  users?: users[];
}

// Props para componentes
export interface CompaniesSectionProps {
  companies: CompanyWithRelations[]
}

export interface CompanyCardProps {
  company: CompanyWithRelations
  expanded: boolean
  onToggleExpand: (id: string) => void
}

export interface CompanyDetailProps {
  company: CompanyWithRelations
}