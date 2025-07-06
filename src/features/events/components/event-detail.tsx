// /features/events/components/event-detail.tsx
"use client"

import { EventWithDetails, formatarDataEvento, formatarHorarioEvento, calcularDiasAteEvento } from "../types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
  Users2Icon,
  LinkIcon,
  ExternalLinkIcon,
  CalendarPlus
} from "lucide-react"
import Image from "next/image"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

interface EventDetailProps {
  event: EventWithDetails
  isRegistered: boolean
  attendanceId?: string | null
  isAdmin: boolean
  remainingVacancies: number
  occupationPercentage: number
}

export function EventDetail({
  event,
  isRegistered,
  attendanceId,
  isAdmin,
  remainingVacancies,
  occupationPercentage
}: EventDetailProps) {
  const pathname = usePathname()
  const [showFullDescription, setShowFullDescription] = useState(false)

  // Verifica se o evento já ocorreu
  const eventoPassado = new Date(event.date) < new Date()

  // Formatar endereço completo
  const formatarEndereco = () => {
    if (event.isStreaming) {
      return "Evento Online"
    }

    if (!event.address) {
      return "Local a definir"
    }

    const { street, number, complement, cities, states } = event.address || {}
    const partes = [
      street,
      number && `nº ${number}`,
      complement,
      cities?.name,
      states?.uf
    ].filter(Boolean)

    return partes.join(", ")
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Container Esquerdo */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2 mb-2">
          <Badge variant="outline" className="bg-gray-100">
            {event.format === "in-person" ? "Presencial" : "Online"}
          </Badge>

          {event.isStreaming && (
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              Online
            </Badge>
          )}

          {event.highlight && (
            <Badge variant="outline" className="bg-amber-100 text-amber-800">
              Destaque
            </Badge>
          )}

          {eventoPassado ? (
            <Badge variant="outline" className="bg-gray-100 text-gray-800">
              Evento Passado
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-green-100 text-green-800">
              Em {calcularDiasAteEvento(event.date)} dias
            </Badge>
          )}
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {event.title}
          </h1>
        </div>

        {/* Card de Patrocinadores */}
        {event.sponsors && event.sponsors.length > 0 && (
          <Card className="w-full border-0 shadow-sm bg-gray-50">
            <CardContent className="px-4">
              {/* Header */}
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Patrocinadores
              </h2>

              {/* Body - Grid de logos */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {event.sponsors.map((sponsor) => (
                  <div key={sponsor.id} className="flex items-center justify-center p-4 bg-white rounded-lg border">
                    {sponsor.image_url ? (
                      <Image
                        src={sponsor.image_url}
                        alt={sponsor.name}
                        width={120}
                        height={60}
                        className="max-w-full max-h-12 object-contain"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-12 bg-gray-100 rounded">
                        <span className="text-sm font-medium text-gray-600 text-center px-2">
                          {sponsor.name}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Container Direito - Card de Data e Hora */}
      <div className="w-full">
        <Card className="w-full border-0 shadow-sm bg-gray-50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              {/* Lado Esquerdo */}
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <CalendarIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-gray-900 font-medium">
                    {formatarDataEvento(event.date)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Das {event.start_time} às {event.end_time}
                  </p>
                </div>
              </div>

              {/* Lado Direito */}
              <div className="p-3 bg-primary/10 rounded-lg">
                <button className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors">
                  <CalendarPlus className="w-5 h-5" />
                  <span className="text-sm font-medium">Adicionar à agenda</span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card de Endereço */}
        {event.address && (
          <Card className="w-full border-0 shadow-sm bg-gray-50 mt-4">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                {/* Lado Esquerdo */}
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <MapPinIcon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium">
                      {event.address.street}
                    </p>
                    <p className="text-sm text-gray-600">
                      {event.address.postal_code} - {event.address.cities.name}/{event.address.states.uf}
                    </p>
                  </div>
                </div>

                {/* Lado Direito */}
                <div className="p-3 bg-primary/10 rounded-lg">
                  <button className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors">
                    <MapPinIcon className="w-5 h-5" />
                    <span className="text-sm font-medium">Ver no mapa</span>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}