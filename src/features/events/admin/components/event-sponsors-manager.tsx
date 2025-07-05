"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Building, Search, Plus, X, Check } from "lucide-react"
import { AdminEventWithDetails } from "../types"
import { useQuery } from "@tanstack/react-query"
import { getSponsors } from "@/features/sponsors/queries/get-sponsors"
import { associateEventSponsor, disassociateEventSponsor } from "../actions/manage-event-sponsors"
import { toast } from "sonner"

interface EventSponsorsManagerProps {
  eventId: string
  event: AdminEventWithDetails
}

export function EventSponsorsManager({ eventId, event }: EventSponsorsManagerProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isPending, startTransition] = useTransition()
  
  // Query para buscar todos os patrocinadores disponíveis
  const { data: sponsorsData, isLoading } = useQuery({
    queryKey: ["sponsors", searchTerm],
    queryFn: () => getSponsors({ search: searchTerm, active: "ACTIVE" })
  })

  const allSponsors = sponsorsData?.sponsors || []
  const associatedSponsorIds = new Set(event.sponsors.map(s => s.id))
  const availableSponsors = allSponsors.filter(sponsor => !associatedSponsorIds.has(sponsor.id))

  const handleAssociate = async (sponsorId: string) => {
    startTransition(async () => {
      const formData = new FormData()
      const result = await associateEventSponsor(eventId, sponsorId, null, formData)
      
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    })
  }

  const handleDisassociate = async (sponsorId: string) => {
    startTransition(async () => {
      const formData = new FormData()
      const result = await disassociateEventSponsor(eventId, sponsorId, null, formData)
      
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Patrocinadores Associados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Patrocinadores Associados
            </span>
            <Badge variant="outline">{event.sponsors.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {event.sponsors.length > 0 ? (
            <div className="grid gap-3">
              {event.sponsors.map((sponsor) => (
                <div key={sponsor.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                      <Building className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{sponsor.name}</h3>
                      {sponsor.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {sponsor.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDisassociate(sponsor.id)}
                    disabled={isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Building className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Nenhum patrocinador associado a este evento</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Adicionar Patrocinadores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Adicionar Patrocinadores
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Campo de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar patrocinadores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Lista de patrocinadores disponíveis */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando patrocinadores...
            </div>
          ) : availableSponsors.length > 0 ? (
            <div className="grid gap-3 max-h-96 overflow-y-auto">
              {availableSponsors.map((sponsor) => (
                <div key={sponsor.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                      <Building className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{sponsor.name}</h3>
                      {sponsor.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {sponsor.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {sponsor.events.length} evento(s)
                        </Badge>
                        {sponsor.active && (
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
                    onClick={() => handleAssociate(sponsor.id)}
                    disabled={isPending}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Building className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>
                {searchTerm 
                  ? `Nenhum patrocinador encontrado para "${searchTerm}"`
                  : "Todos os patrocinadores ativos já estão associados"
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}