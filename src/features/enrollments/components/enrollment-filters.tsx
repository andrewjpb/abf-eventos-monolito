// /features/enrollments/components/enrollment-filters.tsx
"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useQueryState } from "nuqs"
import { searchParse, eventIdParse, segmentParse, statusParse, typeParse } from "../search-params"
import { Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface EnrollmentFiltersProps {
  events?: Array<{ id: string; title: string }>;
  segments?: string[];
  types?: string[];
  fixedEventId?: string; // Nova prop para fixar evento
  fixedEventTitle?: string; // Título do evento fixo
}

export function EnrollmentFilters({
  events = [],
  segments = [],
  types = [],
  fixedEventId,
  fixedEventTitle
}: EnrollmentFiltersProps) {
  const [search, setSearch] = useQueryState("search", searchParse)
  const [eventId, setEventId] = useQueryState("eventId", eventIdParse)
  const [segment, setSegment] = useQueryState("segment", segmentParse)
  const [status, setStatus] = useQueryState("status", statusParse)
  const [type, setType] = useQueryState("type", typeParse)

  const [inputValue, setInputValue] = useState(search || "")

  // Sincronizar o input com o valor da URL
  useEffect(() => {
    setInputValue(search || "")
  }, [search])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(inputValue)
  }

  const clearFilters = () => {
    setSearch("")
    // Só limpa o eventId se não for fixo
    if (!fixedEventId) {
      setEventId("ALL")
    }
    setSegment("ALL")
    setStatus("ALL")
    setType("ALL")
    setInputValue("")
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium">Filtros</h3>
        </div>

        <div className={`grid gap-4 ${fixedEventId
          ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" // Sem o campo de evento
          : "grid-cols-1 md:grid-cols-2 lg:grid-cols-5" // Com o campo de evento
          }`}>
          {/* Busca por texto */}
          <div className="space-y-2">
            <Label htmlFor="search">Buscar</Label>
            <form onSubmit={handleSubmit} className="flex">
              <Input
                id="search"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Nome, email ou evento..."
                className="pr-8"
              />
              <Button
                type="submit"
                className="ml-2"
                variant="secondary"
                size="sm"
              >
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </div>

          {/* Filtro por evento */}
          <div className={cn(fixedEventId ? "hidden" : "w-full space-y-2")}>
            <Label htmlFor="event">Evento</Label>
            {fixedEventId && fixedEventTitle ? (
              // Evento fixo - não editável
              <div className="flex items-center gap-2 w-full">
                <div className="flex-1 px-3 py-2 bg-muted rounded-md border border-border">
                  <span className="text-sm font-medium">{fixedEventTitle}</span>
                  <span className="text-xs text-muted-foreground ml-2">(Evento selecionado)</span>
                </div>
              </div>
            ) : (
              // Seletor normal de evento
              <Select
                value={eventId || "ALL"}
                onValueChange={(value) => setEventId(value === "ALL" ? "" : value)}
              >
                <SelectTrigger id="event" className="w-full">
                  <SelectValue placeholder="Todos os eventos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os eventos</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Filtro por segmento */}
          <div className="space-y-2">
            <Label htmlFor="segment">Segmento</Label>
            <Select
              value={segment || "ALL"}
              onValueChange={(value) => setSegment(value)}
            >
              <SelectTrigger id="segment" className="w-full">
                <SelectValue placeholder="Todos os segmentos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os segmentos</SelectItem>
                {segments.map((seg) => (
                  <SelectItem key={seg} value={seg}>
                    {seg}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={status || "ALL"}
              onValueChange={(value) => setStatus(value)}
            >
              <SelectTrigger id="status" className="w-full">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os status</SelectItem>
                <SelectItem value="CHECKED_IN">Check-in feito</SelectItem>
                <SelectItem value="PENDING">Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por tipo */}
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Participante</Label>
            <Select
              value={type || "ALL"}
              onValueChange={(value) => setType(value)}
            >
              <SelectTrigger id="type" className="w-full">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os tipos</SelectItem>
                {types.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
          >
            Limpar Filtros
          </Button>
        </div>
      </div>
    </Card>
  )
}