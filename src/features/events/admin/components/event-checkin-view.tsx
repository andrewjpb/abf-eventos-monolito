"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, UserCheck, Users, CheckCircle2, XCircle, Search, Filter, Download, ChevronLeft, ChevronRight } from "lucide-react"
import * as XLSX from 'xlsx'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { eventAdminPath } from "@/app/paths"
import { getEventAttendees } from "../queries/get-event-attendees"
import { EventCheckinItem } from "./event-checkin-item"
import { AdminEventWithDetails } from "../types"
import { PARTICIPANT_TYPE_OPTIONS, getParticipantTypeLabel } from "@/features/attendance-list/constants/participant-types"
import { AddAttendeeForm } from "./add-attendee-form"

type EventCheckinViewProps = {
  event: AdminEventWithDetails
}

export function EventCheckinView({ event }: EventCheckinViewProps) {
  const [attendees, setAttendees] = useState<any[]>([])
  const [filteredAttendees, setFilteredAttendees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [participantTypeFilter, setParticipantTypeFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20) // Mostrar 20 itens por página

  // Carregar participantes
  useEffect(() => {
    const loadAttendees = async () => {
      setLoading(true)
      try {
        const data = await getEventAttendees(event.id)
        setAttendees(data)
        setFilteredAttendees(data)
      } catch (error) {
        console.error('Erro ao carregar participantes:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAttendees()
  }, [event.id])

  // Debounce search term
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)

    return () => clearTimeout(timeout)
  }, [searchTerm])

  // Filtrar participantes
  useEffect(() => {
    let filtered = attendees

    // Filtro por termo de busca
    if (debouncedSearchTerm) {
      filtered = filtered.filter(attendee =>
        attendee.attendee_full_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        attendee.attendee_email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (attendee.company?.name && attendee.company.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
        (attendee.company?.cnpj && attendee.company.cnpj.includes(debouncedSearchTerm))
      )
    }

    // Filtro por status
    if (statusFilter !== "all") {
      filtered = filtered.filter(attendee => {
        if (statusFilter === "checked-in") return attendee.checked_in
        if (statusFilter === "not-checked-in") return !attendee.checked_in
        return true
      })
    }

    // Filtro por tipo de participante
    if (participantTypeFilter !== "all") {
      filtered = filtered.filter(attendee =>
        attendee.participant_type === participantTypeFilter
      )
    }

    setFilteredAttendees(filtered)
    setCurrentPage(1) // Reset para primeira página quando filtros mudam
  }, [attendees, debouncedSearchTerm, statusFilter, participantTypeFilter])

  // Calcular paginação
  const totalPages = Math.ceil(filteredAttendees.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentAttendees = filteredAttendees.slice(startIndex, endIndex)

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  }

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const checkedInCount = attendees.filter(a => a.checked_in).length
  const totalCount = attendees.length

  const exportToExcel = () => {
    const dataToExport = filteredAttendees.map(attendee => ({
      'Nome': attendee.attendee_full_name,
      'Email': attendee.attendee_email,
      'Telefone': attendee.mobile_phone || 'Não informado',
      'Cargo': attendee.attendee_position || 'Não informado',
      'Empresa': attendee.company?.name || 'Não informado',
      'CNPJ': attendee.company_cnpj || 'Não informado',
      'Segmento': attendee.company_segment || 'Não informado',
      'CPF': attendee.attendee_cpf || 'Não informado',
      'RG': attendee.attendee_rg || 'Não informado',
      'Tipo de Participante': getParticipantTypeLabel(attendee.participant_type),
      'Tipo de Inscrição': attendee.attendee_type === 'in_person' ? 'Presencial' : (attendee.attendee_type === 'online' ? 'Online' : attendee.attendee_type),
      'Check-in': attendee.checked_in ? 'Sim' : 'Não',
      'Data de Inscrição': new Date(attendee.created_at).toLocaleDateString('pt-BR'),
    }))

    const worksheet = XLSX.utils.json_to_sheet(dataToExport)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Participantes')

    // Ajustar largura das colunas
    const columnWidths = [
      { wch: 25 }, // Nome
      { wch: 30 }, // Email
      { wch: 15 }, // Telefone
      { wch: 20 }, // Cargo
      { wch: 30 }, // Empresa
      { wch: 18 }, // CNPJ
      { wch: 20 }, // Segmento
      { wch: 15 }, // CPF
      { wch: 15 }, // RG
      { wch: 18 }, // Tipo de Participante
      { wch: 15 }, // Tipo de Inscrição
      { wch: 10 }, // Check-in
      { wch: 15 }, // Data de Inscrição
    ]
    worksheet['!cols'] = columnWidths

    const fileName = `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}_participantes.xlsx`
    XLSX.writeFile(workbook, fileName)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando participantes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial="initial"
        animate="animate"
        variants={fadeIn}
        className="flex items-center gap-4"
      >
        <div className="flex justify-between w-full">

          <div className="flex-1">
            <h1 className="text-2xl font-bold">Check-in do Evento</h1>
            <p className="text-muted-foreground">{event.title}</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={eventAdminPath(event.id)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Evento
            </Link>
          </Button>
        </div>

      </motion.div>

      {/* Stats Cards */}
      <motion.div
        variants={stagger}
        initial="initial"
        animate="animate"
        className="grid gap-4 md:grid-cols-3"
      >
        <motion.div variants={fadeIn}>
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Inscritos</p>
                <p className="text-2xl font-bold">{totalCount}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={fadeIn}>
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-300" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Check-in Realizado</p>
                <p className="text-2xl font-bold text-green-600">{checkedInCount}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={fadeIn}>
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg dark:bg-orange-900">
                <XCircle className="h-5 w-5 text-orange-600 dark:text-orange-300" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendente</p>
                <p className="text-2xl font-bold text-orange-600">{totalCount - checkedInCount}</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeIn}>
        <Card className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email, empresa ou CNPJ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="checked-in">Check-in Realizado</SelectItem>
                  <SelectItem value="not-checked-in">Pendente</SelectItem>
                </SelectContent>
              </Select>

              <Select value={participantTypeFilter} onValueChange={setParticipantTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {PARTICIPANT_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                onClick={exportToExcel}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar Excel
              </Button>

              <AddAttendeeForm
                eventId={event.id}
                onSuccess={() => {
                  // Recarregar lista após adicionar participante
                  getEventAttendees(event.id).then((data) => {
                    setAttendees(data)
                  })
                }}
              />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Attendees List */}
      <motion.div variants={fadeIn}>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">
                Participantes ({filteredAttendees.length})
              </h2>
            </div>

            {/* Informação da paginação */}
            {totalPages > 1 && (
              <div className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </div>
            )}
          </div>

          {currentAttendees.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all" || participantTypeFilter !== "all"
                  ? "Nenhum participante encontrado com os filtros aplicados"
                  : "Nenhum participante inscrito neste evento"
                }
              </p>
            </div>
          ) : (
            <>
              <motion.div
                variants={stagger}
                className="space-y-3"
              >
                {currentAttendees.map((attendee) => (
                  <motion.div key={attendee.id} variants={fadeIn}>
                    <EventCheckinItem
                      attendee={attendee}
                      eventId={event.id}
                      onUpdate={() => {
                        // Recarregar lista após update
                        getEventAttendees(event.id).then((data) => {
                          setAttendees(data)
                        })
                      }}
                    />
                  </motion.div>
                ))}
              </motion.div>

              {/* Controles de Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-6 border-t">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {startIndex + 1} até {Math.min(endIndex, filteredAttendees.length)} de {filteredAttendees.length} participantes
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNumber
                        if (totalPages <= 5) {
                          pageNumber = i + 1
                        } else if (currentPage <= 3) {
                          pageNumber = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNumber = totalPages - 4 + i
                        } else {
                          pageNumber = currentPage - 2 + i
                        }

                        return (
                          <Button
                            key={pageNumber}
                            variant={currentPage === pageNumber ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNumber)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNumber}
                          </Button>
                        )
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Próxima
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </motion.div>
    </div>
  )
}