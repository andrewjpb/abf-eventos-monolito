"use client"

import React, { useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import {
  Search,
  X,
  Calendar as CalendarIcon,
  SortAsc
} from "lucide-react"
import { format as formatDate } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useDebounce } from "@/hooks/use-debounce"
import { EVENT_FORMATS, PUBLICATION_STATUS } from "../types"
import { sortLabels } from "../search-params"
import { useQuery } from "@tanstack/react-query"
import { getAdminEventsStats } from "../queries/get-admin-events-stats"

export function AdminEventFiltersSimple() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Estados locais para inputs controlados
  const [localSearch, setLocalSearch] = useState(searchParams.get('search') || '')
  const [localDateFrom, setLocalDateFrom] = useState<Date | undefined>(
    searchParams.get('date_from') ? new Date(searchParams.get('date_from')!) : undefined
  )
  const [localDateTo, setLocalDateTo] = useState<Date | undefined>(
    searchParams.get('date_to') ? new Date(searchParams.get('date_to')!) : undefined
  )

  const debouncedSearch = useDebounce(localSearch, 500)

  // Buscar estatísticas
  const { data: stats } = useQuery({
    queryKey: ["admin-events-stats"],
    queryFn: () => getAdminEventsStats(),
  })

  // Função para atualizar URL
  const updateUrl = useCallback((newParams: Record<string, string | undefined>) => {
    const current = new URLSearchParams(searchParams.toString())
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        current.set(key, value)
      } else {
        current.delete(key)
      }
    })
    
    router.push(`/admin/events?${current.toString()}`)
  }, [router, searchParams])

  // Atualizar busca quando o debounce terminar
  React.useEffect(() => {
    const currentSearch = searchParams.get('search') || ''
    if (debouncedSearch !== currentSearch) {
      updateUrl({ search: debouncedSearch || undefined })
    }
  }, [debouncedSearch, searchParams, updateUrl])

  const handleStatusChange = (value: string) => {
    updateUrl({ status: value === "ALL" ? undefined : value })
  }

  const handleFormatChange = (value: string) => {
    updateUrl({ format: value === "ALL" ? undefined : value })
  }

  const handleHighlightChange = (value: string) => {
    updateUrl({ highlight: value === "ALL" ? undefined : value })
  }

  const handleSortChange = (value: string) => {
    updateUrl({ sort: value })
  }

  const handleDateFromSelect = (date: Date | undefined) => {
    setLocalDateFrom(date)
    updateUrl({ date_from: date ? formatDate(date, "yyyy-MM-dd") : undefined })
  }

  const handleDateToSelect = (date: Date | undefined) => {
    setLocalDateTo(date)
    updateUrl({ date_to: date ? formatDate(date, "yyyy-MM-dd") : undefined })
  }

  const handleClearAllFilters = () => {
    setLocalSearch("")
    setLocalDateFrom(undefined)
    setLocalDateTo(undefined)
    router.push('/admin/events')
  }

  // Filtros ativos
  const activeFilters = [
    searchParams.get('search') && { 
      key: 'search', 
      label: 'Busca', 
      value: searchParams.get('search')! 
    },
    searchParams.get('status') && searchParams.get('status') !== 'ALL' && { 
      key: 'status', 
      label: 'Status', 
      value: PUBLICATION_STATUS.find(s => s.value === searchParams.get('status'))?.label || searchParams.get('status')! 
    },
    searchParams.get('format') && searchParams.get('format') !== 'ALL' && { 
      key: 'format', 
      label: 'Formato', 
      value: EVENT_FORMATS.find(f => f.value === searchParams.get('format'))?.label || searchParams.get('format')! 
    },
    searchParams.get('highlight') && searchParams.get('highlight') !== 'ALL' && { 
      key: 'highlight', 
      label: 'Destaque', 
      value: searchParams.get('highlight') === 'true' ? 'Destacados' : 'Não destacados' 
    },
    searchParams.get('date_from') && { 
      key: 'date_from', 
      label: 'Data início', 
      value: formatDate(new Date(searchParams.get('date_from')!), "dd/MM/yyyy") 
    },
    searchParams.get('date_to') && { 
      key: 'date_to', 
      label: 'Data fim', 
      value: formatDate(new Date(searchParams.get('date_to')!), "dd/MM/yyyy") 
    },
  ].filter(Boolean) as { key: string; label: string; value: string }[]

  const handleRemoveFilter = (filterKey: string) => {
    const updates: Record<string, undefined> = {}
    updates[filterKey] = undefined
    
    if (filterKey === 'search') {
      setLocalSearch("")
    } else if (filterKey === 'date_from') {
      setLocalDateFrom(undefined)
    } else if (filterKey === 'date_to') {
      setLocalDateTo(undefined)
    }
    
    updateUrl(updates)
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        {/* Primeira linha: Busca e filtros principais */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Campo de busca */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar eventos por título, resumo ou descrição..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtro de status */}
          <Select value={searchParams.get('status') || 'ALL'} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os status</SelectItem>
              {PUBLICATION_STATUS.map(statusOption => (
                <SelectItem key={statusOption.value} value={statusOption.value}>
                  {statusOption.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro de formato */}
          <Select value={searchParams.get('format') || 'ALL'} onValueChange={handleFormatChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Formato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              {EVENT_FORMATS.map(formatOption => (
                <SelectItem key={formatOption.value} value={formatOption.value}>
                  {formatOption.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Segunda linha: Filtros avançados */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Filtro de destaque */}
          <Select value={searchParams.get('highlight') || 'ALL'} onValueChange={handleHighlightChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Destaque" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="true">Destacados</SelectItem>
              <SelectItem value="false">Não destacados</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro de data início */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {localDateFrom ? formatDate(localDateFrom, "dd 'de' MMM yyyy", { locale: ptBR }) : "Data início"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={localDateFrom}
                onSelect={handleDateFromSelect}
                locale={ptBR}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Filtro de data fim */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {localDateTo ? formatDate(localDateTo, "dd 'de' MMM yyyy", { locale: ptBR }) : "Data fim"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={localDateTo}
                onSelect={handleDateToSelect}
                locale={ptBR}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Ordenação */}
          <Select value={searchParams.get('sort') || 'date_desc'} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[200px]">
              <SortAsc className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(sortLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filtros ativos e estatísticas */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pt-4 border-t">
          {/* Filtros ativos */}
          <div className="flex flex-wrap items-center gap-2">
            {activeFilters.length > 0 && (
              <>
                <span className="text-sm text-muted-foreground">Filtros:</span>
                {activeFilters.map(filter => (
                  <Badge key={filter.key} variant="secondary" className="gap-1">
                    {filter.label}: {filter.value}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => handleRemoveFilter(filter.key)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAllFilters}
                  className="text-muted-foreground"
                >
                  Limpar filtros
                </Button>
              </>
            )}
          </div>

          {/* Estatísticas */}
          {stats && (
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>Total: {stats.total}</span>
              <span>Publicados: {stats.published}</span>
              <span>Rascunhos: {stats.draft}</span>
              <span>Arquivados: {stats.archived}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}