// /features/sponsors/types.ts
import { sponsors, events } from "@prisma/client"

// Tipo básico de patrocinador conforme o modelo do Prisma
export type Sponsor = sponsors

// Tipo de patrocinador com relacionamentos
export type SponsorWithEvents = sponsors & {
  events: events[]
}

// Props para componentes
export interface SponsorsSectionProps {
  sponsors: SponsorWithEvents[]
}

export interface SponsorCardProps {
  sponsor: SponsorWithEvents
  expanded: boolean
  onToggleExpand: (id: string) => void
}

// Função para obter classe de estilo conforme número de eventos
export const getSponsorEventCountClass = (eventCount: number): string => {
  if (eventCount > 5) return "bg-green-100 text-green-800 border-green-200";
  if (eventCount > 0) return "bg-blue-100 text-blue-800 border-blue-200";
  return "bg-gray-100 text-gray-800 border-gray-200";
};