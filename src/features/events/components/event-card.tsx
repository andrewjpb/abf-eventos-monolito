// /features/events/components/event-card.tsx
"use client"

import { EventWithDetails } from "../types"
import { formatarDataEvento } from "../types"
import { CalendarIcon, MapPinIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { eventPath } from "@/app/paths"
import Image from "next/image"

interface EventCardProps {
  event: EventWithDetails
  variant?: "normal" | "compact"
}

export function EventCard({ event, variant = "normal" }: EventCardProps) {
  // Formatação da data para exibir "X dias" ou "1 dia"
  const calcularDias = () => {
    const dataEvento = new Date(event.date)
    const hoje = new Date()

    // Zerar as horas para comparar apenas as datas
    dataEvento.setHours(0, 0, 0, 0)
    hoje.setHours(0, 0, 0, 0)

    // Calcular a diferença em dias
    const diffTime = Math.abs(dataEvento.getTime() - hoje.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays === 1 ? "1 dia" : `${diffDays} dias`
  }

  // Formatar o período do evento (dias ou data completa)
  const formatarPeriodo = () => {
    const dataInicio = new Date(event.date)

    // Se é um evento de um dia, mostra apenas a data
    if (!event.end_time) {
      return formatarDataEvento(dataInicio)
    }

    // Tenta extrair dia, mês e ano do título ou descrição para eventos multi-dia
    const regexData = /(\d{1,2})\s+a\s+(\d{1,2})\s+de\s+(\w+)/i
    const match = event.title.match(regexData) || event.description.match(regexData)

    if (match) {
      return `${match[1]} a ${match[2]} de ${match[3]}`
    }

    return formatarDataEvento(dataInicio)
  }

  // Obter texto do formato com base no valor do banco
  const obterTextoFormato = () => {
    if (event.format === "in_person") return "PRESENCIAL"
    if (event.format === "online") return "ONLINE"
    if (event.format === "hybrid") return "HÍBRIDO"
    return event.format || "EVENTO"
  }

  // Altura adaptável com base no variant e tamanho da tela
  const imageHeight = variant === "compact"
    ? "h-42 sm:h-46 md:h-50 lg:h-54"
    : "h-54 sm:h-58 md:h-62 lg:h-66";
  return (
    <div className="flex flex-col overflow-hidden rounded-lg shadow-md border border-border bg-card h-full hover:shadow-lg transition-shadow">
      {/* Imagem do evento com badge de tipo */}
      <Link href={eventPath(event.id)} className="block">
        <div className={`relative ${imageHeight} bg-muted cursor-pointer hover:opacity-95 transition-opacity`}>
          {event.image_url ? (
            <Image
              src={event.image_url}
              alt={event.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Image
                src="/placeholder-image.svg"
                alt="Imagem não disponível"
                width={80}
                height={80}
                className="opacity-30 object-cover"
              />
            </div>
          )}

          {/* Badge Premium, Técnico, etc */}
          <div className="absolute right-2 sm:right-3 top-2 sm:top-3 pointer-events-none">
            <Badge variant="outline" className="bg-background/80 backdrop-blur-sm text-foreground py-0.5 px-2 sm:py-1 sm:px-4 rounded-full text-xs sm:text-sm">
              {obterTextoFormato()}
            </Badge>
          </div>
        </div>
      </Link>

      {/* Informações do evento */}
      <div className="flex flex-col p-3 sm:p-4 flex-grow">
        {/* Tipo de evento e duração */}
        <div className="flex gap-2 sm:gap-3 mb-2 flex-wrap">
          <Badge variant="outline" className="rounded-full bg-accent text-accent-foreground text-xs">
            {obterTextoFormato()}
          </Badge>

          <Badge variant="outline" className="rounded-full bg-accent text-accent-foreground text-xs">
            {calcularDias()}
          </Badge>

          {event.exclusive_for_members && (
            <Badge variant="outline" className="rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs">
              Exclusivo
            </Badge>
          )}
        </div>

        {/* Título */}
        <Link href={eventPath(event.id)}>
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-card-foreground mb-2 sm:mb-3 line-clamp-2">
            {event.title}
          </h3>
        </Link>

        {/* Data */}
        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2 mt-auto">
          <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
          <span className="truncate">{formatarPeriodo()}</span>
        </div>

        {/* Local */}
        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
          <MapPinIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
          <span className="truncate">
            {event.address?.cities?.name && event.address?.states?.uf
              ? `${event.address.cities.name} - ${event.address.states.uf}`
              : event.isStreaming
                ? "Evento Online"
                : "Local a definir"}
          </span>
        </div>

        {/* Patrocinadores */}
        <div className="mt-3 pt-3 border-t border-border">
          {event.sponsors && event.sponsors.length > 0 ? (
            <>
              <p className="text-xs text-muted-foreground mb-2">Patrocinadores:</p>
              <div className="flex flex-wrap gap-2">
                {event.sponsors.map((sponsor) => (
                  <div key={sponsor.id} className="h-8 px-2 bg-muted dark:bg-white rounded-md flex items-center justify-center">
                    {sponsor.image_url ? (
                      <Image
                        src={sponsor.image_url}
                        alt={sponsor.name}
                        width={60}
                        height={24}
                        className="max-w-full max-h-6 object-contain"
                      />
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground">
                        {sponsor.name}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-2">Seja um patrocinador:</p>
              <div className="flex justify-start">
                <a
                  href="https://wa.me/5511992256473?text=Olá! Gostaria de ser patrocinador de um evento da ABF"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 h-8 px-3 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-md transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                  Saiba mais
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}