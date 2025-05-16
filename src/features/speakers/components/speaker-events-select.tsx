// /features/speakers/components/speaker-events-select.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { LucideLoaderCircle, Save } from "lucide-react"
import { updateSpeakerEvents } from "../actions/update-speaker-events"
import { events } from "@prisma/client"
import { toast } from "sonner"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface SpeakerEventsSelectProps {
  speakerId: string
  currentEvents: events[]
  allEvents: events[]
}

export function SpeakerEventsSelect({ speakerId, currentEvents, allEvents }: SpeakerEventsSelectProps) {
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Inicializar os eventos selecionados
  useEffect(() => {
    setSelectedEventIds(currentEvents.map(event => event.id))
  }, [currentEvents])

  // Função para alternar a seleção de um evento
  const toggleEvent = (eventId: string) => {
    setSelectedEventIds(prev =>
      prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    )
  }

  // Função para salvar as alterações
  const handleSave = async () => {
    setIsLoading(true)
    try {
      const result = await updateSpeakerEvents({
        speakerId,
        eventIds: selectedEventIds
      })

      if (result.status === "ERROR") {
        toast.error(result.message || "Erro ao atualizar eventos")
      } else {
        toast.success("Eventos atualizados com sucesso")
      }
    } catch (error) {
      console.error("Erro ao atualizar eventos:", error)
      toast.error("Ocorreu um erro ao atualizar os eventos")
    } finally {
      setIsLoading(false)
    }
  }

  // Agrupar eventos por data
  const groupedEvents = allEvents.reduce((acc, event) => {
    const dateKey = new Date(event.date).toLocaleDateString('pt-BR')
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(event)
    return acc
  }, {} as Record<string, events[]>)

  // Ordenar as datas (mais recentes primeiro)
  const sortedDates = Object.keys(groupedEvents).sort((a, b) => {
    const dateA = new Date(a.split('/').reverse().join('-'))
    const dateB = new Date(b.split('/').reverse().join('-'))
    return dateB.getTime() - dateA.getTime()
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Eventos Associados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          {sortedDates.length > 0 ? (
            sortedDates.map(dateKey => (
              <div key={dateKey} className="space-y-2">
                <h3 className="font-medium text-sm border-b pb-1">{dateKey}</h3>
                <div className="space-y-2">
                  {groupedEvents[dateKey].map(event => (
                    <div key={event.id} className="flex items-start space-x-2">
                      <Checkbox
                        id={`event-${event.id}`}
                        checked={selectedEventIds.includes(event.id)}
                        onCheckedChange={() => toggleEvent(event.id)}
                      />
                      <div className="grid grid-cols-1 gap-1.5">
                        <Label
                          htmlFor={`event-${event.id}`}
                          className="font-medium cursor-pointer"
                        >
                          {event.title}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {event.start_time} - {event.end_time} | {event.format}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground">
              Nenhum evento disponível
            </p>
          )}
        </div>

        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading && (
            <LucideLoaderCircle className="w-4 h-4 mr-2 animate-spin" />
          )}
          <Save className="mr-2 h-4 w-4" />
          Salvar Associações
        </Button>
      </CardContent>
    </Card>
  )
}