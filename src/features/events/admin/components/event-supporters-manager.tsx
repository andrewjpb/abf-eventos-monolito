"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Tag, Search, Plus, X } from "lucide-react"
import { AdminEventWithDetails } from "../types"
import { useQuery } from "@tanstack/react-query"
import { getSupporters } from "@/features/supporters/queries/get-supporters"
import { associateEventSupporter, disassociateEventSupporter } from "../actions/manage-event-supporters"
import { toast } from "sonner"

interface EventSupportersManagerProps {
  eventId: string
  event: AdminEventWithDetails
}

export function EventSupportersManager({ eventId, event }: EventSupportersManagerProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isPending, startTransition] = useTransition()
  
  // Query para buscar todos os apoiadores disponíveis
  const { data: supportersData, isLoading } = useQuery({
    queryKey: ["supporters", searchTerm],
    queryFn: () => getSupporters({ search: searchTerm, active: "ACTIVE" })
  })

  const allSupporters = supportersData?.supporters || []
  const associatedSupporterIds = new Set(event.supporters.map(s => s.id))
  const availableSupporters = allSupporters.filter(supporter => !associatedSupporterIds.has(supporter.id))

  const handleAssociate = async (supporterId: string) => {
    startTransition(async () => {
      const formData = new FormData()
      const result = await associateEventSupporter(eventId, supporterId, null, formData)
      
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    })
  }

  const handleDisassociate = async (supporterId: string) => {
    startTransition(async () => {
      const formData = new FormData()
      const result = await disassociateEventSupporter(eventId, supporterId, null, formData)
      
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Apoiadores Associados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Apoiadores Associados
            </span>
            <Badge variant="outline">{event.supporters.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {event.supporters.length > 0 ? (
            <div className="grid gap-3">
              {event.supporters.map((supporter) => (
                <div key={supporter.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                      <Tag className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{supporter.name}</h3>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDisassociate(supporter.id)}
                    disabled={isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Tag className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Nenhum apoiador associado a este evento</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Adicionar Apoiadores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Adicionar Apoiadores
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Campo de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar apoiadores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Lista de apoiadores disponíveis */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando apoiadores...
            </div>
          ) : availableSupporters.length > 0 ? (
            <div className="grid gap-3 max-h-96 overflow-y-auto">
              {availableSupporters.map((supporter) => (
                <div key={supporter.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                      <Tag className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{supporter.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {supporter.events.length} evento(s)
                        </Badge>
                        {supporter.active && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                            Ativo
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={() => handleAssociate(supporter.id)}
                    disabled={isPending}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Tag className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>
                {searchTerm 
                  ? `Nenhum apoiador encontrado para "${searchTerm}"`
                  : "Todos os apoiadores ativos já estão associados"
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}