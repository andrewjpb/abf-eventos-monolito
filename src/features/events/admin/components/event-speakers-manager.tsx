"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Users, Search, Plus, X } from "lucide-react"
import { AdminEventWithDetails } from "../types"
import { useQuery } from "@tanstack/react-query"
import { getSpeakers } from "@/features/speakers/queries/get-speakers"
import { associateEventSpeaker, disassociateEventSpeaker } from "../actions/manage-event-speakers"
import { toast } from "sonner"
import Image from "next/image"

interface EventSpeakersManagerProps {
  eventId: string
  event: AdminEventWithDetails
}

export function EventSpeakersManager({ eventId, event }: EventSpeakersManagerProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isPending, startTransition] = useTransition()
  
  // Query para buscar todos os palestrantes disponíveis
  const { data: speakersData, isLoading } = useQuery({
    queryKey: ["speakers", searchTerm],
    queryFn: () => getSpeakers({ search: searchTerm, active: "ACTIVE" })
  })

  const allSpeakers = speakersData?.speakers || []
  const associatedSpeakerIds = new Set(event.speakers.map(s => s.id))
  const availableSpeakers = allSpeakers.filter(speaker => !associatedSpeakerIds.has(speaker.id))

  const handleAssociate = async (speakerId: string) => {
    startTransition(async () => {
      const formData = new FormData()
      const result = await associateEventSpeaker(eventId, speakerId, null, formData)
      
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    })
  }

  const handleDisassociate = async (speakerId: string) => {
    startTransition(async () => {
      const formData = new FormData()
      const result = await disassociateEventSpeaker(eventId, speakerId, null, formData)
      
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Palestrantes Associados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Palestrantes Associados
            </span>
            <Badge variant="outline">{event.speakers.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {event.speakers.length > 0 ? (
            <div className="grid gap-3">
              {event.speakers.map((speaker) => (
                <div key={speaker.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 rounded-full overflow-hidden bg-muted">
                      {speaker.users.image_url ? (
                        <Image
                          src={speaker.users.image_url}
                          alt={speaker.users.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Users className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">{speaker.users.name}</h3>
                      <p className="text-sm text-muted-foreground">{speaker.users.position}</p>
                      {speaker.users && (
                        <p className="text-xs text-muted-foreground">
                          {speaker.users.name} - {speaker.users.position}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDisassociate(speaker.id)}
                    disabled={isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Nenhum palestrante associado a este evento</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Adicionar Palestrantes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Adicionar Palestrantes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Campo de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar palestrantes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Lista de palestrantes disponíveis */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando palestrantes...
            </div>
          ) : availableSpeakers.length > 0 ? (
            <div className="grid gap-3 max-h-96 overflow-y-auto">
              {availableSpeakers.map((speaker) => (
                <div key={speaker.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 rounded-full overflow-hidden bg-muted">
                      {speaker.users.image_url ? (
                        <Image
                          src={speaker.users.image_url}
                          alt={speaker.users.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Users className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">{speaker.users.name}</h3>
                      <p className="text-sm text-muted-foreground">{speaker.users.position}</p>
                      {speaker.users && (
                        <p className="text-xs text-muted-foreground">
                          {speaker.users.name} - {speaker.users.position}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {speaker.events.length} evento(s)
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={() => handleAssociate(speaker.id)}
                    disabled={isPending}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>
                {searchTerm 
                  ? `Nenhum palestrante encontrado para "${searchTerm}"`
                  : "Todos os palestrantes ativos já estão associados"
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}