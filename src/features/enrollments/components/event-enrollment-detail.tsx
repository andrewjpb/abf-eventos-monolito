// /features/enrollments/components/event-enrollment-detail.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { EventEnrollmentStats } from "../types"
import {
  Calendar,
  Users,
  UserCheck,
  Clock,
  TrendingUp,
  MapPin,
  Building,
  UserX
} from "lucide-react"
import Link from "next/link"
import { eventPath } from "@/app/paths"

interface EventEnrollmentDetailProps {
  stats: EventEnrollmentStats
}

export function EventEnrollmentDetail({ stats }: EventEnrollmentDetailProps) {
  const {
    event,
    totalEnrollments,
    checkedInCount,
    pendingCount,
    presentialEnrollments,
    onlineEnrollments,
    presentialOccupancyRate,
    totalOccupancyRate
  } = stats

  return (
    <div className="space-y-6">
      {/* Header do evento */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="space-y-2">
              <CardTitle className="text-xl flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                {event.title}
              </CardTitle>
              <div className="flex items-center text-muted-foreground">
                <MapPin className="h-4 w-4 mr-1" />
                <span className="text-sm">
                  {event.is_international
                    ? `${event.location_city}, ${event.location_country}`
                    : event.address
                      ? `${event.address.cities.name}, ${event.address.states.name}`
                      : 'Local a definir'
                  }
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {new Date(event.date).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })} às {event.start_time}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <Link
                href={eventPath(event.id)}
                className="text-sm text-primary hover:underline"
              >
                Ver evento →
              </Link>
              <div className="text-right">
                <Badge
                  variant={presentialOccupancyRate >= 100 ? "destructive" : presentialOccupancyRate >= 75 ? "default" : "secondary"}
                  className="mb-1"
                >
                  Presencial: {presentialOccupancyRate.toFixed(1)}%
                </Badge>
                <p className="text-xs text-muted-foreground">
                  {presentialEnrollments}/{event.vacancy_total} vagas presenciais
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Estatísticas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Inscrições</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEnrollments}</div>
            <div className="text-xs text-muted-foreground">
              {presentialEnrollments} presencial + {onlineEnrollments} online
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Presencial</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{presentialEnrollments}</div>
            <div className="text-xs text-muted-foreground">
              de {event.vacancy_total} vagas ({presentialOccupancyRate.toFixed(1)}%)
            </div>
            <Progress value={presentialOccupancyRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{onlineEnrollments}</div>
            <div className="text-xs text-muted-foreground">
              sem limite de vagas
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Check-in Realizado</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{checkedInCount}</div>
            <div className="text-xs text-muted-foreground">
              {totalEnrollments > 0 ? Math.round((checkedInCount / totalEnrollments) * 100) : 0}% dos inscritos
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <div className="text-xs text-muted-foreground">
              aguardando check-in
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Análises detalhadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inscrições por empresa (top 10) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Top 10 Empresas por Inscrições
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.enrollmentsByCompany && stats.enrollmentsByCompany.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {stats.enrollmentsByCompany.map((company, index) => (
                  <div key={company.company_cnpj} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                          {index + 1}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium truncate block">
                            {company.company_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            CNPJ: {company.company_cnpj}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm text-muted-foreground">
                          {company.count} ({company.percentage}%)
                        </span>
                      </div>
                    </div>
                    <Progress value={company.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Nenhuma informação de empresa disponível
              </p>
            )}
          </CardContent>
        </Card>

        {/* Inscrições por cidades */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Inscrições por Cidades
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.enrollmentsByCity && stats.enrollmentsByCity.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {stats.enrollmentsByCity.map((city, index) => (
                  <div key={city.city} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                          {index + 1}
                        </Badge>
                        <span className="text-sm font-medium">{city.city}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {city.count} ({city.percentage}%)
                        </span>
                      </div>
                    </div>
                    <Progress value={city.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Nenhuma informação de cidade disponível
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}