// /features/supporters/types.ts
import { supporters, events } from "@prisma/client"

// Tipo básico de apoiador conforme o modelo do Prisma
export type Supporter = supporters

// Tipo de apoiador com relacionamentos
export type SupporterWithEvents = supporters & {
  events: events[]
}

// Props para componentes
export interface SupportersSectionProps {
  supporters: SupporterWithEvents[]
}

export interface SupporterCardProps {
  supporter: SupporterWithEvents
  expanded: boolean
  onToggleExpand: (id: string) => void
}

// Função para obter classe de estilo conforme número de eventos
export const getSupporterEventCountClass = (eventCount: number): string => {
  if (eventCount > 5) return "bg-green-100 text-green-800 border-green-200";
  if (eventCount > 0) return "bg-blue-100 text-blue-800 border-blue-200";
  return "bg-gray-100 text-gray-800 border-gray-200";
};