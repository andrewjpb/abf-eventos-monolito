// /features/logs/types.ts
import { AppLog, users } from "@prisma/client"

// Tipo de log com usuário
export type LogWithUser = AppLog & {
  user?: users | null
}

// Props para o componente LogsSection
export interface LogsSectionProps {
  logs: LogWithUser[]
}

// Props para a tabela de logs
export interface LogsTableProps {
  logs: LogWithUser[]
}

// Tipos de nível de log para filtro
export const LOG_LEVELS = ["INFO", "ERROR", "WARN", "DEBUG"] as const
export type LogLevel = typeof LOG_LEVELS[number]

// Props para o componente de filtro de logs
export interface LogFilterProps {
  onFilterChange: (filters: LogFilters) => void
  filters: LogFilters
  userOptions: {
    id: string
    name: string
  }[]
}

// Tipo para os filtros de log
export type LogFilters = {
  level: string | null
  userId: string | null
  action: string | null
  startDate: Date | null
  endDate: Date | null
}

// Função para obter a cor do nível de log
export const getLogLevelColor = (level: string): string => {
  switch (level.toUpperCase()) {
    case "INFO":
      return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
    case "ERROR":
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
    case "WARN":
      return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800"
    case "DEBUG":
      return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
  }
}