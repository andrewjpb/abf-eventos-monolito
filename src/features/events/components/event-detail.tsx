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
  PlayCircle,
  CalendarClock,
  CheckCircle
} from "lucide-react"
import Image from "next/image"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { useState } from "react"
import { EventRegistrationCard } from "@/components/event-registration-card"
import { EventsSection } from "./events-section"
import { EventScheduleTimeline } from "./event-schedule-timeline"

interface EventDetailProps {
  event: EventWithDetails
  isRegistered: boolean
  attendanceId?: string | null
  isAdmin: boolean
  remainingVacancies: number
  companyRemainingVacancies?: number
  companyAttendees?: number
  occupationPercentage: number
  user?: any
  canRegister?: { canRegister: boolean; reason?: string } | null
  upcomingEvents?: EventWithDetails[]
  hasEventCreatePermission?: boolean
}

export function EventDetail({
  event,
  isRegistered,
  attendanceId,
  isAdmin,
  remainingVacancies,
  companyRemainingVacancies,
  companyAttendees = 0,
  occupationPercentage,
  user,
  canRegister,
  upcomingEvents = [],
  hasEventCreatePermission = false
}: EventDetailProps) {
  const [showFullDescription, setShowFullDescription] = useState(false)


  // Verifica se o evento já ocorreu
  const eventoPassado = new Date(event.date) < new Date()

  // Formatar endereço completo
  const formatarEndereco = () => {
    const formatUpper = event.format?.toUpperCase()
    if (formatUpper === "ONLINE") {
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
      {/* Tarja de Status do Evento */}
      {!event.isPublished ? (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 p-4">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Evento em Rascunho
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Este evento ainda não foi publicado e só é visível para usuários com permissão de criação de eventos.
                </p>
              </div>
              {hasEventCreatePermission && (
                <div className="flex-shrink-0">
                  <Link href={`/admin/events/${event.id}`}>
                    <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-900/30">
                      Administrar Evento
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        hasEventCreatePermission && (
          <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 p-4">
            <div className="container mx-auto px-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                    Evento Publicado
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Este evento está público e disponível para inscrições.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Link href={`/admin/events/${event.id}`}>
                    <Button variant="outline" size="sm" className="border-green-300 text-green-700 hover:bg-green-100 dark:border-green-600 dark:text-green-400 dark:hover:bg-green-900/30">
                      Administrar Evento
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )
      )}

      <div className="container mx-auto px-4 pb-8 ">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Container Esquerdo */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                {(() => {
                  const formatUpper = event.format?.toUpperCase()

                  if (formatUpper === "ONLINE") return "Online"
                  if (formatUpper === "HYBRID" || formatUpper === "HIBRIDO") return "Híbrido"
                  if (formatUpper === "IN_PERSON" || formatUpper === "PRESENCIAL") return "Presencial"
                  return "Presencial"
                })()}
              </Badge>

              {event.isStreaming && event.format?.toUpperCase() !== "ONLINE" && (
                <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                  Com transmissão
                </Badge>
              )}

              {event.highlight && (
                <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">
                  Destaque
                </Badge>
              )}

              {eventoPassado ? (
                <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300">
                  Evento Passado
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                  Em {calcularDiasAteEvento(event.date)} dias
                </Badge>
              )}
            </div>

            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {event.title}
              </h1>
            </div>

            {/* Card Sobre o Evento - Movido para cá */}
            <Card className="w-full border-0 shadow-sm bg-white dark:bg-gray-800/50 mb-6">
              <CardContent className="p-6">
                {/* Resumo */}
                {event.summary && (
                  <div className="mb-4">
                    <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                      {event.summary}
                    </p>
                  </div>
                )}

                {/* Descrição completa */}
                {event.description && (
                  <div className="prose prose-gray dark:prose-invert max-w-none">
                    <div
                      className="text-gray-600 dark:text-gray-400 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: event.description }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* Container Direito - Card de Data e Hora */}
          <div className="w-full">
            <Card className="w-full border-0 shadow-sm bg-gray-50 dark:bg-gray-800/50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  {/* Lado Esquerdo */}
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-lg">
                      <CalendarIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {formatarDataEvento(event.date)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Das {event.start_time} às {event.end_time}
                      </p>
                    </div>
                  </div>

                  {/* Lado Direito */}
                  <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-lg">
                    <button className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                      <CalendarPlus className="w-5 h-5" />
                      <span className="text-sm font-medium">Adicionar à agenda</span>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card de Endereço */}
            {event.address && (
              <Card className="w-full border-0 shadow-sm bg-gray-50 dark:bg-gray-800/50 mt-4">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    {/* Lado Esquerdo */}
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-lg">
                        <MapPinIcon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-gray-900 dark:text-white font-medium">
                          {event.address.street}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {event.address.postal_code} - {event.address.cities.name}/{event.address.states.uf}
                        </p>
                      </div>
                    </div>

                    {/* Lado Direito */}
                    <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-lg">
                      <button className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
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
                attendanceId={attendanceId}
                remainingVacancies={remainingVacancies}
                companyRemainingVacancies={companyRemainingVacancies}
                canRegister={canRegister}
              />
            </div>
          </div>

        </div>
      </div>

      {/* Seção Sobre o Evento e Palestrantes */}
      <div className="bg-gray-100 dark:bg-black/20 w-full py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Card Informações do Evento e Patrocinadores - 70% */}
            <div className="lg:col-span-8">
              <div className="space-y-6">

                {/* Card de Patrocinadores */}
                {event.sponsors && event.sponsors.length > 0 && (
                  <Card className="w-full border-0 shadow-sm bg-white dark:bg-gray-800/50">
                    <CardContent className="p-6">
                      {/* Header */}
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        Patrocinadores
                      </h2>

                      {/* Body - Grid de logos */}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {event.sponsors.map((sponsor) => (
                          <div key={sponsor.id} className="flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                            {sponsor.image_url ? (
                              <Image
                                src={sponsor.image_url}
                                alt={sponsor.name}
                                width={120}
                                height={60}
                                className="max-w-full max-h-12 object-contain"
                              />
                            ) : (
                              <div className="flex items-center justify-center w-full h-12 bg-gray-100 dark:bg-gray-600 rounded">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300 text-center px-2">
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

                {/* Card da Programação do Evento */}
                <Card className="w-full border-0 shadow-sm bg-white dark:bg-gray-800/50">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Programação
                  </h2>

                  {/* Card de Status do Evento - Transmissão/Início */}
                  <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
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

                      const eventoJaComecou = agora >= inicioEvento
                      const eventoJaTerminou = agora >= fimEvento

                      if (eventoJaTerminou) {
                        return (
                          <div className="flex items-center gap-4">
                            <div className="bg-gray-100 dark:bg-gray-600 p-3 rounded-full">
                              <CheckCircle className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Evento finalizado
                              </h3>
                              <p className="text-gray-600 dark:text-gray-400">
                                Este evento já foi realizado
                              </p>
                            </div>
                          </div>
                        )
                      }

                      if (eventoJaComecou) {
                        return (
                          <div className="flex items-center gap-4">
                            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full animate-pulse">
                              <PlayCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Evento em andamento
                              </h3>
                              <p className="text-gray-600 dark:text-gray-400">
                                {event.format?.toUpperCase() === "ONLINE" ? (
                                  "Este evento está acontecendo agora online"
                                ) : event.format?.toUpperCase() === "HIBRIDO" ? (
                                  "Este evento está acontecendo agora (presencial + online)"
                                ) : (
                                  "Este evento está acontecendo agora de forma presencial"
                                )}
                              </p>
                            </div>
                          </div>
                        )
                      }

                      const diffMs = inicioEvento.getTime() - agora.getTime()
                      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
                      const diffHours = Math.ceil(diffMs / (1000 * 60 * 60))
                      const diffMinutes = Math.ceil(diffMs / (1000 * 60))

                      let tempoRestante
                      if (diffDays > 1) {
                        tempoRestante = `${diffDays} dias`
                      } else if (diffHours > 1) {
                        tempoRestante = `${diffHours} horas`
                      } else {
                        tempoRestante = `${diffMinutes} minutos`
                      }

                      return (
                        <div className="flex items-center gap-4">
                          <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                            <CalendarClock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              Começamos em {tempoRestante}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                              {event.format?.toUpperCase() === "ONLINE" ? (
                                "Evento online"
                              ) : event.format?.toUpperCase() === "HIBRIDO" ? (
                                "Evento híbrido (presencial + online)"
                              ) : (
                                "Evento presencial"
                              )}
                            </p>
                          </div>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Programação do Evento */}
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5" />
                        Programação
                      </h3>
                    </div>

                    {event.schedule && event.schedule.length > 0 ? (
                      <div className="relative">
                        {/* Linha principal da timeline */}
                        <div className="absolute left-3 top-2 bottom-0 w-0.5 bg-gradient-to-b from-blue-300 via-blue-200 to-transparent dark:from-blue-400 dark:via-blue-500 dark:to-transparent"></div>

                        <div className="space-y-1">
                          {event.schedule.map((item, index) => (
                            <div key={item.id} className="relative flex items-start gap-4 group">
                              {/* Ponto da timeline */}
                              <div className="relative z-10 flex-shrink-0 mt-1">
                                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm border-2 border-white dark:border-gray-800">
                                  <ClockIcon className="w-3 h-3 text-white" />
                                </div>
                              </div>

                              {/* Conteúdo do item */}
                              <div className="flex-1 min-w-0 py-2 group-hover:bg-blue-50/50 dark:group-hover:bg-blue-900/20 rounded-md transition-colors duration-200 px-2 -mx-2">
                                {/* Horário e título na mesma linha */}
                                <div className="flex items-center gap-3 mb-1">
                                  <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium border-blue-200 dark:border-blue-700">
                                    {item.start_time.substring(0, 5)} - {item.end_time.substring(0, 5)}
                                  </Badge>
                                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                                    {item.title}
                                  </h4>
                                </div>

                                {/* Descrição */}
                                {item.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 ml-0 leading-relaxed">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-6 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                            <CalendarPlus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-blue-900 dark:text-blue-100 font-medium mb-1">
                              Programação em desenvolvimento
                            </p>
                            <p className="text-blue-700 dark:text-blue-300 text-sm">
                              Em breve divulgaremos todos os detalhes da programação deste evento
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Informações adicionais */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex flex-wrap gap-6">
                      {user && companyAttendees > 0 && (
                        <div className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {companyAttendees} {companyAttendees === 1 ? 'pessoa' : 'pessoas'} da sua empresa já se {companyAttendees === 1 ? 'inscreveu' : 'inscreveram'} para este evento
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Duração: {event.start_time} - {event.end_time}
                        </span>
                      </div>

                      {event.format === "HIBRIDO" && (
                        <div className="flex items-center gap-2">
                          <Wifi className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Evento híbrido (presencial + online)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                </Card>
              </div>
            </div>

            {/* Card Palestrantes - 30% */}
            <div className="lg:col-span-4">
              <Card className="w-full border-0 shadow-sm bg-white dark:bg-gray-800/50">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Palestrantes
                  </h2>

                  {event.speakers && event.speakers.length > 0 ? (
                    <div className="space-y-4">
                      {event.speakers.map((speaker) => (
                        <div key={speaker.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          {/* Foto do palestrante */}
                          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                            {speaker.users.image_url ? (
                              <Image
                                src={speaker.users.image_url}
                                alt={speaker.users.name || "Palestrante"}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                                <Users2Icon className="w-6 h-6 text-primary/60" />
                              </div>
                            )}
                          </div>

                          {/* Informações */}
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                              {speaker.users.name}
                            </h3>
                            {speaker.users.company?.name && (
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {speaker.users.company.name}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto w-fit mb-3">
                        <Users2Icon className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Palestrantes a confirmar
                      </p>
                    </div>
                  )}

                  {/* Biografia expandida (se houver) */}
                  {event.speakers && event.speakers.length === 1 && event.speakers[0].description && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                        {event.speakers[0].description}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Card de Apoio */}
              {event.supporters && event.supporters.length > 0 && (
                <Card className="w-full border-0 shadow-sm bg-white dark:bg-gray-800/50 mt-4">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      Apoio
                    </h2>

                    {/* Grid de logos dos apoiadores */}
                    <div className="grid grid-cols-2 gap-3">
                      {event.supporters.map((supporter) => (
                        <div key={supporter.id} className="flex items-center justify-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                          {supporter.image_url ? (
                            <Image
                              src={supporter.image_url}
                              alt={supporter.name}
                              width={80}
                              height={40}
                              className="max-w-full max-h-8 object-contain"
                            />
                          ) : (
                            <div className="flex items-center justify-center w-full h-8 bg-gray-100 dark:bg-gray-600 rounded">
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-300 text-center px-2">
                                {supporter.name}
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
          </div>
        </div>
      </div>


      {/* Seção de Próximos Eventos */}
      {upcomingEvents.length > 0 && (
        <div className="w-full py-8">
          <div className="container mx-auto px-4">
            <EventsSection
              events={upcomingEvents}
              title="Próximos eventos"
              eventsPorPagina={3}
            />
          </div>
        </div>
      )}
    </div>
  )
}