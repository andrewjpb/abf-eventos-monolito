// /features/logs/components/log-filter.tsx
"use client"

import { useState, useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon, Filter, X } from "lucide-react"
import { useQueryState } from "nuqs"
import {
  levelParse,
  userIdParse,
  actionParse,
  startDateParse,
  endDateParse
} from "../search-params"
import { LOG_LEVELS } from "../types"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"

// Valores especiais para representar "todos"
const ALL_LEVELS = "all_levels"
const ALL_USERS = "all_users"

export function LogFilter() {
  // Query state hooks
  const [level, setLevel] = useQueryState("level", levelParse)
  const [userId, setUserId] = useQueryState("userId", userIdParse)
  const [action, setAction] = useQueryState("action", actionParse)
  const [startDate, setStartDate] = useQueryState("startDate", startDateParse)
  const [endDate, setEndDate] = useQueryState("endDate", endDateParse)

  // Local input state
  const [actionInput, setActionInput] = useState(action || "")
  const [userOptions, setUserOptions] = useState<{ id: string, name: string }[]>([])

  // Carregamento dos usuários
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetch('/api/logs/users')
        if (response.ok) {
          const data = await response.json()
          setUserOptions(data)
        }
      } catch (error) {
        console.error('Erro ao carregar usuários:', error)
      }
    }

    loadUsers()
  }, [])

  // Função para formatar a data para exibição
  const formatDateDisplay = (date: Date | null) => {
    if (!date) return ""
    return format(date, "dd/MM/yyyy")
  }

  // Função para limpar todos os filtros
  const clearFilters = () => {
    setLevel("")
    setUserId("")
    setAction("")
    setStartDate(null)
    setEndDate(null)
    setActionInput("")
  }

  // Verificar se há algum filtro ativo
  const hasActiveFilters = level || userId || action || startDate || endDate

  // Verificar se há ações de autocomplete disponíveis
  const handleSubmitAction = (e: React.FormEvent) => {
    e.preventDefault()
    setAction(actionInput.trim() || "")
  }

  // Manipuladores para conversão entre valores de UI e valores reais
  const handleLevelChange = (value: string) => {
    setLevel(value === ALL_LEVELS ? "" : value)
  }

  const handleUserChange = (value: string) => {
    setUserId(value === ALL_USERS ? "" : value)
  }

  return (
    <Card className="p-0">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </h3>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 text-muted-foreground"
            >
              <X className="mr-1 h-3 w-3" />
              Limpar filtros
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Filtro de nível */}
          <div className="space-y-2 w-full ">
            <Label htmlFor="level-filter">Nível</Label>
            <Select
              value={level || ALL_LEVELS}
              onValueChange={handleLevelChange}

            >
              <SelectTrigger id="level-filter" className="w-full">
                <SelectValue placeholder="Todos os níveis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_LEVELS}>Todos os níveis</SelectItem>
                {LOG_LEVELS.map((logLevel) => (
                  <SelectItem key={logLevel} value={logLevel}>
                    {logLevel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro de usuário */}
          <div className="space-y-2">
            <Label htmlFor="user-filter">Usuário</Label>
            <Select
              value={userId || ALL_USERS}
              onValueChange={handleUserChange}
            >
              <SelectTrigger id="user-filter" className="w-full">
                <SelectValue placeholder="Todos os usuários" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_USERS}>Todos os usuários</SelectItem>
                <SelectItem value="null">Sem usuário</SelectItem>
                {userOptions.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro de ação */}
          <div className="space-y-2">
            <Label htmlFor="action-filter">Ação</Label>
            <form onSubmit={handleSubmitAction} className="flex space-x-2">
              <Input
                id="action-filter"
                value={actionInput}
                onChange={(e) => setActionInput(e.target.value)}
                placeholder="Filtrar por ação"
              />
              <Button type="submit" variant="secondary" className="shrink-0">
                Filtrar
              </Button>
            </form>
          </div>

          {/* Filtros de data */}
          <div className="space-y-2 col-span-1 md:col-span-2 lg:col-span-1">
            <Label>Período</Label>
            <div className="flex space-x-2">
              {/* Data inicial */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1 justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? formatDateDisplay(startDate) : "Data inicial"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate || undefined}
                    onSelect={(date) => setStartDate(date ? date : null)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {/* Data final */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1 justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? formatDateDisplay(endDate) : "Data final"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate || undefined}
                    onSelect={(date) => setEndDate(date ? date : null)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}