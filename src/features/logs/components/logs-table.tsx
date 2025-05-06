// /features/logs/components/logs-table.tsx
"use client"

import { Fragment, useState } from "react"
import { LogWithUser, getLogLevelColor } from "../types"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  AlertCircle,
  Clock,
  Info,
  User,
  Activity,
  MessageSquare,
  ChevronDown,
  ChevronRight
} from "lucide-react"
import { format } from "date-fns"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { ptBR } from "date-fns/locale"

type LogsTableProps = {
  logs: LogWithUser[]
}

export function LogsTable({ logs }: LogsTableProps) {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({})

  // Toggle expanded state for a log entry
  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const formatDateTime = (date: Date) => {
    return format(new Date(date), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })
  }

  const getLevelIcon = (level: string) => {
    switch (level.toUpperCase()) {
      case "INFO":
        return <Info className="h-4 w-4 text-blue-600" />
      case "ERROR":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case "WARN":
        return <AlertCircle className="h-4 w-4 text-amber-600" />
      case "DEBUG":
        return <Activity className="h-4 w-4 text-green-600" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  // Verificar se há meta dados para exibir
  const hasMeta = (log: LogWithUser) => {
    return log.meta !== null && Object.keys(log.meta as object).length > 0
  }

  // Renderizar JSON de forma bonita
  const renderJson = (data: any) => {
    if (!data) return null

    try {
      // Se for uma string, tenta fazer parse do JSON
      const jsonData = typeof data === 'string' ? JSON.parse(data) : data
      return (
        <pre className="bg-muted/50 p-3 rounded-md text-xs overflow-auto max-h-64">
          {JSON.stringify(jsonData, null, 2)}
        </pre>
      )
    } catch (error) {
      console.error("Erro ao renderizar JSON:", error)
      return <span className="text-muted-foreground">{String(data)}</span>
    }
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <Activity className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">Nenhum log encontrado com os filtros selecionados</p>
      </div>
    )
  }

  // Criar arrays de pares de linhas normal/detalhe
  const logPairs = logs.map(log => ({
    log,
    isExpanded: expandedIds[log.id] || false
  }))

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Nível</TableHead>
            <TableHead className="w-[180px]">Data/Hora</TableHead>
            <TableHead className="w-[180px]">Usuário</TableHead>
            <TableHead className="w-[200px]">Ação</TableHead>
            <TableHead>Mensagem</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logPairs.map(({ log, isExpanded }) => (
            <Fragment key={log.id}>
              {/* Linha de log regular */}
              <TableRow className="group">
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`${getLogLevelColor(log.level)} flex items-center gap-1 font-normal`}
                  >
                    {getLevelIcon(log.level)}
                    <span>{log.level}</span>
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span>{formatDateTime(log.createdAt)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {log.user ? (
                    <div className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="truncate max-w-[120px]" title={log.user.name}>
                        {log.user.name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">Sistema</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Activity className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="truncate max-w-[150px]" title={log.action}>
                      {log.action}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="truncate" title={log.message}>
                      {log.message}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 w-8 p-0 ${!hasMeta(log) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!hasMeta(log)}
                    onClick={() => toggleExpand(log.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
              </TableRow>

              {/* Linha de detalhes (condicional) */}
              {isExpanded && hasMeta(log) && (
                <TableRow className="bg-muted/20">
                  <TableCell colSpan={6} className="p-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Detalhes do Log</h4>
                    <ScrollArea className="h-auto max-h-72">
                      <div className="space-y-2">
                        {renderJson(log.meta)}
                      </div>
                    </ScrollArea>
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}