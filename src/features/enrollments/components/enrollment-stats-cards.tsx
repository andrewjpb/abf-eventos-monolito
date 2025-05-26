// /features/enrollments/components/enrollment-stats-cards.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Calendar,
  TrendingUp,
  UserCheck,
  Building,
  MapPin
} from "lucide-react"
import { EnrollmentStats } from "../types"
import Link from "next/link"
import { enrollmentsByEventPath } from "@/app/paths"

interface EnrollmentStatsCardsProps {
  stats: EnrollmentStats
}

export function EnrollmentStatsCards({ stats }: EnrollmentStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total de Inscrições */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Inscrições</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalEnrollments.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Todas as inscrições registradas
          </p>
        </CardContent>
      </Card>

      {/* Total de Eventos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Eventos com Inscrições</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalEvents.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Eventos que receberam inscrições
          </p>
        </CardContent>
      </Card>

      {/* Média de Inscrições por Evento */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Média por Evento</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.averageEnrollmentsPerEvent}</div>
          <p className="text-xs text-muted-foreground">
            Inscrições em média por evento
          </p>
        </CardContent>
      </Card>

      {/* Segmentos Ativos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Segmentos Ativos</CardTitle>
          <Building className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.enrollmentsBySegment.length}</div>
          <p className="text-xs text-muted-foreground">
            Segmentos com inscrições
          </p>
        </CardContent>
      </Card>

      {/* Top Segmentos */}
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Building className="h-5 w-5 mr-2" />
            Segmentos por Inscrições (Todos)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.enrollmentsBySegment && stats.enrollmentsBySegment.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {stats.enrollmentsBySegment.map((segment, index) => (
                <div key={`${segment.segment}-${index}`} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <span className="text-sm font-medium">{segment.segment}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      {segment.count} ({segment.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <div className="text-center">
                <Building className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum segmento encontrado</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Eventos - ATUALIZADO COM INFORMAÇÕES CORRETAS */}
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Eventos com Mais Inscrições
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.topEvents && stats.topEvents.length > 0 ? (
            <div className="space-y-3">
              {stats.topEvents.slice(0, 5).map((event, index) => (
                <Link
                  key={event.eventId}
                  href={enrollmentsByEventPath(event.eventId)}
                  className="block hover:bg-muted/50 rounded-lg transition-colors"
                >
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/50">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium truncate max-w-[200px] hover:text-primary">
                          {event.eventTitle}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="text-blue-600">{event.presentialCount} presencial</span>
                          <span>•</span>
                          <span className="text-purple-600">{event.onlineCount} online</span>
                          <span>•</span>
                          <span>{event.enrollmentCount} total</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex flex-col gap-1">
                        <Badge
                          variant={event.presentialOccupancyRate >= 100 ? "destructive" : event.presentialOccupancyRate >= 75 ? "default" : "secondary"}
                          className="text-xs"
                        >
                          Presencial: {event.presentialOccupancyRate.toFixed(1)}%
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {event.presentialCount}/{event.vacancyTotal} vagas presenciais
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <div className="text-center">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum evento com inscrições encontrado</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}