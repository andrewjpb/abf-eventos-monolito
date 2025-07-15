"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, UserCheck, Users, CheckCircle2, XCircle, Search, Filter } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { eventAdminPath } from "@/app/paths"
import { getEventAttendees } from "../queries/get-event-attendees"
import { EventCheckinItem } from "./event-checkin-item"
import { AdminEventWithDetails } from "../types"
import { PARTICIPANT_TYPE_OPTIONS } from "@/features/attendance-list/constants/participant-types"

type EventCheckinViewProps = {
  event: AdminEventWithDetails
}

export function EventCheckinView({ event }: EventCheckinViewProps) {
  const [attendees, setAttendees] = useState<any[]>([])
  const [filteredAttendees, setFilteredAttendees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [participantTypeFilter, setParticipantTypeFilter] = useState("all")

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

  // Filtrar participantes
  useEffect(() => {
    let filtered = attendees

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(attendee =>
        attendee.attendee_full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attendee.attendee_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (attendee.company?.name && attendee.company.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (attendee.company?.cnpj && attendee.company.cnpj.includes(searchTerm))
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
  }, [attendees, searchTerm, statusFilter, participantTypeFilter])

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
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email, empresa ou CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="checked-in">Check-in Realizado</SelectItem>
                  <SelectItem value="not-checked-in">Pendente</SelectItem>
                </SelectContent>
              </Select>

              <Select value={participantTypeFilter} onValueChange={setParticipantTypeFilter}>
                <SelectTrigger className="w-full sm:w-48">
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
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Attendees List */}
      <motion.div variants={fadeIn}>
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <UserCheck className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">
              Participantes ({filteredAttendees.length})
            </h2>
          </div>

          {filteredAttendees.length === 0 ? (
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
            <motion.div
              variants={stagger}
              className="space-y-3"
            >
              {filteredAttendees.map((attendee) => (
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
          )}
        </Card>
      </motion.div>
    </div>
  )
}