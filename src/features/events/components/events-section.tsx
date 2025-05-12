// /features/events/components/events-section.tsx
"use client"

import { useState, useRef, useEffect } from "react"
import { EventWithDetails } from "../types"
import { EventCard } from "./event-card"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EventsSectionProps {
  events: EventWithDetails[]
  title?: string
  eventsPorPagina?: number
}

export function EventsSection({
  events,
  title = "Próximos Eventos",
  eventsPorPagina = 3
}: EventsSectionProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const [maxPages, setMaxPages] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(eventsPorPagina)

  // Verificar se recebemos uma lista vazia ou não inicializada
  const temEventos = Array.isArray(events) && events.length > 0

  // Ajustar eventos por página com base no tamanho da tela
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      if (width < 640) { // Mobile
        setItemsPerPage(1)
      } else if (width < 768) { // Small tablet
        setItemsPerPage(2)
      } else if (width < 1024) { // Tablet
        setItemsPerPage(2)
      } else if (width < 1280) { // Small desktop
        setItemsPerPage(3)
      } else { // Large desktop
        setItemsPerPage(3)
      }
    }

    // Inicializar
    handleResize()

    // Adicionar listener para redimensionamento
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Calcular o número máximo de páginas com base nos eventos disponíveis
  useEffect(() => {
    if (temEventos) {
      setMaxPages(Math.ceil(events.length / itemsPerPage))
    }
  }, [events, itemsPerPage, temEventos])

  // Eventos da página atual
  const currentEvents = temEventos
    ? events.slice(
      currentPage * itemsPerPage,
      (currentPage + 1) * itemsPerPage
    )
    : []

  // Navegar para a página anterior
  const goToPrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1)
    }
  }

  // Navegar para a próxima página
  const goToNextPage = () => {
    if (currentPage < maxPages - 1) {
      setCurrentPage(prev => prev + 1)
    }
  }

  return (
    <div className="py-4 sm:py-6 md:py-8" ref={containerRef}>
      {/* Cabeçalho com título e controles de navegação */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">{title}</h2>

        {temEventos && maxPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrevPage}
              disabled={currentPage === 0}
              className="h-7 w-7 sm:h-8 sm:w-8 rounded-full"
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={goToNextPage}
              disabled={currentPage >= maxPages - 1}
              className="h-7 w-7 sm:h-8 sm:w-8 rounded-full"
              aria-label="Próxima página"
            >
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Conteúdo: Grid de eventos ou mensagem "Nenhum evento" */}
      {temEventos ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          {currentEvents.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 sm:py-16 text-gray-500">
          Nenhum evento disponível no momento.
        </div>
      )}
    </div>
  )
}