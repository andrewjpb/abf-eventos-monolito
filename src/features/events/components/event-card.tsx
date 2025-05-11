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

  // Determinar o formato do evento (Conferência, Visita, Encontro, etc.)
  const obterFormato = () => {
    return event.format || "Evento"
  }

  // Obter texto do formato com base no valor do banco
  const obterTextoFormato = () => {
    if (event.format === "in_person") return "Presencial"
    if (event.format === "online") return "Online"
    if (event.format === "hybrid") return "Híbrido"
    return event.format || "Evento"
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-lg shadow-md border border-border bg-card">
      {/* Imagem do evento com badge de tipo */}
      <div className="relative h-58 bg-muted">
        {event.image_url ? (
          <Image
            src={event.image_url}
            alt={event.title}
            fill
            className="object-fill"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Image
              src="/placeholder-image.svg"
              alt="Imagem não disponível"
              width={80}
              height={80}
              className="opacity-30"
            />
          </div>
        )}

        {/* Badge Premium, Técnico, etc */}
        <div className="absolute right-3 top-3">
          <Badge variant="outline" className="bg-background text-foreground py-1 px-4 rounded-full">
            {obterTextoFormato()}
          </Badge>
        </div>
      </div>

      {/* Informações do evento */}
      <div className="flex flex-col p-4">
        {/* Tipo de evento e duração */}
        <div className="flex gap-3 mb-2">
          <Badge variant="outline" className="rounded-full bg-accent text-accent-foreground">
            {obterFormato()}
          </Badge>

          <Badge variant="outline" className="rounded-full bg-accent text-accent-foreground">
            {calcularDias()}
          </Badge>
        </div>

        {/* Título */}
        <Link href={eventPath(event.id)}>
          <h3 className="text-xl font-bold text-card-foreground mb-3">
            {event.title}
          </h3>
        </Link>

        {/* Data */}
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <CalendarIcon className="h-4 w-4" />
          <span>{formatarPeriodo()}</span>
        </div>

        {/* Local */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPinIcon className="h-4 w-4" />
          <span>
            {event.address?.cities?.name && event.address?.states?.uf
              ? `${event.address.cities.name} - ${event.address.states.uf}`
              : event.isStreaming
                ? "Evento Online"
                : "Local a definir"}
          </span>
        </div>
      </div>
    </div>
  )
}