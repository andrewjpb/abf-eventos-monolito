// /features/speakers/types.ts
import { speakers, events, users, company } from "@prisma/client"

// Tipo básico de palestrante conforme o modelo do Prisma
export type Speaker = speakers

// Tipo estendido para usuário com empresa
export type UserWithCompany = users & {
  company: company
}

// Tipo de palestrante com relacionamentos
export type SpeakerWithEvents = speakers & {
  events: events[]
  users: UserWithCompany
}

// Tipo de palestrante com relacionamentos e autorização
export type SpeakerWithAuth = SpeakerWithEvents & {
  isAuthorized: boolean
}

// Props para componentes
export interface SpeakersSectionProps {
  speakers: SpeakerWithEvents[]
}

export interface SpeakerCardProps {
  speaker: SpeakerWithEvents
  expanded: boolean
  onToggleExpand: (id: string) => void
}

// Função para obter classe de estilo conforme número de eventos
export const getSpeakerEventCountClass = (eventCount: number): string => {
  if (eventCount > 5) return "bg-green-100 text-green-800 border-green-200";
  if (eventCount > 0) return "bg-blue-100 text-blue-800 border-blue-200";
  return "bg-gray-100 text-gray-800 border-gray-200";
};