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
  Filter,
  X,
  Calendar as CalendarIcon,
  SortAsc
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useDebounce } from "@/hooks/use-debounce"
import { AdminEventSearchParams, buildAdminEventSearchUrl, getActiveFilters, removeFilter, clearAllFilters, sortLabels } from "../search-params"
import { EVENT_FORMATS, PUBLICATION_STATUS } from "../types"

interface AdminEventFiltersProps {
  initialParams: AdminEventSearchParams
  stats: {
    total: number
    published: number
    draft: number
    archived: number
  }
}

export function AdminEventFilters({ initialParams, stats }: AdminEventFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [search, setSearch] = useState(initialParams.search || "")
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    initialParams.date_from ? new Date(initialParams.date_from) : undefined
  )
  const [dateTo, setDateTo] = useState<Date | undefined>(
    initialParams.date_to ? new Date(initialParams.date_to) : undefined
  )

  const debouncedSearch = useDebounce(search, 500)

  const activeFilters = getActiveFilters(initialParams)

  const updateUrl = useCallback((newParams: Partial<AdminEventSearchParams>) => {
    const currentParams = Object.fromEntries(searchParams.entries())
    const params = { ...currentParams, ...newParams, page: 1 }
    const url = buildAdminEventSearchUrl("/admin/events", params)
    router.push(url)
  }, [router, searchParams])

  // Atualizar busca quando o debounce terminar
  React.useEffect(() => {
    const currentSearch = searchParams.get('search') || ''
    if (debouncedSearch !== currentSearch) {
      updateUrl({ search: debouncedSearch || undefined })
    }
  }, [debouncedSearch, searchParams, updateUrl])

  const handleStatusChange = (value: string) => {
    updateUrl({ status: value === "all" ? undefined : value as any })
  }

  const handleFormatChange = (value: string) => {
    updateUrl({ format: value === "all" ? undefined : value as any })
  }

  const handleHighlightChange = (value: string) => {
    updateUrl({ highlight: value === "all" ? undefined : value as any })
  }

  const handleSortChange = (value: string) => {
    updateUrl({ sort: value as any })
  }

  const handleDateFromSelect = (date: Date | undefined) => {
    setDateFrom(date)
    updateUrl({ 
      date_from: date ? format(date, "yyyy-MM-dd") : undefined 
    })
  }

  const handleDateToSelect = (date: Date | undefined) => {
    setDateTo(date)
    updateUrl({ 
      date_to: date ? format(date, "yyyy-MM-dd") : undefined 
    })
  }

  const handleRemoveFilter = (filterKey: string) => {
    const newParams = removeFilter(initialParams, filterKey)
    const url = buildAdminEventSearchUrl("/admin/events", newParams)
    router.push(url)
  }

  const handleClearAllFilters = () => {
    setSearch("")
    setDateFrom(undefined)
    setDateTo(undefined)
    const newParams = clearAllFilters()
    const url = buildAdminEventSearchUrl("/admin/events", newParams)
    router.push(url)
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtro de status */}
          <Select value={initialParams.status || "all"} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {PUBLICATION_STATUS.map(status => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro de formato */}
          <Select value={initialParams.format || "all"} onValueChange={handleFormatChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Formato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {EVENT_FORMATS.map(format => (
                <SelectItem key={format.value} value={format.value}>
                  {format.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Segunda linha: Filtros avançados */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Filtro de destaque */}
          <Select value={initialParams.highlight || "all"} onValueChange={handleHighlightChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Destaque" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="true">Destacados</SelectItem>
              <SelectItem value="false">Não destacados</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro de data início */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, "dd 'de' MMM yyyy", { locale: ptBR }) : "Data início"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFrom}
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
                {dateTo ? format(dateTo, "dd 'de' MMM yyyy", { locale: ptBR }) : "Data fim"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={handleDateToSelect}
                locale={ptBR}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Ordenação */}
          <Select value={initialParams.sort} onValueChange={handleSortChange}>
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
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>Total: {stats.total}</span>
            <span>Publicados: {stats.published}</span>
            <span>Rascunhos: {stats.draft}</span>
            <span>Arquivados: {stats.archived}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}