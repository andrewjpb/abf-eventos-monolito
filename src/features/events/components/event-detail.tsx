// /features/events/components/event-detail.tsx
"use client"

import { EventWithDetails, formatarDataEvento, formatarHorarioEvento, calcularDiasAteEvento } from "../types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  CalendarIcon,
  MapPinIcon,
  Users,
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
  Users2Icon,
  LinkIcon,
  ExternalLinkIcon,
  CalendarPlus,
  Radio,
  Wifi,
  PlayCircle
} from "lucide-react"
import Image from "next/image"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { EventRegistrationCard } from "@/components/event-registration-card"

interface EventDetailProps {
  event: EventWithDetails
  isRegistered: boolean
  attendanceId?: string | null
  isAdmin: boolean
  remainingVacancies: number
  companyRemainingVacancies?: number
  occupationPercentage: number
  user?: any
  canRegister?: { canRegister: boolean; reason?: string } | null
}

export function EventDetail({
  event,
  isRegistered,
  attendanceId,
  isAdmin,
  remainingVacancies,
  companyRemainingVacancies,
  occupationPercentage,
  user,
  canRegister
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
    <div className="flex flex-col gap-8">
      <div className="container mx-auto px-4 pb-8 ">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Container Esquerdo */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="outline" className="bg-gray-100">
                {event.format === "PRESENCIAL" ? "Presencial" :
                  event.format === "ONLINE" ? "Online" :
                    event.format === "HIBRIDO" ? "Híbrido" : "Presencial"}
              </Badge>

              {event.isStreaming && event.format !== "ONLINE" && (
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  Com transmissão
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

            {/* Card de Status do Evento - Transmissão/Início */}
            <Card className="w-full border-0 shadow-sm bg-gray-50 mt-4">
              <CardContent className="p-5">
                {(() => {
                  const agora = new Date()
                  const dataEvento = new Date(event.date)

                  // Criar datetime do evento combinando data e horário
                  const [horaInicio, minutoInicio] = event.start_time.split(':').map(Number)
                  const [horaFim, minutoFim] = event.end_time.split(':').map(Number)

                  const inicioEvento = new Date(dataEvento)
                  inicioEvento.setHours(horaInicio, minutoInicio, 0, 0)

                  const fimEvento = new Date(dataEvento)
                  fimEvento.setHours(horaFim, minutoFim, 0, 0)

                  // Calcular status do evento
                  const eventoComecou = agora >= inicioEvento
                  const eventoTerminou = agora >= fimEvento
                  const eventoOcorrendo = eventoComecou && !eventoTerminou

                  // Calcular tempo até o início
                  const minutosAteInicio = Math.floor((inicioEvento.getTime() - agora.getTime()) / (1000 * 60))
                  const horasAteInicio = Math.floor(minutosAteInicio / 60)
                  const diasAteInicio = Math.floor(horasAteInicio / 24)

                  // Determinar se tem transmissão online
                  const temTransmissao = event.format === "ONLINE" || event.format === "HIBRIDO" || event.isStreaming

                  if (eventoTerminou) {
                    // Evento finalizado
                    return (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-gray-100 rounded-lg">
                            <CheckCircleIcon className="w-6 h-6 text-gray-600" />
                          </div>
                          <div>
                            <p className="text-gray-900 font-medium">
                              Evento realizado
                            </p>
                            <p className="text-sm text-gray-600">
                              {formatarDataEvento(event.date)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  } else if (eventoOcorrendo) {
                    // Evento acontecendo agora
                    return (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-green-100 rounded-lg">
                            <Radio className="w-6 h-6 text-green-600 animate-pulse" />
                          </div>
                          <div>
                            <p className="text-gray-900 font-medium">
                              {temTransmissao ? "Transmissão ao vivo" : "Evento em andamento"}
                            </p>
                            <p className="text-sm text-gray-600">
                              Até às {event.end_time}
                            </p>
                          </div>
                        </div>

                        {temTransmissao && event.transmission_link ? (
                          <div className="p-3 bg-green-100 rounded-lg">
                            <a
                              href={event.transmission_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-green-700 hover:text-green-900 transition-colors"
                            >
                              <PlayCircle className="w-5 h-5" />
                              <span className="text-sm font-medium">Assistir agora</span>
                            </a>
                          </div>
                        ) : (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <Radio className="w-3 h-3 mr-1 animate-pulse" />
                            Ao vivo
                          </Badge>
                        )}
                      </div>
                    )
                  } else {
                    // Evento futuro
                    let tempoRestante = ""
                    if (diasAteInicio > 0) {
                      tempoRestante = `${diasAteInicio} ${diasAteInicio === 1 ? 'dia' : 'dias'}`
                    } else if (horasAteInicio > 0) {
                      tempoRestante = `${horasAteInicio} ${horasAteInicio === 1 ? 'hora' : 'horas'}`
                    } else if (minutosAteInicio > 0) {
                      tempoRestante = `${minutosAteInicio} ${minutosAteInicio === 1 ? 'minuto' : 'minutos'}`
                    } else {
                      tempoRestante = "Em breve"
                    }

                    return (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-primary/10 rounded-lg">
                            {temTransmissao ? (
                              <Wifi className="w-6 h-6 text-primary" />
                            ) : (
                              <CalendarIcon className="w-6 h-6 text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="text-gray-900 font-medium">
                              {temTransmissao ? "Transmissão ao vivo" : "Evento presencial"}
                            </p>
                            <p className="text-sm text-gray-600">
                              Começaremos em {tempoRestante}
                            </p>
                          </div>
                        </div>

                        <div className="p-3 bg-primary/10 rounded-lg">
                          <button className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors cursor-not-allowed opacity-60" disabled>
                            <ClockIcon className="w-5 h-5" />
                            <span className="text-sm font-medium">Aguardando início</span>
                          </button>
                        </div>
                      </div>
                    )
                  }
                })()}
              </CardContent>
            </Card>
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

            {/* Card de Registro */}
            <div className="mt-4">
              <EventRegistrationCard
                event={event}
                user={user}
                isRegistered={isRegistered}
                remainingVacancies={remainingVacancies}
                companyRemainingVacancies={companyRemainingVacancies}
                canRegister={canRegister}
              />
            </div>
          </div>

        </div>
      </div>

      {/* Seção Sobre o Evento e Palestrantes */}
      <div className="bg-gray-50 w-full py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Card Sobre o Evento - 70% */}
            <div className="lg:col-span-8">
              <Card className="w-full border-0 shadow-sm bg-white">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Sobre o evento
                  </h2>
                  
                  {/* Resumo */}
                  {event.summary && (
                    <div className="mb-6">
                      <p className="text-lg text-gray-700 leading-relaxed">
                        {event.summary}
                      </p>
                    </div>
                  )}
                  
                  {/* Descrição completa */}
                  {event.description && (
                    <div className="prose prose-gray max-w-none">
                      <div 
                        className="text-gray-600 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: event.description }}
                      />
                    </div>
                  )}
                  
                  {/* Informações adicionais */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex flex-wrap gap-6">
                      {event.minimum_quorum > 0 && (
                        <div className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            Quórum mínimo: {event.minimum_quorum} participantes
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Duração: {event.start_time} - {event.end_time}
                        </span>
                      </div>
                      
                      {event.format === "HIBRIDO" && (
                        <div className="flex items-center gap-2">
                          <Wifi className="w-5 h-5 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            Evento híbrido (presencial + online)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Card Palestrantes - 30% */}
            <div className="lg:col-span-4">
              <Card className="w-full border-0 shadow-sm bg-white">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Palestrantes
                  </h2>
                  
                  {event.speakers && event.speakers.length > 0 ? (
                    <div className="space-y-4">
                      {event.speakers.map((speaker) => (
                        <div key={speaker.id} className="flex items-center gap-3">
                          {/* Foto do palestrante */}
                          <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                            {speaker.users.image_url ? (
                              <Image
                                src={speaker.users.image_url}
                                alt={speaker.users.name || "Palestrante"}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                                <Users2Icon className="w-6 h-6 text-primary/60" />
                              </div>
                            )}
                          </div>
                          
                          {/* Informações */}
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 text-sm">
                              {speaker.users.name}
                            </h3>
                            {speaker.users.position && (
                              <p className="text-xs text-gray-600">
                                {speaker.users.position}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="p-3 bg-gray-100 rounded-full mx-auto w-fit mb-3">
                        <Users2Icon className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">
                        Palestrantes a confirmar
                      </p>
                    </div>
                  )}
                  
                  {/* Biografia expandida (se houver) */}
                  {event.speakers && event.speakers.length === 1 && event.speakers[0].bio && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {event.speakers[0].bio}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}