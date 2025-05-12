// /features/events/components/featured-event.tsx
"use client"

import { EventWithDetails } from "../types"
import { formatarDataEvento } from "../types"
import { Clock, MapPin, Star, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { eventPath } from "@/app/paths"
import Image from "next/image"

interface FeaturedEventProps {
  event: EventWithDetails
}

export function FeaturedEvent({ event }: FeaturedEventProps) {
  // Formatar o horário do evento
  const formatarHorario = () => {
    if (event.start_time && event.end_time) {
      return `${event.start_time}h às ${event.end_time}h`
    }
    return ""
  }

  // Formatar o local
  const formatarLocal = () => {
    if (event.address?.cities?.name && event.address?.states?.uf) {
      return `${event.address.street || "Água Branca"} - ${event.address.cities.name} - ${event.address.states.uf}`
    }
    return event.isStreaming ? "Evento Online" : "Local a definir"
  }

  // Obter data do evento em formato de número
  const obterDia = () => {
    const data = new Date(event.date)
    return data.getDate()
  }

  // Obter mês do evento em formato de texto
  const obterMes = () => {
    const data = new Date(event.date)
    const meses = [
      "JAN", "FEV", "MAR", "ABR", "MAI", "JUN",
      "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"
    ]
    return meses[data.getMonth()]
  }

  // Verificar se existem palestrantes
  const temPalestrantes = event.speakers && event.speakers.length > 0

  // Verificar se existem patrocinadores
  const temPatrocinadores = event.sponsors && event.sponsors.length > 0

  // Obter texto do formato com base no valor do banco
  const obterTextoFormato = () => {
    if (event.format === "in_person") return "Presencial"
    if (event.format === "online") return "Online"
    if (event.format === "hybrid") return "Híbrido"
    return event.format || "Evento"
  }

  return (
    <div className="w-full max-w-5xl overflow-hidden rounded-lg shadow-md border border-border bg-card">
      {/* Container principal */}
      <div className="relative">
        {/* Imagem de fundo */}
        <div className="relative h-[180px] sm:h-[220px] md:h-[280px] lg:h-[240px] xl:h-[480px] bg-muted">
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
                width={120}
                height={120}
                className="opacity-30 object-cover"
              />
            </div>
          )}

          {/* Badge de Destaque */}
          <div className="absolute right-4 top-4">
            <Badge className="bg-background text-foreground py-1.5 px-4 rounded-full text-sm font-medium flex items-center gap-1">
              <Star className="h-4 w-4" />
              Destaque
            </Badge>
          </div>
        </div>

        {/* Conteúdo do card */}
        <div className="p-6">
          {/* Badges do tipo de evento */}
          <div className="flex gap-3 mb-4">
            <Badge variant="outline" className="rounded-full bg-accent text-accent-foreground">
              {obterTextoFormato()}
            </Badge>

            <Badge variant="outline" className="rounded-full bg-accent text-accent-foreground">
              {event.start_time && event.end_time && formatarHorario()}
            </Badge>
          </div>

          {/* Título do evento */}
          <h2 className="text-2xl font-bold text-card-foreground mb-3">
            {event.title}
          </h2>

          {/* Descrição ou resumo */}
          <p className="text-muted-foreground mb-6">
            {event.summary}
          </p>

          {/* Separador */}
          <div className="border-t border-border my-4"></div>

          {/* Informações do evento (data, hora, local) */}
          <div className="flex items-start gap-4">
            {/* Data do evento (bloco de data) */}
            <div className="flex-shrink-0 bg-primary text-primary-foreground text-center rounded-md overflow-hidden w-16">
              <div className="text-2xl font-bold py-1">
                {obterDia()}
              </div>
              <div className="bg-primary-foreground/10 text-xs py-1">
                {obterMes()}
              </div>
            </div>

            {/* Detalhes do evento */}
            <div className="flex flex-col lg:flex-row lg:justify-between w-full space-y-3 lg:space-y-0">
              <div className="flex flex-col items-start justify-center">
                {/* Horário */}
                <div className="flex items-center gap-2 text-card-foreground">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatarHorario()}</span>
                </div>

                {/* Local */}
                <div className="flex items-center gap-2 text-card-foreground">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{formatarLocal()}</span>
                </div>
              </div>

              {/* Palestrantess / Patrocinadores (se existirem) */}
              <div className="flex gap-6 mt-2 lg:mt-0">
                {temPalestrantes && (
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground mb-1">Palestrantes</span>

                    {/* Versão melhorada para exibição de palestrantes */}
                    <div className="flex items-center">
                      <div className="flex -space-x-2 mr-2">
                        {event.speakers?.slice(0, 3).map((speaker, index) => (
                          <div
                            key={index}
                            className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-background"
                            style={{ zIndex: 10 - index }}
                          >
                            {speaker.users?.image_url ? (
                              <Image
                                src={speaker.users.image_url}
                                alt={speaker.users.name || "Palestrante"}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                                <span className="text-xs font-medium text-primary">
                                  {speaker.users?.name?.charAt(0) || "?"}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Mostrar indicador de mais palestrantes caso existam */}
                        {(event.speakers?.length || 0) > 3 && (
                          <div className="relative w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center z-0">
                            <span className="text-xs text-muted-foreground font-medium">
                              +{(event.speakers?.length || 0) - 3}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="text-sm text-card-foreground">
                        {event.speakers?.length === 1 && (
                          <span>{event.speakers[0].users?.name || "Palestrante"}</span>
                        )}

                        {event.speakers?.length === 2 && (
                          <span>
                            {event.speakers[0].users?.name || "Palestrante"} e{" "}
                            {event.speakers[1].users?.name || "Palestrante"}
                          </span>
                        )}

                        {(event.speakers?.length || 0) > 2 && (
                          <span>
                            {event.speakers?.[0].users?.name || "Palestrante"} e outros
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {temPatrocinadores && (
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground mb-1">Patrocinadores</span>
                    <div className="flex items-center">
                      <div className="flex -space-x-1 mr-2">
                        {event.sponsors?.slice(0, 3).map((sponsor, index) => (
                          <div
                            key={index}
                            className="relative w-6 h-6 rounded-full overflow-hidden border border-background bg-card"
                            style={{ zIndex: 10 - index }}
                          >
                            {sponsor.image_url ? (
                              <Image
                                src={sponsor.image_url}
                                alt={sponsor.name}
                                fill
                                className="object-contain"
                              />
                            ) : (
                              <div className="w-full h-full bg-muted flex items-center justify-center">
                                <span className="text-[8px] font-medium text-muted-foreground">
                                  {sponsor.name?.charAt(0) || "?"}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <span className="text-sm text-card-foreground">{event.sponsors?.length} empresas</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Link para a página do evento (todo o card é clicável) */}
        <Link href={eventPath(event.id)} className="absolute inset-0">
          <span className="sr-only">Ver detalhes do evento {event.title}</span>
        </Link>
      </div>
    </div>
  )
}