// /features/events/components/event-schedule-timeline.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock } from "lucide-react"
import { EventSchedule, formatarHorario, agruparProgramacaoPorDia } from "../types"

interface EventScheduleTimelineProps {
  schedule: EventSchedule[]
}

export function EventScheduleTimeline({ schedule }: EventScheduleTimelineProps) {
  if (!schedule || schedule.length === 0) {
    return null
  }

  // Agrupar programação por dia
  const programacaoPorDia = agruparProgramacaoPorDia(schedule)
  const dias = Object.keys(programacaoPorDia).sort()

  const formatarDataCompleta = (dataString: string): string => {
    const data = new Date(dataString)
    return data.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long'
    })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Programação
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {dias.map((dia) => (
            <div key={dia} className="space-y-4">
              {/* Cabeçalho do dia */}
              <div className="border-b pb-2">
                <h3 className="font-semibold text-lg capitalize">
                  {formatarDataCompleta(dia)}
                </h3>
              </div>

              {/* Timeline do dia */}
              <div className="relative">
                {/* Linha vertical da timeline */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                <div className="space-y-4">
                  {programacaoPorDia[dia].map((item, index) => (
                    <div key={item.id} className="relative flex items-start gap-4">
                      {/* Ponto da timeline */}
                      <div className="relative z-10 flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <Clock className="w-4 h-4 text-white" />
                        </div>
                      </div>

                      {/* Conteúdo do item */}
                      <div className="flex-1 min-w-0 pb-4">
                        <div className="bg-white border rounded-lg p-4 shadow-sm">
                          {/* Horário */}
                          <div className="mb-2">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              {formatarHorario(item.start_time)} - {formatarHorario(item.end_time)}
                            </Badge>
                          </div>

                          {/* Título */}
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {item.title}
                          </h4>

                          {/* Descrição */}
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-2">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}