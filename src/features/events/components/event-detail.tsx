// /features/events/components/event-detail.tsx
"use client"

import { EventWithDetails, formatarDataEvento, calcularDiasAteEvento } from "../types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
  Users2Icon,
  LinkIcon,
  ExternalLinkIcon
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
    <div className="bg-white p-6 rounded-lg shadow-md">
      {/* Cabeçalho com título e badges */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-2">
          <Badge variant="outline" className="bg-gray-100">
            {event.format}
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

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {event.title}
        </h1>
      </div>

      {/* Imagem do evento */}
      <div className="relative h-[400px] mb-8 rounded-lg overflow-hidden bg-gray-200">
        {event.image_url ? (
          <Image
            src={event.image_url}
            alt={event.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Image
              src="/placeholder-image.svg"
              alt="Imagem não disponível"
              width={150}
              height={150}
              className="opacity-30"
            />
          </div>
        )}
      </div>

      {/* Informações principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Coluna esquerda: data, hora, local */}
        <div className="space-y-6 md:col-span-2">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-5 w-5 text-primary" />
              <span className="text-lg">
                {formatarDataEvento(event.date)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <ClockIcon className="h-5 w-5 text-primary" />
              <span className="text-lg">
                {event.start_time} às {event.end_time}
              </span>
            </div>

            <div className="flex items-start gap-3">
              <MapPinIcon className="h-5 w-5 text-primary mt-1" />
              <span className="text-lg">
                {formatarEndereco()}
              </span>
            </div>

            {event.isStreaming && event.transmission_link && (
              <div className="flex items-center gap-3">
                <LinkIcon className="h-5 w-5 text-primary" />
                <a
                  href={event.transmission_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center"
                >
                  Link da transmissão
                  <ExternalLinkIcon className="h-4 w-4 ml-1" />
                </a>
              </div>
            )}

            {event.schedule_link && (
              <div className="flex items-center gap-3">
                <CalendarIcon className="h-5 w-5 text-primary" />
                <a
                  href={event.schedule_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center"
                >
                  Ver programação completa
                  <ExternalLinkIcon className="h-4 w-4 ml-1" />
                </a>
              </div>
            )}
          </div>

          {/* Descrição do evento */}
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-3">Sobre o evento</h3>
            <div className={`prose max-w-none ${!showFullDescription && 'line-clamp-4'}`}>
              <div dangerouslySetInnerHTML={{ __html: event.description }} />
            </div>

            {event.description.length > 300 && (
              <Button
                variant="link"
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="mt-2 p-0 h-auto"
              >
                {showFullDescription ? "Ver menos" : "Ver mais"}
              </Button>
            )}
          </div>
        </div>

        {/* Coluna direita: vagas e inscrição */}
        <div className="bg-gray-50 p-5 rounded-lg space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <UsersIcon className="h-5 w-5 mr-2" />
              Vagas disponíveis
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span>{remainingVacancies} de {event.vacancy_total} vagas</span>
                <span className="font-medium">
                  {occupationPercentage}%
                </span>
              </div>

              <Progress
                value={occupationPercentage}
                className="h-2"

              />
            </div>

            <div className="mt-2 text-sm text-gray-500">
              {event.vacancies_per_brand > 0 && (
                <p>Limite de {event.vacancies_per_brand} inscrições por empresa</p>
              )}
            </div>
          </div>

          {/* Ações: Inscrição / Status da inscrição */}
          <div className="pt-4 border-t border-gray-200">
            {eventoPassado ? (
              <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-700">
                Este evento já foi realizado.
              </div>
            ) : isRegistered ? (
              <div className="space-y-3">
                <div className="bg-green-50 rounded-lg p-4 flex items-center gap-2 text-green-800">
                  <CheckCircleIcon className="h-5 w-5" />
                  <span>Você está inscrito!</span>
                </div>

                {isAdmin && (
                  <Link href={`${pathname}/inscritos`}>
                    <Button variant="outline" className="w-full">
                      <Users2Icon className="h-4 w-4 mr-2" />
                      Ver lista de inscritos
                    </Button>
                  </Link>
                )}
              </div>
            ) : remainingVacancies <= 0 ? (
              <div className="bg-red-50 rounded-lg p-4 text-center text-red-800">
                Evento lotado. Não há mais vagas disponíveis.
              </div>
            ) : (
              <Button className="w-full" asChild>
                <Link href={`${pathname}/inscrever`}>
                  Inscreva-se
                </Link>
              </Button>
            )}
          </div>

          {/* Opções administrativas */}
          {isAdmin && !eventoPassado && (
            <div className="pt-4 border-t border-gray-200 space-y-2">
              <h4 className="text-sm font-medium mb-2">Opções Administrativas</h4>

              <Link href={`${pathname}/editar`} className="block">
                <Button variant="outline" size="sm" className="w-full">
                  Editar Evento
                </Button>
              </Link>

              <Link href={`${pathname}/inscritos`} className="block">
                <Button variant="outline" size="sm" className="w-full">
                  Gerenciar Inscrições
                </Button>
              </Link>

              {!event.isPublished && (
                <Button size="sm" className="w-full">
                  Publicar Evento
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Seção de palestrantes */}
      {event.speakers && event.speakers.length > 0 && (
        <div className="mt-8 border-t border-gray-200 pt-8">
          <h3 className="text-xl font-semibold mb-6">Palestrantes</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {event.speakers.map(speaker => (
              <div key={speaker.id} className="bg-gray-50 p-4 rounded-lg flex gap-4">
                <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                  {speaker.users.image_url ? (
                    <Image
                      src={speaker.users.image_url}
                      alt={speaker.users.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Users2Icon className="h-8 w-8" />
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold">{speaker.users.name}</h4>
                  {speaker.users.position && (
                    <p className="text-sm text-gray-600">{speaker.users.position}</p>
                  )}
                  {speaker.description && (
                    <p className="text-sm mt-1 line-clamp-2">{speaker.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Seção de patrocinadores */}
      {event.sponsors && event.sponsors.length > 0 && (
        <div className="mt-8 border-t border-gray-200 pt-8">
          <h3 className="text-xl font-semibold mb-6">Patrocinadores</h3>

          <div className="flex flex-wrap gap-6 justify-center">
            {event.sponsors.map(sponsor => (
              <div key={sponsor.id} className="text-center">
                <div className="relative w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center mb-2">
                  {sponsor.image_url ? (
                    <Image
                      src={sponsor.image_url}
                      alt={sponsor.name}
                      width={100}
                      height={100}
                      className="object-contain"
                    />
                  ) : (
                    <span className="text-gray-400 text-sm">{sponsor.name}</span>
                  )}
                </div>
                <span className="text-sm font-medium">{sponsor.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}