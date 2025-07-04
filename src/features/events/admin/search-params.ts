import { z } from "zod"
import { AdminEventSortOption, AdminEventStatus } from "./types"

// Schema para validação dos parâmetros de busca
export const adminEventSearchParamsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  per_page: z.coerce.number().min(1).max(100).default(12),
  search: z.string().optional(),
  status: z.enum(['published', 'draft', 'archived']).optional(),
  format: z.enum(['PRESENCIAL', 'ONLINE', 'HIBRIDO']).optional(),
  highlight: z.enum(['true', 'false']).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  sort: z.enum([
    'date_asc',
    'date_desc', 
    'created_desc',
    'created_asc',
    'title_asc',
    'title_desc',
    'enrollments_desc',
    'enrollments_asc'
  ]).default('date_desc')
})

export type AdminEventSearchParams = z.infer<typeof adminEventSearchParamsSchema>

// Função para construir URL com parâmetros de busca
export const buildAdminEventSearchUrl = (
  baseUrl: string,
  params: Partial<AdminEventSearchParams>
): string => {
  const urlParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      urlParams.set(key, String(value))
    }
  })
  
  const queryString = urlParams.toString()
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}

// Função para extrair filtros ativos
export const getActiveFilters = (params: AdminEventSearchParams) => {
  const filters: Array<{ key: string; label: string; value: string }> = []
  
  if (params.search) {
    filters.push({ key: 'search', label: 'Busca', value: params.search })
  }
  
  if (params.status) {
    const statusLabels = {
      published: 'Publicado',
      draft: 'Rascunho', 
      archived: 'Arquivado'
    }
    filters.push({ 
      key: 'status', 
      label: 'Status', 
      value: statusLabels[params.status] 
    })
  }
  
  if (params.format) {
    const formatLabels = {
      PRESENCIAL: 'Presencial',
      ONLINE: 'Online',
      HIBRIDO: 'Híbrido'
    }
    filters.push({ 
      key: 'format', 
      label: 'Formato', 
      value: formatLabels[params.format] 
    })
  }
  
  if (params.highlight === 'true') {
    filters.push({ key: 'highlight', label: 'Destaque', value: 'Sim' })
  }
  
  if (params.date_from) {
    filters.push({ 
      key: 'date_from', 
      label: 'Data início', 
      value: new Date(params.date_from).toLocaleDateString('pt-BR') 
    })
  }
  
  if (params.date_to) {
    filters.push({ 
      key: 'date_to', 
      label: 'Data fim', 
      value: new Date(params.date_to).toLocaleDateString('pt-BR') 
    })
  }
  
  if (params.city) {
    filters.push({ key: 'city', label: 'Cidade', value: params.city })
  }
  
  if (params.state) {
    filters.push({ key: 'state', label: 'Estado', value: params.state })
  }
  
  return filters
}

// Função para remover um filtro específico
export const removeFilter = (
  params: AdminEventSearchParams,
  filterKey: string
): Partial<AdminEventSearchParams> => {
  const newParams = { ...params }
  delete newParams[filterKey as keyof AdminEventSearchParams]
  newParams.page = 1 // Reset para primeira página
  return newParams
}

// Função para limpar todos os filtros
export const clearAllFilters = (): Partial<AdminEventSearchParams> => ({
  page: 1,
  per_page: 12,
  sort: 'date_desc'
})

// Labels para ordenação
export const sortLabels: Record<AdminEventSortOption, string> = {
  date_asc: 'Data (mais antiga)',
  date_desc: 'Data (mais recente)',
  created_desc: 'Criação (mais recente)',
  created_asc: 'Criação (mais antiga)',
  title_asc: 'Título (A-Z)',
  title_desc: 'Título (Z-A)',
  enrollments_desc: 'Inscrições (maior)',
  enrollments_asc: 'Inscrições (menor)'
}