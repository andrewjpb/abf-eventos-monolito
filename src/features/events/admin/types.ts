import { events, address, speakers, sponsors, supporters, attendance_list, cities, states, users, event_schedule } from "@prisma/client"

// Tipo completo do evento para admin com todos os relacionamentos
export type AdminEventWithDetails = events & {
  address: address & {
    cities: cities
    states: states
  }
  speakers: Array<speakers & {
    users: Pick<users, 'id' | 'name' | 'email' | 'position' | 'image_url'>
  }>
  sponsors: sponsors[]
  supporters: supporters[]
  schedule: event_schedule[]
  _count: {
    attendance_list: number
    speakers: number
    sponsors: number
    supporters: number
    schedule: number
  }
}

// Tipo simplificado para listagem
export type AdminEventSummary = Pick<events, 
  'id' | 'title' | 'slug' | 'image_url' | 'thumb_url' | 'summary' | 'date' | 'format' | 
  'vacancy_total' | 'highlight' | 'isPublished' | 'created_at' | 'updatedAt'
> & {
  address: {
    cities: Pick<cities, 'name'>
    states: Pick<states, 'uf'>
  }
  _count: {
    attendance_list: number
  }
}

// Status do evento para admin
export type AdminEventStatus = 'published' | 'draft' | 'archived'

// Filtros para busca de eventos admin
export interface AdminEventFilters {
  search?: string
  status?: AdminEventStatus
  format?: string
  dateFrom?: string
  dateTo?: string
  highlight?: boolean
  city?: string
  state?: string
}

// Dados para criação/edição de evento
export interface EventFormData {
  title: string
  slug: string
  summary: string
  description: string
  date: string
  start_time: string
  end_time: string
  format: string
  vacancy_total: number
  vacancies_per_brand: number
  minimum_quorum: number
  highlight: boolean
  isPublished: boolean
  isStreaming: boolean
  transmission_link?: string
  schedule_link?: string
  free_online: boolean
  addressId: string
  speakerIds?: string[]
  sponsorIds?: string[]
  supporterIds?: string[]
}

// Estatísticas do evento para dashboard admin
export interface AdminEventStats {
  totalEvents: number
  publishedEvents: number
  draftEvents: number
  highlightedEvents: number
  totalEnrollments: number
  avgEnrollmentsPerEvent: number
  upcomingEvents: number
  pastEvents: number
  todayEvents: number
}

// Tipo para exportação de dados do evento
export interface EventExportData {
  id: string
  title: string
  date: string
  format: string
  status: string
  enrollments: number
  vacancy_total: number
  occupancy_rate: string
  city: string
  state: string
  created_at: string
}

// Opções de ordenação para eventos admin
export type AdminEventSortOption = 
  | 'date_asc' 
  | 'date_desc' 
  | 'created_desc' 
  | 'created_asc' 
  | 'title_asc' 
  | 'title_desc'
  | 'enrollments_desc'
  | 'enrollments_asc'

// Formatos de evento disponíveis
export const EVENT_FORMATS = [
  { value: 'PRESENCIAL', label: 'Presencial' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'HIBRIDO', label: 'Híbrido' }
] as const

// Status de publicação
export const PUBLICATION_STATUS = [
  { value: 'published', label: 'Publicado', color: 'green' },
  { value: 'draft', label: 'Rascunho', color: 'yellow' },
  { value: 'archived', label: 'Arquivado', color: 'gray' }
] as const

// Funções utilitárias para eventos admin
export const getEventStatus = (event: Pick<events, 'isPublished' | 'date'>): AdminEventStatus => {
  if (!event.isPublished) return 'draft'
  if (new Date(event.date) < new Date()) return 'archived'
  return 'published'
}

export const getEventStatusColor = (status: AdminEventStatus): string => {
  const statusConfig = PUBLICATION_STATUS.find(s => s.value === status)
  return statusConfig?.color || 'gray'
}

export const getEventStatusLabel = (status: AdminEventStatus): string => {
  const statusConfig = PUBLICATION_STATUS.find(s => s.value === status)
  return statusConfig?.label || 'Desconhecido'
}

// Função para calcular taxa de ocupação
export const calculateOccupancyRate = (enrollments: number, totalVacancy: number): number => {
  if (totalVacancy === 0) return 0
  return Math.round((enrollments / totalVacancy) * 100)
}

// Função para verificar se evento está lotado
export const isEventFull = (enrollments: number, totalVacancy: number): boolean => {
  return enrollments >= totalVacancy
}

// Função para verificar se evento está quase lotado (90% ou mais)
export const isEventAlmostFull = (enrollments: number, totalVacancy: number): boolean => {
  return calculateOccupancyRate(enrollments, totalVacancy) >= 90
}