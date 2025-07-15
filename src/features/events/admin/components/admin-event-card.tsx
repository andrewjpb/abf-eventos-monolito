"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  MapPin,
  Users,
  Eye,
  Star,
  ExternalLink,
  Clock,
  Building,
  UserCheck
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { AdminEventSummary, getEventStatus, getEventStatusColor, getEventStatusLabel, calculateOccupancyRate } from "../types"

interface AdminEventCardProps {
  event: AdminEventSummary
}

export function AdminEventCard({ event }: AdminEventCardProps) {
  const status = getEventStatus(event)
  const statusColor = getEventStatusColor(status)
  const statusLabel = getEventStatusLabel(status)
  const occupancyRate = calculateOccupancyRate(event._count.attendance_list, event.vacancy_total)

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getFormatLabel = (format: string) => {
    const formatLabels = {
      'PRESENCIAL': 'Presencial',
      'ONLINE': 'Online',
      'HIBRIDO': 'Híbrido',
      'in_person': 'Presencial',
      'online': 'Online',
      'hybrid': 'Híbrido'
    }
    return formatLabels[format as keyof typeof formatLabels] || format
  }

  const getFormatColor = (format: string) => {
    const formatColors = {
      'PRESENCIAL': 'bg-blue-100 text-blue-800',
      'ONLINE': 'bg-green-100 text-green-800',
      'HIBRIDO': 'bg-purple-100 text-purple-800',
      'in_person': 'bg-blue-100 text-blue-800',
      'online': 'bg-green-100 text-green-800',
      'hybrid': 'bg-purple-100 text-purple-800'
    }
    return formatColors[format as keyof typeof formatColors] || 'bg-gray-100 text-gray-800'
  }

  const getOccupancyColor = (rate: number) => {
    if (rate >= 90) return 'text-red-600'
    if (rate >= 70) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md flex flex-col h-full">
      <CardContent className="p-0 flex flex-col h-full">
        {/* Imagem do evento */}
        <div className="relative h-48 bg-muted">
          {(event.thumb_url || event.image_url) ? (
            <Image
              src={event.thumb_url || event.image_url}
              alt={event.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Calendar className="h-12 w-12 text-muted-foreground opacity-30" />
            </div>
          )}

          {/* Badges de status */}
          <div className="absolute top-2 left-2 flex gap-2">
            <Badge className={`${statusColor === 'green' ? 'bg-green-100 text-green-800' : 
                                 statusColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' : 
                                 'bg-gray-100 text-gray-800'}`}>
              {statusLabel}
            </Badge>
            
            <Badge className={getFormatColor(event.format)}>
              {getFormatLabel(event.format)}
            </Badge>
          </div>

          {/* Badges de destaque e publicação */}
          <div className="absolute top-2 right-2 flex gap-2">
            {event.highlight && (
              <Badge className="bg-orange-100 text-orange-800">
                <Star className="h-3 w-3 mr-1" />
                Destaque
              </Badge>
            )}
            
            {!event.isPublished && (
              <Badge variant="outline" className="bg-white/90 text-gray-600">
                Rascunho
              </Badge>
            )}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-4 flex flex-col h-full">
          <div className="flex-1 space-y-3">
            {/* Título */}
            <div>
              <h3 className="font-semibold text-lg line-clamp-2 mb-1">
                {event.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {event.summary}
              </p>
            </div>

            {/* Informações principais */}
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatDate(event.date)}</span>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">
                  {event.address.cities.name}, {event.address.states.uf}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className={getOccupancyColor(occupancyRate)}>
                  {event._count.attendance_list}/{event.vacancy_total} inscritos ({occupancyRate}%)
                </span>
              </div>
            </div>

            {/* Data de criação */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
              <Clock className="h-3 w-3" />
              <span>
                Criado em {new Date(event.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>

          {/* Ações - fixadas no final */}
          <div className="flex gap-2 pt-3 mt-auto">
            <Link href={`/admin/events/${event.id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                Administrar evento
              </Button>
            </Link>
            
            <Link href={`/admin/events/${event.id}/checkin`}>
              <Button variant="outline" size="sm">
                <UserCheck className="h-4 w-4 mr-2" />
                Check-in
              </Button>
            </Link>
            
            <Link href={`/admin/enrollments/event/${event.id}`}>
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Inscrições
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}