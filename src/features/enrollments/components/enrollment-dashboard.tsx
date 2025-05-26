// /features/enrollments/components/enrollment-dashboard.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EnrollmentStats } from "../types"
import { EnrollmentStatsCards } from "./enrollment-stats-cards"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line
} from "recharts"
import Link from "next/link"
import { enrollmentsByEventPath } from "@/app/paths"

interface EnrollmentDashboardProps {
  stats: EnrollmentStats
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7300', '#8DD1E1', '#D084D0']

export function EnrollmentDashboard({ stats }: EnrollmentDashboardProps) {
  // Preparar dados para gráficos
  const monthlyData = stats.enrollmentsByMonth.slice(0, 12).reverse()
  const segmentData = stats.enrollmentsBySegment
  const topEventsData = stats.topEvents.slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex-1 space-y-1">
          <h1 className="text-2xl font-bold">Dashboard de Inscrições</h1>
          <p className="text-muted-foreground">
            Visão geral e análise de inscrições em eventos
          </p>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <EnrollmentStatsCards stats={stats} />

      {/* Gráficos e análises */}
      <Tabs defaultValue="monthly" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="monthly">Evolução Mensal</TabsTrigger>
          <TabsTrigger value="segments">Por Segmento</TabsTrigger>
          <TabsTrigger value="events">Top Eventos</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inscrições por Mês (Últimos 12 meses)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        const [year, month] = value.split('-')
                        return `${month}/${year.slice(2)}`
                      }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      labelFormatter={(value) => {
                        const [year, month] = value.split('-')
                        const monthNames = [
                          'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                          'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
                        ]
                        return `${monthNames[parseInt(month) - 1]}/${year}`
                      }}
                      formatter={(value) => [value, 'Inscrições']}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#8884d8"
                      strokeWidth={2}
                      dot={{ fill: '#8884d8' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de barras */}
            <Card>
              <CardHeader>
                <CardTitle>Inscrições por Segmento (Barras)</CardTitle>
              </CardHeader>
              <CardContent>
                {segmentData && segmentData.length > 0 ? (
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={segmentData}
                        layout="horizontal"
                        margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis
                          type="category"
                          dataKey="segment"
                          tick={{ fontSize: 10 }}
                          width={110}
                        />
                        <Tooltip
                          formatter={(value) => [value, 'Inscrições']}
                          labelFormatter={(label) => `Segmento: ${label}`}
                        />
                        <Bar dataKey="count" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <p>Nenhum dado de segmento disponível</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gráfico de barras verticais com gradiente */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Segmento</CardTitle>
              </CardHeader>
              <CardContent>
                {segmentData && segmentData.length > 0 ? (
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={segmentData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                        <XAxis
                          dataKey="segment"
                          tick={{ fontSize: 10 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          interval={0}
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          label={{ value: 'Inscrições', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip
                          formatter={(value, name, props) => [
                            `${value} inscrições (${props.payload.percentage}%)`,
                            'Total'
                          ]}
                          labelFormatter={(label) => `Segmento: ${label}`}
                          contentStyle={{
                            backgroundColor: '#1f2937',
                            border: '1px solid #374151',
                            borderRadius: '6px',
                            color: '#f9fafb'
                          }}
                        />
                        <Bar
                          dataKey="count"
                          radius={[4, 4, 0, 0]}
                        >
                          {segmentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <p>Nenhum dado de segmento disponível</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          {/* Gráfico de barras para eventos - ATUALIZADO */}
          <Card>
            <CardHeader>
              <CardTitle>Eventos com Mais Inscrições</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topEventsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="eventTitle"
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === 'presentialCount') return [value, 'Inscrições Presenciais']
                        if (name === 'onlineCount') return [value, 'Inscrições Online']
                        if (name === 'vacancyTotal') return [value, 'Vagas Presenciais']
                        return [value, name]
                      }}
                      labelFormatter={(label) => `Evento: ${label}`}
                    />
                    <Bar dataKey="presentialCount" fill="#3b82f6" name="Presencial" />
                    <Bar dataKey="onlineCount" fill="#8b5cf6" name="Online" />
                    <Bar dataKey="vacancyTotal" fill="#10b981" name="Vagas Presenciais" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Lista detalhada dos top eventos - ATUALIZADA */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhes dos Top Eventos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topEventsData.map((event, index) => (
                  <Link
                    key={event.eventId}
                    href={enrollmentsByEventPath(event.eventId)}
                    className="block hover:bg-muted/50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/50">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium hover:text-primary transition-colors">{event.eventTitle}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="text-blue-600">{event.presentialCount} presencial</span>
                            <span>•</span>
                            <span className="text-purple-600">{event.onlineCount} online</span>
                            <span>•</span>
                            <span>{event.enrollmentCount} total</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          {event.presentialOccupancyRate.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground mb-1">
                          Ocupação presencial
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {event.presentialCount}/{event.vacancyTotal} vagas presenciais
                        </div>
                        <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className={`h-2 rounded-full ${event.presentialOccupancyRate >= 100 ? 'bg-red-500' :
                                event.presentialOccupancyRate >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                            style={{ width: `${Math.min(100, event.presentialOccupancyRate)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}