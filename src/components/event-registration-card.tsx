"use client"

import { useState, useTransition, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, CheckCircle, AlertCircle, Calendar, X } from "lucide-react"
import { canUserRegister } from "@/features/attendance-list/actions/can-user-register"
import { registerAttendee } from "@/features/attendance-list/actions/register-attendee"
import { cancelRegistration } from "@/features/attendance-list/actions/cancel-registration"
import { toast } from "sonner"
import { EventWithDetails } from "@/features/events/types"
import Image from "next/image"
import { EMPTY_ACTION_STATE } from "./form/utils/to-action-state"

interface EventRegistrationCardProps {
  event: EventWithDetails
  user?: any
  isRegistered?: boolean
  attendanceId?: string | null
  remainingVacancies: number
  companyRemainingVacancies?: number
  canRegister?: { canRegister: boolean; reason?: string } | null
}

export function EventRegistrationCard({
  event,
  user,
  isRegistered = false,
  attendanceId,
  remainingVacancies,
  companyRemainingVacancies,
  canRegister = null
}: EventRegistrationCardProps) {
  const [isPending, startTransition] = useTransition()
  const [isCanceling, setIsCanceling] = useState(false)
  const [registrationStatus, setRegistrationStatus] = useState<{ canRegister: boolean; reason?: string } | null>(canRegister)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleRegister = () => {
    if (!user) {
      if (typeof window !== 'undefined') {
        toast.error("Você precisa estar logado para se inscrever")
      }
      return
    }

    startTransition(async () => {
      try {
        // Verificar se pode se inscrever antes de tentar
        if (!registrationStatus) {
          const result = await canUserRegister(event.id)
          const canRegisterResult = {
            canRegister: result.canRegister,
            reason: result.message
          }
          setRegistrationStatus(canRegisterResult)

          if (!canRegisterResult.canRegister) {
            if (typeof window !== 'undefined') {
              toast.error(canRegisterResult.reason || "Não é possível se inscrever neste evento")
            }
            return
          }
        }

        // Remover formatação do CPF (manter CNPJ com formatação)
        const cleanCPF = user.cpf ? user.cpf.replace(/[.-]/g, '') : ''
        const companyCNPJ = user.companyId || ''

        // Buscar o segmento da empresa
        const companySegment = user.company?.segment || "Não informado"

        const formData = new FormData()
        formData.append("eventId", event.id)
        formData.append("userId", user.id)
        formData.append("company_cnpj", companyCNPJ)
        formData.append("company_segment", companySegment)
        formData.append("attendee_full_name", user.username || "")
        formData.append("attendee_email", user.email || "")
        formData.append("attendee_position", user.position || "")
        formData.append("attendee_rg", user.rg || "")
        formData.append("attendee_cpf", cleanCPF)
        formData.append("mobile_phone", user.mobilePhone || "")
        formData.append("attendee_type", "REGISTERED")

        const result = await registerAttendee(EMPTY_ACTION_STATE, formData)

        if (result.status === "SUCCESS") {
          if (typeof window !== 'undefined') {
            toast.success("Presença confirmada com sucesso!")
            // Recarregar a página para atualizar o status
            window.location.reload()
          }
        } else {
          if (typeof window !== 'undefined') {
            toast.error(result.message || "Erro ao confirmar presença")
          }
        }
      } catch (error) {
        if (typeof window !== 'undefined') {
          toast.error("Erro interno do servidor")
        }
      }
    })
  }

  const handleCancel = () => {
    if (!attendanceId) {
      if (typeof window !== 'undefined') {
        toast.error("ID da inscrição não encontrado")
      }
      return
    }

    setIsCanceling(true)
    
    startTransition(async () => {
      try {
        const result = await cancelRegistration(attendanceId)

        if (result.status === "SUCCESS") {
          if (typeof window !== 'undefined') {
            toast.success(result.message || "Inscrição cancelada com sucesso!")
            // Recarregar a página para atualizar o status
            window.location.reload()
          }
        } else {
          if (typeof window !== 'undefined') {
            toast.error(result.message || "Erro ao cancelar inscrição")
          }
        }
      } catch (error) {
        if (typeof window !== 'undefined') {
          toast.error("Erro interno do servidor")
        }
      } finally {
        setIsCanceling(false)
      }
    })
  }

  // Evitar renderização no servidor
  if (!mounted) {
    return (
      <Card className="w-full border-0 shadow-sm dark:bg-gray-800 dark:border dark:border-gray-700">
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
            <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Se o usuário não está logado
  if (!user) {
    return (
      <Card className="w-full border-0 shadow-sm dark:bg-gray-800 dark:border dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-full">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                Confirme sua presença
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Faça login para participar
              </p>
            </div>
          </div>
          <Button
            className="w-full mt-3 h-9 text-sm"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/sign-in'
              }
            }}
          >
            Fazer Login
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Se já está registrado
  if (isRegistered) {
    return (
      <Card className="w-full border-0 shadow-sm bg-green-50 dark:bg-green-900/20 dark:border dark:border-green-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {/* Foto do usuário */}
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
              {user?.picture ? (
                <Image
                  src={user.picture}
                  alt={user.username || "Usuário"}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
                  <span className="text-green-700 dark:text-green-300 font-semibold text-sm">
                    {user?.username?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
              )}
            </div>

            {/* Nome e empresa */}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight">
                {user?.username || "Usuário"}
              </h3>
              {user?.company && (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {user.company.name}
                </p>
              )}
            </div>

            {/* Status */}
            <Badge variant="secondary" className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs">
              <CheckCircle className="w-3 h-3 mr-1" />
              Inscrito
            </Badge>
          </div>

          <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Sua presença já está confirmada
              </p>
              {mounted && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isCanceling || isPending}
                  className="h-7 text-xs border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 hover:border-red-300"
                >
                  {isCanceling ? (
                    <>
                      <div className="w-3 h-3 border-2 border-red-700 border-t-transparent rounded-full animate-spin mr-1" />
                      Cancelando...
                    </>
                  ) : (
                    <>
                      <X className="w-3 h-3 mr-1" />
                      Cancelar
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Se não pode se inscrever
  if (registrationStatus && !registrationStatus.canRegister) {
    return (
      <Card className="w-full border-0 shadow-sm bg-red-50 dark:bg-red-900/20 dark:border dark:border-red-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                Inscrições indisponíveis
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                {registrationStatus.reason || "Não é possível se inscrever"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Pode se inscrever
  const displayVacancies = companyRemainingVacancies !== undefined ? companyRemainingVacancies : remainingVacancies

  return (
    <Card className="w-full border-0 shadow-sm dark:bg-gray-800 dark:border dark:border-gray-700">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header com foto e informações do usuário */}
          <div className="flex items-center gap-3">
            {/* Foto do usuário */}
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
              {user?.picture ? (
                <Image
                  src={user.picture}
                  alt={user.username || "Usuário"}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                  <span className="text-blue-700 dark:text-blue-300 font-semibold text-sm">
                    {user?.username?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
              )}
            </div>

            {/* Nome e empresa */}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight">
                {user?.username || "Usuário"}
              </h3>
              {user?.company && (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {user.company.name}
                </p>
              )}
            </div>

            {/* Badge de vagas */}
            <div className="text-right">
              <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs">
                {displayVacancies} {displayVacancies === 1 ? 'vaga' : 'vagas'}
              </Badge>
            </div>
          </div>

          {/* Botão de confirmação */}
          <Button
            className="w-full h-9 text-sm"
            onClick={handleRegister}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Confirmando...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4 mr-2" />
                Confirmar Presença
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}