"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Edit,
  Trash2,
  Star,
  Eye,
  EyeOff,
  Upload,
  ExternalLink,
  Building,
  Globe,
  Monitor,
  Tag,
  FileText,
  Hash,
  Plus
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { AdminEventWithDetails, getEventStatus, getEventStatusColor, getEventStatusLabel, calculateOccupancyRate, isEventFull, isEventAlmostFull } from "../types"
import { useConfirmDialog } from "@/components/confirm-dialog"
import { deleteEvent } from "../actions/delete-event"
import { toggleEventPublication, toggleEventHighlight } from "../actions/update-event-status"

interface AdminEventDetailProps {
  event: AdminEventWithDetails
}

export function AdminEventDetail({ event }: AdminEventDetailProps) {
  const status = getEventStatus(event)
  const statusColor = getEventStatusColor(status)
  const statusLabel = getEventStatusLabel(status)
  const occupancyRate = calculateOccupancyRate(event._count.attendance_list, event.vacancy_total)
  const isFull = isEventFull(event._count.attendance_list, event.vacancy_total)
  const isAlmostFull = isEventAlmostFull(event._count.attendance_list, event.vacancy_total)

  // Hook para confirmação de delete
  const [deleteButton, deleteDialog] = useConfirmDialog({
    title: "Confirmar exclusão",
    description: `Tem certeza que deseja excluir o evento "${event.title}"? Esta ação não pode ser desfeita.`,
    action: () => deleteEvent(event.id, {} as any, new FormData()),
    trigger: (
      <Button 
        variant="destructive" 
        disabled={event._count.attendance_list > 0}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Excluir
      </Button>
    )
  })

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatTime = (time: string) => {
    return time.substring(0, 5)
  }

  const getFormatLabel = (format: string) => {
    const formatLabels = {
      'PRESENCIAL': 'Presencial',
      'ONLINE': 'Online',
      'HIBRIDO': 'Híbrido'
    }
    return formatLabels[format as keyof typeof formatLabels] || format
  }

  const getFormatIcon = (format: string) => {
    const formatIcons = {
      'PRESENCIAL': Building,
      'ONLINE': Globe,
      'HIBRIDO': Monitor
    }
    const Icon = formatIcons[format as keyof typeof formatIcons] || Building
    return <Icon className="h-4 w-4" />
  }

  const getOccupancyColor = (rate: number) => {
    if (rate >= 90) return 'text-red-600'
    if (rate >= 70) return 'text-yellow-600'
    return 'text-green-600'
  }

  const handleTogglePublication = async () => {
    await toggleEventPublication(event.id, {} as any, new FormData())
  }

  const handleToggleHighlight = async () => {
    await toggleEventHighlight(event.id, {} as any, new FormData())
  }

  return (
    <div className="space-y-6">
      {/* Header com imagem e informações principais */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Imagens do evento */}
            <div className="lg:col-span-1">
              <Tabs defaultValue="principal" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="principal">Imagem Principal</TabsTrigger>
                  <TabsTrigger value="miniatura">Miniatura</TabsTrigger>
                </TabsList>
                
                <TabsContent value="principal" className="mt-4">
                  <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted">
                    {event.image_url ? (
                      <Image
                        src={event.image_url}
                        alt={event.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Calendar className="h-16 w-16 text-muted-foreground opacity-30" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Imagem usada na página de detalhes do evento
                  </p>
                </TabsContent>
                
                <TabsContent value="miniatura" className="mt-4">
                  <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted">
                    {event.thumb_url ? (
                      <Image
                        src={event.thumb_url}
                        alt={`Miniatura de ${event.title}`}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Calendar className="h-12 w-12 text-muted-foreground opacity-30" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Miniatura usada no carrossel e listagens
                  </p>
                </TabsContent>
              </Tabs>
            </div>

            {/* Informações principais */}
            <div className="lg:col-span-2 space-y-4">
              {/* Título e badges */}
              <div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge className={`${statusColor === 'green' ? 'bg-green-100 text-green-800' : 
                                     statusColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' : 
                                     'bg-gray-100 text-gray-800'}`}>
                    {statusLabel}
                  </Badge>
                  
                  <Badge variant="outline" className="gap-1">
                    {getFormatIcon(event.format)}
                    {getFormatLabel(event.format)}
                  </Badge>

                  {event.highlight && (
                    <Badge className="bg-orange-100 text-orange-800 gap-1">
                      <Star className="h-3 w-3" />
                      Destaque
                    </Badge>
                  )}
                  
                  {!event.isPublished && (
                    <Badge variant="outline" className="text-gray-600">
                      Rascunho
                    </Badge>
                  )}

                  {event.free_online && (
                    <Badge className="bg-blue-100 text-blue-800">
                      Gratuito Online
                    </Badge>
                  )}
                </div>

                <h1 className="text-2xl font-bold mb-2">{event.title}</h1>
                <p className="text-muted-foreground">{event.summary}</p>
              </div>

              {/* Informações básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{formatDate(event.date)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatTime(event.start_time)} às {formatTime(event.end_time)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {event.address.cities.name}, {event.address.states.uf}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {event.address.street}, {event.address.number}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      <span className={getOccupancyColor(occupancyRate)}>
                        {event._count.attendance_list}/{event.vacancy_total} inscritos
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {occupancyRate}% de ocupação
                      {isFull && " - Evento lotado"}
                      {isAlmostFull && !isFull && " - Quase lotado"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Hash className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Slug</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {event.slug}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações principais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Ações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link href={`/admin/events/${event.id}/edit`}>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Editar Evento
              </Button>
            </Link>

            <Link href={`/admin/enrollments/event/${event.id}`}>
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Ver Inscrições ({event._count.attendance_list})
              </Button>
            </Link>

            <Link href={`/eventos/${event.id}`} target="_blank">
              <Button variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                Visualizar Evento
              </Button>
            </Link>

            <Button
              variant="outline"
              onClick={handleTogglePublication}
            >
              {event.isPublished ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Despublicar
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Publicar
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleToggleHighlight}
            >
              <Star className="h-4 w-4 mr-2" />
              {event.highlight ? 'Remover Destaque' : 'Destacar'}
            </Button>

            {deleteButton}
          </div>

          {event._count.attendance_list > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              * Não é possível excluir eventos com inscrições
            </p>
          )}
        </CardContent>
      </Card>

      {/* Detalhes e configurações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Descrição */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Descrição
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              {event.description.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-2 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Configurações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Configurações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total de vagas</p>
                <p className="font-medium">{event.vacancy_total}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Vagas por marca</p>
                <p className="font-medium">{event.vacancies_per_brand}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Quórum mínimo</p>
                <p className="font-medium">{event.minimum_quorum}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Streaming</p>
                <p className="font-medium">{event.isStreaming ? 'Sim' : 'Não'}</p>
              </div>
            </div>

            {event.transmission_link && (
              <div>
                <p className="text-muted-foreground text-sm mb-1">Link de transmissão</p>
                <a 
                  href={event.transmission_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm break-all"
                >
                  {event.transmission_link}
                </a>
              </div>
            )}

            {event.schedule_link && (
              <div>
                <p className="text-muted-foreground text-sm mb-1">Link da programação</p>
                <a 
                  href={event.schedule_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm break-all"
                >
                  {event.schedule_link}
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Relacionamentos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Palestrantes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Palestrantes
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{event._count.speakers}</Badge>
                <Link href={`/admin/events/${event.id}/speakers`}>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {event.speakers.length > 0 ? (
              <div className="space-y-3">
                {event.speakers.map(speaker => (
                  <div key={speaker.id} className="flex items-center gap-3">
                    <div className="relative h-10 w-10 rounded-full overflow-hidden bg-muted">
                      {speaker.users.image_url ? (
                        <Image
                          src={speaker.users.image_url}
                          alt={speaker.users.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Users className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{speaker.users.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {speaker.users.position}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum palestrante associado
              </p>
            )}
          </CardContent>
        </Card>

        {/* Patrocinadores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Patrocinadores
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{event._count.sponsors}</Badge>
                <Link href={`/admin/events/${event.id}/sponsors`}>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {event.sponsors.length > 0 ? (
              <div className="space-y-2">
                {event.sponsors.map(sponsor => (
                  <div key={sponsor.id} className="text-sm">
                    {sponsor.name}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum patrocinador associado
              </p>
            )}
          </CardContent>
        </Card>

        {/* Apoiadores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Apoiadores
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{event._count.supporters}</Badge>
                <Link href={`/admin/events/${event.id}/supporters`}>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {event.supporters.length > 0 ? (
              <div className="space-y-2">
                {event.supporters.map(supporter => (
                  <div key={supporter.id} className="text-sm">
                    {supporter.name}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum apoiador associado
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de confirmação de delete */}
      {deleteDialog}
    </div>
  )
}